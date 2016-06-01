
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
	
	var img = $(document.createElement('img'));
	img.addClass('reorder-handle');
	img.css('cursor', 'move');
	img[0].src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAERJREFUOE9j3LJlCwMMeHt7w9lbt24lKM4A1AwH/5EAMeIDqJlUpyKrZxiimomJElxeG8CoosjZQzSqKHI2RQE2NDUDAEVWy5NpqgO1AAAAAElFTkSuQmCC';
	return img;
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
	nameBox.addClass('griddl-component-head-name');
	
	nameBox.on('blur', function(e) {
		Griddl.Components.RenameObj(obj, this.value);
		obj.div.parent().attr('id', obj.name + 'Component');
		Griddl.Components.MarkDirty();
	});
	
	return nameBox;
}
function AddMinimizeButton(obj) {
	
	// to save resources, instead of just setting display:none, perhaps this should remove the clientDiv from the DOM altogether
	
	var button = $(document.createElement('input'));
	button.attr('type', 'button');
	button.attr('value', obj.visible ? '-' : '+');
	button.addClass('griddl-component-head-minmax');
	
	button.on('click', function() {
		if (obj.visible) { Griddl.Components.Hide(obj); } else { Griddl.Components.Show(obj); }
		Griddl.Components.MarkDirty();
	});
	
	return button;
}
function AddDestroyButton(obj) {
	
	var button = $(document.createElement('input'));
	button.attr('type', 'button');
	button.attr('value', 'x');
	button.addClass('griddl-component-head-remove');
	
	button.on('click', function() {
		if (window.confirm('Delete component?')) {
			Griddl.Components.DeleteObj(obj);
			obj.div.parent().remove();
			Griddl.Components.MarkDirty();
		}
	});
	
	return button;
}

