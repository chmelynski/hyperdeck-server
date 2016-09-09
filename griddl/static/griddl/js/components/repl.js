
(function() {

var Repl = function(json, type, name) {
	
	if (!json)
	{
		json = {};
		json.type = type;
		json.name = name;
		json.visible = true;
		json.snips = [ '' ];
	}
	
	this._type = json.type;
	this._name = json.name;
	this._visible = json.visible;
	
	this._div = null;
	this._inputDiv = null;
	
	this._snips = json.snips;
	this._funcs = [];
	
	this._inputs = [];
	this._outputs = [];
};
Repl.prototype._add = function() {
	
	var comp = this;
	
	comp._div.html('');
	comp._div.append($('<button>Clear</button>').on('click', function() { comp._clear(); }));
	comp._div.append($('<br />'));
	comp._inputDiv = $('<div></div>').appendTo(comp._div);
	comp._snips.forEach(function(snip, index) { comp._addInput(snip, index); });
	if (comp._type == 'snips') { comp._div.append($('<button>Add</button>').on('click', function() { comp._addInput(); })); }
};
Repl.prototype._addInput = function(snip, index) {
	
	var comp = this;
	
	comp._markDirty();
	
	if (typeof(snip) == 'undefined')
	{
		snip = '';
		comp._snips.push(snip);
		comp._funcs.push(null);
		index = comp._snips.length - 1;
	}
	
	var row = $('<span></span>').appendTo(comp._inputDiv);
	
	if (comp._type == 'snips') { row.append($('<button>-</button>').on('click', function() { comp._remove(index); })); }
	
	var arrowIndex = index;
	
	var input = $('<input type="text" size="40" value="' + snip + '"></input>').on('keydown', function(keyEvent) {
		
		// up and down arrows move between existing snippets
		if (keyEvent.which == 38 || keyEvent.which == 40)
		{
			if (keyEvent.which == 38) { arrowIndex = Math.max(arrowIndex - 1, 0); }
			if (keyEvent.which == 40) { arrowIndex = Math.min(arrowIndex + 1, comp._snips.length-1); }
			this.value = comp._snips[arrowIndex];
			this.selectionStart = this.value.length;
			this.selectionEnd = this.value.length;
			keyEvent.preventDefault();
		}
		
		// after a period, display hints
		//if (keyEvent.which == 42)
		//{
		//	
		//}
		
		if (keyEvent.which == 13)
		{
			arrowIndex = index; // reset the arrow control
			comp._snips[index] = this.value;
			if (comp._type == 'repl') { comp._exec(index); if (index == comp._snips.length - 1) { comp._addInput()[0].focus(); } }
		}
	}).appendTo(row);
	
	comp._inputs.push(input);
	
	if (comp._type == 'snips') { row.append($('<button>Run</button>').on('click', function() { comp._exec(index); })); }
	
	comp._outputs.push($('<div></div>').appendTo(row)); // snips need an output div to display errors
	
	return input;
};
Repl.prototype._compile = function() {
	
	var comp = this;
	
	for (var i = 0; i < comp._snips.length; i++)
	{
		comp._outputs[i].text('');
		
		try
		{
			comp._funcs[i] = new Function('', 'return ' + comp._snips[i]);
		}
		catch (e)
		{
			comp._outputs[i].css('color', 'red');
			comp._outputs[i].text(e);
		}
	}
};
Repl.prototype._afterLoad = function() {
	
	var comp = this;
	
	// we do this here rather than in the constructor because the errorSpan has to be in place
	// we do this here rather than in add because we don't want to exec inline <script>s until all components have loaded
	comp._compile();
};
Repl.prototype._exec = function(k) {
	
	var comp = this;
	
	comp._outputs[k].text('');
	
	try
	{
		comp._funcs[k] = new Function('', 'return ' + comp._snips[k]);
		var output = comp._funcs[k]();
		
		if (comp._type == 'repl')
		{
			comp._outputs[k].css('color', 'black');
			comp._outputs[k].text(output);
		}
	}
	catch (e)
	{
		comp._outputs[k].css('color', 'red');
		comp._outputs[k].text(e);
	}
};
Repl.prototype._remove = function(k) {
	
	var comp = this;
	
	comp._snips.splice(k, 1);
	comp._funcs.splice(k, 1);
	comp._inputs.splice(k, 1);
	comp._outputs.splice(k, 1);
	comp._inputDiv.children().eq(k).remove();
	comp._markDirty();
};
Repl.prototype._clear = function() {
	
	var comp = this;
	
	comp._snips = [''];
	comp._funcs = [null];
	comp._inputs = [];
	comp._outputs = [];
	comp._add();
	comp._markDirty();
};
Repl.prototype._displayError = function(e) {
	
	var comp = this;
	
	var lines = e.stack.split('\n');
	var evalLine = null;
	for (var i = 0; i < lines.length; i++)
	{
		if (lines[i].trim().substr(0, 7) == 'at eval')
		{
			evalLine = lines[i];
		}
	}
	var fnLineCol = evalLine.split(',')[1]; // ' <anonymous>:7:1)'
	var fnLineColArray = fnLineCol.substring(1, fnLineCol.length - 1).split(':'); // [ '<anonymous' , '7' , '1' ]
	var functionName = fnLineColArray[0];
	var lineNumber = fnLineColArray[1] - 2; // not sure why the line number is 2 off
	var colNumber = fnLineColArray[2];
	comp._errorSpan.text('Error: ' + e.message + ' (at line ' + lineNumber + ', column ' + colNumber + ')');
};
Repl.prototype._write = function() {
	
	var comp = this;
	
	var json = {};
	json.type = comp._type;
	json.name = comp._name;
	json.visible = comp._visible;
	json.snips = ((comp._type == 'snips') ? comp._snips : []);
	return json;
};

Repl.prototype._get = function(options) {
	
	var comp = this;
	
	if (comp._type == 'repl') { throw new Error('The "repl" component does not support Get/Set.'); }
	
	var result = null;
	
	if (options && options.format)
	{
		if (options.format == 'text')
		{
			result = comp._snips.join('\n');
		}
		else if (options.format == 'list')
		{
			result = comp._snips;
		}
		else
		{
			var ls = [];
			ls.push('Unsupported format: "' + options.format + '".');
			ls.push('The "snips" component supports formats "text" and "list".')
			throw new Error(ls.join(' '));
		}
	}
	else
	{
		result = comp._snips;
	}
	
	return result;
};
Repl.prototype._set = function(data, options) {
	
	var comp = this;
	
	if (comp._type == 'repl') { throw new Error('The "repl" component does not support Get/Set.'); }
	
	var thedata = null;
	
	if (options && options.format)
	{
		if (options.format == 'text')
		{
			thedata = data.split('\n');
		}
		else if (options.format == 'list')
		{
			thedata = data
		}
		else
		{
			var ls = [];
			ls.push('Unsupported format: "' + options.format + '".');
			ls.push('The "snips" component supports formats "text" and "list".')
			throw new Error(ls.join(' '));
		}
	}
	else
	{
		throw new Error('Must specify { format : "text" or "list" }.');
	}
	
	comp._snips = thedata;
};

Hyperdeck.Components.repl = Repl;
Hyperdeck.Components.snips = Repl;

})();

