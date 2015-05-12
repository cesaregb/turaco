/**
 * New node file
 */

module.exports.error_codes = {
	BAD_URL_ERROR : {
		code : 0,
		message : 'Bad URL'
	}, 
	SERVICE_ERROR : {
		code : 1,
		message : 'Sorry there is a problem communicating with Twitter'
	}, 
	ACCESS_USER_ERROR : {
		code : 2,
		message : 'Access not granted, please login into the service'
	},
	USER_NOT_FOUND_ERROR : {
		code : 3,
		message : 'User not found on the database '
	},
	TWITTER_VERIFY_CREDENTIALS_ERROR : {
		code : 4,
		message : 'Problem verifying the users credentials on twitter'
	},
	USER_NOT_LOGED : {
		code : 5,
		message : 'User not loged'
	},
	DATA_LOADING : {
		code : 6,
		message : 'Twitter information is being loaded'
	},
	GENERIC_ERROR : {
		code : 7,
		message : 'There is a error with Turaco Server, we are working on it. Sorry'
	} 
};

function TuracoException(errorCode) {
   this.exception = errorCode;
}

module.exports.TuracoException = TuracoException;