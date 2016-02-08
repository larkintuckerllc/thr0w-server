'use strict';
var config = require('config');
var SECRET = config.get('secret');
var ADMINPASSWORD = config.get('adminpassword');
var DATABASE = config.get('database');
var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var jwt = require('jwt-simple');
var User = require('./users.model');
var mongoose = require('mongoose');
var usersController = require('./users.controller');
var spawn = require('child_process').spawn;

// DATABASE CONNECTION
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
mongoose.connect(DATABASE);

// APP SETUP
var app = express();
app.use(allowCrossDomain);
app.use(noCache);
app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded({extended: true}));
passport.use(new LocalStrategy(localStrategyVerify));
passport.use(new BearerStrategy(bearerStrategyVerify));
app.use(passport.initialize());

// USERS CRUD ROUTES
app.get('/api/users/:_id',
  passport.authenticate('bearer', {session: false}),
  usersController.findById);
app.get('/api/users/',
  passport.authenticate('bearer', {session: false}),
  usersController.findAll);
app.post('/api/users/',
  passport.authenticate('bearer', {session: false}),
  usersController.add);
app.put('/api/users/:_id',
  passport.authenticate('bearer', {session: false}),
  usersController.update);
app.delete('/api/users/:_id',
  passport.authenticate('bearer', {session: false}),
  usersController.remove);

// LOGIN ROUTE
app.post('/api/login/',
  passport.authenticate('local', {session: false}),
  sendToken);

// THROW ROUTE
app.post('/api/thr0w/',
  passport.authenticate('bearer', {session: false}),
  thr0wContent);

// START APP
app.listen(3000, listen);

// SOCKET SETUP
var appSocket = express();
var httpSocket = require('http').Server(appSocket);
var io = require('socket.io')(httpSocket);
var channels = {};
io.on('connection', connection);
httpSocket.listen(3001, listenSocket);

// OPTIONAL POWER MANAGEMENT
var active = {};
var suspended = {};
if (config.has('power')) {
  setInterval(checkActive, 1000 * 60 * config.get('power').interval);
}

function allowCrossDomain(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.send(200);
  } else {
    next();
  }
}
function noCache(req, res, next) {
  res.setHeader('cache-control',
    'private, max-age=0, no-cache, no-store, must-revalidate');
  res.setHeader('expires', '0');
  res.setHeader('pragma', 'no-cache');
  next();
}
function localStrategyVerify(username, password, done) {
  if (username === 'admin') {
    // EXPECTING ASYNC
    process.nextTick(function() {
      if (password === ADMINPASSWORD) {
        return done(false, jwt.encode({_id: 'admin'}, SECRET));
      } else {
        return done(false, false);
      }
    });
  } else {
    User.findOne({'username': username}, callback);
  }
  function callback(err, user) {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(false, false);
    }
    if (!user.validPassword(password)) {
      return done(false, false);
    }
    return done(false, jwt.encode({_id: user._id}, SECRET));
  }
}
function bearerStrategyVerify(token, done) {
  // EXPECTING ASYNC
  process.nextTick(function() {
    var _id;
    try {
      _id = jwt.decode(token, SECRET)._id;
    } catch (error) {
      return done(null, false);
    }
    return done(null, _id);
  });
}
function sendToken(req, res) {
  res.send({
    'token': req.user
  });
}
function thr0wContent(req, res) {
  var _id = req.user;
  var chns = req.body.channels;
  var message = req.body.message;
  if (!Array.isArray(chns)) {
    return res.status(400).send({});
  }
  if (_id === 'admin') {
    success();
  } else {
    User.findOne({'_id': _id}, callback);
  }
  function success() {
    var i;
    var j;
    var managed;
    if (config.has('power') && !active[_id]) {
      managed = config.get('power').accounts;
      for (i = 0; i < managed.length; i++) {
        if (managed[i]._id === _id) {
          active[_id] = true;
          suspended[_id] = false;
          for (j = 0; j < managed[i].clients.length; j++) {
            spawn('/usr/bin/wakeonlan', [
              '-i',
              'managed[i].clients[j].ip',
              'managed[i].clients[j].mac']);
          }
        }
      }
    }
    for (i = 0; i < chns.length; i++) {
      messageChannel(_id, -1, chns[i], message);
    }
    res.send({});
  }
  function callback(err, user) {
    if (err) {
      return res.status(500).send({});
    }
    if (!user) {
      return res.status(401).send({});
    }
    success();
  }
}
function listen() {
  console.log('listening on *:3000');
}
function connection(socket) {
  var _id;
  var channelKey;
  var authTimeout;
  delete io.sockets.connected[socket.id];
  authTimeout = setTimeout(unauthorized, 5000);
  socket
    .on('authenticate', authenticate)
    .on('disconnect', disconnect);
  function unauthorized() {
    socket.disconnect('unauthorized');
  }
  function authenticate(data) {
    var token;
    var chn;
    clearTimeout(authTimeout);
    try {
      var obj = JSON.parse(data);
      token = obj.token;
      chn = obj.channel;
      _id = jwt.decode(token, SECRET)._id;

      // VALIDATE ID AND CHANNEL
      if (chn === undefined ||
        typeof chn !== 'number' ||
        chn % 1 !== 0 ||
        chn < 0) {
        socket.disconnect('unauthorized');
        return;
      }
      if (_id === 'admin') {
        success();
      } else {
        User.findOne({'_id': _id}, callback);
      }
    } catch (error) {
      socket.disconnect('unauthorized');
      return;
    }
    function success() {
      channelKey = _id + ':' + chn;
      var channel = channels[channelKey];
      io.sockets.connected[socket.id] = socket;
      if (channel) {
        channel.emit('duplicate');
        channel.disconnect('duplicate');
        delete channels[channelKey];
      }
      channels[channelKey] = socket;
      socket.on('thr0w', thr0wCallback);
      socket.emit('authenticated');
      function thr0wCallback(data) {
        try {
          var obj = JSON.parse(data);
          var chns = obj.channels;
          var message = obj.message;
          for (var i = 0; i < chns.length; i++) {
            messageChannel(_id, chn, chns[i], message);
          }
        } catch (error) {
        }
      }
    }
    function callback(err, user) {
      if (err) {
        socket.disconnect('unauthorized');
      }
      if (!user) {
        socket.disconnect('unauthorized');
      }
      success();
    }
  }
  function disconnect() {
    if (channels[channelKey]) {
      delete channels[channelKey];
    }
  }
}
function listenSocket() {
  console.log('listening on *:3001');
}
function messageChannel(_id, sourceChn, chn, message) {
  var channel = channels[_id + ':' + chn];
  if (channel) {
    channel.emit('message', {source: sourceChn, message: message});
  }
}
function checkActive() {
  var i;
  var j;
  var managed = config.get('power').accounts;
  for (i = 0; i < managed.length; i++) {
    var _id = managed[i]._id;
    if (!active[_id] && !suspended[_id]) {
      for (j = 0; j < managed[i].clients.length; j++) {
        spawn('/usr/bin/ssh',
          ['suspend@' + managed[i].clients[j].ip]);
      }
      suspended[_id] = true;
    }
    active[_id] = false;
  }
}
