
define(['./module'], function (module) {
    'use strict';
	module.filter('friendFilter', function () {
		if (true){
			return function (input, scope) {
				var friends = scope.friends;
				var users = [];
				for (var index in friends){
					var turaco_user = {};
					var json_user = friends[index];
					turaco_user.name = json_user.name.toUpperCase();
					turaco_user.screen_name = json_user.screen_name;
					turaco_user.description = json_user.description;
					turaco_user.profile_image_url = json_user.profile_image_url;
					users.push(turaco_user);
				}
				$scope.friends = users;
				return users;
				
			};
		}else{
			console.log("entro en else");
			return function () {return;};
		}
    });
	module.filter('startFrom', function () {
		return function(input, start) {
	        if(input) {
	            start = +start; //parse to int
	            return input.slice(start);
	        }
	        return [];
	    }
	});
});

