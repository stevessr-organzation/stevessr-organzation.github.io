var trans = trans || {};
trans.atlas =  new TranslatorEngine({
	id:"atlas",
	name: "Atlas",
	description: "使用系统上安装的Atlas translator进行翻译。",
	author:"Dreamsavior",
	version:"1.0",	
	isInitialized: false,
	isDisabled:false,
	columnIndex:1,
	columnHeader: "Atlas",
	maxRequestLength : 3000,
	fileListLoaded: false,
	indexIsBuilt: false,
	skipTranslated:false,
	batchDelay:1,
	skipTranslatedOnBatch :true, // skip lines that already translated when doing TRANSLATE ALL
	lineSubstitute : '<br />'
})


trans.atlas.num2Str = function(num) {
	var n=["o", "i", "u", "e", "a", "x", "y", "z", "v", "l"];
	var ls = num+"".split("");
	var result = "";
	for (var i=0; i<ls.length; i++) {
		result += n[ls[i]];
	}
	return result;
}
trans.atlas.str2Num = function(num) {
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

trans.atlas.restorer = function() {
	var filler = "exy";
	var separator = "q";

	var incomingBuffer = arguments[0].split('Q');
	if (incomingBuffer.length > 2) {
		var result = "";
		for (var i=1; i<incomingBuffer.length; i++) {
			result += trans.atlas.unescapeCharacter("Q"+incomingBuffer[i]);
		}
		return result;
	}
	return "\\"+arguments[2]+"["+trans.atlas.str2Num(arguments[4])+"]";
	//return arguments[1]+filler+separator+num2Str(arguments[2])+separator;
}

trans.atlas.replacer = function(match, p1, p2, p3, offset, string) {
	var filler = "exy";
	var separator = "q";
	return "Q"+arguments[1]+filler+"d"+trans.atlas.num2Str(arguments[2])+"f";
}

trans.atlas.restorerS = function() {
	var filler = "exz";
	var separator = "q";
	//console.log(arguments);
	var incomingBuffer = arguments[0].split('Q');
	if (incomingBuffer.length > 2) {
		var result = "";
		for (var i=1; i<incomingBuffer.length; i++) {
			result += trans.atlas.unescapeCharacter("Q"+incomingBuffer[i]);
		}
		return result;
	}		
	return "\\"+arguments[2]+"<"+arguments[4]+">";
	//return arguments[1]+filler+separator+num2Str(arguments[2])+separator;
}

trans.atlas.replacerS = function(match, p1, p2, p3, offset, string) {
	var filler = "exz";
	var separator = "q";

	//console.log(arguments);
	return "Q"+arguments[1]+filler+"d"+arguments[2]+"f";
}


trans.atlas.unescapeCharacter = function(sentence) {
		//sentence = sentence.replace(/(.)(ely)\s*(\d+)\s*(\*)/g, "\\$1[$3]");
		sentence = sentence.replace(/(Q)(\w+)(exyd)(\w+)(f)/g, trans.atlas.restorer);
		// yanfly
		sentence = sentence.replace(/(Q)(\w+)(exzd)(\w+)(f)/g, trans.atlas.restorerS);
	
	return sentence;
}

trans.atlas.escapeCharacter = function(sentence) {
		//sentence = sentence.replace(/\\(.)\[(\d+)\]/g, "$1ely$2*");
		sentence = sentence.replace(/\\(\w+)\[(\d+)\]/g, trans.atlas.replacer);
		//yanfly's \xyz<text> format
		sentence = sentence.replace(/\\(\w+)\<(\w+)\>/g, trans.atlas.replacerS);
	return sentence;
}



trans.atlas.translate = function(text, options) {
	if (trans.atlas.isDisabled == true) return false;
	if (typeof text=='undefined') return text;
	
	/*
	var lineSubstitute = trans.atlas.lineSubstitute;
	if (typeof text == "string") {
		text = str_ireplace($DV.config.lineSeparator, lineSubstitute, text);
	}
	*/
	if (Array.isArray(text) == false) {
		text = [text];
	}
	var origText = JSON.parse(JSON.stringify(text));
	
	/*
	if (Array.isArray(text)) {
		var newText = [];
		for (var i=0; i<text.length; i++) {
			newText.push(str_ireplace($DV.config.lineSeparator, lineSubstitute, text[i]));
		}
		text = newText;
		text = text.join($DV.config.lineSeparator);
	}
	*/
	
	options = options||{};
	options.sl = options.sl||'ja';
	options.tl = options.tl||'en';
	options.onAfterLoading = options.onAfterLoading||function() {};
	options.onError = options.onError||function() {};
	


	// ============================================================
	/*REGEX FOR escape and unescape 
	Name :
	"\\N[900]".replace(/\\(.)\[(\d+)\]/, "Nely$2*");
	"Nely900*".replace(/(Nely)\s*(\d+)\s*(\*)/, "\\N[$2]");

	===============================================================
	*/
	
	var fixTranslationFormatting = function(string) {
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

	
	for(var i=0; i<text.length; i++) {
		//text[i] = str_ireplace($DV.config.lineSeparator, lineSubstitute, text[i]);
		text[i] = trans.atlas.escapeCharacter(text[i]);
	}
	
	
	console.log("incoming text length : ");
	//console.log(trans.atlas.escapeCharacter(text).length);
	
	
	
	trans.atlas.isTranslating = true;
	
	text.unshift("-n", "-t");
	
	
	common.spawn("3rdParty\\atlas.exe", text , {
		relative:true, 
		onDone: function(rawData) {
			console.log(rawData);
			var data = rawData.split("\r\n[EOL]\r\n");
			data.pop();
			console.log("result is : ");
			console.log(data);
			
			var result = {
				'sourceText':"", 
				'translationText':"",
				'source':[], 
				'translation':[]
			};
			result.translationText = fixTranslationFormatting(data.join("\r\n"));
			result.translationText = trans.atlas.unescapeCharacter(data.join("\r\n"));
			result.source = origText;
			result.sourceText = origText.join("\r\n");
			
			for (var i=0; i<data.length; i++) {
				result.translation[i] = trans.atlas.unescapeCharacter(data[i]);
			}
			
			console.log(result);
			if (typeof options.onAfterLoading == 'function') {
				options.onAfterLoading.call(trans.atlas, result, data);
			}			
			//trans.atlas.isTranslating = false;
		},
		onError:function(data) {
			console.log("error translating data : ");
			console.log(data);
		}
	});
	return true;
	
		
}


trans.atlas.init = function(e) {
	if (trans.atlas.isInitialized) return true;
	
	trans.translator = trans.translator||[];
	trans.translator.push("atlas");
	trans.atlas.isInitialized = true;
}

$(document).ready(function() {
	trans.atlas.init();
});