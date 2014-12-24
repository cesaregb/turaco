 define([
         'angular',
         'ngRoute',
         'list_controller',
         'list_factories'
         ], function () {
	 			console.log("Before instantiation of listModle");
	 			var listModule = angular.module('listModule', ['ngRoute']);
	 			console.log("Instance created ...");
	 			listModule.config(['$routeProvider', 
	 			                   '$locationProvider',  
	 			                   function ($routeProvider, $locationProvider) {
	 				
	 				var urlBase = '/lists/partials/list_';
	 				$routeProvider.when('/lists/view1', {
	 					templateUrl: urlBase + 'partial1', 
	 					controller: 'todoController'
	 			 	}).when('/lists/view2', {
	 			 		templateUrl: urlBase + 'partial2', 
	 			 		controller: 'todoController'
	 			 	}).when('/lists/view3', {
	 			 		templateUrl: urlBase + 'partial3', 
	 			 		controller: 'todoController'
	 			 	}).otherwise({
	 			 		redirectTo: '/lists/view1'
	 			 	});
	
	 			 	$locationProvider.html5Mode(true);
	 			}]);
	 			
	 			listModule.factory('dataFactory', ['$http', listFactory]);
	 			
	 			listModule.controller('listsController', ['$scope', 'dataFactory', listController]);
	 			
	 			listModule.controller('todoController', ['$scope', '$http', todoController]);
	 			
	 		    return listModule;
 		}
);