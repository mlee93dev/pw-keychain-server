let mongoose = require('mongoose');

let db = {
  localhost: 'mongodb://localhost:27017/Pw-keychain',
  mlab: 'mongodb://kaitanuva:takanuva1@ds151970.mlab.com:51970/pw-keychain'
};

mongoose.connect(process.env.PORT ? db.mlab : db.localhost);

module.exports = {mongoose}