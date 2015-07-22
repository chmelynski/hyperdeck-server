
function DeleteAndPrimeTextEditAndAddChar()
{
	//var code = globals.event;
	//var charToAdd = globals.codeToCharMap[code];
	//PrimeTextEditCodeMirror(true, charToAdd);
}

function OffsetTop(elt)
{
	if (elt.offsetParent == document.body)
	{
		return elt.offsetTop;
	}
	else
	{
		return elt.offsetTop + OffsetTop(elt.offsetParent);
	}
}

function OffsetLeft(elt)
{
	if (elt.offsetParent == document.body)
	{
		return elt.offsetLeft;
	}
	else
	{
		return elt.offsetLeft + OffsetLeft(elt.offsetParent);
	}
}

function PlaceCodeMirror(parentElt, oldFocusElt, slot, str) // , mode?
{
	var top = OffsetTop(parentElt) + 1;
	var left = OffsetLeft(parentElt) + 1;
	
	var keymap = {};
	
	keymap["Esc"] = function (cm)
	{ 
		DeactTextEditCodeMirror(cm);
		oldFocusElt.focus();
	};
	
	keymap["Enter"] = function (cm)
	{
		AcceptEditCodeMirror(slot, cm);
		oldFocusElt.focus();
	};
	
	var cm = CodeMirror(document.body, { value : str , mode : "lisp" , extraKeys : keymap });
	cm.display.wrapper.style.position = "absolute";
	cm.display.wrapper.style.top = top.toString() + "px";
	cm.display.wrapper.style.left = left.toString() + "px";
	//cm.display.wrapper.style.width = (rt - left).toString() + "px";
	//cm.display.wrapper.style.height = (bt - top).toString() + "px";
	cm.display.wrapper.style.border = "1px solid #c3c3c3";
	
	//cm.setSize({ width : rt - left , height : bt - top });
	
	cm.focus();
	
	//var n = cm.getCursor();
	//var m = 0;
	cm.setCursor(cm.posFromIndex(Number.POSITIVE_INFINITY));
	//Set the cursor position. You can either pass a single {line, ch} object, or the line and the character as two separate parameters.
	
	//doc.posFromIndex(index: integer) → {line, ch}
	//Calculates and returns a {line, ch} object for a zero-based index who's value is relative to the start of the editor's text.
	//If the index is out of range of the text then the returned object is clipped to start or end of the text respectively.
}

function PrimeTextEditCodeMirror(bDeleteExistingText, charToAdd)
{
	var tp = null;
	var bt = null;
	var lf = null;
	var rt = null;
	
	var slot = null;
	
	var focussed = globals.focussed;
	
	if (focussed["[type]"] == "Grid")
	{
		var grid = focussed;
		
		lf = Get(grid.xs[grid.focusSelected.minCol]);
		rt = Get(grid.xs[grid.focusSelected.maxCol + 1]);
		tp = Get(grid.ys[grid.focusSelected.minRow]);
		bt = Get(grid.ys[grid.focusSelected.maxRow + 1]);
		
		// selecting the whole row or whole col must include headers!  this is because of an ambiguity when there is, say, only one data column in a grid
		// in that case, when you have a single cell selected, you also (necessarily) have a whole data row selected
		var wholeRow = grid.focusSelected.minCol == 0 && grid.focusSelected.maxCol == grid.nCols - 1;
		var wholeCol = grid.focusSelected.minRow == 0 && grid.focusSelected.maxRow == grid.nRows - 1;
		
		if (wholeRow && wholeCol)
		{
			slot = grid.obj;
		}
		else if (wholeRow)
		{
			if (grid.rowsAre == "objs")
			{
				slot = Get(grid.obj)[grid.objs[grid.focusSelected.minRow - 1]]; // we just assume that only one row is selected and take minRow
			}
			else
			{
				slot = grid.obj["[fieldSlots]"][grid.flds[grid.focusSelected.minRow - 1]];
			}
		}
		else if (wholeCol)
		{
			if (grid.rowsAre == "objs")
			{
				slot = grid.obj["[fieldSlots]"][grid.flds[grid.focusSelected.minCol - 1]];
			}
			else
			{
				slot = Get(grid.obj)[grid.objs[grid.focusSelected.minCol - 1]]; // we just assume that only one row is selected and take minRow
			}
		}
		else
		{
			slot = globals.selected.slot;
		}
	}
	else
	{
		slot = globals.selected.slot;
		lf = Get(globals.selected.left);
		rt = Get(globals.selected.right);
		tp = Get(globals.selected.top);
		bt = Get(globals.selected.bottom);
	}
	
	var str = bDeleteExistingText ? charToAdd : slot.formula;
	//PlaceCodeMirror(globals.selected.elt, str);
}

function AcceptEditCodeMirror(slot, cm)
{
	slot.formula = cm.getValue();
	CompileCode(slot, slot.formula);
	DeactTextEditCodeMirror(cm);
}

function DeactTextEditCodeMirror(cm)
{
	document.body.removeChild(cm.getWrapperElement());
}

