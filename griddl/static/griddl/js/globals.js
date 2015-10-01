
function GlobalsDriver() {
	// set it to redraw after the last scroll - might need to overwrite the timer on each scroll event, so that only the last one applies
	//window.onscroll = function (e) { globals.redraw = true; }; // function (e) { setInterval(100, function() { globals.redraw = true; }); };
	
	globals = {};
	
	//globals.canvasElement = document.getElementById("myCanvas");
	//globals.g = globals.canvasElement.getContext("2d");
	//globals.canvasLeft = 0;
	//globals.canvasTop = 0;
	//globals.canvasElement.focus();
	//globals.canvasElement.onkeydown = KeyDown;
	//globals.canvasElement.onkeyup = KeyUp;
	//globals.canvasElement.onmousedown = MouseDown;
	//globals.canvasElement.onmouseup = MouseUp;
	//globals.canvasElement.onmousemove = MouseMove;
	//globals.canvasElement.onmousewheel = MouseWheel;
	
	globals.id = 0;
	globals.tabIndex = 0; // we might need dynamic management of tabindexes, as elements are added/removed
	
	//globals.clearedCanvas = true;
	
	globals.calculate = true;
	globals.redraw = true;
	
	globals.tick = Render;
	
	// we put cogs in these queues for processing - also, each cogNode has an inQueue bool, to prevent duplicates (grids and cells incidentally get assigned inQueue fields as well)
	globals.calculationRound = -1;
	globals.queue = [];
	globals.newqueue = [];
	globals.blankingMode = false;
	
	globals.logging = false;
	globals.addToLog = false;
	globals.log = [];
	globals.logStart = 0;
	globals.logDisplayLines = 40;
	globals.allobjs = [];
	
	// for undo.redo
	globals.currstream = null;
	globals.stream = [];
	
	globals.canvas = MakeObj(globals, "canvas");
	//globals.canvas["[draw]"] = "children";
	//globals.canvas.data = globals;
	//globals.canvas.position = PositionFrame;
	globals.canvas["[type]"] = "Collection";
	//globals.canvas.draw = DrawFrame;
	//globals.canvas.over = OverFrame; // OverRec is also good
	
	//var img1 = new Image(); // HTML5 Constructor
	//img1.src = 'image1.png';
	//img1.alt = 'alt';
	
	
	// we need to put the function name in the #id's of the <a>'s, and then bind automatically
	// for this, we need a function namespace so we can do bind(<a>, namespace[a.id])
	var menubarFunctionDict = {};
	
	//menubarFunctionDict['New Blank Canvas'] = null;
	//menubarFunctionDict['Load Local (Replace current canvas)'] = LoadLocalReplace;
	//menubarFunctionDict['Load Remote (Replace current canvas)...'] = LoadRemoteReplace;
	//menubarFunctionDict['Load Local Into Current Canvas'] = LoadLocalIntoCanvas;
	//menubarFunctionDict['Load Remote Into Current Canvas...'] = LoadRemoteIntoCanvas;
	//menubarFunctionDict['Load Local Into Cell'] = LoadLocalIntoCell;
	//menubarFunctionDict['Load Remote Into Cell...'] = LoadRemoteIntoCell;
	//menubarFunctionDict['Save Local'] = SaveCanvasLocal;
	//menubarFunctionDict['Save Remote...'] = SaveCanvasRemote;
	//menubarFunctionDict['Save Component (Local)'] = SaveComponentLocal;
	//menubarFunctionDict['Save Component (Remote)...'] = SaveComponentRemote;
	//menubarFunctionDict['Export Canvas as PNG (Local)'] = SaveAsPng;
	//menubarFunctionDict['Export Canvas to Excel (Local)'] = ExportToExcel;
	
	//menubarFunctionDict['Trace New Textbox'] = EnterTraceGridMode;
	//menubarFunctionDict['Trace New Grid'] = EnterTraceTextboxMode;
	//menubarFunctionDict['Place New Root Tree'] = PlaceNewRootree;
	//menubarFunctionDict['Place New Indent Tree'] = PlaceNewIndentree;
	//menubarFunctionDict['Place New Box Tree'] = PlaceNewBoxtree;
	//menubarFunctionDict['New Frame'] = PlaceNewFrame;
	//menubarFunctionDict['Delete Component'] = DeleteComponent;
	
	//menubarFunctionDict['Cut'] = Cut;
	//menubarFunctionDict['Copy'] = Copy;
	//menubarFunctionDict['Paste'] = Paste;
	//menubarFunctionDict['Show Clipboard'] = ShowClipboard;
	//menubarFunctionDict['Undo'] = Undo;
	//menubarFunctionDict['Redo'] = Redo;
	
	//menubarFunctionDict['Dump All Objs'] = DumpAllObjs;
	//menubarFunctionDict['Dump Cogs'] = DumpCogs;
	//menubarFunctionDict['Dump Edges'] = DumpEdges;
	//menubarFunctionDict['Dump Code'] = DumpCode;
	//menubarFunctionDict['Dump Log'] = DumpLog;
	
	//menubarFunctionDict['Add Decimal Place'] = AddDecimalPlace;
	//menubarFunctionDict['Remove Decimal Place'] = RemDecimalPlace;
	
	menubarFunctionDict['Play Black Sample'] = PlayBlackSample;
	menubarFunctionDict['Play Red Sample'] = PlayRedSample;
	menubarFunctionDict['Save Black Sample (Local)'] = SaveBlackSampleLocal;
	menubarFunctionDict['Save Red Sample (Local)'] = SaveRedSampleLocal;
	menubarFunctionDict['Save Black Sample (Remote)...'] = SaveBlackSampleRemote;
	menubarFunctionDict['Save Red Sample (Remote)...'] = SaveRedSampleRemote;
	menubarFunctionDict['Subtract Red from Black'] = SubtractRedFromBlack;
	
	var BindOnClick = function(ul)
	{
		if (ul)
		{
			for (var i = 0; i < ul.children.length; i++)
			{
				var li = ul.children[i];
				
				if (li.tagName != "LI") { throw new Error(); }
				
				if (li.children.length == 1)
				{
					var key = li.textContent; // to be replaced by line below
					//var key = li.id;
					var fn = menubarFunctionDict[key];
					li.children[0].onclick = fn;
				}
				else
				{
					BindOnClick(li.children[1]); // li.children[1] should be a <ul>
				}
			}
		}
	};
	
	var menubar = document.getElementById("bar1");
	BindOnClick(menubar);
	
	// better thought of as 'active' - in that there can be only one at a time
	globals.selected = null; // this is/these are the selected cell(s)
	globals.focussed = null; // this is the container of the selected cell(s)
	
	globals.hovered = null;
	globals.beingEdited = null;
	
	globals.dragInProgress = false;
	globals.dragOnClick = false;
	globals.beingDragged = { obj : null , xSlot : null , ySlot : null };
	
	globals.reader = new FileReader();
	globals.shift = false;
	globals.ctrl = false;
	globals.alt = false;
	globals.capsLockOn = false;
	
	globals.traceTextboxMode = false;
	globals.traceGridMode = false;
	globals.placeBoxtreeMode = false;
	globals.placeRootreeMode = false;
	globals.placeGraphMode = false;
	
	globals.objcounts = {};
	globals.objcounts.obj = 1;
	globals.objcounts.textbox = 1;
	globals.objcounts.grid = 1;
	globals.objcounts.tree = 1;
	globals.objcounts.edge = 1;
	
	//globals.mx = MakeSlot(globals, "mx", 0);
	//globals.my = MakeSlot(globals, "my", 0);
	globals.mxi = 0;
	globals.myi = 0;
	globals.delta = 0;
	
	globals.charge = 10;
	globals.optimalSpringLength = 50;
	globals.springStiffness = 10;
	
	globals.cursor = 0;
	globals.cursorOn = false;
	
	globals.actions = {};
	globals.keyValueToCode = [];
	globals.codeToCharMap = {};
	
	//MakeBuiltins();
	
	globals.inverses = {};
	globals.inverses["="] = "=";
	globals.inverses["=+"] = "=-";
	globals.inverses["=-"] = "=+";
	globals.inverses["=*"] = "=/";
	globals.inverses["=/"] = "=*";
	
	//var body = document.getElementsByTagName('body')[0];
	//body.scrollstart = ScrollStart; // pointer-events : none;
	//body.scrollend = function() { };
	
	//setInterval(Render, 40);
	
	//var playButton = MakeTextButton(globals.canvas.buttons, "PlayButton");
	//globals.canvas.buttons["PlayButton"] = playButton;
	//playButton.onclick = PlaySlice;
	//playButton.text = "PlaySlice";
	//MoveBox(playButton, "width", "cx", 80);
	//MoveBox(playButton, "height", "cy", 20);
	//MoveBox(playButton, "left", "width", 100);
	//MoveBox(playButton, "top", "height", 100);
	
	//globals.canvas["[translation]"] = { x : -100 , y : -100 };
	//globals.canvas["[scale]"] = { x : 0.5 , y : 0.5 };
	
	//LoadScript(globals.canvas, "download");
	
	//LoadScript(globals.canvas, "users/chmelynski/music/analysisDriver.frce");
	//LoadScript(globals.canvas, "users/chmelynski/music/moonlightTree.frce");
	//LoadScript(globals.canvas, "users/chmelynski/music/chordTree.frce");
	//LoadScript(globals.canvas, "users/chmelynski/music/musicTree.frce");
	
	//LoadScript(globals.canvas, "users/chmelynski/parsing/el.frce");
	
	//LoadScript(globals.canvas, "users/chmelynski/simpletests/boxtree.frce");
	//LoadScript(globals.canvas, "users/chmelynski/simpletests/simplegrid.frce");
	
	//LoadScript(globals.canvas, "users/chmelynski/3d/interior.frce");
	//LoadScript(globals.canvas, "users/chmelynski/3d/igure.frce");
	
	//LoadScript(globals.canvas, "users/chmelynski/charts/fieldslottest.frce");
	//LoadScript(globals.canvas, "users/chmelynski/charts/chart.frce");
	//LoadScript(globals.canvas, "users/chmelynski/charts/chart2.frce");
	//LoadScript(globals.canvas, "users/chmelynski/charts/enumtest.frce");
	//LoadScript(globals.canvas, "users/chmelynski/charts/gdppop.frce");
	
	//LoadScript(globals.canvas, "users/chemo/games/units.frce"); // more grid-based
	//LoadScript(globals.canvas, "users/chemo/games/hexes.frce"); // currently all script-based
	
	//MakeBroadway();
	
	//$('.draggable').draggable();
	//$('.expand').on('click', ToggleExpand);
	//$('.hidden').hide();
	
	//MusicApp();
}
function MakeSlot(parent, name, value) { // for when we don't have machine.js loaded, this provides a fallback that makes a lightweight slot

	var cog = MakeObj(parent, name);
	//cog.type = Machine.Slot;
	
	// this used to be cog.state = State.Inactive - does this break anything?
	//if (value != null)
	//{
	//	cog.state = State.Nonblank;
	//	
	//	if (typeof(value) != "object")
	//	{
	//		cog.formula = value.toString();
	//	}
	//	else
	//	{
	//		cog.formula = "";
	//	}
	//}
	//else
	//{
	//	cog.state = State.Blank;
	//	cog.formula = "";
	//}
	
	//cog.act = ProcessSlot;
	cog.$ = value;
	//cog.node = MakeNode(cog, "node", cog);
	
	return cog;
}
function ShowClipboard() {
	globals.clipboard = window.prompt("Clipboard:", globals.clipboard);
	globals.ctrl = false;
}
function Execute() {
	var cell = globals.selected;
	
	if (cell)
	{
		ExecuteCell(cell);
	}
}
function ExecuteCell(cell) {
	var obj = Get(cell.slot);
	
	if (obj["[type]"] == "Functor")
	{
		obj.f();
	}
	else if (typeof(obj) == "string")
	{
		InterpretCode(cell, cell.string);
	}
}
function ReadUserDefinedFunction(slot, str) {
	var brace0 = 0;
	var brace1 = 0;
	
	for (var i = 0; i < str.length; i++)
	{
		if (str[i] == "{")
		{
			brace0 = i;
			break;
		}
	}
	
	for (var i = str.length - 1; i >= 0; i--)
	{
		if (str[i] == "}")
		{
			brace1 = i;
			break;
		}
	}
	
	var signature = str.substring(0, brace0);
	var body = str.substring(brace0 + 1, brace1);
	
	var paren0 = 0;
	var paren1 = 0;
	
	for (var i = 0; i < signature.length; i++)
	{
		if (signature[i] == "(")
		{
			paren0 = i;
			break;
		}
	}
	
	for (var i = signature.length - 1; i >= 0; i--)
	{
		if (signature[i] == ")")
		{
			paren1 = i;
			break;
		}
	}
	
	var name = "";
	
	for (var i = paren0 - 1; i >= 0; i--)
	{
		var c = signature[i];
		var n = signature.charCodeAt(i);
		
		if (65 <= n && n <= 90 || 97 <= n && n <= 122 || n == 36 || n == 95) // $ = 36, _ = 95
		{
			name = c + name;
		}
		else
		{
			if (name.length > 0)
			{
				break;
			}
		}
	}
	
	var arglist = signature.substring(paren0 + 1, paren1);

	var argnames = [];
	var arg = "";
	
	for (var i = 0; i < arglist.length; i++)
	{
		var c = arglist[i];
		var n = arglist.charCodeAt(i);
		
		if (65 <= n && n <= 90 || 97 <= n && n <= 122 || n == 36 || n == 95) // $ = 36, _ = 95
		{
			arg += c;
		}
		else
		{
			if (arg.length > 0)
			{
				argnames.push(arg);
				arg = "";
			}
		}
	}
	
	if (arg.length > 0)
	{
		argnames.push(arg);
	}
	
	var functor = MakeObj(slot, "$");
	functor["[type]"] = "Functor";
	functor.name = name;
	functor.body = body; // for serialization
	functor.args = MakeList(functor, "args");
	functor.f = Function(argnames.join(","), body);
	
	for (var i = 0; i < argnames.length; i++)
	{
		functor.args.push(argnames[i]);
	}
	
	// rename the slot to match the function name, so it can be called properly
	var scope = slot["[parent]"];
	var oldname = slot["[name]"];
	delete scope[oldname];
	scope[name] = slot;
	slot["[name]"] = name;
	
	return functor;
}
function MakeObj(parent, name) {
	var obj = {};
	AddBracketFields(obj, parent, name);
	return obj;
}
function MakeList(parent, name) {
	var obj = []; // we need a special MakeList function because []'s have the .length field, which our code needs
	AddBracketFields(obj, parent, name)
	return obj;
}
function AddBracketFields(obj, parent, name) {
	//if (globals.id == 378)
	//{
	//	throw new Error();
	//}
	
	globals.allobjs[globals.id] = obj;
	
	obj["[id]"] = globals.id++;
	obj["[parent]"] = parent;
	obj["[name]"] = name;
	//obj["[reposition]"] = true;
	//obj["[ob]"] = false; // out-of-bounds flag - tells whether the object is visible/invisible solely based on its position within its viewport
	//obj["[visible]"] = false; // this is for user-controlled visibility
	//obj["[draw]"] = "no"; // possible values are "no" and "draw"
}
function Render() {
	// draw log
	//globals.g.clearRect(1280, 0, 200, 100);
	//globals.g.fillStyle = "rgb(0,0,0)";
	//globals.logy = 15;
	//globals.logStart = globals.log.length - globals.logDisplayLines;
	//if (globals.logStart < 0) globals.logStart = 0;
	//
	//for (var i = globals.logStart; i < globals.log.length; i++)
	//{
	//	globals.g.fillText(globals.log[i], 1300, globals.logy);
	//	globals.logy += 15;
	//}

	// draw mouse position
	//globals.g.clearRect(1280, 0, 200, 100);
	//globals.g.fillText(Get(globals.mx).toString() + "," + Get(globals.my).toString(), 1300, 50);
	
	if (globals.calculate)
	{
		globals.queue = globals.newqueue;
		globals.newqueue = [];
		Calculate();
		globals.calculate = false;
		globals.redraw = true; // automatically redraw after a calculation?
	}
	
	//if (globals.redraw)
	//{
	//	globals.g.clearRect(0, 0, globals.canvasElement.width, globals.canvasElement.height);
	//	
	//	DrawCollection(globals.canvas);
	//	
	//	// draw globals.beingEdited - allow for text overflow
	//	if (globals.beingEdited)
	//	{
	//		var cell = globals.beingEdited;
	//		
	//		var width = globals.g.measureText(cell.string).width + 15;
	//		
	//		if (width > Get(cell.width))
	//		{
	//			MoveBox(cell, "width", "left", width);
	//		}
	//		
	//		globals.g.clearRect(Get(cell.left), Get(cell.top), Get(cell.width), Get(cell.height));
	//		cell.position(cell);
	//		cell.draw(cell); // cursor?
	//	}
    //
	//	globals.redraw = false;
	//}
	
	// draw actionstack
	//globals.g.clearRect(1150, 0, 400, 200);
	//globals.g.font = "10pt Courier New";
	//globals.g.fillStyle = "rgb(0,0,0)";
	////for (var i = 0; i < globals.actions["LD"].length; i++) { globals.g.fillText(globals.actions["LD"][i].name, 1200, 50 + 15 * i); }
	////for (var i = 0; i < globals.actions["MM"].length; i++) { globals.g.fillText(globals.actions["MM"][i].name, 1400, 50 + 15 * i); }
	//globals.g.fillText("LD: " + globals.actions["LD"][globals.actions["LD"].length - 1].name, 1200, 50 + 15 * 0);
	//globals.g.fillText("LU: " + globals.actions["LU"][globals.actions["LU"].length - 1].name, 1200, 50 + 15 * 1);
	//globals.g.fillText("RD: " + globals.actions["RD"][globals.actions["RD"].length - 1].name, 1200, 50 + 15 * 2);
	//globals.g.fillText("RU: " + globals.actions["RU"][globals.actions["RU"].length - 1].name, 1200, 50 + 15 * 3);
	//globals.g.fillText("MM: " + globals.actions["MM"][globals.actions["MM"].length - 1].name, 1200, 50 + 15 * 4);
	//globals.g.fillText("MW: " + globals.actions["MW"][globals.actions["MW"].length - 1].name, 1200, 50 + 15 * 5);
	
	//RenderRec(globals.canvas);
}
function GetFrame(obj) {
	if (obj["[type]"] == "Collection")
	{
		return obj;
	}
	else
	{
		return GetFrame(obj["[parent]"]);
	}
}
function PublicKeys(obj) {
	var keys = [];
	
	for (var key in obj)
	{
		if (key[0] != '[')
		{
			keys.push(key);
		}
	}
	
	return keys;
}
function RenderRec(obj) {
	var draw = obj["[draw]"];
	
	// let's say we have frames within a canvas - each frame holds a transformation, and is a drawable object in its own right
	// music, asteroids, etc. would be frames
	// every object that wants to be drawn will have a reference to the frame it belongs to
	
	// but if we want an object to appear in multiple frames - then we either have to have th object draw itself in each frame
	
	// basically, for each frame, an object must determine if it or any of its children are visible - the [ob] property
	// now we thought we might have [ob] as an object field - but this doesn't work because [ob] is *relative to a frame*
	// so there is one (theoretic) [ob] variable per object-frame pair - possibly too much to store in variables
	// but on the other hand, we don't want to recalculate [ob] variables unless we scroll a frame or something
	// on the other other hand, perhaps the [redraw] variable can handle everything, including [ob] situations
	
	if (draw == "no")
	{
		return; // short circuit
	}
	
	if (draw == "draw")
	{
		if (obj["[reposition]"])
		{
			if (obj.position)
			{
				obj.position(obj);
			}
			
			obj["[reposition]"] = false;
		}
		
		obj.draw(obj); // with this thin line in RenderRec, we push all responsibilities - like clearing canvas, determining whether to draw, to the object
		obj["[draw]"] = "no"; // so [draw] is a transient variable - [visible] is what we use to toggle more long-term stuff
		return; // we assume that the draw() function of the obj will handle drawing children as necessary
	}
	
	// so the default behavior here seems to be a passthrough
	
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
				var parent = val["[parent]"];
				
				if (parent == obj)
				{
					RenderRec(val);
				}
			}
		}
	}
}
function OldGet(obj) {
	if (!obj)
	{
		return obj;
	}
	
	var type = typeof(obj);
	
	if (type == "object")
	{
		// we changed the name of the underlying from "0" to "$" because "0" would pass down into arrays, which is not what we want
		// bascially we have to avoid name conflicts with all potential underlying objects, which means a bracketed value
		return Get(obj.$);
	}
	else // (type == "number" || type == "string" || type == "boolean")
	{
		return obj;
	}
}
function GetSlot(cog) {
	if (cog)
	{
		if (cog.type == Machine.Pointer)
		{
			return GetSlot(cog.$);
		}
	}
	
	return cog;
}
function Get(obj) {
	if (obj)
	{
		if (obj.type == Machine.Slot || obj.type == Machine.Pointer)
		{
			return Get(obj.$);
		}
	}
	
	return obj;
}
function GetOneLevelDown(obj) {
	return Get(obj.$);
}
function Set(slot, value) {
	// instead of doing the assignment immediately, instead just generate a message and put it in the queue
	//globals.log.push("Set\tnull\t" + LinkStringFromGlobals(slot) + "\tnull\t" + (value === null ? "null" : (typeof(value) == "string" ? "string" : value.toString())));
	globals.newqueue.push({ type : Message.Set , src : null , dst : slot , edge : null , setValue : value });
	globals.calculate = true;
}
function ChangeName() {
	var newname = this.$;
	var slotname = this["[name]"];
	
	if (slotname == "nameslot" || slotname == "textboxnameslot")
	{
		var parent = this["[parent]"];
		var dataSlot = null;
		
		if (parent["[type]"] == "Grid") // reconcile these, maybe?  although this setup here isn't all that bad
		{
			dataSlot = parent.obj;
		}
		else if (parent["[type]"] == "Textbox")
		{
			dataSlot = parent.cell.slot;
		}
		else if (parent["[type]"] == "Rootree" || parent["[type]"] == "Boxtree" || parent["[type]"] == "Indentree")
		{
			dataSlot = parent.obj;
		}
		else
		{
			throw new Error();
		}
		
		var dataSlotParent = dataSlot["[parent]"];
		var dataSlotName = dataSlot["[name]"];
		delete dataSlotParent[dataSlotName];
		dataSlotParent[newname] = dataSlot;
		dataSlot["[name]"] = newname;
	}
	else
	{
		var nameslotList = this["[parent]"];
		var grid = nameslotList["[parent]"];
		var data = Get(grid.obj);
		var nameslotListName = nameslotList["[name]"];
		
		if (nameslotListName == "objnameslots")
		{
			var oldobjname = grid.objs[slotname];
			var slotindex = parseInt(slotname);
			grid.objs[slotindex] = newname;
			
			var slot = data[oldobjname];
			delete data[oldobjname];
			data[newname] = slot;
			slot["[name]"] = newname;
		}
		else if (nameslotListName == "fldnameslots")
		{
			var oldfldname = grid.flds[slotname];
			var slotindex = parseInt(slotname);
			grid.flds[slotindex] = newname;
			
			for (var i = 0; i < grid.objs.length; i++)
			{
				var obj = Get(data[grid.objs[i]]);
				
				var field = obj[oldfldname];
				delete obj[oldfldname];
				obj[newname] = field;
				field["[name]"] = newname;
			}
		}
		else
		{
			throw new Error();
		}
	}
}
function MoveBox(rect, field, fixedField, newval) {
	rect.reactive.$ = false;
	rect[field].$ = newval;
	BoxReact(rect, field, fixedField, newval);
	rect.reactive.$ = true;
}
function BoxReact(rect, field, fixedField, newval) {
	var SetFormula = function(slot, value)
	{
		slot.formula = value.toString();
		slot.$ = value;
	};
	
	rect.reactive.$ = false;
	
	if (field == "width")
	{
		SetFormula(rect.wr, newval / 2);
		
		if (fixedField == "left")
		{
			SetFormula(rect.cx, Get(rect.left) + Get(rect.wr));
			SetFormula(rect.right, Get(rect.left) + Get(rect.width));
		}
		else if (fixedField == "cx")
		{
			SetFormula(rect.left, Get(rect.cx) - Get(rect.wr));
			SetFormula(rect.right, Get(rect.cx) + Get(rect.wr));
		}
		else if (fixedField == "right")
		{
			SetFormula(rect.left, Get(rect.right) - Get(rect.width));
			SetFormula(rect.cx, Get(rect.right) - Get(rect.wr));
		}
		
		//rect.hLocked.$ = "width";
	}
	else if (field == "height")
	{
		SetFormula(rect.hr, newval / 2);
		
		if (fixedField == "top")
		{
			SetFormula(rect.cy, Get(rect.top) + Get(rect.hr));
			SetFormula(rect.bottom, Get(rect.top) + Get(rect.height));
		}
		else if (fixedField == "cy")
		{
			SetFormula(rect.top, Get(rect.cy) - Get(rect.hr));
			SetFormula(rect.bottom, Get(rect.cy) + Get(rect.hr));
		}
		else if (fixedField == "bottom")
		{
			SetFormula(rect.top, Get(rect.bottom) - Get(rect.height));
			SetFormula(rect.cy, Get(rect.bottom) - Get(rect.hr));
		}
	}
	else if (field == "wr")
	{
		SetFormula(rect.width, newval * 2);
		
		if (fixedField == "left")
		{
			SetFormula(rect.cx, Get(rect.left) + Get(rect.wr));
			SetFormula(rect.right, Get(rect.left) + Get(rect.width));
		}
		else if (fixedField == "cx")
		{
			SetFormula(rect.left, Get(rect.cx) - Get(rect.wr));
			SetFormula(rect.right, Get(rect.cx) + Get(rect.wr));
		}
		else if (fixedField == "right")
		{
			SetFormula(rect.left, Get(rect.right) - Get(rect.width));
			SetFormula(rect.cx, Get(rect.right) - Get(rect.wr));
		}
	}
	else if (field == "hr")
	{
		SetFormula(rect.height, newval * 2);
		
		if (fixedField == "top")
		{
			SetFormula(rect.cy, Get(rect.top) + Get(rect.hr));
			SetFormula(rect.bottom, Get(rect.top) + Get(rect.height));
		}
		else if (fixedField == "cy")
		{
			SetFormula(rect.top, Get(rect.cy) - Get(rect.hr));
			SetFormula(rect.bottom, Get(rect.cy) + Get(rect.hr));
		}
		else if (fixedField == "bottom")
		{
			SetFormula(rect.top, Get(rect.bottom) - Get(rect.height));
			SetFormula(rect.cy, Get(rect.bottom) - Get(rect.hr));
		}
	}
	else if (field == "left")
	{
		if (fixedField == "cx")
		{
			SetFormula(rect.wr, Get(rect.cx) - Get(rect.left));
			SetFormula(rect.width, Get(rect.wr) * 2);
			SetFormula(rect.right, Get(rect.left) + Get(rect.width));
		}
		else if (fixedField == "right")
		{
			SetFormula(rect.width, Get(rect.right) - Get(rect.left));
			SetFormula(rect.wr, Get(rect.width) / 2);
			SetFormula(rect.cx, Get(rect.left) + Get(rect.wr));
		}
		else if (fixedField == "width")
		{
			SetFormula(rect.cx, Get(rect.left) + Get(rect.wr));
			SetFormula(rect.right, Get(rect.left) + Get(rect.width));
		}
	}
	else if (field == "cx")
	{
		if (fixedField == "left")
		{
			SetFormula(rect.wr, Get(rect.cx) - Get(rect.left));
			SetFormula(rect.width, Get(rect.wr) * 2);
			SetFormula(rect.right, Get(rect.left) + Get(rect.width));
		}
		else if (fixedField == "right")
		{
			SetFormula(rect.wr, Get(rect.right) - Get(rect.cx));
			SetFormula(rect.width, Get(rect.wr) * 2);
			SetFormula(rect.left, Get(rect.right) - Get(rect.width));
		}
		else if (fixedField == "width")
		{
			SetFormula(rect.left, Get(rect.cx) - Get(rect.wr));
			SetFormula(rect.right, Get(rect.cx) + Get(rect.wr));
		}
	}
	else if (field == "right")
	{
		if (fixedField == "cx")
		{
			SetFormula(rect.wr, Get(rect.right) - Get(rect.cx));
			SetFormula(rect.width, Get(rect.wr) * 2);
			SetFormula(rect.left, Get(rect.right) - Get(rect.width));
		}
		else if (fixedField == "left")
		{
			SetFormula(rect.width, Get(rect.right) - Get(rect.left));
			SetFormula(rect.wr, Get(rect.width) / 2);
			SetFormula(rect.cx, Get(rect.left) + Get(rect.wr));
		}
		else if (fixedField == "width")
		{
			SetFormula(rect.left, Get(rect.right) - Get(rect.width));
			SetFormula(rect.cx, Get(rect.right) - Get(rect.wr));
		}
	}
	else if (field == "top")
	{
		if (fixedField == "cy")
		{
			SetFormula(rect.hr, Get(rect.cy) - Get(rect.top));
			SetFormula(rect.height, Get(rect.hr) * 2);
			SetFormula(rect.bottom, Get(rect.top) + Get(rect.height));
		}
		else if (fixedField == "bottom")
		{
			SetFormula(rect.height, Get(rect.bottom) - Get(rect.top));
			SetFormula(rect.hr, Get(rect.height) / 2);
			SetFormula(rect.cy, Get(rect.top) + Get(rect.hr));
		}
		else if (fixedField == "height")
		{
			SetFormula(rect.cy, Get(rect.top) + Get(rect.hr));
			SetFormula(rect.bottom, Get(rect.top) + Get(rect.height));
		}
	}
	else if (field == "cy")
	{
		if (fixedField == "top")
		{
			SetFormula(rect.hr, Get(rect.cy) - Get(rect.top));
			SetFormula(rect.height, Get(rect.hr) * 2);
			SetFormula(rect.bottom, Get(rect.top) + Get(rect.height));
		}
		else if (fixedField == "bottom")
		{
			SetFormula(rect.hr, Get(rect.bottom) - Get(rect.cy));
			SetFormula(rect.height, Get(rect.hr) * 2);
			SetFormula(rect.top, Get(rect.bottom) - Get(rect.height));
		}
		else if (fixedField == "height")
		{
			SetFormula(rect.top, Get(rect.cy) - Get(rect.hr));
			SetFormula(rect.bottom, Get(rect.cy) + Get(rect.hr));
		}
	}
	else if (field == "bottom")
	{
		if (fixedField == "cy")
		{
			SetFormula(rect.hr, Get(rect.bottom) - Get(rect.cy));
			SetFormula(rect.height, Get(rect.hr) * 2);
			SetFormula(rect.top, Get(rect.bottom) - Get(rect.height));
		}
		else if (fixedField == "top")
		{
			SetFormula(rect.height, Get(rect.bottom) - Get(rect.top));
			SetFormula(rect.hr, Get(rect.height) / 2);
			SetFormula(rect.cy, Get(rect.top) + Get(rect.hr));
		}
		else if (fixedField == "height")
		{
			SetFormula(rect.top, Get(rect.bottom) - Get(rect.height));
			SetFormula(rect.cy, Get(rect.bottom) - Get(rect.hr));
		}
	}
	
	rect.reactive.$ = true;
}
function SetFields(obj, patch) {
	for (var key in patch)
	{
		obj[key] = patch[key];
	}
}
function AddRectSlots(obj) {
	obj.lineWidth = MakeSlot(obj, "lineWidth", 1);
	
	obj.left = MakeSlot(obj, "left", null);
	obj.top = MakeSlot(obj, "top", null);
	obj.width = MakeSlot(obj, "width", null);
	obj.height = MakeSlot(obj, "height", null);
	obj.cx = MakeSlot(obj, "cx", null);
	obj.cy = MakeSlot(obj, "cy", null);
	obj.bottom = MakeSlot(obj, "bottom", null);
	obj.right = MakeSlot(obj, "right", null);
	obj.hr = MakeSlot(obj, "hr", null);
	obj.wr = MakeSlot(obj, "wr", null);
	
	//obj.horiSystem = MakeLengthEq(obj, "horiSystem", obj, obj.left, obj.cx, obj.right, obj.width, obj.wr);
	//obj.vertSystem = MakeLengthEq(obj, "vertSystem", obj, obj.top, obj.cy, obj.bottom, obj.height, obj.hr);
	
	// this feels like a more technically correct solution to the problem of where to store the locks - they belong with the system
	// but now the issue is how to expose the locks to change
	// again, we face the problem that we want fields of sub-objects to be displayed with the parent object
	// and we don't have a good way to do that
	//obj.horiSystem.locked = MakeList(obj.horiSystem, "locked");
	//obj.horiSystem.locked[0] = MakeSlot(obj.horiSystem.locked[0], "0", "width");
	//obj.horiLocked = obj.horiSystem.locked;
	//obj.vertSystem.locked = MakeList(obj.vertSystem, "locked");
	//obj.vertSystem.locked[0] = MakeSlot(obj.vertSystem.locked[0], "0", "height");
	//obj.vertLocked = obj.vertSystem.locked;
	
	obj.left.react = ReactBox;
	obj.top.react = ReactBox;
	obj.width.react = ReactBox;
	obj.height.react = ReactBox;
	obj.cx.react = ReactBox;
	obj.cy.react = ReactBox;
	obj.bottom.react = ReactBox;
	obj.right.react = ReactBox;
	obj.hr.react = ReactBox;
	obj.wr.react = ReactBox;
	obj.reactive = MakeSlot(obj, "reactive", true);
	obj.hLocked = MakeSlot(obj, "hLocked", "width");
	obj.vLocked = MakeSlot(obj, "vLocked", "height");
}
function MakeLengthEq(parent, name, obj, start, center, end, length, radius) {
	var eq = MakeEq(parent, name);
	
	return eq;
}
function LengthSystem(changed, locked, start, center, end, length, radius) {
	// all the arguments are Pointers
	
	if (changed == start)
	{
		if (locked == start)
		{
		
		}
		else if (locked == center)
		{
		
		}
		else if (locked == end)
		{
		
		}
		else if (locked == length || locked == radius)
		{
		
		}
		else
		{
			throw new Error();
		}
	}
	else if (changed == center)
	{
		if (locked == start)
		{
		
		}
		else if (locked == center)
		{
		
		}
		else if (locked == end)
		{
		
		}
		else if (locked == length || locked == radius)
		{
		
		}
		else
		{
			throw new Error();
		}
	}
	else if (changed == end)
	{
		if (locked == start)
		{
		
		}
		else if (locked == center)
		{
		
		}
		else if (locked == end)
		{
		
		}
		else if (locked == length || locked == radius)
		{
		
		}
		else
		{
			throw new Error();
		}
	}
	else if (changed == length)
	{
		if (locked == start)
		{
		
		}
		else if (locked == center)
		{
		
		}
		else if (locked == end)
		{
		
		}
		else if (locked == length || locked == radius)
		{
		
		}
		else
		{
			throw new Error();
		}
	}
	else if (changed == radius)
	{
		if (locked == start)
		{
		
		}
		else if (locked == center)
		{
		
		}
		else if (locked == end)
		{
		
		}
		else if (locked == length || locked == radius)
		{
		
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
}
function ReactBox() {
	var slot = this;
	var rect = slot["[parent]"];
	var name = slot["[name]"];
	
	if (Get(rect.reactive))
	{
		if (name == "left" || name == "cx" || name == "right" || name == "width" || name == "wr")
		{
			BoxReact(rect, name, Get(rect.hLocked), Get(slot));
		}
		else if (name == "top" || name == "cy" || name == "bottom" || name == "height" || name == "hr")
		{
			BoxReact(rect, name, Get(rect.vLocked), Get(slot));
		}
		else if (name == "front" || name == "cz" || name == "back" || name == "depth" || name == "dr")
		{
			BoxReact(rect, name, Get(rect.dLocked), Get(slot));
		}
		else
		{
			throw new Error();
		}
	}
}
function InsertAt(obj, list, index) {

	list.splice(index, 0, obj);
}
function Remove(list, obj) {

	var i = list.indexOf(obj);
	var newlist = list.slice(0, i).concat(list.slice(i + 1));
	return newlist;
}
function InsertObjsIntoList(list, objs, index) {

	// we take care of [parent] and [name] issues here
	
	for (var i = objs.length - 1; i >= 0; i--)
	{
		objs[i]["[parent]"] = list;
		InsertAt(objs[i], list, index); // index never changes, because we're looping backwards through the objs
	}
	
	for (var i = index; i < list.length; i++) // all subsequent items in the list also have their names changed - hope this doesn't fuck up any references!
	{
		list[i]["[name]"] = i.toString();
	}
}
function DeleteObjsFromList(list, index, count) {


}
function SanitizeString(str) {
	return str.replace("\"", "\\\"");
}
function Nonce(obj, name) {
	var k = 0;
	
	while (obj[name + k.toString()])
	{
		k++;
	}
	
	return name + k.toString();
}

