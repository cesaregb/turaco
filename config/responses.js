/**
 * New node file
 */
var TYPE_SUCCESS = "SUCCESS";
var TYPE_ERROR = "ERROR";
var TYPE_INFO = "INFO";

function JsonResponse() {
	if (!(this instanceof JsonResponse)) return new JsonResponse();
}

JsonResponse.prototype.body = {
	type:TYPE_SUCCESS,
	message:""
};

module.exports = JsonResponse;

JsonResponse.prototype.init = function (){
	this.body.type = TYPE_SUCCESS;
	this.body.message = "";
	this.body.data = null;
}

JsonResponse.prototype.success = function (_data){
	console.log("TURACO_DEBUG - RESPONSE success: ");
	this.init();
	this.body.type = TYPE_SUCCESS;
	this.body.message = TYPE_SUCCESS;
	this.body.data = _data;
	return this.body;
}

JsonResponse.prototype.string_success = function (_message){
	console.log("TURACO_DEBUG - RESPONSE success: " + _message);
	this.init();
	this.body.type = TYPE_SUCCESS;
	this.body.message = _message;
	return this.body;
}

JsonResponse.prototype.error = function (_code, err){
	console.log("TURACO_DEBUG - RESPONSE error: " + err);
	this.init();
	if( Object.prototype.toString.call( _code ) === '[object Object]' ) {
		this.body.type = TYPE_ERROR;
		this.body.message = _code.message;
	}else{
		this.body.type = TYPE_ERROR;
		this.body.message = _code;
		
	}
	this.body.err_data = err;
	return this.body;
}

JsonResponse.prototype.string_error = function (_message){
	console.log("TURACO_DEBUG - RESPONSE error: " + _message);
	this.init();
	this.body.type = TYPE_ERROR;
	this.body.message = _message;
	return this.body;
}

JsonResponse.prototype.info = function (_message){
	this.init();
	this.body.type = TYPE_INFO;
	this.body.message = _message;
	return this.body;
}



