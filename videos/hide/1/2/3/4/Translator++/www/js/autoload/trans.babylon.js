var trans = trans || {};
// max request length should be 2000
trans.babylon = new TranslatorEngine({
	id:"babylon",
	name:"Babylon",
	description:"无限公开巴比伦翻译器API<br />此翻译器仅支持日文翻译<br />最大请求长度为2000个字符。",
	author:"Dreamsavior",
	version:"1.1",
	
	delimiter:"\n\n",
    lineSubstitute : '¶', //¶	
	targetUrl: 'https://translation.babylon-software.com/translate/babylon.php',
	maxRequestLength: 2000,
	languages:{
		"ja":"Japanese",
		"ar":"Arabic",
		"bg":"Bulgarian",
		"zh-CN":"Chinese",
		"zh-TW":"Chinese Taiwan",
		"cs":"Czech",
		"nl":"Dutch",
		"en":"English",
		"et":"Estonian",
		"fi":"Finnish",
		"fr":"French",
		"de":"German",
		"he":"Hebrew",
		"hi":"Hindi",
		"hu":"Hungarian",
		"id":"Indonesian",
		"it":"Italian",
		"ko":"Korean",
		"lv":"Latvian",
		"lt":"Lithuanian",
		"fa":"Persian",
		"pl":"Polish",
		"pt":"Portuguese",
		"ro":"Romanian",
		"ru":"Russian",
		"sk":"Slova",
		"sl":"Slovenian",
		"es":"Spanish",
		"sv":"Swedish",
		"th":"Thai",
		"tr":"Turkish",
		"uk":"Ukrainian",
		"ur":"Urdu",
		"vi":"Vietnamese"
	},
	optionsForm:{
		
	  "schema": {
		"targetURL": {
		  "type": "string",
		  "title": "目标URL",
		  "description": "翻译程序目标URL",
		  "default":"https://translation.babylon-software.com/translate/babylon.php",
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
			trans.babylon.update("targetUrl", value);
			
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
			trans.babylon.update("escapeAlgorithm", value);
			
		  }
		}		
	  ]
	}
});


trans.babylon.buildRequestParam = function(sl, tl, theText) {
	sl = sl||"ja";
	tl = tl||"en";
	var langData = {
		"en":{"name":"English", "code":"0"},
		"fr":{"name":"French", "code":"1"},
		"it":{"name":"Italian", "code":"2"},
		"de":{"name":"German", "code":"6"},
		"pt":{"name":"Portuguese", "code":"5"},
		"es":{"name":"Spanish", "code":"3"},
		"ar":{"name":"Arabic", "code":"15"},
		"ca":{"name":"Catalan", "code":"99"},
		"es":{"name":"Castilian", "code":"344"},
		"cs":{"name":"Czech", "code":"31"},
		"zh-CN":{"name":"Chinese (s)", "code":"10"},
		"zh-TW":{"name":"Chinese (t)", "code":"9"},
		"da":{"name":"Danish", "code":"43"},
		"el":{"name":"Greek", "code":"11"},
		"he":{"name":"Hebrew", "code":"14"},
		"hi":{"name":"Hindi", "code":"60"},
		"hu":{"name":"Hungarian", "code":"30"},
		"fa":{"name":"Persian", "code":"51"},
		"ja":{"name":"Japanese", "code":"8"},
		"ko":{"name":"Korean", "code":"12"},
		"nl":{"name":"Dutch", "code":"4"},
		"no":{"name":"Norwegian", "code":"46"},
		"pl":{"name":"Polish", "code":"29"},
		"ro":{"name":"Romanian", "code":"47"},
		"ru":{"name":"Russian", "code":"7"},
		"sv":{"name":"Swedish", "code":"48"},
		"tr":{"name":"Turkish", "code":"13"},
		"th":{"name":"Thai", "code":"16"},
		"uk":{"name":"Ukrainian", "code":"49"},
		"ur":{"name":"Urdu", "code":"39"}
	}
	var bodyObj = {
			v: '1.0',
			q: theText,
			langpair: langData[sl].code+'|'+langData[tl].code,
			callback: 'babylonTranslator.callback',
			context: 'babylon.8.0._babylon_api_response',
		}

	return bodyObj;
}



trans.babylon.translate = function(text, options) {
    if (trans.babylon.isDisabled == true) return false;
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
	thisTranslator.targetUrl = thisTranslator.targetUrl||'https://www.babylon.co.jp';
	var request = require('request');

	var bodyObj = thisTranslator.buildRequestParam(options.sl, options.tl, theText);
	var reqOptions = {
		url: 'https://translation.babylon-software.com/translate/babylon.php',
		method: 'POST',
		headers: {
			'Referer': 'https://translation.babylon-software.com/japanese/to-english/',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
		},
		form: bodyObj
	}
	
	request(reqOptions, function (error, response, body) {
		console.log("translation done : ");
		
		console.log('error:', error); // Print the error if one occurred
		console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
		console.log('body:', body); // print result body
		
		var resultObj = common.extractString(body, "babylonTranslator.callback('babylon.8.0._babylon_api_response',", ', 200, null, null);');
		if (common.isJSON(resultObj) == false) return console.log("error parsing translation result : "+resultObj);
		var resultObjPar = JSON.parse(resultObj);
		var translatedText = resultObjPar.translatedText;
		console.log(translatedText);
		//console.log(data);

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
	thisTranslator.isTranslating = true;		
		
	});	

}



$(document).ready(function() {
	trans.babylon.init();
});