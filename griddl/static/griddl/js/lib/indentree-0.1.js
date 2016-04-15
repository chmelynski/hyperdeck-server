
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
	
	var applyTo = this.applyTo = function(ul)
	{
		ul.on('mousedown', function(e)
		{
			//debugger;
			e.preventDefault();
		});
		
		ul.on('click', function(e)
		{
			//debugger;
			e.preventDefault();
			toggle($(e.target));
		});
		
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
	
	function toggle(node)
	{
		if (node.hasClass('indentreeClosed') || node.hasClass('indentreeOpen'))
		{
			node.children('ul').eq(0).css('display', (node.hasClass('indentreeClosed') ? 'block' : 'none'));
			node.toggleClass('indentreeOpen');
			node.toggleClass('indentreeClosed');
		}
	}
	
	// Shift+toggle = toggle focus, also set siblings to the new state of the focus
	// Ctrl+toggle = toggle focus, also set descendants to the new state of the focus
}();

