var http = require("http");
var querystring = require("querystring");
var LogUtil = require("./LogUtil")
var config = require("../config");

function getVerifyCode() {
  var postData = querystring.stringify({
    coding: "JDKM15AA4EE9A6E34EB581D8D4EE58271234",
    account: "mogu",
    password: "mo!@#gu",
    verifycode: "5E5058382B86310CE76FA2981FCAF77EAE535593"
  });

  var options = {
    hostname: 'api.fycpu.com',
    port: 80,
    path: '/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length
    }
  };

  var req = http.request(options, function (res) {
    console.log('STATUS:' + res.statusCode);
    console.log('HEADERS:' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (data) {
      try {
        certificate = JSON.parse(data).message;
        console.log('BODY:' + data);
      }catch (e) {
        LogUtil.record({
          title: "水表服务器异常",
          content: e.message,
          type: "无法获取验证码"
        });
      }
    });
    res.on('end', function () {
      console.log('No more data in response.');
    });
  });

  req.on('error', function (e) {
    console.log('problem with request:' + e.message);
  });

// write data to request body
    req.write(postData);
    req.end();
}

function init() {
  getVerifyCode();
  setInterval(getVerifyCode, 3600000);
}

exports.getVerifyCode = getVerifyCode;
exports.init = init;