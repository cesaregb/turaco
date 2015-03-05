var mongoose = require('mongoose');
mongoose.set('debug', false);

var sessionObjects = mongoose.Schema({
	uid				: String,
	session_id		: String,
	created			: {type: Date, "default": Date.now},
	lists			: Object,
	friends			: Object,
	usersListHash			: Object,
	completeListsObject		: Object
});

module.exports = mongoose.model('SessionObjects', sessionObjects);