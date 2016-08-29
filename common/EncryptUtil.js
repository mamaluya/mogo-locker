var crypto = require("crypto");


var param = {
  alg: 'des-cbc',
  autoPad: true,
  key: '19860604',
  iv: "12345678"
};

function encrypt(text) {
  var cipher = crypto.createCipheriv(param.alg, param.key, param.iv);
  cipher.setAutoPadding(param.autoPad);
  var ciph = cipher.update(text, 'utf8', 'base64');
  ciph += cipher.final('base64');
  return ciph;
}

function decrypt(text) {
  var decipher = crypto.createDecipheriv(param.alg, param.key, param.iv);
  decipher.setAutoPadding(param.autoPad);
  var txt = decipher.update(text, 'base64', 'utf8');
  txt += decipher.final('utf8');
  return txt;
}


exports.encrypt = encrypt;
exports.decrypt = decrypt;