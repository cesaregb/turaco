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

	function callDestroyUsersHandler(list_id, user_id_list, callDestroyUsersHandlerCallback){
		listFactory.membersDestroyAll(list_id, user_id_list).success(function (response) {
			var result = response;
			if (result.type == "SUCCESS"){
				$scope.$emit('AJAX_SUCCESS');
				/*call get the lists again.. */
				$scope.getListUsers(list_id);
				//refresh the list numbers (this for the popup and/or dropdown.)
				$scope.getListsByLoggedUser();
			}else{
				$scope.handleErrorResponse(response);
			}
		}).error($scope.handleErrorResponse);
	}

	$scope.removeUser = function(user){
		/*call service to add items to the list.. */
		var user_id_list = user.id.toString();
		callDestroyUsersHandler(list_id, user_id_list, null);

	};



	$scope.removeUsers = function(_list){
		$scope.refresh = true;
		var assignList = list_id;
		if (_list != null
			&& _list != "undefined"){
				assignList = _list;
			}
			getSelectedIds($scope.usersArray, function(err, user_id_list){
				var validation_error = false;
				//Validate
				if (assignList == null || assignList == ""){
					validation_error = true;
					$scope.error_message = "No list selected";
					$scope.$emit('ERROR_SHOW');
				}
				if (user_id_list == null || user_id_list == "" || user_id_list.length == 0){
					validation_error = true;
					$scope.error_message = "No users selected";
					$scope.$emit('ERROR_SHOW');
				}

				if (!validation_error){
					callDestroyUsersHandler(list_id, user_id_list, null);
				}
			});
		};

		$scope.usersArray = {};
	}
