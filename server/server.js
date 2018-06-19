const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');

let {mongoose} = require('./db/mongoose');
let {User} = require('./models/user');
let {authenticate} = require('./middleware/authenticate');
let app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use(function (req, res, next) {
  // res.header('Access-Control-Allow-Origin', 'https://protected-woodland-32658.herokuapp.com');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Expose-Headers', 'x-auth');
  res.header('Access-Control-Allow-Headers', 'Origin, x-auth, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  next();
})

app.post('/users', async (req, res) => {
  try {
    let body = _.pick(req.body, ['email', 'password']);
    let user = new User(body);
    await user.save();
    let token = await user.generateAuthToken();
    res.header('x-auth', token).send(user);
  }
  catch (e) {
    res.status(400).send(e);
  }
});

app.post('/users/login', async (req, res) => {
  try {
    let body = _.pick(req.body, ['email', 'password']);

    let user = await User.findByCredentials(body.email, body.password);
    if (!user) {
      throw new Error('User not found');
    }
    let token = await user.generateAuthToken();
    res.header('x-auth', token).send(user);
  }
  catch (e) {
    res.status(400).send({'errmsg': 'Invalid username or password'});
  }

});

app.post('/users/add', authenticate, async (req, res) => {
  try {
    const token = req.header('x-auth');
    const user = await User.findByToken(token);
    if (user) {
      let found = user.accounts.find((v,i) => {
        return v['name'] === req.body.name;
      });
      if (found) {
        throw new Error('That account already exists.');
      }
      let updatedUser = await User.addAccount(user.email, req.body.name);
      return res.status(200).send(updatedUser);
    }
    throw new Error('That user does not exist.');
  }
  catch (e) {
    console.log(e);
    res.status(400).send({'errmsg': e.message});
  }
});

app.delete('/users/me/token', authenticate, async (req, res) => {
  try{
    await req.user.removeToken(req.token);
    res.status(200).send();
  } catch (e) {
    res.status(400).send();
  }
});

app.get('/users/me', authenticate, async (req, res) => {
  res.send(req.user);
});

app.listen(port, () => {
  console.log(`Started up at port ${port}`);
});

module.exports = {app};