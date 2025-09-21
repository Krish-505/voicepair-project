import React from 'react';
import SpeechRecognitionComponent from './SpeechRecognition'; // Import our new component

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-8">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold text-cyan-400">VoicePair</h1>
        <p className="text-xl text-gray-400 mt-2">Your Real-Time AI Pair Programming Assistant</p>
      </header>

      <main className="space-y-12">
        {/* Our new Speech-to-Text Component */}
        <SpeechRecognitionComponent />
      </main>
    </div>
  );
}

export default App;