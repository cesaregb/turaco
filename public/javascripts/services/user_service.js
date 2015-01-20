
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


//define(['app'], function (app) {
//	console.log("en define del controller");
//	app.controller('userController', ['$scope',function ($scope) {
//		console.log("in userController");
//		$scope.test = "true";
//	}]);
//	
//});

//function userController($scope) {
//	console.log("in userController");
//	$scope.status = null;
//	$scope.name = "Cesar Eduardo";
//	$scope.customers = null;
//	$scope.orders = null;
//	init();
//	
//	function init() {
//		console.log("in init user Controller");
//		

//	}
////	$scope.updateCustomer = function (id) {
////		var cust;
////		for (var i = 0; i < $scope.customers.length; i++) {
////			var currCust = $scope.customers[i];
////			if (currCust.ID === id) {
////				cust = currCust;
////				break;
////			}
////		}
////		dataFactory.updateCustomer(cust).success(function () {
////			$scope.status = 'Updated Customer! Refreshing customer list.';
////		})
////		.error(function (error) {
////			$scope.status = 'Unable to update customer: ' + error.message;
////		});
////	};
////	
////	$scope.insertCustomer = function () {
////	// Fake customer data
////		var cust = {
////			ID: 10,
////			FirstName: 'JoJo',
////			LastName: 'Pikidily'
////		};
////		dataFactory.insertCustomer(cust).success(function () {
////			$scope.status = 'Inserted Customer! Refreshing customer list.';
////			$scope.customers.push(cust);
////		}).
////		error(function(error) {
////			$scope.status = 'Unable to insert customer: ' + error.message;
////		});
////	};
////	
////	$scope.deleteCustomer = function (id) {
////		dataFactory.deleteCustomer(id).success(function () {
////		$scope.status = 'Deleted Customer! Refreshing customer list.';
////			for (var i = 0; i < $scope.customers.length; i++) {
////				var cust = $scope.customers[i];
////				if (cust.ID === id) {
////					$scope.customers.splice(i, 1);
////					break;
////				}
////			}
////			$scope.orders = null;
////		})
////		.error(function (error) {
////			$scope.status = 'Unable to delete customer: ' + error.message;
////		});
////	};
////	
////	$scope.getCustomerOrders = function (id) {
////		dataFactory.getOrders(id).success(function (orders) {
////			$scope.status = 'Retrieved orders!';
////			$scope.orders = orders;
////		})
////		.error(function (error) {
////			$scope.status = 'Error retrieving customers! ' + error.message;
////		});
////	};
//}