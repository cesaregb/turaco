var express = require('express'); 
var	passport = require('passport'); 
var	util = require('util');
var expressSession = require('express-session');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var configDB = require('./config/database');
var passportConfig = require('./config/passport');

mongoose.connect(configDB.url);

passportConfig(passport);

var routes = require('./routes/index');
var lists = require('./routes/lists');
var listsApi = require('./routes/api/listsApi');

var proxy = require('express-http-proxy');

var app = express();

app.set('views', path.join(__dirname, 'views'))
	.set('view engine', 'jade')
	.use(favicon())
	.use(logger('dev'))
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({ extended: false }))
	.use(cookieParser())
	.use(require('method-override')())
	.use(expressSession({ secret:'keyboard cat' }))
	.use(passport.initialize())
	.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
	if (req.url.indexOf("api") > 0){
		res.locals.jsonType = true;
		if (!req.accepts('json')){
			res.locals.jsonType = false;
			console.log("Application specified to accept json");
		}
		res.contentType('application/json');
	}
	next();
});

/***** Views */
app.use('/', routes);
app.use('/lists', lists);

/***** Services */
app.use('/api/lists', listsApi);


app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

if (app.get('env') === 'development') {
	app.locals.pretty = true;
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message : err.message,
			error : err
		});
	});
}

app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message : err.message,
		error : {}
	});
});

app.use('/proxy', proxy('http://wpad/wpad.dat', {
	forwardPath: function(req, res) {
		return require('url').parse(req.url).path;
	}
}));

module.exports = app;

