define(['./module'],
function (module) {

   module.factory('listFactory', ['$http', function ($http) {
      var urlBase = '/api/lists';
      var listDataFactory = {};
      var lists = null;

      listDataFactory.refreshUserLists = function () {
         console.log("TURACO_DEBUG - AJAX REQUEST GET: " + urlBase);
         lists = $http.get(urlBase);
      };

      listDataFactory.getListsByLoggedUser = function () {
         console.log("TURACO_DEBUG - AJAX REQUEST GET getListsByLoggedUser: " + urlBase);
         return $http.get(urlBase);
      };

      listDataFactory.saveList = function ( list ) {
         var params = {name: list.name, description: list.description, mode: list.mode };
         console.log("TURACO_DEBUG - AJAX REQUEST PUT saveList: " + urlBase + "\n params: " + JSON.stringify(params) );
         return $http.put(urlBase, params);
      };

      listDataFactory.getListUsers = function (list_id) {
         console.log("TURACO_DEBUG - AJAX REQUEST getListUsers: " + urlBase + "/list_users" + "/" + list_id);
         return $http.get(urlBase + "/list_users" + "/" + list_id);
      };

      listDataFactory.membersCreateAll = function (list_id, users_list) {
         var params = {users_list: users_list, list_id: list_id};
         console.log("TURACO_DEBUG - AJAX REQUEST membersCreateAll: " + urlBase + "/members_create_all" + "\n params: " + JSON.stringify(params));
         return $http.post(urlBase + "/members_create_all", params);
      };

      listDataFactory.membersDestroyAll = function (list_id, users_list) {
         var params = {users_list: users_list, list_id: list_id};
         console.log("TURACO_DEBUG - AJAX REQUEST membersDestroyAll: " + urlBase + "/members_destroy_all" + "\n params: " + JSON.stringify(params));
         return $http.post(urlBase + "/members_destroy_all", params);
      };

      listDataFactory.deleteList = function (list) {
         console.log("TURACO_DEBUG - AJAX REQUEST deleteList delete : " + urlBase + "/" + list.id);
         return $http.delete(urlBase + "/" + list.id);
      };

      listDataFactory.updateList = function (list) {
         var params = {name: list.name, list_id: list.id, description: list.description, mode: list.mode };
         console.log("TURACO_DEBUG - AJAX REQUEST POST updateList: " + urlBase + "\n params: " + JSON.stringify(params));
         return $http.post(urlBase, params);
      };

      return listDataFactory;
   }]);
});
