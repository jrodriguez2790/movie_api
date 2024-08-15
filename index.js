const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Models = require('./models.js');
const passport = require('passport');
const { check, validationResult } = require('express-validator');
const cors = require('cors');

const app = express();

//local database
// mongoose.connect('mongodb://localhost:27017/movieDB', { useNewUrlParser: true, useUnifiedTopology: true });

//online database
mongoose.connect(process.env.CONNECTION_URI);

// models
const Movies = Models.Movie;
const Users = Models.User;

// Middleware 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(passport.initialize());
require('./passport');

// Serve static files from the public folder
app.use(express.static('public'));

let auth = require('./auth')(app);

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

// Genre Endpoints
app.get('/genres/:name', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ 'genre': req.params.name })
    .then((movie) => {
      if (movie) {
        res.json(movie.genre);
      } else {
        res.status(404).send('Genre not found.');
      }
    })
    .catch(err => res.status(500).send('Error: ' + err));
});

// Director Endpoints
app.get('/directors/:name', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ 'director.name': req.params.name })
    .then((movie) => {
      if (movie) {
        res.json(movie.director);
      } else {
        res.status(404).send('Director not found.');
      }
    })
    .catch(err => res.status(500).send('Error: ' + err));
});

// Users endpoints
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.find()
    .then(users => res.json(users))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.get('/users/:username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOne({ username: req.params.username })
    .then(user => res.json(user))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.post('/users',
  // Validation logic here for request
  [
    check('username', 'Username is required').isLength({min: 5}),
    check('username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('password', 'Password is required').not().isEmpty(),
    check('email', 'Email does not appear to be valid').isEmail()
  ], async (req, res) => {

  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  let hashedPassword = Users.hashPassword(req.body.password);
  await Users.findOne({ username: req.body.username }) // Search to see if a user with the requested username already exists
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.username + ' already exists');
      } else {
        Users
          .create({
            username: req.body.username,
            password: hashedPassword,
            email: req.body.email,
            birthday: req.body.birthday
          })
          .then((user) => { res.status(201).json(user) })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

app.put('/users/:username', 
  [
    check('username', 'Username is required').isLength({ min: 5 }),
    check('username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('password', 'Password is required').not().isEmpty(),
    check('email', 'Email does not appear to be valid').isEmail()
  ], async (req, res) => {

  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  let hashedPassword = Users.hashPassword(req.body.password);

  Users.findOneAndUpdate({ username: req.params.username }, {
    $set: {
      username: req.body.username,
      password: hashedPassword,
      email: req.body.email,
      birthday: req.body.birthday
    }
  },
  { new: true }) // This line makes sure that the updated document is returned
    .then(updatedUser => {
      res.json(updatedUser);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.delete('/users/:username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndDelete({ username: req.params.username })
    .then(() => res.status(200).send('User was deleted.'))
    .catch(err => res.status(500).send('Error: ' + err));
});

// User-Movie (Favorite Movies) endpoints
app.post('/users/:username/favoritesmovies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ username: req.params.username }, {
    $addToSet: { favoritemovies: req.body.movieId }
  }, { new: true })
    .then(updatedUser => res.json(updatedUser))
    .catch(err => res.status(500).send('Error: ' + err));
});

app.delete('/users/:username/favoritemovies/:movieId', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ username: req.params.username }, {
    $pull: { favoritemovies: req.params.movieId }
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
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});