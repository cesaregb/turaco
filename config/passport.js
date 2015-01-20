var User = require('../app/models/user');
var List = require('../app/models/list');
var configAppCredentials = require('./appCredentials');
var	TwitterStrategy = require('passport-twitter').Strategy;


passportConfig = function(passport) {
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

	passport.serializeUser(function(user, done) {
		console.log ("SERIALIZE: " + user.uid);
		done(null, user.uid);
	});

	passport.deserializeUser(function(obj, done) {
		User.findOne({uid: obj}, function (err, user) {
			done(err, user);
		});
//		done(null, obj);
	});

 	// =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'
	passport.use(new TwitterStrategy({
		consumerKey : configAppCredentials.TWITTER_CONSUMER_KEY,
		consumerSecret : configAppCredentials.TWITTER_CONSUMER_SECRET,
		callbackURL : "http://127.0.0.1:3000/auth/twitter/callback"
	}, function(token, tokenSecret, profile, done) {
		process.nextTick(function() {
			console.log("Profile: " + JSON.stringify(profile));
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
			/*Deleting information.. */
			User.remove({uid: profile.id}, function(err) {
				if(err) {
					console.log("error deleting item: " + err);
				} else {
					
					List.remove({uid: profile.id}, function(err) {
						if (!err){
							console.log("Lists deleted... ");
						}else{
							console.log("error deleting lists: " + err);
						}
					});
					console.log("User deleted... ");
				}	
			});
			user.save(function(err) {
				if(err) { throw err; }
				done(null, user);
			});
		});
	}));

};

module.exports = passportConfig;