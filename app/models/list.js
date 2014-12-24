var mongoose = require('mongoose');

var listSchema = mongoose.Schema({
	turaco_user_id	: { type: Number, min: 0 },
	id 				: { type: Number, min: 0 },
	uid 			: { type: Number, min: 0 },
	own_list		: Boolean,
	category		: { type: Number, min: 0 },
	name			: String,
	member_count	: { type: Number, min: 0 },
	mode			: String,
	description		: String,
	full_name		: String,
	user			: {
		id			: { type: Number, min: 0 },
		name		: String,
		screen_name	: String
	},
	created			: {type: Date, "default": Date.now},
	active			: { type: Number, min: 0 }
});

module.exports = mongoose.model('List', listSchema);

module.exports.list = {
	name : "",
	mode : "",
	description : ""
};