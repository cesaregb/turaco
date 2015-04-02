define([ './module' ], function(module) {
	module.controller('modalConfirmContainer', [ '$scope', '$modalInstance', 'modal_message_confirm',
	function($scope, $modalInstance, modal_message_confirm) {
		$scope.modal_message_confirm = modal_message_confirm;
		$scope.ok = function() {
			$modalInstance.close("ok");
		};
		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}]);
});
