/*
* logic for assigning users to lists...
* */
function usersFriendsListsController($scope, userFactory, listFactory, filterFilter, $modal){
	$scope.warning_not_all_friends = false;
	$scope.showSearchButton = false;
	$scope.totalItems = 0;
	$scope.currentPage = 1;
	$scope.itemsPerPage = 20;
	$scope.maxSize = 5;
	$scope.bigTotalItems = 0;
	$scope.bigCurrentPage = 1;

	var crateCount = 0;
	var callback = function(err, res){
		//console.log("TURACO_DEBUG - created: " + res + " i: " + (++crateCount) );
	};

	createCheckboxHandlers($scope, callback);
	crateListModal($scope, $modal, callback);
	createAssignUser2List($scope, listFactory, callback);
	createGetListsByLoggedUser($scope, listFactory, callback);
	createGetUserFriends($scope, userFactory, filterFilter, callback);

	$scope.getUserFriends();

	/*
	* pagination logic
	* */
	$scope.setPage = function(pageNo) {
		$scope.currentPage = pageNo;
	};

	$scope.pageChanged = function() { console.log('Page changed to: ' + $scope.currentPage); };

	$scope.pageCount = function() {
		if ($scope.filtered != null){
			return Math.ceil($scope.filtered.length / $scope.itemsPerPage);
		}else{
			return Math.ceil($scope.friends.length / $scope.itemsPerPage);
		}
	};

	$scope.$watch('search', function(term) {
		if ($scope.typeFilter != null && $scope.typeFilter > 0){
			var typeFilter = ($scope.typeFilte == 2);
			$scope.filtered = filterFilter($scope.friends, {screen_name: term, inList: typeFilter});
		}else{
			$scope.filtered = filterFilter($scope.friends, {screen_name: term});
		}
		$scope.filtered = filterFilter($scope.friends, {screen_name: term});
		if ($scope.filtered != null ){
			$scope.totalItems = $scope.filtered.length;
		}
	});
	/*
	* end pagination logic
	* */

	$scope.getListsByLoggedUser();

	/*
	* DEPRECATED
	* search for users within the list.. this is not longer used seance uses the filter
	* */
	$scope.searchFriends = function(){
		if ($scope.search != "undefined") {
			userFactory.serachUserFriends($scope.search).success(function (response) {
				var result = response;
				if (result.type == "SUCCESS"){

					$scope.friends_count = result.data.friends_count;
					if (parseInt(result.data.friends_count) > 1000){
						$scope.warning_not_all_friends = true;
					}
					$scope.friends = result.data;
					$scope.filtered = filterFilter($scope.friends, {screen_name: ""});
					$scope.totalItems = $scope.filtered.length;
				}else{
					$scope.$emit('ERROR_SHOW');
				}
			}).error(function(error, status, header, config) {
				$scope.$emit('ERROR_SHOW');
			});
		}
	};


	/*
	* called a service to get the users by a filter but the filter is being made on the angular side
	* DEPRECATED */
	$scope.getFilteredFriends = function(type){
		var filter = "";
		if (parseInt(type) === 0){ // 0 or false  = unlisted (this value is matched on the backend as well)
			filter = "/byUnlisted";
		}else{
			filter = "/byListed";
		}

		userFactory.getUserFriendsFilter(filter).success(function (response) {

			var result = response;
			if (result.type == "SUCCESS"){
				$scope.friends_count = result.data.friends_count;
				if (parseInt(result.data.friends_count) > 1000){
					$scope.warning_not_all_friends = true;
				}
				$scope.friends = result.data.users;
				$scope.filtered = filterFilter($scope.friends, {screen_name: ""});
				$scope.totalItems = $scope.filtered.length;
				if ($scope.totalItems > 25000){
					$scope.showSearchButton = true;
				}
			}else{
				$scope.$emit('ERROR_SHOW');
			}
		}).error(function(error, status, header, config) {
			$scope.$emit('ERROR_SHOW');
		});

	};

	/*
	* with the existing information filter the lists
	* */
	$scope.filteredFriends = function(type){
		$scope.typeFilter = parseInt(type);
		var typeFilter = null;
		if (parseInt(type) == 1){
			typeFilter = false;
		}else if (parseInt(type) == 2){
			typeFilter = true;
		}

		$scope.filtered = filterFilter($scope.friends, {inList: typeFilter});
		if ($scope.filtered != null ){
			$scope.totalItems = $scope.filtered.length;
		}
	};
	$scope.usersArray = {};

	$scope.handleAddUsers = function(list){
		console.log("TURACO_DEBUG - IN handleAddUsers");
		$scope.assignUsers2List(list, function(err, resp){
			if (!err){
				console.log("TURACO_DEBUG - within callback and no error! ");
				$scope.getListsByLoggedUser();
			}
		});
	};
}

/*
* logic for LISTS/VIEW_USERS
* */
function viewListUsersController(list_id, $scope, listFactory, $modal){
	//initializing values..
	var crateCount = 0;
	var callback = function(err, res){
		//console.log("TURACO_DEBUG - created: " + res + " i: " + (++crateCount) );
	};

	createCheckboxHandlers($scope, callback);
	crateListModal($scope, $modal, callback);
	createAssignUser2List($scope, listFactory, callback);
	createGetListsByLoggedUser($scope, listFactory, callback);

	$scope.getListsByLoggedUser(function(err, result){
		if (!err){
			var lists = result.data.items;
			for (var index in lists){
				if (lists[index].id == list_id){
					$scope.selectedList = lists[index];
					$scope.listName = lists[index].name;
				}
			}
		}
	});

	createGetListUsers($scope, listFactory, callback);
	$scope.getListUsers(list_id); // this automatically refresh the users, on the table and so on...

	$scope.removeUser = function(user){
		/*call service to add items to the list.. */
		var user_id_list = user.id;
		listFactory.membersDestroyAll(list_id, user_id_list).success(function (response) {
			var result = response;
			if (result.type == "SUCCESS"){
				$scope.$emit('AJAX_SUCCESS');
				/*call get the lists again.. */
				$scope.getListUsers();
			}else{
				$scope.$emit('ERROR_SHOW');
			}
		}).error(function (error) {
			$scope.$emit('ERROR_SHOW');
		});
	};

	$scope.removeUsers = function(_list){
		$scope.refresh = true;
		var assignList = list_id;
		if (_list != null
					&& _list != "undefined"){
				assignList = _list;
			}
			getSelectedIds($scope.usersArray, function(err, _user_id_list){
				var validation_error = false;
				//Validate
				if (assignList == null || assignList == ""){
					validation_error = true;
					$scope.error_message = "No list selected";
					$scope.$emit('ERROR_SHOW');
				}
				if (_user_id_list == null || _user_id_list == "" || _user_id_list.length == 0){
					validation_error = true;
					$scope.error_message = "No users selected";
					$scope.$emit('ERROR_SHOW');
				}

				if (!validation_error){
					listFactory.membersDestroyAll(assignList, _user_id_list).success(function (response) {
						$scope.usersArray = {};
						var result = response;
						if (result.type == "SUCCESS"){
							$scope.$emit('AJAX_SUCCESS');
							/*call get the lists again.. */
							$scope.getListUsers(list_id);
						}else{
							$scope.$emit('ERROR_SHOW');
						}
					}).error(function (error) {
						$scope.$emit('ERROR_SHOW');
					});
				}
			});
		};

		$scope.usersArray = {};
	}
