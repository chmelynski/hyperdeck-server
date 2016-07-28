(function() {

// elementIds was created to support adding of <script> tags in libraries.js, which is on ice right now, so we can leave this be for now
// we want to make sure that all element ids stay unique
// pre-populate elementIds with the ids we use: frce, cells, output, screen, newComponentPanel
// and then the top-level <div> for each component gets the name+'Component', which should probably be replaced by a random unique id
// <div>'s and <style>'s added to the output by html/css/md components all get id-tagged with the component name - which means that component names must go in elementIds (on creation and also on rename)
// the Libraries component adds <script>'s with random ids

var elementIds = {};

Hyperdeck.Components.RegisterElementId = function(id) { elementIds[id] = true; }

Hyperdeck.Components.UniqueElementId = function() {

	var id = null;

	do {
		id = '';
		for (var i = 0; i < 8; i++) {
			var n = Math.floor(Math.random() * 26, 1);
			id += String.fromCharCode(97 + n);
		}
	} while (elementIds[id]);

	elementIds[id] = true;
	return id;
};

Hyperdeck.Components.UniqueName = function(type, n) {

	var name = null;

	do {
		name = type + n.toString();
		n++;
	} while (Hyperdeck.Components.objs[name] || elementIds[name]);

	elementIds[name] = true;

	return name;
};

})();
