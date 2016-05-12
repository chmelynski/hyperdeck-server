
if (typeof Griddl === 'undefined') { var Griddl = {}; }

var TheComponents = (function() {

var Components = {};

Components.Bitmap = null;


var Text = Components.txt = Components.js = Components.html = Components.css = Components.json = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	this.codemirror = null;
	
	this.text = null;
	this.data = null; // this is the json objects for json, the function object for js, and plain text otherwise
	
	this.execButtonClass = null;
	this.execButtonText = null;
	
	if (this.type == 'js')
	{
		this.execButtonClass = 'griddl-component-head-runcode';
		this.execButtonText = 'Run code';
	}
	else if (this.type == 'html' || this.type == 'css')
	{
		this.execButtonClass = 'griddl-component-head-addtodom';
		this.execButtonText = 'Add to DOM';
	}
	
	this.uploadDownload = false;
	
	this.load(json.data);
};
Text.prototype.add = function() {
	
	var modeDict = {text:'plain',js:'javascript',css:'css',html:'xml',json:'javascript'};
	var mode = modeDict[this.type];
	
	this.div = CreateComponentDiv($('#cells'), this);
	var textbox = $(document.createElement('textarea'));
	this.div.append(textbox);
	
	this.codemirror = CodeMirror.fromTextArea(textbox[0], { mode : mode , smartIndent : false , lineNumbers : true , lineWrapping : true });
	
	this.refresh();
	
	var text = this;
	this.codemirror.on('blur', function() { text.text = text.codemirror.getValue(); text.compile();  });
	this.codemirror.on('change', function() { MarkDirty(); });
};
Text.prototype.refresh = function() {
	this.codemirror.getDoc().setValue(this.text);
};
Text.prototype.load = function(text) {
	
	// new -> constructor -> load -> setData
	// init -> constructor -> load -> setData
	// upload -> load -> setData
	// blur -> setData
	
	this.text = text;
	this.compile();
};
Text.prototype.setText = function(text) {
	
	// this is the same as setData - should the functions be merged?
	
	this.text = text;
	this.compile();
	this.refresh();
};
Text.prototype.getData = function() {
	
	// should this be renamed getText?
	
	// codemirror does not propagate edits to the backing string object, so you have to pull directly from the interface
	
	if (this.codemirror)
	{
		return this.codemirror.getDoc().getValue();
	}
	else
	{
		return this.text; // not this.data, it should be noted, because the above would only return text
	}
};
Text.prototype.setData = function(text) {
	
	
	// now, we could say that this could be called like so: setData(json), and then do this.text = JSON.stringify(this.data)
	// this makes the case that there should in fact be separate setText and setData functions for Text, because even here we do some object conversion
	
	// we get here either from load() or on blur after a user edits json or js (requiring a compilation) or from Set()
	
	this.text = text;
	this.compile();
	this.refresh();
};
Text.prototype.compile = function() {
	
	if (this.type == 'json')
	{
		try
		{
			this.data = JSON.parse(this.text);
		}
		catch (e)
		{
			// the parse has failed - display an error message - look at error handling code in MakeComponentsDiv to see how to display error message
			throw new Error('invalid JSON');
		}
	}
	else if (this.type == 'js')
	{
		try
		{
			this.data = new Function('args', this.text);
		}
		catch (e)
		{
			throw new Error('invalid javascript');
		}
	}
	else
	{
		this.data = this.text;
	}
};
Text.prototype.exec = function() {
	
	this.data = this.text = this.codemirror.getValue();
	
	if (this.type == 'css')
	{
		$('#' + this.name).remove();
		var style = $(document.createElement('style'));
		style.attr('id', this.name);
		style.html(this.data);
		$('head').append(style);
	}
	else if (this.type == 'html')
	{
		$('#' + this.name).remove();
		var div = $(document.createElement('div'));
		div.attr('id', this.name);
		div.html(this.data);
		$('body').append(div);
	}
	else if (this.type == 'js')
	{
		var fn = new Function('args', this.codemirror.getValue());
		
		$('#errorMessage').remove();
		
		fn();
		
		//try
		//{
		//	fn();
		//}
		//catch (e)
		//{
		//	var lines = e.stack.split('\n');
		//	var evalLine = null;
		//	for (var i = 0; i < lines.length; i++)
		//	{
		//		if (lines[i].trim().substr(0, 7) == 'at eval')
		//		{
		//			evalLine = lines[i];
		//		}
		//	}
		//	var fnLineCol = evalLine.split(',')[1]; // ' <anonymous>:7:1)'
		//	var fnLineColArray = fnLineCol.substring(1, fnLineCol.length - 1).split(':'); // [ '<anonymous' , '7' , '1' ]
		//	var functionName = fnLineColArray[0];
		//	var lineNumber = fnLineColArray[1] - 2; // not sure why the line number is 2 off
		//	var colNumber = fnLineColArray[2];
		//	obj.div.before('<span id="errorMessage" style="color:red;">Error: ' + e.message + ' (at line ' + lineNumber + ', column ' + colNumber + ')' + '</span>');
		//}
	}
	else
	{
		throw new Error("'" + this.name + "' is a " + this.type + ", not an executable js/css/html object");
	}
};
Text.prototype.write = function() {
	
	var json = {};
	
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	
	json.data = this.codemirror.getValue();
	
	return json;
};
Text.New = function(type) {
	var obj = new Text({type:type,name:UniqueName(type, 1),visible:true,data:(type == 'json') ? '{}' : ''});
	obj.add();
	MarkDirty();
	AddObj(obj);
};

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

var Grid = Components.grid = Components.table = Components.matrix = Components.tsv = function(json) {
	
	// so here there are two choices for the underlying data and three choices for the display
	// [ {} ] vs [ [] ]
	// Handsontable vs <table> vs <pre>
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	this.tableDiv = null; // for unknown reasons we pass a sub div to Handsontable / add the <table> or <pre> to the sub div
	this.handsontable = null;
	this.codemirror = null;
	
	this.headers = json.headers;
	
	this.matrix = null;
	this.data = null;
	
	this.uploadDownload = false;
	
	this.load(json.data);
};
Grid.prototype.add = function() {
	
	this.div = CreateComponentDiv($('#cells'), this);
	
	var tableDiv = $(document.createElement('div'));
	this.div.append(tableDiv);
	this.tableDiv = tableDiv;
	
	this.refresh();
	
	//todo: update data on blur
};
Grid.prototype.refresh = function() {
	
	// here we deal with Handsontable vs <table> vs <pre>
	
	if (this.type == 'grid' || this.type == 'matrix' || this.type == 'barChart' || this.type == 'lineChart' || this.type == 'scatterChart')
	{
		var rowHeaders = false;
		var colHeaders = false;
		
		if (this.type == 'grid')
		{
			rowHeaders = function(index) { return index; };
			colHeaders = []; for (var key in this.data[0]) { colHeaders.push(key); }
		}
		
		// we need this because the afterChange event fires after the table is first created - we don't want MarkDirty() to be called on init
		this.firstChange = true;
		
		var options = {
			data : this.data ,
			formulas : true ,
			rowHeaders : rowHeaders ,
			colHeaders : colHeaders ,
			contextMenu : true ,
			manualColumnResize : true ,
			afterChange : function(changes, source) {
				if (this.firstChange)
				{
					this.firstChange = false;
				}
				else
				{
					MarkDirty();
				}
			}
			//colWidths : DetermineColWidths(this.$, '11pt Calibri', [ 5 , 23 , 5 ]) // expand widths to accomodate text length
			//colWidths : [ 10 , 30 , 10 ].map(function(elt) { return elt * TextWidth('m', '11pt Calibri'); }) // fixed widths, regardless of text length
		};
		
		this.handsontable = new Handsontable(this.tableDiv[0], options);
	}
	else if (this.type == 'table')
	{
		// we have no capacity for a matrix table
		
		var colHeaders = []; for (var key in this.data[0]) { colHeaders.push(key); }
		
		var table = $(document.createElement('table'));
		table.css('border-collapse', 'collapse');
		
		var headertr = $(document.createElement('tr'));
		
		headertr.append($(document.createElement('td')));
		
		for (var i = 0; i < colHeaders.length; i++)
		{
			var td = $(document.createElement('td'));
			td.css('border', '1px solid black');
			td.html(colHeaders[i]);
			headertr.append(td);
		}
		
		table.append(headertr);
		
		for (var i = 0; i < this.data.length; i++)
		{
			var tr = $(document.createElement('tr'));
			
			var td = $(document.createElement('td'));
			td.css('border', '1px solid black');
			td.html(i.toString());
			tr.append(td);
			
			for (var key in this.data[i])
			{
				var td = $(document.createElement('td'));
				td.css('border', '1px solid black');
				td.html(this.data[i][key].toString());
				tr.append(td);
			}
			
			table.append(tr);
		}
		
		this.tableDiv.append(table);
	}
	else if (this.type == 'tsv')
	{
		this.tableDiv[0].innerHTML = '<pre>' + this.matrix.map(row => row.join('\t')).join('\n') + '</pre>'; // this works for both the initial add as well as refreshes
	}
	else
	{
		throw new Error();
	}
};
Grid.prototype.load = function(lines) {
	
	// new -> constructor -> load -> setData
	// init -> constructor -> load -> setData
	// paste -> load -> setData
	// upload -> load -> setData
	
	this.matrix = LinesToMatrixPadded(lines);
	this.matrixToData();
	
	// refresh?
};
Grid.prototype.matrixToData = function() {
	
	// here we deal with [ {} ] vs [ [] ]
	if (this.type == 'grid' || this.type == 'table' || this.type == 'tsv')
	{
		this.data = MatrixToObjs(this.matrix);
	}
	else if (this.type == 'matrix')
	{
		this.data = this.matrix;
	}
	else
	{
		throw new Error();
	}
};
Grid.prototype.getText = function() {
	
	if (this.codemirror)
	{
		return this.codemirror.getValue();
	}
	else if (this.type == 'matrix')
	{
		return MatrixToJoinedLines(this.data)
	}
	else if (this.type == 'grid' || this.type == 'tsv' || this.type == 'table')
	{
		return ObjsToJoinedLines(this.data)
	}
	else
	{
		throw new Error();
	}
};
Grid.prototype.setText = function(text) {
	this.matrix = TsvToMatrix(text);
	this.matrixToData();
	this.refresh();
};
Grid.prototype.getData = function() {
	return this.data;
};
Grid.prototype.setData = function(data) {
	this.data = data;
	this.refresh();
};
Grid.prototype.write = function() {
	
	var json = {};
	
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	
	json.data = this.getText();
	
	return json;
};
Grid.New = function(type) {
	var obj = new Grid({type:type,name:UniqueName(type, 1),visible:true,headers:['A','B','C'],data:[{A:null,B:null,C:null},{A:null,B:null,C:null},{A:null,B:null,C:null}]});
	obj.add();
	MarkDirty();
	AddObj(obj);
};
Grid.prototype.representationToggle = function() {
	
	var obj = this;
	
	var TextToGrid = function() {
		
		var text = obj.codemirror.getDoc().getValue();
		
		obj.div.html('');
		obj.codemirror = null;
		
		// because we destroy the tableDiv to add the codemirror, we need to create a new tableDiv here
		var tableDiv = $(document.createElement('div'));
		obj.div.append(tableDiv);
		obj.tableDiv = tableDiv;
		
		obj.setText(text); // so if we define a getText/setText interface, we could abstract the representationToggle so that the same generic function could be used for both JSON and grid objects
		
		MarkDirty();
	};
	
	var GridToText = function() {
		
		if (obj.type == 'grid' || obj.type == 'matrix') { obj.handsontable.destroy(); }
		obj.div.html('');
		
		var textbox = $(document.createElement('textarea'));
		textbox.addClass('griddl-component-body-radio-textarea');
		obj.div.append(textbox);
		
		var text = obj.getText();
		
		obj.codemirror = CodeMirror.fromTextArea(textbox[0], { smartIndent : false , lineNumbers : true });
		obj.codemirror.getDoc().setValue(text);
		
		MarkDirty();
	};
	
	return [ { label : 'Grid' , fn : TextToGrid } , { label : 'Text' , fn : GridToText } ];
};

var Font = Components.font = function(json) {
	
	// a font component should display a selection of text rendered using that font
	// ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789
	
	// single canvas, 8 columns, 16 rows, labeled in hex
	
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
	
	Griddl.Canvas.fontDict[this.name] = this.font;
	Griddl.Canvas.fontNameToUint8Array[this.name] = this.uint8array;
	
	this.refresh();
};
Font.prototype.load = function(b64) {
	
	// new -> constructor -> load -> setData
	// init -> constructor -> load -> setData
	// upload -> load -> setData
	
	if (!b64) { return; } // Font.New doesn't have a default font
	
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
	
	Griddl.Canvas.fontDict[this.name] = this.font;
	Griddl.Canvas.fontNameToUint8Array[this.name] = this.uint8array;
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
Font.New = function() {
	var obj = new Font(['@font', UniqueName('font', 1), 'visible'], []);
	obj.add();
	MarkDirty();
	AddObj(obj);
};

var File = Components.file = function(json) {
	
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
	var obj = new File(['@file', UniqueName('file', 1), 'visible'], [ 'data:text/plain;base64,AAAA' ]);
	obj.add();
	MarkDirty();
	AddObj(obj);
};


function CreateComponentDiv(parent, obj) {
	
	var div = $(document.createElement('div'));
	var headerDiv = $(document.createElement('div'));
	var clientDiv = $(document.createElement('div'));
	
	div.addClass('griddl-component');
  div.addClass(obj.type);
	headerDiv.addClass('griddl-component-head');
	clientDiv.addClass('griddl-component-body');
	
	// we'll put a modified id on the clientDiv, so that we can refer to it from CSS components
	// we can't tag the component client div with the bare obj.name, because if it is an HTML component, the created div will have id = obj.name
	clientDiv.attr('id', obj.name + 'Component'); 
	if (obj.display == 'hidden') { clientDiv.addClass('griddl-component-body-hidden'); }
	
	// 1. toggle between representations (right now for grids and guis, but could be extended to other types)
	//  a. Handsontable/<table>/<pre>/Codemirror (TSV)
	//  b. gui/Codemirror (JSON)
	//  c. Codemirror (JSON)/tree representation of that JSON
	// 2. exec/invoke html/css/js
	// 3. upload/download/dragndrop file - this should be universal
	
	// 1 and 2 are going to be mutually exclusive - there is no alternate representation for html/css/js text, and there is no way that grids or guis can be invoked.  this means that their buttons can take up the same overlapping space
	
	// upload/download should be square buttons with icons, and thus can be put in every header
	// can the upload button also be a dragndrop target?  if not, should there be another square for it?


  // note from Noah - adding the bootstrap rows/cols on this is a little verbose and i'm sorry
  headerDiv.append($("<div class='row'></div>"));

  headerLeft = $("<div class='col-sm-6'></div>");
  headerRight = $("<div class='col-sm-6'></div>");
	
	headerLeft.append(AddReorderHandle(obj));
	headerLeft.append(AddTypeLabel(obj));
	headerLeft.append(AddNameBox(obj));

  floatRight = $('<div class="pull-right"></div>');
  
	floatRight.append(AddMinimizeButton(obj));
  floatRight.append(AddDestroyButton(obj));
  headerRight.append(floatRight);

  $('.row', headerDiv).append(headerLeft);
  $('.row', headerDiv).append(headerRight);
	
	div.append(headerDiv);
	div.append(clientDiv);
	parent.append(div);
	
	return clientDiv;
}


function AddReorderHandle(obj) {
	var div = $(document.createElement('a'));
	div.addClass('reorder-handle btn btn-default btn-sm');
  div.append($('<i class="fa fa-arrows-v"></i>'));
	return div;
}

function AddTooltip(el, text) {
  // assumes a jQuery object representing a DOM element
  el.attr('data-toggle', 'tooltip');
  el.attr('data-placement', 'top');
  el.attr('title', text);
  el.tooltip();
  return el;
}


function AddRepresentationToggle(obj) {
	
	var radioDiv = $(document.createElement('div'));
	radioDiv.addClass('griddl-component-head-btngrp-container btn-group btn-group-sm');
  radioDiv.attr('role', 'group');
  radioDiv.attr('data-toggle', 'buttons');
	
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
    var wrap = $("<label class='griddl-component-head-btngrp-button btn btn-default'></label>");
		var radioButton = $(document.createElement('input'));
    wrap.text(conversions[i].label);
		radioButton.attr('type', 'radio');
		radioButton.attr('name', radioName);
		if (i == 0) { wrap.addClass('active'); }
    wrap.prepend(radioButton);
		radioDiv.append(wrap);
		
		wrap.on('click', conversions[i].fn);
	}
	
	return radioDiv;
}
function AddInvokeButton(obj) {
	
	var button = $(document.createElement('button'));
	
	button.addClass(obj.execButtonClass).addClass('btn btn-default btn-sm');
	button.html(obj.execButtonText);
	
	button.on('click', function() { obj.exec(); });
	
	return button;
}
function AddUploadButton(obj) {
	
	// interface required:
	//  obj.setArrayBuffer
	//    OR
	//  obj.setText
	
	// we also want drag-n-drop
	
	var button = $(document.createElement('button'));
	button.addClass('griddl-component-head-upload btn btn-default btn-sm');
	button.html('<i class="fa fa-lg fa-cloud-upload"></i>');
  AddTooltip(button, "Upload");
	
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
	button.addClass('griddl-component-head-download btn btn-default btn-sm');
	button.html('<i class="fa fa-lg fa-cloud-download"></i>');
  AddTooltip(button, "Download");
	
	button.on('click', function() {
		var a = document.createElement('a');
		a.href = obj.datauri();
		a.download = obj.name + obj.ext;
		a.click();
	});
	
	return button;
}
function AddTypeLabel(obj) {
	
	var typeLabel = $(document.createElement('label'));
	typeLabel.addClass('griddl-component-head-type');
	typeLabel.html(obj.type);
	return typeLabel;
}
function AddNameBox(obj) {
	
	var nameBox = $(document.createElement('input'));
	nameBox.attr('type', 'text');
	nameBox.attr('value', obj.name);
	nameBox.addClass('griddl-component-head-name').addClass('form-control').addClass('input-sm');
	
	nameBox.on('blur', function(e) {
		RenameObj(obj, this.value);
		obj.div.parent().attr('id', obj.name + 'Component');
		MarkDirty();
	});
	
	return nameBox;
}
function AddMinimizeButton(obj) {
	
	// instead of just setting display:none, perhaps this should remove the clientDiv from the DOM altogether
	// this will save DOM resources
	
	var button = $(document.createElement('button'));
	button.attr('type', 'button');
  button = AddTooltip(button, 'Expand/Collapse');
	button.addClass('griddl-component-head-minmax btn btn-default btn-sm');

  minus = "fa-minus";
  plus = "fa-plus";

  $icon = $("<i class='fa'></i>");
  $icon.addClass(obj.visible ? minus : plus);
  button.append($icon);
	
	button.on('click', function() {
		if (obj.visible) { Hide(obj); } else { Show(obj); }
		MarkDirty();
	});
	
	return button;
}
function AddDestroyButton(obj) {
	
	var button = $(document.createElement('button'));
	button.attr('type', 'button');
  button = AddTooltip(button, 'Delete Component');
	button.addClass('griddl-component-head-remove btn btn-default btn-sm');
  button.append($("<i class='fa fa-lg fa-trash-o'></i>"));
	
	button.on('click', null, obj, confirmDelete);
	
	return button;
}

function confirmDelete(event) {
  var obj = event.data;
  var modal = $("<div class='modal'><div class='modal-dialog modal-sm'><div class='modal-content'><div class='modal-header text-center'><h3></h3><button class='btn btn-success'>Confirm</button><button data-dismiss='modal' class='btn btn-danger'>Cancel</button></div></div></div></div>");
  $('h3', modal).text("Delete " + obj.name + "?");
  $('body').append(modal);

  $('.btn-success', modal).on('click', function(event) {
    DeleteObj(obj);
    obj.div.parent().remove();
    MarkDirty(obj);
    $('.modal').modal('hide');
  });

  modal.modal('show');
}

var Show = Components.Show = function(obj) {
	
	obj.div.removeClass('griddl-component-body-hidden');
	obj.div.parent().find('.griddl-component-head-minmax').find('i').removeClass(plus).addClass(minus);
	obj.visible = true;
	
	// this fixes this bug: when a component containing a codemirror was initially hidden, and then we maximized, the text would not appear
	if (obj.codemirror) { obj.codemirror.refresh(); }
}
var Hide = Components.Hide = function(obj) {
	obj.div.addClass('griddl-component-body-hidden');
	obj.div.parent().find('.griddl-component-head-minmax').find('i').removeClass(minus).addClass(plus);
	obj.visible = false;
};
var ShowAll = Components.ShowAll = function() { Griddl.Core.objs.forEach(function(obj) { Show(obj); }); };
var HideAll = Components.HideAll = function() { Griddl.Core.objs.forEach(function(obj) { Hide(obj); }); };

function Upload() {
	
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
}

// all references to Griddl.Core.objs are collected here, in case we want to move objs to some other place
function AddObj(obj) { Griddl.Core.objs[obj.name] = obj; Griddl.Core.objs.push(obj); MakeSortable(); }
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
function UniqueName(type, n) { while (Griddl.Core.objs[type + n.toString()]) { n++; } return type + n.toString(); }
function MarkDirty() {
	
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
			var c = uint6ToB64(nUint24 >>> 06 & 63);
			var d = uint6ToB64(nUint24 >>> 00 & 63);
			sB64Enc += String.fromCharCode(a, b, c, d);
			nUint24 = 0;
		}
	}
	
	return sB64Enc.replace(/A(?=A$|$)/g, "=");
}

// bug: if the page height is too small, Section.draw creates infinite pages to try to fit the text

function UnitSize(unit) { return {in:1,cm:1/2.54,mm:1/25.4,pt:1/72}[unit]; }


// the Document deals with overall settings, as well as word processing / slide deck mode
// in slide deck mode, you don't need Sections - every component goes on its own page
// Document has a Generate and Export to PDF button
var Document = Components.document = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.representationLabel = 'HTML';
	
	this.div = null;
	
	this.canvasDocument = null; // replace all references to canvasDocument with 'ctx'
	this.ctx = null; // set by GenerateDocument
	
	if (typeof window != 'undefined')
	{
		this.parentDiv = document.getElementById('output'); // magic id, need to parametrize or something
	}
	else
	{
		this.parentDiv = null;
	}
	
	// this to be set by setData
	this.unit = null;
	this.page = { width : null , height : null };
	this.pixelsPerUnit = null;
	this.cubitsPerUnit = null;
	this.snapGrid = { gridlineSpacing : null , gridlineHighlight : null };
	
	this.pageNumbering = {};
	this.pageNumbering.hAlign = json.params.pageNumbering.hAlign;
	this.pageNumbering.vAlign = json.params.pageNumbering.vAlign;
	this.pageNumbering.hOffset = json.params.pageNumbering.hOffset;
	this.pageNumbering.vOffset = json.params.pageNumbering.vOffset;
	this.pageNumbering.firstPage = json.params.pageNumbering.firstPage;
	
	this.setData(json.params);
	
	this.dom = {};
	this.dom.unitSelector = null;
	this.dom.pageWidth = null;
	this.dom.pageHeight = null;
	this.dom.pixelsPerUnit = null;
	this.dom.pixelsPerUnitUnitSpan = null;
	this.dom.cubitsPerUnit = null;
	this.dom.cubitsPerUnitUnitSpan = null;
	this.dom.gridlineSpacingInput = null;
	this.dom.gridlineSpacingUnitSpan = null;
	this.dom.gridlineHighlightInput = null;
	this.dom.gridlineHighlightUnitSpan = null;
	
	this.sections = [];
};
Document.prototype.generate = function() {
	
	//console.log('Document.exec');
	
	// these should probably be pxPerUser and ptPerUser
	var params = {};
	params.unit = this.unit;
	params.pixelsPerUnit = this.pixelsPerUnit;
	params.cubitsPerUnit = this.cubitsPerUnit;
	
	if (typeof window != 'undefined')
	{
		params.div = document.getElementById('output');
		params.div.innerHTML = '';
		this.sections.forEach(function(section) { section.section = null; }); // all Component.Section -> Canvas.Section links need to be broken
	}
	
	var ctx = new Griddl.Canvas(params);
	Griddl.Canvas.griddlCanvas = ctx;
	this.ctx = ctx;
	
	// probably should parametrize this - store the component name in the JSON
	//ctx.styles = Core.MakeHash(Core.GetData(json.styles.componentName), json.styles.keyField);
	
	var section = null;
	
	for (var i = 0; i < Griddl.Core.objs.length; i++)
	{
		var obj = Griddl.Core.objs[i];
		
		if (obj.type == 'document')
		{
			
		}
		else if (obj.type == 'section')
		{
			section = obj;
			section.ctx = ctx;
			section.document = this;
			section.parse(); // this has to happen after section.ctx is set
			this.sections.push(section);
		}
		else if (obj.draw)
		{
			obj.section = section;
			obj.ctx = ctx;
			section.widgets.push(obj);
		}
		else
		{
			
		}
	}
	
	this.draw();
	
	return ctx; // this is for node
};
Document.prototype.exportToPdf = function() {
	
	var filename = document.getElementsByTagName('title')[0].innerText;
	
	var doc = this;
	
	Griddl.Canvas.drawPdf = true;
	this.exec();
	
	var RenderPdf = function() {
		
		Griddl.Canvas.drawPdf = false;
		
		//var text = new Griddl.Pdf(Griddl.Canvas.griddlCanvas).text; // the Canvas constructor sets Griddl.griddlCanvas whenever it is invoked
		var text = doc.ctx.ExportToPdf();
		
		var downloadLink = document.createElement('a');
		var url = window.URL;
		downloadLink.href = url.createObjectURL(new Blob([text], {type : 'text/pdf'}));
		downloadLink.download = filename + '.pdf';
		document.body.appendChild(downloadLink); // needed for this to work in firefox
		downloadLink.click();
		document.body.removeChild(downloadLink); // cleans up the addition above
	};
	
	if (window.MathJax) { MathJax.Hub.Queue(RenderPdf); } else { RenderPdf(); }
};
Document.prototype.add = function() {
	
	this.div = CreateComponentDiv($('#cells'), this);
	this.div.css('border', '1px solid gray');
	this.div.css('background-color', 'rgb(230,230,230)');
	
	this.addElements();
	
	this.refresh();
};
Document.prototype.addElements = function() {
	
	this.dom.unitSelector = $('<select id="unitSelector"><option>in</option><option>cm</option><option>mm</option><option>pt</option></select>');
	this.dom.pageWidth = $('<input type="text" id="pageWidth" value="8.5" style="text-align:right;width:50px"></input>');
	this.dom.pageHeight = $('<input type="text" id="pageHeight" value="11" style="text-align:right;width:50px"></input>');
	this.dom.pixelsPerUnit = $('<input type="text" id="pixelsPerUnit" value="72" style="text-align:center;width:50px"></input>');
	this.dom.pixelsPerUnitUnitSpan = $('<span id="unitResolution">in</span>');
	this.dom.cubitsPerUnit = $('<input type="text" id="cubitsPerUnit" value="100" style="text-align:center;width:50px"></input>');
	this.dom.cubitsPerUnitUnitSpan = $('<span id="unitUserspace">in</span>');
	this.dom.gridlineSpacingInput = $('<input type="text" id="gridlineSpacing" value="0.25" style="text-align:center;width:50px"></input>');
	this.dom.gridlineSpacingUnitSpan = $('<span id="unitSpacing">in</span>');
	this.dom.gridlineHighlightInput = $('<input type="text" id="gridlineHighlight" value="1.00" style="text-align:center;width:50px"></input>');
	this.dom.gridlineHighlightUnitSpan = $('<span id="unitHighlight">in</span>');
	
	var doc = this;
	
	this.dom.unitSelector[0].onchange = function() {
		
		doc.pixelsPerUnit = UnitSize(this.value) / UnitSize(doc.unit);
		doc.dom.pixelsPerUnit[0].value = doc.pixelsPerUnit;
		// also auto-adjust usersPerUnit?  probably not necessary
		
		doc.unit = this.value;
		doc.dom.pixelsPerUnitUnitSpan[0].innerText = this.value;
		doc.dom.cubitsPerUnitUnitSpan[0].innerText = this.value;
		doc.dom.gridlineSpacingUnitSpan[0].innerText = this.value;
		doc.dom.gridlineHighlightUnitSpan[0].innerText = this.value;
		
	};
	
	this.dom.pageWidth[0].onchange = function() { doc.page.width = parseFloat(this.value); };
	this.dom.pageHeight[0].onchange = function() { doc.page.height = parseFloat(this.value); };
	this.dom.pixelsPerUnit[0].onchange = function() { doc.pixelsPerUnit = parseFloat(this.value); };
	this.dom.cubitsPerUnit[0].onchange = function() { doc.cubitsPerUnit = parseFloat(this.value); };
	this.dom.gridlineSpacingInput[0].onchange = function() { doc.snapGrid.gridlineSpacing = parseFloat(this.value); };
	this.dom.gridlineHighlightInput[0].onchange = function() { doc.snapGrid.gridlineHighlight = parseFloat(this.value); };
	
	var table, tr, td, button;
	
	table = $('<table></table>');
	tr = $('<tr></tr>');
	td = $('<td></td>');
	button = $('<button></button>');
	button.addClass('griddl-component-head-generate-document');
	button.html('Generate');
	button.on('click', function() { doc.generate(); });
	td.append(button);
	tr.append(td);
	td = $('<td></td>');
	button = $('<button></button>');
	button.addClass('griddl-component-head-export-to-pdf');
	button.html('Export');
	button.on('click', function() { doc.exportToPdf(); });
	td.append(button);
	tr.append(td);
	table.append(tr);
	this.div.append(table);
	
	this.div.append($('<hr />'));
	
	table = $('<table></table>');
	table.append($('<tr><td colspan="4" style="font-weight:bold">Page dimensions</td></tr>'));
	tr = $('<tr><td></td><td>width:</td></tr>');
	td = $('<td></td>');
	td.append(this.dom.pageWidth);
	tr.append(td);
	td = $('<td rowspan="2"></td>');
	td.append(this.dom.unitSelector);
	tr.append(td);
	table.append(tr);
	tr = $('<tr><td></td><td>height:</td></tr>');
	td = $('<td></td>');
	td.append(this.dom.pageHeight);
	tr.append(td);
	table.append(tr);
	this.div.append(table);
	
	this.div.append($('<hr />'));
	
	table = $('<table></table>');
	table.append($('<tr><td colspan="4" style="font-weight:bold">User space units</td></tr>'));
	tr = $('<tr><td></td></tr>');
	td = $('<td></td>');
	td.append(this.dom.cubitsPerUnit);
	tr.append(td);
	td = $('<td>user space units per </td>');
	td.append(this.dom.cubitsPerUnitUnitSpan);
	tr.append(td);
	table.append(tr);
	this.div.append(table);
	
	this.div.append($('<hr />'));
	
	table = $('<table></table>');
	table.append($('<tr><td colspan="4" style="font-weight:bold">Resolution</td></tr>'));
	tr = $('<tr><td></td></tr>');
	td = $('<td></td>');
	td.append(this.dom.pixelsPerUnit);
	tr.append(td);
	td = $('<td>pixels per </td>');
	td.append(this.dom.pixelsPerUnitUnitSpan);
	tr.append(td);
	table.append(tr);
	this.div.append(table);
	
	this.div.append($('<hr />'));
	
	table = $('<table></table>');
	table.append($('<tr><td colspan="4" style="font-weight:bold">Snap grid</td></tr>'));
	tr = $('<tr><td></td><td>Gridline spacing:</td></tr>');
	td = $('<td></td>');
	td.append(this.dom.gridlineSpacingInput);
	tr.append(td);
	td = $('<td></td>');
	td.append(this.dom.gridlineSpacingUnitSpan);
	tr.append(td);
	table.append(tr);
	tr = $('<tr><td></td><td>Gridline highlight:</td></tr>');
	td = $('<td></td>');
	td.append(this.dom.gridlineHighlightInput);
	tr.append(td);
	td = $('<td></td>');
	td.append(this.dom.gridlineHighlightUnitSpan);
	tr.append(td);
	table.append(tr);
	this.div.append(table);
	
	var gui = new dat.GUI({autoPlace:false});
	var pageNumbering = gui.addFolder('page numbering');
	pageNumbering.add(this.pageNumbering, 'hAlign', ['left','center','right']);
	pageNumbering.add(this.pageNumbering, 'vAlign', ['top','center','bottom']);
	pageNumbering.add(this.pageNumbering, 'hOffset');
	pageNumbering.add(this.pageNumbering, 'vOffset');
	pageNumbering.add(this.pageNumbering, 'firstPage');
	this.div[0].appendChild(gui.domElement);
};
Document.prototype.refresh = function() {
	this.dom.unitSelector[0].value = this.unit;
	this.dom.pageWidth[0].value = this.page.width;
	this.dom.pageHeight[0].value = this.page.height;
	this.dom.pixelsPerUnit[0].value = this.pixelsPerUnit;
	this.dom.pixelsPerUnitUnitSpan[0].innerText = this.unit;
	this.dom.cubitsPerUnit[0].value = this.cubitsPerUnit;
	this.dom.cubitsPerUnitUnitSpan[0].innerText = this.unit;
	this.dom.gridlineSpacingInput[0].value = this.snapGrid.gridlineSpacing;
	this.dom.gridlineSpacingUnitSpan[0].innerText = this.unit;
	this.dom.gridlineHighlightInput[0].value = this.snapGrid.gridlineHighlight;
	this.dom.gridlineHighlightUnitSpan[0].innerText = this.unit;
};
Document.prototype.draw = function() {
	
	//console.log('Document.draw');
	
	this.sections.forEach(function(section) {
		section.draw();
		if (typeof window != 'undefined') { section.onhover(); }
	});
	
	// draw page numbers
};
Document.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.params = {};
	json.params.unit = this.unit;
	json.params.pageDimensions = {};
	json.params.pageDimensions.width = this.page.width;
	json.params.pageDimensions.height = this.page.height;
	json.params.pixelsPerUnit = this.pixelsPerUnit;
	json.params.cubitsPerUnit = this.cubitsPerUnit;
	json.params.snapGrid = {};
	json.params.snapGrid.gridlineSpacing = this.snapGrid.gridlineSpacing;
	json.params.snapGrid.gridlineHighlight = this.snapGrid.gridlineHighlight;
	return json;
};
Document.prototype.setData = function(params) {
	this.unit = params.unit;
	this.page.width = params.pageDimensions.width;
	this.page.height = params.pageDimensions.height;
	this.pixelsPerUnit = params.pixelsPerUnit;
	this.cubitsPerUnit = params.cubitsPerUnit;
	this.snapGrid.gridlineSpacing = params.snapGrid.gridlineSpacing; // hack, need to convert to user units eventually
	this.snapGrid.gridlineHighlight = params.snapGrid.gridlineHighlight;
};
Document.prototype.getText = function() {
	var json = this.write();
	var text = JSON.stringify(json.params);
	return text;
};
Document.prototype.representationToggle = function() {
	
	// we don't want to destroy the DOM elements, just hide them
	
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
		obj.addElements();
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
Document.New = function() {
	
	var json = {};
	json.type = 'document';
	json.name = UniqueName('document', 1);
	json.visible = true;
	json.params = {};
	json.params.unit = 'in';
	json.params.pageDimensions = {};
	json.params.pageDimensions.width = 850;
	json.params.pageDimensions.height = 1100;
	json.params.pixelsPerUnit = 100;
	json.params.cubitsPerUnit = 100;
	json.params.snapGrid = {};
	json.params.snapGrid.gridlineSpacing = 0.25;
	json.params.snapGrid.gridlineHighlight = 1.00;
	json.params.pageNumbering = {};
	json.params.pageNumbering.hAlign = 'center';
	json.params.pageNumbering.vAlign = 'bottom';
	json.params.pageNumbering.hOffset = 0;
	json.params.pageNumbering.vOffset = 50;
	json.params.pageNumbering.firstPage = false;
	
	var obj = new Document(json);
	obj.add();
	MarkDirty();
	AddObj(obj);
};

var Section = Components.section = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.text = json.text;
	this.words = null; // { text : string , line : null , box : Box } - this can be used for applications that require hovering over words
	this.wordMetrics = null;
	this.spaceWidth = null;
	this.minSpaceWidth= null;
	
	this.div = null;
	
	this.representationLabel = 'HTML';
	
	// set by GenerateDocument
	this.ctx = null;
	this.document = null;
	
	this.orientation = null;
	this.margin = null;
	
	this.style = null;
	this.font = null;
	this.fill = null;
	this.pitch = null;
	this.indent = null;
	this.nColumns = null;
	this.interColumnMargin = null;
	
	this.setData(json.params);
	
	// these are the HTML elements
	this.textarea = null;
	this.codemirror = null;
	this.portraitRadio = null;
	this.landscapRadio = null;
	this.lfMargin = null;
	this.rtMargin = null;
	this.tpMargin = null;
	this.btMargin = null;
	this.pitchInput = null;
	this.indentInput = null;
	this.styleInput = null;
	
	this.section = null; // Canvas.Section
	this.widgets = [];
};
Section.prototype.add = function() {
	
	this.div = CreateComponentDiv($('#cells'), this);
	this.div.css('border', '1px solid gray');
	this.div.css('background-color', 'rgb(230,230,230)');
	
	this.addElements2();
	
	this.refresh();
};
Section.prototype.addElements = function() {
	
	var table, tr, td;
	
	var section = this;
	
	this.textarea = $('<textarea></textarea>');
	this.portraitRadio = $('<input type="radio" name="' + this.name + '-orientation" checked></input>');
	this.landscapRadio = $('<input type="radio" name="' + this.name + '-orientation"        ></input>');
	this.lfMargin = $('<input type="text"></input>');
	this.rtMargin = $('<input type="text"></input>');
	this.tpMargin = $('<input type="text"></input>');
	this.btMargin = $('<input type="text"></input>');
	this.pitchInput = $('<input type="text"></input>');
	this.indentInput = $('<input type="text"></input>');
	this.styleInput = $('<input type="text"></input>');
	
	//this.textarea[0].onchange = function(e) { section.text = this.value; };
	this.portraitRadio[0].onchange = function(e) { section.orientation = this.checked ? 'portrait' : 'landscape'; };
	this.landscapRadio[0].onchange = function(e) { section.orientation = this.checked ? 'landscape' : 'portrait'; };
	this.lfMargin[0].onchange = function(e) { section.margin.lf = parseFloat(this.value); };
	this.rtMargin[0].onchange = function(e) { section.margin.rt = parseFloat(this.value); };
	this.tpMargin[0].onchange = function(e) { section.margin.tp = parseFloat(this.value); };
	this.btMargin[0].onchange = function(e) { section.margin.bt = parseFloat(this.value); };
	this.pitchInput[0].onchange = function(e) { section.pitch = parseFloat(this.value); };
	this.indentInput[0].onchange = function(e) { section.indent = parseFloat(this.value); };
	this.styleInput[0].onchange = function(e) { section.style = this.value; };
	
	//this.textarea.css('margin', '1em');
	this.div.append(this.textarea);
	
	this.codemirror = CodeMirror.fromTextArea(section.textarea[0], { mode : 'plain' , smartIndent : false , lineNumbers : true , lineWrapping : true });
	this.codemirror.on('blur', function() { section.text = section.codemirror.getValue();  });
	this.codemirror.on('change', function() { MarkDirty(); });
	
	this.div.append($('<hr />'));
	
	table = $('<table></table>');
	table.append($('<tr><td colspan="2" style="font-weight:bold">Page orientation</td></tr>'));
	tr = table.append($('<tr></tr>'));
	tr.append($('<td>portrait</td>'));
	td = tr.append($('<td></td>'));
	td.append(this.portraitRadio);
	tr.append($('<td>landscape</td>'));
	td = tr.append($('<td></td>'));
	td.append(this.landscapRadio);
	this.div.append(table);
	
	this.div.append($('<hr />'));
	
	table = $('<table></table>');
	table.append($('<tr><td colspan="2" style="font-weight:bold">Page margin</td></tr>'));
	tr = $('<tr></tr>');
	tr.append($('<td style="text-align:right">left:</td>'));
	td = $('<td></td>');
	td.append(this.lfMargin);
	tr.append(td);
	table.append(tr);
	tr = $('<tr></tr>');
	tr.append($('<td style="text-align:right">right:</td>'));
	td = $('<td></td>');
	td.append(this.rtMargin);
	tr.append(td);
	table.append(tr);
	tr = $('<tr></tr>');
	tr.append($('<td style="text-align:right">top:</td>'));
	td = $('<td></td>');
	td.append(this.tpMargin);
	tr.append(td);
	table.append(tr);
	tr = $('<tr></tr>');
	tr.append($('<td style="text-align:right">bottom:</td>'));
	td = $('<td></td>');
	td.append(this.btMargin);
	tr.append(td);
	table.append(tr);
	this.div.append(table);
	
	this.div.append($('<hr />'));
	
	table = $('<table></table>');
	table.append($('<tr><td colspan="2" style="font-weight:bold">Text variables</td></tr>'));
	tr = $('<tr><td style="text-align:right">pitch:</td></tr>');
	td = $('<td></td>');
	td.append(this.pitchInput);
	tr.append(td);
	table.append(tr);
	tr = $('<tr><td style="text-align:right">indent:</td></tr>');
	td = $('<td></td>');
	td.append(this.indentInput);
	tr.append(td);
	table.append(tr);
	tr = $('<tr><td style="text-align:right">style:</td></tr>');
	td = $('<td></td>');
	td.append(this.styleInput);
	tr.append(td);
	table.append(tr);
	this.div.append(table);
};
Section.prototype.addElements2 = function() {
	
	var section = this;
	
	this.textarea = $('<textarea></textarea>');
	this.div.append(this.textarea);
	
	this.codemirror = CodeMirror.fromTextArea(section.textarea[0], { mode : 'plain' , smartIndent : false , lineNumbers : true , lineWrapping : true });
	this.codemirror.on('blur', function() { section.text = section.codemirror.getValue();  });
	this.codemirror.on('change', function() { MarkDirty(); });
	
	this.div.append($('<hr />'));
	
	var gui = new dat.GUI({autoPlace:false});
	gui.add(this, 'generate');
	gui.add(this, 'exportToPdf');
	gui.add(this, 'orientation', ['portrait','landscape']);
	var margin = gui.addFolder('margin');
	margin.add(this.margin, 'lf');
	margin.add(this.margin, 'rt');
	margin.add(this.margin, 'tp');
	margin.add(this.margin, 'bt');
	
	this.div[0].appendChild(gui.domElement);
	
	this.div.append($('<hr />'));
	
	var gui = new dat.GUI({autoPlace:false});
	gui.add(this, 'style');
	gui.add(this, 'font');
	gui.addColor(this, 'fill');
	gui.add(this, 'pitch');
	gui.add(this, 'indent');
	gui.add(this, 'nColumns', [1, 2, 3, 4]);
	gui.add(this, 'interColumnMargin');
	
	this.div[0].appendChild(gui.domElement);
};
Section.prototype.refresh = function() {
	
	// set the HTML buttons and such according to the object state - call this when the state changes from outside the HTML buttons
	
	//this.textarea[0].value = this.text; // we need to figure out whether the section contains the text or whether we put it in a paragraphs
	//this.portraitRadio[0].checked = (this.orientation == 'portrait');
	//this.landscapRadio[0].checked = (this.orientation == 'landscape');
	//this.lfMargin[0].value = this.margin.lf;
	//this.rtMargin[0].value = this.margin.rt;
	//this.tpMargin[0].value = this.margin.tp;
	//this.btMargin[0].value = this.margin.bt;
	//this.pitchInput[0].value = this.pitch;
	//this.indentInput[0].value = this.indent;
	//this.styleInput[0].value = this.style;
	
	this.codemirror.getDoc().setValue(this.text);
};
Section.prototype.parse = function() {
	
	this.wordize();
};
Section.prototype.calculateWordMetrics = function() {
	
	//this.ctx.SetStyle(this.style);
	this.ctx.font = this.font;
	
	this.wordMetrics = [];
	
	// here is where we would do fancier stuff like inline spans with different fonts, tabs, roll-your-own justification via variable spacing, etc.
	for (var i = 0; i < this.words.length; i++)
	{
		var word = this.words[i];
		var widthCu = this.ctx.measureText(word).width;
		this.wordMetrics.push(widthCu);
	}
	
	//this.spaceWidth = 10; // this is a magic number that miraculously worked
	this.spaceWidth = this.ctx.fontSizeCu * 0.75;
	this.minSpaceWidth = this.ctx.fontSizeCu * 0.25;
	//this.spaceWidth = this.ctx.measureText(' ').width; // the Opentype measureText doesn't work here
};
Section.prototype.generate = function() {
	
};
Section.prototype.exportToPdf = function() {
	
};
Section.prototype.draw = function() {
	
	// This is a long function, and sort of the master drawing function.  What happens here:
	// 1. determine the minimum number of pages needed to accomodate all widgets
	// 2. create that number of blank page boxes
	// 3. perform the occlusion
	// 4. determine the width of each line of text - skip over boxes that are not tall enough to accomodate even a single line of text
	// 5. lay out text, adding new pages as necessary (currently linebreaking is done naively, but later will need to use Knuth-Plass)
	// 6. loop through the lines of text and draw them, calling NewPage/SetActivePage as necessary (we need to implement multi-page sections)
	// 7. draw dotted page breaks on screen (screen only, not PDF)
	// 8. draw each widget
	
	var debug = true;
	
	if (debug) { console.log(`drawing section "${this.name}"`); }
	
	this.clear();
	
	// perhaps check that orientation is either 'portrait' or 'landscape'
	var wd = ((this.orientation == 'portrait') ? this.document.page.width : this.document.page.height) * this.document.cubitsPerUnit;
	var hg = ((this.orientation == 'portrait') ? this.document.page.height : this.document.page.width) * this.document.cubitsPerUnit;
	
	var boxes = [];
	
	// 1. determine the minimum number of pages needed to accomodate all widgets
	var nPages = 1;
	for (var i = 0; i < this.widgets.length; i++)
	{
		var widget = this.widgets[i];
		if (widget.setSize) { widget.setSize(); }
		nPages = Math.max(nPages, Math.ceil(widget.box.bt / hg, 1));
	}
	
	if (debug) { console.log(`pages needed by widgets: ${nPages}`); }
	
	var columnWidth = (wd - this.margin.lf - this.margin.rt - this.interColumnMargin * (this.nColumns - 1)) / this.nColumns;
	
	// 2. create that number of blank page boxes
	for (var i = 0; i < nPages; i++)
	{
		for (var k = 0; k < this.nColumns; k++)
		{
			var lf = this.margin.lf + (columnWidth + this.interColumnMargin) * k;
			boxes.push(MakeBox({lf:lf,rt:lf+columnWidth,tp:i*hg+this.margin.tp,bt:(i+1)*hg-this.margin.bt}));
		}
	}
	
	if (debug)
	{
		console.log('blank page boxes:');
		boxes.forEach(function(b) { console.log('{lf:'+b.lf+',rt:'+b.rt+',tp:'+b.tp+',bt:'+b.bt+'}'); });
	}
	
	// 3. perform the occlusion
	for (var i = 0; i < this.widgets.length; i++)
	{
		var widget = this.widgets[i];
		boxes = Occlude(boxes, widget.box);
	}
	
	if (debug)
	{
		console.log('occluded boxes:');
		boxes.forEach(function(b) { console.log('{lf:'+b.lf+',rt:'+b.rt+',tp:'+b.tp+',bt:'+b.bt+'}'); });
	}
	
	// 4. determine the width of each line of text - skip over boxes that are not tall enough to accomodate even a single line of text
	var lines = []; // { text , wd , lf , bt }
	
	if (this.pitch < 0.01) { throw new Error('line pitch too small'); }
	
	var boxIndex = 0;
	var box = boxes[boxIndex];
	var bt = box.tp + this.pitch;
	
	while (true)
	{
		if (bt > box.bt)
		{
			boxIndex++;
			
			if (boxIndex >= boxes.length)
			{
				//lines.push({ text : null , lf : this.margin.lf , bt : null , wd : this.wd - this.margin.lf - this.margin.rt }); // run out of pages - here be dragons and endless blank pages
				break;
			}
			else
			{
				box = boxes[boxIndex];
				bt = box.tp;
			}
		}
		else
		{
			lines.push({ text : null , lf : box.lf , bt : bt , wd : box.wd });
		}
		
		bt += this.pitch;
	}
	
	if (debug)
	{
		console.log('lines:');
		
		for (var i = 0; i < lines.length; i++)
		{
			var l = lines[i];
			console.log('{lf:'+l.lf+',bt:'+l.bt+',wd:'+l.wd+'}');
		}
	}
	
	// 5. lay out text (currently linebreaking is done naively, but later will need to use Knuth-Plass)
	
	// under naive linebreaking, we call fillText for the whole line
	// under justified linebreaking or typeset, we call fillText for each word
	
	this.calculateWordMetrics();
	var lineWidths = lines.map(x => x.wd);
	lineWidths.push(columnWidth); // the endless pages at the end - here be dragons
	var lineTexts = LinebreakNaive(lineWidths, this.words, this.wordMetrics, this.spaceWidth);
	//var positionss = LinebreakJustify(lineWidths, this.words, this.wordMetrics, this.spaceWidth, this.minSpaceWidth);
	var usingPositions = false;
	
	if (usingPositions)
	{
		if (debug)
		{
			console.log('positions:');
			positions.forEach(function(p) { console.log('{x:'+p.x+',width:'+p.width+',text:"'+p.text+'"}'); });
		}
	}
	else
	{
		// now we have parallel arrays - one of empty lines and their coordinates, and one of line texts
		// we loop through the line texts, assigning them to the empty lines
		// if the list of empty lines runs out, create new empty lines, incrementing maxPages as necessary
		
		var matching = Math.min(lines.length, lineTexts.length);
		for (var i = 0; i < matching; i++) { lines[i].text = lineTexts[i]; }
		
		if (lineTexts.length > lines.length)
		{
			var origLinesLength = lines.length;
			var excess = lineTexts.length - lines.length;
			
			// duplicated in loop below
			var tp = nPages * hg + this.margin.tp;
			var bt = tp + this.pitch;
			nPages++;
			var pageBottom = nPages * hg - this.margin.bt; // note than nPages is incremented between the usage three lines above and the usage here
			
			var currentColumn = 0;
			
			for (var i = 0; i < excess; i++)
			{
				// this needs to be reworked to allow for columns
				var line = { text : lineTexts[origLinesLength + i] , lf : this.margin.lf + (columnWidth + this.interColumnMargin) * currentColumn , bt : bt , wd : columnWidth };
				lines.push(line);
				
				bt += this.pitch;
				
				if (bt > pageBottom)
				{
					currentColumn++;
					
					if (currentColumn >= this.nColumns)
					{
						currentColumn = 0;
						tp = nPages * hg + this.margin.tp;
						bt = tp + this.pitch;
						nPages++;
						pageBottom = nPages * hg - this.margin.bt; // note than nPages is incremented between the usage three lines above and the usage here
					}
					else
					{
						bt = tp + this.pitch;
					}
				}
			}
		}
		
		if (debug)
		{
			console.log('lines with text:');
			
			for (var i = 0; i < lines.length; i++)
			{
				var l = lines[i];
				if (l.text !== null) { console.log('{lf:'+l.lf+',bt:'+l.bt+',wd:'+l.wd+',text:"'+l.text+'"}'); }
			}
		}
	}
	
	// set/create Canvas Section, setting dimensions according to the pageCount
	if (this.section)
	{
		this.section.SetDimensions(nPages, wd, hg);
		this.ctx.SetActiveSection(this.section);
	}
	else
	{
		this.section = this.ctx.NewSection(wd, hg, nPages);
		if (typeof window != 'undefined') { this.document.parentDiv.appendChild(this.section.div); }
	}
	
	// 6. loop through the lines of text and draw them, calling Section.SetDimensions to add pages as necessary
	// at some point, we might want to implement some inline style markup - the equivalent of <span>s
	// if it's limited to color, we can just move the style setting below into the loop
	// it the spans change the font, well.  then we need to change the whole linebreaking algo
	
	this.ctx.fillStyle = 'rgb(0,0,0)'; // this.fill
	this.ctx.textBaseline = 'bottom'; // this is tied to how we use y in SetType
	
	if (usingPositions)
	{
		
	}
	else
	{
		for (var i = 0; i < lines.length; i++)
		{
			var line = lines[i];
			
			if (line.text !== null)
			{
				this.ctx.fillText(line.text, line.lf, line.bt);
			}
		}
	}
	
	// 7. draw dotted page breaks on screen (screen only, not PDF)
	for (var i = 1; i < nPages; i++)
	{
		// this is only to be drawn on screen, not on the PDF.  so we instruct Canvas to briefly suspend pdf output
		this.ctx.pausePdfOutput();
		this.ctx.setLineDash([5, 5]);
		this.ctx.strokeStyle = 'rgb(128,128,128)';
		this.ctx.lineWidth = 1;
		this.ctx.beginPath();
		this.ctx.moveTo(0, hg * i);
		this.ctx.lineTo(wd, hg * i);
		this.ctx.stroke();
		this.ctx.resumePdfOutput();
	}
	
	// 8. draw each widget
	this.widgets.forEach(function(widget) { widget.draw(); });
};
Section.prototype.onhover = function() {
	
	var section = this;
	
	section.section.canvasContext.canvas.onmousemove = function(e) {
		
		section.ctx.SetActiveSection(section.section); // surely onenter instead
		
		var x = e.offsetX;
		var y = e.offsetY;
		
		// this must be a for loop instead of a forEach because we break on first hit
		for (var i = 0; i < section.widgets.length; i++)
		{
			var widget = section.widgets[i];
			
			if (widget.box.lf <= x && x <= widget.box.rt && widget.box.tp <= y && y <= widget.box.bt)
			{
				widget.onhover();
				return;
			}
			
			if (widget.subs) // subs can be outside the area of the parent's box
			{
				for (var j = 0; j < widget.subs.length; j++)
				{
					var sub = widget.subs[j];
					
					var tx = x - widget.box[sub.box.anchorX];
					var ty = y - widget.box[sub.box.anchorY];
					
					if (sub.box.lf <= tx && tx <= sub.box.rt && sub.box.tp <= ty && ty <= sub.box.bt)
					{
						sub.onhover();
						return;
					}
				}
			}
		}
		
		// put margin arrows here
	};
};
Section.prototype.clear = function() {
	
	if (this.section)
	{
		this.ctx.SetActiveSection(this.section);
		this.ctx.clearRect(0, 0, this.section.canvasContext.canvas.width, this.section.canvasContext.canvas.height);
	}
};
Section.prototype.drawGridlines = function() {
	
	// need to rework this to account for multiple pages
	// currently this only draws on the active page
	
	var ctx = this.ctx;
	var gridlineSpacing = this.document.snapGrid.gridlineSpacing * this.document.pixelsPerUnit;
	var gridlineHighlight = this.document.snapGrid.gridlineHighlight * this.document.pixelsPerUnit;
	
	var width = ctx.canvas.width;
	var height = ctx.canvas.height;
	
	// we could change the x and y loops below to start at the medians and radiate outward, in order to guarantee a median line
	// as is, the x == medianX test below will fail if medianX is not a multiple of spacing
	var medianX = width / 2;
	var medianY = height / 2;
	
	ctx.lineWidth = 1;
	
	// we cache all the lines and then draw them at the end, because we want darker lines to be drawn over lighter lines
	var todraw = [ [] , [] , [] ];
	
	for (var x = 0; x < width; x += gridlineSpacing)
	{
		var line = {x0:x+0.5,y0:0,x1:x+0.5,y1:height};
		
		if (x == medianX)
		{
			todraw[2].push(line);
		}
		else if (x % gridlineHighlight == 0)
		{
			todraw[1].push(line);
		}
		else
		{
			todraw[0].push(line);
		}
	}
	
	for (var y = 0; y < height; y += gridlineSpacing)
	{
		var line = {x0:0,y0:y+0.5,x1:width,y1:y+0.5};
		
		if (y == medianY)
		{
			todraw[2].push(line);
		}
		else if (y % gridlineHighlight == 0)
		{
			todraw[1].push(line);
		}
		else
		{
			todraw[0].push(line);
		}
	}
	
	var styles = [ 'rgb(200,200,200)' , 'rgb(100,100,100)' , 'rgb(0,0,0)' ];
	
	for (var i = 0; i < todraw.length; i++)
	{
		ctx.strokeStyle = styles[i];
		
		for (var j = 0; j < todraw[i].length; j++)
		{
			ctx.drawLine(todraw[i][j].x0, todraw[i][j].y0, todraw[i][j].x1, todraw[i][j].y1);
		}
	}
};
Section.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.text = this.text;
	json.params = {};
	json.params.orientation = this.orientation;
	json.params.margin = {};
	json.params.margin.top = this.margin.tp;
	json.params.margin.left = this.margin.lf;
	json.params.margin.right = this.margin.rt;
	json.params.margin.bottom = this.margin.bt;
	json.params.pitch = this.pitch;
	json.params.indent = this.indent;
	json.params.style = this.style;
	//json.params.variables = this.variables;
	json.params.font = this.font;
	json.params.fill = this.fill;
	json.params.nColumns = this.nColumns;
	json.params.interColumnMargin = this.interColumnMargin;
	return json;
};
Section.prototype.setData = function(params) {
	this.orientation = params.orientation;
	this.margin = {};
	this.margin.tp = params.margin.top;
	this.margin.lf = params.margin.left;
	this.margin.rt = params.margin.right;
	this.margin.bt = params.margin.bottom;
	this.pitch = params.pitch;
	this.indent = params.indent;
	this.style = params.style;
	this.nColumns = params.nColumns;
	this.interColumnMargin = params.interColumnMargin;
	this.font = params.font;
	this.fill = params.fill;
};
Section.prototype.getText = function() {
	var json = this.write();
	var text = JSON.stringify(json.params);
	return text;
};
Section.prototype.representationToggle = function() {
	
	var obj = this;
	var codemirror = null;
	
	var TextToOther = function() {
		
		obj.div.html(''); // ideally, the toggle should just deal with the metadata, not the section text.  that requires a reworking here - we don't want to clear the entire div, just the metadata part.  this will require another div split, so that we have:
		// component div
		//  header div
		//  body div - typically we clear/regenerate this on toggle, but we don't want to do that for Sections
		//   text div
		//   metadata div - for Sections, clear/regenerate only this on toggle
		
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
		obj.addElements();
		obj.refresh();
		
		MarkDirty();
	};
	
	var OtherToText = function() {
		
		obj.div.html(''); // no - need to keep the data and only clear the metadata part
		
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
Section.prototype.wordize = function() {
	
	// Markdown syntax:
	//
	// Heading
	// =======
	// 
	// Sub-heading
	// -----------
	// 
	// ### Another deeper heading
	// 
	// Paragraphs are separated
	// by a blank line.
	// 
	// Leave 2 spaces at the end of a line to do a  
	// line break
	// 
	// *italic*, **bold**, `monospace`, ~~strikethrough~~
	// 
	// Shopping list:
	// 
	// * apples
	// * oranges
	// * pears
	// 
	// Numbered list:
	// 
	// 1. apples
	// 2. oranges
	// 3. pears
	// 
	// The rain---not the reign---in
	// Spain.
	// 
	// A [link](http://example.com).
	
	
	this.words = [];
	var word = '';
	
	var k = 0;
	
	while (k < this.text.length)
	{
		var c = this.text[k];
		var n = c.charCodeAt();
		
		if (n == 32 || n == 9 || n == 13 || n == 10)
		{
			if (word.length > 0) { this.words.push(word); }
			word = '';
		}
		else
		{
			word += c;
		}
		
		k++;
	}
	
	if (word.length > 0)
	{
		this.words.push(word);
	}
};
function Occlude(boxes, occ) {
	
	var newboxes = [];
	
	for (var i = 0; i < boxes.length; i++)
	{
		var box = boxes[i];
		
		if (occ.lf > box.lf && occ.rt < box.rt && occ.tp > box.tp && occ.bt < box.bt) // 0 edges blocked
		{
			newboxes.push(MakeBox({tp:box.tp,bt:occ.tp,lf:box.lf,rt:box.rt})); // tp
			newboxes.push(MakeBox({tp:occ.tp,bt:occ.bt,lf:box.lf,rt:occ.lf})); // lf
			newboxes.push(MakeBox({tp:occ.tp,bt:occ.bt,lf:occ.rt,rt:box.rt})); // rt
			newboxes.push(MakeBox({tp:occ.bt,bt:box.bt,lf:box.lf,rt:box.rt})); // bt
		}
		else if (occ.lf > box.lf && occ.rt < box.rt && occ.tp > box.tp && occ.bt >= box.bt) // bt edge blocked 
		{
			newboxes.push(MakeBox({tp:box.tp,bt:occ.tp,lf:box.lf,rt:box.rt})); // tp
			newboxes.push(MakeBox({tp:occ.tp,bt:occ.bt,lf:box.lf,rt:occ.lf})); // lf
			newboxes.push(MakeBox({tp:occ.tp,bt:occ.bt,lf:occ.rt,rt:box.rt})); // rt
		}
		else if (occ.lf > box.lf && occ.rt >= box.rt && occ.tp > box.tp && occ.bt < box.bt) // rt edge blocked 
		{
			newboxes.push(MakeBox({tp:box.tp,bt:occ.tp,lf:box.lf,rt:box.rt})); // tp
			newboxes.push(MakeBox({tp:occ.tp,bt:occ.bt,lf:box.lf,rt:occ.lf})); // lf
			newboxes.push(MakeBox({tp:occ.bt,bt:box.bt,lf:box.lf,rt:box.rt})); // bt
		}
		else if (occ.lf <= box.lf && occ.rt < box.rt && occ.tp > box.tp && occ.bt < box.bt) // lf edge blocked 
		{
			newboxes.push(MakeBox({tp:box.tp,bt:occ.tp,lf:box.lf,rt:box.rt})); // tp
			newboxes.push(MakeBox({tp:occ.tp,bt:occ.bt,lf:occ.rt,rt:box.rt})); // rt
			newboxes.push(MakeBox({tp:occ.bt,bt:box.bt,lf:box.lf,rt:box.rt})); // bt
		}
		else if (occ.lf > box.lf && occ.rt < box.rt && occ.tp <= box.tp && occ.bt < box.bt) // tp edge blocked 
		{
			newboxes.push(MakeBox({tp:occ.tp,bt:occ.bt,lf:box.lf,rt:occ.lf})); // lf
			newboxes.push(MakeBox({tp:occ.tp,bt:occ.bt,lf:occ.rt,rt:box.rt})); // rt
			newboxes.push(MakeBox({tp:occ.bt,bt:box.bt,lf:box.lf,rt:box.rt})); // bt
		}
		else if (occ.lf > box.lf && occ.rt >= box.rt && occ.tp > box.tp && occ.bt >= box.bt) // rt bt edges bocked
		{
			newboxes.push(MakeBox({tp:box.tp,bt:occ.tp,lf:box.lf,rt:box.rt})); // tp
			newboxes.push(MakeBox({tp:occ.tp,bt:box.bt,lf:box.lf,rt:occ.lf})); // bt lf
		}
		else if (occ.lf <= box.lf && occ.rt < box.rt && occ.tp > box.tp && occ.bt >= box.bt) // lf bt edges bocked
		{
			newboxes.push(MakeBox({tp:box.tp,bt:occ.tp,lf:box.lf,rt:box.rt})); // tp
			newboxes.push(MakeBox({tp:occ.tp,bt:box.bt,lf:occ.rt,rt:box.rt})); // bt rt
		}
		else if (occ.lf > box.lf && occ.rt >= box.rt && occ.tp <= box.tp && occ.bt < box.bt) // rt tp edges bocked
		{
			newboxes.push(MakeBox({tp:occ.bt,bt:box.bt,lf:box.lf,rt:box.rt})); // bt
			newboxes.push(MakeBox({tp:box.tp,bt:occ.bt,lf:box.lf,rt:occ.lf})); // tp lf
		}
		else if (occ.lf <= box.lf && occ.rt < box.rt && occ.tp <= box.tp && occ.bt < box.bt) // lf tp edges bocked
		{
			newboxes.push(MakeBox({tp:occ.bt,bt:box.bt,lf:box.lf,rt:box.rt})); // bt
			newboxes.push(MakeBox({tp:box.tp,bt:occ.bt,lf:occ.rt,rt:box.rt})); // tp rt
		}
		else if (occ.lf <= box.lf && occ.rt >= box.rt && occ.tp > box.tp && occ.bt >= box.bt) // lf rt bt edges blocked
		{
			newboxes.push(MakeBox({tp:box.tp,bt:occ.tp,lf:box.lf,rt:box.rt}));
		}
		else if (occ.lf > box.lf && occ.rt >= box.rt && occ.tp <= box.tp && occ.bt >= box.bt) // tp bt rt edges blocked
		{
			newboxes.push(MakeBox({tp:box.tp,bt:box.bt,lf:box.lf,rt:occ.lf}));
		}
		else if (occ.lf <= box.lf && occ.rt < box.rt && occ.tp <= box.tp && occ.bt >= box.bt) // tp bt lf edges blocked
		{
			newboxes.push(MakeBox({tp:box.tp,bt:box.bt,lf:occ.rt.lf,rt:box.rt}));
		}
		else if (occ.lf <= box.lf && occ.rt >= box.rt && occ.tp <= box.tp && occ.bt < box.bt) // lf rt tp edges blocked
		{
			newboxes.push(MakeBox({tp:occ.bt,bt:box.bt,lf:box.lf,rt:box.rt}));
		}
		else if (occ.lf <= box.lf && occ.rt >= box.rt && occ.tp <= box.tp && occ.bt >= box.bt)
		{
			// box is entirely occluded, nothing passes through to newbox
		}
		else
		{
			newboxes.push(box);
		}
	}
	
	return newboxes;
}
Section.New = function() {
	
	var json = {};
	json.type = 'section';
	json.name = UniqueName('section', 1);
	json.visible = true;
	json.text = '';
	json.params = {};
	json.params.orientation = 'portrait';
	json.params.margin = {};
	json.params.margin.top = 100;
	json.params.margin.left = 100;
	json.params.margin.right = 100;
	json.params.margin.bottom = 100;
	json.params.pitch = 25;
	json.params.indent = 25;
	json.params.style = '';
	//json.params.variables = this.variables;
	json.params.font = '12pt serif';
	json.params.fill = 'rgb(0,0,0)';
	json.params.nColumns = 1;
	json.params.interColumnMargin = 50;
	
	var obj = new Section(json);
	obj.add();
	MarkDirty();
	AddObj(obj);
};

function Wordize(text) {
	
	// copied from Section, but the stuff in Section remains because we might want to elaborate on the syntax
	// this simpler wordize algo should be used for stuff like titles and captions
	
	var words = [];
	var word = '';
	
	var k = 0;
	
	while (k < text.length)
	{
		var c = text[k];
		var n = c.charCodeAt();
		
		if (n == 32 || n == 9 || n == 13 || n == 10)
		{
			if (word.length > 0) { words.push(word); }
			word = '';
		}
		else
		{
			word += c;
		}
		
		k++;
	}
	
	if (word.length > 0)
	{
		words.push(word);
	}
	
	return words;
};
function LinebreakNaive(lineWidths, words, wordMetrics, spaceWidth) {
	
	var lineTexts = [];
	
	var lineText = '';
	var lineIndex = 0;
	var currentLineWidth = lineWidths[lineIndex];
	
	var textWidth = 0;
	
	for (var i = 0; i < words.length; i++)
	{
		var word = words[i];
		var wordWidth = wordMetrics[i];
		
		if (textWidth > 0) { textWidth += spaceWidth; }
		textWidth += wordWidth;
		
		if (textWidth > currentLineWidth)
		{
			lineTexts.push(lineText);
			lineText = '';
			lineIndex++;
			textWidth = 0;
			
			if (lineIndex >= lineWidths.length)
			{
				currentLineWidth = lineWidths[lineWidths.length - 1];
			}
			else
			{
				currentLineWidth = lineWidths[lineIndex];
			}
		}
		else
		{
			if (lineText.length > 0) { lineText += ' '; }
			lineText += word;
		}
	}
	
	if (lineText.length > 0) { lineTexts.push(lineText); }
	
	return lineTexts;
}
function LinebreakJustify(lineWidths, words, wordMetrics, optimalSpaceWidth, minSpaceWidth) {
	
	// so this returns a list of lists of word position objects, detailing the x-coordinate of the word
	// [ [ { text : "foo" , x : 100 } , { text : "bar" , x : 200 } ] ]
	
	var positionss = [];
	var positions = [];
	
	var lineIndex = 0;
	var currentLineWidth = lineWidths[lineIndex];
	
	var wordCount = 0;
	var textWidth = 0;
	var oldDeviationFromOptimal = Infinity;
	
	var i = 0;
	while (i < words.length)
	{
		var word = words[i];
		var wordWidth = wordMetrics[i];
		
		if (wordWidth > currentLineWidth) { throw new Error('line too small to fit a single word'); }
		
		wordCount++;
		textWidth += wordWidth;
		
		if (wordCount == 1)
		{
			positions.push({ text : word , width : wordWidth , x : null });
		}
		else
		{
			var remainingSpace = currentLineWidth - textWidth;
			var cubitsPerSpace = remainingSpace / (wordCount - 1);
			var deviationFromOptimal = Math.abs(optimalSpaceWidth - cubitsPerSpace);
			
			if (cubitsPerSpace < minSpaceWidth || oldDeviationFromOptimal < deviationFromOptimal)
			{
				// rewind one word, calculate line positions and reset
				
				textWidth -= wordWidth;
				wordCount--;
				i--;
				
				if (wordCount == 1)
				{
					positions[0].x = currentLineWidth / 2 - positions[0].wordWidth / 2; // center the single word in the line.  not much can be done
				}
				else
				{
					remainingSpace = currentLineWidth - textWidth;
					cubitsPerSpace = remainingSpace / (wordCount - 1);
					
					var x = 0;
					for (var k = 0; k < positions.length; k++)
					{
						positions[k].x = x;
						x += positions[k].wordWidth + cubitsPerSpace;
					}
				}
				
				positionss.push(positions);
				positions = [];
				wordCount = 0;
				textWidth = 0;
				oldDeviationFromOptimal = Infinity;
				lineIndex++;
				
				if (lineIndex >= lineWidths.length)
				{
					currentLineWidth = lineWidths[lineWidths.length - 1];
				}
				else
				{
					currentLineWidth = lineWidths[lineIndex];
				}
			}
			else
			{
				oldDeviationFromOptimal = deviationFromOptimal;
				positions.push({ text : word , width : wordWidth , x : null });
			}
		}
		
		i++;
	}
	
	return positionss;
}

// Captions has a grid, but not other HTML (the positioning variables are stored in the grid)
// Subcanvas has a Codemirror and positioning HTML
// Image has an <img> and positioning HTML
// Table has a matrix and positioning HTML and formatting HTML
// List has a Codemirror and positioning HTML


var Captions = Components.captions = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.data = json.data;
	
	this.div = null;
	
	this.ctx = null;
};
Captions.prototype.add = function() {
	
	this.div = CreateComponentDiv($('#cells'), this);
	this.div.css('border', '1px solid gray');
	this.div.css('background-color', 'rgb(230,230,230)');
	
	this.addElements();
	
	this.refresh();
};
Captions.prototype.addElements = function() {
	
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
};
Captions.prototype.refresh = function() {
	
};
Captions.prototype.draw = function() {
	
	// text, x, y, width, hAlign, vAlign, style
	
	// text can support LaTeX math
	// there's no height field - the text just wraps
	// style is a comma-delimited list - maybe some syntax on the text to delimit default, special1, special2 styles
	
	// {first special style:} default style - {second special style}
};
Captions.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.data = this.data;
	return json;
};
Captions.New = function() {
	
};

var Title = Components.title = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.style = json.params.style ? json.params.style : null;
	this.font = json.params.font ? json.params.font : '10pt serif';
	this.stroke = json.params.stroke ? json.params.stroke : 'rgb(0,0,0)';
	this.fill = json.params.fill ? json.params.fill : 'rgb(0,0,0)';
	this.lineWidth = json.params.lineWidth ? json.params.lineWidth : 1;
	this.pitch = json.params.pitch;
	
	this.text = json.text;
	this.words = null;
	this.parse();
	
	this.data = null;
	
	this.div = null;
	this.ctx = null;
	
	this.input = null;
	
	// if the text is standalone, the Box should be moveable.  if the text is bound to e.g. a chart, the Box should be immovable
	this.box = new Box(this);
	this.box.x = json.params.x;
	this.box.y = json.params.y;
	this.box.hAlign = json.params.hAlign;
	this.box.vAlign = json.params.vAlign;
	this.box.wd = json.params.width;
	
	this.margin = {};
	this.margin.tp = json.params.margin.top;
	this.margin.lf = json.params.margin.left;
	this.margin.rt = json.params.margin.right;
	this.margin.bt = json.params.margin.bottom;
};
Title.prototype.parse = function() {
	
	this.words = Wordize(this.text);
	
};
Title.prototype.add = function() {
	
	this.div = CreateComponentDiv($('#cells'), this);
	this.div.css('border', '1px solid gray');
	this.div.css('background-color', 'rgb(230,230,230)');
	
	this.addElements2();
	
	this.refresh();
};
Title.prototype.addElements = function() {
	
	var comp = this;
	var table, tr, td;
	
	this.textInput = $('<input type="text" size="50"></input>');
	this.textInput[0].onchange = function() { comp.text = this.value; };
	this.div.append(this.textInput);
	
	
	this.div.append($('<hr />'));
	
	
	this.styleInput = $('<input type="text"></input>');
	this.fontInput = $('<input type="text"></input>');
	this.fillInput = $('<input class="jscolor" value="000000"></input>');
	this.strokeInput = $('<input class="jscolor" value="000000"></input>');
	this.lineWidthInput = $('<input type="text"></input>');
	this.pitchInput = $('<input type="text"></input>');
	
	this.styleInput[0].onchange = function(e) { comp.style = this.value; };
	this.fontInput[0].onchange = function(e) { comp.font = this.value; };
	this.fillInput[0].onchange = function(e) { comp.fill = this.value; };
	this.strokeInput[0].onchange = function(e) { comp.stroke = this.value; };
	this.lineWidthInput[0].onchange = function(e) { comp.lineWidth = parseFloat(this.value); };
	this.pitchInput[0].onchange = function(e) { comp.pitch = parseFloat(this.value); };
	
	table = $('<table></table>');
	table.append($('<tr><td colspan="2" style="font-weight:bold">Text style</td></tr>'));
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">style</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.styleInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">font</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.fontInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">fill</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.fillInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">stroke</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.strokeInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">line width</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.lineWidthInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">pitch</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.pitchInput);
	this.div.append(table);
	
	
	this.div.append($('<hr />'));
	
	
	this.xInput = $('<input type="text"></input>');
	this.yInput = $('<input type="text"></input>');
	this.widthInput = $('<input type="text"></input>');
	this.hAlignInput = $('<select><option>left</option><option>center</option><option>right</option></select>');
	this.vAlignInput = $('<select><option>top</option><option>middle</option><option>bottom</option></select>');
	
	this.xInput[0].onchange = function() { comp.box.x = this.value; comp.box.align(); };
	this.yInput[0].onchange = function(e) { comp.box.y = this.value; comp.box.align(); };
	this.widthInput[0].onchange = function(e) { comp.box.width = this.value; /*parse*/ comp.box.align(); };
	this.hAlignInput[0].onchange = function(e) { comp.box.hAlign = this.value; comp.box.align(); };
	this.vAlignInput[0].onchange = function(e) { comp.box.vAlign = this.value; comp.box.align(); };
	
	table = $('<table></table>');
	table.append($('<tr><td colspan="2" style="font-weight:bold">Positioning</td></tr>'));
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">x</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.xInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">y</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.yInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">width</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.widthInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">hAlign</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.hAlignInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">vAlign</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.vAlignInput);
	this.div.append(table);
};
Title.prototype.addElements2 = function() {
	
	var comp = this;
	
	this.textInput = $('<input type="text" size="50"></input>');
	this.textInput[0].onchange = function() { comp.text = this.value; };
	this.div.append(this.textInput);
	
	this.div.append($('<hr />'));
	
	var gui = new dat.GUI({autoPlace:false});
	gui.add(this.box, 'x');
	gui.add(this.box, 'y');
	gui.add(this.box, 'wd');
	gui.add(this.box, 'hAlign', ['left','center','right']);
	gui.add(this.box, 'vAlign', ['top','center','bottom']);
	
	this.div[0].appendChild(gui.domElement);
	
	this.div.append($('<hr />'));
	
	var gui = new dat.GUI({autoPlace:false});
	//gui.add(this, 'style');
	gui.add(this, 'font');
	gui.addColor(this, 'fill');
	//gui.addColor(this, 'stroke');
	//gui.add(this, 'lineWidth');
	gui.add(this, 'pitch');
	
	var margin = gui.addFolder('margin');
	margin.add(this.margin, 'lf');
	margin.add(this.margin, 'rt');
	margin.add(this.margin, 'tp');
	margin.add(this.margin, 'bt');
	
	this.div[0].appendChild(gui.domElement);
};
Title.prototype.refresh = function() {
	
	this.textInput[0].value = this.text;
	//this.styleInput[0].value = this.style;
	//this.fontInput[0].value = this.font;
	//this.fillInput[0].value = this.fill;
	//this.strokeInput[0].value = this.stroke;
	//this.lineWidthInput[0].value = this.lineWidth;
	//this.pitchInput[0].value = this.pitch;
};
Title.prototype.setSize = function() {
	
	var ctx = this.ctx;
	
	if (this.style) { ctx.SetStyle(this.style); }
	if (this.font) { ctx.font = this.font; }
	
	var wordMetrics = this.words.map(function(word) { return ctx.measureText(word).width });
	var maxWordWidth = wordMetrics.reduce(function(a, b) { return Math.max(a, b); });
	
	this.box.wd = Math.max(this.box.wd, maxWordWidth);
	
	var lines = LinebreakNaive([this.box.wd], this.words, wordMetrics, this.ctx.fontSizeCu * .75); // spaceWidth is pretty arbitrary
	
	this.pitch = Math.max(this.pitch, this.ctx.fontSizeCu);
	
	this.box.hg = lines.length * this.pitch;
	this.box.align();
};
Title.prototype.draw = function() {
	
	var ctx = this.ctx;
	
	ctx.Save();
	
	if (this.style) { ctx.SetStyle(this.style); }
	if (this.font) { ctx.font = this.font; }
	
	if (this.stroke) { ctx.strokeStyle = this.stroke; }
	if (this.fill) { ctx.fillStyle = this.fill; }
	if (this.lineWidth) { ctx.lineWidth = this.lineWidth; }
	
	ctx.textAlign = this.box.hAlign;
	ctx.textBaseline = ((this.box.vAlign == 'center') ? 'middle' : this.box.vAlign);
	
	ctx.fillText(this.text, this.box.x, this.box.y);
	
	ctx.Restore();
};
Title.prototype.onhover = function() {
	this.box.onhover();
	
};
Title.prototype.dehover = function() {
	this.ctx.canvas.style.cursor = 'default';
};
Title.prototype.onmousemove = function(e) {
	
	// it's not great to set these handlers on every mousemove, but right now that's what the box architecture has us do
	// the box checks for hovering over handles, and if not, kicks the mousemove event up to its parent widget
	// what we could do instead is call onhover/dehover on Text as the mouse goes over and out of handles
	
	var text = this;
	
	text.ctx.canvas.style.cursor = 'text';
	
	text.ctx.canvas.onmousedown = function(e) {
		
		document.getElementById('text-content-selector').value = text.text;
		
		// how do we remove the existing selected attrs?
		$('#font-selector' + text.fontFamily).attr('selected', 'selected');
		$('#font-size-selector' + text.fontSize).attr('selected', 'selected');
		
		// translate from rgb(0,0,0) to FFFFFF
		var ffffff = text.fillStyle.substring(4, text.fillStyle.length - 1).split(',').map(s => parseInt(s)).map(n => (((n < 16) ? '0' : '') + n.toString(16)).toUpperCase()).join('');
		document.getElementById('text-color-selector').value = ffffff;
		
		if (this.bold)
		{
			$('#bold-selector-off').removeAttr('checked');
			$('#bold-selector-on').attr('checked', ''); // how do we add an attr with no value?
		}
		else
		{
			$('#bold-selector-on').removeAttr('checked');
			$('#bold-selector-off').attr('checked', '');
		}
		
		if (this.italic)
		{
			$('#italic-selector-off').removeAttr('checked');
			$('#italic-selector-on').attr('checked', ''); // how do we add an attr with no value?
		}
		else
		{
			$('#italic-selector-on').removeAttr('checked');
			$('#italic-selector-off').attr('checked', '');
		}
		
		var alignmentDict = {top:{left:'TL',center:'TC',right:'TR'},center:{left:'CL',center:'CC',right:'CR'},bottom:{left:'BL',center:'BC',right:'BR'}};
		
		// how do we remove a checked attr?
		$('#alignment-selector-' + alignmentDict[this.hAlign][this.vAlign]).attr('checked', '');
		
		Griddl.UI.ShowTextStyle();
	};
	text.ctx.canvas.onmouseup = function(e) {
		text.ctx.canvas.onmousedown = null;
		text.ctx.canvas.onmouseup = null;
	};
};
Title.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.text = this.text;
	json.params = {};
	json.params.x = this.box.x;
	json.params.y = this.box.y;
	json.params.hAlign = this.box.hAlign;
	json.params.vAlign = this.box.vAlign;
	json.params.width = this.box.wd;
	json.params.style = this.style;
	json.params.font = this.font;
	json.params.stroke = this.stroke;
	json.params.fill = this.fill;
	json.params.lineWidth = this.lineWidth;
	json.params.pitch = this.pitch;
	json.params.margin = {};
	json.params.margin.top = this.margin.tp;
	json.params.margin.left = this.margin.lf;
	json.params.margin.right = this.margin.rt;
	json.params.margin.bottom = this.margin.bt;
	return json;
};
Title.New = function() {
	
	// we need some knowledge of the units and scale to set reasonable initial values for the coordinates
	
	var json = {};
	json.type = 'title';
	json.name = UniqueName('title', 1);
	json.visible = true;
	json.text = 'Title';
	json.params = {};
	json.params.x = 0;
	json.params.y = 0;
	json.params.hAlign = 'center';
	json.params.vAlign = 'center';
	json.params.width = 200;
	json.params.style = null;
	json.params.font = '36pt serif';
	json.params.stroke = 'rgb(0,0,0)';
	json.params.fill = 'rgb(0,0,0)';
	json.params.lineWidth = 1;
	json.params.pitch = 50;
	
	var obj = new Title(json);
	obj.add();
	MarkDirty();
	AddObj(obj);
};

var List = Components.list = function(json) {
	
	// text	left	dy	style	bulType	bulSize
	// major1	40	200	basic	circle	6
	// minor1	80	30	basic	circle	3
	// subminor1	120	30	basic	circle	2
	// major2	40	30	basic	circle	6
	// minor2	80	30	basic	circle	3
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.text = json.text;
	this.data = null;
	this.parse(); // fill this.data by parsing this.text
	
	this.div = null;
	
	this.ctx = null;
	
	this.styles = json.params.styles; // comma-separated list, applies to each respective indentation level
	
	this.font = json.params.font;
	this.fill = json.params.fill;
	this.pitch = json.params.pitch;
	this.indent = json.params.indent;
	
	this.textMargin = json.params.textMargin
	this.markerStyle = json.params.markerStyle; // 'none' , 'circle' , 'square' , etc.
	this.markerDiameter = json.params.markerDiameter;
	
	this.box = new Box(this);
	this.box.x = json.params.x;
	this.box.y = json.params.y;
	this.box.hAlign = json.params.hAlign;
	this.box.vAlign = json.params.vAlign;
	this.box.wd = json.params.width;
	
	this.margin = {};
	this.margin.tp = json.params.margin.top;
	this.margin.lf = json.params.margin.left;
	this.margin.rt = json.params.margin.right;
	this.margin.bt = json.params.margin.bottom;
};
List.prototype.parse = function() {
	
	// * foo
	//   * bar
	//   * baz
	// 
	// 1. foo
	// 2. bar
	// 3. baz
	
	// do we make people do their own numbering?  probably.  not a big deal.
	// do we insist on one space, or two spaces, or tabs, or do we let people define their own and detect?
	// and then what happens if people fuck up their indentation scheme?
	
	var lines = this.text.split('\n');
	
	this.data = [];
	
	for (var i = 0; i < lines.length; i++)
	{
		var line = lines[i];
		//var indent = /^\s+/.exec(line)[0].length; // count the number of spaces at the beginning of the line
		var indent = line.length - line.trimLeft().length; // count the number of spaces at the beginning of the line
		var rest = line.substr(indent);
		var leader = /([a-zA-Z0-9\*]+)(\.|\s+|\.\s+)/.exec(rest)[0];
		var body = rest.substr(leader.length);
		
		this.data.push({indent:indent,leader:leader,body:body});
		
		// how to capture the 1/a/*?
		// period is optional
		// whitespace after period is optional
		// must be either, can be both
		
		// 1foo - no
		// 1 foo - yes
		// 1.foo - yes
		// 1. foo - yes
	}
};
List.prototype.setSize = function() {
	
	//var ctx = this.ctx;
	//
	//if (this.style) { ctx.SetStyle(this.style); }
	//if (this.font) { ctx.font = this.font; }
	//
	//var wordMetrics = this.words.map(function(word) { return ctx.measureText(word).width });
	//var maxWordWidth = wordMetrics.reduce(function(a, b) { return Math.max(a, b); });
	//
	//this.box.wd = Math.max(this.box.wd, maxWordWidth);
	//
	//var lines = LinebreakNaive([this.box.wd], this.words, wordMetrics, this.ctx.fontSizeCu * .75); // spaceWidth is pretty arbitrary
	//
	//this.pitch = Math.max(this.pitch, this.ctx.fontSizeCu);
	//
	//this.box.hg = lines.length * this.pitch;
	//this.box.align();
};
List.prototype.add = function() {
	
	this.div = CreateComponentDiv($('#cells'), this);
	this.div.css('border', '1px solid gray');
	this.div.css('background-color', 'rgb(230,230,230)');
	
	this.addElements();
	
	this.refresh();
};
List.prototype.addElements = function() {
	
	var comp = this;
	
	comp.textarea = $('<textarea></textarea>');
	comp.div.append(comp.textarea);
	comp.codemirror = CodeMirror.fromTextArea(comp.textarea[0], { mode : 'plain' , smartIndent : false , lineNumbers : true , lineWrapping : true });
	comp.codemirror.on('blur', function() { comp.text = comp.codemirror.getValue(); comp.compile();  });
	comp.codemirror.on('change', function() { MarkDirty(); });
	
	this.div.append($('<hr />'));
	
	var gui = new dat.GUI({autoPlace:false});
	gui.add(this.box, 'x');
	gui.add(this.box, 'y');
	gui.add(this.box, 'wd');
	gui.add(this.box, 'hAlign', ['left','center','right']);
	gui.add(this.box, 'vAlign', ['top','center','bottom']);
	
	this.div[0].appendChild(gui.domElement);
	
	this.div.append($('<hr />'));
	
	var gui = new dat.GUI({autoPlace:false});
	gui.add(this, 'styles');
	gui.add(this, 'font');
	gui.addColor(this, 'fill');
	gui.add(this, 'pitch');
	gui.add(this, 'indent');
	gui.add(this, 'textMargin');
	gui.add(this, 'markerStyle', ['none','circle','square']);
	gui.add(this, 'markerDiameter');
	
	var margin = gui.addFolder('margin');
	margin.add(this.margin, 'lf');
	margin.add(this.margin, 'rt');
	margin.add(this.margin, 'tp');
	margin.add(this.margin, 'bt');
	
	this.div[0].appendChild(gui.domElement);
};
List.prototype.refresh = function() {
	this.codemirror.getDoc().setValue(this.text);
};
List.prototype.draw = function() {
	
	//var y = this.box.tp;
	//
	//for (var i = 0; i < this.data.length; i++)
	//{
	//	var datum = this.data[i];
	//	
	//	var dy = parseFloat(datum.dy);
	//	var left = parseFloat(datum.left);
	//	var size = parseFloat(datum.bulSize);
	//	var text = datum.text;
	//	
	//	y += dy;
	//	
	//	this.ctx.SetStyle(datum.style);
	//	this.ctx.fillCircle(this.box.lf + left, y, size);
	//	this.ctx.fillText(text, this.box.lf + left + size + this.textMargin, y);
	//}
};
List.prototype.onhover = OnHover;
List.prototype.dehover = DeHover;
List.prototype.onmousemove = OnMouseMove;
List.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.text = this.text;
	json.params = {};
	json.params.x = this.box.x;
	json.params.y = this.box.y;
	json.params.hAlign = this.box.hAlign;
	json.params.vAlign = this.box.vAlign;
	json.params.width = this.width;
	json.params.pitch = this.pitch;
	json.params.indent = this.indent;
	json.params.styles = this.styles;
	json.params.font = this.font;
	json.params.fill = this.fill;
	json.params.textMargin = this.textMargin
	json.params.markerStyle = this.markerStyle;
	json.params.markerDiameter = this.markerDiameter;
	json.params.margin = {};
	json.params.margin.top = this.margin.tp;
	json.params.margin.left = this.margin.lf;
	json.params.margin.right = this.margin.rt;
	json.params.margin.bottom = this.margin.bt;
	return json;
};
List.New = function() {
	
	var json = {};
	json.type = 'list';
	json.name = UniqueName('list', 1);
	json.visible = true;
	json.text = '1. foo\n a. bar\n b. baz\n2. huh';
	json.params = {};
	json.params.x = 425;
	json.params.y = 200;
	json.params.hAlign = 'center';
	json.params.vAlign = 'top';
	json.params.width = 200;
	json.params.pitch = 25;
	json.params.indent = 25;
	json.params.styles = null;
	json.params.font = '12pt serif';
	json.params.fill = 'rgb(0,0,0)';
	json.params.textMargin = 5;
	json.params.markerStyle = 'circle';
	json.params.markerDiameter = 8;
	json.params.margin = {};
	json.params.margin.top = 50;
	json.params.margin.left = 50;
	json.params.margin.right = 50;
	json.params.margin.bottom = 50;
	
	var obj = new List(json);
	obj.add();
	MarkDirty();
	AddObj(obj);
};



var Subcanvas = Components.subcanvas = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	this.section = null;
	
	this.ctx = null;
	
	this.text = json.text;
	this.fn = null;
	this.codemirror = null;
	
	this.box = new Box(this);
	this.box.x = json.params.x;
	this.box.y = json.params.y;
	this.box.hAlign = json.params.hAlign;
	this.box.vAlign = json.params.vAlign;
	this.box.wd = json.params.width;
	this.box.hg = json.params.height;
	
	this.margin = {};
	this.margin.tp = json.params.margin.top;
	this.margin.lf = json.params.margin.left;
	this.margin.rt = json.params.margin.right;
	this.margin.bt = json.params.margin.bottom;
	
	this.parent = null; // $(<canvas>)
	this.canvas = null; // $(<canvas>)
	this.context = null; // the CanvasRenderingContext2D (or in the future, maybe a Canvas) of the subcanvas
};
Subcanvas.prototype.add = function() {
	
	this.div = CreateComponentDiv($('#cells'), this);
	this.div.css('border', '1px solid gray');
	this.div.css('background-color', 'rgb(230,230,230)');
	
	this.addElements();
	
	this.refresh();
};
Subcanvas.prototype.addElements = function() {
	
	var comp = this;
	
	comp.textarea = $('<textarea></textarea>');
	comp.div.append(comp.textarea);
	comp.codemirror = CodeMirror.fromTextArea(comp.textarea[0], { mode : 'javascript' , smartIndent : false , lineNumbers : true , lineWrapping : true });
	comp.codemirror.on('blur', function() { comp.text = comp.codemirror.getValue(); comp.compile();  });
	comp.codemirror.on('change', function() { MarkDirty(); });
	
	comp.refresh();
	
	comp.canvas = $('<canvas></canvas>');
	
	this.div.append($('<hr />'));
	
	var gui = new dat.GUI({autoPlace:false});
	gui.add(this.box, 'x');
	gui.add(this.box, 'y');
	gui.add(this.box, 'wd');
	gui.add(this.box, 'hg');
	gui.add(this.box, 'hAlign', ['left','center','right']);
	gui.add(this.box, 'vAlign', ['top','center','bottom']);
	
	var margin = gui.addFolder('margin');
	margin.add(this.margin, 'lf');
	margin.add(this.margin, 'rt');
	margin.add(this.margin, 'tp');
	margin.add(this.margin, 'bt');
	
	this.div[0].appendChild(gui.domElement);
};
Subcanvas.prototype.setSize = function() {
	
	this.box.align();
};
Subcanvas.prototype.refresh = function() {
	this.codemirror.getDoc().setValue(this.text);
};
Subcanvas.prototype.draw = function() {
	
	this.parent = $(this.ctx.canvas);
	
	this.parent.append(this.canvas);
	this.canvas[0].width = this.box.wd * this.ctx.pixelsPerCubit;
	this.canvas[0].height = this.box.hg * this.ctx.pixelsPerCubit;
	this.canvas.css('position', 'absolute');
	this.canvas.css('left', (this.box.lf * this.ctx.pixelsPerCubit) + 'px');
	this.canvas.css('top', (this.box.tp * this.ctx.pixelsPerCubit) + 'px');
	
	this.context = this.canvas[0].getContext('2d');
	
	this.context.fillStyle = 'rgb(128,128,128)';
	this.context.fillRect(0, 0, this.canvas[0].width, this.canvas[0].height);
};
Subcanvas.prototype.onhover = function() {
	this.canvas.css('border', '1px solid gray');
	this.box.onhover();
};
Subcanvas.prototype.dehover = function() {
	//this.ctx.canvas.style.cursor = 'default';
	this.canvas.css('border', '');
};
Subcanvas.prototype.onmousemove = function(e) {
	
};
Subcanvas.prototype.compile = function() {
	
	try
	{
		this.fn = new Function('args', this.text);
	}
	catch (e)
	{
		throw new Error('invalid javascript');
	}
};
Subcanvas.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.text = this.text;
	json.params.x = this.box.x;
	json.params.y = this.box.y;
	json.params.hAlign = this.box.hAlign;
	json.params.vAlign = this.box.vAlign;
	json.params.margin = {};
	json.params.margin.top = this.margin.tp;
	json.params.margin.left = this.margin.lf;
	json.params.margin.right = this.margin.rt;
	json.params.margin.bottom = this.margin.bt;
	return json;
};
Subcanvas.New = function() {
	
	// we need some knowledge of the units and scale to set reasonable initial values for the coordinates
	
	var json = {};
	json.type = 'subcanvas';
	json.name = UniqueName('subcanvas', 1);
	json.visible = true;
	json.text = '';
	json.params = {};
	json.params.x = 0;
	json.params.y = 0;
	json.params.hAlign = 'center';
	json.params.vAlign = 'center';
	json.params.width = 300;
	json.params.height = 200;
	
	var obj = new Subcanvas(json);
	obj.add();
	MarkDirty();
	AddObj(obj);
};

var Image = Components.image = function(json) {
	
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
	
	this.box = new Box(this);
	this.box.x = json.params.x;
	this.box.y = json.params.y;
	this.box.hAlign = json.params.hAlign;
	this.box.vAlign = json.params.vAlign;
	this.box.wd = json.params.width;
	this.box.hg = json.params.height;
	this.box.align();
	
	this.sx = json.params.sx ? json.params.sx : 0;
	this.sy = json.params.sy ? json.params.sy : 0;
	this.sw = json.params.sw ? json.params.sw : this.imageElement.width;
	this.sh = json.params.sh ? json.params.sh : this.imageElement.height;
	
	this.margin = {};
	this.margin.tp = json.params.margin.top;
	this.margin.lf = json.params.margin.left;
	this.margin.rt = json.params.margin.right;
	this.margin.bt = json.params.margin.bottom;
};
Image.prototype.add = function() {
	
	this.div = CreateComponentDiv($('#cells'), this);
	this.div.css('border', '1px solid gray');
	this.div.css('background-color', 'rgb(230,230,230)');
	
	this.addElements();
	
	this.refresh();
};
Image.prototype.addElements = function() {
	
	this.div.html('');
	
	this.imageElement.style.margin = '1em';
	this.div[0].appendChild(this.imageElement); // this.div.innerHTML = '<img src="' + this.b64 + '"></img>'; // this assumes div is not Jquery
	
	this.dimensionDiv = $('<div style="margin-left:1em"></div>');
	this.dimensionDiv.text(this.imageElement.width + ' x ' + this.imageElement.height);
	this.div.append(this.dimensionDiv);
	
	this.div.append($('<hr />'));
	
	var gui = new dat.GUI({autoPlace:false});
	gui.add(this, 'download');
	gui.add(this, 'upload');
	gui.add(this.box, 'x'); // add handlers to align the box on change
	gui.add(this.box, 'y');
	gui.add(this.box, 'wd'); // need a way to add a label 'width'
	gui.add(this.box, 'hg');
	gui.add(this.box, 'hAlign', ['left','center','right']);
	gui.add(this.box, 'vAlign', ['top','center','bottom']);
	//gui.add(this, 'sx');
	//gui.add(this, 'sy');
	//gui.add(this, 'sw');
	//gui.add(this, 'sh');
	
	var margin = gui.addFolder('margin');
	margin.add(this.margin, 'lf');
	margin.add(this.margin, 'rt');
	margin.add(this.margin, 'tp');
	margin.add(this.margin, 'bt');
	
	this.div[0].appendChild(gui.domElement);
	
	// for (var i in gui.__controllers) { gui.__controllers[i].updateDisplay(); } // how to update display on external change of value
};
Image.prototype.draw = function() {
	this.ctx.drawImage(this.imageElement, this.sx, this.sy, this.sw, this.sh, this.box.lf, this.box.tp, this.box.wd, this.box.hg);
};
Image.prototype.download = function() {
	var a = document.createElement('a');
	a.href = this.b64;
	a.download = this.name + '.' + this.ext;
	a.click();
};
Image.prototype.upload = Upload;
Image.prototype.setExt = function(ext) {
	this.ext = ext;
};
Image.prototype.setArrayBuffer = function(arrayBuffer) {
	this.uint8array = new Uint8Array(arrayBuffer);
	this.b64 = 'data:image/' + this.ext + ';base64,' + Uint8ArrayToBase64String(this.uint8array); // assumes .png for now
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
	
	this.uint8array = Base64StringToUint8Array(data);
	
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
Image.prototype.onhover = OnHover;
Image.prototype.dehover = DeHover;
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
	json.params.margin.top = this.margin.tp;
	json.params.margin.left = this.margin.lf;
	json.params.margin.right = this.margin.rt;
	json.params.margin.bottom = this.margin.bt;
	return json;
};
Image.New = function() {
	
	// we need some knowledge of the units and scale to set reasonable initial values for the coordinates
	
	var json = {};
	json.type = 'image';
	json.name = UniqueName('image', 1);
	json.visible = true;
	json.data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAERJREFUOE9j3LJlCwMMeHt7w9lbt24lKM4A1AwH/5EAMeIDqJlUpyKrZxiimomJElxeG8CoosjZQzSqKHI2RQE2NDUDAEVWy5NpqgO1AAAAAElFTkSuQmCC';
	json.params = {};
	json.params.x = 0;
	json.params.y = 0;
	json.params.hAlign = 'center';
	json.params.vAlign = 'center';
	json.params.width = 200;
	json.params.height = 200;
	
	obj.add();
	MarkDirty();
	AddObj(obj);
};

var Table = Components.table = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.data = json.data; // [[]]
	this.nRows = this.data.length;
	this.nCols = this.data.map(x => x.length).reduce(function(a, b) { return Math.max(a, b); });
	this.rowSizes = json.params.rowSizes; // int[], includes headers
	this.colSizes = json.params.colSizes; // int[], includes headers
	this.xs = null; // int[], fencepost with colSizes
	this.ys = null; // int[], fencepost with rowSizes
	
	this.cells = null; // Cell[][]
	
	this.div = null;
	
	this.ctx = null;
	
	this.section = null; // set by Canvas.GenerateDocument
	
	this.box = {}; AddBoxVars(this.box);
	//this.box = new Box(this); // the mechanics of row and col resizing work best if the grid's anchor is mandated to be tp/lf, but users might want centering
	this.box.x = json.params.x;
	this.box.y = json.params.y;
	this.box.hAlign = json.params.hAlign;
	this.box.vAlign = json.params.vAlign;
	this.box.hg = this.rowSizes.reduce(function(a, b) { return a + b; });
	this.box.wd = this.colSizes.reduce(function(a, b) { return a + b; });
	
	this.margin = {};
	this.margin.tp = json.params.margin.top;
	this.margin.lf = json.params.margin.left;
	this.margin.rt = json.params.margin.right;
	this.margin.bt = json.params.margin.bottom;
	
	this.selected = null; // {mode:'Select',color:'rgb(0,0,0)',shimmer:false,minCol:null,maxCol:null,minRow:null,maxRow:null}
	this.cursor = {row:null,col:null}; // { row : int , col : int }
	this.anchor = {row:null,col:null}; // { row : int , col : int }
	
	this.generateCells();
	this.position();
};
Table.prototype.add = function() {
	
	this.div = CreateComponentDiv($('#cells'), this);
	this.div.css('border', '1px solid gray');
	this.div.css('background-color', 'rgb(230,230,230)');
	
	this.addElements();
	
	this.refresh();
};
Table.prototype.addElements = function() {
	
	var options = {}
	options.data = this.data;
	options.formulas = true;
	options.rowHeaders = false;
	options.colHeaders = false;
	//options.colWidths = [ 50 , 10 , 10 , 10 , 10 , 10 , 20 , 10 ];
	options.contextMenu = false;
	options.manualColumnResize = true;
	//options.afterChange = function(changes, source) { if (this.firstChange) { this.firstChange = false; } else { MarkDirty(); } };
	
	this.tableDiv = $('<div></div>');
	this.div.append(this.tableDiv);
	
	this.handsontable = new Handsontable(this.tableDiv[0], options);
	
	this.div.append($('<hr />'));
	
	var gui = new dat.GUI({autoPlace:false});
	gui.add(this.box, 'x'); // add handlers to align the box on change
	gui.add(this.box, 'y');
	gui.add(this.box, 'hAlign', ['left','center','right']);
	gui.add(this.box, 'vAlign', ['top','center','bottom']);
	
	var rowSizesFolder = gui.addFolder('row sizes');
	for (var i = 0; i < this.rowSizes.length; i++) { rowSizesFolder.add(this.rowSizes, i); }
	var colSizesFolder = gui.addFolder('col sizes');
	for (var i = 0; i < this.colSizes.length; i++) { colSizesFolder.add(this.colSizes, i); }
	
	var margin = gui.addFolder('margin');
	margin.add(this.margin, 'lf');
	margin.add(this.margin, 'rt');
	margin.add(this.margin, 'tp');
	margin.add(this.margin, 'bt');
	
	this.div[0].appendChild(gui.domElement);
};
Table.prototype.refresh = function() {
	
};
Table.prototype.generateCells = function() {
	
	this.cells = [];
	
	for (var i = 0; i < this.nRows; i++)
	{
		this.cells.push([]);
		
		for (var j = 0; j < this.nCols; j++)
		{
			var cell = new Cell(this)
			cell.row = i;
			cell.col = j;
			
			cell.data = this.data[i][j];
			cell.string = cell.data.toString();
			//cell.valueToString();
			
			this.cells[i].push(cell);
		}
	}
};
Table.prototype.position = function() {
	
	AlignBox(this.box); // allows for flexible anchoring
	
	// starting with the left, top, rowSizes, and colSizes, recalculate xs, ys, and the other box vars
	var x = this.box.lf;
	var y = this.box.tp;
	this.xs = [ x ];
	this.ys = [ y ];
	for (var j = 0; j < this.nCols; j++) { x += this.colSizes[j]; this.xs.push(x); }
	for (var i = 0; i < this.nRows; i++) { y += this.rowSizes[i]; this.ys.push(y); }
	//ReconcileBox(this.box, {lf:this.box.lf,rt:x,tp:this.box.tp,bt:y});
	
	// then reposition the cells
	for (var i = 0; i < this.nRows; i++)
	{
		for (var j = 0; j < this.nCols; j++)
		{
			var cell = this.cells[i][j];
			ReconcileBox(cell.box, {wd:this.colSizes[j],hg:this.rowSizes[i],lf:this.xs[j],tp:this.ys[i]});
		}
	}
};
Table.prototype.draw = function() {
	
	var table = this;
	
	this.cells.forEach(cellrow => cellrow.forEach(function(cell) { cell.ctx = table.ctx; }));
	
	// draw cells - the cells draw their fill only - the grid itself handles strokes and the selection box
	this.cells.forEach(cellrow => cellrow.forEach(cell => cell.draw()));
	
	//var labelCellStroke = 'rgb(158,182,206)';
	//var normalStroke = 'rgb(208,215,229)';
	//var selectedStroke = 'rgb(242,149,54)';
	
	var labelCellStroke = 'rgb(0,0,0)';
	var normalStroke = 'rgb(0,0,0)';
	var selectedStroke = 'rgb(0,0,0)';
	
	var x0 = this.xs[0];
	var x1 = this.xs[1];
	var y0 = this.ys[0];
	var y1 = this.ys[1];
	var lf = this.box.lf;
	var rt = this.box.rt;
	var tp = this.box.tp;
	var bt = this.box.bt;
	
	var ctx = this.ctx;
	ctx.lineWidth = 1;
	
	// first draw normal strokes
	
	for (var i = 0; i < this.ys.length; i++)
	{
		var y = this.ys[i];
		
		// long strokes
		ctx.strokeStyle = i < 2 ? labelCellStroke : normalStroke;
		ctx.drawLine(lf - 0.5, y - 0.5, rt, y - 0.5);
		
		// short label cell strokes
		ctx.strokeStyle = labelCellStroke;
		ctx.drawLine(x0 - 0.5, y - 0.5, x1, y - 0.5);
	}
	
	for (var i = 0; i < this.xs.length; i++)
	{
		var x = this.xs[i];
		
		// long strokes
		ctx.strokeStyle = i < 2 ? labelCellStroke : normalStroke;
		ctx.drawLine(x - 0.5, tp - 0.5, x - 0.5, bt);
		
		// short label cell strokes
		ctx.strokeStyle = labelCellStroke;
		ctx.drawLine(x - 0.5, y0 - 0.5, x - 0.5, y1);
	}
	
	// then draw selected strokes
	if (this.selected)
	{
		// first draw the short orange strokes on the row and col header cells, 
		if (this.selected.minRow > 0) // so that the selection indicator is not drawn on the title cell when a col label is selected
		{
			ctx.strokeStyle = selectedStroke;
			
			for (var i = this.selected.minRow; i <= this.selected.maxRow + 1; i++)
			{
				var y = this.ys[i];
				ctx.drawLine(x0 - 0.5, y - 0.5, x1, y - 0.5); // short horizontal strokes
			}
			
			var sy0 = this.ys[this.selected.minRow];
			var sy1 = this.ys[this.selected.maxRow + 1];
			
			ctx.drawLine(x0 - 0.5, sy0 - 0.5, x0 - 0.5, sy1); // long vertical strokes
			ctx.drawLine(x1 - 0.5, sy0 - 0.5, x1 - 0.5, sy1);
		}
		
		if (this.selected.minCol > 0) // so that the selection indicator is not drawn on the title cell when a row label is selected
		{
			ctx.strokeStyle = selectedStroke;
			
			for (var i = this.selected.minCol; i <= this.selected.maxCol + 1; i++)
			{
				var x = this.xs[i];
				ctx.drawLine(x - 0.5, y0 - 0.5, x - 0.5, y1); // short vertical strokes
			}
			
			var sx0 = this.xs[this.selected.minCol];
			var sx1 = this.xs[this.selected.maxCol + 1];
			
			ctx.drawLine(sx0 - 0.5, y0 - 0.5, sx1, y0 - 0.5); // long horizontal strokes
			ctx.drawLine(sx0 - 0.5, y1 - 0.5, sx1, y1 - 0.5);
		}
		
		// now draw the thick black selection box
		for (var i = 0; i < this.selected.length; i++)
		{
			var mode = this.selected[i].mode;
			
			var lf = this.xs[this.selected[i].minCol];
			var rt = this.xs[this.selected[i].maxCol + 1];
			var tp = this.ys[this.selected[i].minRow];
			var bt = this.ys[this.selected[i].maxRow + 1];
			var wd = rt - lf;
			var hg = bt - tp;
			
			if (mode == 'Select')
			{
				ctx.fillStyle = 'rgb(0,0,0)';
				ctx.fillRect(lf - 2, tp - 2, wd + 1, 3); // tp
				ctx.fillRect(rt - 2, tp - 2, 3, hg - 2); // rt
				ctx.fillRect(lf - 2, bt - 2, wd - 2, 3); // bt
				ctx.fillRect(lf - 2, tp - 2, 3, hg + 1); // lf
				ctx.fillRect(rt - 3, bt - 3, 5, 5); // handle square
			}
			else if (mode == 'Point')
			{
				// Point - if highlighted, draw a second outline 1px interior to the first outline
				
				ctx.strokeStyle = this.selected[i].color;
				ctx.drawLine(lf, tp, rt, tp);
				ctx.drawLine(rt, tp, rt, bt);
				ctx.drawLine(lf, bt, rt, bt);
				ctx.drawLine(lf, tp, lf, bt);
				
				ctx.fillStyle = this.selected[i].color;
				//ctx.fillRect(rt - 3, bt - 3, 5, 5); // handle square
			}
		}
	}
};
Table.prototype.onmousemove = function(e) {
	
	var mx = e.offsetX;
	var my = e.offsetY;
	
	var grid = this;
	
	var xMin = this.xs[0];
	var xMax = this.xs[this.xs.length - 1];
	var yMin = this.ys[0];
	var yMax = this.ys[this.ys.length - 1];
	
	if (mx < xMin || mx > xMax || my < yMin || my > yMax) { this.dehover(); return; } // to be superseded by box
	
	var x0 = this.xs[0];
	var x1 = this.xs[1];
	var y0 = this.ys[0];
	var y1 = this.ys[1];
	
	// move grid
	//if ((y0 - 1 <= my && my <= y0 + 1 && x0 <= mx && mx < x1) || (x0 - 1 <= mx && mx <= x0 + 1 && y0 <= my && my < y1)) // top and left borders of the title cell only
	if ((y0 - 1 <= my && my <= y0 + 1 && xMin <= mx && mx <= xMax) || (x0 - 1 <= mx && mx <= x0 + 1 && yMin <= my && my <= yMax)) // top and left borders of entire grid
	{
		this.ctx.canvas.style.cursor = 'move';
		return;
	}
	
	// row resize
	if (x0 < mx && mx < x1)
	{
		for (var i = 0; i < this.nRows; i++)
		{
			var y = this.ys[i + 1];
			
			if (y - 1 <= my && my <= y + 1)
			{
				this.ctx.canvas.style.cursor = 'row-resize';
				var prevY = this.ys[i];
				var rowResizeIndex = i;
				
				this.ctx.canvas.onmousedown = function(e) {
					
					grid.ctx.canvas.onmousemove = function(e) {
						var currY = e.offsetY;
						grid.rowSizes[rowResizeIndex] = Math.max(currY - prevY, 2);
						grid.position();
						grid.page.draw();
					};
					grid.ctx.canvas.onmouseup = function(e) {
						
						grid.ctx.canvas.onmousemove = function(e) { grid.onmousemove(e); };
						grid.ctx.canvas.onmousedown = null;
						grid.ctx.canvas.onmouseup = null;
					};
				};
				
				return;
			}
		}
	}
	
	// col resize
	if (y0 < my && my < y1)
	{
		for (var j = 0; j < this.nCols; j++)
		{
			var x = this.xs[j + 1];
			
			if (x - 1 <= mx && mx <= x + 1)
			{
				this.ctx.canvas.style.cursor = 'col-resize';
				var prevX = this.xs[j];
				var colResizeIndex = j;
				
				var ColResize = function()
				{
					var currX = e.offsetX;
					this.colSizes[colResizeIndex] = Math.max(currX - prevX, 2);
					// now change subsequent xs
					this.position();
				};
				
				return;
			}
		}
	}
	
	var hovered = grid.pointToRowCol(mx, my);
	
	var cell = this.cells[hovered.row][hovered.col];
	this.ctx.canvas.style.cursor = 'cell';
	
	this.ctx.canvas.onmousedown = function(e) {
		
		var ax = e.offsetX;
		var ay = e.offsetY;
		
		grid.anchor = grid.pointToRowCol(ax, ay);
		grid.cursor = grid.pointToRowCol(ax, ay);
		
		grid.selected = []; // don't clear existing selections if Ctrl is down
		var selected = {mode:'Select',color:'rgb(0,0,0)',shimmer:false,minCol:grid.anchor.col,maxCol:grid.anchor.col,minRow:grid.anchor.row,maxRow:grid.anchor.row};
		grid.focusSelected = selected;
		grid.selected.push(selected);
		grid.page.draw();
		
		grid.ctx.canvas.onmousemove = function(e) {
			
			var mx = e.offsetX;
			var my = e.offsetY;
			
			if (mx < grid.xs[1] || mx > grid.xs[grid.xs.length - 1]|| my < grid.ys[1] || my > grid.ys[grid.ys.length - 1]) { return; }
			
			grid.cursor = grid.pointToRowCol(mx, my);
			grid.selectRange();
		};
		grid.ctx.canvas.onmouseup = function() {
			grid.setKeyHandles();
			grid.ctx.canvas.onmousemove = function(e) { grid.onmousemove(e); };
			grid.ctx.canvas.onmouseup = null;
		};
	};
};
Table.prototype.pointToRowCol = function(x, y) {
	
	// find the cell to call .over on by comparing the mouse pos against the gridlines
	
	var row = null;
	var col = null;
	
	// binary search could be used for large grids
	for (var i = 0; i < this.ys.length - 1; i++) { if (this.ys[i] <= y && y <= this.ys[i + 1]) { row = i; } }
	for (var j = 0; j < this.xs.length - 1; j++) { if (this.xs[j] <= x && x <= this.xs[j + 1]) { col = j; } }
	
	if (row === null || col === null) { throw new Error(); }
	
	return { row : row , col : col };
};
Table.prototype.onhover = function() {
	
	var grid = this;
	this.ctx.canvas.onmousemove = function(e) { grid.onmousemove(e); }
};
Table.prototype.dehover = function() {
	this.ctx.canvas.style.cursor = 'default';
	this.ctx.canvas.onmousedown = null;
	this.ctx.canvas.onmousemove = null;
	this.section.onhover(); // until superseded by this line in box.dehover or whatever, somewhere in box
};
Table.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.data = this.data;
	json.params = {};
	json.params.x = this.box.x;
	json.params.y = this.box.y;
	json.params.hAlign = this.box.hAlign;
	json.params.vAlign = this.box.vAlign;
	json.params.rowSizes = this.rowSizes;
	json.params.colSizes = this.colSizes;
	json.params.margin = {};
	json.params.margin.top = this.margin.tp;
	json.params.margin.left = this.margin.lf;
	json.params.margin.right = this.margin.rt;
	json.params.margin.bottom = this.margin.bt;
	return json;
};
Table.New = function() {
	
	var defaultRowSize = 20;
	var defaultColSize = 64;
};

var Cell = function(parent) {
	
	this.parent = parent;
	
	this.ctx = null;
	
	this.formula = null;
	
	this.dataObj = null;
	this.dataField = null;
	this.data = null;
	this.string = null;
	this.datatype = null;
	
	this.box = {};
	AddBoxVars(this.box);
	
	this.numberFormat = null;
	
	this.font = '10pt serif';
	this.cellFill = 'rgb(255,255,255)';
	this.textFill = 'rgb(0,0,0)';
	this.textAlign = 'left';
	this.textBaseline = 'bottom';
	this.margin = 3;
	this.baseMargin = 7;
	
	this.width = 64;
	this.height = 20;
};
Cell.prototype.draw = function() {
	
	this.ctx.fillStyle = this.cellFill;
	this.ctx.fillRect(this.box.lf, this.box.tp, this.box.wd, this.box.hg);
	
	this.ctx.fillStyle = this.textFill;
	this.ctx.font = this.font;
	this.ctx.textAlign = this.textAlign;
	this.ctx.textBaseline = this.textBaseline;
	
	var x = null;
	var y = null;
	
	if (this.textAlign == 'left')
	{
		x = this.box.lf + this.margin;
	}
	else if (this.textAlign == 'center')
	{
		x = this.box.cx;
	}
	else if (this.textAlign == 'right')
	{
		x = this.box.rt - this.margin;
	}
	else
	{
		throw new Error();
	}
	
	if (this.textBaseline == 'top')
	{
		y = this.box.tp + this.baseMargin;
	}
	else if (this.textBaseline == 'middle')
	{
		y = this.box.cy;
	}
	else if (this.textBaseline == 'bottom')
	{
		y = this.box.bt - this.baseMargin;
	}
	else
	{
		throw new Error();
	}
	
	this.ctx.fillText(this.string, x, y);
};
Cell.prototype.valueToString = function() {
	
	var value = this.data;
	this.datatype = typeof(value);
	
	if (value == null)
	{
		cell.string = "";
	}
	else if (this.datatype == "number")
	{
		var n = Get(cell.numberFormat);
		
		if (n < 0)
		{
			n = 0;
		}
		
		if (n > 20)
		{
			n = 20;
		}
		
		cell.string = value.toFixed(n);
	}
	else if (this.datatype == "string")
	{
		cell.string = value; // apply formatting here - note that when you want to edit, use the raw toString()
	}
	else if (this.datatype == "object")
	{
		if (value.forEach)
		{
			cell.string = "[Array]";
		}
		else
		{
			cell.string = cell.slot.formula;
			//cell.string = cell.tostring(value); // apply formatting here - note that when you want to edit, use the raw toString()
		}
	}
	else if (this.datatype == "boolean")
	{
		cell.string = value.toString();
	}
	else if (this.datatype == "function")
	{
		cell.string = value.name;
	}
	else // undefined, presumably
	{
		cell.string = cell.slot.formula;
		//cell.string = "";
	}
};




var Styles = Components.styles = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.data = json.data;
};
Styles.prototype.add = function() {
	
	this.div = CreateComponentDiv($('#cells'), this);
	this.div.css('border', '1px solid gray');
	this.div.css('background-color', 'rgb(230,230,230)');
	
	//this.addElements();
	
	this.refresh();
};
Styles.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.data = this.data;
	return json;
};
Styles.New = function() {
	
};







function Clear() {
	// we can't just call this.box.clear(), because Box.clear() only clears the handles
	this.ctx.clearRect(this.box.lf, this.box.tp, this.box.wd, this.box.hg);
}
function OnHover() {
	this.box.onhover();
}
function DeHover() {
	
}
function OnMouseMove(e) {
	
	// the Box handles leaving and handles - we only have to deal with controls here
	
	var x = e.offsetX;
	var y = e.offsetY;
	
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
		console.log('warning: component "' + this.name + '" has no controls');
	}
}

var BarChart = Components.barChart = function(json) {
	
	// column	value	color	label
	// '2012'	50	'orange'	'foo'
	// '2012'	50	'orange'	'foo'
	// '2013'	50	'orange'	'foo'
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.data = json.data;
	
	this.ctx = null;
	this.page = null; // set by Canvas.GenerateDocument
	
	this.widthBetweenBars = json.params.widthBetweenBars;
	this.barWidth = json.params.barWidth;
	this.textMargin = json.params.textMargin;
	this.scale = json.params.scale;
	
	this.columns = []; // the columns are created on renewData()
	
	this.controls = []; // the control objects are created on renewData().  on draw(), the control fields are updated with new values
	this.scaleControls = [];
	this.gapControls = [];
	this.barWidthControls = [];
	this.textMarginControls = [];
	
	//this.pageIndex = params.pageIndex ? params.pageIndex : 0;
	this.box = new Box(this);
	this.box.x = json.params.x;
	this.box.y = json.params.y;
	this.box.hAlign = json.params.hAlign;
	this.box.vAlign = json.params.vAlign;
	
	this.subs = []; // the subs need not be contained within the parent's box.  section.onhover will check for sub hovers independently of the parent
	//this.key = new Key(ctx, this, json.params.key);
	//this.subs.push(this.key);
	
	//this.renewData(); // this generates columns and controls
	//this.calculateDimensions(); // this is a separate function because it must be called every time the width, scale, gap, etc. params change
};
BarChart.prototype = Object.create(Grid.prototype);
BarChart.prototype.calculateDimensions = function() {
	
	// here we need to calculate an initial width/height so that we can place the chart correctly
	// that means dynamically determining a scale, and possibly a barWidth and widthBetweenBars
	
	var max = this.columns.map(function(column) { return column.sum; }).reduce(function(a, b) { return Math.max(a, b); });
	
	this.box.wd = this.params.margin.lf + this.params.margin.rt + this.barWidth * this.columns.length + this.widthBetweenBars * (this.columns.length - 1);
	
	// if this we are pasting in new data, the params should stay untouched, including the previously set scale
	if (this.scale)
	{
		this.box.hg = this.params.margin.bt + this.params.margin.tp + max * this.scale;
	}
	else
	{
		this.box.hg = 72 * 6; // magic number, must change
		this.scale = (this.box.hg - this.params.margin.bt - this.params.margin.tp) / max;
	}
	
	this.box.align();
};
BarChart.prototype.renewData = function() {
	
	this.columns = [];
	this.controls = [];
	this.scaleControls = [];
	this.gapControls = [];
	this.barWidthControls = [];
	this.textMarginControls = [];
	
	// we group the data points by bar first - filling this.columns
	var column = null; // [{column:'2012',value:50,color:'orange',label:'foo'},{column:'2012',value:50,color:'orange',label:'foo'}] with 'label':'2012',sum:0
	var columnLabelDict = {}; // {'2012':0,'2013':1}
	
	for (var i = 0; i < this.data.length; i++)
	{
		var obj = this.data[i];
		
		if (columnLabelDict[obj.column] === undefined)
		{
			column = [];
			this.columns.push(column);
			columnLabelDict[obj.column] = this.columns.length - 1;
			column["label"] = obj.column;
			column["sum"] = 0;
		}
		else
		{
			column = this.columns[columnLabelDict[obj.column]];
		}
		
		column.push(obj);
		column["sum"] += parseFloat(obj.value);
	}
	
	var chart = this;
	this.columns.forEach(function(column) { chart.scaleControls.push(new Arrow({parent:chart,ctx:chart.ctx,vert:true,field:'scale',scale:0.01,min:0.01})); }); // scale
	for (var i = 0; i < this.columns.length - 1; i++) { chart.gapControls.push(new Arrow({parent:chart,ctx:chart.ctx,hori:true,field:'widthBetweenBars',scale:1,min:0})); } // widthBetweenBars (gap)
	this.columns.forEach(function(column) { chart.barWidthControls.push(new Arrow({parent:chart,ctx:chart.ctx,hori:true,field:'barWidth',scale:1,min:1})); }); // barWidth
	this.columns.forEach(function(column) { chart.textMarginControls.push(new Arrow({parent:chart,ctx:chart.ctx,vert:true,field:'textMargin',scale:1,min:0})); }); // textMargin
	
	this.scaleControls.forEach(function(control) { chart.controls.push(control); });
	this.gapControls.forEach(function(control) { chart.controls.push(control); });
	this.barWidthControls.forEach(function(control) { chart.controls.push(control); });
	this.textMarginControls.forEach(function(control) { chart.controls.push(control); });
};
BarChart.prototype.draw = function() {
	
	var ctx = this.ctx;
	var objs = this.data;
	
	var widthBetweenBars = this.widthBetweenBars;
	var barWidth = this.barWidth;
	var textMargin = this.textMargin;
	var scale = this.scale;
	
	var chartLf = this.box.lf;
	var chartBt = this.box.bt;
	var marginLf = this.params.margin.lf;
	var marginBt = this.params.margin.bt;
	
	this.clear();
	
	for (var i = 0; i < this.columns.length; i++)
	{
		var column = this.columns[i];
		
		var totalHeight = 0;
		var totalValue = 0;
		
		var columnLabel = column.label;
		
		var left = chartLf + marginLf + (widthBetweenBars + barWidth) * i;
		var columnRight = left + barWidth;
		var columnBottom = chartBt - marginBt;
		
		for (var k = 0; k < column.length; k++)
		{
			var str = column[k].value;
			var label = column[k].label;
			var color = column[k].color;
			
			var num = parseFloat(str);
			var height = num * scale;
			
			// bar segment
			totalValue += num;
			totalHeight += height;
			var top = columnBottom - totalHeight;
			ctx.fillStyle = color;
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'black';
			ctx.fillRect(left, top, barWidth, height);
			// ctx.strokeRect(left, top, barWidth, height);
			
			// segment label
			// "segmentLabelStyle":{"font":"10pt sans-serif","fillStyle":"white","textAlign":"center","textBaseline":"middle"}
			ctx.font = '10pt sans-serif'; // parametrize - these labels should be probably be Text widgets
			ctx.fillStyle = 'white'; // parametrize
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			var text = label; // or format 'num'
			var x = left + barWidth / 2;
			var y = top + height / 2;
			ctx.fillText(text, x, y);
		}
		
		// top label
		// "topLabelStyle":{"font":"10pt sans-serif","fillStyle":"black","textAlign":"center","textBaseline":"bottom"}
		ctx.font = '10pt sans-serif'; // parametrize
		ctx.fillStyle = 'black'; // parametrize
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		var text = totalValue.toString();
		var x = chartLf + marginLf + (widthBetweenBars + barWidth) * i + barWidth / 2;
		var y = columnBottom - totalHeight - textMargin;
		ctx.fillText(text, x, y);
		
		// bottom label
		// "bottomLabelStyle":{"font":"10pt sans-serif","fillStyle":"black","textAlign":"center","textBaseline":"top"}
		ctx.font = '10pt sans-serif'; // parametrize
		ctx.fillStyle = 'black'; // parametrize
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		var text = columnLabel;
		var x = chartLf + marginLf + (widthBetweenBars + barWidth) * i + barWidth / 2;
		var y = chartBt - marginBt + textMargin;
		ctx.fillText(text, x, y);
		
		// leave some room (10px) for the barWidth control at the bottom
		ReconcileBox(this.scaleControls[i], {lf:left,wd:barWidth,bt:columnBottom - 10,hg:totalHeight - 10});
		
		if (i < this.columns.length - 1)
		{
			ReconcileBox(this.gapControls[i], {lf:columnRight,wd:widthBetweenBars,bt:columnBottom,hg:10});
		}
		
		ReconcileBox(this.barWidthControls[i], {lf:left,wd:barWidth,bt:columnBottom,hg:10});
		
		ReconcileBox(this.textMarginControls[i], {lf:left,wd:barWidth,tp:columnBottom,hg:textMargin});
	}
	
	this.key.draw();
};
BarChart.prototype.clear = Clear;
BarChart.prototype.onhover = OnHover;
BarChart.prototype.dehover = DeHover;
BarChart.prototype.onmousemove = OnMouseMove;
BarChart.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	
	json.params = {};
	
	json.data = this.data;
	
	json.params.widthBetweenBars = this.widthBetweenBars;
	json.params.barWidth = this.barWidth;
	json.params.textMargin = this.textMargin;
	json.params.scale = this.scale;
	
	//json.params.pageIndex = this.pageIndex;
	json.params.x = this.box.x;
	json.params.y = this.box.y;
	json.params.hAlign = this.box.hAlign;
	json.params.vAlign = this.box.vAlign;
	
	json.params.margin = {};
	json.params.margin.lf = this.params.margin.lf;
	json.params.margin.rt = this.params.margin.rt;
	json.params.margin.tp = this.params.margin.tp;
	json.params.margin.bt = this.params.margin.bt;
	
	json.params.label = {};
	json.params.label.lf = this.params.label.lf;
	json.params.label.rt = this.params.label.rt;
	json.params.label.tp = this.params.label.tp;
	json.params.label.bt = this.params.label.bt;
	
	json.params.keyLeft = this.params.keyLeft;
	json.params.keyTop = this.params.keyTop;
	
	return json;
};

var LineChart = Components.lineChart = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.data = json.data;
	
	this.ctx = null;
	
	this.page = null;
	
	this.xAxisKey = json.params.xAxisKey;
	
	this.textMargin = json.params.textMargin;
	this.xMin = json.params.xMin;
	this.xMax = json.params.xMax;
	this.yMin = json.params.yMin;
	this.yMax = json.params.yMax;
	
	// filled in in draw after the box is reconciled
	// the problem is that page is not set at this point, so we can't yet calculate the correct box wd and hg
	// so we defer that, and thus the calculation of the scale, until the first draw
	this.xScale = null;
	this.yScale = null;
	
	this.key = json.params.key;
	this.margin = json.params.margin;
	this.labels = json.params.label;
	
	this.controls = [];
	
	//this.pageIndex = params.pageIndex ? params.pageIndex : 0;
	this.box = new Box(this);
	this.box.x = json.params.x;
	this.box.y = json.params.y;
	this.box.hAlign = json.params.hAlign;
	this.box.vAlign = json.params.vAlign;
	this.reconciled = false;
	
	//this.xAxis = new Axis(ctx, this, json.params.xAxis, 'x');
	//this.yAxis = new Axis(ctx, this, json.params.yAxis, 'y');
};
LineChart.prototype = Object.create(Grid.prototype);
LineChart.prototype.draw = function() {
	
	// xAxis	cars	trucks	vans	buses
	// 0	60	50	100	200	300
	
	var ctx = this.ctx;
	
	var colormap = {};
	for (var i = 0; i < this.key.data.length; i++) { colormap[this.key.data[i].label] = this.key.data[i].color; }
	
	if (!this.reconciled)
	{
		this.box.wd = this.page.document.page.width * this.page.document.pixelsPerUnit - this.page.margin.lf - this.page.margin.rt;
		this.box.hg = this.page.document.page.height * this.page.document.pixelsPerUnit - this.page.margin.tp - this.page.margin.bt;
		this.box.align();
		this.reconciled = true;
	}
	
	var xPixelWidth = this.box.wd - this.margin.lf - this.margin.rt;
	var yPixelWidth = this.box.hg - this.margin.tp - this.margin.bt;
	var xValueWidth = this.xMax - this.xMin;
	var yValueWidth = this.yMax - this.yMin;
	this.xScale = xPixelWidth / xValueWidth;
	this.yScale = yPixelWidth / yValueWidth;
	
	var firstObj = this.data[0];
	
	for (var key in firstObj)
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = colormap[key];
		
		if (key == this.xAxisKey) { continue; }
		
		ctx.beginPath();
		
		for (var i = 0; i < this.data.length; i++)
		{
			var val = this.data[i][key];
			
			if (val == null || val == '') { continue; } // skip over blank entries
			
			var xNum = parseFloat(this.data[i][this.xAxisKey]);
			var yNum = parseFloat(val);
			
			var x = this.box.lf+this.margin.lf+(xNum-this.xMin)*this.xScale;
			var y = this.box.bt-this.margin.bt-(yNum-this.yMin)*this.yScale;
			
			if (i == 0)
			{
				ctx.moveTo(x, y);
			}
			else
			{
				ctx.lineTo(x, y);
			}
		}
		
		ctx.stroke();
	}
	
	this.xAxis.draw();
	this.yAxis.draw();
};
LineChart.prototype.clear = Clear;
LineChart.prototype.onhover = OnHover;
LineChart.prototype.dehover = DeHover;
LineChart.prototype.onmousemove = OnMouseMove;
LineChart.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	
	json.data = this.data;
	
	json.params = {};
	json.params.x = this.box.x;
	json.params.y = this.box.y;
	json.params.hAlign = this.box.hAlign;
	json.params.vAlign = this.box.vAlign;
	json.params.xAxisKey = this.xAxisKey;
	json.params.textMargin = this.textMargin;
	json.params.xMin = this.xMin;
	json.params.xMax = this.xMax;
	json.params.yMin = this.yMin;
	json.params.yMax = this.yMax;
	json.params.xHashInterval = this.xHashInterval;
	json.params.yHashInterval = this.yHashInterval;
	json.params.key = this.key;
	json.params.margin = this.margin;
	json.params.labels = this.label;
	
	return json;
};

var ScatterChart = Components.scatterChart = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.data = json.data;
	
	this.ctx = null;
	
	this.page = null;
	
	this.textMargin = json.params.textMargin;
	this.xMin = json.params.xMin;
	this.xMax = json.params.xMax;
	this.yMin = json.params.yMin;
	this.yMax = json.params.yMax;
	this.xHashInterval = json.params.xHashInterval;
	this.yHashInterval = json.params.yHashInterval;
	
	this.radiusScale = json.params.radiusScale;
	
	this.key = json.params.key;
	this.margin = json.params.margin;
	this.labels = json.params.label;
	
	this.controls = [];
	
	//this.pageIndex = params.pageIndex ? params.pageIndex : 0;
	this.box = new Box(this);
	this.box.x = json.params.x;
	this.box.y = json.params.y;
	this.box.hAlign = json.params.hAlign;
	this.box.vAlign = json.params.vAlign;
	this.reconciled = false;
	
	//this.xAxis = new Axis(ctx, this, params);
	//this.yAxis = new Axis(ctx, this, params);
}
ScatterChart.prototype = Object.create(Grid.prototype);
ScatterChart.prototype.draw = function() {
	
	// x	y	r	color	shape	label	style
	// 10	20	5	'orange'	'circle'	'foo'	'centered'
	
	var ctx = this.ctx;
	
	if (!this.reconciled)
	{
		this.box.wd = this.page.document.page.width * this.page.document.pixelsPerUnit - this.page.margin.lf - this.page.margin.rt;
		this.box.hg = this.page.document.page.height * this.page.document.pixelsPerUnit - this.page.margin.tp - this.page.margin.bt;
		this.box.align();
		this.reconciled = true;
	}
	
	var xPixelWidth = this.box.wd - this.margin.lf - this.margin.rt;
	var yPixelWidth = this.box.hg - this.margin.tp - this.margin.bt;
	var xValueWidth = this.xMax - this.xMin;
	var yValueWidth = this.yMax - this.yMin;
	var xScale = xPixelWidth / xValueWidth;
	var yScale = yPixelWidth / yValueWidth;
	
	for (var i = 0; i < this.data.length; i++)
	{
		var obj = this.data[i];
		
		var xNum = parseFloat(obj.x);
		var yNum = parseFloat(obj.y);
		var rNum = parseFloat(obj.r);
		
		var x = this.box.lf+this.margin.lf+(xNum-this.xMin)*xScale;
		var y = this.box.bt-this.margin.bt-(yNum-this.yMin)*yScale;
		var r = rNum * this.radiusScale;
		
		var fill = null;
		var stroke = null;
		
		var lineWidth = 2;
		var lineColor = 'black';
		
		// individual overrides for label params
		if (obj.labelFont) { labelFont = obj.labelFont; }
		if (obj.labelColor) { labelColor = obj.labelColor; }
		if (obj.labelYOffset) { labelYOffset = obj.labelYOffset; }
		if (obj.color) { fill = obj.color; }
		if (obj.stroke) { stroke = obj.stroke; }
		if (obj.lineWidth) { lineWidth = obj.lineWidth; }
		if (obj.lineColor) { lineColor = obj.lineColor; }
		
		if (fill)
		{
			ctx.fillStyle = obj.color;
			ctx.fillCircle(x, y, r);
		}
		
		if (stroke)
		{
			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = lineColor;
			ctx.strokeCircle(x, y, r);
		}
		
		// label
		ctx.font = '10pt sans-serif'; // parametrize
		ctx.fillStyle = 'white'; // parametrize
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(obj.label, x, y);
	}
	
	//this.xAxis.draw();
	//this.yAxis.draw();
};
ScatterChart.prototype.clear = Clear;
ScatterChart.prototype.onhover = OnHover;
ScatterChart.prototype.dehover = DeHover;
ScatterChart.prototype.onmousemove = OnMouseMove;
ScatterChart.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	
	json.data = this.data;
	
	json.params = {};
	json.params.x = this.box.x;
	json.params.y = this.box.y;
	json.params.hAlign = this.box.hAlign;
	json.params.vAlign = this.box.vAlign;
	json.params.textMargin = this.textMargin;
	json.params.xMin = this.xMin;
	json.params.xMax = this.xMax;
	json.params.yMin = this.yMin;
	json.params.yMax = this.yMax;
	json.params.xHashInterval = this.xHashInterval;
	json.params.yHashInterval = this.yHashInterval;
	json.params.radiusScale = this.radiusScale;
	json.params.key = this.key;
	json.params.margin = this.margin;
	json.params.labels = this.label;
	
	return json;
};
function RegularPolygon(ctx, x, y, r, n, angle) {
	
}
function Star(ctx, x, y, r, angle) {
	
}
function Cross(ctx, x, y, r, angle) {
	
}



var Paragraphs = Components.paragraphs = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.text = null;
	
	this.ctx = null;
	
	this.page = null; // this should be section, actually
	this.isParagraph = true; // used to sort paragraph widgets from other types in Section.init
	
	this.box = null; // needed because page.onhover requires that every top-level widget have a box
	
	this.textComponentName = json.params.text;
	this.pitch = json.params.pitch;
	this.indent = json.params.indent;
	this.style = json.params.style; // this is just a string
	
	this.template = null;
	this.variables = null;
	
	this.words = null;
}
Paragraphs.prototype.add = function() {
	
	this.div = CreateComponentDiv($('#cells'), this);
	this.div.css('border', '1px solid gray');
	this.div.css('background-color', 'rgb(230,230,230)');
	
	var table = $('<table></table>');
	var tr = $('<tr><td style="text-align:right">text component name:</td></tr>');
	var nameInput = $('<input type="text"></input>');
	tr.append(nameInput);
	table.append(tr);
	var tr = $('<tr><td style="text-align:right">pitch:</td></tr>');
	var pitchInput = $('<input type="text"></input>');
	tr.append(pitchInput);
	table.append(tr);
	var tr = $('<tr><td style="text-align:right">indent:</td></tr>');
	var indentInput = $('<input type="text"></input>');
	tr.append(indentInput);
	table.append(tr);
	var tr = $('<tr><td style="text-align:right">style:</td></tr>');
	var styleInput = $('<input type="text"></input>');
	tr.append(styleInput);
	table.append(tr);
	
	this.div.append(table);
};
Paragraphs.prototype.setTextComponentName = function(name) {
	this.textComponentName = name;
	var text = Griddl.GetData(this.textComponentName);
	this.setData(text);
};
Paragraphs.prototype.drawKnuth = function() {
	
	var params = this.params;
	
	this.SetStyle(params.style);
	
	var text = params.text;
	
	var lineWidths = [];
	var linePoints = [];
	
	var type = 'justify';
	var tolerance = 3;
	var center = false;
	var verticalSpacing = params.pitch;
	
	for (var i = 0; i < params.boxes.length; i++)
	{
		var box = params.boxes[i];
		var sumHeight = 0;
		
		while (sumHeight < box.height)
		{
			lineWidths.push(box.width);
			linePoints.push({page:box.page,left:box.left,top:box.top+sumHeight});
			sumHeight += verticalSpacing;
		}
	}
	
	var g = this;
	var format = null;
	
	if (g.savedCanvasContext)
	{
		//format = Typeset.formatter(function(str) { return g.savedCanvasContext.measureText(str).width; });
		format = Typeset.formatter(function(str) { return g.measureText(str); });
	}
	else
	{
		format = Typeset.formatter(function(str) { return g.measureText(str); });
	}
	
	var nodes = format[type](text);
	var breaks = Typeset.linebreak(nodes, lineWidths, { tolerance : tolerance });
	if (breaks.length == 0) { throw new Error('Paragraph can not be set with the given tolerance'); }
	
	var lines = [];
	var lineStart = 0;
	
	// Iterate through the line breaks, and split the nodes at the correct point.
	for (var i = 1; i < breaks.length; i++)
	{
		var point = breaks[i].position;
		var r = breaks[i].ratio;
		
		for (var j = lineStart; j < nodes.length; j++)
		{
			// After a line break, we skip any nodes unless they are boxes or forced breaks.
			if (nodes[j].type === 'box' || (nodes[j].type === 'penalty' && nodes[j].penalty === -Typeset.linebreak.infinity))
			{
				lineStart = j;
				break;
			}
		}
		
		lines.push({ ratio : r , nodes : nodes.slice(lineStart, point + 1) , position : point });
		lineStart = point;
	}
	
	var maxLength = Math.max.apply(null, lineWidths);
	
	for (var i = 0; i < lines.length; i++)
	{
		var line = lines[i];
		var lineLength = i < lineWidths.length ? lineWidths[i] : lineWidths[lineWidths.length - 1];
		
		var x = linePoints[i].left;
		var y = linePoints[i].top;
		this.SetActivePage(linePoints[i].page);
		
		if (center) { x += (maxLength - lineLength) / 2; }
		
		for (var k = 0; k < line.nodes.length; k++)
		{
			var node = line.nodes[k];
			
			if (node.type === 'box')
			{
				this.fillText(node.value, x, y);
				x += node.width;
			}
			else if (node.type === 'glue')
			{
				x += node.width + line.ratio * (line.ratio < 0 ? node.shrink : node.stretch);
			}
			else if (node.type === 'penalty' && node.penalty === 100 && k === line.nodes.length - 1)
			{
				this.fillText('-', x, y);
			}
		}
	}
};
Paragraphs.prototype.substitute = function() {
	
	this.text = this.template;
	
	for (var i = 0; i < this.variables.length; i++)
	{
		var name = this.variables[i].name;
		var value = this.variables[i].value;
		
		while (this.text.search('@' + name) >= 0)
		{
			this.text = this.text.replace('@' + name, value);
		}
	}
};
Paragraphs.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.data = this.text;
	json.params = {};
	json.params.variables = this.variables;
	json.params.pitch = this.pitch;
	json.params.indent = this.indent;
	json.params.style = this.style;
	return json;
};



var Axis = function(ctx, chart, params, axis) {
	
	this.ctx = ctx;
	this.chart = chart;
	this.params = params;
	this.axis = axis;
	this.anti = ((axis == 'x') ? 'y' : 'x');
	
	this.strokeStyle = params.strokeStyle ? params.strokeStyle : 'black';
	this.tickLabelFont = params.tickLabelFont ? params.tickLabelFont : '10pt sans-serif';
	this.tickLabelColor = params.tickLabelColor ? params.tickLabelColor : 'black';
	this.tickLength = params.tickLength ? params.tickLength : 5;
	this.tickInterval = params.tickInterval; // calculate default value based on data?
	
	// this.chart.min[this.axis]
	this.axisValue = params.axisValue ? params.axisValue : Math.max(0, ((this.axis == 'x') ? this.chart.yMin : this.chart.xMin)); // the data value that corresponds to the axis
};
Axis.prototype.draw = function() {
	
	var ctx = this.ctx;
	
	var axisPixel = null;
	var sta = null;
	var end = null;
	var fixed = null;
	
	if (this.axis == 'x')
	{
		axisPixel = this.chart.box.bt - this.chart.margin.bt - Math.floor((this.axisValue - this.chart.yMin) * this.chart.yScale, 1);
		sta = this.chart.box.lf + this.chart.margin.lf;
		end = this.chart.box.rt - this.chart.margin.rt;
	}
	else if (this.axis == 'y')
	{
		axisPixel = this.chart.box.lf + this.chart.margin.lf + Math.floor((this.axisValue - this.chart.xMin) * this.chart.xScale, 1);
		sta = this.chart.box.bt - this.chart.margin.bt;
		end = this.chart.box.tp + this.chart.margin.tp;
	}
	
	fixed = axisPixel + 0.5;
	
	ctx.lineWidth = 1;
	ctx.strokeStyle = this.strokeStyle;
	ctx.font = this.tickLabelFont;
	ctx.fillStyle = this.tickLabelColor;
	
	var x1 = ((this.axis == 'x') ? sta : fixed);
	var y1 = ((this.axis == 'x') ? fixed : sta);
	var x2 = ((this.axis == 'x') ? end : fixed);
	var y2 = ((this.axis == 'x') ? fixed : end);
	ctx.drawLine(x1, y1, x2, y2);
	
	// this basically rounds axisValue down to the nearest tickInterval
	var tickValueCursor = Math.floor(this.axisValue / this.tickInterval, 1) * this.tickInterval;
	
	var maxTickmarks = 100;
	var tickmarkIndex = 0;
	
	while (tickmarkIndex < maxTickmarks)
	{
		tickValueCursor += this.tickInterval;
		
		// unwieldy text concat
		var direction = ((this.axis == 'x') ? 1 : -1);
		
		// here we need the other axis pixel
		var tickPixelCursor = Math.floor(axisPixel + direction * (tickValueCursor - this.axisValue) * this.chart[this.axis + 'Scale'], 1) + 0.5;
		
		if ((this.axis == 'x') && (tickPixelCursor >= this.chart.box.rt - this.chart.margin.rt)) { break; }
		if ((this.axis == 'y') && (tickPixelCursor <= this.chart.box.tp + this.chart.margin.tp)) { break; }
		
		var sta = axisPixel - this.tickLength;
		var end = axisPixel + this.tickLength + 1;
		var fixed = tickPixelCursor;
		var x1 = ((this.axis == 'y') ? sta : fixed); // (this.axis == 'y') indicates a contra stroke
		var y1 = ((this.axis == 'y') ? fixed : sta);
		var x2 = ((this.axis == 'y') ? end : fixed);
		var y2 = ((this.axis == 'y') ? fixed : end);
		ctx.drawLine(x1, y1, x2, y2);
		
		var text = tickValueCursor.toString(); // need number formatting here
		
		if (this.axis == 'x')
		{
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			ctx.fillText(text, tickPixelCursor, axisPixel + this.tickLength + 4);
		}
		else if (this.axis == 'y')
		{
			ctx.textAlign = 'right';
			ctx.textBaseline = 'middle';
			ctx.fillText(text, axisPixel - this.tickLength - 4, tickPixelCursor);
		}
		
		tickmarkIndex++;
	}
};
Axis.prototype.onhover = OnHover;
Axis.prototype.dehover = DeHover;
Axis.prototype.onmousemove = OnMouseMove;
Axis.prototype.exportToJson = function() {
	
};

var Key = function(ctx, chart, params) {
	
	this.ctx = ctx;
	this.chart = chart;
	this.params = params;
	
	this.page = null; // Widget.setPage(page) should be a thing.  then the widget can set the page field of its subs
	
	this.labelColors = params.data;
	
	this.text = {};
	this.text.font = params.font ? params.font : '10pt sans-serif';
	this.text.fillStyle = params.textColor ? params.textColor : 'black';
	this.text.hAlign = 'left';
	this.text.vAlign = 'center';
	
	// but how do we know these units are at all appropriate for the chosen scale?
	this.boxSize = params.boxSize ? params.boxSize : 10;
	this.vGap = params.vGap ? params.vGap : 10;
	this.labelOffset = params.labelOffset ? params.labelOffset : 5;
	
	this.controls = [];
	
	this.box = new Box(this);
	this.box.x = params.x;
	this.box.y = params.y;
	this.box.hAlign = params.hAlign;
	this.box.vAlign = params.vAlign;
	this.box.parent = this.chart.box;
	this.box.anchorX = 'rt';
	this.box.anchorY = 'cy';
	
	this.box.wd = 100; // we need to measure text to do this correctly
	this.box.hg = this.labelColors.length * this.boxSize + (this.labelColors.length - 1) * this.vGap;
	this.box.align();
};
Key.prototype.draw = function() {
	
	this.page = this.chart.page; // temporary fix until the implementation of Widget.setPage (which will set pages for the widget's subs)
	
	for (var i = 0; i < this.labelColors.length; i++)
	{
		var x = this.box.parent[this.box.anchorX] + this.box.lf;
		var y = this.box.parent[this.box.anchorY] + this.box.tp + i * (this.boxSize + this.vGap);
		
		this.ctx.fillStyle = this.labelColors[i].color;
		this.ctx.fillRect(x, y, this.boxSize, this.boxSize);
		this.ctx.font = this.text.font;
		this.ctx.fillStyle = this.text.textColor;
		this.ctx.textAlign = this.text.hAlign;
		this.ctx.textBaseline = ((this.text.vAlign == 'center') ? 'middle' : this.text.vAlign);
		this.ctx.fillText(this.labelColors[i].label, x + this.boxSize + this.labelOffset, y + this.boxSize / 2);
	}
};
Key.prototype.onhover = OnHover;
Key.prototype.dehover = DeHover;
Key.prototype.onmousemove = OnMouseMove;
Key.prototype.exportToJson = function() {
	
};

// this is a one-dimensional scale control, used to scale bars and adjust gaps (=scaling a fixed underlying value of 1)
function Arrow(params) {
	
	this.parent = params.parent;
	this.ctx = params.ctx;
	this.field = params.field;
	this.hori = params.hori ? true : false;
	this.vert = params.vert ? true : false;
	this.scale = params.scale;
	this.min = params.min;
	
	this.origValue = null; // store the original parameter value here when a drag begins
	this.percent = 100; // this will change during a drag
	
	// this is not exactly the right way to think about this - what we want is to maintain the relative position of the mouse pointer
	// relative to the bar, or the gap, or whatever
	// so if the mouse pointer starts 60% of the way up the bar, we want it to stay at 60%
	this.percentPerPixel = 10;
	
	this.patch = null;
	
	this.strokeStyle = 'rgb(255,0,0)';
	this.lineWidth = 1;
	this.fletchLength = 5;
	this.fletchAngle = 45;
	
	this.circleColor = 'rgb(0,0,255)';
	this.circleRadius = 3;
	
	AddBoxVars(this);
}
Arrow.prototype.draw = function() {
	
	this.patch = this.ctx.getImageData(this.lf - 1, this.tp - 1, this.wd + 2, this.hg + 2); // some padding on the edges to accomodate the +0.5 stuff
	
	var ctx = this.ctx;
	
	ctx.lineWidth = this.lineWidth;
	ctx.strokeStyle = this.strokeStyle;
	
	var dx = this.fletchLength * Math.cos(this.fletchAngle / 360 * Math.PI * 2);
	var dy = this.fletchLength * Math.cos(this.fletchAngle / 360 * Math.PI * 2);
	
	// once again, the +0.5 stuff haunts us
	// added for hori, not yet for vert
	
	if (this.hori)
	{
		ctx.drawLine(this.lf, this.cy+0.5, this.rt   , this.cy+0.5   );
		ctx.drawLine(this.lf, this.cy+0.5, this.lf+dx, this.cy+0.5-dy); // lf tp fletch
		ctx.drawLine(this.lf, this.cy+0.5, this.lf+dx, this.cy+0.5+dy); // lf bt fletch
		ctx.drawLine(this.rt, this.cy+0.5, this.rt-dx, this.cy+0.5-dy); // rt tp fletch
		ctx.drawLine(this.rt, this.cy+0.5, this.rt-dx, this.cy+0.5+dy); // rt bt fletch
	}
	
	if (this.vert)
	{
		ctx.drawLine(this.cx+0.5, this.tp, this.cx+0.5   , this.bt   );
		ctx.drawLine(this.cx+0.5, this.tp, this.cx+0.5-dx, this.tp+dy); // tp lf fletch
		ctx.drawLine(this.cx+0.5, this.tp, this.cx+0.5+dx, this.tp+dy); // tp rt fletch
		ctx.drawLine(this.cx+0.5, this.bt, this.cx+0.5-dx, this.bt-dy); // bt lf fletch
		ctx.drawLine(this.cx+0.5, this.bt, this.cx+0.5+dx, this.bt-dy); // bt rt fletch
	}
	
	ctx.fillStyle = this.circleColor;
	ctx.fillCircle(this.cx, this.cy+0.5, this.circleRadius);
};
Arrow.prototype.clear = function() {
	this.ctx.putImageData(this.patch, this.lf - 1, this.tp - 1);
};
Arrow.prototype.ondrag = function(d) {
	
	this.parent[this.field] += d * this.scale;
	if (this.parent[this.field] < this.min) { this.parent[this.field] = this.min; }
	this.parent.calculateDimensions();
};
Arrow.prototype.onhover = function() {
	
	//Debug('Arrow.onhover');
	
	var arrow = this;
	
	this.draw();
	
	this.ctx.canvas.onmousemove = function(e) { arrow.onmousemove(e); };
	
	this.ctx.canvas.onmousedown = function(e) {
		
		var ax = e.offsetX;
		var ay = e.offsetY;
		
		arrow.ctx.canvas.onmousemove = function(e) {
			
			var d = 0;
			
			if (arrow.hori)
			{
				var mx = e.offsetX;
				d = mx - ax;
				ax = mx;
			}
			else if (arrow.vert)
			{
				var my = e.offsetY;
				d = my - ay;
				ay = my;
			}
			else
			{
				throw new Error();
			}
			
			// this sequence attempts to limit clearing and redrawing to the parent box
			// this is an optimization, and can be saved until it is really necessary
			//arrow.parent.clear();
			//arrow.ondrag(d);
			//arrow.parent.draw();
			//arrow.draw();
			
			// this just clears and redraws the whole canvas
			arrow.ondrag(d);
			arrow.parent.page.draw();
			arrow.draw();
		};
		arrow.ctx.canvas.onmouseup = function(e) {
			arrow.ctx.canvas.onmousemove = function(e) { arrow.onmousemove(e); };
			arrow.ctx.canvas.onmouseup = null;
			arrow.onmousemove(e);
			
			// we should probably save the existing document JSON to enable undo/redo
			Griddl.SetData('document', JSON.stringify(arrow.parent.page.document.exportToJson()));
			
			//arrow.parent.draw();
		};
	};
};
Arrow.prototype.dehover = function() {
	//Debug('Arrow.dehover');
	this.ctx.canvas.onmousedown = null;
	this.clear();
	this.parent.onhover();
};
Arrow.prototype.onmousemove = function(e) {
	
	var x = e.offsetX;
	var y = e.offsetY;
	
	if (x < this.lf || x > this.rt || y < this.tp || y > this.bt)
	{
		this.dehover();
	}
};



var Gridlist = function(ctx, data, keys) {
	
	// should we have a separate Element class (or Row or what have you) to handle the expand/collapse controls?
	
	this.ctx = ctx;
	this.data = data;
	
	this.fields = null;
	this.childField = 'subs'; // should we make this an argument to the constructor or something?
	
	if (keys)
	{
		this.fields = keys;
	}
	else
	{
		this.fields = [];
		var fieldDict = {};
		for (var i = 0; i < this.data.length; i++)
		{
			for (var key in this.data[i])
			{
				if (!fieldDict[key])
				{
					fieldDict[key] = this.fields.length + 1; // 1-index the dictionary because 0 reads as false
					this.fields.push(key);
				}
			}
		}
	}
	
	this.indent = 20;
	this.height = 25;
	this.widths = [];
	for (var i = 0; i < this.fields.length; i++) { this.widths.push(100); }
	
	this.box = {};
	AddBoxVars(this.box);
};
Gridlist.prototype.draw = function() {
	
	var y = this.box.tp;
	
	this.ctx.textBaseline = 'middle';
	
	var gl = this;
	
	function DrawRec(tier, left) {
		
		for (var i = 0; i < tier.length; i++)
		{
			var dx = 0;
			
			for (var j = 0; j < gl.fields.length; j++)
			{
				gl.ctx.strokeRect(left + dx + 0.5, y + 0.5, gl.widths[j], gl.height);
				gl.ctx.fillText(tier[i][gl.fields[j]].toString(), left + dx + 2, y + gl.height / 2);
				dx += gl.widths[j];
			}
			
			y += gl.height;
			
			if (tier[i][gl.childField]) { DrawRec(tier[i][gl.childField], left + gl.indent); }
		}
		
	}
	
	DrawRec(this.data, this.box.lf);
};

// graph can wait until version 2.0
var Graph = Components.graph = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.text = json.data;
	
	this.ctx = null;
	
	this.section = null;
	
	this.nodes = null;
	this.edges = null;
	
	this.displayControlPoints = false; // toggle this with a control - hopefully this will eliminate the need for node/edge selection
	
	this.box = new Box(this);
	
	//this.read(json.data);
	//this.randomPlacement();
};
Graph.prototype = Object.create(Text.prototype);
Graph.prototype.read = function(text) {
	
	// input should be a text component with lines like a -> b
	
	var lines = text.split('\n');
	
	this.nodes = [];
	this.edges = [];
	
	var nodeDict = {};
	
	for (var i = 0; i < lines.length; i++)
	{
		var parts = lines[i].split(' ');
		var srcName = parts[0];
		var dstName = parts[2];
		
		if (!nodeDict[srcName])
		{
			var src = new Node(this, this.ctx, {label:srcName});
			this.nodes.push(src);
			nodeDict[srcName] = src;
		}
		
		if (!nodeDict[dstName])
		{
			var dst = new Node(this, this.ctx, {label:dstName});
			this.nodes.push(dst);
			nodeDict[dstName] = dst;
		}
		
		this.edges.push(new Edge(this, this.ctx, {src:nodeDict[srcName],dst:nodeDict[dstName]}));
	}
};
Graph.prototype.rankedPlacement = function() {
	
	var squareSideLength = Math.floor(Math.sqrt(this.nodes.length), 1);
	
	var spacing = 50;
	var x = 0;
	var y = 0;
	
	for (var i = 0; i < this.nodes.length; i++)
	{
		this.nodes[i].x = (x+1)*spacing;
		this.nodes[i].y = (y+1)*spacing;
		x++;
		if (x >= squareSideLength) { x = 0; y++; }
	}
};
Graph.prototype.randomPlacement = function() {
	
	var wd = 500;
	var hg = 500;
	
	for (var i = 0; i < this.nodes.length; i++)
	{
		this.nodes[i].x = Math.random() * wd;
		this.nodes[i].y = Math.random() * hg;
	}
};
Graph.prototype.draw = function() {
	
	this.nodes.forEach(function(node) { node.draw(); });
	this.edges.forEach(function(edge) { edge.draw(); });
	
	//for (var i = 0; i < nodes.length; i++)
	//{
	//	var node = nodes[i];
	//	
	//	var x = node.x;
	//	var y = node.y;
	//	var r = 20;
	//	
	//	//g.SetSvgId('node' + i.toString());
	//	g.fillStyle = 'white';
	//	g.strokeStyle = 'black';
	//	g.lineWidth = 2;
	//	g.beginPath();
	//	g.arc(x, y, r, 0, Math.PI * 2, true);
	//	g.fill();
	//	
	//	//g.SetSvgId('label'+i);
	//	g.fillStyle = 'black';
	//	g.strokeStyle = 'black';
	//	g.lineWidth = 0;
	//	g.textAlign = 'center';
	//	g.textBaseline = 'middle';
	//	g.font = '12pt sans-serif';
	//	g.fillText(node.name, x, y);
	//}
};
Graph.prototype.forceDirectedLayout = function(reps) {
	
	// this particular function was for the county population pies - as such, there is a "natural" (x,y) coordinate for each obj
	// this is not implemented yet, but the obj should be attracted to its natural location and repelled by other objects
	// various forms of force-directed layout functions:
	//  1. natural location (no edges) (= attracted to natural coordinates, repulsed from all nearby nodes)
	//   1a. centered (or otherwise clustered) (= attracted to center of graph (or multiple loci of attraction), repulsed from all nearby nodes)
	//  2. graph with edges (= attracted to connected nodes, repulsed from all nearby nodes)
	
	var objs = this.nodes;
	
	for (var rep = 0; rep < reps; rep++)
	{
		var forcess = [];
		
		for (var i = 0; i < objs.length; i++)
		{
			var xA = objs[i].x;
			var yA = objs[i].y;
			var rA = objs[i].r;
			
			var forces = [];
			
			for (var j = 0; j < objs.length; j++)
			{
				if (i == j) { continue; }
				
				var xB = objs[j].x;
				var yB = objs[j].y;
				var rB = objs[j].r;
				
				// quickly discard highly separated nodes, so as to circumvent the heavy sqrt calculation
				if (xA - xB < -100 || xA - xB > 100) { continue; }
				if (yA - yB < -100 || yA - yB > 100) { continue; }
				
				var d = Math.sqrt((xA-xB)*(xA-xB)+(yA-yB)*(yA-yB));
				
				// this culls too much - sometimes nodes that are somewhat widely separated should feel a force, to account for intermediate traffic jams
				//if (d > (rA + rB + 20)) { continue; }
				
				var force = {};
				force.target = objs[i].label;
				force.source = objs[j].label;
				force.angle = -Math.atan2(yB-yA,xB-xA);
				force.readableAngle = force.angle / (Math.PI * 2);
				//force.magnitude = 5;
				force.magnitude = rA + rB - d + 10; // the 10 is the optimum distance between the circles
				forces.push(force);
			}
			
			forcess.push(forces);
		}
		
		for (var i = 0; i < forcess.length; i++)
		{
			var x = objs[i].x;
			var y = objs[i].y;
			
			for (var k = 0; k < forcess[i].length; k++)
			{
				var force = forcess[i][k];
				var dx = force.magnitude * Math.cos(force.angle);
				var dy = force.magnitude * Math.sin(force.angle);
				x -= dx;
				y += dy;
			}
			
			objs[i].x = x;
			objs[i].y = y;
		}
	}
};
Graph.prototype.onhover = function() {
	
	var graph = this;
	graph.ctx.canvas.onmousemove = function(e) {
		
		var x = e.offsetX;
		var y = e.offsetY;
		
		for (var i = 0; i < graph.nodes.length; i++)
		{
			if (graph.nodes[i].ishover(x, y)) { graph.nodes[i].onhover(); }
			return;
		}
		
		for (var i = 0; i < graph.edges.length; i++)
		{
			
		}
	};
};
Graph.prototype.dehover = function() {
	
	this.ctx.canvas.onmousemove = null;
};
Graph.prototype.exportToJson = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.data = this.data;
	json.params = {};
	json.params.x = this.box.x;
	json.params.y = this.box.y;
	json.params.hAlign = this.box.hAlign;
	json.params.vAlign = this.box.vAlign;
	return json;
};
var Node = function(graph, ctx, params) {
	this.graph = graph;
	this.ctx = ctx;
	this.obj = new TextNode(this, ctx, params.label);
};
Node.prototype.draw = function() {
	this.obj.draw();
};
var Edge = function(graph, ctx, params) {
	
	this.graph = graph;
	this.ctx = ctx;
	
	this.src = params.src;
	this.dst = params.dst;
	
	// the reference vector, from which these angles deviate, is the vector from src to dst
	this.cp0 = {distance:0.33,angleDeg:30};
	this.cp1 = {distance:0.66,angleDeg:-30};
	
	// control points and endpoints are Handles
	// endpoints attach (with standoff) to the x,y of a Box, which means that the attach point changes with the box alignment
	
	this.label = '';
	this.labelAnchor = 'cp0-cp1';
	this.labelVector = {distance:5,angleDeg:90};
};
Edge.prototype.draw = function() {
	
	var vector = Geom.Vector(this.src, this.dst);
	Geom.Rotate(vector, this.cp0.angleDeg/360*Math.PI*2);
	Geom.Scale(vector, this.cp0.distance);
	var cp = Geom.Add(this.src, vector);
	this.cp0.x = cp.x;
	this.cp0.y = cp.y;
	
	var vector = Geom.Vector(this.src, this.dst);
	Geom.Rotate(vector, this.cp1.angleDeg/360*Math.PI*2);
	Geom.Scale(vector, this.cp1.distance);
	var cp = Geom.Add(this.src, vector);
	this.cp1.x = cp.x;
	this.cp1.y = cp.y;
	
	var srcStandoffDistance = 25; // this should vary with radius
	var dstStandoffDistance = 25; // this should vary with radius
	var srcStandoffVec = Geom.Vector(this.src, this.cp0);
	var dstStandoffVec = Geom.Vector(this.dst, this.cp1);
	Geom.SetDist(srcStandoffVec, srcStandoffDistance);
	Geom.SetDist(dstStandoffVec, dstStandoffDistance);
	var srcPoint = Geom.Add(this.src, srcStandoffVec);
	var dstPoint = Geom.Add(this.dst, dstStandoffVec);
	
	var ctx = this.ctx;
	
	ctx.strokeStyle = 'black';
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(srcPoint.x, srcPoint.y);
	ctx.bezierCurveTo(this.cp0.x, this.cp0.y, this.cp1.x, this.cp1.y, dstPoint.x, dstPoint.y);
	ctx.stroke();
	
	var fletches = CalcFletches([this.src, this.cp0, this.cp1, this.dst]);
	ctx.beginPath();
	ctx.moveTo(dstPoint.x, dstPoint.y);
	ctx.lineTo(dstPoint.x + fletches[2].x, dstPoint.y + fletches[2].y);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(dstPoint.x, dstPoint.y);
	ctx.lineTo(dstPoint.x + fletches[3].x, dstPoint.y + fletches[3].y);
	ctx.stroke();
	
	ctx.fillStyle = 'black';
	ctx.strokeStyle = 'black';
	ctx.lineWidth = 0;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = '10pt sans-serif';
	var labelx = (this.cp0.x + this.cp1.x) / 2;
	var labely = (this.cp0.y + this.cp1.y) / 2;
	ctx.fillText(this.label, labelx, labely);
};
function CalcFletches(pts) {
	
	var fletchLength = 10;
	var fletchDegrees = 30;
	
	var srcFletchVecR = Geom.Vector(pts[0], pts[1]);
	var srcFletchVecL = Geom.Vector(pts[0], pts[1]);
	Geom.RotateDegrees(srcFletchVecR, +fletchDegrees);
	Geom.RotateDegrees(srcFletchVecL, -fletchDegrees);
	Geom.SetDist(srcFletchVecR, fletchLength);
	Geom.SetDist(srcFletchVecL, fletchLength);
	
	var dstFletchVecR = Geom.Vector(pts[3], pts[2]);
	var dstFletchVecL = Geom.Vector(pts[3], pts[2]);
	Geom.RotateDegrees(dstFletchVecR, +fletchDegrees);
	Geom.RotateDegrees(dstFletchVecL, -fletchDegrees);
	Geom.SetDist(dstFletchVecR, fletchLength);
	Geom.SetDist(dstFletchVecL, fletchLength);
	
	return [ srcFletchVecR , srcFletchVecL , dstFletchVecR , dstFletchVecL ];
}
var TextNode = function(node, ctx, text) {
	
	// it would be nice to get rid of this and just use a Text object
	// but we have to give up the backlink to the node
	// so then how does Node keep track of its instantiation?  Object.observe?
	
	this.node = node;
	this.ctx = ctx;
	this.text = text;
};
TextNode.prototype.draw = function() {
	this.ctx.fillText(this.text, this.node.x, this.node.y);
};


// Box is primarily for top-level, movable widgets.  it should probably not be necessary for sub-widgets
// which means that BarChart should govern the onhover and dehover of its Controls, not the Controls themselves
// a Control won't have an associated Box, of course
var Box = function(obj) {
	
	this.obj = obj;
	
	this.x = 0;
	this.y = 0;
	this.hAlign = 'center';
	this.vAlign = 'center';
	
	this.lf = 0;
	this.cx = 0;
	this.rt = 0;
	this.wd = 0;
	this.wr = 0;
	this.tp = 0;
	this.cy = 0;
	this.bt = 0;
	this.hg = 0;
	this.hr = 0;
	
	this.parent = null;
	this.anchorX = null;
	this.anchorY = null;
	
	// this is not going be used under the current assumption that a Box is only for top-level, moveable widgets
	this.moveable = false;
	
	this.drawHandles = false;
	this.activeHandle = null;
	this.hoveredHandle = null;
	this.handles = [];
	this.handles.push(new Handle(this, 'left', 'top'));
	this.handles.push(new Handle(this, 'left', 'center'));
	this.handles.push(new Handle(this, 'left', 'bottom'));
	this.handles.push(new Handle(this, 'center', 'top'));
	this.handles.push(new Handle(this, 'center', 'center'));
	this.handles.push(new Handle(this, 'center', 'bottom'));
	this.handles.push(new Handle(this, 'right', 'top'));
	this.handles.push(new Handle(this, 'right', 'center'));
	this.handles.push(new Handle(this, 'right', 'bottom'));
};
Box.prototype.draw = function() {
	if (this.drawHandles) { this.handles.forEach(function(handle) { handle.draw(); }); }
};
Box.prototype.onhover = function() {
	
	//console.log('Box.onhover');
	
	// when we arrive here from an arrow being dehovered, the handles are already drawn.  we can't draw them again, because the saved patch will be the already-drawn handle
	if (!this.drawHandles)
	{
		this.drawHandles = true;
		this.draw();
	}
	
	// Box.onmousemove will check for handles and leaving, and then kick the event over to box.obj
	var box = this;
	this.obj.ctx.canvas.onmousemove = function(e) { box.onmousemove(e); };
};
Box.prototype.dehover = function() {
	this.obj.dehover(); // BarChart.dehover() and Image.dehover() is empty. maybe other Widgets will need to put something there?
	//this.obj.section.draw();
	this.drawHandles = false;
	this.handles.forEach(function(handle) { handle.clear(); });
	this.obj.section.onhover();
};
Box.prototype.onmousemove = function(e) {
	
	var x = e.offsetX * this.obj.ctx.cubitsPerPixel;
	var y = e.offsetY * this.obj.ctx.cubitsPerPixel;
	
	if (this.parent)
	{
		x -= this.parent[this.anchorX];
		y -= this.parent[this.anchorY];
	}
	
	// check for handles before checking for leaving, because the handles extend slightly outside the box bounds
	for (var i = 0; i < this.handles.length; i++)
	{
		var cx = this.handles[i].x;
		var cy = this.handles[i].y;
		var rr = this.handles[i].r * this.handles[i].r;
		
		var dd = (x - cx) * (x - cx) + (y - cy) * (y - cy);
		
		if (dd < rr)
		{
			if (this.hoveredHandle && this.hoveredHandle != this.handles[i])
			{
				this.hoveredHandle.dehover(); // we'll also do the handle dehovering here
			}
			
			this.hoveredHandle = this.handles[i];
			this.handles[i].onhover();
			return;
		}
	}
	
	if (this.hoveredHandle)
	{
		this.hoveredHandle.dehover(); // we'll also do the handle dehovering here
		this.hoveredHandle = null;
	}
	
	if (x < this.lf || x > this.rt || y < this.tp || y > this.bt)
	{
		this.dehover();
		return;
	}
	
	this.obj.onmousemove(e);
};
Box.prototype.reconcile = function(params) {
	ReconcileBox(this, params);
	this.reconcileHandles();
};
Box.prototype.reconcileHandles = function() {
	
	// change handle x,y
	this.handles[0].x = this.lf;
	this.handles[1].x = this.lf;
	this.handles[2].x = this.lf;
	this.handles[3].x = this.cx;
	this.handles[4].x = this.cx;
	this.handles[5].x = this.cx;
	this.handles[6].x = this.rt;
	this.handles[7].x = this.rt;
	this.handles[8].x = this.rt;
	
	this.handles[0].y = this.tp;
	this.handles[1].y = this.cy;
	this.handles[2].y = this.bt;
	this.handles[3].y = this.tp;
	this.handles[4].y = this.cy;
	this.handles[5].y = this.bt;
	this.handles[6].y = this.tp;
	this.handles[7].y = this.cy;
	this.handles[8].y = this.bt;
	
	var activeIndex = ['left','center','right'].indexOf(this.hAlign) * 3 + ['top','center','bottom'].indexOf(this.vAlign);
	this.activeHandle = this.handles[activeIndex];
	this.activeHandle.active = true;
};
Box.prototype.align = function() {
	
	AlignBox(this);
	this.reconcileHandles();
};
Box.prototype.move = function(dx, dy) {
	
	MoveBox(this, dx, dy);
	this.handles.forEach(function(handle) { handle.x += dx; handle.y += dy; });
};
Box.prototype.changeAlignment = function(hAlign, vAlign) {
	
	this.hAlign = hAlign;
	this.vAlign = vAlign;
	
	if (this.hAlign == 'left')
	{
		this.x = this.lf;
	}
	else if (this.hAlign == 'center')
	{
		this.x = this.cx;
	}
	else if (this.hAlign == 'right')
	{
		this.x = this.rt;
	}
	else
	{
		throw new Error();
	}
	
	if (this.vAlign == 'top')
	{
		this.y = this.tp;
	}
	else if (this.vAlign == 'center')
	{
		this.y = this.cy;
	}
	else if (this.vAlign == 'bottom')
	{
		this.y = this.bt;
	}
	else
	{
		throw new Error();
	}
};

// we still need these functions, because it makes sense for some objects (small, nonmoveable ones like controls) to handle their own box-nature
function MakeBox(params) {
	
	var box = {};
	AddBoxVars(box);
	ReconcileBox(box, params);
	return box;
}
var AddBoxVars = function(obj) {
	
	obj.lf = 0;
	obj.cx = 0;
	obj.rt = 0;
	obj.wd = 0;
	obj.wr = 0;
	obj.tp = 0;
	obj.cy = 0;
	obj.bt = 0;
	obj.hg = 0;
	obj.hr = 0;
}
var ReconcileBox = function(box, params) {
	
	if (params.lf)
	{
		box.lf = params.lf;
		
		if (params.cx)
		{
			box.cx = params.cx;
			box.wr = box.cx - box.lf;
			box.wd = box.wr * 2;
			box.rt = box.lf + box.wd;
		}
		else if (params.rt)
		{
			box.rt = params.rt;
			box.wd = box.rt - box.lf;
			box.wr = box.wd / 2;
			box.cx = box.lf + box.wr;
		}
		else if (params.wd)
		{
			box.wd = params.wd;
			box.wr = box.wd / 2;
			box.rt = box.lf + box.wd;
			box.cx = box.lf + box.wr;
		}
		else if (params.wr)
		{
			box.wr = params.wr;
			box.wd = box.wr * 2;
			box.rt = box.lf + box.wd;
			box.cx = box.lf + box.wr;
		}
	}
	else if (params.cx)
	{
		box.cx = params.cx;
		
		if (params.rt)
		{
			box.rt = params.rt;
			box.wr = box.rt - box.cx;
			box.wd = box.wr * 2;
			box.lf = box.rt - box.wd;
		}
		else if (params.wd)
		{
			box.wd = params.wd;
			box.wr = box.wd / 2;
			box.rt = box.cx + box.wr;
			box.lf = box.cx - box.wr;
		}
		else if (params.wr)
		{
			box.wr = params.wr;
			box.wd = box.wr * 2;
			box.rt = box.cx + box.wr;
			box.lf = box.cx - box.wr;
		}
	}
	else if (params.rt)
	{
		box.rt = params.rt;
		
		if (params.wd)
		{
			box.wd = params.wd;
			box.wr = box.wd / 2;
			box.lf = box.rt - box.wd;
			box.cx = box.rt - box.wr;
		}
		else if (params.wr)
		{
			box.wr = params.wr;
			box.wd = box.wr * 2;
			box.lf = box.rt - box.wd;
			box.cx = box.rt - box.wr;
		}
	}
	
	if (params.tp)
	{
		box.tp = params.tp;
		
		if (params.cy)
		{
			box.cy = params.cy;
			box.hr = box.cy - box.tp;
			box.hg = box.hr * 2;
			box.bt = box.tp + box.hg;
		}
		else if (params.bt)
		{
			box.bt = params.bt;
			box.hg = box.bt - box.tp;
			box.hr = box.hg / 2;
			box.cy = box.tp + box.hr;
		}
		else if (params.hg)
		{
			box.hg = params.hg;
			box.hr = box.hg / 2;
			box.bt = box.tp + box.hg;
			box.cy = box.tp + box.hr;
		}
		else if (params.hr)
		{
			box.hr = params.hr;
			box.hg = box.hr * 2;
			box.bt = box.tp + box.hg;
			box.cy = box.tp + box.hr;
		}
	}
	else if (params.cy)
	{
		box.cy = params.cy;
		
		if (params.bt)
		{
			box.bt = params.bt;
			box.hr = box.bt - box.cy;
			box.hg = box.hr * 2;
			box.tp = box.bt - box.hg;
		}
		else if (params.hg)
		{
			box.hg = params.hg;
			box.hr = box.hg / 2;
			box.bt = box.cy + box.hr;
			box.tp = box.cy - box.hr;
		}
		else if (params.hr)
		{
			box.hr = params.hr;
			box.hg = box.hr * 2;
			box.bt = box.cy + box.hr;
			box.tp = box.cy - box.hr;
		}
	}
	else if (params.bt)
	{
		box.bt = params.bt;
		
		if (params.hg)
		{
			box.hg = params.hg;
			box.hr = box.hg / 2;
			box.tp = box.bt - box.hg;
			box.cy = box.bt - box.hr;
		}
		else if (params.hr)
		{
			box.hr = params.hr;
			box.hg = box.hr * 2;
			box.tp = box.bt - box.hg;
			box.cy = box.bt - box.hr;
		}
	}
}
var AlignBox = function(box) {
	
	// this assumes that x, y, hAlign, vAlign, wd, hg are set and calculates the others
	
	box.wr = box.wd / 2;
	box.hr = box.hg / 2;
	
	if (box.hAlign == 'left')
	{
		box.lf = box.x;
		box.cx = box.lf + box.wr;
		box.rt = box.lf + box.wd;
	}
	else if (box.hAlign == 'center')
	{
		box.cx = box.x;
		box.lf = box.cx - box.wr;
		box.rt = box.cx + box.wr;
	}
	else if (box.hAlign == 'right')
	{
		box.rt = box.x;
		box.lf = box.rt - box.wd;
		box.cx = box.rt - box.wr;
	}
	else
	{
		throw new Error();
	}
	
	if (box.vAlign == 'top')
	{
		box.tp = box.y;
		box.cy = box.tp + box.hr;
		box.bt = box.tp + box.hg;
	}
	else if (box.vAlign == 'center')
	{
		box.cy = box.y;
		box.tp = box.cy - box.hr;
		box.bt = box.cy + box.hr;
	}
	else if (box.vAlign == 'bottom')
	{
		box.bt = box.y;
		box.tp = box.bt - box.hg;
		box.cy = box.bt - box.hr;
	}
	else
	{
		throw new Error();
	}
};
function MoveBox(box, dx, dy) {
	
	box.x += dx;
	box.y += dy;
	box.lf += dx;
	box.cx += dx;
	box.rt += dx;
	box.tp += dy;
	box.cy += dy;
	box.bt += dy;
}

var Handle = function(box, hAlign, vAlign) {
	
	this.box = box;
	
	this.active = false;
	this.hovered = false;
	
	this.hAlign = hAlign;
	this.vAlign = vAlign;
	
	this.x = null;
	this.y = null;
	this.r = 2;
	
	this.patch = null; // used for easy clearing - Arrow and other controls should do the same
};
Handle.prototype.draw = function() {
	
	var bx = (this.box.parent ? this.box.parent[this.box.anchorX] : 0);
	var by = (this.box.parent ? this.box.parent[this.box.anchorY] : 0);
	
	var x = bx + this.x;
	var y = by + this.y;
	var r = this.r;
	
	this.patch = this.box.obj.ctx.getImageData(x - r, y - r, r * 2 + 1, r * 2 + 1); // perhaps inefficient, but we need to get the patch every time the handle moves
	
	this.box.obj.ctx.fillStyle = this.active ? 'rgb(0,128,255)' : (this.hovered ? 'rgb(100,200,255)' : 'rgb(200,200,200)');
	this.box.obj.ctx.fillCircle(x + 0.5, y + 0.5, r);
};
Handle.prototype.clear = function() {
	
	var bx = (this.box.parent ? this.box.parent[this.box.anchorX] : 0);
	var by = (this.box.parent ? this.box.parent[this.box.anchorY] : 0);
	
	var x = bx + this.x;
	var y = by + this.y;
	var r = this.r;
	
	this.box.obj.ctx.putImageData(this.patch, x - r, y - r);
};
Handle.prototype.onhover = function() {
	
	// if inactive handle, change color, and change to active handle onmousedown, AND begin drag
	
	
	// during the drag there are basically 4 elements to worry about:
	// Page -> BarChart -> Box -> Handle
	// the Page needs facilities for drawing gridlines, and then clearing gridlines (which necessitates a redraw of the entire page)
	// also, this move function needs to be able to access the Page variables that control the gridline spacing, in order to snap correctly
	
	//Debug('Handle.onhover');
	
	var bx = (this.box.parent ? this.box.parent[this.box.anchorX] : 0);
	var by = (this.box.parent ? this.box.parent[this.box.anchorY] : 0);
	
	this.box.obj.ctx.canvas.style.cursor = 'move';
	
	var handle = this;
	
	this.hovered = true;
	this.box.hoveredHandle = this;
	
	this.clear();
	this.draw();
	
	this.box.obj.ctx.canvas.onmousedown = function(e) {
		
		// set this handle to active
		handle.box.activeHandle.active = false;
		handle.box.activeHandle.clear();
		handle.box.activeHandle.draw();
		handle.active = true;
		handle.clear();
		handle.draw();
		
		handle.box.activeHandle = handle;
		handle.box.changeAlignment(handle.hAlign, handle.vAlign);
		
		var ax = bx + handle.x;
		var ay = by + handle.y;
		
		handle.box.obj.page.drawGridlines();
		
		var gridlineSpacing = handle.box.obj.page.document.snapGrid.gridlineSpacing * handle.box.obj.page.document.pixelsPerUnit;
		
		handle.box.obj.ctx.canvas.onmousemove = function(e) {
			
			var mx = e.offsetX;
			var my = e.offsetY;
			
			var snapx = Math.floor((mx + gridlineSpacing / 2) / gridlineSpacing, 1) * gridlineSpacing;
			var snapy = Math.floor((my + gridlineSpacing / 2) / gridlineSpacing, 1) * gridlineSpacing;
			
			if (snapx == ax && snapy == ay) { return; }
			
			var dx = snapx - ax;
			var dy = snapy - ay;
			
			ax = snapx;
			ay = snapy;
			
			handle.box.move(dx, dy);
			handle.box.obj.page.draw();
			handle.box.obj.page.drawGridlines();
			handle.box.draw();
		};
		handle.box.obj.ctx.canvas.onmouseup = function(e) {
			
			handle.box.obj.ctx.canvas.onmousemove = function(e) { handle.box.onmousemove(e); };
			handle.box.obj.ctx.canvas.onmouseup = null;
			
			// unclear how this interacts with the page draw below.  should it come before or after?
			handle.box.onmousemove(e);
			
			handle.box.obj.page.draw();
		};
	};
};
Handle.prototype.dehover = function() {
	//Debug('Handle.dehover');
	this.box.obj.ctx.canvas.style.cursor = 'default';
	this.box.hoveredHandle = null;
	this.hovered = false;
	this.clear();
	this.draw();
	this.box.obj.ctx.canvas.onmousedown = null;
};


var Menu = function() {
	
};
Menu.prototype.draw = function() {
	
};

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

// in case we want a generic drag that is not tied to Box
function Drag(obj, ax, ay) {
	
	obj.ctx.canvas.onmousemove = function(e) {
		
		var mx = e.offsetX;
		var my = e.offsetY;
		
		var dx = mx - ax;
		var dy = my - ay;
		
		obj.lf += dx;
		obj.cx += dx;
		obj.rt += dx;
		obj.tp += dy;
		obj.cy += dy;
		obj.bt += dy;
		
		ax = mx;
		ay = my;
		
		obj.draw();
	};
	obj.ctx.canvas.onmouseup = function(e) {
		obj.ctx.canvas.onmousemove = null;
		obj.ctx.canvas.onmouseup = null;
		obj.draw();
	};
}
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
