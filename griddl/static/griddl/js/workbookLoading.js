
Hyperdeck.Components.UploadWorkbook = function() {
	
	var fileChooser = document.createElement('input');
	fileChooser.type = 'file';
	
	fileChooser.onchange = function() {
		
		var fileReader = new FileReader();
		
		fileReader.onload = function(event)
		{
			var text = event.target.result;
			
			$('#cells').children().remove();
			
			Hyperdeck.Components.Main(text);
			
			for (var i = 0; i < Hyperdeck.Components.objs.length; i++)
			{
				if (Hyperdeck.Components.objs[i].type == 'document')
				{
					Hyperdeck.Components.objs[i].generate();
					Hyperdeck.Components.MarkClean();
					return;
				}
			}
			
			Hyperdeck.Components.MarkClean();
		};
		
		if (fileChooser.files.length > 0)
		{
			var f = fileChooser.files[0];
			$('title').text(f.name.substring(0, f.name.lastIndexOf('.')));
			fileReader.readAsText(f);
		}
	};
	
	fileChooser.click();
};
Hyperdeck.Components.DownloadWorkbook = function() {

	var filename = $('title').text();
	var text = SaveToText();
	
	var downloadLink = document.createElement('a');
	downloadLink.href = window.URL.createObjectURL(new Blob([text], {type : 'text/plain'}));
	downloadLink.download = filename + '.json';
	downloadLink.click();
};

