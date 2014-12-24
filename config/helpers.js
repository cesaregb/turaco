/**
 * New node file
 */

helpers = {
	convertJson2List : function(list, item, uid){
		list.turaco_user_id = "";
		list.id = item.id;
		if (uid == list.user.id){
			list.own_list = true; 
		}else{
			list.own_list = false; 
		}
		list.name = item.name;
		list.member_count = item.member_count;
		list.mode = item.mode;
		list.description = item.description;
		list.full_name = item.full_name;
		list.user = {};
		list.user.id = item.user.id;
		list.uid = uid;
		list.user.name = item.user.name;
		list.user.screen_name = item.user.screen_name;
		list.active = 1;
		return list;
	},
	depracateExistingLists : function(List, uid){
	}
};

module.exports = helpers;