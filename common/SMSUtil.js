var http = require("http");
var querystring = require("querystring");

function sendSMS(mobile, tpl_id, tpl_value, callback) {
  var paramData = querystring.stringify({
    mobile: mobile,
    tpl_id: tpl_id,
    tpl_value: tpl_value,
    key: "00a93936b051a08c8a8cdf230197110b"
  });

  var url = "http://v.juhe.cn/sms/send?" + paramData;
  http.get(url, function (res) {//请求水表数据
    console.log('STATUS:' + res.statusCode);
    console.log('HEADERS:' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (data) {
      console.log('BODY:' + data);
      callback(data);
    });
    res.on('end', function () {
      console.log('No more data in response.');
    });
  });
  //callback({"reason": "运营商网络异常, 发送失败", "result": [], "error_code": 205404});
}
exports.sendSMS = sendSMS;