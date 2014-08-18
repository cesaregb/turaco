'use strict';
/* Controllers */
function AppCtrl($scope, $http) {
	$http({method: 'GET', url: '/api/name'}).
	success(function(data, status, headers, config) {
		$scope.name = data.name;
	}).
	error(function(data, status, headers, config) {
		$scope.name = 'Error!';
	});
}
function MyCtrl1() {}
MyCtrl1.$inject = [];
function MyCtrl2() {}
MyCtrl2.$inject = [];

function todoController($scope, $http) {
	$scope.formData = {};

	$http.get('/api/lists/todos')
		.success(function(data) {
			$scope.todos = data;
			console.log(data);
		})
		.error(function(data) {
			console.log('Error: ' + data);
		});

	$scope.createTodo = function() {
		$http.post('/api/lists/todos', $scope.formData)
			.success(function(data) {
				$scope.formData = {}; 
				$scope.todos = data;
				console.log(data);
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	};

	$scope.deleteTodo = function(id) {
		$http.delete('/api/lists/todos/' + id)
			.success(function(data) {
				$scope.todos = data;
				console.log(data);
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	};
}

function listController($scope, dataFactory) {
    
	$scope.status = null;
	$scope.name = "Cesar Eduardo";
	$scope.customers = null;
	$scope.orders = null;
	init();
	
	function init() {
		dataFactory.getCustomers().success(function (custs) {
			$scope.customers = custs;
		})
		.error(function (error) {
			$scope.status = 'Unable to load customer data: ' + error.message;
		});
	}
	
	$scope.updateCustomer = function (id) {
		var cust;
		for (var i = 0; i < $scope.customers.length; i++) {
			var currCust = $scope.customers[i];
			if (currCust.ID === id) {
				cust = currCust;
				break;
			}
		}
		dataFactory.updateCustomer(cust).success(function () {
			$scope.status = 'Updated Customer! Refreshing customer list.';
		})
		.error(function (error) {
			$scope.status = 'Unable to update customer: ' + error.message;
		});
	};
	
	$scope.insertCustomer = function () {
	// Fake customer data
		var cust = {
			ID: 10,
			FirstName: 'JoJo',
			LastName: 'Pikidily'
		};
		dataFactory.insertCustomer(cust).success(function () {
			$scope.status = 'Inserted Customer! Refreshing customer list.';
			$scope.customers.push(cust);
		}).
		error(function(error) {
			$scope.status = 'Unable to insert customer: ' + error.message;
		});
	};
	
	$scope.deleteCustomer = function (id) {
		dataFactory.deleteCustomer(id).success(function () {
		$scope.status = 'Deleted Customer! Refreshing customer list.';
			for (var i = 0; i < $scope.customers.length; i++) {
				var cust = $scope.customers[i];
				if (cust.ID === id) {
					$scope.customers.splice(i, 1);
					break;
				}
			}
			$scope.orders = null;
		})
		.error(function (error) {
			$scope.status = 'Unable to delete customer: ' + error.message;
		});
	};
	
	$scope.getCustomerOrders = function (id) {
		dataFactory.getOrders(id).success(function (orders) {
			$scope.status = 'Retrieved orders!';
			$scope.orders = orders;
		})
		.error(function (error) {
			$scope.status = 'Error retrieving customers! ' + error.message;
		});
	};
}