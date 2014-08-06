var twitter = require('ntwitter');
var configAppCredentials = require('./appCredentials');

twitterConfig = function(accessTokenKey, accessTokenSecret, _log) {
	if (_log != null && _log == true){
		console.log("Setting: \n TWITTER_CONSUMER_KEY: " +configAppCredentials.TWITTER_CONSUMER_KEY+ "" +
				"\n TWITTER_CONSUMER_SECRET: " +configAppCredentials.TWITTER_CONSUMER_SECRET+ "" +
				"\n accessTokenKey: " +accessTokenKey+ "" +
				"\n accessTokenSecret: " +accessTokenSecret+ "" +
		"\n COMPLETE! ");
	}
	var twit = new twitter({
		consumer_key : configAppCredentials.TWITTER_CONSUMER_KEY,
		consumer_secret : configAppCredentials.TWITTER_CONSUMER_SECRET,
		access_token_key : accessTokenKey,
		access_token_secret : accessTokenSecret
	});
	
	return twit;
}

module.exports = twitterConfig;
