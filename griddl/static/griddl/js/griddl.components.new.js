
"use strict";

if (typeof Griddl === 'undefined') { var Griddl = {}; }

var TheComponents = (function() {

var Components = {};

Components.Bitmap = null;

Griddl.dirty = false;

Components.objs = []; // set in Main() - not a great idea to make this a var, because there are lots of local vars named 'objs'

Components.Main = function(text) {
	
	if (typeof text == 'undefined')
	{
		text = $('#frce').text(); // document.getElementById('frce').innerText
	}
	
	var json = JSON.parse(text);
	
	Components.objs = [];
	
	// merge with NewComponent?
	
	json.forEach(function(obj) {
		var component = new Components[obj.type](obj);
		//var component = new Proxy(new Components[obj.type](obj), Components.DefaultProxyHandler);
		Components.objs[component.name] = component;
		Components.objs.push(component);
	});
	
	if (typeof window != 'undefined')
	{
		Components.objs.forEach(function(obj) {
			obj.div = Components.CreateComponentDiv($('#cells'), obj);
			obj.div.css('border', '1px solid gray');
			obj.div.css('background-color', 'rgb(230,230,230)');
			obj.add();
		});
		
		Components.objs.forEach(function(obj) { if (obj.afterLoad) { obj.afterLoad(); } });
	}
	
	Components.MakeSortable();
};
Components.NewComponent = function(obj) {
	
	//var obj = new Proxy(new Components[type](), Components.DefaultProxyHandler);
	obj.div = CreateComponentDiv($('#cells'), obj);
	obj.div.css('border', '1px solid gray');
	obj.div.css('background-color', 'rgb(230,230,230)');
	obj.add();
	if (!Griddl.dirty) { Components.MarkDirty2(); }
	AddObj(obj);
};

Components.UploadWorkbook = function() {
	
	var fileChooser = document.createElement('input');
	fileChooser.type = 'file';
	
	fileChooser.onchange = function() {
		
		var fileReader = new FileReader();
		
		fileReader.onload = function(event)
		{
			var text = event.target.result;
			
			$('#cells').children().remove();
			
			Components.Main(text);
			
			for (var i = 0; i < Components.objs.length; i++)
			{
				if (Components.objs[i].type == 'document')
				{
					Components.objs[i].generate();
					Components.MarkClean();
					return;
				}
			}
			
			Components.MarkClean();
		};
		
		if (fileChooser.files.length > 0)
		{
			var f = fileChooser.files[0];
			$('title').text(f.name.substr(0, f.name.length - 4));
			fileReader.readAsText(f);
		}
	};
	
	fileChooser.click();
};
Components.DownloadWorkbook = function() {

	var filename = $('title').text();
	var text = SaveToText();
	
	var downloadLink = document.createElement('a');
	downloadLink.href = window.URL.createObjectURL(new Blob([text], {type : 'text/plain'}));
	downloadLink.download = filename + '.txt';
	downloadLink.click();
};

var confirmDelete = Components.confirmDelete = function (event) {
  var obj = event.data;
  var modal = $("<div class='modal'><div class='modal-dialog modal-sm'><div class='modal-content'><div class='modal-header text-center'><h3></h3><button class='btn btn-success'>Confirm</button><button data-dismiss='modal' class='btn btn-danger'>Cancel</button></div></div></div></div>");
  $('h3', modal).text("Delete " + obj.name + "?");
  $('body').append(modal);

  $('.btn-success', modal).on('click', function(event) {
    Griddl.Components.DeleteObj(obj);
    obj.div.parent().remove();
    Griddl.Components.MarkDirty(obj);
    $('.modal').modal('hide');
  });

  modal.modal('show');
}




// this is called by the DownloadWorkbook button or the Save/Save As button
var SaveToText = Components.SaveToText = function() { return JSON.stringify(Components.objs.map(obj => obj.write())); };

// API - these functions can be used in user code - put them in the global namespace - get, set, run
// there is still a lot of legacy usage of GetData in my workbooks, but it's better to have the shorter name 'get'
Components.Get = Components.GetData = function(name) { return FetchObj(name).getData(); };
Components.Set = Components.SetData = function(name, data) { FetchObj(name).setData(data); };
Components.Run = function(name) { FetchObj(name).exec() };
var FetchObj = Components.FetchObj = function(name) {
	if (!name) { throw new Error('FetchObj error: invalid name'); }
	if (!Components.objs[name]) { throw new Error("Error: there is no object named '" + name + "'"); }
	var obj = Components.objs[name];
	return obj;
};

Components.DefaultProxyHandler = {
	set: function(target, property, value, receiver) {
		
		target[property] = value;
		
		if (!Griddl.dirty)
		{
			Griddl.dirty = true;
			Components.MarkDirty2();
		}
		
		return true; // i was getting a bug when trying to set a property to false
		
		// this is probably way too global - called too many times, too much waste
		
		// if (target.section) { target.section.draw(); }
		
		// refresh codemirror, handsontable, or datgui
		//  1. need a mapping variable to ui object
		//  2. if the change comes from the ui object, a refresh is unnecessary
		
		// save in undo stack - do this in transactions, save lists of changes, so that executing code can be rolled back as a whole
		// of course, it would probably be a good idea to snapshot before running code - put this in Code.exec()
		// that would be easier
	}
};

var titleTag = document.getElementsByTagName('title')[0];
Components.MarkDirty = function() {
	
	if (!Griddl.dirty)
	{
		Griddl.dirty = true;
		titleTag.innerText = titleTag.innerText + '*';
	}
};
Components.MarkClean = function() {
	
	if (Griddl.dirty)
	{
		Griddl.dirty = false;
		titleTag.innerText = titleTag.innerText.substr(0, titleTag.innerText.length - 1);
	}
};

var Show = Components.Show = function(obj) {
	
	obj.div.removeClass('griddl-component-body-hidden');
	obj.div.parent().find('.griddl-component-head-minmax').attr('value', '-');
	obj.visible = true;
	
	// this fixes this bug: when a component containing a codemirror was initially hidden, and then we maximized, the text would not appear
	if (obj.codemirror) { obj.codemirror.refresh(); }
}
var Hide = Components.Hide = function(obj) {
	obj.div.addClass('griddl-component-body-hidden');
	obj.div.parent().find('.griddl-component-head-minmax').attr('value', '+');
	obj.visible = false;
};
var ShowAll = Components.ShowAll = function() { Components.objs.forEach(function(obj) { Show(obj); }); };
var HideAll = Components.HideAll = function() { Components.objs.forEach(function(obj) { Hide(obj); }); };

// we can use this as a generic upload function, but the component needs a setArrayBuffer or setText function, and an optional setExt
var Upload = Components.Upload = function() {
	
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
var Download = Components.Download = function() {
	var a = document.createElement('a');
	a.href = this.getHref();
	a.download = this.name + (this.ext ? '.' : '') + this.ext;
	a.click();
};

var AddObj = Components.AddObj = function(obj) {
	Components.objs[obj.name] = obj;
	Components.objs.push(obj);
	MakeSortable();
};
var RenameObj = Components.RenameObj = function(obj, newname) {
	delete Components.objs[obj.name];
	while (Components.objs[newname]) { newname += ' - copy'; } // if there is a conflict, just add suffixes until there isn't
	$('#'+obj.name).attr('id', newname);
	obj.name = newname;
	Components.objs[obj.name] = obj;
};
var DeleteObj = Components.DeleteObj = function(obj) {
	$('#'+obj.name).remove();
	delete Components.objs[obj.name];
	var i = Components.objs.indexOf(obj);
	Components.objs.splice(i, 1);
};

var MakeSortable = Components.MakeSortable = function() {
	$('#cells').sortable({handle:'.reorder-handle',stop:function(event, ui) {
		$(this).children().each(function(index, elt) {
			var id = $(elt).children().eq(1).attr('id');
			Components.objs[index] = Components.objs[id.substr(0, id.length - 'Component'.length)];
		});
	}});
};

// we want to make sure that all element ids stay unique
// pre-populate elementIds with the ids we use: frce, cells, output, screen, newComponentPanel
// and then the top-level <div> for each component gets the name+'Component', which should probably be replaced by a random unique id
// <div>'s and <style>'s added to the output by html/css/md components all get id-tagged with the component name - which means that component names must go in elementIds (on creation and also on rename)
// the Libraries component adds <script>'s with random ids
var elementIds = {};
var UniqueElementId = Components.UniqueElementId = function() {
	
	var id = null;
	
	do
	{
		id = '';
		
		for (var i = 0; i < 8; i++)
		{
			var n = Math.floor(Math.random() * 26, 1);
			id += String.fromCharCode(97 + n);
		}
	} while (elementIds[id]);
	
	elementIds[id] = true;
	
	return id;
};
var UniqueName = Components.UniqueName = function(type, n) {
	
	var name = null;
	
	do
	{
		name = type + n.toString();
		n++;
	}
	while (Components.objs[name] || elementIds[name]);
	
	elementIds[name] = true;
	
	return name;
};

var TsvToObjs = Griddl.TsvToObjs = function(text) { return MatrixToObjs(TsvToMatrix(text)); }
var TsvToMatrix = Griddl.TsvToMatrix = function(text) { return LinesToMatrixPadded(text.split('\n')); };
var LinesToMatrix = function(lines) { return lines.map(line => line.split('\t')); };
var LinesToMatrixPadded = function(lines) {
	
	if (lines.length == 0) { return []; }
	
	var matrix = [];
	
	var len = lines[0].split('\t').length;
	
	for (var i = 0; i < lines.length; i++)
	{
		var cols = lines[i].split('\t');
		for (var k = cols.length; k < len; k++) { cols.push(''); } // so that we don't have to fill in nulls across the board for grids with a grid formula
		matrix.push(cols);
	}
	
	return matrix;
};
var MatrixToJoinedLines = function(matrix) { return matrix.map(row => row.map(entry => (entry === null) ? '' : entry.toString()).join('\t')).join('\n'); };
var MatrixToObjs = Griddl.MatrixToObjs = function(matrix) {
	
	//	a	b	c
	//0	10	20	30
	//1	40	50	60
	//2	70	80	90
	
	// or
	
	//a	b	c
	//10	20	30
	//40	50	60
	//70	80	90
	
	// row headers or not: the signal is whether matrix[0][0] is the empty string or contains a value
	// if there are row headers, we set start to 1 so as to skip them.  if not, set start to 0
	
	if (matrix.length == 0) { return []; }
	
	var start = (matrix[0][0] == '') ? 1 : 0;
	
	var keys = []; for (var j = start; j < matrix[0].length; j++) { keys.push(matrix[0][j]); }
	
	var objects = [];
	
	for (var i = 1; i < matrix.length; i++)
	{
		var obj = {};
		for (var j = start; j < matrix[i].length; j++) { obj[keys[j - start]] = matrix[i][j]; }
		objects.push(obj);
	}
	
	return objects;
};
var ObjsToJoinedLines = Griddl.ObjsToJoinedLines = function(objects) {
	
	if (objects.length == 0) { return ''; }
	
	var lines = [];
	
	// i'm leery of this, because there is no guarantee as to the order of the keys
	// this code should probably be in the write() method of a Grid component, and the Grid should enforce a definite key order
	var colHeaders = []; for (var key in objects[0]) { colHeaders.push(key); }
	lines.push('\t' + colHeaders.join('\t'));
	
	for (var i = 0; i < objects.length; i++)
	{
		var entries = [];
		entries.push(i.toString()); // this is the row numbering, and should be at the discretion of the user, rather than automatic
		
		for (var key in objects[i]) // if there is a construction that lets us loop over object vals, now is the time to use it
		{
			var val = objects[i][key];
			entries.push((val === null) ? '' : val.toString());
		}
		
		lines.push(entries.join('\t'));
	}
	
	return lines.join('\n');
}

var Base64StringToUint8Array = Components.Base64StringToUint8Array = function(str) {
	
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
};
var Uint8ArrayToBase64String = Components.Uint8ArrayToBase64String = function(uint8array) {
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
};

var Clear = Components.Clear = function() {
	// we can't just call this.box.clear(), because Box.clear() only clears the handles
	this.ctx.clearRect(this.box.lf, this.box.tp, this.box.wd, this.box.hg);
}
var OnHover = Components.OnHover = function() {
	this.box.onhover();
}
var DeHover = Components.DeHover = function() {
	
}
var OnMouseMove = Components.OnMouseMove = function(e) {
	
	// the Box handles leaving and handles - we only have to deal with controls here
	
	var x = e.offsetX * this.ctx.cubitsPerPixel;
	var y = e.offsetY * this.ctx.cubitsPerPixel;
	
	if (this.controls)
	{
		for (var i = 0; i < this.controls.length; i++)
		{
			var control = this.controls[i];
			
			if (control.lf <= x && x <= control.rt && control.tp <= y && y <= control.bt)
			{
				control.onhover();
				return;
			}
		}
	}
	else
	{
		//console.log('warning: component "' + this.name + '" has no controls');
	}
}

//var debugCanvas = document.createElement('canvas');
//debugCanvas.style.position = 'absolute';
//debugCanvas.style.left = '450px';
//debugCanvas.style.top = '2px';
//debugCanvas.style.border = '1px solid gray';
//debugCanvas.width = 50;
//debugCanvas.height = 50;
//document.body.appendChild(debugCanvas);
//var debugCtx = debugCanvas.getContext('2d');

var Geom = (function() {

var Geom = {};
var Vector = Geom.Vector = function(a, b) {
	var v = {};
	v.x = b.x - a.x;
	v.y = b.y - a.y;
	RecalcPolar(v);
	return v;
}
var RecalcXY = Geom.RecalcXY = function(vector) {
	vector.x = vector.distance * Math.cos(vector.angle);
	vector.y = vector.distance * Math.sin(vector.angle);
}
var RecalcPolar = Geom.RecalcPolar = function(vector) {
	vector.distance = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
	vector.angle = Math.atan2(vector.y, vector.x);
}
var Add = Geom.Add = function(a, b) {
	var v = {};
	v.x = a.x + b.x;
	v.y = a.y + b.y;
	RecalcPolar(v);
	return v;
}
var Rotate = Geom.Rotate = function(vector, angle) {
	vector.angle += angle;
	RecalcXY(vector);
}
var RotateDegrees = Geom.RotateDegrees = function(vector, angle) {
	vector.angle += angle / 360 * Math.PI * 2;
	RecalcXY(vector);
}
var Scale = Geom.Scale = function(vector, scale) {
	vector.distance *= scale;
	RecalcXY(vector);
}
var SetDist = Geom.SetDist = function(vector, dist) {
	vector.distance = dist;
	RecalcXY(vector);
}
var SetAngle = Geom.SetAngle = function(vector, angle) {
	vector.angle = angle;
	RecalcXY(vector);
}
var SetAngleDegrees = Geom.SetAngleDegrees = function(vector, angle) {
	vector.angle = angle / 360 * Math.PI * 2;
	RecalcXY(vector);
}
return Geom;

})();

function Debug(text) { document.getElementById('debug').innerText = text; }

return Components;

})();

// we use lowercase so that "set" does not conflict with the built-in (mathematical) "Set"
var getData = TheComponents.Get;
var get = TheComponents.FetchObj;
var set = TheComponents.Set;
var run = TheComponents.Run;

if (typeof window !== 'undefined') {
	CanvasRenderingContext2D.prototype.drawLine = function(x1, y1, x2, y2) {
		this.beginPath();
		this.moveTo(x1, y1);
		this.lineTo(x2, y2);
		this.stroke();
	};
	CanvasRenderingContext2D.prototype.fillCircle = function(x, y, r) {
		this.beginPath();
		this.arc(x, y, r, 0, Math.PI * 2, true);
		this.fill();
	};
	CanvasRenderingContext2D.prototype.strokeCircle = function(x, y, r) {
		this.beginPath();
		this.arc(x, y, r, 0, Math.PI * 2, true);
		this.stroke();
	};
	
	// monkey patching Array breaks 'for (key in array)'
	//Array.prototype.sortBy = function(key) {
	//	this.sort(function(a, b) {
	//		if (a[key] > b[key]) { return 1; }
	//		if (a[key] < b[key]) { return -1; }
	//		return 0;
	//	});
	//};
}

if (typeof window !== 'undefined') {
	//if (typeof Griddl === 'undefined') { var Griddl = {}; } // Griddl must be defined before this module is loaded
	Griddl.Components = TheComponents;
}
else {
	exports.Components = TheComponents;
}



