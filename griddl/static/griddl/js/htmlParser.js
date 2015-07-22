
(function () {

function parserModule() {

function Tokenization() {
	
	this.GetToken = function(k)
	{
		
	};
}

// we need an aggregate-type token, which defines a stretch of characters, most of which map to the underlying byte (but some of which do not)
// this structure needs to solve two problems:
//  1. lexically-continuous English text can be disjointed over multiple objects (like HTML text nodes)
//  2. text encodings like UTF-8 map most bytes to a single char - but not all
//  3. we want to be able to index lexically-continuous somehow-encoded chars with a simple integer
//  4. BUT, we don't want to create a token for each char!
//  5. so we can't just index naively into the bytes, and we can't create a whole new layer of structures that we *can* index naively into
//  6. which means that we just can't index naively - there needs to be some sort of translation
//  7. so how to implement GetToken()?
//  8. well, for *some* applications (like indexing into an array of tokens), we *do* just want to be able to index naively
//  9. but for indexing into chars, we don't
// 10. so we need to support both


var charset = "Utf8";

var special = {};
special['/'] = 'Closed';
special['?'] = 'Question';
special['!'] = 'Exclamation';

var specialEnd = {};
specialEnd['/'] = 'Clopen';
specialEnd['?'] = 'Question';
specialEnd['!'] = 'Exclamation';

// a big underlying issue is whether the base texts are bytes or chars - when should character decoding be done?
// to hew to the theme of annotating an immutable base text, even decoding bytes to a string of characters can be considered an annotation
// this quickly runs into performance issues, of course
// an alternative is to just work with bytes and layer token annotations on top of the bytes, and just sort of deal with character decoding in an inline fashion
// and then there's the issue of dealing with English text as a base layer, and the leaky abstractions underneath that
// for example, besides simple character encoding issues, there's also the notion of different unicode characters that are all interpreted as apostrophes
// and there's also HTML encodings like &gt; - this requires an annotation (to '>') above it that the English clients can see

// preliminary decisions regarding the issues above:
// assume that we are working with a base string or array of chars, not bytes
// convert bytes to chars as a first step

// Html annotations
// { type : "Text" , start : 0 , end : 1 }
// { type : "Tag" , tagtype : "Open" , start : 0 , end : 1 , attrs : [] , children : [] }
// { type : "Attr" , key : {} , val : {} }
// { start : 0 , end : 1 } // this is for names and stretches of text and such - maybe there should be a type field

function ReadHtml(x) {
	
	var html = {};
	html.type = "Html";
	html.root = null;
	html.elts = [];
	var k = { i : 0 };
	var pct = 0;
	
	while (k.i < x.length)
	{
		if (false) { if ((k.i * 100) / x.length > pct) { pct = (k.i * 100) / x.length; console.log(pct.toString() + "%"); } }
		
		//console.log(x[k.i]);
		
		if (x[k.i] == '<')
		{
			if (x[k.i + 1] == '!')
			{
				if (x[k.i + 2] == '-' && x[k.i + 3] == '-')
				{
					ReadUntil(x, k, "-->");
				}
				else
				{
					html.elts.push(ReadSpecialTag(x, k));
				}
			}
			else
			{
				var reset = k.i;
				
				var tag = ReadTag(x, k);
				
				if (tag == null) // this often happens if there is an unscrubbed '<' in a Text
				{
					var text = {};
					text.type = "Text";
					text.start = reset;
					text.end = reset + 1;
					k.i = reset + 1;
					html.elts.push(text);
					html.elts.push(ReadText(x, k));
				}
				else
				{
					html.elts.push(tag);
					
					if (Value(x, tag.name).toLowerCase() == "script" && tag.tagtype == "Open")
					{
						var script = ReadTextUntil(x, k, "</script>", true);
						html.elts.push(script);
					}
					
					//if (tag.name == "meta")
					//{
					//	var content = tag.GetAttr("content");
					//	
					//	if (content != null)
					//	{
					//		if (content.ToLower() == "text/html; charset=utf-8")
					//		{
					//			charset = "Utf8";
					//		}
					//		else if (content.ToLower() == "text/html; charset=iso-8859-1")
					//		{
					//			charset = "Iso88591";
					//		}
					//	}
					//}
				}
			}
		}
		else
		{
			var text = ReadText(x, k)
			html.elts.push(text);
		}
		
		//if (html.elts[html.elts.length - 1].tagtype == "Nullo") { throw new Error(); }
	}
	
	return html;
}
function ReadTextUntil(x, k, stop, ignoreCase) {
	
	var text = {};
	text.tagtype = "Text";
	text.start = k.i;
	
	while (k.i < x.length)
	{
		var j = 0;
		var match = true;
		
		while (j < stop.length)
		{
			var c = x[k.i + j];
			
			if (ignoreCase && ('A' <= c && c <= 'Z') || ('a' <= c && c <= 'z'))
			{
				if (c.toLowerCase() != stop[j].toLowerCase()) { match = false; break; }
			}
			else
			{
				if (c != stop[j]) { match = false; break; }
			}
			
			j++;
		}
		
		if (match) { break; }
		k.i++;
	}
	
	text.end = k.i;
	return text;
}
function ReadText(x, k) {
	
	var result = {};
	result.tagtype = "Text";
	result.start = k.i;
	
	while (k.i < x.length && x[k.i] != '<')
	{
		var c = x[k.i];
		k.i++;
		//if (c > 127)
		//{
		//	//if (charset == "Utf8") { Utf8(x, k); }
		//	//else if (charset == "Iso88591") { Iso88591(x, k); }
		//	//else { throw new Error(); }
		//	k.i++;
		//}
		//else if (c == '&'.charCodeAt())
		//{
		//	//HtmlCode(x, k);
		//	k.i++;
		//}
		//else
		//{
		//	k.i++;
		//}
	}
	
	result.end = k.i;
	return result;
}
function ReadSpecialTag(x, k) {
	
	// Here, we just read until we find a '>'
	var tag = {};
	tag.type = "Tag";
	tag.start = k.i;
	if (x[k.i] != '<') { throw new Error(); }
	tag.tagtype = 'Open';
	k.i++;
	
	if (x[k.i] == '/')
	{
		tag.tagtype = "Closed";
		k.i++;
	}
	else if (x[k.i] == '?')
	{
		tag.tagtype = "Question";
		k.i++;
	}
	else if (x[k.i] == '!')
	{
		// Possible forms of ! tags:
		//<!--[if IE 8]>
		//<![endif]-->
		//<!-- null -->
		//<!-- FLOAT CLEAR -->
		//<!-- END: headercustomerinfo -->
		//<!--[if lte IE 6]>
		//<![if gte IE 6]>
		//<![endif]>
		//<!-- Version: 1.0.50  Date: 2010-11-03  -->
		
		tag.tagtype = "Exclamation";
		k.i++;
		
		while (k.i < x.length)
		{
			if (x[k.i] == '>')
			{
				k.i++;
				tag.end = k.i;
				return tag;
			}
			else
			{
				k.i++;
			}
		}
	}
	
	tag.name = ReadHtmlName(x, k);
	
	while (k.i < x.length)
	{
		if (x[k.i] == '>')
		{
			k.i++;
			tag.end = k.i;
			return tag;
		}
		else if (x[k.i] == '/')
		{
			if (k.i + 1 < x.length && x[k.i + 1] == '>')
			{
				tag.tagtype = "Clopen";
				k.i += 2;
				tag.end = k.i;
				return tag;
			}
			else
			{
				//throw new Exception();
				k.i++; // just ignore extra slashes in the tag
			}
		}
		else
		{
			k.i++;
		}
	}
	
	throw new Error();
}
function ReadTag(x, k) {
	
	var tag = {};
	tag.type = 'Tag';
	tag.attrs = [];
	tag.start = k.i;
	var start = k.i;
	if (x[k.i] != '<') { throw new Error(); }
	tag.tagtype = 'Open';
	k.i++;
	if (special[x[k.i]]) { tag.tagtype = special[x[k.i]]; k.i++; }
	tag.name = ReadHtmlName(x, k);
	if (tag.name.start == tag.name.end) { throw new Error() };
	while (true)
	{
		ReadWhitespace(x, k);
		
		if (x[k.i] == '>')
		{
			k.i++;
			tag.end = k.i;
			return tag;
		}
		else if (specialEnd[x[k.i]])
		{
			if (x[k.i + 1] == '>')
			{
				tag.tagtype = specialEnd[x[k.i]];
				k.i += 2;
				tag.end = k.i;
				return tag;
			}
			else
			{
				//throw new Error();
				k.i++; // indicates a { / , ? , ! } not followed by a > - just ignore it
			}
		}
		else
		{
			// as a last resort, just return a special tag, with no internal structure
			//try { result.attributes.Add(ReadAttr(x, i)); } catch { i = start; return ReadSpecialTag(x, i); }
			var attr = ReadAttr(x, k);
			tag.attrs.push(attr);
		}
	}
}
function ReadAttr(x, k) {
	var attr = {};
	attr.type = "Attr";
	attr.start = k.i;
	attr.key = ReadHtmlName(x, k); // HtmlName returns { start : 0 , end : 0 }
	if (attr.key.start == attr.key.end) { throw new Error(); }
	ReadWhitespace(x, k); // space before the =
	if (x[k.i] != '=') { attr.val = null; attr.end = k.i; return result; } // some attributes have no following '='
	k.i++; // the '='
	ReadWhitespace(x, k); // space the =
	attr.val = (x[k.i] == '"' || x[k.i] == "'") ? Quoted(x, k) : ReadNonWhitespace(x, k); // some attributes do not enclose values in quotes
	if (attr.val.start == attr.val.end) { throw new Error(); }
	attr.end = k.i;
	return attr;
}
function ReadHtmlName(x, k) {
	// { A-Z a-z _ } then { A-Z a-z 0-9 - _ : }*
	var name = {};
	name.start = k.i;
	
	var c = x[k.i];
	
	if (('A' <= c && c <= 'Z') || ('a' <= c && c <= 'z') || c == '_')
	{
		k.i++;
	}
	else
	{
		throw new Error();
	}
	
	while (k.i < x.length)
	{
		c = x[k.i];
		
		if (('A' <= c && c <= 'Z') || ('a' <= c && c <= 'z') || ('0' <= c && c <= '9') || c == '_' || c == '-' || c == ':')
		{
			k.i++;
		}
		else
		{
			break;
		}
	}
	
	name.end = k.i;
	return name;
}

/*
function Utf8(x, k) {
	var b = [];
	
	if (x[i] >= 240)
	{
		b.Add(x[i++]);
		b.Add(x[i++]);
		b.Add(x[i++]);
		b.Add(x[i++]);
	}
	else if (x[i] >= 224)
	{
		b.Add(x[i++]);
		b.Add(x[i++]);
		b.Add(x[i++]);
	}
	else if (x[i] >= 192)
	{
		b.Add(x[i++]);
		b.Add(x[i++]);
	}
	else
	{
		throw new Exception();
	}
	
	byte[] bytes = b.ToArray();
	
	// Here, we override known Unicode characters with their equivalent ASCII formats.
	if (bytes.Length == 2 && bytes[0] == 194 && bytes[1] == 146)
	{
		// This is U+0092 (146 decimal), which is Private Use 2, not an apostrophe.
		// But I often see it used in places where an apostrophe should be used.
		// Note below, that the ampersand code &#146; is an apostrophe.  Coincidence?
		c = '\'';
	}
	else if (bytes.Length == 2 && bytes[0] == 0xC2 && bytes[1] == 0xBB)
	{
		// This is U+0092 (146 decimal), which is Private Use 2, not an apostrophe.
		// But I often see it used in places where an apostrophe should be used.
		// Note below, that the ampersand code &#146; is an apostrophe.  Coincidence?
		c = (char)0xBB;
	}
	else if (bytes.Length == 3 && bytes[0] == 0xE2 && bytes[1] == 0x80 && bytes[2] == 0x9C)
	{
		c = '"';
	}
	else if (bytes.Length == 3 && bytes[0] == 0xE2 && bytes[1] == 0x80 && bytes[2] == 0x9D)
	{
		c = '"';
	}
	else if (bytes.Length == 3 && bytes[0] == 0xE2 && bytes[1] == 0x80 && bytes[2] == 0x99)
	{
		c = '\'';
	}
	else
	{
		c = ' ';
	}
}
function Iso88591(x, k) {
	if (0xA0 <= x[i] && x[i] <= 0xFF)
	{
		c = '.'; // way too lazy to implement the ISO-8859-1 => Unicode mapping
		i++;
	}
	else
	{
		if (x[i] == 0x85)
		{
			c = '*';
			i++;
		}
		else if (x[i] == 0x92)
		{
			c = '\'';
			i++;
		}
		else if (x[i] == 0x93)
		{
			c = '"';
			i++;
		}
		else if (x[i] == 0x94)
		{
			c = '"';
			i++;
		}
		else if (x[i] == 0x96)
		{
			c = ' ';
			i++;
		}
		else
		{
			c = ' ';
			i++;
		}
	}
}
function HtmlCode(x, k) {
	
	var code = null;
	var place = 0;
	
	if (x[i] == '#')
	{
		// unicode code povar references
		// &#nnnn; - may contain any number of digits, including leading zeroes.  decimal
		// &#xhhhh; - may contain any number of digits, including leading zeroes.  hexadecimal.  cap or lower case
		// &#Xhhhh; - may contain any number of digits, including leading zeroes.  hexadecimal.  cap or lower case
		
		i++; // the '#'
		
		if (x[i] == 'x' || x[i] == 'X')
		{
			ReadUntil(x, i, ";");
			c = ' ';
			ReadWhitespace(x, i);
			continue;
			//throw new Exception(); // time to add support for hexadecimal
		}
		
		code = SimpleParser.ReadDigits(x, i);
		i++; // the ;
		
		if (code == null)
		{
			throw new Exception();
		}
		else
		{
			var intcode = int.Parse(code);
			
			if (intcode == 146)
			{
				c = '\'';
			}
			else if (intcode == 147)
			{
				c = '"';
			}
			else if (intcode == 148)
			{
				c = '"';
			}
			else
			{
				c = (char)int.Parse(code);
			}
		}
	}
	else
	{
		place = i;
		code = ReadHtmlName(x, i);
		
		if (code == null)
		{
			c = '&'; // this can happen in the case of a bare & in the text (it should be &amp;, but you know...)
			i = place;
		}
		else if (codes.ContainsKey(code))
		{
			c = codes[code];
			i++; // the ';'
		}
		else
		{
			c = '&'; // this can happen in the case of a bare & in the text (it should be &amp;, but you know...)
			i = place;
		}
	}
}
*/

var upper = [ 'A' , 'B' , 'C' , 'D' , 'E' , 'F' , 'G' , 'H' , 'I' , 'J' , 'K' , 'L' , 'M' , 'N' , 'O' , 'P' , 'Q' , 'R' , 'S' , 'T' , 'U' , 'V' , 'W' , 'X' , 'Y' , 'Z' ];
var lower = [ 'a' , 'b' , 'c' , 'd' , 'e' , 'f' , 'g' , 'h' , 'i' , 'j' , 'k' , 'l' , 'm' , 'n' , 'o' , 'p' , 'q' , 'r' , 's' , 't' , 'u' , 'v' , 'w' , 'x' , 'y' , 'z' ];
var digit = [ '0' , '1' , '2' , '3' , '4' , '5' , '6' , '7' , '8' , '9' ];

function Value(str, annot) { return str.substring(annot.start, annot.end); }

function ReadCss(x) {
	
	var k = { i : 0 };
	
	var css = {};
	css.type = "Css";
	css.start = k.i;
	css.statements = [];
	
	while (k.i < x.length)
	{
		ReadWhitespace(x, k);
		
		if (x[k.i] == '/' && x[k.i + 1] == '*')
		{
			ReadSlashStarComment(x, k);
		}
		else
		{
			css.statements.push(ReadCssStatement(x, k));
		}
		
		ReadWhitespace(x, k);
	}
	
	css.end = k.i;
	return css;
}
function ReadCssStatement(x, k) {
	
	var statement = {};
	statement.type = "CssStatement";
	statement.start = k.i;
	statement.selector = ReadSelector(x, k);
	statement.body = ReadBody(x, k);
	statement.end = k.i;
	return statement;
}
function ReadSelector(x, k) {
	
	var selector = {};
	selector.type = "CssSelector";
	selector.start = k.i;
	selector.partsAndConnectors = [];
	
	while (k.i < x.length && x[k.i] != '{')
	{
		selector.partsAndConnectors.push(ReadSelectorPart(x, k));
		ReadWhitespace(x, k);
		selector.partsAndConnectors.push(ReadConnector(x, k)); // should omit the last one of these so that partsAndConnectors is pure post-and-rail
		ReadWhitespace(x, k);
		//if (k.i > 0) { debugger; }
	}
	
	selector.end = k.i;
	return selector;
}
function ReadSelectorPart(x, k) {
	
	var part = {};
	part.type = "CssSelectorPart";
	part.start = k.i;
	
	// the while expression is a real mess, but the break can be either whitespace or a connector
	while (upper.indexOf(x[k.i]) > -1 || lower.indexOf(x[k.i]) > -1 || digit.indexOf(x[k.i]) > -1 || x[k.i] == '#' || x[k.i] == '.' || x[k.i] == '*')
	{
		if (x[k.i] == '#')
		{
			k.i++;
		}
		else if (x[k.i] == '.')
		{
			k.i++;
		}
		else if (x[k.i] == '*')
		{
			k.i++;
			return; // i think a star has to be by itself?
		}
		else if (x[k.i] == ':')
		{
			k.i++;
		}
		else if (x[k.i] == '[') // input[type=x]
		{
			k.i++; // [
			ReadWhitespace(x, k);
			ReadCssSelectorName(x, k);
			ReadWhitespace(x, k);
			k.i++; // =
			ReadWhitespace(x, k);
			ReadCssSelectorName(x, k);
			ReadWhitespace(x, k);
			k.i++; // ]
			return;
		}
		
		ReadCssSelectorName(x, k);
	}
	
	part.end = k.i;
	return part;
}
function ReadConnector(x, k) {
	
	var connector = {};
	connector.type = "CssConnector";
	connector.start = k.i;
	connector.symbol = " ";
	
	if (x[k.i] == ',')
	{
		connector.symbol = ",";
		k.i++;
	}
	else if (x[k.i] == '>')
	{
		connector.symbol = ">";
		k.i++;
	}
	else if (x[k.i] == '+')
	{
		connector.symbol = "+";
		k.i++;
	}
	// etc.
	
	connector.end = k.i;
	return connector;
}
function ReadCssSelectorName(x, k) {
	
	while (k.i < x.length && (upper.indexOf(x[k.i]) > -1 || lower.indexOf(x[k.i]) > -1 || digit.indexOf(x[k.i]) > -1 || x[k.i] == '-' || x[k.i] == '_'))
	{
		k.i++;
	}
}
function ReadBody(x, k) {
	
	var body = {};
	body.type = "CssBody";
	body.start = k.i;
	body.styles = [];
	
	k.i++; // {
	
	ReadWhitespace(x, k);
	
	while (k.i < x.length && x[k.i] != '}')
	{
		body.styles.push(ReadStyle(x, k));
		ReadWhitespace(x, k);
	}
	
	k.i++; // }
	
	body.end = k.i;
	return body;
}
function ReadStyle(x, k) {
	
	var style = {};
	style.type = "CssStyle";
	style.start = k.i;
	
	style.key = ReadStyleKey(x, k);
	ReadWhitespace(x, k);
	k.i++; // :
	ReadWhitespace(x, k);
	style.val = ReadStyleVal(x, k);
	ReadWhitespace(x, k);
	if (x[k.i] == ';') { k.i++; }
	
	style.end = k.i;
	return style;
}
function ReadStyleKey(x, k) {
	
	// permit dashes and underscores - although i'd imagine only whitelisted keys actually have any effect
	
	var key = {};
	key.type = "CssStyleKey";
	key.start = k.i;
	
	while (k.i < x.length && (upper.indexOf(x[k.i]) > -1 || lower.indexOf(x[k.i]) > -1 || digit.indexOf(x[k.i]) > -1 || x[k.i] == '-' || x[k.i] == '_'))
	{
		k.i++;
	}
	
	key.end = k.i;
	return key;
}
function ReadStyleVal(x, k) {
	
	// for now, we're just going to accept free-form input up to the semicolon
	// these values vary widely and the format depends on the key
	
	var val = {};
	val.type = "CssStyleVal";
	val.start = k.i;
	
	while (k.i < x.length && x[k.i] != ';')
	{
		k.i++;
	}
	
	val.end = k.i;
	return val;
}

function TokenizeEnglish(text) {
	
	var tokenization = {};
	tokenization.text = text;
	tokenization.tokens = [];
	
	var k = { i : 0 };
	
	while (HasNext(text, k))
	{
		var token = {};
		token.start = k.i;
		
		if (IsLetter(text, k))
		{
			
		}
		else if (IsDigit(text, k))
		{
			
		}
		else
		{
			k.i++;
		}
		
		token.end = k.i;
		
		tokenization.tokens.push(token);
	}
	
	return tokenization;
}
function TokenizeJavascript(x) {

}

function ReadWhitespace(x, k) {
	
	while (k.i < x.length && x[k.i] == '\n' || x[k.i] == '\r' || x[k.i] == '\t' || x[k.i] == ' ')
	{
		k.i++;
	}
}
function ReadNonWhitespace(x, k) {
	var result = {};
	result.start = k.i;
	
	var c = x[k.i];
	
	while (k.i < x.length && c != '\n' && c != '\r' && c != '\t' && c != ' ' && c != '>')
	{
		k.i++;
		c = x[k.i];
	}
	
	result.end = k.i;
	return result;
}
function Quoted(x, k) {
	var result = {};
	result.start = k.i;
	var quote = x[k.i];
	if (quote != '"' && quote != "'") { throw new Error(); }
	k.i++;
	var c = x[k.i];

	while (c != quote)
	{
		//if (c < 0x80)
		//{
		//	if (c == '\\' && i + 1 < x.length && x[k.i + 1] == quote) // skip over escaped characters
		//	{
		//		k.i++; // other i++ at bottom of while loop
		//	}
		//}
		//else
		//{
		//	var l = [];
		//	
		//	if (c > 240)
		//	{
		//		l.push(x[k.i++]);
		//		l.push(x[k.i++]);
		//		l.push(x[k.i++]);
		//		l.push(x[k.i]);
		//	}
		//	else if (c > 224)
		//	{
		//		l.push(x[k.i++]);
		//		l.push(x[k.i++]);
		//		l.push(x[k.i]);
		//	}
		//	else if (c > 192)
		//	{
		//		l.push(x[k.i++]);
		//		l.push(x[k.i]);
		//	}
		//	else
		//	{
		//		throw new Error();
		//	}
		//}
		
		if (c == '\\' && i + 1 < x.length && x[k.i + 1] == quote) // skip over escaped characters
		{
			k.i++; // other i++ at bottom of while loop
		}
		
		k.i++;
		c = x[k.i];
		
		// Temporarily escaped, to allow bare backslashes to be included in quotes, such as "\"
		//if (x[i] == '\\' && x[i + 1] == '"')
		//{
		//    result += "\"";
		//    i += 2;
		//}
		//else if (x[i] == '\\' && x[i + 1] == '\'')
		//{
		//    result += "'";
		//    i += 2;
		//}
		//else
		//{
		//    result += (char)x[i];
		//    i++;
		//}
	}
	
	k.i++;
	result.end = k.i;
	return result;
}
function ReadUntil(x, k, stop) {
	var result = {};
	result.start = k.i;
	
	var c = x[k.i];
	
	while (k.i < x.length)
	{
		var j = 0;
		var match = true;
	
		while (j < stop.length)
		{
			if (x[k.i + j] == stop[j])
			{
				j++;
			}
			else
			{
				match = false;
				break;
			}
		}
	
		if (match)
		{
			k.i += j;
			result.end = k.i;
			return result;
		}
		
		k.i++;
	}
	
	result.end = k.i;
	return result;
}

var Parser = {};
Parser.ReadHtml = ReadHtml;
Parser.ReadCss = ReadCss;
Parser.TokenizeEnglish = TokenizeEnglish;
Parser.TokenizeJavascript = TokenizeJavascript;
return Parser;

}

if (typeof define === "function" && define.amd) {
	define(parserModule);
} else if (typeof module !== 'undefined' && module.exports) {
	module.exports = parserModule();
} else {
	this.Parser = parserModule();
}

})();


