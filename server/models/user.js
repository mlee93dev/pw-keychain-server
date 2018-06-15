const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

let UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }],
  accounts: [
    {
      name: {
        type: String,
        required: true,
        unique: true
      },
      password: {
        type: String,
        required: true
        // be randomly generated, preferably automatically
      }
    }
  ]
});

UserSchema.methods.toJSON = function () {
  let user = this;
  let userObject = user.toObject();

  return _.pick(userObject, ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = function () {
  let user = this;
  let access = 'auth';
  let token = jwt.sign({_id: user._id.toHexString(), access}, 'abc').toString();

  user.tokens = user.tokens.concat([{access, token}]);

  return user.save().then(() => {
    return token;
  });
};

UserSchema.methods.removeToken = function (token) {
  let user = this;

  return user.update({
    $pull: {
      tokens: {
        token: token
      }
    }
  });
};

UserSchema.statics.findByCredentials = async function (email, password) {
  // try {
    let User = this;
    let user = await User.findOne({email});
    if (!user) {
      return null;
    }
    
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user);
        } else {
          reject();
        }
      });
    })
  // }
  // catch (e) {
  //   return e;
  // }
};

UserSchema.pre('save', function (next) {
  let user = this;

  if (user.isModified('password')){
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    })
  } else {
    next();
  }
});

UserSchema.statics.findByToken = function (token) {
  let User = this;
  let decoded;

  try {
    decoded = jwt.verify(token, 'abc');
  } catch (e) {
    return Promise.reject();
  }

  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};

UserSchema.statics.addAccount = function (email, name) {
  let password = 'abc123' //randomly generate this
  let User = this;
  return User.findOneAndUpdate({email}, {$push:{accounts : [{name, password}]}}, {new: true}, function (err, user) {
    if (err) {
      throw err;
    } else {
      return user;
    }
  });
};

let User = mongoose.model('User', UserSchema);

module.exports = {User};