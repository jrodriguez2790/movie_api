const express = require('express');
const morgan = require('morgan');
const app = express();

// Morgan middleware
app.use(morgan('dev'));

// Serve static files from the public folder
app.use(express.static('public'));

// Movies data
const movies = [
    'Halloween',
    'House',
    'Aliens',
    'The Texas Chain Saw Massacre',
    'Barbarian',
    'It Follows',
    'Hereditary',
    'Green Room',
    'Silence of the Lambs',
    'Pet Sematary'
];

// GET route for movies
app.get('/movies', (req, res) => {
    res.json({ topMovies: movies });
});

// Default GET route
app.get('/', (req, res) => {
    res.send('Welcome to my movie database!');
});

// Error-handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
