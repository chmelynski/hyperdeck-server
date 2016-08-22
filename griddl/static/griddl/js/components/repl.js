
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
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	this.inputDiv = null;
	
	this.snips = json.snips;
	this.funcs = [];
	
	this.inputs = [];
	this.outputs = [];
};
Repl.prototype.add = function() {
	
	var comp = this;
	
	this.div.html('');
	comp.div.append($('<button>Clear</button>').on('click', function() { comp.clear(); }));
	comp.div.append($('<br />'));
	comp.inputDiv = $('<div></div>').appendTo(comp.div);
	this.snips.forEach(function(snip, index) { comp.addInput(snip, index); });
	if (comp.type == 'snips') { comp.div.append($('<button>Add</button>').on('click', function() { comp.addInput(); })); }
};
Repl.prototype.addInput = function(snip, index) {
	
	var comp = this;
	
	this.markDirty();
	
	if (typeof(snip) == 'undefined')
	{
		snip = '';
		comp.snips.push(snip);
		comp.funcs.push(null);
		index = comp.snips.length - 1;
	}
	
	var row = $('<span></span>').appendTo(comp.inputDiv);
	
	if (comp.type == 'snips') { row.append($('<button>-</button>').on('click', function() { comp.remove(index); })); }
	
	var arrowIndex = index;
	
	var input = $('<input type="text" size="40" value="' + snip + '"></input>').on('keydown', function(keyEvent) {
		
		// up and down arrows move between existing snippets
		if (keyEvent.which == 38 || keyEvent.which == 40)
		{
			if (keyEvent.which == 38) { arrowIndex = Math.max(arrowIndex - 1, 0); }
			if (keyEvent.which == 40) { arrowIndex = Math.min(arrowIndex + 1, comp.snips.length-1); }
			this.value = comp.snips[arrowIndex];
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
			comp.snips[index] = this.value;
			if (comp.type == 'repl') { comp.exec(index); if (index == comp.snips.length - 1) { comp.addInput()[0].focus(); } }
		}
	}).appendTo(row);
	
	comp.inputs.push(input);
	
	if (comp.type == 'snips') { row.append($('<button>Run</button>').on('click', function() { comp.exec(index); })); }
	
	comp.outputs.push($('<div></div>').appendTo(row)); // snips need an output div to display errors
	
	return input;
};
Repl.prototype.compile = function() {
	
	for (var i = 0; i < this.snips.length; i++)
	{
		this.outputs[i].text('');
		
		try
		{
			this.funcs[i] = new Function('', 'return ' + this.snips[i]);
		}
		catch (e)
		{
			this.outputs[i].css('color', 'red');
			this.outputs[i].text(e);
		}
	}
};
Repl.prototype.afterLoad = function() {
	
	// we do this here rather than in the constructor because the errorSpan has to be in place
	// we do this here rather than in add because we don't want to exec inline <script>s until all components have loaded
	this.compile();
};
Repl.prototype.exec = function(k) {
	
	this.outputs[k].text('');
	
	try
	{
		this.funcs[k] = new Function('', 'return ' + this.snips[k]);
		var output = this.funcs[k]();
		
		if (this.type == 'repl')
		{
			this.outputs[k].css('color', 'black');
			this.outputs[k].text(output);
		}
	}
	catch (e)
	{
		this.outputs[k].css('color', 'red');
		this.outputs[k].text(e);
	}
};
Repl.prototype.remove = function(k) {
	
	this.snips.splice(k, 1);
	this.funcs.splice(k, 1);
	this.inputs.splice(k, 1);
	this.outputs.splice(k, 1);
	this.inputDiv.children().eq(k).remove();
	this.markDirty();
};
Repl.prototype.clear = function() {
	this.snips = [''];
	this.funcs = [null];
	this.inputs = [];
	this.outputs = [];
	this.add();
	this.markDirty();
};
Repl.prototype.displayError = function(e) {
	
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
	this.errorSpan.text('Error: ' + e.message + ' (at line ' + lineNumber + ', column ' + colNumber + ')');
};
Repl.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.snips = ((this.type == 'snips') ? this.snips : []);
	return json;
};

Repl.prototype.get = function(options) {
	
	if (this.type == 'repl') { throw new Error('The "repl" component does not support Get/Set.'); }
	
	var result = null;
	
	if (options && options.format)
	{
		if (options.format == 'text')
		{
			result = this.snips.join('\n');
		}
		else if (options.format == 'list')
		{
			result = this.snips;
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
		result = this.snips;
	}
	
	return result;
};
Repl.prototype.set = function(data, options) {
	
	if (this.type == 'repl') { throw new Error('The "repl" component does not support Get/Set.'); }
	
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
	
	this.snips = thedata;
};

Hyperdeck.Components.repl = Repl;
Hyperdeck.Components.snips = Repl;

})();

