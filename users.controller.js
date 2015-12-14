'use strict';
var User = require('./users.model');
exports = module.exports;
exports.add = add;
exports.findAll = findAll;
exports.findById = findById;
exports.update = update;
exports.remove = remove;
function add(req, res) {
  if (req.user !== 'admin') {
    return res.status(401).send('admin access');
  }
  if (!req.is('application/json')) {
    return res.status(415).send('');
  }
  var username = req.body.username;
  var password = req.body.password;
  if (!username) {
    return res.status(400).send('username required');
  }
  if (username === 'admin') {
    return res.status(400).send('admin username reserved');
  }
  if (!password) {
    return res.status(400).send('password required');
  }
  User.findOne({'username': username}, callback);
  function callback(err, user) {
    if (err) {
      return res.status(500).send(err);
    }
    if (user) {
      return res.status(409).send('');
    }
    user = new User();
    user.username = username;
    user.password = user.generateHash(password);
    user.save(callbackSave);
    function callbackSave(err) {
      if (err) {
        return res.status(400).send(err);
      }
      res.send({});
    }
  }
}
function findAll(req, res) {
  if (req.user !== 'admin') {
    return res.status(401).send('admin access');
  }
  User.find({}, callback);
  function callback(err, editables) {
    if (err)  {
      return res.status(500).send(err);
    }
    res.send(editables);
  }
}
function findById(req, res) {
  if (req.user !== 'admin') {
    return res.status(401).send('admin access');
  }
  var _id = req.params._id;
  User.findById(_id, callback);
  function callback(err, user) {
    if (err)  {
      return res.status(500).send(err);
    }
    if (!user) {
      return res.status(404).send('');
    }
    res.send(user);
  }
}
function update(req, res) {
  if (req.user !== 'admin') {
    return res.status(401).send('admin access');
  }
  if (!req.is('application/json')) {
    return res.status(415).send('');
  }
  var _id = req.params._id;
  User.findById(_id, callback);
  function callback(err, user) {
    if (err) {
      return res.status(500).send(err);
    }
    if (!user) {
      return res.status(404).send('');
    }
    user.password = user.generateHash(req.body.password);
    user.save(callbackSave);
    function callbackSave(err) {
      if (err) {
        return res.status(400).send(err);
      }
      res.send(user);
    }
  }
}
function remove(req, res) {
  if (req.user !== 'admin') {
    return res.status(401).send('admin access');
  }
  var _id = req.params._id;
  User.findByIdAndRemove(_id, callback);
  function callback(err, user) {
    if (err) {
      return res.status(500).send(err);
    }
    if (!user) {
      return res.status(404).send('');
    }
    res.send(user);
  }
}
