
function MakeTextbox(parent, name)
{
	var textbox = MakeObj(parent, name);
	parent[name] = textbox;
	textbox["[type]"] = "Textbox";
	AddRectSlots(textbox);
	//textbox.draw = DrawTextbox;
	textbox.draw = DrawTextboxCodeMirror;
	//textbox.over = OverTextbox;
	textbox.position = PositionTextbox;
	textbox.header = MakeCell(textbox, "header");
	textbox.cell = MakeCell(textbox, "cell");
	textbox.cell.redisplay = Nop; // we deactivate redisplay when using CodeMirror
	//textbox.onfocus = OnFocusTextbox;
	//textbox.defocus = DeFocusTextbox;
	//textbox.onedit = OnEditTextbox;
	//textbox.deedit = DeEditTextbox;
	
	//textbox.editActive = EditActiveTextbox;
	//textbox.selected = null;
	
	textbox.headerHeight = MakeSlot(textbox, "headerHeight", 20);
	
	textbox.cell.stroke = "rgb(128,128,128)";
	textbox.cell.container = textbox;
	
	textbox.header.stroke = "rgb(195,195,195)";
	textbox.header.fill = "rgb(208,216,217)";
	textbox.header.container = textbox;
	
	return textbox;
}

//function EditActiveTextbox(textbox, cell, bAdd)
//{
//	if (bAdd)
//	{
//		this.selected = cell;
//	}
//	else
//	{
//		this.selected = null;
//	}
//	
//	globals.redraw = true;
//}

function SetTextboxSlot(textbox, slot)
{
	SetCellSlot(textbox.cell, slot);
	
	textbox.nameslot = MakeSlot(textbox, "nameslot", slot["[name]"]);
	textbox.nameslot.react = ChangeName;
	
	SetCellSlot(textbox.header, textbox.nameslot);
}

function DrawTextbox(textbox)
{
	DrawCell(textbox.cell);
	DrawCell(textbox.header); // header is drawn after the cell because the cell will (when unselected) have a light gray border that we want to overwrite
	
	if (textbox.selected != null)
	{
		var cell = textbox.selected;
		DrawActiveBorder("rgb(0,0,0)", Get(cell.left) - 1, Get(cell.top) - 1, Get(cell.right) - 1, Get(cell.bottom) - 1);
	}
}

function DrawTextboxCodeMirror(textbox)
{
	if (!textbox.drawn)
	{
		var CompileCodeMirror = function(cm)
		{
			var str = cm.getValue();
			textbox.cell.slot.formula = str;
			CompileCode(textbox.cell.slot, str);
		};
		
		var keymap = {};
		keymap["Esc"] = function (cm) { CompileCodeMirror(cm); globals.canvasElement.focus(); };
		keymap["Ctrl-Enter"] = function (cm) { CompileCodeMirror(cm); ExecuteCell(textbox.cell); };
		
		var myCodeMirror = CodeMirror(document.body, { value : textbox.cell.slot.formula , mode : "javascript" , extraKeys : keymap });
		
		myCodeMirror.setSize({ width : (Get(textbox.cell.width) - 1) , height : Get(textbox.cell.height) });
		
		myCodeMirror.display.wrapper.style.position = "absolute";
		myCodeMirror.display.wrapper.style.top = Get(textbox.cell.top).toString() + "px";
		myCodeMirror.display.wrapper.style.left = (Get(textbox.cell.left) - 1).toString() + "px";
		//myCodeMirror.display.wrapper.style.width = (Get(textbox.cell.width) - 1).toString() + "px";
		//myCodeMirror.display.wrapper.style.height = Get(textbox.cell.height).toString() + "px";
		myCodeMirror.display.wrapper.style.border = "1px solid #c3c3c3"; // rgb(195,195,195)
		myCodeMirror.display.wrapper.style.borderTop = "0px";
		
		//myCodeMirror.style.position = "absolute";
		//myCodeMirror.style.top = Get(textbox.cell.top).toString() + "px";
		//myCodeMirror.style.left = (Get(textbox.cell.left) - 1).toString() + "px";
		//myCodeMirror.style.width = (Get(textbox.cell.width) - 1).toString() + "px";
		//myCodeMirror.style.height = Get(textbox.cell.height).toString() + "px";
		//myCodeMirror.style.border = "1px solid #c3c3c3"; // rgb(195,195,195)
		//myCodeMirror.style.borderTop = "0px";
		
		// this would recompile on every keystroke, which is difficult to handle (most edits will produce nonfunctional code, for starters)
		//myCodeMirror.on({type : "change" , func : function(instance, changeObj) { textbox.formula = instance.getInputField().innerText; }});
		
		myCodeMirror.getInputField().onfocus = function()
		{
			textbox.header.stroke = "rgb(0,0,0)";
			DrawCell(textbox.header);
			myCodeMirror.display.wrapper.style.border = "1px solid #000000";
			myCodeMirror.display.wrapper.style.borderTop = "0px";
		};
		myCodeMirror.getInputField().onblur = function()
		{
			textbox.header.stroke = "rgb(195,195,195)";
			DrawCell(textbox.header);
			myCodeMirror.display.wrapper.style.border = "1px solid #c3c3c3"; // rgb(195,195,195)
			myCodeMirror.display.wrapper.style.borderTop = "0px";
		};
		
		textbox.drawn = true;
	}
	
	DrawCell(textbox.header);
	
	if (textbox.selected != null)
	{
		var cell = textbox.selected;
		DrawActiveBorder("rgb(0,0,0)", Get(cell.left) - 1, Get(cell.top) - 1, Get(cell.right) - 1, Get(cell.bottom) - 1);
	}
}

//function OverTextbox(textbox)
//{
//	// deal with resizing and moving here, as with other header cells
//	
//	var mx = globals.mxi;
//	var my = globals.myi;
//	
//	if (mx < Get(textbox.left) || mx > Get(textbox.right) || my < Get(textbox.top) || my > Get(textbox.bottom)) { return; }
//	
//	var xMin = Get(textbox.left);
//	var xMax = Get(textbox.right);
//	var yMin = Get(textbox.top);
//	var yMid = Get(textbox.header.bottom);
//	var yMax = Get(textbox.bottom);
//	
//	if (xMin < mx && mx < xMax)
//	{
//		if (yMin < my && my < yMid)
//		{
//			return textbox.header.over(textbox.header);
//		}
//		else if (yMid < my && my < yMax)
//		{
//			return textbox.cell.over(textbox.cell);
//		}
//		else if (my == yMin)
//		{
//			// move textbox
//		}
//		else if (my == yMid)
//		{
//			// resize cell top
//		}
//		else if (my == yMax)
//		{
//			// resize cell bottom
//		}
//	}
//	else if (mx == xMin)
//	{
//		if (yMin < my && my < yMid)
//		{
//			// move textbox
//		}
//		else if (yMid < my && my < yMax)
//		{
//			// resize cell left
//		}
//		else if (my == yMin)
//		{
//			// move textbox
//		}
//		else if (my == yMid)
//		{
//			// resize cell top-left
//		}
//		else if (my == yMax)
//		{
//			// resize cell bottom-left
//		}
//	}
//	else if (mx == xMax)
//	{
//		if (yMin < my && my < yMid)
//		{
//			// move textbox
//		}
//		else if (yMid < my && my < yMax)
//		{
//			// resize cell right
//		}
//		else if (my == yMin)
//		{
//			// move textbox
//		}
//		else if (my == yMid)
//		{
//			// resize cell top-right
//		}
//		else if (my == yMax)
//		{
//			// resize cell bottom-right
//		}
//	}
//	
//	// see, we want Resize to be general here.  the problem in the case of textboxes is that we're resizing the cell, and we want that to flow back to the textbox dims
//	// but PositionTextbox doesn't work that way - the data flow it implements is from textbox to cell
//	// so we're at a temporary impasse
//	// textbox.headerHeight is the relevant variable
//	// maybe we just can't make Resize() general at the moment
//}

function PositionTextbox(textbox)
{
	MoveBox(textbox.header, "left", "width", Get(textbox.left));
	MoveBox(textbox.header, "width", "left", Get(textbox.width));
	MoveBox(textbox.header, "top", "height", Get(textbox.top));
	MoveBox(textbox.header, "height", "top", Get(textbox.headerHeight));
	
	MoveBox(textbox.cell, "left", "width", Get(textbox.left));
	MoveBox(textbox.cell, "width", "left", Get(textbox.width));
	MoveBox(textbox.cell, "top", "height", Get(textbox.header.bottom));
	MoveBox(textbox.cell, "bottom", "top", Get(textbox.bottom));
	
	//textbox.header.position(textbox.header);
	//textbox.cell.position(textbox.cell);
}

//function OnHoverTextboxBorder()
//{
//	var border = globals.hovered;
//	var cell = border["[parent]"];
//	
//	var origX = Get(globals.mx);
//	var origY = Get(globals.my);
//	
//	var lf = Get(cell.left);
//	var rt = Get(cell.right);
//	var tp = Get(cell.top);
//	var bt = Get(cell.bottom);
//	
//	var r = border.radius;
//	
//	border.resizeLf = false;
//	border.resizeRt = false;
//	border.resizeTp = false;
//	border.resizeBt = false;
//	
//	var cursors = [ "nwse" , "ew" , "nesw" , "ns" , null , "ns" , "nesw" , "ew" , "nwse" ];
//	var cursorIndex = 4;
//	
//	if (lf - r <= origX && origX <= lf + r)
//	{
//		border.resizeLf = true;
//		cursorIndex -= 3;
//	}
//	
//	if (rt - r <= origX && origX <= rt + r)
//	{
//		border.resizeRt = true;
//		cursorIndex += 3;
//	}
//	
//	if (tp - r <= origY && origY <= tp + r)
//	{
//		border.resizeTp = true;
//		cursorIndex -= 1;
//	}
//	
//	if (bt - r <= origY && origY <= bt + r)
//	{
//		border.resizeBt = true;
//		cursorIndex += 1;
//	}
//
//	if (border.resizeLf || border.resizeRt || border.resizeTp || border.resizeBt)
//	{
//		document.getElementById("myCanvas").style.cursor = cursors[cursorIndex] + "-resize";
//		Push("LD", BeginResize);
//		globals.redraw = true;
//	}
//}
//
//function DeHoverTextboxBorder()
//{
//	document.getElementById("myCanvas").style.cursor = "default";
//	Pop("LD");
//	globals.redraw = true;
//}
//
//function OnHoverTextbox(cell)
//{
//	//document.getElementById("myCanvas").style.cursor = "text";
//	Push("LD", Select);
//	//Push("LD", MouseSelectText);
//}
//
//function DeHoverTextbox(cell)
//{
//	//document.getElementById("myCanvas").style.cursor = "default";
//	Pop("LD");
//}
//
//function OnFocusTextbox(textbox)
//{
//	globals.focussed = textbox;
//	
//	//var switchHover = false;
//	//
//	//if (globals.hovered == cell)
//	//{
//	//	switchHover = true;
//	//	cell.dehover(cell);
//	//}
//	//
//	//cell.stroke = "rgb(0,0,0)";
//	//
//	//cell.onhover = OnHoverSelectedTextbox;
//	//cell.dehover = DeHoverSelectedTextbox;
//	//
//	//if (switchHover)
//	//{
//	//	cell.onhover(cell);
//	//}
//}
//
//function DeFocusTextbox(cell)
//{
//	globals.focussed = null;
//	
//	this.selected = null; // this is an asymmetry caused by the lack of calling EditActive from DeSelectCell
//	// we call EditActive from MouseSelectCell instead, and there is no corresponding off switch for that function
//	
//	//var switchHover = false;
//	//
//	//if (globals.hovered == cell)
//	//{
//	//	switchHover = true;
//	//	cell.dehover(cell);
//	//}
//	//
//	//cell.stroke = "rgb(128,128,128)";
//	//
//	//cell.onhover = OnHoverTextbox;
//	//cell.dehover = DeHoverTextbox;
//	//
//	//if (switchHover)
//	//{
//	//	cell.onhover(cell);
//	//}
//}
//
//function OnEditTextbox(cell)
//{
//	Push("Enter", AddChar);
//	Push("Tab", AddChar);
//	Push("Esc", AcceptEdit);
//	Push("Left", MoveCursorLeft);
//	Push("Right", MoveCursorRight);
//	Push("Up", MoveCursorUp);
//	Push("Down", MoveCursorDown);
//}
//
//function DeEditTextbox(cell)
//{
//	Pop("Enter");
//	Pop("Tab");
//	Pop("Esc");
//	Pop("Left");
//	Pop("Right");
//	Pop("Up");
//	Pop("Down");
//}
//
//function OnHoverSelectedTextbox(cell)
//{
//	document.getElementById("myCanvas").style.cursor = "text";
//	Push("LD", MouseSelectText);
//}
//
//function CtHoverSelectedTextbox(cell)
//{
//	document.getElementById("myCanvas").style.cursor = "text";
//}
//
//function DeHoverSelectedTextbox(cell)
//{
//	document.getElementById("myCanvas").style.cursor = "default";
//	Pop("LD");
//}
//
//function BeginResize()
//{
//	Push("MM", Resize);
//	Push("LU", EndResize);
//}
//
//function EndResize()
//{
//	Pop("MM");
//	Pop("LU");
//	var shape = globals.hovered;
//	if (shape.resizeLf) { delete shape.resizeLf }
//	if (shape.resizeRt) { delete shape.resizeRt }
//	if (shape.resizeTp) { delete shape.resizeTp }
//	if (shape.resizeBt) { delete shape.resizeBt }
//}
//
//function Resize()
//{
//	var shape = globals.hovered;
//	var currX = globals.mxi;
//	var currY = globals.myi;
//	if (shape.resizeLf) { MoveBox(shape, "left", "right", currX); }
//	if (shape.resizeRt) { MoveBox(shape, "right", "left", currX); }
//	if (shape.resizeTp) { MoveBox(shape, "top", "bottom", currY); }
//	if (shape.resizeBt) { MoveBox(shape, "bottom", "top", currY); }
//	shape.position(shape);
//	globals.redraw = true;
//}
//
//function ToggleTraceTextboxMode()
//{
//	if (globals.traceTextboxMode)
//	{
//		globals.canvas.buttons["ToggleTraceTextboxModeButton"].version = 0;
//		ExitTraceTextboxMode();
//		globals.traceTextboxMode = false;
//	}
//	else
//	{
//		globals.canvas.buttons["ToggleTraceTextboxModeButton"].version = 2;
//		EnterTraceTextboxMode();
//		globals.traceTextboxMode = true;
//	}
//}
//
//function EnterTraceTextboxMode()
//{
//	document.getElementById("myCanvas").style.cursor = "crosshair";
//	PushUnder("LD", BeginTraceTextbox);
//}
//
//function ExitTraceTextboxMode()
//{
//	document.getElementById("myCanvas").style.cursor = "default";
//	Pop("LD");
//	Pop("LU");
//}
//
//function BeginTraceTextbox()
//{
//	var origX = Get(globals.mx);
//	var origY = Get(globals.my);
//	
//	var frame = globals.canvas; // not necessarily globals.canvas
//	
//	var dataName = "Obj" + (globals.objcounts.obj++).toString();
//	var slot = MakeSlot(frame, dataName, "");
//	frame[dataName] = slot;
//	
//	var shapeName = "Textbox" + (globals.objcounts.textbox++).toString();
//	var textbox = MakeTextbox(frame, shapeName);
//	
//	SetTextboxSlot(textbox, slot);
//	
//	var TraceTextbox = function()
//	{
//		var currX = Get(globals.mx);
//		var currY = Get(globals.my);
//		
//		var lf = Math.min(origX, currX);
//		var rg = Math.max(origX, currX);
//		var tp = Math.min(origY, currY);
//		var bt = Math.max(origY, currY);
//		
//		//if (bt - tp > 20)
//		//{
//			MoveBox(textbox, "left", "width", lf);
//			MoveBox(textbox, "top", "height", tp);
//			MoveBox(textbox, "right", "left", rg);
//			MoveBox(textbox, "bottom", "top", bt);
//			textbox.position(textbox);
//			
//			globals.redraw = true;
//		//}
//	};
//	
//	Push("LU", EndTraceTextbox);
//	Push("Esc", EndTraceTextbox); // a safety valve for when a mouseup event is dropped and we're stuck in trace mode
//	Push("MM", TraceTextbox);
//}
//
//function EndTraceTextbox()
//{
//	globals.stream.push(globals.currstream);
//	
//	Pop("LU");
//	Pop("Esc");
//	Pop("MM");
//}
//
