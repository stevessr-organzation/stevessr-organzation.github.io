var thisAddon 	= this;
var appName 	= this.package.name;
var spawn 		= spawn || require('child_process').spawn;
var ws 			= ws || require('windows-shortcuts');
var ini 		= ini || require('ini')
var stripBom	= require('strip-bom');
var bCopy 		= require('better-copy');
var fse 		= fse || require('fs-extra');
var afs 		= afs || require('await-fs');
var pSpawn 		= require('promisify-child-process').spawn;
var decrypterPath = nwPath.join(__dirname, "3rdParty/RgssDecrypter/");
var ini 		= require("ini");
const thisPath  = thisAddon.getPathRelativeToRoot();
thisAddon.debugLevel = 0;

moduleAlias.addAliases({
  '@rmrgss': thisPath + "/node_modules"
})
moduleAlias.addPath(thisPath+'/node_modules');
moduleAlias(thisPath+'/package.json');

window.yaml = require('@rmrgss/yaml');
var resolveSeq = require('www/addons/rmrgss/node_modules/yaml/dist/resolveSeq-d03cb037.js');

/**
 * Fetch data from any iterable objects, Sequence (Array), or Map (Hash)
 * @param  {} data
 * @param  {} index
 */
yaml.getFromIndex = function(data, index) {
	if (empty(data)) return data;
	if (data.constructor.name !== "YAMLMap" && data.constructor.name !== "YAMLSeq") return console.warn("试图从无效的可迭代对象获取索引。")
	if (typeof index !== "number") return console.warn("无效号码", index);

	if (data.type == "SEQ") {// MAP : hash, SEQ : array
		// array
		return data.items[index];
	} else {
		// hash
		return data.items[index].value;
	}
}

function b64EncodeUnicode(str) {
	// first we use encodeURIComponent to get percent-encoded UTF-8,
	// then we convert the percent encodings into raw bytes which
	// can be fed into btoa.
	// b64EncodeUnicode('✓ à la mode'); // "4pyTIMOgIGxhIG1vZGU="
	return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
		function toSolidBytes(match, p1) {
			return String.fromCharCode('0x' + p1);
	}));
}
function b64DecodeUnicode(str) {
	// Going backwards: from bytestream, to percent-encoding, to original string.
	// b64DecodeUnicode('4pyTIMOgIGxhIG1vZGU='); // "✓ à la mode"
	return decodeURIComponent(atob(str).split('').map(function(c) {
		return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
	}).join(''));
}

class GameIniParser extends require('www/js/ParserBase.js').ParserBase {
	constructor(script, options, callback) {
		super(script, options, callback)
		this.debugLevel = thisAddon.debugLevel;
		this.transData = {
			data:[],
			context:[],
			tags:[],
			parameters:[],
			indexIds:{}
		};

	}
}
GameIniParser.prototype.registerStringObject = function(obj, key, parameters, options) {
	var translation = this.registerString(obj[key], parameters, options);
	// apply translation
	obj[key] = translation;
	return translation;
}

GameIniParser.prototype.filterText = function(text, context, parameters) {
	return ini.unsafe(text);
}

GameIniParser.prototype.unfilterText = function(text, context, parameters) {
    return ini.safe(text);
}

GameIniParser.prototype.toString = function() {
	return ini.stringify(this.ini);
}

GameIniParser.prototype.parse = async function() {
	this.ini = ini.parse(this.script);

	if (empty(this.ini)) return this;
	for (var category in this.ini) {
		if (typeof this.ini[category] !== "object") continue;
		for (var varName in this.ini[category]) {
			var tags=["red"];
			if (category.toLowerCase()=="game" && varName.toLowerCase()=="title") {
				tags=[];
				this.gameTitle = this.ini[category][varName];
			}
			this.registerStringObject(this.ini[category], varName, ["Game.ini", category, varName], {}, {tags:tags})
		}
	}
	return this;
}

//var ScriptParser = require('www/js/ScriptParser.js');
//const { join, relative } = require('path');



class RGSSParser extends require('www/js/ScriptParser.js') {
	constructor(script, options, callback) {
		super(script, options, callback)
		this.language = "rgss";
		this.debugLevel = thisAddon.debugLevel;
		this.currentEntryPoint = {};
		this.transData = {
			data:[],
			context:[],
			tags:[],
			parameters:[],
			indexIds:{}
		};

		this.init();
	}
}

RGSSParser.extendPrism = function () {
	if (Prism.languages.rgss) return;
	Prism.languages.rgss = Prism.languages.extend('ruby')
	var interpolation = {
		pattern: /#\{[^}]+\}/,
		inside: {
			'delimiter': {
				pattern: /^#\{|\}$/,
				alias: 'tag'
			},
			rest: Prism.languages.ruby
		}
	};
	Prism.languages.rgss.string.push(
		{
			pattern: /<<[-~]?([a-z_]\w*)(.*)[\r\n](?:.*[\r\n])*?[\t ]*\1/i,
			alias: 'heredoc-string',
			greedy: true,
			inside: {
				'delimiter': {
					pattern: /^<<[-~]?[a-z_]\w*(.*)[\r\n]|[a-z_]\w*$/i,
					alias: 'symbol',
					inside: {
						'punctuation': /^<<[-~]?/
					}
				},
				'interpolation': interpolation
			}
		}	
	)
	
	Prism.languages.rgss.string[0].alias = 'string-misc';
	Prism.languages.rgss.string[1].alias = 'string-quote';
	Prism.languages.rgss.string[1].pattern = /("|')(?:#\{[^}]+\}|#(?!\{)|\\(?:\r\n|[\s\S])|(?!\1)[^\\#])*\1/
	Prism.languages.rgss.string[2].inside.delimiter.pattern = /^<<[-~]?[a-z_]\w*[\r\n]|[a-z_]\w*$/i
	Prism.languages.rgss.string[3].inside.delimiter.pattern = /^<<[-~]?'[a-z_]\w*'[\r\n]|[a-z_]\w*$/i
	//Prism.languages.rgss.string[2].inside.punctuation = /[\r\n]/
	//Prism.languages.rgss.string[3].inside.punctuation = /[\r\n]/
}

RGSSParser.prototype.filterText = function(text, context, parameters) {
	if (parameters.parentAlias == "string-quote") {
		// strip slashes from quote
		text = common.stripSlashes(text);
	} else if (parameters.parentAlias == "string-misc") {
		var bkEscaper = '[----backslashEscape:'+common.rand(10000000,99999999)+":----]"
		text = text.replaceAll('\\\\', bkEscaper)
		.replaceAll('\\}', '}')
		.replaceAll('\\)', ')')
		.replaceAll('\\/', '/')
		.replaceAll('\\]', ']')
		.replaceAll('\\>', '>')
		.replaceAll('\\n', "\n")
		.replaceAll('\\r', "\r")
		.replaceAll(bkEscaper, '\\')
	}
	
	return text;
}

RGSSParser.prototype.unfilterText = function(text, context, parameters) {
	if (parameters.parentAlias == "string-quote") {
		// add slashes to quote
		text = common.addSlashes(text);
	} else if (parameters.parentAlias == "string-misc") {
		text = text.replace(/[\\/})\]>]/g, function(match) {
			return "\\"+match;
		})
	}
    return text;
}

RGSSParser.prototype.init = function() {
	RGSSParser.extendPrism();
	this.on('beforeRegisterString', (args)=>{
		var token 		= args[0];
		var parentType 	= args[1]
		var options 	= args[2]

		var parentAlias = ""
		try {
			parentAlias = options.parent.alias;
		} catch (e) {
			console.warn(e);
		}

		if (parentAlias == "string-quote") {
			//console.log("handling string quote", args);
			var quote = ['"', "'"]
			if (options.index == 0) {
				// first index
				if (quote.includes(token.charAt(0))) {
					this.register(token.charAt(0));
					token = token.substring(1);
					this.currentOffset += 1;
				}
			}

			if (options.index == (options.siblingNumber -1)) {
				// last index
				var closingQuote = token.substring(token.length-1);
				if (quote.includes(closingQuote)) {
					token = token.substring(0, token.length -1);
					this.registerString(token, this.baseContext.concat([this.currentOffset]), {parentType:"string-quote", start:this.currentOffset, end:this.currentOffset+token.length});
					this.currentOffset += token.length;
					
					// register closing quote
					this.register(closingQuote);
					this.currentOffset += 1;
					return common.thru(); // skip default behavior
				}
			} else {
				this.registerString(token, this.baseContext.concat([this.currentOffset]), {parentType:"string-quote", start:this.currentOffset, end:this.currentOffset+token.length});
				this.currentOffset += token.length;
				return common.thru(); // skip default behavior
			}
		} else if (parentAlias == "heredoc-string") {
			//console.log("handling heredoc string", args);
			if (options.index == 1) { // first after delimiter
				var firstChar = token.charAt(0);

				try {
					var delimiter = options.members[0].content[1]
					if (delimiter.substring(0, delimiter.length - 1) == "\n") return;
				} catch (e) {
					console.warn(e);
					return;
				}

				if (token.substring(0,2) == "\r\n" || token.substring(0,2) == "\n\r") {
					this.register("\r\n");
					this.currentOffset += 2;

					token = token.substring(2);
					this.registerString(token, this.baseContext.concat([this.currentOffset]), {parentType:"heredoc-string", start:this.currentOffset, end:this.currentOffset+token.length});
					this.currentOffset += token.length;
					return common.thru(); // skip default behavior

				} else if (firstChar == "\n") {
					this.register(firstChar);
					this.currentOffset += 1;

					token = token.substring(1);
					this.registerString(token, this.baseContext.concat([this.currentOffset]), {parentType:"heredoc-string", start:this.currentOffset, end:this.currentOffset+token.length});
					this.currentOffset += token.length;
					return common.thru(); // skip default behavior

				}

			}
		} else if (parentAlias == "string-misc") {
			//console.log("handling string-misc", args);
			if (options.index == 0) {
				var match = token.match(/%[qQiIwWxs]?[/{(\[<]?/);
				if (match) {
					if (match.index == 0) {
						this.register(match[0]);
						token = token.substring(match[0].length);
						this.currentOffset += match[0].length;
					}
				}
			}
			
			if (options.index == (options.siblingNumber -1)) {
				var quote = ["/", "}", ")", ">", "]"];
				var closingQuote = token.substring(token.length-1);
				if (quote.includes(closingQuote)) {
					token = token.substring(0, token.length -1);
					this.registerString(token, this.baseContext.concat([this.currentOffset]), {parentType:"string-misc", start:this.currentOffset, end:this.currentOffset+token.length});
					this.currentOffset += token.length;
					
					// register closing quote
					this.register(closingQuote);
					this.currentOffset += 1;
					return common.thru(); // skip default behavior
				}
			} else {
				this.registerString(token, this.baseContext.concat([this.currentOffset]), {parentType:"string-misc", start:this.currentOffset, end:this.currentOffset+token.length});
				this.currentOffset += token.length;
				return common.thru(); // skip default behavior
			}
		}
		

	});

	this.on('afterRegisterString', (args)=>{
		
	})	
}


thisAddon.RGSSParser = RGSSParser;
window.RGSSParser = RGSSParser;

class RMData extends require("www/js/ParserBase.js").ParserBase {
	constructor(obj, options, callback) {
		super(obj, options, callback)
		this.debugLevel = thisAddon.debugLevel;
		this.currentEntryPoint = {};
		this.transData = {
			data:[],
			context:[],
			tags:[],
			parameters:[],
			indexIds:{}
		};
	}
}
RMData.RPGM_EVENT_CODE = {
	"0": "Empty",
	"101": "Show Text Attributes",
	"102": "Show Choices",
	"103": "Input Number",
	"104": "Select Key Item",
	"105": "Show Scrolling Text Attributes",
	"108": "Comment",
	"111": "Conditional Branch",
	"112": "Loop",
	"113": "Break Loop",
	"115": "Exit Event Processing",
	"117": "Call Common Event",
	"118": "Label",
	"119": "Jump to Label",
	"121": "Control Switches",
	"122": "Control Variables",
	"123": "Control Self Switch",
	"124": "Control Timer",
	"125": "Change Gold",
	"126": "Change Items",
	"127": "Change Weapons",
	"128": "Change Armor",
	"129": "Change Party Member",
	"132": "Change Battle BGM",
	"133": "Change Battle End ME",
	"134": "Change Save Access",
	"135": "Change Menu Access",
	"136": "Change Encounter",
	"137": "Change Formation Access",
	"138": "Change Window Color",
	"201": "Transfer Player",
	"202": "Set Vehicle Location",
	"203": "Set Event Location",
	"204": "Scroll Map",
	"205": "Set Move Route",
	"206": "Get on/off Vehicle",
	"211": "Change Transparency",
	"212": "Show Animation",
	"213": "Shot Balloon Icon",
	"214": "Erase Event",
	"216": "Change Player Followers",
	"217": "Gather Followers",
	"221": "Fadeout Screen",
	"222": "Fadein Screen",
	"223": "Tint Screen",
	"224": "Flash Screen",
	"225": "Shake Screen",
	"230": "Wait",
	"231": "Show Picture",
	"232": "Move Picture",
	"233": "Rotate Picture",
	"234": "Tint Picture",
	"235": "Erase Picture",
	"236": "Set Weather Effects",
	"241": "Play BGM",
	"242": "Fadeout BGM",
	"243": "Save BGM",
	"244": "Replay BGM",
	"245": "Play BGS",
	"246": "Fadeout BGS",
	"249": "Play ME",
	"250": "Play SE",
	"251": "Stop SE",
	"261": "Play Movie",
	"281": "Change Map Display",
	"282": "Change Tileset",
	"283": "Change Battle Back",
	"284": "Change Parallax Back",
	"285": "Get Location Info",
	"301": "Battle Processing",
	"302": "Shop Processing",
	"303": "Name Input Processing",
	"311": "Change HP",
	"312": "Change MP",
	"313": "Change State",
	"314": "Recover All",
	"315": "Change EXP",
	"316": "Change Level",
	"317": "Change Parameters",
	"318": "Change Skills",
	"319": "Change Equipment",
	"320": "Change Actor Name",
	"321": "Change Actor Class",
	"322": "Change Actor Graphic",
	"323": "Change Vehicle Graphic",
	"324": "Change Actor Nickname",
	"325": "Change Actor Profile",
	"331": "Change Enemy HP",
	"332": "Change Enemy MP",
	"333": "Change Enemy State",
	"334": "Enemy Recover All",
	"335": "Enemy Appear",
	"336": "Enemy Transform",
	"337": "Show Battle Animation",
	"339": "Force Action",
	"340": "Abort Battle",
	"351": "Open Menu Screen",
	"352": "Open Save Screen",
	"353": "Game Over",
	"354": "Return to Title Screen",
	"355": "Script Header",
	"356": "Plugin Command",
	"401": "Show Text",
	"402": "Choice",
	"403": "Choice Cancel",
	"404": "Choices End",
	"405": "Show Scrolling Text",
	"408": "Comment More",
	"411": "Else",
	"412": "Branch End",
	"413": "Repeat Above",
	"601": "If Win",
	"602": "If Escape",
	"603": "If Lose",
	"604": "Battle Processing End",
	"605": "Shop Item",
	"655": "Script"
}
RMData.determineType = function($path) {
	var fileName = nwPath.basename($path, nwPath.extname($path));
	if (/Map[0-9]+/g.test(fileName)) {
		return "map"
	} else {
		return fileName.toLowerCase();
	}
}

RMData.prototype.addTransData = function(translatableObj) {
	var result = this.transData;
	if (typeof result.indexIds[translatableObj.text] == "undefined") result.indexIds[translatableObj.text] = result.data.length;
	//result.indexIds[thisObj.text] = result.indexIds[thisObj.text] || result.data.length;
	
	var row = result.indexIds[translatableObj.text];
	result.data[row] 		= result.data[row] || [translatableObj.text, ""];

	result.context[row] 	= result.context[row]||[];
	result.context[row].push(translatableObj.context.join(this.contextSeparator))

	if (!empty(translatableObj.parameters)) {
		result.parameters[row] 	= result.parameters[row] || [];
		result.parameters[row].push(translatableObj.parameters);
	} 

	if (translatableObj.tags.length > 0) {
		result.tags[row] 	= result.tags[row] || [];
		result.tags[row].push(translatableObj.tags);
	}
	
	return this;	
}

RMData.prototype.registerStringObject = function(yamlMap, key, parameters, options) {
	if (empty(yamlMap)) {
		console.warn("错误：registerStringObject yamlMap为空！", arguments);
		return yamlMap;
	}
	if (Array.isArray(key) == false) key = [key];
	try {
		var value = yamlMap.getIn(key);
	} catch(e) {
		console.warn("错误：无法获取值", arguments, e);
	}

	if (thisAddon.debugLevel > 2) console.log("registerStringObject", value, "key:", key);
	if (typeof value !== "string") {
		console.warn("错误：尝试注册字符串非字符串值。在registerStringObject中", arguments);
		return value;
	}
	var translation = this.registerString(value, parameters, options);
	// apply translation

	if (value !== translation) yamlMap.setIn(key, translation);

	return translation;
}

RMData.prototype.registerString = function(string, localContext, parameters, options) {
	options = options || {};
	options.currentAddress = options.currentAddress || this.currentAddress;

	//console.log("registering string:", arguments);

	var copyContext = JSON.parse(JSON.stringify(this.currentContext))
	localContext = localContext||[];
	if (Array.isArray(localContext) == false) localContext = [localContext];
	copyContext = copyContext.concat(localContext);

	var filteredText = this.filterText(string, copyContext, parameters)

	if (string.trim().length > 0) {
		var obj = {
			text:filteredText,
			rawText:string,
			context:copyContext,
			parameters:parameters,
			tags:options.tags||[],
			address:common.clone(options.currentAddress)
		}
		this.translatableTexts.push(obj);

		this.addTransData(obj);
	}
	
	var translation = this.translate(filteredText, copyContext);
	if (translation !== filteredText) {
		if (this.debugLevel >= 1) console.log("%cTranslating", 'background: #222; color: #bada55', filteredText,"->", translation, this.translationPair);
		
		translation = this.unfilterText(translation, copyContext, parameters);
		this.writableData.push(translation);
		return translation;

	} else {
		this.writableData.push(string);
		return string;
	}
}

RMData.prototype.fetchCommonData = function(data, whatToFetch, parentContext, options) {
	//console.log("Handling common data", arguments);
	whatToFetch = whatToFetch || [];
	options = options || {};
	options.currentAddress = options.currentAddress || [];

	var arrayContent = data.getIn([]);
	var iterableType = arrayContent.type; // MAP : hash, SEQ : array
	if (empty(arrayContent)) return this;
	if (!Array.isArray(arrayContent.items)) return this;
	for (var i=0; i<arrayContent.items.length; i++) {
		//console.log('arrayContent.items[i]', arrayContent.items[i]);
		if (empty(arrayContent.items[i])) continue;
		//if (arrayContent.items[i].constructor.name !== "YAMLMap") continue;
		for (var t=0; t<whatToFetch.length; t++) {
			var topic = whatToFetch[t];
			if (thisAddon.debugLevel > 2) console.log("Fetch", topic, "from", arrayContent.items[i]);
			if (iterableType == "SEQ") {
				// Array
				if (data.hasIn([i, topic]) == false) continue;
				//var context = parentContext.concat([i, topic]);
				//var thisCurrentAddress = options.currentAddress.concat([i, topic]);
				// arrayContent.items[0].value.getIn(["name"])
				this.registerStringObject(arrayContent.items[i], topic, parentContext.concat([i, topic]), [], {currentAddress:options.currentAddress.concat([i, topic])})
			} else {
				// Hash. Be careful! i does't represents KEY!
				var key = arrayContent.items[i].key;
				this.registerStringObject(arrayContent.items[i].value, topic, parentContext.concat([key, topic]), [], {currentAddress:options.currentAddress.concat([key, topic])})
			}
		}
	}
	return this;
}

RMData.prototype.fetchSystem = function(data, parentContext, options) {
	options = options || {};
	options.currentAddress = options.currentAddress || [];



	var type = ['elements', 'skill_types', 'weapon_types', 'armor_types'];	
	if (thisAddon.config.loadVariableName) type.push("variables", "switches");

	for (var i in type) {
		var key = type[i];
		if (!data.hasIn([key])) continue;
		var db = data.getIn([key]);
		if (empty(db)) continue;
		if (empty(db.items)) continue;
		for (var idx=0; idx<db.items.length; idx++) {
			this.registerStringObject(db, idx, parentContext.concat(key, idx), [], {currentAddress:options.currentAddress.concat[key, idx]})
		}
	}


	// fetch terms
	// XP : not exist
	// vx : key pair content
	// ace: category and array
	if (data.hasIn(["terms", "params"])) {
		// ACE
		this.registerStringObject(data, 'game_title', parentContext.concat("game_title"), [], {currentAddress:options.currentAddress.concat["game_title"]})
		this.registerStringObject(data, 'currency_unit', parentContext.concat("currency_unit"), [], {currentAddress:options.currentAddress.concat["currency_unit"]})
	
		var category = data.getIn(["terms"]).items;
		for (var i in category) {
			if (empty(category[i])) continue;
			var key = category[i].key.value;

			var terms = data.getIn(["terms", key]);
			if (!terms.items) continue;
			for (var idx=0; idx<terms.items.length; idx++) {
				this.registerStringObject(terms, idx, parentContext.concat("terms", key, idx), [], {currentAddress:options.currentAddress.concat["terms", key, idx]})
			}
		}

	} else if (data.hasIn(["terms"])) {
		// VX
		this.registerStringObject(data, 'game_title', parentContext.concat("game_title"), [], {currentAddress:options.currentAddress.concat["game_title"]})

		var terms = data.getIn(["terms"]).items;
		for (var i in terms) {
			if (empty(terms[i])) continue;
			var key = terms[i].key.value;
			this.registerStringObject(data.getIn(["terms"]), key, parentContext.concat("terms", key), [], {currentAddress:options.currentAddress.concat["terms", key]})
		}
	} else if (data.hasIn(["words"])) {
		// XP
		//this.registerStringObject(data, 'title_name', parentContext.concat("title_name"), [], {currentAddress:options.currentAddress.concat["title_name"]})
	
		var terms = data.getIn(["words"]).items;
		for (var i in terms) {
			if (empty(terms[i])) continue;
			var key = terms[i].key.value;
			this.registerStringObject(data.getIn(["words"]), key, parentContext.concat("words", key), [], {currentAddress:options.currentAddress.concat["words", key]})
		}
	}

	for (var i in type) {
		var key = type[i];
		
		var db = data.getIn([key]);
		if (empty(db)) continue;
		if (empty(db.items)) continue;
		for (var idx=0; idx<db.items; idx++) {
			this.registerStringObject(db, idx, parentContext.concat(key, idx), [], {currentAddress:options.currentAddress.concat[key, idx]})
		}
	}
	return this;
}

RMData.prototype.buildTextList = function(text, headerParam, translatedList) {
	translatedList = translatedList || [];
	text = text.replaceAll("\r", "");
	var textArray = text.split("\n");

	for (var i=0; i<textArray.length; i++) {
		if ((i+1)%4 == 1) {
			translatedList.push(RMData.generateEventCommandData(headerParam.i, headerParam.c, headerParam.p));
		}
		translatedList.push(RMData.generateEventCommandData(headerParam.i, 401, [textArray[i]]));
	}
	return translatedList;
}

RMData.prototype.buildScrollTextList = function(text, headerParam, translatedList) {
	translatedList = translatedList || [];
	text = text.replaceAll("\r", "");
	var textArray = text.split("\n");

	translatedList.push(RMData.generateEventCommandData(headerParam.i, headerParam.c, headerParam.p));
	for (var i=0; i<textArray.length; i++) {
		translatedList.push(RMData.generateEventCommandData(headerParam.i, 405, [textArray[i]]));
	}	
	return translatedList;
}

RMData.prototype.buildScriptList = function(text, headerParam, translatedList) {
	console.log(">>buildScriptList", arguments);
	translatedList = translatedList || [];
	text = text.replaceAll("\r", "");
	var textArray = text.split("\n");

	console.log("Text array:", textArray);
	// first line is on header
	translatedList.push(RMData.generateEventCommandData(headerParam.i, 355, textArray[0]));
	for (var i=1; i<textArray.length; i++) {
		translatedList.push(RMData.generateEventCommandData(headerParam.i, 655, [textArray[i]]));
	}
	console.log("script list", translatedList);
	return translatedList;
}


RMData.prototype.fetchCommandList = async function(commandList, parentContext) {
	if (empty(commandList)) return this;
	if (typeof commandList == "object") {
		if (Array.isArray(commandList.items)) commandList = commandList.items;
	}

	var translatedList = [];


	var last101 = {};
	var last105 = {};
	var last355 = {};
	var textStack 			= [];
	var scrollingTextStack 	= [];
	var scriptStack 		= [];
	var currentTextParam 			= {};
	var currentScrollingTextParam 	= {};
	var currentScriptParam 			= {};
	const messagePossition = ["top", "middle", "bottom"];

	for (var i in commandList) {
		//!ruby/object:RPG::EventCommand {i: 0, c: 105, p: [2, false]}
		var currentMap 		= commandList[parseInt(i)];
		// expect YAMLMap object
		if (currentMap.constructor.name !== "YAMLMap") continue;
		
		var command 		= currentMap.toJSON();
		// command will be : {i: 0, c: 105, p: [2, false]}

		// Process textStack
		if (textStack.length>0 && command.c!== 401) {
			// end of text stack
			if (thisAddon.debugLevel > 2)console.log("Current textstack", textStack);
			var pictureStatus = "noPicture";
			if (!empty(currentTextParam.headerParam[0])) pictureStatus = "hasPicture";

			var context = common.clone(parentContext);
			context.push("list", currentTextParam.headerIndex, "message", pictureStatus, messagePossition[currentTextParam.headerParam[3]]);

			var translation = this.registerString(textStack.join("\n"), context, last101);
			if (thisAddon.debugLevel > 2) console.log(">>Generated combined text:", translation);
			this.buildTextList(translation, last101, translatedList);

			textStack = [];
		}

		if (scrollingTextStack.length>0 && command.c!== 405) {
			// end of text stack

			var context = common.clone(parentContext);
			context.push("list", currentScrollingTextParam.headerIndex, "scrollingMessage");

			var translation = this.registerString(scrollingTextStack.join("\n"), context, last105);
			if (thisAddon.debugLevel > 2)console.log(">>Generated combined text:", translation);
			this.buildScrollTextList(translation, last105, translatedList);

			scrollingTextStack = [];
		}


		if (scriptStack.length>0 && command.c!== 655) {
			// end of text stack
			console.log("executing scriptstack");

			var context = common.clone(parentContext);
			context.push("list", currentScriptParam.headerIndex, "script");

			// this is raw script
			var script = scriptStack.join("\n");

			// for raw viewer store raw script as Attachment, because we won't save the code into files.
			var attachmentName = "scriptCommand/"+common.generateId()+".rb";

			
			console.log("registering string within event's RGSS code.");
			var copyOptions 				= common.clone(this.options);
				copyOptions.baseContext 	= context;
				copyOptions.baseParameter 	= {attachment:attachmentName}
				copyOptions.baseTags		= ["red"];

			var scriptObj = new RGSSParser(script, copyOptions);
			await scriptObj.parse();
			console.log("ScriptObj:", scriptObj);
			// produce translated script from scriptObj
			script = scriptObj.toString();
			console.log("parsed text below:\n", script);
			// import transData from scriptObj into rmData
			this.importTransData(scriptObj);

			// assign attachment only if has atleast one translatable string / data length > 0
			if (scriptObj.transData.data.length > 0) {
				RMUtil.attachments[attachmentName] = new Attachment({
					type:"text/ruby",
					data:script
				})
			}

			//var translation = this.registerString(script, context, last355);
			if (thisAddon.debugLevel > 2)console.log(">>Generated combined text:", script);
			
			this.buildScriptList(script, last355, translatedList);

			scriptStack = [];
		}

		switch(command.c) {
			// handling interpolatable texts
			case 101: //text parameters
				textStack = [];
				currentTextParam.headerIndex = i;
				currentTextParam.headerParam = command.p;
				last101 = command;
				break;
			case 105: //start text scroll
				scrollingTextStack = [];
				currentScrollingTextParam.headerIndex = i;
				currentScrollingTextParam.headerParam = command.p;
				last105 = command;
				break;
			case 401: //text
				textStack.push(command.p[0]);
				break;
			case 405: //long text
				scrollingTextStack.push(command.p[0]);
				break;
			
			case 355: //Script Header
				console.log("Code 355", command);
				scriptStack = [];
				currentScriptParam.headerIndex = i;
				currentScriptParam.headerParam = command.p;
				last355 = command;
				scriptStack.push(command.p[0]);
				break;					
			case 655: //Script
				console.log("Code 655", command);

				scriptStack.push(command.p[0]);
				break;


			// handling non interpolatable texts
			case 122: //set variable
				var thisText = currentMap.getIn(["p", 4]);
				if (typeof thisText !== 'string') break;
				var context = common.clone(parentContext);
				context.push("list", i, RMData.RPGM_EVENT_CODE[122], "/var:"+currentMap.getIn(["p", 0])+"-"+currentMap.getIn(["p", 1]));
				var translation = this.registerString(thisText, context, [], {tags: ["red"]});
				
				currentMap.setIn(["p", 4], translation);
				translatedList.push(currentMap);
				break;

			case 402: //choice
				var thisText = currentMap.getIn(["p", 1]);
				if (typeof thisText !== 'string') break;
				var context = common.clone(parentContext);
				context.push("list", i, RMData.RPGM_EVENT_CODE[402]);
				var translation = this.registerString(thisText, context, [], {});
				
				currentMap.setIn(["p", 1], translation);
				translatedList.push(currentMap);
				break;

			case 320: //Change name
			case 324: //Change nick name
			case 325: //Change profile
				var thisText = currentMap.getIn(["p", 1]);
				if (typeof thisText !== 'string') break;
				var context = common.clone(parentContext);
				context.push("list", i, RMData.RPGM_EVENT_CODE[currentMap.getIn(["c"])]);
				var translation = this.registerString(thisText, context, [], {});
				
				currentMap.setIn(["p", 1], translation);
				translatedList.push(currentMap);
				break;

			/*
			case 356: //plugin command
				var thisText = currentMap.getIn(["p", 0]);
				if (typeof thisText !== 'string') break;
				var context = common.clone(parentContext);
				context.push("list", i, RMData.RPGM_EVENT_CODE[currentMap.getIn(["c"])]);
				var translation = this.registerString(thisText, context, [], {tags:["red"]});
				
				currentMap.setIn(["p", 0], translation);
				translatedList.push(currentMap);
				break;
			*/

			default:
				// append current document map as is
				translatedList.push(currentMap);	
		}
	}

	if (thisAddon.debugLevel > 1) console.log("Translated list:", translatedList);
	return translatedList;
}

/**
 * @param  {Object} document
 * @param  {Number} eventId
 * @param  {Number} pageId
 * @param  {Number} commandIndex - new command will be inserted at this index
 * @param  {} command
 */
RMData.insertEventCommandAt = function(document, eventId, pageId, commandIndex, command) {
	var page1Evt = document.getIn(['events', eventId, 'pages', pageId, 'list']).items
	var insertedDoc = yaml.parseDocument('- !ruby/object:RPG::EventCommand {i: 0, c: 401, p: [inserted doc]}')
	var newItem = insertedDoc.getIn([0])
	insertArrayAt(page1Evt, commandIndex, [newItem])
}

RMData.generateEventCommandData = function(i, c, p) {
	var newData = yaml.parseDocument(`- !ruby/object:RPG::EventCommand {i: ${i}, c: ${c}, p: ${JSON.stringify(p)}}`);
	return newData.getIn([0]);
}

RMData.selectTranslationData = function(translationDatas, path) {
	// must match trans.project.files[thefile].path
	var newPath = path;
	newPath = newPath.replace(/\\/g, "/");
	translationDatas.translationData = translationDatas.translationData || {};
	return translationDatas.translationData[newPath];
}





var RMUtil = function(gameFile, options) {
	if (common.isDir(gameFile)) {
		this.dirname = gameFile;
	} else {
		this.dirname = nwPath.dirname(gameFile);
	}
	this.options = options || {};
	this.engineCode = this.options.engineCode || "";
	this.writeMode = true;

}

RMUtil.attachments = {};
RMUtil.type = {};
RMUtil.type.binary = {
	identify: value => value instanceof Uint8Array,
	// Buffer inherits from Uint8Array
	default: false,
	tag: '!binary',
  
	resolve: (doc, node) => {
	  const src = resolveSeq.resolveString(doc, node);
	  return b64DecodeUnicode(src);
	},
	options: resolveSeq.binaryOptions,
	stringify: function (data, ctx, onComment, onChompKeep) {
	  // convert to plain
	  //console.log(arguments);
	  data.value = b64EncodeUnicode(data.value);
	  //type = "PLAIN"
	  return resolveSeq.stringifyString(data, ctx, onComment, onChompKeep);
	}
}
RMUtil.customTags =  [RMUtil.type.binary];


RMUtil.prototype.unpackTo = async function(targetDir) {
	targetDir = targetDir || this.options.targetDir || this.dirname;
	console.log("Unpack project", this.dirname, "to", targetDir);
	var thisEngineType = await this.getEngineCode();
	await common.mkDir(targetDir);
	//await common.aSpawn(nwPath.join(thisPath, "bin/rvpacker.exe"), ["-a", "unpack", "-d", this.dirname, "-t", thisEngineType, "-V", "-f", "-T", targetDir]);
	var binPath = nwPath.join(thisPath, "bin/rvpacker/rvpacker.rb");
	var options = {
		onData: function(buffer) {
			ui.log(buffer.toString());
		}
	}	
	await common.aSpawn(nw.App.manifest.localConfig.ruby, [binPath, "-a", "unpack", "-d", this.dirname, "-t", thisEngineType, "-V", "-f", "-T", targetDir], options);
	
	await ui.log(`复制：${nwPath.join(this.dirname, "Game.ini")} 到 ${targetDir}`);
	await common.copyFile(nwPath.join(this.dirname, "Game.ini"), targetDir);

	this.targetDir = targetDir;
	this.unpacked = true;
	return this;
}

RMUtil.prototype.repackTo = async function(targetDir) {
	targetDir = targetDir || this.options.targetDir || this.dirname;
	console.log("Repack project", this.dirname, "to", targetDir);
	if (await common.isDirectory(targetDir) == false) return console.warn(`错误：目录 ${targetDir} 没有找到！`);
	var thisEngineType = await this.getEngineCode();
	//await common.aSpawn(nwPath.join(thisPath, "bin/rvpacker.exe"), ["-a", "pack", "-d", this.dirname, "-t", thisEngineType, "-V", "-f", "-T", targetDir]);
	var binPath = nwPath.join(thisPath, "bin/rvpacker/rvpacker.rb");
	var options = {
		onData: function(buffer) {
			ui.log(buffer.toString());
		}
	}
	await common.aSpawn(nw.App.manifest.localConfig.ruby, [binPath, "-a", "pack", "-d", this.dirname, "-t", thisEngineType, "-V", "-f", "-T", targetDir], options);

	await ui.log(`复制：${nwPath.join(this.dirname, "Game.ini")} 到 ${targetDir}`);
	await common.copyFile(nwPath.join(this.dirname, "Game.ini"), targetDir);

	console.log("Repack finished!");
	return this;
}

RMUtil.prototype.toObj = async function(targetDir) {
	targetDir = targetDir || this.options.targetDir || this.dirname;;
	if (!this.unpacked) await this.unpackTo(targetDir);

	this.contents = {
		yaml:[],
		scripts:[],
		gameIni:nwPath.join(targetDir, "Game.ini")
	};
	this.parsed = {
		document:{},
		scripts:{}
	};

	this.contents.yaml = await common.readDir(nwPath.join(targetDir, "YAML"));
	this.contents.scripts = await common.readDir(nwPath.join(targetDir, "Scripts"));
	
	for (var i=0; i<this.contents.yaml.length; i++) {
		if (nwPath.extname(this.contents.yaml[i]) !== ".yaml") continue;
		this.parsed.document[this.contents.yaml[i]] = yaml.parseDocument(await common.fileGetContents(this.contents.yaml[i], "utf8"), {customTags: RMUtil.customTags});
		//this.parsed.obj[this.contents.yaml[i]] = this.parsed.native[this.contents.yaml[i]].toJson();
	}
	this.targetDir = targetDir;
	return this;
}

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

RMUtil.prototype.parseScript = async function(options) {
	console.log("Parsing script");
	ui.log("开始解析脚本");
	options = options || this.options || {};
	options.translationDatas = options.translationDatas || this.options.translationDatas || {};
	for (var i=0; i<this.contents.scripts.length; i++) {
		var scriptPath = this.contents.scripts[i];
		if (nwPath.extname(scriptPath) !== ".rb") continue;

		var fileInfo = {};
		var relativePath 		= common.getRelativePathFromNode(scriptPath, "Scripts", true);
		fileInfo.extension 		= nwPath.extname(scriptPath).toLowerCase().substring(1);
		fileInfo.dataType 		= "ruby";
		fileInfo.filename 		= nwPath.basename(scriptPath, nwPath.extname(scriptPath));
		fileInfo.basename 		= nwPath.basename(scriptPath);
		fileInfo.path 			= relativePath;
		fileInfo.relPath		= relativePath;
		fileInfo.dirname 		= "/"+nwPath.dirname(relativePath);

		this.parsed.scripts[scriptPath] = new RGSSParser(await common.fileGetContents(scriptPath, "utf8"), options)
		var rgssParser = this.parsed.scripts[scriptPath];
		rgssParser.fileInfo		= fileInfo;

		//var relativePath 		= common.getRelativePath(scriptPath, this.dirname);
		var relativePath 		= common.getRelativePathFromNode(scriptPath, "Scripts", true);
		ui.log(`解析：${relativePath}`);

		if (!empty(options.translationDatas)) {
			var translationData = RMData.selectTranslationData(options.translationDatas, relativePath);
			console.log("current file:", relativePath);
			console.log("Translation Data:", translationData);
			translationData = translationData || {};
			rgssParser.translationPair = translationData.translationPair || {};
			rgssParser.translationInfo = translationData.info || {};
		}

		rgssParser.parse();
	}
	return this;
}

RMUtil.prototype.parseGameIni = async function(options) {
	console.log("Parsing Game.ini");
	ui.log("解析 Game.ini");
	options = options || this.options || {};
	options.translationDatas = options.translationDatas || this.options.translationDatas || {};
	var scriptPath = this.contents.gameIni;

	var fileInfo = {};
	// todo determine relative path
	var relativePath 		= "Game.ini"
	fileInfo.extension 		= "ini";
	fileInfo.dataType 		= "ini";
	//fileInfo.filename 		= nwPath.basename(scriptPath, nwPath.extname(scriptPath));
	fileInfo.filename 		= "Game.ini";
	fileInfo.basename 		= nwPath.basename(scriptPath);
	fileInfo.path 			= relativePath;
	fileInfo.relPath		= relativePath;
	fileInfo.dirname 		= "/"

	this.parsed.gameIni = new GameIniParser(await common.fileGetContents(scriptPath), options)
	var iniParser = this.parsed.gameIni;
	iniParser.fileInfo		= fileInfo;

	//var relativePath 		= common.getRelativePath(scriptPath, this.dirname);
	var relativePath 		= common.getRelativePathFromNode(scriptPath, "Scripts", true);
	ui.log(`解析：${relativePath}`);

	if (!empty(options.translationDatas)) {
		var translationData = RMData.selectTranslationData(options.translationDatas, relativePath);
		console.log("current file:", relativePath);
		console.log("Translation Data:", translationData);
		translationData = translationData || {};
		iniParser.translationPair = translationData.translationPair || {};
		iniParser.translationInfo = translationData.info || {};
	}

	await iniParser.parse();
	this.gameTitle = iniParser.gameTitle;
	await ui.log("检测游戏标题："+this.gameTitle);
	return this;
}

RMUtil.prototype.parse = async function(options) {
	options = options || this.options || {};
	options.translationDatas = options.translationDatas || this.options.translationDatas || {};

	// resets Attachments
	RMUtil.attachments = {};

	//if (!this.parsed) return console.warn("Trying to dump unparsed project");
	if (!this.parsed) await this.toObj();
	//this.parsed.yaml = {};
	this.parsed.rmdata = {};
	ui.log("开始解析游戏数据");
	for (var path in this.parsed.document) {
		var thisObj = this.parsed.document[path];
		if (empty(thisObj)) continue;
		var basename = nwPath.basename(path)
		var filename = basename.substring(0, basename.length - nwPath.extname(path).length);

		//this.parsed.yaml[path]  = yaml.stringify(thisObj);
		//var relativePath 		= common.getRelativePath(path, this.dirname);
		var relativePath 		= common.getRelativePathFromNode(path, "YAML", true);

		ui.log(`解析：${relativePath}`);

		var fileInfo = {};
		fileInfo.extension 		= nwPath.extname(path).toLowerCase().substring(1);
		fileInfo.dataType 		= RMData.determineType(path);
		fileInfo.filename 		= nwPath.basename(path, nwPath.extname(path));
		fileInfo.basename 		= nwPath.basename(path);
		fileInfo.path 			= relativePath;
		fileInfo.relPath		= relativePath;
		fileInfo.dirname 		= "/"+nwPath.dirname(relativePath);
		
		var rmData 				= new RMData(thisObj, options);
		rmData.fileInfo			= fileInfo;

		if (!empty(options.translationDatas)) {
			var translationData = RMData.selectTranslationData(options.translationDatas, relativePath);
			console.log("current file:", relativePath);
			console.log("Translation Data:", translationData);
			translationData = translationData || {};
			rmData.translationPair = translationData.translationPair || {};
			rmData.translationInfo = translationData.info || {};
		}

		this.parsed.rmdata[path] = rmData;

		var $THISFETCH;
		switch (fileInfo.dataType) {
			case "actors":
				$THISFETCH = rmData.fetchCommonData(thisObj, ["name", "nickname", "note", "profile"], [fileInfo.filename]);
				break			
			case "items":
			case "armors":
			case "weapons":
				$THISFETCH = rmData.fetchCommonData(thisObj, ["name", "description", "note"], [fileInfo.filename]);
				break;
			case "skills":
				$THISFETCH = rmData.fetchCommonData(thisObj, ["name", "description", "message1", "message2", "note"], [fileInfo.filename]);
				break;
			case "states":
				$THISFETCH = rmData.fetchCommonData(thisObj, ["name", "message1", "message2", "message3", "message4", "note"], [fileInfo.filename]);
				break;
			case "classes":
			case "enemies":
			case "tilesets":
				$THISFETCH = rmData.fetchCommonData(thisObj, ["name", "note"], [fileInfo.filename]);
				break;
			case "animations":
			case "mapinfos":
				$THISFETCH = rmData.fetchCommonData(thisObj, ["name"], [fileInfo.filename]);
				break;
			case "commonevents":
				if (empty(thisObj)) continue;

				var cePage = thisObj.getIn([]);
				if (!cePage) continue;
				if (empty(cePage.items)) continue;
				for (var i=0; i<cePage.items.length; i++) {
					var currentPage = cePage.getIn([i]);
					if (empty(currentPage)) continue;
					// name
					rmData.registerStringObject(currentPage, "name", [fileInfo.filename, i, "name"], [], {currentAddress:[i, "name"]})
					
					// command list
					var commandListData = cePage.getIn([i, "list"]);
					if (empty(commandListData)) continue;
					var newCommandList = await rmData.fetchCommandList(commandListData.items, [fileInfo.filename, i]);
					if (thisAddon.debugLevel > 1) console.log("New command list:", newCommandList);
					commandListData.items = newCommandList;
				}
				break;
			case "troops":
				if (empty(thisObj)) continue;

				//rmmvData.fetchCommonData($currentData, ["name"], [$fileInfo['filename']]);
				var troopData = thisObj.getIn([]);
				if (!troopData) continue;
				if (empty(troopData.items)) continue;

				for (var i=1; i < troopData.items.length;i++) {
					if (empty(thisObj.getIn([i]))) continue;
					// register name
					rmData.registerStringObject(thisObj.getIn([i]), "name", [fileInfo.filename, i, "name"], [], {currentAddress:[i, "name"]})
					
					var pages = thisObj.getIn([i, 'pages']);
					if (empty(pages)) continue;

					// fetch event pages content
					if (empty(pages.items)) continue;
					for (var pageId=0; pageId<pages.items.length; pageId++) {
						var oldCommands = thisObj.getIn([i, "pages", pageId, "list"]);
						if (!Boolean(oldCommands)) continue;
						var newCommand  = await rmData.fetchCommandList(oldCommands.items, [fileInfo.filename, i, "pages", pageId, "list"]);	
						oldCommands.items = newCommand;
					}

				}
				break;
			case "map":
				// fetch map name
				rmData.registerStringObject(thisObj, 'display_name', [fileInfo.filename, "display_name"], [], {currentAddress:["display_name"]})

				// fetch map note
				rmData.registerStringObject(thisObj, 'note', [fileInfo.filename, "note"], [], {currentAddress:["note"]})

				var docEvts = thisObj.getIn(["events"]);
				if (empty(docEvts.items)) break;
				if (docEvts.items.length<2) break;

				// iterate events
				for (var index=0; index<docEvts.items.length; index++) {
					//var thisEvtData = thisObj.getIn(["events", evtId]);
					var thisEvtData = yaml.getFromIndex(thisObj.getIn(["events"]), index);
					if (empty(thisEvtData)) continue;
					var evtId = thisEvtData.get("id");
					// fetch event name
					rmData.registerStringObject(thisEvtData, 'name', [fileInfo.filename, "events", evtId, "name"], [], {currentAddress : ["events", evtId, "name"]})
				
					// fetch event pages content
					var pages = thisEvtData.getIn(['pages']);
					if (empty(pages)) continue;

					// fetch event pages content
					if (empty(pages.items)) continue;
					for (var pageId=0; pageId<pages.items.length; pageId++) {
						var oldCommands = pages.getIn([pageId, "list"]);
						if (!Boolean(oldCommands)) continue;
						var newCommand  = await rmData.fetchCommandList(oldCommands.items, [fileInfo.filename, "events", evtId, "pages", pageId, "list"]);	
						oldCommands.items = newCommand;
					}

				}
				break;	
			case "system":
				rmData.fetchSystem(thisObj,  [fileInfo.filename]);
				break
		}
	}

	await this.parseScript(options);
	await this.parseGameIni(options);

	this.isParsed = true;
	return this;
}

RMUtil.prototype.toYaml = async function(outputDirectory) {
	if (!outputDirectory) return console.warn("请使用输出目录设置为YAML参数[0]");
	if (!this.isParsed) await this.parse();
	this.parsed.yaml = {};
	await common.mkDir(nwPath.join(outputDirectory, "YAML"));
	await common.mkDir(nwPath.join(outputDirectory, "Scripts"));
	for (var path in this.parsed.document) {
		var thisObj = this.parsed.document[path];
		//this.parsed.yaml[yaml] = thisObj.toString();
		var targetPath = nwPath.join(outputDirectory, "YAML", nwPath.basename(path));
		await common.filePutContents(targetPath, thisObj.toString(), "utf8");
	}

	for (var path in this.parsed.scripts) {
		var thisObj = this.parsed.scripts[path];
		var targetPath = nwPath.join(outputDirectory, "Scripts", nwPath.basename(path));
		await common.filePutContents(targetPath, thisObj.writableData.join(""), "utf8");
	}

	return this;
}

RMUtil.prototype.toTrans = async function(cacheInfo) {
	await ui.log("创建项目");
	cacheInfo = cacheInfo || await RMUtil.createCacheFolder();
	this.options = this.options || {};
	this.options.targetDir = nwPath.join(cacheInfo.cachePath, "data/");

	if (!this.isParsed) await this.parse();

	this.trans = {
		projectId		: cacheInfo.cacheID,
		cache			: cacheInfo,
		gameEngine		: this.engineCode,
		gameTitle		: this.gameTitle || "",
		loc				: this.dirname,
		parser			: 'rmrgss',
		parserVersion	: thisAddon.package.version,
		attachments		: RMUtil.attachments,
		files			: {}
	}

	await ui.log("从RMData生成trans数据");
	for (var i in this.parsed.rmdata) {
		var thisData = this.parsed.rmdata[i];
		var thisRelPath = thisData.fileInfo.relPath
		this.trans.files[thisRelPath] = Object.assign({}, thisData.transData, thisData.fileInfo);
	}

	await ui.log("从脚本生成trans数据");
	for (var i in this.parsed.scripts) {
		var thisData = this.parsed.scripts[i];
		var thisRelPath = thisData.fileInfo.relPath
		this.trans.files[thisRelPath] = Object.assign({}, thisData.transData, thisData.fileInfo);
	}

	await ui.log("从 Game.ini 生成trans数据");
	var thisData = this.parsed.gameIni;
	var thisRelPath = this.parsed.gameIni.fileInfo.relPath;
	this.trans.files[thisRelPath] = Object.assign({}, thisData.transData, thisData.fileInfo);

	await ui.log("完成转换为trans");
	return this.trans;
}

RMUtil.prototype.detectEngineType = async function() {
	if (await common.isFileAsync(nwPath.join(this.dirname, "Game.rgss3a"))) return "ace";
	if (await common.isFileAsync(nwPath.join(this.dirname, "Data/System.rvdata2"))) return "ace";
	if (await common.isFileAsync(nwPath.join(this.dirname, "Game.rgss2a"))) return "vx";
	if (await common.isFileAsync(nwPath.join(this.dirname, "Data/System.rvdata"))) return "vx";
	if (await common.isFileAsync(nwPath.join(this.dirname, "Game.rgssad"))) return "xp";
	if (await common.isFileAsync(nwPath.join(this.dirname, "Data/System.rxdata"))) return "xp";
	if (await common.isFileAsync(nwPath.join(this.dirname, "Game.rvproj2"))) return "ace";
	
}

RMUtil.prototype.getEngineCode = async function() {
	if (this.engineCode) return this.engineCode;
	this.engineCode = await this.detectEngineType();
	return this.engineCode;
}

RMUtil.createCacheFolder = async function(id) {
	await ui.log("生成临时目录");

	id = id || common.makeid(10);

	var cacheInfo = {
		cacheID: id,
		cachePath: nwPath.join(common.getStagePath(), id)
	}

	var cacheFolderData = nwPath.join(cacheInfo.cachePath, "data");
	await common.mkDir(cacheFolderData);
	await ui.log(`id为 ${id} 的新临时目录已创建！`);
	
	return cacheInfo;
}

thisAddon.RMUtil = RMUtil;








xSpawn = async function(command, args, options) {
	args = args || [];
	if (Array.isArray(args) == false) args = [args];
	options = options||{};
	options.args = options.args||{};
	options.onData = options.onData||function(result, e) {};
	options.onDone = options.onDone||function(result, e) {};
	options.onError = options.onError||function(result, e) {};
	//options.onReceive = options.onReceive||function(result, e) {};
	var resolver;
	var rejecter;
	var thisPromise = new Promise((resolve, reject)=>{
		resolver = resolve;
		rejecter = reject;
	});	
	
	
	var outputBuffer = "";
	var child = spawn(command, args, options);
	
	child.stdout.on('data', function (data) {
		//console.log('stdout: ' + data);
		outputBuffer += data;
		//console.log("Received buffer : "+data);
		options.onData.call(this, data);
		//options.onReceive.call(this, data);
	});

	child.stderr.on('data', function (data) {
		console.log('stderr: ' + data);
		options.onError.call(this, data);
		
	});

	child.on('close', function (code) {
		console.log('child process exited with code ' + code);
		//console.log("data is : "+outputBuffer);
		var result = php.evalResult(outputBuffer)
		options.onDone.call(this, result);
		resolver(result);
	});	
	
	return thisPromise;
}


var RMRGSS = function(exeFile) {
	this.file 	= exeFile;
	this.dir 	= nwPath.dirname(this.file);
}

RMRGSS.prototype.init = async function() {
	
}

RMRGSS.prototype.type = async function() {
	return await Engines.detect(this.file);
}

RMRGSS.prototype.extractTo = async function(to) {
	// to is dirname
	console.log("Extracting to ", to);

	console.log("copying");
	await bCopy(this.dir, to);

	console.log("done copying");
	
	var dirContent = await afs.readdir(this.dir);
	var monitor = [".rgss3a", ".rgss2a", ".rgssad"]
	for (var i in dirContent) {
		var ext = nwPath.extname(dirContent[i]);
		if (monitor.includes(ext.toLowerCase()) == false) continue;
		var result = await xSpawn("start", [nwPath.join(decrypterPath, "RgssDecrypter.exe"), dirContent[i]], {
			cwd : to,
			shell: true,
			windowsHide: false		
		});
		
		fs.unlinkSync(nwPath.join(to, dirContent[i]));
		console.log("Unlink done");
	}
	
	console.log("Extraction done");
	
}

RMRGSS.prototype.isPacked = async function() {
	var dirContent = await afs.readdir(this.dir);
	for (var i in dirContent) {
		var ext = nwPath.extname(dirContent[i]);
		//vxace archive
		if (ext.toLowerCase() == ".rgss3a") return true;
		//vx archive
		if (ext.toLowerCase() == ".rgss2a") return true;
		//xp archive
		if (ext.toLowerCase() == ".rgssad") return true;
	}
	return false;
}

window.RMRGSS = RMRGSS;

thisAddon.createProject = async function(exeFile, options) {
	options = options || {};
	await ui.log("创建项目");

	/*
	var cacheInfo = await RMUtil.createCacheFolder();
	options.targetDir = nwPath.join(cacheInfo.cachePath, "data/");
	var rmUtil = new RMUtil(exeFile, options)
	await rmUtil.parse();
	return rmUtil;
	*/
	var rmUtil = new RMUtil(exeFile, options)	
	await rmUtil.toTrans();
	console.log();
	return rmUtil;
}


function init() {
	engines.addHandler(["rmxp", "rmvx", "rmvxace"], "onLoadTrans", 
	() => {
		console.log("Executing onloadtrans");
		ui.translationByContext.dataLocation = "contextTranslation";
	})
}


$(document).ready(function() {
	ui.onReady(function() {
		init();
	});
});