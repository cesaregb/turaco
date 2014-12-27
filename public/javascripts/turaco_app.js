 define([
         'angular',
         'ngRoute',
         'list_controller',
         'list_factories'
         ], function () {
	 			console.log("Before instantiation of listModle");
	 			var turacoModule = angular.module('turacoModule', ['ngRoute']);
	 			console.log("Instance created ...");
	 			turacoModule.config(['$routeProvider', 
	 			                   '$locationProvider',  
	 			                   function ($routeProvider, $locationProvider) {
	 				
	 				var urlBase = '/';
	 				var urlListBase = '/lists/partials/list_';
	 				
	 				$routeProvider.when('/index', {
	 					templateUrl: urlBase + 'index', 
	 					controller: 'todoController'
	 			 	}).when('/lists/view1', {
	 					templateUrl: urlBase + 'partial1', 
	 					controller: 'todoController'
	 			 	}).when('/lists/view2', {
	 			 		templateUrl: urlBase + 'partial2', 
	 			 		controller: 'todoController'
	 			 	}).when('/lists/view3', {
	 			 		templateUrl: urlBase + 'partial3', 
	 			 		controller: 'todoController'
	 			 	}).otherwise({
	 			 		redirectTo: '/index'
	 			 	});
	
	 			 	$locationProvider.html5Mode(true);
	 			}]);
	 			
	 			turacoModule.factory('dataFactory', ['$http', listFactory]);
	 			
	 			turacoModule.controller('listsController', ['$scope', 'dataFactory', listController]);
	 			
	 			turacoModule.controller('todoController', ['$scope', '$http', todoController]);
	 			
	 		    return turacoModule;
 		}
);