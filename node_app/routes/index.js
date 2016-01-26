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

var windowsSize = true;

var viewParams = { title: 'Turaco', login_status: false, "user" : null };

router.get('*', function(req, res, next) {
	res.locals = {
		topMenuOption : '1'
	};
	windowsSize = true;
	if (req.session.windowsSize != null && (req.session.windowsSize == 0 || req.session.windowsSize == "0")){
		windowsSize = false;
	}
	viewParams = { title: 'Turaco', login_status: req.isAuthenticated(), "user" : req.user, windowsSize: windowsSize }
	next();
});

router.get('/', function(req, res) {
	if (req.isAuthenticated()) {
		res.redirect('/home')
	}else{
		res.render('index', viewParams);
	}
});

router.get('/home', ensureAuthenticated, function(req, res) {
	if (req.user == null){
		res.render('index', { title: 'Turaco', login_status: false, windowsSize: windowsSize});
	}else{
		if (global.load_for_dev){
			var gatherInfoInstance = new loginGatherInfoUser();
			gatherInfoInstance.getAll(req.user, req.session, function(err, data){
				if (err){
					console.log("TURACO_DEBUG - ERROR in gatherInfoInstance.getAll: " + err);
				}else{
					console.log("TURACO_DEBUG - Success gatherInfoInstance.getAll" );
				}
			});
			res.render('index_logged', viewParams);
		}else{
			res.render('index_logged', viewParams);
		}
	}
});

router.get('/reload_user', ensureAuthenticated, function(req, res) {
	global.usersInProgress[req.user.uid] = null; //initialize the loading process 
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
	var name = req.params.name;
	res.render('partials/' + name, viewParams);
});

router.get('/lists/*', ensureAuthenticated, function(req, res) {
	res.render('index_logged', viewParams);
});

function commonHandler(req, res) {
	res.render('index_logged', viewParams);
}

router.get('/lists', ensureAuthenticated, commonHandler);
router.get('/copy_list', ensureAuthenticated, commonHandler);
router.get('/copy_list/*', ensureAuthenticated, commonHandler);
router.get('/copy_list_home', ensureAuthenticated, commonHandler);
router.get('/view_user_lists', ensureAuthenticated, commonHandler);

router.get('/contact', function(req, res){
	res.render('contact', viewParams);
});

router.get('/faq', function(req, res){
	res.render('faq', viewParams);
});

router.get('/help', function(req, res){
	res.render('help', viewParams);
});

router.get('/about', function(req, res){
	res.render('about', viewParams);
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
		created : {"$gte": yesterday, "$lt": today}
	}).sort({created: 'desc'}).exec(function(err, sessionObj) {
		if(sessionObj == null || err){
			session.loadingInfo = true;
			res.redirect('/');
			var gatherInfoInstance = new loginGatherInfoUser();
			gatherInfoInstance.getAll(req.user, req.session, function(err, data){
				if (err){
					console.log("TURACO_DEBUG - ERROR in gatherInfoInstance.getAll: " + err);
				}else{
					console.log("TURACO_DEBUG - Success gatherInfoInstance.getAll" );
				}
			});
		}else{
			global.usersInProgress[user.uid] = {
				completed : true,
				percent : 100
			};
			var friends = sessionObj.friends;
			friends.complete_users = null;
			session.friends = friends;
			session.usersListHash = sessionObj.usersListHash; 
			session.user_lists = sessionObj.lists; 
			session.savedSearches = sessionObj.savedSearches; 
			res.redirect('/');		
		}
	});
});

router.get('/logout', function(req, res) {
	global.usersInProgress[req.session.user.uid] = null; //initialize the loading process
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