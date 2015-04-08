var express = require('express');
var router = express.Router();
var twitterController = require('../../config/TwitterController');
var turacoError = require('../../config/error_codes');
var json_api_responses = require('../../config/responses')();
var error_codes = turacoError.error_codes;

//Helpers
var listHelpers = require('../../utils/list_helpers');
var sessionObjectHelpers = require('../../utils/sessionObject_helpers'); 
var TwitterCommonObjectHelpers = require('../../utils/twitterCommonObject_helpers');

var twitter = require('ntwitter');


//Models
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
				console.log("TURACO_DEBUG - calling GET_ALL from userHandlers.js")
				var gatherInfoInstance = new loginGatherInfoUser();
				gatherInfoInstance.getAll(req.user, req.session, function(err, data){
					if (err){
						console.log("TURACO_DEBUG - error gettin the user basic information " );
						return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
					}else{
						console.log("TURACO_DEBUG - user information gather complete." );
						return res.json(json_api_responses.success(data));
					}
				});
			}else{
				return res.json(json_api_responses.success(sessionObj.friends));
			}
		});
	}
}

module.exports.getAllFriends = getAllFriends;

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
	var params = {};
	var session = req.session;
	var user = null;
	if (session.savedSearches != null) {
		console.log("TURACO_DEBUG - getting saved search from session");
		return res.json(json_api_responses.success(session.savedSearches));
	}
	
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
			
			sessionHelper = new sessionObjectHelpers({param:"nel"});
			sessionHelper.getSavedSearches(user, function(err, _savedSearches){
				if (err || _savedSearches == null){
					twit.getSavedSearches(params, function(err, data){
						if (err){
							return res.json(json_api_responses.error(error_codes.SERVICE_ERROR, err));
						}else{
							var result = [];
							for (var i in data){
								var search = data[i];
								var query = search.query; 
								var updated_query = query.substring(1, query.length);
								search.updated_query = updated_query;
								result.push(search);
							}
							return res.json(json_api_responses.success(result));
						}
					});
				}else{
					return res.json(json_api_responses.success(_savedSearches));
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