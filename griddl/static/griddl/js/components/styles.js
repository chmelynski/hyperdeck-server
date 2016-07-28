
(function() {

// font choices in a dropdown box populated by available fonts
// color picker
// hAlign/vAlign 9-box picker
// bold and italic should be bools represented by checkboxes in the interface
// the style should be previewed

//{"name":"serif","fontFamily":"Times New Roman","fontSize":12,"color":"black","hAlign":"left","vAlign":"middle"},
//{"name":"serifBold","fontFamily":"Times New Roman bold","fontSize":12,"color":"black","hAlign":"left","vAlign":"middle"},
//{"name":"serifItalic","fontFamily":"Times New Roman italic","fontSize":12,"color":"black","hAlign":"left","vAlign":"middle"},
//{"name":"serifBoldItalic","fontFamily":"Times New Roman bold italic","fontSize":12,"color":"black","hAlign":"left","vAlign":"middle"},
//{"name":"sansSerifBold","fontFamily":"Arial bold","fontSize":12,"color":"black","hAlign":"left","vAlign":"middle"},
//{"name":"right","fontFamily":"Arial","fontSize":12,"color":"black","hAlign":"right","vAlign":"middle"},
//{"name":"centered","fontFamily":"Arial","fontSize":12,"color":"black","hAlign":"center","vAlign":"middle"},
//{"name":"centerBold","fontFamily":"Arial bold","fontSize":12,"color":"black","hAlign":"center","vAlign":"middle"},
//{"name":"h1","fontFamily":"Arial","fontSize":24,"color":"black","hAlign":"center","vAlign":"middle"},
//{"name":"h2","fontFamily":"Arial","fontSize":16,"color":"black","hAlign":"center","vAlign":"middle"},
//{"name":"src","fontFamily":"Arial","fontSize":8,"color":"black","hAlign":"left","vAlign":"middle"}

var Styles = function(json) {
	
	if (!json)
	{
		json = {};
		json.type = 'styles';
		json.name = Hyperdeck.Components.UniqueName('styles', 1);
		json.visible = true;
		json.data = [{name:'default',fontSize:12,fontFamily:'serif',bold:false,italic:false,color:'rgb(0,0,0)'}];
	}
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	this.data = json.data;
};
Styles.prototype.add = function() {
	
	this.div.html('');
	
	this.tableDiv = $(document.createElement('div'));
	this.div.append(this.tableDiv);
	
	var options = {};
	options.formulas = false;
	options.rowHeaders = function(index) { return index; };
	options.colHeaders = ['name','fontSize','fontFamily','bold','italic','color'];
	options.contextMenu = true;
	options.manualColumnResize = true;
	options.data = this.data;
	options.afterChange = function(changes, source) { if (source != 'loadData') { Hyperdeck.Components.MarkDirty(); } };
	options.columns = [];
	options.columns.push({data:'name'});
	options.columns.push({data:'fontSize'});
	options.columns.push({data:'fontFamily',editor:'select',selectOptions:['serif','sans-serif']}); // fill with available fonts
	options.columns.push({data:'bold',type:'checkbox'});
	options.columns.push({data:'italic',type:'checkbox'});
	options.columns.push({data:'color'});
	this.handsontable = new Handsontable(this.tableDiv[0], options);
};
Styles.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.data = this.data;
	return json;
};

Hyperdeck.Components.SetStyle = function(ctx, styleStr) {
	
	var styleObj = null;
	
	// first find the correct style obj (the first one with a matching name)
	for (var i = 0; i < Hyperdeck.Core.objs.length; i++)
	{
		if (Hyperdeck.Core.objs[i].type == 'styles')
		{
			for (var k = 0; k < Hyperdeck.Core.objs[i].data.length; k++)
			{
				if (Hyperdeck.Core.objs[i].data[k].name == styleStr)
				{
					styleObj = Hyperdeck.Core.objs[i].data[k];
					break;
				}
			}
		}
	}
	
	if (styleObj === null) { return; }
	
	//ctx.font = styleObj.fontSize + 'pt ' + styleObj.fontFamily + (styleObj.bold ? ' bold' : '') + (styleObj.italic ? ' italic' : '');
	ctx.setFontSize(styleObj.fontSize);
	ctx.setFont(styleObj.fontFamily, styleObj.bold, styleObj.italic);
	ctx.fillStyle = styleObj.color;
};

Hyperdeck.Components.styles = Styles;

})();

