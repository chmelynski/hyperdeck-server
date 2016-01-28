
if (typeof Griddl === 'undefined') { var Griddl = {}; }

Griddl.IO = (function() {

function DownloadWorkbook() {

	var filename = $('title').text();
	var text = SaveToText();
	
	var downloadLink = document.createElement('a');
	var url = (window.webkitURL != null ? window.webkitURL : window.URL);
	downloadLink.href = url.createObjectURL(new Blob([text], {type : 'text/plain'}));
	downloadLink.download = filename + '.txt';
	downloadLink.click();
}
function UploadWorkbook() {
	var fileChooser = document.getElementById('fileChooser');
	fileChooser.click();
}
function HandleLocalLoad(files) {
	// this handles load of a new workbook
	var fileReader = new FileReader();
	
	fileReader.onload = function(event)
	{
		//var x = new Uint8Array(event.target.result, 0, event.target.result.byteLength); // for readAsArrayBuffer
		
		$('#cells').children().remove();
		
		var text = event.target.result;
		
		$('#frce').text(text);
		Griddl.Main();
		
		// dummy version that just diplays the workbook in a textarea
		//$('#cells').remove();
		//var textarea = $(document.createElement('textarea'));
		//textarea.text(text);
		//$('#frce').append(textarea);
		//$('#frce').css('display', 'block');
		//$('#frce').css('position', 'absolute');
		//$('#frce').css('left', '3em');
		//$('#frce').css('top', '5em');
		//textarea.css('width', '40em');
		//textarea.css('height', '50em');
	};
	
	if (files.length > 0)
	{
		var f = files[0];
		$('title').text(f.name.substr(0, f.name.length - 4));
		fileReader.readAsText(f); // when this is done, it will call fileReader.onload(event)
		//fileReader.readAsArrayBuffer(f); // when this is done, it will call fileReader.onload(event)
	}
}

// $.ajax(
// {
// 	dataType : 'json' ,
// 	url : url ,
// 	error : function() { debugger; } ,
// 	success : function(obj) { DoSomething(obj); }
// });

function LoadRemote(url, callback) {
	var xmlhttp = null;
	
	if (window.XMLHttpRequest) // code for IE7+, Firefox, Chrome, Opera, Safari
	{
		xmlhttp = new XMLHttpRequest();
	}
	else // code for IE6, IE5
	{
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	xmlhttp.onreadystatechange = function()
	{
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
		{
			callback(xmlhttp.responseText);
		}
	};
	
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
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
function SaveLocal(url, uint8array) {
	var str = "";
	
	for (var i = 0; i < uint8array.length; i++)
	{
		str += String.fromCharCode(uint8array[i]);
	}
	
	var base64encoded = btoa(str);
	
	var s = "";
	s += "data:image/octet-stream"; // 'image' is, i believe, arbitrary.  octet-streams are all the same.
	s += ";base64";
	s += ",";
	s += base64encoded;
	
	//document.location.pathname = '/download.wav'; // this does not do anything
	document.location.href = s; 
}
function SaveLocalStr(url, str) {
	for (var i = 0; i < str.length; i++)
	{
		var n = str.charCodeAt(i);
		
		if (n >= 0x80)
		{
			throw new Error();
		}
	}
	
	var base64encoded = btoa(str);
	
	var s = "";
	s += "data:image/octet-stream";
	s += ";base64";
	s += ",";
	s += base64encoded;
	
	//document.location.pathname = url;
	document.location.href = s; 
}
function SaveRemote(url, blob) {
	var xmlhttp = null;
	
	if (window.XMLHttpRequest) // code for IE7+, Firefox, Chrome, Opera, Safari
	{
		xmlhttp = new XMLHttpRequest();
	}
	else // code for IE6, IE5
	{
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	xmlhttp.open("PUT", url, true);
	xmlhttp.send(blob);
}
function LoadRemoteJson(url, obj) {
	//var name = url.substring(url.lastIndexOf("/"));
	//name = name.substring(0, name.length - 5); // chop off the trailing ".json"
	//globals.canvas[name] = JSON.parse(xmlhttp.responseText);
}
function SaveRemoteJson(url, obj) {
	var blob = JSON.stringify(obj);
	SaveRemote(url, blob);
}
function SaveRemoteLines(url, lines) {
	var blob = lines.join("\r\n") + "\r\n";
	SaveRemote(url, blob);
}


// data URI syntax: data:[<mediatype>][;base64],<data>
// data:[<MIME-type>][;charset=<encoding>][;base64],<data>
// <img src="data:image/gif;base64,
// "></img>

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
// https://developer.mozilla.org/en-US/docs/data_URIs

// In JavaScript there are two functions respectively for decoding and encoding base64 strings:
// btoa() // encode from binary string to base64
// atob() // decode from base64

// Functions which natively return Base64-encoded strings in JavaScript:
// The readAsDataURL() method of the FileReader API
// The toDataURL() and toDataURLHD() methods of the HTMLCanvasElement interface

// base64 encoding in a nutshell:
// A-Z = 0-25 ('A' is ASCII 65, 'Z' is ASCII 90)
// a-z = 26-51 ('a' is ASCII 97, 'z' is ASCII 122)
// 0-9 = 52-61 ('0' is ASCII 48, '9' is ASCII 57)
// + = 62 ('+' is ASCII 43)
// / = 63 ('/' is ASCII 47)

// b64ToUint6('a'.charCodeAt(0)) => 26
// uint6ToB64(26) => 97 (which is 'a')

// 3 octets become 4 sextets
// if there are 1 or 2 extra bytes, pad the rest with 00000000
// signal this by appending a '==' if 2 bytes are missing (meaning a one byte remainder) or '=' if 1 byte is missing (meaning a two byte remainder)

// "abc" => ""
// "ab" => ""
// "a" => ""

// single character - base64 character => integer in the range 0-63
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

// single character - integer in the range 0-63 => base64 character
function uint6ToB64(nUint6) {
	return nUint6 < 26 ?
		nUint6 + 65
	: nUint6 < 52 ?
		nUint6 + 71
	: nUint6 < 62 ?
		nUint6 - 4
	: nUint6 === 62 ?
		43
	: nUint6 === 63 ?
		47
	:
		65;
}

function Base64StringToUint8Array(str) {
	
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
function Uint8ArrayToBase64String(aBytes) {
	var nMod3 = '';
	var sB64Enc = '';
	
	for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++)
	{
		nMod3 = nIdx % 3;
		//if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
		nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
		
		if (nMod3 === 2 || aBytes.length - nIdx === 1)
		{
			var a = uint6ToB64(nUint24 >>> 18 & 63);
			var b = uint6ToB64(nUint24 >>> 12 & 63);
			var c = uint6ToB64(nUint24 >>> 06 & 63);
			var d = uint6ToB64(nUint24 >>> 00 & 63);
			sB64Enc += String.fromCharCode(a, b, c, d);
			nUint24 = 0;
		}
	}
	
	return sB64Enc.replace(/A(?=A$|$)/g, "=");
}
function UTF8ByteArrayToUnicodeString(aBytes) {
	var sView = "";
	
	for (var nPart, nLen = aBytes.length, nIdx = 0; nIdx < nLen; nIdx++)
	{
		nPart = aBytes[nIdx];
		
		sView += String.fromCharCode(
			nPart > 251 && nPart < 254 && nIdx + 5 < nLen ? /* six bytes */
			/* (nPart - 252 << 32) is not possible in ECMAScript! So...: */
			(nPart - 252) * 1073741824 + (aBytes[++nIdx] - 128 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
			: nPart > 247 && nPart < 252 && nIdx + 4 < nLen ? /* five bytes */
			(nPart - 248 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
			: nPart > 239 && nPart < 248 && nIdx + 3 < nLen ? /* four bytes */
			(nPart - 240 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
			: nPart > 223 && nPart < 240 && nIdx + 2 < nLen ? /* three bytes */
			(nPart - 224 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
			: nPart > 191 && nPart < 224 && nIdx + 1 < nLen ? /* two bytes */
			(nPart - 192 << 6) + aBytes[++nIdx] - 128
			: /* nPart < 127 ? */ /* one byte */
			nPart
		);
	}
	
	return sView;
}
function UnicodeStringToUTF8ByteArray(str) {
	var aBytes = null
	var nChr = null;
	var nStrLen = str.length;
	var nArrLen = 0;
	
	/* mapping... */
	
	for (var i = 0; i < nStrLen; i++)
	{
		nChr = str.charCodeAt(i);
		nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
	}
	
	aBytes = new Uint8Array(nArrLen);
	
	/* transcription... */
	
	for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++)
	{
		nChr = str.charCodeAt(nChrIdx);
	
		if (nChr < 128)
		{
			/* one byte */
			aBytes[nIdx++] = nChr;
		}
		else if (nChr < 0x800)
		{
			/* two bytes */
			aBytes[nIdx++] = 192 + (nChr >>> 6);
			aBytes[nIdx++] = 128 + (nChr & 63);
		}
		else if (nChr < 0x10000)
		{
			/* three bytes */
			aBytes[nIdx++] = 224 + (nChr >>> 12);
			aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
			aBytes[nIdx++] = 128 + (nChr & 63);
		}
		else if (nChr < 0x200000)
		{
			/* four bytes */
			aBytes[nIdx++] = 240 + (nChr >>> 18);
			aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
			aBytes[nIdx++] = 128 + (nChr & 63);
		}
		else if (nChr < 0x4000000)
		{
			/* five bytes */
			aBytes[nIdx++] = 248 + (nChr >>> 24);
			aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
			aBytes[nIdx++] = 128 + (nChr & 63);
		}
		else /* if (nChr <= 0x7fffffff) */
		{
			/* six bytes */
			aBytes[nIdx++] = 252 + /* (nChr >>> 32) is not possible in ECMAScript! So...: */ (nChr / 1073741824);
			aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
			aBytes[nIdx++] = 128 + (nChr & 63);
		}
	}
	
	return aBytes;
}

var IO = {};
IO.HandleLocalLoad = HandleLocalLoad;
IO.DownloadWorkbook = DownloadWorkbook;
IO.UploadWorkbook = UploadWorkbook;
IO.Base64StringToUint8Array = Base64StringToUint8Array;
IO.Uint8ArrayToBase64String = Uint8ArrayToBase64String;
IO.UTF8ByteArrayToUnicodeString = UTF8ByteArrayToUnicodeString;
IO.UnicodeStringToUTF8ByteArray = UnicodeStringToUTF8ByteArray;
return IO;

})();


