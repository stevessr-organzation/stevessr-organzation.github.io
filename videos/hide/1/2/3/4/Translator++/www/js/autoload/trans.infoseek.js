var trans = trans || {};
trans.Infoseek = new TranslatorEngine({
	id:"Infoseek",
	name:"Infoseek",
	description:"无限公开Infoseek翻译API",
	author:"Dreamsavior",
	version:"1.1",	
	delimiter:"\n\n",
    lineSubstitute : '¶', //¶	
	targetUrl: 'http://translation.infoseek.ne.jp/clsoap/translate',
	languages:{
		"en":"English",
		"ja":"Japanese",
		"ko":"Korean",
		"zh-CN":"Chinese (Simplified)",
		"zh-TW":"Chinese (Traditional)",
		"es":"Spanish",
		"fr":"French",
		"de":"German",
		"pt":"Portuguese",
		"it":"Italian",
		"vi":"Vietnamese",
		"th":"Thai",
		"id":"Indonesian"
	},
	optionsForm:{
	  "schema": {
		"targetURL": {
		  "type": "string",
		  "title": "目标URL",
		  "description": "翻译程序目标URL",
		  "default":"http://translation.infoseek.ne.jp/clsoap/translate",
		  "required":true
		}		
	  },
	  "form": [
		{
		  "key": "targetURL",
		  "onChange": function (evt) {
			var value = $(evt.target).val();
			trans.infoseek.update("targetUrl", value);
			
		  }
		}		
	  ]
	}
});

trans.Infoseek.getLangCode = function(source, target) {
	var msLang = ["id", "vi", "th"]

	var result = "";
	if (msLang.includes(source) || msLang.includes(target)) {
		//msLang
		// below list is probably like this
		var langCode = {
			"en":"EN",
			"ja":"JA",
			"ko":"KO",
			"zh-TW":"ZH-TW",
			"zh-CN":"ZH-CN",
			"fr":"FR",
			"it":"IT",
			"es":"ES",
			"de":"DE",
			"pt":"PT",
			"id":"ID",
			"th":"TH",
			"vi":"VI"
		}
		result = langCode[source]+langCode[target]+"MS";
		
	} else {
		var langCode = {
			"en":"E",
			"ja":"J",
			"ko":"K",
			"zh-TW":"CT",
			"zh-CN":"C",
			"fr":"F",
			"it":"I",
			"es":"S",
			"de":"G",
			"pt":"P",
			"id":"ID",
			"th":"TH",
			"vi":"VI"
		}		
		result = langCode[source]+langCode[target];
	}
	
	return result;
}


trans.Infoseek.translate = function(text, options) {
    if (trans.Infoseek.isDisabled == true) return false;
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
	
	var lineSubstitute = trans.Infoseek.lineSubstitute;
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
            newText.push(str_ireplace(thisTranslator.delimiter, lineSubstitute, text[i]));
        }
        text = newText;
        text = text.join(thisTranslator.delimiter);
    } else {
   
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
  
	
    trans.Infoseek.isTranslating = true;
	thisTranslator.targetUrl = thisTranslator.targetUrl||"https://Infoseek.naver.com/apis/n2mt/translate";
	var theText = trans.Infoseek.escapeCharacter(text);


	var request = require('request');
	var reqOptions = {
		url: thisTranslator.targetUrl,
		method: 'POST',
		headers: {
			'Cross-Licence': 'infoseek/main e3f33620ae053e48cdba30a16b1084b5d69a3a6c',
			'Origin': 'http://translation.infoseek.ne.jp',
			'Referer': 'http://translation.infoseek.ne.jp/',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
		},
		form: {
			e: trans.Infoseek.getLangCode(options.sl, options.tl), 
			t: theText,
			equiv:'true'
		}
	}
	request(reqOptions, function (error, response, body) {
		console.log('error:', error); // Print the error if one occurred
		console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
		console.log('body:'); // Print the HTML for the Google homepage.
		console.log(body);
		if (common.isJSON(body) == false || Boolean(error) ==true) {
			// error
			console.log(arguments);
			trans.Infoseek.isTranslating = false;
			console.log("error translating text");
			if (typeof options.onError == 'function') {
				options.onError.call(trans.Infoseek, {}, {}, {});
			}
			
		} else {
			// success
			
			data = JSON.parse(body);
			console.log(data);
			console.log("translating done : ");
			console.log(data);
			var translatedText = data.t[0].text;
			
			var result = {
				'sourceText':"",
				'translationText':"",
				'source':[],
				'translation':[]
			};
			var dataSplit = translatedText.split(thisTranslator.delimiter);
			console.log(dataSplit);
			/*
			for (var i=0; i<data[0].length; i++) {
				result.sourceText += data[0][i][1];
				result.translationText += data[0][i][0];
			}
			*/
			if (options.agressiveSplitting && options.sl == "ja") {
			   
				//let tStrings = [];
				//let dict = new TranslationDictionary();
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
				result.translationText = fixTranslationFormatting(result.translationText);
				result.translationText = trans.Infoseek.unescapeCharacter(result.translationText);
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
				options.onAfterLoading.call(trans.Infoseek, result, data);
			}
		   
		}
		
		// always
		trans.Infoseek.isTranslating = false;		
	});	

 
}



$(document).ready(function() {
	trans.Infoseek.init();
});