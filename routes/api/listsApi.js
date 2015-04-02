var express = require('express');
var router = express.Router();
var handler = require('./listsHandlers');
var fileName = "listApi.js";
var pathString = "/api/lists";

/*
 * GET the lists by the scren_name sended 
 * */
router.get('/byUser/:screen_name', handler.getListByUser);
/*
 * GET the lists of the logged user
 * */
router.get('/', handler.getUsersListFunction);

/*
 * CREATE a list
 * */
router.put('/', handler.createList);

/*
 * Delete a list 
 * */
router.delete('/:list_id', handler.deleteList);

/*
 * Delete a list and unfollow all the users from that list. 
 * */
router.delete('/and_unfollow', handler.deleteAndUnfollow);

/*
 * UPDATE an existing list 
 * */
router.post('/', handler.updateList);

/*
 * Subscribe to a list 
 * add user to an existing list, not owned by the logged user 
 * */
router.post('/subscribe', handler.subscribe);

/*
 * Un-Subscribe to a list 
 * */
router.post('/unsubscribe', handler.unsubscribe);

/*
 * Get subscriptions  
 * */
router.get('/subscriptions', handler.getSubscriptions);

/*
 * Clone and follow the users from the list
 * */
router.post('/clone', handler.cloneList);

/*
 * Clone but no following  
 * */
router.post('/clone/no_follow', handler.cloneNoFollow);

/*
 * Add members to a list (comma separated members...)    
 * */
router.post('/members_create_all' , handler.membersCreateAll);

/*
 * Destroy members to a list (comma separated members...)    
 * */
router.post('/members_destroy_all' , handler.membersDestroyAll);

/*
 *  get users of the lists_id 
 * */
router.get('/list_users/:list_id', handler.getListUsers);


module.exports = router;
