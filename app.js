var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoose = require('mongoose');

var config = require('./config');

var index = require('./routes/index');
var login = require('./routes/login');
var departs = require('./routes/departs');
var renters = require('./routes/renters');
var settings = require('./routes/settings');

var app = express();

// connect mongodb
var dbUrl = config.db.url;
mongoose.connect(dbUrl);

// session
var mongoStore = require('connect-mongo')(session);
app.use(session({
  secret: 'locker',
  resave: false,
  saveUninitialized: true,
  store: new mongoStore({
    url: dbUrl,
    collection: 'sessions'
  })
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', login);
app.use(function(req, res, next){
  if (req.session.me) {
    app.locals.me = req.session.me;
    next();
  } else {
    res.redirect("/");
  }
});

app.use('/index', index);
app.use('/departs', departs);
app.use('/renters', renters);
app.use('/settings', settings);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
