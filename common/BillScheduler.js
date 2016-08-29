var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var schedule = require('node-schedule');
var Departs = require("../models/departs");
var SMSUtil = require('../common/SMSUtil');
var Fee = require("../models/fee");
var config = require('../config');

function init() {
  var rule = new schedule.RecurrenceRule();
  if (config.bill.hour) rule.hour = config.bill.hour;
  if (config.bill.minute) rule.minute = config.bill.minute;
  if (config.bill.second) rule.second = config.bill.second;
  if (config.bill.dayOfMonth) rule.dayOfMonth = config.bill.dayOfMonth;
  if (config.bill.dayOfMonth || config.bill.hour || config.bill.minute || config.bill.second) {
    startSchedule();
  }

  function startSchedule() {
    schedule.scheduleJob(rule, function () {
      var month = moment().subtract(1, 'month').format('YYYY-MM');
      Departs.find()
        .$where('this.renters.length > 0')
        .populate({path: "renters"})
        .exec(function (err, departs) {
          if (err) throw err;
          departs.forEach(function (depart, index) {
            setTimeout(function () {
              async.parallel({
                water: function (callback) {
                  Fee.find({depart: depart._id, type: "water", accounted: 1})
                    .where("from")
                    .gt(month + "-1")
                    .lt(month + "-31")
                    .exec(err, function (err, fees) {
                      if (err) throw err;
                      if (fees.length > 0) {
                        var fee_values = _.pluck(fees, 'money');
                        var water_fee = _.reduce(fee_values, function (memo, num) {
                          return memo + num;
                        }, 0);
                        callback(null, water_fee);
                      } else {
                        callback(null, 0);
                      }
                    });
                },
                electric: function (callback) {
                  Fee.find({depart: depart._id, type: "electric", accounted: 1})
                    .where("from")
                    .gt(month + "-1")
                    .lt(month + "-31")
                    .exec(err, function (err, fees) {
                      if (err) throw err;
                      if (fees.length > 0) {
                        var fee_values = _.pluck(fees, 'money');
                        var electric_fee = _.reduce(fee_values, function (memo, num) {
                          return memo + num;
                        }, 0);
                        callback(null, electric_fee);
                      } else {
                        callback(null, 0);
                      }
                    });
                }
              }, function (err, results) {
                if (err) throw err;
                console.log(results);
                depart.renters.forEach(function (renter) {
                  console.log("phone: " + renter.phone);
                  var tpl_value = "#water#=" + results.water + "&#electric#=" + results.electric + "&#balance#=" + depart.balance;
                  console.log("tpl_value: " + tpl_value);
                  SMSUtil.sendSMS(renter.phone, config.sms.bill, tpl_value, function (data) {
                    console.log(data);
                  });
                });
              });
            }, index * 3000);
          });
        });
    });
  }
}

exports.init = init;