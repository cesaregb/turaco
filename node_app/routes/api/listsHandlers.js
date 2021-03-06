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
				}else{
					var friends = sessionObj.friends;
					friends.complete_users = null;
					session.friends = friends;
					session.usersListHash = sessionObj.usersListHash; 
					session.savedSearches = sessionObj.savedSearches; 
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
					if (err){ 
						return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					}else{
						//update the sessionObject and set value to restore sessions 
						req.session.refresSessionObject = true;
						sessionHelper = new sessionObjectHelpers({param:"nel"});
						sessionHelper.addList(user, newListData, function(err, code){
							if (err){
								if (err.indexOf("Object sessionObj not found") > 0){
									res.redirect('/reload_user');
								}else{
									return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
								}
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
							req.session.refresSessionObject = true;
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
								req.session.refresSessionObject = true;
								
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
	var myParams = getParams(req); 
	if (req.user){
		user = req.user;
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
			getListMembers(null, user, myParams, function(err, result){
				if (err){
					return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
				}else{
					twit.subscribeme2List( myParams, function(err, subscribeListData){
						if (!err){
							req.session.refresSessionObject = true;
							sessionHelper = new sessionObjectHelpers({param:"nel"});
							sessionHelper.addList(user, result.list_info, result.users, function(err, code){
								if (err){
									if (err.indexOf("sessionObj not found") > 0){
										global.usersInProgress[req.session.user.uid] = null; //initialize the loading process
										req.logout();
										req.session.destroy();
										return res.json(json_api_responses.error(error_codes.MALFORMED_USER_DATA, err));
									}else{
										return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
									}
								}else{
									return res.json(json_api_responses.success(subscribeListData));
								}
							});
						}else{
							return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						}
					});
				}
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

					req.session.refresSessionObject = true;
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
						req.session.refresSessionObject = true;
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
						req.session.refresSessionObject = true;
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
				var result = {};
				var cursor = -1;
				var users = [];
				async.whilst(
					function () {
						if (cursor == 0){
							result.users = users;
							result.list_info = list_info;
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
		
		req.session.refresSessionObject = true;
		
		SessionObjects.findOne({
			'uid' : user.uid
		}).sort({created: 'desc'}).exec(function(err, sessionObj) {
			if(sessionObj == null || err){
				getListMembers(err, user, {list_id : list_id}, internalHandler);
			}else{
				var list = null;
				for (i in sessionObj.lists){
					if (sessionObj.completeListsObject.lists[i] != null 
							&& sessionObj.completeListsObject.lists[i].id == list_id){
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