
(function() {

var Image = function(json) {
	
	if (!json)
	{
		json = {};
		json.type = 'image';
		json.name = Griddl.Components.UniqueName('image', 1);
		json.visible = true;
		json.data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAERJREFUOE9j3LJlCwMMeHt7w9lbt24lKM4A1AwH/5EAMeIDqJlUpyKrZxiimomJElxeG8CoosjZQzSqKHI2RQE2NDUDAEVWy5NpqgO1AAAAAElFTkSuQmCC';
		json.params = {};
		json.params.x = 0; // we need some knowledge of the units and scale to set reasonable initial values for the coordinates
		json.params.y = 0;
		json.params.hAlign = 'center';
		json.params.vAlign = 'center';
		json.params.width = 200;
		json.params.height = 200;
		json.params.source = {};
		json.params.source.left = 0;
		json.params.source.top = 0;
		json.params.source.width = 20;
		json.params.source.height = 20;
	}
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	
	this.ext = null;
	this.b64 = null;
	this.uint8array = null;
	this.imageElement = null;
	
	this.dimensionDiv = null;
	
	this.ctx = null;
	this.section = null;
	
	this.load(json.data);
	
	this.box = new Proxy(new Griddl.Components.Box(this, true), Griddl.Components.DefaultProxyHandler);
	//this.box = new Griddl.Components.Box(this, true);
	this.box.x = json.params.x;
	this.box.y = json.params.y;
	this.box.hAlign = json.params.hAlign;
	this.box.vAlign = json.params.vAlign;
	this.box.wd = json.params.wd;
	this.box.hg = json.params.hg;
	this.box.align();
	
	this.source = new Proxy(json.params.source, Griddl.Components.DefaultProxyHandler);
	//this.source = json.params.source;
	
	this.margin = new Proxy(json.params.margin, Griddl.Components.DefaultProxyHandler);
	//this.margin = json.params.margin;
};
Image.prototype.add = function() {
	
	this.addElements();
	this.refresh();
};
Image.prototype.addElements = function() {
	
	var comp = this;
	
	this.div.html('');
	
	this.imageElement.style.margin = '1em';
	this.div[0].appendChild(this.imageElement); // this.div.innerHTML = '<img src="' + this.b64 + '"></img>'; // this assumes div is not Jquery
	
	this.dimensionDiv = $('<div style="margin-left:1em"></div>');
	this.dimensionDiv.text(this.imageElement.width + ' x ' + this.imageElement.height);
	this.div.append(this.dimensionDiv);
	
	this.div.append($('<hr />'));
	
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
	gui.add(this, 'download');
	gui.add(this, 'upload');
	
	this.box.addElements(gui, ['x','y','wd','hg','hAlign','vAlign']);
	
	var controls = [];
	
	var source = gui.addFolder('source');
	controls.push(source.add(this.source, 'left'));
	controls.push(source.add(this.source, 'top'));
	controls.push(source.add(this.source, 'width'));
	controls.push(source.add(this.source, 'height'));
	
	controls.forEach(function(control) {
		control.onChange(function(value) {
			comp.box.clear();
			comp.draw();
		});
	});
	
	Griddl.Components.AddMarginElements(gui, this, this.margin);
	
	this.div[0].appendChild(gui.domElement);
	
	// for (var i in gui.__controllers) { gui.__controllers[i].updateDisplay(); } // how to update display on external change of value
};
Image.prototype.draw = function() {
	this.ctx.drawImage(this.imageElement, this.source.left, this.source.top, this.source.width, this.source.height, this.box.lf, this.box.tp, this.box.wd, this.box.hg);
};
Image.prototype.download = function() {
	var a = document.createElement('a');
	a.href = this.b64;
	a.download = this.name + '.' + this.ext;
	a.click();
};
Image.prototype.setExt = function(ext) {
	this.ext = ext;
};
Image.prototype.setArrayBuffer = function(arrayBuffer) {
	this.uint8array = new Uint8Array(arrayBuffer);
	this.b64 = 'data:image/' + this.ext + ';base64,' + Griddl.Components.Uint8ArrayToBase64String(this.uint8array);
	this.refresh();
};
Image.prototype.getData = function() {
	return this.imageElement;
};
Image.prototype.setData = function(imageElement) {
	this.imageElement = imageElement;
	// this.b64 = ??
	this.refresh();
};
Image.prototype.load = function(b64) {
	
	// since load is always followed by setData, why not merge load into setData?
	
	// new -> constructor -> load -> setData
	// init -> constructor -> load -> setData
	// upload -> load -> setData
	
	this.b64 = b64;
	
	var slashIndex = this.b64.indexOf('/');
	var semicolonIndex = this.b64.indexOf(';');
	var commaIndex = this.b64.indexOf(',');
	var prefix = this.b64.substr(0, commaIndex); // data:image/png;base64,
	var type = prefix.substring(slashIndex + 1, semicolonIndex);
	var data = this.b64.substr(commaIndex);
	
	this.ext = type;
	
	this.uint8array = Griddl.Components.Base64StringToUint8Array(data);
	
	if (typeof window != 'undefined')
	{
		this.imageElement = document.createElement('img');
		this.imageElement.src = this.b64;
	}
	else
	{
		if (type == 'bmp')
		{
			this.imageElement = Components.Bitmap.Read(this.uint8array);
		}
		else
		{
			this.imageElement = null;
		}
	}
};
Image.prototype.refresh = function() {
	this.imageElement.src = this.b64;
	this.imageElement.className = 'upload';
	this.dimensionDiv.text(this.imageElement.width + ' x ' + this.imageElement.height);
};
Image.prototype.onmousemove = function(e) {
	// any resize controls go here
};
Image.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.data = this.b64;
	json.params = {};
	json.params.x = this.box.x;
	json.params.y = this.box.y;
	json.params.hAlign = this.box.hAlign;
	json.params.vAlign = this.box.vAlign;
	json.params.width = this.width;
	json.params.height = this.height;
	json.params.margin = {};
	json.params.margin.top = this.margin.top;
	json.params.margin.left = this.margin.left;
	json.params.margin.right = this.margin.right;
	json.params.margin.bottom = this.margin.bottom;
	return json;
};

Image.prototype.upload = Griddl.Components.Upload;
Image.prototype.onhover = Griddl.Components.OnHover;
Image.prototype.dehover = Griddl.Components.DeHover;

Griddl.Components.image = Image;

})();

