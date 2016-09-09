
if (typeof window !== 'undefined') {
	CanvasRenderingContext2D.prototype.drawLine = function(x1, y1, x2, y2) {
		this.beginPath();
		this.moveTo(x1, y1);
		this.lineTo(x2, y2);
		this.stroke();
	};
	CanvasRenderingContext2D.prototype.fillCircle = function(x, y, r) {
		this.beginPath();
		this.arc(x, y, r, 0, Math.PI * 2, true);
		this.fill();
	};
	CanvasRenderingContext2D.prototype.strokeCircle = function(x, y, r) {
		this.beginPath();
		this.arc(x, y, r, 0, Math.PI * 2, true);
		this.stroke();
	};
	
	// monkey patching Array breaks 'for (key in array)'
	//Array.prototype.sortBy = function(key) {
	//	this.sort(function(a, b) {
	//		if (a[key] > b[key]) { return 1; }
	//		if (a[key] < b[key]) { return -1; }
	//		return 0;
	//	});
	//};
}

