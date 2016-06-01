
(function() {

// we compile on blur or when text is set
// for js, compile just builds the Function object, it doesn't execute it
// for html, css, and md, compile passes through to exec

var Code = function(json, type) {
	
	if (!json)
	{
		json = {};
		json.type = type;
		json.name = Griddl.Components.UniqueName(type, 1);
		json.visible = true;
		json.text = '';
	}
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	this.codemirror = null;
	this.errorSpan = null;
	
	this._text = json.text;
	this.data = null; // this is the function object for js, and plain text otherwise
	
	Object.defineProperty(this, 'text', { 
		get : function() {
			return this._text;
		},
		set : function(value) {
			this._text = value;
			if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
			this.codemirror.getDoc().setValue(this._text);
			this.compile();
		}
	});
};
Code.prototype.add = function() {
	
	var comp = this;
	
	if (this.type == 'js') //  || this.type == 'html' || this.type == 'css' - now we're modifying the DOM on blur, without needing a button click
	{
		var button = $('<button></button>');
		button.text({js:'Run Code',html:'Add to DOM',css:'Add to DOM'}[this.type]);
		button[0].onclick = function() { comp.exec(); };
		this.div.append(button);
	}
	
	var textarea = $(document.createElement('textarea'));
	this.div.append(textarea);
	
	var modeDict = {txt:'plain',js:'javascript',css:'css',html:'xml',md:'markdown'};
	var options = {};
	options.mode = modeDict[this.type];
	options.smartIndent = false;
	options.lineNumbers = true;
	options.lineWrapping = true;
	this.codemirror = CodeMirror.fromTextArea(textarea[0], options);
	
	// on 'change' or 'blur'
	this.codemirror.on('blur', function() {
		if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
		comp._text = comp.codemirror.getValue(); // we avoid a setter loop by setting this._text, not this.text
		comp.compile();
	});
	
	this.codemirror.getDoc().setValue(this.text);
	
	this.errorSpan = $('<span></span>');
	this.errorSpan.css('color', 'red');
	this.div.append(this.errorSpan);
	
	this.compile(); // we do this here in add rather than in the constructor because the errorSpan has to be in place
};
Code.prototype.compile = function() {
	
	if (this.type == 'js')
	{
		try
		{
			this.data = new Function('args', this.text);
		}
		catch (e)
		{
			this.displayError(e);
			//throw new Error('invalid javascript');
		}
	}
	else if (this.type == 'html' || this.type == 'css' || this.type == 'md')
	{
		this.exec();
	}
	else
	{
		this.data = this.text;
	}
};
Code.prototype.afterLoad = function() {
	
	if (this.type == 'html' || this.type == 'css' || this.type == 'md')
	{
		this.exec();
	}
};
Code.prototype.exec = function() {
	
	this._text = this.codemirror.getDoc().getValue();
	
	if (this.type == 'css')
	{
		$('#' + this.name).remove();
		var style = $(document.createElement('style'));
		style.attr('id', this.name);
		style.html(this.text);
		$('head').append(style);
	}
	else if (this.type == 'html')
	{
		$('#' + this.name).remove();
		var div = $('<div id="' + this.name + '"></div>');
		div.html(this.text);
		$('#output').append(div);
	}
	else if (this.type == 'md')
	{
		$('#' + this.name).remove();
		var div = $('<div id="' + this.name + '"></div>');
		var html = markdown.toHTML(this.text);
		div.html(html);
		$('#output').append(div);
	}
	else if (this.type == 'js')
	{
		var fn = new Function('args', this.text);
		this.data = fn;
		
		this.errorSpan.text('');
		
		try
		{
			fn();
		}
		catch (e)
		{
			this.displayError(e);
		}
	}
	else
	{
		throw new Error("'" + this.name + "' is a " + this.type + ", not an executable js/css/html object");
	}
};
Code.prototype.displayError = function(e) {
	
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
Code.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.text = this.text;
	return json;
};

//Code.prototype.getText = function() { return this.codemirror.getDoc().getValue(); };
//Code.prototype.setText = function(text) { this.text = text; };
//Code.prototype.getData = function() { return this.data; };
//Code.prototype.setData = function(fn) { if (this.type == 'js') { this.data = fn; this.text = fn.toString(); this.refresh(); } };

Griddl.Components.txt = Code;
Griddl.Components.js = Code;
Griddl.Components.html = Code;
Griddl.Components.css = Code;
Griddl.Components.md = Code;

})();

