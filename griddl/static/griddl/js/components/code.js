
(function() {

// the <style> or <div> tag is added in add(), so that subsequent calls to exec() just sets the inner html

// we compile on blur or when text is set
// for js, compile just builds the Function object, it doesn't execute it
// for html, css, and md, compile sets this._data and then calls exec

var Code = function(json, type, name) {
	
	if (!json)
	{
		json = {};
		json.type = type;
		json.name = name;
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
	this._data = null; // this is the function object for js, and plain text otherwise.  we compile in add() rather than here because the errorSpan needs to be in place to display any compilation errors
	
	Object.defineProperty(this, 'text', {
		get : function() {
			return this._text;
		},
		set : function(value) {
			this._text = value;
			this.markDirty();
			this.codemirror.getDoc().setValue(this._text);
			this.compile();
		}
	});
	
	Object.defineProperty(this, 'data', {
		get : function() {
			return this._data;
		},
		set : function(value) {
			
			// if type is js, data should be a function.  otherwise, data should be plain text
			// that said, there is a seed here for general purpose conversion between objects and their textual representations
			// compile(string) => object
			// textify(object) => string
			
			this._data = value;
			this.markDirty();
			this.textify();
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
	options.foldGutter = true;
	options.gutters = ["CodeMirror-linenumbers", "CodeMirror-foldgutter"];
	options.extraKeys = {"Ctrl-Q": function(cm) { cm.foldCode(cm.getCursor()); }};
	this.codemirror = CodeMirror.fromTextArea(textarea[0], options);
	
	this.codemirror.on('change', function() {
		comp.markDirty();
	});
	
	this.codemirror.on('blur', function() {
		comp._text = comp.codemirror.getValue(); // we avoid a setter loop by setting this._text, not this.text
		comp.compile();
	});
	
	this.codemirror.getDoc().setValue(this.text);
	
	this.errorSpan = $('<span></span>');
	this.errorSpan.css('color', 'red');
	this.div.append(this.errorSpan);
	
	this.addOutputElements();
};
Code.prototype.addOutputElements = function() {
	
	if (this.type == 'html' || this.type == 'css' || this.type == 'md')
	{
		var tagname = ((this.type == 'css') ? 'style' : 'div');
		var elt = $('<' + tagname + ' id="' + this.name + '"></' + tagname + '>');
		$('#output').append(elt);
	}
};
Code.prototype.compile = function() {
	
	if (this.type == 'js')
	{
		this._data = new Function('args', this._text);
		
		//this.errorSpan.text('');
		//try
		//{
		//	this._data = new Function('args', this._text);
		//}
		//catch (e)
		//{
		//	this.displayError(e);
		//}
	}
	else if (this.type == 'html' || this.type == 'css' || this.type == 'md')
	{
		this._data = this._text;
		this.exec();
	}
	else
	{
		this._data = this._text;
	}
};
Code.prototype.textify = function() {
	
	if (this.type == 'js')
	{
		this._text = this._data.toString();
	}
	else
	{
		this._text = this._data.toString(); // this._data should be a string anyway, but no harm in calling toString
	}
	
	this.codemirror.getDoc().setValue(this._text);
};
Code.prototype.afterLoad = function() {
	
	// we do this here rather than in the constructor because the errorSpan has to be in place
	// we do this here rather than in add because we don't want to exec inline <script>s until all components have loaded
	this.compile();
};
Code.prototype.exec = function() {
	
	this._text = this.codemirror.getDoc().getValue();
	
	if (this.type == 'css')
	{
		$('#' + this.name).html(this.text);
	}
	else if (this.type == 'html' || this.type == 'md')
	{
		var html = (this.type == 'md') ? markdown.toHTML(this.text) : this.text;
		$('#' + this.name).html(html);
		
		//var div = $('<div id="' + this.name + '"></div>');
		//div.html(html);
		//var id = "#" + this.name;
		//
		//if ($(id, '#output').length > 0)
		//{
		//	$('#' + this.name).replaceWith(div);
		//}
		//else
		//{
		//	$('#output').append(div);
		//}
		
		if (MathJax) { MathJax.Hub.Typeset(this.name); }
	}
	else if (this.type == 'js')
	{
		this.data();
		
		//this.errorSpan.text('');
		//try
		//{
		//	this.data();
		//}
		//catch (e)
		//{
		//	this.displayError(e);
		//}
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
	
	if (evalLine == null)
	{
		this.errorSpan.text(e);
	}
	else
	{
		var fnLineCol = evalLine.split(',')[1]; // ' <anonymous>:7:1)'
		var fnLineColArray = fnLineCol.substring(1, fnLineCol.length - 1).split(':'); // [ '<anonymous' , '7' , '1' ]
		var functionName = fnLineColArray[0];
		var lineNumber = fnLineColArray[1] - 2; // not sure why the line number is 2 off
		var colNumber = fnLineColArray[2];
		this.errorSpan.text('Error: ' + e.message + ' (at line ' + lineNumber + ', column ' + colNumber + ')');
	}
};
Code.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.text = this.text;
	return json;
};

// okay, for Code, this is pretty dumb. but having separate getter/setter functions makes more sense for components like File, where the internal
// names are b64 and uint8array rather than 'text' and 'data'.  although maybe we should just implement 'text' and 'data' getter/setters in File
Code.prototype.getText = function() { return this.text; };
Code.prototype.setText = function(text) { this.text = text; };
Code.prototype.getData = function() { return this.data; };
Code.prototype.setData = function(data) { this.data = data };

Hyperdeck.Components.txt = Code;
Hyperdeck.Components.js = Code;
Hyperdeck.Components.html = Code;
Hyperdeck.Components.css = Code;
Hyperdeck.Components.md = Code;

})();

