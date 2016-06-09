
Griddl.Components.Clear = function() {
	// we can't just call this.box.clear(), because Box.clear() only clears the handles
	this.ctx.clearRect(this.box.lf, this.box.tp, this.box.wd, this.box.hg);
};
Griddl.Components.OnHover = function() {
	this.box.onhover();
};
Griddl.Components.DeHover = function() {
	
};
Griddl.Components.OnMouseMove = function(e) {
	
	// the Box handles leaving and handles - we only have to deal with controls here
	
	var x = e.offsetX * this.ctx.cubitsPerPixel;
	var y = e.offsetY * this.ctx.cubitsPerPixel;
	
	if (this.controls)
	{
		for (var i = 0; i < this.controls.length; i++)
		{
			var control = this.controls[i];
			
			if (control.lf <= x && x <= control.rt && control.tp <= y && y <= control.bt)
			{
				control.onhover();
				return;
			}
		}
	}
	else
	{
		//console.log('warning: component "' + this.name + '" has no controls');
	}
};

