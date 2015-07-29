
// to make this stuff CanvasRenderingContext2D-compatible, we need to replace 'this' with 'ctx' - everywhere

Griddl.Canvas.prototype.SetStyle = function(styleName) {
		
		var style = this.styles[styleName];
		
		if (style.font)
		{
			this.font = style.font;
		}
		else if (style.fontFamily && style.fontSize)
		{
			this.font = style.fontSize + 'pt ' + style.fontFamily;
		}
		
		if (style.color)
		{
			this.lineWidth = 1;
			this.strokeStyle = style.color;
			this.fillStyle = style.color;
		}
		
		if (style.fill)
		{
			this.fillStyle = style.fill;
		}
		
		if (style.stroke)
		{
			this.strokeStyle = style.stroke;
		}
		
		var hAlign = 'left';
		var vAlign = 'bottom';
		if (style.hAlign) { hAlign = style.hAlign; }
		if (style.vAlign) { vAlign = style.vAlign; }
		this.textAlign = hAlign;
		this.textBaseline = vAlign;
	};

Griddl.Canvas.prototype.AddText = function(text, params) {
	
	this.Save(); // a big difference between AddText and the normal was of doing things is that AddText presents a stateless interface
	
	if (params.style) { this.SetStyle(params.style); }
	if (params.font) { this.font = params.font; }
	
	if (params.fontFamily) { this.fontFamily = params.fontFamily; }
	if (params.fontSize) { this.fontSize = params.fontSize; }
	if (params.fontSizeUnits) { this.fontSizeUnits = params.fontSizeUnits; }
	if (params.stroke) { this.strokeStyle = params.stroke; }
	if (params.fill) { this.fillStyle = params.fill; }
	if (params.lineWidth) { this.lineWidth = params.lineWidth; }
	if (params.textAlign) { this.textAlign = params.textAlign; }
	if (params.textBaseline) { this.textBaseline = params.textBaseline; }
	
	var x = null;
	var y = null;
	
	if (params.left)
	{
		this.textAlign = 'left';
		x = params.left;
	}
	else if (params.cx)
	{
		this.textAlign = 'center';
		x = params.cx;
	}
	else if (params.right)
	{
		this.textAlign = 'right';
		x = params.right;
	}
	//else if (params.x)
	//{
	//	this.textAlign = 'left';
	//	x = params.x;
	//}
	else
	{
		//throw new Error();
	}
	
	if (params.top)
	{
		this.textBaseline = 'top';
		y = params.top;
	}
	else if (params.cy)
	{
		this.textBaseline = 'middle';
		y = params.cy;
	}
	else if (params.bottom)
	{
		this.textBaseline = 'bottom';
		y = params.bottom;
	}
	else
	{
		//throw new Error();
		//this.textBaseline = 'alphabetic';
	}
	
	var parent = this.MakeBox(this.currentPage);
	
	if (params.parent)
	{
		parent = params.parent;
	}
	
	if (params.anchor)
	{
		var t = params.anchor.split(" ");
		var hIntern = t[0][0];
		var hExtern = t[0][1];
		var hOffset = parseFloat(t[1]);
		var vIntern = t[2][0];
		var vExtern = t[2][1];
		var vOffset = parseFloat(t[3]);
		
		if (hIntern == 'L')
		{
			this.textAlign = 'left';
		}
		else if (hIntern == 'C')
		{
			this.textAlign = 'center';
		}
		else if (hIntern == 'R')
		{
			this.textAlign = 'right';
		}
		else
		{
			throw new Error();
		}
		
		if (hExtern == 'L')
		{
			x = parent.lf + hOffset;
		}
		else if (hExtern == 'C')
		{
			x = parent.cx + hOffset;
		}
		else if (hExtern == 'R')
		{
			x = parent.rg - hOffset;
		}
		else if (hExtern == 'S')
		{
			throw new Error(); // figure this out
		}
		else
		{
			throw new Error();
		}
		
		if (vIntern == 'T')
		{
			this.textBaseline = 'top';
		}
		else if (vIntern == 'C')
		{
			this.textBaseline = 'middle';
		}
		else if (vIntern == 'B')
		{
			this.textBaseline = 'bottom';
		}
		else
		{
			throw new Error();
		}
		
		if (vExtern == 'T')
		{
			y = parent.tp + vOffset;
		}
		else if (vExtern == 'C')
		{
			y = parent.cy + vOffset;
		}
		else if (vExtern == 'B')
		{
			y = parent.bt - vOffset;
		}
		else if (vExtern == 'S')
		{
			throw new Error(); // figure this out
		}
		else
		{
			throw new Error();
		}
	}
	
	this.fillText(text, x, y);
	
	this.Restore();
};
Griddl.Canvas.prototype.AddImage = function(image, params) {
	
	if (typeof(image) == 'string') { image = Griddl.GetData(image); } // get the HTMLImageElement
	
	var dw = params.width ? params.width : image.width;
	var dh = params.height ? params.height : image.height;
	var sx = params.sx ? params.sx : 0;
	var sy = params.sy ? params.sy : 0;
	var sw = params.sw ? params.sw : image.width;
	var sh = params.sh ? params.sh : image.height;
	
	var x = null;
	var y = null;
	
	if (params.left)
	{
		x = params.left;
	}
	else if (params.cx)
	{
		x = params.cx - dw / 2;
	}
	else if (params.right)
	{
		x = params.right - dw;
	}
	else
	{
		throw new Error();
	}
	
	if (params.top)
	{
		y = params.top;
	}
	else if (params.cy)
	{
		y = params.cy - dh / 2;
	}
	else if (params.bottom)
	{
		y = params.bottom - dh;
	}
	else
	{
		throw new Error();
	}
	
	this.DrawImage(image, x, y, dw, dh, sx, sy, sw, sh);
};
Griddl.Canvas.prototype.AddList = function(listGridName) { this.DrawList(listGridName); };
Griddl.Canvas.prototype.AddTable = function(params) { this.DrawTable(params); };
Griddl.Canvas.prototype.AddParagraphs = function(params) { this.DrawParas(params); };
Griddl.Canvas.prototype.AddBarChart = function(params) { this.DrawChart('bar', params.params, params.data, params.key); };
Griddl.Canvas.prototype.AddLineChart = function(params) { this.DrawChart('line', params.params, params.data, params.key); };
Griddl.Canvas.prototype.AddScatterChart = function(params) { this.DrawChart('bubble', params.params, params.data, params.key); };

// type = 'bubble', 'bar', 'line'
Griddl.Canvas.prototype.DrawChart = function(type, paramsarg, data, key) {
	
	//var params = Griddl.GetParams(params); // this was the pre-dat.gui grid-based params
	var params = (typeof(paramsarg) == 'string') ? Griddl.GetData(paramsarg) : paramsarg;
	var objs = (typeof(data) == 'string') ? Griddl.GetData(data) : data;
	var key = (typeof(key) == 'string') ? Griddl.GetData(key) : key;
	
	var chartLf = params.chartLeft;
	var chartTp = params.chartTop;
	var chartWd = params.chartWidth;
	var chartHg = params.chartHeight;
	var chartRt = chartLf + chartWd;
	var chartBt = chartTp + chartHg;
	var marginLf = params.leftMargin;
	var marginBt = params.bottomMargin;
	var marginRt = params.rightMargin;
	var marginTp = params.topMargin;
	
	params.chartLf = chartLf;
	params.chartTp = chartTp;
	params.chartWd = chartWd;
	params.chartHg = chartHg;
	params.chartRt = chartRt;
	params.chartBt = chartBt;
	params.marginLf = marginLf;
	params.marginBt = marginBt;
	params.marginRt = marginRt;
	params.marginTp = marginTp;
	
	this.clearRect(chartLf, chartTp, chartWd, chartHg);
	this.doFill = true;
	
	// all of the label stuff assumes the chart fills the whole canvas - we need to make it relocatable
	//var tpLabelFont = '16pt Arial';
	//var btLabelFont = '16pt Arial';
	//var lfLabelFont = '16pt Arial';
	//var rtLabelFont = '16pt Arial';
	//var tpLabelFontSize = 16;
	//var btLabelFontSize = 16;
	//var lfLabelFontSize = 16;
	//var rtLabelFontSize = 16;
	//var tpLabelFontFamily = 'Arial';
	//var btLabelFontFamily = 'Arial';
	//var lfLabelFontFamily = 'Arial';
	//var rtLabelFontFamily = 'Arial';
	//var tpLabelColor = 'black';
	//var btLabelColor = 'black';
	//var lfLabelColor = 'black';
	//var rtLabelColor = 'black';
	//var tpLabelOffset = 20;
	//var btLabelOffset = -20;
	//var lfLabelOffset = 20;
	//var rtLabelOffset = 20;
	
	//this.font = tpLabelFontSize + 'pt ' + tpLabelFontFamily;
	//this.textAlign = 'center';
	//this.textBaseline = 'top';
	//this.fillStyle = tpLabelColor;
	//this.fillText(params.topLabel, chartLf + chartWd / 2, chartTp + tpLabelOffset);
	
	// this is the right, left, bottom axis labels that require transformations
	/*
	
	this.save();
	this.rotate(-Math.PI / 2);
	
	this.font = lfLabelFontSize + 'pt ' + lfLabelFontFamily;
	this.textAlign = 'center';
	this.textBaseline = 'top';
	this.fillStyle = lfLabelColor;
	
	this.translate(-canvas.height / 2, lfLabelOffset); // needs to be made relocatable
	
	this.fillText(params.leftLabel, 0, 0);
	
	this.restore();
	this.save();
	this.rotate(Math.PI / 2);
	
	this.font = rtLabelFontSize + 'pt ' + rtLabelFontFamily;
	this.textAlign = 'center';
	this.textBaseline = 'top';
	this.fillStyle = rtLabelColor;
	
	this.translate(canvas.height / 2, -canvas.width + rtLabelOffset); // needs to be made relocatable
	
	this.fillText(params.rightLabel, 0, 0);
	
	this.restore();
	
	this.font = btLabelFontSize + 'pt ' + btLabelFontFamily;
	this.textAlign = 'center';
	this.textBaseline = 'top';
	this.fillStyle = btLabelColor;
	
	this.fillText(params.bottomLabel, canvas.width / 2, canvas.height + btLabelOffset); // needs to be made relocatable
	
	*/
	
	var xMin = params.xMin;
	var xMax = params.xMax;
	var yMin = params.yMin;
	var yMax = params.yMax;
	
	var xPixelWidth = chartWd - marginLf - marginRt;
	var yPixelWidth = chartHg - marginTp - marginBt;
	var xValueWidth = xMax - xMin;
	var yValueWidth = yMax - yMin;
	var xScale = xPixelWidth / xValueWidth;
	var yScale = yPixelWidth / yValueWidth;
	params.xScale = xScale;
	params.yScale = yScale;
	
	if (type == 'bar')
	{
		var columns = [];
		var column = null;
		var columnLabelDict = {};
		for (var i = 0; i < objs.length; i++)
		{
			var obj = objs[i];
			
			if (columnLabelDict[obj.column] === undefined)
			{
				column = [];
				columns.push(column);
				columnLabelDict[obj.column] = columns.length - 1;
				column["label"] = obj.column;
			}
			else
			{
				column = columns[columnLabelDict[obj.column]];
			}
			
			column.push(obj);
		}
		
		var widthBetweenBars = params.widthBetweenBars;
		var width = params.width;
		var textMargin = params.textMargin;
		var scale = params.scale;
		
		for (var i = 0; i < columns.length; i++)
		{
			var totalHeight = 0;
			var totalValue = 0;
			
			var columnLabel = columns[i].label;
			
			for (var k = 0; k < columns[i].length; k++)
			{
				var str = columns[i][k].value;
				var label = columns[i][k].label;
				var color = columns[i][k].color;
				
				var num = parseFloat(str);
				var height = num * scale;
				
				// bar segment
				totalValue += num;
				totalHeight += height;
				var left = chartLf + marginLf + (widthBetweenBars + width) * i;
				var top = chartBt - marginBt - textMargin - totalHeight;
				this.fillStyle = color;
				this.lineWidth = 1;
				this.strokeStyle = 'black';
				this.fillRect(left, top, width, height);
				// this.strokeRect(left, top, width, height);
				
				// segment label
				this.font = '10pt Arial'; // parametrize
				this.fillStyle = 'white'; // parametrize
				this.textAlign = 'center';
				this.textBaseline = 'middle';
				var text = label; // or format 'num'
				var x = left + width / 2;
				var y = top + height / 2;
				this.fillText(text, x, y);
			}
			
			// top label
			this.font = '10pt Arial'; // parametrize
			this.fillStyle = 'black'; // parametrize
			this.textAlign = 'center';
			this.textBaseline = 'bottom';
			var text = totalValue.toString();
			var x = chartLf + marginLf + (widthBetweenBars + width) * i + width / 2;
			var y = chartBt - marginBt - textMargin - totalHeight - textMargin;
			this.fillText(text, x, y);
			
			// bottom label
			this.font = '10pt Arial'; // parametrize
			this.fillStyle = 'black'; // parametrize
			this.textAlign = 'center';
			this.textBaseline = 'top';
			var text = columnLabel;
			var x = chartLf + marginLf + (widthBetweenBars + width) * i + width / 2;
			var y = chartBt - marginBt;
			this.fillText(text, x, y);
		}
	}
	else if (type == 'bubble')
	{
		for (var i = 0; i < objs.length; i++)
		{
			var obj = objs[i];
			
			var xNum = parseFloat(obj.x);
			var yNum = parseFloat(obj.y);
			var rNum = parseFloat(obj.r);
			
			var x = chartLf+marginLf+(xNum-xMin)*xScale;
			var y = chartBt-marginBt-(yNum-yMin)*yScale;
			var r = rNum * params.radiusScale;
			
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
				this.fillStyle = obj.color;
				this.fillCircle(x, y, r);
			}
			
			if (stroke)
			{
				this.lineWidth = lineWidth;
				this.strokeStyle = lineColor;
				this.strokeCircle(x, y, r);
			}
			
			// label
			this.font = '10pt Arial'; // parametrize
			this.fillStyle = 'white'; // parametrize
			this.textAlign = 'center';
			this.textBaseline = 'middle';
			this.fillText(obj.label, x, y);
		}
	}
	else if (type == 'line')
	{
		var colormap = {};
		
		for (var i = 0; i < key.length; i++)
		{
			colormap[key[i].label] = key[i].color;
		}
		
		var firstObj = objs[0];
		
		var xField = 'xAxis'; // beware: magic string here
		
		for (var k in firstObj)
		{
			this.lineWidth = 1;
			this.strokeStyle = colormap[k];
			
			if (k == xField) { continue; }
			
			this.beginPath();
			
			for (var i = 0; i < objs.length; i++)
			{
				var val = objs[i][k];
				
				if (val == null || val == '') { continue; } // skip over blank entries
				
				var xNum = parseInt(objs[i][xField]);
				var yNum = parseInt(val);
				
				var x = chartLf+marginLf+(xNum-xMin)*xScale;
				var y = chartBt-marginBt-(yNum-yMin)*yScale;
				
				if (i == 1)
				{
					this.moveTo(x, y);
				}
				else
				{
					this.lineTo(x, y);
				}
			}
			
			this.stroke();
		}
	}
	else
	{
		throw new Error();
	}
	
	// a prime example of how transformations would be better
	this.DrawKey(key, chartLf + params.keyLeft, chartTp + params.keyTop);
	
	// axes and tickmarks
	if (type == 'bubble' || type == 'line')
	{
		this.DrawAxis(null, params);
	}
};
Griddl.Canvas.prototype.DrawAxis = function(xy, params) {
	
	// get rid of this once the passed-in params has these field
	params.tickLabelFont = '10pt Arial';
	params.tickLabelColor = 'black';
	params.tickLength = 5;
	
	var x1 = null;
	var y1 = null;
	var x2 = null;
	var y2 = null;
	
	var xAxisBarValue = Math.max(0, params.yMin); // x axis
	var xAxisBarPixel = params.chartBt - params.marginBt - Math.floor((xAxisBarValue - params.yMin) * params.yScale, 1); // x axis
	var yAxisBarValue = Math.max(0, params.xMin); // y axis
	var yAxisBarPixel = params.chartLf + params.marginLf + Math.floor((yAxisBarValue - params.xMin) * params.xScale, 1); // y axis
	
	// x axis
	x1 = params.chartLf + params.marginLf;
	y1 = xAxisBarPixel + 0.5;
	x2 = params.chartRt - params.marginRt;
	y2 = xAxisBarPixel + 0.5;
	
	this.lineWidth = 1;
	this.strokeStyle = 'black';
	this.drawLine(x1, y1, x2, y2);
	
	// y axis
	x1 = yAxisBarPixel + 0.5;
	y1 = params.chartBt - params.marginBt;
	x2 = yAxisBarPixel + 0.5;
	y2 = params.chartTp + params.marginTp;
	
	this.lineWidth = 1;
	this.strokeStyle = 'black';
	this.drawLine(x1, y1, x2, y2);
	
	var xTickValueCursor = Math.floor(yAxisBarValue / params.xHashInterval, 1) * params.xHashInterval; // x axis
	var yTickValueCursor = Math.floor(xAxisBarValue / params.yHashInterval, 1) * params.yHashInterval; // y axis
	
	var maxTickmarks = 100;
	var tickmarkIndex = 0;
	
	// x axis tickmarks and labels
	while (tickmarkIndex < maxTickmarks)
	{
		xTickValueCursor += params.xHashInterval; // x axis
		var xTickPixelCursor = Math.floor(yAxisBarPixel + (xTickValueCursor - yAxisBarValue) * params.xScale, 1); // x axis
		if (xTickPixelCursor >= params.chartRt - params.rightMargin) { break; } // x axis
		
		// x axis
		var x1 = xTickPixelCursor + 0.5;
		var y1 = xAxisBarPixel - params.tickLength;
		var x2 = xTickPixelCursor + 0.5;
		var y2 = xAxisBarPixel + params.tickLength + 1;
		
		this.lineWidth = 1;
		this.strokeStyle = 'black';
		this.drawLine(x1, y1, x2, y2);
		
		this.font = params.tickLabelFont;
		this.fillStyle = params.tickLabelColor;
		this.textAlign = 'center'; // x axis
		this.textBaseline = 'top'; // x axis
		this.fillText(xTickValueCursor.toString(), xTickPixelCursor, xAxisBarPixel + params.tickLength + 4); // x axis
		
		tickmarkIndex++;
	}
	
	tickmarkIndex = 0;
	
	while (tickmarkIndex < maxTickmarks)
	{
		yTickValueCursor += params.yHashInterval; // y axis
		var yTickPixelCursor = Math.floor(xAxisBarPixel - (yTickValueCursor - xAxisBarValue) * params.yScale, 1); // y axis
		if (yTickPixelCursor <= params.chartTop + params.topMargin) { break; } // y axis
		
		// y axis
		var x1 = yAxisBarPixel - params.tickLength;
		var y1 = yTickPixelCursor + 0.5;
		var x2 = yAxisBarPixel + params.tickLength + 1;
		var y2 = yTickPixelCursor + 0.5;
		
		this.lineWidth = 1;
		this.strokeStyle = 'black';
		this.drawLine(x1, y1, x2, y2);
		
		this.font = params.tickLabelFont;
		this.fillStyle = params.tickLabelColor;
		this.textAlign = 'right'; // y axis
		this.textBaseline = 'middle'; // y axis
		this.fillText(yTickValueCursor.toString(), yAxisBarPixel - params.tickLength - 4, yTickPixelCursor); // y axis
		
		tickmarkIndex++;
	}
};
Griddl.Canvas.prototype.DrawKey = function(key, left, top, options) {
	
	var keyFontSize = 10;
	var keyFontFamily = 'Arial';
	var keyTextColor = 'black';
	var keyBoxSize = 10;
	var keyRowSpacing = 20;
	var keyLabelOffsetX = 20;
	
	if (options)
	{
		keyFontSize = options.fontSize;
		keyFontFamily = options.fontFamily;
		keyTextColor = options.textColor;
		keyBoxSize = options.boxSize;
		keyRowSpacing = options.rowSpacing;
		keyLabelOffsetX = options.keyLabelOffsetX;
	}
	
	for (var i = 0; i < key.length; i++)
	{
		var x = left;
		var y = top + i * keyRowSpacing;
		var side = keyBoxSize;
		
		this.fillStyle = key[i].color;
		this.fillRect(x, y, side, side);
		this.font = keyFontSize + 'pt ' + keyFontFamily;
		this.fillStyle = keyTextColor;
		this.textAlign = 'left';
		this.textBaseline = 'middle';
		this.fillText(key[i].label, x + keyLabelOffsetX, y + keyBoxSize / 2);
	}
};
Griddl.Canvas.prototype.DrawTable = function(params) {
	
	// the function signature used to be function(tableName, tableStylesName, widthsName, heightsName, left, top)
	
	//Calculate('table1', 'table1Formulas');
	
	var tableName = params.content;
	var tableStylesName = params.styles;
	var data = Griddl.GetData(tableName);
	var tableStyles = Griddl.GetData(tableStylesName);
	
	var widths = [];
	var heights = [];
	
	if (typeof(params.widths) == 'number')
	{
		for (var i = 0; i < data[0].length; i++) { widths.push(params.widths); }
	}
	else if (typeof(params.widths) == 'object') // we'll assume its a list
	{
		widths = params.widths;
	}
	else if (typeof(params.widths) == 'string')
	{
		// we assume the widths objects is a one-row multi-column matrix
		widths = Griddl.GetData(params.widths)[0].map(function(elt, index) { return parseInt(elt); });
	}
	else
	{
		throw new Error();
	}
	
	if (typeof(params.heights) == 'number')
	{
		for (var i = 0; i < data.length; i++) { heights.push(params.heights); }
	}
	else if (typeof(params.heights) == 'object') // we'll assume its a list
	{
		heights = params.heights;
	}
	else if (typeof(params.heights) == 'string')
	{
		// we assume the heights objects is a one-column multi-row matrix
		heights = Griddl.GetData(heightsName).map(function(elt, index) { return parseInt(elt[0]); });
	}
	else
	{
		throw new Error();
	}
	
	var totalWidth = widths.reduce(function(a, b) { return a + b; });
	var totalHeight = heights.reduce(function(a, b) { return a + b; });
	
	var left = null;
	var top = null;
	
	// if the positioning paramater is blank, center the table
	if (!params.left) { left = (this.currentPage.width - totalWidth) / 2; } else { left = params.left; }
	if (!params.top) { top = (this.currentPage.height - totalHeight) / 2; } else { top = params.top; }
	
	var rowPxs = new Array(heights + 1);
	var colPxs = new Array(widths + 1);
	rowPxs[0] = top;
	colPxs[0] = left;
	
	for (var i = 0; i < widths.length; i++) { colPxs[i + 1] = colPxs[i] + widths[i]; }
	for (var i = 0; i < heights.length; i++) { rowPxs[i + 1] = rowPxs[i] + heights[i]; }
	
	// horizontal lines
	for (var i = 0; i < rowPxs.length; i++)
	{
		var x1 = colPxs[0];
		var x2 = colPxs[colPxs.length - 1] + 1;
		var y = rowPxs[i] + 0.5;
		this.lineWidth = 1;
		this.strokeStyle = 'black';
		this.drawLine(x1, y, x2, y);
	}
	
	// vertical lines
	for (var i = 0; i < colPxs.length; i++)
	{
		var y1 = rowPxs[0];
		var y2 = rowPxs[rowPxs.length - 1] + 1;
		var x = colPxs[i] + 0.5;
		this.lineWidth = 1;
		this.strokeStyle = 'black';
		this.drawLine(x, y1, x, y2);
	}
	
	// entries
	for (var i = 0; i < data.length; i++)
	{
		for (var j = 0; j < data[i].length; j++)
		{
			var val = data[i][j];
			
			if (val != null && val != "")
			{
				this.SetStyle(tableStyles[i][j]);
				
				var tp = rowPxs[i];
				var bt = rowPxs[i + 1];
				var lf = colPxs[j];
				var rt = colPxs[j + 1];
				
				var textX = 0;
				var margin = 8;
				
				if (this.textAlign == 'left')
				{
					textX = lf + margin;
				}
				else if (this.textAlign == 'right')
				{
					textX = rt - margin;
				}
				else if (this.textAlign == 'center')
				{
					textX = (lf + rt) / 2;
				}
				
				var textY = (tp + bt) / 2;
				
				this.fillText(val, textX, textY);
			}
		}
	}
};
Griddl.Canvas.prototype.DrawList = function(listName) {
	
	var data = Griddl.GetData(listName);
	
	var y = 0;
	
	for (var i = 0; i < data.length; i++)
	{
		var datum = data[i];
		
		var dy = parseFloat(datum.dy);
		var left = parseFloat(datum.left);
		var size = parseFloat(datum.bulSize);
		var text = datum.text;
		
		y += dy;
		
		this.SetStyle(datum.style);
		this.fillCircle(left, y, size);
		this.fillText(text, left + size + 8, y);
	}
};


// general MathJax notes:
// http://cdn.mathjax.org/mathjax/latest/test/sample-signals.html - this is an interesting page that shows all the signals that get sent

// after all callbacks have finished (how do we do this?  promises?), we can use the data in jax to draw to the canvas
// jax = { page : Page , latex : string , x : float , y : float , d : string }
Griddl.Canvas.prototype.drawMath = function(latex, x, y) {
	
	var jax = {};
	jax.page = this.currentPage;
	jax.latex = latex;
	jax.x = x;
	jax.y = y;
	
	this.jax.push(jax);
	
	var n = this.jax.length;
	var id = 'mathjax' + n.toString();
	
	var div = $(document.createElement('div'));
	div.attr('id', id);
	div.attr('class', 'mathjaxInput');
	div.css('display', 'none');
	$('body').append(div);
	
	jax.inputDivId = '#' + id;
	jax.outputDivId = '#MathJax-Element-' + n.toString() + '-Frame';
	
	div.text(latex);
	
	// http://docs.mathjax.org/en/latest/api/callback.html
	//MathJax.Hub.Queue(["Typeset", MathJax.Hub, id], [callback]);
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, id]);
};

Griddl.Canvas.prototype.DrawParasNaive = function(params) {
	
	this.SetStyle(params.style);
	
	var pitch = params.pitch ? params.pitch : 20;
	var words = Griddl.Wordize(params.text);
	
	var line = '';
	
	var boxIndex = 0;
	var currentBox = params.boxes[boxIndex];
	var left = currentBox.left;
	var top = currentBox.top;
	var width = currentBox.width;
	var height = currentBox.height;
	
	var y = top;
	
	for (var i = 0; i < words.length; i++)
	{
		var word = words[i];
		
		var testline = line + word;
		var lineWidth = this.savedCanvasContext.measureText(testline).width;
		
		if (lineWidth > width)
		{
			this.fillText(line, left, y);
			line = '';
			y += pitch;
			
			if (y > top + height)
			{
				boxIndex++;
				
				if (boxIndex >= params.boxes.length) { return; } // we've run out of room
				
				currentBox = params.boxes[boxIndex];
				left = currentBox.left;
				top = currentBox.top;
				width = currentBox.width;
				height = currentBox.height;
				y = top;
			}
		}
		
		line += word + ' ';
	}
	
	if (line.length > 0)
	{
		this.fillText(line, left, y);
	}
};
Griddl.Canvas.prototype.DrawParas = function(params) {
	
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
			linePoints.push({left:box.left,top:box.top+sumHeight});
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
};
Griddl.Wordize = function(text) {
	
	var words = [];
	var word = '';
	
	var k = 0;
	
	while (k < text.length)
	{
		var c = text[k];
		var n = c.charCodeAt();
		
		if (n == 32 || n == 9 || n == 13 || n == 10)
		{
			words.push(word);
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
		words.push(word);
	}
	
	return words;
};

Griddl.Canvas.prototype.MakeBox = function(page) {
	
	var box = {};
	
	box.lf = 0;
	box.cx = page.width / 2;
	box.rg = page.width;
	box.ww = page.width;
	box.wr = page.width / 2;
	
	box.tp = 0;
	box.cy = page.height / 2;
	box.bt = page.height;
	box.hh = page.height;
	box.hr = page.height / 2;
	
	return box;
};
Griddl.Canvas.Substitute = function(templateName, variablesName) {
	
	var text = Griddl.GetData(templateName);
	var vars = Griddl.GetData(variablesName);
	
	for (var i = 0; i < vars.length; i++)
	{
		var name = vars[i].name;
		var value = vars[i].value;
		
		while (text.search('@' + name) >= 0)
		{
			text = text.replace('@' + name, value);
		}
	}
	
	return text;
};

Griddl.Canvas.prototype.DrawPieChart = function() {
	var canvas = $('#canvas')[0];
	var g = canvas.getContext('2d');
	this.clearRect(0, 0, canvas.width, canvas.height);
	
	var objs = globals.data;
	
	var whiteColor = 'rgb(255,0,0)';
	var blackColor = 'rgb(0,0,255)';
	var hispanicColor = 'rgb(255,150,0)';
	var asianColor = 'rgb(0,255,0)';
	var otherColor = 'rgb(150,150,150)';
	
	var colors = [ whiteColor , blackColor , hispanicColor , asianColor , otherColor ];
	
	var pcts = [];
	var arcs = [];
	var startArcs = [];
	
	for (var i = 0; i < objs.length; i++)
	{
		var obj = objs[i];
		
		var total = obj.total;
		var slices = [ obj.white , obj.black , obj.hispanic , obj.asian , obj.other ].map(function(elt) { return elt / total; });
		
		var r = Math.sqrt((total / 1000) / Math.PI);
		r *= 1.5;
		obj.r = r;
		
		var x = obj.x;
		var y = obj.y;
		
		this.DrawPie(x, y, r, slices, colors);
		
		if (total > 250000)
		{
			this.fillStyle = 'black';
			this.font = '8pt Arial';
			this.textAlign = 'center';
			this.textBaseline = 'top';
			this.fillText(obj.label, x, y + r + 10);
		}
	}
};
Griddl.Canvas.prototype.DrawPie = function(x, y, r, slices, colors) {
		
		// the .arc() function:
		// arcs go clockwise from the right-hand point of the circle
		// meaning that the right-hand point is 0
		// the bottom is pi/2
		// the left is pi
		// the top is 3pi/2
		
		var startArc = 0;
		
		for (var i = 0; i < slices.length; i++)
		{
			var pct = slices[i];
			var arc = pct * Math.PI * 2;
			this.fillStyle = colors[i];
			this.beginPath();
			this.moveTo(x, y);
			this.lineTo(x + r * Math.cos(startArc), y + r * Math.sin(startArc));
			this.arc(x, y, r, startArc, startArc + arc, false);
			this.closePath();
			this.fill();
			startArc += arc;
		}
};
Griddl.Canvas.prototype.DrawShapes = function(shapesName) {
	
	var shapes = Griddl.GetData(shapesName, []);
	
	var parents = Griddl.MakeHash(Griddl.GetData(shapesName));
	
	for (var i = 0; i < shapes.length; i++)
	{
		var obj = shapes[i];
		this.SetActivePage(obj.page);
		this.SetStyle(obj.style);
		
		var x = parseFloat(obj.x);
		var y = parseFloat(obj.y);
		
		var focus = obj;
		
		while (focus.parent)
		{
			var parent = parents[focus.parent];
			x += parseFloat(parent.x);
			y += parseFloat(parent.y);
			focus = parent;
		}
		
		var width = parseFloat(obj.width);
		var height = parseFloat(obj.height);
		
		var type = obj.shape;
		
		if (type == 'text')
		{
			this.fillText(obj.text, x, y);
		}
		else if (type == 'rect')
		{
			// change x and y based on hAlign and vAlign
			this.fillRect(x + 0.5, y + 0.5, width, height);
			this.strokeRect(x, y, width, height); // x and y may need a +0.5 or something
		}
	}
};
Griddl.Canvas.prototype.DrawTexts = function(componentName) {
	
	var objs = Griddl.GetData(componentName, []);
	
	for (var i = 0; i < objs.length; i++)
	{
		var obj = objs[i];
		this.SetActivePage(obj.page);
		
		var color = obj.color ? obj.color : 'black';
		var hAlign = obj.hAlign ? obj.hAlign : 'left';
		var vAlign = obj.vAlign ? obj.vAlign : 'middle';
		
		this.SetStyle(obj.style);
		
		var x = parseFloat(obj.x);
		var y = parseFloat(obj.y);
		
		this.fillText(obj.text, x, y);
	}
};
Griddl.Canvas.prototype.DrawImages = function(componentName) {
	
	var objs = Griddl.GetData(componentName, []);
	
	for (var i = 0; i < objs.length; i++)
	{
		var obj = objs[i];
		this.SetActivePage(obj.page);
		
		var img = Griddl.GetData(obj.name);
		
		var x = parseFloat(obj.x);
		var y = parseFloat(obj.y);
		var hAlign = obj.hAlign;
		var vAlign = obj.vAlign;
		
		var width = obj.width ? parseFloat(obj.width) : img.width;
		var height = obj.height ? parseFloat(obj.height) : img.height;
		
		var left = null;
		var top = null;
		
		if (hAlign == 'left' || hAlign == 'start') // is accepting multiple keywords a good idea?
		{
			left = x;
		}
		else if (hAlign == 'center' || hAlign == 'middle')
		{
			left = x - width / 2;
		}
		else if (hAlign == 'right' || hAlign == 'end')
		{
			left = x - width;
		}
		else
		{
			left = x - width / 2; // default to center - is this wise?
		}
		
		if (vAlign == 'top' || vAlign == 'start') // is accepting multiple keywords a good idea?
		{
			top = y;
		}
		else if (vAlign == 'center' || vAlign == 'middle')
		{
			top = y - height / 2;
		}
		else if (vAlign == 'bottom' || vAlign == 'end')
		{
			top = y - height;
		}
		else
		{
			top = y - height / 2; // default to center - is this wise?
		}
		
		//var left = parseFloat(obj.left);
		//var top = parseFloat(obj.top);
		
		this.DrawImage(img, left, top, width, height);
	}
};
Griddl.Canvas.prototype.DrawCharts = function(componentName) {
	
	var objs = Griddl.GetData(componentName, []);
	
	for (var i = 0; i < objs.length; i++)
	{
		var obj = objs[i];
		this.SetActivePage(obj.page);
		
		this.DrawChart(obj.type, obj.params, obj.data, obj.key);
	}
};
Griddl.Canvas.prototype.DrawTables = function(componentName) {
	
	var objs = Griddl.GetData(componentName, []);
	
	for (var i = 0; i < objs.length; i++)
	{
		var obj = objs[i];
		this.SetActivePage(obj.page);
		
		this.DrawTable(obj.values, obj.styles, obj.widths, obj.heights, obj.left, obj.top);
	}
};

// a few convenience functions
CanvasRenderingContext2D.prototype.drawLine = function(x1, y1, x2, y2) {
	this.beginPath();
	this.moveTo(x1, y1);
	this.lineTo(x2, y2);
	this.stroke();
};
CanvasRenderingContext2D.prototype.fillCircle = function(x, y, r) {
	this.beginPath();
	this.arc(x, y, r, 0, Math.PI * 2, true);
	this.fill();
};
CanvasRenderingContext2D.prototype.strokeCircle = function(x, y, r) {
	this.beginPath();
	this.arc(x, y, r, 0, Math.PI * 2, true);
	this.stroke();
};

// frequently useful for scatter charts
// fillRegularPolygon(x, y, r, n, angle)
// strokeRegularPolygon(x, y, r, n, angle)
// fillStar(x, y, r, angle)
// strokeStar(x, y, r, angle)
// fillCross(x, y, r, angle)
// strokeCross(x, y, r, angle)

