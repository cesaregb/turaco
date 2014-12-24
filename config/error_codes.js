/**
 * New node file
 */

module.exports.error_codes = {
	BAD_URL_ERROR : {
		code : 0,
		message : 'Bad URL'
	}, 
	SERVICE_ERROR : {
		code : 0,
		message : 'Sorry there is a problem communicating with Twitter'
	}, 
	ACCESS_USER_ERROR : {
		code : 1,
		message : 'Access not granted, please login into the service'
	},
	USER_NOT_FOUND_ERROR : {
		code : 1,
		message : 'User not found on the database '
	},
	TWITTER_VERIFY_CREDENTIALS_ERROR : {
		code : 1,
		message : 'Problem verifying the users credentials on twitter'
	} 
};

function TuracoException(errorCode) {
   this.exception = errorCode;
}

module.exports.TuracoException = TuracoException;