
var Hyperdeck: any;
var opentype: any;
var $: any;
interface Window { MathJax: any; }
var MathJax: any;

interface Dict<T> { [index: string]: T; }

interface Jax {
	section?: Section;
	latex?: string;
	x?: number;
	y?: number;
	style?: Style;
	d?: string;
	inputDivId?: string;
	outputDivId?: string;
}

class Splitter {
	
	ctx: CanvasRenderingContext2D;
	svg: SVG;
	pdf: PDF;
	bmp: Bitmap;
	
	contructor() {
		
	}
	
	fillTextNative(text: string, x: number, y: number): void {
		
		if (this.ctx)
		{
			this.ctx.textAlign = this.textAlign;
			this.ctx.textBaseline = this.textBaseline;
			this.ctx.fillStyle = this.fillStyle;
			
			// alternate approach, where we scale the font using a transform rather than canvas's hard to predict font parser
			this.ctx.font = '12pt ' + this.fontFamily;
			this.ctx.save();
			this.ctx.translate(x, y);
			this.ctx.scale(this.fontSize / 12, this.fontSize / 12);
			this.ctx.fillText(text, 0, 0);
			this.ctx.restore();
			
			//this.ctx.font = this.fontSize.toString() + this.fontSizeUnits + ' ' + this.fontFamily;
			//this.ctx.fillText(text, x, y);
		}
	}
	
	
	beginPath(): void {
		
	}
	closePath(): void {
		
	}
	moveTo(x: number, y: number): void {
		
	}
	lineTo(x: number, y: number): void {
		
	}
	quadraticCurveTo(x1: number, y1: number, x: number, y: number): void {
		
	}
	bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void {
		
	}
	arcTo(x1: number, y1: number, x2: number, y2: number, r: number): void {
		
	}
	
	arc(cx: number, cy: number, r: number, startAngle: number, endAngle: number, bAntiClockwise: boolean): void {
		if (this.bmp) { this.bmp.arc(cx, cy, r, startAngle, endAngle, bAntiClockwise); }
		if (this.ctx) { this.ctx.arc(cx, cy, r, startAngle, endAngle, bAntiClockwise); }
		if (this.pdf) { this.pdf.arc(cx, cy, r, startAngle, endAngle, bAntiClockwise); }
	}
	rect(left: number, top: number, width: number, height: number): void {
		if (this.bmp) { this.bmp.rect(left, top, width, height); }
		if (this.ctx) { this.ctx.rect(left, top, width, height); }
		if (this.pdf) { this.pdf.rect(left, top, width, height); }
	}
	
	fill(): void {
		
	}
	stroke(): void {
		
	}
	clip(path?: Path2D): void {
		
	}
	
	save(): void {
		
	}
	restore(): void {
		
	}
	scale(x: number, y: number): void {
		
	}
	rotate(angle: number): void {
		// ctx - clockwise, radians
	}
	rotateCounterClockwise(angle: number): void {
		// not part of the canvas spec
	}
	rotateClockwise(angle: number): void {
		// not part of the canvas spec
	}
	translate(x: number, y: number): void {
		
	}
	transform(sx: number, kx: number, ky: number, sy: number, dx: number, dy: number): void {
		
		// note that the order of arguments for CanvasRenderingContext2D is different than the order for SVG and PDF
		// namely, Canvas does kx, ky and SVG/PDF do ky, kx
		// wait, are we sure about that?  maybe we should double check what the canvas transform expects
		
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
		
		if (this.ctx) { this.ctx.transform(sx, kx, ky, sy, dx, dy); }
	}
	setTransform(sx: number, kx: number, ky: number, sy: number, dx: number, dy: number): void {
		
	}
	resetTransform(): void {
		// not part of the canvas spec
	}
	
	drawImage(image: any, dx: number, dy: number, dw: number, dh: number, sx: number, sy: number, sw: number, sh: number): void {
		if (this.ctx) { this.ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh); }
		
		if (this.pdf)
		{
			// image is of type Bitmap, HTMLImageElement, HTMLCanvasElement, HTMLVideoElement
			// g.drawImage(image, dx, dy) - natural width and height are used
			// g.drawImage(image, dx, dy, dw, dh) - image is scaled to fit specified width and height
			// g.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) - all parameters specified, image scaled as needed (note that src params come first here)
			if (dw === undefined) { dw = image.width; }
			if (dh === undefined) { dh = image.height; }
			if (sx === undefined) { sx = 0; }
			if (sy === undefined) { sy = 0; }
			if (sw === undefined) { sw = image.width; }
			if (sh === undefined) { sh = image.height; }
			
			if (image.constructor.name == 'Bitmap')
			{
				// build pixelArray: Uint8ClampedArray
				//var color = (image as Bitmap).getPixel(j, i);
				//var R = color.r;
				//var G = color.g;
				//var B = color.b;
			}
			else
			{
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
				
				this.pdf.drawImageImpl(pixelData, imageData.width, imageData.height, dx, dy, dw, dh);
			}
		}
	}
	
	fillRect(left: number, top: number, width: number, height: number): void { }
	strokeRect(left: number, top: number, width: number, height: number): void { }
	clearRect(left: number, top: number, width: number, height: number): void { }
	
	drawRect(left: number, top: number, width: number, height: number, doFill: boolean, doStroke: boolean): void { }
	drawCircle(cx: number, cy: number, r: number, doFill: boolean, doStroke: boolean): void {
		
		if (this.ctx)
		{
			this.ctx.beginPath();
			this.ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
			if (doFill) { this.ctx.fill(); }
			if (doStroke) { this.ctx.stroke(); }
		}
	}
	drawPath(path: string, doFill: boolean, doStroke: boolean): void { }
}

class Canvas {
	
	// this is probably obsolete?
	// when the export button is clicked, it:
	// 1. sets Canvas.drawPdf to true
	// 2. invokes the first js component
	// 3. reads griddlCanvas (which the user code must set)
	static griddlCanvas: any = null; // in ExportToPdf we call MakePdf(griddlCanvas) - the Canvas constructor sets griddlCanvas whenever it is invoked
	static savedDrawPdf: boolean = false; // get/set by pausePdfOutput and resumePdfOutput
	static drawPdf: boolean = false; // the function invoked by the export button sets this to true, runs the user code, and then sets it to false again
	static fontDict: Dict<Font> = {}; // "serif" => SourceSerifPro-Regular.otf, "sans-serif" => SourceSansPro-Regular.otf
	static fontNameToUint8Array: Dict<Uint8Array> = {};
	static opentype: any = null; // we need to parse the default fonts to intialize the fontDict
	static defaultFonts: any = null;
	
	sections: Section[] = [];
	currentSection: Section;
	
	// FinalizeGraphics() sets this and ExportLocalToPdf() reads it
	pdfContextArray: any;
	
	jax: Jax[] = [];
	
	// this is so we can have a global styles object used across different draw functions without having to have a fixed object name 'styles' or having to pass the object around
	styles: Style = null;
	styleStack: Style[] = []; // for saving and restoring the below parameters
	
	savedCanvas: HTMLCanvasElement = null;
	savedCanvasContext: CanvasRenderingContext2D = null;
	
	constructor(params: any) {
		
		// this is here so that user code does not need to do it - the function invoked by the export button needs access to the canvas
		Hyperdeck.g = this; // this is a hook for node, used in RenderSvg - should it be Hyperdeck.Canvas.g instead?
		
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
		this.type = type; // 'canvas' or 'svg' - NewSection() uses this
		
		// FinalizeGraphics() sets this and ExportLocalToPdf() reads it
		this.pdfContextArray = null;
		
		this.jax = [];
		//if (typeof window != 'undefined') { $('.mathjaxInput').remove(); }
		if (typeof window != 'undefined') { Array.from(document.querySelectorAll('.mathjaxInput')).forEach(function(elt) { elt.remove(); }); }
		
		this.matrix = new Matrix();
		
		// this is so we can have a global styles object used across different draw functions without having to have a fixed object name 'styles' or having to pass the object around
		this.styles = null;
		
		// for saving and restoring the below parameters
		this.styleStack = [];
		
		if (typeof window != 'undefined')
		{
			// this is used for conversion of 'red' -> 'rgb(255,0,0)' and text measurement and access of pixel data of image components
			this.savedCanvas = document.createElement('canvas');
			this.savedCanvasContext = this.savedCanvas.getContext('2d');
			this.savedCanvasContext.font = this.font;
		}
	}
	
	SetActiveSection(nameOrIndexOrSection: any): void {
	
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
	}
	NewSection(width: number, height: number, nPages: number): Section {
		
		var section = new Section(this, width, height, nPages);
		
		this.sections.push(section);
		//if (params.name) { this.sections[params.name] = section; }
		
		this.SetActiveSection(section);
		
		return section;
	}
	
	// DumpSVG -> GenerateDocument
	// FinalizeGraphics -> GenerateDocument
	GenerateDocument(): void {
		
		var g = this;
		
		var callback = function() {
			
			var glyphs: Dict<string> = {};
			
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
			if (window.MathJax) { window.MathJax.Hub.Queue(callback); }
			
			// we have to make this part of the callback, so that it executes after all mathjax have been rendered
			if (window.MathJax) { window.MathJax.Hub.Queue(RenderSvg); } else { RenderSvg(); }
		}
		else
		{
			RenderSvg();
		}
	}
	
	// there are four systems for drawing text:
	// 1. the native CanvasRenderingContext2D/PDF systems (fillTextNative)
	// 2. using font coordinates dumped into fonts.js (fillTextSvgFont)
	// 3. using truetype.js, which reads from an uploaded font file (fillTextTrueType and DrawGlyph)
	// 4. using opentype.js
	// 5. using PDF - embedding the font within the PDF file and using PDF text drawing commands
	
	// the fillText toggle function must sync with measureText in order for typesetting and other stuff to work properly
	fillText(text: string, x: number, y: number): void { this.fillTextTrueOrOpenType(text, x, y); }
	fillTextTrueOrOpenType(text: string, x: number, y: number): void {
		
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
	}
	fillTextTrueType(text: string, x: number, y: number): void {
		
		this.beginPath();
		
		var fontScale = this.fontSizePt / 72; // magic number - not correct - right now this is being used as font scale -> pixel scale conversion via multiplication
		
		var characterWidth = 10; // i just put this in, it should be defined somewhere else - is it?
		
		for (var i = 0; i < text.length; i++)
		{
			var code = text.charCodeAt(i);
			
			var fn = function(point) {
				var p: Point = {};
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
	}
	fillTextOpenType(text: string, x: number, y: number): void {
		
		// x and y are in cubits at this point
		
		var dxCudyCu = this.alignText(text); // what units are dx and dy in?
		var dxCu = dxCudyCu.dx;
		var dyCu = dxCudyCu.dy;
		
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
	}
	
	measureText(str: string): TextMetrics { return this.measureTextOpenType(str); }
	measureTextTrueType(str: string): TextMetrics {
		
		var sum = 0;
		
		for (var i = 0; i < str.length; i++)
		{
			var code = str.charCodeAt(i) - 29;
			var wd = this.fontObject.getGlyphWidth(code);
			sum += wd;
		}
		
		var width = sum * this.fontSizePt / 72;  // magic number - not correct - right now this is being used as font scale -> pixel scale conversion via multiplication
		
		return { width : width };
	}
	measureTextOpenType(str: string): TextMetrics {
		
		// coordinates in the font object are converted to path coordinate by multiplying by: 1 / font.unitsPerEm * fontSize
		// basically fontSize specifies the em size
		// so if we specify a fontSize of 1, what we're doing is asking for coordinates in ems
		// we then multiply that by the fontSize in pixels, points, or cubits to get the size in units we need
		var x = 0;
		var y = 0;
		var fontSize = 1;
		var path = (this.fontObject as OpenTypeFont).getPath(str, x, y, fontSize);
		
		// now there's a Path.getBoundingBox() function so we can probably use that instead of doing it ourselves
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
	}
	
	strokeText(text: string, x: number, y: number): void { this.strokeTextOpenType(text, x, y); }
	strokeTextOpenType(text: string, x: number, y: number): void {
		
		var dxCudyCu = this.alignText(text);
		var dxCu = dxCudyCu.dx;
		var dyCu = dxCudyCu.dy;
		
		// in order to stroke text, we get the Path from the Font, change some fields on the Path, and then call Path.draw(ctx)
		// this might also have to be used for fillTextOpenType if we want to draw in a color other than black
		// note that we pass the fontObject coordinates in cubits, because the fontObject will call ctx, which is already appropriately scaled
		var path = this.fontObject.getPath(this, text, x + dxCu, y + dyCu, this.fontSizeCu, {});
		path.fill = null;
		path.stroke = this.strokeStyle;
		path.strokeWidth = this.lineWidth;
		path.draw(this);
	}
	
	fillTextDebug(text: string, x: number, y: number): void {
		console.log('fill' + '\t"' + text + '"\t' + x + '\t' + y);
	}
	measureTextDebug(str: string): TextMetrics {
		//console.log('measure' + '\t"' + str + '"\t' + DebugStyle(this));
		return { width : str.length * 6 };
	}
	
	DrawDots(path: number[][], dx: number, dy: number, multiplier: number): void {
		
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
					//this.DrawText2(Math.floor(tx, 1).toString() + "," + Math.floor(ty, 1).toString(), x - 3, y);
				}
				else
				{
					this.textAlign = "left";
					//this.DrawText2(Math.floor(tx, 1).toString() + "," + Math.floor(ty, 1).toString(), x + 3, y);
				}
			}
		}
		
		this.fillStyle = oldstyle;
	}
	DrawGlyph(font: any, index: number, fn: any): any {
		
		// return type is boolean | number
		
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
	}
	
	isPointInPath(path: Path2D, x: number, y: number): boolean {
		// the path argument is optional - again, an annoying situation where optional arguments are put first
		
		if (this.drawCanvas)
		{
			//return this.g.isPointInPath(path, x, y); // typescript says that ctx already has isPointInPath: boolean?
		}
		
		throw new Error();
	}
	isPointInStroke(path: Path2D, x: number, y: number): boolean {
		// the path argument is optional
		
		if (this.drawCanvas)
		{
			return this.g.isPointInStroke(path, x, y);
		}
	}
	
	// this only makes sense for ctx and bmp underlying
	getImageData(left: number, top: number, width: number, height: number): ImageData { return this.g.getImageData(left, top, width, height); }
	putImageData(img: ImageData, left: number, top: number): void { this.g.putImageData(img, left, top); }
	createImageData(width: number, height: number): any {
		
		// if width is an ImageData object, pull the width/height from that object
		if (this.ctx) { return this.ctx.createImageData(width, height); }
	}
	
	pausePdfOutput(): void {
		Canvas.savedDrawPdf = Canvas.drawPdf;
		Canvas.drawPdf = false;
	}
	resumePdfOutput(): void {
		Canvas.drawPdf = Canvas.savedDrawPdf;
	}
	
	createLinearGradient(x1: number, y1: number, x2: number, y2: number): any {
		
		if (this.drawCanvas)
		{
			var gradient = this.g.createLinearGradient(x1, y1, x2, y2);
			return gradient; // we can't do this - we have to return one of our Gradient objects, which will then manage the passthrough
		}
		
		// how do we manage the passthrough when we create a new object?
		
		//var gradient = new Gradient(x1, y1, x2, y2);
		
		
		
		//return gradient;
	}
	createRadialGradient(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): any {
		
		if (this.drawCanvas)
		{
			var gradient = this.g.createRadialGradient(x1, y1, r1, x2, y2, r2);
			return gradient;
		}
		
		
		//var gradient = new Gradient(x1, y1, x2, y2);
		
		
		
		//return gradient;
	}
	createPattern(source: any, repeat: any): any {
		
		if (this.drawCanvas)
		{
			var pattern = this.g.createPattern(source, repeat);
			return pattern;
		}
		
	}
	
	getLineDash(): number[] {
		return this._lineDashArray;
		
	}
	setLineDash(value: number[]): void {
		this._lineDashArray = value;
		if (this.g) { this.g.setLineDash(value); }
		if (Canvas.drawPdf) { PushCommand(this, '[ ' + this._lineDashArray.join(' ') + ' ] ' + this._lineDashOffset.toString() + ' d'); }
	}
	
	// these draw sharp lines on the canvas (while not affecting the PDF render)
	// Math.floor(x, 1)+0.5
	// of course, none of these do a bit of good if the canvas is scaled, so these only work if we're rolling our own transformations
	drawSharpHorizontal(y: number, x1: number, x2: number): void {
		
		if (this.drawCanvas)
		{
			var ty1 = Math.floor(y)+0.5;
			var ty2 = Math.floor(y)+0.5;
			var tx1 = Math.floor(x1);
			var tx2 = Math.floor(x2);
			
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
	}
	drawSharpVertical(x: number, y1: number, y2: number): void {
		
		if (this.drawCanvas)
		{
			var ty1 = Math.floor(y1);
			var ty2 = Math.floor(y2);
			var tx1 = Math.floor(x)+0.5;
			var tx2 = Math.floor(x)+0.5;
			
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
	}
	drawSharpRect(left: number, top: number, width: number, height: number, doFill: boolean, doStroke: boolean): void {
		
		if (this.drawCanvas)
		{
			var lf = Math.floor(left);
			var tp = Math.floor(top);
			var wd = Math.floor(width);
			var hg = Math.floor(height);
			
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
	}
	
	// general MathJax notes:
	// http://cdn.mathjax.org/mathjax/latest/test/sample-signals.html - this is an interesting page that shows all the signals that get sent
	// calls to drawMath don't immediately draw onto the canvas - the typesetting is put into the mathjax queue
	// actual drawing to the canvas happens in GenerateDocument(), after all callbacks have returned
	// jax = { section : Section , latex : string , x : float , y : float , d : string , style : Style }
	drawMath(latex: any, x: number, y: number): void {
		
		// latex is a Kronecker object or a string
		
		if (this.useOwnTransform)
		{
			var p = Matrix.Apply(this.matrix, {x:x,y:y});
			x = p.x;
			y = p.y;
		}
		
		if (typeof(latex) == 'object') { latex = '$$' + latex.ToLatex() + '$$'; }
		
		var jax: Jax = {};
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
	}
}

class Section {
	
	parent: Canvas;
	
	// replace with a Hyperdeck.Widgets.Box? (which raises the question of whether Box should be in Hyperdeck.Widgets)
	width: number;
	height: number;
	left: number;
	right: number;
	cx: number;
	wr: number;
	top: number;
	bottom: number;
	cy: number;
	hr: number;
	
	nPages: number;
	
	// so for now, this refers to page size?  we need to distinguish between page dimensions and section dimensions
	wdCu: number;
	hgCu: number;
	pxWidth: number;
	pxHeight: number;
	ptWidth: number;
	ptHeight: number;
	
	div: HTMLDivElement;
	
	canvasContext: CanvasRenderingContext2D;
	bmp: Bitmap;
	
	eltStrings: string[][] = [];
	
	pdfCommands: string[][] = [];
	
	constructor(parent: Canvas, width: number, height: number, nPages: number) {
		
		this.parent = parent;
		
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
		
		this.wdCu = width;
		this.hgCu = height;
		this.pxWidth = width * parent.pixelsPerCubit;
		this.pxHeight = height * parent.pixelsPerCubit;
		this.ptWidth = width * parent.pointsPerCubit;
		this.ptHeight = height * parent.pointsPerCubit;
		
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
			div.style.width = this.pxWidth.toString();
			div.style.height = (this.pxHeight * this.nPages).toString();
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
	SetDimensions(nPages: number, wd: number, hg: number): void {
		
		// new page sizes should be able to be set automatically when graphical elements are drawn out of bounds
		
		var section = this;
		
		section.nPages = nPages;
		section.wdCu = wd;
		section.hgCu = hg;
		section.pxWidth = wd * section.parent.pixelsPerCubit;
		section.pxHeight = hg * section.parent.pixelsPerCubit;
		section.ptWidth = wd * section.parent.pointsPerCubit;
		section.ptHeight = hg * section.parent.pointsPerCubit;
		
		if (section.parent.type == 'canvas')
		{
			if (typeof window != 'undefined')
			{
				var canvas = section.canvasContext.canvas;
				canvas.width = section.pxWidth;
				canvas.height = section.pxHeight * nPages;
				section.canvasContext = canvas.getContext('2d');
				section.canvasContext.scale(section.parent.pixelsPerCubit, section.parent.pixelsPerCubit);
			}
		}
		
		section.pdfCommands = [];
		
		for (var i = 0; i < nPages; i++)
		{
			// this needs to be added to each newly-created sublist of pdfCommands
			// the other option is to calculate page.ptHeight - y for everything
			var pageCommands = [];
			pageCommands.push('1 0 0 1 0 ' + section.ptHeight.toString() + ' cm'); // the initial PDF transform
			pageCommands.push(section.parent.pointsPerCubit.toString() + ' 0 0 -' + section.parent.pointsPerCubit.toString() + ' 0 0 cm');
			section.pdfCommands.push(pageCommands);
		}
	}
}

function AlignText(style: any, width: number, height: number): { dx: number, dy: number } {
	
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

class Style {
	
	fontSize: number;
	fontFamily: string;
	fontSizeUnits: CSSUnit;
	lineWidth: number
	strokeStyle: string;
	fillStyle: string;
	font: string;
	textAlign: TextAlign;
	textBaseline: TextBaseline;
	transform: Matrix;
	
	color: string;
	fill: string;
	stroke: string;
	
	hAlign: TextAlign;
	vAlign: TextBaseline;
	
	constructor() {
		
	}
	
	Save(): void {
		var saved: Style = {
			fontFamily: this.fontFamily,
			fontSize: this.fontSize,
			fontSizeUnits: this.fontSizeUnits,
			textAlign: this.textAlign,
			textBaseline: this.textBaseline,
			fillStyle: this.fillStyle,
			strokeStyle: this.strokeStyle,
			lineWidth: this.lineWidth
		};
		this.styleStack.push(saved);
	}
	Restore(): void {
		var saved = this.styleStack.pop();
		this.fontFamily = saved.fontFamily;
		this.fontSize = saved.fontSize;
		this.fontSizeUnits = saved.fontSizeUnits;
		this.textAlign = saved.textAlign;
		this.textBaseline = saved.textBaseline;
		this.fillStyle = saved.fillStyle;
		this.strokeStyle = saved.strokeStyle;
		this.lineWidth = saved.lineWidth;
	}
	SetStyle(style: StyleOrIndex): void {
		
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
		
		var hAlign: TextAlign = 'left';
		var vAlign: TextBaseline = 'bottom';
		if (style.hAlign) { hAlign = style.hAlign; }
		if (style.vAlign) { vAlign = style.vAlign; }
		this.textAlign = hAlign;
		this.textBaseline = vAlign;
	}
	SaveStyle(): Style {
		
		return {
			lineWidth: this.lineWidth,
			strokeStyle: this.strokeStyle,
			fillStyle: this.fillStyle,
			font: this.font,
			textAlign: this.textAlign,
			textBaseline: this.textBaseline,
			transform: this.matrix
		};
	}
}

interface Point {
	x?: number;
	y?: number;
	onCurve?: boolean;
}

interface Path2D { }
interface CanvasRenderingContext2D {
	//isPointInPath: (path: Path2D, x: number, y: number) => boolean;
	isPointInStroke: (path: Path2D, x: number, y: number) => boolean;
}
interface TextMetrics { height?: number; }
interface ColorStop { d: number; color: Color; }
class Gradient {
	
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	colorStops: ColorStop[] = [];
	
	constructor(x1, y1, x2, y2) { this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2; }
	addColorStop = function(d: number, color: Color): void { this.colorStops.push({d:d,color:color}); }
}
class Pattern {
	
	source: any;
	repeat: any;
	
	constructor(source: any, repeat: any) { this.source = source; this.repeat = repeat; }
}

class Transform {
	
	// Transform is a wrapper around calls to an underlying, sort of like middleware
	underlying: any;
	
	debugTransform: boolean = true; // this calculates the transform but does not use it - the commands are passed through to the <canvas>
	useOwnTransform: boolean = false;
	matrix: Matrix;
	matrixStack: Matrix[] = [];
	loggerStack: string[] = []; // 'scale(10)', 'rotate(90)', 'translate(10, 20)' - convert angles to degrees for this
	savedMatrixStack: Matrix[] = [];
	
	clearRect(left: number, top: number, width: number, height: number): void {
		
		//var savedFillStyle = this.fillStyle;
		//this.fillStyle = 'rgb(255,255,255)';
		//this.fillRect(left, top, width, height);
		//this.fillStyle = savedFillStyle;
	}
	drawRect(left: number, top: number, width: number, height: number, doFill: boolean, doStroke: boolean): void {
		
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
	}
	
	moveTo(x: number, y: number): void {
		
		var p = Matrix.Apply(this.matrix, {x:x,y:y});
		x = p.x;
		y = p.y;
	}
	lineTo(x: number, y: number): void {
		
		var p = Matrix.Apply(this.matrix, {x:x,y:y});
		x = p.x;
		y = p.y;
	}
	quadraticCurveTo(x1: number, y1: number, x: number, y: number): void {
		
		var p1 = Matrix.Apply(this.matrix, {x:x1,y:y1});
		var p = Matrix.Apply(this.matrix, {x:x,y:y});
		x1 = p1.x;
		y1 = p1.y;
		x = p.x;
		y = p.y;
	}
	bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void {
		
		var p1 = Matrix.Apply(this.matrix, {x:x1,y:y1});
		var p2 = Matrix.Apply(this.matrix, {x:x2,y:y2});
		var p = Matrix.Apply(this.matrix, {x:x,y:y});
		x1 = p1.x;
		y1 = p1.y;
		x2 = p2.x;
		y2 = p2.y;
		x = p.x;
		y = p.y;
	}
	arcTo(x1: number, y1: number, x2: number, y2: number, r: number): void {
		
		var p1 = Matrix.Apply(this.matrix, {x:x1,y:y1});
		var p2 = Matrix.Apply(this.matrix, {x:x2,y:y2});
		x1 = p1.x;
		y1 = p1.y;
		x2 = p2.x;
		y2 = p2.y;
	}
	arc(cx: number, cy: number, r: number, startAngle: number, endAngle: number, bAntiClockwise: boolean): void {
		
		var p = Matrix.Apply(this.matrix, {x:cx,y:cy});
		cx = p.x;
		cy = p.y;
	}
	
	rect(left: number, top: number, width: number, height: number): void {
		
		var p1 = Matrix.Apply(this.matrix, {x:left,y:top});
		var p2 = Matrix.Apply(this.matrix, {x:left+width,y:top+height});
	}
	
	save(): void {
		this.savedMatrixStack.push(this.matrix);
		if (this.useOwnTransform) { return; }
	}
	restore(): void {
		this.matrix = this.savedMatrixStack.pop();
		this.matrixStack = []; // restoration obliterates the logger and saved matrix chain
		this.loggerStack = [];
		if (this.useOwnTransform) { return; }
	}
	scale(x: number, y: number): void {
		var m = Matrix.Scale(x, y);
		this.matrix = Matrix.Multiply(m, this.matrix);
		this.matrixStack.push(m);
		this.loggerStack.push('scale(' + x.toString() + ' ' + y.toString() + ')');
		if (this.useOwnTransform) { return; }
	}
	rotateCounterClockwise(angle: number): void {
		var m = Matrix.Rotate(angle);
		this.matrix = Matrix.Multiply(m, this.matrix);
		this.matrixStack.push(m);
		this.loggerStack.push('rotate(' + (angle / (Math.PI * 2) * 360).toString() + ')');
		if (this.useOwnTransform) { return; }
	}
	rotateClockwise(angle: number): void {
		var m = Matrix.Rotate(-angle);
		this.matrix = Matrix.Multiply(m, this.matrix);
		this.matrixStack.push(m);
		this.loggerStack.push('rotate(' + (angle / (Math.PI * 2) * 360).toString() + ')');
		if (this.useOwnTransform) { return; }
	}
	translate(x: number, y: number): void {
		var m = Matrix.Translate(x, y);
		this.matrix = Matrix.Multiply(m, this.matrix);
		this.matrixStack.push(m);
		this.loggerStack.push('translate(' + x.toString() + ',' + y.toString() + ')');
		if (this.useOwnTransform) { return; }
	}
	transform(sx: number, kx: number, ky: number, sy: number, dx: number, dy: number): void {
		var m = new Matrix();
		m.m = [[sx, kx, dx],[sy, ky, dy],[0,0,1]];
		this.matrix = Matrix.Multiply(m, this.matrix);
		this.matrixStack.push(m);
		this.loggerStack.push('matrix(' + sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ')');
		if (this.useOwnTransform) { return; }
	}
	setTransform(sx: number, kx: number, ky: number, sy: number, dx: number, dy: number): void {
		var m = new Matrix();
		m.m = [[sx, kx, dx],[sy, ky, dy],[0,0,1]];
		this.matrix = Matrix.Multiply(m, this.matrix);
		this.matrixStack.push(m);
		this.loggerStack = [ 'matrix(' + sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ')' ];
		if (this.useOwnTransform) { return; }
	}
	resetTransform(): void {
		this.matrix = new Matrix();
		this.matrixStack = [];
		this.loggerStack = [];
		if (this.useOwnTransform) { return; }
	}
}
class Matrix {
	
	rows: number = 3;
	cols: number = 3;
	m: any = [[1,0,0],[0,1,0],[0,0,1]];
	
	constructor() { }
	static Multiply(a: Matrix, b: Matrix): Matrix {
		
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
	}
	static Translate(x: number, y: number): Matrix {
		var m = new Matrix();
		m.m = [[1,0,x],[0,1,y],[0,0,1]];
		return m;
	}
	static Scale(x: number, y: number): Matrix {
		var m = new Matrix();
		if (typeof(y) === 'undefined') { y = x; }
		m.m = [[x,0,0],[0,y,0],[0,0,1]];
		return m;
	}
	static Rotate(angleRad: number): Matrix {
		var m = new Matrix();
		m.m = [[Math.cos(angleRad),-Math.sin(angleRad),0],[Math.sin(angleRad),Math.cos(angleRad),0],[0,0,1]];
		return m
	}
	static Apply(m: Matrix, p: Point): Point {
		
		return {
			x: m.m[0][0] * p.x + m.m[0][1] * p.y + m.m[0][2],
			y: m.m[1][0] * p.x + m.m[1][1] * p.y + m.m[1][2]
		};
	}
}

// convert this to the Transform class?
function ParseSvgTransform(str: string): Transform2[] {
	
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
}
interface Transform2 {
	
	type: TransformType;
	
	// type == 'scale' or 'translate'
	x?: number;
	y?: number;
	
	// type == 'transform'
	sx?: number;
	sy?: number;
	kx?: number;
	ky?: number;
	dx?: number;
	dy?: number;
}
type TransformType = 'translate' | 'scale' | 'rotate' | 'transform';

