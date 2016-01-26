var express = require('express');
var router = express.Router();
var fileName = "turacoApi.js";
var pathString = "/api/services";

/*
 * SESSION VARIABLES... 
 * session for lists 
 * 		session.user_lists
 * */
function removeListSession(session){
	session.user_lists = null;
}
function removeUserSession(session){
	
}
/*
 * Get user from the turao system...  
 * */
router.put('/removeSessions/:param', function(req, res){
	var param = req.params.param;
	if (param == "1"){// remove session for lists 
		removeListSession(req.session);
	}
	if (param == "2"){// remove session for user 
		removeUserSession(req.session);
	}
	if (param == "3"){// remove session for lists and users  
		removeListSession(req.session);
		removeUserSession(req.session);
		
	}
	var screen_name = req.params.screen_name;
});


module.exports = router;
