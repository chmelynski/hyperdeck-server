
(function() {

var Link = function(json, type, name) {
	
	if (!json)
	{
		json = {};
		json.type = type;
		json.name = name;
		json.visible = true;
		json.url = '';
	}
	
	this._type = json.type;
	this._name = json.name;
	this._visible = json.visible;
	
	this._div = null;
	
	this._url = json.url;
	
	Object.defineProperty(this, 'url', {
		get : function() { return this._url; },
		set : function (value) { this._url = value; }
	});
	
	this._data = null;
	this._display = 'text';
};
Link.prototype._add = function() {
	
	// some read-only display of the contents?  but the contents have yet to load, will need to be done in a callback
  
	var comp = this;
  
	comp._div.html('');
  
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
  
	var urlControl = gui.add(comp, 'url');
	urlControl.onFinishChange(function(value) { comp._loadUrl(); comp._markDirty(); });
	
	//var displayOptions = ['text','json','yaml','tsv','csv','img','stats'];
	//var displayControl = gui.add(comp, 'display', displayOptions);
	//displayControl.onChange(function(value) { /* change display */ });
  
	comp._div[0].appendChild(gui.domElement);
  
	comp._addOutputElements();
};
Link.prototype._addOutputElements = function() {
	
	var comp = this;
	
	$('#output').append($('<div id="' + comp._name + '"></div>'));
};
Link.prototype._afterLoad = function() {
	
	var comp = this;
	
	comp._loadUrl();
};
Link.prototype._loadUrl = function() {
	
	var comp = this;
	
	if (comp._url == '') { return; }
	
	var parts = comp._url.split('#');
	var url = parts[0];
	var compname = ((parts.length > 1) ? parts[1] : null);
	
	$.ajax({ url : url }).done(function(json) {
		
		var list = JSON.parse(json).components;
		if (list.length == 0) { throw new Error('Workbook at url "' + url + '" is empty.'); }
		
		var obj = null;
		
		if (compname !== null)
		{
			for (var i = 0; i < list.length; i++)
			{
				if (list[i].name == compname)
				{
					obj = list[i];
					break;
				}
			}
		}
		else
		{
			obj = list[0];
		}
		
		if (obj === null) { throw new Error('Workbook at url "' + url + '" does not contain component "' + compname + '".'); }
		
		if (obj.type == 'js' || obj.type == 'css' || obj.type == 'html' || obj.type == 'md' || obj.type == 'txt')
		{
			comp._data = obj.text;
		}
		
		if (obj.type == 'js')
		{
			$('#'+comp._name).html('<script>' + obj.text + '</script>');
		}
		else if (obj.type == 'css')
		{
			$('#'+comp._name).html('<style>' + obj.text + '</style>');
		}
		else if (obj.type == 'html' || obj.type == 'md')
		{
			$('#'+comp._name).html((obj.type == 'md') ? markdown.toHTML(obj.text) : obj.text);
			if (MathJax) { MathJax.Hub.Typeset(comp._name); }
		}
		else if (obj.type == 'data')
		{
			if (obj.params.format == 'headerList')
			{
				var data = [];
				
				for (var i = 0; i < obj.data.length; i++)
				{
					var dataobj = {};
					
					for (var k = 0; k < obj.params.headers.length; k++)
					{
						dataobj[obj.params.headers[k]] = obj.data[i][k];
					}
					
					data.push(dataobj);
				}
				
				comp._data = data;
			}
			else
			{
				comp._data = obj.data;
			}
		}
	});
};
Link.prototype._write = function() {
	
	var comp = this;
	
	var json = {};
	json.type = comp._type;
	json.name = comp._name;
	json.visible = comp._visible;
	json.url = comp._url;
	return json;
};

Link.prototype._get = function(options) { var comp = this; return comp._data; };
Link.prototype._set = function(data, options) { throw new Error('The "link" component does not support Set().'); };

Hyperdeck.Components.link = Link;

})();

