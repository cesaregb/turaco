var express = require('express');
var router = express.Router();

//a fucking mess
var twitterController = require('../../config/TwitterController');
var turacoError = require('../../config/error_codes'); //TODO ADD MORE CODES
var json_api_responses = require('../../config/responses')(); //TODO integrate me with turaco errors
var error_codes = turacoError.error_codes; //TODO WTF

//helpers
var listHelpers = require('../../utils/list_helpers');
var sessionObjectHelpers = require('../../utils/sessionObject_helpers'); // we are doing this kind of correctly not others ...
var loginGatherInfoUser = require('../../lib/loginGatherInfoUser');

var twitter = require('ntwitter');
var async = require("async");

//Model
var User = require('../../app/models/user');
var List = require('../../app/models/list');
var SessionObjects = require('../../app/models/sessionObjects');

//loggin information ...
var fileName = "listApi.js";
var pathString = "/api/lists";

/*
 * get lists by user
 * query twitter api with the provided user. 
 * */
function getListByUser(req, res){
	var _method = "getListByUser";
	console.log("IN " + fileName + " - " + _method);
	var uid = req.session.user.uid;
	try{
		var session = req.session;
		var screen_name = req.params.screen_name;
		helper = new listHelpers.ListHelper();
		helper.getUser(session.user, function(err, user){
			if (err){
				return res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
			}
			helper.getTwittObjectFromUser(function(err, twit){
				if (err){
					return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
				}
				twit.getLists(screen_name, function(err, data) {
					if (err){ 
						return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
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
					return res.json(json_api_responses.success(response));
				});
			});
			
		});
	}catch(ex){
		return res.json(json_api_responses.error(ex));
	}
}
module.exports.getListByUser = getListByUser;

/*
 * get autenticated user lists
 * */
function getUsersListFunction(req, res) {
	var _method = "getUsersListFunction";
	console.log("IN " + fileName + " - " + _method);
	var session = req.session;
	var user = null;
	var uid = null;
	if (req.user){
		user = req.user;
		uid = user.uid;
		if (session.user_lists != null) {
			var response = {};
			response.timestamp = Date.now; 
			response.items = session.user_lists;
			return res.json(json_api_responses.success(response));
		}else{
			SessionObjects.findOne({
				'uid' : user.uid
			}).sort({created: 'desc'}).exec(function(err, sessionObj) {
				if(sessionObj == null || err){
					/*
					 * get information even if is incomplete. 
					 * */
					var helper = new listHelpers.ListHelper();
					helper.getUser(user, function(err, user){
						if (err){ return res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err)); }
						helper.getTwittObjectFromUser( function(err, twit){
							if (err){ return res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));}
							var gatherInfoInstance = new loginGatherInfoUser();
							gatherInfoInstance.getUsersListFunction(twit, user, function (err, listResponse){
								if (err){ return res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));}
								var response = {};
								response.timestamp = Date.now; 
								response.items = listResponse;
								session.user_lists = response;
								return res.json(json_api_responses.success(response));
							});
						});
					});
					
					/*
					 * get the starting information... and save it to the database. 
					 * */
					var gatherInfoInstance = new loginGatherInfoUser();
					console.log("TURACO_DEBUG - calling GET_ALL from listHandlers.js");
					gatherInfoInstance.getAll(req.user, req.session, function(err, data){
						if (err){
							console.log("TURACO_DEBUG - ERROR in gatherInfoInstance.getAll " );
						}else{
							console.log("TURACO_DEBUG - Success gatherInfoInstance.getAll" );
						}
					});
					
				}else{
					session.friends = sessionObj.friends;
					session.usersListHash = sessionObj.usersListHash; 
					session.savedSearches = sessionObj.savedSearches; 
					session.completeListsObject = sessionObj.completeListsObject;
					session.user_lists = sessionObj.lists; 
					
					var response = {};
					response.timestamp = Date.now; 
					response.items = sessionObj.lists;
					return res.json(json_api_responses.success(response));
				}
			});
		}
	}else{
		return res.json(json_api_responses.string_error(error_codes.USER_NOT_FOUND_ERROR));
	}
}
module.exports.getUsersListFunction = getUsersListFunction;

function createList (req, res) {
	var _method = "createList";
	console.log("IN " + fileName + " - " + _method);
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
		helper = new listHelpers.ListHelper();
		helper.getUser(user, function(err, user){
			if (err){
				return res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
			}
			helper.getTwittObjectFromUser(function(err, twit){
				if (err){
					return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
				}
				twit.createList(user.screen_name, list_name, myParams, function(err, newListData){
					if (err){ return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					}else{
						//update the sessionObject and set value to restore sessions 
						global.refresSessionObject = true;
						sessionHelper = new sessionObjectHelpers({param:"nel"});
						sessionHelper.addList(user, newListData, function(err, code){
							if (err){
								return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
							}else{
								return res.json(json_api_responses.success(newListData));
							}
						});
					}
				});
			});
			
		});
	}catch(ex){
		return res.json(json_api_responses.error(ex, null));
	}	
}
module.exports.createList = createList;

/*
 * delete list 
 * note you dont have to remove existing users is not unfollowing anyone. 
 * */
function deleteList(req, res) {
	var _method = "deleteList";
	console.log("IN " + fileName + " - " + _method);
	var myParams = getParams(req);
	var list_id = req.params.list_id;
	try{
		if (req.user){
			user = req.user;
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
					myParams.owner = user.screen_name;
					myParams.list_id = list_id;
					console.log("TURACO_DEBUG - myParams: " + JSON.stringify(myParams));
					twit.deleteList(user.screen_name, myParams, function(err, data){
						if (err){
							return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						}else{
							//update the sessionObject and set value to restore sessions 
							global.refresSessionObject = true;
							sessionHelper = new sessionObjectHelpers({param:"nel"});
							sessionHelper.removeList(user, list_id, function(err, code){
								if (err){
									return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
								}else{
									return res.json(json_api_responses.success(data));
								}
							});
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
	var _method = "deleteAndUnfollow";
	console.log("IN " + fileName + " - " + _method);
	var uid = null;
	var myParams = getParams(req);
	var finalList = null;
	var finalListOfUsers = [];
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
					twit.getList(myParams, function(err, data){
						if (err){
							res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
							return;
						}
						var list_member_count = data.member_count;
						var list = new List();
						list = listHelpers.convertJson2List(list, data, uid);
						list_id = list.id;
						finalList = data;
						
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
									// users to remove from session object.. 
									finalListOfUsers.push.apply(finalListOfUsers, data.users);
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
								return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
							}else{
								
								// list to clone as twitter object
								// list of users to add to the list and to the friends and to the hashing... 
								global.refresSessionObject = true;
								sessionHelper = new sessionObjectHelpers({param:"nel"});
								sessionHelper.removeListComplete(user, finalList.id, finalListOfUsers, function(err, code){
									if (err){
										return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
									}else{
										return res.json(json_api_responses.success(data));
									}
								});
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

function updateList(req, res) {
	var _method = "updateList";
	console.log("IN " + fileName + " - " + _method);
	var myParams = getParams(req);
	try{
		if (req.user){
			user = req.user;
		}else{
			throw error_codes.ACCESS_USER_ERROR;
		}
		
		helper = new listHelpers.ListHelper();
		helper.getUser(user, function(err, user){
			if (err){
				return res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
			}else{
				helper.getTwittObjectFromUser(function(err, twit){
					if (err){
						return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					}else{
						twit.updateList(user.screen_name, myParams, function(err, data){
							if (err){
								return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
							}else{
								/* update the list */
								global.refresSessionObject = true;
								
								var list_object = {
										list_id: req.body.list_id, 
										slug: req.body.slug, 
										name: req.body.name,
										mode: req.body.mode,
										description: req.body.description
								};
								
								sessionHelper = new sessionObjectHelpers({param:"nel"});
								sessionHelper.updateList(user, list_object, function(err, resp){
									if (err){
										return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
									}else{
										return res.json(json_api_responses.success(data));
									}
								});
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
module.exports.updateList = updateList;

function subscribe(req, res) {
	var _method = "subscribe";
	console.log("IN " + fileName + " - " + _method);
	var uid = req.body.uid;
	var myParams = getParams(req); 
	if (req.user){
		user = req.user;
		uid = user.uid;
		name = user.name;
	}else{
		return res.json(json_api_responses.error(error_codes.ACCESS_USER_ERROR, null));
	}
	
	helper = new listHelpers.ListHelper();
	helper.getUser(user, function(err, user){
		if (err){
			return res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
		}
		helper.getTwittObjectFromUser(function(err, twit){
			if (err){
				return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
			}
			twit.subscribeme2List(myParams, function(err, subscribeListData){
				global.refresSessionObject = true;
				sessionHelper = new sessionObjectHelpers({param:"nel"});
				sessionHelper.addList(user, subscribeListData, function(err, code){
					if (err){
						return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					}else{
						return res.json(json_api_responses.success(subscribeListData));
					}
				});
			});
		});
	});
}
module.exports.subscribe = subscribe;

function unsubscribe(req, res) {
	var _method = "unsubscribe";
	console.log("IN " + fileName + " - " + _method);
	var uid = req.body.uid;
	var myParams = getParams(req); 
	var list_id = req.body.list_id;
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

					global.refresSessionObject = true;
					sessionHelper = new sessionObjectHelpers({param:"nel"});
					sessionHelper.removeList(user, list_id, function(err, code){
						if (err){
							return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						}else{
							return res.json(json_api_responses.success(data));
						}
					});
					
					
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
	var _method = "getSubscriptions";
	console.log("IN " + fileName + " - " + _method);

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
	var _method = "cloneList";
	console.log("IN " + fileName + " - " + _method);
	var uid = null;
	var list_id = null;
	var finalList = null;
	var finalListOfUsers = [];
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
				twit.getList(myParams, function(err, data){
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
						finalList = data;
						var created_list_id = data.id;
						var created_list = data;
						var cursor = -1;
						var complete_list_users = [];
						async.whilst(
						    function () {
						    	if (cursor == 0){
									global.refresSessionObject = true;
									sessionHelper = new sessionObjectHelpers({param:"nel"});
									sessionHelper.addListFollow(user, finalList, finalListOfUsers, function(err, code){
										if (err){
											return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
										}else{
											return res.json(json_api_responses.string_success("Success"));
										}
									});
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
										return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
									}
									cursor = data.next_cursor;
									var usersWithError = new Array();
									var numTries = 0;
									var members2Add = new Array();
									var usersList = data.users.length;
									data = data.users;	
									finalListOfUsers.push.apply(finalListOfUsers, data.users);
									var memebers = "";
									for (pos in data){
										var item = data[pos]
										var user2FollowId = item.id;
										complete_list_users.push(item);
										twit.createFriendship(user2FollowId, function(err, data){
											numTries++;
											if (err){
												usersWithError.push(err);
											}else{
												members2Add.push(data.id_str);
											}
											console.log("TURACO_DEBUG - condition: " + numTries  + " -- " + usersList + " -- " + members2Add.length);
											if (numTries == usersList){
												var i, j, temparray, chunk = 100;
												for (i=0, j = members2Add.length; i < j; i+=chunk) {
												    temparray = members2Add.slice(i, i+chunk);
												    var ids = temparray.toString();
												    console.log("TURACO_DEBUG - ids: " + ids + " \n created_list_id: " + created_list_id);
												    twit.subscribeMemebers2List(created_list_id, ids, function(err, data){
												    	if (err){
												    		return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
												    	}else{
												    		callback(null, cursor);
												    	}
												    });
												}
											}
										});
									}
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
	var _method = "cloneList";
	console.log("IN " + fileName + " - " + _method);
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
				return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
			}
			helper.getTwittObjectFromUser(function(err, twit){
				twit.getList(myParams, function(err, data){
					if (err){
						return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					}
					var list_member_count = data.member_count;
					var list = new List();
					list = listHelpers.convertJson2List(list, data, uid);
					list_id = list.id;
					twit.createList(user.screen_name, list.name, {mode: list.mode, description: list.description}, function(err, data){
						if (err){
							return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						}
						var created_list_id = data.id;
						var created_list = data;
						var cursor = -1;
						var complete_list_users = [];
						async.whilst(
							function () {
								if (cursor == 0){
									global.refresSessionObject = true;
									sessionHelper = new sessionObjectHelpers({param:"nel"});
									sessionHelper.addList(user, created_list, complete_list_users, function(err, code){
										if (err){
											return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
										}else{
											return res.json(json_api_responses.string_success("Success"));
										}
									});
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
								twit.getListMemebers(list_id, params, function(err, data){
									if (err){
										return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
									}
									cursor = data.next_cursor;
									var usersWithError = new Array();
									var numTries = 0;
									var members2Add = new Array();
									var usersList = data.users.length;
									data = data.users;		
									var memebers = "";
									for (pos in data){
										var item = data[pos]
										numTries++;
										var user2FollowId = item.id;
										complete_list_users.push(item);
										members2Add.push(user2FollowId);
										if (numTries == usersList){
											(function (members2Add){
												var i, j, temparray, chunk = 100;
												for (i=0, j = members2Add.length; i < j; i+=chunk) {
													temparray = members2Add.slice(i, i+chunk);
													var ids = temparray.toString();
													
													twit.subscribeMemebers2List(created_list_id, ids, function(err, data){
														if (err){
															return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
														}else{
															callback(null, cursor);
														}
													});
												}
											})(members2Add);
										}
									}
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
	var _method = "membersCreateAll";
	console.log("IN " + fileName + " - " + _method);
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
				return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
			}
			helper.getTwittObjectFromUser(function(err, twit){
				if (err){
					return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
				}
				console.log("TURACO_DEBUG - list_id: " + list_id);
				console.log("TURACO_DEBUG - users_list: " + users_list);
				twit.subscribeMemebers2List(list_id, users_list, function(err, data){
					if (err){
						return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					}else{
						global.refresSessionObject = true;
						sessionHelper = new sessionObjectHelpers({param:"nel"});
						sessionHelper.membersCreateAll(user, list_id, users_list, twit, function(err, code){
							if (err){
								return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
							}else{
								return res.json(json_api_responses.string_success("Success"));
							}
						});
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

function membersDestroyAll(req, res){
	var _method = "membersDestroyAll";
	console.log("IN " + fileName + " - " + _method);
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
				return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
			}
			helper.getTwittObjectFromUser(function(err, twit){
				if (err){
					return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
				}
				twit.destroyListMembers(list_id, users_list, function(err, data){
					if (err){
						return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					}else{
						global.refresSessionObject = true;
						sessionHelper = new sessionObjectHelpers({param:"nel"});
						sessionHelper.listRefreshUsers(user, list_id, users_list, twit, function(err, data){
							if (err){
								return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
							}else{
								return res.json(json_api_responses.string_success("Success"));
							}
						});
					}
				});
			});
		});
	}catch(ex){
		res.json(json_api_responses.error(ex, null));
		return;
	}
}
module.exports.membersDestroyAll = membersDestroyAll;

function getListMembers(err, user, defaults, getListMembersCallback){
	var _method = "getListMembers";
	console.log("IN " + fileName + " - " + _method);
	console.log("TURACO_DEBUG - list_id: " + defaults.list_id);
	helper = new listHelpers.ListHelper();
	
	helper.getUser(user, function(err, user){
		if (err){
			return getListMembersCallback(error_codes.USER_NOT_FOUND_ERROR, err);
		}
		helper.getTwittObjectFromUser(function(err, twit){
			if (err){
				return getListMembersCallback(err, null);
			}
			var list_info = null;
			twit.getList(defaults, function(err, data){
				if (err){
					return getListMembersCallback(error_codes.SERVICE_ERROR, err);
				}
				list_info = data;
				console.log("TURACO_DEBUG - list obtained: " + data);
				var result = {};
				var cursor = -1;
				var users = [];
				async.whilst(
					function () {
						if (cursor == 0){
							result.users = users;
							result.list_info = list_info;
							console.log("TURACO_DEBUG - adding list_info to response: " + (list_info != null));
							getListMembersCallback(null, result);
						}
						return cursor != 0; 
					},
					function (callback) {
						var params = {cursor : cursor};
						params.count = 4999;
						params = listHelpers.merge(defaults, params);
						var self = this;
						twit.getListMembers(null, params, function(err, data){
							if (err){
								return getListMembersCallback(error_codes.SERVICE_ERROR, err);
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
							return getListMembersCallback(error_codes.SERVICE_ERROR, err);
						}
					}
				);
			});
			
			
		});
	});
}

/*
 * get the list of users 
 * */
function getListUsers(req, res) {
	var _method = "getListUsers";
	console.log("IN " + fileName + " - " + _method);
	var session = req.session;
	var list_id = req.params.list_id;
	var user = null;
	var uid = null;
	var result = {list_id : list_id};
	try{
		if (req.user){
			user = req.user;
			uid = user.uid;
		}else{
			throw error_codes.ACCESS_USER_ERROR;
		}
		
		function internalHandler(err, result){
			if (err){
				return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
			}else{
				return res.json(json_api_responses.success(result));
			}
		}
		
		global.refresSessionObject = true;
		SessionObjects.findOne({
			'uid' : user.uid
		}).sort({created: 'desc'}).exec(function(err, sessionObj) {
			if(sessionObj == null || err){
				getListMembers(err, user, {list_id : list_id}, internalHandler);
			}else{
				var list = null;
				for (i in sessionObj.lists){
					if (sessionObj.completeListsObject.lists[i].id == list_id){
						list = sessionObj.completeListsObject.lists[i];
					}
				}
				if (list != null){
					result.users = list.list_users
					return res.json(json_api_responses.success(result));
				}else{
					getListMembers(err, user, {list_id : list_id}, internalHandler);
				}
			}
		});
	}catch(ex){
		res.json(json_api_responses.error(ex));
		return;
	}
}
module.exports.getListUsers = getListUsers;

/*
 * get the list of users 
 * */
function getListInformation(req, res) {
	var _method = "getListInformation";
	console.log("IN " + fileName + " - " + _method);
	var session = req.session;
	var slug = req.params.slug.toLowerCase();
	var owner_screen_name = req.params.owner_screen_name.toLowerCase();
	var user = null;
	var params = {};
	if (req.user){
		user = req.user;
	}else{
		return res.json(json_api_responses.error(error_codes.ACCESS_USER_ERROR));
	}
	
	params.slug = slug;
	params.owner_screen_name = owner_screen_name;
	function internalHandler(err, result){
		if (err)
			return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
		else
			return res.json(json_api_responses.success(result));
	}
	
	getListMembers(null, user, params, internalHandler);
}
module.exports.getListInformation = getListInformation;

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