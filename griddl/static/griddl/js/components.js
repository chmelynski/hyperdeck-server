
var Hyperdeck = (function() {

var comps = [];
var names = {}; // key is component name 'foo', value is the component

var metadata = {};
metadata.version = 1;
metadata.view = 'all'; // 'components','all','widgets'

var lastDeletedObj = null;
var password = null; // SaveToText encrypts if password is not null (and if a flag is true)
var ciphertext = null; // Main sets this if it receives ciphertext.  then Decrypt() will re-run Main

var Main = function(text) {
	
	if (typeof text === 'undefined')
	{
		text = $('#frce').text(); // document.getElementById('frce').innerText
	}
	
	var workbook = JSON.parse(text);
	
	if (workbook.cipher)
	{
		ciphertext = text;
		
		var ls = [];
		ls.push('<div class="modal fade" id="decryption-modal"><div class="modal-dialog"><div class="modal-content">');
		ls.push('<div class="modal-body"><div id="passwordDiv">');
		ls.push('<form class="form-horizontal" id="decrypt-form"><div class="form-group">');
		ls.push('<label class="col-sm-3" for="decrypt-password">Password</label>');
		ls.push('<div class="col-sm-9">');
		ls.push('<input class="form-control" name="decrypt-password" id="decrypt-password" type="password"></input>');
		ls.push('</div></div>');
		ls.push('</form></div></div><div class="modal-footer">');
		ls.push('<label id="decrypt-error" style="color:red"></label>')
		ls.push('<button class="btn btn-success" id="decrypt-submit">Decrypt</button>');
		ls.push('</div></div></div></div></div>');
		
		var passwordDiv = $(ls.join(''));
		$('body').append(passwordDiv);
		$('#decryption-modal').modal('show');
		
		var process_decrypt = function (event) {
			event.preventDefault();
			password = $('#decrypt-password').val();
			
			try
			{
				var plaintext = sjcl.decrypt(password, ciphertext);
				$('#decryption-modal').modal('hide');
				Main(plaintext);
				ciphertext = null; // save will only work if ciphertext=null, to avoid double-encrypting
			}
			catch (e)
			{
				$('#decrypt-error').text('Incorrect password');
			}
		};
		
		$("#decrypt-form").on('submit', function(e) {
			e.stopPropagation();
			process_decrypt(e);
		});
		
		$("#decrypt-submit").on('click', function(e) {
			process_decrypt(e);
		});
		
		return;
	}
	
	var jsons = null;
	
	if (workbook.metadata === undefined) // what we'll retroactively call "version 0"
	{
		// v0: [Components]
		jsons = workbook;
	}
	else
	{
		// v1: {metadata:{version:1,view:'components'|'all'|'widgets'},components:[]}
		metadata = workbook.metadata;
		jsons = workbook.components;
	}
	
	$("#show-"+metadata.view).click();
	
	$('#cells').html('');
	
	comps = [];
	toLoad = jsons.length;
	jsons.forEach(function(json) { NewComponent(json, json.type); }); // NewComponent calls _afterLoad
	
	// this will be true under the following conditions:
	// 1. if no components require async processing
	// 2. if all the AfterLoadCallbacks fire before all the NewComponent calls complete,
	//    (loaded == toLoad) will be reached during a NewComponent call
	if (loaded == toLoad) { AfterAllLoaded(); }
	
	//comps.forEach(function(comp) { if (comp._afterAllLoaded) { comp._afterAllLoaded(); } });
	
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
	
	var comp = new Components[type](json, type, name);
	comp._markDirty = MarkDirty;
	names[comp._name] = comp;
	comps.push(comp);
	comp._div = createComponentDivToUse($('#cells'), comp);
	comp._div.css('border', '1px solid gray');
	comp._div.css('background-color', 'rgb(230,230,230)');
	comp._add();
	if (comp._afterLoad) { comp._afterLoad(AfterLoadCallback); } else { loaded++; }
};

/*

Main calls NewComponent, which calls comp._afterLoad if it exists, and reference counts, sending AfterLoadCallback(comp) as a callback
AfterLoadCallback checks the reference count and calls AfterAllLoaded if it works
in most components, afterLoad calls addOutputElements, then makes its ajax calls

*/
var toLoad = 0;
var loaded = 0;
var AfterLoadCallback = function(comp) {
	
	loaded++;
	
	if (loaded == toLoad)
	{
		AfterAllLoaded();
	}
};
var AfterAllLoaded = function() {
	comps.forEach(function(comp) { if (comp._afterAllLoaded) { comp._afterAllLoaded(); } });
	toLoad = 0; // this means that subsequent NewComponent calls will not trigger this
	
	// MathJax.isReady needs to be set before we call MathJax.Hub.Typeset
	// i don't know when that happens, but it's not set when we arrive here
	if (MathJax) { setTimeout(function() { MathJax.Hub.Typeset(); }, 2000); }
};

var AddComponent = function(type, useLocalCreateComponentDiv) {
	if (useLocalCreateComponentDiv) { createComponentDivToUse = LocalCreateComponentDiv; }
	NewComponent(null, type, UniqueName(type, 1));
	if (!dirty) { MarkDirty(); }
	MakeSortable();
};
var RenameComponent = function(comp, newname) {
	
	// if there is a conflict, post an error message and return the old name to be set in the input
	if (names[newname] || $('#' + newname).length > 0)
	{
		$.alert('Name "' + newname + '" conflicts with an existing name.', 'danger');
		return comp._name;
	}
	
	delete names[comp._name];
	$('#'+comp._name).attr('id', newname);
	$('#'+comp._name+'Component').attr('id', newname+'Component');
	comp._name = newname;
	names[comp._name] = comp;
	return comp._name;
};
var DeleteComponent = function(comp) {
	lastDeletedObj = comp;
	$('#'+comp._name).remove();
	comp._div.parent().remove();
	delete names[comp._name];
	var i = comps.indexOf(comp);
	comps.splice(i, 1);
};
var RestoreComponent = function() {
	
	// basically the same code as NewComponent
	var comp = lastDeletedObj;
	while (names[comp._name]) { comp._name += ' - copy'; }
	comp._div = CreateComponentDiv($('#cells'), comp);
	comp._div.css('border', '1px solid gray');
	comp._div.css('background-color', 'rgb(230,230,230)');
	comp._add();
	if (!dirty) { MarkDirty(); }
	names[comp._name] = comp;
	comps.push(comp);
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
	} while (names[name] || elementIds[name]);
	
	elementIds[name] = true;
	
	return name;
};

var SaveToText = function(bEncrypt) {
	metadata.version = 1;
	var components = comps.map(function(comp) {return comp._write();});
	var workbook = {metadata:metadata,components:components};
	var text = JSON.stringify(workbook);
	if (bEncrypt && password != null) { text = sjcl.encrypt(password, text); }
	return text;
};
var MakeSortable = function() {
	$('#cells').sortable({handle:'.reorder-handle',stop:function(event, ui) {
		
		if (!dirty) { MarkDirty(); }
		
		$(this).children().each(function(index, elt) {
			var id = $(elt).children().eq(1).attr('id');
			var name = id.substr(0, id.length - 'Component'.length);
			comps[index] = names[name];
		});
		
		$('#output').html('');
		comps.forEach(function(comp) { if (comp._addOutputElements) { comp._addOutputElements(); } });
		AfterAllLoaded();
	}});
};

var LocalCreateComponentDiv = function(parent, comp) {
	var div = $('<div></div>').appendTo(parent);
	var headerDiv = $('<div style="margin:0.3em"></div>').appendTo(div);
	var clientDiv = $('<div id="' + comp._name + 'Component" class="' + (comp._visible ? '' : 'griddl-component-body-hidden') + '"></div>').appendTo(div);
	headerDiv.append($('<img src="" class="reorder-handle"></img>').css('cursor', 'move'));
	headerDiv.append($('<label>' + comp._type + '</label>'));
	headerDiv.append($('<input type="text" value="' + comp._name + '"></input>').on('blur', function(e) { RenameComponent(comp, this.value); }));
	headerDiv.append($('<button>+/-</button>').on('click', function() { if (comp._visible) { Hide(comp); } else { Show(comp); } }));
	headerDiv.append($('<button>Del</button>').on('click', function() { DeleteComponent(comp); }));
	return clientDiv;
};

var CreateComponentDiv = function(parent, comp) {
	
	var div = $(document.createElement('div'));
	var headerDiv = $(document.createElement('div'));
	var clientDiv = $(document.createElement('div'));
	
	div.addClass('griddl-component');
	headerDiv.addClass('griddl-component-head');
	clientDiv.addClass('griddl-component-body');
	
	// we'll put a modified id on the clientDiv, so that we can refer to it from CSS components
	// we can't tag the component client div with the bare comp._name, because if it is an HTML component, the created div will have id = comp._name
	clientDiv.attr('id', comp._name + 'Component'); 
	if (!comp._visible) { clientDiv.addClass('griddl-component-body-hidden'); }
	
	headerDiv.append(AddReorderHandle(comp));
	headerDiv.append(AddTypeLabel(comp));
	headerDiv.append(AddNameBox(comp));
	headerDiv.append(AddMinimizeButton(comp));
	headerDiv.append(AddDestroyButton(comp));
	
	div.append(headerDiv);
	div.append(clientDiv);
	parent.append(div);
	
	return clientDiv;
}
function AddReorderHandle(comp) {
	
	var div = $(document.createElement('a'));
	div.addClass('reorder-handle btn btn-default btn-sm');
	div.attr('type', 'button');
	div = AddTooltip(div, 'Drag to Reorder');
	div.css('cursor', 'move');
	$(div).append($("<i class='fa fa-arrows-v'></i>"));
	return div;
}
function AddTypeLabel(comp) {
	
	var typeLabel = $(document.createElement('label'));
	typeLabel.addClass('griddl-component-head-type');
	typeLabel.html(comp._type);
	return typeLabel;
}
function AddNameBox(comp) {
	
	var nameBox = $(document.createElement('input'));
	nameBox.attr('type', 'text');
	nameBox.attr('value', comp._name);
	nameBox.addClass('griddl-component-head-name form-control input-sm');
	
	nameBox.on('blur', function(e) {
		var newname = RenameComponent(comp, this.value);
		this.value = newname;
		MarkDirty();
	});
	
	return nameBox;
}
function AddMinimizeButton(comp) {
	
	// to save resources, instead of just setting display:none, perhaps this should remove the clientDiv from the DOM altogether
	
	var button = $(document.createElement('button'));
	button.attr('type', 'button');
	button = AddTooltip(button, 'Expand/Collapse');
	button.addClass('griddl-component-head-minmax btn btn-default btn-sm');
	
	var minus = "fa-minus";
	var plus = "fa-plus";
	
	var $icon = $("<i class='fa'></i>");
	$icon.addClass(comp._visible ? minus : plus);
	button.append($icon);
	
	button.on('click', function() {
		if (comp._visible) { Hide(comp); } else { Show(comp); }
	});
	
	return button;
}
function AddDestroyButton(comp) {
	
	var button = $(document.createElement('button'));
	button.attr('type', 'button');
	button = AddTooltip(button, 'Delete Component');
	button.addClass('griddl-component-head-remove btn btn-default btn-sm');
	button.append($("<i class='fa fa-lg fa-trash-o'></i>"));
	
	button.on('click', null, comp, ConfirmDelete);
	
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
	//  comp._setArrayBuffer
	//    OR
	//  comp._setText
	
	// and optionally comp._setExt to set the extension (useful for images and fonts, for instance)
	
	// we also want drag-n-drop
	
	var comp = this;
	
	var fileChooser = $(document.createElement('input'));
	fileChooser.attr('type', 'file');
	
	fileChooser.on('change', function() {
		
		var fileReader = new FileReader();
		
		fileReader.onload = function(event)
		{
			if (comp._setArrayBuffer)
			{
				comp._setArrayBuffer(event.target.result);
			}
			else if (comp._setText)
			{
				comp._setText(event.target.result);
			}
		};
		
		if (fileChooser[0].files.length > 0)
		{
			var f = fileChooser[0].files[0];
			
			if (comp._setExt) { comp._setExt(f.name.substring(f.name.lastIndexOf('.') + 1)); }
			
			if (comp._setArrayBuffer)
			{
				fileReader.readAsArrayBuffer(f);
			}
			else if (comp._setText)
			{
				fileReader.readAsText(f);
			}
		}
	});
	
	fileChooser.click();
};
var Download = function() {
	
	var comp = this;
	
	var a = document.createElement('a');
	a.href = comp._getHref();
	a.download = comp._name + (comp._ext ? '.' : '') + comp._ext;
	a.click();
};

var Export = function() {

	var filename = $('#workbookName').text();
	var text = SaveToText(false);
	
	var downloadLink = document.createElement('a');
	downloadLink.href = window.URL.createObjectURL(new Blob([text], {type : 'text/plain'}));
	downloadLink.download = filename + '.json';
	downloadLink.click();
};
var ExportHtml = function() {
	var filename = $('#workbookName').text();
	var text = '<html><head></head><body>' + $('#output').html() + '</body></html>';
	
	var downloadLink = document.createElement('a');
	downloadLink.target = '_blank';
	downloadLink.href = window.URL.createObjectURL(new Blob([text], {type : 'text/html'}));
	//downloadLink.download = filename + '.htm';
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

var MarkDirty = function() {
	if (!dirty) {
		dirty = true;
		//parent.postMessage({'action': 'markDirty'}, playground);
		$('#saveMenuButton').addClass("bg-danger");
		$('#saveasMenuButton').addClass("bg-danger");
	}
};
var MarkClean = function() {
	if (dirty) {
		dirty = false;
		//parent.postMessage({'action': 'markClean'}, playground);
		$('#saveMenuButton').removeClass("bg-danger");
		$('#saveasMenuButton').removeClass("bg-danger");
	}
};

var ConfirmDelete = function (event) {
	
	var comp = event.data;
	var modal = $("<div class='modal'><div class='modal-dialog modal-sm'><div class='modal-content'><div class='modal-header text-center'><h3></h3><button class='btn btn-success'>Confirm</button><button data-dismiss='modal' class='btn btn-danger'>Cancel</button></div></div></div></div>");
	$('h3', modal).text("Delete " + comp._name + "?");
	$('body').append(modal);
	
	$('.btn-success', modal).on('click', function(event) {
		DeleteComponent(comp);
		MarkDirty(comp);
		$('.modal').modal('hide');
	});
	
	modal.modal('show');
};

// there's a case to be made that show/hide should destroy/recreate the component body, rather than just show/hide
// Show2 and Hide2 implement the destroy/recreate variant
var Show2 = function(comp) {
	comp._markDirty();
	comp._add();
	comp._div.parent().find('.griddl-component-head').find('i.fa-plus').removeClass('fa-plus').addClass('fa-minus');
	comp._visible = true;
};
var Hide2 = function(comp) {
	comp._markDirty();
	comp._div.html('');
	comp._div.parent().find('.griddl-component-head').find('i.fa-minus').removeClass('fa-minus').addClass('fa-plus');
	comp._visible = false;
};
var Show = function(comp) {
	comp._markDirty();
	comp._div.removeClass('griddl-component-body-hidden');
	comp._div.parent().find('.griddl-component-head').find('i.fa-plus').removeClass('fa-plus').addClass('fa-minus');
	comp._visible = true;
	
	// this fixes this bug: when a component containing a codemirror was initially hidden, and then we maximized, the text would not appear
	if (comp._codemirror) { comp._codemirror.refresh(); }
};
var Hide = function(comp) {
	comp._markDirty();
	comp._div.addClass('griddl-component-body-hidden');
	comp._div.parent().find('.griddl-component-head').find('i.fa-minus').removeClass('fa-minus').addClass('fa-plus');
	comp._visible = false;
};

var FetchComponent = function(name) {
	if (!name) { throw new Error('FetchComponent error: invalid name'); }
	if (!names[name]) { throw new Error("Error: there is no object named '" + name + "'"); }
	return names[name];
};



window.addEventListener('message', receiveMessage, false);

window.addEventListener('beforeunload', function(event) {
	if (dirty)
	{
		var confirmationMessage = 'Warning: workbook is unsaved.  Discard changes?';
  		event.returnValue = confirmationMessage;     // Gecko, Trident, Chrome 34+
 		return confirmationMessage;                  // Gecko, WebKit, Chrome <34	
	}
});

var playground = window.location.protocol + "//";
var chunks = window.location.hostname.split('.');
if (chunks[0] == "sandbox") {
  chunks[0] = "www";
} else {
  chunks[0] = chunks[0].slice(7);
}
playground += chunks.join('.');

$(document).ready(function() {
  // button-group toggle for display modes
  $("#show-components").on('click', function(e) {
      metadata.view = 'components';
      $btn = $(e.target).closest('button');
      if ($btn.hasClass('active')) {return;}
      MarkDirty();
      $btn.addClass('active').siblings().removeClass("active");
      $("#cells-container").css('display', 'block').removeClass('col-sm-6').addClass('col-sm-12');
      $("#output-container").css('display', 'none');
      comps.forEach(function(comp) { if (comp._codemirror) { comp._codemirror.refresh(); } });
  });

  $("#show-all").on('click', function(e) {
      metadata.view = 'all';
      $btn = $(e.target).closest('button');
      if ($btn.hasClass('active')) {return;}
      MarkDirty();
      $btn.addClass('active').siblings().removeClass("active");
      $("#cells-container, #output-container").css('display', 'block').removeClass("col-sm-12").addClass("col-sm-6");
      comps.forEach(function(comp) { if (comp._codemirror) { comp._codemirror.refresh(); } });
  });

  $("#show-widgets").on('click', function(e) {
      metadata.view = 'widgets';
      $btn = $(e.target).closest('button');
      if ($btn.hasClass('active')) {return;}
      MarkDirty();
      $btn.addClass('active').siblings().removeClass("active");
      $("#output-container").css('display', 'block').removeClass('col-sm-6').addClass('col-sm-12');
      $("#cells-container").css('display', 'none');
  });

  $("#up").on('click', function(event) {
    event.preventDefault();
    parent.postMessage({'action': 'nav', 'uri': event.currentTarget.pathname}, playground);
  });

  $('#saveMenuButton').on('click', function(event) {
	if (ciphertext !== null) { $.alert('Must decrypt before saving.', 'danger'); return; }
    save().done(function(success) {
      if (success) {
        $.alert('Your workbook has been saved.', 'success');
        MarkClean();
      }
    });
  }); 

  $('#saveAsForm').on('submit', function(event) {
	if (ciphertext !== null) { $.alert('Must decrypt before saving.', 'danger'); return; }
    event.preventDefault();
    saveAsSubmit();
  });

  $('#saveAsSubmit').on('click', function(event) {
	if (ciphertext !== null) { $.alert('Must decrypt before saving.', 'danger'); return; }
    event.preventDefault();
    saveAsSubmit();
  });
  
  $('.set-encryption').on('click', function(event) {
    event.preventDefault();
    Hyperdeck.SetPassword($('#passwordInput').val());
  });
});

function saveAsSubmit() {
	newname = $("[name='newname']").val();

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
	var text = SaveToText(true);
	var saveResult = window.saveResult = $.Deferred();
	parent.postMessage({'action': 'save', 'text': text, 'deferred': 'saveResult'}, playground);
	return saveResult.promise();
}
function save_as(newname) {
	var text = SaveToText(true);
	var saveAsResult = window.saveAsResult = $.Deferred();
	parent.postMessage({'action': 'save_as', 'text': text, 'newname': newname, 'deferred': 'saveAsResult'}, playground);
	return saveAsResult.promise();
}

// API
var Hyperdeck = {};
var Components = Hyperdeck.Components = {};
Hyperdeck.Get = function(name, options) { var comp = FetchComponent(name); return comp._get(options); };
Hyperdeck.Set = function(name, data, options) { var comp = FetchComponent(name); comp._set(data, options); };
Hyperdeck.Run = function(name, thisArg) { var comp = FetchComponent(name); return comp._exec(thisArg); };
//Hyperdeck.New = function(json) { NewComponent(new Components[json.type]()); };
//Hyperdeck.Rem = function(name) { DeleteComponent(FetchComponent(name)); };
Hyperdeck.Export = Export;
Hyperdeck.ExportHtml = ExportHtml;
Hyperdeck.ShowPasswordInput = function() { $('#passwordModal').modal('show'); };
Hyperdeck.SetPassword = function(pw) {
	if (pw == '') { password = null; } else { password = pw; }
	$('#passwordModal').modal('hide');
	MarkDirty();
};
Hyperdeck.ShowAll = function() { comps.forEach(function(comp) { Show(comp); }); };
Hyperdeck.HideAll = function() { comps.forEach(function(comp) { Hide(comp); }); };
Hyperdeck.Main = Main;
Hyperdeck.AddComponent = AddComponent;
Hyperdeck.RestoreComponent = RestoreComponent;
return Hyperdeck;

})();

