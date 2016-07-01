
(function() {

var ScatterChart = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.data = json.data;
	
	this.div = null;
	this.ctx = null;
	this.section = null;
	
	this.xMin = json.params.xMin;
	this.xMax = json.params.xMax;
	this.yMin = json.params.yMin;
	this.yMax = json.params.yMax;
	this.radiusScale = json.params.radiusScale;
	this.textMargin = json.params.textMargin;
	
	this.xHashInterval = json.params.xHashInterval;
	this.yHashInterval = json.params.yHashInterval;
	
	this.key = json.params.key;
	this.margin = json.params.margin;
	this.labels = json.params.label;
	
	this.controls = [];
	
	this.box = new Griddl.Components.Box(this, true);
	this.box.x = json.params.x;
	this.box.y = json.params.y;
	this.box.hAlign = json.params.hAlign ? json.params.hAlign : 'center';
	this.box.vAlign = json.params.vAlign ? json.params.vAlign : 'center';
	this.reconciled = false;
	
	//this.xAxis = new Axis(ctx, this, params);
	//this.yAxis = new Axis(ctx, this, params);
}
ScatterChart.prototype.add = function() {
	
	this.addElements();
};
ScatterChart.prototype.addElements = function() {
	
	this.div.html('');
	
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
	gui.add(this, 'xMin');
	gui.add(this, 'xMax');
	gui.add(this, 'yMin');
	gui.add(this, 'yMax');
	gui.add(this, 'radiusScale');
	gui.add(this, 'textMargin');
	gui.add(this.box, 'x');
	gui.add(this.box, 'y');
	gui.add(this.box, 'hAlign', ['left','center','right']);
	gui.add(this.box, 'vAlign', ['top','center','bottom']);
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
ScatterChart.prototype.draw = function() {
	
	// x	y	r	color	shape	label	style
	// 10	20	5	'orange'	'circle'	'foo'	'centered'
	
	var ctx = this.ctx;
	
	if (!this.reconciled)
	{
		this.box.wd = this.page.document.page.width * this.page.document.pixelsPerUnit - this.page.margin.lf - this.page.margin.rt;
		this.box.hg = this.page.document.page.height * this.page.document.pixelsPerUnit - this.page.margin.tp - this.page.margin.bt;
		this.box.align();
		this.reconciled = true;
	}
	
	var xPixelWidth = this.box.wd - this.margin.lf - this.margin.rt;
	var yPixelWidth = this.box.hg - this.margin.tp - this.margin.bt;
	var xValueWidth = this.xMax - this.xMin;
	var yValueWidth = this.yMax - this.yMin;
	var xScale = xPixelWidth / xValueWidth;
	var yScale = yPixelWidth / yValueWidth;
	
	for (var i = 0; i < this.data.length; i++)
	{
		var obj = this.data[i];
		
		var xNum = parseFloat(obj.x);
		var yNum = parseFloat(obj.y);
		var rNum = parseFloat(obj.r);
		
		var x = this.box.lf+this.margin.lf+(xNum-this.xMin)*xScale;
		var y = this.box.bt-this.margin.bt-(yNum-this.yMin)*yScale;
		var r = rNum * this.radiusScale;
		
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
		ctx.font = '10pt sans-serif'; // parametrize
		ctx.fillStyle = 'white'; // parametrize
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(obj.label, x, y);
	}
	
	//this.xAxis.draw();
	//this.yAxis.draw();
};
ScatterChart.prototype.write = function() {
	
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
	json.params.textMargin = this.textMargin;
	json.params.xMin = this.xMin;
	json.params.xMax = this.xMax;
	json.params.yMin = this.yMin;
	json.params.yMax = this.yMax;
	json.params.xHashInterval = this.xHashInterval;
	json.params.yHashInterval = this.yHashInterval;
	json.params.radiusScale = this.radiusScale;
	json.params.key = this.key;
	json.params.margin = this.margin;
	json.params.labels = this.label;
	return json;
};

ScatterChart.prototype.clear = Griddl.Components.Clear;
ScatterChart.prototype.onhover = Griddl.Components.OnHover;
ScatterChart.prototype.dehover = Griddl.Components.DeHover;
ScatterChart.prototype.onmousemove = Griddl.Components.OnMouseMove;

function RegularPolygon(ctx, cx, cy, r, n, angle) {
	
	ctx.beginPath();
	
	for (var i = 0; i < n; i++)
	{
		var x = cx + r * Math.cos(angle + i / n * Math.PI * 2);
		var y = cy + r * Math.sin(angle + i / n * Math.PI * 2);
		if (i == 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
	}
	
	ctx.closePath();
}
function Star(ctx, cx, cy, r, angle) {
	
}
function Cross(ctx, cx, cy, r, w) {
	
	// this is a simple 4-legged cross - r is the distance from center to end, w is half the width of each leg
	
	ctx.beginPath();
	ctx.moveTo(cx + r, cy - w);
	ctx.lineTo(cx + w, cy - w);
	ctx.lineTo(cx + w, cy - r);
	ctx.lineTo(cx - w, cy - r);
	ctx.lineTo(cx - w, cy - w);
	ctx.lineTo(cx - r, cy - w);
	ctx.lineTo(cx - r, cy + w);
	ctx.lineTo(cx - w, cy + w);
	ctx.lineTo(cx - w, cy + r);
	ctx.lineTo(cx + w, cy + r);
	ctx.lineTo(cx + w, cy + w);
	ctx.lineTo(cx + r, cy + w);
	ctx.closePath();
}

Griddl.Components.scatterChart = ScatterChart;

})();

