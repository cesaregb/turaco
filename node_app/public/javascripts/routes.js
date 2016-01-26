define([
  './app'
], function (app) {
	return app.config([ '$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
		var urlBase = '/';
		var urlListBase = '/partials/';

		$routeProvider.when('/lists/index', {
         redirectTo: '/lists'
		}).when('/lists', {
         title: 'Lists',
			templateUrl: urlListBase + 'list_home',
			controller: 'listController'
		}).when('/lists/view_users/:list_id', {
         title: 'Lists',
			templateUrl: urlListBase + 'view_users',
			controller: 'listController'
      }).when('/lists/add_list', {
         title: 'Lists',
			templateUrl: urlListBase + 'add_eddit_list_form',
			controller: 'listController'
      }).when('/lists/edit_list/:list_id', {
         title: 'Lists',
			templateUrl: urlListBase + 'add_eddit_list_form',
			controller: 'listController'
		}).when('/lists/assign_users_to_list', {
         title: 'Following',
			templateUrl: urlListBase + 'assign_users_to_list',
			controller: 'listController'
      }).when('/lists/edit_category', {
         title: 'Non existing',
			templateUrl: urlListBase + 'edit_category',
			controller: 'listController'
      }).when('/copy_list/:list_id', {
         title: 'Copy List',
         templateUrl: urlListBase + 'copy_list',
         controller: 'listController'
      }).when('/copy_list_home', {
         title: 'Copy List',
         templateUrl: urlListBase + 'copy_list_home',
         controller: 'listController'
      }).when('/copy_list', {
         title: 'Copy List',
			templateUrl: urlListBase + 'copy_list',
			controller: 'listController'
      }).when('/view_user_lists', {
         title: 'Copy List',
			templateUrl: urlListBase + 'view_user_lists',
			controller: 'listController'
      }).when('/home', {
         title: 'Home',
			templateUrl: urlListBase + 'home',
			controller: 'userController'
      }).when('/manage_lists', {
         title: 'Manage Lists',
			templateUrl: urlListBase + 'manage_lists',
			controller: 'listController'
      }).otherwise({
			redirectTo: '/home'
		});
		$locationProvider.html5Mode(true);
	}]);
});
