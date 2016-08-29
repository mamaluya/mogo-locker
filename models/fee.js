var mongoose = require('mongoose');
var moment = require('moment')
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var FeeSchema = new Schema({
  type: {type: String, default: ""},
  last_record: {type: Number, default: 0.0},
  current_record: {type: Number, default: 0.0},
  amount: {type: Number, default: 0.0},
  money: {type: Number, default: 0.0},
  from: String,
  to: String,
  accounted: {type: Number, default: 0},
  depart: {type: ObjectId, ref: "Depart"}
}, {
  timestamps: true
});

FeeSchema.pre('save', function(next){
  this.from = moment().format('YYYY-MM-DD HH:mm:ss');
  next();
});

var Fee = mongoose.model('Fee', FeeSchema);

module.exports = Fee;