var trans = trans || {};
// max request length should be 2000
trans.pragma6 = new TranslatorEngine({
	id:"pragma6",
	name:"Pragma6",
	author:"Dreamsavior",
	version:"1.1",
	description:"无限公共pragma6翻译API。",
	delimiter:"\n\n",
    lineSubstitute : '¶', //¶	
	targetUrl: 'http://online.translate.ua/us?h=420&w=600&url=translate.ua&count_show=1',
	maxRequestLength: 2000,
	languages:{
		"af":"African",
		"sq":"Albanian",
		"ar":"Arabic",
		"hy":"Armenian",
		"az":"Azerbaijanian",
		"eu":"Basque",
		"be":"Belarussian",
		"bg":"Bulgarian",
		"ca":"Catalan",
		"zh-CN":"Chinese (Simpl.) ",
		"zh-TW":"Chinese (Tradit.) ",
		"ht":"Creole (Haiti) ",
		"hr":"Croatian",
		"cs":"Czech",
		"da":"Danish",
		"nl":"Dutch",
		"en":"English",
		"et":"Estonian",
		"fi":"Finnish",
		"fr":"French",
		"gl":"Galician",
		"ka":"Georgian",
		"de":"German",
		"el":"Greek",
		"he":"Hebrew",
		"hi":"Hindi",
		"hu":"Hungarian",
		"is":"Icelandic",
		"id":"Indonesian",
		"ga":"Irish",
		"it":"Italian",
		"ja":"Japanese",
		"kk":"Kazakh",
		"ko":"Korean",
		"la":"Latin",
		"lv":"Latvian",
		"lt":"Lithuanian",
		"mk":"Macedonian",
		"ms":"Malay",
		"mt":"Maltese",
		"no":"Norwegian",
		"fa":"Persian",
		"pl":"Polish",
		"pt":"Portuguese",
		"ro":"Romanian",
		"ru":"Russian",
		"sr":"Serbian",
		"sk":"Slovakia",
		"sl":"Slovenian",
		"es":"Spanish",
		"sw":"Swahili",
		"sv":"Swedish",
		"th":"Thai",
		"tr":"Turkish",
		"uk":"Ukrainian",
		"ur":"Urdu",
		"vi":"Vietnamese",
		"cy":"Welshman",
		"yi":"Yiddish"
	},
	optionsForm:{
		
	  "schema": {
		"targetURL": {
		  "type": "string",
		  "title": "目标URL",
		  "description": "翻译程序目标URL",
		  "default":"http://online.translate.ua/us?h=420&w=600&url=translate.ua&count_show=1",
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
			trans.pragma6.update("targetUrl", value);
			
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
			trans.pragma6.update("escapeAlgorithm", value);
			
		  }
		}		
	  ]
	}
});


trans.pragma6.generateLangCode = function(langCode) {
	var language = {
		"af":{"code":"af", "lang":"African"},
		"sq":{"code":"sq", "lang":"Albanian"},
		"ar":{"code":"ar", "lang":"Arabic"},
		"hy":{"code":"hy", "lang":"Armenian"},
		"az":{"code":"az", "lang":"Azerbaijanian"},
		"eu":{"code":"eu", "lang":"Basque"},
		"be":{"code":"be", "lang":"Belarussian"},
		"bg":{"code":"bg", "lang":"Bulgarian"},
		"ca":{"code":"ca", "lang":"Catalan"},
		"zh-CN":{"code":"zh-CN", "lang":"Chinese (Simpl.) "},
		"zh-TW":{"code":"zh", "lang":"Chinese (Tradit.) "},
		"ht":{"code":"ht", "lang":"Creole (Haiti) "},
		"hr":{"code":"hr", "lang":"Croatian"},
		"cs":{"code":"cs", "lang":"Czech"},
		"da":{"code":"da", "lang":"Danish"},
		"nl":{"code":"nl", "lang":"Dutch"},
		"en":{"code":"en", "lang":"English"},
		"et":{"code":"et", "lang":"Estonian"},
		"fi":{"code":"fi", "lang":"Finnish"},
		"fr":{"code":"fr", "lang":"French"},
		"gl":{"code":"gl", "lang":"Galician"},
		"ka":{"code":"ka", "lang":"Georgian"},
		"de":{"code":"de", "lang":"German"},
		"el":{"code":"el", "lang":"Greek"},
		"he":{"code":"iw", "lang":"Hebrew"},
		"hi":{"code":"hi", "lang":"Hindi"},
		"hu":{"code":"hu", "lang":"Hungarian"},
		"is":{"code":"is", "lang":"Icelandic"},
		"id":{"code":"id", "lang":"Indonesian"},
		"ga":{"code":"ga", "lang":"Irish"},
		"it":{"code":"it", "lang":"Italian"},
		"ja":{"code":"ja", "lang":"Japanese"},
		"kk":{"code":"kk", "lang":"Kazakh"},
		"ko":{"code":"ko", "lang":"Korean"},
		"la":{"code":"la", "lang":"Latin"},
		"lv":{"code":"lv", "lang":"Latvian"},
		"lt":{"code":"lt", "lang":"Lithuanian"},
		"mk":{"code":"mk", "lang":"Macedonian"},
		"ms":{"code":"ms", "lang":"Malay"},
		"mt":{"code":"mt", "lang":"Maltese"},
		"no":{"code":"no", "lang":"Norwegian"},
		"fa":{"code":"fa", "lang":"Persian"},
		"pl":{"code":"pl", "lang":"Polish"},
		"pt":{"code":"pt", "lang":"Portuguese"},
		"ro":{"code":"ro", "lang":"Romanian"},
		"ru":{"code":"ru", "lang":"Russian"},
		"sr":{"code":"sr", "lang":"Serbian"},
		"sk":{"code":"sk", "lang":"Slovakia"},
		"sl":{"code":"sl", "lang":"Slovenian"},
		"es":{"code":"es", "lang":"Spanish"},
		"sw":{"code":"sw", "lang":"Swahili"},
		"sv":{"code":"sv", "lang":"Swedish"},
		"th":{"code":"th", "lang":"Thai"},
		"tr":{"code":"tr", "lang":"Turkish"},
		"uk":{"code":"uk", "lang":"Ukrainian"},
		"ur":{"code":"ur", "lang":"Urdu"},
		"vi":{"code":"vi", "lang":"Vietnamese"},
		"cy":{"code":"cy", "lang":"Welshman"},
		"yi":{"code":"yi", "lang":"Yiddish"}		
		
	}
	
	return language[langCode].code||false;
}



trans.pragma6.translate = function(text, options) {
    if (trans.pragma6.isDisabled == true) return false;
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
	thisTranslator.targetUrl = thisTranslator.targetUrl||'http://online.translate.ua/us?h=420&w=600&url=translate.ua&count_show=1';
	
	var request = require('request');
	var bodyObj = {
		LangFrom:thisTranslator.generateLangCode('ja'),
		LangTo:thisTranslator.generateLangCode('en'),
		Subject:'**',
		lang:'en',
		SrcTxt:theText,
		hide_lang:'ru uk en ja',
		DlgLang:'en',
		Translate:'Translate'
	}

	var reqOptions = {
		url: thisTranslator.targetUrl,
		method: 'POST',
		headers: {
			'Origin': 'http://online.translate.ua',
			'Referer': 'http://online.translate.ua/us?h=420&w=600&url=translate.ua&count_show=1',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
			'cookie':'PHPSESSID=slcr5o0kuh67g51nl788l547l3; ref=translate.ua; __utmc=188194487; dev_mode=full; def_lang=ru+uk+en+ja; LangTo=ru; LangFrom=ja; __atuvc=7%7C28; __atuvs=5d2478a22299bb67000; __utma=188194487.201430686.1562593204.1562593204.1562671266.2; __utmz=188194487.1562671266.2.2.utmcsr=translate.ua|utmccn=(referral)|utmcmd=referral|utmcct=/us/on-line; __utmt=1; __utmb=188194487.1.10.1562671266'
		},
		form: bodyObj
	}
	request(reqOptions, function (error, response, body) {
		console.log("translation done : ");
		
		console.log('error:', error); // Print the error if one occurred
		console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
		console.log('body:'); // Print the HTML for the Google homepage.
		
		var resultText = common.extractString(body, '<textarea class="DstText" style="border: 0; background: rgb(255, 255, 255) url(http://online.translate.ua/img/pragma.png) no-repeat right bottom;">', '</textarea>')
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
	trans.pragma6.init();
});