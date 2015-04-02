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

var fileName = "sessionObject_helpers.js";

function merge(defaults) {
	for (var i = 1; i < arguments.length; i++) {
		for ( var opt in arguments[i]) {
			defaults[opt] = arguments[i][opt];
		}
	}
	return defaults;
};
function isFunctionA(object) {
	return (typeof object === 'function');
}

function SessionObjectHelper(options) {
	  if (!(this instanceof SessionObjectHelper)) return new SessionObjectHelper(options);
	  var defaults = {
	    consumer_key: null,
	    cookie_secret: null
	  };
	  this.options = merge(defaults, options);
}
SessionObjectHelper.user = null;
module.exports = SessionObjectHelper;

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
	for (index in sessionObj.completeListsObject.lists){
		var item = sessionObj.completeListsObject.lists[index];
		var list = new List();
		var uid = (this.user != null )? this.user.uid:"placeholder";s
		list = SessionObjectHelpers.convertJson2List(list, item, uid);
		sessionObj.lists.push(list);
	}
	
	
	var complete_users = sessionObj.friends.complete_users;
	var users = [];
	var twitter_users = [];
	for (var property in complete_users) {
	    if (complete_users.hasOwnProperty(property)) {
	    	twitter_users.push(complete_users[property]);
	    	var turaco_user = {};
    		turaco_user.id = complete_users[property].id;
    		turaco_user.name = complete_users[property].name;
    		turaco_user.screen_name = complete_users[property].screen_name;
    		turaco_user.description = complete_users[property].description;
    		turaco_user.profile_image_url = complete_users[property].profile_image_url;
	    	users.push(turaco_user);
	    }
	}
	sessionObj.friends.twitter_users = twitter_users;
	sessionObj.friends.users = users;
	
	
	sessionObj.markModified('lists');
	sessionObj.markModified('completeListsObject.lists');
	sessionObj.markModified('friends');
	sessionObj.markModified('userListHash');
	
	sessionObj.save(function(err) {
		callback(err, global.success);
	});
}

/*
 * require that:
 * sessionObj.completeListsObject.lists 
 * be complete.. 
 * */
SessionObjectHelper.prototype.refreshListsObject = function(sessionObj, user, callback){
	var _method = "refreshListsObject()";
	console.log("IN " + fileName + " - "+ _method);
	sessionObj.lists = [];
	for (index in sessionObj.completeListsObject.lists){
		var item = sessionObj.completeListsObject.lists[index];
		var list = new List();
		var uid = (this.user != null )? this.user.uid:"placeholder";
		list = listHelpers.convertJson2List(list, item, uid);
		sessionObj.lists.push(list);
	}
	sessionObj.markModified('lists');
	sessionObj.markModified('completeListsObject.lists');
	
	sessionObj.save(function(err) {
		callback(err, global.success);
	});
}

/*
 * add list with or without users
 * */
SessionObjectHelper.prototype.addList = function(user, list, users, callback){
	var _method = "addList()";
	console.log("IN " + fileName + " - "+ _method);
	if (isFunctionA(users) ){
		callback = users;
		users = null;
	}
	if(user == null || list == null){
		return callback("invalid params");
	}
	SessionObjects.findOne({
		'uid' : user.uid
	}).sort({created: 'desc'}).exec(function(err, sessionObj) {
		if(sessionObj == null || err){
			var _err = (err)?err:"Object sessionObj not found";
			return callback(_err);
		}else{
			var turaco_list = new List();
			turaco_list = listHelpers.convertJson2List(turaco_list, list, user.uid);
			sessionObj.lists.push(turaco_list);
			if (users != null){
				list.list_users = users;
			}
			sessionObj.completeListsObject.lists.push(list);
			sessionObj.markModified('lists');
			sessionObj.markModified('completeListsObject.lists');
			sessionObj.save(function(err) {
				return callback(err, global.success);
			});
		}
	});
}

/*
 * remove list NO USERA
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
			var _err = (err)?err:"Object sessionObj not found";
			return callback(_err);
		}else{
			for (index in sessionObj.completeListsObject.lists){
				if (sessionObj.completeListsObject.lists[index].id == list_id){
					sessionObj.completeListsObject.lists.splice(index, 1);
				}
			}
			
			// restore friends arrays 
			// restore lists 
			sessionObjectHelper.refreshListsObject(sessionObj, user, function(err, resp){
				return callback(err, resp);
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
			var _err = (err)?err:"Object sessionObj not found";
			return callback(_err);
		}else{
			
			for (index in sessionObj.completeListsObject.lists){
				if (sessionObj.completeListsObject.lists[index].id == list_id){
					sessionObj.completeListsObject.lists.splice(index, 1);
				}
			}
			
			for ( index in listUsers){
				var userId = listUsers[index].id;
				if (sessionObj.completeListsObject.friends.complete_users[userId] != null){
					delete sessionObj.completeListsObject.friends.complete_users[userId];
				}
				if (sessionObj.userListHash[userId] != null && sessionObj.userListHash[userId]){
					sessionObj.userListHash[userId] = false;
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
			var _err = (err)?err:"Object sessionObj not found";
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
 * add list with or without users
 * */
SessionObjectHelper.prototype.addListFollow = function(user, list, twitter_users, callback){
	var _method = "addListFollow()";
	console.log("IN " + fileName + " - "+ _method);
	if (isFunctionA(users) ){
		callback = users;
		users = null;
	}
	if(user == null || list == null){
		return callback("invalid params");
	}
	SessionObjects.findOne({
		'uid' : user.uid
	}).sort({created: 'desc'}).exec(function(err, sessionObj) {
		if(sessionObj == null || err){
			var _err = (err)?err:"Object sessionObj not found";
			return callback(_err);
		}else{
			
			var turaco_list = new List();
			turaco_list = listHelpers.convertJson2List(turaco_list, list, user.uid);
			sessionObj.lists.push(turaco_list);
			if (users != null){
				list.list_users = users;
			}
			sessionObj.completeListsObject.lists.push(list);
			
			//update users adding non existing...  
			for (var index in twitter_users) {
				var id = twitter_users[index].id;
				if (sessionObj.friends.complete_users[id] == null ){
					var json_user = twitter_users[index];
					var turaco_user = {};
					turaco_user.id = json_user.id;
					turaco_user.name = json_user.name;
					turaco_user.screen_name = json_user.screen_name;
					turaco_user.description = json_user.description;
					turaco_user.profile_image_url = json_user.profile_image_url;
					sessionObj.friends.complete_users[json_user.id] = json_user;
					sessionObj.friends.twitter_users.push(twitter_users[index]);
					sessionObj.friends.users.push(turaco_user);
				}
				if (!sessionObj.usersListHash[id]){
					sessionObj.usersListHash[id] = true;
				}
	    	}
			
			sessionObj.markModified('friends');
			sessionObj.markModified('lists');
			sessionObj.markModified('completeListsObject.lists');
			sessionObj.markModified('usersListHash');
			sessionObj.save(function(err) {
				return callback(err, global.success);
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
		console.log("TURACO_DEBUG - getListMembers list = " + list.name);
		var usersList = [];
		var cursor = -1;
		async.whilst(
			function () {
				if(cursor == 0){
					console.log("TURACO_DEBUG - adding users to object " + list.list_users.length);
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
			var _err = (err)?err:"Object sessionObj not found";
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
						var usersListHash = {};
						for(var index in usersList){
							//getting hashed version..
							usersListHash[usersList[index].id] = true;
						}
						sessionObj.completeListsObject.lists[i].list_users = usersList;
						sessionObj.completeListsObject.lists[i].list_users_hash = usersListHash;
						sessionObj.completeListsObject.lists[i].member_count = usersList.length;
						member_count = usersList.length;
						/*
						 * remove from the hashinglist the previous user array.
						 * */
						var userArray = users_list.split(",");
						for (pos in userArray){
							sessionObj.usersListHash[userArray[pos].id] = false;
						}

						for (var pos in sessionObj.lists){
							if (sessionObj.lists[pos].id == list_id){
								sessionObj.lists[pos].member_count = member_count;
							}
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
				return whilstCallback("Error on the async task... ");
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
					var _err = (err)?err:"Object sessionObj not found";
					return callback(_err);
				}else{
					var memeber_count = 0;
					
					for ( index in sessionObj.completeListsObject.lists){
						//iterate thru the existing lists... 
						
						if(sessionObj.completeListsObject.lists[index].id == list_id){
							// if we find the updating list.. with the id list_id
							
							var validated_twitter_users = []; 
							for (var i in twitter_users){
								// iterate thru the users to be aded, 
								// and remove the existing users to avoid duplicate;
								
								var user = twitter_users[i];
								if(sessionObj.completeListsObject.lists[index].list_users_hash == null){
									sessionObj.completeListsObject.lists[index].list_users_hash = {};
								}
								
								if (sessionObj.completeListsObject.lists[index].list_users_hash[user.id] == null
										|| sessionObj.completeListsObject.lists[index].list_users_hash[user.id] == false) {
									// if user not found on existing we add it.. 
									validated_twitter_users.push(twitter_users[i]);
									sessionObj.completeListsObject.lists[index].list_users_hash[user.id] = true;
								}
							}
							
							if (sessionObj.completeListsObject.lists[index].list_users == null
									|| typeof sessionObj.completeListsObject.lists[index].list_users == "undefined") {
								
								sessionObj.completeListsObject.lists[index].list_users = []; 
							}
							
							sessionObj.completeListsObject.lists[index].list_users.push.apply(
									sessionObj.completeListsObject.lists[index].list_users, 
									validated_twitter_users);
							
							memeber_count = sessionObj.completeListsObject.lists[index].list_users.length;
							sessionObj.completeListsObject.lists[index].member_count = sessionObj.completeListsObject.lists[index].list_users.length; 
						}
					}
					
					for ( index in sessionObj.lists){
						if(sessionObj.lists[index].id == list_id){
							sessionObj.lists[index].member_count = memeber_count; 
						}
					}
					
					var userArray = users_list.split(",");
					for (pos in userArray){
						if (sessionObj.friends.complete_users[userArray[pos]] != null){
							sessionObj.usersListHash[userArray[pos].id] = true;
						}
					}
					
					sessionObj.markModified('lists');
					sessionObj.markModified('completeListsObject.lists');
					sessionObj.markModified('usersListHash');
					sessionObj.save(function(err) {
						return callback(err, global.success);
					});
				}
			});
		}
	});
}


/*
 * GETTERS
 * */ 
/*
 * remove list YES USERS
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
			var _err = (err)?err:"Object sessionObj not found";
			return callback(_err);
		}else{
			var savedSearches = sessionObj.savedSearches;
			callback(null, savedSearches);
		}
	});
}