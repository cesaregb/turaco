define(['./module', './message_helper',  './accounts_helper'],
function (module) {
   module.controller('userController', ['$scope', 'listFactory', 'userFactory', '$location', '$routeParams', '$geolocation',
   function ($scope, listFactory, userFactory, $location, $routeParams, $geolocation) {
      createMessageHelper($scope, null);

      function init(){

         function handleTrendsReponse(result){
            if (result.type == "SUCCESS"){
               if (result.data == null
                     || result.data.trends_info == null
                     || result.data.trends_info.trends == null){
                     $scope.handleErrorResponse();
               }else{
                  $scope.trends = result.data.trends_info.trends;
                  if ($scope.saveGeoTrends){
                     $scope.saveGeoTrends = false;
                     $scope.geoTrends = result.data.trends_info.trends;
                  }
               }
            }else {
               $scope.handleErrorResponse(result);
            }
         }

         var path = $location.$$path; // get the path for initialization per page.
         if (path == '/home'){
            $scope.geolocationDenied = false;
            $scope.saveGeoTrends = false;
            $scope.geoTrends = null;
            createGetListsByLoggedUser($scope, listFactory, null);

            $scope.getTrendsPlace = function(woeid, callback){
               userFactory.getTrendsPlace(woeid).success(handleTrendsReponse).error($scope.handleErrorResponse);
            };

            $scope.getTrendsByLocation = function(lat, long){
               userFactory.getTrendsClosests(lat, long).success(handleTrendsReponse).error($scope.handleErrorResponse);
            };

            $scope.searchWoeidByCity = function(city){
               userFactory.getYQLLocationByCity(city).success(function(response){
               }).error($scope.handleErrorResponse);
            };

            $scope.getSavedSearches = function(){
               userFactory.getSavedSearches().success(function(response){
                  var result = response;
                  if (result.type == "SUCCESS"){
                     $scope.searches = result.data;
                  }else {
                     $scope.handleErrorResponse(response);
                  }
               }).error($scope.handleErrorResponse);
            };

            $scope.getTrendsAvailable = function(callback){
               userFactory.getTrendsAvailable().success(function(result){
                  if (result.type == "SUCCESS"){
                     $scope.places = result.data;
                     $scope.selectedPlace = result.data[0];
                     if(typeof callback == "function"){
                        callback(result.data);
                     }
                  }else {
                     $scope.handleErrorResponse(result);
                  }
               }).error($scope.handleErrorResponse);
            };

            $scope.getSavedSearches();

            // load user lists...
            if ($scope.lists == null || $scope.refresh){
               $scope.getListsByLoggedUser();
            }

            $scope.activateLocation = function(){

               function callGeoError(){
                  $scope.geolocationDenied = true;
                  $scope.myPosition = {};
                  message = "User denied Geolocation";
                  $scope.handleErrorResponse(null, message);
                  $scope.getTrendsPlace(1);
               }
               if (!$scope.geolocationDenied ){
                  if ($scope.geoTrends != null){
                     // load tredns from previous saved calls..
                     // this is called on open .
                     $scope.trends = $scope.geoTrends;
                  }else{
                     $scope.myPosition = null;
                     $geolocation.getCurrentPosition({
                        timeout: 60000
                     }).then(function(position) {

                        $scope.myPosition = position;
                        var lat = position.coords.latitude;
                        var lon = position.coords.longitude;
                        $scope.getTrendsByLocation(lat, lon);
                        $scope.saveGeoTrends = true;
                     }, function(err){
                        callGeoError();
                     });

                     setTimeout(function(){
                        if ($scope.myPosition == null){
                     		$scope.info_message = "Geolocation not active, Loading general #Trends...";
                           $scope.$emit('TEMPORAL_MESSAGE');
                           $scope.getTrendsPlace(1);
                        }
               		}, 6000);
                  }
               }else{
                  //how can we show the message again???
                  callGeoError();
               }
            };

            $scope.activateLocation();

            $scope.getTrendsAvailable();

            $scope.selectedPlace = null; // red.

            $scope.searchChanged = function (value) {
               console.log("TURACO_DEBUG - searchChanged: " + JSON.stringify(value) );
               var woeid = value.woeid;
               $scope.getTrendsPlace(woeid);
            };


         }else if(path.indexOf("some_other_shit") > 0){
         }else{
            //PLACE HOLDER FOR A URL PATTERN DIDNT MATCHED..
         }
      }
      init();
   }]);
});
