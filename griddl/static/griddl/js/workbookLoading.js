
Griddl.Components.UploadWorkbook = function() {
	
	var fileChooser = document.createElement('input');
	fileChooser.type = 'file';
	
	fileChooser.onchange = function() {
		
		var fileReader = new FileReader();
		
		fileReader.onload = function(event)
		{
			var text = event.target.result;
			
			$('#cells').children().remove();
			
			Griddl.Components.Main(text);
			
			for (var i = 0; i < Griddl.Components.objs.length; i++)
			{
				if (Griddl.Components.objs[i].type == 'document')
				{
					Griddl.Components.objs[i].generate();
					Griddl.Components.MarkClean();
					return;
				}
			}
			
			Griddl.Components.MarkClean();
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
Griddl.Components.DownloadWorkbook = function() {

	var filename = $('title').text();
	var text = SaveToText();
	
	var downloadLink = document.createElement('a');
	downloadLink.href = window.URL.createObjectURL(new Blob([text], {type : 'text/plain'}));
	downloadLink.download = filename + '.json';
	downloadLink.click();
};

