var mongoose = require('mongoose');

var listInfoTemporal = mongoose.Schema({
	uid				: String,
	list			: Object
});

module.exports = mongoose.model('ListInfoTemporal', listInfoTemporal);