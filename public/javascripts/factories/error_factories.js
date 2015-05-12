define(['./module'],
function (module) {

   module.factory('generalFactory', function(){
      var data = {
         error_status: {error: false, error_message: ""},
         user_loading_status: {completed: false, percent: 0}
      };

      return {
         getValue: function () {
            return data.error_status;
         },
         setValue: function (error_status) {
            data.error_status = error_status;
         },
         getLoadingValue: function () {
            return data.user_loading_status;
         },
         setLoadingValue: function (user_loading_status) {
            data.user_loading_status = user_loading_status;
         }
      };
   });

});
