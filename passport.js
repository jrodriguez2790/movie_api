const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Models = require('./models.js'),
  passportJWT = require('passport-jwt');

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

passport.use(new LocalStrategy({
  usernameField: 'username', // Ensure this matches the request body field
  passwordField: 'password'  // Ensure this matches the request body field
}, (username, password, callback) => {
  console.log(`${username}  ${password}`);
  Users.findOne({ username: username })  // Using 'username' field for lookup
    .then(user => {
      if (!user) {
        console.log('incorrect username');
        return callback(null, false, { message: 'Incorrect username or password.' });
      }

      if (!user.validatePassword(password)) {  // Direct comparison (ideally, use bcrypt for hashing)
        console.log('incorrect password');
        return callback(null, false, { message: 'Incorrect password.' });
      }

      console.log('finished');
      return callback(null, user);
    })
    .catch(error => {
      console.log(error);
      return callback(error);
    });
}));

passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'your_jwt_secret'
}, async (jwtPayload, callback) => {
  return await Users.findById(jwtPayload._id)
    .then((user) => {
      return callback(null, user);
    })
    .catch((error) => {
      return callback(error)
    });
}));
