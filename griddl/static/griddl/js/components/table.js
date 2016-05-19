
(function() {

var Table = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.data = json.data; // [[]]
	this.nRows = this.data.length;
	this.nCols = this.data.map(x => x.length).reduce(function(a, b) { return Math.max(a, b); });
	this.rowSizes = json.params.rowSizes; // int[], includes headers
	this.colSizes = json.params.colSizes; // int[], includes headers
	this.xs = null; // int[], fencepost with colSizes
	this.ys = null; // int[], fencepost with rowSizes
	
	this.cells = null; // Cell[][]
	
	this.div = null;
	
	this.ctx = null;
	
	this.section = null; // set by Canvas.GenerateDocument
	
	// the mechanics of row and col resizing work best if the grid's anchor is mandated to be tp/lf, but users might want centering
	this.box = new Griddl.Components.Box(this, true);
	this.box.x = json.params.x;
	this.box.y = json.params.y;
	this.box.hAlign = json.params.hAlign;
	this.box.vAlign = json.params.vAlign;
	this.box.hg = this.rowSizes.reduce(function(a, b) { return a + b; });
	this.box.wd = this.colSizes.reduce(function(a, b) { return a + b; });
	
	this.margin = {};
	this.margin.tp = json.params.margin.top;
	this.margin.lf = json.params.margin.left;
	this.margin.rt = json.params.margin.right;
	this.margin.bt = json.params.margin.bottom;
	
	this.selected = null; // {mode:'Select',color:'rgb(0,0,0)',shimmer:false,minCol:null,maxCol:null,minRow:null,maxRow:null}
	this.cursor = {row:null,col:null}; // { row : int , col : int }
	this.anchor = {row:null,col:null}; // { row : int , col : int }
	
	this.generateCells();
	this.position();
};
Table.prototype.add = function() {
	
	this.addElements();
	this.refresh();
};
Table.prototype.addElements = function() {
	
	var options = {}
	options.data = this.data;
	options.formulas = true;
	options.rowHeaders = false;
	options.colHeaders = false;
	//options.colWidths = [ 50 , 10 , 10 , 10 , 10 , 10 , 20 , 10 ];
	options.contextMenu = false;
	options.manualColumnResize = true;
	//options.afterChange = function(changes, source) { if (this.firstChange) { this.firstChange = false; } else { Griddl.Components.MarkDirty(); } };
	
	this.tableDiv = $('<div></div>');
	this.div.append(this.tableDiv);
	
	this.handsontable = new Handsontable(this.tableDiv[0], options);
	
	this.div.append($('<hr />'));
	
	var gui = new dat.GUI({autoPlace:false});
	gui.add(this.box, 'x'); // add handlers to align the box on change
	gui.add(this.box, 'y');
	gui.add(this.box, 'hAlign', ['left','center','right']);
	gui.add(this.box, 'vAlign', ['top','center','bottom']);
	
	var rowSizesFolder = gui.addFolder('row sizes');
	for (var i = 0; i < this.rowSizes.length; i++) { rowSizesFolder.add(this.rowSizes, i); }
	var colSizesFolder = gui.addFolder('col sizes');
	for (var i = 0; i < this.colSizes.length; i++) { colSizesFolder.add(this.colSizes, i); }
	
	var margin = gui.addFolder('margin');
	margin.add(this.margin, 'lf');
	margin.add(this.margin, 'rt');
	margin.add(this.margin, 'tp');
	margin.add(this.margin, 'bt');
	
	this.div[0].appendChild(gui.domElement);
};
Table.prototype.refresh = function() {
	
};
Table.prototype.generateCells = function() {
	
	this.cells = [];
	
	for (var i = 0; i < this.nRows; i++)
	{
		this.cells.push([]);
		
		for (var j = 0; j < this.nCols; j++)
		{
			var cell = new Cell(this)
			cell.row = i;
			cell.col = j;
			
			cell.data = this.data[i][j];
			cell.string = cell.data.toString();
			//cell.valueToString();
			
			this.cells[i].push(cell);
		}
	}
};
Table.prototype.position = function() {
	
	this.box.align(); // allows for flexible anchoring
	
	// starting with the left, top, rowSizes, and colSizes, recalculate xs, ys, and the other box vars
	var x = this.box.lf;
	var y = this.box.tp;
	this.xs = [ x ];
	this.ys = [ y ];
	for (var j = 0; j < this.nCols; j++) { x += this.colSizes[j]; this.xs.push(x); }
	for (var i = 0; i < this.nRows; i++) { y += this.rowSizes[i]; this.ys.push(y); }
	//this.box.reconcile({lf:this.box.lf,rt:x,tp:this.box.tp,bt:y});
	
	// then reposition the cells
	for (var i = 0; i < this.nRows; i++)
	{
		for (var j = 0; j < this.nCols; j++)
		{
			var cell = this.cells[i][j];
			cell.box.reconcile({wd:this.colSizes[j],hg:this.rowSizes[i],lf:this.xs[j],tp:this.ys[i]});
		}
	}
};
Table.prototype.draw = function() {
	
	var table = this;
	
	this.cells.forEach(cellrow => cellrow.forEach(function(cell) { cell.ctx = table.ctx; }));
	
	// draw cells - the cells draw their fill only - the grid itself handles strokes and the selection box
	this.cells.forEach(cellrow => cellrow.forEach(cell => cell.draw()));
	
	//var labelCellStroke = 'rgb(158,182,206)';
	//var normalStroke = 'rgb(208,215,229)';
	//var selectedStroke = 'rgb(242,149,54)';
	
	var labelCellStroke = 'rgb(0,0,0)';
	var normalStroke = 'rgb(0,0,0)';
	var selectedStroke = 'rgb(0,0,0)';
	
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
				//ctx.fillRect(rt - 3, bt - 3, 5, 5); // handle square
			}
		}
	}
};
Table.prototype.onmousemove = function(e) {
	
	var mx = e.offsetX * this.ctx.cubitsPerPixel;
	var my = e.offsetY * this.ctx.cubitsPerPixel;
	
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
						var currY = e.offsetY * grid.ctx.cubitsPerPixel;
						grid.rowSizes[rowResizeIndex] = Math.max(currY - prevY, 2);
						grid.position();
						grid.section.draw();
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
				
				var ColResize = function() // what.  this doesn't work - where's the handler?  e is undefined below
				{
					var currX = e.offsetX * grid.ctx.cubitsPerPixel;
					this.colSizes[colResizeIndex] = Math.max(currX - prevX, 2);
					// now change subsequent xs
					this.position();
				};
				
				return;
			}
		}
	}
	
	var hovered = grid.pointToRowCol(mx, my);
	
	var cell = this.cells[hovered.row][hovered.col];
	this.ctx.canvas.style.cursor = 'cell';
	
	this.ctx.canvas.onmousedown = function(e) {
		
		var ax = e.offsetX * grid.ctx.cubitsPerPixel;
		var ay = e.offsetY * grid.ctx.cubitsPerPixel;
		
		grid.anchor = grid.pointToRowCol(ax, ay);
		grid.cursor = grid.pointToRowCol(ax, ay);
		
		grid.selected = []; // don't clear existing selections if Ctrl is down
		var selected = {mode:'Select',color:'rgb(0,0,0)',shimmer:false,minCol:grid.anchor.col,maxCol:grid.anchor.col,minRow:grid.anchor.row,maxRow:grid.anchor.row};
		grid.focusSelected = selected;
		grid.selected.push(selected);
		grid.section.draw();
		
		grid.ctx.canvas.onmousemove = function(e) {
			
			var mx = e.offsetX * grid.ctx.cubitsPerPixel;
			var my = e.offsetY * grid.ctx.cubitsPerPixel;
			
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
Table.prototype.pointToRowCol = function(x, y) {
	
	// find the cell to call .over on by comparing the mouse pos against the gridlines
	
	var row = null;
	var col = null;
	
	// binary search could be used for large grids
	for (var i = 0; i < this.ys.length - 1; i++) { if (this.ys[i] <= y && y <= this.ys[i + 1]) { row = i; } }
	for (var j = 0; j < this.xs.length - 1; j++) { if (this.xs[j] <= x && x <= this.xs[j + 1]) { col = j; } }
	
	if (row === null || col === null) { throw new Error(); }
	
	return { row : row , col : col };
};
Table.prototype.onhover = function() {
	
	var grid = this;
	this.ctx.canvas.onmousemove = function(e) { grid.onmousemove(e); }
};
Table.prototype.dehover = function() {
	this.ctx.canvas.style.cursor = 'default';
	this.ctx.canvas.onmousedown = null;
	this.ctx.canvas.onmousemove = null;
	this.section.onhover(); // until superseded by this line in box.dehover or whatever, somewhere in box
};
Table.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.data = this.data;
	json.params = {};
	json.params.x = this.box.x;
	json.params.y = this.box.y;
	json.params.hAlign = this.box.hAlign;
	json.params.vAlign = this.box.vAlign;
	json.params.rowSizes = this.rowSizes;
	json.params.colSizes = this.colSizes;
	json.params.margin = {};
	json.params.margin.top = this.margin.tp;
	json.params.margin.left = this.margin.lf;
	json.params.margin.right = this.margin.rt;
	json.params.margin.bottom = this.margin.bt;
	return json;
};
Table.New = function() {
	
	var defaultRowSize = 20;
	var defaultColSize = 64;
};

var Cell = function(parent) {
	
	this.parent = parent;
	
	this.ctx = null;
	
	this.formula = null;
	
	this.dataObj = null;
	this.dataField = null;
	this.data = null;
	this.string = null;
	this.datatype = null;
	
	this.box = new Griddl.Components.Box(this, false);
	
	this.numberFormat = null;
	
	this.font = '10pt serif';
	this.cellFill = 'rgb(255,255,255)';
	this.textFill = 'rgb(0,0,0)';
	this.textAlign = 'left';
	this.textBaseline = 'bottom';
	this.margin = 3;
	this.baseMargin = 7;
	
	this.width = 64;
	this.height = 20;
};
Cell.prototype.draw = function() {
	
	this.ctx.fillStyle = this.cellFill;
	this.ctx.fillRect(this.box.lf, this.box.tp, this.box.wd, this.box.hg);
	
	this.ctx.fillStyle = this.textFill;
	this.ctx.font = this.font;
	this.ctx.textAlign = this.textAlign;
	this.ctx.textBaseline = this.textBaseline;
	
	var x = null;
	var y = null;
	
	if (this.textAlign == 'left')
	{
		x = this.box.lf + this.margin;
	}
	else if (this.textAlign == 'center')
	{
		x = this.box.cx;
	}
	else if (this.textAlign == 'right')
	{
		x = this.box.rt - this.margin;
	}
	else
	{
		throw new Error();
	}
	
	if (this.textBaseline == 'top')
	{
		y = this.box.tp + this.baseMargin;
	}
	else if (this.textBaseline == 'middle')
	{
		y = this.box.cy;
	}
	else if (this.textBaseline == 'bottom')
	{
		y = this.box.bt - this.baseMargin;
	}
	else
	{
		throw new Error();
	}
	
	this.ctx.fillText(this.string, x, y);
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
		cell.string = value; // apply formatting here - note that when you want to edit, use the raw toString()
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

Griddl.Components.table = Table;

})();

