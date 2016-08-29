var moment = require('moment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var LogSchema = new Schema({
  title: {type: String, default: ""},
  content: {type: String, default: ""},
  time: String,
  type: String
}, {
  timestamps: true
});

LogSchema.pre('save', function(next){
	this.time = moment().format('YYYY-MM-DD HH:mm:ss');
  next();
});

var Log = mongoose.model('Log', LogSchema);

module.exports = Log;