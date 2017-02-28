
// Show Rows/Cols shows all adjacent gaps to all selected headers - straddling the gap is not necessary, merely adjacency
// but this makes it hard to precisely select one gap to expand - any expansion that includes the boundaries will affect at least 2 gaps
// so maybe the excel version of expanding internal gaps only is better
// what happens if there is only one col visible?  how do we expand then?
// what happens if zero cols are visible?  do we prevent that from happening, or how do we recover?

// should Hyperdeck.Get returned filtered data? - perhaps set Data._data temporarily when the filter is applied - or perhaps, applyFilter: boolean a Hyperdeck.Get option

// internal/external cut/copy/paste should respect the filter - it works on visible cells only

// Ctrl+Arrow on header cell sorts only on the one col/row, overwriting any existing sort


// styles are displayed as a style object, e.g. {"font": "10pt Courier New", bold:true}
// style formulas support named styles, as well as anything else that produces a style object
// =Styles['default']
// =Styles['default'].extend('bold', true)



// resizing rows also resizes the header row
// 
// Shift+Arrow does not work on row headers
// 
// on col header, Shift+Down moves cursor down - should do nothing
// 
// 

// in big tables, row height is a scalar value, applied to all rows
// hiding rows makes little sense in big tables

// overwrite sort can only be done on one row/col at a time - it must be the cursor row/col

// formula results are not propagated to data - a sort on a formula result just re-exposed the old values
// 
// component content div needs to have overflow:auto and padding:2em and must be able to accomodate the entire grid
// 
// filter, editArray, insertCol/deleteCol need to work with big grids
// 
// make sure cell.row and cell.col stay updated through inserts and deletes
// 
// allow arbitrary javascript objects in the cells
// 
// scrollbars - break drawCell out into separate function, have separate loops for drawing headers
// row resizing when scrolled still doesn't work
// 
// move rows
// hide rows/cols - requires a reposition
// 
// rows/cols should possibly be classes, so that insert/delete/move need not deal with parallel arrays
// 
// SelectionPart should probably be a class
// 
// delete cells (moving others up or left)



// perhaps the grid variables should only refer to the visible grid, disregarding hidden rows and cols entirely
// this would avoid the agonizing interactions with other grid functions, but would break the tight link between data and grid
// from here on out, it would have to be accepted that the grid represents a sparse subset of the data
// what it would really require is a rowHeaders array to allow indirect access to the data
// i -> rowHeaders -> data
// j -> colHeaders -> data obj

// and what we really need is a data structure to represent hidden columns without discarding them
// because we do want to retain some data, like col widths, for hidden cols
// so what we make is a doubly linked list that allows for hidden cols to be "pinched off"
// this requires two sets of next/prev pointers - one for the next/prev visible column and one for the next/prev logical column

// perhaps that's killing a fly with a flamethrower.  maybe we can just save the hidden column objects somewhere else, or just excise them from the list of visible columns

// but like, for some things it really does make sense to have that linked list

// if we move to a linked list, the cursor/anchor has to hold references to Col/Row objects

// a big grid would have to not use Row objects - disallow manual hiding of rows
// and we should eliminate Cell objects entirely, replacing them with Range objects that represent a range of cells with a given formula




var Hyperdeck: any;

var sprintf: (string, any) => string;

interface RowCol { row: number; col: number; }
interface Point { x: number; y: number; }
interface SelectionPart { mode:string; color:string; shimmer:boolean; minCol:number; maxCol:number; minRow:number; maxRow:number; } // mode can be an enum
enum hAlign { left, center, right };
enum vAlign { top, center, bottom };
enum SelectionType { Select , Point };

interface Data {
	_data: any;
	_headers: string[];
}

class Menu {
	
	ctx: CanvasRenderingContext2D;
	
	parent: Grid;
	fns: any[];
	labels: string[];
	
	width: number;
	rowHeight: number;
	textMargin: number;
	font: string;
	
	box: Box;
	
	basicFillColor: string;
	basicTextColor: string;
	hoverFillColor: string;
	hoverTextColor: string;
	hoverIndex: number;
	
	constructor() {
		this.parent = null;
		this.fns = [];
		this.labels = [];
		
		this.width = 100;
		this.rowHeight = 30;
		this.textMargin = 4;
		this.font = '11pt Calibri';
		
		this.box = new Box();
		
		this.basicFillColor = 'rgb(255,255,255)';
		this.basicTextColor = 'rgb(0,0,0)';
		this.hoverFillColor = 'rgb(0,0,255)';
		this.hoverTextColor = 'rgb(255,255,255)';
		this.hoverIndex = null;
	}
	setDimensions() {
		
		var menu = this;
		var wd = menu.width;
		var hg = menu.rowHeight * menu.fns.length;
		menu.box.reconcile({lf:menu.box.lf,tp:menu.box.tp,wd:wd,hg:hg});
	}
	draw() {
		
		var menu = this;
		
		var ctx = menu.parent.ctx;
		
		ctx.fillStyle = menu.basicFillColor;
		ctx.fillRect(menu.box.lf, menu.box.tp, menu.box.wd, menu.box.hg);
		
		ctx.font = menu.font;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		
		for (var i: number = 0; i < menu.fns.length; i++)
		{
			if (menu.hoverIndex == i)
			{
				ctx.fillStyle = menu.hoverFillColor;
				ctx.fillRect(menu.box.lf, menu.box.tp + menu.rowHeight * i, menu.box.wd, menu.rowHeight);
				ctx.fillStyle = menu.hoverTextColor;
			}
			else
			{
				ctx.fillStyle = menu.basicTextColor;
			}
			
			ctx.fillText(menu.labels[i], menu.box.lf + menu.textMargin, menu.box.tp + menu.rowHeight * (i + 0.5));
			
			ctx.strokeStyle = 'rgb(200,200,200)';
			drawLine(ctx, menu.box.lf, menu.box.tp + menu.rowHeight * (i + 1)+0.5, menu.box.lf + menu.box.wd, menu.box.tp + menu.rowHeight * (i + 1)+0.5);
		}
		
		ctx.strokeStyle = 'rgb(0,0,0)';
		ctx.strokeRect(menu.box.lf-0.5, menu.box.tp-0.5, menu.box.wd+1, menu.rowHeight * menu.fns.length+1);
	}
	clear() {
		var menu = this;
		//menu.parent.section.draw();
	}
	
	// these have been obsoleted
	onhover() {
		var menu = this;
		menu.parent.ctx.canvas.style.cursor = 'default';
		menu.parent.ctx.canvas.onmousemove = function(mouseMoveEvent) { menu.onmousemove(mouseMoveEvent); };
	}
	dehover() {
		
		var menu = this;
		
		// 'dehover' is actually caused by a click outside the menu, not just a mousemove outside of the box - Menu.clear() can be called by the parent, in fact
		
		menu.parent.ctx.canvas.onmousemove = null;
		menu.parent.ctx.canvas.onmousedown = null;
		menu.parent.ctx.canvas.onmouseup = null;
		//menu.parent.onhover();
	}
	onmousemove(e) {
		
		var menu = this;
		
		//var mult = menu.parent.ctx.cubitsPerPixel ? menu.parent.ctx.cubitsPerPixel : 1;
		var mult = 1;
		var x = e.offsetX * mult;
		var y = e.offsetY * mult;
		var m = {x:x,y:y};
		
		menu.hoverIndex = null;
		
		for (var i: number = 0; i < menu.fns.length; i++)
		{
			var tp = menu.box.tp + menu.rowHeight * (i + 0);
			var bt = menu.box.tp + menu.rowHeight * (i + 1);
			
			if (menu.box.lf <= m.x && m.x <= menu.box.rt && tp <= m.y && m.y <= bt)
			{
				menu.hoverIndex = i;
				menu.draw();
				
				menu.parent.ctx.canvas.onmousedown = function() {
					menu.fns[menu.hoverIndex].apply(menu.parent);
				};
				
				return;
			}
		}
		
		menu.draw();
		
		menu.parent.ctx.canvas.onmousedown = function(e) { menu.dehover(); };
	}
}
class Scrollbar {
	
	/*
	
	the grid takes up the entire canvas - scrollbars are placed on the sides of the canvas
	
	we keep track of a visible window onto the grid - cell coordinates and whatnot need not be changed
	the window sets a ctx.translate (but keep header cells half-fixed)
	check for each row and cell to make sure it is in bounds before drawing
	
	*/
	
	ctx: CanvasRenderingContext2D;
	parent: Grid;
	orientation: string; // enum
	
	width: number;
	height: number;
	
	box: Box;
	handle: Box;
	
	hovered: boolean;
	
	constructor(ctx, parent, orientation) {
		
		this.ctx = ctx;
		this.parent = parent;
		this.orientation = orientation;
		
		this.width = 10;
		this.height = 20;
		
		this.box = new Box();
		this.handle = new Box();
		
		if (this.orientation == 'v')
		{
			this.box.reconcile({lf:this.ctx.canvas.width-this.width,tp:0,wd:this.width,hg:this.ctx.canvas.height});
			this.handle.reconcile({lf:this.ctx.canvas.width-this.width,tp:0,wd:this.width,hg:this.height});
		}
		else if (this.orientation == 'h')
		{
			
		}
	}
	draw(): void {
		
		var scrollbar = this;
		var ctx = scrollbar.ctx;
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.strokeStyle = 'rgb(128,128,128)'; // rgb(158,182,206)
		ctx.fillStyle = (scrollbar.hovered ? 'rgb(100,100,100)' : 'rgb(128,128,128)');
		ctx.strokeRect(scrollbar.box.lf-0.5, scrollbar.box.tp, scrollbar.box.wd, scrollbar.box.hg);
		ctx.fillRect(scrollbar.handle.lf, scrollbar.handle.tp, scrollbar.handle.wd, scrollbar.handle.hg);
		ctx.restore();
	}
	onhover(): void {
		
		var scrollbar: Scrollbar = this;
		var ctx: CanvasRenderingContext2D = scrollbar.ctx;
		
		ctx.canvas.onmousedown = function(downEvent) {
			
			var ay = downEvent.offsetY;
			
			ctx.canvas.onmousemove = function(moveEvent) {
				
				var my = moveEvent.offsetY;
				var dy = my - ay;
				ay = my;
				
				scrollbar.handle.move(0, dy);
				scrollbar.parent.window.move(0, dy);
				
				scrollbar.parent.draw();
			};
			ctx.canvas.onmouseup = function(upEvent) {
				ctx.canvas.onmousemove = null;
				ctx.canvas.onmouseup = null;
			};
		};
	}
}
class Cell {
	
	grid: Grid = null;
	row: number = null;
	col: number = null;
	
	formula: string = null;
	value: any = null;
	string: string = null; // the cached result of applying the formatObject to the value
	
	formatString: string = null;
	formatObject: any = null;
	
	fn: (i: number) => any = null;
	
	unitType: any = null; // time, length, mass - force, energy, power, etc. - immutable
	unitBase: any = null; // seconds, meters, feet, pounds, kilograms, joules, watts, etc. - mutable
	
	selected: boolean = false;
	calculated: boolean = false;
	visited: boolean = false;
	
	srcs: Cell[] = [];
	dsts: Cell[] = [];
	
	style: Style = null;
	styleFormula: string = null;
	
	constructor() { }
	calculate(): void {
		
		var cell: Cell = this;
		
		if (cell.visited) { throw new Error('circular reference at cell ' + cell.row + ',' + cell.col); }
		cell.visited = true;
		
		// calculate uncalculated srcs first
		cell.srcs.forEach(function(src) { if (!src.calculated) { src.calculate(); } });
		
		var result = cell.fn.call(cell.grid.dataComponent._data, cell.row-1);
		cell.value = result;
		cell.grid.dataComponent._data[cell.row-1][cell.grid.dataComponent._headers[cell.col-1]] = result;
		cell.string = Format(cell.value, cell.formatObject);
		
		cell.calculated = true;
		cell.visited = false;
	}
	markUncalculated(): void {
		
		var cell: Cell = this;
		
		if (cell.calculated)
		{
			cell.calculated = false;
			cell.dsts.forEach(function(dst) { dst.markUncalculated(); });
		}
	}
}
class Column {
	
	grid: Grid = null;
	col: number = null; // this is functionally 1-indexed, to keep it similar to cells, where indexing into headers requires col-1
	
	formula: string = null;
	fn: (i: number) => any = null;
	
	formatString: string = null
	formatObject: any = null;
	
	selected: boolean = false;
	calculated: boolean = true;
	visited: boolean = false;
	
	srcs: Column[] = [];
	dsts: Column[] = [];
	
	styleFormula: string = null;
	style: Style = null;
	
	constructor() { }
	calculate(): void {
		
		var column: Column = this;
		
		if (column.visited) { throw new Error('circular reference at column ' + column.col); }
		column.visited = true;
		
		// calculate uncalculated srcs first
		column.srcs.forEach(function(src) { if (!src.calculated) { src.calculate(); } });
		
		for (var i = 1; i < column.grid.nRows; i++)
		{
			var result = column.fn.call(column.grid.dataComponent._data, i-1);
			column.grid.dataComponent._data[i-1][column.grid.dataComponent._headers[column.col-1]] = result;
			//column.string = Format(column.value, column.formatObject); // we do this during display, to limit it
		}
		
		column.calculated = true;
		column.visited = false;
	}
	markUncalculated(): void {
		
		var column: Column = this;
		
		if (column.calculated)
		{
			column.calculated = false;
			column.dsts.forEach(function(dst) { dst.markUncalculated(); });
		}
	}
}
class Style {
	
	font: string = '11pt Calibri';
	textColor: string = 'rgb(0,0,0)';
	hAlign: string = 'center';
	vAlign: string = 'center';
	backgroundColor: string = null;
	border: any = null;
	hMargin: number = 5; // this is the margin between cell border and cell text
	vMargin: number = 4;
	
	// border: we need syntax to deal with TLRB, color, lineWidth, type (solid, dotted, dashed, etc)
	// either syntax or more tables, which i'm reluctant to do b/c it would be a lot of tables
	// maybe CSS is the best inspiration for syntax here, since CSS itself uses syntax
	// border-top: 1px solid gray
	
	constructor() { }
	toString() {
		return '{}';
	}
	static Parse(str) {
		var obj = JSON.parse(str);
		var style = new Style();
		if (obj.font !== undefined) { style.font = obj.font; }
		if (obj.textColor !== undefined) { style.textColor = obj.textColor; }
		if (obj.hAlign !== undefined) { style.hAlign = obj.hAlign; }
		if (obj.vAlign !== undefined) { style.vAlign = obj.vAlign; }
		if (obj.backgroundColor !== undefined) { style.backgroundColor = obj.backgroundColor; }
		if (obj.border !== undefined) { style.border = obj.border; }
		if (obj.hMargin !== undefined) { style.hMargin = obj.hMargin; }
		if (obj.vMargin !== undefined) { style.vMargin = obj.vMargin; }
		return style;
	}
}


class Row { }
class Col { }
class Range {
	
	minRow: Row;
	maxRow: Row;
	minCol: Col;
	maxCol: Col;
}
class FormulaRange extends Range {
	
	formula: string = null;
	fn: (i: number) => any = null;
}
class FormatRange extends Range {
	
	formatString: string = null;
	formatObject: any = null;
}
class StyleRange extends Range {
	
	styleFormula: string = null;
	style: Style = null;
}

class LinkedList<T> {
	
	_data: T;
	_prev: LinkedList<T>;
	_next: LinkedList<T>;
	
	_add(data: T): LinkedList<T> {
		
		// this must be called on the sentinel
		
		var elt = new LinkedList<T>();
		elt._data = data;
		elt._next = this;
		elt._prev = this._prev;
		
		if (this._next === this) { this._next = elt; } else { this._prev._next = elt; }
		this._prev = elt;
		
		return elt;
	}
	_remove(): void {
		
		// this cannot be called on the sentinel
		this._prev._next = this._next;
		this._next._prev = this._prev;
	}
	_enumerate(): T[] {
		
		// this must be called on the sentinel
		
		var list: T[] = [];
		var elt = this._next;
		
		while (elt !== this)
		{
			list.push(elt._data);
			elt = elt._next;
		}
		
		return list;
	}
}
class HiddenList<T> extends LinkedList<T> {
	
	visibleNext: HiddenList<T>;
	visiblePrev: HiddenList<T>;
	
	hideUntil(that: HiddenList<T>) {
		this.visibleNext = that;
		that.visiblePrev = this;
	}
	showUntil(that: HiddenList<T>) {
		this.visibleNext = this._next as HiddenList<T>;
		that.visiblePrev = that._prev as HiddenList<T>;
	}
}

export class Grid {
	
	params: any;
	
	big: boolean; // big grids create column objects rather than cell objects and has fixed rowSizes, eliminating the need for ys and rowSizes
	fixedRowSize: number;
	
	defaultCellStroke: string;
	defaultHeaderStroke: string;
	selectedCellStroke: string;
	selectedHeaderStroke: string;
	defaultCellFill: string;
	defaultHeaderFill: string;
	selectedCellFill: string;
	selectedHeaderFill: string;
	
	shift: boolean;
	ctrl: boolean;
	alt: boolean;
	
	display: string; // values, formulas, formats, styles, styleFormulas
	
	nRows: number; // includes headers
	nCols: number; // includes headers
	rowsWithSelection: boolean[]; // includes headers, for displaying a different color in the headers
	colsWithSelection: boolean[]; // includes headers, for displaying a different color in the headers
	rowsVisible: boolean[]; // includes headers, for filtering and hiding
	colsVisible: boolean[]; // includes headers, for filtering and hiding
	rowSizes: number[]; // includes headers
	colSizes: number[]; // includes headers
	xs: number[]; // fencepost with colSizes
	ys: number[]; // fencepost with rowSizes
	
	cells: Cell[][];
	columns: Column[];
	
	div: HTMLElement;
	ctx: CanvasRenderingContext2D;
	input: any;
	textarea: any;
	
	box: Box;
	
	focusSelected: SelectionPart;
	selected: SelectionPart[];
	cursor: RowCol;
	anchor: RowCol;
	
	dataComponent: Data;
	
	sortFn: any; // (a: any, b: any) => number
	filterFn: any; // (x: any) => boolean
	
	menu: Menu;
	
	hScrollbar: Scrollbar;
	vScrollbar: Scrollbar;
	window: Box; // controlled by scrollbars
	
	styles: Style[];
	
	constructor(dataComponent: any, div: HTMLElement, big: boolean) {
		
		this.params = null;
		
		if (dataComponent.gridParams == null)
		{
			this.params = {
				"display": "values",
				"rowSizes": null,
				"colSizes": null,
				"xOffset": 0,
				"yOffset": 0,
				"box": {
					"hAlign": "left",
					"vAlign": "top",
					"xAnchor": "left",
					"yAnchor": "top",
					"x": 1,
					"y": 1
				}
			};
		}
		else
		{
			this.params = dataComponent.gridParams;
		}
		
		this.big = big;
		this.fixedRowSize = 20;
		
		this.defaultCellStroke = 'rgb(208,215,229)'; // rgb(158,182,206)
		this.defaultHeaderStroke = 'rgb(158,182,206)';
		this.selectedCellStroke = 'rgb(242,149,54)';
		this.selectedHeaderStroke = 'rgb(242,149,54)';
		this.defaultCellFill = 'rgb(255,255,255)';
		this.defaultHeaderFill = 'rgb(208,215,229)';
		this.selectedCellFill = 'rgb(210,210,240)';
		this.selectedHeaderFill = 'rgb(255,213,141)';
		
		this.shift = false;
		this.ctrl = false;
		this.alt = false;
		
		this.display = this.params.display; // values, formulas, formatStrings, style, font, fill, hAlign, vAlign, backgroundColor, border
		
		this.div = div;
		
		var canvas = document.createElement('canvas');
		canvas.width = this.div.clientWidth; // perhaps set a onresize handler on this.div to resize the canvas as well
		canvas.height = this.div.clientHeight;
		canvas.tabIndex = 0;
		
		this.input = document.createElement('input');
		this.input.type = 'text';
		this.input.style.position = 'relative';
		this.input.style.display = 'none';
		
		this.textarea = document.createElement('textarea');
		this.textarea.style.position = 'relative';
		this.textarea.style.display = 'none';
		
		this.div.appendChild(canvas);
		this.div.appendChild(this.input);
		this.div.appendChild(this.textarea);
		
		this.ctx = canvas.getContext('2d');
		
		this.dataComponent = dataComponent;
		
		Object.defineProperty(this, 'data', { 
			get : function() {
				return this.dataComponent._data;
			},
			set : function(value) {
				this.dataComponent._data = value;
				//if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
				// redo everything
			}
		});
		
		this.focusSelected = null; // Selection : {mode:'Select',color:'rgb(0,0,0)',shimmer:false,minCol:null,maxCol:null,minRow:null,maxRow:null}
		this.selected = null; // [ Selection ]
		this.cursor = {row:null,col:null}; // { row : int , col : int }
		this.anchor = {row:null,col:null}; // { row : int , col : int }
		
		this.menu = null;
		this.hScrollbar = null; // new Scrollbar(this.ctx, this, 'h')
		//this.vScrollbar = new Scrollbar(this.ctx, this, 'v');
		
		this.styles = [ new Style() ];
		
		this.resetData();
		this.setMouseHandles();
		this.setKeyHandles();
		this.ctx.canvas.focus();
		this.draw();
	}
	
	resetData(): void {
		
		var grid: Grid = this;
		
		// duplicate of clearSelection, but avoids redraw
		//grid.selected = [];
		//grid.focusSelected = null;
		//grid.cursor = {row:null,col:null};
		//grid.anchor = {row:null,col:null};
		
		grid.nRows = grid.dataComponent._data.length + 1;
		grid.nCols = grid.dataComponent._headers.length + 1;
		//grid.nCols = grid.data.map(x => x.length).reduce(function(a, b) { return Math.max(a, b); });
		grid.rowsWithSelection = InitArray(grid.nRows, false); // this is just for displaying a different color in the headers
		grid.colsWithSelection = InitArray(grid.nCols, false);
		grid.rowsVisible = InitArray(grid.nRows, true);
		grid.colsVisible = InitArray(grid.nCols, true);
		grid.rowSizes = grid.big ? null : (grid.params.rowSizes ? grid.params.rowSizes : InitArray(grid.nRows, grid.fixedRowSize)); // int[], includes headers
		grid.colSizes = grid.params.colSizes ? grid.params.colSizes : InitArray(grid.nCols, 64); // int[], includes headers
		grid.xs = null; // int[], fencepost with colSizes
		grid.ys = null; // int[], fencepost with rowSizes
		
		if (grid.big)
		{
			var y = grid.params.box.y;
			grid.ys = [ y ];
			for (var i = 0; i < grid.nRows; i++) { if (grid.rowsVisible[i]) { y += grid.fixedRowSize; } grid.ys.push(y); }
		}
		
		// the mechanics of row and col resizing work best if the grid's anchor is mandated to be tp/lf, but users might want centering
		grid.box = new Box();
		grid.box.x = grid.params.box.x;
		grid.box.y = grid.params.box.y;
		grid.box.hAlign = grid.params.box.hAlign;
		grid.box.vAlign = grid.params.box.vAlign;
		grid.box.wd = grid.colSizes.reduce(function(a, b) { return a + b; });
		grid.box.hg = grid.big ? (grid.nRows * grid.fixedRowSize) : grid.rowSizes.reduce(function(a, b) { return a + b; });
		
		grid.window = new Box();
		grid.window.reconcile({lf:0,tp:0,wd:grid.ctx.canvas.width,hg:grid.ctx.canvas.height});
		
		if (grid.big)
		{
			grid.columns = [];
			
			for (var j = 1; j < grid.nCols; j++)
			{
				var column = new Column();
				column.grid = grid;
				column.col = j;
				column.style = grid.styles[0];
				grid.columns.push(column);
			}
		}
		else
		{
			grid.cells = InitCells(grid, grid.nRows, grid.nCols);
			
			grid.cells[0][0].string = '';
			
			for (var i = 1; i < grid.nRows; i++)
			{
				grid.cells[i][0].string = (i - 1).toString();
			}
			
			for (var j = 1; j < grid.nCols; j++)
			{
				grid.cells[0][j].string = grid.dataComponent._headers[j-1];
			}
			
			for (var i = 1; i < grid.nRows; i++)
			{
				for (var j = 1; j < grid.nCols; j++)
				{
					var data = grid.dataComponent._data[i-1][grid.dataComponent._headers[j-1]];
					
					// this needs to merge with acceptEdit
					if (typeof(data) == 'string' && data.length > 0 && data[0] == '=')
					{
						grid.cells[i][j].formula = data;
					}
					else
					{
						grid.cells[i][j].formula = data.toString();
						grid.cells[i][j].value = data;
						grid.cells[i][j].calculated = true;
					}
					
					grid.cells[i][j].style = grid.styles[0];
				}
			}
		}
		
		grid.calculate();
		grid.position();
		grid.format();
		grid.draw();
	}
	
	position(): void {
		
		var grid = this;
		
		// grid.position() should be called after a change to rowSizes or colSizes
		// must change this to account for rowsVisible and colsVisible
		grid.box.wd = grid.colSizes.reduce(function(a, b) { return a + b; });
		grid.box.hg = grid.big ? (grid.nRows * grid.fixedRowSize) : grid.rowSizes.reduce(function(a, b) { return a + b; });
		grid.box.align();
	}
	draw(): void {
		
		var grid: Grid = this;
		var ctx: CanvasRenderingContext2D = grid.ctx;
		
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, grid.ctx.canvas.width, grid.ctx.canvas.height);
		
		// starting with the left, top, rowSizes, and colSizes, recalculate xs, ys, and the other box vars
		var x: number = grid.box.lf;
		var y: number = grid.box.tp;
		grid.xs = [ x ];
		for (var j: number = 0; j < grid.nCols; j++) { if (grid.colsVisible[j]) { x += grid.colSizes[j]; } grid.xs.push(x); }
		
		if (!grid.big)
		{
			grid.ys = [ y ];
			for (var i: number = 0; i < grid.nRows; i++) { if (grid.rowsVisible[i]) { y += grid.rowSizes[i]; } grid.ys.push(y); }
		}
		
		// perhaps we ought to draw the header cells separately, so that they can be drawn in fixed positions
		// this would require breaking our drawCell into a separate function
		
		ctx.setTransform(1, 0, 0, 1, -grid.window.lf, -grid.window.tp);
		
		// draw cell fills and text - we'll draw strokes and the selection box later on
		for (var i: number = 0; i < grid.nRows; i++)
		{
			if (grid.ys[i] > grid.window.bt) { break; }
			if (grid.ys[i+1] < grid.window.tp || !grid.rowsVisible[i]) { continue; }
			
			for (var j: number = 0; j < grid.nCols; j++)
			{
				if (!grid.colsVisible[j]) { continue; }
				
				var string: string = null;
				var isSelected: boolean = false; // not sure how to handle selection in columns
				var style: Style = grid.styles[0];
				
				// in big grids, we don't have Cells to cache the string, so we have to format on the fly
				if (grid.big)
				{
					if (i == 0 && j == 0)
					{
						string = '';
					}
					else if (i == 0)
					{
						string = grid.dataComponent._headers[j-1];
					}
					else if (j == 0)
					{
						string = (i-1).toString();
					}
					else
					{
						var column: Column = grid.columns[j-1];
						style = column.style;
						string = Format(grid.dataComponent._data[i-1][grid.dataComponent._headers[j-1]], column.formatObject);
					}
				}
				else
				{
					var cell: Cell = grid.cells[i][j];
					style = cell.style;
					isSelected = cell.selected;
					string = cell.string;
				}
				
				if (i == 0 && j == 0)
				{
					ctx.fillStyle = grid.defaultHeaderFill;
				}
				else if (i == 0)
				{
					if (grid.colsWithSelection[j])
					{
						ctx.fillStyle = grid.selectedHeaderFill;
					}
					else
					{
						ctx.fillStyle = grid.defaultHeaderFill;
					}
				}
				else if (j == 0)
				{
					if (grid.rowsWithSelection[i])
					{
						ctx.fillStyle = grid.selectedHeaderFill;
					}
					else
					{
						ctx.fillStyle = grid.defaultHeaderFill;
					}
				}
				else
				{
					if (isSelected && (i != grid.cursor.row || j != grid.cursor.col))
					{
						ctx.fillStyle = grid.selectedCellFill; // what if there is a set background color?
					}
					else
					{
						if (style.backgroundColor)
						{
							ctx.fillStyle = style.backgroundColor;
						}
						else
						{
							ctx.fillStyle = grid.defaultCellFill;
						}
					}
				}
				
				var lf: number = grid.xs[j + 0];
				var rt: number = grid.xs[j + 1];
				var tp: number = grid.ys[i + 0];
				var bt: number = grid.ys[i + 1];
				var wd: number = rt - lf;
				var hg: number = bt - tp;
				var cx: number = (lf + rt) / 2;
				var cy: number = (tp + bt) / 2;
				
				// clipping path to prevent text overflow
				ctx.save();
				ctx.beginPath();
				ctx.rect(lf, tp, wd, hg);
				ctx.clip();
				
				ctx.fillRect(lf, tp, wd, hg);
				
				var hAlign: string = style.hAlign;
				var vAlign: string = style.vAlign;
				
				var x: number = null;
				var y: number = null;
				
				if (hAlign == 'left')
				{
					x = lf + style.hMargin;
				}
				else if (hAlign == 'center')
				{
					x = cx;
				}
				else if (hAlign == 'right')
				{
					x = rt - style.hMargin;
				}
				else
				{
					throw new Error();
				}
				
				if (vAlign == 'top')
				{
					y = tp + style.vMargin;
				}
				else if (vAlign == 'center')
				{
					y = cy;
				}
				else if (vAlign == 'bottom')
				{
					y = bt - style.vMargin;
				}
				else
				{
					throw new Error();
				}
				
				ctx.fillStyle = style.textColor;
				ctx.font = style.font;
				ctx.textAlign = hAlign;
				ctx.textBaseline = ((vAlign == 'center') ? 'middle' : vAlign);
				ctx.fillText(string, x, y);
				
				// heck, maybe cells *should* draw their own borders
				
				ctx.restore(); // clear clipping path
			}
		}
		
		var labelCellStroke: string = 'rgb(0,0,0)';
		var normalStroke: string = 'rgb(0,0,0)';
		var selectedStroke: string = 'rgb(0,0,0)';
		
		var x0: number = grid.xs[0];
		var x1: number = grid.xs[1];
		var y0: number = grid.ys[0];
		var y1: number = grid.ys[1];
		var lf: number = grid.xs[0];
		var rt: number = grid.xs[grid.xs.length-1];
		var tp: number = grid.ys[0];
		var bt: number = grid.ys[grid.ys.length-1];
		
		ctx.lineWidth = 1;
		
		// first draw normal strokes
		for (var i: number = 0; i < grid.ys.length; i++)
		{
			var y: number = grid.ys[i];
			
			if (y > grid.window.bt) { break; }
			if (y < grid.window.tp) { continue; }
			
			// long strokes
			ctx.strokeStyle = i < 2 ? labelCellStroke : normalStroke;
			drawLine(ctx, lf - 0.5, y - 0.5, rt, y - 0.5);
			
			// short label cell strokes
			ctx.strokeStyle = labelCellStroke;
			drawLine(ctx, x0 - 0.5, y - 0.5, x1, y - 0.5);
		}
		
		for (var i: number = 0; i < grid.xs.length; i++)
		{
			var x: number = grid.xs[i];
			
			// long strokes
			ctx.strokeStyle = i < 2 ? labelCellStroke : normalStroke;
			drawLine(ctx, x - 0.5, tp - 0.5, x - 0.5, bt);
			
			// short label cell strokes
			ctx.strokeStyle = labelCellStroke;
			drawLine(ctx, x - 0.5, y0 - 0.5, x - 0.5, y1);
		}
		
		// then draw selected strokes
		if (grid.selected)
		{
			for (var k = 0; k < grid.selected.length; k++)
			{
				var sel: SelectionPart = grid.selected[k];
				var mode: string = sel.mode;
				
				var lf: number = grid.xs[sel.minCol];
				var rt: number = grid.xs[sel.maxCol + 1];
				var tp: number = grid.ys[sel.minRow];
				var bt: number = grid.ys[sel.maxRow + 1];
				var wd: number = rt - lf;
				var hg: number = bt - tp;
				
				// first draw the short orange strokes on the row and col header cells, 
				if (sel.minRow > 0) // so that the selection indicator is not drawn on the title cell when a col label is selected
				{
					ctx.strokeStyle = selectedStroke;
					
					for (var i = sel.minRow; i <= sel.maxRow + 1; i++)
					{
						var y: number = grid.ys[i];
						drawLine(ctx, x0 - 0.5, y - 0.5, x1, y - 0.5); // short horizontal strokes
					}
					
					var sy0: number = grid.ys[sel.minRow];
					var sy1: number = grid.ys[sel.maxRow + 1];
					
					drawLine(ctx, x0 - 0.5, sy0 - 0.5, x0 - 0.5, sy1); // long vertical strokes
					drawLine(ctx, x1 - 0.5, sy0 - 0.5, x1 - 0.5, sy1);
				}
				
				if (sel.minCol > 0) // so that the selection indicator is not drawn on the title cell when a row label is selected
				{
					ctx.strokeStyle = selectedStroke;
					
					for (var j: number = sel.minCol; j <= sel.maxCol + 1; j++)
					{
						var x: number = grid.xs[j];
						drawLine(ctx, x - 0.5, y0 - 0.5, x - 0.5, y1); // short vertical strokes
					}
					
					var sx0: number = grid.xs[sel.minCol];
					var sx1: number = grid.xs[sel.maxCol + 1];
					
					drawLine(ctx, sx0 - 0.5, y0 - 0.5, sx1, y0 - 0.5); // long horizontal strokes
					drawLine(ctx, sx0 - 0.5, y1 - 0.5, sx1, y1 - 0.5);
				}
				
				if (mode == 'Select')
				{
					// now draw the thick black selection box
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
					
					ctx.strokeStyle = sel.color;
					drawLine(ctx, lf, tp, rt, tp);
					drawLine(ctx, rt, tp, rt, bt);
					drawLine(ctx, lf, bt, rt, bt);
					drawLine(ctx, lf, tp, lf, bt);
					
					ctx.fillStyle = sel.color;
					//ctx.fillRect(rt - 3, bt - 3, 5, 5); // handle square
				}
				else
				{
					throw new Error();
				}
			}
		}
		
		if (grid.hScrollbar) { grid.hScrollbar.draw(); }
		if (grid.vScrollbar) { grid.vScrollbar.draw(); }
	}
	
	calculate(): void {
		
		var grid: Grid = this;
		
		if (grid.big)
		{
			grid.columns.forEach(function(column) { if (!column.calculated) { column.calculate(); } });
		}
		else
		{
			// this could be sped up if we could just keep a list of all cells that were marked uncalculated
			for (var i = 1; i < grid.cells.length; i++)
			{
				for (var j = 1; j < grid.cells[i].length; j++)
				{
					var cell: Cell = grid.cells[i][j];
					
					if (!cell.calculated)
					{
						cell.calculate();
					}
				}
			}
		}
	}
	
	setMouseHandles(): void {
		
		var grid: Grid = this;
		var canvas = grid.ctx.canvas;
		
		canvas.onmousewheel = function(wheelEvent: MouseWheelEvent) {
			
			wheelEvent.preventDefault();
			wheelEvent.stopPropagation();
			
			var clicks: number = wheelEvent.wheelDelta / 120;
			var cubitsPerRow: number = 20;
			// Shift+Scroll = 1 cell, Scroll = 10 cells, Ctrl+Scroll = 100 cells, Ctrl+Shift+Scroll = 1000 cells
			// Shift+ above = Scroll horizontal?
			// this requires some calculation
			
			var multiplier: number = (grid.ctrl && grid.shift && grid.alt) ? 10000 : ((grid.ctrl && grid.shift) ? 1000 : (grid.ctrl ? 100 : (grid.shift ? 1 : 10)));
			
			var offset: number = -clicks * multiplier * cubitsPerRow;
			
			grid.scroll(offset);
		};
		
		canvas.onmousedown = null;
		canvas.onmouseup = null;
		canvas.onmousemove = function(mouseMoveEvent) {
			
			var m: Point = grid.getCoords(mouseMoveEvent); // this handles scaling, independent of scrolling translations
			
			if (grid.vScrollbar)
			{
				if (grid.vScrollbar.handle.contains(m))
				{
					grid.vScrollbar.hovered = true;
					grid.draw();
					canvas.onmousedown = function(mouseDownEvent) {
						var anchor: Point = grid.getCoords(mouseDownEvent);
						canvas.onmouseup = function(mouseUpEvent) { grid.setMouseHandles(); };
						canvas.onmousemove = function(mouseDragEvent) {
							var cursor: Point = grid.getCoords(mouseDragEvent);
							// drag it
						};
					};
					
					return;
				}
				
				if (grid.vScrollbar.hovered) { grid.vScrollbar.hovered = false; grid.draw(); }
			}
			
			// after handling all the fixed elements, now we account for the scroll translation
			// note that, if we want to make the headers fixed-position, this will have to change
			// we could probably do well by saving the untransformed coordinates and then passing both sets of coordinates to pointToRowCol
			m.x += grid.window.lf;
			m.y += grid.window.tp;
			
			var xMin: number = grid.xs[0];
			var xMax: number = grid.xs[grid.xs.length - 1];
			var yMin: number = grid.ys[0];
			var yMax: number = grid.ys[grid.ys.length - 1];
			
			var x0: number = grid.xs[0];
			var x1: number = grid.xs[1];
			var y0: number = grid.ys[0];
			var y1: number = grid.ys[1];
			
			// move grid - handle is top and left borders of the title cell
			if ((y0 - 1 <= m.y && m.y <= y0 + 1 && x0 <= m.x && m.x < x1) || (x0 - 1 <= m.x && m.x <= x0 + 1 && y0 <= m.y && m.y < y1))
			{
				canvas.style.cursor = 'move';
				return;
			}
			
			// reorder rows/cols - top and left borders of grid, excepting the title cell
			if ((y0 - 1 <= m.y && m.y <= y0 + 1 && x1 <= m.x && m.x <= xMax) || (x0 - 1 <= m.x && m.x <= x0 + 1 && y1 <= m.y && m.y <= yMax))
			{
				canvas.style.cursor = 'hand';
				return;
			}
			
			// row resize
			if (x0 < m.x && m.x < x1)
			{
				for (var i: number = 0; i < grid.nRows; i++)
				{
					var y: number = grid.ys[i + 1];
					
					if (y - 1 <= m.y && m.y <= y + 1)
					{
						canvas.style.cursor = 'row-resize';
						
						var prevY: number = grid.ys[i];
						var rowToResize: number = i;
						
						canvas.onmousedown = function(mouseDownEvent) {
							canvas.onmouseup = function(mouseUpEvent) { grid.setMouseHandles(); };
							canvas.onmousemove = function(mouseDragEvent) {
								
								var curr: Point = grid.getCoords(mouseDragEvent);
								curr.x += grid.window.lf;
								curr.y += grid.window.tp;
								
								var newsize: number = Math.max(curr.y - prevY, 2);
								
								for (var k: number = 0; k < grid.rowSizes.length; k++)
								{
									if (k == rowToResize || grid.rowsWithSelection[k-1])
									{
										grid.rowSizes[k] = newsize;
									}
								}
								
								grid.position();
								grid.draw();
							};
						};
						
						return;
					}
				}
			}
			
			// col resize
			if (y0 < m.y && m.y < y1)
			{
				for (var j: number = 0; j < grid.nCols; j++)
				{
					var x: number = grid.xs[j + 1];
					
					if (x - 1 <= m.x && m.x <= x + 1)
					{
						canvas.style.cursor = 'col-resize';
						
						var prevX: number = grid.xs[j];
						var colToResize: number = j;
						
						canvas.onmousedown = function(mouseDownEvent) {
							canvas.onmouseup = function(mouseUpEvent) { grid.setMouseHandles(); };
							canvas.onmousemove = function(mouseDragEvent) {
								
								var curr: Point = grid.getCoords(mouseDragEvent);
								curr.x += grid.window.lf;
								curr.y += grid.window.tp;
								
								var newsize: number = Math.max(curr.x - prevX, 2);
								
								for (var k: number = 0; k < grid.colSizes.length; k++)
								{
									if (k == colToResize || grid.colsWithSelection[k-1])
									{
										grid.colSizes[k] = newsize;
									}
								}
								
								grid.position();
								grid.draw();
							};
						};
						
						return;
					}
				}
			}
			
			// cells
			if (xMin < m.x && m.x < xMax && yMin < m.y && m.y < yMax)
			{
				canvas.style.cursor = 'cell';
				
				canvas.onmousedown = function(mouseDownEvent) {
					
					var a: Point = grid.getCoords(mouseDownEvent);
					a.x += grid.window.lf;
					a.y += grid.window.tp;
					
					var target: RowCol = grid.pointToRowCol(a.x, a.y);
					
					if (target.row == 0 && target.col == 0) { return; } // cannot select top-left cell
					
					grid.anchor.row = target.row;
					grid.anchor.col = target.col;
					grid.cursor.row = target.row;
					grid.cursor.col = target.col;
					
					grid.selected = []; // don't clear existing selections if Ctrl is down
					var selected: SelectionPart = {mode:'Select',color:'rgb(0,0,0)',shimmer:false,minCol:null,maxCol:null,minRow:null,maxRow:null};
					grid.focusSelected = selected;
					grid.selected.push(selected);
					
					grid.selectCell();
					
					if (mouseDownEvent.button == 0)
					{
						canvas.onmousemove = function(mouseDragEvent) {
							
							var d: Point = grid.getCoords(mouseDragEvent);
							d.x += grid.window.lf;
							d.y += grid.window.tp;
							
							if (d.x < grid.xs[1] || d.x > grid.xs[grid.xs.length - 1]|| d.y < grid.ys[1] || d.y > grid.ys[grid.ys.length - 1]) { return; }
							
							// select range of cells
							var pointedRowCol: RowCol = grid.pointToRowCol(d.x, d.y);
							if (grid.cursor.row != pointedRowCol.row || grid.cursor.col != pointedRowCol.col)
							{
								grid.cursor = pointedRowCol;
								grid.selectRange();
							}
						};
						canvas.onmouseup = function(mouseUpEvent) {
							grid.setMouseHandles();
						};
					}
					else if (mouseDownEvent.button == 2)
					{
						//mouseDownEvent.preventDefault();
						//mouseDownEvent.stopPropagation();
						//mouseDownEvent.stopImmediatePropagation();
						
						grid.menu = new Menu();
						grid.menu.parent = grid;
						grid.menu.box.lf = a.x;
						grid.menu.box.tp = a.y;
						grid.menu.fns.push(grid.insertRowsAbove);
						grid.menu.fns.push(grid.insertRowsBelow);
						grid.menu.fns.push(grid.insertColsLeft);
						grid.menu.fns.push(grid.insertColsRight);
						grid.menu.fns.push(grid.deleteRows);
						grid.menu.fns.push(grid.deleteCols);
						grid.menu.labels.push('insertRowsAbove');
						grid.menu.labels.push('insertRowsBelow');
						grid.menu.labels.push('insertColsLeft');
						grid.menu.labels.push('insertColsRight');
						grid.menu.labels.push('deleteRows');
						grid.menu.labels.push('deleteCols');
						grid.menu.setDimensions();
						grid.menu.draw();
						grid.menu.onhover();
						
						canvas.oncontextmenu = function(contextMenuEvent) {
							contextMenuEvent.preventDefault();
							contextMenuEvent.stopPropagation();
							contextMenuEvent.stopImmediatePropagation();
						};
					}
					else
					{
						
					}
				};
				
				return;
			}
			
			canvas.style.cursor = 'default';
			canvas.onmousedown = function(mouseDownEvent) { grid.clearSelection(); };
		};
	}
	setKeyHandles(): void {
		
		var grid: Grid = this;
		var canvas = grid.ctx.canvas;
		
		canvas.onkeyup = function(keyUpEvent) {
			
			var key: number = keyUpEvent.keyCode;
			
			if (key == 16) // shift
			{
				grid.shift = false;
			}
			else if (key == 17) // ctrl
			{
				grid.ctrl = false;
			}
			else if (key == 18) // alt
			{
				grid.alt = false;
			}
		};
		canvas.onkeydown = function(e) {
			
			e.preventDefault();
			e.stopPropagation();
			
			var key: number = e.keyCode;
			
			var min = 1; // set grid to 0 to allow selection of row/col headers
			var maxRow = grid.nRows - 1;
			var maxCol = grid.nCols - 1;
			
			if (key == 16) // shift
			{
				grid.shift = true;
			}
			else if (key == 17) // ctrl
			{
				grid.ctrl = true;
			}
			else if (key == 18) // alt
			{
				grid.alt = true;
			}
			
			if (grid.selected.length == 0) { return; }
			
			if (key == 46) // del
			{
				grid.actOnSelection(grid.deleteCellContents);
			}
			else if (key == 27) // esc
			{
				grid.selected = [];
				grid.focusSelected = null;
				grid.cursor.row = null;
				grid.cursor.col = null;
				grid.anchor.row = null;
				grid.anchor.col = null;
				grid.cacheSelectedCells();
				grid.draw();
				grid.ctx.canvas.onkeydown = null;
			}
			else if (key == 32) // space
			{
				// SelectRow, SelectCol, SelectWhole do not go through selectRange()
				// because selectRange reads from cursor/anchor, but we're not actually changing the cursor/anchor here
				// the cursor can end up in the middle of a selected range - not sure what we should do with it actually
				
				if (e.ctrlKey && e.shiftKey) // select whole grid - this is different from Excel
				{
					grid.focusSelected.minRow = min;
					grid.focusSelected.maxRow = grid.nRows - 1;
					grid.focusSelected.minCol = min;
					grid.focusSelected.maxCol = grid.nCols - 1;
					
					grid.cacheSelectedCells();
					grid.draw();
				}
				else if (e.shiftKey) // select whole row
				{
					grid.focusSelected.minCol = min;
					grid.focusSelected.maxCol = grid.nCols - 1;
					
					grid.cacheSelectedCells();
					grid.draw();
				}
				else if (e.ctrlKey) // select whole col
				{
					grid.focusSelected.minRow = min;
					grid.focusSelected.maxRow = grid.nRows - 1;
					
					grid.cacheSelectedCells();
					grid.draw();
				}
				else
				{
					grid.beginEdit(null);
				}
			}
			else if (key == 37 || key == 38 || key == 39 || key == 40) // arrow
			{
				if (grid.focusSelected.minRow == 0 && grid.focusSelected.maxRow == 0) // col header selected
				{
					if (e.altKey)
					{
						if (key == 37) // left
						{
							grid.moveColsLeft();
						}
						else if (key == 38) // up
						{
							grid.hideCols();
						}
						else if (key == 39) // right
						{
							grid.moveColsRight();
						}
						else if (key == 40) // down
						{
							grid.showCols();
						}
					}
					else if (e.ctrlKey)
					{
						if (key == 37) // left
						{
							
						}
						else if (key == 38) // up - sort ascending
						{
							var header = grid.dataComponent._headers[grid.cursor.col-1];
							grid.setSort('a.' + header + ' - b.' + header);
							grid.cacheSelectedCells();
						}
						else if (key == 39) // right
						{
							
						}
						else if (key == 40) // down - sort descending
						{
							var header = grid.dataComponent._headers[grid.cursor.col-1];
							grid.setSort('b.' + header + ' - a.' + header);
							grid.cacheSelectedCells();
						}
					}
					else // Arrow or Shift+Arrow - move cursor like normal
					{
						if (key == 37 || key == 39)
						{
							if (key == 37) // left
							{
								if (grid.cursor.col > min) { grid.cursor.col--; }
							}
							else if (key == 39) // right
							{
								if (grid.cursor.col < maxCol) { grid.cursor.col++; }
							}
							
							if (e.shiftKey)
							{
								grid.selectRange();
							}
							else
							{
								grid.selectCell();
							}
						}
						else if (key == 38) // up
						{
							
						}
						else if (key == 40) // down
						{
							grid.cursor.row++;
							grid.selectCell();
						}
					}
				}
				else if (grid.focusSelected.minCol == 0 && grid.focusSelected.maxCol == 0) // row header selected
				{
					if (e.altKey)
					{
						//if (key == 37) // left
						//{
						//	grid.moveColsLeft();
						//}
						//else if (key == 38) // up
						//{
						//	//grid.hideCols();
						//}
						//else if (key == 39) // right
						//{
						//	grid.moveColsRight();
						//}
						//else if (key == 40) // down
						//{
						//	//grid.showCols();
						//}
					}
				}
				else // data cells selected
				{
					if (e.altKey) // insert/delete/move/hide rows/cols
					{
						if (e.shiftKey) // delete rows/cols
						{
							if (key == 37 || key == 39) // left and right are identical for deletion
							{
								grid.deleteCols();
							}
							else if (key == 38 || key == 40) // up and down are identical for deletion
							{
								grid.deleteRows();
							}
						}
						else
						{
							if (key == 37) // left
							{
								grid.insertColsLeft();
							}
							else if (key == 38) // up
							{
								grid.insertRowsAbove();
							}
							else if (key == 39) // right
							{
								grid.insertColsRight();
							}
							else if (key == 40) // down
							{
								grid.insertRowsBelow();
							}
						}
					}
					else // data cell, ctrl/shift/arrow - move/extend cursor/selection
					{
						if (key == 37) // left
						{
							if (e.ctrlKey)
							{
								if (grid.cursor.col == min)
								{
									grid.cursor.col = 0;
								}
								else
								{
									grid.cursor.col = min;
								}
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
								if (grid.cursor.row == min)
								{
									grid.cursor.row = 0;
								}
								else
								{
									grid.cursor.row = min;
								}
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
							grid.selectCell();
						}
					}
				}
			}
			else if (key == 113) // F2 = edit
			{
				grid.beginEdit(null);
			}
			else if (key == 114 || key == 115 || key == 116 || key == 117) // F3/F4/F5/F6 = display as tsv/csv/json/yaml
			{
				grid.beginEditArray(['tsv','csv','json','yaml'][key-114]);
			}
			else if ((48 <= key && key <= 57) || (65 <= key && key <= 90) || (186 <= key && key <= 192) || (219 <= key && key <= 222))
			{
				if (e.ctrlKey)
				{
					if (key == 67 || key == 86) // C or V (and X)
					{
						// internal copy-paste
						
						// copy values to cursor - loop over src, guard for row/col length overflows (this is not the time to add new rows/cols - we do that when pasting in external data via textarea)
						// copy values to range - loop over dst, modulo the index into the src
						// if you are copying formulas, gather similar formulas into new range groups at the end
						// if X, delete src
						
						grid.beginEditArray('tsv'); // replace this with internal copy-paste
					}
					else if (49 <= key && key <= 53) // 1=values, 2=formulas, 3=formats, 4=styles, 5=styleFormulas
					{
						grid.display = ['values','formulas','formats','styles','styleFormulas'][key-49];
						grid.format();
						grid.draw();
					}
				}
				else
				{
					var c = KeyToChar(key, grid.shift);
					grid.beginEdit(c);
				}
			}
			else
			{
				//debugger;
			}
		};
	}
	
	scroll(offset: number): void {
		
		var grid = this;
		
		var range = grid.box.hg - grid.window.hg;
		if (range <= 0) { return; }
		
		var newWindow: BoxParams = {};
		newWindow.lf = 0;
		newWindow.tp = Math.max(0, grid.window.tp + offset);
		newWindow.wd = grid.ctx.canvas.width;
		newWindow.hg = grid.ctx.canvas.height;
		
		grid.window.reconcile(newWindow);
		
		//var handleRange = grid.vScrollbar.box.hg - grid.vScrollbar.handle.hg;
		//var handleOffset = Math.floor(handleRange * (this.value / 100));
		//grid.vScrollbar.handle.reconcile({lf:ctx.canvas.width-grid.vScrollbar.width,tp:handleOffset,wd:grid.vScrollbar.width,hg:grid.vScrollbar.height});
		
		grid.draw();
	}
	format(): void {
		
		var grid = this;
		
		if (grid.big)
		{
			// for big grids, we format on the fly before drawing
		}
		else
		{
			for (var i = 1; i < grid.nRows; i++)
			{
				for (var j = 1; j < grid.nCols; j++)
				{
					var cell: Cell = grid.cells[i][j];
					cell.formatObject = ParseFormatString(cell.formatString);
					
					if (grid.display == 'values')
					{
						cell.string = Format(cell.value, cell.formatObject);
					}
					else if (grid.display == 'formulas')
					{
						cell.string = cell.formula;
					}
					else if (grid.display == 'formats')
					{
						cell.string = cell.formatString;
					}
					else if (grid.display == 'styles')
					{
						cell.string = cell.style.toString();
					}
					else if (grid.display == 'styleFormulas')
					{
						//cell.string = cell.styleFormula;
					}
				}
			}
		}
	}
	
	beginEdit(c: string): void {
		
		var grid = this;
		var cell: Cell = grid.cells[grid.cursor.row][grid.cursor.col];
		
		var current = null;
		
		if (grid.display == 'values' || grid.display == 'formulas')
		{
			current = cell.formula;
		}
		else if (grid.display == 'formats')
		{
			current = cell.formatString;
		}
		else if (grid.display == 'styles' || grid.display == 'styleFormulas')
		{
			current = cell.styleFormula;
		}
		
		grid.input.value = (c ? c : current);
		grid.input.style.display = 'block';
		grid.input.style.top = (grid.ys[grid.cursor.row] - grid.ctx.canvas.height).toString() + 'px';
		grid.input.style.left = (grid.xs[grid.cursor.col]).toString() + 'px';
		grid.input.style.height = (grid.rowSizes[grid.cursor.row] - 1).toString() + 'px';
		grid.input.style.width = (grid.colSizes[grid.cursor.col] - 1).toString() + 'px';
		grid.input.focus();
		
		grid.setEditHandlers();
	}
	beginEditArray(format: string): void {
		
		var grid = this;
		
		var lf: number = grid.xs[grid.focusSelected.minCol];
		var rt: number = grid.xs[grid.focusSelected.maxCol+1];
		var tp: number = grid.ys[grid.focusSelected.minRow];
		var bt: number = grid.ys[grid.focusSelected.maxRow+1];
		
		//var savedData = grid.dataComponent._data;
		//grid.dataComponent._data = grid.getSelectionData();
		//var text = grid.dataComponent._get({format:format});
		//grid.dataComponent._data = savedData;
		var data: string[][] = grid.getSelectionData();
		var text: string = data.map(function(row) { return row.join('\t'); }).join('\n');
		
		grid.textarea.value = text;
		grid.textarea.style.display = 'block';
		grid.textarea.style.top = (tp - grid.ctx.canvas.height).toString() + 'px';
		grid.textarea.style.left = lf.toString() + 'px';
		grid.textarea.style.height = (bt - tp).toString() + 'px';
		grid.textarea.style.width = (rt - lf).toString() + 'px';
		grid.textarea.focus();
		grid.textarea.select();
		
		function ClearEdit() {
			grid.textarea.value = '';
			grid.textarea.style.display = 'none';
			grid.setKeyHandles(); // or just focus the canvas?
		}
		
		grid.textarea.onkeydown = function(e: KeyboardEvent) {
			
			var key: number = e.keyCode;
			
			if (key == 27) // esc
			{
				ClearEdit();
			}
			else if (key == 13) // return - accepting the edit on return is not great, because people will use return while editing
			{
				var text = grid.textarea.value;
				var matrix = text.trim().split('\n').map(function(line) { return line.split('\t'); });
				
				// parse format, stretch or shrink grid if appropriate, otherwise reject edit if dimensions are not correct
				// then set individual cells
				
				// we need the Data component to parse format
				
				//var newdata: any = ParseFormat(grid.textarea.value, format);
				
				for (var i = 0; i < matrix.length; i++)
				{
					for (var j = 0; j < matrix[i].length; j++)
					{
						var row = grid.focusSelected.minRow + i;
						var col = grid.focusSelected.minCol + j;
						
						if (row >= grid.nRows || col >= grid.nCols) { continue; } // or add rows/cols to fit?
						
						// this needs to be merged with the mainstream acceptEdit function
						
						var str = matrix[i][j];
						var cell = grid.cells[row][col];
						
						if (str.length > 0 && str[0] == '=')
						{
							//cell.formula = str;
							//
							//var formula: string = str.substr(1);
							//var fn = new Function('i', 'return ' + formula);
							//var result: any = fn.apply(grid.cellArray, [i-1]);
							//cell.value = result;
						}
						else
						{
							cell.value = ParseStringToObj(str);
						}
						
						cell.string = Format(cell.value, cell.formatObject);
						
						grid.dataComponent._data[row-1][grid.dataComponent._headers[col-1]] = cell.value;
					}
				}
				
				grid.draw();
				
				ClearEdit();
			}
		};
	}
	setEditHandlers(): void {
		
		var grid = this;
		
		grid.input.onkeydown = function(e) {
			
			var key = e.keyCode;
			
			if (key == 27) // esc
			{
				grid.rejectEdit();
			}
			else if (key == 13) // return
			{
				grid.acceptEdit();
			}
		};
	}
	rejectEdit(): void {
		var grid = this;
		grid.clearEdit();
	}
	acceptEdit(): void {
		
		var grid = this;
		
		var str: string = grid.input.value;
		
		var i: number = grid.cursor.row;
		var j: number = grid.cursor.col;
		
		// under different modes, we could set grid.formats, styles, etc
		
		if (i == 0 && j == 0)
		{
			// do nothing
		}
		else if (j == 0)
		{
			// do nothing
		}
		else if (i == 0)
		{
			// under different modes, set filter, sort, etc.
			
			var cell: Cell = grid.cells[i][j];
			
			if (grid.dataComponent._headers[j-1] == str) { return; }
			if (grid.dataComponent._headers.indexOf(str) > -1) { return; } // collision, bail
			
			cell.string = str;
			
			// change field
			var oldfield: string = grid.dataComponent._headers[j-1];
			grid.dataComponent._headers[j-1] = str;
			
			for (var k: number = 0; k < grid.dataComponent._data.length; k++)
			{
				var obj = grid.dataComponent._data[k];
				obj[str] = obj[oldfield];
				delete obj[oldfield];
			}
			
			// change formulas that reference the old field name?
		}
		else // data cell
		{
			var fn = null;
			var value = null;
			var formatObject = null;
			
			var dependencies = []; // for now, we're going to assume the formula stays within the row
			var referenceRegex = /this\[([^\]]+)\]\.([A-Za-z][A-Za-z0-9]*)/g; // e.g. this[i].foo
			
			if (grid.display == 'values' || grid.display == 'formulas')
			{
				if (str.length > 0 && str[0] == '=')
				{
					var formula = str.substr(1);
					fn = new Function('i', 'return ' + formula);
					
					var match = referenceRegex.exec(formula);
					
					while (match !== null)
					{
						dependencies.push(match[2]); // the group that matches the .field
						match = referenceRegex.exec(formula);
					}
				}
				else
				{
					value = ParseStringToObj(str);
				}
			}
			else if (grid.display == 'formats')
			{
				formatObject = ParseFormatString(str);
			}
			else if (grid.display == 'styles')
			{
				
			}
			else if (grid.display == 'styleFormulas')
			{
				
			}
			
			// set formula/value on all cells in selection
			for (var k = 0; k < grid.selected.length; k++)
			{
				var sel: SelectionPart = grid.selected[k];
				
				for (var i = sel.minRow; i <= sel.maxRow; i++)
				{
					for (var j = sel.minCol; j <= sel.maxCol; j++)
					{
						var cell: Cell = grid.cells[i][j];
						
						// remove links between this cell and its sources
						cell.srcs.forEach(function(src) { src.dsts.splice(src.dsts.indexOf(cell), 1); });
						cell.srcs = [];
						
						if (grid.display == 'values' || grid.display == 'formulas')
						{
							cell.formula = str;
							cell.markUncalculated(); // recursively set calculated=false on cell.dsts and their dsts
							
							if (fn !== null)
							{
								cell.fn = fn;
								
								dependencies.forEach(function(dep) {
									var src: Cell = grid.cells[i][grid.dataComponent._headers.indexOf(dep)+1];
									cell.srcs.push(src);
									src.dsts.push(cell);
								});
							}
							else
							{
								cell.calculated = true;
								cell.value = value;
								cell.string = Format(cell.value, cell.formatObject);
								grid.dataComponent._data[i-1][grid.dataComponent._headers[j-1]] = cell.value; // set the underlying
							}
						}
						else if (grid.display == 'formats')
						{
							cell.formatString = str;
							cell.formatObject = formatObject;
							cell.string = str;
						}
						else if (grid.display == 'styles')
						{
							
						}
						else if (grid.display == 'styleFormulas')
						{
							
						}
					}
				}
			}
			
			grid.calculate();
		}
		
		grid.draw();
		
		grid.clearEdit();
	}
	clearEdit(): void {
		
		var grid = this;
		
		grid.input.value = '';
		grid.input.style.display = 'none';
		grid.ctx.canvas.focus();
		//grid.setKeyHandles();
	}
	
	getSelectionData(): string[][] {
		
		var grid = this;
		
		var data: string[][] = [];
		
		var selection = grid.focusSelected;
		
		for (var i: number = selection.minRow; i <= selection.maxRow; i++)
		{
			var row: string[] = [];
			
			for (var j: number = selection.minCol; j <= selection.maxCol; j++)
			{
				if (grid.big)
				{
					// format on the fly
				}
				else
				{
					row.push(grid.cells[i][j].string);
				}
			}
			
			data.push(row);
		}
		
		return data;
	}
	actOnSelection(fn: (cell: Cell, i: number, j: number) => void): void {
		
		var grid: Grid = this;
		
		for (var k = 0; k < grid.selected.length; k++)
		{
			var sel: SelectionPart = grid.selected[k];
			
			for (var i = sel.minRow; i <= sel.maxRow; i++)
			{
				for (var j = sel.minCol; j <= sel.maxCol; j++)
				{
					var cell: Cell = grid.cells[i][j];
					fn(cell, i, j);
				}
			}
		}
		
		grid.draw();
	}
	deleteCellContents(cell: Cell, i: number, j: number): void {
		
		var grid: Grid = this;
		cell.formula = null;
		cell.value = null;
		cell.string = '';
		grid.dataComponent._data[i-1][grid.dataComponent._headers[j-1]] = null;
	}
	
	selectCell(): void {
		
		var grid = this;
		
		grid.anchor.row = grid.cursor.row;
		grid.anchor.col = grid.cursor.col;
		
		grid.focusSelected.minRow = grid.cursor.row;
		grid.focusSelected.maxRow = grid.cursor.row;
		grid.focusSelected.minCol = grid.cursor.col;
		grid.focusSelected.maxCol = grid.cursor.col;
		
		grid.cacheSelectedCells();
		grid.draw();
	}
	selectRange(): void {
		
		var grid = this;
		
		grid.focusSelected.minRow = Math.min(grid.anchor.row, grid.cursor.row);
		grid.focusSelected.maxRow = Math.max(grid.anchor.row, grid.cursor.row);
		grid.focusSelected.minCol = Math.min(grid.anchor.col, grid.cursor.col);
		grid.focusSelected.maxCol = Math.max(grid.anchor.col, grid.cursor.col);
		
		// SelectRow, SelectCol, SelectWhole do not go through selectRange(), so any changes to the post-select code here must be copied over there
		grid.cacheSelectedCells();
		grid.draw();
	}
	clearSelection(): void {
		
		var grid = this;
		
		grid.input.style.display = 'none';
		
		grid.selected = [];
		grid.focusSelected = null;
		grid.cursor = {row:null,col:null};
		grid.anchor = {row:null,col:null};
		
		grid.cacheSelectedCells();
		grid.draw();
	}
	cacheSelectedCells(): void {
		
		var grid = this;
		
		if (grid.big) { return; }
		
		for (var i = 0; i < grid.cells.length; i++)
		{
			for (var j = 0; j < grid.cells[i].length; j++)
			{
				grid.cells[i][j].selected = false;
			}
		}
		
		for (var i = 0; i < grid.rowsWithSelection.length; i++) { grid.rowsWithSelection[i] = false; }
		for (var j = 0; j < grid.colsWithSelection.length; j++) { grid.colsWithSelection[j] = false; }
		
		for (var i = 0; i < grid.selected.length; i++)
		{
			var s = grid.selected[i];
			
			for (var r = s.minRow; r <= s.maxRow; r++)
			{
				grid.rowsWithSelection[r] = true;
				
				for (var c = s.minCol; c <= s.maxCol; c++)
				{
					grid.cells[r][c].selected = true;
					grid.colsWithSelection[c] = true;
				}
			}
		}
	}
	getSelectedCells(): Cell[] {
		
		var grid = this;
		
		var cells: Cell[] = [];
		
		for (var k: number = 0; k < grid.selected.length; k++)
		{
			if (grid.selected[k].mode == "Select")
			{
				var selection: SelectionPart = grid.selected[k];
				
				// the j,i order here is deliberate - so that the returned list is clustered by column
				for (var j: number = selection.minCol; j <= selection.maxCol; j++)
				{
					for (var i: number = selection.minRow; i <= selection.maxRow; i++)
					{
						cells.push(grid.cells[i][j]);
					}
				}
			}
		}
		
		return cells;
	}
	
	insertRowsAbove(): void { var grid = this; grid.insertRows(true); }
	insertRowsBelow(): void { var grid = this; grid.insertRows(false); }
	insertColsLeft(): void { var grid = this; grid.insertCols(true); }
	insertColsRight(): void { var grid = this; grid.insertCols(false); }
	insertRows(bAbove: boolean): void {
		
		var grid = this;
		
		var k: number = bAbove ? grid.focusSelected.minRow : (grid.focusSelected.maxRow+1);
		var n: number = grid.focusSelected.maxRow - grid.focusSelected.minRow + 1;
		
		grid.nRows += n;
		
		for (var i: number = 0; i < n; i++)
		{
			var newrow: Cell[] = [];
			var newdata: any = {};
			
			for (var j: number = 0; j < grid.nCols; j++)
			{
				var cell: Cell = new Cell();
				cell.style = grid.cells[k][j].style;
				cell.string = '';
				newrow.push(cell);
				
				if (j >= 1)
				{
					newdata[grid.dataComponent._headers[j-1]] = null;
				}
			}
			
			grid.rowsWithSelection.splice(k+i, 0, false);
			grid.rowsVisible.splice(k+i, 0, true);
			grid.rowSizes.splice(k+i, 0, 20);
			grid.cells.splice(k+i, 0, newrow);
			grid.dataComponent._data.splice(k+i-1, 0, newdata);
		}
		
		for (var i: number = 1; i < grid.cells.length; i++)
		{
			grid.cells[i][0].string = (i-1).toString();
		}
		
		if (bAbove)
		{
			grid.anchor.row += n;
			grid.cursor.row += n;
			grid.selectRange();
		}
		
		grid.position();
		grid.draw();
	}
	insertCols(bLeft: boolean): void {
		
		var grid = this;
		
		var k = bLeft ? grid.focusSelected.minCol : (grid.focusSelected.maxCol+1);
		var n = grid.focusSelected.maxCol - grid.focusSelected.minCol + 1;
		
		grid.nCols += n;
		
		for (var j: number = 0; j < n; j++)
		{
			// if we're in classic-excel mode, we want to remap the A,B,C headers and change formulas
			var suffix = 0;
			var header = 'field' + suffix.toString();
			
			while (grid.dataComponent._headers.indexOf(header) > -1)
			{
				suffix++;
				header = 'field' + suffix.toString();
			}
			
			grid.dataComponent._headers.splice(k+j-1, 0, header);
			
			grid.colsWithSelection.splice(k+j, 0, false);
			grid.colsVisible.splice(k+j, 0, true);
			grid.colSizes.splice(k+j, 0, 64);
			
			for (var i: number = 0; i < grid.nRows; i++)
			{
				var cell = new Cell();
				cell.style = grid.cells[i][k].style;
				
				if (i == 0)
				{
					cell.string = header;
				}
				else
				{
					cell.string = '';
					grid.dataComponent._data[i-1][header] = null;
				}
				
				grid.cells[i].splice(k+j, 0, cell);
			}
		}
		
		if (bLeft)
		{
			grid.anchor.col += n;
			grid.cursor.col += n;
			grid.selectRange();
		}
		
		grid.position();
		grid.draw();
	}
	deleteRows(): void {
		
		var grid = this;
		
		// what happens if we delete all the rows?
		
		var k = grid.focusSelected.minRow;
		var n = grid.focusSelected.maxRow - grid.focusSelected.minRow + 1;
		
		grid.nRows -= n;
		
		grid.rowsWithSelection.splice(k, n);
		grid.rowsVisible.splice(k, n);
		grid.rowSizes.splice(k, n);
		grid.cells.splice(k, n);
		var deleted = grid.dataComponent._data.splice(k-1, n);
		
		for (var i: number = 1; i < grid.cells.length; i++)
		{
			grid.cells[i][0].string = (i-1).toString();
		}
		
		// grid is where Shift+Alt+Up vs Shift+Alt+Down could have varying effect - on where the cursor ends up
		grid.anchor.row = k - 1;
		grid.cursor.row = k - 1;
		grid.selectRange();
		
		grid.position();
		grid.draw();
	}
	deleteCols(): void {
		
		var grid = this;
		
		var k = grid.focusSelected.minCol;
		var n = grid.focusSelected.maxCol - grid.focusSelected.minCol + 1;
		
		grid.nCols -= n;
		
		grid.colsWithSelection.splice(k, n);
		grid.colsVisible.splice(k, n);
		grid.colSizes.splice(k, n);
		
		for (var i = 0; i < grid.nRows; i++)
		{
			if (i > 0)
			{
				for (var j = 0; j < n; j++)
				{
					delete grid.dataComponent._data[i-1][grid.dataComponent._headers[k-1+j]];
				}
			}
			
			grid.cells[i].splice(k, n);
		}
		
		grid.dataComponent._headers.splice(k-1, n);
		
		// this is where Shift+Alt+Left vs Shift+Alt+Right could have varying effect - on where the cursor ends up
		grid.anchor.col = k - 1;
		grid.cursor.col = k - 1;
		grid.selectRange();
		
		grid.position();
		grid.draw();
	}
	moveColsLeft(): void { var grid: Grid = this; grid.moveCols(-1); }
	moveColsRight(): void { var grid: Grid = this; grid.moveCols(1); }
	moveCols(k): void {
		
		/*
		
		0	1	2	3
		a	b	c	d
		
		minCol = 1
		maxCol = 2
		k = -1
		fromSlot = ((k < 0) ? a + k : b + k) = 0
		toSlot = ((k < 0) ? b : a) = 2
		
		temp = x[fromSlot] = x[0] = a
		
		i = 1
		x[i+k] = x[i]
		x[0] = x[1]
		
		i = 2
		x[i+k] = x[i]
		x[1] = x[2]
		
		x[toSlot] = x[2] = temp = a
		
		0	1	2	3
		b	c	a	d
		
		
		
		
		
		0	1	2	3
		a	b	c	d
		
		minCol = 0
		maxCol = 1
		k = +1
		fromSlot = ((k < 0) ? a + k : b + k) = 2
		toSlot = ((k < 0) ? b : a) = 0
		
		start = ((k < 0) ? a : b) = 1
		end = ((k < 0) ? b : a) = 0
		
		temp = x[fromSlot] = x[2] = c
		
		i = 1
		x[i+k] = x[i]
		x[2] = x[1]
		
		i = 0
		x[i+k] = x[i]
		x[1] = x[0]
		
		x[toSlot] = x[0] = temp = c
		
		0	1	2	3
		c	a	b	d
		
		*/
		
		// account for hidden cols?
		
		var grid: Grid = this;
		
		var a: number = grid.focusSelected.minCol;
		var b: number = grid.focusSelected.maxCol;
		
		var start = ((k < 0) ? a : b);
		var end = ((k < 0) ? b : a);
		
		var fromSlot: number = ((k < 0) ? a + k : b + k);
		var toSlot: number = ((k < 0) ? b : a);
		
		if (fromSlot <= 0 || fromSlot >= grid.nCols) { return; }
		
		var headerTemp = grid.dataComponent._headers[fromSlot-1];
		var colSizeTemp = grid.colSizes[fromSlot];
		
		for (var i = start; i != end-k; i -= k)
		{
			grid.dataComponent._headers[i+k-1] = grid.dataComponent._headers[i-1];
			grid.colSizes[i+k] = grid.colSizes[i];
		}
		
		grid.dataComponent._headers[toSlot-1] = headerTemp;
		grid.colSizes[toSlot] = colSizeTemp;
		
		if (grid.big)
		{
			
		}
		else
		{
			for (var i = 0; i < grid.cells.length; i++)
			{
				var cellTemp = grid.cells[i][fromSlot];
				
				for (var j = start; j != end-k; j -= k)
				{
					grid.cells[i][j+k] = grid.cells[i][j];
				}
				
				grid.cells[i][toSlot] = cellTemp;
			}
		}
		
		grid.anchor.col += k;
		grid.cursor.col += k;
		grid.focusSelected.minCol += k;
		grid.focusSelected.maxCol += k;
		grid.cacheSelectedCells();
		
		grid.draw();
	}
	hideCols(): void {
		
		var grid: Grid = this;
		
		// we have an off by one error where colsWithSelection as an array includes the row header column (which is a dubious choice)
		// but it seems that when its members are set to true, the setter assumes the array does now include the row header column
		
		console.log(grid.colsWithSelection);
		console.log(grid.colsVisible);
		
		for (var i = 0; i < grid.colsWithSelection.length; i++)
		{
			if (grid.colsWithSelection[i])
			{
				grid.colsVisible[i] = false;
			}
		}
		
		console.log(grid.colsWithSelection);
		console.log(grid.colsVisible);
		
		// move cursor to the next visible col header, or to the previous visible col header if we're at the end
		// adjust colsWithSelection due to this cursor change
		
		grid.draw();
	}
	showCols(): void {
		
	}
	
	getCoords(e: MouseEvent): Point {
		
		var grid = this;
		
		//var mult = grid.ctx.cubitsPerPixel ? grid.ctx.cubitsPerPixel : 1;
		var mult = 1;
		var x = e.offsetX * mult;
		var y = e.offsetY * mult;
		return {x:x,y:y};
	}
	pointToRowCol(x: number, y: number): RowCol {
		
		var grid = this;
		
		// compare the mouse pos against the gridlines to get a row,col pair
		
		var row: number = null;
		var col: number = null;
		
		// binary search could be used for large grids
		for (var i: number = 0; i < grid.ys.length - 1; i++) { if (grid.ys[i] <= y && y <= grid.ys[i + 1]) { row = i; } }
		for (var j: number = 0; j < grid.xs.length - 1; j++) { if (grid.xs[j] <= x && x <= grid.xs[j + 1]) { col = j; } }
		
		if (row === null || col === null) { throw new Error(); }
		
		return { row : row , col : col };
	}
	
	setSort(fnstr: string): void {
		
		var grid: Grid = this;
		
		grid.sortFn = new Function('a,b', 'return ' + fnstr);
		
		grid.dataComponent._data.sort(grid.sortFn);
		
		var savedRowSizes = grid.rowSizes;
		var savedColSizes = grid.colSizes;
		grid.resetData();
		grid.rowSizes = savedRowSizes;
		grid.colSizes = savedColSizes;
		grid.draw();
	}
	setFilter(fnstr: string): void {
		
		var grid: Grid = this;
		
		if (fnstr == '') { fnstr = 'true'; }
		
		grid.filterFn = new Function('return ' + fnstr);
		
		for (var i = 0; i < grid.dataComponent._data.length; i++)
		{
			grid.rowsVisible[i+1] = grid.filterFn.apply(grid.dataComponent._data[i]); // *this* refers to the row object
		}
		
		grid.clearSelection(); // this also calls draw()
	}
}

type HoriAlign = 'left' | 'center' | 'right';
type VertAlign = 'top' | 'center' | 'bottom';
interface BoxParams {
	lf?: number;
	cx?: number;
	rt?: number;
	wd?: number;
	wr?: number;
	tp?: number;
	cy?: number;
	bt?: number;
	hg?: number;
	hr?: number;
}
class Box {
	
	x: number;
	y: number;
	hAlign: HoriAlign;
	vAlign: VertAlign;
	
	lf: number;
	cx: number;
	rt: number;
	wd: number;
	wr: number;
	tp: number;
	cy: number;
	bt: number;
	hg: number;
	hr: number;
	
	constructor() {
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
	}
	reconcile(params: BoxParams): Box {
		
		var box = this;
		
		if (params.lf !== undefined)
		{
			box.lf = params.lf;
			
			if (params.cx !== undefined)
			{
				box.cx = params.cx;
				box.wr = box.cx - box.lf;
				box.wd = box.wr * 2;
				box.rt = box.lf + box.wd;
			}
			else if (params.rt !== undefined)
			{
				box.rt = params.rt;
				box.wd = box.rt - box.lf;
				box.wr = box.wd / 2;
				box.cx = box.lf + box.wr;
			}
			else if (params.wd !== undefined)
			{
				box.wd = params.wd;
				box.wr = box.wd / 2;
				box.rt = box.lf + box.wd;
				box.cx = box.lf + box.wr;
			}
			else if (params.wr !== undefined)
			{
				box.wr = params.wr;
				box.wd = box.wr * 2;
				box.rt = box.lf + box.wd;
				box.cx = box.lf + box.wr;
			}
		}
		else if (params.cx !== undefined)
		{
			box.cx = params.cx;
			
			if (params.rt !== undefined)
			{
				box.rt = params.rt;
				box.wr = box.rt - box.cx;
				box.wd = box.wr * 2;
				box.lf = box.rt - box.wd;
			}
			else if (params.wd !== undefined)
			{
				box.wd = params.wd;
				box.wr = box.wd / 2;
				box.rt = box.cx + box.wr;
				box.lf = box.cx - box.wr;
			}
			else if (params.wr !== undefined)
			{
				box.wr = params.wr;
				box.wd = box.wr * 2;
				box.rt = box.cx + box.wr;
				box.lf = box.cx - box.wr;
			}
		}
		else if (params.rt !== undefined)
		{
			box.rt = params.rt;
			
			if (params.wd !== undefined)
			{
				box.wd = params.wd;
				box.wr = box.wd / 2;
				box.lf = box.rt - box.wd;
				box.cx = box.rt - box.wr;
			}
			else if (params.wr !== undefined)
			{
				box.wr = params.wr;
				box.wd = box.wr * 2;
				box.lf = box.rt - box.wd;
				box.cx = box.rt - box.wr;
			}
		}
		
		if (params.tp !== undefined)
		{
			box.tp = params.tp;
			
			if (params.cy !== undefined)
			{
				box.cy = params.cy;
				box.hr = box.cy - box.tp;
				box.hg = box.hr * 2;
				box.bt = box.tp + box.hg;
			}
			else if (params.bt !== undefined)
			{
				box.bt = params.bt;
				box.hg = box.bt - box.tp;
				box.hr = box.hg / 2;
				box.cy = box.tp + box.hr;
			}
			else if (params.hg !== undefined)
			{
				box.hg = params.hg;
				box.hr = box.hg / 2;
				box.bt = box.tp + box.hg;
				box.cy = box.tp + box.hr;
			}
			else if (params.hr !== undefined)
			{
				box.hr = params.hr;
				box.hg = box.hr * 2;
				box.bt = box.tp + box.hg;
				box.cy = box.tp + box.hr;
			}
		}
		else if (params.cy !== undefined)
		{
			box.cy = params.cy;
			
			if (params.bt !== undefined)
			{
				box.bt = params.bt;
				box.hr = box.bt - box.cy;
				box.hg = box.hr * 2;
				box.tp = box.bt - box.hg;
			}
			else if (params.hg !== undefined)
			{
				box.hg = params.hg;
				box.hr = box.hg / 2;
				box.bt = box.cy + box.hr;
				box.tp = box.cy - box.hr;
			}
			else if (params.hr !== undefined)
			{
				box.hr = params.hr;
				box.hg = box.hr * 2;
				box.bt = box.cy + box.hr;
				box.tp = box.cy - box.hr;
			}
		}
		else if (params.bt !== undefined)
		{
			box.bt = params.bt;
			
			if (params.hg !== undefined)
			{
				box.hg = params.hg;
				box.hr = box.hg / 2;
				box.tp = box.bt - box.hg;
				box.cy = box.bt - box.hr;
			}
			else if (params.hr !== undefined)
			{
				box.hr = params.hr;
				box.hg = box.hr * 2;
				box.tp = box.bt - box.hg;
				box.cy = box.bt - box.hr;
			}
		}
		
		return box;
	}
	move(dx: number, dy: number): void {
		
		var box = this;
		
		box.x += dx;
		box.y += dy;
		box.lf += dx;
		box.cx += dx;
		box.rt += dx;
		box.tp += dy;
		box.cy += dy;
		box.bt += dy;
	}
	align(): void {
		
		// this assumes that x, y, hAlign, vAlign, wd, hg are set and calculates the others
		
		var box = this;
		
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
	}
	contains(p: Point): boolean { var box = this; return box.lf <= p.x && p.x <= box.rt && box.tp <= p.y && p.y <= box.bt; }
}

function KeyToChar(key: number, shift: boolean) {
	
	var from48To57 = [')','!','@','#','$','%','^','&','*','('];
	var from186To192 = [[';',':'],['=','+'],[',','<'],['-','_'],['.','>'],['/','?'],['`','~']];
	var from219To222 = [['[','{'],['\\','|'],[']','}'],['\'','"']];
	
	var c = null;
	
	if (48 <= key && key <= 57)
	{
		c = (shift ? from48To57[key-48] : String.fromCharCode(key));
	}
	else if (65 <= key && key <= 90)
	{
		c = (shift ? String.fromCharCode(key) : String.fromCharCode(key+32));
	}
	else if (186 <= key && key <= 192)
	{
		c = from186To192[key-186][shift?1:0];
	}
	else if (219 <= key && key <= 222)
	{
		c = from219To222[key-219][shift?1:0];
	}
	
	return c;
}

function InitCells(grid: Grid, nRows: number, nCols: number): Cell[][] {
	
	var matrix: Cell[][] = [];
	
	for (var i: number = 0; i < nRows; i++)
	{
		var row: Cell[] = [];
		
		for (var j: number = 0; j < nCols; j++)
		{
			var cell: Cell = new Cell();
			cell.grid = grid;
			cell.row = i;
			cell.col = j;
			cell.style = grid.styles[0];
			row.push(cell);
		}
		
		matrix.push(row);
	}
	
	return matrix;
};
function InitMatrix(nRows: number, nCols: number, initValue: any): any[][] {
	
	var matrix: any[][] = [];
	
	for (var i: number = 0; i < nRows; i++)
	{
		var row: any[] = [];
		
		for (var j: number = 0; j < nCols; j++)
		{
			row.push(initValue);
		}
		
		matrix.push(row);
	}
	
	return matrix;
}
function InitArray(n: number, initValue: any): any[] {
	
	var array: any[] = [];
	
	for (var i: number = 0; i < n; i++)
	{
		array.push(initValue);
	}
	
	return array;
}
function ParseHeaderList(matrix: any[][], headers: string[]): any[] {
	
	var data: any[] = [];
	
	for (var i: number = 0; i < matrix.length; i++)
	{
		var obj: any = {};
		
		for (var k: number = 0; k < headers.length; k++)
		{
			obj[headers[k]] = matrix[i][k];
		}
		
		data.push(obj);
	}
	
	return data;
}

function ParseFormatString(formatString: string): any {
	
	var formatObject = null;
	
	formatObject = formatString; // for the moment
	
	return formatObject;
}
function Format(value: any, formatObject: any): string {
	
	var datatype: string = typeof(value);
	var string: string = null;
	
	if (value == null)
	{
		string = '';
	}
	else if (datatype == "number")
	{
		if (formatObject === null)
		{
			string = value.toString();
		}
		else
		{
			string = sprintf(formatObject, value);
		}
	}
	else if (datatype == "string")
	{
		string = value; // apply formatting here - note that when you want to edit, use the raw toString()
	}
	else if (datatype == "boolean")
	{
		string = value.toString();
	}
	else if (datatype == "object")
	{
		if (value.forEach)
		{
			string = "[Array]";
		}
		else
		{
			//string = cell.slot.formula;
			string = value.toString(); // apply formatting here - note that when you want to edit, use the raw toString()
		}
	}
	else if (datatype == "function")
	{
		string = value.name;
	}
	else // undefined, presumably
	{
		string = '';
	}
	
	return string;
}


// this is copied from data.js, which is not ideal
var numberRegex: RegExp = new RegExp('^\\s*[+-]?([0-9]{1,3}((,[0-9]{3})*|([0-9]{3})*))?(\\.[0-9]+)?%?\\s*$');
var digitRegex: RegExp = new RegExp('[0-9]');
var trueRegex: RegExp = new RegExp('^true$', 'i');
var falseRegex: RegExp = new RegExp('^false$', 'i');

// require ISO 8601 dates - this regex reads yyyy-mm-ddThh:mm:ss.fffZ, with each component after yyyy-mm being optional
// note this means that yyyy alone will be interpreted as an int, not a date
var dateRegex: RegExp = new RegExp('[0-9]{4}-[0-9]{2}(-[0-9]{2}(T[0-9]{2}(:[0-9]{2}(:[0-9]{2}(.[0-9]+)?)?)?(Z|([+-][0-9]{1-2}:[0-9]{2})))?)?');

var WriteObjToString = function(obj: any): string {
	
	// this is currently called only when writing to json/yaml, which requires that we return 'null'
	// but if we start calling this function from the csv/tsv writer, we'll need to return ''
	if (obj === null) { return 'null'; }
	
	var type: string = Object.prototype.toString.call(obj);
	
	if (type == '[object String]' || type == '[object Date]')
	{
		return '"' + obj.toString() + '"';
	}
	//else if (type == '[object Function]')
	//{
	//	return WriteFunction(obj);
	//}
	else
	{
		return obj.toString();
	}
};
var ParseStringToObj = function(str: string): any {
	
	if (str === null || str === undefined) { return null; }
	if (str.length == 0) { return ''; } // the numberRegex accepts the empty string because all the parts are optional
	
	var val: any = null;
	
	if (numberRegex.test(str) && digitRegex.test(str)) // since all parts of numberRegex are optional, "+.%" is a valid number.  so we test digitRegex too
	{
		var divisor: number = 1;
		str = str.trim();
		if (str.indexOf('%') >= 0) { divisor = 100; str = str.replace('%', ''); }
		str = str.replace(',', '');
		
		if (str.indexOf('.') >= 0)
		{
			val = parseFloat(str);
		}
		else
		{
			val = parseInt(str);
		}
		
		val /= divisor;
	}
	else if (dateRegex.test(str))
	{
		val = new Date(str);
		if (val.toJSON() == null) { val = str; } // revert if the date is invalid
	}
	else if (trueRegex.test(str))
	{
		val = true;
	}
	else if (falseRegex.test(str))
	{
		val = false;
	}
	//else if (str.startsWith('function'))
	//{
	//	val = ParseFunction(str);
	//}
	else
	{
		val = str;
	}
	
	return val;
};

// note that this could be the basis of a built-in unit system - detect unit notation like "km" or "J" and convert
// calculations could display the correct units by default
// 1 J / 1 s = 1 W
// the unit type of a cell would be detemined by the calculation and thus not settable by the user
// but the reference unit would be settable
// so you could type in 1 J and then convert the cell to calories and it would convert

function NumberToLetter(n: number): string {
	
	// 0 => "A"
	// 1 => "B"
	// 25 => "Z"
	// 26 => "AA"
	
	if (n < 0) { return ""; }
	
	var k: number = 1;
	var m: number = n+1;
	
	while (true)
	{
		var pow: number = 1;
		for (var i: number = 0; i < k; i++) { pow *= 26; }
		if (m <= pow) { break; }
		m -= pow;
		k++;
	}
	
	var reversed: string = "";
	
	for (var i: number = 0; i < k; i++)
	{
		var c: number = n+1;
		var shifter: number = 1;
		for (var j: number = 0; j < k; j++) { c -= shifter; shifter *= 26; }
		var divisor: number = 1;
		for (var j: number = 0; j < i; j++) { divisor *= 26; }
		c /= divisor;
		c %= 26;
		reversed += String.fromCharCode(65 + c)
	}
	
	var result: string = "";
	for (var i: number = reversed.length - 1; i >= 0; i--) { result += reversed[i]; }
	
	return result;
}
function LetterToNumber(s: string): number {
	
	// "A" => 0
	// "B" => 1
	// "Z" => 25
	// "AA" => 26
	
	var result: number = 0;
	var multiplier: number = 1;
	
	for (var i: number = s.length - 1; i >= 0; i--)
	{
		var c: number = s.charCodeAt(i);
		result += multiplier * (c - 64);
		multiplier *= 26;
	}
	
	return result-1; // -1 makes it 0-indexed
}


var scale: number = 1; // cubits->pixels transform

function drawHori(ctx: CanvasRenderingContext2D, y: number, x1: number, x2: number): void {
	
	var ty: number = Math.floor(y * scale)+0.5;
	var tx1: number = Math.floor(x1 * scale);
	var tx2: number = Math.floor(x2 * scale);
	drawLine(ctx, tx1, ty, tx2, ty);
}
function drawVert(ctx: CanvasRenderingContext2D, x: number, y1: number, y2: number): void {
	
	var tx: number = Math.floor(x * scale)+0.5;
	var ty1: number = Math.floor(y1 * scale);
	var ty2: number = Math.floor(y2 * scale);
	drawLine(ctx, tx, ty1, tx, ty2);
}
function fillSharpRect(ctx: CanvasRenderingContext2D, left: number, top: number, width: number, height: number): void {
	
	var lf: number = Math.floor(left * scale)+0.5;
	var tp: number = Math.floor(top * scale)+0.5;
	var wd: number = Math.floor(width * scale);
	var hg: number = Math.floor(height * scale);
	ctx.fillRect(lf, tp, wd, hg);
}
function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
	
	var tx: number = x * scale;
	var ty: number = y * scale;
	ctx.fillText(text, tx, ty);
}
function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
	
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
}

Hyperdeck.Grid = Grid;

