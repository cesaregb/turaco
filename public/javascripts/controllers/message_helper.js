/**
 * User Interface error helpers
 */

function createMessageHelper($scope, generalFactory, callback){
	var fnName = "info_message";
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
		$scope.error = true;
		generalFactory.setValue({error: $scope.error, error_message: $scope.error_message});
		if (!$scope.error_blocked){
			if ($scope.error_message == null || $scope.error_message == "")
				$scope.error_message = "Error on the service.";

			setTimeout(function(){
				$scope.$emit('ERROR_HIDE');
			}, 7000);

		}else{
			setTimeout(function(){
				$scope.$emit('ERROR_HIDE');
			}, 7000);
		}
	});

	$scope.$on('ERROR_HIDE', function(){
		if(!$scope.$$phase) {
			$scope.$apply(function(){
				$scope.error_blocked = false;
				$scope.error_message = "";
				$scope.error = false;
				generalFactory.setValue({error: $scope.error, error_message: $scope.error_message});
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
			}else if (parseInt(error_json.err_data.statusCode) != null){
				$scope.error_blocked = true;
				$scope.error_message = "Ups, At this moment we have problems communicating with Twitter, we are working on it. ";
			}
		}else if(error_json.message != null){
			$scope.error_message = error_json.message;
		}
		if (!$scope.error_blocked && message){
			$scope.error_message = message;
		}
		$scope.$emit('ERROR_SHOW');
	};

	if (callback != null){ callback(null, fnName) }
}

function preInit($scope, userFactory, generalFactory, callback){
	var flag = generalFactory.getLoadingValue().completed;
	if (!flag){
		userFactory.checkUserLoadingStatus().success(function(response){
			var result = response;
			if (result.type == "SUCCESS"){
				generalFactory.setLoadingValue({completed: true, percent: 100});
				callback(); //normally init..
			}else {
				//{"type":"ERROR","message":"Twitter information is being loaded","data":6,"err_data":{"completed":false,"percent":70}}
				if (parseInt(result.data) == 6){
					if (result.err_data != null && result.err_data.percent != null)
						generalFactory.setLoadingValue({completed: false, percent: result.err_data.percent});
					else
						generalFactory.setLoadingValue({completed: false, percent: 0});
					setTimeout(function(){
						preInit($scope, userFactory, generalFactory, callback);
					}, 4000);
				}else{
					// other error different than expected...
					$scope.handleErrorResponse(result);
				}
			}
		}).error($scope.handleErrorResponse);
	}else{
		callback(); //normally init..
	}
}
