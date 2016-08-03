
Hyperdeck.Export = function() {

	var filename = $('#workbookName').text();
	var text = Hyperdeck.Components.SaveToText();
	
	var downloadLink = document.createElement('a');
	downloadLink.href = window.URL.createObjectURL(new Blob([text], {type : 'text/plain'}));
	downloadLink.download = filename + '.hyp';
	downloadLink.click();
};

