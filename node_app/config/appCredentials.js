local = {
	'CALLBACK_URL' : "http://127.0.0.1:3000/auth/twitter/callback",
	'TWITTER_CONSUMER_KEY' : 'eoMbdx3bXreTbKT73RKcNRIpZ',
	'TWITTER_CONSUMER_SECRET' : 'lfWM1zmnTxT80Fe6hzSGATjErLDwUIfGixfbp9lzbJBdGFICKs'
};

docker = {
	'CALLBACK_URL' : "http://192.168.99.100:3000/auth/twitter/callback",
	'TWITTER_CONSUMER_KEY' : 'eoMbdx3bXreTbKT73RKcNRIpZ',
	'TWITTER_CONSUMER_SECRET' : 'lfWM1zmnTxT80Fe6hzSGATjErLDwUIfGixfbp9lzbJBdGFICKs'
};

prod = {
	'CALLBACK_URL' : "http://turacoapp.com/auth/twitter/callback",
	'TWITTER_CONSUMER_KEY' : 'eoMbdx3bXreTbKT73RKcNRIpZ',
	'TWITTER_CONSUMER_SECRET' : 'lfWM1zmnTxT80Fe6hzSGATjErLDwUIfGixfbp9lzbJBdGFICKs'
};

module.exports = docker;

/*
#!/bin/sh
echo "Exporting variables... "
export CALLBACK_URL=http://127.0.0.1:3000/auth/twitter/callback
export TWITTER_CONSUMER_KEY=eoMbdx3bXreTbKT73RKcNRIpZ
export TWITTER_CONSUMER_SECRET=lfWM1zmnTxT80Fe6hzSGATjErLDwUIfGixfbp9lzbJBdGFICKs
echo "Export complete"

source ./myscript.sh
*/

/*
setx CALLBACK_URL http://127.0.0.1:3000/auth/twitter/callback
setx TWITTER_CONSUMER_KEY eoMbdx3bXreTbKT73RKcNRIpZ
setx TWITTER_CONSUMER_SECRET lfWM1zmnTxT80Fe6hzSGATjErLDwUIfGixfbp9lzbJBdGFICKs

source ./myscript.bat
 */


/*
 * session.user_lists 			= []
 *	all the users that are in lists!!
 * session.usersListHash 		= {lists: []}
 * session.completeListsObject 	= { [hash<uid, boolean>] }
 * session.friends 				= {friends_count, users: []}
 * global.refresSessionObject	= true||false
 * global.savedSearches			= []
 * */

/*
 *
db.sessionobjects.find();
db.sessionobjects.find({'completeListsObject.lists.name':"Test", 'completeListsObject.lists.list_users.screen_name':"Trevornoah"}, {"completeListsObject.lists.$" : 1});
db.sessionobjects.find({'completeListsObject.lists.name':"Test"}, {"completeListsObject.lists.$" : 1});
db.sessionobjects.find({'friends.users.screen_name':"Shevlis"}, {"friends.users.$" : 1});
db.sessionobjects.find({"friends.complete_users": {$exists : "13348"}}, {"friends.complete_users" : 1});
var myCursor = db.sessionobjects.find(null, {"friends.complete_users" : 1});
var myDocument = myCursor.hasNext() ? myCursor.next() : null;
if (myDocument) {
    var hashedList = myDocument.friends.complete_users;
    for (var i in hashedList) {
        if (hashedList.hasOwnProperty(i) && hashedList[i].screen_name == "VivirGDL" ) {
        if (hashedList.hasOwnProperty(i) && i == "13348" ) {
            print(i + " == " + tojson(hashedList[i]));
        }
    }
}
 **/
