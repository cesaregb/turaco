var express = require('express');
var router = express.Router();
var handler = require('./listsHandlers');
var fileName = "listApi.js";
var pathString = "/api/lists";

router.get('/byUser/:screen_name', handler.getListByUser);
router.get('/', handler.getUsersListFunction);

router.put('/', handler.createList);

router.delete('/:list_id', handler.deleteList);

router.post('/', handler.updateList);

router.post('/subscribe', handler.subscribe);

router.post('/unsubscribe', handler.unsubscribe);

router.get('/subscriptions', handler.getSubscriptions);

router.post('/members_create_all' , handler.membersCreateAll); 

router.post('/members_destroy_all' , handler.membersDestroyAll);

router.get('/list_users/:list_id', handler.getListUsers);

router.get('/list_users_by/:owner_screen_name/:slug', handler.getListInformation);

module.exports = router;
