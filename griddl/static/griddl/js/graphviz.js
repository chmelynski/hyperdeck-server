
var Graphviz = (function() {

// dataComponentName = string naming a grid component containing objects with fields 'x' and 'y' (and optional 'r')
// reps = integer specifying the number of iterations to perform

// various forms of force-directed layout functions:
//  1. natural location (no edges) (= attracted to natural coordinates, repulsed from all nearby nodes)
//   1a. centered (or otherwise clustered) (= attracted to center of graph (or multiple loci of attraction), repulsed from all nearby nodes)
//  2. graph with edges (= attracted to connected nodes, repulsed from all nearby nodes)

// this particular function was for the county population pies - as such, there is a "natural" (x,y) coordinate for each obj
// this is not implemented yet, but the obj should be attracted to its natural location and repelled by other objects
function ForceDirectedLayout(data, reps) {
	
	var objs = (typeof(data) == 'string') ? Griddl.GetData(dataComponentName) : data;
	
	for (var rep = 0; rep < reps; rep++)
	{
		var forcess = [];
		
		for (var i = 0; i < objs.length; i++)
		{
			var xA = objs[i].x;
			var yA = objs[i].y;
			var rA = objs[i].r;
			
			var forces = [];
			
			for (var j = 0; j < objs.length; j++)
			{
				if (i == j) { continue; }
				
				var xB = objs[j].x;
				var yB = objs[j].y;
				var rB = objs[j].r;
				
				// quickly discard highly separated nodes, so as to circumvent the heavy sqrt calculation
				if (xA - xB < -100 || xA - xB > 100) { continue; }
				if (yA - yB < -100 || yA - yB > 100) { continue; }
				
				var d = Math.sqrt((xA-xB)*(xA-xB)+(yA-yB)*(yA-yB));
				
				// this culls too much - sometimes nodes that are somewhat widely separated should feel a force, to account for intermediate traffic jams
				//if (d > (rA + rB + 20)) { continue; }
				
				var force = {};
				force.target = objs[i].label;
				force.source = objs[j].label;
				force.angle = -Math.atan2(yB-yA,xB-xA);
				force.readableAngle = force.angle / (Math.PI * 2);
				//force.magnitude = 5;
				force.magnitude = rA + rB - d + 10; // the 10 is the optimum distance between the circles
				forces.push(force);
			}
			
			forcess.push(forces);
		}
		
		for (var i = 0; i < forcess.length; i++)
		{
			var x = objs[i].x;
			var y = objs[i].y;
			
			for (var k = 0; k < forcess[i].length; k++)
			{
				var force = forcess[i][k];
				var dx = force.magnitude * Math.cos(force.angle);
				var dy = force.magnitude * Math.sin(force.angle);
				x -= dx;
				y += dy;
			}
			
			objs[i].x = x;
			objs[i].y = y;
		}
	}
}

function ForceDirectedLayoutWithEdges(nodesName, edgesName, reps) {

}

// input should be a text component with lines like a -> b
function ReadGraphvizFormat(inputName, nodesName, edgesName) {
	var input = Griddl.GetData(inputName);
	var lines = input.split('\n');
	
	var nodes = [];
	var edges = [];
	
	for (var i = 0; i < lines.length; i++)
	{
		var parts = lines[i].split(' ');
		var src = parts[0];
		var dst = parts[2];
		
		var srcIndex = nodes.indexOf(src);
		var dstIndex = nodes.indexOf(dst);
		
		if (srcIndex < 0) { srcIndex = nodes.length; nodes.push(src); }
		if (dstIndex < 0) { dstIndex = nodes.length; nodes.push(dst); }
		edges.push({ src : srcIndex , dst : dstIndex });
	}
	
	var squareSideLength = Math.floor(Math.sqrt(nodes.length), 1);
	
	var nodeObjs = [];
	var edgeObjs = [];
	
	var spacing = 50;
	var x = 0;
	var y = 0;
	
	for (var i = 0; i < nodes.length; i++)
	{
		nodeObjs.push({name:nodes[i],x:(x+1)*spacing,y:(y+1)*spacing});
		x++;
		if (x >= squareSideLength) { x = 0; y++; }
	}
	
	for (var i = 0; i < edges.length; i++)
	{
		var edgeObj = {};
		edgeObj.src = edges[i].src;
		edgeObj.dst = edges[i].dst;
		edgeObj.label = '';
		edgeObj.controlPoints = '0.33,30,0.66,-30';
		edgeObj.labelAnchor = 'cp0-cp1';
		edgeObj.labelVector = '5,90';
		edgeObjs.push(edgeObj);
	}
	
	Griddl.SetData(nodesName, nodeObjs);
	Griddl.SetData(edgesName, edgeObjs);
}

// the #ids in this function assume global ids - we should prefix a graph name too
function RecalcNodeSubs(nodeId, nodesName, edgesName) {
	
	var nodes = Griddl.GetData(nodesName);
	var edges = Griddl.GetData(edgesName);
	
	var node = nodes[nodeId];
	$('#label'+nodeId).attr('x', node.x);
	$('#label'+nodeId).attr('y', node.y);
	
	for (var i = 0; i < edges.length; i++)
	{
		var edge = edges[i];
		
		if (edge.src == nodeId || edge.dst == nodeId)
		{
			var pts = CalcEdge(nodes, edge);
			
			// move edge
			var d = '';
			d += 'M ';
			d += pts[0].x + ' ' + pts[0].y + ' ';
			d += 'C ';
			d += pts[1].x + ' ' + pts[1].y + ' ';
			d += pts[2].x + ' ' + pts[2].y + ' ';
			d += pts[3].x + ' ' + pts[3].y + ' ';
			$('#edge'+i).attr('d', d);
			
			// move fletches
			var fletches = CalcFletches(pts);
			$('#edge'+i+'dstFletchR').attr('x1', pts[3].x);
			$('#edge'+i+'dstFletchR').attr('y1', pts[3].y);
			$('#edge'+i+'dstFletchR').attr('x2', pts[3].x + fletches[2].x);
			$('#edge'+i+'dstFletchR').attr('y2', pts[3].y + fletches[2].y);
			$('#edge'+i+'dstFletchL').attr('x1', pts[3].x);
			$('#edge'+i+'dstFletchL').attr('y1', pts[3].y);
			$('#edge'+i+'dstFletchL').attr('x2', pts[3].x + fletches[3].x);
			$('#edge'+i+'dstFletchL').attr('y2', pts[3].y + fletches[3].y);
			
			// recalc label
			var labelx = (pts[1].x + pts[2].x) / 2;
			var labely = (pts[1].y + pts[2].y) / 2;
			$('#edge'+i+'Label').attr('x', labelx);
			$('#edge'+i+'Label').attr('y', labely);
		}
	}
}
// a lot of this is specific to circles - cx, cy attrs, etc.
function AddHandlers(nodesName, edgesName) {
	
	var selector = 'circle';
	
	var nodes = Griddl.GetData(nodesName);
	
	$(selector).css('cursor', 'move');
	$(selector).off('mousedown');
	
	$(selector).on('mousedown', function(downEvent) {
		
		var shape = $(this);
		var id = parseInt(shape.attr('id').substr(4)); // id is prefixed with 'node', hence the substr(4)
		var origX = downEvent.offsetX;
		var origY = downEvent.offsetY;
		
		//var transform = shape.attr('transform');
		//transform = transform.substring(10, transform.length - 1);    
		//var shapeX = parseFloat(transform.split(',')[0]);
		//var shapeY = parseFloat(transform.split(',')[1]);
		
		var shapeX = parseFloat(shape.attr('cx'));
		var shapeY = parseFloat(shape.attr('cy'));
		
		$('svg').on('mousemove', function(moveEvent) {
			
			var currX = moveEvent.offsetX;
			var currY = moveEvent.offsetY;
			
			if (moveEvent.target.tagName == 'text')
			{
				currX += moveEvent.target.offsetLeft;
				currY += moveEvent.target.offsetTop;
			}
			
			var dx = currX - origX;
			var dy = currY - origY;
			var x = shapeX + dx;
			var y = shapeY + dy;
			nodes[id].x = x;
			nodes[id].y = y;
			
			shape.attr('cx', x);
			shape.attr('cy', y);
			
			RecalcNodeSubs(id, nodesName, edgesName); // this recalculates node labels, edges, and edge labels and modifies them in place
			
			Griddl.Refresh(nodesName);
			Griddl.Refresh(edgesName);
		});
		
		$('svg').on('mouseup', function(upEvent) {
			$('svg').off('mousemove');
		});
	});
}

function CalcEdge(nodes, edge) {
	var distangles = edge.controlPoints.split(',');
	
	var cps = [];
	
	for (var k = 0; k < distangles.length; k += 2)
	{
		var dist = parseFloat(distangles[k+0]);
		var angle = parseFloat(distangles[k+1])/360*Math.PI*2;
		
		var vector = Geom.Vector(nodes[edge.src], nodes[edge.dst]);
		Geom.Rotate(vector, angle);
		Geom.Scale(vector, dist);
		
		var cp = Geom.Add(nodes[edge.src], vector);
		cps.push(cp);
	}
	
	var srcStandoffDistance = 25; // this should vary with radius
	var dstStandoffDistance = 25; // this should vary with radius
	var srcStandoffVec = Geom.Vector(nodes[edge.src], cps[0]);
	var dstStandoffVec = Geom.Vector(nodes[edge.dst], cps[1]);
	Geom.SetDist(srcStandoffVec, srcStandoffDistance);
	Geom.SetDist(dstStandoffVec, dstStandoffDistance);
	var srcPoint = Geom.Add(nodes[edge.src], srcStandoffVec);
	var dstPoint = Geom.Add(nodes[edge.dst], dstStandoffVec);
	
	return [ srcPoint, cps[0], cps[1], dstPoint ];
}
function CalcFletches(pts) {
	var fletchLength = 10;
	var fletchDegrees = 30;
	
	var srcFletchVecR = Geom.Vector(pts[0], pts[1]);
	var srcFletchVecL = Geom.Vector(pts[0], pts[1]);
	Geom.RotateDegrees(srcFletchVecR, +fletchDegrees);
	Geom.RotateDegrees(srcFletchVecL, -fletchDegrees);
	Geom.SetDist(srcFletchVecR, fletchLength);
	Geom.SetDist(srcFletchVecL, fletchLength);
	
	var dstFletchVecR = Geom.Vector(pts[3], pts[2]);
	var dstFletchVecL = Geom.Vector(pts[3], pts[2]);
	Geom.RotateDegrees(dstFletchVecR, +fletchDegrees);
	Geom.RotateDegrees(dstFletchVecL, -fletchDegrees);
	Geom.SetDist(dstFletchVecR, fletchLength);
	Geom.SetDist(dstFletchVecL, fletchLength);
	
	return [ srcFletchVecR , srcFletchVecL , dstFletchVecR , dstFletchVecL ];
}

function DrawGraph(g, nodesName, edgesName) {
	
	var nodes = Griddl.GetData(nodesName);
	var edges = Griddl.GetData(edgesName);
	
	for (var i = 0; i < nodes.length; i++)
	{
		var node = nodes[i];
		var x = parseFloat(node.x);
		var y = parseFloat(node.y);
		node.x = x; // this is stupid - we need to specify numeric cols
		node.y = y;
		var r = 20;
		g.SetFillStyle('white');
		g.SetStrokeStyle(2, 'black');
		g.SetSvgId('node' + i.toString());
		g.DrawCircle(x, y, r, false, true);
		
		g.SetFillStyle('black');
		g.SetStrokeStyle(0, 'black');
		g.SetSvgId('label'+i);
		g.SetAlign('center', 'middle');
		g.SetFont('Times New Roman', 12, 'pt');
		g.DrawText(node.name, x, y);
	}
	
	for (var i = 0; i < edges.length; i++)
	{
		var edge = edges[i];
		
		var pts = CalcEdge(nodes, edge);
	
		g.SetStrokeStyle(1, 'black');
		g.SetSvgId('edge' + i.toString());
		g.DrawBezier(pts[0].x, pts[0].y, pts[1].x, pts[1].y, pts[2].x, pts[2].y, pts[3].x, pts[3].y);
		
		var fletches = CalcFletches(pts);
		
		g.SetSvgId('edge' + i.toString() + 'dstFletchR');
		g.DrawLine(pts[3].x, pts[3].y, pts[3].x + fletches[2].x, pts[3].y + fletches[2].y);
		g.SetSvgId('edge' + i.toString() + 'dstFletchL');
		g.DrawLine(pts[3].x, pts[3].y, pts[3].x + fletches[3].x, pts[3].y + fletches[3].y);
		
		g.SetFillStyle('black');
		g.SetStrokeStyle(0, 'black');
		g.SetAlign('center', 'middle');
		g.SetFont('Times New Roman', 12, 'pt');
		var labelx = (pts[1].x + pts[2].x) / 2;
		var labely = (pts[1].y + pts[2].y) / 2;
		g.SetSvgId('edge' + i.toString() + 'Label');
		g.DrawText(edge.label, labelx, labely);
	}
}

function Draggable(nodesName, selector, idField, xField, yField) {
	
	var nodes = Griddl.GetData(nodesName);
	//var nodes = (typeof(nodesName) == 'string') ? Griddl.GetData(nodesName) : nodesName;
	
	var nodeDict = {};
	
	for (var i = 0; i < nodes.length; i++)
	{
		if (!idField)
		{
			nodeDict[i] = nodes[i];
		}
		else
		{
			nodeDict[nodes[i][idField]] = nodes[i];
		}
	}
	
	$(selector).css('cursor', 'move');
	$(selector).off('mousedown');
	
	$(selector).on('mousedown', function(downEvent) {
		
		var shape = $(this);
		var id = shape.attr('id');
		var node = nodeDict[id];
		
		//var origX = downEvent.offsetX;
		//var origY = downEvent.offsetY;
		var origX = downEvent.screenX;
		var origY = downEvent.screenY;
		
		console.log('down ' + origX + ',' + origY);
		
		var shapeX = parseFloat(node[xField]); // before we were pulling current x,y from the svg element - now we're pulling it from the data table
		var shapeY = parseFloat(node[yField]);
		//var transform = shape.attr('transform');
		//transform = transform.substring(10, transform.length - 1);    
		//var shapeX = parseFloat(transform.split(',')[0]);
		//var shapeY = parseFloat(transform.split(',')[1]);
		
		var x = null;
		var y = null;
		
		var currentTransform = shape.attr('transform');
		if (!currentTransform) { currentTransform = ''; }
		
		$('svg').on('mousemove', function(moveEvent) {
			
			//var currX = moveEvent.offsetX;
			//var currY = moveEvent.offsetY;
			var currX = moveEvent.screenX;
			var currY = moveEvent.screenY;
			
			console.log('move ' + currX + ',' + currY);
			
			if (moveEvent.target.tagName == 'text')
			{
				currX += moveEvent.target.offsetLeft;
				currY += moveEvent.target.offsetTop;
			}
			
			var dx = currX - origX;
			var dy = currY - origY;
			
			x = shapeX + dx;
			y = shapeY + dy;
			shape.attr('transform', currentTransform + 'translate(' + dx + ' ' + dy + ')');
		});
		
		$('svg').on('mouseup', function(upEvent) {
		
			node[xField] = x;
			node[yField] = y;
			Griddl.Refresh(nodesName);
			
			$('svg').off('mousemove');
		});
	});
}

var Graphviz = {};
Graphviz.DrawGraph = DrawGraph;
Graphviz.AddHandlers = AddHandlers;
Graphviz.Draggable = Draggable;
return Graphviz;

})();


var Geom = (function() {

function Vector(a, b) {
	var v = {};
	v.x = b.x - a.x;
	v.y = b.y - a.y;
	RecalcPolar(v);
	return v;
}
function RecalcXY(vector) {
	vector.x = vector.distance * Math.cos(vector.angle);
	vector.y = vector.distance * Math.sin(vector.angle);
}
function RecalcPolar(vector) {
	vector.distance = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
	vector.angle = Math.atan2(vector.y, vector.x);
}
function Add(a, b) {
	var v = {};
	v.x = a.x + b.x;
	v.y = a.y + b.y;
	RecalcPolar(v);
	return v;
}
function Rotate(vector, angle) {
	vector.angle += angle;
	RecalcXY(vector);
}
function RotateDegrees(vector, angle) {
	vector.angle += angle / 360 * Math.PI * 2;
	RecalcXY(vector);
}
function Scale(vector, scale) {
	vector.distance *= scale;
	RecalcXY(vector);
}
function SetDist(vector, dist) {
	vector.distance = dist;
	RecalcXY(vector);
}
function SetAngle(vector, angle) {
	vector.angle = angle;
	RecalcXY(vector);
}
function SetAngleDegrees(vector, angle) {
	vector.angle = angle / 360 * Math.PI * 2;
	RecalcXY(vector);
}

var Geom = {};
Geom.Vector = Vector;
Geom.Add = Add;
Geom.Rotate = Rotate;
Geom.RotateDegrees = RotateDegrees;
Geom.Scale = Scale;
Geom.SetDist = SetDist;
Geom.SetAngle = SetAngle;
Geom.SetAngleDegrees = SetAngleDegrees;
return Geom;

})();



