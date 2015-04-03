define(['./module', './message_helper',  './accounts_helper', './list_manageListUsersController'],
function (module) {
	module.controller('listController', ['$scope', 'listFactory', 'userFactory', '$location', '$routeParams', 'filterFilter', '$modal',
	function ($scope, listFactory, userFactory, $location, $routeParams, filterFilter, $modal, $rootScope) {
		createMessageHelper($scope, null);
		function init(){
			var path = $location.$$path; // get the path for initialization per page.
			if (path == '/lists'){
				/*SHOW LISTS INIT PAGE*/
				createGetListsByLoggedUser($scope, listFactory, null);
				crateConfirmModal($scope, $modal, null);
				var varAction = $routeParams.action;
				if ($scope.lists == null || $scope.refresh){
					$scope.getListsByLoggedUser();
				}
				//DISABLED TO AVOID REPETING A MESSAGE THAT MAY NO BE APPLICABLE.
				if (varAction != null && varAction != "undefined" && false) {
					$scope.$emit('AJAX_SUCCESS');
				}

				$scope.openConfirmModal = function(list){
					var message = "Are you sure you want to delete list: " + list.name + " ?";
					$scope.open_modal(message, function(err, response){
						if(!err){
							$scope.refresh = true;

							listFactory.deleteList(list).success(function (response){
								var result = response;
								if (result.type == "SUCCESS"){
									$scope.getListsByLoggedUser();
									$scope.$emit('AJAX_SUCCESS');
								}else {
									$scope.handleErrorResponse(response);
								}
							}).error($scope.handleErrorResponse);
						}
					});
				};


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

					listFactory.saveList($scope.list).success(function (response){
						var result = response;
						if (result.type == "SUCCESS"){
							//$location.path('/lists/index').search({action: 'true'});
							$location.path('/lists/index');
							$location.replace();
						}else{$scope.handleErrorResponse(response);}
					}).error($scope.handleErrorResponse);
				};
			}else if(path.indexOf("lists/edit_list") > 0){
				var list_id = $routeParams.list_id;
				//get the list and load values to

				var listsByLoggedUserCallback = function(err, result){
					var lists = result.data.items;
					for (var index in lists){
						if (lists[index].id == list_id){
							// assigning values to the form... for editing...
							$scope.list = lists[index];
						}
					}
				};
				createGetListsByLoggedUser($scope, listFactory, function(err, res){
					$scope.getListsByLoggedUser(listsByLoggedUserCallback);
				});

				$scope.saveList = function(){
					$scope.refresh = true;

					listFactory.updateList($scope.list).success(function (response){
						var result = response;
						if (result.type == "SUCCESS"){
							$location.path('/lists/index');
							$location.replace();

						}else{$scope.handleErrorResponse(response);}
					}).error($scope.handleErrorResponse);
				};

			}else{
				//PLACE HOLDER FOR A URL PATTERN DIDNT MATCHED..
			}
		}

		init();

		$scope.refreshList = function(){
			listFactory.getUserLists().success(function (response) {
				var result = response;
				if (result.type == "SUCCESS"){
					$scope.lists = result.data.items;
				}else{$scope.handleErrorResponse(response);}
			}).error($scope.handleErrorResponse);
		};

		$scope.openDialog = function(){
			$dialog.dialog({}).open('<div>this is the modal</div>');
		};

	}]);
});
