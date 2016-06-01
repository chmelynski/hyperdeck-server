
(function() {

var File = function(json) {
	
	if (!json)
	{
		json = {};
		json.type = 'file';
		json.name = Griddl.Components.UniqueName('file', 1);
		json.visible = true;
		json.data = 'data:text/plain;base64,AAAA';
	}
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.ext = '';
	
	this.div = null;
	this.span = null;
	
	this._b64 = json.data;
	this._uint8array = Griddl.Components.Base64StringToUint8Array(this._b64.substr(this._b64.indexOf(','))); // data:application/binary;base64,
	
	Object.defineProperty(this, 'b64', { 
		get : function() {
			return this._b64;
		},
		set : function(value) {
			this._b64 = value;
			this._uint8array = Griddl.Components.Base64StringToUint8Array(this._b64.substr(this._b64.indexOf(','))); // data:application/binary;base64,
			this.span.text(this._uint8array.length);
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
			this.span.text(this._uint8array.length);
			if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
		}
	});
};
File.prototype.add = function() {
	
	this.div.html('');
	
	this.span = $('<span></span>');
	this.span.text(this.uint8array.length); // or we could do a hexdump or something
	this.div.append(this.span);
	
	var gui = new dat.GUI({autoPlace:false});
	gui.add(this, 'download');
	gui.add(this, 'upload');
	this.div[0].appendChild(gui.domElement);
};
File.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.data = this.b64;
	return json;
};

File.prototype.upload = Griddl.Components.Upload;
File.prototype.download = Griddl.Components.Download;
File.prototype.setArrayBuffer = function(arrayBuffer) { this.uint8array = new Uint8Array(arrayBuffer); };
File.prototype.setExt = function(ext) { this.ext = ext; };
File.prototype.getHref = function() { return this.b64; };

Griddl.Components.file = File;

})();

