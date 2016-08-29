var mongoose = require('mongoose');
var moment = require('moment');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var RechargeSchema = new Schema({
  money: {type: Number, default: 0.0},
  depart: {type: ObjectId, ref: "Depart"},
  time: String
});

var Recharge = mongoose.model('Recharge', RechargeSchema);

RechargeSchema.pre('save', function(next){
  this.time = moment().format('YYYY-MM-DD HH:mm:ss');
  next();
});

module.exports = Recharge;