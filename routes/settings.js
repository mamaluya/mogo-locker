var express = require('express');
var router = express.Router();
var Rate = require('../models/rate');
var Log = require('../models/log');
var config = require('../config');


/* 跳转至水电价设置页面 */
router.get('/info', function (req, res, next) {
  Rate.findOne({}, function (err, rate) {
    if (err) throw err;
    if (rate) {
      res.render('settings/settings_info', {rate: rate});
    } else {
      res.render('settings/settings_info', {rate: config.rate});
    }
  });
});

/* 保存水电价设置 */
router.post('/save', function (req, res, next) {
  var rate = req.body.rate;
  if (rate._id) {
    Rate.findOneAndUpdate({_id: rate._id}, rate, function (err, rate_) {
      if (err) throw err;
      config.rate = rate;
      res.json({result: "success"});
    });
  } else {
    Rate.create(rate, function (err, rate_) {
      if (err) throw err;
      config.rate = rate;
      res.json({result: "success"});
    });
  }
});

/* 系统日志 记录外部接口调用失败等信息 */
router.get('/log', function (req, res, next) {
  Log.find()
    .sort({createdAt: -1})
    .limit(20)
    .exec(function (err, logs) {
      if (err) throw err;
      res.render('settings/settings_log', {logs: logs});
    });
});

module.exports = router;