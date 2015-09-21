
function MakeGrid(parent, name)
{
	var grid = MakeObj(parent, name);
	parent[name] = grid;
	grid["[type]"] = "Grid";
	
	AddRectSlots(grid);
	
	// this is a stopgap - we want xs and ys to react to changes to left and top
	//grid.left.react = function() { grid.position(grid); };
	//grid.top.react = function() { grid.position(grid); };
	
	grid.onclick = null; // used for moving and row/col resizing (because lines cannot be dehovered easily)
	//grid.dehover = DeHoverGrid; // we don't need an onhover, because OverGrid handles that stuff.  but we do need a dehover to reset the cursor to default
	grid.onfocus = OnFocusGrid;
	grid.defocus = DeFocusGrid;
	//grid.onedit = OnEditGrid;
	//grid.deedit = DeEditGrid;
	//grid.draw = DrawGrid;
	grid.draw = DrawGridHtml;
	//grid.draw = DrawGridSvg;
	//grid.over = OverGrid;
	grid.redisplay = RedisplayGrid;
	grid.position = PositionGrid;
	
	grid.GetCell = function(rowIndex, colIndex) { return this.cells[colIndex * this.nRows + rowIndex]; };
	
	grid.obj = null; // Slot<Obj>
	grid.node = MakeNode(grid, "node", grid);
	grid.act = ProcessGrid; // the grid will have different responses to different messages
	
	grid.nameslot = null; // Slot<string>
	grid.objnameslots = null; // Slot<string>[]
	grid.fldnameslots = null; // Slot<string>[]
	
	grid.rows = null; // string[], excludes headers
	grid.cols = null; // string[], excludes headers
	grid.objs = null; // string[], excludes headers
	grid.flds = null; // string[], excludes headers
	
	grid.selected = null; // {}
	grid.cursor = null; // { row : int , col : int }
	grid.anchor = null; // { row : int , col : int }
	
	grid.rowSizes = null; // Slot<int>[], includes headers
	grid.colSizes = null; // Slot<int>[], includes headers
	grid.xs = null; // Slot<int>[], fencepost with colSizes
	grid.ys = null; // Slot<int>[], fencepost with rowSizes
	
	grid.nRows = null; // int, includes headers
	grid.nCols = null; // int, includes headers
	
	grid.cells = null; // Cell[]
	
	// for endoscrolling
	grid.scrollbars = MakeList(grid, "scrollbars");
	grid.rowStartIndex = 0;
	grid.colStartIndex = 0;
	grid.maxRows = Number.POSITIVE_INFINITY;
	grid.maxCols = Number.POSITIVE_INFINITY;
	
	return grid;
}

function SetGridDataSlot(grid, slot)
{
	grid.obj = slot;
	AddEdge(slot.node, grid.node, Nonce(slot, "display"), Edge.Display);
}

function RedisplayObj(grid, index, newobj)
{
	// this is called in response to a change in one of the grid's objs
	// all we have to do is modify the cells in the row/col pertaining to that obj:
	// set the cell slots (remove the old edges), redisplay the cells, and reposition the cells
}

function ReactToFieldSlotChange()
{
	// this should be a .react on the field slot - the signal gets passed to the root data obj and then to all grids that watch (through the edges)
	
	var field = this["[name]"];
	var dataSlot = this["[parent]"]["[parent]"];
	var data = Get(dataSlot);
	var publicKeys = PublicKeys(data);
	var formula = this.formula;
	DistributeFieldFormulas(data, field, formula)
	globals.calculate = true;
}

function DistributeAllFieldFormulas()
{
	var data = Get(this);
	var fieldSlots = this["[fieldSlots]"];
	var fields = PublicKeys(fieldSlots);
	
	for (var i = 0; i < fields.length; i++)
	{
		var field = fields[i];
		var fieldSlot = fieldSlots[field];
		var formula = fieldSlot.formula; // i mean, the formula on the field slot is also the value
		DistributeFieldFormula(data, field, formula);
	}
	
	globals.calculate = true;
}

function DistributeFieldFormula(data, fieldName, formula)
{
	var publicKeys = PublicKeys(data);
	
	for (var i = 0; i < publicKeys.length; i++)
	{
		var key = publicKeys[i];
		var obj = Get(data[key]);
		
		var fieldSlot = null;
		
		if (obj[fieldName] === undefined)
		{
			fieldSlot = MakeSlot(obj, fieldName);
			obj[fieldName] = fieldSlot;
		}
		else
		{
			fieldSlot = obj[fieldName];
		}
		
		fieldSlot.formula = formula;
		CompileFormula(fieldSlot, fieldSlot.formula);
		
		// search for and replace $ with the obj name
		for (var k = 0; k < fieldSlot.code.length; k++)
		{
			var cog = fieldSlot.code[k];
			
			if (cog.type == Machine.Pointer)
			{
				if (cog.name == "%")
				{
					var slot = obj["[parent]"];
					cog.name = slot["[name]"];
				}
			}
		}
	}
}

function RedisplayGrid(grid)
{
	if (globals.logging) { globals.log.push("RedisplayGrid " + grid["[id]"].toString()); }
	
	grid.cursor = MakeObj(grid, "cursor");
	grid.cursor.row = null;
	grid.cursor.col = null;
	grid.anchor = MakeObj(grid, "anchor");
	grid.anchor.row = null;
	grid.anchor.col = null;
	grid.selected = MakeList(grid, "selected");
	grid.selected[0] = MakeObj(grid.selected, "0");
	grid.selected[0].mode = "Select";
	grid.selected[0].color = "rgb(0,0,0)";
	grid.selected[0].shimmer = false;
	grid.selected[0].minCol = null;
	grid.selected[0].maxCol = null;
	grid.selected[0].minRow = null;
	grid.selected[0].maxRow = null;
	grid.focusSelected = grid.selected[0]
	
	grid.objs = MakeList(grid, "objs");
	grid.flds = MakeList(grid, "flds");
	
	var data = Get(grid.obj);
	var keys = null;
	keys = PublicKeys(data);
	for (var i = 0; i < keys.length; i++) { grid.objs.push(keys[i]); }
	var obj = Get(data[grid.objs[0]]);
	keys = PublicKeys(obj);
	for (var i = 0; i < keys.length; i++) { grid.flds.push(keys[i]); }
	
	// GenerateRowAndColLabels ------------------------------
	
	grid.rows = MakeList(grid, "rows");
	grid.cols = MakeList(grid, "cols");
	
	if (grid.rowsAre == "objs")
	{
		grid.nRows = Math.min(grid.objs.length, grid.maxRows) + 1;
		grid.nCols = Math.min(grid.flds.length, grid.maxCols) + 1;
		for (var i = 0; i < grid.nRows - 1; i++) { grid.rows.push(grid.objs[grid.rowStartIndex + i]); }
		for (var j = 0; j < grid.nCols - 1; j++) { grid.cols.push(grid.flds[grid.colStartIndex + j]); }
	}
	else
	{
		grid.nRows = Math.min(grid.flds.length, grid.maxRows) + 1;
		grid.nCols = Math.min(grid.objs.length, grid.maxCols) + 1;
		for (var i = 0; i < grid.nRows - 1; i++) { grid.rows.push(grid.flds[grid.rowStartIndex + i]); }
		for (var j = 0; j < grid.nCols - 1; j++) { grid.cols.push(grid.objs[grid.colStartIndex + j]); }
	}
	
	// ------------------------------
	
	// we regenerate new heights and widths if either this is the first time, or if the number of rows or cols has changed
	// if we regenerate data but the number of rows or cols stays the same, that dimension keeps its measurements
	// widths and heights should be determined automatically - use measureText
	
	if (grid.rowSizes === null || grid.rowSizes.length != grid.nRows)
	{
		grid.rowSizes = MakeList(grid, "rowSizes");
		for (var i = 0; i < grid.nRows; i++) { grid.rowSizes.push(MakeSlot(grid.rowSizes, i.toString(), 20)); }
		grid.ys = MakeList(grid, "ys");
		for (var i = 0; i < grid.nRows + 1; i++) { grid.ys.push(MakeSlot(grid.ys, i.toString(), 20 * i)); }
	}
	
	if (grid.colSizes === null || grid.colSizes.length != grid.nCols)
	{
		grid.colSizes = MakeList(grid, "colSizes");
		for (var j = 0; j < grid.nCols; j++) { grid.colSizes.push(MakeSlot(grid.colSizes, j.toString(), 64)); }
		grid.xs = MakeList(grid, "xs");
		for (var j = 0; j < grid.nCols + 1; j++) { grid.xs.push(MakeSlot(grid.xs, j.toString(), 64 * j)); }
	}
	
	GenerateCells(grid);
	grid.draw(grid);
}

function GenerateCells(grid) // aux to RedisplayGrid
{
	if (globals.logging) { globals.log.push("GenerateCells " + grid["[id]"].toString()); }
	
	// cells = [ Title , Row1 , Row2 , Row3 , Col1, A1 , A2 , A3 , Col2 , B1 , B2 , B3 ] - col first, then row
	grid.cells = new Array(grid.nCols * grid.nRows);
	AddBracketFields(grid.cells, grid, "cells"); // in lieu of MakeObj or MakeList
	
	//var rowscols = "rows"; // "rows" or "cols"
	//var rowcolLabelCells = "rowLabelCells"; // "rowLabelCells" or "colLabelCells"
	//var syn = "row"; // "row" or "col"
	//var ant = "col"; // "row" or "col"
	
	var titleCellFill = "rgb(208,216,217)";
	var objLabelCellFill = "rgb(255,200,200)";
	var fldLabelCellFill = "rgb(208,246,117)";
	var dataCellFill = "rgb(255,255,255)";
	//var titleCellFill = "rgb(208,216,227)";
	//var objLabelCellFill = "rgb(218,226,237)";
	//var fldLabelCellFill = "rgb(228,236,247)";
	var selectedFill = "rgb(255,213,141)";
	
	//var titleCellFill = "rgb(228,226,217)";
	//var objLabelCellFill = "rgb(248,206,217)";
	//var fldLabelCellFill = "rgb(208,246,217)";
	
	var dataSlot = grid.obj;
	var data = Get(dataSlot);
	
	grid.nameslot = MakeSlot(grid, "nameslot", dataSlot["[name]"]);
	grid.nameslot.react = ChangeName;
	grid.objnameslots = MakeList(grid, "objnameslots");
	grid.fldnameslots = MakeList(grid, "fldnameslots");
	
	for (var i = 0; i < grid.objs.length; i++)
	{
		var slot = MakeSlot(grid.objnameslots, i.toString(), grid.objs[i]);
		grid.objnameslots.push(slot);
		slot.react = ChangeName;
	}
	
	for (var i = 0; i < grid.flds.length; i++)
	{
		var slot = MakeSlot(grid.fldnameslots, i.toString(), grid.flds[i]);
		grid.fldnameslots.push(slot);
		slot.react = ChangeName;
	}
	
	for (var i = 0; i < grid.flds.length; i++)
	{
		var field = grid.flds[i];
		
		if (!dataSlot["[fieldSlots]"][field])
		{
			var slot = MakeSlot(dataSlot["[fieldSlots]"], field, null);
			dataSlot["[fieldSlots]"][field] = slot;
			slot.react = ReactToFieldSlotChange; // this is all well and good, but what if we add fieldslots after the fact?  it's hard to assign the .react in Eval
		}
	}
	
	var c = 0;
	
	for (var j = 0; j < grid.nCols; j++)
	{
		for (var i = 0; i < grid.nRows; i++)
		{
			var cell = MakeCell(grid.cells, c.toString());
			grid.cells[c++] = cell;
			cell.container = grid;
			cell.row = i;
			cell.col = j;
			cell.stroke = null;
			
			var slot = null;
			
			// the pointer directs the output of the cell formula to the slot
			
			if (i == 0 && j == 0)
			{
				slot = grid.nameslot;
				cell.fill = titleCellFill;
			}
			else if (i == 0) // col labels
			{
				if (grid.rowsAre == "objs")
				{
					slot = grid.fldnameslots[j - 1];
					cell.fill = fldLabelCellFill;
				}
				else
				{
					slot = grid.objnameslots[j - 1];
					cell.fill = objLabelCellFill;
				}
			}
			else if (j == 0) // row labels
			{
				if (grid.rowsAre == "objs")
				{
					slot = grid.objnameslots[i - 1];
					cell.fill = objLabelCellFill;
				}
				else
				{
					slot = grid.fldnameslots[i - 1];
					cell.fill = fldLabelCellFill;
				}
			}
			else
			{
				if (grid.rowsAre == "objs")
				{
					slot = Get(data[grid.objs[i - 1]])[grid.flds[j - 1]];
				}
				else
				{
					slot = Get(data[grid.objs[j - 1]])[grid.flds[i - 1]];
				}
				
				cell.fill = dataCellFill;
			}
			
			SetCellSlot(cell, slot);
		}
	}
}

function PositionGrid(grid)
{
	if (globals.logging) { globals.log.push("PositionGrid " + grid["[id]"].toString()); }
	
	var x = Get(grid.left);
	var y = Get(grid.top);
	
	grid.xs[0].$ = x;
	grid.ys[0].$ = y;
	for (var i = 0; i < grid.nRows; i++) { grid.ys[i + 1].$ = Get(grid.ys[i]) + Get(grid.rowSizes[i]); }
	for (var j = 0; j < grid.nCols; j++) { grid.xs[j + 1].$ = Get(grid.xs[j]) + Get(grid.colSizes[j]); }
	
	for (var i = 0; i < grid.nRows; i++)
	{
		for (var j = 0; j < grid.nCols; j++)
		{
			var cell = grid.GetCell(i, j);
			MoveBox(cell, "width", "left", Get(grid.colSizes[j]));
			MoveBox(cell, "height", "top", Get(grid.rowSizes[i]));
			MoveBox(cell, "left", "width", Get(grid.xs[j]));
			MoveBox(cell, "top", "height", Get(grid.ys[i]));
			//cell.position(cell);
		}
	}
	
	MoveBox(grid, "right", "left", Get(grid.xs[grid.nCols]));
	MoveBox(grid, "bottom", "top", Get(grid.ys[grid.nRows]));
}

function DrawGrid(grid)
{
	if (globals.logging) { globals.log.push("DrawGrid " + grid["[id]"].toString()); }
	
	// draw cells - the cells draw their fill only - the grid itself handles strokes and the selection box
	for (var i = 0; i < grid.cells.length; i++)
	{
		var cell = grid.cells[i];
		cell.draw(cell);
	}
	
	// draw normal strokes
	
	var labelCellStroke = "rgb(158,182,206)";
	var normalStroke = "rgb(208,215,229)";
	
	var x0 = Get(grid.xs[0]);
	var x1 = Get(grid.xs[1]);
	var y0 = Get(grid.ys[0]);
	var y1 = Get(grid.ys[1]);
	
	var lf = Get(grid.left);
	var rt = Get(grid.right);
	var tp = Get(grid.top);
	var bt = Get(grid.bottom);
	
	var g = globals.g;
	
	// long strokes
	for (var i = 0; i < grid.ys.length; i++)
	{
		var y = Get(grid.ys[i]);
		g.lineWidth = 1;
		g.strokeStyle = i < 2 ? labelCellStroke : normalStroke;
		g.beginPath();
		g.moveTo(lf - 0.5, y - 0.5);
		g.lineTo(rt, y - 0.5);
		g.stroke();
	}
	
	// short label cell strokes
	for (var i = 0; i < grid.ys.length; i++)
	{
		var y = Get(grid.ys[i]);
		g.lineWidth = 1;
		g.strokeStyle = labelCellStroke;
		g.beginPath();
		g.moveTo(x0 - 0.5, y - 0.5);
		g.lineTo(x1, y - 0.5);
		g.stroke();
	}
	
	// long strokes
	for (var i = 0; i < grid.xs.length; i++)
	{
		var x = Get(grid.xs[i]);
		g.lineWidth = 1;
		g.strokeStyle = i < 2 ? labelCellStroke : normalStroke;
		g.beginPath();
		g.moveTo(x - 0.5, tp - 0.5);
		g.lineTo(x - 0.5, bt);
		g.stroke();
	}
	
	// short label cell strokes
	for (var i = 0; i < grid.xs.length; i++)
	{
		var x = Get(grid.xs[i]);
		g.lineWidth = 1;
		g.strokeStyle = labelCellStroke;
		g.beginPath();
		g.moveTo(x - 0.5, y0 - 0.5);
		g.lineTo(x - 0.5, y1);
		g.stroke();
	}
	
	
	// draw selected strokes
	
	var selectedStroke = "rgb(242,149,54)";
	
	if (grid.selected.minRow > 0) // so that the selection indicator is not drawn on the title cell when a col label is selected
	{
		for (var i = grid.selected.minRow; i <= grid.selected.maxRow + 1; i++)
		{
			var y = Get(grid.ys[i]);
			g.lineWidth = 1;
			g.strokeStyle = selectedStroke;
			g.beginPath();
			g.moveTo(x0 - 0.5, y - 0.5);
			g.lineTo(x1, y - 0.5);
			g.stroke();
		}
		
		var sy0 = Get(grid.ys[grid.selected.minRow]);
		var sy1 = Get(grid.ys[grid.selected.maxRow + 1]);
		
		g.lineWidth = 1;
		g.strokeStyle = selectedStroke;
		
		g.beginPath();
		g.moveTo(x0 - 0.5, sy0 - 0.5);
		g.lineTo(x0 - 0.5, sy1);
		g.stroke();
		
		g.beginPath();
		g.moveTo(x1 - 0.5, sy0 - 0.5);
		g.lineTo(x1 - 0.5, sy1);
		g.stroke();
	}
	
	if (grid.selected.minCol > 0) // so that the selection indicator is not drawn on the title cell when a row label is selected
	{
		for (var i = grid.selected.minCol; i <= grid.selected.maxCol + 1; i++)
		{
			var x = Get(grid.xs[i]);
			g.lineWidth = 1;
			g.strokeStyle = selectedStroke;
			g.beginPath();
			g.moveTo(x - 0.5, y0 - 0.5);
			g.lineTo(x - 0.5, y1);
			g.stroke();
		}
		
		var sx0 = Get(grid.xs[grid.selected.minCol]);
		var sx1 = Get(grid.xs[grid.selected.maxCol + 1]);
		
		g.lineWidth = 1;
		g.strokeStyle = selectedStroke;
		
		g.beginPath();
		g.moveTo(sx0 - 0.5, y0 - 0.5);
		g.lineTo(sx1, y0 - 0.5);
		g.stroke();
		
		g.beginPath();
		g.moveTo(sx0 - 0.5, y1 - 0.5);
		g.lineTo(sx1, y1 - 0.5);
		g.stroke();
	}
	
	//for (var i = 0; i < grid.cells.length; i++)
	//{
	//	var cell = grid.cells[i];
	//	DrawBorder(cell);
	//}
	
	
	// draw scrollbars
	
	for (var i = 0; i < grid.scrollbars.length; i++)
	{
		grid.scrollbars[i].draw(grid.scrollbars[i]);
	}
	
	
	//if (grid.rightScrollbar)
	//{
	//	//DrawScrollbar(grid.rightScrollbar);
	//}
	//
	//if (grid.bottomScrollbar)
	//{
	//	var g = globals.g;
	//	g.strokeStyle = "rgb(158,182,206)";
	//	g.fillStyle = "rgb(128,128,128)";
	//	
	//	var left = Get(grid.cells[0].left) - 0.5;
	//	var top = Get(grid.cells[grid.cells.length - 1].bottom) + 0.5;
	//	var right = Get(grid.cells[grid.cells.length - 1].right) + 0.5;
	//	
	//	g.strokeRect(left + 1, top - 1, right - left - 2, 10);
	//	g.fillRect(left + 20 - 0.5, top - 0.5, 20, 9);
	//}
	
	// now calculate the active border coordinates (we could possible do this incrementally in response to events)

	// any container can have a 'selected' list
	
	// remove grid.hasSelected from everywhere
	
	//grid.selected = [];
	//grid.selected[0] = {};
	//grid.selected[0].mode = "Point"; // as opposed to Select
	//grid.selected[0].shimmer = true; // for Copy, ActivePoint, etc. (Copy and ActivePoint would have flashing borders)
	//grid.selected[0].color = "rgb(0,0,255)";
	//grid.selected[0].minColInclusive = 0;
	//grid.selected[0].maxColInclusive = 2;
	//grid.selected[0].minRowInclusive = 3;
	//grid.selected[0].maxRowInclusive = 3;
	
	if (grid.multicell)
	{
		grid.multicell.draw(grid.multicell);
	}
	
	for (var i = 0; i < grid.selected.length; i++)
	{
		var mode = grid.selected[i].mode;
		var color = grid.selected[i].color;
		var lf = Get(grid.xs[grid.selected[i].minCol]);
		var rt = Get(grid.xs[grid.selected[i].maxCol + 1]);
		var tp = Get(grid.ys[grid.selected[i].minRow]);
		var bt = Get(grid.ys[grid.selected[i].maxRow + 1]);
		
		if (lf && rt && tp && bt) // this is a legacy of always having a selected and setting it to null - we should just get rid of the selected object on defocus
		{
			if (mode == "Point")
			{
				DrawPointBorder(color, lf, tp, rt, bt);
			}
			else if (mode == "Select")
			{
				DrawActiveBorder(color, lf, tp, rt, bt);
			}
			else
			{
				throw new Error();
			}
		}
		
		if (grid.selected[i].shimmer)
		{
			
		}
	}
}

function DrawGridHtml(grid)
{
	var $div = $(document.createElement('div'));
	$('body').append($div);
	// $(grid.shapeParent).append(div);
	
	$div.draggable();
	$div.css('border', '1px solid black');
	$div.css('overflow', 'scroll');
	$div.css('padding', '3px');
	
	// should the grid be bound to the <div> or the <table>?
	$div.on('dragstop', function(event, ui)
	{ 
		// use the ui object to get these numbers - check the docs:
		// 
		grid.top.$ = parseInt($div.css('top').replace("px", ""));
		grid.left.$ = parseInt($div.css('left').replace("px", ""));
		// boxreact?
		
		// Set() instead of .$?
	});
	
	var $table = $(document.createElement('table'));
	$div.append($table);
	
	for (var i = 0; i < grid.nRows; i++)
	{
		var $tr = $(document.createElement('tr'));
		$table.append($tr);
		//var tr = document.createElement('tr');
		//table.appendChild(tr);
		
		for (var j = 0; j < grid.nCols; j++)
		{
			var $td = $(document.createElement('td'));
			$tr.append($td);
			//var td = document.createElement('td');
			//tr.appendChild(td);
			
			$td.data('i', i);
			$td.data('j', j);
			
			//$td.on('click', function() { $td.addClass('ui-selected'); }); // we also use the .selectable thing of jqueryui
			
			//if (i == 0 || j == 0)
			//{
			//	$td.resizable(); // ok, this doesn't work - possibly because of interaction with selectable
			//
			// perhaps we can go back to the idea of having a small 1px-wide horizontally- or vertically-constrained draggable div in between header cells
			//	
			//	$td.on('resizestop', function(event, ui)
			//	{ 
			//		// use the ui object to get these numbers - check the docs:
			//		// http://api.jqueryui.com/resizable/#event-stop
			//		//grid.colSizes[i].$ = ui.size.width;
			//		//grid.rowSizes[i].$ = ui.size.height;
			//		// Set() instead of .$
			//	});
			//}
			
			if (i == 0 && j == 0)
			{
				$td.addClass('tblheader');
			}
			else if (i == 0)
			{
				$td.addClass('colheader');
				
				if (grid.rowsAre == "objs")
				{
					$td.addClass('fldheader');
				}
				else
				{
					$td.addClass('objheader');
				}
			}
			else if (j == 0)
			{
				$td.addClass('rowheader');
				
				if (grid.rowsAre == "objs")
				{
					$td.addClass('objheader');
				}
				else
				{
					$td.addClass('fldheader');
				}
			}
			
			$td.html(grid.GetCell(i, j).string); // "<span class='right-indent'></span>" - a way to indent when the text is text-align:right
			//td.innerText = grid.GetCell(i, j).string;
		}
	}
	
	$table.selectable({ filter : 'td' }); // .ui-selectable added to <table>, .ui-selectee added to descendant <td>'s
	
	$table[0].tabIndex = globals.tabIndex++;
	
	$table.on('selectablestop', function(event, ui)
	{
		$table.focus();
	});
	
	$table.on('blur', function(event)
	{
		$(this).find('.ui-selected').removeClass('ui-selected');
	});
	
	$table.on('keydown', function(event)
	{
		var $sel = $(this).find('.ui-selected');
		
		// temporary codemirrors are always hung from document.body, with specified top,left,width,height
		var top = null; // ???
		var left = null;
		var width = null;
		var height = null;
		
		var slot = null;
		
		if ($sel.length == 1)
		{
			var i = $sel.data('i');
			var j = $sel.data('j');
			var cell = grid.GetCell(i, j);
			slot = cell.slot;
			PlaceCodeMirror($sel[0], $table[0], slot, String.fromCharCode(event.which));
		}
		else
		{
			// objslot, fldslot, tblslot
		}
		
		//if (65 <= event.which && event.which <= 90)
		//{
		//	PrimeTextEditCodeMirror(true, String.fromCharCode(event.which));
		//}
	});
	
	$div.css('position', 'absolute');
	$div.css('top', Get(grid.top).toString() + 'px');
	$div.css('left', Get(grid.left).toString() + 'px');
	
	grid.shape = $div.get(0);
}

function DrawGridHtmlDiv(grid)
{

}

function DrawGridSvg(grid)
{
	if (grid.drawn)
	{
		return; // this is a stupid temporary thing to prevent this function from being called more than once
	}
	
	var top = Get(grid.top);
	var left = Get(grid.left);
	var right = Get(grid.xs[grid.xs.length - 1]);
	var bottom = Get(grid.ys[grid.ys.length - 1]);
	var width = right - left;
	var height = bottom - top;
	//var width = Get(grid.xs[grid.xs.length - 1]) - Get(grid.xs[0]);
	//var height = Get(grid.ys[grid.ys.length - 1]) - Get(grid.ys[0]);
	
	var svg = "";
	//svg += "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n";
	svg += "<svg xmlns='http://www.w3.org/2000/svg' width='" + (width + 1).toString() + "' height='" + (height + 1).toString() + "'>";
	svg += "<g>";
	
	for (var i = 0; i < grid.xs.length; i++)
	{
		var x = Get(grid.xs[i]) - left + 0.5;
		svg += "<line stroke='rgb(195,195,195)' stroke-width='1' x1='" + x.toString() + "' y1='" + (0).toString() + "' x2='" + x.toString() + "' y2='" + (height + 1).toString() + "' />";
	}
	
	for (var i = 0; i < grid.ys.length; i++)
	{
		var y = Get(grid.ys[i]) - top + 0.5;
		svg += "<line stroke='rgb(195,195,195)' stroke-width='1' x1='" + (0).toString() + "' y1='" + y.toString() + "' x2='" + (width + 1).toString() + "' y2='" + y.toString() + "' />";
	}
	
	for (var i = 0; i < grid.nRows; i++)
	{
		for (var j = 0; j < grid.nCols; j++)
		{
			var cell = grid.GetCell(i, j);
			//var style = "fill:none; stroke:black;";
			var style = "fill:" + Get(cell.fill);
			var x = Get(grid.xs[j]) - left + 1;
			var y = Get(grid.ys[i]) - top + 1;
			var width = Get(grid.colSizes[j]) - 1;
			var height = Get(grid.rowSizes[i]) - 1;
			svg += "<rect style='" + style + "' x='" + x.toString() + "' y='" + y.toString() + "' width='" + width.toString() + "' height='" + height.toString() + "' />";
			
			var strWidth = globals.g.measureText(cell.string).width;
			
			if (i == 0 || j == 0) // left justify
			{
				svg += "<text x='" + (x + 2).toString() + "' y='" + (y + height - 5).toString() + "' font-size='11pt' font-family='Calibri'>" + cell.string + "</text>";
			}
			else // right justify
			{
				svg += "<text x='" + (x + width - 2 - strWidth).toString() + "' y='" + (y + height - 5).toString() + "' font-size='11pt' font-family='Calibri'>" + cell.string + "</text>";
			}
		}
	}
	
	svg += "</g>";
	svg += "</svg>";
	
	// create a new svg element and add it to the document body
	// we could use an <iframe> instead of a <div>
	// the borders of the <iframe> could be invisible
	
	var div = document.createElement("div");
	div.style.position = "absolute";
	div.style.top = Get(grid.top).toString() + "px";
	div.style.left = Get(grid.left).toString() + "px";
	div.innerHTML = svg;
	document.body.appendChild(div);
	
	grid.shape = div;
	grid.drawn = true;
}

//function OverGrid(grid)
//{
//	if (globals.logging) { globals.log.push("ClickGrid " + grid["[id]"].toString()); }
//	
//	var mx = Get(globals.mx);
//	var my = Get(globals.my);
//	
//	var xMin = Get(grid.xs[0]);
//	var xMax = Get(grid.xs[grid.xs.length - 1]);
//	var yMin = Get(grid.ys[0]);
//	var yMax = Get(grid.ys[grid.ys.length - 1]);
//	
//	if (mx < xMin || mx > xMax + 1 || my < yMin || my > yMax + 1) { return; }
//	
//	var x0 = Get(grid.xs[0]);
//	var x1 = Get(grid.xs[1]);
//	var y0 = Get(grid.ys[0]);
//	var y1 = Get(grid.ys[1]);
//	
//	// move grid
//	//if ((y0 - 1 <= my && my <= y0 + 1 && x0 <= mx && mx < x1) || (x0 - 1 <= mx && mx <= x0 + 1 && y0 <= my && my < y1)) // top and left borders of the title cell only
//	if ((y0 - 1 <= my && my <= y0 + 1 && xMin <= mx && mx <= xMax) || (x0 - 1 <= mx && mx <= x0 + 1 && yMin <= my && my <= yMax)) // top and left borders of entire grid
//	{
//		document.getElementById("myCanvas").style.cursor = "move";
//		globals.beingDragged.obj = grid;
//		globals.beingDragged.xSlot = grid.left;
//		globals.beingDragged.ySlot = grid.top;
//		globals.dragOnClick = true; // this flag is cleared and PrimeDrag reversed (if necessary) on each MM
//		OnPrimeDrag();
//		return grid;
//	}
//	
//	if (x0 < mx && mx < x1)
//	{
//		for (var i = 0; i < grid.nRows; i++)
//		{
//			var y = Get(grid.ys[i + 1]);
//			
//			if (y - 1 <= my && my <= y + 1)
//			{
//				document.getElementById("myCanvas").style.cursor = "row-resize";
//				var prevY = Get(grid.ys[i]);
//				var rowResizeIndex = i;
//				var RowResize = function()
//				{
//					var currY = Get(globals.my);
//					grid.rowSizes[rowResizeIndex] = Math.max(currY - prevY, 2); // this has to have subsequent effects on grid.ys (via react)
//					grid.position(grid);
//				};
//				var EndRowResize = function() { Pop("MM"); /*Pop("LD");*/ Pop("LU"); };
//				var BeginRowResize = function() { Push("MM", RowResize); Push("LU", EndRowResize); };
//				grid.onclick = BeginRowResize;
//				return grid;
//			}
//		}
//	}
//	
//	if (y0 < my && my < y1)
//	{
//		for (var j = 0; j < grid.nCols; j++)
//		{
//			var x = Get(grid.xs[j + 1]);
//			
//			if (x - 1 <= mx && mx <= x + 1)
//			{
//				document.getElementById("myCanvas").style.cursor = "col-resize";
//				var prevX = Get(grid.xs[j]);
//				var colResizeIndex = j;
//				var ColResize = function()
//				{
//					var currX = Get(globals.mx);
//					grid.colSizes[colResizeIndex] = Math.max(currX - prevX, 2); // this has to have subsequent effects on grid.xs (via react)
//					grid.position(grid);
//				};
//				var EndColResize = function() { Pop("MM"); Pop("LD"); Pop("LU"); };
//				var BeginColResize = function() { Push("MM", ColResize); Push("LU", EndColResize); };
//				grid.onclick = BeginColResize;
//				return grid;
//			}
//		}
//	}
//	
//	for (var i = 0; i < grid.scrollbars.length; i++)
//	{
//		var scrollbar = grid.scrollbars[i];
//		var target = scrollbar.over(scrollbar);
//		if (target) { return target; }
//	}
//	
//	// find the cell to call .over on by comparing the mouse pos against the gridlines
//	var hoverCol = null;
//	for (var j = 0; j < grid.xs.length - 1; j++) { if (Get(grid.xs[j]) < mx && mx < Get(grid.xs[j + 1])) { hoverCol = j; } } // binary search could be used for large grids
//	var hoverRow = null;
//	for (var i = 0; i < grid.ys.length - 1; i++) { if (Get(grid.ys[i]) < my && my < Get(grid.ys[i + 1])) { hoverRow = i; } } // binary search could be used for large grids
//	var cell = grid.GetCell(hoverRow, hoverCol);
//	var target = cell.over(cell);
//	if (target) { return target; }
//}
//
//function DeHoverGrid(grid)
//{
//	document.getElementById("myCanvas").style.cursor = "default";
//}

function OnFocusGrid(grid)
{
	//if (globals.logging) { globals.log.push("OnFocusGrid " + grid["[id]"].toString()); }
	
	globals.focussed = grid;
	grid.focusSelected = grid.selected[0]; // does this always work?
	
	//grid.cursor.row = 0;
	//grid.cursor.col = 0;
	//grid.anchor.row = 0;
	//grid.anchor.col = 0;
	//grid.focusSelected.minRow = 0;
	//grid.focusSelected.maxRow = 0;
	//grid.focusSelected.minCol = 0;
	//grid.focusSelected.maxCol = 0;
	
	//Push("Up", MoveActiveUp);
	//Push("Down", MoveActiveDown);
	//Push("Enter", MoveActiveDown);
	//Push("Right", MoveActiveRight);
	//Push("Left", MoveActiveLeft);
	//Push("Shift+Up", ExtendSelectionUp);
	//Push("Shift+Down", ExtendSelectionDown);
	//Push("Shift+Right", ExtendSelectionRight);
	//Push("Shift+Left", ExtendSelectionLeft);
	//Push("Ctrl+Up", MoveActiveAllTheWayUp);
	//Push("Ctrl+Down", MoveActiveAllTheWayDown);
	//Push("Ctrl+Right", MoveActiveAllTheWayRight);
	//Push("Ctrl+Left", MoveActiveAllTheWayLeft);
	//Push("Shift+Ctrl+Up", ExtendSelectionAllTheWayUp);
	//Push("Shift+Ctrl+Down", ExtendSelectionAllTheWayDown);
	//Push("Shift+Ctrl+Right", ExtendSelectionAllTheWayRight);
	//Push("Shift+Ctrl+Left", ExtendSelectionAllTheWayLeft);
	//Push("Ctrl+Space", SelectWholeCol);
	//Push("Shift+Space", SelectWholeRow);
	//Push("Shift+Ctrl+Space", SelectWholeGrid);
	
	//Push("Alt+H+I+I", InsertCells); // pop-up box with radio buttons for shift direction - r[i]ght, [d]own, [r]ow, [c]ol
	//Push("Alt+H+I+R", InsertRows);
	//Push("Alt+H+I+C", InsertCols);
	//Push("Alt+H+I+S", InsertSheet);
	//Push("Alt+H+D+I", DeleteCells); // pop-up box with radio buttons for shift direction - r[i]ght, [d]own, [r]ow, [c]ol
	//Push("Alt+H+D+R", DeleteRows);
	//Push("Alt+H+D+C", DeleteCols);
	//Push("Alt+H+D+S", DeleteSheet);
	//Push("Alt+H+O+H", ChangeRowHeight); // excel uses a pop-up box here
	//Push("Alt+H+O+A", AutofitRowHeight);
	//Push("Alt+H+O+W", ChangeColWidth); // excel uses a pop-up box here
	//Push("Alt+H+O+I", AutofitColWidth);
	//Push("Alt+H+O+D", DefaultWidth);
	//Push("Alt+H+S+S", SortAZ);
	//Push("Alt+H+S+O", SortZA);
	//Push("Alt+H+S+U", SortCustom);
	//Push("Alt+H+S+F", Filter);
	//Push("Alt+H+S+C", Clear); // never used this
	//Push("Alt+H+S+Y", Reapply); // never used this
	
	//Push("Alt+H+O+R", RenameSheet); // wait, rename can be used for objs and fields too - we could repurpose 'Insert' as the rename button
	//Push("Insert", Rename);
}

function DeFocusGrid(grid)
{
	//if (globals.logging) { globals.log.push("DeFocusGrid " + grid["[id]"].toString()); }
	
	globals.focussed = null;
	grid.focusSelected = null;
	
	grid.selected[0].minCol = null;
	grid.selected[0].maxCol = null;
	grid.selected[0].minRow = null;
	grid.selected[0].maxRow = null;
	
	//Pop("Up");
	//Pop("Down");
	//Pop("Enter");
	//Pop("Right");
	//Pop("Left");
	//Pop("Shift+Up");
	//Pop("Shift+Down");
	//Pop("Shift+Right");
	//Pop("Shift+Left");
	//Pop("Ctrl+Up");
	//Pop("Ctrl+Down");
	//Pop("Ctrl+Right");
	//Pop("Ctrl+Left");
	//Pop("Shift+Ctrl+Up");
	//Pop("Shift+Ctrl+Down");
	//Pop("Shift+Ctrl+Right");
	//Pop("Shift+Ctrl+Left");
	//Pop("Ctrl+Space");
	//Pop("Shift+Space");
	//Pop("Shift+Ctrl+Space");
}

//function OnEditGrid()
//{
//	Push("Enter", AcceptEditWithEnter);
//	Push("Tab", AcceptEditAndMoveRight);
//	Push("Esc", RejectEdit);
//	
//	// the progression of point colors:
//	var colors = [];
//	colors[0] = "rgb(0,0,255)";
//	colors[1] = "rgb(0,128,0)";
//	colors[2] = "rgb(153,0,204)";
//	colors[3] = "rgb(128,0,0)";
//	colors[4] = "rgb(0,204,51)";
//	colors[5] = "rgb(255,102,0)";
//	colors[6] = "rgb(204,0,153)";
//	
//	var pointSelect = MakeObj(this.selected, "1");
//	this.selected[1] = pointSelect;
//	pointSelect.mode = "Point";
//	pointSelect.color = colors[0];
//	pointSelect.shimmer = false;
//	pointSelect.minCol = null;
//	pointSelect.maxCol = null;
//	pointSelect.minRow = null;
//	pointSelect.maxRow = null;
//	this.focusSelected = pointSelect;
//}
//
//function DeEditGrid()
//{
//	Pop("Enter");
//	Pop("Tab");
//	Pop("Esc");
//	
//	// if we never used any point selections, we should delete grid.selected[1] which was created in OnEditGrid
//	//if (grid.selected[1].minCol == null)
//	//{
//	//	delete grid.selected[1];
//	//}
//	
//	this.focusSelected = this.selected[0];
//}
//
//function ToggleTraceGridMode()
//{
//	if (globals.traceGridMode)
//	{
//		globals.canvas.buttons["ToggleTraceGridModeButton"].version = 0;
//		ExitTraceGridMode();
//		globals.traceGridMode = false;
//	}
//	else
//	{
//		globals.canvas.buttons["ToggleTraceGridModeButton"].version = 2;
//		EnterTraceGridMode();
//		globals.traceGridMode = true;
//	}
//}
//
//function EnterTraceGridMode()
//{
//	document.getElementById("myCanvas").style.cursor = "crosshair";
//	PushUnder("LD", BeginTraceGrid);
//}
//
//function ExitTraceGridMode()
//{
//	document.getElementById("myCanvas").style.cursor = "default";
//	Pop("LD");
//	Pop("LU");
//}
//
//function BeginTraceGrid()
//{
//	var origX = Get(globals.mx);
//	var origY = Get(globals.my);
//	
//	var frame = globals.canvas; // to do: change focus frame based on where the mouse pointer is
//	// every frame is a collection, but not every collection is a frame
//	// for instance, the data obj of a grid is a collection, but not a frame
//	
//	var gridName = "Grid" + (globals.objcounts.grid++).toString();
//	var grid = MakeGrid(frame, gridName);
//	grid.rowsAre = "objs";
//	
//	var dataName = "Obj" + (globals.objcounts.obj++).toString();
//	
//	var TraceGrid = function()
//	{
//		var currX = Get(globals.mx);
//		var currY = Get(globals.my);
//		
//		//globals.log.push(currX.toString() + "  " + currY.toString());
//		
//		var lf = Math.min(origX, currX);
//		var rg = Math.max(origX, currX);
//		var tp = Math.min(origY, currY);
//		var bt = Math.max(origY, currY);
//		
//		var wd = rg - lf;
//		var hg = bt - tp;
//		
//		var cols = Math.max(2, Math.floor(wd / 64));
//		var rows = Math.max(2, Math.floor(hg / 20));
//		
//		if (grid.obj) // obj is arbitrary - we just want to see if we have added fields to the grid yet
//		{
//			if (cols == grid.nCols && rows == grid.nRows)
//			{
//				return; // so that we only regenerate and redraw if we add/subtract a row or col
//			}
//		}
//		
//		var matrix = MakeEmptyMatrix(dataName, cols - 1, rows - 1);
//		LoadGrid(frame, grid, matrix);
//		
//		//var slot = MakeSlot(frame, dataName, null);
//		//frame[dataName] = slot;
//		//slot.$ = Empties(slot, "$", cols - 1, rows - 1);
//		//slot.$["[type]"] = "Collection";
//		//SetGridDataSlot(grid, slot);
//		//RedisplayGrid(grid);
//		
//		MoveBox(grid, "top", "height", tp);
//		MoveBox(grid, "left", "width", lf);
//		grid.position(grid);
//		globals.redraw = true;
//	};
//	
//	Push("LU", EndTraceGrid);
//	Push("Esc", EndTraceGrid); // a safety valve for when a mouseup event is dropped and we're stuck in tracegrid mode
//	Push("MM", TraceGrid);
//}
//
//function EndTraceGrid()
//{
//	Pop("LU");
//	Pop("Esc");
//	Pop("MM");
//}
//
//function MakeEmptyMatrix(dataName, cols, rows)
//{
//	var matrix = []; // since this must match the matrix gleaned from a script, rows must be first
//	
//	var toprow = [];
//	
//	toprow.push(dataName);
//	
//	for (var j = 0; j < cols; j++)
//	{
//		toprow.push(ToLetter(j));
//	}
//	
//	matrix.push(toprow);
//	
//	for (var i = 0; i < rows; i++)
//	{
//		var row = [];
//		
//		row.push(i.toString());
//		
//		for (var j = 0; j < cols; j++)
//		{
//			row.push("null");
//		}
//		
//		matrix.push(row);
//	}
//	
//	return matrix;
//}
//
//function ToLetter(n)
//{
//	return String.fromCharCode(n + 65);
//}
//
//function ScrollGrid(grid, strRowsOrCols, intNewStart)
//{
//	if (globals.logging)
//	{
//		globals.log.push("ScrollGrid " + grid["[id]"].toString());
//	}
//	
//	// none of this works since making cells non-retargetable
//	
//	// what we should do is change objs or fields and then regenerate all cells
//	
//	throw new Error();
//	
//	var data = Get(grid.obj);
//	
//	for (var j = 0; j < grid.cols.length; j++)
//	{
//		for (var i = 0; i < grid.rows.length; i++)
//		{
//			var cell = grid.cells[(j + 1) * grid.nRows + (i + 1)];
//			
//			if (strRowsOrCols == "rows")
//			{
//				if (grid.rowsAre == "objs")
//				{
//					// since getting rid of the concept of retargetable cell pointers, we have to rework this function
//					// basically we're just reassigning cell.slot
//					// one problem we have here is that we don't have a cached starting index for both rows/cols - we need this
//					// then we can just use something like the line below to retarget the cells
//					cell.slot = Get(data[grid.objs[intNewStart + i]])[grid.flds[intNewStart + i]];
//				}
//				else
//				{
//					cell.slot = grid.flds[intNewStart + i];
//				}
//			}
//			else
//			{
//				if (grid.rowsAre == "fields")
//				{
//					cell.slot = data[grid.objs[intNewStart + j]];
//				}
//				else
//				{
//					cell.slot = grid.flds[intNewStart + j];
//				}
//			}
//		}
//	}
//	
//	if (strRowsOrCols == "rows")
//	{
//		for (var i = 0; i < grid.rows.length; i++)
//		{
//			var cell = grid.GetCell(i + 1, 0);
//			var slot = cell.slot;
//			var label = grid.rows[intNewStart + i];
//			Set(slot, label);
//		}
//	}
//	else
//	{
//		for (var j = 0; j < grid.cols.length; j++)
//		{
//			var cell = grid.GetCell(grid.nRows, j + 1);
//			var slot = cell.slot;
//			var label = grid.cols[intNewStart + j];
//			Set(slot, label);
//		}
//	}
//	
//	// redisplay each grid cell
//	var c = 0;
//	
//	for (var j = 0; j < grid.nCols; j++)
//	{
//		for (var i = 0; i < grid.nRows; i++)
//		{
//			var cell = grid.GetCell(i, j);
//			cell.redisplay(cell);
//			cell.position(cell);
//		}
//	}
//	
//	globals.redraw = true;
//}

