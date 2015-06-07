define([ './module' ], function(module) {
	module.controller('modalLoadingContainer', [ '$scope', '$modalInstance', 'generalFactory',
	function($scope, $modalInstance, generalFactory) {

		$scope.$watch(function () { return generalFactory.getLoadingValue(); }, function (newValue, oldValue) {
			if (newValue !== oldValue){
				$scope.info = !newValue.completed;
				var percent = newValue.percent;
				$scope.info_message = "";
				if (!newValue.completed) {
				}else{
					$modalInstance.dismiss('completed');
				}
			}
		});

	} ]);
});
