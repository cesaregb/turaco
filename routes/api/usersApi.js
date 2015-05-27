var express = require('express');
var router = express.Router();
var handler = require('./usersHandlers');
var fileName = "usersApi.js";
var pathString = "/api/users";

router.get('/', handler.getUserFromSession);

router.get('/by_user/:uid', handler.getTwitterUser);

router.get('/friends_list', handler.getAllFriends);

router.get('/search_user/:search', handler.searchUser);

router.get('/trending/place/:id', handler.getTrendsPlace);

router.get('/trending/place/:lat/:long', handler.getTrendsClosest);

router.get('/saved_searches', handler.getSavedSearches);

router.get('/trends_available', handler.getTrendsAvailable);

router.get('/check_user_loading', handler.checkLoadingStatus);

module.exports = router;
