/**
 * List helpers
 */
var express = require('express');
var async = require("async");
var TwitterCommonObjects = require('../app/models/twitterCommonObjects');

var fileName = "twitterCommonObject_helpers.js";

function merge(defaults) {
	for (var i = 1; i < arguments.length; i++) {
		for ( var opt in arguments[i]) {
			defaults[opt] = arguments[i][opt];
		}
	}
	return defaults;
};
function isFunctionA(object) {
	return (typeof object === 'function');
}

function TwitterCommonObjectstHelper(options) {
	if (!(this instanceof TwitterCommonObjectstHelper))
		return new TwitterCommonObjectstHelper(options);
}

TwitterCommonObjectstHelper.twitterCommonObjects = null;
module.exports = TwitterCommonObjectstHelper;

TwitterCommonObjectstHelper.prototype.initialize = function(options, callback){
	var _method = "initialize()";
	console.log("IN " + fileName + " - "+ _method);
	parent = this;
	var today = new Date();
	var lastWeek = new Date(today.getTime()-1000*60*60*24*7);
	var from = "" + (lastWeek.getMonth() + 1) + "," + lastWeek.getDate() + "," + lastWeek.getFullYear();
	var to = "" + (today.getMonth() + 1) + "," + today.getDate() + "," + today.getFullYear();
	TwitterCommonObjects.findOne({
		created : {"$gte": lastWeek, "$lte": today }
	}).sort({created: 'desc'}).exec(function(err, twitterCommonObjects) {
		if(twitterCommonObjects == null || err){
			if (options.autoCreate == true){
				parent.createTodays(function(err, twitterCommonObjects){
					parent.twitterCommonObjects = twitterCommonObjects;
					return callback(err, twitterCommonObjects, true);
				})
			}else{
				var _err = (err)?err:"Object sessionObj not found";
				return callback(_err, null, false);
			}
		}else{
			parent.twitterCommonObjects = twitterCommonObjects;
			callback(null, twitterCommonObjects, false);
		}
	});
}

TwitterCommonObjectstHelper.prototype.createTodays = function(callback){
	var parent = this;
	var _method = "createTodays()";
	console.log("IN " + fileName + " - "+ _method);
	var twitterCommonObjects = new TwitterCommonObjects();
	twitterCommonObjects.save(function(err, _twitterCommonObjects) {
		if(!err) parent.twitterCommonObjects = _twitterCommonObjects;
		callback(err, _twitterCommonObjects);
	});
}

TwitterCommonObjectstHelper.prototype.saveTrendsAvailable = function(twitterCommonObjects, trendsAvailable, callback){
	var _method = "saveTrendsAvailable()";
	console.log("IN " + fileName + " - "+ _method);
	parent = this;
	
	if (typeof trendsAvailable == "function"){
		callback = trendsAvailable;
		trendsAvailable = twitterCommonObjects;
		if  (parent.twitterCommonObjects == null){
			return callback("Error, twitterCommonObjects is null");
		}
		twitterCommonObjects = parent.twitterCommonObjects;
	}
	
	twitterCommonObjects.trendsAvailable = trendsAvailable;
	twitterCommonObjects.markModified('trendsAvailable');
	
	twitterCommonObjects.save(function(err) {
		callback(err, global.success);
	});
}



