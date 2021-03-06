var TYPE_URL = 1;
var TYPE_BY_USER = 2;

function copyListsController($scope, userFactory, listFactory, filterFilter, $modal, type, list_id){
	function callGetListsByUser(screen_name, callback){
		listFactory.getListsByUser(screen_name).success(function (response){
			var result = response;
			if (result.type == "SUCCESS"){
				$scope.lists = result.data.items;
			}else {
				$scope.handleErrorResponse(response);
			}
		}).error($scope.handleErrorResponse);
	}

	function validateListId(list_id){
		if (list_id == null){
			if ($scope.list_info == null){
				$scope.handleErrorResponse(null, "Ups, we cannot clone an non existing list please select one.");
			}else{
				list_id = $scope.list_info.id_str;
			}
		}
		return list_id;
	}

	$scope.cloneList = function(list_id){
		list_id = validateListId(list_id);
		$scope.handleErrorResponse(null, "Sorry at this time this option is not allowed. By now you can subscribe to the list instead.");
	};

	$scope.subscribeList = function(list_id){
		list_id = validateListId(list_id);
		listFactory.subscribeToList(list_id).success(function (response){
			var result = response;
			if (result.type == "SUCCESS"){
				$scope.$emit('AJAX_SUCCESS');
			}else {
				$scope.handleErrorResponse(response);
			}
		}).error($scope.handleErrorResponse);
	};

	$scope.isListSelected = function(){
		return ($scope.list_info == null);
	};

	$scope.list_info = null;

	if(type == TYPE_BY_USER) {
		// get the user friends...
		createGetUserFriends($scope, userFactory, filterFilter, null);
		$scope.getUserFriends(null);

		$scope.refreshMySearchValue =  function(term){
			$scope.mySearchTerm = term;
		};

		$scope.userSearchChanged = function(item){
			var screen_name = item.screen_name;
			callGetListsByUser(screen_name);
		};

		$scope.searchUser = function(searchTerm){
			if ($scope.mySearchTerm == null
					|| $scope.mySearchTerm == "" ){
				$scope.handleErrorResponse(null, "Twitter lets you play with the username, but EMPTY is not yet allowed");
			}else{
				var screen_name = $scope.mySearchTerm;
				callGetListsByUser(screen_name);
			}
		};

	}else if(type == TYPE_URL){
		if (list_id != null){
			$scope.list_id = list_id;
			listFactory.getListInformationByListId(list_id).success(function (response){
				var result = response;
				if (result.type == "SUCCESS"){
					$scope.searchedListUsers = result.data.users;
					$scope.list_info = result.data.list_info;
				}else {
					$scope.handleErrorResponse(response);
				}
			}).error($scope.handleErrorResponse);
		}

		$scope.sendListURL = function(){
			if ($scope.listUrl == null
				|| $scope.listUrl == ""){
					$scope.handleErrorResponse(null, "Ups couldnt use that URL, try another please ");
			}else{
					var arr = $scope.listUrl.split("/");
					var lastPos = 0;
					if (arr[(arr.length - 1)].length > 0){
						lastPos = arr.length - 1;
					}else{
						lastPos = arr.length - 2;
					}
					var slug = arr[lastPos];
					var ownerScreenName = arr[lastPos - 2];

					listFactory.getListInformationByURL(ownerScreenName, slug).success(function (response){
						var result = response;
						if (result.type == "SUCCESS"){
							$scope.searchedListUsers = result.data.users;
							$scope.list_info = result.data.list_info;
						}else {
							$scope.handleErrorResponse(response);
						}
					}).error($scope.handleErrorResponse);
				}
			};
		}
	}
