var buffers = [];
var size = 0;
readStream.on('data', function (chunk) {
  buffers.push(chunk);
  nread += chunk.length;
});
readStream.on('end', function () {
  var data = null;
  switch (buffers.length) {
    case 0:
      data = new Buffer(0);
      break;
    case 1:
      data = buffers[0];
      break;
    default:
      data = new Buffer(size);
      for (var i = 0, pos = 0, l = buffers.length; i < l; i++) {
        var chunk = buffers[i];
        chunk.copy(data, pos);
        pos += chunk.length;
      }
      break;
  }
});