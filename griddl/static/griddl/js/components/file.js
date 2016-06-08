
(function() {

// should imgfiles add to #output automatically?

var File = function(json, type) {
	
	if (!json)
	{
		json = {};
		json.type = type;
		json.name = Griddl.Components.UniqueName(type, 1);
		json.visible = true;
		
		if (type == 'file')
		{
			json.data = 'data:text/plain;base64,';
			json.filename = json.name;
		}
		else if (type == 'jsfile')
		{
			json.data = 'data:text/javascript;base64,';
			json.filename = json.name + '.js';
		}
		else if (type == 'imgfile')
		{
			json.data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAERJREFUOE9j3LJlCwMMeHt7w9lbt24lKM4A1AwH/5EAMeIDqJlUpyKrZxiimomJElxeG8CoosjZQzSqKHI2RQE2NDUDAEVWy5NpqgO1AAAAAElFTkSuQmCC';
			json.filename = json.name + '.png';
		}
		else
		{
			throw new Error();
		}
	}
	
	this.type = json.type; // file, jsfile, imgfile
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	this.span = null;
	
	this._b64 = json.data;
	this._uint8array = Griddl.Components.Base64StringToUint8Array(this._b64.substr(this._b64.indexOf(','))); // data:application/binary;base64,
	
	this._filename = json.filename;
	
	Object.defineProperty(this, 'filename', { 
		get : function() {
			return this._filename;
		},
		set : function(value) {
			this._filename = value;
			this.filenameControl.updateDisplay();
			if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
		}
	});
	
	Object.defineProperty(this, 'b64', { 
		get : function() {
			return this._b64;
		},
		set : function(value) {
			this._b64 = value;
			this._uint8array = Griddl.Components.Base64StringToUint8Array(this._b64.substr(this._b64.indexOf(','))); // data:application/binary;base64,
			this.add();
			if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
		}
	});
	
	Object.defineProperty(this, 'uint8array', { 
		get : function() {
			return this._uint8array;
		},
		set : function(value) {
			this._uint8array = value;
			this._b64 = 'data:text/plain;base64,' + Griddl.Components.Uint8ArrayToBase64String(this._uint8array);
			this.add();
			if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
		}
	});
};
File.prototype.add = function() {
	
	this.div.html('');
	
	var gui = new dat.GUI({autoPlace:false});
	this.filenameControl = gui.add(this, 'filename');
	gui.add(this, 'download');
	gui.add(this, 'upload');
	this.div[0].appendChild(gui.domElement);
	
	//this.filenameSpan = $('<span></span>').text(this.uint8array.length); // a filename or something?  but we don't save the filename
	//this.div.append(this.filenameSpan);
	
	if (this.type == 'file')
	{
		this.span = $('<span style="margin:1em"></span>');
		this.span.text(this.uint8array.length.toString() + ' bytes'); // or we could do a hexdump or something
		this.div.append(this.span);
	}
	else if (this.type == 'jsfile')
	{
		// do we load now or some other time?
		$('#output').append($('<script></script>').text(atob(this.b64.substr(this.b64.indexOf(',')+1)))); // jQuery encodes the text
	}
	else if (this.type == 'imgfile')
	{
		var imgdiv = $('<div style="margin:1em;overflow:auto"></div>');
		var imageElement = $('<img src="' + this.b64 + '"></img>');
		imgdiv.append(imageElement);
		
		var dimensionDiv = $('<div style="margin:1em"></div>');
		dimensionDiv.text(imageElement[0].width + ' x ' + imageElement[0].height);
		
		this.div.append(dimensionDiv);
		this.div.append(imgdiv);
	}
	else
	{
		throw new Error();
	}
};
File.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.data = this.b64;
	json.filename = this.filename;
	return json;
};
File.prototype.upload = function() {
	
	var obj = this;
	
	var fileChooser = $(document.createElement('input'));
	fileChooser.attr('type', 'file');
	
	fileChooser.on('change', function() {
		
		var fileReader = new FileReader();
		
		fileReader.onload = function(event)
		{
			this.uint8array = new Uint8Array(arrayBuffer);
		};
		
		if (fileChooser[0].files.length > 0)
		{
			var f = fileChooser[0].files[0];
			obj.filename = f.name;
			fileReader.readAsArrayBuffer(f);
		}
	});
	
	fileChooser.click();
};
File.prototype.download = function() {
	var a = document.createElement('a');
	a.href = this.b64;
	
	var filename = null;
	
	if (this.filename.endsWith('.js'))
	{
		filename = this.filename.substring(0, this.filename.length - 3) + '.txt'; // chrome blocks downloading of js files
	}
	else
	{
		filename = this.filename;
	}
	
	a.download = filename;
	a.click();
};

File.prototype.getText = function() { return this.b64; };
File.prototype.setText = function(text) { this.b64 = text; };
File.prototype.getData = function() { return this.uint8array; };
File.prototype.setData = function(data) { this.uint8array = data; };

Griddl.Components.file = File;
Griddl.Components.jsfile = File;
Griddl.Components.imgfile = File;

})();

