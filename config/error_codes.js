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
		message : 'User session expired, please refresh your browser.'
	},
	MALFORMED_USER_DATA : {
		code : 5,
		message : 'Your session seams to be broken, let us load it again.'
	},
	DATA_LOADING : {
		code : 6,
		message : 'Turaco is loading your information from Twitter. This may take time please give us a few seconds.'
	},
	GENERIC_ERROR : {
		code : 7,
		message : 'There is a error with Turaco Server, we are working on it. Sorry'
	}, 
	ACCOUNT_NOT_SUPPORTED_1 : {
		code : 8,
		message : 'This account is not following any account, we cannot handle this user by the moment.'
	}, 
	PROBLEM_LOADING_TWITTER_INFO : {
		code : 6,
		message : 'We had problems loading your twitter information, let us try again..'
	} 
};

function TuracoException(errorCode) {
   this.exception = errorCode;
}

module.exports.TuracoException = TuracoException;