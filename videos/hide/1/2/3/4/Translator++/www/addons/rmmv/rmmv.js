var thisAddon 	= this;
var appName 	= this.package.name;
var spawn 		= spawn || require('child_process').spawn;
var ws 			= ws || require('windows-shortcuts');
var ini 		= ini || require('ini')
var bCopy 		= require('better-copy');
var fse 		= require('fs-extra');
var gameEngine = "rmmv";

thisAddon.debugLevel = 0;
thisAddon.config.maxLineMessage = thisAddon.config.maxLineMessage || 4;
this.optionsForm = {
	/*	
		"maxLineMessage": {
			"type": "number",
			"title": "Maximum number of line in message box.",
			"description": "Default value is 4. Type 0 to disable this feature. If the number of line in message box is greater than this number, Translator++ will generates a new message box to prevents the texts overflowing the boxes.",
			"HOOK": "thisAddon.config.maxLineMessage"
		},	
	*/	
		"booleanValue": {
			"type": "boolean",
			"title": "使用遗留解析器",
			"description": "使用之前的旧解析器（Translator++3.8.12版）。旧的解析器不支持一些新添加的特性。",
			"HOOK": "thisAddon.config.useLegacyParser",
			"inlinetitle": "使用旧解析器",
			"fieldHtmlClass":"flipSwitch"
		},
		"beautifyJSON": {
			"type": "boolean",
			"title": "美化JSON数据",
			"description": "选中后，生成的数据将被美化。",
			"HOOK": "thisAddon.config.beautifyJSON",
			"inlinetitle": "美化JSON数据",
			"fieldHtmlClass":"flipSwitch"
		}
		
}


class RMMVData extends require("www/js/ParserBase.js").ParserBase {
	constructor(obj, options, callback) {
		super(obj, options, callback)
		this.debugLevel = thisAddon.debugLevel;
		this.currentEntryPoint = {};
		this.transData = {
			data:[],
			context:[],
			tags:[],
			parameters:[],
			indexIds:{}
		};
	}
}
RMMVData.RPGM_EVENT_CODE = {
	"0": "Empty",
	"101": "Show Text Attributes",
	"102": "Show Choices",
	"103": "Input Number",
	"104": "Select Key Item",
	"105": "Show Scrolling Text Attributes",
	"108": "Comment",
	"111": "Conditional Branch",
	"112": "Loop",
	"113": "Break Loop",
	"115": "Exit Event Processing",
	"117": "Call Common Event",
	"118": "Label",
	"119": "Jump to Label",
	"121": "Control Switches",
	"122": "Control Variables",
	"123": "Control Self Switch",
	"124": "Control Timer",
	"125": "Change Gold",
	"126": "Change Items",
	"127": "Change Weapons",
	"128": "Change Armor",
	"129": "Change Party Member",
	"132": "Change Battle BGM",
	"133": "Change Battle End ME",
	"134": "Change Save Access",
	"135": "Change Menu Access",
	"136": "Change Encounter",
	"137": "Change Formation Access",
	"138": "Change Window Color",
	"201": "Transfer Player",
	"202": "Set Vehicle Location",
	"203": "Set Event Location",
	"204": "Scroll Map",
	"205": "Set Move Route",
	"206": "Get on/off Vehicle",
	"211": "Change Transparency",
	"212": "Show Animation",
	"213": "Shot Balloon Icon",
	"214": "Erase Event",
	"216": "Change Player Followers",
	"217": "Gather Followers",
	"221": "Fadeout Screen",
	"222": "Fadein Screen",
	"223": "Tint Screen",
	"224": "Flash Screen",
	"225": "Shake Screen",
	"230": "Wait",
	"231": "Show Picture",
	"232": "Move Picture",
	"233": "Rotate Picture",
	"234": "Tint Picture",
	"235": "Erase Picture",
	"236": "Set Weather Effects",
	"241": "Play BGM",
	"242": "Fadeout BGM",
	"243": "Save BGM",
	"244": "Replay BGM",
	"245": "Play BGS",
	"246": "Fadeout BGS",
	"249": "Play ME",
	"250": "Play SE",
	"251": "Stop SE",
	"261": "Play Movie",
	"281": "Change Map Display",
	"282": "Change Tileset",
	"283": "Change Battle Back",
	"284": "Change Parallax Back",
	"285": "Get Location Info",
	"301": "Battle Processing",
	"302": "Shop Processing",
	"303": "Name Input Processing",
	"311": "Change HP",
	"312": "Change MP",
	"313": "Change State",
	"314": "Recover All",
	"315": "Change EXP",
	"316": "Change Level",
	"317": "Change Parameters",
	"318": "Change Skills",
	"319": "Change Equipment",
	"320": "Change Actor Name",
	"321": "Change Actor Class",
	"322": "Change Actor Graphic",
	"323": "Change Vehicle Graphic",
	"324": "Change Actor Nickname",
	"325": "Change Actor Profile",
	"331": "Change Enemy HP",
	"332": "Change Enemy MP",
	"333": "Change Enemy State",
	"334": "Enemy Recover All",
	"335": "Enemy Appear",
	"336": "Enemy Transform",
	"337": "Show Battle Animation",
	"339": "Force Action",
	"340": "Abort Battle",
	"351": "Open Menu Screen",
	"352": "Open Save Screen",
	"353": "Game Over",
	"354": "Return to Title Screen",
	"355": "Script Header",
	"356": "Plugin Command",
	"401": "Show Text",
	"402": "Choice",
	"403": "Choice Cancel",
	"404": "Choices End",
	"405": "Show Scrolling Text",
	"408": "Comment More",
	"411": "Else",
	"412": "Branch End",
	"413": "Repeat Above",
	"601": "If Win",
	"602": "If Escape",
	"603": "If Lose",
	"604": "Battle Processing End",
	"605": "Shop Item",
	"655": "Script"
  }

RMMVData.determineType = function($path) {
	var fileName = nwPath.basename($path, nwPath.extname($path));
	if (/Map[0-9]+/g.test(fileName)) {
		return "map"
	} else {
		return fileName.toLowerCase();
	}
}


RMMVData.prototype.MV_buildTextList = function($text, $header) {
	// $splitEach 0 ... then no split;
	// Show message are $splitEach = 4
	$text = $text.replaceAll("\r", "");
	var $textArray = $text.split("\n");
	
	var $LIST =[];
	for (var $key=0; $key<$textArray.length; $key++) { 
		var $line = $textArray[$key];
		if (($key+1)%4 == 1) {
			$LIST.push($header);
		}
		var $newRow = {};
		$newRow['code'] = 401;
		$newRow['indent'] = $header['indent'];
		$newRow['parameters'] = [$line];
		$LIST.push($newRow);
	}
	return $LIST;
}

RMMVData.prototype.MV_buildScrollTextList = function($text, $header) {
	$text = $text.replaceAll("\r", "");
	var $textArray = $text.split("\n");
	
	var $LIST =[];
	$LIST.push($header);
	for (var $key=0; $key<$textArray.length; $key++) { 
		var $line = $textArray[$key];
		var $newRow = {};
		$newRow['code'] = 405;
		$newRow['indent'] = $header['indent'];
		$newRow['parameters'] = [$line];
		$LIST.push($newRow);
	}
	return $LIST;
}


RMMVData.prototype.applyTranslation = function(translation, localContext, parameters, options) {
	console.log("Entering applyTranslation", arguments);
}


RMMVData.prototype.registerStringObject = function(obj, key, parameters, options) {
	var translation = this.registerString(obj[key], parameters, options);
	// apply translation
	obj[key] = translation;
	return translation;
}

RMMVData.prototype.fetchCommonData = function($data, $fetchData, $parentContext, options) {
	options = options || {};
	options.currentAddress = options.currentAddress || [];
	console.log("parsing common data");
	if (empty($data)) return false;
	console.log("incoming data is:", $data);

	// create a copy of data;
	//this.translatedData = common.clone($data);


	for ($i=1; $i<$data.length; $i++) {
		if (empty($data[$i])) continue;

		for ($fetch=0; $fetch<$fetchData.length; $fetch++) {
			if (!Boolean($data[$i][$fetchData[$fetch]])) continue; // will allow blank if only this
			if (empty($data[$i][$fetchData[$fetch]])) continue;
			//var context = common.clone($parentContext);
			//context.push($i, $fetchData[$fetch]);
			var context = $parentContext.concat([$i, $fetchData[$fetch]]);
			var thisCurrentAddress = options.currentAddress.concat([$i, $fetchData[$fetch]]);
			//this.registerString($data[$i][$fetchData[$fetch]], context, {});
			this.registerStringObject($data[$i], $fetchData[$fetch], context, [], {currentAddress:thisCurrentAddress})

		}
	}

	if (this.writeMode) this.writableObj = $data;
	return this;
}

RMMVData.prototype.buildScriptList = function(text, headerParam, translatedList) {
	console.log(">>buildScriptList", arguments);
	translatedList = translatedList || [];
	text = text.replaceAll("\r", "");
	var textArray = text.split("\n");

	console.log("Text array:", textArray);
	// first line is on header
	//translatedList.push(RMData.generateEventCommandData(headerParam.i, 355, textArray[0]));
	translatedList.push(
		{
			"code": 355,
			"indent": headerParam.indent,
			"parameters": [textArray[0]]
		  }	
	);
	for (var i=1; i<textArray.length; i++) {
		translatedList.push(
			{
				"code": 655,
				"indent": headerParam.indent,
				"parameters": [textArray[i]]
			  }
		);
	}
	console.log("script list", translatedList);
	return translatedList;
}

/**
 * Enter the index of choice header to process choice members
 * @param  {Array} pageList - Array of commands
 * @param  {Number} index - Index of the choice header
 * @param  {Array} context - parent context
 * @returns {Object} translated pageList[index]
 */
RMMVData.prototype.fetchChoices = function(pageList, index, context) {
	// this command = choice header
	var currentLine = pageList[index];
	var thisTexts 	= currentLine.parameters[0]; // array of texts

	/*
		{
			choiceStr: id
		}
	*/
	var choices = []; 

	if (empty(thisTexts)) return currentLine;

	for (x=0; x<thisTexts.length; x++) {
		var thisText 	= thisTexts[x];
		var thisContext = context.concat([index, `${x+1}from${thisTexts.length}`]);
		var translation = this.registerString(thisText, thisContext, [], {});
		this.setEntryPointValue(thisTexts, x, translation);

		// create index
		choices[x] = {
			originalText	:thisText,
			indent			:currentLine.indent,
			translation		:translation
		}		
	}	

	// Choice member are translated directly without registering

	var processed = 0;

	// the rest of the choice is current indent + 1
	//var expectedIndent = currentLine.indent+1;
	for (var i=index+1; i<pageList.length; i++) {
		var currentPage = pageList[i];
		if (currentPage.code !== 402) continue;
		if (currentPage.indent !== currentLine.indent) continue;

		var currentChoice = choices[processed];
		if (Boolean(currentChoice) == false) continue;

		currentPage.parameters[1] = currentChoice.translation;

		processed++;
		if (processed >= choices.length) break;

	}

	// returns mutated currentLine
	return currentLine;
}


RMMVData.prototype.fetchEventPages = async function($eventPages, $parentContext, $RESULT = {}) {
	console.log("handling Event pages", arguments);
	if (!Array.isArray($eventPages)) return false;


	// create result
	var translatedPage = common.clone($eventPages);

	for(var $keyPage=0; $keyPage<$eventPages.length; $keyPage++) {
		var $page = $eventPages[$keyPage];
		console.log(`共页索引 ${$keyPage} 是：`, $page);
		if (empty($page)) continue;
		console.log("page is not empty");
		if (empty($page['list'])) continue;
		
		// reset list for translatedPage
		translatedPage[$keyPage].list = [];


		var $messagePossition		= ["top", "middle", "bottom"];
		var $currentTextParam 		= {};
		var $currentLongTextParam 	= {};
		var last101 				= {};
		var last105 				= {};
		var last355 				= {};
		var scriptStack 			= [];
		var currentScriptParam 		= {};
		var $currentText 			= [];
		var $currentLongText 		= [];

		for ($i=0; $i<$page['list'].length; $i++) {
			var $currentLine = $page['list'][$i];
			var $thisObj = {};
			//console.log("handling command", $currentLine);
			// process current text buffer when not 401
			if (!empty($currentText) && $page['list'][$i]['code'] != 401) {
				console.log("registering texts", $currentText);
				var $pictureStatus = "noPicture";
				if (!empty($currentTextParam['headerParam'][0])) $pictureStatus = "hasPicture";

				
				var context = common.clone($parentContext);
				context.push($keyPage, "list", $currentTextParam['headerIndex'], "message", $pictureStatus, $messagePossition[$currentTextParam['headerParam'][3]]);
				var translation = this.registerString($currentText.join("\n"), context, $currentTextParam);
				console.log("Translation: ", translation);
				if (this.writeMode) {
					var newList = this.MV_buildTextList(translation, last101);
					console.log("Generating list based on translation:", newList);
					translatedPage[$keyPage].list = translatedPage[$keyPage].list.concat(newList);
				}

				$currentText = [];
			}
			
			if (!empty($currentLongText) && $page['list'][$i]['code'] != 405) {

				var context = common.clone($parentContext);
				context.push($keyPage, "list", $currentLongTextParam['headerIndex'], "scrollingMessage");
				var translation = this.registerString($currentLongText.join("\n"), context, $currentLongTextParam);
				if (this.writeMode) {
					var newList = this.MV_buildScrollTextList(translation, last105);
					console.log("Generating list based on translation:", newList);
					translatedPage[$keyPage].list = translatedPage[$keyPage].list.concat(newList);
				}
				$currentLongText = [];
			}

			if (scriptStack.length>0 && $page.list[$i].code !== 655) {
				// end of text stack
				console.log("executing scriptstack");
	
				var context = common.clone($parentContext);
				context.push($keyPage, "list", currentScriptParam.headerIndex, "script");
	
				// this is raw script
				var script = scriptStack.join("\n");
	
				// for raw viewer store raw script as Attachment, because we won't save the code into files.
				var attachmentName = "scriptCommand/"+common.generateId()+".js";
	
				
				console.log("registering string within event's JS code.");
				var copyOptions = common.clone(this.options);
					copyOptions.baseContext 	= context;
					copyOptions.baseParameter 	= {attachment:attachmentName}
					copyOptions.baseTags		= ["red"];
					copyOptions.translationPair = this.translationPair;
					copyOptions.translationInfo = this.translationInfo;
				var scriptObj = new ESScript(script, copyOptions);
				await scriptObj.parse();

				console.log("ScriptObj:", scriptObj);
				// produce translated script from scriptObj
				script = scriptObj.toString();
				console.log("parsed text below:\n", script);
				// import transData from scriptObj into rmData
				this.importTransData(scriptObj);
	
				// assign attachment only if has atleast one translatable string / data length > 0
				if (scriptObj.transData.data.length > 0) {
					RMMVGames.lastAttachments[attachmentName] = new Attachment({
						type:"text/javascript",
						data:script
					})
				}
	
				//var translation = this.registerString(script, context, last355);
				if (thisAddon.debugLevel > 2)console.log(">>Generated combined text:", script);
				
				this.buildScriptList(script, last355, translatedPage[$keyPage].list);
	
				scriptStack = [];
			}
			
			switch($page['list'][$i]['code']) {
				// handling interpolatable texts
				case 101: //text parameters
					$currentTextParam['headerIndex'] = $i;
					$currentTextParam['headerParam'] = $page['list'][$i]['parameters'];
					$currentText = [];
					last101 = $currentLine;
					break;
				case 105: //start text scroll
					$currentLongTextParam['headerIndex'] = $i;
					$currentLongTextParam['headerParam'] = $page['list'][$i]['parameters'];
					$currentLongText = [];
					last105 = $currentLine;
					break;
				case 401: //text
					//console.log("pushing text:", $currentLine['parameters'][0]);
					$currentText.push($currentLine['parameters'][0]);
					break;
				case 405: //long text
					$currentLongText.push($currentLine['parameters'][0]);
					break;

				
				case 355: //Script Header
					console.log("Code 355", $currentLine);
					scriptStack = [];
					currentScriptParam.headerIndex = $i;
					currentScriptParam.headerParam = $currentLine.parameters;
					last355 = $currentLine;
					scriptStack.push($currentLine.parameters[0]);
					break;					
				case 655: //Script
					console.log("Code 655", $currentLine);
					scriptStack.push($currentLine.parameters[0]);
					break;	
				

				// handling non interpolatable texts
				/*
				case 122: //set variable
					var thisText = $currentLine.parameters[4];
					if (typeof thisText !== 'string') {
						translatedPage[$keyPage].list.push($currentLine);
						break;
					}
					var context = common.clone($parentContext);
					context.push($keyPage, "list", $i, RMMVData.RPGM_EVENT_CODE[$page.list[$i].code], "var:"+$currentLine.parameters[0]+"-"+$currentLine.parameters[1]);
					
					var translation = this.registerString(thisText, context, [], {tags: ["red"]});
					this.setEntryPointValue($currentLine.parameters, 4, translation);
					translatedPage[$keyPage].list.push($currentLine);
					break;
				*/
				case 122: //set variable
					var thisText = $currentLine.parameters[4];
					if (typeof thisText !== 'string') {
						translatedPage[$keyPage].list.push($currentLine);
						break;
					}
					var context = common.clone($parentContext);
					context.push($keyPage, "list", $i, RMMVData.RPGM_EVENT_CODE[$page.list[$i].code], "var:"+$currentLine.parameters[0]+"-"+$currentLine.parameters[1]);
					
					var attachmentName = "scriptCommand/"+common.generateId()+".js";
					var copyOptions = common.clone(this.options);
					copyOptions.baseContext 	= context;
					copyOptions.baseParameter 	= {attachment:attachmentName}
					copyOptions.baseTags		= ["red"];
					var scriptObj = new ESScript(thisText, copyOptions);
					await scriptObj.parse();
					
					// translate thisText;
					thisText = scriptObj.toString();
					// import transData from scriptObj into rmData
					this.importTransData(scriptObj);
		
					// assign attachment only if has atleast one translatable string / data length > 0
					if (scriptObj.transData.data.length > 0) {
						RMMVGames.lastAttachments[attachmentName] = new Attachment({
							type:"text/javascript",
							data:thisText
						})
					}

					// apply new text into $currentLine
					$currentLine.parameters[4] = thisText;
					translatedPage[$keyPage].list.push($currentLine);

					break;
				case 102: //choice header
					var context = common.clone($parentContext);
					context.push($keyPage, "list", $i, RMMVData.RPGM_EVENT_CODE[$page.list[$i].code]);

					var translatedLine = this.fetchChoices($page.list, $i, context);
					translatedPage[$keyPage].list.push(translatedLine);
					
					break;
				/*				
				case 402: //choice. NO NEED, handled in choice header
					var thisText = $currentLine['parameters'][1];
					if (typeof thisText !== 'string') {
						translatedPage[$keyPage].list.push($currentLine);
						break;
					}
					var context = common.clone($parentContext);
					context.push($keyPage, "list", $i, RMMVData['RPGM_EVENT_CODE'][$page['list'][$i]['code']]);
					var translation = this.registerString(thisText, context, [], {});
					this.setEntryPointValue($currentLine['parameters'], 1, translation);
					translatedPage[$keyPage].list.push($currentLine);

					break;
				*/				
				case 320: //Change name
				case 324: //Change nick name
				case 325: //Change profile
					var thisText = $currentLine.parameters[1];
					if (typeof thisText !== 'string') {
						translatedPage[$keyPage].list.push($currentLine);
						break;
					}
					var context = common.clone($parentContext);
					context.push($keyPage, "list", $i, RMMVData.RPGM_EVENT_CODE[$page.list[$i].code], "charId:"+$currentLine.parameters[0]);
					var translation = this.registerString(thisText, context, [], {});
					this.setEntryPointValue($currentLine.parameters, 1, translation);
					translatedPage[$keyPage].list.push($currentLine);
				
					break;
					
				//case 355: //Script Header
				//case 655: //Script
				case 356: //plugin command
					var thisText = $currentLine['parameters'][0];
					if (typeof thisText !== 'string') {
						translatedPage[$keyPage].list.push($currentLine);
						break;
					}
					var context = common.clone($parentContext);
					context.push($keyPage, "list", $i, RMMVData['RPGM_EVENT_CODE'][$page['list'][$i]['code']]);
					var translation = this.registerString(thisText, context, [], {tags:["red"]});
					this.setEntryPointValue($currentLine['parameters'], 0, translation);
					translatedPage[$keyPage].list.push($currentLine);
				
					break;
				
				default:
					translatedPage[$keyPage].list.push($currentLine);
			}
		}
	}

	this.parsed = $RESULT;
	console.log(">>>Translated page:", translatedPage);
	return translatedPage;
}

RMMVData.prototype.fetchSystem = function($system, $parentContext, $currentData = []) {
	
	if (!empty($system['gameTitle'])) {

		if (this.debugLevel>1) console.log("Fetch gameTitle");
		var context = $parentContext.concat(["gameTitle"]);
		this.registerStringObject($system, 'gameTitle', context, [], {currentAddress : ["gameTitle"]})
		this.gameTitle = $system['gameTitle'];
		RMMVData.lastGameTitle = $system['gameTitle'];
	}

	var $type = ['armorTypes', 'elements', 'equipTypes', 'skillTypes', 'weaponTypes'];	
	for (var $i in $type) {
		var $key = $type[$i];
		if (empty($system[$key])) continue;
		for (var $thisKey in $system[$key] ) {
			var $thisText = $system[$key][$thisKey];
			if (empty($thisText)) continue;
			
			//$currentData = this.appendResultData($currentData, $newData);
			if (this.debugLevel>2) console.log(">>>Fetch type definition: "+$key);
			if (this.debugLevel>2) console.log($system[$key], $thisKey, ">>", $system[$key][$thisKey]);

			var context = $parentContext.concat([$key, $thisKey]);
			//this.registerString($thisText, context, [], {currentAddress : [$key, $thisKey]})
			this.registerStringObject($system[$key], $thisKey, context, [], {currentAddress : [$key, $thisKey]})
	
		}
	}
	
	for (var $key in $system['terms']) {
		var $terms = $system['terms'][$key];
		for (var $thisKey in $terms) {
			var $thisText = $terms[$thisKey];
			if (Boolean($thisText) == false) continue;

			if (this.debugLevel>2) console.log(">>>Fetch terms");
			if (this.debugLevel>2) console.log("$terms:", $terms);
			if (this.debugLevel>2) console.log("$thisKey:", $thisKey);
			if (this.debugLevel>2) console.log("$terms[$thisKey]:", $terms[$thisKey]);
			var context = $parentContext.concat(["terms", $key, $thisKey]);
			//this.registerString($thisText, context, [], {currentAddress : ["terms", $key, $thisKey]})
			this.registerStringObject($terms, $thisKey, context, [], {currentAddress : ["terms", $key, $thisKey]})

		}
	}
	
	//this.parsed = $currentData;
	if (this.writeMode) this.writableObj = $system;
	return this;
}

RMMVData.mergeDeep = function(target, ...sources) {
	if (!sources.length) return target;
	const source = sources.shift();
  
	if (typeof target == "object" && typeof source == "object") {
	  for (const key in source) {
		if (typeof source[key] == "object") {
		  if (!target[key]) Object.assign(target, { [key]: {} });
		  this.mergeDeep(target[key], source[key]);
		} else {
		  Object.assign(target, { [key]: source[key] });
		}
	  }
	}
  
	return this.mergeDeep(target, ...sources);
}

RMMVData.prototype.appendResultData = function($currentData, $newData) {
	if (!Array.isArray($currentData)) return false;
	if (empty($newData['text'])) return $currentData;

	if (!empty($currentData[$newData['text']])) {
		$currentData[$newData['text']] = RMMVData.mergeDeep($currentData[$newData['text']], $newData);
		$currentData[$newData['text']]['text'] = $newData['text'];
	} else {
		$currentData[$newData['text']] = $newData;
	}
	return $currentData;
}

RMMVData.prototype.fetchFromOtherJson = function(obj, context, translationPair) {
	obj = obj || this.obj;
	obj = common.clone(obj);
	translationPair = translationPair || this.translationPair;

	if (!Boolean(context)) context = [];
	if (Array.isArray(context) == false) context = [context];

	var fetchChild = (childObj, localContext) => {
		// create new clone of localContext
		if (Array.isArray(localContext) == false) localContext = [localContext];

		for (var i in childObj) {
			var newContext = common.clone(localContext);
			newContext.push(i);
			if (Boolean(childObj[i]) == false) continue
			if (common.isNumeric(childObj[i])) continue;
			if (typeof childObj[i] == 'object') {
				fetchChild(childObj[i], newContext);
			} else if (typeof childObj[i] == 'string') {
				//var contextString = newContext.join("/");
				//if (contextString.includes("parameters") == false) continue;
				//if (RMMV.isCommonOperatorString(childObj[i])) continue;
				if (!common.isTranslatableText(childObj[i])) continue;				
				
				//childObj[i] = this.registerString(childObj[i], newContext);
				childObj[i] = this.registerStringObject(childObj, i, newContext);
			}
			
		}
	}

	fetchChild(obj, context);
	this.writableObj = obj;
	return this;
}

RMMVData.prototype.setEntryPoint = function(obj, key) {
	this.currentEntryPoint.obj = obj;
	this.currentEntryPoint.key = key;
}

RMMVData.prototype.setEntryPointValue = function(obj, key, value) {
	this.currentEntryPoint.obj = obj;
	this.currentEntryPoint.key = key;
	try {
		obj[key] = value;
	} catch (e) {
		console.warn(e);
	}
}

RMMVData.selectTranslationData = function(translationDatas, path) {
	// must match trans.project.files[thefile].path
	var newPath = path;
	newPath = newPath.replace(/\\/g, "/");
	translationDatas.translationData = translationDatas.translationData || {};
	return translationDatas.translationData[newPath];
}

RMMVData.getRelativePath = function(longPath, shortPath) {
	longPath = longPath.replaceAll("\\", "/");
	var result = longPath.substr(shortPath.length);
	if (result[0] == "/") result = result.substr(1);
	return result;
}
thisAddon.RMMVData = RMMVData;





var RMMVGames = function(gameFile, options) {
	this.gameFile 		= gameFile;
	this.options 		= options || {};
	this.options.files  = this.options.files || [];
	this.isExtracted 	= false;
	this.init();
}

RMMVGames.lastAttachments = {};

RMMVGames.prototype.init = function() {
	this.gameFile = this.gameFile.replaceAll("\\", "/");
	this.dirname = nwPath.dirname(this.gameFile);
}

RMMVGames.prototype.processThispath = function(relPath) {
	if (!(this.options)) return true;
	if (empty(this.options.files)) return true;

	if (this.options.files.includes(relPath)) return true;

	return false;
}

RMMVGames.determineRootDir = async function(gameDir) {
	if (await common.isDirectory(gameDir) == false) return console.warn(gameDir, "不是有效的目录");
	var confirmedPath = gameDir;

	if(await common.isFileAsync(nwPath.join(gameDir, "www/data/System.json"))) {
		confirmedPath = nwPath.join(gameDir, "www");
		return confirmedPath;
	} else if (await common.isFileAsync(nwPath.join(gameDir, "data/System.json"))) {
		return confirmedPath;
	}

	return console.warn("无效的RMMV/RMMZ路径"+gameDir);
}

RMMVGames.prototype.determineGameRootDir = async function() {
	this.gameRoot = this.dirname;
	this.gameDataPath = nwPath.join(this.dirname, "data");
	this.gameJsPath = nwPath.join(this.dirname, "js");
	if(await common.isFileAsync(nwPath.join(this.dirname, "www/data/System.json"))) {
		this.gameRoot = nwPath.join(this.dirname, "www");
		this.gameDataPath = nwPath.join(this.dirname, "www/data");
		this.gameJsPath = nwPath.join(this.dirname, "www/js");
	}
}

RMMVGames.prototype.createCache = async function(id) {
	if (!Boolean(id)) console.error("必须定义ID");
	if (!this.isExtracted) await this.parse();
	await ui.log("生成缓存");

	var cacheInfo = {
		cacheID: id,
		cachePath: nwPath.join(common.getStagePath(), this.trans.projectId)
	}

	var cacheFolderData = nwPath.join(cacheInfo.cachePath, "data")
	await common.mkDir(cacheFolderData);
	// generate gameInfo.json
	var gameInfo = {
		Title: this.trans.gameTitle,
		title: this.trans.gameTitle
	}
	await common.filePutContents(nwPath.join(cacheInfo.cachePath, "gameInfo.json"), JSON.stringify(gameInfo), "UTF8");

	// copy index.html
	await ui.log("复制 index.html");
	await common.copyFile(nwPath.join(this.gameRoot, "index.html"), cacheFolderData);

	// copy file from current folder into cache
	await ui.log(`从中复制数据 ${this.gameDataPath} 到 ${nwPath.join(cacheFolderData, "data")}`);
	await bCopy(this.gameDataPath, nwPath.join(cacheFolderData, "data"));

	// copy plugins.js
	await ui.log("复制 plugins.js");
	var jsPath = nwPath.join(cacheFolderData, "js");
	await common.mkDir(jsPath);
	await common.copyFile(nwPath.join(this.gameJsPath, "plugins.js"), jsPath);

	await ui.log("生成 initial.json");
	this.trans.cache = cacheInfo;
	await common.filePutContents(nwPath.join(cacheInfo.cachePath, "initial.json"), JSON.stringify(this.trans), "UTF8");
	
	return cacheInfo;
}

RMMVGames.prototype.toTrans = async function(parsedData, options) {
	await ui.log("生成trans数据");
	if (!this.isExtracted) await this.parse();
	parsedData = parsedData || this.parsed;
	this.trans = {
		projectId		: common.makeid(10),
		cache			: {},
		gameEngine		: gameEngine||"rmmv",
		gameTitle		: RMMVData.lastGameTitle || "",
		loc				: this.dirname,
		parser			: 'rmmvjs',
		parserVersion	: thisAddon.package.version,
		attachments 	: RMMVGames.lastAttachments,
		files			: {}
	}

	for (var path in parsedData) {
		//var relativePath = RMMVData.getRelativePath(path, this.dirname);
		var relativePath = common.getRelativePathFromNode(path, "/data/", true);
		this.trans.files[relativePath] = {...parsedData[path].transData, ...parsedData[path].fileInfo};
		this.trans.files[relativePath].originalFormat= "RPG MAKER MV原始数据";
		this.trans.files[relativePath].lineBreak= "\n";
	}


	this.trans.cache = await this.createCache(this.trans.projectId);

	return this.trans
}

RMMVGames.prototype.parse = async function($MV_PATH, options) {
	RMMVGames.lastAttachments = {};
	$MV_PATH 	= $MV_PATH || this.dirname;
	options 	= options || this.options || {};
	options.translationDatas = options.translationDatas || this.options.translationDatas || {};
	await ui.log("确定游戏的根目录");
	await this.determineGameRootDir();
	await ui.log("根目录是："+this.gameRoot);
	await ui.log("解析数据");

	$MV_PATH = this.gameRoot;

	/*
	if (!common.isFileAsync(nwPath.join($MV_PATH,'data/System.json'))) {
		$MV_PATH = nwPath.join($MV_PATH,'www');
	}
	if (!common.isFileAsync(nwPath.join($MV_PATH,'/data/System.json'))) {
		return "System.json not found";
	}
	*/

	var files = await common.readDir(nwPath.join($MV_PATH, "data"));


	var $RESULT = {};
	for (var $key in files) {
		var $path 				= files[$key];
		var $fileInfo 			= {};
		var relativePath 		= RMMVData.getRelativePath($path, $MV_PATH);
		$fileInfo['extension'] 	= nwPath.extname($path).toLowerCase().substring(1);
		$fileInfo['dataType'] 	= RMMVData.determineType($path);
		$fileInfo['filename'] 	= nwPath.basename($path, nwPath.extname($path));
		$fileInfo['basename'] 	= nwPath.basename($path);
		$fileInfo['path'] 		= relativePath;
		$fileInfo['relPath'] 	= relativePath;
		$fileInfo['dirname'] 	= "/"+nwPath.dirname(relativePath);

		if ($fileInfo['extension'] !== 'json')	continue;

		console.log("File info:", $fileInfo);
		var content = await common.fileGetContents($path);
		if (!common.isJSON(content)) continue;
		var $currentData = JSON.parse(content);
		if (empty($currentData)) continue;
		if (this.processThispath(relativePath) == false) continue;
		var rmmvData = new RMMVData($currentData, {fileInfo: $fileInfo});

		console.log("%c Relative 路径是："+relativePath, 'background: yellow; color: #111');
		rmmvData.fileInfo = $fileInfo;

		await ui.log("解析"+relativePath);
		
		var thisFetch;

		//rmmvData.data = $currentData;
		if (options.writeMode) {
			rmmvData.writeMode = true;
			rmmvData.writableObj = common.clone($currentData);
			if (!empty(options.translationDatas)) {
				var translationData = RMMVData.selectTranslationData(options.translationDatas, relativePath);
				console.log("Translation Data:", translationData);
				translationData = translationData || {};
				rmmvData.translationPair = translationData.translationPair || {};
				rmmvData.translationInfo = translationData.info || {};
			}
		}

		switch ($fileInfo['dataType']) {
			case "items":
			case "armors":
			case "weapons":
				thisFetch = rmmvData.fetchCommonData($currentData, ["name", "description", "note"], [$fileInfo['filename']]);
				$RESULT[$path] = thisFetch;
				break;
			case "skills":
				thisFetch = rmmvData.fetchCommonData($currentData, ["name", "description", "message1", "message2", "note"], [$fileInfo['filename']]);
				$RESULT[$path] = thisFetch;
				break;
			case "states":
				thisFetch = rmmvData.fetchCommonData($currentData, ["name", "message1", "message2", "message3", "message4", "note"], [$fileInfo['filename']]);
				$RESULT[$path] = thisFetch;
				break;
			case "classes":
			case "enemies":
			case "tilesets":
				thisFetch = rmmvData.fetchCommonData($currentData,["name", "note"], [$fileInfo['filename']]);
				$RESULT[$path] = thisFetch;
				break;
			case "animations":
			case "mapinfos":
				thisFetch = rmmvData.fetchCommonData($currentData, ["name"], [$fileInfo['filename']]);
				$RESULT[$path] = thisFetch;
				break;
			case "actors":
				thisFetch = rmmvData.fetchCommonData($currentData, ["name", "nickname", "note", "profile"], [$fileInfo['filename']]);
				$RESULT[$path] = thisFetch;
				break;
			case "map":
				thisFetch = {};
				$newData = {};
				// fetch map name
				rmmvData.registerStringObject($currentData, 'displayName', [$fileInfo.filename, "displayName"], [], {currentAddress:["displayName"]})

				// fetch map note
				rmmvData.registerStringObject($currentData, 'note', [$fileInfo.filename, "note"], [], {currentAddress:["note"]})

				
				if ($currentData['events'].length<2) {
					$RESULT[$path] = rmmvData;
					break;
				}

				
				for (var $eIndex=1; $eIndex<$currentData['events'].length; $eIndex++) {
					if (empty($currentData['events'][$eIndex])) continue;
					// fetch event name
					//rmmvData.registerString($currentData['events'][$eIndex]['name'], [$fileInfo.filename, "events", $eIndex, "name"], [], {currentAddress : ["events", $eIndex, "name"]})
					rmmvData.registerStringObject($currentData['events'][$eIndex], 'name', [$fileInfo.filename, "events", $eIndex, "name"], [], {currentAddress : ["events", $eIndex, "name"]})
					// fetch event note
					//rmmvData.registerString($currentData['events'][$eIndex]['note'], [$fileInfo.filename, "events", $eIndex, "note"], [], {currentAddress : ["events", $eIndex, "note"]})
					rmmvData.registerStringObject($currentData['events'][$eIndex], 'note', [$fileInfo.filename, "events", $eIndex, "note"], [], {currentAddress : ["events", $eIndex, "note"]})
					// fetch event pages content
					var eventPage = await rmmvData.fetchEventPages($currentData['events'][$eIndex]['pages'], [$fileInfo.filename, "events", $eIndex, "pages"], thisFetch, {currentAddress:["events", $eIndex, "pages"]});	
					//if (options.writeMode) rmmvData.writableObj['events'][$eIndex]['pages'] = eventPage;
					if (options.writeMode) $currentData['events'][$eIndex]['pages'] = eventPage;
				}

				// writableObj is same with $currentData
				rmmvData.writableObj = $currentData;

				$RESULT[$path] = rmmvData;
				break;
			case "troops":
				if ($currentData.length<2) break;
				if (empty($currentData)) continue;

				rmmvData.fetchCommonData($currentData, ["name"], [$fileInfo['filename']]);
			
				for (var $eIndex=1; $eIndex < $currentData.length; $eIndex++) {
					if (empty($currentData[$eIndex]['pages'])) continue;
					// fetch event pages content
					var eventPage = await rmmvData.fetchEventPages($currentData[$eIndex]['pages'], [$fileInfo.filename, $eIndex, "pages"], thisFetch, {currentAddress:[$eIndex, "pages"]});	
					if (options.writeMode) rmmvData.writableObj[$eIndex]['pages'] = eventPage;

				}
				
				$RESULT[$path] = rmmvData;
				break;
			case "commonevents":
				if ($currentData.length<2) break;
				if (empty($currentData)) continue;

				// fetch name manually
				for ($eIndex=1; $eIndex<$currentData.length; $eIndex++) {
					if (empty($currentData[$eIndex])) continue;
					if (empty($currentData[$eIndex]['name'])) continue;

					//rmmvData.registerString($currentData[$eIndex]['name'], [$fileInfo.filename, $eIndex, "name"], [], {currentAddress:[$eIndex, "name"]})
					rmmvData.registerStringObject($currentData[$eIndex], 'name', [$fileInfo.filename, $eIndex, "name"], [], {currentAddress:[$eIndex, "name"]})

				}

				// the entire common events are a single event pages
				var eventPage = await rmmvData.fetchEventPages($currentData, [$fileInfo.filename], thisFetch, {currentAddress:[]});	
				if (options.writeMode) rmmvData.writableObj = eventPage;

				$RESULT[$path] = rmmvData;
				break;
			case "system":
				$RESULT[$path] = rmmvData.fetchSystem($currentData, [$fileInfo.filename]);
			
				break;
			default:
				$RESULT[$path] = rmmvData.fetchFromOtherJson($currentData, [$fileInfo.filename]);

				break;
		}

	}	
	
	//return  this.normalizeMVData($RESULT);
	this.isExtracted = true;
	this.parsed = $RESULT;	
	console.log("RMMVGame parsed result", this);
	return $RESULT;
}

RMMVGames.prototype.newProject = async function() {
	ui.showLoading();
	ui.loadingProgress("处理", "创建一个新的RMMV/RMMZ项目。", {consoleOnly:false, mode:'consoleOutput'});
	await ui.log("RMMVJS解析器版本："+thisAddon.package.version);
	await ui.log("从创建项目"+this.dirname);
	await ui.log("切入点是："+this.gameFile);

	var transData = await this.toTrans();
	console.log("Generated transData:", transData);
	trans.openFromTransObj({project:transData}, {isNew:true});
	$(document).one("hideLoading", async ()=> {
		confirmLoadPlugins(async () => {
			await loadPlugins();
		});
	})
	ui.loadingProgress("完成", "所有过程都完成了！", {consoleOnly:false, mode:'consoleOutput'});
	ui.showCloseButton();
	console.log("RMMVGames", this);
}

RMMVGames.prototype.exportToFolder = async function(targetFolder, options) {
	options = options || this.options || {};
	options.translationData = options.translationData || trans.getTranslationData(undefined, {filterTag:options.filterTag, filterTagMode:options.filterTagMode, files:options.files});
	this.options.translationDatas 	= options.translationData || this.options.translationDatas || {};
	this.options.writeMode 			= true;

	console.log("export to folder with options:", options);
	await common.mkDir(targetFolder);
	await this.parse(undefined);

	console.log("----Parsed result", this);
	for (var path in this.parsed) {
		var newFile = nwPath.join(targetFolder, this.parsed[path].fileInfo.relPath);
		await ui.log("创建目录（如果不存在）：", nwPath.dirname(newFile));
		await common.mkDir(nwPath.dirname(newFile));
		await ui.log("正在写入文件：", newFile);

		if (!this.parsed[path].writableObj) continue;
		if (thisAddon.config.beautifyJSON) {
			await common.filePutContents(newFile, JSON.stringify(this.parsed[path].writableObj, undefined, 2), 'UTF-8');
		} else {
			await common.filePutContents(newFile, JSON.stringify(this.parsed[path].writableObj), 'UTF-8');
		}
	}
}

thisAddon.RMMVGames = RMMVGames;





class JSONTranslate extends require("www/js/ParserBase.js").ParserBase {
	constructor(obj, options, callback) {
		super(obj, options, callback)
		this.obj = obj || {};
	}
}

JSONTranslate.prototype.translateString = function(text, context) {
	if (typeof text !== 'string') return text;
	if (text.trim() == '') return text;
	console.log("attempt to translate ", text, this.translationPair);

	// compare with exact context match
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

	//console.log("found in translation pair?", this.translationPair[text]);
	
	if (typeof this.translationPair[text] == 'undefined') return text;
	
	return this.translationPair[text];
}

/**
 * Generate translation table from any object
 * This is useful for handling misc JSON files
 * @param  {} obj
 * @param  {} context
 */
 JSONTranslate.prototype.getTranslationTableFromObj = function(obj, context) {
	obj = obj || this.obj;
	if (!Boolean(context)) context = [];
	if (Array.isArray(context) == false) context = [context];
	var index = {};
	var result = {
		data:[],
		context:[]
	}

	var fetchChild = (childObj, localContext) => {
		// create new clone of localContext
		if (Array.isArray(localContext) == false) localContext = [localContext];

		for (var i in childObj) {
			var newContext = common.clone(localContext);
			newContext.push(i);
			if (Boolean(childObj[i]) == false) continue
			if (common.isNumeric(childObj[i])) continue;
			if (typeof childObj[i] == 'object') {
				fetchChild(childObj[i], newContext);
			} else if (typeof childObj[i] == 'string') {
				var contextString = newContext.join("/");
				if (contextString.includes("parameters") == false) continue;
				if (RMMV.isCommonOperatorString(childObj[i])) continue;
				if (!common.isTranslatableText(childObj[i])) continue;				
				if (index[childObj[i]]) {
					var thisIndex = index[childObj[i]];
					result.context[thisIndex] = result.context[thisIndex] || [];
					result.context[thisIndex].push(contextString);
					continue;
				}

				var thisIndex = result.data.push([childObj[i]]) -1;
				result.context[thisIndex] = result.context[thisIndex] || [];
				result.context[thisIndex].push(contextString);
				index[childObj[i]] = thisIndex;
			}
			
		}
	}

	fetchChild(obj, context);
	result.indexIds = index;
	return result;
}


JSONTranslate.prototype.translateObj = function(obj, context, translationPair) {
	obj = obj || this.obj;
	obj = common.clone(obj);
	translationPair = translationPair || this.translationPair;

	if (!Boolean(context)) context = [];
	if (Array.isArray(context) == false) context = [context];

	var fetchChild = (childObj, localContext) => {
		// create new clone of localContext
		if (Array.isArray(localContext) == false) localContext = [localContext];

		for (var i in childObj) {
			var newContext = common.clone(localContext);
			newContext.push(i);
			if (Boolean(childObj[i]) == false) continue
			if (common.isNumeric(childObj[i])) continue;
			if (typeof childObj[i] == 'object') {
				fetchChild(childObj[i], newContext);
			} else if (typeof childObj[i] == 'string') {
				var contextString = newContext.join("/");
				if (contextString.includes("parameters") == false) continue;
				if (RMMV.isCommonOperatorString(childObj[i])) continue;
				if (!common.isTranslatableText(childObj[i])) continue;				
				
				childObj[i] = this.translateString(childObj[i], newContext);
				

			}
			
		}
	}

	fetchChild(obj, context);
	this.translated = obj;
	return obj;
}



/**
 * @param  {} rootDir
 * rootDir is the place where index.html resides
 * @param  {} options
 */
var RMMV = function(rootDir, options) {
	this.rootDir 		= rootDir;
	this.options		= options || {};
	this.options.pluginPath	= this.options.pluginPath || "js/plugins/";
	this.options.translationDatas = this.options.translationDatas || {}
	this.options.files		= this.options.files || [];
}

RMMV.prototype.processThispath = function(relPath) {
	console.log("Is file processed:", relPath, this.options.files);

	if (!(this.options)) return true;
	if (empty(this.options.files)) return true;

	relPath = relPath.replaceAll("\\", "/");
	if (relPath[0] == "/") relPath = relPath.substr(1);

	if (this.options.files.includes(relPath)) return true;

	return false;
}

// utils
RMMV.getExe = async function(dir) {
	var list = await common.getAllExt(dir, "exe");
	var blacklist = ["notification_helper"]
	for (var i in list) {
		if (blacklist.includes(list[i])) continue;
		return list[i];
	}
	return false;
}

RMMV.isCommonOperatorString = function(string) {
	if (typeof string !== 'string') return false;
	var common = ["on", "off", "true", "false"];
	if (common.includes(string.toLowerCase())) return true;
	return false;
}
/**
 * load data relative to rootDir
 * data will be stored to files
 * @param  {} files
 */
RMMV.prototype.load = async function(files) {
	this.files = this.files || {};
	if (Array.isArray(files) == false) files = [files];

	var output = {};
	for (var i in files) {
		var fullPath = nwPath.join(this.rootDir, files[i]);
		if (!await common.isFileAsync(fullPath)) continue;
		try {
			var raw = await common.fileGetContents(fullPath);
			this.files[files] = JSON.parse(raw);
			output[files] = this.files[files];
		} catch (e) {
			console.warn(e)
		}

	}
	return output;
}

/**
 * Parse JSON content of plugins.js
 * plugins.js itself is a js file not a json file
 * so we need to get anything between the first "[" to the last "]"
 * @param  {String} pluginContent - Content of plugins.js
 */
RMMV.getParsedPluginContent = function(pluginContent) {
	var start = pluginContent.indexOf("[");
	var end = pluginContent.lastIndexOf("]");
	var trimmed = pluginContent.substring(start, end+1);		

	try {
		this.plugins = JSON.parse(trimmed);
	} catch(e) {
		console.warn("分析插件脚本时出错");
	}
	return this.plugins;
}

RMMV.prototype.parsePluginList = async function(options) {
	console.log("opening", nwPath.join(this.rootDir, "js/plugins.js"));
	try {
		var pluginContent = await common.fileGetContents(nwPath.join(this.rootDir, "js/plugins.js"));

	} catch (e) {
		console.warn(e);
		return;
	}
	var start = pluginContent.indexOf("[");
	var end = pluginContent.lastIndexOf("]");
	var trimmed = pluginContent.substring(start, end+1);		

	try {
		this.plugins = JSON.parse(trimmed);
	} catch(e) {
		console.warn("分析插件脚本时出错");
	}
	return this.plugins;
}

/**
 * Dump untranslated plugins to directory
 * @param  {} dir
 */
RMMV.prototype.dumpPluginsToDir = async function(dir) {
	if (!Boolean(dir)) throw "第一个参数（dir）为空"
	if (!Boolean(this.plugins)) await this.parsePlugins();
	await common.mkDir(dir);
	for (var file in this.pluginData) {
		var targetPath = nwPath.join(dir, file);
		await bCopy(this.pluginData[file].file, targetPath);
	}
	console.log("复制 pluginlist");
	var pluginList = nwPath.join(this.rootDir, "js/plugins.js");
	await bCopy(pluginList, nwPath.join(dir, "js/plugins.js"));
}

RMMV.prototype.writePluginListTo = async function(targetPath) {
	console.log("writePluginListTo", targetPath);
	// toDo translating pluginList
	this.options.translationDatas 		= this.options.translationDatas || {};
	this.pluginListObj.translationData 	= this.options.translationDatas["js/plugins.js"] || this.options.translationDatas["/js/plugins.js"] || {};
	this.pluginListObj.translationPair 	= this.pluginListObj.translationData.translationPair || {};
	var translated = this.pluginListObj.translateObj();
	var translatedStr = `//由Translator++生成。\n// 不要直接编辑此文件。\nvar $plugins =\n`+JSON.stringify(translated, undefined, 2)+";";
	console.log("Writing", targetPath);
	await common.mkDir(nwPath.dirname(targetPath));
	await common.writeFile(targetPath, translatedStr);
	console.log("Written:", targetPath);
}

RMMV.prototype.exportPluginsToFolder = async function(dir) {
	if (!Boolean(dir)) throw "第一个参数（dir）为空"
	if (!Boolean(this.plugins)) await this.parsePlugins();
	await common.mkDir(dir);	
	for (var file in this.pluginData) {
		var targetPath = nwPath.join(dir, file);
		this.pluginData[file].writeTo(targetPath);
	}
	console.log("exporting plugin list ...");
	try {
		if (this.processThispath("js/plugins.js")) await this.writePluginListTo(nwPath.join(dir, "js/plugins.js"))
	} catch (e) {
		console.warn("无法写入插件列表", e);
	}
	console.log("exporting plugin list done");
}

RMMV.prototype.selectTranslationData = function(path) {
	// must match trans.project.files[thefile].path
	var newPath = "/"+path;
	newPath = newPath.replace(/\\/g, "/");
	console.log("===================");
	console.log("selecting translation from ", path);
	console.log(this.options.translationDatas[newPath]);
	console.log("===================");
	return this.options.translationDatas[newPath];
	
}

RMMV.prototype.parsePlugins = async function(options) {
	var options = options || this.options || {};
	options.baseDir = options.baseDir || this.rootDir;

	// parse plugins
	if (!Boolean(this.plugins)) await this.parsePluginList(options);
	this.pluginData = {};

	console.log("Plugins : ", this.plugins);
	for (var i in this.plugins) {
		var thisPath = nwPath.join(this.rootDir, this.options.pluginPath, this.plugins[i].name+".js");
		var pluginPath = nwPath.join(this.options.pluginPath, this.plugins[i].name+".js");
		if (this.processThispath(pluginPath) == false) continue;
		
		console.log("parsing", thisPath);
		if (await common.isFileAsync(thisPath) == false) continue;
		
		this.pluginData[pluginPath] = new ESFile(thisPath, options);
		this.pluginData[pluginPath].setTranslationData(this.selectTranslationData(pluginPath));
		await this.pluginData[pluginPath].toTrans();
	}
	if (this.processThispath("js/plugins.js")) await this.parsePluginListToTrans(options);
	return this;
}

RMMV.prototype.parsePluginListToTrans = async function(options) {
	var options = options || this.options || {};
	var thisRelPath = "/js/plugins.js";

	if (!Boolean(this.plugins)) await this.parsePluginList(options);
	console.log(">>parsePluginListToTrans -> options:", options);
	this.pluginListObj = new JSONTranslate(this.plugins);
	this.pluginListTrans = await this.pluginListObj.getTranslationTableFromObj();
	this.pluginListTrans.basename 	= nwPath.basename(thisRelPath);
	this.pluginListTrans.filename 	= nwPath.basename(thisRelPath);
	this.pluginListTrans.extension 	= nwPath.extname(thisRelPath);
	this.pluginListTrans.dirname 	= nwPath.dirname(thisRelPath);
	this.pluginListTrans.path		= thisRelPath;
	this.pluginListTrans.tags		= [];
	this.pluginListTrans.lineBreak  = "\n";
}

RMMV.prototype.pluginsToTrans = async function(transData) {
	transData = transData || trans;
	transData.project = transData.project || {};
	transData.project.files = transData.project.files || {};
	if (Boolean(this.pluginData) == false) await this.parsePlugins();
	for (var path in this.pluginData) {
		var nPath = path.replace(/\\/g, "/");
		transData.project.files[nPath] = this.pluginData[path].trans;
	}

	transData.project.files["js/plugins.js"] = this.pluginListTrans;
	return transData;
}

window.RMMV = RMMV;




var RMMVDecrypter = function(rootDir, options) {
	this.rootDir 		= rootDir;
	this.options 		= options;
}

RMMVDecrypter.prototype.loadData = async function(file) {
	this.files = this.files || {};

	var fullPath = nwPath.join(this.rootDir, file);
	if (!await common.isFileAsync(fullPath)) return;
	try {
		var raw = await common.fileGetContents(fullPath);
		return JSON.parse(raw);
	} catch(e) {
		console.warn(e);
	}

}

RMMVDecrypter.prototype.loadSystem = async function() {
	try {
		this.system = await this.loadData("data/System.json");
		RMMVDecrypter.Decrypter.rawEncriptionKey = this.system.encryptionKey;
	} catch (e) {
		alert(t("加载错误system.json")+e.toString());
	}
}

RMMVDecrypter.prototype.getRelativePath = function(path) {
	return path.substring(this.rootDir.length);
}

RMMVDecrypter.prototype.decryptAll = async function(targetDir) {
	targetDir = targetDir || this.rootDir;
	var possibleExt = [
		".rpgmvo", ".rpgmvm", ".rpgmvp", //mv
		".png_", ".ogg_", ".m4a_" //mz
	];
	if (!this.isInitialized) await this.init();

	var maxItem = 0;
	for (var i in this.dirContent) {
		if (!possibleExt.includes(nwPath.extname(this.dirContent[i]).toLowerCase())) continue;
		maxItem++
	}
	console.log("maxItem", maxItem);
	await ui.log(`${maxItem} 找到物品！`);

	var x = 0;
	for (var i in this.dirContent) {
		if (!possibleExt.includes(nwPath.extname(this.dirContent[i]).toLowerCase())) continue;
		var newPath = RMMVDecrypter.Decrypter.extToDecryptExt(nwPath.join(targetDir, this.getRelativePath(this.dirContent[i])));
		console.log("Decrypting", this.dirContent[i], "into", newPath);
		try {
			await common.mkDir(nwPath.dirname(newPath));
		} catch (e) {}

		await ui.loadingProgress(Math.round((x/maxItem)*100));
		await ui.log(`解密：${this.dirContent[i]}`);
		await RMMVDecrypter.Decrypter.decrypt(this.dirContent[i], newPath);
		x++;
	}
	console.log("all process done");
	await ui.log(`全部完成！`);

}

RMMVDecrypter.prototype.init = async function() {
	await this.loadSystem();
	this.dirContent = await common.readDir(this.rootDir);
	this.isInitialized = true;
}


function Decrypter() {
    throw new Error('这是一个静态类');
}

Decrypter.rawEncriptionKey = ""; // get from System.encryptionKey
Decrypter.hasEncryptedImages = false;
Decrypter.hasEncryptedAudio = false;
Decrypter._requestImgFile = [];
Decrypter._headerlength = 16;
Decrypter._xhrOk = 400;
Decrypter._encryptionKey = "";
Decrypter._ignoreList = [
    "img/system/Window.png"
];
Decrypter.SIGNATURE = "5250474d56000000";
Decrypter.VER = "000301";
Decrypter.REMAIN = "0000000000";

Decrypter.checkImgIgnore = function(url){
    for(var cnt = 0; cnt < this._ignoreList.length; cnt++) {
        if(url === this._ignoreList[cnt]) return true;
    }
    return false;
};

Decrypter.decrypt = async function(path, targetPath) {
	return new Promise((resolve, reject) => {
		console.log(path);
		fs.readFile(path, async (err, data) => {
			if (err) {
				reject(err);
				return;
			}
			console.log("data", data);
			var arrayBuffer = Decrypter.decryptArrayBuffer(data);
			console.log("Writing : ", targetPath);
			if (targetPath) await common.writeFile(targetPath, this.toBuffer(arrayBuffer));
			console.log("done writing");
			resolve(arrayBuffer);;
		});
	})

};

Decrypter.cutArrayHeader = function(arrayBuffer, length) {
    return arrayBuffer.slice(length);
};

Decrypter.decryptArrayBuffer = function(arrayBuffer) {
    if (!arrayBuffer) return null;
	if (arrayBuffer instanceof Buffer) {
		arrayBuffer = arrayBuffer.buffer.slice(arrayBuffer.byteOffset, arrayBuffer.byteOffset + arrayBuffer.byteLength);
	}
    var header = new Uint8Array(arrayBuffer, 0, this._headerlength);

    var i;
    var ref = this.SIGNATURE + this.VER + this.REMAIN;
    var refBytes = new Uint8Array(16);
    for (i = 0; i < this._headerlength; i++) {
        refBytes[i] = parseInt("0x" + ref.substr(i * 2, 2), 16);
    }
    for (i = 0; i < this._headerlength; i++) {
        if (header[i] !== refBytes[i]) {
            throw new Error("标题错误");
        }
    }

    arrayBuffer = this.cutArrayHeader(arrayBuffer, Decrypter._headerlength);
    var view = new DataView(arrayBuffer);
    this.readEncryptionkey();
    if (arrayBuffer) {
        var byteArray = new Uint8Array(arrayBuffer);
        for (i = 0; i < this._headerlength; i++) {
            byteArray[i] = byteArray[i] ^ parseInt(Decrypter._encryptionKey[i], 16);
            view.setUint8(i, byteArray[i]);
        }
    }

    return arrayBuffer;
};

Decrypter.createBlobUrl = function(arrayBuffer){
    var blob = new Blob([arrayBuffer]);
    return window.URL.createObjectURL(blob);
};

Decrypter.toBuffer = function(arrayBuffer) {
	return Buffer.from(arrayBuffer)
}

Decrypter.extToEncryptExt = function(url) {
    var ext = url.split('.').pop();
    var encryptedExt = ext;

    if(ext === "ogg") encryptedExt = ".rpgmvo";
    else if(ext === "m4a") encryptedExt = ".rpgmvm";
    else if(ext === "png") encryptedExt = ".rpgmvp";
    else encryptedExt = ext;

    return url.slice(0, url.lastIndexOf(ext) - 1) + encryptedExt;
};

Decrypter.extToDecryptExt = function(url) {
    var ext = url.split('.').pop();
    var encryptedExt = ext;

    if(ext === "rpgmvo") encryptedExt = ".ogg";
    else if(ext === "rpgmvm") encryptedExt = ".m4a";
    else if(ext === "rpgmvp") encryptedExt = ".png";
    else if(ext === "png_") encryptedExt = ".png";
    else if(ext === "ogg_") encryptedExt = ".ogg";
    else if(ext === "m4a_") encryptedExt = ".m4a";
    else encryptedExt = ext;

    return url.slice(0, url.lastIndexOf(ext) - 1) + encryptedExt;
};

Decrypter.readEncryptionkey = function(){
    //this._encryptionKey = $dataSystem.encryptionKey.split(/(.{2})/).filter(Boolean);
	this._encryptionKey = this.rawEncriptionKey.split(/(.{2})/).filter(Boolean);
};

RMMVDecrypter.Decrypter = Decrypter;

window.RMMVDecrypter = RMMVDecrypter;

var decryptTo = async function(from, to) {
	console.log("Decrypting", from, to);
	var thisDecrypter = new RMMVDecrypter(from);
	await thisDecrypter.decryptAll(to);
}


/**
 * if engine is rmmv -> /www
 */
var adaptPath = function(path, engine) {
	engine = engine || trans.project.gameEngine;
	if (engine == "rmmv") return nwPath.join(path, "www");

	return path;
}


var applyTranslationPHP = async function(sourceMaterial, targetDir, options) {
	options = options||{};
	options.options		= options.options||{};
	options.mode 		= "dir"; // always dir
	options.onDone 		= options.onDone||function() {};
	options.dataPath 	= options.dataPath || ""; // location of data path (data folder). Default is using cache
	options.transPath	= options.transPath || ""; // location of .trans path to process. Default is using autosave on cache folder
	options.options.filterTag = options.options.filterTag||{};
	options.options.filterTagMode = options.options.filterTagMode||""; // whitelist or blacklist

	var transPath = targetDir+"\\translation.trans";
	var child_process = require('child_process');
	// remove existing data directory
	
	child_process.spawnSync("RMDIR", [targetDir+"\\www\\Data", "/S", "/Q"]);
	
	//ui.loadingClearButton();
	ui.showLoading();
	ui.loadingProgress("加载", "复制数据...", {consoleOnly:true, mode:'consoleOutput'});
	
	return new Promise(async (resolve, reject) => {
		php.extractEnigma(sourceMaterial, targetDir, {
			onData: function(data) {
			   ui.loadingProgress("加载", data, {consoleOnly:true, mode:'consoleOutput'});
			},
			onDone: async function() {
			   
			   var autofillFiles = [];
			   var checkbox = $(".fileList .data-selector .fileCheckbox:checked");
			   for (var i=0; i<checkbox.length; i++) {
				   autofillFiles.push(checkbox.eq(i).attr("value"));
			   }
			   options.files = options.files||autofillFiles||[];
			   var hasError = false;
			   await trans.save(transPath);
				//ui.showLoading();
				php.spawn("apply.php", {
					args:{
						gameFolder:trans.gameFolder,
						gameTitle:trans.gameTitle,
						projectId:trans.projectId,
						gameEngine:trans.gameEngine,
						files:options.files,
						exportMode:options.mode,
						options:options.options,
						rpgTransFormat:trans.config.rpgTransFormat,
						transPath:transPath,
						targetPath:targetDir
					},
					onData:function(buffer) {
						ui.loadingProgress("加载", buffer, {consoleOnly:true, mode:'consoleOutput'});
						
					},
					onError:function(buffer) {
						ui.loadingProgress("加载", buffer, {consoleOnly:true, mode:'consoleOutput', classStr:'stderr'});
						hasError = true;
					},
					onDone: async function(data) {
						//console.log(data); 
						console.log("完成")
						//ui.hideLoading(true);
						ui.loadingEnd("完成", "所有过程都完成了！", {consoleOnly:false, mode:'consoleOutput', error:hasError});
						ui.LoadingAddButton("打开文件夹", function() {
							nw.Shell.showItemInFolder(transPath);
						},{
							class: "icon-folder-open"
						});
						ui.LoadingAddButton("游玩！", function() {
							console.log("Opening game");
							nw.Shell.openItem(targetDir+"\\Game.exe");
						},{
							class: "icon-play"
						});

						ui.showCloseButton();
						if (hasError) {
							var conf = confirm("应用翻译时出错\r\n 您的游戏可能无法正常玩。\r\n 是否要阅读联机文档？");
							if (conf) nw.Shell.openExternal(nw.App.manifest.localConfig.defaultDocsUrl+trans.gameEngine);
						}
						
						options.onDone.call(trans, data);
						resolve(trans);
					}
				})

					   
		   }});	
	})
}

var exportToFolderPHP = async function(file, options) {
	// export translation
	if (typeof file=="undefined") return false;
	
	options = options||{};
	options.options = options.options||{};

	options.mode = "dir"; // always dir
	options.onDone = options.onDone||function() {};
	options.dataPath = options.dataPath || ""; // location of data path (data folder). Default is using cache
	options.transPath = options.transPath || ""; // location of .trans path to process. Default is using autosave on cache folder
	options.options.filterTag = options.options.filterTag||[];
	options.options.filterTagMode = options.options.filterTagMode||""; // whitelist or blacklist
	
	console.log("exporting project", arguments);
	
	var autofillFiles = [];
	var checkbox = $(".fileList .data-selector .fileCheckbox:checked");
	for (var i=0; i<checkbox.length; i++) {
		autofillFiles.push(checkbox.eq(i).attr("value"));
	}
	options.files = options.files||autofillFiles||[];

	await trans.autoSave()
	ui.showLoading();

	return new Promise((resolve, reject) => {
		php.spawn("export.php", {
			args:{
				path:file,
				gameFolder:trans.gameFolder,
				gameTitle:trans.gameTitle,
				projectId:trans.projectId,
				gameEngine:trans.gameEngine,
				files:options.files,
				exportMode:options.mode,
				options:options.options,
				rpgTransFormat:trans.config.rpgTransFormat,
				dataPath:options.dataPath,
				transPath:options.transPath
			},
			onData:function(buffer) {
				ui.loadingProgress(t("加载"), buffer, {consoleOnly:true, mode:'consoleOutput'});
				
			},
			onError:function(buffer) {
				ui.loadingProgress(t("加载"), buffer, {consoleOnly:true, mode:'consoleOutput', classStr:'stderr'});
				
			},
			onDone: function(data) {
				//console.log(data); 
				console.log("完成")
				//ui.hideLoading(true);
				//ui.loadingProgress(t("Finished"), t("All process finished!"), {consoleOnly:false, mode:'consoleOutput'});
				
				//ui.showCloseButton();
				options.onDone.call(trans, data);
				resolve(data);
			}
		})
	})
	
}

/**
 * Export JS scripts to folder
 * @param  {} sourceDir
 * @param  {} targetDir
 * @param  {} transData
 * @param  {} options
 */
var exportToFolder = async function(sourceDir, targetDir, transData, options) {
	console.log("Exporting into a folder exportToFolder():", arguments);
	options = options||{};
	options.writeEncoding = options.writeEncoding || trans.project.writeEncoding;
	transData = transData || trans.getSaveData();
	
	//options.groupIndex = options.groupIndex||"relPath";
	
	var translationData = trans.getTranslationData(transData, options);
	console.log("translation Data : ", translationData);
	var rmmv = new RMMV(sourceDir, {
		'writeMode' 		: true,
		'translationDatas'	: translationData.translationData,
		'files'				: options.files
	});	
	window.rmmv = rmmv;
	
	await rmmv.exportPluginsToFolder(targetDir);

}



var applyTranslation = async function(sourceDir, targetDir, transData, options) {
	options 		= options||{};
	transData 		= transData || trans.getSaveData();
	
	// real path first then temporary
	if (await common.isDirectory(sourceDir)) {
		// directory from inject dialog are root game folder (without www in rmmv)
		sourceDir = adaptPath(targetDir);
	}  else {
		// use stagging data
		sourceDir = transData.project.cache.cachePath;
		if (await common.isDirectory(sourceDir)) {
			// in stagging path, data and js folders are inside data directory
			sourceDir = nwPath.join(sourceDir, "data");
		} else {
			alert("找不到暂存路径"+sourceDir);
		}
	}

	targetDir = adaptPath(targetDir);
	console.warn("注射后运行 ->", arguments);

	console.log("copy from", sourceDir, "to:", targetDir);
	
	await exportToFolder(sourceDir, targetDir, transData, options);

	
}

var createEditorFile = async function(dir, engine) {
	engine = engine || trans.project.gameEngine;
	if (engine == "rmmv") {
		var path = nwPath.join(dir, "www/Game.rpgproject");
		if (await common.isFileAsync(path)) return path;
		await common.writeFile(path, "RPGMV 1.5.0")
	} else {
		var path = nwPath.join(dir, "Game.rmmzproject");
		if (await common.isFileAsync(path)) return path;
		await common.writeFile(path, "RPGMZ 1.0.1")
	}
	return path;
}

var openEditor = async function(dir, engine) {
	engine = engine || trans.project.gameEngine;
	var path = await createEditorFile(dir, engine);
	console.log("opening", path);
	nw.Shell.openExternal(path);

}

var playGame = async function(dir) {
	dir = adaptPath(dir);
	var indexFile = nwPath.join(dir, "index.html");
	nw.Window.open(indexFile, 
	{
		// id will makes the search window will be spawned once
		'id': "mvTestplay"+window.windowIndex
	},
	function(thisWin) {
		//ui.windows['search']
	})
}

var openDecryptorWindow = function(from, to, options) {
	from = from || "";
	to = to || "";
	var $popup = $("#rmmv_decryptorDialog");
	if ($popup.length == 0) {
		var dvField = new DVField();
		$popup = $("<div id='rmmv_decryptorDialog'></div>");
		var $content = ($(`<div>
			<h2 data-tran="">${t('加密游戏')}</h2>
			<div data-tran="">
				${t('选择索引。加密游戏的html。')}
			</div>
			<label>
				<input type="dvSelectPath" class="fromPath form-control" accept=".html" value="${from}" />
			</label>
		<div class="tooltip injectDestFolderTooltip error icon-cancel-circled hidden" data-tran="">字段不能为空！</div>
		</div>
		<div>
			<h2 data-tran="">${t('目标文件夹')}</h2>
			<div data-tran="">
			${t('选择目标文件夹。该过程将替换现有文件。')}
			</div>
			<label>
				<input type="dvSelectPath" class="toPath form-control" nwdirectory value="${to}" />
			</label>
		<div class="tooltip injectDestFolderTooltip error icon-cancel-circled hidden" data-tran="">字段不能为空！</div>
		</div>`));
		console.log("rendering ", $popup);
		dvField.renderSelectPath($content.find("[type=dvSelectPath]"));

		$popup.empty();
		$popup.append($content);
	}
	$popup.dialog({
		title: t("解密资源"),
		autoOpen: false,
		modal:true,
		width:640,
		height:320,
		minWidth:640,
		minHeight:320,
		show: {
			effect: "fade",
			duration: 200
		},
		hide: {
			effect: "fade",
			duration: 200
		},
		buttons:[
			{
				text: t("关闭"),
				icon: "ui-icon-close",
				click: function() {
					$(this).dialog( "close" );
				}
			},
			{
				text: t("过程"),
				click: async function() {
					var $this = $(this)
					var from = $this.find(".fromPath").val()
					if (!from) return alert(t("源路径不能为空"));
					var to = $this.find(".toPath").val()
					if (!to) return alert(t("目标路径不能为空"));

					if (await common.isFileAsync(from) == false) return alert(t('路径不是文件：')+from);
					if (await common.isDirectory(to) == false) return alert(t('无效目录：')+to);
					
					$this.dialog( "close" );

					ui.showLoading();
					await decryptTo(nwPath.dirname(from),  to);
					ui.showCloseButton();
				}
			}

		]
	});	
	$popup.dialog("open");
}


var extractEnigma = function(from, to, options) {
	from = from || "";
	to = to || "";
	var $popup = $("#rmmv_extractEnigma");
	if ($popup.length == 0) {
		var dvField = new DVField();
		$popup = $("<div id='rmmv_extractEnigma'></div>");
		var $content = ($(`<div>
			<h2 data-tran="">${t('解谜')}</h2>
			<div data-tran="">
				${t('选择enigma文件。')}
			</div>
			<label>
				<input type="dvSelectPath" class="fromPath form-control" accept=".exe" value="${from}" />
			</label>
		<div class="tooltip injectDestFolderTooltip error icon-cancel-circled hidden" data-tran="">字段不能为空！</div>
		</div>
		<div>
			<h2 data-tran="">${t('目标文件夹')}</h2>
			<div data-tran="">
			${t('选择目标文件夹。该过程将替换现有文件。')}
			</div>
			<label>
				<input type="dvSelectPath" class="toPath form-control" nwdirectory value="${to}" />
			</label>
		<div class="tooltip injectDestFolderTooltip error icon-cancel-circled hidden" data-tran="">字段不能为空！</div>
		</div>`));
		console.log("rendering ", $popup);
		dvField.renderSelectPath($content.find("[type=dvSelectPath]"));

		$popup.empty();
		$popup.append($content);
	}
	$popup.dialog({
		title: t("解谜"),
		autoOpen: false,
		modal:true,
		width:640,
		height:320,
		minWidth:640,
		minHeight:320,
		show: {
			effect: "fade",
			duration: 200
		},
		hide: {
			effect: "fade",
			duration: 200
		},
		buttons:[
			{
				text: t("关闭"),
				icon: "ui-icon-close",
				click: function() {
					$(this).dialog( "close" );
				}
			},
			{
				text: t("过程"),
				click: async function() {
					var $this = $(this)

					
					var from = $this.find(".fromPath").val();
					var to = $this.find(".toPath").val();

					var isEnigma = await php.isEnigma(from);
					if (!Boolean(isEnigma.result)) return alert(t("所选文件不是Enigma Virtual Box软件包。"));
					
					$this.dialog( "close" );
					ui.showBusyOverlay();
					await php.extractEnigma(from, to);
					ui.hideBusyOverlay();
				}
			}

		]
	});	
	$popup.dialog("open");
}

var loadPlugins = async function() {
	if (trans.project.pluginIsFetched) {
		var conf = confirm(t("已经为该项目获取了插件。想重新获取插件吗？"))
		if (!conf) return;
	}

	var thisLoc = trans.project.loc;
	if (trans.gameEngine == "rmmv") {
		thisLoc = nwPath.join(trans.project.loc, "www");
		console.log("Is file js/plugins.js exist?", await common.isFileAsync(nwPath.join(thisLoc, "js/plugins.js")));
		if (await common.isFileAsync(nwPath.join(thisLoc, "js/plugins.js")) == false) thisLoc = trans.project.loc;
	} 

	ui.showBusyOverlay();
	var thisRM = new RMMV(thisLoc);
	// all items stored in a folder named data
	await thisRM.dumpPluginsToDir(nwPath.join(trans.project.cache.cachePath, "data"));
	await thisRM.pluginsToTrans(trans);
	console.log(thisRM);
	trans.drawFileSelector();
	trans.project.pluginIsFetched = true;
	ui.hideBusyOverlay();
}

var confirmLoadPlugins = async function(onOk) {
	onOk = onOk || function() {};
	console.log("open confirmLoadPlugins");
	var $popup = $("#rmmv_fetchJS");
	if ($popup.length == 0) {
		$popup = $("<div id='rmmv_fetchJS'></div>");
		var $content = $(`<h2>您还想加载JavaScript文件吗？</h2>
		<div class="blockBox warningBlock withIcon" data-tran="">
				您将包括Java脚本的翻译！<br />
				Translator++将从插件相关的javascript文件中获取所有字符串。<br />
				这些字符串中的大多数都不是为翻译而保存的。<br />
				确保在翻译这些字符串时知道自己在做什么。
		</div>`)
		$popup.empty();
		$popup.append($content);
	}
	$popup.dialog({
		title: t("翻译Javascript文件？"),
		autoOpen: false,
		modal:true,
		width:640,
		height:320,
		minWidth:640,
		minHeight:320,
		show: {
			effect: "fade",
			duration: 200
		},
		hide: {
			effect: "fade",
			duration: 200
		},
		buttons:[
			{
				text: t("取消"),
				icon: "ui-icon-close",
				click: function() {
					$(this).dialog( "close" );
				}
			},
			{
				text: t("我知道风险，继续！"),
				click: async function() {
					var $this = $(this)
					$this.dialog( "close" );
					await onOk.call(this)
				}
			}

		]
	});	
	$popup.dialog("open");
}

var init = function() {
	ui.mainMenu.addChild("tools", {
		id: "rmmv",
		label: "RMMV & RMMZ"
	});

	var $newTransMenu = ui.mainMenu.addChild("rmmv", {
		label: "解密资源"
	});

	$newTransMenu.on("select", function() {
		openDecryptorWindow();
	})

	var $extractEnigma = ui.mainMenu.addChild("rmmv", {
		label: "提取谜虚拟盒"
	});

	$extractEnigma.on("select", function() {
		extractEnigma();
	})
}


var JSONPreview = function(json, htmlClass) {
	if (typeof json !== 'string') json = JSON.stringify(json);
	this.json = json;
	this.htmlClass = htmlClass;
	this.init();
}
JSONPreview.css = `
<style class="jsonPreview">
json-viewver {
    /* 背景、字体和颜色 */
    --color: #f9f9f9;

}
</style>
`;

JSONPreview.prototype.addContextMenu = function() {
	var that = this;
	this.menu = new nw.Menu();
	// Add some items with label
	this.menu.append(new nw.MenuItem({
		label: t('查找下一个'),
		type: "normal", 
		click: function(){
			if (!that.elm.data("searcher")) return;
			that.elm.data("searcher").next();
		}
	}));	
	this.menu.append(new nw.MenuItem({ type: 'separator' }));
	this.menu.append(new nw.MenuItem({
		label: t('打开文件夹'),
		type: "normal", 
		click: function(){
			var filePath = that.elm.data("path");
			if (!filePath) return;
			nw.Shell.showItemInFolder(filePath);
		}
	}));
	this.menu.append(new nw.MenuItem({
		label: t('用外部应用程序打开'),
		type: "normal", 
		click: function(){
			var filePath = that.elm.data("path");
			if (!filePath) return;
			nw.Shell.openItem(filePath);			  
		}
	}));

	var that = this;
	this.elm.on("contextmenu", function(ev) {
		ev.preventDefault();
		that.menu.popup(parseInt(ev.originalEvent.x), parseInt(ev.originalEvent.y));
		return false;		
	})
}

JSONPreview.prototype.init = function() {
	var $template = $(`<json-viewer></json-viewer>`);
	$template.attr("title", t(`原始JSON数据。右击打开菜单。`));
	if (this.htmlClass) $template.addClass(this.htmlClass);
	$template.text(this.json);
	this.elm = $template;
	this.addContextMenu();


	if (JSONPreview.isInitialized) return;
	// initializing JSONPreview
	JSONPreview.viewer = require("@alenaksu/json-viewer");
	//$("head").append(JSONPreview.css);
	JSONPreview.isInitialized = true;

}
JSONPreview.prototype.getElement = function() {
	return this.elm;
}

/**
 * Generate direction path from RPG Maker MV styled context string
 * @param  {object} objData
 * @param  {integer} rowNumber
 */
JSONPreview.getDirectionPath = function(objData, rowNumber) {
	objData = objData || {};
	var result = [];
	if (!objData.context) return result;
	if (Array.isArray(objData.context[rowNumber]) == false) return result;
	if (objData.context[rowNumber].length == 0) return result;

	var arrayToPattern = function(array) {
		var str = array.join(".");
		return "**."+str
	}
	
	for (var i in objData.context[rowNumber]) {
		var contextString = objData.context[rowNumber][i];
		var contextSegment = contextString.split("/");
		if (objData.filename.toLowerCase() == "mapinfos.json") {

		} else if (objData.filename.substring(0, 3).toLowerCase() == "map") {
			var segm = contextSegment.slice(1, 6);
			result.push(arrayToPattern(segm));
		}
	}
	return result;
}

JSONPreview.find = function(objData, rowNumber) {
	objData = objData || {};

	if (!objData.context) return;
	if (Array.isArray(objData.context[rowNumber]) == false) return;
	if (objData.context[rowNumber].length == 0) return;	
	if (!objData.data) return;
	if (!objData.data[rowNumber][trans.keyColumn]) return;	
	var previewer = $(".dataPreview")[0];

	var thisMsg = objData.data[rowNumber][trans.keyColumn];
	var firstContext = objData.context[rowNumber][0];
	var firstContextArr = firstContext.split("/");
	if (firstContextArr.includes("message")) {
		thisMsg = thisMsg.replace(/\r/g, "");
		var msgs = thisMsg.split("\n");
		var keyword = msgs[0];
		if (msgs.length>1) keyword = msgs[1];
		var searcher = previewer.search(keyword);
		searcher.next();
	} else {
		var searcher = previewer.search(thisMsg);
		searcher.next();		
	}
	$(".dataPreview").data("searcher", searcher);
}


thisAddon.patchTransData = function() {
	// patch transData from previous version
	if (!trans.project) return;
	if (common.versionToFloat(trans.project.editorVersion) <= 30930 && trans.project.parser == "rmmvjs" && !trans.project.isPatched) {
		var conf = confirm(t("此trans数据可用修补程序。此补丁将使您的trans数据与当前版本的Translator++兼容。\n你想修补你的Trans数据吗？\n（如果不修补trans数据，某些功能可能无法正常工作）"));
		if (!conf) return;

		trans.project.files = trans.project.files || {};
		for (var i in trans.project.files) {
			if (i.substring(0, 4) == "www/") {
				trans.project.files[i.substring(4)] = trans.project.files[i];
				delete trans.project.files[i];
			}
		}
		trans.project.isPatched = true;

		// redraw file selector
		trans.drawFileSelector();
	}
}



$(document).ready(function() {
	$(document).on("projectCreated", async function(trans, rawData) {
		// executed when a new project is created and before drawing file list
		if (trans.gameEngine !== "rmmv" && trans.gameEngine !== "rmmz") return;
		var location = trans.loc;
		if (trans.gameEngine == "rmmv") {
			location = nwPath.join(trans.loc, "www");
		} 
		var thisRM = new RMMV(location);
		await thisRM.dumpPluginsToDir(trans.project.cache.cachePath);
		await thisRM.pluginsToTrans(trans);
	})


	engines.addHandler(["rmmv", "rmmz"], 'onCheckProjectExist', async function(targetPath, engineType, data) {
		console.log("Handling onCheckProjectExist");
		try {
			if (Boolean(thisAddon.config.useLegacyParser) == true) {
				// just skip
				console.log("使用遗留解析器");
				return;
			} 
		} catch (e) {
			console.warn(e);
		}
		console.log("Handling RPG Maker MV/MZ");
		var rmmvGames = new RMMVGames(targetPath);
		await ui.newProjectDialog.close();
		await rmmvGames.newProject();
		return common.halt();
	});


	engines.addHandler(["rmmv", "rmmz"], 'exportHandler', async function(targetPath, options) {
		if (options.mode !== "dir" && options.mode !== "zip") return false;
		console.log("Export handler", arguments);
		
		ui.showLoading();
		ui.loadingProgress("处理", "导出到："+targetPath, {consoleOnly:false, mode:'consoleOutput'});
		await ui.log("目标目录：", targetPath);
		await ui.log("选项：", options);
		await ui.log("源路径是缓存路径");
		var originPath = nwPath.join(trans.project.cache.cachePath, "data");

		try {
			if (await await common.isDirectory(targetPath)) {
				await ui.log("处理程序：导出到目录中");

				await ui.log("--处理JavaScript文件");
				await exportToFolder(originPath, targetPath, undefined, options);

				if (Boolean(thisAddon.config.useLegacyParser) == false) {
					await ui.log("--处理RM数据");
					var entryPoint = nwPath.join(originPath, "index.html")
					var rmmvGames = new addonLoader.addons.rmmv.RMMVGames(entryPoint, options);
					await rmmvGames.exportToFolder(targetPath, options);
					ui.loadingProgress("完成", "所有过程都完成了！", {consoleOnly:false, mode:'consoleOutput'});
					ui.showCloseButton();
					return common.halt();
				} else {
					// use legacy
					await ui.log("使用遗留解析器");
					return;
				}
				
			}
		} catch (e) {
			console.warn(e);
		}
		
		// ===========================================
		// export to zip
		// ===========================================
		// export to temporary directory
		await ui.log("处理程序：导出到zip文件");
		var tmpPath = nwPath.join(nw.process.env.TMP, trans.project.projectId);
		fse.removeSync(tmpPath); 
		try {
			fs.mkdirSync(tmpPath, {recursive:true});
		} catch(e) {
			console.warn("无法创建目录", tmpPath);
			throw(e);
			return;
		}

		await ui.log("导出到文件夹", tmpPath);
		if (Boolean(thisAddon.config.useLegacyParser) == false) {
			await ui.log("--处理RM数据");
			var entryPoint = nwPath.join(originPath, "index.html")
			var rmmvGames = new addonLoader.addons.rmmv.RMMVGames(entryPoint, options);
			await rmmvGames.exportToFolder(tmpPath, options);
		} else {
			await exportToFolderPHP(tmpPath, options)
		}		
		await exportToFolder(originPath, tmpPath, undefined, options)
		await ui.log("插件已被导出到", tmpPath)
		
		await ui.log("压缩临时数据");
		var _7z = require('7zip-min');
		_7z.cmd(['a', '-tzip', targetPath, tmpPath+"\\*"], err => {
			// done
			console.log("process done");
			ui.loadingProgress("完成", "所有过程都完成了！", {consoleOnly:false, mode:'consoleOutput'});
			ui.showCloseButton();
		});
				
		// prevent default exporting
		return true;
	});

	engines.addHandler(["rmmv", "rmmz"], 'injectHandler', async function(targetDir, sourceMaterial, options) {
		console.log("Running on inject handler", arguments);
		if (Boolean(thisAddon.config.useLegacyParser) == true) return;
		ui.showLoading();
		ui.loadingProgress("处理", "注入式翻译", {consoleOnly:false, mode:'consoleOutput'});

		var sourceDir = sourceMaterial;
		if (await common.isFileAsync(sourceMaterial)) {
			sourceDir = path.dirname(sourceMaterial);
		} 
		await ui.log(`复制 ${sourceDir} 到 ${targetDir}`);
		await bCopy(sourceDir, targetDir, {
			onBeforeCopy: async (from, to) => {
				await ui.log(`开始复制 ${from}`);
			},
			onAfterCopy: async (from, to) => {
				await ui.log(`已成功复制到 ${to}`);
			}
		});

		var targetPath = await RMMVGames.determineRootDir(targetDir);

		await ui.log("--处理RM数据");
		var originPath = nwPath.join(trans.project.cache.cachePath, "data");
		await ui.log("从缓存数据生成转换"+originPath);
		var entryPoint = nwPath.join(originPath, "index.html")
		var rmmvGames = new addonLoader.addons.rmmv.RMMVGames(entryPoint, options);
		await rmmvGames.exportToFolder(targetPath, options);

		await ui.log("--处理JavaScript文件");
		await exportToFolder(originPath, targetPath, undefined, options);

		ui.loadingProgress("完成", "完成了！", {consoleOnly:false, mode:'consoleOutput'});
		ui.showCloseButton();

		return common.halt();
	});

	engines.addHandler(["rmmv", "rmmz"], 'afterInjectHandler', async function(targetDir, sourceMaterial, options) {
		console.log("路径是：", targetDir);
		console.log("选项包括：", options);
		console.log(arguments);

		// convert sourceMaterial to folder if path is file
		var sourceStat = fs.lstatSync(sourceMaterial)
		if (sourceStat.isFile()) sourceMaterial = path.dirname(sourceMaterial);
		
		ui.loadingProgress("处理", "其他步骤：", {consoleOnly:false, mode:'consoleOutput'});
		ui.loadingProgress("处理", "对于插件的注入式翻译（如果有）", {consoleOnly:false, mode:'consoleOutput'});
		await applyTranslation(sourceMaterial, targetDir, trans.getSaveData(), options);
		ui.loadingProgress("处理", "这就是全部。", {consoleOnly:false, mode:'consoleOutput'});
		return false;
	});

	engines.addHandler(["rmmv", "rmmz"], "onLoadTrans", 
	async () => {

		thisAddon.patchTransData();
		
		
		var appIcon =  "addons/rmmv/rmmv-ico.png"
		if (trans.project.gameEngine == "rmmz") {
			appIcon =  "addons/rmmv/rmmz-ico.png"
		}

		ui.ribbonMenu.add("rmmv", {
			title : trans.gameEngine.toUpperCase(),
			toolbar : {
				buttons : {
					play : {
						icon : "icon-play",
						title : t("玩最后一次构建"),
						onClick : async () => {
							if (await common.isDirectory(trans.project.devPath) == false) {
								return alert(t("未定义开发路径。\n你应该注入你的游戏一次来生成开发路径。"));
							}
							playGame(trans.project.devPath);
						}
					},
					openEditor : {
						img : appIcon,
						title : t("开放编辑器"),
						onClick : async () => {
							if (await common.isDirectory(trans.project.devPath) == false) {
								return alert(t("未定义开发路径。\n你应该注入你的游戏一次来生成开发路径。"));
							}
							openEditor(trans.project.devPath, trans.project.gameEngine);
						}
					},
					loadPlugins : {
						icon : "icon-publish",
						title : t("将插件加载到项目中"),
						onClick : async () => {
							// all items stored in a folder named data
							confirmLoadPlugins(async () => {
								await loadPlugins();
							})

						}
					},
					decryptResources : {
						icon : "icon-lock-open",
						title : t("解密资源"),
						onClick : async () => {
							var from = trans.project.loc;
							var to = trans.project.devPath

							if (trans.project.gameEngine == "rmmv") {
								from = nwPath.join(from, "www/index.html")
								to 	= nwPath.join(to, "www")
							}
							if (trans.project.gameEngine == "rmmz") from = nwPath.join(from, "index.html")
							openDecryptorWindow(from, to);
						}
					}
					
				}
			}
		})
		
		// check version
		thisAddon.config = thisAddon.config || {};
		if (common.versionToFloat(trans.project.editorVersion) < common.versionToFloat("3.9.15") && thisAddon.config.useLegacyParser == false) {
			var popupOption = {
				title: "项目需要更新",
				buttons : [
					{
						text: "切换到旧解析器",
						icon: "ui-icon-close",
						click: function() {
							thisAddon.config.useLegacyParser = true;
							alert(t("该选项已设置为使用遗留解析器。\n您可以随时通过选项菜单切换回新的解析器。"));
							$(this).dialog( "close" );
						}
					},{
						text: "关闭",
						icon: "ui-icon-close",
						click: function() {
							$(this).dialog( "close" );
						}
					}
				]
			}
			var content = $(`
			<h1>此项目与当前解析器不兼容</h1>
			<p>您的项目是使用较旧版本的解析器创建的。某些功能可能与当前版本不兼容。</p>
			<p><b>建议：</b>创建一个新项目，然后将当前项目的翻译导入新创建的项目。<a href="https://dreamsavior.net/docs/translator/getting-started/updating-a-project/" external>（阅读有关文档的更多信息）</a></p>
			<p>或者，您也可以在“选项”菜单上切换回旧版本的解析器（但不推荐使用，因为旧的解析器已被弃用）。</p>`)
			await ui.showPopup("rmmv_rquireUpgrade", content, popupOption);
		}
	})	

	engines.addHandler(["rmmv", "rmmz"], "onAfterCreateProject", async ()=>{
		$(document).one("hideLoading", async ()=> {
			confirmLoadPlugins(async () => {
				await loadPlugins();
			});
		})
	});	

	
	$(".cellInfoContent.rawData").css("background-color", "#2a2f3a");
	var cropableData = ["commonevents", "actors", "animations", "armors", "classes", "enemies", "items", "skills", "mapinfos", "states", "tilesets", "troops", "weapons"]

	var allowedExtension = [".json", "json", ".js", "js"];
	engines.addHandler(["rmmv", "rmmz"], 'onLoadSnippet', async function(selectedCell) {
		console.log("RMMV/MZ onLoadSnippet handler");
		console.log("selected cell:", selectedCell);

		var obj = trans.getSelectedObject();

		if (obj.extension.toLowerCase() == ".js" && ["js/plugins.js", "/js/plugins.js"].includes(obj.path.toLowerCase()) == false) return this.commonHandleFile(selectedCell, "js");



		if (allowedExtension.includes(obj.extension) == false) return;
		if (!Array.isArray(obj.context[selectedCell.fromRow])) return;
		if (obj.context[selectedCell.fromRow].length == 0) return;

		console.log("determining active path");
		var activePath = nwPath.join(trans.project.loc, obj.path);
		if (trans.project.gameEngine=="rmmv") {
			activePath = nwPath.join(trans.project.loc, "www", obj.path);
			if (await common.isFileAsync(activePath) == false) activePath = nwPath.join(trans.project.loc, obj.path);
		}
		console.log("testing", activePath);
		if (await common.isFileAsync(activePath) == false)  activePath = nwPath.join(trans.project.cache.cachePath, "data", obj.path);
		console.log("testing", activePath);
		if (await common.isFileAsync(activePath) == false) {
			this.clear();
			console.log("no active path");

			$warningMsg = $(`<div class="blockBox warningBlock withIcon">${t(`找不到与数据相关的文件`)}<br />
			${t(`为了修正这个问题，<b>原材料位置</b>字段在<a href="#" class="openProjectProperties">项目属性</a>`)}</div>`)
			$warningMsg.find(".openProjectProperties").on("click", function() {
				ui.openProjectProperties();
			});
			this.append($warningMsg)
			return;
		}

		if (obj.path == "js/plugins.js" || obj.path == "/js/plugins.js" ) {
			console.log("plugins.js viewer");
			if (this.lastOpenedPath !== activePath || this.isClear()) {
				var addonList = RMMV.getParsedPluginContent(await common.fileGetContents(activePath));
				var jsonPreview = new JSONPreview(addonList, "dataPreview");
				this.jsonPreviewElm = jsonPreview.getElement();
				this.jsonPreviewElm.data("path", activePath);
				this.clear();
				this.append(this.jsonPreviewElm);
				this.lastOpenedPath	 = activePath;
			}

			this.jsonPreviewElm[0].collapseAll()
			JSONPreview.find(obj, selectedCell.fromRow);
		} else {
			console.log("obj.filename.", obj.filename);

			if (this.lastOpenedPath !== activePath || this.isClear()) {
				this.lastOpenedData = await common.fileGetContents(activePath);
				this.lastOpenedPath = activePath;

				var json = this.lastOpenedData
			
			}
			if (cropableData.includes(obj.filename.toLowerCase())) {
				console.log("handling common events");
				// show by each page
				var commonEvents = JSON.parse(this.lastOpenedData);
				var thisContext = trans.getSelectedContext()[0];
				console.log("thisContext", thisContext);
				var contextPart = thisContext.split("/");
				console.log("contextPart", contextPart);
				var json = commonEvents[contextPart[1]];
				console.log(contextPart[1]);
			}		
			if (json) {
				var jsonPreview = new JSONPreview(json, "dataPreview");
				this.jsonPreviewElm = jsonPreview.getElement();
				this.jsonPreviewElm.data("path", activePath);

				this.clear();
				this.append(this.jsonPreviewElm);					
			}	

			this.jsonPreviewElm[0].collapseAll();
			// open related object
			/*
			var opener = JSONPreview.getDirectionPath(obj, selectedCell.fromRow);
			for (var i in opener) {
				console.log("expanding", opener[i]);
				this.jsonPreviewElm[0].expand(opener[i]);
			}
			*/
			// search into related object
			JSONPreview.find(obj, selectedCell.fromRow);
		}
		
	});

	ui.onReady(function() {
		init();
	});
});