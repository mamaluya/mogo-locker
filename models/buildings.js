var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var BuildingSchema = new Schema({
  building_num: String,
  floors: [{
    type: String
  }]
});

var Building = mongoose.model('Building', BuildingSchema);

module.exports = Building;