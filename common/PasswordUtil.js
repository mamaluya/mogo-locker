function getPassword(disperse) {
  var str = "", building_num = disperse.building_num, room_num = disperse.room_num;
  var date = new Date();
  var vi = 0x87115069;
  var y1 = parseInt(date.getFullYear() / 100).toString(16);
  var y2 = parseInt(date.getFullYear() % 100).toString(16);
  var month = parseInt(date.getMonth() + 1).toString(16);
  if (month.length == 1) month = 0 + month;
  var day = parseInt(date.getDate()).toString(16);
  if (day.length == 1) day = 0 + day;

  if (building_num.length == 1) {
    building_num = "0" + building_num;
  }
  if (room_num.length < 3) {
    room_num = "000" + room_num;
    room_num = room_num.substr(room_num.length - 3, 3);
  }
  var mcu = "010" + building_num + room_num;
  console.log("date:" + "0x" + y1 + y2 + month + day);
  console.log("mcu:" + "0x" + mcu);
  console.log("vi:" + vi);
  var tempStr = ((parseInt("0x" + y1 + y2 + month + day) ^ parseInt("0x" + mcu) ^ vi) >>> 0).toString();
  console.log(tempStr);
  if (tempStr.length < 8) {
    tempStr = "00000000" + tempStr;
    str = tempStr.substr(tempStr.length - 8, 8);
  } else {
    str = tempStr.substr(0, 8);
  }
  console.log(str);
  return str;
}

function getTempPassword(disperse) {
  var vi = 0x87115069;
  var date = new Date();
  var room_num = lpad(disperse.room_num, 3);
  var building_num = lpad(disperse.building_num, 2);
  var mcu = "0x010" + building_num + room_num;
  var y1 = parseInt(date.getFullYear() / 100).toString(16);
  var y2 = parseInt(date.getFullYear() % 100).toString(16);
  var month = lpad(parseInt(date.getMonth() + 1).toString(16), 2);
  var day = lpad(parseInt(date.getDate()).toString(16), 2);
  var tempStr = ((parseInt("0x" + month + day + y1 + y2) ^ parseInt(mcu) ^ vi) >>> 0).toString(16);
  var str = lpad(tempStr, 8);
  var password = parseInt("0x" + str.substr(6, 2) + str.substr(4, 2) + str.substr(2, 2) + str.substr(0, 2));
  //console.log(date, mcu.toString(16), parseInt("0x" + str).toString(16), password, lpad(password, 8));
  return lpad(password, 8);
}

function lpad(str, num) {
  if(num == 2) str = "00" + str;
  else if(num == 3) str = "000" + str;
  else if(num == 8) str = "00000000" + str;
  return str.substr(str.length - num, num);
}

exports.getPassword = getPassword;
exports.getTempPassword = getTempPassword;