/**
 * List helpers
 */
var express = require('express');
var router = express.Router();
var error_codes = require('../config/error_codes');
var twitterController = require('../config/TwitterController');
var listHelpers = require('./list_helpers');
var twitter = require('ntwitter');
var async = require("async");
var User = require('../app/models/user');
var List = require('../app/models/list');
var SessionObjects = require('../app/models/sessionObjects');

var fileName = "list_helpers.js";

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
	//refresh lists with the sessionObj.completeListsObject.lists
	sessionObj.lists = [];
	for (index in sessionObj.completeListsObject.lists){
		var item = sessionObj.completeListsObject.lists[index];
		var list = new List();
		var uid = (this.user != null )? this.user.uid:"placeholder";s
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
			sessionObjectHelper.refreshListsObject(sessionObj, function(err, resp){
				return callback(err, resp);
			});
		}
	});
}

/*
 * remove list YES USERS
 * */
SessionObjectHelper.prototype.removeListComplete = function(user, list_id, listUsers, callback){
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
			for (index in sessionObj.lists){
				if (sessionObj.lists[index].id == list_object.list_id){
					sessionObj.lists[index].name = list_object.name;
					sessionObj.lists[index].mode = list_object.mode;
					sessionObj.lists[index].description = list_object.description;
				}
			}
			
			for (index in sessionObj.completeListsObject.lists){
				if (sessionObj.completeListsObject.lists[index].id != list_object.list_id){
					sessionObj.completeListsObject.lists[index].name = list_object.name;
					sessionObj.completeListsObject.lists[index].mode = list_object.mode;
					sessionObj.completeListsObject.lists[index].description = list_object.description;
				}
			}
			sessionObj.markModified('lists');
			sessionObj.markModified('completeListsObject.lists');
			
			sessionObj.save(function(err) {
				callback(res, global.success);
			});
		}
	});
}

/*
 * add list with or without users
 * */
SessionObjectHelper.prototype.addListFollow = function(user, list, twitter_users, callback){
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
 * */
SessionObjectHelper.prototype.listRefreshUsers = function(user, list_id, twit, callback){
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
			for (index in sessionObj.completeListsObject.lists){
				if (sessionObj.completeListsObject.lists[index].id == list_id){
					i = index;
					console.log("TURACO_DEBUG - FOUND : " + list_id);
					var _list = sessionObj.completeListsObject.lists[index];
					getListMembers(_list, function(err, usersList){
						if (err){
							return callback(err);
						}
						console.log("TURACO_DEBUG - usersList: " + usersList.length + " -- " + sessionObj.completeListsObject.lists[i].id );
						sessionObj.completeListsObject.lists[i].list_users = usersList;
						
						if (false){
							
							for (pos in usersList){
								// iterate thru the list to hash the existing users.. for latter validation...
								(function(item){
									sessionObj.usersListHash[item.id] = false;
								})(usersList[pos]);
							}
						}
						
						sessionObj.markModified('completeListsObject.lists');
//						sessionObj.markModified('usersListHash');
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
 * remove users from lists 
 * */
SessionObjectHelper.prototype.membersCreateAll = function(user, list_id, users_list, callback){
	var idArray = users_list.split(',');
	var twitter_users = [];
	var i, j, temparray, chunk = 100;
	console.log("TURACO_DEBUG - idArray.length: " + idArray.length);
	var chunkArrays = [];
	for (i = 0, j = idArray.length; i < j; i += chunk) {
		var temparray = idArray.slice(i, (i + chunk) );
		var stringSubArray = temparray.toString();
		chunkArrays.push(stringSubArray);
	}
	
	var x = 0;
	var loopArray = function(chunkArray, loopCallback) {
		console.log("TURACO_DEBUG - loopArray " + x);
		callLookupUser(chunkArrays[x], function(err){
			if (err){
				whilstCallback("Error on the async task... ")
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
		console.log("TURACO_DEBUG - calling twit.lookupUser");
	    twit.lookupUser(stringSubArray, {include_entities: false}, function(err, lookupUserData){
	    	console.log("TURACO_DEBUG - within the callback function from lookupUser");
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
					
					for ( index in sessionObj.completeListsObject.lists){
						if(sessionObj.completeListsObject.lists[index].id == list_id){
							sessionObj.completeListsObject.lists[index].list_users.apply.push(
									sessionObj.completeListsObject.lists[index].list_users, 
									twitter_users);
						}
					}
					
					sessionObj.markModified('completeListsObject.lists');
					sessionObj.save(function(err) {
						return callback(err, global.success);
					});
				}
			});
		}
	});
}



