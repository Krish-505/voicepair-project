require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const fetch = require('node-fetch'); // This line has been removed

const app = express();
const port = process.env.PORT || 5000;
const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';

app.use(cors());
app.use(express.json());

app.post('/api/ai/:action', async (req, res) => {
    const { action } = req.params;
    try {
        const aiResponse = await fetch(`${aiServiceUrl}/${action}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });
        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            throw new Error(`AI Service returned an error: ${errorText}`);
        }
        const aiData = await aiResponse.json();
        res.json(aiData);
    } catch (error) {
        console.error('Error communicating with AI service:', error);
        res.status(500).json({ 
            error: 'Failed to communicate with AI service.', 
            details: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});