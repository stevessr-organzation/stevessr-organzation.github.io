var thisAddon = this;
var packageName = thisAddon.package.name;

var thisEngine = new TranslatorEngine({
	id:packageName,
	name:thisAddon.package.title,
	author:"Dreamsavior",
	version:thisAddon.package.version,
	description:thisAddon.package.description,
	batchDelay:1,
	skipReferencePair:true,
	lineDelimiter: "<br>",
	mode: "rowByRow",
	targetUrl:"http://localhost:14366/",
	languages:{
		"en": "English",
		"ja": "Japanese"
	  },
	optionsForm:{
	  "schema": {
		"lineDelimiter": {
		  "type": "string",
		  "title": t("Line delimiter"),
		  "description": t("Fill in with the characters or phrases that will be escaped by the translator (the original phrase and the translation will always be the same). This will guarantee that the number of lines of the translated text is the same as the number of lines of the original text. \nThere are currently no phrases/characters that Sugoi will escape with a 100% success rate.\nYou can try using &#x3C;br&#x3E; with decent amount of success rate.\nLeave blank if you want to concatenate the lines into a single line."),
		  "default":"<br>"
		},
        "targetUrl": {
            "type": "string",
            "title": t("Target URL(s)"),
            "description": t("Translator target URL. You can enter one ore more Sugoi Translator back-end URL. Translator++ will load balance the request across all instance of the services. Separate each entry with a new line."),
            "default":"http://localhost:14366/",
            "required":true,
			"formType":"ace"
        },
		"maxParallelJob": {
            "type": "number",
            "title": t("Max Parallel job"),
            "description": t("Maximum parallel job that run simultaneously."),
            "default":5,
            "required":true
        },
		"sendInBatch": {
            "type": "boolean",
            "title": t("Send requests in batch"),
            "description": t("Send several texts (by Max Parallel job) in array.\nFaster and can cut the execution overhead significantly. You must run the server from server manager to enable this option."),
            "default":false
        },
		"firstLineCommonReference": {
            "type": "boolean",
            "title": t("Check First Line in Common Reference"),
            "description": t("Do not include first line in the payload if the first line is found at Common Reference.\nThis is very useful if the character name is at the first line."),
            "default":false
        },
		"lastLineCommonReference": {
            "type": "boolean",
            "title": t("Check Last Line in Common Reference"),
            "description": t("Do not include last line in the payload if the last line is found at Common Reference.\nThis is very useful if the character name is at the last line."),
            "default":false
        },
		"escapeAlgorithm": {
		  "type": "string",
		  "title": t("Code Escaping Algorithm"),
		  "description": t("Escaping algorithm for inline code inside dialogues (not yet implemented, please wait for the future updates)"),
		  "default":"",
		  "required":false,
		  "enum": [
				"",
				"hexPlaceholder",
				"agressiveSplitting"
			]
		}
	  },
	  "form": [

		{
		  "key": "lineDelimiter",
		  "onChange": function (evt) {
			var value = $(evt.target).val();
			thisEngine.update('lineDelimiter', value);
		  }
		},
        {
            "key": "targetUrl",
			"type": "textarea",
            "onChange": function (evt) {
              var value = $(evt.target).val();
			  var urls = value.replaceAll("\r", "").split("\n");
			  var validUrls = [];
			  thisEngine.targetUrls = [];
			  for (var i in urls) {
				  if (!isValidHttpUrl(urls[i])) continue;
				  validUrls.push(urls[i]);
				  thisEngine.targetUrls.push(urls[i]);
			  }
              thisEngine.update("targetUrl", validUrls.join("\n"));
			  $(evt.target).val(validUrls.join("\n"));
			  thisEngine.servers.init();

            },
			"formType":"ace"
        },
		{
			"type": "actions",
			"title" : "Local Server Manager",
			"fieldHtmlClass": "actionButtonSet",
			"items": [
			  {
				"type": "button",
				"title": "Open server manager",
				"onClick" : async function() {
					thisEngine.openServerManager();
				}
			  }
	
			]
		},
        {
            "key": "maxParallelJob",
            "onChange": function (evt) {
              var value = $(evt.target).val();
              thisEngine.update("maxParallelJob", parseInt(value));
            }
        },
		{
            "key": "sendInBatch",
			"inlinetitle": "Send request in batch",
            "onChange": function (evt) {
              var value = $(evt.target).prop("checked");
              thisEngine.update("sendInBatch", value);
            }
        },
		{
            "key": "firstLineCommonReference",
			"inlinetitle": "Look-up the first line of text in Common Reference",
            "onChange": function (evt) {
              var value = $(evt.target).prop("checked");
              thisEngine.update("firstLineCommonReference", value);
            }
        },
		{
            "key": "lastLineCommonReference",
			"inlinetitle": "Look-up the last line of text in Common Reference",
            "onChange": function (evt) {
              var value = $(evt.target).prop("checked");
              thisEngine.update("lastLineCommonReference", value);
            }
        },
		{
		  "key": "escapeAlgorithm",
		  "titleMap": {
			  "": "Default",
			  "hexPlaceholder": "Hex Placeholder",
			  "none": "No escaping"
		  },
		  "onChange": function (evt) {
			var value = $(evt.target).val();
			thisEngine.update("escapeAlgorithm", value);
			
		  }
		}		
	  ]
	}
});

thisEngine.maxParallelJob = thisEngine.maxParallelJob || 5;

class TextFilter extends HexPlaceholder {
	constructor(text) {
		super(text)

	}
}

TextFilter.prototype.generatePlaceholderId = function(number) {
	return "<br>";
}
  
TextFilter.prototype.getPlaceholder = function(stringKey) {
	if (!this.placeHoldersCopy) this.placeHoldersCopy = common.clone(this.placeHolders);
	// get replacement by the order of appearance
	if (Array.isArray(this.placeHoldersCopy) == false) return "";
	if (this.placeHoldersCopy.length == 0) return "";
	return this.placeHoldersCopy.shift();
}

function isValidHttpUrl(string) {
	let url;
	try {
	  url = new URL(string);
	} catch (_) {
	  return false;  
	}
  
	return url.protocol === "http:" || url.protocol === "https:";
}


thisEngine.localServers = {};
var Servers = function() {
	this.isInitialized = false;
	this.$elm = $('<div></div>');
	this.urls = {}
}
Servers.prototype.on = function(evt, fn) {
    this.$elm.on(evt, fn)
}

Servers.prototype.off = function(evt, fn) {
    this.$elm.off(evt, fn)
}

Servers.prototype.one = function(evt, fn) {
    this.$elm.one(evt, fn)
}

Servers.prototype.trigger = function(evt, param) {
    this.$elm.trigger(evt, param)
}
Servers.prototype.reset = function() {
	this.urls = {}
}
Servers.prototype.init = function() {
	console.log("initializing server list");
	this.reset();
	// building thisEngine.targetUrls

	thisEngine.targetUrl = thisEngine.targetUrl || "";
	var urls = thisEngine.targetUrl.replaceAll("\r", "").split("\n");
	thisEngine.targetUrls = [];
	for (var i in urls) {
		if (!isValidHttpUrl(urls[i])) continue;
		thisEngine.targetUrls.push(urls[i]);
		this.urls[thisEngine.targetUrls[i]] = {}
	}

	this.isInitialized = true;
	return this.isInitialized;
}

Servers.prototype.getIddle = function() {
	if (empty(this.urls)) return [];
	var result = [];
	console.log("checking any iddle server(s) from the list:", this.urls);
	for (var url in this.urls) {
		if (!this.isIddle(url)) continue;
		result.push(url);
	}
	return result;
}

Servers.prototype.isIddle = function(url) {
	this.urls[url] = this.urls[url] || {};
	if (this.urls[url].isBusy) return false;
	if (this.urls[url].isClosed) return false;
	return true;
}

Servers.prototype.isBusy = function(url) {
	this.urls[url] = this.urls[url] || {};
	if (this.urls[url].isBusy) return true;
	return false;
}

Servers.prototype.setBusy = function(url) {
	this.urls[url] = this.urls[url] || {};
	this.urls[url].isBusy = true;
	this.trigger("busy", url);
}

Servers.prototype.setIddle = function(url) {
	this.urls[url] = this.urls[url] || {};
	this.urls[url].isBusy = false;
	this.trigger("iddle", url);
}


Servers.prototype.isOnline = async function(url) {
	try {
        await fetch(url, {
            method		: 'POST',
            body		: JSON.stringify({content: "", message: "status"}),
            headers		: { 'Content-Type': 'application/json' },
        });
        return true;
    } catch (e) {
        return false;
    }
}

Servers.prototype.getUrl = async function() {
	thisEngine.selectedUrl = thisEngine.selectedUrl || 0;
	if (!thisEngine.targetUrls) {
		thisEngine.targetUrl = thisEngine.targetUrl || "";
		var urls = thisEngine.targetUrl.replaceAll("\r", "").split("\n");
		thisEngine.targetUrls = [];
		for (var i in urls) {
			if (!isValidHttpUrl(urls[i])) continue;
			thisEngine.targetUrls.push(urls[i]);
		}
		thisEngine.selectedUrl = 0;
	}

	if (thisEngine.targetUrls.length == 1) return thisEngine.targetUrls[0];

	var result = thisEngine.targetUrls[thisEngine.selectedUrl];
	
	if (thisEngine.selectedUrl >= thisEngine.targetUrls.length-1) {
		thisEngine.selectedUrl = 0;
	} else {
		thisEngine.selectedUrl++;
	}
	return result;
}


thisEngine.servers = new Servers()
thisEngine.on("init", ()=>{
	thisEngine.servers.init();
});

thisEngine.getConfigServerManager = function(key) {
    if (empty(this.servManConfig)) this.loadConfig();
    if (typeof key == undefined) return this.config;
    return this.config[key];
}


thisEngine.openServerManager = function() {
	var path = thisAddon.getPathRelativeToRoot().replaceAll("\\", "/") + "/serverManager.html";
	nw.Window.open(path, {width:440, height:640, id:"sugoiServerManager"}, function(new_win) {
		
	});
}

thisEngine.startServer = function() {
	// start the server
	var path = thisAddon.getPathRelativeToRoot().replaceAll("\\", "/") + "/serverManager.html?startAll=true";
	nw.Window.open(path, {show:false, show_in_taskbar:false, id:"sugoiServerStarter"}, function(new_win) {
		
	});
}

thisEngine.fetchCommonTranslation = async function(text) {
	if (!text) return "";
	thisEngine.wordCache = thisEngine.wordCache || {};
	if (thisEngine.wordCache[text]) return thisEngine.wordCache[text];
	var result = await thisEngine.fetchTranslation([text]);
	if (empty(result)) return text;
	thisEngine.wordCache[text] = result[0];
	return result[0]
}


thisEngine.runBot = function(filepath, options) {

}

/**
 * @param  {Array} texts - Array of string text
 */

thisEngine.fetchTranslation = async function(texts) {
	if (Array.isArray(texts) == false) texts = [texts];
	var escape = (text)=> {
		if (!thisEngine.lineDelimiter) return text;
		text = text.replaceAll(/[\r\n]+/g, thisEngine.lineDelimiter);
		return text;
	}
	
	var unescape = (text)=> {
		text = text.replaceAll("<unk>", "");
		if (!thisEngine.lineDelimiter) return text;
		text = text.replaceAll(thisEngine.lineDelimiter, "\n");
		if (thisEngine.lineDelimiter == "<br>") {
			text = text.replaceAll("<Br>", "\n");
			text = text.replaceAll("<bl>", "\n");
			text = text.replaceAll("「br>", "\n");
			text = text.replaceAll("<br<", "\n");
			text = text.replaceAll("<br】", "\n");
		}

		return text;
	}
	
	var translateNow = async (batchText, defaultUrl)=> {
		console.log("Translating", batchText);
		try {
			var url = defaultUrl || await thisEngine.servers.getUrl()
			thisEngine.servers.setBusy(url);
			
			// escape algorighm
			var escapeAlg = []
			var escaped = [];
			for (var i=0; i<batchText.length; i++) {
				escapeAlg[i] = new SubstituteNumber(batchText[i]);
				escaped[i] = escapeAlg[i].escape();
			}

			var result = await fetch(url, {
				method		: 'post',
				body		: JSON.stringify({content: escaped, message: "translate sentences"}),
				headers		: { 'Content-Type': 'application/json' },
			});



			thisEngine.servers.setIddle(url);
			var translated = await result.json();
			
			// restore 
			for (var i=0; i<translated.length; i++) {
				translated[i] = escapeAlg[i].unescape(translated[i]);
			}

			return translated;
		} catch (e) {
			ui.log("An error has occured when translating with Sugoi Translator:", e.toString());
			ui.log(`Make sure Sugoi Translator server is active and accessible at: ${url}`);
			console.error(e);
			//alert(`Failed to translate with error:\n${e.toString()}\nHave you installed and run Sugoi Japanese Translator?`);
			thisEngine.servers.setIddle(url);
			return "";
		}

	}

	function isNumeric(num){
		return !isNaN(num)
	}

	function finalizeResult(text, original) {
		console.log("finalizeResult", arguments);
		text = unescape(text);
		// removes trailing dot if the original text doesn't contain one
		if (text.charAt(text.length-1) == ".") {
			if (["。", "."].includes(original.charAt(original.length-1)) == false) {
				text = text.substr(0, text.length-1);
			}
		}

		// Capitalize first letter
		text = common.capitalizeFirstLetter(text);
		return text;
	}

	
	var prosesJobBatch = async (texts, url)=>{
		console.log("Proses job in batch", arguments);
		var translatedTexts = [];
		var currentBatch 	= [];
		var batchIndex		= [];
		for (var i=0; i<texts.length; i++) {
			if (empty(texts[i].trim())) {
				translatedTexts[i] = finalizeResult(texts[i], texts[i]);
			} else if (isNumeric(texts[i])) {
				translatedTexts[i] = finalizeResult(texts[i], texts[i]);
			} else if (common.containJapanese(texts[i]) == false) {
				translatedTexts[i] = finalizeResult(texts[i], texts[i]);
			} else {
				var thisText 	= texts[i];
				var lines 		= thisText.replaceAll("\r", "").split("\n");
				var textBody 	= lines.join("\n");
				var translatedFirstLine = "";
				if (thisEngine.firstLineCommonReference) {
					if (lines.length>1) {
						var reference = trans.getReference(lines[0])
						if (trans.getIndexByKey("Common Reference", lines[0])) {
							//console.log("reference found:", lines[0]);
							textBody = lines.slice(1, lines.length).join("\n");
							if (!reference) reference = await thisEngine.fetchCommonTranslation(lines[0]);
							translatedFirstLine = reference+"\n";
							console.log("first line translation:", lines[0], reference);
						}
					}
				}

				var translatedLastLine = "";
				if (thisEngine.lastLineCommonReference) {
					var numOfLine = lines.length-1;
					if (lines.length>1) {
						var reference = trans.getReference(lines[numOfLine])
						if (trans.getIndexByKey("Common Reference", lines[numOfLine])) {
							//console.log("reference found:", lines[numOfLine]);
							textBody = lines.slice(0, lines.length-1).join("\n");
							if (!reference) reference = await thisEngine.fetchCommonTranslation(lines[numOfLine]);
							translatedLastLine = "\n"+reference;
						}
					}
				}

				textBody  = trans.translateByReference(escape(textBody));
				currentBatch.push(textBody);
				var batchData = {
					index:i,
					translatedFirstLine	:translatedFirstLine,
					translatedLastLine	:translatedLastLine
				}
				console.log("Adding batch data:", batchData)
				batchIndex.push(batchData);
			}
		}

		if (!empty(currentBatch)) {
			//console.log("Sending batch");
			var translated 		= await translateNow(currentBatch, url);
			// maping result
			//console.log("translated:", translated);
			for (var i=0; i<batchIndex.length; i++) {
				translatedTexts[batchIndex[i].index] = finalizeResult(batchIndex[i].translatedFirstLine + translated[i] + batchIndex[i].translatedLastLine, texts[i]);
			}
		}
		//console.log("translatedTexts", translatedTexts);
		return translatedTexts;
	}

	// Deprecated
	// send text in array instead
	var prosesJob = async (texts)=>{
		var translatedTexts = [];
		var promises 		= [];
		console.log("texts is", texts);
		for (var i=0; i<texts.length; i++) {
			console.log("texts[i] = ", texts[i]);
			if (empty(texts[i].trim())) {
				promises.push(new Promise((resolve, reject) => {
					var thisIndex	= i;
					var thisText 	= texts[i];
					var result 		= finalizeResult(thisText, thisText);
					translatedTexts[thisIndex] = result;
					resolve(result);
				}));
			} else if (isNumeric(texts[i])) {
				promises.push(new Promise((resolve, reject) => {
					var thisIndex	= i;
					var thisText 	= texts[i];
					var result 		= finalizeResult(thisText, thisText);
					translatedTexts[thisIndex] = result;
					resolve(result);
				}));
			} else if (common.containJapanese(texts[i]) == false) {
				promises.push(new Promise((resolve, reject) => {
					var thisIndex	= i;
					var thisText 	= texts[i];
					var result 		= finalizeResult(thisText, thisText);
					translatedTexts[thisIndex] = result;
					resolve(result);
				}));
			} else {
				promises.push(
					new Promise(async (resolve, reject) => {
						var thisIndex	= i;
						var thisText 	= texts[i];
						var lines 		= thisText.replaceAll("\r", "").split("\n");
						var textBody 	= lines.join("\n");
						var translatedFirstLine = "";
						if (thisEngine.firstLineCommonReference) {
							if (lines.length>1) {
								var reference = trans.getReference(lines[0])
								if (trans.getIndexByKey("Common Reference", lines[0])) {
									console.log("reference found:", lines[0]);
									textBody = lines.slice(1, lines.length).join("\n");
									if (!reference) reference = await thisEngine.fetchCommonTranslation(lines[0]);
									translatedFirstLine = reference+"\n";
								}
							}
						}
						
						var translatedLastLine = "";
						if (thisEngine.lastLineCommonReference) {
							var numOfLine = lines.length-1;
							if (lines.length>1) {
								var reference = trans.getReference(lines[numOfLine])
								if (trans.getIndexByKey("Common Reference", lines[numOfLine])) {
									console.log("reference found:", lines[numOfLine]);
									textBody = lines.slice(0, lines.length-1).join("\n");
									if (!reference) reference = await thisEngine.fetchCommonTranslation(lines[numOfLine]);
									translatedLastLine = "\n"+reference;
								}
							}
						}

						textBody 		= trans.translateByReference(escape(textBody));
						console.log("Sending to translation:\n",textBody);
						var result 		= await translateNow([textBody]);
						result 			= finalizeResult(translatedFirstLine+result+translatedLastLine, thisText);
						translatedTexts[thisIndex] = result;
						resolve(result);
					})
				)
			}

		}
		await Promise.all(promises);
		return translatedTexts;
	}


	var batchHandler = async (parts=[])=> {
		// result is flatened array
		// jobs.flat();
		console.log("Number of parts is------", parts.length, parts);
		var result = [];

		thisEngine.servers.off("iddle");
		thisEngine.servers.on("iddle", (e, url)=>{
			console.log(url, "is iddle!");
		});

		const getUnhandledBatch = ()=> {
			for (var i=0; i<parts.length; i++) {
				if (!result[i]) return i
			}
			return false;
		}

		const urlThread = async (partId, url)=>{
			// book the slot with infinity
			result[partId] = Infinity;

			console.log("urlThread processor", partId, parts[partId], url);
			result[partId] = await prosesJobBatch(parts[partId], url);
			console.log("One process finished");
			var unhandledBatchId = getUnhandledBatch();
			console.log("looking for another batch ID:", unhandledBatchId);
			if (typeof unhandledBatchId == "number") return urlThread(unhandledBatchId, url);

			return;
		}


		var batch = [];
		const iddleServers = thisEngine.servers.getIddle();
		for (var i=0; i<iddleServers.length; i++) {
			console.log("Sending to:", iddleServers[i]);
			if (i >= parts.length) break
			batch.push(urlThread(i, iddleServers[i]));
		}

		await Promise.all(batch);

		return result.flat();
	}

	if (Array.isArray(texts) == false) texts = [texts];
	thisEngine.maxParallelJob = thisEngine.maxParallelJob || 5;
	var results = [];
	var parts 	= common.arrayChunk(texts, thisEngine.maxParallelJob);

	
	if (thisEngine.sendInBatch) {
		results = await batchHandler(parts);
		/*
		// if anything goes wrong, comment out above line and enable this section
		for (var i=0; i<parts.length; i++) {
			results = results.concat(await prosesJobBatch(parts[i]));
		}
		*/
	} else {
		for (var i=0; i<parts.length; i++) {
			results = results.concat(await prosesJob(parts[i]));
			//results = results.concat(await prosesJobBatch(parts[i]));
		}
	}
	
	return results;
}

thisEngine.translate = async function(text, options) {
	console.log("==================================================");
	console.log("thisEngine.translate: ", text);

    if (thisEngine.isDisabled == true) return false;
    if (typeof text=='undefined') return text;
	var thisTranslator = this;
	thisTranslator.escapeAlgorithm = thisTranslator.escapeAlgorithm || "hexPlaceholder";

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
 
   

	//var textObj = thisTranslator.preProcessText(text, options);
	//console.warn("textObj", textObj);
    var data;
	await common.benchmark(async ()=>{
		data = await this.fetchTranslation(text, options.sl, options.tl);   
	})
    console.log("translation process is done with the result: ");
    console.log(data);
    
    var result = {
        'sourceText'		:"",
        'translationText'	:"",
        'source'			:[],
        'translation'		:[]
    };


	result.source 			= text;
	result.translation 		= data;

	for (var i=0; i<result.translation.length; i++) {
		result.translation[i] = result.translation[i].split(thisTranslator.lineSubstitute).join($DV.config.lineSeparator);
	}
   
    console.log(result);
    if (typeof options.onAfterLoading == 'function') {
        options.onAfterLoading.call(thisTranslator, result, data);
    }   

	return new Promise((resolve, reject) => {
		resolve(result);
	});
}


window.trans[packageName] = thisEngine;

$(document).ready(function() {
	thisEngine.init();
	ui.onReady(function() {
		ui.mainMenu.addChild("tools", {
            label	: "Sugoi Translator Server",
			id		: "sugoiTrans"
        });
		var $localServerManager = ui.mainMenu.addChild("sugoiTrans", {
            label	: "Local server manager",
			id		: "sugoiTrans_serverManager"
        });
		var $startServer = ui.mainMenu.addChild("sugoiTrans", {
            label	: "Start all server",
			id		: "sugoiTrans_startServer"
        });

        $localServerManager.on("select", function() {
            thisEngine.openServerManager();
        });

		$startServer.on("select", function() {
            thisEngine.startServer();
        })

	});
});