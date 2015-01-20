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

ListHelper.prototype.getUser = function(uid, callback){
	var _method = "getUser()";
	console.log("IN " + fileName + "-"+ _method);
	var _self = this;
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
}

function isFunctionA(object) {
	return (typeof object === 'function');
}

ListHelper.prototype.getTwittObjectFromUser = function (user, callback){
	var _method = "getTwittObjectFromUser()";
	console.log("IN " + fileName + "-"+ _method);
	if (isFunctionA(user) ){ 
		callback = user;
		user = this.user;
	}
	try{
//		console.log("DEBUG: " + JSON.stringify(user) );
		var twit =  null;
		if (!user){
			callback("Error not user getTwittObjectFromUser", null, null);
		}else{
			twit = twitterController(user.token, user.tokenSecret);
			twit.verifyCredentials(function(err, data) {
				if (err){
					callback(err, null, null);
				}else{
					callback(null, twit, user);
				}
			});
		}
	}catch(ex){
		console.log("getTwittObjectFromUser - USER: " + user);
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
