/*
* logic for assigning users to lists...
* */
function usersFriendsListsController($scope, userFactory, listFactory, filterFilter, $modal){
	$scope.warning_not_all_friends = false;
	$scope.totalItems = 0;
	$scope.currentPage = 1;
	$scope.itemsPerPage = 20;
	$scope.maxSize = 5;
	$scope.bigTotalItems = 0;
	$scope.bigCurrentPage = 1;
	$scope.term = "";
	$scope.searchFilter = "Screen name";
	$scope.typeSearch = 1; // screen_name

	var crateCount = 0;
	var callback = function(err, res){
		//console.log("TURACO_DEBUG - created: " + res + " i: " + (++crateCount) );
	};

	createCheckboxHandlers($scope, callback);
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

	$scope.$watch('search', performSearch);

	function performSearch(term, callback){

		if (term != null){
			$scope.term = term;
		}

		if ($scope.typeFilter != null && $scope.typeFilter > 0){
			var typeFilter = (parseInt($scope.typeFilter) == 2);
			if ($scope.typeSearch == 1){
				$scope.filtered = filterFilter($scope.friends, {screen_name : $scope.term, inList: typeFilter});
			}else if ($scope.typeSearch == 2){
				$scope.filtered = filterFilter($scope.friends, {name : $scope.term, inList: typeFilter});
			}else if ($scope.typeSearch == 3){
				$scope.filtered = filterFilter($scope.friends, {location : $scope.term, inList: typeFilter});
			}
		}else{
			if ($scope.typeSearch == 1){
				$scope.filtered = filterFilter($scope.friends, {screen_name : $scope.term});
			}else if ($scope.typeSearch == 2){
				$scope.filtered = filterFilter($scope.friends, {name : $scope.term});
			}else if ($scope.typeSearch == 3){
				$scope.filtered = filterFilter($scope.friends, {location : $scope.term});
			}
		}

		if ($scope.filtered != null ){
			$scope.totalItems = $scope.filtered.length;
		}
	}

	/*
	* end pagination logic
	* */

	function callGetListsByLoggedUser(){
	// $scope.getListsByLoggedUser();
		$scope.getListsByLoggedUser(function(err, result){
			if (!err){
				var lists = result.data.items;
				$scope.updatableLists = [];
				for (var index in lists){
					if (lists[index].own_list){
						$scope.updatableLists.push(lists[index]);
					}
				}
			}
		});
	}
	callGetListsByLoggedUser();
	/*
	* with the existing information filter the lists
	* */
	$scope.filteredFriends = function(type){
		$scope.typeFilter = parseInt(type);
		performSearch(null);
	};

	$scope.searchFriendsBy = function(type){
		$scope.typeSearch = parseInt(type);
		if ($scope.typeSearch == 1){
			$scope.searchFilter = "Screen name";
		}else if ($scope.typeSearch == 2){
			$scope.searchFilter = "Name";
		}else if ($scope.typeSearch == 3){
			$scope.searchFilter = "Location";
		}
		performSearch(null);
	};

	$scope.usersArray = {};

	$scope.handleAddUsers = function(list){
		$scope.assignUsers2List(list, function(err, resp){
			// deselect items...
			$scope.usersArray = {};
			if (!err){

				callGetListsByLoggedUser();
				$scope.getUserFriends();
			}
		});
	};
	crateListModal($scope, $modal, $scope.handleAddUsers, callback);
}
