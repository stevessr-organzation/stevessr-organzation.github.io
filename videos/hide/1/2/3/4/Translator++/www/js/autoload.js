window.fs = window.fs||require('fs');
var Autoload = function() {
	this.init.apply(this, arguments);
}


Autoload.prototype.init = function() {
	this.isInitialized = false;
	
	this.isInitialized = true;
	this.onReady.apply(this, arguments);
	
}

Autoload.prototype.onScriptsLoaded = function(act) {
	if (typeof act !== 'function') return console.log("parameter must be a function");
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

Autoload.prototype.onReady = Autoload.prototype.onScriptsLoaded;


Autoload.prototype.load = function(options) {
	options = options||{}
	options.onScriptsLoaded = options.onScriptsLoaded||function(){};
	
	var pluginPath = __dirname+"\\"+consts.rootPath+consts.pathToPlugins;
	var pathToPlugins= consts.pathToPlugins.replace("\\", "/");
	
	var dirContent = getDirectoryContent(pluginPath);
	console.log("Plugin path content : ", dirContent);
	var items = dirContent.files;
	
	this.__loaded = {};
	this.__scriptCount = 0;
	this.__loadedCount = 0;
	for (var i=0; i<items.length; i++) {
		items[i] = items[i].substring(pluginPath.length);
		items[i] = items[i].replace(/\\/g,"/");
		let ext = getFileExtension(items[i]);
		if (ext.toLowerCase() != "js") continue;
		
		this.__loaded[items[i]] = true;
		this.__scriptCount++;
		
		var thisAutoload = this;
		var script = document.createElement('script');
		script.setAttribute("type", "text/javascript");
		script.setAttribute("id", "autoload_"+items[i]);
		script.onload = function(e) {
			var thisId =$(e.path[0]).data("id");
			thisAutoload.__loaded[thisId] = true;
			thisAutoload.__loadedCount += 1;
			if (thisAutoload.__loadedCount >= thisAutoload.__scriptCount && thisAutoload.__allFileIsAdded == true) {

				thisAutoload.scriptsLoaded = true;
				thisAutoload.onScriptsLoaded.call(thisAutoload, options.onScriptsLoaded);
			}
		}
		script.setAttribute("src", pathToPlugins+items[i]);
		$(script).data("id", items[i])
		var head = document.querySelector("head"); 
		head.appendChild(script);
		//var htmlScript = $('<script type="text/javascript" id="autoload_'+items[i]+'" src="'+pathToPlugins+items[i]+'"></script>');
		//$("head").append(htmlScript);

		console.log(items[i]+" loaded!");
	}	
	
	this.__allFileIsAdded = true;
	/*
	
	fs.readdir(pluginPath, function(err, items) {
		for (var i=0; i<items.length; i++) {
			var script = document.createElement('script');
			script.setAttribute("type", "text/javascript");
			script.setAttribute("id", "autoload_"+items[i]);
			script.onload = function() {
				console.log("script loaded via onload event reader:", arguments)
			}
			script.setAttribute("src", pathToPlugins+items[i]);
			var head = document.querySelector("head"); 
			head.appendChild(script);
			//var htmlScript = $('<script type="text/javascript" id="autoload_'+items[i]+'" src="'+pathToPlugins+items[i]+'"></script>');
			//$("head").append(htmlScript);

			console.log(items[i]+" loaded!");
		}
	});
	*/
	this.isComplete = true;	
	//this.onScriptsLoaded.apply(this, arguments);
	
}


var autoload = new Autoload();

$(document).ready(function() {
	autoload.load();
});