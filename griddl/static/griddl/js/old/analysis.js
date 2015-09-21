
function Main(query) {
	globals.samplesPerSecond = 44100;
	globals.secondsPerMinute = 60;
	globals.drawRed = true;
	globals.drawBlack = true;
	LoadMusicModule(globals);
	$.ajax({ url : globals.query.file , dataType : "json" , success : MakeAnalysis });
}

// https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Using_HTML5_audio_and_video
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio

// var song = $('audio').get(0);

// <audio> fields:
// bool autoplay
// TimeRanges buffered
//   int length
//   function start
//   function end
// float duration (in seconds)
// function play()
// function pause()
// bool paused
// TimeRanges seekable
//   int length
//   function start
//   function end
// float currentTime
// string currentSrc
// TimeRanges played
//   int length
//   function start
//   function end

function FourierAnalysis(pcms, start, length, lowFreq, highFreq, freqStep) {
	var matrix = [];
	var freq = lowFreq;
	
	while (freq < highFreq)
	{
		var freqInSamples = freq / 44100; // 'freq' is in cycles
		var window = Math.floor(1 / freqInSamples) + 1;
		var row = [];
		
		var sins = new Array(window);
		
		for (var k = 0; k < window; k++)
		{
			sins[k] = Math.sin(freqInSamples * k);
		}
		
		for (var i = 0; i < length; i += 5) // 5
		{
			var sum = 0;
			
			for (var k = 0; k < window; k++)
			{
				var product = pcms[start + i + k] * sins[k];
				sum += product;
			}
			
			sum /= window;
			sum = Math.floor(sum);
			
			row.push(sum);
		}
		
		matrix.push(row);
		freq += freqStep;
	}
	
	return matrix;
}

var startInSeconds = 27.8;
var lengthInSeconds = 0.1;
var startInSamples = startInSeconds * 44100;
var lengthInSamples = lengthInSeconds * 44100;
var lowFreq = 220;
var highFreq = 880;
var freqStep = 1;
var fs = require('fs');
var x = fs.readFileSync('public/music/So+Many+Details.wav');
var wav = ReadWav(x);
var pcms = wav.xs[0];
var result = FourierAnalysis(pcms, startInSamples, lengthInSamples, lowFreq, highFreq, freqStep);
console.log(result);

function PlayBlack() {
	var analysis = globals.analysis;
	var bpcms = analysis.black.pcms;
	var bpcmStart = GetVar(analysis.vars, 'blackStart');
	var blackLength = GetVar(analysis.vars, 'blackLength');
	debugger;
	PlaySound(bpcms);
}
function PlayRed() { PlaySound(globals.analysis.red.pcms); }
function SaveBlack() { SaveSampleLocal(globals.analysis.black.pcms); }
function SaveRed() { SaveSampleLocal(globals.analysis.black.pcms); }
function ToggleBlack() { globals.drawBlack = !globals.drawBlack; Redraw(); }
function ToggleRed() { globals.drawRed = !globals.drawRed; Redraw(); }
function ClearCanvas() { globals.ctx.clearRect(0, 0, globals.canvas.width, globals.canvas.height); }
function Subtract() {
	// save red sample: { url:'red0.wav' , fntext:'' , pcms:[] }
	
	for (var i = 0; i < globals.analysis.black.pcms.length; i++)
	{
		globals.analysis.black.pcms[i] -= globals.analysis.red.pcms[i];
	}
	
	ClearCanvas();
	Redraw();
}
function GetVar(listOfKeyvals, key) {
	for (var i = 0; i < listOfKeyvals.length; i++)
	{
		if (listOfKeyvals[i].key == key)
		{
			return listOfKeyvals[i].val;
		}
	}
}
function Keyvals2Pojo(listOfKeyvals) {
	var pojo = {};
	for (var i = 0; i < listOfKeyvals.length; i++)
	{
		pojo[listOfKeyvals[i].key] = listOfKeyvals[i].val;
	}
	return pojo;
}
function Redraw() {
	var analysis = globals.analysis;
	var fn = new Function('args', analysis.red.text);
	analysis.red.pcms = fn(Keyvals2Pojo(analysis.vars));
	
	var bpcms = analysis.black.pcms;
	//var bpcmStart = 0;
	//var bpcmLength = bpcms.length;
	var bpcmStart = GetVar(analysis.vars, 'blackStart');
	var blackLength = GetVar(analysis.vars, 'blackLength');
	var bpcmLength = (blackLength == 'length') ? bpcms.length : blackLength;
	
	var rpcms = analysis.red.pcms;
	if (!rpcms) { return; }
	var rpcmStart = 0;
	var rpcmLength = rpcms.length;
	
	var left = 5;
	var cy = 150;
	var xPixelsPerStep = GetVar(analysis.vars, 'xPixelsPerStep');
	var samplesPerStep = GetVar(analysis.vars, 'samplesPerStep');
	var pcmsPerYPixel = GetVar(analysis.vars, 'pcmsPerYPixel')
	
	//ctx.clearRect(0, 0, ctx.width, ctx.height);
	ClearCanvas();
	
	if (globals.drawBlack)
	{
		DrawWave2(globals.ctx, 'rgb(000,000,000)', bpcms, bpcmStart, bpcmLength, left, cy, xPixelsPerStep, samplesPerStep, pcmsPerYPixel);
	}
	
	if (globals.drawRed)
	{
		DrawWave2(globals.ctx, 'rgb(255,000,000)', rpcms, rpcmStart, rpcmLength, left, cy, xPixelsPerStep, samplesPerStep, pcmsPerYPixel);
	}
}
function StopPropagation(e) { e.stopPropagation(); }
function Template(obj) {
	var body = $('body');
	
	for (var i = 0; i < obj.length; i++)
	{
		var x = obj[i];
		TemplateRec(body, x);
		

	}
}
function TemplateRec(parent, obj) {
	var tag = $(document.createElement(obj.tag));
	parent.append(tag);
	for (var key in obj.attrs) { tag.attrs(key, obj.attrs[key]); }
	for (var key in obj.css) { tag.css(key, obj.css[key]); }
	for (var k = 0; k < obj.children.length; k++) { TemplateRec(obj, obj.children[k]); }
	
	for (var k = 0; k < obj.functions.length; k++)
	{
		var fn = obj.functions[i];
		var name = fn.name;
		var args = fn.args;
		
		// handling the args here is tricky
		if (name == 'on') { obj.on(args.key, eval(args.fn)); }
		else if (name == 'handsontable') { obj.handsontable(args); }
		else if (name == 'draggable') { obj.draggable(); }
	}
}
function MakeAnalysis(analysis) {
	
	globals.analysis = analysis;
	
	LoadMenubar(analysis.menubar);
	
	var canvasDiv = $(document.createElement('div'));
	canvasDiv.css('position', 'absolute');
	canvasDiv.css('top', '5em');
	canvasDiv.css('left', '1em');
	canvasDiv.css('width', '50em');
	canvasDiv.css('overflow-x', 'scroll');
	canvasDiv.css('padding', '1em');
	canvasDiv.css('border', '1px solid black');
	canvasDiv.draggable();
	$('body').append(canvasDiv);
	
	// a playable .wav *is* an <audio>, possibly in a draggable div
	
	var canvas = $(document.createElement('canvas'));
	canvas.attr('width', '20000');
	canvas.attr('height', '300');
	canvas.css('border', '1px solid #c3c3c3');
	canvasDiv.append(canvas);
	
	globals.canvas = canvas[0];
	globals.ctx = canvas[0].getContext("2d");
	
	var textboxDiv = $(document.createElement('div'));
	textboxDiv.css('position', 'absolute');
	textboxDiv.css('top', '4em');
	textboxDiv.css('left', '55em');
	textboxDiv.css('padding', '1em');
	textboxDiv.css('border', '1px solid black');
	textboxDiv.draggable();
	$('body').append(textboxDiv);
	
	var textbox = $(document.createElement('textarea'));
	textbox.css('width', '50em');
	textbox.css('height', '30em');
	textbox.css('font', '10pt Courier New');
	//$.ajax({dataType: "text", url: sc.link, success: function(text) { sc.text = text; $textbox.html(text); }});
	textboxDiv.append(textbox);
	
	var spinnerDiv = $(document.createElement('div'));
	spinnerDiv.css('position', 'absolute');
	spinnerDiv.css('top', '29em');
	spinnerDiv.css('left', '1em');
	spinnerDiv.css('padding', '1em');
	spinnerDiv.css('border', '1px solid black');
	spinnerDiv.draggable();
	$('body').append(spinnerDiv);
	
	var tableDiv = $(document.createElement('div'));
	spinnerDiv.append(tableDiv);
	tableDiv.on('mousedown', function(e) { e.stopPropagation(); }); // this is the purpose of the tablediv
	tableDiv.handsontable({ data : analysis.vars });
	
	// if the text is stored in the same file (encoded in base64 in the 'text' field), decode.  if the text is in an external file (a 'link' field), load it
	if (analysis.red.text)
	{
		analysis.red.text = atob(analysis.red.text);
		textbox.html(analysis.red.text);
		//Redraw();
	}
	else
	{
		$.ajax({url : analysis.red.link , dataType : "text" , success : function(text) {
			analysis.red.text = text;
			textbox.html(text);
			//Redraw();
		}});
	}
	
	// override vars in the .json file with the vars in the query
	for (var key in globals.query)
	{
		globals.analysis.vars[key] = globals.query[key];
	}
	
	if (globals.analysis.blackLink) { LoadRemoteBytes(globals.analysis.blackLink, LoadWav(globals.analysis.black)); }
	
	textbox.on('blur', function(e) {
		analysis.red.text = textbox[0].value;
		Redraw();
	});
	
	setTimeout(Redraw, 2000); // we actually want to draw after all parts have been loaded - this requires the asyn stuff
}
function LoadWav(samp) {
	return function(responseBytes) {
		var wav = ReadWav(responseBytes);
		samp.pcms = wav.xs[0]; // we specifically avoid serializing keys named 'pcms'
		//Redraw();
	};
}
function LoadRemoteBytes(url, callback) {
	var xmlhttp = null;
	
	if (window.XMLHttpRequest) // code for IE7+, Firefox, Chrome, Opera, Safari
	{
		xmlhttp = new XMLHttpRequest();
	}
	else // code for IE6, IE5
	{
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	xmlhttp.responseType = "arraybuffer";
	
	xmlhttp.onreadystatechange = function()
	{
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
		{
			var arrayBuffer = xmlhttp.response; // note: not 'responseText'
			var byteArray = new Uint8Array(arrayBuffer);
			callback(byteArray);
		}
	};
	
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}
function ReadWav(x) {
	var wav = {};
	
	var c = 0;
	
	wav.riffChunkId = "";
	wav.riffChunkId += String.fromCharCode(x[c++]);
	wav.riffChunkId += String.fromCharCode(x[c++]);
	wav.riffChunkId += String.fromCharCode(x[c++]);
	wav.riffChunkId += String.fromCharCode(x[c++]);
	wav.riffChunkSize = 0;
	wav.riffChunkSize += x[c++];
	wav.riffChunkSize += x[c++] * 256;
	wav.riffChunkSize += x[c++] * 256 * 256;
	wav.riffChunkSize += x[c++] * 256 * 256 * 256;
	wav.wave = "";
	wav.wave += String.fromCharCode(x[c++]);
	wav.wave += String.fromCharCode(x[c++]);
	wav.wave += String.fromCharCode(x[c++]);
	wav.wave += String.fromCharCode(x[c++]);
	wav.formatChunkId = "";
	wav.formatChunkId += String.fromCharCode(x[c++]);
	wav.formatChunkId += String.fromCharCode(x[c++]);
	wav.formatChunkId += String.fromCharCode(x[c++]);
	wav.formatChunkId += String.fromCharCode(x[c++]);
	wav.formatChunkSize = 0;
	wav.formatChunkSize += x[c++];
	wav.formatChunkSize += x[c++] * 256;
	wav.formatChunkSize += x[c++] * 256 * 256;
	wav.formatChunkSize += x[c++] * 256 * 256 * 256;
	wav.formatTag = 0;
	wav.formatTag += x[c++];
	wav.formatTag += x[c++] * 256;
	wav.nChannels = 0;
	wav.nChannels += x[c++];
	wav.nChannels += x[c++] * 256;
	wav.nSamplesPerSec = 0;
	wav.nSamplesPerSec += x[c++];
	wav.nSamplesPerSec += x[c++] * 256;
	wav.nSamplesPerSec += x[c++] * 256 * 256;
	wav.nSamplesPerSec += x[c++] * 256 * 256 * 256;
	wav.nAvgBytesPerSec = 0;
	wav.nAvgBytesPerSec += x[c++];
	wav.nAvgBytesPerSec += x[c++] * 256;
	wav.nAvgBytesPerSec += x[c++] * 256 * 256;
	wav.nAvgBytesPerSec += x[c++] * 256 * 256 * 256;
	wav.nBlockAlign = 0;
	wav.nBlockAlign += x[c++];
	wav.nBlockAlign += x[c++] * 256;
	wav.nBitsPerSample = 0;
	wav.nBitsPerSample += x[c++];
	wav.nBitsPerSample += x[c++] * 256;
	
	for (var i = 0; i < wav.formatChunkSize - 16; i++) // sometimes formatChunkSize is 18
	{
		c++;
	}
	
	wav.dataChunkId = "";
	wav.dataChunkId += String.fromCharCode(x[c++]);
	wav.dataChunkId += String.fromCharCode(x[c++]);
	wav.dataChunkId += String.fromCharCode(x[c++]);
	wav.dataChunkId += String.fromCharCode(x[c++]);
	wav.dataChunkSize = 0;
	wav.dataChunkSize += x[c++];
	wav.dataChunkSize += x[c++] * 256;
	wav.dataChunkSize += x[c++] * 256 * 256;
	wav.dataChunkSize += x[c++] * 256 * 256 * 256;
	
	while (wav.dataChunkId != "data") // i've seen "LIST" before
	{
		for (var i = 0; i < wav.dataChunkSize; i++) // pass over this structure
		{
			c++;
		}
		
		wav.dataChunkId = "";
		wav.dataChunkId += String.fromCharCode(x[c++]);
		wav.dataChunkId += String.fromCharCode(x[c++]);
		wav.dataChunkId += String.fromCharCode(x[c++]);
		wav.dataChunkId += String.fromCharCode(x[c++]);
		wav.dataChunkSize = 0;
		wav.dataChunkSize += x[c++];
		wav.dataChunkSize += x[c++] * 256;
		wav.dataChunkSize += x[c++] * 256 * 256;
		wav.dataChunkSize += x[c++] * 256 * 256 * 256;
	}
	
	var bookmarkIndex = c;
	
	var bytesPerSample = wav.nBitsPerSample / 8;
	
	var n = wav.dataChunkSize / bytesPerSample / wav.nChannels;
	
	// with slots
	//wav.xs = MakeSlot(wav, "xs", null);
	//var xs = MakeList(wav.xs, "$");
	//wav.xs.$ = xs;
	//wav.xs.state = State.Nonblank;
	//
	//var channels = [];
	//
	//for (var j = 0; j < wav.nChannels; j++)
	//{
	//	channels[j] = new Array(n);
	//	xs[j] = MakeSlot(xs, j.toString(), channels[j]);
	//}
	
	// without slots
	wav.xs = [];
	for (var j = 0; j < wav.nChannels; j++) { wav.xs[j] = new Array(n); }
	var xs = wav.xs;
	var channels = wav.xs;
	
	for (var i = 0; i < n; i++)
	{
		for (var j = 0; j < xs.length; j++)
		{
			var pcm = 0;
			var multiplier = 1;
			
			for (var k = 0; k < bytesPerSample; k++)
			{
				pcm += x[bookmarkIndex] * multiplier;
				multiplier *= 256;
				bookmarkIndex++;
			}
			
			// (bytesPerSample == 1) => (maskOfTheSignBit == 0b10000000 == 0x80)
			// (bytesPerSample == 2) => (maskOfTheSignBit == 0b1000000000000000 == 0x8000)
			var maskOfTheSignBit = 1;
			
			for (var k = 0; k < bytesPerSample; k++)
			{
				maskOfTheSignBit <<= 8;
			}
			
			maskOfTheSignBit >>= 1;
			
			if ((pcm & maskOfTheSignBit) != 0) // if pcm is negative
			{
				pcm -= maskOfTheSignBit << 1;
			}
			
			channels[j][i] = pcm;
		}
	}
	
	return wav;
}

