
// instead of an edge having a fixed label, an edge can have contents like anything else
// nodes and roots too - anything can have contents - labels are just one possible usage

function TogglePlaceGraphMode()
{
	if (globals.placeGraphMode)
	{
		globals.canvas["TogglePlaceGraphModeButton"].version = 0;
		ExitPlaceGraphMode();
		globals.placeGraphMode = false;
	}
	else
	{
		globals.canvas["TogglePlaceGraphModeButton"].version = 2;
		EnterPlaceGraphMode();
		globals.placeGraphMode = true;
	}
}

function EnterPlaceGraphMode()
{
	PushUnder("LD", PlaceGraph);
}

function ExitPlaceGraphMode()
{
	PopUnder("LD");
}

function PlaceGraph()
{
	var defaultGraphName = "Graph" + (globals.objcounts.graph++).toString();
}

function DisplayGraph(graph, displayNode, displayEdge, displayLabel)
{
	var shape = {};
	AddRectSlots(shape);
	shape.parentSelect = ParentSelectGraphShape;
	shape.parentDeselect = ParentDeselectGraphShape;
	shape.displayNode = displayNode;
	shape.displayEdge = displayEdge;
	shape.displayLabel = displayLabel;
	shape.draw = DrawGraph;
	shape.over = OverGraph;
	shape.position = PositionGraph;
	shape.data = graph;
	shape.nodeShapes = [];
	shape.edgeShapes = [];

	for (var i = 0; i < graph.nodes.length; i++)
	{
		var node = graph.nodes[i];
		var nodeShape = displayNode(node);
		shape.nodeShapes.push(nodeShape);
		nodeShape.parentShape = shape;
		
		nodeShape.stroke = "rgb(158,182,206)"; // "rgb(208,215,229)";
		
		nodeShape.dx = MakeSlot(nodeShape, "dx", 0);
		nodeShape.dy = MakeSlot(nodeShape, "dy", 0);
	}
	
	for (var i = 0; i < graph.edges.length; i++)
	{
		var edge = graph.edges[i];
		var edgeShape = displayEdge(graph, shape, edge);
		shape.edgeShapes.push(edgeShape);
		edgeShape.parentShape = shape;
	}
	
	return shape;
}

function PositionGraph(graphShape)
{
	for (var i = 0; i < graphShape.nodeShapes.length; i++)
	{
		var nodeShape = graphShape.nodeShapes[i];
		
		// Calculate
		Set(nodeShape.left, Get(graphShape.left) + Get(nodeShape.dx));
		Set(nodeShape.right, Get(nodeShape.left) + Get(nodeShape.width));
		Set(nodeShape.wr, Get(nodeShape.width) / 2);
		Set(nodeShape.cx, Get(nodeShape.left) + Get(nodeShape.wr));
		Set(nodeShape.top, Get(graphShape.top) + Get(nodeShape.dy));
		Set(nodeShape.bottom, Get(nodeShape.top) + Get(nodeShape.height));
		Set(nodeShape.hr, Get(nodeShape.height) / 2);
		Set(nodeShape.cy, Get(nodeShape.top) + Get(nodeShape.hr));
		
		nodeShape.position(nodeShape);
	}
	
	for (var i = 0; i < graphShape.edgeShapes.length; i++)
	{
		var edgeShape = graphShape.edgeShapes[i];
		
		var srcp = { x : Get(edgeShape.src.dx) , y : Get(edgeShape.src.dy) };
		var dstp = { x : Get(edgeShape.dst.dx) , y : Get(edgeShape.dst.dy) };
		var cp1p = { x : Get(edgeShape.cps[1].dx) , y : Get(edgeShape.cps[1].dy) };
		var cp2p = { x : Get(edgeShape.cps[2].dx) , y : Get(edgeShape.cps[2].dy) };
		
		var dp0 = Displace(srcp, cp1p, graphShape.standoff);
		var dp3 = Displace(dstp, cp2p, graphShape.standoff);
		
		Set(edgeShape.cps[0].dx, dp0.x);
		Set(edgeShape.cps[0].dy, dp0.y);
		Set(edgeShape.cps[3].dx, dp3.x);
		Set(edgeShape.cps[3].dy, dp3.y);
		
		// Calculate
		Set(edgeShape.cps[0].cx, Get(graphShape.left) + Get(edgeShape.cps[0].dx));
		Set(edgeShape.cps[0].cy, Get(graphShape.top) + Get(edgeShape.cps[0].dy));
		Set(edgeShape.cps[1].cx, Get(graphShape.left) + Get(edgeShape.cps[1].dx));
		Set(edgeShape.cps[1].cy, Get(graphShape.top) + Get(edgeShape.cps[1].dy));
		Set(edgeShape.cps[2].cx, Get(graphShape.left) + Get(edgeShape.cps[2].dx));
		Set(edgeShape.cps[2].cy, Get(graphShape.top) + Get(edgeShape.cps[2].dy));
		Set(edgeShape.cps[3].cx, Get(graphShape.left) + Get(edgeShape.cps[3].dx));
		Set(edgeShape.cps[3].cy, Get(graphShape.top) + Get(edgeShape.cps[3].dy));
		
		edgeShape.position(edgeShape);
	}
}

function ForceDirectedLayout(graphShape)
{
	RandomLayout(graphShape);
	
	for (var i = 0; i < 50; i++)
	{
		var forces = GenerateForces(graphShape.nodeShapes, graphShape.edgeShapes);
		ApplyForces(forces, graphShape.nodeShapes);
	}
	
	for (var i = 0; i < graphShape.nodeShapes.length; i++)
	{
		var node = graphShape.nodeShapes[i];
		
		// Calculate, since only cx and cy were changed by the forces
		Set(node.left, Get(node.cx) - Get(node.wr));
		Set(node.right, Get(node.cx) + Get(node.wr));
		Set(node.top, Get(node.cy) - Get(node.hr));
		Set(node.bottom, Get(node.cy) + Get(node.hr));
	}
	
	for (var i = 0; i < graphShape.edgeShapes.length; i++)
	{
		var edge = graphShape.edgeShapes[i];
		
		// place control points by linear interpolation
		
	}
}

function RandomLayout(graphShape)
{
	var left = Get(graphShape.left);
	var top = Get(graphShape.top);
	var width = Get(graphShape.width);
	var height = Get(graphShape.height);
	
	for (var i = 0; i < graphShape.nodeShapes.length; i++)
	{
		var node = graphShape.nodeShapes[i];
		
		Set(node.dx, Math.floor(Math.random() * (width - Get(node.width))));
		Set(node.dy, Math.floor(Math.random() * (height - Get(node.height))));
	}
	
	for (var i = 0; i < graphShape.edgeShapes.length; i++)
	{
		var edge = graphShape.edgeShapes[i];
		
		// cps[0] and cps[3] are placed in PositionGraph, at a standoff from their nodes
		Set(edge.cps[1].dx, Math.floor(Math.random() * width));
		Set(edge.cps[1].dy, Math.floor(Math.random() * height));
		Set(edge.cps[2].dx, Math.floor(Math.random() * width));
		Set(edge.cps[2].dy, Math.floor(Math.random() * height));
	}
}

function DisplayEdge(graph, graphShape, edge)
{
	var bezier = {};
	bezier.draw = DrawBezier;
	bezier.lineWidth = 1;
	bezier.stroke = "rgb(0,0,0)";
	bezier.points = [];
	bezier.points.push({ x : null , y : null });
	bezier.points.push({ x : null , y : null });
	bezier.points.push({ x : null , y : null });
	bezier.points.push({ x : null , y : null });
	
	var rfletch = {};
	rfletch.draw = DrawPath;
	rfletch.lineWidth = 1;
	rfletch.stroke = "rgb(0,0,0)";
	rfletch.points = [];
	rfletch.points.push({ x : null , y : null });
	rfletch.points.push({ x : null , y : null });
	
	var lfletch = {};
	lfletch.draw = DrawPath;
	lfletch.lineWidth = 1;
	lfletch.stroke = "rgb(0,0,0)";
	lfletch.points = [];
	lfletch.points.push({ x : null , y : null });
	lfletch.points.push({ x : null , y : null });
	
	var cps = [];
	
	for (var i = 0; i < 4; i++)
	{
		var cp = {};
		cp.draw = DrawArc;
		cp.over = OverArc;
		cp.stroke = null;
		cp.fill = "rgb(242,149,54)"; // "rgb(255,213,141)"; // "rgb(255,0,0)";
		cp.radius = 5;
		cp.startAngle = 0;
		cp.endAngle = 2 * Math.PI;
		cp.lineWidth = 1;
		cp.cx = MakeSlot(cp, "cx", null);
		cp.cy = MakeSlot(cp, "cy", null);
		cp.dx = MakeSlot(cp, "dx", null);
		cp.dy = MakeSlot(cp, "dy", null);
		//cp.dThetaDegrees = MakeSlot(cp, "dThetaDegrees", 0);
		//cp.scaledDistance = MakeSlot(cp, "scaledDistance", 0);
		cp.onhover = PrimeDrag;
		cps.push(cp);
	}
	
	var labelShape = null;
	
	if (edge.label.display)
	{
		labelShape = edge.label.display(edge.label);
		labelShape.dx = 10; // MakeSlot(labelShape, "dx", 10); // these are not reasonable defaults
		labelShape.dy = 10; // MakeSlot(labelShape, "dy", 10); // these are not reasonable defaults
		labelShape.referencePoint = edgeShape.cps[1]; // this is a reasonable default
	}
	
	var edgeShape = {};
	edgeShape.draw = DrawEdge;
	edgeShape.over = OverEdge;
	edgeShape.position = PositionEdge;
	edgeShape.data = edge;
	edgeShape.cps = cps;
	edgeShape.bezier = bezier;
	edgeShape.rfletch = rfletch;
	edgeShape.lfletch = lfletch;
	edgeShape.labelShape = labelShape;
	edgeShape.src = graphShape.nodeShapes[graph.nodes.indexOf(edge.src)]; // good god what a clusterfuck - we're using parallel structure between the graph and graphShape
	edgeShape.dst = graphShape.nodeShapes[graph.nodes.indexOf(edge.dst)]; // good god what a clusterfuck

	return edgeShape;
}

function PositionEdge(edgeShape)
{
	// This is a possible framework for preserving curve characteristics through changes to node locations
	// It is too complex and utterly unnecessary at this stage of the game
	
	//var vectorAngle = null;
	//var vectorDistance = null;
	//
	//if (edgeShape.src == edgeShape.dst)
	//{
	//	// we interpret 'scaledDistance' as being simply the distance from the node
	//	// we interpret 'dThetaDegrees' as being simply the angle from window right
	//	// to implement these interpretations, we set these variables to */+ identities
	//	vectorAngle = 0;
	//	vectorDistance = 1;
	//}
	//else
	//{
	//	// the reference vector is the vector from the src to the dst
	//	// each cp is positioned at a displacement angle from that vector, and at a scaled distance from the src
	//	
	//	vectorAngle = Angle(edgeShape.src, edgeShape.dst);
	//	vectorDistance = Distance(edgeShape.src, edgeShape.dst);
	//}
    //
	//Set(edgeShape.cp0.cx, Get(edgeShape.src.cx) + vectorDistance * Get(edgeShape.cp0.scaledDistance) * Math.cos(vectorAngle + Get(edgeShape.cp0.dThetaDegrees) / 360 * Math.PI * 2));
	//Set(edgeShape.cp0.cy, Get(edgeShape.src.cy) + vectorDistance * Get(edgeShape.cp0.scaledDistance) * Math.sin(vectorAngle + Get(edgeShape.cp0.dThetaDegrees) / 360 * Math.PI * 2));
	//Set(edgeShape.cp1.cx, Get(edgeShape.src.cx) + vectorDistance * Get(edgeShape.cp1.scaledDistance) * Math.cos(vectorAngle + Get(edgeShape.cp1.dThetaDegrees) / 360 * Math.PI * 2));
	//Set(edgeShape.cp1.cy, Get(edgeShape.src.cy) + vectorDistance * Get(edgeShape.cp1.scaledDistance) * Math.sin(vectorAngle + Get(edgeShape.cp1.dThetaDegrees) / 360 * Math.PI * 2));
	
	var p0 = { x : Get(edgeShape.cps[0].cx) , y : Get(edgeShape.cps[0].cy) };
	var p1 = { x : Get(edgeShape.cps[1].cx) , y : Get(edgeShape.cps[1].cy) };
	var p2 = { x : Get(edgeShape.cps[2].cx) , y : Get(edgeShape.cps[2].cy) };
	var p3 = { x : Get(edgeShape.cps[3].cx) , y : Get(edgeShape.cps[3].cy) };
	
	edgeShape.bezier.points[0].x = p0.x;
	edgeShape.bezier.points[0].y = p0.y;
	edgeShape.bezier.points[1].x = p1.x;
	edgeShape.bezier.points[1].y = p1.y;
	edgeShape.bezier.points[2].x = p2.x;
	edgeShape.bezier.points[2].y = p2.y;
	edgeShape.bezier.points[3].x = p3.x;
	edgeShape.bezier.points[3].y = p3.y;
	
	var standoff = 10; // distance from center to start/end of arrow
	var fletchLength = 10;
	var fletchAngleDeg = 30;
	
	var pArrowStart = Displace(p0, p1, standoff);
	var pArrowEnd = Displace(p3, p2, standoff);
	
	var angle = Angle(p2, p3);
	var fletch0angle = angle + fletchAngleDeg / 360 * 2 * Math.PI;
	var fletch1angle = angle - fletchAngleDeg / 360 * 2 * Math.PI;
	
	edgeShape.rfletch.points[0].x = p3.x;
	edgeShape.rfletch.points[0].y = p3.y;
	edgeShape.rfletch.points[1].x = p3.x - (fletchLength * Math.cos(fletch0angle));
	edgeShape.rfletch.points[1].y = p3.y + (fletchLength * Math.sin(fletch0angle));
	
	edgeShape.lfletch.points[0].x = p3.x;
	edgeShape.lfletch.points[0].y = p3.y;
	edgeShape.lfletch.points[1].x = p3.x - (fletchLength * Math.cos(fletch1angle));
	edgeShape.lfletch.points[1].y = p3.y + (fletchLength * Math.sin(fletch1angle));
	
	// we assume the target is left-top
	if (edgeShape.labelShape)
	{
		Set(edgeShape.labelShape.left, Get(edgeShape.labelShape.referencePoint.cx) + Get(edgeShape.labelShape.dx));
		Set(edgeShape.labelShape.top, Get(edgeShape.labelShape.referencePoint.cy) + Get(edgeShape.labelShape.dy));
		
		// Calculate
		Set(edgeShape.labelShape.right, Get(edgeShape.labelShape.left) + Get(edgeShape.labelShape.width));
		Set(edgeShape.labelShape.wr, Get(edgeShape.labelShape.width) / 2);
		Set(edgeShape.labelShape.cx, Get(edgeShape.labelShape.left) + Get(edgeShape.labelShape.wr));
		Set(edgeShape.labelShape.bottom, Get(edgeShape.labelShape.top) + Get(edgeShape.labelShape.height));
		Set(edgeShape.labelShape.hr, Get(edgeShape.labelShape.height) / 2);
		Set(edgeShape.labelShape.cy, Get(edgeShape.labelShape.top) + Get(edgeShape.labelShape.hr));
		
		edgeShape.labelShape.position(edgeShape.labelShape);
	}
}

function OnFocusGraphShape(graphShape)
{
	Push("Alt+N", NewNode);
	Push("Alt+E", NewEdge);
}

function DeFocusGraphShape(graphShape)
{
	Pop("Alt+N");
	Pop("Alt+E");
}

function DrawGraph(shape)
{
	DrawBox(shape);
	
	for (var i = 0; i < shape.nodeShapes.length; i++)
	{
		shape.nodeShapes[i].draw(shape.nodeShapes[i]);
	}
	
	for (var i = 0; i < shape.edgeShapes.length; i++)
	{
		shape.edgeShapes[i].draw(shape.edgeShapes[i]);
	}
}

function DrawEdge(shape)
{
	for (var i = 0; i < shape.cps.length; i++) // later, we'll toggle this based on selection
	{
		shape.cps[i].draw(shape.cps[i]);
	}
	
	shape.bezier.draw(shape.bezier);
	shape.rfletch.draw(shape.rfletch);
	shape.lfletch.draw(shape.lfletch);
	
	if (shape.labelShape)
	{
		shape.labelShape.draw(shape.labelShape);
	}
}

function OverGraph(shape)
{
	for (var i = shape.edgeShapes.length - 1; i >= 0; i--)
	{
		var sub = shape.edgeShapes[i];
		
		if (sub.over)
		{
			var target = sub.over(sub);
			
			if (target)
			{
				return target;
			}
		}
	}
	
	for (var i = shape.nodeShapes.length - 1; i >= 0; i--)
	{
		var sub = shape.nodeShapes[i];
		
		if (sub.over)
		{
			var target = sub.over(sub);
			
			if (target)
			{
				return target;
			}
		}
	}
	
	var mx = Get(globals.mx);
	var my = Get(globals.my);
	var left = Get(shape.left);
	var width = Get(shape.width);
	var top = Get(shape.top);
	var height = Get(shape.height);
	
	if (left < mx && mx < left + width && top < my && my < top + height)
	{
		return shape;
	}
	else
	{
		return null;
	}
}

function OverEdge(shape)
{
	// select the edge if we click on either the start or end control points
	// or maybe the label - although probably clicking the label should select the label - but it has to go through edge first, so we need that
	
	// btw's, the control points have to be separated from the nodes so that the edge endpoints can stand off from the node shape
	
	var cps = [ shape.cps[1] , shape.cps[2] ]; // for now, limit draggability to the middle cps, because dragging the endpoints are constrained by the node shape and snapping, etc.
	
	for (var i = cps.length - 1; i >= 0; i--)
	{
		var sub = cps[i];
		
		if (sub.over)
		{
			var target = sub.over(sub);
			
			if (target)
			{
				return target;
			}
		}
	}
	
	if (shape.labelShape)
	{
		if (shape.labelShape.over)
		{
			var target = shape.labelShape.over(shape.labelShape);
			
			if (target)
			{
				return target;
			}
		}
	}
}

