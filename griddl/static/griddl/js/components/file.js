
(function() {

var File = function(json, type, name) {
	
	if (!json)
	{
		json = {};
		json.type = type;
		json.name = name;
		json.visible = true;
		
		if (type == 'binaryfile')
		{
			json.data = 'data:text/plain;base64,';
			json.filename = json.name;
		}
		else if (type == 'textfile')
		{
			json.data = '';
			json.filename = json.name;
		}
		else if (type == 'jsfile')
		{
			json.data = '';
			json.filename = json.name + '.js';
		}
		else if (type == 'imgfile')
		{
			json.data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAERJREFUOE9j3LJlCwMMeHt7w9lbt24lKM4A1AwH/5EAMeIDqJlUpyKrZxiimomJElxeG8CoosjZQzSqKHI2RQE2NDUDAEVWy5NpqgO1AAAAAElFTkSuQmCC';
			json.filename = json.name + '.png';
		}
		else if (type == 'zipfile')
		{
			json.data = 'data:text/plain;base64,UEsDBAoAAAAAAHd+2EgAAAAAAAAAAAAAAAAHAAAAZm9vLnR4dFBLAQI/AAoAAAAAAHd+2EgAAAAAAAAAAAAAAAAHACQAAAAAAAAAIAAAAAAAAABmb28udHh0CgAgAAAAAAABABgAACFS1lHO0QEAIVLWUc7RAdqZSNZRztEBUEsFBgAAAAABAAEAWQAAACUAAAAAAA==';
			json.filename = json.name + '.zip';
		}
		else
		{
			throw new Error();
		}
	}
	
	this.type = json.type; // file, jsfile, imgfile, textfile, binaryfile
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	this.span = null;
	
	// for binary files, _b64 is null - the b64 property getter converts from uint8array on the fly
	// for text files, _uint8array is null, and just isn't used
	// _b64 holds the plain not-b64-encoded text of textfiles.  maybe we should change its name to _text 
	this._b64 = null;
	this._uint8array = null;
	
	if (this.type == 'binaryfile' || this.type == 'imgfile' || this.type == 'zipfile')
	{
		this._uint8array = Base64StringToUint8Array(json.data.substr(json.data.indexOf(','))); // data:text/plain;base64,
	}
	else if (this.type == 'textfile' || this.type == 'jsfile')
	{
		this._b64 = json.data;
	}
	
	this.files = null; // for zipfile only - { filename  : String , uint8array : Uint8Array , size : String }
	
	this.filenameControl = null;
	this._filename = json.filename;
	
	//this.ext = this._filename.substr(this._filename.lastIndexOf('.') + 1);
	Object.defineProperty(this, 'ext', { 
		get : function() {
			this._filename.substr(this._filename.lastIndexOf('.') + 1);
		},
	});
	
	Object.defineProperty(this, 'filename', { 
		get : function() {
			return this._filename;
		},
		set : function(value) {
			this._filename = value;
			this.filenameControl.updateDisplay();
			this.markDirty();
		}
	});
	
	Object.defineProperty(this, 'b64', { 
		get : function() {
			if (this.type == 'binaryfile' || this.type == 'imgfile' || this.type == 'zipfile')
			{
				return 'data:text/plain;base64,' + Uint8ArrayToBase64String(this._uint8array);
			}
			else if (this.type == 'textfile' || this.type == 'jsfile')
			{
				return this._b64;
			}
		},
		set : function(value) {
			
			if (this.type == 'binaryfile' || this.type == 'imgfile' || this.type == 'zipfile')
			{
				this._uint8array = Base64StringToUint8Array(value.substr(value.indexOf(','))); // data:text/plain;base64,
			}
			else if (this.type == 'textfile' || this.type == 'jsfile')
			{
				this._b64 = value;
			}
			
			this.add();
			this.markDirty();
		}
	});
	
	Object.defineProperty(this, 'uint8array', { 
		get : function() {
			return this._uint8array;
		},
		set : function(value) {
			this._uint8array = value;
			//this._b64 = 'data:text/plain;base64,' + Uint8ArrayToBase64String(this._uint8array);
			this.add();
			this.markDirty();
		}
	});
};
File.prototype.add = function() {
	
	var comp = this;
	
	this.div.html('');
	
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
	this.filenameControl = gui.add(this, 'filename');
	gui.add(this, 'download');
	gui.add(this, 'upload');
	this.div[0].appendChild(gui.domElement);
	
	//this.filenameSpan = $('<span></span>').text(this.uint8array.length); // a filename or something?  but we don't save the filename
	//this.div.append(this.filenameSpan);
	
	if (this.type == 'binaryfile')
	{
		this.span = $('<span style="margin:1em"></span>');
		this.span.text(this.uint8array.length.toString() + ' bytes'); // or we could do a hexdump or something
		this.div.append(this.span);
	}
	else if (this.type == 'textfile')
	{
		this.span = $('<span style="margin:1em"></span>');
		this.span.text(this.b64.length.toString() + ' chars');
		this.div.append(this.span);
	}
	else if (this.type == 'jsfile')
	{
		// do we load now or some other time?
		var b64 = this.b64;
		$('#output').append($('<script></script>').text(atob(b64.substr(b64.indexOf(',')+1)))); // jQuery encodes the text
	}
	else if (this.type == 'imgfile')
	{
		var imgdiv = $('<div style="margin:1em;overflow:auto"></div>');
		var imageElement = $('<img src="' + this.b64 + '"></img>');
		imgdiv.append(imageElement);
		
		var blob = new Blob([this._uint8array], {type: 'image/' + this.ext});
		var url = URL.createObjectURL(blob);
		var urlDiv = $('<div style="margin:1em"></div>');
		urlDiv.text('url: ' + url);
		
		var dimensionDiv = $('<div style="margin:1em"></div>');
		dimensionDiv.text(imageElement[0].width + ' x ' + imageElement[0].height);
		
		this.div.append(urlDiv);
		this.div.append(dimensionDiv);
		this.div.append(imgdiv);
	}
	else if (this.type == 'zipfile')
	{
		var zip = new JSZip(this.uint8array.buffer);
		
		this.files = []; // Proxy this
		
		for (var filename in zip.files)
		{
			if (!filename.endsWith('/'))
			{
				var file = zip.files[filename];
				//file.asArrayBuffer() => ArrayBuffer
				//file.asBinary() => String
				//file.asText() => String
				//file.asUint8Array() => Uint8Array
				
				var fileobj = {}; // Proxy this
				fileobj.filename = filename;
				fileobj.size = file._data.uncompressedSize.toString();
				fileobj.file = file;
				fileobj.text = null;
				fileobj.uint8array = null;
				
				fileobj.upload = function() {
					
					var fileChooser = $(document.createElement('input'));
					fileChooser.attr('type', 'file');
					
					fileChooser.on('change', function() {
						
						var fileReader = new FileReader();
						
						fileReader.onload = function(event)
						{
							var uint8array = new Uint8Array(event.target.result);
							fileobj.file = zip.file(fileobj.filename, uint8array); // or just add a uint8array to the fileobj
							fileobj.size = uint8array.length.toString();
							// refresh tablegui, somehow
						};
						
						if (fileChooser[0].files.length > 0)
						{
							var f = fileChooser[0].files[0];
							fileobj.filename = f.name;
							fileReader.readAsArrayBuffer(f);
						}
					});
					
					fileChooser.click();
				};
				fileobj.download = function() {
					
					var filename = null;
					
					if (this.filename.endsWith('.js'))
					{
						filename = this.filename.substring(0, this.filename.length - 3) + '.txt'; // chrome blocks downloading of js files
					}
					else
					{
						filename = this.filename;
					}
					
					var reader = new FileReader();
					reader.readAsDataURL(new Blob([this.file.asUint8Array()], {type:'text/plain'})); 
					reader.onloadend = function() {
						var a = document.createElement('a');
						a.href = reader.result;
						a.download = filename;
						a.click();
					};
				};
				
				this.files.push(fileobj);
			}
		}
		
		this.div.append($('<button>Upload File</button>').on('click', function() {
			
			var fileInput = document.createElement('input');
			fileInput.type = 'file';
			
			fileInput.onchange = function() {
				
				if (fileInput.files.length > 0)
				{
					var f = fileInput.files[0];
					
					var fileobj = {}; // Proxy?
					fileobj.filename = f.name;
					
					var fileReader = new FileReader();
					
					fileReader.onload = function(event)
					{
						fileobj.uint8array = new Uint8Array(event.target.result);
						fileobj.size = fileobj.uint8array.length.toString();
						comp.files.push(fileobj); // refresh tablegui, somehow
					};
					
					fileReader.readAsArrayBuffer(f);
				}
			};
			
			fileInput.click();
		}));
		
		var tablegui = new TableGui(this.files);
		//tablegui.add('upload', 'button', {header:''});
		tablegui.add('download', 'button', {header:''});
		tablegui.add('filename', 'text', {size:30});
		tablegui.add('size', 'label');
		this.div[0].appendChild(tablegui.table);
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
	
	var comp = this;
	
	var fileInput = document.createElement('input');
	fileInput.type = 'file';
	
	fileInput.onchange = function() {
		
		var fileReader = new FileReader();
		
		fileReader.onload = function(event)
		{
			if (comp.type == 'binaryfile' || comp.type == 'imgfile' || comp.type == 'zipfile')
			{
				comp.uint8array = new Uint8Array(event.target.result);
			}
			else if (comp.type == 'textfile' || comp.type == 'jsfile')
			{
				comp.b64 = event.target.result;
			}
		};
		
		if (fileInput.files.length > 0)
		{
			var f = fileInput.files[0];
			comp.filename = f.name;
			
			if (comp.type == 'binaryfile' || comp.type == 'imgfile' || comp.type == 'zipfile')
			{
				fileReader.readAsArrayBuffer(f);
			}
			else if (comp.type == 'textfile' || comp.type == 'jsfile')
			{
				fileReader.readAsText(f);
			}
		}
	};
	
	fileInput.click();
};
File.prototype.download = function() {
	
	var a = document.createElement('a');
	a.href = this.compile();
	
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
File.prototype.compile = function() {
	
	if (this.type == 'zipfile')
	{
		var zip = new JSZip();
		
		for (var i = 0; i < this.files.length; i++)
		{
			var fileobj = this.files[i];
			var uint8array = fileobj.uint8array ? fileobj.uint8array : fileobj.file.asUint8Array();
			zip.file(fileobj.filename, uint8array);
		}
		
		this.b64 = 'data:application/zip;base64,' + zip.generate();
	}
};

File.prototype.getText = function() { return this.b64; };
File.prototype.setText = function(text) { this.b64 = text; };
File.prototype.getData = function() {
	if (this.type == 'binaryfile' || this.type == 'imgfile' || this.type == 'zipfile')
	{
		return this.uint8array;
	}
	else if (this.type == 'textfile' || this.type == 'jsfile')
	{
		return this.b64;
	}
};
File.prototype.setData = function(data) {
	if (this.type == 'binaryfile' || this.type == 'imgfile' || this.type == 'zipfile')
	{
		this.uint8array = data;
	}
	else if (this.type == 'textfile' || this.type == 'jsfile')
	{
		this.b64 = data;
	}
};

function Base64StringToUint8Array(str) {
	
	function b64ToUint6(n) { return n>64&&n<91?n-65:n>96&&n<123?n-71:n>47&&n<58?n+4:n===43?62:n===47?63:0;}
	
	var nBlocksSize = 3;
	var sB64Enc = str.replace(/[^A-Za-z0-9\+\/]/g, ""); // remove all non-eligible characters from the string
	var nInLen = sB64Enc.length;
	var nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2;
	var taBytes = new Uint8Array(nOutLen);
	
	for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++)
	{
		nMod4 = nInIdx & 3;
		nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
		
		if (nMod4 === 3 || nInLen - nInIdx === 1)
		{
			for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++)
			{
				taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
			}
			
			nUint24 = 0;
		}
	}
	
	return taBytes;
}
function Uint8ArrayToBase64String(uint8array) {
	var nMod3 = '';
	var sB64Enc = '';
	
	function uint6ToB64(n) { return n<26?n+65:n<52?n+71:n<62?n-4:n===62?43:n===63?47:65;}
	
	for (var nLen = uint8array.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++)
	{
		nMod3 = nIdx % 3;
		//if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
		nUint24 |= uint8array[nIdx] << (16 >>> nMod3 & 24);
		
		if (nMod3 === 2 || uint8array.length - nIdx === 1)
		{
			var a = uint6ToB64(nUint24 >>> 18 & 63);
			var b = uint6ToB64(nUint24 >>> 12 & 63);
			var c = uint6ToB64(nUint24 >>>  6 & 63);
			var d = uint6ToB64(nUint24 >>>  0 & 63);
			sB64Enc += String.fromCharCode(a, b, c, d);
			nUint24 = 0;
		}
	}
	
	return sB64Enc.replace(/A(?=A$|$)/g, "=");
}

Hyperdeck.Components.binaryfile = File;
Hyperdeck.Components.textfile = File;
Hyperdeck.Components.jsfile = File;
Hyperdeck.Components.imgfile = File;
Hyperdeck.Components.zipfile = File;

})();

