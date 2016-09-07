
(function() {

// the <style> or <div> tag is added in addOutputElements() via add(), so that subsequent calls to exec() just sets the inner html

// we compile() on blur, but we don't actually compile the js in compile() anymore, we compile it in exec()
// for html, css, and md, compile() just calls exec()

var typeDict = {};
typeDict.txt = {mode:'plain',tag:null,execOnLoad:false,execOnBlur:false,execOnClick:false};
typeDict.html = {mode:'xml',tag:'div',execOnLoad:true,execOnBlur:true,execOnClick:false};
typeDict.md = {mode:'markdown',tag:'div',execOnLoad:true,execOnBlur:true,execOnClick:false};
typeDict.css = {mode:'css',tag:'style',execOnLoad:true,execOnBlur:true,execOnClick:false};
typeDict.js = {mode:'javascript',tag:null,execOnLoad:false,execOnBlur:false,execOnClick:true};
typeDict.script = {mode:'javascript',tag:'div',execOnLoad:true,execOnBlur:true,execOnClick:false};
typeDict.jshtml = {mode:'javascript',tag:'div',execOnLoad:true,execOnBlur:false,execOnClick:true};
typeDict.canvas = {mode:'javascript',tag:'div',execOnLoad:true,execOnBlur:false,execOnClick:true};

var Code = function(json, type, name) {
	
	if (!json)
	{
		json = {};
		json.type = type;
		json.name = name;
		json.visible = true;
		json.text = '';
	}
	
	this._type = json.type;
	this._name = json.name;
	this._visible = json.visible;
	
	this._div = null;
	this._codemirror = null;
	this._errorSpan = null;
	
	this._text = json.text;
	this._fn = null; // this is the function object for js, and plain text otherwise.  we compile in add() rather than here because the errorSpan needs to be in place to display any compilation errors
};
Code.prototype._add = function() {
	
	var comp = this;
	
	if (typeDict[comp._type].execOnClick)
	{
		comp._div.append($('<button>Run Code</button>').on('click', function() { comp._exec(); }));
	}
	
	var textarea = $(document.createElement('textarea'));
	comp._div.append(textarea);
	
	var options = {};
	options.smartIndent = true;
	options.lineNumbers = true;
	options.lineWrapping = true;
	options.foldGutter = true;
	options.tabSize = 2;
	options.indentUnit = 2;
	options.indentWithTabs = true;
	options.gutters = ["CodeMirror-linenumbers","CodeMirror-foldgutter"];
	options.extraKeys = {"Ctrl-Q": function(cm) { cm.foldCode(cm.getCursor()); }};
	
	if (Hyperdeck.Preferences && Hyperdeck.Preferences.CodeMirror)
	{
		for (var key in Hyperdeck.Preferences.CodeMirror) { options[key] = Hyperdeck.Preferences.CodeMirror[key]; }
	}
	
	options.mode = typeDict[comp._type].mode;
	
	comp._codemirror = CodeMirror.fromTextArea(textarea[0], options);
	
	comp._codemirror.on('change', function() {
		comp._markDirty();
	});
	
	comp._codemirror.on('blur', function() {
		comp._text = comp._codemirror.getValue();
		comp._onblur();
	});
	
	comp._codemirror.getDoc().setValue(comp._text);
	
	//comp._errorSpan = $('<span></span>');
	//comp._errorSpan.css('color', 'red');
	//comp._div.append(comp._errorSpan);
	
	comp._addOutputElements();
};
Code.prototype._addOutputElements = function() {
	
	var comp = this;
	
	var tagname = typeDict[comp._type].tag;
	
	if (tagname)
	{
		var elt = $('<' + tagname + ' id="' + comp._name + '"></' + tagname + '>');
		$('#output').append(elt);
	}
};
Code.prototype._onblur = function() {
	
	var comp = this;
	if (typeDict[comp._type].execOnBlur) { comp._exec(); }
};
Code.prototype._afterLoad = function() {
	
	var comp = this;
	// we do this here rather than in add because we don't want to exec inline <script>s until all components have loaded
	if (typeDict[comp._type].execOnLoad) { comp._exec(); }
};
Code.prototype._exec = function() {
	
	var comp = this;
	
	if (comp._type == 'css')
	{
		$('#' + comp._name).html(comp._text);
	}
	else if (comp._type == 'script')
	{
		$('#' + comp._name).html('<script>' + comp._text + '</script>');
	}
	else if (comp._type == 'html' || comp._type == 'md')
	{
		var html = (comp._type == 'md') ? markdown.toHTML(comp._text) : comp._text;
		$('#' + comp._name).html(html);
		if (MathJax) { MathJax.Hub.Typeset(comp._name); }
	}
	else if (comp._type == 'js')
	{
		(new Function('args', comp._text))();
	}
	else if (comp._type == 'canvas')
	{
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');
		$('#' + comp._name).html('')[0].appendChild(canvas);
		(new Function('ctx', comp._text))(ctx);
	}
	else if (comp._type == 'jshtml')
	{
		$('#' + comp._name).html((new Function('args', comp._text))());
	}
	else
	{
		throw new Error("'" + comp._name + "' is not an executable object");
	}
};
Code.prototype._displayError = function(e) {
	
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
	
	if (evalLine == null)
	{
		comp._errorSpan.text(e);
	}
	else
	{
		var fnLineCol = evalLine.split(',')[1]; // ' <anonymous>:7:1)'
		var fnLineColArray = fnLineCol.substring(1, fnLineCol.length - 1).split(':'); // [ '<anonymous' , '7' , '1' ]
		var functionName = fnLineColArray[0];
		var lineNumber = fnLineColArray[1] - 2; // not sure why the line number is 2 off
		var colNumber = fnLineColArray[2];
		comp._errorSpan.text('Error: ' + e.message + ' (at line ' + lineNumber + ', column ' + colNumber + ')');
	}
};
Code.prototype._write = function() {
	
	var comp = this;
	
	var json = {};
	json.type = comp._type;
	json.name = comp._name;
	json.visible = comp._visible;
	json.text = comp._text;
	return json;
};

Code.prototype._get = function(options) {
	
	var comp = this;
	
	return comp._text;
};
Code.prototype._set = function(text, options) {
	
	var comp = this;
	
	comp._text = text;
	comp._markDirty();
	comp._codemirror.getDoc().setValue(comp._text);
	comp._onblur();
};

Hyperdeck.Components.txt = Code;
Hyperdeck.Components.js = Code;
Hyperdeck.Components.html = Code;
Hyperdeck.Components.css = Code;
Hyperdeck.Components.md = Code;
Hyperdeck.Components.canvas = Code;
Hyperdeck.Components.jshtml = Code;
Hyperdeck.Components.script = Code;

})();

