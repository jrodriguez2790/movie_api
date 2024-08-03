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

const passport = require('passport');
require('./passport');

app.use(passport.initialize());

let auth = require('./auth')(app);

// Serve static files from the public folder
app.use(express.static('public'));

// Movies endpoints
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((error) => {
      res.status(500).send('Error: ' + error);
    });
});

app.get('/movies/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findById(req.params.id)
    .then(movie => res.json(movie))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.post('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.create(req.body)
    .then(movie => res.status(201).json(movie))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.put('/movies/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
    .then(updatedMovie => res.json(updatedMovie))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.delete('/movies/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findByIdAndDelete(req.params.id)
    .then(() => res.status(200).send('Movie was deleted.'))
    .catch(err => res.status(500).send('Error: ' + err));
});

// Users endpoints
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.find()
    .then(users => res.json(users))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.get('/users/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findById(req.params.id)
    .then(user => res.json(user))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.post('/users', (req, res) => {
  Users.create(req.body)
    .then(user => res.status(201).json(user))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.put('/users/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
    .then(updatedUser => res.json(updatedUser))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.delete('/users/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findByIdAndDelete(req.params.id)
    .then(() => res.status(200).send('User was deleted.'))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.put('/users/:username', (req, res) => {
  Users.findOneAndUpdate({ username: req.params.username }, {
    $set:
    {
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      birthday: req.body.birthday
    }
  },
    { new: true }, // This line makes sure that the updated document is returned
  )
    .then(updatedUser => {
      res.json(updatedUser);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// User-Movie (Favorite Movies) endpoints
app.post('/users/:id/favorites', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findByIdAndUpdate(req.params.id, {
    $addToSet: { favoriteMovies: req.body.movieId }
  }, { new: true })
    .then(updatedUser => res.json(updatedUser))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.delete('/users/:id/favorites/:movieId', passport.authenticate('jwt', { session: false }), (req, res) => {
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
