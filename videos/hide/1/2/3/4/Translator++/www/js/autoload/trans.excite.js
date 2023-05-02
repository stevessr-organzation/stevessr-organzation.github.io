var trans = trans || {};
// max request length should be 2000
trans.excite = new TranslatorEngine({
	id:"excite",
	name:"Excite",
	author:"Dreamsavior",
	version:"1.1",
	description:"无限公共激励翻译API<br />此翻译器仅支持日文翻译<br />最大请求长度为2000个字符。",
	delimiter:"\n\n",
    lineSubstitute : '¶', //¶	
	targetUrl: 'https://www.excite.co.jp',
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
		  "default":"https://www.excite.co.jp",
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
			trans.excite.update("targetUrl", value);
			
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
			trans.excite.update("escapeAlgorithm", value);
			
		  }
		}		
	  ]
	}
});


trans.excite.buildRequestParam = function(sl, tl, theText) {
	const dict = {
		"ja":"JA",
		
		"ar":"AR",
		"bg":"BG",
		"zh-CN":"CH",
		"zh-TW":"CH",
		"cs":"CS",
		"nl":"NL",
		"en":"EN",
		"et":"ET",
		"fi":"FI",
		"fr":"FR",
		"de":"DE",
		"he":"HE",
		"hi":"HI",
		"hu":"HU",
		"id":"ID",
		"it":"IT",
		"ko":"KO",
		"lv":"LV",
		"lt":"LT",
		"fa":"FA",
		"pl":"PL",
		"pt":"PT",
		"ro":"RO",
		"ru":"RU",
		"sk":"SK",
		"sl":"SL",
		"es":"ES",
		"sv":"SV",
		"th":"TH",
		"tr":"TR",
		"uk":"UK",
		"ur":"UR",
		"vi":"VI"
	}

	var base = {
		_qf__formTrans: '',
		_token: '06ccb8dea17bc',
		auto_detect_flg: '1',
		wb_lp: 'JAEN',
		swb_lp: '',
		count_translation: '',
		re_translation: '',
		tdg_id: '',
		td_id: '',
		before_lang: 'JA',
		after_lang: 'EN',
		auto_detect: 'off',
		auto_detect: 'on',
		before: theText		
	}
	
	if (Boolean(dict[sl])) {
		base.before_lang = dict[sl];
	}
	if (Boolean(dict[tl])) {
		base.after_lang = dict[tl];
	}
	
	if (sl == "zh-CN" || tl == "zh-CN") {
		base.big5 = "no";
		base.big5_lang = "no";
	}
	if (sl == "zh-TW" || tl == "zh-TW") {
		base.big5 = "yes";
		base.big5_lang = "yes";
	}
	
	base.wb_lp = dict[sl]+dict[tl];
	
	return base
}

trans.excite.buildUrl = function(sl, tl) {
	const dict = {
		"en" : {"path":"/world/english/" , "name": "English"},
		"zh-TW" : {"path":"/world/chinese/" , "name": "Chinese Taiwan"},
		"zh-CN" : {"path":"/world/chinese/" , "name": "Chinese"},
		"ko" : {"path":"/world/korean/" , "name": "Korean"},
		"fr" : {"path":"/world/french/" , "name": "French"},
		"de" : {"path":"/world/german/" , "name": "German"},
		"it" : {"path":"/world/italian/" , "name": "Italian"},
		"es" : {"path":"/world/spanish/" , "name": "Spanish"},
		"pt" : {"path":"/world/portuguese/" , "name": "Portuguese"},
		"ru" : {"path":"/world/russian/" , "name": "Russian"},
		"ar" : {"path":"/world/arabic/" , "name": "Arabic"},
		"id" : {"path":"/world/indonesian/" , "name": "Indonesian"},
		"uk" : {"path":"/world/ukrainian/" , "name": "Ukrainian"},
		"ur" : {"path":"/world/urdu/" , "name": "Urdu"},
		"et" : {"path":"/world/estonian/" , "name": "Estonian"},
		"nl" : {"path":"/world/dutch/" , "name": "Dutch"},
		"sv" : {"path":"/world/swedish/" , "name": "Swedish"},
		"sk" : {"path":"/world/slova/" , "name": "Slova"},
		"sl" : {"path":"/world/slovenian/" , "name": "Slovenian"},
		"th" : {"path":"/world/thai/" , "name": "Thai"},
		"cs" : {"path":"/world/czech/" , "name": "Czech"},
		"tr" : {"path":"/world/turkish/" , "name": "Turkish"},
		"hu" : {"path":"/world/hungarian/" , "name": "Hungarian"},
		"hi" : {"path":"/world/hindi/" , "name": "Hindi"},
		"fi" : {"path":"/world/finnish/" , "name": "Finnish"},
		"bg" : {"path":"/world/bulgarian/" , "name": "Bulgarian"},
		"vi" : {"path":"/world/vietnamese/" , "name": "Vietnamese"},
		"he" : {"path":"/world/hebrew/" , "name": "Hebrew"},
		"fa" : {"path":"/world/persian/" , "name": "Persian"},
		"pl" : {"path":"/world/polish/" , "name": "Polish"},
		"lv" : {"path":"/world/latvian/" , "name": "Latvian"},
		"lt" : {"path":"/world/lithuanian/" , "name": "Lithuanian"},
		"ro" : {"path":"/world/romanian/" , "name": "Romanian"}
	}

	if (sl !== "ja") {
		return 'https://www.excite.co.jp'+dict[sl].path;
	} else {
		return 'https://www.excite.co.jp'+dict[tl].path;
	}
}



trans.excite.translate = function(text, options) {
    if (trans.excite.isDisabled == true) return false;
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
	thisTranslator.targetUrl = thisTranslator.targetUrl||'https://www.excite.co.jp';
	
	var request = require('request');
	var bodyObj = trans.excite.buildRequestParam(options.sl, options.tl, theText);

	var reqOptions = {
		url: trans.excite.buildUrl(options.sl, options.tl),
		method: 'POST',
		headers: {
			'Origin': 'https://www.excite.co.jp',
			'Referer': 'https://www.excite.co.jp/world/english_japanese/',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
		},
		form: bodyObj
	}
	request(reqOptions, function (error, response, body) {
		console.log("translation done : ");
		
		console.log('error:', error); // Print the error if one occurred
		console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
		console.log('body:'); // Print the HTML for the Google homepage.
		
		var resultText = common.extractString(body, '<textarea id="after" class="resizable" cols="37" rows="13" name="after">', "</textarea>");
		if (Boolean(resultText) == false) {
			resultText = common.extractString(body, '<textarea id="after" cols="37" rows="13" name="after">', "</textarea>");
		}
		translatedText = common.htmlEntitiesDecode(resultText);
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
	thisTranslator.isTranslating = false;		
		
	});	

}



$(document).ready(function() {
	trans.excite.init();
});