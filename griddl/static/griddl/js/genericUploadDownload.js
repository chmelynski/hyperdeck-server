
// we can use this as a generic upload function, but the component needs a setArrayBuffer or setText function, and an optional setExt
Griddl.Components.Upload = function() {
	
	// interface required:
	//  obj.setArrayBuffer
	//    OR
	//  obj.setText
	
	// and optionally obj.setExt to set the extension (useful for images and fonts, for instance)
	
	// we also want drag-n-drop
	
	var obj = this;
	
	var fileChooser = $(document.createElement('input'));
	fileChooser.attr('type', 'file');
	
	fileChooser.on('change', function() {
		
		var fileReader = new FileReader();
		
		fileReader.onload = function(event)
		{
			if (obj.setArrayBuffer)
			{
				obj.setArrayBuffer(event.target.result);
			}
			else if (obj.setText)
			{
				obj.setText(event.target.result);
			}
		};
		
		if (fileChooser[0].files.length > 0)
		{
			var f = fileChooser[0].files[0];
			
			if (obj.setExt) { obj.setExt(f.name.substring(f.name.lastIndexOf('.') + 1)); }
			
			if (obj.setArrayBuffer)
			{
				fileReader.readAsArrayBuffer(f);
			}
			else if (obj.setText)
			{
				fileReader.readAsText(f);
			}
		}
	});
	
	fileChooser.click();
};
Griddl.Components.Download = function() {
	var a = document.createElement('a');
	a.href = this.getHref();
	a.download = this.name + (this.ext ? '.' : '') + this.ext;
	a.click();
};

