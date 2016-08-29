var http = require('http');
var url = "http://112.124.19.201:620/setCommand/control_intefer.action?open_close=1&uuid=00000013215410";

function requestWithTimeout(options, callback) {
  var request = http.get(options, function (response) {
    var response_timer = setTimeout(function () {
      console.log("timeout");
      response.destroy();
      callback({errCode: '500', msg: 'CTI服务资源响应超时!'});
      //return false;
    }, 3000);

    var chunks = [], size = 0;
    response.on('data', function (chunk) {
      console.log("Got response: " + response.statusCode);
      chunks.push(chunk);
      size += chunk.length;
    });

    response.on('end', function () {
      clearTimeout(response_timer);
      console.log("end");
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
      if (data.toString()) {
        var res_data = JSON.parse(data.toString());
        callback(res_data);
      }
    });
  }).on('error', function (e) {
    //clearTimeout(request_timer);
    callback({errCode: '501', msg: e.message});
  });

  request.on()

  request.setTimeout(5000, function () {
    callback({errCode: '404'});
    request.emit('timeout');
  });
}

requestWithTimeout(url, function (res) {
  console.log(res);
});
