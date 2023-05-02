var trans = trans || {};
// max request length should be 2000
trans.kakao = new TranslatorEngine({
	id:"kakao",
	name:"Kakao",
	author:"Dreamsavior",
	version:"1.2",
	description:"无限公开KakaoTalk翻译API。",
	delimiter:"\n\n",
    lineSubstitute : '¶', //¶	
	targetUrl: 'https://translate.kakao.com/translator/translate.json',
	maxRequestLength: 2000,
	languages:{
		"ar":"Arabic",
		"bn":"Bangla",
		"zh-TW":"Chinese (traditional)",
		"zh-CN":"Chinese (simplified)",
		"nl":"Dutch",
		"en":"English",
		"fr":"French",
		"de":"German",
		"hi":"Hindi",
		"id":"Indonesian",
		"it":"Italian",
		"jp":"Japanese",
		"kr":"Korean",
		"ms":"Malaysian",
		"pt":"Portuguese",
		"ru":"Russian",
		"es":"Spanish",
		"th":"Thai",
		"tr":"Turkish",
		"vi":"Vietnamese"
	},
	optionsForm:{
		
	  "schema": {
		"targetURL": {
		  "type": "string",
		  "title": "目标URL",
		  "description": "翻译程序目标URL",
		  "default":"https://translate.kakao.com/translator/translate.json",
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
			trans.kakao.update("targetUrl", value);
			
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
			trans.kakao.update("escapeAlgorithm", value);
			
		  }
		}		
	  ]
	}
});


trans.kakao.generateLangCode = function(langCode) {
	var language = {
		"ar":{"code":"ar","lang":"Arabic"},
		"bn":{"code":"bn","lang":"Bangla"},
		"zh-TW":{"code":"cn","lang":"Chinese (traditional)"},
		"zh-CN":{"code":"cn","lang":"Chinese (simplified)"},
		"nl":{"code":"nl","lang":"Dutch"},
		"en":{"code":"en","lang":"English"},
		"fr":{"code":"fr","lang":"French"},
		"de":{"code":"de","lang":"German"},
		"hi":{"code":"hi","lang":"Hindi"},
		"id":{"code":"id","lang":"Indonesian"},
		"it":{"code":"it","lang":"Italian"},
		"jp":{"code":"jp","lang":"Japanese"},
		"kr":{"code":"kr","lang":"Korean"},
		"ms":{"code":"ms","lang":"Malaysian"},
		"pt":{"code":"pt","lang":"Portuguese"},
		"ru":{"code":"ru","lang":"Russian"},
		"es":{"code":"es","lang":"Spanish"},
		"th":{"code":"th","lang":"Thai"},
		"tr":{"code":"tr","lang":"Turkish"},
		"vi":{"code":"vi","lang":"Vietnamese"}		
	}
	
	if (Boolean(language[langCode]) == false) return 'auto';
	return language[langCode].code||false;
}



trans.kakao.translate = function(text, options) {
	console.log("Running kakao translator");
    if (trans.kakao.isDisabled == true) return false;
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
	thisTranslator.targetUrl = thisTranslator.targetUrl||'https://translate.kakao.com/translator/translate.json';
	
	var request = require('request');
	var bodyObj = {
			queryLanguage: thisTranslator.generateLangCode(options.sl),
			resultLanguage: thisTranslator.generateLangCode(options.tl),
			q: theText	
		}


	var reqOptions = {
		url: thisTranslator.targetUrl,
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'Host': 'translate.kakao.com',
			'Origin': 'https://translate.kakao.com',
			'Referer': 'https://translate.kakao.com/',
			'Sec-Fetch-Mode': 'cors',
			'Sec-Fetch-Site': 'same-origin',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36',
			'X-Requested-With': 'XMLHttpRequest'	
		},
		form: bodyObj
	}

	request(reqOptions, function (error, response, body) {
		console.log("translation done : ");
		
		console.log('error:', error); // Print the error if one occurred
		console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
		console.log('body:'); // Print the HTML for the Google homepage.
		
		if (common.isJSON(body) == false) return console.warn("结果不是json");
		var data = JSON.parse(body);
		console.log(data);
		var translatedText = data.result.output.join("\n");
		console.log(translatedText);

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
			thisTranslator.isTranslating = true;				
			options.onAfterLoading.call(thisTranslator, result, response);
		}
	   
	
	
	// always
	thisTranslator.isTranslating = false;		
		
	});	

}



$(document).ready(function() {
	trans.kakao.init();
});