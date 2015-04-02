/**
* build helper for checkbox handling..
*/
function createCheckboxHandlers($scope, callback){
	var fnName = "createCheckboxHandlers";
	$scope.userSelected = function(user){
		user.checked = !user.checked;
		console.log("TURACO_DEBUG - addig or removing user. " + user.checked);
		if (user.checked){
			$scope.usersArray[user.screen_name] = user;
		}else{
			delete $scope.usersArray[user.screen_name];
		}
	};

	$scope.isSelected = function(user){
		return ($scope.usersArray[user.screen_name] != null);
	};

	$scope.isFollowing = function(user){
		return !user.following;
	};

	if (callback != null){ callback(null, fnName) }
}

function getSelectedIds(array, callback){
	var user_id_list = "";
	for (var i in array) {
		if (array.hasOwnProperty(i)) {
			user_id_list += array[i].id + ",";
		}
	}
	user_id_list = user_id_list.substring(0, (user_id_list.length - 1 ));
	callback(null, user_id_list);
}

/*
	create the Fn to create the Modal (show / hide)
*/
function crateListModal($scope, $modal, callback){
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
			var getListsByLoggedUserCallback = null;
			if (typeof $scope.getListsByLoggedUser == "function"){
				// this updates the users on the list, then we update the scope with the proper list in case of needed...
				getListsByLoggedUserCallback = function(err, res){
					if (!err)
						$scope.getListsByLoggedUser();
				};
			}
			$scope.assignUsers2List(selectedItem, getListsByLoggedUserCallback);
		}, function () {
			console.log('Modal dismissed at: ' + new Date());
		});
	};

	if (callback != null){ callback(null, fnName); }
}

/*
	Create Fn to call ajax call to "assign users" to lists
*/
function createAssignUser2List($scope, listFactory, callback){
	var fnName = "createAssignUser2List";
	/*
	* assign user to lists
	* */
	$scope.assignUsers2List = function(_list, assignUsers2ListCallback){
		$scope.refresh = true;
		var assignList = null;
		if (_list != null && _list != "undefined"){
			assignList = _list;
		}else{
			assignList = $scope.list_selected;
		}

		/* call the service */
		if (typeof getSelectedIds === "function"){
			getSelectedIds($scope.usersArray, function(err, user_id_list){
				user_id_list = user_id_list.substring(0, (user_id_list.length - 1 ));
				/*call service to add items to the list.. */
				var validation_error = false;
				//Validate
				var error = null;
				var result = null;
				if (assignList == null || assignList == ""){
					validation_error = true;
					$scope.error_message = "No list selected";
					error = $scope.error_message;
					$scope.$emit('ERROR_SHOW');
				}
				if (user_id_list == null || user_id_list == "" || user_id_list.length == 0){
					validation_error = true;
					$scope.error_message = "No users selected";
					error = $scope.error_message;
					$scope.$emit('ERROR_SHOW');
				}
				if (!validation_error){
					listFactory.membersCreateAll(assignList.id, user_id_list).success(function (response) {
						var result = response;
						if (result.type == "SUCCESS"){
							$scope.$emit('AJAX_SUCCESS');
							/*call get the lists again.. */
							result = response;
						}else{
							error = "Error on the service";
							$scope.handleErrorResponse(response);
						}
					}).error($scope.handleErrorResponse);
				}
				if (typeof assignUsers2ListCallback == "function"){
					assignUsers2ListCallback(error, result);
				}
			});
		}else{
			$scope.$emit('ERROR_SHOW');
			console.log("TURACO_DEBUG - getSelectedIds NOT DECLARED");
		}
	};

	if (callback != null){ callback(null, fnName) }
}

function createGetListsByLoggedUser($scope, listFactory, callback){
	var fnName = "createGetListsByLoggedUser";
	/*
	* get user lists
	* */
	$scope.getListsByLoggedUser = function(listsByLoggedUserCallback){
		listFactory.getListsByLoggedUser().success(function (response) {
			var result = response;
			var error = null;
			if (result.type == "SUCCESS"){
				$scope.lists = result.data.items;
			}else{
				error = "Error on the service: ";
				$scope.handleErrorResponse(response);
			}
			if (listsByLoggedUserCallback != null){ listsByLoggedUserCallback(error, response); }
		}).error(function (error) {
			$scope.handleErrorResponse(error);
			if (listsByLoggedUserCallback != null){ listsByLoggedUserCallback(error, null); }
		});
	};

	if (callback != null){ callback(null, fnName); }
}

function createGetUserFriends($scope, userFactory, filterFilter, callback){
	var fnName = "createGetUserFriends";
	/*
	* get user friends
	* */
	$scope.getUserFriends = function() {
		userFactory.getUserFriends().success(function (response) {
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
				$scope.handleErrorResponse(response);
			}
		}).error($scope.handleErrorResponse);
	};

	if (callback != null){ callback(null, fnName); }
}

function createGetListUsers($scope, listFactory, callback){
	var fnName = "createGetListUsers";
	$scope.getListUsers = function(list_id){
		if (list_id == null ||  list_id == ""){
			$scope.error_message = "No list selected";
			$scope.$emit('ERROR_SHOW');
		}else{
			listFactory.getListUsers(list_id).success(function (response) {
				var result = response;
				if (result.type == "SUCCESS"){
					$scope.users = result.data.users;
				}else{
					$scope.handleErrorResponse(response);
				}
			}).error($scope.handleErrorResponse);
		}
	};

	if (callback != null){ callback(null, fnName) }
}

function crateConfirmModal($scope, $modal, callback){
	var fnName = "crateConfirmModal";
	//open modal window for selecting the list to add
	$scope.open_modal = function (modal_message_confirm, modalCallback) {
		size = 'sm';
		var modalInstance = $modal.open({
			templateUrl: 'modalConfirmContainer.html',
			controller: 'modalConfirmContainer',
			size: size,
			resolve: {
				modal_message_confirm: function () {
					return modal_message_confirm;
				}
			}
		});

		modalInstance.result.then(function (response) {
			if (response){
				modalCallback(null, response);
			}else modalCallback(response);
		}, function () {
			console.log('Confirm Modal dismissed at: ' + new Date());
		});
	};

	if (callback != null){ callback(null, fnName) }
}
