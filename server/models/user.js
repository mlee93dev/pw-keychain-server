let mongoose = require('mongoose');

let User = mongoose.model('User', {
  email: {
    type: String
  },
  password: {
    type: String
  }
});

module.exports = {User};