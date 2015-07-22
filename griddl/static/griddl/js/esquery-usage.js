
(function () {

function esqueryUsageModule() {

function Driver() {
	
	//ParseJavascriptDriver();
	//ParseCssDriver();
}

// loads file via an ajax call
function ParseJavascriptDriver() {
	
	//var svg = $(document.createElement('svg')).appendTo($('body'));
	
	var div = $(document.createElement('div')).appendTo($('body'));
	
	$.ajax({ url : 'js/lib/timbre.js' , dataType : 'text' , success : function(text) { // 'estraverseTestCode.js' 'js/lib/OrbitControls.js' 'js/lib/timbre.js'
		
		var ast = esprima.parse(text);
		
		var nNodes = AssignNodeIds(ast);
		var nodeArray = new Array(nNodes);
		PutNodesIntoArray(ast, nodeArray);
		
		//var result = IndentreeAnalysis(ast);
		//var ul = MakeIndentreeHtml(result.indents, result.strs);
		//Indentree.applyTo(ul);
		//div.append(ul);
		
		//var result = MemberAnalysis(ast);
		var result = ScopeAnalysis(ast);
		ResolveReferences(result);
		
		debugger;
		
		
		//div.handsontable({ data : indents , height : 600 });
		//Regulartable(div, { data : indents });
		//SvgTree(div, indents);
	}});
}
// loads file via an ajax call
function ParseCssDriver() {
	var div = $(document.createElement('div')).appendTo($('body'));
	
	$.ajax({ url : 'css/example.css' , dataType : 'text' , success : function(text) {
		
		var k = { i : 0 };
		var parse = ParseCss(text, k);
		
		//var result = IndentreeAnalysis(ast);
		//var ul = MakeIndentreeHtml(result.indents, result.strs);
		//Indentree.applyTo(ul);
		//div.append(ul);
		
		//div.handsontable({ data : indents , height : 600 });
		//Regulartable(div, { data : indents });
		//SvgTree(div, indents);
	}});
}
// blank
function ParseHtmlDriver() {

}

// a subsequent function, to perform further work on a scope analysis
function ResolveReferences(scopeAnalysis) {
	
	var unboundRefs = [];
	
	for (var key in scopeAnalysis.referenceToScopeDict)
	{
		var ref = scopeAnalysis.referenceToScopeDict[key];
		var scope = ref.scope;
		var focusScope = scope;
		
		while (focusScope)
		{
			if (focusScope.fields[ref.node.name])
			{
				ref.declarator = focusScope.fields[ref.node.name];
				break;
			}
			
			focusScope = focusScope.parent;
		}
		
		if (!ref.declarator)
		{
			if (unboundRefs.indexOf(ref.node.name) < 0)
			{
				unboundRefs.push(ref.node.name);
			}
		}
	}
}

// blank - this was an aborted attempt to define a constructor for a Scope class
function Scope() {
	
}

// the ast is an esprima parse - the return value is { indents : [ <int> ] , nodes : [ <esprimaNode> ] , strs : [ <string> ] }
// the fields of the returned object are probably meant to feed into MakeIndentreeHtml
function IndentreeAnalysis(ast) {
	var result = {};
	
	result.indents = [];
	result.nodes = [];
	result.strs = [];
	
	var indent = 0;
	
	estraverse.traverse(ast,
	{
		enter : function(node, parent)
		{
			var name = null;
			
			for (var key in parent)
			{
				if (parent[key] == node)
				{
					name = key;
				}
			}
			
			var str = "";
			str += name + ' : ' + node.type;
			
			for (var key in node)
			{
				var val = node[key];
				
				if (typeof(val) != 'object' && typeof(val) != 'array' && key != 'type')
				{
					str += ' , ' + key + ' : ' + val;
				}
			}
			
			result.indents.push(indent);
			result.nodes.push(node);
			result.strs.push(str);
			indent++;
		},
		leave : function(node, parent)
		{
			indent--;
		}
	});
	
	return result;
}

// simply assign an <int> nodeId to each node of the parse tree (depth-first order)
function AssignNodeIds(ast) {
	var c = 0;
	
	estraverse.traverse(ast,
	{
		enter : function(node, parent)
		{
			node.nodeId = c++;
		},
		leave : function(node, parent)
		{
			
		}
	});
	
	return c;
}

// nodeArray goes in empty, comes out filled
function PutNodesIntoArray(ast, nodeArray) {
	estraverse.traverse(ast,
	{
		enter : function(node, parent)
		{
			nodeArray[node.nodeId] = node;
		},
		leave : function(node, parent)
		{
			
		}
	});
}

// a shell function, to be copypasted and modified
function BlankAnalysis(ast) {
	var result = {};
	
	estraverse.traverse(ast,
	{
		enter : function(node, parent)
		{
			
		},
		leave : function(node, parent)
		{
			
		}
	});
	
	return result;
}

// various code analyses using estraverse:
// full-featured
function ScopeAnalysis(ast) {
	// http://stackoverflow.com/questions/500431/javascript-variable-scope
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope
	// http://coding.smashingmagazine.com/2009/08/01/what-you-need-to-know-about-javascript-scope/ - also talks bind, call, apply
	var result = {};
	
	result.nodeTypeToNodeListDict = {};
	result.allScopes = [];
	result.declaratorToScopeDict = {};
	result.referenceToScopeDict = {};
	result.lhsToScopeDict = {};
	result.fieldDict = {};
	
	var globalScope = {};
	globalScope.parent = null;
	globalScope.node = ast;
	globalScope.fields = {};
	
	var scope = globalScope;
	var scopes = [ globalScope ];
	
	result.allScopes.push(globalScope);
	
	estraverse.traverse(ast,
	{
		enter : function(node, parent)
		{
			if (!result.nodeTypeToNodeListDict[node.type]) { result.nodeTypeToNodeListDict[node.type] = []; }
			result.nodeTypeToNodeListDict[node.type].push(node);
			
			if (node.type == 'FunctionDeclaration' || node.type == 'FunctionExpression')
			{
				var parentScope = scope;
				scope = {};
				scope.parent = parentScope;
				scope.node = node;
				scope.fields = {};
				scopes.push(scope);
				result.allScopes.push(scope);
			}
			
			if (node.type == 'Identifier')
			{
				var declarator = false;
				var lhs = false;
				var reference = false;
				var field = false;
				
				if (parent.type == 'FunctionDeclaration' || parent.type == 'FunctionExpression')
				{
					var isParam = (parent.params.indexOf(node) >= 0);
					var isDefault = (parent.defaults.indexOf(node) >= 0);
					var isId = (parent.id == node);
					if (isDefault) { reference = true; }
					if (isParam) { declarator = true; }
					if (isId || parent.type == 'FunctionDeclaration') { declarator = true; } // but the scope of this name is the *parent* of the function scope - this is patched later
				}
				else if (parent.type == 'CallExpression' || parent.type == 'NewExpression')
				{
					var isCallee = (parent.callee == node);
					var isArgument = (parent.arguments.indexOf(node) >= 0);
					if (isCallee || isArgument) { reference = true; }
				}
				else if (parent.type == 'VariableDeclarator')
				{
					// if (parent.parent.kind == 'let') { // block scope; }
					// if (parent.parent.kind == 'var') { // function scope; }
					var isId = (parent.id == node);
					var isInit = (parent.init == node);
					if (isId) { declarator = true; } // should we also check if there's an init and flag an lhs if there is?
					if (isInit) { reference = true; }
				}
				else if (parent.type == 'AssignmentExpression' || parent.type == 'ForInStatement' || parent.type == 'ForOfStatement')
				{
					var isLeft = (parent.left == node);
					var isRight = (parent.right == node);
					if (isLeft) { lhs = true; }
					if (isRight) { reference = true; }
				}
				else if (parent.type == 'BinaryExpression' || parent.type == 'LogicalExpression')
				{
					var isLeft = (parent.left == node);
					var isRight = (parent.right == node);
					if (isLeft || isRight) { reference = true; }
				}
				else if (parent.type == 'UnaryExpression')
				{
					reference = true;
				}
				else if (parent.type == 'UpdateExpression')
				{
					lhs = true;
					reference = true;
				}
				else if (parent.type == 'MemberExpression')
				{
					var isObject = (parent.object == node);
					var isProperty = (parent.property == node);
					if (isObject) { reference = true; }
					if (isProperty) { if (parent.computed) { reference = true; } else { field = true; } }
				}
				else if (parent.type == 'IfStatement' || parent.type == 'WhileStatement' || parent.type == 'DoWhileStatement' || parent.type == 'SwitchCase')
				{
					var isTest = (parent.test == node);
					if (isTest) { reference = true; }
				}
				else if (parent.type == 'ConditionalExpression')
				{
					var isTest = (parent.test == node);
					var isConsequent = (parent.consequent == node);
					var isAlternate = (parent.alternate == node);
					if (isTest || isConsequent || isAlternate) { reference = true; }
				}
				else if (parent.type == 'ReturnStatement' || parent.type == 'ThrowStatement' || parent.type == 'YieldExpression')
				{
					var isArgument = (parent.argument == node);
					if (isArgument) { reference = true; }
				}
				else if (parent.type == 'WithStatement')
				{
					var isObject = (parent.object == node);
					if (isObject) { reference = true; }
				}
				else if (parent.type == 'SwitchStatement')
				{
					var isDiscriminant = (parent.discriminant == node);
					if (isDiscriminant) { reference = true; }
				}
				else if (parent.type == 'Property')
				{
					var isKey = (parent.key == node);
					var isValue = (parent.value == node);
					if (isKey) { lhs = true; } // also kind of a declaration, i guess?  and it indicates that there is a field with this name in this object
					if (isValue) { reference = true; }
				}
				else if (parent.type == 'ArrayExpression')
				{
					reference = true;
				}
				else if (parent.type == 'ForStatement')
				{
					var isInit = (parent.init == node);
					var isTest = (parent.test == node);
					var isUpdate = (parent.update == node);
					if (isInit || isTest || isUpdate) { reference = true; } // this is probably useless - it is highly unlikely that any of these is a plain identifier
				}
				else if (parent.type == 'LabeledStatement' || parent.type == 'BreakStatement' || parent.type == 'ContinueStatement')
				{
					// do nothing - the Identifier is just a label in this case
				}
				else if (parent.type == 'CatchClause')
				{
					declarator = true;
					lhs = true; // necessary?
				}
				else
				{
					throw new Error();
				}
				
				// try statement
				
				if (declarator)
				{
					if (parent.type == 'FunctionDeclaration')
					{
						// use scope.parent instead of scope ('scope' at this point refers to the function scope)
						scope.parent.fields[node.name] = node;
						result.declaratorToScopeDict[node.nodeId] = { node : node , scope : scope.parent };
					}
					else
					{
						scope.fields[node.name] = node;
						result.declaratorToScopeDict[node.nodeId] = { node : node , scope : scope };
					}
				}
				
				if (reference)
				{
					result.referenceToScopeDict[node.nodeId] = { node : node , scope : scope };
				}
				
				if (lhs)
				{
					result.lhsToScopeDict[node.nodeId] = { node : node , scope : scope };
				}
				
				if (field)
				{
					result.fieldDict[node.nodeId] = { node : node , memberexp : parent };
				}
			}
		},
		leave : function(node, parent)
		{
			if (node.type == 'FunctionDeclaration' || node.type == 'FunctionExpression')
			{
				scopes.pop();
				scope = scopes.pop();
				scopes.push(scope);
			}
		}
	});
	
	return result;
}
// mostly blank
function CallAnalysis(ast) {
	var result = {};
	
	estraverse.traverse(ast,
	{
		enter : function(node, parent)
		{
			if (node.type == 'CallExpression' || node.type == 'NewExpression')
			{
				
			}
		},
		leave : function(node, parent)
		{
			
		}
	});
	
	return result;
}
// mostly blank
function AssignmentAnalysis(ast) {
	var result = {};
	
	estraverse.traverse(ast,
	{
		enter : function(node, parent)
		{
			if (node.type == 'AssignmentExpression')
			{
				
			}
		},
		leave : function(node, parent)
		{
			
		}
	});
	
	return result;
}
// fairly simple
function MemberAnalysis(ast) {
	var result = {};
	result.lst = [];
	
	estraverse.traverse(ast,
	{
		enter : function(node, parent)
		{
			if (node.type == 'MemberExpression')
			{
				if (node.object.type == 'Identifier')
				{
					result.lst.push(node.object.name);
				}
			}
		},
		leave : function(node, parent)
		{
			
		}
	});
	
	return result;
}

// generates the <ul><li><a> structure of an Indentree
// indents = [ 0 , 1 , 2 , 2 , 1 ]
// strs = [ 'foo' , 'bar' ]
// returns: $ul
function MakeIndentreeHtml(indents, strs) {
	
	var focusul = null;
	var focusli = null;
	var focusindent = -1;
	var ulstack = [];
	
	//var li = $(document.createElement('li'));
	//li.html(strs[0]);
	//focusul.append(li);
	//ulstack[0] = focusul;
	
	for (var i = 0; i < strs.length; i++)
	{
		var str = strs[i];
		
		if (indents[i] > focusindent)
		{
			var ul = $(document.createElement('ul'));
			focusul = ul;
			ulstack[indents[i]] = ul;
			
			ul.css('display', 'block');
			
			if (focusli)
			{
				focusli.append(ul);
				li.addClass('indentreeOpen');
			}
		}
		else
		{
			focusul = ulstack[indents[i]]
		}
		
		var li = $(document.createElement('li'));
		var span = $(document.createElement('span'));
		li.append(span);
		span.html(str);
		var type = (str.indexOf(' ') == -1) ? str : (str.substr(0, str.indexOf(' ')));
		span.css('color', colors[type]);
		focusul.append(li);
		focusindent = indents[i];
		focusli = li;
	}
	
	return ulstack[0];
}

var colordefs = {
red : 'rgb(255,0,0)',
gold : 'rgb(255,128,0)',
limegreen : 'rgb(200,255,0)',
green : 'rgb(0,255,0)',
blue : 'rgb(0,0,255)',
gray : 'rgb(128,128,128)',
black : 'rgb(0,0,0)',
darkgray : 'rgb(100,100,100)',
pink : 'rgb(255,200,200)',
lightpurple : 'rgb(200,0,200)',
purple : 'rgb(100,0,100)',
};
var colors = {
	AssignmentExpression: colordefs.gold,
	ArrayExpression: colordefs.pink,
	ArrayPattern: colordefs.pink,
	ArrowFunctionExpression: colordefs.green,
	BlockStatement: colordefs.blue,
	BinaryExpression: colordefs.green,
	BreakStatement: colordefs.blue,
	CallExpression: colordefs.red,
	CatchClause: colordefs.blue,
	ClassBody: colordefs.lightpurple,
	ClassDeclaration: colordefs.lightpurple,
	ClassExpression: colordefs.lightpurple,
	ConditionalExpression: colordefs.green,
	ContinueStatement: colordefs.blue,
	DebuggerStatement: colordefs.blue,
	DirectiveStatement: colordefs.blue,
	DoWhileStatement: colordefs.blue,
	EmptyStatement: colordefs.blue,
	ExpressionStatement: colordefs.green,
	ForStatement: colordefs.blue,
	ForInStatement: colordefs.blue,
	FunctionDeclaration: colordefs.purple,
	FunctionExpression: colordefs.purple,
	Identifier: colordefs.gray,
	IfStatement: colordefs.blue,
	Literal: colordefs.black,
	LabeledStatement: colordefs.blue,
	LogicalExpression: colordefs.green,
	MemberExpression: colordefs.limegreen,
	MethodDefinition: colordefs.purple,
	NewExpression: colordefs.green,
	ObjectExpression: colordefs.pink,
	ObjectPattern: colordefs.pink,
	Program: colordefs.black,
	Property: colordefs.pink,
	ReturnStatement: colordefs.blue,
	SequenceExpression: colordefs.pink,
	SwitchStatement: colordefs.blue,
	SwitchCase: colordefs.blue,
	ThisExpression: colordefs.gray,
	ThrowStatement: colordefs.blue,
	TryStatement: colordefs.blue,
	UnaryExpression: colordefs.green,
	UpdateExpression: colordefs.green,
	VariableDeclaration: colordefs.darkgray,
	VariableDeclarator: colordefs.darkgray,
	WhileStatement: colordefs.blue,
	WithStatement: colordefs.blue,
	YieldExpression: colordefs.green
};

// uses Dimension to generate an old-fashioned rootree
function SvgTree(div, objs) {
	var width = 11;
	var height = 7;
	
	var indents = []; for (var i = 0; i < objs.length; i++) { indents.push(objs[i].indent); }
	var dxs = Dimension.Dimension(indents, width);
	
	var svg = $(document.createElement('svg'));
	
	for (var i = 0; i < objs.length; i++)
	{
		if (i > 0 && i % 1000 == 0) { console.log(i); }
		var box = $(document.createElement('rect'));
		box.attr('x', dxs[i]);
		box.attr('y', objs[i].indent * height * 2);
		box.attr('width', width);
		box.attr('height', height);
		box.css('fill', colors[objs[i].node.type]);
		svg.append(box);
	}
	
	div.append(svg);
}
// a drop-in replacement for handsontable - reads objs from options.data
function Regulartable(div, options) {
	var table = $(document.createElement('table'));
	var objs = options.data;
	var keys = [];
	for (var key in objs[0]) { keys.push(key); }
	
	for (var i = 0; i < objs.length; i++)
	{
		var tr = $(document.createElement('tr'));
		for (var j = 0; j < keys.length; j++)
		{
			var td = $(document.createElement('td'));
			td.html(objs[i][keys[j]]);
			tr.append(td);
		}
		table.append(tr);
	}
	
	div.append(table);
}

// to be honest, i have no idea where this came from or what it's supposed to do.  it's not my code
function update() {
	var ast;
	eval("ast = " + astNode.value);
	
	var selector = selectorNode.value;
	selectorAstNode.innerHTML = "";
	outputNode.innerHTML = "";
	
	var start, end, selectorAst, selectorAstOutput, matches, matchesOutput;
	
	try {
		start = performance.now();
	} catch (e) {
		start = Date.now();
	}
	
	try {
		selectorAst = esquery.parse(selector);
	} catch (e) {
		selectorAstOutput = e.message;
	}
	
	try {
		var matches = esquery.match(ast, selectorAst);
	} catch (e) {
		matchesOutput = e.message;
	}
	
	try {
		end = performance.now();
	} catch (e) {
		end = Date.now();
	}
	
	selectorAstOutput = selectorAstOutput || JSON.stringify(selectorAst, null, "  ");
	matchesOutput = matchesOutput || JSON.stringify(matches, null, "  ");
	
	selectorAstNode.appendChild(document.createTextNode(selectorAstOutput));
	outputNode.appendChild(document.createTextNode((matches ? matches.length : 0) + " nodes found in " + (end - start) + "ms\n" + matchesOutput));
}

//var astNode = document.getElementById("ast");
//var selectorNode = document.getElementById("selector");
//var selectorAstNode = document.getElementById("selectorAst");
//var outputNode = document.getElementById("output");
//update();
//astNode.addEventListener("change", update);
//selectorNode.addEventListener("change", update);
//selectorNode.addEventListener("keyup", update);
//outputNode.addEventListener("change", update);

var EsqueryUsage = {};
EsqueryUsage.MakeIndentreeHtml = MakeIndentreeHtml;
EsqueryUsage.IndentreeAnalysis = IndentreeAnalysis;
EsqueryUsage.AssignNodeIds = AssignNodeIds;
EsqueryUsage.PutNodesIntoArray = PutNodesIntoArray;
return EsqueryUsage;

}

if (typeof define === "function" && define.amd) {
	define(esqueryUsageModule);
} else if (typeof module !== 'undefined' && module.exports) {
	module.exports = esqueryUsageModule();
} else {
	this.EsqueryUsage = esqueryUsageModule();
}

})();

