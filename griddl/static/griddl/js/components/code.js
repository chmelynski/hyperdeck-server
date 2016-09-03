
(function() {

// the <style> or <div> tag is added in addOutputElements() via add(), so that subsequent calls to exec() just sets the inner html

// we compile() on blur, but we don't actually compile the js in compile() anymore, we compile it in exec()
// for html, css, and md, compile() just calls exec()

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
	
	if (comp._type == 'js')
	{
		var button = $('<button></button>');
		button.text({js:'Run Code',html:'Add to DOM',css:'Add to DOM'}[comp._type]);
		button[0].onclick = function() { comp._exec(); };
		comp._div.append(button);
	}
	
	var textarea = $(document.createElement('textarea'));
	comp._div.append(textarea);
	
	var options = {};
	options.smartIndent = false;
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
	
	options.mode = {txt:'plain',js:'javascript',css:'css',html:'xml',md:'markdown'}[comp._type];
	
	comp._codemirror = CodeMirror.fromTextArea(textarea[0], options);
	
	comp._codemirror.on('change', function() {
		comp._markDirty();
	});
	
	comp._codemirror.on('blur', function() {
		comp._text = comp._codemirror.getValue();
		comp._compile();
	});
	
	comp._codemirror.getDoc().setValue(comp._text);
	
	//comp._errorSpan = $('<span></span>');
	//comp._errorSpan.css('color', 'red');
	//comp._div.append(comp._errorSpan);
	
	comp._addOutputElements();
};
Code.prototype._addOutputElements = function() {
	
	var comp = this;
	
	if (comp._type == 'html' || comp._type == 'css' || comp._type == 'md')
	{
		var tagname = ((comp._type == 'css') ? 'style' : 'div');
		var elt = $('<' + tagname + ' id="' + comp._name + '"></' + tagname + '>');
		$('#output').append(elt);
	}
};
Code.prototype._compile = function() {
	
	var comp = this;
	
	if (comp._type == 'js')
	{
		 // we call compile on blur, and can't change that because it works well for html/css/md
		 // but for js, compiling on blur is kind of a pain.  just compile before exec
		//comp._fn = new Function('args', comp._text);
		
		//comp._errorSpan.text('');
		//try
		//{
		//	comp._fn = new Function('args', comp._text);
		//}
		//catch (e)
		//{
		//	comp._displayError(e);
		//}
	}
	else if (comp._type == 'html' || comp._type == 'css' || comp._type == 'md')
	{
		comp._fn = null;
		comp._exec();
	}
	else
	{
		comp._fn = null;
	}
};
Code.prototype._afterLoad = function() {
	
	var comp = this;
	
	// we do this here rather than in the constructor because the errorSpan has to be in place
	// we do this here rather than in add because we don't want to exec inline <script>s until all components have loaded
	comp._compile();
};
Code.prototype._exec = function() {
	
	var comp = this;
	
	comp._text = comp._codemirror.getDoc().getValue();
	
	if (comp._type == 'css')
	{
		$('#' + comp._name).html(comp._text);
	}
	else if (comp._type == 'html' || comp._type == 'md')
	{
		var html = (comp._type == 'md') ? markdown.toHTML(comp._text) : comp._text;
		$('#' + comp._name).html(html);
		if (MathJax) { MathJax.Hub.Typeset(comp._name); }
	}
	else if (comp._type == 'js')
	{
		comp._fn = new Function('args', comp._text);
		comp._fn();
		
		//comp._errorSpan.text('');
		//try
		//{
		//	comp._fn();
		//}
		//catch (e)
		//{
		//	comp._displayError(e);
		//}
	}
	else
	{
		throw new Error("'" + comp._name + "' is a " + comp._type + ", not an executable js/css/html object");
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
	comp._compile();
};

Hyperdeck.Components.txt = Code;
Hyperdeck.Components.js = Code;
Hyperdeck.Components.html = Code;
Hyperdeck.Components.css = Code;
Hyperdeck.Components.md = Code;

})();

