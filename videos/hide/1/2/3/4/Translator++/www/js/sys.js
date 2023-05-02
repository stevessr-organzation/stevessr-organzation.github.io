// events : configLoaded

window.fs = window.fs||require('graceful-fs');
window.gui = require('nw.gui');
try {
	window.transConfig = JSON.parse(localStorage.getItem('Config'));
} catch (e){
	console.log(e);
}

Sys = function() {
	this.clipboard = gui.Clipboard.get();
	this.config = window.transConfig || {};
	this.config.maxFileHistory = 30;
	this.app = nw.App.manifest;
	this.supportedExtension = nw.App.manifest.localConfig.extensions || [];
}

Sys._default = {
			configPath:__dirname+"\\data\\config.json",
			lastOpenedProject:{},
			historyOpenedProject : {},
			historyOpenedFiles :[],
			translator:"google"
		}


// Clipboard
Sys.prototype.afterSelectionAction = function(row, col, row2, col2, layer) {
	console.log("running sys.afterSelectionAction");
	console.log(arguments);
	this.clipboard.set(trans.data[row][0]);
}

Sys.prototype.toggleAutoClipboard =function(state) {
	state = state||false;
	
	if (state) {
		this.isClipboardMonitored = true;
		console.log("Begin monitoring cell selection");
		trans.grid.addHook('afterSelectionEnd', this.afterSelectionAction);
	} else {
		this.isClipboardMonitored = false;
		console.log("Stop monitoring cell selection");
		trans.grid.removeHook('afterSelectionEnd', this.afterSelectionAction);
	}
	return state;
}


Sys.prototype.loadConfig = async function(configPath, options) {
	if (window.transConfig) {
		if (typeof options.onSuccess == 'function') options.onSuccess.call(this, window.transConfig);
		this.config = window.transConfig;
		this.config.stagingPath =  this.config.stagingPath || nw.App.manifest.localConfig.defaultStagingPath;
		this.config.default 	=  this.config.default || {};
		this.config.default.sl 	=  this.config.default.sl || "ja";
		this.config.default.tl 	=  this.config.default.tl || "zh-CN";
		
		this.isLoadingConfig = false;
		this.configIsLoaded = true;
		this.isInitialized = true;
		this.onReady.call(this, options.onReady);			
		return;
	}	
	
	
	configPath = configPath||__dirname+"\\data\\config.json";
	options = options||{};
	options.onReady = options.onReady||function(){};
	var thisSys = this;
	var initConfig = function() {
		/*
			thisSys.config = {
			configPath:configPath,
			lastOpenedProject:{},
			historyOpenedProject : {},
			historyOpenedFiles :[],
			translator:"google"
		}
		*/
		thisSys.config = JSON.parse(JSON.stringify(Sys._default));
		thisSys.saveConfig();		
		return thisSys.config;
	}
	
	thisSys.isLoadingConfig = true;
	thisSys.configIsLoaded = false;
	console.log("loading config : "+configPath);
	

	return new Promise((resolve, reject) => {
		fs.readFile(configPath, function (err, data) {
			if (err) {
				//throw err;
				//console.log("error opening file : "+filePath);
				initConfig();
				//data = data.toString();
				if (typeof options.onFailed =='function') options.onFailed.call(thisSys, data);
				reject(err);
				return;
			} else {
				data = data.toString();
				var jsonData = JSON.parse(data);
				thisSys.config = jsonData;
				if (typeof options.onSuccess == 'function') options.onSuccess.call(thisSys, jsonData);
			}
			// default
			thisSys.config.stagingPath =  thisSys.config.stagingPath || nw.App.manifest.localConfig.defaultStagingPath;
			thisSys.config.default 		=  thisSys.config.default || {};
			thisSys.config.default.sl 	=  thisSys.config.default.sl || "ja";
			thisSys.config.default.tl 	=  thisSys.config.default.tl || "zh-CN";
			
			thisSys.isLoadingConfig = false;
			thisSys.configIsLoaded 	= true;
			thisSys.isInitialized 	= true;
			$(window).trigger("configLoaded");
			thisSys.onReady.call(thisSys, options.onReady);	
			resolve(thisSys.config);
			return thisSys.config;
		});	
	})
	
}

Sys.prototype.saveConfig = async function(configPath, options) {
	//configPath = configPath||this.config.configPath||__dirname+"\\data\\config.json";
	configPath = configPath||nw.App.manifest.localConfig.configFile||__dirname+"\\data\\config.json";
	this.config.configPath = configPath; // updating config path
	options = options||{};
	localStorage.setItem('Config', JSON.stringify(this.config));
	console.log("saving log to : "+configPath);
	return new Promise((resolve, reject) => {
		fs.writeFile(configPath, JSON.stringify(this.config, null, 2),  (err) => {
			console.log("done saving config");
			if (err) {
				if (typeof options.onFailed =='function') options.onFailed.call(trans, saveData, configPath);
				reject(err)
			} else {
				if (typeof options.onSuccess == 'function') options.onSuccess.call(trans, saveData, configPath);
				resolve(this.config)
			}
		});			
	})

}

Sys.prototype.updateLastOpenedProject = function(projectData) {
	projectData = projectData||trans.project||{};
	
	this.config.lastOpenedProject = {
		buildOn: projectData.buildOn,
		gameEngine: projectData.gameEngine,
		gameTitle: projectData.gameTitle,
		projectId: projectData.projectId
	}
	this.config.historyOpenedProject = this.config.historyOpenedProject || {}
	this.config.historyOpenedProject[projectData.projectId] = this.config.lastOpenedProject;
	this.saveConfig();
	
}

Sys.prototype.insertOpenedFileHistory = function(filePath, projectId, gameTitle, initiator) {
	filePath = filePath||trans.currentFile||"";
	projectId = projectId||trans.projectId||"";
	gameTitle = gameTitle||trans.gameTitle||"";
	initiator = initiator||trans.initiator||"user";
	
	console.log("running sys.insertOpenedFileHistory. initiator : "+initiator);
	if (filePath == "") return false;
	
	this.config.historyOpenedFiles = this.config.historyOpenedFiles || []
	for (var i=0; i< this.config.historyOpenedFiles.length; i++) {
		//console.log(this.config.historyOpenedFiles[i].path +" == "+ filePath);
		if (this.config.historyOpenedFiles[i].path == filePath) {
			this.config.historyOpenedFiles.splice(i, 1);
			break;
			//return true;
		}
	}
	
	this.config.historyOpenedFiles.unshift({
		path:filePath,
		projectId:projectId,
		gameTitle:gameTitle,
		time:Date.now(),
		'initiator':initiator
	});
	
	if (this.config.historyOpenedFiles > this.config.maxFileHistory) {
		this.config.historyOpenedFiles.pop();
	}
	
	this.saveConfig();
}

Sys.prototype.loadFileHistory = function(index) {
	index = index||0;
	if (typeof this.config.historyOpenedFiles[index] == "undefined") return false;
	
	var targetPath = this.config.historyOpenedFiles[index].path;
	console.log("Opening : "+targetPath);
	trans.open(targetPath);
}


Sys.prototype.checkPHPEngine = function(options) {
	if (Boolean(this.phpIsReady) !== false)	return true;
	if (Boolean(php) == false) return;
	
	options = options||{};
	options.onDone = options.onDone||function(){};
	var that = this;
	php.spawn("version.php", {
		onDone:function(data) {
			//options.onDone.call(that, data);
			console.log("Version of PHP :");
			
			console.log(data);
			if (typeof data == undefined || data.version == undefined) {
				ui.warning(`<b>无法运行PHP解释器！</b><br />
				Translator++需要PHP CLI来运行一些必需的过程。<br />
				此错误通常是因为您的计算机未安装<a href="http://dreamsavior.net/download/#TPPSysreq">微软Visual C++可重新发布的正确版本</a></b>.
				<div class="blockBox warningBlock withIcon">
					<ul>
						<li>请安装<a href="http://dreamsavior.net/download/#TPPSysreq">需要运行时</a>。</li>
						<li>如果你已经安装了所有的运行库，并且仍然有这个错误，请将Translator++安装目录移到其他文件夹。</li>
					</ul>
				</div>
				有关此症状的更多信息，请查看<a href='http://dreamsavior.net/docs/translator/faq/have-installed-all-required-vc-redist-but-still-got-an-error/'>文档</a>。`,
				"初始化错误！");
			} else {
				that.phpVersion = data.version;
			}
		}
	});
	
}

Sys.prototype.getOpenedFile = function() {
	console.log("initiating opened file");
	this.openedFile = "";
	if (Array.isArray( window.args )) {
		this.openedFile = window.args[0];
	} else {
		window.args = window.args||"";
		if (window.args.length < 1) return "";
		/*
		var n = window.args.lastIndexOf(' ');
		this.openedFile = window.args.substring(n + 1);
		*/
		var { parseArgsStringToArgv } = require('string-argv');
		var argArray = parseArgsStringToArgv(window.args);
		this.openedFile = argArray.pop();
		
		if (this.openedFile.length < 1) return this.openedFile;
		
		if (this.openedFile[0] == '"') {
			this.openedFile = this.openedFile.substring(1, this.openedFile.length-1);
		}
	}		
	console.log(this.openedFile);
	return this.openedFile;
}

Sys.prototype.initApp = function() {
	//var query = window.location.hash.substr(1);
	//var thisQuery = parseQuery(query);
	//if (Boolean(thisQuery.autoload) == false) return false;
	
	this.checkPHPEngine();
	/*
	var conf = confirm("Do you want to load last saved data?");
	if (conf == true) {
		this.loadFileHistory(0);
	}
	*/
	var openedFile = this.getOpenedFile();
	if (Boolean(openedFile)!== false) {
		ui.introWindowClose();
		
		var thisExt = openedFile.substring(openedFile.lastIndexOf(".")+1);
		thisExt = thisExt.toLowerCase();
		
		if (thisExt == "json" || thisExt == 'trans') {
			trans.open(openedFile);
		} else if (thisExt == "tpp") {
			trans.importTpp(openedFile);
		}
		return;
	}
	ui.showRecentFile(5);
}

Sys.prototype.onReady = function (onReadyEvent) {
	if (typeof onReadyEvent !== 'function') return console.log("parameter must be a function");
	this.__onReadyPool = this.__onReadyPool||[];
	
	if (Boolean(this.isInitialized) == false) {
		this.__onReadyPool.push(onReadyEvent)
	} else {
		for (var i=0; i<this.__onReadyPool.length; i++) {
			this.__onReadyPool[i].apply(this, arguments);
		}
		this.__onReadyPool = [];
		
		onReadyEvent.apply(this, arguments);
	}
}

var sys = new Sys();

$(document).ready(function() {
	sys.loadConfig(undefined, {
		onSuccess: function() {
			if (typeof ui !== 'undefined') {
				ui.onReady(function() {
					sys.initApp();
				});
			}
		}
	});
});