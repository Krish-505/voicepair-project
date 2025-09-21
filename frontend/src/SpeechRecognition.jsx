import React, { useState, useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaCopy, FaCheck } from 'react-icons/fa';

// The Web Speech API is prefixed in some browsers
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
}

const SpeechRecognitionComponent = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  // States for handling the summary
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // States for Code Suggestion
  const [codeSnippet, setCodeSnippet] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState(null);
  
  const [isCopied, setIsCopied] = useState(false);

  const recognitionRef = useRef(recognition);

  useEffect(() => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    const rec = recognitionRef.current;
    rec.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(prev => prev + finalTranscript);
    };
    rec.onerror = (event) => setError(`Speech recognition error: ${event.error}`);
    return () => rec.stop();
  }, []);

  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setSummary('');
      setError(null);
      setSummaryError(null);
      setSuggestion('');
      setExplanation('');
      setSuggestionError(null);
      setCodeSnippet('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSummarize = async () => {
    if (!transcript) {
      setSummaryError("There is no transcript to summarize.");
      return;
    }
    setIsLoading(true);
    setSummaryError(null);
    setSummary('');
    try {
      const response = await fetch('http://localhost:5000/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to get summary.');
      }
      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setSummaryError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSuggestion = async () => {
    if (!transcript) {
      setSuggestionError("Please provide a transcript by speaking first.");
      return;
    }
    setIsSuggesting(true);
    setSuggestionError(null);
    setSuggestion('');
    setExplanation('');
    try {
      const response = await fetch('http://localhost:5000/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript, code_snippet: codeSnippet }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to get suggestion.');
      }
      const data = await response.json();
      setSuggestion(data.suggestion);
      setExplanation(data.explanation);
    } catch (err) {
      setSuggestionError(err.message);
    } finally {
      setIsSuggesting(false);
    }
  };
  
  const handleCopyCode = () => {
    if (suggestion) {
      navigator.clipboard.writeText(suggestion);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-md text-white">
      <h2 className="text-2xl font-bold mb-4">Live Transcription & AI Assistance</h2>
      
      <div className="flex space-x-4 mb-4">
        <button 
          onClick={handleToggleListening} 
          className={`px-4 py-2 font-semibold rounded-lg shadow-md focus:outline-none w-1/2 ${isListening ? 'bg-red-500 hover:bg-red-700' : 'bg-green-500 hover:bg-green-700'}`}
        >
          {isListening ? 'Stop Listening' : 'Start New Session'}
        </button>
        <button
          onClick={handleSummarize}
          disabled={isListening || !transcript || isLoading}
          className="px-4 py-2 font-semibold rounded-lg shadow-md focus:outline-none w-1/2 bg-cyan-500 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Summarizing...' : 'Summarize Transcript'}
        </button>
      </div>
      
      {error && <p className="text-red-400 mb-4 text-center">Recognition Error: {error}</p>}
      
      <div className="p-4 bg-gray-900 rounded-lg min-h-[150px] whitespace-pre-wrap">
        <h3 className="font-semibold text-gray-400 mb-2">Transcript</h3>
        <p>{transcript || "..."}</p>
      </div>
      <div className="mt-4 p-4 bg-gray-900 rounded-lg min-h-[100px]">
        <h3 className="font-semibold text-gray-400 mb-2">Summary</h3>
        {summaryError && <p className="text-red-400">{summaryError}</p>}
        {summary && <p>{summary}</p>}
        {!isLoading && !summaryError && !summary && <p>Summary will appear here.</p>}
      </div>

      <div className="mt-6 border-t border-gray-700 pt-6">
        <h3 className="font-semibold text-gray-400 mb-2">Get a Code Suggestion</h3>
        <p className="text-sm text-gray-500 mb-3">Describe your problem while listening, then paste your code and ask for a suggestion.</p>
        <textarea
          value={codeSnippet}
          onChange={(e) => setCodeSnippet(e.target.value)}
          className="w-full h-40 p-2 bg-gray-900 rounded-lg font-mono text-sm border border-gray-700 focus:ring-2 focus:ring-purple-500"
          placeholder="Paste your relevant code snippet here (optional)..."
        />
        <button
          onClick={handleGetSuggestion}
          disabled={isListening || !transcript || isSuggesting}
          className="mt-4 w-full px-4 py-2 font-semibold rounded-lg shadow-md focus:outline-none bg-purple-600 hover:bg-purple-800 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isSuggesting ? 'Thinking...' : 'Get Code Suggestion'}
        </button>
      </div>
      
      <div className="mt-4 p-4 bg-gray-900 rounded-lg min-h-[100px]">
        <h3 className="font-semibold text-gray-400 mb-2">AI Suggestion</h3>
        {suggestionError && <p className="text-red-400">{suggestionError}</p>}
        {explanation && <p className="whitespace-pre-wrap mb-4">{explanation}</p>}
        
        {suggestion && (
          <div className="relative group">
            <button 
              onClick={handleCopyCode}
              className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded-md text-gray-300 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Copy code"
            >
              {isCopied ? <FaCheck className="text-green-400" /> : <FaCopy />}
            </button>
            <SyntaxHighlighter language="python" style={vscDarkPlus} customStyle={{ margin: 0, borderRadius: '0.375rem' }}>
              {suggestion}
            </SyntaxHighlighter>
          </div>
        )}

        {!isSuggesting && !suggestionError && !suggestion && <p>Code suggestion and explanation will appear here.</p>}
      </div>
    </div>
  );
};

export default SpeechRecognitionComponent;