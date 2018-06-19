let {User} = require('./../models/user');

let authenticate = async (req, res, next) => {
  let token = req.header('x-auth');
  if (token) {
    console.log(token);
  } else {
    console.log('no token');
  }

  try {
    let user = await User.findByToken(token);
    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    res.status(401).send(e);
  }
};

module.exports = {authenticate};