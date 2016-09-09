
/*

we need to do keyboard controls first - keyboard controls allow us to survive without boxes and without mouse events

of course we need to figure out the semantics

the Tree controls the handles only - the Twig controls handlers on its display

the easiest thing is to just display one big input to edit twig content - syntax for JSON and HTML may be different

*/


var Tree = function() {
	
	this.ctx = null;
	this.data = null;
	
	this.twigs = null; // visible twigs only - useful for up and down arrow selection
	this.selectedIndex = 0;
	this.selected = null; // Twig
	
	this.inputAppended = false;
	this.input = document.createElement('input');
	this.input.type = 'text';
	this.input.style.position = 'absolute';
	
	this.root = null;
	
	this.indent = 20;
	this.handleRadius = 5;
	this.handleMargin = 10;
	this.twigHeight = 20;
	this.vGap = 10;
	
	this.box = {};
	this.box.lf = 50;
	this.box.tp = 50;
	
	this.subs = [];
	
	this.handleBoxes = [];
	this.keyBoxes = [];
	this.valBoxes = [];
};
Tree.prototype.draw = function() {
	
	var tree = this;
	
	var cy = tree.box.tp;
	
	tree.ctx.clearRect(0, 0, tree.ctx.canvas.width, tree.ctx.canvas.height);
	tree.twigs = [];
	tree.selectedIndex = null;
	
	tree.ctx.font = '10pt Courier New';
	
	function DrawTwigRec(ctx, twig, cx) {
		
		tree.twigs.push(twig);
		
		//var handleBox = new Box(tree);
		//handleBox.x = cx;
		//handleBox.y = cy;
		//handleBox.hAlign = 'center';
		//handleBox.vAlign = 'center';
		//handleBox.wd = tree.handleRadius * 2;
		//handleBox.hg = tree.handleRadius * 2;
		//handleBox.align();
		//handleBox.onhover = function() { tree.ctx.canvas.style.cursor = 'pointer'; };
		//tree.handleBoxes.push(handleBox);
		//tree.subs.push(handleBox);
		
		// selected dots
		if (twig == tree.selected)
		{
			tree.selectedIndex = tree.twigs.length - 1;
			DrawDottedRect(ctx, cx - tree.handleRadius - 2, cy - tree.handleRadius - 2, tree.handleRadius * 2 + 5)
		}
		
		// handle
		ctx.strokeRect(cx - tree.handleRadius + 0.5, cy - tree.handleRadius + 0.5, tree.handleRadius * 2, tree.handleRadius * 2);
		
		if (twig.children != null)
		{
			ctx.beginPath();
			ctx.moveTo(cx - 1, cy+0.5);
			ctx.lineTo(cx + 3, cy+0.5);
			ctx.stroke();
			
			if (!twig.visible)
			{
				ctx.beginPath();
				ctx.moveTo(cx+0.5, cy - 2);
				ctx.lineTo(cx+0.5, cy + 2);
				ctx.stroke();
			}
			
			//ctx.stroke();
		}
		
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillText(twig.write(), cx + tree.handleRadius + tree.handleMargin, cy+0.5);
		
		cy += tree.twigHeight + tree.vGap;
		
		if (twig.visible && twig.children != null)
		{
			for (var i = 0; i < twig.children.length; i++)
			{
				DrawTwigRec(ctx, twig.children[i], cx + tree.indent);
			}
		}
	}
	
	DrawTwigRec(tree.ctx, tree.root, tree.box.lf);
};
Tree.prototype.setHandlers = function() {
	
	var tree = this;
	var ctx = tree.ctx;
	
	var mx = null;
	var my = null;
	
	var hovered = null;
	
	ctx.canvas.onmousemove = function(e) {
		
		mx = e.offsetX;
		my = e.offsetY;
		
		var hit = false;
		
		for (var i = 0; i < tree.subs.length; i++)
		{
			var sub = tree.subs[i];
			
			if (sub.lf <= mx && mx <= sub.rt && sub.tp <= my && my <= sub.bt)
			{
				hovered = sub;
				sub.onhover();
				hit = true;
				break;
			}
		}
		
		if (!hit && hovered)
		{
			hovered = null;
			tree.ctx.canvas.style.cursor = 'default';
		}
	};

	var modkeys = {shift:false,ctrl:false,alt:false};
	var modmap = {16:'shift',17:'ctrl',18:'alt'};
	
	ctx.canvas.onkeyup = function(e) { if (modmap[e.keyCode]) { modkeys[modmap[e.keyCode]] = false; } };
	ctx.canvas.onkeydown = function(e) {
		
		var key = e.keyCode;
		var letter = e.key;
		
		var selected = tree.selected;
		
		e.preventDefault();
		e.stopPropagation();
		
		if (key == 16)
		{
			modkeys.shift = true;
		}
		else if (key == 17)
		{
			modkeys.ctrl = true;
		}
		else if (key == 18)
		{
			modkeys.alt = true;
		}
		else if (key == 9)
		{
			
		}
		else if (key == 27)
		{
			//tree.selectedIndex = null;
			//tree.selected = null;
		}
		else if (key == 32)
		{
			var indent = 0;
			var focus = selected;
			
			while (focus != null)
			{
				indent++;
				focus = focus.parent;
			}
			
			var lf = tree.box.lf + indent * tree.indent - 10;
			var tp = tree.box.tp + tree.twigs.indexOf(selected) * (tree.twigHeight + tree.vGap) - 10;
			
			var input = tree.input;
			if (tree.inputAppended) { input.style.display = 'block'; } else { tree.ctx.canvas.parentElement.appendChild(input); tree.inputAppended = true; }
			input.style.left = lf + 'px';
			input.style.top = tp + 'px';
			input.value = tree.selected.write();
			input.focus();
			
			input.onkeydown = function(e) {
				
				var key = e.keyCode;
				
				if (key == 27)
				{
					input.style.display = 'none';
					input.value = '';
					ctx.canvas.focus();
					
					e.preventDefault();
					e.stopPropagation();
					
					//tree.draw();
				}
				else if (key == 13)
				{
					input.style.display = 'none';
					tree.selected.parse(input.value);
					ctx.canvas.focus();
					
					e.preventDefault();
					e.stopPropagation();
					
					tree.draw();
				}
			};
		}
		else if (key == 37 || key == 39)
		{
			// Ctrl = toggle descendants
			// Shift = toggle siblings
			// Alt + Shift = toggle cousins - not implemented yet
			
			// Alt = insert/delete
			// insert first child
			// insert last child
			// insert prev sibling
			// insert next sibling
			// insert parent
			
			var visible = (key == 39);
			
			var toToggle = [];
			
			if (modkeys.shift)
			{
				toToggle = toToggle.concat(selected.parent.children);
			}
			else
			{
				toToggle.push(selected);
			}
			
			if (modkeys.ctrl)
			{
				var newToToggle = [];
				toToggle.forEach(function(twig) { newToToggle = newToToggle.concat(twig.descendants()); });
				toToggle = newToToggle;
			}
			
			toToggle.forEach(function(twig) { twig.visible = visible; });
		}
		else if (key == 38 || key == 40)
		{
			
			// Ctrl = move to first sibling
			
			if (key == 38)
			{
				tree.selectedIndex = Math.max(0, tree.selectedIndex - 1);
			}
			else if (key == 40)
			{
				tree.selectedIndex = Math.min(tree.twigs.length - 1, tree.selectedIndex + 1);
			}
			
			tree.selected = tree.twigs[tree.selectedIndex];
		}
		
		if (letter == 'u')
		{
			Upload();
		}
		else if (letter == 'd')
		{
			Download();
		}
		
		tree.draw();
	};
	
};

function Descendants() {
	
	var l = [];
	
	function DescendantsRec(twig) {
		
		if (twig.children != null)
		{
			l.push(twig);
			
			for (var i = 0; i < twig.children.length; i++)
			{
				DescendantsRec(twig.children[i]);
			}
		}
	}
	
	DescendantsRec(this);
	
	return l;
}

var JsonTwig = function() {
	
	this.type = null; // "{}" or "[]" or "prim"
	
	this.parent = null; // Twig, or null if root
	
	// {} or [] only
	this.visible = true;
	this.children = null; // [Twig]
	
	this.obj = null; // null if root, otherwise references the parent {} or [] of the json
	this.key = null; // text to display
	this.val = null; // text to display
};
JsonTwig.prototype.parse = function(text) {
	
	var parts = text.split(':').map(x => x.trim());
	var newkey = parts[0];
	var newval = parts[1];
	
	if (newkey != this.key) { delete this.obj[this.key]; }
	
	this.obj[newkey] = newval; // parse as needed
	
	this.key = newkey;
	this.val = newval;
};
JsonTwig.prototype.write = function() {
	return this.key.toString() + ' : ' + this.val.toString()
};
JsonTwig.prototype.descendants = Descendants;
function JsonToTwigRec(json, key) {
	
	if (key === undefined) { key = '[root]'; }
	
	var type = Object.prototype.toString.apply(json);
	var twig = new JsonTwig();
	twig.key = key;
	
	if (type == '[object Object]')
	{
		twig.type = '{}';
		twig.val = '{}';
		twig.children = [];
		
		for (var key in json)
		{
			var child = JsonToTwigRec(json[key], key);
			twig.children.push(child);
			child.obj = json;
			child.parent = twig;
		}
	}
	else if (type == '[object Array]')
	{
		twig.type = '[]';
		twig.val = '[]';
		twig.children = [];
		
		for (var i = 0; i < json.length; i++)
		{
			var child = JsonToTwigRec(json[i], i);
			twig.children.push(child);
			child.obj = json;
			child.parent = twig;
		}
	}
	else
	{
		twig.type = 'prim';
		twig.val = json;
	}
	
	return twig;
}

var HtmlTwig = function() {
	
	this.parent = null;
	this.children = []; // HtmlTwig
	this.name = null;
	this.text = null;
	this.attrs = []; // {key,val}
};
HtmlTwig.prototype.write = function() {
	
	if (this.text != null) { return this.text; }
	
	return '<' + this.name + this.attrs.map(attr => (' ' + attr.key.toString + '="' + attr.val.toString() + '"')) + '>';
};
HtmlTwig.prototype.descendants = Descendants;
function HtmlToTwigRec(html) {
	
}

function DrawDottedRect(ctx, lf, tp, wd) {
	
	// wd should be odd, lf and tp should be integers
	
	ctx.setLineDash([1,1]);
	ctx.beginPath();
	ctx.moveTo(lf, tp+0.5);
	ctx.lineTo(lf+wd, tp+0.5);
	ctx.moveTo(lf+wd-0.5, tp);
	ctx.lineTo(lf+wd-0.5, tp+wd);
	ctx.moveTo(lf+wd, tp+wd-0.5);
	ctx.lineTo(lf, tp+wd-0.5);
	ctx.moveTo(lf+0.5, tp+wd);
	ctx.lineTo(lf+0.5, tp);
	ctx.stroke();
	ctx.setLineDash([1,0]);
}

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
	
	var lines = [];
	WriteTreeSimpleRec(0, lines, root);
	return lines;
}


