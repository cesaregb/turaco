/**
 * User Interface error helpers 
 */

function createMessageHelper($scope, callback){
	$scope.num_loading = 0;
	$scope.num_errors = 0;
	$scope.refresh = false;
	
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
			$scope.error_message = ""; 
			$scope.error=false;
		}
	});
	if (callback != null){ callback(null, "1"); }
}