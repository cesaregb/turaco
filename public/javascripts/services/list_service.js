define(['./module'], function (module) {
	module.service('listService', [ function () {
		var lists = null;
		return{
			getLists : function(){
				return lists;
			},
			setLists : function(_lists){
				lists = _lists;
			}
		};
    }]);
});

