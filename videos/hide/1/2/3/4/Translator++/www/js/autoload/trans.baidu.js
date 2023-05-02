var trans = trans || {};
trans.baidu = new TranslatorEngine({
	id:"baidu",
	name:"百度",
	description:"无限公开百度翻译API",
	author:"Dreamsavior",
	version: '1.3',
	delimiter:"\n\n",
    lineSubstitute : '§', //¶	
	escapeAlgorithm : 'agressiveSplitting',
	languages:{  
		"auto" : "自动检测",
		"zh-CN" : "简体中文",
		"en" : "英文",
		"yue" : "粤语",
		"wyw" : "文言文",
		"ja" : "日语",
		"ko" : "韩语",
		"fr" : "法语",
		"es" : "西班牙语",
		"th" : "泰语",
		"ar" : "阿拉伯语",
		"ru" : "俄语",
		"pt" : "葡萄牙语",
		"de" : "德语",
		"it" : "意大利语",
		"el" : "希腊语",
		"nl" : "荷兰语",
		"pl" : "波兰语",
		"bg" : "保加利亚语",
		"et" : "爱沙尼亚语",
		"da" : "丹麦语",
		"fi" : "芬兰语",
		"cs" : "捷克语",
		"ro" : "罗马尼亚语",
		"sl" : "斯洛文尼亚语",
		"sv" : "瑞典语",
		"hu" : "匈牙利语",
		"zh-TW" : "繁体中文",
		"vi" : "越南语"
	},
	optionsForm:{
	  "schema": {
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
			trans.baidu.update("escapeAlgorithm", value);
			
		  }
		}		
	  ]
	}
/*
	languages:{  
		"auto" : "Automatic detection",
		"zh" : "Chinese",
		"en" : "English",
		"yue" : "Cantonese",
		"wyw" : "Classical Chinese",
		"jp" : "Japanese",
		"kor" : "Korean",
		"fra" : "French",
		"spa" : "Spanish",
		"th" : "Thai",
		"ara" : "Arabic",
		"ru" : "Russian",
		"pt" : "Portuguese",
		"de" : "German",
		"it" : "Italian",
		"el" : "Greek language",
		"nl" : "Dutch",
		"pl" : "Polish",
		"bul" : "Bulgarian",
		"est" : "Estonian",
		"dan" : "Danish",
		"fin" : "Finnish",
		"cs" : "Czech",
		"rom" : "Romanian",
		"slo" : "Slovenia",
		"swe" : "Swedish",
		"hu" : "Hungarian",
		"cht" : "Traditional Chinese",
		"vie" : "Vietnamese"
	}
*/	
});

trans.baidu.translator = require("baidu-translate-api");

trans.baidu.getLangCode = function(code) {
	let langCodeConv = {
		"zh-CN":"zh",
		"en":"en",
		"yue":"yue",
		"wyw":"wyw",
		"ja":"jp",
		"ko":"kor",
		"fr":"fra",
		"es":"spa",
		"th":"th",
		"ar":"ara",
		"ru":"ru",
		"pt":"pt",
		"de":"de",
		"it":"it",
		"el":"el",
		"nl":"nl",
		"pl":"pl",
		"bg":"bul",
		"et":"est",
		"da":"dan",
		"fi":"fin",
		"cs":"cs",
		"ro":"rom",
		"sl":"slo",
		"sv":"swe",
		"hu":"hu",
		"zh-TW":"cht",
		"vi":"vie"
	}
	
	return langCodeConv[code];
}

trans.baidu.translate = function(text, options) {
    if (trans.baidu.isDisabled == true) return false;
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
   
  
   
    trans.baidu.isTranslating = true;
	trans.baidu.translator(trans.baidu.escapeCharacter(theText), {from:thisTranslator.getLangCode(options.sl), to:thisTranslator.getLangCode(options.tl)})
	.then(function(data) {
        console.log("translating done : ");
        console.log(data);
	
        var result = {
            'sourceText':"",
            'translationText':"",
            'source':[],
            'translation':[]
        };		
		
		var isError = false;
		try {
			data.data.trans_result.data;
		} catch(error) {
			console.log(error);
			isError = true;
		}
		
		var dataSplit = [];
		var sourcePool = [];
        for (var i=0; i<data.data.trans_result.data.length; i++) {
			dataSplit.push(data.data.trans_result.data[i].dst)
            sourcePool.push(data.data.trans_result.data[i].src);
			
        }
		result.translationText = dataSplit.join(thisTranslator.delimiter);
		result.sourceText = sourcePool.join(thisTranslator.delimiter);
		
    
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
		
		trans.baidu.isTranslating = false;		

	});	
	
 
}



$(document).ready(function() {
	trans.baidu.init();
});