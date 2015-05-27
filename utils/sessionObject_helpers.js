/**
 * List helpers
 * DATABASE HELPERS RELATED.
 */
var express = require('express');
var listHelpers = require('./list_helpers');
var twitter = require('ntwitter');
var async = require("async");

var User = require('../app/models/user');
var List = require('../app/models/list');
var SessionObjects = require('../app/models/sessionObjects');
var ListInfoTemporal = require('../app/models/listInfoTemporal');

var fileName = "sessionObject_helpers.js";

function SessionObjectHelper(options) {
  if (!(this instanceof SessionObjectHelper)) return new SessionObjectHelper(options);
}
SessionObjectHelper.user = null;
SessionObjectHelper.sessionObject = null;
module.exports = SessionObjectHelper;

SessionObjectHelper.prototype.createSessionObject = function(user, callback){
	var _method = "createSessionObject()";
	console.log("IN " + fileName + " - "+ _method);
	var obj = this;
	
	// we remove existing information this may on the future be overrided in case we start using the information... 
	SessionObjects.remove({uid: user.uid}, function(err) {
		if (!err){
			createSession();
		}
	});
	
	function createSession(){
		var sessionObject = new SessionObjects();
		sessionObject.uid = user.uid;
		sessionObject.save(function(err){
			if (err){ 
				return callback(err);
			}else{
				obj.sessionObject = sessionObject;
				obj.user = user;
				callback(null, sessionObject);
			}
		});
	}
}

/*
 * require that:
 * sessionObj.completeListsObject.lists 
 * sessionObj.friends.complete_users 
 * be complete.. 
 * */
SessionObjectHelper.prototype.refreshListsUsersObj = function(sessionObj, callback){
	var _method = "refreshListsUsersObj()";
	console.log("IN " + fileName + " - "+ _method);
	//refresh lists with the sessionObj.completeListsObject.lists
	sessionObj.lists = [];
	var uid = sessionObj.uid;
	for (index in sessionObj.completeListsObject.lists){
		var item = sessionObj.completeListsObject.lists[index];
		var list = new List();
		list = listHelpers.convertJson2List(list, item, uid);
		sessionObj.lists.push(list);
	}
	
	
	var complete_users = sessionObj.friends.complete_users;
	var users = createUserArrayFromJsonTwitObj(complete_users, null);
	
	sessionObj.friends.users = users;
	
	sessionObj.markModified('lists');
	sessionObj.markModified('completeListsObject.lists');
	sessionObj.markModified('friends');
	sessionObj.markModified('usersListHash');
	
	sessionObj.save(function(err) {
		callback(err, global.success);
	});
}

/*
 * add list with or without users
 * */
/*
 * add list with or without users
 * */
SessionObjectHelper.prototype.addList = function(user, list, twitter_users, callback){
	var _method = "addList()";
	console.log("IN " + fileName + " - "+ _method);
	
	if (true){
		var _err = "Object sessionObj not found" + user.uid;
		return callback(_err);
	}
	
	if (typeof twitter_users == "function"){
		callback = twitter_users;
		twitter_users = null;
	}
	
	if(user == null || list == null){
		return callback("invalid params");
	}
	SessionObjects.findOne({
		'uid' : user.uid
	}).sort({created: 'desc'}).exec(function(err, sessionObj) {
		if(sessionObj == null || err){
			console.log("TURACO_DEBUG - Error getting session while adding lists... " +
					"\n error: " + error + " \n sessionObj: " + JSON.stringify(sessionObj));
			
			
			var _err = (err)?err:"Object sessionObj not found" + user.uid;
			return callback(_err);
		}else{
			var existingLists = sessionObj.lists;
			var listExisting = false;
			for (var lI in existingLists){// validate if the list exist FOR SUBCRIPTIONS 
				if (existingLists[lI].id == list.id){
					listExisting = true;
				}
			}
			if (! listExisting){
				var turaco_list = new List();
				turaco_list = listHelpers.convertJson2List(turaco_list, list, user.uid);
				sessionObj.lists.push(turaco_list);
				
				if (twitter_users != null){
					list.list_users = twitter_users;
					var list_users_hash = {};
					for (var i in twitter_users){
						list_users_hash[twitter_users[i].id] = true;
					}
					list.list_users_hash = list_users_hash;
					
					//update users adding non existing... 
					var friendsUpdated = false;
					for (var index in twitter_users) {
						var id = twitter_users[index].id;
						if (sessionObj.friends.complete_users[id] != null 
								&& sessionObj.friends.complete_users[id].inList == false){
							friendsUpdated = true;
							sessionObj.friends.complete_users[id].inList = true;
						}
						
						sessionObj.usersListHash[id] = (sessionObj.usersListHash[id] == null) ? 1 : sessionObj.usersListHash[id] + 1;
					}
					if (friendsUpdated){ // if we removed the inList value from at least one friend ... 
						var complete_users = sessionObj.friends.complete_users;
						var users = createUserArrayFromJsonTwitObj(complete_users, null);
						sessionObj.friends.users = users;
						sessionObj.markModified('friends');
					}
				}
				sessionObj.completeListsObject.lists.push(list);
				
				sessionObj.markModified('lists');
				sessionObj.markModified('completeListsObject');
				sessionObj.markModified('usersListHash');
				sessionObj.save(function(err) {
					return callback(err, global.success);
				});
			}else{
				// return true because the list exist.
				return callback(null, global.success);
			}
		}
	});
}

/*
 * add list with or without users
 * */
SessionObjectHelper.prototype.addListFollow = function(user, list, twitter_users, callback){
	var _method = "addListFollow()";
	console.log("IN " + fileName + " - "+ _method);
	
	if(user == null || list == null){
		return callback("invalid params");
	}
	
	SessionObjects.findOne({
		'uid' : user.uid
	}).sort({created: 'desc'}).exec(function(err, sessionObj) {
		if(sessionObj == null || err){
			var _err = (err)?err:"Object sessionObj not found" + user.uid;
			return callback(_err);
		}else{
			var turaco_list = new List();
			list.member_count = twitter_users.length;
			turaco_list = listHelpers.convertJson2List(turaco_list, list, user.uid);
			sessionObj.lists.push(turaco_list);
			
			if (twitter_users != null){
				list.list_users = twitter_users;
				var list_users_hash = {};
				for (var i in twitter_users){
					list_users_hash[twitter_users[i].id] = true;
				}
				list.list_users_hash = list_users_hash;

				//update users adding non existing... 
				for (var index in twitter_users) {
					var id = twitter_users[index].id;
					if (sessionObj.friends.complete_users[id] == null ){
						var json_user = twitter_users[index];
						json_user.inList = true;
						json_user.following = true;
						sessionObj.friends.complete_users[json_user.id] = json_user;
					}else{
						sessionObj.friends.complete_users[id].inList = true;
					}
					
					sessionObj.usersListHash[id] = (sessionObj.usersListHash[id] == null) ? 1 : sessionObj.usersListHash[id] + 1;
				}
				
				var complete_users = sessionObj.friends.complete_users;
				var users = createUserArrayFromJsonTwitObj(complete_users, null);
				sessionObj.friends.users = users;
			}
			sessionObj.completeListsObject.lists.push(list);
			
			sessionObj.markModified('friends');
			sessionObj.markModified('lists');
			sessionObj.markModified('completeListsObject');
			sessionObj.markModified('usersListHash');
			sessionObj.save(function(err) {
				return callback(err, global.success);
			});
		}
	});
}
/*
 * remove list NO UNFOLLOW Users just remove them from local references!! 
 * */
SessionObjectHelper.prototype.removeList = function(user, list_id, callback){
	var _method = "removeList()";
	console.log("IN " + fileName + " - "+ _method);
	this.user = user;
	if(user == null || list_id == null){
		return callback("invalid params");
	}
	var sessionObjectHelper = this;
	SessionObjects.findOne({
		'uid' : user.uid
	}).sort({created: 'desc'}).exec(function(err, sessionObj) {
		if(sessionObj == null || err){
			var _err = (err)?err:"Object sessionObj not found" + user.uid;
			return callback(_err);
		}else{
			var friendsUpdated = false;
			for (index in sessionObj.completeListsObject.lists){
				if (sessionObj.completeListsObject.lists[index].id == list_id){
					
					var thisListUsers = sessionObj.completeListsObject.lists[index].list_users; 

					//decrease the usersListHash
					for (var i in thisListUsers){
						if (sessionObj.usersListHash[thisListUsers[i].id] != null 
								&& sessionObj.usersListHash[thisListUsers[i].id] > 0) {
							sessionObj.usersListHash[thisListUsers[i].id] = sessionObj.usersListHash[thisListUsers[i].id] - 1;
						}
						//remove user flag for inList 
						if ((sessionObj.usersListHash[thisListUsers[i].id] == null 
								|| sessionObj.usersListHash[thisListUsers[i].id] == 0) 
								&& sessionObj.friends.complete_users[thisListUsers[i].id] != null){
							friendsUpdated = true;
							sessionObj.friends.complete_users[thisListUsers[i].id].inList = false;
						}
					}
					sessionObj.completeListsObject.lists.splice(index, 1);
				}
			}
			
			if (friendsUpdated){
				var users = createUserArrayFromJsonTwitObj(sessionObj.friends.complete_users, null);
				sessionObj.friends.users = users;
			}
			//clear list object to "re-build"
			sessionObj.lists = [];
			var uid = sessionObj.uid;
			for (index in sessionObj.completeListsObject.lists){
				var item = sessionObj.completeListsObject.lists[index];
				var list = new List();
				list = listHelpers.convertJson2List(list, item, uid);
				sessionObj.lists.push(list);
			}
			sessionObj.markModified('lists');
			sessionObj.markModified('friends');
			sessionObj.markModified('completeListsObject.lists');
			
			sessionObj.save(function(err) {
				callback(err, global.success);
			});
			
		}
	});
}

/*
 * remove list YES USERS
 * */
SessionObjectHelper.prototype.removeListComplete = function(user, list_id, listUsers, callback){
	var _method = "removeListComplete()";
	console.log("IN " + fileName + " - "+ _method);
	if(user == null || list_id == null){
		return callback("invalid params");
	}
	this.user = user;
	var sessionObjectHelper = this;
	SessionObjects.findOne({
		'uid' : user.uid
	}).sort({created: 'desc'}).exec(function(err, sessionObj) {
		if(sessionObj == null || err){
			var _err = (err)?err:"Object sessionObj not found" + user.uid;
			return callback(_err);
		}else{
			for (index in sessionObj.completeListsObject.lists){
				if (sessionObj.completeListsObject.lists[index].id == list_id){
					sessionObj.completeListsObject.lists.splice(index, 1);
				}
			}
			for (index in listUsers){
				var userId = listUsers[index].id;
				if (sessionObj.friends.complete_users[userId] != null){
					delete sessionObj.friends.complete_users[userId];
				}
				if (sessionObj.usersListHash[userId] != null && sessionObj.usersListHash[userId] > 0){
					sessionObj.usersListHash[userId] = sessionObj.usersListHash[userId] - 1 ;
				}
			}
			
			sessionObjectHelper.refreshListsUsersObj(sessionObj, function(err, resp){
				return callback(err, resp);
			});
		}
	});
}

/*
 * Update list
 * */
SessionObjectHelper.prototype.updateList = function(user, list_object, callback){
	var _method = "updateList()";
	console.log("IN " + fileName + " - "+ _method);
	if(user == null || list_object == null){
		return callback("invalid params");
	}
	this.user = user;
	
	SessionObjects.findOne({
		'uid' : user.uid
	}).sort({created: 'desc'}).exec(function(err, sessionObj) {
		if(sessionObj == null || err){
			var _err = (err)?err:"Object sessionObj not found" + user.uid;
			return callback(_err);
		}else{
			var uri = null;
			var full_name = null;
			for (index in sessionObj.lists){
				if (sessionObj.lists[index].id == list_object.list_id){
					if(sessionObj.lists[index].name != list_object.name){
						//if name has changed we need to fix the uri and full_name
						sessionObj.lists[index].name = list_object.name;
						var list_uri_name = list_object.name.toLowerCase();
						list_uri_name = list_uri_name.split(' ').join('-');
						
						var full_neme_array = sessionObj.lists[index].full_name.split("/");
						full_name = full_neme_array[0] + "/" + list_uri_name; 
						
						var uri_array = sessionObj.completeListsObject.lists[index].uri.split("/");
						uri = "/" + uri_array[1] + "/" + uri_array[2] + "/" + list_uri_name;

						sessionObj.lists[index].full_name = full_name;
						sessionObj.lists[index].uri = uri;
					}
					sessionObj.lists[index].mode = list_object.mode;
					sessionObj.lists[index].description = list_object.description;
				}
			}
			
			for (index in sessionObj.completeListsObject.lists){
				if (sessionObj.completeListsObject.lists[index].id == list_object.list_id){
					if(sessionObj.completeListsObject.lists[index].name != list_object.name){
						sessionObj.completeListsObject.lists[index].name = list_object.name;
						sessionObj.completeListsObject.lists[index].full_name = full_name;
						sessionObj.completeListsObject.lists[index].uri = uri;
					}
					sessionObj.completeListsObject.lists[index].mode = list_object.mode;
					sessionObj.completeListsObject.lists[index].description = list_object.description;
				}
			}
			sessionObj.markModified('lists');
			sessionObj.markModified('completeListsObject.lists');
			
			sessionObj.save(function(err) {
				callback(err, global.success);
			});
		}
	});
}


/*
 * remove users from lists 
 * called with remove users.
 * */
SessionObjectHelper.prototype.listRefreshUsers = function(user, list_id, users_list, twit, callback){
	var _method = "listRefreshUsers()";
	console.log("IN " + fileName + " - "+ _method);
	function getListMembers(list, forEachCallback) {
		var usersList = [];
		var cursor = -1;
		async.whilst(
			function () {
				if(cursor == 0){
					forEachCallback(null, usersList);
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
					callback(null, cursor);
				});
			},
			function (err) {
				if (err){
					forEachCallback(err);
				}
			}
		);
	}
	
	SessionObjects.findOne({
		'uid' : user.uid
	}).sort({created: 'desc'}).exec(function(err, sessionObj) {
		if(sessionObj == null || err){
			var _err = (err)?err:"Object sessionObj not found" + user.uid;
			return callback(_err);
		}else{
			var i = 0;
			var member_count = 0;
			var list_log = "";
			for (index in sessionObj.completeListsObject.lists){
				if (sessionObj.completeListsObject.lists[index].id == list_id){
					//
					list_log = sessionObj.completeListsObject.lists[index].id + " -- " + sessionObj.completeListsObject.lists[index].name; 
					i = index;
					var _list = sessionObj.completeListsObject.lists[index];
					getListMembers(_list, function(err, usersList){
						if (err){
							return callback(err);
						}
						var list_users_hash = {};
						for(var index in usersList){
							//getting hashed version..
							list_users_hash[usersList[index].id] = true;
						}
						sessionObj.completeListsObject.lists[i].list_users = usersList;
						sessionObj.completeListsObject.lists[i].list_users_hash = list_users_hash;
						sessionObj.completeListsObject.lists[i].member_count = usersList.length;
						member_count = usersList.length;
						/*
						 * remove from the hashinglist the previous user array.
						 * */
						var updateFriends = false;
						var userArray = users_list.split(",");
						for (pos in userArray){
							var userId = userArray[pos];
							if(sessionObj.usersListHash[userId] != null 
									&& sessionObj.usersListHash[userId] > 0 ){
								sessionObj.usersListHash[userId] = sessionObj.usersListHash[userId] - 1;
								
								if ((sessionObj.usersListHash[userId] == null 
										|| sessionObj.usersListHash[userId] == 0) 
										&&  sessionObj.friends.complete_users[userId] != null){
									updateFriends = true;
									sessionObj.friends.complete_users[userId].inList = false;
								}
							}
						}
						
						for (var pos in sessionObj.lists){
							if (sessionObj.lists[pos].id == list_id){
								sessionObj.lists[pos].member_count = member_count;
							}
						}
						
						if (updateFriends){ // if we removed the inList value from at least one friend ... 
							var complete_users = sessionObj.friends.complete_users;
							var users = createUserArrayFromJsonTwitObj(complete_users, null);
							sessionObj.friends.users = users;
							sessionObj.markModified('friends');
						}

						//save within the loop but executed only once on id match.
						sessionObj.markModified('completeListsObject.lists');
						sessionObj.markModified('lists');
						sessionObj.markModified('usersListHash');
						sessionObj.save(function(err) {
							return callback(err, global.success);
						});
					});
				}
			}
		}
	});
}

/*
 * create users from lists 
 * */
SessionObjectHelper.prototype.membersCreateAll = function(user, list_id, users_list, twit, callback){
	var _method = "membersCreateAll()";
	console.log("IN " + fileName + " - "+ _method);
	var idArray = users_list.split(',');
	var twitter_users = [];
	var i, j, temparray, chunk = 100;
	var chunkArrays = [];
	for (i = 0, j = idArray.length; i < j; i += chunk) {
		var temparray = idArray.slice(i, (i + chunk) );
		var stringSubArray = temparray.toString();
		chunkArrays.push(stringSubArray);
	}
	
	var x = 0;
	var loopArray = function(chunkArray, loopCallback) {
		callLookupUser(chunkArrays[x], function(err){
			if (err){
				return loopCallback("Error on the async task... ");
			}else{
				x++;
				if(x < chunkArrays.length) {
					return loopArray(chunkArrays, loopCallback);   
				}else{
					return loopCallback(null, global.success); 
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
	    	for (var index in lookupUserData){
	    		twitter_users.push(lookupUserData[index]); // adding to server side information about friends
	    	}
	    	return forEachCallback(null);
	    });							    

	}
	/*Sync call bacause use the same twit instance and may get hanging*/
	loopArray(chunkArrays, function (err, resp){
		if (err){
			console.log("TURACO_DEBUG - error saving .... ");
		}else{
			SessionObjects.findOne({
				'uid' : user.uid
			}).sort({created: 'desc'}).exec(function(err, sessionObj) {
				if(sessionObj == null || err){
					var _err = (err)?err:"Object sessionObj not found" + user.uid;
					return callback(_err);
				}else{
					var memeber_count = 0;
					
					var validated_twitter_users = []; 
					for ( index in sessionObj.completeListsObject.lists){
						//iterate thru the existing lists... 
						
						if(sessionObj.completeListsObject.lists[index].id == list_id){
							// if we find the updating list.. with the id list_id
							
							for (var i in twitter_users){
								// iterate thru the users to be aded, 
								// and remove the existing users to avoid duplicate;
								
								var user = twitter_users[i];
								//initialize list_user_hash of the list if not setted...
								if(sessionObj.completeListsObject.lists[index].list_users_hash == null){
									sessionObj.completeListsObject.lists[index].list_users_hash = {};
								}
								
								
								if (sessionObj.completeListsObject.lists[index].list_users_hash[user.id] == null
										|| sessionObj.completeListsObject.lists[index].list_users_hash[user.id] == false) {
									// if user not found on existing user list of the LIST we add it.. AVOID DUPLICATES...
									validated_twitter_users.push(twitter_users[i]);
									sessionObj.completeListsObject.lists[index].list_users_hash[user.id] = true;
								}
							}
							
							//initialize the list of users in case the list was empty before adding these users.
							if (sessionObj.completeListsObject.lists[index].list_users == null
									|| typeof sessionObj.completeListsObject.lists[index].list_users == "undefined") {
								
								sessionObj.completeListsObject.lists[index].list_users = []; 
							}
							
							//add the selected users to the array... 
							sessionObj.completeListsObject.lists[index].list_users.push.apply(
									sessionObj.completeListsObject.lists[index].list_users, 
									validated_twitter_users);
							
							memeber_count = sessionObj.completeListsObject.lists[index].list_users.length;
							sessionObj.completeListsObject.lists[index].member_count = sessionObj.completeListsObject.lists[index].list_users.length; 
						}
					}
					
					//update the member count...
					for ( index in sessionObj.lists){
						if(sessionObj.lists[index].id == list_id){
							sessionObj.lists[index].member_count = memeber_count; 
						}
					}
					
					// validate if the 
					for (pos in validated_twitter_users){
						var userId = validated_twitter_users[pos].id;
						sessionObj.usersListHash[userId] = (sessionObj.usersListHash[userId] == null) ? 1 : sessionObj.usersListHash[userId] + 1;
						sessionObj.friends.complete_users[userId] = validated_twitter_users[pos];
						sessionObj.friends.complete_users[userId].inList = true;
					}
					
					var complete_users = sessionObj.friends.complete_users;
					var users = createUserArrayFromJsonTwitObj(complete_users, null);
					sessionObj.friends.users = users;
					
					sessionObj.markModified('lists');
					sessionObj.markModified('completeListsObject.lists');
					sessionObj.markModified('friends');
					sessionObj.markModified('usersListHash');
					sessionObj.save(function(err) {
						return callback(err, global.success);
					});
				}
			});
		}
	});
}


function createUserArrayFromJsonTwitObj(complete_users, callback){
	var users = [];
	for (var property in complete_users) {
	    if (complete_users.hasOwnProperty(property)) {
	    	var turaco_user = {};
    		turaco_user.id = complete_users[property].id;
    		turaco_user.name = complete_users[property].name;
    		turaco_user.screen_name = complete_users[property].screen_name;
    		turaco_user.following = complete_users[property].following;
    		turaco_user.description = complete_users[property].description;
    		turaco_user.profile_image_url = complete_users[property].profile_image_url;
    		turaco_user.inList = complete_users[property].inList;
	    	users.push(turaco_user);
	    }
	}
	if (typeof(callback) == "function"){
		callback(null, users);
	}
	return users;
}

SessionObjectHelper.prototype.createUserArrayFromJsonTwitObj = createUserArrayFromJsonTwitObj;

/*
 * GETTERS
 * */ 
SessionObjectHelper.prototype.getSavedSearches = function(user, callback){
	var _method = "getSavedSearches()";
	console.log("IN " + fileName + " - "+ _method);
	if(user == null ){
		return callback("invalid params");
	}
	this.user = user;
	var sessionObjectHelper = this;
	SessionObjects.findOne({
		'uid' : user.uid
	}).sort({created: 'desc'}).exec(function(err, sessionObj) {
		if(sessionObj == null || err){
			var _err = (err)?err:"Object sessionObj not found" + user.uid;
			return callback(_err);
		}else{
			var savedSearches = sessionObj.savedSearches;
			callback(null, savedSearches);
		}
	});
}

/*
 * split init method 
 */
SessionObjectHelper.prototype.saveSavedSearches = function(savedSearches, callback){
	var _method = "saveSavedSearches()";
	console.log("IN " + fileName + " - "+ _method);
	if(savedSearches == null){
		return callback("invalid params");
	}
	this.sessionObject.savedSearches = savedSearches;
	this.sessionObject.markModified('savedSearches');
	this.sessionObject.save(function(err){
		return callback(err, global.success);
	});
}

SessionObjectHelper.prototype.saveLists = function(lists, callback){
	var _method = "saveLists()";
	console.log("IN " + fileName + " - "+ _method);
	
	if(lists == null){
		return callback("invalid params");
	}
	
	this.sessionObject.lists = lists;
	this.sessionObject.markModified('lists');
	this.sessionObject.save(function(err){
		return callback(err, global.success);
	});
}

SessionObjectHelper.prototype.saveListComplexObjects = function(set, callback){
	var _method = "saveListComplexObjects()";
	console.log("IN " + fileName + " - "+ _method);
	var parent = this;
	
	if(set == null){
		return callback("invalid params");
	}
	//save saved information... 
	console.log("TURACO_DEBUG - this.user.uid " + parent.user.uid);
	var completeListsObject = {};
	completeListsObject.uid = parent.user.uid;
	completeListsObject.lists = [];
	ListInfoTemporal.find({uid: parent.user.uid}, function(err, dataArray){
		console.log("TURACO_DEBUG - dataArray: " + dataArray.length);
		for (var i in dataArray){
			var list = dataArray[i].list;
				completeListsObject.lists.push(list);
		};
		completeObjGenerated(completeListsObject);
	});
	
	function removeTemporal(){
		ListInfoTemporal.remove({uid: parent.user.uid}, function(err){
			if (err) console.log("TURACO_DEBUG - Error deleting items: " +  err);
		});
	}
	
	function completeObjGenerated(completeListsObject){
		removeTemporal();
		console.log("TURACO_DEBUG - completeObjGenerated " + completeListsObject.lists.length);
		parent.sessionObject.usersListHash = set.usersListHash;
		parent.sessionObject.completeListsObject = completeListsObject;
		parent.sessionObject.markModified('usersListHash');
		parent.sessionObject.markModified('completeListsObject');
		parent.sessionObject.save(function(err){
			return callback(err, global.success);
		});
	}
}

SessionObjectHelper.prototype.saveAllFriends = function(dataAllFriends, callback){
	var _method = "saveAllFriends()";
	console.log("IN " + fileName + " - "+ _method);
	
	if(dataAllFriends == null){
		return callback("invalid params");
	}
	this.sessionObject.friends = dataAllFriends;
	this.sessionObject.markModified('friends');
	this.sessionObject.save(function(err){
		return callback(err, global.success);
	});
}

SessionObjectHelper.prototype.deleteExisting = function(callback){
	var _method = "deleteExisting()";
	console.log("IN " + fileName + " - "+ _method);
	this.sessionObject.remove(function(err) {
		return callback(err, global.success);
	});
}

