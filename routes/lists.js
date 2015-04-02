var express = require('express'); 
var	passport = require('passport'); 
var	TwitterStrategy = require('passport-twitter').Strategy;
var expressSession = require('express-session');

var router = express.Router();

router.get('/partials/:name', function(req, res) {
	console.log("into the router for partials");
	var name = req.params.name;
	res.render('partials/' + name);
});

router.get('*', function(req, res) {
	console.log("TURACO_DEBUG - within node router for lists");
	if (req.session.user == null){
		res.redirect('/');
	}
	if (req.user == null){
		res.render('lists', { title: 'Turaco', login_status: false, topnav_section : 1});
	}else{
		res.render('lists', { title: 'Turaco', login_status: true, "user" : req.user });
	}
});

module.exports = router;