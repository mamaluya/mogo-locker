var express = require('express');
var router = express.Router();
var moment = require('moment');
var _ = require('underscore');
var async = require('async');
var http = require('http');
var config = require('../config');
var Departs = require('../models/departs');
var Buildings = require('../models/buildings');
var Recharge = require('../models/recharge');
var Renters = require('../models/renters');
var Fee = require('../models/fee');
var Log = require('../models/log');
var PasswordUtil = require('../common/PasswordUtil');
var SMSUtil = require('../common/SMSUtil');
var LogUtil = require('../common/LogUtil');
var querystring = require('querystring');

/* 公寓信息列表 */
router.get("/list", function (req, res, next) {
  var building_num = req.query.building_num;
  var floor_num = req.query.floor_num;
  var room_num = req.query.room_num;
  var filter = {};
  if (building_num && floor_num) {
    filter.building_num = building_num;
    filter.floor_num = floor_num;
    if (room_num) filter.room_num = room_num;
    Departs.where(filter)
      .sort({room_num: 1})
      .exec(function (err, departs) {
        if (err) throw err;
        Buildings.find({}, function (err, buildings) {
          if (err) throw err;
          var floors = _.findWhere(buildings, {building_num: filter.building_num}).floors;
          res.render("departs/depart_list", {
            building_num: filter.building_num,
            floor_num: filter.floor_num,
            room_num: room_num,
            departs: departs,
            buildings: buildings,
            floors: floors
          });
        });
      });
  } else {
    Buildings.find({}, function (err, buildings) {
      if (err) throw err;
      res.render("departs/depart_list", {
        building_num: "1",
        floor_num: "1",
        room_num: "",
        departs: [],
        buildings: buildings,
        floors: buildings.length > 0 ? buildings[0].floors : []
      });
    });
  }
});

/* 添加公寓信息 */
router.get("/add", function (req, res, next) {
  res.render("departs/depart_add");
});

/* 保存公寓信息 */
router.post("/save", function (req, res, next) {
  var depart = req.body.depart;
  var building_num = depart.building_num;
  var room_num = depart.room_num;
  depart.floor_num = room_num.substring(0, room_num.length - 2);

  if (depart._id == null) {
    //相同楼号,房间号 不可以重复创建
    Departs.findOne({building_num: building_num, room_num: room_num}, function (err, depart_) {
      if (err) throw err;
      if (depart_) {
        res.json({result: "fail", msg: "房间号已存在, 请确认房间信息"});
      } else {
        Departs.create(depart, function (err, _depart) {
          if (err) throw err;
          //第一次添加该楼号,楼层 创建新的楼层信息
          Buildings.findOne({building_num: depart.building_num}, function (err, building) {
            if (err) throw err;
            if (building == null) {
              var _building = new Buildings();
              _building.building_num = depart.building_num;
              _building.floors.push(depart.floor_num);
              Buildings.create(_building, function (err, building_) {
                if (err) throw err;
                res.json({result: "success"});
              });
            } else {
              if (_.contains(building.floors, depart.floor_num) === false) {
                building.update({$push: {floors: depart.floor_num}}, function (err, building_) {
                  if (err) throw err;
                  res.json({result: "success"});
                });
              }
            }
          });
        });
      }
    });
  } else {
    Departs.findOne({building_num: building_num, room_num: room_num}, function (err, depart_) {
      if (err) throw err;
      if (depart_ && depart_._id != depart._id) {
        res.json({result: "fail", msg: "房间号已存在, 请确认房间信息"});
      } else {
        Departs.findOneAndUpdate({_id: depart._id}, depart, function (err, _depart) {
          if (err) throw err;
          //第一次添加该楼号,楼层 创建新的楼层信息
          Buildings.findOne({building_num: depart.building_num}, function (err, building) {
            if (err) throw err;
            if (building == null) {
              var _building = new Buildings();
              building.building_num = depart.building_num;
              building.floors.push(depart.floor_num);
              Buildings.create(_building, function (err, building_) {
                if (err) throw err;
              });
            } else {
              if (_.contains(building.floors, depart.floor_num) === false) {
                building.update({$push: {floors: depart.floor_num}}, function (err, building_) {
                  if (err) throw err;
                });
              }
            }
          });
          res.json({result: "success"});
        });
      }
    });
  }
});
/* 查看公寓信息 */
router.get("/info", function (req, res, next) {
  var depart_id = req.query.depart_id;
  Departs.findOne({_id: depart_id}, function (err, depart) {
    if (err) throw err;
    res.render("departs/depart_info", {depart: depart});
  });
});

/* 获取楼层信息 */
router.get("/getFloor", function (req, res, next) {
  var building_num = req.query.building_num;
  Buildings.findOne({building_num: building_num}, function (err, building) {
    if (err) throw err;
    res.render("departs/ajax_floor_list", {floors: building.floors});
  });
});

/* 入住前查询水电服务器状态 */
router.post("/getInterfaceInfo", function (req, res, next) {
  var depart_id = req.body.depart_id;
  Departs.findOne({_id: depart_id}, function (err, depart) {
    if (err) throw err;
    async.parallel({
        water: function (callback) {
          if (depart.water_code) {
            var params = querystring.stringify({certificate: certificate, hardwareID: depart.water_code});
            var url = config.urls.water + params;
            var data;
            http.get(url, function (response) { //请求水表数据
              response.on('data', function (chunk) {
                data = chunk;
              }).on('end', function () {
                try {
                  var msg = JSON.parse(data).message.replace(/\\/g, "");
                  var val = JSON.parse(msg).count;
                  if (isNaN(val)) throw new Error(msg);
                  else {
                    callback(null, val);
                  }
                } catch (e) {
                  LogUtil.record({
                    title: "水表服务器返回异常数据",
                    content: e.message,
                    type: "抄表失败"
                  });
                  callback(err, "water_err");
                }
              }).on('error', function (e) {
                LogUtil.record({
                  title: "水表服务器异常",
                  content: e.message,
                  type: "抄表失败"
                });
                callback(err, "water_err");
              });
            });
          } else {
            callback(null, "water_null");
          }
        },
        electric: function (callback) {
          if (depart.electric_code) {
            var params = querystring.stringify({addr: depart.electric_code});
            var url = config.urls.electric + params;
            var chunks = [], size = 0;
            http.get(url, function (response) {//请求电表数据
              response.on('data', function (chunk) {
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
                  else {
                    callback(null, val);
                  }
                } catch (e) {
                  var log = new Log();
                  log.title = "电表服务器返回异常数据";
                  log.content = e.message;
                  log.type = "抄表失败";
                  LogUtil.record(log);
                  callback(err, "electric_err");
                }
              }).on('error', function (e) {
                var log = new Log();
                log.title = "电表服务器异常";
                log.content = e.message;
                log.type = "抄表失败";
                LogUtil.record(log);
                callback(err, "electric_err");
              });
            });
          } else {
            callback(null, "electric_null");
          }
        }
      },
      function (err, results) {
        if (err) throw err;
        if (results.water == "water_err") {
          res.json({
            result: "fail",
            msg: "水表服务器数据异常，请稍候重试",
            electric_val: isNaN(results.electric) ? null : results.electric,
            water_val: null
          });
        } else if (results.water == "water_null") {
          res.json({
            result: "fail",
            msg: "未设置水表编号，此期间的用水量将不会产生费用",
            electric_val: isNaN(results.electric) ? null : results.electric,
            water_val: null
          });
        } else if (results.electric == "electric_err") {
          res.json({
            result: "fail",
            msg: "电表服务器数据异常，请稍候重试",
            water_val: isNaN(results.water) ? null : results.water,
            electric_val: null
          });
        } else if (results.electric == "electric_null") {
          res.json({
            result: "fail",
            msg: "未设置电表编号，此期间的用电量将不会产生费用",
            water_val: isNaN(results.water) ? null : results.water,
            electric_val: null
          });
        } else {
          res.json({result: "success", water_val: results.water, electric_val: results.electric});
        }
      });
  });
});

/* 跳转入住页面 */
router.get("/checkIn", function (req, res, next) {
  var depart_id = req.query.depart_id;
  var water_val = req.query.water_val;
  var electric_val = req.query.electric_val;

  Departs.findOne({_id: depart_id}, function (err, depart_) {
    if (err) throw err;
    res.render("departs/depart_check_in", {depart: depart_, water_val: water_val, electric_val: electric_val});
  });
});

/* 完成入住操作 */
router.post("/doCheckIn", function (req, res, next) {
  var depart = req.body.depart;
  var renter = req.body.renter;
  var water_val = req.body.water_val;
  var electric_val = req.body.electric_val;

  if (renter._id) {
    Departs.findOneAndUpdate({_id: depart._id}, {$push: {renters: renter._id}}, function (err, depart_) {
      if (err) throw err;
      Renters.findOneAndUpdate({_id: renter._id}, {$push: {departs: depart._id}}, function (err, renter_) {
        if (err) throw err;
        if (water_val != "null") {
          var fee = new Fee();
          fee.type = "water";
          fee.last_record = water_val;
          fee.depart = depart._id;
          fee.renter = renter_._id;
          Fee.create(fee, function (err, fee_) {
            if (err) throw err;
          });
        }
        if (electric_val != "null") {
          var fee = new Fee();
          fee.type = "electric";
          fee.last_record = electric_val;
          fee.depart = depart._id;
          fee.renter = renter_._id;
          Fee.create(fee, function (err, fee_) {
            if (err) throw err;
          });
        }
        res.json({result: "success", msg: depart_._id});
      });
    });
  } else {
    Renters.count({phone: renter.phone}, function (err, count) {
      if (err) throw err;
      if (count > 0) {
        res.json({result: "fail", msg: "手机号码已经注册，请勿重复"});
      } else {
        renter.departs = [];
        renter.departs.push(depart._id);
        Renters.create(renter, function (err, renter_) {
          if (err) throw err;
          Departs.findOneAndUpdate({_id: depart._id}, {
            $push: {renters: renter_._id}
          }, function (err, depart_) {
            if (err) throw err;
            if (water_val) {
              var fee = new Fee();
              fee.type = "water";
              fee.last_record = water_val;
              fee.depart = depart._id;
              fee.renter = renter_._id;
              Fee.create(fee, function (err, fee_) {
                if (err) throw err;
              });
            }
            if (electric_val) {
              var fee = new Fee();
              fee.type = "electric";
              fee.last_record = electric_val;
              fee.depart = depart._id;
              fee.renter = renter_._id;
              Fee.create(fee, function (err, fee_) {
                if (err) throw err;
              });
            }
            res.json({result: "success", msg: depart_._id});
          });
        });
      }
    });
  }
});

/* 跳转退租页面 */
router.get("/checkOut", function (req, res, next) {
  var depart_id = req.query.depart_id;
  var water_val = req.query.water_val;
  var electric_val = req.query.electric_val;

  Departs.findOne({_id: depart_id}, function (err, depart_) {
    if (err) throw err;
    async.parallel({
      water_fee: function (callback) {
        if (water_val != "null") {
          Fee.findOne({depart: depart_id, type: "water", accounted: 0})
            .sort({createdAt: -1})
            .exec(function (err, water_fee) {
              if (water_fee) callback(null, (water_val - water_fee.last_record) * config.rate.water);
              else callback(null, 0);
            });
        } else {
          callback(null, 0);
        }
      },
      electric_fee: function (callback) {
        if (electric_val != "null") {
          Fee.findOne({depart: depart_id, type: "electric", accounted: 0})
            .sort({createdAt: -1})
            .exec(function (err, electric_fee) {
              if (electric_fee) callback(null, (electric_val - electric_fee.last_record) * config.rate.electric)
              else callback(null, 0);
            });
        } else {
          callback(null, 0);
        }
      }
    }, function (err, results) {
      if (err) throw err;
      var balance = depart_.balance - results.water_fee - results.electric_fee;
      res.render("departs/depart_check_out", {
        depart: depart_,
        balance: balance,
        water_val: water_val,
        electric_val: electric_val
      });
    });
  });
});

/* 完成退租操作 */
router.post("/doCheckOut", function (req, res, next) {
  var depart_id = req.body.depart_id;
  var water_val = req.body.water_val;
  var electric_val = req.body.electric_val;
  Departs.findOneAndUpdate({_id: depart_id}, {balance: 0, renters: []}, function (err, depart_) {
    if (err) throw err;
    async.parallel({
      water: function (callback) {
        if (water_val != "null") {
          Fee.findOne({depart: depart_id, type: "water", accounted: 0})
            .sort({createdAt: -1})
            .exec(function (err, water_fee) {
              if (err) throw err;
              if (water_fee) {
                var amount = water_val - water_fee.last_record;
                var money = amount * config.rate.water;
                water_fee.update({
                  last_record: water_val,
                  amount: amount,
                  money: money,
                  accounted: 1
                }, function (err, water_fee_) {
                  if (err) throw err;
                  callback(null, null);
                });
              } else {
                callback(null, null);
              }
            });
        } else {
          callback(null, null);
        }
      },
      electric: function (callback) {
        if (electric_val != "") {
          Fee.findOne({depart: depart_id, type: "electric", accounted: 0})
            .sort({createdAt: -1})
            .exec(function (err, electric_fee) {
              if (err) throw err;
              if (electric_fee) {
                var amount = electric_val - electric_fee.last_record;
                var money = amount * config.rate.electric;
                electric_fee.update({
                  last_record: electric_val,
                  amount: amount,
                  money: money,
                  accounted: 1
                }, function (err, electric_fee_) {
                  if (err) throw err;
                  callback(null, null);
                });
              } else {
                callback(null, null);
              }
            });
        } else {
          callback(null, null);
        }
      }
    }, function (err, results) {
      if (err) throw err;
      async.every(depart_.renters, function (renter_id, callback) {
        Renters.findOneAndUpdate({_id: renter_id}, {$pull: {departs: depart_._id}}, function (err, renter_) {
          callback(null, !err);
        });
      }, function (err, result) {
        if (err) throw err;
        res.json({result: "success"});
      });
    });
  });
});

/* 查询公寓下所有入住用户 */
router.get("/renters", function (req, res, next) {
  var depart_id = req.query.depart_id;
  Departs.findOne({_id: depart_id})
    .populate({path: "renters"})
    .exec(function (err, depart_) {
      if (err) throw err;
      res.render("departs/renter_list", {depart: depart_});
    });
});

/* 跳转充值页面 */
router.get("/preRecharge", function (req, res, next) {
  var depart_id = req.query.depart_id;
  Departs.findOne({_id: depart_id})
    .exec(function (err, depart_) {
      if (err) throw err;
      res.render("departs/depart_recharge", {depart: depart_});
    });
});

/* 充值 */
router.post("/doRecharge", function (req, res, next) {
  var depart_id = req.body.depart_id;
  var money = req.body.money;
  Departs.findOneAndUpdate({_id: depart_id}, {$inc: {balance: money}}, function (err, depart_) {
    if (err) throw err;
    Recharge.create({money: money, depart: depart_id}, function (err, recharge) {
      if (err) throw err;
      if (depart_.balance + money > 0) {
        //此处加入开闸送电操作
        // 送电代码 上线时加入
        res.json({result: "success", msg: depart_.balance + parseFloat(money)});
      } else {
        res.json({result: "fail", msg: "您仍欠费:" + (depart_.balance + parseFloat(money)) + "元"});
      }
    });
  });
});

/* 查询充值记录. */
router.post('/rechargeHistory', function (req, res, next) {
  var depart_id = req.body.depart_id;
  var start = req.body.start;
  var end = req.body.end;
  var filter = {
    depart: depart_id,
    time: {$gt: start},
    time: {$lt: end}
  }
  Recharge.where(filter)
    .sort({time: -1})
    .exec(function (err, rechargeList) {
      if (err) throw err;
      res.render('departs/ajax_recharge_history', {
        rechargeList: rechargeList,
      });
    });
});

router.post("/sendPassword", function (req, res, next) {
  var depart_id = req.body.depart_id;
  var phone = req.body.phone;
  var flag = false; //身份认证标识 1: 通过 0: 未通过
  Departs.findOne({_id: depart_id})
    .populate({path: "renters", select: "phone -_id"})
    .exec(function (err, depart) {
      if (err) throw err;
      for (var i = 0; i < depart.renters.length; i++) {
        if (depart.renters[i].phone == phone) {
          try {
            // 正式上线后 解除注释
            /* var password = PasswordUtil.getTempPassword(depart);
             SMSUtil.sendSMS(phone, 17516, "#pwd#=" + password, function (data) {
             if (data.error_code == 0) {
             res.json({result: "success"});
             } else {
             res.json({result: "fail", msg: data.reason});
             }
             });*/
            res.json({result: "success"});
          } catch (e) {
            res.json({result: "fail", msg: "短信平台服务器异常, 请稍候重试"});
          }
          flag = true;
          break;
        }
      }
      if (flag == false) {
        if (req.session.me.phone == phone && depart.renters.length == 0) {
          try {
            // 正式上线后 解除注释
            /* var password = PasswordUtil.getTempPassword(depart);
             SMSUtil.sendSMS(phone, 17516, "#pwd#=" + password, function (data) {
             if (data.error_code == 0) {
             res.json({result: "success"});
             } else {
             res.json({result: "fail", msg: data.reason});
             }
             });*/
            res.json({result: "success"});
          } catch (e) {
            res.json({result: "fail", msg: "短信平台服务器异常, 请稍候重试"});
          }
        } else {
          res.json({result: "fail", msg: "此号码不属于本房间用户, 请确认后重试"});
        }
      }
    });
});

// 发新卡
router.post("/makeCard", function (req, res, next) {
  var depart_id = req.body.depart_id;
  var startTime = req.body.startTime;
  var endTime = req.body.endTime;
  var start = req.body.start;
  var end = req.body.end;
  var values = {
    $inc: {card_times: 1},
    startTime: startTime,
    endTime: endTime,
    start: start,
    end: end
  }
  Departs.findOneAndUpdate({_id: depart_id}, values, function (err, depart_) {
    if (err) throw err;
    var code = {
      num_0: hexRoom(depart_),
      num_1: hexTime(startTime),
      num_2: hexTime(endTime)
    }
    delete req.app.locals.code;
    req.app.locals.code = code;
    res.json({result: "success"});
  });
});

// 复制卡
router.post("/copyCard", function (req, res, next) {
  var depart_id = req.body.depart_id;
  Departs.findOne({_id: depart_id}, function (err, depart_) {
    if (err) throw err;
    if (depart_.start == "" || depart_.startTime == "") {
      res.json({result: "fail", msg: "初次发卡, 请选择发新卡"});
    } else {
      var code = {
        num_0: hexRoom(depart_),
        num_1: hexTime(depart_.startTime),
        num_2: hexTime(depart_.endTime)
      }
      delete req.app.locals.code;
      req.app.locals.code = code;
      res.json({result: "success"});
    }
  });
});

// 跳转添加用户页面
router.get("/addRenter", function (req, res, next) {
  var depart_id = req.query.depart_id;
  Departs.findOne({_id: depart_id}, function (err, depart_) {
    if (err) throw err;
    res.render("departs/depart_add_renter", {depart: depart_});
  });
});

// 房间添加用户
router.post("/doAddRenter", function (req, res, next) {
  var depart = req.body.depart;
  var renter = req.body.renter;
  var flag = false;           //重复标记 0: 重复 1: 未重复
  if (renter._id) {
    Departs.findOne({_id: depart._id})
      .select("renters -_id")
      .exec(function (err, depart_) {
        if (err) throw err;
        for (var key in depart_.renters) {
          if (depart_.renters[key] == renter._id) {
            flag = true;
            break;
          }
        }
        if (flag) {
          res.json({result: "fail", msg: "该用户已是本房间人员"});
        } else {
          Departs.findOneAndUpdate({_id: depart._id}, {
            $push: {renters: renter._id}
          }, function (err, depart_) {
            if (err) throw err;
            Renters.findOneAndUpdate({_id: renter._id}, {$push: {departs: depart._id}}, function (err, renter_) {
              if (err) throw err;
              res.json({result: "success", msg: depart_._id});
            });
          });
        }
      });
  } else {
    Renters.count({phone: renter.phone}, function (err, count) {
      if (err) throw err;
      if (count > 0) {
        res.json({result: "fail", msg: "手机号码已存在, 请勿重复注册"});
      } else {
        renter.departs = [];
        renter.departs.push(depart._id);
        Renters.create(renter, function (err, renter_) {
          if (err) throw err;
          Departs.findOneAndUpdate({_id: depart._id}, {
            $push: {renters: renter_._id}
          }, function (err, depart_) {
            if (err) throw err;
            res.json({result: "success", msg: depart_._id});
          });
        });
      }
    });
  }
});

/* 删除单个入住人员，最后一个人员只能通过退租实现删除. */
router.post('/removeRenter', function (req, res, next) {
  var depart_id = req.body.depart_id;
  var renter_id = req.body.renter_id;
  Departs.findOne({_id: depart_id}, function (err, depart_) {
    if (err) throw err;
    if (depart_.renters.length == 1) {
      res.json({result: "fail", msg: "不能删除最后的用户, 请进行退租操作"});
    } else {
      Departs.findOneAndUpdate({_id: depart_id}, {"$pull": {renters: renter_id}}, function (err, depart_) {
        if (err) throw err;
        Renters.findOneAndUpdate({_id: renter_id}, {"$pull": {departs: depart_id}}, function (err, renter) {
          if (err) throw err;
          res.json({result: "success"});
        });
      });
    }
  });
});

/* 断电. */
router.get('/switchOff', function (req, res, next) {
  var depart_id = req.query.depart_id;
  var flag = false;
  Departs.findOne({_id: depart_id}, function (err, depart) {
    if (err) throw err;
    var url = config.urls.switch + querystring.stringify({open_close: 2, uuid: depart.electric_code});
    http.get(url, function (chunks) {
      chunks.on('data', function (data) {
        if (data == "提交成功") {
          flag = true;
        }
      }).on('end', function () {
        if (flag == true) {
          depart.update({switch: 0}, function (err, depart_) {
            if (err) throw err;
            res.json({result: "success"});
          });
        } else {
          res.json({result: "fail", msg: "断电操作失败"});
        }
      }).on('error', function (e) {
        LogUtil.record({
          title: "电表服务器异常",
          content: e.message,
          type: "断电操作失败"
        });
        res.json({result: "fail", msg: "电表服务器异常, 断电操作失败"});
      });
    });
  });
});

/* 送电. */
router.get('/switchOn', function (req, res, next) {
  var depart_id = req.query.depart_id;
  var flag = false;
  Departs.findOne({_id: depart_id}, function (err, depart) {
    if (err) throw err;
    var url = config.urls.switch + querystring.stringify({open_close: 1, uuid: depart.electric_code});
    http.get(url, function (chunks) {
      chunks.on('data', function (data) {
        if (data == "提交成功") {
          flag = true;
        }
      }).on('end', function () {
        if (flag == true) {
          depart.update({switch: 1}, function (err, depart_) {
            if (err) throw err;
            res.json({result: "success"});
          });
        } else {
          res.json({result: "fail", msg: "送电操作失败"});
        }
      }).on('error', function (e) {
        LogUtil.record({
          title: "电表服务器异常",
          content: e.message,
          type: "送电操作失败"
        });
        res.json({result: "fail", msg: "电表服务器异常, 送电操作失败"});
      });
    });
  });
});

// 弹出断电模态框
router.get("/addRenter", function (req, res, next) {
  var depart_id = req.query.depart_id;
  Departs.findOne({_id: depart_id}, function (err, depart_) {
    if (err) throw err;
    res.render("departs/depart_add_renter", {depart: depart_});
  });
});

// 弹出断电模态框
router.get("/showSwitchOffModal", function (req, res, next) {
  var depart_id = req.query.depart_id;
  Departs.findOne({_id: depart_id}, function (err, depart_) {
    if (err) throw err;
    res.render("departs/modal_switch_off", {depart: depart_});
  });
});

// 弹出送电模态框
router.get("/showSwitchOnModal", function (req, res, next) {
  var depart_id = req.query.depart_id;
  Departs.findOne({_id: depart_id}, function (err, depart_) {
    if (err) throw err;
    res.render("departs/modal_switch_on", {depart: depart_});
  });
});

// 弹出发卡模态框
router.get("/showCardModal", function (req, res, next) {
  var depart_id = req.query.depart_id;
  Departs.findOne({_id: depart_id}, function (err, depart_) {
    if (err) throw err;
    res.render("departs/modal_make_card", {depart: depart_});
  });
});

// 弹出临时密码模态框
router.get("/showTempPwdModal", function (req, res, next) {
  var depart_id = req.query.depart_id;
  Departs.findOne({_id: depart_id}, function (err, depart_) {
    if (err) throw err;
    res.render("departs/modal_temp_pwd", {depart: depart_});
  });
});

// 弹出退租提示模态框
router.get("/showCheckOutModal", function (req, res, next) {
  res.render("departs/modal_check_out");
});

// 弹出入住提示模态框
router.get("/showWarningModal", function (req, res, next) {
  res.render("departs/modal_warning");
});

// 跳转历史账单页面
router.get("/bills", function (req, res, next) {
  var depart_id = req.query.depart_id;
  Departs.findOne({_id: depart_id}, function (err, depart_) {
    if (err) throw err;
    res.render("departs/depart_bills", {depart: depart_});
  });
});

// 跳转历史账单页面
router.get("/getBills", function (req, res, next) {
  var keyword = req.query.keyword;
  var depart_id = req.query.depart_id;
  var type = req.query.type;
  Fee.find({depart: depart_id, type: type, accounted: 1})
    .where("from")
    .gt(keyword + "-01")
    .where("to")
    .lt(keyword + "-31")
    .exec(function (err, fees) {
      if (fees.length > 0) {
        var date = _.map(_.pluck(fees, "from"), function (value) {
          return value.substr(8, 2);
        });
        var amount = _.pluck(fees, "amount");
        var money = _.pluck(fees, "money");
        var total_amount = _.reduce(amount, function (memo, value) {
          return memo + value;
        }, 0);
        var total_money = _.reduce(money, function (memo, value) {
          return memo + value;
        }, 0);
        res.json({
          result: "success",
          date: date,
          amount: amount,
          money: money,
          total_amount: total_amount,
          total_money: total_money
        });
      } else {
        res.json({result: "fail"});
      }
    });
});

function lpad(str, num) {
  for (var i = 0; i < num; i++) {
    str = "0" + str;
  }
  return str.substr(str.length - num, num);
}

function hexTime(date) {
  var result = "";
  for (var i = 0; i < date.length; i += 2) {
    var str = parseInt(date[i] + date[i + 1]).toString(16);
    if (str.length == 1) {
      str = "0" + str;
    }
    result += str;
  }
  result = result + "00000000000000000000";
  return result;
}

function hexRoom(depart) {
  var result = "";
  var obj = "010" + lpad(depart.building_num, 2) + lpad(depart.room_num, 3);
  for (var i = 0; i < obj.length; i++) {
    var str = parseInt(obj[i]).toString(16);
    if (str.length == 1) {
      str = "0" + str;
    }
    result += str;
  }
  if (parseInt(depart.card_times).toString(16).length == 1) result += "0";
  result = result + parseInt(depart.card_times).toString(16) + "00000000000000";
  return result;
}

module.exports = router;
