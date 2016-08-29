var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var RateSchema = new Schema({
  water: {type: Number, default: 0.0},
  electric: {type: Number, default: 0.0},
  gas: {type: Number, default: 0.0}
}, {
  timestamps: true
});

var Rate = mongoose.model('Rate', RateSchema);

module.exports = Rate;