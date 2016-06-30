
var CreateComponentDiv = Griddl.Components.CreateComponentDiv = function(parent, obj) {
	
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
	
	// 1. toggle between representations (right now for grids and guis, but could be extended to other types)
	//  a. Handsontable/<table>/<pre>/Codemirror (TSV)
	//  b. gui/Codemirror (JSON)
	//  c. Codemirror (JSON)/tree representation of that JSON
	// 2. exec/invoke html/css/js
	// 3. upload/download/dragndrop file - this should be universal
	
	// 1 and 2 are going to be mutually exclusive - there is no alternate representation for html/css/js text, and there is no way that grids or guis can be invoked.  this means that their buttons can take up the same overlapping space
	
	// upload/download should be square buttons with icons, and thus can be put in every header
	// can the upload button also be a dragndrop target?  if not, should there be another square for it?
	
	headerDiv.append(AddReorderHandle(obj));
	headerDiv.append(AddTypeLabel(obj));
	headerDiv.append(AddNameBox(obj));
	//if (obj.representationToggle)
	//{
	//	headerDiv.append(AddRepresentationToggle(obj));
	//}
	//if (obj.execButtonText)
	//{ 
	//	headerDiv.append(AddInvokeButton(obj));
	//}
	//if (obj.execButtonText2)
	//{ 
	//	headerDiv.append(AddInvokeButton2(obj));
	//}
	//if (obj.uploadDownload)
	//{
	//	headerDiv.append(AddUploadButton(obj));
	//	headerDiv.append(AddDownloadButton(obj));
	//}
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
		Griddl.Components.RenameObj(obj, this.value);
		obj.div.parent().attr('id', obj.name + 'Component');
		Griddl.Components.MarkDirty();
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
		if (obj.visible) { 
      $("i.fa", this).removeClass(minus).addClass(plus);
      Griddl.Components.Hide(obj); 
    } else { 
      $("i.fa", this).removeClass(plus).addClass(minus);
      Griddl.Components.Show(obj); 
    }
		//Griddl.Components.MarkDirty();
	});
	
	return button;
}

function AddDestroyButton(obj) {
	
	var button = $(document.createElement('button'));
	button.attr('type', 'button');
  button = AddTooltip(button, 'Delete Component');
	button.addClass('griddl-component-head-remove btn btn-default btn-sm');
  button.append($("<i class='fa fa-lg fa-trash-o'></i>"));
	
	button.on('click', null, obj, Griddl.Components.confirmDelete);
	
	return button;
}

function AddTooltip(el, text) {
  // assumes a jQuery object representing a DOM element
  el.attr('data-toggle', 'tooltip');
  el.attr('data-placement', 'bottom');
  el.attr('title', text);
  el.tooltip();
  return el;
}
