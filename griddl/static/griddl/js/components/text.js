
(function() {

var Text = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	this.codemirror = null;
	this.errorSpan = null;
	
	this.text = null;
	this.data = null; // this is the function object for js, and plain text otherwise
	
	this.load(json.text);
};
Text.prototype.add = function() {
	
	var comp = this;
	
	if (this.type == 'js' || this.type == 'html' || this.type == 'css')
	{
		var button = $('<button></button>');
		button.text({js:'Run Code',html:'Add to DOM',css:'Add to DOM'}[this.type]);
		button[0].onclick = function() { comp.exec(); };
		this.div.append(button);
	}
	
	var textbox = $(document.createElement('textarea'));
	this.div.append(textbox);
	
	var modeDict = {txt:'plain',js:'javascript',css:'css',html:'xml',json:'javascript'};
	var mode = modeDict[this.type];
	this.codemirror = CodeMirror.fromTextArea(textbox[0], { mode : mode , smartIndent : false , lineNumbers : true , lineWrapping : true });
	this.codemirror.on('blur', function() { comp.text = comp.codemirror.getValue(); comp.compile();  });
	this.codemirror.on('change', function() { Griddl.Components.MarkDirty(); });
	
	this.errorSpan = $('<span></span>');
	this.errorSpan.css('color', 'red');
	this.div.append(this.errorSpan);
	
	this.refresh();
};
Text.prototype.refresh = function() {
	this.codemirror.getDoc().setValue(this.text);
};
Text.prototype.load = function(text) {
	
	// new -> constructor -> load -> setData
	// init -> constructor -> load -> setData
	// upload -> load -> setData
	// blur -> setData
	
	this.text = text;
	this.compile();
};
Text.prototype.compile = function() {
	
	if (this.type == 'json')
	{
		try
		{
			this.data = JSON.parse(this.text);
		}
		catch (e)
		{
			// the parse has failed - display an error message - look at error handling code in MakeComponentsDiv to see how to display error message
			throw new Error('invalid JSON');
		}
	}
	else if (this.type == 'js')
	{
		try
		{
			this.data = new Function('args', this.text);
		}
		catch (e)
		{
			throw new Error('invalid javascript');
		}
	}
	else
	{
		this.data = this.text;
	}
};
Text.prototype.getText = function() {
	return this.codemirror.getDoc().getValue();
};
Text.prototype.setText = function(text) {
	
	this.text = text;
	this.compile();
	this.refresh();
};
Text.prototype.getData = function() {
	return this.data;
};
Text.prototype.setData = function(fn) {
	
	if (this.type == 'js')
	{
		this.data = fn;
		this.text = fn.toString();
		this.refresh();
	}
};
Text.prototype.exec = function() {
	
	this.text = this.codemirror.getDoc().getValue();
	
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
		var div = $(document.createElement('div'));
		div.attr('id', this.name);
		div.html(this.text);
		$('body').append(div);
	}
	else if (this.type == 'js')
	{
		var fn = new Function('args', this.text);
		this.data = fn;
		
		this.errorSpan.text('');
		
		//fn();
		
		try
		{
			fn();
		}
		catch (e)
		{
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
		}
	}
	else
	{
		throw new Error("'" + this.name + "' is a " + this.type + ", not an executable js/css/html object");
	}
};
Text.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.text = this.text;
	return json;
};
Text.New = function() {
	var json = {};
	json.type = '';
	json.name = UniqueName(json.type, 1);
	json.visible = true;
	json.text = '';
	return json;
};

// might want to split these into different classes, using generic functions to handle the common stuff
// Html.prototype.load = Load;

//var Javascript = function(json) {
//	
//};
//
//var Html = function(json) {
//	
//};
//
//var Css = function(json) {
//	
//};

Griddl.Components.text = Text;
Griddl.Components.js = Text;
Griddl.Components.html = Text;
Griddl.Components.css = Text;
//Griddl.Components.json = Text; // this gets merged in with Grid to form a Data component, that handles all pojo data

})();

