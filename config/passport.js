var User = require('../app/models/user');
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
			User.findOne({uid: profile.id}, function(err, user) {
				if(user) {
					done(null, user);
				} else {
					console.log("--> Save to database: \n profile" + profile.id + " \n token: " + token + " \n tokenSecret: " + tokenSecret);
					var user = new User();
					user.provider = "twitter";
					user.token = token;
					user.tokenSecret = tokenSecret;
					user.uid = profile.id;
					user.name = profile.displayName;
					user.username = profile.username;
					user.image = profile._json.profile_image_url;
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