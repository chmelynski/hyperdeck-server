
(function() {

var Styles = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.data = json.data;
};
Styles.prototype.add = function() {
	
	this.addElements();
};
Styles.prototype.addElements = function() {
	
};
Styles.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.data = this.data;
	return json;
};

Griddl.Components.styles = Styles;

})();

