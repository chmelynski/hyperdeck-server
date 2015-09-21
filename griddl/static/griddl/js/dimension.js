
(function () {

function dimensionModule() {

// indents = [ <int> ] , w = <int> , returns dxs [ <int> ]
function Dimension(indents, w)  {
	width = w;
	
	maxIndent = 0;
	
	for (var i = 0; i < indents.length; i++)
	{
		if (indents[i] > maxIndent)
		{
			maxIndent = indents[i];
		}
	}
	
	// nodes x rows x {L,R}
	// dimension includes all pixels in child boxes
	// so if you have one child of width 11, that means that child row dimension will be (-5,5) - the pixel extend of the child box
	dimension = new Array(indents.length);
	
	for (var i = 0; i < dimension.length; i++)
	{
		dimension[i] = new Array(maxIndent + 2);
		
		for (var j = 0; j < dimension[i].length; j++)
		{
			dimension[i][j] = new Array(2);
		}
	}
	
	// nodes x nodes x {BeforeDistributionOfExcess,After}
	// constraints are measured as the number of pixels between midpoints of siblings, exclusive of those midpoints
	// not the number of whitespace pixels between the boxes
	constraints = new Array(indents.length);
	
	for (var i = 0; i < constraints.length; i++)
	{
		constraints[i] = new Array(indents.length);
		
		for (var j = 0; j < constraints[i].length; j++)
		{
			constraints[i][j] = new Array(2);
		}
	}
	
	nodes = new Array(indents.length);
	
	for (var i = 0; i < indents.length; i++)
	{
		nodes[i] = new Object();
		nodes[i].id = i;
		nodes[i].indent = indents[i];
		nodes[i].children = [];
	}
	
	for (var i = 0; i < indents.length; i++)
	{
		for (var k = i - 1; k >= 0; k--)
		{
			if (nodes[k].indent == nodes[i].indent - 1)
			{
				nodes[k].children.push(nodes[i]);
				nodes[i].parent = nodes[k];
				break;
			}
		}
	}
	
	CalculateDimension(0);
	
	var dxs = new Array(nodes.length);
	
	for (var i = 0; i < nodes.length; i++)
	{
		dxs[i] = nodes[i].dx;
	}
	
	dxs[0] = 0;
	
	return dxs;
}
function CalculateDimension(k) {
	if (nodes[k].children.length == 0)
	{
		return;
	}
	else
	{
		for (var i = 0; i < nodes[k].children.length; i++)
		{
			CalculateDimension(nodes[k].children[i].id);
		}
		
		ConstraintMatrix(k);
		
		AssignSpacing(k);
		
		ComposeDimension(k);
	}
}
function AssignSpacing(k) {
	var BEFORE = 0;
	var AFTER = 1;
	
	// constraints[x][y][BEFORE] has already been filled in for the relevant child nodes
	// we just need to fill in constraints[x][y][AFTER]
	
	var children = nodes[k].children;
	
	// We're keeping this around just so we can use Sum() on it
	var spacing = new Array(children.length - 1);
	
	// Fill first with the base level adjecent AB BC CD constraints
	for (var i = 0; i < children.length - 1; i++)
	{
		// Since we have to keep spacing around (see declaration of spacing above), we need to do parallel assignment
		spacing[i] = constraints[children[i].id][children[i + 1].id][BEFORE];
		constraints[children[i].id][children[i + 1].id][AFTER] = constraints[children[i].id][children[i + 1].id][BEFORE];
	}
	
	// Now we loop through the following triangle of non-adjacent constraints:
	// 0   1   2   3
	//  0-1 1-2 2-3
	// non-adjacent constraints begin here:
	//    0-2 1-3
	//      0-3
	for (var i = 0; i < children.length - 2; i++)
	{
		for (var j = 0; j < children.length - 2 - i; j++)
		{
			var a = j;
			var b = j + i + 2;
			
			var sum = Sum(spacing, a, b);
			
			var excess = constraints[children[a].id][children[b].id][BEFORE] - sum;
			
			if (excess > 0)
			{
				var numberOfGapsToDistributeTo = b - a;
				var amountToAddToEachSpacing = 0;
				
				while (excess > 0)
				{
					amountToAddToEachSpacing++;
					excess -= numberOfGapsToDistributeTo;
				}
				
				//var amountToAddToEachSpacing = excess / numberOfGapsToDistributeTo + (excess % numberOfGapsToDistributeTo == 0 ? 0 : 1);
				
				for (var l = a; l < b; l++)
				{
					// The parallel assignment continues (see above for explanation)
					spacing[l] += amountToAddToEachSpacing;
					constraints[children[l].id][children[l + 1].id][AFTER] += amountToAddToEachSpacing;
				}
			}
		}
	}
	
	// now translate the spacings into dx, the difference in x position from the parent
	
	var total = Sum(spacing, 0, spacing.length);
	
	if (spacing.length > 1)
	{
		total += spacing.length - 1; // to account for the center lines of all nodes except for the first and last
	}
	
	// imagine total as the top row of pixels of the children (with numbered pixels)
	// 0 1 2 3 4 5 6 7 8 9
	
	// at this point, total can be odd or even, so there might not be an exact center
	// if there is no exact center, pick the pixel to the left
	
	var center = 0;
	
	if (total == 0)
	{
		center = 0;
	}
	else if (total % 2 == 1)
	{
		// 0 1 2 3 4
		// total = 5
		// the center we want = 2
		center = total / 2 - 0.5;
	}
	else
	{
		// 0 1 2 3 4 5
		// total = 6
		// the center we want = 2
		center = total / 2 - 1;
	}
	
	for (var i = 0; i < children.length; i++)
	{
		nodes[children[i].id].dx = Sum(spacing, 0, i) + i - 1 - center;
	}
	
	// This is a horrible hack to prevent a simple off-by-one issue, where the center child in a set of odd children is put at dx=1, but it looks better at dx=0
	if (children.length % 2 == 1)
	{
		if (children[Math.floor(children.length / 2)].dx == 1)
		{
			children[Math.floor(children.length / 2)].dx = 0;
		}
	}
}
function ComposeDimension(k) {
	var LEFT = 0;
	var RIGHT = 1;
	
	var last = nodes[k].children.length - 1;
	
	dimension[k][nodes[k].indent + 1][LEFT] = nodes[k].children[0].dx - width / 2;
	dimension[k][nodes[k].indent + 1][RIGHT] = nodes[k].children[last].dx + width / 2;
	
	var children = nodes[k].children;
	
	for (var row = nodes[k].indent + 2; row <= maxIndent; row++)
	{
		var min = 1000000;
		var max = -1000000;
		
		// left + dx, right + dx
		
		for (var i = 0; i < children.length; i++)
		{
			var left = dimension[children[i].id][row][LEFT];
			var right = dimension[children[i].id][row][RIGHT];
			
			if (left)
			{
				min = Math.min(min, left + children[i].dx);
			}
			
			if (right)
			{
				max = Math.max(max, right + children[i].dx);
			}
		}
		
		if (min < 1000000)
		{
			dimension[k][row][LEFT] = min;
		}
		
		if (max > -1000000)
		{
			dimension[k][row][RIGHT] = max;
		}
	}
}
function ConstraintMatrix(k) {
	// The constraints matrix is indexed by the nodes in a depth-first order, which means left-to-right among siblings
	// We will set the convention that the left node is indexed along the rows of the matrix, and the right node is indexed along the cols
	
	// Hence if the siblings are 0 1 2 3, the matrix created is this:
	
	// -- 01 02 03
	// -- -- 12 13
	// -- -- -- 23
	// -- -- -- --
	
	var BEFORE = 0;
	var AFTER = 1;
	
	var children = nodes[k].children;
	
	for (var i = 0; i < children.length - 1; i++)
	{
		for (var j = i + 1; j < children.length; j++)
		{
			constraints[children[i].id][children[j].id][BEFORE] = SingleConstraint(children[i].id, children[j].id);
		}
	}
}
function SingleConstraint(leftNode, rightNode) {
	// the base spacing between two childless boxes
	// this counts the whitespace pixels between the center lines, excluding both center lines themselves
	// so that is the extent of the left box to the right of its center, which is width / 2
	// then the gap between the boxes, which used to be called siblingSpacing, but I'm fixing it to be the same as the width
	// then the extent of the right box to the left of its center, which is again width / 2
	
	var LEFT = 0;
	var RIGHT = 1;
	
	var siblingSpacing = width / 2;
	
	var n = width / 2 + siblingSpacing + width / 2;
	
	// of course, the dimensions will not extend across the spectrum of rows, but we will examine all rows anyway
	// excluding rows for which one or the other dimension is zero, because that means the dimension tree does not exist in that row
	for (var row = 0; row < dimension[0].length; row++)
	{
		if (dimension[leftNode][row][RIGHT] != null && dimension[rightNode][row][LEFT] != null)
		{
			n = Math.max(n, dimension[leftNode][row][RIGHT] - dimension[rightNode][row][LEFT] + siblingSpacing);
		}
	}
	
	return n;
}
function Sum(x, a, b) {
	var sum = 0;
	
	for (var i = a; i < b; i++)
	{
		sum += x[i];
	}
	
	return sum;
}

var Dimension = {};
Dimension.Dimension = Dimension;
return Dimension;

}

if (typeof define === "function" && define.amd) {
	define(dimensionModule);
} else if (typeof module !== 'undefined' && module.exports) {
	module.exports = dimensionModule();
} else {
	this.Dimension = dimensionModule();
}

})();

