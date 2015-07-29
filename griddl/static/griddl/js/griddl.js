
var Griddl = (function() {

var Griddl = {};

// all the export button knows is the name of the component containing user drawing code
// when clicked, it sets globals.drawingMode to 'pdf', invokes the user code, and then reads griddlCanvas (which the user code must set)
var drawPdf = false; // the function invoked by the export button sets this to true, runs the user code, and then sets it to false again
var griddlCanvas = null; // this is how user drawing code communicates with the PDF export button
Griddl.objs = null; // set in Main() - not a great idea to make this a var, because there are lots of local vars named 'objs'
Griddl.fonts = null; // set in fonts.js

function Main() {
	
	//$('.menubar').menubar();
	SaveAjax();
	var workbook = ReadScript($('#frce').text());
	var objs = [];
	
	// first attach all objects to Griddl.objs - if there's a problem with the init code below, these objects will still exist to be saved
	workbook.forEach(function(obj, index) { objs[obj.name] = obj; objs.push(obj); });
	
	Griddl.objs = objs;
	
	for (var i = 0; i < workbook.length; i++)
	{
		var obj = workbook[i];
		
		if (obj.type == 'js')
		{
			try
			{
				obj.$ = new Function('args', obj.text);
			}
			catch (e)
			{
				// the parse has failed - display an error message - look at error handling code in MakeComponentsDiv to see how to display error message
			}
			
			AddText(obj, 'javascript');
		}
		else if (obj.type == 'txt')
		{
			obj.$ = obj.text;
			AddText(obj, null);
		}
		else if (obj.type == 'html')
		{
			obj.$ = obj.text;
			AddHtml(obj);
		}
		else if (obj.type == 'css')
		{
			obj.$ = obj.text;
			AddCss(obj);
		}
		else if (obj.type == 'json')
		{
			try
			{
				obj.$ = JSON.parse(obj.text);
			}
			catch (e)
			{
				// the parse has failed - display an error message - look at error handling code in MakeComponentsDiv to see how to display error message
			}
			
			AddJson(obj, 'javascript');
		}
		else if (obj.type == 'grid')
		{
			obj.$ = MatrixToObjs(obj.matrix);
			AddGrid(obj);
		}
		else if (obj.type == 'matrix')
		{
			obj.$ = obj.matrix; // just don't parse the matrix into objs
			AddGrid(obj);
		}
		else if (obj.type == 'table')
		{
			obj.$ = MatrixToObjs(obj.matrix); // we could have a matrix table too - search for 'matrixTable' in all opened documents to see where changes need to be made
			AddTable(obj);
		}
		else if (obj.type == 'tsv')
		{
			obj.$ = MatrixToObjs(obj.matrix);
			AddTsv(obj);
		}
		else if (obj.type == 'tree')
		{
			obj.$ = Lang.ReadTreeSimple(obj.treelines)[0]; // ReadTreeSimple returns a list of twigs, we'll just assign the root to obj.$
			AddTree(obj);
		}
		else if (obj.type == 'image')
		{
			// obj.text = base64 encoding
			AddImage(obj);
		}
		else if (obj.type == 'audio')
		{
			// obj.text = base64 encoding
			RefreshAudioPcmsFromText(obj);
			AddAudio(obj);
		}
		else if (obj.type == 'binary')
		{
			RefreshBinaryDollar(obj);
			AddBinary(obj);
		}
		else if (obj.type == 'datgui')
		{
			try
			{
				obj.$ = JSON.parse(obj.text);
			}
			catch (e)
			{
				// the parse has failed - display an error message - look at error handling code in MakeComponentsDiv to see how to display error message
			}
			
			AddDatgui(obj);
		}
	}
	
	// add any HTML (and execute scripts that are in that HTML) only after all components have been added
	workbook.forEach(function(obj, index) { if (obj.type == 'html') { InvokeHtml(obj); } });
	
	//$(document).tooltip(); // this is one of the few parts of jqueryui that we used.  if we can include just the tooltip, fine, but not worth importing the whole lib
}
function SaveToText() {
	var lines = [];
	
	for (var i = 0; i < Griddl.objs.length; i++)
	{
		var obj = Griddl.objs[i];
		lines.push('@' + obj.type + ' ' + obj.name + ' ' + obj.display);
		
		if (obj.type == 'text' || obj.type == 'txt' || obj.type == 'html' || obj.type == 'css' || obj.type == 'js')
		{
			lines.push(obj.codemirror.getValue());
		}
		else if (obj.type == 'json' || obj.type == 'datgui')
		{
			lines.push(JSON.stringify(obj.$)); // currently this is used for dat.gui controls - dat.gui modifies the object, and i don't want to add hooks to update obj.text every time obj.$ is modified.  so therefore we just do that conversion here
		}
		else if (obj.type == 'grid' || obj.type == 'tsv' || obj.type == 'table')
		{
			lines.push(ObjsToJoinedLines(obj.$));
		}
		else if (obj.type == 'matrix')
		{
			lines.push(MatrixToJoinedLines(obj.$));
		}
		else if (obj.type == 'tree')
		{
			lines.push(Lang.WriteTreeSimple(obj.$).join('\n'));
		}
		else if (obj.type == 'image')
		{
			lines.push(obj.text);
		}
		else if (obj.type == 'audio')
		{
			lines.push(obj.text);
		}
		else if (obj.type == 'binary')
		{
			lines.push(obj.text);
		}
		else
		{
			throw new Error();
		}
		
		lines.push('@end');
		lines.push('');
	}
	
	return lines.join('\r\n');
}
function ReadScript(str) {
	
	var result = [];
	var lines = Lang.Linize(str);
	var k = 0;
	
	while (k < lines.length)
	{
		var line = lines[k];
		
		if (line.length == 0) { }
		else if (line.substr(0, 2) == "//") { }
		else if (line[0] == '@')
		{
			var tokens = Lang.Tokenize(line, ' ');
			var type = tokens[0].substr(1);
			var name = tokens[1];
			var display = tokens[2];
			
			var obj = {};
			obj.type = type;
			obj.name = name;
			obj.display = display;
			
			if (type == 'grid' || type == 'matrix' || type == 'table')
			//if (line.substr(1, 4) == 'grid' || line.substr(1, 6) == 'matrix' || line.substr(1, 5) == 'table')
			{
				var matrix = [];
				k++;
				
				while (k < lines.length)
				{
					var row = lines[k];
					if (row == '@end') { break; }
					var len = Lang.Tokenize(row, '\t').length;
					var cols = Lang.Tokenize(row, '\t');
					// so that we don't have to fill in nulls across the board for grids with a grid formula
					for (var i = cols.length; i < len; i++) { cols.push(""); }
					matrix.push(cols);
					k++;
				}
				
				obj.matrix = matrix;
			}
			else if (type == 'tree')
			//else if (line.substr(1, 4) == 'tree')
			{
				//var tree = null;
				//if (tokens[1] == "rootree") { tree = MakeRootree(scope, tokens[2]); }
				//else if (tokens[1] == "indentree") { tree = MakeIndentree(scope, tokens[2]); }
				//else if (tokens[1] == "boxtree") { tree = MakeBoxtree(scope, tokens[2]); }
				//else { throw new Error(); }
				//var textOnly = false;
				//if (tokens.length > 3) { if (tokens[3] == 'text') { textOnly = true; } } // every sub is just text - don't interpret formulas or anything
				
				var treelines = [];
				k++;
				
				while (k < lines.length)
				{
					var row = lines[k];
					if (row == '@end') { break; }
					treelines.push(row);
					k++;
				}
				
				obj.treelines = treelines;
			}
			else if (type == 'txt' || type == 'html' || type == 'css' || type == 'js' || type == 'datgui' || type == 'tsv' || type == 'json')
			//else if (line.substr(1, 4) == 'text' || line.substr(1, 3) == 'txt' || line.substr(1, 4) == 'html' || line.substr(1, 3) == 'css' || line.substr(1, 2) == 'js' || line.substr(1, 6) == 'datgui' || line.substr(1, 3) == 'tsv')
			{
				var str = "";
				k++;
				
				while (k < lines.length)
				{
					var row = lines[k];
					if (row == '@end') { break; }
					str += row + "\n";
					k++;
				}
				
				obj.text = str;
			}
			else if (type == 'image' || type == 'audio'  || type == 'binary')
			//else if (line.substr(1, 5) == 'image' || line.substr(1, 5) == 'audio'  || line.substr(1, 6) == 'binary')
			{
				if (line.substr(1, 5) == 'image')
				{
					var width = parseInt(tokens[3]);
					var height = parseInt(tokens[4]);
				}
				
				// base64 encoded string - we'll assume only one line, although base64 encoding can conceivably have newlines that are just ignored
				k++;
				var base64 = lines[k];
				k++;
				
				obj.text = base64;
				obj.width = width;
				obj.height = height;
			}
			else
			{
				throw new Error();
			}
			
			result.push(obj);
		}
		else
		{
			throw new Error();
			//var tree = ReadFrce(line);
			//Eval(scope, tree.root, false);
		}
		
		k++;
	}
	
	return result;
}
function CreateComponentDiv(parent, obj) {
	var div = $(document.createElement('div'));
	//div.attr('id', obj.name);
	div.css('margin', '1em');
	var headerDiv = $(document.createElement('div'));
	var clientDiv = $(document.createElement('div'));
	
	// we'll put a modified id on the clientDiv, so that we can refer to it from CSS components
	// we can't tag the component client div with the bare obj.name, because if it is an HTML component, the created div will have id = obj.name
	clientDiv.attr('id', obj.name + 'Component'); 
	clientDiv.css('display', (obj.display == 'hidden') ? 'none' : 'block');
	obj.div = clientDiv;
	
	var typeLabel = $(document.createElement('label'));
	typeLabel.css('display', 'inline-block');
	typeLabel.css('font-family', 'monospace');
	typeLabel.css('margin-right', '1em');
	typeLabel.css('width', '4em');
	typeLabel.html(obj.type);
	headerDiv.append(typeLabel);
	
	var nameBox = $(document.createElement('input'));
	nameBox.attr('type', 'text');
	nameBox.attr('value', obj.name);
	nameBox.on('blur', function(e) {
		delete Griddl.objs[obj.name];
		
		var newname = this.value;
		
		// if there is a conflict, just add suffixes until there isn't
		while (Griddl.objs[newname]) { newname += ' - copy'; }
		
		obj.name = newname;
		Griddl.objs[obj.name] = obj;
		obj.div.parent().attr('id', obj.name + 'Component');
		MarkDirty();
	});
	headerDiv.append(nameBox);
	//var type = $(document.createElement('input'));
	//type.attr('type', 'text');
	//type.attr('value', obj.type);
	//headerDiv.append(type);
	
	var actionButton = $(document.createElement('button'));
	actionButton.css('font-family', 'monospace');
	actionButton.css('position', 'relative');
	actionButton.css('top', '-1px');
	
	if (obj.type == 'grid' || obj.type == 'matrix' || obj.type == 'table' || obj.type == 'datgui')
	{
		var radioName = '';
		
		// we create a 12-letter random name to link the radio buttons into a group.  collisions are possible but unlikely
		for (var i = 0; i < 12; i++)
		{
			var c = Math.floor(Math.random() * 52, 1);
			if (c < 26) { radioName += String.fromCharCode(65 + c); }
			else { radioName += String.fromCharCode(97 + c); }
		}
		
		var radioDiv = $(document.createElement('div'));
		radioDiv.css('display', 'inline');
		var radioButton0 = $(document.createElement('input'));
		radioButton0.attr('type', 'radio');
		radioButton0.attr('name', radioName);
		radioButton0.attr('checked', 'true');
		radioDiv.append(radioButton0);
		var label0 = $(document.createElement('label'));
		label0.text('grid');
		radioDiv.append(label0);
		var radioButton1 = $(document.createElement('input'));
		radioButton1.attr('type', 'radio');
		radioButton1.attr('name', radioName);
		radioDiv.append(radioButton1);
		var label1 = $(document.createElement('label'));
		label1.text('text');
		radioDiv.append(label1);
		headerDiv.append(radioDiv);
		
		var textbox = null;
		var codemirror = null;
		
		// text -> grid
		radioButton0.on('click', function() {
			
			if (obj.type == 'grid' || obj.type == 'matrix')
			{
				clientDiv.children().first().html('');
			}
			else if (obj.type == 'table')
			{
				clientDiv.html('');
			}
			else if (obj.type == 'datgui')
			{
				clientDiv.html('');
			}
			
			var text = codemirror.getDoc().getValue();
			//var text = textbox[0].value;
			
			if (obj.type == 'grid')
			{
				obj.matrix = TsvToMatrix(text);
				obj.$ = MatrixToObjs(obj.matrix);
				RefreshObjGrid(obj);
			}
			else if (obj.type == 'matrix')
			{
				obj.matrix = TsvToMatrix(text);
				obj.$ = obj.matrix;
				RefreshGrid(obj, false, false);
			}
			else if (obj.type == 'table')
			{
				obj.matrix = TsvToMatrix(text);
				obj.$ = MatrixToObjs(obj.matrix);
				RefreshObjTable(obj);
			}
			else if (obj.type == 'datgui')
			{
				obj.text = text;
				
				try
				{
					obj.$ = JSON.parse(obj.text);
				}
				catch (e)
				{
					// the parse has failed - display an error message - look at error handling code in MakeComponentsDiv to see how to display error message
				}
				
				RefreshDatgui(obj);
			}
			
			MarkDirty();
		});
		
		// grid -> text
		radioButton1.on('click', function() {
			
			var divToClear = null;
			
			if (obj.type == 'grid' || obj.type == 'matrix')
			{
				divToClear = clientDiv.children().first();
				var ht = divToClear.data('handsontable');
				ht.destroy();
				divToClear.html('');
			}
			else if (obj.type == 'table')
			{
				divToClear = clientDiv;
			}
			else if (obj.type == 'datgui')
			{
				divToClear = clientDiv;
			}
			
			divToClear.html('');
			
			textbox = $(document.createElement('textarea'));
			textbox.css('width', '30em');
			textbox.css('height', '30em');
			divToClear.append(textbox);
			
			var text = null;
			
			if (obj.type == 'grid') { text = ObjsToJoinedLines(obj.$); }
			else if (obj.type == 'matrix') { text = MatrixToJoinedLines(obj.$); }
			else if (obj.type == 'table') { text = ObjsToJoinedLines(obj.$); }
			else if (obj.type == 'datgui') { text = JSON.stringify(obj.$); }
			
			codemirror = CodeMirror.fromTextArea(textbox[0], { smartIndent : false , lineNumbers : true });
			codemirror.getDoc().setValue(text);
			
			//textbox[0].value = text;
			
			MarkDirty();
		});
		

		
		//actionButton.html('Toggle');
		//
		//actionButton.on('click', function() {
		//	var tableDiv = clientDiv.children().first();
		//	var ht = tableDiv.data('handsontable');
		//	ht.destroy();
		//	tableDiv.html('');
		//	var textbox = $(document.createElement('textarea'));
		//	textbox.css('width', '30em');
		//	textbox.css('height', '30em');
		//	tableDiv.append(textbox);
		//	
		//	if (obj.type == 'grid') { textbox[0].value = ObjsToJoinedLines(obj.$); }
		//	else if (obj.type == 'matrix') { textbox[0].value = MatrixToJoinedLines(obj.$); }
		//	else if (obj.type == 'table') { textbox[0].value = ObjsToJoinedLines(obj.$); } // we could have a matrix table too - search for 'matrixTable' in all opened documents to see where changes need to be made
		//	
		//	textbox.on('blur', function(e) { // probably better to click Toggle to convert back
		//		tableDiv.html('');
		//		obj.matrix = TsvToMatrix(textbox[0].value);
		//		
		//		if (obj.type == 'grid')
		//		{
		//			obj.$ = MatrixToObjs(obj.matrix);
		//			RefreshObjGrid(obj);
		//		}
		//		else if (obj.type == 'matrix')
		//		{
		//			obj.$ = obj.matrix;
		//			RefreshGrid(obj, false, false);
		//		}
		//		
		//		MarkDirty();
		//	});
		//);
	}
	else if (obj.type == 'tree')
	{
		var radioName = '';
		
		for (var i = 0; i < 12; i++)
		{
			var c = Math.floor(Math.random() * 52, 1);
			if (c < 26) { radioName += String.fromCharCode(65 + c); }
			else { radioName += String.fromCharCode(97 + c); }
		}
		
		var radioDiv = $(document.createElement('div'));
		radioDiv.css('display', 'inline');
		var radioButton0 = $(document.createElement('input'));
		radioButton0.attr('type', 'radio');
		radioButton0.attr('name', radioName);
		radioButton0.attr('checked', 'true');
		radioDiv.append(radioButton0);
		var label0 = $(document.createElement('label'));
		label0.text('tree');
		radioDiv.append(label0);
		var radioButton1 = $(document.createElement('input'));
		radioButton1.attr('type', 'radio');
		radioButton1.attr('name', radioName);
		radioDiv.append(radioButton1);
		var label1 = $(document.createElement('label'));
		label1.text('text');
		radioDiv.append(label1);
		headerDiv.append(radioDiv);
		
		var textbox = null;
		var codemirror = null;
		
		// text -> tree
		radioButton0.on('click', function() {
			clientDiv.html('');
			
			var text = codemirror.getDoc().getValue();
			//var text = textbox[0].value;
			
			obj.$ = Lang.ReadTreeSimple(text.split('\n'))[0];
			
			var ul = SimpleTreeToIndentree(obj.$);
			clientDiv.append(ul);
			Indentree.applyTo(ul);
			
			MarkDirty();
		});
		
		// tree -> text
		radioButton1.on('click', function() {
			clientDiv.html('');
			textbox = $(document.createElement('textarea'));
			textbox.css('width', '30em');
			textbox.css('height', '30em');
			clientDiv.append(textbox);
			
			codemirror = CodeMirror.fromTextArea(textbox[0], { smartIndent : false , lineNumbers : true });
			
			codemirror.getDoc().setValue(Lang.WriteTreeSimple(obj.$).join('\n'));
			//textbox[0].value = Lang.WriteTreeSimple(obj.$).join('\n');
			
			MarkDirty();
		});
	}
	else if (obj.type == 'js') // the 'js' looks forward to the time when we have support for other languages
	{
		actionButton.html('Run code');
		
		// ExecJs(obj) is just (new Function('args', obj.codemirror.getValue()))(), but with error handling/reporting
		actionButton.on('click', function() { ExecJs(obj); });
		
		headerDiv.append(actionButton);
	}
	else if (obj.type == 'txt')
	{
		
	}
	else if (obj.type == 'html')
	{
		actionButton.html('Add to DOM');
		
		actionButton.on('click', function() {
			obj.$ = obj.text = obj.codemirror.getValue();
			InvokeHtml(obj);
		});
		
		headerDiv.append(actionButton);
	}
	else if (obj.type == 'css')
	{
		actionButton.html('Add to DOM');
		
		actionButton.on('click', function() {
			obj.$ = obj.text = obj.codemirror.getValue();
			InvokeCss(obj);
		});
		
		headerDiv.append(actionButton);
	}
	else if (obj.type == 'image' || obj.type == 'audio' || obj.type == 'binary' || obj.type == 'tsv' || obj.type == 'json')
	{
		var actionButton2 = $(document.createElement('button'));
		actionButton2.css('font-family', 'monospace');
		actionButton2.css('position', 'relative');
		actionButton2.css('top', '-1px');
		
		actionButton.html('Upload');
		
		// this is for image only - need to do audio separately
		actionButton.on('click', function() {
			var fileChooser = $(document.createElement('input'));
			fileChooser.attr('type', 'file');
			fileChooser.on('change', function() {
				var fileReader = new FileReader();
				
				fileReader.onload = function(event)
				{
					var x = null;
					var b64 = null;
					
					if (obj.type == 'image' || obj.type == 'audio' || obj.type == 'binary')
					{
						x = new Uint8Array(event.target.result, 0, event.target.result.byteLength); // for readAsArrayBuffer
						b64 = Griddl.IO.Uint8ArrayToBase64String(x);
					}
					else if (obj.type == 'tsv' || obj.type == 'json')
					{
						x = event.target.result;
					}
					
					if (obj.type == 'image')
					{
						obj.text = 'data:image/png;base64,' + b64;
						RefreshImage(obj);
					}
					else if (obj.type == 'audio')
					{
						obj.text = 'data:audio/wav;base64,' + b64;
						RefreshAudioPcmsFromText(obj);
						RefreshAudioDomElement(obj);
					}
					else if (obj.type == 'binary')
					{
						obj.text = 'data:text/plain;base64,' + b64;
						obj.$ = x;
					}
					else if (obj.type == 'tsv')
					{
						obj.text = x;
						obj.$ = MatrixToObjs(TsvToMatrix(x));
						RefreshTsv(obj);
					}
					else if (obj.type == 'json')
					{
						obj.text = x;
						
						try
						{
							obj.$ = JSON.parse(obj.text);
						}
						catch (e)
						{
							// the parse has failed - display an error message - look at error handling code in MakeComponentsDiv to see how to display error message
						}
						
						RefreshJson(obj);
					}
				};
				
				if (fileChooser[0].files.length > 0)
				{
					var f = fileChooser[0].files[0];
					
					if (obj.type == 'image' || obj.type == 'audio' || obj.type == 'binary')
					{
						fileReader.readAsArrayBuffer(f); // when this is done, it will call fileReader.onload(event)
					}
					else if (obj.type == 'tsv' || obj.type == 'json')
					{
						fileReader.readAsText(f); // when this is done, it will call fileReader.onload(event)
					}
				}
			});
			fileChooser.click();
		});
		
		headerDiv.append(actionButton);
		
		var extensions = {};
		extensions['image'] = '.png';
		extensions['audio'] = '.wav';
		extensions['binary'] = '';
		extensions['tsv'] = '.tsv';
		extensions['json'] = '.json';
		
		actionButton2.html('Download');
		actionButton2.on('click', function() {
			var filename = obj.name + extensions[obj.type];
			var downloadLink = document.createElement('a');
			var url = window.URL;
			
			if (obj.type == 'tsv' || obj.type == 'json')
			{
				downloadLink.href = 'data:text/plain,' + encodeURIComponent(obj.text);
			}
			else
			{
				downloadLink.href = obj.text;
			}
			
			downloadLink.download = filename;
			downloadLink.click();
		});
		headerDiv.append(actionButton2);
	}
	
	var minimizeButton = $(document.createElement('input'));
	minimizeButton.css('font-family', 'monospace');
	minimizeButton.css('position', 'relative');
	minimizeButton.css('top', '-1px');
	minimizeButton.attr('type', 'button');
	minimizeButton.attr('value', ((obj.display == 'hidden') ? '+' : '-'));
	headerDiv.append(minimizeButton);
	var destroyButton = $(document.createElement('input'));
	destroyButton.css('font-family', 'monospace');
	destroyButton.css('position', 'relative');
	destroyButton.css('top', '-1px');
	destroyButton.attr('type', 'button');
	destroyButton.attr('value', 'x');
	headerDiv.append(destroyButton);
	
	minimizeButton.on('click', function() {
		if ($(this).attr('value') == '-')
		{
			$(this).parent().parent().children().last().css('display', 'none'); // $(this).parent().next().css('display', 'none');
			
			if (obj.type == 'datgui')
			{
				obj.div.parent().css('margin-bottom', '1em'); // datgui crowds the bottom if the margin is just 1em, so we change it to 2em when visible
			}
			
			$(this).attr('value', '+');
			obj.display = 'hidden';
		}
		else
		{
			$(this).parent().parent().children().last().css('display', 'block');
			$(this).attr('value', '-');
			obj.display = 'visible';
			
			if (obj.type == 'datgui')
			{
				obj.div.parent().css('margin-bottom', '2em'); // datgui crowds the bottom if the margin is just 1em, so we change it to 2em when visible
			}
			
			if (obj.codemirror)
			{
				// this fixes this bug: when a component containing a codemirror was initially hidden, and then we maximized, the text would not appear
				obj.codemirror.refresh();
			}
		}
		
		MarkDirty();
	});
	
	destroyButton.on('click', function() {
		if (window.confirm('Delete component?')) { 
			delete Griddl.objs[obj.name];
			var i = Griddl.objs.indexOf(obj);
			Griddl.objs.splice(i, 1);
			//Griddl.objs = Griddl.objs.slice(0, i).concat(Griddl.objs.slice(i + 1));
			div.remove();
			MarkDirty();
		}
	});
	
	div.append(headerDiv);
	div.append(clientDiv);
	parent.append(div);
	
	return clientDiv;
}

function CreateNormalDiv(parent, name) {
	var div = $(document.createElement('div'));
	div.attr('id', name);
	parent.append(div);
	return div;
}
function MarkDirty() {
	if ($('#saveMenuButton').css('color') == 'rgb(0, 0, 0)')
	{
		$('#saveMenuButton').css('color', 'red');
	}
	else
	{
		$('#saveMenuButton').data('color', 'red'); // save the marking for later, when the user logs in
	}
	
	if ($('#saveasMenuButton').css('color') == 'rgb(0, 0, 0)')
	{
		$('#saveasMenuButton').css('color', 'red');
	}
	else
	{
		$('#saveasMenuButton').data('color', 'red'); // save the marking for later, when the user logs in
	}
}
function ReorderComponents() {
	var screen = $(document.createElement('div'));
	screen.css('display', 'block');
	screen.css('position', 'fixed');
	screen.css('top', '0');
	screen.css('left', '0');
	screen.css('width', '100%');
	screen.css('height', '100%');
	screen.css('z-index', '997');
	screen.css('opacity', '0.6');
	screen.css('background-color', '#444444');
	
	var dialog = $(document.createElement('div'));
	dialog.css('display', 'block');
	dialog.css('position', 'fixed');
	dialog.css('left', '0');
	dialog.css('top', '0');
	dialog.css('right', '0');
	dialog.css('bottom', '0');
	dialog.css('margin', 'auto');
	dialog.css('width', '20%');
	dialog.css('height', '40%');
	dialog.css('overflow-y', 'auto');
	dialog.css('z-index', '998');
	dialog.css('opacity', '1.0');
	dialog.css('background-color', '#ffffff');
	
	var ul = $(document.createElement('ul'));
	ul.css('list-style-type', 'none');
	ul.css('width', '60%');
	dialog.append(ul);
	
	for (var i = 0; i < Griddl.objs.length; i++)
	{
		var li = $(document.createElement('li'));
		li.addClass('ui-state-default');
		li.css('margin', '2px');
		li.css('cursor', 'move');
		var span = $(document.createElement('span'));
		span.addClass('ui-icon');
		span.addClass('ui-icon-arrowthick-2-n-s');
		span.css('display', 'inline-block');
		li.append(span);
		var span = $(document.createElement('span'));
		span.text(Griddl.objs[i].name);
		span.css('display', 'inline-block');
		li.append(span);
		ul.append(li);
	}
	
	ul.sortable();
	
	var reorder = $(document.createElement('button'));
	reorder.text('Reorder');
	reorder.on('click', function() {
		var names = [];
		ul.children().each(function() { names.push($(this).text()); });
		for (var i = 0; i < names.length; i++)
		{
			Griddl.objs[i] = Griddl.objs[names[i]];
		}
		var containerDivs = [];
		for (var i = 0; i < Griddl.objs.length; i++)
		{
			if (Griddl.objs[i].type == 'grid' || Griddl.objs[i].type == 'matrix')
			{
				containerDivs.push(Griddl.objs[i].div.parent().parent());
			}
			else
			{
				containerDivs.push(Griddl.objs[i].div.parent());
			}
		}
		$('#cells').children().detach(); // detach() keeps data and handlers attached to the elements
		for (var i = 0; i < containerDivs.length; i++)
		{
			$('#cells').append(containerDivs[i]);
		}
		screen.remove();
		dialog.remove();
	});
	
	var cancel = $(document.createElement('button'));
	cancel.text('Cancel');
	cancel.on('click', function() {
		screen.remove();
		dialog.remove();
	});
	
	dialog.append(reorder);
	dialog.append(cancel);
	
	$('body').append(screen);
	$('body').append(dialog);
}

function UniqueName(type, n) {
	while (Griddl.objs[type + n.toString()])
	{
		n++;
	}
	
	return type + n.toString();
}
function NewText() {
	var obj = {};
	obj.type = 'txt';
	obj.name = UniqueName('txt', 1);
	obj.text = '';
	obj.display = 'visible';
	obj.$ = obj.text;
	AddText(obj);
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
}
function NewJs() {
	var obj = {};
	obj.type = 'js';
	obj.name = UniqueName('js', 1);
	obj.text = '';
	obj.display = 'visible';
	obj.$ = new Function('args', obj.text);
	AddText(obj, 'javascript');
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
}
function ExecJs(obj) {

	// this does the same thing as RunCode, but has (currently commented) error handling
	// it is used by the code in CreateComponentDiv to execute js
	// we should probably merge all these exec functions
	
	var fn = new Function('args', obj.codemirror.getValue());
	
	$('#errorMessage').remove();
	
	fn();
	
	//try
	//{
	//	fn();
	//}
	//catch (e)
	//{
	//	var lines = e.stack.split('\n');
	//	var evalLine = null;
	//	for (var i = 0; i < lines.length; i++)
	//	{
	//		if (lines[i].trim().substr(0, 7) == 'at eval')
	//		{
	//			evalLine = lines[i];
	//		}
	//	}
	//	var fnLineCol = evalLine.split(',')[1]; // ' <anonymous>:7:1)'
	//	var fnLineColArray = fnLineCol.substring(1, fnLineCol.length - 1).split(':'); // [ '<anonymous' , '7' , '1' ]
	//	var functionName = fnLineColArray[0];
	//	var lineNumber = fnLineColArray[1] - 2; // not sure why the line number is 2 off
	//	var colNumber = fnLineColArray[2];
	//	obj.div.before('<span id="errorMessage" style="color:red;">Error: ' + e.message + ' (at line ' + lineNumber + ', column ' + colNumber + ')' + '</span>');
	//}
}
function AddText(obj, mode) {
	var clientDiv = CreateComponentDiv($('#cells'), obj);
	var textbox = $(document.createElement('textarea'));
	clientDiv.append(textbox);
	obj.codemirror = CodeMirror.fromTextArea(textbox[0], { mode : mode , smartIndent : false , lineNumbers : true , lineWrapping : true });
	obj.$ = obj.text;
	RefreshText(obj);
	obj.codemirror.on('blur', function() { obj.text = obj.codemirror.getValue(); /* obj.$ = obj.text; */  });
	obj.codemirror.on('change', function() {
		MarkDirty();
	});
}
function RefreshText(obj) {
	obj.codemirror.getDoc().setValue(obj.$);
}
function NewHtml() {
	var obj = {};
	obj.type = 'html';
	obj.name = UniqueName('html', 1);
	obj.text = '';
	obj.display = 'visible';
	AddText(obj, 'xml');
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
}
function AddHtml(obj) {
	//InvokeHtml(obj);
	AddText(obj, 'xml');
}
function InvokeHtml(obj) {
	$('#' + obj.name).remove();
	var div = $(document.createElement('div'));
	div.attr('id', obj.name);
	div.html(obj.$);
	$('body').append(div);
}
function NewCss() {
	var obj = {};
	obj.type = 'css';
	obj.name = UniqueName('css', 1);
	obj.text = '';
	obj.display = 'visible';
	AddText(obj, 'css');
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
}
function AddCss(obj) {
	InvokeCss(obj);
	AddText(obj, 'css');
}
function InvokeCss(obj) {
	$('#' + obj.name).remove();
	var style = $(document.createElement('style'));
	style.attr('id', obj.name);
	style.html(obj.$);
	$('head').append(style);
}
function NewGrid() {
	var obj = {};
	obj.type = 'grid';
	obj.name = UniqueName('grid', 1);
	obj.matrix = [ [ '' , 'A' , 'B' , 'C' ] , [ '0' , '' , '' , '' ] , [ '1' , '' , '' , '' ] , [ '2' , '' , '' , '' ] ];
	obj.display = 'visible';
	obj.$ = MatrixToObjs(obj.matrix);
	AddGrid(obj);
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
}
function NewMatrix() {
	var obj = {};
	obj.type = 'matrix';
	obj.name = UniqueName('matrix', 1);
	obj.matrix = [ [ '' , 'A' , 'B' , 'C' ] , [ '0' , '' , '' , '' ] , [ '1' , '' , '' , '' ] , [ '2' , '' , '' , '' ] ];
	obj.display = 'visible';
	obj.$ = obj.matrix;
	AddGrid(obj);
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
}
function NewTable() {
	var obj = {};
	obj.type = 'table';
	obj.name = UniqueName('table', 1);
	obj.matrix = [ [ '' , 'A' , 'B' , 'C' ] , [ '0' , '' , '' , '' ] , [ '1' , '' , '' , '' ] , [ '2' , '' , '' , '' ] ];
	obj.display = 'visible';
	obj.$ = MatrixToObjs(obj.matrix);
	AddTable(obj);
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
}
function AddGrid(obj) {
	var clientDiv = CreateComponentDiv($('#cells'), obj);
	var tableDiv = $(document.createElement('div'));
	clientDiv.append(tableDiv);
	obj.div = tableDiv; // this overwrites the default obj.div = clientDiv from CreateComponentDiv
	
	if (obj.type == 'grid')
	{
		RefreshObjGrid(obj);
	}
	else if (obj.type == 'matrix')
	{
		RefreshGrid(obj, false, false);
	}
}
function AddTable(obj) {
	var clientDiv = CreateComponentDiv($('#cells'), obj);
	
	if (obj.type == 'table')
	{
		RefreshObjTable(obj);
	}
	else if (obj.type == 'matrixTable')
	{
		RefreshMatrixTable(obj);
	}
}
function RefreshObjTable(obj) {
	var colHeaders = []; for (var key in obj.$[0]) { colHeaders.push(key); }
	
	var table = $(document.createElement('table'));
	table.css('border-collapse', 'collapse');
	
	var headertr = $(document.createElement('tr'));
	
	headertr.append($(document.createElement('td')));
	
	for (var i = 0; i < colHeaders.length; i++)
	{
		var td = $(document.createElement('td'));
		td.css('border', '1px solid black');
		td.html(colHeaders[i]);
		headertr.append(td);
	}
	
	table.append(headertr);
	
	for (var i = 0; i < obj.$.length; i++)
	{
		var tr = $(document.createElement('tr'));
		
		var td = $(document.createElement('td'));
		td.css('border', '1px solid black');
		td.html(i.toString());
		tr.append(td);
		
		for (var key in obj.$[i])
		{
			var td = $(document.createElement('td'));
			td.css('border', '1px solid black');
			td.html(obj.$[i][key].toString());
			tr.append(td);
		}
		
		table.append(tr);
	}
	
	obj.div.append(table);
}
function RefreshMatrixTable(obj, rowHeaders, colHeaders) {
	
}
function RefreshObjGrid(obj) {
	var rowHeaders = function(index) { return index; };
	var colHeaders = []; for (var key in obj.$[0]) { colHeaders.push(key); }
	RefreshGrid(obj, rowHeaders, colHeaders);
}
function RefreshGrid(obj, rowHeaders, colHeaders) {
	
	// move rowHeaders and colHeaders into an options argument
	// we can also put colWidths into the options arg
	
	obj.firstChange = true; // we need this because the afterChange event fires after the table is first created - we don't want MarkDirty() to be called on init
	
	obj.div.handsontable(
	{
		data : obj.$ ,
		rowHeaders : rowHeaders ,
		colHeaders : colHeaders ,
		contextMenu : true ,
		manualColumnResize : true ,
		afterChange : function(changes, source) {
			if (obj.firstChange)
			{
				obj.firstChange = false;
			}
			else
			{
				MarkDirty();
			}
		}
		//colWidths : DetermineColWidths(obj.$, '11pt Calibri', [ 5 , 23 , 5 ]) // expand widths to accomodate text length
		//colWidths : [ 10 , 30 , 10 ].map(function(elt) { return elt * TextWidth('m', '11pt Calibri'); }) // fixed widths, regardless of text length
	});
}
function NewTree() {
	var obj = {};
	obj.type = 'tree';
	obj.name = UniqueName('tree', 1);
	obj.treelines = [ 'a' , '\tb' , '\tc' ];
	obj.display = 'visible';
	obj.$ = Lang.ReadTreeSimple(obj.treelines)[0];
	AddTree(obj);
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
}
function AddTree(obj) {
	var clientDiv = CreateComponentDiv($('#cells'), obj);
	var ul = SimpleTreeToIndentree(obj.$);
	clientDiv.append(ul);
	Indentree.applyTo(ul);
}
function RefreshTree(obj) {
	// this only works on a component - the component div is what obj.div refers to
	// do var div = $('#output') if you want an indentree on an html-created div
	var div = obj.div;
	div.html('');
	var ul = SimpleTreeToIndentree(obj.$);
	div.append(ul);
	Indentree.applyTo(ul);
}
function SimpleTreeToIndentree(twig) {
	// { value : "" , children : [] }
	var ul = $(document.createElement('ul'));
	SimpleTreeToIndentreeRec(ul, twig);
	return ul;
}
function SimpleTreeToIndentreeRec(parentul, twig) {
	
	var li = $(document.createElement('li'));
	parentul.append(li);
	
	var input = $(document.createElement('input'));
	input.attr('type', 'text');
	input.attr('value', twig.value);
	li.append(input);
	
	input.on('click', function(e) {
		//debugger;
		input.focus(); // this doesn't work too well - how do we get the default action for the input, but no further propagation (up to the ul, which captures it)?
		e.stopPropagation();
		
		// neither of these work either
		//e.bubbles = false;
		//e.originalEvent.bubbles = false;
	});
	
	//li.append(twig.value);
	
	if (twig.children && twig.children.length > 0)
	{
		li.addClass('indentreeOpen');
		
		var ul = $(document.createElement('ul'));
		
		for (var i = 0; i < twig.children.length; i++)
		{
			SimpleTreeToIndentreeRec(ul, twig.children[i]);
		}
		
		li.append(ul);
	}
}
function NewImage() {
	var obj = {};
	obj.type = 'image';
	obj.name = UniqueName('image', 1);
	obj.text = 'data:image/png;base64,' + 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAERJREFUOE9j3LJlCwMMeHt7w9lbt24lKM4A1AwH/5EAMeIDqJlUpyKrZxiimomJElxeG8CoosjZQzSqKHI2RQE2NDUDAEVWy5NpqgO1AAAAAElFTkSuQmCC';
	obj.display = 'visible';
	AddImage(obj);
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
}
function AddImage(obj) {
	var clientDiv = CreateComponentDiv($('#cells'), obj);
	RefreshImage(obj);
}
function RefreshImage(obj) {
	var div = obj.div;
	div.html('');
	var img = $(document.createElement('img'));
	img.attr('src', obj.text); // i used to prepend obj.text with 'data:image/png;base64,' but now i don't so that you can put URLs as obj.text and it still works
	div.append(img);
}
function NewBinary() {
	var obj = {};
	obj.type = 'binary';
	obj.name = UniqueName('binary', 1);
	obj.text = 'data:text/plain;base64,' + 'AAAA';
	obj.display = 'visible';
	RefreshBinaryDollar(obj);
	AddBinary(obj);
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
}
function AddBinary(obj) {
	var clientDiv = CreateComponentDiv($('#cells'), obj);
	RefreshBinaryDiv(obj);
}
function RefreshBinaryDiv(obj) {
	var div = obj.div;
	div.html('');
	div.text(obj.$.length); // or we could do a hexdump or something
}
function RefreshBinaryDollar(obj) {
	obj.$ = Griddl.IO.Base64StringToUint8Array(obj.text.substr('data:text/plain;base64,'.length));
}
function NewAudio() {
	var obj = {};
	obj.type = 'audio';
	obj.name = UniqueName('audio', 1);
	var pcms = Bloop();
	var wav = Music.MakeWav(pcms);
	var b64 = Griddl.IO.Uint8ArrayToBase64String(wav);
	obj.text = 'data:audio/wav;base64,' + b64;
	obj.$ = pcms;
	obj.display = 'visible';
	AddAudio(obj);
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
}
function AddAudio(obj) {
	var clientDiv = CreateComponentDiv($('#cells'), obj);
	//RefreshAudioPcmsFromText(obj);
	RefreshAudioDomElement(obj);
}
function RefreshAudioDomElement(obj) {
	var div = obj.div;
	div.html('');
	
	var audio = $(document.createElement('audio'));
	audio.attr('src', obj.text); // i used to prepend obj.text with 'data:audio/wav;base64,' but now i don't so that you can put URLs as obj.text and it still works
	audio.attr('controls', '');
	div.append(audio);
}
function RefreshAudioPcmsFromText(obj) {
	
	if (obj.text.substr(0, 'data:audio/wav;base64,'.length) == 'data:audio/wav;base64,')
	{
		var uint8Array = Griddl.IO.Base64StringToUint8Array(obj.text.substr('data:audio/wav;base64,'.length));
		var wav = Music.ReadWav(uint8Array);
		obj.$ = wav.xs[0];
	}
}
function Bloop() {
	
	var length = 44100 * 0.2;
	var x = new Int16Array(length);
	
	var amFreq = 0.5 / length * Math.PI * 2;
	var freq = 440 / 44100 * Math.PI * 2;
	var amp = 3000;
	
	for (var i = 0; i < length; i++)
	{
		var am = Math.sin(amFreq * i);
		var pcm = am * amp * Math.sin(freq * i);
		x[i] = pcm;
	}
	
	return x;
}
function NewDatgui() {
	var obj = {};
	obj.type = 'datgui';
	obj.name = UniqueName('datgui', 1);
	obj.text = '{ "foo" : "bar" }';
	obj.display = 'visible';
	obj.$ = JSON.parse(obj.text);
	AddDatgui(obj);
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
}
function AddDatgui(obj) {
	var clientDiv = CreateComponentDiv($('#cells'), obj); // this sets obj.div = clientDiv
	RefreshDatgui(obj);
}
function RefreshDatgui(obj) {
	var gui = new dat.GUI({ autoPlace : false });
	
	//var gui = new dat.GUI({ autoPlace : false });
	//var controller = gui.add(text, 'message');
	//gui.add(text, 'speed', -5, 5);
	//gui.add(text, 'displayOutline');
	////gui.add(text, 'explode');
	//gui.addColor(text, 'color0');
	//gui.addColor(text, 'color1');
	//gui.addColor(text, 'color2');
	//gui.addColor(text, 'color3');
	//gui.add(text, 'd').step(5); // Increment amount
	//gui.add(text, 'e', -5, 5); // Min and max
	//gui.add(text, 'f').min(0).step(0.25); // Mix and match
	//// Choose from accepted values
	//gui.add(text, 'selections', [ 'pizza', 'chrome', 'hooray' ] );
	//// Choose from named values
	//gui.add(text, 'c', { Stopped: 0, Slow: 0.1, Fast: 5 } );
	//var f1 = gui.addFolder('Folder');
	//f1.add(text, 'a');
	//f1.add(text, 'b');
	////f1.open();
	
	AddDatGuiFieldsRec(gui, obj.$);
	
	obj.div.append(gui.domElement);
	
	if (obj.display == 'hidden')
	{
		obj.div.parent().css('margin-bottom', '1em');
	}
	else
	{
		obj.div.parent().css('margin-bottom', '2em');
	}
}
function AddDatGuiFieldsRec(folder, obj) {
	
	for (var key in obj)
	{
		var val = obj[key];
		var type = typeof(val);
		
		if (type == 'string')
		{
			folder.add(obj, key);
		}
		else if (type == 'number')
		{
			folder.add(obj, key);
		}
		else if (type == 'object')
		{
			if (val.map) // check to see if it's an array - if so, assume it's a color
			{
				folder.addColor(obj, key);
			}
			else
			{
				var subfolder = folder.addFolder(key);
				AddDatGuiFieldsRec(subfolder, val);
			}
		}
	}
}

function NewTsv(obj) {
	var obj = {};
	obj.type = 'tsv';
	obj.name = UniqueName('tsv', 1);
	obj.text = '\tA\tB\tC\n0\t10\t20\t30\n1\t40\t50\t60\n2\t70\t80\t90';
	obj.matrix = TsvToMatrix(obj.text);
	//obj.matrix = [ [ '' , 'A' , 'B' , 'C' ] , [ '0' , '' , '' , '' ] , [ '1' , '' , '' , '' ] , [ '2' , '' , '' , '' ] ];
	obj.display = 'visible';
	obj.$ = MatrixToObjs(obj.matrix);
	AddTsv(obj);
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
}
function AddTsv(obj) {
	var clientDiv = CreateComponentDiv($('#cells'), obj);
	var pre = $(document.createElement('pre'));
	clientDiv.append(pre);
	pre.html(obj.text);
}
function RefreshTsv(obj) {
	obj.div.children().eq(0).html(obj.text);
}

function NewJson() {
	var obj = {};
	obj.type = 'json';
	obj.name = UniqueName('json', 1);
	obj.text = '{}';
	obj.display = 'visible';
	obj.$ = JSON.parse(obj.text);
	AddText(obj, 'javascript');
	MarkDirty();
	Griddl.objs[obj.name] = obj;
	Griddl.objs.push(obj);
}
function AddJson(obj, mode) {
	
	var clientDiv = CreateComponentDiv($('#cells'), obj);
	clientDiv.text('length: ' + obj.text.length);
	obj.$ = JSON.parse(obj.text);
	
	//var textbox = $(document.createElement('textarea'));
	//clientDiv.append(textbox);
	//obj.codemirror = CodeMirror.fromTextArea(textbox[0], { mode : mode , smartIndent : false , lineNumbers : true , lineWrapping : true });
	////obj.$ = obj.text; // this is a change from AddText above
	//obj.codemirror.getDoc().setValue(obj.text);
	//obj.codemirror.on('blur', function()
	//{
	//	obj.text = obj.codemirror.getValue();
	//	
	//	try
	//	{
	//		obj.$ = JSON.parse(obj.text);
	//	}
	//	catch (e)
	//	{
	//		// the parse has failed - display an error message - look at error handling code in MakeComponentsDiv to see how to display error message
	//	}
	//});
	//obj.codemirror.on('change', function() { MarkDirty(); });
}
function RefreshJson(obj) {
	obj.div.text('length: ' + obj.text.length);
}

// API
// GetDataSafe(name) -> GetData(name, []) // substitution for user code that used to call GetDataSafe
function GetData(name, defaultValue) {
	
	if (!Griddl.objs[name])
	{
		if (defaultValue !== undefined)
		{
			return defaultValue;
		}
		else
		{
			throw new Error("There is no object with named '" + name + "'");
		}
	}
	
	var obj = Griddl.objs[name];
	
	var data = null;
	
	// the distinction here is that handsontable automatically propagates changes to the interface to the backing object
	// whereas codemirror does not - so you have to pull directly from the interface
	if (obj.type == 'text' || obj.type == 'txt' || obj.type == 'js')
	{
		data = obj.codemirror.getDoc().getValue();
	}
	else if (obj.type == 'image')
	{
		data = obj.div[0].children[0];
	}
	else if (obj.type == 'audio')
	{
		data = obj.$;
	}
	else
	{
		data = obj.$;
	}
	
	return data;
}
function SetData(name, obj) {
	
	/*
	var component = Griddl.objs[name];
	var type = typeof(obj);
	
	// we'll need similar type checking for every component type
	
	if (component.type == 'image')
	{
		if (type == 'CanvasRenderingContext2D' || type == 'Griddl.Canvas')
		{
		
		}
		else if (type == 'HTMLCanvas')
		{
		
		}
		else if (type == 'string')
		{
			// we assume it's a base64 string
		}
		else
		{
			throw new Error();
		}
	}
	else if (component.type == 'audio')
	{
		if (type == 'Int16Array')
		{
			
		}
		else
		{
			throw new Error();
		}
	}*/
	
	Griddl.objs[name].$ = obj;
	Refresh(name);
}
function Refresh(name) {
	var obj = Griddl.objs[name]
	
	if (!obj)
	{
		throw new Error("There is no object with named '" + name + "'");
	}
	
	if (obj.type == 'grid')
	{
		RefreshObjGrid(obj);
	}
	else if (obj.type == 'matrix')
	{
		RefreshGrid(obj, null, null);
	}
	else if (obj.type == 'tree')
	{
		RefreshTree(obj);
	}
	else if (obj.type == 'text' || obj.type == 'txt')
	{
		RefreshText(obj);
	}
	else
	{
		throw new Error("'" + name + "' is of type '" + obj.type + "', which is not yet supported by Refresh()");
	}
}

function SetImage(name, canvasContext) {
	var text = canvasContext.canvas.toDataURL();
	var obj = Griddl.objs[name];
	obj.text = text;
	RefreshImage(obj);
}
function SetAudio(name, pcms) {
	var wav = Music.MakeWav(pcms);
	var b64 = Griddl.IO.Uint8ArrayToBase64String(wav);
	var text = 'data:audio/wav;base64,' + b64;
	
	var obj = Griddl.objs[name];
	obj.text = text;
	obj.$ = pcms;
	RefreshAudioDomElement(obj);
}

// there's also some pressure to just permit named objects in the tsv, and just roll with it
// somewhat related, we should allow tsv without object names or indexes, and then just number them 0,1,2 automatically
// the signal here being the presence or absense of a tab preceding the header line


// MakeObj([{key:'foo',val:1},{key:'bar',val:2}], 'key', 'val') => {foo:1,bar:2}
// MakeHash([{name:'foo',val:1},{name:'bar',val:2}], 'name') => {foo:{name:'foo',val:1},bar:{name:'bar',val:2}}
// Griddl.GetParams(name) -> Griddl.MakeObj(Griddl.GetData(name), 'key', 'val')
// Griddl.GetNamedObjects(name) -> Griddl.MakeHash(Griddl.GetData(name), 'name')

function MakeObj(objs, keyField, valField) {
	
	var ParseStringToObj = function(str) {
		
		var val = null;
		
		var c = str[0];
		
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
	
	var obj = {};
	for (var i = 0; i < objs.length; i++)
	{
		var key = objs[i][keyField];
		var val = objs[i][valField];
		obj[key] = ParseStringToObj(val);
	}
	
	return obj;
}
function MakeHash(objs, nameField) {
	
	var obj = {};
	
	for (var i = 0; i < objs.length; i++)
	{
		obj[objs[i][nameField]] = objs[i];
	}
	
	return obj;
}

function RunCode(name) {
	
	var obj = Griddl.objs[name]
	
	if (!obj)
	{
		throw new Error("There is no object with named '" + name + "'");
	}
	
	if (obj.type != 'js')
	{
		throw new Error("'" + name + "' is a " + obj.type + ", not an executable code object");
	}
	
	// this execution pathway should be merged into the existing pathway in CreateComponentDiv, so that it can have error checking
	(new Function('args', obj.codemirror.getValue()))();
}
function RunOnChange(gridName, codeName) {
	
	// if this function is part of the draw function, we have to deal with multiple subsequent calls
	// so we should try to determine whether the hook has already been attached to the table
	
	Griddl.objs[gridName].div.handsontable('getInstance').addHook('afterChange', function(changes, source) { RunCode(codeName); });
}

function Calculate(valueName, formulaName) {
	var values = GetData(valueName);
	var formulas = GetData(formulaName);
	
	var cells = new Array((formulas.length - 1) * (formulas[0].length - 1));
	
	var c = 0;
	for (var i = 1; i < formulas.length; i++)
	{
		for (var j = 1; j < formulas[i].length; j++)
		{
			var cell = {};
			cell.name = formulas[0][j].toString() + formulas[i][0].toString();
			cell.calculated = false;
			cell.visited = false;
			cell.formula = formulas[i][j];
			cell.value = null;
			
			cells[c++] = cell;
			cells[cell.name] = cell;
		}
	}
	
	for (var i = 0; i < cells.length; i++)
	{
		var cell = cells[i];
		
		if (!cell.calculated)
		{
			CalculateCell(cells, cell, i);
		}
	}
	
	c = 0;
	for (var i = 1; i < formulas.length; i++)
	{
		for (var j = 1; j < formulas[i].length; j++)
		{
			values[i][j] = cells[c].value;
			c++;
		}
	}
}
function CalculateCell(cells, cell, i) {
	
	if (cell.visited)
	{
		throw new Error('circular reference detected at cell ' + cell.name);
	}
	
	// ok, bind and apply only change what 'this' is bound to, which means that we still need to use the 'this' keyword in the formula, which is no good
	// so what we have to do is scan the formula text and add in 'this' or something
	
	// also, to evaluate recursively, we're going to need the access of a cell to be a function - we could potentially do this with getters and setters
	// or we can inject a Get() call into the code while scanning
	
	// plus it's worth looking into that spreadsheet example that used 'with' - this will only work for references within the table, but it's a start
	
	var fn = new Function(cell.formula.substr(1));
	
}

function MakePdf(griddlCanvas) {
	
	var objects = [];
	
	var catalog = { Type : "Catalog" , Pages : null };
	var pages = { Type : "Pages" , Count : griddlCanvas.pages.length , Kids : [] };
	catalog.Pages = pages;
	objects.push(catalog);
	objects.push(pages);
	
	var fontResourceDict = {}; // { F1 : 3 0 R , F2 : 4 0 R , etc. }
	var imageResourceDict = {};  // { Im1 : 5 0 R , Im2 : 6 0 R , etc. }
	
	// all fonts and images used in the document are put in separate objects here - page resource dicts refer to this section via indirect references
	
	// griddlCanvas.fontNameToIndex = { "Times-Roman" : 1 , "Helvetica" : 2 }
	// griddlCanvas.fontDict = { "F1" : "Times-Roman" , "F2" : "Helvetica" }
	for (var key in griddlCanvas.fontNameToIndex)
	{
		var fontId = 'F' + griddlCanvas.fontNameToIndex[key];
		
		var font = { Type : "Font" , Subtype : "Type1" , BaseFont : key }; // or lookup the font name in some global font dictionary to get the right font objects
		
		// TrueType
		// { Type : "Font" , Subtype : "TrueType" , BaseFont : "FontName" , FontDescriptor : 0 0 R } // font object
		// { Type : "FontDescriptor" , FontName : "FontName" , FontFile2 : 0 0 R } // font descriptor object
		// { Length1 : 713 } // stream dictionary for the font file - Length1 refers to the length after being decoded
		
		// OpenType
		// { Type : "Font" , Subtype : "TrueType" , BaseFont : "FontName" , FontDescriptor : 0 0 R } // font object - should the Subtype still be "TrueType"?
		// { Type : "FontDescriptor" , FontName : "FontName" , FontFile3 : 0 0 R } // font descriptor object
		// { Subtype : OpenType } // stream dictionary for the font file
		
		objects.push(font);
		fontResourceDict[fontId] = font;
	}
	
	// griddlCanvas.imageDict = { "Im1" : XObject1 , "Im2" : XObject2 }
	for (var key in griddlCanvas.imageDict)
	{
		var xObject = griddlCanvas.imageDict[key];
		
		objects.push(xObject);
		imageResourceDict[key] = xObject;
	}
	
	for (var i = 0; i < griddlCanvas.pages.length; i++)
	{
		var pg = griddlCanvas.pages[i];
		var commands = pg.pdfCommands.join('\r\n');
		
		var page = { Type : "Page" , Parent : pages , MediaBox : [ 0 , 0 , pg.width , pg.height ] , Resources : { Font : {} , XObject : {} } , Contents : null };
		var pagecontent = { Length : commands.length , "[stream]" : commands };
		
		// so, the *correct* approach here would be to only put the resources that are necessary to the page in the page's resource dict
		// however, that requires bookkeeping, and for what?  to save a few bytes?
		// so instead, we're just going to load the page's resource dict with the pointers to all fonts and images found in the document
		//if (pg.fontDict) { page.Resources.Font = pg.fontDict; }
		//if (pg.imageDict) { page.Resources.XObject = pg.imageDict; }
		page.Resources.Font = fontResourceDict;
		page.Resources.XObject = imageResourceDict;
		
		// this is the ducktape code for fonts that we use right now
		//page.Resources.Font.F1 = font;
		
		page.Contents = pagecontent;
		pages.Kids.push(page);
		objects.push(page);
		objects.push(pagecontent);
	}
	
	for (var i = 0; i < objects.length; i++)
	{
		objects[i]['[index]'] = i + 1;
	}
	
	var objstarts = [];
	var bytes = 0;
	
	var filelines = [];
	filelines.push('%PDF-1.7');
	filelines.push('');
	
	var bytes = '%PDF-1.7\r\n\r\n'.length;
	
	for (var i = 0; i < objects.length; i++)
	{
		var obj = objects[i];
		var objlines = [];
		
		objstarts.push(bytes);
		
		objlines.push(obj['[index]'].toString() + ' 0 obj');
		objlines.push(WritePdfObj(obj, false));
		
		if (obj['[stream]'])
		{
			objlines.push('stream');
			objlines.push(obj['[stream]']);
			objlines.push('endstream');
		}
		
		objlines.push('endobj');
		objlines.push('');
		
		var objstr = objlines.join('\r\n');
		bytes += objstr.length;
		filelines.push(objstr);
	}
	
	var xrefstart = bytes;
	
	filelines.push('xref');
	filelines.push('0 ' + (objects.length + 1).toString());
	filelines.push('0000000000 65535 f');
	for (var i = 0; i < objects.length; i++)
	{
		var bytestart = objstarts[i].toString();
		var len = bytestart.length;
		var line = '';
		for (var k = 0; k < 10 - len; k++)
		{
			line += '0';
		}
		line += bytestart + ' 00000 n';
		filelines.push(line);
	}
	
	filelines.push('trailer');
	filelines.push('<<');
	filelines.push('/Size ' + (objects.length + 1).toString());
	if (objects[0].Type != 'Catalog') { throw new Error(); } // check for the assumption that root is 1 0 R
	filelines.push('/Root 1 0 R');
	filelines.push('>>');
	filelines.push('startxref');
	filelines.push(xrefstart.toString());
	filelines.push('%%EOF');
	return filelines.join('\r\n');
}
function WritePdfDict(obj) {
	var str = '';
	str += '<<';
	str += '\r\n';
	for (var key in obj)
	{
		if (key[0] != '[') // avoid [index], [stream], etc. fields
		{
			str += '/' + key + ' ';
			str += WritePdfObj(obj[key], true);
			str += '\r\n';
		}
	}
	str += '>>';
	//str += '\r\n';
	return str;
}
function WritePdfList(obj) {
	var str = '';
	str += '[ ';
	for (var key in obj)
	{
		str += WritePdfObj(obj[key], true);
		str += ' ';
	}
	str += ']';
	return str;
}
function WritePdfObj(obj, canBeIndirect) {
	var s = null;
	var type = typeof(obj);
	
	if (type == 'object')
	{
		if (canBeIndirect && obj['[index]'])
		{
			s = obj['[index]'].toString() + ' 0 R';
		}
		else
		{
			if (obj.concat) // this is how we test for a list
			{
				s = WritePdfList(obj);
			}
			else
			{
				s = WritePdfDict(obj);
			}
		}
	}
	else if (type == 'number')
	{
		s = obj.toString();
	}
	else if (type == 'string')
	{
		if (obj[0] == '"')
		{
			s = '(' + obj.substring(1, obj.length - 1) + ')';
		}
		else
		{
			s = '/' + obj.toString();
		}
	}
	else
	{
		throw new Error();
	}
	
	return s;
}

function ExportLocalCanvas(filename) {
	//var text = Canvas2Image.saveAsPNG(document.getElementById(canvasId)); // keep this here - it may need to be resurrected to resolve compatibility problems
	var text = document.getElementsByTagName('canvas')[0].toDataURL();
	var downloadLink = document.createElement('a');
	var url = window.URL;
	//downloadLink.href = url.createObjectURL(new Blob([text], {type : 'image/png'}));
	downloadLink.href = text;
	downloadLink.download = filename + '.png';
	document.body.appendChild(downloadLink); // needed for this to work in firefox
	downloadLink.click();
	document.body.removeChild(downloadLink); // cleans up the addition above
}
function ExportLocal(canvasId, filename) {
	//var text = Canvas2Image.saveAsPNG(document.getElementById(canvasId)); // keep this here - it may need to be resurrected to resolve compatibility problems
	var text = document.getElementById(canvasId).toDataURL();
	var downloadLink = document.createElement('a');
	var url = window.URL;
	//downloadLink.href = url.createObjectURL(new Blob([text], {type : 'image/png'}));
	downloadLink.href = text;
	downloadLink.download = filename + '.png';
	document.body.appendChild(downloadLink); // needed for this to work in firefox
	downloadLink.click();
	document.body.removeChild(downloadLink); // cleans up the addition above
}
function ExportLocalSvg(svgId, filename) {
	//var text = document.getElementById(svgId).outerHTML;
	var text = document.getElementsByTagName('svg')[0].outerHTML;
	var downloadLink = document.createElement('a');
	var url = window.URL;
	downloadLink.href = url.createObjectURL(new Blob([text], {type : 'text/html'}));
	downloadLink.download = filename + '.svg';
	document.body.appendChild(downloadLink); // needed for this to work in firefox
	downloadLink.click();
	document.body.removeChild(downloadLink); // cleans up the addition above
}
function ExportLocalPdf(drawfunction, filename) {
	
	drawPdf = true;
	Griddl.RunCode(drawfunction);
	
	var RenderPdf = function() {
		
		drawPdf = false;
		
		var text = MakePdf(griddlCanvas); // right now the Canvas constructor sets griddlCanvas whenever it is invoked
		
		var downloadLink = document.createElement('a');
		var url = window.URL;
		downloadLink.href = url.createObjectURL(new Blob([text], {type : 'text/pdf'}));
		downloadLink.download = filename + '.pdf';
		document.body.appendChild(downloadLink); // needed for this to work in firefox
		downloadLink.click();
		document.body.removeChild(downloadLink); // cleans up the addition above
	}
	
	if (window.MathJax) { MathJax.Hub.Queue(RenderPdf); } else { RenderPdf(); }
}

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

function TsvToMatrix(text) {
	
	var lines = Lang.Linize(text);
	var matrix = [];
	
	for (var i = 0; i < lines.length; i++)
	{
		var row = lines[i];
		var cols = Lang.Tokenize(row, '\t');
		matrix.push(cols);
	}
	
	return matrix;
}
function MatrixToObjs(matrix) {
	
	//	a	b	c
	//0	10	20	30
	//1	40	50	60
	//2	70	80	90
	
	// or
	
	//a	b	c
	//10	20	30
	//40	50	60
	//70	80	90
	
	// row headers or not: the signal is whether matrix[0][0] is the empty string or contains a value
	// if there are row headers, we set start to 1 so as to skip them.  if not, set start to 0
	
	var start = null;
	
	if (matrix[0][0] == '')
	{
		start = 1;
	}
	else
	{
		start = 0;
	}
	
	var keys = [];
	
	for (var j = start; j < matrix[0].length; j++)
	{
		keys.push(matrix[0][j]);
	}
	
	var objects = [];
	
	for (var i = 1; i < matrix.length; i++)
	{
		var obj = {};
		
		for (var j = start; j < matrix[i].length; j++)
		{
			obj[keys[j - start]] = matrix[i][j];
		}
		
		objects.push(obj);
	}
	
	return objects;
}
function ObjsToJoinedLines(objects) {
	var lines = [];
	
	var colHeaders = []; for (var key in objects[0]) { colHeaders.push(key); }
	lines.push('\t' + colHeaders.join('\t'));
	
	for (var i = 0; i < objects.length; i++)
	{
		var entries = [];
		entries.push(i.toString());
		
		for (var key in objects[i])
		{
			var val = objects[i][key];
			var str = '';
			
			if (val != null)
			{
				str = val.toString();
			}
			
			entries.push(str);
		}
		
		lines.push(entries.join('\t'));
	}
	
	return lines.join('\r\n');
}
function MatrixToJoinedLines(matrix) {
	var lines = [];
	
	for (var i = 0; i < matrix.length; i++)
	{
		var entries = [];
		
		for (var j = 0; j < matrix[i].length; j++)
		{
			var entry = matrix[i][j];
			var str = '';
			if (entry != null) { str = entry.toString(); }
			entries.push(str);
		}
		
		lines.push(entries.join('\t'));
	}
	
	return lines.join('\r\n');
}

// i believe the point of this is to be able to define a function in one component and then call it from another component - this parses the name and args and makes the fn accessible
function ReadUserDefinedFunction(str) {
	var brace0 = 0;
	var brace1 = 0;
	
	for (var i = 0;      i < str.length; i++) { if (str[i] == "{") { brace0 = i; break; } }
	for (var i = str.length - 1; i >= 0; i--) { if (str[i] == "}") { brace1 = i; break; } }
	
	var signature = str.substring(0, brace0);
	var body = str.substring(brace0 + 1, brace1);
	
	var paren0 = 0;
	var paren1 = 0;
	
	for (var i = 0;      i < signature.length; i++) { if (signature[i] == "(") { paren0 = i; break; } }
	for (var i = signature.length - 1; i >= 0; i--) { if (signature[i] == ")") { paren1 = i; break; } }
	
	var name = "";
	
	for (var i = paren0 - 1; i >= 0; i--)
	{
		var c = signature[i];
		var n = signature.charCodeAt(i);
		
		// $ = 36, _ = 95
		if (65 <= n && n <= 90 || 97 <= n && n <= 122 || n == 36 || n == 95) { name = c + name; }
		else { if (name.length > 0) { break; } }
	}
	
	var arglist = signature.substring(paren0 + 1, paren1);

	var argnames = [];
	var arg = "";
	
	for (var i = 0; i < arglist.length; i++)
	{
		var c = arglist[i];
		var n = arglist.charCodeAt(i);
		
		// $ = 36, _ = 95
		if (65 <= n && n <= 90 || 97 <= n && n <= 122 || n == 36 || n == 95) { arg += c; }
		else { if (arg.length > 0) { argnames.push(arg); arg = ""; } }
	}
	
	if (arg.length > 0) { argnames.push(arg); }
	
	var functor = {}
	functor.name = name;
	functor.body = body; // for serialization
	functor.args = []; for (var i = 0; i < argnames.length; i++) { functor.args.push(argnames[i]); } // functor.args = argnames; ?
	functor.f = Function(argnames.join(","), body);
	
	return functor;
}

// who calls these?  some old code that generates handsontables, now commented out, to get the column widths right
function TextWidth(text, font) {
	// re-use canvas object for better performance
	var canvas = TextWidth.canvas || (TextWidth.canvas = document.createElement('canvas'));
	var context = canvas.getContext('2d');
	context.font = font;
	var metrics = context.measureText(text);
	return metrics.width;
}
function DetermineColWidths(data, font, minLengthsEm) {
	
	var em = TextWidth('m', font);
	
	if (data.length == 0) { return; }
	
	var maxLengths = [];
	
	var c = 0;
	
	for (var header in data[0])
	{
		var max = 0;
		
		for (var i = 0; i < data.length; i++)
		{
			max = Math.max(max, TextWidth(data[i][header].toString(), font));
		}
		
		if (minLengthsEm)
		{
			max = Math.max(max, minLengthsEm[c++] * em);
		}
		
		maxLengths.push(max + 20);
	}
	
	return maxLengths;
}

// type : 'POST' , // so, we kinda had trouble getting django to accept a POST.  so we're saving with GET.  this is bad web practice sosorry.
function SaveRemote(workbookName) { $.ajax( { url : '/save/' + workbookName , data : { text : SaveToText() } }); }
function SaveAjax() {
	// we need to set the text= key of the POST data dynamically, before the form is submitted
	
	
	var saveForm = $('#saveForm');
	saveForm.submit(function() {
		$('#saveFormTextInput').val(SaveToText());
		$.ajax({
			type: saveForm.attr('method'),
			url: saveForm.attr('action'),
			data: saveForm.serialize(),
			success: function (data) {
				$('#saveMenuButton').css('color', 'rgb(0, 0, 0)'); // this must match the 'on' color in MarkDirty()
				$('#saveasMenuButton').css('color', 'rgb(0, 0, 0)');
			},
			error: function(data) {
				// by virtue of the button text remaining red, we know that the save did not go through.  but we could also do an alert popup or something
				//$("#MESSAGE-DIV").html("Something went wrong!");
			}
		});
		return false;
	});
	
	
	var saveasForm = $('#saveasForm');
	saveasForm.submit(function() {
		$('#saveasFormTextInput').val(SaveToText());
		$.ajax({
			type: saveasForm.attr('method'),
			url: saveasForm.attr('action'),
			data: saveasForm.serialize(),
			success: function (redirectUrl) {
				document.location.replace(redirectUrl);
				//$("#SOME-DIV").html(data);
			},
			error: function(data) {
				//$("#MESSAGE-DIV").html("Something went wrong!");
			}
		});
		return false;
	});
}
function AjaxSuccess(data) {
	HideLoginModal();
	//$('#saveMenuButton').css('visibility', 'visible');
	//$('#saveasMenuButton').css('visibility', 'visible');
	
	// the returned data is "13\t<input type='hidden' name='csrfmiddlewaretoken' value='b5uxXzLhhUx0hwp9mSvcWDhTdWP2r1Hu' />", where the pk of the logged-in user is 13
	var loggedInUser = parseInt(data.split('\t')[0]);
	var newcsrftoken = data.split('\t')[1].substr(55, 32); // the returned data is "<input type='hidden' name='csrfmiddlewaretoken' value='b5uxXzLhhUx0hwp9mSvcWDhTdWP2r1Hu' />"
	$('[name=csrfmiddlewaretoken]').attr('value', newcsrftoken); // does this replace all of the tokens?
	
	// if the user is not the owner of the workbook, we don't want to activate the save button, only the save as button
	
	if (owner == loggedInUser)
	{
		$('#saveMenuButton').removeAttr('disabled');
		
		if ($('#saveMenuButton').data('color') == 'red')
		{
			$('#saveMenuButton').css('color', 'red');
		}
		else
		{
			$('#saveMenuButton').css('color', 'black');
		}
	}
	
	$('#saveasMenuButton').removeAttr('disabled');
	
	if ($('#saveasMenuButton').data('color') == 'red')
	{
		$('#saveasMenuButton').css('color', 'red');
	}
	else
	{
		$('#saveasMenuButton').css('color', 'black');
	}
	
	$('#profileLink').css('visibility', 'visible');
	$('#loginLink').css('display', 'none');
	$('#logoutLink').css('display', 'inline');
}
function AjaxFailure(form, data) { form.append('<span style="color:red;">' + data.responseText + '</span>'); }

// these functions are used in user code
Griddl.GetData = GetData;
Griddl.SetData = SetData;
Griddl.RunCode = RunCode;
Griddl.RunOnChange = RunOnChange;

Griddl.MakeObj = MakeObj;
Griddl.MakeHash = MakeHash;

Griddl.SetImage = SetImage; // we should have just a general function that extracts an Image object from a canvas, then we can pass that Image to SetData like anything else
//Griddl.SetAudio = SetAudio;
Griddl.Refresh = Refresh; // can be lightly documented - Refresh is rarely called except through SetData.  but if e.g. a UI event sets one slot and you want to see the diff, you can call Refresh().  so i anticipate calling this mostly if i'm developing UI code

// these are all in the HTML templates, in buttons and such - no need to document them for the user
Griddl.Main = Main;
Griddl.NewText = NewText;
Griddl.NewJs = NewJs;
Griddl.NewJson = NewJson;
Griddl.NewHtml = NewHtml;
Griddl.NewCss = NewCss;
Griddl.NewGrid = NewGrid;
Griddl.NewMatrix = NewMatrix;
Griddl.NewTable = NewTable;
Griddl.NewTsv = NewTsv
Griddl.NewTree = NewTree;
Griddl.NewImage = NewImage;
Griddl.NewAudio = NewAudio;
Griddl.NewDatgui = NewDatgui;
Griddl.NewBinary = NewBinary;
Griddl.ReorderComponents = ReorderComponents;
Griddl.ExportLocalCanvas = ExportLocalCanvas;
Griddl.ExportLocalSvg = ExportLocalSvg;
Griddl.ExportLocalPdf = ExportLocalPdf;

Griddl.IO = (function() {

function DownloadWorkbook() {

	var filename = $('title').text();
	var text = SaveToText();
	
	var downloadLink = document.createElement('a');
	var url = (window.webkitURL != null ? window.webkitURL : window.URL);
	downloadLink.href = url.createObjectURL(new Blob([text], {type : 'text/plain'}));
	downloadLink.download = filename + '.txt';
	downloadLink.click();
}
function UploadWorkbook() {
	var fileChooser = document.getElementById('fileChooser');
	fileChooser.click();
}
function HandleLocalLoad(files) {
	// this handles load of a new workbook
	var fileReader = new FileReader();
	
	fileReader.onload = function(event)
	{
		//var x = new Uint8Array(event.target.result, 0, event.target.result.byteLength); // for readAsArrayBuffer
		
		$('#cells').children().remove();
		
		var text = event.target.result;
		
		//$('#frce').text(text);
		//Griddl.Main();
		
		// dummy version that just diplays the workbook in a textarea
		$('#cells').remove();
		var textarea = $(document.createElement('textarea'));
		textarea.text(text);
		$('#frce').append(textarea);
		$('#frce').css('display', 'block');
		$('#frce').css('position', 'absolute');
		$('#frce').css('left', '3em');
		$('#frce').css('top', '5em');
		textarea.css('width', '40em');
		textarea.css('height', '50em');
	};
	
	if (files.length > 0)
	{
		var f = files[0];
		$('title').text(f.name.substr(0, f.name.length - 4));
		fileReader.readAsText(f); // when this is done, it will call fileReader.onload(event)
		//fileReader.readAsArrayBuffer(f); // when this is done, it will call fileReader.onload(event)
	}
}

// $.ajax(
// {
// 	dataType : 'json' ,
// 	url : url ,
// 	error : function() { debugger; } ,
// 	success : function(obj) { DoSomething(obj); }
// });

function LoadRemote(url, callback) {
	var xmlhttp = null;
	
	if (window.XMLHttpRequest) // code for IE7+, Firefox, Chrome, Opera, Safari
	{
		xmlhttp = new XMLHttpRequest();
	}
	else // code for IE6, IE5
	{
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	xmlhttp.onreadystatechange = function()
	{
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
		{
			callback(xmlhttp.responseText);
		}
	};
	
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}
function LoadRemoteBytes(url, callback) {
	var xmlhttp = null;
	
	if (window.XMLHttpRequest) // code for IE7+, Firefox, Chrome, Opera, Safari
	{
		xmlhttp = new XMLHttpRequest();
	}
	else // code for IE6, IE5
	{
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	xmlhttp.responseType = "arraybuffer";
	
	xmlhttp.onreadystatechange = function()
	{
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
		{
			var arrayBuffer = xmlhttp.response; // note: not 'responseText'
			var byteArray = new Uint8Array(arrayBuffer);
			callback(byteArray);
		}
	};
	
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}
function SaveLocal(url, uint8array) {
	var str = "";
	
	for (var i = 0; i < uint8array.length; i++)
	{
		str += String.fromCharCode(uint8array[i]);
	}
	
	var base64encoded = btoa(str);
	
	var s = "";
	s += "data:image/octet-stream"; // 'image' is, i believe, arbitrary.  octet-streams are all the same.
	s += ";base64";
	s += ",";
	s += base64encoded;
	
	//document.location.pathname = '/download.wav'; // this does not do anything
	document.location.href = s; 
}
function SaveLocalStr(url, str) {
	for (var i = 0; i < str.length; i++)
	{
		var n = str.charCodeAt(i);
		
		if (n >= 0x80)
		{
			throw new Error();
		}
	}
	
	var base64encoded = btoa(str);
	
	var s = "";
	s += "data:image/octet-stream";
	s += ";base64";
	s += ",";
	s += base64encoded;
	
	//document.location.pathname = url;
	document.location.href = s; 
}
function SaveRemote(url, blob) {
	var xmlhttp = null;
	
	if (window.XMLHttpRequest) // code for IE7+, Firefox, Chrome, Opera, Safari
	{
		xmlhttp = new XMLHttpRequest();
	}
	else // code for IE6, IE5
	{
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	xmlhttp.open("PUT", url, true);
	xmlhttp.send(blob);
}
function LoadRemoteJson(url, obj) {
	//var name = url.substring(url.lastIndexOf("/"));
	//name = name.substring(0, name.length - 5); // chop off the trailing ".json"
	//globals.canvas[name] = JSON.parse(xmlhttp.responseText);
}
function SaveRemoteJson(url, obj) {
	var blob = JSON.stringify(obj);
	SaveRemote(url, blob);
}
function SaveRemoteLines(url, lines) {
	var blob = lines.join("\r\n") + "\r\n";
	SaveRemote(url, blob);
}


// data URI syntax: data:[<mediatype>][;base64],<data>

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
// https://developer.mozilla.org/en-US/docs/data_URIs

// In JavaScript there are two functions respectively for decoding and encoding base64 strings:
// btoa() // encode from binary string to base64
// atob() // decode from base64

// Functions which natively return Base64-encoded strings in JavaScript:
// The readAsDataURL() method of the FileReader API
// The toDataURL() and toDataURLHD() methods of the HTMLCanvasElement interface

// base64 encoding in a nutshell:
// A-Z = 0-25 ('A' is ASCII 65, 'Z' is ASCII 90)
// a-z = 26-51 ('a' is ASCII 97, 'z' is ASCII 122)
// 0-9 = 52-61 ('0' is ASCII 48, '9' is ASCII 57)
// + = 62 ('+' is ASCII 43)
// / = 63 ('/' is ASCII 47)

// b64ToUint6('a'.charCodeAt(0)) => 26
// uint6ToB64(26) => 97 (which is 'a')

// 3 octets become 4 sextets
// if there are 1 or 2 extra bytes, pad the rest with 00000000
// signal this by appending a '==' if 2 bytes are missing (meaning a one byte remainder) or '=' if 1 byte is missing (meaning a two byte remainder)

// "abc" => ""
// "ab" => ""
// "a" => ""

// single character - base64 character => integer in the range 0-63
function b64ToUint6(nChr) {
	return nChr > 64 && nChr < 91 ?
		nChr - 65
	: nChr > 96 && nChr < 123 ?
		nChr - 71
	: nChr > 47 && nChr < 58 ?
		nChr + 4
	: nChr === 43 ?
		62
	: nChr === 47 ?
		63
	:
		0;
}

// single character - integer in the range 0-63 => base64 character
function uint6ToB64(nUint6) {
	return nUint6 < 26 ?
		nUint6 + 65
	: nUint6 < 52 ?
		nUint6 + 71
	: nUint6 < 62 ?
		nUint6 - 4
	: nUint6 === 62 ?
		43
	: nUint6 === 63 ?
		47
	:
		65;
}

function Base64StringToUint8Array(str) {
	var nBlocksSize = 3;
	var sB64Enc = str.replace(/[^A-Za-z0-9\+\/]/g, ""); // remove all non-eligible characters from the string
	var nInLen = sB64Enc.length;
	var nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2;
	var taBytes = new Uint8Array(nOutLen);
	
	for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++)
	{
		nMod4 = nInIdx & 3;
		nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
		
		if (nMod4 === 3 || nInLen - nInIdx === 1)
		{
			for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++)
			{
				taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
			}
			
			nUint24 = 0;
		}
	}
	
	return taBytes;
}
function Uint8ArrayToBase64String(aBytes) {
	var nMod3 = '';
	var sB64Enc = '';
	
	for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++)
	{
		nMod3 = nIdx % 3;
		//if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
		nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
		
		if (nMod3 === 2 || aBytes.length - nIdx === 1)
		{
			var a = uint6ToB64(nUint24 >>> 18 & 63);
			var b = uint6ToB64(nUint24 >>> 12 & 63);
			var c = uint6ToB64(nUint24 >>> 06 & 63);
			var d = uint6ToB64(nUint24 >>> 00 & 63);
			sB64Enc += String.fromCharCode(a, b, c, d);
			nUint24 = 0;
		}
	}
	
	return sB64Enc.replace(/A(?=A$|$)/g, "=");
}
function UTF8ByteArrayToUnicodeString(aBytes) {
	var sView = "";
	
	for (var nPart, nLen = aBytes.length, nIdx = 0; nIdx < nLen; nIdx++)
	{
		nPart = aBytes[nIdx];
		
		sView += String.fromCharCode(
			nPart > 251 && nPart < 254 && nIdx + 5 < nLen ? /* six bytes */
			/* (nPart - 252 << 32) is not possible in ECMAScript! So...: */
			(nPart - 252) * 1073741824 + (aBytes[++nIdx] - 128 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
			: nPart > 247 && nPart < 252 && nIdx + 4 < nLen ? /* five bytes */
			(nPart - 248 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
			: nPart > 239 && nPart < 248 && nIdx + 3 < nLen ? /* four bytes */
			(nPart - 240 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
			: nPart > 223 && nPart < 240 && nIdx + 2 < nLen ? /* three bytes */
			(nPart - 224 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
			: nPart > 191 && nPart < 224 && nIdx + 1 < nLen ? /* two bytes */
			(nPart - 192 << 6) + aBytes[++nIdx] - 128
			: /* nPart < 127 ? */ /* one byte */
			nPart
		);
	}
	
	return sView;
}
function UnicodeStringToUTF8ByteArray(str) {
	var aBytes = null
	var nChr = null;
	var nStrLen = str.length;
	var nArrLen = 0;
	
	/* mapping... */
	
	for (var i = 0; i < nStrLen; i++)
	{
		nChr = str.charCodeAt(i);
		nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
	}
	
	aBytes = new Uint8Array(nArrLen);
	
	/* transcription... */
	
	for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++)
	{
		nChr = str.charCodeAt(nChrIdx);
	
		if (nChr < 128)
		{
			/* one byte */
			aBytes[nIdx++] = nChr;
		}
		else if (nChr < 0x800)
		{
			/* two bytes */
			aBytes[nIdx++] = 192 + (nChr >>> 6);
			aBytes[nIdx++] = 128 + (nChr & 63);
		}
		else if (nChr < 0x10000)
		{
			/* three bytes */
			aBytes[nIdx++] = 224 + (nChr >>> 12);
			aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
			aBytes[nIdx++] = 128 + (nChr & 63);
		}
		else if (nChr < 0x200000)
		{
			/* four bytes */
			aBytes[nIdx++] = 240 + (nChr >>> 18);
			aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
			aBytes[nIdx++] = 128 + (nChr & 63);
		}
		else if (nChr < 0x4000000)
		{
			/* five bytes */
			aBytes[nIdx++] = 248 + (nChr >>> 24);
			aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
			aBytes[nIdx++] = 128 + (nChr & 63);
		}
		else /* if (nChr <= 0x7fffffff) */
		{
			/* six bytes */
			aBytes[nIdx++] = 252 + /* (nChr >>> 32) is not possible in ECMAScript! So...: */ (nChr / 1073741824);
			aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
			aBytes[nIdx++] = 128 + (nChr & 63);
		}
	}
	
	return aBytes;
}

var IO = {};
IO.HandleLocalLoad = HandleLocalLoad;
IO.DownloadWorkbook = DownloadWorkbook;
IO.UploadWorkbook = UploadWorkbook;
IO.Base64StringToUint8Array = Base64StringToUint8Array;
IO.Uint8ArrayToBase64String = Uint8ArrayToBase64String;
IO.UTF8ByteArrayToUnicodeString = UTF8ByteArrayToUnicodeString;
IO.UnicodeStringToUTF8ByteArray = UnicodeStringToUTF8ByteArray;
return IO;

})();

var Lang = (function() {

// takes a simply-indented lines of text, one string per line, returns a list of twigs: [ { value : "" , children : [] } ]
function ReadTreeSimple(lines) {
	
	// a very simple tree structure - one token per line, prefixed by 2 spaces per indent
	// Seq
	//   a
	//   Alt
	//     b
	//     c
	//   d
	
	var twigs = [];
	
	var parents = [];
	
	var firstindent = null;
	
	for (var i = 0; i < lines.length; i++)
	{
		var indent = 0;
		var twig = {};
		twig.children = [];
		twigs.push(twig);
		
		var line = lines[i].trimRight(); // cut trailing whitespace, which can happen if you copy-paste a tree from excel, where you have a rectangular copy area
		
		for (var k = 0; k < line.length; k++)
		{
			if (line[k] == ' ' || line[k] == '\t')
			{
				indent++;
			}
			else
			{
				twig.value = line.substr(k);
				break;
			}
		}
		
		if (firstindent == null && indent > 0)
		{
			firstindent = indent;
		}
		
		if (firstindent != null) // if firstindent is null, indent should be 0 anyway
		{
			indent /= firstindent; // n spaces/tabs per indent
		}
		
		if (indent == 0)
		{
			//twig.parent = null;
		}
		else
		{
			var parentTwig = parents[indent - 1];
			//twig.parent = parentTwig;
			parentTwig.children.push(twig);
		}
		
		parents[indent] = twig;
	}
	
	return twigs;
}
function WriteTreeSimple(root) {
	var lines = [];
	WriteTreeSimpleRec(0, lines, root);
	return lines;
}
function WriteTreeSimpleRec(indent, lines, twig) {
	var line = '';
	for (var i = 0; i < indent; i++) { line += ' '; }
	line += twig.value;
	lines.push(line);
	
	for (var i = 0; i < twig.children.length; i++)
	{
		WriteTreeSimpleRec(indent + 1, lines, twig.children[i]);
	}
}

function LoadGrid(scope, grid, matrix) {
	// matrix is just a 2D array of strings - the grid/obj/field names and the cell formulas
	
	var dataName = matrix[0][0];
	var slot = MakeSlot(scope, dataName);
	scope[dataName] = slot;
	var data = MakeObj(slot, "$");
	slot.$ = data;
	data["[type]"] = "Collection";
	
	slot.react = DistributeAllFieldFormulas;
	slot["[fieldSlots]"] = MakeObj(slot, "[fieldSlots]"); // this has to be on the slot, not the data, because the data can be obliterated by the code
	// also, now that it's on the slot, rather than the data, we could probably make it a non-bracketed field
	
	if (grid.rowsAre == "objs")
	{
		for (var rowi = 1; rowi < matrix.length; rowi++)
		{
			var objName = matrix[rowi][0];
			var objSlot = MakeSlot(data, objName, null);
			SetStructField(slot, objName, objSlot);
			//data[objName] = objSlot;
			var obj = MakeObj(objSlot, "$");
			objSlot.$ = obj;
			
			for (var colj = 1; colj < matrix[0].length; colj++)
			{
				var fieldName = matrix[0][colj];
				var fieldSlot = MakeSlot(obj, fieldName, null);
				
				SetStructField(objSlot, fieldName, fieldSlot);
				//obj[fieldName] = fieldSlot;
				
				fieldSlot.formula = matrix[rowi][colj];
				CompileCode(fieldSlot, fieldSlot.formula);
			}
		}
	}
	else
	{
		for (var colj = 1; colj < matrix[0].length; colj++)
		{
			var objName = matrix[0][colj];
			var objSlot = MakeSlot(data, objName, null);
			SetStructField(slot, objName, objSlot);
			//data[objName] = objSlot;
			var obj = MakeObj(objSlot, "$");
			objSlot.$ = obj;
			
			for (var rowi = 1; rowi < matrix.length; rowi++)
			{
				var fieldName = matrix[rowi][0];
				var fieldSlot = MakeSlot(obj, fieldName, null);
				
				SetStructField(objSlot, fieldName, fieldSlot);
				//obj[fieldName] = fieldSlot;
				
				fieldSlot.formula = matrix[rowi][colj];
				CompileCode(fieldSlot, fieldSlot.formula);
			}
		}
	}
	
	SetGridDataSlot(grid, slot);
	
	grid.top.$ = 0;
	grid.left.$ = 0;
	
	//Calculate();
	
	RedisplayGrid(grid);
}
function SetStructField(structSlot, fieldName, fieldSlot) {
	var struct = Get(structSlot);
	struct[fieldName] = fieldSlot;
	AddEdge(fieldSlot.node, structSlot.node, "[part]", Edge.Part);
}
function AddBoxReacts(grid) {
	var data = Get(grid.obj);
	
	for (var i = 0; i < grid.objs.length; i++)
	{
		var obj = Get(data[i]);
		
		obj.left.react = ReactBox;
		obj.top.react = ReactBox;
		obj.width.react = ReactBox;
		obj.height.react = ReactBox;
		obj.cx.react = ReactBox;
		obj.cy.react = ReactBox;
		obj.bottom.react = ReactBox;
		obj.right.react = ReactBox;
		obj.hr.react = ReactBox;
		obj.wr.react = ReactBox;
		obj.reactive = MakeSlot(obj, "reactive", true);
		obj.hLocked = MakeSlot(obj, "hLocked", "width");
		obj.vLocked = MakeSlot(obj, "vLocked", "height");
	}
}
function LoadTree(tree, lines, textOnly) {
	var dataSlot = MakeSlot(tree, "obj");
	tree.obj = dataSlot;
	
	//data["[type]"] = "Collection";
	
	var budField = tree.budField;
	var childrenField = tree.childrenField;
	
	var parents = [];
	
	for (var i = 0; i < lines.length; i++)
	{
		var indent = 0;
		var formula = null;
		
		for (var k = 0; k < lines[i].length; k++)
		{
			if (lines[i][k] == ' ')
			{
				indent++;
			}
			else
			{
				formula = lines[i].substr(k);
				break;
			}
		}
		
		indent /= 2; // two spaces per indent
	
		//var cols = Tokenize(lines[i], '\t');
		//var indent = parseInt(cols[0]);
		//var formula = cols[1];
		
		var twigSlot = null;
		var twig = null;

		if (indent == 0)
		{
			twigSlot = dataSlot;
			twig = MakeObj(twigSlot, "$");
			twigSlot.$ = twig;
			
			twig.parent = null;
		}
		else
		{
			var parentTwig = parents[indent - 1];
			
			twigSlot = MakeSlot(parentTwig[childrenField], parentTwig[childrenField].length.toString());
			twig = MakeObj(twigSlot, "$");
			twigSlot.$ = twig;
			
			twig.parent = parentTwig;
			parentTwig[childrenField].push(twigSlot);
		}
		
		twig[budField] = MakeSlot(twig, budField);
		twig[childrenField] = MakeList(twig, childrenField);
		
		var budSlot = twig[budField];
		budSlot.formula = formula;
		
		if (!textOnly)
		{
			CompileCode(budSlot, budSlot.formula);
		}
		
		parents[indent] = twig;
	}
	
	tree.generateTwigs(tree);
	tree.draw(tree);
}
function Linize(str) {
	var lines = [];
	
	var k = 0;
	
	var buffer = "";
	
	while (k < str.length)
	{
		var c = str[k];
		
		if (c == '\r')
		{
			if (str[k + 1] == '\n')
			{
				k++;
			}
			
			lines.push(buffer);
			buffer = "";
		}
		else if (c == '\n')
		{
			lines.push(buffer);
			buffer = "";
		}
		else
		{
			buffer += c;
		}
		
		k++;
	}
	
	if (buffer.length > 0)
	{
		lines.push(buffer);
	}
	
	return lines;
}
function ReadLine(str, frcek) {
	var s = "";
	
	while(frcek < str.length)
	{
		if (str[frcek] == '\n')
		{
			break;
		}
		
		s += str[frcek];
		frcek++;
	}
	
	return s;
}
function Tokenize(str, delimiter) {
	var tokens = [];
	
	var k = 0;
	
	var buffer = "";
	
	while (k < str.length)
	{
		var c = str[k];
		
		if (c == delimiter)
		{
			tokens.push(buffer);
			buffer = "";
		}
		else
		{
			buffer += c;
		}
		
		k++;
	}
	
	//if (buffer.length > 0)
	//{
		tokens.push(buffer);
	//}
	
	return tokens;
}
function ReadFrce(str) {
	// this doesn't seem to be set up for reading multi-line scripts, and as such may be inappropriate to be called by Execute()
	
	frcek = 0;
	
	var tree = {};
	
	// the try-catch block will help with gracefully dealing with syntax errors
	//try
	//{
		if (str[0] == '#')
		{
			tree.root = ReadEq(str);
		}
		else
		{
			tree.root = ReadStatement(str);
		}
	//}
	//catch
	//{
	//	return null;
	//}
	
	return tree;
}
function ReadEq(str) {
	frcek++;
	
	var exps = [];
	
	while (frcek < str.length)
	{
		ReadSpace(str);
		exps.push(ReadExp(str));
	}
	
	var x = {};
	x.children = [];
	
	if (exps.length == 5)
	{
		// this handles both forms:
		// c = b + a
		// a + b = c
		if (exps[1].contents == '=')
		{
			x.contents = '=' + exps[3].contents;
			x.children[0] = exps[0];
			x.children[1] = exps[2];
			x.children[2] = exps[4];
		}
		else if (exps[3].contents == '=')
		{
			x.contents = '=' + exps[1].contents;
			x.children[0] = exps[4];
			x.children[1] = exps[0];
			x.children[2] = exps[2];
		}
		else
		{
			throw new Error();
		}
	}
	else if (exps.length == 3)
	{
		if (exps[1].contents == '=')
		{
			x.contents = '=';
			x.children[0] = exps[0];
			x.children[1] = exps[2];
		}
		else
		{
			throw new Error();
		}
	}
	else
	{
		throw new Error();
	}
	
	return x;
}
function ReadStatement(str) {
	ReadSpace(str);
	
	if (str.substr(frcek, 3) == "for")
	{
		var line = ReadLine(str, frcek);
		var tokens = Tokenize(str, ' ');
		
		var x = {};
		x.children = [];
		
		if (tokens.length == 6) // for i from 0 to 10
		{
			x.contents = 'for';
			x.children.push(tokens[1]);
			x.children.push(tokens[3]);
			x.children.push(tokens[5]);
		}
		else if (tokens.length == 4) // for x in list
		{
			x.contents = 'forin';
			x.children.push(tokens[1]);
			x.children.push(tokens[3]);
		}
		else
		{
			throw new Error();
		}
		
		var block = [];
		block.contents = "{}";
		block.children = [];
		
		var sub = ReadStatement(str, frcek);
		
		while (sub.contents != "end")
		{
			block.children.push(sub);
			sub = ReadStatement(str, frcek);
		}
		
		x.children.push(block);
		
		return x;
	}
	else if (str.substr(frcek, 2) == "if")
	{
	
	}
	else if (str.substr(frcek, 4) == "elif")
	{
	
	}
	else if (str.substr(frcek, 4) == "else")
	{
	
	}
	else if (str.substr(frcek, 4) == "frce")
	{
	
	}
	else if (str.substr(frcek, 3) == "end")
	{
		var x = {};
		x.contents = "end";
		x.children = [];
		return x;
	}
	else
	{
		var lhs = ReadExp(str);
		ReadSpace(str);
		
		if (str[frcek] == '=')
		{
			frcek++;
			ReadSpace(str);
			
			var rhs = {};
			rhs.contents = str.substr(frcek);
			rhs.children = [];
			
			var x = {};
			x.contents = '=';
			x.children = [];
			x.children.push(lhs);
			x.children.push(rhs);
			return x;
		}
		else if (str[frcek] == ':' && str[frcek + 1] == '=')
		{
			frcek += 2;
			ReadSpace(str);
			var rhs = ReadExp(str);
			
			var x = {};
			x.contents = ':=';
			x.children = [];
			x.children.push(lhs);
			x.children.push(rhs);
			return x;
		}
		else
		{
			return lhs;
		}
	}
}
function ReadExp(str) {
	var x = null;
	
	var c = str[frcek];
	
	if (c == '(')
	{
		//ReadSpace(str);
		x = ReadParen(str);
	}
	else if (c == '[')
	{
		frcek += 2;
		x = Leaf('[]');
	}
	else if (c == '{')
	{
		frcek += 2;
		x = Leaf('{}');
	}
	//else if (c == '+' || c == '-' || c == '.' || c == '0' || c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9')
	//{
	//	x = Leaf(ReadNumber(str));
	//}
	else if (c == '\'' || c == '\"')
	{
		x = Leaf(ReadString(str));
	}
	//else if (c == '_' || c == 'a' || c == 'b' || c == 'c' || c == 'd' || c == 'e' || c == 'f' || c == 'g' || c == 'h' || c == 'i' || c == 'j' || c == 'k' || c == 'l' || c == 'm' || c == 'n' || c == 'o' || c == 'p' || c == 'q' || c == 'r' || c == 's' || c == 't' || c == 'u' || c == 'v' || c == 'w' || c == 'x' || c == 'y' || c == 'z' || c == 'A' || c == 'B' || c == 'C' || c == 'D' || c == 'E' || c == 'F' || c == 'G' || c == 'H' || c == 'I' || c == 'J' || c == 'K' || c == 'L' || c == 'M' || c == 'N' || c == 'O' || c == 'P' || c == 'Q' || c == 'R' || c == 'S' || c == 'T' || c == 'U' || c == 'V' || c == 'W' || c == 'X' || c == 'Y' || c == 'Z')
	//{
	//	x = Leaf(ReadName(str));
	//}
	//else
	//{
	//	ReadSpace(str);
	//}
	else if (c == ' ' || c == '\t' || c == '\r' || c == '\n')
	{
		ReadSpace(str);
	}
	else
	{
		x = Leaf(ReadToken(str));
	}
	
	var post = str[frcek];
	
	while (post == '.' || post == '[')
	{
		var sub = x;
		x = {};
		x.children = [];

		if (post == '.')
		{
			x.contents = '.';
			frcek++;
			x.children[0] = sub;
			
			if (c == '0' || c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9')
			{
				x.children[1] = Leaf(ReadNumber(str));
			}
			else if (c == '\'' || c == '\"')
			{
				x.children[1] = Leaf(ReadString(str));
			}
			else
			{
				x.children[1] = Leaf(ReadToken(str));
			}
		}
		else if (post == '[')
		{
			x.contents = '[]';
			frcek++;
			ReadSpace(str);
			x.children[0] = sub;
			x.children[1] = ReadExp(str);
			ReadSpace(str);
			frcek++;
		}
		
		post = str[frcek];
	}
	
	return x;
}
function ReadParen(str) {
	var x = {};
	x.contents = '()';
	x.children = [];
	
	frcek++;
	
	ReadSpace(str);
	
	var c = str[frcek];
	
	while (c != ')')
	{
		var sub = ReadExp(str);
		x.children.push(sub);
		ReadSpace(str);
		c = str[frcek];
	}
	
	frcek++;
	
	return x;
}
function ReadToken(str) {
	var s = '';
	
	var c = str[frcek];
	
	// if we get here, always accept the first token (this is critical for accepting number literals beginning with a '.'
	s += c;
	frcek++;
	c = str[frcek];
	
	while (c && c != '(' && c != ')' && c != '"' && c != "'" && c != ' ' && c != '\t' && c != '\r' && c != '\n' && c != '[' && c != '{' && c != '.' && c != ']')
	{
		s += c;
		frcek++;
		c = str[frcek];
	}
	
	return s;
}
function ReadName(str) {
	var s = '';
	
	var c = str[frcek];
	
	while (c == '_' || c == 'a' || c == 'b' || c == 'c' || c == 'd' || c == 'e' || c == 'f' || c == 'g' || c == 'h' || c == 'i' || c == 'j' || c == 'k' || c == 'l' || c == 'm' || c == 'n' || c == 'o' || c == 'p' || c == 'q' || c == 'r' || c == 's' || c == 't' || c == 'u' || c == 'v' || c == 'w' || c == 'x' || c == 'y' || c == 'z' || c == 'A' || c == 'B' || c == 'C' || c == 'D' || c == 'E' || c == 'F' || c == 'G' || c == 'H' || c == 'I' || c == 'J' || c == 'K' || c == 'L' || c == 'M' || c == 'N' || c == 'O' || c == 'P' || c == 'Q' || c == 'R' || c == 'S' || c == 'T' || c == 'U' || c == 'V' || c == 'W' || c == 'X' || c == 'Y' || c == 'Z' || c == '0' || c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9')
	{
		s += c;
		frcek++;
		c = str[frcek];
	}
	
	return s;
}
function ReadString(str) {
	var s = '';
	
	var quote = str[frcek];
	
	var c = str[frcek];
	
	s += c;
	
	frcek++;
	c = str[frcek];
	
	while (c != quote)
	{
		if (c == '\\')
		{
			frcek++;
			c = str[frcek];
			s += c;
		}
		else
		{
			s += c;
		}
		
		frcek++;
		c = str[frcek];
	}
	
	s += c;
	frcek++;
	
	return s;
}
function ReadNumber(str) {
	var s = '';
	
	var c = str[frcek];
	
	if (c == '+' || c == '-')
	{
		s += c;
		frcek++;
		c = str[frcek];
	}
	
	while (c == '0' || c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9')
	{
		s += c;
		frcek++;
		c = str[frcek];
	}
	
	if (c == '.')
	{
		s += c;
		frcek++;
		c = str[frcek];
	}
	
	while (c == '0' || c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9')
	{
		s += c;
		frcek++;
		c = str[frcek];
	}
	
	// read exponential notation here
	
	return s;
}
function ReadSpace(str) {
	var c = str[frcek];
	
	while (c == ' ' || c == '\t' || c == '\r' || c == '\n')
	{
		frcek++;
		c = str[frcek];
	}
}
function Leaf(str) {
	var x = {};
	x.contents = str;
	x.children = [];
	return x;
}
function CompileCode(slot, str) {
	if (str == "" || str == "null")
	{
		Set(slot, null);
	}
	else if (str.substr(0, 8) == "function")
	{
		var functor = ReadUserDefinedFunction(slot, str);
		Set(slot, functor);
	}
	else if (str.substr(0, 4) == "frce")
	{
		// read a frce function
		// rename the slot to match the function name, so callers can find it
	}
	else if (str[0] == "=")
	{
		CompileFormula(slot, str.substr(1))
	}
	else if (IsDigit(str[0]) || (str.length > 1 && str[0] == '.')) // change this to an IsNumber function - we must allow weird strings
	{
		Set(slot, eval(str));
	}
	else if (str == "true" || str == "false")
	{
		Set(slot, eval(str));
	}
	else
	{
		Set(slot, str);
	}
}
function CompileFormula(slot, str) {
	var tree = ReadFrce(str);
	var code = MakeList(slot, "code");
	code.root = DispatchLisp(code, tree.root);
	slot.code = code;
	
	// retarget the Pointer at code.root to the slot, or through a Ref to the slot
	if (str[0] == '(')
	{
		code.root.$ = slot;
		AddEdge(code.root.node, slot.node, "$", Edge.$);
	}
	else if (str[0] == '#') // an Constraint
	{
		code.root.state = State.Blank;
	}
	else
	{
		// this block deals with simple references (e.g. '=a[b].c') - basically we synthesize an := exp
		
		var exp = MakeExp(code, code.length.toString());
		code.push(exp);
		
		var fptr = MakePointer(code, code.length.toString(), null);
		code.push(fptr);
		fptr.scope = globals;
		fptr.name = ":=";
		
		exp.f = fptr;
		AddEdge(exp.node, fptr.node, "f", Edge.Arg);
		
		exp.args.push(code.root); 
		AddEdge(exp.node, code.root.node, (exp.args.length - 1).toString(), Edge.Arg);
		
		exp.pout = MakePointer(code, code.length.toString(), slot);
		code.push(exp.pout);
		AddEdge(exp.node, exp.pout.node, "pout", Edge.Pout);
	}
	
	var control = MakeControl(code, code.length.toString());

	for (var i = 0; i < code.length; i++)
	{
		var cog = code[i];
		
		AddEdge(control.node, cog.node, i.toString(), Edge.Control);
		
		if (cog.type == Machine.Pointer)
		{
			if (!cog.scope) // . and [] expressions produce pointers with already-bound scopes - bare names produce pointers with unbound scopes
			{
				cog.scope = slot["[parent]"]; // set the scope to the obj - when binding, we search along the [parent] path
			}
		}
	}
	
	code.push(control);
	control.state = State.Active;
	Broadcast(control, Message.Activate, { type : Edge.Control });
	
	globals.calculate = true;
}
function InterpretCode(scope, str) {
	var tree = ReadFrce(str);
	
	var focus = scope;
	
	// find the first ancestor of the cell that is a Collection - that is our scope
	while (focus)
	{
		if (!focus["[type]"])
		{
			focus = focus["[parent]"];
		}
		else
		{
			if (focus["[type]"] == "Collection")
			{
				break;
			}
			else
			{
				focus = focus["[parent]"];
			}
		}
	}
	
	if (!focus)
	{
		throw new Error();
	}
	
	if (tree)
	{
		Eval(focus, tree.root, false);
	}
	
	globals.calculate = true;
}
function Eval(scope, twig, bCreateNewSlotsForUnboundNames) {
	var s = twig.contents;
	
	if (s == "=")
	{
		var lhs = Eval(scope, twig.children[0], true);
		lhs.formula = twig.children[1].contents;
		CompileFormula(lhs, lhs.formula);
		globals.calculate = true;
		SetNewState(lhs, State.Blank); // i mean, right?
	}
	else if (s == ":=")
	{
		var lhs = Eval(scope, twig.children[0], true);
		var rhs = Eval(scope, twig.children[1], false);
		Set(lhs, Get(rhs));
	}
	else if (s == "()")
	{
		var fn = Get(Eval(scope, twig.children[0], false));
		var args = [];
		
		for (var i = 1; i < twig.children.length; i++)
		{
			args.push(Get(Eval(scope, twig.children[i], false)));
		}
		
		var result = null;
		
		if (fn["[type]"] == "Functor") // for javascript in textboxes, and any defined in FRCE (including lambdas)
		{
			fn.f(args);
		}
		else
		{
			fn(args);
		}
		
		return result;
	}
	else if (s == "[]")
	{
		var obj = Get(Eval(scope, twig.children[0], false));
		var fie = Get(Eval(scope, twig.children[1], false));
		var result = obj[fie];
		return result;
	}
	else if (s == ".")
	{
		var slot = Eval(scope, twig.children[0], false);
		var obj = Get(slot);
		var fie = twig.children[1].contents;
		
		//if (fie == "%")
		//{
		//	result = slot["[fieldSlots]"]; // a truly horrific hack - we should probably just make a SetFieldSlotFormula(slot, str) function instead - it can set the .react too
		//}
		//else
		//{
		//	result = obj[fie];
		//}
		
		result = obj[fie];
		
		return result;
	}
	else if (s == "for")
	{
		var variable = twig.children[0].contents;
		var start = parseInt(twig.children[1].contents);
		var end = parseInt(twig.children[2].contents);
	}
	else if (s == "forin")
	{
	
	}
	else if (s == "frce")
	{
	
	}
	else if (s == "lambda")
	{
	
	}
	else
	{
		var c = s[0];
		
		if (c == '.' || c == '0' || c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9')
        {
			return parseFloat(s);
        }
        else if (c == '"' || c == "'")
        {
			return s.substring(1, s.length - 1);
        }
        else
        {
			var focus = scope;
			
			while (focus)
			{
				if (focus[s])
				{
					return focus[s];
				}
				else
				{
					focus = focus["[parent]"];
				}
			}
			
			// if it fails to bind, we get here
			// now what?  if the name is a lhs, we should create a new slot
			// on the other hand, if the name is an rhs, we probably shouldn't create a new slot
			// but in which scope?  this all depends on what scope was initially passed in
			// and that might vary - we think of grid cells as being in the scope of their obj, but we think of textboxes as being in the collection scope
			
			if (bCreateNewSlotsForUnboundNames)
			{
				var newslot = MakeSlot(scope, s, null);
				scope[s] = newslot;
				return newslot;
			}
			else
			{
				throw new Error(); // this error should probably be caught be a try-catch block and propgate upward to invalidate the statement
			}
        }
	}
}

var Lang = {};
Lang.Linize = Linize;
Lang.Tokenize = Tokenize;
Lang.ReadFrce = ReadFrce; // this is used by Kronecker
Lang.ReadNumber = ReadNumber;
Lang.ReadName = ReadName;
Lang.ReadSpace = ReadSpace;
Lang.ReadExp = ReadExp;
Lang.ReadTreeSimple = ReadTreeSimple;
Lang.WriteTreeSimple = WriteTreeSimple;
return Lang;

})();

Griddl.Lang = Lang;

Griddl.UI = (function() {

// abstract these into ShowModal('saveAs')/HideModal('saveAs')
function ShowSaveAsModal() {
	$('#saveAsScreen').css('display', 'block');
	$('#saveAsDialog').css('display', 'block');
}
function HideSaveAsModal() {
	$('#saveAsScreen').css('display', 'none');
	$('#saveAsDialog').css('display', 'none');
}
function ShowLoginModal() {
	$('#loginScreen').css('display', 'block');
	$('#loginDialog').css('display', 'block');
}
function HideLoginModal() {
	$('#loginScreen').css('display', 'none');
	$('#loginDialog').css('display', 'none');
}
function SubmitLoginForm() {
	
	var form = $('#loginForm');
	
	$.ajax({
		type: form.attr('method'), // form.attr('method') = 'POST'
		url: form.attr('action'), // form.attr('action') = '/login?next=/saveasForm' the next url is so that the server returns a new saveasForm with a new csrf token
		data: form.serialize(),
		success: function (data) {
			AjaxSuccess(data);
		},
		error: function(data) {
			AjaxFailure(form, data);
		}
	});
}
function SubmitSignupForm() {
	
	var form = $('#loginForm');
	
	$.ajax({
		type: 'POST',
		url: '/ajaxjoin',
		data: form.serialize(),
		success: function (data) {
			AjaxSuccess(data);
		},
		error: function(data) {
			AjaxFailure(form, data);
		}
	});
}

var UI = {};
UI.ShowSaveAsModal = ShowSaveAsModal;
UI.HideSaveAsModal = HideSaveAsModal;
UI.ShowLoginModal = ShowLoginModal;
UI.HideLoginModal = HideLoginModal;
UI.SubmitLoginForm = SubmitLoginForm;
UI.SubmitSignupForm = SubmitSignupForm;
return UI;

})();

Griddl.Canvas = (function() {
	
	// on subsequent callings of NewDocument(), existing canvases should not be destroyed - just cleared
	// calls to NewPage() should return those existing canvases
	// if there are excess calls to NewPage(), new canvases should be created
	// if there is a shortfall of calls to NewPage(), extra canvases should be destroyed on the call to GenerateDocument()
	// what we get out of this: the scroll position of the document won't be reset, which means we can make a change on the left and see it on the right
	
	// maybe NewDocument should be merged into the Canvas constructor?
	function Canvas() {
		
		// this is here so that user code does not need to do it - the function invoked by the export button needs access to the canvas
		griddlCanvas = this;
		
		Object.defineProperty(this, 'font', { set : function (str) { 
			frcek = 0;
			this.fontSize = parseFloat(Lang.ReadNumber(str));
			this.fontSizeUnits = Lang.ReadName(str);
			Lang.ReadSpace(str);
			this.fontFamily = str.substr(frcek);
			this.savedCanvasContext.font = this.fontSize.toString() + this.fontSizeUnits + ' ' + this.fontFamily;
		} });
		
		// this is used for conversion of 'red' => 'rgb(255,0,0)' and text measurement and access of pixel data of image components
		this.savedCanvas = document.createElement('canvas');
		this.savedCanvasContext = this.savedCanvas.getContext('2d');
		
		// FinalizeGraphics() sets this and ExportLocalToPdf() reads it
		this.pdfContextArray = null;
		
		// maybe we should by default also do canvas drawing when the mode is 'pdf'
		// so the canvas if tests would be if (this.drawingContextMode == 'canvas' || this.drawingContextMode == 'pdf')
		// ah, but both canvas/pdf and svg/pdf are possible (also, what about just generating the pdf in an iframe?)
		// so the real idea here is to have canvas/svg as one choice and then pdf as an independent option
		
		// okay - we sever everything
		this.drawCanvas = false;
		this.drawSvg = false;
		this.type = null; // 'canvas' or 'svg' - NewPage() uses this
		
		// get rid of both of these
		this.drawingContextMode = 'canvas'; // 'canvas' or 'svg'
		this.savedDrawingContextMode = null;
		
		// single-page Canvas vs. multi-page Canvas:
		// the problem is that some things are shared across all pages of a document and some aren't
		// PDF image dicts and font dicts are shared
		// page dimensions, command/svg lists and canvas contexts are per-page, not shared
		// so if we define Canvas to be a whole document, we'll need lists for the per-page stuff
		// and if we define Canvas to be just a single page, we'll need to put the shared stuff somewhere else
		// which makes me lean towards Canvas as whole document, since we don't have to create a new object
		
		this.parentDiv = null;
		
		this.pages = null; // to be instantiated as an Array, indexed by both numbers and names
		// the page object is as follows: { width : 0 , height : 0 , canvasContext : CanvasRenderingContext2D , pdfCommands : [str] , div : <div> , eltStrings : [str] }
		
		// replaced by Page object:
		//this.canvasContexts = []; // this is so a multi-page document can have one Canvas - we just set this.g = this.canvasContexts[i] and then use this.g in the draw functions
		//this.pageDimensions = [];
		//this.div = null;
		//this.eltStrings = [];
		//this.commandss = [];
		//this.commands = [];
		
		this.g = null; // this.pages[i].canvasContext, for some i
		this.canvas = null;
		this.commands = null; // this.pages[i].pdfCommands, for some i
		this.eltStrings = null; // this.pages[i].eltStrings, for some i
		this.currentPage = null;
		
		// these are probably referenced in numerous places
		//this.width = width;
		//this.height = height;
		//this.pageWidth = width;
		//this.pageHeight = height;
		
		this.unitsToPx = null;
		this.unitsToPt = null;
		
		this.jax = [];
		$('.mathjaxInput').remove();
		
		// SVG fields
		this.currentId = null;
		this.currentPath = null;
		this.transforms = []; // [ 'translate(10,10)' , 'scale(5)' ] - this is the current transform
		this.transformStack = []; // [ transform1 , transform2 ] - this is a list of the above lists
		
		// PDF fields
		//this.fontDict = {}; // { F1 : "Times-Roman" , F2 : "Helvetica" } - used by MakePdf
		this.fontNameToIndex = {} // { "Times-Roman" : 1 , "Helvetica" : 2 } - used by fillText
		this.fontCount = 0; // used by fillText
		this.imageDict = {}; // { Im1 : XObject1 , Im2 : XObject2 }
		this.imageXObjects = []; // [ XObject1 , XObject2 ]
		
		// this is so we can have a global styles object used across different draw functions without having to have a fixed object name 'styles' or having to pass the object around
		this.styles = null;
		
		// for saving and restoring the below parameters
		this.styleStack = [];
		
		// this is for using user-uploaded fonts
		this.fontObject = null; // type TrueTypeFont
		this.fontScale = null; // right now this is being used as font scale -> pixel scale conversion via multiplication
		
		this.fontFamily = 'Times−Roman';
		this.fontSize = 12;
		this.fontSizeUnits = 'pt';
		
		this.textAlign = 'left'; // start, end, left, right, center
		this.textBaseline = 'alphabetic'; // top, hanging, middle, alphabetic, ideographic, bottom
		
		this.fillStyle = 'black';
		this.strokeStyle = 'black';
		this.lineWidth = 1;
	}
	Canvas.NewDocument = function(params) {
		
		// params:
		//  div - name or div or nothing
		//  type - default is 'canvas'
		//  unitsToPx - default 1
		//  unitsToPt - default 1
		
		
		
		// GenerateDocument button should execute the first js component in the list - remove hardcoded 'draw' dependence
		
		// the characteristic here is that we don't know in advance how many pages will be created - we leave that up to usercode, with calls of g.NewPage()
		
		
		// elt can be a <canvas>, <svg>, or <div>, or an #id string that resolves to one of those
		// if elt is a <div>, the type argument must be 'canvas' or 'svg'
		
		
		
		//var theelt = null;
		//
		//if (typeof(elt) == 'string')
		//{
		//	theelt = $('#' + elt);
		//}
		//else
		//{
		//	theelt = elt;
		//}
		//
		//var thetype = null;
		//var thecanvas = null;
		//
		//if (elt.name == 'canvas')
		//{
		//	g.canvas == elt;
		//	var ctx = g.canvas.getContext('2d');
		//}
		//else if (elt.name == 'svg')
		//{
		//	
		//}
		//else if (elt.name == 'div')
		//{
        //
		//}
		//else
		//{
		//	throw new Error();
		//}
		//
		//if (type == 'canvas')
		//{
		//	var canvas = document.createElement('canvas');
		//	canvas.width = width;
		//	canvas.height = height;
		//	thediv.html('');
		//	thediv.append(canvas);
		//	g.canvas = canvas; // canvas
		//	
		//	page.width = canvas.width; // canvas
		//	page.height = canvas.height; // canvas
		//	
		//}
		//else if (type == 'svg')
		//{
		//	page.width = width ? width : thediv.width; // svg
		//	page.height = height ? height : thediv.height; // svg
		//}
		//else
		//{
		//	throw new Error();
		//}
		
		var div = null;
		var type = 'canvas';
		var unitsToPx = 1;
		var unitsToPt = 1;
		
		if (params)
		{
			if (params.div) { div = params.div; }
			if (params.type) { type = params.type; }
			if (params.unitsToPx) { unitsToPx = params.unitsToPx; }
			if (params.unitsToPt) { unitsToPt = params.unitsToPt; }
		}
		
		//var parentDiv = CreateOutputDiv(div, Canvas.CreateButtonDivFour);
		var parentDiv = CreateOutputDiv(div);
		parentDiv.css('top', '5em');
		
		var g = new Canvas();
		g.pages = [];
		g.parentDiv = parentDiv;
		g.drawCanvas = (type == 'canvas');
		g.drawSvg = (type == 'svg');
		g.type = type;
		g.unitsToPx = unitsToPx;
		g.unitsToPt = unitsToPt;
		
		return g;
	};
	Canvas.prototype.NewPage = function(params) {
		
		var width = 792;
		var height = 612;
		
		if (params.width) { width = params.width; }
		if (params.height) { height = params.height; }
		
		var pxWidth = width * this.unitsToPx;
		var pxHeight = height * this.unitsToPx;
		var ptWidth = width * this.unitsToPt;
		var ptHeight = height * this.unitsToPt;
		
		var div = $(document.createElement('div'));
		//div.attr('id', name);
		div.css('border', '1px solid #c3c3c3');
		div.css('margin', '1em');
		div.css('width', pxWidth);
		div.css('height', pxHeight);
		this.parentDiv.append(div);
		
		// possible use of a pageStyles object
		//var style = obj.style;
		//var width = pageStyles[style].width;
		//var height = pageStyles[style].height;
		
		var page = {};
		page.width = width;
		page.height = height;
		page.pdfCommands = [];
		page.pdfCommands.push('1 0 0 1 0 ' + (height * this.unitsToPt).toString() + ' cm'); // the initial PDF transform
		page.pdfCommands.push('1 0 0 -1 0 0 cm');
		
		page.left = 0;
		page.right = width;
		page.cx = width / 2;
		page.wr = width / 2;
		page.top = 0;
		page.bottom = height;
		page.cy = height / 2;
		page.hr = height / 2;
		
		if (this.type == 'canvas')
		{
			var canvas = $(document.createElement('canvas'));
			canvas[0].width = pxWidth;
			canvas[0].height = pxHeight;
			div.append(canvas);
			
			var ctx = canvas[0].getContext('2d');
			page.canvasContext = ctx;
			
			this.g = page.canvasContext;
			this.canvas = this.g.canvas;
			
			this.g.scale(this.unitsToPx, this.unitsToPx);
		}
		else if (this.type == 'svg')
		{
			page.div = div;
			page.eltStrings = [];
			
			this.eltStrings = page.eltStrings;
		}
		else
		{
			throw new Error();
		}
		
		this.pages.push(page);
		if (params.name) { this.pages[params.name] = page; }
		
		this.commands = page.pdfCommands;
		this.currentPage = page;
		
		return page;
	};
	Canvas.prototype.SetActivePage = function(nameOrIndexOrPage) {
	
		var type = typeof(nameOrIndexOrPage);
		var page = null;
		
		if (type == 'string' || type == 'number')
		{
			page = this.pages[nameOrIndex];
		}
		else
		{
			page = nameOrIndexOrPage;
		}
		
		this.g = page.canvasContext;
		this.canvas = this.g.canvas;
		this.commands = page.pdfCommands;
		this.eltStrings = page.eltStrings;
		this.currentPage = page;
	};
	
	// helpers for the constructor functions
	function CreateOutputDiv(div, buttonDivFn) {
		
		var thediv = null;
		
		if (div === null || div === undefined)
		{
			var existing = $('#output');
			
			if (existing.length == 0)
			{
				var outputDiv = $(document.createElement('div'));
				outputDiv.attr('id', 'output');
				outputDiv.css('position', 'absolute');
				outputDiv.css('top', '5em');
				outputDiv.css('left', '45em');
				outputDiv.css('width', '54em');
				outputDiv.css('height', '40em');
				//outputDiv.css('border', '1px solid #c3c3c3');
				outputDiv.css('overflow', 'auto');
				$('body').append(outputDiv);
				
				if (buttonDivFn) { buttonDivFn(); }
				
				thediv = outputDiv;
			}
			else
			{
				thediv = existing;
			}
		}
		else
		{
			thediv = (typeof(div) == 'string') ? $(div) : div;
		}
		
		thediv.html('');
		
		return thediv;
	}
	Canvas.CreateButtonDivTwo = function() {
		
		// #buttons {
		// position:absolute;
		// top:4em;
		// left:45em;
		// }
		// 
		// <button id="write" onclick="Griddl.RunCode('draw')">Generate Document</button>
		// <button onclick="Griddl.ExportLocalPdf('draw', 'document')">Export to PDF</button>
		
		var buttonDiv = $(document.createElement('div'));
		buttonDiv.css('position', 'absolute');
		buttonDiv.css('top', '3em');
		buttonDiv.css('left', '46em');
		
		var button1 = $(document.createElement('button'));
		var button2 = $(document.createElement('button'));
		
		button1.css('margin-right', '3px');
		
		button1.attr('id', 'write');
		
		button1.on('click', function() { Griddl.RunCode('draw'); });
		button2.on('click', function() { Griddl.ExportLocalPdf('draw', 'document'); });
		
		button1.text('Generate Document');
		button2.text('Export to PDF');
		
		buttonDiv.append(button1);
		buttonDiv.append(button2);
		
		$('body').append(buttonDiv);
	}
	Canvas.CreateButtonDivFour = function() {
		
		// #buttons {
		// position:absolute;
		// top:3em;
		// left:45em;
		// }
		// 
		// <button id="write" onclick="Griddl.RunCode('draw')">Generate Document</button>
		// <button onclick="Griddl.ExportLocalCanvas('document')">Export to PNG</button>
		// <button onclick="Griddl.ExportLocalSvg('svg', 'document')">Export to SVG</button>
		// <button onclick="Griddl.ExportLocalPdf('draw', 'document')">Export to PDF</button>
		
		var buttonDiv = $(document.createElement('div'));
		buttonDiv.css('position', 'absolute');
		buttonDiv.css('top', '3em');
		buttonDiv.css('left', '45em');
		
		var button1 = $(document.createElement('button'));
		var button2 = $(document.createElement('button'));
		var button3 = $(document.createElement('button'));
		var button4 = $(document.createElement('button'));
		
		button1.attr('id', 'write');
		
		button1.on('click', function() { Griddl.RunCode('draw'); });
		button2.on('click', function() { Griddl.ExportLocalCanvas('document'); });
		button3.on('click', function() { Griddl.ExportLocalSvg('svg', 'document'); });
		button4.on('click', function() { Griddl.ExportLocalPdf('draw', 'document'); });
		
		button1.text('Write');
		button2.text('Export to PNG');
		button3.text('Export to SVG');
		button4.text('Export to PDF');
		
		buttonDiv.append(button1);
		buttonDiv.append(button2);
		buttonDiv.append(button3);
		buttonDiv.append(button4);
		
		$('body').append(buttonDiv);
	}
	
	// DumpSVG -> GenerateDocument
	// FinalizeGraphics -> GenerateDocument
	Canvas.prototype.GenerateDocument = function() {
		
		var g = this;
		
		var callback = function() {
			
			var glyphs = {};
			
			$('#MathJax_SVG_glyphs').children().each(function(key, val) {
				var id = $(val).attr('id');
				var d = $(val).attr('d');
				glyphs[id] = d;
			});
			
			for (var i = 0; i < g.jax.length; i++)
			{
				var jax = g.jax[i];
				g.SetActivePage(jax.page);
				
				g.save();
				g.translate(jax.x, jax.y);
				
				var scale = g.fontSize / 1024;
				g.scale(scale, -scale);
				
				$(jax.inputDivId + ' .MathJax_SVG_Display').children().first().children().first().children().each(function(key, val) {
					
					var DrawTag = function(tag) {
						
						var transform = ParseSvgTransform($(tag).attr('transform'));
						
						g.save();
						
						for (var i = 0; i < transform.length; i++)
						{
							if (transform[i].type == 'translate')
							{
								g.translate(transform[i].x, transform[i].y);
							}
							else if (transform[i].type == 'scale')
							{
								g.scale(transform[i].x, transform[i].y);
							}
							else if (transform[i].type == 'transform')
							{
								var t = transform[i];
								g.transform(t.sx, t.kx, t.ky, t.sy, t.dx, t.dy);
							}
							else if (transform[i].type == 'rotate')
							{
								throw new Error();
								//g.rotate(transform[i].rotate);
							}
							else
							{
								throw new Error();
							}
						}
						
						if (tag.tagName == 'use')
						{
							var href = $(tag).attr('href');
							var x = parseFloat($(tag).attr('x'));
							var y = parseFloat($(tag).attr('y'));
							if (x === undefined) { x = 0; }
							if (y === undefined) { y = 0; }
							
							var d = glyphs[href.substr(1)];
							
							g.translate(x, y);
							g.fillPath(d);
						}
						else if (tag.tagName == 'g')
						{
							$(tag).children().each(function(key, child) {
								DrawTag(child);
							});
						}
						else
						{
							throw new Error();
						}
						
						g.restore();
					};
					
					DrawTag(val);
				});
				
				g.restore();
			}
		};
		
		// all calls to drawMath put a typeset operation in the queue, and then at the end, we put this callback in the queue
		// that guarantees that it will be executed after every typeset operation completes
		if (window.MathJax) { MathJax.Hub.Queue(callback); }
		
		// we have to make this part of the callback, so that it executes after all mathjax have been rendered
		if (window.MathJax) { MathJax.Hub.Queue(RenderSvg); } else { RenderSvg(); }
	};
	var RenderSvg = function() {
		
		if (this.drawSvg)
		{
			var xmlnss = 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"';
			
			for (var i = 0; i < this.pages.length; i++)
			{
				var page = this.pages[i];
				page.div.html('<svg ' + xmlnss + ' width="' + page.width + '" height="' + page.height + '">' + page.eltStrings.join('') + '</svg>');
			}
		}
	};
	
	var ParseSvgTransform = function(str) {
		
		var transform = [];
		// translate : { x : 0 , y : 0 }
		// scale : { x : 1 , y : 1 }
		// matrix : { sx : 1 , ky : 0 , kx : 0 , sy : 1 , dx : 0 , dy : 0 }
		if (str === undefined) { return transform; }
		
		var regex = RegExp('[\(\)]')
		var parts = str.split(regex);
		
		var k = 0;
		
		while (k < parts.length)
		{
			var part = parts[k].trim();
			
			if (part == 'translate')
			{
				var args = parts[++k].split(',');
				transform.push({ type : 'translate' , x : parseFloat(args[0]) , y : parseFloat(args[1])});
			}
			else if (part == 'scale')
			{
				var args = parts[++k].split(',');
				
				if (args.length == 1)
				{
					transform.push({ type : 'scale' , x : parseFloat(args[0]) , y : parseFloat(args[0])});
				}
				else if (args.length == 2)
				{
					transform.push({ type : 'scale' , x : parseFloat(args[0]) , y : parseFloat(args[1])});
				}
				else
				{
					throw new Error();
				}
			}
			else if (part == 'matrix')
			{
				var args = parts[++k].split();
				var sx = parseFloat(args[0]);
				var ky = parseFloat(args[1]);
				var kx = parseFloat(args[2]);
				var sy = parseFloat(args[3]);
				var dx = parseFloat(args[4]);
				var dy = parseFloat(args[5]);
				transform.push({ type : 'transform' , sx : sx , ky : ky , kx : kx , sy : sy , dx : dx , dy : dy });
			}
			else if (part == 'rotate')
			{
				throw new Error();
			}
			else if (part == '')
			{
				// whitespace between transforms
			}
			else
			{
				throw new Error();
			}
			
			k++;
		}
		
		return transform;
	};
	
	Canvas.prototype.DrawCanvas = function(bool) { this.drawCanvas = bool; };
	Canvas.prototype.DrawSVG = function(bool) { this.drawSvg = bool; };
	
	Canvas.prototype.SetSvgId = function(id) { this.currentId = id; };
	Canvas.prototype.PushGroup = function(id) { if (this.drawSvg) { this.eltStrings.push('<g' + (id ? (' id="' + id + '"') : '') + '>'); } };
	Canvas.prototype.PopGroup = function() { if (this.drawSvg) { this.eltStrings.push('</g>'); } };
	
	Canvas.prototype.ParseRgbColor = function(str) {
		// str = 'rgb(0,0,0)' or 'rgba(0,0,0,0)'
		var parens = str.substring(str.indexOf('('));
		var rgb = parens.substring(1, parens.length - 1);
		var rgblist = rgb.split(',');
		var color = {};
		color.r = parseInt(rgblist[0]);
		color.g = parseInt(rgblist[1]);
		color.b = parseInt(rgblist[2]);
		return color;
	};
	Canvas.prototype.ParseHexColor = function(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	};
	Canvas.prototype.SetPdfColors = function() {
		
		this.savedCanvasContext.fillStyle = this.fillStyle; // this will convert from 'red' to 'rgb(255,0,0)'
		this.savedCanvasContext.strokeStyle = this.strokeStyle; // this will convert from 'red' to 'rgb(255,0,0)'
		
		var fillColor = null;
		var strokeColor = null;
		
		if (this.savedCanvasContext.fillStyle[0] == '#')
		{
			fillColor = this.ParseHexColor(this.savedCanvasContext.fillStyle);
		}
		else if (this.savedCanvasContext.fillStyle.substr(0, 3) == 'rgb')
		{
			fillColor = this.ParseRgbColor(this.savedCanvasContext.fillStyle);
		}
		else
		{
			throw new Error();
		}
		
		if (this.savedCanvasContext.strokeStyle[0] == '#')
		{
			strokeColor = this.ParseHexColor(this.savedCanvasContext.strokeStyle);
		}
		else if (this.savedCanvasContext.strokeStyle.substr(0, 3) == 'rgb')
		{
			strokeColor = this.ParseRgbColor(this.savedCanvasContext.strokeStyle);
		}
		else
		{
			throw new Error();
		}
		
		var fillR = fillColor.r / 255;
		var fillG = fillColor.g / 255;
		var fillB = fillColor.b / 255;
		var strokeR = strokeColor.r / 255;
		var strokeG = strokeColor.g / 255;
		var strokeB = strokeColor.b / 255;
		
		this.commands.push(fillR.toString() + ' ' + fillG.toString() + ' ' + fillB.toString() + ' rg');
		this.commands.push(strokeR.toString() + ' ' + strokeG.toString() + ' ' + strokeB.toString() + ' RG');
	};
	
	// there are three systems for drawing text:
	// 1. the native CanvasRenderingContext2D/PDF systems (fillTextNative)
	// 2. using truetype.js (fillTextTruetype and DrawGlyph)
	// 3. using font coordinates dumped into fonts.js (fillText)
	Canvas.prototype.fillText = function(text, x, y) {
		
		var glyphset = Griddl.fonts[this.fontFamily];
		
		var multiplier = this.fontSize / 2048;
		
		var width = this.measureText(text);
		
		if (this.textAlign == 'left')
		{
			// no change
		}
		else if (this.textAlign == 'center')
		{
			x -= width / 2;
		}
		else if (this.textAlign == 'right')
		{
			x -= width;
		}
		else
		{
			throw new Error();
		}
		
		var textHeightUnits = this.fontSize / this.unitsToPt;
		
		if (this.textBaseline == 'middle')
		{
			y += textHeightUnits / 2;
		}
		else if (this.textBaseline == 'top')
		{
			y += textHeightUnits;
		}
		else if (this.textBaseline == 'bottom')
		{
			// no change
		}
		else
		{
			throw new Error();
		}
		
		this.save();
		this.translate(x, y);
		this.scale(multiplier, -multiplier); // the fonts have the y-axis pointing up, rather than down
		
		for (var i = 0; i < text.length; i++)
		{
			var glyph = glyphset[text[i]];
			if (!glyph) { glyph = glyphset["missing"]; }
			
			if (glyph.path)
			{
				this.fillPath(glyph.path);
				//this.DrawDots(glyph.path, x, y, multiplier);
			}
			
			this.translate(glyph.width, 0);
		}
		
		this.restore();
	};
	Canvas.prototype.fillTextNative = function(text, x, y) {
		
		if (this.drawCanvas)
		{
			this.g.font = this.fontSize.toString() + this.fontSizeUnits + ' ' + this.fontFamily;
			this.g.textAlign = this.textAlign;
			this.g.textBaseline = this.textBaseline;
			this.g.fillStyle = this.fillStyle;
			this.g.fillText(text, x, y);
		}
		
		if (this.drawSvg)
		{
			var svg = '<text ';
			
			if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
			if (this.transforms.length > 0) { svg += 'transform="' + this.transforms.join(' ') + '" '; }
			var style = '';
			style += 'fill:' + this.fillStyle + ';';
			//style += 'stroke:' + this.strokeStyle + ';';
			style += 'stroke:' + 'none' + ';';
			svg += 'style="' + style + '" ';
			//svg += 'stroke-width="' + this.lineWidth.toString() + '" ';
			
			svg += 'x="' + x.toString() + '" ';
			svg += 'y="' + y.toString() + '" ';
			
			var textAnchor = null;
			
			if (this.textAlign == 'center')
			{
				textAnchor = 'middle';
			}
			else if (this.textAlign == 'start' || this.textAlign == 'end')
			{
				textAnchor = this.textAlign;
			}
			else if (this.textAlign == 'left')
			{
				textAnchor = 'start'; // this assumes left-to-right
			}
			else if (this.textAlign == 'right')
			{
				textAnchor = 'end'; // this assumes left-to-right
			}
			
			svg += 'text-anchor="' + textAnchor + '" ';
			
			// SVG doesn't have the equivalent of the textBaseline of canvas, so we have to simulate it with dx and dy
			// of course, the exact dx and dy should vary with font and font size, but that's hard
			
			var dy = 0;
			
			var ptToPx = 1.2;
			
			var fontSizePx = 0;
			
			if (this.fontSizeUnits == 'pt')
			{
				fontSizePx = Math.floor(this.fontSize * ptToPx, 1);
			}
			else if (this.fontSizeUnits == 'px')
			{
				fontSizePx = this.fontSize;
			}
			else
			{
				throw new Error();
			}
			
			if (this.textBaseline == 'alphabetic')
			{
				dy = 0;
			}
			else if (this.textBaseline == 'top')
			{
				dy = (fontSizePx - 2);
			}
			else if (this.textBaseline == 'hanging')
			{
				dy = 0;
			}
			else if (this.textBaseline == 'middle')
			{
				dy = (fontSizePx - 2) / 2;
			}
			else if (this.textBaseline == 'ideographic')
			{
				dy = 0;
			}
			else if (this.textBaseline == 'bottom')
			{
				dy = 0;
			}
			
			svg += 'dy="' + dy.toString() + '" ';
			
			svg += 'font-family="' + this.fontFamily + '" ';
			svg += 'font-size="' + fontSizePx.toString() + '" ';
			
			svg += '>' + text + '</text>';
			
			this.eltStrings.push(svg);
		}
		
		if (drawPdf)
		{
			var fontFamily = this.fontFamily;
			if (!fontFamily) { fontFamily = 'Times-Roman'; }
			if (fontFamily == 'Times New Roman') { fontFamily = 'Times-Roman'; }
			
			var fontSize = this.fontSize;
			
			if (this.fontSizeUnits != 'pt')
			{
				var conversionFactor = 1; // replace 1 with the appropriate calculation
				fontSize *= conversionFactor;
				fontSize = Math.floor(fontSize, 1);
			}
			
			if (!fontSize) { fontSize = 12; }
			
			//fontSize = 12;
			
			if (!this.fontNameToIndex[fontFamily])
			{
				this.fontNameToIndex[fontFamily] = this.fontCount + 1;
				this.fontCount++;
			}
			
			// this could be changed from F1, F2, etc. to TimesNewRoman, Arial, etc., but it would require some reworking
			// if we do that, you have to alos change the code in MakePdf that does this same construction
			var fontId = 'F' + this.fontNameToIndex[fontFamily];
			
			if (this.textAlign == 'center')
			{
				x -= this.savedCanvasContext.measureText(text).width / 2;
			}
			else if (this.textAlign == 'right')
			{
				x -= this.savedCanvasContext.measureText(text).width;
			}
			
			var textHeight = fontSize / this.unitsToPt;
			
			if (this.textBaseline == 'middle')
			{
				y += textHeight / 2;
			}
			else if (this.textBaseline == 'top')
			{
				y += textHeight;
			}
			else if (this.textBaseline == 'bottom')
			{
				y += 0;
			}
			
			this.SetPdfColors();
			this.commands.push('BT');
			// adjust fontSizeNumber if fontSizeUnits is anything other than 'pt'
			this.commands.push('/' + fontId + ' ' + fontSize.toString() + ' Tf');
			//this.commands.push('/F1 ' + this.fontSize.toString() + ' Tf');
			//this.commands.push(x.toString() + ' ' + y.toString() + ' TD');
			this.commands.push('1 0 0 1 ' + x.toString() + ' ' + y.toString() + ' Tm');
			this.commands.push('(' + text + ') Tj');
			this.commands.push('ET');
		}
	};
	Canvas.prototype.fillTextTruetype = function(text, x, y) {
		
		this.beginPath();
		
		var fontScale = this.fontScale;
		
		for (var i = 0; i < text.length; i++)
		{
			var code = text.charCodeAt(i);
			
			var fn = function(point) {
				var p = {};
				p.x = x + point.x * fontScale;
				p.y = y - point.y * fontScale;
				p.onCurve = point.onCurve;
				return p;
			};
			
			if (code == 32)
			{
				x += characterWidth;
			}
			else
			{
				var width = this.DrawGlyph(this.fontObject, text.charCodeAt(i) - 29, fn);
				//var width = this.fontObject.drawGlyph(text.charCodeAt(i) - 29, this, fn);
				x += width * fontScale; // this is where we put a kerning number
			}
			
			//x += characterWidth;
			
			this.fill();
		}
	};
	Canvas.prototype.measureText = function(str) {
		
		var glyphset = Griddl.fonts[this.fontFamily];
		
		var multiplier = this.fontSize / 2048; // replace 1000 with something
		
		var sum = 0;
		
		for (var i = 0; i < str.length; i++)
		{
			var glyph = glyphset[str[i]];
			if (!glyph) { glyph = glyphset["missing"]; }
			sum += glyph.width;
		}
		
		sum *= multiplier;
		
		return sum;
	};
	Canvas.prototype.measureTextNative = function(str) {
		
		if (this.drawCanvas)
		{
			return this.g.measureText(str);
		}
		else
		{
			this.savedCanvasContext.font = this.fontSize.toString() + this.fontSizeUnits + ' ' + this.fontFamily;
			return this.savedCanvasContext.measureText(str);
		}
	};
	Canvas.prototype.measureTextTruetype = function(str) {
		
		var sum = 0;
		
		for (var i = 0; i < str.length; i++)
		{
			var code = str.charCodeAt(i) - 29;
			var wd = this.fontObject.getGlyphWidth(code);
			sum += wd;
		}
		
		var width = sum * this.fontScale;
		
		return width;
	};
	Canvas.prototype.DrawDots = function(path, dx, dy, multiplier) {
		
		// annotate a path with dots at the end points and control points
		
		var oldstyle = this.fillStyle;
		this.fillStyle = 'rgb(255,0,0)';
		
		this.font = '10px Courier New';
		
		for (var i = 0; i < path.length; i++)
		{
			for (var k = 1; k < path[i].length; k += 2)
			{
				var x = path[i][k+0];
				var y = path[i][k+1];
				
				var tx = (x - dx) / multiplier;
				var ty = (dy - y) / multiplier;
				
				this.DrawCircle(x, y, 2, true, false);
				
				if (x < 400)
				{
					this.textAlign = "right";
					this.DrawText2(Math.floor(tx, 1).toString() + "," + Math.floor(ty, 1).toString(), x - 3, y);
				}
				else
				{
					this.textAlign = "left";
					this.DrawText2(Math.floor(tx, 1).toString() + "," + Math.floor(ty, 1).toString(), x + 3, y);
				}
			}
		}
		
		this.fillStyle = oldstyle;
	};
	Canvas.prototype.DrawGlyph = function(font, index, fn) {
		
		this.beginPath();
		
		//var glyph = font.readGlyph(index);
		var glyph = font.getGlyph(index);
		
		if (glyph === null || glyph.type !== "simple")
		{
			return false;
		}
		
		var i = 0;
		var contour = 0;
		var firstPointOfContour = true;
		var endIndex = 0;
		var firstContourPoint = {x:0,y:0};
		
		while (i < glyph.points.length)
		{
			var point = fn(glyph.points[i++]);
			
			if (firstPointOfContour)
			{
				this.moveTo(point.x, point.y);
				firstPointOfContour = false;
				firstContourPoint = { x : point.x , y : point.y };
			}
			else
			{
				if (!point.onCurve)
				{
					if (i > glyph.contourEnds[contour])
					{
						this.quadraticCurveTo(point.x, point.y, firstContourPoint.x, firstContourPoint.y);
						endIndex = i - 1;
					}
					else
					{
						var point2 = fn(glyph.points[i++]);
						
						if (!point2.onCurve)
						{
							if (i > glyph.contourEnds[contour])
							{
								this.bezierCurveTo(point.x, point.y, point2.x, point2.y, firstContourPoint.x, firstContourPoint.y);
								endIndex = i - 1;
							}
							else
							{
								var point3 = fn(glyph.points[i]);
								
								if (!point3.onCurve)
								{
									var endx = (point2.x + point3.x) / 2;
									var endy = (point2.y + point3.y) / 2;
									this.bezierCurveTo(point.x, point.y, point2.x, point2.y, endx, endy);
								}
								else
								{
									i++;
									endIndex = i - 1;
									this.bezierCurveTo(point.x, point.y, point2.x, point2.y, point3.x, point3.y);
								}
							}
						}
						else
						{
							endIndex = i - 1;
							this.quadraticCurveTo(point.x, point.y, point2.x, point2.y);
						}
					}
				}
				else
				{
					endIndex = i - 1;
					this.lineTo(point.x, point.y);
				}
			}
			
			if (endIndex === glyph.contourEnds[contour])
			{
				contour++;
				firstPointOfContour = true;
			}
		}
		
		this.fill();
		
		//i = 0;
		//while (i < glyph.points.length)
		//{
		//	var p = fn(glyph.points[i]);
		//	
		//	this.beginPath();
		//	this.arc(p.x, p.y, 2, 0, Math.PI * 2, true);
		//	this.fillStyle = 'rgb(255,0,0)';
		//	this.fill();
		//	this.font = '6pt Arial';
		//	this.fillStyle = 'black';
		//	this.fillText(i.toString(), p.x + 4, p.y)
		//	i++;
		//}
		
		var width = font.getGlyphWidth(index);
		
		return width;
	};
	
	Canvas.prototype.fillRect = function(left, top, width, height) { this.DrawRect(left, top, width, height, true, false); };
	Canvas.prototype.strokeRect = function(left, top, width, height) { this.DrawRect(left, top, width, height, false, true); };
	Canvas.prototype.clearRect = function(left, top, width, height) {
		
		if (this.drawCanvas)
		{
			this.g.clearRect(left, top, width, height);
		}
		
		if (this.drawSvg)
		{
			var svg = '<rect ';
			if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
			svg += 'style="fill:white;stroke:none;" ';
			svg += 'x=' + left.toString() + ' ';
			svg += 'y=' + top.toString() + ' ';
			svg += 'width=' + width.toString() + ' ';
			svg += 'height=' + height.toString() + ' ';
			svg += '></rect>';
			this.eltStrings.push(svg);
		}
		
		if (drawPdf)
		{
			this.commands.push('1 1 1 rg');
			this.commands.push(left.toString() + ' ' + top.toString() + ' ' + width.toString() + ' ' + height.toString() + ' re');
			this.commands.push('F');
		}
	};
	Canvas.prototype.DrawRect = function(left, top, width, height, doFill, doStroke) {
		if (this.drawCanvas)
		{
			if (doFill)
			{
				this.g.fillStyle = this.fillStyle;
				this.g.fillRect(left, top, width, height);
			}
			
			if (doStroke)
			{
				this.g.lineWidth = this.lineWidth;
				this.g.strokeStyle = this.strokeStyle;
				this.g.strokeRect(left, top, width, height);
			}
		}
		
		if (this.drawSvg)
		{
			var svg = '<rect ';
			
			if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
			var style = '';
			style += 'fill:' + this.fillStyle + ';';
			style += 'stroke:' + this.strokeStyle + ';';
			svg += 'style="' + style + '" ';
			svg += 'stroke-width="' + this.lineWidth.toString() + '" ';
			
			svg += 'x=' + left.toString() + ' ';
			svg += 'y=' + top.toString() + ' ';
			svg += 'width=' + width.toString() + ' ';
			svg += 'height=' + height.toString() + ' ';
			
			svg += '></rect>';
			
			this.eltStrings.push(svg);
		}
		
		if (drawPdf)
		{
			this.SetPdfColors();
			this.commands.push(left.toString() + ' ' + top.toString() + ' ' + width.toString() + ' ' + height.toString() + ' re');
			
			if (doFill)
			{
				this.commands.push('F');
			}
			
			if (doStroke)
			{
				this.commands.push('S');
			}
		}
	};
	
	// additional functions
	Canvas.prototype.fillCircle = function(cx, cy, r) { this.DrawCircle(cx, cy, r, true, false); };
	Canvas.prototype.strokeCircle = function(cx, cy, r) { this.DrawCircle(cx, cy, r, false, true); };
	Canvas.prototype.DrawCircle = function(cx, cy, r, doFill, doStroke) {
		
		if (this.drawCanvas)
		{
			this.g.beginPath();
			this.g.arc(cx, cy, r, 0, Math.PI * 2, true);
			
			if (doFill)
			{
				this.g.fillStyle = this.fillStyle;
				this.g.fill();
			}
			
			if (doStroke)
			{
				this.g.lineWidth = this.lineWidth;
				this.g.strokeStyle = this.strokeStyle;
				this.g.stroke();
			}
		}
		
		if (this.drawSvg)
		{
			var svg = '<circle ';
			
			if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
			var strokeStyle = doStroke ? this.strokeStyle.toString() : 'none';
			var fillStyle = doFill ? this.fillStyle.toString() : 'none';
			svg += 'stroke="' + strokeStyle + '" ';
			svg += 'fill="' + fillStyle + '" ';
			svg += 'stroke-width="' + this.lineWidth.toString() + '" ';
			
			svg += 'cx="' + cx + '" ';
			svg += 'cy="' + cy + '" ';
			svg += 'r="' + r + '"';
			svg += '></circle>';
			this.eltStrings.push(svg);
		}
		
		if (drawPdf)
		{
			// http://hansmuller-flex.blogspot.com/2011/04/approximating-circular-arc-with-cubic.html
			// we draw 4 bezier curves, one for each 90-degree quarter of the circle
			// first find the points at north,south,east,west - those are the endpoints
			// the control points are displaced vertically and horizontally from the endpoints (which makes sense, think of the tangent lines)
			// the displacement is the magic number k times the radius
			var k = 0.5522847498; // magic number: (4 / 3) * (Math.sqrt(2) - 1)
			
			var nx = cx;
			var ny = cy - r;
			var ex = cx + r;
			var ey = cy;
			var sx = cx;
			var sy = cy + r;
			var wx = cx - r;
			var wy = cy;
			
			var enx1 = ex;
			var eny1 = ey + k * r;
			var enx2 = nx + k * r;
			var eny2 = ny;
			var nwx1 = nx - k * r;
			var nwy1 = ny;
			var nwx2 = wx;
			var nwy2 = wy + k * r;
			var wsx1 = wx;
			var wsy1 = wy - k * r;
			var wsx2 = sx - k * r;
			var wsy2 = sy;
			var sex1 = sx + k * r;
			var sey1 = sy;
			var sex2 = ex;
			var sey2 = ey - k * r;
			
			this.SetPdfColors();
			this.commands.push(ex.toString() + ' ' + ey.toString() + ' m');
			this.commands.push(enx1.toString() + ' ' + eny1.toString() + ' ' + enx2.toString() + ' ' + eny2.toString() + ' ' + nx.toString() + ' ' + ny.toString() + ' c');
			this.commands.push(nwx1.toString() + ' ' + nwy1.toString() + ' ' + nwx2.toString() + ' ' + nwy2.toString() + ' ' + wx.toString() + ' ' + wy.toString() + ' c');
			this.commands.push(wsx1.toString() + ' ' + wsy1.toString() + ' ' + wsx2.toString() + ' ' + wsy2.toString() + ' ' + sx.toString() + ' ' + sy.toString() + ' c');
			this.commands.push(sex1.toString() + ' ' + sey1.toString() + ' ' + sex2.toString() + ' ' + sey2.toString() + ' ' + ex.toString() + ' ' + ey.toString() + ' c');
			
			if (doFill)
			{
				this.commands.push('F');
			}
			
			if (doStroke)
			{
				this.commands.push('S');
			}
		}
	};
	Canvas.prototype.drawLine = function(x1, y1, x2, y2) {
		
		// this could probably replace all the stuff below
		//this.beginPath();
		//this.moveTo(x1, y1);
		//this.lineTo(x2, y2);
		//this.stroke();
		
		if (this.drawCanvas)
		{
			this.g.lineWidth = this.lineWidth;
			this.g.strokeStyle = this.strokeStyle;
			this.g.beginPath();
			this.g.moveTo(x1, y1);
			this.g.lineTo(x2, y2);
			this.g.stroke();
		}
		
		if (this.drawSvg)
		{
			var svg = '<line ';
			
			if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
			var style = '';
			style += 'stroke:' + this.strokeStyle + ';';
			svg += 'style="' + style + '" ';
			svg += 'stroke-width="' + this.lineWidth.toString() + '" ';
			
			svg += 'x1="' + x1.toString() + '" ';
			svg += 'y1="' + y1.toString() + '" ';
			svg += 'x2="' + x2.toString() + '" ';
			svg += 'y2="' + y2.toString() + '" ';
			
			svg += '></line>';
			
			this.eltStrings.push(svg);
		}
		
		if (drawPdf)
		{
			this.SetPdfColors();
			this.commands.push(x1.toString() + ' ' + y1.toString() + ' m');
			this.commands.push(x2.toString() + ' ' + y2.toString() + ' l');
			this.commands.push('S');
		}
	};
	Canvas.prototype.drawBezier = function(x0, y0, x1, y1, x2, y2, x3, y3) {
		this.beginPath();
		this.moveTo(x0, y0);
		this.bezierCurveTo(x1, y1, x2, y2, x3, y3);
		this.stroke();
	};
	Canvas.prototype.drawEllipse = function(ellipse) {
		
		if (this.drawCanvas)
		{
			// ellipse() has limited browser support - right now only Chrome
			// ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise)
			this.g.beginPath();
			this.g.ellipse(ellipse.cx, ellipse.cy, ellipse.majorAxis, ellipse.minorAxis, ellipse.rotation, 0, Math.PI*2, true);
			this.g.stroke();
		}
		
		if (this.drawSvg)
		{
			// unfortunatelly SVG needlessly complicates things by requiring us to split the arc into at least two parts
			// start will be at 0 degrees, and end will be at 90 deg
			var start_x = ellipse.cx + Math.cos(ellipse.rotation)*ellipse.majorAxis;
			var start_y = ellipse.cy + Math.sin(ellipse.rotation)*ellipse.majorAxis;
			
			var end_x = ellipse.cx + Math.cos(ellipse.rotation+Math.PI/2)*ellipse.minorAxis;
			var end_y = ellipse.cy + Math.sin(ellipse.rotation+Math.PI/2)*ellipse.minorAxis;
			//console.log({majorAxis:majorAxis,ellipse.minorAxis:ellipse.minorAxis,rotation:rotation,center_x:ellipse.cx,center_y:ellipse.cy});
			//console.log({start_x:start_x,start_y:start_y,end_x:end_x,end_y:end_y});
			
			return [
				'M', start_x, start_y,
				'A', ellipse.majorAxis, ellipse.minorAxis, rotation*180/Math.PI, 0, 1, end_x, end_y,
				'A', ellipse.majorAxis, ellipse.minorAxis, rotation*180/Math.PI, 1, 1, start_x, start_y,
			].join(' ');
		}
		
		if (Griddl.drawPdf)
		{
			// need to approximate with bezier curves
		}
	};
	
	Canvas.prototype.fillPath = function(path) { this.drawPath(path, true, false); };
	Canvas.prototype.strokePath = function(path) { this.drawPath(path, false, true); };
	Canvas.prototype.drawPath = function(path, doFill, doStroke) {
		
		if (this.drawCanvas || drawPdf)
		{
			var args = [];
			
			if (typeof(path) == "string")
			{
				var s = '';
				
				// first split up the argstring.  this is not as simple on splitting on whitespace, because it is legal to smush letters and numbers together
				for (var i = 0; i < path.length; i++)
				{
					var c = path[i];
					var n = c.charCodeAt();
					
					if ((65 <= n && n <= 90) || (97 <= n && n <= 122))
					{
						if (s.length > 0)
						{
							args.push(parseFloat(s));
							s = '';
						}
						
						args.push(c); // this relies on letters coming as single letters only
					}
					else if (n == 32 || n == 13 || n == 10 || n == 9 || n == 44) // 44 = comma
					{
						if (s.length > 0)
						{
							args.push(parseFloat(s));
							s = '';
						}
					}
					else
					{
						s += c;
					}
				}
			}
			else
			{
				for (var i = 0; i < path.length; i++)
				{
					for (var k = 0; k < path[i].length; k++)
					{
						args.push(path[i][k]);
					}
				}
			}
			
			var x = 0;
			var y = 0;
			
			var origx = 0;
			var origy = 0;
			
			var lastCommand = null;
			var lastEndPointX = null;
			var lastEndPointY = null;
			var lastControlPointX = null;
			var lastControlPointY = null;
			
			this.beginPath();
			
			for (var i = 0; i < args.length; i++)
			{
				var arg = args[i]; // arg must be a single letter at this point
				var n = arg.charCodeAt();
				lastCommand = arg;
				
				// if the command is upper case, that means we use absolute coordinates.  so we zero out the current position
				// (this means that when computing coordinates to go to, we always add x and y
				if (65 <= n && n <= 90)
				{
					if (arg == 'H')
					{
						x = 0;
					}
					else if (arg == 'V')
					{
						y = 0;
					}
					else
					{
						x = 0;
						y = 0;
					}
				}
				
				if (arg == 'M' || arg == 'm')
				{
					x += args[++i];
					y += args[++i];
					
					// this is where we return to on a Z command (is this correct?)
					origx = x;
					origy = y;
					
					//this.beginPath();
					this.moveTo(x, y);
					//this.beginPath()
				}
				else if (arg == 'Z' || arg == 'z')
				{
					this.closePath();
					//this.lineTo(origx, origy);
				}
				else if (arg == 'L' || arg == 'l')
				{
					x += args[++i];
					y += args[++i];
					this.lineTo(x, y);
				}
				else if (arg == 'H' || arg == 'h')
				{
					x += args[++i];
					this.lineTo(x, y);
				}
				else if (arg == 'V' || arg == 'v')
				{
					y += args[++i];
					this.lineTo(x, y);
				}
				else if (arg == 'C' || arg == 'c')
				{
					var x1 = x + args[++i];
					var y1 = y + args[++i];
					var x2 = x + args[++i];
					var y2 = y + args[++i];
					x += args[++i];
					y += args[++i];
					
					lastEndPointX = x;
					lastEndPointY = y;
					lastControlPointX = x2;
					lastControlPointY = y2;
					
					this.bezierCurveTo(x1, y1, x2, y2, x, y);
				}
				else if (arg == 'S' || arg == 's')
				{
					// see https://developer.mozilla.org/en/SVG/Tutorial/Paths
					
					// S produces the same type of curve as earlier, but if it follows another S command or a C command,
					// the first control point is assumed to be a reflection of the one used previously.
					// If the S command doesn't follow another S or C command, then it is assumed that both control points for the curve are the same.
					
					// that is, the first control point is a reflection about the end point of the previous curve (preserving slope in chained beziers)
					
					var x1 = lastEndPointX + (lastEndPointX - lastControlPointX);
					var y1 = lastEndPointY + (lastEndPointY - lastControlPointY);
					var x2 = x + args[++i];
					var y2 = y + args[++i];
					x += args[++i];
					y += args[++i];
					
					lastEndPointX = x;
					lastEndPointY = y;
					lastControlPointX = x2;
					lastControlPointY = y2;
					
					this.bezierTo(x1, y1, x2, y2, x, y);
				}
				else if (arg == 'Q' || arg == 'q')
				{
					var x1 = x + args[++i];
					var y1 = y + args[++i];
					x += args[++i];
					y += args[++i];
					
					lastEndPointX = x;
					lastEndPointY = y;
					lastControlPointX = x1;
					lastControlPointY = y1;
					
					this.quadraticCurveTo(x1, y1, x, y);
				}
				else if (arg == 'T' || arg == 't')
				{
					// see https://developer.mozilla.org/en/SVG/Tutorial/Paths
					
					// As before, the shortcut looks at the previous control point you used, and infers a new one from it.
					// This means that after your first control point, you can make fairly complex shapes by specifying only end points.
					// Note that this only works if the previous command was a Q or a T command.
					// If it is not, then the control point is assumed to be the same as the previous point, and you'll only draw lines.
					
					if (lastControlPointX == null) { lastControlPointX = lastEndPointX; }
					if (lastControlPointY == null) { lastControlPointY = lastEndPointY; }
					
					var x1 = lastEndPointX + (lastEndPointX - lastControlPointX);
					var y1 = lastEndPointY + (lastEndPointY - lastControlPointY);
					x += args[++i];
					y += args[++i];
					
					lastEndPointX = x;
					lastEndPointY = y;
					lastControlPointX = x1;
					lastControlPointY = y1;
					
					this.quadraticCurveTo(x1, y1, x, y);
				}
				else if (arg == 'A' || arg == 'a')
				{
					var rx = x + args[++i];
					var ry = y + args[++i];
					var xAxisRotation = args[++i];
					var largeArcFlag = args[++i]; // 0 or 1
					var sweepFlag = args[++i]; // 0 or 1
					x += args[++i];
					y += args[++i];
					
					throw new Error();
					//this.arc(x, y, radius, startAngle, endAngle, anticlockwise);
				}
				else
				{
					// i've run into situations where there are implied commands - i.e. 'arg' will be a number and we have to infer the command
					// basically the rule is this: if the last command was m/M, the implied command is l/L
					// otherwise the implied command is the same as the last command
					
					// for now though, fuckit, let's just modify the path offline
					// the reason being that we either have to duplicate the code here to implement the implied commands
					// or otherwise somehow inject the command into the list, rewind i, and continue the loop
					// frankly, neither option is great
					
					//if (lastCommand == 'm')
					//{
					//	x += parseFloat(args[++i]);
					//	y += parseFloat(args[++i]);
					//	this.lineTo(x, y);
					//}
					//else if (lastCommand == 'M')
					//{
					//
					//}
					//else
					//{
					//
					//}
					
					throw new Error();
				}
				
				lastEndPointX = x;
				lastEndPointY = y;
			}
			
			if (doFill)
			{
				this.fill();
			}
			
			if (doStroke)
			{
				this.stroke();
			}
		}
		
		if (this.drawSvg)
		{
			var svg = '<path ';
			
			if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
			var style = '';
			style += 'fill:' + this.fillStyle + ';';
			style += 'stroke:' + this.strokeStyle + ';';
			svg += 'style="' + style + '" ';
			svg += 'stroke-width="' + this.lineWidth.toString() + '" ';
			
			svg += 'd="' + argstring + '" ';
			
			svg += '></path>';
			this.eltStrings.push(svg);
		}
	};
	
	Canvas.prototype.beginPath = function() {
		
		if (this.drawCanvas)
		{
			this.g.beginPath();
		}
		
		if (this.drawSvg)
		{
			this.currentPath = '';
		}
		
		if (drawPdf)
		{
			this.SetPdfColors();
		}
	};
	Canvas.prototype.closePath = function() {
		
		if (this.drawCanvas)
		{
			this.g.closePath();
		}
		
		if (this.drawSvg)
		{
			this.currentPath += 'z';
		}
		
		if (drawPdf)
		{
			this.commands.push('h');
		}
	};
	Canvas.prototype.stroke = function() {
		
		if (this.drawCanvas)
		{
			this.g.lineWidth = this.lineWidth;
			this.g.strokeStyle = this.strokeStyle;
			this.g.stroke();
		}
		
		if (this.drawSvg)
		{
			var svg = '<path ';
			
			if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
			var style = '';
			//style += 'fill:' + this.fillStyle + ';';
			style += 'stroke:' + this.strokeStyle + ';';
			svg += 'style="' + style + '" ';
			svg += 'stroke-width="' + this.lineWidth.toString() + '" ';
			
			svg += 'd="' + this.currentPath + '"';
			
			svg += '></path>';
			
			this.eltStrings.push(svg);
		}
		
		if (drawPdf)
		{
			this.commands.push('S');
		}
	};
	Canvas.prototype.fill = function() {
		
		if (this.drawCanvas)
		{
			this.g.fillStyle = this.fillStyle;
			this.g.fill();
		}
		
		if (this.drawSvg)
		{
			var svg = '<path ';
			
			if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
			var style = '';
			style += 'fill:' + this.fillStyle + ';';
			//style += 'stroke:' + this.strokeStyle + ';';
			svg += 'style="' + style + '" ';
			//svg += 'stroke-width="' + this.lineWidth.toString() + '" ';
			
			svg += 'd="' + this.currentPath + '"';
			
			svg += '></path>';
			
			this.eltStrings.push(svg);
		}
		
		if (drawPdf)
		{
			this.commands.push('F');
		}
	};
	Canvas.prototype.moveTo = function(x, y) {
		
		if (this.drawCanvas)
		{
			this.g.moveTo(x, y);
		}
		
		if (this.drawSvg)
		{
			if (this.drawSvg)
			{
				this.currentPath += ' M ' + x.toString() + ' ' + y.toString() + ' ';
			}
		}
		
		if (drawPdf)
		{
			this.commands.push(x.toString() + ' ' + y.toString() + ' m');
		}
	};
	Canvas.prototype.lineTo = function(x, y) {
		
		if (this.drawCanvas)
		{
			this.g.lineTo(x, y);
		}
		
		if (this.drawSvg)
		{
			this.currentPath += ' L ' + x.toString() + ' ' + y.toString() + ' ';
		}
		
		if (drawPdf)
		{
			this.commands.push(x.toString() + ' ' + y.toString() + ' l');
		}
	};
	Canvas.prototype.quadraticCurveTo = function(x1, y1, x, y) {
		
		if (this.drawCanvas)
		{
			this.g.quadraticCurveTo(x1, y1, x, y);
		}
		
		if (this.drawSvg)
		{
			this.currentPath += ' Q ' + x1.toString() + ' ' + y1.toString() + ' ' + x.toString() + ' ' + y.toString() + ' ';
		}
		
		if (drawPdf)
		{
			// put the end point as the second control point
			this.commands.push(x1.toString() + ' ' + y1.toString() + ' ' + x.toString() + ' ' + y.toString() + ' ' + x.toString() + ' ' + y.toString() + ' c');
		}
	};
	Canvas.prototype.bezierCurveTo = function(x1, y1, x2, y2, x, y) {
		
		if (this.drawCanvas)
		{
			this.g.bezierCurveTo(x1, y1, x2, y2, x, y);
		}
		
		if (this.drawSvg)
		{
			this.currentPath += ' C ' + x1.toString() + ' ' + y1.toString() + ' ' + x2.toString() + ' ' + y2.toString() + ' ' + x.toString() + ' ' + y.toString() + ' ';
		}
		
		if (drawPdf)
		{
			this.commands.push(x1.toString() + ' ' + y1.toString() + ' ' + x2.toString() + ' ' + y2.toString() + ' ' + x.toString() + ' ' + y.toString() + ' c');
		}
	};
	Canvas.prototype.arcTo = function(x, y, r, curveSelector) {
		
		// curveSelector is a sane way of doing what SVG arcs do with flags - just pick 0, 1, 2, 3
		// we have an implicit start point (where the current path cursor point is), and an explicit end point
		// given a radius, we can make a venn diagram, defining two identical circles, each with a center point on the perpendicular bisector between the start and end points
		// this means there are 4 possible arcs between the start and end points - these can be labeled 0, 1, 2, 3, left to right (from the pov of looking from the start to the end)
		
		
		// http://hansmuller-flex.blogspot.com/2011/04/approximating-circular-arc-with-cubic.html
	};
	Canvas.prototype.arc = function(cx, cy, r, startAngle, endAngle, anticlockwise) {
		
		if (this.drawCanvas)
		{
			this.g.arc(cx, cy, r, startAngle, endAngle, anticlockwise);
		}
		
		if (this.drawSvg)
		{
			var large = ((endAngle - startAngle) > Math.PI) ? 1 : 0;
			
			var rx = r;
			var ry = r;
			var xAxisRotation = 0;
			var largeArcFlag = large;
			var sweepFlag = 1;
			var x = cx + r * Math.cos(endAngle);
			var y = cy + r * Math.sin(endAngle);
			this.currentPath += ' A ' + rx.toString() + ' ' + ry.toString() + ' ' + xAxisRotation.toString() + ' ' + largeArcFlag.toString() + ' ' + sweepFlag.toString() + ' ' + x.toString() + ' ' + y.toString() + ' ';
		}
		
		if (drawPdf)
		{
			// http://hansmuller-flex.blogspot.com/2011/04/approximating-circular-arc-with-cubic.html
			//this.commands.push(x1.toString() + ' ' + y1.toString() + ' ' + x2.toString() + ' ' + y2.toString() + ' ' + x.toString() + ' ' + y.toString() + ' c');
		}
	};
	
	Canvas.prototype.drawImage = function(image, sx, sy, sw, sh, dx, dy, dw, dh) {
	
		// this bullshit is necessary because the drawImage function puts the src args before the dst args if they exist
		// like so - these are three valid ways to call the function:
		//CanvasRenderingContext2D.drawImage(image, dx, dy);
		//CanvasRenderingContext2D.drawImage(image, dx, dy, dw, dh);
		//CanvasRenderingContext2D.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
		
		if (dx === undefined)
		{
			dx = sx;
			dy = sy;
			
			if (sw === undefined)
			{
				sw = image.width;
				sh = image.height;
				dw = sw;
				dh = sh;
			}
			else
			{
				dw = sw;
				dh = sh;
			}
		}
		
		Canvas.prototype.DrawImage(image, dx, dy, dw, dh, sx, sy, sw, sh);
	};
	Canvas.prototype.DrawImage = function(image, dx, dy, dw, dh, sx, sy, sw, sh) {
		
		if (typeof(image) == 'string')
		{
			image = Griddl.GetData(image); // get the HTMLImageElement
		}
		
		// image is of type HTMLImageElement, HTMLCanvasElement, HTMLVideoElement
		// g.drawImage(image, dx, dy) - natural width and height are used
		// g.drawImage(image, dx, dy, dw, dh) - image is scaled to fit specified width and height
		// g.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) - all parameters specified, image scaled as needed (note that src params come first here)
		if (dw === undefined) { dw = image.width; }
		if (dh === undefined) { dh = image.height; }
		if (sx === undefined) { sx = 0; }
		if (sy === undefined) { sy = 0; }
		if (sw === undefined) { sw = image.width; }
		if (sh === undefined) { sh = image.height; }
		
		if (this.drawCanvas)
		{
			this.g.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
		}
		
		if (this.drawSvg)
		{
			var svg = '<image ';
			if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
			svg += 'x=' + dx.toString() + ' ';
			svg += 'y=' + dy.toString() + ' ';
			svg += 'width=' + dw.toString() + ' ';
			svg += 'height=' + dh.toString() + ' ';
			svg += 'xlink:href="' + image.src + '" ';
			svg += '></image>';
			this.eltStrings.push(svg);
		}
		
		if (drawPdf)
		{
			var imageXObject = {};
			imageXObject.Type = 'XObject';
			imageXObject.Subtype = 'Image';
			imageXObject.ColorSpace = 'DeviceRGB';
			imageXObject.BitsPerComponent = 8;
			
			// we draw the image onto an invisible canvas to get access to pixel data
			
			var savedCanvasWidth = image.width;
			var savedCanvasHeight = image.height;
			//var savedCanvasWidth = dw;
			//var savedCanvasHeight = dh;
			
			this.savedCanvas.width = savedCanvasWidth;
			this.savedCanvas.height = savedCanvasHeight;
			this.savedCanvasContext.clearRect(0, 0, savedCanvasWidth, savedCanvasHeight);
			//this.savedCanvasContext.drawImage(image, 0, 0);
			this.savedCanvasContext.drawImage(image, 0, 0, savedCanvasWidth, savedCanvasHeight);
			
			var imageData = this.savedCanvasContext.getImageData(0, 0, savedCanvasWidth, savedCanvasHeight);
			var pixelData = imageData.data;
			
			var imagestreamlines = [];
			
			for (var i = 0; i < imageData.height; i++)
			{
				for (var j = 0; j < imageData.width; j++)
				{
					var R = pixelData[(i * imageData.width + j) * 4 + 0];
					var G = pixelData[(i * imageData.width + j) * 4 + 1];
					var B = pixelData[(i * imageData.width + j) * 4 + 2];
					var A = pixelData[(i * imageData.width + j) * 4 + 3];
					
					var hex = '';
					hex += R.toString(16).toUpperCase()
					hex += G.toString(16).toUpperCase()
					hex += B.toString(16).toUpperCase()
					imagestreamlines.push(hex);
				}
			}
			
			var imagestream = imagestreamlines.join('');
			
			imagestream += '>\r\n';
			
			imageXObject['[stream]'] = imagestream;
			
			imageXObject.Width = image.width;
			imageXObject.Height = image.height;
			imageXObject.Length = imagestream.length;
			imageXObject.Filter = 'ASCIIHexDecode';
			
			this.imageXObjects.push(imageXObject);
			
			
			var scale = 1;
			var imagematrix = '';
			imagematrix += (scale * dw).toString() + ' 0 0 ';
			imagematrix += (scale * dh).toString() + ' ';
			imagematrix += (scale * dx).toString() + ' ';
			//imagematrix += (this.currentPage.height - scale * (dy + dh)).toString() + ' cm';
			imagematrix += (scale * (dy + dh)).toString() + ' cm';
			
			var imagename = 'Im' + this.imageXObjects.length.toString();
			var imagecommand = '/' + imagename + ' Do';
			
			this.imageDict[imagename] = imageXObject;
			
			this.commands.push('q'); // save the current matrix
			this.commands.push(imagematrix);
			this.commands.push(imagecommand);
			this.commands.push('Q'); // restore the current matrix
		}
	};
	Canvas.prototype.getImageData = function(left, top, width, height) { return this.g.getImageData(left, top, width, height); };
	Canvas.prototype.putImageData = function(img, left, top) { this.g.putImageData(img, left, top); };
	
	// AddText,AddImage,etc. use these - also, maybe it's a bad idea to have these be just the capitalized versions of save() and restore(), which are the passthrough versions?
	Canvas.prototype.Save = function() {
		var saved = {};
		saved.fontFamily = this.fontFamily;
		saved.fontSize = this.fontSize;
		saved.fontSizeUnits = this.fontSizeUnits;
		saved.textAlign = this.textAlign;
		saved.textBaseline = this.textBaseline;
		saved.fillStyle = this.fillStyle;
		saved.strokeStyle = this.strokeStyle;
		saved.lineWidth = this.lineWidth;
		this.styleStack.push(saved);
	};
	Canvas.prototype.Restore = function() {
		var saved = this.styleStack.pop();
		this.fontFamily = saved.fontFamily;
		this.fontSize = saved.fontSize;
		this.fontSizeUnits = saved.fontSizeUnits;
		this.textAlign = saved.textAlign;
		this.textBaseline = saved.textBaseline;
		this.fillStyle = saved.fillStyle;
		this.strokeStyle = saved.strokeStyle;
		this.lineWidth = saved.lineWidth;
	};
	
	// https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform
	Canvas.prototype.save = function() {
		
		if (this.drawCanvas)
		{
			this.g.save();
		}
		
		if (this.drawSvg)
		{
			var clone = [];
			for (var i = 0; i < this.transforms.length; i++) { clone.push(this.transforms[i]); }
			this.transformStack.push(clone);
		}
		
		if (drawPdf)
		{
			this.commands.push('q');
		}
	};
	Canvas.prototype.restore = function() {
		
		if (this.drawCanvas)
		{
			this.g.restore();
		}
		
		if (this.drawSvg)
		{
			this.transforms = this.transformStack.pop();
		}
		
		if (drawPdf)
		{
			this.commands.push('Q');
		}
	};
	Canvas.prototype.scale = function(x, y) {
		
		if (this.drawCanvas)
		{
			// EX: using translate(0,canvas.height); scale(1,-1); you will have the Cartesian coordinate system, with the origin in the bottom left corner
			this.g.scale(x, y);
		}
		
		if (this.drawSvg)
		{
			this.transforms.push('scale(' + x.toString() + ' ' + y.toString() + ')');
		}
		
		if (drawPdf)
		{
			var sx = x;
			var kx = 0;
			var dx = 0;
			var sy = y;
			var ky = 0;
			var dy = 0;
			this.commands.push(sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ' cm');
		}
	};
	Canvas.prototype.rotate = function(angle) {
		
		// to rotate counterclockwise about the origin
		// (  cos a   -sin a   0  ) ( x )   ( x0 )   ( x cos a - y sin a )
		// (  sin a    cos a   0  ) ( y ) = ( y0 ) = ( y cos a + x sin a )
		// (    0       0      1  ) ( 1 )   (  1 )   (         1         )
		
		// it kills me to accept the canvas convention of clockwise rotation, but we want to maintain code compatibility with canvas
		this.rotateClockwise(angle);
	};
	Canvas.prototype.rotateCounterClockwise = function(angle) {
		
		if (this.drawCanvas)
		{
			// Rotates the canvas clockwise around the current origin by the angle number of radians.
			this.g.rotate(-angle); // we negatize the angle
		}
		
		if (this.drawSvg)
		{
			this.transforms.push('rotate(' + -(angle / (Math.PI * 2) * 360).toString() + ')');
		}
		
		if (drawPdf)
		{
			var sx = Math.cos(angle);
			var kx = -Math.sin(angle);
			var dx = 0;
			var sy = Math.cos(angle);
			var ky = Math.sin(angle);
			var dy = 0;
			this.commands.push(sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ' cm');
		}
	};
	Canvas.prototype.rotateClockwise = function(angle) {
		
		if (this.drawCanvas)
		{
			// Rotates the canvas clockwise around the current origin by the angle number of radians.
			this.g.rotate(angle);
		}
		
		if (this.drawSvg)
		{
			this.transforms.push('rotate(' + (angle / (Math.PI * 2) * 360).toString() + ')');
		}
		
		if (drawPdf)
		{
			var sx = Math.cos(-angle);
			var kx = -Math.sin(-angle);
			var dx = 0;
			var sy = Math.cos(-angle);
			var ky = Math.sin(-angle);
			var dy = 0;
			this.commands.push(sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ' cm');
		}
	};
	Canvas.prototype.translate = function(x, y) {
		
		if (this.drawCanvas)
		{
			this.g.translate(x, y);
		}
		
		if (this.drawSvg)
		{
			this.transforms.push('translate(' + x.toString() + ' ' + y.toString() + ')');
		}
		
		if (drawPdf)
		{
			var sx = 1;
			var kx = 0;
			var dx = x;
			var sy = 1;
			var ky = 0;
			var dy = y;
			this.commands.push(sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ' cm');
		}
	};
	Canvas.prototype.transform = function(sx, kx, ky, sy, dx, dy) {
		
		// note that the order of arguments for CanvasRenderingContext2D is different than the order for SVG and PDF
		// namely, Canvas does kx, ky and SVG/PDF do ky, kx
		// wait, are we sure about that?  maybe we should double check what the canvas transform expects
		
		if (this.drawCanvas)
		{
			// this is multiplied to the current transformation matrix
			// m11 m12 dx
			// m21 m22 dy
			//  0   0   1
			// m11 = sx = horizontal scale
			// m12 = kx = horizontal skew
			// m21 = ky = vertical skew
			// m22 = sy = vertical scale
			// dx = horizontal translation
			// dy = vertical translation
			
			// m11 m12 dx     x     x0
			// m21 m22 dy  *  y  =  y0
			//  0   0   1     1     1
			
			// so when a new matrix is multiplied to the existing matrix, it is post-multiplied to the current matrix
			// m0 * m1 * m2 * v = v0
			
			this.g.transform(sx, kx, ky, sy, dx, dy);
		}
		
		if (this.drawSvg)
		{
			this.transforms.push('matrix(' + sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ')');
		}
		
		if (drawPdf)
		{
			// discussion of transformations starts on page 207 of the PDF spec
			// PDF transformation matrices specify the conversion from the transformed coordinate system to the untransformed system
			// this means that we specify a point to be drawn (x y 1) in the transformed system and then it is multiplied by the matrix to transform it to the original system
			
			//  a  b  c  d  e  f cm
			// sx ky kx sy dx dy cm
			
			//          a b o
			//          c d 0
			// (x y 1)  e f 1
			
			//          sx ky o
			//          kx sy 0
			// (x y 1)  dx dy 1
			
			// x0 = x * a + y * c + e = x * sx + y * kx + dx
			// y0 = x * b + y * d + f = x * ky + y * sy + dy
			// (where x0 and y0 represent the coordinates in the original coordinate system - that is, as they appear on screen)
			
			// this, maddeningly and appropriately enough, is the inverse of the transformation matrix of canvas
			// in PDF, we have a row vector on the left and the matrix on the right
			// in canvas, we have a column vector on the right and a matrix on the left
			
			// when a new matrix is added to the chain, it is premultiplied
			
			// all of this assumes that we are transforming the coordinate system, not the points!  but possibly it works for the points too
			// row vector = matrix on right = premultiply chained matrices    v0 = rowvector * m2 * m1 * m0
			// col vector = matrix on left = postmultiply chained matrices    m0 * m1 * m2 * colvector = v0
			
			var sx = sx;
			var kx = kx;
			var dx = dx;
			var sy = sy;
			var ky = ky;
			var dy = dy;
			this.commands.push(sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ' cm');
		}
	};
	Canvas.prototype.setTransform = function(sx, kx, ky, sy, dx, dy) {
		
		if (this.drawCanvas)
		{
			// this overwrites the current transformation matrix
			this.g.setTransform(sx, kx, ky, sy, dx, dy);
		}
		
		if (this.drawSvg)
		{
			this.transforms = [ 'matrix(' + sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ')' ];
		}
		
		if (drawPdf)
		{
			//this.commands.push('');
		}
	};
	Canvas.prototype.resetTransform = function() {
	
		if (this.drawCanvas)
		{
			this.g.resetTransform();
		}
		
		if (this.drawSvg)
		{
			this.transforms = [];
		}
		
		if (drawPdf)
		{
			//this.commands.push('');
		}
	};
	
	return Canvas;
})();

return Griddl;

})();

Number.prototype.toCommaNumber = function() {
	var str = this.toString();
	
	var index = 4;
	
	while (index <= str.length)
	{
		var pos = str.length - index + 1;
		str = str.substr(0, pos) + ',' + str.substr(pos);
		index += 4;
	}
	
	return str;
};

