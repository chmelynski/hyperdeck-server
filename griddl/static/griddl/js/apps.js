
function ToCommaNumber(n) {
	
	var str = n.toString();
	
	var index = 4;
	
	while (index <= str.length)
	{
		var pos = str.length - index + 1;
		str = str.substr(0, pos) + ',' + str.substr(pos);
		index += 4;
	}
	
	return str;
}

function DrawPie(g, x, y, r, slices, colors) {
	
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
		g.fillStyle = colors[i];
		g.beginPath();
		g.moveTo(x, y);
		g.lineTo(x + r * Math.cos(startArc), y + r * Math.sin(startArc));
		g.arc(x, y, r, startArc, startArc + arc, false);
		g.closePath();
		g.fill();
		startArc += arc;
	}
}
function DrawDemographicPies(g, objs) {
	
	//var boxes = Griddl.GetNamedObjs('boxes', 'name');
	//var boxes = Griddl.GetData('boxes');
	//var box = boxes[boxes.length - 1];
	var box = { minLat : 25 , maxLat : 50 , minLng : -125 , maxLng : -65 };
	
	var latRange = box.maxLat - box.minLat;
	var lngRange = box.maxLng - box.minLng;
	
	var canvasWidth = null;
	var canvasHeight = null;
	
	var baseLength = 1500;
	
	if (latRange > lngRange)
	{
		canvasWidth = baseLength;
		canvasHeight = Math.floor(baseLength * latRange / lngRange, 1);
	}
	else
	{
		canvasWidth = Math.floor(baseLength * lngRange / latRange, 1);
		canvasHeight = baseLength;
	}
	
	var divisor = 200;
	
	for (var i = 0; i < objs.length; i++)
	{
		var lat = objs[i].lat;
		var lng = objs[i].lng;
		
		var x = (lng - box.minLng) / (box.maxLng - box.minLng) * canvasWidth;
		var y = canvasHeight - ((lat - box.minLat) / (box.maxLat - box.minLat) * canvasHeight);
		
		objs[i].x = Math.floor(x, 1);
		objs[i].y = Math.floor(y, 1);
	}
	
	var whiteColor = 'rgb(255,000,000)';
	var blackColor = 'rgb(000,000,255)';
	var latinColor = 'rgb(255,150,000)';
	var asianColor = 'rgb(000,255,000)';
	var otherColor = 'rgb(150,150,150)';
	var colors = [whiteColor,blackColor,latinColor,asianColor,otherColor];
	
	for (var i = 0; i < objs.length; i++)
	{
		var text = objs[i].name;
		
		var x = objs[i].x;
		var y = objs[i].y;
		
		if (x < 0 || y < 0 || x > canvasWidth || y > canvasHeight)
		{
			continue;
		}
		
		var total = objs[i].total;
		
		var white = objs[i].white;
		var black = objs[i].black;
		var latin = objs[i].latin;
		var asian = objs[i].asian;
		var other = objs[i].other;
		
		var r = Math.sqrt((total / divisor) / Math.PI);
		objs[i].r = r;
		
		var slices = [white,black,latin,asian,other].map(function(elt) { return elt / total; });
		
		//g.PushGroup(name);
		
		DrawPie(g, x, y, r, slices, colors);
		
		g.fillStyle = 'rgb(0,0,0)';
		g.font = '8pt Arial';
		g.textAlign = 'center';
		g.fillText(text, x, y + r + 12);
		g.fillText(ToCommaNumber(total), x, y + r + 25);
		
		//g.PopGroup();
	}
}
function DrawDemographicBars(g, objs) {
	
	var extremeLeft = 200;
	var height = 20;
	var totalWidth = 500;
	var top = 80;
	
	var whiteColor = 'rgb(255,0,0)';
	var blackColor = 'rgb(0,0,255)';
	var latinColor = 'rgb(255,150,0)';
	var asianColor = 'rgb(0,255,0)';
	var otherColor = 'rgb(150,150,150)';
	
	var dx = 70;
	var x = 300;
	var y = 35;
	var textBottom = 25;
	var side = 10;
	g.font = '12pt Arial';
	
	g.fillStyle = 'rgb(0,0,0)';
	text = 'white';
	textWidth = g.measureText(text).width;
	g.fillText(text, x + side / 2 - textWidth / 2, textBottom);
	g.fillStyle = whiteColor;
	g.fillRect(x, y, side, side);
	
	x += dx;
	g.fillStyle = 'rgb(0,0,0)';
	text = 'black';
	textWidth = g.measureText(text).width;
	g.fillText(text, x + side / 2 - textWidth / 2, textBottom);
	g.fillStyle = blackColor;
	g.fillRect(x, y, side, side);
	
	x += dx;
	g.fillStyle = 'rgb(0,0,0)';
	text = 'latin';
	textWidth = g.measureText(text).width;
	g.fillText(text, x + side / 2 - textWidth / 2, textBottom);
	g.fillStyle = latinColor;
	g.fillRect(x, y, side, side);
	
	x += dx;
	g.fillStyle = 'rgb(0,0,0)';
	text = 'asian';
	textWidth = g.measureText(text).width;
	g.fillText(text, x + side / 2 - textWidth / 2, textBottom);
	g.fillStyle = asianColor;
	g.fillRect(x, y, side, side);
	
	x += dx;
	g.fillStyle = 'rgb(0,0,0)';
	text = 'other';
	textWidth = g.measureText(text).width;
	g.fillText(text, x + side / 2 - textWidth / 2, textBottom);
	g.fillStyle = otherColor;
	g.fillRect(x, y, side, side);
	
	for (var i = 0; i < objs.length; i++)
	{
		var state = objs[i].state;
		var name = objs[i].name;
		var total = parseInt(objs[i].total);
		var white = parseInt(objs[i].white);
		var black = parseInt(objs[i].black);
		var latin = parseInt(objs[i].latin);
		var asian = parseInt(objs[i].asian);
		var other = parseInt(objs[i].other);
		
		var totalHeight = 0;
		
		g.fillStyle = 'black';
		var text = state + ' ' + name;
		var textWidth = g.measureText(text).width;
		var x = extremeLeft - textWidth;
		var y = top + 40 * i;
		g.fillText(text, x, y);
		
		g.strokeStyle = 'black';
		g.strokeWidth = 0;
		
		var width = 0;
		y -= 15;
		
		x = extremeLeft + 10;
		width = white / total * totalWidth;
		g.fillStyle = whiteColor;
		g.fillRect(x, y, width, height);
		x += width;
		width = black / total * totalWidth;
		g.fillStyle = blackColor;
		g.fillRect(x, y, width, height);
		x += width;
		width = latin / total * totalWidth;
		g.fillStyle = latinColor;
		g.fillRect(x, y, width, height);
		x += width;
		width = asian / total * totalWidth;
		g.fillStyle = asianColor;
		g.fillRect(x, y, width, height);
		x += width;
		width = other / total * totalWidth;
		g.fillStyle = otherColor;
		g.fillRect(x, y, width, height);
		x += width;
	}
}

function VoteSharePies(g, objs) {
	
	var pcts = [];
	var arcs = [];
	var startArcs = [];
	
	for (var i = 0; i < objs.length; i++)
	{
		var obj = objs[i];
		
		var state = obj.state;
		var name = obj.name;
		
		var votesR = parseInt(obj.votesR);
		var votesD = parseInt(obj.votesD);
		var votesTotal = parseInt(obj.votesTotal);
		var winningPerson = obj.winningPerson;
		var winningParty = obj.winningParty;
		
		var x = parseFloat(obj.x);
		var y = parseFloat(obj.y);
		var r = parseFloat(obj.r);
		
		var pct = 0;
		var startArc = 0;
		var arc = 0;
		
		// the .arc() function:
		// arcs go clockwise from the right-hand point of the circle
		// meaning that the right-hand point is 0
		// the bottom is pi/2
		// the left is pi
		// the top is 3pi/2
		
		// show winners only
		if (true)
		{
			g.fillStyle = ((winningParty == 'R') ? 'red' : 'blue');
			g.beginPath();
			g.moveTo(x, y);
			g.arc(x, y, r, 0, Math.PI * 2, false);
			g.closePath();
			g.fill();
		
			var text = obj.name + ' - ' + winningPerson;
			var m = g.measureText(text).width;
			g.fillStyle = 'black';
			g.font = '8pt Arial';
			g.fillText(text, x - m / 2, y + r + 10);
			
			continue;
		}
		
		pct = votesR / votesTotal;
		arc = pct * Math.PI * 2;
		g.fillStyle = 'red';
		g.beginPath();
		g.moveTo(x, y);
		g.lineTo(x + r * Math.cos(startArc), y + r * Math.sin(startArc));
		g.arc(x, y, r, startArc, startArc + arc, false);
		g.closePath();
		g.fill();
		startArc += arc;
		
		pct = votesD / votesTotal;
		arc = pct * Math.PI * 2;
		g.fillStyle = 'blue';
		g.beginPath();
		g.moveTo(x, y);
		g.lineTo(x + r * Math.cos(startArc), y + r * Math.sin(startArc));
		g.arc(x, y, r, startArc, startArc + arc, false);
		g.closePath();
		g.fill();
		startArc += arc;
		
		pct = (votesTotal - votesR - votesD) / votesTotal;
		arc = pct * Math.PI * 2;
		g.fillStyle = 'gray';
		g.beginPath();
		g.moveTo(x, y);
		g.lineTo(x + r * Math.cos(startArc), y + r * Math.sin(startArc));
		g.arc(x, y, r, startArc, startArc + arc, false);
		g.closePath();
		g.fill();
		startArc += arc;
		
		var m = g.measureText(obj.name).width;
		g.fillStyle = 'black';
		g.font = '8pt Arial';
		g.fillText(obj.name, x - m / 2, y + r + 10);
	}
}

function DrawPopulationBoxes(g, data) {
	
	var x = 10;
	var y = 10;
	
	var size = 8;
	
	var width = size;
	var height = size;
	
	for (var i = 0; i < data.length; i++)
	{
		var pop = data[i].Pop;
		var boxes = Math.floor(pop / 1000000);
		
		x = 10;
		
		y += 10;
		g.font = '12pt Arial bold';
		g.textAlign = 'start';
		g.fillStyle = 'black';
		g.fillText(data[i].Name, x, y)
		
		y += 20;
		g.font = '12pt Arial bold';
		g.textAlign = 'start';
		g.fillStyle = 'black';
		g.fillText(boxes + ' million', x, y)
		
		for (var k = 0; k < boxes; k++)
		{
			if (k % 10 == 0)
			{
				x = 10;
				y += size + 2;
			}
			else
			{
				x += size + 2;
			}
			
			if (k % 100 == 0)
			{
				y += 5;
			}
			
			g.fillStyle = 'rgb(255,194,14)';
			g.lineWidth = 0;
			g.fillRect(x, y, width, height);
		}
		
		y += 30;
	}
}
function DrawPopGdpBoxes(g, data) {
	
	// this is just one big square per country, dimensions are gdp per capita vs population (and thus area is gdp)
	
	for (var i = 0; i < data.length; i++)
	{
		var pop = data[i].Pop;
		var gdp = data[i].GDP;
		var cap = gdp / pop * 1000000;
		var height = Math.floor(cap / 200);
		var width = Math.floor(pop / 1000000);
		
		g.font = '10pt Arial bold';
		g.fillStyle = 'rgb(0,0,0)';
		g.fillText(data[i].Name, x, y);
		y += 20;
		g.fillText('Pop: ' + Math.floor(pop / 1000000) + ' m', x, y);
		y += 20;
		g.fillText('GDP: ' + Math.floor(gdp / 1000) + ' b', x, y);
		y += 20;
		g.fillText('GDP/Pop: ' + Math.floor(cap / 100) * 100, x, y);
		y += 20;
		
		//g.fillText(boxes + ' million', x, y);
		
		g.fillStyle = 'rgb(0,100,0)';
		g.fillRect(x, y, width, height);
		
		y += height + 50;
	}
}

function RaceGenderOrientation(g, data) {
	
	// to do:
	// hue = race
	// lightness = gender/preference
	// saturation = free variable
	
	var left = 50;
	var top = 20;
	
	var data = {
	'white':{pct:62.2,color:'rgb(200,0,0)'},
	'hispanic':{pct:16.4,color:'rgb(200,200,0)'},
	'black':{pct:12.6,color:'rgb(0,0,200)'},
	'asian':{pct:4.8,color:'rgb(0,200,0)'},
	'native':{pct:0.9,color:'rgb(200,0,200)'},
	'pacific':{pct:0.2,color:'rgb(200,200,200)'},
	'multi':{pct:2.9,color:'rgb(200,200,200)'},
	'lgbtq':{pct:7.0,color:null},
	'non-lgbtq':{pct:93.0,color:null},
	'men':{pct:50.0,color:null},
	'women':{pct:50.0,color:null}};
	
	var hgroups = [];
	hgroups[0] = [ 'men' , 'non-lgbtq' ];
	hgroups[1] = [ 'men' , 'lgbtq' ];
	hgroups[2] = [ 'women' , 'non-lgbtq' ];
	hgroups[3] = [ 'women' , 'lgbtq' ];
	
	var vgroups = [];
	vgroups[0] = [ 'white' ];
	vgroups[1] = [ 'hispanic' ];
	vgroups[2] = [ 'black' ];
	vgroups[3] = [ 'asian' ];
	vgroups[4] = [ 'native' ];
	vgroups[5] = [ 'pacific' ];
	vgroups[6] = [ 'multi' ];
	
	var gap = 10;
	
	var hscale = 400;
	var vscale = 500;
	
	var x = left;
	var y = top;
	
	var width = null;
	var height = null;
	
	for (var i = 0; i < hgroups.length; i++)
	{
		y = top;
		
		for (var j = 0; j < vgroups.length; j++)
		{
			var hproportion = 1.0;
			var vproportion = 1.0;
			
			var title = '';
			
			for (var k = 0; k < vgroups[j].length; k++)
			{
				title += vgroups[j][k] + ' ';
				vproportion *= data[vgroups[j][k]].pct / 100.0;
			}
			
			for (var k = 0; k < hgroups[i].length; k++)
			{
				title += hgroups[i][k] + ' ';
				hproportion *= data[hgroups[i][k]].pct / 100.0;
			}
			
			var totalproportion = hproportion * vproportion;
			var mills = Math.floor(totalproportion * 1000, 1);
			title += Math.floor(mills / 10, 1).toString() + '.' + (mills % 10).toString() + '%';
			
			width = Math.floor(hproportion * hscale, 1);
			height = Math.floor(vproportion * vscale, 1);
			
			g.fillStyle = data[vgroups[j][0]].color;
			g.fillRect(x, y, width, height);
			
			y += height + gap;
		}
		
		x += width + gap;
	}
}

function StatePopGdp(g, data) {
	
	var x = 50;
	
	g.font = '16pt Arial';
	g.fillText('width = population', 50, 30);
	g.fillText('height = GDP per capita', 50, 70);
	g.fillText('red = state budget', 50, 110);
	
	for (var i = 0; i < data.length; i++)
	{
		var pop = data[i].Population;
		var gdp = data[i].GDP;
		var bud = data[i].Budget;
		
		var gdpcap = gdp / pop;
		var budpct = bud / gdp;
		var budcap = bud / pop;
		
		var width = Math.floor(pop * 1.7);
		var height = Math.floor(gdpcap * 6);
		var height2 = Math.floor(budcap * 6);
		
		//var width = Math.floor(gdpcap / 5);
		//var height = Math.floor(pop * 10);
		//var height2 = Math.floor(budpct * height);
		
		g.fillStyle = 'black';
		g.lineWidth = 0;
		g.fillRect(x, 550 - height, width, height);
		
		g.fillStyle = 'red';
		g.fillRect(x, 550 - height2, width, height2);
		
		x += width + 5;
	}
}

function PowerPlants(g, objs) {
	
	var colorDict = {};
	colorDict['NUC'] = 'orange';
	colorDict['NG'] = 'purple';
	colorDict['BIT'] = 'black';
	colorDict['SUB'] = 'black';
	colorDict['LIG'] = 'black';
	colorDict['WAT'] = 'blue';
	colorDict['WND'] = 'green';
	colorDict['SUN'] = 'gold';
	colorDict['DFO'] = 'brown';
	colorDict['RFO'] = 'brown';
	colorDict['GEO'] = 'red';
	
	var keyOptions = {};
	keyOptions.fontSize = 36;
	keyOptions.fontFamily = 'Arial';
	keyOptions.textColor = 'black';
	keyOptions.boxSize = 30;
	keyOptions.rowSpacing = 60;
	keyOptions.keyLabelOffsetX = 50;
	// g.DrawKey(Griddl.GetData('key'), 200, 2300, keyOptions); // DrawKey needs to be modified to accept 'colorDict' rather than a grid
	
	for (var i = 0; i < objs.length; i++)
	{
		var obj = objs[i];
		
		var src = obj.src;
		var mw = parseFloat(obj.mw);
		var x = parseFloat(obj.x);
		var y = parseFloat(obj.y);
		
		var siblings = 0;
		while (i - siblings >= 0 && obj.x == objs[i - siblings].x && obj.y == objs[i - siblings].y)
		{
			siblings++;
		}
		
		var r = Math.sqrt((mw / 1) / Math.PI);
		
		x += (r * 2 + 2) * siblings;
		
		//g.PushGroup(name);
		
		var color = colorDict[src];
		if (!color) { color = 'gray'; }
		g.fillStyle = color;
		g.FillCircle(x, y, r);
		
		/*g.fillStyle = 'black';
		g.font = '12pt Arial';
		g.textAlign = 'center';
		g.fillText(name, x, y + r + 20);
		g.fillText(total.toCommaNumber(), x, y + r + 45);*/
		
		//g.PopGroup();
	}
}
function Factories(g, objs) {
	
	var colorDict = 
	{'General Motors':'navy',
	'Ford':'blue',
	'Chrysler':'teal',
	'Tesla':'aqua',
	'Toyota':'gold',
	'Honda':'orange',
	'Nissan':'red',
	'Subaru':'purple',
	'Mitsubishi':'pink',
	'Volkswagen':'green',
	'Hyundai':'silver',
	'Kia':'gray',
	'BMW':'lime',
	'Daimler':'olive'};
	
	var minLat = 25;
	var maxLat = 50;
	var minLng = -125;
	var maxLng = -65;
	
	var canvasWidth = g.currentPage.width;
	var canvasHeight = g.currentPage.height;
	
	for (var i = 0; i < objs.length; i++)
	{
		var obj = objs[i];
		
		var location = obj.City + ', ' + obj.Region;
		var owner = obj.Company;
		//var bpd = parseFloat(obj.bpd);
		var x = parseFloat(obj.x);
		var y = parseFloat(obj.y);
		
		// calculate end point of pointer line
		var lat = parseFloat(objs[i].lat);
		var lng = parseFloat(objs[i].lng);
		
		var endx = (lng - minLng) / (maxLng - minLng) * canvasWidth;
		var endy = canvasHeight - ((lat - minLat) / (maxLat - minLat) * canvasHeight);
		
		var r = 10;
		//var r = Math.sqrt((bpd / 100) / Math.PI);
		
		g.PushGroup(i.toString());
		
		g.drawLine(x, y, endx, endy);
		
		var color = colorDict[owner];
		if (!color) { color = 'gray'; }
		g.fillStyle = color;
		g.fillCircle(x, y, r);
		
		g.fillStyle = 'rgb(0,0,0)';
		g.font = '10pt Arial';
		g.textAlign = 'center';
		//g.fillText(bpd.toCommaNumber(), x, y + r + 15);
		g.fillText(owner, x, y + r + 15);
		g.fillText(location, x, y + r + 30);
		g.fillText(obj.name, x, y + r + 45);
		
		g.PopGroup();
	}
}
function Refineries(g, objs) {
	
	var colorDict = {};
	colorDict['BP PLC'] = 'green';
	colorDict['CHEVRON CORP'] = 'purple';
	colorDict['CALUMET SPECIALTY PRODUCTS PARTNERS, L.P.'] = 'brown';
	colorDict['EXXON MOBIL CORP'] = 'blue';
	colorDict['HOLLYFRONTIER CORP'] = 'red';
	colorDict['KOCH INDUSTRIES INC'] = 'black';
	colorDict['MARATHON PETROLEUM CORP'] = 'gold';
	colorDict['MOTIVA ENTERPRISES LLC'] = 'lime';
	colorDict['PBF ENERGY CO LLC'] = 'aqua';
	colorDict['PDV AMERICA INC'] = 'maroon';
	colorDict['PHILLIPS 66 COMPANY'] = 'fuchsia';
	colorDict['ROYAL DUTCH/SHELL GROUP'] = 'orange';
	colorDict['TESORO CORP'] = 'olive';
	colorDict['VALERO ENERGY CORP'] = 'teal';
	colorDict['WRB REFINING LP'] = 'navy';
	
	var minLat = 25;
	var maxLat = 50;
	var minLng = -125;
	var maxLng = -65;
	
	var canvasWidth = g.currentPage.width;
	var canvasHeight = g.currentPage.height;
	
	for (var i = 0; i < objs.length; i++)
	{
		var obj = objs[i];
		
		var location = obj.location + ', ' + obj.state;
		var owner = obj.owner;
		var bpd = parseFloat(obj.bpd);
		var x = parseFloat(obj.x);
		var y = parseFloat(obj.y);
		
		
		// calculate end point of pointer line
		var lat = parseFloat(objs[i].lat);
		var lng = parseFloat(objs[i].lng);
		
		var endx = (lng - minLng) / (maxLng - minLng) * canvasWidth;
		var endy = canvasHeight - ((lat - minLat) / (maxLat - minLat) * canvasHeight);
		
		
		var r = Math.sqrt((bpd / 100) / Math.PI);
		
		g.PushGroup(i.toString());
		
		//g.DrawLine(x, y, endx, endy);
		
		var color = colorDict[owner];
		if (!color) { color = 'rgb(128,128,128)'; }
		g.fillStyle = color;
		g.fillCircle(x, y, r);
		
		g.fillStyle = 'rgb(0,0,0)';
		g.font = '10pt Arial';
		g.textAlign = 'center';
		g.fillText(ToCommaNumber(bpd), x, y + r + 15);
		g.fillText(location, x, y + r + 30);
		g.fillText(owner, x, y + r + 45);
		
		g.PopGroup();
	}
}
function MosaicMap(g, data) {
	
	for (var i = 0; i < data.length; i++)
	{
		var dat = data[i];
		var name = dat.name;
		var type = dat.type;
		var shape = dat.shape;
		var color = dat.color;
		var x = dat.x;
		var y = dat.y;
		var r = dat.r;
		
		g.fillStyle = color;
		
		if (shape == 'circle')
		{
			g.beginPath();
			g.arc(x, y, r, 0, Math.PI * 2, true);
			g.fill();
		}
		else if (shape == 'square')
		{
			g.fillRect(x - r / 2, y - r / 2, r, r);
		}
	}
}

function ConvertLatLngToXY() {
	
	// this needs some work to factor out the arguments
	
	var text = Griddl.GetData('data');
	var matrix = Frce.TsvToMatrix(text);
	var objs = Frce.MatrixToObjs(matrix);
	
	var minLat = 25;
	var maxLat = 50;
	var minLng = -125;
	var maxLng = -65;
	
	var canvasWidth = 6000;
	var canvasHeight = 3000;
	
	for (var i = 0; i < objs.length; i++)
	{
		var lat = parseFloat(objs[i].lat);
		var lng = parseFloat(objs[i].lng);
		
		var x = (lng - minLng) / (maxLng - minLng) * canvasWidth;
		var y = canvasHeight - ((lat - minLat) / (maxLat - minLat) * canvasHeight);
		
		objs[i].x = Math.floor(x, 1);
		objs[i].y = Math.floor(y, 1);
	}
	
	var newtext = Frce.ObjsToJoinedLines(objs);
	Griddl.SetData('data', newtext);
}

function DrawStateOutlines(outlines) {
	
	// outlines is defined in us-state-map.js
	
	//g.scale(3, 3)
	g.translate(20, 20);
	
	for (var id in outlines)
	{
		var d = outlines[id];
		
		g.strokeStyle = 'white';
		g.fillStyle = 'lightgray';
		g.DrawPath(d, true, true);
	}
	
	//var cx = 515;
	//var cy = -1435;
	
	var cx = 480;
	var cy = -1565;
	
	// 49 N to 25 N
	// 49 N = canada-us border
	// 46 N = ND-SD border
	// 45 N = MT-WY border
	// 43 N = SD-NE border
	// 42 N = OR/ID-CA/NV border, PA-NY border
	// 41 N = WY-CO border
	// 40 N = NE-KS border
	// 37 N = UT/CO/KS-AZ/NM/OK border
	for (var i = 0; i < 25; i++)
	{
		//var dr = 63 + 22 * i;
		//var r = -cy + dr;
		
		var r = 1620 + 22 * i;
		
		var y = cy + r;
		
		g.strokeStyle = 'red';
		g.strokeCircle(cx, cy, r);
		
		g.fillStyle = 'black';
		g.fillText((49-i).toString(), 400, y);
	}
	
	//  80 31' W = PA-OH border
	// 102 03' W = CO-KS border
	// 109 03' W = CO-UT border
	// 104 03' W - WY-NE border - x=326
	// 111 03' W - WY-ID border - x=192
	for (var i = 0; i < 50; i++)
	{
		var angle = 360 - (76.4 + i * 0.52);
		var r = 2200;
		var cos = Math.cos(angle/360*2*Math.PI);
		var sin = Math.sin(angle/360*2*Math.PI);
		var x = cx + r * cos;
		var y = cy - r * sin;
		
		g.strokeStyle = 'blue';
		g.DrawLine(cx, cy, x, y);
		g.font = '10px Courier New';
		g.textAlign = 'center';
		g.textBaseline = 'top';
		g.fillText((70+i).toString(), x, y);
	}
}

function EmploymentOccupations(g, root) {
	
	//var twig = { value : 'd' , children : [] };
	//globals.objs.tree1.$.children.push(twig);
	//RefreshTree(globals.objs.tree1);
	
	g.fillStyle = 'orange';
	
	var unitWidth = 100;
	var unitHeight = 20;
	var gap = 10;
	
	var AssignHeightsRec = function(twig)
	{
		if (twig.children.length == 0)
		{
			twig.height = unitHeight;
		}
		else
		{
			var total = 0;
			
			for (var i = 0; i < twig.children.length; i++)
			{
				AssignHeightsRec(twig.children[i]);
				total += twig.children[i].height + gap;
			}
			
			total -= gap;
		
			twig.height = total;
		}
	};
	
	AssignHeightsRec(root);
	
	var indent = 0;
	var tops = [20,20,20,20,20];
	
	var DrawRec = function(twig)
	{
		var left = 50 + indent * 110;
		var width = twig.children.length > 0 ? 100 : 100;
		var height = twig.height;
		g.fillRect(left, tops[indent], width, height);
		tops[indent] += height + gap; // top is not progressive
		
		indent++;
		for (var i = 0; i < twig.children.length; i++)
		{
			DrawRec(twig.children[i]);
		}
		indent--;
	};
	
	DrawRec(root);
}
function RevenueIncomeEmployees(g, objs) {
	
	params = {};
	params.left = 50;
	params.bottom = 30;
	params.top = 30;
	params.right = 30;
	params.minX = 0;
	params.maxX = 100;
	params.minY = 0;
	params.maxY = 100;
	params.xScale = 1;
	params.yScale = 1;
	params.rScale = 1;
	
	var left = params.left;
	var bottom = params.bottom;
	var xScale = params.xScale;
	var yScale = params.yScale;
	var rScale = params.rScale;
	
	// what we need is a replacement to scrolling digits
	// (although scrolling digits on a canvas could work too)
	// so a mantissa spinbox and and exponent spinbox
	
	var height = g.canvas.height;
	var width = g.canvas.width;
	
	g.font = '16pt Arial';
	g.fillStyle = 'black';
	//g.fillText('foo', 30, 30);
	
	g.strokeStyle = 'black';
	g.beginPath();
	g.moveTo(left + 0.5, height - bottom - 30);
	g.lineTo(left + 0.5, 30);
	g.stroke();
	
	for (var i = 0; i < objs.length; i++)
	{
		var revenue = parseFloat(objs[i].revenue);
		var income = parseFloat(objs[i].income);
		var employees = parseInt(objs[i].employees);
		var margin = income / revenue;
		
		var rawX = revenue;
		var rawY = margin;
		var rawR = employees;
		
		var x = left + rawX * xScale;
		var y = height - bottom - rawY * yScale;
		var r = rawR * rScale;
		
		g.fillStyle = 'orange';
		//g.strokeStyle = 'black';
		
		g.beginPath();
		g.arc(x, y, r, 0, Math.PI * 2, true);
		g.fill();
	}
}

function StateLegislators(g, states, seats) {
	
	var stateDict = {};
	
	for (var i = 0; i < states.length; i++)
	{
		var x = parseInt(states[i].x);
		var y = parseInt(states[i].y);
		stateDict[states[i].state] = { x : x , y : y };
		
		g.fillStyle = 'rgb(0,0,0)';
		g.font = '20pt Arial bold';
		var text = states[i].state;
		var labelX = x - g.measureText(text).width / 2;
		var labelY = y;
		g.SetSvgId(text);
		
		//g.PushGroup(text);
		g.fillText(text, labelX, labelY);
		//g.PopGroup();
	}
	
	g.SetSvgId(null);
	
	var locs = [];
	
	var radiusIncrement = 11;
	var innerCircle = 5;
	
	var state = null;
	var chamber = null;
	
	for (var i = 0; i < seats.length; i++)
	{
		var seat = seats[i];
		
		if (seat.state != state || seat.chamber != chamber)
		{
			index = 0;
		}
		
		var ring = 1;
		var remainder = index;
		var seatsInCircle = innerCircle;
		index++;
		
		state = seat.state;
		chamber = seat.chamber;
		
		while (true)
		{
			if (remainder < seatsInCircle)
			{
				break;
			}
			
			ring++;
			remainder -= seatsInCircle;
			seatsInCircle += innerCircle;
		}
		
		var bigR = ring * radiusIncrement;
		var angle = -Math.PI * (remainder / (seatsInCircle - 1));
		
		var dx = bigR * Math.cos(angle);
		var dy = bigR * Math.sin(angle);
		
		seat.dx = dx;
		seat.dy = dy;
		seat.angle = angle;
	}
	
	seats.sort(function(a, b) {
		if (a.state == b.state)
		{
			if (a.chamber == b.chamber)
			{
				if (a.angle < b.angle)
				{
					return -1;
				}
				else
				{
					return 1;
				}
			}
			else if (a.chamber < b.chamber)
			{
				return -1;
			}
			else
			{
				return 1;
			}
		}
		else if (a.state < b.state)
		{
			return -1;
		}
		else
		{
			return 1;
		}
	});
	// sort locs on angle
	// sort seats on party,seat
	// then match them one-to-one
	
	//debugger;
	
	for (var i = 0; i < seats.length; i++)
	{
		var seat = seats[i];
		var party = seat.party;
		
		var bigX = stateDict[seat.state].x;
		var bigY = stateDict[seat.state].y;
		
		if (seat.chamber == 'upper')
		{
			bigY -= 50;
		}
		else if (seat.chamber == 'lower')
		{
			bigY += 30;
			seat.dy *= -1;
		}
		
		if (seat.party == 'Democratic')
		{
			g.fillStyle = 'blue';
		}
		else if (seat.party == 'Republican')
		{
			g.fillStyle = 'red';
		}
		else if (seat.party == 'Nonpartisan')
		{
			g.fillStyle = 'purple';
		}
		else if (seat.party == 'Vacant')
		{
			g.fillStyle = 'white';
		}
		else
		{
			g.fillStyle = 'green';
		}
		
		g.strokeWidth = 1;
		g.strokeStyle = 'black';
		
		var x = bigX + seat.dx;
		var y = bigY + seat.dy;
		var r = 3;
		
		g.DrawCircle(x, y, r, true, true);
		
		//g.fillStyle = 'black';
		//var text = objs[i].label;
		//var labelX = x - g.measureText(text).width / 2;
		//var labelY = y + 7;
		//g.fillText(text, labelX, labelY);
	}
}

function StateMaps(g, data, outlines) {
	
	var keyparties = {};
	keyparties['Republican'] = 'red';
	keyparties['Democrat'] = 'blue';
	
	var keysenators = {};
	keysenators['Republican / Republican'] = 'red';
	keysenators['Republican / Democratic'] = 'purple';
	keysenators['Democratic / Democratic'] = 'blue';
	keysenators['Republican / Independent'] = 'orange';
	keysenators['Democratic / Independent'] = 'green';
	
	var keytermends = {};
	keytermends['2014,2016'] = 'green';
	keytermends['2014,2018'] = 'darkorange';
	keytermends['2015,2019'] = 'rgb(255,100,100)';
	keytermends['2016,2020'] = 'red';
	keytermends['2017,2021'] = 'rgb(150,0,0)';
	
	var keyltgov = {};
	keyltgov['Separate elections'] = 'blue';
	keyltgov['Same ticket, gov selects running mate'] = 'red';
	keyltgov['Same ticket, split primary'] = 'darkorange';
	keyltgov['Appointed by state senate'] = 'green';
	keyltgov['No lieutenant governor'] = 'gray';
	
	var colorDict = keyltgov; // user switch
	
	var dataDict = {};
	
	for (var i = 0; i < data.length; i++)
	{
		dataDict[data[i].abbr] = colorDict[data[i][attrname]];
	}
	
	g.translate(20, 20);
	
	for (var id in outlines)
	{
		var d = outlines[id];
		g.strokeStyle = 'white';
		g.fillStyle = dataDict[id];
		g.DrawPath(d, true, true);
	}
	
	// g.DrawKey(key, 850, 450);
}

function CollateSenators(g, data) {
	
	// this relies on an already-present svg map - needs to be modified to draw from scratch
	
	var stateDict = {};
	
	for (var i = 0; i < data.length; i++)
	{
		var state = data[i].state;
		
		if (!stateDict[state])
		{
			stateDict[state] = {};
		}
	}
	
	for (var i = 0; i < data.length; i++)
	{
		var state = data[i].state;
		var party = data[i].party;
		
		var indivDict = stateDict[state];
		
		if (indivDict[party])
		{
			indivDict[party]++;
		}
		else
		{
			indivDict[party] = 1;
		}
		
		stateDict[state] = indivDict;
	}
	
	for (var key in stateDict)
	{
		var indivDict = stateDict[key];
		
		var color = null;
		
		if (indivDict.Republican == 2)
		{
			color = 'red';
		}
		else if (indivDict.Democratic == 2)
		{
			color = 'blue';
		}
		else if (indivDict.Democratic == 1 && indivDict.Republican == 1)
		{
			color = 'purple';
		}
		else if (indivDict.Democratic == 1 && indivDict.Independent == 1)
		{
			color = 'teal';
		}
		else if (indivDict.Republican == 1 && indivDict.Independent == 1)
		{
			color = 'orange';
		}
		
		$('#' + key).css('fill', color); // replace with g.FillPath or something
	}
}

function Timeline(g, objs) {
	
	var startYear = 1800;
	var nowYear = 2015;
	var timespan = nowYear - startYear;
	var pxPerYear = g.currentPage.width / timespan;
	
	for (var i = 0; i < objs.length; i++)
	{
		var person = objs[i];
		var name = person.name;
		var birth = person.birth;
		var death = person.death;
		var endText = null;
		var age = null;
		
		var birthYear = parseInt(birth.substr(0, 4));
		var endYear = 2015;
		
		var startText = birthYear.toString();
		
		if (death != null && death != "")
		{
			endYear = parseInt(death.substr(0, 4));
			age = endYear - birthYear;
			endText = endYear.toString();
		}
		else
		{
			age = endYear - birthYear;
			endText = age.toString();
		}
		
		var left = (birthYear-startYear)*pxPerYear;
		var width = age*pxPerYear;
		
		var top = 10 + (height + gap) * i;
		var height = 20;
		
		var gap = 5;
		
		g.fillStyle = 'rgb(255,0,0)';
		g.fillRect(left, top, width, height);
		
		g.fillStyle = 'rgb(255,255,255)';
		g.font = '10pt Arial';
		g.textAlign = 'left';
		g.textBaseline = 'middle';
		g.fillText(startText, left + 3, top + height / 2);
		
		g.fillStyle = 'rgb(255,255,255)';
		g.font = '10pt Arial';
		g.textAlign = 'right';
		g.textBaseline = 'middle';
		g.fillText(endText, left + width - 3, top + height / 2);
	
		g.textAlign = 'center';
		g.fillText(name, left + width / 2, top + height / 2);
	}
}

function TextNotes(g, objs) {
	
	var x = null;
	var y = null;
	
	for (var i = 0; i < objs.length; i++)
	{
		var obj = objs[i];
		
		if (obj.x.length == 0)
		{
		
		}
		else if (obj.x[0] == 'd')
		{
			var dx = parseFloat(obj.x.substr(1));
			x += dx;
		}
		else
		{
			x = parseFloat(obj.x);
		}
		
		if (obj.y.length == 0)
		{
		
		}
		else if (obj.y[0] == 'd')
		{
			var dy = parseFloat(obj.y.substr(1));
			y += dy;
		}
		else
		{
			y = parseFloat(obj.y);
		}
		
		g.PushGroup(i.toString());
		
		g.fillStyle = 'black';
		g.font = '10pt Arial';
		g.textAlign = 'left';
		g.fillText(obj.text, x, y);
		
		g.PopGroup();
	}
}

exports.DrawDemographicPies = DrawDemographicPies;
exports.DrawDemographicBars = DrawDemographicBars;
exports.VoteSharePies = VoteSharePies;
exports.DrawPopulationBoxes = DrawPopulationBoxes;
exports.DrawPopGdpBoxes = DrawPopGdpBoxes;
exports.RaceGenderOrientation = RaceGenderOrientation;
exports.StatePopGdp = StatePopGdp;
exports.PowerPlants = PowerPlants;
exports.Factories = Factories;
exports.Refineries = Refineries;
exports.MosaicMap = MosaicMap;
exports.EmploymentOccupations = EmploymentOccupations;
exports.RevenueIncomeEmployees = RevenueIncomeEmployees;
exports.StateLegislators = StateLegislators;
exports.StateMaps = StateMaps;
exports.CollateSenators = CollateSenators;
exports.Timeline = Timeline;
exports.TextNotes = TextNotes;

