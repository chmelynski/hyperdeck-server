
if (typeof Hyperdeck === 'undefined') { var Hyperdeck = {}; }

Hyperdeck.UI = (function() {

var UI = {};

UI.ReorderComponents = function() {
	var screen = $(document.createElement('div'));
	screen.css('display', 'block');
	screen.css('position', 'fixed');
	screen.css('top', '0');
	screen.css('left', '0');
	screen.css('width', '100%');
	screen.css('height', '100%');
	screen.css('z-index', '997');
	screen.css('opacity', '0.6');
	screen.css('background-color', '#444444');
	
	var dialog = $(document.createElement('div'));
	dialog.css('display', 'block');
	dialog.css('position', 'fixed');
	dialog.css('left', '0');
	dialog.css('top', '0');
	dialog.css('right', '0');
	dialog.css('bottom', '0');
	dialog.css('margin', 'auto');
	dialog.css('width', '20%');
	dialog.css('height', '40%');
	dialog.css('overflow-y', 'auto');
	dialog.css('z-index', '998');
	dialog.css('opacity', '1.0');
	dialog.css('background-color', '#ffffff');
	
	var ul = $(document.createElement('ul'));
	ul.css('list-style-type', 'none');
	ul.css('width', '60%');
	dialog.append(ul);
	
	for (var i = 0; i < Hyperdeck.objs.length; i++)
	{
		var li = $(document.createElement('li'));
		li.addClass('ui-state-default');
		li.css('margin', '2px');
		li.css('cursor', 'move');
		var span = $(document.createElement('span'));
		span.addClass('ui-icon');
		span.addClass('ui-icon-arrowthick-2-n-s');
		span.css('display', 'inline-block');
		li.append(span);
		var span = $(document.createElement('span'));
		span.text(Hyperdeck.objs[i].name);
		span.css('display', 'inline-block');
		li.append(span);
		ul.append(li);
	}
	
	ul.sortable();
	
	var reorder = $(document.createElement('button'));
	reorder.text('Reorder');
	reorder.on('click', function() {
		var names = [];
		ul.children().each(function() { names.push($(this).text()); });
		for (var i = 0; i < names.length; i++)
		{
			Hyperdeck.objs[i] = Hyperdeck.objs[names[i]];
		}
		var containerDivs = [];
		for (var i = 0; i < Hyperdeck.objs.length; i++)
		{
			if (Hyperdeck.objs[i].type == 'grid' || Hyperdeck.objs[i].type == 'matrix')
			{
				containerDivs.push(Hyperdeck.objs[i].div.parent().parent());
			}
			else
			{
				containerDivs.push(Hyperdeck.objs[i].div.parent());
			}
		}
		$('#cells').children().detach(); // detach() keeps data and handlers attached to the elements
		for (var i = 0; i < containerDivs.length; i++)
		{
			$('#cells').append(containerDivs[i]);
		}
		screen.remove();
		dialog.remove();
	});
	
	var cancel = $(document.createElement('button'));
	cancel.text('Cancel');
	cancel.on('click', function() {
		screen.remove();
		dialog.remove();
	});
	
	dialog.append(reorder);
	dialog.append(cancel);
	
	$('body').append(screen);
	$('body').append(dialog);
}
UI.ShowDocumentSettingsPanel = function() {
	
	document.getElementById('screen').style.display = 'block';
	document.getElementById('documentSettingsPanel').style.display = 'block';
	
	document.getElementById('unitSelector').onchange = function() {
		document.getElementById('unitResolution').innerText = this.value;
		document.getElementById('unitUserspace').innerText = this.value;
		document.getElementById('unitSpacing').innerText = this.value;
		document.getElementById('unitHighlight').innerText = this.value;
	};
};
UI.SaveDocumentSettings = function() {
	
	document.getElementById('screen').style.display = 'none';
	document.getElementById('documentSettingsPanel').style.display = 'none';
	
	var doc = JSON.parse(Hyperdeck.GetData('document'));
	doc.documentSettings.unit = document.getElementById('unitSelector').value;
	doc.documentSettings.pageDimensions.width = parseFloat(document.getElementById('pageWidth').value);
	doc.documentSettings.pageDimensions.height = parseFloat(document.getElementById('pageHeight').value);
	doc.documentSettings.pixelsPerUnit = parseFloat(document.getElementById('pixelsPerUnit').value);
	doc.documentSettings.usersPerUnit = parseFloat(document.getElementById('usersPerUnit').value);
	doc.documentSettings.snapGrid.gridlineSpacing = parseFloat(document.getElementById('gridlineSpacing').value);
	doc.documentSettings.snapGrid.gridlineHighlight = parseFloat(document.getElementById('gridlineHighlight').value);
	Hyperdeck.SetData('document', JSON.stringify(doc));
};
UI.CancelDocumentSettings = function() {
	document.getElementById('screen').style.display = 'none';
	document.getElementById('documentSettingsPanel').style.display = 'none';
};
UI.ShowNewWidgetPanel = function() {
	document.getElementById('screen').style.display = 'block';
	document.getElementById('newWidgetPanel').style.display = 'block';
};
UI.CancelNewWidget = function() {
	document.getElementById('screen').style.display = 'none';
	document.getElementById('newWidgetPanel').style.display = 'none';
};

UI.SubmitLoginForm = function() {
	
	var form = $('#loginForm');
	
	$.ajax({
		type: form.attr('method'), // form.attr('method') = 'POST'
		url: form.attr('action'), // form.attr('action') = '/login?next=/saveasForm' the next url is so that the server returns a new saveasForm with a new csrf token
		data: form.serialize(),
		success: function (data) {
			AjaxSuccess(data);
		},
		error: function(data) {
			AjaxFailure(form, data);
		}
	});
};
UI.SubmitSignupForm = function() {
	
	var form = $('#loginForm');
	
	$.ajax({
		type: 'POST',
		url: '/ajaxjoin',
		data: form.serialize(),
		success: function (data) {
			AjaxSuccess(data);
		},
		error: function(data) {
			AjaxFailure(form, data);
		}
	});
};

return UI;

})();
