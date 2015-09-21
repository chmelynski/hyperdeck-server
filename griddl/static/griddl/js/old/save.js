
function Save()
{
	SaveCanvasToFrceScript();
}

function SaveLinear()
{
	// if nothing is selected, save the whole canvas - otherwise save the data underlying the selected object
	
	var obj = null;
	
	if (globals.focussed)
	{
		// for now, we can't do this, because the focussed element is NOT the root of everything we want to save - a grid, for example, has a *parallel* data object
		// ok, so a possible solution is to also nullify the parent of the data object.  but we maybe need to think on that a bit
		throw new Error();
		obj = globals.focussed;
	}
	else
	{
		obj = globals.canvas;
	}
	
	var lines = SerializeLinear(obj);
	var filename = obj["[name]"] + " - " + Date.now().toString() + ".js";
	var blob = lines.join("\r\n") + "\r\n";
	SaveRemote(blob, filename);
}

function SaveCanvasToFrceScript()
{
	var obj = globals.canvas;
	var lines = [];
	lines.push("");
	lines.push("(SetCanvas 'width' " + globals.canvasElement.width.toString() + ")");
	lines.push("(SetCanvas 'height' " + globals.canvasElement.height.toString() + ")");
	lines.push("");
	SaveObjToFrce(lines, obj);
	SaveLocalStr(null, lines.join("\n") + "\n");
}

function SaveObjToFrce(lines, obj)
{
	var keys = PublicKeys(obj);
	
	for (var i = 0; i < keys.length; i++)
	{
		var key = keys[i];
		var val = Get(obj[key]); // remember, if slots are part of a collection, they get passed through by this Get
		
		if (val)
		{
			var type = val["[type]"];
			
			if (type == "Collection")
			{
				SaveObjToFrce(lines, val);
			}
			else if (type == "Grid")
			{
				SaveGridToFrce(lines, val);
			}
			else if (type == "Boxtree" || type == "Indentree" || type == "Rootree")
			{
				SaveTreeToFrce(lines, val);
			}
			else if (type == "Textbox")
			{
				SaveTextToFrce(lines, val);
			}
			else
			{
				// for now, do nothing
			}
		}
	}
}

function SaveGridToFrce(lines, grid)
{
	var s = "";
	
	s += "@grid";
	s += " ";
	s += grid.rowsAre;
	s += " ";
	s += grid["[name]"];
	
	lines.push(s);
	s = "";
	
	s += grid.obj["[name]"];
	
	if (grid.rowsAre == "objs")
	{
		for (var i = 0; i < grid.flds.length; i++)
		{
			s += "\t";
			s += grid.flds[i];
		}
	}
	else if (grid.rowsAre == "fields")
	{
		for (var i = 0; i < grid.objs.length; i++)
		{
			s += "\t";
			s += grid.objs[i];
		}
	}
	else
	{
		throw new Error();
	}
	
	lines.push(s);
	s = "";
	
	for (var i = 1; i < grid.nRows; i++)
	{
		if (grid.rowsAre == "objs")
		{
			s += grid.objs[i - 1];
		}
		else if (grid.rowsAre == "fields")
		{
			s += grid.flds[i - 1];
		}
		else
		{
			throw new Error();
		}
		
		for (var j = 1; j < grid.nCols; j++)
		{
			var cell = grid.GetCell(i, j);
			var slot = cell.slot;
			var formula = slot.formula;
			s += "\t";
			s += formula;
		}
		
		lines.push(s);
		s = "";
	}
	
	lines.push("");
	
	var gridname = grid["[name]"];
	
	// (SetColWidths grid 200 100 300 400)
	s += "(SetColWidths " + gridname;
	for (var i = 0; i < grid.colSizes.length; i++)
	{
		s += " " + Get(grid.colSizes[i]).toString();
	}
	s += ")";
	lines.push(s);
	s = "";
	
	// (SetRowHeights grid 200 100 300 400)
	s += "(SetRowHeights " + gridname;
	for (var i = 0; i < grid.rowSizes.length; i++)
	{
		s += " " + Get(grid.rowSizes[i]).toString();
	}
	s += ")";
	lines.push(s);
	s = "";
	
	// grid.cells[2..4][1..3].numberFormat = 2
	
	// (MoveObj grid 'left' 200 'top' 200)
	
	s = "(MoveObj " + gridname + " 'left' " + Get(grid.left).toString() + " 'top' " + Get(grid.top).toString() + ")";
	lines.push(s);
	lines.push("");
}

function SaveTreeToFrce(lines, tree)
{
	var s = "";
	
	s += "@tree";
	s += " ";
	s += tree["[type]"];
	s += " ";
	s += tree["[name]"];
	
	lines.push(s);
	s = "";
	
	for (var i = 0; i < tree.cells.length; i++)
	{
		var indent = tree.indents[i];
		
		for (var k = 0; k < indent; k++)
		{
			s += "  ";
		}
		
		var cell = tree.cells[i];
		
		s += cell.slot.formula;
		
		lines.push(s);
		s = "";
	}
	
	lines.push("");
	
	// outer loop through all possible properties of the sub cells
	//   inner loop through the indices of the sub cells (i.e., the keys of tree.cells)
	// this way, we can compress the indices of the inner loop into range constructs like tree.cells[3..8].width = 500
	// so we look for identical values for these cell fields, and group them
	// then generate one line for each different value
	// we can put disjoint sets: tree.cells[3,6,8,10].width = 500
	// or, we could output a table of fields for all cells.  this would be readable and a-la-mode d'app, but wordy
	
	var treename = tree["[name]"];
	var keys = [ 'width' , 'height' ];
	
	for (var i = 0; i < tree.cells.length; i++)
	{
		for (var k = 0; k < keys.length; k++)
		{
			var key = keys[k];
			s = treename + ".cells[" + i.toString() + "]." + key + " := " + Get(tree.cells[i][key]);
			lines.push(s);
		}
	}
	
	lines.push("");
	s = "(MoveTree " + treename + " 'cx' " + Get(tree.root.cell.cx).toString() + " 'cy' " + Get(tree.root.cell.cy).toString() + ")";
	lines.push(s);
	lines.push("");
}

function SaveTextToFrce(lines, text)
{
	var s = "";
	
	s += "@text";
	s += " ";
	s += text.cell.slot["[name]"]; // which should equal text.header.string
	s += " ";
	s += text["[name]"];
	
	lines.push(s);
	lines.push(text.cell.string);
	lines.push("@end");
	lines.push("");
	s = "(MoveObj " + text["[name]"] + " 'width' " + Get(text.width).toString() + " 'height' " + Get(text.height).toString() + ")";
	lines.push(s);
	s = "(MoveObj " + text["[name]"] + " 'top' " + Get(text.top).toString() + " 'left' " + Get(text.left).toString() + ")";
	lines.push(s);
	lines.push("");
}

function LoadLinear(parent, url)
{
	// create a new script tag, set the src and let it load, then call PatchLinks
	
	// a problem here is that we can't change the name of the loaded object, and we can't control where it goes
	// what we need to do is name the parent object some global nonce, and then reference that
	// i mean, instead of the parent object being globals.canvas.Grid1, we just assign it to a global variable
	
	var script = document.createElement("script");
	script.setAttribute("type", "text/javascript");
	
	script.onload = function()
	{
		PatchLinks(x); // we call the loaded object 'x'
		globals.canvas = x; // again, until we resolve the parallel data obj problem, we only support saving of the full canvas
		x["[parent]"] = globals.canvas;
	}
	
	script.setAttribute("src", url);
	
	var body = document.getElementsByTagName("body")[0];
	body.appendChild(script);
}

function Load(parent, url)
{
	var xmlhttp = new XMLHttpRequest();
	
	xmlhttp.onreadystatechange = function()
	{
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
		{
			var obj = DeserializeObj(parent, xmlhttp.responseText);
			
			//var f = function()
			//{
			//	var s = SerializeObj(obj);
			//	SaveRemote(s, url); // we use the same URL
			//};
			//
			//Push("Ctrl+S", f);
		}
	}
	
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function LoadScript(parent, url)
{
	var xmlhttp = new XMLHttpRequest();
	
	xmlhttp.onreadystatechange = function()
	{
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
		{
			ReadScript(parent, xmlhttp.responseText);
			//callback();
		}
	}
	
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function SaveObj(obj, filename) // calls SerializeObj
{
	var s = SerializeObj(obj);
	SaveRemote(s, filename);
}

function SerializeObj(obj) // to JSON, calls SerializePrep and NullifyParents
{
	var parent = obj["[parent]"];
	
	SerializePrep(obj);
	NullifyParents(obj);
	
	var s = JSON.stringify(obj);
	
	// follow the same procedure as in DeserializeObj below
	DeserializeRec(obj); // undo all the link breaking
	obj["[parent]"] = parent;
	
	return s;
}

function SerializeLinear(obj) // calls SerializeRec
{
	var l = [];
	
	var parent = obj["[parent]"];
	//var name = obj["[name]"];
	//
	obj["[parent]"] = "sentinel";
	//obj["[name]"] = null;
	
	SerializeRec(l, obj);
	
	obj["[parent]"] = parent;
	//obj["[name]"] = name;
	
	return l;
}

function SerializeRec(l, obj)
{
	// this produces lines of .js code to be loaded and executed
	// a nice feature is that we don't destructively overwrite links in the original objs during prep - it's read-only
	
	var lhs = LinkString(obj);
	
	var line = lhs + " = ";
	
	if (obj.constructor == Array) // i guess this is as good a test as any
	{
		line += "[];";
	}
	else
	{
		line += "{};";
	}
	
	l.push(line);
	
	for (var key in obj)
	{
		var val = obj[key];
		var type = typeof(val);
		
		line = lhs + "['" + key + "'] = ";
		
		var addLine = true;
		
		if (type == "object")
		{
			if (val == null)
			{
				// in serialization, null acts the same as a primitive type - but javascript says null is of type "object", so here we are
				line += "null;";
			}
			else if (val.toString() == "[object HTMLImageElement]")
			{
				line += "{ '[img]' : '" + val.src.substring(21) + "' };"; // regenerate full Image object later - the .substring(21) cuts off 'http://localhost:713/'
			}
			else
			{
				if (val["[parent]"] == obj)
				{
					SerializeRec(l, val);
					addLine = false;
				}
				else
				{
					line += "{ '[link]' : \"" + LinkString(val) + "\" };";
				}
			}
		}
		else if (type == "function")
		{
			if (key == "f") // this is the filter we use to capture Function objects
			{
				line += "null;"; // eliminate Function objects - then regenerate them during deserialization by calling Function(body)
			}
			else if (key == "img") // wait, is this necessary now that we have the whole [object HTMLImageElement] above?
			{
				line += "{ '[img]' : '" + val.src.substring(21) + "' };"; // regenerate full Image object later - the .substring(21) cuts off 'http://localhost:713/'
			}
			else
			{
				line += "{ '[link]' : '" + val.name + "' };"; // assume this is a link to a global function
			}
		}
		else if (type == "undefined")
		{
			line += "undefined";
		}
		else
		{
			if (typeof(val) == "string")
			{
				line += "'" + val.toString() + "';";
			}
			else
			{
				line += val.toString() + ";";
			}
		}
		
		if (addLine)
		{
			l.push(line);
		}
	}
}

function DeserializeObj(parent, str)
{
	var obj = JSON.parse(str);
	
	parent[obj["[name]"]] = obj; // this is so internal links can be resolved correctly
	DeserializeRec(obj);
	obj["[parent]"] = parent; // order matters - this line causes a stack overflow if it occurs before DeserializeRec
	
	return obj;
}

function PatchLinks(obj)
{
	// this patches a loaded linear .js file
	
	obj["[id]"] = globals.id++;
	
	for (var key in obj)
	{
		var val = obj[key];
		var type = typeof(val);
		
		if (type == "object")
		{
			if (val == null)
			{
			
			}
			else
			{
				if (val["[link]"])
				{
					obj[key] = eval(val["[link]"]);
				}
				else if (val["[img]"])
				{
					obj[key] = new Image();
					obj[key].src = val["[img]"];
				}
				else
				{
					PatchLinks(val);
					
					//val["[parent]"] = obj; // this must come *after* DeserializeRec - it causes a 2-node infinite loop between obj and val if not
					//val["[name]"] = key;
				}
			}
		}
	}
}

function DeserializeRec(obj)
{
	// this patches a loaded .json file
	
	obj["[id]"] = globals.id++;
	
	for (var key in obj)
	{
		var val = obj[key];
		var type = typeof(val);
		
		if (type == "object")
		{
			if (val == null)
			{
			
			}
			else
			{
				if (val["[link]"])
				{
					obj[key] = eval(val["[link]"]);
				}
				else if (val["[img]"])
				{
					obj[key] = new Image();
					obj[key].src = val["[img]"];
				}
				else
				{
					DeserializeRec(val);
					
					val["[parent]"] = obj; // this must come *after* DeserializeRec - it causes a 2-node infinite loop between obj and val if not
					val["[name]"] = key;
				}
			}
		}
	}
}

function NullifyParents(obj)
{
	if (obj["[parent]"])
	{
		delete obj["[parent]"];
	}
	else
	{
		return;
	}
	
	var keys = [];
	
	for (var key in obj)
	{
		var val = obj[key];
		var type = typeof(val);
		
		if (type == "object")
		{
			if (val == null)
			{
			
			}
			else
			{
				NullifyParents(val);
			}
		}
	}
}

function SerializePrep(obj)
{
	var keys = [];
	
	for (var key in obj)
	{
		if (key == "[parent]") // plus key == "[id]", etc.
		{
			// skip
		}
		else
		{
			keys.push(key); // we do this because we assign to obj[key] below, and we don't want to do this in a 'for (var key in obj)' loop
		}
	}
	
	for (var i = 0; i < keys.length; i++)
	{
		var key = keys[i];
		var val = obj[key];
		var type = typeof(val);
		
		if (type == "object")
		{
			if (val == null)
			{
				// in serialization, null acts the same as a primitive type - but javascript says null is of type "object", so here we are
			}
			else if (val.toString() == "[object HTMLImageElement]")
			{
				obj[key] = { "[img]" : val.src }; // regenerate full Image object later
			}
			else
			{
				if (val["[parent]"] == obj)
				{
					SerializePrep(val);
				}
				else
				{
					obj[key] = { "[link]" : LinkString(val) };
				}
			}
		}
		else if (type == "function")
		{
			if (key == "f") // this is the filter we use to capture Function objects
			{
				obj[key] = null; // eliminate Function objects - then regenerate them during deserialization by calling Function(body)
			}
			else if (key == "img") // wait, is this necessary now that we have the whole [object HTMLImageElement] above?
			{
				obj[key] = { "[img]" : val.src }; // regenerate full Image object later
			}
			else
			{
				obj[key] = { "[link]" : val.name }; // assume this is a link to a global function
			}
		}
		else
		{
			// do nothing to primitive types
		}
	}
}

//function LinkString(obj)
//{
//	var parent = obj["[parent]"];
//	
//	var s = null;
//	
//	if (parent)
//	{
//		var n = obj["[name]"];
//		
//		if (!n)
//		{
//			throw new Error();
//		}
//		
//		s = LinkString(parent) + "['" + obj["[name]"] + "']";
//	}
//	else
//	{
//		if (obj == globals)
//		{
//			s = "globals";
//		}
//		else
//		{
//			throw new Error();
//		}
//	}
//	
//	return s;
//}

// this does not use a sentinel, and also uses . notation - the root of the chain is hardcoded to be 'globals' and the output is not meant to be read as .js
function LinkStringFromGlobals(obj)
{
	var parent = obj["[parent]"];
	
	var s = null;
	
	if (parent == globals)
	{
		s = "globals" + "." + obj["[name]"];
	}	
	else if (parent)
	{
		var n = obj["[name]"];
		
		if (!n)
		{
			throw new Error();
		}
		
		s = LinkStringFromGlobals(parent) + "." + obj["[name]"]; // "['" "']"
	}
	else
	{
		throw new Error();
	}
	
	return s;
}

// Save needs this version of LinkString
function LinkString(obj)
{
	var parent = obj["[parent]"];
	
	var s = null;
	
	if (parent == "sentinel")
	{
		s = "x";
	}
	else if (parent == globals)
	{
		s = "globals";
	}
	else if (parent)
	{
		var n = obj["[name]"];
		
		if (!n)
		{
			throw new Error();
		}
		
		s = LinkString(parent) + "['" + obj["[name]"] + "']";
	}
	else
	{
		throw new Error();
	}
	
	return s;
}

function Serialize()
{
	// no-nos in globals:
	//   HTMLCanvasElement canvasElement (canvas#myCanvas)
	//   CanvasRenderingContext2D g
	//   FileReader reader
	
	// we also need to not follow the trace into Function objects, but that's about it it seems
	
	var id = 0;
	var l = [];
	
	var IdRec = function(obj)
	{
		if (obj && typeof(obj) == "object" && !obj.id && !(obj instanceof CanvasRenderingContext2D) && !(obj instanceof FileReader) && !(obj instanceof HTMLCanvasElement))
		{
			obj.id = id++;
			l.push(obj);
			
			for (var key in obj)
			{
				IdRec(obj[key]);
			}
		}
	};
	
	IdRec(globals);
	
	var lines = [];
	lines.push("");
	lines.push("var a = new Array(" + l.length.toString() + ");");
	lines.push("");
	lines.push("for (var i = 0; i < a.length; i++)");
	lines.push("{");
	lines.push("\ta[i] = {};");
	lines.push("}");
	lines.push("");
	
	for (var i = 0; i < l.length; i++)
	{
		var obj = l[i];
		
		for (var key in obj)
		{
			var s = "a[" + i.toString() + "][\"" + key + "\"] = ";
			
			var val = obj[key];
			var type = typeof(val);
			
			if (type == "string")
			{
				s += '"' + SanitizeString(val) + '"';
			}
			else if (type == "number")
			{
				s += val.toString();
			}
			else if (type == "boolean")
			{
				s += val.toString();
			}
			else if (type == "undefined")
			{
				s += "undefined";
			}
			else if (type == "function")
			{
				s += val.name;
			}
			else if (type == "object")
			{
				if (val == null)
				{
					s += "null";
				}
				else if (val.id)
				{
					s += "a[" + val.id.toString() + "]";
				}
				else if (val instanceof CanvasRenderingContext2D)
				{
					s += "globals.g";
				}
				else if (val instanceof FileReader)
				{
					s += "globals.reader";
				}
				else if (val instanceof HTMLCanvasElement)
				{
					s += "globals.canvasElement";
				}
				else
				{
					throw new Error();
				}
			}
			else
			{
				throw new Error();
			}
			
			s += ";";
			lines.push(s);
		}
	}
	
	return lines;
}

