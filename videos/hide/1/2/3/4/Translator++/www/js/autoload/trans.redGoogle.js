var trans = trans || {};
trans.redGoogle = {
    id:"redGoogle",
    name:"Red Google",
	version:"0.3",
	author:"Anonymous",
	description:"带有改进算法以转义符号和标记分隔符的公共google API<br />此插件只能用于逐行翻译。",
    isInitialized: false,
    isDisabled:false,
    columnIndex:2,
    columnHeader: "Red Google",
    maxRequestLength : 5000,
    fileListLoaded: false,
    indexIsBuilt: false,
    skipTranslated:false,
    batchDelay:5000,
	targetUrl:"https://translate.google.com/translate_a/single",
    skipTranslatedOnBatch :true, // skip lines that already translated when doing TRANSLATE ALL
    lineSubstitute : '§', //¶
    languages : {
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
    },
	optionsForm:{
	  "schema": {
		"targetURL": {
		  "type": "string",
		  "title": "目标URL",
		  "description": "翻译程序目标URL",
		  "default":"https://translate.google.com/translate_a/single",
		  "required":true
		}
	  },
	  "form": [
		{
		  "key": "targetURL",
		  "onChange": function (evt) {
			var value = $(evt.target).val();
			trans.redGoogle.update("targetUrl", value);
			
		  }
		}
		]
	}
}
 
/*
"https://translate.googleapis.com/translate_a/single?client=gtx&sl="
+ sourceLang + "&tl=" + targetLang + "&dt=t&q=" + encodeURI(sourceText);
*/
trans.redGoogle.onResponse = function(e) {
    console.log(e);
}
 
/*
trans.redGoogle.unescapeCharacter = function(sentence) {
    sentence = sentence||"";
    sentence = sentence.replace(/<hr\s*sub\s*\=\s*\'(.*?)\'\s*id\s*\=\s*\'(.*?)\'\s*\/>/gi, "\\$1[$2]");
   
    return sentence;
}  
trans.redGoogle.escapeCharacter = function(sentence) {
    sentence = sentence||"";
    sentence = sentence.replace(/\\\s*(\w+)\s*\[\s*(.*?)\s*\]/gi, "<hr sub='$1' id='$2' />");
   
    return sentence;
}
 
 
trans.redGoogle.unescapeCharacter = function(sentence) {
    sentence = sentence||"";
    sentence = sentence.replace(/<\s*(.*?)\s*id\s*=\s*'(.*?)'\s*\/\s*>/gi, "\\$1[$2]");
   
    return sentence;
}  
trans.redGoogle.escapeCharacter = function(sentence) {
    sentence = sentence||"";
    sentence = sentence.replace(/\\\s*(\w+)\s*\[\s*(.*?)\s*\]/gi, "<$1 id='$2' />");
   
    return sentence;
}
*/
 
trans.redGoogle.num2Str = function(num) {
    var n=["o", "i", "u", "e", "a", "x", "y", "z", "v", "l"];
    var ls = num+"".split("");
    var result = "";
    for (var i=0; i<ls.length; i++) {
        result += n[ls[i]];
    }
    return result;
}
trans.redGoogle.str2Num = function(num) {
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
 
trans.redGoogle.restorer = function() {
    var filler = "exy";
    var separator = "q";
    //console.log(arguments);
    /*
    if (str2Num(arguments[4]) == false) {
        return arguments[0];
    }
    */
    var incomingBuffer = arguments[0].split('Q');
    if (incomingBuffer.length > 2) {
        var result = "";
        for (var i=1; i<incomingBuffer.length; i++) {
            result += trans.redGoogle.unescapeCharacter("Q"+incomingBuffer[i]);
        }
        return result;
    }
    return "\\"+arguments[2]+"["+trans.redGoogle.str2Num(arguments[4])+"]";
    //return arguments[1]+filler+separator+num2Str(arguments[2])+separator;
}
 
trans.redGoogle.replacer = function(match, p1, p2, p3, offset, string) {
    var filler = "exy";
    var separator = "q";
    return "Q"+arguments[1]+filler+"d"+trans.redGoogle.num2Str(arguments[2])+"f";
}
 
trans.redGoogle.restorerS = function() {
    var filler = "exz";
    var separator = "q";
    //console.log(arguments);
    var incomingBuffer = arguments[0].split('Q');
    if (incomingBuffer.length > 2) {
        var result = "";
        for (var i=1; i<incomingBuffer.length; i++) {
            result += trans.redGoogle.unescapeCharacter("Q"+incomingBuffer[i]);
        }
        return result;
    }      
    return "\\"+arguments[2]+"<"+arguments[4]+">";
    //return arguments[1]+filler+separator+num2Str(arguments[2])+separator;
}
 
trans.redGoogle.replacerS = function(match, p1, p2, p3, offset, string) {
    var filler = "exz";
    var separator = "q";
 
    //console.log(arguments);
    return "Q"+arguments[1]+filler+"d"+arguments[2]+"f";
}
 
 
trans.redGoogle.unescapeCharacter = function(sentence) {
    if (!sentence) return "";
        //sentence = sentence.replace(/(.)(ely)\s*(\d+)\s*(\*)/g, "\\$1[$3]");
        sentence = sentence.replace(/(Q)(\w+)(exyd)(\w+)(f)/g, trans.redGoogle.restorer);
        // yanfly
        sentence = sentence.replace(/(Q)(\w+)(exzd)(\w+)(f)/g, trans.redGoogle.restorerS);
   
    return sentence;
}
 
trans.redGoogle.escapeCharacter = function(sentence) {
    if (!sentence) return "";
        //sentence = sentence.replace(/\\(.)\[(\d+)\]/g, "$1ely$2*");
        sentence = sentence.replace(/\\(\w+)\[(\d+)\]/g, trans.redGoogle.replacer);
        //yanfly's \xyz<text> format
        sentence = sentence.replace(/\\(\w+)\<(\w+)\>/g, trans.redGoogle.replacerS);
    return sentence;
}
 /*
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
		if (this.possibleScript) {
			// make sure interior quotes don't break the script
			text = JSON.stringify(text.substr(1, text.length - 2));
		}
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
 */
trans.redGoogle.translate = function(text, options) {
    if (trans.redGoogle.isDisabled == true) return false;
    if (typeof text=='undefined') return text;
	var thisTranslator = this;
	
    options = options||{};
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
    options.onAfterLoading = options.onAfterLoading||function() {};
    options.onError = options.onError||function() {};
    options.always = options.always||function() {};
 
    options.agressiveSplitting = true;
   
    let tStrings = [];
    let dict = new TranslationDictionary();
 
    if (options.agressiveSplitting && options.sl == "ja") {
        if (typeof text == "string") {
            text = [text]
        } else if (!Array.isArray(text)) {
            console.warn("请求的文本翻译无效。", text);
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
            newText.push(str_ireplace($DV.config.lineSeparator, lineSubstitute, text[i]));
        }
        text = newText;
        text = text.join($DV.config.lineSeparator);
    } else {
   
        var lineSubstitute = trans.redGoogle.lineSubstitute;
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
        // ============================================================
        /*REGEX FOR escape and unescape
        Name :
        "\\N[900]".replace(/\\(.)\[(\d+)\]/, "Nely$2*");
        "Nely900*".replace(/(Nely)\s*(\d+)\s*(\*)/, "\\N[$2]");
 
        ===============================================================
        */
        var num2Str = function(num) {
            var n=["o", "i", "u", "e", "a", "x", "y", "z", "v", "l"];
            var ls = num+"".split("");
            var result = "";
            for (var i=0; i<ls.length; i++) {
                result += n[ls[i]];
            }
            return result;
        }
        var str2Num = function(num) {
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
 
        var restorer = function() {
            var filler = "exy";
            var separator = "q";
            //console.log(arguments);
            /*
            if (str2Num(arguments[4]) == false) {
                return arguments[0];
            }
            */
            return "\\"+arguments[2]+"["+str2Num(arguments[4])+"]";
            //return arguments[1]+filler+separator+num2Str(arguments[2])+separator;
        }
 
        var replacer = function(match, p1, p2, p3, offset, string) {
            var filler = "exy";
            var separator = "q";
            return "Q"+arguments[1]+filler+separator+num2Str(arguments[2])+separator;
        }
 
        var restorerS = function() {
            var filler = "exz";
            var separator = "q";
            //console.log(arguments);
            return "\\"+arguments[2]+"<"+arguments[4]+">";
            //return arguments[1]+filler+separator+num2Str(arguments[2])+separator;
        }
 
        var replacerS = function(match, p1, p2, p3, offset, string) {
            var filler = "exz";
            var separator = "q";
 
            //console.log(arguments);
            return "Q"+arguments[1]+filler+separator+arguments[2]+separator;
        }
       
        /*
        var unescapeCharacter = function(sentence) {
            //str_ireplace(" \\"+"[n]", "\n", sentence);
            //console.log("\n\nunescaping character : \nSource: "+sentence);
            //sentence = str_ireplace( $DV.config.lineBreakSubstitute, "\n", sentence);
           
            if ($DV.config.substituteMarkup == true) {
                //sentence = sentence.replace(/(.)(ely)\s*(\d+)\s*(\*)/g, "\\$1[$3]");
                sentence = sentence.replace(/(Q)(\w+)(exyq)(\w+)(q)/g, restorer);
                // yanfly
                sentence = sentence.replace(/(Q)(\w+)(exzq)(\w+)(q)/g, restorerS);
            }
           
            if ($DV.config.keepContext == false) {
                sentence = sentence.substring(1, sentence.length-1);
            }
           
            return sentence;
        }
 
        var escapeCharacter = function(sentence) {
            //sentence = sentence.replace(/\r?\n/g, " \\"+"[n] ");
            //sentence = sentence.replace(/\r?\n/g, $DV.config.lineBreakSubstitute);
            //sentence = sentence.replace(/'/g, "\\'");
            if ($DV.config.substituteMarkup == true) {
                //sentence = sentence.replace(/\\(.)\[(\d+)\]/g, "$1ely$2*");
                sentence = sentence.replace(/\\(\w+)\[(\d+)\]/g, replacer);
                //yanfly's \xyz<text> format
                sentence = sentence.replace(/\\(\w+)\<(\w+)\>/g, replacerS);
            }
           
            if ($DV.config.keepContext == false) {
                sentence = "'"+sentence+"'";
            }
            return sentence;
        }
        */
 
       
        var fixTranslationFormatting = function(string) {
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
 
    }
 
   
   
   
    console.log("incoming text  : ");
    console.log(text);
    //console.log(escapeCharacter(text));
    //console.log(trans.redGoogle.escapeCharacter(text).length);
   
   
    trans.redGoogle.isTranslating = true;
    $.ajax({
        method: "POST",
        //url: "https://translate.google.com/translate_a/single",
        url: thisTranslator.targetUrl,
        data: {
            client:'gtx',
            sl:options.sl,
            tl:options.tl,
            dt:'t',
            q:trans.redGoogle.escapeCharacter(text)
        }
    })
    .done(function(data) {
        console.log("translating done : ");
        console.log(data);
        /*
        console.log(data[0][0][0]);
        console.log(fixTranslationFormatting(data[0][0][0]));
        console.log(unescapeCharacter(data[0][0][0]));
        */
       
        var result = {
            'sourceText':"",
            'translationText':"",
            'source':[],
            'translation':[]
        };
        for (var i=0; i<data[0].length; i++) {
            result.sourceText += data[0][i][1];
            result.translationText += data[0][i][0];
        }
       
        if (options.agressiveSplitting && options.sl == "ja") {
           
            //let tStrings = [];
            //let dict = new TranslationDictionary();
           
            for (let i = 0; i < data[0].length; i++) {
                dict.addIndexedTranslation(i, data[0][i][0].replace(/\n/ig, ' '));
            }
           
       
            for (let i = 0; i < tStrings.length; i++) {
                result.source.push (tStrings[i].originalString);
                result.translation.push (tStrings[i].getTranslatedString(dict));
            }
        } else {
            result.translationText = fixTranslationFormatting(result.translationText);
            result.translationText = trans.redGoogle.unescapeCharacter(result.translationText);
            result.source = result.sourceText.split($DV.config.lineSeparator);
            result.translation = result.translationText.split($DV.config.lineSeparator);
            // restore escaped line from original text
            var tempArray = [];
            for (var i=0; i<result.source.length; i++) {
                tempArray.push(str_ireplace(lineSubstitute, $DV.config.lineSeparator, result.source[i]))
            }
            result.source = tempArray;
           
            var tempArray = [];
            for (var i=0; i<result.translation.length; i++) {
                tempArray.push(str_ireplace(lineSubstitute, $DV.config.lineSeparator, result.translation[i]))
            }
            result.translation = tempArray;
        }
       
        console.log(result);
        if (typeof options.onAfterLoading == 'function') {
            options.onAfterLoading.call(trans.redGoogle, result, data);
        }
       
        trans.redGoogle.isTranslating = false;
    })
    .always(function() {
        trans.redGoogle.isTranslating = false;
    })
    .error(function(evt, type, errorType) {
        console.log(arguments);
        trans.redGoogle.isTranslating = false;
        console.log("error translating text");
        if (typeof options.onError == 'function') {
            options.onError.call(trans.redGoogle, evt, type, errorType);
        }
    }) 
   
}

 
 
trans.redGoogle.init = function(e) {
    if (trans.redGoogle.isInitialized) return true;
   
    trans.translator = trans.translator||[];
    trans.translator.push("redGoogle");
    //var $template = $('<iframe src="translator/google/miniProxy.php?https://translate.google.com/#ja/en/" class="translator google"></iframe>');
    //$("body").append($template);
    trans.redGoogle.isInitialized = true;
}
 
$(document).ready(function() {
    trans.redGoogle.init();
});