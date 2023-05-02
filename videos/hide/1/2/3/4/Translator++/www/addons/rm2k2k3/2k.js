this.optionsForm = {
		"useNative": {
		  "type": "boolean",
		  "title": "使用本地RPG播放器",
		  "description": "使用本地RPG播放器，而不是简单的RPG播放器",
		  "inlinetitle": "使用本地RPG播放器"
		}
}


var path 		= require('path');
var fs 			= fs || require('fs');
var fse 		= require('fs-extra')
var bCopy 		= require('better-copy');
var ini 		= require('ini');
var iconv 		= require('iconv-lite');
var jEncoding 	= require('encoding-japanese');

var thisAddon	= this;

var RM2k = function(directory, options) {
	options = options || {}
	this.options 			= options;
	this.translationPair 	= this.options.translationPair || {}
	this.translationInfo 	= this.options.translationInfo || {};
	this.directory 			= directory;
	this.contextSeparator 	= "/"
	this.isParsed 			= false;
	this.cacheLocation;
	this.iniEncoding 		= this.options.iniEncoding || 'Windows-31j';
	this.writeEncoding 		= this.options.writeEncoding || 'Windows-31j';
	
}

RM2k.prototype.xmlTrans = function(file, options) {
	options 				= options || {};
	options.translationPair = options.translationPair || {}
	options.translationInfo = options.translationInfo || {}
	
	return xmlTrans = new addonLoader.addons.xmlTrans.XmlTrans(file,
	{
		config: [
			{
				queryString : "event_commands string",
				onBeforeRegisterString : function(text, context, targetElm) {
					var $targetElm = $(targetElm);
					var code = $targetElm.find("code").text();
					//console.log("this event code is : ", code);
					if (code !== "20110") return true;
					
					this.appendString("\n"+text, context, targetElm);
					
				},
				getTextElement : function(elm) {
					var $elm = $(elm);
					return $elm.parent()[0]; // return parent instead of self element
				},
				translateElement : function(elm, text, config) {
					console.log("translating element", elm, text);
					var $elm = $(elm)
					var code = $elm.eq(0).find("code").text()
					if (code !== "10110" && code !== "20110") {
						$(elm).find("string").text(text);
						return $(elm)[0];
					}
	
					// split message by line and then generates interpreter object
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
		onBeforeWrite :function(string) {
			// retain SJIS encoding
			/*
			string = string.replace(/\<string\>(.*?)\<\/string\>/g, function() {

				return "<string>"+jEncoding.convert(arguments[1], 'SJIS', 'UTF8')+"</string>";
			})	
			*/
			return string.replace(/\<(.*?)\s?\/\>/g, '<$1></$1>')
		},
		translationPair : options.translationPair,
		translationInfo : options.translationInfo


	})		
}

RM2k.prototype.generateData = function(fileObject) {
	var result = {
		data:[],
		context:[],
		tags:[],
		indexIds:{}
	}
	if (!fileObject.translatableTexts) return result;
	
	for (var i=0; i<fileObject.translatableTexts.length; i++) {
		var thisObj = fileObject.translatableTexts[i];

		if (typeof result.indexIds[thisObj.text] == "undefined") result.indexIds[thisObj.text] = result.data.length;
		//result.indexIds[thisObj.text] = result.indexIds[thisObj.text] || result.data.length;
		
		var row = result.indexIds[thisObj.text];
		result.data[row] 	= result.data[row] || [thisObj.text, ""];
		result.context[row] = result.context[row]||[];
		
		if (Array.isArray(thisObj.context) == false) thisObj.context = [thisObj.context]
		for (var x=0; x<thisObj.context.length; x++) {
			result.context[row].push(thisObj.context[x].join(this.contextSeparator))
		}
		
	}
	
	return result;
	
}

RM2k.prototype.writeToFolder = function(targetFolder) {
	//if (this.writeMode == false) return console.warn("Unable to write. Reason : not in write mode!");
	
	var promises 		= [];
	var processable 	= [];
	var cacheLocation 	= path.join(nw.process.env.TMP, common.makeid(10))

	
	return new Promise((resolve, reject) => {
		for (var relPath in this.files) {
			var thisFile = this.files[relPath]
			
			var targetPath = path.join(cacheLocation, relPath);
			//console.log("creating directory : ", path.dirname(targetPath));
			try {
				fs.mkdirSync(path.dirname(targetPath), {recursive:true});
			} catch(e) {
				console.warn("无法创建目录", path.dirname(targetPath));
				throw(e);
				return;
			}
			console.log("writing to :", targetPath);
			processable.push(targetPath);
			
			
			if (thisFile.type == "ini") {
				var iniData = thisFile.translatable.translate();
				fs.writeFileSync(path.join(targetFolder, relPath), ini.stringify(iniData))
			} else {
				promises.push(thisFile.write(targetPath))
			}
		}
		
		Promise.all(promises)
		.then(() => {
			return new Promise((resolve, reject) => {
				var lcf2xml = spawn(path.join(thisAddon.getLocation(), "bin", "lcf2xml.exe"), processable, {cwd: targetFolder})
				lcf2xml.on('exit', function (code) {
					console.log('Child process exited with exit code '+code);
					return resolve();
				});
			})
			
		})
		.then(() => {
			resolve(processable);
		})
	})
	
}

RM2k.prototype.iniToTrans = function(iniData, stringOnly) {
	return TranslatableObject.generate(iniData, stringOnly);
}

RM2k.prototype.toTrans = function() {
	if (!this.isParsed) return console.error('未解析，请运行 .parse() 先');
	var transData = {
		project:{
			gameEngine: "rm2k",
			files:{},
			gameTitle: ""
		}
	}
	
	for (var relpath in this.files) {
		// change \ to /
		
		var thisTranslatable = this.files[relpath]
		relpath = relpath.replace(/\\/g, "/")
		var thisData = {};
		
		if (thisTranslatable.type == "ini") {
			thisTranslatable.data = thisTranslatable.data || {};
			if (Boolean(thisTranslatable.data.RPG_RT) == false) continue;
			transData.project.gameTitle = thisTranslatable.data.RPG_RT.GameTitle;
			var thisGenData = this.iniToTrans(thisTranslatable.data);
		} else {
			var thisGenData = this.generateData(thisTranslatable);
		}
		
		
		
		if (!this.showBlank) if (thisGenData.data.length < 1) continue;
		thisData = {};
		thisData.data 		= thisGenData.data
		thisData.context 	= thisGenData.context
		thisData.tags 		= thisGenData.tags
		thisData.filename 	= path.basename(relpath);
		thisData.basename 	= path.basename(relpath);
		thisData.indexIds 	= thisGenData.indexIds
		//thisData.groupLevel 	= thisGenData.groupLevel;	
		thisData.extension 	= path.extname(relpath);
		thisData.originalEncoding = thisTranslatable.detectedEncoding;
		thisData.lineBreak 	= "\n";
		thisData.path 		= relpath // path is relative path from cache dir
		thisData.relPath 		= relpath // relpath is real filename address on context	
		thisData.type 		= null; // no special type
		thisData.originalFormat = "Easy's RM2K/3 XML Data";			
		thisData.dirname 		= path.dirname(relpath);	
		
		transData.project.files[relpath] = thisData;

		
		
	}
	this.transData = transData;
	return transData;
	
}
RM2k.prototype.getRelativePath = function(stringPath, fromDir) {
	stringPath = path.normalize(stringPath);
	fromDir = fromDir || this.directory
	return stringPath.substring(fromDir.length, stringPath.length);
}
RM2k.prototype.parseXml = function(filePath, fromDir) {
	console.log("parseXML ", filePath);
	var thisRelPath = this.getRelativePath(filePath, fromDir)
	var relPathF	= thisRelPath.replace(/\\/g, '/')
	var options 	= options || {};
	console.log("relative path : ", thisRelPath);
	this.translationPair[relPathF] = this.translationPair[relPathF]||{};
	options.translationPair = this.translationPair[relPathF].translationPair||{}
	options.translationInfo = this.translationPair[relPathF].translationInfo||{}
	
	this.files[thisRelPath] = this.xmlTrans(filePath, options);
	return this.files[thisRelPath];
}

RM2k.prototype.parse = function() {
	// parse directory
	this.id = common.makeid(10)
	this.cacheLocation = this.cacheLocation || path.join(nw.process.env.TMP, this.id)
	this.files = {};
	// create temporary folder for data extraction
	fs.mkdirSync(this.cacheLocation, {recursive:true});
	var processableExt = [".emu", ".edb"]
	var processable = [];
	var parseable = [];
	var iniFiles = [];
	return new Promise((resolve, reject)=> {
		bCopy.walk(this.directory, {
			onFile : (filePath, stats) => {
				if(path.extname(filePath).toLowerCase() == '.lmu') processable.push(filePath)
				if(path.extname(filePath).toLowerCase() == '.ldb') processable.push(filePath)
				if(path.extname(filePath).toLowerCase() == '.ini') iniFiles.push(filePath)
	
				if(processableExt.includes(path.extname(filePath).toLowerCase())) {
					console.log("xml file :", filePath);
					this.parseXml(filePath, this.directory);
				}
			   
			}
		})
		.then(()=> {
			console.log("处理", processable);
			
			return new Promise((resolve, reject) => {
				var lcf2xml = spawn(path.join(thisAddon.getLocation(), "bin", "lcf2xml.exe"), processable, {cwd: this.cacheLocation})
				lcf2xml.on('exit', function (code) {
					console.log('Child process exited with exit code '+code);
					return resolve();
				});
			})
		})
		.then(()=> {
			console.log("processing from cache location ", this.cacheLocation);
			return bCopy.walk(this.cacheLocation, {
				onFile : (filePath, stats) => {
					if(processableExt.includes(path.extname(filePath).toLowerCase() == false)) return;
					this.parseXml(filePath, this.cacheLocation);
					/*
					var thisRelPath = this.getRelativePath(filePath, this.cacheLocation)
					var options = options || {};
					this.translationPair[thisRelPath] = this.translationPair[thisRelPath]||{};
					options.translationPair = this.translationPair[thisRelPath].translationPair||{}
					options.translationInfo = this.translationPair[thisRelPath].translationInfo||{}
					
					this.files[thisRelPath] = this.xmlTrans(filePath, options);
					*/
				}
			})
		})
		.then(()=> {
			for (var i in this.files) {
				parseable.push(this.files[i].parse())
			}
			return Promise.all(parseable);
		})
		.then(()=> {
			// parse ini file
			for (var i=0; i<iniFiles.length; i++) {
				
				var thisRelPath = this.getRelativePath(iniFiles[i])
				var relPathF	= thisRelPath.replace(/\\/g, '/')
				var options 	= options || {};
				console.log("relative path : ", thisRelPath);
				this.translationPair[relPathF] = this.translationPair[relPathF]||{};
				options.translationPair = this.translationPair[relPathF].translationPair||{}
				options.translationInfo = this.translationPair[relPathF].translationInfo||{}
				
				var thisObj = {};
				thisObj.type = "ini";
				thisObj.data = ini.parse(iconv.decode(fs.readFileSync(iniFiles[i]), this.iniEncoding))
				thisObj.data.RPG_RT 			= thisObj.data.RPG_RT || {};
				thisObj.data.RPG_RT.Encoding 	= thisObj.data.RPG_RT.Encoding || 932
				thisObj.translatable 			= new TranslatableObject(thisObj.data, options);
				this.files[thisRelPath] = thisObj;
			}

		})
		.then(()=> {
			console.log("All files has been parsed");
			this.isParsed = true;
			resolve(this);
		})
	})
}

window.RM2k = RM2k;



var exportToFolder = function(sourceDir, targetDir, transData, options) {
	options = options||{};
	options.writeEncoding = options.writeEncoding || trans.project.writeEncoding;
	transData = transData || trans.getSaveData();
	
	//options.groupIndex = options.groupIndex||"relPath";
	
	return new Promise((resolve, reject) => {
		var translationData = trans.getTranslationData(transData, options);
		console.log("translation Data : ", translationData);
		var rm2k = new RM2k(sourceDir, {
			'writeMode' : true,
			'translationPair':translationData.translationData,
			'writeEncoding' : options.writeEncoding,
			'onParseStart' : function(currentFile) {
				ui.loadingProgress("处理", "处理"+currentFile, {consoleOnly:true, mode:'consoleOutput'});
			}
		});	
		window.rm2k = rm2k;
		
		rm2k.parse()
		.then(()=> {
			console.log("%c rm2k Obj >", 'background: #F00; color: #f1f1f1', rm2k);
			return rm2k.writeToFolder(targetDir)
		})
		.then(()=> {
			console.log("file saved to ", targetDir)
			resolve();
		})
	})

}

function createProject(sourceDir, options) {
	options = options || {}
	var projectId 		= common.makeid(10);
	var stagePath 		= path.join(common.getStagePath(),projectId);
	var rm2k = new RM2k(sourceDir);
	window.rm2k = rm2k;
	var transData = {};
	
	return rm2k.parse()
	.then(()=> {
		transData = rm2k.toTrans()
		transData.project.projectId = projectId;
		transData.project.cache = transData.project.cache||{};
		transData.project.cache.cachePath = stagePath;
		transData.project.loc = sourceDir;
		
		fs.mkdirSync(path.join(stagePath, "game"), {recursive:true});
		var gameInfo = {
			title : transData.project.gameTitle
		}
		
		fs.writeFileSync(path.join(stagePath, "gameInfo.json"), JSON.stringify(gameInfo, undefined, 2))
		ui.loadingProgress("处理", "将数据复制到后台", {consoleOnly:true, mode:'consoleOutput'});
		return bCopy(rm2k.cacheLocation, path.join(stagePath, "game"))
	})
	.then(()=> {
		ui.loadingProgress("处理", "解析完毕！", {consoleOnly:true, mode:'consoleOutput'});
		ui.loadingProgress("处理", "创建新项目。", {consoleOnly:true, mode:'consoleOutput'});
		console.warn("trans数据：", transData);
		
		trans.openFromTransObj(transData, {isNew:true});
		ui.loadingProgress("完成", "全部完成", {consoleOnly:true, mode:'consoleOutput'});
		ui.loadingEnd("完成", "完成");
		trans.autoSave();
		ui.showCloseButton();
		
		return transData;
		
	})

}

var determineGameFile = function(exePaths) {
	console.log("determine game exe from ", exePaths);
	if (typeof exePaths == 'string') exePaths = [exePaths];
	exePaths = exePaths || [];
	
	var unknown = [];
	
	for (var i=0; i<exePaths.length; i++) {
		if (path.basename(exePaths[i]).toLowerCase() == "player.exe") return exePaths[i];
		if (path.basename(exePaths[i]).toLowerCase() == "rpg_rt.exe") return exePaths[i];
		unknown.push(exePaths[i]);
	}
	
	if (unknown.length == 1) return unknown[0];
}

var play = function(gameDir) {
	if (common.isDir(gameDir) == false) return alert("无效路径", gameDir);
	if (Boolean(thisAddon.config.useNative) == false) {
		spawn(path.join(thisAddon.getLocation(), "bin", "player.exe"), ["--window"], {cwd: gameDir, detached: true, stdio:"ignore"})	
		return;
	}
	
	var files = fs.readdirSync(gameDir);
	var exeList = [];
	for (var i=0; i<files.length; i++) {
		if (path.extname(files[i]).toLowerCase() !== '.exe') continue;
		exeList.push(path.join(gameDir, files[i]))
	}
	var exeFile = determineGameFile(exeList);
	spawn(exeFile, ['TestPlay', 'ShowTitle', 'Window'], {
	  detached: true,
	  stdio: 'ignore'
	});
	
}

var rebuildPlay = function() {
	// inject and play
	// if trans.project.loc or trans.project.devPath are not defined open applyTranslation

	if (!trans.project.loc || !trans.project.devPath || !common.isDir(trans.project.loc) || !common.isDir(trans.project.devPath)) {
		var conf = confirm("游戏路径或开发环境未定义或无效！ \n您可以通过运行“应用翻译”一次来生成此信息。 \n现在申请翻译吗？");
		if (!conf) return;
		ui.openInjectDialog();
		return;
	}
	
	applyTranslation(trans.project.loc, trans.project.devPath, trans.getSaveData(), {play:true});
}

var applyTranslation = function(sourceDir, targetDir, transData, options) {
	options 		= options||{};
	options.play	= options.play || false;
	transData 		= transData || trans.getSaveData();
	var exeFiles 	= [];
	

	console.log("copy from", sourceDir, "to:", targetDir);
	// copy the material to targetDir
	bCopy(sourceDir, targetDir, {
		filter: function(src, dest) {
			console.log("复制 ",src, dest);
			ui.loadingProgress(undefined, "复制："+src, {consoleOnly:true, mode:'consoleOutput'});
			if (path.extname(dest).toLowerCase() == '.exe') exeFiles.push(dest);
			if (path.extname(dest).toLowerCase() == '.bak') {
				console.log("Ignoring ", dest);
				return false;
			}
			
			return true;
		},
		overwrite:true
	})
	.then(() => {
		ui.loadingProgress("加载", "复制完毕", {consoleOnly:true, mode:'consoleOutput'});
		
		console.log("patching the file");
		ui.loadingProgress("加载", "修补数据。这可能需要一段时间…", {consoleOnly:true, mode:'consoleOutput'});
		
		//return exportToFolder(targetDir, targetDir, transData, options);
		return exportToFolder(sourceDir, targetDir, transData, options);
		ui.loadingProgress("加载", "完成了！", {consoleOnly:true, mode:'consoleOutput'});
	})
	.then(() => {
		ui.loadingEnd("完成", "所有过程都完成了！", {consoleOnly:false, mode:'consoleOutput', error:false});
	
		if (options.play) {
			play(targetDir);
			ui.showCloseButton();
			return;
		}
		
		
		var exeFile = determineGameFile(exeFiles);
		//engines.kag.onApplySuccess ? engines.kag.onApplySuccess(targetDir);

		console.log("exe file is :", exeFile);


		ui.LoadingAddButton("打开文件夹", function() {
			nw.Shell.showItemInFolder(exeFile);
		},{
			class: "icon-folder-open"
		});
		ui.LoadingAddButton("游玩！", () => {
			console.log("Opening game ", exeFile);
			//nw.Shell.openItem(exeFile+" NormalPlay ShowTitle Window");
			//spawn("F:\\GDrive\\Other\\Translator++\\notes\\rm2k-2k3\\player.exe", ["--window"], {cwd: "F:\\test\\2000\\Doraemon", detached: true, stdio:"ignore"})
			/*
			var subprocess = spawn(exeFile, ['TestPlay', 'ShowTitle', 'Window'], {
			  detached: true,
			  stdio: 'ignore'
			});
			*/
			play(targetDir)
		},{
			class: "icon-play"
		});
		ui.showCloseButton();


	})
	
}



function init() {
	console.log("%cINITIALIZING RM2K/3 Parser", "background:yellow; font-weight:bold;");
	var $slide = $(`
		<h1><i class="icon-plus-circled"></i>RPG Maker 2k & 2k3</h1>
		<div class="blockBox infoBlock withIcon">
			这是一个使用新添加的xmlTrans插件的实验性功能。<br />
			请在我的patreon页面查看此插件的最新版本。
		</div>
		
		<div class="fieldgroup">
			<div class="actionButtons">
			</div>
		</div>			
			`);
			
	var $button = $('<button class="btnSelectExe selectRPGExe"><i class="icon-doc-inv"></i>从游戏中选择可执行文件</button>')
	$button.on('click', function() {
		ui.openFileDialog({
			accept:".exe",
			onSelect : function(selectedFile) {
				ui.showLoading();
				var selectedDir = path.dirname(selectedFile);
				ui.loadingProgress("处理", "处理："+selectedDir, {consoleOnly:true, mode:'consoleOutput'});
				ui.loadingProgress("处理", "请稍等！窗口将显示为挂起一个大型游戏。这很正常。", {consoleOnly:true, mode:'consoleOutput'});
				ui.newProjectDialog.close()

				new Promise((resolve, reject) => {
					return createProject(selectedDir)

				}).then(function() {
					ui.loadingProgress("处理", "解析文件...", {consoleOnly:true, mode:'consoleOutput'});
					
				})
			}
		})		
	})
	$slide.find(".actionButtons").append($button);
	
	ui.newProjectDialog.addMenu({
		icon : "addons/rm2k2k3/icon.png",
		descriptionBar : `<h2>RM2K & RM2K3</h2>
						<p>从RPG Maker 2000和2003开始翻译</p>`,
		actionBar: "",
		goToSlide: 101,
		at:3,
		slides : {
			101: $slide
		}
	})

	// register handler
	if (typeof window.engines.rm2k == 'undefined') engines.add('rm2k');
	engines.addHandler(["rm2k", "rm2k3"], 'exportHandler', function(targetPath, options) {
		if (options.mode !== "dir" && options.mode !== "zip") return false;

		ui.showLoading();
		ui.loadingProgress("处理", "解析来自"+targetPath, {consoleOnly:false, mode:'consoleOutput'});
		try {
			var pathStat = fs.lstatSync(targetPath)
			
			if (pathStat.isDirectory()) {
				
				exportToFolder(path.join(trans.project.cache.cachePath, "game"), targetPath)
				.then(() => {
					ui.loadingProgress("完成", "所有过程都完成了！", {consoleOnly:false, mode:'consoleOutput'});
					ui.showCloseButton();
				})

				return;
			}
		} catch (e) {
			
		}
		
		
		// is file
		var tmpPath = path.join(nw.process.env.TMP, trans.project.projectId);
		fse.removeSync(tmpPath); 
		try {
			fs.mkdirSync(tmpPath, {recursive:true});
		} catch(e) {
			console.warn("无法创建目录", tmpPath);
			throw(e);
			return;
		}
		exportToFolder(trans.project.cache.cachePath, tmpPath)
		.then(()=> {
			var _7z = require('7zip-min');
			_7z.cmd(['a', '-tzip', targetPath, tmpPath+'/Data'], err => {
				// done
				console.log("process done");
				ui.loadingProgress("完成", "所有过程都完成了！", {consoleOnly:false, mode:'consoleOutput'});
				ui.showCloseButton();				
			});
		})
		
		return true;
	});
	
	engines.addHandler(["rm2k", "rm2k3"], 'injectHandler', function(targetDir, sourceMaterial, options) {
		console.log("路径是：", targetDir);
		console.log("选项包括：", options);
		console.log(arguments);
		ui.showLoading();
		// convert sourceMaterial to folder if path is file
		var sourceStat = fs.lstatSync(sourceMaterial)
		if (sourceStat.isFile()) sourceMaterial = path.dirname(sourceMaterial);
		
		ui.loadingProgress("处理", "解析数据。窗户有时会挂起来。这很正常！", {consoleOnly:false, mode:'consoleOutput'});
		applyTranslation(sourceMaterial, targetDir, trans.getSaveData(), options);
		
		return true;
	});
	//if (typeof window.engines.rm2k3 == 'undefined') engines.add('rm2k3');
	//engines.rm2k3 = engines.rm2k;
	
	
	engines.addHandler(["rm2k", "rm2k3"], "onLoadTrans", 
	() => {
		ui.ribbonMenu.add("rm2k", {
			title : "RM2k/3",
			toolbar : {
				buttons : {
					play : {
						icon : "icon-play",
						title : "玩最后一次构建",
						onClick : () => {
							play(trans.project.devPath);
						}
					},
					playBuild : {
						icon : "icon-play green",
						title : "应用翻译然后播放",
						onClick : () => {
							rebuildPlay();
						}
					}
					
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