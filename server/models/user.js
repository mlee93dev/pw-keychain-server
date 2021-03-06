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
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  accounts: [
    {
      name: {
        type: String,
        required: true
      },
      password: {
        type: String,
        required: true
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
  let token = jwt.sign({_id: user._id.toHexString(), access}, 'abc', {expiresIn: '1h'}).toString();

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

UserSchema.pre('findOneAndUpdate', function (next) {
  let password;
  if (!this.getUpdate().$set) {
    return next();
  } else if (!this.getUpdate().$set.password) {
    return next();
  } else {
    password = this.getUpdate().$set.password;
  }
  try {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, (err, hash) => {
        this.getUpdate().$set.password = hash;
        next();
      });
    })
  } catch (e) {
    return next(e);
  }
});

UserSchema.statics.findByToken = function (token) {
  let User = this;
  let decoded;

  try {
    decoded = jwt.verify(token, 'abc');
  } catch (e) {
    return Promise.reject(e);
  }

  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};

UserSchema.statics.addAccount = function (email, name) {
  getRandomChar = function (){
    let random = Math.floor(Math.random()*93 + 33);
    return String.fromCharCode(random);
  }
  let charArray = [];
  while (charArray.length < 10) {
    charArray.push(getRandomChar());
  }
  let password = charArray.join('');
  let User = this;
  return User.findOneAndUpdate({email}, {$push:{accounts:[{name, password}]}}, {new: true});
};

UserSchema.statics.deleteAccount = function (email, name) {
  let User = this;
  return User.findOneAndUpdate({email}, {$pull:{accounts:{name}}}, {safe: true, new: true});
}

let User = mongoose.model('User', UserSchema);

module.exports = {User};