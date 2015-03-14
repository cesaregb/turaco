/**
* build helper for account management.
*/
function createCheckboxHandlers($scope, callback){
	var fnName = "createCheckboxHandlers";
	/*
	* select users for assigning.. basic logic..
	* */
	$scope.userSelected = function(user){
		user.checked = !user.checked;
		console.log("TURACO_DEBUG - addig or removing user. " + user.checked);
		if (user.checked){
			$scope.usersArray[user.screen_name] = user;
		}else{
			delete $scope.usersArray[user.screen_name];
		}
		/*
		* add user to a hashkind of, to be able to add it or remove it quickly...
		* */
	}

	$scope.isSelected = function(user){
		return ($scope.usersArray[user.screen_name] != null);
	}

	$scope.isFollowing = function(user){
		return !user.following;
	}

	function getSelectedIds(callback){
		var user_id_list = "";
		for (var i in $scope.usersArray) {
			if ($scope.usersArray.hasOwnProperty(i)) {
				user_id_list += $scope.usersArray[i].id + ",";
			}
		}
		user_id_list = user_id_list.substring(0, (user_id_list.length - 1 ));
		callback(null, user_id_list);
	}

	if (callback != null){ callback(null, fnName) }
}


function crateListModal($scope, callback){
	var fnName = "crateListModal";
	//open modal window for selecting the list to add
	$scope.open = function (size) {
		size = 'lg';
		var modalInstance = $modal.open({
			templateUrl: 'modalListContainer.html',
			controller: 'modalListsController',
			size: size,
			resolve: {
				lists: function () {
					return $scope.lists;
				}
			}
		});

		modalInstance.result.then(function (selectedItem) {
			console.log("TURACO_DEBUG - callback from modal: " + JSON.stringify(selectedItem));
			$scope.assignUsers2List(selectedItem);
		}, function () {
			console.log('Modal dismissed at: ' + new Date());
		});
	};

	if (callback != null){ callback(null, fnName) }
}

function createAssignUser2List($scope, listFactory, callback){
	var fnName = "createAssignUser2List";
	/*
	* assign user to lists
	* */
	$scope.assignUsers2List = function(_list){
		$scope.refresh = true;
		var assignList = null;
		console.log("TURACO_DEBUG - list: " + JSON.stringify(_list));
		if (_list != null && _list != "undefined"){
			assignList = _list;
		}
		if (false){
			/* call the service */
			if (typeof getSelectedIds === "function"){
				getSelectedIds(function(err, user_id_list){
					user_id_list = user_id_list.substring(0, (user_id_list.length - 1 ));
					console.log("TURACO_DEBUG - within assignUsers2List \n list: " + $scope.list_selected + "\n users: " + user_id_list);

					/*call service to add items to the list.. */
					$scope.$emit('LOAD');
					listFactory.membersCreateAll($scope.list_selected.id, user_id_list).success(function (response) {
						$scope.$emit('UNLOAD')
						var result = response;
						if (result.type == "SUCCESS"){
							$scope.$emit('ERROR_HIDE');
							/*call get the lists again.. */
							$scope.loadUserLists();
						}else{
							console.log("Error on the service: " + response);
						}
					}).error(function (error) {
						$scope.$emit('UNLOAD')
						console.log("Error on the service: " + error);
						$scope.status = 'Unable to load lists data: ' + error.message;
					});
				});
			}else{
				console.log("TURACO_DEBUG - getSelectedIds NOT DECLARED");
			}
		}
	}

	if (callback != null){ callback(null, fnName) }
}

function createGetListsByLoggedUser($scope, listFactory, callback){
	var fnName = "createGetListsByLoggedUser";
	/*
	* get user lists
	* */
	$scope.getListsByLoggedUser = function(listsByLoggedUserCallback){
		$scope.$emit('LOAD')
		listFactory.getListsByLoggedUser().success(function (response) {
			$scope.$emit('UNLOAD')
			var result = response;
			var error = null;
			if (result.type == "SUCCESS"){
				$scope.$emit('ERROR_HIDE');
				$scope.lists = result.data.items;
			}else{
				error = "Error on the service: "
				console.log("Error on the service: " + response);
			}
			if (listsByLoggedUserCallback != null){listsByLoggedUserCallback(error, response);}
		}).error(function (error) {
			$scope.$emit('UNLOAD')
			console.log("Error on the service: " + error);
			$scope.error_message = 'Unable to load lists data: ' + error.message;
			if (listsByLoggedUserCallback != null){listsByLoggedUserCallback(error, null);}
		});
	}

	if (callback != null){ callback(null, fnName) }
}

function createGetUserFriends($scope, userFactory, callback){
	var fnName = "createGetUserFriends";
	/*
	* get user friends
	* */
	$scope.getUserFriends = function() {
		$scope.$emit('LOAD');
		userFactory.getUserFriends().success(function (response) {
			$scope.$emit('UNLOAD')
			var result = response;
			if (result.type == "SUCCESS"){
				$scope.$emit('ERROR_HIDE');
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
				console.log("Error on the service: " + response);
			}
		}).error(function(error, status, header, config) {
			$scope.$emit('ERROR_SHOW'); $scope.$emit('UNLOAD');
			console.log("Error on the service: " + error);
			$scope.error_message = 'Unable to load lists data: ' + error.message;
		});
	};

	if (callback != null){ callback(null, fnName) }
}

function createGetUserFriends($scope, listFactory, callback){
	var fnName = "createGetUserFriends";
	$scope.getListUsers = function(list_id){
		$scope.$emit('LOAD');
		listFactory.getListUsers(list_id).success(function (response) {
			$scope.$emit('UNLOAD')
			var result = response;
			if (result.type == "SUCCESS"){
				$scope.$emit('ERROR_HIDE');
				$scope.users = result.data.users;
			}else{
				$scope.$emit('ERROR_SHOW');
			}
		}).error(function (error) {
			$scope.$emit('ERROR_SHOW');
			$scope.$emit('UNLOAD')
			console.log("Error on the service: " + error);
		});
	}

	if (callback != null){ callback(null, fnName) }
}
