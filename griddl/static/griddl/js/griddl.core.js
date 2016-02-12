
//var Typeset = require('C:\\cygwin64\\home\\adam\\frce\\mysite\\griddl\\static\\griddl\\js\\lib\\typeset.js'); Typeset = Typeset.Typeset;
//var GriddlFonts = require('C:\\cygwin64\\home\\adam\\frce\\mysite\\griddl\\static\\griddl\\js\\fonts.js'); GriddlFonts = GriddlFonts.fonts;

var Griddl = (function() {

var Griddl = {};

Griddl.objs = null; // set in Main() - not a great idea to make this a var, because there are lots of local vars named 'objs'
Griddl.fonts = null; // set in fonts.js
//Griddl.fonts = GriddlFonts;

Griddl.Main = function() {
	
	var blocks = [];
	
	var lines = $('#frce').text().trim().split('\n'); // document.getElementById('frce').innerText
	
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
	
	Griddl.objs = [];
	blocks.forEach(function(block) {
		var header = block[0];
		var rest = block.slice(1);
		var type = header.split(' ')[0].substr(1);
		var obj = new Griddl.Components[type](header.split(' '), rest);
		Griddl.objs[obj.name] = obj;
		Griddl.objs.push(obj);
	});
	Griddl.objs.forEach(function(obj) { obj.add(); });
	Griddl.objs.forEach(function(obj) { if (obj.type == 'html') { obj.invokeHtml(); } }); // do this only after all components have been added
};

// who calls this?  we have to put it in the Griddl namespace, right?
var SaveToText = function() { return Griddl.objs.map(obj => obj.write()).join('\n'); };

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



// button handlers - these run the first js component
var Generate = Griddl.Generate = function() {
	
	for (var i = 0; i < Griddl.objs.length; i++)
	{
		var obj = Griddl.objs[i];
		
		if (obj.type == 'js')
		{
			obj.exec();
			return;
		}
	}
};
var ExportToPdf = Griddl.ExportToPdf = function() {
	
	var filename = document.getElementsByTagName('title')[0].innerText;
	
	Griddl.drawPdf = true;
	Griddl.Generate();
	
	var RenderPdf = function() {
		
		Griddl.drawPdf = false;
		
		var pdf = new Griddl.Pdf(Griddl.griddlCanvas); // the Canvas constructor sets Griddl.griddlCanvas whenever it is invoked
		
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



// API - these functions can be used in user code - put them in the global namespace - Get, Set, Run
// there is still a lot of legacy usage of GetData in my workbooks, but it's better to have the shorter name 'Get'
Griddl.Get = Griddl.GetData = function(name) { return FetchObj(name).getData(); };
Griddl.Set = function(name, data) { var obj = FetchObj(name); obj.setData(data); obj.refresh(); };
Griddl.Run = function(name) { FetchObj(name).exec() };
function FetchObj(name) {
	if (!name) { throw new Error('FetchObj error: invalid name'); }
	if (!Griddl.objs[name]) { throw new Error("Error: there is no object named '" + name + "'"); }
	var obj = Griddl.objs[name];
	return obj;
}

// this could remain as part of the public API, but in any case needs to be copied over to widgets so they can listen for changes
var RunOnChange = Griddl.RunOnChange = function(gridName, codeName) { Griddl.objs[gridName].div.handsontable('getInstance').addHook('afterChange', function(changes, source) { Run(codeName); }); }; // don't add hooks more than once

// these are for converting grid structures to dicts
// MakeObj([{key:'foo',val:1},{key:'bar',val:2}], 'key', 'val') => {foo:1,bar:2}
// MakeHash([{name:'foo',val:1},{name:'bar',val:2}], 'name') => {foo:{name:'foo',val:1},bar:{name:'bar',val:2}}
var MakeObj = Griddl.MakeObj = function(objs, keyField, valField) { var obj = {}; objs.forEach(function(o) { obj[o[keyField]] = ParseStringToObj(o[valField]); }); return obj; };
var MakeHash = Griddl.MakeHash = function(objs, nameField) { var obj = {}; objs.forEach(function(o) { obj[o[nameField]] = o; }); return obj; };
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

return Griddl;

})();


var get = Griddl.Get;
var set = Griddl.Set; // we can't put Set into the global namespace, because it conflicts with the built-in (mathematical) Set
var run = Griddl.Run; // so we'll use lowercase instead

if (typeof window == 'undefined') { exports.Griddl = Griddl; }

// Alt+2

