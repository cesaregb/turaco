'use strict';

function listFactory($http) {
	var urlBase = '/api/lists';
	var dataFactory = {};
	
	dataFactory.getCustomers = function () {
		return $http.get(urlBase);
	};
	
	dataFactory.getCustomer = function (id) {
		return $http.get(urlBase + '/' + id);
	};
	
	dataFactory.insertCustomer = function (item) {
		return $http.post(urlBase, item);
	};
	
	dataFactory.updateCustomer = function (item) {
		return $http.put(urlBase + '/' + item.ID, item)
	};
	
	dataFactory.deleteCustomer = function (id) {
		return $http.delete(urlBase + '/' + id);
	};
	
	dataFactory.getOrders = function (id) {
		return $http.get(urlBase + '/' + id + '/orders');
	};
	
	return dataFactory;
}