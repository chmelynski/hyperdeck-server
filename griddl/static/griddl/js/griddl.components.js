
if (typeof Griddl === 'undefined') { var Griddl = {}; }

Griddl.Components = (function() {

var Components = {};

var Text = Components.txt = Components.js = Components.html = Components.css = Components.json = function(header, lines) {
	
	this.type = header[0].substr(1);
	this.name = header[1];
	this.display = header[2];  // visible or hidden
	
	this.div = null;
	this.codemirror = null;
	
	this.text = null;
	this.data = null; // this is the json objects for json, the function object for js, and plain text otherwise
	
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
	
	// codemirror does not propagate edits to the backing string object, so you have to pull directly from the interface
	return this.codemirror.getDoc().getValue();
};
Text.prototype.setData = function(text) {
	
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
	
	if (this.type == 'css') { this.invokeCss(); } // why is invoke here in add for CSS, but elsewhere for HTML?
	
	var clientDiv = CreateComponentDiv($('#cells'), this);
	var textbox = $(document.createElement('textarea'));
	clientDiv.append(textbox);
	
	this.codemirror = CodeMirror.fromTextArea(textbox[0], { mode : mode , smartIndent : false , lineNumbers : true , lineWrapping : true });
	
	this.refresh();
	
	var text = this;
	this.codemirror.on('blur', function() { text.text = text.codemirror.getValue(); text.compile();  });
	this.codemirror.on('change', function() { MarkDirty(); });
};
Text.prototype.invoke = function() {
	
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
	else
	{
		throw new Error();
	}
};
Text.prototype.exec = function() {

	// this does the same thing as RunCode, but has (currently commented) error handling
	// it is used by the code in CreateComponentDiv to execute js
	// we should probably merge all these exec functions
	
	// when we combine exec and invoke, we need to change this conditional to allow for exec of html and css
	if (this.type != 'js') { throw new Error("'" + this.name + "' is a " + this.type + ", not an executable code object"); }
	
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
};
Text.New = function(type) {
	var obj = new Text(['@'+type, UniqueName(type, 1), 'visible'], (type == 'json') ? ['{}'] : []);
	obj.add();
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
};

var Grid = Components.grid = Components.table = Components.matrix = Components.tsv = function(header, lines) {
	
	// so here there are two choices for the underlying data and three choices for the display
	// [ {} ] vs [ [] ]
	// Handsontable vs <table> vs <pre>
	
	this.type = header[0].substr(1);
	this.name = header[1];
	this.display = header[2]; // visible or hidden
	
	this.div = null;
	this.handsontable = null;
	
	this.matrix = null;
	this.data = null;
	
	this.load(lines);
};
Grid.prototype.load = function(lines) {
	
	// new -> constructor -> load -> setData
	// init -> constructor -> load -> setData
	// paste -> load -> setData
	// upload -> load -> setData
	
	this.matrix = [];
	
	var len = lines[0].split('\t').length;
	for (var i = 0; i < lines.length; i++)
	{
		var cols = lines[i].split('\t');
		for (var k = cols.length; k < len; k++) { cols.push(''); } // so that we don't have to fill in nulls across the board for grids with a grid formula
		this.matrix.push(cols);
	}
	
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
	
	// refresh?
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
		
		this.div.handsontable(
		{
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
		});
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
		
		this.div.append(table);
	}
	else if (this.type == 'tsv')
	{
		clientDiv[0].innerHTML = '<pre>' + this.text + '</pre>'; // this works for both the initial add as well as refreshes
		//var pre = $(document.createElement('pre'));
		//clientDiv.append(pre);
		//pre.html(this.text);
	}
	else
	{
		throw new Error();
	}
};
Grid.prototype.add = function() {
	
	var clientDiv = CreateComponentDiv($('#cells'), this);
	
	var tableDiv = $(document.createElement('div'));
	clientDiv.append(tableDiv);
	this.div = tableDiv; // this overwrites the default obj.div = clientDiv from CreateComponentDiv
	
	this.refresh();
};
Grid.New = function(type) {
	var obj = new Grid(['@'+type, UniqueName(type, 1), 'visible'], [ '\tA\tB\tC', '0\t\t\t', '1\t\t\t', '2\t\t\t' ]);
	obj.add();
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
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
	
	if (lines.length > 0) { this.load(lines); } // the test is because we have no default b64 string in Font.New
};
Font.prototype.load = function(lines) {
	
	// new -> constructor -> load -> setData
	// init -> constructor -> load -> setData
	// upload -> load -> setData
	
	this.b64 = lines[0];
	this.uint8array = Griddl.IO.Base64StringToUint8Array(lines[0].substr(lines[0].indexOf(','))); // data:application/binary;base64,
};
Font.prototype.write = function() {
	return '@' + this.type + ' ' + this.name + ' ' + this.display + '\n' + this.b64() + '\n@end\n';
};
Font.prototype.add = function() {
	
	var clientDiv = CreateComponentDiv($('#cells'), this);
	
	if (this.uint8array == null) { return; } // again, new fonts are blank
	
	var canvas = $(document.createElement('div'));
	canvas.css('width', '50em');
	canvas.css('height', '100em');
	canvas.css('border', '1px solid gray');
	clientDiv.append(canvas);
	
	var ctx = canvas[0].getContext('2d');
	
	// draw glyphs
};
Font.New = function() {
	var obj = new Font(['@font', UniqueName('font', 1), 'visible'], []);
	obj.add();
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
};

var Image = Components.image = function(header, lines) {
	
	this.type = header[0].substr(1);
	this.name = header[1];
	this.display = header[2]; // visible or hidden
	this.width = parseInt(header[3]);
	this.height = parseInt(header[4]);
	
	this.div = null;
	
	this.b64 = null;
	this.uint8array = null;
	this.imageElement = null;
	
	this.load(lines);
};
Image.prototype.getData = function() {
	return this.imageElement;
};
Image.prototype.setData = function(imageElement) {
	this.imageElement = imageElement;
	this.refresh();
};
Image.prototype.load = function(lines) {
	
	// new -> constructor -> load -> setData
	// init -> constructor -> load -> setData
	// upload -> load -> setData
	
	this.b64 = lines[0];
	this.uint8array = Griddl.IO.Base64StringToUint8Array(lines[0].substr(lines[0].indexOf(','))); // data:image/png;base64,
	this.imageElement = document.createElement('img');
	this.imageElement.src = this.b64;
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
	var clientDiv = CreateComponentDiv($('#cells'), this);
	this.refresh();
};
Image.New = function() {
	var obj = new Image(['@image', UniqueName('image', 1), 'visible', '20', '20'], [ 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAERJREFUOE9j3LJlCwMMeHt7w9lbt24lKM4A1AwH/5EAMeIDqJlUpyKrZxiimomJElxeG8CoosjZQzSqKHI2RQE2NDUDAEVWy5NpqgO1AAAAAElFTkSuQmCC' ]);
	obj.add();
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
};

var File = Components.file = function(header, lines) {
	
	this.type = header[0].substr(1);
	this.name = header[1];
	this.display = header[2]; // visible or hidden
	
	this.div = null;
	
	this.b64 = null;
	this.uint8array = null;
	
	this.load(lines);
};
File.prototype.getData = function() {
	return this.uint8array;
};
File.prototype.setData = function(uint8array) {
	this.uint8array = uint8array;
	this.refresh();
};
File.prototype.load = function(lines) {
	
	// new -> constructor -> load -> setData
	// init -> constructor -> load -> setData
	// upload -> load -> setData
	
	this.b64 = lines[0];
	this.uint8array = Griddl.IO.Base64StringToUint8Array(lines[0].substr(lines[0].indexOf(','))); // data:application/binary;base64,
};
File.prototype.write = function() {
	return '@' + this.type + ' ' + this.name + ' ' + this.display + '\n' + this.b64 + '\n@end\n';
};
File.prototype.refresh = function() {
	this.div.html('');
	this.div.text(this.uint8array.length); // or we could do a hexdump or something
};
File.prototype.add = function() {
	var clientDiv = CreateComponentDiv($('#cells'), this);
	this.refreshDiv();
};
File.New = function() {
	var obj = new File(['@file', UniqueName('file', 1), 'visible'], [ 'data:text/plain;base64,AAAA' ]);
	obj.add();
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
};

var TsvToObjs = Griddl.TsvToObjs = function(text) { return MatrixToObjs(TsvToMatrix(text)); }
var TsvToMatrix = Griddl.TsvToMatrix = function(text) { return text.trim().split('\n').map(line => line.trim().split('\t')); };
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
	
	obj.div = clientDiv;
	
	// 1. toggle between representations (right now for grids and guis, but could be extended to other types)
	//  a. Handsontable/<table>/<pre>/Codemirror (TSV)
	//  b. gui/Codemirror (JSON)
	//  c. Codemirror (JSON)/tree representation of that JSON
	// 2. exec/invoke html/css/js
	// 3. upload/download/dragndrop file - this should be universal
	
	// 1 and 2 are going to be mutually exclusive - there is no alternate representation for html/css/js text, and there is no way that grids or guis can be invoked.  this means that their buttons can take up the same overlapping space
	
	// upload/download should be square buttons with icons, and thus can be put in every header
	// can the upload button also be a dragndrop target?  if not, should there be another square for it?
	
	AddReorderHandle(headerDiv, obj);
	AddTypeAndName(headerDiv, obj);
	if (obj.type == 'grid' || obj.type == 'matrix' || obj.type == 'table' || obj.type == 'datgui') { AddRepresentationToggle(headerDiv, clientDiv, obj); }
	if (obj.type == 'js' || obj.type == 'html' || obj.type == 'css') {  AddInvokeButton(headerDiv, obj); }
	if (obj.type == 'image' || obj.type == 'audio' || obj.type == 'binary' || obj.type == 'tsv' || obj.type == 'json' || obj.type == 'font') { AddUploadDownload(headerDiv, obj); }
	AddMinimizeAndDestroyButtons(div, headerDiv, obj);
	
	div.append(headerDiv);
	div.append(clientDiv);
	parent.append(div);
	
	return clientDiv;
}
function AddReorderHandle(headerDiv, obj) {
	
}
function AddRepresentationToggle(headerDiv, clientDiv, obj) {
	
	// although we don't use the official datgui anymore, datgui is just a stand-in for any gui component with a JSON representation
	// any such custom component would benefit from being able to toggle between text and graphical representations
	
	var radioName = '';
	
	// we create a 12-letter random name to link the radio buttons into a group.  collisions are possible but unlikely
	for (var i = 0; i < 12; i++)
	{
		var c = Math.floor(Math.random() * 52, 1);
		if (c < 26) { radioName += String.fromCharCode(65 + c); }
		else { radioName += String.fromCharCode(97 + c); }
	}
	
	var radioDiv = $(document.createElement('div'));
	radioDiv.addClass('griddl-component-head-radio-container');
	
	var radioButton0 = $(document.createElement('input'));
	radioButton0.addClass('griddl-component-head-radio-button');
	radioButton0.attr('type', 'radio');
	radioButton0.attr('name', radioName);
	radioButton0.attr('checked', 'true');
	radioDiv.append(radioButton0);
	
	var label0 = $(document.createElement('label'));
	label0.addClass('griddl-component-head-radio-label');
	label0.text('grid');
	radioDiv.append(label0);
	
	var radioButton1 = $(document.createElement('input'));
	radioButton1.addClass('griddl-component-head-radio-button');
	radioButton1.attr('type', 'radio');
	radioButton1.attr('name', radioName);
	radioDiv.append(radioButton1);
	
	var label1 = $(document.createElement('label'));
	label1.addClass('griddl-component-head-radio-label');
	label1.text('text');
	radioDiv.append(label1);
	
	headerDiv.append(radioDiv);
	
	var textbox = null;
	var codemirror = null;
	
	// text -> grid
	radioButton0.on('click', function() {
		
		if (obj.type == 'grid' || obj.type == 'matrix')
		{
			clientDiv.children().first().html('');
		}
		else if (obj.type == 'table')
		{
			clientDiv.html('');
		}
		else if (obj.type == 'datgui')
		{
			clientDiv.html('');
		}
		
		var text = codemirror.getDoc().getValue();
		//var text = textbox[0].value;
		
		if (obj.type == 'grid')
		{
			obj.matrix = TsvToMatrix(text);
			obj.$ = MatrixToObjs(obj.matrix);
			RefreshObjGrid(obj);
		}
		else if (obj.type == 'matrix')
		{
			obj.matrix = TsvToMatrix(text);
			obj.$ = obj.matrix;
			RefreshGrid(obj, false, false);
		}
		else if (obj.type == 'table')
		{
			obj.matrix = TsvToMatrix(text);
			obj.$ = MatrixToObjs(obj.matrix);
			RefreshObjTable(obj);
		}
		else if (obj.type == 'datgui')
		{
			obj.text = text;
			
			try
			{
				obj.$ = JSON.parse(obj.text);
			}
			catch (e)
			{
				// the parse has failed - display an error message - look at error handling code in MakeComponentsDiv to see how to display error message
			}
			
			RefreshDatgui(obj);
		}
		
		MarkDirty();
	});
	
	// grid -> text
	radioButton1.on('click', function() {
		
		var divToClear = null;
		
		if (obj.type == 'grid' || obj.type == 'matrix')
		{
			divToClear = clientDiv.children().first();
			var ht = divToClear.data('handsontable');
			ht.destroy();
			divToClear.html('');
		}
		else if (obj.type == 'table')
		{
			divToClear = clientDiv;
		}
		else if (obj.type == 'datgui')
		{
			divToClear = clientDiv;
		}
		
		divToClear.html('');
		
		textbox = $(document.createElement('textarea'));
		textbox.addClass('griddl-component-body-radio-textarea');
		divToClear.append(textbox);
		
		var text = null;
		
		if (obj.type == 'grid') { text = ObjsToJoinedLines(obj.$); }
		else if (obj.type == 'matrix') { text = MatrixToJoinedLines(obj.$); }
		else if (obj.type == 'table') { text = ObjsToJoinedLines(obj.$); }
		else if (obj.type == 'datgui') { text = JSON.stringify(obj.$); }
		
		codemirror = CodeMirror.fromTextArea(textbox[0], { smartIndent : false , lineNumbers : true });
		codemirror.getDoc().setValue(text);
		
		//textbox[0].value = text;
		
		MarkDirty();
	});
}
function AddInvokeButton(headerDiv, obj) {
	
	var actionButton = $(document.createElement('button'));
	
	// this suggests that Text.exec() and Text.invoke() should be merged
	
	if (obj.type == 'js')
	{
		actionButton.addClass('griddl-component-head-runcode');
		actionButton.html('Run code');
		actionButton.on('click', function() { obj.exec(); });
	}
	else if (obj.type == 'html' || obj.tyoe == 'css')
	{
		actionButton.addClass('griddl-component-head-addtodom');
		actionButton.html('Add to DOM');
		actionButton.on('click', function() { obj.data = obj.text = obj.codemirror.getValue(); obj.invoke(); });
	}
	
	headerDiv.append(actionButton);
}
function AddUploadDownload(headerDiv, obj) {
	// uploading and downloading should be possible for all components, as well as drag-n-drop
	
	var uploadButton = $(document.createElement('button'));
	uploadButton.addClass('griddl-component-head-upload');
	uploadButton.html('Upload');
	
	var dwloadButton = $(document.createElement('button'));
	dwloadButton.addClass('griddl-component-head-download');
	dwloadButton.html('Download');
	
	var extensions = {};
	extensions['image'] = '.png';
	extensions['audio'] = '.wav';
	extensions['binary'] = '';
	extensions['tsv'] = '.tsv';
	extensions['json'] = '.json';
	extensions['font'] = '.otf'; // or .ttf?
	
	// this is for image only - need to do audio separately
	uploadButton.on('click', function() {
		var fileChooser = $(document.createElement('input'));
		fileChooser.attr('type', 'file');
		fileChooser.on('change', function() {
			var fileReader = new FileReader();
			
			fileReader.onload = function(event)
			{
				var x = null;
				var b64 = null;
				
				// this could definitely be a refresh or setData or whatever
				if (obj.type == 'image' || obj.type == 'audio' || obj.type == 'binary' || obj.type == 'font')
				{
					x = new Uint8Array(event.target.result, 0, event.target.result.byteLength); // for readAsArrayBuffer
					b64 = Griddl.IO.Uint8ArrayToBase64String(x);
				}
				else if (obj.type == 'tsv' || obj.type == 'json')
				{
					x = event.target.result;
				}
				
				if (obj.type == 'image')
				{
					obj.b64 = 'data:image/png;base64,' + b64;
					RefreshImage(obj);
				}
				else if (obj.type == 'audio')
				{
					obj.b64 = 'data:audio/wav;base64,' + b64;
					RefreshAudioPcmsFromText(obj);
					RefreshAudioDomElement(obj);
				}
				else if (obj.type == 'binary')
				{
					obj.b64 = 'data:text/plain;base64,' + b64;
					obj.uint8array = x;
				}
				else if (obj.type == 'font')
				{
					obj.b64 = 'data:text/plain;base64,' + b64;
					obj.uint8array = x;
				}
				else if (obj.type == 'tsv')
				{
					obj.text = x;
					obj.$ = MatrixToObjs(TsvToMatrix(x));
					RefreshTsv(obj);
				}
				else if (obj.type == 'json')
				{
					obj.text = x;
					
					try
					{
						obj.$ = JSON.parse(obj.text);
					}
					catch (e)
					{
						// the parse has failed - display an error message - look at error handling code in MakeComponentsDiv to see how to display error message
					}
					
					RefreshJson(obj);
				}
			};
			
			if (fileChooser[0].files.length > 0)
			{
				var f = fileChooser[0].files[0];
				
				if (obj.type == 'image' || obj.type == 'audio' || obj.type == 'binary' || obj.type == 'font')
				{
					fileReader.readAsArrayBuffer(f); // when this is done, it will call fileReader.onload(event)
				}
				else if (obj.type == 'tsv' || obj.type == 'json')
				{
					fileReader.readAsText(f); // when this is done, it will call fileReader.onload(event)
				}
			}
		});
		fileChooser.click();
	});
	
	dwloadButton.on('click', function() {
		var filename = obj.name + extensions[obj.type];
		var downloadLink = document.createElement('a');
		var url = window.URL;
		
		if (obj.type == 'tsv' || obj.type == 'json')
		{
			downloadLink.href = 'data:text/plain;' + encodeURIComponent(obj.text);
		}
		else
		{
			downloadLink.href = obj.text;
		}
		
		downloadLink.download = filename;
		downloadLink.click();
	});
	
	headerDiv.append(uploadButton);
	headerDiv.append(dwloadButton);
}
function AddTypeAndName(headerDiv, obj) {
	
	var typeLabel = $(document.createElement('label'));
	typeLabel.addClass('griddl-component-head-type');
	typeLabel.html(obj.type);
	headerDiv.append(typeLabel);
	
	var nameBox = $(document.createElement('input'));
	nameBox.addClass('griddl-component-head-name');
	nameBox.attr('type', 'text');
	nameBox.attr('value', obj.name);
	nameBox.on('blur', function(e) {
		
		delete Griddl.objs[obj.name];
		var newname = this.value;
		while (Griddl.objs[newname]) { newname += ' - copy'; } // if there is a conflict, just add suffixes until there isn't
		obj.name = newname;
		Griddl.objs[obj.name] = obj;
		obj.div.parent().attr('id', obj.name + 'Component');
		MarkDirty();
	});
	headerDiv.append(nameBox);
}
function AddMinimizeAndDestroyButtons(div, headerDiv, obj) {
	
	var minimizeButton = $(document.createElement('input'));
	minimizeButton.addClass('griddl-component-head-minmax');
	//minimizeButton.css('font-family', 'monospace');
	//minimizeButton.css('position', 'relative');
	//minimizeButton.css('top', '-1px');
	minimizeButton.attr('type', 'button');
	minimizeButton.attr('value', ((obj.display == 'hidden') ? '+' : '-'));
	headerDiv.append(minimizeButton);
	
	var destroyButton = $(document.createElement('input'));
	destroyButton.addClass('griddl-component-head-remove');
	//destroyButton.css('font-family', 'monospace');
	//destroyButton.css('position', 'relative');
	//destroyButton.css('top', '-1px');
	destroyButton.attr('type', 'button');
	destroyButton.attr('value', 'x');
	headerDiv.append(destroyButton);
	
	minimizeButton.on('click', function() {
		
		$(this).parent().parent().children().last().toggleClass('griddl-component-body-hidden');
		
		if ($(this).attr('value') == '-')
		{
			//$(this).parent().parent().children().last().css('display', 'none'); // $(this).parent().next().css('display', 'none');
			
			if (obj.type == 'datgui')
			{
				obj.div.parent().css('margin-bottom', '1em'); // datgui crowds the bottom if the margin is just 1em, so we change it to 2em when visible
			}
			
			$(this).attr('value', '+');
			obj.display = 'hidden';
		}
		else
		{
			//$(this).parent().parent().children().last().css('display', 'block');
			$(this).attr('value', '-');
			obj.display = 'visible';
			
			if (obj.type == 'datgui')
			{
				obj.div.parent().css('margin-bottom', '2em'); // datgui crowds the bottom if the margin is just 1em, so we change it to 2em when visible
			}
			
			if (obj.codemirror)
			{
				// this fixes this bug: when a component containing a codemirror was initially hidden, and then we maximized, the text would not appear
				obj.codemirror.refresh();
			}
		}
		
		MarkDirty();
	});
	
	destroyButton.on('click', function() {
		if (window.confirm('Delete component?')) { 
			delete Griddl.objs[obj.name];
			var i = Griddl.objs.indexOf(obj);
			Griddl.objs.splice(i, 1);
			div.remove();
			MarkDirty();
		}
	});
}

function UniqueName(type, n) { while (Griddl.objs[type + n.toString()]) { n++; } return type + n.toString(); }
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

return Components;

})();

