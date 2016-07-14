
(function() {

var Key = function(parent, json) {
	
	this.parent = parent;
	
	this.section = null;
	
	this.labelColors = params.data;
	
	this.ctx = ctx;
	
	this.text = {};
	this.text.font = params.font ? params.font : '10pt sans-serif';
	this.text.fillStyle = params.textColor ? params.textColor : 'black';
	this.text.hAlign = 'left';
	this.text.vAlign = 'center';
	
	// but how do we know these units are at all appropriate for the chosen scale?
	this.boxSize = params.boxSize ? params.boxSize : 10;
	this.vGap = params.vGap ? params.vGap : 10;
	this.labelOffset = params.labelOffset ? params.labelOffset : 5;
	
	this.controls = [];
	
	this.box = new Box(this);
	this.box.x = params.x;
	this.box.y = params.y;
	this.box.hAlign = params.hAlign;
	this.box.vAlign = params.vAlign;
	this.box.parent = this.chart.box;
	this.box.xAnchor = 'right';
	this.box.yAnchor = 'center';
	
	this.box.wd = 100; // we need to measure text to do this correctly
	this.box.hg = this.labelColors.length * this.boxSize + (this.labelColors.length - 1) * this.vGap;
	this.box.align();
};
Key.prototype.draw = function() {
	
	this.page = this.chart.page; // temporary fix until the implementation of Widget.setPage (which will set pages for the widget's subs)
	
	for (var i = 0; i < this.labelColors.length; i++)
	{
		// this needs to be changed to the current anchor usage
		var x = this.box.parent[this.box.xAnchor] + this.box.lf;
		var y = this.box.parent[this.box.yAnchor] + this.box.tp + i * (this.boxSize + this.vGap);
		
		this.ctx.fillStyle = this.labelColors[i].color;
		this.ctx.fillRect(x, y, this.boxSize, this.boxSize);
		this.ctx.font = this.text.font;
		this.ctx.fillStyle = this.text.textColor;
		this.ctx.textAlign = this.text.hAlign;
		this.ctx.textBaseline = ((this.text.vAlign == 'center') ? 'middle' : this.text.vAlign);
		this.ctx.fillText(this.labelColors[i].label, x + this.boxSize + this.labelOffset, y + this.boxSize / 2);
	}
};
Key.prototype.write = function() {
	
};

Key.prototype.onhover = Griddl.Components.OnHover;
Key.prototype.dehover = Griddl.Components.DeHover;
Key.prototype.onmousemove = Griddl.Components.OnMouseMove;

Griddl.Components.Key = Key;

})();

