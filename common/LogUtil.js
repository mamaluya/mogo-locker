var Logs = require('../models/log');

/*增删改操作日志同步数据库 */
function record(log){
    //数据库操作
    Logs.create(log, function(err, log){
        if (err) throw err;
    });
}

exports.record = record;