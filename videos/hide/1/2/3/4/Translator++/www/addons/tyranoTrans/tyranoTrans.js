await addonLoader.waitFor("kagParser");

const thisAddon = this;
const gameEngine = "tyrano";
this.optionsForm = {
		"writeEncoding": {
		  "type": "string",
		  "title": "写编码",
		  "description": "将在编写脚本时强制将文本编码转换为选定的编码。（空白=自动）<br />。您可以使用此字段将脚本转换为<b>UTF-16</b>，这样游戏就可以玩，而无需将您的区域设置更改为日语。",
		  "enum": [ "", 
					"utf8", 
					"utf16le",
					"UTF-16", 
					"UTF-16BE",					
					"ascii", 
					"binary", 
					"base64", 
					"hex", 
					"ISO-8859-1", 
					"ISO-8859-16", 
					"koi8-r", 
					"koi8-u", 
					"koi8-ru", 
					"koi8-t", 
					"Shift_JIS",
					"Windows-31j",
					"Windows932",
					"EUC-JP",
					"GB2312",
					"GBK",
					"GB18030",
					"Windows936",
					"EUC-CN",
					"KS_C_5601",
					"Windows949",
					"EUC-KR",
					"Big5",
					"Big5-HKSCS",
					"Windows950"
				],
		  "HOOK": "thisAddon.config.writeEncoding"
		},
		"useLegacy": {
		  "type": "boolean",
		  "title": "使用遗留解析器",
		  "inlinetitle": "使用遗留解析器",
		  "description": "使用旧的解析器而不是新的解析器<br />遗留解析器速度更快，但在某些游戏中不可靠<br />新的解析器更可靠，但速度较慢。",
		  "HOOK": "thisAddon.config.useLegacyParser"
		}		
}

thisAddon.config = thisAddon.config || {};

var defaultLiteralTags = ["ruby", "l", "r"];

var encoding 	= require('encoding-japanese');
var iconv 		= require('iconv-lite');
var path 		= require('path');
var fs 			= fs || require('graceful-fs');
var fse 		= require('fs-extra')
var bCopy 		= require('better-copy');
var buffTool 	= require('buffer-tools');

var kstg 		= require("kstg");
var {TyranoParser} = require("www/addons/kagParser/TyranoParser.js")
var {spawn} 	= require('child_process');
const { trim } = require('jquery');

var libKAG 		= require("www/addons/kagParser/libKAG.js")(thisAddon);

var TjsFile = libKAG.TjsFile

/**
 * Parse the weird config format of TyranoScript
 * @param  {} configContent
 */
TjsFile.prototype.parseConfig = async function(configContent) {
	configContent = configContent.replaceAll("\r", "");
	var lines = configContent.split("\n");
	var offset = 0;
	for (var i=0; i<lines.length; i++) {
		var trimmed = lines[i].trim();
		if (trimmed.substring(0,1) !== ";") {
			this.register(lines[i]+"\n");
			offset += (lines[i]+"\n").length
			continue;
		}

		// parsing the line started with ";"
		var segment = lines[i].split("=");
		var value = lines[i].substring(segment[0].length+1)
		var cols = segment[0].length + 1;
		var leftHand = segment[0].trim().substring(1)
		var context = ["line", i, "col", cols, "leftHand", leftHand];
		// register the lefthand
		this.register(segment[0]+"=");
		this.registerString(value, context, {
			start:offset+cols,
			end:offset+cols+(value.length),
			leftHand:{
				context:leftHand.split("."),
				type:"assignment"
			}
		});
		// register the new line character itself
		this.register("\n");
		offset += (lines[i]+"\n").length

	}
}

TjsFile.prototype.parse = async function() {
	if (this.file.toLowerCase().includes("\\data\\system\\config.tjs")) {
		console.warn("重写 Config.tjs 的TJSFIle解析", this);

		return new Promise(async (resolve, reject) => {
			this.string 	= await this.readFile();
			await this.parseConfig(this.string);
			resolve();
		})
	}

    this.contextEnter(path.basename(this.file));
    this.promise = new Promise(async (resolve, reject) => {
        this.string 	= await this.readFile();
        TjsFile.fetch.call(this, this.string)
        
        this.contextEnd();
        resolve(this.string);
    })
    return this.promise;	
}

thisAddon.utils = libKAG.utils


const TyranoUtil = function() {

}

TyranoUtil.spawn = function(command) {
	var process = spawn(command, []);

	process.stdout.on('data', (data) => {
	  console.log(`stdout: ${data}`);
	});
	
	process.stderr.on('data', (data) => {
	  console.error(`标准误差：${data}`);
	});
	
	process.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	});

	process.on('spawn', (code) => {
		console.log(`spawned: ${process.pid}`);
	});
	
	return process.pid;
}

TyranoUtil.getTempPath = async function(gameExe) {

}

TyranoUtil.extract = async function(gameExe, destinationDir) {
	gameExe = gameExe || "F:\\test\\tyrano\\koishi_win_1.2\\Koishi.exe";
	//gameExe = gameExe || "G:\\Donovan\\games\\misc\\Hagme1193\\Life With My Allotted Woman\\彼女とのセイカツ_WIN\\彼女とのセイカツ.exe";
	destinationDir = destinationDir || "F:\\test\\tyrano\\extract"
	var dirContent = await fs.promises.readdir(nw.process.env.TMP);

	var difFolder = async function() {
		var currentDir = await fs.promises.readdir(nw.process.env.TMP);
		for (var i in currentDir) {
			if (dirContent.includes(currentDir[i])) continue;
			var fullPath = nwPath.join(nw.process.env.TMP, currentDir[i]);
			if (await common.isDirectory(fullPath)) {
				return fullPath;
				//break;
			}
		}
	}

	var pid = this.spawn(gameExe);
	console.log("pid", pid);

	for (var i=0; i<20; i++) {
		await common.wait(2000);
		var tempFolder = await difFolder();
		if (tempFolder) break;
	}

	var process = await common.aSpawn("tasklist", ["/fi", `"pid eq ${pid}"`], {shell:true});
	console.log(process);

	console.log("waiting based on folders mtime change");
	var lastMtime = 0;
	while (true) {
		var thisStat = await common.fstat(tempFolder);
		console.log(JSON.stringify(thisStat, undefined, 2));
		console.log(`${thisStat.atimeMs} == ${lastMtime}`);
		if (thisStat.atimeMs == lastMtime) break;
		await common.wait(1000);
		lastMtime = thisStat.atimeMs;
	}

	var process = await common.aSpawn("tasklist", ["/fi", `"pid eq ${pid}"`], {shell:true});
	console.log(process);

	console.log("temp folder: ", tempFolder);
	await bCopy(tempFolder, destinationDir);
	console.log("done copying");
}


TyranoUtil.showExtractDialog = async function(gameExe, destinationDir) {
	gameExe = gameExe || "";
	destinationDir = destinationDir || "";
	var dvField = new DVField();
	var	$popup = $("<div id='tyrano_decryptorDialog'></div>");

	var fieldData = {};

	var openGame = async function() {
		var dirContent = await fs.promises.readdir(nw.process.env.TMP);

		var difFolder = async function() {
			var currentDir = await fs.promises.readdir(nw.process.env.TMP);
			for (var i in currentDir) {
				if (dirContent.includes(currentDir[i])) continue;
				var fullPath = nwPath.join(nw.process.env.TMP, currentDir[i]);
				if (await common.isDirectory(fullPath)) {
					return fullPath;
					//break;
				}
			}
		}
	
		fieldData.process = this.spawn(fieldData.gameExe);
		console.log("process", fieldData.process);	
		for (var i=0; i<20; i++) {
			await common.wait(2000);
			var tempFolder = await difFolder();
			if (tempFolder) break;
		}
		fieldData.tempFolder = tempFolder;
		return tempFolder;
	}

	var showSlideMain = function() {
		var $content = $(`<div>
			<h2 data-tran="">${t('选择Taranobuilder\s打包游戏')}</h2>
			<div data-tran="">
				${t('选择打包游戏的exe文件。')}
			</div>
			<label>
				<input type="dvSelectPath" class="fromPath form-control" accept=".exe" value="${gameExe}" />
			</label>
			<div class="tooltip injectDestFolderTooltip error icon-cancel-circled hidden" data-tran="">字段不能为空！</div>
			</div>

			<div class="blockBox warningBlock withIcon" data-tran="">
				按下<b>下一步</b>将打开游戏<br />
				不要手动关闭游戏窗口。
			</div>
			`);
		dvField.renderSelectPath($content.find("[type=dvSelectPath]"));
		$content.find(".fromPath").on("change", function() {
			fieldData.gameExe = $(this).val();
		})
		$popup.empty();
		$popup.append($content);
		$popup.dialog( "option", "buttons", buttons.showSlideMain);
	}

	var showSlideOpenGame = async function() {
		var $content = $(`
			<div class="blockBox warningBlock withIcon" data-tran="">
				请等待游戏完全加载并且游戏屏幕正确显示（显示主屏幕并准备好玩）。<br />
				不要手动关闭游戏窗口！
			</div>
		`);
		$popup.empty();
		$popup.append($content);
		$popup.dialog( "option", "buttons", buttons.showSlideOpenGame);		
	}


	var showSelectDestination = async function() {
		var $content = $(`
			<div>
				<h2 data-tran="">${t('目标文件夹')}</h2>
				<div data-tran="">
				${t('选择目标文件夹。该过程将替换现有文件。')}
				</div>
				<label>
					<input type="dvSelectPath" class="toPath form-control" nwdirectory value="${destinationDir}" />
				</label>
				<div class="tooltip injectDestFolderTooltip error icon-cancel-circled hidden" data-tran="">字段不能为空！</div>
			</div>
		`);
		
		dvField.renderSelectPath($content.find("[type=dvSelectPath]"));
		$content.find(".toPath").on("change", function() {
			fieldData.destinationDir = $(this).val();
		})		
		$popup.empty();
		$popup.append($content);
		$popup.dialog( "option", "buttons", buttons.showSelectDestination);		
	}	

	var showLastScreen = async function() {
		var $content = $(`
			<div>
				<h2 data-tran="">${t('提取完成')}</h2>
			</div>
		`);
		
		dvField.renderSelectPath($content.find("[type=dvSelectPath]"));
		$popup.empty();
		$popup.append($content);
		$popup.dialog( "option", "buttons", buttons.showLastScreen);		
	}	


	var buttons = {};
	buttons.showSlideMain = [
		{
			text: t("关闭"),
			icon: "ui-icon-close",
			click: function() {
				$(this).dialog( "close" );
			}
		},
		{
			text: t("下一个"),
			click: async function() {
				if (!fieldData.gameExe) return alert(t(`请选择游戏可执行文件`));
				await showSlideOpenGame();
				await openGame();
			}
		}

	]

	buttons.showSlideOpenGame = [
		{
			text: t("返回"),
			icon: "ui-icon-close",
			click: function() {
				showSlideMain();
			}
		},
		{
			text: t("游戏已满负荷，继续！"),
			click: async function() {
				await showSelectDestination();
			}
		}

	]

	buttons.showSelectDestination = [
		{
			text: t("返回"),
			icon: "ui-icon-close",
			click: function() {
				showSlideOpenGame();
			}
		},
		{
			text: t("提取数据"),
			click: async function() {
				console.log("复制 data");
				ui.showBusyOverlay();
				await bCopy(fieldData.tempFolder, fieldData.destinationDir);
				ui.hideBusyOverlay();
				showLastScreen();
			}
		}

	]

	buttons.showLastScreen = [
		{
			text: t("打开解压文件夹"),
			icon: "ui-icon-close",
			click: function() {
				nw.Shell.showItemInFolder(nwPath.join(fieldData.destinationDir, "index.html"));
			}
		},
		{
			text: t("关闭"),
			click: async function() {
				$(this).dialog("close");
				await common.aSpawn("taskkill", ["/F", "/PID", fieldData.process.pid], {shell:true})
			}
		}
	]	

	$popup.dialog({
		title: t("提取资源"),
		autoOpen: false,
		modal:true,
		width:640,
		height:340,
		minWidth:640,
		minHeight:340,
		show: {
			effect: "fade",
			duration: 200
		},
		hide: {
			effect: "fade",
			duration: 200
		},
		buttons:buttons.main
	});	

	showSlideMain();
	$popup.dialog("open");

	return new Promise((resolve, reject) => {
		$popup.on("dialogclose", (evt, ui)=>{
			resolve(fieldData.tempFolder);
		})
	})
}

this.TyranoUtil = TyranoUtil;

function init() {
	// copy utils from kagParser

	// tool menu
	ui.mainMenu.addChild("tools", {
		id: "tyrano",
		label: "Tyrano"
	});


	var $newTransMenu = ui.mainMenu.addChild("tyrano", {
		label: "提取Taranobuilder包"
	});

	$newTransMenu.on("select", function() {
		TyranoUtil.showExtractDialog();
	})



	console.log("%cINITIALIZING tyranoTrans", "background:yellow; font-weight:bold;");
	var $slide = $(`
		<h1><i class="icon-plus-circled"></i>Tyrano Script</h1>
		<div class="blockBox infoBlock withIcon">
			<h2>TyranoTrans Ver.`+thisAddon.package.version+`</h2>
			<p>创建新项目之前，请确保：
				<ol>
					<li>游戏被解压了。<br />
					Translator++有一个内置的Taranobuilder提取器，位于<b>Main menu→Tools→Tyrano→Extract TyranoBuilder Package</b><br />
					或者<button class="openTyranoExtractor"><b>单击此处打开Taranobuilder提取器</b></button>
					</li>
					<li>全部的ks&amp;。tjs文件为纯文本（未编译、未解读和未加密）</li>
					<li>泰拉诺游戏应该是可玩的，即使没有重新打包。所以你应该检查你的游戏在被解压后是否可以玩。</li>
				</ol>
			</p>
		</div>
		<div>
			<h2>文字标记</h2>
			<div>文字标记是将转义到Translator++编辑器中的标记。</div>
			<div>在这里列出文字标记，用空格分隔每个标记。</div>
			<div><b>ruby l r</b>是强制性的。</div>
			<textarea class="kagParser_literalTags fullWidth" ></textarea>
		</div>
		<div class="fieldgroup">
			<div class="actionButtons">
			</div>
		</div>`);
		$slide.find('.kagParser_literalTags').val(defaultLiteralTags.join(" "));
		
		$slide.find(".openTyranoExtractor").on("click", async ()=>{
			var extractedPath = await TyranoUtil.showExtractDialog();
		});
		
		
	var $button = $('<button class="btnSelectExe selectRPGExe"><i class="icon-doc-inv"></i>从游戏中选择可执行文件</button>')
	$button.on('click', function() {
		ui.openFileDialog({
			accept:".exe,.html,.htm",
			onSelect : function(selectedFile) {				
				ui.showLoading();
				// processing literal tags 
				var tagStr = $("#dialogNewProject .kagParser_literalTags").val();
				tagStr = tagStr.replace(/s+/g, " ")
				var tagArr = tagStr.split(" ");
				var literalTags = [];
				for (var i=0; i<tagArr.length; i++) {
					tagArr[i] = tagArr[i].trim();
					if (!tagArr[i]) continue;
					literalTags.push(tagArr[i].toLowerCase());
				}
				console.log("-----------------------------");
				console.log("literalTags", literalTags);				
				
				
				var selectedDir = path.dirname(selectedFile);
				ui.loadingProgress("处理", "处理："+selectedDir, {consoleOnly:true, mode:'consoleOutput'});
				ui.loadingProgress("处理", "请稍等！窗口将显示为挂起一个大型游戏。这很正常。", {consoleOnly:true, mode:'consoleOutput'});
				ui.newProjectDialog.close()

				new Promise((resolve, reject) => {
					return thisAddon.utils.createProject(selectedDir, {
						engineName : "tyrano",
						'literalTags' : literalTags
					})

				}).then(function() {
					ui.loadingProgress("处理", "解析.ks文件...", {consoleOnly:true, mode:'consoleOutput'});
					
				})
			}
		})		
	})
	$slide.find(".actionButtons").append($button);
	
	ui.newProjectDialog.addMenu({
		icon : thisAddon.getWebLocation()+"/icon.png",
		descriptionBar : `<h2>TyranoScript游戏</h2>
						<p>从基于Terranoscript的游戏开始翻译</p>`,
		actionBar: "",
		goToSlide: "tyrano1",
		at:4,
		slides : {
			"tyrano1": $slide
		}
	})

	// register handler
	if (typeof window.engines[gameEngine] == 'undefined') engines.add(gameEngine);
	engines.addHandler([gameEngine], 'exportHandler', function(targetPath, options) {
		if (options.mode !== "dir" && options.mode !== "zip") return false;
		
		ui.showLoading();
		ui.loadingProgress("处理", "解析Tyrascript游戏"+targetPath, {consoleOnly:false, mode:'consoleOutput'});
		try {
			var pathStat = fs.lstatSync(targetPath)
			
			if (pathStat.isDirectory()) {
				
				thisAddon.utils.exportToFolder(path.join(trans.project.cache.cachePath, "game"), targetPath, trans.getSaveData(), options)
				.then(() => {
					ui.loadingProgress("完成", "所有过程都完成了！", {consoleOnly:false, mode:'consoleOutput'});
					ui.showCloseButton();
				})

				return true;
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
			return true;
		}
		
		thisAddon.utils.exportToFolder(trans.project.cache.cachePath, tmpPath, trans.getSaveData(), options)
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
	
	engines.addHandler([gameEngine], 'injectHandler', function(targetDir, sourceMaterial, options) {
		console.log("路径是：", targetDir);
		console.log("选项包括：", options);
		console.log(arguments);
		ui.showLoading();
		// convert sourceMaterial to folder if path is file
		var sourceStat = fs.lstatSync(sourceMaterial)
		if (sourceStat.isFile()) sourceMaterial = path.dirname(sourceMaterial);
		
		ui.loadingProgress("处理", "解析数据。窗户有时会挂起来。这很正常！", {consoleOnly:false, mode:'consoleOutput'});
		thisAddon.utils.applyTranslation(sourceMaterial, targetDir, trans.getSaveData(), options);
		
		return true;
	});

	engines.addHandler([gameEngine], 'onOpenInjectDialog', function($dialogInject, options) {
		console.log(arguments);
		$dialogInject.find(".copyOptionsBlock").removeClass("hidden");

		var $options = $dialogInject.find(".options");
		var $writeEncoding = $options.find(".field_writeEncoding");
		if ($writeEncoding.length == 0) {
			$writeEncoding = $(`
			<div class="dialogSectionBlock field_writeEncoding">
				<h2 data-tran="">${t('字符编码')}</h2>
				<div class="info">${t('大多数日本KAG游戏都是用SHIFT-JIS编写的，但KAG实际上支持UTF16LE，无论语言环境设置如何，它都可以在所有窗口上读取。许多翻译人员将字符编码改为UTF16LE，这样游戏就可以在非日语的windows上玩了<br />默认情况下，Translator++将写入其原始字符编码。')}
				</div>
				<div class="">
					<select class="writeEncoding">
						<option value="">Use original</option>
						<option value="UTF-16LE">UTF-16LE</option>
						<option value="SHIFT_JIS">SHIFT_JIS</option>
					</select>
				</div>
			</div>`);
			$options.append($writeEncoding);
		}

		var $writeEncodingFld = $writeEncoding.find(".writeEncoding")
		$writeEncodingFld.val(thisAddon.config.importEncoding);
		$writeEncodingFld.on("change", function() {
			thisAddon.config.importEncoding = $(this).val();
		})
	});	

	engines.addHandler([gameEngine], "onLoadTrans", 
	() => {
		ui.ribbonMenu.add("Tyrano", {
			title : trans.gameEngine.toUpperCase(),
			toolbar : {
				buttons : {
					/*
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
					*/
					openEditor : {
						icon : "icon-link-ext",
						title : t("提取TyranoBuilder"),
						onClick : async () => {
							TyranoUtil.showExtractDialog();
						}
					},
					
				}
			}
		})		
	})	


	engines.addHandler([gameEngine], 'onLoadSnippet', async function(selectedCell) {
		console.log("tyrano onLoadSnippet handler");
		console.log("selected cell:", selectedCell);
		var obj = trans.getSelectedObject();

		if (obj.extension.toLowerCase() == ".tjs") this.commonHandleFile(selectedCell, "js");
		if (obj.extension.toLowerCase() == ".ks") this.commonHandleFile(selectedCell, "ks");

	});		
	
}

$(document).ready(function() {
	ui.onReady(function() {
		init();
	});
});