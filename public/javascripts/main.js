require.config({
   baseUrl	: '/javascripts/',
   paths 	: {
      jquery			: '//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min',
      angular			: '//ajax.googleapis.com/ajax/libs/angularjs/1.2.21/angular.min',
      ngRoute			: '//ajax.googleapis.com/ajax/libs/angularjs/1.2.21/angular-route.min',
      ngSanitize		: '//ajax.googleapis.com/ajax/libs/angularjs/1.2.21/angular-sanitize',
      bootstrap		: '../dist/js/bootstrap.min',
      geolocation		: '../dist/js/geolocation',
      select       	: '../dist/js/select',
      'ui-bootstrap'	: '//angular-ui.github.io/bootstrap/ui-bootstrap-tpls-0.12.0'
   },
   shim	: {
      jquery: {
         exports: '$'
      },
      bootstrap : {
         deps : [ 'jquery'],
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
      },
      'app': {
         deps: ['jquery', 'angular']
      },
      'ui-bootstrap' :{
         deps: ['angular']
      }
   }
});

require(
   ['routes','jquery'], function () {
      angular.bootstrap(document, ['app']);
   }
);

require(['jquery', 'bootstrap'], function($, boostrap) {
   $(document).ready(function(){
      $("#PreLoading").hide();
   });

});

define (['jquery'], function ($) {
   return function(){
      function showUsers(id) {
         $('#containerLists').fadeOut(200);
         $('#containerUsers').fadeIn(200);
      }
      window.showUsers = showUsers;
   }();
});
