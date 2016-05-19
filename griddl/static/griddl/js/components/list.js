
(function() {

// Title is just a special case of a List, and forget Captions
// indeed, we should keep the basic List code and just rename it Text (well, Text is already in use.  something else) (it can also do math)

var Title = function(json) {
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.style = json.params.style ? json.params.style : null;
	this.font = json.params.font ? json.params.font : '10pt serif';
	this.stroke = json.params.stroke ? json.params.stroke : 'rgb(0,0,0)';
	this.fill = json.params.fill ? json.params.fill : 'rgb(0,0,0)';
	this.lineWidth = json.params.lineWidth ? json.params.lineWidth : 1;
	this.pitch = json.params.pitch;
	
	this.text = json.text;
	this.words = null;
	this.parse();
	
	this.data = null;
	
	this.div = null;
	this.ctx = null;
	
	this.input = null;
	
	// if the text is standalone, the Box should be moveable.  if the text is bound to e.g. a chart, the Box should be immovable
	this.box = new Griddl.Components.Box(this, true);
	this.box.x = json.params.x;
	this.box.y = json.params.y;
	this.box.hAlign = json.params.hAlign;
	this.box.vAlign = json.params.vAlign;
	this.box.wd = json.params.width;
	
	this.margin = {};
	this.margin.tp = json.params.margin.top;
	this.margin.lf = json.params.margin.left;
	this.margin.rt = json.params.margin.right;
	this.margin.bt = json.params.margin.bottom;
};
Title.prototype.parse = function() {
	
	this.words = Wordize(this.text);
	
};
Title.prototype.add = function() {
	
	this.addElements();
	this.refresh();
};
Title.prototype.addElementsOld = function() {
	
	var comp = this;
	var table, tr, td;
	
	this.textInput = $('<input type="text" size="50"></input>');
	this.textInput[0].onchange = function() { comp.text = this.value; };
	this.div.append(this.textInput);
	
	
	this.div.append($('<hr />'));
	
	
	this.styleInput = $('<input type="text"></input>');
	this.fontInput = $('<input type="text"></input>');
	this.fillInput = $('<input class="jscolor" value="000000"></input>');
	this.strokeInput = $('<input class="jscolor" value="000000"></input>');
	this.lineWidthInput = $('<input type="text"></input>');
	this.pitchInput = $('<input type="text"></input>');
	
	this.styleInput[0].onchange = function(e) { comp.style = this.value; };
	this.fontInput[0].onchange = function(e) { comp.font = this.value; };
	this.fillInput[0].onchange = function(e) { comp.fill = this.value; };
	this.strokeInput[0].onchange = function(e) { comp.stroke = this.value; };
	this.lineWidthInput[0].onchange = function(e) { comp.lineWidth = parseFloat(this.value); };
	this.pitchInput[0].onchange = function(e) { comp.pitch = parseFloat(this.value); };
	
	table = $('<table></table>');
	table.append($('<tr><td colspan="2" style="font-weight:bold">Text style</td></tr>'));
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">style</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.styleInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">font</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.fontInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">fill</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.fillInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">stroke</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.strokeInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">line width</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.lineWidthInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">pitch</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.pitchInput);
	this.div.append(table);
	
	
	this.div.append($('<hr />'));
	
	
	this.xInput = $('<input type="text"></input>');
	this.yInput = $('<input type="text"></input>');
	this.widthInput = $('<input type="text"></input>');
	this.hAlignInput = $('<select><option>left</option><option>center</option><option>right</option></select>');
	this.vAlignInput = $('<select><option>top</option><option>middle</option><option>bottom</option></select>');
	
	this.xInput[0].onchange = function() { comp.box.x = this.value; comp.box.align(); };
	this.yInput[0].onchange = function(e) { comp.box.y = this.value; comp.box.align(); };
	this.widthInput[0].onchange = function(e) { comp.box.width = this.value; /*parse*/ comp.box.align(); };
	this.hAlignInput[0].onchange = function(e) { comp.box.hAlign = this.value; comp.box.align(); };
	this.vAlignInput[0].onchange = function(e) { comp.box.vAlign = this.value; comp.box.align(); };
	
	table = $('<table></table>');
	table.append($('<tr><td colspan="2" style="font-weight:bold">Positioning</td></tr>'));
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">x</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.xInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">y</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.yInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">width</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.widthInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">hAlign</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.hAlignInput);
	tr = $('<tr></tr>'); table.append(tr); tr.append($('<td style="text-align:right">vAlign</td>')); td = $('<td></td>'); tr.append(td);
	td.append(this.vAlignInput);
	this.div.append(table);
};
Title.prototype.addElements = function() {
	
	var comp = this;
	
	this.textInput = $('<input type="text" size="50"></input>');
	this.textInput[0].onchange = function() { comp.text = this.value; };
	this.div.append(this.textInput);
	
	this.div.append($('<hr />'));
	
	var gui = new dat.GUI({autoPlace:false});
	gui.add(this.box, 'x');
	gui.add(this.box, 'y');
	gui.add(this.box, 'wd');
	gui.add(this.box, 'hAlign', ['left','center','right']);
	gui.add(this.box, 'vAlign', ['top','center','bottom']);
	
	this.div[0].appendChild(gui.domElement);
	
	this.div.append($('<hr />'));
	
	var gui = new dat.GUI({autoPlace:false});
	//gui.add(this, 'style');
	gui.add(this, 'font');
	gui.addColor(this, 'fill');
	//gui.addColor(this, 'stroke');
	//gui.add(this, 'lineWidth');
	gui.add(this, 'pitch');
	
	var margin = gui.addFolder('margin');
	margin.add(this.margin, 'lf');
	margin.add(this.margin, 'rt');
	margin.add(this.margin, 'tp');
	margin.add(this.margin, 'bt');
	
	this.div[0].appendChild(gui.domElement);
};
Title.prototype.refresh = function() {
	
	this.textInput[0].value = this.text;
	//this.styleInput[0].value = this.style;
	//this.fontInput[0].value = this.font;
	//this.fillInput[0].value = this.fill;
	//this.strokeInput[0].value = this.stroke;
	//this.lineWidthInput[0].value = this.lineWidth;
	//this.pitchInput[0].value = this.pitch;
};
Title.prototype.setSize = function() {
	
	var ctx = this.ctx;
	
	if (this.style) { ctx.SetStyle(this.style); }
	if (this.font) { ctx.font = this.font; }
	
	var wordMetrics = this.words.map(function(word) { return ctx.measureText(word).width });
	var maxWordWidth = wordMetrics.reduce(function(a, b) { return Math.max(a, b); });
	
	this.box.wd = Math.max(this.box.wd, maxWordWidth);
	
	var lines = Griddl.Components.LinebreakNaive([this.box.wd], this.words, wordMetrics, this.ctx.fontSizeCu * .75); // spaceWidth is pretty arbitrary
	
	this.pitch = Math.max(this.pitch, this.ctx.fontSizeCu);
	
	this.box.hg = lines.length * this.pitch;
	this.box.align();
};
Title.prototype.draw = function() {
	
	var ctx = this.ctx;
	
	ctx.Save();
	
	if (this.style) { ctx.SetStyle(this.style); }
	if (this.font) { ctx.font = this.font; }
	
	if (this.stroke) { ctx.strokeStyle = this.stroke; }
	if (this.fill) { ctx.fillStyle = this.fill; }
	if (this.lineWidth) { ctx.lineWidth = this.lineWidth; }
	
	ctx.textAlign = this.box.hAlign;
	ctx.textBaseline = ((this.box.vAlign == 'center') ? 'middle' : this.box.vAlign);
	
	ctx.fillText(this.text, this.box.x, this.box.y);
	
	ctx.Restore();
};
Title.prototype.onhover = function() {
	this.box.onhover();
	
};
Title.prototype.dehover = function() {
	this.ctx.canvas.style.cursor = 'default';
};
Title.prototype.onmousemove = function(e) {
	
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
		var ffffff = text.fillStyle.substring(4, text.fillStyle.length - 1).split(',').map(s => parseInt(s)).map(n => (((n < 16) ? '0' : '') + n.toString(16)).toUpperCase()).join('');
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
Title.prototype.write = function() {
	
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
	json.params.style = this.style;
	json.params.font = this.font;
	json.params.stroke = this.stroke;
	json.params.fill = this.fill;
	json.params.lineWidth = this.lineWidth;
	json.params.pitch = this.pitch;
	json.params.margin = {};
	json.params.margin.top = this.margin.tp;
	json.params.margin.left = this.margin.lf;
	json.params.margin.right = this.margin.rt;
	json.params.margin.bottom = this.margin.bt;
	return json;
};
Title.New = function() {
	
	// we need some knowledge of the units and scale to set reasonable initial values for the coordinates
	
	var json = {};
	json.type = 'title';
	json.name = UniqueName('title', 1);
	json.visible = true;
	json.text = 'Title';
	json.params = {};
	json.params.x = 0;
	json.params.y = 0;
	json.params.hAlign = 'center';
	json.params.vAlign = 'center';
	json.params.width = 200;
	json.params.style = null;
	json.params.font = '36pt serif';
	json.params.stroke = 'rgb(0,0,0)';
	json.params.fill = 'rgb(0,0,0)';
	json.params.lineWidth = 1;
	json.params.pitch = 50;
	return json;
};

var List = function(json) {
	
	// text	left	dy	style	bulType	bulSize
	// major1	40	200	basic	circle	6
	// minor1	80	30	basic	circle	3
	// subminor1	120	30	basic	circle	2
	// major2	40	30	basic	circle	6
	// minor2	80	30	basic	circle	3
	
	this.type = json.type;
	this.name = json.name;
	this.visible = json.visible;
	
	this.text = json.text;
	this.data = null;
	this.parse(); // fill this.data by parsing this.text
	
	this.div = null;
	
	this.ctx = null;
	
	// comma-separated list, applies to each respective indentation level - parsed in setSize and draw, because we want to edit it as a sting
	this.styles = json.params.styles;
	
	this.font = json.params.font;
	this.fill = json.params.fill;
	this.pitch = json.params.pitch;
	this.indent = json.params.indent;
	
	this.textMargin = json.params.textMargin
	this.markerStyle = json.params.markerStyle; // 'none' , 'circle' , 'square' , etc.
	this.markerDiameter = json.params.markerDiameter;
	
	this.box = new Griddl.Components.Box(this, true);
	this.box.x = json.params.x;
	this.box.y = json.params.y;
	this.box.hAlign = json.params.hAlign;
	this.box.vAlign = json.params.vAlign;
	this.box.wd = json.params.width;
	
	this.margin = {};
	this.margin.tp = json.params.margin.top;
	this.margin.lf = json.params.margin.left;
	this.margin.rt = json.params.margin.right;
	this.margin.bt = json.params.margin.bottom;
};
List.prototype.parse = function() {
	
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
		//var indent = /^\s+/.exec(line)[0].length; // count the number of spaces at the beginning of the line
		var indent = line.length - line.trimLeft().length; // count the number of spaces at the beginning of the line
		var rest = line.substr(indent);
		var leaderParts = /(\*|[a-zA-Z0-9]+\.?)/.exec(rest); // exec returns a list of strings - the first string is the entire match, and then subsequent strings are the group matches
		var leader = leaderParts[0];
		var body = rest.substr(leader.length).trimLeft();
		var words = Wordize(body);
		
		this.data.push({indent:indent,leader:leader,body:body,words:words});
		
		// period is optional
		// whitespace after period is optional
		// must be either, can be both
		
		// 1foo - no
		// 1 foo - yes
		// 1.foo - yes
		// 1. foo - yes
		// *foo - yes
		// * foo - yes
	}
};
List.prototype.setSize = function() {
	
	// this.data is a list of {indent:2,leader:"1.",body:"foo bar",words:["foo","bar"],lines:null,tabStop:null,bt:null,pitch:null} objects
	
	var styles = ((this.styles === "") ? null : this.styles.split(',').map(x => x.trim()));
	
	var ctx = this.ctx;
	
	var maxLeaderWidth = 0;
	
	for (var i = 0; i < this.data.length; i++)
	{
		var indent = this.data[i].indent;
		var leader = this.data[i].leader;
		
		if (indent == 0)
		{
			if (styles) { ctx.SetStyle(styles[indent]); }
			if (this.font) { ctx.font = this.font; }
			var leaderWidth = ctx.measureText(leader).width;
			maxLeaderWidth = Math.max(maxLeaderWidth, leaderWidth);
		}
	}
	
	var firstTabStop = maxLeaderWidth + this.textMargin / 2;
	
	var totalHeight = 0;
	
	for (var i = 0; i < this.data.length; i++)
	{
		var datum = this.data[i];
		
		var indent = datum.indent;
		var words = datum.words;
		
		var indentWidth = indent * this.indent;
		
		if (styles) { ctx.SetStyle(styles[datum.indent]); }
		if (this.font) { ctx.font = this.font; }
		
		var wordMetrics = words.map(function(word) { return ctx.measureText(word).width });
		var maxWordWidth = wordMetrics.reduce(function(a, b) { return Math.max(a, b); });
		
		var availableWidth = this.box.wd - (firstTabStop + indentWidth + this.textMargin / 2);
		datum.tabStop = firstTabStop + indentWidth;
		
		//this.box.wd = Math.max(this.box.wd, maxWordWidth); // adjust box width if there is a single word that is too big
		
		var lines = Griddl.Components.LinebreakNaive([availableWidth], words, wordMetrics, this.ctx.fontSizeCu * .75); // spaceWidth is pretty arbitrary
		datum.lines = lines;
		
		var pitch = Math.max(this.pitch, this.ctx.fontSizeCu);
		
		datum.pitch = pitch;
		
		datum.bt = totalHeight + pitch;
		
		var height = lines.length * pitch;
		
		totalHeight += height;
	}
	
	this.box.hg = totalHeight;
	this.box.align();
};
List.prototype.add = function() {
	
	this.addElements();
	this.refresh();
};
List.prototype.addElements = function() {
	
	var comp = this;
	
	comp.textarea = $('<textarea></textarea>');
	comp.div.append(comp.textarea);
	comp.codemirror = CodeMirror.fromTextArea(comp.textarea[0], { mode : 'plain' , smartIndent : false , lineNumbers : true , lineWrapping : true });
	comp.codemirror.on('blur', function() { comp.text = comp.codemirror.getValue(); comp.parse();  });
	comp.codemirror.on('change', function() { Griddl.Components.MarkDirty(); });
	
	this.div.append($('<hr />'));
	
	var gui = new dat.GUI({autoPlace:false});
	gui.add(this.box, 'x');
	gui.add(this.box, 'y');
	gui.add(this.box, 'wd');
	gui.add(this.box, 'hAlign', ['left','center','right']);
	gui.add(this.box, 'vAlign', ['top','center','bottom']);
	
	this.div[0].appendChild(gui.domElement);
	
	this.div.append($('<hr />'));
	
	var gui = new dat.GUI({autoPlace:false});
	gui.add(this, 'styles');
	gui.add(this, 'font');
	gui.addColor(this, 'fill');
	gui.add(this, 'pitch');
	gui.add(this, 'indent');
	gui.add(this, 'textMargin');
	gui.add(this, 'markerStyle', ['none','circle','square']);
	gui.add(this, 'markerDiameter');
	
	var margin = gui.addFolder('margin');
	margin.add(this.margin, 'lf');
	margin.add(this.margin, 'rt');
	margin.add(this.margin, 'tp');
	margin.add(this.margin, 'bt');
	
	this.div[0].appendChild(gui.domElement);
};
List.prototype.refresh = function() {
	this.codemirror.getDoc().setValue(this.text);
};
List.prototype.draw = function() {
	
	var styles = ((this.styles === "") ? null : this.styles.split(',').map(x => x.trim()));
	
	var ctx = this.ctx;
	
	for (var i = 0; i < this.data.length; i++)
	{
		var datum = this.data[i];
		
		if (styles) { ctx.SetStyle(styles[this.data[i].indent]); }
		if (this.font) { ctx.font = this.font; }
		ctx.fillStyle = this.fill;
		
		if (datum.leader == '*')
		{
			if (this.markerStyle == 'circle')
			{
				var cx = this.box.lf + datum.tabStop - this.textMargin / 2 - this.markerDiameter / 2;
				var cy = this.box.tp + datum.bt - datum.pitch / 2;
				var r = this.markerDiameter / 2;
				this.ctx.fillCircle(cx, cy, r);
			}
			else if (this.markerStyle == 'square')
			{
				var lf = this.box.lf + datum.tabStop - this.textMargin / 2 - this.markerDiameter;
				var tp = this.box.tp + datum.bt - datum.pitch / 2 - this.markerDiameter / 2;
				var wd = this.markerDiameter;
				var hg = this.markerDiameter;
				this.ctx.fillRect(lf, tp, wd, hg);
			}
		}
		else
		{
			ctx.textAlign = 'right';
			ctx.fillText(datum.leader, this.box.lf + datum.tabStop - this.textMargin / 2, this.box.tp + datum.bt);
		}
		
		for (var k = 0; k < datum.lines.length; k++)
		{
			ctx.textAlign = 'left';
			ctx.fillText(datum.lines[k], this.box.lf + datum.tabStop + this.textMargin / 2, this.box.tp + datum.bt + datum.pitch * k);
		}
	}
};
List.prototype.write = function() {
	
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
	json.params.width = this.width;
	json.params.pitch = this.pitch;
	json.params.indent = this.indent;
	json.params.styles = this.styles;
	json.params.font = this.font;
	json.params.fill = this.fill;
	json.params.textMargin = this.textMargin
	json.params.markerStyle = this.markerStyle;
	json.params.markerDiameter = this.markerDiameter;
	json.params.margin = {};
	json.params.margin.top = this.margin.tp;
	json.params.margin.left = this.margin.lf;
	json.params.margin.right = this.margin.rt;
	json.params.margin.bottom = this.margin.bt;
	return json;
};
List.New = function() {
	
	var json = {};
	json.type = 'list';
	json.name = UniqueName('list', 1);
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
	return json;
};

List.prototype.onhover = Griddl.Components.OnHover;
List.prototype.dehover = Griddl.Components.DeHover;
List.prototype.onmousemove = Griddl.Components.OnMouseMove;

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

Griddl.Components.title = Title;
Griddl.Components.list = List;

})();

