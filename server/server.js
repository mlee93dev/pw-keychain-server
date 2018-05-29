const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');

let {mongoose} = require('./db/mongoose');
let {User} = require('./models/user');
let app = express();

app.use(bodyParser.json());

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

app.listen(3000, () => {
  console.log('Started up server');
});

module.exports = {app};