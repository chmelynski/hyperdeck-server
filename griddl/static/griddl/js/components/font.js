
(function() {

var Font = function(json, type, name) {
	
	// a font component should display a selection of text rendered using that font
	// ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789
	
	// single canvas, 8 columns, 16 rows, labeled in hex
	
	if (!json)
	{
		json = {};
		json.type = type;
		json.name = name;
		json.visible = true;
		json.data = null;
	}
	
	this._type = json.type;
	this._name = json.name;
	this._visible = json.visible;
	
	this._div = null;
	
	this._ext = null;
	this._b64 = null;
	this._uint8array = null;
	this._font = null;
	
	this._uploadDownload = true;
	
	this._canvas = null;
	
	this._load(json.data);
};
Font.prototype._setExt = function(ext) { var comp = this; comp._ext = ext; };
Font.prototype._setArrayBuffer = function(arrayBuffer) {
	
	var comp = this;
	
	comp._uint8array = new Uint8Array(arrayBuffer); // this probably isn't necessary - do we even use the uint8array anywhere?
	comp._b64 = 'data:font/otf;base64,' + Uint8ArrayToBase64String(comp._uint8array); // this *is* necessary, though, because we need the b64 to write to file
	comp._font = opentype.parse(arrayBuffer);
	
	Hyperdeck.Canvas.fontDict[comp._name] = comp._font;
	Hyperdeck.Canvas.fontNameToUint8Array[comp._name] = comp._uint8array;
	
	comp._refresh();
};
Font.prototype._load = function(b64) {
	
	var comp = this;
	
	// new -> constructor -> load -> setData
	// init -> constructor -> load -> setData
	// upload -> load -> setData
	
	if (!b64) { return; } // a newly-created Font object has no default
	
	comp._b64 = b64;
	
	// data:font/ttf;base64, or data:font/otf;base64,
	var slashIndex = comp._b64.indexOf('/');
	var semicolonIndex = comp._b64.indexOf(';');
	var commaIndex = comp._b64.indexOf(',');
	var prefix = comp._b64.substr(0, commaIndex);
	var type = prefix.substring(slashIndex + 1, semicolonIndex);
	var data = comp._b64.substr(commaIndex);
	
	comp._ext = '.' + type;
	
	comp._uint8array = Base64StringToUint8Array(data);
	comp._font = opentype.parse(comp._uint8array.buffer);
	
	Hyperdeck.Canvas.fontDict[comp._name] = comp._font;
	Hyperdeck.Canvas.fontNameToUint8Array[comp._name] = comp._uint8array;
};
Font.prototype._refresh = function() {
	
	var comp = this;
	
	if (comp._font)
	{
		var size = 24;
		var ctx = comp._canvas.getContext('2d');
		comp._font.draw(ctx, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 20, 30, size);
		comp._font.draw(ctx, 'abcdefghijklmnopqrstuvwxyz', 20, 60, size);
		comp._font.draw(ctx, '01234567890', 20, 90, size);
		//comp._font.draw(ctx, '!@#$%^&*()', 20, 120, size);
	}
};
Font.prototype._write = function() {
	
	var comp = this;
	
	var json = {};
	json.type = comp._type;
	json.name = comp._name;
	json.visible = comp._visible;
	json.data = comp._b64;
	return json;
};
Font.prototype._add = function() {
	
	var comp = this;
	
	comp._div = CreateComponentDiv($('#cells'), comp);
	
	var canvas = $(document.createElement('canvas'));
	//canvas.css('width', '30em');
	//canvas.css('height', '20em');
	
	// okay, so if we change these numbers from 320px-160px, the drawing will stretch - i have no idea why
	//canvas.css('width', '320px');
	//canvas.css('height', '160px');
	//canvas.css('border', '1px solid gray');
	//comp._div.append(canvas);
	
	var canvas = document.createElement('canvas');
	canvas.width = $('#cells').width() - 30; // 14px *2 for margins, 1px *2 for border
	canvas.height = 160 * 1.4;
	canvas.style.border = '1px solid gray';
	comp._div[0].appendChild(canvas);
	
	comp._canvas = canvas;
	
	comp._refresh();
};

Hyperdeck.Components.font = Font;

})();

