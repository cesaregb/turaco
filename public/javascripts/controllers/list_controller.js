define(['./module'], function (module) {
	module.controller('listController', ['$scope', 'listFactory', '$location', '$routeParams',  function ($scope, listFactory, $location, $routeParams) {
		$scope.$on('LOAD',function(){$scope.loading=true});
		$scope.$on('UNLOAD',function(){$scope.loading=false});
    	init();
    	function init(){
    		var path = $location.$$path;
    		if ($scope.lists == null){
    			
    			if (path == '/lists/index'){
    				$scope.$emit('LOAD');
    				listFactory.getUserLists().success(function (response) {
    					$scope.$emit('UNLOAD')
    					var result = response;
    					if (result.type == "SUCCESS"){
    						$scope.lists = result.data.items;
    					}
    				}).error(function (error) {
    					$scope.$emit('UNLOAD')
    					console.log("Error on the service: " + error);
    					$scope.status = 'Unable to load lists data: ' + error.message;
    				});
    			}else if(path.indexOf("lists/view_users") > 0){
    				var list_id = $routeParams.list_id;
    				var member_count = $routeParams.member_count;
    				$scope.$emit('LOAD');
    				listFactory.getListUsers(list_id, member_count).success(function (response) {
    					$scope.$emit('UNLOAD')
    					var result = response;
    					if (result.type == "SUCCESS"){
    						$scope.users = result.data.users;
    					}
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
    	
    	$scope.refreshList = function(){
    		$scope.$emit('LOAD');
			listFactory.getUserLists().success(function (response) {
				$scope.$emit('UNLOAD')
				var result = response;
				if (result.type == "SUCCESS"){
					$scope.lists = result.data.items;
				}
			}).error(function (error) {
				$scope.$emit('UNLOAD')
				console.log("Error on the service: " + error);
				$scope.status = 'Unable to load lists data: ' + error.message;
			});
    	};
    	
    	$scope.openDialog = function(){
    		$dialog.dialog({}).open('<div>this is the modal</div>');
    	}
    	
    	$scope.saveList = function(new_list){
    		console.log("Saving list... " + JSON.stringify(new_list));
    		$scope.$emit('LOAD')
    		listFactory.saveList(new_list).success(function (response) {
				$scope.$emit('UNLOAD')
				var result = response;
				if (result.type == "SUCCESS"){
					/**/
					console.log("LIST SAVED");
				}
			}).error(function (error) {
				$scope.$emit('UNLOAD')
				console.log("Error on the service: " + error);
				$scope.status = 'Unable to load lists data: ' + error.message;
			});
    		
    	}
    	
    }]);
});


//function listController($scope, dataFactory) {
//    
//	$scope.status = null;
//	$scope.name = "Cesar Eduardo";
//	$scope.customers = null;
//	$scope.orders = null;
//	init();
//	
//	function init() {
//		dataFactory.getCustomers().success(function (custs) {
//			$scope.customers = custs;
//		})
//		.error(function (error) {
//			$scope.status = 'Unable to load customer data: ' + error.message;
//		});
//	}
//	
//	$scope.updateCustomer = function (id) {
//		var cust;
//		for (var i = 0; i < $scope.customers.length; i++) {
//			var currCust = $scope.customers[i];
//			if (currCust.ID === id) {
//				cust = currCust;
//				break;
//			}
//		}
//		dataFactory.updateCustomer(cust).success(function () {
//			$scope.status = 'Updated Customer! Refreshing customer list.';
//		})
//		.error(function (error) {
//			$scope.status = 'Unable to update customer: ' + error.message;
//		});
//	};
//	
//	$scope.insertCustomer = function () {
//	// Fake customer data
//		var cust = {
//			ID: 10,
//			FirstName: 'JoJo',
//			LastName: 'Pikidily'
//		};
//		dataFactory.insertCustomer(cust).success(function () {
//			$scope.status = 'Inserted Customer! Refreshing customer list.';
//			$scope.customers.push(cust);
//		}).
//		error(function(error) {
//			$scope.status = 'Unable to insert customer: ' + error.message;
//		});
//	};
//	
//	$scope.deleteCustomer = function (id) {
//		dataFactory.deleteCustomer(id).success(function () {
//		$scope.status = 'Deleted Customer! Refreshing customer list.';
//			for (var i = 0; i < $scope.customers.length; i++) {
//				var cust = $scope.customers[i];
//				if (cust.ID === id) {
//					$scope.customers.splice(i, 1);
//					break;
//				}
//			}
//			$scope.orders = null;
//		})
//		.error(function (error) {
//			$scope.status = 'Unable to delete customer: ' + error.message;
//		});
//	};
//	
//	$scope.getCustomerOrders = function (id) {
//		dataFactory.getOrders(id).success(function (orders) {
//			$scope.status = 'Retrieved orders!';
//			$scope.orders = orders;
//		})
//		.error(function (error) {
//			$scope.status = 'Error retrieving customers! ' + error.message;
//		});
//	};
//}