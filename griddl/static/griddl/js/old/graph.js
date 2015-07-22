
function MakeGraph(parent, name)
{
	var graph = MakeObj(parent, name);
	graph.display = DisplayGraph;
	graph.displayLabel = DisplayCell; // this will frequently be overridden
	graph.displayNode = DisplayCell; // this will frequently be overridden
	graph.displayEdge = DisplayEdge;
	graph.nodes = MakeList(graph, "nodes");
	graph.edges = MakeList(graph, "edges");
	return graph;
}

function MakeNode(parent, name, contents)
{
	var node = MakeObj(parent, name);
	node["[type]"] = "Node";
	node.ins = MakeList(node, "ins");
	node.ous = MakeList(node, "ous");
	node.contents = contents;
	return node;
}

function AddNode(graph, node)
{
	node.parent = graph;
	graph.nodes.push(node);
}

function AddEdgeInGraph(graph, src, dst, label)
{
	var edge = MakeObj(graph.edges, graph.edges.length.toString()); // graph.edges is the parent in a graph-full situation
	edge.src = src;
	edge.dst = dst;
	edge.label = label;
	edge.parent = graph;
	
	src.ous.push(edge);
	dst.ins.push(edge);
	
	graph.edges.push(edge);
}

function AddEdge(src, dst, label, type)
{
	var edge = MakeObj(src.ous, src.ous.length.toString()); // node.ous is the parent in a graphless situation
	edge["[type]"] = "Edge";
	edge.src = src;
	edge.dst = dst;
	edge.label = label;
	edge.type = type;
	
	src.ous.push(edge);
	dst.ins.push(edge);
}

function HoverControlPoint()
{
	var cp = global.hovered;
	
	cp.lineWidth = 3;
	cp.stroke = "rgb(255,150,0)";
	
	Push("LD", SelectAndBeginDrag);
	Push("LU", EndDrag);
	
	globals.redraw = true;
}

function GenerateForces(nodes, edges)
{
	// 1. Assign all the forces and sum
	// 2. Draw annotated version
	// 3. Move each node and remove forces
	// 4. Draw unannotated version
	// 5. Repeat
	
	var forces = [];
	var f = null;
	
	for (var i = 0; i < nodes.length; i++)
	{
		for (var j = 0; j < nodes.length; j++)
		{
			var a = nodes[i];
			var b = nodes[j];
			
			if (a != b)
			{
				f = MakeForce(a, b, 1); // repulsion
				forces.push(f);
			}
		}
	}
	
	for (var i = 0; i < edges.length; i++)
	{
		var e = edges[i];
		
		f = MakeForce(e.src, e.dst, -1); // attraction
		forces.push(f);
				
		f = MakeForce(e.dst, e.src, -1); // attraction
		forces.push(f);
	}
	
	return forces;
}

function ApplyForces(forces, nodes)
{
	for (var i = 0; i < forces.length; i++)
	{
		var f = forces[i];
		var node = f.node;
		Set(node.cx, Get(node.cx) + f.vx);
		Set(node.cy, Get(node.cy) + f.vy);
	}
}

function MakeForce(a, b, sign)
{
	// sign = +1 = repulsive
	// sign = -1 = attractive
	
	var dx = Get(b.cx) - Get(a.cx);
	var dy = Get(b.cy) - Get(a.cy);
	
	var distance = Math.sqrt(dx * dx + dy * dy);
	
	var strength = 0.0;
	
	if (sign > 0)
	{
		strength = -1 * globals.charge / (distance * distance);
	}
	else if (sign < 0)
	{
		strength = (distance - globals.optimalSpringLength) / globals.springStiffness;
	}
	
	var force = {};
	force.node = a;
	force.vx = strength * dx / distance; // dx / distance is just the normalized vector to the other node
	force.vy = strength * dy / distance;
	return force;
}

function IsConnectedTo(edges, a, b)
{
    for (var i = 0; i < edges.length; i++)
    {
		var e = edges[i];
		
        if (e.from == a && e.to == b || e.to == a && e.from == b)
        {
            return true;
        }
    }

    return false;
}

function Displace(src, dst, d)
{
    var heading = Math.atan2(dst.y - src.y, dst.x - src.x);

    var x = src.x + d * Math.cos(heading);
    var y = src.y + d * Math.sin(heading);

    var p = {};
    p.x = x;
    p.y = y;

    return p;
}

function Distance(a, b)
{
    return Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
}

function Angle(a, b)
{
    return Math.atan2(-(b.y - a.y), b.x - a.x); // the y axis goes up as you go down on the screen - hence the negative sign
}

