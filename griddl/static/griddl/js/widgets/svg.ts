
import { General } from './general'

export class SVG extends General {
	
	static precision = 3;
	
	width: number = null;
	height: number = null;
	
	currentId: string = null;
	currentPath: string = null;
	transforms: string[] = []; // [ 'translate(10,10)' , 'scale(5)' ] - this is the current transform
	transformStack: string[][] = []; // [ transform1 , transform2 ] - this is a list of the above lists
	eltStrings: string[] = [];
	
	constructor(width: number, height: number) {
		super(width, height);
		this.width = width;
		this.height = height;
	}
	
	SetSvgId(id: string): void { this.currentId = id; }
	PushGroup(id?: string): void { this.eltStrings.push('<g' + (id ? (' id="' + id + '"') : '') + '>'); }
	PopGroup(): void { this.eltStrings.push('</g>'); }
	Render(): string {
		var xmlnss = 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"';
		return '<svg ' + xmlnss + ' width="' + this.width + '" height="' + this.height + '">' + this.eltStrings.join('') + '</svg>'
	}
	
	fillText(text: string, x: number, y: number): void {
		
		var svg = '<text ';
		
		if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
		if (this.transforms.length > 0) { svg += 'transform="' + this.transforms.join(' ') + '" '; }
		var style = '';
		style += 'fill:' + this.fillStyle + ';';
		//style += 'stroke:' + this.strokeStyle + ';';
		style += 'stroke:' + 'none' + ';';
		svg += 'style="' + style + '" ';
		//svg += 'stroke-width="' + this.lineWidth.toString() + '" ';
		
		svg += 'x="' + x.toFixed(SVG.precision) + '" ';
		svg += 'y="' + y.toFixed(SVG.precision) + '" ';
		
		var textAnchor = null;
		
		if (this.textAlign == 'center')
		{
			textAnchor = 'middle';
		}
		else if (this.textAlign == 'start' || this.textAlign == 'end')
		{
			textAnchor = this.textAlign;
		}
		else if (this.textAlign == 'left')
		{
			textAnchor = 'start'; // this assumes left-to-right
		}
		else if (this.textAlign == 'right')
		{
			textAnchor = 'end'; // this assumes left-to-right
		}
		
		svg += 'text-anchor="' + textAnchor + '" ';
		
		// SVG doesn't have the equivalent of the textBaseline of canvas, so we have to simulate it with dx and dy
		// of course, the exact dx and dy should vary with font and font size, but that's hard
		
		var dxdy = this.alignText(text);
		var dxCu = dxdy.dxCu;
		var dyCu = dxdy.dyCu;
		
		svg += 'dy="' + dyCu.toFixed(SVG.precision) + '" ';
		
		svg += 'font-family="' + this.fontFamily + '" ';
		svg += 'font-size="' + this.fontSizeCu.toFixed(SVG.precision) + '" ';
		
		svg += '>' + text + '</text>';
		
		this.eltStrings.push(svg);
	}
	
	clearRect(left: number, top: number, width: number, height: number): void {
		
		var svg = '<rect ';
		if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
		svg += 'style="fill:white;stroke:none;" ';
		svg += 'x="' + left.toString() + '" ';
		svg += 'y="' + top.toString() + '" ';
		svg += 'width="' + width.toString() + '" ';
		svg += 'height="' + height.toString() + '" ';
		svg += '></rect>';
		this.eltStrings.push(svg);
	}
	
	drawRect(left: number, top: number, width: number, height: number, doFill: boolean, doStroke: boolean): void {
		
		var svg = '<rect ';
		
		if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
		var style = '';
		style += 'fill:' + (doFill ? this.fillStyle : 'none') + ';';
		style += 'stroke:' + (doStroke ? this.strokeStyle : 'none') + ';';
		svg += 'style="' + style + '" ';
		if (doStroke) { svg += 'stroke-width="' + this.lineWidth.toString() + '" '; }
		
		svg += 'x="' + left.toFixed(SVG.precision) + '" ';
		svg += 'y="' + top.toFixed(SVG.precision) + '" ';
		svg += 'width="' + width.toFixed(SVG.precision) + '" ';
		svg += 'height="' + height.toFixed(SVG.precision) + '"';
		
		svg += '></rect>';
		
		this.eltStrings.push(svg);
	}
	drawCircle(cx: number, cy: number, r: number, doFill: boolean, doStroke: boolean): void {
		
		var svg = '<circle ';
		
		if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
		var strokeStyle = doStroke ? this.strokeStyle.toString() : 'none';
		var fillStyle = doFill ? this.fillStyle.toString() : 'none';
		svg += 'stroke="' + strokeStyle + '" ';
		svg += 'fill="' + fillStyle + '" ';
		svg += 'stroke-width="' + this.lineWidth.toString() + '" ';
		
		svg += 'cx="' + cx + '" ';
		svg += 'cy="' + cy + '" ';
		svg += 'r="' + r + '"';
		svg += '></circle>';
		this.eltStrings.push(svg);
	}
	drawPath(path: string, doFill: boolean, doStroke: boolean): void {
		
		var svg = '<path ';
		
		if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
		var style = '';
		style += 'fill:' + this.fillStyle + ';';
		style += 'stroke:' + this.strokeStyle + ';';
		svg += 'style="' + style + '" ';
		svg += 'stroke-width="' + this.lineWidth.toString() + '" ';
		
		svg += 'd="' + path + '" ';
		
		svg += '></path>';
		this.eltStrings.push(svg);
	}
	
	beginPath(): void {
		this.currentPath = '';
	}
	closePath(): void {
		this.currentPath += 'z';
	}
	moveTo(x: number, y: number): void {
		this.currentPath += ' M ' + x.toFixed(SVG.precision) + ' ' + y.toFixed(SVG.precision) + ' ';
	}
	lineTo(x: number, y: number): void {
		this.currentPath += ' L ' + x.toFixed(SVG.precision) + ' ' + y.toFixed(SVG.precision) + ' ';
	}
	quadraticCurveTo(x1: number, y1: number, x: number, y: number): void {
		this.currentPath += ' Q ' + x1.toFixed(SVG.precision) + ' ' + y1.toFixed(SVG.precision) + ' ' + x.toFixed(SVG.precision) + ' ' + y.toFixed(SVG.precision) + ' ';
	}
	bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void {
		this.currentPath += ' C ' + x1.toFixed(SVG.precision) + ' ' + y1.toFixed(SVG.precision) + ' ' + x2.toFixed(SVG.precision) + ' ' + y2.toFixed(SVG.precision) + ' ' + x.toFixed(SVG.precision) + ' ' + y.toFixed(SVG.precision) + ' ';
	}
	arc(cx: number, cy: number, r: number, startAngle: number, endAngle: number, bAntiClockwise: boolean): void {
		
		var large = ((endAngle - startAngle) > Math.PI) ? 1 : 0;
		
		var rx = r;
		var ry = r;
		var xAxisRotation = 0;
		var largeArcFlag = large;
		var sweepFlag = 1;
		var x = cx + r * Math.cos(endAngle);
		var y = cy + r * Math.sin(endAngle);
		this.currentPath += ' A ' + rx.toFixed(SVG.precision) + ' ' + ry.toFixed(SVG.precision) + ' ' + xAxisRotation.toFixed(SVG.precision) + ' ' + largeArcFlag.toFixed(SVG.precision) + ' ' + sweepFlag.toFixed(SVG.precision) + ' ' + x.toFixed(SVG.precision) + ' ' + y.toFixed(SVG.precision) + ' ';
	}
	
	fill(): void {
		
		var svg = '<path ';
		
		if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
		var style = '';
		style += 'fill:' + this.fillStyle + ';';
		//style += 'stroke:' + this.strokeStyle + ';';
		svg += 'style="' + style + '" ';
		//svg += 'stroke-width="' + this.lineWidth.toString() + '" ';
		
		svg += 'd="' + this.currentPath + '"';
		
		svg += '></path>';
		
		this.eltStrings.push(svg);
	}
	stroke(): void {
		
		var svg = '<path ';
		
		if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
		var style = '';
		style += 'fill:' + 'none' + ';';
		style += 'stroke:' + this.strokeStyle + ';';
		svg += 'style="' + style + '" ';
		svg += 'stroke-width="' + this.lineWidth.toString() + '" ';
		
		svg += 'd="' + this.currentPath + '"';
		
		svg += '></path>';
		
		this.eltStrings.push(svg);
	}
	clip(): void { }
	
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
		
		var svg = '<image ';
		if (this.currentId != null) { svg += 'id="' + this.currentId + '" '; }
		svg += 'x=' + dx.toString() + ' ';
		svg += 'y=' + dy.toString() + ' ';
		svg += 'width=' + dw.toString() + ' ';
		svg += 'height=' + dh.toString() + ' ';
		svg += 'xlink:href="' + image.src + '" ';
		svg += '></image>';
		this.eltStrings.push(svg);
	}
	
	save(): void {
		
		var clone = [];
		for (var i = 0; i < this.transforms.length; i++) { clone.push(this.transforms[i]); }
		this.transformStack.push(clone);
	}
	restore(): void {
		this.transforms = this.transformStack.pop();
	}
	scale(x: number, y: number): void {
		this.transforms.push('scale(' + x.toString() + ' ' + y.toString() + ')');
	}
	rotateCounterClockwise(angle: number): void {
		this.transforms.push('rotate(' + -(angle / (Math.PI * 2) * 360).toString() + ')');
	}
	rotateClockwise(angle: number): void {
		this.transforms.push('rotate(' + (angle / (Math.PI * 2) * 360).toString() + ')');
	}
	translate(x: number, y: number): void {
		this.transforms.push('translate(' + x.toString() + ' ' + y.toString() + ')');
	}
	transform(sx: number, kx: number, ky: number, sy: number, dx: number, dy: number): void {
		this.transforms.push('matrix(' + sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ')');
	}
	setTransform(sx: number, kx: number, ky: number, sy: number, dx: number, dy: number): void {
		this.transforms = [ 'matrix(' + sx.toString() + ' ' + ky.toString() + ' ' + kx.toString() + ' ' + sy.toString() + ' ' + dx.toString() + ' ' + dy.toString() + ')' ];
	}
	resetTransform(): void {
		this.transforms = [];
	}
}

