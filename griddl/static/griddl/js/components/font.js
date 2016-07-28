
(function() {

var Font = function(json) {
	
	// a font component should display a selection of text rendered using that font
	// ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789
	
	// single canvas, 8 columns, 16 rows, labeled in hex
	
	if (!json)
	{
		json = {};
		json.type = 'font';
		json.name = Hyperdeck.Components.UniqueName('font', 1);
		json.visible = true;
		json.data = null;
	}
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	
	this.ext = null;
	this.b64 = null;
	this.uint8array = null;
	this.font = null;
	
	this.uploadDownload = true;
	
	this.canvas = null;
	
	this.load(json.data);
};
Font.prototype.datauri = function() {
	return this.b64;
};
Font.prototype.setExt = function(ext) { this.ext = ext; };
Font.prototype.setArrayBuffer = function(arrayBuffer) {
	
	this.uint8array = new Uint8Array(arrayBuffer); // this probably isn't necessary - do we even use the uint8array anywhere?
	this.b64 = 'data:font/otf;base64,' + Uint8ArrayToBase64String(this.uint8array); // this *is* necessary, though, because we need the b64 to write to file
	this.font = opentype.parse(arrayBuffer);
	
	Hyperdeck.Canvas.fontDict[this.name] = this.font;
	Hyperdeck.Canvas.fontNameToUint8Array[this.name] = this.uint8array;
	
	this.refresh();
};
Font.prototype.load = function(b64) {
	
	// new -> constructor -> load -> setData
	// init -> constructor -> load -> setData
	// upload -> load -> setData
	
	if (!b64) { return; } // a newly-created Font object has no default
	
	this.b64 = b64;
	
	// data:font/ttf;base64, or data:font/otf;base64,
	var slashIndex = this.b64.indexOf('/');
	var semicolonIndex = this.b64.indexOf(';');
	var commaIndex = this.b64.indexOf(',');
	var prefix = this.b64.substr(0, commaIndex);
	var type = prefix.substring(slashIndex + 1, semicolonIndex);
	var data = this.b64.substr(commaIndex);
	
	this.ext = '.' + type;
	
	this.uint8array = Base64StringToUint8Array(data);
	this.font = opentype.parse(this.uint8array.buffer);
	
	Hyperdeck.Canvas.fontDict[this.name] = this.font;
	Hyperdeck.Canvas.fontNameToUint8Array[this.name] = this.uint8array;
};
Font.prototype.refresh = function() {
	
	if (this.font)
	{
		var size = 24;
		var ctx = this.canvas.getContext('2d');
		this.font.draw(ctx, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 20, 30, size);
		this.font.draw(ctx, 'abcdefghijklmnopqrstuvwxyz', 20, 60, size);
		this.font.draw(ctx, '01234567890', 20, 90, size);
		//this.font.draw(ctx, '!@#$%^&*()', 20, 120, size);
	}
};
Font.prototype.write = function() {
	//return '@' + this.type + ' ' + this.name + ' ' + this.display + '\n' + this.b64 + '\n@end\n';
	
	var json = {};
	
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	
	json.data = this.b64;
	
	return json;
};
Font.prototype.add = function() {
	
	this.div = CreateComponentDiv($('#cells'), this);
	
	var canvas = $(document.createElement('canvas'));
	//canvas.css('width', '30em');
	//canvas.css('height', '20em');
	
	// okay, so if we change these numbers from 320px-160px, the drawing will stretch - i have no idea why
	//canvas.css('width', '320px');
	//canvas.css('height', '160px');
	//canvas.css('border', '1px solid gray');
	//this.div.append(canvas);
	
	var canvas = document.createElement('canvas');
	canvas.width = $('#cells').width() - 30; // 14px *2 for margins, 1px *2 for border
	canvas.height = 160 * 1.4;
	canvas.style.border = '1px solid gray';
	this.div[0].appendChild(canvas);
	
	this.canvas = canvas;
	
	this.refresh();
};

Hyperdeck.Components.font = Font;

})();

