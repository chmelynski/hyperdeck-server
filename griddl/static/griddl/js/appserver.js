
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser());

app.use(express.static('C:\\users\\adam\\desktop\\chmelynski.github.io-master'));
var desktop = 'c:\\users\\adam\\desktop\\';
app.use(express.static(desktop));

app.get('*', function(req, res) {
	
	var parsedUrl = ParseUrl(req.url);
	var action = parsedUrl.pathname;
	var filename = parsedUrl.query.file;
	
	if (action == 'directory')
	{
		res.send(Filesystem(desktop + filename));
	}
	else if (action == 'directoryTree')
	{
		res.send(Filetree(desktop + filename));
	}
	else if (action == 'grid')
	{
		res.send(Grid(filename));
	}
	else if (action == 'text')
	{
		res.send(Text(filename));
	}
	else if (action == 'img')
	{
		res.send(Img(filename));
	}
	else
	{
		res.send(SaveFormTest());
		//res.send(req._parsedUrl);
	}
	
	//res.send(req.url);
	//res.send(req._parsedUrl);
	//res.send(RequestInspector(req));
});
app.post('/save', function(req, res) {
	//console.log(req.body); // req.body = { inputName : inputValue , inputName : inputValue }
	fs.writeFileSync(desktop + req.body.filename, req.body.data);
	res.send('saved');
});
//var server = app.listen(3000, function () { console.log('Example app listening at http://localhost:%s/', server.address().port); });

function ParseUrl(url) {
	
	// ParseUrl("/foo?bar=baz&abc=def") => { pathname : "foo" , query : { bar : "baz" , abc : "def" } }
	
	var questionMarkIndex = url.indexOf('?');
	var parsedUrl = {};
	
	if (questionMarkIndex == -1)
	{
		parsedUrl.pathname = url.substring(1);
	}
	else
	{
		parsedUrl.pathname = url.substring(1, questionMarkIndex);
	}
	
	var rest = url.substr(questionMarkIndex+1);
	
	var keyvals = rest.split('&');
	
	parsedUrl.query = {};
	
	for (var i = 0; i < keyvals.length; i++)
	{
		var parts = keyvals[i].split('=');
		parsedUrl.query[parts[0]] = parts[1];
	}
	
	return parsedUrl;
}

function RequestInspector(req) {
	
	var ls = ['<html>','<head>','</head>','<body>'];
	
	ls.push('<table>');
	
	for (var key in req)
	{
		var val = req[key];
		var type = typeof(val);
		var str = null;
		
		if (type == 'object')
		{
			if (val == null)
			{
				str = 'null';
			}
			else
			{
				str = '{}';
			}
		}
		else if (type == 'undefined' || type == 'function')
		{
			str = type;
		}
		else
		{
			str = val.toString();
		}
		
		ls.push('<tr><td>' + key + '</td><td>' + str + '</td></tr>');
	}
	
	ls.push('</table>');
	
	ls.push('</body>');
	ls.push('</html>');
	
	return ls.join('\n');
}

function SaveFormTest() {
	var ls = [];
	ls.push('<html>');
	ls.push('<body>');
	ls.push('<form id="saveForm" action="/save" method="post" target="_blank">');
	ls.push('<input id="saveFileInput" type="hidden" name="file"></input>');
	ls.push('<input type="submit" value="save"></input>');
	ls.push('</form>');
	ls.push('<script>');
	ls.push('document.getElementById("saveForm").onsubmit = function() { document.getElementById("saveFileInput").value = "savedata"; };');
	ls.push('</script>');
	ls.push('</body>');
	ls.push('</html>');
	return ls.join('\n');
}
function SaveForm(filename) {
	var ls = [];
	ls.push('<form id="saveForm" action="/save" method="post" target="_blank">');
	ls.push('<input id="saveFileInput" type="hidden" name="data"></input>');
	ls.push('<input type="hidden" name="filename" value="' + filename + '"></input>');
	ls.push('<input type="submit" value="save"></input>');
	ls.push('</form>');
	ls.push('<script>');
	ls.push('document.getElementById("saveForm").onsubmit = function() { document.getElementById("saveFileInput").value = Save(); };');
	ls.push('</script>');
	return ls.join('\n');
}

function Filesystem(path) {
	
	// we want to send files only for directory urls
	// we should also allow file urls here, and in that case do something useful to open the file
	
	// https://nodejs.org/api/buffer.html
	// https://nodejs.org/api/fs.html
	
	// replace these with <img src=""></img>
	var buttonContents = {};
	buttonContents.directory = 'Directory';
	buttonContents.directoryTree = 'DirectoryTree';
	buttonContents.text = 'Text';
	buttonContents.img = 'Img';
	
	// we're very confused with where desktop needs to be added
	var files = fs.readdirSync(desktop + path);
	
	var ls = [];
	ls.push('<html>');
	ls.push('<head>');
	ls.push('<title>' + path + '</title>');
	ls.push('</head>');
	ls.push('<body>');
	ls.push('<table>');
	
	var rows = [];
	
	files.forEach(function(filename) {
		
		var stats = fs.statSync(path + '\\' + filename);
		
		var type = null;
		
		if (stats.isDirectory())
		{
			type = 'directory';
		}
		else
		{
			var dot = filename.lastIndexOf('.');
			
			if (dot == -1)
			{
				type = '';
			}
			else
			{
				type = filename.substr(dot + 1);
			}
		}
		
		var row = {};
		row.type = type;
		row.filename = filename;
		row.html = null;
		
		var line = '';
		line += '<tr>';
		line += '<td>' + filename + '</td>';
		
		var sanitized = path + '\\' + filename; // Sanitize()
		
		// actually we want to organize this tree by action, rather than by filetype
		
		if (type == 'directory')
		{
			//line = '<tr><td><a href="' + x + '">' + x + '</a></td></tr>';
			
			var url = 'http://localhost:3000/directory?file=' + sanitized;
			line += '<td><a href="' + url + '">' + buttonContents.directory + '</a></td>';
			var url2 = 'http://localhost:3000/directoryTree?file=' + sanitized;
			line += '<td><a href="' + url2 + '">' + buttonContents.directoryTree + '</a></td>';
		}
		else if (type == 'txt' || type == 'js' || type == 'css' || type == 'bat' || type == 'htm' || type == 'geojson' || type == 'json')
		{
			var url = 'http://localhost:3000/text?file=' + sanitized;
			line += '<td><a href="' + url + '">' + buttonContents.text + '</a></td>'; // img src should be b64
		}
		else if (type == 'tsv')
		{
			//var url1 = 'http://localhost:3000/handsontable?file=' + sanitized;
			//line += '<td><a href="' + url1 + '"><img src=""></img></a></td>';
			//
			//var url2 = 'http://localhost:3000/pre?file=' + sanitized;
			//line = '<td><a href="' + url2 + '"><img src=""></img></a></td>';
		}
		else if (type == 'png' || type == 'jpg')
		{
			var url = 'http://localhost:3000/img?file=' + sanitized;
			line += '<td><a href="' + url + '">' + buttonContents.img + '</a></td>';
		}
		else if (type == 'svg')
		{
			
		}
		else if (type == 'htm' || type == 'html')
		{
			
		}
		else if (type == 'link')
		{
			// the entire text is just a URL
		}
		else if (type == 'pdf')
		{
			
		}
		else if (type == 'ttf' || type == 'otf')
		{
			
		}
		else if (type == 'wav')
		{
			
		}
		else if (type == 'mid')
		{
			
		}
		else if (type == 'mp3')
		{
			
		}
		else if (type == 'mp4')
		{
			
		}
		else if (type == 'duf' || type == 'dsf')
		{
			
		}
		else if (type == 'obj')
		{
			
		}
		else if (type == 'json')
		{
			
		}
		else if (type == 'tree')
		{
			
		}
		else if (type == '')
		{
			// hexdump?  text?
		}
		else
		{
			
		}
		
		line += '</tr>';
		
		row.html = line;
		rows.push(row);
	});
	
	rows.sort(function(a, b) { return (a.type < b.type) ? -1 : 1; });
	ls.push(rows.map(x => x.html).join('\n'));
	
	ls.push('</table>');
	ls.push('</body>');
	ls.push('</html>');
	
	return ls.join('\n') + '\n';
}
function Filetree(path) {
	
	var ls = [];
	ls.push('<html>')
	ls.push('<head>');
	ls.push('<title>' + path + '</title>');
	ls.push('</head>');
	ls.push('<body>');
	ls.push('<pre>');
	FiletreeRec(ls, path);
	ls.push('</pre>');
	ls.push('</body>');
	ls.push('</html>');
	return ls.join('\n');
}
function FiletreeRec(ls, path) {
	
	//fs.statSync(path) => stats
	//stats.isFile()
	//stats.isDirectory()
	
	var files = fs.readdirSync(path);
	
	files.forEach(function(file) {
		
		var filename = path + '\\' + file; // requires that the seed path have no trailing slashes
		var stats = fs.statSync(filename);
		
		if (stats.isDirectory())
		{
			FiletreeRec(ls, filename);
		}
		
		if (stats.isFile())
		{
			ls.push(filename);
		}
	});
}

function Grid(filename) {
	
	var file = fs.readFileSync(desktop + filename, {encoding:'utf-8'});
	
	var ls = [];
	ls.push('<html>');
	ls.push('<head>');
	ls.push('<title>' + filename + '</title>');
	ls.push('<style>canvas:focus { outline : none }</style>');
	ls.push('</head>');
	ls.push('<body>');
	ls.push('<script>var Griddl = {}; Griddl.Components = {};</script>');
	ls.push('<script src="box.js"></script>');
	ls.push('<script src="grid.js"></script>');
	ls.push('<span id="debug"></span>');
	ls.push('<div style="position:absolute ; top:2em ; left:2em">');
	ls.push('<canvas width="1200" height="500" tabIndex="0" style="border:0px solid gray"></canvas>');
	ls.push('</div>');
	ls.push('<pre id="file" style="display:none">\n' + file + '</pre>');
	ls.push('<script>');
	ls.push('//var grid = new Grid(json);');
	ls.push('//grid.ctx = document.getElementsByTagName("canvas")[0].getContext("2d");');
	ls.push('//grid.section = { draw : function() { grid.ctx.clearRect(0, 0, grid.ctx.canvas.width, grid.ctx.canvas.height); grid.draw(); } };');
	ls.push('//grid.ctx.canvas.onmousemove = function(e) { grid.onmousemove(e); };');
	ls.push('//grid.ctx.canvas.onmousedown = function(e) { grid.clearSelection(); };');
	ls.push('//grid.ctx.canvas.parentElement.appendChild(grid.input);');
	ls.push('//grid.draw();');
	ls.push('// function Save() { return grid.write(); }');
	ls.push('</script>');
	ls.push('</body>');
	ls.push('</html>');
	return ls.join('\n');
}
function Tree(filename) { }
function Text(filename) {
	
	var file = fs.readFileSync(desktop + filename, {encoding:'utf-8'});
	
	var ls = [];
	ls.push('<html>');
	ls.push('<head>');
	ls.push('<title>' + filename + '</title>');
	ls.push('<style> .CodeMirror { border : 1px solid gray } </style>');
	ls.push('</head>');
	ls.push('<body>');
	ls.push(SaveForm(filename));
	ls.push('<link rel="stylesheet" href="CodeMirror-5.16.0/lib/codemirror.css" />');
	ls.push('<link rel="stylesheet" href="CodeMirror-5.16.0/addon/fold/foldgutter.css" />');
	ls.push('<script src="CodeMirror-5.16.0/lib/codemirror.js"></script>');
	ls.push('<script src="CodeMirror-5.16.0/addon/fold/foldcode.js"></script>');
	ls.push('<script src="CodeMirror-5.16.0/addon/fold/foldgutter.js"></script>');
	ls.push('<script src="CodeMirror-5.16.0/addon/fold/brace-fold.js"></script>');
	ls.push('<script src="CodeMirror-5.16.0/addon/fold/indent-fold.js"></script>');
	ls.push('<script src="CodeMirror-5.16.0/addon/fold/xml-fold.js"></script>');
	ls.push('<script src="CodeMirror-5.16.0/addon/fold/markdown-fold.js"></script>');
	ls.push('<script src="CodeMirror-5.16.0/addon/fold/comment-fold.js"></script>');
	ls.push('<script src="CodeMirror-5.16.0/mode/javascript/javascript.js"></script>');
	ls.push('<script src="CodeMirror-5.16.0/mode/xml/xml.js"></script>');
	ls.push('<script src="CodeMirror-5.16.0/mode/markdown/markdown.js"></script>');
	ls.push('<textarea>' + file + '</textarea>');
	ls.push('<script>');
	ls.push('var textarea = document.getElementsByTagName("textarea")[0];');
	ls.push('var options = {};');
	ls.push('options.mode = "javascript";');
	ls.push('options.lineNumbers = true;');
	ls.push('options.lineWrapping = true;');
	ls.push('options.extraKeys = {"Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); }};');
	ls.push('options.foldGutter = true;');
	ls.push('options.gutters = ["CodeMirror-linenumbers", "CodeMirror-foldgutter"];');
	ls.push('var codemirror = CodeMirror.fromTextArea(textarea, options);');
	ls.push('function Save() { return codemirror.getDoc().getValue(); }');
	ls.push('</script>');
	ls.push('</body>');
	ls.push('</html>');
	return ls.join('\n');
}
function Paint(filename) {
	
	var ls = [];
	ls.push('<html>');
	ls.push('<head>');
	ls.push('</head>');
	ls.push('<body>');
	ls.push('<!-- <button></button>');
	ls.push('<button></button>');
	ls.push('<button></button>');
	ls.push('<button></button>');
	ls.push('<button></button>');
	ls.push('<button></button>');
	ls.push('<button></button>');
	ls.push('<button></button>');
	ls.push('<button></button>');
	ls.push('<button></button> -->');
	ls.push('<canvas width="1200" height="500" style="border:1px solid gray"></canvas>');
	ls.push('<script>');
	ls.push('</script>');
	ls.push('</body>');
	ls.push('</html>');
	return ls.join('\n');
}
function Img(filename) {
	var ls = [];
	ls.push('<html>');
	ls.push('<head>');
	ls.push('</head>');
	ls.push('<body>');
	ls.push('<img src="' + filename + '"></img>');
	ls.push('<script>');
	ls.push('</script>');
	ls.push('</body>');
	ls.push('</html>');
	return ls.join('\n');
}

