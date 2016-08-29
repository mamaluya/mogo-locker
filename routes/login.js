var express = require('express');
var router = express.Router();
var md5 = require('md5');
var Admins = require('../models/admins');

/* 登录. */
router.get('/', function (req, res, next) {
  res.render('login');
});

/* 验证登录信息. */
router.post('/login', function (req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  var filter = {username: username, password: md5(password)};
  Admins.findOne(filter)
    .populate({path: "settings"})
    .exec(function (err, admin) {
      if (admin != null) {
        req.session.me = admin;
        res.json({result: "success"});
      } else {
        res.json({result: "fail"});
      }
    });
});

/* 退出登录. */
router.get('/logOut', function (req, res, next) {
  delete req.session.me;
  delete req.app.locals.me;
  res.redirect('/');
});

/* 发卡 */
router.get("/getCode", function (req, res, next) {
  if (req.app.locals.code) res.json(req.app.locals.code);
  else res.json({result: "fail", msg: "请先到平台页面填写制卡信息并点击发卡按钮"});
});

module.exports = router;
