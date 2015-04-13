define([ './module' ], function(module) {
	module.controller('modalConfirmContainer', [ '$scope', '$modalInstance', 'modal_message_confirm', 'is_delete_list',
	function($scope, $modalInstance, modal_message_confirm, is_delete_list) {
		$scope.modal_message_confirm = modal_message_confirm;
		$scope.is_delete_list = is_delete_list;
		$scope.ok = function() {
			console.log("TURACO_DEBUG - clicked ok: " + $scope.unfollowUsers );
			if ($scope.unfollowUsers == null || $scope.unfollowUsers == "undefined"){
				$scope.unfollowUsers = false;
			}
			$modalInstance.close({message: "ok", unfollowUsers : $scope.unfollowUsers });
		};
		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}]);
});
