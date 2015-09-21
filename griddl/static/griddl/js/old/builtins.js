
function MakeBuiltins()
{
	globals["+"] = MakeSlot(globals, "+", function(args) { return args[0] + args[1]; });
	globals["-"] = MakeSlot(globals, "-", function(args) { return args[0] - args[1]; });
	globals["*"] = MakeSlot(globals, "*", function(args) { return args[0] * args[1]; });
	globals["/"] = MakeSlot(globals, "/", function(args) { return args[0] / args[1]; });
	globals["%"] = MakeSlot(globals, "%", function(args) { return args[0] % args[1]; });
	
	globals["sin"] = MakeSlot(globals, "sin", function(args) { return Math.sin(args[0]); });
	globals["cos"] = MakeSlot(globals, "cos", function(args) { return Math.cos(args[0]); });
	globals["tan"] = MakeSlot(globals, "tan", function(args) { return Math.tan(args[0]); });
	globals["max"] = MakeSlot(globals, "max", function(args) { return Math.max(args[0], args[1]); });
	globals["min"] = MakeSlot(globals, "min", function(args) { return Math.min(args[0], args[1]); });
	globals["pow"] = MakeSlot(globals, "pow", function(args) { return Math.pow(args[0], args[1]); });
	globals["exp"] = MakeSlot(globals, "exp", function(args) { return Math.exp(args[0]); });
	globals["ln"] = MakeSlot(globals, "ln", function(args) { return Math.log(args[0]); }); // 'log' conflicts with the debugging log
	globals["sqrt"] = MakeSlot(globals, "sqrt", function(args) { return Math.sqrt(args[0]); });
	globals["random"] = MakeSlot(globals, "random", function(args) { return Math.random(); });
	globals["atan2"] = MakeSlot(globals, "atan2", function(args) { return Math.atan2(args[0], args[1]); });
	
	globals["len"] = MakeSlot(globals, "len", function(args) { return args[0].length; }); // we can't have array.length, because length is not a slot.  so we do this
	
	globals[":="] = MakeSlot(globals, ":=", function (args) { return args[0]; });
	
	globals["cat"] = MakeSlot(globals, "cat", Concatenate);
	globals["mn"] = MakeSlot(globals, "mn", MakeMusicNode);
	//globals["list"] = MakeSlot(globals, "list", List);
	globals["enum"] = MakeSlot(globals, "enum", Enum); // 'enum' is a keyword
	
	globals["ReadWav"] = MakeSlot(globals, "ReadWav", function (args) { if (args[0] == null) { return null; } else { return ReadWav(args[0]); } });
	
	var fns = [
	//DrawBox
	//,DrawLine
	//,DrawLineSeg
	//,DrawText
	//,DrawImage
	//,DrawPath
	//,DrawLinepath
	//,DrawPolygon
	//,DrawBezier
	//,DrawArc
	//,DrawActiveBorder
	//,DrawPointBorder
	//,DrawContents
	//,DrawContent
	MoveObj
	,MoveTree
	,ReadBytes
	,Red
	,DrawWave
	,Piano
	,Drum
	,Guitar
	,Violin
	,FM2
	,EmptyObj
	,map
	,SetFieldSlot
	,LoadMusicModule
	,SetCanvas
	,SetColWidths
	,SetRowHeights
	];
	
	for (var i = 0; i < fns.length; i++)
	{
		globals[fns[i].name] = MakeSlot(globals, fns[i].name, fns[i]);
	}
}

function SetFieldSlot(args)
{
	var data = args[0];
	var fieldName = args[1];
	var formula = args[2];
	
	var dataSlot = args[0]["[parent]"]; // we want the slot here, but we pass in the obj (because it is eval'ed as an argument)
	
	var fieldSlots = dataSlot["[fieldSlots]"];
	var fieldSlot = MakeSlot(fieldSlots, fieldName, null);
	fieldSlots[fieldName] = fieldSlot;
	
	fieldSlot.formula = formula;
	fieldSlot.react = ReactToFieldSlotChange;
	
	DistributeFieldFormula(data, fieldName, formula);
}

function MoveObj(args)
{
	var obj = args[0];
	
	for (var i = 1; i < args.length; i += 2)
	{
		//Set(obj[args[i]], args[i + 1]);
		obj[args[i]].$ = args[i + 1];
		if (obj[args[i]].react) { obj[args[i]].react(); };
	}
	
	//Calculate();
	
	obj.position(obj);
	
	// now we need to translate all coords to the html shapes
}

function Enum(args)
{
	var n = args[0];
	
	var result = [];
	
	for (var i = 0; i < n; i++)
	{
		result.push(i);
	}
	
	return result;
}

function map(args)
{
	var f = args[0];
	var l = args[1];
	
	var result = {}; // perhaps this should be a {} - also, [parent] and [name] will have to be added somewhere else
	result["[type]"] = "Collection";
	
	var i = 0;
	
	while (l[i] !== undefined) // this is a stupid hack to accept {}'s with "0", "1", "2", fields (the {}'s are not []'s, so they don't have .length)
	{
		var x = Get(l[i]);
		var y = f(x); // we might have to introspect on f to see what type of function it is
		AddBracketFields(y, result, i.toString());
		result[i] = y;
		i++;
	}
	
	return result;
}

function EmptyObj(args)
{
	var slot = MakeSlot(null, null, null);
	var obj = MakeObj(slot, "$");
	slot.$ = obj;
	return slot; 
}

function MoveTree(args)
{
	var tree = args[0];
	
	var rootCell = tree.root.contents;
	
	for (var i = 1; i < args.length; i += 2)
	{
		Set(rootCell[args[i]], args[i + 1]);
	}
	
	tree.position(tree);
}

function Concatenate(args)
{
	var s = "";
	
	for (var i = 0; i < args.length; i++)
	{
		s += args[i].toString();
	}
	
	return s;
}

function ReadBytes(args)
{
	var obj = args[0];
	var filename = args[1];
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.responseType = "arraybuffer"; // we specify this so that binary data is returned
	
	xmlhttp.onreadystatechange = function()
	{
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
		{
			var arrayBuffer = xmlhttp.response; // note: not 'responseText'
			var byteArray = new Uint8Array(arrayBuffer);
			Set(obj.bytes, byteArray); // 'bytes' is retardedly hardcoded, because we can't pass in a slot, because we Get() the slot before calling - we should add & to the language
		}
	};
	
	xmlhttp.open("GET", filename, true);
	xmlhttp.send();
}

function SetCanvas(args)
{
	var field = args[0];
	var value = args[1];
	
	//globals.canvasElement[field] = value;
}

function SetColWidths(args)
{
	var grid = args[0];
	
	for (var i = 1; i < args.length; i++)
	{
		grid.colSizes[i - 1] = args[i];
	}
}

function SetRowHeights(args)
{
	var grid = args[0];
	
	for (var i = 1; i < args.length; i++)
	{
		grid.rowSizes[i - 1] = args[i];
	}
}

