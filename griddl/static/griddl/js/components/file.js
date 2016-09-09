
// files need to be able to be linked, and processed in the reciepient
// which means that a lot of this code will need to be visible to link.js - probably will need to abstract some of it into util functions

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
	
	this._type = json.type; // file, jsfile, imgfile, textfile, binaryfile
	this._name = json.name;
	this._visible = json.visible;
	
	this._div = null;
	this._span = null;
	
	// _b64 holds the plain not-b64-encoded text of textfiles.  maybe we should change its name to _text 
	this._text = null; // only used for text files
	this._uint8array = null; // only used for binary files
	
	if (this._type == 'binaryfile' || this._type == 'imgfile' || this._type == 'zipfile')
	{
		this._uint8array = Base64StringToUint8Array(json.data.substr(json.data.indexOf(','))); // data:text/plain;base64,
	}
	else if (this._type == 'textfile' || this._type == 'jsfile')
	{
		this._text = json.data;
	}
	
	this._files = null; // for zipfile only - { filename  : String , uint8array : Uint8Array , size : String }
	
	this._filenameControl = null;
	this._filename = json.filename;
	
	Object.defineProperty(this, 'filename', {
		get : function() { return this._filename; },
		set : function (value) { this._filename = value; }
	});
	
	Object.defineProperty(this, 'upload', {
		get : function() { return this._upload; }
	});
	
	Object.defineProperty(this, 'download', {
		get : function() { return this._download; }
	});
	
	// var b64 = 'data:text/plain;base64,' + Uint8ArrayToBase64String(this._uint8array);
	// var uint8array = Base64StringToUint8Array(this._text.substr(this._text.indexOf(','))); // data:text/plain;base64,
};
File.prototype._add = function() {
	
	var comp = this;
	
	comp._div.html('');
	
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
	comp._filenameControl = gui.add(comp, 'filename');
	gui.add(comp, 'download');
	gui.add(comp, 'upload');
	comp._div[0].appendChild(gui.domElement);
	
	//comp._filenameSpan = $('<span></span>').text(comp._uint8array.length); // a filename or something?  but we don't save the filename
	//comp._div.append(comp._filenameSpan);
	
	if (comp._type == 'binaryfile')
	{
		comp._span = $('<span style="margin:1em"></span>');
		comp._span.text(comp._uint8array.length.toString() + ' bytes'); // or we could do a hexdump or something
		comp._div.append(comp._span);
	}
	else if (comp._type == 'textfile')
	{
		comp._span = $('<span style="margin:1em"></span>');
		comp._span.text(comp._text.length.toString() + ' chars');
		comp._div.append(comp._span);
	}
	else if (comp._type == 'jsfile')
	{
		// do we load now or some other time?
		var text = atob(comp._text);
		$('#output').append($('<script></script>').text(text)); // jQuery encodes the text
	}
	else if (comp._type == 'imgfile')
	{
		var ext = comp._filename.substr(comp._filename.lastIndexOf('.') + 1);
		
		// can we do the b64 conversion using the Blob below?
		var b64 = 'data:image/' + ext + ';base64,' + Uint8ArrayToBase64String(comp._uint8array);
		
		var imgdiv = $('<div style="margin:1em;overflow:auto"></div>');
		var imageElement = $('<img src="' + b64 + '"></img>');
		imgdiv.append(imageElement);
		
		var blob = new Blob([comp._uint8array], {type: 'image/' + ext});
		var url = URL.createObjectURL(blob);
		var urlDiv = $('<div style="margin:1em"></div>');
		urlDiv.text('url: ' + url);
		
		var dimensionDiv = $('<div style="margin:1em"></div>');
		dimensionDiv.text(imageElement[0].width + ' x ' + imageElement[0].height);
		
		comp._div.append(urlDiv);
		comp._div.append(dimensionDiv);
		comp._div.append(imgdiv);
	}
	else if (comp._type == 'zipfile')
	{
		var zip = new JSZip(comp._uint8array.buffer);
		
		comp._files = []; // Proxy this
		
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
				
				comp._files.push(fileobj);
			}
		}
		
		comp._div.append($('<button>Upload File</button>').on('click', function() {
			
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
						comp._files.push(fileobj); // refresh tablegui, somehow
					};
					
					fileReader.readAsArrayBuffer(f);
				}
			};
			
			fileInput.click();
		}));
		
		var tablegui = new TableGui(comp._files);
		//tablegui.add('upload', 'button', {header:''});
		tablegui.add('download', 'button', {header:''});
		tablegui.add('filename', 'text', {size:30});
		tablegui.add('size', 'label');
		comp._div[0].appendChild(tablegui.table);
	}
	else
	{
		throw new Error();
	}
};
File.prototype._write = function() {
	
	var comp = this;
	
	var json = {};
	json.type = comp._type;
	json.name = comp._name;
	json.visible = comp._visible;
	
	var text = null;
	
	if (comp._type == 'binaryfile' || comp._type == 'imgfile' || comp._type == 'zipfile')
	{
		text = 'data:text/plain;base64,' + Uint8ArrayToBase64String(comp._uint8array);
	}
	else if (comp._type == 'textfile' || comp._type == 'jsfile')
	{
		text = comp._text;
	}
	
	json.data = text;
	json.filename = comp._filename;
	return json;
};
File.prototype._upload = function() {
	
	var comp = this;
	
	var fileInput = document.createElement('input');
	fileInput.type = 'file';
	
	fileInput.onchange = function() {
		
		var fileReader = new FileReader();
		
		fileReader.onload = function(event)
		{
			if (comp._type == 'binaryfile' || comp._type == 'imgfile' || comp._type == 'zipfile')
			{
				comp._uint8array = new Uint8Array(event.target.result);
			}
			else if (comp._type == 'textfile' || comp._type == 'jsfile')
			{
				comp._text = event.target.result;
			}
			
			comp._add();
		};
		
		if (fileInput.files.length > 0)
		{
			var f = fileInput.files[0];
			comp._filename = f.name;
			comp._filenameControl.updateDisplay();
			comp._markDirty();
			
			if (comp._type == 'binaryfile' || comp._type == 'imgfile' || comp._type == 'zipfile')
			{
				fileReader.readAsArrayBuffer(f);
			}
			else if (comp._type == 'textfile' || comp._type == 'jsfile')
			{
				fileReader.readAsText(f);
			}
		}
	};
	
	fileInput.click();
};
File.prototype._download = function() {
	
	var comp = this;
	
	var a = document.createElement('a');
	a.href = comp._compile();
	
	var filename = null;
	
	if (comp._filename.endsWith('.js'))
	{
		filename = comp._filename.substring(0, comp._filename.length - 3) + '.txt'; // chrome blocks downloading of js files
	}
	else
	{
		filename = comp._filename;
	}
	
	a.download = filename;
	a.click();
};
File.prototype._compile = function() {
	
	var comp = this;
	
	if (comp._type == 'zipfile')
	{
		var zip = new JSZip();
		
		for (var i = 0; i < comp._files.length; i++)
		{
			var fileobj = comp._files[i];
			var uint8array = fileobj.uint8array ? fileobj.uint8array : fileobj.file.asUint8Array();
			zip.file(fileobj.filename, uint8array);
		}
		
		comp._text = 'data:application/zip;base64,' + zip.generate();
	}
};

File.prototype._get = function(options) {
	
	var comp = this;
	
	var result = null;
	
	if (options && options.format)
	{
		// we need to put in explicit conversions from uint8array to b64 when needed below
		throw new Error();
		
		if (options.format == 'text')
		{
			result = comp._text;
		}
		else if (options.format == 'base64')
		{
			if (comp._type == 'binaryfile' || comp._type == 'imgfile' || comp._type == 'zipfile')
			{
				result = comp._text;
			}
			else if (comp._type == 'textfile' || comp._type == 'jsfile')
			{
				throw new Error('Unsupported format: components of type "' + comp._type + '" only support the "text" format.');
			}
		}
		else if (options.format == 'uint8array')
		{
			if (comp._type == 'binaryfile' || comp._type == 'imgfile' || comp._type == 'zipfile')
			{
				result = comp._uint8array;
			}
			else if (comp._type == 'textfile' || comp._type == 'jsfile')
			{
				throw new Error('Unsupported format: components of type "' + comp._type + '" only support the "text" format.');
			}
		}
		else
		{
			throw new Error('Unsupported format: "' + options.format + '".  Supported formats are "text", "base64", or "uint8array".');
		}
	}
	else
	{
		if (comp._type == 'binaryfile' || comp._type == 'imgfile' || comp._type == 'zipfile')
		{
			result = comp._uint8array;
		}
		else if (comp._type == 'textfile' || comp._type == 'jsfile')
		{
			result = comp._text;
		}
	}
	
	return result;
};
File.prototype._set = function(data, options) {
	
	var comp = this;
	
	if (options && options.format)
	{
		// we need to put in explicit conversions from b64 to uint8array when needed below
		throw new Error();
		
		if (options.format == 'text')
		{
			comp._text = data;
		}
		else if (options.format == 'base64')
		{
			if (comp._type == 'binaryfile' || comp._type == 'imgfile' || comp._type == 'zipfile')
			{
				comp._text = data;
			}
			else if (comp._type == 'textfile' || comp._type == 'jsfile')
			{
				throw new Error('Unsupported format: components of type "' + comp._type + '" only support the "text" format.');
			}
		}
		else if (options.format == 'uint8array')
		{
			if (comp._type == 'binaryfile' || comp._type == 'imgfile' || comp._type == 'zipfile')
			{
				comp._uint8array = data;
			}
			else if (comp._type == 'textfile' || comp._type == 'jsfile')
			{
				throw new Error('Unsupported format: components of type "' + comp._type + '" only support the "text" format.');
			}
		}
		else
		{
			throw new Error('Unsupported format: "' + options.format + '".  Supported formats are "text", "base64", or "uint8array".');
		}
	}
	else
	{
		// should check 'data' to make sure it's the correct format
		if (comp._type == 'binaryfile' || comp._type == 'imgfile' || comp._type == 'zipfile')
		{
			comp._uint8array = data;
		}
		else if (comp._type == 'textfile' || comp._type == 'jsfile')
		{
			comp._text = data;
		}
	}
	
	comp._add();
	comp._markDirty();
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

