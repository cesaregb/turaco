define([ './module' ], function(module) {
	module.controller('errorController', [ '$scope', 'errorFactory',
	function($scope, errorFactory) {
		$scope.errorFactory = errorFactory;

		$scope.error = errorFactory.getValue().error;
		$scope.error_message = errorFactory.getValue().error_message;

		$scope.$watch(function () { return errorFactory.getValue(); }, function (newValue, oldValue) {
			if (newValue !== oldValue){
				$scope.error = newValue.error;
				$scope.error_message = newValue.error_message;
			} $scope.firstName = newValue;
		});

	}]);
});
