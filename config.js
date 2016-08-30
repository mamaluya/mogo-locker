var config = {
  db: {
    url: "mongodb://localhost/mogo-locker"
  },

  // 抄表 参数配置中不要出现 00
  record: {
    switch: 0,
    hour: 20,
    minute: 01
    //second: 01
    //dayOfMonth: 1
  },

  // 欠费短信提醒 参数配置中不要出现 00
  balance: {
    switch: 0,
    hour: 18,
    minute: 44
    //second: 00,
    //dayOfMonth: 1
  },

  // 每月帐单 参数配置中不要出现 00
  bill: {
    switch: 0,
    hour: 17,
    minute: 31
    //second: 00,
    //dayOfMonth: 1
  },

  rate: {
    water: 10,
    electric: 1.38
  },

  urls: {
    electric: 'http://112.124.19.201:6200/tc_pay/read_val.action?',  //参数addr 电表编号
    switch: 'http://112.124.19.201:6200/setCommand/control_intefer.action?',  //参数open_close 1:送电、2断电 uuid: 电表编号
    water: 'http://api.fycpu.com/datalist?'		//参数certificate 授权码 hardwareID 水表编号
  },

  sms: {
    switch: 1,
    pwd: 17516,
    bill: 17465,
    balance: 17464
  }

}

module.exports = config;