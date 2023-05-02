/*
	HANDLER LIST
	------------
	onLoadTrans : when opening trans or creating new project
	onUnloadTrans : when closing trans
	
	injectHandler : when injecting translation
		return true to halt default process;
	exportHandler : when exporting translation
		return true to halt default process;
		
	onOpenInjectDialog
*/

/**
 * Game engine class
 * @class
 * @param {String} name - Name of the engine
 * @param {Object} options - Additional option
 */
var Engine = function(name, options) {
	/* engine */
	options = options||{};
	this.name = name;
	for (i in options) {
		this[i] = options[i];
	}
	common.addEventHandler(this);
	this.init();
}

Engine.prototype.addProperty = function(name, obj) {
	this[name] = obj;
} 

Engine.prototype.addHandler = function(name, handler) {
	if (typeof handler !== 'function') console.warn("handler must be a function");
	this[name] = handler;
}
Engine.prototype.hasHandler = function(handlerName) {
	if (typeof this[handlerName] == "function") return true;
	return false;
}

Engine.prototype.getHandler = function(handlerName) {
	if (!this.hasHandler(handlerName)) return function(){};
	return this[handlerName];
}

Engine.prototype.triggerHandler = async function(handlerName, thisScope, args) {
	if (!this.hasHandler(handlerName)) return;
	if (common.isArguments(args)) {
		args = common.argumentsToArray(args);
	}
	if (!Array.isArray(args)) return console.warn("Expected array for args "+typeof args+ " given!");
	this.trigger(handlerName, args);
	return await this.getHandler(handlerName).apply(thisScope, args);
}

Engine.prototype.appendList = function() {
	var $container = $('#gameEngines')
	$container.append($('<option value="'+common.htmlEntities(this.name)+'" />'))
}

Engine.prototype.init = function() {
	this.appendList();
}





/**
 * Collection of engine
 * @class
 * @param  {} name
 * @param  {} options
 */
var Engines = function(name, options) {
	/* collection of engine*/
	var that = this;
	
	this.add = function(name, options) {
		that[name] = new Engine(name, options);
		that.list = that.list || [];
		that.list.push(that[name]);
		that.length = that.list.length;
	}
	
	if (typeof name !== 'undefined') {
		this.add(name, options);
	}
}
Engines.group = {
	'unityTrans' : ["rmxp", "rmvx", "rmvxace"]
}
Engines.characteristics = [
	async function(gamepath) {
		//rmmv
		var dir = nwPath.dirname(gamepath);
		if (common.isDir(gamepath)) dir = gamepath;
		if (common.isFile(nwPath.join(dir, "js", "rpg_core.js"))) return "rmmv";
		if (common.isFile(nwPath.join(dir, "www", "js", "rpg_core.js"))) return "rmmv";
		return false;
	},
	async function(gamepath) {
		//rmmz
		var dir = nwPath.dirname(gamepath);
		if (common.isDir(gamepath)) dir = gamepath;
		if (common.isFile(nwPath.join(dir, "js", "rmmz_core.js"))) return "rmmz";
		return false;
	},
	async function(gamepath) {
		//rmmz
		var dir = nwPath.dirname(gamepath);
		var isEnigma = await php.isEnigma(gamepath);
		if (isEnigma.result) return "enigma";
		return false;
	},
	async function(gamepath) {
		//vxAce
		//Library=System\RGSS3*
		var ini = ini || require('ini');
		var iniPath = nwPath.join(nwPath.dirname(gamepath), "Game.ini");
		if (!common.isFile(iniPath)) return false; 
		var iniFile = await afs.readFile(iniPath) 
		var iniContent = ini.parse(iniFile.toString());
		var libString = iniContent['Game']['Library'] || iniContent['Game']['library'];
		if (libString.includes('RGSS3')) return "rmvxace";
		if (libString.includes('RGSS2')) return "rmvx";
		if (libString.includes('RGSS1')) return "rmxp";
		
		return false
	}
]


Engines.detect = async function(gamepath) {
	for (var i in Engines.characteristics) {
		var engines = await Engines.characteristics[i].call(this, gamepath);
		if (Boolean(engines)) return engines;
	}
	return "";
}

Engines.prototype.addHandler = function(engines, handlerName, handler) {
	// apply handler to one or more engine
	// create the engine if the engine is not exist;
	if (typeof handlerName !== 'string') console.warn("handler name must be a string")
	if (!handlerName) console.warn("handler name must be specified")
	if (typeof handler !== 'function') console.warn("handler must be function")
	if (Array.isArray(engines) == false) engines = [engines]
	for (var i in engines) {
		var thisEngine = engines[i]
		if (Boolean(thisEngine) == false) continue;
		if (typeof thisEngine !== 'string') continue;
		
		if (Boolean(this[thisEngine]) == false) this.add(thisEngine);
		this[thisEngine].addHandler(handlerName, handler);
	}
}

Engines.prototype.hasHandler = function(handler, engineName) {
	engineName = engineName || trans.project.gameEngine;
	if (typeof this[engineName] == 'undefined') return false;
	if (typeof this[engineName][handler] == 'function') return true;
	
	return false;
}

Engines.prototype.current = function() {
	var result = new Engine("");
	if (typeof trans.project == 'undefined') return result;
	if (typeof trans.project.gameEngine == 'undefined') return result;
	
	if (this[trans.project.gameEngine]) return this[trans.project.gameEngine];
	
	// looking from the group
	for (var engineName in Engines.group) {
		if (Engines.group[engineName].includes(trans.project.gameEngine)) return this[engineName];
	}
	
	return result
}

Engines.prototype.handler = function(handler, engineName) {
	engineName = engineName || trans.project.gameEngine;
	if (!this[engineName]) return function() {}
	if (typeof this[engineName][handler] !== 'function') return function() {};
	
	return this[engineName][handler];
}

Engines.prototype.hasEngine = function(engineName) {
	if (!this[engineName]) return false;
	if (this[engineName].constructor.name !== "Engine") return false;
	return true;
}

Engines.prototype.getEngine = function(engineName) {
	if (this.hasEngine(engineName)) return this[engineName];
	return new Engine("NullEngine");
}


var engines = new Engines();

engines.add("rmmv", {});




var ApplyTranslation = function() {
	this.__supportList = ["rmxp", "rmvx", "rmvxace", "rmmv", "wolf"]
}
ApplyTranslation.prototype.getSupported = function() {
	return this.__supportList;
}	

ApplyTranslation.prototype.isSupported = function(thisEngine) {
	thisEngine = thisEngine || trans.gameEngine;
	return this.__supportList.includes(thisEngine);
}


ApplyTranslation.prototype.start = async function(targetDir, sourceMaterial, options) {
	var fs = fs||require("fs");
	options = options||{};
	options.options = options.options||{};
	options.mode = options.mode||"dir";
	options.onDone = options.onDone||function() {};
	options.dataPath = options.dataPath || ""; // location of data path (data folder). Default is using cache
	options.transPath = options.transPath || ""; // location of .trans path to process. Default is using autosave on cache folder
	options.options.filterTag = options.options.filterTag||options.filterTag||{};
	options.options.filterTagMode = options.options.filterTagMode||options.filterTagMode||""; // whitelist or blacklist

	console.log("Applying translation!", arguments)

	//return console.log("HALTED", arguments);
	//check if target dir is writable
	var checkPath = php.checkPathSync(targetDir);
	var isHandled = false; // handle check;
	
	if (checkPath.accessible == false) return alert(targetDir+" is not accessible!");
	if (checkPath.writable == false) return alert(targetDir+" is not writable!");
	
	var that = this;
	var mainArgs = arguments;
	if (engines.hasHandler('injectHandler')) {
		console.log("This engine has inject handler")
		var blocking = await engines.handler('injectHandler').apply(this, arguments);
		if (Boolean(blocking)) return;
	}
	
	var enginePattern = {};
	enginePattern['rpgMaker'] = ["rmxp", "rmvx", "rmvxace"];
	enginePattern['rmmv'] = ["rmmv", "rmmz"];
	enginePattern['wolf'] = ["wolf"];
	
	

	if (enginePattern['rpgMaker'].includes(trans.gameEngine)) {
		var transPath = targetDir+"\\translation.trans";
		var child_process = require('child_process');
		// remove existing data directory
		
		if (trans.gameEngine == 'rmmv') {
			child_process.spawnSync("RMDIR", [targetDir+"\\www\\Data", "/S", "/Q"]);
		} else {
			child_process.spawnSync("RMDIR", [targetDir+"\\Data", "/S", "/Q"]);
		}
		
		//ui.loadingClearButton();
		ui.showLoading();
		ui.loadingProgress("Loading", "Copying data...", {consoleOnly:true, mode:'consoleOutput'});
		
		//ncp(sourceMaterial, targetDir, function (err) {
		//	if (err) return alert(err);
		
		php.copyTree(sourceMaterial, targetDir, {
		 onData: function(data) {
			ui.loadingProgress("Loading", data, {consoleOnly:true, mode:'consoleOutput'});
		 },
		 onDone: function() {
		
			
			var autofillFiles = [];
			var checkbox = $(".fileList .data-selector .fileCheckbox:checked");
			for (var i=0; i<checkbox.length; i++) {
				autofillFiles.push(checkbox.eq(i).attr("value"));
			}
			options.files = options.files||autofillFiles||[];
			var hasError = false;
			trans.save(transPath,
			{
				onSuccess:function() {
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
							ui.loadingProgress("Loading", buffer, {consoleOnly:true, mode:'consoleOutput'});
							
						},
						onError:function(buffer) {
							ui.loadingProgress("Loading", buffer, {consoleOnly:true, mode:'consoleOutput', classStr:'stderr'});
							console.warn("stderr", buffer.toString());
							hasError = true;
						},
						onDone: async function(data) {
							//console.log(data); 
							console.log("done")
							//ui.hideLoading(true);
							ui.loadingEnd("Finished", "All process finished!", {consoleOnly:false, mode:'consoleOutput', error:hasError});
							
							ui.LoadingAddButton("Open folder", function() {
								nw.Shell.showItemInFolder(transPath);
							},{
								class: "icon-folder-open"
							});
							ui.LoadingAddButton("Play!", function() {
								console.log("Opening game");
								nw.Shell.openItem(targetDir+"\\Game.exe");
							},{
								class: "icon-play"
							});

							if (engines.hasHandler('afterInjectHandler')) {
								var blocking = await engines.handler('afterInjectHandler').apply(that, mainArgs);
								if (blocking) return;
							}

							ui.showCloseButton();
							
							if (hasError) {
								var conf = confirm("An error has occured when applying your translation\r\nYour game might can not be played properly.\r\nDo you want to read the online documentation?");
								if (conf) nw.Shell.openExternal(nw.App.manifest.localConfig.defaultDocsUrl+trans.gameEngine);
							}
							options.onDone.call(trans, data);
						}
					})
					
				}
			});
					
			
		}});		
		isHandled = true;
	} else if (enginePattern['rmmv'].includes(trans.gameEngine)) {
		var transPath = targetDir+"\\translation.trans";
		var child_process = require('child_process');
		// remove existing data directory
		
		child_process.spawnSync("RMDIR", [targetDir+"\\www\\Data", "/S", "/Q"]);
		
		//ui.loadingClearButton();
		ui.showLoading();
		ui.loadingProgress("Loading", "Copying data...", {consoleOnly:true, mode:'consoleOutput'});
		
		
		php.extractEnigma(sourceMaterial, targetDir, {
		 onData: function(data) {
			ui.loadingProgress("Loading", data, {consoleOnly:true, mode:'consoleOutput'});
		 },
		 onDone: function() {
			
			var autofillFiles = [];
			var checkbox = $(".fileList .data-selector .fileCheckbox:checked");
			for (var i=0; i<checkbox.length; i++) {
				autofillFiles.push(checkbox.eq(i).attr("value"));
			}
			options.files = options.files||autofillFiles||[];
			var hasError = false;
			trans.save(transPath,
			{
				onSuccess:function() {
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
							ui.loadingProgress("Loading", buffer, {consoleOnly:true, mode:'consoleOutput'});
							
						},
						onError:function(buffer) {
							ui.loadingProgress("Loading", buffer, {consoleOnly:true, mode:'consoleOutput', classStr:'stderr'});
							hasError = true;
						},
						onDone: async function(data) {
							//console.log(data); 
							console.log("done")
							//ui.hideLoading(true);
							ui.loadingEnd("Finished", "All process finished!", {consoleOnly:false, mode:'consoleOutput', error:hasError});
							ui.LoadingAddButton("Open folder", function() {
								nw.Shell.showItemInFolder(transPath);
							},{
								class: "icon-folder-open"
							});
							ui.LoadingAddButton("Play!", function() {
								console.log("Opening game");
								nw.Shell.openItem(targetDir+"\\Game.exe");
							},{
								class: "icon-play"
							});

							if (engines.hasHandler('afterInjectHandler')) {
								var blocking = await engines.handler('afterInjectHandler').apply(that, mainArgs);
								if (blocking) return;
							}

							ui.showCloseButton();
							if (hasError) {
								var conf = confirm("An error has occured when applying your translation\r\nYour game might can not be played properly.\r\nDo you want to read the online documentation?");
								if (conf) nw.Shell.openExternal(nw.App.manifest.localConfig.defaultDocsUrl+trans.gameEngine);
							}
							
							options.onDone.call(trans, data);
						}
					})
					
				}
			});
					
			
		}});		
		
		isHandled = true;
	} else if (enginePattern['wolf'].includes(trans.gameEngine)) {
		var transPath = targetDir+"\\translation.trans";
		var child_process = require('child_process');
		// remove existing data directory
		
		child_process.spawnSync("RMDIR", [targetDir+"\\Data", "/S", "/Q"]);
		
		//ui.loadingClearButton();
		ui.showLoading();
		ui.loadingProgress("Loading", "Copying data...", {consoleOnly:true, mode:'consoleOutput'});
		
		
		php.copyTree(sourceMaterial, targetDir, {
		 onData: function(data) {
			ui.loadingProgress("Loading", data, {consoleOnly:true, mode:'consoleOutput'});
		 },
		 onDone: function() {
			
			var autofillFiles = [];
			var checkbox = $(".fileList .data-selector .fileCheckbox:checked");
			for (var i=0; i<checkbox.length; i++) {
				autofillFiles.push(checkbox.eq(i).attr("value"));
			}
			options.files = options.files||autofillFiles||[];


			var hasError = false;
			trans.save(transPath,
			{
				onSuccess:function() {
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
							ui.loadingProgress("Loading", buffer, {consoleOnly:true, mode:'consoleOutput'});
							
						},
						onError:function(buffer) {
							ui.loadingProgress("Loading", buffer, {consoleOnly:true, mode:'consoleOutput', classStr:'stderr'});
							hasError = true;
						},
						onDone: async function(data) {
							//console.log(data); 
							console.log("done")
							//ui.hideLoading(true);
							//console.log("has Error?", hasError);
							ui.loadingEnd("Finished", "All process finished!", {consoleOnly:false, mode:'consoleOutput', error:hasError});
							engines.wolf.onApplySuccess(targetDir);

							ui.LoadingAddButton("Open folder", function() {
								nw.Shell.showItemInFolder(transPath);
							},{
								class: "icon-folder-open"
							});
							ui.LoadingAddButton("Play!", function() {
								console.log("Opening game");
								nw.Shell.openItem(targetDir+"\\Game.exe");
							},{
								class: "icon-play"
							});

							if (engines.hasHandler('afterInjectHandler')) {
								var blocking = await engines.handler('afterInjectHandler').apply(that, mainArgs);
								if (blocking) return;
							}

							ui.showCloseButton();
							if (hasError) {
								var conf = confirm("An error has occured when applying your translation\r\nYour game might can not be played properly.\r\nDo you want to read the online documentation?");
								if (conf) nw.Shell.openExternal(nw.App.manifest.localConfig.defaultDocsUrl+trans.gameEngine);
							}
							options.onDone.call(trans, data);
						}
					})
					
				}
			});
					
			
		}});		
		
		
		isHandled = true;
		
	}		
	
	if (trans.gameEngine == "spreadsheet") {
		alert("Sorry, but currently the injector handler for this engine not yet implemented. Please try to export instead. The result will be same.");
	} else {
		if (!isHandled) alert("No handler for engine : "+trans.gameEngine+"\nPlease get the latest version of Translator++");
	}
}


$(document).ready(function() {
	trans.applyTranslation = new ApplyTranslation();

});

