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
var user_friends_temporal = require('./user_friends_temporal.json');
var async = require("async");

var fileName = "userHandlers.js";
var pathString = "/api/users";

/* *********Request function ********** */
function getUserFromSession(req, res) {
	var _method = "get / (get user)";
	console.log("IN " + fileName + "-" + _method);
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
	var _method = "get /:uid (get user)";
	console.log("IN " + fileName + "-" + _method);
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

function getAllFriends_depracated(req, res) {
	var _method = "get /friends_list (get USERS)";
	console.log("IN " + fileName + " - " + _method);
	var session = req.session;
	var response = {};
	/* 
	 * Check if response is on session already... 
	 * what would be the response if we offer pagination?? 
	 * */
	
	if (session.user_friends_response != null ) {
		console.log("Getting User FRIENDS from session.")
		res.json(json_api_responses.success(session.user_friends_response));
		return;
	}
	if (false){ // disabled while developing... 
		var params = getParams(req);
		
		if (session.user == null){
			res.json(json_api_responses.error(error_codes.ACCESS_USER_ERROR, err));
			return;
		}
		
		helper = new listHelpers.ListHelper();
		helper.getUser(session.user, function(err, user){
			
			if (err){
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}
			
			helper.getTwittObjectFromUser(function(err, twit){
				if (err){
					res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					return;
				}
				twit.showUser(user.uid, function(err, data) {
					if (err){ 
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}
					/* get number of friends... */
					var friends_count = 0;
					for (var item in data) {
						if (data.hasOwnProperty(item)) {
							object = data[item];
							friends_count = object.friends_count;
						}
					}
					
					response.friends_count = friends_count;
					
					if (friends_count < 1000){
						var users = [];
						var cursor = -1;
						async.whilst(
							function () {
								if (cursor == 0){
									response.users = users;
									console.log("adding to session: ");
									session.user_friends_response = response;
									res.json(json_api_responses.success(response));
									return;
								}
								return cursor != 0; 
							},
							function (callback) {
								var params = {cursor : cursor};
								params.count = 200;
								var self = this;
								twit.getFriends(user.screen_name, params, function(err, data) {
									if (err){
										res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
										return;
									}
									cursor = data.next_cursor;
									for (var index in data.users){
										var json_user = data.users[index];
										var turaco_user = {};
										turaco_user.id = json_user.id;
										turaco_user.name = json_user.name;
										turaco_user.screen_name = json_user.screen_name;
										turaco_user.description = json_user.description;
										turaco_user.profile_image_url = json_user.profile_image_url;
										users.push(turaco_user);
									}
									callback(null, cursor);
								});
							},
							function (err) {
								if (err){
									res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
									return;
								}
							}
						);
					}else{ // if user have a bunch of friends.... 
						var users = [];
						var params = {cursor : -1};
						params.count = 200;
						var self = this;
						twit.getFriends(user.screen_name, params, function(err, data) {
							if (err){
								res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
								return;
							}
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
							session.user_friends_response = response;
							res.json(json_api_responses.success(response));
							return;
							
						});
					}
				});
			});
		});
	}else{
		session.user_friends_response = user_friends_temporal;
		res.json(json_api_responses.success(user_friends_temporal));
		return;
	}
}
module.exports.getAllFriends_depracated = getAllFriends_depracated;

function getAllFriends(req, res) {
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
		console.log(" ****** Getting User FRIENDS from session.")
		res.json(json_api_responses.success(session.user_friends_response));
		return;
	}
	if (false){ // DEV MOC DATA... GETTING DATA FROM JSON PREDEFINED...  
		var params = getParams(req);
		
		if (session.user == null){
			res.json(json_api_responses.error(error_codes.ACCESS_USER_ERROR, err));
			return;
		}
		
		helper = new listHelpers.ListHelper();
		helper.getUser(session.user, function(err, user){
			
			if (err){
				res.json(json_api_responses.error(error_codes.USER_NOT_FOUND_ERROR, err));
				return;
			}
			
			helper.getTwittObjectFromUser(function(err, twit){
				if (err){
					res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					return;
				}
				twit.showUser(user.uid, function(err, data) {
					if (err){ 
						res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						return;
					}
					/* get number of friends... */
					var friends_count = 0;
					for (var item in data) {
						if (data.hasOwnProperty(item)) {
							object = data[item];
							friends_count = object.friends_count;
						}
					}
					
					response.friends_count = friends_count;
					if (friends_count < 25000){
						var users = []; // users to be returned by the service (small consice information) 
						var twitter_users = []; // users to store on the database.. or make some other stuff with them... (all information returned from the service. )  
						var cursor = -1;
						/* async call to get all the user...
						 * this async iterates thru the getFriendsIds (up to 5000 by call) */
						async.whilst(
							function () {
								console.log("**** TURACO_DEBUG - in callback checking cursor... : " + cursor + "\n users: " + users.length + " \n");
								if (cursor == 0){
									response.users = users;
									console.log("TURACO_DEBUG adding user Friends, to session:");
									session.user_friends_response = response;
									session.full_user_friends_response = twitter_users;
									
									res.json(json_api_responses.success(response));
									return;
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
											console.log("TURACO_DEBUG - NUMBERS " + idArray.length + " -- " + friends_in_array + " -- " + i + "\n\tlength: " + users.length);
											if (idArray.length <= friends_in_array){ // when all the friends are comleted
												callback(null, cursor);
											}
									    });
									}
								});
							},
							function (err) {
								console.log("TURACO_DEBUG - within error listener: " + err);
								if (err){
									
									res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
									return;
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
							if (err){
								res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
								return;
							}
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
							session.user_friends_response = response;
							session.full_user_friends_response = null;
							res.json(json_api_responses.success(response));
							return;
							
						});
					}
				});
			});
		});
	}else{
		session.user_friends_response = user_friends_temporal;
		res.json(json_api_responses.success(user_friends_temporal));
		return;
	}
}
module.exports.getAllFriends = getAllFriends;

function getFilteredFriends(req, res) {
	var _method = "get /friends_list/:filter (get USERS)";
	console.log("IN " + fileName + " - " + _method);
	var filter = req.params.filter;
	var session = req.session;
	var response = {};
	var resultUsers = [];
	
	if (filter == "byUnlisted"){
		console.log("TURACO_DEBUG - Session: %j", session);
		console.log("TURACO_DEBUG - session.user_friends_response:" + session.user_friends_response);
		console.log("TURACO_DEBUG - session.usersInList:" + session.usersInList);
		if (session.user_friends_response != null && session.usersInList != null){
			var userFriends = session.user_friends_response.data.users;
			var usersInList = session.usersInList;
			for (index in userFriends){
				var user = userFriends[index];
				if (usersInList[user.id]){
					resultUsers.push(user);
				}
			}
			response.friends_count = resultUsers.length;
			response.users = resultUsers;
			res.json(json_api_responses.success(response));
			return;
			
		}else{
			res.json(json_api_responses.error("We need to get the friends and complete liste objects first.. think how to do it... "));
			return;
		}
	}else if (filter == "byUnlisted111"){
		if (session.user_friends_response != null && session.completeListObject != null){
			session.completeListObject
		}else{
			res.json(json_api_responses.error("We need to get the friends and complete liste objects first.. think how to do it... ", err));
			return;
		}
		
	}else{
		res.json(json_api_responses.error("We need to get the friends and complete liste objects first.. think how to do it... ", err));
		return;
	}
	
}
module.exports.getFilteredFriends = getFilteredFriends;

function searchUser(req, res) {
	var _method = "get /search_user/:search (get USERS bt query)";
	console.log("IN " + fileName + "-" + _method);
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