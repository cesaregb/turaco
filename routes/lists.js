var express = require('express'); 
var	passport = require('passport'); 
var	TwitterStrategy = require('passport-twitter').Strategy;
var expressSession = require('express-session');

var router = express.Router();

router.get('/partials/:name', function(req, res) {
	var name = req.params.name;
	res.render('partials/' + name);
});

router.get('*', function(req, res) {
	if (req.user == null){
		res.render('lists', { title: 'Turaco', login_status: false});
	}else{
		res.render('lists', { title: 'Turaco', login_status: true, "user" : req.user });
	}
});

	


module.exports = router;