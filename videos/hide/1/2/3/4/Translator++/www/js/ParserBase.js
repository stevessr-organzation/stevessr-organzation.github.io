var iconv 		= require('iconv-lite');
var fs 			= fs || require('graceful-fs');
var fse 		= require('fs-extra')


class ParserBase {
    constructor(script, options) {
        this.script 				= script;
        this.options 				= options || {}
        this.options.onParseStart 	= this.options.onParseStart || function(){}
        this.options.onParseEnd 	= this.options.onParseEnd || function(){}
        this.readEncoding 			= this.options.readEncoding // force this encoding when reading
        this.writeEncoding 			= this.options.writeEncoding // force into this encoding when writing
        this.defaultEncoding		= this.options.defaultEncoding || "utf8";
		this.encoding; // private, actual encoding currently used on the data
        this.translationPair 		= this.options.translationPair || {}
        this.translationInfo 		= this.options.translationInfo || {};
        this.contextSeparator		= this.options.contextSeparator || "/"
		this.baseParameter			= this.options.baseParameter || undefined;
        this.baseContext        	= this.options.baseContext || [];
        this.baseTags	        	= this.options.baseTags || [];
		this.transData = {
			data:[],
			context:[],
			tags:[],
			parameters:[],
			indexIds:{}
		};		
        this.translatableTexts 		= [];
        this.writableData 			= []; // array represent copy of the writable data
        this.currentContext 		= [];
        this.buffer;
        this.string;
        this.debugLevel             = this.options.debugLevel||0;
        this.promise;

		if (!empty(this.baseContext)) {
			this.contextEnter.apply(this, this.baseContext);
		}
    }
}

ParserBase.detectEncoding = function(buffer) {
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

/**
 * Set translation pair from translationDatas
 * If translationDatas is not set, this.options.translationDatas is used
 * @param  {} path
 * @param  {} translationDatas
 */
ParserBase.prototype.assignTranslationPair = function(path, translationDatas) {
	console.log("assignTranslationPair:", arguments);
	if (!path) return this;
	translationDatas = translationDatas || this.options.translationDatas || {
		info:{},
		translationData:{}
	}

	if (!translationDatas) return this;
	if (!translationDatas.translationData) return this;
	if (!translationDatas.translationData[path]) {
		path = "/"+path;
		if (!translationDatas.translationData[path]) return this;
	}
	if (empty(translationDatas.translationData[path].translationPair)) return this;

	this.translationInfo = translationDatas.translationData[path].translationInfo || {};
	this.translationPair = translationDatas.translationData[path].translationPair || {};
	return this;
}

/**
 * Determine whether the file path should be processed or not
 * True : process
 * False : should not process
 * @param  {String} relPath - Path's key
 * @returns {Boolean}
 */
ParserBase.prototype.processThispath = function(relPath) {
	if (!(this.options)) return true;
	if (empty(this.options.files)) return true;

	if (this.options.files.includes(relPath)) return true;

	return false;
}

ParserBase.prototype.setTranslationPair = function(translationPair) {
	translationPair = translationPair ||{};
	this.translationPair = translationPair;
	return this;
}

ParserBase.prototype.getText = function() {
	return this.writableData.join("");
}

ParserBase.prototype.contextEnter = function() {
	for (var i=0; i<arguments.length; i++) {
		this.currentContext.push(arguments[i])
	}
}
ParserBase.prototype.contextEnd = function() {
	this.currentContext.pop()
}

ParserBase.prototype.replaceLineBreak = function(text) {
	return text.replace(/\n/g, "\\n");
}

/**
 * Filter text for Translator++ front end
 * Please overwrite this function based on the engine
 * @param  {} text
 * @param  {} context
 * @param  {} parameters
 */
ParserBase.prototype.filterText = function(text, context, parameters) {
	return text;
}

/**
 * Unfilter text to prepare the data to be exported
 * Please overwrite this function based on the engine
 * @param  {} text
 * @param  {} context
 * @param  {} parameters
 */
ParserBase.prototype.unfilterText = function(text, context, parameters) {
    return text;
}

/**
 * Translate text based on this.translationPair
 * @param  {String} text - Text to be translated
 * @param  {Array} context - Array of the current context
 * @returns {String} - Translation
 */
ParserBase.prototype.translate = function(text, context) {
	if (typeof text !== 'string') return text;
	if (text.trim() == '') return text;
	if (this.debugLevel >= 1) console.log("attempt to translate: ", text);
	if (this.debugLevel >= 3) console.log("JSON text: ", JSON.stringify(text));
	if (this.debugLevel >= 1) console.log("Translation pair: ", this.translationPair);

	// compare with exact context match
	var prefix = context.join("/");
	if (this.debugLevel >= 1) console.log("Current context:", prefix);
	prefix = prefix+"\n";
	if (this.debugLevel >= 1) console.log("this.translationPair[prefix+text]:", this.translationPair[prefix+text]);
	if (Boolean(this.translationPair[prefix+text])) return this.translationPair[prefix+text];


	// compare with group
	var sliceLevel = this.translationInfo.groupLevel || 0;
	if (sliceLevel > 0) {
		prefix = context.slice(0, sliceLevel).join("/")
		prefix = prefix+"\n";
		//if (window.monitoringMode) console.log("%cTranslate by group",  'background: #00F; color: #fff', prefix);
		if (Boolean(this.translationPair[prefix+text])) return this.translationPair[prefix+text];
	}

	//console.log("found in translation pair?", this.translationPair[text]);
	
	if (typeof this.translationPair[text] == 'undefined') return text;
	
	return this.translationPair[text];
}

ParserBase.prototype.addTransData = function(translatableObj) {
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
		// always override with new value
		// todo: merge with another occurance?		
		if (Array.isArray(translatableObj.tags) == false) translatableObj.tags = [translatableObj.tags]
		result.tags[row] 	= translatableObj.tags;

		//result.tags[row].push(translatableObj.tags);
	}
	
	return this;	
}

ParserBase.prototype.registerString = function(string, localContext, parameters, options) {
	if (typeof string !== "string") {
		console.warn("Attempt to register non string format with value:", string);
		console.warn("Arguments is:", arguments);
		string = string || "";
	}

	options = options || {};
	options.currentAddress = options.currentAddress || this.currentAddress;

	
	var copyContext = common.clone(this.currentContext)
	localContext 	= localContext||[];
	if (Array.isArray(localContext) == false) localContext = [localContext];
	copyContext = copyContext.concat(localContext);

	if (this.baseParameter) parameters = Object.assign(this.baseParameter, parameters);
	var filteredText 	= this.filterText(string, copyContext, parameters)
	var thisTag 		= this.baseTags.concat(options.tags||[])

	var obj = {};
	if (string.trim().length > 0) {
		obj = {
			text		:filteredText,
			rawText		:string,
			context		:copyContext,
			parameters	:parameters,
			tags		:thisTag,
			address		:common.clone(options.currentAddress)
		}
		this.translatableTexts.push(obj);

		this.addTransData(obj);
	}
	
	var translation = this.translate(filteredText, copyContext);
	if (translation !== filteredText) {
		if (this.debugLevel >= 1) console.log("%cTranslating:", 'background: #222; color: #bada55', filteredText,"->", translation, this.translationPair);
		
		this.writableData.push(this.unfilterText(translation, copyContext, parameters, obj));
	} else {
		this.writableData.push(string);
	}
	return translation;
}

ParserBase.prototype.register = function(string) {
	this.writableData.push(string);
	return string;
}

ParserBase.prototype.editLastWritableData = function(string) {
	this.writableData[this.writableData.length-1] = string;
	return string;
}

ParserBase.prototype.toTrans = async function() {
	if (!this.isParsed) await this.parse();
	
	return this.transData;
}

ParserBase.appendTransData = function(originalTrans, newTrans) {
	newTrans = common.clone(newTrans);
	this.keyColumn = this.keyColumn || 0;
	//this.linkedObject = ["context", "parameters", "tags"]
	originalTrans.indexIds = originalTrans.indexIds || {};

	if (empty(newTrans.data)) return originalTrans;
	for (var row=0; row<newTrans.data.length; row++) {
		var thisText = newTrans.data[row][this.keyColumn];
		if (empty(thisText)) continue;
		if (originalTrans.indexIds[thisText]) {
			// add context
			var newIndex = originalTrans.indexIds[thisText];
		} else {
			var newIndex = originalTrans.data.push(newTrans.data[row]) - 1;
			originalTrans.indexIds[thisText] = newIndex;
		}

		/*
		for (var x in this.linkedObject) {
			var objKey = this.linkedObject[x];
			if (!Boolean(newTrans[objKey])) continue;
			if (!Boolean(newTrans[objKey][row])) continue;
			originalTrans[objKey] = originalTrans[objKey] || [];
			originalTrans[objKey][newIndex] = newTrans[objKey][row];
		}
		*/

		// context & parameters
		if (!empty(newTrans.context)) {
			originalTrans.context[newIndex] = originalTrans.context[newIndex] || [];
			newTrans.context[row] = newTrans.context[row] || [];
			for (var contextId=0; contextId<newTrans.context[row].length; contextId++) {
				var newCtxIdx = originalTrans.context[newIndex].push(newTrans.context[row][contextId]) -1;
				if (empty(newTrans.parameters)) continue;
				if (empty(newTrans.parameters[row])) continue;
				originalTrans.parameters = originalTrans.parameters || [];
				originalTrans.parameters[newIndex] = originalTrans.parameters[newIndex] || [];
				originalTrans.parameters[newIndex][newCtxIdx] = newTrans.parameters[row][contextId];
			}
		}

		// tags
		if (!empty(newTrans.tags)) {
			if (!empty(newTrans.tags[row])) {
				originalTrans.tags = originalTrans.tags || [];
				originalTrans.tags[newIndex] = originalTrans.tags[newIndex] || [];
				originalTrans.tags[newIndex] = originalTrans.tags[newIndex].concat(newTrans.tags[row]);
				
				// make unique
				originalTrans.tags[newIndex] = originalTrans.tags[newIndex].filter((value, index, self)=>{
					return self.indexOf(value) === index;
				});
			}
		}

	}
	return originalTrans;
}

/**
 * Import transData from another parsed instance of ParserBase
 * @param  {} exportedObj
 */
ParserBase.prototype.importTransData = function(exportedObj) {
	if (!exportedObj) return this;
	if (empty(exportedObj.transData)) return this;
	ParserBase.appendTransData(this.transData, exportedObj.transData);
	return this;
}

ParserBase.prototype.toString = function() {
	return this.writableData.join("");
}

ParserBase.generateFileInfo = function(relativePath) {
    var fileInfo = {};
    fileInfo.extension 		= nwPath.extname(relativePath).toLowerCase().substring(1);
    fileInfo.filename 		= nwPath.basename(relativePath, nwPath.extname(relativePath));
    fileInfo.basename 		= nwPath.basename(relativePath);
    fileInfo.path 			= relativePath;
    fileInfo.relPath		= relativePath;
    fileInfo.dirname 		= "/"+nwPath.dirname(relativePath);
    return fileInfo;
}

ParserBase.prototype.generateFileInfo = function(relativePath) {
	this.fileInfo = ParserBase.generateFileInfo(relativePath);
	return this.fileInfo;
}


class ParserFile extends ParserBase {
	constructor(file, options, callback) {
		//first argument of ParserBase is the content of the file
		//which at the construction of the object still unavailable
		super(undefined, options, callback)
		this.file = file;
		this.detectedEncoding; // encoding detected by this.readfile
		this.readEncoding;
		this.writeEncoding;
		
	}
}


ParserFile.detectEncoding = function(buffer) {
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

ParserFile.prototype.readFile = async function(file, readEncoding) {
	file = file || this.file;
	readEncoding = readEncoding || this.readEncoding;
	console.log("loading :", file);

	return new Promise((resolve, reject) => {
		fs.readFile(file, (err, data) => {
			if (err) return reject();
			this.buffer = data;
			this.detectedEncoding = common.detectEncoding(data);
			if (this.detectedEncoding == "UNICODE") ParserFile.detectEncoding(data)
			this.encoding = readEncoding || this.detectedEncoding;


			var result;
			try {
				console.log("encoding file with ", this.encoding);
				result = iconv.decode(data, this.encoding);
			} catch (e) {
				console.warn("Unable to decode string try 'UTF8'", e);
				result = iconv.decode(data, this.defaultEncoding);
			}
			resolve(result)
		})	
	})
}

ParserFile.prototype.write = async function(file, encoding, bom) {
	return await common.filePutContents(file, this.getText(), encoding, bom);
	/*
	return new Promise((resolve, reject) => {
		encoding = encoding || this.encoding || 'utf16le';
		console.log(`writing ${file} using encoding : ${encoding}`);
		var buffer = iconv.encode(this.getText(), encoding, {addBOM: true});

		fs.writeFile(file, buffer, (err)=>{
			if (err) {
				console.warn("Failed to write ", file, err);
				return reject(err);
			}
			
			console.log("Success writing:", file)
			resolve(file);
			return;
		})
	})
	*/
}


exports.ParserBase = ParserBase;
exports.ParserFile = ParserFile;