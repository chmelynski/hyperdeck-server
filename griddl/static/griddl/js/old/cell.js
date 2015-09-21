
function DisplayStringAsCell(parent, name, str)
{
	var cell = MakeCell(parent, name);
	var slot = MakeSlot(cell, "slot", str); // we assume that the str is just a value, so that the slot value and slot formula are the same string
	SetCellSlot(cell, slot);
	slot.formula = str;
	// which means that if we attach a cell to a slot that already has a formula, the cell should mirror that formula
	// cell.string should alternate between slot.formula and cell.tostring(Get(slot))
	return cell;
}

function DisplaySlotAsCell(parent, name, slot)
{
	var cell = MakeCell(parent, name);
	SetCellSlot(cell, slot);
	return cell;
}

function MakeCell(parent, name)
{
	var cell = MakeObj(parent, name);
	
	// this is the same as textbox
	cell["[type]"] = "Cell";
	//cell.over = OverBox;
	cell.tostring = ToStringDefault;
	cell.redisplay = RedisplayCell;
	//cell.position = PositionCell;
	//cell.contents = MakeList(cell, "contents");
	cell.string = "";
	//cell.lineWidth = 1;
	//cell.fill = "rgb(255,255,255)";
	//cell.textFill = "rgb(0,0,0)";
	//cell.border = MakeObj(cell, "border");
	AddRectSlots(cell);
	//cell.onselect = OnSelectCell;
	//cell.deselect = DeSelectCell;
	//cell.cursorOn = false;
	//cell.cursorTimer = null;
	//cell.toggleCursor = ToggleCursor; // since switching this from a closure to this, it probably doesn't need to be a field
	
	cell.node = MakeNode(cell, "node", cell);
	cell.act = ProcessCell; // the cell will have different responses to different messages
	
	// this is cell-specific
	//cell.draw = DrawCell;
	//cell.stroke = "rgb(0,0,0)";
	//cell.onhover = OnHoverCell;
	//cell.dehover = DeHoverCell;
	cell.numberFormat = MakeSlot(cell, "numberFormat", 0);
	cell.width.$ = 64;
	cell.height.$ = 20;
	
	return cell;
}

function SetCellSlot(cell, slot)
{
	cell.slot = slot;
	AddEdge(slot.node, cell.node, Nonce(slot, "display"), Edge.Display);
	cell.align = typeof(Get(slot)) == "number" ? "right" : "left";
	cell.redisplay(cell);
}

//function ResetCursor()
//{
//	globals.cursorOn = true;
//	clearInterval(globals.cursorTimer);
//    globals.cursorTimer = setInterval(ToggleCursor, 500);
//	DrawCursor();
//}
//
//function DeactCursor()
//{
//	globals.cursorOn = false;
//	clearInterval(globals.cursorTimer);
//}
//
//function ToggleCursor()
//{
//	globals.cursorOn = !globals.cursorOn;
//	DrawCursor();
//}
//
//function DrawCursor()
//{
//	var cell = globals.beingEdited;
//	
//	if (cell)
//	{
//		var x = null;
//		var y1 = null;
//		var y2 = null;
//		
//		if (cell.cursor == -1)
//		{
//			x = Get(cell.left) + 2;
//			y1 = Get(cell.top) + 2;
//			y2 = Get(cell.top) + 17; // arbitrary - should depend on font and size
//		}
//		else
//		{
//			var c = cell.contents[cell.cursor];
//			
//			x = Get(c.right);
//			y1 = Get(c.top) + 2;
//			y2 = Get(c.bottom) - 2;
//		}
//		
//		x = Math.floor(x) + 0.5;
//		
//		var g = globals.g;
//		g.lineWidth = 1;
//		
//		if (globals.cursorOn)
//		{
//			g.strokeStyle = "rgb(0,0,0)";
//		}
//		else
//		{
//			if (cell.fill)
//			{
//				g.strokeStyle = cell.fill;
//			}
//			else
//			{
//				g.strokeStyle = "rgb(255,255,255)";
//			}
//		}
//		
//		g.beginPath();
//		g.moveTo(x, y1);
//		g.lineTo(x, y2);
//		g.stroke();
//	}
//}
//
//function DrawCell(cell)
//{
//	DrawBox(cell);
//	
//	DrawCursor();
//	
//	//if (globals.selectedCellShape == cell)
//	//{
//	//	DrawActiveBorder("rgb(0,0,0)", Get(cell.left), Get(cell.top), Get(cell.right), Get(cell.bottom));
//	//}
//}
//
//function OnHoverCell(cell)
//{
//	//cell.oldstroke = cell.stroke;
//	//cell.stroke = "rgb(255,0,0)";
//	
//	//document.getElementById("myCanvas").style.cursor = "cell";
//	//document.getElementById("myCanvas").style.cursor = "text"; // if cell is currently being edited
//	
//	Push("LD", MouseSelectCell); // change to BeginTraceSelection - we select on LU
//}
//
//function DeHoverCell(cell)
//{
//	//cell.stroke = cell.oldstroke;
//	
//	//document.getElementById("myCanvas").style.cursor = "default";
//	
//	Pop("LD");
//}
//
//function OnSelectCell(cell)
//{
//	var container = cell.container;
//	
//	if (container)
//	{
//		container.onfocus(container);
//		//container.editActive(container, cell, true); // true=activate,false=deactivate
//	}
//	
//	//cell.border.type = "Select";
//	//cell.border.N = 1;
//	//cell.border.E = 1;
//	//cell.border.S = 1;
//	//cell.border.W = 1;
//	//cell.border.NW = 1;
//	//cell.border.NE = 1;
//	//cell.border.SW = 1;
//	//cell.border.SE = 1;
//	
//	PushAlpha(DeleteAndPrimeTextEditAndAddChar);
//	//Push("Backspace", DeleteAndPrimeTextEdit); // this function not yet implemented
//	Push("Space", DeleteAndPrimeTextEditAndAddChar);
//	Push("F2", PrimeTextEdit);
//	Push("Delete", Delete);
//	Push("Esc", Deselect);
//	
//	Push(";:", DeleteAndPrimeTextEditAndAddChar);
//	Push("=+", DeleteAndPrimeTextEditAndAddChar);
//	Push(",<", DeleteAndPrimeTextEditAndAddChar);
//	Push("-_", DeleteAndPrimeTextEditAndAddChar);
//	Push(".>", DeleteAndPrimeTextEditAndAddChar);
//	Push("/?", DeleteAndPrimeTextEditAndAddChar);
//	Push("`~", DeleteAndPrimeTextEditAndAddChar);
//	Push("[{", DeleteAndPrimeTextEditAndAddChar);
//	Push("\\|", DeleteAndPrimeTextEditAndAddChar);
//	Push("]}", DeleteAndPrimeTextEditAndAddChar);
//	Push("'\"", DeleteAndPrimeTextEditAndAddChar);
//}
//
//function DeSelectCell(cell)
//{
//	var container = cell.container;
//	
//	if (container)
//	{
//		container.defocus(container);
//		//container.editActive(container, cell, false); // true=activate,false=deactivate
//	}
//	
//	//cell.border.type = null;
//	
//	PopAlpha();
//	//Pop("Backspace");
//	Pop("Space");
//	Pop("F2");
//	Pop("Delete");
//	Pop("Esc");
//	
//	Pop(";:");
//	Pop("=+");
//	Pop(",<");
//	Pop("-_");
//	Pop(".>");
//	Pop("/?");
//	Pop("`~");
//	Pop("[{");
//	Pop("\\|");
//	Pop("]}");
//	Pop("'\"");
//}

function RedisplayCell(cell)
{
	ValueToString(cell);
	//RegenerateChars(cell);
}

function ValueToString(cell)
{
	var value = Get(cell.slot);
	cell.valueType = typeof(value);
	
	if (value == null)
	{
		cell.string = "";
	}
	else if (cell.valueType == "number")
	{
		var n = Get(cell.numberFormat);
		
		if (n < 0)
		{
			n = 0;
		}
		
		if (n > 20)
		{
			n = 20;
		}
		
		cell.string = value.toFixed(n);
	}
	else if (cell.valueType == "string")
	{
		cell.string = cell.tostring(value); // apply formatting here - note that when you want to edit, use the raw toString()
	}
	else if (cell.valueType == "object")
	{
		if (value.forEach)
		{
			cell.string = "[Array]";
		}
		else
		{
			cell.string = cell.slot.formula;
			//cell.string = cell.tostring(value); // apply formatting here - note that when you want to edit, use the raw toString()
		}
	}
	else if (cell.valueType == "boolean")
	{
		cell.string = value.toString();
	}
	else if (cell.valueType == "function")
	{
		cell.string = value.name;
	}
	else // undefined, presumably
	{
		cell.string = cell.slot.formula;
		//cell.string = "";
	}
}

//function RegenerateChars(cell)
//{
//	cell.contents = MakeList(cell, "contents");
//	
//	//var removeReturns = "";
//	//
//	//for (var i = 0; i < cell.string.length; i++)
//	//{
//	//	if (cell.string[i] == '\r')
//	//	{
//	//	
//	//	}
//	//	else
//	//	{
//	//		removeReturns += cell.string[i];
//	//	}
//	//}
//	//
//	//cell.string = removeReturns;
//	
//	for (var i = 0; i < cell.string.length; i++)
//	{
//		var c = MakeObj(cell.contents, cell.contents.length.toString());
//		cell.contents.push(c);
//		c.c = cell.string[i];
//		c.draw = DrawText;
//		//c.over = OverBox;
//		c.cell = cell;
//		c.type = "text";
//		//c.font = "10pt Courier New";
//		//c.font = "11pt Consolas";
//		c.font = "11pt Calibri"; // this is what Excel uses - needs to be kerned properly though
//		c.stroke = null;
//		c.fill = cell.textFill;
//		c.width = null;
//		c.height = null;
//		c.left = null;
//		c.top = null;
//		c.right = null;
//		c.bottom = null;
//		c.wr = null;
//		c.hr = null;
//		c.cx = null;
//		c.cy = null;
//		c.scale = null;
//		
//		if (cell.valueType == "number" && IsDigit(c.c))
//		{
//			c.onhover = OnHoverDigit;
//			c.dehover = DeHoverDigit;
//		}
//		else
//		{
//			c.onhover = OnHoverNonDigit;
//			c.dehover = DeHoverNonDigit;
//		}
//	}
//	
//	// assign scale
//	if (cell.valueType == "number") // and if the cell is not a formula cell
//	{
//		var decimalPointFound = false;
//		
//		for (var i = 0; i < cell.contents.length; i++)
//		{
//			if (cell.contents[i].c == ".") // first find the decimal place
//			{
//				var scale = 1;
//				
//				for (var k = i - 1; k >= 0; k--)
//				{
//					cell.contents[k].scale = scale;
//					scale *= 10;
//				}
//				
//				scale = 0.1;
//				
//				for (var k = i + 1; k < cell.contents.length; k++)
//				{
//					cell.contents[k].scale = scale;
//					scale /= 10;
//				}
//				
//				decimalPointFound = true;
//				break;
//			}
//		}
//		
//		if (!decimalPointFound)
//		{
//			var scale = 1;
//			
//			for (var k = cell.contents.length - 1; k >= 0; k--)
//			{
//				cell.contents[k].scale = scale;
//				scale *= 10;
//			}
//		}
//	}
//}

//function PositionCell(cell)
//{
//	var left = Get(cell.left);
//	var top = Get(cell.top);
//	var right = Get(cell.right);
//	var bottom = Get(cell.bottom) + 1; // this is some horrible grid/cell/whatever hack
//	
//	// the assumption here is normal English text flow - this should be generalized later
//	var hpos = left + 2;
//	var vpos = top + 1;
//	
//	var g = globals.g;
//	
//	// here would be a good time to set invisible/visible flags for overflow situations
//	
//	// a cell always references the full number of char shapes - the char shapes always exist, they are just sometimes invisible
//	
//	// which means, cell.contents.length ALWAYS equals cell.string.length
//	
//	for (var i = 0; i < cell.contents.length; i++)
//	{
//		var c = cell.contents[i];
//		
//		if (c.c == '\n')
//		{
//			hpos = left + 2;
//			vpos += 19;
//			
//			// for cursor placement
//			c.right = left + 2;
//			c.top = vpos;
//			c.bottom = c.top + 19;
//			
//			c.invisible = true;
//		}
//		else if (c.c == '\r')
//		{
//			c.invisible = true; // i'm thinking of banning \r's from our strings - because then cursor movement with arrow keys becomes strange
//		}
//		else if (c.c == '\t')
//		{
//			hpos += 30; // 15 is rather arbitrary - also, this completely ignores the concept of tab stops
//			
//			// for cursor placement
//			c.right = hpos;
//			c.top = vpos;
//			c.bottom = c.top + 19;
//			
//			c.invisible = true;
//		}
//		else
//		{
//			g.font = c.font;
//			c.width = g.measureText(c.c).width;
//			c.height = 19;
//			
//			c.left = hpos;
//			c.right = c.left + c.width;
//			
//			if (c.right >= right - 1) // overflow
//			{
//				hpos = left + 2;
//				vpos += c.height;
//				c.left = hpos;
//				c.right = c.left + c.width;
//			}
//			
//			c.top = vpos;
//			c.bottom = c.top + c.height;
//			
//			// we don't use slots for char coords because that would be too many slots
//			// these fields, wr, hr, cx, cy, are probably not even necessary
//			// and width and height may not be necessary except as local variables in this here function
//			//c.wr = c.width / 2;
//			//c.hr = c.height / 2;
//			c.cx = c.left + c.width / 2; // but we need this for cursor placement
//			//c.cy = c.top + c.hr;
//			
//			if (c.left <= left || c.right >= right || c.top <= top || c.bottom >= bottom)
//			{
//				c.invisible = true;
//			}
//			else
//			{
//				c.invisible = false;
//			}
//			
//			hpos += c.width;
//		}
//	}
//	
//	globals.redraw = true;
//}

function ToStringDefault(value)
{
	return value.toString();
}

//function DrawBorder(cell)
//{
//	// this needs to handle all kinds of borders - select, point, highlight, etc
//	
//	var border = cell.border;
//	
//	if (!border)
//	{
//		return;
//	}
//	
//	var lf = Get(cell.left);
//	var rt = Get(cell.right);
//	var tp = Get(cell.top);
//	var bt = Get(cell.bottom);
//	
//	if (border.type == "Point")
//	{
//		globals.g.fillStyle = border.color;
//		globals.g.strokeStyle = border.color;
//		
//		// if highlighted, draw a second outline 1px interior to the first outline
//		
//		if (border.N == 1)
//		{
//			DrawLine(lf, tp, rt, tp);
//		}
//		
//		if (border.E == 1)
//		{
//			DrawLine(rt, tp, rt, bt);
//		}
//		
//		if (border.S == 1)
//		{
//			DrawLine(lf, bt, rt, bt);
//		}
//		
//		if (border.W == 1)
//		{
//			DrawLine(lf, tp, lf, bt);
//		}
//		
//		if (border.NW == 1)
//		{
//			FillRect(lf - 1, tp - 1, lf + 3, tp + 3); // inclusive on both ends
//		}
//		
//		if (border.NE == 1)
//		{
//			FillRect(rt - 3, tp - 1, rt + 1, tp + 3);
//		}
//		
//		if (border.SE == 1)
//		{
//			FillRect(rt - 3, bt - 3, rt + 1, bt + 1);
//		}
//		
//		if (border.SW == 1)
//		{
//			FillRect(lf - 1, bt - 3, lf + 3, bt + 1);
//		}
//	}
//	else if (border.type == "Select")
//	{
//		if (border.N == 1)
//		{
//			FillRect(lf - 1, tp - 1, rt + 1, tp + 1);
//		}
//		
//		if (border.E == 1)
//		{
//			FillRect(rt - 1, tp - 1, rt + 1, bt + 1);
//		}
//		
//		if (border.S == 1)
//		{
//			FillRect(lf - 1, bt - 1, rt + 1, bt + 1);
//		}
//		
//		if (border.W == 1)
//		{
//			FillRect(lf - 1, tp - 1, lf + 1, bt + 1);
//		}
//	}
//	else if (border.type == "LabelHighlight")
//	{
//		globals.g.strokeStyle = border.color;
//		
//		DrawLine(lf, tp, rt, tp);
//		DrawLine(rt, tp, rt, bt);
//		DrawLine(lf, bt, rt, bt);
//		DrawLine(lf, tp, lf, bt);
//	}
//	else
//	{
//	
//	}
//}

