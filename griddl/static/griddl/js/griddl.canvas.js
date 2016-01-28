
// there are 46 $'s in this file - not all are references to jQuery, but most are (some are LaTeX delimiters)
// some of this could be removed, surely, but there are other places where it maybe cannot
// like $('.mathjaxInput').remove() is a thing that is called in NewDocument() (= called every time we use Canvas)
// how do we select classes without jQuery?
// does document.querySelectorAll() and Array.from() work in all browsers (this is what we used to replace the mathjax remove above

if (typeof Griddl === 'undefined') { var Griddl = {}; }

Griddl.Canvas = (function() {
	
	// on subsequent callings of NewDocument(), existing canvases should not be destroyed - just cleared
	// calls to NewPage() should return those existing canvases
	// if there are excess calls to NewPage(), new canvases should be created
	// if there is a shortfall of calls to NewPage(), extra canvases should be destroyed on the call to GenerateDocument()
	// what we get out of this: the scroll position of the document won't be reset, which means we can make a change on the left and see it on the right
	
	// maybe NewDocument should be merged into the Canvas constructor?
	function Canvas() {
		
		// this is here so that user code does not need to do it - the function invoked by the export button needs access to the canvas
		Griddl.griddlCanvas = this;
		
		if (typeof window != 'undefined')
		{
			Object.defineProperty(this, 'font', { set : function (str) { 
				
				var letterIndex = str.search(/[A-Za-z]/);
				var spaceIndex = str.search(' ');
				
				// the above fails on '10 pt Helvetica' (space between 10 and pt), so do this
				if (letterIndex > spaceIndex) { spaceIndex = letterIndex + str.substr(letterIndex).search(' '); }
				
				var part0 = str.substring(0, letterIndex).trim();
				var part1 = str.substring(letterIndex, spaceIndex);
				var part2 = str.substring(spaceIndex+1);
				
				this.fontSize = parseFloat(part0);
				this.fontSizeUnits = part1;
				this.fontFamily = part2;
				
				this.savedCanvasContext.font = this.fontSize.toString() + this.fontSizeUnits + ' ' + this.fontFamily;
			} });
			
			// this is used for conversion of 'red' => 'rgb(255,0,0)' and text measurement and access of pixel data of image components
			this.savedCanvas = document.createElement('canvas');
			this.savedCanvasContext = this.savedCanvas.getContext('2d');
		}
		
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
		this.canvas = null; // this is the bare <canvas> element for the current page
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
		//if (typeof window != 'undefined') { $('.mathjaxInput').remove(); }
		if (typeof window != 'undefined') { Array.from(document.querySelectorAll('.mathjaxInput')).forEach(function(elt) { elt.remove(); }); }
		
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
		
		this.fontFamily = 'Times-Roman';
		this.fontSize = 12;
		this.fontSizeUnits = 'pt';
		
		this.textAlign = 'left'; // start, end, left, right, center
		this.textBaseline = 'alphabetic'; // top, hanging, middle, alphabetic, ideographic, bottom
		
		this.fillStyle = 'rgb(0,0,0)';
		this.strokeStyle = 'rgb(0,0,0)';
		this.lineWidth = 1;
	}
	
	Canvas.NewDocument = function(params) {
		
		// params:
		//  div - selector or <div> or nothing
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
		
		var g = new Canvas();
		g.pages = [];
		g.drawCanvas = (type == 'canvas');
		g.drawSvg = (type == 'svg');
		g.type = type;
		g.unitsToPx = unitsToPx;
		g.unitsToPt = unitsToPt;
		
		if (typeof window != 'undefined')
		{
			//var parentDiv = CreateOutputDiv(div, Canvas.CreateButtonDivFour);
			var parentDiv = CreateOutputDiv(div, null, params);
			g.parentDiv = parentDiv;
		}
		
		Griddl.g = g; // this is a hook for node, used in RenderSvg
		
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
		
		if (typeof window != 'undefined')
		{
			var div = $(document.createElement('div'));
			//div.attr('id', name);
			div.css('border', '1px solid #c3c3c3');
			div.css('margin', '1em');
			div.css('width', pxWidth);
			div.css('height', pxHeight);
			this.parentDiv.append(div);
		}
		
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
			if (typeof window != 'undefined') { page.div = div; }
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
		if (this.type == 'canvas') { this.canvas = this.g.canvas; }
		this.commands = page.pdfCommands;
		this.eltStrings = page.eltStrings;
		this.currentPage = page;
	};
	
	// helpers for the constructor functions - this is fairly specific to the particulars of the component layout
	// which is to say, maybe it should be with the component stuff - it's typically called from a component, after all
	function CreateOutputDiv(div, buttonDivFn, params) {
		
		var thediv = null;
		
		if (div === null || div === undefined)
		{
			var existing = $('#output'); // hardcoded selector
			
			if (existing.length == 0)
			{
				var divWidth = (params ? (params.divWidth ? params.divWidth : '54em') : '54em');
				var divHeight = (params ? (params.divHeight ? params.divHeight : '40em') : '40em');
				
				var outputDiv = $(document.createElement('div'));
				outputDiv.attr('id', 'output');
				outputDiv.css('position', 'absolute');
				outputDiv.css('top', '5em');
				outputDiv.css('left', '45em');
				outputDiv.css('width', divWidth);
				outputDiv.css('height', divHeight);
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
		
		$('#buttons').remove();
		
		var buttonDiv = $(document.createElement('div'));
		buttonDiv.attr('id', 'buttons');
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
	Canvas.CreateButtonDivThree = function() {
		
		// #buttons {
		// position:absolute;
		// top:3em;
		// left:45em;
		// }
		// 
		// <button onclick="Griddl.ExportLocalCanvas('document')">Export to PNG</button>
		// <button onclick="Griddl.ExportLocalSvg('svg', 'document')">Export to SVG</button>
		// <button onclick="Griddl.ExportLocalPdf('draw', 'document')">Export to PDF</button>
		
		$('#buttons').remove();
		
		var buttonDiv = $(document.createElement('div'));
		buttonDiv.attr('id', 'buttons');
		buttonDiv.css('position', 'absolute');
		buttonDiv.css('top', '3em');
		buttonDiv.css('left', '45em');
		
		var button2 = $(document.createElement('button'));
		var button3 = $(document.createElement('button'));
		var button4 = $(document.createElement('button'));
		
		button2.on('click', function() { Griddl.ExportLocalCanvas('document'); });
		button3.on('click', function() { Griddl.ExportLocalSvg('svg', 'document'); });
		button4.on('click', function() { Griddl.ExportLocalPdf('draw', 'document'); });
		
		button2.text('Export to PNG');
		button3.text('Export to SVG');
		button4.text('Export to PDF');
		
		buttonDiv.append(button2);
		buttonDiv.append(button3);
		buttonDiv.append(button4);
		
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
		
		$('#buttons').remove();
		
		var buttonDiv = $(document.createElement('div'));
		buttonDiv.attr('id', 'buttons');
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
				
				var svg = $(jax.inputDivId + ' .MathJax_SVG_Display').children().first().children().first();
				
				// these dimensions are in units of 'ex' - how to reliably convert to px?
				//var width = svg.attr('width');
				//var height = svg.attr('height');
				
				// this doesn't work for <svg> tags?
				//var width = svg.clientWidth;
				//var height = svg.clientHeight;
				
				var width = svg[0].width.baseVal.value;
				var height = svg[0].height.baseVal.value;
				
				var d = AlignText(jax.style, width, height);
				
				g.save();
				g.translate(jax.x + d.dx, jax.y + d.dy);
				
				var scale = g.fontSize / 1024;
				g.scale(scale, -scale);
				
				svg.children().each(function(key, val) {
					
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
						else if (tag.tagName == 'rect')
						{
							var x = parseFloat($(tag).attr('x'));
							var y = parseFloat($(tag).attr('y'));
							var width = parseFloat($(tag).attr('width'));
							var height = parseFloat($(tag).attr('height'));
							
							g.fillRect(x, y, width, height);
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
		
		if (typeof window != 'undefined')
		{
			// all calls to drawMath put a typeset operation in the queue, and then at the end, we put this callback in the queue
			// that guarantees that it will be executed after every typeset operation completes
			if (window.MathJax) { MathJax.Hub.Queue(callback); }
			
			// we have to make this part of the callback, so that it executes after all mathjax have been rendered
			if (window.MathJax) { MathJax.Hub.Queue(RenderSvg); } else { RenderSvg(); }
		}
		else
		{
			RenderSvg();
		}
	};
	var RenderSvg = function() {
		
		var xmlnss = 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"';
		
		if (typeof window != 'undefined')
		{
			if (this.drawSvg)
			{
				for (var i = 0; i < this.pages.length; i++)
				{
					var page = this.pages[i];
					page.div.html('<svg ' + xmlnss + ' width="' + page.width + '" height="' + page.height + '">' + page.eltStrings.join('') + '</svg>');
				}
			}
		}
		else
		{
			Griddl.svgOutput = '<svg ' + xmlnss + ' width="' + Griddl.g.pages[0].width + '" height="' + Griddl.g.pages[0].height + '">' + Griddl.g.pages[0].eltStrings.join('') + '</svg>';
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
				var args = parts[++k].split(' ');
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
	
	function AlignText(style, width, height) {
		
		var dx = 0;
		var dy = 0;
		
		if (style.textAlign == 'left' || style.textAlign == 'start') // i18n needed
		{
			// no change
		}
		else if (style.textAlign == 'center')
		{
			dx = -width / 2;
		}
		else if (style.textAlign == 'right' || style.textAlign == 'end') // i18n needed
		{
			dx = -width;
		}
		else
		{
			throw new Error();
		}
		
		//var textHeightUnits = style.fontSize / style.unitsToPt;
		
		if (style.textBaseline == 'middle')
		{
			dy = height / 2;
		}
		else if (style.textBaseline == 'top')
		{
			dy = height;
		}
		else if (style.textBaseline == 'bottom')
		{
			// no change?
		}
		else if (style.textBaseline == 'alphabetic')
		{
			// no change?
		}
		else if (style.textBaseline == 'ideographic')
		{
			// wat do?
		}
		else
		{
			throw new Error();
		}
		
		return {dx:dx,dy:dy};
	}
	
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
		
		var fillColor = null;
		var strokeColor = null;
		
		if (typeof window != 'undefined')
		{
			this.savedCanvasContext.fillStyle = this.fillStyle; // this will convert from 'red' to 'rgb(255,0,0)'
			this.savedCanvasContext.strokeStyle = this.strokeStyle; // this will convert from 'red' to 'rgb(255,0,0)'
			fillColor = this.savedCanvasContext.fillStyle;
			strokeColor = this.savedCanvasContext.strokeStyle;
		}
		else
		{
			fillColor = this.fillStyle;
			strokeColor = this.strokeStyle;
		}
		
		if (fillColor[0] == '#')
		{
			fillColor = this.ParseHexColor(fillColor);
		}
		else if (fillColor.substr(0, 3) == 'rgb')
		{
			fillColor = this.ParseRgbColor(fillColor);
		}
		else
		{
			throw new Error();
		}
		
		if (strokeColor[0] == '#')
		{
			strokeColor = this.ParseHexColor(strokeColor);
		}
		else if (strokeColor.substr(0, 3) == 'rgb')
		{
			strokeColor = this.ParseRgbColor(strokeColor);
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
		
		PushCommand(this, fillR.toString() + ' ' + fillG.toString() + ' ' + fillB.toString() + ' rg');
		PushCommand(this, strokeR.toString() + ' ' + strokeG.toString() + ' ' + strokeB.toString() + ' RG');
	};
	
	// there are three systems for drawing text:
	// 1. the native CanvasRenderingContext2D/PDF systems (fillTextNative)
	// 2. using truetype.js, which reads from an uploaded font file (fillTextTruetype and DrawGlyph)
	// 3. using font coordinates dumped into fonts.js (fillTextSvgFont)
	
	// the fillText toggle function must sync with measureText in order for typesetting and other stuff to work properly
	Canvas.prototype.fillText = function(text, x, y) { this.fillTextNative(text, x, y); };
	Canvas.prototype.fillTextSvgFont = function(text, x, y) {
		
		var glyphset = Griddl.fonts[this.fontFamily];
		
		var multiplier = this.fontSize / 2048;
		
		var width = this.measureText(text);
		
		if (this.textAlign == 'left' || this.textAlign == 'start') // i18n needed
		{
			// no change
		}
		else if (this.textAlign == 'center')
		{
			x -= width / 2;
		}
		else if (this.textAlign == 'right' || this.textAlign == 'end') // i18n needed
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
			// no change?
		}
		else if (this.textBaseline == 'alphabetic')
		{
			// no change?
		}
		else if (this.textBaseline == 'ideographic')
		{
			// wat do?
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
			this.g.textAlign = this.textAlign;
			this.g.textBaseline = this.textBaseline;
			this.g.fillStyle = this.fillStyle;
			
			// alternate approach, where we scale the font using a transform rather than canvas's hard to predict font parser
			this.g.font = '12pt ' + this.fontFamily;
			this.g.save();
			this.g.translate(x, y);
			this.g.scale(this.fontSize / 12, this.fontSize / 12);
			this.g.fillText(text, 0, 0);
			this.g.restore();
			
			//this.g.font = this.fontSize.toString() + this.fontSizeUnits + ' ' + this.fontFamily;
			//this.g.fillText(text, x, y);
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
		
		if (Griddl.drawPdf)
		{
			this.fillTextPdf(text, x, y);
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
	
	Canvas.prototype.fillTextPdf = function(text, x, y) {
		
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
			x -= this.savedCanvasContext.measureText(text).width / 2; // we need to use an abstract MeasureText function here
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
		PushCommand(this, 'BT');
		// adjust fontSizeNumber if fontSizeUnits is anything other than 'pt'
		PushCommand(this, '/' + fontId + ' ' + fontSize.toString() + ' Tf'); // /F1 12 Tf
		//PushCommand(this, x.toString() + ' ' + y.toString() + ' TD');
		PushCommand(this, '1 0 0 1 ' + x.toString() + ' ' + y.toString() + ' Tm'); // 1 0 0 1 50 50 Tm
		PushCommand(this, '(' + text + ') Tj'); // (foo) Tj
		PushCommand(this, 'ET');
	}
	
	// using opentype.js
	Canvas.prototype.fillTextOpentype = function(text, x, y) {
		
		// we can comment out the if statements below and just use this, and it will work
		// it will jut draw the glyphs as fill paths, making for a large PDF
		//this.fontObject.draw(this, text, x, y, this.fontSize, {});
		
		if (this.drawCanvas)
		{
			// if we are going to use the PDF-native way of drawing text below, then we don't want to duplicate
			var savedPdfState = Griddl.drawPdf;
			Griddl.drawPdf = false;
			this.fontObject.draw(this, text, x, y, this.fontSize, {});
			Griddl.drawPdf = Griddl.drawPdf;
		}
		
		if (Griddl.drawPdf)
		{
			this.fillTextPdf(text, x, y);
		}
	};
	
	Canvas.prototype.measureText = function(str) { this.measureTextSvgFont(str); }
	Canvas.prototype.measureTextSvgFont = function(str) {
		
		//console.log(this.fontFamily);
		//for (var fontname in Griddl.fonts) { console.log(fontname); }
		
		var glyphset = Griddl.fonts[this.fontFamily];
		
		// this should work (in Node).  why doesn't it work?
		//console.log(Griddl.fonts);
		//console.log(this.fontFamily);
		//console.log(glyphset);
		
		var multiplier = this.fontSize / 2048;
		
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
			svg += 'x="' + left.toString() + '" ';
			svg += 'y="' + top.toString() + '" ';
			svg += 'width="' + width.toString() + '" ';
			svg += 'height="' + height.toString() + '" ';
			svg += '></rect>';
			this.eltStrings.push(svg);
		}
		
		if (Griddl.drawPdf)
		{
			PushCommand(this, '1 1 1 rg');
			PushCommand(this, left.toString() + ' ' + top.toString() + ' ' + width.toString() + ' ' + height.toString() + ' re');
			PushCommand(this, 'F');
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
			style += 'fill:' + (doFill ? this.fillStyle : 'none') + ';';
			style += 'stroke:' + (doStroke ? this.strokeStyle : 'none') + ';';
			svg += 'style="' + style + '" ';
			if (doStroke) { svg += 'stroke-width="' + this.lineWidth.toString() + '" '; }
			
			svg += 'x="' + left.toString() + '" ';
			svg += 'y="' + top.toString() + '" ';
			svg += 'width="' + width.toString() + '" ';
			svg += 'height="' + height.toString() + '"';
			
			svg += '></rect>';
			
			this.eltStrings.push(svg);
		}
		
		if (Griddl.drawPdf)
		{
			this.SetPdfColors();
			PushCommand(this, left.toString() + ' ' + top.toString() + ' ' + width.toString() + ' ' + height.toString() + ' re');
			
			if (doFill)
			{
				PushCommand(this, 'F');
			}
			
			if (doStroke)
			{
				PushCommand(this, 'S');
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
		
		if (Griddl.drawPdf)
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
			PushCommand(this, ex.toString() + ' ' + ey.toString() + ' m');
			PushCommand(this, enx1.toString() + ' ' + eny1.toString() + ' ' + enx2.toString() + ' ' + eny2.toString() + ' ' + nx.toString() + ' ' + ny.toString() + ' c');
			PushCommand(this, nwx1.toString() + ' ' + nwy1.toString() + ' ' + nwx2.toString() + ' ' + nwy2.toString() + ' ' + wx.toString() + ' ' + wy.toString() + ' c');
			PushCommand(this, wsx1.toString() + ' ' + wsy1.toString() + ' ' + wsx2.toString() + ' ' + wsy2.toString() + ' ' + sx.toString() + ' ' + sy.toString() + ' c');
			PushCommand(this, sex1.toString() + ' ' + sey1.toString() + ' ' + sex2.toString() + ' ' + sey2.toString() + ' ' + ex.toString() + ' ' + ey.toString() + ' c');
			
			if (doFill)
			{
				PushCommand(this, 'F');
			}
			
			if (doStroke)
			{
				PushCommand(this, 'S');
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
		
		if (Griddl.drawPdf)
		{
			this.SetPdfColors();
			PushCommand(this, x1.toString() + ' ' + y1.toString() + ' m');
			PushCommand(this, x2.toString() + ' ' + y2.toString() + ' l');
			PushCommand(this, 'S');
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
		
		if (this.drawCanvas || Griddl.drawPdf)
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
		
		if (Griddl.drawPdf)
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
		
		if (Griddl.drawPdf)
		{
			PushCommand(this, 'h');
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
			style += 'fill:' + 'none' + ';';
			style += 'stroke:' + this.strokeStyle + ';';
			svg += 'style="' + style + '" ';
			svg += 'stroke-width="' + this.lineWidth.toString() + '" ';
			
			svg += 'd="' + this.currentPath + '"';
			
			svg += '></path>';
			
			this.eltStrings.push(svg);
		}
		
		if (Griddl.drawPdf)
		{
			PushCommand(this, 'S');
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
		
		if (Griddl.drawPdf)
		{
			PushCommand(this, 'F');
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
		
		if (Griddl.drawPdf)
		{
			PushCommand(this, x.toString() + ' ' + y.toString() + ' m');
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
		
		if (Griddl.drawPdf)
		{
			PushCommand(this, x.toString() + ' ' + y.toString() + ' l');
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
		
		if (Griddl.drawPdf)
		{
			// put the end point as the second control point
			PushCommand(this, x1.toString() + ' ' + y1.toString() + ' ' + x.toString() + ' ' + y.toString() + ' ' + x.toString() + ' ' + y.toString() + ' c');
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
		
		if (Griddl.drawPdf)
		{
			PushCommand(this, x1.toString() + ' ' + y1.toString() + ' ' + x2.toString() + ' ' + y2.toString() + ' ' + x.toString() + ' ' + y.toString() + ' c');
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
		
		if (Griddl.drawPdf)
		{
			// http://hansmuller-flex.blogspot.com/2011/04/approximating-circular-arc-with-cubic.html
			//PushCommand(this, x1.toString() + ' ' + y1.toString() + ' ' + x2.toString() + ' ' + y2.toString() + ' ' + x.toString() + ' ' + y.toString() + ' c');
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
		
		if (Griddl.drawPdf)
		{
			// we generate an imageXObject and put it in a dictionary that maps ids to imageXObjects { 'Im1' : imageXObject , 'Im2' : imageXObject }
			// the image data is encoded as hex string ( RR GG BB RR GG BB ), EX: '4EF023'
			// this means that one byte of color data is transformed into a two-character string
			// this ascii hex string is attached stored at imageXObject['[stream]']
			
			// { /Type /XObject /Subtype /Image /ColorSpace /DeviceRGB /BitsPerComponent 8 /Width 100 /Height 100 /Length 60000 /Filter /AaciiHexDecode }
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
					hex += ((R < 0x10) ? '0' : '') + R.toString(16).toUpperCase()
					hex += ((G < 0x10) ? '0' : '') + G.toString(16).toUpperCase()
					hex += ((B < 0x10) ? '0' : '') + B.toString(16).toUpperCase()
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
			
			// dw 0 0 dh dx (dy+dh) cm
			var scale = 1;
			var imagematrix = '';
			imagematrix += (scale * dw).toString() + ' 0 0 ';
			imagematrix += (scale * dh).toString() + ' ';
			imagematrix += (scale * dx).toString() + ' ';
			//imagematrix += (this.currentPage.height - scale * (dy + dh)).toString() + ' cm';
			imagematrix += (scale * (dy + dh)).toString() + ' cm';
			
			// /Im1 Do
			var imagename = 'Im' + this.imageXObjects.length.toString();
			var imagecommand = '/' + imagename + ' Do';
			
			this.imageDict[imagename] = imageXObject;
			
			PushCommand(this, 'q'); // save the current matrix
			PushCommand(this, imagematrix); // dw 0 0 dh dx (dy+dh) cm
			PushCommand(this, imagecommand); // /Im1 Do
			PushCommand(this, 'Q'); // restore the current matrix
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
		
		if (Griddl.drawPdf)
		{
			PushCommand(this, 'q');
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
		
		if (Griddl.drawPdf)
		{
			PushCommand(this, 'Q');
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
		
		if (Griddl.drawPdf)
		{
			var sx = x;
			var kx = 0;
			var dx = 0;
			var sy = y;
			var ky = 0;
			var dy = 0;
			PushCommand(this, sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ' cm');
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
		
		if (Griddl.drawPdf)
		{
			var sx = Math.cos(angle);
			var kx = -Math.sin(angle);
			var dx = 0;
			var sy = Math.cos(angle);
			var ky = Math.sin(angle);
			var dy = 0;
			PushCommand(this, sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ' cm');
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
		
		if (Griddl.drawPdf)
		{
			var sx = Math.cos(-angle);
			var kx = -Math.sin(-angle);
			var dx = 0;
			var sy = Math.cos(-angle);
			var ky = Math.sin(-angle);
			var dy = 0;
			PushCommand(this, sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ' cm');
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
		
		if (Griddl.drawPdf)
		{
			var sx = 1;
			var kx = 0;
			var dx = x;
			var sy = 1;
			var ky = 0;
			var dy = y;
			PushCommand(this, sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ' cm');
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
		
		if (Griddl.drawPdf)
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
			PushCommand(this, sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ' cm');
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
		
		if (Griddl.drawPdf)
		{
			//PushCommand(this, '');
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
		
		if (Griddl.drawPdf)
		{
			//PushCommand(this, '');
		}
	};
	
	function PushCommand(canvas, cmd) {
		
		// this is mostly for debugging - we want to have a central place to put a breakpoint to inspect all PDF commands that come through
		if (cmd.match(/NaN/)) { throw new Error(); }
		
		canvas.commands.push(cmd);
	}
	
	// to make this stuff CanvasRenderingContext2D-compatible, we need to replace 'this' with 'ctx' - everywhere
	
	Canvas.prototype.SetStyle = function(style) {
		
		if (style === undefined) { return; }
		
		if (typeof(style) == 'string') { style = this.styles[style]; }
		
		if (style.font)
		{
			this.font = style.font;
		}
		else if (style.fontFamily && style.fontSize)
		{
			this.font = style.fontSize + 'pt ' + style.fontFamily;
		}
		
		if (style.color)
		{
			this.lineWidth = 1;
			this.strokeStyle = style.color;
			this.fillStyle = style.color;
		}
		
		if (style.fill)
		{
			this.fillStyle = style.fill;
		}
		
		if (style.stroke)
		{
			this.strokeStyle = style.stroke;
		}
		
		var hAlign = 'left';
		var vAlign = 'bottom';
		if (style.hAlign) { hAlign = style.hAlign; }
		if (style.vAlign) { vAlign = style.vAlign; }
		this.textAlign = hAlign;
		this.textBaseline = vAlign;
	};
	Canvas.prototype.SaveStyle = function() {
		
		var style = {};
		
		style.lineWidth = this.lineWidth;
		style.strokeStyle = this.strokeStyle;
		style.fillStyle = this.fillStyle;
		
		style.font = this.font;
		style.textAlign = this.textAlign;
		style.textBaseline = this.textBaseline;
		
		style.transform = this.transform;
		
		return style;
	};
	
	// general MathJax notes:
	// http://cdn.mathjax.org/mathjax/latest/test/sample-signals.html - this is an interesting page that shows all the signals that get sent
	
	// calls to drawMath don't immediately draw onto the canvas - the typesetting is put into the mathjax queue
	// actual drawing to the canvas happens in GenerateDocument(), after all callbacks have returned
	// jax = { page : Page , latex : string , x : float , y : float , d : string , style : Style }
	Canvas.prototype.drawMath = function(latex, x, y) {
		
		if (typeof(latex) == 'object') { latex = '$$' + latex.ToLatex() + '$$'; }
		
		var jax = {};
		jax.page = this.currentPage;
		jax.latex = latex;
		jax.x = x;
		jax.y = y;
		jax.style = this.SaveStyle();
		
		this.jax.push(jax);
		
		var n = this.jax.length;
		var id = 'mathjax' + n.toString();
		
		var div = $(document.createElement('div'));
		div.attr('id', id);
		div.attr('class', 'mathjaxInput');
		div.css('display', 'none');
		$('body').append(div);
		
		jax.inputDivId = '#' + id;
		jax.outputDivId = '#MathJax-Element-' + n.toString() + '-Frame';
		
		div.text(latex);
		
		// http://docs.mathjax.org/en/latest/api/callback.html
		//MathJax.Hub.Queue(["Typeset", MathJax.Hub, id], [callback]);
		MathJax.Hub.Queue(["Typeset", MathJax.Hub, id]);
	};
	
	Canvas.prototype.DrawParasNaive = function(params) {
		
		this.SetStyle(params.style);
		
		var pitch = params.pitch ? params.pitch : 20;
		var words = Griddl.Wordize(params.text);
		
		var line = '';
		
		var boxIndex = 0;
		var currentBox = params.boxes[boxIndex];
		var left = currentBox.left;
		var top = currentBox.top;
		var width = currentBox.width;
		var height = currentBox.height;
		
		var y = top;
		
		for (var i = 0; i < words.length; i++)
		{
			var word = words[i];
			
			var testline = line + word;
			var lineWidth = this.savedCanvasContext.measureText(testline).width;
			
			if (lineWidth > width)
			{
				this.fillText(line, left, y);
				line = '';
				y += pitch;
				
				if (y > top + height)
				{
					boxIndex++;
					
					if (boxIndex >= params.boxes.length) { return; } // we've run out of room
					
					currentBox = params.boxes[boxIndex];
					left = currentBox.left;
					top = currentBox.top;
					width = currentBox.width;
					height = currentBox.height;
					y = top;
				}
			}
			
			line += word + ' ';
		}
		
		if (line.length > 0)
		{
			this.fillText(line, left, y);
		}
	};
	Canvas.prototype.DrawParas = function(params) {
		
		this.SetStyle(params.style);
		
		var text = params.text;
		
		var lineWidths = [];
		var linePoints = [];
		
		var type = 'justify';
		var tolerance = 3;
		var center = false;
		var verticalSpacing = params.pitch;
		
		for (var i = 0; i < params.boxes.length; i++)
		{
			var box = params.boxes[i];
			var sumHeight = 0;
			
			while (sumHeight < box.height)
			{
				lineWidths.push(box.width);
				linePoints.push({page:box.page,left:box.left,top:box.top+sumHeight});
				sumHeight += verticalSpacing;
			}
		}
		
		var g = this;
		var format = null;
		
		if (g.savedCanvasContext)
		{
			//format = Typeset.formatter(function(str) { return g.savedCanvasContext.measureText(str).width; });
			format = Typeset.formatter(function(str) { return g.measureText(str); });
		}
		else
		{
			format = Typeset.formatter(function(str) { return g.measureText(str); });
		}
		
		var nodes = format[type](text);
		var breaks = Typeset.linebreak(nodes, lineWidths, { tolerance : tolerance });
		if (breaks.length == 0) { throw new Error('Paragraph can not be set with the given tolerance'); }
		
		var lines = [];
		var lineStart = 0;
		
		// Iterate through the line breaks, and split the nodes at the correct point.
		for (var i = 1; i < breaks.length; i++)
		{
			var point = breaks[i].position;
			var r = breaks[i].ratio;
			
			for (var j = lineStart; j < nodes.length; j++)
			{
				// After a line break, we skip any nodes unless they are boxes or forced breaks.
				if (nodes[j].type === 'box' || (nodes[j].type === 'penalty' && nodes[j].penalty === -Typeset.linebreak.infinity))
				{
					lineStart = j;
					break;
				}
			}
			
			lines.push({ ratio : r , nodes : nodes.slice(lineStart, point + 1) , position : point });
			lineStart = point;
		}
		
		var maxLength = Math.max.apply(null, lineWidths);
		
		for (var i = 0; i < lines.length; i++)
		{
			var line = lines[i];
			var lineLength = i < lineWidths.length ? lineWidths[i] : lineWidths[lineWidths.length - 1];
			
			var x = linePoints[i].left;
			var y = linePoints[i].top;
			this.SetActivePage(linePoints[i].page);
			
			if (center) { x += (maxLength - lineLength) / 2; }
			
			for (var k = 0; k < line.nodes.length; k++)
			{
				var node = line.nodes[k];
				
				if (node.type === 'box')
				{
					this.fillText(node.value, x, y);
					x += node.width;
				}
				else if (node.type === 'glue')
				{
					x += node.width + line.ratio * (line.ratio < 0 ? node.shrink : node.stretch);
				}
				else if (node.type === 'penalty' && node.penalty === 100 && k === line.nodes.length - 1)
				{
					this.fillText('-', x, y);
				}
			}
		}
	};
	Griddl.Wordize = function(text) {
		
		var words = [];
		var word = '';
		
		var k = 0;
		
		while (k < text.length)
		{
			var c = text[k];
			var n = c.charCodeAt();
			
			if (n == 32 || n == 9 || n == 13 || n == 10)
			{
				words.push(word);
				word = '';
			}
			else
			{
				word += c;
			}
			
			k++;
		}
		
		if (word.length > 0)
		{
			words.push(word);
		}
		
		return words;
	};
	Canvas.Substitute = function(templateName, variablesName) {
		
		var text = Griddl.GetData(templateName);
		var vars = Griddl.GetData(variablesName);
		
		for (var i = 0; i < vars.length; i++)
		{
			var name = vars[i].name;
			var value = vars[i].value;
			
			while (text.search('@' + name) >= 0)
			{
				text = text.replace('@' + name, value);
			}
		}
		
		return text;
	};
	
	Canvas.prototype.MakeBox = function(page) {
		
		var box = {};
		
		box.lf = 0;
		box.cx = page.width / 2;
		box.rg = page.width;
		box.ww = page.width;
		box.wr = page.width / 2;
		
		box.tp = 0;
		box.cy = page.height / 2;
		box.bt = page.height;
		box.hh = page.height;
		box.hr = page.height / 2;
		
		return box;
	};
	
	// code-based content organization
	Canvas.prototype.AddText = function(text, params) {
		
		this.Save(); // a big difference between AddText and the normal was of doing things is that AddText presents a stateless interface
		
		if (params.style) { this.SetStyle(params.style); }
		if (params.font) { this.font = params.font; }
		
		if (params.fontFamily) { this.fontFamily = params.fontFamily; }
		if (params.fontSize) { this.fontSize = params.fontSize; }
		if (params.fontSizeUnits) { this.fontSizeUnits = params.fontSizeUnits; }
		if (params.stroke) { this.strokeStyle = params.stroke; }
		if (params.fill) { this.fillStyle = params.fill; }
		if (params.lineWidth) { this.lineWidth = params.lineWidth; }
		if (params.textAlign) { this.textAlign = params.textAlign; }
		if (params.textBaseline) { this.textBaseline = params.textBaseline; }
		
		var x = null;
		var y = null;
		
		if (params.left)
		{
			this.textAlign = 'left';
			x = params.left;
		}
		else if (params.cx)
		{
			this.textAlign = 'center';
			x = params.cx;
		}
		else if (params.right)
		{
			this.textAlign = 'right';
			x = params.right;
		}
		//else if (params.x)
		//{
		//	this.textAlign = 'left';
		//	x = params.x;
		//}
		else
		{
			//throw new Error();
		}
		
		if (params.top)
		{
			this.textBaseline = 'top';
			y = params.top;
		}
		else if (params.cy)
		{
			this.textBaseline = 'middle';
			y = params.cy;
		}
		else if (params.bottom)
		{
			this.textBaseline = 'bottom';
			y = params.bottom;
		}
		else
		{
			//throw new Error();
			//this.textBaseline = 'alphabetic';
		}
		
		var parent = this.MakeBox(this.currentPage);
		
		if (params.parent)
		{
			parent = params.parent;
		}
		
		if (params.anchor)
		{
			var t = params.anchor.split(" ");
			var hIntern = t[0][0];
			var hExtern = t[0][1];
			var hOffset = parseFloat(t[1]);
			var vIntern = t[2][0];
			var vExtern = t[2][1];
			var vOffset = parseFloat(t[3]);
			
			if (hIntern == 'L')
			{
				this.textAlign = 'left';
			}
			else if (hIntern == 'C')
			{
				this.textAlign = 'center';
			}
			else if (hIntern == 'R')
			{
				this.textAlign = 'right';
			}
			else
			{
				throw new Error();
			}
			
			if (hExtern == 'L')
			{
				x = parent.lf + hOffset;
			}
			else if (hExtern == 'C')
			{
				x = parent.cx + hOffset;
			}
			else if (hExtern == 'R')
			{
				x = parent.rg - hOffset;
			}
			else if (hExtern == 'S')
			{
				throw new Error(); // figure this out
			}
			else
			{
				throw new Error();
			}
			
			if (vIntern == 'T')
			{
				this.textBaseline = 'top';
			}
			else if (vIntern == 'C')
			{
				this.textBaseline = 'middle';
			}
			else if (vIntern == 'B')
			{
				this.textBaseline = 'bottom';
			}
			else
			{
				throw new Error();
			}
			
			if (vExtern == 'T')
			{
				y = parent.tp + vOffset;
			}
			else if (vExtern == 'C')
			{
				y = parent.cy + vOffset;
			}
			else if (vExtern == 'B')
			{
				y = parent.bt - vOffset;
			}
			else if (vExtern == 'S')
			{
				throw new Error(); // figure this out
			}
			else
			{
				throw new Error();
			}
		}
		
		this.fillText(text, x, y);
		
		this.Restore();
	};
	Canvas.prototype.AddImage = function(image, params) {
		
		if (typeof(image) == 'string') { image = Griddl.GetData(image); } // get the HTMLImageElement
		
		var dw = params.width ? params.width : image.width;
		var dh = params.height ? params.height : image.height;
		var sx = params.sx ? params.sx : 0;
		var sy = params.sy ? params.sy : 0;
		var sw = params.sw ? params.sw : image.width;
		var sh = params.sh ? params.sh : image.height;
		
		var x = null;
		var y = null;
		
		if (params.left)
		{
			x = params.left;
		}
		else if (params.cx)
		{
			x = params.cx - dw / 2;
		}
		else if (params.right)
		{
			x = params.right - dw;
		}
		else
		{
			throw new Error();
		}
		
		if (params.top)
		{
			y = params.top;
		}
		else if (params.cy)
		{
			y = params.cy - dh / 2;
		}
		else if (params.bottom)
		{
			y = params.bottom - dh;
		}
		else
		{
			throw new Error();
		}
		
		this.DrawImage(image, x, y, dw, dh, sx, sy, sw, sh);
	};
	Canvas.prototype.AddList = function(listGridName) { Griddl.Charts.DrawList(this, listGridName); };
	Canvas.prototype.AddTable = function(params) { Griddl.Charts.DrawTable(this, params); };
	Canvas.prototype.AddParagraphs = function(params) { Griddl.Charts.DrawParas(this, params); };
	Canvas.prototype.AddBarChart = function(params) { Griddl.Charts.DrawChart(this, 'bar', params.params, params.data, params.key); };
	Canvas.prototype.AddLineChart = function(params) { Griddl.Charts.DrawChart(this, 'line', params.params, params.data, params.key); };
	Canvas.prototype.AddScatterChart = function(params) { Griddl.Charts.DrawChart(this, 'bubble', params.params, params.data, params.key); };
	
	// table-based content organization
	Canvas.prototype.DrawShapes = function(shapesName) {
		
		var shapes = Griddl.GetData(shapesName, []);
		
		var parents = Griddl.MakeHash(Griddl.GetData(shapesName));
		
		for (var i = 0; i < shapes.length; i++)
		{
			var obj = shapes[i];
			this.SetActivePage(obj.page);
			this.SetStyle(obj.style);
			
			var x = parseFloat(obj.x);
			var y = parseFloat(obj.y);
			
			var focus = obj;
			
			while (focus.parent)
			{
				var parent = parents[focus.parent];
				x += parseFloat(parent.x);
				y += parseFloat(parent.y);
				focus = parent;
			}
			
			var width = parseFloat(obj.width);
			var height = parseFloat(obj.height);
			
			var type = obj.shape;
			
			if (type == 'text')
			{
				this.fillText(obj.text, x, y);
			}
			else if (type == 'rect')
			{
				// change x and y based on hAlign and vAlign
				this.fillRect(x + 0.5, y + 0.5, width, height);
				this.strokeRect(x, y, width, height); // x and y may need a +0.5 or something
			}
		}
	};
	Canvas.prototype.DrawTexts = function(componentName) {
		
		var objs = Griddl.GetData(componentName, []);
		
		for (var i = 0; i < objs.length; i++)
		{
			var obj = objs[i];
			this.SetActivePage(obj.page);
			
			var color = obj.color ? obj.color : 'black';
			var hAlign = obj.hAlign ? obj.hAlign : 'left';
			var vAlign = obj.vAlign ? obj.vAlign : 'middle';
			
			this.SetStyle(obj.style);
			
			var x = parseFloat(obj.x);
			var y = parseFloat(obj.y);
			
			this.fillText(obj.text, x, y);
		}
	};
	Canvas.prototype.DrawImages = function(componentName) {
		
		var objs = Griddl.GetData(componentName, []);
		
		for (var i = 0; i < objs.length; i++)
		{
			var obj = objs[i];
			this.SetActivePage(obj.page);
			
			var img = Griddl.GetData(obj.name);
			
			var x = parseFloat(obj.x);
			var y = parseFloat(obj.y);
			var hAlign = obj.hAlign;
			var vAlign = obj.vAlign;
			
			var width = obj.width ? parseFloat(obj.width) : img.width;
			var height = obj.height ? parseFloat(obj.height) : img.height;
			
			var left = null;
			var top = null;
			
			if (hAlign == 'left' || hAlign == 'start') // is accepting multiple keywords a good idea?
			{
				left = x;
			}
			else if (hAlign == 'center' || hAlign == 'middle')
			{
				left = x - width / 2;
			}
			else if (hAlign == 'right' || hAlign == 'end')
			{
				left = x - width;
			}
			else
			{
				left = x - width / 2; // default to center - is this wise?
			}
			
			if (vAlign == 'top' || vAlign == 'start') // is accepting multiple keywords a good idea?
			{
				top = y;
			}
			else if (vAlign == 'center' || vAlign == 'middle')
			{
				top = y - height / 2;
			}
			else if (vAlign == 'bottom' || vAlign == 'end')
			{
				top = y - height;
			}
			else
			{
				top = y - height / 2; // default to center - is this wise?
			}
			
			//var left = parseFloat(obj.left);
			//var top = parseFloat(obj.top);
			
			this.DrawImage(img, left, top, width, height);
		}
	};
	Canvas.prototype.DrawCharts = function(componentName) {
		
		var objs = Griddl.GetData(componentName, []);
		
		for (var i = 0; i < objs.length; i++)
		{
			var obj = objs[i];
			this.SetActivePage(obj.page);
			
			Griddl.Charts.DrawChart(this, obj.type, obj.params, obj.data, obj.key);
		}
	};
	Canvas.prototype.DrawTables = function(componentName) {
		
		var objs = Griddl.GetData(componentName, []);
		
		for (var i = 0; i < objs.length; i++)
		{
			var obj = objs[i];
			this.SetActivePage(obj.page);
			
			Griddl.Charts.DrawTable(this, obj.values, obj.styles, obj.widths, obj.heights, obj.left, obj.top);
		}
	};
	
	return Canvas;
})();

// Alt+2

