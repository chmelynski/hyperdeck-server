
(function() {

// this is a one-dimensional scale control, used to scale bars and adjust gaps (=scaling a fixed underlying value of 1)
var Arrow = function(params) {
	
	this.parent = params.parent;
	this.ctx = params.ctx;
	this.field = params.field;
	this.hori = params.hori ? true : false;
	this.vert = params.vert ? true : false;
	this.scale = params.scale;
	this.min = params.min;
	
	this.origValue = null; // store the original parameter value here when a drag begins
	this.percent = 100; // this will change during a drag
	
	// this is not exactly the right way to think about this - what we want is to maintain the relative position of the mouse pointer
	// relative to the bar, or the gap, or whatever
	// so if the mouse pointer starts 60% of the way up the bar, we want it to stay at 60%
	this.percentPerPixel = 10;
	
	this.patch = null;
	
	this.strokeStyle = 'rgb(255,0,0)';
	this.lineWidth = 1;
	this.fletchLength = 5;
	this.fletchAngle = 45;
	
	this.circleColor = 'rgb(0,0,255)';
	this.circleRadius = 3;
	
	this.box = new Griddl.Components.Box(this, false);
};
Arrow.prototype.draw = function() {
	
	// some padding on the edges to accomodate the +0.5 stuff
	// patch should be an object that stores image,lf,tp,wd,hg
	this.patch = this.ctx.getImageData(this.box.lf - 1, this.box.tp - 1, this.box.wd + 2, this.box.hg + 2);
	
	var ctx = this.ctx;
	
	ctx.lineWidth = this.lineWidth;
	ctx.strokeStyle = this.strokeStyle;
	
	var dx = this.fletchLength * Math.cos(this.fletchAngle / 360 * Math.PI * 2);
	var dy = this.fletchLength * Math.cos(this.fletchAngle / 360 * Math.PI * 2);
	
	// once again, the +0.5 stuff haunts us
	// added for hori, not yet for vert
	
	if (this.hori)
	{
		ctx.drawLine(this.box.lf, this.box.cy+0.5, this.box.rt   , this.box.cy+0.5   );
		ctx.drawLine(this.box.lf, this.box.cy+0.5, this.box.lf+dx, this.box.cy+0.5-dy); // lf tp fletch
		ctx.drawLine(this.box.lf, this.box.cy+0.5, this.box.lf+dx, this.box.cy+0.5+dy); // lf bt fletch
		ctx.drawLine(this.box.rt, this.box.cy+0.5, this.box.rt-dx, this.box.cy+0.5-dy); // rt tp fletch
		ctx.drawLine(this.box.rt, this.box.cy+0.5, this.box.rt-dx, this.box.cy+0.5+dy); // rt bt fletch
	}
	
	if (this.vert)
	{
		ctx.drawLine(this.box.cx+0.5, this.box.tp, this.box.cx+0.5   , this.box.bt   );
		ctx.drawLine(this.box.cx+0.5, this.box.tp, this.box.cx+0.5-dx, this.box.tp+dy); // tp lf fletch
		ctx.drawLine(this.box.cx+0.5, this.box.tp, this.box.cx+0.5+dx, this.box.tp+dy); // tp rt fletch
		ctx.drawLine(this.box.cx+0.5, this.box.bt, this.box.cx+0.5-dx, this.box.bt-dy); // bt lf fletch
		ctx.drawLine(this.box.cx+0.5, this.box.bt, this.box.cx+0.5+dx, this.box.bt-dy); // bt rt fletch
	}
	
	ctx.fillStyle = this.circleColor;
	ctx.fillCircle(this.box.cx, this.box.cy+0.5, this.circleRadius);
};
Arrow.prototype.clear = function() {
	// patch should be an object that stores image,lf,tp,wd,hg
	this.ctx.putImageData(this.patch, this.box.lf - 1, this.box.tp - 1);
};
Arrow.prototype.ondrag = function(d) {
	
	this.parent[this.field] += d * this.scale;
	if (this.parent[this.field] < this.min) { this.parent[this.field] = this.min; }
	this.parent.calculateDimensions();
};
Arrow.prototype.onhover = function() {
	
	//Debug('Arrow.onhover');
	
	var arrow = this;
	
	this.draw();
	
	this.ctx.canvas.onmousemove = function(e) { arrow.onmousemove(e); };
	
	this.ctx.canvas.onmousedown = function(e) {
		
		var ax = e.offsetX * this.ctx.cubitsPerPixel;
		var ay = e.offsetY * this.ctx.cubitsPerPixel;
		
		arrow.ctx.canvas.onmousemove = function(e) {
			
			var d = 0;
			
			if (arrow.hori)
			{
				var mx = e.offsetX;
				d = mx - ax;
				ax = mx;
			}
			else if (arrow.vert)
			{
				var my = e.offsetY;
				d = my - ay;
				ay = my;
			}
			else
			{
				throw new Error();
			}
			
			// this sequence attempts to limit clearing and redrawing to the parent box
			// this is an optimization, and can be saved until it is really necessary
			//arrow.parent.clear();
			//arrow.ondrag(d);
			//arrow.parent.draw();
			//arrow.draw();
			
			// this just clears and redraws the whole canvas
			arrow.ondrag(d);
			arrow.parent.section.draw();
			arrow.draw();
		};
		arrow.ctx.canvas.onmouseup = function(e) {
			arrow.ctx.canvas.onmousemove = function(e) { arrow.onmousemove(e); };
			arrow.ctx.canvas.onmouseup = null;
			arrow.onmousemove(e);
			
			// we should probably save the existing document JSON to enable undo/redo
			//Griddl.SetData('document', JSON.stringify(arrow.parent.page.document.exportToJson()));
			
			//arrow.parent.draw();
		};
	};
};
Arrow.prototype.dehover = function() {
	//Debug('Arrow.dehover');
	this.ctx.canvas.onmousedown = null;
	this.clear();
	this.parent.onhover();
};
Arrow.prototype.onmousemove = function(e) {
	
	var x = e.offsetX * this.ctx.cubitsPerPixel;
	var y = e.offsetY * this.ctx.cubitsPerPixel;
	
	if (x < this.box.lf || x > this.box.rt || y < this.box.tp || y > this.box.bt)
	{
		this.dehover();
	}
};

Griddl.Components.Arrow = Arrow;

})();

