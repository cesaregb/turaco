var mongoose = require('mongoose');
mongoose.set('debug', false);

var listInfoTemporal = mongoose.Schema({
	uid				: String,
	list			: Object
});

module.exports = mongoose.model('ListInfoTemporal', listInfoTemporal);