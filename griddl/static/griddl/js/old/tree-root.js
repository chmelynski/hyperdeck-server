
function MakeRootree(parent, name)
{
	var tree = MakeObj(parent, name);
	parent[name] = tree;
	//AddRectSlots(tree);
	tree["[type]"] = "Rootree";
	tree.cells = MakeList(tree, "cells");
	tree.twigs = MakeList(tree, "twigs");
	tree.indents = MakeList(tree, "indents");
	tree.root = null;
	tree.obj = null;
	tree.budField = "bud";
	tree.childrenField = "children";
	tree.generateTwigs = GenerateRootreeTwigs;
	tree.position = PositionRootree;
	tree.draw = DrawRootree;
	//tree.over = OverContents;
	tree.onfocus = OnFocusTree;
	tree.defocus = DeFocusTree;
	tree.editActive = EditSelectedSetTreeShape;
	
	// in our mental coordinate system, we consider the centers of pixels to be whole numbers, and the pixel edges to be halves
	// unfortunately, canvas sees it the opposite way: pixel edges are whole numbers, and pixel centers are halves
	// there is basically one global correction for this, applied in DrawBox - we subtract 0.5 from both left and top before drawing (width and height are unchanged)
	
	// now, we want umbilicals to come out of the precise centers of rootree boxes
	// that means that cx must be a whole number, which means the width must be even
	
	// this situation is reversed for boxtrees - where we want both cx and cy to be halves and the width and the height to be odd
	// (these conditions preserve sharpness for any configuration of the tree)
	
	// specific to rootrees
	tree.subWidth = MakeSlot(tree, "subWidth", 64);
	tree.subHeight = MakeSlot(tree, "subHeight", 20);
	tree.halfgap = MakeSlot(tree, "halfgap", 10);
	
	return tree;
}

function MakeRootreeTwig(tree, parentTwig, data)
{
	var twig = MakeObj(tree.twigs, tree.twigs.length.toString()); // when children are inserted, the [parent] and [name] fields will be overwritten by a call to GenerateContents(tree)
	twig.data = data;
	
	// for right now, twig.cell is always a cell - in the future, this need not be so
	twig.cell = DisplaySlotAsCell(twig, "cell", Get(data)[tree.budField]);
	
	var cell = twig.cell;
	
	cell.container = tree; // order matters - redisplay might depend on the container
	
	cell.redisplay = RedisplayCell;
	cell.redisplay(cell);
	
	twig.parent = parentTwig;
	twig.children = MakeList(twig, "children");
	
	var objChildren = Get(data)[tree.childrenField]; // objChildren must be a list
	
	for (var i = 0; i < objChildren.length; i++)
	{
		var child = MakeRootreeTwig(tree, twig, objChildren[i]);
		twig.children.push(child);
	}
	
	twig.umbilical = MakeUmbilical(twig, "umbilical");
	
	return twig;
}

function GenerateRootreeTwigs(tree)
{
	tree.root = MakeRootreeTwig(tree, null, tree.obj);
	
	GenerateFlatListsFromRootTwig(tree);
}

function PositionRootree(tree)
{
	var indents = Get(tree.indents);
	
	var subWidth = Get(tree.subWidth);
	var subHeight = Get(tree.subHeight);
	var halfgap = Get(tree.halfgap);
	
	var dxs = Dimension(indents, subWidth);
	
	var rootSub = tree.root.cell;
	
	MoveBox(rootSub, "width", "cx", subWidth);
	MoveBox(rootSub, "height", "cy", subHeight);
	MoveBox(rootSub, "cx", "width", Get(rootSub.cx)); // we assume that cx and cy have been set externally - just re-do the calculation here to make sure
	MoveBox(rootSub, "cy", "height", Get(rootSub.cy));
	
	rootSub.position(rootSub);
	
	for (var i = 1; i < tree.twigs.length; i++)
	{
		var twig = tree.twigs[i];
		var parentTwig = twig.parent;
		
		var sub = twig.cell;
		var parentSub = parentTwig.cell;
		
		var parentcx = Get(parentSub.cx);
		var parentcy = Get(parentSub.cy);
		
		MoveBox(sub, "width", "cx", subWidth);
		MoveBox(sub, "height", "cy", subHeight);
		MoveBox(sub, "cx", "width", parentcx + dxs[i]);
		MoveBox(sub, "cy", "height", parentcy + halfgap * 2 + subHeight);
		
		// this could be handled by automata
		var umbilical = twig.umbilical;
		umbilical.points[0].x = Get(sub.cx);
		umbilical.points[0].y = Get(sub.top);
		umbilical.points[1].x = Get(sub.cx);
		umbilical.points[1].y = Get(sub.top) - halfgap;
		umbilical.points[2].x = parentcx;
		umbilical.points[2].y = Get(sub.top) - halfgap;
		umbilical.points[3].x = parentcx;
		umbilical.points[3].y = Get(parentSub.bottom);
		
		sub.position(sub);
	}
}

function DrawRootree(tree)
{
	for (var i = 0; i < tree.twigs.length; i++)
	{
		var twig = tree.twigs[i];
		
		var sub = twig.cell;
		
		if (sub.draw)
		{
			sub.draw(sub);
		}
		
		twig.umbilical.draw(twig.umbilical);
	}
	
	for (var i = 0; i < tree.cells.length; i++)
	{
		var sub = tree.cells[i];
		DrawBorder(sub);
	}
	
	if (tree.activeContent)
	{
		var sub = tree.activeContent;
		DrawActiveBorder("rgb(0,0,0)", Get(sub.left), Get(sub.top), Get(sub.right), Get(sub.bottom));
	}
}

function DrawRootreeHtml(tree)
{
	debugger;
}

function TogglePlaceRootreeMode()
{
	if (globals.placeRootreeMode)
	{
		globals.canvas.buttons["TogglePlaceRootreeModeButton"].version = 0;
		ExitPlaceRootreeMode();
		globals.placeRootreeMode = false;
	}
	else
	{
		globals.canvas.buttons["TogglePlaceRootreeModeButton"].version = 2;
		EnterPlaceRootreeMode();
		globals.placeRootreeMode = true;
	}
}

function EnterPlaceRootreeMode()
{
	PushUnder("LD", PlaceRootree);
}

function ExitPlaceRootreeMode()
{
	PopUnder("LD");
}

function PlaceRootree()
{
	var defaultObjName = "Obj" + globals.id.toString();
	var obj = MakeSlot(globals.canvas, defaultObjName, "");
	globals.canvas[defaultObjName] = obj;
	
	var defaultTreeName = "Tree" + (globals.objcounts.tree++).toString();
	var tree = MakeRootree(globals.canvas, defaultTreeName);
	
	obj.bud = MakeSlot(obj, "bud", "foo");
	obj.children = MakeList(obj, "children");
	
	tree.makeTwig = MakeRootreeTwig;
	
	tree.obj = obj;
	GenerateRootreeTwigs(tree);
	
	MoveBox(tree.root.cell, "cx", "width", Get(globals.mx));
	MoveBox(tree.root.cell, "cy", "height", Get(globals.my));
	
	tree.position(tree);
	
	globals.redraw = true;
}

function DisplayRootree(parent, name, tree, displaySub)
{
	var shape = MakeObj(parent, name);
	
	for (var i = 0; i < tree.cells.length; i++)
	{
		var root = tree.cells[i];
		
		var rootShape = MakeObj(shape.contents, i.toString());
		shape.contents[i] = rootShape;
		
		rootShape.container = shape;
		rootShape.parentSelect = ParentSelectRootShape;
		rootShape.parentDeselect = ParentDeselectRootShape;
		rootShape.over = OverSingletonContents; // a passthrough
		rootShape.contents = displaySub(root.contents);
		rootShape.contents.stroke = "rgb(158,182,206)"; // "rgb(208,215,229)";
		rootShape.contents.parentShape = rootShape;
		rootShape.data = root;
		
		shape.umbilicals[i] = MakeUmbilical(shape.umbilicals, i.toString());
	}
	
	// replicate the tree structure in the shape tree
	shape.root = shape.contents[0];
	
	for (var i = 0; i < tree.contents.length; i++)
	{
		var rootShape = shape.contents[i];
		var root = tree.contents[i];
		
		rootShape.parent = shape.contents[tree.contents.indexOf(root.parent)];
		rootShape.children = MakeList(rootShape, "children");
		
		for (var j = 0; j < root.children.length; j++)
		{
			rootShape.children.push(shape.contents[tree.contents.indexOf(root.children[j])]);
		}
	}
	
	return shape;
}

function MakeUmbilical(parent, name)
{
	var umbilical = MakeObj(parent, name);
	umbilical.draw = DrawLinepath; // each segment is drawn by canvas as an individual line
	umbilical.lineWidth = 1;
	//umbilical.stroke = "rgb(158,182,206)";
	umbilical.stroke = "rgb(0,0,0)";
	umbilical.points = MakeList(umbilical, "points");
	
	for (var i = 0; i < 4; i++)
	{
		var seg = MakeObj(umbilical.points, i.toString());
		seg.x = null;
		seg.y = null;
		umbilical.points.push(seg);
	}
	
	return umbilical;
}

