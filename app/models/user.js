// app/models/user.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var userSchema = mongoose.Schema({
	token			: String,
	tokenSecret		: String,
	provider		: String,
	uid				: String,
	name			: String,
	username		: String,
	image			: String,
	created			: {type: Date, "default": Date.now}
});

module.exports = mongoose.model('User', userSchema);