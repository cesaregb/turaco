define(['./module'],
function (module) {

   module.factory('listFactory', ['$http', function ($http) {
      var urlBase = '/api/lists';
      var listDataFactory = {};
      var lists = null;

      listDataFactory.refreshUserLists = function () {
         // console.log("TURACO_DEBUG - AJAX REQUEST GET: " + urlBase);
         lists = $http.get(urlBase);
      };

      listDataFactory.getListsByLoggedUser = function () {
         // console.log("TURACO_DEBUG - AJAX REQUEST GET getListsByLoggedUser: " + urlBase);
         return $http.get(urlBase);
      };

      listDataFactory.saveList = function ( list ) {
         var params = {name: list.name, description: list.description, mode: list.mode };
         // console.log("TURACO_DEBUG - AJAX REQUEST PUT saveList: " + urlBase + "\n params: " + JSON.stringify(params) );
         return $http.put(urlBase, params);
      };

      listDataFactory.getListUsers = function (list_id) {
         // console.log("TURACO_DEBUG - AJAX REQUEST getListUsers: " + urlBase + "/list_users" + "/" + list_id);
         return $http.get(urlBase + "/list_users" + "/" + list_id);
      };

      listDataFactory.membersCreateAll = function (list_id, users_list) {
         var params = {users_list: users_list, list_id: list_id};
         // console.log("TURACO_DEBUG - AJAX REQUEST membersCreateAll: " + urlBase + "/members_create_all" + "\n params: " + JSON.stringify(params));
         return $http.post(urlBase + "/members_create_all", params);
      };

      listDataFactory.membersDestroyAll = function (list_id, users_list) {
         var params = {users_list: users_list, list_id: list_id};
         // console.log("TURACO_DEBUG - AJAX REQUEST membersDestroyAll: " + urlBase + "/members_destroy_all" + "\n params: " + JSON.stringify(params));
         return $http.post(urlBase + "/members_destroy_all", params);
      };

      listDataFactory.deleteList = function (list) {
         // console.log("TURACO_DEBUG - AJAX REQUEST deleteList delete : " + urlBase + "/" + list.id);
         return $http.delete(urlBase + "/" + list.id);
      };

      listDataFactory.updateList = function (list) {
         var params = {name: list.name, list_id: list.id, description: list.description, mode: list.mode };
         // console.log("TURACO_DEBUG - AJAX REQUEST POST updateList: " + urlBase + "\n params: " + JSON.stringify(params));
         return $http.post(urlBase, params);
      };

      listDataFactory.getListInformationByURL = function (owner_screen_name, slug) {
         // console.log("TURACO_DEBUG - AJAX REQUEST POST getListInformationByURL: " + urlBase + "\n params: " + owner_screen_name +" -- "+ slug);
         return $http.get(urlBase + "/list_users_by/" + owner_screen_name + "/" + slug);
      };

      listDataFactory.getListInformationByListId = function (listId) {
         // console.log("TURACO_DEBUG - AJAX REQUEST POST getListInformationByListId: " + urlBase + "\n params: " + listId);
         return $http.get(urlBase + "/list_users/" + listId);
      };

      listDataFactory.getListsByUser = function (screen_name) {
         // console.log("TURACO_DEBUG - AJAX REQUEST POST getListsByUser: " + urlBase + "\n params: " + screen_name);
         return $http.get(urlBase + "/byUser/" + screen_name);
      };

      listDataFactory.cloneList = function (list_id) {
         var params = {list_id: list_id};
         var _methodURL = urlBase + "/clone";
         // console.log("TURACO_DEBUG - AJAX REQUEST cloneList: " + _methodURL + "\n params: " + JSON.stringify(params));
         return $http.post(_methodURL, params);
      };

      listDataFactory.subscribeToList = function (list_id) {
         var params = {list_id: list_id};
         var _methodURL = urlBase + "/subscribe";
         // console.log("TURACO_DEBUG - AJAX REQUEST subscribeToList: " + _methodURL + "\n params: " + JSON.stringify(params));
         return $http.post(_methodURL, params);
      };

      listDataFactory.deleteListAndUnfollow = function (list) {
         var _methodURL = urlBase + "/and_unfollow/" + list.id ;
         // console.log("TURACO_DEBUG - AJAX REQUEST subscribeToList: " + _methodURL + "\n params: " + JSON.stringify(list));
         return $http.delete(_methodURL);
      };

      listDataFactory.unsubscribe = function (list_id) {
         var params = {list_id: list_id};
         var _methodURL = urlBase + "/unsubscribe";
         // console.log("TURACO_DEBUG - AJAX REQUEST unsubscribe: " + _methodURL + "\n params: " + JSON.stringify(params));
         return $http.post(_methodURL, params);
      };

      return listDataFactory;
   }]);
});
