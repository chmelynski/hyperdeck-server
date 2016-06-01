
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
		json.params.display = 'grid';
		json.params.form = null;
	}
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible; // can't use ?: here because visible can be set to false
	
	this.div = null;
	this.tableDiv = null; // for unknown reasons we pass a sub div to Handsontable / add the <table> or <pre> to the sub div
	this.handsontable = null;
	this.codemirror = null;
	this.firstChange = false; // stupid flag we need for MarkDirty to work correctly
	
	this.data = json.data;
	this.htData = null; // in many cases, we have to convert the data to a different form to get HT to display it the way we want - this holds the converted data
	
	this.format = json.params.format; // json, headerList
	this.headers = json.params.headers ? json.params.headers : null; // this is needed to specify which columns to display and in what order
	this.display = json.params.display;
	this.form = json.params.form; // object, list, listOfObjects, listOfLists, other
	
	if (this.format == 'headerList')
	{
		this.headers = this.data.headers;
		
		// convert this.data from {headers:["foo","bar"],values:[[1,2],[3,4]]} => [{"foo":1,"bar":2},{"foo":3,"bar":4}]
		var data = [];
		
		for (var i = 0; i < this.data.values.length; i++)
		{
			var obj = {};
			
			for (var k = 0; k < this.data.headers.length; k++)
			{
				obj[this.data.headers[k]] = this.data.values[i][k];
			}
			
			data.push(obj);
		}
		
		this.data = data;
	}
	else if (this.format == 'json')
	{
		if (this.headers === null) { this.introspectHeaders(); }
	}
	else
	{
		throw new Error();
	}
	
	// this can be an expensive operation, so we cache the result and remember it as long as we can
	// for example, if the data is modified by the user interacting with a grid, we can be assured the data stays in a certain form
	// the only time the slate gets completely cleared is when the user introduces arbitrary json
	if (this.form === null) { this.form = DetermineDataForm(this.data); }
	
	//console.log(this.name + ' - ' + this.form)
	
	if (this.form == 'object')
	{
		// eventually we want to convert this.data into a form that Handsontable will display the way we want it
		// but then edits to the HT will be modifying the converted form, which then has to be converted back if something else needs the data
		// this is doable but delicate, so we will put it off.  besides, json is pretty understandable in this instance
		this.display = 'json';
	}
	else if (this.form == 'list')
	{
		// same note as for object above
		this.display = 'json';
	}
	else if (this.form == 'listOfObjects')
	{
		
	}
	else if (this.form == 'listOfLists')
	{
		
	}
	else if (this.form == 'other')
	{
		this.display = 'json';
	}
	else
	{
		throw new Error();
	}
};
Data.prototype.add = function() {
	
	this.div.html('');
	
	var gui = new dat.GUI({autoPlace:false});
	var displayControl = gui.add(this, 'display', ['json','grid','matrix','formula','pre']); // restrict based on form, add handler for immediate change
	
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
	
	if (this.display == 'json')
	{
		var textbox = $(document.createElement('textarea'));
		this.tableDiv.append(textbox);
		this.codemirror = CodeMirror.fromTextArea(textbox[0], { mode : 'javascript' , smartIndent : false , lineNumbers : true , lineWrapping : true });
		this.codemirror.on('blur', function() {
			comp.data = JSON.parse(comp.codemirror.getValue()); // error checking?
			comp.introspectHeaders();
		});
		this.codemirror.on('change', function() { Griddl.Components.MarkDirty(); });
		this.codemirror.getDoc().setValue(JSON.stringify(this.data))
	}
	else if (this.display == 'grid')
	{
		var rowHeaders = null;
		var colHeaders = null;
		
		if (this.form == 'listOfObjects')
		{
			rowHeaders = function(index) { return index; };
			colHeaders = this.headers;
		}
		else if (this.form == 'listOfLists')
		{
			rowHeaders = function(index) { return index; };
			colHeaders = this.headers;
		}
		else
		{
			throw new Error();
		}
		
		var options = {
			data : this.data ,
			formulas : false ,
			rowHeaders : rowHeaders ,
			colHeaders : colHeaders ,
			contextMenu : true ,
			manualColumnResize : true ,
			afterChange : function(changes, source) { if (source != 'loadData') { Griddl.Components.MarkDirty(); } }
			//colWidths : DetermineColWidths(this.$, '11pt Calibri', [ 5 , 23 , 5 ]) // expand widths to accomodate text length
			//colWidths : [ 10 , 30 , 10 ].map(function(elt) { return elt * TextWidth('m', '11pt Calibri'); }) // fixed widths, regardless of text length
		};
		
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
			this.htData = ListOfObjectsToListOfLists(this.data);
			options.data = this.htData;
			
			options.afterChange = function(changes, source) {
				
				if (source != 'loadData')
				{
					Griddl.Components.MarkDirty();
					
					// a change to headers in first row requires re-keying all the objects
					// a change to headers in the first col is ignored
					// a change to values propagates
					// for perf, we might want to iterate through the list of changes rather than doing the whole conversion on every change
					//this.data = ListOfListsToListOfObjects(this.htData);
					
					for (var i = 0; i < changes.length; i++)
					{
						var change = changes[i];
						var row = change[0];
						var col = change[1];
						var oldvalue = change[2];
						var newvalue = change[3];
						
						if (col == 0)
						{
							// revert the change
						}
						else if (row == 0)
						{
							comp.headers[col-1] = newvalue;
							
							for (var i = 0; i < comp.data.length; i++)
							{
								comp.data[i][newvalue] = comp.data[i][oldvalue];
								delete comp.data[i][oldvalue];
							}
						}
						else
						{
							comp.data[row-1][comp.headers[col-1]] = newvalue;
						}
					}
				}
			};
			
			// add hooks for inserting/deleting rows/cols, change comp.data as necessary
		}
		else if (this.form == 'listOfLists')
		{
			options.data = this.data;
			options.afterChange = function(changes, source) { if (source != 'loadData') { Griddl.Components.MarkDirty(); } };
		}
		else
		{
			throw new Error();
		}
		
		this.handsontable = new Handsontable(this.tableDiv[0], options);
	}
	else if (this.display == 'pre')
	{
		// this.tableDiv[0].innerHTML = '<pre>' + this.matrix.map(row => row.join('\t')).join('\n') + '</pre>';
		
		if (this.form == 'listOfObjects')
		{
			var headers = [];
			for (var key in this.data[0]) { headers.push(key); }
			
			var l = [];
			l.push('\t' + headers.join('\t'));
			
			for (var i = 0; i < this.data.length; i++)
			{
				var row = [];
				row.push(i.toString());
				
				for (var k = 0; k < headers.length; k++)
				{
					row.push(this.data[i][headers[k]]);
				}
				
				l.push(row.join('\t'));
			}
			
			this.tableDiv[0].innerHTML = '<pre>' + l.join('\n') + '</pre>';
		}
		else if (this.form == 'listOfLists')
		{
			var headers = [];
			for (var i = 0; i < this.data[0].length; i++) { headers.push(i.toString()); }
			
			var l = [];
			l.push('\t' + headers.join('\t'));
			
			for (var i = 0; i < this.data.length; i++)
			{
				var row = [];
				row.push(i.toString());
				
				for (var j = 0; j < this.data[i].length; j++)
				{
					row.push(this.data[i][j]);
				}
				
				l.push(row.join('\t'));
			}
			
			this.tableDiv[0].innerHTML = '<pre>' + l.join('\n') + '</pre>';
		}
		else
		{
			throw new Error();
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
	json.data = this.data;
	json.params = {};
	json.params.format = this.format;
	json.params.display = this.display;
	json.params.form = this.form;
	return json;
};
Data.prototype.introspectHeaders = function() {
	
	this.headers = [];
	
	for (var i = 0; i < this.data.length; i++)
	{
		for (var key in this.data[i])
		{
			if (this.headers.indexOf(key) == -1)
			{
				this.headers.push(key);
			}
		}
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
			
			if (subtype == '[object Array]' || type == '[object Object]')
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

// these two functions are probably obsolete
Data.prototype.representationToggle = function() {
	
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
		
		Griddl.Components.MarkDirty();
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
		
		Griddl.Components.MarkDirty();
	};
	
	return [ { label : 'Grid' , fn : TextToGrid } , { label : 'Text' , fn : GridToText } ];
};
Data.prototype.refresh = function() {
	
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
			formulas : true ,
			rowHeaders : rowHeaders ,
			colHeaders : colHeaders ,
			contextMenu : true ,
			manualColumnResize : true ,
			afterChange : function(changes, source) { if (this.firstChange) { this.firstChange = false; } else { Griddl.Components.MarkDirty(); } }
			//colWidths : DetermineColWidths(this.$, '11pt Calibri', [ 5 , 23 , 5 ]) // expand widths to accomodate text length
			//colWidths : [ 10 , 30 , 10 ].map(function(elt) { return elt * TextWidth('m', '11pt Calibri'); }) // fixed widths, regardless of text length
		};
		
		this.handsontable = new Handsontable(this.tableDiv[0], options);
	}
	else if (this.type == 'table')
	{
		var table = DataToTable(this.data);
		this.tableDiv.append(table);
	}
	else if (this.type == 'tsv')
	{
		// this works for both the initial add as well as refreshes
		this.tableDiv[0].innerHTML = '<pre>' + this.matrix.map(row => row.join('\t')).join('\n') + '</pre>';
	}
	else
	{
		throw new Error();
	}
};

// these functions are also probably obsolete
Data.prototype.getText = function() {
	
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
Data.prototype.setText = function(text) {
	this.matrix = TsvToMatrix(text);
	this.matrixToData();
	this.refresh();
};
Data.prototype.getData = function() {
	
	// if htData is being used, convert it appropriately
	
	return this.data;
};
Data.prototype.setData = function(data) {
	this.data = data;
	this.refresh();
};


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
function DataToTsv(data) {
	
}

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

Griddl.Components.data = Data;

})();

