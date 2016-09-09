
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
	this._tableDiv = null; // for unknown reasons we pass a sub div to Handsontable / add the <table> or <pre> to the sub div
	this._handsontable = null;
	this._codemirror = null;
	
	this._data = json.data;
	this._htData = null; // in many cases, we have to convert the data to a different form to get HT to display it the way we want - this holds the converted data
	
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
	
	if (this._format == 'headerList')
	{
		// this._headers: ["foo","bar"]
		// this._data: [[1,2],[3,4]]
		// => [{"foo":1,"bar":2},{"foo":3,"bar":4}]
		
		var data = [];
		
		for (var i = 0; i < this._data.length; i++)
		{
			var obj = {};
			
			for (var k = 0; k < this._headers.length; k++)
			{
				obj[this._headers[k]] = this._data[i][k];
			}
			
			data.push(obj);
		}
		
		this._data = data;
	}
	else if (this._format == 'json')
	{
		
	}
	else
	{
		throw new Error();
	}
	
	// determining form can be an expensive operation, so we cache the result and remember it as long as we can
	// for example, if the data is modified by the user interacting with a grid, we can be assured the data stays in a certain form
	// the only time the slate gets completely cleared is when the user introduces arbitrary data - via script, upload, or blur
	if (this._form === null) { this._determineDataForm(); }
	if (this._headers === null) { this._introspectHeaders(); }
};
Data.prototype._add = function() {
	
	var comp = this;
	
	comp._div.html('');
	
	var displayOptions = ['json','yaml']; // 'grid' temporarily removed
	
	if (comp._form == 'listOfObjects')
	{
		displayOptions.push('csv');
		displayOptions.push('tsv');
	}
	
	if (comp._form == 'listOfLists')
	{
		// add csv,tsv options with 0,1,2,3 headers?  or dummy $ header?  or no headers and just interpret as listOfLists
		// (which means that the user is unable to convert from listOfLists to listOfObjects with a paste-in)
		
		// so basically if you display as csv/tsv without headers, you're stuck with listOfLists
		// if you display with headers, and then change those headers from 0,1,2 to foo,bar,baz, the data changes to a listOfObjects on blur
		
		// the change to listOfObjects happen if there are any non-numeric headers.  as long as all headers are numeric, it stays as a listOfLists
		
		// however, you can do manipulations with numeric headers
		// if you rearrange the headers, you rearrange the data (this happens on blur)
		// if you have headers 0,1,2 and add a new 5 at the end, you've just created three blank columns
		// [[0,1],[a,b]] -> [[0,1,3],[a,b]] -> [[0,1,2,3],[a,b,null,null]]
		
		// open question: should we allow deletion of columns by deletion of headers?  my thoughts are yes
		// if you have [[0,1,2],[a,b,c]] and delete the 1 to make [[0,2],[a,b,c]] then the result should be [[0,1],[a,c]], NOT [[0,2],[a,b]] or [[0,1],[a,b]]
		
		// adding columns can be thought of first as the result of a two-step process
		// [[0,1],[a,b]] -> [[0,1,2],[a,b]] -> [[0,1,2],[a,b,null]]
		// and then
		// [[0,1,2],[a,b,null]] -> [[0,2,1],[a,b,null]] -> [[0,1,2],[a,null,b]]
		
		// so a shorthand for the 2-step process is this:
		// [[0,1],[a,b]] -> [[0,2,1],[a,b]] -> [[0,1,2],[a,null,b]]
		// basically insertion of an excess header creates an implied null at the end of each data row, which is then rearranged as normal
		
		displayOptions.push('csv');
		displayOptions.push('tsv');
	}
	
	if (comp._form == 'list')
	{
		// these display the same thing - a simple list of values - no header
		displayOptions.push('csv');
		displayOptions.push('tsv');
	}
	
	if (comp._form == 'listOfObjects' || comp._form == 'listOfLists' || comp._form == 'object' || comp._form == 'list')
	{
		//displayOptions.push('grid');
		displayOptions.push('pre');
	}
	
	if (displayOptions.indexOf(comp._display) == -1) { comp._display = 'json'; }
	
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
	var displayControl = gui.add(comp, 'display', displayOptions);
	
	displayControl.onChange(function(value) { comp._undo.pushOnAdd = false; comp._add(); comp._undo.pushOnAdd = true; });
	
	// upload and download folders?  also, restrict based on form
	var uploadFolder = gui.addFolder('upload');
	uploadFolder.add(comp, 'uploadJSON');
	uploadFolder.add(comp, 'uploadYAML');
	uploadFolder.add(comp, 'uploadTSV');
	uploadFolder.add(comp, 'uploadCSV');
	//uploadFolder.add(comp, 'uploadXLSX');
	var downloadFolder = gui.addFolder('download');
	downloadFolder.add(comp, 'downloadJSON');
	downloadFolder.add(comp, 'downloadYAML');
	if (displayOptions.indexOf('tsv') >= 0) { downloadFolder.add(comp, 'downloadTSV'); }
	if (displayOptions.indexOf('csv') >= 0) { downloadFolder.add(comp, 'downloadCSV'); }
	var hooksFolder = gui.addFolder('hooks');
	hooksFolder.add(comp, 'afterChange');
	var tools = gui.addFolder('tools');
	tools.add(comp, 'Undo');
	tools.add(comp, 'Redo');
	//tools.add(comp, 'AddHeaders');
	//downloadFolder.add(comp, 'downloadXLSX');
	
	comp._div[0].appendChild(gui.domElement);
	
	comp._errorSpan = $('<span></span>');
	comp._errorSpan.css('color', 'red');
	comp._div.append(comp._errorSpan);
	
	comp._tableDiv = $(document.createElement('div'));
	comp._div.append(comp._tableDiv);
	
	var initText = null;
	
	if (comp._display == 'json' || comp._display == 'yaml' || comp._display == 'csv' || comp._display == 'tsv')
	{
		var mode = {json:{name:'javascript',json:true},yaml:'yaml',csv:'text',tsv:'text'}[comp._display];
		
		var textbox = $(document.createElement('textarea'));
		comp._tableDiv.append(textbox);
		comp._codemirror = CodeMirror.fromTextArea(textbox[0], { mode : mode , smartIndent : false , lineNumbers : true , lineWrapping : true });
		
		initText = Write.apply(comp, [comp._display]);
		
		comp._codemirror.getDoc().setValue(initText);
		
		comp._codemirror.on('change', function() { comp._markDirty(); });
		comp._codemirror.on('blur', function() {
			
			var text = comp._codemirror.getValue();
			var success = comp._setText(text);
			
			if (success)
			{
				var formattedText = Write.apply(comp, [comp._display]);
				comp._codemirror.getDoc().setValue(formattedText);
				comp._runAfterChange();
			}
		});
	}
	else if (comp._display == 'grid')
	{
		//Grid.Add.apply(comp); // enable this when Grid is ready
	}
	else if (comp._display == 'pre')
	{
		// comp._tableDiv[0].innerHTML = '<pre>' + comp._matrix.map(row => row.join('\t')).join('\n') + '</pre>';
		
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
		
		initText = '<pre>' + l.join('\n') + '</pre>';
		comp._tableDiv[0].innerHTML = initText;
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
		
		json.data = matrix;
	}
	else
	{
		comp._format = 'json';
		json.data = comp._data;
	}
	
	json.params = {};
	json.params.format = comp._format;
	json.params.display = comp._display;
	json.params.form = comp._form;
	json.params.headers = comp._headers;
	json.params.afterChange = comp._afterChange;
	return json;
};
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
Data.prototype._showError = function(e) {
	
	var comp = this;
	
	comp._errorSpan.text(e);
	//comp._errorSpan.text(e.message);
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

function Write(format) {
	
	var comp = this;
	
	var text = null;
	
	if (comp._display == 'json')
	{
		text = WriteJson.apply(comp);
	}
	else if (comp._display == 'yaml')
	{
		text = WriteYaml.apply(comp);
	}
	else if (comp._display == 'csv')
	{
		text = WriteCsv.apply(comp);
	}
	else if (comp._display == 'tsv')
	{
		text = WriteTsv.apply(comp);
	}
	else
	{
		throw new Error('Unsupported format: "' + options.format + '"');
	}
	
	return text;
}
function ReadJson(text) {
	
	var comp = this;
	
	comp._data = JSON.parse(text);
	
	comp._form = DetermineDataForm(comp._data);
	comp._introspectHeaders();
	comp._parseDatatypes();
}
function ReadYaml(text) {
	
	var comp = this;
	
	comp._data = jsyaml.load(text);
	
	comp._form = DetermineDataForm(comp._data);
	comp._introspectHeaders();
	comp._parseDatatypes();
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
		
		if (type == '[object Object]' || type == '[object Array]')
		{
			ParseDatatypeRec(sub);
		}
		else if (type == '[object String]')
		{
			obj[key] = ParseStringToObj(sub);
		}
	}
}

function ReadTsv(text) { ReadSeparatedValues.apply(this, [text, '\t']); }
function ReadCsv(text) { ReadSeparatedValues.apply(this, [text, ',']); }
function WriteTsv() { return WriteSeparatedValues.apply(this, ['\t']); }
function WriteCsv() { return WriteSeparatedValues.apply(this, [',']); }

var singleQuotedStringRegexString = "'([^']|\\\\')*'";
var doubleQuotedStringRegexString = '"([^"]|\\\\")*"';
var stringRegexString = '(' + singleQuotedStringRegexString + '|' + doubleQuotedStringRegexString + ')';
var newlineRegexString = '(\\r\\n|\\r|\\n)'; // newlines act as object delimiters

function SeparatedValuesToMatrix(text, delimiter) {
	
	// there's lots of room here to do structure validation and generate hopefully useful error messages
	
	var delimiterRegexStr = delimiter;
	var delimiterLessRegexStr = '[^' + delimiter + '\\r\\n]+';
	
	var regex = new RegExp('(' + stringRegexString + '|' + newlineRegexString + '|' + delimiterRegexStr + '|' + delimiterLessRegexStr + ')', 'g');
	
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
		else if (token[0] == '"' || token[0] == "'")
		{
			row.push(token.substr(1, token.length-2));
			afterEntry = true;
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
		data = matrix.map(function(row) { return ParseStringToObj(row[0]); }); // interpret text as a list
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
		
		// this procedure disallows adding new columns by adding a large headerIndex
		// e.g., this does not work:
		// [[0,1],[a,b]] -> [[0,1,3],[a,b]] -> [[0,1,2,3],[a,b,null,null]]
		
		// this is because it conflicts with a common way to delete columns:
		// [[0,1,2],[a,b,c]] -> [[1,2],[a,b,c]] -> [[0,1],[b,c]]
		
		// so then, we have to figure out what should happen in this case then:
		// [[0,1],[a,b]] -> [[0,1,3],[a,b]] -> ??
		
		// note that the implementation below allows easy duplication of columns, fwiw:
		// [[0],[a]] -> [[0,0],[a]] -> [[0,0],[a,a]]
		
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
					row[j] = ParseStringToObj(matrix[i][headerIndexes[j]]);
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
					obj[headers[j]] = ParseStringToObj(matrix[i][j]);
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
		for (var i = 0; i < comp._data.length; i++)
		{
			var val = comp._data[i];
			var str = ((val === null) ? '' : val.toString());
			ls.push(str);
		}
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
				var str = ((val === null) ? '' : val.toString());
				
				if (str.indexOf(delimiter) >= 0 || str.indexOf('"') >= 0 || str.indexOf('\n') >= 0 || str.indexOf('\r') >= 0)
				{
					str = '"' + str.replace('"', '\\"').replace('\r', '\\r').replace('\n', '\\n') + '"';
				}
				
				entries.push(str);
			}
			
			ls.push(entries.join(delimiter));
		}
	}
	
	return ls.join('\n') + '\n';
}

var numberRegex = new RegExp('^\\s*[+-]?([0-9]{1,3}((,[0-9]{3})*|([0-9]{3})*))?(\\.[0-9]+)?%?\\s*$');
var digitRegex = new RegExp('[0-9]');
var trueRegex = new RegExp('^true$', 'i');
var falseRegex = new RegExp('^false$', 'i');

// require ISO 8601 dates - this regex reads yyyy-mm-ddThh:mm:ss.fffZ, with each component after yyyy-mm being optional
// note this means that yyyy alone will be interpreted as an int, not a date
var dateRegex = new RegExp('[0-9]{4}-[0-9]{2}(-[0-9]{2}(T[0-9]{2}(:[0-9]{2}(:[0-9]{2}(.[0-9]+)?)?)?(Z|([+-][0-9]{1-2}:[0-9]{2})))?)?');

var WriteObjToString = function(obj) {
	
	// this is currently called only when writing to json/yaml, which requires that we return 'null'
	// but if we start calling this function from the csv/tsv writer, we'll need to return ''
	if (obj === null || obj === undefined) { return 'null'; }
	
	var type = Object.prototype.toString.call(obj);
	
	if (type == '[object String]' || type == '[object Date]')
	{
		return '"' + obj.toString() + '"';
	}
	//else if (type == '[object Function]')
	//{
	//	return WriteFunction(obj);
	//}
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
	//else if (dateRegex.test(str))
	//{
	//	val = new Date(str);
	//	if (val.toJSON() == null) { val = str; } // revert if the date is invalid
	//}
	else if (trueRegex.test(str))
	{
		val = true;
	}
	else if (falseRegex.test(str))
	{
		val = false;
	}
	//else if (str.startsWith('function'))
	//{
	//	val = ParseFunction(str);
	//}
	else
	{
		val = str;
	}
	
	return val;
};

function WriteFunction(fn) {
	return 'function(' + fn.args.join(',') + ') {' + fn.body + '}';
}
function ParseFunction(str) {
	
	// this all could surely be done better with regex.  at least the argument parsing
	
	var brace0 = 0;
	var brace1 = 0;
	
	for (var i = 0; i < str.length; i++)
	{
		if (str[i] == "{")
		{
			brace0 = i;
			break;
		}
	}
	
	for (var i = str.length - 1; i >= 0; i--)
	{
		if (str[i] == "}")
		{
			brace1 = i;
			break;
		}
	}
	
	var signature = str.substring(0, brace0);
	var body = str.substring(brace0 + 1, brace1);
	
	var paren0 = 0;
	var paren1 = 0;
	
	for (var i = 0; i < signature.length; i++)
	{
		if (signature[i] == "(")
		{
			paren0 = i;
			break;
		}
	}
	
	for (var i = signature.length - 1; i >= 0; i--)
	{
		if (signature[i] == ")")
		{
			paren1 = i;
			break;
		}
	}
	
	var name = "";
	
	for (var i = paren0 - 1; i >= 0; i--)
	{
		var c = signature[i];
		var n = signature.charCodeAt(i);
		
		if (65 <= n && n <= 90 || 97 <= n && n <= 122 || n == 36 || n == 95) // $ = 36, _ = 95
		{
			name = c + name;
		}
		else
		{
			if (name.length > 0)
			{
				break;
			}
		}
	}
	
	var arglist = signature.substring(paren0 + 1, paren1);

	var argnames = [];
	var arg = "";
	
	for (var i = 0; i < arglist.length; i++)
	{
		var c = arglist[i];
		var n = arglist.charCodeAt(i);
		
		if (65 <= n && n <= 90 || 97 <= n && n <= 122 || n == 36 || n == 95) // $ = 36, _ = 95
		{
			arg += c;
		}
		else
		{
			if (arg.length > 0)
			{
				argnames.push(arg);
				arg = "";
			}
		}
	}
	
	if (arg.length > 0)
	{
		argnames.push(arg);
	}
	
	var fn = new Function(argnames.join(','), body);
	
	return fn;
}

// the yaml and json parsers convert numbers and bools automatically, but of course don't automatically convert dates/functions/etc
// but the csv and tsv parsers read all entries as a string and so conversion must be done explicitly for all

// things are easier on the writer side because all writers call some variant of .toString() for Date

// JSON.stringify ignores Function objects (which is good, because it means we can write classes to JSON and it will do basically the correct thing)
// JSON.stringify({d:new Date(),f:function(a) { }) => '{"d":"2016-06-18T15:43:34.068Z"}' - f simply disappears
// however this poses a problem if we want to have Function objects in the data

// none of the system/library-supplied functions are aware that we use ordered headers
// so sometimes we need to recreate the objects before writing so that the fields are added in the correct order
// it appears that "for (key in obj)" iterates over the keys in the order they were added
// this implementation is obvious enough to probably be consistent across JS engines, but of course the language provides no guarantees

// if you want an entry to begin with a double quote, you're going to have to quote it
// meaning, 	"abc"	 will be interpreted as 'abc' while 	"\"abc\"" will be interpreted as '"abc"'


// ([0-9]{1,3}(,?[0-9]{3})*)?(\.[0-9]+)?
// '[+-]?([0-9]{1,3}((,[0-9]{3})*|([0-9]{3})*))?(\\.[0-9]+)?'
// this matches a number of things besides numbers, such as "", "+", "%", "-%", and so forth
// it supports +/-, %, commas in the number, etc.
// (note that it requires "." as the decimal and "," as the digit separator, and not the reverse as europeans are wont to use)
// spaces before or after are allowed, but otherwise it must match the whole line
// one thing this number regex misses is "0." - if there is a decimal, there must be digits after the decimal


// http://stackoverflow.com/questions/15491894/regex-to-validate-date-format-dd-mm-yyyy
// seems like they were concerned primarily with validating leap years
// this is actually a concern, even though we're just testing to see if it's worth passing the string to Date, because the Date parser does this:
// new Date('2/29/2015') => Sun Mar 01 2015 00:00:00 GMT-0500 (Eastern Standard Time)
// not great.
// however, our main concern is allowing lots of different date formats, which this does not necessarily do
//var dateRegex = new RegExp('^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]|(?:Jan|Mar|May|Jul|Aug|Oct|Dec)))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2]|(?:Jan|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)(?:0?2|(?:Feb))\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9]|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep))|(?:1[0-2]|(?:Oct|Nov|Dec)))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$');


// if we're going to parse dates and functions and such to objects, we need to make sure that the json/yaml/csv/tsv writers stringify them correctly
// JSON.stringify(new Date()) => '"2016-06-18T15:08:45.000Z"'
// $.csv.fromObjects([{foo:new Date()}]) => "foo\nSat Jun 18 2016 11:13:34 GMT-0400 (Eastern Daylight Time)"
// jsyaml.dump(new Date()) => "2016-06-18T15:14:28.246Z\n"
// and our own tsv functions call .toString() on every object



// to detect object vs list: (see http://blog.niftysnippets.org/2010/09/say-what.html)
// Object.prototype.toString.call([])                => "[object Array]"
// Object.prototype.toString.call({})                => "[object Object]"
// Object.prototype.toString.call(0)                 => "[object Number]"
// Object.prototype.toString.call("")                => "[object String]"
// Object.prototype.toString.call(false)             => "[object Boolean]"
// Object.prototype.toString.call(null)              => "[object Null]"
// Object.prototype.toString.call(undefined)         => "[object Undefined]"
// Object.prototype.toString.call(new Date())        => "[object Date]"
// Object.prototype.toString.call(function(){})      => "[object Function]"
// Object.prototype.toString.call(/a/)               => "[object RegExp]"
// Object.prototype.toString.call(new Uint8Array(1)) => "[object Uint8Array]"

Hyperdeck.Components.data = Data;

})();

