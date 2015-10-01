
var axisVars = [ 'dataStart' , 'dataEnd' , 'dataRange' , 'pixelStart' , 'pixelEnd' , 'pixelRange' ];

// regrettably, these are not linear equations, because they contain products of variables
// 'dataPerPixel' , 'pixelPerData' - dataPerPixel = dataRange / pixelRange - pixelPerData = pixelRange / dataRange

var axisEqs = [
	[  1 , -1 ,  1 ,  0 ,  0 ,  0 ] , // dataStart + dataRange = dataEnd
	[  0 ,  0 ,  0 ,  1 , -1 ,  1 ] , // pixelStart + pixelRange = pixelEnd
]

var vars = [ 'start' , 'length' , 'end' ];

var A = [
	[ 1 , 1 , -1 ] , // start + length - end = b[0]
	[ 0 , 1 ,  0 ] , // length = b[1]
	[ 0 , 0 ,  1 ] , // end = b[2]
];

var b = [ 0 , 2 , 3 ];

// x = numeric.dot(numeric.inv(A),b)

// look, the size of the graph is not really relevant - it should be resizable anyway
// so all we care about is a [start,end,range] triple for each possible data domain
// these can be stacked into one table (if we leave lock checkbox cells out, or put them into a separate table, or something)

