window.langTools = new (require("www/js/LangTools.js"))(require("www/js/langDB.js"))


/**
 * Handles how a text or an array of texts is translated from one language to another.
 * Each translation app has its own protocol, api and method. This class takes care of that and at the same time hopes to make that diversity more uniform.
 * @class
 * @param {Object} [defaultVal] - Default value. Please provide an object with the TranslatorEngine like structure. 
 * @param {Object} [defaultConfig] - Default value. Please provide an object with the TranslatorEngine like structure. 
 */  
var TranslatorEngine = function(defaultVal, defaultConfig) {
	this.constructor.apply(this, arguments);
	this.$elm = $("<div></div>");
	this.defaultConfig = defaultConfig || this.defaultConfig || {};
	
}
TranslatorEngine.prototype.on = function(evt, fn) {
    this.$elm.on(evt, fn)
}

TranslatorEngine.prototype.off = function(evt, fn) {
    this.$elm.off(evt, fn)
}

TranslatorEngine.prototype.one = function(evt, fn) {
    this.$elm.one(evt, fn)
}

TranslatorEngine.prototype.trigger = function(evt, param) {
    this.$elm.trigger(evt, param)
}

TranslatorEngine.prototype.constructor = function(defaultVal) {
	/**
	 * ID of the engine. Must be unique.
	 */
	this.id=""
	/**
	 * Display name of the engine
	 */
	this.name=""
	/**
	 * Description of the engine.
	 */
	this.description=""
	/**
	 * Author of this engine
	 * @default Anonymous
	 */
	this.author="Anonymous"
	/**
	 * Engine version
	 */
	this.version="1.0"
	this.isInitialized= false
	this.isDisabled=false
	this.columnIndex=2
	this.columnHeader= ""
	/**
	 * Maximum request length for each batch in characters.
	 * @default 5000
	 */
	this.maxRequestLength = 5000
	this.fileListLoaded= false
	this.indexIsBuilt= false
	this.skipTranslated=false
	/**
	 * Batch delay.
	 * The waiting time between batch. Some server will ban user if you send intense attack like requests.
	 * @default 5000
	 */
	this.batchDelay=5000
	this.skipTranslatedOnBatch =true // skip lines that already translated when doing TRANSLATE ALL

	/**
	 * In rowByRow mode newlines (`\n`) will be substituted by this character before sending to translator.
	 * @default §
	 */
	this.lineSubstitute = '§', //¶, 
	
	/**
	 * Escape algorithm to escape subset of string.
	 */
	this.escapeAlgorithm = '',

	/**
	 * delimiter for each line. Pick character that will be obeyed by translator engine.
	 * The possition of the delimiter for the resulted translation should be intact and unchanged.
	 * if the number of lines of original text doesn't match with translation result...dissaster will be occured!
	 * 
	 * Example:
	 * Google treat line break as line separator. You should use \n (or \r\n) for google.
	 * 
	 * @default \n
	 */
	this.delimiter = $DV.config.lineSeparator,

	/**
	 * Supported languages of the translator
	 * default is whatever google supports
	*/
	this.languages = {
		"af" : "Afrikaans",
		"sq" : "Albanian",
		"am" : "Amharic",
		"ar" : "Arabic",
		"hy" : "Armenian",
		"az" : "Azerbaijani",
		"eu" : "Basque",
		"be" : "Belarusian",
		"bn" : "Bengali",
		"bs" : "Bosnian",
		"bg" : "Bulgarian",
		"ca" : "Catalan",
		"ceb" : "Cebuano",
		"zh-CN" : "Chinese (Simplified)",
		"zh-TW" : "Chinese (Traditional)",
		"co" : "Corsican",
		"hr" : "Croatian",
		"cs" : "Czech",
		"da" : "Danish",
		"nl" : "Dutch",
		"en" : "English",
		"eo" : "Esperanto",
		"et" : "Estonian",
		"fi" : "Finnish",
		"fr" : "French",
		"fy" : "Frisian",
		"gl" : "Galician",
		"ka" : "Georgian",
		"de" : "German",
		"el" : "Greek",
		"gu" : "Gujarati",
		"ht" : "Haitian Creole",
		"ha" : "Hausa",
		"haw" : "Hawaiian",
		"he" : "Hebrew",
		"hi" : "Hindi",
		"hmn" : "Hmong",
		"hu" : "Hungarian",
		"is" : "Icelandic",
		"ig" : "Igbo",
		"id" : "Indonesian",
		"ga" : "Irish",
		"it" : "Italian",
		"ja" : "Japanese",
		"jw" : "Javanese",
		"kn" : "Kannada",
		"kk" : "Kazakh",
		"km" : "Khmer",
		"ko" : "Korean",
		"ku" : "Kurdish",
		"ky" : "Kyrgyz",
		"lo" : "Lao",
		"la" : "Latin",
		"lv" : "Latvian",
		"lt" : "Lithuanian",
		"lb" : "Luxembourgish",
		"mk" : "Macedonian",
		"mg" : "Malagasy",
		"ms" : "Malay",
		"ml" : "Malayalam",
		"mt" : "Maltese",
		"mi" : "Maori",
		"mr" : "Marathi",
		"mn" : "Mongolian",
		"my" : "Myanmar (Burmese)",
		"ne" : "Nepali",
		"no" : "Norwegian",
		"ny" : "Nyanja (Chichewa)",
		"ps" : "Pashto",
		"fa" : "Persian",
		"pl" : "Polish",
		"pt" : "Portuguese (Portugal, Brazil)",
		"pa" : "Punjabi",
		"ro" : "Romanian",
		"ru" : "Russian",
		"sm" : "Samoan",
		"gd" : "Scots Gaelic",
		"sr" : "Serbian",
		"st" : "Sesotho",
		"sn" : "Shona",
		"sd" : "Sindhi",
		"si" : "Sinhala (Sinhalese)",
		"sk" : "Slovak",
		"sl" : "Slovenian",
		"so" : "Somali",
		"es" : "Spanish",
		"su" : "Sundanese",
		"sw" : "Swahili",
		"sv" : "Swedish",
		"tl" : "Tagalog (Filipino)",
		"tg" : "Tajik",
		"ta" : "Tamil",
		"te" : "Telugu",
		"th" : "Thai",
		"tr" : "Turkish",
		"uk" : "Ukrainian",
		"ur" : "Urdu",
		"uz" : "Uzbek",
		"vi" : "Vietnamese",
		"cy" : "Welsh",
		"xh" : "Xhosa",
		"yi" : "Yiddish",
		"yo" : "Yoruba",
		"zu" : "Zulu"
	}
	
	/**
	 * A `JSON Form` object to generate a form for options.
	 * More about JSON Form:
	 * [https://github.com/jsonform/jsonform/wiki](https://github.com/jsonform/jsonform/wiki)
	 * [Sample and playground](https://jsonform.github.io/jsonform/playground/index.html)
	 * @type {Object}
	 */
	this.optionsForm = {
		"schema": {
		  "lineSubstitute": {
			"type": "string",
			"title": "Line substitute",
			"description": "Newline character replacer before sending the text to translator service.\nBecause in the row by row translation the index of original and translated text pairs are determined by the index of the lines.",
			"default":this.lineSubstitute
		  }
		},
		"form": [
		  {
			"key": "lineSubstitute",
			"onChange": (evt) => {
				var value = $(evt.target).val();
				this.update("lineSubstitute", value);
			}
		  }	
		]
	  };
	
	if (typeof defaultVal == 'object') {
		for (var key in defaultVal) {
			if (key == "optionsForm") {
				this.mergeOptionsForm(defaultVal[key]);
				continue;
			}
			this[key] = defaultVal[key];
		}
	}
	
	this.$elm = $("<div></div>");
}


/**
 * Convert language code from the unified language code to this engine's language code.
 * @param {String} standardCode - Standard language code
 * @param {String} [langTable] - Language table. sl||tl
 * @returns {String} - This engine's language code
 * @since 4.10.1
 * @example
 * trans.getTranslatorEngine("lingvaNex").getLanguageCode("ja")
 * // ja_JP
 */
TranslatorEngine.prototype.getLanguageCode = function(standardCode, langTable) {
	if (!langTable) {
		if (!this.languages[standardCode]) return standardCode;
		return this.languages[standardCode];
	}

	if (!typeof langTable == "string") return console.error("Expected second parameter to be string", typeof langTable, "given!", langTable);
	var targetKey = "languages";
	if (["sl", "source", "sourceLanguage", "sourceLanguages"].includes(langTable.toLowerCase())) {
		targetKey = "sourceLanguages";
	} else if (["tl", "target", "targetLanguage", "targetLanguages"].includes(langTable.toLowerCase())) {
		targetKey = "targetLanguages";
	}
	try {
		return this[targetKey][standardCode] || standardCode;
	} catch (e) {
		console.warn(e);
		return standardCode
	}
}

TranslatorEngine.prototype.mergeOptionsForm = function(optionsForm) {
	if (!optionsForm) return;
	optionsForm.schema 	= optionsForm.schema || {};
	optionsForm.form	= optionsForm.form	|| [];


	this.optionsForm.sechema 	= this.optionsForm.schema || {};
	this.optionsForm.form 		= this.optionsForm.form || {};

	var exists = [];
	
	for (var schKey in optionsForm.schema) {
		var thisSchema = optionsForm.schema[schKey];
		if (this.optionsForm.sechema[schKey]) exists.push(schKey);
		this.optionsForm.sechema[schKey] = thisSchema;
	}

	for (var fldId=0; fldId<this.optionsForm.form.length; fldId++) {
		var fldKey = this.optionsForm.form[fldId].key;
		if (!fldKey) continue;
		if (exists.includes(fldKey) == false) continue;

		// remove the key from template
		this.optionsForm.form.splice(fldId, 1);
	}

	this.optionsForm.form = optionsForm.form.concat(this.optionsForm.form);
}


TranslatorEngine.num2Str = function(num) {
	//static method
	var n=["o", "i", "u", "e", "a", "x", "y", "z", "v", "l"];
	var ls = num+"".split("");
	var result = "";
	for (var i=0; i<ls.length; i++) {
		result += n[ls[i]];
	}
	return result;
}

TranslatorEngine.prototype.str2Num = function(num) {
	var n={
	"o":0,
	"i":1,
	"u":2,
	"e":3,
	"a":4,
	"x":5,
	"y":6,
	"z":7,
	"v":8,
	"l":9,
	}
	var ls = num+"".split("");
	var result = "";
	for (var i=0; i<ls.length; i++) {
		//if (typeof n[ls[i]] == 'undefined') return false;
		result += n[ls[i]];
	}
	return result;
}

TranslatorEngine.prototype.restorer = function() {
	var filler = "exy";
	var separator = "q";
	/*
	if (str2Num(arguments[4]) == false) {
		return arguments[0];
	}
	*/
	var incomingBuffer = arguments[0].split('Q');
	if (incomingBuffer.length > 2) {
		var result = "";
		for (var i=1; i<incomingBuffer.length; i++) {
			result += this.unescapeCharacter("Q"+incomingBuffer[i]);
		}
		return result;
	}
	return "\\"+arguments[2]+"["+this.str2Num(arguments[4])+"]";
	//return arguments[1]+filler+separator+num2Str(arguments[2])+separator;
}

TranslatorEngine.prototype.replacer = function(match, p1, p2, p3, offset, string) {
	var filler = "exy";
	var separator = "q";
	return "Q"+arguments[1]+filler+"d"+TranslatorEngine.num2Str(arguments[2])+"f";
}

TranslatorEngine.prototype.restorerS = function() {
	var filler = "exz";
	var separator = "q";
	//console.log(arguments);
	var incomingBuffer = arguments[0].split('Q');
	if (incomingBuffer.length > 2) {
		var result = "";
		for (var i=1; i<incomingBuffer.length; i++) {
			result += this.unescapeCharacter("Q"+incomingBuffer[i]);
		}
		return result;
	}		
	return "\\"+arguments[2]+"<"+arguments[4]+">";
	//return arguments[1]+filler+separator+num2Str(arguments[2])+separator;
}

TranslatorEngine.prototype.replacerS = function(match, p1, p2, p3, offset, string) {
	var filler = "exz";
	var separator = "q";

	//console.log(arguments);
	return "Q"+arguments[1]+filler+"d"+arguments[2]+"f";
}


TranslatorEngine.prototype.unescapeCharacter = function(sentence) {
	var current = this;
	if (!sentence) return "";
		//sentence = sentence.replace(/(.)(ely)\s*(\d+)\s*(\*)/g, "\\$1[$3]");
		//sentence = sentence.replace(/(Q)(\w+)(exyd)(\w+)(f)/g, this.restorer);
		sentence = sentence.replace(/(Q)(\w+)(exyd)(\w+)(f)/g, function() {
			return current.restorer.apply(current, arguments)
		});
		// yanfly
		//sentence = sentence.replace(/(Q)(\w+)(exzd)(\w+)(f)/g, this.restorerS);
		sentence = sentence.replace(/(Q)(\w+)(exzd)(\w+)(f)/g, function() {
			return current.restorerS.apply(current, arguments)
		});
	
	return sentence;
}

TranslatorEngine.prototype.escapeCharacter = function(sentence) {
	if (!sentence) return "";
		//sentence = sentence.replace(/\\(.)\[(\d+)\]/g, "$1ely$2*");
		sentence = sentence.replace(/\\(\w+)\[(\d+)\]/g, this.replacer);
		//yanfly's \xyz<text> format
		sentence = sentence.replace(/\\(\w+)\<(\w+)\>/g, this.replacerS);
	return sentence;
}

TranslatorEngine.prototype.fixTranslationFormatting = function(string) {
	//string = string.replace(/\s+(?=[^\\\]]*\])/g, "");
	//string = string.replace(/\\\s*(\w+)\s*\[\s*(\w+)\s*\]/g, "\\$1[$2]");
	//string = string.replace(/\\\s*(\w+)\s*\<\s*(\w+)\s*\>/g, "\\$1[$2]");
	string = string.replace(/\\\s*(\w+)\s*\[\s*(.*?)\s*\]/g, "\\$1[$2]");
	string = string.replace(/\\\s*(\w+)\s*\<\s*(.*?)\s*\>/g, "\\$1[$2]");
   
	string = string.replace(/\\\s*(\w+)/, "\\$1");
	string = string.replace(/\\\s*([\{\}\\\$\.\|\!\>\<\^])/, "\\$1")   
   
	// replacing pattern % 1
	string = string.replace(/\%\s*(\d+)/g, "%$1");

	//string = str_ireplace("\\\\ ", "\\\\`", string);
	//string = str_ireplace("\\ ", "\\", string);
	//string = str_ireplace("\\\\`", "\\\\ ", string);

	return string;
}


/**
 * @typedef TranslationResult
 * @type {Object} 
 * @property {String[]} source - Source texts 
 * @property {String[]} translation - Translation results
 * @property {String} sourceText - Translation result in plain text format
 * @property {String} translationText - Translation result in plain text format
 */

/**
 * Method to translate text(s)
 * This function is to be replaced with a handler for each translator end point/apps.
 * @param {String|String[]} text - Text(s) to translate
 * @param {Object} [options={}] - Options
 * @param {String} [options.sl=trans.getSl()] - Source language.
 * @param {String} [options.tl=trans.getTl()] - Target language.
 * @param {Function} [options.onAfterLoading] - Callback after process is success.
 * @param {Function} [options.onError] - Callback when process is error.
 * @param {Function} [options.always] - Callback after process is completed.
 * @param {Object} [options] - Options
 * @returns {Promise<TranslationResult>} 
 * @example <caption>Translation with `await` call</caption>
 * var result = await trans.getTranslatorEngine("deepl").translate(["こんにちは"])
 * console.log(result.translation);
 * // prints an array: ["Hello. - Hello."]
 * 
 * @example <caption>Use array to perform batch translation</caption>
 * var result = await trans.getTranslatorEngine("sugoitrans").translate(["こんにちは", "こんばんは。"], {sl:"ja", tl:"en"})
 */
TranslatorEngine.prototype.translate = async function(text, options={}) {
	//overwrite this function
	options = options||{};
	try {
		var savedSL = trans.getSl();
		var savedTL = trans.getTl();
	} catch(e) {
		var savedSL = undefined;
		var savedTL = undefined;
	}
	options.sl = options.sl||savedSL||'ja';
	options.tl = options.tl||savedTL||'en';
	options.onAfterLoading = options.onAfterLoading||function() {};
	options.onError = options.onError||function() {};
	options.always = options.always||function() {};
	
}

TranslatorEngine.prototype.save = function() {
	// save options
	if (typeof sys !== 'undefined') {
		var thisSys = sys;
	} else if (typeof window.opener.sys !== 'undefined') {
		var thisSys = window.opener.sys;
	} else {
		var thisSys = window.top.sys;
	}
	
	thisSys.saveConfig();
	
}

/**
 * Update a configuration and store it to the system.
 * The value will be saved and remembered when the system is saved.
 * @param {String} key - Key of the key-value pair
 * @param {*} value - Value of the key-value pair 
 */
TranslatorEngine.prototype.update = function(key, value) {
	if (typeof key == 'undefined') return false;
	if (key == '') return false;
	this[key] = value;
	
	if (typeof sys !== 'undefined') {
		var thisSys = sys;
	} else if (typeof window.opener.sys !== 'undefined') {
		var thisSys = window.opener.sys;
	} else {
		var thisSys = window.top.sys;
	}
	
	thisSys.config.translatorEngineOptions = thisSys.config.translatorEngineOptions||{};
	thisSys.config.translatorEngineOptions[this.id] = thisSys.config.translatorEngineOptions[this.id]||{};
	thisSys.config.translatorEngineOptions[this.id][key] = value;
	this.trigger("update", {
		key		:key,
		value	:value
	});
	this.save();
}

/**
 * Get option from this translator engine.
 * @param {*} key - Key of the object
 * @returns {*} Value of the retreived data
 */
TranslatorEngine.prototype.getOptions = function(key) {
	if (typeof sys !== 'undefined') {
		var thisSys = sys;
	} else if (typeof window.opener.sys !== 'undefined') {
		var thisSys = window.opener.sys;
	} else {
		var thisSys = window.top.sys;
	}
	
	thisSys.config.translatorEngineOptions = thisSys.config.translatorEngineOptions||{};
	thisSys.config.translatorEngineOptions[this.id] = thisSys.config.translatorEngineOptions[this.id]||this.defaultConfig||{};
	
	if (!key) return thisSys.config.translatorEngineOptions[this.id] ?? this.defaultConfig;
	
	return thisSys.config.translatorEngineOptions[this.id][key] ?? this.defaultConfig?.[key] ?? this[key];
}

TranslatorEngine.prototype.loadOptions = async function() {
	var thisTranslator = this;

	return new Promise((resolve, reject) => {
		try {
			if (typeof sys !== 'undefined') {
				var thisSys = sys;
			} else if (typeof window.opener.sys !== 'undefined') {
				var thisSys = window.opener.sys;
			} else {
				var thisSys = window.top.sys;
			}
		} catch (e) {
			return false;
		}
	
	
		thisSys.onReady(function() {
			thisSys.config.translatorEngineOptions = thisSys.config.translatorEngineOptions||{};
			thisSys.config.translatorEngineOptions[thisTranslator.id] = thisSys.config.translatorEngineOptions[thisTranslator.id]||{};
			console.log("sys for : "+thisTranslator.id);
			console.log("Loaded config : ", thisSys.config.translatorEngineOptions[thisTranslator.id]);
	
			for (var key in thisSys.config.translatorEngineOptions[thisTranslator.id]) {
				console.log("assigning "+key+" with value: "+thisSys.config.translatorEngineOptions[thisTranslator.id][key]);
				thisTranslator[key] = thisSys.config.translatorEngineOptions[thisTranslator.id][key];
			}
			resolve();	
		})	
	})
	

}

TranslatorEngine.prototype.escapeLineBreak = function(text) {
	// two level linebreak escaping before translation
	if (typeof text == "string") {
		text = str_ireplace($DV.config.lineSeparator, this.lineSubstitute, text);
	}
	
	if (Array.isArray(text)) {
		var newText = [];
		for (var i=0; i<text.length; i++) {
			newText.push(str_ireplace($DV.config.lineSeparator, this.lineSubstitute, text[i]));
		}
		text = newText;
		text = text.join($DV.config.lineSeparator);
	}
	return text;
}

TranslatorEngine.prototype.restoreLineBreak = function(text) {
	// restore line break to it's original place after translation
	if (typeof text == "string") {
		text = str_ireplace(this.lineSubstitute, $DV.config.lineSeparator, text);
	}
	
	if (Array.isArray(text)) {
		var newText = [];
		for (var i=0; i<text.length; i++) {
			newText.push(str_ireplace(this.lineSubstitute, $DV.config.lineSeparator, text[i]));
		}
		text = newText;
		text = text.join($DV.config.lineSeparator);
	}
	return text;	
}

/**
 * Pre process text(s) before sending to translator
 * @param {String|String[]} text - Text or array of text
 * @param {Object} [options] 
 * @returns {Object} Text ready to be sent to tranlator engine
 */
TranslatorEngine.prototype.preProcessText = function(text, options) {
	// before sending to translator
	var thisTranslator = this;

    options = options||{};
	thisTranslator.escapeAlgorithm = thisTranslator.escapeAlgorithm || "agressiveSplitting";;
	console.log("preProcessText: ");
	console.log(text);
    // try to load saved configuration
    try {
        var savedSL = trans.getSl();
        var savedTL = trans.getTl();
    } catch(e) {
        var savedSL = undefined;
        var savedTL = undefined;
    }
    options.sl = options.sl||savedSL||'ja';
    options.tl = options.tl||savedTL||'en';
   
	
	var lineSubstitute = thisTranslator.getOptions("lineSubstitute");

	var result = {
		originalText:text
	}
	
	console.log("Escape algorithm : "+thisTranslator.escapeAlgorithm);
	console.log("source language : "+options.sl);


    if (thisTranslator.escapeAlgorithm == 'agressiveSplitting' && options.sl == "ja") {
		result.mode = "agressiveSplitting";
		console.log("processing with escape algorithm : "+result.mode);
		
		let tStrings = [];
		let dict = new TranslationDictionary();
		
        if (typeof text == "string") {
            text = [text]
        } else if (!Array.isArray(text)) {
            console.warn("Invalid text translation requested.", text);
            return text;
        }
       
       
        for (let i = 0; i < text.length; i++) {
            let tString = new TranslationString(text[i]);
            tStrings.push(tString);
            tString.addTranslatables(dict);
        }
       
        var newText = [];
        text = dict.symbols;
        for (var i=0; i<text.length; i++) {
            newText.push(str_ireplace(thisTranslator.delimiter, lineSubstitute, text[i]));
        }
        text = newText;
        text = text.join(thisTranslator.delimiter);
		result.dict = dict;
		result.stringCollection = tStrings;
		
		
    } else if (thisTranslator.escapeAlgorithm == 'none') {
		// do nothing
    } else if (thisTranslator.escapeAlgorithm == 'hexPlaceholder') {
		if (typeof text == "string") {
			text = str_ireplace($DV.config.lineSeparator, lineSubstitute, text);
		}
		
		if (Array.isArray(text)) {
			var newText = [];
			for (var i=0; i<text.length; i++) {
				newText.push(str_ireplace($DV.config.lineSeparator, lineSubstitute, text[i]));
			}
			text = newText;
			text = text.join($DV.config.lineSeparator);
		}		
		
		console.log("processing hexPlaceholder");
		result.sourceText 		= text;
		result.hexPlaceholder 	= new HexPlaceholder(text);
		result.text = text 		= result.hexPlaceholder.escape();
		result.textArray 		= result.text.split($DV.config.lineSeparator);
    } else if (thisTranslator.escapeAlgorithm == 'JSTemplateCloaking') {
		if (typeof text == "string") text = [text];
		
		var lineSubstituteEscape = String.fromCharCode(0xE000, 190, 0xE001)
		if (Array.isArray(text)) {
			var newText = [];
			for (var i=0; i<text.length; i++) {
				console.log("--handling ", text[i]);
				newText.push(text[i].replaceAll($DV.config.lineSeparator, lineSubstituteEscape));
			}
			console.log("--newtext ", newText);
			text = newText;
			text = text.join($DV.config.lineSeparator);
		}		
		
		console.log("processing JSTemplateCloaking");
		result.sourceText 		= text;
		result.replacer 		= new JSTemplateCloaking(text);
		result.hexPlaceholder 	= result.replacer;
		var pText 		= (result.replacer.escape()).replaceAll(lineSubstituteEscape, lineSubstitute);
		var nText		= ("var msg = "+JSON.stringify(pText.split($DV.config.lineSeparator), undefined, 2));
		nText = nText.replaceAll("`", "\\`");
		nText = nText.replace(`[\n  "`, "[\n  `");
		nText = nText.replace(`"\n]`, "`\n]");
		nText = nText.replaceAll(`",\n  "`, "`,\n  `");

		result.text = text 		= nText
		result.textArray 		= result.text.split($DV.config.lineSeparator);
    } else if (thisTranslator.escapeAlgorithm == 'htmlCloaking') {
		if (typeof text == "string") {
			text = str_ireplace($DV.config.lineSeparator, lineSubstitute, text);
		}
		
		if (Array.isArray(text)) {
			var newText = [];
			for (var i=0; i<text.length; i++) {
				newText.push(str_ireplace($DV.config.lineSeparator, lineSubstitute, text[i]));
			}
			text = newText;
			text = text.join($DV.config.lineSeparator);
		}		
		
		console.log("processing HTMLCloaking");
		result.sourceText 		= text;
		result.htmlCloaking 	= new HTMLCloaking(text);
		result.hexPlaceholder 	= result.htmlCloaking;
		result.text = text 		= result.htmlCloaking.escape();
		result.textArray 		= result.text.split($DV.config.lineSeparator);

    } else if (thisTranslator.escapeAlgorithm == 'xmlCloaking') {
		if (typeof text == "string") {
			text = str_ireplace($DV.config.lineSeparator, lineSubstitute, text);
		}
		
		if (Array.isArray(text)) {
			var newText = [];
			for (var i=0; i<text.length; i++) {
				newText.push(str_ireplace($DV.config.lineSeparator, lineSubstitute, text[i]));
			}
			text = newText;
			text = text.join($DV.config.lineSeparator);
		}		
		
		console.log("processing XMLCloaking");
		result.sourceText 		= text;
		result.xmlCloaking 	= new XMLCloaking(text);
		result.hexPlaceholder 	= result.xmlCloaking;
		result.text = text 		= result.xmlCloaking.escape();
		result.textArray 		= result.text.split($DV.config.lineSeparator);


    } else {
		result.mode = "meaninglessWord";
		console.log("processing with escape algorithm : "+result.mode);
		console.log("original text : ", text);
        if (typeof text == "string") {
            text = str_ireplace(thisTranslator.delimiter, lineSubstitute, text);
        }
       
        if (Array.isArray(text)) {
            var newText = [];
            for (var i=0; i<text.length; i++) {
                newText.push(str_ireplace(thisTranslator.delimiter, lineSubstitute, text[i]));
            }
            text = newText;
            text = text.join(thisTranslator.delimiter);
        }
		text = thisTranslator.escapeCharacter(text);
		console.log("result of escaping codes");
		console.log(text);
		result.textArray = text.split(thisTranslator.delimiter);
		
    }

	// not done yet
	result.text = text||result.originalText||"";
	return result;
}

TranslatorEngine.translators = {};

TranslatorEngine.prototype.init = async function(e) {
	console.log("initializing translator engine : "+this.id);
	if (this.isInitialized) return true;
	trans.translator = trans.translator||[];
	trans.translator.push(this.id);
	TranslatorEngine.translators[this.id] =  this;
	await this.loadOptions();
	console.log("after translator engine initialized");
	this.isInitialized = true;
	this.trigger("init", this);
}


// Additional classes
// Contributed by Vellithe

// A part of a sentence, either a line or an important part, a Symbol
class TranslationSymbol {
    constructor (string, translatable) {
        this.originalString = string.trim();
        this.translatable = translatable !== false;
    }
}
 
// A full sentence
class TranslationString {
    constructor (string) {
	
        this.originalString = string;
        this.symbols = [];
		let trimmed = string.trim();
		this.possibleScript = ['"', "'"].includes(trimmed.charAt(0)) && trimmed.charAt(trimmed.length - 1) == trimmed.charAt(0);
       
        // Skip anything that's not japanese
        // Split anything betweeen ()[]""
        // Split on .
        // Maybe keep Full-width as is? They look cool and might carry some special meaning
        let japRegex = new RegExp(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/);
                                  //-------------_____________-------------_____________-------------_____________
                                  // Punctuation   Hiragana     Katakana    Full-width       CJK      CJK Ext. A
         
        let separators = "\.!?！？。\\…〚〘〖【《〈｛［〔（『[{(「〛〙〗】》〉｝］〕）』]})」'\"".split("");
        let includables = "!?！？。…".split("");
       
        this.currentSymbol = "";
       
        this.translatable = false;
        for (let i = 0; i < string.length; i++) {
            let cChar = string.charAt(i);
            let isJap = japRegex.test(cChar);
            if (separators.indexOf(cChar) != -1) {
                if (includables.indexOf(cChar) != -1) {
                    this.currentSymbol += cChar;
                    this.createSymbol();
                } else {
                    this.createSymbol();
                    this.currentSymbol = cChar;
                    this.translatable = isJap;
                    this.createSymbol();
                }
                continue;
            }
            if (isJap != this.translatable) {
                this.createSymbol();
                this.translatable = isJap;
            }
            this.currentSymbol += cChar;
        }
        this.createSymbol();
    }
   
    createSymbol () {
        let trimmed = this.currentSymbol.trim();
        this.symbols.push(new TranslationSymbol(this.currentSymbol, this.translatable && trimmed.length > 0));
        this.currentSymbol = "";
        this.translatable = false;
    }
   
    getSymbols () {
        return this.symbols;
    }
   
    getTranslatedString (dict) {
        let text = [];
        for (let i = 0; i < this.symbols.length; i++) {
            let symbol = this.symbols[i];
            if (symbol.translatable) {
				text.push(" ");
                text.push(dict.getTranslation(symbol.originalString));
            } else {
                text.push(symbol.originalString);
            }
        }
        text = text.join("").replace(/\s\s+/g, ' ').trim();
		/*
		if (this.possibleScript) {
					// make sure interior quotes don't break the script
					text = JSON.stringify(text.substr(1, text.length - 2));
		}
		// This is bad. Or rather, it makes sure the string will work later, but if the string had something like "\n" in it, then it'll show up as "\n" later, and we don't want that
		*/
		if (this.possibleScript) {
					// make sure interior quotes don't break the script
					let quoteType = text.charAt(0);
					text = text.substr(1, text.length - 2).trim();
					text = quoteType + text.split(quoteType).join("\\" + quoteType) + quoteType;
		}
		/**! This is good! The inner text is kept as-is, but we still act careful around the quotes **/		
		
		return text;
    }
   
    addTranslatables (dict) {
        for (let i = 0; i < this.symbols.length; i++) {
            dict.addSymbol(this.symbols[i]);
        }
    }
}
 
// A dictionary to hold translation symbols and translate them without translating twice
class TranslationDictionary {
    constructor () {
        this.symbols = [];
        this.translation = [];
    }
   
    addSymbol (symbol) {
        if (symbol.translatable && this.symbols.indexOf(symbol.originalString) == -1) {
            this.symbols.push(symbol.originalString);
            this.translation.push(symbol.originalString);
        }
    }
   
    getTranslatableArray () {
        return this.symbols;
    }
   
    addTranslation (originalString, translation) {
        this.translation[this.symbols.indexOf(originalString)] = translation;
    }
   
    addIndexedTranslation (index, translation) {
        this.translation[index] = translation;
    }
   
    getTranslation (string) {
        let trans = this.translation[this.symbols.indexOf(string)];
        if (trans == undefined || trans == null || trans.length == 0) {
            return string.replace(/(\r\n|\n|\r)/gm, "");
        }
        return trans;
    }
}



// Hex Placeholder
class CodeEscape {
	constructor(text)  {
		this.text = text;
		this.placeHolders = [];
		this.hexPadding = "0xF";
		this.escaped;
		this.formulas = CodeEscape.getActiveFormulas();
		this.unescapePattern = /0xF[\dA-F]{4}/g
		this.onRestore = function(text) {
			return text
		};
	}
}

CodeEscape.defaultFormulas = [
//	/\\(\S+)\[.*\]/gi, // standard tag (accept unicode)
//	/\\(\S+)\<.*\>/gi, // Yanfly's Message core tag (accept unicode)
	/(if|en)\([\w \=\[\]\&<\>\|\.\$\_\+\-\*\/\@\!]+\)/g, //MPP_ChoiceEX
	/(\\[a-zA-Z0-9]+\[.*?\])+/gi, // standard tag (alphabet only)
	/(\\[a-zA-Z0-9]+<.*?\>)+/gi, // Yanfly's Message core tag (alphabet only)
//	/\\([a-zA-Z\{\}\\\$\.\|\!\>\<\^])/g
	/(\\[a-zA-Z\{\}\\\$\.\|\!\><\^])+/g, // standard rpg maker tags
	/(\@[0-9]+)+/g, 	//@ command for wolfRpg	
	/\%[1-9]+/g,
	function(currentText) { 
		return ["string to escape", "string to escape 2"] 
	},
	JSON.stringify("literal string")
]

CodeEscape.renderedFormulas = [];

CodeEscape.parseStringTemplate = function(value) {
	value = value || sys.config.escaperString;
	if (value.substr(0,1) !== "") value = `[${value}]`;
	try {
		return eval(value)
	} catch (e) {
		console.warn(e);
		throw e.toString();
	}
}

CodeEscape.renderedFormulaToStrings = function(rendered) {
	rendered = rendered || [];
	var result = [];
	for (var i in rendered) {
		if (rendered[i] instanceof RegExp) {
			result.push(rendered[i].toString())
		} else if (typeof rendered[i] == 'function') {
			result.push(rendered[i].toString())
		} else if (typeof rendered[i] == 'string') {
			result.push(JSON.stringify(rendered[i]));
		}
	}

	return result;
}

CodeEscape.joinRenderedFormula = function(rendered) {
	var results = CodeEscape.renderedFormulaToStrings(rendered);
	return results.join(",\n");
}

CodeEscape.resetConfig = async function() {
	sys.config.escaperPatterns = [];
	await sys.saveConfig()
}

CodeEscape.initDefaultPattern = function(force) {
	sys.config.escaperPatterns = [];
	if (!force) if (sys.config.escaperPatterns.length > 0) return;
	for (var i in CodeEscape.defaultFormulas) {
		sys.config.escaperPatterns.push({
			value:CodeEscape.defaultFormulas[i].toString()
		})
	}
}

CodeEscape.initPattern = function(force) {
	sys.config.escaperPatterns = sys.config.escaperPatterns || [];
	if (!force) if (sys.config.escaperPatterns.length > 0) return;
	for (var i in CodeEscape.defaultFormulas) {
		sys.config.escaperPatterns.push({
			value:CodeEscape.defaultFormulas[i].toString()
		})
	}
}

CodeEscape.renderFunction = function(string) {
	try {
		var func = eval("["+string+"]");
		return func[0];
	} catch (e) {
		console.log("Error rendering function", e);
		return false;
	}
}

CodeEscape.setActiveFormulas = function(formulas) {
	CodeEscape.renderedFormulas = formulas;
	return CodeEscape.renderedFormulas;
}

CodeEscape.getActiveFormulas = function() {
	if (CodeEscape.renderedFormulas.length == 0) {
		sys.config.escaperPatterns = sys.config.escaperPatterns || [];
		for (var i in sys.config.escaperPatterns) {
			//console.log(`handling ${i}`, sys.config.escaperPatterns[i]);
			if (typeof sys.config.escaperPatterns[i] !== "object") continue;
			if (!sys.config.escaperPatterns[i].value) continue;
			var newReg = "";
			try {
				//console.log(sys.config.escaperPatterns[i].value);
				if (common.isRegExp(sys.config.escaperPatterns[i].value)) {
					//console.log("is regex");
					newReg = common.evalRegExpStr(sys.config.escaperPatterns[i].value);
				} else if (common.isStringFunction(sys.config.escaperPatterns[i].value)) {
					//console.log("pattern ", i, "is function");
					newReg = CodeEscape.renderFunction(sys.config.escaperPatterns[i].value);
				} else {
					//console.log("Is string");
					newReg = JSON.parse(sys.config.escaperPatterns[i].value);
				}
			} catch (e){
				console.warn("Trying to render ", sys.config.escaperPatterns[i], e);
			}
			if (newReg) CodeEscape.renderedFormulas.push(newReg);
		}
	}
	return CodeEscape.renderedFormulas;
}

CodeEscape.prototype.generatePlaceholderId = function(number) {
  if (number < 0) {
    number = 0xFFFFFFFF + number + 1;
  }
  var placeholder = number.toString(16).toUpperCase();
 // console.log("generating PlaceholderID ", placeholder, this.hexPadding+placeholder.padStart(3, '0'));
  return this.hexPadding+placeholder.padStart(4, '0');
}

CodeEscape.prototype.getPlaceholder = function(stringKey) {
	var strippedKey = stringKey.substr(this.hexPadding.length);
	var index = parseInt(strippedKey, 16); // key is Hexadecimal
	//console.log("strippedKey is", strippedKey);
	//console.log("index is", index);
	//if (typeof this.placeHolders[index] == 'undefined') return stringKey;
	if (typeof this.placeHolders[index] == 'undefined') {
		if (/0xF[\dA-F]{4}/g.test(stringKey)) return "0x?" + stringKey.substring(3);
		return stringKey;
	}
	//console.log("Restoring from placeholder : ", stringKey);
	//console.log("placeholder is :", this.placeHolders);
	//console.log("parsed index : ", index);
	//console.log("result:", this.placeHolders[index]);
	return this.placeHolders[index];
}

/**
 * Function to handle each of matched string
 * @param {String} string - Matched string
 * @returns {String} Replacement
 */
CodeEscape.prototype.processMatchRule = function(match) {
	var lastIndex = this.placeHolders.push(match)-1;
	return this.generatePlaceholderId(lastIndex);
}

CodeEscape.prototype.escape = function(text) {
	text = text || this.text;
	//console.log("Formulas : ", this.formulas);
	for (var i=0; i<this.formulas.length; i++) {
		if (!Boolean(this.formulas[i])) continue;
		
		/**
		 * Function should return a string or Array of strings
		 */
		if (typeof this.formulas[i] == 'function') {
			//console.log(`formula ${i} is a function`);
			var arrayStrings = this.formulas[i].call(this, text);
			//console.log(`result`, arrayStrings);
			if (typeof arrayStrings == 'string') arrayStrings = [arrayStrings];
			if (Array.isArray(arrayStrings) == false) continue;

			for (var x in arrayStrings) {
				text = text.replaceAll(arrayStrings[x], (match) => {
					//var lastIndex = this.placeHolders.push(match)-1;
					//return this.generatePlaceholderId(lastIndex);
					return this.processMatchRule(match);
				});				
			}
			continue;
		}
		
		//console.log("replacing....");
		text = text.replaceAll(this.formulas[i], (match) => {
			//var lastIndex = this.placeHolders.push(match)-1;
			//return this.generatePlaceholderId(lastIndex);
			return this.processMatchRule(match);
		});
	}
	
	this.escaped = text;
	//console.log("%cEscaped text", 'background: #222; color: #bada55');
	//console.log(text);
	return text;
}


CodeEscape.prototype.unescape = function(text) {
	text = text || this.text;
	var that = this;
	
	var processText = (text)=>{
		text = text.replace(that.unescapePattern, function(match) {
			var restored = that.getPlaceholder.apply(that, arguments) || ""
			//console.log("%cRestored text : ", 'background: #222; color: #bada55');
			//console.log(restored);
			if (restored.match(that.unescapePattern)) {
				// recursive value
				return that.restore(restored);
			}
			return restored;
		});

		if (typeof this.onRestore == "function") {
			return this.onRestore(text);
		} else {
			return text;
		}
	}

	if (Array.isArray(text)) {
		var result = [];
		for (var i in text) {
			result.push(processText(text[i]))
		}
		return result;
	}

	return processText(text);

}
CodeEscape.prototype.restore = CodeEscape.prototype.unescape
window.HexPlaceholder = CodeEscape;


class HTMLCloaking extends CodeEscape {
	constructor(text, options)  {
		super(text);
		options = options || {}
		this.text = text;
		this.placeholders = options.placeholders||{};
		this.unescapePattern = /<hr id="([\d]+)">/g;
		this.currentPlaceholderId = 0;
	}
}

HTMLCloaking.prototype.generatePlaceholder = function(match) {
	console.log("generating placeholder", match)
	this.currentPlaceholderId++;
	this.placeholders[this.currentPlaceholderId] = match;
	return this.currentPlaceholderId;
}

HTMLCloaking.prototype.getPlaceholder = function(match, index) {
	console.log("Get placeholder of", match)
    var result =  this.placeholders[index]
    delete this.placeholders[index];
    return result;
}

HTMLCloaking.prototype.processMatchRule = function(match) {
	var thisPlaceHolder = this.generatePlaceholder(match);
	return `<hr id="${thisPlaceHolder}">`;
}


class XMLCloaking extends CodeEscape {
	constructor(text, options)  {
		super(text);
		options = options || {}
		this.text = text;
		this.placeholders = options.placeholders||{};
		this.unescapePattern = /<hr id="([\d]+)" \/>/g;
		this.currentPlaceholderId = 0;
	}
}

XMLCloaking.prototype.generatePlaceholder = function(match) {
	//console.log("generating placeholder", match)
	this.currentPlaceholderId++;
	this.placeholders[this.currentPlaceholderId] = match;
	return this.currentPlaceholderId;
}

XMLCloaking.prototype.getPlaceholder = function(match, index) {
	console.log("Get placeholder of", match)
    var result =  this.placeholders[index]
    delete this.placeholders[index];
    return result;
}

XMLCloaking.prototype.processMatchRule = function(match) {
	var thisPlaceHolder = this.generatePlaceholder(match);
	return `<hr id="${thisPlaceHolder}" />`;
}



class JSTemplateCloaking extends CodeEscape {
	constructor(text, options)  {
		super(text);
		options = options || {}
		this.text = text;
		this.placeholders = options.placeholders||{};
		this.unescapePattern = /\${dat\[(\d+)\]}/g;
		this.currentPlaceholderId = 0;
	}
}

JSTemplateCloaking.prototype.generatePlaceholder = function(match) {
	//console.log("generating placeholder", match)
	this.currentPlaceholderId++;
	this.placeholders[this.currentPlaceholderId] = match;
	return this.currentPlaceholderId;
}

JSTemplateCloaking.prototype.getPlaceholder = function(match, index) {
	console.log("Get placeholder of", match)
    var result =  this.placeholders[index]
    delete this.placeholders[index];
    return result;
}

JSTemplateCloaking.prototype.processMatchRule = function(match) {
	var thisPlaceHolder = this.generatePlaceholder(match);
	return "${dat["+thisPlaceHolder+"]}";
}

JSTemplateCloaking.prototype.restore = function(text) {
	try {
		var that = this;
		var result = function() {
			// trying to fix the problem
			text = text.trim();
			if (text.substr(0, text.length-1) == "`" || text.substr(0, text.length-2) == "`,") {
				text = text+"]";
			}

			var dat = that.placeholders;
			eval(text);
			if (!msg) return "";
			return msg.join($DV.config.lineSeparator);
		}();
		return result;
	} catch (e) {
		console.error("Unable to restore text with error:",e)
	}
}


class SubstituteNumber extends CodeEscape {
	constructor(text, options)  {
		super(text);
		options = options || {}
		this.text = text;
		this.placeholders = options.placeholders||{};
		this.placeholderLength = options.placeholderLength || 5;
	}
}

SubstituteNumber.prototype.generatePlaceholder = function() {
	this.placeholderLength = this.placeholderLength || 5;
	var innerLen        = this.placeholderLength-2;
	var result          = '';
	const characters    = '012345678';
	const bounday		= '9';
	var charactersLength = characters.length;
	for ( var i = 0; i < innerLen; i++ ) {
	  result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return bounday+result+bounday;
}

SubstituteNumber.prototype.getPlaceholder = function(match) {
    var result =  this.placeholders[match]
    delete this.placeholders[match];
    return result;
}

SubstituteNumber.prototype.getFirstPlaceholder = function() {
    if (empty(this.placeholders)) return "";
    for (var i in this.placeholders) {
        console.log(JSON.stringify(this.placeholders, undefined, 2));
        var result = this.placeholders[i]
        delete this.placeholders[i]
        console.log(JSON.stringify(this.placeholders, undefined, 2));
        console.log("first placeholder:", result);
        return result
    }
    return ""
}

SubstituteNumber.prototype.processMatchRule = function(match) {
	var thisPlaceHolder = this.generatePlaceholder();
	this.placeholders[thisPlaceHolder] = match;
	return thisPlaceHolder;
}

SubstituteNumber.prototype.unescape = function(text) {
    console.log("unescaping", text);
	var processText = (text)=>{
	text = text.replace(/9[0-8]{5}9/g, (match) => {
			var restored = this.getPlaceholder(match)
			if (!restored) return "";
			if (restored.match(/9[0-8]{5}9/g)) {
				// recursive value
				return processText(restored);
			}
			return restored;
		});
		if (typeof this.onRestore == "function") {
			return this.onRestore(text);
		} else {
			return text;
		}
	}
	
	var text = processText(text);
	// looking for the rest
	if (Object.keys(this.placeholders).length > 0) {
	    console.log("correcting");
	    text = text.replaceAll(/9[0-8 .,]+9/g, (match)=>{
	        var placeHolder = this.getFirstPlaceholder();
	        if (!placeHolder) return match;
	        return placeHolder;
	    })
	}

	// cleanup the missing parts
	text = text.replaceAll(/[0-9]+/g, (match)=>{
		if (!common.hasNumber(this.text)) return ""; // original text doesn't include any number
		if (match.length <= 2) return match;
		if (match.includes("000")) return match;
		if (match.includes("00")) return match;

		// the number is found on the original text
		if (this.text.indexOf(match) !== -1) return match;

		return ""; // remove
	})
	
	return text
}



$(document).ready(function() {
	sys.onReady(function() {
		HexPlaceholder.initPattern();
	});
})
/*
TEST

var hexPlaceholder = new HexPlaceholder(`Hello world\\{\\{
\\some[tag]\\more[tag]here\\d\\{
some text \\test[yoo]
`);
hexPlaceholder.escape()
hexPlaceholder.getPlaceholder('0xFF1');
console.log("Escaped : ")
console.log(hexPlaceholder.escaped);
console.log("restored : ");
console.log(hexPlaceholder.restore( hexPlaceholder.escaped ));


// Test 3
var text = `Hello world\\{\\{
\\some[tag]\\more[tag]here\\d\\{
some text \\test[yoo]
`;
var textObj = trans.chatGPT.preProcessText(text, {});
console.log("Escaped text:", textObj.text)
*/
