var thisAddon = this;
var iconv 		= require('iconv-lite');
var path 		= require('path');
var fs 			= fs || require('graceful-fs');
var {ParserBase} = require("www/js/ParserBase.js");

class ESScript extends ParserBase {
	constructor(script, options, callback) {
		super(script, options, callback);
	}
}

/*
var ESScript = function(script, options, callback) {
	this.script 				= script;
	this.options 				= options || {}
	this.options.onParseStart 	= this.options.onParseStart || function(){}
	this.options.onParseEnd 	= this.options.onParseEnd || function(){}
	this.readEncoding 			= this.options.readEncoding || thisAddon.config.readEncoding || "UTF-8";
	this.writeEncoding 			= this.options.writeEncoding || thisAddon.config.writeEncoding || 'UTF-8';
	this.translationPair 		= this.options.translationPair || {}
	this.translationInfo 		= this.options.translationInfo || {};
	this.translatableTexts 		= [];
	this.contextSeparator		= this.options.contextSeparator || "/"
	this.buffer;
	this.string;
	this.writableData 			= []; // array represent copy of the writable data
	this.currentContext 		= [];
	this.promise;	

}
*/

ESScript.detectEncoding = function(buffer) {
    var d = new Buffer.alloc(5, [0, 0, 0, 0, 0]);
    var fd = fs.openSync(f, 'r');
    fs.readSync(fd, d, 0, 5, 0);
    fs.closeSync(fd);

    // https://en.wikipedia.org/wiki/Byte_order_mark
    var e = false;
    if ( !e && d[0] === 0xEF && d[1] === 0xBB && d[2] === 0xBF)
        e = 'utf8';
    if (!e && d[0] === 0xFE && d[1] === 0xFF)
        e = 'utf16be';
    if (!e && d[0] === 0xFF && d[1] === 0xFE)
        e = 'utf16le';
    if (!e)
        e = 'ascii';

    return e;
	
}

/*
ESScript.prototype.setTranslationPair = function(translationPair) {
	translationPair = translationPair ||{};
	this.translationPair = translationPair;
	return this;
}

ESScript.prototype.getText = function() {
	return this.writableData.join("");
}

ESScript.prototype.contextEnter = function() {
	for (var i=0; i<arguments.length; i++) {
		this.currentContext.push(arguments[i])
	}
}
ESScript.prototype.contextEnd = function() {
	this.currentContext.pop()
}
*/

ESScript.prototype.filterText = function(text, context) {
	// filter text for trans
	var result = text;

	if (text == `""` || text == '``' || text == "''") return "";

	//console.log("Filtering ", text);
	if (context.includes("TemplateHead")) {
		text = "`"+text.substring(1, text.length-2)+"`";
	} else if (context.includes("TemplateMiddle")) {
		text = "`"+text.substring(1, text.length-2)+"`";
	} else if (context.includes("TemplateTail")) {
		text = "`"+text.substring(1, text.length-1)+"`";
	}

	try {
		result = eval(text);
		//console.log("Filtering result:", result, "type", typeof result);
	} catch (e) {
		console.warn("尝试从字符串求值时出错：", text);
	}

	if (typeof result !== "string") {
		console.warn(`${result} is not string. Evaluating:`, text, "type:", typeof text);
	}

	return result;
}

ESScript.prototype.replaceLineBreak = function(text) {
	if (typeof text !== 'string') {
		console.warn("尝试替换非字符串类型变量的换行符", text);
		return text;
	}
	return text.replace(/\n/g, "\\n");
}

ESScript.prototype.unfilterText = function(text, context) {
	// generate text from trans to javascript
	//console.log("Unfilter with text: ", text, "type:", typeof text);
	if (typeof text !== "string") return text;

	//console.log("Processing unfilter");
	var newText = text;
	newText = this.replaceLineBreak(text);
	newText = newText.replace(/\\/g, "\\\\");
	newText = newText.replace(/\`/g, "\\`");
	
	if (context.includes("TemplateHead")) return "`"+newText+"${";
	if (context.includes("TemplateMiddle")) return "}"+newText+"${";
	if (context.includes("TemplateTail")) return "}"+newText+"`";

	var result = JSON.stringify(text);
	//console.log(`Unfilter result: text `,text, "result:", result);

	return result;
}

/*
ESScript.prototype.translate = function(text) {
	if (typeof text !== 'string') return text;
	if (text.trim() == '') return text;
	//console.log("attempt to translate ", text, this.translationPair);

	// compare with exact context match
	var prefix = this.currentContext.join("/")
	prefix = prefix+"\n";
	if (Boolean(this.translationPair[prefix+text])) return this.translationPair[prefix+text];


	// compare with group
	var sliceLevel = this.translationInfo.groupLevel || 0;
	if (sliceLevel > 0) {
		prefix = this.currentContext.slice(0, sliceLevel).join("/")
		prefix = prefix+"\n";
		//if (window.monitoringMode) console.log("%cTranslate by group",  'background: #00F; color: #fff', prefix);
		if (Boolean(this.translationPair[prefix+text])) return this.translationPair[prefix+text];
	}

	//console.log("found in translation pair?", this.translationPair[text]);
	
	if (typeof this.translationPair[text] == 'undefined') return text;
	
	return this.translationPair[text];
}

ESScript.prototype.registerString = function(string, localContext, parameters) {
	var copyContext = JSON.parse(JSON.stringify(this.currentContext))
	localContext = localContext||[];
	if (Array.isArray(localContext) == false) localContext = [localContext];
	copyContext = copyContext.concat(localContext);

	var filteredText = this.filterText(string, copyContext)

	if (string.trim().length > 0) {
		this.translatableTexts.push({
			text:filteredText,
			rawText:string,
			context:copyContext,
			parameters:parameters
		});
	}
	
	var translation = this.translate(filteredText);
	if (translation !== filteredText) {
		console.log("%cTranslating", 'background: #222; color: #bada55', filteredText,"->", translation, this.translationPair);
		
		this.writableData.push(this.unfilterText(translation, copyContext));
	} else {
		this.writableData.push(string);
	}
	
}

ESScript.prototype.register = function(string) {
	this.writableData.push(string);
}
*/

ESScript.prototype.getRowCol = function(index) {
	var chunck = this.script.substring(0, index);
	var lines = chunck.split("\n");
	return {
		row:lines.length,
		col:lines[lines.length -1].length
	}
}

ESScript.prototype.leftHandContext = function(index, tokens) {
	tokens = tokens || this.tokens || [];
	var result = {
		type:"",
		context:[]
	};
	var countComma = 0;
	var bracketLevel = 0;
	var sqBracketLevel = 0;
	var counter = 0;
	for (var i=index; i>=0; i--) {
		var thisToken = tokens[i];
		if (thisToken.type == "Punctuator") {
			if ([";", "}"].includes(thisToken.value)) {
				return result;
			} else if (thisToken.value == ",") {
				countComma++;
			} else if (thisToken.value == ")") {
				bracketLevel++;
			} else if (thisToken.value == "(") {
				if (bracketLevel > 0) {
					bracketLevel--;
					continue;
				}
				result.context.unshift(countComma);
				countComma = 0;
				result.type = "functionArgs";
			} else if (thisToken.value == "]") {
				sqBracketLevel++;
			} else if (thisToken.value == "[") {
				if (sqBracketLevel > 0) {
					sqBracketLevel--;
					continue;
				}
				result.type = "objectKey";
			} else if (["+", "+="].includes(thisToken.value)) {
				result.type = "concatenate"
				return result;
			} else if (thisToken.value == "=") {
				result.type = "assignment";
			}
		} else if (["StringLiteral", "TemplateHead", "TemplateMiddle", "TemplateTail"].includes(thisToken.type)) {
			if (counter == 0) continue;
			if (bracketLevel > 0) continue;
			return result;
		} else if (thisToken.type == "IdentifierName") {
			if (countComma > 0) {
				
			} else {
				result.context.unshift(thisToken.value);
			}
			if (["if", "var", "const", "typeof", "let"].includes(thisToken.value.toLowerCase())) return result;
		} else if (thisToken.type == "LineTerminatorSequence") {
			return result;
		}
		counter++;
	}
	return result;
}

ESScript.prototype.parse = async function() {
    thisAddon.jsToken = thisAddon.jsToken||require("js-tokens");
	this.tokens = Array.from(thisAddon.jsToken(this.script), (token) => token);
	var start = 0;
    var literalTypes = ["StringLiteral", "NoSubstitutionTemplate", "TemplateHead", "TemplateMiddle", "TemplateTail"]   
	for (var i=0; i < this.tokens.length; i++) {
		var end = start+this.tokens[i].value.length
		this.tokens[i].start 	= start;
		this.tokens[i].end 		= end;
		//var rowCol = this.getRowCol(start);
		if (literalTypes.includes(this.tokens[i].type)) {
			this.registerString(this.tokens[i].value, ["tok", i,"type", this.tokens[i].type, "pos", start], {
				start:start,
				end:end,
				leftHand:this.leftHandContext(i)
			});
		} else {
			this.register(this.tokens[i].value);
		}

		start = end;
	}
	this.isParsed = true;
}

/*
ESScript.prototype.toTrans = async function() {
	if (!this.isParsed) await this.parse();
	var result = {
		data:[],
		context:[],
		parameters:[],
		indexIds:{},
		lineBreak: common.detectLineBreak(this.script)
	}

	for (var i in this.translatableTexts) {
		var thisObj = this.translatableTexts[i];
		if (typeof thisObj.text !== "string") continue;
		if (thisObj.text.length == 0) continue;
		result.indexIds[thisObj.text] = result.indexIds[thisObj.text] || result.data.length;
		
		var row = result.indexIds[thisObj.text];
		result.data[row] 	= result.data[row] || [thisObj.text, ""];
		result.context[row] = result.context[row]||[];
		result.context[row].push(thisObj.context.join(this.contextSeparator))
		result.parameters[row] = result.parameters[row]||[];
		result.parameters[row].push(thisObj.parameters)
	}
	return result;
}
*/

/**
 * Get string from inside a function's parameter
 */
ESScript.prototype.fetchFromFn = async function() {
	thisAddon.jsToken = thisAddon.jsToken||require("js-tokens");
	this.tokens = Array.from(thisAddon.jsToken(this.script), (token) => token);

	var start = 0;
	for (var i=0; i < this.tokens.length; i++) {
		var end = start+this.tokens[i].value.length
		this.tokens[i].start 	= start;
		this.tokens[i].end 		= end;		
		if (this.tokens[i].type == "StringLiteral") {
			this.registerString(this.tokens[i].value, ["tok", i]);
		} else {
			this.register(this.tokens[i].value);
		}

		start = end;
	}
	return this;
}

window.ESScript = ESScript;


var ESFile = function(file, options, callback) {
	this.file 			 	= file;
	this.options 			= options || {};
	// basedir is required to calculate relative path
	this.options.baseDir	= this.options.baseDir || "";
	if (!this.options.baseDir) console.warn("选项。baseDir未定义，trans path将显示完整路径");
	this.translationData 	= this.options.translationData||{};
	this.contextSeparator 	= this.options.contextSeparator || "/"
	this.showBlank 			= this.options.showBlank || false;
	this.engineName			= 'esfile'
	this.parser				= 'ESParser';
	this.callback 			= callback || function() {}
	this.promise;
	this.isInitialized 		= false;
	this.options.filterOptions = this.options.filterOptions || {};
	this.options.filterOptions.files = this.options.filterOptions.files || [];
}

ESFile.prototype.getRelativePath = function() {
	var newPath = this.file.replace(/\\/g, "/");
	return newPath.substring(this.options.baseDir.length);
}

ESFile.prototype.toTrans = async function() {
	if (!this.isInitialized) await this.init();
	var thisRelPath = this.getRelativePath();
	this.trans = await this.esScript.toTrans();
	this.trans.basename 	= nwPath.basename(thisRelPath);
	this.trans.filename 	= nwPath.basename(thisRelPath);
	this.trans.extension 	= nwPath.extname(thisRelPath);
	this.trans.dirname 		= nwPath.dirname(thisRelPath);
	this.trans.path			= thisRelPath;
	this.trans.tags			= [];

	return this.trans;
}

ESFile.prototype.writeTo = async function(target) {
	if (!this.isInitialized) await this.init();
	try {
		await common.mkDir(nwPath.dirname(target));
		await common.writeFile(target, this.esScript.writableData.join(""));
	} catch (e) {
		console.warn(e);
	}
}
/**
 * @param  {} translationData
 * Format :
 * {
 * "info": {},
 * "translationPair": {
 *   "MOG_TitlePictureCom": "MOG_TitlePictureCom22"
 * }

 */
ESFile.prototype.setTranslationData = function(translationData) {
	translationData = translationData ||{};
	this.options = this.options || {}
	this.options.translationData = translationData || {};
	this.options.translationPair = this.options.translationData.translationPair
	this.options.translationInfo = this.options.translationData.info
	return this;
}

ESFile.prototype.init = async function() {
	try {
		this.content = await common.fileGetContents(this.file);
	} catch (e) {
		console.warn("无法初始化ESF文件", e);
		return;
	}
	console.log(`parsing ${this.file} with options :`, this.options);
	this.esScript  = new ESScript(this.content, this.options); 
	this.esScript.parse();
	this.isInitialized = true;
	console.log("parsed ES : ", this);
}

window.ESFile = ESFile;