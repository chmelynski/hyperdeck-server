
function MakeIndentree(parent, name)
{
	var tree = MakeObj(parent, name);
	parent[name] = tree;
	tree["[type]"] = "Indentree";
	tree.cells = MakeList(tree, "cells");
	tree.twigs = MakeList(tree, "twigs");
	tree.indents = MakeList(tree, "indents");
	tree.root = null;
	tree.obj = null;
	tree.budField = "bud";
	tree.childrenField = "children";
	tree.generateTwigs = GenerateIndentreeTwigs;
	tree.position = PositionIndentree;
	tree.draw = DrawIndentreeHtml;
	//tree.draw = DrawIndentree;
	//tree.over = OverContents;
	//tree.onfocus = OnFocusTree;
	//tree.defocus = DeFocusTree;
	tree.editActive = EditSelectedSetTreeShape;
	
	tree.gap = MakeSlot(tree, "gap", 0);
	tree.indentStep = MakeSlot(tree, "indentStep", 10);
	
	return tree;
}

function MakeIndentreeTwig(tree, parentTwig, data)
{
	var twig = MakeObj(tree.twigs, tree.twigs.length.toString()); // when children are inserted, the [parent] and [name] fields will be overwritten by a call to GenerateContents(tree)
	
	twig.data = data;
	twig.hidden = false;
	twig.cell = DisplaySlotAsCell(twig, "cell", Get(data)[tree.budField]);
	// twig.cell = DisplaySlotAsCell(twig, "cell", data); // this gets rid of the budField, and just deals with 'data' as a whole
	twig.parent = parentTwig;
	twig.children = MakeList(twig, "children");
	
	var objChildren = Get(data)[tree.childrenField]; // objChildren must be a list
	
	for (var i = 0; i < objChildren.length; i++)
	{
		var child = MakeIndentreeTwig(tree, twig, objChildren[i]);
		twig.children.push(child);
	}
	
	var cell = twig.cell;
	cell.container = tree; // order matters - cell.redisplay(cell) must be after this - RedisplayGramCell depends on the container
	cell.redisplay = RedisplayCell;
	cell.redisplay(cell);
	
	return twig;
}

function GenerateIndentreeTwigs(tree)
{
	tree.root = MakeIndentreeTwig(tree, null, tree.obj);
	
	GenerateFlatListsFromRootTwig(tree);
}

function PositionIndentree(tree)
{
	var top = Get(tree.root.cell.top);
	var left = Get(tree.root.cell.left);
	
	var indentStep = Get(tree.indentStep);
	var gap = Get(tree.gap);
	
	for (var i = 0; i < tree.cells.length; i++)
	{
		var sub = tree.cells[i];
		var indent = tree.indents[i];
		
		// we assume height is already set.  and width doesn't really matter here
		MoveBox(sub, "top", "height", top);
		MoveBox(sub, "left", "width", left + indent * indentStep);
		
		top += Get(sub.height);
		top += gap;
		
		//sub.position(sub);
	}
}

function DrawIndentree(tree)
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
		DrawActiveBorder("rgb(0,0,0)", Get(sub.left), Get(sub.top), Get(sub.right), Get(sub.bottom)); // this assumes just a cell, not a name-data cell pair - so it might need to change
	}
}

function DrawIndentreeHtml(tree)
{
	var $containerDiv = $(document.createElement('div'));
	$('body').append($containerDiv);
	// $(tree.shapeParent).append($containerDiv);
	
	$containerDiv.draggable();
	$containerDiv.css('font', '11pt Calibri');
	$containerDiv.css('border', '1px solid black');
	$containerDiv.css('overflow', 'scroll');
	$containerDiv.css('padding', '3px');
	$containerDiv.css('top', '100px');
	$containerDiv.css('left', '200px');
	$containerDiv.css('width', '800px');
	$containerDiv.css('height', '400px');
	
	var xInterval = 15;
	var yInterval = 26;
	
	// we use a delegate here so that added buttons will automatically gain the functionality
	$containerDiv.on('click', '.expand', function(event) // this is ToggleExpand
	{
		var $this = $(this);
		var $twigDiv = $this.parent();
		var index = $twigDiv.index(); // this must count hidden twigDivs to work
		var twig = tree.twigs[index];
		
		twig.hidden = !twig.hidden;
		
		for (var i = 0; i < tree.twigs.length; i++)
		{
			var descTwig = tree.twigs[i];
			
			var hidden = false;
			
			var focus = descTwig.parent;
			
			while (focus)
			{
				if (focus.hidden)
				{
					hidden = true;
					break;
				}
				
				focus = focus.parent;
			}
			
			var indexInTree = parseInt(descTwig["[name]"]);
			var $childTwigDiv = $containerDiv.children().eq(indexInTree);
			
			if (hidden)
			{
				$childTwigDiv.hide();
			}
			else
			{
				$childTwigDiv.show();
			}
		}
		
		//var descendants = twig.descendants();
		//
		//for (var i = 0; i < descendants.length; i++)
		//{
		//	var descTwig = descendants[i];
		//	
		//	if (twig.hidden) // this is tricky and may not be correct
		//	{
		//		var indexInTree = parseInt(descTwig["[name]"]);
		//		var $childTwigDiv = $containerDiv.children().eq(indexInTree);
		//		$childTwigDiv.hide();
		//	}
		//	else
		//	{
		//		if (!descTwig.hidden)
		//		{
		//		
		//		}
		//	}
		//}
		
		//for (var i = 0; i < twig.children.length; i++)
		//{
		//	var childIndex = parseInt(twig.children[i]["[name]"]);
		//	var $childTwigDiv = $containerDiv.children().eq(childIndex);
		//	
		//	//$childTwigDiv.toggleClass('visibl');
		//	//$childTwigDiv.toggleClass('hidden');
		//	
		//	//if ($childTwigDiv.hasClass('visibl'))
		//	//{
		//	//	$childTwigDiv.removeClass('visibl');
		//	//	$childTwigDiv.addClass('hidden');
		//	//}
		//	//else
		//	//{
		//	//	$childTwigDiv.removeClass('hidden');
		//	//	$childTwigDiv.addClass('visibl');
		//	//}
		//	
		//	//$childTwigDiv.toggle();
		//}
		
		$this.toggleClass('plus');
		$this.toggleClass('minus');
		
		//if ($this.hasClass('plus'))
		//{
		//	$this.removeClass('plus');
		//	$this.addClass('minus');
		//}
		//else
		//{
		//	$this.removeClass('minus');
		//	$this.addClass('plus');
		//}
	});
	
	for (var i = 0; i < tree.twigs.length; i++)
	{
		var twig = tree.twigs[i];
		
		// we position this relative, because 1. we want them to flow block-style, so that when the twig divs are hid/shown, the layout will automatically reflow
		// we use 'relative' rather than the default 'static' because relative = positioned, which means that child absolutes will recognize this as a parent
		// of course the relative offset is unspecified, hence zero
		// see this if you remain confused - check out the definition of 'positioned element'
		// https://developer.mozilla.org/en-US/docs/Web/CSS/position
		
		var $twigDiv = $(document.createElement('div'));
		$containerDiv.append($twigDiv);
		//$twigDiv.addClass('visibl'); // as opposed to 'hidden'
		$twigDiv.css('position', 'relative'); 
		$twigDiv.css('border', '0px solid green');
		$twigDiv.css('width', '240px');
		$twigDiv.css('height', '25px');
		
		var $expandButtonDiv = $(document.createElement('div'));
		$twigDiv.append($expandButtonDiv);
		$expandButtonDiv.addClass('expand');
		
		if (twig.children.length > 0)
		{
			$expandButtonDiv.addClass(twig.hidden ? 'plus' : 'minus');
		}
		else
		{
			$expandButtonDiv.css('visibility', 'hidden');
		}
		
		$expandButtonDiv.css('position', 'absolute');
		$expandButtonDiv.css('top', '7px');
		$expandButtonDiv.css('left', (10 + tree.indents[i] * xInterval).toString() + 'px');
		
		var $twigContentsDiv = $(document.createElement('div'));
		$twigDiv.append($twigContentsDiv);
		$twigContentsDiv.css('position', 'absolute');
		$twigContentsDiv.css('border', '1px solid black');
		$twigContentsDiv.css('padding-left', '2px');
		$twigContentsDiv.css('top', '1px');
		$twigContentsDiv.css('left', (24 + tree.indents[i] * xInterval).toString() + 'px');
		$twigContentsDiv.css('width', '600px');
		$twigContentsDiv.css('height', '21px');
		
		$twigContentsDiv.html(tree.cells[i].slot.formula);
		// tree.cells[i].string - better
		// tree.cells[i].draw() - better still
		// twig.data
	}
}

function TogglePlaceIndentreeMode()
{
	if (globals.placeIndentreeMode)
	{
		globals.canvas.buttons["TogglePlaceIndentreeModeButton"].version = 0;
		ExitPlaceIndentreeMode();
		globals.placeIndentreeMode = false;
	}
	else
	{
		globals.canvas.buttons["TogglePlaceIndentreeModeButton"].version = 2;
		EnterPlaceIndentreeMode();
		globals.placeIndentreeMode = true;
	}
}

function EnterPlaceIndentreeMode()
{
	PushUnder("LD", PlaceIndentree);
}

function ExitPlaceIndentreeMode()
{
	PopUnder("LD");
}

function PlaceIndentree()
{
	var defaultObjName = "Obj" + globals.id.toString();
	var obj = MakeSlot(globals.canvas, defaultObjName, "");
	globals.canvas[defaultObjName] = obj;
	
	var defaultTreeName = "Tree" + (globals.objcounts.tree++).toString();
	var tree = MakeIndentree(globals.canvas, defaultTreeName);
	
	obj.bud = MakeSlot(obj, "bud", "foo");
	obj.children = MakeList(obj, "children");
	
	tree.makeTwig = MakeIndentreeTwig;
	
	tree.obj = obj;
	GenerateIndentreeTwigs(tree);
	
	MoveBox(tree.root.cell, "cx", "width", Get(globals.mx));
	MoveBox(tree.root.cell, "cy", "height", Get(globals.my));
	
	tree.position(tree);
	
	globals.redraw = true;
}

