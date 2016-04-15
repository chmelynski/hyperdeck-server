
// this should be scrubbed of all dependence on frce - meaning get rid of all Griddl.GetData calls

if (typeof Griddl === 'undefined') { var Griddl = {}; }

Griddl.Widgets = (function() {

var Widgets = {};


// Undo
// All widget-driven changes ultimately modify the document JSON.
// Which means that any changes can be undone by either
//   1. storing the previous JSON, or
//   2. storing a command which will reverse the change
// clearly, #1 is easier to implement but requires more storage space, and #2 is harder but uses less storage
// therefore, we should start with #1 and implement #2 when we run up against resource limits


// Handlers
// the object currently hovered has control of all handlers for the canvas - onmousemove, onmousedown, onmouseup
// which means it must detect when the mouse leaves its box, and then call this.dehover(), then parent.onhover(e)
// (it might be that the mouse has also left the parent box, so the parent should immediately check for dehover itself)



// Canvas.Page/Section and Widgets.Page/Section may need to both exist and deal with different, but parallel things

// the key insight: Pages are *volatile*.  the document JSON shouldn't have any knowledge of pages at all, just sections
// because if you have a long section of prose, you don't know how many pages will be needed until you generate the layout
// from the user's perspective, you're just adding widgets (which now really should be called something else in this context, like 'content') to sections
// the Page Widget (and, indeed, the Page) isn't something the user deals with at all - that's all under the hood
// the problem was the assumption that the widgets the user added were the same as the widgets that handle events.  they are not.

// so now we have two layers:
// Sections with Content, and Pages with Widgets
// Sections with Content is the user interface for the document structure
// Pages with Widgets is the under-the-hood implementation of event handling

// now we can ask a clearer question of: how is Content related to Components?

// does every addition of Content necessitate a new Component?  no, because we don't want a component for each Text content
// however, addition of Paragraph/Table/List/Chart/Image content seems like they all would need a corresponding component

// so there are 3 ways to store Text Content in the components:
// 1. each Text gets its own component - this is pretty damned unwieldy, although it could be mitigated by single line text inputs rather than textareas
// 2. the Texts get put into a grid, either one grid for the whole document, or one grid per section
// 3. the Texts are put directly into the document JSON - this is, basically, not data-centric enough

// then there's the possibilitiy of different text grids according to function: one for section titles, one for footnotes, one for endnotes, one for captions, etc.  in these cases, the Content added would be presented as different objects, but the corresponding Components would be of similar forms

// again, components store data and JSON stores presentation.  no coordinates in these Text grids.  style info, at most



// there are 2 types of sections: Flow and Static
// a Flow section contains paragraphs, or tables, or other content that can flow to occupy many pages
// a Static section is just a single page
// when you add a Flow section, you can specify the number of columns (perhaps multiple buttons here - one-column, two-column, three-column, four-column)
// paragraphs, though Widgets, are more of a substrate than a foreground object





var Document = Widgets.Document = function(json) {
	
	this.unit = json.documentSettings.unit;
	this.page = {};
	this.page.width = json.documentSettings.pageDimensions.width;
	this.page.height = json.documentSettings.pageDimensions.height;
	this.pixelsPerUnit = json.documentSettings.pixelsPerUnit;
	this.usersPerUnit = json.documentSettings.usersPerUnit;
	this.snapGrid = {};
	this.snapGrid.gridlineSpacing = json.documentSettings.snapGrid.gridlineSpacing; // hack, need to convert to user units eventually
	this.snapGrid.gridlineHighlight = json.documentSettings.snapGrid.gridlineHighlight;
	this.styleJson = json.styles; // for now we'll just cache the JSON for easy export
	this.sections = [];
};
Document.prototype.exportToJson = function() {
	
	var json = {};
	json.documentSettings = {};
	json.documentSettings.unit = this.unit;
	json.documentSettings.pageDimensions = {};
	json.documentSettings.pageDimensions.width = this.page.width;
	json.documentSettings.pageDimensions.height = this.page.height;
	json.documentSettings.pixelsPerUnit = this.pixelsPerUnit;
	json.documentSettings.usersPerUnit = this.usersPerUnit;
	json.documentSettings.snapGrid = {};
	json.documentSettings.snapGrid.gridlineSpacing = this.snapGrid.gridlineSpacing;
	json.documentSettings.snapGrid.gridlineHighlight = this.snapGrid.gridlineHighlight;
	json.styles = this.styleJson;
	json.sections = this.sections.map(function(section) { return section.exportToJson(); });
	return json;
};

// a Section is a group of pages with continous content - we use hard page breaks to divide sections
// (in slides, a Section is usually conterminous with a Page)
// users insert, delete, and move Sections.  users do not interact directly with Pages
var Section = Widgets.Section = function(document, json) {
	this.document = document;
	this.orientation = json.orientation;
	this.pages = [];
	this.widgets = []; // this holds superwidgets and widgets that are their own superwidget
};
Section.prototype.exportToJson = function() {
	
	var json = {};
	json.orientation = this.orientation;
	json.pages = this.pages.map(function(page) { return page.exportToJson(); });
	return json;
};

var Page = Widgets.Page = function(section, json, canvasPage) {
	
	this.canvasPage = canvasPage;
	
	this.section = section;
	this.ctx = canvasPage.canvasContext; // wait, but this can't be the direct CanvasRenderingContext2D if we want to be able to export to PDF
	
	this.widgets = [];
};
Page.prototype.draw = function() {
	
	//this.ctx.setActivePage(this.canvasPage);
	this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	this.widgets.forEach(function(widget) { widget.draw(); });
};
Page.prototype.drawGridlines = function() {
	
	var ctx = this.ctx;
	var gridlineSpacing = this.section.document.snapGrid.gridlineSpacing * this.section.document.pixelsPerUnit;
	var gridlineHighlight = this.section.document.snapGrid.gridlineHighlight * this.section.document.pixelsPerUnit;
	
	var width = ctx.canvas.width;
	var height = ctx.canvas.height;
	
	// we could change the x and y loops below to start at the medians and radiate outward, in order to guarantee a median line
	// as is, the x == medianX test below will fail if medianX is not a multiple of spacing
	var medianX = width / 2;
	var medianY = height / 2;
	
	ctx.lineWidth = 1;
	
	// we cache all the lines and then draw them at the end, because we want darker lines to be drawn over lighter lines
	var todraw = [ [] , [] , [] ];
	
	for (var x = 0; x < width; x += gridlineSpacing)
	{
		var line = {x0:x+0.5,y0:0,x1:x+0.5,y1:height};
		
		if (x == medianX)
		{
			todraw[2].push(line);
		}
		else if (x % gridlineHighlight == 0)
		{
			todraw[1].push(line);
		}
		else
		{
			todraw[0].push(line);
		}
	}
	
	for (var y = 0; y < height; y += gridlineSpacing)
	{
		var line = {x0:0,y0:y+0.5,x1:width,y1:y+0.5};
		
		if (y == medianY)
		{
			todraw[2].push(line);
		}
		else if (y % gridlineHighlight == 0)
		{
			todraw[1].push(line);
		}
		else
		{
			todraw[0].push(line);
		}
	}
	
	var styles = [ 'rgb(200,200,200)' , 'rgb(100,100,100)' , 'rgb(0,0,0)' ];
	
	for (var i = 0; i < todraw.length; i++)
	{
		ctx.strokeStyle = styles[i];
		
		for (var j = 0; j < todraw[i].length; j++)
		{
			ctx.drawLine(todraw[i][j].x0, todraw[i][j].y0, todraw[i][j].x1, todraw[i][j].y1);
		}
	}
};
Page.prototype.onhover = function() {
	var page = this;
	this.ctx.canvas.onmousemove = function(e) { page.onmousemove(e); };
};
Page.prototype.onmousemove = function(e) {
	
	var x = e.offsetX;
	var y = e.offsetY;
	
	// this must be a for loop instead of a forEach because we break on first hit
	for (var i = 0; i < this.widgets.length; i++)
	{
		var widget = this.widgets[i];
		
		if (widget.box.lf <= x && x <= widget.box.rt && widget.box.tp <= y && y <= widget.box.bt)
		{
			widget.onhover();
			return;
		}
	}
};
Page.prototype.exportToJson = function() {
	
	var json = {};
	json.widgets = this.widgets.map(function(widget) { return widget.exportToJson(); });
	return json;
};

// this is a scrubbing variable in a paragraph of text
var Variable = Widgets.Variable = function() {
	
};

// widgets need a reference to the Canvas, so that draw() can issue draw commands
// and they also need a reference to the CanvasRenderingContext2D, so that they can handle events
// (and they should probably have a reference to the Page/Section?)

// should all Text objects across the document be in one grid (and thus have the page/section explicitly specified)
// or should there be one text grid per page/section?

function MakeTextWidgets(ctx, component) {
	
	var widgets = [];
	
	for (var i = 0; i < component.$.length; i++)
	{
		var text = new Text(ctx, component.$[i]);
		widgets.push(text);
	}
	
	return widgets;
}

var Text = Widgets.Text = function(ctx, data, params) {
	this.ctx = ctx;
	this.htmlCanvas = ctx.currentPage.canvasContext.canvas;
	this.data = data;
	this.params = params;
	
	ctx.Save();
	if (params.style) { ctx.SetStyle(params.style); }
	if (params.font) { ctx.font = params.font; }
	if (params.fontFamily) { ctx.fontFamily = params.fontFamily; }
	if (params.fontSize) { ctx.fontSize = params.fontSize; }
	if (params.fontSizeUnits) { ctx.fontSizeUnits = params.fontSizeUnits; }
	ctx.Restore();
	
	var width = ctx.measureText(this.text);
	
	AddBoxVars(this);
	Alignment(this, params.x, params.y, params.hAlign, params.vAlign);
	
};
Text.prototype.setBox = function() {
	
};
Text.prototype.draw = function() {
	
	// this code assumes that 'this' refers to a Griddl.Canvas.  lot fo refactoring to do there
	
	var ctx = this.ctx;
	
	ClearBox(ctx, this);
	
	var params = this.data[i];
	
	ctx.Save(); // stateless interface
	
	if (params.style) { ctx.SetStyle(params.style); }
	if (params.font) { ctx.font = params.font; }
	if (params.fontFamily) { ctx.fontFamily = params.fontFamily; }
	if (params.fontSize) { ctx.fontSize = params.fontSize; }
	if (params.fontSizeUnits) { ctx.fontSizeUnits = params.fontSizeUnits; }
	if (params.stroke) { ctx.strokeStyle = params.stroke; }
	if (params.fill) { ctx.fillStyle = params.fill; }
	if (params.lineWidth) { ctx.lineWidth = params.lineWidth; }
	if (params.textAlign) { ctx.textAlign = params.textAlign; }
	if (params.textBaseline) { ctx.textBaseline = params.textBaseline; }
	if (params.hAlign) { ctx.textAlign = params.hAlign; }
	if (params.vAlign) { if (params.vAlign == 'center') { ctx.textBaseline = 'middle'; } else { ctx.textBaseline = params.vAlign; } }
	
	var x = params.x;
	var y = params.y;
	
	//var parent = ctx.MakeBox(ctx.currentPage);
	//if (params.parent) { parent = params.parent; }
	
	ctx.fillText(params.text, x, y);
	
	ctx.Restore();
};
Text.prototype.setHandlers = function() {
	
	// we'll experiment with the Box movement interface here, and then abstract it into a Box object
	
	var canvas = this.htmlCanvas;
	
	canvas.onmousedown = function(e) {
		
		var obj = this;
		
		var ax = e.offsetX;
		var ay = e.offsetY;
		
		if (obj.lf <= ax && ax <= obj.rt && obj.tp <= ay && ay <= obj.bt)
		{
			canvas.onmousemove = function(e) {
				
				var mx = e.offsetX;
				var my = e.offsetY;
				
				var dx = mx - ax;
				var dy = my - ay;
				
				obj.lf += dx;
				obj.cx += dx;
				obj.rt += dx;
				obj.tp += dy;
				obj.cy += dy;
				obj.bt += dy;
				
				ax = mx;
				ay = my;
				
				draw();
			};
			canvas.onmouseup = function(e) {
				canvas.onmousemove = null;
				canvas.onmouseup = null;
				draw();
			};
		}
	};
};

// a paragraphs super widget will be held at the Section level, and will hold the relevant variables
// margin:{tp,rt,lf,bt}, interalMargin (gap between columns, margin from images/captions), nColumns, linePitch, indent, font, etc.
// then Paragraph widgets will be created for each box on the page
// when laying out text, it must avoid other widgets (think images and captions) that are overlaid on the page

// when you mouse over a variable in text, display the cell outline.  click to edit the cell, and you get a formula
// otherwise, the unit of editing is the paragraph.  click anywhere in a paragraph outside of variables, and you display a textarea with the paragraph

var Paragraphs = Widgets.Paragraphs = function(ctx, data, params) {
	
	this.ctx = ctx;
	this.text = data; // we still need to figure out how to do the variables thing.  don't want to have to pass in two components
	this.params = params;
	this.page = null;
	
	this.pitch = params.pitch;
	this.indent = params.indent;
	
	this.template = null;
	this.variables = null;
	
	this.words = null;
	this.boxes = null; // [ [{},{}] , [{},{}] ] - a list of lists of boxes in which to draw text
	
	this.wordize();
};
Paragraphs.prototype.setData = function(text) {
	this.text = text;
	this.wordize();
};
Paragraphs.prototype.draw = function() {
	
	var params = this.params;
	
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
Paragraphs.prototype.drawNaive = function() {
	
	//this.ctx.SetStyle(params.style);
	
	var line = '';
	
	var boxIndex = 0;
	var box = this.boxes[boxIndex];
	
	var y = top;
	
	for (var i = 0; i < this.words.length; i++)
	{
		var word = this.words[i];
		
		var testline = line + word;
		var lineWidth = this.ctx.measureText(testline).width;
		
		if (lineWidth > box.wd)
		{
			this.fillText(line, box.lf, y);
			line = '';
			y += this.pitch;
			
			if (y > box.bt)
			{
				boxIndex++;
				if (boxIndex >= this.boxes.length) { return; } // we've run out of room
				box = this.boxes[boxIndex];
				y = box.tp;
			}
		}
		
		line += word + ' ';
	}
	
	if (line.length > 0)
	{
		this.fillText(line, box.lf, y);
	}
};
Paragraphs.prototype.wordize = function() {
	
	this.words = [];
	var word = '';
	
	var k = 0;
	
	while (k < text.length)
	{
		var c = this.text[k];
		var n = c.charCodeAt();
		
		if (n == 32 || n == 9 || n == 13 || n == 10)
		{
			this.words.push(word);
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
		this.words.push(word);
	}
	
	return words;
};
Paragraphs.prototype.substitute = function() {
	
	this.text = this.template;
	
	for (var i = 0; i < this.variables.length; i++)
	{
		var name = this.variables[i].name;
		var value = this.variables[i].value;
		
		while (this.text.search('@' + name) >= 0)
		{
			this.text = this.text.replace('@' + name, value);
		}
	}
};

function Occlude(boxes, occ) {
	
	var newboxes = [];
	
	for (var i = 0; i < boxes.length; i++)
	{
		var box = boxes[i];
		
		if (occ.lf > box.lf && occ.rt < box.rt && occ.tp > box.tp && occ.bt < box.bt) // 0 edges blocked
		{
			newboxes.push(MakeBox({tp:box.tp,bt:occ.tp,lf:box.lf,rt:box.rt})); // tp
			newboxes.push(MakeBox({tp:occ.tp,bt:occ.bt,lf:box.lf,rt:occ.lf})); // lf
			newboxes.push(MakeBox({tp:occ.tp,bt:occ.bt,lf:occ.rt,rt:box.rt})); // rt
			newboxes.push(MakeBox({tp:occ.bt,bt:box.bt,lf:box.lf,rt:box.rt})); // bt
		}
		else if (occ.lf > box.lf && occ.rt < box.rt && occ.tp > box.tp && occ.bt > box.bt) // bt edge blocked 
		{
			newboxes.push(MakeBox({tp:box.tp,bt:occ.tp,lf:box.lf,rt:box.rt})); // tp
			newboxes.push(MakeBox({tp:occ.tp,bt:occ.bt,lf:box.lf,rt:occ.lf})); // lf
			newboxes.push(MakeBox({tp:occ.tp,bt:occ.bt,lf:occ.rt,rt:box.rt})); // rt
		}
		else if (occ.lf > box.lf && occ.rt > box.rt && occ.tp > box.tp && occ.bt < box.bt) // rt edge blocked 
		{
			newboxes.push(MakeBox({tp:box.tp,bt:occ.tp,lf:box.lf,rt:box.rt})); // tp
			newboxes.push(MakeBox({tp:occ.tp,bt:occ.bt,lf:box.lf,rt:occ.lf})); // lf
			newboxes.push(MakeBox({tp:occ.bt,bt:box.bt,lf:box.lf,rt:box.rt})); // bt
		}
		else if (occ.lf < box.lf && occ.rt < box.rt && occ.tp > box.tp && occ.bt < box.bt) // lf edge blocked 
		{
			newboxes.push(MakeBox({tp:box.tp,bt:occ.tp,lf:box.lf,rt:box.rt})); // tp
			newboxes.push(MakeBox({tp:occ.tp,bt:occ.bt,lf:occ.rt,rt:box.rt})); // rt
			newboxes.push(MakeBox({tp:occ.bt,bt:box.bt,lf:box.lf,rt:box.rt})); // bt
		}
		else if (occ.lf > box.lf && occ.rt < box.rt && occ.tp < box.tp && occ.bt < box.bt) // tp edge blocked 
		{
			newboxes.push(MakeBox({tp:occ.tp,bt:occ.bt,lf:box.lf,rt:occ.lf})); // lf
			newboxes.push(MakeBox({tp:occ.tp,bt:occ.bt,lf:occ.rt,rt:box.rt})); // rt
			newboxes.push(MakeBox({tp:occ.bt,bt:box.bt,lf:box.lf,rt:box.rt})); // bt
		}
		else if (occ.lf > box.lf && occ.rt > box.rt && occ.tp > box.tp && occ.bt > box.bt) // rt bt edges bocked
		{
			newboxes.push(MakeBox({tp:box.tp,bt:occ.tp,lf:box.lf,rt:box.rt})); // tp
			newboxes.push(MakeBox({tp:occ.tp,bt:box.bt,lf:box.lf,rt:occ.lf})); // bt lf
		}
		else if (occ.lf < box.lf && occ.rt < box.rt && occ.tp > box.tp && occ.bt > box.bt) // lf bt edges bocked
		{
			newboxes.push(MakeBox({tp:box.tp,bt:occ.tp,lf:box.lf,rt:box.rt})); // tp
			newboxes.push(MakeBox({tp:occ.tp,bt:box.bt,lf:occ.rt,rt:box.rt})); // bt rt
		}
		else if (occ.lf > box.lf && occ.rt > box.rt && occ.tp < box.tp && occ.bt < box.bt) // rt tp edges bocked
		{
			newboxes.push(MakeBox({tp:occ.bt,bt:box.bt,lf:box.lf,rt:box.rt})); // bt
			newboxes.push(MakeBox({tp:box.tp,bt:occ.bt,lf:box.lf,rt:occ.lf})); // tp lf
		}
		else if (occ.lf < box.lf && occ.rt < box.rt && occ.tp < box.tp && occ.bt < box.bt) // lf tp edges bocked
		{
			newboxes.push(MakeBox({tp:occ.bt,bt:box.bt,lf:box.lf,rt:box.rt})); // bt
			newboxes.push(MakeBox({tp:box.tp,bt:occ.bt,lf:occ.rt,rt:box.rt})); // tp rt
		}
		else if (occ.lf < box.lf && occ.rt > box.rt && occ.tp > box.tp && occ.bt > box.bt) // lf rt bt edges blocked
		{
			newboxes.push(MakeBox({tp:box.tp,bt:occ.tp,lf:box.lf,rt:box.rt}));
		}
		else if (occ.lf > box.lf && occ.rt > box.rt && occ.tp < box.tp && occ.bt > box.bt) // tp bt rt edges blocked
		{
			newboxes.push(MakeBox({tp:box.tp,bt:box.bt,lf:box.lf,rt:occ.lf}));
		}
		else if (occ.lf < box.lf && occ.rt < box.rt && occ.tp < box.tp && occ.bt > box.bt) // tp bt lf edges blocked
		{
			newboxes.push(MakeBox({tp:box.tp,bt:box.bt,lf:occ.rt.lf,rt:box.rt}));
		}
		else if (occ.lf < box.lf && occ.rt > box.rt && occ.tp < box.tp && occ.bt < box.bt) // lf rt tp edges blocked
		{
			newboxes.push(MakeBox({tp:occ.bt,bt:box.bt,lf:box.lf,rt:box.rt}));
		}
		else if (occ.lf < box.lf && occ.rt > box.rt && occ.tp < box.tp && occ.bt > box.bt)
		{
			// box is entirely occluded, nothing passes through to newbox
		}
		else
		{
			newboxes.push(box);
		}
	}
	
	return newboxes;
}


var Image = Widgets.Image = function(ctx, data, params) {
	
	this.ctx = ctx;
	this.data = data;
	this.params = params;
	this.page = null; // set by Canvas.GenerateDocument
	
	this.box = new Box(ctx, this);
	this.box.x = params.x;
	this.box.y = params.y;
	this.box.hAlign = params.hAlign;
	this.box.vAlign = params.vAlign;
	this.box.wd = params.width ? params.width : data.width;
	this.box.hg = params.height ? params.height : data.height;
	this.box.align();
	
	this.sx = params.sx ? params.sx : 0;
	this.sy = params.sy ? params.sy : 0;
	this.sw = params.sw ? params.sw : this.data.width;
	this.sh = params.sh ? params.sh : this.data.height;
};
Image.prototype.draw = function() {
	this.ctx.DrawImage(this.data, this.box.lf, this.box.tp, this.box.wd, this.box.hg, this.sx, this.sy, this.sw, this.sh);
};
Image.prototype.onhover = function() {
	this.box.onhover();
};
Image.prototype.dehover = function() {
	
};
Image.prototype.onmousemove = function(e) {
	// any resize controls go here
};
Image.prototype.exportToJson = function() {
	
	var json = {};
	
	json.type = 'Image';
	json.data = this.params.data;
	
	json.x = this.box.x;
	json.y = this.box.y;
	json.hAlign = this.box.hAlign;
	json.vAlign = this.box.vAlign;
	json.width = this.width;
	json.height = this.height;
	
	return json;
};

// basically superseded by Grid (which perhaps should be named to Table)
var Table = Widgets.Table = function(ctx, data, params) {
	this.ctx = ctx;
	this.htmlCanvas = ctx.currentPage.canvasContext.canvas;
	this.data = data;
	this.params = params;
}
Table.prototype.draw = function() {
	
	// args were: ctx, params
	
	// A	B	C
	// foo	e	f
	// bar	h	i
	// baz	k	l
	
	var ctx = this.ctx;
	var data = this.data;
	var params = this.params;
	
	//var tableStyles = Griddl.GetData(tableStylesName);
	
	var widths = [];
	var heights = [];
	
	if (typeof(params.widths) == 'number')
	{
		for (var i = 0; i < data[0].length; i++) { widths.push(params.widths); }
	}
	else if (typeof(params.widths) == 'object') // we'll assume its a list
	{
		widths = params.widths;
	}
	else if (typeof(params.widths) == 'string')
	{
		// we assume the widths objects is a one-row multi-column matrix
		widths = Griddl.GetData(params.widths)[0].map(function(elt, index) { return parseInt(elt); });
	}
	else
	{
		throw new Error();
	}
	
	if (typeof(params.heights) == 'number')
	{
		for (var i = 0; i < data.length; i++) { heights.push(params.heights); }
	}
	else if (typeof(params.heights) == 'object') // we'll assume its a list
	{
		heights = params.heights;
	}
	else if (typeof(params.heights) == 'string')
	{
		// we assume the heights objects is a one-column multi-row matrix
		heights = Griddl.GetData(heightsName).map(function(elt, index) { return parseInt(elt[0]); });
	}
	else
	{
		throw new Error();
	}
	
	var totalWidth = widths.reduce(function(a, b) { return a + b; });
	var totalHeight = heights.reduce(function(a, b) { return a + b; });
	
	var left = null;
	var top = null;
	
	// if the positioning paramater is blank, center the table
	if (!params.left) { left = (ctx.currentPage.width - totalWidth) / 2; } else { left = params.left; }
	if (!params.top) { top = (ctx.currentPage.height - totalHeight) / 2; } else { top = params.top; }
	
	var rowPxs = new Array(heights + 1);
	var colPxs = new Array(widths + 1);
	rowPxs[0] = top;
	colPxs[0] = left;
	
	for (var i = 0; i < widths.length; i++) { colPxs[i + 1] = colPxs[i] + widths[i]; }
	for (var i = 0; i < heights.length; i++) { rowPxs[i + 1] = rowPxs[i] + heights[i]; }
	
	// horizontal lines
	for (var i = 0; i < rowPxs.length; i++)
	{
		var x1 = colPxs[0];
		var x2 = colPxs[colPxs.length - 1] + 1;
		var y = rowPxs[i] + 0.5;
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'black';
		ctx.drawLine(x1, y, x2, y);
	}
	
	// vertical lines
	for (var i = 0; i < colPxs.length; i++)
	{
		var y1 = rowPxs[0];
		var y2 = rowPxs[rowPxs.length - 1] + 1;
		var x = colPxs[i] + 0.5;
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'black';
		ctx.drawLine(x, y1, x, y2);
	}
	
	// entries
	for (var i = 0; i < data.length; i++)
	{
		for (var j = 0; j < data[i].length; j++)
		{
			var val = data[i][j];
			
			if (val != null && val != "")
			{
				ctx.SetStyle(tableStyles[i][j]);
				
				var tp = rowPxs[i];
				var bt = rowPxs[i + 1];
				var lf = colPxs[j];
				var rt = colPxs[j + 1];
				
				var textX = 0;
				var margin = 8;
				
				if (ctx.textAlign == 'left')
				{
					textX = lf + margin;
				}
				else if (ctx.textAlign == 'right')
				{
					textX = rt - margin;
				}
				else if (ctx.textAlign == 'center')
				{
					textX = (lf + rt) / 2;
				}
				
				var textY = (tp + bt) / 2;
				
				ctx.fillText(val, textX, textY);
			}
		}
	}
};

var List = Widgets.List = function(ctx, data, params) {
	
	this.ctx = ctx;
	this.data = data;
	this.params = params;
	
	this.page = null;
	
	this.box = new Box(ctx, this);
	this.box.x = params.x;
	this.box.y = params.y;
	this.box.hAlign = params.hAlign;
	this.box.vAlign = params.vAlign;
	
	this.bulletStyle = null;
	this.bulletSize = null;
	this.bulletMargin = null;
	this.gap = null;
}
List.prototype.draw = function() {
	
	
	// text	left	dy	style	bulType	bulSize
	// major1	40	200	basic	circle	6
	// minor1	80	30	basic	circle	3
	// subminor1	120	30	basic	circle	2
	// major2	40	30	basic	circle	6
	// minor2	80	30	basic	circle	3
	
	var y = 0;
	
	for (var i = 0; i < this.data.length; i++)
	{
		var datum = this.data[i];
		
		var dy = parseFloat(datum.dy);
		var left = parseFloat(datum.left);
		var size = parseFloat(datum.bulSize);
		var text = datum.text;
		
		y += dy;
		
		this.ctx.SetStyle(datum.style);
		this.ctx.fillCircle(left, y, size);
		this.ctx.fillText(text, left + size + 8, y);
	}
};
var Gridlist = Widgets.Gridlist = function(ctx, data, keys) {
	
	// should we have a separate Element class (or Row or what have you) to handle the expand/collapse controls?
	
	this.ctx = ctx;
	this.data = data;
	
	this.fields = null;
	this.childField = 'subs'; // should we make this an argument to the constructor or something?
	
	if (keys)
	{
		this.fields = keys;
	}
	else
	{
		this.fields = [];
		var fieldDict = {};
		for (var i = 0; i < this.data.length; i++)
		{
			for (var key in this.data[i])
			{
				if (!fieldDict[key])
				{
					fieldDict[key] = this.fields.length + 1; // 1-index the dictionary because 0 reads as false
					this.fields.push(key);
				}
			}
		}
	}
	
	this.indent = 20;
	this.height = 25;
	this.widths = [];
	for (var i = 0; i < this.fields.length; i++) { this.widths.push(100); }
	
	this.box = {};
	AddBoxVars(this.box);
};
Gridlist.prototype.draw = function() {
	
	var y = this.box.tp;
	
	this.ctx.textBaseline = 'middle';
	
	var gl = this;
	
	function DrawRec(tier, left) {
		
		for (var i = 0; i < tier.length; i++)
		{
			var dx = 0;
			
			for (var j = 0; j < gl.fields.length; j++)
			{
				gl.ctx.strokeRect(left + dx + 0.5, y + 0.5, gl.widths[j], gl.height);
				gl.ctx.fillText(tier[i][gl.fields[j]].toString(), left + dx + 2, y + gl.height / 2);
				dx += gl.widths[j];
			}
			
			y += gl.height;
			
			if (tier[i][gl.childField]) { DrawRec(tier[i][gl.childField], left + gl.indent); }
		}
		
	}
	
	DrawRec(this.data, this.box.lf);
};

var BarChart = Widgets.BarChart = function(ctx, data, params) {
	
	// column	value	color	label
	// '2012'	50	'orange'	'foo'
	// '2012'	50	'orange'	'foo'
	// '2013'	50	'orange'	'foo'
	
	this.ctx = ctx;
	this.htmlCanvas = ctx.currentPage.canvasContext.canvas;
	this.page = null; // set by Canvas.GenerateDocument
	this.data = data;
	
	this.params = params; // we'll keep this field to hold 'data' and other things needed for exportToJson()
	this.widthBetweenBars = params.widthBetweenBars;
	this.barWidth = params.barWidth;
	this.textMargin = params.textMargin;
	this.scale = params.scale;
	
	this.columns = []; // the columns are created on renewData()
	
	this.controls = []; // the control objects are created on renewData().  on draw(), the control fields are updated with new values
	this.scaleControls = [];
	this.gapControls = [];
	this.barWidthControls = [];
	this.textMarginControls = [];
	
	this.box = new Box(ctx, this);
	this.box.x = params.x;
	this.box.y = params.y;
	this.box.hAlign = params.hAlign;
	this.box.vAlign = params.vAlign;
	
	this.renewData(); // this generates columns and controls
	this.calculateDimensions(); // this is a separate function because it must be called every time the width, scale, gap, etc. params change
};
BarChart.prototype.calculateDimensions = function() {
	
	// here we need to calculate an initial width/height so that we can place the chart correctly
	// that means dynamically determining a scale, and possibly a barWidth and widthBetweenBars
	
	var max = this.columns.map(function(column) { return column.sum; }).reduce(function(a, b) { return Math.max(a, b); });
	
	this.box.wd = this.params.margin.lf + this.params.margin.rt + this.barWidth * this.columns.length + this.widthBetweenBars * (this.columns.length - 1);
	
	// if this we are pasting in new data, the params should stay untouched, including the previously set scale
	if (this.scale)
	{
		this.box.hg = this.params.margin.bt + this.params.margin.tp + max * this.scale;
	}
	else
	{
		this.box.hg = 72 * 6; // magic number, must change
		this.scale = (this.box.hg - this.params.margin.bt - this.params.margin.tp) / max;
	}
	
	this.box.align();
};
BarChart.prototype.renewData = function() {
	
	this.columns = [];
	this.controls = [];
	this.scaleControls = [];
	this.gapControls = [];
	this.barWidthControls = [];
	this.textMarginControls = [];
	
	// we group the data points by bar first - filling this.columns
	var column = null; // [{column:'2012',value:50,color:'orange',label:'foo'},{column:'2012',value:50,color:'orange',label:'foo'}] with 'label':'2012',sum:0
	var columnLabelDict = {}; // {'2012':0,'2013':1}
	
	for (var i = 0; i < this.data.length; i++)
	{
		var obj = this.data[i];
		
		if (columnLabelDict[obj.column] === undefined)
		{
			column = [];
			this.columns.push(column);
			columnLabelDict[obj.column] = this.columns.length - 1;
			column["label"] = obj.column;
			column["sum"] = 0;
		}
		else
		{
			column = this.columns[columnLabelDict[obj.column]];
		}
		
		column.push(obj);
		column["sum"] += parseFloat(obj.value);
	}
	
	var chart = this;
	this.columns.forEach(function(column) { chart.scaleControls.push(new Arrow({parent:chart,ctx:chart.ctx,vert:true,field:'scale',scale:0.01,min:0.01})); }); // scale
	for (var i = 0; i < this.columns.length - 1; i++) { chart.gapControls.push(new Arrow({parent:chart,ctx:chart.ctx,hori:true,field:'widthBetweenBars',scale:1,min:0})); } // widthBetweenBars (gap)
	this.columns.forEach(function(column) { chart.barWidthControls.push(new Arrow({parent:chart,ctx:chart.ctx,hori:true,field:'barWidth',scale:1,min:1})); }); // barWidth
	this.columns.forEach(function(column) { chart.textMarginControls.push(new Arrow({parent:chart,ctx:chart.ctx,vert:true,field:'textMargin',scale:1,min:0})); }); // textMargin
	
	this.scaleControls.forEach(function(control) { chart.controls.push(control); });
	this.gapControls.forEach(function(control) { chart.controls.push(control); });
	this.barWidthControls.forEach(function(control) { chart.controls.push(control); });
	this.textMarginControls.forEach(function(control) { chart.controls.push(control); });
};
BarChart.prototype.draw = function() {
	
	// the tension between creation and updating is rearing its head
	// so now we're redrawing the chart in response to user action
	// so we need to separate the creation of controls from the drawing
	// and when we are dragging a control, what happens to the control?  how and when do we update the control's box?
	// perhaps we wait until mouseup, then re-create the chart (and thus controls)
	// but then how do we draw the arrow extending?
	// well, we can just take the info from the mousedrag event to hack a redraw of the arrow without having to touch the control variables
	// or we can somehow update the control variables on the fly, who knows
	
	var ctx = this.ctx;
	var objs = this.data;
	
	var widthBetweenBars = this.widthBetweenBars;
	var barWidth = this.barWidth;
	var textMargin = this.textMargin;
	var scale = this.scale;
	
	var chartLf = this.box.lf;
	var chartBt = this.box.bt;
	var marginLf = this.params.margin.lf;
	var marginBt = this.params.margin.bt;
	
	this.clear();
	
	for (var i = 0; i < this.columns.length; i++)
	{
		var column = this.columns[i];
		
		var totalHeight = 0;
		var totalValue = 0;
		
		var columnLabel = column.label;
		
		var left = chartLf + marginLf + (widthBetweenBars + barWidth) * i;
		var columnRight = left + barWidth;
		var columnBottom = chartBt - marginBt;
		
		for (var k = 0; k < column.length; k++)
		{
			var str = column[k].value;
			var label = column[k].label;
			var color = column[k].color;
			
			var num = parseFloat(str);
			var height = num * scale;
			
			// bar segment
			totalValue += num;
			totalHeight += height;
			var top = columnBottom - totalHeight;
			ctx.fillStyle = color;
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'black';
			ctx.fillRect(left, top, barWidth, height);
			// ctx.strokeRect(left, top, barWidth, height);
			
			// segment label
			// "segmentLabelStyle":{"font":"10pt Arial","fillStyle":"white","textAlign":"center","textBaseline":"middle"}
			ctx.font = '10pt Arial'; // parametrize - these labels should be probably be Text widgets
			ctx.fillStyle = 'white'; // parametrize
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			var text = label; // or format 'num'
			var x = left + barWidth / 2;
			var y = top + height / 2;
			ctx.fillText(text, x, y);
		}
		
		// top label
		// "topLabelStyle":{"font":"10pt Arial","fillStyle":"black","textAlign":"center","textBaseline":"bottom"}
		ctx.font = '10pt Arial'; // parametrize
		ctx.fillStyle = 'black'; // parametrize
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		var text = totalValue.toString();
		var x = chartLf + marginLf + (widthBetweenBars + barWidth) * i + barWidth / 2;
		var y = columnBottom - totalHeight - textMargin;
		ctx.fillText(text, x, y);
		
		// bottom label
		// "bottomLabelStyle":{"font":"10pt Arial","fillStyle":"black","textAlign":"center","textBaseline":"top"}
		ctx.font = '10pt Arial'; // parametrize
		ctx.fillStyle = 'black'; // parametrize
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		var text = columnLabel;
		var x = chartLf + marginLf + (widthBetweenBars + barWidth) * i + barWidth / 2;
		var y = chartBt - marginBt + textMargin;
		ctx.fillText(text, x, y);
		
		
		ReconcileBox(this.scaleControls[i], {lf:left,wd:barWidth,bt:columnBottom - 10,hg:totalHeight - 10}); // leave some room for the barWidth control at the bottom
		
		if (i < this.columns.length - 1)
		{
			ReconcileBox(this.gapControls[i], {lf:columnRight,wd:widthBetweenBars,bt:columnBottom,hg:10});
		}
		
		ReconcileBox(this.barWidthControls[i], {lf:left,wd:barWidth,bt:columnBottom,hg:10});
		
		ReconcileBox(this.textMarginControls[i], {lf:left,wd:barWidth,tp:columnBottom,hg:textMargin});
	}
};
BarChart.prototype.clear = function() {
	// we can't just call this.box.clear(), because Box.clear() only clears the handles
	this.ctx.clearRect(this.box.lf, this.box.tp, this.box.wd, this.box.hg);
};
BarChart.prototype.onhover = function() {
	
	//console.log('BarChart.onhover');
	
	var chart = this;
	this.box.onhover();
	
	// the box will first check for leaving and handlehover, and if not will kick the event back here
	//this.ctx.canvas.onmousemove = function(e) { chart.onmousemove(e); };
};
BarChart.prototype.dehover = function() {
	
};
BarChart.prototype.onmousemove = function(e) {
	
	// the Box handles leaving and handles - we only have to deal with controls here
	
	var x = e.offsetX;
	var y = e.offsetY;
	
	for (var i = 0; i < this.controls.length; i++)
	{
		var control = this.controls[i];
		
		if (control.lf <= x && x <= control.rt && control.tp <= y && y <= control.bt)
		{
			control.onhover();
			return;
		}
	}
};
BarChart.prototype.exportToJson = function() {
	
	var json = {};
	
	json.type = 'BarChart';
	json.data = this.params.data;
	
	json.widthBetweenBars = this.widthBetweenBars;
	json.barWidth = this.barWidth;
	json.textMargin = this.textMargin;
	json.scale = this.scale;
	
	json.x = this.box.x;
	json.y = this.box.y;
	json.hAlign = this.box.hAlign;
	json.vAlign = this.box.vAlign;
	
	json.margin = {};
	json.margin.lf = this.params.margin.lf;
	json.margin.rt = this.params.margin.rt;
	json.margin.tp = this.params.margin.tp;
	json.margin.bt = this.params.margin.bt;
	
	json.label = {};
	json.label.lf = this.params.label.lf;
	json.label.rt = this.params.label.rt;
	json.label.tp = this.params.label.tp;
	json.label.bt = this.params.label.bt;
	
	json.keyLeft = this.params.keyLeft;
	json.keyTop = this.params.keyTop;
	
	return json;
};

var LineChart = Widgets.LineChart = function(ctx, data, params) {
	this.ctx = ctx;
	this.htmlCanvas = ctx.currentPage.canvasContext.canvas;
	this.data = data;
	this.params = params;
}
LineChart.prototype.draw = function() {
	
	// args were ctx, objs, params
	
	// ctx is a particular way of specifying data - other ways may be desirable as well
	
	// xAxis	cars	trucks	vans	buses
	// 0	60	50	100	200	300
	
	var colormap = {};
	
	for (var i = 0; i < key.length; i++)
	{
		colormap[key[i].label] = key[i].color;
	}
	
	var firstObj = objs[0];
	
	var xField = 'xAxis'; // beware: magic string here
	
	for (var k in firstObj)
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = colormap[k];
		
		if (k == xField) { continue; }
		
		ctx.beginPath();
		
		for (var i = 0; i < objs.length; i++)
		{
			var val = objs[i][k];
			
			if (val == null || val == '') { continue; } // skip over blank entries
			
			var xNum = parseInt(objs[i][xField]);
			var yNum = parseInt(val);
			
			var x = chartLf+marginLf+(xNum-xMin)*xScale;
			var y = chartBt-marginBt-(yNum-yMin)*yScale;
			
			if (i == 1)
			{
				ctx.moveTo(x, y);
			}
			else
			{
				ctx.lineTo(x, y);
			}
		}
		
		ctx.stroke();
	}
	
	DrawAxis(ctx, null, params, volatileParams);
};

var BubbleChart = Widgets.BubbleChart = function(ctx, data, params) {
	this.ctx = ctx;
	this.htmlCanvas = ctx.currentPage.canvasContext.canvas;
	this.data = data;
	this.params = params;
}
BubbleChart.prototype.draw = function() {
	
	// args were ctx, objs, params
	
	// x	y	r	color	shape	label	style
	// 10	20	5	'orange'	'circle'	'foo'	'centered'
	
	for (var i = 0; i < objs.length; i++)
	{
		var obj = objs[i];
		
		var xNum = parseFloat(obj.x);
		var yNum = parseFloat(obj.y);
		var rNum = parseFloat(obj.r);
		
		var x = chartLf+marginLf+(xNum-xMin)*xScale;
		var y = chartBt-marginBt-(yNum-yMin)*yScale;
		var r = rNum * params.radiusScale;
		
		var fill = null;
		var stroke = null;
		
		var lineWidth = 2;
		var lineColor = 'black';
		
		// individual overrides for label params
		if (obj.labelFont) { labelFont = obj.labelFont; }
		if (obj.labelColor) { labelColor = obj.labelColor; }
		if (obj.labelYOffset) { labelYOffset = obj.labelYOffset; }
		if (obj.color) { fill = obj.color; }
		if (obj.stroke) { stroke = obj.stroke; }
		if (obj.lineWidth) { lineWidth = obj.lineWidth; }
		if (obj.lineColor) { lineColor = obj.lineColor; }
		
		if (fill)
		{
			ctx.fillStyle = obj.color;
			ctx.fillCircle(x, y, r);
		}
		
		if (stroke)
		{
			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = lineColor;
			ctx.strokeCircle(x, y, r);
		}
		
		// label
		ctx.font = '10pt Arial'; // parametrize
		ctx.fillStyle = 'white'; // parametrize
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(obj.label, x, y);
	}
	
	DrawAxis(ctx, null, params, volatileParams);
};

// Math
// Graphics
// Graphs
// etc.

// the key widget maybe should stay in the JSON rather than be a table
// we'll have to generate the initial colors automatically
// and then people can change the colors through the widget
var Key = Widgets.Key = function(ctx, data, params) {
	this.ctx = ctx;
	this.htmlCanvas = ctx.currentPage.canvasContext.canvas;
	this.data = data;
	this.params = params;
};
Key.prototype.draw = function() {
	
	// ctx, key, left, top, options
	
	// color	label
	// orange	cars
	// green	trucks
	// red	vans
	// purple	buses
	
	var keyFontSize = 10;
	var keyFontFamily = 'Arial';
	var keyTextColor = 'black';
	var keyBoxSize = 10;
	var keyRowSpacing = 20;
	var keyLabelOffsetX = 20;
	
	if (options)
	{
		keyFontSize = options.fontSize;
		keyFontFamily = options.fontFamily;
		keyTextColor = options.textColor;
		keyBoxSize = options.boxSize;
		keyRowSpacing = options.rowSpacing;
		keyLabelOffsetX = options.keyLabelOffsetX;
	}
	
	for (var i = 0; i < key.length; i++)
	{
		var x = left;
		var y = top + i * keyRowSpacing;
		var side = keyBoxSize;
		
		ctx.fillStyle = key[i].color;
		ctx.fillRect(x, y, side, side);
		ctx.font = keyFontSize + 'pt ' + keyFontFamily;
		ctx.fillStyle = keyTextColor;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillText(key[i].label, x + keyLabelOffsetX, y + keyBoxSize / 2);
	}
};

// this is a one-dimensional scale control, used to scale bars and adjust gaps (=scaling a fixed underlying value of 1)
function Arrow(params) {
	
	this.parent = params.parent;
	this.ctx = params.ctx;
	this.field = params.field;
	this.hori = params.hori ? true : false;
	this.vert = params.vert ? true : false;
	this.scale = params.scale;
	this.min = params.min;
	
	this.origValue = null; // store the original parameter value here when a drag begins
	this.percent = 100; // this will change during a drag
	
	// this is not exactly the right way to think about this - what we want is to maintain the relative position of the mouse pointer
	// relative to the bar, or the gap, or whatever
	// so if the mouse pointer starts 60% of the way up the bar, we want it to stay at 60%
	this.percentPerPixel = 10;
	
	this.patch = null;
	
	this.strokeStyle = 'rgb(255,0,0)';
	this.lineWidth = 1;
	this.fletchLength = 5;
	this.fletchAngle = 45;
	
	this.circleColor = 'rgb(0,0,255)';
	this.circleRadius = 3;
	
	AddBoxVars(this);
}
Arrow.prototype.draw = function() {
	
	this.patch = this.ctx.getImageData(this.lf - 1, this.tp - 1, this.wd + 2, this.hg + 2); // some padding on the edges to accomodate the +0.5 stuff
	
	var ctx = this.ctx;
	
	ctx.lineWidth = this.lineWidth;
	ctx.strokeStyle = this.strokeStyle;
	
	var dx = this.fletchLength * Math.cos(this.fletchAngle / 360 * Math.PI * 2);
	var dy = this.fletchLength * Math.cos(this.fletchAngle / 360 * Math.PI * 2);
	
	// once again, the +0.5 stuff haunts us
	// added for hori, not yet for vert
	
	if (this.hori)
	{
		ctx.drawLine(this.lf, this.cy+0.5, this.rt   , this.cy+0.5   );
		ctx.drawLine(this.lf, this.cy+0.5, this.lf+dx, this.cy+0.5-dy); // lf tp fletch
		ctx.drawLine(this.lf, this.cy+0.5, this.lf+dx, this.cy+0.5+dy); // lf bt fletch
		ctx.drawLine(this.rt, this.cy+0.5, this.rt-dx, this.cy+0.5-dy); // rt tp fletch
		ctx.drawLine(this.rt, this.cy+0.5, this.rt-dx, this.cy+0.5+dy); // rt bt fletch
	}
	
	if (this.vert)
	{
		ctx.drawLine(this.cx+0.5, this.tp, this.cx+0.5   , this.bt   );
		ctx.drawLine(this.cx+0.5, this.tp, this.cx+0.5-dx, this.tp+dy); // tp lf fletch
		ctx.drawLine(this.cx+0.5, this.tp, this.cx+0.5+dx, this.tp+dy); // tp rt fletch
		ctx.drawLine(this.cx+0.5, this.bt, this.cx+0.5-dx, this.bt-dy); // bt lf fletch
		ctx.drawLine(this.cx+0.5, this.bt, this.cx+0.5+dx, this.bt-dy); // bt rt fletch
	}
	
	ctx.fillStyle = this.circleColor;
	ctx.fillCircle(this.cx, this.cy+0.5, this.circleRadius);
};
Arrow.prototype.clear = function() {
	this.ctx.putImageData(this.patch, this.lf - 1, this.tp - 1);
};
Arrow.prototype.ondrag = function(d) {
	
	this.parent[this.field] += d * this.scale;
	if (this.parent[this.field] < this.min) { this.parent[this.field] = this.min; }
	this.parent.calculateDimensions();
};
Arrow.prototype.onhover = function() {
	
	//Debug('Arrow.onhover');
	
	var arrow = this;
	
	this.draw();
	
	this.ctx.canvas.onmousemove = function(e) { arrow.onmousemove(e); };
	
	this.ctx.canvas.onmousedown = function(e) {
		
		var ax = e.offsetX;
		var ay = e.offsetY;
		
		arrow.ctx.canvas.onmousemove = function(e) {
			
			var d = 0;
			
			if (arrow.hori)
			{
				var mx = e.offsetX;
				d = mx - ax;
				ax = mx;
			}
			else if (arrow.vert)
			{
				var my = e.offsetY;
				d = my - ay;
				ay = my;
			}
			else
			{
				throw new Error();
			}
			
			// this sequence attempts to limit clearing and redrawing to the parent box
			// this is an optimization, and can be saved until it is really necessary
			//arrow.parent.clear();
			//arrow.ondrag(d);
			//arrow.parent.draw();
			//arrow.draw();
			
			// this just clears and redraws the whole canvas
			arrow.ondrag(d);
			arrow.parent.page.draw();
			arrow.draw();
		};
		arrow.ctx.canvas.onmouseup = function(e) {
			arrow.ctx.canvas.onmousemove = function(e) { arrow.onmousemove(e); };
			arrow.ctx.canvas.onmouseup = null;
			arrow.onmousemove(e);
			
			// we should probably save the existing document JSON to enable undo/redo
			Griddl.SetData('document', JSON.stringify(arrow.parent.page.section.document.exportToJson()));
			
			//arrow.parent.draw();
		};
	};
};
Arrow.prototype.dehover = function() {
	//Debug('Arrow.dehover');
	this.ctx.canvas.onmousedown = null;
	this.clear();
	this.parent.onhover();
};
Arrow.prototype.onmousemove = function(e) {
	
	var x = e.offsetX;
	var y = e.offsetY;
	
	if (x < this.lf || x > this.rt || y < this.tp || y > this.bt)
	{
		this.dehover();
	}
};

function Debug(text) { document.getElementById('debug').innerText = text; }



// this combines grid.js, gridhandlers.js, cell.js, cellhandlers.js, numberhandlers.js

var Grid = Widgets.Grid = function(ctx, data, params) {
	
	this.ctx = ctx;
	this.data = data;
	this.name = 'Grid';
	this.page = null; // set by Canvas.GenerateDocument
	
	this.cells = null; // Cell[][]
	this.fields = null; // string[] - these are the colLabels
	this.rowLabels = null; // string[]
	
	this.box = {}; Griddl.Widgets.AddBoxVars(this.box);
	//this.box = new Box(ctx, this); // the mechanics of row and col resizing work best if the grid's anchor is mandated to be tp/lf, but users might want centering
	this.box.x = params.x;
	this.box.y = params.y;
	this.box.hAlign = params.hAlign;
	this.box.vAlign = params.vAlign;
	
	this.selected = null; // {}
	this.cursor = null; // { row : int , col : int }
	this.anchor = null; // { row : int , col : int }
	
	this.nRows = null; // int, includes headers
	this.nCols = null; // int, includes headers
	this.rowSizes = null; // Slot<int>[], includes headers
	this.colSizes = null; // Slot<int>[], includes headers
	this.xs = null; // Slot<int>[], fencepost with colSizes
	this.ys = null; // Slot<int>[], fencepost with rowSizes
	
	// for endoscrolling
	this.scrollbars = [];
	this.rowStartIndex = 0;
	this.colStartIndex = 0;
	this.maxRows = Number.POSITIVE_INFINITY;
	this.maxCols = Number.POSITIVE_INFINITY;
	
	this.generateFields();
	this.redisplay(); // generate nRows,nCols, initial colSizes and rowSizes
	this.generateCells();
	this.position();
};
Grid.prototype.generateFields = function() {
	
	// data => fields
	
	this.fields = [];
	var fieldDict = {};
	
	for (var i = 0; i < this.data.length; i++)
	{
		for (var key in this.data[i])
		{
			if (!fieldDict[key])
			{
				fieldDict[key] = this.fields.length + 1; // 1-index the dictionary because 0 reads as false
				this.fields.push(key);
			}
		}
	}
};
Grid.prototype.generateCells = function() {
	
	// nRows,nCols => cells
	
	// this is red row labels, green col labels, and gray grid label
	var titleCellFill = "rgb(208,216,217)";
	var objLabelCellFill = "rgb(255,200,200)";
	var fldLabelCellFill = "rgb(208,246,117)";
	
	var dataCellFill = "rgb(255,255,255)";
	var selectedFill = "rgb(255,213,141)";
	
	this.cells = [];
	this.rowLabels = [];
	
	for (var i = 0; i < this.nRows; i++)
	{
		if (i > 0) { this.rowLabels.push((i - 1).toString()); }
		
		this.cells.push([]);
		
		for (var j = 0; j < this.nCols; j++)
		{
			var cell = new Cell(this.ctx, this)
			cell.row = i;
			cell.col = j;
				
			// the pointer directs the output of the cell formula to the slot
			
			if (i == 0 && j == 0)
			{
				cell.setData(this, 'name');
				cell.cellFill = titleCellFill;
				cell.textAlign = 'center';
			}
			else if (i == 0) // col labels
			{
				cell.setData(this.fields, j - 1);
				cell.cellFill = fldLabelCellFill;
				cell.textAlign = 'center';
			}
			else if (j == 0) // row labels
			{
				cell.setData(this.rowLabels, i - 1);
				cell.cellFill = objLabelCellFill;
				cell.textAlign = 'center';
			}
			else
			{
				cell.setData(this.data[i - 1], this.fields[j - 1]);
				cell.cellFill = dataCellFill;
			}
			
			this.cells[i].push(cell);
		}
	}
};
Grid.prototype.redisplay = function() {
	
	// generate nRows,nCols
	
	this.cursor = {row:null,col:null};
	this.anchor = {row:null,col:null};
	this.selected = []; // {mode:'Select',color:'rgb(0,0,0)',shimmer:false,minCol:null,maxCol:null,minRow:null,maxRow:null}
	this.focusSelected = null; // this.selected[0]
	
	this.nRows = Math.min(this.data.length, this.maxRows) + 1;
	this.nCols = Math.min(this.fields.length, this.maxCols) + 1;
	
	// we regenerate new heights and widths if either this is the first time, or if the number of rows or cols has changed
	// if we regenerate data but the number of rows or cols stays the same, that dimension keeps its measurements
	// widths and heights should be determined automatically - use measureText
	
	if (this.rowSizes === null || this.rowSizes.length != this.nRows)
	{
		this.rowSizes = []; for (var i = 0; i < this.nRows; i++) { this.rowSizes.push(20); }
	}
	
	if (this.colSizes === null || this.colSizes.length != this.nCols)
	{
		this.colSizes = []; for (var j = 0; j < this.nCols; j++) { this.colSizes.push(64); }
	}
	
	this.box.wd = this.colSizes.reduce(function(x, y) { return x + y; });
	this.box.hg = this.rowSizes.reduce(function(x, y) { return x + y; });
};
Grid.prototype.position = function() {
	
	// redisplay should be called before position, to set row and col sizes and calculate wd and hg
	
	AlignBox(this.box); // allows for flexible anchoring
	
	// starting with the left, top, rowSizes, and colSizes, recalculate xs, ys, and the other box vars
	var x = this.box.lf;
	var y = this.box.tp;
	this.xs = [ x ];
	this.ys = [ y ];
	for (var j = 0; j < this.nCols; j++) { x += this.colSizes[j]; this.xs.push(x); }
	for (var i = 0; i < this.nRows; i++) { y += this.rowSizes[i]; this.ys.push(y); }
	//Griddl.Widgets.ReconcileBox(this.box, {lf:this.box.lf,rt:x,tp:this.box.tp,bt:y});
	
	// then reposition the cells
	for (var i = 0; i < this.nRows; i++)
	{
		for (var j = 0; j < this.nCols; j++)
		{
			var cell = this.cells[i][j];
			Griddl.Widgets.ReconcileBox(cell.box, {wd:this.colSizes[j],hg:this.rowSizes[i],lf:this.xs[j],tp:this.ys[i]});
		}
	}
};
Grid.prototype.draw = function() {
	
	// draw cells - the cells draw their fill only - the grid itself handles strokes and the selection box
	this.cells.forEach(cellrow => cellrow.forEach(cell => cell.draw()));
	
	var labelCellStroke = 'rgb(158,182,206)';
	var normalStroke = 'rgb(208,215,229)';
	var selectedStroke = 'rgb(242,149,54)';
	var x0 = this.xs[0];
	var x1 = this.xs[1];
	var y0 = this.ys[0];
	var y1 = this.ys[1];
	var lf = this.box.lf;
	var rt = this.box.rt;
	var tp = this.box.tp;
	var bt = this.box.bt;
	
	var ctx = this.ctx;
	ctx.lineWidth = 1;
	
	// first draw normal strokes
	
	for (var i = 0; i < this.ys.length; i++)
	{
		var y = this.ys[i];
		
		// long strokes
		ctx.strokeStyle = i < 2 ? labelCellStroke : normalStroke;
		ctx.drawLine(lf - 0.5, y - 0.5, rt, y - 0.5);
		
		// short label cell strokes
		ctx.strokeStyle = labelCellStroke;
		ctx.drawLine(x0 - 0.5, y - 0.5, x1, y - 0.5);
	}
	
	for (var i = 0; i < this.xs.length; i++)
	{
		var x = this.xs[i];
		
		// long strokes
		ctx.strokeStyle = i < 2 ? labelCellStroke : normalStroke;
		ctx.drawLine(x - 0.5, tp - 0.5, x - 0.5, bt);
		
		// short label cell strokes
		ctx.strokeStyle = labelCellStroke;
		ctx.drawLine(x - 0.5, y0 - 0.5, x - 0.5, y1);
	}
	
	// then draw selected strokes
	if (this.selected)
	{
		// first draw the short orange strokes on the row and col header cells, 
		if (this.selected.minRow > 0) // so that the selection indicator is not drawn on the title cell when a col label is selected
		{
			ctx.strokeStyle = selectedStroke;
			
			for (var i = this.selected.minRow; i <= this.selected.maxRow + 1; i++)
			{
				var y = this.ys[i];
				ctx.drawLine(x0 - 0.5, y - 0.5, x1, y - 0.5); // short horizontal strokes
			}
			
			var sy0 = this.ys[this.selected.minRow];
			var sy1 = this.ys[this.selected.maxRow + 1];
			
			ctx.drawLine(x0 - 0.5, sy0 - 0.5, x0 - 0.5, sy1); // long vertical strokes
			ctx.drawLine(x1 - 0.5, sy0 - 0.5, x1 - 0.5, sy1);
		}
		
		if (this.selected.minCol > 0) // so that the selection indicator is not drawn on the title cell when a row label is selected
		{
			ctx.strokeStyle = selectedStroke;
			
			for (var i = this.selected.minCol; i <= this.selected.maxCol + 1; i++)
			{
				var x = this.xs[i];
				ctx.drawLine(x - 0.5, y0 - 0.5, x - 0.5, y1); // short vertical strokes
			}
			
			var sx0 = this.xs[this.selected.minCol];
			var sx1 = this.xs[this.selected.maxCol + 1];
			
			ctx.drawLine(sx0 - 0.5, y0 - 0.5, sx1, y0 - 0.5); // long horizontal strokes
			ctx.drawLine(sx0 - 0.5, y1 - 0.5, sx1, y1 - 0.5);
		}
		
		// now draw the thick black selection box
		for (var i = 0; i < this.selected.length; i++)
		{
			var mode = this.selected[i].mode;
			
			var lf = this.xs[this.selected[i].minCol];
			var rt = this.xs[this.selected[i].maxCol + 1];
			var tp = this.ys[this.selected[i].minRow];
			var bt = this.ys[this.selected[i].maxRow + 1];
			var wd = rt - lf;
			var hg = bt - tp;
			
			if (mode == 'Select')
			{
				ctx.fillStyle = 'rgb(0,0,0)';
				ctx.fillRect(lf - 2, tp - 2, wd + 1, 3); // tp
				ctx.fillRect(rt - 2, tp - 2, 3, hg - 2); // rt
				ctx.fillRect(lf - 2, bt - 2, wd - 2, 3); // bt
				ctx.fillRect(lf - 2, tp - 2, 3, hg + 1); // lf
				ctx.fillRect(rt - 3, bt - 3, 5, 5); // handle square
			}
			else if (mode == 'Point')
			{
				// Point - if highlighted, draw a second outline 1px interior to the first outline
				
				ctx.strokeStyle = this.selected[i].color;
				ctx.drawLine(lf, tp, rt, tp);
				ctx.drawLine(rt, tp, rt, bt);
				ctx.drawLine(lf, bt, rt, bt);
				ctx.drawLine(lf, tp, lf, bt);
				
				ctx.fillStyle = this.selected[i].color;
				// draw the handle square
				//if (border.NW == 1) { FillRect(lf - 1, tp - 1, lf + 3, tp + 3); } // inclusive on both ends
				//if (border.NE == 1) { FillRect(rt - 3, tp - 1, rt + 1, tp + 3); }
				//if (border.SE == 1) { FillRect(rt - 3, bt - 3, rt + 1, bt + 1); }
				//if (border.SW == 1) { FillRect(lf - 1, bt - 3, lf + 3, bt + 1); }
			}
			
			if (this.selected[i].shimmer)
			{
				
			}
		}
	}
	
	if (this.scrollbars) { this.scrollbars.forEach(scrollbar => scrollbar.draw()); }
	if (this.multicells) { this.multicells.forEach(multicell => multicell.draw()); }
};
Grid.prototype.onmousemove = function(e) {
	
	var mx = e.offsetX;
	var my = e.offsetY;
	
	var grid = this;
	
	var xMin = this.xs[0];
	var xMax = this.xs[this.xs.length - 1];
	var yMin = this.ys[0];
	var yMax = this.ys[this.ys.length - 1];
	
	if (mx < xMin || mx > xMax || my < yMin || my > yMax) { this.dehover(); return; } // to be superseded by box
	
	var x0 = this.xs[0];
	var x1 = this.xs[1];
	var y0 = this.ys[0];
	var y1 = this.ys[1];
	
	// move grid
	//if ((y0 - 1 <= my && my <= y0 + 1 && x0 <= mx && mx < x1) || (x0 - 1 <= mx && mx <= x0 + 1 && y0 <= my && my < y1)) // top and left borders of the title cell only
	if ((y0 - 1 <= my && my <= y0 + 1 && xMin <= mx && mx <= xMax) || (x0 - 1 <= mx && mx <= x0 + 1 && yMin <= my && my <= yMax)) // top and left borders of entire grid
	{
		this.ctx.canvas.style.cursor = 'move';
		return;
	}
	
	// row resize
	if (x0 < mx && mx < x1)
	{
		for (var i = 0; i < this.nRows; i++)
		{
			var y = this.ys[i + 1];
			
			if (y - 1 <= my && my <= y + 1)
			{
				this.ctx.canvas.style.cursor = 'row-resize';
				var prevY = this.ys[i];
				var rowResizeIndex = i;
				
				this.ctx.canvas.onmousedown = function(e) {
					
					grid.ctx.canvas.onmousemove = function(e) {
						var currY = e.offsetY;
						grid.rowSizes[rowResizeIndex] = Math.max(currY - prevY, 2);
						grid.position();
						grid.page.draw();
					};
					grid.ctx.canvas.onmouseup = function(e) {
						
						grid.ctx.canvas.onmousemove = function(e) { grid.onmousemove(e); };
						grid.ctx.canvas.onmousedown = null;
						grid.ctx.canvas.onmouseup = null;
					};
				};
				
				return;
			}
		}
	}
	
	// col resize
	if (y0 < my && my < y1)
	{
		for (var j = 0; j < this.nCols; j++)
		{
			var x = this.xs[j + 1];
			
			if (x - 1 <= mx && mx <= x + 1)
			{
				this.ctx.canvas.style.cursor = 'col-resize';
				var prevX = this.xs[j];
				var colResizeIndex = j;
				
				var ColResize = function()
				{
					var currX = e.offsetX;
					this.colSizes[colResizeIndex] = Math.max(currX - prevX, 2);
					// now change subsequent xs
					this.position();
				};
				
				return;
			}
		}
	}
	
	for (var i = 0; i < this.scrollbars.length; i++)
	{
		//var scrollbar = this.scrollbars[i];
		//var target = scrollbar.over(scrollbar);
		//if (target) { return target; }
	}
	
	var hovered = grid.pointToRowCol(mx, my);
	
	var cell = this.cells[hovered.row][hovered.col];
	this.ctx.canvas.style.cursor = 'cell';
	
	this.ctx.canvas.onmousedown = function(e) {
		
		var ax = e.offsetX;
		var ay = e.offsetY;
		
		grid.anchor = grid.pointToRowCol(ax, ay);
		grid.cursor = grid.pointToRowCol(ax, ay);
		
		grid.selected = []; // don't clear existing selections if Ctrl is down
		var selected = {mode:'Select',color:'rgb(0,0,0)',shimmer:false,minCol:grid.anchor.col,maxCol:grid.anchor.col,minRow:grid.anchor.row,maxRow:grid.anchor.row};
		grid.focusSelected = selected;
		grid.selected.push(selected);
		grid.page.draw();
		
		grid.ctx.canvas.onmousemove = function(e) {
			
			var mx = e.offsetX;
			var my = e.offsetY;
			
			if (mx < grid.xs[1] || mx > grid.xs[grid.xs.length - 1]|| my < grid.ys[1] || my > grid.ys[grid.ys.length - 1]) { return; }
			
			grid.cursor = grid.pointToRowCol(mx, my);
			grid.selectRange();
		};
		grid.ctx.canvas.onmouseup = function() {
			grid.setKeyHandles();
			grid.ctx.canvas.onmousemove = function(e) { grid.onmousemove(e); };
			grid.ctx.canvas.onmouseup = null;
		};
	};
};
Grid.prototype.pointToRowCol = function(x, y) {
	
	// find the cell to call .over on by comparing the mouse pos against the gridlines
	
	var row = null;
	var col = null;
	
	// binary search could be used for large grids
	for (var i = 0; i < this.ys.length - 1; i++) { if (this.ys[i] <= y && y <= this.ys[i + 1]) { row = i; } }
	for (var j = 0; j < this.xs.length - 1; j++) { if (this.xs[j] <= x && x <= this.xs[j + 1]) { col = j; } }
	
	if (row === null || col === null) { throw new Error(); }
	
	return { row : row , col : col };
};
Grid.prototype.onhover = function() {
	
	var grid = this;
	this.ctx.canvas.onmousemove = function(e) { grid.onmousemove(e); }
};
Grid.prototype.dehover = function() {
	this.ctx.canvas.style.cursor = 'default';
	this.ctx.canvas.onmousedown = null;
	this.ctx.canvas.onmousemove = null;
	this.page.onhover(); // until superseded by this line in box.dehover or whatever, somewhere in box
};
Grid.prototype.onfocus = function() {
	
	//if (globals.logging) { globals.log.push("OnFocusGrid " + grid["[id]"].toString()); }
	
	globals.focussed = grid;
	grid.focusSelected = grid.selected[0]; // does this always work?
	
	//grid.cursor.row = 0;
	//grid.cursor.col = 0;
	//grid.anchor.row = 0;
	//grid.anchor.col = 0;
	//grid.focusSelected.minRow = 0;
	//grid.focusSelected.maxRow = 0;
	//grid.focusSelected.minCol = 0;
	//grid.focusSelected.maxCol = 0;
	
	//Push("Up", MoveActiveUp);
	//Push("Down", MoveActiveDown);
	//Push("Enter", MoveActiveDown);
	//Push("Right", MoveActiveRight);
	//Push("Left", MoveActiveLeft);
	//Push("Shift+Up", ExtendSelectionUp);
	//Push("Shift+Down", ExtendSelectionDown);
	//Push("Shift+Right", ExtendSelectionRight);
	//Push("Shift+Left", ExtendSelectionLeft);
	//Push("Ctrl+Up", MoveActiveAllTheWayUp);
	//Push("Ctrl+Down", MoveActiveAllTheWayDown);
	//Push("Ctrl+Right", MoveActiveAllTheWayRight);
	//Push("Ctrl+Left", MoveActiveAllTheWayLeft);
	//Push("Shift+Ctrl+Up", ExtendSelectionAllTheWayUp);
	//Push("Shift+Ctrl+Down", ExtendSelectionAllTheWayDown);
	//Push("Shift+Ctrl+Right", ExtendSelectionAllTheWayRight);
	//Push("Shift+Ctrl+Left", ExtendSelectionAllTheWayLeft);
	//Push("Ctrl+Space", SelectWholeCol);
	//Push("Shift+Space", SelectWholeRow);
	//Push("Shift+Ctrl+Space", SelectWholeGrid);
	
	//Push("Alt+H+I+I", InsertCells); // pop-up box with radio buttons for shift direction - r[i]ght, [d]own, [r]ow, [c]ol
	//Push("Alt+H+I+R", InsertRows);
	//Push("Alt+H+I+C", InsertCols);
	//Push("Alt+H+I+S", InsertSheet);
	//Push("Alt+H+D+I", DeleteCells); // pop-up box with radio buttons for shift direction - r[i]ght, [d]own, [r]ow, [c]ol
	//Push("Alt+H+D+R", DeleteRows);
	//Push("Alt+H+D+C", DeleteCols);
	//Push("Alt+H+D+S", DeleteSheet);
	//Push("Alt+H+O+H", ChangeRowHeight); // excel uses a pop-up box here
	//Push("Alt+H+O+A", AutofitRowHeight);
	//Push("Alt+H+O+W", ChangeColWidth); // excel uses a pop-up box here
	//Push("Alt+H+O+I", AutofitColWidth);
	//Push("Alt+H+O+D", DefaultWidth);
	//Push("Alt+H+S+S", SortAZ);
	//Push("Alt+H+S+O", SortZA);
	//Push("Alt+H+S+U", SortCustom);
	//Push("Alt+H+S+F", Filter);
	//Push("Alt+H+S+C", Clear); // never used this
	//Push("Alt+H+S+Y", Reapply); // never used this
	
	//Push("Alt+H+O+R", RenameSheet); // wait, rename can be used for objs and fields too - we could repurpose 'Insert' as the rename button
	//Push("Insert", Rename);
};
Grid.prototype.defocus = function() {
	
	//if (globals.logging) { globals.log.push("DeFocusGrid " + grid["[id]"].toString()); }
	
	globals.focussed = null;
	grid.focusSelected = null;
	
	grid.selected[0].minCol = null;
	grid.selected[0].maxCol = null;
	grid.selected[0].minRow = null;
	grid.selected[0].maxRow = null;
	
	//Pop("Up");
	//Pop("Down");
	//Pop("Enter");
	//Pop("Right");
	//Pop("Left");
	//Pop("Shift+Up");
	//Pop("Shift+Down");
	//Pop("Shift+Right");
	//Pop("Shift+Left");
	//Pop("Ctrl+Up");
	//Pop("Ctrl+Down");
	//Pop("Ctrl+Right");
	//Pop("Ctrl+Left");
	//Pop("Shift+Ctrl+Up");
	//Pop("Shift+Ctrl+Down");
	//Pop("Shift+Ctrl+Right");
	//Pop("Shift+Ctrl+Left");
	//Pop("Ctrl+Space");
	//Pop("Shift+Space");
	//Pop("Shift+Ctrl+Space");
};
Grid.prototype.onedit = function() {
	
	Push("Enter", AcceptEditWithEnter);
	Push("Tab", AcceptEditAndMoveRight);
	Push("Esc", RejectEdit);
	
	// the progression of point colors:
	var colors = [];
	colors[0] = "rgb(0,0,255)";
	colors[1] = "rgb(0,128,0)";
	colors[2] = "rgb(153,0,204)";
	colors[3] = "rgb(128,0,0)";
	colors[4] = "rgb(0,204,51)";
	colors[5] = "rgb(255,102,0)";
	colors[6] = "rgb(204,0,153)";
	
	var pointSelect = MakeObj(this.selected, "1");
	this.selected[1] = pointSelect;
	pointSelect.mode = "Point";
	pointSelect.color = colors[0];
	pointSelect.shimmer = false;
	pointSelect.minCol = null;
	pointSelect.maxCol = null;
	pointSelect.minRow = null;
	pointSelect.maxRow = null;
	this.focusSelected = pointSelect;
};
Grid.prototype.deedit = function() {
	// unhandle keyboard stuff
	this.focusSelected = this.selected[0];
};
Grid.prototype.selectActive = function() {
	this.anchor.row = this.cursor.row;
	this.anchor.col = this.cursor.col;
	this.focusSelected.minCol = this.cursor.col;
	this.focusSelected.maxCol = this.cursor.col;
	this.focusSelected.minRow = this.cursor.row;
	this.focusSelected.maxRow = this.cursor.row;
	this.page.draw();
};
Grid.prototype.selectRange = function() {
	this.focusSelected.minCol = Math.min(this.anchor.col, this.cursor.col);
	this.focusSelected.maxCol = Math.max(this.anchor.col, this.cursor.col);
	this.focusSelected.minRow = Math.min(this.anchor.row, this.cursor.row);
	this.focusSelected.maxRow = Math.max(this.anchor.row, this.cursor.row);
	this.page.draw();
};
Grid.prototype.getSelectedCells = function() {
	
	var cells = [];
	
	for (var k = 0; k < this.selected.length; k++)
	{
		if (this.selected[k].mode == "Select")
		{
			var selection = this.selected[k];
			
			for (var j = selection.minCol; j <= selection.maxCol; j++)
			{
				for (var i = selection.minRow; i <= selection.maxRow; i++)
				{
					cells.push(this.cells[i][j]);
				}
			}
		}
	}
	
	return cells;
};
Grid.prototype.scroll = function(strRowsOrCols, intNewStart) {
	
	if (globals.logging)
	{
		globals.log.push("ScrollGrid " + grid["[id]"].toString());
	}
	
	// none of this works since making cells non-retargetable
	
	// what we should do is change objs or fields and then regenerate all cells
	
	throw new Error();
	
	var data = Get(grid.obj);
	
	for (var j = 0; j < grid.cols.length; j++)
	{
		for (var i = 0; i < grid.rows.length; i++)
		{
			var cell = grid.cells[(j + 1) * grid.nRows + (i + 1)];
			
			if (strRowsOrCols == "rows")
			{
				if (grid.rowsAre == "objs")
				{
					// since getting rid of the concept of retargetable cell pointers, we have to rework this function
					// basically we're just reassigning cell.slot
					// one problem we have here is that we don't have a cached starting index for both rows/cols - we need this
					// then we can just use something like the line below to retarget the cells
					cell.slot = Get(data[grid.objs[intNewStart + i]])[grid.flds[intNewStart + i]];
				}
				else
				{
					cell.slot = grid.flds[intNewStart + i];
				}
			}
			else
			{
				if (grid.rowsAre == "fields")
				{
					cell.slot = data[grid.objs[intNewStart + j]];
				}
				else
				{
					cell.slot = grid.flds[intNewStart + j];
				}
			}
		}
	}
	
	if (strRowsOrCols == "rows")
	{
		for (var i = 0; i < grid.rows.length; i++)
		{
			var cell = grid.GetCell(i + 1, 0);
			var slot = cell.slot;
			var label = grid.rows[intNewStart + i];
			Set(slot, label);
		}
	}
	else
	{
		for (var j = 0; j < grid.cols.length; j++)
		{
			var cell = grid.GetCell(grid.nRows, j + 1);
			var slot = cell.slot;
			var label = grid.cols[intNewStart + j];
			Set(slot, label);
		}
	}
	
	// redisplay each grid cell
	var c = 0;
	
	for (var j = 0; j < grid.nCols; j++)
	{
		for (var i = 0; i < grid.nRows; i++)
		{
			var cell = grid.GetCell(i, j);
			cell.redisplay(cell);
			cell.position(cell);
		}
	}
	
	globals.redraw = true;
};
Grid.prototype.setKeyHandles = function() {
	
	var grid = this;
	
	grid.ctx.canvas.focus();
	grid.ctx.canvas.onkeydown = function(e) {
		
		e.preventDefault();
		e.stopPropagation();
		
		var key = e.keyCode;
		console.log(key);
		
		var min = 1; // set this to 0 to allow selection of row/col headers
		
		if (key == 16) // shift
		{
			
		}
		else if (key == 17) // ctrl
		{
			
		}
		else if (key == 18) // alt
		{
			
		}
		else if (key == 27) // esc
		{
			grid.selected = [];
			grid.focusSelected = null;
			grid.cursor.row = null;
			grid.cursor.col = null;
			grid.anchor.row = null;
			grid.anchor.col = null;
			grid.page.draw();
			// also disable key handler
		}
		else if (key == 32) // space
		{
			if (e.ctrlKey && e.shiftKey) // this is different from Excel
			{
				grid.focusSelected.minRow = min;
				grid.focusSelected.maxRow = grid.nRows - 1;
				grid.focusSelected.minCol = min;
				grid.focusSelected.maxCol = grid.nCols - 1;
				grid.page.draw(); // note that this does not go through selectRange(), which is unaesthetic
				// although it's because we don't know what actually happens to the anchor or cursor here - the cursor can end up in the middle of a selected range
			}
			else if (e.shiftKey)
			{
				grid.focusSelected.minCol = min;
				grid.focusSelected.maxCol = grid.nCols - 1;
				grid.page.draw();
			}
			else if (e.ctrlKey)
			{
				grid.focusSelected.minRow = min;
				grid.focusSelected.maxRow = grid.nRows - 1;
				grid.page.draw();
			}
			else
			{
				// edit cell
				var input = $(document.createElement('input'));
				input.attr('type', 'text');
				input.css('position', 'absolute');
				input.css('top', grid.ys[grid.cursor.row + 1].toString() + 'px');
				input.css('left', grid.xs[grid.cursor.col].toString() + 'px');
				input.css('height', grid.rowSizes[grid.cursor.row].toString() + 'px');
				input.css('width', grid.colSizes[grid.cursor.col].toString() + 'px');
				$(grid.ctx.canvas).parent().append(input);
			}
		}
		else if (key == 37 || key == 38 || key == 39 || key == 40) // arrow
		{
			if (key == 37) // left
			{
				if (e.ctrlKey)
				{
					grid.cursor.col = min;
				}
				else
				{
					if (grid.cursor.col > min) { grid.cursor.col--; }
				}
			}
			else if (key == 38) // up
			{
				if (e.ctrlKey)
				{
					grid.cursor.row = min;
				}
				else
				{
					if (grid.cursor.row > min) { grid.cursor.row--; }
				}
			}
			else if (key == 39) // right
			{
				if (e.ctrlKey)
				{
					grid.cursor.col = grid.nCols - 1;
				}
				else
				{
					if (grid.cursor.col < grid.nCols - 1) { grid.cursor.col++; }
				}
			}
			else if (key == 40) // down
			{
				if (e.ctrlKey)
				{
					grid.cursor.row = grid.nRows - 1;
				}
				else
				{
					if (grid.cursor.row < grid.nRows - 1) { grid.cursor.row++; }
				}
			}
			
			if (e.shiftKey)
			{
				grid.selectRange();
			}
			else
			{
				grid.selectActive();
			}
		}
		else if (key >= 65 && key <= 90) // A-Z
		{
			
		}
		else if (key >= 48 && key <= 57) // 0-9
		{
			
		}
		else
		{
			//debugger;
		}
	};
};

var Scrollbar = Widgets.Scrollbar = function(ctx, parent, orientation) {
	
	this.ctx = ctx;
	this.parent = parent;
	this.orientation = orientation;
	
	AddBoxVars(this);
	
	this.handle = {};
	AddBoxVars(this.handle);
};
Scrollbar.prototype.draw = function() {
	
	this.ctx.strokeStyle = 'rgb(158,182,206)';
	this.ctx.fillStyle = 'rgb(128,128,128)';
	this.ctx.strokeRect(this.lf, this.tp, this.wd, this.hg);
	this.ctx.fillRect(this.handle.lf, this.handle.tp, this.handle.wd, this.handle.hg);
};
Scrollbar.prototype.onhover = function() {
	
};

function ToggleTraceGridMode() {
	
	if (globals.traceGridMode)
	{
		globals.canvas.buttons["ToggleTraceGridModeButton"].version = 0;
		ExitTraceGridMode();
		globals.traceGridMode = false;
	}
	else
	{
		globals.canvas.buttons["ToggleTraceGridModeButton"].version = 2;
		EnterTraceGridMode();
		globals.traceGridMode = true;
	}
}
function EnterTraceGridMode() {
	
	var canvas = null;
	canvas.style.cursor = "crosshair";
	
	canvas.onmousedown = function(e) {
		
		var ax = e.offsetX;
		var ay = e.offsetY;
		
		var gridName = "Grid" + (globals.objcounts.grid++).toString();
		var grid = MakeGrid(frame, gridName);
		grid.rowsAre = "objs";
		var dataName = "Obj" + (globals.objcounts.obj++).toString();
		
		canvas.onmousemove = function(e) {
			
			var currX = Get(globals.mx);
			var currY = Get(globals.my);
			
			//globals.log.push(currX.toString() + "  " + currY.toString());
			
			var lf = Math.min(origX, currX);
			var rt = Math.max(origX, currX);
			var tp = Math.min(origY, currY);
			var bt = Math.max(origY, currY);
			
			var wd = rt - lf;
			var hg = bt - tp;
			
			var cols = Math.max(2, Math.floor(wd / 64));
			var rows = Math.max(2, Math.floor(hg / 20));
			
			if (grid.obj) // obj is arbitrary - we just want to see if we have added fields to the grid yet
			{
				if (cols == grid.nCols && rows == grid.nRows)
				{
					return; // so that we only regenerate and redraw if we add/subtract a row or col
				}
			}
			
			var matrix = MakeEmptyMatrix(dataName, cols - 1, rows - 1);
			LoadGrid(frame, grid, matrix);
			
			//var slot = MakeSlot(frame, dataName, null);
			//frame[dataName] = slot;
			//slot.$ = Empties(slot, "$", cols - 1, rows - 1);
			//slot.$["[type]"] = "Collection";
			//SetGridDataSlot(grid, slot);
			//RedisplayGrid(grid);
			
			MoveBox(grid, "top", "height", tp);
			MoveBox(grid, "left", "width", lf);
			grid.position(grid);
			globals.redraw = true;
		};
		
		canvas.onmouseup = function(e) { // also Esc should trigger onmouseup, which is useful if the mouseup event is dropped
			canvas.onmousemove = null;
			canvas.onmouseup = null;
			canvas.style.cursor = "default";
		};
	};
}

function MakeEmptyMatrix(dataName, cols, rows) {
	
	var matrix = []; // since this must match the matrix gleaned from a script, rows must be first
	
	var toprow = [];
	toprow.push(dataName);
	for (var j = 0; j < cols; j++) { toprow.push(ToLetter(j)); }
	matrix.push(toprow);
	
	for (var i = 0; i < rows; i++)
	{
		var row = [];
		row.push(i.toString());
		for (var j = 0; j < cols; j++) { row.push("null"); }
		matrix.push(row);
	}
	
	return matrix;
}
function ToLetter(n) { return String.fromCharCode(n + 65); }

function SelectNewActive(grid) {
	
	grid.anchor.row = grid.cursor.row;
	grid.anchor.col = grid.cursor.col;
	
	if (grid.focusSelected == grid.selected[0])
	{
		SelectThis(grid.GetCell(grid.cursor.row, grid.cursor.col));
	}
	
	var selected = grid.focusSelected;
	
	selected.minCol = grid.cursor.col;
	selected.maxCol = grid.cursor.col;
	selected.minRow = grid.cursor.row;
	selected.maxRow = grid.cursor.row;
	
	if (grid.focusSelected.mode == "Point")
	{
		var cell = globals.beingEdited;
		
		if (cell.prepoint && cell.prepoint != cell.cursor) // if we have a current point string, delete it (it will be immediately regenerated below)
		{
			cell.string = cell.string.substr(0, cell.prepoint + 1);
			cell.cursor = cell.prepoint;
			RegenerateChars(cell);
			ResetCursor();
		}
		
		cell.prepoint = cell.cursor;
		
		var str = "";
		str += Get(grid.nameslot);
		str += ".";
		
		if (grid.rowsAre == "objs")
		{
			str += Get(grid.objnameslots[grid.cursor.row - 1]);
			str += ".";
			str += Get(grid.fldnameslots[grid.cursor.col - 1]);
		}
		else
		{
			str += Get(grid.objnameslots[grid.cursor.col - 1]);
			str += ".";
			str += Get(grid.fldnameslots[grid.cursor.row - 1]);
		}
		
		AddText(str);
		
		// color the text?
	}
	
	globals.redraw = true;
}

function InsertRows() {
	
	var grid = globals.focussed;
	
	var minRow = grid.selected[0].minRow;
	var maxRow = grid.selected[0].maxRow;
	var nNewRows = maxRow - minRow + 1;
	
	if (minRow == 0) { return; } // it makes no sense to add a new header
	
	// to be filled by InsertObjs/InsertFlds - to be used by the code that inserts cells below
	var newnameslots = [];
	var newdataslots = []; // we want Slot[row][col] when it is returned from InsertObjs/InsertFlds
	
	if (grid.rowsAre == "objs")
	{
		InsertObjs(grid, minRow, maxRow, newnameslots, newdataslots);
	}
	else
	{
		InsertFlds(grid, minRow, maxRow, newnameslots, newdataslots);
	}
	
	// cells
	for (var i = maxRow; i >= minRow; i--) // reversed so that earlier InsertAt's don't interfere with later ones
	{
		for (var j = grid.nCols - 1; j >= 0; j--) // reversed so that earlier InsertAt's don't interfere with later ones
		{
			var index = j * grid.nRows + i; // see 'cell numbering in InsertRows.png' for an explanation
			var cell = MakeCell(grid.cells, null);
			
			if (j == 0)
			{
				SetCellSlot(cell, newnameslots[i - minRow]);
			}
			else
			{
				SetCellSlot(cell, newdataslots[i - minRow][j - 1]); // the form required here is newdataslots[row][col].  we are obj/fld-agnostic here
			}
			
			CopyStyle(grid.cells[index], cell); // grid.cells[index] right now refers to the cell this cell will be replacing
			InsertAt(cell, grid.cells, index); // all cells' [name] changed below in PostInsertDelete()
		}
	}
	
	// rowSizes, ys, nRows
	var newRowSizeSlots = [];
	for (var i = 0; i < nNewRows; i++) { newRowSizeSlots.push(MakeSlot(null, null, Get(grid.rowSizes[minRow + i]))); }
	InsertObjsIntoList(grid.rowSizes, newRowSizeSlots, minRow);
	var newYsSlots = [];
	for (var i = 0; i < nNewRows; i++) { newYsSlots.push(MakeSlot(null, null, 0)); }
	InsertObjsIntoList(grid.ys, newYsSlots, minRow);
	for (var i = minRow; i < grid.ys.length; i++) { Set(grid.ys[i], Get(grid.ys[i - 1]) + Get(grid.rowSizes[i - 1])); }
	grid.nRows += nNewRows;
	
	PostInsertDelete(grid);
}
function InsertCols() {
	
	var grid = globals.focussed;
	
	var minCol = grid.selected[0].minCol;
	var maxCol = grid.selected[0].maxCol;
	var nNewCols = maxCol - minCol + 1;
	
	if (minCol == 0) { return; } // it makes no sense to add a new header
	
	// to be filled by InsertObjs/InsertFlds - to be used by the code that inserts cells below
	var newnameslots = [];
	var newdataslots = []; // we want Slot[row][col] when it is returned from InsertObjs/InsertFlds
	
	if (grid.rowsAre == "objs")
	{
		InsertFlds(grid, minCol, maxCol, newnameslots, newdataslots);
	}
	else
	{
		InsertObjs(grid, minCol, maxCol, newnameslots, newdataslots);
	}
	
	// cells (to do: revise to cols)
	for (var j = maxCol; j >= minCol; j--) // reversed so that earlier InsertAt's don't interfere with later ones
	{
		for (var i = grid.nRows - 1; i >= 0; i--) // reversed so that earlier InsertAt's don't interfere with later ones
		{
			var index = j * grid.nRows + i; // see 'cell numbering in InsertRows.png' for an explanation
			var cell = MakeCell(grid.cells, null);
			
			if (i == 0)
			{
				SetCellSlot(cell, newnameslots[j - minCol]);
			}
			else
			{
				SetCellSlot(cell, newdataslots[i - 1][j - minCol]); // structural difference from InsertRows - the indices are reversed
			}
			
			CopyStyle(grid.cells[index], cell); // grid.cells[index] right now refers to the cell this cell will be replacing
			InsertAt(cell, grid.cells, index); // all cells' [name] changed below in PostInsertDelete()
		}
	}
	
	// colSizes, xs, nCols
	var newColSizeSlots = [];
	for (var j = 0; j < nNewCols; j++) { newColSizeSlots.push(MakeSlot(null, null, Get(grid.colSizes[minCol + j]))); }
	InsertObjsIntoList(grid.colSizes, newColSizeSlots, minCol);
	var newXsSlots = [];
	for (var j = 0; j < nNewCols; j++) { newXsSlots.push(MakeSlot(null, null, 0)); }
	InsertObjsIntoList(grid.xs, newXsSlots, minCol);
	for (var j = minCol; j < grid.xs.length; j++) { Set(grid.xs[j], Get(grid.xs[j - 1]) + Get(grid.colSizes[j - 1])); }
	grid.nCols += nNewCols;
	
	PostInsertDelete(grid);
}
function InsertObjs(grid, min, max, newnameslots, newdataslots) {
	
	var data = Get(grid.obj);
	var nameslots = [];
	var obj = null;
	
	for (var i = min; i <= max; i++)
	{
		var name = Nonce(data, "_");
		var slot = MakeSlot(data, name, null);
		data[name] = slot;
		obj = MakeObj(slot, "$");
		slot.$ = obj;
		
		var newdataslotsublist = [];
		
		for (var j = 0; j < grid.flds.length; j++)
		{
			var dataslot = MakeSlot(obj, grid.flds[j], null);
			obj[grid.flds[j]] = dataslot;
			newdataslotsublist.push(dataslot);
		}
		
		newdataslots.push(newdataslotsublist);
		
		var nameslot = MakeSlot(null, null, name);
		nameslots.push(nameslot);
		newnameslots.push(nameslot);
		
		InsertAt(name, grid.objs, min);
	}
	
	InsertObjsIntoList(grid.objnameslots, nameslots, min);
}
function InsertFlds(grid, min, max, newnameslots, newdataslots) {
	
	//// add a new field to each object
	//
	//grid.flds = EnumLetter(grid.flds.length + 1); // regenerate the fields as a whole - use EnumLetter if appropriate
	//grid.rows = grid.flds;
	//
	//for (var j = 0; j < grid.objs.length; j++)
	//{
	//	for (var k = grid.flds.length - 1; k > row; k--)
	//	{
	//		data[grid.objs[j]][grid.flds[k]] = data[grid.objs[j]][grid.flds[k - 1]]; // copy the existing fields to a one-greater index
	//	}
	//}
	//
	//for (var j = 0; j < grid.objs.length; j++)
	//{
	//	data[grid.objs[j]][grid.flds[row]] = MakeSlot(data[grid.objs[j]], grid.flds[row], null); // and finally add a new field to each object
	//}
}
function DeleteRows() {
	
	if (grid.rowsAre == "objs")
	{
		DeleteObjs();
	}
	else
	{
		DeleteFlds();
	}
}
function DeleteCols() {
	
	if (grid.rowsAre == "objs")
	{
		DeleteFlds();
	}
	else
	{
		DeleteObjs();
	}
}
function DeleteObjs(names) {
	
	var grid = globals.focussed;
	var data = Get(grid.obj);
	
	delete data[name];
	
	// also perhaps delete the proper objnameslot
}
function DeleteFlds(names) {
	
	var grid = globals.focussed;
	var data = Get(grid.obj);
	
	for (var i = 0; i < grid.objs.length; i++)
	{
		var objname = grid.objs[i];
		var obj = data[objname];
		delete obj[name];
	}
	
	// also perhaps delete the proper fldnameslot
}
function PostInsertDelete(grid) {
	
	var c = 0;
	
	// rename and renumber all cells
	for (var i = 0; i < grid.nRows; i++)
	{
		for (var j = 0; j < grid.nCols; j++)
		{
			var cell = grid.GetCell(i, j);
			cell.container = grid;
			cell.row = i;
			cell.col = j;
			cell["[name]"] = c.toString(); // can we name cells [i,j]? - but then that's how we'd have to index them
			cell.redisplay(cell);
			c++;
		}
	}
	
	grid.position(grid);
	globals.redraw = true;
}
function CopyStyle(srcCell, dstCell) {
	dstCell.fill = srcCell.fill;
	dstCell.stroke = srcCell.stroke;
}

var Cell = Widgets.Cell = function(ctx, parent) {
	
	this.ctx = ctx;
	this.parent = parent;
	
	this.formula = null;
	
	this.dataObj = null;
	this.dataField = null;
	this.data = null;
	this.string = null;
	this.datatype = null;
	
	this.box = {};
	Griddl.Widgets.AddBoxVars(this.box);
	
	this.font = '10pt Courier New';
	this.cellFill = 'rgb(255,255,255)';
	this.textFill = 'rgb(0,0,0)';
	this.textAlign = 'left';
	this.textBaseline = ''; // alphabetic?
	this.margin = 3;
	this.baseMargin = 7;
	
	this.width = 64;
	this.height = 20;
};
Cell.prototype.setData = function(dataObj, dataField) {
	
	this.dataObj = dataObj;
	this.dataField = dataField;
	this.data = dataObj[dataField];
	this.string = this.data.toString();
	this.textAlign = typeof(this.data) == 'number' ? 'right' : 'left';
};
Cell.prototype.draw = function() {
	
	this.ctx.fillStyle = this.cellFill;
	this.ctx.fillRect(this.box.lf, this.box.tp, this.box.wd, this.box.hg);
	this.ctx.fillStyle = this.textFill;
	
	this.ctx.font = this.font;
	this.ctx.textAlign = this.textAlign;
	
	if (this.textAlign == 'right')
	{
		this.ctx.fillText(this.string, this.box.rt - this.margin, this.box.bt - this.baseMargin);
	}
	else if (this.textAlign == 'center')
	{
		this.ctx.fillText(this.string, this.box.cx, this.box.bt - this.baseMargin);
	}
	else if (this.textAlign == 'left')
	{
		this.ctx.fillText(this.string, this.box.lf + this.margin, this.box.bt - this.baseMargin);
	}
	else
	{
		throw new Error();
	}
};
Cell.prototype.valueToString = function() {
	
	var value = this.data;
	this.datatype = typeof(value);
	
	if (value == null)
	{
		cell.string = "";
	}
	else if (this.datatype == "number")
	{
		var n = Get(cell.numberFormat);
		
		if (n < 0)
		{
			n = 0;
		}
		
		if (n > 20)
		{
			n = 20;
		}
		
		cell.string = value.toFixed(n);
	}
	else if (this.datatype == "string")
	{
		cell.string = cell.tostring(value); // apply formatting here - note that when you want to edit, use the raw toString()
	}
	else if (this.datatype == "object")
	{
		if (value.forEach)
		{
			cell.string = "[Array]";
		}
		else
		{
			cell.string = cell.slot.formula;
			//cell.string = cell.tostring(value); // apply formatting here - note that when you want to edit, use the raw toString()
		}
	}
	else if (this.datatype == "boolean")
	{
		cell.string = value.toString();
	}
	else if (this.datatype == "function")
	{
		cell.string = value.name;
	}
	else // undefined, presumably
	{
		cell.string = cell.slot.formula;
		//cell.string = "";
	}
};

function RegenerateChars(cell) {
	
	cell.contents = MakeList(cell, "contents");
	
	//var removeReturns = "";
	//
	//for (var i = 0; i < cell.string.length; i++)
	//{
	//	if (cell.string[i] == '\r')
	//	{
	//	
	//	}
	//	else
	//	{
	//		removeReturns += cell.string[i];
	//	}
	//}
	//
	//cell.string = removeReturns;
	
	for (var i = 0; i < cell.string.length; i++)
	{
		var c = MakeObj(cell.contents, cell.contents.length.toString());
		cell.contents.push(c);
		c.c = cell.string[i];
		c.draw = DrawText;
		//c.over = OverBox;
		c.cell = cell;
		c.type = "text";
		//c.font = "10pt Courier New";
		//c.font = "11pt Consolas";
		c.font = "11pt Calibri"; // this is what Excel uses - needs to be kerned properly though
		c.stroke = null;
		c.fill = cell.textFill;
		c.width = null;
		c.height = null;
		c.left = null;
		c.top = null;
		c.right = null;
		c.bottom = null;
		c.wr = null;
		c.hr = null;
		c.cx = null;
		c.cy = null;
		c.scale = null;
		
		if (cell.valueType == "number" && IsDigit(c.c))
		{
			c.onhover = OnHoverDigit;
			c.dehover = DeHoverDigit;
		}
		else
		{
			c.onhover = OnHoverNonDigit;
			c.dehover = DeHoverNonDigit;
		}
	}
	
	// assign scale
	if (cell.valueType == "number") // and if the cell is not a formula cell
	{
		var decimalPointFound = false;
		
		for (var i = 0; i < cell.contents.length; i++)
		{
			if (cell.contents[i].c == ".") // first find the decimal place
			{
				var scale = 1;
				
				for (var k = i - 1; k >= 0; k--)
				{
					cell.contents[k].scale = scale;
					scale *= 10;
				}
				
				scale = 0.1;
				
				for (var k = i + 1; k < cell.contents.length; k++)
				{
					cell.contents[k].scale = scale;
					scale /= 10;
				}
				
				decimalPointFound = true;
				break;
			}
		}
		
		if (!decimalPointFound)
		{
			var scale = 1;
			
			for (var k = cell.contents.length - 1; k >= 0; k--)
			{
				cell.contents[k].scale = scale;
				scale *= 10;
			}
		}
	}
}
function PositionCell(cell) {
	
	var left = Get(cell.left);
	var top = Get(cell.top);
	var right = Get(cell.right);
	var bottom = Get(cell.bottom) + 1; // this is some horrible grid/cell/whatever hack
	
	// the assumption here is normal English text flow - this should be generalized later
	var hpos = left + 2;
	var vpos = top + 1;
	
	var g = globals.g;
	
	// here would be a good time to set invisible/visible flags for overflow situations
	
	// a cell always references the full number of char shapes - the char shapes always exist, they are just sometimes invisible
	
	// which means, cell.contents.length ALWAYS equals cell.string.length
	
	for (var i = 0; i < cell.contents.length; i++)
	{
		var c = cell.contents[i];
		
		if (c.c == '\n')
		{
			hpos = left + 2;
			vpos += 19;
			
			// for cursor placement
			c.right = left + 2;
			c.top = vpos;
			c.bottom = c.top + 19;
			
			c.invisible = true;
		}
		else if (c.c == '\r')
		{
			c.invisible = true; // i'm thinking of banning \r's from our strings - because then cursor movement with arrow keys becomes strange
		}
		else if (c.c == '\t')
		{
			hpos += 30; // 15 is rather arbitrary - also, this completely ignores the concept of tab stops
			
			// for cursor placement
			c.right = hpos;
			c.top = vpos;
			c.bottom = c.top + 19;
			
			c.invisible = true;
		}
		else
		{
			g.font = c.font;
			c.width = g.measureText(c.c).width;
			c.height = 19;
			
			c.left = hpos;
			c.right = c.left + c.width;
			
			if (c.right >= right - 1) // overflow
			{
				hpos = left + 2;
				vpos += c.height;
				c.left = hpos;
				c.right = c.left + c.width;
			}
			
			c.top = vpos;
			c.bottom = c.top + c.height;
			
			// we don't use slots for char coords because that would be too many slots
			// these fields, wr, hr, cx, cy, are probably not even necessary
			// and width and height may not be necessary except as local variables in this here function
			//c.wr = c.width / 2;
			//c.hr = c.height / 2;
			c.cx = c.left + c.width / 2; // but we need this for cursor placement
			//c.cy = c.top + c.hr;
			
			if (c.left <= left || c.right >= right || c.top <= top || c.bottom >= bottom)
			{
				c.invisible = true;
			}
			else
			{
				c.invisible = false;
			}
			
			hpos += c.width;
		}
	}
	
	globals.redraw = true;
}

function OnHoverDigit(c) {
	
	c.cell.onhover(c.cell);
	c.oldFill = c.fill;
	c.fill = "rgb(255,0,0)";
	globals.redraw = true;
	
	var Scroll = function()
	{
		var cell = c.cell;
		var slot = cell.slot;
		
		var newValue = Get(slot) + globals.delta * c.scale;
		slot.formula = newValue.toString(); // wait, so a scroll overrides a formula?  be careful...
		Set(slot, newValue); 
		
		cell.redisplay(cell);
		cell.position(cell);
		
		// synthesize a new mousemove because the underlying hover has changed (the char has regenerated)
		//Event("MM");
		
		globals.redraw = true;
	};
	
	Push("MW", Scroll);
}
function DeHoverDigit(c) {
	c.cell.dehover(c.cell);
	c.fill = c.oldFill;
	globals.redraw = true;
	delete c.oldFill;
	Pop("MW");
}
function PrimeScrub() {
	var Scrub = function()
	{
		Set(globals.fmx, Get(globals.mx));
		
		var cell = null;
		
		if (globals.hovered.type == "char")
		{
			cell = globals.hovered.cell;
		}
		else if (globals.hovered.type == "cell")
		{
			cell = globals.hovered;
		}
		
		globals.scrubOrigValue = Get(cell.slot);
	
		globals.scrubScale = 1;
	
		var scrubValue = globals.scrubOrigValue + globals.scrubScale * (Get(globals.mx) - Get(globals.fmx));
		
		Set(cell.slot, scrubValue);
		
		cell.redisplay(cell);
	};
	
	Push("MM", Scrub);
}
function IsDigit(c) {
	if (c == "0" || c == "1" || c == "2" || c == "3" || c == "4" || c == "5" || c == "6" || c == "7" || c == "8" || c == "9")
	{
		return true;
	}
	else
	{
		return false;
	}
}




// Box.childrenFields = [ 'controls' , 'key' ] - this tells us the fields where we find sub-boxes

function Drag(obj, ax, ay) {
	
	obj.ctx.canvas.onmousemove = function(e) {
		
		var mx = e.offsetX;
		var my = e.offsetY;
		
		var dx = mx - ax;
		var dy = my - ay;
		
		obj.lf += dx;
		obj.cx += dx;
		obj.rt += dx;
		obj.tp += dy;
		obj.cy += dy;
		obj.bt += dy;
		
		ax = mx;
		ay = my;
		
		obj.draw();
	};
	obj.ctx.canvas.onmouseup = function(e) {
		obj.ctx.canvas.onmousemove = null;
		obj.ctx.canvas.onmouseup = null;
		obj.draw();
	};
}

// Box is primarily for top-level, movable widgets.  it should probably not be necessary for sub-widgets
// which means that BarChart should govern the onhover and dehover of its Controls, not the Controls themselves
// a Control won't have an associated Box, of course
var Box = Widgets.Box = function(ctx, obj) {
	
	this.ctx = ctx;
	this.obj = obj;
	
	this.x = 0;
	this.y = 0;
	this.hAlign = 'center';
	this.vAlign = 'center';
	
	this.lf = 0;
	this.cx = 0;
	this.rt = 0;
	this.wd = 0;
	this.wr = 0;
	this.tp = 0;
	this.cy = 0;
	this.bt = 0;
	this.hg = 0;
	this.hr = 0;
	
	// this is not going be used under the current assumption that a Box is only for top-level, moveable widgets
	this.moveable = false;
	
	this.drawHandles = false;
	this.activeHandle = null;
	this.hoveredHandle = null;
	this.handles = [];
	this.handles.push(new Handle(this.ctx, this, 'left', 'top'));
	this.handles.push(new Handle(this.ctx, this, 'left', 'center'));
	this.handles.push(new Handle(this.ctx, this, 'left', 'bottom'));
	this.handles.push(new Handle(this.ctx, this, 'center', 'top'));
	this.handles.push(new Handle(this.ctx, this, 'center', 'center'));
	this.handles.push(new Handle(this.ctx, this, 'center', 'bottom'));
	this.handles.push(new Handle(this.ctx, this, 'right', 'top'));
	this.handles.push(new Handle(this.ctx, this, 'right', 'center'));
	this.handles.push(new Handle(this.ctx, this, 'right', 'bottom'));
};
Box.prototype.draw = function() {
	if (this.drawHandles) { this.handles.forEach(function(handle) { handle.draw(); }); }
};
Box.prototype.onhover = function() {
	
	//console.log('Box.onhover');
	
	this.drawHandles = true;
	this.draw();
	
	// Box.onmousemove will check for handles and leaving, and then kick the event over to box.obj
	var box = this;
	this.ctx.canvas.onmousemove = function(e) { box.onmousemove(e); };
};
Box.prototype.dehover = function() {
	this.obj.dehover(); // BarChart.dehover() and Image.dehover() is empty. maybe other Widgets will need to put something there?
	this.obj.page.draw();
	this.obj.page.onhover();
};
Box.prototype.onmousemove = function(e) {
	
	var x = e.offsetX;
	var y = e.offsetY;
	
	// check for handles before checking for leaving, because the handles extend slightly outside the box bounds
	for (var i = 0; i < this.handles.length; i++)
	{
		var cx = this.handles[i].x;
		var cy = this.handles[i].y;
		var rr = this.handles[i].r * this.handles[i].r;
		
		var dd = (x - cx) * (x - cx) + (y - cy) * (y - cy);
		
		if (dd < rr)
		{
			if (this.hoveredHandle && this.hoveredHandle != this.handles[i])
			{
				this.hoveredHandle.dehover(); // we'll also do the handle dehovering here
			}
			
			this.hoveredHandle = this.handles[i];
			this.handles[i].onhover();
			return;
		}
	}
	
	if (this.hoveredHandle)
	{
		this.hoveredHandle.dehover(); // we'll also do the handle dehovering here
		this.hoveredHandle = null;
	}
	
	if (x < this.lf || x > this.rt || y < this.tp || y > this.bt)
	{
		this.dehover();
		return;
	}
	
	this.obj.onmousemove(e);
};
Box.prototype.reconcile = function(params) {
	ReconcileBox(this, params);
	this.reconcileHandles();
};
Box.prototype.reconcileHandles = function() {
	
	// change handle x,y
	this.handles[0].x = this.lf;
	this.handles[1].x = this.lf;
	this.handles[2].x = this.lf;
	this.handles[3].x = this.cx;
	this.handles[4].x = this.cx;
	this.handles[5].x = this.cx;
	this.handles[6].x = this.rt;
	this.handles[7].x = this.rt;
	this.handles[8].x = this.rt;
	
	this.handles[0].y = this.tp;
	this.handles[1].y = this.cy;
	this.handles[2].y = this.bt;
	this.handles[3].y = this.tp;
	this.handles[4].y = this.cy;
	this.handles[5].y = this.bt;
	this.handles[6].y = this.tp;
	this.handles[7].y = this.cy;
	this.handles[8].y = this.bt;
	
	var activeIndex = ['left','center','right'].indexOf(this.hAlign) * 3 + ['top','center','bottom'].indexOf(this.vAlign);
	this.activeHandle = this.handles[activeIndex];
	this.activeHandle.active = true;
};
Box.prototype.align = function() {
	
	AlignBox(this);
	this.reconcileHandles();
};
Box.prototype.move = function(dx, dy) {
	
	MoveBox(this, dx, dy);
	this.handles.forEach(function(handle) { handle.x += dx; handle.y += dy; });
};
Box.prototype.changeAlignment = function(hAlign, vAlign) {
	
	this.hAlign = hAlign;
	this.vAlign = vAlign;
	
	if (this.hAlign == 'left')
	{
		this.x = this.lf;
	}
	else if (this.hAlign == 'center')
	{
		this.x = this.cx;
	}
	else if (this.hAlign == 'right')
	{
		this.x = this.rt;
	}
	else
	{
		throw new Error();
	}
	
	if (this.vAlign == 'top')
	{
		this.y = this.tp;
	}
	else if (this.vAlign == 'center')
	{
		this.y = this.cy;
	}
	else if (this.vAlign == 'bottom')
	{
		this.y = this.bt;
	}
	else
	{
		throw new Error();
	}
};

// we still need these functions, because it makes sense for some objects (small, nonmoveable ones like controls) to handle their own box-nature
function MakeBox(params) {
	
	var box = {};
	AddBoxVars(box);
	ReconcileBox(box, params);
	return box;
}
var AddBoxVars = Widgets.AddBoxVars = function(obj) {
	
	obj.lf = 0;
	obj.cx = 0;
	obj.rt = 0;
	obj.wd = 0;
	obj.wr = 0;
	obj.tp = 0;
	obj.cy = 0;
	obj.bt = 0;
	obj.hg = 0;
	obj.hr = 0;
}
var ReconcileBox = Widgets.ReconcileBox = function(box, params) {
	
	if (params.lf)
	{
		box.lf = params.lf;
		
		if (params.cx)
		{
			box.cx = params.cx;
			box.wr = box.cx - box.lf;
			box.wd = box.wr * 2;
			box.rt = box.lf + box.wd;
		}
		else if (params.rt)
		{
			box.rt = params.rt;
			box.wd = box.rt - box.lf;
			box.wr = box.wd / 2;
			box.cx = box.lf + box.cx;
		}
		else if (params.wd)
		{
			box.wd = params.wd;
			box.wr = box.wd / 2;
			box.rt = box.lf + box.wd;
			box.cx = box.lf + box.wr;
		}
		else if (params.wr)
		{
			box.wr = params.wr;
			box.wd = box.wr * 2;
			box.rt = box.lf + box.wd;
			box.cx = box.lf + box.wr;
		}
	}
	else if (params.cx)
	{
		box.cx = params.cx;
		
		if (params.rt)
		{
			box.rt = params.rt;
			box.wr = box.rt - box.cx;
			box.wd = box.wr * 2;
			box.lf = box.rt - box.wd;
		}
		else if (params.wd)
		{
			box.wd = params.wd;
			box.wr = box.wd / 2;
			box.rt = box.cx + box.wr;
			box.lf = box.cx - box.wr;
		}
		else if (params.wr)
		{
			box.wr = params.wr;
			box.wd = box.wr * 2;
			box.rt = box.cx + box.wr;
			box.lf = box.cx - box.wr;
		}
	}
	else if (params.rt)
	{
		box.rt = params.rt;
		
		if (params.wd)
		{
			box.wd = params.wd;
			box.wr = box.wd / 2;
			box.lf = box.rt - box.wd;
			box.cx = box.rt - box.wr;
		}
		else if (params.wr)
		{
			box.wr = params.wr;
			box.wd = box.wr * 2;
			box.lf = box.rt - box.wd;
			box.cx = box.rt - box.wr;
		}
	}
	
	if (params.tp)
	{
		box.tp = params.tp;
		
		if (params.cy)
		{
			box.cy = params.cy;
			box.hr = box.cy - box.tp;
			box.hg = box.hr * 2;
			box.bt = box.tp + box.hg;
		}
		else if (params.bt)
		{
			box.bt = params.bt;
			box.hg = box.bt - box.tp;
			box.hr = box.hg / 2;
			box.cy = box.tp + box.cy;
		}
		else if (params.hg)
		{
			box.hg = params.hg;
			box.hr = box.hg / 2;
			box.bt = box.tp + box.hg;
			box.cy = box.tp + box.hr;
		}
		else if (params.hr)
		{
			box.hr = params.hr;
			box.hg = box.hr * 2;
			box.bt = box.tp + box.hg;
			box.cy = box.tp + box.hr;
		}
	}
	else if (params.cy)
	{
		box.cy = params.cy;
		
		if (params.bt)
		{
			box.bt = params.bt;
			box.hr = box.bt - box.cy;
			box.hg = box.hr * 2;
			box.tp = box.bt - box.hg;
		}
		else if (params.hg)
		{
			box.hg = params.hg;
			box.hr = box.hg / 2;
			box.bt = box.cy + box.hr;
			box.tp = box.cy - box.hr;
		}
		else if (params.hr)
		{
			box.hr = params.hr;
			box.hg = box.hr * 2;
			box.bt = box.cy + box.hr;
			box.tp = box.cy - box.hr;
		}
	}
	else if (params.bt)
	{
		box.bt = params.bt;
		
		if (params.hg)
		{
			box.hg = params.hg;
			box.hr = box.hg / 2;
			box.tp = box.bt - box.hg;
			box.cy = box.bt - box.hr;
		}
		else if (params.hr)
		{
			box.hr = params.hr;
			box.hg = box.hr * 2;
			box.tp = box.bt - box.hg;
			box.cy = box.bt - box.hr;
		}
	}
}
var AlignBox = Widgets.AlignBox = function(box) {
	
	// this assumes that x, y, hAlign, vAlign, wd, hg are set and calculates the others
	
	box.wr = box.wd / 2;
	box.hr = box.hg / 2;
	
	if (box.hAlign == 'left')
	{
		box.lf = box.x;
		box.cx = box.lf + box.wr;
		box.rt = box.lf + box.wd;
	}
	else if (box.hAlign == 'center')
	{
		box.cx = box.x;
		box.lf = box.cx - box.wr;
		box.rt = box.cx + box.wr;
	}
	else if (box.hAlign == 'right')
	{
		box.rt = box.x;
		box.lf = box.rt - box.wd;
		box.cx = box.rt - box.wr;
	}
	else
	{
		throw new Error();
	}
	
	if (box.vAlign == 'top')
	{
		box.tp = box.y;
		box.cy = box.tp + box.hr;
		box.bt = box.tp + box.hg;
	}
	else if (box.vAlign == 'center')
	{
		box.cy = box.y;
		box.tp = box.cy - box.hr;
		box.bt = box.cy + box.hr;
	}
	else if (box.vAlign == 'bottom')
	{
		box.bt = box.y;
		box.tp = box.bt - box.hg;
		box.cy = box.bt - box.hr;
	}
	else
	{
		throw new Error();
	}
};
function MoveBox(box, dx, dy) {
	
	box.x += dx;
	box.y += dy;
	box.lf += dx;
	box.cx += dx;
	box.rt += dx;
	box.tp += dy;
	box.cy += dy;
	box.bt += dy;
}


// on clearing:
// the general principle is that we don't want to do page redraws on mousemoves (excepting drags, that is - page redraw on drag is necessary)
// so far, all we do on mousemove is draw handles and arrows on hover, and then clear them when the mouses moves on
// so handles and arrows have their own clear functions that draw a saved patch of canvas
// but for anything involving a mousedown, just redraw the whole page

var Handle = function(ctx, box, hAlign, vAlign) {
	
	this.ctx = ctx;
	this.box = box;
	
	this.active = false;
	this.hovered = false;
	
	this.hAlign = hAlign;
	this.vAlign = vAlign;
	
	this.x = null;
	this.y = null;
	this.r = 2;
	
	this.patch = null; // used for easy clearing - Arrow and other controls should do the same
};
Handle.prototype.draw = function() {
	
	this.patch = this.ctx.getImageData(this.x - this.r, this.y - this.r, this.r * 2 + 1, this.r * 2 + 1); // perhaps inefficient, but we need to get the patch every time the handle moves
	
	this.ctx.fillStyle = this.active ? 'rgb(0,128,255)' : (this.hovered ? 'rgb(100,200,255)' : 'rgb(200,200,200)');
	this.ctx.fillCircle(this.x + 0.5, this.y + 0.5, this.r);
};
Handle.prototype.clear = function() {
	this.ctx.putImageData(this.patch, this.x - this.r, this.y - this.r);
};
Handle.prototype.onhover = function() {
	
	// if inactive handle, change color, and change to active handle onmousedown, AND begin drag
	
	
	// during the drag there are basically 4 elements to worry about:
	// Page -> BarChart -> Box -> Handle
	// the Page needs facilities for drawing gridlines, and then clearing gridlines (which necessitates a redraw of the entire page)
	// also, this move function needs to be able to access the Page variables that control the gridline spacing, in order to snap correctly
	
	Debug('Handle.onhover');
	
	this.ctx.canvas.style.cursor = 'move';
	
	var handle = this;
	
	this.hovered = true;
	this.box.hoveredHandle = this;
	
	this.clear();
	this.draw();
	
	this.ctx.canvas.onmousedown = function(e) {
		
		// set this handle to active
		handle.box.activeHandle.active = false;
		handle.box.activeHandle.clear();
		handle.box.activeHandle.draw();
		handle.active = true;
		handle.clear();
		handle.draw();
		
		handle.box.activeHandle = handle;
		handle.box.changeAlignment(handle.hAlign, handle.vAlign);
		
		var ax = handle.x;
		var ay = handle.y;
		
		handle.box.obj.page.drawGridlines();
		
		var gridlineSpacing = handle.box.obj.page.section.document.snapGrid.gridlineSpacing * handle.box.obj.page.section.document.pixelsPerUnit;
		
		handle.ctx.canvas.onmousemove = function(e) {
			
			var mx = e.offsetX;
			var my = e.offsetY;
			
			var snapx = Math.floor((mx + gridlineSpacing / 2) / gridlineSpacing, 1) * gridlineSpacing;
			var snapy = Math.floor((my + gridlineSpacing / 2) / gridlineSpacing, 1) * gridlineSpacing;
			
			if (snapx == ax && snapy == ay) { return; }
			
			var dx = snapx - ax;
			var dy = snapy - ay;
			
			ax = snapx;
			ay = snapy;
			
			handle.box.move(dx, dy);
			handle.box.obj.page.draw();
			handle.box.obj.page.drawGridlines();
			handle.box.draw();
		};
		handle.ctx.canvas.onmouseup = function(e) {
			
			handle.ctx.canvas.onmousemove = function(e) { handle.box.onmousemove(e); };
			handle.ctx.canvas.onmouseup = null;
			
			// unclear how this interacts with the page draw below.  should it come before or after?
			handle.box.onmousemove(e);
			
			handle.box.obj.page.draw();
		};
	};
};
Handle.prototype.dehover = function() {
	Debug('Handle.dehover');
	this.ctx.canvas.style.cursor = 'default';
	this.box.hoveredHandle = null;
	this.hovered = false;
	this.clear();
	this.draw();
	this.ctx.canvas.onmousedown = null;
};


function Alignment2() {
	
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
}
function Anchor() {
	
	if (params.anchor)
	{
		var t = params.anchor.split(' ');
		var hIntern = t[0][0];
		var hExtern = t[0][1];
		var hOffset = parseFloat(t[1]);
		var vIntern = t[2][0];
		var vExtern = t[2][1];
		var vOffset = parseFloat(t[3]);
		
		if (hIntern == 'L')
		{
			ctx.textAlign = 'left';
		}
		else if (hIntern == 'C')
		{
			ctx.textAlign = 'center';
		}
		else if (hIntern == 'R')
		{
			ctx.textAlign = 'right';
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
			x = parent.rt - hOffset;
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
			ctx.textBaseline = 'top';
		}
		else if (vIntern == 'C')
		{
			ctx.textBaseline = 'middle';
		}
		else if (vIntern == 'B')
		{
			ctx.textBaseline = 'bottom';
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
}
function TextAlign() {
	
	if (params.left)
	{
		ctx.textAlign = 'left';
		x = params.left;
	}
	else if (params.cx)
	{
		ctx.textAlign = 'center';
		x = params.cx;
	}
	else if (params.right)
	{
		ctx.textAlign = 'right';
		x = params.right;
	}
	//else if (params.x)
	//{
	//	ctx.textAlign = 'left';
	//	x = params.x;
	//}
	else
	{
		//throw new Error();
	}
	
	if (params.top)
	{
		ctx.textBaseline = 'top';
		y = params.top;
	}
	else if (params.cy)
	{
		ctx.textBaseline = 'middle';
		y = params.cy;
	}
	else if (params.bottom)
	{
		ctx.textBaseline = 'bottom';
		y = params.bottom;
	}
	else
	{
		//throw new Error();
		//ctx.textBaseline = 'alphabetic';
	}
}

// this is very old and should be deleted when possible
function DrawChart(ctx, type, paramsarg, data, key) {
	
	var chart = null;
	
	//var params = Griddl.GetParams(params); // ctx was the pre-dat.gui grid-based params
	var params = (typeof(paramsarg) == 'string') ? Griddl.GetData(paramsarg) : paramsarg;
	var objs = (typeof(data) == 'string') ? Griddl.GetData(data) : data;
	var key = (typeof(key) == 'string') ? Griddl.GetData(key) : key;
	
	// default alignment is bottom left
	var hAlign = params.hAlign ? params.hAlign : 'left';
	var vAlign = params.vAlign ? params.vAlign : 'bottom';
	
	// we're not using ctx yet, but we could
	var chartBox = Alignment(params.x, params.y, hAlign, vAlign);
	
	var chartLf = params.chartLeft ? params.chartLeft : chartBox.left;
	var chartTp = params.chartTop ? params.chartTop : chartBox.top;
	var chartWd = params.chartWidth ? params.chartWidth : chartBox.top;
	var chartHg = params.chartHeight ? params.chartHeight : chartBox.top;
	var chartRt = chartLf + chartWd;
	var chartBt = chartTp + chartHg;
	
	var marginLf = params.leftMargin ? params.leftMargin : 0;
	var marginBt = params.bottomMargin ? params.bottomMargin : 0;
	var marginRt = params.rightMargin ? params.rightMargin : 0;
	var marginTp = params.topMargin ? params.topMargin : 0;
	
	params.chartLf = chartLf;
	params.chartTp = chartTp;
	params.chartWd = chartWd;
	params.chartHg = chartHg;
	params.chartRt = chartRt;
	params.chartBt = chartBt;
	params.marginLf = marginLf;
	params.marginBt = marginBt;
	params.marginRt = marginRt;
	params.marginTp = marginTp;
	
	//ctx.clearRect(chartLf, chartTp, chartWd, chartHg);
	
	ctx.doFill = true;
	
	//ctx.DrawChartLabels(params);
	
	// ctx is used in bubble and line charts
	var xMin = params.xMin;
	var xMax = params.xMax;
	var yMin = params.yMin;
	var yMax = params.yMax;
	var xPixelWidth = chartWd - marginLf - marginRt;
	var yPixelWidth = chartHg - marginTp - marginBt;
	var xValueWidth = xMax - xMin;
	var yValueWidth = yMax - yMin;
	var xScale = xPixelWidth / xValueWidth;
	var yScale = yPixelWidth / yValueWidth;
	
	var volatileParams = {}; // we don't want xScale and yScale saved as part of the datgui
	volatileParams.xScale = xScale; 
	volatileParams.yScale = yScale;
	
	if (key) { DrawKey(ctx, key, chartLf + params.keyLeft, chartTp + params.keyTop); } // a prime example of how transformations would be better
	
	return chart;
};

// frequently useful for scatter charts
// fillRegularPolygon(x, y, r, n, angle)
// strokeRegularPolygon(x, y, r, n, angle)
// fillStar(x, y, r, angle)
// strokeStar(x, y, r, angle)
// fillCross(x, y, r, angle)
// strokeCross(x, y, r, angle)

function DrawChartLabels(ctx, params) {
	
	// all of the label stuff assumes the chart fills the whole canvas - we need to make it relocatable
	//var tpLabelFont = '16pt Arial';
	//var btLabelFont = '16pt Arial';
	//var lfLabelFont = '16pt Arial';
	//var rtLabelFont = '16pt Arial';
	//var tpLabelFontSize = 16;
	//var btLabelFontSize = 16;
	//var lfLabelFontSize = 16;
	//var rtLabelFontSize = 16;
	//var tpLabelFontFamily = 'Arial';
	//var btLabelFontFamily = 'Arial';
	//var lfLabelFontFamily = 'Arial';
	//var rtLabelFontFamily = 'Arial';
	//var tpLabelColor = 'black';
	//var btLabelColor = 'black';
	//var lfLabelColor = 'black';
	//var rtLabelColor = 'black';
	//var tpLabelOffset = 20;
	//var btLabelOffset = -20;
	//var lfLabelOffset = 20;
	//var rtLabelOffset = 20;
	
	//ctx.font = tpLabelFontSize + 'pt ' + tpLabelFontFamily;
	//ctx.textAlign = 'center';
	//ctx.textBaseline = 'top';
	//ctx.fillStyle = tpLabelColor;
	//ctx.fillText(params.topLabel, chartLf + chartWd / 2, chartTp + tpLabelOffset);
	
	// ctx is the right, left, bottom axis labels that require transformations
	/*
	
	ctx.save();
	ctx.rotate(-Math.PI / 2);
	
	ctx.font = lfLabelFontSize + 'pt ' + lfLabelFontFamily;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	ctx.fillStyle = lfLabelColor;
	
	ctx.translate(-canvas.height / 2, lfLabelOffset); // needs to be made relocatable
	
	ctx.fillText(params.leftLabel, 0, 0);
	
	ctx.restore();
	ctx.save();
	ctx.rotate(Math.PI / 2);
	
	ctx.font = rtLabelFontSize + 'pt ' + rtLabelFontFamily;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	ctx.fillStyle = rtLabelColor;
	
	ctx.translate(canvas.height / 2, -canvas.width + rtLabelOffset); // needs to be made relocatable
	
	ctx.fillText(params.rightLabel, 0, 0);
	
	ctx.restore();
	
	ctx.font = btLabelFontSize + 'pt ' + btLabelFontFamily;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	ctx.fillStyle = btLabelColor;
	
	ctx.fillText(params.bottomLabel, canvas.width / 2, canvas.height + btLabelOffset); // needs to be made relocatable
	
	*/
};
function DrawAxis(ctx, xy, params, volatileParams) {
	
	// get rid of ctx once the passed-in params has these field
	params.tickLabelFont = '10pt Arial';
	params.tickLabelColor = 'black';
	params.tickLength = 5;
	
	var x1 = null;
	var y1 = null;
	var x2 = null;
	var y2 = null;
	
	var xAxisBarValue = Math.max(0, params.yMin); // x axis
	var xAxisBarPixel = params.chartBt - params.marginBt - Math.floor((xAxisBarValue - params.yMin) * volatileParams.yScale, 1); // x axis
	var yAxisBarValue = Math.max(0, params.xMin); // y axis
	var yAxisBarPixel = params.chartLf + params.marginLf + Math.floor((yAxisBarValue - params.xMin) * volatileParams.xScale, 1); // y axis
	
	// x axis
	x1 = params.chartLf + params.marginLf;
	y1 = xAxisBarPixel + 0.5;
	x2 = params.chartRt - params.marginRt;
	y2 = xAxisBarPixel + 0.5;
	
	ctx.lineWidth = 1;
	ctx.strokeStyle = 'black';
	ctx.drawLine(x1, y1, x2, y2);
	
	// y axis
	x1 = yAxisBarPixel + 0.5;
	y1 = params.chartBt - params.marginBt;
	x2 = yAxisBarPixel + 0.5;
	y2 = params.chartTp + params.marginTp;
	
	ctx.lineWidth = 1;
	ctx.strokeStyle = 'black';
	ctx.drawLine(x1, y1, x2, y2);
	
	var xTickValueCursor = Math.floor(yAxisBarValue / params.xHashInterval, 1) * params.xHashInterval; // x axis
	var yTickValueCursor = Math.floor(xAxisBarValue / params.yHashInterval, 1) * params.yHashInterval; // y axis
	
	var maxTickmarks = 100;
	var tickmarkIndex = 0;
	
	// x axis tickmarks and labels
	while (tickmarkIndex < maxTickmarks)
	{
		xTickValueCursor += params.xHashInterval; // x axis
		var xTickPixelCursor = Math.floor(yAxisBarPixel + (xTickValueCursor - yAxisBarValue) * volatileParams.xScale, 1); // x axis
		if (xTickPixelCursor >= params.chartRt - params.rightMargin) { break; } // x axis
		
		// x axis
		var x1 = xTickPixelCursor + 0.5;
		var y1 = xAxisBarPixel - params.tickLength;
		var x2 = xTickPixelCursor + 0.5;
		var y2 = xAxisBarPixel + params.tickLength + 1;
		
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'black';
		ctx.drawLine(x1, y1, x2, y2);
		
		ctx.font = params.tickLabelFont;
		ctx.fillStyle = params.tickLabelColor;
		ctx.textAlign = 'center'; // x axis
		ctx.textBaseline = 'top'; // x axis
		ctx.fillText(xTickValueCursor.toString(), xTickPixelCursor, xAxisBarPixel + params.tickLength + 4); // x axis
		
		tickmarkIndex++;
	}
	
	tickmarkIndex = 0;
	
	while (tickmarkIndex < maxTickmarks)
	{
		yTickValueCursor += params.yHashInterval; // y axis
		var yTickPixelCursor = Math.floor(xAxisBarPixel - (yTickValueCursor - xAxisBarValue) * volatileParams.yScale, 1); // y axis
		if (yTickPixelCursor <= params.chartTop + params.topMargin) { break; } // y axis
		
		// y axis
		var x1 = yAxisBarPixel - params.tickLength;
		var y1 = yTickPixelCursor + 0.5;
		var x2 = yAxisBarPixel + params.tickLength + 1;
		var y2 = yTickPixelCursor + 0.5;
		
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'black';
		ctx.drawLine(x1, y1, x2, y2);
		
		ctx.font = params.tickLabelFont;
		ctx.fillStyle = params.tickLabelColor;
		ctx.textAlign = 'right'; // y axis
		ctx.textBaseline = 'middle'; // y axis
		ctx.fillText(yTickValueCursor.toString(), yAxisBarPixel - params.tickLength - 4, yTickPixelCursor); // y axis
		
		tickmarkIndex++;
	}
};

return Widgets;

})();

// a few convenience functions
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


