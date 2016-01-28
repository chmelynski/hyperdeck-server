
if (typeof Griddl === 'undefined') { var Griddl = {}; }

Griddl.UI = (function() {

// abstract these into ShowModal('saveAs')/HideModal('saveAs')
function ShowSaveAsModal() {
	$('#saveAsScreen').css('display', 'block');
	$('#saveAsDialog').css('display', 'block');
}
function HideSaveAsModal() {
	$('#saveAsScreen').css('display', 'none');
	$('#saveAsDialog').css('display', 'none');
}
function ShowLoginModal() {
	$('#loginScreen').css('display', 'block');
	$('#loginDialog').css('display', 'block');
}
function HideLoginModal() {
	$('#loginScreen').css('display', 'none');
	$('#loginDialog').css('display', 'none');
}
function SubmitLoginForm() {
	
	var form = $('#loginForm');
	
	$.ajax({
		type: form.attr('method'), // form.attr('method') = 'POST'
		url: form.attr('action'), // form.attr('action') = '/login?next=/saveasForm' the next url is so that the server returns a new saveasForm with a new csrf token
		data: form.serialize(),
		success: function (data) {
			AjaxSuccess(data);
		},
		error: function(data) {
			AjaxFailure(form, data);
		}
	});
}
function SubmitSignupForm() {
	
	var form = $('#loginForm');
	
	$.ajax({
		type: 'POST',
		url: '/ajaxjoin',
		data: form.serialize(),
		success: function (data) {
			AjaxSuccess(data);
		},
		error: function(data) {
			AjaxFailure(form, data);
		}
	});
}

var UI = {};
UI.ShowSaveAsModal = ShowSaveAsModal;
UI.HideSaveAsModal = HideSaveAsModal;
UI.ShowLoginModal = ShowLoginModal;
UI.HideLoginModal = HideLoginModal;
UI.SubmitLoginForm = SubmitLoginForm;
UI.SubmitSignupForm = SubmitSignupForm;
return UI;

})();


