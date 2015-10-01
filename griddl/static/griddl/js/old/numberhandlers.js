
//function OnHoverNumberBox()
//{
//	OnHoverCell(); // pseudo-inheritance
//	Push("RD", PrimeScrub);
//	Push("RU", DeactScrub);
//}
//
//function DeHoverNumberBox()
//{
//	DeHoverCell(); // pseudo-inheritance
//	Pop("RD");
//	Pop("RU");
//}

function OnHoverDigit(c)
{
	c.cell.onhover(c.cell);
	c.oldFill = c.fill;
	c.fill = "rgb(255,0,0)";
	globals.redraw = true;
	
	var Scroll = function()
	{
		var cell = c.cell;
		var slot = cell.slot;
		
		var newValue = Get(slot) + globals.delta * c.scale;
		slot.formula = newValue.toString(); // wait, so a scroll overrides a formula?  be careful...
		Set(slot, newValue); 
		
		cell.redisplay(cell);
		cell.position(cell);
		
		// synthesize a new mousemove because the underlying hover has changed (the char has regenerated)
		//Event("MM");
		
		globals.redraw = true;
	};
	
	Push("MW", Scroll);
}

function DeHoverDigit(c)
{
	c.cell.dehover(c.cell);
	c.fill = c.oldFill;
	globals.redraw = true;
	delete c.oldFill;
	Pop("MW");
}

function OnHoverNonDigit(c)
{
	var cell = c.cell;
	cell.onhover(cell); // if the cell is scrubbable, need to call OnHoverScrubbable
}

function DeHoverNonDigit(c)
{
	var cell = c.cell;
	cell.dehover(cell); // if the cell is scrubbable, need to call DeHoverScrubbable
}

function PrimeScrub()
{
	var Scrub = function()
	{
		Set(globals.fmx, Get(globals.mx));
		
		var cell = null;
		
		if (globals.hovered.type == "char")
		{
			cell = globals.hovered.cell;
		}
		else if (globals.hovered.type == "cell")
		{
			cell = globals.hovered;
		}
		
		globals.scrubOrigValue = Get(cell.slot);
	
		globals.scrubScale = 1;
	
		var scrubValue = globals.scrubOrigValue + globals.scrubScale * (Get(globals.mx) - Get(globals.fmx));
		
		Set(cell.slot, scrubValue);
		
		cell.redisplay(cell);
	};
	
	Push("MM", Scrub);
}

function DeactScrub()
{
	Pop("MM");
}

function IsDigit(c)
{
	if (c == "0" || c == "1" || c == "2" || c == "3" || c == "4" || c == "5" || c == "6" || c == "7" || c == "8" || c == "9")
	{
		return true;
	}
	else
	{
		return false;
	}
}

