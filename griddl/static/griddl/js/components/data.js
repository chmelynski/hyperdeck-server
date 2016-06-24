
(function() {

var Data = function(json) {
	
	if (!json)
	{
		json = {};
		json.type = 'data';
		json.name = Griddl.Components.UniqueName('data', 1);
		json.visible = true;
		json.data = [{A:1,B:2,C:3},{A:4,B:5,C:6},{A:7,B:8,C:9}];
		json.params = {};
		json.params.format = 'json';
		json.params.display = 'tsv';
		json.params.headers = ['A','B','C'];
		json.params.form = 'listOfObjects';
	}
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible; // can't use ?: here because visible can be set to false
	
	this.div = null;
	this.errorSpan = null;
	this.tableDiv = null; // for unknown reasons we pass a sub div to Handsontable / add the <table> or <pre> to the sub div
	this.handsontable = null;
	this.codemirror = null;
	
	this._data = json.data;
	this.htData = null; // in many cases, we have to convert the data to a different form to get HT to display it the way we want - this holds the converted data
	
	this.undo = {};
	this.undo.stack = []; // { data , headers }
	this.undo.index = -1;
	this.undo.size = 0;
	this.undo.sizes = [];
	this.undo.capacity = 1000000;
	this.undo.currentDataSize = null; // this is set in add() and passed to pushUndo()
	
	Object.defineProperty(this, 'data', { 
		get : function() {
			return this._data;
		},
		set : function(value) {
			
			// in general, setting this.data should be a thing done by external code
			// internal code should preferentially set to this._data, to avoid all this
			
			if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
			
			this.pushUndo(this.undo.currentDataSize);
			
			this._data = value;
			this.determineDataForm();
			this.introspectHeaders();
			
			if (this.visible) { this.add(); } else { this.undo.currentDataSize = JSON.stringify(this._data); }
		}
	});
	
	this.format = json.params.format; // json, headerList
	this.display = json.params.display; // json, yaml, csv, tsv, grid, pre, (tree - to do; matrix, formula - to finish)
	this.form = json.params.form; // object, list, listOfObjects, listOfLists, other
	this.headers = json.params.headers; // this is needed to specify which columns to display and in what order - handsontable gives the user the ability to reorder columns, and we want to save that configuration
	
	if (this.format == 'headerList')
	{
		// this.headers: ["foo","bar"]
		// this._data: [[1,2],[3,4]]
		// => [{"foo":1,"bar":2},{"foo":3,"bar":4}]
		
		var data = [];
		
		for (var i = 0; i < this._data.length; i++)
		{
			var obj = {};
			
			for (var k = 0; k < this.headers.length; k++)
			{
				obj[this.headers[k]] = this._data[i][k];
			}
			
			data.push(obj);
		}
		
		this._data = data;
	}
	else if (this.format == 'json')
	{
		
	}
	else
	{
		throw new Error();
	}
	
	// determining form can be an expensive operation, so we cache the result and remember it as long as we can
	// for example, if the data is modified by the user interacting with a grid, we can be assured the data stays in a certain form
	// the only time the slate gets completely cleared is when the user introduces arbitrary data - via script, upload, or blur
	if (this.form === null) { this.determineDataForm(); }
	if (this.headers === null) { this.introspectHeaders(); }
};
Data.prototype.add = function() {
	
	this.div.html('');
	
	var displayOptions = ['json','yaml']; // 'grid' temporarily removed
	
	if (this.form == 'listOfObjects')
	{
		displayOptions.push('csv');
		displayOptions.push('tsv');
	}
	
	if (this.form == 'listOfLists')
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
	
	if (this.form == 'list')
	{
		// these display the same thing - a simple list of values - no header
		displayOptions.push('csv');
		displayOptions.push('tsv');
	}
	
	if (this.form == 'listOfObjects' || this.form == 'listOfLists' || this.form == 'object' || this.form == 'list')
	{
		//displayOptions.push('grid');
		displayOptions.push('pre');
	}
	
	var gui = new dat.GUI({autoPlace:false});
	var displayControl = gui.add(this, 'display', displayOptions);
	
	var comp = this;
	displayControl.onChange(function(value) { comp.add(); });
	
	// upload and download folders?  also, restrict based on form
	var uploadFolder = gui.addFolder('upload');
	uploadFolder.add(this, 'uploadJSON');
	uploadFolder.add(this, 'uploadYAML');
	uploadFolder.add(this, 'uploadTSV');
	uploadFolder.add(this, 'uploadCSV');
	//uploadFolder.add(this, 'uploadXLSX');
	var downloadFolder = gui.addFolder('download');
	downloadFolder.add(this, 'downloadJSON');
	downloadFolder.add(this, 'downloadYAML');
	if (displayOptions.indexOf('tsv') >= 0) { downloadFolder.add(this, 'downloadTSV'); }
	if (displayOptions.indexOf('csv') >= 0) { downloadFolder.add(this, 'downloadCSV'); }
	var tools = gui.addFolder('tools');
	tools.add(this, 'Undo');
	tools.add(this, 'Redo');
	tools.add(this, 'AddHeaders');
	//downloadFolder.add(this, 'downloadXLSX');
	
	this.div[0].appendChild(gui.domElement);
	
	this.errorSpan = $('<span></span>');
	this.errorSpan.css('color', 'red');
	this.div.append(this.errorSpan);
	
	this.tableDiv = $(document.createElement('div'));
	this.div.append(this.tableDiv);
	
	var comp = this;
	
	if (this.display == 'json' || this.display == 'yaml' || this.display == 'csv' || this.display == 'tsv')
	{
		var textbox = $(document.createElement('textarea'));
		this.tableDiv.append(textbox);
		this.codemirror = CodeMirror.fromTextArea(textbox[0], { mode : 'javascript' , smartIndent : false , lineNumbers : true , lineWrapping : true });
		
		var initText = null;
		
		if (this.display == 'json')
		{
			initText = WriteJson.apply(this);
		}
		else if (this.display == 'yaml')
		{
			initText = WriteYaml.apply(this);
		}
		else if (this.display == 'csv')
		{
			initText = WriteCsv.apply(this);
		}
		else if (this.display == 'tsv')
		{
			initText = WriteTsv.apply(this);
		}
		else
		{
			throw new Error();
		}
		
		this.codemirror.getDoc().setValue(initText);
		
		this.codemirror.on('blur', function() {
			Griddl.Components.MarkDirty();
			
			comp.errorSpan.text('');
			
			var text = comp.codemirror.getValue();
			
			// the problem with calling pushUndo here is, what if there is a parse error?
			// then codemirror is not recreated, so the undo handlers will conflict
			// perhaps we could roll back the undo push if the parse is unsuccessful
			comp.pushUndo(comp.undo.currentDataSize);
			comp.undo.currentDataSize = text.length;
			
			var success = false;
			
			try
			{
				if (text == '')
				{
					comp._data = [];
					comp.form = 'listOfObjects';
					comp.headers = [];
				}
				else if (comp.display == 'json')
				{
					ReadJson.apply(comp, [text]);
				}
				else if (comp.display == 'yaml')
				{
					ReadYaml.apply(comp, [text]);
				}
				else if (comp.display == 'csv')
				{
					ReadCsv.apply(comp, [text]);
				}
				else if (comp.display == 'tsv')
				{
					ReadTsv.apply(comp, [text]);
				}
				else
				{
					throw new Error('Invalid display type: ' + comp.display);
				}
				
				success = true;
			}
			catch (e)
			{
				comp.displayError(e, comp.display);
			}
			
			if (success)
			{
				comp.add();
			}
		});
	}
	else if (this.display == 'grid')
	{
		Griddl.Components.Hot.Add.apply(this);
		//Griddl.Components.Grid.Add.apply(this); // enable this when Grid is ready
	}
	else if (this.display == 'matrix' || this.display == 'formula')
	{
		Griddl.Components.Hot.AddMatrixOrFormulaGrid.apply(this);
	}
	else if (this.display == 'pre')
	{
		// this.tableDiv[0].innerHTML = '<pre>' + this.matrix.map(row => row.join('\t')).join('\n') + '</pre>';
		
		var l = [];
		
		if (this.form == 'listOfObjects')
		{
			l.push('\t' + this.headers.join('\t'));
			
			for (var i = 0; i < this._data.length; i++)
			{
				var row = [];
				row.push(i.toString());
				
				for (var k = 0; k < this.headers.length; k++)
				{
					row.push(this._data[i][this.headers[k]]);
				}
				
				l.push(row.join('\t'));
			}
		}
		else if (this.form == 'listOfLists')
		{
			l.push('\t' + this.headers.join('\t'));
			
			for (var i = 0; i < this._data.length; i++)
			{
				var row = [];
				row.push(i.toString());
				
				for (var j = 0; j < this._data[i].length; j++)
				{
					row.push(this._data[i][j]);
				}
				
				l.push(row.join('\t'));
			}
		}
		else if (this.form == 'object')
		{
			for (var k = 0; k < this.headers.length; k++)
			{
				var key = this.headers[k];
				l.push(key + '\t' + this._data[key]);
			}
		}
		else if (this.form == 'list')
		{
			for (var i = 0; i < this._data.length; i++)
			{
				l.push(i.toString() + '\t' + this._data[i]);
			}
		}
		else
		{
			throw new Error();
		}
		
		this.tableDiv[0].innerHTML = '<pre>' + l.join('\n') + '</pre>';
	}
	else
	{
		throw new Error();
	}
};
Data.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	
	if (this.form == 'listOfObjects')
	{
		this.format = 'headerList';
		
		var matrix = [];
		
		for (var i = 0; i < this._data.length; i++)
		{
			var row = [];
			
			for (var k = 0; k < this.headers.length; k++)
			{
				row.push(this._data[i][this.headers[k]]);
			}
			
			matrix.push(row);
		}
		
		json.data = matrix;
	}
	else
	{
		json.data = this._data;
	}
	
	json.params = {};
	json.params.format = this.format;
	json.params.display = this.display;
	json.params.form = this.form;
	json.params.headers = this.headers;
	return json;
};
Data.prototype.introspectHeaders = function() {
	
	this.headers = [];
	
	if (this.form == 'object')
	{
		for (var key in this._data)
		{
			this.headers.push(key);
		}
	}
	else if (this.form == 'listOfObjects')
	{
		for (var i = 0; i < this._data.length; i++)
		{
			for (var key in this._data[i])
			{
				if (this.headers.indexOf(key) == -1)
				{
					this.headers.push(key);
				}
			}
		}
	}
	else if (this.form == 'listOfLists')
	{
		var max = 0;
		
		for (var i = 0; i < this._data.length; i++)
		{
			max = Math.max(max, this._data[i].length);
		}
		
		for (var k = 0; k < max; k++)
		{
			this.headers.push(k);
		}
	}
	else
	{
		this.headers = null;
	}
};
Data.prototype.enforceHeaderOrder = function() {
	
	// the json, csv, and yaml writers have no way of knowing the proper header order, which means they screw it up if there were insertions/deletions
	// so we recreate all objects here
	
	var newdata = [];
	
	for (var i = 0; i < this._data.length; i++)
	{
		var obj = {};
		
		for (var k = 0; k < this.headers.length; k++)
		{
			var header = this.headers[k];
			obj[header] = this._data[i][header];
		}
		
		newdata.push(obj);
	}
	
	this._data = newdata;
};
Data.prototype.displayError = function(e) {
	
	this.errorSpan.text(e);
	//this.errorSpan.text(e.message);
};
Data.prototype.determineDataForm = function() {
	this.form = DetermineDataForm(this._data);
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

Data.prototype.getText = function() { return JSON.stringify(this.data); }; // why privilege JSON?
Data.prototype.setText = function(text) { }; // unclear how to specify the form of the text
Data.prototype.getData = function() { return this.data; };
Data.prototype.setData = function(data) { this.data = data };

Data.prototype.uploadJSON = function() { Upload.apply(this, [ReadJson, 'json']); };
Data.prototype.uploadYAML = function() { Upload.apply(this, [ReadYaml, 'yaml']); };
Data.prototype.uploadTSV = function() { Upload.apply(this, [ReadTsv, 'tsv']); };
Data.prototype.uploadCSV = function() { Upload.apply(this, [ReadCsv, 'csv']); };
Data.prototype.downloadJSON = function() { Download.apply(this, [WriteJson.apply(this), '.json']); };
Data.prototype.downloadYAML = function() { Download.apply(this, [WriteYaml.apply(this), '.yaml']); };
Data.prototype.downloadTSV = function() { Download.apply(this, [WriteTsv.apply(this), '.tsv']); };
Data.prototype.downloadCSV = function() { Download.apply(this, [WriteCsv.apply(this), '.csv']); };
Data.prototype.AddHeaders = function() {
	
	// we require that listsOfLists be displayed with headers 0,1,2,etc
	// if you upload or paste in a csv/tsv without headers, you'll need to add them
	
	// but what does this edit and what effects does that edit trigger?
	// that is, does it convert the data to listOfLists, or does it just edit the codemirror text and so we wait for blur to convert?
	// seems that this has to convert to listOfLists, with an attending pushUndo
};

function Upload(fn, display) {
	
	var comp = this;
	
	var fileChooser = $(document.createElement('input'));
	fileChooser.attr('type', 'file');
	
	fileChooser.on('change', function() {
		
		var fileReader = new FileReader();
		
		fileReader.onload = function(event)
		{
			fn.apply(comp, [event.target.result]);
			comp.display = display;
			comp.add();
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
	
	var filename = this.name + ext;
	
	var reader = new FileReader();
	reader.readAsDataURL(new Blob([text], {type:'text/plain'})); 
	reader.onloadend = function() {
		var a = document.createElement('a');
		a.href = reader.result;
		a.download = filename;
		a.click();
	};
}

// load
// edit
// undo
// redo

// load
// edit
// undo
// edit

Data.prototype.pushUndo = function(size) {
	
	if (size > this.undo.capacity) { return; }
	
	// ok, so what if index is not at the top of the stack?  that means that we're editing data that is the result of an undo
	// basically this is a fork in the tree
	// so the correct thing to do is to discard the potential redos in the now-defunct trunk
	for (var i = this.undo.stack.length - 1; i > this.undo.index; i--)
	{
		this.undo.stack.pop();
		this.undo.size -= this.undo.stack.sizes.pop();
	}
	
	this.undo.stack.push({ data : this._data , headers : this.headers });
	this.undo.index = this.undo.stack.length - 1;
	this.undo.sizes.push(size);
	this.undo.size += size;
	
	while (this.undo.size > this.undo.capacity)
	{
		this.undo.stack.shift();
		this.undo.size -= this.undo.sizes.shift();
		this.undo.index--;
	}
};
Data.prototype.Undo = function() {
	
	if (this.undo.index < 0) { return; }
	
	if (this.undo.index == this.undo.stack.length - 1)
	{
		// as it stands, the current data is not stored on the undo stack
		// data gets pushed to the undo stack only when it is supplanted by other data
		// that means that the current data, if it is the result of an edit (and not an undo/redo), needs to be pushed
		
		this.pushUndo(this.undo.currentDataSize);
		// now is the index where it should be?
		this.undo.currentDataSize = this.undo.sizes[this.undo.index]; // so then what do we do here?
	}
	
	this._data = this.undo.stack[this.undo.index].data;
	this.headers = this.undo.stack[this.undo.index].headers;
	this.undo.index--;
	if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
	this.add();
};
Data.prototype.Redo = function() {
	
	if (this.undo.index == this.undo.stack.length - 1) { return; }
	this.undo.index++;
	this._data = this.undo.stack[this.undo.index].data;
	this.headers = this.undo.stack[this.undo.index].headers;
	if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
	this.add();
};

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

function ReadJson(text) {
	
	this._data = JSON.parse(text);
	
	this.form = DetermineDataForm(this._data);
	this.introspectHeaders();
	this.parseDatatypes();
}
function ReadYaml(text) {
	
	this._data = jsyaml.load(text);
	
	this.form = DetermineDataForm(this._data);
	this.introspectHeaders();
	this.parseDatatypes();
}
function WriteJson() {
	
	if (this.form == 'listOfObjects')
	{
		var ls = [];
		
		ls.push('[');
		
		for (var i = 0; i < this._data.length; i++)
		{
			ls.push('\t{');
			
			for (var k = 0; k < this.headers.length; k++)
			{
				// wrong - numbers get incorrectly written as strings.  need a smarter stringify function
				ls.push('\t\t"' + this.headers[k] + '": ' + WriteObjToString(this._data[i][this.headers[k]]) + ((k < this.headers.length - 1) ? ',' : ''));
			}
			
			ls.push('\t}' + ((i < this._data.length - 1) ? ',' : ''));
		}
		
		ls.push(']');
		
		return ls.join('\n') + '\n';
	}
	else
	{
		return JSON.stringify(this._data);
	}
}
function WriteYaml() {
	
	if (this.form == 'listOfObjects')
	{
		var ls = [];
		
		for (var i = 0; i < this._data.length; i++)
		{
			for (var k = 0; k < this.headers.length; k++)
			{
				ls.push(((k == 0) ? '-' : ' ') + ' ' + this.headers[k] + ': ' +  WriteObjToString(this._data[i][this.headers[k]]));
			}
		}
		
		return ls.join('\n') + '\n';
	}
	else
	{
		return jsyaml.dump(this._data);
	}
}

function ReadCsvOld(text) {
	
	// this csv library interprets bare numbers as strings - we need to look through the objects and parse strings to numbers
	this._data = $.csv.toObjects(text);
	this.form = DetermineDataForm(this._data);
	this.introspectHeaders();
	this.parseDatatypes();
}
Data.prototype.parseDatatypes = function() {
	ParseDatatypeRec(this._data);
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

var stringRegexString = '"([^"]|\\\\")*"'; // only supports double quoted strings
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
	
	var matrix = SeparatedValuesToMatrix(text, delimiter);
	var data = null;
	var headers = null;
	
	var rowLengths = matrix.map(row => row.length);
	var areAllRowLengthsUnity = rowLengths.every(n => n == 1);
	
	if (areAllRowLengthsUnity)
	{
		this.form = 'list';
		data = matrix.map(row => ParseStringToObj(row[0])); // interpret text as a list
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
			this.form = 'listOfLists';
			
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
			this.form = 'listOfObjects';
			
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
	
	this._data = data;
	this.headers = headers;
}
function WriteSeparatedValues(delimiter) {
	
	var ls = [];
	
	if (this.form == 'list')
	{
		for (var i = 0; i < this._data.length; i++)
		{
			var val = this._data[i];
			var str = ((val === null) ? '' : val.toString());
			ls.push(str);
		}
	}
	else
	{
		ls.push(this.headers.join(delimiter));
		
		for (var i = 0; i < this._data.length; i++)
		{
			var entries = [];
			
			for (var k = 0; k < this.headers.length; k++)
			{
				var val = this._data[i][this.headers[k]];
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

// ([0-9]{1,3}(,?[0-9]{3})*)?(\.[0-9]+)?
// '[+-]?([0-9]{1,3}((,[0-9]{3})*|([0-9]{3})*))?(\\.[0-9]+)?'
// this matches a number of things besides numbers, such as "", "+", "%", "-%", and so forth
// it supports +/-, %, commas in the number, etc.
// (note that it requires "." as the decimal and "," as the digit separator, and not the reverse as europeans are wont to use)
// spaces before or after are allowed, but otherwise it must match the whole line
// one thing this number regex misses is "0." - if there is a decimal, there must be digits after the decimal

var numberRegex = new RegExp('^\\s*[+-]?([0-9]{1,3}((,[0-9]{3})*|([0-9]{3})*))?(\\.[0-9]+)?%?\\s*$');
var digitRegex = new RegExp('[0-9]');
var trueRegex = new RegExp('^true$', 'i');
var falseRegex = new RegExp('^false$', 'i');

// http://stackoverflow.com/questions/15491894/regex-to-validate-date-format-dd-mm-yyyy
// seems like they were concerned primarily with validating leap years
// this is actually a concern, even though we're just testing to see if it's worth passing the string to Date, because the Date parser does this:
// new Date('2/29/2015') => Sun Mar 01 2015 00:00:00 GMT-0500 (Eastern Standard Time)
// not great.
// however, our main concern is allowing lots of different date formats, which this does not necessarily do
//var dateRegex = new RegExp('^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]|(?:Jan|Mar|May|Jul|Aug|Oct|Dec)))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2]|(?:Jan|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)(?:0?2|(?:Feb))\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9]|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep))|(?:1[0-2]|(?:Oct|Nov|Dec)))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$');

// require ISO 8601 dates - this regex reads yyyy-mm-ddThh:mm:ss.fffZ, with each component after yyyy-mm being optional
// note this means that yyyy alone will be interpreted as an int, not a date
var dateRegex = new RegExp('[0-9]{4}-[0-9]{2}(-[0-9]{2}(T[0-9]{2}(:[0-9]{2}(:[0-9]{2}(.[0-9]+)?)?)?(Z|([+-][0-9]{1-2}:[0-9]{2})))?)?');

// if we're going to parse dates and functions and such to objects, we need to make sure that the json/yaml/csv/tsv writers stringify them correctly
// JSON.stringify(new Date()) => '"2016-06-18T15:08:45.000Z"'
// $.csv.fromObjects([{foo:new Date()}]) => "foo\nSat Jun 18 2016 11:13:34 GMT-0400 (Eastern Daylight Time)"
// jsyaml.dump(new Date()) => "2016-06-18T15:14:28.246Z\n"
// and our own tsv functions call .toString() on every object

var WriteObjToString = function(obj) {
	
	// this is currently called only when writing to json/yaml, which requires that we return 'null'
	// but if we start calling this function from the csv/tsv writer, we'll need to return ''
	if (obj === null) { return 'null'; }
	
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
	else if (dateRegex.test(str))
	{
		val = new Date(str);
		if (val.toJSON() == null) { val = str; } // revert if the date is invalid
	}
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

Griddl.Components.data = Data;

})();

