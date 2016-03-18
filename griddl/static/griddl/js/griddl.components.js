
if (typeof Griddl === 'undefined') { var Griddl = {}; }

var TheComponents = (function() {

var Components = {};

Components.Bitmap = null;

var Text = Components.txt = Components.js = Components.html = Components.css = Components.json = function(header, lines) {
	
	this.type = header[0].substr(1);
	this.name = header[1];
	this.display = header[2];  // visible or hidden
	
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
	
	this.load(lines);
};
Text.prototype.load = function(lines) {
	
	// new -> constructor -> load -> setData
	// init -> constructor -> load -> setData
	// upload -> load -> setData
	// blur -> setData
	
	this.text = lines.join('\n');
	this.compile();
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
Text.prototype.setText = function(text) {
	
	// this is the same as setData - should the functions be merged?
	
	this.text = text;
	this.compile();
	this.refresh();
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
Text.prototype.write = function() {
	return '@' + this.type + ' ' + this.name + ' ' + this.display + '\n' + this.codemirror.getValue() + '\n@end\n';
};
Text.prototype.refresh = function() {
	this.codemirror.getDoc().setValue(this.text);
};
Text.prototype.add = function() {
	
	var modeDict = {text:'plain',js:'javascript',css:'css',html:'xml',json:'javascript'};
	var mode = modeDict[this.type];
	
	if (this.type == 'css') { this.exec(); } // why is invoke here in add for CSS, but elsewhere for HTML?
	
	this.div = CreateComponentDiv($('#cells'), this);
	var textbox = $(document.createElement('textarea'));
	this.div.append(textbox);
	
	this.codemirror = CodeMirror.fromTextArea(textbox[0], { mode : mode , smartIndent : false , lineNumbers : true , lineWrapping : true });
	
	this.refresh();
	
	var text = this;
	this.codemirror.on('blur', function() { text.text = text.codemirror.getValue(); text.compile();  });
	this.codemirror.on('change', function() { MarkDirty(); });
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
Text.New = function(type) {
	var obj = new Text(['@'+type, UniqueName(type, 1), 'visible'], (type == 'json') ? ['{}'] : []);
	obj.add();
	MarkDirty();
	AddObj(obj);
};

Components.JsonBackedRepresentationToggle = function() {
	
	// this deals with the codemirror half of any JSON-backed graphical component
	
	// interface:
	// obj.div
	// obj.text
	// obj.data
	// obj.refresh() - generates the graphical representation after obj.data has been set to the JSON object
	// obj.representationLabel - how to label the radio button
	
	// Datgui.representationToggle = Components.JsonBackedRepresentationToggle;
	// var fns = datgui.representationToggle(); // this means that 'this' will be the datgui instance in this function
	// radioButton.onclick = fns[i] // but the sub-functions below are called on the button, so we can't use 'this' in them
	var obj = this;
	
	var TextToOther = function() {
		
		obj.div.html('');
		
		// if this is to stay in Text, it could be replaced by setData:
		//obj.setData(obj.codemirror.getDoc().getValue());
		
		obj.text = obj.codemirror.getDoc().getValue();
		
		try
		{
			obj.data = JSON.parse(obj.text);
		}
		catch (e)
		{
			// the parse has failed - display an error message - look at error handling code in MakeComponentsDiv to see how to display error message
		}
		
		obj.refresh();
		
		MarkDirty();
	};
	
	var OtherToText = function() {
		
		obj.div.html('');
		
		var textbox = $(document.createElement('textarea'));
		textbox.addClass('griddl-component-body-radio-textarea');
		obj.div.append(textbox);
		
		var text = JSON.stringify(obj.data);
		codemirror = CodeMirror.fromTextArea(textbox[0], { smartIndent : false , lineNumbers : true });
		codemirror.getDoc().setValue(text);
		
		MarkDirty();
	};
	
	return [ { label : obj.representationLabel , fn : TextToOther } , { label : 'Text' , fn : OtherToText } ];
};

var Grid = Components.grid = Components.table = Components.matrix = Components.tsv = function(header, lines) {
	
	// so here there are two choices for the underlying data and three choices for the display
	// [ {} ] vs [ [] ]
	// Handsontable vs <table> vs <pre>
	
	this.type = header[0].substr(1);
	this.name = header[1];
	this.display = header[2]; // visible or hidden
	
	this.div = null;
	this.tableDiv = null; // for unknown reasons we pass a sub div to Handsontable / add the <table> or <pre> to the sub div
	this.handsontable = null;
	
	this.matrix = null;
	this.data = null;
	
	this.uploadDownload = false;
	
	this.load(lines);
};
Grid.prototype.setText = function(text) {
	this.matrix = TsvToMatrix(text);
	this.matrixToData();
	this.refresh();
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
Grid.prototype.getData = function() {
	return this.data;
};
Grid.prototype.setData = function(data) {
	
	this.data = data;
	this.refresh();
};
Grid.prototype.write = function() {
	return '@' + this.type + ' ' + this.name + ' ' + this.display + '\n' + this.toTsv() + '\n@end\n';
	
};
Grid.prototype.toTsv = function() {
	
	// this should be renamed getText
	
	if (this.type == 'matrix')
	{
		MatrixToJoinedLines(this.data)
	}
	else if (this.type == 'grid' || this.type == 'tsv' || this.type == 'table')
	{
		ObjsToJoinedLines(this.data)
	}
	else
	{
		throw new Error();
	}
};
Grid.prototype.refresh = function() {
	
	// here we deal with Handsontable vs <table> vs <pre>
	
	if (this.type == 'grid' || this.type == 'matrix')
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


Grid.prototype.add = function() {
	
	this.div = CreateComponentDiv($('#cells'), this);
	
	var tableDiv = $(document.createElement('div'));
	this.div.append(tableDiv);
	this.tableDiv = tableDiv;
	
	this.refresh();
};


Grid.New = function(type) {
	var obj = new Grid(['@'+type, UniqueName(type, 1), 'visible'], [ '\tA\tB\tC', '0\t\t\t', '1\t\t\t', '2\t\t\t' ]);
	obj.add();
	MarkDirty();
	AddObj(obj);
};


Grid.prototype.representationToggle = function() {
	
	var obj = this;
	var codemirror = null;
	
	var TextToGrid = function() {
    $(this).button('reset');
    $($(this).siblings()[0]).button('toggle');
		
		var text = codemirror.getDoc().getValue();
		
		obj.div.html('');
		
		// because we destroy the tableDiv to add the codemirror, we need to create a new tableDiv here
		var tableDiv = $(document.createElement('div'));
		obj.div.append(tableDiv);
		obj.tableDiv = tableDiv;
		
		obj.setText(text); // so if we define a getText/setText interface, we could abstract the representationToggle so that the same generic function could be used for both JSON and grid objects
		
		MarkDirty();
	};
	
	var GridToText = function() {
    $(this).button('reset');
    $($(this).siblings()[0]).button('toggle');
		
		if (obj.type == 'grid' || obj.type == 'matrix')
		{
			obj.handsontable.destroy();
		}
		
		obj.div.html('');
		
		var textbox = $(document.createElement('textarea'));
		textbox.addClass('griddl-component-body-radio-textarea');
		obj.div.append(textbox);
		
		var text = null;
		
		if (obj.type == 'grid') { text = ObjsToJoinedLines(obj.data); }
		else if (obj.type == 'matrix') { text = MatrixToJoinedLines(obj.data); }
		else if (obj.type == 'table') { text = ObjsToJoinedLines(obj.data); }
		
		codemirror = CodeMirror.fromTextArea(textbox[0], { smartIndent : false , lineNumbers : true });
		codemirror.getDoc().setValue(text);
		
		MarkDirty();
	};
	
	return [ { label : 'Grid' , fn : TextToGrid } , { label : 'Text' , fn : GridToText } ];
};

var Font = Components.font = function(header, lines) {
	
	// a font component should display a selection of text rendered using that font
	// ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789
	
	// single canvas, 8 columns, 16 rows, labeled in hex
	
	this.type = header[0].substr(1);
	this.name = header[1];
	this.display = header[2]; // visible or hidden
	
	this.div = null;
	
	this.b64 = null;
	this.uint8array = null;
	this.font = null;
	
	this.uploadDownload = true;
	
	this.canvas = null;
	
	if (lines.length > 0) { this.load(lines); } // the test is because we have no default b64 string in Font.New
};
Font.prototype.datauri = function() {
	return this.b64;
};
Font.prototype.setArrayBuffer = function(arrayBuffer) {
	
	this.uint8array = new Uint8Array(arrayBuffer); // this probably isn't necessary - do we even use the uint8array anywhere?
	this.b64 = 'data:font/otf;base64,' + Uint8ArrayToBase64String(this.uint8array); // this *is* necessary, though, because we need the b64 to write to file
	this.font = opentype.parse(arrayBuffer);
	
	Griddl.Canvas.fontDict[this.name] = this.font;
	
	this.refresh();
};
Font.prototype.load = function(lines) {
	
	// new -> constructor -> load -> setData
	// init -> constructor -> load -> setData
	// upload -> load -> setData
	
	this.b64 = lines[0];
	
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
	return '@' + this.type + ' ' + this.name + ' ' + this.display + '\n' + this.b64 + '\n@end\n';
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
	canvas.width = 320 * 1.4;
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

var Image = Components.image = function(header, lines) {
	
	this.type = header[0].substr(1);
	this.name = header[1];
	this.display = header[2]; // visible or hidden
	this.width = parseInt(header[3]);
	this.height = parseInt(header[4]);
	
	this.div = null;
	
	this.ext = null;
	this.b64 = null;
	this.uint8array = null;
	this.imageElement = null;
	
	this.uploadDownload = true;
	
	this.load(lines);
};
Image.prototype.datauri = function() {
	return this.b64;
};
Image.prototype.setArrayBuffer = function(arrayBuffer) {
	this.uint8array = new Uint8Array(arrayBuffer);
	this.b64 = 'data:image/png;base64,' + Uint8ArrayToBase64String(this.uint8array); // assumes .png for now
	this.imageElement = document.createElement('img');
	this.imageElement.src = this.b64;
  this.imageElement.className = 'upload';
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
Image.prototype.load = function(lines) {
	
	// new -> constructor -> load -> setData
	// init -> constructor -> load -> setData
	// upload -> load -> setData
	
	this.b64 = lines[0];
	
	var slashIndex = this.b64.indexOf('/');
	var semicolonIndex = this.b64.indexOf(';');
	var commaIndex = this.b64.indexOf(',');
	var prefix = this.b64.substr(0, commaIndex); // data:image/png;base64,
	var type = prefix.substring(slashIndex + 1, semicolonIndex);
	var data = this.b64.substr(commaIndex);
	
	this.ext = '.' + type;
	
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
Image.prototype.write = function() {
	return '@' + this.type + ' ' + this.name + ' ' + this.display + ' ' + this.width + ' ' + this.height + '\n' + this.b64 + '\n@end\n';
};
Image.prototype.refresh = function() {
	
	// this.div.innerHTML = '<img src="' + this.b64 + '"></img>'; // this assumes div is not Jquery
	
	this.div.html('');
	this.div.append($(this.imageElement));
};
Image.prototype.add = function() {
	this.div = CreateComponentDiv($('#cells'), this);
	this.refresh();
};
Image.New = function() {
	var obj = new Image(['@image', UniqueName('image', 1), 'visible', '20', '20'], [ 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAERJREFUOE9j3LJlCwMMeHt7w9lbt24lKM4A1AwH/5EAMeIDqJlUpyKrZxiimomJElxeG8CoosjZQzSqKHI2RQE2NDUDAEVWy5NpqgO1AAAAAElFTkSuQmCC' ]);
	obj.add();
	MarkDirty();
	AddObj(obj);
};

var File = Components.file = function(header, lines) {
	
	this.type = header[0].substr(1);
	this.name = header[1];
	this.display = header[2]; // visible or hidden
	
	this.div = null;
	
	this.b64 = null;
	this.uint8array = null;
	
	this.ext = '';
	this.uploadDownload = true;
	
	this.load(lines);
};
File.prototype.datauri = function() {
	return this.b64;
};
File.prototype.getData = function() {
	return this.uint8array;
};
File.prototype.setArrayBuffer = function(arrayBuffer) {
	this.setData(new Uint8Array(arrayBuffer));
};
File.prototype.setData = function(uint8array) {
	this.uint8array = uint8array;
	this.b64 = 'data:text/plain;base64,' + Uint8ArrayToBase64String(this.uint8array);
	this.refresh();
};
File.prototype.load = function(lines) {
	
	// new -> constructor -> load -> setData
	// init -> constructor -> load -> setData
	// upload -> load -> setData
	
	this.b64 = lines[0];
	this.uint8array = Base64StringToUint8Array(lines[0].substr(lines[0].indexOf(','))); // data:application/binary;base64,
};
File.prototype.write = function() {
	return '@' + this.type + ' ' + this.name + ' ' + this.display + '\n' + this.b64 + '\n@end\n';
};
File.prototype.refresh = function() {
	this.div.html('');
	this.div.text(this.uint8array.length); // or we could do a hexdump or something
};
File.prototype.add = function() {
	this.div = CreateComponentDiv($('#cells'), this);
	this.refreshDiv();
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
	
	//headerDiv.append(AddReorderHandle(obj));
	headerDiv.append(AddTypeLabel(obj));
	headerDiv.append(AddNameBox(obj));
	if (obj.representationToggle)
	{
		headerDiv.append(AddRepresentationToggle(obj));
	}
	if (obj.execButtonText)
	{ 
		headerDiv.append(AddInvokeButton(obj));
	}
	if (obj.uploadDownload)
	{
		headerDiv.append(AddUploadButton(obj));
		headerDiv.append(AddDownloadButton(obj));
	}
  // add these in reverse order because float: right;
	headerDiv.append(AddDestroyButton(obj));
	headerDiv.append(AddMinimizeButton(obj));
	
	div.append(headerDiv);
	div.append(clientDiv);
	parent.append(div);
	
	return clientDiv;
}


function AddReorderHandle(obj) {
	// todo: we want a handle that you can drag to reorder the components
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
		var radioButton = $(document.createElement('button'));
    radioButton.text(conversions[i].label);
		radioButton.addClass('griddl-component-head-btngrp-button btn btn-default');
		radioButton.attr('type', 'button');
		radioButton.attr('name', radioName);
		if (i == 0) { radioButton.addClass('active'); }
		radioDiv.append(radioButton);
		
		radioButton.on('click', conversions[i].fn);
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
	button.addClass('griddl-component-head-download btn btn-default btn-sm');
	button.html('Download');
	
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
	
	// a couple proposed changes:
	// 1. obj.display = 'hidden'/'visible' should be changed to obj.visible = true/false
	
	// instead of just setting display:none, perhaps this should remove the clientDiv from the DOM altogether
	// this will save DOM resources
	
	var button = $(document.createElement('input'));
	button.attr('type', 'button');
	button.attr('value', (obj.display == 'visible') ? '-' : '+');
  button.attr('data-toggle', 'tooltip');
  button.attr('data-placement', 'top');
  button.attr('title', 'Expand/Collapse');
	button.addClass('griddl-component-head-minmax btn btn-default btn-sm');
  button.tooltip();
	
	button.on('click', function() {
		
		// surely this should be based off of obj, not the button
		//$(this).parent().parent().children().last().toggleClass('griddl-component-body-hidden');
		obj.div.toggleClass('griddl-component-body-hidden');
		
		if (obj.display == 'visible')
		{
			$(this).attr('value', '+');
			obj.display = 'hidden';
		}
		else
		{
			$(this).attr('value', '-');
			obj.display = 'visible';
			
			// this fixes this bug: when a component containing a codemirror was initially hidden, and then we maximized, the text would not appear
			if (obj.codemirror) { obj.codemirror.refresh(); }
		}
		
		MarkDirty();
	});
	
	return button;
}
function AddDestroyButton(obj) {
	
	var button = $(document.createElement('input'));
	button.attr('type', 'button');
	button.attr('value', 'x');
  button.attr('data-toggle', 'tooltip');
  button.attr('data-placement', 'top');
  button.attr('title', 'Delete Component');
	button.addClass('griddl-component-head-remove btn btn-default btn-sm');
	
	button.on('click', null, obj, confirmDelete);
  button.tooltip();
	
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

// all references to Griddl.Core.objs are collected here, in case we want to move objs to some other place
function AddObj(obj) { Griddl.Core.objs[obj.name] = obj; Griddl.Core.objs.push(obj); }
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

var TsvToObjs = Griddl.TsvToObjs = function(text) { return MatrixToObjs(TsvToMatrix(text)); }
var TsvToMatrix = Griddl.TsvToMatrix = function(text) { return LinesToMatrixPadded(text.split('\n')); };
var LinesToMatrix = function(lines) { return lines.map(line => line.split('\t')); };
var LinesToMatrixPadded = function(lines) {
	
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

return Components;

})();

if (typeof window !== 'undefined') {
	//if (typeof Griddl === 'undefined') { var Griddl = {}; } // Griddl must be defined before this module is loaded
	Griddl.Components = TheComponents;
}
else {
	exports.Components = TheComponents;
}
