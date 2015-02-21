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
var SessionObjects = require('../../app/models/sessionObjects');
var async = require("async");

var fileName = "listApi.js";
var pathString = "/api/lists";

/* *********Request function ********** */
function getListByUser(req, res) {
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
}
module.exports.getListByUser = getListByUser;

function getUsersListFunction(req, res) {
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
		if (session.user_lists == null) {/* Store list on session to avoid multiple request to get the actual lists, */
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
						/*
						 * get list users... 
						 * */
						console.log("TURACO_DEBUG - getListsUsers");
						getListsUsers(twit, response.items, session, user);
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
}
module.exports.getUsersListFunction = getUsersListFunction;

function getListsUsers(twit, lists, session, user){
	// iterar las listas.. con async... 
	var usersListHash = {};
	var completeListsObject = {};
	completeListsObject.lists = [];
	
	async.forEach(lists, function(list, callback) {
		console.log("TURACO_DEBUG - Iteration l: " + list.name);
		var completeObjectList = list;
		var usersList = [];
		var parentCallback = callback;
		var cursor = -1;
		async.whilst(
			function () {
				if(cursor == 0){
					completeObjectList.users = usersList;
					completeListsObject.lists.push(completeObjectList);
					console.log("TURACO_DEBUG - compousing objects and calling parent callback. #user : " + usersList.length);
					parentCallback();
				}
				return cursor != 0; 
			},
			function (callback) {
				var params = {cursor : cursor};
				params.count = 5000;
				var self = this;
				twit.getListMembers(list.id, params, function(err, data){
					console.log("TURACO_DEBUG - getListMembers for list: " + list.name);
					if (err){
						callback(err);
					}
					cursor = data.next_cursor;
					usersList.push.apply(usersList, data.users);
					for (pos in usersList){ // iterate thru the list to hash the existing users.. for latter validation... 
						(function(item){
							usersListHash[item.id] = true;
						})(usersList[pos]);
					}
					callback(null, cursor);
				});
			},
			function (err) {
				if (err){
					parentCallback(err);
				}
			}
		);
	}, function(err) {
		if (err == null){
			// add variables t o session.
			console.log("TURACO_DEBUG - number of lists on object: " + completeListsObject.lists.length);
			for (index in completeListsObject.lists){
				var list = completeListsObject.lists[index];
				console.log("TURACO_DEBUG - list: " + list.name + " # users: " + list.users.length + " confirmation: " + list.member_count );
			}
			var sessionObject = new SessionObjects();
			sessionObject.uid = user.id; 
			sessionObject.session_id = "non_existing"; 
			sessionObject.usersListHash = ""; 
			sessionObject.completeListsObject = ""; 
			sessionObject.save(function(err){
				if (err){
					console.log("TURACO_DEBUG - ERROR SAVING SESSION OBJECT ");
				}else{
					console.log("TURACO_DEBUG - Session saved.");
				}
			})
			if (false){
				SessionObjects.remove({uid: profile.id}, function(err) {
					if(err) {
						console.log("error deleting item: " + err);
					}else{
						console.log("TURACO_DEBUG - all the sessions from the suer were delted... ");
					}
				});
			}
		}else{
			console.log("TURACO_DEBUG - Error on the async task... ");
		}
	});
}
module.exports.getListsUsers = getListsUsers;

function getUsersListFunctionRefresh(req, res){
	var _method = "get /refreshSession (getUsersListFunctionRefresh)";
	console.log("IN " + fileName + "-" + _method);
	req.session.user_lists = "";
	getUsersListFunction(req, res);
}
module.exports.getUsersListFunctionRefresh = getUsersListFunctionRefresh;

function createList (req, res) {
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
}
module.exports.createList = createList;

function deleteList(req, res) { // 41349136
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
}
module.exports.deleteList = deleteList;

function deleteAndUnfollow(req, res) { 
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
}
module.exports.deleteAndUnfollow = deleteAndUnfollow;

function udateList(req, res) {
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
}
module.exports.udateList = udateList;

function subscribe(req, res) {
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
}
module.exports.subscribe = subscribe;

function unsubscribe(req, res) {
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
}
module.exports.unsubscribe = unsubscribe;

function getSubscriptions(req, res) {
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
}
module.exports.getSubscriptions = getSubscriptions;

function cloneList(req, res){
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
}
module.exports.cloneList = cloneList;

function cloneNoFollow(req, res){
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
}
module.exports.cloneNoFollow = cloneNoFollow;

function membersCreateAll(req, res){
	var _method = "post /members_create_all (add the comma separated members to a list.)";
	console.log("IN " + fileName + "-" + _method);
	var uid = null;
	var list_id = req.body.list_id;
	var users_list = req.body.users_list
	var myParams = getParams(req);
	/*add validation...? */
	try{
		if (req.user){
			user = req.user;
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
				
				twit.subscribeMemebers2List(list_id, users_list, function(err, data){
					if (err){
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}else{
						res.json(json_api_responses.string_success("Success"));
						return;
					}
				});
				
			});
		});
	}catch(ex){
		res.json(json_api_responses.error(ex, null));
		return;
	}
}
module.exports.membersCreateAll = membersCreateAll;

function getListUsers(req, res) {
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
}
module.exports.getListUsers = getListUsers;

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