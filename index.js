const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Models = require('./models.js');
const passport = require('passport');
const { check, validationResult } = require('express-validator');
const cors = require('cors');

const app = express();
//const { Types } = mongoose; //added this line to import 'Types' for ObjectId validation

//local database
//mongoose.connect('mongodb://localhost:27017/movieDB', { useNewUrlParser: true, useUnifiedTopology: true });

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
  Movies.findOne({ 'genre.name': req.params.name })
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

app.get('/users/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Users.findById(id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err.message);
  }
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
  passport.authenticate('jwt', { session: false }), 
  [
    check('username', 'Username is required').isLength({ min: 5 }),
    check('username', 'Username contains non-alphanumeric characters - not allowed.').isAlphanumeric(),
    check('password', 'Password is required').not().isEmpty(),
    check('email', 'Email does not appear to be valid').isEmail()
  ], 
  async (req, res) => {

    // Handle validation errors
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // Security check to ensure user is only updating their own information
    if (req.user.username !== req.params.username) {
      return res.status(400).send('Permission denied');
    }

    // Hash the password before saving to the database
    let hashedPassword = Users.hashPassword(req.body.password);

    // Find the user by Username and update their details
    await Users.findOneAndUpdate(
      { username: req.params.username }, 
      {
        $set: {
          username: req.body.username,
          password: hashedPassword,
          email: req.body.email,
          birthday: req.body.birthday
        }
      },
      { new: true } // Ensure the updated document is returned
    )
    .then(updatedUser => {
      res.json(updatedUser);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});


// Delete a user by username
app.delete('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOneAndRemove({ username: req.params.username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.username + ' was not found');
      } else {
        res.status(200).send(req.params.username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// User-Movie (Favorite Movies) endpoints
// Add a movie to a user's list of favorites
//app.post('/test/:username/movies/:movieId', (req, res) => {
//  console.log(req.params);
//  res.send('Test route working!');
//});

//app.post('/users/:username/movies/:movieId', (req, res) => {
//    res.status(200).send('Test route working!');
//});  

app.post('/users/:username/movies/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({_id: req.params.movieId})
    .then((foundMovie) => {
      console.log(foundMovie);
    })
  await Users.findOneAndUpdate(
    { username: req.params.username },
    { $push: { favoritemovies: req.params.movieId } },
    { new: true }) // This line makes sure that the updated document is returned
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});
  
app.delete('/users/:username/movies/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { username: req.params.username },  // This should be an object
      { $pull: { favoritemovies: req.params.movieId } }, // $pull to remove the movie ID
      { new: true } // Return the updated document
  );
  if (!updatedUser) {
    return res.status(404).send('User not found');
  }
  res.json(updatedUser);
} catch (err) {
  console.error(err);
  res.status(500).send('Error: ' + err);
}
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


// Start the local server
//const PORT = 8080;
//app.listen(PORT, () => {
//  console.log(`Server is running on http://localhost:${PORT}`);
//});

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
console.log('Listening on Port ' + port);
});