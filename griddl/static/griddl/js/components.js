var Hyperdeck = (function() {

var objs = [];

var lastDeletedObj = null;
var password = null;
var ciphertext = null; // Main sets this if it receives ciphertext.  then Decrypt() will re-run Main

var Main = function(text) {
	
	if (typeof text === 'undefined')
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
	json.forEach(function(o) { NewComponent(o, o.type); });
	objs.forEach(function(obj) { if (obj.afterLoad) { obj.afterLoad(); } });
	
	MakeSortable();
	MarkClean();

  // hijack all links & force a new tab/window
  // but make sure nobody's pulling a mean trick lol
  // note: document.ready is too early for this ugh
  $('#output a').on('click.test', function(e) {
    e.preventDefault();
    if (typeof(e.target.href) !== 'undefined') {
      if (e.target.href.indexOf('javascript:') === -1) {
        parent.postMessage({'action': 'link', 'href': e.target.href}, playground);
        return false;
      }
    }
  });
};
var NewComponent = function(json, type, name) {
	
	var obj = new Components[type](json, type, name);
	obj.markDirty = MarkDirty;
	objs[obj.name] = obj;
	objs.push(obj);
	obj.div = createComponentDivToUse($('#cells'), obj);
	obj.div.css('border', '1px solid gray');
	obj.div.css('background-color', 'rgb(230,230,230)');
	obj.add();
};
var AddComponent = function(type, useLocalCreateComponentDiv) {
	if (useLocalCreateComponentDiv) { createComponentDivToUse = LocalCreateComponentDiv; }
	NewComponent(null, type, UniqueName(type, 1));
	if (!dirty) { MarkDirty(); }
	MakeSortable();
};
var RenameObj = function(obj, newname) {
	delete objs[obj.name];
	while (objs[newname]) { newname += ' - copy'; } // if there is a conflict, just add suffixes until there isn't
	$('#'+obj.name).attr('id', newname);
	$('#'+obj.name+'Component').attr('id', newname+'Component');
	obj.name = newname;
	objs[obj.name] = obj;
};
var DeleteObj = function(obj) {
	lastDeletedObj = obj;
	$('#'+obj.name).remove();
	delete objs[obj.name];
	var i = objs.indexOf(obj);
	objs.splice(i, 1);
};
var RestoreObj = function() {
	
	// basically the same code as NewComponent
	var obj = lastDeletedObj;
	while (objs[obj.name]) { obj.name += ' - copy'; }
	obj.div = CreateComponentDiv($('#cells'), obj);
	obj.div.css('border', '1px solid gray');
	obj.div.css('background-color', 'rgb(230,230,230)');
	obj.add();
	if (!dirty) { MarkDirty(); }
	objs[obj.name] = obj;
	objs.push(obj);
	MakeSortable();
	lastDeletedObj = null;
};

// elementIds was created to support adding of <script> tags in libraries.js, which is on ice right now, so we can leave this be for now
// we want to make sure that all element ids stay unique
// pre-populate elementIds with the ids we use: frce, cells, output, screen, newComponentPanel
// and then the top-level <div> for each component gets the name+'Component', which should probably be replaced by a random unique id
// <div>'s and <style>'s added to the output by html/css/md components all get id-tagged with the component name - which means that component names must go in elementIds (on creation and also on rename)
// the Libraries component adds <script>'s with random ids
var elementIds = {};
var RegisterElementId = function(id) { elementIds[id] = true; };
var UniqueElementId = function() {

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
var UniqueName = function(type, n) {
	
	var name = null;
	
	do {
		name = type + n.toString();
		n++;
	} while (objs[name] || elementIds[name]);
	
	elementIds[name] = true;
	
	return name;
};

var Decrypt = function() {
	password = $('#passwordInput')[0].value;
	var plaintext = sjcl.decrypt(password, ciphertext);
	Main(plaintext);
};

var SaveToText = function() {
	// possible vector for dataloss: clicking save before you decrypt.  maybe add a 'decrypted' flag to prevent this
	var text = JSON.stringify(objs.map(function(obj) {return obj.write();}));
	if (password != null) { text = sjcl.encrypt(password, text); }
	return text;
};
var MakeSortable = function() {
	$('#cells').sortable({handle:'.reorder-handle',stop:function(event, ui) {
		
		if (!dirty) { MarkDirty(); }
		
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

var LocalCreateComponentDiv = function(parent, obj) {
	var div = $('<div></div>').appendTo(parent);
	var headerDiv = $('<div></div>').appendTo(div);
	var clientDiv = $('<div id="' + obj.name + 'Component" class="' + (obj.visible ? '' : 'griddl-component-body-hidden') + '"></div>').appendTo(div);
	headerDiv.append($('<img src="" class="reorder-handle"></img>').css('cursor', 'move'));
	headerDiv.append($('<label>' + obj.type + '</label>'));
	headerDiv.append($('<input type="text" value="' + obj.name + '"></input>').on('blur', function(e) { RenameObj(obj, this.value); }));
	headerDiv.append($('<button>+/-</button>').on('click', function() { if (obj.visible) { Hide(obj); } else { Show(obj); } }));
	headerDiv.append($('<button>Del</button>').on('click', function() { DeleteObj(obj); }));
	return clientDiv;
};

var CreateComponentDiv = function(parent, obj) {
	
	var div = $(document.createElement('div'));
	var headerDiv = $(document.createElement('div'));
	var clientDiv = $(document.createElement('div'));
	
	div.addClass('griddl-component');
	headerDiv.addClass('griddl-component-head');
	clientDiv.addClass('griddl-component-body');
	
	// we'll put a modified id on the clientDiv, so that we can refer to it from CSS components
	// we can't tag the component client div with the bare obj.name, because if it is an HTML component, the created div will have id = obj.name
	clientDiv.attr('id', obj.name + 'Component'); 
	if (!obj.visible) { clientDiv.addClass('griddl-component-body-hidden'); }
	
	headerDiv.append(AddReorderHandle(obj));
	headerDiv.append(AddTypeLabel(obj));
	headerDiv.append(AddNameBox(obj));
	headerDiv.append(AddMinimizeButton(obj));
	headerDiv.append(AddDestroyButton(obj));
	
	div.append(headerDiv);
	div.append(clientDiv);
	parent.append(div);
	
	return clientDiv;
}
function AddReorderHandle(obj) {
	
	var div = $(document.createElement('a'));
	div.addClass('reorder-handle btn btn-default btn-sm');
	div.attr('type', 'button');
	div = AddTooltip(div, 'Drag to Reorder');
	div.css('cursor', 'move');
	$(div).append($("<i class='fa fa-arrows-v'></i>"));
	return div;
}
function AddTypeLabel(obj) {
	
	var typeLabel = $(document.createElement('label'));
	typeLabel.addClass('griddl-component-head-type');
	typeLabel.html(obj.type);
	return typeLabel;
}
function AddNameBox(obj) {
	
	var nameBox = $(document.createElement('input'));
	nameBox.attr('type', 'text');
	nameBox.attr('value', obj.name);
	nameBox.addClass('griddl-component-head-name form-control input-sm');
	
	nameBox.on('blur', function(e) {
		RenameObj(obj, this.value);
		obj.div.parent().attr('id', obj.name + 'Component');
		MarkDirty();
	});
	
	return nameBox;
}
function AddMinimizeButton(obj) {
	
	// to save resources, instead of just setting display:none, perhaps this should remove the clientDiv from the DOM altogether
	
	var button = $(document.createElement('button'));
	button.attr('type', 'button');
	button = AddTooltip(button, 'Expand/Collapse');
	button.addClass('griddl-component-head-minmax btn btn-default btn-sm');
	
	var minus = "fa-minus";
	var plus = "fa-plus";
	
	var $icon = $("<i class='fa'></i>");
	$icon.addClass(obj.visible ? minus : plus);
	button.append($icon);
	
	button.on('click', function() {
		if (obj.visible) { Hide(obj); } else { Show(obj); }
	});
	
	return button;
}
function AddDestroyButton(obj) {
	
	var button = $(document.createElement('button'));
	button.attr('type', 'button');
	button = AddTooltip(button, 'Delete Component');
	button.addClass('griddl-component-head-remove btn btn-default btn-sm');
	button.append($("<i class='fa fa-lg fa-trash-o'></i>"));
	
	button.on('click', null, obj, ConfirmDelete);
	
	return button;
}
function AddTooltip(el, text) {
	// assumes a jQuery object representing a DOM element
	el.attr('data-toggle', 'tooltip');
	el.attr('data-placement', 'bottom');
	el.attr('title', text);
	if (el.tooltip) { el.tooltip(); }
	return el;
}

var createComponentDivToUse = CreateComponentDiv;

// we can use this as a generic upload function, but the component needs a setArrayBuffer or setText function, and an optional setExt
var Upload = function() {
	
	// interface required:
	//  target.setArrayBuffer
	//    OR
	//  target.setText
	
	// and optionally target.setExt to set the extension (useful for images and fonts, for instance)
	
	// we also want drag-n-drop
	
	var target = this;
	
	var fileChooser = $(document.createElement('input'));
	fileChooser.attr('type', 'file');
	
	fileChooser.on('change', function() {
		
		var fileReader = new FileReader();
		
		fileReader.onload = function(event)
		{
			if (target.setArrayBuffer)
			{
				target.setArrayBuffer(event.target.result);
			}
			else if (target.setText)
			{
				target.setText(event.target.result);
			}
		};
		
		if (fileChooser[0].files.length > 0)
		{
			var f = fileChooser[0].files[0];
			
			if (target.setExt) { target.setExt(f.name.substring(f.name.lastIndexOf('.') + 1)); }
			
			if (target.setArrayBuffer)
			{
				fileReader.readAsArrayBuffer(f);
			}
			else if (target.setText)
			{
				fileReader.readAsText(f);
			}
		}
	});
	
	fileChooser.click();
};
var Download = function() {
	var a = document.createElement('a');
	a.href = this.getHref();
	a.download = this.name + (this.ext ? '.' : '') + this.ext;
	a.click();
};

var Export = function() {

	var filename = $('#workbookName').text();
	var text = SaveToText();
	
	var downloadLink = document.createElement('a');
	downloadLink.href = window.URL.createObjectURL(new Blob([text], {type : 'text/plain'}));
	downloadLink.download = filename + '.json';
	downloadLink.click();
};

var Base64StringToUint8Array = function(str) {
	
	function b64ToUint6(n) { return n>64&&n<91?n-65:n>96&&n<123?n-71:n>47&&n<58?n+4:n===43?62:n===47?63:0;}
	
	var nBlocksSize = 3;
	var sB64Enc = str.replace(/[^A-Za-z0-9\+\/]/g, ""); // remove all non-eligible characters from the string
	var nInLen = sB64Enc.length;
	var nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2;
	var taBytes = new Uint8Array(nOutLen);
	
	for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++)
	{
		nMod4 = nInIdx & 3;
		nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
		
		if (nMod4 === 3 || nInLen - nInIdx === 1)
		{
			for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++)
			{
				taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
			}
			
			nUint24 = 0;
		}
	}
	
	return taBytes;
};
var Uint8ArrayToBase64String = function(uint8array) {
	var nMod3 = '';
	var sB64Enc = '';
	
	function uint6ToB64(n) { return n<26?n+65:n<52?n+71:n<62?n-4:n===62?43:n===63?47:65;}
	
	for (var nLen = uint8array.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++)
	{
		nMod3 = nIdx % 3;
		//if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
		nUint24 |= uint8array[nIdx] << (16 >>> nMod3 & 24);
		
		if (nMod3 === 2 || uint8array.length - nIdx === 1)
		{
			var a = uint6ToB64(nUint24 >>> 18 & 63);
			var b = uint6ToB64(nUint24 >>> 12 & 63);
			var c = uint6ToB64(nUint24 >>>  6 & 63);
			var d = uint6ToB64(nUint24 >>>  0 & 63);
			sB64Enc += String.fromCharCode(a, b, c, d);
			nUint24 = 0;
		}
	}
	
	return sB64Enc.replace(/A(?=A$|$)/g, "=");
};

var playground = window.playground;

var dirty = false;

// maybe direct uglifyjs to inline this?
var MarkDirty = function() {
	if (!dirty) {
		dirty = true;
		//parent.postMessage({'action': 'markDirty'}, playground);
		$('#saveMenuButton').addClass("bg-danger");
	}
};
var MarkClean = function() {
	if (dirty) {
		dirty = false;
		//parent.postMessage({'action': 'markClean'}, playground);
		$('#saveMenuButton').removeClass("bg-danger");
	}
};

var ConfirmDelete = function (event) {
	
	var obj = event.data;
	var modal = $("<div class='modal'><div class='modal-dialog modal-sm'><div class='modal-content'><div class='modal-header text-center'><h3></h3><button class='btn btn-success'>Confirm</button><button data-dismiss='modal' class='btn btn-danger'>Cancel</button></div></div></div></div>");
	$('h3', modal).text("Delete " + obj.name + "?");
	$('body').append(modal);
	
	$('.btn-success', modal).on('click', function(event) {
		DeleteObj(obj);
		obj.div.parent().remove();
		MarkDirty(obj);
		$('.modal').modal('hide');
	});
	
	modal.modal('show');
};

// there's a case to be made that show/hide should destroy/recreate the component body, rather than just show/hide
// Show2 and Hide2 implement the destroy/recreate variant
var Show2 = function(obj) {
	obj.add();
	obj.div.parent().find('i.fa-plus').removeClass('fa-plus').addClass('fa-minus');
	obj.visible = true;
};
var Hide2 = function(obj) {
	obj.div.html('');
	obj.div.parent().find('i.fa-minus').removeClass('fa-minus').addClass('fa-plus');
	obj.visible = false;
};
var Show = function(obj) {
	
	obj.div.removeClass('griddl-component-body-hidden');
	obj.div.parent().find('i.fa-plus').removeClass('fa-plus').addClass('fa-minus');
	obj.visible = true;
	
	// this fixes this bug: when a component containing a codemirror was initially hidden, and then we maximized, the text would not appear
	if (obj.codemirror) { obj.codemirror.refresh(); }
};
var Hide = function(obj) {
	obj.div.addClass('griddl-component-body-hidden');
	obj.div.parent().find('i.fa-minus').removeClass('fa-minus').addClass('fa-plus');
	obj.visible = false;
};

var FetchObj = function(name) {
	if (!name) { throw new Error('FetchObj error: invalid name'); }
	if (!objs[name]) { throw new Error("Error: there is no object named '" + name + "'"); }
	return objs[name];
};



window.addEventListener('message', receiveMessage, false);

var playground = window.location.protocol + "//";
var chunks = window.location.hostname.split('.');
if (chunks[0] == "sandbox") {
  chunks[0] = "workbook";
} else {
  chunks[0] = chunks[0].slice(7);
}
playground += chunks.join('.');

$(document).ready(function() {
  // button-group toggle for display modes
  $("#show-components").on('click', function(e) {
      $btn = $(e.target).closest('button');
      if ($btn.hasClass('active')) {return;}
      $btn.addClass('active').siblings().removeClass("active");
      $("#cells-container").css('display', 'block').removeClass('col-sm-6').addClass('col-sm-12');
      $("#output-container").css('display', 'none');

  });

  $("#show-all").on('click', function(e) {
      $btn = $(e.target).closest('button');
      if ($btn.hasClass('active')) {return;}
      $btn.addClass('active').siblings().removeClass("active");
      $("#cells-container, #output-container").css('display', 'block').removeClass("col-sm-12").addClass("col-sm-6");
  });

  $("#show-widgets").on('click', function(e) {
      $btn = $(e.target).closest('button');
      if ($btn.hasClass('active')) {return;}
      $btn.addClass('active').siblings().removeClass("active");
      
      $("#output-container").css('display', 'block').removeClass('col-sm-6').addClass('col-sm-12');
      $("#cells-container").css('display', 'none');
  });

  $("#up").on('click', function(event) {
    event.preventDefault();
    parent.postMessage({'action': 'nav', 'uri': event.currentTarget.pathname}, playground);
  });

  $('#saveMenuButton').on('click', function(event) {
    save().done(function(success) {
      if (success) {
        $.alert('Your workbook has been saved.', 'success');
        MarkClean();
      }
    });
  }); 

  $('#saveAsForm').on('submit', function(event) {
    event.preventDefault();
    saveAsSubmit();
  });

  $('#saveAsSubmit').on('click', function(event) {
    event.preventDefault();
    saveAsSubmit();
  });
});

function saveAsSubmit() {
	newname = $("[name='newname']").val();
	
	if (!validateName(newname)) {
		return false;
	}
	
	save_as(newname).done(function(success) {
		if (success) {
			$('#workbookName').text(newname);
			path = window.location.pathname
			newpath = path.slice(0, path.lastIndexOf('/')+1) + newname;
			history.replaceState('workbook-rename', 'Renamed workbook', newpath);
			$.alert('Workbook renamed to ' + newname + '.', 'success');
			$('.modal').modal('hide');
		}
	});
}
function receiveMessage(event) {
	
	var origin = event.origin || event.originalEvent.origin;
	if (origin !== playground) { return false; }
	
	var data = event.data;
	
	if (data.action) {
		switch (data.action) {
			case 'load':
				Main(data.text);
				break;
			case 'resolve':
				console.log(data);
				window[data.deferred].resolve(data.success);
				break;
			case 'modal_close':
				$(".modal").modal('hide');
				break;
			default:
				console.log('problem in sandbox: ', data);
		}
	}
}
function save() {
	var text = SaveToText();
	var saveResult = window.saveResult = $.Deferred();
	parent.postMessage({'action': 'save', 'text': text, 'deferred': 'saveResult'}, playground);
	return saveResult.promise();
}
function save_as(newname) {
	var text = SaveToText();
	var saveAsResult = window.saveAsResult = $.Deferred();
	parent.postMessage({'action': 'save_as', 'text': text, 'newname': newname, 'deferred': 'saveAsResult'}, playground);
	return saveAsResult.promise();
}

// API
var Hyperdeck = {};
var Components = Hyperdeck.Components = {};
Hyperdeck.Get = function(name, options) { return FetchObj(name).get(options); };
Hyperdeck.Set = function(name, data, options) { FetchObj(name).set(data, options); };
Hyperdeck.Run = function(name) { FetchObj(name).exec(); };
//Hyperdeck.New = function(json) { NewComponent(new Components[json.type]()); };
//Hyperdeck.Rem = function(name) { DeleteObj(FetchObj(name)); };
Hyperdeck.Export = Export;
Hyperdeck.SetPassword = function(pw) { password = pw; };
Hyperdeck.ShowAll = function() { objs.forEach(function(obj) { Show(obj); }); };
Hyperdeck.HideAll = function() { objs.forEach(function(obj) { Hide(obj); }); };
Hyperdeck.Main = Main;
Hyperdeck.AddComponent = AddComponent;
Hyperdeck.RestoreObj = RestoreObj;
return Hyperdeck;

})();
