function init(){
	$.ajax({
	      url: '/api/users/set_device_session',
	      dataType : "json",
	      method: "POST",
	      data : {windowsSize: $(this).width()}
	   }).done(function(jsonResponse){
	      console.log("TURACO_DEBUG - we should have saved the session ");
	   }).fail(function() {

	   });
}

init();
