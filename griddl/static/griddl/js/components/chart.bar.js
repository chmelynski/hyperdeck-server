
(function() {

var BarChart = function(json) {
	
	// column	value	color	label
	// '2012'	50	'orange'	'foo'
	// '2012'	50	'orange'	'foo'
	// '2013'	50	'orange'	'foo'
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.data = json.data;
	
	this.div = null;
	this.ctx = null;
	this.section = null;
	
	// defaults should be in points and converted to cubits
	var cubitsPerPoint = 1;
	this.widthBetweenBars = json.params.widthBetweenBars ? json.params.widthBetweenBars : 36 * cubitsPerPoint;
	this.barWidth = json.params.barWidth ? json.params.barWidth : 72 * cubitsPerPoint;
	this.textMargin = json.params.textMargin ? json.params.textMargin : 18 * cubitsPerPoint;
	this.scale = json.params.scale ? json.params.scale : 1;
	
	this.columns = []; // the columns are created on renewData()
	
	this.controls = []; // the control objects are created on renewData().  on draw(), the control fields are updated with new values
	this.scaleControls = [];
	this.gapControls = [];
	this.barWidthControls = [];
	this.textMarginControls = [];
	
	this.box = new Griddl.Components.Box(this, true);
	this.box.x = json.params.x;
	this.box.y = json.params.y;
	this.box.hAlign = json.params.hAlign ? json.params.hAlign : 'center';
	this.box.vAlign = json.params.vAlign ? json.params.vAlign : 'center';
	
	this.segmentLabelFont = json.params.segmentLabelFont ? json.params.segmentLabelFont : '10pt sans-serif';
	this.segmentLabelColor = json.params.segmentLabelColor ? json.params.segmentLabelColor : 'rgb(255,255,255)';
	this.segmentLabelAnchor = json.params.segmentLabelAnchor ? json.params.segmentLabelAnchor : 'middle'; // top , middle , bottom
	this.topLabelFont = json.params.topLabelFont ? json.params.topLabelFont : '10pt sans-serif';
	this.topLabelColor = json.params.topLabelColor ? json.params.topLabelColor : 'rgb(0,0,0)';
	this.bottomLabelFont = json.params.bottomLabelFont ? json.params.bottomLabelFont : '10pt sans-serif';
	this.bottomLabelColor = json.params.bottomLabelColor ? json.params.bottomLabelColor : 'rgb(0,0,0)';
	
	this.subs = []; // the subs need not be contained within the parent's box.  section.onhover will check for sub hovers independently of the parent
	//this.key = new Key(ctx, this, json.params.key);
	//this.subs.push(this.key);
	
	//this.renewData(); // this generates columns and controls
	//this.calculateDimensions(); // this is a separate function because it must be called every time the width, scale, gap, etc. params change
};
BarChart.prototype.add = function() {
	
	this.addElements();
	this.refresh();
};
BarChart.prototype.addElements = function() {
	
	this.div.html('');
	
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
	gui.add(this, 'scale');
	gui.add(this, 'barWidth');
	gui.add(this, 'widthBetweenBars');
	gui.add(this, 'textMargin');
	gui.add(this.box, 'x');
	gui.add(this.box, 'y');
	gui.add(this.box, 'hAlign', ['left','center','right']);
	gui.add(this.box, 'vAlign', ['top','center','bottom']);
	var textStyling = gui.addFolder('text styling');
	textStyling.add(this, 'segmentLabelFont');
	textStyling.addColor(this, 'segmentLabelColor');
	textStyling.add(this, 'segmentLabelAnchor', ['top','middle','bottom']);
	textStyling.add(this, 'topLabelFont');
	textStyling.addColor(this, 'topLabelColor');
	textStyling.add(this, 'bottomLabelFont');
	textStyling.addColor(this, 'bottomLabelColor');
	var margin = gui.addFolder('margin');
	margin.add(this.margin, 'lf');
	margin.add(this.margin, 'rt');
	margin.add(this.margin, 'tp');
	margin.add(this.margin, 'bt');
	var label = gui.addFolder('label');
	label.add(this.label, 'lf');
	label.add(this.label, 'rt');
	label.add(this.label, 'tp');
	label.add(this.label, 'bt');
	
	this.div[0].appendChild(gui.domElement);
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
		this.box.hg = this.section.document.pageHeight * this.section.document.cubitsPerUnit;
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
	
	var ctx = this.ctx;
	
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
			//ctx.strokeRect(left, top, barWidth, height);
			
			// segment label
			ctx.font = this.segmentLabelFont;
			ctx.fillStyle = this.segmentLabelColor;
			ctx.textAlign = 'center';
			ctx.textBaseline = this.segmentLabelAnchor;
			var text = label; // or format 'num'
			var x = left + barWidth / 2;
			var y = top + height / 2;
			ctx.fillText(text, x, y);
		}
		
		// top label
		ctx.font = this.topLabelFont;
		ctx.fillStyle = this.topLabelColor;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		var text = totalValue.toString();
		var x = chartLf + marginLf + (widthBetweenBars + barWidth) * i + barWidth / 2;
		var y = columnBottom - totalHeight - textMargin;
		ctx.fillText(text, x, y);
		
		// bottom label
		ctx.font = this.bottomLabelFont;
		ctx.fillStyle = this.bottomLabelColor;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		var text = columnLabel;
		var x = chartLf + marginLf + (widthBetweenBars + barWidth) * i + barWidth / 2;
		var y = chartBt - marginBt + textMargin;
		ctx.fillText(text, x, y);
		
		// leave some room (10px) for the barWidth control at the bottom
		this.scaleControls[i].box.reconcile({lf:left,wd:barWidth,bt:columnBottom - 10,hg:totalHeight - 10});
		
		if (i < this.columns.length - 1)
		{
			this.gapControls[i].box.reconcile({lf:columnRight,wd:widthBetweenBars,bt:columnBottom,hg:10});
		}
		
		this.barWidthControls[i].box.reconcile({lf:left,wd:barWidth,bt:columnBottom,hg:10});
		
		this.textMarginControls[i].box.reconcile({lf:left,wd:barWidth,tp:columnBottom,hg:textMargin});
	}
	
	this.key.draw();
};
BarChart.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.data = this.data;
	json.params = {};
	json.params.widthBetweenBars = this.widthBetweenBars;
	json.params.barWidth = this.barWidth;
	json.params.textMargin = this.textMargin;
	json.params.scale = this.scale;
	json.params.x = this.box.x;
	json.params.y = this.box.y;
	json.params.hAlign = this.box.hAlign;
	json.params.vAlign = this.box.vAlign;
	json.params.segmentLabelFont = this.segmentLabelFont;
	json.params.segmentLabelColor = this.segmentLabelColor;
	json.params.segmentLabelAnchor = this.segmentLabelAnchor;
	json.params.topLabelFont = this.topLabelFont;
	json.params.topLabelColor = this.topLabelColor;
	json.params.bottomLabelFont = this.bottomLabelFont;
	json.params.bottomLabelColor = this.bottomLabelColor;
	json.params.margin = {};
	json.params.margin.lf = this.params.margin.lf;
	json.params.margin.rt = this.params.margin.rt;
	json.params.margin.tp = this.params.margin.tp;
	json.params.margin.bt = this.params.margin.bt;
	json.params.label = {};
	json.params.label.lf = this.params.label.lf;
	json.params.label.rt = this.params.label.rt;
	json.params.label.tp = this.params.label.tp;
	json.params.label.bt = this.params.label.bt;
	json.params.keyLeft = this.params.keyLeft;
	json.params.keyTop = this.params.keyTop;
	return json;
};

BarChart.prototype.clear = Griddl.Components.Clear;
BarChart.prototype.onhover = Griddl.Components.OnHover;
BarChart.prototype.dehover = Griddl.Components.DeHover;
BarChart.prototype.onmousemove = Griddl.Components.OnMouseMove;

Griddl.Components.barChart = BarChart;

})();

