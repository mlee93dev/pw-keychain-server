let {User} = require('./../models/user');
const jwt = require('jsonwebtoken');

let authenticate = async (req, res, next) => {
  let token = req.header('x-auth');
  try {
    let user = await User.findByToken(token);
    const tokenExp = jwt.verify(token, 'abc').exp;
    const timeNow = new Date;
    const UTCnow = Date.UTC(timeNow.getUTCFullYear(), timeNow.getUTCMonth(), timeNow.getUTCDate(),
      timeNow.getUTCHours(), timeNow.getUTCMinutes(), timeNow.getUTCSeconds());
    // console.log(tokenExp);
    // console.log(UTCnow/1000);
    if (tokenExp - 1800 < UTCnow / 1000) {
      console.log('new token sent');
      const newToken = await user.generateAuthToken();
      req.newToken = newToken;
    }
    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    res.status(401).send(e);
  }
};

module.exports = {authenticate};