define([
  './app'
], function (app) {

	return app.config([ '$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
//		console.log("loading routes");
		var urlBase = '/';
		var urlListBase = '/lists/partials/';
		$routeProvider.when('/lists/index', {
			templateUrl: urlListBase + 'list_home',
			controller: 'listController'
		}).when('/lists/view_users/:list_id', {
			templateUrl: urlListBase + 'view_users',
			controller: 'listController'
		}).when('/lists/add_list', {
			templateUrl: urlListBase + 'add_eddit_list_form', 
			controller: 'listController'
		}).when('/lists/assign_users_to_list', {
			templateUrl: urlListBase + 'assign_users_to_list',
			controller: 'listController'
		}).when('/lists/edit_category', {
			templateUrl: urlListBase + 'edit_category',
			controller: 'listController'
		}).otherwise({
			redirectTo: '/lists/index'
		});
		$locationProvider.html5Mode(true);
	}]);

});
