
define([ 'ngRoute', 
         'ui-bootstrap', 
         './filters/index', 
         './factories/index', 
         './controllers/index' ], function(ngRoute) {
	return angular.module('app', ['ngRoute', 'app.controllers', 'app.factories', 'app.filters', 'ui.bootstrap' ]);
});

