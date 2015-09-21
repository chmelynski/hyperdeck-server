
function Main() {
	
	$('.menubar').menubar();
	var workbook = Frcelang.ReadScript($('#frce').text());
	
	globals = {};
	globals.objs = [];
	
	var errorStatus = $('#errorStatus');
	
	var textcm = null;
	var regexes = null;
	var matchesDiv = null;
	var outputDiv = null;
	
	var ExecRegexes = function()
	{
		//try
		//{
			var text = textcm.getValue();
			var matches = [];
			
			for (var i = 0; i < regexes.length; i++)
			{
				var regex = new RegExp(regexes[i].regex, 'g');
				
				while (true)
				{
					// re.exec('4 score and 7 years ago') => { 0 : "4" , index : 0 , input : "4 score..." } , re.lastIndex = 1
					var match = regex.exec(text);
					if (match === null) { break; }
					matches.push({ regex : regexes[i].name , value : match[0] });
				}
			}
			
			if (matchesDiv !== null)
			{
				matchesDiv.handsontable(
				{
					data : matches ,
					height : 650 ,
					rowHeaders : false ,
					colHeaders : false ,
					afterChange : function(changes, source) { Redraw(); } ,
					colWidths : [ 10 , 40 ].map(function(elt) { return elt * Frce.TextWidth('m', '11pt Calibri'); })
				});
			}
			
		//	errorStatus[0].innerText = "No Error";
		//}
		//catch (e)
		//{
		//	errorStatus[0].innerText = "Error";
		//}
	};
	
	var Redraw = function()
	{
	
	};
	
	for (var i = 0; i < workbook.length; i++)
	{
		var obj = workbook[i];
		
		var div = Frce.CreateNormalDiv($('body'), obj.name + 'Container');
		//var div = Frce.CreateComponentDiv($('body'), obj.name + 'Container');
		
		if (obj.name == 'text')
		{
			var textbox = $(document.createElement('textarea'));
			textbox.attr('id', obj.name);
			div.append(textbox);
			
			obj.codemirror = CodeMirror.fromTextArea(textbox[0], { /* mode : 'javascript' */ });
			obj.codemirror.getDoc().setValue(obj.text);
			obj.codemirror.on('blur', ExecRegexes);
			
			textcm = obj.codemirror;
		}
		
		if (obj.name == 'regexes')
		{
			obj.$ = Frce.MatrixToObjs(obj.matrix);
			
			var tableDiv = $(document.createElement('div'));
			tableDiv.attr('id', obj.name);
			div.append(tableDiv);
			
			regexes = obj.$;
			
			tableDiv.handsontable(
			{
				data : obj.$ ,
				rowHeaders : false ,
				colHeaders : false ,
				contextMenu : true ,
				afterChange : function(changes, source) { ExecRegexes(); } ,
				//colWidths : Frce.DetermineColWidths(obj.$, '11pt Calibri', [ 5 , 23 , 5 ]) // expand widths to accomodate text length
				colWidths : [ 10 , 30 , 10 ].map(function(elt) { return elt * Frce.TextWidth('m', '11pt Calibri'); }) // fixed widths, regardless of text length
			});
		}
		
		if (obj.name == 'matches')
		{
			matchesDiv = $(document.createElement('div'));
			matchesDiv.attr('id', obj.name);
			div.append(matchesDiv);
		}
		
		if (obj.name == 'output')
		{
			outputDiv = $(document.createElement('div'));
			outputDiv.attr('id', obj.name);
			div.append(outputDiv);
		}
		
		globals.objs[obj.name] = obj;
		globals.objs.push(obj);
	}
	
	ExecRegexes();
}

/*
#textContainer
{
	position : absolute;
	top : 5em;
	left : 2em;
}

#text
{
	width : 60em;
	height : 40em;
}

#regexesContainer
{
	position : absolute;
	top : 32em;
	left : 2em;
}

#matchesContainer
{
	position : absolute;
	top : 5em;
	left : 44em;
}

#outputContainer
{
	position : absolute;
	top : 6em;
	left : 60em;
}

#output
{
	border : 1px solid #c3c3c3;
}
*/

