
(function () {

function generalParserModule() {

var grammar = {};
grammar.expression = { type : 'Seq' , children : [] };
grammar.statement = { type : 'Seq' , children : [] };

var englishGrammar = {};
englishGrammar.Money = { type : 'Seq' , children : [ { type : 'Term' , value : '$' } , { type : 'Non' , name : 'CommaDigits' } ] };
englishGrammar.CommaDigits = { type : 'Alt' , children : [ { type : 'Term' , value : 'DIGITS' } , { type : 'Non' , name : 'CommaDigitsRec' } ] };
englishGrammar.CommaDigitsRec = { type : 'Seq' , children : [ { type : 'Term' , value : 'DIGITS' } , { type : 'Term' , value : ',' } , { type : 'Non' , name : 'CommaDigits' } ] };

var simpleGrammar = [];
simpleGrammar[0] = { id : 0 , name : 'Name'           , type : 'Term' , value : 'NAME'   , opts : [] , subs : [] };
simpleGrammar[1] = { id : 1 , name : 'Digits'         , type : 'Term' , value : 'DIGITS' , opts : [] , subs : [] };
simpleGrammar[2] = { id : 2 , name : 'DollarSign'     , type : 'Term' , value : '$'      , opts : [] , subs : [] };
simpleGrammar[3] = { id : 3 , name : 'Comma'          , type : 'Term' , value : ','      , opts : [] , subs : [] };
simpleGrammar[4] = { id : 4 , name : 'CommaDigitsRec' , type : 'Seq'  , value : null     , opts : [] , subs : [] };
simpleGrammar[5] = { id : 5 , name : 'CommaDigits'    , type : 'Alt'  , value : null     , opts : [] , subs : [] };
simpleGrammar[6] = { id : 6 , name : 'Money'          , type : 'Seq'  , value : null     , opts : [] , subs : [] };

var nameToGramDict = {};
for (var i = 0; i < simpleGrammar.length; i++) { if (simpleGrammar[i].name) { nameToGramDict[simpleGrammar[i].name] = simpleGrammar[i]; } }

nameToGramDict['CommaDigitsRec'].subs[0] = nameToGramDict['Digits'];
nameToGramDict['CommaDigitsRec'].subs[1] = nameToGramDict['Comma'];
nameToGramDict['CommaDigitsRec'].subs[2] = nameToGramDict['CommaDigits'];
nameToGramDict['CommaDigits'].subs[0] = nameToGramDict['Digits'];
nameToGramDict['CommaDigits'].subs[1] = nameToGramDict['CommaDigitsRec'];
nameToGramDict['Money'].subs[0] = nameToGramDict['DollarSign'];
nameToGramDict['Money'].subs[1] = nameToGramDict['CommaDigits'];

var tokenization = {};
tokenization.text = '$1,000,000';
tokenization.tokens = [];
tokenization.tokens[0] = { type : '$'      , start : 0 , end : 1 };
tokenization.tokens[1] = { type : 'DIGITS' , start : 1 , end : 2 };
tokenization.tokens[2] = { type : ','      , start : 2 , end : 3 };
tokenization.tokens[3] = { type : 'DIGITS' , start : 3 , end : 6 };
tokenization.tokens[4] = { type : ','      , start : 6 , end : 7 };
tokenization.tokens[5] = { type : 'DIGITS' , start : 7 , end : 10 };

var instances = Scalable(tokenization, simpleGrammar);
var fullseqs = FindFullSeqs(instances);

function FindFullSeqs(instances) {
	
	var result = [];
	
	for (var i = 0; i < instances.length; i++)
	{
		var instance = instances[i];
		
		if (instance.gram.type == 'Seq' && !instance.seqPart)
		{
			result.push(instance);
		}
	}
	
	return result;
}
function Scalable(text, gs) {
	
	var STA = 0;
	var END = 1;
	var posts = new Array(text.text.length + 1); // Dictionary<Gram, List<var>[]>[]     text + 1 // text x grams x {Start,End}
	for (var i = 0; i < posts.length; i++) { posts[i] = {}; }
	var maxInstances = 1000 * 1000;
	var instances = new Array(maxInstances); // maxInstances x {start,end,gram,created}
	var positionOfNewInstance = { i : 0 };
	
	// in natural language parsing, it's okay to have ground nulls
	CreateGroundLevelInstances(text, gs).filter(function(x) { return x != null; }).forEach(function(x) { AddNonDuplicateInstance(x, posts, instances, positionOfNewInstance); });
	
	for (var focusInstance = 0; focusInstance < maxInstances; focusInstance++)
	{
		if (focusInstance > 0 && focusInstance % 1000 == 0) { console.log(focusInstance); }
		var focus = instances[focusInstance];
		if (focus == null) { break; }
		var n = focus.gram.subs.length;
		if (focus.seqPart && focus.internalA == 0 && focus.internalB == n) { focus.seqPart = false; }
	
		if (focus.seqPart)
		{
			if (focus.internalA > 0) { SeekPrev(focus, focusInstance, END, instances, positionOfNewInstance, posts); }
			if (focus.internalB < n) { SeekNext(focus, focusInstance, STA, instances, positionOfNewInstance, posts); }
		}
		else // look for higher-level grams that have this as a part
		{
			SeekHigherLevelSeq(focus, focusInstance, gs, instances, positionOfNewInstance, posts);
		}
	}
	
	// Instance[1,000,000] => Instance[956,245]
	var result = new Array(positionOfNewInstance.i);
	for (var i = 0; i < result.length; i++) { result[i] = instances[i]; }
	return result;
}
function CreateGroundLevelInstances(text, gs) {
	
	var xs = new Array(text.tokens.length);
	
	// creation of the base level of terminals
	for (var i = 0; i < text.tokens.length; i++)
	{
		var x = {};
		x.externalA = i;
		x.externalB = i + 1;
		x.token = text.tokens[i];
		x.seqPart = false;
		
		var found = 0;
		
		for (var k = 0; k < gs.length; k++)
		{
			var gram = gs[k];
			
			if (gram.value == text.tokens[i].type) // changed from gram.name
			{
				x.gram = gram;
				xs[i] = x;
				found++;
			}
		}
		
		if (found == 0)
		{
			// for parsing natural language, we do not necessarily expect to have full coverage of the text with terminal grams
			// in those cases, we're okay with found == 0
		}
		else if (found > 1)
		{
			throw new Error();
		}
		else
		{
			// patch keywords
			if (x.gram.value == "NAME") // changed from gram.name
			{
				var tokenval = text.text.substr(text.tokens[i].start, text.tokens[i].end);
				
				for (var k = 0; k < gs.length; k++)
				{
					var gram = gs[k];
					
					if (gram.value == tokenval) // changed from gram.name
					{
						x.gram = gram;
					}
				}
			}
			
			x.created = text.length; // this is a bit of a hack to make sure that all instances are looked at
		}
	}
	
	return xs;
}
function SeekHigherLevelSeq(focus, focusInstance, gs, instances, positionOfNewInstance, posts) {
	
	for (var i = 0; i < gs.length; i++)
	{
		var gram = gs[i];
		
		for (var k = 0; k < gram.subs.length; k++)
		{
			if (gram.subs[k] == focus.gram)
			{
				var x = {};
				x.externalA = focus.externalA;
				x.externalB = focus.externalB;
				x.gram = gram;
				x.created = focusInstance;
				x.subs = [ focus ];
				
				if (gram.type == "Seq") // to optimize, we should only look for some seqparts when hinted - NAMEs for instance are too common - anchor the search onto keywords
				{
					x.seqPart = true;
					x.internalA = k;
					x.internalB = k + 1;
				}
				else if (gram.type == "Alt")
				{
					x.seqPart = false;
				}
				else
				{
					throw new Error();
				}
				
				AddNonDuplicateInstance(x, posts, instances, positionOfNewInstance);
			}
		}
	}
}
function SeekPrev(focus, focusInstance, END, instances, positionOfNewInstance, posts) {
	
	for (var i = 0; i < posts[focus.externalA][focus.gram.id][END].length; i++)
	{
		var prev = instances[i];
		var accept = false;
		
		if (prev.seqPart && prev.internalB <= focus.internalA)
		{
			accept = true;
		
			for (var k = prev.internalB; k < focus.internalA; k++)
			{
				if (!focus.gram.opts[k])
				{
					accept = false;
					break;
				}
			}
		}
		
		if (accept)
		{
			var x = MakePrev(focusInstance, focus, prev);
			AddNonDuplicateInstance(x, posts, instances, positionOfNewInstance);
		}
	}
}
function SeekNext(focus, focusInstance, START, instances, positionOfNewInstance, posts) {
	
	for (var i = 0; i < posts[focus.externalB][focus.gram.id][START].length; i++)
	{
		var next = instances[i];
		var accept = false;
		
		if (next.seqPart && focus.internalB <= next.internalA)
		{
			accept = true;
			
			for (var k = focus.internalB; k < next.internalA; k++)
			{
				if (!focus.gram.opts[k])
				{
					accept = false;
					break;
				}
			}
		}
		
		if (accept)
		{
			var x = MakeNext(focusInstance, focus, next);
			AddNonDuplicateInstance(x, posts, instances, positionOfNewInstance);
		}
	}
}
function MakePrev(focusInstance, focus, prev) {
	
	var x = new Instance();
	x.externalA = prev.externalA;
	x.externalB = focus.externalB;
	x.gram = focus.gram;
	x.created = focusInstance;
	x.subs = new Array(prev.subs.length + focus.subs.length);
	var c = 0;
	for (var j = 0; j < prev.subs.length; j++) { x.subs[c++] = prev.subs[j]; }
	for (var j = 0; j < focus.subs.length; j++) { x.subs[c++] = focus.subs[j]; }
	x.seqPart = true;
	x.internalA = prev.internalA;
	x.internalB = focus.internalB;
	return x;
}
function MakeNext(focusInstance, focus, next) {
	
	var x = {};
	x.externalA = focus.externalA;
	x.externalB = next.externalB;
	x.gram = focus.gram;
	x.created = focusInstance;
	x.subs = new Array(focus.subs.length + next.subs.length);
	var c = 0;
	for (var j = 0; j < focus.subs.length; j++) { x.subs[c++] = focus.subs[j]; }
	for (var j = 0; j < next.subs.length; j++) { x.subs[c++] = next.subs[j]; }
	x.seqPart = true;
	x.internalA = focus.internalA;
	x.internalB = next.internalB;
	return x;
}
function AddNonDuplicateInstance(x, posts, instances, positionOfNewInstance) {
	
	if (posts[x.externalA][x.gram.id])
	{
	for (var n = 0; n < posts[x.externalA][x.gram.id][0].length; n++)
	{
		if (instances[n].externalB == x.externalB) { if (x.seqPart) { if (instances[n].internalA == x.internalA && instances[n].internalB == x.internalB) { return; } } else { return; } }
	}
	}
	else
	{
		posts[x.externalA][x.gram.id] = [ [] , [] ];
	}
	
	if (!posts[x.externalB][x.gram.id])
	{
		posts[x.externalB][x.gram.id] = [ [] , [] ];
	}
	
	instances[positionOfNewInstance.i] = x;
	x.id = positionOfNewInstance.i;
	posts[x.externalA][x.gram.id][0].push(positionOfNewInstance.i);
	posts[x.externalB][x.gram.id][1].push(positionOfNewInstance.i);
	positionOfNewInstance.i++;
}

var GeneralParser = {};
GeneralParser.FindFullSeqs = FindFullSeqs;
return GeneralParser;

}

if (typeof define === "function" && define.amd) {
	define(generalParserModule);
} else if (typeof module !== 'undefined' && module.exports) {
	module.exports = generalParserModule();
} else {
	this.GeneralParser = generalParserModule();
}

})();

