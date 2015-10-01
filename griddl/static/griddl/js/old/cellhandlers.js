
function GetAffectedCells() // this can be used for all sorts of cell formatting functions
{
	var cell = globals.selected;
	
	var cells = [];
	
	var type = cell.container["[type]"];
	
	if (type == "Grid")
	{
		var grid = cell.container;
		
		for (var k = 0; k < grid.selected.length; k++)
		{
			if (grid.selected[k].mode == "Select")
			{
				var selection = grid.selected[k];
				
				for (var j = selection.minCol; j <= selection.maxCol; j++)
				{
					for (var i = selection.minRow; i <= selection.maxRow; i++)
					{
						cells.push(grid.cells[j * grid.nRows + i]);
					}
				}
			}
		}
	}
	else if (type == "Rootree" || type == "Indentree" || type == "Boxtree")
	{
		cells.push(cell); // for now
		
		// push selection, if a whole subtree is selected
		
		// (the only two selection options for a tree are a single cell or a whole subtree)
	}
	else
	{
		cells.push(cell); // for now
	}
	
	return cells;
}

function AddDecimalPlace()
{
	var cells = GetAffectedCells();
	
	for (var i = 0; i < cells.length; i++)
	{
		var cell = cells[i];
		Set(cell.numberFormat, Get(cell.numberFormat) + 1);
		cell.redisplay(cell);
		cell.position(cell);
		globals.redraw = true;
	}
}

function RemDecimalPlace()
{
	var cells = GetAffectedCells();
	
	for (var i = 0; i < cells.length; i++)
	{
		var cell = cells[i];
		Set(cell.numberFormat, Get(cell.numberFormat) - 1);
		cell.redisplay(cell);
		cell.position(cell);
		globals.redraw = true;
	}
}

