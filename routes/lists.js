var express = require('express');
var router = express.Router();
var twitterController = require('../config/TwitterController');
var twitter = require('ntwitter');
var User = require('../app/models/user');

router.get('/', function(req, res) {
	var _user = null;
//	var user = null;
	if (req.user != null){
		_user = req.user;
	}
	_user = {
			uid: "36063580"
	};
	if (_user == null){
		res.json({
			message : 'User not logged please login1'
		});
	}else{
		console.log("USER id: " + _user.uid);
		
		User.findOne({uid: _user.uid}, function(err, user) {
			if(user) {
				var twit = twitterController(
						user.token, user.tokenSecret);
				
				console.log("Username: " + user.username);
				
				twit.verifyCredentials(function(err, data) {
					console.log("Verifying Credentials...");
					if (err){
						console.log("Verification failed : " + err)
						res.json({
							message : 'UPS something went wrong.!! '
						});
					}
				}).getLists(user.username, function(err, data) {
					console.log("Timeline Data Returned.... \n data: " + data);
					var view_data = {
							"timeline" : JSON.stringify(data)
					}
					console.log("Exiting Controller.");
					res.json(view_data);
				});
			}else{
				res.json({
					message : 'User not logged please login1'
				});
			}
		});
		
	}

	
});


module.exports = router;
