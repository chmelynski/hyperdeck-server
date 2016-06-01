
"use strict";

if (typeof Griddl === 'undefined') { var Griddl = {}; }

var TheComponents = (function() {

var Components = {};

Components.Bitmap = null;

Components.JsonBackedRepresentationToggle = function() {
	
	// this deals with the codemirror half of any JSON-backed graphical component
	
	// interface:
	// obj.div
	// obj.getText
	// obj.setData
	// obj.refresh() - generates the graphical representation after setData is called (if setData can be guaranteed to call refresh then this is unnecessary)
	// obj.representationLabel - how to label the radio button
	
	// Datgui.representationToggle = Components.JsonBackedRepresentationToggle;
	// var fns = datgui.representationToggle(); // this means that 'this' will be the datgui instance in this function
	// radioButton.onclick = fns[i] // but the sub-functions below are called on the button, so we can't use 'this' in them
	var obj = this;
	var codemirror = null;
	
	var TextToOther = function() {
		
		obj.div.html('');
		
		try
		{
			var text = codemirror.getDoc().getValue();
			var data = JSON.parse(text);
		}
		catch (e)
		{
			// the parse has failed - display an error message - look at error handling code in MakeComponentsDiv to see how to display error message
		}
		
		obj.setData(data);
		obj.refresh();
		
		MarkDirty();
	};
	
	var OtherToText = function() {
		
		obj.div.html('');
		
		var textbox = $(document.createElement('textarea'));
		textbox.addClass('griddl-component-body-radio-textarea');
		obj.div.append(textbox);
		
		var text = obj.getText();
		codemirror = CodeMirror.fromTextArea(textbox[0], { smartIndent : false , lineNumbers : true });
		codemirror.getDoc().setValue(text);
		
		MarkDirty();
	};
	
	return [ { label : obj.representationLabel , fn : TextToOther } , { label : 'JSON' , fn : OtherToText } ];
};

var NewComponent = function(type) {
	
	//var obj = new Griddl.Components[type](); // eventually, we want to just call the constructor with no json argument
	var obj = new Griddl.Components[type](Griddl.Components[type].New()); // but for now, let New generate the default json
	obj.add();
	MarkDirty();
	AddObj(obj);
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
var ShowAll = Components.ShowAll = function() { Griddl.Core.objs.forEach(function(obj) { Show(obj); }); };
var HideAll = Components.HideAll = function() { Griddl.Core.objs.forEach(function(obj) { Hide(obj); }); };

// these more type-specific header elements are being moved into the component body
function AddRepresentationToggle(obj) {
	
	var radioDiv = $(document.createElement('div'));
	radioDiv.addClass('griddl-component-head-radio-container');
	
	var radioName = '';
	
	// we create a 12-letter random name to link the radio buttons into a group.  collisions are possible but unlikely
	for (var i = 0; i < 12; i++)
	{
		var c = Math.floor(Math.random() * 52, 1);
		if (c < 26) { radioName += String.fromCharCode(65 + c); }
		else { radioName += String.fromCharCode(97 + (c - 26)); }
	}
	
	var conversions = obj.representationToggle();
	
	for (var i = 0; i < conversions.length; i++)
	{
		var radioButton = $(document.createElement('input'));
		radioButton.addClass('griddl-component-head-radio-button');
		radioButton.attr('type', 'radio');
		radioButton.attr('name', radioName);
		if (i == 0) { radioButton.attr('checked', 'true'); }
		radioDiv.append(radioButton);
		
		var label = $(document.createElement('label'));
		label.addClass('griddl-component-head-radio-label');
		label.text(conversions[i].label);
		radioDiv.append(label);
		
		radioButton.on('click', conversions[i].fn);
	}
	
	return radioDiv;
}
function AddInvokeButton(obj) {
	
	var button = $(document.createElement('button'));
	
	button.addClass(obj.execButtonClass);
	button.html(obj.execButtonText);
	
	button.on('click', function() { obj.exec(); });
	
	return button;
}
function AddInvokeButton2(obj) {
	
	var button = $(document.createElement('button'));
	
	button.addClass(obj.execButtonClass2);
	button.html(obj.execButtonText2);
	
	button.on('click', function() { obj.exec2(); });
	
	return button;
}
function AddUploadButton(obj) {
	
	// interface required:
	//  obj.setArrayBuffer
	//    OR
	//  obj.setText
	
	// we also want drag-n-drop
	
	var button = $(document.createElement('button'));
	button.addClass('griddl-component-head-upload');
	button.html('Upload');
	
	button.on('click', function() {
		
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
	});
	
	return button;
}
function AddDownloadButton(obj) {
	
	// obj.name
	// obj.ext
	// obj.datauri()
	
	var button = $(document.createElement('button'));
	button.addClass('griddl-component-head-download');
	button.html('Download');
	
	button.on('click', function() {
		var a = document.createElement('a');
		a.href = obj.datauri();
		a.download = obj.name + obj.ext;
		a.click();
	});
	
	return button;
}

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

// image needs an upload/download button (as well as file, font, possibly grid and text)
// document has Generate and Export buttons
// section should have a Generate (and Export?) button

// all references to Griddl.Core.objs are collected here, in case we want to move objs to some other place
var AddObj = Components.AddObj = function(obj) { Griddl.Core.objs[obj.name] = obj; Griddl.Core.objs.push(obj); MakeSortable(); }
function RenameObj(obj, newname) { 
	delete Griddl.Core.objs[obj.name];
	while (Griddl.Core.objs[newname]) { newname += ' - copy'; } // if there is a conflict, just add suffixes until there isn't
	obj.name = newname;
	Griddl.Core.objs[obj.name] = obj;
}
function DeleteObj(obj) {
	delete Griddl.Core.objs[obj.name];
	var i = Griddl.Core.objs.indexOf(obj);
	Griddl.Core.objs.splice(i, 1);
}
var UniqueName = Components.UniqueName = function(type, n) { while (Griddl.Core.objs[type + n.toString()]) { n++; } return type + n.toString(); }
var MarkDirty = Components.MarkDirty = function() {
	
	if ($('#saveMenuButton').css('color') == 'rgb(0, 0, 0)')
	{
		$('#saveMenuButton').css('color', 'red');
	}
	else
	{
		$('#saveMenuButton').data('color', 'red'); // save the marking for later, when the user logs in
	}
	
	if ($('#saveasMenuButton').css('color') == 'rgb(0, 0, 0)')
	{
		$('#saveasMenuButton').css('color', 'red');
	}
	else
	{
		$('#saveasMenuButton').data('color', 'red'); // save the marking for later, when the user logs in
	}
}
var MakeSortable = Components.MakeSortable = function() {
	$('#cells').sortable({handle:'.reorder-handle',stop:function(event, ui) {
		$(this).children().each(function(index, elt) {
			var id = $(elt).children().eq(1).attr('id');
			Griddl.Core.objs[index] = Griddl.Core.objs[id.substr(0, id.length - 'Component'.length)];
		});
	}});
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

function Captions() {
	
	// text, x, y, width, hAlign, vAlign, style
	
	// text can support LaTeX math
	// there's no height field - the text just wraps
	// style is a comma-delimited list - maybe some syntax on the text to delimit default, special1, special2 styles
	
	// {first special style:} default style - {second special style}
	
	var options = {}
	options.data = this.data;
	options.formulas = true;
	options.rowHeaders = false;
	options.colHeaders = ['text','x','y','width','hAlign','vAlign','font','color'];
	options.colWidths = [ 50 , 10 , 10 , 10 , 10 , 10 , 20 , 10 ];
	options.contextMenu = false;
	options.manualColumnResize = true;
	//options.afterChange = function(changes, source) { if (this.firstChange) { this.firstChange = false; } else { MarkDirty(); } };
	
	//var tableDiv = $(document.createElement('div'));
	//this.div.append(tableDiv);
	//this.tableDiv = tableDiv;
	
	this.handsontable = new Handsontable(this.div[0], options);
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

if (typeof window !== 'undefined') {
	//if (typeof Griddl === 'undefined') { var Griddl = {}; } // Griddl must be defined before this module is loaded
	Griddl.Components = TheComponents;
}
else {
	exports.Components = TheComponents;
}

