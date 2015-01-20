
define([ 'ngRoute', 
//         './services/index', 
         './factories/index', 
         './controllers/index' ], function(ngRoute) {
//	console.log("creatting app...");
	return angular.module('app', ['ngRoute', 'app.controllers', 'app.factories' ]);
});

