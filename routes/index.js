var express = require('express'); 
var	passport = require('passport'); 
var	TwitterStrategy = require('passport-twitter').Strategy;
var expressSession = require('express-session');
var twitterController = require('../config/TwitterController');
var listHelpers = require('../utils/list_helpers');
var User = require('../app/models/user');
var List = require('../app/models/list');
var SessionObjects = require('../app/models/sessionObjects');
var loginGatherInfoUser = require('../lib/loginGatherInfoUser');

var fileName = "routes/index.js";

var router = express.Router();

router.get('*', function(req, res, next) {
	res.locals = {
		topMenuOption : '1'
	};
	next();
});

router.get('/', function(req, res) {
	console.log("TURACO_DEBUG - ROUTES /");
	if (req.isAuthenticated()) {
		res.redirect('/home')
	}else{
		res.render('index', { title: 'Turaco', login_status: false});
	}
});

router.get('/home', ensureAuthenticated, function(req, res) {
	console.log("TURACO_DEBUG - ROUTES /home");
	if (req.user == null){
		res.render('index', { title: 'Turaco', login_status: false});
	}else{
		console.log("TURACO_DEBUG - global.load_for_dev: " +  global.load_for_dev);
		if (global.load_for_dev){
			var gatherInfoInstance = new loginGatherInfoUser();
			gatherInfoInstance.getAll(req.user, req.session, function(err, data){
				if (err){
					console.log("TURACO_DEBUG - ERROR in gatherInfoInstance.getAll: " + err);
				}else{
					console.log("TURACO_DEBUG - Success gatherInfoInstance.getAll" );
				}
			});
			res.render('index_logged', { title: 'Turaco', login_status: true, "user" : req.user });
		}else{
			res.render('index_logged', { title: 'Turaco', login_status: true, "user" : req.user });
		}
	}
});

router.get('/reload_user', ensureAuthenticated, function(req, res) {
	console.log("TURACO_DEBUG - ROUTES /reload_user");
	console.log("TURACO_DEBUG - calling GET_ALL from index.js and reload_user ");
	
	global.usersInProgress[user.uid] = null; //initialize the loading process 
	
	var gatherInfoInstance = new loginGatherInfoUser();
	gatherInfoInstance.getAll(req.user, req.session, function(err, data){
		if (err){
			console.log("TURACO_DEBUG - ERROR in gatherInfoInstance.getAll: " + err);
		}else{
			console.log("TURACO_DEBUG - Success gatherInfoInstance.getAll" );
		}
	});
	res.redirect('/home');
});

router.get('/partials/:name', function(req, res) {
	console.log("TURACO_DEBUG - ROUTES /partials/:name");
	var name = req.params.name;
	res.render('partials/' + name);
});

router.get('/lists/*', ensureAuthenticated, function(req, res) {
	console.log("TURACO_DEBUG - ROUTES /list/*");
	res.render('index_logged', { title: 'Turaco', login_status: true, "user" : req.user });
});

function commonHandler(req, res) {
	res.render('index_logged', { title: 'Turaco', login_status: true, "user" : req.user });
}

router.get('/lists', ensureAuthenticated, commonHandler);
router.get('/copy_list', ensureAuthenticated,commonHandler);
router.get('/copy_list/*', ensureAuthenticated,commonHandler);
router.get('/copy_list_home', ensureAuthenticated,commonHandler);
router.get('/view_user_lists', ensureAuthenticated,commonHandler);

router.get('/contact', function(req, res){
	res.render('contact', { title: 'Turaco', login_status: req.isAuthenticated(), "user" : req.user });
});

router.get('/faq', function(req, res){
	res.render('faq', { title: 'Turaco', login_status: req.isAuthenticated(), "user" : req.user });
});

router.get('/help', function(req, res){
	res.render('help', { title: 'Turaco', login_status: req.isAuthenticated(), "user" : req.user });
});

router.get('/about', function(req, res){
	res.render('about', { title: 'Turaco', login_status: req.isAuthenticated(), "user" : req.user });
});


// ************************************* 
router.get('/login', function(req, res) {
	res.redirect('/auth/twitter');
});

router.get('/auth/twitter', passport.authenticate('twitter'), function(req, res) {
	// The request will be redirected to Twitter for authentication, so this
	// function will not be called.
});

router.get('/auth/twitter/callback', passport.authenticate('twitter', {
	failureRedirect : '/error'
}), function(req, res) {
	/* LOGIN successful, web container side. */
	var user = req.user;
	var session = req.session;
	session.user = req.user; 
	/* load initial information */
	var today = new Date();
	var yesterday = new Date(today.getTime()-1000*60*60*24*1)
	
	session.user_lists = null;
	session.usersListHash = null;
	session.completeListsObject = null;
	session.friends = null;
	session.savedSearches = null;
	SessionObjects.findOne({
		'uid' : user.uid,
		created : {"$gte": yesterday }
	}).sort({created: 'desc'}).exec(function(err, sessionObj) {
		if(sessionObj == null || err){
			session.loadingInfo = true;
			res.redirect('/');
			//gather info is made async... 
			var gatherInfoInstance = new loginGatherInfoUser();
			console.log("TURACO_DEBUG - Login -> Start gather info process ");
			gatherInfoInstance.getAll(req.user, req.session, function(err, data){
				if (err){
					console.log("TURACO_DEBUG - ERROR in gatherInfoInstance.getAll: " + err);
//					res.render('error', {
//						message : err,
//						error : {}
//					});
				}else{
					console.log("TURACO_DEBUG - Success gatherInfoInstance.getAll" );
				}
			});
		}else{
			console.log("TURACO_DEBUG - Login -> Data loaded from database session in time range...");
			global.usersInProgress[user.uid] = {
				completed : true,
				percent : 100
			};
			session.friends = sessionObj.friends;
			session.usersListHash = sessionObj.usersListHash; 
			session.completeListsObject = sessionObj.completeListsObject;
			session.user_lists = sessionObj.lists; 
			session.savedSearches = sessionObj.savedSearches; 
			res.redirect('/');		
		}
	});
});

router.get('/logout', function(req, res) {
	console.log("TURACO_DEBUG - within logout");
	req.logout();
	req.session.destroy(function(err) {
		res.redirect('/');
	});
});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/')
}

module.exports = router;