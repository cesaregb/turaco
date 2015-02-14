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
var async = require("async");

var fileName = "listApi.js";
var pathString = "/api/lists";

/*
 * GET the lists by the scren_name sended 
 * */
router.get('/byUser/:screen_name', function(req, res) {
	var _method = "get /byUSer/:uid (get lists)";
	console.log("IN " + fileName + "-" + _method);
	try{
		var session = req.session;
		var screen_name = req.params.screen_name;
		helper = new listHelpers.ListHelper();
		helper.getUser(session.user, function(err, user){
			if (err){
				console.error("Error getting the logged user from the database");
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}
			helper.getTwittObjectFromUser(function(err, twit){
				if (err){
					res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					return;
				}
				twit.getLists(screen_name, function(err, data) {
					if (err){ 
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}
					var listCollection = {};
					var response = {};
					response.timestamp = Date.now; 
					response.items = []; 
					for (pos in data){
						(function(item){
							var list = new List();
							list = listHelpers.convertJson2List(list, item, uid);
							listCollection[list.id] = true;
							response.items.push(list);
						})(data[pos]);
					}
					res.json(json_api_responses.success(response));
					return;
				});
			});
			
		});
	}catch(ex){
		res.json(json_api_responses.error(ex));
		return;
	}
});

/*
 * GET the lists of the logged user
 * */
router.get('/', function(req, res) {
	var _method = "get / (get lists)";
	console.log("IN " + fileName + "-" + _method);
	var session = req.session;
	var user = null;
	var uid = null;
	try{
		if (req.user){
			user = req.user;
			uid = user.uid;
		}else{
			throw error_codes.ACCESS_USER_ERROR;
		}
		if (session.user_lists == null ) {/* Store list on session to avoid multiple request to get the actual lists, */
			helper = new listHelpers.ListHelper();
			helper.getUser(session.user, function(err, user){
				if (err){
					console.error("Error getting the logged user from the database");
					res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
					return;
				}
				helper.getTwittObjectFromUser(function(err, twit){
					if (err){
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}
					twit.getLists(user.screen_name, function(err, data) {
						if (err){ 
							res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
							return;
						}
						var listCollection = {};
						var response = {};
						response.timestamp = Date.now; 
						response.items = []; 
						for (pos in data){
							(function(item){
								var list = new List();
								list = listHelpers.convertJson2List(list, item, uid);
								listCollection[list.id] = true;
								response.items.push(list);
							})(data[pos]);
						}
						session.user_lists = response;
						res.json(json_api_responses.success(response));
						return;
					});
				});
			});
		}else{
			console.log("RETURNED FROM THE SESSION");
			res.json(json_api_responses.success(session.user_lists));
			return;
		}
	}catch(ex){
		res.json(json_api_responses.error(ex));
		return;
	}
});

/*
 * CREATE a list
 * */
router.put('/', function(req, res) {
	var _method = "put / (create list)";
	console.log("IN " + fileName + "-" + _method);
	try{
		var myParams = getParams(req);
		var uid = null;
		var list_name = null;
		
		if (req.user){
			user = req.user;
			uid = user.uid;
			list_name = req.body.name;
		}else{
			throw error_codes.ACCESS_USER_ERROR;
		}
		console.log("LIST_NAME en api: " + list_name);
		helper = new listHelpers.ListHelper();
		helper.getUser(user, function(err, user){
			if (err){
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}
			helper.getTwittObjectFromUser(function(err, twit){
				if (err){
					res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					return;
				}
				twit.createList(user.screen_name, list_name, myParams, function(err, data){
					if (!err){
						res.json(json_api_responses.success(data));
						return;
					}else{
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
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

/*
 * Delete a list 
 * */
router.delete('/', function(req, res) { // 41349136
	var _method = "delete / (delete list)";
	console.log("IN " + fileName + "-" + _method);
	
	var uid = null;
	var myParams = getParams(req);

	try{
		if (req.user){
			user = req.user;
			uid = user.uid;
			name = user.name;
		}else{
			throw error_codes.ACCESS_USER_ERROR;
		}
		helper = new listHelpers.ListHelper();
		helper.getUser(user, function(err, user){
			if (err){
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}else{
				helper.getTwittObjectFromUser(function(err, twit){
					if (err){
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}
					twit.deleteList(user.screen_name, myParams, function(err, data){
						if (err){
							res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
							return;
						}else{
							res.json(json_api_responses.success(data));
							return;
						}
					});
				});
			}
		});
	}catch(ex){
		res.json(json_api_responses.error(ex, null));
		return;
	}
});

/*
 * Delete a list and unfollow all the users from that list. 
 * */

router.delete('/and_unfollow', function(req, res) { 
	var _method = "delete / (delete list and unfollow... )";
	console.log("IN " + fileName + "-" + _method);
	var uid = null;
	var myParams = getParams(req);
	try{
		
		if (req.user){
			user = req.user;
			uid = user.uid;
			name = user.name;
		}else{
			throw error_codes.ACCESS_USER_ERROR;
		}
		helper = new listHelpers.ListHelper();
		helper.getUser(user, function(err, user){
			if (err){
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}else{
				helper.getTwittObjectFromUser(function(err, twit){
					if (err){
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}
					twit.getList(uid, myParams, function(err, data){
						if (err){
							res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
							return;
						}
						var list_member_count = data.member_count;
						var list = new List();
						list = listHelpers.convertJson2List(list, data, uid);
						list_id = list.id;
						
						var created_list_id = data.id; 
						var cursor = -1;
						async.whilst(
							function () {
								return cursor != 0; 
							},
							function (callback) {
								var params = {cursor : cursor};
								if (list_member_count < 5000){
									params.count = list_member_count;
								}else{
									params.count = 1000;
								}
								var self = this;
								twit.getListMembers(list_id, params, function(err, data){
									if (err){
										res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
										return;
									}
									cursor = data.next_cursor;
									var usersWithError = new Array();
									var numErr = 0;
									var numTries = 0;
									var members2Add = new Array();
									var usersList = data.users.length;
									data = data.users;		
									var memebers = "";	
									for (pos in data){
										(function(item){
											numTries++;
											var user_id = item.id;
											twit.destroyFriendship(user_id, function(err, data){
												if (err){
													console.log("Problem deleting frienship with: " + user_id);
												}
											});
										})(data[pos]);
									}
									callback(null, cursor);
								});
							},
							function (err) {
								if (err){
									console.log("err: " + err)
								}
							}
						);
						twit.deleteList(user.screen_name, myParams, function(err, data){
							if (err){
								res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
								return;
							}else{
								res.json(json_api_responses.success(data));
								return;
							}
						});
					});
					
				})
			}
		});
	}catch(ex){
		res.json(json_api_responses.error(ex, null));
		return;
	}
});

/*
 * UPDATE an existing list 
 * */
router.post('/', function(req, res) {
	var _method = "post / (update list)";
	console.log("IN " + fileName + "-" + _method);
	var uid = null;
	var myParams = getParams(req);
	try{
		if (req.user){
			user = req.user;
			uid = user.uid;
			name = user.name;
		}else{
			throw error_codes.ACCESS_USER_ERROR;
		}
		
		helper = new listHelpers.ListHelper();
		helper.getUser(user, function(err, user){
			if (err){
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}else{
				helper.getTwittObjectFromUser(function(err, twit){
					if (err){
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}else{
						twit.updateList(user.screen_name, myParams, function(err, data){
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

/*
 * Subscribe to a list 
 * */
router.post('/subscribe', function(req, res) {
	var _method = "post / (subscribeMe to a list)";
	console.log("IN " + fileName + "-" + _method);
	var uid = req.body.uid;
	var myParams = getParams(req); 
	
	try{
		if (req.user){
			user = req.user;
			uid = user.uid;
			name = user.name;
		}else{
			throw error_codes.ACCESS_USER_ERROR;
		}
		
		helper = new listHelpers.ListHelper();
		helper.getUser(user, function(err, user){
			if (err){
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}
			helper.getTwittObjectFromUser(function(err, twit){
				if (err){
					res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					return;
				}
				twit.subscribeme2List(myParams, function(err, data){
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

/*
 * Un-Subscribe to a list 
 * */
router.post('/unsubscribe', function(req, res) {
	var _method = "post / (UN subscribeMe to a list)";
	console.log("IN " + fileName + "-" + _method);
	var uid = req.body.uid;
	var myParams = getParams(req); 
	
	try{
		if (req.user){
			user = req.user;
			uid = user.uid;
			name = user.name;
		}else{
			throw error_codes.ACCESS_USER_ERROR;
		}
		helper = new listHelpers.ListHelper();
		helper.getUser(user, function(err, user){
			if (err){
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}
			helper.getTwittObjectFromUser(function(err, twit){
				if (err){
					res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					return;
				}
				twit.unsubscribeme2List(myParams, function(err, data){
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

/*
 * Get subscriptions  
 * */
router.get('/subscriptions', function(req, res) {
	var _method = "get /subscriptions/:uid (get user's subscriptions)";
	console.log("IN " + fileName + "-" + _method);

	console.log("List Subscriptions GET: " + req.params.uid);
	var uid = null;
	var myParams = {};
	
	try{
		if (req.user){
			user = req.user;
			uid = user.uid;
			name = user.name;
		}else{
			throw error_codes.ACCESS_USER_ERROR;
		}
		
		helper = new listHelpers.ListHelper();
		helper.getUser(user, function(err, user){
			if (err){
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}else{
				helper.getTwittObjectFromUser(function(err, twit){
					if (err){
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}else{
						twit.getListSubscriptions(user.screen_name, myParams, function(err, data){
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

/*
 * Clone and follow the users from the list
 * */
router.post('/clone' , function(req, res){
	var _method = "post /clone (clone a list)";
	console.log("IN " + fileName + "-" + _method);
	var uid = null;
	var list_id = null;
	var myParams = getParams(req);
	try{
		
		if (req.user){
			user = req.user;
			uid = user.uid;
			name = user.name;
		}else{
			throw error_codes.ACCESS_USER_ERROR;
		}
		
		helper = new listHelpers.ListHelper();
		helper.getUser(user, function(err, user){
			if (err){
				res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
				return;
			}
			helper.getTwittObjectFromUser(function(err, twit){
				twit.getList(uid, myParams, function(err, data){
					if (err){
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}
					var list_member_count = data.member_count;
					var list = new List();
					list = listHelpers.convertJson2List(list, data, uid);
					list_id = list.id;
					twit.createList(user.screen_name, list.name, {mode: list.mode, description: list.description}, function(err, data){
						if (err){
							res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
							return;
						}
						var created_list_id = data.id; 
						var cursor = -1;
						async.whilst(
						    function () {
						    	return cursor != 0; 
						    },
						    function (callback) {
						    	var params = {cursor : cursor};
								if (list_member_count < 5000){
									params.count = list_member_count;
								}else{
									params.count = 1000;
								}
								var self = this;
								twit.getListMemebers(list_id, params, function(err, data){
									if (err){
										res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
										return;
									}
									cursor = data.next_cursor;
									var usersWithError = new Array();
									var numTries = 0;
									var members2Add = new Array();
									var usersList = data.users.length;
									data = data.users;		
									var memebers = "";	
									for (pos in data){
										(function(item){
											numTries++;
											var user2FollowId = item.id;
											twit.createFriendship(user2FollowId, function(err, data){
												if (err){
													usersWithError.push(err);
												}else{
													members2Add.push(user2FollowId);
												}
												if (numTries == usersList){
													(function (members2Add){
														var i, j, temparray, chunk = 100;
														for (i=0, j = members2Add.length; i < j; i+=chunk) {
														    temparray = members2Add.slice(i, i+chunk);
														    var ids = temparray.toString();
														    
														    twit.subscribeMemebers2List(created_list_id, ids, function(err, data){
														    	if (err){
														    		res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
														    		return;
														    	}else{
														    		res.json(json_api_responses.string_success("Success "));
														    		return;
														    	}
														    });
														}
													})(members2Add);
												}
											});
											
										})(data[pos]);
									}
									callback(null, cursor);
								});
						    },
						    function (err) {
						        if (err){
						        	console.log("err: " + err)
						        }
						    }
						);
					});
					
				});
			});
		});
	}catch(ex){
		res.json(json_api_responses.error(ex, null));
		return;
	}
});


/*
 * Clone but no following  
 * */
router.post('/clone/no_follow' , function(req, res){
	var _method = "post /clone (clone a list)";
	console.log("IN " + fileName + "-" + _method);
	var uid = null;
	var list_id = req.body.list_id;
	var myParams = getParams(req);
	try{
		if (req.user){
			user = req.user;
			uid = user.uid;
			name = user.name;
		}else{
			throw error_codes.ACCESS_USER_ERROR;
		}
		helper = new listHelpers.ListHelper();
		helper.getUser(user, function(err, user){
			if (err){
				res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
				return;
			}
			helper.getTwittObjectFromUser(function(err, twit){
				var list = new List();
				twit.getList(uid, myParams, function(err, data){
					if (err){
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}
					var list_member_count = data.member_count;
					list = listHelpers.convertJson2List(list, data, uid);
					list_id = list.id; 
					// create list;
					twit.createList(user.screen_name, list.name, {mode: list.mode, description: list.description}, function(err, data){
						if (err){
							res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
							return;
						}
						console.log("list created. ");
						var created_list_id = data.id; 
						var cursor = -1;
						async.whilst(
							function () {
								return cursor != 0; 
							},
							function (callback) {
								var params = {cursor : cursor};
								if (list_member_count < 5000){
									params.count = list_member_count;
								}else{
									params.count = 1000;
								}
								var self = this;
								twit.getListMemebers(list_id, params, function(err, data){
									if (err){
										res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
										return;
									}
									cursor = data.next_cursor;
									var usersWithError = new Array();
									var numTries = 0;
									var members2Add = new Array();
									var usersList = data.users.length;
									data = data.users;		
									var memebers = "";	
									for (pos in data){
										(function(item){
											numTries++;
											var user2FollowId = item.id;
											members2Add.push(user2FollowId);
										})(data[pos]);
									}
									if (numTries == usersList){
										(function (members2Add){
											var i, j, temparray, chunk = 100;
											for (i=0, j = members2Add.length; i < j; i+=chunk) {
												temparray = members2Add.slice(i, i+chunk);
												var ids = temparray.toString();
												console.log("Subscribing users: " + ids + " \n to list: " + created_list_id);
												twit.subscribeMemebers2List(created_list_id, ids, function(err, data){
													if (err){
														res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
														return;
													}else{
														res.json(json_api_responses.string_success("Success "));
														return;
													}
												});
											}
										})(members2Add);
									}
									callback(null, cursor);
								});
							},
							function (err) {
								if (err){
									console.log("err: " + err)
								}
							}
						);
					});
					
				});
			});
		});
	}catch(ex){
		res.json(json_api_responses.error(ex, null));
		return;
	}
});

/*
 *  get users of the lists_id 
 * */
router.get('/list_users/:list_id/:list_member_count', function(req, res) {
	var _method = "get / (get list's users )";
	console.log("IN " + fileName + "-" + _method);
	var session = req.session;
	var list_id = req.params.list_id;
	var list_member_count = req.params.list_member_count;
	var user = null;
	var uid = null;
	var result = {list_id : list_id, member_count : list_member_count};
	try{
		if (req.user){
			user = req.user;
			uid = user.uid;
		}else{
			throw error_codes.ACCESS_USER_ERROR;
		}
		
		helper = new listHelpers.ListHelper();
		helper.getUser(user, function(err, user){
			if (err){
				console.error("Error getting the logged user from the database");
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}
			helper.getTwittObjectFromUser(function(err, twit){
				if (err){
					res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					return;
				}
				
				var cursor = -1;
				var users = [];
				async.whilst(
					function () {
						if (cursor == 0){
							result.users = users;
							res.json(json_api_responses.success(result));
						}
						return cursor != 0; 
					},
					function (callback) {
						var params = {cursor : cursor};
						if (list_member_count < 5000){
							params.count = list_member_count;
						}else{
							params.count = 1000;
						}
						var self = this;
						twit.getListMembers(list_id, params, function(err, data){
							if (err){
								res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
								return;
							}
							cursor = data.next_cursor;
							var usersWithError = new Array();
							var numErr = 0;
							var numTries = 0;
							users.push.apply(users, data.users);
							callback(null, cursor);
						});
					},
					function (err) {
						if (err){
							console.log("err: " + err)
						}
					}
				);
				
			});
		});
	}catch(ex){
		res.json(json_api_responses.error(ex));
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
