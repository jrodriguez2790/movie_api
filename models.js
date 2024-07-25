const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Movie schema
const movieSchema = new Schema({
  title: { type: String, required: true },
  director: { type: String, required: true },
  genre: { type: String, required: true },
  year: { type: Number, required: true },
  description: { type: String, required: true }
});

// Define the User schema
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  birthday: { type: Date },
  favoriteMovies: [{ type: Schema.Types.ObjectId, ref: 'Movie' }]
});

// Create the models from the schemas
const Movie = mongoose.model('Movie', movieSchema);
const User = mongoose.model('User', userSchema);

// Export the models
module.exports = { Movie, User };