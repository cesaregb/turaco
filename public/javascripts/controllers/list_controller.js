define(['./module'], function (module) {
	module.controller('listController', ['$scope', 'listFactory', 'userFactory', '$location', '$routeParams', 'filterFilter', '$modal', 
	                                     function ($scope, listFactory, userFactory, $location, $routeParams, filterFilter, $modal) {
		$scope.num_loading = 0;
		$scope.num_errors = 0;
		
		$scope.$on('LOAD', function(){
			$scope.num_loading++;
			$scope.loading=true;
		});
		$scope.$on('UNLOAD', function(){
			$scope.num_loading--;
			if ($scope.num_loading == 0){
				$scope.loading=false;
			}
		});
		
		$scope.$on('ERROR_SHOW', function(){
			$scope.num_errors++;
			if($scope.error_message == ""){
				$scope.error_message = 'Error on the service';
			}
			$scope.error=true;
		});
		$scope.$on('ERROR_HIDE', function(){
			$scope.num_errors--;
			if ($scope.num_errors == 0){
				$scope.error=false;
			}
		});
    	
    	function init(){
    		var path = $location.$$path; // get the path for initialization per page.
    		
			if (path == '/lists/index'){ /*SHOW LISTS INIT PAGE*/
				if ($scope.lists == null){
					$scope.$emit('LOAD');
					listFactory.getUserLists().success(function (response) {
						$scope.$emit('UNLOAD')
						var result = response;
						if (result.type == "SUCCESS"){
							$scope.$emit('ERROR_HIDE');
							$scope.lists = result.data.items;
						}else{
							$scope.$emit('ERROR_SHOW');
						}
					}).error(function (error) {
						$scope.$emit('ERROR_SHOW');
						$scope.$emit('UNLOAD')
						console.log("Error on the service: " + error);
					});
				}
			}else if(path.indexOf("lists/view_users") > 0){ /* VIEW LIST USERS... */
				var list_id = $routeParams.list_id;
				var member_count = $routeParams.member_count;
				$scope.$emit('LOAD');
				listFactory.getlistusers(list_id, member_count).success(function (response) {
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
			}else if(path == '/lists/assign_users_to_list'){ 
				/* get users and lists */ 
				initUsersFriendsLists($scope, userFactory, listFactory, filterFilter, $modal);
			}else if(path == '/lists/add_list'){
				
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
    	
    	$scope.saveList = function(new_list){
    		$scope.$emit('LOAD')
    		listFactory.saveList(new_list).success(function (response) {
				$scope.$emit('UNLOAD')
				var result = response;
				if (result.type == "SUCCESS"){
				}
			}).error(function (error) {
				$scope.$emit('UNLOAD')
				console.log("Error on the service: " + error);
				$scope.status = 'Unable to load lists data: ' + error.message;
			});
    		
    	}
    	
    }]);
});

function initUsersFriendsLists($scope, userFactory, listFactory, filterFilter, $modal){
	$scope.warning_not_all_friends = false;
	$scope.showSearchButton = false;
	$scope.totalItems = 0;
	$scope.currentPage = 1;
	$scope.itemsPerPage = 20
	$scope.maxSize = 5;
	$scope.bigTotalItems = 0;
	$scope.bigCurrentPage = 1;
	
	/* 
	 * get user friends 
	 * */ 
	$scope.bringFriends = function() {
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
	$scope.bringFriends(); 
	
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
	 * get user lists 
	 * */ 
	$scope.loadUserLists = function(type){
		if (type == 0){
			$scope.$emit('LOAD')
			listFactory.getUserLists().success(function (response) {
				$scope.$emit('UNLOAD')
				var result = response;
				if (result.type == "SUCCESS"){
					$scope.$emit('ERROR_HIDE');
					$scope.lists = result.data.items;
				}else{
					console.log("Error on the service: " + response);
				}
			}).error(function (error) {
				$scope.$emit('UNLOAD')
				console.log("Error on the service: " + error);
				$scope.status = 'Unable to load lists data: ' + error.message;
			});	
		}else{ /*load values avoiding session.. */
			$scope.$emit('LOAD')
			listFactory.getUserListsRefresh().success(function (response) {
				$scope.$emit('UNLOAD')
				var result = response;
				if (result.type == "SUCCESS"){
					$scope.$emit('ERROR_HIDE');
					$scope.lists = result.data.items;
				}else{
					console.log("Error on the service: " + response);
				}
			}).error(function (error) {
				$scope.$emit('UNLOAD')
				console.log("Error on the service: " + error);
				$scope.status = 'Unable to load lists data: ' + error.message;
			});	
			
		}
	}
	$scope.loadUserLists(0);
	
	/*declare functions*/
	$scope.searchFriends = function(){
		if ($scope.search != "undefined") {
			$scope.$emit('LOAD');
			userFactory.serachUserFriends($scope.search).success(function (response) {
				$scope.$emit('UNLOAD')
				var result = response;
				if (result.type == "SUCCESS"){
					$scope.$emit('ERROR_HIDE');
					$scope.friends_count = result.data.friends_count;
					if (parseInt(result.data.friends_count) > 1000){
						$scope.warning_not_all_friends = true;
					}
					$scope.friends = result.data;
					$scope.filtered = filterFilter($scope.friends, {screen_name: ""});
					$scope.totalItems = $scope.filtered.length;
				}else{
					$scope.$emit('ERROR_SHOW');
					console.log("Error on the service: " + response);
				}
			}).error(function(error, status, header, config) {
				$scope.$emit('ERROR_SHOW'); $scope.$emit('UNLOAD');
				console.log("Error on the service: " + error);
				$scope.error_message = 'Unable to load lists data: ' + error.message;
			});
		}
	}
	
	
	$scope.items = ['item1', 'item2', 'item3'];

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
	
	$scope.assignUsers2List = function(_list){
		console.log("TURACO_DEBUG - _list: " + JSON.stringify(_list));
		if (_list != null && _list != "undefined"){
			$scope.list_selected = _list;
		}
		/* call the service */
		var user_id_list = "";
		for (var i in $scope.usersArray) {
			if ($scope.usersArray.hasOwnProperty(i)) {
				user_id_list += $scope.usersArray[i].id + ",";
			}
		}
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
				$scope.loadUserLists(1);
			}else{
				console.log("Error on the service: " + response);
			}
		}).error(function (error) {
			$scope.$emit('UNLOAD')
			console.log("Error on the service: " + error);
			$scope.status = 'Unable to load lists data: ' + error.message;
		});	
		
	}
	
	$scope.userSelected = function(user){
		user.checked = !user.checked;
		console.log("TURACO_DEBUG - addig or removing user.");
		if (user.checked){
			$scope.usersArray[user.screen_name] = user;
		}else{
			delete $scope.usersArray[user.screen_name];
		}
		/* 
		 * add user to a hashkind of, to be able to add it or remove it quickly...
		 * */
	}
	
	/* DEPRECATED */
	$scope.getFilteredFriends = function(type){
		var filter = "";
		if (parseInt(type) == 0){ // 0 or false  = unlisted (this value is matched on the backend as well) 
			filter = "/byUnlisted";
		}else{
			filter = "/byListed";
		}
		$scope.$emit('LOAD');
		userFactory.getUserFriendsFilter(filter).success(function (response) {
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
		
	}
	
	$scope.filteredFriends = function(type){
		$scope.typeFilter = parseInt(type);
		var typeFilter = null;
		if (parseInt(type) == 1){
			typeFilter = false;
		}else if (parseInt(type) == 2){
			typeFilter = true;
		}
		
		console.log("TURACO_DEBUG - into the filter: " + typeFilter);
		$scope.filtered = filterFilter($scope.friends, {inList: typeFilter});
		if ($scope.filtered != null ){
			$scope.totalItems = $scope.filtered.length;
		}
	}
	$scope.usersArray = {};
}
