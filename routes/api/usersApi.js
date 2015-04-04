var express = require('express');
var router = express.Router();
var handler = require('./usersHandlers');
var fileName = "usersApi.js";
var pathString = "/api/users";

/*
 * Get logged user from the turao system...  
 * */
router.get('/', handler.getUserFromSession);

/*
 * Get user from the turao system...  
 * */
router.get('/by_user/:uid', handler.getTwitterUser);

/*
 * GET ALL THE "FOLLOW" BY ID
 * */
router.get('/friends_list', handler.getAllFriends);

/*
 * GET ALL THE FRIENDS FILTERED. 
 * */
router.get('/friends_list/:filter', handler.getFilteredFriends);

/*
 * Search from the users.... 
 * */
router.get('/search_user/:search', handler.searchUser);


/*
 * Search from the users.... 
 * */
router.get('/trending/place/:id', handler.getTrendsPlace);

/*
 * Search from the users.... 
 * */
router.get('/trending/place/:lat/:long', handler.getTrendsClosest);

/*
 * Search from the users.... 
 * */
router.get('/saved_searches', handler.getSavedSearches);

/*
 * Search from the users.... 
 * */
router.get('/trends_available', handler.getTrendsAvailable);

module.exports = router;
