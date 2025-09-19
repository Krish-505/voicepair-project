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

// New route to interact with the AI service
app.post('/api/ai/summarize', async (req, res) => {
    const { text } = req.body; // Expecting { text: "some text to summarize" } from frontend

    if (!text) {
        return res.status(400).json({ error: 'Text content is required for summarization.' });
    }

    try {
        console.log(`Forwarding text to AI service: ${text.substring(0, 50)}...`);
         const aiResponse = await fetch(`${aiServiceUrl}/summarize/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }), // Send the text to the AI service
        });

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            throw new Error(`AI Service error! Status: ${aiResponse.status}, Message: ${errorText}`);
        }

        const aiData = await aiResponse.json(); // Get JSON response from AI service
        console.log("Received response from AI service:", aiData);
        res.json(aiData); // Send AI service's response back to frontend

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