
(function () {

function thisModule() {

function Draw() {

var output = $('#output');
output.css('position', 'absolute');
output.css('top', '5em');
output.css('left', '45em');
output.css('width', '800px');
output.css('height', '600px');
output.css('border', '1px solid #c3c3c3');
output.css('overflow', 'auto');

var canvas = $('#canvas')[0];
var img = $('#img')[0];

canvas.width = img.width;
canvas.height = img.height;
var canvasWidth = canvas.width;
var canvasHeight = canvas.height;
var g = canvas.getContext('2d');
g.clearRect(0, 0, canvasWidth, canvasHeight);


g.rotate(0);

// whole column
var sx = 550;
var sy = 15;
var sw = 1300;
var sh = 1080;

// single line
var sx = 550;
var sy = 15;
var sw = 1300;
var sh = 40;

// single word
//var sx = 550;
//var sy = 15;
//var sw = 1300;
//var sh = 1080;

var dx = 200;
var dy = 50;
var dw = sw;
var dh = sh;

g.drawImage(img, 0, 0);
//g.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

//g.font = '28.2pt Times New Roman bold';
//g.fillText('it from the other die in use', dx, dy + 30);

var imageData = g.getImageData(0, 0, canvasWidth, canvasHeight);
var data = imageData.data;

// define the top-left corner and width/height of our line-detecting apparatus
var top = 1540;
var left = 450;
var width = 1550;
var height = 60;
var right = left + width;
var bottom = top + height;

// manually position rects to define the lines (should be constant height)
var lines = 6;
for (var i = 0; i < lines; i++)
{
	g.strokeRect(left+0.5, top+i*height+0.5, width, height);
}

for (var line = 0; line < lines; line++)
{

var vertsums = [];
for (var x = left; x < right; x++)
{
  var vertsum = 0;
  
  for (var y = top; y < bottom; y++)
  {
    var index = (y * canvasWidth + x) * 4;
    var R = data[index + 0];
    var G = data[index + 1];
    var B = data[index + 2];
    var A = data[index + 3];
    var sum = (R+G+B) / 3;
    vertsum += sum;
  }
  
  vertsums.push(vertsum);
}

// draw linechart of the sum of vertical ink in a line
g.strokeStyle = 'red';
g.beginPath();
g.moveTo(left, bottom);
for (var i = 1; i < vertsums.length; i++)
{
	var x = left + i;
    var y = bottom - vertsums[i] / 100 + 50;
	//g.lineTo(x, y);
}
g.stroke();

// draw n-px moving sum of the square of the first derivative
// (this is to detect long stretches of flat values)
g.strokeStyle = 'green';
g.beginPath();
g.moveTo(left, bottom);
var sum = 0;
var movingsums = [];
var window = 15;
var ys = [];
for (var i = 1; i < vertsums.length; i++)
{
	var d = vertsums[i] - vertsums[i-1];
	var d2 = d * d;
    movingsums[i] = d2;
    sum += d2;
    if (i > (window+1)) { sum -= movingsums[i-window]; }
    
	var x = left + i;
    //var y = bottom - d / 100;
    var y = bottom - (sum / 10000);
	//g.lineTo(x, y);
    ys.push(y);
}
g.stroke();


// look for minima of the moving sum that fall below a threshold
// first take the 2nd derivative of the moving sum
var dmovingsum = [];
var ddmovingsum = [];
for (var i = 0; i < movingsums.length - 1; i++)
{
	//dmovingsum[i] = movingsums[i+1]-movingsums[i];
}
for (var i = 0; i < dmovingsum.length - 1; i++)
{
	//ddmovingsum[i] = dmovingsum[i+1]-dmovingsum[i];
}

// eh, let's try a different approach
// just look for stretches of ys that fall below the thresh
// and take the midpoint
var midpoints = [];
var startx = 0;
var endx = 0;
var instretch = false;
for (var i = 0; i < ys.length; i++)
{
	if (ys[i] > (bottom - 10))
    {
    	if (!instretch)
        {
    		instretch = true;
        	startx = left + i;
        }
    }
    else
    {
    	if (instretch)
        {
			instretch = false;
            endx = left + i;
            midpoints.push((startx + endx) / 2);
		}
	}
}

for (var i = 0; i < midpoints.length; i++)
{
	var x = Math.floor(midpoints[i], 1) - 5 + 0.5;
	g.strokeStyle = 'black';
	g.beginPath();
    g.moveTo(x, top);
    g.lineTo(x, bottom);
    g.stroke();
}

top += height;
bottom += height;

} // end lines loop

}
function Blackwhite(g, img, scale, threshold, adjustFn) {
	
	g.clearRect(0, 0, g.canvas.width, g.canvas.height);
	g.drawImage(img, 0, 0, img.width * scale, img.height * scale);
	var imageData = g.getImageData(0, 0, g.canvas.width, g.canvas.height);
	var array = imageData.data;
	
	for (var x = 0; x < imageData.width; x++)
	{
		for (var y = 0; y < imageData.height; y++)
		{
			var i = (y * imageData.width + x) * 4;
			
			var R = array[i + 0];
			var G = array[i + 1];
			var B = array[i + 2];
			var A = array[i + 3];
			
			var sum = R + G + B;
			var newColor = 0;
			
			var adjust = adjustFn(x, y);
			var metric = sum + adjust;
			
			if (metric < threshold)
			{
				newColor = 0;
			}
			else
			{
				newColor = 255;
			}
			
			array[i + 0] = newColor;
			array[i + 1] = newColor;
			array[i + 2] = newColor;
		}
	}
	
	g.putImageData(imageData, 0, 0);
}
function Seekletter() {
	
	var letterCanvas = $('#letter')[0];
	var letterContext = letterCanvas.getContext('2d');
	letterContext.clearRect(0, 0, letterCanvas.width, letterCanvas.height);
	letterContext.fillStyle = 'black';
	letterContext.font = '36pt Times New Roman';
	letterContext.textAlign = 'left';
	letterContext.textBaseline = 'top';
	letterContext.fillText('A', 0, 0);
	
	var canvas = $('#canvas')[0];
	var g = canvas.getContext('2d');
	var imageData = g.getImageData(0, 0, canvas.width, canvas.height);
	var data = imageData.data;
	
	var letterImageData = letterContext.getImageData(0, 0, letterCanvas.width, letterCanvas.height);
	var letterData = letterImageData.data;
	
	// this tests a separate letter canvas against every possible point of a target canvas - it runs too slow to use
	
	for (var x = 2000; x < imageData.width; x++)
	{
		for (var y = 0; y < imageData.height; y++)
		{
			var score = TestMatch(letterImageData, imageData, letter.width, letter.height, 0, 0, x, y);
			
			if (score > 50)
			{
				g.fillStyle = 'red';
				g.font = '36pt Times New Roman';
				g.textAlign = 'left';
				g.textBaseline = 'top';
				g.fillText('a', x, y);
			}
		}
	}
}
function TestMatch(refData, actData, width, height, refX, refY, actX, actY) {
	
	// refData and actData are both canvas ImageData objects
	
	var refArray = refData.data;
	var actArray = actData.data;
	
	var score = 0;
	
	for (var i = 0; i < height; i++)
	{
		for (var j = 0; j < width; j++)
		{
			var refIndex = ((refY + i) * refData.width + (refX + j)) * 4;
			var actIndex = ((actY + i) * actData.width + (actX + j)) * 4;
			
			// for when both are black and white
			var refValue = refArray[refIndex];
			var actValue = actArray[actIndex];
			
			if (refValue == actValue)
			{
				score++;
			}
			
			//var R = data[index + 0];
			//var G = data[index + 1];
			//var B = data[index + 2];
			//var A = data[index + 3];
			//var letterIndex = (j*letterImageData.width+i)*4;
			//var letterPixelIsBlack = letterData[index] < 255;
			//var sum = R + G + B; // for full color
			//var sum = R; // for black and white
			
			//if (letterPixelIsBlack && sum < 255)
			//{
			//	score++;
			//}
			//else if (!letterPixelIsBlack && sum == 255)
			//{
			//	score++;
			//}
			//else
			//{
			//	score--;
			//}
		}
	}
	
	return score;
}

var OCR = {};
OCR.Draw = Draw;
OCR.Blackwhite = Blackwhite;
OCR.Seekletter = Seekletter;
OCR.TestMatch = TestMatch;
return OCR;

}

if (typeof define === "function" && define.amd) {
	define(thisModule);
} else if (typeof module !== 'undefined' && module.exports) {
	module.exports = thisModule();
} else {
	this.OCR = thisModule();
}

})();

