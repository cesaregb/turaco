var express = require('express');
var router = express.Router();
var twitterController = require('../../config/TwitterController');
var turacoError = require('../../config/error_codes');
var json_api_responses = require('../../config/responses')();
var error_codes = turacoError.error_codes;
var listHelpers = require('../../utils/list_helpers');
var twitter = require('ntwitter');
var User = require('../../app/models/user');
var List = require('../../app/models/list');

var fileName = "listApi.js";
var pathString = "/api/lists";

router.get('/', function(req, res) {
	res.json(json_api_responses.error(error_codes.BAD_URL_ERROR));
});

router.get('/:uid', function(req, res) {
	var _method = "get /:uid (get lists)";
	console.log("IN " + fileName + "-" + _method);
	var uid = req.params.uid;
	try{
		if (uid == null){
			throw error_codes.ACCESS_USER_ERROR;
		}
		helper = new listHelpers.ListHelper();
		helper.getUser(uid, function(err, user){
			if (err){
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}
			var twit = twitterController(user.token, user.tokenSecret);
			twit.verifyCredentials(function(err, data) {
				if (err){
					res.json(json_api_responses.error(error_codes.TWITTER_VERIFY_CREDENTIALS_ERROR, err));
					return;
				}
			}).getLists(user.username, function(err, data) {
				if (!err){ //save information into the db... 
					var listCollection = {};
					var response = {};
					response.timestamp = Date.now; 
					response.items = []; 
					List.find({'uid': uid}, function(err, lists){
						if (err) {
							res.json(json_api_responses.string_error(err, err));
							return;
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
							list = listHelpers.convertJson2List(list, item, uid);
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
					res.json(json_api_responses.success(response));
					return;
				}else{
					res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					return;
				}
			});
		});
	}catch(ex){
		res.json(json_api_responses.error(ex));
		return;
	}
});

router.put('/', function(req, res) {
	var _method = "put / (create list)";
	console.log("IN " + fileName + "-" + _method);
	
	var myParams = getParams(req);
	var uid = req.body.uid;
	var name = req.body.name;
	
	try{
		if (uid == null){
			res.json(json_api_responses.error(error_codes.ACCESS_USER_ERROR, null));
			return;
		}
		helper = new listHelpers.ListHelper();
		helper.getUser(uid, function(err, user){
			if (err){
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}
			var twit = twitterController(user.token,  user.tokenSecret);
			twit.verifyCredentials(function(err, data) {
				if (err){
					res.json(json_api_responses.error(error_codes.TWITTER_VERIFY_CREDENTIALS_ERROR, err));
					return;
				}
			}).createList(user.username, name, myParams, function(err, data){
				if (!err){
					res.json(json_api_responses.success(data));
					return;
				}else{
					res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					return;
				}
			});
		});
	}catch(ex){
		res.json(json_api_responses.error(ex, null));
		return;
	}
	
});

router.delete('/', function(req, res) { //41349136
	var _method = "delete / (delete list)";
	console.log("IN " + fileName + "-" + _method);
	
	var uid = req.body.uid;
	var myParams = getParams(req);

	try{
		if (uid == null){
			res.json(json_api_responses.error(error_codes.ACCESS_USER_ERROR, null));
			return;
		}
		helper = new listHelpers.ListHelper();
		helper.getUser(uid, function(err, user){
			if (err){
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}else{
				helper.getTwittObjectFromUser(function(err, twit){
					if (err){
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}
					twit.deleteList(user.username, myParams, function(err, data){
						if (err){
							res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
							return;
						}else{
							res.json(json_api_responses.success(data));
							return;
						}
					});
				})
			}
		});
	}catch(ex){
		res.json(json_api_responses.error(ex, null));
		return;
	}
});


router.post('/', function(req, res) {
	var _method = "post / (update list)";
	console.log("IN " + fileName + "-" + _method);

	var uid = req.body.uid;
	var list_id = req.body.list_id;
	var myParams = getParams(req);
	
	try{
		if ( uid == null ){
			throw error_codes.ACCESS_USER_ERROR;
		}
		helper = new listHelpers.ListHelper();
		helper.getUser(uid, function(err, user){
			if (err){
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}else{
				helper.getTwittObjectFromUser(function(err, twit){
					if (err){
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}else{
						twit.updateList(user.username, myParams, function(err, data){
							if (err){
								res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
								return;
							}else{
								res.json(json_api_responses.success(data));
								return;
							}
						});
					}
				});
			}
		});
	}catch(ex){
		res.json(json_api_responses.error(ex, null));
		return;
	}
});

router.post('/subscribe', function(req, res) {
	var _method = "post / (subscribeMe to a list)";
	console.log("IN " + fileName + "-" + _method);
	var uid = req.body.uid;
	var list_id = req.body.list_id;
	var myParams = getParams(req); 
	
	try{
		if ( uid == null ){
			throw error_codes.ACCESS_USER_ERROR;
		}
		helper = new listHelpers.ListHelper();
		helper.getUser(uid, function(err, user){
			if (err){
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}
			helper.getTwittObjectFromUser(function(err, twit){
				if (err){
					res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					return;
				}
				twit.subscribeme2List(list_id, myParams, function(err, data){
					if (err){
						console.log(err);
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}else{
						res.json(json_api_responses.success(data));
						return;
					}
				});
			});
		});
	}catch(ex){
		res.json(json_api_responses.error(ex, null));
		return;
	}
});

router.post('/unsubscribe', function(req, res) {
	var _method = "post / (UN subscribeMe to a list)";
	console.log("IN " + fileName + "-" + _method);
	var uid = req.body.uid;
	var list_id = req.body.list_id;
	var myParams = getParams(req); 
	
	try{
		if ( uid == null ){
			throw error_codes.ACCESS_USER_ERROR;
		}
		helper = new listHelpers.ListHelper();
		helper.getUser(uid, function(err, user){
			if (err){
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}
			helper.getTwittObjectFromUser(function(err, twit){
				if (err){
					res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					return;
				}
				twit.unsubscribeme2List(list_id, myParams, function(err, data){
					if (err){
						console.log(err);
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}else{
						res.json(json_api_responses.success(data));
						return;
					}
				});
			});
		});
	}catch(ex){
		res.json(json_api_responses.error(ex, null));
		return;
	}
});

router.get('/subscriptions/:uid', function(req, res) {
	var _method = "get /subscriptions/:uid (get user's subscriptions)";
	console.log("IN " + fileName + "-" + _method);

	console.log("List Subscriptions GET: " + req.params.uid);
	var uid = req.params.uid;
	var myParams = {};
	
	try{
		if (uid == null){
			throw error_codes.ACCESS_USER_ERROR;
		}
		helper = new listHelpers.ListHelper();
		helper.getUser(uid, function(err, user){
			if (err){
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}else{
				helper.getTwittObjectFromUser(function(err, twit){
					if (err){
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}else{
						twit.getListSubscriptions(user.username, myParams, function(err, data){
							if (err){
								res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
								return;
							}else{
								res.json(json_api_responses.success(data));
								return;
							}
						});
					}
				});
			}
		});
	}catch(ex){
		res.json(json_api_responses.error(ex, null));
		return;
	}
});

router.post('/clone' , function(req, res){
	var _method = "post /clone (clone a list)";
	console.log("IN " + fileName + "-" + _method);
	var uid = req.body.uid;
	var list_id = req.body.list_id;
	var myParams = getParams(req);
	try{
		
		if (uid == null){
			throw error_codes.ACCESS_USER_ERROR;
		}
		helper = new listHelpers.ListHelper();
		helper.getUser(uid, function(err, user){
			
			if (err){
				res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
				return;
			}
			helper.getTwittObjectFromUser(function(err, twit){
				twit.getList(list_id, myParams, function(err, data){
					if (err){
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}
					var list_member_count = data.member_count;
					var list = new List();
					list = listHelpers.convertJson2List(list, data, uid);
					list_id = list.id;
					//create list;
					twit.createList(user.username, list.name, {mode: list.mode, description: list.description}, function(err, data){
						if (err){
							res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
							return;
						}
						var created_list_id = data.id; 
						var nextCursor = 1;
						while (nextCursor > 0){
							var params = {cursor : nextCursor};
							if (list_member_count < 5000){
								params.count = list_member_count;
							}else{
								params.count = 40;
							}
console.log("Step 4");
							twit.getListMemebers(list_id, params, function(err, data){
								if (err){
									res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
									return;
								}
//								nextCursor = data.next_cursor;
								nextCursor = 0;
								var usersWithError = new Array();
								var numErr = 0;
								var numTries = 0;
								var members2Add = new Array();
console.log("data lenght: " + data.users.length + " NEXT Cursor: " + data.next_cursor);
								var usersList = data.users.length;
								data = data.users;		
								var memebers = "";	
								for (pos in data){
									(function(item){
										numTries++;
										var user2FollowId = item.id;
console.log("Step 5: " + numTries  + " -- " + user2FollowId + " : " + item.screen_name);
//									twit.createFriendship(user2FollowId, function(err, data){
//										if (err){
//											usersWithError.push(err);
//											numErr++;
//										}else{
//console.log("Adding: " + user2FollowId); 
//											members2Add.push(user2FollowId);
//										}

//										if (numTries == usersList){
//											(function (members2Add){
//												var ids = members2Add.toString();
//console.log("Membeners to add: " + members2Add.length + " -- "+ ids);
//												twit.subscribeMemebers2List(created_list_id, ids, function(err, data){
//													if (err){
//														res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
//														return;
//													}else{
//console.log("Users added to list... : ");
//														res.json(json_api_responses.string_error("Success "));
//														return;
//													}
//												});
//												
//											})(members2Add);
//										}
//									});
										
									})(data[pos]);
								}
							});
							
						}
						
					});
					
				});
			});
		});
	}catch(ex){
		res.json(json_api_responses.error(ex, null));
		return;
	}
});


function getParams(req){
	var uid = req.body.uid;
	var list_id = req.body.list_id;
	var slug = req.body.slug;
	var name = req.body.name;
	var mode = req.body.mode;
	var description = req.body.description;
	var owner_screen_name = req.body.owner_screen_name;
	var owner_id = req.body.owner_id;
	var myParams = {
			slug 			: slug, 
			name			: name, 
			mode 			: mode, 
			list_id			: list_id, 
			description		: description,
			owner_screen_name:owner_screen_name,
			owner_id		: owner_id
	}; 
	return myParams; 
}

module.exports = router;
