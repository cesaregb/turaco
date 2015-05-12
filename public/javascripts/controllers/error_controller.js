define([ './module' ], function(module) {
	module.controller('errorController', [ '$scope', 'generalFactory', 'userFactory',
	function($scope, generalFactory, userFactory) {
		$scope.generalFactory = generalFactory;

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
				$scope.info_message = (!newValue.completed)?"Turaco is loading your information from Twitter "+percent+"%. This may time please give us a few seconds.":"";
			}
		});
	}]);
});
