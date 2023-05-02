var path 		= require('path');
var iconv 		= require('iconv-lite');
var jEncoding 	= require('encoding-japanese');

var XmlTrans = function(file, options) {
	this.file 		= file
	this.options 	= options || {};
	this.stringEncoding 			= options.stringEncoding || 'Windows-31j'	// translate from Japanese
	// string encoding to write used in createTextBuffer
	this.writeEncoding 				= options.writeEncoding || ''; 
	this.originalEncoding			= ''; 
	
	this.config 					= this.options.config || []
	this.translationPair 			= this.options.translationPair || {}
	this.translationInfo 			= this.options.translationInfo || {};
	this.options.onParseStart 		= this.options.onParseStart || function(){}
	this.options.onParseEnd 		= this.options.onParseEnd || function(){}
	this.onBeforeRender				= this.options.onBeforeRender || function() {};
	this.onAfterRender				= this.options.onAfterRender || function() {};
	this.getTextElement 			= this.options.getTextElement || function(elm) {return elm}
	this.translateElement 			= this.options.translateElement || this.translateElement;
	this.onBeforeWrite				= this.options.onBeforeWrite || this.onBeforeWrite;
	this.currentContext 			= [];
	this.translatableTexts 			= [];
	this.xml						= "";
	this.buffer;
	this.rendered 					= "";
	this.parsed 					= false;
	this.rendered 					= "";
	this.fileName 					= path.basename(file);
}

XmlTrans.prototype.generateTranslation = function() {
	// generate translation and write it into this.translatableTexts
	for (var i=0; i<this.translatableTexts.length; i++) {
		this.translatableTexts[i].translated = this.translate(this.translatableTexts[i].text, this.translatableTexts[i].context);
	}
}
XmlTrans.prototype.onBeforeWrite = function(string) {
	return string;
}

XmlTrans.prototype.write = function(file) {
	return new Promise((resolve, reject) => {
		this.parse()
		.then(() => {
			
			var data = this.render();
			data = this.onBeforeWrite(data);
			//var buffer = iconv.encode(data, this.writeEncoding);
			//var buffer = iconv.encode(data, 'utf8');
			//var buffer = Buffer.from(data);
	
			
			fs.writeFile(file, data, (err)=>{
				if (err) {
					return reject(err);
				}
				
				resolve(file);
				
			})
		})
	})
}

XmlTrans.prototype.xmlToString = function(xmlData) { 
	//console.log("rendering", xmlData)
    var xmlString;
    //IE
    if (window.ActiveXObject){
        xmlString = xmlData.xml;
    }
    // code for Mozilla, Firefox, Opera, etc.
    else{
        xmlString = (new XMLSerializer()).serializeToString(xmlData);
    }
    return xmlString;
}   

/*
XmlTrans.prototype.xmlToString = function(xmlData) { // this functions waits jQuery XML 
	console.log(xmlData);
    var xmlString = undefined;

    if (window.ActiveXObject){
        xmlString = xmlData[0].xml;
    }

    if (xmlString === undefined)
    {
        var oSerializer = new XMLSerializer();
        xmlString = oSerializer.serializeToString(xmlData[0]);
    }

    return xmlString;
}
*/

XmlTrans.prototype.render = function() {
	if (this.rendered !== "") return this.rendered;
	this.onBeforeRender.call(this);
	
	// translate before render
	for (var i=0; i<this.translatableTexts.length; i++) {
		if (this.translatableTexts[i].text == this.translatableTexts[i].translated) continue;
		this.translatableTexts[i].config.translateElement = this.translatableTexts[i].config.translateElement || this.translateElement;
		this.translatableTexts[i].config.translateElement.call(this, this.translatableTexts[i].elm, this.translatableTexts[i].translated)
	}
	
	//var content = $("<div></div>").append($(xmlTrans.xml));
	this.onAfterRender.call(this);
	this.rendered = this.xmlToString(this.xml);
	return this.rendered;
}

XmlTrans.prototype.setConfig = function(config) {
	this.config = config;
}

XmlTrans.prototype.contextEnter = function(strings) {
	if (typeof strings == 'string') strings=[strings]
	for (var i=0; i<strings.length; i++) {
		this.currentContext.push(strings[i])
	}
}

XmlTrans.prototype.contextEnd = function() {
	this.currentContext.pop()
}

XmlTrans.prototype.filterText = function(text) {
	return text;
}

XmlTrans.prototype.translateElement = function(elm, text, config) {
	return $(elm).text(text)[0];
}

XmlTrans.prototype.translate = function(text, contexts) {
	if (typeof text !== 'string') return text;
	if (text.trim() == '') return text;
	
	// compare with exact context match
	// contexts is two dimensional array
	for (var i in contexts) {
		var context = contexts[i];
		var prefix = context.join("/")
		prefix = prefix+"\n";
		if (Boolean(this.translationPair[prefix+text])) return this.translationPair[prefix+text];


		// compare with group
		var sliceLevel = this.translationInfo.groupLevel || 0;
		if (sliceLevel > 0) {
			prefix = context.slice(0, sliceLevel).join("/")
			prefix = prefix+"\n";
			//if (window.monitoringMode) console.log("%cTranslate by group",  'background: #00F; color: #fff', prefix);
			if (Boolean(this.translationPair[prefix+text])) return this.translationPair[prefix+text];
		}
	}
	if (typeof this.translationPair[text] == 'undefined') return text;
	
	return this.translationPair[text];
}

XmlTrans.prototype.appendString = function(string, localContext, $elm, index) {
	// append data into the already existing string
	index = index || this.translatableTexts.length - 1; // last string
	
	var copyContext = JSON.parse(JSON.stringify(this.currentContext))
	localContext = localContext||[];
	if (Array.isArray(localContext) == false) localContext = [localContext];
	copyContext = copyContext.concat(localContext);

	var filteredText = this.filterText(string)	
	if (string.trim().length > 0) {
		this.translatableTexts[index] = this.translatableTexts[index] || {
			text:"",
			elm:[],
			context:[]
		};
		this.translatableTexts[index].text += filteredText
		this.translatableTexts[index].elm.push($elm)
		this.translatableTexts[index].context.push(copyContext)
	}	
}

XmlTrans.prototype.registerString = function(string, localContext, $elm, config) {
	var copyContext = JSON.parse(JSON.stringify(this.currentContext))
	localContext = localContext||[];
	if (Array.isArray(localContext) == false) localContext = [localContext];
	copyContext = copyContext.concat(localContext);

	var filteredText = this.filterText(string)	
	if (string.trim().length > 0) {
		this.translatableTexts.push({
			text:filteredText,
			elm:[$elm],
			context:[copyContext],  // <-- why this is array?
			config:config
		});
	}
}

XmlTrans.prototype.parse = function() {
	return new Promise((resolve, reject) => {
		if (this.parsed) return resolve()
		
		return new Promise((resolve, reject) => {
			fs.readFile(this.file, (err, data) => {
				this.buffer = data;
				this.originalEncoding = jEncoding.detect(this.buffer)
				this.writeEncoding = this.writeEncoding || this.originalEncoding;
				//var dataStr = data.toString();
				//var dataStr = iconv.decode(data, this.stringEncoding);
				var utf8 = Buffer.from(jEncoding.convert(this.buffer, 'UTF8'));
				var dataStr = utf8.toString();
				//console.log(dataStr);
				this.xml = $.parseXML(dataStr);
				this.origData = $.parseXML(dataStr);
				window.dataStr = dataStr;
				//console.log(this.xml);
				return resolve(this.xml);
			})

		})
		.then(() => {
			this.config = this.config || [];
			for (index=0; index<this.config.length; index++) {
				//console.log("Pass here");
				var thisConfig = this.config[index];
			
				if (Boolean(thisConfig.queryString) == false) continue;
				if (typeof thisConfig.queryString == 'string') thisConfig.queryString = [thisConfig.queryString]
				
				var $target = $(this.xml);
				for (var i=0; i<thisConfig.queryString.length; i++) {
					$target 	= $target.find(thisConfig.queryString[i]);
				}
				//console.log($target);
				if ($target.length == 0) continue;
				thisConfig.onBeforeRegisterString = thisConfig.onBeforeRegisterString || function() {return true}
				thisConfig.onAfterRegisterString = thisConfig.onAfterRegisterString || function() {return true}
				thisConfig.getTextElement = thisConfig.getTextElement || this.getTextElement;
				
				//console.log($target);
				for (var i=0; i<$target.length; i++) {
					var $thisString = $($target[i])
					
					//var string = $thisString.find("string");
					//console.log($thisString.text())
					var text = $thisString.text();
					//if (text == "") continue;
					var thisParents = $thisString.parentsUntil();
					var context = [];

					for (var x=0; x<thisParents.length; x++) {
						var thisIndex = $(thisParents[x]).parent().children().index(thisParents[x])
						if (thisIndex > -1) context.unshift(thisIndex);
						context.unshift(thisParents[x].localName);
					}
					//context.unshift(this.fileName);
					//console.log(context);
					if (thisConfig.onBeforeRegisterString.call(this, text, context, thisConfig.getTextElement($target[i]), thisConfig)) {
						this.registerString.call(this, text, context, thisConfig.getTextElement($target[i]), thisConfig)
					}
					thisConfig.onAfterRegisterString.call(this, text, context, thisConfig.getTextElement($target[i]), thisConfig)
					
				}
			}
			return;
		})
		.then(() => {
			this.generateTranslation();
			this.parsed = true;
			
			resolve();
			
		})
	})

}

this.XmlTrans = XmlTrans;

//var queryString = "string";
/*
var xmlTrans = new XmlTrans('F:\\GDrive\\Other\\Translator++\\notes\\rm2k-2k3\\Map0001.emu',
{
	config: [
		{
			queryString : "events string",
			onBeforeRegisterString : function(text, context, targetElm) {
				var $targetElm = $(targetElm);
				var code = $targetElm.find("code").text();
				console.log("this event code is : ", code);
				if (code !== "20110") return true;
				
				this.appendString("\n"+text, context, targetElm);
				
			}			
		}
	],

	getTextElement : function(elm) {
		var $elm = $(elm);
		return $elm.parent()[0];
	},
	
	translateElement : function(elm, text, config) {
		
		var $elm = $(elm)
		if ($elm.eq(0).find("code").text() !== "10110") return $(elm).text(text)[0];

		var texts = text.split("\n");
		for (var i=0 ; i<texts.length; i++) {
			var $thisElm = $(elm[0]).clone(true, true);
			if (i%4 !== 0)  {
				$thisElm.find('code').text("20110");
			} 
			$thisElm.find('string').text(texts[i]);
			$thisElm.insertBefore($elm.eq(0))
		}
		
		for (var i=0; i<elm.length; i++) {
			$(elm[i]).remove();
		}
		
	},
	
	translationPair : {
		"Testing" : "uji coba",
		"Message group2\nMessage group2-line2" : "Translation\nTranslation\nTranslation"
	}

})
*/
//var xmlTrans = new XmlTrans('F:\\GDrive\\Other\\Translator++\\notes\\rm2k-2k3\\Map0001.emu',
var xmlTrans = new XmlTrans('F:\\GDrive\\Other\\Translator++\\notes\\rm2k-2k3\\RPG_RT.edb',
{
		config: [
			{
				queryString : "event_commands string",
				onBeforeRegisterString : function(text, context, targetElm) {
					var $targetElm = $(targetElm);
					var code = $targetElm.find("code").text();
					console.log("this event code is : ", code);
					if (code !== "20110") return true;
					
					this.appendString("\n"+text, context, targetElm);
					
				},
				getTextElement : function(elm) {
					var $elm = $(elm);
					return $elm.parent()[0]; // return parent instead of self element
				},
				translateElement : function(elm, text, config) {
					
					var $elm = $(elm)
					var code = $elm.eq(0).find("code").text()
					if (code !== "10110" && code !== "20110") {
						$(elm).find("string").text(text);
						return $(elm)[0];
					}
	
					// in the case of 
					var texts = text.split("\n");
					for (var i=0 ; i<texts.length; i++) {
						var $thisElm = $(elm[0]).clone(true, true);
						if (i%4 !== 0)  {
							$thisElm.find('code').text("20110");
						} 
						$thisElm.find('string').text(texts[i]);
						$thisElm.insertBefore($elm.eq(0))
					}
					
					for (var i=0; i<elm.length; i++) {
						$(elm[i]).remove();
					}
					
				}
				
			},
			{
				queryString : "name, description, terms>Terms>*, states message_actor, states message_enemy, states message_already, states message_affected, states message_recovery, skills using_message1,  skills using_message2, actors title",
			}
		],
	
	translationPair : {
		"Testing" : "uji coba",
		"Message group2\nMessage group2-line2" : "Translation\nTranslation\nTranslation",
		"Message on common events" : "Translation on ce",
		"EV0001" : "nama event"
		
	}

})


