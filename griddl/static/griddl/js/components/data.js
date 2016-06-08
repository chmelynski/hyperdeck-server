
(function() {

// save column widths - wait, manualColumnResize doesn't seem to work
// add a datgui display option?

// one way to easily add columns with tsv is to have the user only edit the header row and add nulls for all the vals

// Uncaught Error: Cannot create new column.
// When data source in an object, you can only have as much columns as defined in first data row, data schema or in the 'columns' setting.
// If you want to be able to add new columns, you have to use array datasource.

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
		json.params.display = 'grid';
		json.params.headers = ['A','B','C'];
		json.params.form = 'listOfObjects';
	}
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible; // can't use ?: here because visible can be set to false
	
	this.div = null;
	this.tableDiv = null; // for unknown reasons we pass a sub div to Handsontable / add the <table> or <pre> to the sub div
	this.handsontable = null;
	this.codemirror = null;
	
	this._data = json.data;
	this.htData = null; // in many cases, we have to convert the data to a different form to get HT to display it the way we want - this holds the converted data
	
	Object.defineProperty(this, 'data', { 
		get : function() {
			return this._data;
		},
		set : function(value) {
			this._data = value;
			if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
			this.add();
		}
	});
	
	this.format = json.params.format; // json, headerList
	this.display = json.params.display; // json, yaml, csv, tsv, grid, pre, (tree - to do; matrix, formula - to finish)
	this.form = json.params.form; // object, list, listOfObjects, listOfLists, other
	this.headers = json.params.headers; // this is needed to specify which columns to display and in what order - handsontable gives the user the ability to reorder columns, and we want to save that configuration
	
	if (this.format == 'headerList')
	{
		this.headers = this._data.headers;
		
		// convert this._data from {headers:["foo","bar"],values:[[1,2],[3,4]]} => [{"foo":1,"bar":2},{"foo":3,"bar":4}]
		var data = [];
		
		for (var i = 0; i < this._data.values.length; i++)
		{
			var obj = {};
			
			for (var k = 0; k < this._data.headers.length; k++)
			{
				obj[this._data.headers[k]] = this._data.values[i][k];
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
	
	// this can be an expensive operation, so we cache the result and remember it as long as we can
	// for example, if the data is modified by the user interacting with a grid, we can be assured the data stays in a certain form
	// the only time the slate gets completely cleared is when the user introduces arbitrary json
	if (this.form === null) { this.form = DetermineDataForm(this._data); }
	
	if (this.headers === null) { this.introspectHeaders(); }
};
Data.prototype.add = function() {
	
	this.div.html('');
	
	var gui = new dat.GUI({autoPlace:false});
	var displayControl = gui.add(this, 'display', ['grid','json','yaml','csv','tsv','pre']); // restrict based on form, add handler for immediate change
	
	var comp = this;
	displayControl.onChange(function(value) { comp.add(); });
	
	// upload and download folders?  also, restrict based on form
	//gui.add(this, 'uploadJson');
	//gui.add(this, 'uploadTSV');
	//gui.add(this, 'uploadCSV');
	//gui.add(this, 'uploadXLSX');
	//gui.add(this, 'downloadAsJson');
	//gui.add(this, 'downloadAsTSV');
	//gui.add(this, 'downloadAsCSV');
	//gui.add(this, 'downloadAsXLSX');
	
	this.div[0].appendChild(gui.domElement);
	
	this.tableDiv = $(document.createElement('div'));
	this.div.append(this.tableDiv);
	
	// this is just for clearing the tableDiv
	//if (this.tableDiv)
	//{
	//	this.tableDiv.html('');
	//}
	//else
	//{
	//	this.tableDiv = $(document.createElement('div'));
	//	this.div.append(this.tableDiv);
	//}
	
	var comp = this;
	
	function HandleChangeDefault(row, col, oldvalue, newvalue) {
		// col = "foo" for listOfObjects grids
		comp._data[row][col] = newvalue;
	}
	function HandleChangeObject(row, col, oldvalue, newvalue) {
		comp._data[comp.headers[row]] = newvalue;
	}
	function HandleChangeList(row, col, oldvalue, newvalue) {
		comp._data[row] = newvalue;
	}
	
	function HandleChange(fn) {
		return function(changes, source) {
			
			if (source != 'loadData')
			{
				Griddl.Components.MarkDirty();
				
				for (var i = 0; i < changes.length; i++)
				{
					var change = changes[i];
					var row = change[0];
					var col = change[1];
					var oldvalue = change[2];
					var newvalue = ParseStringToObj(change[3]);
					
					fn(row, col, oldvalue, newvalue);
				}
			}
		};
	}
	
	if (this.display == 'json' || this.display == 'yaml' || this.display == 'csv' || this.display == 'tsv')
	{
		// csv and tsv are for listOfObjects only
		if (this.form != 'listOfObjects' && (this.display == 'csv' || this.display == 'tsv'))
		{
			this.display = 'json';
			this.add();
			return;
		}
		
		var textbox = $(document.createElement('textarea'));
		this.tableDiv.append(textbox);
		this.codemirror = CodeMirror.fromTextArea(textbox[0], { mode : 'javascript' , smartIndent : false , lineNumbers : true , lineWrapping : true });
		
		var initText = null;
		
		if (this.display == 'json')
		{
			initText = JSON.stringify(this._data);
		}
		else if (this.display == 'yaml')
		{
			initText = jsyaml.dump(this._data);
		}
		else if (this.display == 'csv')
		{
			initText = $.csv.fromObjects(this._data);
		}
		else if (this.display == 'tsv')
		{
			initText = ObjsToTsv(this._data, this.headers);
		}
		else
		{
			throw new Error();
		}
		
		this.codemirror.getDoc().setValue(initText);
		
		this.codemirror.on('blur', function() {
			Griddl.Components.MarkDirty();
			
			var text = comp.codemirror.getValue();
			
			if (comp.display == 'json')
			{
				comp._data = JSON.parse(text); // error checking?
			}
			else if (comp.display == 'yaml')
			{
				comp._data = jsyaml.load(text);
			}
			else if (comp.display == 'csv')
			{
				// this csv library interprets bare numbers as strings - we need to look through the objects and parse strings to numbers
				var objs = $.csv.toObjects(text);
				
				var newobjs = [];
				
				for (var i = 0; i < objs.length; i++)
				{
					var newobj = {};
					
					for (var key in objs[i])
					{
						newobj[key] = ParseStringToObj(objs[i][key]);
					}
					
					newobjs.push(newobj);
				}
				
				comp._data = newobjs;
			}
			else if (comp.display == 'tsv')
			{
				comp._data = TsvToObjs(text);
			}
			else
			{
				throw new Error();
			}
			
			comp.form = DetermineDataForm(comp._data);
			comp.introspectHeaders();
			//comp.add();
		});
	}
	else if (this.display == 'grid')
	{
		var options = {};
		options.formulas = false;
		options.contextMenu = true;
		options.manualColumnResize = true;
		
		if (this.form == 'listOfObjects')
		{
			options.rowHeaders = function(index) { return index; };
			options.colHeaders = this.headers;
			options.data = this._data;
			options.afterChange = HandleChange(HandleChangeDefault);
		}
		else if (this.form == 'listOfLists')
		{
			options.rowHeaders = function(index) { return index; };
			options.colHeaders = function(index) { return index; };
			options.data = this._data;
			options.afterChange = HandleChange(HandleChangeDefault);
		}
		else if (this.form == 'object')
		{
			this.htData = ObjectToListOfLists(this._data, this.headers);
			
			options.rowHeaders = this.headers;
			options.colHeaders = false;
			options.data = this.htData;
			options.afterChange = HandleChange(HandleChangeObject);
			// because the backing data is a list of lists, we can insert/delete rows here - they get 1-indexed
			// need hooks to change _data after inserting/deleting rows
		}
		else if (this.form == 'list')
		{
			this.htData = ListToListOfLists(this._data);
			
			options.rowHeaders = function(index) { return index; };
			options.colHeaders = false;
			options.data = this.htData;
			options.afterChange = HandleChange(HandleChangeList);
			// need hooks to change _data after inserting/deleting rows
		}
		else
		{
			this.display = 'json';
			this.add();
			return;
		}
		
		this.handsontable = new Handsontable(this.tableDiv[0], options);
	}
	else if (this.display == 'matrix' || this.display == 'formula')
	{
		var options = {};
		options.formulas = (this.display == 'formula');
		options.rowHeaders = (this.display == 'formula');
		options.colHeaders = (this.display == 'formula');
		options.contextMenu = true;
		options.manualColumnResize = true;
		
		// we might want to color the cell backgrounds gray on the pseudo- row and col headers
		
		if (this.form == 'listOfObjects')
		{
			this.htData = ListOfObjectsToListOfLists(this._data);
			options.data = this.htData;
			
			options.afterChange = function(changes, source) {
				
				if (source != 'loadData')
				{
					Griddl.Components.MarkDirty();
					
					// a change to headers in first row requires re-keying all the objects
					// a change to headers in the first col is ignored
					// a change to values propagates
					// for perf, we might want to iterate through the list of changes rather than doing the whole conversion on every change
					//this._data = ListOfListsToListOfObjects(this.htData);
					
					for (var i = 0; i < changes.length; i++)
					{
						var change = changes[i];
						var row = change[0];
						var col = change[1];
						var oldvalue = change[2];
						var newvalue = ParseStringToObj(change[3]);
						
						if (col == 0)
						{
							// revert the change
						}
						else if (row == 0)
						{
							comp.headers[col-1] = newvalue;
							
							for (var i = 0; i < comp._data.length; i++)
							{
								comp._data[i][newvalue] = comp._data[i][oldvalue];
								delete comp._data[i][oldvalue];
							}
						}
						else
						{
							comp._data[row-1][comp.headers[col-1]] = newvalue;
						}
					}
				}
			};
			
			// add hooks for inserting/deleting rows/cols, change comp._data as necessary
		}
		else if (this.form == 'listOfLists')
		{
			options.data = this._data;
			options.afterChange = function(changes, source) { if (source != 'loadData') { Griddl.Components.MarkDirty(); } };
		}
		else if (this.form == 'object')
		{
			this.display = 'json';
			this.add();
			return;
		}
		else if (this.form == 'list')
		{
			this.display = 'json';
			this.add();
			return;
		}
		else
		{
			this.display = 'json';
			this.add();
			return;
		}
		
		this.handsontable = new Handsontable(this.tableDiv[0], options);
	}
	else if (this.display == 'pre')
	{
		// this.tableDiv[0].innerHTML = '<pre>' + this.matrix.map(row => row.join('\t')).join('\n') + '</pre>';
		
		if (this.form == 'listOfObjects')
		{
			var l = [];
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
			
			this.tableDiv[0].innerHTML = '<pre>' + l.join('\n') + '</pre>';
		}
		else if (this.form == 'listOfLists')
		{
			var l = [];
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
			
			this.tableDiv[0].innerHTML = '<pre>' + l.join('\n') + '</pre>';
		}
		else if (this.form == 'object')
		{
			var l = [];
			
			for (var k = 0; k < this.headers.length; k++)
			{
				var key = this.headers[k];
				l.push(key + '\t' + this._data[key]);
			}
			
			this.tableDiv[0].innerHTML = '<pre>' + l.join('\n') + '</pre>';
		}
		else if (this.form == 'list')
		{
			var l = [];
			
			for (var i = 0; i < this._data.length; i++)
			{
				l.push(i.toString() + '\t' + this._data[i]);
			}
			
			this.tableDiv[0].innerHTML = '<pre>' + l.join('\n') + '</pre>';
		}
		else
		{
			this.display = 'json';
			this.add();
		}
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
	
	if (this.format == 'headerList')
	{
		json.data = {};
		json.data.headers = this.headers; // or regenerate headers here?
		json.data.values = [];
		
		for (var i = 0; i < this._data.length; i++)
		{
			var l = [];
			
			for (var k = 0; k < this.headers.length; k++)
			{
				l.push(this._data[i][this.headers[k]]);
			}
			
			json.data.values.push(l);
		}
	}
	else
	{
		json.data = this._data;
	}
	
	json.params = {};
	json.params.format = this.format;
	json.params.display = this.display;
	json.params.form = this.form;
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
function DetermineDataForm(data) {
	
	// object : { Primitive }
	// list : [ Primitive ]
	// listOfObjects : [ { Primitive } ]
	// listOfLists : [ [ Primitive ] ]
	
	
	// other : anything else, including Primitive, {empty}, [empty], {compound}, [heterogeneous], [{compound}] , [[compound]] (i believe this is exhaustive)
	// [ [ ragged ] ]
	
	
	// returns object, list, listOfObjects, listOfLists, other
	
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

function ObjectToListOfLists(data, headers) {
	
	var l = [];
	
	for (var i = 0; i < headers.length; i++)
	{
		l.push( [ data[headers[i]] ]);
	}
	
	return l;
}
function ListToListOfLists(data) {
	
	var l = [];
	
	for (var i = 0; i < data.length; i++)
	{
		var row = [];
		row.push(data[i]);
		l.push(row);
	}
	
	return l;
}

function ListOfObjectsToListOfLists(data) {
	
	var l = [];
	
	var headers = []; for (var key in data[0]) { headers.push(key); } // or better, use the union of all fields
	
	var headerRow = [];
	headerRow.push('');
	for (var k = 0; k < headers.length; k++)
	{
		headerRow.push(headers[k]);
	}
	l.push(headerRow);
	
	for (var i = 0; i < data.length; i++)
	{
		var row = [];
		row.push(i);
		
		for (var k = 0; k < headers.length; k++)
		{
			row.push(data[i][headers[k]]);
		}
		
		l.push(row);
	}
	
	return l;
}

function DataToTable(data) {
	
	var colHeaders = []; for (var key in data[0]) { colHeaders.push(key); }
	
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
	
	for (var i = 0; i < data.length; i++)
	{
		var tr = $(document.createElement('tr'));
		
		var td = $(document.createElement('td'));
		td.css('border', '1px solid black');
		td.html(i.toString());
		tr.append(td);
		
		for (var key in data[i])
		{
			var td = $(document.createElement('td'));
			td.css('border', '1px solid black');
			td.html(data[i][key].toString());
			tr.append(td);
		}
		
		table.append(tr);
	}
	
	return table;
}

Data.prototype.getText = function() { return JSON.stringify(this.data); };
Data.prototype.setText = function(text) { }; // unclear how to specify the form of the text
Data.prototype.getData = function() { return this.data; };
Data.prototype.setData = function(data) { this.data = data };

// csv/tsv are restricted to listOfObjects
// $.csv.fromObjects(objects) => csv
// $.csv.fromArrays(arrays) => csv
// $.csv.toObjects(csv) => [{}]
// $.csv.toArrays(csv) => [[]]

var TsvToObjs = Griddl.TsvToObjs = function(text) { return MatrixToObjs(TsvToMatrix2(text)); }
var TsvToMatrix = Griddl.TsvToMatrix = function(text) { return LinesToMatrixPadded(text.split('\n')); };
var TsvToMatrix2 = function(text) { return text.trim().split('\n').map(line => line.split('\t')); };
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
		
		for (var j = start; j < matrix[i].length; j++)
		{
			obj[keys[j - start]] = ParseStringToObj(matrix[i][j]);
		}
		
		for (var j = matrix[i].length; j < keys.length; j++)
		{
			obj[keys[j - start]] = null;
		}
		
		objects.push(obj);
	}
	
	return objects;
};
var ObjsToJoinedLines = Griddl.ObjsToJoinedLines = function(objects) {
	
	if (objects.length == 0) { return ''; }
	
	var lines = [];
	
	
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
};
var ObjsToTsv = function(objs, headers) {
	
	var lines = [];
	
	lines.push(headers.join('\t'));
	
	for (var i = 0; i < objs.length; i++)
	{
		var entries = [];
		
		for (var k = 0; k < headers.length; k++)
		{
			var val = objs[i][headers[k]];
			entries.push((val === null) ? '' : val.toString());
		}
		
		lines.push(entries.join('\t'));
	}
	
	return lines.join('\n');
};



var ParseStringToObj = function(str) {
	
	var val = null;
	
	var c = str[0];
	
	// could be replaced by a regex
	if (c == '0' || c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9' || c == '.' || c == '-' || c == '+')
	{
		val = parseFloat(str);
	}
	else
	{
		val = str;
	}
	
	return val;
};

// maybe these are just representation toggles
// now that we have more space, we can go beyond text/grid
// we can do json/grid/matrix/formula/pre/tree?

// where formula uses A1 style headers and bumps the field names to the first row

// display options:
// json - json text in a codemirror
// grid - handsontable with headers
// matrix - handsontable without headers
// formula - handsontable with A1-style headers (this is necessary for formulas)
// pre - json or tab-separated values in a <pre>

// to detect object vs list: (see http://blog.niftysnippets.org/2010/09/say-what.html)
// Object.prototype.toString.call([])                => "[object Array]"
// Object.prototype.toString.call({})                => "[object Object]"
// Object.prototype.toString.call(0)                 => "[object Number]"
// Object.prototype.toString.call("")                => "[object String]"
// Object.prototype.toString.call(false)             => "[object Boolean]"
// Object.prototype.toString.call(null)              => "[object Null]"
// Object.prototype.toString.call(undefined)         => "[object Undefined]"
// Object.prototype.toString.call(function(){})      => "[object Function]"
// Object.prototype.toString.call(/a/)               => "[object RegExp]"
// Object.prototype.toString.call(new Uint8Array(1)) => "[object Uint8Array]"



// structure types:
// {} - object of primitives
// [] - list of primitives
// [{}] - list of objects - standard form
// [[]] - list of lists - just use numbers if a grid display is specified

// for these: there are special cases where there is a reasonable way to display the data in a grid, but we can probably just ignore them and only permit json or tree displays
// {{}} - object of objects
// {[]} - object of lists


// we can insert/delete rows/cols in a listOfLists displayed in a grid, so we don't need the matrix option



Griddl.Components.data = Data;

})();

