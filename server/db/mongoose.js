let mongoose = require('mongoose');

let db = {
  localhost: 'mongodb://localhost:27017/Pw-keychain',
  mlab: 'mongodb://markdev:gpdls1933@ds125001.mlab.com:25001/pw-keychain'
};

mongoose.connect(process.env.PORT ? db.mlab : db.localhost);

module.exports = {mongoose}