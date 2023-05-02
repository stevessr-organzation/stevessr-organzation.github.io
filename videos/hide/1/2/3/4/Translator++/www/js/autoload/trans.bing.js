var trans = trans || {};
trans.bing = new TranslatorEngine({
	id:"bing",
	name:"Bing",
	author:"Dreamsavior",
	version:"1.5",
	description:"公共必应Api",
	delimiter:"<br>",
	targetUrl:"https://www.bing.com/ttranslatev3?isVertical=1&&IG=C77E39ED17F14DB8A228BA247BA98769&IID=translator.5024.2",
	languages:{  
	   "yua":"Yucatec Maya",
	   "auto-detect":"Auto-Detect",
	   "af":"Afrikaans",
	   "ar":"Arabic",
	   "bn-BD":"Bangla",
	   "bs-Latn":"Bosnian (Latin)",
	   "bg":"Bulgarian",
	   "yue":"Cantonese (Traditional)",
	   "ca":"Catalan",
	   "zh-CHS":"Chinese (Simplified)",
	   "zh-CHT":"Chinese (Traditional)",
	   "hr":"Croatian",
	   "cs":"Czech",
	   "da":"Danish",
	   "nl":"Dutch",
	   "en":"English",
	   "et":"Estonian",
	   "fj":"Fijian",
	   "fil":"Filipino",
	   "fi":"Finnish",
	   "fr":"French",
	   "de":"German",
	   "el":"Greek",
	   "ht":"Haitian Creole",
	   "he":"Hebrew",
	   "hi":"Hindi",
	   "mww":"Hmong Daw",
	   "hu":"Hungarian",
	   "is":"Icelandic",
	   "id":"Indonesian",
	   "it":"Italian",
	   "ja":"Japanese",
	   "sw":"Kiswahili",
	   "tlh":"Klingon",
	   "tlh-Qaak":"Klingon (plqaD)",
	   "ko":"Korean",
	   "lv":"Latvian",
	   "lt":"Lithuanian",
	   "mg":"Malagasy",
	   "ms":"Malay (Latin)",
	   "mt":"Maltese",
	   "no":"Norwegian Bokmål",
	   "fa":"Persian",
	   "pl":"Polish",
	   "pt":"Portuguese",
	   "otq":"Querétaro Otomi",
	   "ro":"Romanian",
	   "ru":"Russian",
	   "sm":"Samoan",
	   "sr-Cyrl":"Serbian (Cyrillic)",
	   "sr-Latn":"Serbian (Latin)",
	   "sk":"Slovak",
	   "sl":"Slovenian",
	   "es":"Spanish",
	   "sv":"Swedish",
	   "ty":"Tahitian",
	   "ta":"Tamil",
	   "te":"Telugu",
	   "th":"Thai",
	   "to":"Tongan",
	   "tr":"Turkish",
	   "uk":"Ukrainian",
	   "ur":"Urdu",
	   "vi":"Vietnamese",
	   "cy":"Welsh"
	},
	optionsForm:{
	  "schema": {
		"field1": {
		  "type": "string",
		  "title": "行分隔符",
		  "default":"<br>"
		},
		"targetURL": {
		  "type": "string",
		  "title": "目标URL",
		  "description": "翻译程序目标URL",
		  "default":"https://www.bing.com/ttranslatev3?isVertical=1&&IG=C77E39ED17F14DB8A228BA247BA98769&IID=translator.5024.2",
		  "required":true
		},
        "token": {
            "type": "string",
            "title": "令牌",
            "description": "请求令牌",
            "default":"1sgYtxKBEgUbEm_rNox64-DZZRvX5-i1",
            "required":true
        },
        "key": {
            "type": "string",
            "title": "密钥",
            "description": "密钥",
            "default":"1622020500364",
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
				"hexPlaceholder",
				"agressiveSplitting",
				"none"
			]
		}		
	  },
	  "form": [
		{
		  "key": "field1",
		  "onChange": function (evt) {
			var value = $(evt.target).val();
			trans.bing.update("delimiter", value);
		  }
		},
        {
            "type": "fieldset",
            "title": "资格证书",
            "items": [
                {
                "key": "targetURL",
                "onChange": function (evt) {
                    var value = $(evt.target).val();
                    trans.bing.update("targetUrl", value);
                    
                }
                },
                {
                    "key": "token",
                    "onChange": function (evt) {
                        var value = $(evt.target).val();
                        trans.bing.update("token", value);
                    
                    }
                },
                {
                    "key": "key",
                    "onChange": function (evt) {
                        var value = $(evt.target).val();
                        trans.bing.update("key", value);
                    
                    }
                },
                {
                    "type": "actions",
                    "title" : "生成",
                    "fieldHtmlClass": "actionButtonSet",
                    "items": [
                    {
                        "type": "button",
                        "title": "生成URL、令牌和密钥",
                        "onClick" : function() {
                            alert("生成密钥");
                        }
                    }
                    ]
                },
            ]
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
			trans.bing.update("escapeAlgorithm", value);
			
		  }
		}		
	  ]
	}
});



trans.bing.fetchBingToken = async function() {
    var url = "https://www.bing.com/translator/?text=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF%E4%BB%8A%E6%97%A5%E3%81%AF%E3%81%8A%E5%85%83%E6%B0%97%E3%81%A7%E3%81%99%E3%81%8B%EF%BC%9F&from=ja&to=en";
    var options = options || {};
    options.inject_js_end = "/www/js/helper/intercept_bing.js";
    options.show_in_taskbar = false;
    options.show = false;

    var resolver;
    var promise = new Promise((resolve, reject) => {
        resolver = resolve;
    })

    var timeOut = window.setTimeout(()=>{
        resolver(false);
    }, 10000) // 10 seconds time out

    this.bingWindow;
    // previous window is exist

    this.bingProcessText = (result)=>{
        console.log("received data from intercept window");
        console.log(result);
        resolver(result);
        window.clearTimeout(timeOut);
    }

    if (this.bingWindow) {
        this.bingWindow.window.location.assign(url);
    } else {
        nw.Window.open(url, options, (new_win) => {
            this.bingWindow = new_win;
            new_win.on("closed", ()=>{
                this.bingWindow = undefined;
            })
            new_win.window.onAfterIntercept = (result) => {
                this.bingProcessText(result);
            }
        });	
    }

    /*
    nw.Window.open(url, options, function(new_win) {
        new_win.window.onAfterIntercept = function(result) {
            console.log("received data from intercept window");
            console.log(result);
            resolver(result);
            window.clearTimeout(timeOut);
        }
    });	
    */
    return promise;
}


trans.bing.translate = async function(text, options) {
    if (trans.bing.isDisabled == true) return false;
    if (typeof text=='undefined') return text;
	var thisTranslator = this;
	thisTranslator.escapeAlgorithm = thisTranslator.escapeAlgorithm || "hexPlaceholder";
	var sourceText = text;
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
	
   

    var fetchTranslation = async function() {
        var resolver;
        var promise = new Promise((resolve, reject) => {
            resolver = resolve;
        });
        trans.bing.isTranslating = true;
        $.ajax({
            method: "POST",
            url: thisTranslator.targetUrl,
            beforeSend: function(request) {
            },
            data: {
                fromLang: options.sl, 
                to      : options.tl, 
                text    : filteredText,
                key     : thisTranslator.key,
                token   : thisTranslator.token
            },
        })
        .done(function(data) {
            console.log("Request process returns : ", data);
            if (Array.isArray(data) == false) resolver();
            resolver(data);
            trans.bing.isTranslating = false;
        })
        .always(function() {
            trans.bing.isTranslating = false;
        })
        .error(function(evt, type, errorType) {
            console.log(arguments);
            trans.bing.isTranslating = false;
            console.log("error translating text");
            resolver();
            if (typeof options.onError == 'function') {
               // options.onError.call(trans.bing, evt, type, errorType);
            }
        }) 
        return promise;
    }

    var data = await fetchTranslation();
    if (Boolean(data) == false) {
        // retry by fetching the token
        var interceptResult = await this.fetchBingToken();
        interceptResult = interceptResult || {};
        interceptResult.data = interceptResult.data || {};
        console.log("Refreshing token");
        thisTranslator.targetUrl = interceptResult.url;
        thisTranslator.token = interceptResult.data.token;
        thisTranslator.key = interceptResult.data.key;

        data = await fetchTranslation();
    }

    console.log("translation done : ");
    console.log(data);
    
    var result = {
        'sourceText':"",
        'translationText':"",
        'source':[],
        'translation':[]
    };
    //var dataSplit = data.translationResponse.split(thisTranslator.delimiter);
    result.translationText = data[0].translations[0].text;
    var dataSplit = data[0].translations[0].text.split(thisTranslator.delimiter);
    console.log(dataSplit);


    if (thisTranslator.escapeAlgorithm == "hexPlaceholder" ) {
        result.translationText 	= textObj.hexPlaceholder.restore(result.translationText);
        result.source 			= result.sourceText.split($DV.config.lineSeparator);
        result.translation 		= result.translationText.split($DV.config.lineSeparator);
        
        
    } else if (thisTranslator.escapeAlgorithm == "agressiveSplitting" && options.sl == "ja") {
       
        //let tStrings = [];
        //let dict = new TranslationDictionary();
        var tStrings = textObj.stringCollection;
        for (let i = 0; i < dataSplit.length; i++) {
            textObj.dict.addIndexedTranslation(i, dataSplit[i].replace(/\n/ig, ' '));
        }
        for (let i = 0; i < tStrings.length; i++) {
            result.source.push (tStrings[i].originalString);
            result.translation.push (tStrings[i].getTranslatedString(dict));
        }
        console.log(tStrings);
        
    } else {
        result.translationText 	= fixTranslationFormatting(result.translationText);
        result.translationText 	= thisTranslator.unescapeCharacter(result.translationText);
        result.source 			= result.sourceText.split(thisTranslator.delimiter);
        result.translation 		= result.translationText.split(thisTranslator.delimiter);
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
        options.onAfterLoading.call(trans.bing, result, data);
    }   
   
}



$(document).ready(function() {
	trans.bing.init();
});