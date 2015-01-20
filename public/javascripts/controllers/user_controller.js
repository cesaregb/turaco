
define(['./module'], function (module) {
//	console.log("Creating userController... ");
    
	module.controller('userController', ['$scope', 'userFactory', '$location', function ($scope, userFactory, $location) {
    	init();
    	function init(){
    		var path = $location.$$path;
    		if ($scope.lists == null){
    			if (path.indexOf("lists/view_users") > 0){
    				$scope.$emit('LOAD');
    				userFactory.getUserInfo().success(function (response) {
    					$scope.$emit('UNLOAD')
    					var result = response;
    					if (result.type == "SUCCESS"){
        					var data = result.data;
        					var image = data.profile_image_url.replace("_normal", "_bigger");
        					$scope.user_image = image;
        					$scope.screen_name = data.screen_name;
        					console.log("--> " + image + " -- " + data.screen_name);
        				}
        				$scope.customers = response;
    				}).error(function (error) {
    					$scope.$emit('UNLOAD')
    					console.log("Error on the service: " + error);
    					$scope.status = 'Unable to load lists data: ' + error.message;
    				});
    			}else if(path == '/lists/add_list'){
    				
    			}else{
    				
    			}
    		}
    	}
    }]);
});
