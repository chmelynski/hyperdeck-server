
if (typeof Griddl === 'undefined') { var Griddl = {}; }

Griddl.Lang = (function() {

// takes a simply-indented lines of text, one string per line, returns a list of twigs: [ { value : "" , children : [] } ]
function ReadTreeSimple(lines) {
	
	// a very simple tree structure - one token per line, prefixed by 2 spaces per indent
	// Seq
	//   a
	//   Alt
	//     b
	//     c
	//   d
	
	var twigs = [];
	
	var parents = [];
	
	var firstindent = null;
	
	for (var i = 0; i < lines.length; i++)
	{
		var indent = 0;
		var twig = {};
		twig.children = [];
		twigs.push(twig);
		
		var line = lines[i].trimRight(); // cut trailing whitespace, which can happen if you copy-paste a tree from excel, where you have a rectangular copy area
		
		for (var k = 0; k < line.length; k++)
		{
			if (line[k] == ' ' || line[k] == '\t')
			{
				indent++;
			}
			else
			{
				twig.value = line.substr(k);
				break;
			}
		}
		
		if (firstindent == null && indent > 0)
		{
			firstindent = indent;
		}
		
		if (firstindent != null) // if firstindent is null, indent should be 0 anyway
		{
			indent /= firstindent; // n spaces/tabs per indent
		}
		
		if (indent == 0)
		{
			//twig.parent = null;
		}
		else
		{
			var parentTwig = parents[indent - 1];
			//twig.parent = parentTwig;
			parentTwig.children.push(twig);
		}
		
		parents[indent] = twig;
	}
	
	return twigs;
}
function WriteTreeSimple(root) {
	var lines = [];
	WriteTreeSimpleRec(0, lines, root);
	return lines;
}
function WriteTreeSimpleRec(indent, lines, twig) {
	var line = '';
	for (var i = 0; i < indent; i++) { line += ' '; }
	line += twig.value;
	lines.push(line);
	
	for (var i = 0; i < twig.children.length; i++)
	{
		WriteTreeSimpleRec(indent + 1, lines, twig.children[i]);
	}
}

function LoadGrid(scope, grid, matrix) {
	// matrix is just a 2D array of strings - the grid/obj/field names and the cell formulas
	
	var dataName = matrix[0][0];
	var slot = MakeSlot(scope, dataName);
	scope[dataName] = slot;
	var data = MakeObj(slot, "$");
	slot.$ = data;
	data["[type]"] = "Collection";
	
	slot.react = DistributeAllFieldFormulas;
	slot["[fieldSlots]"] = MakeObj(slot, "[fieldSlots]"); // this has to be on the slot, not the data, because the data can be obliterated by the code
	// also, now that it's on the slot, rather than the data, we could probably make it a non-bracketed field
	
	if (grid.rowsAre == "objs")
	{
		for (var rowi = 1; rowi < matrix.length; rowi++)
		{
			var objName = matrix[rowi][0];
			var objSlot = MakeSlot(data, objName, null);
			SetStructField(slot, objName, objSlot);
			//data[objName] = objSlot;
			var obj = MakeObj(objSlot, "$");
			objSlot.$ = obj;
			
			for (var colj = 1; colj < matrix[0].length; colj++)
			{
				var fieldName = matrix[0][colj];
				var fieldSlot = MakeSlot(obj, fieldName, null);
				
				SetStructField(objSlot, fieldName, fieldSlot);
				//obj[fieldName] = fieldSlot;
				
				fieldSlot.formula = matrix[rowi][colj];
				CompileCode(fieldSlot, fieldSlot.formula);
			}
		}
	}
	else
	{
		for (var colj = 1; colj < matrix[0].length; colj++)
		{
			var objName = matrix[0][colj];
			var objSlot = MakeSlot(data, objName, null);
			SetStructField(slot, objName, objSlot);
			//data[objName] = objSlot;
			var obj = MakeObj(objSlot, "$");
			objSlot.$ = obj;
			
			for (var rowi = 1; rowi < matrix.length; rowi++)
			{
				var fieldName = matrix[rowi][0];
				var fieldSlot = MakeSlot(obj, fieldName, null);
				
				SetStructField(objSlot, fieldName, fieldSlot);
				//obj[fieldName] = fieldSlot;
				
				fieldSlot.formula = matrix[rowi][colj];
				CompileCode(fieldSlot, fieldSlot.formula);
			}
		}
	}
	
	SetGridDataSlot(grid, slot);
	
	grid.top.$ = 0;
	grid.left.$ = 0;
	
	//Calculate();
	
	RedisplayGrid(grid);
}
function SetStructField(structSlot, fieldName, fieldSlot) {
	var struct = Get(structSlot);
	struct[fieldName] = fieldSlot;
	AddEdge(fieldSlot.node, structSlot.node, "[part]", Edge.Part);
}
function AddBoxReacts(grid) {
	var data = Get(grid.obj);
	
	for (var i = 0; i < grid.objs.length; i++)
	{
		var obj = Get(data[i]);
		
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
}
function LoadTree(tree, lines, textOnly) {
	var dataSlot = MakeSlot(tree, "obj");
	tree.obj = dataSlot;
	
	//data["[type]"] = "Collection";
	
	var budField = tree.budField;
	var childrenField = tree.childrenField;
	
	var parents = [];
	
	for (var i = 0; i < lines.length; i++)
	{
		var indent = 0;
		var formula = null;
		
		for (var k = 0; k < lines[i].length; k++)
		{
			if (lines[i][k] == ' ')
			{
				indent++;
			}
			else
			{
				formula = lines[i].substr(k);
				break;
			}
		}
		
		indent /= 2; // two spaces per indent
	
		//var cols = Tokenize(lines[i], '\t');
		//var indent = parseInt(cols[0]);
		//var formula = cols[1];
		
		var twigSlot = null;
		var twig = null;

		if (indent == 0)
		{
			twigSlot = dataSlot;
			twig = MakeObj(twigSlot, "$");
			twigSlot.$ = twig;
			
			twig.parent = null;
		}
		else
		{
			var parentTwig = parents[indent - 1];
			
			twigSlot = MakeSlot(parentTwig[childrenField], parentTwig[childrenField].length.toString());
			twig = MakeObj(twigSlot, "$");
			twigSlot.$ = twig;
			
			twig.parent = parentTwig;
			parentTwig[childrenField].push(twigSlot);
		}
		
		twig[budField] = MakeSlot(twig, budField);
		twig[childrenField] = MakeList(twig, childrenField);
		
		var budSlot = twig[budField];
		budSlot.formula = formula;
		
		if (!textOnly)
		{
			CompileCode(budSlot, budSlot.formula);
		}
		
		parents[indent] = twig;
	}
	
	tree.generateTwigs(tree);
	tree.draw(tree);
}

function LinizeBinary(x) {
	
	var lines = [];
	var k = 0;
	var buffer = "";
	
	while (k < x.length)
	{
		var n = x[k];
		
		if (n == 13)
		{
			if (x[k + 1] == 10)
			{
				k++;
			}
			
			lines.push(buffer);
			buffer = "";
		}
		else if (n == 10)
		{
			lines.push(buffer);
			buffer = "";
		}
		else
		{
			buffer += String.fromCharCode(n);
		}
		
		k++;
	}
	
	if (buffer.length > 0)
	{
		lines.push(buffer);
	}
	
	return lines;
}
function Linize(str) {
	var lines = [];
	
	var k = 0;
	
	var buffer = "";
	
	while (k < str.length)
	{
		var c = str[k];
		
		if (c == '\r')
		{
			if (str[k + 1] == '\n')
			{
				k++;
			}
			
			lines.push(buffer);
			buffer = "";
		}
		else if (c == '\n')
		{
			lines.push(buffer);
			buffer = "";
		}
		else
		{
			buffer += c;
		}
		
		k++;
	}
	
	if (buffer.length > 0)
	{
		lines.push(buffer);
	}
	
	return lines;
}
function ReadLine(str, frcek) {
	var s = "";
	
	while(frcek < str.length)
	{
		if (str[frcek] == '\n')
		{
			break;
		}
		
		s += str[frcek];
		frcek++;
	}
	
	return s;
}
function Tokenize(str, delimiter) {
	var tokens = [];
	
	var k = 0;
	
	var buffer = "";
	
	while (k < str.length)
	{
		var c = str[k];
		
		if (c == delimiter)
		{
			tokens.push(buffer);
			buffer = "";
		}
		else
		{
			buffer += c;
		}
		
		k++;
	}
	
	//if (buffer.length > 0)
	//{
		tokens.push(buffer);
	//}
	
	return tokens;
}
function ReadFrce(str) {
	// this doesn't seem to be set up for reading multi-line scripts, and as such may be inappropriate to be called by Execute()
	
	frcek = 0;
	
	var tree = {};
	
	// the try-catch block will help with gracefully dealing with syntax errors
	//try
	//{
		if (str[0] == '#')
		{
			tree.root = ReadEq(str);
		}
		else
		{
			tree.root = ReadStatement(str);
		}
	//}
	//catch
	//{
	//	return null;
	//}
	
	return tree;
}
function ReadEq(str) {
	frcek++;
	
	var exps = [];
	
	while (frcek < str.length)
	{
		ReadSpace(str);
		exps.push(ReadExp(str));
	}
	
	var x = {};
	x.children = [];
	
	if (exps.length == 5)
	{
		// this handles both forms:
		// c = b + a
		// a + b = c
		if (exps[1].contents == '=')
		{
			x.contents = '=' + exps[3].contents;
			x.children[0] = exps[0];
			x.children[1] = exps[2];
			x.children[2] = exps[4];
		}
		else if (exps[3].contents == '=')
		{
			x.contents = '=' + exps[1].contents;
			x.children[0] = exps[4];
			x.children[1] = exps[0];
			x.children[2] = exps[2];
		}
		else
		{
			throw new Error();
		}
	}
	else if (exps.length == 3)
	{
		if (exps[1].contents == '=')
		{
			x.contents = '=';
			x.children[0] = exps[0];
			x.children[1] = exps[2];
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
	
	return x;
}
function ReadStatement(str) {
	ReadSpace(str);
	
	if (str.substr(frcek, 3) == "for")
	{
		var line = ReadLine(str, frcek);
		var tokens = Tokenize(str, ' ');
		
		var x = {};
		x.children = [];
		
		if (tokens.length == 6) // for i from 0 to 10
		{
			x.contents = 'for';
			x.children.push(tokens[1]);
			x.children.push(tokens[3]);
			x.children.push(tokens[5]);
		}
		else if (tokens.length == 4) // for x in list
		{
			x.contents = 'forin';
			x.children.push(tokens[1]);
			x.children.push(tokens[3]);
		}
		else
		{
			throw new Error();
		}
		
		var block = [];
		block.contents = "{}";
		block.children = [];
		
		var sub = ReadStatement(str, frcek);
		
		while (sub.contents != "end")
		{
			block.children.push(sub);
			sub = ReadStatement(str, frcek);
		}
		
		x.children.push(block);
		
		return x;
	}
	else if (str.substr(frcek, 2) == "if")
	{
	
	}
	else if (str.substr(frcek, 4) == "elif")
	{
	
	}
	else if (str.substr(frcek, 4) == "else")
	{
	
	}
	else if (str.substr(frcek, 4) == "frce")
	{
	
	}
	else if (str.substr(frcek, 3) == "end")
	{
		var x = {};
		x.contents = "end";
		x.children = [];
		return x;
	}
	else
	{
		var lhs = ReadExp(str);
		ReadSpace(str);
		
		if (str[frcek] == '=')
		{
			frcek++;
			ReadSpace(str);
			
			var rhs = {};
			rhs.contents = str.substr(frcek);
			rhs.children = [];
			
			var x = {};
			x.contents = '=';
			x.children = [];
			x.children.push(lhs);
			x.children.push(rhs);
			return x;
		}
		else if (str[frcek] == ':' && str[frcek + 1] == '=')
		{
			frcek += 2;
			ReadSpace(str);
			var rhs = ReadExp(str);
			
			var x = {};
			x.contents = ':=';
			x.children = [];
			x.children.push(lhs);
			x.children.push(rhs);
			return x;
		}
		else
		{
			return lhs;
		}
	}
}
function ReadExp(str) {
	var x = null;
	
	var c = str[frcek];
	
	if (c == '(')
	{
		//ReadSpace(str);
		x = ReadParen(str);
	}
	else if (c == '[')
	{
		frcek += 2;
		x = Leaf('[]');
	}
	else if (c == '{')
	{
		frcek += 2;
		x = Leaf('{}');
	}
	//else if (c == '+' || c == '-' || c == '.' || c == '0' || c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9')
	//{
	//	x = Leaf(ReadNumber(str));
	//}
	else if (c == '\'' || c == '\"')
	{
		x = Leaf(ReadString(str));
	}
	//else if (c == '_' || c == 'a' || c == 'b' || c == 'c' || c == 'd' || c == 'e' || c == 'f' || c == 'g' || c == 'h' || c == 'i' || c == 'j' || c == 'k' || c == 'l' || c == 'm' || c == 'n' || c == 'o' || c == 'p' || c == 'q' || c == 'r' || c == 's' || c == 't' || c == 'u' || c == 'v' || c == 'w' || c == 'x' || c == 'y' || c == 'z' || c == 'A' || c == 'B' || c == 'C' || c == 'D' || c == 'E' || c == 'F' || c == 'G' || c == 'H' || c == 'I' || c == 'J' || c == 'K' || c == 'L' || c == 'M' || c == 'N' || c == 'O' || c == 'P' || c == 'Q' || c == 'R' || c == 'S' || c == 'T' || c == 'U' || c == 'V' || c == 'W' || c == 'X' || c == 'Y' || c == 'Z')
	//{
	//	x = Leaf(ReadName(str));
	//}
	//else
	//{
	//	ReadSpace(str);
	//}
	else if (c == ' ' || c == '\t' || c == '\r' || c == '\n')
	{
		ReadSpace(str);
	}
	else
	{
		x = Leaf(ReadToken(str));
	}
	
	var post = str[frcek];
	
	while (post == '.' || post == '[')
	{
		var sub = x;
		x = {};
		x.children = [];

		if (post == '.')
		{
			x.contents = '.';
			frcek++;
			x.children[0] = sub;
			
			if (c == '0' || c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9')
			{
				x.children[1] = Leaf(ReadNumber(str));
			}
			else if (c == '\'' || c == '\"')
			{
				x.children[1] = Leaf(ReadString(str));
			}
			else
			{
				x.children[1] = Leaf(ReadToken(str));
			}
		}
		else if (post == '[')
		{
			x.contents = '[]';
			frcek++;
			ReadSpace(str);
			x.children[0] = sub;
			x.children[1] = ReadExp(str);
			ReadSpace(str);
			frcek++;
		}
		
		post = str[frcek];
	}
	
	return x;
}
function ReadParen(str) {
	var x = {};
	x.contents = '()';
	x.children = [];
	
	frcek++;
	
	ReadSpace(str);
	
	var c = str[frcek];
	
	while (c != ')')
	{
		if (c === undefined) { throw new Error('Unclosed paren at char ' + frcek.toString() + ' in string "' + str + '"'); }
		
		var sub = ReadExp(str);
		x.children.push(sub);
		ReadSpace(str);
		c = str[frcek];
	}
	
	frcek++;
	
	return x;
}
function ReadToken(str) {
	var s = '';
	
	var c = str[frcek];
	
	// if we get here, always accept the first token (this is critical for accepting number literals beginning with a '.'
	s += c;
	frcek++;
	c = str[frcek];
	
	while (c && c != '(' && c != ')' && c != '"' && c != "'" && c != ' ' && c != '\t' && c != '\r' && c != '\n' && c != '[' && c != '{' && c != '.' && c != ']')
	{
		s += c;
		frcek++;
		c = str[frcek];
	}
	
	return s;
}
function ReadName(str) {
	var s = '';
	
	var c = str[frcek];
	
	while (c == '_' || c == 'a' || c == 'b' || c == 'c' || c == 'd' || c == 'e' || c == 'f' || c == 'g' || c == 'h' || c == 'i' || c == 'j' || c == 'k' || c == 'l' || c == 'm' || c == 'n' || c == 'o' || c == 'p' || c == 'q' || c == 'r' || c == 's' || c == 't' || c == 'u' || c == 'v' || c == 'w' || c == 'x' || c == 'y' || c == 'z' || c == 'A' || c == 'B' || c == 'C' || c == 'D' || c == 'E' || c == 'F' || c == 'G' || c == 'H' || c == 'I' || c == 'J' || c == 'K' || c == 'L' || c == 'M' || c == 'N' || c == 'O' || c == 'P' || c == 'Q' || c == 'R' || c == 'S' || c == 'T' || c == 'U' || c == 'V' || c == 'W' || c == 'X' || c == 'Y' || c == 'Z' || c == '0' || c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9')
	{
		s += c;
		frcek++;
		c = str[frcek];
	}
	
	return s;
}
function ReadString(str) {
	var s = '';
	
	var quote = str[frcek];
	
	var c = str[frcek];
	
	s += c;
	
	frcek++;
	c = str[frcek];
	
	while (c != quote)
	{
		if (c == '\\')
		{
			frcek++;
			c = str[frcek];
			s += c;
		}
		else
		{
			s += c;
		}
		
		frcek++;
		c = str[frcek];
	}
	
	s += c;
	frcek++;
	
	return s;
}
function ReadNumber(str) {
	var s = '';
	
	var c = str[frcek];
	
	if (c == '+' || c == '-')
	{
		s += c;
		frcek++;
		c = str[frcek];
	}
	
	while (c == '0' || c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9')
	{
		s += c;
		frcek++;
		c = str[frcek];
	}
	
	if (c == '.')
	{
		s += c;
		frcek++;
		c = str[frcek];
	}
	
	while (c == '0' || c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9')
	{
		s += c;
		frcek++;
		c = str[frcek];
	}
	
	// read exponential notation here
	
	return s;
}
function ReadSpace(str) {
	var c = str[frcek];
	
	while (c == ' ' || c == '\t' || c == '\r' || c == '\n')
	{
		frcek++;
		c = str[frcek];
	}
}
function Leaf(str) {
	var x = {};
	x.contents = str;
	x.children = [];
	return x;
}
function CompileCode(slot, str) {
	if (str == "" || str == "null")
	{
		Set(slot, null);
	}
	else if (str.substr(0, 8) == "function")
	{
		var functor = ReadUserDefinedFunction(slot, str);
		Set(slot, functor);
	}
	else if (str.substr(0, 4) == "frce")
	{
		// read a frce function
		// rename the slot to match the function name, so callers can find it
	}
	else if (str[0] == "=")
	{
		CompileFormula(slot, str.substr(1))
	}
	else if (IsDigit(str[0]) || (str.length > 1 && str[0] == '.')) // change this to an IsNumber function - we must allow weird strings
	{
		Set(slot, eval(str));
	}
	else if (str == "true" || str == "false")
	{
		Set(slot, eval(str));
	}
	else
	{
		Set(slot, str);
	}
}
function CompileFormula(slot, str) {
	var tree = ReadFrce(str);
	var code = MakeList(slot, "code");
	code.root = DispatchLisp(code, tree.root);
	slot.code = code;
	
	// retarget the Pointer at code.root to the slot, or through a Ref to the slot
	if (str[0] == '(')
	{
		code.root.$ = slot;
		AddEdge(code.root.node, slot.node, "$", Edge.$);
	}
	else if (str[0] == '#') // an Constraint
	{
		code.root.state = State.Blank;
	}
	else
	{
		// this block deals with simple references (e.g. '=a[b].c') - basically we synthesize an := exp
		
		var exp = MakeExp(code, code.length.toString());
		code.push(exp);
		
		var fptr = MakePointer(code, code.length.toString(), null);
		code.push(fptr);
		fptr.scope = globals;
		fptr.name = ":=";
		
		exp.f = fptr;
		AddEdge(exp.node, fptr.node, "f", Edge.Arg);
		
		exp.args.push(code.root); 
		AddEdge(exp.node, code.root.node, (exp.args.length - 1).toString(), Edge.Arg);
		
		exp.pout = MakePointer(code, code.length.toString(), slot);
		code.push(exp.pout);
		AddEdge(exp.node, exp.pout.node, "pout", Edge.Pout);
	}
	
	var control = MakeControl(code, code.length.toString());

	for (var i = 0; i < code.length; i++)
	{
		var cog = code[i];
		
		AddEdge(control.node, cog.node, i.toString(), Edge.Control);
		
		if (cog.type == Machine.Pointer)
		{
			if (!cog.scope) // . and [] expressions produce pointers with already-bound scopes - bare names produce pointers with unbound scopes
			{
				cog.scope = slot["[parent]"]; // set the scope to the obj - when binding, we search along the [parent] path
			}
		}
	}
	
	code.push(control);
	control.state = State.Active;
	Broadcast(control, Message.Activate, { type : Edge.Control });
	
	globals.calculate = true;
}
function InterpretCode(scope, str) {
	var tree = ReadFrce(str);
	
	var focus = scope;
	
	// find the first ancestor of the cell that is a Collection - that is our scope
	while (focus)
	{
		if (!focus["[type]"])
		{
			focus = focus["[parent]"];
		}
		else
		{
			if (focus["[type]"] == "Collection")
			{
				break;
			}
			else
			{
				focus = focus["[parent]"];
			}
		}
	}
	
	if (!focus)
	{
		throw new Error();
	}
	
	if (tree)
	{
		Eval(focus, tree.root, false);
	}
	
	globals.calculate = true;
}
function Eval(scope, twig, bCreateNewSlotsForUnboundNames) {
	var s = twig.contents;
	
	if (s == "=")
	{
		var lhs = Eval(scope, twig.children[0], true);
		lhs.formula = twig.children[1].contents;
		CompileFormula(lhs, lhs.formula);
		globals.calculate = true;
		SetNewState(lhs, State.Blank); // i mean, right?
	}
	else if (s == ":=")
	{
		var lhs = Eval(scope, twig.children[0], true);
		var rhs = Eval(scope, twig.children[1], false);
		Set(lhs, Get(rhs));
	}
	else if (s == "()")
	{
		var fn = Get(Eval(scope, twig.children[0], false));
		var args = [];
		
		for (var i = 1; i < twig.children.length; i++)
		{
			args.push(Get(Eval(scope, twig.children[i], false)));
		}
		
		var result = null;
		
		if (fn["[type]"] == "Functor") // for javascript in textboxes, and any defined in FRCE (including lambdas)
		{
			fn.f(args);
		}
		else
		{
			fn(args);
		}
		
		return result;
	}
	else if (s == "[]")
	{
		var obj = Get(Eval(scope, twig.children[0], false));
		var fie = Get(Eval(scope, twig.children[1], false));
		var result = obj[fie];
		return result;
	}
	else if (s == ".")
	{
		var slot = Eval(scope, twig.children[0], false);
		var obj = Get(slot);
		var fie = twig.children[1].contents;
		
		//if (fie == "%")
		//{
		//	result = slot["[fieldSlots]"]; // a truly horrific hack - we should probably just make a SetFieldSlotFormula(slot, str) function instead - it can set the .react too
		//}
		//else
		//{
		//	result = obj[fie];
		//}
		
		result = obj[fie];
		
		return result;
	}
	else if (s == "for")
	{
		var variable = twig.children[0].contents;
		var start = parseInt(twig.children[1].contents);
		var end = parseInt(twig.children[2].contents);
	}
	else if (s == "forin")
	{
	
	}
	else if (s == "frce")
	{
	
	}
	else if (s == "lambda")
	{
	
	}
	else
	{
		var c = s[0];
		
		if (c == '.' || c == '0' || c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6' || c == '7' || c == '8' || c == '9')
        {
			return parseFloat(s);
        }
        else if (c == '"' || c == "'")
        {
			return s.substring(1, s.length - 1);
        }
        else
        {
			var focus = scope;
			
			while (focus)
			{
				if (focus[s])
				{
					return focus[s];
				}
				else
				{
					focus = focus["[parent]"];
				}
			}
			
			// if it fails to bind, we get here
			// now what?  if the name is a lhs, we should create a new slot
			// on the other hand, if the name is an rhs, we probably shouldn't create a new slot
			// but in which scope?  this all depends on what scope was initially passed in
			// and that might vary - we think of grid cells as being in the scope of their obj, but we think of textboxes as being in the collection scope
			
			if (bCreateNewSlotsForUnboundNames)
			{
				var newslot = MakeSlot(scope, s, null);
				scope[s] = newslot;
				return newslot;
			}
			else
			{
				throw new Error(); // this error should probably be caught be a try-catch block and propgate upward to invalidate the statement
			}
        }
	}
}

var Lang = {};
Lang.Linize = Linize;
Lang.LinizeBinary = LinizeBinary;
Lang.Tokenize = Tokenize;
Lang.ReadFrce = ReadFrce; // this is used by Kronecker
Lang.ReadNumber = ReadNumber;
Lang.ReadName = ReadName;
Lang.ReadSpace = ReadSpace;
Lang.ReadExp = ReadExp;
Lang.ReadTreeSimple = ReadTreeSimple;
Lang.WriteTreeSimple = WriteTreeSimple;
return Lang;

})();


