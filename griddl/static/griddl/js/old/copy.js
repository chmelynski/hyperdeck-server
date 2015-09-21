
function Copy()
{
	// definitely copy to internal clipboard for pasting within the program
	// for pasting outside the program, we'll need to follow some variant of this procedure:
	// 1. on Ctrl, convert selection to text and fill a hidden textbox (we can have a brace of 12 or something) with the text, and select it
	// 2. then on C, we can fill the internal clipboard with that same text - the browser/OS will hijack the Ctrl+C combo and copy the text in the hidden textbox
	
	// the downside of this is that we have to convert the selection to text on every Ctrl, on the off chance it may be followed by C
	// this is inefficient, possibly fatally if the selection is large
	
	// yet another issue involves the various structures that can be copied, and how to store them and paste them correctly
	// for instance, we could paste into a different structure and do the structural conversion automatically
	
	//var text = "foo\tbar";
	//window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
	// this prompt textbox is hidden/displayed independently of any Ctrl+C/Ctrl+V actions
	// but it always displays the current clipboard
	// so to paste something from the outside, display the textbox, then focus on it and paste in from the external clipboard
	// that will overwrite globals.clipboard
	// then focus on the canvas, and hit Ctrl+V to paste
	
	if (globals.beingEdited)
	{
		var cell = globals.beingEdited;
		
		var min = Math.min(cell.anchor, cell.cursor);
		var max = Math.max(cell.anchor, cell.cursor);
		
		var s = "";
		
		for (var i = min; i < max; i++)
		{
			s += cell.contents[i + 1].c;
		}
		
		globals.clipboard = s;
		//globals.clipboardType = "string";
		
		return;
	}
	
	var focussed = globals.focussed;
	
	if (focussed) // select whole cells
	{
		var type = focussed["[type]"];
		
		if (type == "Grid")
		{
			var grid = focussed;
			var minCol = Math.min(grid.anchor.col, grid.cursor.col);
			var maxCol = Math.max(grid.anchor.col, grid.cursor.col);
			var minRow = Math.min(grid.anchor.row, grid.cursor.row);
			var maxRow = Math.max(grid.anchor.row, grid.cursor.row);
			
			var s = "";
			
			for (var rowi = minRow; rowi <= maxRow; rowi++)
			{
				for (var colj = minCol; colj <= maxCol; colj++)
				{
					s += grid.GetCell(rowi, colj).string;
					
					if (colj < maxCol)
					{
						s += "\t";
					}
				}
				
				s += "\n";
			}
			
			globals.clipboard = s;
			
			return;
		}
		else if (type == "Tree")
		{
		
		}
		else if (type == "Cell") // this is a textbox.  for some reason we have the type as cell
		{
			globals.clipboard = focussed.string;
			return;
		}
	}
}

function Paste(e)
{
	// here the trickiness is in distinguishing interal clipboards from the system clipboard
	// for instance, if we overwrite the system clipboard from an external program and then switch to the app, we'll need to know the system clipboard is the active one
	
	//AddText(e.clipboardData);
	
	if (globals.beingEdited)
	{
		AddText(globals.clipboard);
		return;
	}
	
	if (globals.focussed)
	{
		var type = globals.focussed["[type]"];
		
		if (type == "Grid")
		{
			var grid = globals.focussed;
			
			var n = 0; // debug here - we need to figure out the active cell and such
		}
	}
}

function Cut()
{
	Copy();
	DeleteGeneral();
}

function DeleteGeneral()
{
	// this needs to be able to delete cells in a grid or selected text or anything
}

function Undo()
{
	// two possibilities for implementation here
	// 1. an action also generates code to undo itself if necessary (very difficult)
	// 2. on undo, we re-generate the environment by re-loading the last .json snapshot and then applying the .js changes except for the last one
	
	// the first requires some intelligence to generate appropriate undo code, the second option is inefficient
}

function Redo()
{

}

