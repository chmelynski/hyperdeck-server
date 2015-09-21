
var Griddl = (function() {

var Griddl = {};

Griddl.Main = function() {
	var text = $('#frce').text();
	//$('#cells').remove();
	var textarea = $(document.createElement('textarea'));
	textarea.text(text);
	$('#cells').append(textarea);
	//$('#frce').append(textarea);
	//$('#frce').css('display', 'block');
	//$('#frce').css('position', 'absolute');
	//$('#frce').css('left', '3em');
	//$('#frce').css('top', '5em');
	textarea.css('width', '40em');
	textarea.css('height', '40em');
};

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

Griddl.IO = (function() {

var IO = {};

IO.DownloadWorkbook = function() {

	var filename = $('title').text();
	var text = $('textarea')[0].value;
	
	var downloadLink = document.createElement('a');
	var url = (window.webkitURL != null ? window.webkitURL : window.URL);
	downloadLink.href = url.createObjectURL(new Blob([text], {type : 'text/plain'}));
	downloadLink.download = filename + '.txt';
	downloadLink.click();
}
IO.UploadWorkbook = function() {
	var fileChooser = document.getElementById('fileChooser');
	fileChooser.click();
}
IO.HandleLocalLoad = function(files) {
	
	var fileReader = new FileReader();
	
	fileReader.onload = function(event)
	{
		var text = event.target.result;
		
		// dummy version that just diplays the workbook in a textarea
		$('#cells').remove();
		var textarea = $(document.createElement('textarea'));
		textarea.text(text);
		$('#frce').append(textarea);
		$('#frce').css('display', 'block');
		$('#frce').css('position', 'absolute');
		$('#frce').css('left', '3em');
		$('#frce').css('top', '5em');
		textarea.css('width', '40em');
		textarea.css('height', '50em');
	};
	
	if (files.length > 0)
	{
		var f = files[0];
		$('title').text(f.name.substr(0, f.name.length - 4));
		fileReader.readAsText(f);
	}
}

return IO;

})();

return Griddl;

})();

