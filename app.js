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
	// This is for the api calls 
	if (req.url.indexOf("api") > 0){
		res.locals.jsonType = true;
		if (!req.accepts('json')){
			res.locals.jsonType = false;
		}
		res.contentType('application/json');
	}
	
	function checkLoadData(user, session, callback){
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
					var gatherInfoInstance = new loginGatherInfoUser();
					console.log("TURACO_DEBUG - calling GET_ALL from app.js");
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
	
	var session = req.session;
	if (!global.dev_mode){
		if (session.user == null){
			next();
		}else{
			checkLoadData(session.user, session, function(err){
				if (err){
					console.log("TURACO_DEBUG - ERROR checkLoadData ");
				}
				next();
			});
		}
	}else{// dev mode 
		if (session.user == null){
			global.refresSessionObject = true;
//			var id = "36063580"; //cesar
			var id = "1710981037";
			User.findOne({"uid": id}, function(err, u){
				req.user = u;
				session.user = u;
				checkLoadData(session.user, session, function(err){
					if (err){
						console.log("TURACO_DEBUG - ERROR checkLoadData ");
					}
					next();
				});
				
			});
		}else{
			req.user = session.user;
			checkLoadData(session.user, session, function(err){
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
//app.use('/list', routesLists);

/***** Services */
function requireAuthenticationAPI(req, res, next) {
	var _method = "requireAuthenticationAPI";
	console.log("IN " + fileName + " - " + _method);
	if (req.session.user != null) {
		return next();
	}else{
		return res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR));
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

console.log("TURACO_DEBUG - app.get('env'): " + app.get('env'));
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

/*
 * session.user_lists 			= [] 
 *	all the users that are in lists!! 
 * session.usersListHash 		= {lists: []}
 * session.completeListsObject 	= { [hash<uid, boolean>] }
 * session.friends 				= {friends_count, users: []}
 * global.refresSessionObject	= true||false
 * global.savedSearches			= []
 * */

/*
 * 
db.sessionobjects.find();
db.sessionobjects.find({'completeListsObject.lists.name':"Test", 'completeListsObject.lists.list_users.screen_name':"Trevornoah"}, {"completeListsObject.lists.$" : 1});
db.sessionobjects.find({'completeListsObject.lists.name':"Test"}, {"completeListsObject.lists.$" : 1});
db.sessionobjects.find({'friends.users.screen_name':"Shevlis"}, {"friends.users.$" : 1});
db.sessionobjects.find({"friends.complete_users": {$exists : "13348"}}, {"friends.complete_users" : 1});
var myCursor = db.sessionobjects.find(null, {"friends.complete_users" : 1});
var myDocument = myCursor.hasNext() ? myCursor.next() : null;
if (myDocument) {
    var hashedList = myDocument.friends.complete_users;
    for (var i in hashedList) {
        if (hashedList.hasOwnProperty(i) && hashedList[i].screen_name == "VivirGDL" ) {
        if (hashedList.hasOwnProperty(i) && i == "13348" ) {
            print(i + " == " + tojson(hashedList[i]));
        }
    }
}
 * 
 */