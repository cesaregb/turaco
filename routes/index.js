var express = require('express'); 
var	passport = require('passport'); 
var	TwitterStrategy = require('passport-twitter').Strategy;
var expressSession = require('express-session');

var router = express.Router();

router.get('/', function(req, res) {
	if (req.user == null){
		console.log('User not loggeed')
//		res.redirect('/auth/twitter');
	}else{
//		res.render('index', { title: 'Express', "user" : req.user });
	}
	res.render('index', { title: 'Turaco'});
});

router.get('/helloworld', function(req, res) {
    res.render('helloworld', { title: 'Hello, World!' });
});

//router.get('/userList', function (req, res){
//	res.render('helloworld', { title: 'Hello, World!' });
//	var db = req.db;
//	var collection = db.get('usercollection');
//	collection.find({},{}, function (e, docs){
//		res.render('userlist', {
//			"userlist" : docs
//		});
//	});
//});
//
//router.get('/newuser', function(req, res){
//	res.render('newuser', {title: 'Add New User' });
//});
//
//router.post('/adduser', function(req, res){
//	res.render('helloworld', { title: 'Hello, World!' });
//	var db = req.db;
//	var userName = req.body.username;
//	var userEmail = req.body.useremail;
//	var collection = db.get('usercollection');
//	collection.insert({
//		"username" : userName,
//		"email" : userEmail
//	}, function (err, doc){
//		if (err){
//			res.send("There was a problem adding  the information to the database.");
//		}else{
//			res.location("userlist");
//			res.redirect("userlist");
//		}
//	});
//});

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
	res.redirect('/');
});

router.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/login')
}

module.exports = router;