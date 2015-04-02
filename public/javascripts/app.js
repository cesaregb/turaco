
define([ 'ngRoute',
         'ui-bootstrap',
         'ngSanitize',
         'select',
         'geolocation',
         './filters/index',
         './factories/index',
         './directives/index',
         './controllers/index' ], function(ngRoute) {

	return angular.module('app', ['ngRoute', 'ngSanitize', 'app.controllers', 'app.factories',
         'app.filters', 'app.directives', 'ui.bootstrap', 'ngGeolocation', 'ui.select' ]);
});
