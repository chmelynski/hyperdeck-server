
(function() {

var Subcanvas = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	this.section = null;
	
	this.ctx = null;
	
	this.text = json.text;
	this.fn = null;
	this.codemirror = null;
	
	this.errorSpan = null;
	this.errorMessage = null;
	
	this.box = new Griddl.Components.Box(this, true);
	this.box.x = json.params.x;
	this.box.y = json.params.y;
	this.box.hAlign = json.params.hAlign;
	this.box.vAlign = json.params.vAlign;
	this.box.wd = json.params.width;
	this.box.hg = json.params.height;
	
	this.margin = {};
	this.margin.tp = json.params.margin.top;
	this.margin.lf = json.params.margin.left;
	this.margin.rt = json.params.margin.right;
	this.margin.bt = json.params.margin.bottom;
	
	this.parent = null; // $(<div>)
	this.canvas = null; // $(<canvas>)
	this.context = null; // the CanvasRenderingContext2D (or in the future, maybe a Canvas) of the subcanvas
};
Subcanvas.prototype.add = function() {
	
	this.addElements();
	this.refresh();
};
Subcanvas.prototype.addElements = function() {
	
	var comp = this;
	
	comp.textarea = $('<textarea></textarea>');
	comp.div.append(comp.textarea);
	comp.codemirror = CodeMirror.fromTextArea(comp.textarea[0], { mode : 'javascript' , smartIndent : false , lineNumbers : true , lineWrapping : true });
	comp.codemirror.on('blur', function() { comp.text = comp.codemirror.getValue(); comp.compile();  });
	comp.codemirror.on('change', function() { Griddl.Components.MarkDirty(); });
	
	comp.refresh();
	
	comp.errorSpan = $('<span></span>')
	comp.div.append(comp.errorSpan);
	
	comp.compile(); // we compile here rather than in the constructor so that any error message can be put in the newly-created errorSpan
	
	this.div.append($('<hr />'));
	
	var gui = new dat.GUI({autoPlace:false});
	gui.add(this.box, 'x');
	gui.add(this.box, 'y');
	gui.add(this.box, 'wd');
	gui.add(this.box, 'hg');
	gui.add(this.box, 'hAlign', ['left','center','right']);
	gui.add(this.box, 'vAlign', ['top','center','bottom']);
	
	var margin = gui.addFolder('margin');
	margin.add(this.margin, 'lf');
	margin.add(this.margin, 'rt');
	margin.add(this.margin, 'tp');
	margin.add(this.margin, 'bt');
	
	this.div[0].appendChild(gui.domElement);
};
Subcanvas.prototype.setSize = function() {
	
	this.box.align();
};
Subcanvas.prototype.refresh = function() {
	this.codemirror.getDoc().setValue(this.text);
};
Subcanvas.prototype.draw = function() {
	
	if (this.parent === null || this.parent.length == 0)
	{
		this.parent = $(this.ctx.currentSection.div);
		this.canvas = $('<canvas></canvas>');
		this.parent.append(this.canvas);
		
		var lf = Math.floor(this.box.lf * this.ctx.pixelsPerCubit, 1);
		var tp = Math.floor(this.box.tp * this.ctx.pixelsPerCubit, 1);
		var wd = Math.floor(this.box.wd * this.ctx.pixelsPerCubit, 1);
		var hg = Math.floor(this.box.hg * this.ctx.pixelsPerCubit, 1);
		
		// getting the subcanvas to be in the right spot is kind of a mess
		this.canvas.css('position', 'relative');
		this.canvas.css('left', lf + 'px');
		this.canvas.css('top', (tp - this.ctx.currentSection.div.clientHeight).toString() + 'px'); 
		this.canvas[0].width = wd;
		this.canvas[0].height = hg;
		
		this.context = this.canvas[0].getContext('2d');
	}
	
	this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
	this.fn.apply(this.context);
};
Subcanvas.prototype.onhover = function() {
	this.canvas.css('border', '1px solid gray');
	this.box.onhover();
};
Subcanvas.prototype.dehover = function() {
	//this.ctx.canvas.style.cursor = 'default';
	this.canvas.css('border', '');
};
Subcanvas.prototype.onmousemove = function(e) {
	
};
Subcanvas.prototype.compile = function() {
	
	try
	{
		this.fn = new Function('args', this.text);
	}
	catch (e)
	{
		this.errorMessage = e.toString();
		this.errorSpan.text(this.errorMessage);
	}
};
Subcanvas.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.text = this.text;
	json.params.x = this.box.x;
	json.params.y = this.box.y;
	json.params.hAlign = this.box.hAlign;
	json.params.vAlign = this.box.vAlign;
	json.params.width = this.box.wd;
	json.params.height = this.box.hg;
	json.params.margin = {};
	json.params.margin.top = this.margin.tp;
	json.params.margin.left = this.margin.lf;
	json.params.margin.right = this.margin.rt;
	json.params.margin.bottom = this.margin.bt;
	return json;
};
Subcanvas.New = function() {
	
	// we need some knowledge of the units and scale to set reasonable initial values for the coordinates
	
	var json = {};
	json.type = 'subcanvas';
	json.name = Griddl.Components.UniqueName('subcanvas', 1);
	json.visible = true;
	json.text = '';
	json.params = {};
	json.params.x = 0;
	json.params.y = 0;
	json.params.hAlign = 'center';
	json.params.vAlign = 'center';
	json.params.width = 300;
	json.params.height = 200;
	return json;
};

Griddl.Components.subcanvas = Subcanvas;

})();

