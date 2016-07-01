
(function() {

// in slide deck mode, you don't need Sections - every component goes on its own page
var Document = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.representationLabel = 'HTML';
	
	this.div = null;
	
	this.canvasDocument = null; // replace all references to canvasDocument with 'ctx'
	this.ctx = null; // set by GenerateDocument
	
	if (typeof window != 'undefined')
	{
		this.parentDiv = document.getElementById('output'); // magic id, need to parametrize or something
	}
	else
	{
		this.parentDiv = null;
	}
	
	// this to be set by setData
	this.unit = null;
	this.page = { width : null , height : null };
	this.pixelsPerUnit = null;
	this.cubitsPerUnit = null;
	this.snapGrid = { gridlineSpacing : null , gridlineHighlight : null };
	
	this.pageNumbering = {};
	this.pageNumbering.doPageNumbering = json.params.pageNumbering.doPageNumbering || false;
	this.pageNumbering.hAlign = json.params.pageNumbering.hAlign || "center";
	this.pageNumbering.vAlign = json.params.pageNumbering.vAlign || "bottom";
	this.pageNumbering.hOffset = json.params.pageNumbering.hOffset || 5;
	this.pageNumbering.vOffset = json.params.pageNumbering.vOffset || 50;
	this.pageNumbering.firstPage = json.params.pageNumbering.firstPage || false;
	this.pageNumbering.font = json.params.pageNumbering.font || "Serif";
	this.pageNumbering.fill = json.params.pageNumbering.fill || "rgb(0,0,0)";
	
	this.setData(json.params);
	
	this.dom = {};
	this.dom.unitSelector = null;
	this.dom.pageWidth = null;
	this.dom.pageHeight = null;
	this.dom.pixelsPerUnit = null;
	this.dom.pixelsPerUnitUnitSpan = null;
	this.dom.cubitsPerUnit = null;
	this.dom.cubitsPerUnitUnitSpan = null;
	this.dom.gridlineSpacingInput = null;
	this.dom.gridlineSpacingUnitSpan = null;
	this.dom.gridlineHighlightInput = null;
	this.dom.gridlineHighlightUnitSpan = null;
	
	this.sections = [];
};
Document.prototype.generate = function() {
	
	//console.log('Document.exec');
	
	// these should probably be pxPerUser and ptPerUser
	var params = {};
	params.unit = this.unit;
	params.pixelsPerUnit = this.pixelsPerUnit;
	params.cubitsPerUnit = this.cubitsPerUnit;
	
	if (typeof window != 'undefined')
	{
		params.div = document.getElementById('output');
		params.div.innerHTML = '';
		this.sections.forEach(function(section) { section.section = null; }); // all Component.Section -> Canvas.Section links need to be broken
	}
	
	var ctx = new Griddl.Canvas(params);
	Griddl.Canvas.griddlCanvas = ctx;
	this.ctx = ctx;
	
	// probably should parametrize this - store the component name in the JSON
	//ctx.styles = Core.MakeHash(Core.GetData(json.styles.componentName), json.styles.keyField);
	
	var section = null;
	this.sections = [];
	
	for (var i = 0; i < Griddl.Core.objs.length; i++)
	{
		var obj = Griddl.Core.objs[i];
		
		if (obj.type == 'document')
		{
			
		}
		else if (obj.type == 'section')
		{
			section = obj;
			section.ctx = ctx;
			section.document = this;
			section.parse(); // this has to happen after section.ctx is set
			section.widgets = [];
			this.sections.push(section);
		}
		else if (obj.draw)
		{
			obj.section = section;
			obj.ctx = ctx;
			section.widgets.push(obj);
		}
		else
		{
			
		}
	}
	
	this.draw();
	
	return ctx; // this is for node
};
Document.prototype.exportToPdf = function() {
	
	var filename = document.getElementsByTagName('title')[0].innerText;
	
	var doc = this;
	
	Griddl.Canvas.drawPdf = true;
	this.generate();
	
	var RenderPdf = function() {
		
		Griddl.Canvas.drawPdf = false;
		
		//var text = new Griddl.Pdf(Griddl.Canvas.griddlCanvas).text; // the Canvas constructor sets Griddl.griddlCanvas whenever it is invoked
		var text = doc.ctx.ExportToPdf();
		
		var downloadLink = document.createElement('a');
		var url = window.URL;
		downloadLink.href = url.createObjectURL(new Blob([text], {type : 'text/pdf'}));
		downloadLink.download = filename + '.pdf';
		document.body.appendChild(downloadLink); // needed for this to work in firefox
		downloadLink.click();
		document.body.removeChild(downloadLink); // cleans up the addition above
	};
	
	if (window.MathJax) { MathJax.Hub.Queue(RenderPdf); } else { RenderPdf(); }
};
Document.prototype.add = function() {
	
	this.addElements();
	this.refresh();
};
Document.prototype.addElements = function() {
	
	this.dom.unitSelector = $('<select id="unitSelector"><option>in</option><option>cm</option><option>mm</option><option>pt</option></select>');
	this.dom.pageWidth = $('<input type="text" id="pageWidth" value="8.5" style="text-align:right;width:50px"></input>');
	this.dom.pageHeight = $('<input type="text" id="pageHeight" value="11" style="text-align:right;width:50px"></input>');
	this.dom.pixelsPerUnit = $('<input type="text" id="pixelsPerUnit" value="72" style="text-align:center;width:50px"></input>');
	this.dom.pixelsPerUnitUnitSpan = $('<span id="unitResolution">in</span>');
	this.dom.cubitsPerUnit = $('<input type="text" id="cubitsPerUnit" value="100" style="text-align:center;width:50px"></input>');
	this.dom.cubitsPerUnitUnitSpan = $('<span id="unitUserspace">in</span>');
	this.dom.gridlineSpacingInput = $('<input type="text" id="gridlineSpacing" value="0.25" style="text-align:center;width:50px"></input>');
	this.dom.gridlineSpacingUnitSpan = $('<span id="unitSpacing">in</span>');
	this.dom.gridlineHighlightInput = $('<input type="text" id="gridlineHighlight" value="1.00" style="text-align:center;width:50px"></input>');
	this.dom.gridlineHighlightUnitSpan = $('<span id="unitHighlight">in</span>');
	
	var doc = this;
	
	this.dom.unitSelector[0].onchange = function() {
		
		doc.pixelsPerUnit = UnitSize(this.value) / UnitSize(doc.unit);
		doc.dom.pixelsPerUnit[0].value = doc.pixelsPerUnit;
		// also auto-adjust usersPerUnit?  probably not necessary
		
		doc.unit = this.value;
		doc.dom.pixelsPerUnitUnitSpan[0].innerText = this.value;
		doc.dom.cubitsPerUnitUnitSpan[0].innerText = this.value;
		doc.dom.gridlineSpacingUnitSpan[0].innerText = this.value;
		doc.dom.gridlineHighlightUnitSpan[0].innerText = this.value;
		
	};
	
	this.dom.pageWidth[0].onchange = function() { doc.page.width = parseFloat(this.value); };
	this.dom.pageHeight[0].onchange = function() { doc.page.height = parseFloat(this.value); };
	this.dom.pixelsPerUnit[0].onchange = function() { doc.pixelsPerUnit = parseFloat(this.value); };
	this.dom.cubitsPerUnit[0].onchange = function() { doc.cubitsPerUnit = parseFloat(this.value); };
	this.dom.gridlineSpacingInput[0].onchange = function() { doc.snapGrid.gridlineSpacing = parseFloat(this.value); };
	this.dom.gridlineHighlightInput[0].onchange = function() { doc.snapGrid.gridlineHighlight = parseFloat(this.value); };
	
	var table, tr, td, button;
	
	table = $('<table></table>');
	tr = $('<tr></tr>');
	td = $('<td></td>');
	button = $('<button></button>');
	button.addClass('griddl-component-head-generate-document btn btn-default');
	button.html('Generate');
	button.on('click', function() { doc.generate(); });
	td.append(button);
	tr.append(td);
	td = $('<td></td>');
	button = $('<button></button>');
	button.addClass('griddl-component-head-export-to-pdf btn btn-default');
	button.html('Export');
	button.on('click', function() { doc.exportToPdf(); });
	td.append(button);
	tr.append(td);
	table.append(tr);
	this.div.append(table);
	
	this.div.append($('<hr />'));
	
	table = $('<table></table>');
	table.append($('<tr><td colspan="4" style="font-weight:bold">Page dimensions</td></tr>'));
	tr = $('<tr><td></td><td>width:</td></tr>');
	td = $('<td></td>');
	td.append(this.dom.pageWidth);
	tr.append(td);
	td = $('<td rowspan="2"></td>');
	td.append(this.dom.unitSelector);
	tr.append(td);
	table.append(tr);
	tr = $('<tr><td></td><td>height:</td></tr>');
	td = $('<td></td>');
	td.append(this.dom.pageHeight);
	tr.append(td);
	table.append(tr);
	this.div.append(table);
	
	this.div.append($('<hr />'));
	
	table = $('<table></table>');
	table.append($('<tr><td colspan="4" style="font-weight:bold">User space units</td></tr>'));
	tr = $('<tr><td></td></tr>');
	td = $('<td></td>');
	td.append(this.dom.cubitsPerUnit);
	tr.append(td);
	td = $('<td>user space units per </td>');
	td.append(this.dom.cubitsPerUnitUnitSpan);
	tr.append(td);
	table.append(tr);
	this.div.append(table);
	
	this.div.append($('<hr />'));
	
	table = $('<table></table>');
	table.append($('<tr><td colspan="4" style="font-weight:bold">Resolution</td></tr>'));
	tr = $('<tr><td></td></tr>');
	td = $('<td></td>');
	td.append(this.dom.pixelsPerUnit);
	tr.append(td);
	td = $('<td>pixels per </td>');
	td.append(this.dom.pixelsPerUnitUnitSpan);
	tr.append(td);
	table.append(tr);
	this.div.append(table);
	
	this.div.append($('<hr />'));
	
	table = $('<table></table>');
	table.append($('<tr><td colspan="4" style="font-weight:bold">Snap grid</td></tr>'));
	tr = $('<tr><td></td><td>Gridline spacing:</td></tr>');
	td = $('<td></td>');
	td.append(this.dom.gridlineSpacingInput);
	tr.append(td);
	td = $('<td></td>');
	td.append(this.dom.gridlineSpacingUnitSpan);
	tr.append(td);
	table.append(tr);
	tr = $('<tr><td></td><td>Gridline highlight:</td></tr>');
	td = $('<td></td>');
	td.append(this.dom.gridlineHighlightInput);
	tr.append(td);
	td = $('<td></td>');
	td.append(this.dom.gridlineHighlightUnitSpan);
	tr.append(td);
	table.append(tr);
	this.div.append(table);
	
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
	var pageNumbering = gui.addFolder('page numbering');
	pageNumbering.add(this.pageNumbering, 'doPageNumbering');
	pageNumbering.add(this.pageNumbering, 'firstPage');
	pageNumbering.add(this.pageNumbering, 'hAlign', ['left','center','right','alternateLeftRight','alternateRightLeft']);
	pageNumbering.add(this.pageNumbering, 'vAlign', ['top','center','bottom']);
	pageNumbering.add(this.pageNumbering, 'hOffset');
	pageNumbering.add(this.pageNumbering, 'vOffset');
	pageNumbering.add(this.pageNumbering, 'font');
	pageNumbering.addColor(this.pageNumbering, 'fill');
	this.div[0].appendChild(gui.domElement);
};
Document.prototype.refresh = function() {
	this.dom.unitSelector[0].value = this.unit;
	this.dom.pageWidth[0].value = this.page.width;
	this.dom.pageHeight[0].value = this.page.height;
	this.dom.pixelsPerUnit[0].value = this.pixelsPerUnit;
	this.dom.pixelsPerUnitUnitSpan[0].innerText = this.unit;
	this.dom.cubitsPerUnit[0].value = this.cubitsPerUnit;
	this.dom.cubitsPerUnitUnitSpan[0].innerText = this.unit;
	this.dom.gridlineSpacingInput[0].value = this.snapGrid.gridlineSpacing;
	this.dom.gridlineSpacingUnitSpan[0].innerText = this.unit;
	this.dom.gridlineHighlightInput[0].value = this.snapGrid.gridlineHighlight;
	this.dom.gridlineHighlightUnitSpan[0].innerText = this.unit;
};
Document.prototype.draw = function() {
	
	//console.log('Document.draw');
	
	this.sections.forEach(function(section) {
		section.draw();
		if (typeof window != 'undefined') { section.onhover(); }
	});
	
	// draw page numbers
	if (this.pageNumbering.doPageNumbering)
	{
		var n = 1;
		for (var i = 0; i < this.sections.length; i++)
		{
			var section = this.sections[i];
			
			this.ctx.SetActiveSection(section.section);
			this.ctx.font = this.pageNumbering.font;
			this.ctx.fillStyle = this.pageNumbering.fill;
			
			var wd = ((section.orientation == 'portrait') ? this.page.width : this.page.height) * this.cubitsPerUnit;
			var hg = ((section.orientation == 'portrait') ? this.page.height : this.page.width) * this.cubitsPerUnit;
			
			for (var k = 0; k < section.nPages; k++)
			{
				var hAlign = this.pageNumbering.hAlign;
				var vAlign = ((this.pageNumbering.vAlign == 'center') ? 'middle' : this.pageNumbering.vAlign);
				
				if (hAlign == 'alternateLeftRight')
				{
					hAlign = ((n % 2 == 0) ? 'right' : 'left');
				}
				else if (hAlign == 'alternateRightLeft')
				{
					hAlign = ((n % 2 == 0) ? 'left' : 'right');
				}
				
				this.ctx.textAlign = hAlign;
				this.ctx.textBaseline = vAlign;
				
				var tp = hg * k;
				var xs = {left:0,center:wd/2,right:wd};
				var ys = {top:tp,center:tp+hg/2,bottom:tp+hg};
				var xPolarity = {left:1,center:1,right:-1};
				var yPolarity = {top:1,center:1,bottom:-1};
				
				if (n == 1 && !this.pageNumbering.firstPage) { n++; continue; }
				
				var x = xs[hAlign] + xPolarity[hAlign] * this.pageNumbering.hOffset;
				var y = ys[vAlign] + yPolarity[vAlign] * this.pageNumbering.vOffset;
				
				this.ctx.fillText(n.toString(), x, y);
				
				n++;
			}
		}
	}
};
Document.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.params = {};
	json.params.unit = this.unit;
	json.params.pageDimensions = {};
	json.params.pageDimensions.width = this.page.width;
	json.params.pageDimensions.height = this.page.height;
	json.params.pixelsPerUnit = this.pixelsPerUnit;
	json.params.cubitsPerUnit = this.cubitsPerUnit;
	json.params.snapGrid = {};
	json.params.snapGrid.gridlineSpacing = this.snapGrid.gridlineSpacing;
	json.params.snapGrid.gridlineHighlight = this.snapGrid.gridlineHighlight;
  json.params.pageNumbering = {};
	json.params.pageNumbering.doPageNumbering = this.pageNumbering.doPageNumbering || false;
	json.params.pageNumbering.hAlign = this.pageNumbering.hAlign;
	json.params.pageNumbering.vAlign = this.pageNumbering.vAlign;
	json.params.pageNumbering.hOffset = this.pageNumbering.hOffset;
	json.params.pageNumbering.vOffset = this.pageNumbering.vOffset;
	json.params.pageNumbering.firstPage = this.pageNumbering.firstPage;
	json.params.pageNumbering.font = this.pageNumbering.font;
	json.params.pageNumbering.fill = this.pageNumbering.fill;
	return json;
};
Document.prototype.setData = function(params) {
	this.unit = params.unit;
	this.page.width = params.pageDimensions.width;
	this.page.height = params.pageDimensions.height;
	this.pixelsPerUnit = params.pixelsPerUnit;
	this.cubitsPerUnit = params.cubitsPerUnit;
	this.snapGrid.gridlineSpacing = params.snapGrid.gridlineSpacing;
	this.snapGrid.gridlineHighlight = params.snapGrid.gridlineHighlight;
};
Document.prototype.getText = function() {
	var json = this.write();
	var text = JSON.stringify(json.params);
	return text;
};
Document.prototype.representationToggle = function() {
	
	// we don't want to destroy the DOM elements, just hide them
	
	var obj = this;
	var codemirror = null;
	
	var TextToOther = function() {
		
		obj.div.html('');
		
		try
		{
			var text = codemirror.getDoc().getValue();
			var data = JSON.parse(text);
		}
		catch (e)
		{
			// the parse has failed - display an error message - look at error handling code in MakeComponentsDiv to see how to display error message
		}
		
		
		obj.setData(data);
		obj.addElements();
		obj.refresh();
		
		Griddl.Components.MarkDirty();
	};
	
	var OtherToText = function() {
		
		obj.div.html('');
		
		var textbox = $(document.createElement('textarea'));
		textbox.addClass('griddl-component-body-radio-textarea');
		obj.div.append(textbox);
		
		var text = obj.getText();
		codemirror = CodeMirror.fromTextArea(textbox[0], { smartIndent : false , lineNumbers : true });
		codemirror.getDoc().setValue(text);
		
		Griddl.Components.MarkDirty();
	};
	
	return [ { label : obj.representationLabel , fn : TextToOther } , { label : 'JSON' , fn : OtherToText } ];
};
Document.New = function() {
	
	var json = {};
	json.type = 'document';
	json.name = Griddl.Components.UniqueName('document', 1);
	json.visible = true;
	json.params = {};
	json.params.unit = 'in';
	json.params.pageDimensions = {};
	json.params.pageDimensions.width = 850;
	json.params.pageDimensions.height = 1100;
	json.params.pixelsPerUnit = 100;
	json.params.cubitsPerUnit = 100;
	json.params.snapGrid = {};
	json.params.snapGrid.gridlineSpacing = 0.25;
	json.params.snapGrid.gridlineHighlight = 1.00;
	json.params.pageNumbering = {};
	json.params.pageNumbering.doPageNumbering = true;
	json.params.pageNumbering.hAlign = 'center';
	json.params.pageNumbering.vAlign = 'bottom';
	json.params.pageNumbering.hOffset = 0;
	json.params.pageNumbering.vOffset = 50;
	json.params.pageNumbering.firstPage = false;
	json.params.pageNumbering.font = '12pt serif';
	json.params.pageNumbering.fill = 'rgb(0,0,0)';
	return json;
};
function UnitSize(unit) { return {in:1,cm:1/2.54,mm:1/25.4,pt:1/72}[unit]; }

Griddl.Components.document = Document;

})();

