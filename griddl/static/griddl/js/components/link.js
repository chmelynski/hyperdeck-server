
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
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	
	this.url = json.url;
	
	this.data = null;
	this.display = 'text';
};
Link.prototype.add = function() {
	
	// some read-only display of the contents?  but the contents have yet to load, will need to be done in a callback
  
	var comp = this;
  
	comp.div.html('');
  
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
  
	var urlControl = gui.add(comp, 'url');
	urlControl.onChange(function(value) { comp.loadUrl(); comp.markDirty(); });
	
	//var displayOptions = ['text','json','yaml','tsv','csv','img','stats'];
	//var displayControl = gui.add(comp, 'display', displayOptions);
	//displayControl.onChange(function(value) { /* change display */ });
  
	comp.div[0].appendChild(gui.domElement);
  
	comp.addOutputElements();
};
Link.prototype.addOutputElements = function() {
	$('#output').append($('<div id="' + this.name + '"></div>'));
};
Link.prototype.afterLoad = function() {
	this.loadUrl();
};
Link.prototype.loadUrl = function() {
	
	// the url could potentially hold the name of a component to reference

	var comp = this;
	
	if (comp.url == '') { return; }
	
	var parts = comp.url.split('#');
	var url = parts[0];
	var compname = ((parts.length > 1) ? parts[1] : null);
	
	$.ajax({ url : url }).done(function(json) {
		
		var list = JSON.parse(json);
		if (list.length == 0) { throw new Error('Workbook at url "' + url + '" is empty.'); }
		
		var obj = list[0];
		
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
		
		if (obj.type == 'js' || obj.type == 'css' || obj.type == 'html' || obj.type == 'md' || obj.type == 'txt')
		{
			comp.data = obj.text;
		}
		
		if (obj.type == 'js')
		{
			$('#'+comp.name).html('<script>' + obj.text + '</script>');
		}
		else if (obj.type == 'css')
		{
			$('#'+comp.name).html('<style>' + obj.text + '</style>');
		}
		else if (obj.type == 'html' || obj.type == 'md')
		{
			$('#'+comp.name).html((obj.type == 'md') ? markdown.toHTML(obj.text) : obj.text);
			if (MathJax) { MathJax.Hub.Typeset(comp.name); }
		}
		else if (obj.type == 'data')
		{
			if (obj.params.format == 'headerList')
			{
				// this.headers: ["foo","bar"]
				// this._data: [[1,2],[3,4]]
				// => [{"foo":1,"bar":2},{"foo":3,"bar":4}]
				
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
				
				comp.data = data;
			}
			else
			{
				comp.data = obj.data;	
			}
		}
	});
};
Link.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.url = this.url;
	return json;
};

Link.prototype.get = function(options) { return this.data; };
Link.prototype.set = function(data, options) { throw new Error('"' + this.type + '" component does not support Set().'); };

Hyperdeck.Components.link = Link;
//Hyperdeck.Components.jslink = Link;
//Hyperdeck.Components.csslink = Link;
//Hyperdeck.Components.htmllink = Link;
//Hyperdeck.Components.txtlink = Link;
//Hyperdeck.Components.mdlink = Link;
//Hyperdeck.Components.datalink = Link;
//Hyperdeck.Components.binaryfilelink = Link;
//Hyperdeck.Components.imgfilelink = Link;
//Hyperdeck.Components.zipfilelink = Link;

})();

