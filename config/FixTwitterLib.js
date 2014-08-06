var twitter = require('ntwitter');

twitter.prototype.getLists = function(id, params, callback) {
	if (typeof params === 'function') {
		callback = params;
		params = null;
	}

	var defaults = {
		key : 'lists'
	};
	if (typeof id === 'string')
		defaults.screen_name = id;
	else
		defaults.user_id = id;
	params = utils.merge(defaults, params);

	// var url = '/lists.json';
	var url = '/lists/list.json';
	// this._getUsingCursor(url, params, callback);
	this.get(url, params, callback);
	return this;
}

