'use strict';
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;
var schema = new Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});
schema.methods.generateHash = generateHash;
schema.methods.validPassword = validPassword;
exports = module.exports = mongoose.model('thr0w_user', schema);
function generateHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}
function validPassword(password) {
  /*jshint validthis: true */
  return bcrypt.compareSync(password, this.password);
}
