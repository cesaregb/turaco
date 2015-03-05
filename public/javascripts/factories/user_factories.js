
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
    	
    	factory.getUserFriends = function () {
    		console.log("calling " + urlBase + "/friends_list");
    		return $http.get(urlBase + "/friends_list");
    	};
    	factory.getUserFriendsFilter = function (fiterBy) {
    		console.log("calling " + urlBase + "/friends_list" + fiterBy);
    		return $http.get(urlBase + "/friends_list" + fiterBy);
    	};
    	
    	factory.serachUserFriends = function (term) {
    		console.log("calling " + urlBase + "/search_user/" + term);
    		return $http.get(urlBase + "/search_user/"+term);
    	};
    	
    	return factory;
    }]);
});

