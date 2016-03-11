
var TheCore = (function() {

var Core = {};

// the primary purpose of Core is to deal with the objs - loading, uploading, downloading, getting, setting, etc.

Core.objs = []; // set in Main() - not a great idea to make this a var, because there are lots of local vars named 'objs'

Core.Main = function(Components, text) {
	
	var blocks = [];
	
	if (typeof text == 'undefined')
	{
		text = $('#frce').text(); // document.getElementById('frce').innerText
	}
	
	var lines = text.trim().split('\n');
	
	var block = [];
	lines.forEach(function(line) {
		
		if (line.trim() == '')
		{
			
		}
		else if (line == '@end')
		{
			blocks.push(block); // note that we don't include the '@end' line
			block = [];
		}
		else // the start lines just go here by default, meaning that we only need to scrub @end as a keyword
		{
			block.push(line);
		}
	});
	
	Core.objs = [];
	blocks.forEach(function(block) {
		var header = block[0];
		var rest = block.slice(1);
		var type = header.split(' ')[0].substr(1);
		var obj = new Components[type](header.split(' '), rest);
		Core.objs[obj.name] = obj;
		Core.objs.push(obj);
	});
	
	if (typeof window != 'undefined')
	{
		Core.objs.forEach(function(obj) { obj.add(); });
		Core.objs.forEach(function(obj) { if (obj.type == 'html') { obj.invokeHtml(); } }); // do this only after all components have been added
	}
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
			
			if (Core.objs['document'])
			{
				Griddl.Widgets.GenerateDocument(Core, Griddl.Canvas, JSON.parse(Core.GetData('document')));
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
var SaveToText = Core.SaveToText = function() { return Core.objs.map(obj => obj.write()).join('\n'); };

// button handlers - these generate the document if a 'document' component is defined, or otherwise run the first js component
var Generate = Core.Generate = function() {
	
	if (Core.objs['document']) // magic word
	{
		Griddl.Widgets.GenerateDocument(Core, Griddl.Canvas, JSON.parse(Core.GetData('document')));
	}
	else
	{
		for (var i = 0; i < Core.objs.length; i++)
		{
			var obj = Core.objs[i];
			
			if (obj.type == 'js')
			{
				obj.exec();
				return;
			}
		}
	}
};
Core.ExportToPdf = function() {
	
	var filename = document.getElementsByTagName('title')[0].innerText;
	
	Griddl.Canvas.drawPdf = true;
	Generate();
	
	var RenderPdf = function() {
		
		Griddl.Canvas.drawPdf = false;
		
		var pdf = new Griddl.Pdf(Griddl.Canvas.griddlCanvas); // the Canvas constructor sets Griddl.griddlCanvas whenever it is invoked
		
		var downloadLink = document.createElement('a');
		var url = window.URL;
		downloadLink.href = url.createObjectURL(new Blob([pdf.text], {type : 'text/pdf'}));
		downloadLink.download = filename + '.pdf';
		document.body.appendChild(downloadLink); // needed for this to work in firefox
		downloadLink.click();
		document.body.removeChild(downloadLink); // cleans up the addition above
	};
	
	if (window.MathJax) { MathJax.Hub.Queue(RenderPdf); } else { RenderPdf(); }
};

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

// we could permit the objects to be named, rather than numbered
// 	a	b	c
// foo	0	1	2
// bar	3	4	5
// baz	6	7	8
// =>
// {foo:{a:0,b:1,c:2},bar:{a:3,b:4,c:5},baz:{a:6,b:7,c:8}}


//'	a	b	c\n
//0	10	20	30\n
//1	40	50	60\n
//2	70	80	90'
// => TsvToMatrix =>
// [[ '' , 'a' , 'b' , 'c' ]
// [ '0' , '10' , '20' , '30' ]
// [ '1' , '40' , '50' , '60' ]
// [ '2' , '70' , '80' , '90' ]]
// => MatrixToObjs =>
// [{a:10,b:20,c:30},{a:40,b:50,c:60},{a:70,b:80,c:90}]
// => ObjsToJoinedLines =>
//'	a	b	c\n
//0	10	20	30\n
//1	40	50	60\n
//2	70	80	90'

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

//if (typeof window == 'undefined') { exports.Griddl = Griddl; }

if (typeof window !== 'undefined') {
	if (typeof Griddl === 'undefined') { var Griddl = {}; }
	Griddl.Core = TheCore;
}
else {
	exports.Core = TheCore;
}

// Alt+2

