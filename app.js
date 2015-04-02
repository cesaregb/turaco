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
var SessionObjects = require('./app/models/sessionObjects');
var twitterController = require('./config/TwitterController');

var loginGatherInfoUser = require('./lib/loginGatherInfoUser');

var app = express();

global.dev_mode = true;
global.userInfoLoaded = false;
global.success = "01";
global.error = "02";
global.warn = "03";


var globalTunnel = require('global-tunnel');
//globalTunnel.initialize();
//globalTunnel.initialize({
//	host : 'www-proxy.us.oracle.com',
//	port : 80
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
app.disable('etag');

app.use(function (req, res, next) {
    req.root = req.protocol + '://' + req.get('host') + '/';
    next();
});

app.use(function(req, res, next) {
	if (req.url.indexOf("api") > 0){
		res.locals.jsonType = true;
		if (!req.accepts('json')){
			res.locals.jsonType = false;
		}
		res.contentType('application/json');
	}
	
	var session = req.session;
	
//	global.verify_credentials = session.verify_credentials;
	
	function checkLoadData(user, callback){
		if (global.refresSessionObject){
			session.user_lists = null;
			session.usersListHash = null;
			session.completeListsObject = null;
			session.friends = null;
			session.savedSearches = null;
			SessionObjects.findOne({
				'uid' : user.uid
			}).sort({created: 'desc'}).exec(function(err, sessionObj) {
				if(sessionObj == null || err){
					console.log("TURACO_DEBUG - Error loading information from database when user exists...");
					console.log("Loading it from the services.. this takes some time... ");
					var gatherInfoInstance = new loginGatherInfoUser();
					gatherInfoInstance.getAll(req.user, req.session, function(err, data){
						if (err){
							console.log("TURACO_DEBUG - ERROR in gatherInfoInstance.getAll " );
						}else{
							global.userInfoLoaded = true;
							console.log("TURACO_DEBUG - Success gatherInfoInstance.getAll" );
						}
						callback(err);
					});
				}else{
					global.userInfoLoaded = true;
					session.friends = sessionObj.friends;
					session.usersListHash = sessionObj.usersListHash; 
					session.completeListsObject = sessionObj.completeListsObject;
					session.user_lists = sessionObj.lists; 
					session.savedSearches = sessionObj.savedSearches; 
					callback(null);				
				}
			});
		}else{
			callback(null);
		}
	}
	
	if (!global.dev_mode){
		if (req.session.user == null){
			next();
		}else{
			checkLoadData(req.session.user, function(err){
				if (err){
					console.log("TURACO_DEBUG - ERROR checkLoadData ");
				}
				next();
			});
		}
	}else{// dev mode 
		if (req.session.user == null){
			global.refresSessionObject = true;
			var id = "36063580"; //cesar
//			var id = "1710981037";
			User.findOne({"uid": id}, function(err, u){
				req.user = u;
				req.session.user = u;
				checkLoadData(req.session.user, function(err){
					if (err){
						console.log("TURACO_DEBUG - ERROR checkLoadData ");
					}
					next();
				});
				
			});
		}else{
			req.user = req.session.user;
			checkLoadData(req.session.user, function(err){
				if (err){
					console.log("TURACO_DEBUG - ERROR checkLoadData ");
				}
				next();
			});
		}
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

/*
 * session.user_lists 			= [] 
 * session.usersListHash 		= {lists: []}
 * session.completeListsObject 	= { [hash<uid, boolean>] }
 * session.friends 				= {friends_count, users: []}
 * global.refresSessionObject	= true||false
 * global.savedSearches			= []
 * */

module.exports = app;

