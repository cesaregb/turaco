define(['./module', './message_helper',  './accounts_helper', './list_manageListUsersController'], function (module) {
	module.controller('listController', ['$scope', 'listFactory', 'userFactory', '$location', '$routeParams', 'filterFilter', '$modal',
	function ($scope, listFactory, userFactory, $location, $routeParams, filterFilter, $modal) {
		createMessageHelper($scope, null);

		function init(){
			var path = $location.$$path; // get the path for initialization per page.
			if (path == '/lists/index'){
				/*SHOW LISTS INIT PAGE*/
				createGetListsByLoggedUser($scope, listFactory, null);
				if ($scope.lists == null || $scope.refresh){
					$scope.getListsByLoggedUser();
				}
			}else if(path.indexOf("lists/view_users") > 0){
				/* VIEW LIST USERS... */
				var list_id = $routeParams.list_id;
				viewListUsersController(list_id, $scope, listFactory, $modal);
			}else if(path == '/lists/assign_users_to_list'){
				/* get users and lists */
				usersFriendsListsController($scope, userFactory, listFactory, filterFilter, $modal);
			}else if(path == '/lists/add_list'){
				// nothing to do here?  ehmm.. not sure of that..
				$scope.list = {};
				$scope.list.mode = "public";
				$scope.saveList = function(){
					$scope.refresh = true;
					$scope.$emit('LOAD')
					listFactory.saveList($scope.list).success(function (response) {
						$scope.$emit('UNLOAD')
						var result = response;
						if (result.type == "SUCCESS"){
							$location.path('/lists/index')
						}
					}).error(function (error) {
						$scope.$emit('UNLOAD')
						console.log("Error on the service: " + error);
						$scope.status = 'Unable to load lists data: ' + error.message;
					});
				}
			}else{

			}
		}

		init();

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



	}]);
});
