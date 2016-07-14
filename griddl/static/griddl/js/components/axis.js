
(function() {

var Axis = function(chart, json, axis) {
	
	
	// this.placement = json.params.placement; // ['start','zero','end'] - where the axis goes
	
	this.ctx = null;
	this.chart = chart;
	this.params = params;
	this.axis = axis;
	this.anti = ((axis == 'x') ? 'y' : 'x'); // we need to incorporate the z axis here
	
	this.strokeStyle = params.strokeStyle ? params.strokeStyle : 'black';
	this.tickLabelFont = params.tickLabelFont ? params.tickLabelFont : '10pt sans-serif';
	this.tickLabelColor = params.tickLabelColor ? params.tickLabelColor : 'black';
	this.tickLength = params.tickLength ? params.tickLength : 5;
	this.tickInterval = params.tickInterval; // calculate default value based on data?
	
	// this.chart.min[this.axis]
	this.axisValue = params.axisValue ? params.axisValue : Math.max(0, ((this.axis == 'x') ? this.chart.yMin : this.chart.xMin)); // the data value that corresponds to the axis
};
Axis.prototype.draw = function() {
	
	var ctx = this.ctx;
	
	var axisPixel = null;
	var sta = null;
	var end = null;
	var fixed = null;
	
	if (this.axis == 'x')
	{
		axisPixel = this.chart.box.bt - this.chart.margin.bt - Math.floor((this.axisValue - this.chart.yMin) * this.chart.yScale, 1);
		sta = this.chart.box.lf + this.chart.margin.lf;
		end = this.chart.box.rt - this.chart.margin.rt;
	}
	else if (this.axis == 'y')
	{
		axisPixel = this.chart.box.lf + this.chart.margin.lf + Math.floor((this.axisValue - this.chart.xMin) * this.chart.xScale, 1);
		sta = this.chart.box.bt - this.chart.margin.bt;
		end = this.chart.box.tp + this.chart.margin.tp;
	}
	
	fixed = axisPixel + 0.5;
	
	ctx.lineWidth = 1;
	ctx.strokeStyle = this.strokeStyle;
	ctx.font = this.tickLabelFont;
	ctx.fillStyle = this.tickLabelColor;
	
	var x1 = ((this.axis == 'x') ? sta : fixed);
	var y1 = ((this.axis == 'x') ? fixed : sta);
	var x2 = ((this.axis == 'x') ? end : fixed);
	var y2 = ((this.axis == 'x') ? fixed : end);
	ctx.drawLine(x1, y1, x2, y2);
	
	// this basically rounds axisValue down to the nearest tickInterval
	var tickValueCursor = Math.floor(this.axisValue / this.tickInterval, 1) * this.tickInterval;
	
	var maxTickmarks = 100;
	var tickmarkIndex = 0;
	
	while (tickmarkIndex < maxTickmarks)
	{
		tickValueCursor += this.tickInterval;
		
		// unwieldy text concat
		var direction = ((this.axis == 'x') ? 1 : -1);
		
		// here we need the other axis pixel
		var tickPixelCursor = Math.floor(axisPixel + direction * (tickValueCursor - this.axisValue) * this.chart[this.axis + 'Scale'], 1) + 0.5;
		
		if ((this.axis == 'x') && (tickPixelCursor >= this.chart.box.rt - this.chart.margin.rt)) { break; }
		if ((this.axis == 'y') && (tickPixelCursor <= this.chart.box.tp + this.chart.margin.tp)) { break; }
		
		var sta = axisPixel - this.tickLength;
		var end = axisPixel + this.tickLength + 1;
		var fixed = tickPixelCursor;
		var x1 = ((this.axis == 'y') ? sta : fixed); // (this.axis == 'y') indicates a contra stroke
		var y1 = ((this.axis == 'y') ? fixed : sta);
		var x2 = ((this.axis == 'y') ? end : fixed);
		var y2 = ((this.axis == 'y') ? fixed : end);
		ctx.drawLine(x1, y1, x2, y2);
		
		var text = tickValueCursor.toString(); // need number formatting here
		
		if (this.axis == 'x')
		{
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			ctx.fillText(text, tickPixelCursor, axisPixel + this.tickLength + 4);
		}
		else if (this.axis == 'y')
		{
			ctx.textAlign = 'right';
			ctx.textBaseline = 'middle';
			ctx.fillText(text, axisPixel - this.tickLength - 4, tickPixelCursor);
		}
		
		tickmarkIndex++;
	}
};
Axis.prototype.write = function() {
	
};

Axis.prototype.onhover = Griddl.Components.OnHover;
Axis.prototype.dehover = Griddl.Components.DeHover;
Axis.prototype.onmousemove = Griddl.Components.OnMouseMove;

Griddl.Components.Axis = Axis;

})();

