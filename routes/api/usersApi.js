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

var fileName = "usersApi.js";
var pathString = "/api/users";

/*
 * Get logged user from the turao system...  
 * */
router.get('/', function(req, res) {
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
});

/*
 * Get user from the turao system...  
 * */
router.get('/by_user/:uid', function(req, res) {
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
});

/*
 * GET ALL THE "FOLLOW" 
 * */
router.get('/friends_list_deprecated', function(req, res) {
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
});

/*
 * GET ALL THE "FOLLOW" BY ID
 * */
router.get('/friends_list', function(req, res) {
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
		console.log("Getting User FRIENDS from session.")
		res.json(json_api_responses.success(session.user_friends_response));
		return;
	}
	if (true){ // disabled while developing... 
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
					console.log("friends_count: " + friends_count);
					if (friends_count < 25000){
						var users = []; // users to be returned by the service (small consice information) 
						var twitter_users = []; // users to store on the database.. or make some other stuff with them... (all information returned from the service. )  
						var cursor = -1;
						/* async call to get all the user...
						 * this async iterates thru the getFriendsIds (up to 5000 by call) */
						async.whilst(
							function () {
								console.log("TURACO_DEBUG - in callback checking cursor... : " + cursor + "\n users: " + users.length + " \n");
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
								console.log("TURACO_DEBUG - Before getting the friend ids");
								twit.getFriendsIds(user.screen_name, params, function(err, data) {
									
									if (err){
										callback(err, cursor);
									}
									cursor = data.next_cursor;
									var count = 0;
									var current_ids = "";
									var friends_in_array = 0;
									console.log("TURACO_DEBUG - Before the loop of the friends... ");
									var idArray = data.ids;
									// split the returining array into chunks of 99 or less
									var i, j, temparray, chunk = 99;
									for (i = 0, j = idArray.length; i<j; i += chunk) {
									    var temparray = idArray.slice(i, (i + chunk) );
									    friends_in_array = friends_in_array  + chunk;
									    var stringSubArray = temparray.toString();
									    /* go and get the current information from the user... */
									    twit.lookupUser(stringSubArray, {include_entities: false}, function(err, data){
									    	console.log("TURACO_DEBUG - response from lookupUser DATA: " + data.length);
											if (err){
												callback(err, cursor);
											}
											for (var index in data){
												var json_user = data[index];
												var turaco_user = {};
												turaco_user.name = json_user.name;
												turaco_user.screen_name = json_user.screen_name;
												turaco_user.description = json_user.description;
												turaco_user.profile_image_url = json_user.profile_image_url;
												
												twitter_users.push(data[index]); // adding to server side information about friends
												users.push(turaco_user); // information that is going to be returned to the user...  
											}
											console.log("TURACO_DEBUG - Users within loop getting users \n\tlength: " + users.length);
											console.log("TURACO_DEBUG - NUMBERS " + idArray.length + " -- " + friends_in_array + " -- " + i);
											if (idArray.length <= friends_in_array){ // when all the friends are comleted
												console.log("TURACO_DEBUG - callback from inner loop: " + idArray.length + " -- " + friends_in_array);
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
});

/*
 * GET ALL THE "FOLLOW" 
 * */
router.get('/search_user/:search', function(req, res) {
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
});

/*
 * TESTING....   
 * */
router.get('/test/a', function(req, res) {
	var _method = "get /test (get user)";
	console.log("IN " + fileName + "-" + _method);
	var data = {
	            "id": 36063580,
	            "id_str": "36063580",
	            "name": "Cesar Gonzalez",
	            "screen_name": "cesaregb",
	            "location": "Guadalajara Mexico",
	            "profile_location": null,
	            "description": "....",
	            "url": null,
	            "entities": {
	                "description": {
	                    "urls": []
	                }
	            },
	            "protected": false,
	            "followers_count": 259,
	            "friends_count": 534,
	            "listed_count": 1,
	            "created_at": "Tue Apr 28 13:27:03 +0000 2009",
	            "favourites_count": 160,
	            "utc_offset": -21600,
	            "time_zone": "Central Time (US & Canada)",
	            "geo_enabled": false,
	            "verified": false,
	            "statuses_count": 1300,
	            "lang": "en",
	            "status": {
	                "created_at": "Sun Dec 28 16:08:04 +0000 2014",
	                "id": 549235343183335400,
	                "id_str": "549235343183335424",
	                "text": "En que momento se volvio \"cool\" tener los regalos en el arbolito en bolsas departamentales con logos, acaso es presuncion?",
	                "source": "<a href=\"http://twitter.com\" rel=\"nofollow\">Twitter Web Client</a>",
	                "truncated": false,
	                "in_reply_to_status_id": null,
	                "in_reply_to_status_id_str": null,
	                "in_reply_to_user_id": null,
	                "in_reply_to_user_id_str": null,
	                "in_reply_to_screen_name": null,
	                "geo": null,
	                "coordinates": null,
	                "place": null,
	                "contributors": null,
	                "retweet_count": 0,
	                "favorite_count": 0,
	                "entities": {
	                    "hashtags": [],
	                    "symbols": [],
	                    "user_mentions": [],
	                    "urls": []
	                },
	                "favorited": false,
	                "retweeted": false,
	                "lang": "es"
	            },
	            "contributors_enabled": false,
	            "is_translator": false,
	            "is_translation_enabled": false,
	            "profile_background_color": "000000",
	            "profile_background_image_url": "http://abs.twimg.com/images/themes/theme14/bg.gif",
	            "profile_background_image_url_https": "https://abs.twimg.com/images/themes/theme14/bg.gif",
	            "profile_background_tile": false,
	            "profile_image_url": "http://pbs.twimg.com/profile_images/546144222990983168/0YoQY3jx_normal.jpeg",
	            "profile_image_url_https": "https://pbs.twimg.com/profile_images/546144222990983168/0YoQY3jx_normal.jpeg",
	            "profile_banner_url": "https://pbs.twimg.com/profile_banners/36063580/1416417330",
	            "profile_link_color": "ABB8C2",
	            "profile_sidebar_border_color": "000000",
	            "profile_sidebar_fill_color": "000000",
	            "profile_text_color": "000000",
	            "profile_use_background_image": false,
	            "default_profile": false,
	            "default_profile_image": false,
	            "following": false,
	            "follow_request_sent": false,
	            "notifications": false
		};
	res.json(json_api_responses.success(data));
	return;
	
});

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

module.exports = router;
