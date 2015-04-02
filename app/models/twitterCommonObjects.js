var mongoose = require('mongoose');
mongoose.set('debug', false);

var twitterCommonObjects = mongoose.Schema({
	trendsAvailable : Object,
	created			: {type: Date, "default": Date.now}
});

module.exports = mongoose.model('TwitterCommonObjects', twitterCommonObjects);