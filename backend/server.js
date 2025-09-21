require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001'; // AI service URL

// Middleware
app.use(cors());
app.use(express.json());

// Basic "Hello World" route
app.get('/', (req, res) => {
    res.send('VoicePair Backend API is running!');
});

// Route to interact with the AI service for summarization
app.post('/api/ai/summarize', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text content is required for summarization.' });
    }

    try {
        console.log(`Forwarding text to AI service for summarization...`);
         const aiResponse = await fetch(`${aiServiceUrl}/summarize/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            throw new Error(`AI Service error! Status: ${aiResponse.status}, Message: ${errorText}`);
        }

        const aiData = await aiResponse.json();
        console.log("Received response from AI service:", aiData);
        res.json(aiData);

    } catch (error) {
        console.error('Error communicating with AI service:', error);
        res.status(500).json({ error: 'Failed to communicate with AI service.', details: error.message });
    }
});

// --- NEW ROUTE for Code Suggestions ---
app.post('/api/ai/suggest', async (req, res) => {
    // The frontend will send { text, code_snippet }
    const { text, code_snippet } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text content is required for suggestion.' });
    }

    try {
        console.log(`Forwarding request to AI service for code suggestion...`);
        const aiResponse = await fetch(`${aiServiceUrl}/suggest/`, { // Using the new '/suggest/' path
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Forward the entire payload from the frontend
            body: JSON.stringify({ text, code_snippet }),
        });

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            throw new Error(`AI Service error! Status: ${aiResponse.status}, Message: ${errorText}`);
        }

        const aiData = await aiResponse.json();
        console.log("Received suggestion from AI service:", aiData);
        res.json(aiData); // Send AI service's response back to the frontend

    } catch (error) {
        console.error('Error communicating with AI service:', error);
        res.status(500).json({ error: 'Failed to communicate with AI service.', details: error.message });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
    console.log(`AI Service URL set to: ${aiServiceUrl}`);
});