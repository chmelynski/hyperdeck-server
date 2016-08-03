
Hyperdeck.Import = function() {
	
	var fileChooser = document.createElement('input');
	fileChooser.type = 'file';
	
	fileChooser.onchange = function() {
		
		var fileReader = new FileReader();
		
		fileReader.onload = function(event)
		{
			var text = event.target.result;
			
			$('#cells').children().remove();
			
			Hyperdeck.Components.Main(text);
			Hyperdeck.MarkClean();
		};
		
		if (fileChooser.files.length > 0)
		{
			var f = fileChooser.files[0];
			fileReader.readAsText(f);
		}
	};
	
	fileChooser.click();
};


