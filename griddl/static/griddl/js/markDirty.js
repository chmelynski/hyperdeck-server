
(function() {

Griddl.dirty = false;
var titleTag = document.getElementsByTagName('title')[0];
Griddl.Components.MarkDirty = function() {
	
	if (!Griddl.dirty)
	{
		Griddl.dirty = true;
		titleTag.innerText = titleTag.innerText + '*';
	}
};
Griddl.Components.MarkClean = function() {
	
	if (Griddl.dirty)
	{
		Griddl.dirty = false;
		titleTag.innerText = titleTag.innerText.substr(0, titleTag.innerText.length - 1);
	}
};

})();

