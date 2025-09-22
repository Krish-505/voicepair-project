import React, { useState, useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaCopy, FaCheck } from 'react-icons/fa';

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
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const recognitionRef = useRef(recognition);

  useEffect(() => {
    if (!recognitionRef.current) {
      setError("Speech recognition not supported in this browser.");
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

  const callApi = async (action, body) => {
    const response = await fetch(`http://localhost:5000/api/ai/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || `Failed to ${action}`);
    }
    return response.json();
  };
  
  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript(''); setSummary(''); setError(null);
      setSuggestion(''); setExplanation(''); setCodeSnippet('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSummarize = async () => {
    if (!transcript) return;
    setIsLoading(true);
    try {
      const data = await callApi('summarize', { text: transcript });
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      setSummary(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSuggestion = async () => {
    if (!transcript) return;
    setIsSuggesting(true);
    try {
      const data = await callApi('suggest', { text: transcript, code_snippet: codeSnippet });
      setSuggestion(data.suggestion);
      setExplanation(data.explanation);
    } catch (err) {
      console.error(err);
      setExplanation(`Error: ${err.message}`);
    } finally {
      setIsSuggesting(false);
    }
  };
  
  const handleCopyCode = () => {
    if (suggestion) {
      navigator.clipboard.writeText(suggestion);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>VoicePair</h1>
        <p>Your Real-Time AI Pair Programming Assistant</p>
      </header>
      
      {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
      
      <div className="controls">
        <div className="button-group">
          <button onClick={handleToggleListening} className={isListening ? 'btn-stop' : 'btn-start'}>
            {isListening ? 'Stop Listening' : 'Start Session'}
          </button>
          <button onClick={handleSummarize} disabled={isListening || !transcript || isLoading} className="btn-summarize">
            {isLoading ? 'Summarizing...' : 'Summarize Transcript'}
          </button>
        </div>
      </div>
      
      <div className="panel">
        <h3>Transcript</h3>
        <p>{transcript || "..."}</p>
      </div>
      
      <div className="panel">
        <h3>Summary</h3>
        <p>{summary || "Summary will appear here."}</p>
      </div>

      <div className="suggestion-input panel">
        <h3>Get a Code Suggestion</h3>
        <p>Describe your problem while listening, then paste your code and ask for a suggestion.</p>
        <textarea value={codeSnippet} onChange={(e) => setCodeSnippet(e.target.value)} placeholder="Paste relevant code here..."/>
        <button onClick={handleGetSuggestion} disabled={isListening || !transcript || isSuggesting} className="btn-suggest">
          {isSuggesting ? 'Thinking...' : 'Get Suggestion'}
        </button>
      </div>
      
      <div className="panel">
        <h3>AI Suggestion</h3>
        {explanation && <p>{explanation}</p>}
        {suggestion && (
          <div className="suggestion-display">
            <button onClick={handleCopyCode} className="copy-btn">
              {isCopied ? <FaCheck style={{ color: 'lightgreen' }} /> : <FaCopy />}
            </button>
            <SyntaxHighlighter language="python" style={vscDarkPlus} customStyle={{ margin: 0, borderRadius: '8px' }}>
              {suggestion}
            </SyntaxHighlighter>
          </div>
        )}
        {!isSuggesting && !suggestion && <p>Code suggestion will appear here.</p>}
      </div>
    </div>
  );
};

export default SpeechRecognitionComponent;