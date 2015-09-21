
function SelectParent() // Up
{
	if (globals.selectedRootShape.parent)
	{
		globals.selectedRootShape.contents.deselect(globals.selectedRootShape.contents);
		globals.selectedRootShape = globals.selectedRootShape.parent;
		globals.selectedRootShape.contents.onselect(globals.selectedRootShape.contents);
		globals.selected = globals.selectedRootShape.contents;
		globals.redraw = true;
	}
}

function SelectFirstChild() // Down
{
	// down should just be depth-first traversal - that way it makes sense in the context of an indentree
	// of course, up can't really be reverse traversal, because selecting parent is too strong of a match to the mental model
	
	if (globals.selectedRootShape.children.length > 0)
	{
		globals.selectedRootShape.contents.deselect(globals.selectedRootShape.contents);
		globals.selectedRootShape = globals.selectedRootShape.children[0];
		globals.selectedRootShape.contents.onselect(globals.selectedRootShape.contents);
		globals.selected = globals.selectedRootShape.contents;
		globals.redraw = true;
	}
}

function SelectPrevSibling() // Left
{
	if (globals.selectedRootShape.parent)
	{
		var birth = globals.selectedRootShape.parent.children.indexOf(globals.selectedRootShape);
		
		if (birth > 0)
		{
			globals.selectedRootShape.contents.deselect(globals.selectedRootShape.contents);
			globals.selectedRootShape = globals.selectedRootShape.parent.children[birth - 1];
			globals.selectedRootShape.contents.onselect(globals.selectedRootShape.contents);
			globals.selected = globals.selectedRootShape.contents;
			globals.redraw = true;
		}
	}
}

function SelectNextSibling() // Right
{
	if (globals.selectedRootShape.parent)
	{
		var birth = globals.selectedRootShape.parent.children.indexOf(globals.selectedRootShape);
		
		if (birth < globals.selectedRootShape.parent.children.length - 1)
		{
			globals.selectedRootShape.contents.deselect(globals.selectedRootShape.contents);
			globals.selectedRootShape = globals.selectedRootShape.parent.children[birth + 1];
			globals.selectedRootShape.contents.onselect(globals.selectedRootShape.contents);
			globals.selected = globals.selectedRootShape.contents;
			globals.redraw = true;
		}
	}
}

function SelectRoot() // Ctrl+Up
{
	var focus = globals.selectedRootShape;
	
	while (focus.parent)
	{
		focus = focus.parent;
	}
	
	globals.selectedRootShape.contents.deselect(globals.selectedRootShape.contents);
	globals.selectedRootShape = focus;
	globals.selectedRootShape.contents.onselect(globals.selectedRootShape.contents);
	globals.selected = globals.selectedRootShape.contents;
	globals.redraw = true;
}

function SelectFirstSibling() // Ctrl+Left
{
	if (globals.selectedRootShape.parent)
	{
		globals.selectedRootShape.contents.deselect(globals.selectedRootShape.contents);
		globals.selectedRootShape = globals.selectedRootShape.parent.children[0];
		globals.selectedRootShape.contents.onselect(globals.selectedRootShape.contents);
		globals.selected = globals.selectedRootShape.contents;
		globals.redraw = true;
	}
}

function SelectLastSibling() // Ctrl+Right
{
	if (globals.selectedRootShape.parent)
	{
		globals.selectedRootShape.contents.deselect(globals.selectedRootShape.contents);
		globals.selectedRootShape = globals.selectedRootShape.parent.children[globals.selectedRootShape.parent.children.length - 1];
		globals.selectedRootShape.contents.onselect(globals.selectedRootShape.contents);
		globals.selected = globals.selectedRootShape.contents;
		globals.redraw = true;
	}
}

function SelectYoungest() // Ctrl+Down
{
	var focus = globals.selectedRootShape;
	
	while (focus.children.length > 0)
	{
		focus = focus.children[0];
	}
	
	globals.selectedRootShape.contents.deselect(globals.selectedRootShape.contents);
	globals.selectedRootShape = focus;
	globals.selectedRootShape.contents.onselect(globals.selectedRootShape.contents);
	globals.selected = globals.selectedRootShape.contents;
	globals.redraw = true;
}

function AddParent() // Alt+Up
{

}

function AddLastChild() // Alt+Down
{
	var content = globals.selected; // the cell is what is selected, not the twig
	var twig = content["[parent]"];
	var tree = twig["[parent]"]["[parent]"];
	
	var data = twig.data;
	
	var twigChildren = twig.children;
	var dataChildren = data[tree.childrenField];
	
	var dataChild = MakeObj(dataChildren, dataChildren.length.toString());
	dataChild[tree.budField] = MakeSlot(dataChild, tree.budField, "");
	dataChild[tree.childrenField] = MakeList(dataChild, tree.childrenField);
	
	var twigChild = tree.makeTwig(tree, twig, dataChild);

	twig.children.push(twigChild);
	data.children.push(dataChild);
	
	twigChild.parent = twig;
	dataChild.parent = data; // necessary?
	
	twigChild.data = dataChild;
	twigChild.children = MakeList(twigChild, "children");
	twigChild.cell = DisplaySlotAsCell(twigChild, "cell", dataChild[tree.budField]);
	
	var cell = twigChild.cell;
	
	cell.redisplay = tree.root.cell.redisplay;
	cell.container = content.container; // this is just 'tree', right? - also, order matters - redisplay might depend on the container (as RedisplayGramCell does)
	cell.redisplay(cell);
	
	GenerateFlatListsFromRootTwig(tree);
	
	tree.position(tree);
	
	globals.redraw = true;
}

function AddPrevSibling() // Alt+Left
{

}

function AddNextSibling() // Alt+Right
{

}

function DeleteTwig() // Delete
{
	// delete the selected twig and all its descendants
}

function DeleteSingle()
{
	// if the twig has only one child, we can just delete the twig
}

