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
var proxy = require('express-http-proxy');
passportConfig(passport);

var routes = require('./routes/index');
var routesLists = require('./routes/lists');
var routesListsApi = require('./routes/api/listsApi');
var routesUsersApi = require('./routes/api/usersApi');
var User = require('./app/models/user');
var List = require('./app/models/list');
var twitterController = require('./config/TwitterController');

var app = express();

var globalTunnel = require('global-tunnel');

//globalTunnel.initialize();

globalTunnel.initialize({
	host : 'www-proxy.us.oracle.com',
	port : 80
});

//globalTunnel.initialize({
//	host : '127.0.0.1',
//	port : 8081
//});

//globalTunnel.end();

//var httpProxy = require('http-proxy');
//var apiProxy = httpProxy.createProxyServer();
//app.get("/api/*", function(req, res){ 
//  apiProxy.web(req, res, { target: 'http://google.com:80' });
//});

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

app.use(function (req, res, next) {
    req.root = req.protocol + '://' + req.get('host') + '/';
    next();
});

app.enable('trust proxy');

app.use(function(req, res, next) {
	if (req.url.indexOf("api") > 0){
		res.locals.jsonType = true;
		if (!req.accepts('json')){
			res.locals.jsonType = false;
			console.log("Application specified to accept json");
		}
		res.contentType('application/json');
	}
	
	/* DEV MODE ON*/
	if (req.session.user == null){
		User.findOne({"uid": "36063580"}, function(err, u){ /*gettin user cesaregb*/
			/* get information from twitter service... */
			req.user = u;
			req.session.user = u;
			next();
		});
	}else{
		console.log("Getting TURACO USER from session.")
		req.user = req.session.user;
		next();
	}
});

/***** Views */
app.use('/', routes);
app.use('/lists', routesLists);

/***** Services */
app.use('/api/lists', routesListsApi);
app.use('/api/users', routesUsersApi);


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

//app.use('/proxy', proxy('http://wpad/wpad.dat', {
//	forwardPath: function(req, res) {
//		return require('url').parse(req.url).path;
//	}
//}));

module.exports = app;

