
//var obj = new Proxy(new Components[type](), Components.DefaultProxyHandler);

Griddl.Components.DefaultProxyHandler = {
	set: function(target, property, value, receiver) {
		
		target[property] = value;
		
		if (!Griddl.dirty)
		{
			Griddl.dirty = true;
			Griddl.Components.MarkDirty();
		}
		
		return true; // i was getting a bug when trying to set a property to false
		
		// this is probably way too global - called too many times, too much waste
		
		// if (target.section) { target.section.draw(); }
		
		// refresh codemirror, handsontable, or datgui
		//  1. need a mapping variable to ui object
		//  2. if the change comes from the ui object, a refresh is unnecessary
		
		// save in undo stack - do this in transactions, save lists of changes, so that executing code can be rolled back as a whole
		// of course, it would probably be a good idea to snapshot before running code - put this in Code.exec()
		// that would be easier
	}
};

