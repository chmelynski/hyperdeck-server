
(function() {

var Table = function(json) {
	
	if (!json)
	{
		json = {};
		json.type = 'table';
		json.name = Griddl.Components.UniqueName('table', 1);
		json.visible = true;
		json.values = [['','A','B','C'],['1','','',''],['2','','',''],['3','','','']];
	}
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.grid = null;
	
	this.headers = json.params.headers;
	this._data = ParseHeaderList(json.data, this.headers); // proxy both the list and the individual objects
	
	Object.defineProperty(this, 'data', { 
		get : function() {
			return this._data;
		},
		set : function(value) {
			this._data = value;
			//if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
			// redo everything
		}
	});
	
	this.div = null;
	this.ctx = null;
	this.section = null; // set by Canvas.GenerateDocument
	
	// the mechanics of row and col resizing work best if the grid's anchor is mandated to be tp/lf, but users might want centering
	this.box = new Griddl.Components.Box(this, false);
	this.box.x = json.params.box.x;
	this.box.y = json.params.box.y;
	this.box.hAlign = json.params.box.hAlign;
	this.box.vAlign = json.params.box.vAlign;
	//this.box.hg = this.rowSizes.reduce(function(a, b) { return a + b; });
	//this.box.wd = this.colSizes.reduce(function(a, b) { return a + b; });
	
	this.margin = {};
	this.margin.top = json.params.margin.top;
	this.margin.left = json.params.margin.left;
	this.margin.right = json.params.margin.right;
	this.margin.bottom = json.params.margin.bottom;
};
Table.prototype.add = function() {
	
	var table = this;
	
	var options = {}
	options.data = this.values;
	options.formulas = true;
	options.rowHeaders = true;
	options.colHeaders = true;
	options.contextMenu = false;
	options.manualColumnResize = true;
	options.afterChange = function(changes, source) {
		
		if (source != 'loadData')
		{
			// calculate if changed underlying is this.formulas
			table.format(); // only if the changed underlying is this.values, this.formatStrings
			table.box.clear();
			table.draw();
		}
	};
	
	this.tableDiv = $('<div></div>');
	this.div.append(this.tableDiv);
	
	this.handsontable = new Handsontable(this.tableDiv[0], options);
	
	this.div.append($('<hr />'));
	
	var controls = [];
	
	var gui = new dat.GUI({autoPlace:false});
	
	var display = gui.add(this, 'display', ['values', 'formulas', 'formatStrings', 'style', 'font', 'fill', 'hAlign', 'vAlign', 'backgroundColor', 'border']);
	display.onFinishChange(function(value) { table.handsontable.loadData(table[value]); });
	
	controls.push(gui.add(this, 'hMargin'));
	controls.push(gui.add(this, 'vMargin'));
	
	var sizeControls = [];
	var rowSizesFolder = gui.addFolder('rowSizes');
	for (var i = 0; i < this.rowSizes.length; i++) { sizeControls.push(rowSizesFolder.add(this.rowSizes, i).min(0)); }
	var colSizesFolder = gui.addFolder('colSizes');
	for (var i = 0; i < this.colSizes.length; i++) { sizeControls.push(colSizesFolder.add(this.colSizes, i).min(0)); }
	
	this.box.addElements(gui, ['x','y','hAlign','vAlign']);
	
	//sizeControls.forEach(function(control) { control.onFinishChange(function(value) { table.position(); table.section.draw(); }); });
	sizeControls.forEach(function(control) { control.onChange(function(value) { table.position(); table.section.draw(); }); });
	
	Griddl.Components.AddMarginElements(gui, this, this.margin);
	
	// hMargin and vMargin could just re-draw the table, not the whole section
	controls.forEach(function(control) { control.onChange(function(value) { table.section.draw(); }); });
	
	this.div[0].appendChild(gui.domElement);
};
Table.prototype.draw = function() {
	this.grid.draw();
};
Table.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.data = this.cells.map(row => row.map(cell => cell.write()));
	json.params = {};
	json.params.x = this.box.x;
	json.params.y = this.box.y;
	json.params.hAlign = this.box.hAlign;
	json.params.vAlign = this.box.vAlign;
	json.params.rowSizes = this.rowSizes;
	json.params.colSizes = this.colSizes;
	json.params.margin = {};
	json.params.margin.top = this.margin.top;
	json.params.margin.left = this.margin.left;
	json.params.margin.right = this.margin.right;
	json.params.margin.bottom = this.margin.bottom;
	return json;
};

Griddl.Components.table = Table;

})();

