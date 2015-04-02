define([ './module' ], function(module) {
	module.controller('modalListsController', [ '$scope', 'listFactory',
	'$modalInstance', 'lists',
	function($scope, listFactory, $modalInstance, lists) {

		$scope.lists = lists;
		$scope.selected = {
			list : $scope.lists[0]
		};

		$scope.ok = function() {
			$modalInstance.close($scope.selected.list);
		};

		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};

	} ]);
});
