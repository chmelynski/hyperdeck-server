
(function() {

var Libraries = function(json, type, name) {
	
	if (!json)
	{
		json = {};
		json.type = type;
		json.name = name;
		json.visible = true;
		json.data = {};
		json.data.urls = [''];
		//json.data.files = []; // { filename : string , text : string }
	}
	
	this._type = json.type;
	this._name = json.name;
	this._visible = json.visible;
	
	this._div = null;
	this._outputDiv = null;
	
	this._data = json.data;
	
	this._sentinel = null;
	
	// https://cdnjs.cloudflare.com/ajax/libs/three.js/r77/three.min.js
	// https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js
	// https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.1.4/Chart.min.js
	// https://cdnjs.cloudflare.com/ajax/libs/numeric/1.2.6/numeric.min.js
};
Libraries.prototype._add = function() { };
Libraries.prototype._afterLoad = function(callback) {
	
	var comp = this;
	
	comp._outputDiv = $('<div id="' + comp._name + '"></div>').appendTo($('#output'));
	
	var numberToLoad = comp._data.urls.length;
	var numberLoaded = 0;
	
	// it is difficult to keep the url, script, icon, and row all together
	// we've managed to do it purely with closures, but we needed to implement a sentinel-based doubly-linked list to hold the urls
	// the key thing is the ability to call LinkedList.remove() - javascript arrays require an index, and tracking the index through deletions is too hard
	comp._sentinel = new LinkedList();
	
	var rows = $('<div></div>').appendTo(comp._div);
	
	function AppendRow(url) {
		
		comp._markDirty();
		
		var listElement = comp._sentinel._add(url);
		
		var row = $('<div style="margin:0.2em"></div>').appendTo(rows);
		
		$('<button class="btn btn-default btn-sm"><i class="fa fa-lg fa-trash-o"></i></button>').appendTo(row).on('click', function() {
			comp._markDirty();
			listElement._remove();
			row.remove();
		});
		
		$('<input class="input-sm" style="width:80%;margin:0.2em" value="'+url+'"></input>').appendTo(row).on('change', function() {
			comp._markDirty();
			icon.removeClass('fa-check').removeClass('fa-times').addClass('fa-hourglass').css('color', 'orange');
			//script.attr('src', url); // this triggers on load
			listElement._data = this.value;
			LoadScript(this.value);
		});
		
		var icon = $('<span class="fa fa-hourglass" style="color:orange"></span>').appendTo(row);
		
		function LoadScript(url) {
			
			if (url.length == 0)
			{
				numberLoaded++;
				if (numberLoaded == numberToLoad) { numberToLoad = 0; callback(comp); }
				return;
			}
			
			$.getScript(url).done(function(script, textStatus) {
				icon.removeClass('fa-hourglass').addClass('fa-check').css('color', 'green');
			}).fail(function(jqxhr, settings, exception) {
				icon.removeClass('fa-hourglass').addClass('fa-times').css('color', 'red');
				console.log('Error: "' + url + '" failed to load');
			}).always(function() {
				numberLoaded++;
				if (numberLoaded == numberToLoad) { numberToLoad = 0; callback(comp); }
			});
		}
		
		LoadScript(url);
	}
	
	comp._data.urls.forEach(function(url) { AppendRow(url); });
	
	var plusButtonDiv = $('<div style="margin:0.2em"></div>').appendTo(comp._div);
	$('<button class="btn btn-default btn-sm"><i class="fa fa-plus"></i></button>')
		.appendTo(plusButtonDiv).on('click', function() { AppendRow(''); });
	
	//for (var key in comp._data.files) { comp._doAddFile(comp._data.files[key], key); }
	//for (var key in comp._data.files) { comp._outputDiv.append($('<script></script>').text(comp._data.files[key])); }
};
Libraries.prototype._write = function() {
	
	var comp = this;
	
	var json = {};
	json.type = comp._type;
	json.name = comp._name;
	json.visible = comp._visible;
	json.data = {};
	json.data.urls = comp._sentinel._enumerate();
	return json;
};

// this stuff to be put on ice until urls work
Libraries.prototype._addFile = function() {
	
	var comp = this;
	
	var filename = null;
	
	var fileChooser = $('<input type="file"><input>').on('change', function() {
		
		var fileReader = new FileReader();
		
		fileReader.onload = function(event)
		{
			var text = event.target.result;
			//var id = Hyperdeck.Components.UniqueElementId();
			//comp._doAddFile(text, filename, id);
			comp._outputDiv.append($('<script></script>').text(text));
		};
		
		if (this.files.length > 0)
		{
			var f = this.files[0];
			filename = f.name; // scrub filename of non-alphanum characters?
			fileReader.readAsText(f);
		}
	}).click();
};
Libraries.prototype._doAddFile = function(text, filename, id) {
	
	var comp = this;
	
	comp._data.files[filename] = text;
	
	var folder = comp._fileFolder.addFolder(filename);
	
	var fnobj = {};
	fnobj.download = function() { 
		var a = document.createElement('a');
		a.href = window.URL.createObjectURL(new Blob([text], {type : 'text/plain'}));
		a.download = filename;
		a.click();
	};
	fnobj.delete = function() {
		delete comp._data.files[filename];
		$('#' + id).remove();
		
		comp._add(); // this destroys id info which was generated when the script tag was created and is stored here as a closure
		// but for now, just remove the buttons
		//this.downloadButton.remove();
		//this.deleteButton.remove();
	};
	
	fnobj.downloadButton = folder.add(fnobj, 'download');
	fnobj.deleteButton = folder.add(fnobj, 'delete');
};

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

Hyperdeck.Components.libraries = Libraries;

})();

