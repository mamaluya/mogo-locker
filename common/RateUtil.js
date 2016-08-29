var Rate = require('../models/rate');
var config = require('../config');

function init() {
  Rate.findOne({}, function(err, rate){
    if (rate){
      config.rate.water = rate.water;
      config.rate.electric = rate.electric;
    }
  });
}
exports.init = init;