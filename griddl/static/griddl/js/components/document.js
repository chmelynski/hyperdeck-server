
(function() {

// thing maybe to implement: in slide deck mode, you don't need Sections - every component goes on its own page

// also, maybe Styles and Fonts should go in Document - making Document the defacto global asset cache

// option: section redraw on dat.gui changes (or other changes): manual, onchange, onfinish

var Document = function(json) {
	
 var defaults = {
		type: 'document',
		name: Hyperdeck.Components.UniqueName('document', 1),
		visible: true,
		params: {
		  pageSize: {
		    unit: 'in',
		    width: 850,
		    height: 1100
      },
		  scale: {
		    pixelsPerUnit: 100,
		    cubitsPerUnit: 100
      },
		  snapGrid: {
		    gridlineSpacing: 25,
		    gridlineHighlight: 100
      },
		  pageNumbering: {
		    doPageNumbering: true,
		    firstPage: false,
		    hAlign: 'center',
		    vAlign: 'bottom',
		    hOffset: 0,
		    vOffset: 50,
		    fontSize: 12,
		    fontFamily: 'serif',
		    bold: false,
		    italic: false,
		    color: 'rgb(0,0,0)'
      }
    }
	}

  if (!json) {
    json = defaults;
  } else {
    json = $.extend(true, {}, defaults, json);
  }
	
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
	
	this.pageSize = json.params.pageSize;
	this.scale = json.params.scale;
	this.snapGrid = json.params.snapGrid;
	this.pageNumbering = json.params.pageNumbering;
	
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
	
	var ctx = new Hyperdeck.Canvas(params);
	Hyperdeck.Canvas.HyperdeckCanvas = ctx;
	this.ctx = ctx;
	
	// probably should parametrize this - store the component name in the JSON
	//ctx.styles = Core.MakeHash(Core.GetData(json.styles.componentName), json.styles.keyField);
	
	var section = null;
	this.sections = [];
	
	for (var i = 0; i < Hyperdeck.Core.objs.length; i++)
	{
		var obj = Hyperdeck.Core.objs[i];
		
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
	
	Hyperdeck.Canvas.drawPdf = true;
	this.generate();
	
	var RenderPdf = function() {
		
		Hyperdeck.Canvas.drawPdf = false;
		
		//var text = new Hyperdeck.Pdf(Hyperdeck.Canvas.HyperdeckCanvas).text; // the Canvas constructor sets Hyperdeck.HyperdeckCanvas whenever it is invoked
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
	
	this.div.html('');
	
	var controls = [];
	
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
	gui.add(this, 'generate');
	gui.add(this, 'exportToPdf');
	var page = gui.addFolder('page');
	controls.push(page.add(this.pageSize, 'unit', ['in','pt','cm','mm']));
	controls.push(page.add(this.pageSize, 'width').min(0));
	controls.push(page.add(this.pageSize, 'height').min(0));
	var scale = gui.addFolder('scale');
	controls.push(scale.add(this.scale, 'pixelsPerUnit').min(0));
	controls.push(scale.add(this.scale, 'cubitsPerUnit').min(0));
	var snapGrid = gui.addFolder('snapGrid');
	controls.push(snapGrid.add(this.snapGrid, 'gridlineSpacing').min(0));
	controls.push(snapGrid.add(this.snapGrid, 'gridlineHighlight').min(0));
	
	var pageNumbering = gui.addFolder('pageNumbering');
	controls.push(pageNumbering.add(this.pageNumbering, 'doPageNumbering'));
	controls.push(pageNumbering.add(this.pageNumbering, 'firstPage'));
	controls.push(pageNumbering.add(this.pageNumbering, 'hAlign', ['left','center','right','alternateLeftRight','alternateRightLeft']));
	controls.push(pageNumbering.add(this.pageNumbering, 'vAlign', ['top','center','bottom']));
	controls.push(pageNumbering.add(this.pageNumbering, 'hOffset').min(0));
	controls.push(pageNumbering.add(this.pageNumbering, 'vOffset').min(0));
	controls.push(pageNumbering.add(this.pageNumbering, 'fontFamily'));
	controls.push(pageNumbering.addColor(this.pageNumbering, 'color'));
	
	controls.forEach(function(control) {
		control.onChange(function(value) {
			doc.draw();
		});
	});
	
	this.div[0].appendChild(gui.domElement);
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
	json.params.pageSize = this.pageSize;
	json.params.scale = this.scale;
	json.params.snapGrid = this.snapGrid;
	json.params.pageNumbering = this.pageNumbering;
	return json;
};
Document.prototype.afterLoad = function() {
	this.generate();
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
		
		Hyperdeck.Components.MarkDirty();
	};
	
	var OtherToText = function() {
		
		obj.div.html('');
		
		var textbox = $(document.createElement('textarea'));
		textbox.addClass('Hyperdeck-component-body-radio-textarea');
		obj.div.append(textbox);
		
		var text = obj.getText();
		codemirror = CodeMirror.fromTextArea(textbox[0], { smartIndent : false , lineNumbers : true });
		codemirror.getDoc().setValue(text);
		
		Hyperdeck.Components.MarkDirty();
	};
	
	return [ { label : obj.representationLabel , fn : TextToOther } , { label : 'JSON' , fn : OtherToText } ];
};

function UnitSize(unit) { return {in:1,cm:1/2.54,mm:1/25.4,pt:1/72}[unit]; }

Hyperdeck.Components.document = Document;

})();

