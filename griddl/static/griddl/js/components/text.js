
(function() {

// this can be used for titles, captions, lists, footnotes, math, and any other type of manually-positioned text
// text is displayed in a codemirror now, but maybe we could put it in a handsontable or a datgui, and possibly allow toggling

var Text = function(json) {
	
	// text	left	dy	style	bulType	bulSize
	// major1	40	200	basic	circle	6
	// minor1	80	30	basic	circle	3
	// subminor1	120	30	basic	circle	2
	// major2	40	30	basic	circle	6
	// minor2	80	30	basic	circle	3
	
	if (!json)
	{
		json = {};
		json.type = 'list';
		json.name = Griddl.Components.UniqueName('list', 1);
		json.visible = true;
		json.text = '1. foo\n a. bar\n b. baz\n2. huh';
		json.params = {};
		json.params.x = 425;
		json.params.y = 200;
		json.params.hAlign = 'center';
		json.params.vAlign = 'top';
		json.params.width = 200;
		json.params.pitch = 25;
		json.params.indent = 25;
		json.params.styles = '';
		json.params.font = '12pt serif';
		json.params.fill = 'rgb(0,0,0)';
		json.params.textMargin = 5;
		json.params.markerStyle = 'circle';
		json.params.markerDiameter = 8;
		json.params.margin = {};
		json.params.margin.top = 50;
		json.params.margin.left = 50;
		json.params.margin.right = 50;
		json.params.margin.bottom = 50;
	}
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this._text = json.text;
	
	Object.defineProperty(this, 'text', { 
		get : function() {
			return this._text;
		},
		set : function(value) {
			this._text = value;
			if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
			this.codemirror.getDoc().setValue(this._text);
			this.parse();
			this.section.draw();
		}
	});
	
	this.data = null;
	this.parse(); // fill this.data by parsing this.text
	
	this.div = null;
	this.ctx = null;
	this.section = null;
	
	// textStyle.styles is a comma-separated list, applies to each respective indentation level - parsed in setSize and draw, because we want to edit it as a sting
	
	this.textPositioning = json.params.textPositioning;
	this.textStyle = json.params.textStyle;
	this.markerStyle = json.params.markerStyle; // shape : 'none' , 'circle' , 'square' , diameter
	
	this.box = new Griddl.Components.Box(this, true);
	this.box.hAlign = json.params.box.hAlign;
	this.box.vAlign = json.params.box.vAlign;
	this.box.xAnchor = json.params.box.xAnchor;
	this.box.yAnchor = json.params.box.yAnchor;
	this.box.x = json.params.box.x;
	this.box.y = json.params.box.y;
	this.box.wd = json.params.box.wd;
	
	this.margin = json.params.margin;
};
Text.prototype.add = function() {
	
	var comp = this;
	
	this.div.html('');
	
	this.textarea = $('<textarea></textarea>');
	this.div.append(this.textarea);
	
	var options = {};
	options.mode = 'plain';
	options.smartIndent = false;
	options.lineNumbers = true;
	options.lineWrapping = true;
	this.codemirror = CodeMirror.fromTextArea(this.textarea[0], options);
	
	this.codemirror.getDoc().setValue(this.text)
	
	// on 'blur' or 'change'
	this.codemirror.on('change', function() {
		if (!Griddl.dirty) { Griddl.Components.MarkDirty(); }
		comp._text = comp.codemirror.getValue(); // we avoid a setter loop by setting this._text, not this.text
		comp.parse();
		comp.section.draw();
	});
	
	this.div.append($('<hr />'));
	
	var controls = [];
	
	var gui = new dat.GUI({autoPlace:false, width:"100%"});
	
	//var sizeControls = [];
	
	var textPositioning = gui.addFolder('textPositioning');
	controls.push(textPositioning.add(this.textPositioning, 'indent')); // this can go negative
	controls.push(textPositioning.add(this.textPositioning, 'lineHeight')); // this can go negative
	controls.push(textPositioning.add(this.textPositioning, 'textMargin')); // this can go negative
	controls.push(textPositioning.add(this.textPositioning, 'textAlign', ['left','center','right']));
	
	var textStyle = gui.addFolder('textStyle');
	controls.push(textStyle.add(this.textStyle, 'styles'));
	controls.push(textStyle.add(this.textStyle, 'fontSize').min(0));
	controls.push(textStyle.add(this.textStyle, 'fontFamily', ['serif', 'sans-serif']));
	controls.push(textStyle.add(this.textStyle, 'bold'));
	controls.push(textStyle.add(this.textStyle, 'italic'));
	controls.push(textStyle.addColor(this.textStyle, 'fill'));
	controls.push(textStyle.addColor(this.textStyle, 'stroke'));
	controls.push(textStyle.add(this.textStyle, 'lineWidth').min(0));
	
	var markerStyle = gui.addFolder('markerStyle');
	controls.push(markerStyle.add(this.markerStyle, 'shape', ['none','circle','square']));
	controls.push(markerStyle.add(this.markerStyle, 'diameter').min(0));
	
	// i think we need to call setSize after changing wd, and box only calls section.draw()
	this.box.addElements(gui, ['hAlign','vAlign','xAnchor','yAnchor','x','y','wd']);
	
	Griddl.Components.AddMarginElements(gui, this, this.margin);
	
	controls.forEach(function(control) {
		control.onChange(function(value) {
			comp.section.draw();
		});
	});
	
	this.div[0].appendChild(gui.domElement);
};
Text.prototype.parse = function() {
	
	// * foo
	//   * bar
	//   * baz
	// 
	// 1. foo
	// 2. bar
	// 3. baz
	
	// do we make people do their own numbering?  probably.  not a big deal.
	// do we insist on one space, or two spaces, or tabs, or do we let people define their own and detect?
	// and then what happens if people fuck up their indentation scheme?
	
	var lines = this.text.split('\n');
	
	this.data = [];
	
	for (var i = 0; i < lines.length; i++)
	{
		var line = lines[i];
		
		// this needs to allow for text without a leader - for Titles
		//var indent = /^\s+/.exec(line)[0].length; // count the number of spaces at the beginning of the line
		var indent = line.length - line.trimLeft().length; // count the number of spaces at the beginning of the line
		var rest = line.substr(indent);
		var leaderParts = /^(\*|[a-zA-Z0-9]+\.)/.exec(rest); // exec returns a list of strings - the first string is the entire match, and then subsequent strings are the group matches
		
		var leader = ((leaderParts != null) ? leaderParts[0] : '');
		var body = rest.substr(leader.length).trimLeft();
		var words = Wordize(body);
		
		this.data.push({indent:indent,leader:leader,body:body,words:words});
		
		// right now the period is required for alphanumeric leaders - the period is what signals the text as a list
		
		// 1foo - no
		// 1 foo - no (should this be interpreted as not a list?)
		// 1.foo - yes
		// 1. foo - yes
		// a foo - no (this will be interpreted as not a list)
		// a. foo - yes
		// *foo - yes
		// * foo - yes
		// (1) foo - yes? (need to implement alternative leaders
	}
};
Text.prototype.setSize = function() {
	
	// this.data is a list of {indent:2,leader:"1.",body:"foo bar",words:["foo","bar"],lines:null,tabStop:null,bt:null,pitch:null} objects
	
	var styles = ((this.textStyle.styles === "") ? null : this.textStyle.styles.split(',').map(x => x.trim()));
	
	var ctx = this.ctx;
	
	var maxLeaderWidth = 0;
	
	for (var i = 0; i < this.data.length; i++)
	{
		var indent = this.data[i].indent;
		var leader = this.data[i].leader;
		
		if (indent == 0)
		{
			if (styles) { Griddl.Components.SetStyle(ctx, styles[indent]); }
			if (this.textStyle.fontSize) { ctx.setFontSize(this.textStyle.fontSize); }
			if (this.textStyle.fontFamily) { ctx.setFont(this.textStyle.fontFamily, this.textStyle.bold, this.textStyle.italic); }
			
			if (leader.length > 0)
			{
				var leaderWidth = ctx.measureText(leader).width;
				maxLeaderWidth = Math.max(maxLeaderWidth, leaderWidth);
			}
		}
	}
	
	var firstTabStop = maxLeaderWidth;
	if (maxLeaderWidth > 0) { firstTabStop += this.textPositioning.textMargin / 2; } // if there are no leaders, we don't need a text margin
	
	var totalHeight = 0;
	
	for (var i = 0; i < this.data.length; i++)
	{
		var datum = this.data[i];
		
		var indent = datum.indent;
		var words = datum.words;
		
		var indentWidth = indent * this.textPositioning.indent;
		
		if (styles) { Griddl.Components.SetStyle(ctx, styles[datum.indent]); }
		if (this.textStyle.fontSize) { ctx.setFontSize(this.textStyle.fontSize); }
		if (this.textStyle.fontFamily) { ctx.setFont(this.textStyle.fontFamily, this.textStyle.bold, this.textStyle.italic); }
		
		var wordMetrics = words.map(function(word) { return ctx.measureText(word).width });
		var maxWordWidth = wordMetrics.reduce(function(a, b) { return Math.max(a, b); }, 0);
		
		this.box.wd = Math.max(this.box.wd, maxWordWidth); // adjust box width if there is a single word that is too big
		
		var availableWidth = this.box.wd;
		if (firstTabStop > 0) { availableWidth -= (firstTabStop + indentWidth + this.textPositioning.textMargin / 2); } // if there are leaders, adjust availableWidth
		
		datum.tabStop = firstTabStop + indentWidth;
		
		datum.lines = Griddl.Components.LinebreakNaive([availableWidth], words, wordMetrics, this.ctx.fontSizeCu * 0.30); // spaceWidth is pretty arbitrary
		
		var pitch = Math.max(this.textPositioning.lineHeight, this.ctx.fontSizeCu);
		
		datum.pitch = pitch;
		
		datum.bt = totalHeight + pitch;
		
		var height = datum.lines.length * pitch;
		
		totalHeight += height;
	}
	
	this.box.hg = totalHeight;
	this.box.align();
};
Text.prototype.draw = function() {
	
	var styles = ((this.textStyle.styles === "") ? null : this.textStyle.styles.split(',').map(x => x.trim()));
	
	var ctx = this.ctx;
	
	var {lf,tp} = this.box.rootCoordinates();
	
	for (var i = 0; i < this.data.length; i++)
	{
		var datum = this.data[i];
		
		if (styles) { Griddl.Components.SetStyle(ctx, styles[datum.indent]); }
		if (this.textStyle.fontSize) { ctx.setFontSize(this.textStyle.fontSize); }
		if (this.textStyle.fontFamily) { ctx.setFont(this.textStyle.fontFamily, this.textStyle.bold, this.textStyle.italic); }
		if (this.textStyle.fill) { ctx.fillStyle = this.textStyle.fill; }
		if (this.textStyle.stroke) { ctx.strokeStyle = this.textStyle.stroke; }
		if (this.textStyle.lineWidth) { ctx.lineWidth = this.textStyle.lineWidth; }
		
		if (datum.leader == '')
		{
			
		}
		else if (datum.leader == '*')
		{
			if (this.markerStyle.shape == 'circle')
			{
				var cx = lf + datum.tabStop - this.textPositioning.textMargin / 2 - this.markerStyle.diameter / 2;
				var cy = tp + datum.bt - datum.pitch / 2;
				var r = this.markerStyle.diameter / 2;
				this.ctx.fillCircle(cx, cy, r);
			}
			else if (this.markerStyle.shape == 'square')
			{
				var markerlf = lf + datum.tabStop - this.textPositioning.textMargin / 2 - this.markerStyle.diameter;
				var markertp = tp + datum.bt - datum.pitch / 2 - this.markerStyle.diameter / 2;
				var wd = this.markerStyle.diameter;
				var hg = this.markerStyle.diameter;
				this.ctx.fillRect(markerlf, markertp, wd, hg);
			}
		}
		else
		{
			ctx.textAlign = 'right';
			ctx.fillText(datum.leader, lf + datum.tabStop - this.textPositioning.textMargin / 2, tp + datum.bt);
		}
		
		for (var k = 0; k < datum.lines.length; k++)
		{
			var x = null;
			var y = tp + datum.bt + datum.pitch * k;
			
			if (this.textPositioning.textAlign == 'left')
			{
				x = lf + datum.tabStop + this.textPositioning.textMargin / 2;
			}
			else if (this.textPositioning.textAlign == 'center')
			{
				// not sure what to do
			}
			else if (this.textPositioning.textAlign == 'right')
			{
				// not sure what to do
			}
			else
			{
				throw new Error();
			}
			
			ctx.textAlign = this.textPositioning.textAlign;
			ctx.fillText(datum.lines[k], x, y);
		}
	}
};
Text.prototype.write = function() {
	
	var json = {};
	json.type = this.type;
	json.name = this.name;
	json.visible = this.visible;
	json.text = this.text;
	json.params = {};
	json.params.x = this.box.x;
	json.params.y = this.box.y;
	json.params.hAlign = this.box.hAlign;
	json.params.vAlign = this.box.vAlign;
	json.params.width = this.box.wd;
	json.params.pitch = this.pitch;
	json.params.indent = this.textPositioning.indent;
	json.params.styles = this.styles;
	json.params.font = this.font;
	json.params.fill = this.fill;
	json.params.textMargin = this.textPositioning.textMargin
	json.params.markerStyle = this.markerStyle;
	json.params.markerDiameter = this.markerDiameter;
	json.params.margin = {};
	json.params.margin.top = this.margin.top;
	json.params.margin.left = this.margin.left;
	json.params.margin.right = this.margin.right;
	json.params.margin.bottom = this.margin.bottom;
	return json;
};

//Text.prototype.onhover = function() { this.box.onhover(); };
//Text.prototype.dehover = function() { this.ctx.canvas.style.cursor = 'default'; };
Text.prototype.onhover = Griddl.Components.OnHover;
Text.prototype.dehover = Griddl.Components.DeHover;
Text.prototype.onmousemove = Griddl.Components.OnMouseMove;
Text.prototype.onmousemove2 = function(e) {
	
	// this sets up a text styling popup - a combination of direct and indirect manipulation - click directly on the text, get a popup with HTML inputs
	// of course how would you specify font/bold/italic/color directly?  difficult to impossible
	// so indirect has to be involved at some point - the question is how important is it for the indirect to be accessible by clicking on the text?
	// or like, could we just scroll to the relevant component, where the indirect inputs are located already?
	
	// it's not great to set these handlers on every mousemove, but right now that's what the box architecture has us do
	// the box checks for hovering over handles, and if not, kicks the mousemove event up to its parent widget
	// what we could do instead is call onhover/dehover on Text as the mouse goes over and out of handles
	
	var text = this;
	
	text.ctx.canvas.style.cursor = 'text';
	
	text.ctx.canvas.onmousedown = function(e) {
		
		document.getElementById('text-content-selector').value = text.text;
		
		// how do we remove the existing selected attrs?
		$('#font-selector' + text.fontFamily).attr('selected', 'selected');
		$('#font-size-selector' + text.fontSize).attr('selected', 'selected');
		
		// translate from rgb(0,0,0) to FFFFFF
		var ffffff = text.fill.substring(4, text.fill.length - 1).split(',').map(s => parseInt(s)).map(n => (((n < 16) ? '0' : '') + n.toString(16)).toUpperCase()).join('');
		document.getElementById('text-color-selector').value = ffffff;
		
		if (this.bold)
		{
			$('#bold-selector-off').removeAttr('checked');
			$('#bold-selector-on').attr('checked', ''); // how do we add an attr with no value?
		}
		else
		{
			$('#bold-selector-on').removeAttr('checked');
			$('#bold-selector-off').attr('checked', '');
		}
		
		if (this.italic)
		{
			$('#italic-selector-off').removeAttr('checked');
			$('#italic-selector-on').attr('checked', ''); // how do we add an attr with no value?
		}
		else
		{
			$('#italic-selector-on').removeAttr('checked');
			$('#italic-selector-off').attr('checked', '');
		}
		
		var alignmentDict = {top:{left:'TL',center:'TC',right:'TR'},center:{left:'CL',center:'CC',right:'CR'},bottom:{left:'BL',center:'BC',right:'BR'}};
		
		// how do we remove a checked attr?
		$('#alignment-selector-' + alignmentDict[this.hAlign][this.vAlign]).attr('checked', '');
		
		Griddl.UI.ShowTextStyle();
	};
	text.ctx.canvas.onmouseup = function(e) {
		text.ctx.canvas.onmousedown = null;
		text.ctx.canvas.onmouseup = null;
	};
};

function Wordize(text) {
	
	// copied from Section, but the stuff in Section remains because we might want to elaborate on the syntax
	// this simpler wordize algo should be used for stuff like titles and captions
	
	var words = [];
	var word = '';
	
	var k = 0;
	
	while (k < text.length)
	{
		var c = text[k];
		var n = c.charCodeAt();
		
		if (n == 32 || n == 9 || n == 13 || n == 10)
		{
			if (word.length > 0) { words.push(word); }
			word = '';
		}
		else
		{
			word += c;
		}
		
		k++;
	}
	
	if (word.length > 0)
	{
		words.push(word);
	}
	
	return words;
}

Griddl.Components.text = Text;

})();



