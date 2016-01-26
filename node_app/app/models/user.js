// app/models/user.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var userSchema = mongoose.Schema({
	token			: String,
	tokenSecret		: String,
	uid				: String,
	name			: String,
	screen_name		: String,
	profile_image_url: String,
	location		: String,
	url				: String,
	followers_count	: String,
	profile			: {},
	created			: {type: Date, "default": Date.now}
});

module.exports = mongoose.model('User', userSchema);