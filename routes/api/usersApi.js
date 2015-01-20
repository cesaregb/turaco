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
var async = require("async");

var fileName = "usersApi.js";
var pathString = "/api/users";

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

router.get('/:uid', function(req, res) {
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

module.exports = router;
