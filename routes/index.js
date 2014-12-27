var express = require('express'); 
var	passport = require('passport'); 
var	TwitterStrategy = require('passport-twitter').Strategy;
var expressSession = require('express-session');

var router = express.Router();

router.get('/', function(req, res) {
	if (req.user == null){
		console.log('**** User not loggeed');
		res.render('index', { title: 'Turaco', login_status: false});
	}else{
		console.log('**** User loggeed: ' + req.user.username);
		res.render('index', { title: 'Turaco', login_status: true, "user" : req.user });
	}
});

router.get('/helloworld', function(req, res) {
    res.render('helloworld', { title: 'Hello, World!' });
});

router.get('/requirejs/', function(req, res) {
	res.render('helloworld', { title: 'Hello, World!' });
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