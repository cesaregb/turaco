var express = require('express');
var router = express.Router();
var twitterController = require('../../config/TwitterController');
var turacoError = require('../../config/error_codes');
var json_api_responses = require('../../config/responses')();
var error_codes = turacoError.error_codes;
var listHelpers = require('../../utils/list_helpers');
var TwitterCommonObjectHelpers = require('../../utils/twitterCommonObject_helpers');
var twitter = require('ntwitter');
var User = require('../../app/models/user');
var List = require('../../app/models/list');
var SessionObjects = require('../../app/models/sessionObjects');
var async = require("async");
var loginGatherInfoUser = require('../../lib/loginGatherInfoUser');

var fileName = "userHandlers.js";
var pathString = "/api/users";

/* *********Request function ********** */
function getUserFromSession(req, res) {
	var _method = "getUserFromSession";
	console.log("IN " + fileName + " - " + _method);
	if (req.user){
		user = req.user;
		var twit = twitterController(user.token, user.tokenSecret);
		twit.verifyCredentials(function(err, data) {
			if (err){
				res.json(json_api_responses.error(error_codes.TWITTER_VERIFY_CREDENTIALS_ERROR, err));
				return;
			}
		}).showUser(user.uid, function(err, data) {
			if (err){ 
				res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
				return;
			}
			res.json(json_api_responses.success(data));
			return;
		});
	}else{
		res.json(json_api_responses.error(error_codes.USER_NOT_LOGED));
		return;
	}
}
module.exports.getUserFromSession = getUserFromSession;

function getTwitterUser(req, res) {
	var _method = "getTwitterUser";
	console.log("IN " + fileName + " - " + _method);
	if (req.user){
		var uid = req.params.uid;
		user = req.user;
		var twit = twitterController(user.token, user.tokenSecret);
		twit.verifyCredentials(function(err, data) {
			if (err){
				res.json(json_api_responses.error(error_codes.TWITTER_VERIFY_CREDENTIALS_ERROR, err));
				return;
			}
		}).showUser(uid, function(err, data) {
			if (err){ 
				res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
				return;
			}
			res.json(json_api_responses.success(data));
			return;
		});
	}else{
		res.json(json_api_responses.error(error_codes.USER_NOT_LOGED));
		return;
	}
}
module.exports.getTwitterUser = getTwitterUser;

/*
 * DEPRECATED
 * */
function getAllFriendsAPI(session, user, returnSession, callback){
	resutlt = {};
	if (typeof returnSession === 'function') {
		callback = returnSession;
		returnSession = null;
	}
	
	if((typeof returnSession !== "undefined") 
			&& returnSession != null 
			&& returnSession == true
			&& session.user_friends_response != null){  // return from session in case of needed... 
		return callback(null, session.user_friends_response);
	}
	var params = getParams(req);
	if (user == null){
		return callback("User is null");
	}
	
	helper = new listHelpers.ListHelper();
	helper.getUser(user, function(err, user){
		if (err){ return callback(err); }
		
		helper.getTwittObjectFromUser(function(err, twit){
			if (err){ return callback(err); }
			
			twit.showUser(user.uid, function(err, data) {
				if (err){ return callback(err); }
				
				/* get number of friends... */
				var friends_count = 0;
				for (var item in data) {
					if (data.hasOwnProperty(item)) {
						object = data[item];
						friends_count = object.friends_count;
					}
				}
				response.friends_count = friends_count;
				var parentCallback = callback;
				if (friends_count < 25000){
					var users = []; // users to be returned by the service (small consice information) 
					var twitter_users = []; // users to store on the database.. or make some other stuff with them... (all information returned from the service. )  
					var cursor = -1;
					/* async call to get all the user...
					 * this async iterates thru the getFriendsIds (up to 5000 by call) */
					async.whilst(
						function () {
							if (cursor == 0){
								response.users = users;
								session.full_user_friends_response = twitter_users;
								session.user_friends_response = response; // we ensure that the response is setted to the session
								return parentCallback(null, response);
							}
							return cursor != 0; 
						},
						function (callback) {
							var params = {cursor : cursor};
							var self = this;
							twit.getFriendsIds(user.screen_name, params, function(err, data) {
								if (err){
									callback(err, cursor);
								}
								cursor = data.next_cursor;
								var count = 0;
								var current_ids = "";
								var friends_in_array = 0;
								var idArray = data.ids;
								// split the returining array into chunks of 99 or less
								var i, j, temparray, chunk = 100;
								for (i = 0, j = idArray.length; i<j; i += chunk) {
								    var temparray = idArray.slice(i, (i + chunk) );
								    var stringSubArray = temparray.toString();
								    /* go and get the current information from the user... */
								    twit.lookupUser(stringSubArray, {include_entities: false}, function(err, data){
								    	friends_in_array = friends_in_array  + data.length;
										if (err){
											callback(err, cursor);
										}
										for (var index in data){
											var json_user = data[index];
											var turaco_user = {};
											turaco_user.id = json_user.id;
											turaco_user.name = json_user.name;
											turaco_user.screen_name = json_user.screen_name;
											turaco_user.description = json_user.description;
											turaco_user.profile_image_url = json_user.profile_image_url;
											
											twitter_users.push(data[index]); // adding to server side information about friends
											users.push(turaco_user); // information that is going to be returned to the user...  
										}
										if (idArray.length <= friends_in_array){ // when all the friends are comleted
											callback(null, cursor);
										}
								    });
								}
							});
						},
						function (err) {
							if (err){
								return parentCallback(err, null);
							}
						}
					);
				}else{
					/*getting friends but not all.. */
					var users = [];
					var params = {cursor : -1};
					params.count = 200;
					var self = this;
					twit.getFriends(user.screen_name, params, function(err, data) {
						if (err){ return callback(err); }
						cursor = data.next_cursor;
						for (var index in data.users){
							var json_user = data.users[index]; 
							var turaco_user = {};
							turaco_user.id = json_user.id;
							turaco_user.name = json_user.name;
							turaco_user.screen_name = json_user.screen_name;
							turaco_user.description = json_user.description;
							turaco_user.profile_image_url = json_user.profile_image_url;
							users.push.apply(users, turaco_user);
						}
						response.users = users;
						session.full_user_friends_response = null;
						return callback(null, response);
					});
				}
			});
		});
	});
}
/*
 * END DEPRECATED
 * */

function getAllFriends(req, res) {
	var _method = "get /getAllFriends (get USERS)";
	console.log("IN " + fileName + " - " + _method);
	var session = req.session;
	var response = {};
	var myParams = getParams(req);
	var user = req.user;
	if (session.friends != null){
		return res.json(json_api_responses.success(session.friends));
	}else{
		SessionObjects.findOne({
			'uid' : user.uid
		}).sort({created: 'desc'}).exec(function(err, sessionObj) {
			if(sessionObj == null || err){
				getAllFriendsAPI(session, session.user, function(err, data){ //get users from Twitter api 
					if (err){
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}
					
					session.user_friends_response = data;
					res.json(json_api_responses.success(data));
					return;
				});
				
				var gatherInfoInstance = new loginGatherInfoUser();
				gatherInfoInstance.getAll(req.user, req.session, function(err, data){
					if (err){
						console.log("TURACO_DEBUG - error gettin the user basic information " );
					}else{
						console.log("TURACO_DEBUG - user information gather complete." );
					}
					
				});
			}else{
				session.friends = sessionObj.friends;
				session.usersListHash = sessionObj.usersListHash; 
				session.completeListsObject = sessionObj.completeListsObject;
				session.user_lists = sessionObj.lists; 
				return res.json(json_api_responses.success(sessionObj.friends));
			}
		});
	}
}

module.exports.getAllFriends = getAllFriends;
/*
 * DEPRECATED
 * */
function getAllFriends2(req, res) {
	var _method = "get /friends_list_1 (get USERS)";
	console.log("IN " + fileName + " - " + _method);
	var session = req.session;
	var response = {};
	var myParams = getParams(req);
	/* 
	 * Check if response is on session already... 
	 * what would be the response if we offer pagination?? 
	 * */
	if (session.user_friends_response != null ) {
		res.json(json_api_responses.success(session.user_friends_response));
		return;
	}
	getAllFriendsAPI(session, session.user, function(err, data){ //get users from Twitter api 
		if (err){
			res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
			return;
		}
		
		session.user_friends_response = data;
		res.json(json_api_responses.success(data));
		return;
	});
}
module.exports.getAllFriends2 = getAllFriends2;
/*
 * END DEPRECATED
 * */

/*
 * Iterate thru the users comparing it with the hash. 
 * used for get list IN the list or get list NOT IN list
 * */
function getUsersByStatusList(session, user, status, callback){
	status = (status == "undefined" || status == null)?true:status;
	var response = {};
	var resultUsers = [];
	getAllFriendsAPI(session, user, true, function(err, data){
		var userFriends = data.users;
		SessionObjects.findOne({
			'uid' : user.uid
		}).sort({created: 'desc'}).exec(function(err, sessionObj) {
			if (err) {
				callback(err);
				res.json(json_api_responses.error(err));
				return;
			}
			var usersListHash = sessionObj.usersListHash;
			for (index in userFriends){
				var _user = userFriends[index];
				if (status && usersListHash[_user.id]){
					resultUsers.push(_user);
				}else if(!status && (usersListHash[_user.id] == null || usersListHash[_user.id] == "undefined")){
					resultUsers.push(_user);
				}
			}
			response.friends_count = resultUsers.length;
			response.users = resultUsers;
			return callback(null, response);
		});
	});
}

function getFilteredFriends(req, res) {
	var _method = "getFilteredFriends";
	console.log("IN " + fileName + " - " + _method);
	var filter = req.params.filter;
	var session = req.session;
	var response = {};
	var user = req.user;
	
	return res.json(json_api_responses.error("nor working yet... "));
	if (false){
		if (filter == "byUnlisted"){
			getUsersByStatusList(session, user, false, function(err, result){
				if (err) {
					return res.json(json_api_responses.error(err));
				}
				response = result;
				return res.json(json_api_responses.success(response));
			});
		}else if (filter == "byListed"){
			getUsersByStatusList(session, user, true, function(err, result){
				if (err) {
					return res.json(json_api_responses.error(err));
				}
				response = result;
				return res.json(json_api_responses.success(response));
			});
		}else{
			res.json(json_api_responses.error("no filter selected ", err));
			return;
		}
	}
}
module.exports.getFilteredFriends = getFilteredFriends;

function searchUser(req, res) {
	var _method = "searchUser";
	console.log("IN " + fileName + " - " + _method);
	var search = req.params.search;
	var session = req.session;
	var user = null;
	var params = getParams(req);
	try{
		if (req.user){
			user = req.user;
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
				twit.searchUser(search, params, function(err, data){
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
		res.json(json_api_responses.error(ex));
		return;
	}
}
module.exports.searchUser = searchUser;

/*
 * get the loged user closes trends...
 * */
function getTrendsPlace(req, res) {
	var _method = "getTrendsPlace";
	console.log("IN " + fileName + " - " + _method);
	var place_id = req.params.id;
	var params = {id : place_id};
	var session = req.session;
	var user = null;
	if (req.user){
		user = req.user;
	}else{
		return res.json(json_api_responses.error(error_codes.ACCESS_USER_ERROR, err));
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
			twit.getTrendsPlace(params, function(err, data){
				if (err){
					return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
				}else{
					var finalObject = data;
					result = {};
					if (data.length > 0 ){
						//which one should be selected!! 
						finalObject = data[0];
					}
					result.trends_info = finalObject;
					return res.json(json_api_responses.success(result));
				}
			});
		});
	});
}
module.exports.getTrendsPlace = getTrendsPlace;

/*
 * get the loged user closes trends...
 * */
function getSavedSearches(req, res) {
	var _method = "getSavedSearches";
	console.log("IN " + fileName + " - " + _method);
	var place_id = req.params.id;
	var params = {id : place_id};
	var session = req.session;
	var user = null;
	if (req.user){
		user = req.user;
	}else{
		return res.json(json_api_responses.error(error_codes.ACCESS_USER_ERROR, err));
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
			twit.getSavedSearches(params, function(err, data){
				if (err){
					return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
				}else{
					return res.json(json_api_responses.success(data));
				}
			});
		});
	});
}
module.exports.getSavedSearches = getSavedSearches;


function getTrendsClosest(req, res) {
	var _method = "getTrendsClosest";
	console.log("IN " + fileName + " - " + _method);
	var lat = req.params.lat;
	var long = req.params.long;
	var params = {lat : lat, long: long};
	var session = req.session;
	var user = null;
	if (req.user){
		user = req.user;
	}else{
		return res.json(json_api_responses.error(error_codes.ACCESS_USER_ERROR, err));
	}
	helper = new listHelpers.ListHelper();
	var twit = null;
	var result = {};
	async.waterfall([
		function(callback){
			helper.getUser(user, callback);
		},
		function(user, callback){
			helper.getTwittObjectFromUser(callback);
		},
		function(_twit, user, callback){
			twit = _twit;
			twit.getTrendsClosest(params, callback);
		},
		function(data, rate_limit, callback){
			if (typeof rate_limit == "function"){
				callback = rate_limit;
			}
			var finalObject = data;
			if (data.length > 0 ){
				//which one should be selected!! 
				finalObject = data[0];
			}
			woeid = finalObject.woeid;
			result.place = finalObject;
			params = {id: woeid};
			twit.getTrendsPlace(params, callback);
		},
		function(data, rate_limit, callback){
			if (typeof rate_limit == "function"){
				callback = rate_limit;
			}
			var finalObject = data;
			if (data.length > 0 ){
				//which one should be selected!! 
				finalObject = data[0];
			}
			result.trends_info = finalObject;
			callback(null, result)
			
		}], function (err, result) {
			if (err){ 
				console.log("TURACO_DEBUG - Error on the waterfall: " + err); 
				return res.json(json_api_responses.error(err));
			}
			return res.json(json_api_responses.success(result));
		}
	);
}
module.exports.getTrendsClosest = getTrendsClosest;

function getTrendsAvailable(req, res) {
	var _method = "getTrendsAvailable";
	console.log("IN " + fileName + " - " + _method);
	var place_id = req.params.id;
	var params = {};
	var session = req.session;
	var user = null;
	if (req.user){
		user = req.user;
	}else{
		console.log("TURACO_DEBUG - getting values form database ");
		return res.json(json_api_responses.error(error_codes.ACCESS_USER_ERROR, err));
	}
	var twitterCommonObjectHelpers = new TwitterCommonObjectHelpers();
	twitterCommonObjectHelpers.initialize({autoCreate : true}, function(err, twitterCommonObjects, isNew){
		if (!isNew ){ // if today we have brought the lists 
			return res.json(json_api_responses.success(twitterCommonObjects.trendsAvailable));
		}else{
			helper = new listHelpers.ListHelper();
			helper.getUser(user, function(err, user){
				if (err){
					return res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				}
				helper.getTwittObjectFromUser(function(err, twit){
					if (err){
						return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					}
					twit.getTrendsAvailable(params, function(err, data){ //getting trends from database... 
						if (err){
							return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						}else{
							//save information ....
							twitterCommonObjectHelpers.saveTrendsAvailable(data, function(err, result){
								if (err){
									return res.json(json_api_responses.error(err));
								}else{
									return res.json(json_api_responses.success(data));
								}
							});
						}
					});
				});
			});
		}
	});
}
module.exports.getTrendsAvailable = getTrendsAvailable;

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