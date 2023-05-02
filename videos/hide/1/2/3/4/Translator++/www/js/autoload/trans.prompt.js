var trans = trans || {};
trans.prompt = new TranslatorEngine({
	id:"prompt",
	name:"PROMPT",
	description:"公共提示翻译API<br />http://online-translator.com",
	author:"Dreamsavior",
	version:"1.0",
	
	delimiter:"\n\n",
    lineSubstitute : '¶', //¶	
	targetUrl: 'https://www.online-translator.com/services/soap.asmx/GetTranslation',
	apiKey: '',
	escapeAlgorithm : 'agressiveSplitting',
	version: '1.2',
	languages:{
		"ar" : "Arabic",
		"ca" : "Catalan",
		"zh-CN" : "Chinese (Simplified)",
		"nl" : "Dutch",
		"en" : "English",
		"fi" : "Finnish",
		"fr" : "French",
		"de" : "German",
		"el" : "Greek",
		"he" : "Hebrew",
		"hi" : "Hindi",
		"it" : "Italian",
		"ja" : "Japanese",
		"kk" : "Kazakh",
		"ko" : "Korean",
		"pt" : "Portuguese",
		"ru" : "Russian",
		"es" : "Spanish",
		"tr" : "Turkish",
		"uk" : "Ukrainian"
	},
	optionsForm:{
	  "schema": {
		"targetURL": {
		  "type": "string",
		  "title": "目标URL",
		  "description": "翻译程序目标URL",
		  "default":'https://www.online-translator.com/services/soap.asmx/GetTranslation',
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
			trans.prompt.update("targetUrl", value);
			
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
			trans.prompt.update("escapeAlgorithm", value);
			
		  }
		}		
	  ]
	}
});

trans.prompt.getLangCode = function(source, target) {
	source = source||"au"; //au : automatic
	if (source == 'zh-CN') source = 'zhcn';
	
	
	return source+"-"+target;
}


trans.prompt.translate = function(text, options) {
    if (trans.prompt.isDisabled == true) return false;
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
	var thisLang = trans.prompt.getLangCode(options.sl, options.tl);
	
    thisTranslator.isTranslating = true;
	thisTranslator.targetUrl = thisTranslator.targetUrl||'https://www.online-translator.com/services/soap.asmx/GetTranslation';
	
	var request = require('request');
	var bodyObj = {
			dirCode:thisLang,
			template:'auto',
			text:theText,
			lang:'en',
			limit:'5000',
			useAutoDetect:true, 
			key:'123', 
			ts:'MainSite',
			tid:'', 
			IsMobile:false
		}
	
	var reqOptions = {
		url: thisTranslator.targetUrl,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json; charset=UTF-8',
			'Origin': 'https://www.online-translator.com',
			'Referer': 'https://www.online-translator.com/',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
		},
		body: JSON.stringify(bodyObj)
	}
	request(reqOptions, function (error, response, body) {
		console.log('error:', error); // Print the error if one occurred
		console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
		console.log('body:'); // Print the HTML for the Google homepage.
		console.log(body);

		
		if (common.isJSON(body) == false || Boolean(error) ==true) {
			// error
			console.log(arguments);
			thisTranslator.isTranslating = false;
			console.log("error translating text");
			if (typeof options.onError == 'function') {
				options.onError.call(thisTranslator, {}, {}, {});
			}
			
		} else {
			// success
			
			data = JSON.parse(body);
			console.log(data);
			console.log("translating done : ");
			console.log(data);
			var translatedText = data.d.result;
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
				options.onAfterLoading.call(thisTranslator, result, data);
			}
		   
		}
		
		// always
		thisTranslator.isTranslating = false;		
	});	
	
 
}



$(document).ready(function() {
	trans.prompt.init();
});