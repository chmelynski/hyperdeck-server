
var Indentree = new function() {
	
	// <ul>
	//   <li class="indentreeOpen">
	//     Parent item
	//     <ul>
	//       <li>Child item</li>
	//       <li>Child item</li>
	//     </ul>
	//   </li>
	//   <li class="indentreeOpen">
	//     Parent item
	//     <ul>
	//       <li>Child item</li>
	//       <li>Child item</li>
	//     </ul>
	//   </li>
	// </ul>
	
	this.applyTo = function(ul) {
		
		ul.addClass('indentree');
		
		ul.on('mousedown', function(e)
		{
			//debugger;
			e.preventDefault();
		});
		
		//ul.on('mousemove', function(e)
		//{
		//	e.preventDefault();
		//	var li = $(e.target).closest('li');
		//	ul.find('.cursor').removeClass('cursor');
		//	li.addClass('cursor');
		//});
		
		ul.on('click', function(e)
		{
			//debugger;
			
			//ul.focus();
			
			e.preventDefault();
			
			var li = $(e.target).closest('li');
			
			ToggleTarget(e, li);
			
			ul.find('.cursor').removeClass('cursor');
			li.addClass('cursor');
		});
		
		ul.on('keydown', function(e)
		{
			if (e.keyCode == 'rightArrow')
			{
				var target = ul.find('.cursor');
				ToggleTarget(e, target);
			}
			else if (e.keyCode == 'leftArrow')
			{
				var target = ul.find('.cursor');
				ToggleTarget(e, target);
			}
			else if (e.keyCode == 'upArrow')
			{
				var target = ul.find('.cursor');
				// move cursor to either the last descendant of the previous sibling, or, if there is no previous sibling, move cursor to the parent
			}
			else if (e.keyCode == 'downArrow')
			{
				var target = ul.find('.cursor');
				// move cursor to:
				// first child, or
				// next sibling, or
				// next sibling of parent, or
				// next sibling of grandparent, etc.
			}
		});
		
		function ToggleTarget(e, target)
		{
			var selection = null;
			
			if (e.ctrlKey)
			{
				selection = target.find('*').andSelf();
			}
			else if (e.shiftKey)
			{
				selection = target.siblings().andSelf();
			}
			else
			{
				selection = target;
			}
			
			var action = null;
			
			if (target.hasClass('indentreeClosed'))
			{
				toggle(selection, 'open');
			}
			else if (target.hasClass('indentreeOpen'))
			{
				toggle(selection, 'close');
			}
			else
			{
			
			}
		}
		
		//ul.children('li').each(function()
		//{
		//	// prevent text from being selected unintentionally
		//	//$(this).on('mousedown', function(e) { e.preventDefault(); });
		//	//li.on('onselectstart', function() { event.returnValue = false; });
		//	
		//	
		//	var li = $(this);
		//	li.on('click', function(e) { toggle(li); });
		//	li.on('mouseover', function(e) { li.css('border', '1px dotted gray'); });
		//	li.on('mouseout', function(e) { li.css('border', ''); });
		//	li.children('ul').each(function(index, elt) { applyTo($(elt)) });
		//});
	};
	
	function toggle(nodes, action) {
		
		nodes.each(function(index, elt)
		{
			var node = $(elt);
			
			if (action == 'open' && node.hasClass('indentreeClosed'))
			{
				node.children('ul').eq(0).css('display', 'block');
				node.toggleClass('indentreeOpen');
				node.toggleClass('indentreeClosed');
			}
			
			if (action == 'close' && node.hasClass('indentreeOpen'))
			{
				node.children('ul').eq(0).css('display', 'none');
				node.toggleClass('indentreeOpen');
				node.toggleClass('indentreeClosed');
			}
		});
	}
	
	// this doesn't do what we describe below - it just toggles all selected elements, it doesn't toggle them to the new state of the focus
	// to do that, we might have to make separate open() and close() functions, and call them specifically
	
	// Shift+toggle = toggle focus, also set siblings to the new state of the focus
	// Ctrl+toggle = toggle focus, also set descendants to the new state of the focus
}();

