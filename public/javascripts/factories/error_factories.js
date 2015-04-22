define(['./module'],
function (module) {

   module.factory('errorFactory', function(){
      var data = {
         error_status: {error: false, error_message: ""}
      };

      return {
         getValue: function () {
            return data.error_status;
         },
         setValue: function (error_status) {
            data.error_status = error_status;
         }
      };

   });

});
