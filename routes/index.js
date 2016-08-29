var express = require('express');
var router = express.Router();
var async = require('async');
var _ = require('underscore');
var md5 = require('md5');
var Admins = require('../models/admins');
var Settings = require('../models/settings');
var Departs = require('../models/departs');
var Renters = require('../models/renters');

/* 主页. */
router.get('/', function (req, res, next) {
  res.render('index');
});

/* 保存主题颜色配置. */
router.post('/setSettings', function (req, res, next) {
  var settings = req.body.settings;
  Settings.findOneAndUpdate({_id: req.session.me.settings._id}, settings, function (err, _settings) {
    if (err) throw err;
    req.session.me.settings = _.extend(_settings, settings);
    res.end();
  });
});

// 弹出修改密码模态框
router.get("/showChangePwdModal", function (req, res, next) {
  res.render("modal_change_pwd");
});

/* 修改密码. */
router.post('/changePwd', function (req, res, next) {
  var oldPwd = req.body.oldPwd;
  var newPwd = req.body.newPwd;
  var filter = {
    _id: req.session.me._id,
    password: md5(oldPwd)
  }
  Admins.findOneAndUpdate(filter, {password: md5(newPwd)}, function (err, _admin) {
    if (err) throw err;
    if (_admin == null) {
      res.json({result: "fail", msg: "原密码有误，请确认后重试"});
    } else {
      res.json({result: "success"});
    }
  });
});

// 弹出身份验证模态框
router.get("/showVerifyPwdModal", function (req, res, next) {
  res.render("modal_verify_pwd");
});

// 验证密码
router.post("/verifyPwd", function (req, res, next) {
  var oldPwd = req.body.oldPwd;
  var filter = {
    _id: req.session.me._id,
    password: md5(oldPwd)
  }
  Admins.findOne(filter, function (err, admin_) {
    if (admin_ == null) {
      res.json({result: "fail", msg: "密码有误，请确认后重试"});
    } else {
      res.json({result: "success"});
    }
  });
});

// 跳转个人信息页面
router.get("/getPersonalInfo", function (req, res, next) {
  res.render("personal_info", {admin: req.session.me});
});

// 修改个人信息
router.post("/savePersonalInfo", function (req, res, next) {
  var admin = req.body.admin;
  var filter = {
    _id: req.session.me._id
  }
  Admins.findOneAndUpdate(filter, admin, function (err, admin_) {
    if (err) throw err;
    req.session.me = _.extend(req.session.me, admin);
    res.json({result: "success"});
  });
});

// 公寓概览 饼图
router.get("/getSummary", function (req, res, next) {
  async.parallel({
    depart_off: function (callback) {
      Departs.where("renters")
        .size(0)
        .count(function (err, count) {
          if (err) throw err;
          callback(null, count);
        });
    },
    depart_on: function (callback) {
      Departs.find()
        .$where('this.renters.length > 0')
        .count(function (err, count) {
          if (err) throw err;
          callback(null, count);
        });
    },
    renter_off: function (callback) {
      Renters.where("departs")
        .size(0)
        .count(function (err, count) {
          if (err) throw err;
          callback(null, count);
        });
    },
    renter_on: function (callback) {
      Renters.find()
        .$where('this.departs.length > 0')
        .count(function (err, count) {
          if (err) throw err;
          callback(null, count);
        });
    },
  }, function (err, results) {
    res.json({
      depart_off: results.depart_off,
      depart_on: results.depart_on,
      depart_all: results.depart_off + results.depart_on,
      renter_off: results.renter_off,
      renter_on: results.renter_on,
      renter_all: results.renter_off + results.renter_on
    });
  });
});

module.exports = router;
