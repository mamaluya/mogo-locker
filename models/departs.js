var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var DepartSchema = new Schema({
  building_num: String,
  floor_num: String,
  room_num: String,
  room_style: String,
  room_area: String,
  water_code: String,
  electric_code: String,
  gas_code: String,
  start: String,
  end: String,
  startTime: String,
  endTime: String,
  switch: {type: Number, default: 0},  //0: 送电中， 1: 断电中
  balance: {type: Number, default: 0.0},
  card_times: {type: Number, default: 0},
  status: {type: Number, default: 0},
  renters: [{ type: ObjectId, ref: "Renter" }]
}, {
  timestamps: true
});

var Depart = mongoose.model('Depart', DepartSchema);

module.exports = Depart;