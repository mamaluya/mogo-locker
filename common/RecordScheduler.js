var http = require("http");
var querystring = require("querystring");
var moment = require("moment");
var config = require('../config');
var schedule = require('node-schedule');
var Departs = require("../models/departs");
var Fee = require("../models/fee");
var LogUtil = require("../common/LogUtil");

function init() {
  var rule = new schedule.RecurrenceRule();
  if (config.record.hour) rule.hour = config.record.hour;
  if (config.record.minute) rule.minute = config.record.minute;
  if (config.record.second) rule.second = config.record.second;
  if (config.record.dayOfMonth) rule.dayOfMonth = config.record.dayOfMonth;
  if (config.record.dayOfMonth || config.record.hour || config.record.minute || config.record.second) {
    startSchedule();
  }

  function startSchedule() {
    schedule.scheduleJob(rule, function () {
      Departs.find()
        .$where('this.renters.length > 0')
        .exec(function (err, departs) {
          if (err) throw err;
          departs.forEach(function (depart, index) {
            setTimeout(function () {
              if (depart.water_code) recordWater(depart);
              if (depart.electric_code) recordElectric(depart);
            }, index * 3000);
          });
        });
    });
  }

  function recordElectric(depart) { //14840279
    var filter = {depart: depart._id, type: "electric", accounted: 0};
    Fee.findOne(filter)
      .sort({createdAt: -1})
      .exec(function (err, fee) {
        if (err) throw err;
        var url = config.urls.electric + querystring.stringify({addr: depart.electric_code});
        var chunks = [], size = 0, current_record;
        http.get(url, function (res) {//请求电表数据
          res.on('data', function (chunk) {
            chunks.push(chunk);
            size += chunk.length;
          }).on('end', function () {
            var data = null;
            switch (chunks.length) {
              case 0:
                data = new Buffer(0);
                break;
              case 1:
                data = chunks[0];
                break;
              default:
                data = new Buffer(size);
                for (var i = 0, pos = 0, l = chunks.length; i < l; i++) {
                  var chunk = chunks[i];
                  chunk.copy(data, pos);
                  pos += chunk.length;
                }
                break;
            }
            try {
              var val = parseFloat(data.toString().split(",")[1]);
              if (isNaN(val)) throw new Error("返回值不为数值型");
              else current_record = val;
              console.log(depart.room_num + "electric: " + current_record);
            } catch (e) {
              LogUtil.record({
                title: "电表服务器异常",
                content: e.message,
                type: "抄表失败"
              });
            }
            if (fee && !isNaN(current_record)) {
              var amount = current_record - fee.last_record;
              var money = amount * config.rate.electric;
              fee.update({
                current_record: current_record,
                amount: amount,
                money: money,
                accounted: 1,
                to: moment().format('YYYY-MM-DD HH:mm:ss')
              }, function (err, fee_) {
                if (err) throw err;
                Departs.findOneAndUpdate({_id: depart._id}, {$inc: {balance: -money}}, function (err, depart_) {
                  if (err) throw err;
                });
              });
            }
            if (!isNaN(current_record)) {
              var _fee = new Fee();
              _fee.last_record = current_record;
              _fee.type = "electric";
              _fee.depart = depart._id;
              Fee.create(_fee, function (err, fee) {
                if (err) throw err;
              });
            }
          }).on('error', function (e) {
            LogUtil.record({
              title: "水表服务器异常",
              content: e.message,
              type: "抄表失败"
            });
          });
        });
      });
  }

  function recordWater(depart) { //00000013215410
    var filter = {depart: depart._id, type: "water", accounted: 0};
    Fee.findOne(filter)
      .sort({createdAt: -1})
      .exec(function (err, fee) {
        if (err) throw err;
        var url = config.urls.water + querystring.stringify({
            certificate: certificate,
            hardwareID: depart.water_code
          });
        var data, current_record;
        http.get(url, function (res) {
          res.on('data', function (chunk) {
            data = chunk;
          }).on('end', function () {
            try {
              var msg = JSON.parse(data).message.replace(/\\/g, "");
              var val = JSON.parse(msg).count;
              if (isNaN(val)) throw new Error(msg);
              else current_record = val;
              console.log(depart.room_num + "water: " + current_record);
            } catch (e) {
              LogUtil.record({
                title: "水表服务器返回异常数据",
                content: e.message,
                type: "抄表失败"
              });
            }
            if (fee && !isNaN(current_record)) {
              var amount = current_record - fee.last_record;
              var money = amount * config.rate.water;
              fee.update({
                current_record: current_record,
                amount: amount,
                money: money,
                accounted: 1,
                to: moment().format('YYYY-MM-DD HH:mm:ss')
              }, function (err, fee_) {
                if (err) throw err;
                Departs.findOneAndUpdate({_id: depart._id}, {$inc: {balance: -money}}, function (err, depart_) {
                  if (err) throw err;
                });
              });
            }
            if (!isNaN(current_record)) {
              var _fee = new Fee();
              _fee.last_record = current_record;
              _fee.type = "water";
              _fee.depart = depart._id
              Fee.create(_fee, function (err, fee) {
                if (err) throw err;
              });
            }
          }).on('error', function (e) {
            LogUtil.record({
              title: "水表服务器异常",
              content: e.message,
              type: "抄表失败"
            });
          });
        });
      });
  }
}

exports.init = init;