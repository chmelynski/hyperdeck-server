
(function() {

var BarChart = function(json) {
	
	if (!json)
	{
		
	}
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	this.ctx = null;
	this.section = null;
	
	this.dataSource = json.params.dataSource;
	this.columnKey = json.params.columnKey;
	this.valueKeys = json.params.valueKeys; // this is a comma separated list that we can edit in a datgui - parsed to a list in renewData
	
	// these intermediate variables are set on renewData()
	this.columns = null; // columns aggregate raw data into a more usable form
	
	// defaults should be in points and converted to cubits
	var cubitsPerPoint = 1;
	this.scale = json.params.scale ? json.params.scale : 1;
	this.barWidth = json.params.barWidth ? json.params.barWidth : 72 * cubitsPerPoint;
	this.barGap = json.params.barGap ? json.params.barGap : 36 * cubitsPerPoint;
	
	this.box = new Griddl.Components.Box(this, true);
	this.box.x = json.params.x;
	this.box.y = json.params.y;
	this.box.hAlign = json.params.hAlign ? json.params.hAlign : 'center';
	this.box.vAlign = json.params.vAlign ? json.params.vAlign : 'center';
	
	this.textStyle = {};
	this.textStyle.margin = json.params.textStyle.margin ? json.params.textStyle.margin : 18 * cubitsPerPoint;
	this.textStyle.segmentLabelFont = json.params.segmentLabelFont ? json.params.segmentLabelFont : '10pt sans-serif';
	this.textStyle.segmentLabelColor = json.params.segmentLabelColor ? json.params.segmentLabelColor : 'rgb(255,255,255)';
	this.textStyle.segmentLabelAnchor = json.params.segmentLabelAnchor ? json.params.segmentLabelAnchor : 'middle'; // top , middle , bottom
	this.textStyle.topLabelFont = json.params.topLabelFont ? json.params.topLabelFont : '10pt sans-serif';
	this.textStyle.topLabelColor = json.params.topLabelColor ? json.params.topLabelColor : 'rgb(0,0,0)';
	this.textStyle.bottomLabelFont = json.params.bottomLabelFont ? json.params.bottomLabelFont : '10pt sans-serif';
	this.textStyle.bottomLabelColor = json.params.bottomLabelColor ? json.params.bottomLabelColor : 'rgb(0,0,0)';
	
	this.padding = json.params.padding ? json.params.padding : { top : 0 , left : 0 , right : 0 , bottom : 0 };
	this.margin = json.params.margin ? json.params.margin : { top : 0 , left : 0 , right : 0 , bottom : 0 };
	
	//this.key = new Key(this, json.params.key);
	
	this.subs = []; // the subs need not be contained within the parent's box.  section.onhover will check for sub hovers independently of the parent
	//this.subs.push(this.key);
	
	this.controls = []; // the control objects are created on renewData().  on draw(), the control fields are updated with new values
	this.scaleControls = [];
	this.gapControls = [];
	this.barWidthControls = [];
	this.textMarginControls = [];
};
BarChart.prototype.add = function() {
	
	this.addElements();
};
BarChart.prototype.addElements = function() {
	
	var comp = this;
	
	this.div.html('');
	
	var controls = [];
	
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
	
	controls.push(gui.add(this, 'dataSource'));
	controls.push(gui.add(this, 'columnKey'));
	controls.push(gui.add(this, 'valueKeys'));
	controls.push(gui.add(this, 'scale'));
	controls.push(gui.add(this, 'barWidth'));
	controls.push(gui.add(this, 'barGap'));
	
	this.box.addElements(gui, ['x','y','hAlign','vAlign']);
	
	var textStyle = gui.addFolder('textStyle');
	controls.push(textStyle.add(this.textStyle, 'margin'));
	controls.push(textStyle.add(this.textStyle, 'segmentLabelFont'));
	controls.push(textStyle.addColor(this.textStyle, 'segmentLabelColor'));
	controls.push(textStyle.add(this.textStyle, 'segmentLabelAnchor', ['top','middle','bottom']));
	controls.push(textStyle.add(this.textStyle, 'topLabelFont'));
	controls.push(textStyle.addColor(this.textStyle, 'topLabelColor'));
	controls.push(textStyle.add(this.textStyle, 'bottomLabelFont'));
	controls.push(textStyle.addColor(this.textStyle, 'bottomLabelColor'));
	
	var padding = gui.addFolder('padding');
	controls.push(padding.add(this.padding, 'top'));
	controls.push(padding.add(this.padding, 'left'));
	controls.push(padding.add(this.padding, 'right'));
	controls.push(padding.add(this.padding, 'bottom'));
	
	Griddl.Components.AddMarginElements(gui, this, this.margin);
	
	controls.forEach(function(control) {
		control.onChange(function(value) {
			comp.section.draw(); // some of these variables change internal things and the reaction could be restricted to redrawing the barchart
		});
	});
	
	this.div[0].appendChild(gui.domElement);
};
BarChart.prototype.calculateDimensions = function() {
	
	// here we need to calculate an initial width/height so that we can place the chart correctly
	// that means dynamically determining a scale, and possibly a barWidth and widthBetweenBars
	
	var maxHeight = this.columns.map(function(column) { return column.sum; }).reduce(function(a, b) { return Math.max(a, b); });
	var totalWidth = this.columns.map(function(column) { return column.width + column.gap; }).reduce(function(a, b) { return a + b; });
	
	var availablePageWidth = this.section.document.pageWidth * this.section.document.cubitsPerUnit; // also subtract page margins?
	
	if (totalWidth > availablePageWidth)
	{
		// scale column widths and gaps to fit the page
	}
	
	this.box.wd = this.padding.left + totalWidth + this.padding.right;
	
	// if this we are pasting in new data, the params should stay untouched, including the previously set scale
	if (this.scale)
	{
		this.box.hg = this.padding.top + maxHeight * this.scale + this.padding.bottom;
	}
	else
	{
		this.box.hg = 0.5 * this.section.document.pageHeight * this.section.document.cubitsPerUnit;
		this.scale = this.box.hg / maxHeight;
	}
	
	this.box.align();
};
BarChart.prototype.renewData = function() {
	
	var data = Griddl.Core.GetData(this.dataSource);
	
	var valueKeyList = this.valueKeys.split(',').map(x => x.trim());
	
	//this.columns = GroupObjectsIntoColumns(data, this.columnKey, this.valueKeys); // old data format
	
	// this.columns = [ Column ]
	// Column : { bottomLabel : "bottomLabel" , topLabel : "topLabel" , sum : 0 , width : 0 , gap : 0 , segments : [ Segment ] }
	// Segment : { value : 0 , label : "segmentLabel" , color }
	this.columns = [];
	
	for (var i = 0; i < data.length; i++)
	{
		var obj = data[i];
		
		var column = {};
		column.bottomLabel = obj[this.columnKey];
		column.sum = 0;
		column.width = this.barWidth; // uniform for now, but we split this value into columns to allow for variation in the future
		column.gap = ((i == data.length - 1) ? 0 : this.barGap); // uniform for now, but we split this value into columns to allow for variation in the future
		column.segments = [];
		
		for (var k = 0; k < valueKeyList.length; k++)
		{
			var valueKey = valueKeyList[k];
			
			var segment = {};
			segment.value = obj[valueKey];
			segment.label = segment.value.toString(); // how to customize this?
			segment.color = 'rgb(255,0,0)'; // okay we need to figure this out
			column.segments.push(segment);
			
			column.sum += segment.value;
		}
		
		column.topLabel = column.sum.toString(); // customize
		this.columns.push(column);
	}
	
	// let's save direct manipulation for later
	
	//this.controls = [];
	//this.scaleControls = [];
	//this.gapControls = [];
	//this.barWidthControls = [];
	//this.textMarginControls = [];
	
	//var chart = this;
	//this.columns.forEach(function(column) { chart.scaleControls.push(new Griddl.Components.Arrow({parent:chart,ctx:chart.ctx,vert:true,field:'scale',scale:0.01,min:0.01})); }); // scale
	//for (var i = 0; i < this.columns.length - 1; i++) { chart.gapControls.push(new Griddl.Components.Arrow({parent:chart,ctx:chart.ctx,hori:true,field:'widthBetweenBars',scale:1,min:0})); } // widthBetweenBars (gap)
	//this.columns.forEach(function(column) { chart.barWidthControls.push(new Griddl.Components.Arrow({parent:chart,ctx:chart.ctx,hori:true,field:'barWidth',scale:1,min:1})); }); // barWidth
	//this.columns.forEach(function(column) { chart.textMarginControls.push(new Griddl.Components.Arrow({parent:chart,ctx:chart.ctx,vert:true,field:'textMargin',scale:1,min:0})); }); // textMargin
	
	//this.scaleControls.forEach(function(control) { chart.controls.push(control); });
	//this.gapControls.forEach(function(control) { chart.controls.push(control); });
	//this.barWidthControls.forEach(function(control) { chart.controls.push(control); });
	//this.textMarginControls.forEach(function(control) { chart.controls.push(control); });
};
function GroupObjectsIntoColumns(data, columnKey, valueKeys) {
	
	// this is for a legacy data format - one value per obj, specify the column.  this means we group data from multiple objs into one column
	// column	value	color	label
	// '2012'	50	'orange'	'foo'
	// '2012'	50	'orange'	'foo'
	// '2013'	50	'orange'	'foo'
	
	var columns = [];
	
	// we group the data points by bar first - filling this.columns
	var column = null; // [{column:'2012',value:50,color:'orange',label:'foo'},{column:'2012',value:50,color:'orange',label:'foo'}] with 'label':'2012',sum:0
	var columnLabelDict = {}; // {'2012':0,'2013':1}
	
	for (var i = 0; i < data.length; i++)
	{
		var obj = data[i];
		var columnEntry = obj[columnKey];
		
		if (columnLabelDict[columnEntry] === undefined)
		{
			column = [];
			columns.push(column);
			columnLabelDict[columnEntry] = columns.length - 1;
			column["label"] = columnEntry;
			column["sum"] = 0;
		}
		else
		{
			column = columns[columnLabelDict[columnEntry]];
		}
		
		column.push(obj);
		
		for (var key in obj)
		{
			if (valueKeys.indexOf(key) >= 0)
			{
				column["sum"] += obj.value;
			}
		}
	}
	
	return columns;
}
BarChart.prototype.draw = function() {
	
	if (this.columns === null) { this.renewData(); } // this generates columns and controls
	this.calculateDimensions(); // this is a separate function because it must be called every time the width, scale, gap, etc. params change
	
	var ctx = this.ctx;
	
	this.box.clear();
	
	// this.columns = [ Column ]
	// Column : { bottomLabel : "bottomLabel" , topLabel : "topLabel" , sum : 0 , width : 0 , gap : 0 , segments : [ Segment ] }
	// Segment : { value : 0 , label : "segmentLabel" , color }
	
	var left = this.box.lf + this.padding.left;
	
	for (var i = 0; i < this.columns.length; i++)
	{
		var column = this.columns[i];
		
		var barWidth = column.width;
		var barGap = column.gap;
		
		var totalHeight = 0;
		
		var columnRight = left + barWidth;
		var columnBottom = this.box.bt - this.padding.bottom;
		
		for (var k = 0; k < column.segments.length; k++)
		{
			var segment = column.segments[k];
			
			var height = segment.value * this.scale;
			
			// bar segment
			totalHeight += height;
			var top = columnBottom - totalHeight;
			ctx.fillStyle = segment.color;
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'black';
			ctx.fillRect(left, top, barWidth, height);
			//ctx.strokeRect(left, top, barWidth, height);
			
			// segment label
			ctx.font = this.textStyle.segmentLabelFont;
			ctx.fillStyle = this.textStyle.segmentLabelColor;
			ctx.textAlign = 'center';
			ctx.textBaseline = this.textStyle.segmentLabelAnchor;
			var text = segment.label;
			var x = left + barWidth / 2;
			var y = top + height / 2;
			ctx.fillText(text, x, y);
		}
		
		// top label
		ctx.font = this.textStyle.topLabelFont;
		ctx.fillStyle = this.textStyle.topLabelColor;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		var text = column.topLabel;
		var x = left + barWidth / 2;
		var y = columnBottom - totalHeight - this.textStyle.margin;
		ctx.fillText(text, x, y);
		
		// bottom label
		ctx.font = this.textStyle.bottomLabelFont;
		ctx.fillStyle = this.textStyle.bottomLabelColor;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		var text = column.bottomLabel;
		var x = left + barWidth / 2;
		var y = columnBottom + this.textStyle.margin;
		ctx.fillText(text, x, y);
		
		// leave some room (10px) for the barWidth control at the bottom
		//this.scaleControls[i].box.reconcile({lf:left,wd:barWidth,bt:columnBottom - 10,hg:totalHeight - 10});
		//
		//if (i < this.columns.length - 1)
		//{
		//	this.gapControls[i].box.reconcile({lf:columnRight,wd:barGap,bt:columnBottom,hg:10});
		//}
		//
		//this.barWidthControls[i].box.reconcile({lf:left,wd:barWidth,bt:columnBottom,hg:10});
		//
		//this.textMarginControls[i].box.reconcile({lf:left,wd:barWidth,tp:columnBottom,hg:textMargin});
		
		left += barWidth + barGap;
	}
	
	if (this.key && this.key.visible) { this.key.draw(); }
};
BarChart.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.params = {};
	json.params.dataSource = this.dataSource;
	json.params.groupKey = this.groupKey;
	json.params.valueKeys = this.valueKeys;
	json.params.scale = this.scale;
	json.params.barWidth = this.barWidth;
	json.params.barGap = this.barGap;
	json.params.x = this.box.x;
	json.params.y = this.box.y;
	json.params.hAlign = this.box.hAlign;
	json.params.vAlign = this.box.vAlign;
	json.params.textStyle = {};
	json.params.textStyle.margin = this.textStyle.margin;
	json.params.textStyle.segmentLabelFont = this.textStyle.segmentLabelFont;
	json.params.textStyle.segmentLabelColor = this.textStyle.segmentLabelColor;
	json.params.textStyle.segmentLabelAnchor = this.textStyle.segmentLabelAnchor;
	json.params.textStyle.topLabelFont = this.textStyle.topLabelFont;
	json.params.textStyle.topLabelColor = this.textStyle.topLabelColor;
	json.params.textStyle.bottomLabelFont = this.textStyle.bottomLabelFont;
	json.params.textStyle.bottomLabelColor = this.textStyle.bottomLabelColor;
	json.params.margin = {};
	json.params.margin.top = this.margin.top;
	json.params.margin.left = this.margin.left;
	json.params.margin.right = this.margin.right;
	json.params.margin.bottom = this.margin.bottom;
	//json.params.key = this.key.write();
	return json;
};

BarChart.prototype.clear = Griddl.Components.Clear;
BarChart.prototype.onhover = Griddl.Components.OnHover;
BarChart.prototype.dehover = Griddl.Components.DeHover;
BarChart.prototype.onmousemove = Griddl.Components.OnMouseMove;

Griddl.Components.barChart = BarChart;

})();

