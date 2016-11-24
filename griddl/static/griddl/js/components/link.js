
(function() {

var Link = function(json, type, name) {
	
	if (!json)
	{
		json = {};
		json.type = type;
		json.name = name;
		json.visible = true;
		json.urls = [''];
	}
	
	this._type = json.type;
	this._name = json.name;
	this._visible = json.visible;
	
	this._div = null;
	this._displayDiv = null;
	
	this._urls = (json.urls ? json.urls : (json.url ? [json.url] : []));
	this._display = 'text';
	
	this._datatype = null; // html,md,css,js
	this._data = null; // the data loaded from the external workbook
	
	this._sentinel = null;
};
Link.prototype._add = function() {
	
	var comp = this;
	comp._addOutputElements();
};
Link.prototype._addOutputElements = function() {
	
	var comp = this;
	comp._outputDiv = $('<div id="' + comp._name + '"></div>').appendTo($('#output'));
};
Link.prototype._afterLoad = function(callback) {
	
	var comp = this;
	
	var numberToLoad = comp._urls.length;
	var numberLoaded = 0;
	
	comp._sentinel = new LinkedList();
	
	var rows = $('<div></div>').appendTo(comp._div);
	comp._displayDiv = $('<div></div>').appendTo(comp._div);
	
	function AppendRow(url) {
		
		comp._markDirty();
		
		var listElement = comp._sentinel._add(url);
		
		var row = $('<div style="margin:0.2em"></div>').appendTo(rows);
		
		//$('<button class="btn btn-default btn-sm"><i class="fa fa-lg fa-trash-o"></i></button>').appendTo(row).on('click', function()
		//{
		//	comp._markDirty();
		//	listElement._remove();
		//	row.remove();
		//});
		
		$('<input class="input-sm" style="width:80%;margin:0.2em" value="'+url+'"></input>').appendTo(row).on('change', function() {
			comp._markDirty();
			icon.removeClass('fa-check').removeClass('fa-times').addClass('fa-hourglass').css('color', 'orange');
			//script.attr('src', url); // this triggers on load
			listElement._data = this.value;
			LoadLink(this.value);
		});
		
		var icon = $('<span class="fa fa-hourglass" style="color:orange"></span>').appendTo(row);
		
		function LoadLink(url) {
			
			// valid url formats:
			// https://sandbox.hyperdeck.io/raw/f/2/foo
			// https://sandbox.hyperdeck.io/raw/f/2/foo#bar
			// /f/2/foo
			// /f/2/foo#bar
			
			comp._displayDiv.html('');
			
			if (url.length == 0)
			{
				numberLoaded++;
				if (numberLoaded == numberToLoad) { numberToLoad = 0; callback(comp); }
				return;
			}
			
			var parts = url.split('#');
			var url = parts[0];
			var compname = ((parts.length > 1) ? parts[1] : null);
			if (url[0] == '/') { url = 'https://sandbox.hyperdeck.io/raw' + url; }
			
			$.ajax({ url : url }).done(function(json) {
				
				try
				{
					var list = JSON.parse(json).components;
					if (list.length == 0) { throw new Error('Workbook at url "' + url + '" is empty.'); }
					
					var obj = null;
					
					// take the #named component, otherwise just take the first component
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
					
					var type = obj.type;
					comp._datatype = type;
					
					if (type == 'js' || type == 'css' || type == 'html' || type == 'md' || type == 'txt')
					{
						comp._data = obj.text;
						comp._displayDiv.html('<pre>' + type + ' : ' + obj.text.length + ' chars</pre>');
					}
					else if (type == 'data')
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
							
							var ls = [];
							ls.push('<pre>');
							ls.push('headers: ' + obj.params.headers.join(', '));
							ls.push('length: ' + comp._data.length);
							ls.push('</pre>');
							comp._displayDiv.html(ls.join('\n'));
						}
						else
						{
							comp._data = obj.data;
						}
					}
					else if (type == 'image' || type == 'binary')
					{
						comp._data = obj.data;
						comp._displayDiv.html('<pre>data URI of type "' + type + '" : ' + comp._data.length + ' chars</pre>');
					}
					else
					{
						throw new Error('Link does not support components of type "' + type + '"');
					}
					
					icon.removeClass('fa-hourglass').addClass('fa-check').css('color', 'green');
				}
				catch (e)
				{
					icon.removeClass('fa-hourglass').addClass('fa-times').css('color', 'red');
					console.log(e);
				}
			}).fail(function(jqXHR, textStatus, errorThrown) {
				icon.removeClass('fa-hourglass').addClass('fa-times').css('color', 'red');
			}).always(function() {
				numberLoaded++;
				if (numberLoaded == numberToLoad) { numberToLoad = 0; callback(comp); }
			});
		}
		
		LoadLink(url);
	}
	
	comp._urls.forEach(function(url) { AppendRow(url); });
	
	// for now, let's keep it to one url.  how do we hold, display, and access the data of multiple urls?
	//var plusButtonDiv = $('<div style="margin:0.2em"></div>').appendTo(comp._div);
	//$('<button class="btn btn-default btn-sm"><i class="fa fa-plus"></i></button>').appendTo(plusButtonDiv).on('click', function() { AppendRow(''); });
};
Link.prototype._afterAllLoaded = function() {
	var comp = this;
	comp._exec();
};
Link.prototype._exec = function() {
	
	var comp = this;
	
	// this is a simplified duplicate of Code.exec()
	if (comp._datatype == 'js')
	{
		$('#'+comp._name).html('<script>' + comp._data + '</script>');
	}
	else if (comp._datatype == 'css')
	{
		$('#'+comp._name).html('<style>' + comp._data + '</style>');
	}
	else if (comp._datatype == 'html' || comp._datatype == 'md')
	{
		$('#'+comp._name).html((comp._datatype == 'md') ? markdown.toHTML(comp._data) : comp._data);
		if (MathJax) { MathJax.Hub.Typeset(comp._name); }
	}
};
Link.prototype._write = function() {
	
	var comp = this;
	
	var json = {};
	json.type = comp._type;
	json.name = comp._name;
	json.visible = comp._visible;
	json.urls = comp._sentinel._enumerate();
	return json;
};

Link.prototype._get = function(options) { if (options) { console.log('Warning: the "link" component does not support Get options.'); } var comp = this; return comp._data; };
Link.prototype._set = function(data, options) { throw new Error('The "link" component does not support Set.'); };

var LinkedList = function() {
	this._data = null;
	this._prev = this;
	this._next = this;
};
LinkedList.prototype._add = function(data) {
	
	// this must be called on the sentinel
	
	var elt = new LinkedList();
	elt._data = data;
	elt._next = this;
	elt._prev = this._prev;
	
	if (this._next === this) { this._next = elt; } else { this._prev._next = elt; }
	this._prev = elt;
	
	return elt;
};
LinkedList.prototype._remove = function() {
	
	// this cannot be called on the sentinel
	this._prev._next = this._next;
	this._next._prev = this._prev;
};
LinkedList.prototype._enumerate = function() {
	
	// this must be called on the sentinel
	
	var list = [];
	var elt = this._next;
	
	while (elt !== this)
	{
		list.push(elt._data);
		elt = elt._next;
	}
	
	return list;
};

Hyperdeck.Components.link = Link;

})();

