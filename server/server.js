const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const hbs = require('hbs');

let {mongoose} = require('./db/mongoose');
let {User} = require('./models/user');
let {authenticate} = require('./middleware/authenticate');
let app = express();

const port = process.env.PORT || 3000;

app.set('view engine', 'hbs');
app.use(bodyParser.json());

app.use(function (req, res, next) {
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
    console.log(e)
    res.status(400).send({'message': 'Invalid username or password'});
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
      return res.status(200).header('x-auth', req.newToken).send(updatedUser);
    }
    throw new Error('That user does not exist.');
  }
  catch (e) {
    console.log(e);
    res.status(400).send({'message': e.message});
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

app.get('/users/me/accounts', authenticate, async (req, res) => {
  try{
    const token = req.header('x-auth');
    const user = await User.findByToken(token);
    const accounts = user.accounts;
    res.status(200).header('x-auth', req.newToken).send(accounts);
  } catch (e) {
    res.status(400).send({'message': e.message});
  }
});

app.delete('/users/me/accounts/delete', authenticate, async (req, res) => {
  try{
    const token = req.header('x-auth');
    const user = await User.findByToken(token);
    if (user) {
      let found = user.accounts.find((v,i) => {
        return v['name'] === req.body.name;
      });
      if (!found) {
        throw new Error('That account doesn\'t exist.');
      }
      let updatedUser = await User.deleteAccount(user.email, req.body.name);
      return res.status(200).header('x-auth', req.newToken).send(updatedUser);
    }
    throw new Error('That user does not exist.');
  } catch (e) {
    res.status(400).send({'message': e.message});
  }
});

app.post('/forgot', async (req, res) => {
  try {
    let buffer = crypto.randomBytes(20);
    let token = buffer.toString('hex');
    const user = await User.findOneAndUpdate({email: req.body.email}, 
      {$set: {resetPasswordToken: token, resetPasswordExpires: Date.now() + 3600000}}, {new: true});
    const transporter = nodemailer.createTransport({
      service: 'Mailgun',
      auth: {
        user: 'postmaster@sandboxbd1c82fa486a411d8252e00086824911.mailgun.org',
        pass: '530d24384be84b0a8767d21f995f3b72-e44cc7c1-edf7bba2'
      }
    });
    const mailOptions = {
      from: 'markleedev1933@gmail.com',
      to: user.email,
      subject: 'PwKeychain Password Reset',
      text: `Please click the following link to reset your password: \n
        https://${req.headers.host}/reset/${token} \n
        If you did not request this, please ignore this email and your password will remain unchanged.`
    };
    
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
        throw new Error('There was an error sending the email.');
      } 
      res.status(200).send();
    });

  } catch (e) {
    res.status(400).send({'message': e.message});
  }
});

app.get('/reset/:token', function(req, res) {
  User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt:Date.now()}}, function(err, user) {
    if (!user) {
      res.render('error.hbs');
    }
    res.render('reset.hbs', {
      user: req.user
    });
  });
});

app.post('/reset/:token', async function(req, res){
  try{
    const user = await User.findOneAndUpdate({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt:Date.now()}},
      {$set: {password: req.body.password, resetPasswordToken: null, resetPasswordExpires: null}}, {new: true});
    console.log(req);
    console.log(user);
    const transporter = nodemailer.createTransport({
      service: 'Mailgun',
      auth: {
        user: 'postmaster@sandboxbd1c82fa486a411d8252e00086824911.mailgun.org',
        pass: '530d24384be84b0a8767d21f995f3b72-e44cc7c1-edf7bba2'
      }
    });
    const mailOptions = {
      from: 'markleedev1933@gmail.com',
      to: user.email,
      subject: 'PwKeychain Password Changed',
      text: `Your password has been changed. If you did not intend to do this, please
            contact us as soon as possible.`
    };
    
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
        throw new Error('There was an error sending the email.');
      } 
      res.render('finished.hbs');
    });
  } catch (e) {
    res.status(400).send({'message': e.message});
  }
});

app.listen(port, () => {
  console.log(`Started up at port ${port}`);
});

module.exports = {app};