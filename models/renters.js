var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var RenterSchema = new Schema({
  nickname: String,
  gender: {type: Number, default: 1}, //1: 男　0: 女
  phone: String,
  address: String,
  ID_Card: String,
  information: String,
  departs: [{ type: ObjectId, ref: "Depart" }]
}, {
  timestamps: true
});

var Renter = mongoose.model('Renter', RenterSchema);

module.exports = Renter;