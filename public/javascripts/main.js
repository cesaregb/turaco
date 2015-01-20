require.config({
    baseUrl	: '/javascripts/',
    paths 	: {
    	jquery			: '//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min',
    	angular			: '//ajax.googleapis.com/ajax/libs/angularjs/1.2.21/angular.min',
    	ngRoute			: '//ajax.googleapis.com/ajax/libs/angularjs/1.2.21/angular-route.min',
    	bootstrap		: '../dist/js/bootstrap.min'
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
	    uiBootstrap :{
            deps: ['angular']
        }
    }
});

require(
	['routes'], function () {
		angular.bootstrap(document, ['app']);
	}
);

require(['jquery', 'bootstrap'], function($, boostrap) {
	$(document).ready(function(){
		console.log("document ready");
//		if ($("#btnAddList").length > 0){
//			$('#btnAddList').click(function(){ /* show modal add list*/
//				$('#modalAddListForm').modal('show');	
//			});
//			$('#btnEditUserCategories').click(function(){/* show modal category list/form hide add list form */
//				$('#modalAddListForm').modal('hide');
//				$('#modalEditCategoryForm').modal('show');
//			});
//			
//			$('#btnDoneCategoryForm').click(function(){/* show modal add list form hide category list */
//				$('#modalEditCategoryForm').modal('hide');
//				$('#modalAddListForm').modal('show');
//			});
//			$('#btnBackLists').click(function (){/* show lists list */
//				$('#containerUsers').fadeOut(200);
//				$('#containerLists').fadeIn(200);
//			});
//			
//			$('#btnAssignAccnts2List').click(function (){ /* show modal for assign selected users to different list... */
//				$('#modalAssignUsersToList').modal("show");
//			});
//		}
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
