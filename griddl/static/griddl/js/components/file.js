
(function() {

var File = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	
	this.b64 = null;
	this.uint8array = null;
	
	this.ext = '';
	this.uploadDownload = true;
	
	this.load(json.data);
};
File.prototype.add = function() {
	this.div = CreateComponentDiv($('#cells'), this);
	this.refresh();
};
File.prototype.refresh = function() {
	this.div.html('');
	this.div.text(this.uint8array.length); // or we could do a hexdump or something
};
File.prototype.datauri = function() {
	return this.b64;
};
File.prototype.getData = function() {
	return this.uint8array;
};
File.prototype.setData = function(uint8array) {
	this.uint8array = uint8array;
	this.b64 = 'data:text/plain;base64,' + Uint8ArrayToBase64String(this.uint8array);
	this.refresh();
};
File.prototype.setArrayBuffer = function(arrayBuffer) {
	this.setData(new Uint8Array(arrayBuffer));
};
File.prototype.load = function(lines) {
	
	// new -> constructor -> load -> setData
	// init -> constructor -> load -> setData
	// upload -> load -> setData
	
	this.b64 = lines[0];
	this.uint8array = Base64StringToUint8Array(lines[0].substr(lines[0].indexOf(','))); // data:application/binary;base64,
};
File.prototype.write = function() {
	
	var json = {};
	
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	
	json.data = this.b64;
	
	return json;
};
File.New = function() {
	
	var json = {};
	json.type = 'file';
	json.name = Griddl.Components.UniqueName('file', 1);
	json.visible = true;
	json.data = 'data:text/plain;base64,AAAA';
	return json;
};

Griddl.Components.file = File;

})();

