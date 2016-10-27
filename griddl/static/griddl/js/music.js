
var Music = (function () {

var Music = {};

var mAudioContext = null;

var window = window;
if (window && window.AudioContext) { mAudioContext = new AudioContext(); }
if (mAudioContext == null) { if (window && window.webkitAudioContext) { mAudioContext = new webkitAudioContext(); } }

var C4toPK = Music.C4toPK = function(str) { // PK = piano key, 1-indexed (so 1-88)
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
var PKtoC4 = Music.PKtoC4 = function(pk, sharp) {
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
var PKtoHz = Music.PKtoHz = function(n) {
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
var C4toHz = Music.C4toHz = function(str) {
	return PKtoHz(C4toPK(str));
}
var MidiPitchToC4 = Music.MidiPitchToC4 = function(n, sharp) {
	
	// midi pitch ranges from 0 to 127, with middle C (C4) at 60
	// but middle C is number 40 in the piano key (PK) system, so we have to subtract 20
	return PKtoC4(n - 20, sharp);
}
var MidiPitchToHz = Music.MidiPitchToHz = function(n) {
	
	// midi pitch ranges from 0 to 127, with middle C (C4) at 60
	// but middle C is number 40 in the piano key (PK) system, so we have to subtract 20
	return PKtoHz(n - 20);
}
var StaffToC4 = Music.StaffToC4 = function(n, keySignature) {
	
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
};

var chords = {};
chords.diminished = [ 0, 3, 6 ];
chords.sus2 =       [ 0, 2, 7 ];
chords.minor =      [ 0, 3, 7 ];
chords.major =      [ 0, 4, 7 ];
chords.sus4 =       [ 0, 5, 7 ];
chords.augmented =  [ 0, 4, 8 ];
chords.dominantSeventh =       [ 0, 4, 7, 10 ];
chords.majorSeventh =          [ 0, 4, 7, 11 ];
chords.minorSeventh =          [ 0, 3, 7, 10 ];
chords.halfDiminishedSeventh = [ 0, 3, 6, 10 ];
chords.diminishedSeventh =     [ 0, 3, 6,  9 ];
chords.majorMinorSeventh =     [ 0, 3, 7, 11 ];
chords.augmentedMajorSeventh = [ 0, 4, 8, 11 ];
chords.augmentedSeventh =      [ 0, 4, 8, 10 ];

var scales = Music.scales = {};
scales.majorScale =         [ 0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24 ];
scales.minorScale =         [ 0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20, 22, 24 ];
scales.harmonicMinorScale = [ 0, 2, 3, 5, 7, 8, 11, 12, 14, 15, 17, 19, 20, 23, 24 ];
scales.melodicMinorScale =  [ 0, 2, 3, 5, 7, 9, 11, 12, 14, 15, 17, 19, 21, 22, 24 ];

// pka = keyBase + scales.majorScale[a-1]
// pkb = keyBase + scales.majorScale[b-1]
// pkc = keyBase + scales.majorScale[c-1]
var chordToScaleNumbers = Music.chordToScaleNumbers = {};
chordToScaleNumbers[1] = [ 1 , 3 ,  5 ];
chordToScaleNumbers[2] = [ 2 , 4 ,  6 ]; // the 2 can be followed by many chords, and is a good pre-cadence chord (eg 2 -> 5 -> 1)
chordToScaleNumbers[3] = [ 3 , 5 ,  7 ]; // the 3 should be followed by the 4 or the 6
chordToScaleNumbers[4] = [ 4 , 6 ,  8 ];
chordToScaleNumbers[5] = [ 5 , 7 ,  9 ];
chordToScaleNumbers[6] = [ 6 , 8 , 10 ];
chordToScaleNumbers[7] = [ 7 , 9 , 11 ];
chordToScaleNumbers['I'] = chordToScaleNumbers[1];
chordToScaleNumbers['ii'] = chordToScaleNumbers[2];
chordToScaleNumbers['iii'] = chordToScaleNumbers[3];
chordToScaleNumbers['IV'] = chordToScaleNumbers[4];
chordToScaleNumbers['V'] = chordToScaleNumbers[5];
chordToScaleNumbers['vi'] = chordToScaleNumbers[6];
chordToScaleNumbers['vii'] = chordToScaleNumbers[7];

chordToScaleNumbers['I6'] = [ 3 , 5 , 8 ];
chordToScaleNumbers['ii6'] = [ 4 , 6 , 9 ];
chordToScaleNumbers['IV6'] = [ 6 , 8 , 11 ];
chordToScaleNumbers['V6'] = [ 7 , 9 , 12 ];
chordToScaleNumbers['I64'] = [ 5 , 8 , 10 ];
chordToScaleNumbers['iii64'] = [ 7 , 10 , 12 ];

chordToScaleNumbers['IV/I'] = [ 1 , 4 , 6 ]; // pedal harmony - keep bass on the 1, grounds it, doesn't move from home base much
chordToScaleNumbers['V/I'] = [ 1 , 5 , 7 , 9 ];

// pedal 6 (eg Eye of the Tiger) - some songs use the vi as the base, and often use a pedal 6 to create a drone
chordToScaleNumbers['iii/6'] = [ 3 , 5 , 6 , 7 ]; // 
chordToScaleNumbers['IV/6'] = [ 4 , 6 , 8 ]; // um, the IV already has the 6?  so is it an octave lower or what?
chordToScaleNumbers['V/6'] = [ 5 , 6 , 7 , 9 ];

var John_Mayer__The_Heart_of_Life = ['V','I','IV','I6','IV','I6','V','I'];
var Kenny_Chesney__The_Road_And_The_Radio = ['I','I6','IV','V','I','I6','IV','V'];
var Carrie_Underwood__All_American_Girl = ['IV','I6','ii','I6','IV','I6','ii','I6','IV','I6','ii','V'];
var Eric_Clapton__Wonderful_Tonight = ['I','V6','IV','V'];

var ChordToC4 = Music.ChordToC4 = function(chord, key) {
	
	// ChordToC4('I','C4') => ['C4','E4','G4']
	
	var basepk = C4toPK(key);
	
	var scaleNumbers = chordToScaleNumbers[chord];
	
	var pks = scaleNumbers.map(n => basepk + scales.majorScale[n-1]);
	var c4s = pks.map(pk => PKtoC4(pk));
	//var hzs = c4s.map(c4 => C4ToHz(c4));
	
	return c4s;
};
var ChangesToC4 = Music.ChangesToC4 = function(changes, key) {
	
	// ChangesToC4([6,4,1,5],'C4') => [['A4','C5','E5'],['F4','A4','C5'],['C4','E4','G4'],['G4','B4','D5']]
	
	var c4ss = [];
	changes.forEach(function(chord) {
		c4ss.push(ChordToC4(chord, key));
	});
	return c4ss;
};

// nomenclature:
// pitch = 'C4';
// pk = 40
// sixt = 4 (= 4 sixteenth notes = quarter note)
// sample = 44100

var C4ssToNotes = Music.C4ssToNotes = function(params) {
	
	// params.rhythm = [[4,4,4,4],[4,4,4,4],[4,4,4,4],[4,4,4,4]]
	// params.pitch = [['A4','C5','E5'],['F4','A4','C5'],['C4','E4','G4'],['G4','B4','D5']]
	
	// this is pretty agnostic as to the datatype of the pitch and rhythm entries
	
	// the main purpose is to mux the pitches and rhythms - each pair of parallel sub-lists (indexed by i) are cartesian multiplied together
	
	var notes = [];
	
	var start = 0;
	
	for (var i = 0; i < params.pitch.length; i++)
	{
		for (var k = 0; k < params.rhythm[i].length; k++)
		{
			for (var j = 0; j < params.pitch[i].length; j++)
			{
				var note = {};
				note.pitch = params.pitch[i][j];
				note.duration = params.rhythm[i][k];
				note.start = start;
				notes.push(note);
			}
			
			start += params.rhythm[i][k];
		}
	}
	
	return notes;
};

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

var guitarStringToPK = {e:44,B:39,G:35,D:30,A:25,E:20};

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

// browser stuff
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
function DownloadWav() {
	var totalpcms = CompileSong();
	var wav = MakeWav(totalpcms);
	var downloadLink = document.createElement('a');
	var url = (window.webkitURL != null ? window.webkitURL : window.URL);
	downloadLink.href = url.createObjectURL(new Blob([ wav ]));
	downloadLink.download = 'song.wav';
	downloadLink.click();
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
	
	var canvas = document.getElementsByTagName('canvas')[0];
	
	canvas.onmouseclick = function(e) {
		
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
	};
}
var AudioBufferToDataUrl = Music.AudioBufferToDataUrl = function(audioBuffer) {
	var uint8Array = AudioBufferToWavUint8Array(audioBuffer);
	var dataUrl = window.URL.createObjectURL(new Blob([uint8Array])); // this seems to not work
	return dataUrl;
};
var AudioBufferToWavUint8Array = Music.AudioBufferToWavUint8Array = function(audioBuffer) {
	
	var float32Array0 = audioBuffer.getChannelData(0); // [-1,+1]
	var float32Array1 = audioBuffer.getChannelData(1); // [-1,+1]
	
	var int16Array = new Int16Array(float32Array0.length);
	
	var n = 3000;
	
	for (var i = 0; i < float32Array0.length; i++)
	{
		int16Array[i] = Math.floor(float32Array0[i] * n, 1);
	}
	
	var uint8Array = Music.MakeWav(int16Array); // need to change to support stereo
	return uint8Array;
};

// used in CompileInstrument
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

// generalized instruments
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
function Reverb(x, delayAmps) {
	
	// x = Float32Array, delayAmps = [ { delay : 1000 , amp : 0.1 } , { delay : 10000 , amp : 0.02 } ]
	
	var y = new Float32Array(x.length); // in theory we should extend the output by the maximum delay
	
	for (var i = 0; i < x.length; i++)
	{
		var sum = x[i];
		
		delayAmps.forEach(function(delayAmp) {
			
			if (delayAmp.delay > i)
			{
				sum += x[i - delayAmp.delay] * delayAmp.amp;
			}
		});
		
		y[i] = sum;
	}
	
	return y;
}


// optimization utility
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

var HighPassFilter = Music.HighPassFilter = function(pcms, dt, rc) {
	
	var output = new Int16Array(pcms.length);
	var alpha = rc / (rc + dt);
	output[0] = pcms[0];
	
	for (var i = 1; i < pcms.length; i++)
	{
		output[i] = alpha * output[i - 1] + alpha * (pcms[i] - pcms[i - 1]);
	}
	
	return output;
};
var LowPassFilter = Music.LowPassFilter = function(samples, dt, rc) {
	
	var output = new Float32Array(samples.length);
	
	var alpha = dt / (rc + dt);
	output[0] = samples[0];
	
	for (var i = 1; i < samples.length; i++)
	{
		output[i] = (1 - alpha) * output[i - 1] + alpha * samples[i];
	}
	
	return output;
};

var Instruments = {};
var Piano = Instruments.Piano = function(params) {
	
	//var amp = params.amp;
	var freq = params.freq * Math.PI * 2;
	var duration = params.duration;
	
	var x = new Float32Array(duration);
	
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
		//y *= amp;
		x[i] = y;
	}
	
	return x;
};
var Guitar2 = Instruments.Guitar = function(params) {
	
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
	
	return Pluck(params.duration, PluckBang(params.freq));
};
var Violin = Instruments.Violin = function(params) {
	
	//var amp = params.amp;
	var freq = params.freq;
	var duration = params.duration;
	
	var basefreq = freq * Math.PI * 2;
	
	var echoDelays = [ 460 , 2000 ];
	var echoAmps = [ 0.50 , 0.30 ];
	
	var x = new Float32Array(duration);
	
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
	
	// for (var i = 0; i < duration; i++) { x[i] *= amp; }
	
	return x;
};
var Drum = Instruments.Drum = function(params) {
	
	var grad = function(n, x) {
		
		n = (n << 13) ^ n;
		n = (n * (n * n * 15731 + 789221) + 1376312589);
		var res = x;
		
		if (n & 0x20000000) 
		{
			res = -x;
		}
		
		return res;
	};
	
	function Noise(x) {
		var i = Math.floor(x);
		var f = x - i;
		var w = f*f*f*(f*(f*6.0-15.0)+10.0);
		var a = grad( i+0, f+0.0 );
		var b = grad( i+1, f-1.0 );
		return a + (b-a)*w;
	}
	
	//var amp = params.amp;
	var freq = params.freq;
	var duration = params.duration;
	
	var x = new Float32Array(duration);
	
	for (var i = 0; i < duration; i++)
	{
		var t = i / 44100;
		var y = 0;
		y += 0.5*Noise(32000*t)*Math.exp(-32*t);
		y += 2.0*Noise(3200*t)*Math.exp(-32*t);
		y += 3.0*Math.cos(400*(1-t)*t)*Math.exp(-4*t);
		//y *= amp;
		x[i] = y;
	}
	
	return x;
};
var OldGuitar = Instruments.OldGuitar = function(params) {
	
	var freq = params.freq;
	var duration = params.duration;
	
	var x = new Float32Array(duration);
	
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
var Synth = Instruments.Synth = function(params) {
	
	//var amp = params.amp;
	var freq = params.freq;
	var duration = params.duration;
	
	var x = new Float32Array(duration);
	
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
		
		//y *= amp;
		x[i] = y;
	}
	
	return x;
};
var LowPassGuitar = Instruments.LowPassGuitar = function(params) { return LowPassFilter(Guitar2(params), 0.1, 0.9); };



function UseBufferSource() {
	
	// https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
	
	var ctx = new AudioContext();
	
	var src = ctx.createBufferSource();
	
	// load audio file from server
	var filename = 'Propellers - Midnight Kiss.mp3';
	
	var request = new XMLHttpRequest();
	request.open('GET', filename, true);
	request.responseType = 'arraybuffer';
	
	request.onload = function() {
		
		var arrayBuffer = request.response;
		
		ctx.decodeAudioData(arrayBuffer, function(decodedData) {
			src.buffer = decodedData;
			src.connect(ctx.destination);
			src.start();
		});
	};
	
	request.send();
	
	
	// create white noise AudioBuffer
	//var channels = 2;
	//var seconds = 2.5;
	//var audioBuffer = ctx.createBuffer(channels, ctx.sampleRate * seconds, ctx.sampleRate); // createBuffer(channels, samples, sampleRate)
	//
	//for (var channel = 0; channel < channels; channel++)
	//{
	//	var arrayBuffer = audioBuffer.getChannelData(channel);
	//	
	//	for (var i = 0; i < arrayBuffer.length; i++)
	//	{
	//		arrayBuffer[i] = Math.random() * 2 - 1; // [-1,+1]
	//	}
	//}
	//
	//src.buffer = audioBuffer;
	//src.connect(ctx.destination);
	//src.start();
}
function UseOscillator() {
	
	// https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
	var ctx = new AudioContext();
	
	// https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode
	var osc = ctx.createOscillator();
	//osc.type = 'sine'; // sine (default), square, sawtooth, etc.
	//osc.detune.value = 1;
	
	// https://developer.mozilla.org/en-US/docs/Web/API/AudioParam
	osc.frequency.value = 440;
	osc.frequency.setValueAtTime(330, ctx.currentTime + 1);
	osc.frequency.setTargetAtTime(330, ctx.currentTime + 1, 0.5);
	osc.frequency.linearRampToValueAtTime(330, ctx.currentTime + 1);
	osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 1);
	osc.frequency.setValueCurveAtTime(new Float32Array([0.5, 1.0, 0.8, 0.5]), ctx.currentTime + 1, 3); // last param = duration across whole curve
	osc.frequency.cancelScheduledValues(ctx.currentTime + 1);
	
	// osc.setPeriodicWave(PeriodicWave wave); // see UsePeriodicWave()
	
	
	osc.onended = function(e) { }; // this can be used to give a progress bar when compiling audio
	
	osc.connect(ctx.destination);
	
	osc.start(0);
	osc.stop(2);
}
function UseBiquadFilter() {

	// https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode
	
	var ctx = new AudioContext();
	
	var biquadFilter = ctx.createBiquadFilter();
	biquadFilter.type = 'bandpass';
	biquadFilter.frequency.value = 220;
	biquadFilter.Q.value = 100;
	
	// getFrequencyResponse is used to test what the biquadFilter will do to given frequencies
	var myFrequencyArray = new Float32Array(5);
	myFrequencyArray[0] = biquadFilter.frequency.value - 20;
	myFrequencyArray[1] = biquadFilter.frequency.value - 10;
	myFrequencyArray[2] = biquadFilter.frequency.value;
	myFrequencyArray[3] = biquadFilter.frequency.value + 10;
	myFrequencyArray[4] = biquadFilter.frequency.value + 20;
	var magResponseOutput = new Float32Array(5);
	var phaseResponseOutput = new Float32Array(5);
	biquadFilter.getFrequencyResponse(myFrequencyArray, magResponseOutput, phaseResponseOutput);
	
	var source = ctx.createBufferSource();
	source.buffer = buffer;
	
	source.connect(biquadFilter);
	biquadFilter.connect(ctx.destination);
	
	source.start();
}
function UseScriptProcessor() {
	
	// https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode
	
	var context = new AudioContext();
	var scriptNode = context.createScriptProcessor(16384, 1, 1); // 256, 512, 1024, 2048, 4096, 8192 or 16384, input channels, output channels
	
	var source = context.createBufferSource();
	source.buffer = context.createBuffer(1, 16384, 44100); // empty buffer - numOfChannels, length (in samples), sampleRate (=44100)
	
	scriptNode.onaudioprocess = function(audioProcessingEvent) {
		
		var inputBuffer = audioProcessingEvent.inputBuffer;
		var outputBuffer = audioProcessingEvent.outputBuffer;
		
		for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++)
		{
			var inputData = inputBuffer.getChannelData(channel);
			var outputData = outputBuffer.getChannelData(channel);
			
			var pcms = Music.Piano({amp:0.3,freq:330,duration:16384});
			
			var min = +100;
			var max = -100;
			
			for (var i = 0; i < inputBuffer.length; i++)
			{
				if (pcms[i] < min)
				{
					min = pcms[i];
				}
				
				if (pcms[i] > max)
				{
					max = pcms[i];
				}
			}
			
			for (var sample = 0; sample < inputBuffer.length; sample++)
			{
				outputData[sample] = pcms[sample]; // for some reason, this assignment isn't taking.  the line get executed, the outputData doesn't change
			}
		}
	};
	
	source.connect(scriptNode);
	scriptNode.connect(context.destination);
	source.start();
	
	setTimeout(function() {
		source.disconnect(scriptNode);
		scriptNode.disconnect(context.destination);
	}, 4000);
}
function UseAnalyzer() {
	
	// https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode - FFT
	
	var ctx = new AudioContext();
	
	var src = ctx.createBufferSource();
	
	var analyser = ctx.createAnalyser();
	analyser.fftSize = 2048;
	//analyser.frequencyBinCount; // read only = fftSize/2 - basically the number of data values you will have to play with for the visualization
	//analyser.minDecibels = 10.0; // [??,-30] - minimum power value in the scaling range for the FFT analysis data, for conversion to unsigned byte values — basically, this specifies the minimum value for the range of results when using getByteFrequencyData()
	//analyser.maxDecibels = 20.0; // maximum power value in the scaling range for the FFT analysis data, for conversion to unsigned byte values — basically, this specifies the maximum value for the range of results when using getByteFrequencyData()
	//analyser.smoothingTimeConstant; // the averaging constant with the last analysis frame — basically, it makes the transition between values over time smoother
	
	var canvas = document.getElementsByTagName('canvas')[0];
	var canvasCtx = canvas.getContext('2d');
	var imageData = canvasCtx.getImageData(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);
	
	LoadAndDecode(ctx, 'midis/Aerosmith - Dream On.mp3', function(buffer) {
		
		src.buffer = buffer;
		
		//var uint8Array = new Uint8Array(analyser.frequencyBinCount);
		//analyser.getByteFrequencyData(float32Array);
		//
		//var float32Array = new Float32Array(analyser.frequencyBinCount); // do we still use frequencyBinCount for time domain data?
		//analyser.getFloatTimeDomainData(float32Array);
		//
		//var uint8Array = new Uint8Array(analyser.frequencyBinCount);
		//analyser.getByteTimeDomainData(float32Array);
		
		src.connect(analyser);
		//analyser.connect(ctx.destination);
		
		src.start();
		//src.stop(ctx.currentTime + 5);
		
		var float32Array = new Float32Array(analyser.frequencyBinCount);
		var x = 0;
		var lastTime = 0;
		
		while (x < 1000)
		{
			var time = ctx.currentTime;
			
			if (time > lastTime)
			{
				lastTime += 0.1;
				
				//if (x == 0) { debugger; }
				
				analyser.getFloatFrequencyData(float32Array);
				
				for (var y = 0; y < imageData.height; y++)
				{
					var index = (y * imageData.width + x) * 4;
					
					var indexIntoFreqArray = float32Array.length - float32Array.length / 2 - y - 1;
					
					var db = float32Array[indexIntoFreqArray];
					var diff = db + 130; // rebase some threshold db to zero
					
					// make a heatmap of the db value for each bin
					var b = 255 - diff * 2;
					var g = 128 - Math.abs(diff - 60) * 2;
					var r = 0 + diff * 2;
					
					imageData.data[index + 0] = Math.max(0, Math.min(255, Math.floor(r, 1)));
					imageData.data[index + 1] = Math.max(0, Math.min(255, Math.floor(g, 1)));
					imageData.data[index + 2] = Math.max(0, Math.min(255, Math.floor(b, 1)));
					imageData.data[index + 3] = 255;
				}
				
				x++;
				//canvasCtx.putImageData(imageData, 0, 0);
			}
		}
		
		canvasCtx.putImageData(imageData, 0, 0);
	});
}
function UseConvolver() {
	
	// https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode - linear convolution, for reverb
	//  AudioBuffer buffer - the impulse response (1, 2, or 4 channels)
	//  bool normalize - scale by an equal-power normalization
	
	var ctx = new AudioContext();
	
	var osc = ctx.createOscillator();
	osc.frequency.value = 330;
	
	var convolver = ctx.createConvolver();
	
	LoadAndDecode(ctx, 'impulse-response-001.wav', function(buffer) {
		convolver.buffer = buffer;
		
		osc.connect(convolver);
		convolver.connect(ctx.destination);
		
		osc.start(0);
		osc.stop(3);
	});
}
function UsePanner() {
	
	var ctx = new AudioContext();
	
	// https://developer.mozilla.org/en-US/docs/Web/API/PannerNode - physics-based panning
	var panner = ctx.createPanner();
	panner.panningModel = 'HRTF'; // which spatialisation algorithm to use
	panner.distanceModel = 'inverse'; // which algorithm to use to reduce the volume of the audio source as it moves away from the listener
	panner.refDistance = 1; // reference distance for reducing volume as the audio source moves further from the listener
	panner.maxDistance = 10000; // maximum distance between the audio source and the listener, after which the volume is not reduced any further
	panner.rolloffFactor = 1; // how quickly the volume is reduced as the source moves away from the listener
	panner.coneInnerAngle = 360; // the angle, in degrees, of a cone inside of which there will be no volume reduction
	panner.coneOuterAngle = 0; // the angle, in degrees, of a cone outside of which the volume will be modulated by 'coneOuterGain'
	panner.coneOuterGain = 0; // the amount of volume modulation outside the cone defined by the coneOuterAngle attribute (0 = no volume)
	panner.setOrientation(1, 0, 0); // (needs clarification) the direction the audio source is playing in
	panner.setPosition(); // (needs clarification)
	
	// https://developer.mozilla.org/en-US/docs/Web/API/AudioListener
	//  dopplerFactor: 1
	//  speedOfSound: 343.3
	var listener = ctx.listener;
	listener.setOrientation(0, 0, -1, 0, 1, 0); // (needs clarification)
	listener.setPosition(); // (needs clarification)
	listener.setVelocity(); // (needs clarification)
}
function UseDynamicsCompressor() {
	
	// https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode - reduces clicks and distortions during mixing
	
	// The DynamicsCompressorNode interface provides a compression effect, which lowers the volume of the loudest parts of the signal in order to help prevent clipping and distortion that can occur when multiple sounds are played and multiplexed together at once. This is often used in musical production and game audio. DynamicsCompressorNode is an AudioNode that has exactly one input and one output; it is created using the AudioContext.createDynamicsCompressor method.
	//DynamicsCompressorNode.threshold Read only
	//Is a k-rate AudioParam representing the decibel value above which the compression will start taking effect.
	//DynamicsCompressorNode.knee Read only
	//Is a k-rate AudioParam containing a decibel value representing the range above the threshold where the curve smoothly transitions to the compressed portion.
	//DynamicsCompressorNode.ratio Read only
	//Is a k-rate AudioParam representing the amount of change, in dB, needed in the input for a 1 dB change in the output.
	//DynamicsCompressorNode.reduction Read only
	//Is a k-rate AudioParam representing the amount of gain reduction currently applied by the compressor to the signal.
	//DynamicsCompressorNode.attack Read only
	//Is a k-rate AudioParam representing the amount of time, in seconds, required to reduce the gain by 10 dB.
	//DynamicsCompressorNode.release Read only
	//Is a k-rate AudioParam representing the amount of time, in seconds, required to increase the gain by 10 dB.
	var source = ctx.createMediaElementSource(myAudio);
	var compressor = ctx.createDynamicsCompressor();
	compressor.threshold.value = -50;
	compressor.knee.value = 40;
	compressor.ratio.value = 12;
	compressor.reduction.value = -20;
	compressor.attack.value = 0;
	compressor.release.value = 0.25;
	source.connect(compressor);
	compressor.connect(ctx.destination);
}
function UseWaveShaper() {
	
	// https://developer.mozilla.org/en-US/docs/Web/API/WaveShaperNode - distortion
	//   Float32Array curve - describes the distortion to apply
	//   string oversample - '2x', '4x', etc? - up-sample before applying the distortion effect
	
	var ctx = new AudioContext();
	
	var osc = ctx.createOscillator();
	
	function makeDistortionCurve(amount) {
		
		var k = typeof amount === 'number' ? amount : 50;
		var n_samples = 44100;
		var curve = new Float32Array(n_samples);
		var deg = Math.PI / 180;
		
		for (var i = 0; i < n_samples; i++)
		{
			var x = i * 2 / n_samples - 1;
			curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
		}
		
		return curve;
	}
	
	var distortion = ctx.createWaveShaper();
	distortion.curve = makeDistortionCurve(400);
	distortion.oversample = '4x';
	
	osc.connect(distortion);
	distortion.connect(ctx.destination);
	
	osc.start();
	osc.stop(2);
}
function UsePeriodicWave() {
	
	// https://developer.mozilla.org/en-US/docs/Web/API/PeriodicWave
	
	// AudioContext.createPeriodicWave(Float32Array real, Float32Array imag) => PeriodicWave
	// OscillatorNode.setPeriodicWave(PeriodicWave wave)
	
	// The first value is the DC offset, which is the value at which the oscillator starts
	// 0 is good here, because we want to start the curve at the middle of the [-1,+1] range
	//
	// The second and subsequent values are sine and cosine components.
	// You can think of it as the result of a Fourier transform, where you get frequency domain values from time domain value.
	// Here, with createPeriodicWave(), you specify the frequencies,
	// and the browser performs a an inverse Fourier transform to get a time domain buffer for the frequency of the oscillator.
	// Here, we only set one component at full volume (1.0) on the fundamental tone, so we get a sine wave.
	
	// The coefficients of the Fourier transform should be given in ascending order (i.e. (a+bi)ei,(c+di)e2i,(f+gi)e3ietc.) and can be positive or negative. 
	
	var ctx = new AudioContext();
	
	var real = new Float32Array(2);
	var imag = new Float32Array(2);
	real[0] = 0;
	imag[0] = 0;
	real[1] = 1;
	imag[1] = 0;
	var wave = ctx.createPeriodicWave(real, imag);
	
	var osc = ctx.createOscillator();
	osc.setPeriodicWave(wave);
	
	osc.connect(ctx.destination);
	
	osc.start();
	osc.stop(2);
}
function UseDelay() {
	
	// https://developer.mozilla.org/en-US/docs/Web/API/DelayNode - add delay between input node and output node (necessary for graph cycles)
	
	var ctx = new AudioContext();
	
	var osc = ctx.createOscillator();
	
	var delay = ctx.createDelay();
	delay.delayTime.value = 3.0;
	
	osc.connect(delay);
	delay.connect(ctx.destination);
	
	osc.start(0);
	osc.stop(2);
}
function UseGain() {
	
	// https://developer.mozilla.org/en-US/docs/Web/API/GainNode
	
	var ctx = new AudioContext();
	
	var osc = ctx.createOscillator();
	
	var gain = ctx.createGain();
	gain.gain.value = 1;
	
	osc.connect(gain);
	gain.connect(ctx.destination);
	
	osc.start(0);
	osc.stop(2);
}
function UseStereoPanner() {
	
	// https://developer.mozilla.org/en-US/docs/Web/API/StereoPannerNode - simple left-right panning
	
	var ctx = new AudioContext();
	
	var osc = ctx.createOscillator();
	
	var pan = ctx.createStereoPanner();
	pan.pan.value = -0.5; // [-1,+1]
	
	osc.connect(pan);
	pan.connect(ctx.destination);
	
	osc.start(0);
	osc.stop(2);
}
function UseBiquadFilter(buffer) {
	
	// https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode
	
	var ctx = new AudioContext();
	
	var source = ctx.createBufferSource();
	source.buffer = buffer;
	
	for (var i = 0; i < 1; i++)
	{
		var biquadFilter = ctx.createBiquadFilter();
		biquadFilter.type = 'bandpass';
		biquadFilter.frequency.value = 220;
		biquadFilter.Q.value = 100;
		
		var myFrequencyArray = new Float32Array(5);
		myFrequencyArray[0] = biquadFilter.frequency.value - 20;
		myFrequencyArray[1] = biquadFilter.frequency.value - 10;
		myFrequencyArray[2] = biquadFilter.frequency.value;
		myFrequencyArray[3] = biquadFilter.frequency.value + 10;
		myFrequencyArray[4] = biquadFilter.frequency.value + 20;
		var magResponseOutput = new Float32Array(5);
		var phaseResponseOutput = new Float32Array(5);
		biquadFilter.getFrequencyResponse(myFrequencyArray, magResponseOutput, phaseResponseOutput);
		
		console.log(magResponseOutput);
		console.log(phaseResponseOutput);
		
		source.connect(biquadFilter);
		biquadFilter.connect(ctx.destination);
	}
	
	source.start();
}

function Play(context, offline) {
	
	if (complete == 88)
	{
		var source = offline.createBufferSource();
		source.buffer = buffers.A0;
		source.connect(offline.destination);
		source.start(1);
		
		var source = offline.createBufferSource();
		source.buffer = buffers.C1;
		source.connect(offline.destination);
		source.start(1.5);
		
		var source = offline.createBufferSource();
		source.buffer = buffers.E1;
		source.connect(offline.destination);
		source.start(2);
		
		//for (var i = 0; i < 10; i++)
		//{
		//	offline.createBufferSource();
		//}
		
		offline.oncomplete = function(ev) {
			
			var source = context.createBufferSource(); 
			source.buffer = ev.renderedBuffer;
			source.connect(context.destination);
			source.start();
			
			//var audioBuffer = ev.renderedBuffer;
			//var n = audioBuffer.numberOfChannels;
			//var float32Array0 = audioBuffer.getChannelData(0); // [-1,+1]
			//var float32Array1 = audioBuffer.getChannelData(1); // [-1,+1]
			
			//var int16Array = new Int16Array(float32Array0.length);
			//
			//var n = 3000;
			//
			//for (var i = 0; i < float32Array0.length; i++)
			//{
			//	int16Array[i] = Math.floor(float32Array0[i] * n, 1);
			//}
			//
			//var uint8Array = Music.MakeWav(int16Array);
			//Download('song.wav', uint8Array);
		};
		
		offline.startRendering();
	}
}
function RenderOffline() {
	
	var context = new AudioContext();
	var offline = new OfflineAudioContext(2, 10*44100, 44100);
	
	function addOsc(frequency, start, length) {
		// start and length are in seconds
		var osc = offline.createOscillator();
		//osc.type = type;
		osc.frequency.value = frequency;
		osc.connect(offline.destination);
		osc.start(start);
		osc.stop(start+length);
	}
	
	function Piano(freq, start, duration) {
		//y += 0.6*Math.sin(1.0*freq*t)*Math.exp(-0.0008*freq*t);
		//y += 0.3*Math.sin(2.0*freq*t)*Math.exp(-0.0010*freq*t);
		//y += 0.1*Math.sin(4.0*freq*t)*Math.exp(-0.0015*freq*t);
		//y += 0.2*y*y*y;
		//y *= 0.9 + 0.1*Math.cos(70.0*t);
		//y = 2.0*y*Math.exp(-22.0*t) + y;
		
		addOsc(1 * freq, start, duration);
		addOsc(2 * freq, start, duration);
		addOsc(3 * freq, start, duration);
		addOsc(4 * freq, start, duration);
	}
	
	offline.oncomplete = function(ev) {
		
		var source = context.createBufferSource(); 
		source.buffer = ev.renderedBuffer;
		
		var audioBuffer = ev.renderedBuffer;
		//var n = audioBuffer.numberOfChannels;
		var float32Array0 = audioBuffer.getChannelData(0); // [-1,+1]
		var float32Array1 = audioBuffer.getChannelData(1); // [-1,+1]
		
		//source.connect(context.destination);
		//source.start(0);
		
		var int16Array = new Int16Array(float32Array0.length);
		
		var n = 3000;
		
		for (var i = 0; i < float32Array0.length; i++)
		{
			int16Array[i] = Math.floor(float32Array0[i] * n, 1);
		}
		
		var uint8Array = Music.MakeWav(int16Array);
		Download('song.wav', uint8Array);
	};
	
	offline.startRendering();
}


function Download(filename, uint8Array) {
	var downloadLink = document.createElement('a');
	downloadLink.href = window.URL.createObjectURL(new Blob([uint8Array])); // or readAsBase64?
	downloadLink.download = filename;
	downloadLink.click();
}
function Upload() {
	
	// this client-side code is straightforward, but the server-side code doesn't work yet
	// (and so i can't be certain that the client-side code is correct)
	
	var request = new XMLHttpRequest();
	request.open('POST', '/upload', true);
	var fileParts = ['<a id="a"><b id="b">hey!</b></a>'];
	var blob = new Blob(fileParts, {type : 'text/html'}); // https://developer.mozilla.org/en-US/docs/Web/API/Blob
	request.send(blob);
}

// these are high level functions that load assets and then play music, and they need to be disentangled
function Base64StringToUint8Array(str) {
	
	function b64ToUint6(nChr) {
		return nChr > 64 && nChr < 91 ?
			nChr - 65
		: nChr > 96 && nChr < 123 ?
			nChr - 71
		: nChr > 47 && nChr < 58 ?
			nChr + 4
		: nChr === 43 ?
			62
		: nChr === 47 ?
			63
		:
			0;
	}
	
	var nBlocksSize = 3;
	var sB64Enc = str.replace(/[^A-Za-z0-9\+\/]/g, ""); // remove all non-eligible characters from the string
	var nInLen = sB64Enc.length;
	var nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2;
	var taBytes = new Uint8Array(nOutLen);
	
	for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++)
	{
		nMod4 = nInIdx & 3;
		nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
		
		if (nMod4 === 3 || nInLen - nInIdx === 1)
		{
			for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++)
			{
				taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
			}
			
			nUint24 = 0;
		}
	}
	
	return taBytes;
}
function Decode() {
	
	var complete = 0;
	var buffers = {};
	
	var context = new AudioContext();
	var offline = new OfflineAudioContext(2, 10*44100, 44100);
	
	for (var key in MIDI.Soundfont.acoustic_bass)
	{
		var uint8Array = Base64StringToUint8Array(MIDI.Soundfont.acoustic_bass[key].substr(22));
		var compressedBuffer = uint8Array.buffer;
		
		(function (thekey) {
			context.decodeAudioData(compressedBuffer, function(decodedData) {
				buffers[thekey] = decodedData;
				complete++;
				Play(context, offline);
			});
		})(key);
	}
}
function LoadScripts(ctx, instrumentNames, callback) {
	
	var buffers = {};
	
	function Decode() {
		
		var toComplete = instrumentNames.length * 88;
		var completed = 0;
		
		for (var i = 0; i < instrumentNames.length; i++)
		{
			var instrumentName = instrumentNames[i];
			buffers[instrumentName] = {};
			
			for (var key in MIDI.Soundfont[instrumentName])
			{
				var uint8Array = Base64StringToUint8Array(MIDI.Soundfont[instrumentName][key].substr(22));
				var compressedBuffer = uint8Array.buffer;
				
				(function(thekey, thename) {
					ctx.decodeAudioData(compressedBuffer, function(decodedData) {
						buffers[thename][thekey] = decodedData;
						completed++;
						if (completed == toComplete) { callback(ctx, buffers); }
					});
				})(key, instrumentName);
			}
		}
	}
	
	var n = 0;
	
	for (var i = 0; i < instrumentNames.length; i++)
	{
		var script = document.createElement('script');
		document.body.appendChild(script);
		
		script.onload = function(e) {
			n += 1;
			if (n == instrumentNames.length)
			{
				Decode();
			}
		};
		
		script.src = 'soundfont/' + instrumentNames[i] + '-mp3.js';
	}
}
function ProcessMidi(midi) {
	
	var instrumentDict = {};
	instrumentDict[1] = 'electric_guitar_clean';
	instrumentDict[2] = 'distortion_guitar';
	instrumentDict[3] = 'electric_bass_pick';
	instrumentDict[4] = 'alto_sax';
	instrumentDict[5] = 'percussive_organ';
	var instrumentList = []; for (var key in instrumentDict) { instrumentList.push(instrumentDict[key]); }
	
	var rects = _.sortBy(Music.MakeTrackCharts(midi), 'x');
	var svg = Music.DrawTrackSvg(rects, 15000, 4000);
	Download('song.svg', svg); return;
	
	var offline = new OfflineAudioContext(2, midi.totalSeconds * 44100, 44100);
	var ctx = new AudioContext();
	
	offline.oncomplete = function(ev) {
		//PlayBuffer(ctx, ev.renderedBuffer);
		SaveBuffer(ctx, ev.renderedBuffer);
	};
	
	function PlayMidi(ctx, buffers) {
		
		for (var i = 0; i < midi.notes.length; i++)
		{
			var note = midi.notes[i];
			
			//var instrument = instrumentDict[note.channel];
			var instrument = instrumentDict[note.track]; // for now, we'll assign instruments manually based on inspecting the svg
			if (!instrument) { continue; }
			
			var source = offline.createBufferSource();
			source.buffer = buffers[instrument][Music.MidiPitchToC4(note.pitch, false)];
			source.start(note.start / midi.ticksPerSecond);
			source.stop(note.end / midi.ticksPerSecond);
			
			var gain = offline.createGain();
			gain.gain.value = note.amp / 64;
			
			source.connect(gain);
			gain.connect(offline.destination);
		}
		
		offline.startRendering();
	}
	
	LoadScripts(ctx, instrumentList, PlayMidi);
}

function PlayBuffer(ctx, audioBuffer) {
	
	var source = ctx.createBufferSource(); 
	source.buffer = audioBuffer;
	
	//var g = document.getElementsByTagName('canvas')[0].getContext('2d');
	//var firstRectIndex = 0;
	//
	//var scriptNode = ctx.createScriptProcessor();
	//
	//scriptNode.onaudioprocess = function(e) { firstRectIndex = Music.DrawTrack(g, rects, e.playbackTime / 100, totalSeconds, firstRectIndex); };
	//
	//source.connect(scriptNode);
	//scriptNode.connect(ctx.destination); // is this correct?  or should we split the source to *both* the scriptNode and ctx.destination?
	
	source.connect(ctx.destination);
	source.start();
}
function SaveBuffer(ctx, audioBuffer) {
	
	var float32Array0 = audioBuffer.getChannelData(0); // [-1,+1]
	var float32Array1 = audioBuffer.getChannelData(1); // [-1,+1]
	var int16Array = new Int16Array(float32Array0.length);
	var n = 3000;
	for (var i = 0; i < float32Array0.length; i++) { int16Array[i] = Math.floor(float32Array0[i] * n, 1); }
	var uint8Array = Music.MakeWav(int16Array);
	Download('song.wav', uint8Array);
}


// Note = { sample : 'snare' or <pcms> , instrument : 'Piano' , amp : 3000 , freq : 440 , start : 13000 , duration : 2000 , etc. }
// Sample = { duration : 10000 , pcms : Array , instrument : Piano , freq : 220 }

var Note = Music.Note = function() {
	
	this.pitch = 0; // in Hz
	this.name = 'A4';
	this.midipitch = 0; // 0-127 or whatever
	this.duration = 0; // in samples
	this.type = 'quarter'; // sixteenth, eighth, quarter, half, whole, dotted, etc.
	this.start = 0; // in samples
	this.beat = 0; // start in beats
	
	//this.instrument = null;
	
	//this.pitchFuzz = 0; // random variation in Hz
	
	this.samples = null; // Float32Array
};

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

// this function does the real heavy lifting of synthesis
// returns Int16Array
var CompileInstrument = Music.CompileInstrument = function(notes, padding, globalSampleDict) {
	
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
		
		if (note.pitch) { note.freq = C4toHz(note.pitch); }
		
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
				else if (Instruments[sample.instrument])
				{
					fn = Instruments[sample.instrument];
				}
				else
				{
					throw new Error();
					
					//var text = Griddl.GetData(sample.instrument); // yeah we have this set up so that it returns the text of a js component, not the compiled function
					//fn = new Function('args', text);
					//instrumentFunctionDict[sample.instrument] = fn;
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
};

// note = { pitch : 'C4' , measure : 1 , sixt : 15 , type : 'Quarter' , instrument : 'Piano' , amp : 3000 }
// params = { beatsPerMinute : 100 , beatsPerMeasure : 4 }

// these two functions, which are nearly identical, seem to mostly just convert the start and duration from measures/beats to samples
var CompileNotes = Music.CompileNotes = function(notes, params, padding) {
	
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
	
	return pcms;
};
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




var Track = Music.Track = function() {
	
	this.instrument = 'Piano';
	this.notes = [];
	this.start = 0; // in samples
	
	this.gain = 1;
	
	this.samples = null; // Float32Array
};
Track.prototype.compile = function() {
	
};
var MakeTrackCharts = Music.MakeTrackCharts = function(midi) {
	
	//var leftMargin = 20;
	//var pxPerTick = 0.40;
	//var barHeight = 20;
	//var wd = 15000;
	
	// the purpose of this function is not to figure out x,y,width,height or do any sort of conversions
	// we will modulate that using scaling and translation in canvas (or svg)
	// for the x axis, the midi's own time scale (ticks) can just be passed through directly
	// for the y axis, we need to assign slots - like lines and spaces on a staff
	
	var notes = midi.notes;
	
	// tracks : { "1" : [ Note , Note ] , "2" : [ Note , Note ] }
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
	
	var trackColors = [];
	trackColors[1] = 'red';
	trackColors[2] = 'orange';
	trackColors[3] = 'gold';
	trackColors[4] = 'green';
	trackColors[5] = 'blue';
	trackColors[6] = 'purple';
	trackColors[7] = 'gray';
	trackColors[8] = 'brown';
	
	var colors = {};
	
	for (var i = 0; i < 88; i++)
	{
		//var note = sharps[87 - i];
		var note = flats[87 - i];
		colors[i] = synesthesia[note.substr(0, note.length - 1)];
	}
	
	// minmax = { 1 : { min : 23 , max : 48 } , 3 : { min : 36 , max : 57 } }
	var minmax = {};
	for (var track in tracks)
	{
		var min = Number.MAX_VALUE;
		var max = Number.MIN_VALUE;
		
		for (var i = 0; i < tracks[track].length; i++)
		{
			var note = tracks[track][i]
			var pitch = note.pitch;
			if (pitch < min) { min = pitch; }
			if (pitch > max) { max = pitch; }
		}
		
		minmax[track] = { min : min , max : max };
	}
	
	var trackBottomSlots = {};
	var cumulativeSlots = 1;
	
	for (var track in tracks)
	{
		var slots = minmax[track].max - minmax[track].min + 1;
		trackBottomSlots[track] = cumulativeSlots + slots;
		cumulativeSlots += slots + 1;
	}
	
	//var totalHeight = 0; // the sum of the ranges of notes over all tracks
	//var trackHeights = {};
	//var trackMargin = 20;
	//for (var track in minmax)
	//{
	//	var height = minmax[track].max - minmax[track].min + 1;
	//	trackHeights[track] = height;
	//	totalHeight += trackMargin + height;
	//}
	//totalHeight += trackMargin;
	//
	//var hg = barHeight * totalHeight;
	//var baseHeight = barHeight;
	
	var rects = [];
	
	for (var track in tracks)
	{
		for (var i = 0; i < tracks[track].length; i++)
		{
			var note = tracks[track][i];
			var duration = note.end - note.start;
			
			// for drum tracks that have nominal duration
			//duration = 250;
			
			//var top = hg - (baseHeight + (note.pitch - minmax[track].min) * barHeight);
			//var left = leftMargin + Math.floor(note.start * pxPerTick, 1);
			//var width = Math.floor(duration * pxPerTick, 1);
			
			var slot = trackBottomSlots[track] - (note.pitch - minmax[track].min);
			
			var noteColor = colors[note.pitch - 20];
			var trackColor = trackColors[track];
			var text = flats[87 - (note.pitch - 20)];
			//rects.push({x:left,y:top,width:width,height:barHeight,color:trackColor,text:text});
			rects.push({x:note.start,width:duration,slot:slot,color:trackColor,text:text});
		}
		
		//baseHeight += (trackHeights[track] + trackMargin) * barHeight;
	}
	
	return rects;
};
var DrawTrackSvg = Music.DrawTrackSvg = function(rects, wd, hg) {
	
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
	
	var svglines = [];
	svglines.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+wd+'" height="'+hg+'">');
	
	for (var i = 0; i < rects.length; i++)
	{
		var rect = rects[i];
		svglines.push(SvgHelper('rect', {fill:rect.color,x:rect.x,y:rect.y,width:rect.width,height:rect.height}));
		//svglines.push(SvgHelper('text', {x:rect.x,y:rect.y+2}, rect.text));
	}
	
	svglines.push('</svg>');
	return svglines.join('\n') + '\n';
};
// let's precompute the rect coordinates and sort ascending by x coordinate so that this function is lightweight and can be called repeatedly
var DrawTrack = Music.DrawTrack = function(g, rects, options) {
	
	var firstRectIndex = 0;
	
	g.clearRect(0, 0, g.canvas.width, g.canvas.height);
	
	var lf = 100 * time; // this is horribly incorrect - MakeTrackCharts uses pxPerTick
	var rt = lf + g.canvas.width;
	
	for (var i = firstRectIndex; i < rects.length; i++)
	{
		var rect = rects[i];
		if (rect.x > rt) { break; }
		if (rect.x + rect.width < lf) { continue; }
		firstRectIndex = i; // the first time we reach this line is the first rect that's visible - set it as the new firstRect
		g.fillStyle = rect.color;
		g.fillRect(rect.x, rect.y, rect.width, rect.height);
	}
	
	g.lineWidth = 1;
	g.strokeStyle = 'black';
	g.moveTo(Math.floor(g.canvas.width / 2, 1)+0.5, 0);
	g.lineTo(Math.floor(g.canvas.width / 2, 1)+0.5, g.canvas.height);
	g.stroke();
	
	return firstRectIndex; // the caller should pass the new firstRectIndex in the next time it calls this function
};


var Song = Music.Song = function() {
	
	this.tracks = [];
	this.samples = null; // Int16Array or Float32Array?  do we want to convert to Int16 only on export to wav?
};
Song.prototype.toSvg = function() {
	
};
Song.prototype.compile = function() {
	
};
Song.prototype.mix = function() {
	
};
var ConvertToInt16Array = Music.ConvertToInt16Array = function(float32Array, amp) {
	
	var int16array = new Int16Array(float32Array.length);
	for (var i = 0; i < float32Array.length; i++) { int16array[i] = Math.floor(float32Array[i] * amp, 1); }
	return int16array;
};
Song.prototype.toJson = function() {
	
};
var DrawSongWhole = Music.DrawSongWhole = function(g, rects, options) {
	
	var barHeight = 1;
	
	//g.clearRect(0, 0, g.canvas.width, g.canvas.height);
	
	for (var i = 0; i < rects.length; i++)
	{
		var rect = rects[i];
		g.fillStyle = rect.color;
		g.fillRect(rect.x, rect.slot * barHeight, rect.width, barHeight);
	}
};


var DrawWaveDriver = Music.DrawWaveDriver = function(g, pcms) {
	
	var color = 'rgb(0,0,0)';
	var left = 10;
	var cy = 300;
	
	var pcmStart = 0;
	var pcmLength = 44100;
	var xPixelsPerStep = 1;
	var samplesPerStep = 10;
	var pcmsPerYPixel = 100;
	
	DrawWave(g, color, pcms, pcmStart, pcmLength, left, cy, xPixelsPerStep, samplesPerStep, pcmsPerYPixel);
};
var DrawWave = Music.DrawWave = function(g, color, pcms, pcmStart, pcmLength, left, cy, xPixelsPerStep, samplesPerStep, pcmsPerYPixel) {
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
};
var DrawSheetMusic = Music.DrawSheetMusic = function() {
	
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



// Instant
// Duration

// Chord
// Progression

// we separate these two to be able to recombine them orthogonally
// Rhythm
// Melody


// this only deals with the file - the objects for working with are Songs, Tracks, and Notes
var Midi = Music.Midi = function(b) {
	
};
Midi.prototype.make = function(song) {
	
};
Midi.prototype.write = function() {
	
};
// In the case where the value of <division> (in the header chunk) defines delta-time units in 'ticks per quarter note' (MSbit=0), a change in tempo means a change in the length of a unit of delta-time.
// In the case where <division> MSbit=1, and the 'ticks' are defined in absolute terms (ticks/frame and frames/second), it is not clear from the specification what effect a new tempo should have.
var ReadMidi = Music.ReadMidi = function(b) {
	
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
	
	MidiToNotes(x);
	MidiStats(x);
	
	return x;
};
function MidiStats(x) {
	
	// This defines the default unit of delta-time for this MIDI file. 
	// This is a 16-bit binary value, MSB first.
	// (MSB == 0) => the other 15 bits specify the number of delta-time units in a quarter-note
	// (MSB == 1) => 1aaa aaaa bbbb bbbb
	// aaaaaaa is a negative number, representing the number of SMTPE frames per second. Valid values correspond to those in the MTC Quarter Frame message.
	// -24 = 24 frames per second
	// -25 = 25 frames per second
	// -29 = 30 frames per second, drop frame
	// -30 = 30 frames per second, non-drop frame
	// bbbb bbbb is the number of delta-time units per SMTPE frame
	if (x.header.division >= 0x8000)
	{
		// MSB == 1
		throw new Error();
	}
	else
	{
		// MSB == 0
		x.ticksPerBeat = x.header.division;
	}
	
	//var channelDict = {};
	//var trackDict = {};
	var trackChannelDict = {};
	var minStart = 1000000;
	var maxStart = 0;
	var maxEnd = 0;
	var minAmp = 1000;
	var maxAmp = 0;
	
	for (var i = 0; i < x.notes.length; i++)
	{
		var note = x.notes[i];
		
		//if (!channelDict[note.channel]) { channelDict[note.channel] = 1; }
		//if (!trackDict[note.track]) { trackDict[note.track] = 1; }
		if (!trackChannelDict[note.track+'-'+note.channel]) { trackChannelDict[note.track+'-'+note.channel] = 1; }
		trackChannelDict[note.track+'-'+note.channel]++;
		if (note.start < minStart) { minStart = note.start; }
		if (note.start > maxStart) { maxStart = note.start; maxEnd = note.end; }
		if (note.amp < minAmp) { minAmp = note.amp; }
		if (note.amp > maxAmp) { maxAmp = note.amp; }
	}
	
	x.trackChannelDict = {};
	
	for (var key in trackChannelDict)
	{
		var track = key.split('-')[0];
		var channel = key.split('-')[1];
		
		//if (x.trackChannelDict[track]) { throw new Error(); }
		
		x.trackChannelDict[track] = channel;
	}
	
	x.totalTicks = maxEnd;
	x.totalBeats = maxEnd / x.ticksPerBeat;
	x.totalSeconds = x.totalBeats / x.bpm * 60; // this fails if there is a tempo change (because then, bpm is not constant)
	x.ticksPerSecond = x.ticksPerBeat * x.bpm / 60;
	x.beatsPerSecond = x.bpm / 60;
}
function ReadMidiHeaderChunk(b, k) {
	
	var x = {};
	
	// 0 = contains a single track
	// 1 = contains one or more simultaneous tracks
	// 2 = contains one or more independent tracks
	x.format = Conversion.ReadUi(b, k, 2, false);
	
	// number of tracks
	x.tracks = Conversion.ReadUi(b, k, 2, false);
	
	x.division = Conversion.ReadUi(b, k, 2, false);
	//x.division = Conversion.ReadB(b, k, 2);
	
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
	
	if ((type & 0xf0) == 0xf0) // if the type byte is 1111????
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
				// FF 00 02 ss ss
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
				
				// hourByte = 0aab bbbb
				// 0aa0 0000 = mask 0x60 = index into frameRateDict
				// 000b bbbb = mask 0x1F = hour
				
				var frameRateDict = {};
				frameRateDict[0x00] = 24;
				frameRateDict[0x20] = 25;
				frameRateDict[0x40] = 29;
				frameRateDict[0x60] = 30;
				
				x.frameRate = frameRateDict[(hourByte & 0x60)];
				x.hour = hourByte & 0x1F;
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
				x.subtypeByte = subtype;
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
		
		// aaaa bbbb
		// aaaa is the event type, bbbb specifies channel 1-16
		
		var param1;
		if ((type & 0x80) == 0) // if type matches 0??? ????
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
			// 1000 cccc 0nnn nnnn 0vvv vvvv
			x.subtype = "noteOff";
			x.noteNumber = param1;
			x.velocity = Conversion.ReadUi(b, k, 1);
		}
		else if (eventType == 0x09)
		{
			// 1001 cccc 0nnn nnnn 0vvv vvvv
			x.noteNumber = param1;
			x.velocity = Conversion.ReadUi(b, k, 1);
			x.subtype = (x.velocity == 0) ? "noteOff" : "noteOn";
		}
		else if (eventType == 0x0a)
		{
			// 1101 cccc 0nnn nnnn 0vvv vvvv
			x.subtype = "noteAftertouch"; // = poly pressure = key pressure
			x.noteNumber = param1;
			x.amount = Conversion.ReadUi(b, k, 1);
		}
		else if (eventType == 0x0b)
		{
			// 1011 cccc 0ttt tttt 0vvv vvvv
			x.subtype = "controller";
			x.controllerType = param1;
			x.value = Conversion.ReadUi(b, k, 1);
		}
		else if (eventType == 0x0c)
		{
			// 1100 cccc 0vvv vvvv
			x.subtype = "programChange";
			x.programNumber = param1;
		}
		else if (eventType == 0x0d)
		{
			// 1010 cccc 0vvv vvvv
			x.subtype = "channelAftertouch"; // = mono pressure = channel pressure
			x.amount = param1;
		}
		else if (eventType == 0x0e)
		{
			// 1110 cccc 0aaa aaaa 0bbb bbbb - coarse value and fine value, end result is 00aa aaaa abbb bbbb = [0,16383]
			x.subtype = "pitchBend";
			x.coarseValue = param1;
			x.fineValue = Conversion.ReadUi(b, k, 1);
			x.value = (x.coarseValue << 7) + x.fineValue
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
function NotesToMidi(notes) { }
var WriteNotesToMidi = Music.WriteNotesToMidi = function(notes) { return WriteMidi(NotesToMidi(notes)); };
var WriteMidi = Music.WriteMidi = function(midi) {
	
	var x = [];
	
	x.push('M'.charCodeAt());
	x.push('T'.charCodeAt());
	x.push('h'.charCodeAt());
	x.push('d'.charCodeAt());
	x.push(0x00); // length = 6
	x.push(0x00);
	x.push(0x00);
	x.push(0x06);
	x.push(Math.floor(midi.header.format / 256) % 256);
	x.push(midi.header.format % 256);
	x.push(Math.floor(midi.tracks.length / 256) % 256);
	x.push(midi.tracks.length % 256);
	x.push(Math.floor(midi.header.division / 256) % 256);
	x.push(midi.header.division % 256);
	
	for (var i = 0; i < midi.tracks.length; i++)
	{
		var t = [];
		
		for (var j = 0; j < midi.tracks[i].events.length; j++)
		{
			var e = midi.tracks[i].events[j];
			
			WriteDeltaTime(t, e.deltaTime);
			
			if (e.type == 'channel')
			{
				// Note on (status byte 1001nnnn)
				// Note Off (status byte 1000nnnn)
				// Mono Pressure (status byte 1101nnnn)
				// Poly Pressure (status byte 1010nnnn)
				// Program Change (status byte 1100nnnn)
				// Pitch Bend (status byte 1110nnnn)
				// Control Change (status byte 1011nnnn) (Mode Messages are control change messages)
				
				if (e.subtype == 'noteOn')
				{
					// 1001 cccc 0nnn nnnn 0vvv vvvv
					t.push((0x09 << 4) + e.channel);
					t.push(e.noteNumber); // 0-127, 60 = middle C
					t.push(e.velocity); // a velocity of 0 makes this a noteOff message instead
				}
				else if (e.subtype == 'noteOff')
				{
					// 1000 cccc 0nnn nnnn 0vvv vvvv
					t.push((0x08 << 4) + e.channel);
					t.push(e.noteNumber); // 0-127, 60 = middle C
					t.push(e.velocity); // defaults to 64, variable off velocity usually not implemented
				}
				else if (e.subtype == 'pitchBend')
				{
					// 1110 cccc 0aaa aaaa 0bbb bbbb - coarse value and fine value, end result is 00aa aaaa abbb bbbb = [0,16383]
					t.push((0x0E << 4) + e.channel);
					t.push(e.coarseValue);
					t.push(e.fineValue);
				}
				else if (e.subtype == 'noteAftertouch') // = poly pressure = key pressure
				{
					// 1101 cccc 0nnn nnnn 0vvv vvvv
					t.push((0x0D << 4) + e.channel);
					t.push(e.noteNumber);
					t.push(e.amount); // rename to pressureValue
				}
				else if (e.subtype == 'channelAftertouch') // = mono pressure = channel pressure
				{
					// 1010 cccc 0vvv vvvv
					t.push((0x0A << 4) + e.channel);
					t.push(e.amount); // rename to pressureValue
				}
				else if (e.subtype == 'controller')
				{
					// 1011 cccc 0ttt tttt 0vvv vvvv
					t.push((0x0B << 4) + e.channel);
					t.push(e.controlChangeType); // [0,127] - http://en.wikiaudio.org/MIDI:Control_change_message_list
					t.push(e.value); // [0,127]
				}
				else if (e.subtype == 'programChange') // = patch change = preset change = change in groupings of sounds assigned to one of the 16 channels
				{
					// 1100 cccc 0vvv vvvv
					t.push((0x0C << 4) + e.channel);
					t.push(e.value);
				}
				else
				{
					throw new Error("Unrecognized MIDI 'channel' event subtype: " + e.subtype);
				}
			}
			else if (e.type == 'meta')
			{
				t.push(0xFF); // the 'meta' type
				
				var textSubtypeCodes = {};
				textSubtypeCodes['text'] = 0x01;
				textSubtypeCodes['copyrightNotice'] = 0x02;
				textSubtypeCodes['trackName'] = 0x03;
				textSubtypeCodes['instrumentName'] = 0x04;
				textSubtypeCodes['lyrics'] = 0x05;
				textSubtypeCodes['marker'] = 0x06;
				textSubtypeCodes['cuePoint'] = 0x07;
				
				if (e.subtype == 'sequenceNumber')
				{
					// FF 00 02 ss ss
					t.push(0x00); // the 'sequenceNumber' subtype
					t.push(0x02); // the length
					WriteUi(t, e.number, 2, false); // big endian?
				}
				else if (textSubtypeCodes[e.subtype])
				{
					// FF 01 dd+ xx+
					// FF 02 dd+ xx+
					// FF 03 dd+ xx+
					// FF 04 dd+ xx+
					// FF 05 dd+ xx+
					// FF 06 dd+ xx+
					// FF 07 dd+ xx+
					t.push(textSubtypeCodes[e.subtype]);
					WriteDeltaTime(t, e.text.length);
					for (var k = 0; k < e.text.length; k++) { t.push(e.text.charCodeAt(k)); }
				}
				else if (e.subtype == 'midiChannelPrefix')
				{
					// FF 20 01 cc
					t.push(0x20); // the 'midiChannelPrefix' subtype
					t.push(0x01); // length
					t.push(e.channel);
				}
				else if (e.subtype == 'endOfTrack')
				{
					// FF 2F 00
					t.push(0x2F); // the 'endOfTrack' subtype
					t.push(0x00); // length
				}
				else if (e.subtype == 'setTempo')
				{
					// FF 51 03 tt tt tt
					t.push(0x51); // the 'endOfTrack' subtype
					t.push(0x03); // length
					WriteUi(t, e.microSecondsPerBeat, 3, false);
				}
				else if (e.subtype == 'smpteOffset')
				{
					// FF 54 05 hh mm ss fr ff
					t.push(0x54); // the 'smpteOffset' subtype
					t.push(0x05); // length
					
					// hourByte = 0aab bbbb
					// 0aa0 0000 = mask 0x60 = index into frameRateDict
					// 000b bbbb = mask 0x1F = hour
					
					var frameRateDictInverse = {};
					frameRateDictInverse[24] = 0x00;
					frameRateDictInverse[25] = 0x20;
					frameRateDictInverse[29] = 0x40;
					frameRateDictInverse[30] = 0x60;
					
					t.push(frameRateDictInverse[e.frameRate] + e.hour);
					t.push(e.min);
					t.push(e.sec);
					t.push(e.frame);
					t.push(e.subframe);
				}
				else if (e.subtype == 'timeSignature')
				{
					// FF 58 04 nn dd cc bb
					t.push(0x58); // the 'timeSignature' subtype
					t.push(0x04); // length
					t.push(e.numerator);
					t.push(Math.log2(e.denominator, 2));
					t.push(e.metronome);
					t.push(e.thirtyseconds);
				}
				else if (e.subtype == 'keySignature')
				{
					// FF 59 02 sf mi
					t.push(0x59); // the 'keySignature' subtype
					t.push(0x02); // length
					t.push((e.key < 0) ? (0x100 + e.key) : e.key); // [-7,+7], number of sharps or flats
					t.push(e.scale); // 0 = major key, 1 = minor key
				}
				else if (e.subtype == 'sequencerSpecific')
				{
					throw new Error('sequencerSpecific meta subevet not yet supported');
					
					// FF 7F <len> <id> <data>
					t.push(0x7F); // the 'marker' subtype
					WriteDeltaTime(t, e.data.length);
					e.data.forEach(function(elt, index) { t.push(elt); });
				}
				else if (e.subtype == 'unknown')
				{
					t.push(e.subtypeByte);
					WriteDeltaTime(t, e.data.length);
					e.data.forEach(function(elt, index) { t.push(elt); });
				}
				else
				{
					throw new Error("Unrecognized MIDI 'meta' event subtype: " + e.subtype);
				}
			}
			else if (e.type == 'sysEx')
			{
				t.push(0xf0);
				WriteDeltaTime(t, e.data.length);
				e.data.forEach(function(elt, index) { t.push(elt); });
			}
			else if (e.type == 'dividedSysEx')
			{
				t.push(0xf7);
				WriteDeltaTime(t, e.data.length);
				e.data.forEach(function(elt, index) { t.push(elt); });
			}
			else
			{
				throw new Error("Unrecognized MIDI event type: " + e.type);
			}
		}
		
		var length = t.length;
		
		x.push('M'.charCodeAt());
		x.push('T'.charCodeAt());
		x.push('r'.charCodeAt());
		x.push('k'.charCodeAt());
		x.push(Math.floor(length / 256 / 256 / 256) % 256);
		x.push(Math.floor(length / 256 / 256) % 256);
		x.push(Math.floor(length / 256) % 256);
		x.push(length % 256);
		x = x.concat(t);
	}
	
	return new Uint8Array(x);
};
var SampleMidi = Music.SampleMidi = function() {
	
	var midi = {};
	midi.tracks = [];
	midi.division = 96; // 96 delta time units per quarter note.  96 = 3*2*2*2*2*2
	midi.format = 1;
	var track1 = {};
	track1.events = [];
	track1.events.push({ deltaTime : 5 , type : 'channel' , subtype : 'noteOn' , channel : 1 , noteNumber : 60 , velocity : 60 });
	track1.events.push({ deltaTime : 105 , type : 'channel' , subtype : 'noteOff' , channel : 1 , noteNumber : 60 , velocity : 60 });
	midi.tracks.push(track1);
	return midi;
};
function WriteDeltaTime(list, deltaTime) {
	
	// a series of 7-bit values, from most-significant to least-significant
	// the MSB is set to 1 for all bytes besides the last, and the MSB of the last byte is set to 0
	
	//    00-7F <=> 00-7F   
	// 0aaa aaaa <=> 0aaa aaaa
	
	// 00aa aaaa bbbb bbbb => 1aaa aaab 0bbb bbbb
	
	// 000a aaaa bbbb bbbb cccc cccc => 1aaa aabb 1bbb bbbc 0ccc cccc
	
	if (deltaTime <= 0x7F)
	{
		list.push(deltaTime);
	}
	else if (deltaTime <= 0x3FFF)
	{
		list.push(0x80 + ((deltaTime >> 8) << 1) + ((deltaTime >> 7) % 2)); // 1 + aaaaaa + b
		list.push(deltaTime & 0x7F); // 0bbb bbbb
	}
	else if (deltaTime <= 0x1FFFFF)
	{
		list.push(0x80 + ((deltaTime >> 16) << 2) + ((deltaTime & 0xFFFF) >> 14)); // 1 + aaaaa + bb
		list.push(0x80 + ((deltaTime >> 8) & 0x3F) + ((deltaTime >> 7) % 2)); // 1 + bbbbbb + c
		list.push(deltaTime & 0x7F); // 0ccc cccc
	}
	else
	{
		throw new Error('delta time 4 bytes or longer, which is unsupported at the moment');
	}
}
function WriteUi(list, number, n, littleEndian) {
	
	if (littleEndian)
	{
		if (n >= 1) { list.push(number % 256); }
		if (n >= 2) { list.push(Math.floor(number / 256) % 256); }
		if (n >= 3) { list.push(Math.floor(number / 256 / 256) % 256); }
		if (n >= 4) { list.push(Math.floor(number / 256 / 256 / 256) % 256); }
	}
	else
	{
		if (n >= 4) { list.push(Math.floor(number / 256 / 256 / 256) % 256); }
		if (n >= 3) { list.push(Math.floor(number / 256 / 256) % 256); }
		if (n >= 2) { list.push(Math.floor(number / 256) % 256); }
		if (n >= 1) { list.push(number % 256); }
	}
}
// Note : { start : 0 , end : 0 , amp : [0-127] , pitch : [0-127,60=C4] , track : 0 , channel : 0 }
// what are the time units?  is channel the instrument and how is it distinguished from the track?
function MidiToNotes(midi) {
	
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
						note.name = MidiPitchToC4(note.pitch, false);
						
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
		midi.bpm = beatsPerMinute; // this get overwritten if there is more than one tempoevent
	}
	
	midi.notes = notes;
}


var Wav = Music.Wav = function() {
	
};
Wav.prototype.write = function() {
	
};
var ReadWav = Music.ReadWav = function(b) {
	
	var wav = {};
	
	
	
	var k = { k : 0 };
	wav.riffChunkId = Conversion.ReadS(b, k, 4);
	wav.riffChunkSize = Conversion.ReadUi(b, k, 4, true);
	wav.wave = Conversion.ReadS(b, k, 4);
	wav.formatChunkId = Conversion.ReadS(b, k, 4);
	wav.formatChunkSize = Conversion.ReadUi(b, k, 4, true);
	wav.formatTag = Conversion.ReadUi(b, k, 2, true);
	wav.nChannels = Conversion.ReadUi(b, k, 2, true);
	wav.nSamplesPerSec = Conversion.ReadUi(b, k, 4, true);
	wav.nAvgBytesPerSec = Conversion.ReadUi(b, k, 4, true);
	wav.nBlockAlign = Conversion.ReadUi(b, k, 2, true);
	wav.nBitsPerSample = Conversion.ReadUi(b, k, 2, true);
	for (var i = 0; i < wav.formatChunkSize - 16; i++) { k.k++; } // sometimes formatChunkSize is 18
	wav.dataChunkId = Conversion.ReadS(b, k, 4);
	wav.dataChunkSize = Conversion.ReadUi(b, k, 4, true);
	while (wav.dataChunkId != "data") // i've seen "LIST" before
	{
		// pass over this structure
		for (var i = 0; i < wav.dataChunkSize; i++) { k.k++; }
		wav.dataChunkId = Conversion.ReadS(b, k, 4);
		wav.dataChunkSize = Conversion.ReadUi(b, k, 4, true);
	}
	var bytesPerSample = wav.nBitsPerSample / 8;
	var n = wav.dataChunkSize / bytesPerSample / wav.nChannels;
	wav.xs = [];
	for (var j = 0; j < wav.nChannels; j++) { wav.xs[j] = new Int16Array(n); }
	for (var i = 0; i < n; i++)
	{
		for (var j = 0; j < wav.xs.length; j++)
		{
			wav.xs[j][i] = Conversion.ReadSi(b, k, bytesPerSample, true);
		}
	}
	
	
	
	
	
	//var c = 0;
	//wav.riffChunkId = "";
	//wav.riffChunkId += String.fromCharCode(x[c++]);
	//wav.riffChunkId += String.fromCharCode(x[c++]);
	//wav.riffChunkId += String.fromCharCode(x[c++]);
	//wav.riffChunkId += String.fromCharCode(x[c++]);
	//wav.riffChunkSize = 0;
	//wav.riffChunkSize += x[c++];
	//wav.riffChunkSize += x[c++] * 256;
	//wav.riffChunkSize += x[c++] * 256 * 256;
	//wav.riffChunkSize += x[c++] * 256 * 256 * 256;
	//wav.wave = "";
	//wav.wave += String.fromCharCode(x[c++]);
	//wav.wave += String.fromCharCode(x[c++]);
	//wav.wave += String.fromCharCode(x[c++]);
	//wav.wave += String.fromCharCode(x[c++]);
	//wav.formatChunkId = "";
	//wav.formatChunkId += String.fromCharCode(x[c++]);
	//wav.formatChunkId += String.fromCharCode(x[c++]);
	//wav.formatChunkId += String.fromCharCode(x[c++]);
	//wav.formatChunkId += String.fromCharCode(x[c++]);
	//wav.formatChunkSize = 0;
	//wav.formatChunkSize += x[c++];
	//wav.formatChunkSize += x[c++] * 256;
	//wav.formatChunkSize += x[c++] * 256 * 256;
	//wav.formatChunkSize += x[c++] * 256 * 256 * 256;
	//wav.formatTag = 0;
	//wav.formatTag += x[c++];
	//wav.formatTag += x[c++] * 256;
	//wav.nChannels = 0;
	//wav.nChannels += x[c++];
	//wav.nChannels += x[c++] * 256;
	//wav.nSamplesPerSec = 0;
	//wav.nSamplesPerSec += x[c++];
	//wav.nSamplesPerSec += x[c++] * 256;
	//wav.nSamplesPerSec += x[c++] * 256 * 256;
	//wav.nSamplesPerSec += x[c++] * 256 * 256 * 256;
	//wav.nAvgBytesPerSec = 0;
	//wav.nAvgBytesPerSec += x[c++];
	//wav.nAvgBytesPerSec += x[c++] * 256;
	//wav.nAvgBytesPerSec += x[c++] * 256 * 256;
	//wav.nAvgBytesPerSec += x[c++] * 256 * 256 * 256;
	//wav.nBlockAlign = 0;
	//wav.nBlockAlign += x[c++];
	//wav.nBlockAlign += x[c++] * 256;
	//wav.nBitsPerSample = 0;
	//wav.nBitsPerSample += x[c++];
	//wav.nBitsPerSample += x[c++] * 256;
	//
	//for (var i = 0; i < wav.formatChunkSize - 16; i++) { c++; } // sometimes formatChunkSize is 18
	//
	//wav.dataChunkId = "";
	//wav.dataChunkId += String.fromCharCode(x[c++]);
	//wav.dataChunkId += String.fromCharCode(x[c++]);
	//wav.dataChunkId += String.fromCharCode(x[c++]);
	//wav.dataChunkId += String.fromCharCode(x[c++]);
	//wav.dataChunkSize = 0;
	//wav.dataChunkSize += x[c++];
	//wav.dataChunkSize += x[c++] * 256;
	//wav.dataChunkSize += x[c++] * 256 * 256;
	//wav.dataChunkSize += x[c++] * 256 * 256 * 256;
	//
	//while (wav.dataChunkId != "data") // i've seen "LIST" before
	//{
	//	// pass over this structure
	//	for (var i = 0; i < wav.dataChunkSize; i++) { c++; }
	//	
	//	wav.dataChunkId = "";
	//	wav.dataChunkId += String.fromCharCode(x[c++]);
	//	wav.dataChunkId += String.fromCharCode(x[c++]);
	//	wav.dataChunkId += String.fromCharCode(x[c++]);
	//	wav.dataChunkId += String.fromCharCode(x[c++]);
	//	wav.dataChunkSize = 0;
	//	wav.dataChunkSize += x[c++];
	//	wav.dataChunkSize += x[c++] * 256;
	//	wav.dataChunkSize += x[c++] * 256 * 256;
	//	wav.dataChunkSize += x[c++] * 256 * 256 * 256;
	//}
	//
	//var bookmarkIndex = c;
	//var bytesPerSample = wav.nBitsPerSample / 8;
	//var n = wav.dataChunkSize / bytesPerSample / wav.nChannels;
	//
	//// without slots
	//wav.xs = [];
	//for (var j = 0; j < wav.nChannels; j++) { wav.xs[j] = new Int16Array(n); }
	//var xs = wav.xs;
	//var channels = wav.xs;
	//
	//for (var i = 0; i < n; i++)
	//{
	//	for (var j = 0; j < xs.length; j++)
	//	{
	//		var pcm = 0;
	//		var multiplier = 1;
	//		
	//		for (var k = 0; k < bytesPerSample; k++)
	//		{
	//			pcm += x[bookmarkIndex] * multiplier;
	//			multiplier *= 256;
	//			bookmarkIndex++;
	//		}
	//		
	//		// (bytesPerSample == 1) => (maskOfTheSignBit == 0b10000000 == 0x80)
	//		// (bytesPerSample == 2) => (maskOfTheSignBit == 0b1000000000000000 == 0x8000)
	//		var maskOfTheSignBit = 1;
	//		for (var k = 0; k < bytesPerSample; k++) { maskOfTheSignBit <<= 8; }
	//		
	//		maskOfTheSignBit >>= 1;
	//		
	//		// if pcm is negative
	//		if ((pcm & maskOfTheSignBit) != 0) { pcm -= maskOfTheSignBit << 1; }
	//		
	//		channels[j][i] = pcm;
	//	}
	//}
	
	return wav;
};
var MakeWav = Music.MakeWav = function(channel) { return MakeWavStereo([channel]); };
var MakeWavStereo = Music.MakeWavStereo = function(channels) {
	
	var riffChunkId = "RIFF";
	var riffChunkSize = null;
	var wave = "WAVE";
	var formatChunkId = "fmt ";
	var formatChunkSize = 16;
	var formatTag = 1;
	var nChannels = channels.length;
	var nSamplesPerSec = 44100;
	var nAvgBytesPerSec = null;
	var nBlockAlign = null;
	var nBitsPerSample = 16;
	var dataChunkId = "data";
	var dataChunkSize = null;
	
	// channels = [ Int16Array , Int16Array , ... ]
	//var channel = channels[0]; // remove upon implementation of true stereo export
	
	if (channels.length > 1 && channels[0].length != channels[1].length) { throw new Error(); }
	var sampleLength = channels[0].length;
	
	var bytesPerSample = nBitsPerSample / 8;
	dataChunkSize = sampleLength * bytesPerSample * nChannels;
	nAvgBytesPerSec = nSamplesPerSec * bytesPerSample * nChannels;
	riffChunkSize = dataChunkSize + 44 - 8;
	nBlockAlign = bytesPerSample * nChannels; // ? - i think this is what nBlockAlign means
	
	var arrayBuffer = new ArrayBuffer(44 + dataChunkSize); // used to be 44 + sampleLength * bytesPerSample
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
	
	for (var i = 0; i < sampleLength; i++)
	{
		for (var j = 0; j < channels.length; j++)
		{
			var b = channels[j][i];
			
			if (b < 0) // convert signed integer to two's complement
			{
				var mult = 1;
				for (var k = 0; k < bytesPerSample; k++) { mult *= 256; }
				b += mult;
			}
			
			for (var k = 0; k < bytesPerSample; k++)
			{
				uint8Array[c++] = Math.floor(b % 256); // the index into uint8array used to be 44 + i * bytesPerSample + k
				b = Math.floor(b / 256);
			}
		}
	}
	
	return uint8Array;
}


var Conversion = {};
Conversion.ReadUi = function(b, k, n, little) {
	
	if (b.readUIntLE)
	{
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
	}
	else
	{
		var x = 0;
		var mult = 1;
		
		if (little)
		{
			for (var i = 0; i < n; i++)
			{
				x += mult * b[k.k++];
				mult *= 256;
			}
		}
		else
		{
			for (var i = 0; i < n - 1; i++)
			{
				mult *= 256;
			}
		
			for (var i = 0; i < n; i++)
			{
				x += mult * b[k.k++];
				mult /= 256;
			}
		}
		
		return x;
	}
};
Conversion.ReadSi = function(b, k, n, little) {
	
	if (b.readIntLE)
	{
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
	}
	else
	{
		var x = Conversion.ReadUi(b, k, n, little);
		var y = CastUintToInt(x, n);
		return y;
	}
};
Conversion.ReadB = function(b, k, n) {
	
	var x = [];
	
	if (b.readUInt8)
	{
		for (var i = 0; i < n; i++)
		{
			x.push(b.readUInt8(k.k++));
		}
	}
	else
	{
		for (var i = 0; i < n; i++)
		{
			x.push(b[k.k++]);
		}
	}
	
	return x;
};
Conversion.ReadS = function(b, k, n) {
	
	if (b.constructor.name != 'Uint8Array')
	{
		var s = b.toString('utf8', k.k, k.k + n);
		k.k += n;
		return s;
	}
	else
	{
		var x = '';
		
		for (var i = 0; i < n; i++)
		{
			x += String.fromCharCode(b[k.k++]);
		}
		
		return x;
	}
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

function LoadAndDecode(ctx, filename, callback) {
	
	var request = new XMLHttpRequest();
	request.open('GET', filename, true);
	request.responseType = 'arraybuffer';
	request.onload = function() { ctx.decodeAudioData(request.response, function(decodedData) { callback(decodedData); }); };
	request.send();
}
function LoadMidi(filename, callback) {
	
	var request = new XMLHttpRequest();
	request.open('GET', filename, true);
	request.responseType = 'arraybuffer';
	
	request.onload = function() {
		var arrayBuffer = request.response;
		var uint8Array = new Uint8Array(arrayBuffer);
		var midi = Music.ReadMidi(uint8Array);
		ProcessMidi(midi);
	};
	
	request.send();
}

return Music;

})();

// Alt+2

