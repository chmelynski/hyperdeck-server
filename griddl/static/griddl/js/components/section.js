
(function() {

var Section = function(json) {
	
	if (!json)
	{
		json.type = 'section';
		json.name = Griddl.Components.UniqueName('section', 1);
		json.visible = true;
		json.text = '';
		json.params = {};
		json.params.orientation = 'portrait';
		json.params.margin = {};
		json.params.margin.top = 100;
		json.params.margin.left = 100;
		json.params.margin.right = 100;
		json.params.margin.bottom = 100;
		json.params.pitch = 25;
		json.params.indent = 25;
		json.params.style = '';
		//json.params.variables = this.variables;
		json.params.font = '12pt serif';
		json.params.fill = 'rgb(0,0,0)';
		json.params.nColumns = 1;
		json.params.interColumnMargin = 50;
	}
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.words = null; // { text : string , line : null , box : Box , style : {} , width : 0 } - this can be used for applications that require hovering over words
	this.wordMetrics = null;
	
	this._text = json.text;
	
	Object.defineProperty(this, 'text', { 
		get : function() {
			return this._text;
		},
		set : function(value) {
			this._text = value;
			if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
			this.codemirror.getDoc().setValue(this._text);
			this.parse();
			this.draw();
		}
	});
	
	// these could be made user-editable
	this.spaceWidth = null;
	this.minSpaceWidth = null;
	
	this.representationLabel = 'HTML';
	
	this.div = null;
	this.ctx = null; // set by GenerateDocument
	this.document = null;
	
	this.page = json.params.page;
	this.textStyle = json.params.textStyle;
	this.textPositioning = json.params.textPositioning;
	this.columns = json.params.columns;
	this.margin = json.params.margin;
	
	this.textarea = null;
	this.codemirror = null;
	
	this.nPages = null;
	
	this.section = null; // Canvas.Section
	this.widgets = [];
};
Section.prototype.add = function() {
	
	var section = this;
	
	this.div.html('');
	
	this.textarea = $('<textarea></textarea>');
	this.div.append(this.textarea);
	
	var options = {};
	options.mode = 'plain';
	options.smartIndent = false;
	options.lineNumbers = true;
	options.lineWrapping = true;
	this.codemirror = CodeMirror.fromTextArea(this.textarea[0], options);
	
	// on 'change' or 'blur'
	this.codemirror.on('blur', function() {
		if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
		section._text = section.codemirror.getValue(); // we avoid a setter loop by setting this._text, not this.text
		section.parse();
		section.draw();
	});
	
	this.codemirror.getDoc().setValue(this.text);
	
	this.div.append($('<hr />'));
	
	var controls = [];
	
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
	gui.add(this, 'generate');
	gui.add(this, 'exportToPdf');
	var page = gui.addFolder('page');
	controls.push(page.add(this.page, 'orientation', ['portrait','landscape']));
	var textStyle = gui.addFolder('textStyle');
	controls.push(textStyle.add(this.textStyle, 'style'));
	controls.push(textStyle.add(this.textStyle, 'fontSize').min(0));
	controls.push(textStyle.add(this.textStyle, 'fontFamily', ['serif','sans-serif']));
	controls.push(textStyle.add(this.textStyle, 'bold'));
	controls.push(textStyle.add(this.textStyle, 'italic'));
	controls.push(textStyle.add(this.textStyle, 'color')); // problem here is that addColor does not handle nulls or empty strings
	controls.push(textStyle.add(this.textStyle, 'substyles'));
	var textPositioning = gui.addFolder('textPositioning');
	controls.push(textPositioning.add(this.textPositioning, 'indent'));
	controls.push(textPositioning.add(this.textPositioning, 'lineHeight'));
	var columns = gui.addFolder('columns');
	controls.push(columns.add(this.columns, 'numberOfColumns', [1, 2, 3, 4]));
	controls.push(columns.add(this.columns, 'interColumnMargin').min(0));
	var margin = gui.addFolder('margin');
	controls.push(margin.add(this.margin, 'top').min(0));
	controls.push(margin.add(this.margin, 'left').min(0));
	controls.push(margin.add(this.margin, 'right').min(0));
	controls.push(margin.add(this.margin, 'bottom').min(0));
	
	controls.forEach(function(control) {
		control.onChange(function(value) {
			section.draw();
		});
	});
	
	this.div[0].appendChild(gui.domElement);
};
Section.prototype.parse = function() {
	
	this.wordize();
};
Section.prototype.calculateWordMetrics = function() {
	
	if (this.textStyle.style) { Griddl.Components.SetStyle(this.ctx, this.textStyle.style); }
	if (this.textStyle.fontSize) { this.ctx.setFontSize(this.textStyle.fontSize); }
	if (this.textStyle.fontFamily) { this.ctx.setFont(this.textStyle.fontFamily, this.textStyle.bold, this.textStyle.italic); }
	
	this.wordMetrics = [];
	
	// here is where we would do fancier stuff like inline spans with different fonts, tabs, roll-your-own justification via variable spacing, etc.
	for (var i = 0; i < this.words.length; i++)
	{
		var word = this.words[i];
		var widthCu = this.ctx.measureText(word).width;
		this.wordMetrics.push(widthCu);
	}
	
	this.spaceWidth = this.ctx.fontSizeCu * 0.30;
	this.minSpaceWidth = this.ctx.fontSizeCu * 0.20; // for justified text with stretched spacing
};
Section.prototype.generate = function() {
	
};
Section.prototype.exportToPdf = function() {
	
};
Section.prototype.draw = function() {
	
	// This is a long function, and sort of the master drawing function.  What happens here:
	// 1. determine the minimum number of pages needed to accomodate all widgets
	// 2. create that number of blank page boxes
	// 3. perform the occlusion
	// 4. determine the width of each line of text - skip over boxes that are not tall enough to accomodate even a single line of text
	// 5. lay out text, adding new pages as necessary (currently linebreaking is done naively, but later will need to use Knuth-Plass)
	// 6. loop through the lines of text and draw them, calling NewPage/SetActivePage as necessary (we need to implement multi-page sections)
	// 7. draw dotted page breaks on screen (screen only, not PDF)
	// 8. draw each widget
	
	var debug = false;
	var graphicalDebug = false;
	
	if (debug) { console.log(`drawing section "${this.name}"`); }
	
	this.clear();
	
	// perhaps check that orientation is either 'portrait' or 'landscape'
	var wd = ((this.page.orientation == 'portrait') ? this.document.page.width : this.document.page.height) * this.document.cubitsPerUnit;
	var hg = ((this.page.orientation == 'portrait') ? this.document.page.height : this.document.page.width) * this.document.cubitsPerUnit;
	
	if (hg < 1) { throw new Error('page size too small'); }
	
	var boxes = [];
	
	// 1. determine the minimum number of pages needed to accomodate all widgets
	var nPages = 1;
	for (var i = 0; i < this.widgets.length; i++)
	{
		var widget = this.widgets[i];
		if (widget.setSize) { widget.setSize(); }
		nPages = Math.max(nPages, Math.ceil(widget.box.bt / hg, 1));
	}
	
	if (debug) { console.log(`pages needed by widgets: ${nPages}`); }
	
	var columnWidth = (wd - this.margin.left - this.margin.right - this.columns.interColumnMargin * (this.columns.numberOfColumns - 1)) / this.columns.numberOfColumns;
	
	// 2. create that number of blank page boxes
	for (var i = 0; i < nPages; i++)
	{
		for (var k = 0; k < this.columns.numberOfColumns; k++)
		{
			var lf = this.margin.left + (columnWidth + this.columns.interColumnMargin) * k;
			boxes.push(Griddl.Components.MakeBox({lf:lf,rt:lf+columnWidth,tp:i*hg+this.margin.top,bt:(i+1)*hg-this.margin.bottom}));
		}
	}
	
	if (debug)
	{
		console.log('blank page boxes:');
		boxes.forEach(function(b) { console.log('{lf:'+b.lf+',rt:'+b.rt+',tp:'+b.tp+',bt:'+b.bt+'}'); });
	}
	
	// 3. perform the occlusion
	for (var i = 0; i < this.widgets.length; i++)
	{
		var widget = this.widgets[i];
		
		if (widget.margin)
		{
			var boxWithMargin = Griddl.Components.MakeBox({lf:widget.box.lf-widget.margin.left,rt:widget.box.rt+widget.margin.right,tp:widget.box.tp-widget.margin.top,bt:widget.box.bt+widget.margin.bottom});
			boxes = Griddl.Components.Box.Occlude(boxes, boxWithMargin);
		}
		else
		{
			boxes = Griddl.Components.Box.Occlude(boxes, widget.box);
		}
	}
	
	if (debug)
	{
		console.log('occluded boxes:');
		boxes.forEach(function(b) { console.log('{lf:'+b.lf+',rt:'+b.rt+',tp:'+b.tp+',bt:'+b.bt+'}'); });
	}
	
	// 4. determine the width of each line of text - skip over boxes that are not tall enough to accomodate even a single line of text
	// Line { box : Box , words : [ Word ] }
	// Word { box : Box , text : "string" }
	var lines = [];
	
	if (this.textPositioning.lineHeight < 0.01) { throw new Error('line height too small'); }
	
	var boxIndex = 0;
	var box = boxes[boxIndex];
	var bt = box.tp + this.textPositioning.lineHeight;
	
	while (true)
	{
		if (bt > box.bt)
		{
			boxIndex++;
			
			// we adjust box borders to avoid excess gap between lines - stretch the boxes directly below the current box up a little
			for (var i = boxIndex; i < boxes.length; i++)
			{
				if (boxes[i].tp == box.bt)
				{
					boxes[i].tp = bt - this.textPositioning.lineHeight;
				}
			}
			
			if (boxIndex >= boxes.length)
			{
				break;
			}
			else
			{
				box = boxes[boxIndex];
				bt = box.tp;
			}
		}
		else
		{
			var line = {};
			line.words = [];
			line.box = new Griddl.Components.Box(null, false);
			line.box.reconcile({lf : box.lf , bt : bt , wd : box.wd , hg : this.textPositioning.lineHeight });
			lines.push(line);
		}
		
		bt += this.textPositioning.lineHeight;
	}
	
	if (debug)
	{
		console.log('lines:');
		
		for (var i = 0; i < lines.length; i++)
		{
			var l = lines[i];
			console.log('{lf:'+l.box.lf+',bt:'+l.box.bt+',wd:'+l.box.wd+'}');
		}
	}
	
	// 5. lay out text (currently linebreaking is done naively, but later will need to use Knuth-Plass)
	
	// under naive linebreaking, we call fillText for the whole line
	// under justified linebreaking or typeset, we call fillText for each word
	
	this.calculateWordMetrics();
	var lineWidths = lines.map(l => l.box.wd);
	lineWidths.push(columnWidth); // the endless pages at the end - here be dragons
	
	// returns [ "string" ]
	//var lineTexts = LinebreakNaive(lineWidths, this.words, this.wordMetrics, this.spaceWidth);
	
	// returns [ [ { text : "string" , lf : 0 , wd : 0 } ] ]
	var lineTexts = LinebreakJustify(lineWidths, this.words, this.wordMetrics, this.spaceWidth, this.minSpaceWidth);
	
	var usingPositions = true;
	
	// now we have parallel arrays - one of empty lines and their coordinates, and one of line texts
	// we loop through the line texts, assigning them to the empty lines
	// if the list of empty lines runs out, create new empty lines, incrementing maxPages as necessary
	
	var matching = Math.min(lines.length, lineTexts.length);
	
	for (var i = 0; i < matching; i++)
	{
		var line = lines[i];
		
		if (usingPositions)
		{
			var words = lineTexts[i];
			
			for (var k = 0; k < words.length; k++)
			{
				var word = {};
				word.box = new Griddl.Components.Box(null, false);
				word.box.reconcile({ lf : line.box.lf + words[k].lf , bt : line.box.bt , wd : words[k].wd , hg : line.box.hg });
				word.text = words[k].text;
				line.words.push(word);
			}
		}
		else
		{
			// here we treat the whole line as one "word"
			var word = {};
			word.box = line.box;
			word.text = lineTexts[i];
			line.words.push(word);
		}
	}
	
	if (lineTexts.length > lines.length)
	{
		var origLinesLength = lines.length;
		var excess = lineTexts.length - lines.length;
		
		// duplicated in loop below
		var tp = nPages * hg + this.margin.top;
		var bt = tp + this.textPositioning.lineHeight;
		nPages++;
		var pageBottom = nPages * hg - this.margin.bottom; // note than nPages is incremented between the usage three lines above and the usage here
		
		var currentColumn = 0;
		
		for (var i = 0; i < excess; i++)
		{
			var line = {};
			line.words = [];
			line.box = new Griddl.Components.Box(null, false);
			line.box.reconcile({ lf : this.margin.left + (columnWidth + this.columns.interColumnMargin) * currentColumn , bt : bt , wd : columnWidth , hg : this.textPositioning.lineHeight });
			
			if (usingPositions)
			{
				var words = lineTexts[origLinesLength + i];
				
				for (var k = 0; k < words.length; k++)
				{
					var word = {};
					word.box = new Griddl.Components.Box(null, false);
					word.box.reconcile({ lf : line.box.lf + words[k].lf , bt : line.box.bt , wd : words[k].wd , hg : line.box.hg });
					word.text = words[k].text;
					line.words.push(word);
				}
			}
			else
			{
				var word = {};
				word.box = line.box;
				word.text = lineTexts[origLinesLength + i];
				line.words.push(word);
			}
			
			lines.push(line);
			
			bt += this.textPositioning.lineHeight;
			
			if (bt > pageBottom)
			{
				currentColumn++;
				
				if (currentColumn >= this.columns.numberOfColumns)
				{
					currentColumn = 0;
					tp = nPages * hg + this.margin.top;
					bt = tp + this.textPositioning.lineHeight;
					nPages++;
					pageBottom = nPages * hg - this.margin.bottom; // note than nPages is incremented between the usage three lines above and the usage here
				}
				else
				{
					bt = tp + this.textPositioning.lineHeight;
				}
			}
		}
	}
	
	if (debug)
	{
		console.log('lines with text:');
		
		for (var i = 0; i < lines.length; i++)
		{
			var l = lines[i];
			if (l.text !== null) { console.log('{lf:'+l.box.lf+',bt:'+l.box.bt+',wd:'+l.box.wd+',text:"'+l.box.text+'"}'); }
		}
	}
	
	// set/create Canvas Section, setting dimensions according to the pageCount
	if (this.section)
	{
		this.section.SetDimensions(nPages, wd, hg);
		this.ctx.SetActiveSection(this.section);
	}
	else
	{
		this.section = this.ctx.NewSection(wd, hg, nPages);
		if (typeof window != 'undefined') { this.document.parentDiv.appendChild(this.section.div); }
	}
	
	this.nPages = nPages;
	
	// 6. loop through the lines of text and draw them, calling Section.SetDimensions to add pages as necessary
	// at some point, we might want to implement some inline style markup - the equivalent of <span>s
	// if it's limited to color, we can just move the style setting below into the loop
	// it the spans change the font, well.  then we need to change the whole linebreaking algo
	
	var ctx = this.ctx;
	if (graphicalDebug)
	{
		for (var i = 0; i < lines.length; i++)
		{
			var line = lines[i];
			this.ctx.strokeRect(line.box.lf, line.box.tp, line.box.wd, line.box.hg);
		}
		
		for (var i = 0; i < this.widgets.length; i++)
		{
			var widget = this.widgets[i];
			//widget.draw();
			this.ctx.strokeRect(widget.box.lf, widget.box.tp, widget.box.wd, widget.box.hg);
			this.ctx.textAlign = 'center';
			this.ctx.textBaseline = 'middle';
			this.ctx.font = '24pt serif';
			this.ctx.fillText(widget.name, widget.box.cx, widget.box.cy);
		}
		
		return;
	}
	
	if (this.textStyle.style) { Griddl.Components.SetStyle(this.ctx, this.textStyle.style); }
	if (this.textStyle.fontSize) { this.ctx.setFontSize(this.textStyle.fontSize); }
	if (this.textStyle.fontFamily) { this.ctx.setFont(this.textStyle.fontFamily, this.textStyle.bold, this.textStyle.italic); }
	this.ctx.fillStyle = this.color;
	this.ctx.textAlign = 'left';
	this.ctx.textBaseline = 'bottom'; // this is tied to how we use y in SetType
	
	for (var i = 0; i < lines.length; i++)
	{
		var line = lines[i];
		
		for (var k = 0; k < line.words.length; k++)
		{
			var word = line.words[k];
			this.ctx.fillText(word.text, word.box.lf, word.box.bt);
		}
	}
	
	// 7. draw dotted page breaks on screen (screen only, not PDF)
	for (var i = 1; i < nPages; i++)
	{
		// this is only to be drawn on screen, not on the PDF.  so we instruct Canvas to briefly suspend pdf output
		// update: just break the abstraction
		//this.ctx.pausePdfOutput();
		if (this.ctx.g)
		{
			this.ctx.g.setLineDash([5, 5]);
			this.ctx.g.strokeStyle = 'rgb(128,128,128)';
			this.ctx.g.lineWidth = 1;
			this.ctx.g.beginPath();
			this.ctx.g.moveTo(0, hg * i);
			this.ctx.g.lineTo(wd, hg * i);
			this.ctx.g.stroke();
			this.ctx.g.setLineDash([]);
		}
		//this.ctx.resumePdfOutput();
	}
	
	// 8. draw each widget
	this.widgets.forEach(function(widget) { widget.draw(); });
	
	// if the number of pages has changed, we need to call document.numberPages, which is tricky because it has to clear boxes, meaning it must measure text
};
Section.prototype.onhover = function() {
	
	var section = this;
	
	section.section.canvasContext.canvas.onmouseenter = function(e) {
		section.ctx.SetActiveSection(section.section);
	};
	
	section.section.canvasContext.canvas.onmousemove = function(e) {
		
		var x = e.offsetX * section.ctx.cubitsPerPixel;
		var y = e.offsetY * section.ctx.cubitsPerPixel;
		
		// this must be a for loop instead of a forEach because we break on first hit
		for (var i = 0; i < section.widgets.length; i++)
		{
			var widget = section.widgets[i];
			
			if (widget.box.lf <= x && x <= widget.box.rt && widget.box.tp <= y && y <= widget.box.bt)
			{
				widget.onhover();
				return;
			}
			
			if (widget.subs) // subs can be outside the area of the parent's box
			{
				for (var j = 0; j < widget.subs.length; j++)
				{
					var sub = widget.subs[j];
					
					// this fails because we changed xAnchor to 'left','center','right', not 'lf','cx','rt'
					//var tx = x - widget.box[sub.box.xAnchor];
					//var ty = y - widget.box[sub.box.yAnchor];
					
					if (sub.box.lf <= tx && tx <= sub.box.rt && sub.box.tp <= ty && ty <= sub.box.bt)
					{
						sub.onhover();
						return;
					}
				}
			}
		}
		
		// put margin arrows here
	};
};
Section.prototype.clear = function() {
	
	if (this.section)
	{
		this.ctx.SetActiveSection(this.section);
		this.ctx.clearRect(0, 0, this.section.canvasContext.canvas.width, this.section.canvasContext.canvas.height);
	}
};
Section.prototype.drawGridlines = function() {
	
	// need to rework this to account for multiple pages
	// currently this only draws on the active page
	
	var gridlineSpacing = this.document.snapGrid.gridlineSpacing * this.document.cubitsPerUnit;
	var gridlineHighlight = this.document.snapGrid.gridlineHighlight * this.document.cubitsPerUnit;
	
	var wd = ((this.page.orientation == 'portrait') ? this.document.page.width : this.document.page.height) * this.document.cubitsPerUnit;
	var hg = ((this.page.orientation == 'portrait') ? this.document.page.height : this.document.page.width) * this.document.cubitsPerUnit * this.nPages;
	
	// we could change the x and y loops below to start at the medians and radiate outward, in order to guarantee a median line
	// as is, the x == medianX test below will fail if medianX is not a multiple of spacing
	var medianX = wd / 2;
	var medianY = hg / 2; // need multiple medianY's
	
	// we cache all the lines and then draw them at the end, because we want darker lines to be drawn over lighter lines
	var todraw = [ [] , [] , [] ];
	
	//console.log(gridlineSpacing);
	//console.log(gridlineHighlight);
	//console.log(wd);
	//console.log(hg);
	
	for (var x = 0; x < wd; x += gridlineSpacing)
	{
		var line = {x0:x+0.5,y0:0,x1:x+0.5,y1:hg};
		
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
	
	for (var y = 0; y < hg; y += gridlineSpacing)
	{
		var line = {x0:0,y0:y+0.5,x1:wd,y1:y+0.5};
		
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
	
	var ctx = this.ctx;
	ctx.g.lineWidth = 1;
	
	for (var i = 0; i < todraw.length; i++)
	{
		ctx.g.strokeStyle = styles[i];
		
		for (var j = 0; j < todraw[i].length; j++)
		{
			ctx.g.drawLine(todraw[i][j].x0, todraw[i][j].y0, todraw[i][j].x1, todraw[i][j].y1);
		}
	}
};
Section.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.text = this.text;
	json.params = {};
	json.params.orientation = this.page.orientation;
	json.params.margin = {};
	json.params.margin.top = this.margin.top;
	json.params.margin.left = this.margin.left;
	json.params.margin.right = this.margin.right;
	json.params.margin.bottom = this.margin.bottom;
	json.params.pitch = this.pitch;
	json.params.indent = this.indent;
	json.params.style = this.style;
	//json.params.variables = this.variables;
	json.params.font = this.font;
	json.params.fill = this.fill;
	json.params.nColumns = this.nColumns;
	json.params.interColumnMargin = this.interColumnMargin;
	return json;
};
Section.prototype.wordize = function() {
	
	// Markdown syntax:
	//
	// Heading
	// =======
	// 
	// Sub-heading
	// -----------
	// 
	// ### Another deeper heading
	// 
	// Paragraphs are separated
	// by a blank line.
	// 
	// Leave 2 spaces at the end of a line to do a  
	// line break
	// 
	// *italic*, **bold**, `monospace`, ~~strikethrough~~
	// 
	// Shopping list:
	// 
	// * apples
	// * oranges
	// * pears
	// 
	// Numbered list:
	// 
	// 1. apples
	// 2. oranges
	// 3. pears
	// 
	// The rain---not the reign---in
	// Spain.
	// 
	// A [link](http://example.com).
	
	
	this.words = [];
	var word = '';
	
	var k = 0;
	
	while (k < this.text.length)
	{
		var c = this.text[k];
		var n = c.charCodeAt();
		
		if (n == 32 || n == 9 || n == 13 || n == 10)
		{
			if (word.length > 0) { this.words.push(word); }
			
			//if (n == 9) { this.words.push('\t'); }
			//if (n == 10) { this.words.push('\n'); }
			
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
	
	for (var i = 0; i < this.words.length; i++)
	{
		var word = this.words[i];
		
		if (word == '--')
		{
			// m-dash
		}
		
		if (word.length >= 2 && word[0] == '$')
		{
			var c = word.charCodeAt(1);
			
			if ((c <= 65 && c <= 90) || (c <= 97 && c <= 122))
			{
				// ^\$[a-zA-Z] = $ followed by a letter = indicates a variable
			}
		}
		
		if (word.length >= 3)
		{
			var c = word.charAt(0);
			
			// 61 = '=', 45 = '-', 35 = '#'
			if (c == '=' || c == '-' || c == '#')
			{
				var allsame = true;
				
				for (var i = 1; i < word.length; i++)
				{
					if (word.charAt(i) != c)
					{
						allsame = false;
						break;
					}
				}
				
				if (allsame)
				{
					// previous line (for = and -) or following text (for #) is a header
				}
			}
		}
		
		// strip an ending period, and then replace it after checking for bold, italic, etc.?
		var endPeriod = '';
		if (word.endsWith('.'))
		{
			word = word.substring(0, word.length - 1);
			endPeriod = '.';
		}
		
		//if (word.startsWith('***') && word.endsWith('***')) { word.bold = true; word.italic = true; word = word.substring(3, word.length - 3); }
		//if (word.startsWith('**') && word.endsWith('**')) { word.bold = true; word = word.substring(2, word.length - 2); }
		//if (word.startsWith('*') && word.endsWith('*')) { word.italic = true; word = word.substring(1, word.length - 1); }
		//if (word.startsWith('`') && word.endsWith('`')) { word.monospace = true; word = word.substring(1, word.length - 1); }
		//if (word.startsWith('~~') && word.endsWith('~~')) { word.strikethrough = true; word = word.substring(1, word.length - 1); }
		
		word += endPeriod;
	}
};

// the fate of representationToggle is uncertain
Section.prototype.getText = function() {
	var json = this.write();
	var text = JSON.stringify(json.params);
	return text;
};
Section.prototype.representationToggle = function() {
	
	var obj = this;
	var codemirror = null;
	
	var TextToOther = function() {
		
		obj.div.html(''); // ideally, the toggle should just deal with the metadata, not the section text.  that requires a reworking here - we don't want to clear the entire div, just the metadata part.  this will require another div split, so that we have:
		// component div
		//  header div
		//  body div - typically we clear/regenerate this on toggle, but we don't want to do that for Sections
		//   text div
		//   metadata div - for Sections, clear/regenerate only this on toggle
		
		try
		{
			var text = codemirror.getDoc().getValue();
			var data = JSON.parse(text);
		}
		catch (e)
		{
			// the parse has failed - display an error message - look at error handling code in MakeComponentsDiv to see how to display error message
		}
		
		obj.setData(data);
		obj.addElements();
		obj.refresh();
		
		Griddl.Components.MarkDirty();
	};
	
	var OtherToText = function() {
		
		obj.div.html(''); // no - need to keep the data and only clear the metadata part
		
		var textbox = $(document.createElement('textarea'));
		textbox.addClass('griddl-component-body-radio-textarea');
		obj.div.append(textbox);
		
		var text = obj.getText();
		codemirror = CodeMirror.fromTextArea(textbox[0], { smartIndent : false , lineNumbers : true });
		codemirror.getDoc().setValue(text);
		
		Griddl.Components.MarkDirty();
	};
	
	return [ { label : obj.representationLabel , fn : TextToOther } , { label : 'JSON' , fn : OtherToText } ];
};

function LinebreakNaive(lineWidths, words, wordMetrics, spaceWidth) {
	
	var lineTexts = [];
	
	var lineText = '';
	var lineIndex = 0;
	var currentLineWidth = lineWidths[lineIndex];
	
	var textWidth = 0;
	
	for (var i = 0; i < words.length; i++)
	{
		var word = words[i];
		var wordWidth = wordMetrics[i];
		
		if (textWidth > 0) { textWidth += spaceWidth; }
		textWidth += wordWidth;
		
		if (textWidth > currentLineWidth)
		{
			lineTexts.push(lineText);
			lineText = '';
			lineIndex++;
			textWidth = 0;
			i--;
			
			if (lineIndex >= lineWidths.length)
			{
				currentLineWidth = lineWidths[lineWidths.length - 1];
			}
			else
			{
				currentLineWidth = lineWidths[lineIndex];
			}
		}
		else
		{
			if (lineText.length > 0) { lineText += ' '; }
			lineText += word;
		}
	}
	
	if (lineText.length > 0) { lineTexts.push(lineText); }
	
	return lineTexts;
}
function LinebreakJustify(lineWidths, words, wordMetrics, optimalSpaceWidth, minSpaceWidth) {
	
	// returns [ [ { text : "string" , lf : 0 , wd : 0 } ] ]
	
	var lineBoxes = [];
	var wordBoxes = [];
	
	var lineIndex = 0;
	var currentLineWidth = lineWidths[lineIndex];
	
	var wordCount = 0;
	var textWidth = 0;
	var oldDeviationFromOptimal = Infinity;
	
	var i = 0;
	while (i < words.length)
	{
		var word = words[i];
		var wordWidth = wordMetrics[i];
		
		wordCount++;
		textWidth += wordWidth;
		
		// cases to deal with:
		// one word is too big for the line - push a 0-word line
		// two words are too big for the line - push a 1-word line
		// three+ words are too big for the line - push a 2+-word line
		// (this is incomplete, there are lots of branches below
		
		if (wordCount == 1)
		{
			if (textWidth > currentLineWidth)
			{
				lineBoxes.push(wordBoxes);
				wordBoxes = [];
				wordCount = 0;
				textWidth = 0;
				oldDeviationFromOptimal = Infinity;
				lineIndex++;
				currentLineWidth = ((lineIndex >= lineWidths.length) ? lineWidths[lineWidths.length - 1] : lineWidths[lineIndex]);
				continue;
			}
			else
			{
				wordBoxes.push({ text : word , wd : wordWidth , lf : null });
			}
		}
		else
		{
			var remainingSpace = currentLineWidth - textWidth;
			var cubitsPerSpace = remainingSpace / (wordCount - 1);
			var deviationFromOptimal = Math.abs(optimalSpaceWidth - cubitsPerSpace);
			
			if (cubitsPerSpace < minSpaceWidth || oldDeviationFromOptimal < deviationFromOptimal)
			{
				// rewind one word, calculate wordBoxes and reset
				
				textWidth -= wordWidth;
				wordCount--;
				i--;
				
				if (wordCount == 1)
				{
					wordBoxes[0].lf = currentLineWidth / 2 - wordBoxes[0].wd / 2; // center the single word in the line.  not much can be done
				}
				else
				{
					remainingSpace = currentLineWidth - textWidth;
					cubitsPerSpace = remainingSpace / (wordCount - 1);
					
					var x = 0;
					for (var k = 0; k < wordBoxes.length; k++)
					{
						wordBoxes[k].lf = x;
						x += wordBoxes[k].wd + cubitsPerSpace;
					}
				}
				
				lineBoxes.push(wordBoxes);
				wordBoxes = [];
				wordCount = 0;
				textWidth = 0;
				oldDeviationFromOptimal = Infinity;
				lineIndex++;
				currentLineWidth = ((lineIndex >= lineWidths.length) ? lineWidths[lineWidths.length - 1] : lineWidths[lineIndex]);
			}
			else
			{
				oldDeviationFromOptimal = deviationFromOptimal;
				wordBoxes.push({ text : word , wd : wordWidth , lf : null });
			}
		}
		
		i++;
	}
	
	return lineBoxes;
}
function LinebreakKnuth(lineWidths, text) {
	
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
}
function Substitute() {
	
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
}

Griddl.Components.section = Section;

Griddl.Components.LinebreakNaive = LinebreakNaive;

})();

