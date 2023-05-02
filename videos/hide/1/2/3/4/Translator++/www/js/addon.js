/**
 * @file Manages the addons
 * @author Dreamsavior 
 * 
 */

//"use strict"
window.fs = window.fs||require('fs');
/**
 * @class
 * @param  {string} path
 * @param  {} options
 */
var Addon = function(path, options) {
	// this is a Addon class
	this.path = path;
	var pluginPath = nw.App.manifest.localConfig.addons;
	pluginPath = pluginPath.replace(/\\/g, "/");
	
	this.fullPath = pluginPath+"/"+this.path	
	this.options = options || {};
	this.options.onload = this.options.onload || (() => {});
	this.files = {};
	this.package = {};
	this.param = {};
	this.config = {
		isDisabled : false,
		isMandatory : false
	};
	this.isReady = false;
	this.html;

	this.init.apply(this, arguments);
	
}
/**
 * Detect whether pathName contains "ao://"
 * @param  {} pathName
 */
Addon.isExternalScript = function(pathName) {
	//console.log("detecting isExternalScript", pathName);
	if (pathName.substr(0, 5) == "ao://") return true;
	return false;
}

Addon.getLocalLocationExtScript = function(pathName) {
	return pathName.substring(5);
}

Addon.prototype.setConfig = function(key, value) {
	this.config[key] = value;
	sys.saveConfig()
	return this.config;
}

Addon.prototype.getConfig = function(key) {
	return this.config[key];
}

Addon.prototype.getLocation = function() {
	// get location of the engine
	return nwPath.normalize(nwPath.join(__dirname, this.fullPath));
}

Addon.prototype.getWebLocation = function() {
	// get location of the engine
	return this.fullPath.substring(nwPath.dirname(location.pathname).length);
}

Addon.prototype.createElement = function() {
	if (Boolean(document.getElementById('addons')) == false) {
		//console.log("Creating addon element!");
		var wraper = document.createElement("div");
		wraper.setAttribute("id", "addons")
		wraper.setAttribute("class", "addon hidden")
		wraper.setAttribute("style", "display:none")
		document.body.appendChild(wraper);
	}
	
	var addOnId = "_addon_"+this.path;
	
	// remove existing element;
	var existing = document.getElementById(addOnId)
	if (existing) existing.remove();
	
	this.html = document.createElement('div');
	this.html.setAttribute("class", "addon "+this.path);
	this.html.setAttribute("name", this.path);
	this.html.setAttribute("id", addOnId);
	document.getElementById('addons').appendChild(this.html);
		
	return this.html;
}

Addon.prototype.loadPackage = async function() {
	//var json = fs.readFileSync(this.fullPath+"/package.json");
	var json = await common.fileGetContents(this.fullPath+"/package.json");
	try {
		this.package = JSON.parse(json);
	} catch (e) {
		console.warn("加载package.json时出错", this.fullPath+"/package.json", json);
	}
	this.package.config = this.package.config || {};
	Object.assign(this.config, this.package.config);
	return this.package;
}

Addon.prototype.attachScript = function(scriptPath) {
	// attach script directly to the head section of html
	console.warn("附加脚本：", scriptPath);
	var relPath = scriptPath.split("/");
	relPath.shift();
	relPath = relPath.join("/");	
	console.log("relPath", relPath);	
	
	var script = document.createElement('script');
	script.setAttribute("type", "text/javascript");
	script.setAttribute("id", "_addon_script_"+this.path);
	script.onload = function(e) {

	}
	script.setAttribute("src", relPath);

	this.html.appendChild(script);

}

Addon.prototype.loadJS = async function(path, parentObj) {
	console.log("Loading JS", path);
	Addon.userscripts = Addon.userscripts||require('userscript-meta');

	return new Promise(async (resolve, reject) => {
		if (Addon.isExternalScript(path)) {
			if (Boolean(localStorage[path]) == false) {
				var localPath = Addon.getLocalLocationExtScript(path);
				if (await common.isFileAsync(nwPath.join(__dirname,localPath))) {
					var data = await common.fileGetContents(nwPath.join(__dirname,localPath));
					try {
						eval(data.toString());
					} catch(e) {
						console.warn(e);
					}
				} else {
					if (common.debugLevel() > 1) console.warn("找不到文件：", path);
				}

			} else {
				try {
					var thisScript = localStorage.getItem(path);
					var thisMeta = common.extractString(thisScript, "==UserScript==", "==/UserScript==");
					//console.log("meta: ",thisMeta);
					this.identity = Addon.userscripts.parse(thisMeta);
					
					eval(thisScript);
				} catch(e) {
					console.warn(e);
				}
			}
			
			resolve(this);
			return;
		}


		var thisScript = await common.fileGetContents(path);
		thisScript = thisScript.toString();
		var thisMeta = common.extractString(thisScript, "==UserScript==", "==/UserScript==");
		this.identity = Addon.userscripts.parse(thisMeta);

		try {
			let AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
			var thisExecution = new AsyncFunction(thisScript);
			//var thisExecution = new Function(thisScript);
			thisExecution.call(this, this.param);
			resolve(this);
		} catch (e) {
			console.warn("执行脚本时出错："+this.path, e)
			this.attachScript(path);
			reject("执行脚本时出错："+this.path);
		}

	});
}

Addon.prototype.getPathRelativeToRoot = function() {
	return nwPath.join(nw.App.manifest.localConfig.addons, this.path)
}

Addon.prototype.getRootDocPath = function(path) {
	var thisPath = path.split("/");
	thisPath.shift();
	return thisPath.join("/");
}

Addon.prototype.loadCss = async function(path, parentObj) {
	//console.log("addon init arguments : ", arguments);
	parentObj = parentObj || {}
	return new Promise ((resolve, reject) => {
		var script = document.createElement('link');
		script.setAttribute("rel", "stylesheet");
		script.setAttribute("type", "text/css");
		script.setAttribute("data-path", path);
		script.onload = (e) => {
			//console.warn("CSS loaded : ", this.path);
			parentObj.elm = script;
			resolve(script)
			
		}
		script.setAttribute("href", this.getRootDocPath(path));

		this.html.appendChild(script);
	});

}

Addon.prototype.loadHTML = async function(path, parentObj) {
	parentObj = parentObj ||{};
	return new Promise ((resolve, reject) => {
		var htmlString =  fs.readFileSync(path).toString();
		var div = document.createElement('div');
		div.setAttribute("data-path", path);
		div.innerHTML = htmlString.trim();
		this.html.appendChild(div);
		parentObj.elm = div
		resolve(div); 	
	});
}

Addon.prototype.onReady = function(fn) {
	if (typeof fn !== 'function') fn = function() {};
	this.__onScriptsLoadedPool = this.__onScriptsLoadedPool||[];
	
	if (Boolean(this.isReady) == false) {
		this.__onScriptsLoadedPool.push(fn)
	} else {
		for (var i=0; i<this.__onScriptsLoadedPool.length; i++) {
			this.__onScriptsLoadedPool[i].apply(this, arguments);
		}
		
		fn.apply(this, arguments);
	}		
}

Addon.prototype.init = async function() {
	//console.log("addon init arguments : ", arguments);
	//this.isLoaded = false;
	this.createElement();
	await this.loadPackage();

	var finish = () => {
		this.isReady = true;
		this.options.onload.apply(this);
		this.onReady();
		$(document).trigger("addonLoaded", this);
	}
	
	sys.config.addons 			= sys.config.addons || {};
	sys.config.addons.package 	= sys.config.addons.package || {};
	sys.config.addons.package[this.package.name] = sys.config.addons.package[this.package.name] || this.config || {}
	this.config = sys.config.addons.package[this.package.name];
	if (this.config.isDisabled == true) {
		finish();
		return this;
	};
	
	//Addon.userscripts = Addon.userscripts||require('userscript-meta');
	//console.log("%cpackage : ","color:blue", this.package);
	var dirContent = [];
	if (this.package.autoload) {
		//console.log("Autoloading content");
		// todo : async this
		dirContent = common.getAllFiles(this.fullPath);
	}
	
	if (Array.isArray(this.package.load)) {
		// convert to the path relative to root
		var loaded = [];
		for (var i=0; i<this.package.load.length; i++) {
			// detect if resource is not local
			if (Addon.isExternalScript(this.package.load[i])) {
				//console.log("adding external resource:", this.package.load[i]);
				loaded.push(this.package.load[i]);
				continue;
			}
			loaded.push(nwPath.join(this.getPathRelativeToRoot(), this.package.load[i]));
		}
		// merge with package.load
		dirContent = dirContent.concat(loaded);
	}
	console.log(dirContent);
	
	var promises = [];
	for (var i=0; i<dirContent.length; i++) {
		var thisPath = dirContent[i];
		var thisData = {}
		var relPath = thisPath.substr(this.fullPath.length)
		thisData.path 	= thisPath
		thisData.ext 	= getFileExtension(thisPath).toLowerCase();
		
		if (nwPath.basename(thisPath)[0] == "!") {
			// skip including if the first character of filename is "!"
			this.files[relPath] = thisData;
			continue;
		}
		//console.log("loading:", thisPath);
		if (thisData.ext == "js") {
			promises.push(this.loadJS(thisPath, thisData))
		} else if (thisData.ext == "htm" || thisData.ext == "html") {
			promises.push(this.loadHTML(thisPath, thisData)
				.then((elm) => {})
				)
		} else if (thisData.ext == "css") {
			promises.push(this.loadCss(thisPath, thisData)
				.then((elm) => {})
			)
		}
		
		this.files[relPath] = thisData;
	}
	
	return new Promise((resolve, reject) => {
		Promise.all(promises)
		.then(() => {
			finish();
			resolve(this);
		})
	})
}


var AddonLoader = function() {
	this.init.apply(this, arguments);
}


AddonLoader.prototype.init = function() {
	this.isInitialized = false;
	this.isInitialized = true;
	this.onReady.apply(this, arguments);
	this.addons = {};
	this.scriptsLoaded = false;
	
}

AddonLoader.prototype.waitForProcess = async function(path, addon) {
	// executes waitFor
	this._waitForHolder = this._waitForHolder||{};
	if (!this._waitForHolder[path]) return;

	// execute resolver
	this._waitForHolder[path](addon);
}

AddonLoader.prototype.waitFor = async function(path, addon) {
	var holdUp = async ()=> {
		this._waitForHolder = this._waitForHolder||{};

		return new Promise((resolve, reject) => {
			this._waitForHolder[path] = resolve;
		})
	}

	try {
		if (this.addons[path].isReady) {
			return this.addons[path];
		} else {
			return holdUp();
		}
	} catch (e) {
		return holdUp();
	}
}

AddonLoader.prototype.onScriptsLoaded = function(act) {
	if (typeof act !== 'function') return console.log("parameter must be a function", act);
	this.__onScriptsLoadedPool = this.__onScriptsLoadedPool||[];
	
	if (Boolean(this.scriptsLoaded) == false) {
		this.__onScriptsLoadedPool.push(act)
	} else {
		for (var i=0; i<this.__onScriptsLoadedPool.length; i++) {
			this.__onScriptsLoadedPool[i].apply(this, arguments);
		}
		
		act.apply(this, arguments);
	}	
}

AddonLoader.prototype.getAddon = function(id) {
	return this.addon[id];
}


AddonLoader.prototype.onReady = AddonLoader.prototype.onScriptsLoaded;



AddonLoader.prototype.openManagerWindow = function (param) {
	param = param||"";
	nw.Window.open('www/addons.html#'+param,{'frame':false, 'transparent':true}, 
		function(thisWin) {
			ui.windows['addonLoader'] = thisWin.window;
		}
	);
}

AddonLoader.prototype.load = async function(dir) {
	if (this.addons[dir]) return; // already loaded;

	var addonPath = nw.App.manifest.localConfig.addons;
	addonPath = addonPath.replace(/\\/g, "/");

	//if (fs.lstatSync(addonPath+"/"+items[i]).isDirectory() == false) continue;
	if (await common.isDirectory(addonPath+"/"+dir) == false) return;
	//console.log("Reading addon folder", items[i]);
	//if (common.isFile(addonPath+"/"+items[i]+"/package.json") == false) continue;
	if (await common.isFileAsync(addonPath+"/"+dir+"/package.json") == false) return;
	
	console.log("Loading addon ", addonPath+"/"+dir);
	this.addons[dir] = new Addon(dir);
}

AddonLoader.prototype.loadAll = async function(options) {
	options = options||{}
	options.onScriptsLoaded = options.onScriptsLoaded||function(){};

	var addonPath = nw.App.manifest.localConfig.addons;
	addonPath = addonPath.replace(/\\/g, "/");
	

	this.totalAddon = 0;
	this.addonLoaded = 0;

	console.log("--------------Listening to event: addonLoaded-----------");
	$(document).off("addonLoaded");
	$(document).on("addonLoaded", (e, addon) => {
		this.addonLoaded++;
		console.log(`>>Addon loaded ${this.addonLoaded}/${this.totalAddon}`, addon);
		this.waitForProcess(addon.path, addon);
		if (this.addonLoaded >= this.totalAddon) {
			console.log("Running addonLoader.onReady");
			this.scriptsLoaded = true;
			this.onReady(function(){});
		}
	})
	
	fs.readdir(addonPath, async (err, items) => {
		//console.log(items);
		console.log("Loading addons:", items);
		this.totalAddon = items.length;
		for (var i=0; i<items.length; i++) {
			this.load(items[i]);
		}
	});
	
	this.__allFileIsAdded = true;

	this.isComplete = true;	
	
}

AddonLoader.prototype.getByName = function(name) {
	try {
		for (var i in this.addons) {
			if (this.addons[i].package.name == name) return this.addons[i]
		}
	} catch (e) {
		
	}
}

AddonLoader.prototype.install = function(targetPath, callback) {
	callback = callback || function(){};
	var _7z = _7z||require('7zip-min');
	if (Array.isArray(targetPath) == false) targetPath = [targetPath]
	
	var promises = [];
	for (var i=0; i<targetPath.length; i++) {
		promises.push(new Promise((resolve, reject) => {
			_7z.cmd(['x', '-tzip', targetPath[i], '-o'+nw.App.manifest.localConfig.addons], (err) => {
				if (err) console.warn(err);
				console.log("installation done : ", targetPath[i]);
				resolve();
			});
		}))		
	}
	
	return new Promise((resolve, reject) => {
		Promise.all(promises)
		.then(()=> {
				console.log("all addons are installed");
				callback()
				resolve()
		})
	})
	
}

AddonLoader.prototype.uninstall = async function(package) {
	console.log("uninstall", package);
	//'rmdir c:\test /s /q'
	if (Boolean(package) == false) return;
	if (Boolean(package.path) == false) return;
	if (package.path == "." || package.path == "/" || package.path == "./" || package.path == "\\") return;
	console.log([nwPath.join(__dirname, "www/addons", package.path), "/s", "/q"]);
	try {
		await common.aSpawn("rmdir", [nwPath.join(__dirname, "www/addons", package.path), "/s", "/q"], { shell: true });
		delete this.addons[package.path];
	} catch (e) {
		
	}
}


/**
 * AddonIstaller
 * Handle addon installation
 * @param  {} location
 * @param  {} type
 */
var AddonInstaller = function(location, type) {
	this.location 	= location;
	this.type 		= type || "";
	if (!(this.type)) {
		if (typeof this.location == "number") {
			this.type = "store";
		} else if (this.location.substr(0, 8) == "https://") {
			this.type = "remote";
		} else if (this.location.substr(0, 7) == "http://") {
			this.type = "remote";
		}
		this.type = this.type || "local";
	}

}	

AddonInstaller.localConfig = {};
if (common.isJSON(localStorage.getItem("AddonInstaller"))) {
	AddonInstaller.localConfig = JSON.parse(localStorage.getItem("AddonInstaller"));
}

AddonInstaller.setConfig = function(key, value) {
	this.localConfig = this.localConfig || {};
	this.localConfig[key] = value;
	localStorage.setItem("AddonInstaller", JSON.stringify(this.localConfig));
	return this.localConfig;
}

AddonInstaller.getConfig = function(key) {
	this.localConfig = this.localConfig || {};
	if (common.isJSON(localStorage.getItem("AddonInstaller"))) {
		this.localConfig = JSON.parse(localStorage.getItem("AddonInstaller"));
	}	
	this.localConfig = this.localConfig || {};
	return this.localConfig[key];
}


/**
 * Write newly installed addon to configuration
 * unused
 */
AddonInstaller.configInstall = async function(addonName, options) {
	if (!addonName) return console.warn("插件的名称不能为空！");
	var installedList = this.getConfig("installed") || {};
	options = options || {};
	installedList[addonName] = options;
	installedList[addonName].date = Date();

	this.setConfig("installed", installedList);
}


/**
 * Uninstall addon from configuration
 * unused
 */
 AddonInstaller.configUninstall = async function(addonName) {
	if (!addonName) return console.warn("插件的名称不能为空！");
	var installedList = this.getConfig("installed") || {};
	if (!installedList[addonName]) return; 
	delete installedList[addonName];
	this.setConfig("installed", installedList);
}

AddonInstaller.isInstalled = function(addonName) {
	if (!addonName) return console.warn("插件的名称不能为空！");
	var installedList = this.getConfig("installed") || {};
	if (installedList[addonName]) return true;
	return false; 
}
/**
 * Get directory name relative to www/addons/
 * @param  {} addonName
 */
AddonInstaller.getRootAddonDir = function(addonName) {
	if (!addonName) return console.warn("插件的名称不能为空！");
	var thisConfig = this.getConfig("installed");
	if (!thisConfig[addonName]) return;
	if (!thisConfig[addonName].content) return;

	thisConfig[addonName].content.dirs = thisConfig[addonName].content.dirs || [];
	for (var i in thisConfig[addonName].content.dirs) {
		var thisPath = thisConfig[addonName].content.dirs[i];
		if (thisPath.substring(0, 11) !== 'www\\addons\\') continue;

		var thisRelPath = thisPath.substring(11);

		if (/\\/g.test(thisRelPath) == false) return thisRelPath;
	}
}

AddonInstaller.prototype.install = async function(target, options) {
	target = target || __dirname;
	options= options || {};
	options.onError = options.onError || async function(){};
	options.onSuccess = options.onSuccess || async function(){};
	var action = "";
	var url = "";
	var saveto = "";
	var packageLocation = "";
	var currentObj = "";

	if (this.type == "store") {
		// get url from addon id
		//await common.download(url, saveto, options);
		url = `https://dreamsavior.net/rest/addons/get/?id=${this.location}&ver=${nw.App.manifest.version}`;
		var addonObj =  await common.fetch(url);
		console.log(addonObj);
		if (typeof addonObj !== 'object') {
			console.warn("无效类型addonObj");
			options.onError.call(this, t("无效类型addonObj"), addonObj);
			return;
		}
		if (Array.isArray(addonObj.addons) == false) {
			console.warn("无效类型addonObj.addons");
			options.onError.call(this, t("无效类型addonObj.addons"), addonObj);
			return;
		}
		if (addonObj.addons.length < 1) {
			console.warn("你没有资格获得这个插件");
			options.onError.call(this, t("你没有资格获得这个插件"), addonObj);
			return;
		}
		currentObj = addonObj.addons[0];
		
		url = currentObj.url;
		//console.log(url);
		if (Boolean(url) == false) return;
		
		// do remote processing now
		action = "remote";
	}

	// running on before install
	try {
		if (typeof currentObj == "object") {
			if (Boolean(currentObj.onBeforeInstall)) {
				eval(currentObj.onBeforeInstall);
			}
		}
	} catch (e) {
		console.warn("尝试运行onBeforeInstall脚本时出错");
	}

	
	if (this.type == "remote" || action == "remote") {
		console.log("fetching remote location");
		url = url || this.location;
		saveto = nwPath.join(nw.process.env.TMP, "addon_"+common.rand(1, 1000000));
		packageLocation = await common.download(url, saveto);
		console.log("saved to", saveto);
		
		// do local processing now
		action = "local";		
	}
	
	if (this.type == "local" || action == "local") {
		packageLocation = packageLocation || this.location;
		console.log("extracting to : ", target);
		await common.extract(packageLocation, target);
	}
	
	// running on after install
	try {
		if (typeof currentObj == "object") {
			if (Boolean(currentObj.onAfterInstall)) {
				eval(currentObj.onAfterInstall);
			}
		}
	} catch (e) {
		console.warn("尝试运行onAfterInstall脚本时出错");
	}
	console.log("All process done");
	AddonInstaller.configInstall(this.location, {
		content: await common.listArchiveContent(packageLocation)
	});

	options.onSuccess.call(this);
	return true;
}




var addonLoader = new AddonLoader();
window.AddonInstaller = AddonInstaller;



$(document).ready(function() {
	sys.onReady(()=> {
		addonLoader.loadAll();
	});
});