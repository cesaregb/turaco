var express = require('express');
var router = express.Router();
var twitterController = require('../../config/TwitterController');
var helpers = require('../../config/helpers');
var error_codes = require('../../config/error_codes');
var twitter = require('ntwitter');
var User = require('../../app/models/user');
var List = require('../../app/models/list');

router.get('/:uid', function(req, res) {
	console.log("WITHIN request " + res.locals.jsonType);
//	var uid = req.params.uid;
	uid = 36063580;
	if (uid == null){
//		res.json(error_codes.ACCESS_USER_ERROR);
		uid = 36063580;
	}else{
		User.findOne({uid: uid}, function(err, user) {
			if(user) {
				var twit = twitterController(user.token, user.tokenSecret);
				twit.verifyCredentials(function(err, data) {
					if (err){
						res.json(error_codes.SERVICE_ERROR);
						// TODO Notify error to admin
						console.log("Verification failed : " + err);
					}
				}).getLists(user.username, function(err, data) {
					if (!err){
						var listCollection = {};
						var response = {};
						response.timestamp = Date.now; 
						response.items = []; 
						
						List.find({'uid': uid}, function(err, lists){
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
								list = helpers.convertJson2List(list, item, uid);
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
						res.json(response);
					}
				});
			}else{
				res.json(error_codes.SERVICE_ERROR);
			}
		});
	}
});

router.get('/', function(req, res) {
	res.json(error_codes.ACCESS_USER_ERROR);
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
