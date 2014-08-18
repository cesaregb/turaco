require.config({
    baseUrl: '/javascripts/',
    paths : {
    	jquery			: '//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min',
    	angular			: '//ajax.googleapis.com/ajax/libs/angularjs/1.2.21/angular.min',
    	ngRoute			: '//ajax.googleapis.com/ajax/libs/angularjs/1.2.21/angular-route.min',
    	bootstrap		: '../dist/js/bootstrap.min',
    	list_controller	: 'controllers/list_controller',
    	list_factories	: 'factories/lists_factories',
    	app				: 'angular_app_list'
    },
    shim: {
    	jquery: {
			exports: '$'
		},
        "angular": {
            exports: "angular"
        },
        "angular_routes": {
            deps: ["angular"]
        },
		ngRoute: {
			exports: 'ngRoute',
			deps: ['angular']
		}
    }
});

require(['jquery', 'angular', 'ngRoute', 'list_controller', 'list_factories'], function() {
//	console.log(require);
//	console.log($);
//	console.log(app);
//	console.log(window.angular);
});

require(
	['angular', 'ngRoute', 'app', 'list_controller', 'list_factories'],
		function (angular) {
			angular.bootstrap(document, ['listModule']);
		}
);

require(['jquery'], function( $ ) {
	$(document).ready(function () {
		console.log("Document ready... mudafuka....");
	});
});