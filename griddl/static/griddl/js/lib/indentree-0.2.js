
var Indentree = new function()
{
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
	
	this.applyTo = function(ul)
	{
		ul.addClass('indentree');
		
		ul.on('mousedown', function(e)
		{
			//debugger;
			e.preventDefault();
		});
		
		ul.on('click', function(e)
		{
			//debugger;
			
			//ul.focus();
			
			e.preventDefault();
			
			var li = $(e.target).closest('li');
			
			var selection = null;
			
			if (e.ctrlKey)
			{
				selection = li.find('*').andSelf();
			}
			else if (e.shiftKey)
			{
				selection = li.siblings().andSelf();
			}
			else
			{
				selection = li;
			}
			
			ul.find('.cursor').removeClass('cursor');
			li.addClass('cursor');
			
			toggle(selection);
		});
		
		//ul.on('keydown', function(e)
		//{
		//	debugger;
		//});
		
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
	
	function toggle(nodes)
	{
		nodes.each(function(index, elt)
		{
			var node = $(elt);
			
			if (node.hasClass('indentreeClosed') || node.hasClass('indentreeOpen'))
			{
				node.children('ul').eq(0).css('display', (node.hasClass('indentreeClosed') ? 'block' : 'none'));
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

