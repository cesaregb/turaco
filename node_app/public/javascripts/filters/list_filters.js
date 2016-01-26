
define(['./module'], function (module) {
    'use strict';

   module.filter('typeFilter', function () {
		if (true){
			return function (input, scope) {
				console.log("TURACO_DEBUG - input: " );
				var friends = scope.friends;
				var users = [];
				for (var index in friends){
					var turaco_user = {};
					var json_user = friends[index];
					turaco_user.name = json_user.name.toUpperCase();
					turaco_user.screen_name = json_user.screen_name;
					turaco_user.description = json_user.description;
					turaco_user.profile_image_url = json_user.profile_image_url;
					turaco_user.location = json_user.location;
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
	    };
	});


   module.filter('propsFilter', function() {
      return function(items, props) {
         var out = [];

         if (angular.isArray(items)) {
            items.forEach(function(item) {
               var itemMatches = false;

               var keys = Object.keys(props);
               for (var i = 0; i < keys.length; i++) {
                  var prop = keys[i];
                  var text = props[prop].toLowerCase();
                  if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                     itemMatches = true;
                     break;
                  }
               }

               if (itemMatches) {
                  out.push(item);
               }
            });
         } else {
            // Let the output be the input untouched
            out = items;
         }

         return out;
      };
   });
});
