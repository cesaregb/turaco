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
		var gatherInfoInstance = new loginGatherInfoUser();
		gatherInfoInstance.getAll(req.user, req.session, function(err, data){
			if (err){
				console.log("TURACO_DEBUG - error gettin the user basic information " );
			}else{
				console.log("TURACO_DEBUG - user information gather complete.");
			}
			
		});
		console.log('**** User loggeed: ' + req.user.username);
		res.render('index', { title: 'Turaco', login_status: true, "user" : req.user });
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
//	var gatherInfoInstance = new loginGatherInfoUser();
//	gatherInfoInstance.getAll(user, req.session, function(err, data){});
	
	if(false){
		console.log("getting lists...");
		var twit = twitterController(user.token, user.tokenSecret);
		twit.verifyCredentials(function(err, data) {
			if (err){
				console.error("Err: " + err);
				return;
			}
		}).getLists(user.screen_name, function(err, data) {
			if (err){ 
				console.error("Err: " + err);
				return;
			}
			var listCollection = {};
			var response = {};
			response.timestamp = Date.now; 
			response.items = []; 
			List.find({'uid': user.uid}, function(err, lists){
				if (err) {
					return console.error(err);
				} else{
					for (item in lists){
						lists[item].active = 0;
						lists[item].save();
					}
				}
			});
			for (pos in data){
				(function(item){
					var list = new List();
					list = listHelpers.convertJson2List(list, item, user.uid);
					listCollection[list.id] = true;
					List.findOne({id: list.id}, function(err, listInDatabase) {
						if (listInDatabase){
							list.category = listInDatabase.category;
							listInDatabase.active = 1;
							listInDatabase.save();
						}else{
							list.category = 0; // get default category.
							list.save(function (err) {
								if (!err) console.log('Saved list Success!');
							});
						};
					});
					response.items.push(list);
				})(data[pos]);
			}
		});
	}
	res.redirect('/');
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