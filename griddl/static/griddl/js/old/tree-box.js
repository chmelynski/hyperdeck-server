 
function MakeBoxtree(parent, name)
{
	var tree = MakeObj(parent, name);
	parent[name] = tree;
	tree["[type]"] = "Boxtree";
	tree.cells = MakeList(tree, "cells");
	tree.twigs = MakeList(tree, "twigs");
	tree.indents = MakeList(tree, "indents");
	tree.root = null;
	tree.obj = null;
	tree.budField = "bud";
	tree.childrenField = "children";
	tree.generateTwigs = GenerateBoxtreeTwigs;
	tree.position = PositionBoxtree;
	//tree.draw = DrawBoxtree;
	tree.draw = DrawBoxtreeHtml;
	//tree.over = OverContents;
	//tree.onfocus = OnFocusTree;
	//tree.defocus = DeFocusTree;
	//tree.editActive = EditSelectedSetTreeShape;
	return tree;
}

function MakeBoxtreeTwig(tree, parentTwig, data)
{
	var twig = MakeObj(tree.twigs, tree.twigs.length.toString()); // when children are inserted, the [parent] and [name] fields will be overwritten by a call to GenerateContents(tree)
	twig.data = data;
	
	// boxtree-specific
	twig.ori = "h";
	
	// for right now, twig.cell is always a cell - in the future, this need not be so
	
	twig.cell = DisplaySlotAsCell(twig, "cell", Get(data)[tree.budField]);
	
	var cell = twig.cell;
	
	cell.container = tree; // order matters - RedisplayGramCell depends on the container
	
	// grammar-specific
	cell.redisplay = RedisplayGramCell;
	cell.redisplay(cell);
	
	twig.parent = parentTwig;
	twig.children = MakeList(twig, "children");
	
	var objChildren = Get(data)[tree.childrenField]; // objChildren must be a list
	
	for (var i = 0; i < objChildren.length; i++)
	{
		var child = MakeBoxtreeTwig(tree, twig, objChildren[i]);
		twig.children.push(child);
	}
	
	return twig;
}

function GenerateBoxtreeTwigs(tree)
{
	tree.root = MakeBoxtreeTwig(tree, null, tree.obj);
	
	GenerateFlatListsFromRootTwig(tree);
}

function PositionBoxtree(tree)
{
	SetTwigDim(tree.root);
	SetTwigPos(tree.root);
	
	for (var i = 0; i < tree.cells.length; i++)
	{
		var cell = tree.cells[i];
		cell.position(cell);
	}
}

function DrawBoxtree(tree)
{
	for (var i = 0; i < tree.cells.length; i++)
	{
		var sub = tree.cells[i];
		
		if (sub.draw)
		{
			sub.draw(sub);
		}
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

function DrawBoxtreeHtml(tree)
{
	debugger;
}

function TogglePlaceBoxtreeMode()
{
	if (globals.placeBoxtreeMode)
	{
		globals.canvas.buttons["TogglePlaceBoxtreeModeButton"].version = 0;
		ExitPlaceBoxtreeMode();
		globals.placeBoxtreeMode = false;
	}
	else
	{
		globals.canvas.buttons["TogglePlaceBoxtreeModeButton"].version = 2;
		EnterPlaceBoxtreeMode();
		globals.placeBoxtreeMode = true;
	}
}

function EnterPlaceBoxtreeMode()
{
	PushUnder("LD", PlaceBoxtree);
}

function ExitPlaceBoxtreeMode()
{
	PopUnder("LD");
}

function SetTreeSlot(tree, slot)
{
	tree.obj = slot; // change 'obj' to 'slot', of course
	
	tree.nameslot = MakeSlot(tree, "nameslot", slot["[name]"]);
	tree.nameslot.react = ChangeName;
	
	SetCellSlot(tree.header, tree.nameslot);
}

function PlaceBoxtree()
{
	var frame = globals.canvas;
	
	var dataName = "Obj" + (globals.objcounts.obj++).toString();
	var slot = MakeSlot(frame, dataName, null);
	frame[dataName] = slot;
	
	var shapeName = "Tree" + (globals.objcounts.tree++).toString();
	var tree = MakeBoxtree(frame, shapeName);
	
	tree.header = MakeCell(tree, "header");
	
	SetTreeSlot(tree, slot);
	
	// but this should be the twig?
	//slot.bud = MakeSlot(slot, "bud", "foo");
	//slot.children = MakeList(slot, "children");
	
	tree.makeTwig = MakeBoxtreeTwig;
	GenerateBoxtreeTwigs(tree);
	
	// to maintain sharp edges, the cx and cy of the root must be on a 0.5, and the width and height of leaves must both be odd
	MoveBox(tree.root.cell, "cx", "width", Get(globals.mx) + 0.5);
	MoveBox(tree.root.cell, "cy", "height", Get(globals.my) + 0.5);
	
	tree.position(tree);
	
	globals.redraw = true;
}

function RedisplayGramCell(cell)
{
	var s = Get(cell.slot); // this must return a string
	
	var textInvisible;
	
	// this is a hack way to determine the cell's twig, which we need in order to change the hori/vert orientation to reflect the Rec/Alt/Opt/Seq value
	var boxtree = cell.container;
	var twig = null;
	
	for (var i = 0; i < boxtree.cells.length; i++)
	{
		if (boxtree.cells[i] == cell)
		{
			twig = boxtree.twigs[i];
		}
	}
	
	if (s == "Rec")
	{
		twig.ori = "h";
		cell.stroke = "rgb(255,0,0)";
		textInvisible = true;
	}
	else if (s == "Alt")
	{
		twig.ori = "v";
		cell.stroke = "rgb(255,150,0)";
		textInvisible = true;
	}
	else if (s == "Opt")
	{
		twig.ori = "h";
		cell.stroke = "rgb(0,150,0)";
		textInvisible = true;
	}
	else if (s == "Seq")
	{
		twig.ori = "h";
		cell.stroke = "rgb(0,0,0)";
		textInvisible = true;
	}
	else
	{
		// to maintain sharp edges, the cx and cy of the root must be on a 0.5, and the width and height of leaves must both be odd
		MoveBox(cell, "width", "cx", 63);
		MoveBox(cell, "height", "cy", 19);
		cell.stroke = "rgb(150,150,150)";
		textInvisible = false;
	}
	
	if (textInvisible)
	{
		cell.string = "";
	}
	else
	{
		cell.string = s;
	}
	
	RegenerateChars(cell);
}

function SetTwigDim(twig)
{
	if (twig.children.length == 0)
	{
		// we assume the width and height of twig.cell have already been set
	}
	else
	{
		if (twig.ori == "h")
		{
			var sum = 0;
			var max = 0;
			
			sum += 5;
			
			for (var i = 0; i < twig.children.length; i++)
			{
				var child = twig.children[i];
				SetTwigDim(child);
				sum += Get(child.cell.width) + 5;
				
				var childHeight = Get(child.cell.height);
				
				if (childHeight > max)
				{
					max = childHeight;
				}
			}
			
			var height = 5 + max + 5;
			
			MoveBox(twig.cell, "width", "cx", sum);
			MoveBox(twig.cell, "height", "cy", height);
		}
		else if (twig.ori == "v")
		{
			var sum = 0;
			var max = 0;
			
			sum += 5;
			
			for (var i = 0; i < twig.children.length; i++)
			{
				var child = twig.children[i];
				SetTwigDim(child);
				sum += Get(child.cell.height) + 5;
				
				var childWidth = Get(child.cell.width);
				
				if (childWidth > max)
				{
					max = childWidth;
				}
			}
			
			var width = 5 + max + 5;
			
			MoveBox(twig.cell, "width", "cx", width);
			MoveBox(twig.cell, "height", "cy", sum);
		}
		else
		{
			throw new Error();
		}
	}
}

function SetTwigPos(twig)
{
	if (twig.ori == "h")
	{
		var left = Get(twig.cell.left) + 5;
		
		for (var i = 0; i < twig.children.length; i++)
		{
			var child = twig.children[i];
			
			MoveBox(child.cell, "left", "width", left);
			MoveBox(child.cell, "cy", "height", Get(twig.cell.cy));
			
			left += Get(child.cell.width) + 5;
			
			SetTwigPos(child);
		}
	}
	else if (twig.ori == "v")
	{
		var top = Get(twig.cell.top) + 5;
		
		for (var i = 0; i < twig.children.length; i++)
		{
			var child = twig.children[i];
			
			MoveBox(child.cell, "top", "height", top);
			MoveBox(child.cell, "cx", "width", Get(twig.cell.cx));
			
			top += Get(child.cell.height) + 5;
			
			SetTwigPos(child);
		}
	}
	else
	{
		throw new Error();
	}
}

