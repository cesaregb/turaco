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
		if (!global.userInfoLoaded){
			var gatherInfoInstance = new loginGatherInfoUser();
			gatherInfoInstance.getAll(req.user, req.session, function(err, data){
				if (err){
					console.log("TURACO_DEBUG - ERROR in gatherInfoInstance.getAll " );
				}else{
					global.userInfoLoaded = true;
					console.log("TURACO_DEBUG - Success gatherInfoInstance.getAll" );
				}
				res.render('index_logged', { title: 'Turaco', login_status: true, "user" : req.user });
			});
		}else{
			res.render('index_logged', { title: 'Turaco', login_status: true, "user" : req.user });
		}
	}
});

router.get('/reload_user', ensureAuthenticated, function(req, res) {
	console.log("TURACO_DEBUG - ROUTES /reload_user");
	console.log("TURACO_DEBUG - calling GET_ALL from index.js and reload_user ");
	var gatherInfoInstance = new loginGatherInfoUser();
	gatherInfoInstance.getAll(req.user, req.session, function(err, data){
		if (err){
			console.log("TURACO_DEBUG - ERROR in gatherInfoInstance.getAll " );
		}else{
			global.userInfoLoaded = true;
			console.log("TURACO_DEBUG - Success gatherInfoInstance.getAll" );
		}
		res.render('index_logged', { title: 'Turaco', login_status: true, "user" : req.user });
	});
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

router.get('/lists', ensureAuthenticated, function(req, res) {
	console.log("TURACO_DEBUG - ROUTES /list/*");
	res.render('index_logged', { title: 'Turaco', login_status: true, "user" : req.user });
});


// ************************************* 
router.get('/account', ensureAuthenticated, function(req, res) {
	res.render('account', {
		"user" : req.user
	});
});

router.get('/login', function(req, res) {
	res.render('login', {
		"user" : req.user
	});
});

router.get('/auth/twitter', passport.authenticate('twitter'), function(req, res) {
	// The request will be redirected to Twitter for authentication, so this
	// function will not be called.
});

router.get('/auth/twitter/callback', passport.authenticate('twitter', {
	failureRedirect : '/error'
}), function(req, res) {
	/* LOGIN successful, web container side. */
	console.log("TURACO_DEBUG - user successfuly loged ");
	console.log("TURACO_DEBUG - getting basic information into session ");
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
		created : {"$gte": today }
	}).sort({created: 'desc'}).exec(function(err, sessionObj) {
		if(sessionObj == null || err){
			var gatherInfoInstance = new loginGatherInfoUser();
			console.log("TURACO_DEBUG - calling GET_ALL from routes index.js after passport");
			gatherInfoInstance.getAll(req.user, req.session, function(err, data){
				if (err){
					console.log("TURACO_DEBUG - ERROR in gatherInfoInstance.getAll " );
				}else{
					global.userInfoLoaded = true;
					console.log("TURACO_DEBUG - Success gatherInfoInstance.getAll" );
				}
				res.redirect('/');
			});
		}else{
			global.userInfoLoaded = true;
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
	req.logout();
	req.session.destroy()
	res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
	var _method = "ensureAuthenticated";
	console.log("IN " + fileName + " - " + _method);
	
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/')
}

module.exports = router;