/*
TODO 
XUnity.prototype.getConfigPath <-- add more detection for type of patch

*/

var thisAddon 	= this;
var appName 	= this.package.name;
//console.warn("unityTrans Engine", thisAddon);
var spawn 		= spawn || require('child_process').spawn;
var ws 			= ws || require('windows-shortcuts');
var ini 		= ini || require('ini')
var stripBom	= require('strip-bom');
var bCopy 		= require('better-copy');
var fse 		= require('fs-extra')


var XUnity = function(path) {
	this.path 		= path || "";
	this.init.apply(this, arguments)
}


XUnity.isUnity = function(exePath) {
	// TODO
	// for now, let's assume everything is unity
	return true;
}
XUnity.prototype.init = function(path) {
	console.log("路径是：", path);
	if (!path) return;
	path = path || ""
	this.dirname 	= nwPath.dirname(this.path);
}
XUnity.prototype.set = function(key, value){
	this[key] = value;
	if (key == "path") {
		this.dirname = nwPath.dirname(this.path);
	}
	
}

XUnity.prototype.get = function(key) {
	return value;
}

XUnity.prototype.prepare3rdPartyTools = function(toolsId) {
	// see 3rdParty.json
	toolsId = toolsId || "xunity-rei"
	if (thirdParty.isInstalled(toolsId)) return true;
	
	alert(t("需要XUnity Translator来执行此操作\n请通过第三方应用程序安装程序安装它！"))
	if (Boolean(thirdParty.config[toolsId]) == false) {
		var xunityPath = nwPath.join(thisAddon.getLocation(), "3rdParty.json");
		thirdParty.loadConfig(xunityPath);
	}
	thirdParty.check({
		popup:true,
		force:true,
		filter:toolsId
	})	
	return false;
}

XUnity.prototype.getConfigPath = function() {
	//TODO detect path for bepinex, unityInjector & ipa
	this.autoTranslatorPath = nwPath.join(this.dirname, "AutoTranslator");
	return nwPath.join(this.autoTranslatorPath, "Config.ini");
}

XUnity.prototype.getConfig = function() {
	// parse XUnity config file
	if (!this.config) {
		this.autoTranslatorConfig = this.getConfigPath();
		this.config = this.config || {};
		this.config = ini.parse(stripBom(fs.readFileSync(this.autoTranslatorConfig, "utf8").toString()))
		return this.config;
	}
	
	return this.config
}

XUnity.prototype.parse = function(str, contextString) {
	// parse XUnity formatted data
	// format is : 
	/*
		original text=translation
		original text line 2=translation line 2
	*/
	contextString = contextString || "";
	if (typeof str !== 'string') str = "";
	str = str.replace(/\r/g, "");
	var lines = str.split("\n");
	var result = {
			data:[],
			context:[],
			indexIds:{},
			indexIsBuilt:true
		}
	
	var numLine = 0;
	for (var i in lines) {
		if (lines[i].includes("=") == false) continue;
		var segment = lines[i].split("=");
		// check whether same record is already exist
		if (Boolean(result.indexIds[segment[0]])) continue;
		
		// registering index;
		result.indexIds[segment[0]] = numLine;
		
		// handling data
		result.data[numLine] = [segment[0], segment[1]];
		
		// handling context
		var contextPath = nwPath.join(contextString, "line", numLine+"")
		contextPath = contextPath.replace(/\\/g, "/")
		result.context[numLine] = [contextPath];
		numLine++;
	}
	
	return result;
}

XUnity.prototype.fetch = function() {
	// fetch current existing translations into trans format
	// should not fetch folder inside translator++
	console.log("Parsing Unity game");
	var activeTransDir 	= this.getActiveTranslationDirectory(true);
	var skipDir 		= this.getTransInjectPath();
	
	var result 			= {};
	var that 			= this;
	console.log("解析", activeTransDir);
	return new Promise((resolve, reject)=> {
		var promises = [];
		
		bCopy.walk(activeTransDir, {
			onFile : (filepath, stats) => {
				// when meet a file
				console.log(arguments);
				if (common.isRelated(filepath, skipDir)) return console.log("Skip : ", filepath);
				console.log("processing : ", filepath);
				promises.push(new Promise((resolve, reject)=> {
					fs.readFile(filepath, (err, data) => {
						if (err) throw err;
						console.log(data);
						var relPath 				= filepath.substring(activeTransDir.length)
						relPath 					= relPath.replace(/\\/g, "/")
						result[relPath] 			= that.parse(data.toString(), relPath);
						result[relPath].dirname 	= nwPath.dirname(relPath);
						result[relPath].basename 	= nwPath.basename(relPath);
						result[relPath].filename 	= nwPath.basename(relPath);
						result[relPath].extension 	= nwPath.extname(relPath).substring(1);
						result[relPath].path 		= relPath;
						result[relPath].relPath 	= relPath;
						result[relPath].originalFormat 	= "XUnity.AutoTranslator";
						result[relPath].type 		= "";
						result[relPath].lineBreak 	= "\r\n";
						resolve();
					});//readfile
				}))
			},
			onDir : function(filepath, stats) {
				// when meet a folder
				console.log(arguments);
			}
		})
		.then((folderContents) => {
			// the recursive content of folder in array format
			console.log("Walk finished", folderContents)
			return Promise.all(promises);
		}).then(()=>{
			console.log("parsed data", result);
			resolve(result);
		})
	});
}

XUnity.prototype.getGameTitle = function() {
	return nwPath.basename(this.dirname);
}

XUnity.prototype.newProject = function() {
	console.log("create new project")
	var project = {
		project : {
			gameEngine 	: appName,
			gameTitle 	: this.getGameTitle(),
			options		: {
				AutoTranslator  : {
					patchType 	: this.checkPatchType(),
					configPath 	: this.getConfigPath(),
					config 		: common.clone(this.getConfig())
				},
				executable 		: this.path
			},
			loc 		: this.dirname
		}
	}
	
	return new Promise((resolve, reject) => {
		this.fetch()
		.then((result)=>{
			project.project.files = result;
			console.log("project", project);
			trans.openFromTransObj(project, {isNew:true});
			resolve();
		})
	})
}


XUnity.prototype.updateProject = function() {
	console.log("create new project")
	var project = {
		project : {
			gameEngine 	: appName,
			gameTitle 	: this.getGameTitle(),
			options		: {
				AutoTranslator  : {
					patchType 	: this.checkPatchType(),
					configPath 	: this.getConfigPath(),
					config 		: common.clone(this.getConfig())
				},
				executable 		: this.path
			},
			loc 		: this.dirname
		}
	}
	return new Promise((resolve, reject) => {
		this.fetch()
		.then((result)=>{
			project.project.files = result;
			console.log("project", project);
			var updatedProject = trans.updateProject(project);
			trans.openFromTransObj(updatedProject, {
				onAfterLoading : () => {
					
				}
			});
			resolve();
		})
	})
}



XUnity.prototype.getTransInjectPath = function() {
	// get default path to Translator++'s inject folder
	var activeTransDir =  this.getActiveTranslationDirectory(true);
	return nwPath.join(activeTransDir, "translator++");
}

XUnity.prototype.getActiveTranslationDirectory = function(full) {
	// relative to this.dirname
	full = full || false;
	var config = this.getConfig();
	if (full) return nwPath.join(this.dirname, "AutoTranslator", config.Files.Directory.replace("{Lang}", config.General.Language))

	return nwPath.join("AutoTranslator", config.Files.Directory.replace("{Lang}", config.General.Language))
}



XUnity.prototype.play = function() {
	var thisPatchLnk = this.getPatchLnk();
	var launcher = nwPath.join(this.dirname, thisPatchLnk);
	console.log("Opening ", launcher);
	return new Promise((resolve, reject) => {
		var output = "";
		var child = spawn("explorer", [launcher], {
			cwd : this.dirname,
			shell: true
		});
		child.stdout.on('data', (data) => {
			console.log('stdout: ' + data);
			output += data;
		});

		child.stderr.on('data', (data) => {
			console.log('stderr: ' + data);
		});

		child.on('close', (code) => {
			console.log('child process exited with code ' + code);
			console.log("output", output);
			console.log("reading dir content of ", this.dirname);
			
			console.log("Patch link :", this.getPatchLnk());
			resolve();
		});	
	})	
}

XUnity.prototype.getPatchLnk = function() {
	this.dirname = nwPath.dirname(this.path);
	var dirContent = fs.readdirSync(this.dirname);
	for (var i in dirContent) {
		if (dirContent[i].includes("(Patch and Run).lnk")) return dirContent[i]
	}
	return "";
}

XUnity.prototype.installPatch = function() {
	this.dirname = nwPath.dirname(this.path);
	return new Promise((resolve, reject) => {
		var output = "";
		var child = spawn(nwPath.join(thirdParty.getLocation("xunity-rei"), "SetupReiPatcherAndAutoTranslator.exe"), [], {
			cwd : this.dirname
		});
		child.stdout.on('data', (data) => {
			console.log('stdout: ' + data);
			output += data;
		});

		child.stderr.on('data', (data) => {
			console.log('stderr: ' + data);
		});

		child.on('close', (code) => {
			console.log('child process exited with code ' + code);
			console.log("output", output);
			console.log("reading dir content of ", this.dirname);
			
			console.log("Patch link :", this.getPatchLnk());
			resolve();
		});	
	})	
}

XUnity.prototype.runPatch = function() {
	var patch = this.getPatchLnk();
	if (!patch) return Promise.reject();
	patch = nwPath.join(this.dirname, patch);
	
	console.log("Opening patch file", patch);
	//nw.Shell.openExternal(patch);
	
	return new Promise((resolve, reject) => {
		
		var output = "";
		var child = spawn(patch, [] , { shell: true });
		child.stdout.on('data', (data) => {
			console.log('stdout: ' + data);
			output += data;
		});

		child.stderr.on('data', (data) => {
			console.log('stderr: ' + data);
		});

		child.on('close', (code) => {
			console.log('child process exited with code ' + code);
			resolve();
		});	
	})
	
}


XUnity.prototype.checkPatchType = function(gameExe) {
	// possible returns : "reipatcher", "bepinex", "ipa", "unityinjector", undefined
	gameExe = gameExe || this.path;
	var folder = nwPath.dirname(gameExe);
	if (common.isDir(nwPath.join(folder, "ReiPatcher"))) return "reipatcher";
	if (common.isDir(nwPath.join(folder, "IPA"))) return "ipa";
	if (common.isDir(nwPath.join(folder, "BepInEx"))) return "bepinex";
	if (common.isDir(nwPath.join(folder, "UnityInjector"))) return "unityinjector";
	
	return undefined;
}

XUnity.prototype.isXunityInstalled = function(gameExe) {
	// check whether xunity translator is exist on the given path
	gameExe = gameExe || this.path;
	
	return Boolean(XUnity.checkPatchType(gameExe))
}


XUnity.prototype.actionNewProject = function() {
	ui.showLoading();
	ui.loadingProgress("处理", "创建新项目在"+this.path, {consoleOnly:false, mode:'consoleOutput'});
	
	this.newProject()
	.then(()=>{
		ui.loadingProgress("完成了", "所有过程都完成了！", {consoleOnly:false, mode:'consoleOutput'});
		ui.showCloseButton();
	})
}

XUnity.prototype.actionUpdateProject = function() {
	ui.showLoading();
	ui.loadingProgress("处理", "正在从以下位置更新项目："+this.path, {consoleOnly:false, mode:'consoleOutput'});
	
	this.updateProject()
	.then(()=>{
		ui.loadingProgress("完成了", "所有过程都完成了！", {consoleOnly:false, mode:'consoleOutput'});
		ui.showCloseButton();
	})
}

XUnity.addRibbonMenu = function() {
	ui.ribbonMenu.add("xUnity", {
		
	})
}

XUnity.changePath = function(newPath) {
	/*
		change the current trans.project.options.executable path to newPath
		reassign :
		trans.project.loc
		trans.project.options.AutoTranslator.configPath;

	*/
	try {
		var xUnityNew = new XUnity(newPath)
		
		trans.project.loc 					= nwPath.dirname(newPath)
		trans.project.options.executable 	= newPath
		trans.project.options.AutoTranslator.configPath = xUnityNew.getConfigPath()
	} catch (e) {
		alert("分配新路径时出错，有关详细信息，请参阅控制台日志。")
		console.warn("分配新路径时出错：", newPath, e);
		
	}
	
}

XUnity.exportToFolder = function(targetDir, transData, options) {
	options = options||{};
	
	trans.project.options 	= trans.project.options || {};
	options.writeEncoding 	= thisAddon.config.writeEncoding || options.writeEncoding || trans.project.writeEncoding;
	transData 				= transData || trans.getSaveData();
	transData.project 		= transData.project || {};
	transData.project.files = transData.project.files || {};
	options.onStartParsingFile = options.onStartParsingFile||function(targetFile){};
	options.onEndParsingFile = options.onEndParsingFile||function(targetFile){};
	
	var keyColumn			= transData.project.indexOriginal || 0;
	var glue 				= "=";
	
	var promises = [];
	for (var fileId in transData.project.files) {
		var translationPool = [];
		var thisFile 		= transData.project.files[fileId];
		var lineBreak 		= thisFile.lineBreak || "\r\n";
		var targetFile 		= nwPath.join(targetDir, thisFile.basename);
		
		if (Array.isArray(thisFile.data) == false) continue;
		options.onStartParsingFile.call(this, targetFile);
		for (var rowId in thisFile.data) {
			if (Array.isArray(thisFile.data[rowId]) == false) continue;
			if (!Boolean(thisFile.data[rowId][keyColumn])) continue;
			
			var thisRowString = [];
			thisRowString[0] = thisFile.data[rowId][keyColumn];
			thisRowString[1] = trans.getTranslationFromRow(thisFile.data[rowId], keyColumn);
			thisRowString[1] = thisRowString[1].replace(/\r/g, "");
			thisRowString[1] = thisRowString[1].replace(/\n/g, " ");
			// substitute all occurance of "=" into similiar character
			thisRowString[1] = thisRowString[1].replace(/\=/g, "═"); 
			translationPool.push(thisRowString.join(glue));
		}
		console.log("writing to ", targetFile);
		promises.push(new Promise((resolve, reject) => {
			var thisFile = targetFile;
			fs.writeFile(thisFile, translationPool.join(lineBreak), (err) => {
				if (err) {
					reject();
					throw err;
				}
				console.log('The file '+thisFile+' has been saved!');
				options.onEndParsingFile.call(this, thisFile);
				
				resolve();
			});
		}))

	}
	
	return Promise.all(promises)
}

XUnity.applyTranslation = function(targetExe, transData, options) {
	options 		= options||{};
	transData 		= transData || trans.getSaveData();
	
	console.log("Data to be proccessed : ", transData);
	
	var targetUnity = new XUnity(targetExe);
	var targetDir 	= targetUnity.getTransInjectPath();
	console.log("Target dir is : ", targetDir);
	ui.loadingProgress("处理", "目标目录是："+targetDir, {consoleOnly:false, mode:'consoleOutput'});
	ui.loadingProgress("处理", "正在创建目录："+targetDir, {consoleOnly:false, mode:'consoleOutput'});
	try {
		fs.mkdirSync(targetDir, {recursive:true})
	} catch (e) {}
	
	options.onStartParsingFile = function(targetFile){
		ui.loadingProgress("处理", "处理："+targetFile, {consoleOnly:false, mode:'consoleOutput'});
	};
	options.onEndParsingFile 	= function(targetFile){
		ui.loadingProgress("处理", targetFile+"被创造出来了！", {consoleOnly:false, mode:'consoleOutput'});
	};
	
	XUnity.exportToFolder(targetDir, transData, options)
	.then(()=> {
		ui.loadingProgress("完成了", "所有过程都完成了！", {consoleOnly:false, mode:'consoleOutput'});
		ui.showCloseButton();
	});
	
}
XUnity.cache = {};

XUnity.writeConfig = function(project, options) {
	/*
		Write configuration
	*/
	try {
		project = project || trans.project;
		XUnity.cache[project.projectId] = XUnity.cache[project.projectId] || {}
		options = options || {};
		var config 		= project.options.AutoTranslator.config;
		var configPath 	= project.options.AutoTranslator.configPath;
		var bakPath 	= configPath+".bak";
		
		if (common.isFile(bakPath)) fs.unlinkSync(bakPath);
		fs.renameSync(configPath, bakPath);
		
		var iniString = ini.stringify(config);
		//console.log("ini stringify :");
		//console.log(iniString);
		fs.writeFileSync(configPath, iniString);
		console.log("Done writing to : ", configPath);
	} catch (e) {
		console.warn("写入配置时出错", e)
	}
	
}
XUnity.editConfig = function(project, options) {
	project = project || trans.project;
	XUnity.cache[project.projectId] = XUnity.cache[project.projectId] || {}
	options = options || {};
	options.force = true;
	options.rebuild = true;
	
	/*
	if (Boolean(XUnity.cache[project.projectId].$elm)) {
		var $elm = XUnity.cache[project.projectId].$elm;
	} else {
	*/
		var $elm = $(thisAddon.files["/configEdit.html"].elm).clone(true, true);
		var config = {};
		try {
			var config = project.options.AutoTranslator.config
		} catch (e) {
			config = {};
		}
		console.log("Handling config : ", config);
		for (var groupId in config) {
			var $group = $elm.find(".dialogSectionGroup[data-fld="+groupId+"]");
			console.log("searching group : ", groupId, "found HTML instance:", $group.length);
			if ($group.length < 1) continue;
			for (var confItem in config[groupId]) {
				var $fld = $group.find(".addonUnityFld[data-fld="+confItem+"]");
				console.log("searching field : ", confItem, "found HTML instance:", $fld.length, "value :", config[groupId][confItem]);	
				//$fld.attr("data-default", config[groupId][confItem]);
				var currentValue = config[groupId][confItem] || "";
				
				if ($fld.attr("type") == "checkbox") {
					var flipSwitch = false;
					if (currentValue.toLowerCase() == "true") flipSwitch = true;
					console.log("flipswitch toggle ", confItem, flipSwitch);
					$fld.prop("checked", flipSwitch);
					
				} else {
					$fld.val(currentValue);
				}
				
				$fld.off("change.unityTrans")
				$fld.on("change.unityTrans", function(e) {
					var $fld 	= $(this);
					var $group 	= $fld.closest(".dialogSectionGroup");
					var groupId = $group.attr("data-fld")
					var confItem = $fld.attr("data-fld")
					
					try {
						var config 	= trans.project.options.AutoTranslator.config;
						if ($fld.attr("type") == "checkbox") {
							console.log("Flipswitch change");
							if ($fld.prop("checked")) {
								console.log("Change value to True");
								config[groupId][confItem] = "True"
							} else {
								console.log("Change value to False");
								config[groupId][confItem] = "False"
							}
						} else {
							// non flipswitch
							config[groupId][confItem] = $fld.val() || "";
						}
					} catch (e) {
						console.warn(e);
					}
				})
				
				
			}
		}
		
		// initialize tabs;
		$elm.tabs();
		try {
			$elm.find("#addonUnityConfigEdit_general .executable").val(project.options.executable)
		} catch(e) {
		}
		$elm.find("#addonUnityConfigEdit_general .executable").on("change", function(e){
			XUnity.changePath($(this).val());
		})
		console.log("rendering DVField");
		var elmDv = new DVField($elm)
		elmDv.init();
	/*
		XUnity.cache[project.projectId].$elm = $elm;
	}
	*/
	//console.log("========================");
	//console.log($elm.html());
	options.isUnpreventable = true;
	options.onClose = () => {
		XUnity.writeConfig()
	}
	ui.showPopup("XUnityEditIni", $elm, options);
}

window.XUnity = XUnity;




function init() {
	// add into thirdParty application manager
	console.log("Add 3rdParty config into third party manager");
	thirdParty.loadConfigFile(nwPath.join(thisAddon.getPathRelativeToRoot(), "3rdParty.json"));

	var unityGame = new XUnity();
	var $slide = $(`
		<h1><i class="icon-plus-circled"></i>Unity软翻译</h1>
		<div>
			<div class="blockBox infoBlock withIcon">
				<h2>UnityTrans Ver.`+thisAddon.package.version+`</h2>
				<p>该解析器仍在积极开发中。</p>
			</div>
			<div class="blockBox warningBlock withIcon">
				<h1>软翻译</h1>
				<p>Translator++将为您提供使用<b>XUnity 自动翻译器</b>制作高质量翻译的更好体验。</p>
				<p>在开始翻译项目之前，请注意以下事项：</p>
				<ul>
					<li>这是一个软翻译，这意味着翻译将不会直接写入游戏，而是作为一个即时的mod。</li>
					<li>需要Playthru来获取游戏中的所有文本。根据游戏类型和场景分支，一些游戏可能需要多个play-thru。
						但不要担心，因为XUnity自动翻译器仍将为您提供针对每一个未翻译文本的通用机器翻译。
					</li>
					<li>有一种可能是这个mod与另一个mod不兼容。</li>
					<li>XUnity自动翻译器确实支持范围广泛的Unity游戏。但这并不意味着它将支持<b>每一种</b>Unity游戏。</li>
				</ul>
			</div>
		</div>
		`);
		$slide.data("next", "unity2")


	var $unity2 = $(`<h1><i class="icon-plus-circled"></i>Unity软翻译</h1>
			<div class="fieldgroup">
				<h2>选择一个Unity游戏</h2>
				<label><input type="dvSelectPath" class="gameLocation" accept=".exe" /></label>
			</div>		
	`);

	
	$unity2.find(".gameLocation").on("change", function() {
		console.log("selected game is  : ", $(this).val());
		if (!XUnity.isUnity()) {
			
		}
	})
	ui.newProjectDialog.newSlide("unity2", $unity2, {
		buttons: [
					{
						text: t("下一个"),
						click: function() {
							var exePath = $unity2.find(".gameLocation").val();
							unityGame.set("path", exePath)
							if (!Boolean(exePath)) return alert("请选择一个可执行文件。");
							if (!XUnity.isUnity(exePath)) {
								var conf = confirm(t("给定路径："+exePath+"\n这不是一个Unity游戏。你还想继续吗？"))
								if (!conf) return;
							}
							ui.newProjectDialog.gotoSlide("unity3", "unity2");
						}
					}
				]
	});

	var hintImg = thisAddon.getWebLocation()+"/img/hint1.png"
	var $unity3 = $(`<h1><i class="icon-plus-circled"></i>Unity软翻译</h1>
		<div class="fieldgroup">
			<h2>安装XUnity自动翻译器</h2>
			<div class="blockBox infoBlock withIcon">
				如果你已经用XUnity自动翻译器修补了你的游戏，你可以跳过这个过程！
			</div>
			<div class="actionButtons">
				<button class="installPatch"><i class="icon-login"></i>安装补丁</button>
			</div>
			<div style="margin-top:40px"><img src="${hintImg}" alt="" /></div>
		</div>
	`);
	$unity3.find(".installPatch").on("click", ()=> {
		unityGame.installPatch()
		.then(()=> {
			var conf = confirm("补丁成功安装！\r\n"+
						"配置将在您第一次玩游戏时生成。\r\n"+
						"现在开始游戏？");
			if (conf) return unityGame.play();
			
			return;
		})
		.then(()=> {
			
		})
	});
	
	ui.newProjectDialog.newSlide("unity3", $unity3, {
		onActive : function(e, newProjectDialog) {
			unityGame.prepare3rdPartyTools()
		},
		buttons: [
					{
						text: t("完成"),
						click: function() {
							ui.newProjectDialog.close();
							unityGame.actionNewProject();
						}
					}
				]
	});


	var $button = $('<button class="btnSelectExe selectRPGExe"><i class="icon-doc-inv"></i>从游戏中选择可执行文件</button>')
	$button.on('click', function() {
		ui.openFileDialog({
			accept:".exe",
			onSelect : function(selectedFile) {				
				ui.showLoading();

				var selectedDir = nwPath.dirname(selectedFile);
				ui.loadingProgress("处理", "处理："+selectedDir, {consoleOnly:true, mode:'consoleOutput'});
				ui.loadingProgress("处理", "请稍等！窗口将显示为挂起一个大型游戏。这很正常。", {consoleOnly:true, mode:'consoleOutput'});
				ui.newProjectDialog.close()

				new Promise((resolve, reject) => {
					return createProject(selectedDir, {})
				}).then(function() {
					ui.loadingProgress("处理", "处理文件...", {consoleOnly:true, mode:'consoleOutput'});
				})
			}
		})		
	})
	//$slide.find(".actionButtons").append($button);
	
	ui.newProjectDialog.addMenu({
		icon : "addons/unityTrans/icon.png",
		descriptionBar : `<h2>Unity软翻译</h2>
						<p>unity引擎的软翻译</p>`,
		actionBar: "",
		goToSlide: 'unity',
		at:3,
		slides : {
			'unity': {
				html : $slide,
				buttons : [
					{
						text: t("下一个"),
						click: function() {
							ui.newProjectDialog.gotoSlide("unity2", "unity");
						}
					}
				],
				onActive : function() {
					console.log("Slide id Unity is active");
					console.log("arguments : ", arguments);
					console.log("This : ", this);
				}
			}

		}
	})

	// =====================================================
	// register handler
	// =====================================================
	if (typeof window.engines[appName] == 'undefined') engines.add(appName);
	engines[appName].addProperty('exportHandler', function(targetPath, options) {
		console.log("entering export handle", arguments);
		if (options.mode !== "dir" && options.mode !== "zip") return false;
		options.onStartParsingFile = function(targetFile){
			ui.loadingProgress("处理", "处理："+targetFile, {consoleOnly:false, mode:'consoleOutput'});
		};
		options.onEndParsingFile 	= function(targetFile){
			ui.loadingProgress("处理", targetFile+"被创造出来了！", {consoleOnly:false, mode:'consoleOutput'});
		};
		
		ui.showLoading();
		ui.loadingProgress("处理", "将XUnity.AutoTranslator 格式导出为："+targetPath, {consoleOnly:false, mode:'consoleOutput'});

		if (common.isDir(targetPath)) {
			XUnity.exportToFolder(targetPath, trans.getSaveData(), options)
			.then(() => {
				ui.loadingProgress("完成了", "所有过程都完成了！", {consoleOnly:false, mode:'consoleOutput'});
				ui.showCloseButton();
			})
			return true;
		}
		
		
		// is file
		var tmpPath = nwPath.join(nw.process.env.TMP, trans.project.projectId);
		fse.removeSync(tmpPath); 
		try {
			fs.mkdirSync(tmpPath, {recursive:true});
		} catch(e) {
			console.warn("无法创建目录", tmpPath);
			throw(e);
			return true;
		}
		
		XUnity.exportToFolder(tmpPath, trans.getSaveData(), options)
		.then(()=> {
			ui.loadingProgress("处理", "写"+targetPath, {consoleOnly:false, mode:'consoleOutput'});
			
			var _7z = require('7zip-min');
			// export to a folder without the folder itself ... notice the trailing /*
			_7z.cmd(['a', '-tzip', targetPath, tmpPath+'/*'], err => {
				// done
				console.log("process done");
				ui.loadingProgress("完成了", "所有过程都完成了！", {consoleOnly:false, mode:'consoleOutput'});
				ui.showCloseButton();				
			});
		})
		
		return true;
	});
	
	engines[appName].addProperty('injectHandler', function(exeFile, sourceMaterial, options) {
		console.log("路径是：", exeFile);
		console.log("选项包括：", options);
		console.log(arguments);

		ui.showLoading();
		
		ui.loadingProgress("处理", "解析数据。窗户有时会挂起来。这很正常！", {consoleOnly:false, mode:'consoleOutput'});
		XUnity.applyTranslation(exeFile, trans.getSaveData(), options);
		
		return true;
	});

	engines[appName].addProperty('onOpenInjectDialog', function($dialogInject, options) {
		console.log(arguments);
		$dialogInject.find(".sourceDir").addClass("hidden");
		$dialogInject.find(".targetDir").addClass("hidden");
		$dialogInject.find(".targetExe").removeClass("hidden");
		options.targetOnly = true;
		options.targetMode = "file";
	});

	engines.addHandler([appName], "onLoadTrans", 
	() => {
		var unityInstance = new XUnity(trans.project.options.executable)
		
		ui.ribbonMenu.add(appName, {
			title : "XUnity",
			toolbar : {
				buttons : {
					update : {
						icon : "icon-arrows-cw",
						title : "更新当前项目",
						onClick : () => {
							var conf = confirm(t("更新当前项目？"));
							if (!conf) return;
							unityInstance.actionUpdateProject();
						}
					},
					setting : {
						icon : "icon-equalizer",
						title : "XUnity.AutoTranslator设置",
						onClick : () => {
							XUnity.editConfig()
						}
					},
					play : {
						icon : "icon-play",
						title : "最后一次建造",
						onClick : () => {
							unityInstance.play();
						}
					}
					/*
					,
					playBuild : {
						icon : "icon-play green",
						title : "Apply translation then play",
						onClick : () => {
							rebuildPlay();
						}
					}
					*/
				}
			}
		})		
	})		
	
}

$(document).ready(function() {
	ui.onReady(function() {
		init();
	});
});