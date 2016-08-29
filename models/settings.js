var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var SettingsSchema = new Schema({
  layoutOption : {type: String, default: "fluid"},
  headerOption : {type: String, default: "fixed"},
  sidebarOption : {type: String, default: "default"},
  footerOption : {type: String, default: "default"},
  sidebar : {type: String, default: ""},
  color : {type: String, default: "default"}
});

var Settings = mongoose.model('Settings', SettingsSchema);

module.exports = Settings;