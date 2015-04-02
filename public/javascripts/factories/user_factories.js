
define(['./module'], function (module) {
   'use strict';
   module.factory('userFactory', ['$http', function ($http) {
      var urlBase = '/api/users';
      var factory = {};
      var YAHOO_APPID = "GMxzK0rV34HVbalOrGJgyqStHgVvwNRulb7DNEs9p6gy6P.LRWQ14ZEx894iReKXeGwFWnI-";
      factory.getUserInfo = function () {
         console.log("TURACO_DEBUG - AJAX REQUEST: " + urlBase + "/test/a");
         return $http.get(urlBase + "/test/a");
      };

      factory.getUserFriends = function () {
         console.log("TURACO_DEBUG - AJAX REQUEST: " + urlBase + "/friends_list");
         return $http.get(urlBase + "/friends_list");
      };
      factory.getUserFriendsFilter = function (fiterBy) {
         console.log("TURACO_DEBUG - AJAX REQUEST: " + urlBase + "/friends_list" + fiterBy);
         return $http.get(urlBase + "/friends_list" + fiterBy);
      };

      factory.serachUserFriends = function (term) {
         console.log("TURACO_DEBUG - AJAX REQUEST: " + urlBase + "/search_user/" + term);
         return $http.get(urlBase + "/search_user/"+term);
      };

      factory.getSavedSearches = function () {
         console.log("TURACO_DEBUG - AJAX REQUEST: " + urlBase + "/saved_searches/");
         return $http.get(urlBase + "/saved_searches");
      };

      factory.getTrendsPlace = function (woeid) {
         if (woeid == null)
            woeid = "1";
         console.log("TURACO_DEBUG - AJAX REQUEST: " + urlBase + "/trending/place/" + woeid);
         return $http.get(urlBase + "/trending/place/" + woeid);
      };

      factory.getTrendsClosests = function (lat, long) {
         console.log("TURACO_DEBUG - AJAX REQUEST: " + urlBase + "/trending/place/" + lat + "/" + long);
         return $http.get(urlBase + "/trending/place/" + lat + "/" + long);
      };

      factory.getTrendsAvailable = function () {
         console.log("TURACO_DEBUG - AJAX REQUEST: " + urlBase + "/trends_available");
         return $http.get(urlBase + "/trends_available");
      };

      /*
         EXTERNAL APIs
      */
      factory.getYQLLocationByLocation_ = function (lat, lon) {
         var geoAPI = 'http://where.yahooapis.com/geocode?location='+lat+','+lon+'&flags=J&gflags=R&appid='+YAHOO_APPID;
         console.log("TURACO_DEBUG - AJAX REQUEST: " + geoAPI);
         return $http.get(geoAPI);
      };

      factory.getYQLLocationByLocation__ = function (lat, lon) {
         //var url = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20geo.placefinder%20where%20text=%22'+city+'%22&format=json';
         //var url = "http://where.yahooapis.com/v1/places.q('"+city+"');start=0;count=5?appid=" + YAHOO_APPID + "&format=json"
         var url = "http://where.yahooapis.com/v1/places.q('" + lat + "," + lon + "');start=0;count=1?appid=" + YAHOO_APPID + "&format=json";
         return $http.get(url);
      };

      factory.getYQLLocationByLocation = function (lat, lon) {

         //var geoAPI = 'http://where.yahooapis.com/geocode?location='+lat+','+lon+'&flags=J&gflags=R&appid='+APPID;
         var geoAPI = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20geo.placefinder%20where%20text%3D%22'+lat+'%2C'+lon+'%22%20and%20gflags%3D%22R%22&format=json';
         console.log("TURACO_DEBUG - AJAX REQUEST: " + geoAPI);
         return $http.get(geoAPI);
      };

      factory.getYQLLocationByCity = function (city) {
         //var url = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20geo.placefinder%20where%20text=%22'+city+'%22&format=json';
         //var url = "http://where.yahooapis.com/v1/places.q('"+city+"');start=0;count=5?appid=" + YAHOO_APPID + "&format=json"
         var url = "http://where.yahooapis.com/v1/places.q('"+city+"');start=0;count=5?appid=" + YAHOO_APPID + "&format=json";
         return $http.get(url);
      };
      return factory;
   }]);
});
