
(function () {
function thisModule() {

// This is all an attempt to make cells more in the mold of Excel than Javascript
// By which I mean: formulas, display functions, and <div>'s are all bound together
// there is an attempt to do execution order with promises
// in general, i have decided to put this on hold and go with a model closer to Javascript
// functions and receptor divs decoupled: rather, functions *assign to* their receptor divs by name
// execution order: just a Main() function or subfunctions that execute on various simple events like changes or button clicks
function Driver() {
	
	//LoadScrubber();
	//LoadChartNew();
	//LoadParser();
	
	//ConvertEsprimaParseToHtml();
	//Explore10K();
	//ExcelScrubbing();
	
	//var doc = 'Viacom-2013-09-30.htm';
	//var doc = 'John-Deere-2013-10-31.htm';
	
	//var div = $(document.createElement('div')).appendTo($('body'));
	//div.attr('id', 'docbox');
	//div.css('display', 'none');
	//Load10K(doc);
	
	//var doc = 'committee.htm';
	//var div = $(document.createElement('div')).appendTo($('body'));
	//div.attr('id', 'docbox');
	//div.css('display', 'none');
	//$('#docbox').load(doc, function() {
	//	var htablediv = $(document.createElement('div')).appendTo($('body'));
	//	var wikiLinksInaUlInaTable = $("table ul a[href^='/wiki']");
	//	//wikiLinksInaUlInaTable.each(function(index, elt) { $(elt).attr('href', 'http://en.wikipedia.org' + $(elt).attr('href')); }); // full href
	//	//wikiLinksInaUlInaTable.appendTo(htablediv);
	//	//htablediv.children('a').after('<br />');
	//	var hrefs = wikiLinksInaUlInaTable.map(function() { return $(this).attr('href'); }).get();
	//	var listOfObjs = $.map(hrefs, function(elt) { return { name : elt }; });
	//	htablediv.handsontable({ data : listOfObjs }); });
	
	//var url = 'mining/waterways.htm';
	//ExtractTablesFromWikipedia(url);
	
	//var url = 's&pmining/sp500.htm';
	
	//Read10klist();
	//ReadFilingDetail();
	
	//ReadNymagIndexes();
	//CleanHtm();
}
function LoadScrubber() {
	globals = {};
	
	var listContainer = $(document.createElement('div'));
	listContainer.attr('id', 'listContainer');
	$('body').append(listContainer);
	
	var LoadRoot = function(data)
	{
		globals.root = data;
		globals.set = { name : "Set" , attrs : [] , children : Flatten(data) };
		LoadTreeInto(listContainer, data);
		
		//var rootCell = MakeCell('root', "Load('SLM.json')", 'LoadTreeInto');
		//$('body').append(rootCell.div);
		//rootCell.eval();
		
		var paraCell = MakeCell('paras', "Filter(globals.set, TagNamePred('p'))", 'LoadTreeInto');
		$('body').append(paraCell.div);
		paraCell.eval();
		
		//var tableCell = MakeCell('tables', "Filter(Filter(globals.set, TagNamePred('table')), TagAttrPred('id', 'fs-table'))", 'LoadTreeInto');
		//$('body').append(tableCell.div);
		//tableCell.eval();
		
		//var tableCell2 = MakeCell('tables2', "ExtractTable(Filter(Filter(globals.set, TagNamePred('table')), TagAttrPred('id', 'fs-table')).children[0].children[1])", 'LoadTableInto');
		//$('body').append(tableCell2.div);
		//tableCell2.eval();
	};
	
	//var url = 'Northrup Grumman 2012-12-31.json';
	var url = 'bloomberg.json';
	//var url = 'SLM.json';
	
	$.ajax({ url : url , dataType : 'json' , success : LoadRoot , error : function() { throw new Error(); } });
}
function LoadChartNew() {
	
	var chartfnCell = MakeLoadCell('LineChart', 'chart-line.js', 'text', 'LoadTextInto');
	var chartDataCell = MakeLoadCell('chartData', 'chartdata.json', 'json', 'LoadTableInto');
	var chartCell = MakeCell('chart', 'chartData', 'LineChart');
	
	$('body').append(chartfnCell.div);
	$('body').append(chartDataCell.div);
	$('body').append(chartCell.div);
	
	var prom1 = chartfnCell.eval();
	var prom2 = chartDataCell.eval();
	RSVP.all([ prom1 , prom2 ]).then(function(array) {
		// arg is an array of results for the given promises
		chartCell.eval();
	}).catch(function(reason){
		// if any of the promises fails.
	});
	
	// now set up the dependencies and eval all cells in the proper order
	
	// perhaps a better way of doing the scheduling is to just output an eval order for all cells, based on the dependency digraph
	// this is probably an easy thing for a graph library to do
	// but it would need to be implemented as a chain of callbacks, because ajax functions are async
}
function LoadChart() {
	
	// the textbox containing the draw function is a cell
	// as is the canvas - the display part of the canvas includes a header with filename, error indicator, and save buttons
	// the data table should probably be a cell - it needs a name and a filename at least - but it is specialized for loading, not as a formula result
	// the tables that define chart parameters should be packed into some named collection - this collection does not need a formula though
	
	var textarea = $(document.createElement('textarea'));
	textarea.css('position', 'absolute');
	textarea.css('top', '100px');
	textarea.css('left', '50px');
	textarea.css('width', '600px');
	textarea.css('height', '400px');
	textarea.on('blur', Redraw);
	$.ajax('chart-line.js', 'text', function(str) { textarea[0].value = str; });
	$('body').append(textarea);
	
	var canvas = $(document.createElement('canvas'));
	canvas.css('position', 'absolute');
	canvas.css('top', '5em');
	canvas.css('left', '55em');
	canvas.css('width', '40em');
	canvas.css('height', '40em');
	canvas.css('border', '1px solid #c3c3c3');
	$('body').append(canvas);
	
	var filenameTextarea = $(document.createElement('textarea'));
	filenameTextarea.css('position', 'absolute');
	filenameTextarea.css('top', '5em');
	filenameTextarea.css('left', '5em');
	filenameTextarea.css('width', '15em');
	filenameTextarea.css('height', '2em');
	filenameTextarea[0].value = 'genimg/unit0.png';
	$('body').append(filenameTextarea);
	
	var $saveLocal = $(document.createElement('button'));
	$saveLocal.html('Save Local');
	$saveLocal.button();
	$('body').append($saveLocal);
	$saveLocal.on('click', 'ClientSaveLocal');
	
	var $saveRemote = $(document.createElement('button'));
	$saveRemote.html('Save Remote');
	$saveRemote.button();
	$('body').append($saveRemote);
	$saveRemote.on('click', 'ClientSaveRemote');
	
	var errorStatus = $(document.createElement('div'));
	errorStatus.attr('id', 'errorStatus');
	errorStatus.html('No Error');
	$('body').append(errorStatus);
	
	var Redraw = function()
	{
		try
		{
			var fn = new Function('args', textarea[0].value);
			fn(args);
			errorStatus.html('No Error');
		}
		catch (e)
		{
			errorStatus.html('Error');
		}
	};
	
	var layoutTableContainer = $(document.createElement('div'));
	$('body').append(layoutTableContainer);
	layoutTableContainer.css('position', 'absolute');
	layoutTableContainer.css('left', '42em');
	layoutTableContainer.css('top', '5em');
	
	var layoutKeys = [ 'xAxisPx' , 'yAxisPx' , 'xAxisDatarange' , 'yAxisDatarange' ];
	
	for (var i = 0; i < layoutKeys.length; i++)
	{
		var key = layoutKeys[i];
		
		//var namediv = $(document.createElement('div'));
		//layoutTableContainer.append(namediv);
		//namediv.html(key);
		//namediv.css('display', 'block');
		
		var div = $(document.createElement('div'));
		layoutTableContainer.append(div);
		div.css('margin', '1em');
		
		div.handsontable({
			data : args[key] ,
			rowHeaders : vars ,
			colHeaders : [ 'lock' , 'value' ] ,
			
			afterChange: function(changes, source)
			{
				Redraw();
			},
		});
	}
	
	var dataTableDiv = $(document.createElement('div'));
	$('body').append(dataTableDiv);
	dataTableDiv.css('position', 'absolute');
	dataTableDiv.css('left', '5em');
	dataTableDiv.css('top', '35em');
	
	dataTableDiv.handsontable({
		data : args.data ,
		rowHeaders : true ,
		colHeaders : [ 'foo' , 'bar' , 'baz' ] ,
		contextMenu : true ,
		
		afterChange: function(changes, source)
		{
			Redraw();
		},
	});
}
function LoadParser() {
	
	var $ajaxButton = $(document.createElement('button'));
	$('body').append($ajaxButton);
	$ajaxButton.html('Parse');
	$ajaxButton.button();
	$ajaxButton.css('vertical-align', 'top');
	$ajaxButton.on('click', function() {
		var cm = $(this).data('codemirror');
		var text = cm.getValue();
		$.ajax({ type : 'POST' , data : text , dataType : 'json' , url : 'doparse' , success : function(obj) {
			React.renderComponent(TextResultsTable(obj), $('#resultsContainer')[0]); // InstanceResultsTable
		}});
	});
	
	// the grammar textbox is one cell
	// the boxtree display is another
	// and the parse results is yet another
	
	var $divRoot = $(document.createElement('div'));
	var $divLeft = $(document.createElement('div'));
	var $divRight = $(document.createElement('div'));
	var $divLeftTop = $(document.createElement('div'));
	var $divLeftBottom = $(document.createElement('div'));
	
	$('body').append($divRoot);
	$divRoot.append($divLeft);
	$divRoot.append($divRight);
	$divLeft.append($divLeftTop);
	$divLeft.append($divLeftBottom);
	
	$divLeft.css('display', 'inline-block');
	
	$divRight.attr('id', 'resultsContainer');
	$divRight.css('display', 'inline-block');
	$divRight.css('vertical-align', 'top');
	$divRight.css('margin-left', '20px');
	
	$divLeftTop.attr('id', 'textboxContainer');
	$divLeftTop.css('display', 'block');
	
	$divLeftBottom.attr('id', 'boxtreeContainer');
	$divLeftBottom.css('display', 'block');
	
	var keymap = {};
	keymap['Esc'] = function (cm) { $('body')[0].focus(); };
	var cm = CodeMirror($('#textboxContainer')[0], { value : 'Seq\n  A\n  Alt\n    B\n    C\n  D' , mode : 'javascript' , extraKeys : keymap });
	
	cm.getInputField().onblur = function()
	{
		var lines = cm.getValue().trim().split('\n');
		var twigs = Frcelang.ReadTreeSimple(lines);
		React.renderComponent(Boxtree(twigs[0]), $('#boxtreeContainer')[0]);
	};

	$ajaxButton.data('codemirror', cm);
	
	cm.getInputField().onblur();
}
function MakeCell(name, formula, displayFormula) {
	
	var cell = MakeCellCommon();
	cell.name = name;
	cell.formula = formula;
	cell.displayFormula = displayFormula;
	cell.results = null;
	cell.displayfn = null;
	
	cell.nameBox[0].value = cell.name;
	cell.formulaBox[0].value = cell.formula;
	cell.displayFormulaBox[0].value = cell.displayFormula;
	
	cell.eval = function()
	{
		this.results = eval(this.formula);
		cell.redisplay();
	};
	
	return cell;
}
function MakeLoadCell(name, url, dataType, displayFormula) {
	
	var cell = MakeCellCommon();
	cell.name = name;
	cell.formula = url;
	cell.dataType = dataType;
	cell.displayFormula = displayFormula;
	cell.results = null;
	cell.displayfn = null;
	
	cell.nameBox[0].value = cell.name;
	cell.formulaBox[0].value = cell.formula;
	cell.displayFormulaBox[0].value = cell.displayFormula;
	
	// the action of a load cell is to do the ajax call and then redisplay
	cell.eval = function()
	{
		var promise = new RSVP.Promise(function(resolve, reject) {
			$.ajax({ url : cell.formula , dataType : cell.dataType ,
			success : function(data) {
				cell.results = data;
				cell.redisplay();
				resolve(data);
			} ,
			error : function(error) {
				reject(error);
			}
			});
		});
		
		return promise;
	};
	
	return cell;
}
function MakeCellCommon() {
	var rootDiv = $(document.createElement('div'));
	var nameBox = $(document.createElement('textarea'));
	var formulaBox = $(document.createElement('textarea'));
	var displayFormulaBox = $(document.createElement('textarea'));
	var resultsDiv = $(document.createElement('div'));
	
	rootDiv.append(nameBox);
	rootDiv.append(formulaBox);
	rootDiv.append(displayFormulaBox);
	rootDiv.append(resultsDiv);
	
	//rootDiv.css('display', 'inline-block');
	nameBox.css('display', 'block');
	formulaBox.css('display', 'block');
	displayFormulaBox.css('display', 'block');
	
	nameBox.css('width', '50em');
	formulaBox.css('width', '50em');
	displayFormulaBox.css('width', '50em');
	
	rootDiv.css('width', '60em');
	//rootDiv.css('position', 'absolute');
	rootDiv.css('border', '1px solid black');
	rootDiv.css('margin', '1em');
	rootDiv.css('padding', '1em');
	rootDiv.draggable();
	
	nameBox.css('border', '1px solid gray');
	formulaBox.css('border', '1px solid gray');
	displayFormulaBox.css('border', '1px solid gray');
	resultsDiv.css('border', '1px solid gray');
	
	// the sub-divs should not bubble events up to the root div - the root div should be draggable only when you click it directly
	resultsDiv.on('mousedown', function(e) { e.stopPropagation(); });
	
	var cell = {};
	cell.div = rootDiv;
	cell.nameBox = nameBox;
	cell.formulaBox = formulaBox;
	cell.displayFormulaBox = displayFormulaBox;
	cell.resultsDiv = resultsDiv;
	
	cell.formulaBox.on('blur', function(e)
	{
		cell.formula = e.target.value;
		cell.eval();
	});
	
	cell.displayFormulaBox.on('blur', function(e)
	{
		cell.displayFormula = e.target.value;
		cell.redisplay();
	});
	
	cell.redisplay = function()
	{
		this.displayfn = eval(this.displayFormula);
		this.displayfn(this.resultsDiv, this.results);
	};
	
	return cell;
}

// HtmlTree = { name : "" , text : "" , attrs : [ { key : "" , val : "" } ] , children : [ HtmlTree ] }
function LoadTreeRec(parentul, data) {
	var li = $(document.createElement('li'));
	parentul.append(li);
	
	if (data.name)
	{
		var str = '&lt;';
		str += data.name;
		for (var i = 0; i < data.attrs.length; i++)
		{
			str += ' ';
			str += data.attrs[i].key;
			str += '=';
			str += "'";
			str += data.attrs[i].val;
			str += "'";
		}
		str += '&gt;';
		li.append(str);
	}
	else if (data.text)
	{
		li.append(data.text);
	}
	else
	{
		throw new Error();
	}
	
	if (data.children)
	{
		var ul = $(document.createElement('ul'));
		li.append(ul);
		
		for (var i = 0; i < data.children.length; i++)
		{
			LoadTreeRec(ul, data.children[i]);
		}
	}
}
function LoadTreeInto(div, data) {
	var ul = $(document.createElement('ul'));
	ul.addClass('collapsibleList');
	LoadTreeRec(ul, data);
	Indentree.applyTo(ul);
	div.empty();
	div.append(ul);
}
function LoadTableInto(div, data) {
	div.empty();
	var subdiv = $(document.createElement('div')); // we have to create a new div because handsontable chokes when re-called on the same div it was originally called on
	div.append(subdiv);
	subdiv.handsontable({ data : data });
}
function LoadTextInto(div, text) {
	div.empty();
	var textarea = $(document.createElement('textarea'));
	div.append(textarea);
	textarea[0].value = text;
}

// Flatten: { value : "a" , children : [ { value : "b" } ] } => [ { value : "a" , children : <link> } , { value : "b" } ]
function Flatten(e) { var list = []; FlattenRec(list, e); return list; }
function FlattenRec(list, e) { list.push(e); if (e.children) { e.children.forEach(function(x) { FlattenRec(list, x); }); } }

// ExtractTable works on POJOs that represent HTML, ScrubTable works on the DOM - both return a matrix of strings

// ExtractTable maps AllText over table.children.children, returns a matrix
function ExtractTable(table) {
	var m = [];
	
	for (var i = 0; i < table.children.length; i++)
	{
		var tr = table.children[i];
		var row = [];
		
		for (var j = 0; j < tr.children.length; j++)
		{
			var td = tr.children[j];
			row.push(AllText(td));
		}
		
		m.push(row);
	}
	
	return m;
}
// AllText returns elt.text if availble, else maps AllText over elt.children
function AllText(elt) {
	if (elt.text)
	{
		return elt.text;
	}
	else
	{
		if (elt.children)
		{
			var str = "";
			
			for (var i = 0; i < elt.children.length; i++)
			{
				str += AllText(elt.children[i]);
			}
			
			return str;
		}
		else
		{
			return "";
		}
	}
}

// Filter, Map: { name : "Set" , attrs : [] , children : [] } => { name : "Set" , attrs : [] , children : [] }
function Filter(set, pred) {
	var l = { name : "Set" , attrs : [] , children : [] };
	
	for (var i = 0; i < set.children.length; i++)
	{
		var e = set.children[i];
		
		if (pred(e))
		{
			l.children.push(e);
		}
	}
	
	return l;
}
function Map(set, fn) {
	var l = { name : "Set" , attrs : [] , children : [] };
	
	for (var i = 0; i < set.children.length; i++)
	{
		var e = set.children[i];
		l.children.push(fn(e));
	}
	
	return l;
}

// predicates to be sent to Filter
function TagNamePred(name) { return function(tag) { return tag.name && tag.name == name; }; }
function TagAttrPred(key, val) { return function(tag) { return tag.attrs && tag.attrs[key] && (!val || tag.attrs[key] == val); }; }

function ClientSaveLocal() {
	Canvas2Image.saveAsPNG(document.getElementById('canvas0'));
}
function ClientSaveRemote() {
	var base64str = Canvas2Image.returnBase64(document.getElementById('canvas0'));
	$.ajax({
		type : 'PUT',
		url : document.getElementById('filename').value,
		data : base64DecToArr(base64str.substr(22)),
		processData : false
	});
}

// <table> => [ [ "" ] ]    ScrubTable is used by Explore10K and ExtractTablesFromWikipedia
function ScrubTable(table) {
	var matrix = [];
	var trs = table.find('tr');
	
	for (var i = 0; i < trs.size(); i++)
	{
		var tr = trs.eq(i);
		
		var row = [];
		var tds = tr.find('td');
		
		if (tds.size() == 0)
		{
			tds = tr.find('th');
		}
		
		for (var k = 0; k < tds.size(); k++)
		{
			var td = tds.eq(k);
			
			var colspan = td.attr('colspan');
			
			if (colspan)
			{
				colspan = parseInt(colspan);
			}
			else
			{
				colspan = 1;
			}
			
			row.push(td.text().trim());
			
			for (var j = 0; j < colspan - 1; j++)
			{
				row.push('');
			}
		}
		
		matrix.push(row);
	}
	
	return matrix;
}
function Explore10K(div) {
	//var iframe = $(document.createElement('iframe'));
	//iframe.attr('src', doc);
	//iframe.css('display', 'none');
	//$('body').append(iframe);
	//iframe.on('load', 
	//var html = $($('iframe')[0].contentDocument.children[0]); // $('iframe').contents().first().children()
	
	//var root = $(div).find('html');
	var root = $(div);
	
	// John Deere 2013-10-31
	//var text = $(div).find('text');
	//text.children('br').remove(); // remove page breaks
	//text.children('div').children(':first-child').unwrap(); // remove page divs, leaving a fairly flat structure of mostly <p>, <table>, and <div>
	////text.children().filter(function() { return $(this).text() == ""; }).remove(); // this removes sections with no text, but leaves those with &nbsp;
	////text.children().filter(function() { return $(this).text().trim() == ""; }).remove(); // this removes those &nbsp; sections, but it leaves the paras smushed together
	//text.children().filter(function() { return $(this).text().trim() == ""; }).replaceWith('<br />'); // this works pretty well!
	//text.children('p[align="center"]').filter(function() { var text = $(this).text(); return /^[0-9]+$/.test(text); }).remove(); // this removes line numbers
	//text.children('div[style^="float"]').removeAttr('style'); // this converts from two-column style to one-column style
	//text.find('table').remove(); // if we want to just focus on paragraph structure, this is convenient
	//text.find('a[href="#TableOfContents"]').parent().parent().remove(); // remove table of contents links - we should also ligate the surrounding paras
	//// remove unnecessary styles and attrs
	//// normalize font and font size - standardize to 11pt times new roman or something
	
	// structural information is conveyed by the word 'respectively'
	// keywords: acquisitions, employees
	
	var tables = root.find('table');
	//var paras = root.find('p');
	
	var allTablesContainer = $(document.createElement('div')).appendTo($('body')); // table
	
	// table processing:
	tables.map(function(index, elt) {
		var singleTableContainer = $(document.createElement('div')).appendTo(allTablesContainer); // tr
		var ht = ScrubTable($(elt));
		var sub1 = $(document.createElement('div')).css('margin-bottom', '1em').appendTo(singleTableContainer); // td
		var sub2 = $(document.createElement('div')).css('margin-bottom', '1em').appendTo(singleTableContainer); // td
		//var sub3 = $(document.createElement('div')).css('margin-bottom', '1em').appendTo(singleTableContainer); // td
		//var sub4 = $(document.createElement('div')).css('margin-bottom', '1em').appendTo(singleTableContainer); // td
		//var sub5 = $(document.createElement('div')).css('margin-bottom', '1em').appendTo(singleTableContainer); // td
		sub1.append($(elt));
		sub2.handsontable({ data : ht }); // raw
		//sub3.handsontable({ data : ht }); // guess
		//sub4.handsontable({ data : ht }); // override
		//sub5.handsontable({ data : ht }); // final
		console.log(index);
	});
	
	
	// non-jQuery means of getting all text nodes and their constituent text - jQuery makes it too hard to do this
	//var alltextnodes = GetAllTextNodes(root[0], false);
	//var alltextstrings = []; for (var i = 0; i < alltextnodes.length; i++) { alltextstrings.push(alltextnodes[i].nodeValue); }
	//
	//var font = root.find('font');
	//var underline = root.find('u');
	//var italic = root.find('i');
	//var bold = root.find('b');
	//var anchors = root.find('a');
	//var hrs = root.find('hr');
	//var brs = root.find('br');
	
	// find page breaks and remove them
	// organize by headers - form a new tree based on the logical flow - the leaf nodes here are paragraphs
	
	//var tableOfContents = anchors.filter('[href="#TableOfContents"]');
	//var italicText = italic.map(function() { return $(this).html(); });
	//var fontItalicText = italic.children('font').map(function() { return $(this).html(); });
	
	//var boldText = bold.map(function() { return $(this).text(); });
	//var arialText = font.filter('[face="Arial"]').map(function() { return $(this).text(); });
	//var timesText = font.filter('[face="Times New Roman"]').map(function() { return $(this).text(); });
	
	//var text = paras.eq(1).text();
	// tables.eq(5).find('*').contents().filter(function(){ return this.nodeType !== 1; }); // this returns a list of text nodes - a lot will contain only whitespace or &nbsp; though
	// root.find('c').map(function() { return $(this).text(); }); // this map returns a jQuery list of strings
	
	// map over tables to get a form suitable for implantation into a handsontable
	// http://api.jquery.com/map/
	// .map( callback(index, domElement) ) => returns a jQuery object
	
	// str.replace can do lexing - replace '2012' with '$year' or something, and then '$year' can be a part of a higher-level regex
}
function Load10K(url) { $('#docbox').load(url, function() { Explore10K(this); }); }
function ExtractTablesFromWikipedia(url) {
	var div = $(document.createElement('div')).appendTo($('body'));
	div.attr('id', 'docbox');
	div.css('display', 'none');
	$('#docbox').load(url, function() {
		$('table.wikitable').each(function() { // sortable
			//var trs = $(this).find('tr');
			//var hrefs = trs.map(function(index, elt) { return { href : 'http://www.sec.gov' + $(elt).children().eq(2).find('a').attr('href') }; }).get();
			var matrix = ScrubTable($(this));
			console.log('table rows: ' + matrix.length);
			if (matrix.length == 0) { return; }
			var div = $(document.createElement('div'));
			$('body').append(div);
			div.handsontable({ data : matrix });
		});
	});
}

// { a : { b : 0 } } => [ { a : <link> } , { b : 0 } ]
function FlattenRec(lst, obj) {
	
	//if (obj.__proto__ != [].__proto__) { lst.push(obj); }
	
	// we have two problems - one is that arrays make it here, and also empty objects that are the "value" field of regexp literals.  this check catches them both
	if (obj.type)  { lst.push(obj); }
	
	for (var key in obj)
	{
		var val = obj[key];
		
		if (val !== null && typeof(val) == "object") // typeof([]) == "object", which is why we need the __proto__ check above.  but we still want to recurse on arrays!
		{
			FlattenRec(lst, val);
		}
	}
}

// [ { type : "" } ] => { "typeA" : 3 , "typeB" : 2 }
function TypeCount(lst) {
	
	var typeCount = {};
	
	for (var i = 0; i < lst.length; i++)
	{
		var obj = lst[i];
		var type = obj.type;
		
		if (typeCount[type] === undefined)
		{
			typeCount[type] = 1;
		}
		else
		{
			typeCount[type]++;
		}
	}
	
	return typeCount;
}

// ConvertEsprimaParseToHtml uses FlattenRec and TypeCount
function ConvertEsprimaParseToHtml() {
	var flat = [];
	
	var urls = [];
	urls[0] = 'codemirror.json';
	urls[1] = 'handsontable.json';
	urls[2] = 'timbre.json';
	urls[3] = 'threejs.json';
	
	$.ajax({ url : urls[0] , dataType : 'json' , error : function() { debugger; } , success : function(obj) {
		FlattenRec(flat, obj);
		TypeCount(flat);
	}});
}

function ExcelScrubbing() {
// These next two lines return 1. a list of formulas and 2. the id's of all cells that contain a formula.  The lists should be the same .size()
// var fms = html.find('c').children('f').map(function() { return $(this).text(); })
// var ids = html.find('c').children('f').map(function() { return $(this).parent().get(0); }).map(function() { return $(this).attr('r'); })
}

// utility functions
function GetAllTextNodes(node, includeWhitespaceNodes) {
	var textNodes = [];
	var nonWhitespaceMatcher = /\S/;
	
	function GetTextNodes(node)
	{
		if (node.nodeType == 3)
		{
			if (includeWhitespaceNodes || nonWhitespaceMatcher.test(node.nodeValue))
			{
				textNodes.push(node);
			}
		}
		else
		{
			for (var i = 0, len = node.childNodes.length; i < len; ++i)
			{
				GetTextNodes(node.childNodes[i]);
			}
		}
	};
	
	GetTextNodes(node);
	
	return textNodes;
}
function Tokenize(text) {
	var lexer = new RegExp('[0-9]+|[A-Za-z]+(\'s)?|\\$[0-9]+(,[0-9]+)*|[^0-9A-Za-z\\s]', 'g'); // digits | letters('s) | money | any other single char
	
	var tokens = [];
	var k = 0;
	
	while (k < text.length)
	{
		var l = lexer.exec(text);
		tokens.push(l[0]);
		k = lexer.lastIndex;
	}
	
	return tokens;
}
function PadNumber(number, nDigits) {
	var s = number.toString();
	var padding = "";
	for (var i = 0; i < nDigits - s.length; i++) { padding += "0"; };
	return padding + s;
}

// general, single-purpose function: load an .htm file into a div
function CleanHtm() {
	var filename = 'nymag/Stores-001.htm';
	
	var div = $(document.createElement('div')).appendTo($('body'));
	div.attr('id', 'docbox');
	div.css('display', 'none');
	// the * below prevents scripts in the loaded page from being executed - see https://api.jquery.com/load/ under 'Script Execution'
	$('#docbox').load(filename + ' *', function()
	{
		debugger;
	});
}

// specific functions to read a specific format of HTML file
function Read10klist() {
	var div = $(document.createElement('div')).appendTo($('body'));
	div.attr('id', 'docbox');
	div.css('display', 'none');
	var growtable = $(document.createElement('table')).appendTo($('body'));
	growtable.attr('id', 'growtable');
	var c = 0;
	$.ajax({ url : 's&pmining/tickers.json' , dataType : 'json' , error : function() { debugger; } , success : function(tickers) {
		for (var i = 0; i < tickers.length; i++)
		{
			var LoadHtm = function(ticker) {
				$('#docbox').load('s&pmining/10klists/' + ticker + '.htm', function() {
					$('a#documentsbutton').each(function() {
						var tr = $(document.createElement('tr')).appendTo(growtable);
						var td = null;
						td = $(document.createElement('td')).appendTo(tr);
						td.html(ticker);
						td = $(document.createElement('td')).appendTo(tr);
						td.html('http://www.sec.gov' + $(this).attr('href'));
						td = $(document.createElement('td')).appendTo(tr);
						td.html($(this).parent().next().next().html());
					});
					console.log(c++);
				});
			};
			LoadHtm(tickers[i]);
		}
	}});
}
function ReadFilingDetail() {
	var div = $(document.createElement('div')).appendTo($('body'));
	div.attr('id', 'docbox');
	div.css('display', 'none');
	var growtable = $(document.createElement('table')).appendTo($('body'));
	growtable.attr('id', 'growtable');
	var c = 0;
	$.ajax({ url : 's&pmining/filingdetail.json' , dataType : 'json' , error : function() { debugger; } , success : function(filenames) {
		for (var i = 0; i < filenames.length; i++)
		{
			var LoadHtm = function(filename) {
				$('#docbox').load('s&pmining/filingdetail/' + filename + '.htm', function() {
					var tr = $(document.createElement('tr')).appendTo(growtable);
					var td = null;
					td = $(document.createElement('td')).appendTo(tr);
					td.html(filename);
					td = $(document.createElement('td')).appendTo(tr);
					td.html('http://www.sec.gov' + $('table').find('tr').eq(1).find('td').eq(2).find('a').attr('href'));
					console.log(c++);
				});
			};
			LoadHtm(filenames[i]);
		}
	}});
}
function ReadNymagIndexes() {
	var div = $(document.createElement('div')).appendTo($('body'));
	div.attr('id', 'docbox');
	div.css('display', 'none');
	var growtable = $(document.createElement('table')).appendTo($('body'));
	growtable.attr('id', 'growtable');
	var c = 0;
	var barPages = 70;
	var storePages = 147;
	var restoPages = 180;
	for (var i = 1; i <= barPages; i++)
	{
		//break;
		var thefile = 'nymag/Bars-' + PadNumber(i, 3) + '.htm';
		//if (i == 1) { debugger; }
		var LoadHtm = function(filename)
		{
			$('#docbox').load(filename + ' table#resultsFound', function()
			{
				//if (c == 0) { debugger; }
				var trs = $('table#resultsFound tbody tr');
				trs.each(function(index, elt) 
				{
					var e = $(elt);
					var name = e.find('dt a').text().trim();
					var link = e.find('dt a').attr('href');
					var blurb = e.find('dd.dek').text().trim();
					var address = e.find('dd.address').text().trim();
					var maplink = e.find('li.first a').attr('href');
					var neighborhood = e.children('td').eq(1).text().trim(); // .eq(1) for Stores/Bar, .eq(3) for Resto
					//var cuisine = e.children('td').eq(1).text().trim(); // Resto only
					//var price = e.children('td').eq(2).text().trim(); // Resto only
					
					var tr = $(document.createElement('tr')).appendTo(growtable);
					var td = null;
					td = $(document.createElement('td')).appendTo(tr);
					td.html(name);
					td = $(document.createElement('td')).appendTo(tr);
					td.html(link);
					td = $(document.createElement('td')).appendTo(tr);
					td.html(blurb);
					td = $(document.createElement('td')).appendTo(tr);
					td.html(address ? address : "[Blank]");
					td = $(document.createElement('td')).appendTo(tr);
					td.html(maplink ? maplink : "[Blank]");
					td = $(document.createElement('td')).appendTo(tr);
					td.html(neighborhood ? neighborhood : "[Blank]");
					//td = $(document.createElement('td')).appendTo(tr); // Resto only
					//td.html(cuisine ? cuisine : "[Blank]"); // Resto only
					//td = $(document.createElement('td')).appendTo(tr); // Resto only
					//td.html(price ? price : "[Blank]"); // Resto only
					
					console.log(c++);
				});
			});
		};
		LoadHtm(thefile);
	}
}

function RawJsonToIndentreeDriver() {
	
	Frce.LoadMenubarText($('#menubar').text());
	
	var type = "rawjson";
	var url = "";
	
	if (type == 'rawjson')
	{
		$.ajax({ type : 'GET' , dataType : 'json' , url : url , failure : function(e) { throw new Error(); } , success : function(obj) {
			var div = $(document.createElement('div'));
			var ul = RawJsonToIndentree(obj);
			div.append(ul);
			$('body').append(div);
			Indentree.applyTo(ul);
		}});
	}
	else if (type == 'esprima')
	{
	
	}
	else if (type == 'html')
	{
	
	}
	else if (type == 'filereport')
	{
	
	}
}
function RawJsonToIndentree(json) {
	
	var ul = $(document.createElement('ul'));
	RawJsonToIndentreeRec(ul, "[root]", json);
	return ul;
}
function RawJsonToIndentreeRec(parentul, key, obj) {
	
	var li = $(document.createElement('li'));
	parentul.append(li);
	
	var str = '';
	
	if (obj == null)
	{
		str = key + ' : ' + 'null';
		li.append(str);
	}
	else if (typeof(obj) == "object")
	{
		if (obj.length) // a stupid way to test for an array
		{
			str = key + " : [" + obj.length.toString() + "]";
		}
		else
		{
			str = key + " : {}";
		}
		
		if (obj.type)
		{
			str += ' , type : ' + obj.type;
		}
		
		if (obj.nodeId)
		{
			str += ' , nodeId : ' + obj.nodeId;
		}
		
		//li.addClass('indentreeOpen');
		
		var ul = $(document.createElement('ul'));
		
		for (var subkey in obj)
		{
			if (subkey == 'type' || subkey == 'nodeId')
			{
				// already taken care of above
			}
			else
			{
				var subobj = obj[subkey];
				
				if (subobj == null || typeof(subobj) == 'string' || typeof(subobj) == 'number' || typeof(subobj) == 'boolean')
				{
					str += ' , ' + subkey + ' : ' + subobj;
				}
				else
				{
					li.addClass('indentreeOpen');
					RawJsonToIndentreeRec(ul, subkey, obj[subkey]);
				}
			}
		}
		
		li.append(str);
		li.append(ul);
	}
	else
	{
		li.append(key + " : " + obj.toString());
	}
}

function Annotate() {
	var colors = [ 'rgb(170,0,0)' , 'red' , 'orange' , 'gold' , 'lime' , 'green' , 'teal' , 'blue' , 'purple' , 'fuchsia' ];
	
	var anchors = [];
	
	$('iframe').each(function(index, elt) {
		var tables = $(this.contentDocument.body).find('table');
		
		tables.prepend(function(index, html) {
			var anchor = '<a name="table' + index + '"></a>';
			anchors.push('<a href="#table' + index + '">table ' + index + '</a><br />');
			var span = '<span style="color:red;">table ' + index + '</span>';
			return anchor + span;
		});
		
		tables.each(function(index, elt) {
			var trs = $(this).find('tr');
			
			trs.prepend(function(index, html) {
				return '<td>' + index + '</td>';
			});
			
			trs.each(function(index, elt) {
				$(this).find('td').each(function(index, html) {
					$(this).css('background-color', colors[index % colors.length]);
				});
			});
		});
		
		$(this.contentDocument.body).prepend(anchors.join(''));
	});
}
function AnnotateParasAndDivs() {
	$('iframe').each(function(index, elt) {
		var paras = $(this.contentDocument.body).find('p');
		
		paras.prepend(function(index, html) {
			return '<span style="color:red;">p ' + index + '</span>';
		});
	});
	
	$('iframe').each(function(index, elt) {
		var divs = $(this.contentDocument.body).find('div');
		
		divs.prepend(function(index, html) {
			return '<span style="color:red;">div ' + index + '</span>';
		});
	});
}
function Get(tables, table, row, col) {
	return tables.eq(table).find('tr').eq(row).find('td').eq(col).text().trim();
}

var Scrubber = {};
Scrubber.RawJsonToIndentree = RawJsonToIndentree;
Scrubber.CleanHtm = CleanHtm;
Scrubber.Annotate = Annotate;
Scrubber.AnnotateParasAndDivs = AnnotateParasAndDivs;
Scrubber.Get = Get;
return Scrubber;

}

if (typeof define === "function" && define.amd) {
    define(thisModule);
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisModule();
} else {
    this.Scrubber = thisModule();
}

})();

