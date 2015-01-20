
define(['./module'], function (module) {
    'use strict';
    module.factory('userFactory', ['$http', function ($http) {
    	console.log("into userFactory");
    	var urlBase = '/api/users';
    	var factory = {};
    	factory.getUserInfo = function () {
    		console.log("calling " + urlBase + "/test/a");
    		return $http.get(urlBase + "/test/a");
    	};
    	
    	factory.getListUsers = function () {
    		console.log("calling " + urlBase + "/test/a");
    		return $http.get(urlBase + "/test/a");
    	};
    	
    	return factory;
    }]);
});

