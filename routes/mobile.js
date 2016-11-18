var express = require('express');
var router = express.Router();
var md5 = require('md5');
var Renters = require('../models/renters');

/* 验证身份信息. */
router.post('/verifyPhone', function (req, res, next) {
    var phone = req.body.phone;
    var password = req.body.password;
    var filter = {phone: phone, ID_Card: password};
    Renters.findOne(filter, function (err, renter) {
        if (renter) {
            res.json({result: "success"});
        } else {
            res.json({result: "fail"});
        }
    });
});

/* 退出登录. */
router.get('/roomList', function (req, res, next) {
    var phone = req.query.phone;
    var filter = {phone: phone};
    Renters.findOne(filter)
        .populate({path: "departs"})
        .exec(function (err, renter) {
            console.log(renter);
            if (renter && renter.departs.length > 0) {
                res.json({array: renter.departs});
            } else {
                res.json({array: []});
            }
        });
});

module.exports = router;
