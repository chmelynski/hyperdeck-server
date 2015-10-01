
// we could just read/write wavs on the server, and send only pcms over the wire

exports.ReadWav(x) {
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
exports.MakeWavStereo(channels) {

}
exports.MakeWav(channel) {
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

