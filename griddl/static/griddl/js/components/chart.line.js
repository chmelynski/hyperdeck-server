
(function() {

var LineChart = function(json) {
	
	if (!json)
	{
		
	}
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	this.ctx = null;
	this.section = null;
	
	this.dataSource = json.params.dataSource; // we need to add a list of listeners to Data components, so that listeners can be notified on data change
	this.data = null; // set in afterLoad
	
	this.xKey = json.params.xKey;
	//this.zKey = json.params.zKey;
	this.yKeys = json.params.yKeys;
	this.yKeyList = null;
	
	this.radiusKey = json.params.radiusKey;
	this.colorKey = json.params.colorKey;
	this.shapeKey = json.params.shapeKey;
	this.labelKey = json.params.labelKey;
	this.radiusScale = json.params.radiusScale;
	this.colorMap = json.params.colorMap;
	this.shapeMap = json.params.shapeMap;
	
	this.xMap = json.params.xMap; // linear, logarithmic
	this.xMin = json.params.xMin;
	this.xMax = json.params.xMax;
	this.yMap = json.params.yMap; 
	this.yMin = json.params.yMin;
	this.yMax = json.params.yMax;
	//this.zMap = json.params.zMap; 
	//this.zMin = json.params.zMin;
	//this.zMax = json.params.zMax;
	
	this.labelPlacement = json.params.labelPlacement;
	this.textStyle = json.params.textStyle;
	
	this.xScale = null;
	this.yScale = null;
	
	//this.xAxis = new Axis(this, json.params.xAxis, 'x');
	//this.yAxis = new Axis(this, json.params.yAxis, 'y');
	
	this.key = json.params.key;
	//this.key = new Key(this, json.params.key);
	
	this.box = new Hyperdeck.Components.Box(this, true);
	this.box.x = json.params.box.x;
	this.box.y = json.params.box.y;
	this.box.wd = json.params.box.wd;
	this.box.hg = json.params.box.hg;
	this.box.hAlign = json.params.box.hAlign ? json.params.box.hAlign : 'center';
	this.box.vAlign = json.params.box.vAlign ? json.params.box.vAlign : 'center';
	this.box.align();
	
	this.padding = json.params.padding ? json.params.padding : { top : 0 , left : 0 , right : 0 , bottom : 0 };
	this.margin = json.params.margin ? json.params.margin : { top : 0 , left : 0 , right : 0 , bottom : 0 };
	
	this.controls = [];
};
LineChart.prototype.afterLoad = function() {
	
	this.data = get(this.dataSource);
};
LineChart.prototype.add = function() {
	
	this.addElements();
};
LineChart.prototype.addElements = function() {
	
	this.div.html('');
	
	var comp = this;
	
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
	
	gui.add(this, 'dataSource');
	gui.add(this, 'xKey');
	//gui.add(this, 'zKey');
	gui.add(this, 'yKeys');
	
	gui.add(this, 'radiusKey');
	gui.add(this, 'colorKey');
	gui.add(this, 'shapeKey');
	gui.add(this, 'labelKey');
	gui.add(this, 'radiusScale');
	
	var controls = [];
	
	var axes = gui.addFolder('axes');
	controls.push(axes.add(this, 'xMap', ['linear','logarithmic']));
	controls.push(axes.add(this, 'xMin'));
	controls.push(axes.add(this, 'xMax'));
	controls.push(axes.add(this, 'yMap', ['linear','logarithmic']));
	controls.push(axes.add(this, 'yMin'));
	controls.push(axes.add(this, 'yMax'));
	//controls.push(axes.add(this, 'zMap', ['linear','logarithmic']));
	//controls.push(axes.add(this, 'zMin'));
	//controls.push(axes.add(this, 'zMax'));
	
	var colorMap = gui.addFolder('colorMap');
	for (var key in this.colorMap) { controls.push(colorMap.addColor(this.colorMap, key)); }
	
	var supportedShapes = ['circle','square','triangle','cross','star'];
	var shapeMap = gui.addFolder('shapeMap');
	for (var key in this.shapeMap) { controls.push(shapeMap.add(this.shapeMap, key, supportedShapes)); }
	
	var labelPlacement = gui.addFolder('labelPlacement');
	controls.push(labelPlacement.add(this.labelPlacement, 'xAnchor', ['left','center','right']));
	controls.push(labelPlacement.add(this.labelPlacement, 'yAnchor', ['top','center','bottom']));
	//controls.push(labelPlacement.add(this.labelPlacement, 'zAnchor', ['front','center','back']));
	controls.push(labelPlacement.add(this.labelPlacement, 'dx'));
	controls.push(labelPlacement.add(this.labelPlacement, 'dy'));
	//controls.push(labelPlacement.add(this.labelPlacement, 'dz'));
	
	var textStyle = gui.addFolder('textStyle');
	controls.push(textStyle.add(this.textStyle, 'margin'));
	
	var key = gui.addFolder('key');
	controls.push(key.add(this.key, 'x'));
	controls.push(key.add(this.key, 'y'));
	controls.push(key.add(this.key, 'hAlign', ['left','center','right']));
	controls.push(key.add(this.key, 'vAlign', ['top','center','bottom']));
	controls.push(key.add(this.key, 'hAnchor', ['left','center','right']));
	controls.push(key.add(this.key, 'vAnchor', ['top','center','bottom']));
	
	this.box.addElements(gui, ['x','y','wd','hg','hAlign','vAlign']);
	
	var padding = gui.addFolder('padding');
	controls.push(padding.add(this.padding, 'top'));
	controls.push(padding.add(this.padding, 'left'));
	controls.push(padding.add(this.padding, 'right'));
	controls.push(padding.add(this.padding, 'bottom'));
	
	var redrawSectionControls = [];
	
	var margin = gui.addFolder('margin');
	redrawSectionControls.push(margin.add(this.margin, 'top'));
	redrawSectionControls.push(margin.add(this.margin, 'left'));
	redrawSectionControls.push(margin.add(this.margin, 'right'));
	redrawSectionControls.push(margin.add(this.margin, 'bottom'));
	
	controls.forEach(function(control) {
		control.onChange(function(value) {
			comp.box.clear();
			comp.draw();
		});
	});
	
	this.div[0].appendChild(gui.domElement);
};
LineChart.prototype.setSize = function() {
	
	this.yKeyList = this.yKeys.split(',').map(x => x.trim());
	
	//this.box.wd = this.page.document.page.width * this.page.document.pixelsPerUnit - this.page.margin.lf - this.page.margin.rt;
	//this.box.hg = this.page.document.page.height * this.page.document.pixelsPerUnit - this.page.margin.tp - this.page.margin.bt;
	//this.box.align();
	//this.reconciled = true;
};
LineChart.prototype.draw = function() {
	
	var ctx = this.ctx;
	
	var xPixelWidth = this.box.wd - this.padding.left - this.padding.right;
	var yPixelWidth = this.box.hg - this.padding.top - this.padding.bottom;
	var xValueWidth = this.xMax - this.xMin;
	var yValueWidth = this.yMax - this.yMin;
	this.xScale = xPixelWidth / xValueWidth;
	this.yScale = yPixelWidth / yValueWidth;
	
	var lf = this.box.lf + this.padding.left;
	var bt = this.box.bt - this.padding.bottom;
	
	for (var k = 0; k < this.yKeyList.length; k++)
	{
		var key = this.yKeyList[k];
		
		ctx.lineWidth = 1;
		ctx.strokeStyle = this.colorMap[key];
		
		ctx.beginPath();
		
		for (var i = 0; i < this.data.length; i++)
		{
			var xNum = this.data[i][this.xKey];
			var yNum = this.data[i][key];
			
			if (yNum == null || yNum == '') { continue; } // skip over blank entries
			
			var x = lf+(xNum-this.xMin)*this.xScale;
			var y = bt-(yNum-this.yMin)*this.yScale;
			
			// what if x or y is outside the bounds of the chart?  we could use a clipping path here - but it has to be implemented in PDF too
			
			if (i == 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
		}
		
		ctx.stroke();
	}
	
	if (this.key && this.key.visible) { this.key.draw(); }
	if (this.xAxis && this.xAxis.visible) { this.xAxis.draw(); }
	if (this.yAxis && this.yAxis.visible) { this.yAxis.draw(); }
};
LineChart.prototype.drawScatterChart = function() {
	
	// x	y	r	color	shape	label	style
	// 10	20	5	'orange'	'circle'	'foo'	'centered'
	
	return;
	
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
	
	if (this.key && this.key.visible) { this.key.draw(); }
	if (this.xAxis && this.xAxis.visible) { this.xAxis.draw(); }
	if (this.yAxis && this.yAxis.visible) { this.yAxis.draw(); }
};
LineChart.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.params = {};
	json.params.dataSource = this.dataSource;
	json.params.radiusScale = this.radiusScale;
	json.params.xKey = this.xKey;
	json.params.yKeys = this.yKeys;
	json.params.textMargin = this.textMargin;
	json.params.xMap = this.xMap;
	json.params.xMin = this.xMin;
	json.params.xMax = this.xMax;
	json.params.yMap = this.yMap;
	json.params.yMin = this.yMin;
	json.params.yMax = this.yMax;
	json.params.x = this.box.x;
	json.params.y = this.box.y;
	json.params.wd = this.box.wd;
	json.params.hg = this.box.hg;
	json.params.hAlign = this.box.hAlign;
	json.params.vAlign = this.box.vAlign;
	//json.params.xHashInterval = this.xHashInterval; // shouldn't this be in Axis?
	//json.params.yHashInterval = this.yHashInterval;
	json.params.padding = this.padding;
	json.params.margin = this.margin;
	//json.params.key = this.key.write();
	//json.params.xAxis = this.xAxis.write();
	//json.params.yAxis = this.yAxis.write();
	return json;
};

LineChart.prototype.clear = Hyperdeck.Components.Clear;
LineChart.prototype.onhover = Hyperdeck.Components.OnHover;
LineChart.prototype.dehover = Hyperdeck.Components.DeHover;
LineChart.prototype.onmousemove = Hyperdeck.Components.OnMouseMove;

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

Hyperdeck.Components.lineChart = LineChart;

})();

