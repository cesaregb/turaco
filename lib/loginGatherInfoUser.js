var express = require('express');
var router = express.Router();
var twitterController = require('../config/TwitterController');
var turacoError = require('../config/error_codes');

var error_codes = turacoError.error_codes;
var listHelpers = require('../utils/list_helpers');
var sessionObjectHelpers = require('../utils/sessionObject_helpers'); // we are doing this kind of correctly not others ...
var twitter = require('ntwitter');
var async = require("async");

var User = require('../app/models/user');
var List = require('../app/models/list');
var SessionObjects = require('../app/models/sessionObjects');
var ListInfoTemporal = require('../app/models/listInfoTemporal');

var user_friends_temporal = require('./user_friends_temporal.json');

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

function getAllFriendsAPI(twit, user, usersListHash, functionCallback){
	var _method = "getAllFriendsAPI";
	console.log("IN " + fileName + " - " + _method);
	var resutlt = {};
	if (typeof usersListHash === 'function') {
		functionCallback = usersListHash;
		usersListHash = {};
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
				var cursor = -1;
				async.whilst(
					function (){
						if (cursor == 0){
							resutlt.complete_users = complete_users;
							resutlt.users = users;
							return functionCallback(null, resutlt);
						}
						return cursor != 0;
					},
					function (whilstCallback) {
						var params = {cursor : cursor};
						var self = this;
						twit.getFriendsIds(user.screen_name, params, function(err, getFriendsIdsData){
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
							var chunkArrays = [];
							for (i = 0, j = idArray.length; i < j; i += chunk) {
								var temparray = idArray.slice(i, (i + chunk) );
								var stringSubArray = temparray.toString();
								chunkArrays.push(stringSubArray);
							}
							
							var x = 0;
							var loopArray = function(chunkArrays) {
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
							    twit.lookupUser(stringSubArray, {include_entities: false}, function(err, lookupUserData){
							    	if (err){
							    		console.log("TURACO_DEBUG - Error on lookupUser" + err );
							    		return forEachCallback(err);
							    	}
							    	friends_in_array = friends_in_array  + lookupUserData.length;
							    	for (var index in lookupUserData){
							    		var json_user = lookupUserData[index];
							    		var turaco_user = {};
							    		var flag =  (usersListHash[lookupUserData[index].id] != null 
							    				&& usersListHash[lookupUserData[index].id] > 0 )
										if (flag){
											json_user.inList = true;
											turaco_user.inList = true;
										}else{
											json_user.inList = false;
											turaco_user.inList = false;
										}
							    		turaco_user.id = json_user.id;
							    		turaco_user.name = json_user.name;
							    		turaco_user.screen_name = json_user.screen_name;
							    		turaco_user.following = json_user.following;
							    		turaco_user.description = json_user.description;
							    		turaco_user.profile_image_url = json_user.profile_image_url;
							    		complete_users[json_user.id] = json_user;
							    		users.push(turaco_user); // information that is going to be returned to the user...
							    	}
							    	return forEachCallback(null);
							    });							    

							}
							/*Sync call bacause use the same twit instance and may get hanging*/
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
						turaco_user.following = json_user.following;
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
GatherUserInformation.prototype.getAllFriends = function(twit, user, usersListHash, callback) {
	var _method = "getAllFriends";
	console.log("IN " + fileName + " - " + _method);
	getAllFriendsAPI(twit, user, usersListHash, function(err, data){
		//get users from Twitter api
		if (err){
			console.log("TURACO_DEBUG - Error getting the users.. " + err);
			return;
		}
		callback(null, data);
	});
}

function getListsUsers(twit, lists, user, functionCallback){
	var _method = "getListsUsers";
	console.log("IN " + fileName + " - " + _method);
	// iterar las listas.. con async...
	if (lists ==  null || lists.length == 0){
		return functionCallback("lists array empty");
	}
	var usersListHash = {};
	var completeListsObject = {};
	var listObject = null;
	completeListsObject.lists = [];
	var length= 0;
	for(var key in lists) {
	    if(lists.hasOwnProperty(key)){
	        length++;
	    }
	}
	
	var x = 0;
	var loopArray = function(array) {
		getListMembers(array[x], function(err){
			if (err){ // success 
				if (err.statusCode != null && parseInt(err.statusCode) == 404){
					console.log("TURACO_DEBUG - loopArray ERROR " + err + "\nList: ");
					var set = {};
					set.usersListHash = {};
					return functionCallback(null, set);
				}else{
					return functionCallback(err);
				}
				
			}else{
				x++;
				if(x < length) {
					//save information for the list on the database... 
					var listInfoTemporal = new ListInfoTemporal();
					listInfoTemporal.uid = user.uid;
					listInfoTemporal.list = listObject;
					listInfoTemporal.save(function(err){
						if (!err){ 
							listObject = null;
							return loopArray(array);
						}
					});
				}else{
					var set = {};
					set.usersListHash = usersListHash;
//					set.completeListsObject = completeListsObject;
					return functionCallback(null, set);
				}
			}
	    }); 
	};
	
	function getListMembers(list, forEachCallback) {
		var completeObjectList = list;
		var usersList = [];
		var listUsersHash = {};
		var cursor = -1;
		async.whilst(
			function () {
				if(cursor == 0){
					list.list_users = usersList;
					list.list_users_hash = listUsersHash;
					listObject = list;
//					completeListsObject.lists.push(list);
					forEachCallback();
				}
				return cursor != 0;
			},
			function (callback) {
				var params = {cursor : cursor};
				params.count = 5000;
				var self = this;
				console.log("TURACO_DEBUG - calling: twit.getListMembers: " + list.id + " params: " + JSON.stringify(params));
				twit.getListMembers(list.id, params, function(err, data){
					if (err){
						return callback(err);
					}
					cursor = data.next_cursor;
					usersList.push.apply(usersList, data.users);

					for (pos in data.users){
						// iterate thru the list to hash the existing users.. for latter validation...
						(function(item){
							listUsersHash[item.id] = true;
							usersListHash[item.id] = (usersListHash[item.id] == null) ? 1 : usersListHash[item.id] + 1;
						})(data.users[pos]);
					}
					return callback(null, cursor);
				});
			},
			function (err) {
				if (err){
					forEachCallback(err);
				}
			}
		);
	}
	
	/*Sync call bacause use the same twit instance and may get hanging*/
	console.log("TURACO_DEBUG - getListsUsers - lists: " + lists.length);
	loopArray(lists);
}

/*
 * function get all user lists and the users within those lists...
 * this is the function to be called.. this calls callback with the result from the api..
 * this has to be called after bringin the user friends...
 * 		it depends on the creation of the object on the database...
 * */
GatherUserInformation.prototype.getUsersListFunction = function(twit, user, callback) {
	var _method = "getUsersListFunction";
	console.log("IN " + fileName + " - " + _method);
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
				list.twiter_list = null;
				listCollection[list.id] = true;
				response.lists.push(list);
			})(data[pos]);
		}
		return callback(null, response);
	});
}

/*
 * get all the saved searchs for the user! 
 * */
GatherUserInformation.prototype.getSavedSearches = function(twit, callback) {
	var _method = "getSavedSearches";
	console.log("IN " + fileName + " - " + _method);
	var response = {};
	params = {};
	twit.getSavedSearches(params, function(err, data){
		if (err){
			callback(err);
		}else{
			var result = [];
			for (var i in data){
				var search = data[i];
				var query = search.query; 
				var updated_query = query.substring(1, query.length);
				search.updated_query = updated_query;
				result.push(search);
			}
			callback(null, result);
		}
	});
}

GatherUserInformation.prototype.getAll = function(user, session, callback){
	var gatherInfoObjec = this;
	if (typeof session === 'function') {
		callback = session;
		session = null;
	}

	function getFollowsTime(numFollows){
		/*
		 * This uses friends/ids and users/lookup
		 * friends/ids  in groups of 5,000 user IDs and multiple “pages”  (15m = 15 * 5000 = 75,000)
		 * 
			Rate limited? 		Yes
			Requests / 15-min window (user auth) 	15
			Requests / 15-min window (app auth) 	15
		 * 
		 * users/lookup  (15m = 180 * 100 = 18,000) 
		 * 
			Rate limited? 				Yes
			Requests / 15-min window (user auth) 	180
			Requests / 15-min window (app auth) 	60
		 * 
		 * Being 18,000 the limit at 2015 - May  of a 15m window  
		 * */
		var rate = 18000;
		var times = Math.floor(numFollows / rate);
		return times;
	}
	
	function getListsTime(lists, totalMemberLists){
		if ((lists.length > 100) || (totalMemberLists > 75000)){
			return 100;
		}
		return 0;
	}
	
	function validateTime(friends_count, lists){
		var totalMemberLists = 0; 
		for (var i in lists){
			totalMemberLists += lists[i].member_count;
		}
		
		var followsTime = getFollowsTime(friends_count);
		var listsTime = getListsTime(lists, totalMemberLists);
		
		if (Math.max(followsTime, listsTime) > 0){
			return false; 
 		}
		var time = Math.max(followsTime, listsTime) * 15;
		return true;
	}
	
	var uid = user.uid;
	
	var userProgress = (global.usersInProgress[uid] != null)? global.usersInProgress[uid] : null;
	//start the process either if we havent or if its complete..  Complete = refresh Session...
	if (userProgress == null){
		global.usersInProgress[user.uid] = {
			completed : false,
			percent : 0
		};
		global.refresSessionObject[user.uid] = true;
		var sessionHelper = new sessionObjectHelpers({param:"nel"});
		sessionHelper.createSessionObject(user, function(err, sessionObject){
			executeProcess();
		});
	}else{
		global.usersInProgress[user.uid] = {
			completed : false,
			error: true,
			percent : 0
    	 };
		callback("Information being loaded from twitter...");
	}
	
	function executeProcess(){
		var twit = null
		var helper = new listHelpers.ListHelper();
		async.waterfall([
		                 function(callback){
		                	 helper.getUser(user, callback);
		                 },
		                 function(_user, callback){
		                	 helper.getTwittObjectFromUser(callback);
		                 },
		                 function(_twit, _user, callback){
		                	 twit = _twit;
		                	 gatherInfoObjec.getSavedSearches(twit, callback);
		                 },
		                 function(_savedSearches, callback){
		                	 global.usersInProgress[user.uid] = {
	             				completed : false,
	             				percent : 10
		                	 };
		                	 sessionHelper.saveSavedSearches(_savedSearches, function (err, message){
		                		 if (err){ callback(err); }
		                		 gatherInfoObjec.getUsersListFunction(twit, user, callback);
		                	 });
		                 },
		                 function(data, callback){
		                	 global.usersInProgress[user.uid] = {
	             				completed : false,
	             				percent : 20
		                	 };
		                	 var friends_count = user.profile._json.friends_count;
		                	 if (validateTime(friends_count, data.lists)){
		                		 sessionHelper.saveLists(data.lists, function (err, message){
			                		 if (err){ callback(err); }
			                		 getListsUsers(twit, data.complete_lists, user, callback);
			                	 });
		                	 }else{
		                		 callback("Sorry, You either have to many list or you are following to many people we can't handle your information at this moment. We are working into that.");
		                	 }
		                 },
		                 function(set, callback){
		                	 if (!set) { callback(err); }
		                	 global.usersInProgress[user.uid] = {
	             				completed : false,
	             				percent : 70
		                	 };
		                	 sessionHelper.saveListComplexObjects(set, function (err, message){
		                		 if (err){ callback(err); }
		                		 gatherInfoObjec.getAllFriends(twit, user, set.usersListHash, callback);
		                	 });
		                 },
		                 function(dataAllFriends, callback){
		                	 global.usersInProgress[user.uid] = {
	             				completed : true,
	             				percent : 100
		                	 };
		                	 
		                	 global.refresSessionObject[user.uid] = true;
		                	 sessionHelper.saveAllFriends(dataAllFriends, function (err, message){
		                		 if (err){ callback(err); }
		                		 console.log("TURACO_DEBUG - Information SAVED" );
		                		 callback(null, "success");
		                	 });
		                	 
		                 }], function (err, result) {
							if (err){ 
								global.usersInProgress[user.uid] = {
									completed : false,
									error: true,
									percent : 0
						    	 };
								
								ListInfoTemporal.remove({uid: parent.user.uid}, function(err){
									if (err) console.log("TURACO_DEBUG - Error deleting items: " +  err);
								});
								
								console.log("TURACO_DEBUG - Error on the waterfall: " + err);
								//remove all the info 
								sessionHelper.deleteExisting(function(_err, data){
									return callback(err, result);
								});
							}else{
								return callback(err, result);
							}
						}
		);
	}
}

