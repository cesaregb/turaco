define(['./module'], function (module) {
	module.controller('listController', ['$scope', 'listFactory', 'userFactory', '$location', '$routeParams', 'filterFilter', 
	                                     function ($scope, listFactory, userFactory, $location, $routeParams, filterFilter) {
		$scope.num_loading = 0;
		$scope.num_errors = 0;
		
		$scope.$on('LOAD', function(){
			$scope.num_loading++;
			console.log("LOAD count: " + $scope.num_loading);
			$scope.loading=true;
		});
		$scope.$on('UNLOAD', function(){
			$scope.num_loading--;
			console.log("UNLOAD count: " + $scope.num_loading);
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
				listFactory.getListUsers(list_id, member_count).success(function (response) {
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
			}else if(path == '/lists/assign_users_to_list'){ /* get users and lists */ 
				initUsersFriendsLists($scope, userFactory, listFactory, filterFilter);
				
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
    		console.log("Saving list... " + JSON.stringify(new_list));
    		$scope.$emit('LOAD')
    		listFactory.saveList(new_list).success(function (response) {
				$scope.$emit('UNLOAD')
				var result = response;
				if (result.type == "SUCCESS"){
					console.log("LIST SAVED");
				}
			}).error(function (error) {
				$scope.$emit('UNLOAD')
				console.log("Error on the service: " + error);
				$scope.status = 'Unable to load lists data: ' + error.message;
			});
    		
    	}
    	
    }]);
});

function initUsersFriendsLists($scope, userFactory, listFactory, filterFilter){
	$scope.warning_not_all_friends = false;
	/* 
	 * get user friends 
	 * */ 
	$scope.totalItems = 0;
	$scope.currentPage = 1;
	$scope.itemsPerPage = 20
	$scope.maxSize = 5;
	$scope.bigTotalItems = 0;
	$scope.bigCurrentPage = 1;
	
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
	$scope.noOfPages = 
	
	$scope.$watch('search', function(term) {
        $scope.filtered = filterFilter($scope.friends, {screen_name: term});
        if ($scope.filtered != null ){
        	$scope.totalItems = $scope.filtered.length;
        }
    });
	
//	$scope.$watch('[friends,currentPage]', function() {
//		if ($scope.friends != null){
//			var begin = (($scope.currentPage - 1) * $scope.itemsPerPage);
//			var end = begin	+ $scope.itemsPerPage;
//			
//			$scope.filteredFriends = $scope.friends.slice(begin, end);
//			$scope.totalItems = $scope.friends.length;
//		}
//	}, true);
	
	/*
	 * get user lists 
	 * */ 
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
	
}


