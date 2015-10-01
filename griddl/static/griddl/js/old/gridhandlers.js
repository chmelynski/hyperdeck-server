
function MoveActiveUp() // Up
{
	var grid = globals.focussed;
	
	if (grid.cursor.row > 0)
	{
		grid.cursor.row--;
		SelectNewActive(grid);
	}
}

function MoveActiveDown() // Down
{
	var grid = globals.focussed;
	
	if (grid.cursor.row < grid.nRows - 1)
	{
		grid.cursor.row++;
		SelectNewActive(grid);
	}
}

function MoveActiveRight() // Right
{
	var grid = globals.focussed;
	
	if (grid.cursor.col < grid.nCols - 1)
	{
		grid.cursor.col++;
		SelectNewActive(grid);
	}
}

function MoveActiveLeft() // Left
{
	var grid = globals.focussed;
	
	if (grid.cursor.col > 0)
	{
		grid.cursor.col--;
		SelectNewActive(grid);
	}
}

function MoveActiveAllTheWayUp() // Ctrl+Up
{
	var grid = globals.focussed;
	
	grid.cursor.row = 0;
	SelectNewActive(grid);
}

function MoveActiveAllTheWayDown() // Ctrl+Down
{
	var grid = globals.focussed;
	
	grid.cursor.row = grid.nRows - 1;
	SelectNewActive(grid);
}

function MoveActiveAllTheWayRight() // Ctrl+Right
{
	var grid = globals.focussed;
	
	grid.cursor.col = grid.nCols - 1;
	SelectNewActive(grid);
}

function MoveActiveAllTheWayLeft() // Ctrl+Left
{
	var grid = globals.focussed;
	
	grid.cursor.col = 0;
	SelectNewActive(grid);
}

function ExtendSelectionUp() // Shift+Up
{
	var grid = globals.focussed;
	
	if (grid.cursor.row > 0)
	{
		grid.cursor.row--;
		SelectRange();
	}
}

function ExtendSelectionDown() // Shift+Down
{
	var grid = globals.focussed;
	
	if (grid.cursor.row < grid.nRows - 1)
	{
		grid.cursor.row++;
		SelectRange();
	}
}

function ExtendSelectionRight() // Shift+Right
{
	var grid = globals.focussed;
	
	if (grid.cursor.col < grid.nCols - 1)
	{
		grid.cursor.col++;
		SelectRange();
	}
}

function ExtendSelectionLeft() // Shift+Left
{
	var grid = globals.focussed;
	
	if (grid.cursor.col > 0)
	{
		grid.cursor.col--;
		SelectRange();
	}
}

function ExtendSelectionAllTheWayUp() // Ctrl+Shift+Up
{
	var grid = globals.focussed;
	
	grid.cursor.row = 0;
	
	SelectRange();
}

function ExtendSelectionAllTheWayDown() // Ctrl+Shift+Down
{
	var grid = globals.focussed;
	
	grid.cursor.row = grid.nRows - 1;
	
	SelectRange();
}

function ExtendSelectionAllTheWayRight() // Ctrl+Shift+Right
{
	var grid = globals.focussed;
	
	grid.cursor.col = grid.nCols - 1;
	
	SelectRange();
}

function ExtendSelectionAllTheWayLeft() // Ctrl+Shift+Left
{
	var grid = globals.focussed;
	
	grid.cursor.col = 0;
	
	SelectRange();
}

function SelectWholeCol() // Ctrl+Spacebar
{
	var grid = globals.focussed;
	var selected = grid.focusSelected;
	
	selected.minRow = 0;
	selected.maxRow = grid.nRows - 1;
	
	globals.redraw = true;
}

function SelectWholeRow() // Shift+Spacebar
{
	var grid = globals.focussed;
	var selected = grid.focusSelected;
	
	selected.minCol = 0;
	selected.maxCol = grid.nCols - 1;
	
	globals.redraw = true;
}

function SelectWholeGrid() // Shift+Ctrl+Spacebar (this is different than Excel)
{
	var grid = globals.focussed;
	var selected = grid.focusSelected;
	
	selected.minRow = 0;
	selected.maxRow = grid.nRows - 1;
	selected.minCol = 0;
	selected.maxCol = grid.nCols - 1;
	
	globals.redraw = true;
}

function SelectNewActive(grid)
{
	grid.anchor.row = grid.cursor.row;
	grid.anchor.col = grid.cursor.col;
	
	if (grid.focusSelected == grid.selected[0])
	{
		SelectThis(grid.GetCell(grid.cursor.row, grid.cursor.col));
	}
	
	var selected = grid.focusSelected;
	
	selected.minCol = grid.cursor.col;
	selected.maxCol = grid.cursor.col;
	selected.minRow = grid.cursor.row;
	selected.maxRow = grid.cursor.row;
	
	if (grid.focusSelected.mode == "Point")
	{
		var cell = globals.beingEdited;
		
		if (cell.prepoint && cell.prepoint != cell.cursor) // if we have a current point string, delete it (it will be immediately regenerated below)
		{
			cell.string = cell.string.substr(0, cell.prepoint + 1);
			cell.cursor = cell.prepoint;
			RegenerateChars(cell);
			ResetCursor();
		}
		
		cell.prepoint = cell.cursor;
		
		var str = "";
		str += Get(grid.nameslot);
		str += ".";
		
		if (grid.rowsAre == "objs")
		{
			str += Get(grid.objnameslots[grid.cursor.row - 1]);
			str += ".";
			str += Get(grid.fldnameslots[grid.cursor.col - 1]);
		}
		else
		{
			str += Get(grid.objnameslots[grid.cursor.col - 1]);
			str += ".";
			str += Get(grid.fldnameslots[grid.cursor.row - 1]);
		}
		
		AddText(str);
		
		// color the text?
	}
	
	globals.redraw = true;
}

function SelectRange()
{
	var grid = globals.focussed;
	var selected = grid.focusSelected;
	
	selected.minCol = Math.min(grid.anchor.col, grid.cursor.col);
	selected.maxCol = Math.max(grid.anchor.col, grid.cursor.col);
	selected.minRow = Math.min(grid.anchor.row, grid.cursor.row);
	selected.maxRow = Math.max(grid.anchor.row, grid.cursor.row);
	
	globals.redraw = true;
}

function InsertRows()
{
	var grid = globals.focussed;
	
	var minRow = grid.selected[0].minRow;
	var maxRow = grid.selected[0].maxRow;
	var nNewRows = maxRow - minRow + 1;
	
	if (minRow == 0) { return; } // it makes no sense to add a new header
	
	// to be filled by InsertObjs/InsertFlds - to be used by the code that inserts cells below
	var newnameslots = [];
	var newdataslots = []; // we want Slot[row][col] when it is returned from InsertObjs/InsertFlds
	
	if (grid.rowsAre == "objs")
	{
		InsertObjs(grid, minRow, maxRow, newnameslots, newdataslots);
	}
	else
	{
		InsertFlds(grid, minRow, maxRow, newnameslots, newdataslots);
	}
	
	// cells
	for (var i = maxRow; i >= minRow; i--) // reversed so that earlier InsertAt's don't interfere with later ones
	{
		for (var j = grid.nCols - 1; j >= 0; j--) // reversed so that earlier InsertAt's don't interfere with later ones
		{
			var index = j * grid.nRows + i; // see 'cell numbering in InsertRows.png' for an explanation
			var cell = MakeCell(grid.cells, null);
			
			if (j == 0)
			{
				SetCellSlot(cell, newnameslots[i - minRow]);
			}
			else
			{
				SetCellSlot(cell, newdataslots[i - minRow][j - 1]); // the form required here is newdataslots[row][col].  we are obj/fld-agnostic here
			}
			
			CopyStyle(grid.cells[index], cell); // grid.cells[index] right now refers to the cell this cell will be replacing
			InsertAt(cell, grid.cells, index); // all cells' [name] changed below in PostInsertDelete()
		}
	}
	
	// rowSizes, ys, nRows
	var newRowSizeSlots = [];
	for (var i = 0; i < nNewRows; i++) { newRowSizeSlots.push(MakeSlot(null, null, Get(grid.rowSizes[minRow + i]))); }
	InsertObjsIntoList(grid.rowSizes, newRowSizeSlots, minRow);
	var newYsSlots = [];
	for (var i = 0; i < nNewRows; i++) { newYsSlots.push(MakeSlot(null, null, 0)); }
	InsertObjsIntoList(grid.ys, newYsSlots, minRow);
	for (var i = minRow; i < grid.ys.length; i++) { Set(grid.ys[i], Get(grid.ys[i - 1]) + Get(grid.rowSizes[i - 1])); }
	grid.nRows += nNewRows;
	
	PostInsertDelete(grid);
}

function InsertCols()
{
	var grid = globals.focussed;
	
	var minCol = grid.selected[0].minCol;
	var maxCol = grid.selected[0].maxCol;
	var nNewCols = maxCol - minCol + 1;
	
	if (minCol == 0) { return; } // it makes no sense to add a new header
	
	// to be filled by InsertObjs/InsertFlds - to be used by the code that inserts cells below
	var newnameslots = [];
	var newdataslots = []; // we want Slot[row][col] when it is returned from InsertObjs/InsertFlds
	
	if (grid.rowsAre == "objs")
	{
		InsertFlds(grid, minCol, maxCol, newnameslots, newdataslots);
	}
	else
	{
		InsertObjs(grid, minCol, maxCol, newnameslots, newdataslots);
	}
	
	// cells (to do: revise to cols)
	for (var j = maxCol; j >= minCol; j--) // reversed so that earlier InsertAt's don't interfere with later ones
	{
		for (var i = grid.nRows - 1; i >= 0; i--) // reversed so that earlier InsertAt's don't interfere with later ones
		{
			var index = j * grid.nRows + i; // see 'cell numbering in InsertRows.png' for an explanation
			var cell = MakeCell(grid.cells, null);
			
			if (i == 0)
			{
				SetCellSlot(cell, newnameslots[j - minCol]);
			}
			else
			{
				SetCellSlot(cell, newdataslots[i - 1][j - minCol]); // structural difference from InsertRows - the indices are reversed
			}
			
			CopyStyle(grid.cells[index], cell); // grid.cells[index] right now refers to the cell this cell will be replacing
			InsertAt(cell, grid.cells, index); // all cells' [name] changed below in PostInsertDelete()
		}
	}
	
	// colSizes, xs, nCols
	var newColSizeSlots = [];
	for (var j = 0; j < nNewCols; j++) { newColSizeSlots.push(MakeSlot(null, null, Get(grid.colSizes[minCol + j]))); }
	InsertObjsIntoList(grid.colSizes, newColSizeSlots, minCol);
	var newXsSlots = [];
	for (var j = 0; j < nNewCols; j++) { newXsSlots.push(MakeSlot(null, null, 0)); }
	InsertObjsIntoList(grid.xs, newXsSlots, minCol);
	for (var j = minCol; j < grid.xs.length; j++) { Set(grid.xs[j], Get(grid.xs[j - 1]) + Get(grid.colSizes[j - 1])); }
	grid.nCols += nNewCols;
	
	PostInsertDelete(grid);
}

function InsertObjs(grid, min, max, newnameslots, newdataslots)
{
	var data = Get(grid.obj);
	var nameslots = [];
	var obj = null;
	
	for (var i = min; i <= max; i++)
	{
		var name = Nonce(data, "_");
		var slot = MakeSlot(data, name, null);
		data[name] = slot;
		obj = MakeObj(slot, "$");
		slot.$ = obj;
		
		var newdataslotsublist = [];
		
		for (var j = 0; j < grid.flds.length; j++)
		{
			var dataslot = MakeSlot(obj, grid.flds[j], null);
			obj[grid.flds[j]] = dataslot;
			newdataslotsublist.push(dataslot);
		}
		
		newdataslots.push(newdataslotsublist);
		
		var nameslot = MakeSlot(null, null, name);
		nameslots.push(nameslot);
		newnameslots.push(nameslot);
		
		InsertAt(name, grid.objs, min);
	}
	
	InsertObjsIntoList(grid.objnameslots, nameslots, min);
}

function InsertFlds(grid, min, max, newnameslots, newdataslots)
{
	//// add a new field to each object
	//
	//grid.flds = EnumLetter(grid.flds.length + 1); // regenerate the fields as a whole - use EnumLetter if appropriate
	//grid.rows = grid.flds;
	//
	//for (var j = 0; j < grid.objs.length; j++)
	//{
	//	for (var k = grid.flds.length - 1; k > row; k--)
	//	{
	//		data[grid.objs[j]][grid.flds[k]] = data[grid.objs[j]][grid.flds[k - 1]]; // copy the existing fields to a one-greater index
	//	}
	//}
	//
	//for (var j = 0; j < grid.objs.length; j++)
	//{
	//	data[grid.objs[j]][grid.flds[row]] = MakeSlot(data[grid.objs[j]], grid.flds[row], null); // and finally add a new field to each object
	//}
}

function DeleteRows()
{
	if (grid.rowsAre == "objs")
	{
		DeleteObjs();
	}
	else
	{
		DeleteFlds();
	}
}

function DeleteCols()
{
	if (grid.rowsAre == "objs")
	{
		DeleteFlds();
	}
	else
	{
		DeleteObjs();
	}
}

function DeleteObjs(names)
{
	var grid = globals.focussed;
	var data = Get(grid.obj);
	
	delete data[name];
	
	// also perhaps delete the proper objnameslot
}

function DeleteFlds(names)
{
	var grid = globals.focussed;
	var data = Get(grid.obj);
	
	for (var i = 0; i < grid.objs.length; i++)
	{
		var objname = grid.objs[i];
		var obj = data[objname];
		delete obj[name];
	}
	
	// also perhaps delete the proper fldnameslot
}

function PostInsertDelete(grid)
{
	var c = 0;
	
	// rename and renumber all cells
	for (var i = 0; i < grid.nRows; i++)
	{
		for (var j = 0; j < grid.nCols; j++)
		{
			var cell = grid.GetCell(i, j);
			cell.container = grid;
			cell.row = i;
			cell.col = j;
			cell["[name]"] = c.toString(); // can we name cells [i,j]? - but then that's how we'd have to index them
			cell.redisplay(cell);
			c++;
		}
	}
	
	grid.position(grid);
	globals.redraw = true;
}

function Swap()
{

}

function CopyStyle(srcCell, dstCell)
{
	dstCell.fill = srcCell.fill;
	dstCell.stroke = srcCell.stroke;
}

