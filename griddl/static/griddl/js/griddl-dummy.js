
var Griddl = (function() {

var Griddl = {};

Griddl.Main = function() {
	
};


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

