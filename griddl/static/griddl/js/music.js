
(function () {

function thisModule() {

var mAudioContext = null;

var window = window;
if (window && window.AudioContext) { mAudioContext = new AudioContext(); }
if (mAudioContext == null) { if (window && window.webkitAudioContext) { mAudioContext = new webkitAudioContext(); } }


var chords = {};
chords.diminished = [ 0, 3, 6 ];
chords.sus2 = [ 0, 2, 7 ];
chords.minor = [ 0, 3, 7 ];
chords.major = [ 0, 4, 7 ];
chords.sus4 = [ 0, 5, 7 ];
chords.augmented = [ 0, 4, 8 ];
chords.dominantSeventh = [ 0, 4, 7, 10 ];
chords.majorSeventh = [ 0, 4, 7, 11 ];
chords.minorSeventh = [ 0, 3, 7, 10 ];
chords.halfDiminishedSeventh = [ 0, 3, 6, 10 ];
chords.diminishedSeventh = [ 0, 3, 6, 9 ];
chords.majorMinorSeventh = [ 0, 3, 7, 11 ];
chords.augmentedMajorSeventh = [ 0, 4, 8, 11 ];
chords.augmentedSeventh = [ 0, 4, 8, 10 ];

var scales = {};
scales.majorScale = [ 0, 2, 4, 5, 7, 9, 11 ];
scales.minorScale = [ 0, 2, 3, 5, 7, 8, 10 ];
scales.harmonicMinorScale = [ 0, 2, 3, 5, 7, 8, 11 ];
scales.melodicMinorScale = [ 0, 2, 3, 5, 7, 9, 11 ];


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
		g.strokeStyle = 'rgb(0,0,0)';
		
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
		
		g.strokeStyle = 'rgb(0,0,0)';
		g.DrawLine(0.5+params.gridsLeft, 0, 0.5+params.gridsLeft, g.canvas.height);
		
		for (var i = 0; i < sixtCount; i++)
		{
			var y0 = 0;
			var y1 = g.canvas.height;
			var x = 0.5+params.gridsLeft+(i+1)*params.colWidth;
			
			if ((i+1) % (params.beatsPerMeasure * 4) == 0)
			{
				g.strokeStyle = 'rgb(0,0,0)';
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
		
		g.strokeStyle = 'rgb(0,0,0)';
		g.fillStyle = 'rgb(0,0,0)';
		
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


// Note = { sample : 'snare' or <pcms> , instrument : 'Piano' , amp : 3000 , freq : 440 , start : 13000 , duration : 2000 , etc. }
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

function CompileInstrument(notes, padding, globalSampleDict) {
	
	// we generate a dictionary like this, noting the max duration for each instrument/freq pair
	// keep the pcms field null for now (for instruments), we'll fill it in later
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
			
			var key = (typeof(note.instrument) == 'string') ? note.instrument + note.freq.toString() : note.instrument.name + note.freq.toString();
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
				//var pcms = Griddl.GetData(note.sample); // we need to do something else
				var pcms = globalSampleDict[note.sample].xs[0]; // assumes mono
				
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
			
			if (typeof(sample.instrument) == 'string')
			{
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
			}
			else
			{
				fn = sample.instrument;
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
function Violin(freq, amp, duration) {
	
	var basefreq = freq * Math.PI * 2;
	
	var echoDelays = [ 460 , 2000 ];
	var echoAmps = [ 0.50 , 0.30 ];
	
	var x = new Array(duration);
	
	for (var i = 0; i < duration; i++)
	{
		var t = i / 44100;
		var y = 0;
		
		var frq = basefreq * (1.0 + 0.00005*Math.cos(30.0*t)); // FM
		y += 1.0*Math.sin(1.0*frq*t);//*Math.exp(-0.0010*freq*t);
		y += 1.0*Math.sin(2.0*frq*t);//*Math.exp(-0.0010*freq*t);
		y += 0.4*Math.sin(3.0*frq*t);//*Math.exp(-0.0010*freq*t);
		y += 0.5*Math.sin(4.0*frq*t);//*Math.exp(-0.0010*freq*t);
		y += 1.0*Math.sin(5.0*frq*t);//*Math.exp(-0.0010*freq*t);
		y += 0.1*Math.sin(6.0*frq*t);//*Math.exp(-0.0010*freq*t);
		y += 0.1*Math.sin(7.0*frq*t);//*Math.exp(-0.0010*freq*t);
		y += 0.1*Math.sin(8.0*frq*t);//*Math.exp(-0.0010*freq*t);
		//y += 0.2*y*y*y;
		//y *= 0.9 + 0.1*Math.cos(10.0*t); // amplitude modulation
		//y = 2.0*y*Math.exp(-22.0*t) + y; // attack
		
		for (var k = 0; k < echoDelays.length; k++)
		{
			if (i > echoDelays[k])
			{
				y += x[i - echoDelays[k]] * echoAmps[k];
			}
		}
		
		x[i] = y;
	}
	
	for (var i = 0; i < duration; i++)
	{
		x[i] *= amp;
	}
	
	return x;
}

function Guitar2(params) {
	return Pluck(params.duration, PluckBang(params.freq));
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

function DrawWaveDriver(g, pcms) {
	
	var color = 'rgb(0,0,0)';
	var left = 10;
	var cy = 300;
	
	var pcmStart = 0;
	var pcmLength = 44100;
	var xPixelsPerStep = 1;
	var samplesPerStep = 10;
	var pcmsPerYPixel = 100;
	
	DrawWave(g, color, pcms, pcmStart, pcmLength, left, cy, xPixelsPerStep, samplesPerStep, pcmsPerYPixel);
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


function SampleSlicer(pcms) {
	
	var startSeconds = 1;
	var endSeconds = 2;
	var lengthSeconds = 1;
	//var lengthSeconds = endSeconds - startSeconds;
	
	var startSamples = Math.floor(startSeconds * 44100, 1);
	var lengthSamples = Math.floor(lengthSeconds * 44100, 1);
	
	var part = new Int16Array(lengthSamples);
	
	for (var i = 0; i < lengthSamples; i++)
	{
		part[i] = pcms[startSamples + i];
	}
	
	return part;
}

function PlayHarmonic() {
	
	var harmonicGrid = GetData('harmonics');
	var column = 'A';
	var harmonics = [];
	
	for (var i = 0; i < harmonicGrid.length; i++)
	{
		harmonics.push(parseFloat(harmonicGrid[i][column]));
	}
	
	var duration = Math.floor(44100 * 1.0, 1);
	var pcms = new Array(duration);
	var freq = 220 * Math.PI * 2;
	var amp = 2000;
	var envelope = {a:1000,d:1000,r:3000,peak:1.5};
	
	for (var i = 0; i < duration; i++)
	{
		var t = i / 44100;
		var pcm = globals.Harmonics(freq * t, harmonics);
		pcms[i] = pcm * amp * Asdr(i, duration, envelope);
	}
	
	Music.PlaySound(pcms);
}
function Asdr(t, totalLength, envelope) {
	
	// envelope = {a:100,d:100,r:100,peak:2.0}
	
	if (t < envelope.a)
	{
		return envelope.peak * (t / envelope.a);
	}
	
	if (t < (envelope.a + envelope.d))
	{
		return 1.0+(envelope.peak-1.0)*(1.0-((t-envelope.a)/envelope.d));
	}
	
	if (t < (totalLength - envelope.r))
	{
		return 1.0;
	}
	
	if (t < totalLength)
	{
		return 1.0-((t-(totalLength-envelope.r))/envelope.r);
	}
	
	return 0.0;
}
function Harmonics(freqt, harmonics) {
	
	var y = 0;
	
	var totalStrength = 0;
	
	for (var i = 0; i < harmonics.length; i++)
	{
		var overtone = i + 1;
		var strength = harmonics[i];
		totalStrength += strength;
		y += strength*Math.sin(overtone*freqt);
	}
	
	y /= totalStrength;
	
	return y;
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

var Conversion = {};
Conversion.ReadUi = function(b, k, n, little) {
	
	var x = 0;
	
	if (little)
	{
		var x = b.readUIntLE(k.k, n);
	}
	else
	{
		var x = b.readUIntBE(k.k, n);
	}
	
	k.k += n;
	
	return x;
	
	//var x = 0;
	//var mult = 1;
	//
	//if (little)
	//{
	//	for (var i = 0; i < n; i++)
	//	{
	//		x += mult * b[k.k++];
	//		mult *= 256;
	//	}
	//}
	//else
	//{
	//	for (var i = 0; i < n - 1; i++)
	//	{
	//		mult *= 256;
	//	}
	//
	//	for (var i = 0; i < n; i++)
	//	{
	//		x += mult * b[k.k++];
	//		mult /= 256;
	//	}
	//}
	//
	//return x;
};
Conversion.ReadSi = function(b, k, n, little) {
	
	var x = 0;
	
	if (little)
	{
		var x = b.readIntLE(k.k, n);
	}
	else
	{
		var x = b.readIntBE(k.k, n);
	}
	
	k.k += n;
	
	return x;
	
	//var x = ReadUi(b, k, n, little);
	//var y = CastUintToInt(x, n);
	//return y;
};
Conversion.ReadB = function(b, k, n) {
	
	var x = [];
	
	for (var i = 0; i < n; i++)
	{
		x.push(b.readUInt8(k.k++));
		//x.push(b[k.k++]);
	}
	
	return x;
};
Conversion.ReadS = function(b, k, n) {
	
	var s = b.toString('utf8', k.k, k.k + n);
	k.k += n;
	return s;
	
	//var x = '';
	//
	//for (var i = 0; i < n; i++)
	//{
	//	x += String.fromCharCode(b[k.k++]);
	//}
	//
	//return x;
};
function CastUintToInt(x, n) {
	
	if (n == 4 && x >= 0x80000000)
	{
		//return ((~x) + 1) * -1;
		return -1 * (0x100000000 - x); // does this work in javascript?
	}
	else if (n == 3 && x >= 0x800000)
	{
		return -1 * (0x1000000 - x);
	}
	else if (n == 2 && x >= 0x8000)
	{
		return -1 * (0x10000 - x);
	}
	else if (n == 1 && x >= 0x80)
	{
		return -1 * (0x100 - x);
	}
	else
	{
		return x;
	}
}

function ReadMidi(b) {
	
	var x = { header : null , tracks : [] };
	
	var k = {k:0};
	
	while (k.k < b.length)
	{
		//console.log('k.k : ' + k.k);
		var type = Conversion.ReadS(b, k, 4);
		var length = Conversion.ReadUi(b, k, 4, false);
		//console.log(type + ', length = ' + length);
		
		// var raw = []; for (var i = 0; i < length + 8; i++) { raw.push(b[k.k - 8 + i]); }
		if (type == "MThd")
		{
			x.header = ReadMidiHeaderChunk(b, k);
			// x.header.raw = raw;
		}
		else if (type == "MTrk")
		{
			x.tracks.push(ReadMidiTrackChunk(b, k, length));
			//track.raw = raw;
		}
		else
		{
			var unknown = Conversion.ReadB(b, k, length);
		}
	}
	
	ConvertToNotes(x);
	
	return x;
}
function ReadMidiHeaderChunk(b, k) {
	var x = {};
	x.format = Conversion.ReadUi(b, k, 2, false);
	x.tracks = Conversion.ReadUi(b, k, 2, false);
	x.division = Conversion.ReadUi(b, k, 2, false);
	return x;
}
function ReadMidiTrackChunk(b, k, length) {
	
	var x = { events : [] };
	var end = k.k + length;
	
	while (k.k < end)
	{
		x.events.push(ReadEvent(b, k));
	}
	
	return x;
}
var lastEventType = null;
function ReadEvent(b, k) {
	
	var x = {};
	x.deltaTime = ReadDeltaTime(b, k);
	
	var type = Conversion.ReadUi(b, k, 1);
	
	if ((type & 0xf0) == 0xf0)
	{
		if (type == 0xf0)
		{
			x.type = "sysEx";
			var length = ReadDeltaTime(b, k);
			x.data = Conversion.ReadB(b, k, length);
		}
		else if (type == 0xf7)
		{
			x.type = "dividedSysEx";
			var length = ReadDeltaTime(b, k);
			x.data = Conversion.ReadB(b, k, length);
		}
		else if (type == 0xff)
		{
			x.type = "meta";
			
			var subtype = Conversion.ReadUi(b, k, 1);
			var length = ReadDeltaTime(b, k);
			
			if (subtype == 0x00)
			{
				x.subtype = "sequenceNumber";
				if (length != 2) { throw new Error("Expected length for sequenceNumber event is 2, got " + length); }
				x.number = Conversion.ReadUi(b, k, 2); // big endian?
			}
			else if (subtype == 0x01)
			{
				x.subtype = "text";
				x.text = Conversion.ReadS(b, k, length);
			}
			else if (subtype == 0x02)
			{
				x.subtype = "copyrightNotice";
				x.text = Conversion.ReadS(b, k, length);
			}
			else if (subtype == 0x03)
			{
				x.subtype = "trackName";
				x.text = Conversion.ReadS(b, k, length);
			}
			else if (subtype == 0x04)
			{
				x.subtype = "instrumentName";
				x.text = Conversion.ReadS(b, k, length);
			}
			else if (subtype == 0x05)
			{
				x.subtype = "lyrics";
				x.text = Conversion.ReadS(b, k, length);
			}
			else if (subtype == 0x06)
			{
				x.subtype = "marker";
				x.text = Conversion.ReadS(b, k, length);
			}
			else if (subtype == 0x07)
			{
				x.subtype = "cuePoint";
				x.text = Conversion.ReadS(b, k, length);
			}
			else if (subtype == 0x20)
			{
				x.subtype = "midiChannelPrefix";
				if (length != 1) { throw new Error("Expected length for midiChannelPrefix event is 1, got " + length); }
				x.channel = Conversion.ReadUi(b, k, 1);
			}
			else if (subtype == 0x2f)
			{
				x.subtype = "endOfTrack";
				if (length != 0) { throw new Error("Expected length for endOfTrack event is 0, got " + length); }
			}
			else if (subtype == 0x51)
			{
				x.subtype = "setTempo";
				if (length != 3) { throw new Error("Expected length for setTempo event is 3, got " + length); }
				x.microSecondsPerBeat = Conversion.ReadUi(b, k, 3, false);
			}
			else if (subtype == 0x54)
			{
				x.subtype = "smpteOffset";
				if (length != 5) { throw new Error("Expected length for smpteOffset event is 5, got " + length); }
				var hourByte = Conversion.ReadUi(b, k, 1);
				
				var frameRateDict = {};
				frameRateDict[0x00] = 24;
				frameRateDict[0x20] = 25;
				frameRateDict[0x40] = 29;
				frameRateDict[0x60] = 30;
				
				x.frameRate = frameRateDict[(hourByte & 0x60)];
				x.hour = hourByte & 0x1f;
				x.min = Conversion.ReadUi(b, k, 1);
				x.sec = Conversion.ReadUi(b, k, 1);
				x.frame = Conversion.ReadUi(b, k, 1);
				x.subframe = Conversion.ReadUi(b, k, 1);
			}
			else if (subtype == 0x58)
			{
				x.subtype = "timeSignature";
				if (length != 4) { throw new Error("Expected length for timeSignature event is 4, got " + length); }
				
				x.numerator = Conversion.ReadUi(b, k, 1);
				x.denominator = Math.pow(2, Conversion.ReadUi(b, k, 1));
				x.metronome = Conversion.ReadUi(b, k, 1);
				x.thirtyseconds = Conversion.ReadUi(b, k, 1);
			}
			else if (subtype == 0x59)
			{
				x.subtype = "keySignature";
				if (length != 2) { throw new Error("Expected length for keySignature event is 2, got " + length); }
				x.key = Conversion.ReadSi(b, k, 1);
				x.scale = Conversion.ReadUi(b, k, 1);
			}
			else if (subtype == 0x7f)
			{
				x.subtype = "sequencerSpecific";
				x.data = Conversion.ReadB(b, k, length);
			}
			else
			{
				x.subtype = "unknown";
				x.data = Conversion.ReadB(b, k, length);
			}
		}
		else
		{
			throw new Error();
		}
	}
	else
	{
		x.type = "channel";
		
		var param1;
		if ((type & 0x80) == 0)
		{
			//running status - reuse lastEventTypeByte as the event type.
			//eventTypeByte is actually the first parameter
			
			param1 = type;
			type = lastEventType;
		}
		else
		{
			param1 = Conversion.ReadUi(b, k, 1);
			lastEventType = type;
		}
		
		var eventType = type >> 4;
		x.channel = type & 0x0f;
		
		if (eventType == 0x08)
		{
			x.subtype = "noteOff";
			x.noteNumber = param1;
			x.velocity = Conversion.ReadUi(b, k, 1);
		}
		else if (eventType == 0x09)
		{
			x.noteNumber = param1;
			var velocity = Conversion.ReadUi(b, k, 1);
			x.velocity = velocity;
			x.subtype = (velocity == 0) ? "noteOff" : "noteOn";
		}
		else if (eventType == 0x0a)
		{
			x.subtype = "noteAftertouch";
			x.noteNumber = param1;
			x.amount = Conversion.ReadUi(b, k, 1);
		}
		else if (eventType == 0x0b)
		{
			x.subtype = "controller";
			x.controllerType = param1;
			x.value = Conversion.ReadUi(b, k, 1);
		}
		else if (eventType == 0x0c)
		{
			x.subtype = "programChange";
			x.programNumber = param1;
		}
		else if (eventType == 0x0d)
		{
			x.subtype = "channelAftertouch";
			x.amount = param1;
		}
		else if (eventType == 0x0e)
		{
			x.subtype = "pitchBend";
			x.value = param1 + (Conversion.ReadUi(b, k, 1) << 7);
		}
		else
		{
			throw new Error("Unrecognised MIDI event type: " + eventType);
		}
	}
	
	return x;
}
function ReadDeltaTime(b, k) {
	
	var ns = [];
	
	while (true)
	{
		var n = Conversion.ReadUi(b, k, 1, false);
		ns.push(n);
	
		if (n < 0x80)
		{
			break;
		}
	}
	
	var result = 0;
	var mult = 1;
	
	for (var i = ns.length - 1; i >= 0; i--)
	{
		var value = (ns[i] % 0x80) * mult;
		result += value;
		mult *= 0x80;
	}
	
	return result;
}

var sharpsToScaleName = {};
sharpsToScaleName[0] = {};
sharpsToScaleName[1] = {};
sharpsToScaleName[0][-7] = "Cb Major";
sharpsToScaleName[0][-6] = "Gb Major";
sharpsToScaleName[0][-5] = "Db Major";
sharpsToScaleName[0][-4] = "Ab Major";
sharpsToScaleName[0][-3] = "Eb Major";
sharpsToScaleName[0][-2] = "Bb Major";
sharpsToScaleName[0][-1] = "F Major";
sharpsToScaleName[0][0] = "C Major";
sharpsToScaleName[0][1] = "G Major";
sharpsToScaleName[0][2] = "D Major";
sharpsToScaleName[0][3] = "A Major";
sharpsToScaleName[0][4] = "E Major";
sharpsToScaleName[0][5] = "B Major";
sharpsToScaleName[0][6] = "F# Major";
sharpsToScaleName[0][7] = "C# Major";
sharpsToScaleName[1][-7] = "Ab minor";
sharpsToScaleName[1][-6] = "Eb minor";
sharpsToScaleName[1][-5] = "Bb minor";
sharpsToScaleName[1][-4] = "F minor";
sharpsToScaleName[1][-3] = "C minor";
sharpsToScaleName[1][-2] = "G minor";
sharpsToScaleName[1][-1] = "D minor";
sharpsToScaleName[1][0] = "A minor";
sharpsToScaleName[1][1] = "E minor";
sharpsToScaleName[1][2] = "B minor";
sharpsToScaleName[1][3] = "F# minor";
sharpsToScaleName[1][4] = "C# minor";
sharpsToScaleName[1][5] = "G# minor";
sharpsToScaleName[1][6] = "D# minor";
sharpsToScaleName[1][7] = "A# minor";

var sharps = ["C8","B7","A#7","A7","G#7","G7","F#7","F7","E7","D#7","D7","C#7","C7","B6","A#6","A6","G#6","G6","F#6","F6","E6","D#6","D6","C#6","C6","B5","A#5","A5","G#5","G5","F#5","F5","E5","D#5","D5","C#5","C5","B4","A#4","A4","G#4","G4","F#4","F4","E4","D#4","D4","C#4","C4","B3","A#3","A3","G#3","G3","F#3","F3","E3","D#3","D3","C#3","C3","B2","A#2","A2","G#2","G2","F#2","F2","E2","D#2","D2","C#2","C2","B1","A#1","A1","G#1","G1","F#1","F1","E1","D#1","D1","C#1","C1","B0","A#0","A0"];

var flats = ["C8","B7","Bb7","A7","Ab7","G7","Gb7","F7","E7","Eb7","D7","Db7","C7","B6","Bb6","A6","Ab6","G6","Gb6","F6","E6","Eb6","D6","Db6","C6","B5","Bb5","A5","Ab5","G5","Gb5","F5","E5","Eb5","D5","Db5","C5","B4","Bb4","A4","Ab4","G4","Gb4","F4","E4","Eb4","D4","Db4","C4","B3","Bb3","A3","Ab3","G3","Gb3","F3","E3","Eb3","D3","Db3","C3","B2","Bb2","A2","Ab2","G2","Gb2","F2","E2","Eb2","D2","Db2","C2","B1","Bb1","A1","Ab1","G1","Gb1","F1","E1","Eb1","D1","Db1","C1","B0","Bb0","A0"];

function ConvertToNotes(midi) {
	
	var typecount = {};
	var subtypecount = {};
	
	// Dictionary<string, Dictionary<int, Stack<Note>>>
	var trackChannelDicts = {};
	
	var notes = [];
	
	midi.keySignatureEvents = [];
	midi.timeSignatureEvents = [];
	midi.tempoEvents = [];
	
	for (var i = 0; i < midi.tracks.length; i++)
	{
		var track = midi.tracks[i];
		var time = 0;
		
		for (var k = 0; k < track.events.length; k++)
		{
			var x = track.events[k];
			
			time += x.deltaTime;
			
			//if (typecount.ContainsKey([x.type])) { typecount[x.type]++; }
			//else { typecount[x.type] = 1; }
			
			if (x.type == "channel")
			{
				//if (subtypecount[x.subtype]) { subtypecount[x.subtype]++; }
				//else { subtypecount[x.subtype] = 1; }
				
				if (x.subtype == "noteOn" || x.subtype == "noteOff")
				{
					var trackChannelId = i.toString() + "-" + x.channel.toString();
					
					if (!trackChannelDicts[trackChannelId])
					{
						trackChannelDicts[trackChannelId] = {};
					}
					
					if (x.subtype == "noteOn")
					{
						var pitch = x.noteNumber;
						
						var note = {};
						note.start = time;
						note.amp = x.velocity;
						note.pitch = pitch;
						note.track = i;
						note.channel = x.channel;
						
						if (!trackChannelDicts[trackChannelId][pitch])
						{
							trackChannelDicts[trackChannelId][pitch] = [];
						}
						
						trackChannelDicts[trackChannelId][pitch].push(note);
					}
					
					if (x.subtype == "noteOff")
					{
						var pitch = x.noteNumber;
						
						if (!trackChannelDicts[trackChannelId][pitch])
						{
							throw new Error();
						}
						
						if (trackChannelDicts[trackChannelId][pitch].length == 0)
						{
							throw new Error();
						}
						
						var note = trackChannelDicts[trackChannelId][pitch].pop();
						note.end = time;
						
						notes.push(note);
						
						//if (note.track == 2)
						//{
						//    notes.push(note);
						//}
					}
				}
				else if (x.subtype == "controller")
				{
				
				}
				else if (x.subtype == "pitchBend")
				{
				
				}
				else if (x.subtype == "programChange")
				{
				
				}
				else if (x.subtype == "channelAftertouch")
				{
				
				}
				else
				{
					throw new Error('Unsupported subtype: ' + x.subtype);
				}
			}
			else if (x.type == "meta")
			{
				//if (!subtypecount.ContainsKey(x.subtype)) { subtypecount[x.subtype]++; }
				//else { subtypecount[x.subtype] = 1; }
				
				if (x.subtype == "midiChannelPrefix")
				{
				
				}
				else if (x.subtype == "setTempo")
				{
					midi.tempoEvents.push(x);
				}
				else if (x.subtype == "keySignature")
				{
					midi.keySignatureEvents.push(x);
				}
				else if (x.subtype == "timeSignature")
				{
					midi.timeSignatureEvents.push(x);
				}
				else if (x.subtype == "endOfTrack")
				{
				
				}
				else if (x.subtype == "unknown")
				{
				
				}
				else if (x.subtype == "copyrightNotice")
				{
				
				}
				else if (x.subtype == "trackName")
				{
					midi.name = x.text.toString().trim();
				}
				else if (x.subtype == "text")
				{
					var text = x.text.toString().trim();
				}
				else if (x.subtype == "sequencerSpecific")
				{
					var data = x.data;
				}
				else if (x.subtype == "marker")
				{
					var text = x.text.toString().trim();
				}
				else
				{
					throw new Error('Unsupported subtype: ' + x.subtype);
				}
			}
			else if (x.type == "sysEx")
			{
			
			}
			else
			{
				throw new Error('Unsupported type: ' + x.type);
			}
		}
	}
	
	midi.keySignature = "";
	for (var i = 0; i < midi.keySignatureEvents.length; i++)
	{
		var x = midi.keySignatureEvents[i];
		var key = x.key; // -7 = 7 flats, +7 = 7 sharps
		var scale = x.scale; // 0 = major, 1 = minor
		
		var scaleName = sharpsToScaleName[scale][key];
		
		midi.keySignature += scaleName;
	}
	
	midi.timeSignature = "";
	for (var i = 0; i < midi.timeSignatureEvents.length; i++)
	{
		var x = midi.timeSignatureEvents[i];
		var numerator = x.numerator;
		var denominator = x.denominator;
		var metronome = x.metronome;
		var thirtyseconds = x.thirtyseconds;
	}
	
	for (var i = 0; i < midi.tempoEvents.length; i++)
	{
		var x = midi.tempoEvents[i];
		
		// i think the bytes are being read wrong
		var microsecondsPerBeat = x.microSecondsPerBeat;
		var secondsPerBeat = microsecondsPerBeat / 1000000;
		var beatsPerSecond = 1 / secondsPerBeat;
		var beatsPerMinute = beatsPerSecond * 60;
		midi.bpm = beatsPerMinute;
	}
	
	midi.notes = notes;
}

function MakeTrackCharts(midi) {
	
	var notes = midi.notes;
	
	// Dictionary<string, List<Note>>
	var tracks = {};
	
	for (var i = 0; i < notes.length; i++)
	{
		var note = notes[i];
		var track = note.track;
		var trackstr = track.toString();
		
		if (!tracks[trackstr])
		{
			tracks[trackstr] = [];
		}
		
		tracks[trackstr].push(note);
	}
	
	// 7-color dict, 0 = 1
	//Dictionary<int, SolidBrush> notecolors = new Dictionary<int, SolidBrush>();
	//notecolors.Add(0, new SolidBrush(Color.FromArgb(0, 0, 0)));
	//notecolors.Add(1, new SolidBrush(Color.FromArgb(0, 0, 0)));
	//notecolors.Add(2, new SolidBrush(Color.FromArgb(0, 0, 0)));
	//notecolors.Add(3, new SolidBrush(Color.FromArgb(0, 0, 0)));
	//notecolors.Add(4, new SolidBrush(Color.FromArgb(0, 0, 0)));
	//notecolors.Add(5, new SolidBrush(Color.FromArgb(0, 0, 0)));
	//notecolors.Add(6, new SolidBrush(Color.FromArgb(0, 0, 0)));
	
	var colors = {};
	
	for (var i = 0; i < 88; i++)
	{
		//var note = sharps[87 - i];
		var note = flats[87 - i];
		colors[i] = synesthesia[note.substr(0, note.length - 1)];
	}
	
	// Dictionary<string, int[]>
	var minmax = {};
	for (var track in tracks)
	{
		var min = Number.MAX_VALUE;
		var max = Number.MIN_VALUE;
		
		for (var i = 0; i < tracks[track].length; i++)
		{
			var note = tracks[track][i]
			var pitch = 20 + note.pitch;
			if (pitch < min) { min = pitch; }
			if (pitch > max) { max = pitch; }
		}

		minmax[track] = [ min , max ];
	}

	var totalHeight = 0; // the sum of the ranges of notes over all tracks
	var trackHeights = {};
	for (var track in minmax)
	{
		var height = minmax[track][1] - minmax[track][0] + 1;
		trackHeights[track] = height;
		totalHeight += 1 + height;
	}
	totalHeight += 1;
	
	var barHeight = 20;
	var wd = 15000;
	var hg = barHeight * totalHeight;
	
	var baseHeight = barHeight;
	
	var svglines = [];
	svglines.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+wd+'" height="'+hg+'">');
	
	for (var track in tracks)
	{
		//string outfile = outfrag + " " + int.Parse(track).ToString("00") + ".png";
		//int wd = 15000;
		//int hg = 2000;
		var pxPerTick = 0.130;
		
		for (var i = 0; i < tracks[track].length; i++)
		{
			var note = tracks[track][i];
			var duration = note.end - note.start;
			
			// for drum tracks that have nominal duration
			//duration = 250;
			
			var top = hg - (baseHeight + (note.pitch - minmax[track][0]) * barHeight);
			var left = 20 + Math.floor(note.start * pxPerTick, 1);
			var width = Math.floor(duration * pxPerTick, 1);
			
			svglines.push(SvgHelper('rect', {fill:colors[note.pitch - 20],x:left,y:top,width:width,height:barHeight}));
			svglines.push(SvgHelper('text', {x:left,y:top+2}, flats[87 - (note.pitch - 20)]));
		}
		
		baseHeight += (trackHeights[track] + 1) * barHeight;
	}
	
	svglines.push('</svg>');
	
	return svglines.join('\n') + '\n';
}

function SvgHelper(tag, params, data) {
	
	var s = '<' + tag;
	
	for (var key in params)
	{
		s += ' ' + key + '="' + params[key] + '"';
	}
	
	if (!data) { data = ''; }
	
	s += '>' + data + '</' + tag + '>';
	
	return s;
}


function PlaceNoteOnStaff() {
	
	var params = {};
	params.gridsLeft = 100;
	params.gridsTop = 10;
	params.leftStaffPadding = 90;
	params.rightStaffPadding = 20;
	params.colWidth = 10;
	params.rowHeight = 6;
	params.highExtension = 2;
	params.lowExtension = 2;
	params.staffGap = 50;
	params.beatsPerMeasure = 4;
	params.measuresPerStaff = 4;
	params.measures = 10;
	params.beatsPerMinute = 80;
	params.keySignature = 1;
	
	$('canvas').on('click', function(e) {
		var rows = 21 + params.highExtension + params.lowExtension;
		var staffHeight = params.rowHeight * rows + params.staffGap;
		
		var x = e.offsetX;
		var y = e.offsetY;
		
		x -= params.gridsLeft;
		y -= params.gridsTop;
		
		var staff = Math.floor(y / staffHeight, 1);
		x -= staff * staffHeight;
		
		var col = Math.floor(x / params.colWidth, 1);
		var row = Math.floor(y / params.rowHeight, 1);
		
		var colsPerMeasure = params.beatsPerMeasure * 4;
		var staf = 10 + params.highExtension - row;
		var pitch = Music.StaffToC4(staf, params.keySignature);
		
		var measure = staff * params.measuresPerStaff + Math.floor(col / colsPerMeasure, 1);
		
		var sixt = col % colsPerMeasure;
		
		var note = {};
		note.row = row;
		note.pitch = pitch;
		note.measure = measure;
		note.sixt = sixt;
		note.type = Griddl.GetParams('state').currentNote;
		note.amp = 3000;
		note.instrument = 'Piano';
	});
}


var Music = {};
Music.CompileMatrix = CompileMatrix;
Music.CompileInstrument = CompileInstrument;
Music.MakeWav = MakeWav;
Music.ReadWav = ReadWav;
Music.DrawWaveDriver = DrawWaveDriver;
Music.DrawWave = DrawWave;
Music.Guitar2 = Guitar2;

Music.ReadMidi = ReadMidi;
Music.MakeTrackCharts = MakeTrackCharts;

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

