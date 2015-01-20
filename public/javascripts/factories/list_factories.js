
define(['./module'], function (module) {
    'use strict';
    module.factory('listFactory', ['$http', function ($http) {
    	var urlBase = '/api/lists';
    	var listDataFactory = {};
    	var lists = null;
    	
    	listDataFactory.refreshUserLists = function () {
    		lists = $http.get(urlBase);
    		console.log("Getting list information from service ");
    	};
    	
    	listDataFactory.getUserLists = function () {
    		if (lists == null){
    			lists = $http.get(urlBase);
    			console.log("Getting list information from service ");
    		}else{
    			console.log("Returning the existing information... ");
    		}
    		return lists
    	};
    	
    	listDataFactory.saveList = function ( list ) {
    		return $http.put(urlBase, {name: list.name, description: list.description, mode: list.mode });
    	};
    	
    	listDataFactory.getListUsers = function (list_id, member_count) {
    		console.log("getting list's users: " + list_id);
    		return $http.get(urlBase + "/list_users" + "/" + list_id + "/" + member_count);
    	};
    	
    	listDataFactory.insertCustomer = function (item) {
    		return $http.post(urlBase, item);
    	};
    	
    	listDataFactory.updateCustomer = function (item) {
    		return $http.put(urlBase + '/' + item.ID, item)
    	};
    	
    	listDataFactory.deleteCustomer = function (id) {
    		return $http.delete(urlBase + '/' + id);
    	};
    	
    	listDataFactory.getOrders = function (id) {
    		return $http.get(urlBase + '/' + id + '/orders');
    	};
    	
    	return listDataFactory;
    }]);
});
