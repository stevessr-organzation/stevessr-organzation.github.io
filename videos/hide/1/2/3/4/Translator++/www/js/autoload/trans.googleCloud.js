var trans = trans || {};
trans.googleCloud = new TranslatorEngine({
    id:"googleCloud",
    name:"Google Cloud",
	author:"Dreamsavior",
	version:"1.4",
	description:"使用谷歌云平台（GPC）翻译API的翻译引擎",
    isInitialized: false,
    isDisabled:false,
    columnIndex:2,
    columnHeader: "Google Cloud",
    maxRequestLength : 5000,
    fileListLoaded: false,
    indexIsBuilt: false,
    skipTranslated:false,
    batchDelay:5000,
    skipTranslatedOnBatch :true, // skip lines that already translated when doing TRANSLATE ALL
    lineSubstitute : '§', //¶
	apiKey : '', // your google api key
	targetUrl : 'https://translation.googleapis.com/language/translate/v2',
	model : "nmt",
	useMultipleQuery:false,
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
		"apiKey": {
		  "type": "string",
		  "title": "API密钥",
		  "description": "更多信息请访问 https://cloud.google.com/translate/docs/quickstart",
		  "default":"",
		  "required":true
		},
		"targetURL": {
		  "type": "string",
		  "title": "目标URL",
		  "description": "翻译程序目标URL",
		  "default":"https://translation.googleapis.com/language/translate/v2",
		  "required":true
		},
		"model": {
		  "type": "string",
		  "title": "翻译模式",
		  "description": "基于短语的机器翻译（PBMT）模型，或NMT使用神经机器翻译（NMT）模型。",
		  "default":"nmt",
		  enum:["base", "nmt"]
		},
		"batchDelay": {
		  "type": "integer",
		  "title": "批量延迟",
		  "description": "批次之间的延迟，单位为毫秒<br />最小500毫秒",
		  "minimum":500
		},
		"maxRequestLength": {
		  "type": "integer",
		  "title": "最大请求长度",
		  "description": "每批的最大请求长度<br />阅读https://cloud.google.com/translate/quotas 更多信息",
		  "maximum":10000
		},
		"escapeAlgorithm": {
		  "type": "string",
		  "title": "代码转义算法",
		  "description": "对话中内联代码的转义算法",
		  "default":"",
		  "required":false,
		  "enum": [
				"",
				"hexPlaceholder",
				"agressiveSplitting",
				"none"
			]
		}		
	  },
	  "form": [
		{
		  "key": "apiKey",
		  "onChange": function (evt) {
			var value = $(evt.target).val();
			trans.googleCloud.update("apiKey", value);
		  }
		},
		{
		  "key": "targetURL",
		  "onChange": function (evt) {
			var value = $(evt.target).val();
			trans.googleCloud.update("targetUrl", value);
			
		  }
		},
		{
		  "key": "model",
		  "onChange": function (evt) {
			var value = $(evt.target).val();
			trans.googleCloud.update("model", value);
			
		  }
		},
		{
		  "key": "batchDelay",
		  "onChange": function (evt) {
			var value = $(evt.target).val();
			var intValue = parseInt(value);
			if (isNaN(intValue)) {
				alert("非法值"+value);
				intValue = 5000;
				$(evt.target).val(intValue)
			}
			if (intValue < 500) { 
				intValue =500;
				$(evt.target).val(intValue)
			}
			
			trans.googleCloud.update("batchDelay", intValue);
			
		  }
		},
		{
		  "key": "maxRequestLength",
		  "onChange": function (evt) {
			var value = $(evt.target).val();
			var intValue = parseInt(value);
			if (isNaN(intValue)) {
				alert("非法值"+value);
				intValue = 5000;
				$(evt.target).val(intValue)
			}
			trans.googleCloud.update("maxRequestLength", intValue);
			
		  }
		},
		{
			"key": "escapeAlgorithm",
			"titleMap": {
				"": "Default",
				"hexPlaceholder": "Hex Placeholder (recommended)",
				"agressiveSplitting": "Aggressive Splitting (Japanese only)",
				"none": "None (no escaping)"
			},
			"onChange": function (evt) {
			  var value = $(evt.target).val();
			  trans.googleCloud.update("escapeAlgorithm", value);
			  
			}
		}
	  ]
	}	
})
 
trans.googleCloud.buildQuery = function(texts) {
	if (Array.isArray(texts) == false) texts = [texts];		
	
	var queries = [];
	for (var i=0; i<texts.length; i++) {
		queries.push("q="+encodeURIComponent(texts[i]));
	}
	console.log("query =");
	console.log(queries);
	return queries.join("&");
	
}

trans.googleCloud.mergeText = function(texts) {
	if (Array.isArray(texts) == false) return texts;
	
	return texts.join(this.delimiter);
}

trans.googleCloud.splitText = function(text) {
	return text.split(this.delimiter);
}
 
trans.googleCloud.htmlEntitiesDecode = function(text) {
	this.textDummy = this.textDummy||$('<textarea />');
	return this.textDummy.html(text).text();	
}
 
trans.googleCloud.handleError = function(evt, type, errorType, options) {
	if (typeof options.onError == 'function')options.onError.call(this, evt, type, errorType);
	if (typeof options.always == 'function') options.always.call(this, evt, type, errorType);
}


trans.googleCloud.request = async function(texts, options) {
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

	var thisTranslator = this;

	var send = async function(parts) {
		var resolver;
		var rejector;
		var promise = new Promise((resolve, reject) => {
			resolver = resolve;
			rejector = reject;
		});

		// q with multiple query
		var http = new XMLHttpRequest();
		//var url = 'https://translation.googleapis.com/language/translate/v2';
		var url = thisTranslator.targetUrl||'https://translation.googleapis.com/language/translate/v2';
		
		// format can be text or html
		//var params = 'q='+encodeURIComponent(text)+'&target='+options.tl+'&source='+options.sl+'&key='+thisTranslator.apiKey+'&format=text&model='+thisTranslator.model;
		//if (Boolean(thisTranslator.useMultipleQuery)) {
			// send multiple 'q' queries instead of concenated text
			// maximum number of 'q' parameters are 128
			// google will cast error 400 when greater than that
			var params = thisTranslator.buildQuery(parts)+'&target='+options.tl+'&source='+options.sl+'&key='+thisTranslator.apiKey+'&format=text&model='+thisTranslator.model;
		//}
		
		console.log("requested parameters : \r\n", params);
		//return true;
		http.open('POST', url, true);

		//Send the proper header information along with the request
		http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

		http.onreadystatechange = function() {//Call a function when the state changes.
			if(http.readyState == 4 && http.status == 200) {
				console.log("transaction success");
				console.log(http.responseText);
				var data = JSON.parse(http.responseText);
				var result = [];
				for (var i=0; i<data.data.translations.length; i++) {
					result.push(data.data.translations[i].translatedText);
				}
				resolver(result);
			} else if (http.status !== 200) {
				var data = {
						"error": {
							"code":http.status,
							"message":"",
							"errors":[]
						}
					}
					
				try {
					data = JSON.parse(http.responseText);
				} catch (error) {
					
				}
				data.error = data.error||{};
				console.log("an error ocured");
				var evt = {
					status:"error "+http.status+": "+data.error.message
				};
				trans.googleCloud.handleError(evt, "error", http.status, options);
				rejector(http.status, options);
			}	
		}
		http.send(params);
		return promise;
	}	

	if (!Array.isArray(texts)) texts = [texts];
	var result = [];
	// maximum allowed batch is 128, we make it 127 for safety.
	// https://cloud.google.com/translate/docs/reference/rest/v2/translate
	var parts = common.arrayChunk(texts, 127);
	for (var i=0; i<parts.length; i++) {
		result.push(await send(parts[i]));
	}
	return new Promise((resolve, reject) => {
		resolve(result.flat()); 
	})
}


trans.googleCloud.translate = async function(text, options) {
    if (trans.bing.isDisabled == true) return false;
    if (typeof text=='undefined') return text;
	var thisTranslator = this;
	thisTranslator.escapeAlgorithm = thisTranslator.escapeAlgorithm || "hexPlaceholder";

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
	
 
	console.log("incoming text  : ");
	console.log(text);

	var textObj = thisTranslator.preProcessText(text, options);
	var filteredText = textObj.text;
	
	console.warn("textObj", textObj);
    	
	var data = await thisTranslator.request(filteredText, options);
	var result = {
		'sourceText':"",
		'translationText':"",
		'source':[],
		'translation':[]
	};
	
	if (thisTranslator.escapeAlgorithm == 'agressiveSplitting' && options.sl == "ja") {
		var resultText = data[0];
		var resultTexts = resultText.split(thisTranslator.delimiter);
		for (let i = 0; i < resultTexts.length; i++) {
			let thisText = resultTexts[i];
			textObj.dict.addIndexedTranslation(i, thisText.replace(/\n/ig, ' '));
		}				

		var tStrings = textObj.stringCollection;
		for (let i = 0; i < tStrings.length; i++) {
			result.source.push (tStrings[i].originalString);
			result.translation.push (tStrings[i].getTranslatedString(textObj.dict));
		}
	} else {
		//hexPlaceholder
		//process the first index, since the texts is concenate into one text anyway
		result.translationText 	= textObj.hexPlaceholder.restore(data[0]);
		result.source 			= textObj.sourceText.split($DV.config.lineSeparator);
		result.translation 		= result.translationText.split($DV.config.lineSeparator);
		
		if (options.mode=="rowByRow") {
			//console.log("Replacing ", thisTranslator.lineSubstitute, $DV.config.lineSeparator);

			for (var i=0; i<result.translation.length; i++) {
				result.translation[i] = result.translation[i].split(thisTranslator.lineSubstitute).join($DV.config.lineSeparator);
			}
		}
	}
	
	console.log("result : ");
	console.log(result);
	if (typeof options.onAfterLoading == 'function') {
		options.onAfterLoading.call(thisTranslator, result, data);
	}

};

 
$(document).ready(function() {
    trans.googleCloud.init();
});