/**
 * User Interface error helpers
 */

function createMessageHelper($scope, callback){
	var fnName = "info_message";
	$scope.num_errors = 0;
	$scope.refresh = false;
	$scope.info = false;
	$scope.important_message = false;
	$scope.error_blocked = false;


	$scope.$on('AJAX_SUCCESS', function(){
		$scope.important_message = true;
		$scope.$emit('ERROR_HIDE');
		$scope.info = true;
		$scope.info_message = "Action completed!";
		setTimeout(function(){
			$scope.$emit('TEMPORAL_MESSAGE_END');
		}, 3000);
	});

	$scope.$on('TEMPORAL_MESSAGE', function(){
		$scope.info = true;
		if ($scope.info_message == ""){
			$scope.info_message = "Action completed!";
		}
		setTimeout(function(){
			$scope.$emit('TEMPORAL_MESSAGE_END');
		}, 3000);
	});

	$scope.$on('TEMPORAL_MESSAGE_END', function(){
		if(!$scope.$$phase) {
			$scope.$apply(function(){
				$scope.info = false;
				$scope.info_message = " ";
		   });
		}
	});

	$scope.$on('ERROR_SHOW', function(){
		if (!$scope.error_blocked){
			$scope.error=true;
			if ($scope.error_message == null || $scope.error_message == "")
				$scope.error_message = "Error on the service.";
			setTimeout(function(){
				$scope.$emit('ERROR_HIDE');
			}, 6000);
		}else{
			setTimeout(function(){
				$scope.$emit('ERROR_SHOW');
			}, 6000);
		}
	});

	$scope.$on('ERROR_HIDE', function(){
		if(!$scope.$$phase) {
			$scope.$apply(function(){
				$scope.error_message = "";
				$scope.error=false;
			});
		}
	});

	$scope.handleErrorResponse = function(error_json, message) {
		if (error_json != null
				&& error_json.err_data != null
				&& error_json.err_data.statusCode != null){
			if (parseInt(error_json.err_data.statusCode) == 429){
				$scope.error_blocked = true;
				$scope.error_message = "Ups, Twitter want us to wait 15m to keep using their API. \n Give us a few";
			}
		}
		if (!$scope.error_blocked){
			$scope.error_message = message;
		}

		$scope.$emit('ERROR_SHOW');
	};

	if (callback != null){ callback(null, fnName) }
}
