var mongoose = require('mongoose');

var sessionObjects = mongoose.Schema({
	uid				: String,
	session_id		: String,
	created			: {type: Date, "default": Date.now},
	usersListHash			: Object,
	completeListsObject		: Object
});

module.exports = mongoose.model('SessionObjects', userSchema);