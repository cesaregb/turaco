var express = require('express');
var router = express.Router();
var twitterController = require('../config/TwitterController');
var turacoError = require('../config/error_codes');
var error_codes = turacoError.error_codes;
var listHelpers = require('../utils/list_helpers');
var twitter = require('ntwitter');
var User = require('../app/models/user');
var List = require('../app/models/list');
var SessionObjects = require('../app/models/sessionObjects');
var user_friends_temporal = require('./user_friends_temporal.json');
var SessionObjects = require('../app/models/sessionObjects');
var user_friends_temporal = require('./user_friends_temporal.json');
var async = require("async");

var fileName = "loginGatherInfoUser.js";
var pathString = "/api/users";

function GatherUserInformation() {
	if (!(this instanceof GatherUserInformation))
		return new GatherUserInformation();

	var defaults = {
		consumer_key : null,
		consumer_secret : null,
		access_token_key : null,
		access_token_secret : null
	};
}

module.exports = GatherUserInformation;

function getAllFriendsAPI(twit, user, returnSession, functionCallback){
	var _method = "getAllFriendsAPI";
	console.log("IN " + fileName + " - " + _method);
	var resutlt = {};
	if (typeof returnSession === 'function') {
		functionCallback = returnSession;
		returnSession = null;
	}

	if (true){ // DEV MOC DATA... GETTING DATA FROM JSON PREDEFINED...
		if (user == null){
			return functionCallback("User is null");
		}
		twit.showUser(user.uid, function(err, showUserData) {
			if (err){
				console.log("TURACO_DEBUG - error: " + _method  + " err:" + err);
				return functionCallback(err);
			}

			/* get number of friends... */
			var friends_count = 0;
			for (var item in showUserData) {
				if (showUserData.hasOwnProperty(item)) {
					object = showUserData[item];
					friends_count = object.friends_count;
				}
			}
			resutlt.friends_count = friends_count;
			if (friends_count < 25000){
				var users = []; // users to be returned by the service (small consice information)
				var complete_users = {}; // users to be returned by the service (small consice information)
				var twitter_users = []; // users to store on the database.. or make some other stuff with them... (all information returned from the service. )
				var cursor = -1;
				async.whilst(
					function (){
						if (cursor == 0){
							console.log("TURACO_DEBUG - gather of the friends complete, # friends: " + users.length);
							resutlt.complete_users = complete_users;
							resutlt.twitter_users = twitter_users;
							resutlt.users = users;
							return functionCallback(null, resutlt);
						}
						return cursor != 0;
					},
					function (whilstCallback) {
						var params = {cursor : cursor};
						var self = this;
						twit.getFriendsIds(user.screen_name, params, function(err, getFriendsIdsData){
							console.log("TURACO_DEBUG - within the callback function from getFriendsIds");
							if (err){
								console.log("TURACO_DEBUG - Error on getFriendsIds" + err );
								return whilstCallback(err, null);
							}
							cursor = getFriendsIdsData.next_cursor;
							var count = 0;
							var current_ids = "";
							var friends_in_array = 0;
							var idArray = getFriendsIdsData.ids;
							// split the returining array into chunks of 100 or less
							var i, j, temparray, chunk = 100;
							console.log("TURACO_DEBUG - idArray.length: " + idArray.length);
							var chunkArrays = [];
							for (i = 0, j = idArray.length; i < j; i += chunk) {
								var temparray = idArray.slice(i, (i + chunk) );
								var stringSubArray = temparray.toString();
								chunkArrays.push(stringSubArray);
							}
							
							console.log("TURACO_DEBUG - chunkArrays.length: " + chunkArrays.length);
							
							var x = 0;
							var loopArray = function(chunkArrays) {
								console.log("TURACO_DEBUG - loopArray " + x);
								callLookupUser(chunkArrays[x], function(err){
									if (err){
										whilstCallback("Error on the async task... ")
									}else{
										x++;
										if(x < chunkArrays.length) {
											return loopArray(chunkArrays);   
										}else{
											return whilstCallback(null, cursor); 
										}
									}
							    }); 
							};
							
							
							function callLookupUser(stringSubArray, forEachCallback) {
								console.log("TURACO_DEBUG - calling twit.lookupUser");
							    twit.lookupUser(stringSubArray, {include_entities: false}, function(err, lookupUserData){
							    	console.log("TURACO_DEBUG - within the callback function from lookupUser");
							    	if (err){
							    		console.log("TURACO_DEBUG - Error on lookupUser" + err );
							    		return forEachCallback(err);
							    	}
							    	friends_in_array = friends_in_array  + lookupUserData.length;
							    	for (var index in lookupUserData){
							    		var json_user = lookupUserData[index];
							    		var turaco_user = {};
							    		turaco_user.id = json_user.id;
							    		turaco_user.name = json_user.name;
							    		turaco_user.screen_name = json_user.screen_name;
							    		turaco_user.description = json_user.description;
							    		turaco_user.profile_image_url = json_user.profile_image_url;
							    		
							    		complete_users[json_user.id] = json_user;
							    		twitter_users.push(lookupUserData[index]); // adding to server side information about friends
							    		users.push(turaco_user); // information that is going to be returned to the user...
							    	}
							    	return forEachCallback(null);
//							    	if (idArray.length <= friends_in_array){ // when all the friends are completed
//							    	}else{
//							    		return forEachCallback(null);
//							    	}
							    });							    

							}
							
							loopArray(chunkArrays);
							
						});
					},
					function (err){
						if (err){
							console.log("TURACO_DEBUG - error: " + _method  + " err:" + err);
							return functionCallback(err);
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
					return functionCallback(null, response);
				});
			}
		});
	}else{ // read file temporal..
		return functionCallback(null, user_friends_temporal);
	}
}

/*
 * function get all the user friends.
 * this is the function to be called.. this calls callback with the result from the api..
 * */
GatherUserInformation.prototype.getAllFriends = function(twit, user, callback) {
	var _method = "getAllFriends";
	console.log("IN " + fileName + " - " + _method);
	getAllFriendsAPI(twit, user, function(err, data){
		//get users from Twitter api
		if (err){
			console.log("TURACO_DEBUG - Error getting the users.. " + err);
			return;
		}
		callback(null, data);
	});
}

function getListsUsers(twit, lists, user, callback){
	// iterar las listas.. con async...
	if (lists ==  null || lists.length == 0){
		return callback("lists array empty");
	}
	var usersListHash = {};
	var completeListsObject = {};
	completeListsObject.lists = [];
	var functionCallback = callback;
	async.forEach(lists, function(list, callback) {
		var completeObjectList = list;
		var usersList = [];
		var parentCallback = callback;
		var cursor = -1;
		async.whilst(
			function () {
				if(cursor == 0){
					list.list_users = usersList;
					console.log("TURACO_DEBUG - adding users to object " + list.list_users.length);
					completeListsObject.lists.push(list);
					parentCallback();
				}
				return cursor != 0;
			},
			function (callback) {
				var params = {cursor : cursor};
				params.count = 5000;
				var self = this;
				twit.getListMembers(list.id, params, function(err, data){
					if (err){
						callback(err);
					}
					cursor = data.next_cursor;
					usersList.push.apply(usersList, data.users);

					for (pos in data.users){
						// iterate thru the list to hash the existing users.. for latter validation...
						(function(item){
							usersListHash[item.id] = true;
						})(data.users[pos]);
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
			var set = {};
			set.usersListHash = usersListHash;
			set.completeListsObject = completeListsObject;
			callback(null, set);
		}else{
			callback("Error on the async task... ");
		}
	});
}

/*
 * function get all user lists and the users within those lists...
 * this is the function to be called.. this calls callback with the result from the api..
 * this has to be called after bringin the user friends...
 * 		it depends on the creation of the object on the database...
 * */
GatherUserInformation.prototype.getUsersListFunction = function(twit, user, callback) {
	var _method = "getUsersListFunction";
	console.log("IN " + fileName + "-" + _method);
	uid = user.uid;
	var response = {};
	twit.getLists(user.screen_name, function(err, data) {
		if (err){ return callback(err);}
		var listCollection = {};
		response.timestamp = Date.now;
		response.complete_lists = data;
		response.lists = [];
		for (pos in data){
			(function(item){
				var list = new List();
				list = listHelpers.convertJson2List(list, item, uid);
				listCollection[list.id] = true;
				response.lists.push(list);
			})(data[pos]);
		}
		/*
		 * get list users...
		 * */
		return callback(null, response);
	});
}

GatherUserInformation.prototype.getAll = function(user, session, callback){
	global.refresSessionObject = true;
	var gatherInfoObjec = this;
	if (typeof session === 'function') {
		callback = session;
		session = null;
	}

	var twit = null
	var helper = new listHelpers.ListHelper();
	var usersListHash = {};
	var listResponse = {};
	var tmpSet = {};
	console.log("TURACO_DEBUG - befor the waterfall... ");
	async.waterfall([
		function(callback){
			console.log("TURACO_DEBUG - getUser");
			helper.getUser(user, callback);
		},
		function(user, callback){
			console.log("TURACO_DEBUG - getTwittObjectFromUser");
			helper.getTwittObjectFromUser(callback);
		},
		function(_twit, user, callback){
			twit = _twit;
			console.log("TURACO_DEBUG - calling getUsersListFunction");
			gatherInfoObjec.getUsersListFunction(twit, user, callback);
		},
		function(data, callback){
			listResponse = data;
			console.log("TURACO_DEBUG - calling getListsUsers *get the users from the provided lists* ");
			getListsUsers(twit, listResponse.complete_lists, user, callback);

		},
		function(set, callback){
			if (!set) {
				callback(err);
			}
			tmpSet = set;
			usersListHash = tmpSet.usersListHash;
			console.log("TURACO_DEBUG - calling getAllFriends *get all the user friends (accounts that follow)*");
			gatherInfoObjec.getAllFriends(twit, user, callback);

		},
		function(dataAllFriends, callback){
			// add the inlist item.
			var friendsListHash = {};
			for (index in dataAllFriends.users){
				if (usersListHash[dataAllFriends.users[index].id]){
					friendsListHash[dataAllFriends.users[index].id] = true;
					dataAllFriends.users[index].inList = true;
				}else{
					dataAllFriends.users[index].inList = false;
				}
			}

			if (session != null){
				session.user_lists = listResponse.lists;
				session.user_lists = listResponse.lists;
				session.usersListHash = tmpSet.usersListHash;
				session.completeListsObject = tmpSet.completeListsObject;
				session.friends = dataAllFriends;
			}

			var sessionObject = new SessionObjects();
			sessionObject.uid = user.uid;
			sessionObject.session_id = "not_existing.. ";
			sessionObject.lists = listResponse.lists;
			sessionObject.usersListHash = tmpSet.usersListHash;
			sessionObject.completeListsObject = tmpSet.completeListsObject;
			sessionObject.friends = dataAllFriends;
			sessionObject.save(function(err){
				if (err){ return callback(err);
				}else{
					console.log("TURACO_DEBUG - Lists saved on session \n # lists: " + listResponse.lists.length);
					callback(null, "success");
				}
			});
		}], function (err, result) {
			if (err){ console.log("TURACO_DEBUG - Error on the waterfall: " + err); }
			return callback(err, result);
			// result is 'd'
		}
	);

}

GatherUserInformation.prototype.testThis = function(user, session, callback){
	global.refresSessionObject = true;
	var gatherInfoObjec = this;
	if (typeof session === 'function') {
		callback = session;
		session = null;
	}
	var twit = null
	var helper = new listHelpers.ListHelper();
	var usersListHash = {};
	helper.getUser(user, function(err, user){
		if (err){ return callback(err); }
		helper.getTwittObjectFromUser( function(err, _twit){
			if (err){ return callback(err);}
			twit = _twit;
			var query = {uid: user.uid};
			// get friends...
			console.log("TURACO_DEBUG - calling getAllFriends *get all the user friends (accounts that follow)*");
			gatherInfoObjec.getAllFriends(twit, user, function(err, data){
				console.log("TURACO_DEBUG - callback from gatherInfoObjec.getAllFriends");
				var friendsListHash = {};
			});
		});
	});
}

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

/*
if (session.friends != null){
	return res.json(json_api_responses.success(session.friends));
}else{
	SessionObjects.findOne({
		'uid' : user.uid
	}).sort({created: 'asc'}).exec(function(err, sessionObj) {
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
 * */
