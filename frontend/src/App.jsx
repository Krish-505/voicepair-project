import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  const [backendMessage, setBackendMessage] = useState('Loading backend status...');
  const [aiResponse, setAiResponse] = useState('Click "Summarize" to get AI response.');
  const [inputText, setInputText] = useState('The quick brown fox jumps over the lazy dog. This is a sample text for summarization.');
  const [count, setCount] = useState(0);

  const backendUrl = 'http://localhost:5000'; // Our backend URL

  useEffect(() => {
    // Fetch backend root status
    const fetchBackendStatus = async () => {
      try {
        const response = await fetch(`${backendUrl}/`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        setBackendMessage(data);
      } catch (error) {
        console.error("Error fetching backend status:", error);
        setBackendMessage('Failed to connect to backend.');
      }
    };

    fetchBackendStatus();
  }, []);

  const handleSummarize = async () => {
    setAiResponse('Summarizing...');
    try {
      const response = await fetch(`${backendUrl}/api/ai/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, Details: ${errorData.details || errorData.error}`);
      }

      const data = await response.json();
      setAiResponse(JSON.stringify(data, null, 2)); // Pretty print JSON response
    } catch (error) {
      console.error("Error calling AI service via backend:", error);
      setAiResponse(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React + VoicePair Integration</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>

      <hr />

      <h2>Backend Connection Status:</h2>
      <p>{backendMessage}</p>

      <hr />

      <h2>AI Service Integration Test:</h2>
      <textarea
        rows="5"
        cols="50"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        style={{ width: '100%', marginBottom: '10px' }}
        placeholder="Enter text to summarize..."
      />
      <button onClick={handleSummarize}>Summarize Text (via Backend)</button>
      <pre style={{ backgroundColor: '#eee', padding: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap' }}>
        {aiResponse}
      </pre>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;