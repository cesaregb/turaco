
define(['./module'], function (module) {
//	console.log("Creating userController... ");

	module.controller('userController', ['$scope', 'userFactory', function ($scope, userFactory) {
    	console.log("Within the controller.. userController");
    	$scope.name= "Cesar Eduardo Gonzalez Borjon";
    	init();
    	function init(){
    		if($scope.users == null){
    			userFactory.getUserInfo().success(function (response) {
    				var result = response;
    				console.log("Type: " + result.type);
    				if (result.type == "SUCCESS"){
    					var data = result.data;
    					var image = data.profile_image_url.replace("_normal", "_bigger");
    					$scope.user_image = image;
    					$scope.screen_name = data.screen_name;

    					console.log("--> " + image + " -- " + data.screen_name);
    				}

    				$scope.customers = response;

    			})
    			.error(function (error) {
    				console.log("Error on the service: " + error);
    				$scope.status = 'Unable to load customer data: ' + error.message;
    			});
    		}
    	}
    }]);
});
