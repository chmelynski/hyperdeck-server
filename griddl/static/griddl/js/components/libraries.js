
(function() {

var Libraries = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.div = null;
	
	this.mathjax = json.params.mathjax;
	this.threejs = json.params.threejs;
	this.d3 = json.params.d3;
	this.chart = json.params.chart;
	this.numeric = json.params.numeric;
};
Libraries.prototype.add = function() {
	
	this.div = Griddl.Components.CreateComponentDiv($('#cells'), this);
	this.div.css('border', '1px solid gray');
	this.div.css('background-color', 'rgb(230,230,230)');
	
	this.addElements();
	
	this.refresh();
};
Libraries.prototype.addElements = function() {
	
	this.div.html('');
	
	var gui = new dat.GUI({autoPlace:false});
	gui.add(this, 'mathjax');
	gui.add(this, 'threejs');
	gui.add(this, 'd3');
	gui.add(this, 'chart');
	gui.add(this, 'numeric');
	
	this.div[0].appendChild(gui.domElement);
};
Libraries.prototype.exec = function() {
	
	// exec is called after all objects are loaded
	
	//var script = document.createElement('script');
	//script.src = '';
	//document.body.appendChild(script);
};
Libraries.prototype.refresh = function() {

};
Libraries.prototype.write = function() {
	
	var json = {};
	json.type = json.type;
	json.name = json.name;
	json.visible = json.visible;
	json.params = {};
	json.params.mathjax = json.params.mathjax;
	json.params.threejs = json.params.threejs;
	json.params.d3 = json.params.d3;
	json.params.chart = json.params.chart;
	json.params.numeric = json.params.numeric;
	return json;
};
Libraries.New = function() {
	
	// maybe check to see if there's a Libraries already in Griddl.Core.objs - if so, throw an alert or something - no need for duplicate Libraries
	
	var json = {};
	json.type = 'libraries';
	json.name = Griddl.Components.Griddl.Components.UniqueName('libraries', 1);
	json.visible = true;
	json.params = {};
	json.params.mathjax = false;
	json.params.threejs = false;
	json.params.d3 = false;
	json.params.chart = false;
	json.params.numeric = false;
	return json;
};

Griddl.Components.libraries = Libraries;

})();

