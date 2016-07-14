
var TheCanvas = (function() {
	
	if (typeof Griddl == 'undefined') { var Griddl = {}; }
	
	// this is probably obsolete?
	// when the export button is clicked, it:
	// 1. sets Canvas.drawPdf to true
	// 2. invokes the first js component
	// 3. reads griddlCanvas (which the user code must set)
	Canvas.griddlCanvas = null; // in ExportToPdf we call MakePdf(griddlCanvas) - the Canvas constructor sets griddlCanvas whenever it is invoked
	Canvas.savedDrawPdf = false; // get/set by pausePdfOutput and resumePdfOutput
	Canvas.drawPdf = false; // the function invoked by the export button sets this to true, runs the user code, and then sets it to false again
	Canvas.fontDict = {}; // "serif" => SourceSerifPro-Regular.otf, "sans-serif" => SourceSansPro-Regular.otf
	Canvas.fontNameToUint8Array = {};
	Canvas.opentype = null; // we need to parse the default fonts to intialize the fontDict
	
	function Canvas(params) {
		
		// this is here so that user code does not need to do it - the function invoked by the export button needs access to the canvas
		Griddl.g = this; // this is a hook for node, used in RenderSvg - should it be Griddl.Canvas.g instead?
		
		// params:
		//  type - default 'canvas'
		//  unit - in, cm, mm, pt - default in
		//  pixelsPerUnit - default 100/in
		//  cubitsPerUnit - default 100/in
		
		if (typeof params == 'undefined') { params = {}; }
		var type = params.type ? params.type : 'canvas';
		
		var pointsPerUnitDict = {in:72,cm:72/2.54,mm:72/25.4,pt:1};
		var unit = params.unit ? params.unit : 'in';
		
		var pixelsPerUnit = params.pixelsPerUnit ? params.pixelsPerUnit : 100;
		var cubitsPerUnit = params.cubitsPerUnit ? params.cubitsPerUnit : 100;
		var pointsPerUnit = pointsPerUnitDict[unit];
		
		this.pixelsPerCubit = pixelsPerUnit / cubitsPerUnit;
		this.cubitsPerPixel = cubitsPerUnit / pixelsPerUnit;
		this.pointsPerCubit = pointsPerUnit / cubitsPerUnit;
		this.cubitsPerPoint = cubitsPerUnit / pointsPerUnit;
		
		this.sections = [];
		//this.pages = []; // should be indexed by names as well
		this.drawCanvas = (type == 'canvas');
		this.drawSvg = (type == 'svg');
		this.drawBmp = (type == 'bitmap');
		this.type = type; // 'canvas' or 'svg' - NewSection() uses this
		
		// FinalizeGraphics() sets this and ExportLocalToPdf() reads it
		this.pdfContextArray = null;
		
		this.currentSection = null;
		this.g = null; // this.sections[i].canvasContext, for some i
		this.bmp = null; // this.sections[i].bmp, for some i
		this.commands = null; // this.pages[i].pdfCommands, for some i
		this.eltStrings = null; // this.pages[i].eltStrings, for some i
		this.canvas = null; // the <canvas> element - this is for the passthrough usage e.g. ctx.canvas.width
		
		this.currentPoint = { x : 0 , y : 0 };
		
		this.jax = [];
		//if (typeof window != 'undefined') { $('.mathjaxInput').remove(); }
		if (typeof window != 'undefined') { Array.from(document.querySelectorAll('.mathjaxInput')).forEach(function(elt) { elt.remove(); }); }
		
		// our own transformation implementation
		this.debugTransform = true; // this calculates the transform but does not use it - the commands are passed through to the <canvas>
		this.useOwnTransform = false;
		this.matrix = new Matrix();
		this.matrixStack = [];
		this.loggerStack = []; // 'scale(10)', 'rotate(90)', 'translate(10, 20)' - convert angles to degrees for this
		this.savedMatrixStack = [];
		
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
		
		this.fontFamily = 'serif';
		this.bold = false;
		this.italic = false;
		this.fontSize = 10; // this is what we display in font UI
		this.fontSizePt = 10;
		this.fontSizePx = this.fontSizePt * this.cubitsPerPoint * this.pixelsPerCubit;
		this.fontSizeCu = this.fontSizePt * this.cubitsPerPoint;
		this.fontSizeUnits = 'pt';
		this.fontObject = Canvas.fontDict[this._fontFamily]; // type TrueTypeFont or OpenTypeFont
		
		this._textAlign = 'left'; // start (default), end, left, right, center - we should change this from left to start.  does opentype.js support RTL?
		this._textBaseline = 'alphabetic'; // alphabetic (default), top, hanging, middle, ideographic, bottom
		this._lineWidth = 1;
		this._fillStyle = 'rgb(0,0,0)'; // make these objects and parse in the setter?
		this._strokeStyle = 'rgb(0,0,0)'; // make these objects and parse in the setter?
		this._lineDashArray = [];
		this._lineDashOffset = 0;
		// setLineDash([on, off, on, off, ...]);
		this._lineJoin = 'miter'; // miter (default), bevel, round
		this._lineCap = 'butt'; // butt (default), round, square
		this._miterLimit = 10; // is this part of the spec or just a chrome thing?  what is the default miter limit for PDF?
		this._globalAlpha = 1.0; // float in [0,1] - 0 = transparent, 1 = opaque
		this._globalCompositeOperation = 'source-over'; // source-over (default), source-in, source-out, source-atop, destination-over, destination-in, destination-out, destination-atop, lighter, copy, xor (darker was removed from the spec)
		this._shadowColor = 'rgba(0, 0, 0, 0)';
		this._shadowBlur = 0; // float, not sure exactly how to implement
		this._shadowOffsetX = 0;
		this._shadowOffsetY = 0;
		
		Object.defineProperty(this, 'textAlign', {
			get : function() { return this._textAlign; },
			set : function (value) { this._textAlign = value; if (this.g) { this.g.textAlign = value; } }
		});
		Object.defineProperty(this, 'textBaseline', {
			get : function() { return this._textBaseline; },
			set : function (value) { this._textBaseline = value; if (this.g) { this.g.textBaseline = value; } }
		});
		Object.defineProperty(this, 'lineWidth', {
			get : function() { return this._lineWidth; },
			set : function (value) {
				this._lineWidth = value;
				if (this.g) { this.g.lineWidth = value; }
				if (Canvas.drawPdf) { PushCommand(this, value.toString() + ' w'); }
			}
		});
		Object.defineProperty(this, 'fillStyle', {
			get : function() { return this._fillStyle; },
			set : function (value) {
				this._fillStyle = value;
				if (this.g) { this.g.fillStyle = value; }
				
				if (Canvas.drawPdf)
				{
					if (typeof value == 'string')
					{
						PushCommand(this, ConvertColorToPdf(value) + ' rg');
					}
					else
					{
						// fillStyle might be a Gradient or a Pattern - what then?
						PushCommand(this, '0 0 0 rg');
					}
				}
			}
		});
		Object.defineProperty(this, 'strokeStyle', {
			get : function() { return this._strokeStyle; },
			set : function (value) {
				this._strokeStyle = value;
				if (this.g) { this.g.strokeStyle = value; }
				
				if (Canvas.drawPdf)
				{
					if (typeof value == 'string')
					{
						PushCommand(this, ConvertColorToPdf(value) + ' RG');
					}
					else
					{
						// fillStyle might be a Gradient or a Pattern - what then?
						PushCommand(this, '0 0 0 RG');
					}
				}
			}
		});
		Object.defineProperty(this, 'lineDashOffset', {
			get : function() { return this._lineDashOffset; },
			set : function (value) {
				this._lineDashOffset = value;
				if (this.g) { this.g.lineDashOffset = value; }
				if (Canvas.drawPdf) { PushCommand(this, '[ ' + this._lineDashArray.join(' ') + ' ] ' + this._lineDashOffset.toString() + ' d'); }
			}
		});
		Object.defineProperty(this, 'lineJoin', {
			get : function() { return this._lineJoin; },
			set : function (value) {
				this._lineJoin = value;
				if (this.g) { this.g.lineJoin = value; }
				if (Canvas.drawPdf) { PushCommand(this, {miter:'0',round:'1',bevel:'2'}[value] + ' j'); }
			}
		});
		Object.defineProperty(this, 'lineCap', {
			get : function() { return this._lineCap; },
			set : function (value) {
				this._lineCap = value;
				if (this.g) { this.g.lineCap = value; }
				if (Canvas.drawPdf) { PushCommand(this, {butt:'0',round:'1',square:'2'}[value] + ' J'); }
			}
		});
		Object.defineProperty(this, 'miterLimit', {
			get : function() { return this._miterLimit; },
			set : function (value) {
				this._miterLimit = value;
				if (this.g) { this.g.miterLimit = value; }
				if (Canvas.drawPdf) { PushCommand(this, value.toString() + ' M'); }
			}
		});
		Object.defineProperty(this, 'globalAlpha', {
			get : function() { return this._globalAlpha; },
			set : function (value) {
				this._globalAlpha = value;
				if (this.g) { this.g.globalAlpha = value; }
			}
		});
		Object.defineProperty(this, 'globalCompositeOperation', {
			get : function() { return this._globalCompositeOperation; },
			set : function (value) {
				this._globalCompositeOperation = value;
				if (this.g) { this.g.globalCompositeOperation = value; }
			}
		});
		Object.defineProperty(this, 'shadowColor', {
			get : function() { return this._shadowColor; },
			set : function (value) { this._shadowColor = value; if (this.g) { this.g.shadowColor = value; } }
		});
		Object.defineProperty(this, 'shadowBlur', {
			get : function() { return this._shadowBlur; },
			set : function (value) { this._shadowBlur = value; if (this.g) { this.g.shadowBlur = value; } }
		});
		Object.defineProperty(this, 'shadowOffsetX', {
			get : function() { return this._shadowOffsetX; },
			set : function (value) { this._shadowOffsetX = value; if (this.g) { this.g.shadowOffsetX = value; } }
		});
		Object.defineProperty(this, 'shadowOffsetY', {
			get : function() { return this._shadowOffsetY; },
			set : function (value) { this._shadowOffsetY = value; if (this.g) { this.g.shadowOffsetY = value; } }
		});
		
		Object.defineProperty(this, 'font', { 
			get : function() { return this.fontSize.toString() + this.fontSizeUnits + ' ' + this.fontFamily; },
			set : function(str) {
				
				if (!str) { return; } // this catches null, undefined, and empty string
				
				var letterIndex = str.search(/[A-Za-z]/);
				var spaceIndex = str.search(' ');
				
				// the above fails on '10 pt Helvetica' (space between 10 and pt), so do this
				if (letterIndex > spaceIndex) { spaceIndex = letterIndex + str.substr(letterIndex).search(' '); }
				
				var part0 = str.substring(0, letterIndex).trim();
				var part1 = str.substring(letterIndex, spaceIndex);
				var part2 = str.substring(spaceIndex+1);
				
				this.fontSize = parseFloat(part0);
				this.fontSizeUnits = part1;
				
				if (this.fontSizeUnits == 'pt')
				{
					this.fontSizePt = this.fontSize;
					this.fontSizeCu = this.fontSizePt * this.cubitsPerPoint;
					this.fontSizePx = this.fontSizeCu * this.pixelsPerCubit;
				}
				else if (this.fontSizeUnits == 'px')
				{
					this.fontSizePx = this.fontSize;
					this.fontSizeCu = this.fontSizePx * this.cubitsPerPixel;
					this.fontSizePt = this.fontSizeCu * this.pointsPerCubit;
				}
				else if (this.fontSizeUnits == 'cu')
				{
					this.fontSizeCu = this.fontSize;
					this.fontSizePx = this.fontSizeCu * this.pixelsPerCubit;
					this.fontSizePt = this.fontSizeCu * this.pointsPerCubit;
				}
				else
				{
					// other possible units are em, ex, and %
					// standard values:
					// 1em = 12pt
					// 1ex = ??
					// 100% = 12pt
					
					throw new Error('Unsupported font size type: "' + this.fontSizeUnits + '"');
				}
				
				// we split into words, search for 'bold' and 'italic', and remove those words if present
				
				var words = part2.split(' ');
				
				var bold = false;
				var italic = false;
				
				for (var i = 0; i < words.length; i++)
				{
					if (words[i] == 'bold')
					{
						bold = true;
						words[i] = '';
					}
					
					if (words[i] == 'italic')
					{
						italic = true;
						words[i] = '';
					}
				}
				
				var fontFamily = words.join('').trim();
				
				this.setFont(fontFamily, bold, italic);
				
				if (typeof window != 'undefined')
				{
					this.savedCanvasContext.font = this.fontSize.toString() + this.fontSizeUnits + ' ' + this.fontFamily;
				}
			}
		});
		
		if (typeof window != 'undefined')
		{
			// this is used for conversion of 'red' -> 'rgb(255,0,0)' and text measurement and access of pixel data of image components
			this.savedCanvas = document.createElement('canvas');
			this.savedCanvasContext = this.savedCanvas.getContext('2d');
			this.savedCanvasContext.font = this.font;
		}
	}
	
	Canvas.prototype.SetActiveSection = function(nameOrIndexOrSection) {
	
		var type = typeof(nameOrIndexOrSection);
		var section = null;
		
		if (type == 'string' || type == 'number')
		{
			section = this.sections[nameOrIndexOrSection];
		}
		else
		{
			section = nameOrIndexOrSection;
		}
		
		if (this.type == 'canvas')
		{
			this.g = section.canvasContext;
			this.canvas = section.canvasContext.canvas;
		}
		else if (this.type == 'bitmap')
		{
			this.bmp = section.bmp;
			this.canvas = section.bmp; // width and height will still work, at least
		}
		
		this.commands = section.pdfCommands[0]; // this is temporary - the drawing functions have to look at the y coordinate and change page as needed
		this.eltStrings = section.eltStrings;
		this.currentSection = section;
	};
	Canvas.prototype.NewSection = function(width, height, nPages) {
		
		var section = new Section(this, width, height, nPages);
		
		this.sections.push(section);
		//if (params.name) { this.sections[params.name] = section; }
		
		this.SetActiveSection(section);
		
		return section;
	};
	function Section(parent, width, height, nPages) {
		
		this.parent = parent; // Griddl.Canvas
		
		// replace with a Griddl.Widgets.Box? (which raises the question of whether Box should be in Griddl.Widgets)
		this.width = width;
		this.height = height;
		this.left = 0;
		this.right = width;
		this.cx = width / 2;
		this.wr = width / 2;
		this.top = 0;
		this.bottom = height;
		this.cy = height / 2;
		this.hr = height / 2;
		
		this.nPages = nPages;
		
		// so for now, this refers to page size?  we need to distinguish between page dimensions and section dimensions
		this.wdCu = width;
		this.hgCu = height;
		this.pxWidth = width * parent.pixelsPerCubit;
		this.pxHeight = height * parent.pixelsPerCubit;
		this.ptWidth = width * parent.pointsPerCubit;
		this.ptHeight = height * parent.pointsPerCubit;
		
		this.div = null; // <div>
		
		this.canvasContext = null; // CanvasRenderingContext2D
		this.bmp = null; // Bitmap
		
		this.eltStrings = []; // [ [ str ] ]
		
		this.pdfCommands = []; // [ [ str ] ]
		
		for (var i = 0; i < nPages; i++)
		{
			// this needs to be added to each newly-created sublist of pdfCommands
			// the other option is to calculate page.ptHeight - y for everything
			var pageCommands = [];
			pageCommands.push('1 0 0 1 0 ' + this.ptHeight.toString() + ' cm'); // the initial PDF transform
			pageCommands.push(this.parent.pointsPerCubit.toString() + ' 0 0 -' + this.parent.pointsPerCubit.toString() + ' 0 0 cm');
			this.pdfCommands.push(pageCommands);
		}
		
		if (typeof window != 'undefined')
		{
			var div = document.createElement('div');
			div.style.border = '1px solid #c3c3c3';
			//div.style.margin = '1em'; // any subcanvases will be children of this div, which means the top-level canvas has to be flush with this div on the left top so that the absolute positioning on the subcanvas works.  however, we want gaps between the sections - don't know how best to do that now
			div.style.width = this.pxWidth;
			div.style.height = this.pxHeight * this.nPages;
			this.div = div;
		}
		
		if (parent.type == 'canvas')
		{
			if (typeof window != 'undefined')
			{
				var canvas = document.createElement('canvas');
				canvas.width = this.pxWidth;
				canvas.height = this.pxHeight * this.nPages;
				canvas.setAttribute('tabIndex', parent.sections.length.toString());
				
				var ctx = canvas.getContext('2d');
				this.canvasContext = ctx;
				
				this.div.appendChild(canvas);
				
				ctx.scale(parent.pixelsPerCubit, parent.pixelsPerCubit);
			}
		}
		else if (parent.type == 'bitmap')
		{
			this.bmp = new Bitmap(this.pxWidth, this.pxHeight * this.nPages, 3);
		}
		else if (parent.type == 'svg')
		{
			
		}
		else
		{
			throw new Error();
		}
	}
	Section.prototype.SetDimensions = function(nPages, wd, hg) {
		
		// new page sizes should be able to be set automatically when graphical elements are drawn out of bounds
		
		this.nPages = nPages;
		this.wdCu = wd;
		this.hgCu = hg;
		this.pxWidth = wd * this.parent.pixelsPerCubit;
		this.pxHeight = hg * this.parent.pixelsPerCubit;
		this.ptWidth = wd * this.parent.pointsPerCubit;
		this.ptHeight = hg * this.parent.pointsPerCubit;
		
		if (this.parent.type == 'canvas')
		{
			if (typeof window != 'undefined')
			{
				var canvas = this.canvasContext.canvas;
				canvas.width = this.pxWidth;
				canvas.height = this.pxHeight * nPages;
				this.canvasContext = canvas.getContext('2d');
				this.canvasContext.scale(this.parent.pixelsPerCubit, this.parent.pixelsPerCubit);
			}
		}
		
		this.pdfCommands = [];
		
		for (var i = 0; i < nPages; i++)
		{
			// this needs to be added to each newly-created sublist of pdfCommands
			// the other option is to calculate page.ptHeight - y for everything
			var pageCommands = [];
			pageCommands.push('1 0 0 1 0 ' + this.ptHeight.toString() + ' cm'); // the initial PDF transform
			pageCommands.push(this.parent.pointsPerCubit.toString() + ' 0 0 -' + this.parent.pointsPerCubit.toString() + ' 0 0 cm');
			this.pdfCommands.push(pageCommands);
		}
	};
	
	Canvas.prototype.setFontSize = function(fontSize) {
		
		// this should be a setter, but requires deletion of this.fontSize or creation of a shadow variable
		
		this.fontSize = fontSize;
		this.fontSizePt = fontSize;
		this.fontSizePx = this.fontSizePt * this.cubitsPerPoint * this.pixelsPerCubit;
		this.fontSizeCu = this.fontSizePt * this.cubitsPerPoint;
	};
	Canvas.prototype.setFont = function(fontFamily, bold, italic) {
		
		this.fontFamily = fontFamily;
		this.bold = bold;
		this.italic = italic;
		
		var suffix = '';
		
		if (bold && italic)
		{
			suffix = 'Z';
		}
		else if (bold)
		{
			suffix = 'B';
		}
		else if (italic)
		{
			suffix = 'I';
		}
		
		var filename = fontFamily + suffix;
		
		this.setFontObject(filename);
	};
	Canvas.prototype.setFontObject = function(filename) {
		
		// parse default font if it hasn't been parsed yet
		if (!Canvas.fontDict[filename] && Canvas.defaultFonts[filename])
		{
			var uint8array = Base64StringToUint8Array(Canvas.defaultFonts[filename]);
			Canvas.fontDict[filename] = opentype.parse(uint8array.buffer); // fontDict is in Canvas rather than the instance because components needs access to it
			Canvas.fontNameToUint8Array[filename] = uint8array;
		}
		
		// we can't load fonts lazily because that would introduce an asynchronity (fonts are set by user code, we can't just inject a callback)
		// so we're going to have to do synchronous fonts.  various solutions:
		// 1. load fonts on page load - this is slow, but oh well
		//  a. packaging fonts into a js file is nice because we know they go into the browser cache.  could deliver fonts as font files, but would they be cached?
		//  b. failing that, maybe cache them in localstorage - this duplicates the storage for each url, but that's probably not an issue
		// 2. opt-in fonts - either in a Font component or a font section of the Document or a global font settings or something - just like opt-in js libs
		// 3. user uploaded fonts - again, just like Libraries
		
		this.fontObject = Canvas.fontDict[filename] ? Canvas.fontDict[filename] : Canvas.fontDict['serif']; // serif is the default
		
		// in theory, we could dump the font command to PDF here, rather than doing it in each fillText call
	};
	
	// there seems to be a case for folding all pdf stuff into Canvas.  the rationale for a separate pdf module was that it would take just a list of commands and then spit out a pdf.  but it's not really that simple - you also need to pass in fonts and images.  which means that the pdf handling is much less separable from the Canvas as a whole
	
	// copied from griddl.pdf.js - meaning that griddl.pdf.js can probably be deleted as a separate file
	Canvas.prototype.ExportToPdf = function() {
		
		var objects = [];
		
		var totalPageCount = this.sections.map(section => section.pdfCommands.length).reduce(function(a, b) { return a + b; });
		
		var catalog = { Type : "Catalog" , Pages : null };
		var pages = { Type : "Pages" , Count : totalPageCount , Kids : [] };
		catalog.Pages = pages;
		objects.push(catalog);
		objects.push(pages);
		
		var fontResourceDict = {}; // { F1 : 3 0 R , F2 : 4 0 R , etc. }
		var imageResourceDict = {};  // { Im1 : 5 0 R , Im2 : 6 0 R , etc. }
		
		// all fonts and images used in the document are put in separate objects here - page resource dicts refer to this section via indirect references
		
		// section 5.7, p.455 - Font Descriptors
		// section 5.8, p.465 - Embedded Font Programs
		// this.fontNameToIndex = { "Times-Roman" : 1 , "Helvetica" : 2 }
		// this.fontDict = { "F1" : "Times-Roman" , "F2" : "Helvetica" }
		for (var key in this.fontNameToIndex)
		{
			var fontId = 'F' + this.fontNameToIndex[key];
			
			var font = null;
			
			if (key == 'Times-Roman' || key == 'Helvetica')
			{
				font = { Type : "Font" , Subtype : "Type1" , BaseFont : key }; // or lookup the font name in some global font dictionary to get the right font objects
				objects.push(font);
			}
			else
			{
				var fontType = 'OpenType'; // we probably need to store this in the Font component or something - .ttf or .otf
				
				if (fontType == 'TrueType')
				{
					var uint8Array = Canvas.fontNameToUint8Array[key]; // file bytes go here
					var stream = Uint8ArrayToAsciiHexDecode(uint8Array);
					var fontStreamDictionary = { Length : stream.length , Filter : "ASCIIHexDecode" , Length1 : uint8Array.length }; // Length1 = length after being decoded
					fontStreamDictionary["[stream]"] = stream;
					var fontDescriptor = { Type : "FontDescriptor" , FontName : key , FontFile2 : fontStreamDictionary };
					var font = { Type : "Font" , Subtype : "TrueType" , BaseFont : key , FontDescriptor : fontDescriptor };
					objects.push(font);
					objects.push(fontDescriptor);
					objects.push(fontStreamDictionary);
				}
				else if (fontType == 'OpenType')
				{
					var uint8Array = Canvas.fontNameToUint8Array[key]; // file bytes go here
					var stream = Uint8ArrayToAsciiHexDecode(uint8Array);
					var fontStreamDictionary = { Length : stream.length , Filter : "ASCIIHexDecode" , Length1 : uint8Array.length , Subtype : "OpenType" };
					fontStreamDictionary["[stream]"] = stream;
					var fontDescriptor = { Type : "FontDescriptor" , FontName : key , FontFile3 : fontStreamDictionary };
					var font = { Type : "Font" , Subtype : "TrueType" , BaseFont : key , FontDescriptor : fontDescriptor }; // should the Subtype still be TrueType?
					objects.push(font);
					objects.push(fontDescriptor);
					objects.push(fontStreamDictionary);
				}
				else
				{
					throw new Error();
				}
			}
			
			fontResourceDict[fontId] = font;
		}
		
		// this.imageDict = { "Im1" : XObject1 , "Im2" : XObject2 }
		for (var key in this.imageDict)
		{
			var xObject = this.imageDict[key];
			
			objects.push(xObject);
			imageResourceDict[key] = xObject;
		}
		
		for (var i = 0; i < this.sections.length; i++)
		{
			var section = this.sections[i];
			
			for (var k = 0; k < section.pdfCommands.length; k++)
			{
				var commands = section.pdfCommands[k].join('\r\n');
				
				var page = { Type : "Page" , Parent : pages , MediaBox : [ 0 , 0 , section.ptWidth , section.ptHeight ] , Resources : { Font : {} , XObject : {} } , Contents : null };
				var pagecontent = { Length : commands.length , "[stream]" : commands };
				
				// so, the *correct* approach here would be to only put the resources that are necessary to the page in the page's resource dict
				// however, that requires bookkeeping, and for what?  to save a few bytes?
				// so instead, we're just going to load the page's resource dict with the pointers to all fonts and images found in the document
				//if (section.fontDict) { page.Resources.Font = section.fontDict; }
				//if (section.imageDict) { page.Resources.XObject = section.imageDict; }
				page.Resources.Font = fontResourceDict;
				page.Resources.XObject = imageResourceDict;
				
				// this is the ducktape code for fonts that we use right now
				//page.Resources.Font.F1 = font;
				
				page.Contents = pagecontent;
				pages.Kids.push(page);
				objects.push(page);
				objects.push(pagecontent);
			}
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
	};
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
	function WritePdfList(list) {
		//var str = '';
		//str += '[ ';
		//list.forEach(function(obj) { str += WritePdfObj(obj, true); str += ' '; });
		//str += ']';
		//return str;
		
		var str = '[ ' + list.map(obj => WritePdfObj(obj, true)).join(' ') + ']';
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
			throw new Error('"' + type + '" is not a recogized type');
		}
		
		return s;
	}
	function Uint8ArrayToAsciiHexDecode(uint8Array) {
		
		var ascii = [];
		
		for (var i = 0; i < uint8Array.length; i++)
		{
			var b = uint8Array[i];
			var hex = ((b < 0x10) ? '0' : '') + b.toString(16).toUpperCase();
			ascii.push(hex);
		}
		
		return ascii.join('');
	}
	
	function Matrix() {
		this.rows = 3;
		this.cols = 3;
		this.m = [[1,0,0],[0,1,0],[0,0,1]];
	}
	Matrix.Multiply = function(a, b) {
		
		if (a.cols != b.rows) { throw new Error(); }
		
		var m = new Matrix();
		
		for (var i = 0; i < a.rows; i++)
		{
			for (var j = 0; j < b.cols; j++)
			{
				var sum = 0;
				
				for (var k = 0; k < a.cols; k++)
				{
					sum += a.m[i][k] * b.m[k][j];
				}
				
				m.m[i][j] = sum;
			}
		}
		
		return m;
	};
	Matrix.Translate = function(x, y) {
		var m = new Matrix();
		m.m = [[1,0,x],[0,1,y],[0,0,1]];
		return m;
	};
	Matrix.Scale = function(x, y) {
		var m = new Matrix();
		if (typeof(y) === 'undefined') { y = x; }
		m.m = [[x,0,0],[0,y,0],[0,0,1]];
		return m;
	};
	Matrix.Rotate = function(angleRad) {
		var m = new Matrix();
		m.m = [[Math.cos(angleRad),-Math.sin(angleRad),0],[Math.sin(angleRad),Math.cos(angleRad),0],[0,0,1]];
		return m
	};
	Matrix.Apply = function(m, p) {
		
		var q = {};
		q.x = m.m[0][0] * p.x + m.m[0][1] * p.y + m.m[0][2];
		q.y = m.m[1][0] * p.x + m.m[1][1] * p.y + m.m[1][2];
		return q;
	};
	
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
				g.SetActiveSection(jax.section);
				
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
				for (var i = 0; i < this.sections.length; i++)
				{
					var page = this.sections[i];
					page.div.html('<svg ' + xmlnss + ' width="' + page.width + '" height="' + page.height + '">' + page.eltStrings.join('') + '</svg>');
				}
			}
		}
		else
		{
			Griddl.svgOutput = '<svg ' + xmlnss + ' width="' + Griddl.g.sections[0].width + '" height="' + Griddl.g.sections[0].height + '">' + Griddl.g.sections[0].eltStrings.join('') + '</svg>';
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
	
	function ParseColor(str) {
		
		// 'this' is undefined in this context - need a reference if we're to use the savedCanvasContext
		//if (typeof window != 'undefined')
		//{
		//	this.savedCanvasContext.fillStyle = str; // this will convert from 'red' to 'rgb(255,0,0)'
		//	str = this.savedCanvasContext.fillStyle;
		//}
		
		var colorDict = {};
		colorDict.black = {r:0,g:0,b:0,a:255};
		colorDict.red = {r:255,g:0,b:0,a:255};
		colorDict.green = {r:0,g:255,b:0,a:255};
		colorDict.blue = {r:0,g:0,b:255,a:255};
		colorDict.gray = {r:128,g:128,b:128,a:255};
		colorDict.white = {r:255,g:255,b:255,a:255};
		colorDict.yellow = {r:255,g:255,b:0,a:255};
		colorDict.orange = {r:255,g:128,b:0,a:255};
		colorDict.purple = {r:255,g:0,b:255,a:255};
		
		if (str.startsWith('rgb('))
		{
			return ParseRgbColor(str);
		}
		else if (str.startsWith('hsl('))
		{
			throw new Error();
		}
		else if (str.startsWith('#'))
		{
			return ParseHexColor(str);
		}
		else if (colorDict[str])
		{
			return colorDict[str];
		}
		else
		{
			throw new Error();
		}
	}
	function ParseRgbColor(str) {
		// str = 'rgb(0,0,0)' or 'rgba(0,0,0,0)'
		var parens = str.substring(str.indexOf('('));
		var rgb = parens.substring(1, parens.length - 1);
		var rgblist = rgb.split(',');
		var color = {};
		color.r = parseInt(rgblist[0]);
		color.g = parseInt(rgblist[1]);
		color.b = parseInt(rgblist[2]);
		return color;
	}
	function ParseHexColor(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	}
	function ConvertColorToPdf(str) {
		const color = ParseColor(str);
		const pdfstr = (color.r / 255).toString() + ' ' + (color.g / 255).toString() + ' ' + (color.b / 255).toString();
		return pdfstr;
	};
	
	// there are four systems for drawing text:
	// 1. the native CanvasRenderingContext2D/PDF systems (fillTextNative)
	// 2. using font coordinates dumped into fonts.js (fillTextSvgFont)
	// 3. using truetype.js, which reads from an uploaded font file (fillTextTrueType and DrawGlyph)
	// 4. using opentype.js
	// 5. using PDF - embedding the font within the PDF file and using PDF text drawing commands
	
	// the fillText toggle function must sync with measureText in order for typesetting and other stuff to work properly
	Canvas.prototype.fillText = function(text, x, y) { this.fillTextTrueOrOpenType(text, x, y); };
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
			
			var {dx,dy} = this.textAlign(text);
			
			svg += 'dy="' + dy.toString() + '" ';
			
			svg += 'font-family="' + this.fontFamily + '" ';
			svg += 'font-size="' + this.fontSizePx.toString() + '" ';
			
			svg += '>' + text + '</text>';
			
			this.eltStrings.push(svg);
		}
		
		if (Canvas.drawPdf)
		{
			this.fillTextPdf(text, x, y);
		}
	};
	Canvas.prototype.fillTextSvgFont = function(text, x, y) {
		
		var glyphset = Griddl.fonts[this.fontFamily];
		
		var multiplier = this.fontSize / 2048;
		
		var {dx,dy} = this.alignText(text);
		
		this.save();
		this.translate(x + dx, y + dy);
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
	Canvas.prototype.fillTextTrueOrOpenType = function(text, x, y) {
		
		if (this.fontObject.constructor.name == 'Font')
		{
			this.fillTextOpenType(text, x, y);
		}
		else if (this.fontObject.constructor.name == 'TrueTypeFont')
		{
			this.fillTextTrueType(text, x, y);
		}
		else
		{
			throw new Error();
		}
	};
	Canvas.prototype.fillTextTrueType = function(text, x, y) {
		
		this.beginPath();
		
		var fontScale = this.fontSizePt / 72; // magic number - not correct - right now this is being used as font scale -> pixel scale conversion via multiplication
		
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
	Canvas.prototype.fillTextOpenType = function(text, x, y) {
		
		// x and y are in cubits at this point
		
		var {dxCu,dyCu} = this.alignText(text); // what units are dx and dy in?
		
		var xCu = x + dxCu;
		var yCu = y + dyCu;
		
		// we can comment out the if statements below and just use this, and it will work
		// it will just draw the glyphs as fill paths, making for a large PDF
		//this.fontObject.draw(this, text, x, y, this.fontSizePx, {});
		
		if (this.drawCanvas)
		{
			// if we are going to use the PDF-native way of drawing text below, then we don't want to duplicate
			var savedPdfState = Canvas.drawPdf;
			Canvas.drawPdf = false;
			this.fontObject.draw(this, text, xCu, yCu, this.fontSizeCu, {});
			Canvas.drawPdf = savedPdfState;
		}
		
		if (Canvas.drawPdf)
		{
			this.fillTextPdf(text, xCu, yCu);
		}
	};
	Canvas.prototype.fillTextPdf = function(text, x, y) {
		
		// x and y come in as cubits - conversion to points is done by the scaling done at the beginning of the page commands
		// but should font size be specified in cubits?  probably
		
		if (y > this.currentSection.hgCu)
		{
			var pageIndex = Math.floor(y / this.currentSection.hgCu, 1);
			this.commands = this.currentSection.pdfCommands[pageIndex];
			y = y % this.currentSection.hgCu;
		}
		
		if (!this.fontNameToIndex[this.fontFamily])
		{
			this.fontNameToIndex[this.fontFamily] = this.fontCount + 1;
			this.fontCount++;
		}
		
		// this could be changed from F1, F2, etc. to TimesNewRoman, Arial, etc., but it would require some reworking
		// if we do that, you have to also change the code in MakePdf that does this same construction
		var fontId = 'F' + this.fontNameToIndex[this.fontFamily];
		
		// a couple things here: repeating BT, Tf, and ET on every fillText is obviously more verbose than it needs to be
		// it would be nice to be able to batch fillText commands and then dump them in one block
		// two ways to do batching:
		// 1. the client controls it - this would require new Canvas functions, such as fillTexts(texts)
		// 2. Canvas does it automatically in the background - much trickier, obviously
		//   would require an inTextBlock boolean, and also would require dumping the font when the font field is set, not here
		
		// the inTextBlock flag could be set here in fillText, but would have to be cleared in literally every other drawing function
		
		// a much more overhaul-y way of doing this would be to cache *all* drawing commands and then optimize as needed
		// to be fair, we already sort of do this with the PDF command lists - we could just examine those before dumping the file to eliminate duplicate BT, Tf, ET commands
		
		PushCommand(this, 'BT');
		PushCommand(this, '/' + fontId + ' ' + this.fontSizeCu.toString() + ' Tf'); // /F1 12 Tf
		//PushCommand(this, x.toString() + ' ' + y.toString() + ' TD');
		PushCommand(this, '1 0 0 -1 ' + x.toString() + ' ' + y.toString() + ' Tm'); // 1 0 0 -1 50 50 Tm - the -1 flips the y axis
		PushCommand(this, '(' + text + ') Tj'); // (foo) Tj
		PushCommand(this, 'ET');
	};
	Canvas.prototype.fillTextDebug = function(text, x, y) {
		console.log('fill' + '\t"' + text + '"\t' + x + '\t' + y + '\t' + DebugStyle(this));
	};
	
	Canvas.prototype.strokeText = function(text, x, y) { this.strokeTextOpenType(text, x, y); };
	Canvas.prototype.strokeTextOpenType = function(text, x, y) {
		
		var {dxCu,dyCu} = this.alignText(text);
		
		// in order to stroke text, we get the Path from the Font, change some fields on the Path, and then call Path.draw(ctx)
		// this might also have to be used for fillTextOpenType if we want to draw in a color other than black
		// note that we pass the fontObject coordinates in cubits, because the fontObject will call ctx, which is already appropriately scaled
		var path = this.fontObject.getPath(this, text, x + dxCu, y + dyCu, this.fontSizeCu, {});
		path.fill = null;
		path.stroke = this.strokeStyle;
		path.strokeWidth = this.lineWidth;
		path.draw(this);
	};
	
	Canvas.prototype.alignText = function(text) {
		
		var leftToRight = true; // pull this from the font somehow?
		var computedTextAlign = null;
		
		var dxCu = 0;
		var dyCu = 0;
		
		if (this.textAlign == 'start')
		{
			if (leftToRight)
			{
				computedTextAlign = 'left';
			}
			else
			{
				computedTextAlign = 'right';
			}
		}
		else if (this.textAlign == 'end')
		{
			if (leftToRight)
			{
				computedTextAlign = 'right';
			}
			else
			{
				computedTextAlign = 'left';
			}
		}
		else
		{
			computedTextAlign = this.textAlign;
		}
		
		if (computedTextAlign == 'left')
		{
			
		}
		else
		{
			var textMetricsCu = this.measureTextOpenType(text);
			
			if (computedTextAlign == 'center')
			{
				dxCu = -textMetricsCu.width / 2;
			}
			else if (computedTextAlign == 'right')
			{
				dxCu = -textMetricsCu.width;
			}
			else
			{
				throw new Error();
			}
		}
		
		if (this.textBaseline == 'alphabetic')
		{
			
		}
		else if (this.textBaseline == 'top')
		{
			dyCu = this.fontObject.ascender / this.fontObject.unitsPerEm * this.fontSizeCu;
		}
		else if (this.textBaseline == 'middle')
		{
			dyCu = -this.fontObject.descender / this.fontObject.unitsPerEm * this.fontSizeCu; // descender is negative, i guess
		}
		else if (this.textBaseline == 'bottom')
		{
			dyCu = this.fontObject.descender / this.fontObject.unitsPerEm * this.fontSizeCu; // descender is negative, i guess
		}
		else if (this.textBaseline == 'ideographic')
		{
			// ?
		}
		else if (this.textBaseline == 'hanging')
		{
			// ?
		}
		else
		{
			throw new Error();
		}
		
		return {dxCu:dxCu,dyCu:dyCu};
	};
	
	Canvas.prototype.measureText = function(str) { return this.measureTextOpenType(str); }
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
		
		return { width : sum };
	};
	Canvas.prototype.measureTextTrueType = function(str) {
		
		var sum = 0;
		
		for (var i = 0; i < str.length; i++)
		{
			var code = str.charCodeAt(i) - 29;
			var wd = this.fontObject.getGlyphWidth(code);
			sum += wd;
		}
		
		var width = sum * this.fontSizePt / 72;  // magic number - not correct - right now this is being used as font scale -> pixel scale conversion via multiplication
		
		return { width : width };
	};
	Canvas.prototype.measureTextOpenType = function(str) {
		
		// coordinates in the font object are converted to path coordinate by multiplying by: 1 / font.unitsPerEm * fontSize
		// basically fontSize specifies the em size
		// so if we specify a fontSize of 1, what we're doing is asking for coordinates in ems
		// we then multiply that by the fontSize in pixels, points, or cubits to get the size in units we need
		var x = 0;
		var y = 0;
		var fontSize = 1;
		var path = this.fontObject.getPath(str, x, y, fontSize);
		
		var xMin = +Infinity;
		var xMax = -Infinity;
		var yMin = +Infinity;
		var yMax = -Infinity;
		
		for (var i = 0; i < path.commands.length; i++)
		{
			var command = path.commands[i];
			
			if (command.x)
			{
				xMin = Math.min(xMin, command.x);
				yMin = Math.min(yMin, command.y);
				xMax = Math.max(xMax, command.x);
				yMax = Math.max(yMax, command.y);
			}
			
			if (command.x1)
			{
				xMin = Math.min(xMin, command.x1);
				yMin = Math.min(yMin, command.y1);
				xMax = Math.max(xMax, command.x1);
				yMax = Math.max(yMax, command.y1);
			}
			
			if (command.x2)
			{
				xMin = Math.min(xMin, command.x2);
				yMin = Math.min(yMin, command.y2);
				xMax = Math.max(xMax, command.x2);
				yMax = Math.max(yMax, command.y2);
			}
		}
		
		var wdEm = xMax - xMin;
		var hgEm = yMax - yMin;
		
		var wdCu = wdEm * this.fontSizeCu;
		var hgCu = hgEm * this.fontSizeCu;
		//var wdPx = wdEm * this.fontSizePx;
		//var hgPx = hgEm * this.fontSizePx;
		//var wdPt = wdEm * this.fontSizePt;
		//var hgPt = hgEm * this.fontSizePt;
		
		return { width : wdCu , height : hgCu };
	};
	Canvas.prototype.measureTextDebug = function(str) {
		//console.log('measure' + '\t"' + str + '"\t' + DebugStyle(this));
		return { width : str.length * 6 };
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
	
	function DebugStyle(ctx) {
		
		var l = [];
		l.push(ctx.font);
		l.push(ctx.fillStyle);
		//l.push(ctx.strokeStyle);
		//l.push(ctx.textAlign);
		//l.push(ctx.textBaseline);
		return l.join('\t');
	}
	
	Bitmap.prototype.fillRect = function(left, top, width, height) { this.DrawRect(left, top, width, height, true, false); };
	Bitmap.prototype.strokeRect = function(left, top, width, height) { this.DrawRect(left, top, width, height, false, true); };
	Bitmap.prototype.DrawRect = function(left, top, width, height, doFill, doStroke) {
		
		var p1 = { x : left , y : top };
		var p2 = { x : left + width , y : top };
		var p3 = { x : left + width , y : top + height };
		var p4 = { x : left , y : top + height };
		
		this.beginPath();
		this.moveTo(p1.x, p1.y);
		this.lineTo(p2.x, p2.y);
		this.lineTo(p3.x, p3.y);
		this.lineTo(p4.x, p4.y);
		this.closePath();
		if (doFill) { this.fill(); }
		if (doStroke) { this.stroke(); }
	};
	Bitmap.prototype.fillRectSharp = function(left, top, width, height) {
		
		for (var i = 0; i < width; i++)
		{
			for (var j = 0; j < height; j++)
			{
				var x = left + i;
				var y = top + j;
				this.setPixel(x, y, this.fillColor);
			}
		}
	};
	Bitmap.prototype.strokeRectSharp = function(left, top, width, height) {
		
		// this is not quite the same as canvas - the stroke is contained entirely within the fill area - it's just the outer pixel of the fill
		
		for (var i = 0; i < width; i++)
		{
			var x = left + i;
			var y1 = top;
			var y2 = top + height - 1;
			this.setPixel(x, y1, this.strokeColor);
			this.setPixel(x, y2, this.strokeColor);
		}
		
		for (var j = 0; j < height; j++)
		{
			var x1 = left;
			var x2 = left + width - 1;
			var y = top + j;
			this.setPixel(x1, y, this.strokeColor);
			this.setPixel(x2, y, this.strokeColor);
		}
	};
	Bitmap.prototype.clearRect = function(left, top, width, height) {
		
		for (var i = 0; i < height; i++)
		{
			for (var j = 0; j < width; j++)
			{
				var x = left + j;
				var y = top + i;
				var index = ((this.height - y - 1) * this.width + x) * (this.bitcount / 8);
				this.pixels[index + 0] = 255;
				this.pixels[index + 1] = 255;
				this.pixels[index + 2] = 255;
				if (this.bitcount == 32) { this.pixels[index + 3] = 255; }
			}
		}
	};
	Canvas.prototype.fillRect = function(left, top, width, height) { this.DrawRect(left, top, width, height, true, false); };
	Canvas.prototype.strokeRect = function(left, top, width, height) { this.DrawRect(left, top, width, height, false, true); };
	Canvas.prototype.clearRect = function(left, top, width, height) {
		
		if (this.useOwnTransforms)
		{
			// indeed, this could be used for this function in all circumstances.  as long as we can assume clear = fill with white
			var savedFillStyle = this.fillStyle;
			this.fillStyle = 'rgb(255,255,255)';
			this.fillRect(left, top, width, height);
			this.fillStyle = savedFillStyle;
		}
		
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
		
		if (Canvas.drawPdf)
		{
			PushCommand(this, '1 1 1 rg');
			PushCommand(this, left.toString() + ' ' + top.toString() + ' ' + width.toString() + ' ' + height.toString() + ' re');
			PushCommand(this, 'F');
			this.fillStyle = this.fillStyle; // this self-assign will undo the white fill set above
		}
	};
	Canvas.prototype.DrawRect = function(left, top, width, height, doFill, doStroke) {
		
		if (this.useOwnTransforms)
		{
			// indeed, this could be used for this function in all circumstances
			var p1 = { x : left , y : top };
			var p2 = { x : left + width , y : top };
			var p3 = { x : left + width , y : top + height };
			var p4 = { x : left , y : top + height };
			
			this.beginPath();
			this.moveTo(p1.x, p1.y);
			this.lineTo(p2.x, p2.y);
			this.lineTo(p3.x, p3.y);
			this.lineTo(p4.x, p4.y);
			this.closePath();
			if (doFill) { this.fill(); }
			if (doStroke) { this.stroke(); }
			return;
		}
		
		if (this.drawBmp)
		{
			// indeed, this could be used for this function in all circumstances
			var p1 = { x : left , y : top };
			var p2 = { x : left + width , y : top };
			var p3 = { x : left + width , y : top + height };
			var p4 = { x : left , y : top + height };
			
			this.beginPath();
			this.moveTo(p1.x, p1.y);
			this.lineTo(p2.x, p2.y);
			this.lineTo(p3.x, p3.y);
			this.lineTo(p4.x, p4.y);
			this.closePath();
			if (doFill) { this.fill(); }
			if (doStroke) { this.stroke(); }
			return;
		}
		
		if (this.drawCanvas)
		{
			if (doFill)
			{
				this.g.fillRect(left, top, width, height);
			}
			
			if (doStroke)
			{
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
		
		if (Canvas.drawPdf)
		{
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
	
	Canvas.prototype.beginPath = function() {
		
		if (this.drawBmp)
		{
			this.splines = [];
			this.startPoint = { x : 0 , y : 0 };
		}
		
		this.currentPoint = { x : 0 , y : 0 };
		
		if (this.drawCanvas)
		{
			this.g.beginPath();
		}
		
		if (this.drawSvg)
		{
			this.currentPath = '';
		}
		
		if (Canvas.drawPdf)
		{
			
		}
	};
	Canvas.prototype.closePath = function() {
		
		if (this.drawBmp)
		{
			this.splines.push({type:'line',points:[{x:this.currentPoint.x,y:this.currentPoint.y},{x:this.startPoint.x,y:this.startPoint.y}]});
		}
		
		if (this.drawCanvas)
		{
			this.g.closePath();
		}
		
		if (this.drawSvg)
		{
			this.currentPath += 'z';
		}
		
		if (Canvas.drawPdf)
		{
			PushCommand(this, 'h');
		}
	};
	Canvas.prototype.moveTo = function(x, y) {
		
		if (this.useOwnTransform)
		{
			var p = Matrix.Apply(this.matrix, {x:x,y:y});
			x = p.x;
			y = p.y;
		}
		
		if (this.drawBmp)
		{
			//this.splines.push({type:'move',x:x,y:y});
			this.startPoint.x = x;
			this.startPoint.y = y;
		}
		
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
		
		if (Canvas.drawPdf)
		{
			PushCommand(this, x.toString() + ' ' + y.toString() + ' m');
		}
		
		this.currentPoint.x = x;
		this.currentPoint.y = y;
	};
	Canvas.prototype.lineTo = function(x, y) {
		
		if (this.useOwnTransform)
		{
			var p = Matrix.Apply(this.matrix, {x:x,y:y});
			x = p.x;
			y = p.y;
		}
		
		if (this.drawBmp)
		{
			this.splines.push({type:'line',points:[{x:this.currentPoint.x,y:this.currentPoint.y},{x:x,y:y}]});
		}
		
		if (this.drawCanvas)
		{
			this.g.lineTo(x, y);
		}
		
		if (this.drawSvg)
		{
			this.currentPath += ' L ' + x.toString() + ' ' + y.toString() + ' ';
		}
		
		if (Canvas.drawPdf)
		{
			PushCommand(this, x.toString() + ' ' + y.toString() + ' l');
		}
		
		this.currentPoint.x = x;
		this.currentPoint.y = y;
	};
	Canvas.prototype.quadraticCurveTo = function(x1, y1, x, y) {
		
		if (this.useOwnTransform)
		{
			var p1 = Matrix.Apply(this.matrix, {x:x1,y:y1});
			var p = Matrix.Apply(this.matrix, {x:x,y:y});
			x1 = p1.x;
			y1 = p1.y;
			x = p.x;
			y = p.y;
		}
		
		if (this.drawBmp)
		{
			this.splines.push({type:'quadratic',points:[{x:this.currentPoint.x,y:this.currentPoint.y},{x:x1,y:y1},{x:x,y:y}]});
		}
		
		if (this.drawCanvas)
		{
			this.g.quadraticCurveTo(x1, y1, x, y);
		}
		
		if (this.drawSvg)
		{
			this.currentPath += ' Q ' + x1.toString() + ' ' + y1.toString() + ' ' + x.toString() + ' ' + y.toString() + ' ';
		}
		
		if (Canvas.drawPdf)
		{
			// put the end point as the second control point
			PushCommand(this, x1.toString() + ' ' + y1.toString() + ' ' + x.toString() + ' ' + y.toString() + ' ' + x.toString() + ' ' + y.toString() + ' c');
		}
		
		this.currentPoint.x = x;
		this.currentPoint.y = y;
	};
	Canvas.prototype.bezierCurveTo = function(x1, y1, x2, y2, x, y) {
		
		if (this.useOwnTransform)
		{
			var p1 = Matrix.Apply(this.matrix, {x:x1,y:y1});
			var p1 = Matrix.Apply(this.matrix, {x:x2,y:y2});
			var p = Matrix.Apply(this.matrix, {x:x,y:y});
			x1 = p1.x;
			y1 = p1.y;
			x2 = p2.x;
			y2 = p2.y;
			x = p.x;
			y = p.y;
		}
		
		if (this.drawBmp)
		{
			this.splines.push({type:'cubic',points:[{x:this.currentPoint.x,y:this.currentPoint.y},{x:x1,y:y1},{x:x2,y:y2},{x:x,y:y}]});
			this.currentPoint.x = x;
			this.currentPoint.y = y;
		}
		
		if (this.drawCanvas)
		{
			this.g.bezierCurveTo(x1, y1, x2, y2, x, y);
		}
		
		if (this.drawSvg)
		{
			this.currentPath += ' C ' + x1.toString() + ' ' + y1.toString() + ' ' + x2.toString() + ' ' + y2.toString() + ' ' + x.toString() + ' ' + y.toString() + ' ';
		}
		
		if (Canvas.drawPdf)
		{
			PushCommand(this, x1.toString() + ' ' + y1.toString() + ' ' + x2.toString() + ' ' + y2.toString() + ' ' + x.toString() + ' ' + y.toString() + ' c');
		}
		
		this.currentPoint.x = x;
		this.currentPoint.y = y;
	};
	Canvas.prototype.arcTo = function(x1, y1, x2, y2, r) {
		
		// this is basically API sugar for easy creation of round rects
		// from the current point, draw an imaginary line to (x1,y1) and then to (x2,y2)
		// then draw the arc of radius r that fits inside the corner formed
		// only the arc is drawn
		
		if (this.useOwnTransform)
		{
			var p1 = Matrix.Apply(this.matrix, {x:x1,y:y1});
			var p2 = Matrix.Apply(this.matrix, {x:x2,y:y2});
			x1 = p1.x;
			y1 = p1.y;
			x2 = p2.x;
			y2 = p2.y;
		}
		
		
		// let's just translate this to arc in all cases, because we need to set currentPoint to dx,dy anyway
		//if (this.drawCanvas) { this.g.arcTo(x1, y1, x2, y2, r); }
		
		var x0 = this.currentPoint.x;
		var y0 = this.currentPoint.y;
		
		var v10 = { x : x1 - x0 , y : y1 - y0 };
		var v12 = { x : x1 - x2 , y : y1 - y2 };
		var dot = v10.x * v12.x + v10.y * v12.y;
		var v10len = Math.sqrt(v10.x * v10.x + v10.y * v10.y);
		var v12len = Math.sqrt(v12.x * v12.x + v12.y * v12.y);
		var angle = Math.acos(dot / (v10len * v12len));
		var a = angle / 2;
		
		var d1c = r / Math.sin(a);
		var d1b = r / Math.tan(a);
		
		var bearing10 = Math.atan2(y0 - y1, x0 - x1);
		var bearing12 = Math.atan2(y2 - y1, x2 - x1);
		var bearing1c = (bearing10 + bearing12) / 2;
		
		var bx = x1 + d1b * Math.cos(bearing10);
		var by = y1 + d1b * Math.sin(bearing10);
		
		var dx = x1 + d1b * Math.cos(bearing12);
		var dy = y1 + d1b * Math.sin(bearing12);
		
		var cx = x1 + d1c * Math.cos(bearing1c);
		var cy = y1 + d1c * Math.sin(bearing1c);
		
		var bearingcb = Math.atan2(by - cy, bx - cx);
		var bearingcd = Math.atan2(dy - cy, dx - cx);
		
		var startAngle = bearingcb;
		var endAngle = bearingcd;
		
		this.lineTo(bx, by);
		this.arc(cx, cy, r, startAngle, endAngle, false);
		
		this.currentPoint.x = dx;
		this.currentPoint.y = dy;
	};
	Canvas.prototype.arc = function(cx, cy, r, startAngle, endAngle, bAntiClockwise) {
		
		if (this.useOwnTransform)
		{
			var p = Matrix.Apply(this.matrix, {x:cx,y:cy});
			cx = p.x;
			cy = p.y;
		}
		
		if (this.drawBmp)
		{
			if (!bAntiClockwise) // an arc spline is defined as anticlockwise
			{
				var temp = startAngle;
				startAngle = endAngle;
				endAngle = temp;
			}
			
			this.splines.push({type:'arc',center:{x:cx,y:cy},radius:r,startAngle:startAngle,endAngle:endAngle});
		}
		
		if (this.drawCanvas)
		{
			this.g.arc(cx, cy, r, startAngle, endAngle, bAntiClockwise);
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
		
		if (Canvas.drawPdf)
		{
			// http://hansmuller-flex.blogspot.com/2011/04/approximating-circular-arc-with-cubic.html
			// http://pomax.github.io/bezierinfo/#circles_cubic
			
			const quadrantAngle = Math.PI / 2;
			
			// we'll assume that the direction is clockwise
			
			if (!bAntiClockwise)
			{
				const temp = startAngle;
				startAngle = endAngle;
				endAngle = temp;
			}
			
			var angleRemaining = endAngle - startAngle;
			var count = 0;
			
			var p0x = cx + r * Math.cos(startAngle);
			var p0y = cy + r * Math.sin(startAngle);
			
			this.moveTo(p0x, p0y);
			
			while (count < 4 && angleRemaining > 0)
			{
				var angle = Math.min(angleRemaining, quadrantAngle);
				
				// the control points are tangent to the endpoints
				
				var f = 4/3*Math.tan(angle/4);
				
				var p1x = p0x + r * f * -Math.sin(startAngle);
				var p1y = p0y + r * f * +Math.cos(startAngle);
				var p2x = cx + r * (Math.cos(startAngle + angle) + f * Math.sin(startAngle + angle));
				var p2y = cy + r * (Math.sin(startAngle + angle) - f * Math.cos(startAngle + angle));
				
				var p3x = cx + r * Math.cos(startAngle + angle);
				var p3y = cy + r * Math.sin(startAngle + angle);
				
				this.bezierCurveTo(p1x, p1y, p2x, p2y, p3x, p3y);
				
				p0x = p3x;
				p0y = p3y;
				
				startAngle += quadrantAngle;
				angleRemaining -= quadrantAngle;
				count++;
			}
		}
	};
	Canvas.prototype.ellipse = function(cx, cy, rx, ry, rotationRadians, startAngleRadians, endAngleRadians, bAntiClockwise) {
		
		if (this.useOwnTransform)
		{
			
		}
		
		if (this.drawBmp)
		{
			
		}
		
		if (this.drawCanvas)
		{
			this.g.ellipse(cx, cy, rx, ry, rotationRadians, startAngleRadians, endAngleRadians, bAntiClockwise);
		}
		
		if (this.drawSvg)
		{
			
		}
		
		if (Canvas.drawPdf)
		{
			
		}
	};
	Canvas.prototype.rect = function(left, top, width, height) {
		
		if (this.useOwnTransform)
		{
			var p1 = Matrix.Apply(this.matrix, {x:left,y:top});
			var p2 = Matrix.Apply(this.matrix, {x:left+width,y:top+height});
			
			// what happens to the current point?
			// perhaps we should just add the splines directly rather than calling moveTo and lineTo
			
			this.moveTo(p1.x, p1.y);
			this.lineTo(p2.x, p1.y);
			this.lineTo(p2.x, p2.y);
			this.lineTo(p1.x, p2.y);
			this.lineTo(p1.x, p1.y);
		}
		
		if (this.drawBmp)
		{
			
		}
		
		if (this.drawCanvas)
		{
			this.g.rect(left, top, width, height);
		}
		
		if (this.drawSvg)
		{
			
		}
		
		if (Canvas.drawPdf)
		{
			PushCommand(this, left.toString() + ' ' + top.toString() + ' ' + width.toString() + ' ' + height.toString() + ' re');
		}
	};
	
	function BitmapFill(bmp) {
		
		//quadratic {"x":66.31640625,"y":282.31640625},{"x":66.31640625,"y":285.97265625},{"x":65.15625,"y":289.505859375}
		//console.log(this.splines.map(spline => spline.type + ' ' + spline.points.map(point => JSON.stringify(point))).join('\n'));
		
		var bbox = BoundingBox(bmp.splines);
		
		var sumss = [];
		
		for (var y = bbox.yMin; y <= bbox.yMax; y++)
		{
			var sums = [];
			
			for (var x = bbox.xMin; x <= bbox.xMax; x++)
			{
				sums.push(0);
			}
			
			sumss.push(sums);
		}
		
		var n = 3;
		var nn = n * n;
		
		for (var yPix = bbox.yMin; yPix <= bbox.yMax; yPix++)
		{
			for (var i = 0; i < n; i++)
			{
				var y = yPix + 1/(2*n) + i / n;
				
				var xs = SplineIntersections(bmp.splines, y);
				xs.sort(function(a, b) { if (a < b) { return -1; } else { return 1; } }); // jfc, node casts to string before sorting
				//console.log(yPix + ' ' + i + ' [' + xs.map(d => d.toString()).join(',') + ']');
				var intersectionIndex = 0;
				
				var intersection = xs[intersectionIndex++];
				var oldIntersection = null;
				var fill = false;
				
				for (var xPix = bbox.xMin; xPix <= bbox.xMax; xPix++)
				{
					for (var j = 0; j < n; j++)
					{
						var x = xPix + 1/(2*n) + j / n;
						
						if (x >= intersection)
						{
							fill = !fill;
							
							do
							{
								oldIntersection = intersection;
								intersection = xs[intersectionIndex++];
							}
							while (intersection == oldIntersection);
						}
						
						if (fill)
						{
							sumss[yPix - bbox.yMin][xPix - bbox.xMin]++;
						}
						
						//if (yPix == 295 && xPix == bbox.xMax && sumss[yPix - bbox.yMin][xPix - bbox.xMin] == 3)
						//{
						//	debugger;
						//}
					}
				}
				
				// 295,0 0 0 0 0 0 0 0 1 3 3 3 2 2 0 0 0 0 0 2 3 3 2 3 1 0 0 0 0 0 0 0 0
				// 295,1 0 0 0 0 0 0 0 2 6 6 6 2 4 3 3 3 3 3 3 3 3 2 3 4 3 3 3 3 3 3 3 3
				// 295,2 0 0 0 0 0 0 0 2 9 9 9 5 5 3 3 3 3 3 4 6 6 5 6 4 3 3 3 3 3 3 3 3
				//console.log(yPix + ',' + i + ' ' + sumss[yPix - bbox.yMin].map(sum => sum.toString()).join(' '));
			}
			
			// 281 0 5 9 9 9 9 9 9 6 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 9 9 9 9 9 9 9 3 0 0
			//console.log(yPix + ' ' + sumss[yPix - bbox.yMin].map(sum => sum.toString()).join(' '));
		}
		
		for (var y = bbox.yMin; y <= bbox.yMax; y++)
		{
			for (var x = bbox.xMin; x <= bbox.xMax; x++)
			{
				var sum = sumss[y - bbox.yMin][x - bbox.xMin];
				bmp.fillColor.a = Math.floor(255 * sum / nn, 1);
				bmp.setPixel(x, y, bmp.fillColor);
			}
		}
	};
	function BitmapStroke(bmp) {
		
		// each path segment has a bounding box - we need only test subpixels within that bounding box
		
		// the functions drawLine and drawBezier below are rough implentations, good only when lineWidth = 1
		// to implement thicker lines, there are two options:
		// 1. offset curves and just run the fill algo - problem is that offsetting beziers is difficult - see http://pomax.github.io/bezierinfo/#offsetting
		// 2. calculate minimum distance to the curve and test that against the lineWidth
		//     this is elegant, except that finding the minimum for bezier curves requires finding roots of a 5th degree polynomial
		//     dd = (cx - x(t))*(cx - x(t)) + (cy - y(t))*(cy - y(t))
		//     since x(t) and y(t) are 3rd degree, the square is 6th, and then the derivative is 5th
		
		for (var i = 0; i < bmp.splines.length; i++)
		{
			var spline = bmp.splines[i];
			var type = spline.type;
			var p = spline.points;
			
			if (type == 'line')
			{
				bmp.drawLine(p[0].x, p[0].y, p[1].x, p[1].y);
			}
			else if (type == 'quadratic')
			{
				bmp.drawBezier(p[0].x, p[0].y, p[1].x, p[1].y, p[2].x, p[2].y, p[2].x, p[2].y); // cp2 = end point
			}
			else if (type == 'cubic')
			{
				bmp.drawBezier(p[0].x, p[0].y, p[1].x, p[1].y, p[2].x, p[2].y, p[3].x, p[3].y);
			}
			else
			{
				throw new Error();
			}
		}
	};
	Canvas.prototype.fill = function() {
		
		if (this.drawBmp)
		{
			BitmapFill(this.bmp);
		}
		
		if (this.drawCanvas)
		{
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
		
		if (Canvas.drawPdf)
		{
			PushCommand(this, 'F');
		}
	};
	Canvas.prototype.stroke = function() {
		
		if (this.drawBmp)
		{
			BitmapStroke(this.bmp);
		}
		
		if (this.drawCanvas)
		{
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
		
		if (Canvas.drawPdf)
		{
			PushCommand(this, 'S');
		}
	};
	Canvas.prototype.clip = function(path) {
		
		// path is an optional Path2D argument
		if (this.drawCanvas)
		{
			return this.g.clip(path);
		}
	};
	Canvas.prototype.isPointInPath = function(path, x, y) {
		// the path argument is optional - again, an annoying situation where optional arguments are put first
		if (this.drawCanvas)
		{
			return this.g.isPointInPath(path, x, y);
		}
	};
	Canvas.prototype.isPointInStroke = function(path, x, y) {
		// the path argument is optional
		
		if (this.drawCanvas)
		{
			return this.g.isPointInStroke(path, x, y);
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
			sx = 0;
			sy = 0;
			
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
				sw = image.width;
				sh = image.height;
			}
		}
		
		this.DrawImage(image, dx, dy, dw, dh, sx, sy, sw, sh);
	};
	Canvas.prototype.DrawImage = function(image, dx, dy, dw, dh, sx, sy, sw, sh) {
		
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
		
		if (this.drawBmp)
		{
			for (var i = 0; i < dw; i++)
			{
				for (var j = 0; j < dh; j++)
				{
					var dstX = dx + i;
					var dstY = dy + j;
					var srcX = sx + Math.floor(i * sw / dw, 1);
					var srcY = sy + Math.floor(j * sh / dh, 1);
					
					this.setPixel(dstX, dstY, image.getPixel(srcX, srcY));
				}
			}
		}
		
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
		
		if (Canvas.drawPdf)
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
			
			if (image.constructor.name == 'Bitmap')
			{
				
			}
			else
			{
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
			}
			
			var imagestreamlines = [];
			
			for (var i = 0; i < image.height; i++)
			{
				for (var j = 0; j < image.width; j++)
				{
					if (image.constructor.name == 'Bitmap')
					{
						var color = image.getPixel(j, i);
						var R = color.r;
						var G = color.g;
						var B = color.b;
					}
					else
					{
						var R = pixelData[(i * image.width + j) * 4 + 0];
						var G = pixelData[(i * image.width + j) * 4 + 1];
						var B = pixelData[(i * image.width + j) * 4 + 2];
						var A = pixelData[(i * image.width + j) * 4 + 3];
					}
					
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
			//imagematrix += (this.currentSection.height - scale * (dy + dh)).toString() + ' cm';
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
	Canvas.prototype.createImageData = function(width, height) {
		
		// if width is an ImageData object, pull the width/height from that object
		if (this.g) { return this.g.createImageData(width, height); }
	};
	
	// https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform
	Canvas.prototype.save = function() {
		
		if (this.debugTransform || this.useOwnTransform)
		{
			this.savedMatrixStack.push(this.matrix);
			if (this.useOwnTransform) { return; }
		}
		
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
		
		if (Canvas.drawPdf)
		{
			PushCommand(this, 'q');
		}
	};
	Canvas.prototype.restore = function() {
		
		if (this.debugTransform || this.useOwnTransform)
		{
			this.matrix = this.savedMatrixStack.pop();
			this.matrixStack = []; // restoration obliterates the logger and saved matrix chain
			this.loggerStack = [];
			if (this.useOwnTransform) { return; }
		}
		
		if (this.drawCanvas)
		{
			this.g.restore();
		}
		
		if (this.drawSvg)
		{
			this.transforms = this.transformStack.pop();
		}
		
		if (Canvas.drawPdf)
		{
			PushCommand(this, 'Q');
		}
	};
	Canvas.prototype.scale = function(x, y) {
		
		if (this.debugTransform || this.useOwnTransform)
		{
			var m = new Matrix.Scale(x, y);
			this.matrix = Matrix.Multiply(m, this.matrix);
			this.matrixStack.push(m);
			this.loggerStack.push('scale(' + x.toString() + ' ' + y.toString() + ')');
			if (this.useOwnTransform) { return; }
		}
		
		if (this.drawCanvas)
		{
			// EX: using translate(0,canvas.height); scale(1,-1); you will have the Cartesian coordinate system, with the origin in the bottom left corner
			this.g.scale(x, y);
		}
		
		if (this.drawSvg)
		{
			this.transforms.push('scale(' + x.toString() + ' ' + y.toString() + ')');
		}
		
		if (Canvas.drawPdf)
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
		
		if (this.debugTransform || this.useOwnTransform)
		{
			var m = new Matrix.Rotate(angle);
			this.matrix = Matrix.Multiply(m, this.matrix);
			this.matrixStack.push(m);
			this.loggerStack.push('rotate(' + (angle / (Math.PI * 2) * 360).toString() + ')');
			if (this.useOwnTransform) { return; }
		}
		
		if (this.drawCanvas)
		{
			// Rotates the canvas clockwise around the current origin by the angle number of radians.
			this.g.rotate(-angle); // we negatize the angle
		}
		
		if (this.drawSvg)
		{
			this.transforms.push('rotate(' + -(angle / (Math.PI * 2) * 360).toString() + ')');
		}
		
		if (Canvas.drawPdf)
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
		
		if (this.debugTransform || this.useOwnTransform)
		{
			var m = new Matrix.Rotate(-angle);
			this.matrix = Matrix.Multiply(m, this.matrix);
			this.matrixStack.push(m);
			this.loggerStack.push('rotate(' + (angle / (Math.PI * 2) * 360).toString() + ')');
			if (this.useOwnTransform) { return; }
		}
		
		if (this.drawCanvas)
		{
			// Rotates the canvas clockwise around the current origin by the angle number of radians.
			this.g.rotate(angle);
		}
		
		if (this.drawSvg)
		{
			this.transforms.push('rotate(' + (angle / (Math.PI * 2) * 360).toString() + ')');
		}
		
		if (Canvas.drawPdf)
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
		
		if (this.debugTransform || this.useOwnTransform)
		{
			var m = Matrix.Translate(x, y);
			this.matrix = Matrix.Multiply(m, this.matrix);
			this.matrixStack.push(m);
			this.loggerStack.push('translate(' + x.toString() + ',' + y.toString() + ')');
			if (this.useOwnTransform) { return; }
		}
		
		if (this.drawCanvas)
		{
			this.g.translate(x, y);
		}
		
		if (this.drawSvg)
		{
			this.transforms.push('translate(' + x.toString() + ' ' + y.toString() + ')');
		}
		
		if (Canvas.drawPdf)
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
		
		if (this.debugTransform || this.useOwnTransform)
		{
			var m = new Matrix();
			m.m = [[sx, kx, dx],[sy, ky, dy],[0,0,1]];
			this.matrix = Matrix.Multiply(m, this.matrix);
			this.matrixStack.push(m);
			this.loggerStack.push('matrix(' + sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ')');
			if (this.useOwnTransform) { return; }
		}
		
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
		
		if (Canvas.drawPdf)
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
		
		if (this.debugTransform || this.useOwnTransform)
		{
			var m = new Matrix();
			m.m = [[sx, kx, dx],[sy, ky, dy],[0,0,1]];
			this.matrix = Matrix.Multiply(m, this.matrix);
			this.matrixStack.push(m);
			this.loggerStack = [ 'matrix(' + sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ')' ];
			if (this.useOwnTransform) { return; }
		}
		
		if (this.drawCanvas)
		{
			// this overwrites the current transformation matrix
			this.g.setTransform(sx, kx, ky, sy, dx, dy);
		}
		
		if (this.drawSvg)
		{
			this.transforms = [ 'matrix(' + sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ')' ];
		}
		
		if (Canvas.drawPdf)
		{
			//PushCommand(this, '');
		}
	};
	Canvas.prototype.resetTransform = function() {
		
		if (this.debugTransform || this.useOwnTransform)
		{
			this.matrix = new Matrix();
			this.matrixStack = [];
			this.loggerStack = [];
			if (this.useOwnTransform) { return; }
		}
		
		if (this.drawCanvas)
		{
			this.g.resetTransform();
		}
		
		if (this.drawSvg)
		{
			this.transforms = [];
		}
		
		if (Canvas.drawPdf)
		{
			//PushCommand(this, '');
		}
	};
	
	Canvas.prototype.pausePdfOutput = function() {
		Canvas.savedDrawPdf = Canvas.drawPdf;
		Canvas.drawPdf = false;
	};
	Canvas.prototype.resumePdfOutput = function() {
		Canvas.drawPdf = Canvas.savedDrawPdf;
	};
	
	function Gradient(x1, y1, x2, y2) {
		
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		
		this.colorStops = [];
	};
	Gradient.prototype.addColorStop = function(d, color) {
		this.colorStops.push({d:d,color:color});
	};
	
	function Pattern(source, repeat) {
		
		this.source = source;
		this.repeat = repeat;
	}
	
	Canvas.prototype.createLinearGradient = function(x1, y1, x2, y2) {
		
		if (this.drawCanvas)
		{
			var gradient = this.g.createLinearGradient(x1, y1, x2, y2);
			return gradient; // we can't do this - we have to return one of our Gradient objects, which will then manage the passthrough
		}
		
		// how do we manage the passthrough when we create a new object?
		
		//var gradient = new Gradient(x1, y1, x2, y2);
		
		
		
		//return gradient;
	};
	Canvas.prototype.createRadialGradient = function(x1, y1, r1, x2, y2, r2) {
		
		if (this.drawCanvas)
		{
			var gradient = this.g.createRadialGradient(x1, y1, r1, x2, y2, r2);
			return gradient;
		}
		
		
		//var gradient = new Gradient(x1, y1, x2, y2);
		
		
		
		//return gradient;
	};
	Canvas.prototype.createPattern = function(source, repeat) {
		
		if (this.drawCanvas)
		{
			var pattern = this.g.createPattern(source, repeat);
			return pattern;
		}
		
	};
	
	Canvas.prototype.getLineDash = function() {
		return this._lineDashArray;
		
	};
	Canvas.prototype.setLineDash = function(value) {
		this._lineDashArray = value;
		if (this.g) { this.g.setLineDash(value); }
		if (Canvas.drawPdf) { PushCommand(this, '[ ' + this._lineDashArray.join(' ') + ' ] ' + this._lineDashOffset.toString() + ' d'); }
	};
	
	// extensions
	Bitmap.prototype.fillCircle = function(cx, cy, r) {
		
		// this is great for full circles bu5 we want to move to arcs
		var rr = r * r;
		var w = 2 * r;
		var n = 3;
		var nn = n * n;
		var sub = 1 / n;
		
		var lf = Math.floor(cx - r - 1);
		var rt = Math.floor(cx + r + 2);
		var tp = Math.floor(cy - r - 1);
		var bt = Math.floor(cy + r + 2);
		
		for (var xPixel = lf; xPixel <= rt; xPixel++)
		{
			for (var yPixel = tp; yPixel <= bt; yPixel++)
			{
				var sum = 0;
				
				for (var a = 0; a < n; a++)
				{
					for (var b = 0; b < n; b++)
					{
						var x = (xPixel + a * sub + sub / 2);
						var y = (yPixel + b * sub + sub / 2);
						
						var dd = (x-cx)*(x-cx)+(y-cy)*(y-cy);
						
						if (dd < rr)
						{
							sum++;
						}
					}
				}
				
				if (sum > 0)
				{
					this.fillColor.a = Math.floor(255 * sum / nn, 1);
					this.setPixel(xPixel, yPixel, this.fillColor);
				}
			}
		}
	};
	Canvas.prototype.fillCircle = function(cx, cy, r) { this.DrawCircle(cx, cy, r, true, false); };
	Canvas.prototype.strokeCircle = function(cx, cy, r) { this.DrawCircle(cx, cy, r, false, true); };
	Canvas.prototype.DrawCircle = function(cx, cy, r, doFill, doStroke) {
		
		if (this.useOwnTransform)
		{
			var p = Matrix.Apply(this.matrix, {x:cx,y:cy});
			cx = p.x;
			cy = p.y;
		}
		
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
		
		if (Canvas.drawPdf)
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
		
		if (this.useOwnTransforms)
		{
			// this could probably replace all the stuff below
			this.beginPath();
			this.moveTo(x1, y1);
			this.lineTo(x2, y2);
			this.stroke();
		}
		
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
		
		if (Canvas.drawPdf)
		{
			PushCommand(this, x1.toString() + ' ' + y1.toString() + ' m');
			PushCommand(this, x2.toString() + ' ' + y2.toString() + ' l');
			PushCommand(this, 'S');
		}
	};
	
	// these draw sharp lines on the canvas (while not affecting the PDF render)
	// Math.floor(x, 1)+0.5
	// of course, none of these do a bit of good if the canvas is scaled, so these only work if we're rolling our own transformations
	Canvas.prototype.drawSharpHorizontal = function(y, x1, x2) {
		
		if (this.drawCanvas)
		{
			const ty1 = Math.floor(y, 1)+0.5;
			const ty2 = Math.floor(y, 1)+0.5;
			const tx1 = Math.floor(x1, 1);
			const tx2 = Math.floor(x2, 1);
			
			this.g.beginPath();
			this.g.moveTo(tx1, ty1);
			this.g.lineTo(tx2, ty2);
			this.g.stroke();
		}
		
		if (Canvas.drawPdf)
		{
			PushCommand(this, x1.toString() + ' ' + y.toString() + ' m');
			PushCommand(this, x2.toString() + ' ' + y.toString() + ' l');
			PushCommand(this, 'S');
		}
	};
	Canvas.prototype.drawSharpVertical = function(x, y1, y2) {
		
		if (this.drawCanvas)
		{
			const ty1 = Math.floor(y1, 1);
			const ty2 = Math.floor(y2, 1);
			const tx1 = Math.floor(x, 1)+0.5;
			const tx2 = Math.floor(x, 1)+0.5;
			
			this.g.beginPath();
			this.g.moveTo(tx1, ty1);
			this.g.lineTo(tx2, ty2);
			this.g.stroke();
		}
		
		if (Canvas.drawPdf)
		{
			PushCommand(this, x.toString() + ' ' + y1.toString() + ' m');
			PushCommand(this, x.toString() + ' ' + y2.toString() + ' l');
			PushCommand(this, 'S');
		}
	};
	Canvas.prototype.drawSharpRect = function(left, top, width, height, doFill, doStroke) {
		
		if (this.drawCanvas)
		{
			const lf = Math.floor(left, 1);
			const tp = Math.floor(top, 1);
			const wd = Math.floor(width, 1);
			const hg = Math.floor(height, 1);
			
			this.g.beginPath();
			this.g.rect(lf, tp, wd, hg);
			if (doFill) { this.g.fill(); }
			if (doStroke) { this.g.stroke(); }
		}
		
		if (Canvas.drawPdf)
		{
			PushCommand(this, left.toString() + ' ' + top.toString() + ' ' + width.toString() + ' ' + height.toString() + ' re');
			if (doFill) { PushCommand(this, 'F'); }
			if (doStroke) { PushCommand(this, 'S'); }
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
		
		if (Canvas.drawPdf)
		{
			// need to approximate with bezier curves
		}
	};
	Bitmap.prototype.drawLine = function(x0, y0, x1, y1) {
		
		x0 = Math.floor(x0, 1);
		y0 = Math.floor(y0, 1);
		x1 = Math.floor(x1, 1);
		y1 = Math.floor(y1, 1);
		
		var dx = Math.abs(x1 - x0);
		var dy = Math.abs(y1 - y0);
		var sx = (x0 < x1) ? 1 : -1;
		var sy = (y0 < y1) ? 1 : -1;
		var err = dx - dy;
		
		if (Number.isNaN(err)) { throw new Error('NaN passed into Bitmap.drawLine'); }
		
		var color = this.strokeColor;
		
		//console.log(x0);
		//console.log(y0);
		//console.log(x1);
		//console.log(y1);
		
		while (true)
		{
			//console.log('x : ' + x0 + ' , y : ' + y0);
			
			//this.setPixel(x0, y0, color);
			if (0 <= x0 && x0 < this.width && 0 <= y0 && y0 < this.height)
			{
				var index = ((this.height - y0 - 1) * this.width + x0) * (this.bitcount / 8); // note that (0,0) is the bottom left
				this.pixels[index + 0] = color.b; // also note the order is BGR, not RGB
				this.pixels[index + 1] = color.g;
				this.pixels[index + 2] = color.r;
				if (this.bitcount == 32) { this.pixels[index + 3] = color.a; }
			}
			
			if ((x0 == x1) && (y0 == y1)) { break; }
			var e2 = 2 * err;
			if (e2 > -dy) { err -= dy; x0 += sx; }
			if (e2 < +dx) { err += dx; y0 += sy; }
		}
	};
	Bitmap.prototype.drawBezier = function(x0, y0, x1, y1, x2, y2, x3, y3) {
		
		// this samples points along the bezier curve, finds the pixel the point falls in, and determines how far the point is from the center of that pixel
		// then fills the pixel with a grayscale value depending on distance from center, subject to a ratchet where the pixel only gets darker
		// this works reasonably well, subject to the constraint that line width must be 1 and the color fill must be a solid 255 of something
		// the same basic algorithm can also be used for lines and arcs
		
		var dist = function(x0, y0, x1, y1) { return Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)); };
		var d = 3 * Math.floor(dist(x0, y0, x1, y1) + dist(x1, y1, x2, y2) + dist(x2, y2, x3, y3), 1);
		
		for (var i = 0; i <= d; i++)
		{
			var t = i / d;
			
			var x = ComputeBezier(t, x0, x1, x2, x3);
			var y = ComputeBezier(t, y0, y1, y2, y3);
			
			var pixelX = Math.floor(x, 1);
			var pixelY = Math.floor(y, 1);
			
			if (0 <= pixelX && pixelX < this.width && 0 <= pixelY && pixelY < this.height)
			{
				var distanceFromPixelCenter = dist(x, y, pixelX+0.5, pixelY+0.5);
				var grayscale = Math.floor(distanceFromPixelCenter * 255, 1)
				
				if (grayscale < this.getPixel(pixelX, pixelY).r)
				{
					this.setPixel(pixelX, pixelY, {r:grayscale,g:grayscale,b:grayscale});
				}
			}
		}
	};
	
	Canvas.prototype.fillPath = function(path) { this.drawPath(path, true, false); };
	Canvas.prototype.strokePath = function(path) { this.drawPath(path, false, true); };
	Canvas.prototype.drawPath = function(path, doFill, doStroke) {
		
		if (this.drawCanvas || Canvas.drawPdf)
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
	
	// general MathJax notes:
	// http://cdn.mathjax.org/mathjax/latest/test/sample-signals.html - this is an interesting page that shows all the signals that get sent
	// calls to drawMath don't immediately draw onto the canvas - the typesetting is put into the mathjax queue
	// actual drawing to the canvas happens in GenerateDocument(), after all callbacks have returned
	// jax = { section : Section , latex : string , x : float , y : float , d : string , style : Style }
	Canvas.prototype.drawMath = function(latex, x, y) {
		
		if (this.useOwnTransform)
		{
			var p = Matrix.Apply(this.matrix, {x:x,y:y});
			x = p.x;
			y = p.y;
		}
		
		if (typeof(latex) == 'object') { latex = '$$' + latex.ToLatex() + '$$'; }
		
		var jax = {};
		jax.section = this.currentSection;
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
	
	// this is mostly for debugging - we want to have a central place to put a breakpoint to inspect all PDF commands that come through
	function PushCommand(canvas, cmd) {
		if (cmd.match(/NaN/)) { throw new Error(); }
		canvas.commands.push(cmd);
	}
	
	// style saving
	// maybe it's a bad idea to have these be just the capitalized versions of save() and restore(), which are the passthrough versions?
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
	
	
	
	function Bitmap(width, height, bytesPerPixel) {
		
		this.magic = 'BM';
		this.size = 54 + width * height * bytesPerPixel;
		this.reserved1 = 0;
		this.reserved2 = 0;
		this.offset = 54;
		this.size2 = 40; // size of the second half of the header chunk
		this.width = width;
		this.height = height;
		this.planes = 1;
		this.bitcount = bytesPerPixel * 8;
		this.compression = 0;
		this.sizeImage = 0;
		this.xPelsPerMeter = 0;
		this.yPelsPerMeter = 0;
		this.clrUsed = 0;
		this.clrImportant = 0;
		
		this.pixels = new Uint8Array(width * height * bytesPerPixel);
		for (var i = 0; i < this.pixels.length; i++) { this.pixels[i] = 255; }
		
		this.lineWidth = 1;
		
		this.strokeStyle = 'rgb(0,0,0)';
		this.fillStyle = 'rgb(0,0,0)';
		this.strokeColor = {r:0,g:0,b:0,a:255};
		this.fillColor = {r:0,g:0,b:0,a:255};
		Object.defineProperty(this, 'strokeStyle', { set : function (str) { this.strokeColor = ParseColor(str); } });
		Object.defineProperty(this, 'fillStyle', { set : function (str) { this.fillColor = ParseColor(str); } });
		
		this.font = '10pt sans-serif'; // this actually needs to be a Font object
		this.textAlign = 'left'; // start, end, left, right, center
		this.textBaseline = 'alphabetic'; // top, hanging, middle, alphabetic, ideographic, bottom
		
		this.fontObject = null;
		
		this.splines = null;
		this.startPoint = null;
		this.currentPoint = null;
	}
	Bitmap.prototype.write = function() {
		
		var x = new Uint8Array(54 + this.pixels.length);
		
		var c = 0;
		x[c++] = 'B'.charCodeAt();
		x[c++] = 'M'.charCodeAt();
		x[c++] = this.size % 256;
		x[c++] = Math.floor(this.size / 256) % 256;
		x[c++] = Math.floor(this.size / 256 / 256) % 256;
		x[c++] = Math.floor(this.size / 256 / 256 / 256) % 256;
		x[c++] = this.reserved1 % 256;
		x[c++] = Math.floor(this.reserved1 / 256) % 256;
		x[c++] = this.reserved2 % 256;
		x[c++] = Math.floor(this.reserved2 / 256) % 256;
		x[c++] = this.offset % 256;
		x[c++] = Math.floor(this.offset / 256) % 256;
		x[c++] = Math.floor(this.offset / 256 / 256) % 256;
		x[c++] = Math.floor(this.offset / 256 / 256 / 256) % 256;
		x[c++] = this.size2 % 256;
		x[c++] = Math.floor(this.size2 / 256) % 256;
		x[c++] = Math.floor(this.size2 / 256 / 256) % 256;
		x[c++] = Math.floor(this.size2 / 256 / 256 / 256) % 256;
		x[c++] = this.width % 256;
		x[c++] = Math.floor(this.width / 256) % 256;
		x[c++] = Math.floor(this.width / 256 / 256) % 256;
		x[c++] = Math.floor(this.width / 256 / 256 / 256) % 256;
		x[c++] = this.height % 256;
		x[c++] = Math.floor(this.height / 256) % 256;
		x[c++] = Math.floor(this.height / 256 / 256) % 256;
		x[c++] = Math.floor(this.height / 256 / 256 / 256) % 256;
		x[c++] = this.planes % 256;
		x[c++] = Math.floor(this.planes / 256) % 256;
		x[c++] = this.bitcount % 256;
		x[c++] = Math.floor(this.bitcount / 256) % 256;
		x[c++] = this.compression % 256;
		x[c++] = Math.floor(this.compression / 256) % 256;
		x[c++] = Math.floor(this.compression / 256 / 256) % 256;
		x[c++] = Math.floor(this.compression / 256 / 256 / 256) % 256;
		x[c++] = this.sizeImage % 256;
		x[c++] = Math.floor(this.sizeImage / 256) % 256;
		x[c++] = Math.floor(this.sizeImage / 256 / 256) % 256;
		x[c++] = Math.floor(this.sizeImage / 256 / 256 / 256) % 256;
		x[c++] = this.xPelsPerMeter % 256;
		x[c++] = Math.floor(this.xPelsPerMeter / 256) % 256;
		x[c++] = Math.floor(this.xPelsPerMeter / 256 / 256) % 256;
		x[c++] = Math.floor(this.xPelsPerMeter / 256 / 256 / 256) % 256;
		x[c++] = this.yPelsPerMeter % 256;
		x[c++] = Math.floor(this.yPelsPerMeter / 256) % 256;
		x[c++] = Math.floor(this.yPelsPerMeter / 256 / 256) % 256;
		x[c++] = Math.floor(this.yPelsPerMeter / 256 / 256 / 256) % 256;
		x[c++] = this.clrUsed % 256;
		x[c++] = Math.floor(this.clrUsed / 256) % 256;
		x[c++] = Math.floor(this.clrUsed / 256 / 256) % 256;
		x[c++] = Math.floor(this.clrUsed / 256 / 256 / 256) % 256;
		x[c++] = this.clrImportant % 256;
		x[c++] = Math.floor(this.clrImportant / 256) % 256;
		x[c++] = Math.floor(this.clrImportant / 256 / 256) % 256;
		x[c++] = Math.floor(this.clrImportant / 256 / 256 / 256) % 256;
		
		var bytesPerPixel = this.bitcount / 8;
		var d = 0;
		for (var i = 0; i < this.height; i++)
		{
			for (var j = 0; j < this.width; j++)
			{
				for (var k = 0; k < bytesPerPixel; k++)
				{
					x[c++] = this.pixels[d++];
				}
			}
			
			if ((this.width * bytesPerPixel) % 2 == 1) { x[c++] = 0; } // padding
		}
		
		return x;
	};
	Bitmap.MakeBitmap = function(pixels, width, height) {
		
		// pixels is a Uint8Array
		
		var bytesPerPixel = 3; // should we determine this dynamically?
		var bmp = new Bitmap(width, height, bytesPerPixel);
		bmp.pixels = pixels;
		return bmp;
	};
	Bitmap.Read = function(b) {
		
		var k = {k:0};
		
		// 54 byte header
		var magic = Conversion.ReadUi(b, k, 2, true); // 'BM' = 19778
		var size = Conversion.ReadUi(b, k, 4, true); // what does this refer to?
		var reserved1 = Conversion.ReadUi(b, k, 2, true);
		var reserved2 = Conversion.ReadUi(b, k, 2, true);
		var offset = Conversion.ReadUi(b, k, 4, true); // u32 - offset into the file where the pixel data begins
		var size2 = Conversion.ReadUi(b, k, 4, true); // what does this refer to?
		var width = Conversion.ReadUi(b, k, 4, true); // u32
		var height = Conversion.ReadUi(b, k, 4, true); // u32
		var planes = Conversion.ReadUi(b, k, 2, true); // u16?
		var bitcount = Conversion.ReadUi(b, k, 2, true); // u16 - 8, 16, 24, 32
		var compression = Conversion.ReadUi(b, k, 4, true);
		var sizeImage = Conversion.ReadUi(b, k, 4, true);
		var xPelsPerMeter = Conversion.ReadUi(b, k, 4, true);
		var yPelsPerMeter = Conversion.ReadUi(b, k, 4, true);
		var clrUsed = Conversion.ReadUi(b, k, 4, true);
		var clrImportant = Conversion.ReadUi(b, k, 4, true);
		
		//console.log(width);
		//console.log(height);
		//console.log(bitcount);
		
		var bmp = new Bitmap(width, height, bitcount / 8);
		bmp.magic = magic;
		bmp.size = size;
		bmp.reserved1 = reserved1;
		bmp.reserved2 = reserved2;
		bmp.offset = offset;
		bmp.size2 = size2;
		bmp.width = width;
		bmp.height = height;
		bmp.planes = planes;
		bmp.bitcount = bitcount;
		bmp.compression = compression;
		bmp.sizeImage = sizeImage;
		bmp.xPelsPerMeter = xPelsPerMeter;
		bmp.yPelsPerMeter = yPelsPerMeter;
		bmp.clrUsed = clrUsed;
		bmp.clrImportant = clrImportant;
		
		k.k = bmp.offset;
		
		bmp.bytesPerPixel = bmp.bitcount / 8;
		
		var c = 0;
		
		bmp.pixels = new Uint8Array(bmp.height * bmp.width * bmp.bytesPerPixel);
		
		for (var i = 0; i < bmp.height; i++)
		{
			for (var j = 0; j < bmp.width; j++)
			{
				for (var m = 0; m < bmp.bytesPerPixel; m++)
				{
					bmp.pixels[c++] = Conversion.ReadUi(b, k, 1, true);
				}
			}
			
			if ((bmp.width * bmp.bytesPerPixel) % 2 == 1) { k.k++; } // disregard null padding
		}
		
		return bmp;
	};
	
	Bitmap.prototype.getPixel = function(x, y) {
		
		if (0 <= x && x < this.width && 0 <= y && y < this.height)
		{
			var index = ((this.height - y - 1) * this.width + x) * (this.bitcount / 8); // note that (0,0) is the bottom left
			var color = {};
			color.b = this.pixels[index + 0]; // also note the order is BGR, not RGB
			color.g = this.pixels[index + 1];
			color.r = this.pixels[index + 2];
			if (this.bitcount == 32) { color.a = this.pixels[index + 3]; }
			return color;
		}
		else
		{
			throw new Error();
		}
	};
	Bitmap.prototype.setPixel = function(x, y, color) {
		
		// the interface of this function takes an (x,y) coordinate assuming y=0 is the top of the canvas
		// but in bmp, (0,0) is the bottom left
		
		// do we deal with globalAlpha here?  do we deal with gradient fills here?
		
		if (0 <= x && x < this.width && 0 <= y && y < this.height)
		{
			var background = this.getPixel(x, y);
			var blend = {};
			var factor = color.a / 255;
			var inverse = 1 - factor;
			blend.r = Math.floor(color.r * factor + background.r * inverse, 1);
			blend.g = Math.floor(color.g * factor + background.g * inverse, 1);
			blend.b = Math.floor(color.b * factor + background.b * inverse, 1);
			
			var index = ((this.height - y - 1) * this.width + x) * (this.bitcount / 8); // note that (0,0) is the bottom left
			this.pixels[index + 0] = blend.b; // also note the order is BGR, not RGB
			this.pixels[index + 1] = blend.g;
			this.pixels[index + 2] = blend.r;
			//if (this.bitcount == 32) { this.pixels[index + 3] = color.a; }
		}
	};
	
	function BoundingBox(splines) {
		
		var xMin = +Infinity;
		var xMax = -Infinity;
		var yMin = +Infinity;
		var yMax = -Infinity;
		
		splines.forEach(function(spline) {
			spline.points.forEach(function(point) {
				xMin = Math.min(point.x, xMin);
				xMax = Math.max(point.x, xMax);
				yMin = Math.min(point.y, yMin);
				yMax = Math.max(point.y, yMax);
			});
		});
		
		var bbox = {};
		bbox.xMin = Math.floor(xMin - 1, 1);
		bbox.xMax = Math.floor(xMax + 2, 1);
		bbox.yMin = Math.floor(yMin - 1, 1);
		bbox.yMax = Math.floor(yMax + 2, 1);
		bbox.xRange = bbox.xMax - bbox.xMin;
		bbox.yRange = bbox.yMax - bbox.yMin;
		return bbox;
	}
	function SplineIntersections(splines, y) {
		
		var xs = [];
		
		var intersectingSplines = [];
		
		splines.forEach(function(spline) {
			
			var newxs = null;
			
			if (spline.type == 'line')
			{
				newxs = LineHoriIntersections(spline.points, y);
			}
			else if (spline.type == 'quadratic')
			{
				newxs = QuadraticHoriIntersections(spline.points, y);
			}
			else if (spline.type == 'cubic')
			{
				newxs = CubicHoriIntersections(spline.points, y);
			}
			else
			{
				throw new Error();
			}
			
			if (newxs.length > 0)
			{
				xs = xs.concat(newxs);
				intersectingSplines.push(spline);
			}
		});
		
		//if (xs.length % 2 == 1) { debugger; } // an odd number of intersections will cause a line artifact
		//if (y == 286.5) { debugger; }
		
		return xs;
	}
	function LineHoriIntersections(line, y) {
		
		// this gives the intersection points of a line segment with an infinite horizontal line
		// we return only the x-coordinate of the intersection point, since y is fixed
		// if there are no intersections, return an empty list
		// if the line is horizontal and coincident with the infinite line, return the endpoints of the segment
		
		if ((line[0].x == line[1].x) && (line[0].y == line[1].y)) { return []; }
		
		if (line[0].y == line[1].y)
		{
			if (line[0].y == y)
			{
				return [ line[0].x , line[1].x ];
			}
			else
			{
				return [];
			}
		}
		else
		{
			var sign = (y - line[0].y) * (y - line[1].y);
			
			if (sign < 0)
			{
				var dx = line[1].x - line[0].x;
				var dy = line[1].y - line[0].y;
				var dyNeeded = y - line[0].y;
				var x = line[0].x + dx * dyNeeded / dy;
				
				return [ x ];
			}
			else
			{
				return [];
			}
		}
	}
	function QuadraticHoriIntersections(quadratic, y) {
		
		function quadraticCoeffs(x0, x1, x2) { return [ x0 - 2*x1 + x2 , -2*x0 + 2*x1 , x0 ]; }
		function evaluateQuadratic(t, a, b, c) { return a*t*t + b*t + c; }
		
		var ycoeffs = quadraticCoeffs(quadratic[0].y - y, quadratic[1].y - y, quadratic[2].y - y);
		var roots = quadraticRoots(ycoeffs[0], ycoeffs[1], ycoeffs[2]);
		var inInterval = roots.filter(t => (0.0 <= t && t < 1.0)); // [0,1) - empirically determined by trying to draw fonts without artifacts
		var xcoeffs = quadraticCoeffs(quadratic[0].x, quadratic[1].x, quadratic[2].x);
		var intersections = inInterval.map(t => evaluateQuadratic(t, xcoeffs[0], xcoeffs[1], xcoeffs[2]));
		
		return intersections;
	}
	function CubicHoriIntersections(cubic, y) {
		// magic numbers.  not the best.
		//return BezierLineIntersections(cubic, [{x:-10000,y:y},{x:+10000,y:y}]).map(function(p) { return p.x; });
		
		function bezierCoeffs(a, b, c, d) { return [ -a+3*b+-3*c+d , 3*a-6*b+3*c , -3*a+3*b , a ]; }
		function evaluateBezier(t, a, b, c, d) { return a*t*t*t + b*t*t + c*t + d; }
		
		var ycoeffs = bezierCoeffs(cubic[0].y - y, cubic[1].y - y, cubic[2].y - y, cubic[3].y - y);
		var roots = cubicRoots(ycoeffs[0], ycoeffs[1], ycoeffs[2], ycoeffs[3]);
		var inInterval = roots.filter(t => (0.0 <= t && t < 1.0));
		var xcoeffs = bezierCoeffs(cubic[0].x, cubic[1].x, cubic[2].x, cubic[3].x);
		var intersections = inInterval.map(t => evaluateBezier(t, xcoeffs[0], xcoeffs[1], xcoeffs[2], xcoeffs[3]));
		
		return intersections;
	}
	function BezierLineIntersections(bezier, line) {
		
		// what work do these coefficients do?  the point is to transform the line segment to be the horizontal zero, and then find the zeroes of the bezier
		var A = line[1].y - line[0].y; // A = y2-y1
		var B = line[0].x - line[1].x; // B = x1-x2
		var C = line[0].x*(line[0].y-line[1].y) + line[0].y*(line[1].x-line[0].x); // C = x1*(y1-y2)+y1*(x2-x1)
		
		// we set the first point of the line to (0,0) and the last point to (1,0)
		// that's why we only take the roots in [0,1]
		
		//console.log('A: ' + A);
		//console.log('B: ' + B);
		//console.log('C: ' + C);
		
		function bezierCoeffs(a, b, c, d) { return [ -a+3*b+-3*c+d , 3*a-6*b+3*c , -3*a+3*b , a ]; }
		var bx = bezierCoeffs(bezier[0].x, bezier[1].x, bezier[2].x, bezier[3].x);
		var by = bezierCoeffs(bezier[0].y, bezier[1].y, bezier[2].y, bezier[3].y);
		
		var a = A*bx[0]+B*by[0];
		var b = A*bx[1]+B*by[1];
		var c = A*bx[2]+B*by[2];
		var d = A*bx[3]+B*by[3] + C;
		
		//console.log('a: ' + a);
		//console.log('b: ' + b);
		//console.log('c: ' + c);
		//console.log('d: ' + d);
		
		var roots = cubicRoots(a, b, c, d);
		
		var inUnit = roots.filter(t => (0.0 <= t && t <= 1.0));
		
		var intersections = [];
		
		for (var i = 0; i < inUnit.length; i++)
		{
			var t = inUnit[i];
			var x = bx[0]*t*t*t + bx[1]*t*t + bx[2]*t + bx[3];
			//var y = by[0]*t*t*t + by[1]*t*t + by[2]*t + by[3];
			intersections.push(x);
		}
		
		return intersections;
	}
	
	function linearRoots(a, b) {
		
		// a*x + b = 0
		
		if (a == 0)
		{
			if (b == 0)
			{
				// infinite roots
				return [-Infinity, +Infinity];
			}
			else
			{
				// no roots
				return [];
			}
		}
		else
		{
			return [ -b/a ];
		}
	}
	function quadraticRoots(a, b, c) {
		if (a == 0) { return linearRoots(b, c); }
		var discriminant = b*b - 4*a*c;
		if (discriminant < 0) { return []; }
		if (discriminant == 0) { return [ b / (2*a) ]; }
		var r0 = (-b + Math.sqrt(discriminant)) / (2*a);
		var r1 = (-b - Math.sqrt(discriminant)) / (2*a);
		return [r0, r1];
	}
	function cubicRoots(a, b, c, d) {
		
		// based on http://mysite.verizon.net/res148h4j/javascript/script_exact_cubic.html#the%20source%20code
		// a*x*x*x + b*x*x + c*x + d = 0
		
		if (a == 0) { return quadraticRoots(b, c, d); }
		
		var A = b / a;
		var B = c / a;
		var C = d / a;
		
		var Q = (3*B - Math.pow(A, 2))/9;
		var R = (9*A*B - 27*C - 2*Math.pow(A, 3))/54;
		var D = Math.pow(Q, 3) + Math.pow(R, 2); // polynomial discriminant
		
		//console.log('Q: ' + Q);
		//console.log('R: ' + R);
		//console.log('D: ' + D);
		
		var t = [];
		
		if (D >= 0) // complex or duplicate roots
		{
			function sgn(x) { if (x < 0.0) { return -1; } else { return 1; } }
			var S = sgn(R + Math.sqrt(D))*Math.pow(Math.abs(R + Math.sqrt(D)),(1/3));
			var T = sgn(R - Math.sqrt(D))*Math.pow(Math.abs(R - Math.sqrt(D)),(1/3));
			
			t.push(-A/3 + (S + T)); // real root
			
			var Im = Math.abs(Math.sqrt(3)*(S - T)/2); // complex part of root pair
			
			//console.log('S: ' + Q);
			//console.log('T: ' + R);
			//console.log('Im: ' + Im);
			
			if (Im == 0)
			{
				t.push(-A/3 - (S + T)/2); // real part of complex root
				t.push(-A/3 - (S + T)/2); // real part of complex root
			}
		}
		else // distinct real roots
		{
			var th = Math.acos(R/Math.sqrt(-Math.pow(Q, 3)));
			
			//console.log('th: ' + th);
			
			t.push(2*Math.sqrt(-Q)*Math.cos(th/3) - A/3);
			t.push(2*Math.sqrt(-Q)*Math.cos((th + 2*Math.PI)/3) - A/3);
			t.push(2*Math.sqrt(-Q)*Math.cos((th + 4*Math.PI)/3) - A/3);
		}
		
		//console.log(t);
		
		return t;
	}
	
	function ComputeBezier(t, a, b, c, d) { return (-a+3*b+-3*c+d)*t*t*t + (3*a-6*b+3*c)*t*t + (-3*a+3*b)*t + a; }
	
	function LineLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
		
		var nx = (x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4);
		var ny = (x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4);
		var d = (x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
		
		if (d == 0)
		{
			return false
		}
		else
		{
			return { x : nx/d , y : ny/d };
		}
	}
	
	var Conversion = {};
	Conversion.ReadUi = function(b, k, n, little) {
		
		if (b.readUIntLE)
		{
			var x = 0;
			
			if (little)
			{
				var x = b.readUIntLE(k.k, n);
			}
			else
			{
				var x = b.readUIntBE(k.k, n);
			}
			
			k.k += n;
			
			return x;
		}
		else
		{
			var x = 0;
			var mult = 1;
			
			if (little)
			{
				for (var i = 0; i < n; i++)
				{
					x += mult * b[k.k++];
					mult *= 256;
				}
			}
			else
			{
				for (var i = 0; i < n - 1; i++)
				{
					mult *= 256;
				}
			
				for (var i = 0; i < n; i++)
				{
					x += mult * b[k.k++];
					mult /= 256;
				}
			}
			
			return x;
		}
	};
	
	
	Bitmap.PutImageData = function(ctx, bmp) {
		
		var imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
		
		for (var y = 0; y < imageData.height; y++)
		{
			for (var x = 0; x < imageData.width; x++)
			{
				var color = bmp.getPixel(x, y);
				
				var index = (y * imageData.width + x) * 4;
				imageData.data[index + 0] = color.r;
				imageData.data[index + 1] = color.g;
				imageData.data[index + 2] = color.b;
				imageData.data[index + 3] = 255;
			}
		}
		
		ctx.putImageData(imageData, 0, 0);
	};
	
	function Base64StringToUint8Array(str) {
		
		function b64ToUint6(n) { return n>64&&n<91?n-65:n>96&&n<123?n-71:n>47&&n<58?n+4:n===43?62:n===47?63:0;}
		
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
	
	return Canvas;
})();

if (typeof window !== 'undefined') {
	if (typeof Griddl === 'undefined') { var Griddl = {}; }
	Griddl.Canvas = TheCanvas;
}
else {
	exports.Canvas = TheCanvas;
}

// Alt+2

