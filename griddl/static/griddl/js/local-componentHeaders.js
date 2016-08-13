
var CreateComponentDiv = Hyperdeck.Components.CreateComponentDiv = function(parent, obj) {
	
	var div = $(document.createElement('div'));
	var headerDiv = $(document.createElement('div'));
	var clientDiv = $(document.createElement('div'));
	
	div.addClass('griddl-component');
	headerDiv.addClass('griddl-component-head');
	clientDiv.addClass('griddl-component-body');
	clientDiv.attr('id', obj.name + 'Component'); 
	if (!obj.visible) { clientDiv.addClass('griddl-component-body-hidden'); }
	
	headerDiv.append($('<img src="" class="reorder-handle"></img>').css('cursor', 'move'));
	headerDiv.append($('<label class="griddl-component-head-type">' + obj.type + '</label>'));
	headerDiv.append($('<input type="text" class="griddl-component-head-name" value="' + obj.name + '"></input>').on('blur', function(e) {
		Hyperdeck.Components.RenameObj(obj, this.value);
		obj.div.parent().attr('id', obj.name + 'Component');
		Hyperdeck.Components.MarkDirty();
	}));
	headerDiv.append($('<button class="griddl-component-head-minmax minus">+/-</button>').on('click', function() {
		if (obj.visible) { 
			$(this).removeClass('minus').addClass('plus');
			Hyperdeck.Components.Hide(obj); 
		} else { 
			$(this).removeClass('plus').addClass('minus');
			Hyperdeck.Components.Show(obj); 
		}
	}));
	headerDiv.append($('<button class="griddl-component-head-remove">Del</button>').on('click', function() { Hyperdeck.Components.DeleteObj(obj); }));
	
	div.append(headerDiv);
	div.append(clientDiv);
	parent.append(div);
	
	return clientDiv;
}

