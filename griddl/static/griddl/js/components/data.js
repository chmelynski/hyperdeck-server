
(function() {

var Data = function(json, type, name) {
	
	if (!json)
	{
		json = {};
		json.type = type;
		json.name = name;
		json.visible = true;
		json.data = [{A:1,B:2,C:3},{A:4,B:5,C:6},{A:7,B:8,C:9}];
		json.params = {};
		json.params.format = 'json';
		json.params.display = 'tsv';
		json.params.headers = ['A','B','C'];
		json.params.form = 'listOfObjects';
		json.params.afterChange = '';
	}
	
	this._type = json.type;
	this._name = json.name;
	this._visible = json.visible; // can't use ?: here because visible can be set to false
	
	this._div = null;
	this._errorSpan = null;
	this._datguiDiv = null;
	this._contentDiv = null;
	this._codemirror = null;
	
	// the top of the undo stack is the current state - new states get pushed on add and on setting this._data
	this._undo = {};
	this._undo.stack = []; // { data , headers } - entirely possible that we should store display and form as well
	this._undo.index = -1;
	this._undo.size = 0;
	this._undo.sizes = [];
	this._undo.capacity = 50;
	this._undo.pushOnAdd = true;
	
	this._format = json.params.format; // json, headerList
	this._display = json.params.display; // json, yaml, csv, tsv, grid, pre, (tree - to do; matrix, formula - to finish)
	this._form = json.params.form; // object, list, listOfObjects, listOfLists, other
	this._headers = json.params.headers; // this is needed to specify which columns to display and in what order - handsontable gives the user the ability to reorder columns, and we want to save that configuration
	this._afterChange = json.params.afterChange ? json.params.afterChange : '';
	
	Object.defineProperty(this, 'display', {
		get : function() { return this._display; },
		set : function (value) { this._display = value; }
	});
	
	Object.defineProperty(this, 'afterChange', {
		get : function() { return this._afterChange; },
		set : function (value) { this._afterChange = value; }
	});
	
	this._data = ParseFormat.apply(this, [json.data]);
	
	// determining form can be an expensive operation, so we cache the result and remember it as long as we can
	// for example, if the data is modified by the user interacting with a grid, we can be assured the data stays in a certain form
	// the only time the slate gets completely cleared is when the user introduces arbitrary data - via script, upload, or blur
	if (this._form === null) { this._determineDataForm(); }
	if (this._headers === null) { this._introspectHeaders(); }
};
Data.prototype._add = function() {
	
	var comp = this;
	
	comp._div.html('');
	comp._datguiDiv = $('<div></div>').appendTo(comp._div);
	comp._errorSpan = $('<span style="color:red"></span>').appendTo(comp._div);
	comp._contentDiv = $('<div></div>').appendTo(comp._div);
	
	comp._refreshDatgui();
	
	var initText = null;
	
	if (comp._display == 'json' || comp._display == 'yaml' || comp._display == 'csv' || comp._display == 'tsv')
	{
		var textbox = $('<textarea></textarea>').appendTo(comp._contentDiv);
		
		var options = {};
		options.mode = {json:{name:'javascript',json:true},yaml:'yaml',csv:'plain',tsv:'plain'}[comp._display];
		options.smartIndent = false;
		options.lineNumbers = true;
		options.lineWrapping = true;
		comp._codemirror = CodeMirror.fromTextArea(textbox[0], options);
		
		initText = Write.apply(comp, [comp._display]);
		comp._codemirror.getDoc().setValue(initText);
		
		comp._codemirror.on('change', function() { comp._markDirty(); });
		comp._codemirror.on('blur', function() {
			
			var text = comp._codemirror.getValue();
			var success = comp._setText(text);
			
			if (success)
			{
				comp._refreshDatgui();
				var formattedText = Write.apply(comp, [comp._display]);
				comp._codemirror.getDoc().setValue(formattedText);
				comp._runAfterChange();
			}
		});
	}
	else if (comp._display == 'grid')
	{
		var ctx = $('<canvas width="500" height="500" tabIndex="0" style="margin:1em;border:0px"></canvas>').appendTo(comp._contentDiv)[0].getContext('2d');
		comp._grid = new Hyperdeck.Grid(ctx, comp);
		
		comp._grid.section = {
			draw : function() { comp._grid.ctx.clearRect(0, 0, comp._grid.ctx.canvas.width, comp._grid.ctx.canvas.height); comp._grid.draw(); }
		};
		
		comp._grid.ctx.canvas.onmousemove = function(e) { comp._grid.onmousemove(e); };
		comp._grid.ctx.canvas.onmousedown = function(e) { comp._grid.clearSelection(); };
		
		comp._grid.ctx.canvas.parentElement.appendChild(comp._grid.input);
		
		comp._grid.draw();
		ctx.canvas.focus();
	}
	else if (comp._display == 'pre')
	{
		initText = DisplayAsPre(comp);
		comp._contentDiv.html(initText);
	}
	else if (comp._display == 'gui')
	{
		comp._contentDiv.append($('<hr />'));
		
		var datagui = new dat.GUI({autoPlace:false, width:"100%"});
		
		for (var key in comp._data)
		{
			var control = datagui.add(comp._data, key);
			control.onChange(function(value) { comp._runAfterChange(); });
		}
		
		comp._contentDiv.append($(datagui.domElement));
	}
	else
	{
		throw new Error();
	}
	
	if (comp._undo.pushOnAdd) { comp._pushUndo(initText.length); }
};
Data.prototype._write = function() {
	
	var comp = this;
	
	var json = {};
	json.type = comp._type;
	json.name = comp._name;
	json.visible = comp._visible;
	json.data = WriteFormat.apply(comp);
	json.params = {};
	json.params.format = comp._format;
	json.params.display = comp._display;
	json.params.form = comp._form;
	json.params.headers = comp._headers;
	json.params.afterChange = comp._afterChange;
	return json;
};

Data.prototype._refreshDatgui = function() {
	
	var comp = this;
	comp._datguiDiv.html('');
	
	var displayOptionDict = {};
	displayOptionDict.other = ['json','yaml'];
	displayOptionDict.listOfObjects = ['json','yaml','csv','tsv','pre'];
	displayOptionDict.listOfLists = ['json','yaml','csv','tsv','pre'];
	displayOptionDict.list = ['json','yaml','csv','tsv','pre'];
	displayOptionDict.object = ['json','yaml','gui'];
	
	var displayOptions = displayOptionDict[comp._form];
	if (Hyperdeck.Preferences.Experimental.enableGrid) { displayOptions.push('grid'); }
	if (displayOptions.indexOf(comp._display) == -1) { comp._display = 'json'; }
	
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
	var displayControl = gui.add(comp, 'display', displayOptions);
	displayControl.onChange(function(value) { comp._undo.pushOnAdd = false; comp._add(); comp._undo.pushOnAdd = true; });
	var uploadFolder = gui.addFolder('upload');
	uploadFolder.add(comp, 'uploadJSON');
	uploadFolder.add(comp, 'uploadYAML');
	uploadFolder.add(comp, 'uploadCSV');
	uploadFolder.add(comp, 'uploadTSV');
	//uploadFolder.add(comp, 'uploadXLSX');
	var downloadFolder = gui.addFolder('download');
	downloadFolder.add(comp, 'downloadJSON');
	downloadFolder.add(comp, 'downloadYAML');
	if (displayOptions.indexOf('csv') >= 0) { downloadFolder.add(comp, 'downloadCSV'); }
	if (displayOptions.indexOf('tsv') >= 0) { downloadFolder.add(comp, 'downloadTSV'); }
	//downloadFolder.add(comp, 'downloadXLSX');
	var hooksFolder = gui.addFolder('hooks');
	hooksFolder.add(comp, 'afterChange');
	var tools = gui.addFolder('tools');
	tools.add(comp, 'Undo');
	tools.add(comp, 'Redo');
	
	comp._datguiDiv.append($(gui.domElement));
};

Data.prototype._showError = function(e) {
	
	var comp = this;
	comp._errorSpan.text(e);
};

function ParseFormat(data) {
	
	var comp = this;
	
	var result = null;
	
	if (comp._format == 'headerList')
	{
		// comp._headers: ["foo","bar"]
		// data: [[1,2],[3,4]]
		// => [{"foo":1,"bar":2},{"foo":3,"bar":4}]
		
		var objs = [];
		
		for (var i = 0; i < data.length; i++)
		{
			var obj = {};
			
			for (var k = 0; k < comp._headers.length; k++)
			{
				obj[comp._headers[k]] = data[i][k];
			}
			
			objs.push(obj);
		}
		
		result = objs;
	}
	else if (comp._format == 'json')
	{
		result = data;
	}
	else
	{
		throw new Error();
	}
	
	return result;
}
function WriteFormat() {
	
	var comp = this;
	
	var result = null;
	
	if (comp._form == 'listOfObjects')
	{
		comp._format = 'headerList';
		
		var matrix = [];
		
		for (var i = 0; i < comp._data.length; i++)
		{
			var row = [];
			
			for (var k = 0; k < comp._headers.length; k++)
			{
				row.push(comp._data[i][comp._headers[k]]);
			}
			
			matrix.push(row);
		}
		
		result = matrix;
	}
	else
	{
		comp._format = 'json';
		result = comp._data;
	}
	
	return result;
}
Data.prototype._introspectHeaders = function() {
	
	var comp = this;
	
	comp._headers = [];
	
	if (comp._form == 'object')
	{
		for (var key in comp._data)
		{
			comp._headers.push(key);
		}
	}
	else if (comp._form == 'listOfObjects')
	{
		for (var i = 0; i < comp._data.length; i++)
		{
			for (var key in comp._data[i])
			{
				if (comp._headers.indexOf(key) == -1)
				{
					comp._headers.push(key);
				}
			}
		}
	}
	else if (comp._form == 'listOfLists')
	{
		var max = 0;
		
		for (var i = 0; i < comp._data.length; i++)
		{
			max = Math.max(max, comp._data[i].length);
		}
		
		for (var k = 0; k < max; k++)
		{
			comp._headers.push(k);
		}
	}
	else
	{
		comp._headers = null;
	}
};
Data.prototype._enforceHeaderOrder = function() {
	
	var comp = this;
	
	// the json, csv, and yaml writers have no way of knowing the proper header order, which means they screw it up if there were insertions/deletions
	// so we recreate all objects here
	
	var newdata = [];
	
	for (var i = 0; i < comp._data.length; i++)
	{
		var obj = {};
		
		for (var k = 0; k < comp._headers.length; k++)
		{
			var header = comp._headers[k];
			obj[header] = comp._data[i][header];
		}
		
		newdata.push(obj);
	}
	
	comp._data = newdata;
};
Data.prototype._determineDataForm = function() {
	
	var comp = this;
	
	comp._form = DetermineDataForm(comp._data);
};
function DetermineDataForm(data) {
	
	// returns:
	// 'object'           { Primitive }        {}
	// 'list'             [ Primitive ]        []
	// 'listOfObjects'    [ { Primitive } ]    [{}]
	// 'listOfLists'      [ [ Primitive ] ]    [[]]
	// 'other'            anything else, including Primitive, {empty}, [empty], {compound}, [heterogenousCompound], [{compound}], [[compound]], [[ragged]]
	
	var form = null;
	var type = Object.prototype.toString.call(data);
	
	if (type == '[object Array]')
	{
		var empty = true;
		var allPrimitives = true;
		var allObjects = true;
		var allLists = true;
		
		for (var i = 0; i < data.length; i++)
		{
			empty = false;
			
			var sub = data[i];
			var subtype = Object.prototype.toString.call(sub);
			
			if (subtype == '[object Array]')
			{
				allPrimitives = false;
				allObjects = false;
			}
			else if (subtype == '[object Object]')
			{
				allPrimitives = false;
				allLists = false;
			}
			else
			{
				allObjects = false;
				allLists = false;
			}
			
			if (!allPrimitives && !allObjects && !allLists)
			{
				form = 'other';
				break;
			}
		}
		
		if (allPrimitives)
		{
			form = 'list';
		}
		else if (allObjects)
		{
			var allSubPrimitives = true;
			
			for (var i = 0; i < data.length; i++)
			{
				for (var key in data[i])
				{
					var sub = data[i][key];
					var subtype = Object.prototype.toString.call(sub);
					
					if (subtype == '[object Array]' || type == '[object Object]')
					{
						allSubPrimitives = false;
						break;
					}
				}
				
				if (!allSubPrimitives) { break; }
			}
			
			if (allSubPrimitives)
			{
				form = 'listOfObjects';
			}
			else
			{
				form = 'other';
			}
		}
		else if (allLists)
		{
			var ragged = false;
			
			// first make sure that all subarrays have the same length
			for (var i = 1; i < data.length; i++)
			{
				if (data[i].length != data[i-1].length)
				{
					ragged = true;
					break;
				}
			}
			
			if (ragged)
			{
				form = 'other';
			}
			else
			{
				var allSubPrimitives = true;
				
				for (var i = 0; i < data.length; i++)
				{
					for (var j = 0; j < data[i].length; j++)
					{
						var sub = data[i][j];
						var subtype = Object.prototype.toString.call(sub);
						
						if (subtype == '[object Array]' || type == '[object Object]')
						{
							allSubPrimitives = false;
							break;
						}
					}
					
					if (!allSubPrimitives) { break; }
				}
				
				if (allSubPrimitives)
				{
					form = 'listOfLists';
				}
				else
				{
					form = 'other';
				}
			}
		}
	}
	else if (type == '[object Object]')
	{
		var empty = true;
		var allPrimitives = true;
		
		for (var key in data)
		{
			empty = false;
			
			var sub = data[key];
			var subtype = Object.prototype.toString.call(sub);
			
			if (subtype == '[object Array]' || subtype == '[object Object]')
			{
				allPrimitives = false;
				break;
			}
		}
		
		if (empty)
		{
			form = 'other'; // no good way to display an empty obj in a grid
		}
		else if (allPrimitives)
		{
			form = 'object';
		}
		else
		{
			form = 'other';
		}
	}
	else
	{
		form = 'other';
	}
	
	if (form === null) { throw new Error(); }
	
	return form;
}

function DisplayAsPre(comp) {
	
	var l = [];
	
	if (comp._form == 'listOfObjects')
	{
		l.push('\t' + comp._headers.join('\t'));
		
		for (var i = 0; i < comp._data.length; i++)
		{
			var row = [];
			row.push(i.toString());
			
			for (var k = 0; k < comp._headers.length; k++)
			{
				row.push(comp._data[i][comp._headers[k]]);
			}
			
			l.push(row.join('\t'));
		}
	}
	else if (comp._form == 'listOfLists')
	{
		l.push('\t' + comp._headers.join('\t'));
		
		for (var i = 0; i < comp._data.length; i++)
		{
			var row = [];
			row.push(i.toString());
			
			for (var j = 0; j < comp._data[i].length; j++)
			{
				row.push(comp._data[i][j]);
			}
			
			l.push(row.join('\t'));
		}
	}
	else if (comp._form == 'object')
	{
		for (var k = 0; k < comp._headers.length; k++)
		{
			var key = comp._headers[k];
			l.push(key + '\t' + comp._data[key]);
		}
	}
	else if (comp._form == 'list')
	{
		for (var i = 0; i < comp._data.length; i++)
		{
			l.push(i.toString() + '\t' + comp._data[i]);
		}
	}
	else
	{
		throw new Error();
	}
	
	return '<pre>' + l.join('\n') + '</pre>';
}

Data.prototype._pushUndo = function(size) {
	
	var comp = this;
	
	//console.log('----------');
	
	if (size > comp._undo.capacity) { return; }
	
	// ok, so what if index is not at the top of the stack?  that means that we're editing data that is the result of an undo
	// basically comp is a fork in the tree
	// so the correct thing to do is to discard the potential redos in the now-defunct trunk
	for (var i = comp._undo.stack.length - 1; i > comp._undo.index; i--)
	{
		comp._undo.stack.pop();
		comp._undo.size -= comp._undo.sizes.pop();
		//console.log('pop');
	}
	
	comp._undo.stack.push({ data : comp._data , headers : comp._headers });
	comp._undo.index = comp._undo.stack.length - 1;
	comp._undo.sizes.push(size);
	comp._undo.size += size;
	//console.log('push');
	
	while (comp._undo.size > comp._undo.capacity)
	{
		comp._undo.stack.shift();
		comp._undo.size -= comp._undo.sizes.shift();
		comp._undo.index--;
		//console.log('shift');
	}
	
	//console.log('----------');
};
Data.prototype.Undo = function() {
	
	var comp = this;
	
	if (comp._undo.index == 0) { return; }
	comp._undo.index--;
	comp._data = comp._undo.stack[comp._undo.index].data;
	comp._headers = comp._undo.stack[comp._undo.index].headers;
	comp._markDirty();
	comp._undo.pushOnAdd = false;
	comp._add();
	comp._undo.pushOnAdd = true;
};
Data.prototype.Redo = function() {
	
	var comp = this;
	
	if (comp._undo.index == comp._undo.stack.length - 1) { return; }
	comp._undo.index++;
	comp._data = comp._undo.stack[comp._undo.index].data;
	comp._headers = comp._undo.stack[comp._undo.index].headers;
	comp._markDirty();
	comp._undo.pushOnAdd = false;
	comp._add();
	comp._undo.pushOnAdd = true;
};

Data.prototype._runAfterChange = function() {
	var comp = this;
	(new Function('args', comp._afterChange))();
};

Data.prototype._setText = function(text) {
	
	var comp = this;
	var success = false;
	comp._errorSpan.text('');
	
	try
	{
		if (text == '')
		{
			comp._data = [];
			comp._form = 'listOfObjects';
			comp._headers = [];
		}
		else if (comp._display == 'json')
		{
			ReadJson.apply(comp, [text]);
		}
		else if (comp._display == 'yaml')
		{
			ReadYaml.apply(comp, [text]);
		}
		else if (comp._display == 'csv')
		{
			ReadCsv.apply(comp, [text]);
		}
		else if (comp._display == 'tsv')
		{
			ReadTsv.apply(comp, [text]);
		}
		else
		{
			throw new Error('Invalid display type: ' + comp._display);
		}
		
		success = true;
	}
	catch (e)
	{
		comp._showError(e, comp._display);
	}
	
	return success;
};
Data.prototype._setData = function(data) {
	
		var comp = this;
		var success = false;
		comp._errorSpan.text('');
		
		try
		{
			comp._data = JSON.parse(JSON.stringify(data));
			comp._markDirty();
			comp._determineDataForm();
			comp._introspectHeaders();
			success = true;
		}
		catch(e)
		{
			comp._showError(e, comp._display);
		}
		
		return success;
};
Data.prototype._get = function(options) {
	
	var comp = this;
	
	var result = null;
	
	if (options && options.format)
	{
		result = Write.apply(comp, [options.format]);
	}
	else
	{
		result = comp._data;
	}
	
	return result;
};
Data.prototype._set = function(data, options) {
	
	var comp = this;
	var success = false;
	
	if (options && options.format)
	{
		comp._display = options.format;
		success = comp._setText(data);
	}
	else
	{
		success = comp._setData(data);
	}
	
	if (success)
	{
		// pushUndo is called from add - problem is, if we set this.data while hidden, and then trigger an add() by changing to visible, we'll push twice
		//if (this.visible) { this.add(); } else { this.pushUndo(JSON.stringify(this._data).length); }
		comp._markDirty();
		comp._add();
		comp._runAfterChange();
	}
};

Data.prototype.uploadJSON = function() { Upload.apply(this, [ReadJson, 'json']); };
Data.prototype.uploadYAML = function() { Upload.apply(this, [ReadYaml, 'yaml']); };
Data.prototype.uploadTSV = function() { Upload.apply(this, [ReadTsv, 'tsv']); };
Data.prototype.uploadCSV = function() { Upload.apply(this, [ReadCsv, 'csv']); };
Data.prototype.downloadJSON = function() { Download.apply(this, [WriteJson.apply(this), '.json']); };
Data.prototype.downloadYAML = function() { Download.apply(this, [WriteYaml.apply(this), '.yaml']); };
Data.prototype.downloadTSV = function() { Download.apply(this, [WriteTsv.apply(this), '.tsv']); };
Data.prototype.downloadCSV = function() { Download.apply(this, [WriteCsv.apply(this), '.csv']); };

function Upload(fn, display) {
	
	var comp = this;
	
	var fileChooser = $(document.createElement('input'));
	fileChooser.attr('type', 'file');
	
	fileChooser.on('change', function() {
		
		var fileReader = new FileReader();
		
		fileReader.onload = function(event)
		{
			fn.apply(comp, [event.target.result]);
			comp._display = display;
			comp._add();
		};
		
		if (fileChooser[0].files.length > 0)
		{
			var f = fileChooser[0].files[0];
			fileReader.readAsText(f);
		}
	});
	
	fileChooser.click();
}
function Download(text, ext) {
	
	var comp = this;
	
	var filename = comp._name + ext;
	
	var reader = new FileReader();
	reader.readAsDataURL(new Blob([text], {type:'text/plain'})); 
	reader.onloadend = function() {
		var a = document.createElement('a');
		a.href = reader.result;
		a.download = filename;
		a.click();
	};
}


var singleQuotedStringRegexString = "'([^']|\\')*'";
var doubleQuotedStringRegexString = '"([^"]|\\")*"';
var stringRegexString = '(' + singleQuotedStringRegexString + '|' + doubleQuotedStringRegexString + ')';
var newlineRegexString = '(\\r\\n|\\r|\\n)'; // newlines act as object delimiters

var numberRegex = new RegExp('^\\s*[+-]?([0-9]{1,3}((,[0-9]{3})*|([0-9]{3})*))?(\\.[0-9]+)?%?\\s*$');
var digitRegex = new RegExp('[0-9]');
var trueRegex = new RegExp('^true$', 'i');
var falseRegex = new RegExp('^false$', 'i');

// require ISO 8601 dates - this regex reads yyyy-mm-ddThh:mm:ss.fffZ, with each component after yyyy-mm being optional
// note this means that yyyy alone will be interpreted as an int, not a date
var dateRegex = new RegExp('[0-9]{4}-[0-9]{2}(-[0-9]{2}(T[0-9]{2}(:[0-9]{2}(:[0-9]{2}(.[0-9]+)?)?)?(Z|([+-][0-9]{1-2}:[0-9]{2})))?)?');

function Write(format) {
	
	var comp = this;
	
	var text = null;
	
	if (format == 'json')
	{
		text = WriteJson.apply(comp);
	}
	else if (format == 'yaml')
	{
		text = WriteYaml.apply(comp);
	}
	else if (format == 'csv')
	{
		text = WriteCsv.apply(comp);
	}
	else if (format == 'tsv')
	{
		text = WriteTsv.apply(comp);
	}
	else
	{
		throw new Error('Unsupported format: "' + format + '"');
	}
	
	return text;
}
function ReadJson(text) {
	
	var comp = this;
	
	comp._data = JSON.parse(text);
	
	comp._form = DetermineDataForm(comp._data);
	comp._introspectHeaders();
}
function ReadYaml(text) {
	
	var comp = this;
	
	comp._data = jsyaml.load(text);
	
	comp._form = DetermineDataForm(comp._data);
	comp._introspectHeaders();
}
function WriteJson() {
	
	var comp = this;
	
	if (comp._form == 'listOfObjects')
	{
		var ls = [];
		
		ls.push('[');
		
		for (var i = 0; i < comp._data.length; i++)
		{
			ls.push('\t{');
			
			for (var k = 0; k < comp._headers.length; k++)
			{
				// wrong - numbers get incorrectly written as strings.  need a smarter stringify function
				ls.push('\t\t"' + comp._headers[k] + '": ' + WriteObjToString(comp._data[i][comp._headers[k]]) + ((k < comp._headers.length - 1) ? ',' : ''));
			}
			
			ls.push('\t}' + ((i < comp._data.length - 1) ? ',' : ''));
		}
		
		ls.push(']');
		
		return ls.join('\n') + '\n';
	}
	else
	{
		return JSON.stringify(comp._data);
	}
}
function WriteYaml() {
	
	var comp = this;
	
	if (comp._form == 'listOfObjects')
	{
		var ls = [];
		
		for (var i = 0; i < comp._data.length; i++)
		{
			for (var k = 0; k < comp._headers.length; k++)
			{
				ls.push(((k == 0) ? '-' : ' ') + ' ' + comp._headers[k] + ': ' +  WriteObjToString(comp._data[i][comp._headers[k]]));
			}
		}
		
		return ls.join('\n') + '\n';
	}
	else
	{
		return jsyaml.dump(comp._data);
	}
}

function ReadCsvOld(text) {
	
	var comp = this;
	
	// this csv library interprets bare numbers as strings - we need to look through the objects and parse strings to numbers
	comp._data = $.csv.toObjects(text);
	comp._form = DetermineDataForm(comp._data);
	comp._introspectHeaders();
	comp._parseDatatypes();
}
Data.prototype._parseDatatypes = function() {
	var comp = this;
	ParseDatatypeRec(comp._data);
};
function ParseDatatypeRec(obj) {
	
	// this is scaffolding for autoparsing of certain strings (such as dates)
	// however, ParseStringToObj also parses strings into numbers and bools, and is not currently parsing dates
	// therefore this should not be called on parsed json, because numbers and bools are built into json syntax
	// if we want to use this function for parsed json, we need ParseStringToObj to *only* parse dates and the like
	
	var type = Object.prototype.toString.call(obj);
	
	var keys = [];
	
	if (type == '[object Object]')
	{
		for (var key in obj)
		{
			keys.push(key);
		}
	}
	else if (type == '[object Array]')
	{
		for (var k = 0; k < obj.length; k++)
		{
			keys.push(k);
		}
	}
	else
	{
		return;
	}
	
	for (var k = 0; k < keys.length; k++)
	{
		var key = keys[k];
		var sub = obj[key];
		var subtype = Object.prototype.toString.call(sub);
		
		if (subtype == '[object Object]' || subtype == '[object Array]')
		{
			ParseDatatypeRec(sub);
		}
		else if (subtype == '[object String]')
		{
			obj[key] = ParseStringToObj(sub);
		}
	}
}

function ReadTsv(text) { ReadSeparatedValues.apply(this, [text, '\t']); }
function ReadCsv(text) { ReadSeparatedValues.apply(this, [text, ',']); }
function WriteTsv() { return WriteSeparatedValues.apply(this, ['\t']); }
function WriteCsv() { return WriteSeparatedValues.apply(this, [',']); }

function SeparatedValuesToMatrix(text, delimiter) {
	
	// there's lots of room here to do structure validation and generate hopefully useful error messages
	
	var delimiterRegexStr = delimiter;
	var delimiterLessRegexStr = '[^' + delimiter + '\\r\\n]+';
	
	var regex = new RegExp('(' + doubleQuotedStringRegexString + '|' + newlineRegexString + '|' + delimiterRegexStr + '|' + delimiterLessRegexStr + ')', 'g');
	
	var matrix = [];
	var row = [];
	
	var match = regex.exec(text);
	
	var afterEntry = false;
	
	while (match != null)
	{
		var token = match[0];
		
		if (token == delimiter)
		{
			if (!afterEntry)
			{
				row.push(null);
			}
			
			afterEntry = false;
		}
		else if (token.length <= 2 && token.trim() == '') // newline
		{
			matrix.push(row);
			row = [];
			afterEntry = false;
		}
		else
		{
			row.push(token);
			afterEntry = true;
		}
		
		match = regex.exec(text);
	}
	
	if (row.length > 0) { matrix.push(row); }
	
	return matrix;
}
function ReadSeparatedValues(text, delimiter) {
	
	var comp = this;
	
	var matrix = SeparatedValuesToMatrix(text, delimiter);
	var data = null;
	var headers = null;
	
	var rowLengths = matrix.map(function(row) { return row.length; });
	var areAllRowLengthsUnity = rowLengths.every(function(n) { return n == 1; });
	
	if (areAllRowLengthsUnity)
	{
		comp._form = 'list';
		data = matrix.map(function(row) { return ParseStringToObjCsvTsv(row[0]); }); // interpret text as a list
	}
	else
	{
		var isListOfLists = true;
		var headerIndexes = [];
		
		for (var j = 0; j < matrix[0].length; j++)
		{
			var header = matrix[0][j];
			var index = parseInt(header);
			if (isNaN(index)) { isListOfLists = false; break; }
			headerIndexes.push(index);
		}
		
		// now pad the matrix rows so that each row is at least the length of the header row
		for (var i = 1; i < matrix.length; i++)
		{
			var shortfall = matrix[0].length - matrix[i].length;
			for (var j = 0; j < shortfall; j++) { matrix[i].push(null); }
		}
		
		data = [];
		
		if (isListOfLists)
		{
			comp._form = 'listOfLists';
			
			headers = [];
			for (var j = 0; j < headerIndexes.length; j++) { headers.push(j); }
			
			for (var i = 1; i < matrix.length; i++)
			{
				var row = [];
				
				for (var j = 0; j < headerIndexes.length; j++)
				{
					// the column reordering/deleting magic happens here
					// [[0,2],[a,b,c]] -> [[0,1],[a,c]]
					// row[j] = matrix[i][headerIndexes[j]]
					// will expand to
					// row[0] = matrix[i][0]
					// row[1] = matrix[i][2]
					row[j] = ParseStringToObjCsvTsv(matrix[i][headerIndexes[j]]);
				}
				
				data.push(row);
			}
		}
		else
		{
			comp._form = 'listOfObjects';
			
			headers = matrix[0];
			
			for (var i = 1; i < matrix.length; i++)
			{
				var obj = {};
				
				for (var j = 0; j < headers.length; j++) // stopping at headers.length means that excess entries will simply get dropped
				{
					obj[headers[j]] = ParseStringToObjCsvTsv(matrix[i][j]);
				}
				
				data.push(obj);
			}
		}
	}
	
	comp._data = data;
	comp._headers = headers;
}
function WriteSeparatedValues(delimiter) {
	
	var comp = this;
	
	var ls = [];
	
	if (comp._form == 'list')
	{
		ls = comp._data.map(function(val) { return WriteObjToStringCsvTsv(val, delimiter); });
	}
	else
	{
		ls.push(comp._headers.join(delimiter));
		
		for (var i = 0; i < comp._data.length; i++)
		{
			var entries = [];
			
			for (var k = 0; k < comp._headers.length; k++)
			{
				var val = comp._data[i][comp._headers[k]];
				var str = WriteObjToStringCsvTsv(val, delimiter)
				entries.push(str);
			}
			
			ls.push(entries.join(delimiter));
		}
	}
	
	return ls.join('\n') + '\n';
}

var WriteObjToStringCsvTsv = function(obj, delimiter) {
	
	if (obj === null || obj === undefined) { return ''; }
	
	var type = Object.prototype.toString.call(obj);
	
	// the nice thing about csv/tsv is that you don't have to quote strings
	// however, that means that we need a way to distinguish 0 from "0" and true from "true"
	// the parser and the writer have to be in sync
	
	// how do you encode nulls?  with 'null' or with ''?
	// how do you parse the empty string?  does it parse as null or the empty string?
	// if you parse the empty string as null, how do you encode an empty string?  as '""', i guess
	
	var str = null;
	
	if (type == '[object String]')
	{
		if (obj.length == 0 || obj.indexOf(delimiter) >= 0 || obj.indexOf('"') >= 0 || obj.indexOf('\n') >= 0 || obj.indexOf('\r') >= 0 || (numberRegex.test(obj) && digitRegex.test(obj)) || trueRegex.test(obj) || falseRegex.test(obj))
		{
			str = '"' + obj.replace('\\', '\\\\').replace('"', '\\"').replace('\t', '\\t').replace('\r', '\\r').replace('\n', '\\n') + '"';
		}
		else
		{
			str = obj;
		}
	}
	else if (type == '[object Number]' || type == '[object Boolean]')
	{
		str = obj.toString();
	}
	else
	{
		// we only get here if we're setting with an object
		// if we're writing an object that we ourselves parsed, we're fine
		throw new Error('Unsupported type: "' + type + '".  Please convert to string.');
	}
	
	return str;
};
var ParseStringToObjCsvTsv = function(str) {
	
	if (str === null || str === undefined) { return null; }
	
	// the numberRegex accepts the empty string because all the parts are optional
	// parse the empty string as null
	if (str.length == 0) { return null; }
	
	var val = null;
	
	if (str[0] == '"')
	{
		// if we start with a quote, strip quotes and unescape
		val = str.substr(1, str.length - 2).replace('\\"', '"').replace('\\r', '\r').replace('\\n', '\n').replace('\\t', '\t').replace('\\\\', '\\');
	}
	else if (numberRegex.test(str) && digitRegex.test(str)) // since all parts of numberRegex are optional, "+.%" is a valid number.  so we test digitRegex too
	{
		var divisor = 1;
		str = str.trim();
		if (str.indexOf('%') >= 0) { divisor = 100; str = str.replace('%', ''); }
		str = str.replace(',', '');
		
		if (str.indexOf('.') >= 0)
		{
			val = parseFloat(str);
		}
		else
		{
			val = parseInt(str);
		}
		
		val /= divisor;
	}
	else if (trueRegex.test(str))
	{
		val = true;
	}
	else if (falseRegex.test(str))
	{
		val = false;
	}
	else
	{
		val = str;
	}
	
	return val;
};

// json/yaml - numbers and bools are taken care of by the spec, this is for additional syntax embedded in strings
// nb that embedding syntax in strings creates severe complications
// auto-parsing of dates might be convenient in certain situations, but what if people don't want their strings parsed into dates?
// they're boned, that's what.  and it's a major complaint about excel
var WriteObjToString = function(obj) {
	
	if (obj === null || obj === undefined) { return 'null'; }
	
	var type = Object.prototype.toString.call(obj);
	
	if (type == '[object String]' || type == '[object Date]')
	{
		return '"' + obj.toString() + '"';
	}
	else
	{
		return obj.toString();
	}
};
var ParseStringToObj = function(str) {
	
	if (str === null || str === undefined) { return null; }
	if (str.length == 0) { return ''; } // the numberRegex accepts the empty string because all the parts are optional
	
	var val = null;
	
	if (numberRegex.test(str) && digitRegex.test(str)) // since all parts of numberRegex are optional, "+.%" is a valid number.  so we test digitRegex too
	{
		var divisor = 1;
		str = str.trim();
		if (str.indexOf('%') >= 0) { divisor = 100; str = str.replace('%', ''); }
		str = str.replace(',', '');
		
		if (str.indexOf('.') >= 0)
		{
			val = parseFloat(str);
		}
		else
		{
			val = parseInt(str);
		}
		
		val /= divisor;
	}
	else if (trueRegex.test(str))
	{
		val = true;
	}
	else if (falseRegex.test(str))
	{
		val = false;
	}
	else
	{
		val = str;
	}
	
	return val;
};

Hyperdeck.Components.data = Data;

})();

