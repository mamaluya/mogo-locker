var express = require('express');
var router = express.Router();
var Renters = require('../models/renters');
var config = require('../config');

/* 跳转到添加用户页面. */
router.get('/add', function (req, res, next) {
  res.render('renters/renter_add');
});

/* 跳转到用户信息. */
router.get('/info', function (req, res, next) {
  var renter_id = req.query.renter_id;
  Renters.findOne({_id: renter_id}, function (err, renter) {
    if (err) throw err;
    res.render('renters/renter_info', {renter: renter});
  });
});

/* 用户列表. */
router.get('/list', function (req, res, next) {
  var renter_id = req.query.renter_id;
  var keyword = req.query.keyword;
  if (renter_id) {
    Renters.find({_id: renter_id}, function (err, renters) {
      if (err) throw err;
      res.render('renters/renter_list', {
        renters: renters
      });
    });
  } else if (keyword) {
    Renters.where({})
      .or([{nickname: new RegExp(keyword)}, {phone: new RegExp(keyword)}])
      .sort({updatedAt: -1})
      .exec(function (err, renters) {
        if (err) throw err;
        res.render('renters/renter_list', {
          renters: renters,
          keyword: keyword
        });
      });
  } else {
    res.render('renters/renter_list', {renters: []});
  }
});

/* 保存用户. */
router.post('/save', function (req, res, next) {
  var renter = req.body.renter;
  if (renter._id == null) {
    Renters.findOne({phone: renter.phone}, function (err, renter_) {
      if (renter_) {
        res.json({result: "fail", msg: "手机号码已存在, 请勿重复注册"});
      } else {
        Renters.create(renter, function (err, renter_) {
          if (err) throw err;
          res.json({result: "success", msg: renter_._id});
        });
      }
    });
  } else {
    Renters.findOne({phone: renter.phone}, function (err, renter_) {
      if (renter_ && renter_._id != renter._id) {
        res.json({result: "fail", msg: "手机号码已存在, 请勿重复注册"});
      } else {
        Renters.findOneAndUpdate({_id: renter._id}, renter, function (err, renter_) {
          if (err) throw err;
          res.json({result: "success", msg: renter_._id});
        });
      }
    });
  }
});

/* 通过姓名手机号模糊查询租客*/
router.post('/searchRenter', function (req, res, next) {
  var matchInfo = req.body.matchInfo;
  var items = req.body.items;
  var regEx = [];
  regEx.push({nickname: new RegExp(matchInfo)});
  regEx.push({phone: new RegExp(matchInfo)});
  Renters.where({})
    .or(regEx)
    .limit(items)
    .sort({createdAt: -1})
    .select('nickname')
    .exec(function (err, renters) {
      if (err) throw err;
      res.json(renters);
    });
});

module.exports = router;
