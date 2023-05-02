var trans = trans || {};
trans.yandex = new TranslatorEngine({
	id:"yandex",
	name:"Yandex",
	description:"私有Yandex翻译API",
	author:"Dreamsavior",
	version:"1.1",
	
	delimiter:"\n\n",
    lineSubstitute : '¶', //¶	
	targetUrl: 'https://translate.yandex.net/api/v1.5/tr.json/translate',
	apiKey: '',
	escapeAlgorithm : 'agressiveSplitting',
	languages:{
		"af": "Afrikaans",
		"am": "Amharic",
		"ar": "Arabic",
		"az": "Azerbaijani",
		"ba": "Bashkir",
		"be": "Belarusian",
		"bg": "Bulgarian",
		"bn": "Bengali",
		"bs": "Bosnian",
		"ca": "Catalan",
		"ceb": "Cebuano",
		"cs": "Czech",
		"cy": "Welsh",
		"da": "Danish",
		"de": "German",
		"el": "Greek",
		"en": "English",
		"eo": "Esperanto",
		"es": "Spanish",
		"et": "Estonian",
		"eu": "Basque",
		"fa": "Persian",
		"fi": "Finnish",
		"fr": "French",
		"ga": "Irish",
		"gd": "Scottish Gaelic",
		"gl": "Galician",
		"gu": "Gujarati",
		"he": "Hebrew",
		"hi": "Hindi",
		"hr": "Croatian",
		"ht": "Haitian",
		"hu": "Hungarian",
		"hy": "Armenian",
		"id": "Indonesian",
		"is": "Icelandic",
		"it": "Italian",
		"ja": "Japanese",
		"jv": "Javanese",
		"ka": "Georgian",
		"kk": "Kazakh",
		"km": "Khmer",
		"kn": "Kannada",
		"ko": "Korean",
		"ky": "Kyrgyz",
		"la": "Latin",
		"lb": "Luxembourgish",
		"lo": "Lao",
		"lt": "Lithuanian",
		"lv": "Latvian",
		"mg": "Malagasy",
		"mhr": "Mari",
		"mi": "Maori",
		"mk": "Macedonian",
		"ml": "Malayalam",
		"mn": "Mongolian",
		"mr": "Marathi",
		"mrj": "Hill Mari",
		"ms": "Malay",
		"mt": "Maltese",
		"my": "Burmese",
		"ne": "Nepali",
		"nl": "Dutch",
		"no": "Norwegian",
		"pa": "Punjabi",
		"pap": "Papiamento",
		"pl": "Polish",
		"pt": "Portuguese",
		"ro": "Romanian",
		"ru": "Russian",
		"si": "Sinhalese",
		"sk": "Slovak",
		"sl": "Slovenian",
		"sq": "Albanian",
		"sr": "Serbian",
		"su": "Sundanese",
		"sv": "Swedish",
		"sw": "Swahili",
		"ta": "Tamil",
		"te": "Telugu",
		"tg": "Tajik",
		"th": "Thai",
		"tl": "Tagalog",
		"tr": "Turkish",
		"tt": "Tatar",
		"udm": "Udmurt",
		"uk": "Ukrainian",
		"ur": "Urdu",
		"uz": "Uzbek",
		"vi": "Vietnamese",
		"xh": "Xhosa",
		"yi": "Yiddish",
		"zh": "Chinese"
	},
	optionsForm:{
	  "schema": {
		"targetURL": {
		  "type": "string",
		  "title": "目标URL",
		  "description": "翻译程序目标URL",
		  "default":"https://translate.yandex.net/api/v1.5/tr.json/translate",
		  "required":true
		},
		"apiKey": {
		  "type": "string",
		  "title": "API密钥",
		  "description": "Yandex API密钥<br />在以下网址免费获取： https://tech.yandex.com/keys/?service=trnsl",
		  "default":"",
		  "required":true
		},		
		"escapeAlgorithm": {
		  "type": "string",
		  "title": "代码转义算法",
		  "description": "对话中内联代码的转义算法",
		  "default":"",
		  "required":false,
		  "enum": [
				"",
				"meaninglessWord",
				"agressiveSplitting",
				"htmlCloacking",
				"none"
			]
		}		
	  },
	  "form": [
		{
		  "key": "targetURL",
		  "onChange": function (evt) {
			var value = $(evt.target).val();
			trans.yandex.update("targetUrl", value);
			
		  }
		},
		{
		  "key": "apiKey",
		  "onChange": function (evt) {
			var value = $(evt.target).val();
			trans.yandex.update("apiKey", value);
			
		  }
		},
		{
		  "key": "escapeAlgorithm",
		  "titleMap": {
			  "": "Default",
			  "meaninglessWord": "Meaningless Word",
			  "agressiveSplitting": "Agressive Splitting (Japanese only)",
			  "htmlCloacking": "HTML Cloacking",
			  "none": "None (no escaping)"
		  },
		  "onChange": function (evt) {
			var value = $(evt.target).val();
			trans.yandex.update("escapeAlgorithm", value);
			
		  }
		}		
	  ]
	}
});


trans.yandex.translate = function(text, options) {
    if (trans.yandex.isDisabled == true) return false;
    if (typeof text=='undefined') return text;
	var thisTranslator = this;


	var originalText = text;
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
	var lineSubstitute = thisTranslator.lineSubstitute;
	var textObj = thisTranslator.preProcessText(text, options);
	var theText = textObj.text;
    thisTranslator.isTranslating = true;
	thisTranslator.targetUrl = thisTranslator.targetUrl||"https://translate.yandex.net/api/v1.5/tr.json/translate";
	var thisLang = options.sl+"-"+options.tl;
	$.ajax({
		url: thisTranslator.targetUrl,
		type: "POST",
		data: {
				lang:thisLang,
				key:thisTranslator.apiKey,
				text: theText,
				//format: "plain" //plain / html
				format: "html" //plain / html
			}
	})    
	.done(function(data) {
        console.log("translating done : ");
        console.log(data);
		var translatedText = data.text[0];
		
        var result = {
            'sourceText':originalText,
            'translationText':translatedText,
            'source':[],
            'translation':[]
        };
		if (Array.isArray(result.sourceText)) {
			result.sourceText = originalText.join(thisTranslator.delimiter);
		}
		
		
		var dataSplit = translatedText.split(thisTranslator.delimiter);

        if (textObj.mode == "agressiveSplitting") {
           
            let tStrings = textObj.stringCollection;
            let dict = textObj.dict;
			
			console.log("dict: ");
			console.log(dict);
            for (let i = 0; i < dataSplit.length; i++) {
                dict.addIndexedTranslation(i, dataSplit[i].replace(/\n/ig, ' '));
            }
			console.log(dict);
			console.log("tStrings:");
			console.log(tStrings);
            for (let i = 0; i < tStrings.length; i++) {
                result.source.push (tStrings[i].originalString);
                result.translation.push (tStrings[i].getTranslatedString(dict));
            }
			console.log(tStrings);
			
        } else {
            result.translationText = thisTranslator.fixTranslationFormatting(result.translationText);
            result.translationText = thisTranslator.unescapeCharacter(result.translationText);
            result.source = result.sourceText.split(thisTranslator.delimiter);
            result.translation = result.translationText.split(thisTranslator.delimiter);
            // restore escaped line from original text
            var tempArray = [];
            for (var i=0; i<result.source.length; i++) {
                tempArray.push(str_ireplace(lineSubstitute, thisTranslator.delimiter, result.source[i]))
            }
            result.source = tempArray;
           
            var tempArray = [];
            for (var i=0; i<result.translation.length; i++) {
                tempArray.push(str_ireplace(lineSubstitute, thisTranslator.delimiter, result.translation[i]))
            }
            result.translation = tempArray;
        }
       
        console.log(result);
        if (typeof options.onAfterLoading == 'function') {
            options.onAfterLoading.call(thisTranslator, result, data);
        }
       
        thisTranslator.isTranslating = false;
    })
    .always(function() {
        thisTranslator.isTranslating = false;
    })
    .error(function(evt, type, errorType) {
        console.log(arguments);
        thisTranslator.isTranslating = false;
        console.log("error translating text");
        if (typeof options.onError == 'function') {
            options.onError.call(thisTranslator, evt, type, errorType);
        }
    }) 
 
	
 
}



$(document).ready(function() {
	trans.yandex.init();
});