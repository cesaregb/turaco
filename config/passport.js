var User = require('../app/models/user');
var List = require('../app/models/list');
var configAppCredentials = require('./appCredentials');
var	TwitterStrategy = require('passport-twitter').Strategy;


passportConfig = function(passport) {
	
	passport.serializeUser(function(user, done) {
		done(null, user.uid);
	});

	passport.deserializeUser(function(obj, done) {
		User.findOne({uid: obj}, function (err, user) {
			done(err, user);
		});
	});
	var twittSettings = 
	passport.use(new TwitterStrategy({
		consumerKey : configAppCredentials.TWITTER_CONSUMER_KEY,
		consumerSecret : configAppCredentials.TWITTER_CONSUMER_SECRET,
		callbackURL : configAppCredentials.CALLBACK_URL
	}, function(token, tokenSecret, profile, done) {
		process.nextTick(function() {
			var user = new User();
			user.provider = "twitter";
			user.token = token;
			user.tokenSecret = tokenSecret;
			user.uid = profile.id;
			user.screen_name = profile.username;
			user.name = profile.displayName;
			var image_name = profile._json.profile_image_url;
			image_name = image_name.replace("_normal", "");
			user.profile_image_url = image_name;
			user.profile = profile;
			/*Deleting user's existin information.. */
			User.remove({uid: profile.id}, function(err) {
				if(err) {console.log("error deleting item: " + err);
				} else {
					List.remove({uid: profile.id}, function(err) {
						if (!err){console.log("Lists deleted. ");}else{	console.log("error deleting lists: " + err);}
					});
					user.save(function(err) {
						if(err) { throw err; }
						done(null, user);
					});
				}	
			});
		});
	}));
};

module.exports = passportConfig;