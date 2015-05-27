var express = require('express'); 
var	passport = require('passport'); 
var	util = require('util');
var expressSession = require('express-session');

//express helpers 
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//databse configuration
var mongoose = require('mongoose');
var configDB = require('./config/database');
var passportConfig = require('./config/passport');
mongoose.connect(configDB.url);
var appCredentials = require('./config/appCredentials');
initEnvVars();
passportConfig(passport);

//routes helpers 
var routes = require('./routes/index');
var routesListsApi = require('./routes/api/listsApi');
var routesUsersApi = require('./routes/api/usersApi');

//modules
var User = require('./app/models/user');
var List = require('./app/models/list');
var SessionObjects = require('./app/models/sessionObjects');

//twitter api helper
var loginGatherInfoUser = require('./lib/loginGatherInfoUser');
var twitterController = require('./config/TwitterController');

//response helpsers
var json_api_responses = require('./config/responses')(); //TODO integrate me with turaco errors
var turacoError = require('./config/error_codes'); //TODO ADD MORE CODES
var error_codes = turacoError.error_codes; //TODO WTF

var app = express();

var fileName = "app.js";

global.dev_mode = false;
global.load_for_dev = false;
global.success = "01";
global.error = "02";
global.warn = "03";
global.usersInProgress = {};
global.refresSessionObject = {};
global.refreshSessionTries = {};
var inProxy = false;

if(inProxy){
	var globalTunnel = require('global-tunnel');
	globalTunnel.initialize({
		host : 'www-proxy.us.oracle.com',
		port : 80
	});
}


app.set('views', path.join(__dirname, 'views'))
	.set('view engine', 'jade')
	.use(favicon())
	.use(logger('dev'))
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({ extended: false }))
	.use(cookieParser())
	.use(require('method-override')())
	.use(expressSession({ 
		secret:'keyboard cat',
		cookie: {
			maxAge  : new Date(Date.now() + 3600000),
			expires : new Date(Date.now() + 3600000)
		}
	}))
	.use(passport.initialize())
	.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));
app.disable('etag');

app.use(function (req, res, next) {
    req.root = req.protocol + '://' + req.get('host') + '/';
    next();
});

function initEnvVars(){ // initialize environment
	if (process.env.CALLBACK_URL != null){
		global.CALLBACK_URL = process.env.CALLBACK_URL;
	}else{
		global.CALLBACK_URL = appCredentials.CALLBACK_URL;
	}
	if (process.env.TWITTER_CONSUMER_KEY != null){
		global.TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
	}else{
		global.TWITTER_CONSUMER_KEY = appCredentials.TWITTER_CONSUMER_KEY;
	}
	if (process.env.TWITTER_CONSUMER_SECRET != null){
		global.TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;
	}else{
		global.TWITTER_CONSUMER_SECRET = appCredentials.TWITTER_CONSUMER_SECRET;
	}
	if (process.env.DEV_MODE != null){
		global.DEV_MODE = process.env.DEV_MODE;
	}
	console.log("TURACO_DEBUG - Global Vars: \n" + global.CALLBACK_URL + "\n" + global.TWITTER_CONSUMER_KEY + "\n" + global.TWITTER_CONSUMER_SECRET);
}

app.use(function(req, res, next) {
	// This is for the api calls 
	if (req.url.indexOf("api") > 0){
		res.locals.jsonType = true;
		if (!req.accepts('json')){
			res.locals.jsonType = false;
		}
		res.contentType('application/json');
	}
	
	req.on("close", function() {
		console.log("TURACO_DEBUG - Client closed the request.... ");
    });
	
	function checkLoadData(user, session, callback){
		console.log("TURACO_DEBUG - IN  checkLoadData");
		
		var userProgress = (global.usersInProgress[user.uid] != null)? global.usersInProgress[user.uid] : null;
		if (userProgress != null && userProgress.completed){
			console.log("TURACO_DEBUG - checkLoadData if TRUE");
			
			var refreshMe = (global.refresSessionObject[user.uid] != null)||(session.refresSessionObject);
			if (refreshMe){ // after the applicatoin save the information in the next request we store the info in the session.
				console.log("TURACO_DEBUG - checkLoadData RefreshMe TRUE");
		
				global.refresSessionObject[user.uid] = null;
				session.user_lists = null;
				session.usersListHash = null;
				session.completeListsObject = null;
				session.friends = null;
				session.savedSearches = null;
				SessionObjects.findOne({
					'uid' : user.uid
				}).sort({created: 'desc'}).exec(function(err, sessionObj) {
					if(sessionObj == null || err){
						callback("Error User's session not found \n sessionObject " + sessionObj + " \n err:" + err);
					}else{
						global.refresSessionObject[user.uid] = null
						session.refresSessionObject = false;
				
						if (sessionObj.friends != null){
							var friends = sessionObj.friends;
							friends.complete_users = null;
							session.friends = friends;
						}else{
							session.friends = null;
						}
						session.usersListHash = sessionObj.usersListHash; 
						session.user_lists = sessionObj.lists; 
						session.savedSearches = sessionObj.savedSearches; 
						callback(null);				
					}
				});
			}else{
				callback(null);
			}
		}else{
			callback("Loading user in progress");
		}
	}
	
	var session = req.session;
	if (!global.dev_mode){
		if (session.user == null){
			next();
		}else{
			if (req.url.indexOf("check_user_loading") > 0){
				next();
			} else{
				checkLoadData(session.user, session, function(err){
					if (err){
						var user_uid = session.user.uid;
						// remove any possible existing information. 
						if (false){ // we skip the possible erros.. instead we remove existing user information and 
							res.render('error', {
								message : err,
								error : {}
							});
						}
					}
					next();
				});
			}
		}
	}else{// dev mode 
		if (session.user == null){
//			var id = "14347292"; //beto
			var id = "36063580"; //cesar
//			var id = "42261512"; // joel
			global.refresSessionObject[id] = null;
			session.refresSessionObject = true;
 			User.findOne({"uid": id}, function(err, u){
				req.user = u;
				session.user = u;
				if (global.load_for_dev){
					global.usersInProgress[u.uid] = null;
				}else{
					global.usersInProgress[u.uid] = {
						completed : true,
						percent : 100
					};
				}
				
				if (req.url.indexOf("check_user_loading") > 0){
					next();
				}else{
					checkLoadData(session.user, session, function(err){
						if (err){
							console.log("TURACO_DEBUG - ERROR checkLoadData " + err);
						}
						next();
					});
				}
				
			});
		}else{
			req.user = session.user;
			if (req.url.indexOf("check_user_loading") > 0){
				next();
			}else{
				checkLoadData(session.user, session, function(err){
					if (err){
						console.log("TURACO_DEBUG - ERROR checkLoadData " + err);
					}
					next();
				});
			}
		}
	}
});

/***** Views */
app.use('/', routes);
//app.use('/list', routesLists);

/***** Services */
function requireAuthenticationAPI(req, res, next) {
	if (req.session.user != null) {
		var userProgress = (global.usersInProgress[uid] != null)? global.usersInProgress[uid] : null;
		if (userProgress != null && userProgress.error == true){
			req.session.userLoadingError = 0;
			var uid = req.user.uid;
			List.remove({uid: uid}, function(err) {
				if (!err){console.log("Lists deleted. ");}else{	console.log("error deleting lists: " + err);}
			});
			SessionObjects.remove({uid: uid}, function(err) {
				if (!err){console.log("Session Object ");}else{	console.log("error deleting Session Objects: " + err);}
			});
			
			global.usersInProgress[req.user.uid] = null; //initialize the loading process 
			var gatherInfoInstance = new loginGatherInfoUser();
			gatherInfoInstance.getAll(req.user, req.session, function(err, data){
				if (err){
					console.log("TURACO_DEBUG - ERROR in gatherInfoInstance.getAll: " + err);
				}else{
					console.log("TURACO_DEBUG - Success gatherInfoInstance.getAll" );
				}
			});
			return res.json(json_api_responses.error(error_codes.PROBLEM_LOADING_TWITTER_INFO, userProgress));
		}else if (userProgress != null ){
			return res.json(json_api_responses.error(error_codes.DATA_LOADING, userProgress));
		}else{
			return next();
		}
	}else{
		return res.json(json_api_responses.error(error_codes.USER_NOT_LOGED));
	}
}

app.all('/api/*', requireAuthenticationAPI);
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
		message : "Something went wrong..",
		error : {}
	});
});

module.exports = app;
