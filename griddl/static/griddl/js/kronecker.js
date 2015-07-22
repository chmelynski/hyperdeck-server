
var Kronecker;
(function (Kronecker) {
	
	var varnameDict = {};
	varnameDict['mu'] = '\\mu';
	varnameDict['epsilon'] = '\\varepsilon';
	varnameDict['rho'] = '\\rho';
	
	var fixedCharWidthPx = 14;
	var fixedCharHeightPx = 16;
	var padding = 4;
	
	var InfixBoxtree = function(subs, infixText) {
		
		var width = 0;
		var height = fixedCharHeightPx;
		var subboxes = [];
		
		width += padding;
		
		for (var i = 1; i < subs.length; i++)
		{
			var subbox = subs[i].ToBoxtree();
			subboxes.push(subbox);
			var infixWidth = fixedCharWidthPx * infixText.length; // or measureText(infixText)
			width += subbox.width;
			
			if (i < subs.length - 1)
			{
				width += padding + infixWidth + padding;
				subboxes.push({ width : infixWidth , height : fixedCharHeightPx , subboxes : [] , text : infixText , drawBox : false  });
			}
			
			if (subbox.height > height) { height = subbox.height; }
		}
		
		width += padding;
		height += padding + padding;
		
		return  { width : width , height : height , subboxes : subboxes , drawBox : true  };
	};
	var PrefixBoxtree = function(subs, prefixText) {
		
		var width = 0;
		var height = fixedCharHeightPx;
		var subboxes = [];
		
		var prefixWidth = fixedCharWidthPx * prefixText.length; // or measureText(prefixText)
		
		width += padding + prefixWidth + padding;
		
		subboxes.push({ width : prefixWidth , height : fixedCharHeightPx , subboxes : [] , text : prefixText , drawBox : false });
		
		for (var i = 1; i < subs.length; i++)
		{
			var subbox = subs[i].ToBoxtree();
			
			width += subbox.width + padding;
			
			if (subbox.height > height) { height = subbox.height; }
			
			subboxes.push(subbox);
		}
		
		height += padding + padding;
		
		return  { width : width , height : height , subboxes : subboxes , drawBox : true  };
	};
	var AtomBoxtree = function(text) {
		var width = fixedCharWidthPx * text.length; // or measureText(text)
		var height = fixedCharHeightPx;
		return  { width : width , height : height , subboxes : [] , text : text , drawBox : true };
	};
	
	var CalculateBoxtreeTopLefts = function(boxtree) { CalculateBoxtreeTopLeftsRec(boxtree, 0, 0); };
	
	var CalculateBoxtreeTopLeftsRec = function(boxtree, left, top) {
		
		boxtree.left = left;
		boxtree.top = top;
		
		left += padding;
		
		for (var i = 0; i < boxtree.subboxes.length; i++)
		{
			var subbox = boxtree.subboxes[i];
			var subheight = subbox.height;
			var heightgap = (boxtree.height - subbox.height) / 2;
			CalculateBoxtreeTopLeftsRec(subbox, left, top + heightgap);
			left += subbox.width + padding;
		}
	};
	
	var ConvertBoxtreeToSVG = function(boxtree) {
		
		var eltStrings = [];
		
		BoxtreeToRectRec(boxtree, eltStrings);
		
		var xmlnss = 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"';
		var svg = '<svg ' + xmlnss + ' width="' + (boxtree.width + 2).toString() + '" height="' + (boxtree.height + 2).toString() + '">' + eltStrings.join('') + '</svg>'
		
		return svg;
	};
	var BoxtreeToRectRec = function(boxtree, eltStrings) {
		var x = (Math.floor(boxtree.left, 1) + 0.5).toString();
		var y = (Math.floor(boxtree.top, 1) + 0.5).toString();
		var width = (Math.floor(boxtree.width, 1)).toString();
		var height = (Math.floor(boxtree.height, 1)).toString();
		
		if (boxtree.drawBox)
		{
			var rect = '<rect stroke="black" fill="white" ' + 'x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '"></rect>';
			eltStrings.push(rect);
		}
		
		if (boxtree.text)
		{
			var x = (Math.floor(boxtree.left + 2, 1) + 0.5).toString();
			var y = (Math.floor(boxtree.top + boxtree.height - 3, 1) + 0.5).toString();
			var text = '<text font-family="Courier New" ' + 'x="' + x + '" y="' + y + '">' + boxtree.text + '</text>';
			eltStrings.push(text);
		}
		
		for (var i = 0; i < boxtree.subboxes.length; i++) { BoxtreeToRectRec(boxtree.subboxes[i], eltStrings); }
		
		//if (boxtree.drawBox)
		//{
		//	eltStrings.push('</rect>');
		//}
	};
	
	// sexp : { contents : '()' , children : [] }
	// Exp : { subs : [ Add , Exp , Variable ] }
	// Variable : { name : string , latex : string }
	// Matrix : { value : [[Exp,Exp,Exp],[Exp,Exp,Exp],[Exp,Exp,Exp]] }
	
	
	var Read = function(sexp) {
		
		
		if (sexp.contents == '()')
		{
			var x = new Exp();
			
			for (var i = 0; i < sexp.children.length; i++)
			{
				x.subs.push(Read(sexp.children[i]));
			}
			
			return x;
		}
		else
		{
			if (Kronecker[sexp.contents])
			{
				return new Kronecker[sexp.contents]();
			}
			else
			{
				return new Variable(sexp.contents);
			}
		}
	};
	
	var Exp = (function() {
		
		function Exp() {
			this.subs = [];
		}
		
		Exp.prototype.Clone = function() {
			var clone = new Exp();
			
			for (var i = 0; i < this.subs.length; i++)
			{
				if (this.subs[i].Clone)
				{
					clone.subs.push(this.subs[i].Clone());
				}
				
				else // this sub-branch should be handled in a parent class of function, Number, other leaf nodes
				{
					clone.subs.push(new this.subs[i].constructor());
				}
			}
			
			return clone;
		};
		
		Exp.prototype.Substitute = function(varname, exp) {
			
			// this modifies the Exp in place and should thus usually be performed on clones
			for (var i = 0; i < this.subs.length; i++)
			{
				if (this.subs[i].constructor.name == 'Variable' && this.subs[i].name == varname)
				{
					this.subs[i] = exp; // note that we're not subbing in a clone of the exp - any clone must be done in calling code
				}
				else if (this.subs[i].Substitute)
				{
					this.subs[i].Substitute(varname, exp);
				}
			}
		};
		
		Exp.prototype.ToLatex = function() {
			return this.subs[0].ToLatex(this.subs);
		};
		
		Exp.prototype.ToBoxtree = function() {
			return this.subs[0].ToBoxtree(this.subs);
		};
		
		Exp.prototype.Type = function() { return 'Exp'; }
		
		return Exp;
	})();
	var Variable = (function() {
		
		function Variable(name) {
			this.name = name;
			this.latex = name;
			
			var varname = name;
			var suffix = '';
			var indexOfUnderscore = name.indexOf('_');
			if (indexOfUnderscore > 0)
			{
				varname = name.substr(0, indexOfUnderscore);
				suffix = name.substr(indexOfUnderscore);
			}
			
			if (varnameDict[varname])
			{
				this.latex = varnameDict[varname] + suffix; // change this if we implement _bold
			}
		}
		
		Variable.prototype.Clone = function() {
			return new Variable(this.name);
		};
		
		Variable.prototype.ToLatex = function() {
			return this.latex;
		};
		
		Variable.prototype.ToBoxtree = function() { return AtomBoxtree(this.name); };
		Variable.prototype.Type = function() { return 'Variable'; }
		
		return Variable;
	})();
	var Equals = (function() {
		
		function Equals() { }
		
		Equals.prototype.ToLatex = function(subs) {
			return subs[1].ToLatex() + ' = ' + subs[2].ToLatex();
		};
		
		Equals.prototype.ToBoxtree = function(subs) { return PrefixBoxtree(subs, '='); };
		Equals.prototype.Type = function() { return 'Equals'; }
		
		return Equals;
	})();
	var Add = (function() {
		
		function Add() { }
		
		Add.prototype.ToLatex = function(subs) {
			var s = '';
			
			for (var i = 1; i < subs.length; i++)
			{
				s += subs[i].ToLatex();
				if (i < subs.length - 1) { s += ' + '; }
			}
			
			return s;
		};
		
		Add.prototype.ToBoxtree = function(subs) { return PrefixBoxtree(subs, '+'); };
		Add.prototype.Type = function() { return 'Add'; }
		
		return Add;
	})();
	var Sub = (function() {
		
		function Sub() { }
		
		Sub.prototype.ToLatex = function(subs) {
			if (subs.length == 2)
			{
				return '-' + subs[1].ToLatex();
			}
			else
			{
				return subs[1].ToLatex() + ' - ' + subs[2].ToLatex();
			}
		};
		
		Sub.prototype.ToBoxtree = function(subs) { return PrefixBoxtree(subs, '-'); };
		Sub.prototype.Type = function() { return 'Sub'; }
		
		return Sub;
	})();
	var Mul = (function() {
		
		function Mul() { }
		
		Mul.prototype.ToLatex = function(subs) {
			var s = '';
			
			for (var i = 1; i < subs.length; i++)
			{
				var preparen = '';
				var postparen = '';
				
				if (subs[i].Type() == 'Exp' && (subs[i].subs[0].Type() == 'Add' || subs[i].subs[0].Type() == 'Sub'))
				{
					preparen = '(';
					postparen = ')';
				}
				
				s += preparen + subs[i].ToLatex() + postparen;
				if (i < subs.length - 1) { s += ' '; } // put multiplication sign here
			}
			
			return s;
		};
		
		Mul.prototype.ToBoxtree = function(subs) { return PrefixBoxtree(subs, '*'); };
		Mul.prototype.Type = function() { return 'Mul'; }
		
		return Mul;
	})();
	var Div = (function() {
		
		function Div() { }
		
		Div.prototype.ToLatex = function(subs) {
			return '\\frac{'+subs[1].ToLatex()+'}{'+subs[2].ToLatex()+'}';
		};
		
		Div.prototype.ToBoxtree = function(subs) { return PrefixBoxtree(subs, '/'); };
		Div.prototype.Type = function() { return 'Div'; }
		
		return Div;
	})();
	var Pow = (function() {
		
		function Pow() { }
		
		Pow.prototype.ToLatex = function(subs) {
			return subs[1].ToLatex() + '^{' + subs[2].ToLatex() + '}';
		};
		
		Pow.prototype.ToBoxtree = function(subs) { return PrefixBoxtree(subs, '^'); };
		Pow.prototype.Type = function() { return 'Pow'; }
		
		return Pow;
	})();
	var Derivative = (function() {
		
		function Derivative() { }
		
		Derivative.prototype.ToLatex = function(subs) {
			return '\\frac{d' + subs[1].ToLatex() + '}{d' + subs[2].ToLatex() + '}'; // df/dx
			//return '\\frac{\\partial' + subs[1].ToLatex() + '}{\\partial' + subs[2].ToLatex() + '}'; // partial
			//return subs[1].ToLatex() + '\''; // prime
		};
		
		Derivative.prototype.ToBoxtree = function(subs) { return PrefixBoxtree(subs, 'dd'); };
		
		return Derivative;
	})();
	var PartialDerivative = (function() {
		
		function PartialDerivative() { }
		
		PartialDerivative.prototype.ToLatex = function(subs) {
			//return '\\frac{d' + subs[1].ToLatex() + '}{d' + subs[2].ToLatex() + '}'; // df/dx
			return '\\frac{\\partial ' + subs[1].ToLatex() + '}{\\partial ' + subs[2].ToLatex() + '}'; // partial
			//return subs[1].ToLatex() + '\''; // prime
		};
		
		PartialDerivative.prototype.ToBoxtree = function(subs) { return PrefixBoxtree(subs, 'ddp'); };
		
		return PartialDerivative;
	})();
	var Integral = (function() {
		
		function Integral() { }
		
		Integral.prototype.ToLatex = function(subs) {
			return '\\int ' + subs[2].ToLatex() + ' d' + subs[1].ToLatex(); // single integral, with dx
			//return '\\iint ' + subs[2].ToLatex() + ' d' + subs[1].ToLatex(); // double integral, with dx
			//return '\\iiint ' + subs[2].ToLatex() + ' d' + subs[1].ToLatex(); // triple integral, with dx
		};
		
		Integral.prototype.ToBoxtree = function(subs) { return PrefixBoxtree(subs, 'int'); };
		
		return Integral;
	})();
	var Grad = (function() {
		
		function Grad() { }
		
		Grad.prototype.ToLatex = function(subs) {
			return '\\nabla ' + subs[1].ToLatex();
		};
		
		Grad.prototype.ToBoxtree = function(subs) { return PrefixBoxtree(subs, 'grad'); };
		
		return Grad; 
	})();
	var NablaDotDiv = (function() {
		
		function NablaDotDiv() { }
		
		NablaDotDiv.prototype.ToLatex = function(subs) {
			return '\\nabla \\cdot ' + subs[1].ToLatex();
		};
		
		NablaDotDiv.prototype.ToBoxtree = function(subs) { return PrefixBoxtree(subs, 'div'); };
		
		return NablaDotDiv;
	})();
	var Curl = (function() {
		
		function Curl() { }
		
		Curl.prototype.ToLatex = function(subs) {
			return '\\nabla \\times ' + subs[1].ToLatex();
		};
		
		Curl.prototype.ToBoxtree = function(subs) { return PrefixBoxtree(subs, 'curl'); };
		
		return Curl;
	})();
	
	var Matrix = (function() {
		
		// (matrix (row 0 1 2) (row 3 4 5) (row 6 7 8))
		// (matrix (col 0 1 2) (col 3 4 5) (col 6 7 8))
		// matrix:          \begin{matrix} 1 & 2 & 3 \\ 4 & 5 & 6 \\ 7 & 8 & 9 \end{matrix}
		// bracket matrix: \begin{bmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \\ 7 & 8 & 9 \end{bmatrix}
		// paren matrix:   \begin{pmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \\ 7 & 8 & 9 \end{pmatrix}
		// determinant: \left| \begin{array}{ccc} 1 & 2 & 3 \\ 4 & 5 & 6 \\ 7 & 8 & 0 \end{array} \right|
		// determinant: \det(A)
		
		// there is now the question of how to construct the matrix from sexps - it is not quite as straightforward as the others
		function Matrix() {
			
			this.values = [];
		}
		
		Matrix.prototype.Clone = function() {
			throw new Error();
		};
		
		Matrix.prototype.ToLatex = function() {
			
			var lines = [];
			
			for (var i = 0; i < this.values.length; i++)
			{
				var entries = [];
				
				for (var j = 0; j < this.values[i].length; j++)
				{
					entries.push(this.values[i][j].ToLatex());
				}
				
				lines.push(entries.join(' & '));
			}
			
			return '\\begin{pmatrix} ' + lines.join(' \\\\ ') + ' \\end{pmatrix}'
		};
		
		Matrix.prototype.ToBoxtree = function() { throw new Error(); };
		Matrix.prototype.Type = function() { return 'Matrix'; }
		
		return Matrix;
	})();
	
	// limits: \lim_{x \to \infty}
	// summation: \sum_{n=1}^{\infty}a_n
	// product: \prod_{n=1}^{\infty}a_n
	// vector with arrow hat: \vec{v}
	// boldface vector: \mathbf{v}
	// norm: ||\vec{v}||
	// trace: \operatorname{tr}(A)
	// dimension: \dim(A)
	
	// \frac{a}{b} - yields inline fraction in inline mode
	// \dfrac{a}{b} - always yields display fraction?
	
	// to align at a particular place - put an ampersand before the character to align on - break lines with \\ or \cr (carriage return)
	//\eqalign{
	//3x - 4y &= 5 \cr
	//x  +  7 &= -2y
	//}
	
	// Geometry:
	// \angle ABC
	// 90^{\circ}
	// \triangle ABC
	// \overline{AB}
	// \sin, \cos, \tan, \cot, \sec, \csc, \arcsin, \arccos, \arctan
	
	// piecewise function: |x| = \begin{cases} x & x \ge 0 \\ -x & x < 0 \end{cases}
	
	Kronecker.Read = Read;
	Kronecker.CalculateBoxtreeTopLefts = CalculateBoxtreeTopLefts;
	Kronecker.ConvertBoxtreeToSVG = ConvertBoxtreeToSVG;
	Kronecker['='] = Equals;
	Kronecker['+'] = Add;
	Kronecker['-'] = Sub;
	Kronecker['*'] = Mul;
	Kronecker['/'] = Div;
	Kronecker['^'] = Pow;
	Kronecker['dd'] = Derivative;
	Kronecker['ddp'] = PartialDerivative;
	Kronecker['int'] = Integral;
	Kronecker['grad'] = Grad;
	Kronecker['div'] = NablaDotDiv;
	Kronecker['curl'] = Curl;
	
})(Kronecker || (Kronecker = {}));

