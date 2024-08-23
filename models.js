const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

// Define the Movie schema
const movieSchema = new Schema({
  title: { type: String, required: true },
  director: {
    name: { type: String, required: true },
    bio: { type: String, required: true }
  },
  genre: {
    name: { type: String, required: true },
    description: { type: String, required: true }
  },
  year: { type: Number, required: true },
  description: { type: String, required: true }
});


// Define the User schema
const userSchema = new Schema({
  //_id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  birthday: { type: Date },
  favoritemovies: [{ type: Schema.Types.ObjectId, ref: 'Movie' }]
});

// add static method to hash password  
userSchema.statics.hashPassword = (password) => {
  if (!password) {
    throw new Error('Password is required');
  }
  return bcrypt.hashSync(password, 10);
};

// add method to validate password
userSchema.methods.validatePassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

// Create the models from the schemas
const Movie = mongoose.model('Movie', movieSchema);
const User = mongoose.model('User', userSchema);

// Export the models
module.exports = { Movie, User };