
(function () {

function treeModule() {

// MakeTwigs([ 0 , 1 ] , [ 'foo , 'bar' ]) => { value : 'foo' , children [ { value : 'bar' , children : [] } ] }
function MakeTwigs(indents, strs) {
	var parents = [];
	
	for (var i = 0; i < indents.length; i++)
	{
		var twig = { value : strs[i] , children : [] };
		
		var indent = indents[i];
		
		if (indent > 0)
		{
			parents[indent - 1].children.push(twig);
		}
		
		parents[indent] = twig;
	}
	
	var root = parents[0];
	return root;
}

function MakeTree(parent, name) {
	var tree = MakeObj(parent, name);
	tree.cells = MakeList(tree, "cells");
	tree.twigs = MakeList(tree, "twigs");
	tree.indents = MakeList(tree, "indents");
	tree.root = null;
	return tree;
}
function GenerateTwigs(tree) {
	var parents = [];
	
	for (var i = 0; i < tree.indents.length; i++)
	{
		var indent = tree.indents[i];
		
		var twig = MakeObj(tree.twigs, i.toString());
		tree.twigs[i] = twig;
		
		twig.children = MakeList(twig, "children");
		twig.cell = tree.cells[i];
		
		if (i == 0)
		{
			tree.root = twig;
		}
		
		if (indent == 0)
		{
			twig.parent = null;
		}
		else
		{
			twig.parent = parents[indent - 1];
			parents[indent - 1].children.push(twig);
		}
		
		parents[indent] = twig;
	}
}
function GenerateFlatListsFromRootTwig(tree) {
	tree.twigs = MakeList(tree, "twigs");
	tree.cells = MakeList(tree, "cells");
	tree.indents = MakeList(tree, "indents");
	
	DepthFirst(tree.twigs, tree.root);
	
	for (var i = 0; i < tree.twigs.length; i++)
	{
		var twig = tree.twigs[i];
		AddBracketFields(twig, tree.twigs, i.toString());
		
		tree.cells.push(twig.cell);
		
		var indent = 0;
		
		while (twig.parent) // this isn't as efficient as it could be, but i don't think it's a problem
		{
			twig = twig.parent;
			indent++;
		}
		
		tree.indents.push(indent);
	}
}
function DepthFirst(l, root) {
	l.push(root);
	
	for (var i = 0; i < root.children.length; i++)
	{
		root.children[i].parent = root;
		
		DepthFirst(l, root.children[i]);
	}
}
function GetTwigDescendants(twig) {
	var l = [];
	
	for (var i = 0; i < twig.children.length; i++)
	{
		var child = twig.children[i];
		l.push(child);
		var m = GetTwigDescendants(child);
		l.concat(m);
	}
	
	return l;
}
function OnFocusTree(tree) {
	globals.focussed = tree; // this can be replaced by throwing in a .frce-selected class (which can also style the element)
	
	// all these handlers can be permanently attached to the ancestor tree object - these keystrokes will bubble up
	Push("Up", SelectParent);
	Push("Down", SelectFirstChild);
	Push("Left", SelectPrevSibling);
	Push("Right", SelectNextSibling);
	Push("Ctrl+Up", SelectRoot);
	Push("Ctrl+Left", SelectFirstSibling);
	Push("Ctrl+Right", SelectLastSibling);
	Push("Ctrl+Down", SelectYoungest);
	Push("Alt+Up", AddParent);
	Push("Alt+Down", AddLastChild);
	Push("Alt+Left", AddPrevSibling);
	Push("Alt+Right", AddNextSibling);
	Push("Ctrl+Shift+Down", SelectSubtree);
}
function EditSelectedSetTreeShape(treeShape, content, add) {
	if (add)
	{
		treeShape.activeContent = content;
	}
	else
	{
		treeShape.activeContent = null;
	}
	
	globals.redraw = true;
}

var Tree = {};
Tree.MakeTwigs = MakeTwigs;
return Tree;

}

if (typeof define === "function" && define.amd) {
	define(treeModule);
} else if (typeof module !== 'undefined' && module.exports) {
	module.exports = treeModule();
} else {
	this.Tree = treeModule();
}

})();

