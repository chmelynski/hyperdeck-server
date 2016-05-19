
(function() {

var LineChart = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.data = json.data;
	
	this.div = null;
	this.ctx = null;
	this.section = null;
	
	this.xAxisKey = json.params.xAxisKey;
	
	this.textMargin = json.params.textMargin;
	this.xMin = json.params.xMin;
	this.xMax = json.params.xMax;
	this.yMin = json.params.yMin;
	this.yMax = json.params.yMax;
	
	// filled in in draw after the box is reconciled
	// the problem is that page is not set at this point, so we can't yet calculate the correct box wd and hg
	// so we defer that, and thus the calculation of the scale, until the first draw
	this.xScale = null;
	this.yScale = null;
	
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
	
	//this.xAxis = new Axis(ctx, this, json.params.xAxis, 'x');
	//this.yAxis = new Axis(ctx, this, json.params.yAxis, 'y');
};
LineChart.prototype.add = function() {
	
	this.addElements();
};
LineChart.prototype.addElements = function() {
	
	this.div.html('');
	
	var gui = new dat.GUI({autoPlace:false});
	gui.add(this, 'xMin');
	gui.add(this, 'xMax');
	gui.add(this, 'yMin');
	gui.add(this, 'yMax');
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
LineChart.prototype.draw = function() {
	
	// xAxis	cars	trucks	vans	buses
	// 0	60	50	100	200	300
	
	var ctx = this.ctx;
	
	var colormap = {};
	for (var i = 0; i < this.key.data.length; i++) { colormap[this.key.data[i].label] = this.key.data[i].color; }
	
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
	this.xScale = xPixelWidth / xValueWidth;
	this.yScale = yPixelWidth / yValueWidth;
	
	var firstObj = this.data[0];
	
	for (var key in firstObj)
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = colormap[key];
		
		if (key == this.xAxisKey) { continue; }
		
		ctx.beginPath();
		
		for (var i = 0; i < this.data.length; i++)
		{
			var val = this.data[i][key];
			
			if (val == null || val == '') { continue; } // skip over blank entries
			
			var xNum = parseFloat(this.data[i][this.xAxisKey]);
			var yNum = parseFloat(val);
			
			var x = this.box.lf+this.margin.lf+(xNum-this.xMin)*this.xScale;
			var y = this.box.bt-this.margin.bt-(yNum-this.yMin)*this.yScale;
			
			if (i == 0)
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
	
	this.xAxis.draw();
	this.yAxis.draw();
};
LineChart.prototype.write = function() {
	
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
	json.params.xAxisKey = this.xAxisKey;
	json.params.textMargin = this.textMargin;
	json.params.xMin = this.xMin;
	json.params.xMax = this.xMax;
	json.params.yMin = this.yMin;
	json.params.yMax = this.yMax;
	json.params.xHashInterval = this.xHashInterval;
	json.params.yHashInterval = this.yHashInterval;
	json.params.key = this.key;
	json.params.margin = this.margin;
	json.params.labels = this.label;
	return json;
};

LineChart.prototype.clear = Griddl.Components.Clear;
LineChart.prototype.onhover = Griddl.Components.OnHover;
LineChart.prototype.dehover = Griddl.Components.DeHover;
LineChart.prototype.onmousemove = Griddl.Components.OnMouseMove;

Griddl.Components.lineChart = LineChart;

})();

