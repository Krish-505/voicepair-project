require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors'); // Import the cors package

const app = express();
const port = process.env.PORT || 5000; // Use port from environment variable or default to 5000

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable parsing of JSON request bodies

// Basic "Hello World" route
app.get('/', (req, res) => {
    res.send('VoicePair Backend API is running!');
});

// Start the server
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});