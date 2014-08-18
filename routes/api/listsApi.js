var express = require('express');
var router = express.Router();
var twitterController = require('../../config/TwitterController');
var error_codes = require('../../config/error_codes');
var twitter = require('ntwitter');
var User = require('../../app/models/user');

router.get('/', function(req, res) {
	var _user = null;
	if (req.user != null){
		_user = req.user;
	}
	_user = { uid: "36063580" };
	if (_user == null){
		res.json(error_codes.ACCESS_USER_ERROR);
	}else{
		User.findOne({uid: _user.uid}, function(err, user) {
			if(user) {
				var twit = twitterController(user.token, user.tokenSecret);
				twit.verifyCredentials(function(err, data) {
					if (err){
						res.json(error_codes.SERVICE_ERROR);
						//TODO Notify error to admin
						console.log("Verification failed : " + err);
					}
				}).getLists(user.username, function(err, data) {
					if (!err){
						res.json(data);
					}
				});
			}else{
				res.json(error_codes.SERVICE_ERROR);
			}
		});
		
	}
});

/* ************************* */
/* ************************* */
var Todo = require('../../app/models/todo');
router.get('/todos', function(req, res) {
	Todo.find(function(err, todos) {
		if (err)
			res.send(err);
		res.json(todos); // return all todos in JSON format
	});
});

router.post('/todos', function(req, res) {

	// create a todo, information comes from AJAX request from Angular
	Todo.create({
		text : req.body.text,
		done : false
	}, function(err, todo) {
		if (err)
			res.send(err);

		// get and return all the todos after you create another
		Todo.find(function(err, todos) {
			if (err)
				res.send(err)
			res.json(todos);
		});
	});

});

router.delete('/todos/:todo_id', function(req, res) {
	Todo.remove({
		_id : req.params.todo_id
	}, function(err, todo) {
		if (err)
			res.send(err);

		// get and return all the todos after you create another
		Todo.find(function(err, todos) {
			if (err)
				res.send(err)
			res.json(todos);
		});
	});
});


module.exports = router;
