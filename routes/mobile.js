var express = require('express');
var router = express.Router();
var md5 = require('md5');
var Renters = require('../models/renters');

/* 登录. */
router.get('/', function (req, res, next) {
    res.render('login');
});

/* 验证登录信息. */
router.post('/verifyPhone', function (req, res, next) {
    var phone = req.body.username;
    var ID_card = req.body.password;
    var filter = {phone: phone, password: ID_card};
    Renters.findOne(filter, function (err, renter) {
        if (renter) {
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
