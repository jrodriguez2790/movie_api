const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Models = require('./models.js');
const app = express();

mongoose.connect('mongodb://localhost:27017/movieDB', { useNewUrlParser: true, useUnifiedTopology: true });

const Movies = Models.Movie;
const Users = Models.User;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the public folder
app.use(express.static('public'));

// Movies endpoints
app.get('/movies', (req, res) => {
  Movies.find()
    .then(movies => res.json(movies))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.get('/movies/:id', (req, res) => {
  Movies.findById(req.params.id)
    .then(movie => res.json(movie))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.post('/movies', (req, res) => {
  Movies.create(req.body)
    .then(movie => res.status(201).json(movie))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.put('/movies/:id', (req, res) => {
  Movies.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
    .then(updatedMovie => res.json(updatedMovie))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.delete('/movies/:id', (req, res) => {
    console.log('DELETE request received for ID:', req.params.id);
    Movies.findByIdAndDelete(req.params.id)
    .then((movie) => {
      if (!movie) {
        console.log('Movie not found');
        return res.status(404).send('Movie not found');
      }
      console.log('Movie was deleted:', movie);
      res.status(200).send('Movie was deleted.');
    })
    .catch((err) => {
        console.error('Error:', err);
        res.status(500).send('Error: ' + err);
    });
});

// Users endpoints
app.get('/users', (req, res) => {
  Users.find()
    .then(users => res.json(users))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.get('/users/:id', (req, res) => {
  Users.findById(req.params.id)
    .then(user => res.json(user))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.post('/users', (req, res) => {
  Users.create(req.body)
    .then(user => res.status(201).json(user))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.put('/users/:id', (req, res) => {
  Users.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
    .then(updatedUser => res.json(updatedUser))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.delete('/users/:id', (req, res) => {
  Users.findByIdAndDelete(req.params.id)
    .then(() => res.status(200).send('User was deleted.'))
    .catch(err => res.status(500).send('Error: ' + err));
});

// User-Movie (Favorite Movies) endpoints
app.post('/users/:id/favorites', (req, res) => {
  Users.findByIdAndUpdate(req.params.id, {
    $addToSet: { favoriteMovies: req.body.movieId }
  }, { new: true })
    .then(updatedUser => res.json(updatedUser))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.delete('/users/:id/favorites/:movieId', (req, res) => {
  Users.findByIdAndUpdate(req.params.id, {
    $pull: { favoriteMovies: req.params.movieId }
  }, { new: true })
    .then(updatedUser => res.json(updatedUser))
    .catch(err => res.status(500).send('Error: ' + err));
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
