define([ './module' ], function(module) {
	module.controller('modalListsController', [ '$scope', 'listFactory',
	'$modalInstance', 'lists',
	function($scope, listFactory, $modalInstance, lists) {

		$scope.lists = [];
		for (var index in lists){
			if (lists[index].own_list){
				$scope.lists.push(lists[index]);
			}
		}

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
