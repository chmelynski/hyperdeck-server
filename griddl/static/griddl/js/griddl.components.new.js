
"use strict";

if (typeof Griddl === 'undefined') { var Griddl = {}; }

var TheComponents = (function() {

var Components = {};

var objs = [];

Components.Main = function(text) {
	
	if (typeof text == 'undefined')
	{
		text = $('#frce').text(); // document.getElementById('frce').innerText
	}
	
	var json = JSON.parse(text);
	
	objs = [];
	
	// merge with NewComponent?
	
	json.forEach(function(obj) {
		var component = new Components[obj.type](obj);
		objs[component.name] = component;
		objs.push(component);
	});
	
	if (typeof window != 'undefined')
	{
		objs.forEach(function(obj) {
			obj.div = Components.CreateComponentDiv($('#cells'), obj);
			obj.div.css('border', '1px solid gray');
			obj.div.css('background-color', 'rgb(230,230,230)');
			obj.add();
		});
		
		objs.forEach(function(obj) { if (obj.afterLoad) { obj.afterLoad(); } });
	}
	
	MakeSortable();
};
Components.NewComponent = function(obj) {
	
	obj.div = Components.CreateComponentDiv($('#cells'), obj);
	obj.div.css('border', '1px solid gray');
	obj.div.css('background-color', 'rgb(230,230,230)');
	obj.add();
	if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
	objs[obj.name] = obj;
	objs.push(obj);
	MakeSortable();
};
var RenameObj = Components.RenameObj = function(obj, newname) {
	delete objs[obj.name];
	while (objs[newname]) { newname += ' - copy'; } // if there is a conflict, just add suffixes until there isn't
	$('#'+obj.name).attr('id', newname);
	obj.name = newname;
	objs[obj.name] = obj;
};
var DeleteObj = Components.DeleteObj = function(obj) {
	$('#'+obj.name).remove();
	delete objs[obj.name];
	var i = objs.indexOf(obj);
	objs.splice(i, 1);
};
var SaveToText = Components.SaveToText = function() { return JSON.stringify(objs.map(obj => obj.write())); };
var MakeSortable = Components.MakeSortable = function() {
	$('#cells').sortable({handle:'.reorder-handle',stop:function(event, ui) {
		$(this).children().each(function(index, elt) {
			var id = $(elt).children().eq(1).attr('id');
			objs[index] = objs[id.substr(0, id.length - 'Component'.length)];
		});
		
		$('#output').html('');
		objs.forEach(function(obj) {
			if (obj.type == 'html' || obj.type == 'md' || obj.type == 'css') // not ideal to dispatch on type here
			{
				obj.exec();
			}
		});
	}});
};

var confirmDelete = Components.confirmDelete = function (event) {
  var obj = event.data;
  var modal = $("<div class='modal'><div class='modal-dialog modal-sm'><div class='modal-content'><div class='modal-header text-center'><h3></h3><button class='btn btn-success'>Confirm</button><button data-dismiss='modal' class='btn btn-danger'>Cancel</button></div></div></div></div>");
  $('h3', modal).text("Delete " + obj.name + "?");
  $('body').append(modal);

  $('.btn-success', modal).on('click', function(event) {
    Griddl.Components.DeleteObj(obj);
    obj.div.parent().remove();
    Griddl.Components.MarkDirty(obj);
    $('.modal').modal('hide');
  });

  modal.modal('show');
}

// there's a case to be made that show/hide should destroy/recreate the component body, rather than just show/hide
// Show2 and Hide2 implement the destroy/recreate variant
var Show2 = Components.Show = function(obj) {
	obj.add();
	obj.div.parent().find('.griddl-component-head-minmax').attr('value', '-');
	obj.visible = true;
};
var Hide2 = Components.Hide = function(obj) {
	obj.div.html('');
	obj.div.parent().find('.griddl-component-head-minmax').attr('value', '+');
	obj.visible = false;
};
var Show = Components.Show = function(obj) {
	
	obj.div.removeClass('griddl-component-body-hidden');
	obj.div.parent().find('.griddl-component-head-minmax').attr('value', '-');
	obj.visible = true;
	
	// this fixes this bug: when a component containing a codemirror was initially hidden, and then we maximized, the text would not appear
	if (obj.codemirror) { obj.codemirror.refresh(); }
};
var Hide = Components.Hide = function(obj) {
	obj.div.addClass('griddl-component-body-hidden');
	obj.div.parent().find('.griddl-component-head-minmax').attr('value', '+');
	obj.visible = false;
};
var ShowAll = Components.ShowAll = function() { objs.forEach(function(obj) { Show(obj); }); };
var HideAll = Components.HideAll = function() { objs.forEach(function(obj) { Hide(obj); }); };

// API - these functions can be used in user code - abbreviations are put in the global namespace
var FetchObj = Components.FetchObj = function(name) {
	if (!name) { throw new Error('FetchObj error: invalid name'); }
	if (!objs[name]) { throw new Error("Error: there is no object named '" + name + "'"); }
	return objs[name];
};
Components.GetData = function(name) { return FetchObj(name).getData(); };
Components.SetData = function(name, data) { FetchObj(name).setData(data); };
Components.GetText = function(name) { return FetchObj(name).getText(); };
Components.SetText = function(name, text) { FetchObj(name).setText(text); };
Components.Get = function(name) { return FetchObj(name); };
Components.Run = function(name) { FetchObj(name).exec(); };
Components.New = function(json) { Components.NewComponent(new Components[json.type]()); };
Components.Rem = function(name) { DeleteObj(FetchObj(name)); };

return Components;

})();

var getData = TheComponents.GetData;
var setData = TheComponents.SetData;
var getText = TheComponents.GetText;
var setText = TheComponents.SetText;
var get = TheComponents.Get;
var run = TheComponents.Run;
// new?
// rem?

if (typeof window !== 'undefined') {
	//if (typeof Griddl === 'undefined') { var Griddl = {}; } // Griddl must be defined before this module is loaded
	Griddl.Components = TheComponents;
}
else {
	exports.Components = TheComponents;
}

