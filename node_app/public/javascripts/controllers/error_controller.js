define([ './module' ], function(module) {
	module.controller('errorController', [ '$scope', 'generalFactory', 'userFactory', '$modal',
	function($scope, generalFactory, userFactory, $modal) {
		$scope.generalFactory = generalFactory;
		$scope.windowLoading = false;
		$scope.error = false;
		$scope.error_message = "";

		$scope.info = false;
		$scope.info_message = "";

		$scope.$watch(function () { return generalFactory.getValue(); }, function (newValue, oldValue) {
			if (newValue !== oldValue){
				$scope.error = newValue.error;
				$scope.error_message = newValue.error_message;
			}
		});

		$scope.$watch(function () { return generalFactory.getLoadingValue(); }, function (newValue, oldValue) {
			if (newValue !== oldValue){
				$scope.info = !newValue.completed;
				var percent = newValue.percent;
				$scope.info_message = "";
				if (!newValue.completed) {
					if (! $scope.windowLoading){
						$scope.open_loading_modal(message, newValue);
					}

					var message = newValue.message;
					if (message == null){
						message = "Turaco is loading your information from Twitter "+percent+"%. This may take time please give us a few seconds.";
					}
					$scope.info_message = message;
				}
			}
		});

		$scope.open_loading_modal = function (message, response) {
			$scope.windowLoading = true;
			$scope.modalInstance = $modal.open({
				templateUrl: 'modalLoadingContainer.html',
				controller: 'modalLoadingContainer',
				backdrop: 'static',
				animation: false,
				resolve: {
					generalFactory: function () {
						return generalFactory;
					}
				}
			});

			$scope.modalInstance.result.then(function (response) {
				if (response){
				}else{
				}
			}, function () {
				$scope.windowLoading = false;
				//console.log('Confirm Modal dismissed at: ' + new Date());
			});
		};
	}]);
});
