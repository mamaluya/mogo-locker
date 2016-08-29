var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var AdminSchema = new Schema({
  username: String,
  password: String,
  nickname: String,
  phone: String,
  settings: {type: ObjectId, ref: 'Settings'},
  invalid: {type: Boolean, default: 0 }
}, {
  timestamps: true
});

var Admin = mongoose.model('Admin', AdminSchema);

module.exports = Admin;