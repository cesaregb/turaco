/**
 * List helpers
 */
var express = require('express');
var router = express.Router();
var error_codes = require('../config/error_codes');
var twitterController = require('../config/TwitterController');
var twitter = require('ntwitter');
var User = require('../app/models/user');
var List = require('../app/models/list');

var fileName = "list_helpers.js";

function merge(defaults) {
	for (var i = 1; i < arguments.length; i++) {
		for ( var opt in arguments[i]) {
			defaults[opt] = arguments[i][opt];
		}
	}
	return defaults;
};

function ListHelper(options) {
	  if (!(this instanceof ListHelper)) return new ListHelper(options);
	  var defaults = {
	    consumer_key: null,
	    cookie_secret: null
	  };
	  this.options = merge(defaults, options);
}
ListHelper.user = null;
module.exports.ListHelper = ListHelper;

ListHelper.prototype.getUser = function(_user, uid, callback){
	var _method = "getUser()";
	var debug_message = (_user.uid != null)?_user.uid:"user null";
	console.log("IN " + fileName + " - " + _method + " - " + debug_message);
	if (typeof uid === 'function') {
		callback = uid;
		uid = null;
	}
	
	var _self = this;
	
	if ( _user == null) {
		User.findOne({uid: uid}, function(err, user) {
			if (err){
				callback(err, null);
			} 
			if(user) {
				_self.user = user;
				callback(null, user);
				return this;
			}else{
				callback(fileName + "-"+ _method + " Error user not found", null);
				return this;
			}
		});
	}else{
		_self.user = _user;
		callback(null, _user);
	}
}

function isFunctionA(object) {
	return (typeof object === 'function');
}

ListHelper.prototype.getTwittObjectFromUser = function (user, callback){
	var _method = "getTwittObjectFromUser()";
	console.log("IN " + fileName + " - "+ _method);
	if (isFunctionA(user) ){
		callback = user;
		user = this.user;
	}
	try{
		var twit =  null;
		if (!user){
			callback("Error not user getTwittObjectFromUser", null, null);
		}else{
			twit = twitterController(user.token, user.tokenSecret);
			console.log("TURACO_DEBUG - global.verify_credentials: " + global.verify_credentials);
			if (global.verify_credentials != true){
				// if the session havent been verified! ...
				twit.verifyCredentials(function(err, data) {
					if (err){
						callback(err, null, null);
					}else{
						global.verify_credentials = true;
						callback(null, twit, user);
					}
				});
			}else{
				callback(null, twit, user);
			}
		}
	}catch(ex){
		callback(error_codes.SERVICE_ERROR, twit, user);
	}
	return this;
}

/* *********METHODS********** */
function convertJson2List(list, item, uid){
	list.turaco_user_id = "";
	list.id = item.id;
	if (uid == list.user.id){
		list.own_list = true; 
	}else{
		list.own_list = false; 
	}
	list.name = item.name;
	list.member_count = item.member_count;
	list.uri = item.uri;
	list.mode = item.mode;
	list.description = item.description;
	list.full_name = item.full_name;
	list.user = {};
	list.user.id = item.user.id;
	list.uid = uid;
	list.user.name = item.user.name;
	list.user.screen_name = item.user.screen_name;
	list.active = 1;
	return list;
}
module.exports.convertJson2List = convertJson2List;

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
module.exports.getParams = getParams;

function example_async (twit, lists){
	for (i in lists){
		list = lists[i];
		/*
		 * get list's user
		 * this step may requiere async call because the list could be consumed with cursor calls...  
		 * */
		var objects = [];
		var cursor = -1;
		async.whilst(
			function () {
				if (cursor == 0){
					/*success after bringing all the data from twitter api*/
				}
				return cursor != 0; 
			},
			function (callback) {
				var params = {cursor : cursor};
				params.limit_depending_the_service = 10000;
				var self = this; 
				/*
				 * call the service 
				 * */
				
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
	}
}


