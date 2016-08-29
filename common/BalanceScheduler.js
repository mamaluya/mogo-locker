var schedule = require('node-schedule');
var config = require('../config');
var Departs = require('../models/departs');
var SMSUtil = require('../common/SMSUtil')

function init() {
  var rule = new schedule.RecurrenceRule();
  if (config.balance.hour) rule.hour = config.balance.hour;
  if (config.balance.minute) rule.minute = config.balance.minute;
  if (config.balance.second) rule.second = config.balance.second;
  if (config.balance.dayOfMonth) rule.dayOfMonth = config.balance.dayOfMonth;
  if (config.balance.dayOfMonth || config.balance.hour || config.balance.minute || config.balance.second) {
    startSchedule();
  }

  function startSchedule() {
    schedule.scheduleJob(rule, function () {
      Departs.find()
        .$where('this.renters.length > 0')
        .populate({path: "renters"})
        .exec(function (err, departs) {
          if (err) throw err;
          departs.forEach(function (depart, index) {
            setTimeout(function () {
              if (depart.balance < 50) {
                depart.renters.forEach(function (renter) {
                  if (renter.phone) {
                    console.log(renter.phone);
                    console.log("tpl_value: " + depart.balance);
                    SMSUtil.sendSMS(renter.phone, config.sms.balance, "#money#=" + depart.balance, function (data) {
                      console.log(data);
                    });
                  }
                });
              }
            }, index * 3000);
          });
        });
    });
  }

}

exports.init = init;