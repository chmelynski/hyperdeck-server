
(function() {

// note that removing a url or file does not actually remove the element from this.data.urls or this.data.files, it just sets the element to the empty string
// therefore subsequent additions of urls or files will have indices assigned inclusive of "deleted" list elements
// this is pretty unavoidable, because the script tags have id's corresponding to their index, and we don't want to go around changing id's when a lower-indexed element is deleted
// we remove empty list entries before write so that everything is cleaned up for the next load

var Libraries = function(json) {
	
	// maybe check to see if there's a Libraries already in Griddl.Components.objs - if so, throw an alert or something - no need for duplicate Libraries
	
	if (!json)
	{
		json = {};
		json.type = 'libraries';
		json.name = Griddl.Components.UniqueName('libraries', 1);
		json.visible = true;
		json.data = {};
		json.data.curated = {};
		json.data.curated.mathjax = false;
		json.data.curated.threejs = false;
		json.data.curated.d3 = false;
		json.data.curated.chartjs = false;
		json.data.curated.numeric = false;
		json.data.urls = [];
		json.data.files = {};
	}
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	
	this.data = json.data;
	
	this.urlFolder = null;
	this.fileFolder = null;
	
	this.urlmap = {};
	this.urlmap.mathjax = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.6.1/mathjax.js?config=TeX-AMS_SVG.js';
	this.urlmap.threejs = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r77/three.min.js';
	this.urlmap.d3 = 'https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js';
	this.urlmap.chartjs = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.1.4/Chart.min.js';
	this.urlmap.numeric = 'https://cdnjs.cloudflare.com/ajax/libs/numeric/1.2.6/numeric.min.js';
};
Libraries.prototype.add = function() {
	
	var comp = this;
	
	this.div.html('');
	
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
	
	var curated = gui.addFolder('curated');
	for (var key in this.data.curated)
	{
		var control = curated.add(this.data.curated, key);
		
		control.onFinishChange(function(value) {
			
			if (value)
			{
				$('body').append($('<script id="' + this.property + '" src="' + comp.urlmap[this.property] + '"></script>'));
			}
			else
			{
				$('#' + this.property).remove();
			}
		});
	}
	
	// custom urls can be deleted just by deleting the string - maybe remove the control automatically on blur?
	this.urlFolder = gui.addFolder('urls');
	this.urlFolder.add(this, 'addUrl');
	for (var i = 0; i < this.data.urls.length; i++)
	{
		var control = this.urlFolder.add(this.data.urls, i);
		
		control.onFinishChange(function(value) {
			
			$('#url' + this.property).remove();
			
			if (value)
			{
				$('body').append($('<script id="url' + this.property + '" src="' + comp.data.urls[this.property] + '"></script>'));
			}
			else
			{
				this.remove();
			}
		});
	}
	
	// we could delete if string is deleted or i guess we need a delete button for these - so we need one folder per file and a delete button on each
	this.fileFolder = gui.addFolder('files');
	this.fileFolder.add(this, 'addFile');
	for (var key in this.data.files)
	{
		this.doAddFile(this.data.files[key], key);
	}
	
	this.div[0].appendChild(gui.domElement);
};
Libraries.prototype.addUrl = function() {
	
	var comp = this;
	
	this.data.urls.push('');
	var control = this.urlFolder.add(this.data.urls, this.data.urls.length - 1);
	
	control.onFinishChange(function(value) {
		
		$('#url' + this.property).remove();
		
		if (value)
		{
			$('body').append($('<script id="url' + this.property + '" src="' + comp.data.urls[this.property] + '"></script>'));
		}
		else
		{
			this.remove();
		}
	});
};
Libraries.prototype.addFile = function() {
	
	var comp = this;
	
	var filename = null;
	
	var fileChooser = $(document.createElement('input'));
	fileChooser.attr('type', 'file');
	
	fileChooser.on('change', function() {
		
		var fileReader = new FileReader();
		
		fileReader.onload = function(event)
		{
			var text = event.target.result;
			var id = Griddl.Components.UniqueElementId();
			comp.doAddFile(text, filename, id);
			$('body').append($('<script id="' + id + '"></script>').text(text)); // jQuery encodes the text
		};
		
		if (fileChooser[0].files.length > 0)
		{
			var f = fileChooser[0].files[0];
			filename = f.name; // scrub filename of non-alphanum characters?
			fileReader.readAsText(f);
		}
	});
	
	fileChooser.click();
};
Libraries.prototype.afterLoad = function() {
	
	// we need to remember the ids somehow so as to remove them properly
	// although honestly, removing the script tag doesn't actually do anything.  the names stay in the namespace
	
	for (var key in this.data.curated)
	{
		if (this.data.curated[key])
		{
			var id = Griddl.Components.UniqueElementId();
			$('body').append($('<script id="' + id + '" src="' + this.urlmap[key] + '"></script>'));
		}
	}
	
	for (var i = 0; i < this.data.urls.length; i++)
	{
		var id = Griddl.Components.UniqueElementId();
		$('body').append($('<script id="' + id + '" src="' + this.data.urls[i] + '"></script>'));
	}
	
	for (var key in this.data.files)
	{
		var id = Griddl.Components.UniqueElementId();
		$('body').append($('<script id="' + id + '"></script>').text(this.data.files[key])); // jQuery encodes the text
	}
};
Libraries.prototype.write = function() {
	
	this.data.urls = this.data.urls.filter(x => x.length > 0);
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.data = this.data;
	return json;
};

Libraries.prototype.doAddFile = function(text, filename, id) {
	
	var comp = this;
	
	this.data.files[filename] = text;
	
	var folder = this.fileFolder.addFolder(filename);
	
	var fnobj = {};
	fnobj.download = function() { 
		var a = document.createElement('a');
		a.href = window.URL.createObjectURL(new Blob([text], {type : 'text/plain'}));
		a.download = filename;
		a.click();
	};
	fnobj.delete = function() {
		delete comp.data.files[filename];
		$('#' + id).remove();
		
		comp.add(); // this destroys id info which was generated when the script tag was created and is stored here as a closure
		
		//folder.remove(); // this doesn't work - we could investigate how to remove a dat.gui folder
		
		// but for now, just remove the buttons
		//this.downloadButton.remove();
		//this.deleteButton.remove();
	};
	
	fnobj.downloadButton = folder.add(fnobj, 'download');
	fnobj.deleteButton = folder.add(fnobj, 'delete');
};

Griddl.Components.libraries = Libraries;

})();

