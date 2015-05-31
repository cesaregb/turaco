define([ './module' ], function(module) {
	module.controller('modalLoadingContainer', [ '$scope', '$modalInstance', 'generalFactory',
	function($scope, $modalInstance, generalFactory) {

		$scope.ok = function() {
			$modalInstance.close("1");
		};

		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};

		$scope.$watch(function () { return generalFactory.getLoadingValue(); }, function (newValue, oldValue) {
			if (newValue !== oldValue){
				$scope.info = !newValue.completed;
				var percent = newValue.percent;
				$scope.info_message = "";
				if (!newValue.completed) {

					console.log("TURACO_DEBUG - not completed yet... ");
				}else{
					console.log("TURACO_DEBUG - compleated within the controller...");
					$modalInstance.dismiss('completed');
				}
			}
		});

	} ]);
});
