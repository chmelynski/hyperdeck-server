
function Traverse()
{
	var allobjs = [];
	
	var focus = globals.canvas;
	
	allobjs.push(focus);
	
	var TraverseRec = function (list, obj)
	{
		for (var key in obj)
		{
			var val = obj[key];
			var type = typeof(val);
			
			if (val == null)
			{
			
			}
			else if (type == "object")
			{
				if (val["[parent]"] == obj && val["[name]"] == key)
				{
					list.push(val);
					TraverseRec(list, val);
				}
			}
		}
	};
	
	TraverseRec(allobjs, focus);
	
	return allobjs;
}

function GetObjById(id)
{
	var all = Traverse();
	
	for (var i = 0; i < all.length; i++)
	{
		var obj = all[i];
		
		if (obj["[id]"] == id)
		{
			return obj;
		}
	}
	
	return null;
}

function GetObjsByName(name)
{
	var all = Traverse();
	
	var result = [];
	
	for (var i = 0; i < all.length; i++)
	{
		var obj = all[i];
		
		if (obj["[name]"] == name)
		{
			result.push(obj);
		}
	}
	
	return result;
}

function GetObjsByType(type)
{
	var all = Traverse();
	
	var result = [];
	
	for (var i = 0; i < all.length; i++)
	{
		var obj = all[i];
		
		if (obj["[type]"] == type)
		{
			result.push(obj);
		}
	}
	
	return result;
}

function ObjToString(obj)
{
	if (obj == null)
	{
		return "null";
	}
	else if (typeof(obj) == "string")
	{
		// escape \t and \r and \n
	}
	else
	{
		return obj.toString();
	}
}

function CogsHeader()
{
	var s = "";
	s += "[id]";
	s += "\t";
	s += "type";
	//s += "\t";
	//s += "state";
	s += "\t";
	s += "ptrname";
	s += "\t";
	s += "[obj]/pout";
	s += "\t";
	s += "f";
	s += "\t";
	s += "args...";
	return s;
}

function PrintCogs()
{
	var lines = [];
	
	var all = Traverse();
	
	var Codesanguinious = function(focus, field)
	{
		var s = null;
		
		if (field["[parent]"] == focus["[parent]"]) // if they are part of the same group of code
		{
			s = "{" + field["[name]"] + "}";
		}
		else
		{
			//s = field["[id]"].toString();
			s = LinkStringFromGlobals(field);
		}
		
		return s;
	};
	
	for (var i = 0; i < all.length; i++)
	{
		var obj = all[i];
		
		if (obj.act && obj["[parent]"]["[name]"] == "code")
		{
			var s = "";
			
			s += obj["[id]"].toString();
			//s += "\t";
			//s += obj["[name]"].toString();
			//s += "\t";
			//s += obj["[parent]"]["[id]"].toString();
			s += "\t";
			s += LinkStringFromGlobals(obj);
			s += "\t";
			s += MachineDict[obj.type].toString();
			//s += "\t";
			//s += StateDict[obj.state].toString();
			
			s += "\t";
			if (obj.type == Machine.Pointer)
			{
				if (obj.$ !== null)
				{
					s += obj.name;
				}
			}
			
			//if (obj.type == Machine.Slot)
			//{
			//	s += "\t";
			//	s += ObjToString(obj.$);
			//}
			
			s += "\t";
			if (obj.type == Machine.Pointer)
			{
				if (obj.$ !== null)
				{
					s += Codesanguinious(obj, obj.$);
				}
			}
			
			if (obj.type == Machine.Exp)
			{
				s += "\t";
				s += Codesanguinious(obj, obj.pout);
				s += "\t";
				s += Codesanguinious(obj, obj.f);
				s += "\t";
				
				s += "[ ";
				
				for (var k = 0; k < obj.args.length; k++)
				{
					s += Codesanguinious(obj, obj.args[k]);
					
					if (k < obj.args.length - 1)
					{
						s += " , ";
					}
				}
				
				s += " ]";
			}
			else if (obj.type == Machine.Control)
			{
			
			}
			else if (obj.type == Machine.Constraint)
			{
			
			}
			
			lines.push(s);
		}
	}
	
	return lines;
}

function EdgesHeader()
{
	return "[id]" + "\t" + "src" + "\t" + "dst" + "\t" + "label";
}

function PrintEdges()
{
	var lines = [];
	
	var all = GetObjsByType("Edge");
	
	for (var i = 0; i < all.length; i++)
	{
		var obj = all[i];
		var s = "";
		s += obj["[id]"].toString();
		s += "\t";
		//s += obj.src["[type]"] == "Node" ? obj.src.contents["[id]"].toString() : obj.src["[id]"].toString();
		s += obj.src["[type]"] == "Node" ? LinkStringFromGlobals(obj.src.contents) : LinkStringFromGlobals(obj.src);
		s += "\t";
		//s += obj.dst["[type]"] == "Node" ? obj.dst.contents["[id]"].toString() : obj.dst["[id]"].toString();
		s += obj.dst["[type]"] == "Node" ? LinkStringFromGlobals(obj.dst.contents) : LinkStringFromGlobals(obj.dst);
		s += "\t";
		s += obj.label.toString();
		lines.push(s);
	}
	
	return lines;
}

function CodeHeader()
{
	return "[id]" + "\t" + "slot id" + "\t" + "slot state" + "\t" + "formula" + "\t" + "slot fullname";
}

function PrintCode()
{
	var lines = [];
	
	var all = GetObjsByName("code");
	
	for (var i = 0; i < all.length; i++)
	{
		var obj = all[i];
		var s = "";
		s += obj["[id]"].toString();
		s += "\t";
		s += obj["[parent]"]["[id]"].toString();
		s += "\t";
		s += StateDict[obj["[parent]"].state];
		s += "\t";
		s += '="' + obj["[parent]"].formula + '"';
		s += "\t";
		s += LinkString(obj["[parent]"]);
		lines.push(s);
	}
	
	return lines;
}

function DumpAllObjs()
{
	var l = [];
	
	for (var i = 0; i < globals.allobjs.length; i++)
	{
		var obj = globals.allobjs[i];
		
		var s = "";
		
		if (obj !== undefined)
		{
			s += obj["[id]"].toString();
			s += "\t";
			s += LinkString(obj);
		}
		
		l.push(s);
	}
	
	return l;
}

function DumpCogs()
{
	var l = PrintCogs();
	InsertAt(CogsHeader(), l, 0);
	SaveRemoteLines("cogs.txt", l);
}

function DumpEdges()
{
	var l = PrintEdges();
	InsertAt(EdgesHeader(), l, 0);
	SaveRemoteLines("edges.txt", l);
}

function DumpCode()
{
	var l = PrintCode();
	InsertAt(CodeHeader(), l, 0);
	SaveRemoteLines("code.txt", l);
}

function DumpLog()
{
	SaveRemoteLines("log.txt", globals.log);
}

function DumpEdgesToDot()
{
	var lines = [];
	
	lines.push("digraph G {");
	lines.push("node [shape=box];");
	
	var all = GetObjsByType("Edge");
	
	for (var i = 0; i < all.length; i++)
	{
		var obj = all[i];
		
		var src = obj.src["[type]"] == "Node" ? obj.src.contents["[id]"].toString() : obj.src["[id]"].toString();
		var dst = obj.dst["[type]"] == "Node" ? obj.dst.contents["[id]"].toString() : obj.dst["[id]"].toString();
		
		//var src = obj.src["[type]"] == "Node" ? LinkStringFromGlobals(obj.src.contents) : LinkStringFromGlobals(obj.src);
		//var dst = obj.dst["[type]"] == "Node" ? LinkStringFromGlobals(obj.dst.contents) : LinkStringFromGlobals(obj.dst);
		
		var label = obj.label.toString();
		
		var line = '"' + src + '" -> "' + dst + '" [label="' + label + '"];';
		
		lines.push(line);
	}
	
	lines.push("}");
	
	SaveRemoteLines("edges.dot", lines);
}

function PrintCoords(obj)
{
	var lines = [];
	
	lines.push("lf = " + Get(obj.left));
	lines.push("cx = " + Get(obj.cx));
	lines.push("rt = " + Get(obj.right));
	lines.push("wd = " + Get(obj.width));
	lines.push("wr = " + Get(obj.wr));
	lines.push("tp = " + Get(obj.top));
	lines.push("cy = " + Get(obj.cy));
	lines.push("bt = " + Get(obj.bottom));
	lines.push("hg = " + Get(obj.height));
	lines.push("hr = " + Get(obj.hr));
	
	return lines.join("\n");
}

