var express = require('express'); 
var	passport = require('passport'); 
var	TwitterStrategy = require('passport-twitter').Strategy;
var expressSession = require('express-session');
var twitterController = require('../config/TwitterController');
var listHelpers = require('../utils/list_helpers');
var User = require('../app/models/user');
var List = require('../app/models/list');
var loginGatherInfoUser = require('../lib/loginGatherInfoUser');

var router = express.Router();

router.get('/', function(req, res) {
	if (req.user == null){
		console.log('**** User not loggeed');
		res.render('index', { title: 'Turaco', login_status: false});
	}else{
		if (!global.userInfoLoaded){
			var session = req.session;
			var gatherInfoInstance = new loginGatherInfoUser();
			gatherInfoInstance.getAll(req.user, req.session, function(err, data){
				if (err){
					console.log("TURACO_DEBUG - error gettin the user basic information " );
				}else{
					console.log("TURACO_DEBUG - user information gather complete.");
				}
				console.log('**** User loggeed: ' + req.user.username);
				res.render('index', { title: 'Turaco', login_status: true, "user" : req.user });
			});
		}
//		console.log('**** User loggeed: ' + req.user.username);
//		res.render('index', { title: 'Turaco', login_status: true, "user" : req.user });
	}
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
	/* load initial information */
	var gatherInfoInstance = new loginGatherInfoUser();
	gatherInfoInstance.getAll(user, req.session, function(err, data){
		if (err){
			console.log("TURACO_DEBUG - error getting initial information from twitter authentication.. ");
		}
		global.userInfoLoaded = true;
		res.redirect('/');
	});
	
});

router.get('/logout', function(req, res) {
	req.logout();
	req.session.destroy()
	res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/login')
}

module.exports = router;