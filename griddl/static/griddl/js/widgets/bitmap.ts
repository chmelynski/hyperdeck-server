
import { General } from './general'

export class Bitmap extends General {
	
	magic: string = 'BM';
	size: number;
	reserved1: number = 0;
	reserved2: number = 0;
	offset: number = 54;
	size2: number = 40; // size of the second half of the header chunk
	width: number;
	height: number;
	planes: number = 1;
	bitcount: number;
	compression: number = 0;
	sizeImage: number = 0;
	xPelsPerMeter: number = 0;
	yPelsPerMeter: number = 0;
	clrUsed: number = 0;
	clrImportant: number = 0;
	
	bytesPerPixel: number;
	
	pixels: Uint8Array;
	
	splines: Spline[] = null;
	startPoint: Point = null;
	currentPoint: Point = null;
	
	constructor(width, height, bytesPerPixel) {
		
		super(width, height);
		
		this.size = 54 + width * height * bytesPerPixel;
		this.width = width;
		this.height = height;
		this.bitcount = bytesPerPixel * 8;
		
		this.pixels = new Uint8Array(width * height * bytesPerPixel);
		for (var i = 0; i < this.pixels.length; i++) { this.pixels[i] = 255; }
	}
	write(): Uint8Array {
		
		var x = new Uint8Array(54 + this.pixels.length);
		
		var c = 0;
		x[c++] = 'B'.charCodeAt(0);
		x[c++] = 'M'.charCodeAt(0);
		x[c++] = this.size % 256;
		x[c++] = Math.floor(this.size / 256) % 256;
		x[c++] = Math.floor(this.size / 256 / 256) % 256;
		x[c++] = Math.floor(this.size / 256 / 256 / 256) % 256;
		x[c++] = this.reserved1 % 256;
		x[c++] = Math.floor(this.reserved1 / 256) % 256;
		x[c++] = this.reserved2 % 256;
		x[c++] = Math.floor(this.reserved2 / 256) % 256;
		x[c++] = this.offset % 256;
		x[c++] = Math.floor(this.offset / 256) % 256;
		x[c++] = Math.floor(this.offset / 256 / 256) % 256;
		x[c++] = Math.floor(this.offset / 256 / 256 / 256) % 256;
		x[c++] = this.size2 % 256;
		x[c++] = Math.floor(this.size2 / 256) % 256;
		x[c++] = Math.floor(this.size2 / 256 / 256) % 256;
		x[c++] = Math.floor(this.size2 / 256 / 256 / 256) % 256;
		x[c++] = this.width % 256;
		x[c++] = Math.floor(this.width / 256) % 256;
		x[c++] = Math.floor(this.width / 256 / 256) % 256;
		x[c++] = Math.floor(this.width / 256 / 256 / 256) % 256;
		x[c++] = this.height % 256;
		x[c++] = Math.floor(this.height / 256) % 256;
		x[c++] = Math.floor(this.height / 256 / 256) % 256;
		x[c++] = Math.floor(this.height / 256 / 256 / 256) % 256;
		x[c++] = this.planes % 256;
		x[c++] = Math.floor(this.planes / 256) % 256;
		x[c++] = this.bitcount % 256;
		x[c++] = Math.floor(this.bitcount / 256) % 256;
		x[c++] = this.compression % 256;
		x[c++] = Math.floor(this.compression / 256) % 256;
		x[c++] = Math.floor(this.compression / 256 / 256) % 256;
		x[c++] = Math.floor(this.compression / 256 / 256 / 256) % 256;
		x[c++] = this.sizeImage % 256;
		x[c++] = Math.floor(this.sizeImage / 256) % 256;
		x[c++] = Math.floor(this.sizeImage / 256 / 256) % 256;
		x[c++] = Math.floor(this.sizeImage / 256 / 256 / 256) % 256;
		x[c++] = this.xPelsPerMeter % 256;
		x[c++] = Math.floor(this.xPelsPerMeter / 256) % 256;
		x[c++] = Math.floor(this.xPelsPerMeter / 256 / 256) % 256;
		x[c++] = Math.floor(this.xPelsPerMeter / 256 / 256 / 256) % 256;
		x[c++] = this.yPelsPerMeter % 256;
		x[c++] = Math.floor(this.yPelsPerMeter / 256) % 256;
		x[c++] = Math.floor(this.yPelsPerMeter / 256 / 256) % 256;
		x[c++] = Math.floor(this.yPelsPerMeter / 256 / 256 / 256) % 256;
		x[c++] = this.clrUsed % 256;
		x[c++] = Math.floor(this.clrUsed / 256) % 256;
		x[c++] = Math.floor(this.clrUsed / 256 / 256) % 256;
		x[c++] = Math.floor(this.clrUsed / 256 / 256 / 256) % 256;
		x[c++] = this.clrImportant % 256;
		x[c++] = Math.floor(this.clrImportant / 256) % 256;
		x[c++] = Math.floor(this.clrImportant / 256 / 256) % 256;
		x[c++] = Math.floor(this.clrImportant / 256 / 256 / 256) % 256;
		
		var bytesPerPixel = this.bitcount / 8;
		var d = 0;
		for (var i = 0; i < this.height; i++)
		{
			for (var j = 0; j < this.width; j++)
			{
				for (var k = 0; k < bytesPerPixel; k++)
				{
					x[c++] = this.pixels[d++];
				}
			}
			
			if ((this.width * bytesPerPixel) % 2 == 1) { x[c++] = 0; } // padding
		}
		
		return x;
	}
	static MakeBitmap = function(pixels: Uint8Array, width: number, height: number): Bitmap {
		
		var bytesPerPixel = 3; // should we determine this dynamically?
		var bmp = new Bitmap(width, height, bytesPerPixel);
		bmp.pixels = pixels;
		return bmp;
	}
	static Read = function(b: Uint8Array): Bitmap {
		
		var k = {k:0};
		
		// 54 byte header
		var magic = Conversion.ReadUi(b, k, 2, true); // 'BM' = 19778
		var size = Conversion.ReadUi(b, k, 4, true); // what does this refer to?
		var reserved1 = Conversion.ReadUi(b, k, 2, true);
		var reserved2 = Conversion.ReadUi(b, k, 2, true);
		var offset = Conversion.ReadUi(b, k, 4, true); // u32 - offset into the file where the pixel data begins
		var size2 = Conversion.ReadUi(b, k, 4, true); // what does this refer to?
		var width = Conversion.ReadUi(b, k, 4, true); // u32
		var height = Conversion.ReadUi(b, k, 4, true); // u32
		var planes = Conversion.ReadUi(b, k, 2, true); // u16?
		var bitcount = Conversion.ReadUi(b, k, 2, true); // u16 - 8, 16, 24, 32
		var compression = Conversion.ReadUi(b, k, 4, true);
		var sizeImage = Conversion.ReadUi(b, k, 4, true);
		var xPelsPerMeter = Conversion.ReadUi(b, k, 4, true);
		var yPelsPerMeter = Conversion.ReadUi(b, k, 4, true);
		var clrUsed = Conversion.ReadUi(b, k, 4, true);
		var clrImportant = Conversion.ReadUi(b, k, 4, true);
		
		//console.log(width);
		//console.log(height);
		//console.log(bitcount);
		
		var bmp = new Bitmap(width, height, bitcount / 8);
		bmp.magic = 'BM';
		bmp.size = size;
		bmp.reserved1 = reserved1;
		bmp.reserved2 = reserved2;
		bmp.offset = offset;
		bmp.size2 = size2;
		bmp.width = width;
		bmp.height = height;
		bmp.planes = planes;
		bmp.bitcount = bitcount;
		bmp.compression = compression;
		bmp.sizeImage = sizeImage;
		bmp.xPelsPerMeter = xPelsPerMeter;
		bmp.yPelsPerMeter = yPelsPerMeter;
		bmp.clrUsed = clrUsed;
		bmp.clrImportant = clrImportant;
		
		k.k = bmp.offset;
		
		bmp.bytesPerPixel = bmp.bitcount / 8;
		
		var c = 0;
		
		bmp.pixels = new Uint8Array(bmp.height * bmp.width * bmp.bytesPerPixel);
		
		for (var i = 0; i < bmp.height; i++)
		{
			for (var j = 0; j < bmp.width; j++)
			{
				for (var m = 0; m < bmp.bytesPerPixel; m++)
				{
					bmp.pixels[c++] = Conversion.ReadUi(b, k, 1, true);
				}
			}
			
			if ((bmp.width * bmp.bytesPerPixel) % 2 == 1) { k.k++; } // disregard null padding
		}
		
		return bmp;
	}
	
	static PutImageData = function(ctx: CanvasRenderingContext2D, bmp: Bitmap): void {
		
		var imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
		
		for (var y = 0; y < imageData.height; y++)
		{
			for (var x = 0; x < imageData.width; x++)
			{
				var color = bmp.getPixel(x, y);
				
				var index = (y * imageData.width + x) * 4;
				imageData.data[index + 0] = color.r;
				imageData.data[index + 1] = color.g;
				imageData.data[index + 2] = color.b;
				imageData.data[index + 3] = 255;
			}
		}
		
		ctx.putImageData(imageData, 0, 0);
	};
	
	drawRect(left: number, top: number, width: number, height: number, doFill: boolean, doStroke: boolean): void {
		
		var p1 = { x : left , y : top };
		var p2 = { x : left + width , y : top };
		var p3 = { x : left + width , y : top + height };
		var p4 = { x : left , y : top + height };
		
		this.beginPath();
		this.moveTo(p1.x, p1.y);
		this.lineTo(p2.x, p2.y);
		this.lineTo(p3.x, p3.y);
		this.lineTo(p4.x, p4.y);
		this.closePath();
		if (doFill) { this.fill(); }
		if (doStroke) { this.stroke(); }
	}
	fillRectSharp(left: number, top: number, width: number, height: number): void {
		
		for (var i = 0; i < width; i++)
		{
			for (var j = 0; j < height; j++)
			{
				var x = left + i;
				var y = top + j;
				this.setPixel(x, y, this.fillColor);
			}
		}
	}
	strokeRectSharp(left: number, top: number, width: number, height: number): void {
		
		// this is not quite the same as canvas - the stroke is contained entirely within the fill area - it's just the outer pixel of the fill
		
		for (var i = 0; i < width; i++)
		{
			var x = left + i;
			var y1 = top;
			var y2 = top + height - 1;
			this.setPixel(x, y1, this.strokeColor);
			this.setPixel(x, y2, this.strokeColor);
		}
		
		for (var j = 0; j < height; j++)
		{
			var x1 = left;
			var x2 = left + width - 1;
			var y = top + j;
			this.setPixel(x1, y, this.strokeColor);
			this.setPixel(x2, y, this.strokeColor);
		}
	}
	clearRect(left: number, top: number, width: number, height: number): void {
		
		for (var i = 0; i < height; i++)
		{
			for (var j = 0; j < width; j++)
			{
				var x = left + j;
				var y = top + i;
				var index = ((this.height - y - 1) * this.width + x) * (this.bitcount / 8);
				this.pixels[index + 0] = 255;
				this.pixels[index + 1] = 255;
				this.pixels[index + 2] = 255;
				if (this.bitcount == 32) { this.pixels[index + 3] = 255; }
			}
		}
	}
	drawLine(x0: number, y0: number, x1: number, y1: number): void {
		
		// Brensenham algorithm
		
		// http://rosettacode.org/wiki/Raster_graphics_operations
		// http://stackoverflow.com/questions/4672279/bresenham-algorithm-in-javascript
		// http://rosettacode.org/wiki/Bitmap/Midpoint_circle_algorithm
		// http://rosettacode.org/wiki/Xiaolin_Wu%27s_line_algorithm - antialiased lines
		
		x0 = Math.floor(x0);
		y0 = Math.floor(y0);
		x1 = Math.floor(x1);
		y1 = Math.floor(y1);
		
		var dx = Math.abs(x1 - x0);
		var dy = Math.abs(y1 - y0);
		var sx = (x0 < x1) ? 1 : -1;
		var sy = (y0 < y1) ? 1 : -1;
		var err = dx - dy;
		
		if (isNaN(err)) { throw new Error('NaN passed into Bitmap.drawLine'); }
		
		var color = this.strokeColor;
		
		while (true)
		{
			//console.log('x : ' + x0 + ' , y : ' + y0);
			
			//this.setPixel(x0, y0, color);
			if (0 <= x0 && x0 < this.width && 0 <= y0 && y0 < this.height)
			{
				var index = ((this.height - y0 - 1) * this.width + x0) * (this.bitcount / 8); // note that (0,0) is the bottom left
				this.pixels[index + 0] = color.b; // also note the order is BGR, not RGB
				this.pixels[index + 1] = color.g;
				this.pixels[index + 2] = color.r;
				if (this.bitcount == 32) { this.pixels[index + 3] = color.a; }
			}
			
			if ((x0 == x1) && (y0 == y1)) { break; }
			var e2 = 2 * err;
			if (e2 > -dy) { err -= dy; x0 += sx; }
			if (e2 < +dx) { err += dx; y0 += sy; }
		}
	}
	drawBezier(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
		
		// this samples points along the bezier curve, finds the pixel the point falls in, and determines how far the point is from the center of that pixel
		// then fills the pixel with a grayscale value depending on distance from center, subject to a ratchet where the pixel only gets darker
		// this works reasonably well, subject to the constraint that line width must be 1 and the color fill must be a solid 255 of something
		// the same basic algorithm can also be used for lines and arcs
		
		// to accomodate varying line widths, we could sample the curve into a set of rectangles, and then fill the rectangles using the fill algo
		// but then the rectangles would have some overlap at the joins, which would make the joins darker
		// so what we really need are flush joins - which means we break it into trapezoids, really
		// any shape works, as long as it is made out of lines
		// but really, all we're doing here is trying to naively offset the bezier curve.  which heck, we can accept the artifacts at sharp turns
		// the sampling is the same though - we just get line segments on the sides
		
		var dist = function(x0, y0, x1, y1) { return Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)); };
		var d = 3 * Math.floor(dist(x0, y0, x1, y1) + dist(x1, y1, x2, y2) + dist(x2, y2, x3, y3));
		
		for (var i = 0; i <= d; i++)
		{
			var t = i / d;
			
			var x = ComputeBezier(t, x0, x1, x2, x3);
			var y = ComputeBezier(t, y0, y1, y2, y3);
			
			var pixelX = Math.floor(x);
			var pixelY = Math.floor(y);
			
			if (0 <= pixelX && pixelX < this.width && 0 <= pixelY && pixelY < this.height)
			{
				var distanceFromPixelCenter = dist(x, y, pixelX+0.5, pixelY+0.5);
				var grayscale = Math.floor(distanceFromPixelCenter * 255)
				
				if (grayscale < this.getPixel(pixelX, pixelY).r)
				{
					this.setPixel(pixelX, pixelY, {r:grayscale,g:grayscale,b:grayscale});
				}
			}
		}
	}
	fillCircle(cx: number, cy: number, r: number): void {
		
		// this is great for full circles but we want to move to arcs
		var rr = r * r;
		var w = 2 * r;
		var n = 3;
		var nn = n * n;
		var sub = 1 / n;
		
		var lf = Math.floor(cx - r - 1);
		var rt = Math.floor(cx + r + 2);
		var tp = Math.floor(cy - r - 1);
		var bt = Math.floor(cy + r + 2);
		
		for (var xPixel = lf; xPixel <= rt; xPixel++)
		{
			for (var yPixel = tp; yPixel <= bt; yPixel++)
			{
				var sum = 0;
				
				for (var a = 0; a < n; a++)
				{
					for (var b = 0; b < n; b++)
					{
						var x = (xPixel + a * sub + sub / 2);
						var y = (yPixel + b * sub + sub / 2);
						
						var dd = (x-cx)*(x-cx)+(y-cy)*(y-cy);
						
						if (dd < rr)
						{
							sum++;
						}
					}
				}
				
				if (sum > 0)
				{
					this.fillColor.a = Math.floor(255 * sum / nn);
					this.setPixel(xPixel, yPixel, this.fillColor);
				}
			}
		}
	}
	
	beginPath(): void {
		this.splines = [];
		this.startPoint = { x : 0 , y : 0 };
		this.currentPoint = { x : 0 , y : 0 };
	}
	closePath(): void {
		this.splines.push({type:'line',points:[{x:this.currentPoint.x,y:this.currentPoint.y},{x:this.startPoint.x,y:this.startPoint.y}]});
		this.currentPoint.x = this.startPoint.x;
		this.currentPoint.y = this.startPoint.y;
	}
	moveTo(x: number, y: number): void {
		this.startPoint.x = x;
		this.startPoint.y = y;
		this.currentPoint.x = x;
		this.currentPoint.y = y;
	}
	lineTo(x: number, y: number): void {
		this.splines.push({type:'line',points:[{x:this.currentPoint.x,y:this.currentPoint.y},{x:x,y:y}]});
		this.currentPoint.x = x;
		this.currentPoint.y = y;
	}
	quadraticCurveTo(x1: number, y1: number, x: number, y: number): void {
		this.splines.push({type:'quadratic',points:[{x:this.currentPoint.x,y:this.currentPoint.y},{x:x1,y:y1},{x:x,y:y}]});
		this.currentPoint.x = x;
		this.currentPoint.y = y;
	}
	bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void {
		this.splines.push({type:'cubic',points:[{x:this.currentPoint.x,y:this.currentPoint.y},{x:x1,y:y1},{x:x2,y:y2},{x:x,y:y}]});
		this.currentPoint.x = x;
		this.currentPoint.y = y;
	}
	fill(): void {
		
		//quadratic {"x":66.31640625,"y":282.31640625},{"x":66.31640625,"y":285.97265625},{"x":65.15625,"y":289.505859375}
		//console.log(this.splines.map(spline => spline.type + ' ' + spline.points.map(point => JSON.stringify(point))).join('\n'));
		
		var bbox = BoundingBox(this.splines);
		
		var sumss = [];
		
		for (var y = bbox.yMin; y <= bbox.yMax; y++)
		{
			var sums = [];
			
			for (var x = bbox.xMin; x <= bbox.xMax; x++)
			{
				sums.push(0);
			}
			
			sumss.push(sums);
		}
		
		var n = 3;
		var nn = n * n;
		
		for (var yPix = bbox.yMin; yPix <= bbox.yMax; yPix++)
		{
			for (var i = 0; i < n; i++)
			{
				var y = yPix + 1/(2*n) + i / n;
				
				var xs = SplineIntersections(this.splines, y);
				xs.sort(function(a, b) { if (a < b) { return -1; } else { return 1; } }); // jfc, node casts to string before sorting
				//console.log(yPix + ' ' + i + ' [' + xs.map(d => d.toString()).join(',') + ']');
				var intersectionIndex = 0;
				
				var intersection = xs[intersectionIndex++];
				var oldIntersection = null;
				var fill = false;
				
				for (var xPix = bbox.xMin; xPix <= bbox.xMax; xPix++)
				{
					for (var j = 0; j < n; j++)
					{
						var x = xPix + 1/(2*n) + j / n;
						
						if (x >= intersection)
						{
							fill = !fill;
							
							do
							{
								oldIntersection = intersection;
								intersection = xs[intersectionIndex++];
							}
							while (intersection == oldIntersection);
						}
						
						if (fill)
						{
							sumss[yPix - bbox.yMin][xPix - bbox.xMin]++;
						}
						
						//if (yPix == 295 && xPix == bbox.xMax && sumss[yPix - bbox.yMin][xPix - bbox.xMin] == 3)
						//{
						//	debugger;
						//}
					}
				}
				
				// 295,0 0 0 0 0 0 0 0 1 3 3 3 2 2 0 0 0 0 0 2 3 3 2 3 1 0 0 0 0 0 0 0 0
				// 295,1 0 0 0 0 0 0 0 2 6 6 6 2 4 3 3 3 3 3 3 3 3 2 3 4 3 3 3 3 3 3 3 3
				// 295,2 0 0 0 0 0 0 0 2 9 9 9 5 5 3 3 3 3 3 4 6 6 5 6 4 3 3 3 3 3 3 3 3
				//console.log(yPix + ',' + i + ' ' + sumss[yPix - bbox.yMin].map(sum => sum.toString()).join(' '));
			}
			
			// 281 0 5 9 9 9 9 9 9 6 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 9 9 9 9 9 9 9 3 0 0
			//console.log(yPix + ' ' + sumss[yPix - bbox.yMin].map(sum => sum.toString()).join(' '));
		}
		
		for (var y = bbox.yMin; y <= bbox.yMax; y++)
		{
			for (var x = bbox.xMin; x <= bbox.xMax; x++)
			{
				var sum = sumss[y - bbox.yMin][x - bbox.xMin];
				this.fillColor.a = Math.floor(255 * sum / nn);
				this.setPixel(x, y, this.fillColor);
			}
		}
	}
	stroke(): void {
		
		// each path segment has a bounding box - we need only test subpixels within that bounding box
		
		// the functions drawLine and drawBezier below are rough implentations, good only when lineWidth = 1
		// to implement thicker lines, there are two options:
		// 1. offset curves and just run the fill algo - problem is that offsetting beziers is difficult - see http://pomax.github.io/bezierinfo/#offsetting
		// 2. calculate minimum distance to the curve and test that against the lineWidth
		//     this is elegant, except that finding the minimum for bezier curves requires finding roots of a 5th degree polynomial
		//     dd = (cx - x(t))*(cx - x(t)) + (cy - y(t))*(cy - y(t))
		//     since x(t) and y(t) are 3rd degree, the square is 6th, and then the derivative is 5th
		
		for (var i = 0; i < this.splines.length; i++)
		{
			var spline = this.splines[i];
			var type = spline.type;
			var p = spline.points;
			
			if (type == 'line')
			{
				this.drawLine(p[0].x, p[0].y, p[1].x, p[1].y);
			}
			else if (type == 'quadratic')
			{
				this.drawBezier(p[0].x, p[0].y, p[1].x, p[1].y, p[2].x, p[2].y, p[2].x, p[2].y); // cp2 = end point
			}
			else if (type == 'cubic')
			{
				this.drawBezier(p[0].x, p[0].y, p[1].x, p[1].y, p[2].x, p[2].y, p[3].x, p[3].y);
			}
			else
			{
				throw new Error();
			}
		}
	}
	
	rect(left: number, top: number, width: number, height: number): void {
		this.splines.push({type:'line',points:[{x:left,y:top},{x:left+width,y:top}]});
		this.splines.push({type:'line',points:[{x:left+width,y:top},{x:left+width,y:top+height}]});
		this.splines.push({type:'line',points:[{x:left+width,y:top+height},{x:left,y:top+height}]});
		this.splines.push({type:'line',points:[{x:left,y:top+height},{x:left,y:top}]});
	}
	arc(cx: number, cy: number, r: number, startAngle: number, endAngle: number, bAntiClockwise: boolean): void {
		
		if (!bAntiClockwise) // an arc spline is defined as anticlockwise
		{
			var temp = startAngle;
			startAngle = endAngle;
			endAngle = temp;
		}
		
		this.splines.push({type:'arc',center:{x:cx,y:cy},radius:r,startAngle:startAngle,endAngle:endAngle});
	}
	
	fillText(text: string, x: number, y: number): void {
		
		var dxCudyCu = this.alignText(text);
		var dxCu = dxCudyCu.dxCu;
		var dyCu = dxCudyCu.dyCu;
		
		var xCu = x + dxCu;
		var yCu = y + dyCu;
		
		// scale to pixels here
		
		this.fontObject.draw(this, text, xCu, yCu, this.fontSizePx, {});
	}
	
	getPixel(x: number, y: number): Color {
		
		if (0 <= x && x < this.width && 0 <= y && y < this.height)
		{
			var index = ((this.height - y - 1) * this.width + x) * (this.bitcount / 8); // note that (0,0) is the bottom left
			var color: Color = {};
			color.b = this.pixels[index + 0]; // also note the order is BGR, not RGB
			color.g = this.pixels[index + 1];
			color.r = this.pixels[index + 2];
			if (this.bitcount == 32) { color.a = this.pixels[index + 3]; }
			return color;
		}
		else
		{
			throw new Error();
		}
	}
	setPixel(x: number, y: number, color: Color): void {
		
		// the interface of this function takes an (x,y) coordinate assuming y=0 is the top of the canvas
		// but in bmp, (0,0) is the bottom left
		
		// do we deal with globalAlpha here?  do we deal with gradient fills here?
		
		if (0 <= x && x < this.width && 0 <= y && y < this.height)
		{
			var background = this.getPixel(x, y);
			var blend: Color = {};
			var factor = color.a / 255;
			var inverse = 1 - factor;
			blend.r = Math.floor(color.r * factor + background.r * inverse);
			blend.g = Math.floor(color.g * factor + background.g * inverse);
			blend.b = Math.floor(color.b * factor + background.b * inverse);
			
			var index = ((this.height - y - 1) * this.width + x) * (this.bitcount / 8); // note that (0,0) is the bottom left
			this.pixels[index + 0] = blend.b; // also note the order is BGR, not RGB
			this.pixels[index + 1] = blend.g;
			this.pixels[index + 2] = blend.r;
			//if (this.bitcount == 32) { this.pixels[index + 3] = color.a; }
		}
	}
	
	drawImageImpl(image: any, dx: number, dy: number, dw: number, dh: number, sx: number, sy: number, sw: number, sh: number): void {
		
		// image is of type Bitmap, HTMLImageElement, HTMLCanvasElement, HTMLVideoElement
		// g.drawImage(image, dx, dy) - natural width and height are used
		// g.drawImage(image, dx, dy, dw, dh) - image is scaled to fit specified width and height
		// g.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) - all parameters specified, image scaled as needed (note that src params come first here)
		if (dw === undefined) { dw = image.width; }
		if (dh === undefined) { dh = image.height; }
		if (sx === undefined) { sx = 0; }
		if (sy === undefined) { sy = 0; }
		if (sw === undefined) { sw = image.width; }
		if (sh === undefined) { sh = image.height; }
		
		for (var i = 0; i < dw; i++)
		{
			for (var j = 0; j < dh; j++)
			{
				var dstX = dx + i;
				var dstY = dy + j;
				var srcX = sx + Math.floor(i * sw / dw);
				var srcY = sy + Math.floor(j * sh / dh);
				
				this.setPixel(dstX, dstY, (image as Bitmap).getPixel(srcX, srcY));
			}
		}
	}
}

function SplineIntersections(splines: Spline[], y: number): Point[] {
	
	var xs = [];
	
	var intersectingSplines = [];
	
	for (var i = 0; i < splines.length; i++)
	{
		var spline = splines[i];
		
		var intersects = false;
		
		if (spline.type == 'line')
		{
			intersects = LineHoriIntersections(spline.points, y, xs);
		}
		else if (spline.type == 'quadratic')
		{
			intersects = QuadraticHoriIntersections(spline.points, y, xs);
		}
		else if (spline.type == 'cubic')
		{
			intersects = CubicHoriIntersections(spline.points, y, xs);
		}
		else
		{
			throw new Error();
		}
		
		if (intersects)
		{
			intersectingSplines.push(spline);
		}
	}
	
	//if (xs.length % 2 == 1) { debugger; } // an odd number of intersections will cause a line artifact
	//if (y == 286.5) { debugger; }
	
	return xs;
}
function LineHoriIntersections(line: Point[], y: number, xs: number[]): boolean {
	
	// this gives the intersection points of a line segment with an infinite horizontal line
	// we return only the x-coordinate of the intersection point, since y is fixed
	// if there are no intersections, return an empty list
	// if the line is horizontal and coincident with the infinite line, return the endpoints of the segment
	
	if ((line[0].x == line[1].x) && (line[0].y == line[1].y)) { return false; }
	
	if (line[0].y == line[1].y)
	{
		if (line[0].y == y)
		{
			xs.push(line[0].x);
			xs.push(line[1].x);
			
			return true;
		}
		else
		{
			return false;
		}
	}
	else
	{
		var sign = (y - line[0].y) * (y - line[1].y);
		
		if (sign < 0)
		{
			var dx = line[1].x - line[0].x;
			var dy = line[1].y - line[0].y;
			var dyNeeded = y - line[0].y;
			var x = line[0].x + dx * dyNeeded / dy;
			
			xs.push(x);
			
			return true;
		}
		else
		{
			return false;
		}
	}
}
function QuadraticHoriIntersections(quadratic: Point[], y: number, xs: number[]): boolean {
	
	function quadraticCoeffs(x0, x1, x2) { return [ x0 - 2*x1 + x2 , -2*x0 + 2*x1 , x0 ]; }
	function evaluateQuadratic(t, a, b, c) { return a*t*t + b*t + c; }
	
	var ycoeffs = quadraticCoeffs(quadratic[0].y - y, quadratic[1].y - y, quadratic[2].y - y);
	var roots = quadraticRoots(ycoeffs[0], ycoeffs[1], ycoeffs[2]);
	var inInterval = roots.filter(function(t) { return 0.0 <= t && t < 1.0; }); // [0,1) - empirically determined by trying to draw fonts without artifacts
	
	if (inInterval.length == 0) { return false; }
	
	var xcoeffs = quadraticCoeffs(quadratic[0].x, quadratic[1].x, quadratic[2].x);
	
	for (var i = 0; i < inInterval.length; i++)
	{
		var t = inInterval[i];
		xs.push(evaluateQuadratic(t, xcoeffs[0], xcoeffs[1], xcoeffs[2]));
	}
	
	return true;
}
function CubicHoriIntersections(cubic: Point[], y: number, xs: number[]): boolean {
	
	function bezierCoeffs(a, b, c, d) { return [ -a+3*b+-3*c+d , 3*a-6*b+3*c , -3*a+3*b , a ]; }
	function evaluateBezier(t, a, b, c, d) { return a*t*t*t + b*t*t + c*t + d; }
	
	var ycoeffs = bezierCoeffs(cubic[0].y - y, cubic[1].y - y, cubic[2].y - y, cubic[3].y - y);
	var roots = cubicRoots(ycoeffs[0], ycoeffs[1], ycoeffs[2], ycoeffs[3]);
	var inInterval = roots.filter(function(t) { return 0.0 <= t && t < 1.0; });
	
	if (inInterval.length == 0) { return false; }
	
	var xcoeffs = bezierCoeffs(cubic[0].x, cubic[1].x, cubic[2].x, cubic[3].x);
	
	for (var i = 0; i < inInterval.length; i++)
	{
		var t = inInterval[i];
		xs.push(evaluateBezier(t, xcoeffs[0], xcoeffs[1], xcoeffs[2], xcoeffs[3]));
	}
	
	return true;
}

function linearRoots(a: number, b: number): number[] {
	
	// a*x + b = 0
	
	if (a == 0)
	{
		if (b == 0)
		{
			// infinite roots
			return [-Infinity, +Infinity];
		}
		else
		{
			// no roots
			return [];
		}
	}
	else
	{
		return [ -b/a ];
	}
}
function quadraticRoots(a: number, b: number, c: number): number[] {
	if (a == 0) { return linearRoots(b, c); }
	var discriminant = b*b - 4*a*c;
	if (discriminant < 0) { return []; }
	if (discriminant == 0) { return [ b / (2*a) ]; }
	var r0 = (-b + Math.sqrt(discriminant)) / (2*a);
	var r1 = (-b - Math.sqrt(discriminant)) / (2*a);
	return [r0, r1];
}
function cubicRoots(a: number, b: number, c: number, d: number): number[] {
	
	// based on http://mysite.verizon.net/res148h4j/javascript/script_exact_cubic.html#the%20source%20code
	// a*x*x*x + b*x*x + c*x + d = 0
	
	if (a == 0) { return quadraticRoots(b, c, d); }
	
	var A = b / a;
	var B = c / a;
	var C = d / a;
	
	var Q = (3*B - Math.pow(A, 2))/9;
	var R = (9*A*B - 27*C - 2*Math.pow(A, 3))/54;
	var D = Math.pow(Q, 3) + Math.pow(R, 2); // polynomial discriminant
	
	//console.log('Q: ' + Q);
	//console.log('R: ' + R);
	//console.log('D: ' + D);
	
	function sgn(x) { if (x < 0.0) { return -1; } else { return 1; } }
	
	var t = [];
	
	if (D >= 0) // complex or duplicate roots
	{
		var S = sgn(R + Math.sqrt(D))*Math.pow(Math.abs(R + Math.sqrt(D)),(1/3));
		var T = sgn(R - Math.sqrt(D))*Math.pow(Math.abs(R - Math.sqrt(D)),(1/3));
		
		t.push(-A/3 + (S + T)); // real root
		
		var Im = Math.abs(Math.sqrt(3)*(S - T)/2); // complex part of root pair
		
		//console.log('S: ' + Q);
		//console.log('T: ' + R);
		//console.log('Im: ' + Im);
		
		if (Im == 0)
		{
			t.push(-A/3 - (S + T)/2); // real part of complex root
			t.push(-A/3 - (S + T)/2); // real part of complex root
		}
	}
	else // distinct real roots
	{
		var th = Math.acos(R/Math.sqrt(-Math.pow(Q, 3)));
		
		//console.log('th: ' + th);
		
		t.push(2*Math.sqrt(-Q)*Math.cos(th/3) - A/3);
		t.push(2*Math.sqrt(-Q)*Math.cos((th + 2*Math.PI)/3) - A/3);
		t.push(2*Math.sqrt(-Q)*Math.cos((th + 4*Math.PI)/3) - A/3);
	}
	
	//console.log(t);
	
	return t;
}

function LineLineIntersection(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): Point[] {
	
	var nx = (x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4);
	var ny = (x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4);
	var d = (x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
	
	if (d == 0)
	{
		return [];
	}
	else
	{
		return [ { x : nx/d , y : ny/d } ];
	}
}
function BezierLineIntersections(bezier: Point[], line: Point[]): number[] {
	
	// what work do these coefficients do?  the point is to transform the line segment to be the horizontal zero, and then find the zeroes of the bezier
	var A = line[1].y - line[0].y; // A = y2-y1
	var B = line[0].x - line[1].x; // B = x1-x2
	var C = line[0].x*(line[0].y-line[1].y) + line[0].y*(line[1].x-line[0].x); // C = x1*(y1-y2)+y1*(x2-x1)
	
	// we set the first point of the line to (0,0) and the last point to (1,0)
	// that's why we only take the roots in [0,1]
	
	//console.log('A: ' + A);
	//console.log('B: ' + B);
	//console.log('C: ' + C);
	
	function bezierCoeffs(a, b, c, d) { return [ -a+3*b+-3*c+d , 3*a-6*b+3*c , -3*a+3*b , a ]; }
	var bx = bezierCoeffs(bezier[0].x, bezier[1].x, bezier[2].x, bezier[3].x);
	var by = bezierCoeffs(bezier[0].y, bezier[1].y, bezier[2].y, bezier[3].y);
	
	var a = A*bx[0]+B*by[0];
	var b = A*bx[1]+B*by[1];
	var c = A*bx[2]+B*by[2];
	var d = A*bx[3]+B*by[3] + C;
	
	//console.log('a: ' + a);
	//console.log('b: ' + b);
	//console.log('c: ' + c);
	//console.log('d: ' + d);
	
	var roots = cubicRoots(a, b, c, d);
	
	var inUnit = roots.filter(function(t) { return 0.0 <= t && t <= 1.0; });
	
	var intersections = [];
	
	for (var i = 0; i < inUnit.length; i++)
	{
		var t = inUnit[i];
		var x = bx[0]*t*t*t + bx[1]*t*t + bx[2]*t + bx[3];
		//var y = by[0]*t*t*t + by[1]*t*t + by[2]*t + by[3];
		intersections.push(x);
	}
	
	return intersections;
}

function ComputeBezier(t: number, a: number, b: number, c: number, d: number): number {
	return (-a+3*b+-3*c+d)*t*t*t + (3*a-6*b+3*c)*t*t + (-3*a+3*b)*t + a;
}

interface Spline {
	
	type: SplineType; // ADT could be used here
	
	// line, quadratic, cubic types only
	points?: Point[];
	
	// arc type only
	center?: Point;
	radius?: number;
	startAngle?: number;
	endAngle?: number;
}
type SplineType = 'line' | 'quadratic' | 'cubic' | 'arc';
interface Point {
	x: number;
	y: number;
}
interface Color { r?: number; g?: number; b?: number; a?: number; }
var Conversion = {
	ReadUi: function(b: any, k: { k: number }, n: number, little: boolean): number {
		if (b.readUIntLE)
		{
			let x = null;
			
			if (little)
			{
				x = b.readUIntLE(k.k, n);
			}
			else
			{
				x = b.readUIntBE(k.k, n);
			}
			
			k.k += n;
			
			return x;
		}
		else
		{
			let x = 0;
			var mult = 1;
			
			if (little)
			{
				for (var i = 0; i < n; i++)
				{
					x += mult * b[k.k++];
					mult *= 256;
				}
			}
			else
			{
				for (var i = 0; i < n - 1; i++)
				{
					mult *= 256;
				}
			
				for (var i = 0; i < n; i++)
				{
					x += mult * b[k.k++];
					mult /= 256;
				}
			}
			
			return x;
		}
	}
};
function BoundingBox(splines: Spline[]): any {
	
	var xMin = +Infinity;
	var xMax = -Infinity;
	var yMin = +Infinity;
	var yMax = -Infinity;
	
	splines.forEach(function(spline) {
		spline.points.forEach(function(point) {
			xMin = Math.min(point.x, xMin);
			xMax = Math.max(point.x, xMax);
			yMin = Math.min(point.y, yMin);
			yMax = Math.max(point.y, yMax);
		});
	});
	
	return {
		xMin: Math.floor(xMin - 1),
		xMax: Math.floor(xMax + 2),
		yMin: Math.floor(yMin - 1),
		yMax: Math.floor(yMax + 2),
		xRange: xMax - xMin + 3,
		yRange: yMax - yMin + 3
	};
}

