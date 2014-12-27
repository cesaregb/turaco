require.config({
    baseUrl	: '/javascripts/',
    paths 	: {
    	jquery			: '//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min',
    	angular			: '//ajax.googleapis.com/ajax/libs/angularjs/1.2.21/angular.min',
    	ngRoute			: '//ajax.googleapis.com/ajax/libs/angularjs/1.2.21/angular-route.min',
    	bootstrap		: '../dist/js/bootstrap.min',
    	list_controller	: 'controllers/list_controller',
    	list_factories	: 'factories/lists_factories',
    	app				: 'turaco_app'
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
		}
    }
});

require(
	['angular', 'ngRoute', 'app', 'list_controller', 'list_factories'],
		function (angular) {
			angular.bootstrap(document, ['turacoModule']);
		}
);

require(['jquery', 'bootstrap'], function( $ ) {
	$(document).ready(function(){
		console.log("setting the values");
		if ($("#btnAddList") != null){
			console.log("button found");
			
			$('#btnAddList').click(function(){ /* show modal add list*/
				$('#modalAddListForm').modal('show');	
			});
			$('#btnEditUserCategories').click(function(){/* show modal category list/form hide add list form */
				$('#modalAddListForm').modal('hide');
				$('#modalEditCategoryForm').modal('show');
			});
			
			$('#btnDoneCategoryForm').click(function(){/* show modal add list form hide category list */
				$('#modalEditCategoryForm').modal('hide');
				$('#modalAddListForm').modal('show');
			});
			$('#btnBackLists').click(function (){/* show lists list */
				$('#containerUsers').fadeOut(200);
				$('#containerLists').fadeIn(200);
			});
			
			$('#btnAssignAccnts2List').click(function (){ /* show modal for assign selected users to different list... */
				$('#modalAssignUsersToList').modal("show");
			});
		}
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
