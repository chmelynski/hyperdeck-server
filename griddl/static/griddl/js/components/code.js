
(function() {

// the <style> or <div> tag is added in addOutputElements() via add(), so that subsequent calls to exec() just sets the inner html

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
	this._datguiDiv = null;
	this._codemirrorDiv = null;
	this._codemirror = null;
	
	this._display = (json.display === undefined) ? 'codemirror' : json.display; // 'codemirror','readonly','summary'
	
	// javascript options
	this._mode = (json.mode === undefined) ? 'default' : json.mode; // 'default','canvas','htmlgen'
	this._runOnBlur = (json.runOnBlur === undefined) ? false : json.runOnBlur;
	this._runOnLoad = (json.runOnLoad === undefined) ? false : json.runOnLoad;
	
	if (this._type == 'html' || this._type == 'md' || this._type == 'css')
	{
		this._runOnBlur = true;
		this._runOnLoad = true;
	}
	
	Object.defineProperty(this, 'display', {
		get : function() { return this._display; },
		set : function (value) { this._display = value; }
	});
	
	Object.defineProperty(this, 'mode', {
		get : function() { return this._mode; },
		set : function (value) { this._mode = value; }
	});
	
	Object.defineProperty(this, 'runOnBlur', {
		get : function() { return this._runOnBlur; },
		set : function (value) { this._runOnBlur = value; }
	});
	
	Object.defineProperty(this, 'runOnLoad', {
		get : function() { return this._runOnLoad; },
		set : function (value) { this._runOnLoad = value; }
	});
	
	this._text = json.text;
	
	// deprecated
	this._errorSpan = null;
	this._fn = null; // this is the function object for js, and plain text otherwise.  we compile in add() rather than here because the errorSpan needs to be in place to display any compilation errors
};
Code.prototype._add = function() {
	
	var comp = this;
	
	comp._div.html('');
	comp._datguiDiv = $('<div></div>').appendTo(comp._div);
	comp._codemirrorDiv = $('<div></div>').appendTo(comp._div);
	
	comp._refreshDatgui();
	
	if (comp._display == 'codemirror')
	{
		var textarea = $('<textarea></textarea>').appendTo(comp._codemirrorDiv);
		
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
		
		options.mode = {html:'xml',css:'css',md:'markdown',js:'javascript'}[comp._type];
		
		comp._codemirror = CodeMirror.fromTextArea(textarea[0], options);
		
		comp._codemirror.on('change', function() {
			comp._markDirty();
		});
		
		comp._codemirror.on('blur', function() {
			comp._text = comp._codemirror.getValue();
			comp._onblur();
		});
		
		comp._codemirror.getDoc().setValue(comp._text);
		
		//comp._errorSpan = $('<span style="color:red"></span>').appendTo(comp._codemirrorDiv);
	}
	else if (comp._display == 'pre' || comp._display == 'readonly')
	{
		$('<pre></pre>').text(comp._text).appendTo(comp._codemirrorDiv);
	}
	else if (comp._display == 'stats' || comp._display == 'summary')
	{
		$('<pre></pre>').text(comp._text.length + ' chars').appendTo(comp._codemirrorDiv);
	}
	else
	{
		throw new Error();
	}
};
Code.prototype._refreshDatgui = function() {
	
	var comp = this;
	
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
	if (comp._type == 'js')
	{
		gui.add(comp, 'Run');
		gui.add(comp, 'mode', ['default','canvas','htmlgen']).onChange(function(value) { comp._markDirty(); });
		gui.add(comp, 'runOnBlur').onChange(function(value) { comp._markDirty(); });
		gui.add(comp, 'runOnLoad').onChange(function(value) { comp._markDirty(); });
	}
	var displayControl = gui.add(comp, 'display', ['codemirror','readonly','summary']);
	displayControl.onChange(function(value) { comp._markDirty(); comp._add(); });
	gui.add(comp, 'Upload');
	gui.add(comp, 'Download');
	
	comp._datguiDiv.html('').append($(gui.domElement));
};
Code.prototype._addOutputElements = function() {
	
	// i think this is called from add() - should it be called from afterLoad() instead?
	
	var comp = this;
	
	var tagname = {html:'div',css:'style',md:'div',js:'div'}[comp._type];
	
	if (tagname)
	{
		var elt = $('<' + tagname + ' id="' + comp._name + '"></' + tagname + '>');
		$('#output').append(elt);
	}
};
Code.prototype._onblur = function() {
	var comp = this;
	if (comp._runOnBlur) { comp._exec(); }
};
Code.prototype._afterLoad = function() {
	var comp = this;
	comp._addOutputElements();
};
Code.prototype._afterAllLoaded = function() {
	var comp = this;
	if (comp._runOnLoad) { comp._exec(); }
};
Code.prototype._exec = function() {
	
	var comp = this;
	
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
		if (comp._mode == 'default')
		{
			(new Function('args', comp._text))();
		}
		else if (comp._mode == 'canvas')
		{
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');
			$('#' + comp._name).html('')[0].appendChild(canvas);
			(new Function('ctx', comp._text))(ctx);
		}
		else if (comp._mode == 'htmlgen')
		{
			$('#' + comp._name).html((new Function('args', comp._text))());
		}
		else
		{
			throw new Error();
		}
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
	json.display = comp._display;
	json.mode = comp._mode;
	json.runOnBlur = comp._runOnBlur;
	json.runOnLoad = comp._runOnLoad;
	return json;
};

Code.prototype.Run = function() { this._exec(); };
Code.prototype.Upload = function() {
	
	var comp = this;
	
	$('<input type="file"><input>').on('change', function() {
		
		var fileReader = new FileReader();
		
		fileReader.onload = function(event)
		{
			comp._text = event.target.result;
			comp._add();
		};
		
		if (this.files.length > 0)
		{
			var f = this.files[0];
			fileReader.readAsText(f); // assume utf-8 i guess
		}
	}).click();
};
Code.prototype.Download = function() {
	
	var comp = this;
	
	var filename = comp._name + '.' + comp._type;
	var text = comp._text;
	
	var reader = new FileReader();
	reader.readAsDataURL(new Blob([text], {type:'text/plain'})); 
	reader.onloadend = function() {
		var a = document.createElement('a');
		a.href = reader.result;
		a.download = filename;
		a.click();
	};
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

})();

