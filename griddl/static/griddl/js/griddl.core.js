
var TheCore = (function() {

var Core = {};

// the primary purpose of Core is to deal with the objs - loading, uploading, downloading, getting, setting, etc.

Core.objs = []; // set in Main() - not a great idea to make this a var, because there are lots of local vars named 'objs'

Core.Main = function(Components, text) {
	
	if (typeof text == 'undefined')
	{
		text = $('#frce').text();
	}
	
	var json = JSON.parse(text);
	
	Core.objs = [];
	json.forEach(function(obj) {
		var component = new Components[obj.type](obj);
		Core.objs[component.name] = component;
		Core.objs.push(component);
	});
	
	if (typeof window != 'undefined')
	{
		Core.objs.forEach(function(obj) {
			obj.div = Components.CreateComponentDiv($('#cells'), obj);
			obj.div.css('border', '1px solid gray');
			obj.div.css('background-color', 'rgb(230,230,230)');
			obj.add();
		});
		
		// this should probably be replaced by a feature detection, and called something more descriptive, like postLoadingHook
		// do this only after all components have been added
		Core.objs.forEach(function(obj) { if (obj.type == 'html' || obj.type == 'css') { obj.exec(); } });
	}
	
	Components.MakeSortable();
};

Core.UploadWorkbook = function() {
	
	var fileChooser = document.createElement('input');
	fileChooser.type = 'file';
	
	fileChooser.onchange = function() {
		
		var fileReader = new FileReader();
		
		fileReader.onload = function(event)
		{
			//var x = new Uint8Array(event.target.result, 0, event.target.result.byteLength); // for readAsArrayBuffer
			
			$('#cells').children().remove();
			
			var text = event.target.result;
			
			Core.Main(Griddl.Components, text);
			
			if (Core.objs[i].type == 'document')
			{
				Core.objs[i].generate();
				return;
			}
		};
		
		if (fileChooser.files.length > 0)
		{
			var f = fileChooser.files[0];
			$('title').text(f.name.substr(0, f.name.length - 4));
			fileReader.readAsText(f); // when this is done, it will call fileReader.onload(event)
			//fileReader.readAsArrayBuffer(f); // when this is done, it will call fileReader.onload(event)
		}
	};
	
	fileChooser.click();
};
Core.DownloadWorkbook = function() {

	var filename = $('title').text();
	var text = Griddl.Core.SaveToText();
	
	var downloadLink = document.createElement('a');
	var url = (window.webkitURL != null ? window.webkitURL : window.URL);
	downloadLink.href = url.createObjectURL(new Blob([text], {type : 'text/plain'}));
	downloadLink.download = filename + '.txt';
	downloadLink.click();
};

// this is called by the DownloadWorkbook button or the Save/Save As button
var SaveToText = Core.SaveToText = function() { return JSON.stringify(Core.objs.map(obj => obj.write())); };

// API - these functions can be used in user code - put them in the global namespace - get, set, run
// there is still a lot of legacy usage of GetData in my workbooks, but it's better to have the shorter name 'get'
Core.Get = Core.GetData = function(name) { return FetchObj(name).getData(); };
Core.Set = Core.SetData = function(name, data) { var obj = FetchObj(name); obj.setData(data); obj.refresh(); };
Core.Run = function(name) { FetchObj(name).exec() };
function FetchObj(name) {
	if (!name) { throw new Error('FetchObj error: invalid name'); }
	if (!Core.objs[name]) { throw new Error("Error: there is no object named '" + name + "'"); }
	var obj = Core.objs[name];
	return obj;
}

// this could remain as part of the public API, but in any case needs to be copied over to widgets so they can listen for changes
var RunOnChange = Core.RunOnChange = function(gridName, codeName) { Core.objs[gridName].div.handsontable('getInstance').addHook('afterChange', function(changes, source) { Run(codeName); }); }; // don't add hooks more than once

// these are for converting grid structures to dicts
// MakeObj([{key:'foo',val:1},{key:'bar',val:2}], 'key', 'val') => {foo:1,bar:2}
// MakeHash([{name:'foo',val:1},{name:'bar',val:2}], 'name') => {foo:{name:'foo',val:1},bar:{name:'bar',val:2}}
var MakeObj = Core.MakeObj = function(objs, keyField, valField) { var obj = {}; objs.forEach(function(o) { obj[o[keyField]] = ParseStringToObj(o[valField]); }); return obj; };
var MakeHash = Core.MakeHash = function(objs, nameField) { var obj = {}; objs.forEach(function(o) { obj[o[nameField]] = o; }); return obj; };
var ParseStringToObj = function(str) {
	
	var val = null;
	
	var c = str[0];
	
	// could be replaced by a regex
	if (c == '0' || c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9' || c == '.' || c == '-' || c == '+')
	{
		val = parseFloat(str);
	}
	else
	{
		val = str;
	}
	
	return val;
};

return Core;

})();


// we use lowercase so that "set" does not conflict with the built-in (mathematical) "Set"
var get = TheCore.Get;
var set = TheCore.Set;
var run = TheCore.Run; 

if (typeof window !== 'undefined') {
	CanvasRenderingContext2D.prototype.drawLine = function(x1, y1, x2, y2) {
		this.beginPath();
		this.moveTo(x1, y1);
		this.lineTo(x2, y2);
		this.stroke();
	};
	CanvasRenderingContext2D.prototype.fillCircle = function(x, y, r) {
		this.beginPath();
		this.arc(x, y, r, 0, Math.PI * 2, true);
		this.fill();
	};
	CanvasRenderingContext2D.prototype.strokeCircle = function(x, y, r) {
		this.beginPath();
		this.arc(x, y, r, 0, Math.PI * 2, true);
		this.stroke();
	};
	Array.prototype.sortBy = function(key) {
		this.sort(function(a, b) {
			if (a[key] > b[key]) { return 1; }
			if (a[key] < b[key]) { return -1; }
			return 0;
		});
	};
}

if (typeof window !== 'undefined') {
	if (typeof Griddl === 'undefined') { var Griddl = {}; }
	Griddl.Core = TheCore;
}
else {
	exports.Core = TheCore;
}
