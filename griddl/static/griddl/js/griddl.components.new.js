//"use strict";

if (typeof Hyperdeck === 'undefined') { var Hyperdeck = {}; }

var TheComponents = (function() {

var Components = {};

var objs = [];
Components.objs = objs; // UniqueName in elementIds.js needs this

var lastDeletedObj = null;
var password = null;
var ciphertext = null; // Main sets this if it receives ciphertext.  then Decrypt() will re-run Main

Components.Main = function(text) {
	
	if (typeof text == 'undefined')
	{
		text = $('#frce').text(); // document.getElementById('frce').innerText
	}
	
	var json = JSON.parse(text);
	
	if (json.cipher)
	{
		ciphertext = text;
		var ls = [];
		ls.push('<div id="passwordDiv">');
		ls.push('<input id="passwordInput" type="password"></input>');
		ls.push('<button onclick="Hyperdeck.Decrypt()">Decrypt</button>');
		ls.push('</div>');
		var passwordDiv = $(ls.join(''));
		$('#cells').append(passwordDiv);
		return;
	}
	
	$('#cells').html('');
	
	objs = [];
	Components.objs = objs; // UniqueName in elementIds.js needs this
	
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
	Hyperdeck.Components.MarkClean();
};
Components.NewComponent = function(obj) {
	
	//var obj = new Hyperdeck.Components[type](null, type);
	obj.div = Components.CreateComponentDiv($('#cells'), obj);
	obj.div.css('border', '1px solid gray');
	obj.div.css('background-color', 'rgb(230,230,230)');
	obj.add();
	if (!Hyperdeck.dirty) { Hyperdeck.Components.MarkDirty(); }
	objs[obj.name] = obj;
	objs.push(obj);
	MakeSortable();
};
var RenameObj = Components.RenameObj = function(obj, newname) {
	delete objs[obj.name];
	while (objs[newname]) { newname += ' - copy'; } // if there is a conflict, just add suffixes until there isn't
	$('#'+obj.name).attr('id', newname);
	$('#'+obj.name+'Component').attr('id', newname+'Component');
	obj.name = newname;
	objs[obj.name] = obj;
};
var DeleteObj = Components.DeleteObj = function(obj) {
	lastDeletedObj = obj;
	$('#'+obj.name).remove();
	delete objs[obj.name];
	var i = objs.indexOf(obj);
	objs.splice(i, 1);
};
var RestoreObj = Components.RestoreObj = function() {
	
	// basically the same code as NewComponent
	var obj = lastDeletedObj;
	while (objs[obj.name]) { obj.name += ' - copy'; }
	obj.div = Components.CreateComponentDiv($('#cells'), obj);
	obj.div.css('border', '1px solid gray');
	obj.div.css('background-color', 'rgb(230,230,230)');
	obj.add();
	if (!Hyperdeck.dirty) { Hyperdeck.Components.MarkDirty(); }
	objs[obj.name] = obj;
	objs.push(obj);
	MakeSortable();
	lastDeletedObj = null;
};

Hyperdeck.Decrypt = function() {
	password = $('#passwordInput')[0].value;
	var plaintext = sjcl.decrypt(password, ciphertext);
	Components.Main(plaintext);
};
Hyperdeck.SetPassword = function(pw) {
	password = pw;
};
var SaveToText = Components.SaveToText = function() {
	// possible vector for dataloss: clicking save before you decrypt.  maybe add a 'decrypted' flag to prevent this
	var text = JSON.stringify(objs.map(function(obj) {return obj.write();}));
	if (password != null) { text = sjcl.encrypt(password, text); }
	return text;
};
var MakeSortable = Components.MakeSortable = function() {
	$('#cells').sortable({handle:'.reorder-handle',stop:function(event, ui) {
		
		if (!Hyperdeck.dirty) { Hyperdeck.Components.MarkDirty(); }
		
		$(this).children().each(function(index, elt) {
			var id = $(elt).children().eq(1).attr('id');
			objs[index] = objs[id.substr(0, id.length - 'Component'.length)];
		});
		
		$('#output').html('');
		
		objs.forEach(function(obj) {
			if (obj.type == 'html' || obj.type == 'md' || obj.type == 'css') // not ideal to dispatch on type here
			{
				obj.addOutputElements();
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
    Hyperdeck.Components.DeleteObj(obj);
    obj.div.parent().remove();
    Hyperdeck.Components.MarkDirty(obj);
    $('.modal').modal('hide');
  });

  modal.modal('show');
};

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
Components.ShowAll = function() { objs.forEach(function(obj) { Show(obj); }); };
Components.HideAll = function() { objs.forEach(function(obj) { Hide(obj); }); };

// API - these functions can be used in user code - abbreviations are put in the global namespace
var FetchObj = Components.FetchObj = function(name) {
	if (!name) { throw new Error('FetchObj error: invalid name'); }
	if (!objs[name]) { throw new Error("Error: there is no object named '" + name + "'"); }
	return objs[name];
};
Hyperdeck.GetData = function(name) { return FetchObj(name).getData(); };
Hyperdeck.SetData = function(name, data) { FetchObj(name).setData(data); };
Hyperdeck.GetText = function(name) { return FetchObj(name).getText(); };
Hyperdeck.SetText = function(name, text) { FetchObj(name).setText(text); };
Hyperdeck.Get = function(name) { return FetchObj(name); };
Hyperdeck.Run = function(name) { FetchObj(name).exec(); };
Hyperdeck.New = function(json) { Components.NewComponent(new Components[json.type]()); };
Hyperdeck.Rem = function(name) { DeleteObj(FetchObj(name)); };

return Components;

})();

if (typeof window !== 'undefined') {
	//if (typeof Hyperdeck === 'undefined') { var Hyperdeck = {}; } // Hyperdeck must be defined before this module is loaded
	Hyperdeck.Components = TheComponents;
}
else {
	exports.Components = TheComponents;
}

