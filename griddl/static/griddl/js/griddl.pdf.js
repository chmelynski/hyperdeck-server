
if (typeof Griddl === 'undefined') { var Griddl = {}; }

// all the export button knows is the name of the component containing user drawing code
// when clicked, it sets globals.drawingMode to 'pdf', invokes the user code, and then reads griddlCanvas (which the user code must set)
Griddl.griddlCanvas = null; // in ExportToPdf we call MakePdf(griddlCanvas) - the Canvas constructor sets griddlCanvas whenever it is invoked
Griddl.drawPdf = false; // the function invoked by the export button sets this to true, runs the user code, and then sets it to false again

Griddl.Pdf = (function() {
	
	function Pdf(griddlCanvas) {
		this.text = MakePdf(griddlCanvas);
	}
	
	function MakePdf(griddlCanvas) {
		
		var objects = [];
		
		var catalog = { Type : "Catalog" , Pages : null };
		var pages = { Type : "Pages" , Count : griddlCanvas.pages.length , Kids : [] };
		catalog.Pages = pages;
		objects.push(catalog);
		objects.push(pages);
		
		var fontResourceDict = {}; // { F1 : 3 0 R , F2 : 4 0 R , etc. }
		var imageResourceDict = {};  // { Im1 : 5 0 R , Im2 : 6 0 R , etc. }
		
		// all fonts and images used in the document are put in separate objects here - page resource dicts refer to this section via indirect references
		
		// section 5.7, p.455 - Font Descriptors
		// section 5.8, p.465 - Embedded Font Programs
		// griddlCanvas.fontNameToIndex = { "Times-Roman" : 1 , "Helvetica" : 2 }
		// griddlCanvas.fontDict = { "F1" : "Times-Roman" , "F2" : "Helvetica" }
		for (var key in griddlCanvas.fontNameToIndex)
		{
			var fontId = 'F' + griddlCanvas.fontNameToIndex[key];
			
			var font = null;
			
			if (key == 'Times-Roman' || key == 'Helvetica')
			{
				font = { Type : "Font" , Subtype : "Type1" , BaseFont : key }; // or lookup the font name in some global font dictionary to get the right font objects
				objects.push(font);
			}
			else
			{
				var fontType = 'TrueType';
				
				if (fontType == 'TrueType')
				{
					var uint8Array = griddlCanvas.fontNameToUint8Array[key]; // file bytes go here
					var stream = Uint8ArrayToAsciiHexDecode(uint8Array);
					var fontStreamDictionary = { Length : stream.length , Filter : "ASCIIHexDecode" , Length1 : uint8Array.length }; // Length1 = length after being decoded
					fontStreamDictionary["[stream]"] = stream;
					var fontDescriptor = { Type : "FontDescriptor" , FontName : key , FontFile2 : fontStreamDictionary };
					var font = { Type : "Font" , Subtype : "TrueType" , BaseFont : key , FontDescriptor : fontDescriptor };
					objects.push(font);
					objects.push(fontDescriptor);
					objects.push(fontStreamDictionary);
				}
				else if (fontType == 'OpenType')
				{
					var uint8Array = griddlCanvas.fontNameToUint8Array[key]; // file bytes go here
					var stream = Uint8ArrayToAsciiHexDecode(uint8Array);
					var fontStreamDictionary = { Length : stream.length , Filter : "ASCIIHexDecode" , Length1 : uint8Array.length , Subtype : "OpenType" };
					fontStreamDictionary["[stream]"] = stream;
					var fontDescriptor = { Type : "FontDescriptor" , FontName : key , FontFile3 : fontStreamDictionary };
					var font = { Type : "Font" , Subtype : "TrueType" , BaseFont : key , FontDescriptor : fontDescriptor }; // should the Subtype still be TrueType?
					objects.push(font);
					objects.push(fontDescriptor);
					objects.push(fontStreamDictionary);
				}
				else
				{
					throw new Error();
				}
			}
			
			fontResourceDict[fontId] = font;
		}
		
		// griddlCanvas.imageDict = { "Im1" : XObject1 , "Im2" : XObject2 }
		for (var key in griddlCanvas.imageDict)
		{
			var xObject = griddlCanvas.imageDict[key];
			
			objects.push(xObject);
			imageResourceDict[key] = xObject;
		}
		
		for (var i = 0; i < griddlCanvas.pages.length; i++)
		{
			var pg = griddlCanvas.pages[i];
			var commands = pg.pdfCommands.join('\r\n');
			
			var page = { Type : "Page" , Parent : pages , MediaBox : [ 0 , 0 , pg.width , pg.height ] , Resources : { Font : {} , XObject : {} } , Contents : null };
			var pagecontent = { Length : commands.length , "[stream]" : commands };
			
			// so, the *correct* approach here would be to only put the resources that are necessary to the page in the page's resource dict
			// however, that requires bookkeeping, and for what?  to save a few bytes?
			// so instead, we're just going to load the page's resource dict with the pointers to all fonts and images found in the document
			//if (pg.fontDict) { page.Resources.Font = pg.fontDict; }
			//if (pg.imageDict) { page.Resources.XObject = pg.imageDict; }
			page.Resources.Font = fontResourceDict;
			page.Resources.XObject = imageResourceDict;
			
			// this is the ducktape code for fonts that we use right now
			//page.Resources.Font.F1 = font;
			
			page.Contents = pagecontent;
			pages.Kids.push(page);
			objects.push(page);
			objects.push(pagecontent);
		}
		
		for (var i = 0; i < objects.length; i++)
		{
			objects[i]['[index]'] = i + 1;
		}
		
		var objstarts = [];
		var bytes = 0;
		
		var filelines = [];
		filelines.push('%PDF-1.7');
		filelines.push('');
		
		var bytes = '%PDF-1.7\r\n\r\n'.length;
		
		for (var i = 0; i < objects.length; i++)
		{
			var obj = objects[i];
			var objlines = [];
			
			objstarts.push(bytes);
			
			objlines.push(obj['[index]'].toString() + ' 0 obj');
			objlines.push(WritePdfObj(obj, false));
			
			if (obj['[stream]'])
			{
				objlines.push('stream');
				objlines.push(obj['[stream]']);
				objlines.push('endstream');
			}
			
			objlines.push('endobj');
			objlines.push('');
			
			var objstr = objlines.join('\r\n');
			bytes += objstr.length;
			filelines.push(objstr);
		}
		
		var xrefstart = bytes;
		
		filelines.push('xref');
		filelines.push('0 ' + (objects.length + 1).toString());
		filelines.push('0000000000 65535 f');
		for (var i = 0; i < objects.length; i++)
		{
			var bytestart = objstarts[i].toString();
			var len = bytestart.length;
			var line = '';
			for (var k = 0; k < 10 - len; k++)
			{
				line += '0';
			}
			line += bytestart + ' 00000 n';
			filelines.push(line);
		}
		
		filelines.push('trailer');
		filelines.push('<<');
		filelines.push('/Size ' + (objects.length + 1).toString());
		if (objects[0].Type != 'Catalog') { throw new Error(); } // check for the assumption that root is 1 0 R
		filelines.push('/Root 1 0 R');
		filelines.push('>>');
		filelines.push('startxref');
		filelines.push(xrefstart.toString());
		filelines.push('%%EOF');
		return filelines.join('\r\n');
	}
	function WritePdfDict(obj) {
		var str = '';
		str += '<<';
		str += '\r\n';
		for (var key in obj)
		{
			if (key[0] != '[') // avoid [index], [stream], etc. fields
			{
				str += '/' + key + ' ';
				str += WritePdfObj(obj[key], true);
				str += '\r\n';
			}
		}
		str += '>>';
		//str += '\r\n';
		return str;
	}
	function WritePdfList(obj) {
		var str = '';
		str += '[ ';
		for (var key in obj)
		{
			str += WritePdfObj(obj[key], true);
			str += ' ';
		}
		str += ']';
		return str;
	}
	function WritePdfObj(obj, canBeIndirect) {
		var s = null;
		var type = typeof(obj);
		
		if (type == 'object')
		{
			if (canBeIndirect && obj['[index]'])
			{
				s = obj['[index]'].toString() + ' 0 R';
			}
			else
			{
				if (obj.concat) // this is how we test for a list
				{
					s = WritePdfList(obj);
				}
				else
				{
					s = WritePdfDict(obj);
				}
			}
		}
		else if (type == 'number')
		{
			s = obj.toString();
		}
		else if (type == 'string')
		{
			if (obj[0] == '"')
			{
				s = '(' + obj.substring(1, obj.length - 1) + ')';
			}
			else
			{
				s = '/' + obj.toString();
			}
		}
		else
		{
			throw new Error();
		}
		
		return s;
	}
	
	function Uint8ArrayToAsciiHexDecode(uint8Array) {
		
		var ascii = [];
		
		for (var i = 0; i < uint8Array.length; i++)
		{
			var b = uint8Array[i];
			var hex = ((b < 0x10) ? '0' : '') + b.toString(16).toUpperCase();
			ascii.push(hex);
		}
		
		return ascii.join('');
	}
	
	function Download(g) {
		
		var pdf = new Griddl.Pdf(g);
		
		var downloadLink = document.createElement('a');
		var url = window.URL;
		downloadLink.href = url.createObjectURL(new Blob([pdf.text], {type : 'text/pdf'}));
		downloadLink.download = 'document.pdf';
		document.body.appendChild(downloadLink); // needed for this to work in firefox
		downloadLink.click();
		document.body.removeChild(downloadLink); // cleans up the addition above
	}
	
	Pdf.Download = Download;
	
	return Pdf;
})();

