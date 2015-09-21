
(function () {

function thisModule() {

// variables here:
function Setup() {
	
	// note that the user-facing unit is arbitrary.  it's inches here, but it could be cm.  we just need to provide point/unit and pixel/unit conversions
	var pointsPerInch = 72;
	var pixelsPerInch = 106.666;
	var pixelsPerPoint = pixelsPerInch / pointsPerInch;
	
	var pageWidthInches = 8.5;
	var pageHeightInches = 11;
	var marginInches = 1;
	
	var pageWidth = pixelsPerInch * pageWidthInches;
	var pageHeight = pixelsPerInch * pageHeightInches;
	var margin = pixelsPerInch * marginInches;
	
	var outputDivName = 'output';
	
	ClearDiv(outputDivName);
	var g = SetupContext(outputDivName, pageWidth, pageHeight, pageWidth, pageHeight, false, pixelsPerPoint);
	
	// this snippet is fairly dumb, and is only here because i wanted to get rid of the id attr of the output canvas HTML
	// but i kept the button HTML.  what matters is that the id of the canvas and the id used by the button are the same
	// also note that this code puts the same id on every canvas on the page, which is obviously terrible
	// but all of this is because i still haven't figured out how to export multiple canvases to a zipped bunch of PNGs
	var elementIdUsedByButton = 'canvas'; // this is currently hardcoded in the button HTML - probably should be changed, but how?
	$('canvas').attr('id', elementIdUsedByButton); // to enable the Export to PNG button
	
	return g;
}
function ReplaceTextVariables(templateName, variablesName) {
	var vars = Griddl.GetData(variablesName);
	var text = Griddl.GetData(templateName);
	
	for (var i = 0; i < vars.length; i++)
	{
		var name = vars[i].name;
		var value = vars[i].value;
		
		while (text.search('@' + name) >= 0)
		{
			text = text.replace('@' + name, value);
		}
	}
	
	return text;
}

// essentially obsolete
function Subdivide(g, rect, command) {
	
	if (command.type == 'H')
	{
		var ypct = parseFloat(command.ypct) / 100.0;
		var y = Math.floor(rect.top + rect.height * ypct, 1) + 0.5;
		var toph = rect.height * ypct;
		var both = rect.height - toph;
		var a = {top:rect.top,left:rect.left,width:rect.width,height:toph};
		var b = {top:y,left:rect.left,width:rect.width,height:both};
		DrawLine(g, rect.left, y, rect.left + rect.width, y);
		return [a, b];
	}
	else if (command.type == 'V')
	{
		var xpct = parseFloat(command.xpct) / 100.0;
		var x = Math.floor(rect.left + rect.width * xpct, 1) + 0.5;
		var lfw = rect.width * xpct;
		var rtw = rect.width - lfw;
		var a = {top:rect.top,left:rect.left,width:lfw,height:rect.height};
		var b = {top:rect.top,left:x,width:rtw,height:rect.height};
		DrawLine(g, x, rect.top, x, rect.top + rect.height);
		return [a, b];
	}
}
function Layout(g, commandsName) {
	// commands:
	//	type	parent	xpct	ypct	cnType1	cnObj1	cnType2	cnObj2
	//0	H			20			text	template
	//1	V	0.0	30		text	template	text	template
	
	var commands = Griddl.GetData(commandsName);
	var subrects = []
	
	for (var i = 0; i < commands.length; i++)
	{
		var cmd = commands[i];
		
		var rect = null;
		
		if (cmd.parent)
		{
			var parentrect = parseInt(cmd.parent.split('.')[0]);
			var subdivision = parseInt(cmd.parent.split('.')[1]);
			rect = subrects[parentrect][subdivision];
		}
		else
		{
			rect = {top:0,left:0,width:g.width,height:g.height};
		} 
		
		var subrect = Subdivide(g, rect, cmd);
		subrects.push(subrect);
	}
	
	return subrects;
}
function Multiline() {

var g = Setup();

ReplaceTextVariables('template', 'variables');

var flat = [500];
var lineWidths = [];
var fullLineWidth = pageWidth - margin - margin;
for (var i = 0; i < 5; i++) { lineWidths.push(fullLineWidth); }
for (var i = 0; i < 16; i++) { lineWidths.push(250); }
for (var i = 0; i < 10; i++) { lineWidths.push(fullLineWidth); }
//SetFont(g, 'Arial', 18, 'px');
SetFont(g, 'Times New Roman', 18, 'px');
TypesetAlign(g, margin, margin, text, 'justify', lineWidths, 3, false);
DrawChart(g, 'bar', 'chart1Params', 'chart1Data', 'chart1Key', 'chart1AdditionalText');
DrawImage(g, 'image1', 10, 10);
FinalizeGraphics([g]);


}

var Layout = {};
Layout.Setup = Setup;
Layout.ReplaceTextVariables = ReplaceTextVariables;
return Layout;

}

if (typeof define === "function" && define.amd) {
	define(thisModule);
} else if (typeof module !== 'undefined' && module.exports) {
	module.exports = thisModule();
} else {
	this.Layout = thisModule();
}

})();

