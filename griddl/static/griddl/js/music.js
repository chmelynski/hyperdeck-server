
(function () {

function thisModule() {

var mAudioContext = null;
if (window.AudioContext) { mAudioContext = new AudioContext(); }
if (mAudioContext == null) { if (window.webkitAudioContext) { mAudioContext = new webkitAudioContext(); } }

function HighPassFilter(pcms, dt, rc) {
	
	var output = new Int16Array(pcms.length);
	var alpha = rc / (rc + dt);
	output[0] = pcms[0];
	
	for (var i = 1; i < pcms.length; i++)
	{
		output[i] = alpha * output[i - 1] + alpha * (pcms[i] - pcms[i - 1]);
	}
	
	return output;
}
function LowPassFilter(pcms, dt, rc) {
	
	var output = new Int16Array(pcms.length);
	
	var alpha = dt / (rc + dt);
	output[0] = pcms[0];
	
	for (var i = 1; i < pcms.length; i++)
	{
		output[i] = (1 - alpha) * output[i - 1] + alpha * pcms[i];
	}
	
	
	return output;
}


function DrawSheetMusic() {
	
	var g = globals.g;
	g.resetTransform();
	g.clearRect(0, 0, g.canvas.width, g.canvas.height);
	
	var params = Griddl.GetParams('params');
	
	var staffs = Math.floor(params.measures / params.measuresPerStaff, 1);
	var remainderMeasures = params.measures % params.measuresPerStaff;
	if (remainderMeasures > 0) { staffs++; }
	
	var rows = 21 + params.highExtension + params.lowExtension;
	var staffHeight = params.rowHeight * rows + params.staffGap;
	var staffWidth = params.colWidth * params.beatsPerMeasure * params.measuresPerStaff * 4;
	
	var colsPerMeasure = params.beatsPerMeasure * 4;
	var colsPerStaff = colsPerMeasure * params.measuresPerStaff;
	
	g.strokeStyle = 'rgb(255,200,200)';
	
	// red vertical lines
	for (var i = 0; i < colsPerStaff; i++)
	{
		var y0 = 0;
		var y1 = g.canvas.height;
		var x = 0.5 + params.gridsLeft + (i+0.5) * params.colWidth;
		//g.DrawLine(x, y0, x, y1);
	}
	
	// the grid
	g.strokeStyle = 'rgb(200,200,200)';
	for (var i = 0; i < rows; i++)
	{
		for (var j = 0; j < colsPerStaff; j++)
		{
			//g.strokeRect(0.5+params.gridsLeft+j*params.colWidth, 0.5+params.gridsTop + i * params.rowHeight, params.colWidth, params.rowHeight);
		}
	}
	
	g.translate(params.staffsLeft, params.staffsTop);
	
	for (var iStaff = 0; iStaff < staffs; iStaff++)
	{
		g.strokeStyle = 'black';
		
		g.translate(0, params.rowHeight * params.staffExtension / 2);
		
		var staffLines = [];
		staffLines.push(params.highExtension + 0);
		staffLines.push(params.highExtension + 2);
		staffLines.push(params.highExtension + 4);
		staffLines.push(params.highExtension + 6);
		staffLines.push(params.highExtension + 8);
		staffLines.push(params.highExtension + 12);
		staffLines.push(params.highExtension + 14);
		staffLines.push(params.highExtension + 16);
		staffLines.push(params.highExtension + 18);
		staffLines.push(params.highExtension + 20);
		
		// sixt, beat, measure boundaries
		var beatCount = params.measuresPerStaff * params.beatsPerMeasure;
		var sixtCount = beatCount * 4;
		
		g.strokeStyle = 'black';
		g.DrawLine(0.5+params.gridsLeft, 0, 0.5+params.gridsLeft, g.canvas.height);
		
		for (var i = 0; i < sixtCount; i++)
		{
			var y0 = 0;
			var y1 = g.canvas.height;
			var x = 0.5+params.gridsLeft+(i+1)*params.colWidth;
			
			if ((i+1) % (params.beatsPerMeasure * 4) == 0)
			{
				g.strokeStyle = 'black';
			}
			else if ((i+1) % 4 == 0)
			{
				g.strokeStyle = 'rgb(150,150,150)';
			}
			else
			{
				g.strokeStyle = 'rgb(220,220,220)';
			}
			
			g.DrawLine(x, y0, x, y1);
		}
		
		// staff lines
		for (var i = 0; i < staffLines.length; i++)
		{
			var x0 = params.gridsLeft - params.leftStaffPadding;
			var x1 = params.gridsLeft + staffWidth + params.rightStaffPadding;
			var y = params.gridsTop + 0.5 + params.rowHeight * (staffLines[i]+0.5);
			
			g.DrawLine(x0, y, x1, y);
		}
		
		g.translate(0, staffHeight);
	}
	
	// so from here on we do the calculations explicitly
	g.resetTransform();
	
	var notes = Griddl.GetData('notes');
	
	for (var i = 0; i < notes.length; i++)
	{
		var note = notes[i];
		var staff = Math.floor(note.measure / params.measuresPerStaff, 1);
		var measureOfStaff = note.measure % params.measuresPerStaff;
		
		var col = measureOfStaff * colsPerMeasure + parseInt(note.sixt);
		var cx = params.gridsLeft + (col+0.5) * params.colWidth;
		var cy = params.gridsTop + staff * staffHeight + (parseInt(note.row)+0.5) * params.rowHeight;
		
		// short staff lines
		if (note.pk >= 61) // A5 or above - above treble clef
		{
		
		}
		else if (note.pk == 40) // C4
		{
		
		}
		else if (note.pk <= 20) // E2 or below - below bass clef
		{
		
		}
		
		var type = note.type;
		
		var dotted = false;
		
		g.strokeStyle = 'black';
		g.fillStyle = 'black';
		
		if (type.substr(0, 6) == 'Dotted')
		{
			dotted = true;
			type = type.substr(7);
		}
		
		if (type == 'Quarter' || type == 'Eighth' || type == 'Sixteenth')
		{
			g.FillCircle(cx, cy, 5);
		}
		else if (type == 'Whole' || type == 'Half')
		{
			g.lineWidth = 2;
			g.StrokeCircle(cx, cy, 5);
			g.lineWidth = 1;
		}
		
		if (type == 'Half' || type == 'Quarter' || type == 'Eighth' || type == 'Sixteenth')
		{
			g.lineWidth = 2;
			g.DrawLine(cx + 5, cy, cx + 5, cy - 30);
			g.lineWidth = 1;
		}
		
		if (type == 'Eighth' || type == 'Sixteenth')
		{
			g.lineWidth = 2;
			g.DrawLine(cx + 5, cy - 30, cx + 10, cy - 25);
			g.lineWidth = 1;
		}
		
		if (type == 'Sixteenth')
		{
			g.lineWidth = 2;
			g.DrawLine(cx + 5, cy - 25, cx + 10, cy - 20);
			g.lineWidth = 1;
		}
		
		if (dotted)
		{
			g.FillCircle(cx + 10, cy, 2);
		}
	}
}


function LoadRecorder() {

	var lefts = [];
	var tops = [];
	
	var letters = 'QWERTYUIOPASDFGHJKLZXCVBNM';
	
	var size = 50;
	
	for (var i = 0; i < 10; i++) { lefts.push(50 + (size + 1) * i); }
	for (var i = 0; i < 9; i++) { lefts.push(60 + (size + 1) * i); }
	for (var i = 0; i < 7; i++) { lefts.push(85 + (size + 1) * i); }
	
	for (var i = 0; i < 10; i++) { tops.push(100); }
	for (var i = 0; i < 9; i++) { tops.push(100 + size + 1); }
	for (var i = 0; i < 7; i++) { tops.push(100 + size + 1 + size + 1); }
	
	for (var i = 0; i < 26; i++)
	{
		var div = $(document.createElement('div'));
		div.css('position', 'absolute');
		div.css('width', size.toString() + 'px');
		div.css('height', size.toString() + 'px');
		div.css('left', lefts[i].toString() + 'px');
		div.css('top', tops[i].toString() + 'px');
		div.css('border', '1px solid black');
		div.css('text-align', 'center');
		div.html(letters[i]);
		$('body').append(div);
	}
	
	var events = [];
	
	$('body').on('keydown', function(e) {
		var event = {};
		event.key = e.keyCode;
		event.time = new Date().getTime();
		events.push(event);
	});
}

var synesthesia = {
	'Ab' : 'rgb(255,106,106)' ,
	'A'  : 'rgb(255,000,000)' ,
	'A#' : 'rgb(149,000,000)' ,
	'Bb' : 'rgb(106,106,255)' ,
	'B'  : 'rgb(000,000,255)' ,
	'B#' : 'rgb(000,000,149)' ,
	'Cb' : 'rgb(255,232,064)' ,
	'C'  : 'rgb(255,191,000)' ,
	'C#' : 'rgb(255,128,000)' ,
	'Db' : 'rgb(191,102,064)' ,
	'D'  : 'rgb(136,072,045)' ,
	'D#' : 'rgb(080,043,027)' ,
	'Eb' : 'rgb(180,180,180)' ,
	'E'  : 'rgb(127,127,127)' ,
	'E#' : 'rgb(074,074,074)' ,
	'Fb' : 'rgb(188,143,218)' ,
	'F'  : 'rgb(140,064,191)' ,
	'F#' : 'rgb(082,037,112)' ,
	'Gb' : 'rgb(080,197,100)' ,
	'G'  : 'rgb(048,143,065)' ,
	'G#' : 'rgb(027,080,036)'
};

function DownloadWav() {
	var totalpcms = CompileSong();
	var wav = MakeWav(totalpcms);
	var downloadLink = document.createElement('a');
	var url = (window.webkitURL != null ? window.webkitURL : window.URL);
	downloadLink.href = url.createObjectURL(new Blob([ wav ]));
	downloadLink.download = 'song.wav';
	downloadLink.click();
}

// Sample : { pcms : double[] , amp : double , start : int } // this is an old definition of a sample

function CompileMatrix(matrixName, audioName, padding) {
	
	var matrix = Griddl.GetData(matrixName);
	var notes = GetNotes(matrix);
	
	for (var i = 0; i < notes.length; i++)
	{
		var note = notes[i];
		note.amp = note.$; // in the standard formulation, the entry in the cell is the amp
	}
	
	var pcms = CompileInstrument(notes, padding);
	Griddl.SetAudio(audioName, pcms);
}

function NoteTypeToDuration(str) {

	if (str == 'Quarter')
	{
		return 1;
	}
	else if (str == 'Eighth')
	{
		return 1/2;
	}
	else if (str == 'Sixteenth')
	{
		return 1/4;
	}
	else if (str == 'Half')
	{
		return 2;
	}
	else if (str == 'Dotted Quarter')
	{
		return 1.5;
	}
	else if (str == 'Dotted Eighth')
	{
		return 1/2 + 1/4;
	}
	else if (str == 'Dotted Sixteenth')
	{
		return 1/4 + 1/8;
	}
	else if (str == 'Dotted Half')
	{
		return 3;
	}
	else if (str == 'Whole')
	{
		return 4;
	}
	else
	{
		throw new Error();
	}
}

function CompileNotes(notesName, paramsName, audioName, padding) {
	
	// note = { pitch : 'C4' , measure : 1 , sixt : 15 , type : 'Quarter' , instrument : 'Piano' , amp : 3000 }
	
	var notes = Griddl.GetData(notesName);
	var params = Griddl.GetParams(paramsName);
	
	var samplesPerBeat = 44100 * 60 / params.beatsPerMinute;
	var samplesPerSixt = samplesPerBeat / 4;
	
	var thenotes = [];
	
	for (var i = 0; i < notes.length; i++)
	{
		var note = notes[i];
		var freq = C4toHz(note.pitch);
		var start = Math.floor(note.measure * params.beatsPerMeasure * samplesPerBeat + note.sixt * samplesPerSixt, 1);
		var duration = Math.floor(samplesPerBeat * NoteTypeToDuration(note.type), 1);
		
		var thenote = {};
		thenote.instrument = note.instrument;
		thenote.amp = parseInt(note.amp);
		thenote.freq = freq;
		thenote.start = start;
		thenote.duration = duration;
		thenotes.push(thenote);
	}
	
	var pcms = CompileInstrument(thenotes, padding);
	
	Griddl.SetAudio(audioName, pcms);
}
function CompileMidiNotes(notesName, paramsName, audioName, padding) {
	
	// note = { pitch : 64 , amp : 3000 , start : 1000 , end : 1100 , channel : 1 } // we'll call the units of start/end 'ticks'
	// params = { samplesPerTick : 4 }
	
	// pitch: in [0,127], in which middle C = 60 - in piano keys, middle C is 40, so we need to subtract 20 from the midi pitch to get the piano key pitch
	// amp : in [1,127] in which 
	
	var notes = Griddl.GetData(notesName);
	var params = Griddl.GetParams(paramsName);
	
	var samplesPerTick = parseFloat(params.samplesPerTick);
	var ampMidiToPcmMultiplier = parseFloat(params.ampMidiToPcmMultiplier);
	// also params needs to have a channel -> instrument mapping:
	// 1	Piano
	// 2	Guitar
	
	var thenotes = [];
	
	for (var i = 0; i < notes.length; i++)
	{
		var note = notes[i];
		var freq = PKtoHz(note.pitch - 20);
		var start = Math.floor(note.start * samplesPerTick, 1);
		var duration = Math.floor((note.end - note.start) * samplesPerTick, 1);
		var amp = Math.floor(note.amp * ampMidiToPcmMultiplier, 1);
		
		var thenote = {};
		thenote.instrument = params[note.channel];
		thenote.amp = amp;
		thenote.freq = freq;
		thenote.start = start;
		thenote.duration = duration;
		thenotes.push(thenote);
	}
	
	var pcms = CompileInstrument(thenotes, padding);
	
	Griddl.SetAudio(audioName, pcms);
}


function CompileGuitarTabs(tabName, audioName, padding) {

	var guitarStringToPK = {};
	guitarStringToPK['e'] = 44;
	guitarStringToPK['B'] = 39;
	guitarStringToPK['G'] = 35;
	guitarStringToPK['D'] = 30;
	guitarStringToPK['A'] = 25;
	guitarStringToPK['E'] = 20;
	
	var matrix = Griddl.GetData(tabName);
	var cells = GetNotes(matrix);
	
	var notes = [];
	
	for (var i = 0; i < cells.length; i++)
	{
		var cell = cells[i];
		var note = {};
		
		note.amp = cell.amp;
		note.duration = cell.duration;
		note.start = cell.start;
		note.instrument = cell.instrument;
		note.freq = PKtoHz(guitarStringToPK[cell.string] + cell.$);
		
		notes.push(note);
	}
	
	var pcms = CompileInstrument(notes, padding);
	
	Griddl.SetAudio(audioName, pcms);
}


// Note = { sample : 'snare' , instrument : 'Piano' , amp : 3000 , freq : 440 , start : 13000 , duration : 2000 , etc. }
// Sample = { duration : 10000 , pcms : Array , instrument : Piano , freq : 220 }

function GetNotes(matrix) {
	
	var EvalRowColHeaderValue = function(val) {
		if (!val) { return null; };
		
		var result = null;
		var type = typeof(val);
		
		if (type == 'number')
		{
			var result = val;
		}
		else if (type == 'string')
		{
			var ch = val.trim()[0];
			var result = val; // = eval(val)
			if (('0' <= ch && ch <= '9') || ch == '-' || ch == '.') { result = parseFloat(val); }
		}
		else
		{
			throw new Error("Unknown header value type (it's not a number or string)");
		}
		
		return result;
	}
	var EvalCellValue = function(val) {
		
		var type = typeof(val);
		
		if (type == 'number')
		{
			result = { $ : val };
		}
		else if (type == 'string')
		{
			var ch = val.trim()[0];
			var result = null;
			
			if (ch == '{')
			{
				result = eval('x = ' + val); // yup, this is pretty bizarre.  apparently, eval('{ a : 2 , b : 3 }') fails to parse, presumably because you can't have a bare object literal
			}
			else if ('0' <= ch && ch <= '9')
			{
				result = { $ : parseFloat(val) };
			}
			else // if ('A' <= ch && ch <= 'Z' || 'a' <= ch && ch <= 'z')
			{
				result = val; // this is where we could use variables that refer to entire other grids
				//result = eval(val);
			}
		}
		else
		{
			throw new Error("Unknown cell value type (it's not a number or string)");
		}
		
		return result;
	};
	
	var seq = null;
	var fn = null;
	var pcms = null;
	
	var rowStart = null;
	var colStart = null;
	
	var c = 0;
	
	while (true)
	{
		if (matrix[c][0] != "" && matrix[c][0] != null)
		{
			rowStart = c + 1;
			break;
		}
		
		c++;
	}
	
	c = 0;
	
	while (true)
	{
		if (matrix[0][c] != "" && matrix[0][c] != null)
		{
			colStart = c + 1;
			break;
		}
		
		c++;
	}
	
	var rowObjs = [];
	var colObjs = [];
	
	var rows = matrix.length - rowStart;
	var cols = matrix[0].length - colStart;
	
	for (var i = 0; i < rows; i++)
	{
		var obj = {};
		
		for (var j = 0; j < colStart - 1; j++)
		{
			var key = matrix[rowStart - 1][j];
			var str = matrix[rowStart + i][j];
			//obj[key] = eval(str);
			obj[key] = EvalRowColHeaderValue(str);
		}
		
		rowObjs.push(obj);
	}
	
	for (var j = 0; j < cols; j++)
	{
		var obj = {};
		
		for (var i = 0; i < rowStart - 1; i++)
		{
			var key = matrix[i][colStart - 1];
			var str = matrix[i][colStart + j];
			//obj[key] = eval(str);
			obj[key] = EvalRowColHeaderValue(str);
		}
		
		colObjs.push(obj);
	}
	
	var finalObjs = [];
	
	for (var i = 0; i < rows; i++)
	{
		console.log(i + ' of ' + rows);
		
		for (var j = 0; j < cols; j++)
		{
			var str = matrix[rowStart + i][colStart + j];
			if (!str) { continue; }
			
			var cellObj = EvalCellValue(str);
			
			var finalObj = {};
			
			for (var key in rowObjs[i])
			{
				finalObj[key] = rowObjs[i][key];
			}
			
			for (var key in colObjs[j])
			{
				finalObj[key] = colObjs[j][key];
			}
			
			for (var key in cellObj)
			{
				finalObj[key] = cellObj[key];
			}
			
			finalObjs.push(finalObj);
		}
	}
	
	return finalObjs;
}

function CompileInstrument(notes, padding) {
	
	// we generate a dictionary like this, noting the max duration for each instrument/freq pair - keep the pcms field null for now (for instruments), we'll fill it in later
	// {
	//   Piano220 : { duration : 10000 , pcms : null , instrument : Piano , freq : 220 } ,
	//   Piano440 : { duration : 10000 , pcms : null , instrument : Piano , freq : 440 } ,
	//   Snare : { pcms : Array } , 
	// }
	
	var wavSampleDict = {}; // this is a dict of pcm arrays that have been normalized to [-1.0,1.0] (or thereabouts)
	
	var sampleDict = {};
	
	for (var i = 0; i < notes.length; i++)
	{
		var note = notes[i];
		
		if (note.instrument)
		{
			var sample = null;
			
			var key = note.instrument + note.freq.toString();
			note.key = key;
			note.sampleStart = 0;
			
			if (sampleDict[key])
			{
				sample = sampleDict[key];
			}
			else
			{
				sample = { duration : 0 , pcms : null , instrument : note.instrument , freq : note.freq };
				sampleDict[key] = sample;
			}
			
			if (sample.duration < note.duration)
			{
				sample.duration = note.duration
			}
		}
		
		if (note.sample)
		{
			var key = note.sample;
			note.key = key;
			
			if (!wavSampleDict[key])
			{
				var pcms = Griddl.GetData(note.sample);
				var normalizedPcms = new Array(pcms.length);
				
				for (var k = 0; k < pcms.length; k++)
				{
					normalizedPcms[k] = pcms[k] / 3000; // 3000 is pretty arbitrary, but it seems to work
				}
				
				wavSampleDict[key] = normalizedPcms;
			}
			
			var sample = { pcms : wavSampleDict[key] };
			
			sampleDict[key] = sample;
			
			// we should also allow MM:SS.HH notation here
			// lengthObj = { start : start , length : length , end : end }
			
			if (note.sampleStart || note.sampleLength || note.sampleEnd)
			{
				var lengthObj = NormalizeStartLengthEnd({ start : note.sampleStart , length : note.sampleLength , end : note.sampleEnd }, sample.pcms.length);
				note.duration = lengthObj.length;
			}
			else
			{
				note.sampleStart = 0;
				note.duration = sample.pcms.length;
			}
		}
	}
	
	var instrumentFunctionDict = {};
	
	// now fill in the pcms field of each instrument/freq pair
	for (var key in sampleDict)
	{
		var sample = sampleDict[key];
		
		if (sample.pcms === null)
		{
			var fn = null;
			
			if (instrumentFunctionDict[sample.instrument])
			{
				fn = instrumentFunctionDict[sample.instrument];
			}
			else
			{
				var text = Griddl.GetData(sample.instrument); // yeah we have this set up so that it returns the text of a js component, not the compiled function
				fn = new Function('args', text);
				instrumentFunctionDict[sample.instrument] = fn;
			}
			
			// note that this model fails if you have an instrument with a sustain, then decay
			// you would have to generate a long sustain, then also generate a decay, and tack on the decay just before mixdown (when we finally know the actual duration)
			sample.pcms = fn({ freq : sample.freq , duration : sample.duration });
		}
		
		// so really all we need to calculate is one cycle of the instrument (maybe a few more if there is FM involved)
		// then we can paste cycles end-to-end
		// then we can apply envelope/amplitude to the whole
		// this model disallows applying an envelope to each separate harmonic, though
		// but maybe that's too stringent of a restriction
		// the restriction we're working with now is just that the core instrument function require only a freq arg, and a max duration
		// this allows us to memoize, and then the envelope can be applied afterwards
		// (this is not a huge deal because it only requires modification of the attack, decay, and release phases)
	}
	
	// now we have a filled sampledict - all that has to be done is mixdown
	
	var max = 0;
	
	for (var i = 0; i < notes.length; i++)
	{
		var note = notes[i];
		var n = note.start + note.duration;
		if (n > max) { max = n; }
	}
	
	var pcms = new Int16Array(max + padding);
	
	var additionCount = new Uint8Array(max + padding);
	
	for (var i = 0; i < notes.length; i++)
	{
		var note = notes[i];
		var sample = sampleDict[note.key];
		
		for (var k = 0; k < note.duration; k++)
		{
			var dstIndex = note.start + k;
			var srcIndex = note.sampleStart + k;
			var pcm = note.amp * sample.pcms[srcIndex];
			//if (Number.isNaN(pcm)) { debugger; }
			pcms[dstIndex] += pcm;
			additionCount[note.start + k]++;
		}
	}
	
	for (var i = 0; i < pcms.length; i++)
	{
		pcms[i] /= additionCount[i];
		pcms[i] = Math.floor(pcms[i], 1);
	}
	
	return pcms;
}

function PrecomputeSin() {
	var granularity = 10000;
	var x = new Float32Array(granularity);
	var tau = Math.PI * 2;
	var step = tau / granularity;
	var c = 0;
	
	for (var i = 0.0; i < tau; i += step)
	{
		x[c++] = Math.sin(i);
	}
	
	return x;
}

// Sample : { pcms : pcms , start : start , amp : amp };
function AddSample(totalpcms, start, pcms) {
	var istart = Math.floor(start);
	
	for (var i = 0; i < pcms.length; i++)
	{
		totalpcms[istart + i] = Mix(totalpcms[istart + i], pcms[i]);
	}
}
function NormalizeStartLengthEnd(obj, defaultLength) {
	
	var start = obj.start;
	var length = obj.length;
	var end = obj.end;
	
	if (start)
	{
		if (length)
		{
			if (end)
			{
			
			}
			else
			{
				end = start + length;
			}
		}
		else
		{
			if (end)
			{
				length = end - start;
			}
			else
			{
				end = defaultLength;
				length = end - start;
			}
		}
	}
	else
	{
		if (length)
		{
			if (end)
			{
				start = end - length;
			}
			else
			{
				start = 0;
			}
		}
		else
		{
			if (end)
			{
				start = 0;
				length = end - start;
			}
			else
			{
				start = 0;
				length = defaultLength;
			}
		}
	}
	
	return { start : start , length : length , end : end };
}

function MakeTotalPcms() {
	
	var max = 0;
	
	for (var i = 0; i < globals.objs.length; i++)
	{
		var obj = globals.objs[i];
		
		if (obj.type == 'matrix')
		{
			var n = GetGridSampleLength(obj.matrix);
			if (n > max) { max = n; }
		}
	}
	
	max += 44100; // this is gymnopedie-specific - need to have a blank column at end to give the right sample length
	
	var array = new Array(max);
	
	for (var i = 0; i < array.length; i++) { array[i] = 0; }
	
	return array;
}
function GetGridSampleLength(matrix) {
	
	var i = 0;
	var j = 0;
	
	while (matrix[0][j].length == 0) { j++; }
	while (matrix[i][j] != 'start') { i++; }
	
	return parseInt(matrix[i][matrix[i].length - 1]);
}

function PlaySound(pcms) {
	var buffer = mAudioContext.createBuffer(1, pcms.length, 44100); // nChannels , sample length , sample rate
	var dbuf = buffer.getChannelData(0);
	
	for (var i = 0; i < pcms.length; i++)
	{
		dbuf[i] = pcms[i] / 1000.0; // in the original SoundToy, they use floats (which I've seen go up to 2.5)
	}
	
	// so before that / 1000.0 was in place, we were making a square wave, which is what the beginning of Pepper by Butthole Surfers is
	
	var volume = 5;
	
	var node = mAudioContext.createBufferSource();
	node.buffer = buffer;
	//node.gain.value = volume / 100.0;
	node.connect(mAudioContext.destination);
	//node.noteOn(0);
	node.start();
}

function Drum(amp, freq, duration) {
	var x = new Array(duration);
	
	for (var i = 0; i < duration; i++)
	{
		var t = i / 44100;
		var y = 0;
		y += 0.5*Noise(32000*t)*Math.exp(-32*t);
		y += 2.0*Noise(3200*t)*Math.exp(-32*t);
		y += 3.0*Math.cos(400*(1-t)*t)*Math.exp(-4*t);
		y *= amp;
		x[i] = y;
	}
	
	return x;
}
function Guitar(amp, freq, duration) {
	var x = new Array(duration);
	
	for (var i = 0; i < duration; i++)
	{
		var t = i / 44100;
		var f = Math.cos(0.251*freq*t);
		var y = 0;
		y += 0.5*Math.cos(1.0*freq*t+3.14*f)*Math.exp(-0.0007*freq*t);
		y += 0.2*Math.cos(2.0*freq*t+3.14*f)*Math.exp(-0.0009*freq*t);
		y += 0.2*Math.cos(4.0*freq*t+3.14*f)*Math.exp(-0.0016*freq*t);
		y += 0.1*Math.cos(8.0*freq*t+3.14*f)*Math.exp(-0.0020*freq*t);
		y *= 0.9 + 0.1*Math.cos(70.0*t);
		y = 2.0*y*Math.exp(-22.0*t) + y;
		y *= amp;
		x[i] = y;
	}
	
	return x;
}
function Piano(amp, freq, duration) {
	var x = new Array(duration);
	
	for (var i = 0; i < duration; i++)
	{
		var t = i / 44100;
		var y = 0;
		y += 0.6*Math.sin(1.0*freq*t)*Math.exp(-0.0008*freq*t);
		y += 0.3*Math.sin(2.0*freq*t)*Math.exp(-0.0010*freq*t);
		y += 0.1*Math.sin(4.0*freq*t)*Math.exp(-0.0015*freq*t);
		y += 0.2*y*y*y;
		y *= 0.9 + 0.1*Math.cos(70.0*t);
		y = 2.0*y*Math.exp(-22.0*t) + y;
		y *= amp;
		x[i] = y;
	}
	
	return x;
}
function FM2(amp, freq, duration) {
	var x = new Array(duration);
	
	for (var i = 0; i < duration; i++)
	{
		var t = i / 44100;
		
		var a = Math.sin(Math.sin(0.2 * freq * t) - Math.tan(0.5 * freq * t));
		var b = Math.sin(Math.sin(0.2 * freq * t) + Math.sin(2.0 * freq * t));
		var c = Math.sin(Math.sin(0.4 * freq * t) - Math.sin(2.0 * freq * t));
		var d = 1.2 * Math.random();
		
		var y = 0.25 * (a + b + c + d);
		y = (0.25 + Math.sin(0.005 * freq * t)) * Math.sin(y * t);
		y *= Math.exp(-4.0 * t) * Math.exp(-1.5 * t) * 40.0;
		
		var exp2y = Math.exp(2.0 * y);
		y = (exp2y - 1.0) / (exp2y + 1.0);
		
		y *= amp;
		x[i] = y;
	}
	
	return x;
}
function Noise(x) {
	var grad = function(n, x)
	{
		n = (n << 13) ^ n;
		n = (n * (n * n * 15731 + 789221) + 1376312589);
		var res = x;
		
		if (n & 0x20000000) 
		{
			res = -x;
		}
		
		return res;
	};

    var i = Math.floor(x);
    var f = x - i;
    var w = f*f*f*(f*(f*6.0-15.0)+10.0);
    var a = grad( i+0, f+0.0 );
    var b = grad( i+1, f-1.0 );
    return a + (b-a)*w;
}

function Guitar2(duration, freq) {
	return Pluck(duration, PluckBang(freq));
}
function PluckBang(freq) {
	
	var period = Math.floor(1.0 / freq * 44100, 1);
	var x = new Float32Array(period);
	
	for (var i = 0; i < period; i++)
	{
		x[i] = Math.random() * 2 - 1.0;
	}
	
	return x;
}
function Pluck(length, onecycle) {
	
	var xs = new Float32Array(length);
	
	var k = 0;
	var x = 0.0;
	
	for (var i = 0; i < length; ++i)
	{
		var write = k;
		x = onecycle[k++];
		
		if (k >= onecycle.length)
		{
			k = 0;
		}
	
		x = (x + onecycle[k]) * 0.5;
		onecycle[write] = x;
		xs[i] = x;
	}
	
	return xs;
}

function DrawWave(g, color, pcms, pcmStart, pcmLength, left, cy, xPixelsPerStep, samplesPerStep, pcmsPerYPixel) {
	g.lineWidth = 1;
	g.strokeStyle = color;
	
	var x = left;
	var y = cy - pcms[pcmStart] / pcmsPerYPixel;
	
	g.beginPath();
	g.moveTo(x, y);
	
	var pcmEnd = Math.min(pcmStart + pcmLength, pcms.length);
	
	var i = pcmStart;
	while (i < pcmEnd)
	{
		x += xPixelsPerStep;
		y = cy - pcms[i] / pcmsPerYPixel;
		g.lineTo(x, y);
		i += samplesPerStep;
	}
	
	g.stroke();
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
	for (var j = 0; j < wav.nChannels; j++) { wav.xs[j] = new Int16Array(n); }
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
function MakeWav(channel) {
	var riffChunkId = "RIFF";
	var riffChunkSize = null;
	var wave = "WAVE";
	var formatChunkId = "fmt ";
	var formatChunkSize = 16;
	var formatTag = 1;
	var nChannels = 1; // can be 2
	var nSamplesPerSec = 44100;
	var nAvgBytesPerSec = null;
	var nBlockAlign = null;
	var nBitsPerSample = 16;
	var dataChunkId = "data";
	var dataChunkSize = null;
	
	var bytesPerSample = nBitsPerSample / 8;
	dataChunkSize = channel.length * bytesPerSample * nChannels;
	nAvgBytesPerSec = nSamplesPerSec * bytesPerSample * nChannels;
	riffChunkSize = dataChunkSize + 44 - 8;
	nBlockAlign = bytesPerSample * nChannels; // ? - i think this is what nBlockAlign means
	
	var arrayBuffer = new ArrayBuffer(44 + channel.length * bytesPerSample);
	var uint8Array = new Uint8Array(arrayBuffer, 0, arrayBuffer.byteLength);
	
	var c = 0;
	
	uint8Array[c++] = 82; // 'RIFF'
	uint8Array[c++] = 73;
	uint8Array[c++] = 70;
	uint8Array[c++] = 70;
	uint8Array[c++] = riffChunkSize % 256;
	uint8Array[c++] = Math.floor(riffChunkSize / 256) % 256;
	uint8Array[c++] = Math.floor(riffChunkSize / 256 / 256) % 256;
	uint8Array[c++] = Math.floor(riffChunkSize / 256 / 256 / 256) % 256;
	uint8Array[c++] = 87; // 'WAVE'
	uint8Array[c++] = 65;
	uint8Array[c++] = 86;
	uint8Array[c++] = 69;
	uint8Array[c++] = 102; // 'fmt '
	uint8Array[c++] = 109;
	uint8Array[c++] = 116;
	uint8Array[c++] = 32;
	uint8Array[c++] = formatChunkSize % 256;
	uint8Array[c++] = Math.floor(formatChunkSize / 256) % 256;
	uint8Array[c++] = Math.floor(formatChunkSize / 256 / 256) % 256;
	uint8Array[c++] = Math.floor(formatChunkSize / 256 / 256 / 256) % 256;
	uint8Array[c++] = formatTag % 256;
	uint8Array[c++] = Math.floor(formatTag / 256) % 256;
	uint8Array[c++] = nChannels % 256;
	uint8Array[c++] = Math.floor(nChannels / 256) % 256;
	uint8Array[c++] = nSamplesPerSec % 256;
	uint8Array[c++] = Math.floor(nSamplesPerSec / 256) % 256;
	uint8Array[c++] = Math.floor(nSamplesPerSec / 256 / 256) % 256;
	uint8Array[c++] = Math.floor(nSamplesPerSec / 256 / 256 / 256) % 256;
	uint8Array[c++] = nAvgBytesPerSec % 256;
	uint8Array[c++] = Math.floor(nAvgBytesPerSec / 256) % 256;
	uint8Array[c++] = Math.floor(nAvgBytesPerSec / 256 / 256) % 256;
	uint8Array[c++] = Math.floor(nAvgBytesPerSec / 256 / 256 / 256) % 256;
	uint8Array[c++] = nBlockAlign % 256;
	uint8Array[c++] = Math.floor(nBlockAlign / 256) % 256;
	uint8Array[c++] = nBitsPerSample % 256;
	uint8Array[c++] = Math.floor(nBitsPerSample / 256) % 256;
	uint8Array[c++] = 100; // 'data'
	uint8Array[c++] = 97;
	uint8Array[c++] = 116;
	uint8Array[c++] = 97;
	uint8Array[c++] = dataChunkSize % 256;
	uint8Array[c++] = Math.floor(dataChunkSize / 256) % 256;
	uint8Array[c++] = Math.floor(dataChunkSize / 256 / 256) % 256;
	uint8Array[c++] = Math.floor(dataChunkSize / 256 / 256 / 256) % 256;
	
	for (var i = 0; i < channel.length; i++)
	{
		var b = channel[i];
		
		if (b < 0)
        {
			var mult = 1;
			
			for (var k = 0; k < bytesPerSample; k++)
			{
				mult *= 256;
			}
			
			b += mult;
		}
		
		for (var k = 0; k < bytesPerSample; k++)
		{
			uint8Array[44 + i * bytesPerSample + k] = Math.floor(b % 256);
			b = Math.floor(b / 256);
		}
	}
	
	return uint8Array;
}
function MakeWavStereo(channels) {

}

function C4toPK(str) { // PK = piano key, 1-indexed (so 1-88)
	// these should probably be closures (that reference the x[] arrays) created in LoadMusicModule and put into the global scope
	
	var x = {};
	x['C8'] = 88;
	x['B7'] = 87;
	x['A#7'] = 86; x['Bb7'] = 86;
	x['A7'] = 85;
	x['G#7'] = 84; x['Ab7'] = 84;
	x['G7'] = 83;
	x['F#7'] = 82; x['Gb7'] = 82;
	x['F7'] = 81;
	x['E7'] = 80;
	x['D#7'] = 79; x['Eb7'] = 79;
	x['D7'] = 78;
	x['C#7'] = 77; x['Db7'] = 77;
	x['C7'] = 76;
	x['B6'] = 75;
	x['A#6'] = 74; x['Bb6'] = 74;
	x['A6'] = 73;
	x['G#6'] = 72; x['Ab6'] = 72;
	x['G6'] = 71;
	x['F#6'] = 70; x['Gb6'] = 70;
	x['F6'] = 69;
	x['E6'] = 68;
	x['D#6'] = 67; x['Eb6'] = 67;
	x['D6'] = 66;
	x['C#6'] = 65; x['Db6'] = 65;
	x['C6'] = 64;
	x['B5'] = 63;
	x['A#5'] = 62; x['Bb5'] = 62;
	x['A5'] = 61;
	x['G#5'] = 60; x['Ab5'] = 60;
	x['G5'] = 59;
	x['F#5'] = 58; x['Gb5'] = 58;
	x['F5'] = 57;
	x['E5'] = 56;
	x['D#5'] = 55; x['Eb5'] = 55;
	x['D5'] = 54;
	x['C#5'] = 53; x['Db5'] = 53;
	x['C5'] = 52;
	x['B4'] = 51;
	x['A#4'] = 50; x['Bb4'] = 50;
	x['A4'] = 49;
	x['G#4'] = 48; x['Ab4'] = 48;
	x['G4'] = 47;
	x['F#4'] = 46; x['Gb4'] = 46;
	x['F4'] = 45;
	x['E4'] = 44;
	x['D#4'] = 43; x['Eb4'] = 43;
	x['D4'] = 42;
	x['C#4'] = 41; x['Db4'] = 41;
	x['C4'] = 40;
	x['B3'] = 39;
	x['A#3'] = 38; x['Bb3'] = 38;
	x['A3'] = 37;
	x['G#3'] = 36; x['Ab3'] = 36;
	x['G3'] = 35;
	x['F#3'] = 34; x['Gb3'] = 34;
	x['F3'] = 33;
	x['E3'] = 32;
	x['D#3'] = 31; x['Eb3'] = 31;
	x['D3'] = 30;
	x['C#3'] = 29; x['Db3'] = 29;
	x['C3'] = 28;
	x['B2'] = 27;
	x['A#2'] = 26; x['Bb2'] = 26;
	x['A2'] = 25;
	x['G#2'] = 24; x['Ab2'] = 24;
	x['G2'] = 23;
	x['F#2'] = 22; x['Gb2'] = 22;
	x['F2'] = 21;
	x['E2'] = 20;
	x['D#2'] = 19; x['Eb2'] = 19;
	x['D2'] = 18;
	x['C#2'] = 17; x['Db2'] = 17;
	x['C2'] = 16;
	x['B1'] = 15;
	x['A#1'] = 14; x['Bb1'] = 14;
	x['A1'] = 13;
	x['G#1'] = 12; x['Ab1'] = 12;
	x['G1'] = 11;
	x['F#1'] = 10; x['Gb1'] = 10;
	x['F1'] = 9;
	x['E1'] = 8;
	x['D#1'] = 7; x['Eb1'] = 7;
	x['D1'] = 6;
	x['C#1'] = 5; x['Db1'] = 5;
	x['C1'] = 4;
	x['B0'] = 3;
	x['A#0'] = 2; x['Bb0'] = 2;
	x['A0'] = 1;
	return x[str];
}
function PKtoC4(pk, sharp) {
	switch (pk)
	{
		case  1:
			return 'A0';
		case  2:
			return sharp ? 'A#0' : 'Bb0';
		case  3:
			return 'B0';
		case  4:
			return 'C1';
		case  5:
			return sharp ? 'C#1' : 'Db1';
		case  6:
			return 'D1';
		case  7:
			return sharp ? 'D#1' : 'Eb1';
		case  8:
			return 'E1';
		case  9:
			return 'F1';
		case 10:
			return sharp ? 'F#1' : 'Gb1';
		case 11:
			return 'G1';
		case 12:
			return sharp ? 'G#1' : 'Ab1';
		case 13:
			return 'A1';
		case 14:
			return sharp ? 'A#1' : 'Bb1';
		case 15:
			return 'B1';
		case 16:
			return 'C2';
		case 17:
			return sharp ? 'C#2' : 'Db2';
		case 18:
			return 'D2';
		case 19:
			return sharp ? 'D#2' : 'Eb2';
		case 20:
			return 'E2';
		case 21:
			return 'F2';
		case 22:
			return sharp ? 'F#2' : 'Gb2';
		case 23:
			return 'G2';
		case 24:
			return sharp ? 'G#2' : 'Ab2';
		case 25:
			return 'A2';
		case 26:
			return sharp ? 'A#2' : 'Bb2';
		case 27:
			return 'B2';
		case 28:
			return 'C3';
		case 29:
			return sharp ? 'C#3' : 'Db3';
		case 30:
			return 'D3';
		case 31:
			return sharp ? 'D#3' : 'Eb3';
		case 32:
			return 'E3';
		case 33:
			return 'F3';
		case 34:
			return sharp ? 'F#3' : 'Gb3';
		case 35:
			return 'G3';
		case 36:
			return sharp ? 'G#3' : 'Ab3';
		case 37:
			return 'A3';
		case 38:
			return sharp ? 'A#3' : 'Bb3';
		case 39:
			return 'B3';
		case 40:
			return 'C4';
		case 41:
			return sharp ? 'C#4' : 'Db4';
		case 42:
			return 'D4';
		case 43:
			return sharp ? 'D#4' : 'Eb4';
		case 44:
			return 'E4';
		case 45:
			return 'F4';
		case 46:
			return sharp ? 'F#4' : 'Gb4';
		case 47:
			return 'G4';
		case 48:
			return sharp ? 'G#4' : 'Ab4';
		case 49:
			return 'A4';
		case 50:
			return sharp ? 'A#4' : 'Bb4';
		case 51:
			return 'B4';
		case 52:
			return 'C5';
		case 53:
			return sharp ? 'C#5' : 'Db5';
		case 54:
			return 'D5';
		case 55:
			return sharp ? 'D#5' : 'Eb5';
		case 56:
			return 'E5';
		case 57:
			return 'F5';
		case 58:
			return sharp ? 'F#5' : 'Gb5';
		case 59:
			return 'G5';
		case 60:
			return sharp ? 'G#5' : 'Ab5';
		case 61:
			return 'A5';
		case 62:
			return sharp ? 'A#5' : 'Bb5';
		case 63:
			return 'B5';
		case 64:
			return 'C6';
		case 65:
			return sharp ? 'C#6' : 'Db6';
		case 66:
			return 'D6';
		case 67:
			return sharp ? 'D#6' : 'Eb6';
		case 68:
			return 'E6';
		case 69:
			return 'F6';
		case 70:
			return sharp ? 'F#6' : 'Gb6';
		case 71:
			return 'G6';
		case 72:
			return sharp ? 'G#6' : 'Ab6';
		case 73:
			return 'A6';
		case 74:
			return sharp ? 'A#6' : 'Bb6';
		case 75:
			return 'B6';
		case 76:
			return 'C7';
		case 77:
			return sharp ? 'C#7' : 'Db7';
		case 78:
			return 'D7';
		case 79:
			return sharp ? 'D#7' : 'Eb7';
		case 80:
			return 'E7';
		case 81:
			return 'F7';
		case 82:
			return sharp ? 'F#7' : 'Gb7';
		case 83:
			return 'G7';
		case 84:
			return sharp ? 'G#7' : 'Ab7';
		case 85:
			return 'A7';
		case 86:
			return sharp ? 'A#7' : 'Bb7';
		case 87:
			return 'B7';
		case 88:
			return 'C8';
	}
}
function PKtoHz(n) {
	var x = [];
	x[88] = 4186.0090;
	x[87] = 3951.0664;
	x[86] = 3729.3101;
	x[85] = 3520.0000;
	x[84] = 3322.4376;
	x[83] = 3135.9635;
	x[82] = 2959.9554;
	x[81] = 2793.8259;
	x[80] = 2637.0205;
	x[79] = 2489.0159;
	x[78] = 2349.3181;
	x[77] = 2217.4610;
	x[76] = 2093.0045;
	x[75] = 1975.5332;
	x[74] = 1864.6550;
	x[73] = 1760.0000;
	x[72] = 1661.2188;
	x[71] = 1567.9817;
	x[70] = 1479.9777;
	x[69] = 1396.9129;
	x[68] = 1318.5102;
	x[67] = 1244.5079;
	x[66] = 1174.6591;
	x[65] = 1108.7305;
	x[64] = 1046.5023;
	x[63] = 987.7666;
	x[62] = 932.3275;
	x[61] = 880.0000;
	x[60] = 830.6094;
	x[59] = 783.9909;
	x[58] = 739.9888;
	x[57] = 698.4565;
	x[56] = 659.2551;
	x[55] = 622.2540;
	x[54] = 587.3295;
	x[53] = 554.3653;
	x[52] = 523.2511;
	x[51] = 493.8833;
	x[50] = 466.1638;
	x[49] = 440.0000;
	x[48] = 415.3047;
	x[47] = 391.9954;
	x[46] = 369.9944;
	x[45] = 349.2282;
	x[44] = 329.6276;
	x[43] = 311.1270;
	x[42] = 293.6648;
	x[41] = 277.1826;
	x[40] = 261.6256;
	x[39] = 246.9417;
	x[38] = 233.0819;
	x[37] = 220.0000;
	x[36] = 207.6523;
	x[35] = 195.9977;
	x[34] = 184.9972;
	x[33] = 174.6141;
	x[32] = 164.8138;
	x[31] = 155.5635;
	x[30] = 146.8324;
	x[29] = 138.5913;
	x[28] = 130.8128;
	x[27] = 123.4708;
	x[26] = 116.5409;
	x[25] = 110.0000;
	x[24] = 103.8262;
	x[23] = 97.9989;
	x[22] = 92.4986;
	x[21] = 87.3071;
	x[20] = 82.4069;
	x[19] = 77.7817;
	x[18] = 73.4162;
	x[17] = 69.2957;
	x[16] = 65.4064;
	x[15] = 61.7354;
	x[14] = 58.2705;
	x[13] = 55.0000;
	x[12] = 51.9131;
	x[11] = 48.9994;
	x[10] = 46.2493;
	x[9] = 43.6535;
	x[8] = 41.2034;
	x[7] = 38.8909;
	x[6] = 36.7081;
	x[5] = 34.6478;
	x[4] = 32.7032;
	x[3] = 30.8677;
	x[2] = 29.1352;
	x[1] = 27.5000;
	return x[n];
}
function C4toHz(str) {
	return PKtoHz(C4toPK(str));
}

function StaffToC4(n, keySignature) {
	
	var pitch = null;
	
	switch (n)
	{
		case -17:
			pitch = 'G1'; break;
		case -16:
			pitch = 'A1'; break;
		case -15:
			pitch = 'B1'; break;
		case -14:
			pitch = 'C2'; break;
		case -13:
			pitch = 'D2'; break;
		case -12:
			pitch = 'E2'; break;
		case -11:
			pitch = 'F2'; break;
		case -10:
			pitch = 'G2'; break;
		case -9:
			pitch = 'A2'; break;
		case -8:
			pitch = 'B2'; break;
		case -7:
			pitch = 'C3'; break;
		case -6:
			pitch = 'D3'; break;
		case -5:
			pitch = 'E3'; break;
		case -4:
			pitch = 'F3'; break;
		case -3:
			pitch = 'G3'; break;
		case -2:
			pitch = 'A3'; break;
		case -1:
			pitch = 'B3'; break;
		case  0:
			pitch = 'C4'; break;
		case  1:
			pitch = 'D4'; break;
		case  2:
			pitch = 'E4'; break;
		case  3:
			pitch = 'F4'; break;
		case  4:
			pitch = 'G4'; break;
		case  5:
			pitch = 'A4'; break;
		case  6:
			pitch = 'B4'; break;
		case  7:
			pitch = 'C5'; break;
		case  8:
			pitch = 'D5'; break;
		case  9:
			pitch = 'E5'; break;
		case 10:
			pitch = 'F5'; break;
		case 11:
			pitch = 'G5'; break;
		case 12:
			pitch = 'A5'; break;
		case 13:
			pitch = 'B5'; break;
		case 14:
			pitch = 'C6'; break;
		case 15:
			pitch = 'D6'; break;
		case 16:
			pitch = 'E6'; break;
		case 17:
			pitch = 'F6'; break;
	}
	
	var sharps = [ 'F' , 'C' , 'G' , 'D' , 'A' , 'E' , 'B' ];
	var flats = [ 'B' , 'E' , 'A' , 'D' , 'G' , 'C' , 'F' ];
	
	var letter = pitch[0];
	
	if (keySignature > 0)
	{
		var index = sharps.indexOf(letter);
		
		if (index < keySignature)
		{
			pitch = pitch[0] + '#' + pitch[1];
		}
	}
	else if (keySignature < 0)
	{
		var index = flats.indexOf(letter);
		
		if (index < -keySignature)
		{
			pitch = pitch[0] + 'b' + pitch[1];
		}
	}
	
	return pitch;
}

var Music = {};
Music.CompileMatrix = CompileMatrix;
Music.CompileInstrument = CompileInstrument;
Music.MakeWav = MakeWav;
Music.ReadWav = ReadWav;
Music.DrawWave = DrawWave;
Music.Guitar2 = Guitar2;

Music.CompileNotes = CompileNotes;
Music.CompileGuitarTabs = CompileGuitarTabs;

Music.StaffToC4 = StaffToC4;

Music.HighPassFilter = HighPassFilter;
Music.LowPassFilter = LowPassFilter;

Music.DrawSheetMusic = DrawSheetMusic;

return Music;

}

if (typeof define === "function" && define.amd) {
    define(thisModule);
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisModule();
} else {
    this.Music = thisModule();
}

})();

