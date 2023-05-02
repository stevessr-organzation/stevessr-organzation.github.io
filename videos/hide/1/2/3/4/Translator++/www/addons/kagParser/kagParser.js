/*
Parse .ks & .tjs and convert them to .trans

convert .ks to xmlize data by replacing [ to < and ] to >
[end to </ 



macro endmacro if else elsif endif ignore endignore iscript endscript 

ignore anything inside [ignore] & [endignore]
parse anything inside [isscript] & [endscript]


cancelautomode	(Canceling "Automatically read through")
cancelskip	(Cancel skip)
ch	(Display characters)
cm	(Clear all message layers)
ct	(Reset message layer)
current	(Specify the message layer to be operated)
deffont	(Default character attribute setting)
defstyle	(Set default style)
delay	(Set character display speed)
endindent	(Remove indent)
endnowait	(Character display no wait (end of))
er	(Erase message layer characters)
font	(Character attribute setting)
glyph	(Specify click wait symbol)
graph	(Inline image display)
hch	(Display vertical-in-vertical display)
indent	(Set indent)
l	(Wait for line end click) <-- literal
locate	(Specify character display position)
locklink	(Link lock)
nowait	(Character display no weight)
p	(Waiting for page break click) <-- literal
position	(Message layer attribute)
r	( Begin on a new line ) <-- literal
resetfont	(Reset character attribute to default)
resetstyle	(Reset style to default)
ruby	(Specify ruby)
style	(Style settings)
unlocklink	(Unlock link)


WHEN EXPORTING : 
generate from line break : [r]

SCRIPTS :
capture all string inside quote
/(?<=(["']\b))(?:(?=(\\?))\2.)*?(?=\1)/gms


*/
var thisAddon = this;



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
		/*
		"convertEncodingTo": {
		  "type": "string",
		  "title": "Convert encoding into",
		  "description": "Post processing converter. Convert the encoding after the script exported successfully.<br />Most KAG Games use <b>Shift_JIS</b> or <b>UTF-16</b>",
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
		  "HOOK": "thisAddon.config.convertEncodingTo"
		},
		*/
		"useLegacy": {
		  "type": "boolean",
		  "title": "使用遗留解析器",
		  "inlinetitle": "使用遗留解析器",
		  "description": "使用旧的解析器而不是新的解析器<br />遗留解析器速度更快，但在某些游戏中不可靠<br />新的解析器更可靠，但速度较慢。",
		  "HOOK": "thisAddon.config.useLegacyParser"
		}		
}

thisAddon.config = thisAddon.config || {};
//thisAddon.config = thisAddon.config||{};
//thisAddon.config.convertEncodingTo = "utf16";

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
var libKAG 		= require("www/addons/kagParser/libKAG.js")(thisAddon);


var KAGFile 	= libKAG.KAGFile;
var TjsFile 	= libKAG.TjsFile;
var KsFile 		= libKAG.KsFile;
var KAGJs 		= libKAG.KAGJs;
//window.KsFile 	= KsFile;

//console.log(ksFile);
this.utils = libKAG.utils;
var createProject 		= this.utils.createProject
var exportToFolder 		= this.utils.exportToFolder;
var applyTranslation 	= this.utils.applyTranslation

var repackToXP3 = async function(from, to, options) {
	console.log("Repacking into xp3", arguments);
	console.log("process folder sctructure:", thisAddon.options.addFolderStructure);
	var isPatched;
	if (thisAddon.options.addFolderStructure) {
		newFrom = nwPath.join(from, "\\");
		var targetName = nwPath.basename(to);
		var dirStructure = await bCopy.walk(newFrom);
		var directory = {}
		var xp3Files = []
		var configFile = "";
		var confLines=[];
		for (var i in dirStructure) {
			directory[nwPath.dirname(dirStructure[i])] = true;
			if (nwPath.basename(dirStructure[i]).toLowerCase() == "config.tjs") configFile = dirStructure[i];
			if (nwPath.extname(dirStructure[i]).toLowerCase() == ".xp3") {
				xp3Files.push(dirStructure[i]);
			}
		}
		if (configFile) {
			for (var dir in directory) {
				var relPath = dir.substr(newFrom.length);
				if (!relPath) continue;
				relPath = nwPath.join(relPath, "\\");
				relPath = relPath.replaceAll("\\", "/");
				confLines.push(`Storages.addAutoPath(System.exePath + "${targetName}>${relPath}");`);
			}
			for (var i in xp3Files) {
				var relPath = xp3Files[i].substr(newFrom.length);
				if (!relPath) continue;
				relPath = nwPath.join(relPath, "\\");
				relPath = relPath.replaceAll("\\", "/");
				confLines.push(`Storages.addAutoPath(System.exePath + "${targetName}>${relPath}");`);
	
			}
			console.log(confLines.join("\n"))
			console.log(`copying  ${configFile}, ${configFile}.bak_`);
			await bCopy(configFile, configFile+".bak_");
			var newPath = nwPath.join(newFrom, nwPath.basename(configFile))
			if (configFile !== newPath) fs.renameSync(configFile, newPath);
			var config = await common.fileGetContents(newPath);
			config = confLines.join("\n")+"\n\n"+config.toString();
			await common.filePutContents(newPath, config);
			isPatched = true;
		}

	}


	var packer = nwPath.join(__dirname, "www/addons/kagParser/bin/KirikiriTools/Xp3Pack.exe")
	var expectedResult = from + ".xp3";
	if (await common.isFileAsync(expectedResult)) {
		await common.rename(expectedResult, expectedResult+".bak_");
		var origFileExist = true;
	}
	await common.aSpawn(packer, [from], {});

	if (expectedResult !== to) {
		await common.rename(expectedResult, to);

		if (origFileExist) {
			await common.rename(expectedResult+".bak_", expectedResult);
		}
	}


	if (isPatched)  {
		console.log("Restoring config");
		fs.renameSync(configFile+".bak_", configFile);
		fs.unlinkSync(newPath);
	}

}
//thisAddon.repackToXP3 = repackToXP3;
this.utils.repackToXP3 = repackToXP3;

var repackToXP3Dialog = function(from, to, options) {
	from = from || "";
	to = to || "";
	var $popup = $("#kag_repack");
	if ($popup.length == 0) {
		var dvField = new DVField();
		$popup = $("<div id='kag_repack'></div>");
		var $content = ($(`<div class="dialogSectionBlock">
			<h2 data-tran="">${t('选择目录')}</h2>
			<div data-tran="">
				${t('选择要重新打包的目录')}
			</div>
			<label>
				<input type="dvSelectPath" class="fromPath form-control" nwdirectory value="${from}" />
			</label>
		<div class="tooltip injectDestFolderTooltip error icon-cancel-circled hidden" data-tran="">字段不能为空！</div>
		</div>
		<div class="dialogSectionBlock">
			<h2 data-tran="">${t('目标xp3')}</h2>
			<div data-tran="">
			${t('选择文件名。特殊文件名，如<b>patch.xp3</b>, <b>patch2.xp3</b>...等等优先于数据。加载时使用xp3。')}
			</div>
			<label>
				<input type="dvSelectPath" class="toPath form-control" nwsaveas="data.xp3" accept=".xp3" value="${to}" />
			</label>
		<div class="tooltip injectDestFolderTooltip error icon-cancel-circled hidden" data-tran="">字段不能为空！</div>
		</div>
		<div class="dialogSectionBlock">
			<label class="flex fullWidth">
				<div class="flexMain">
					<div class="label">${t('允许文件夹结构的补丁')}</div>
					<div class="info" data-tran="">${t('默认情况下，KAG引擎不读取xp3文件中文件夹内的文件。此选项将自动将文件夹结构定义添加到配置中。tjs。如果没有配置，则无效。找到了tjs文件。')}</div>
				</div>
				<div>
					<input type="checkbox" class="flipSwitch addFolderStructure" data-fld="addFolderStructure" value="1" data-default="False"> 
				</div>
			</label>
		</div>		
		`));

		$content.find(".addFolderStructure").prop("checked", thisAddon.options.addFolderStructure);
		$content.find(".addFolderStructure").on("change", function() {
			thisAddon.options.addFolderStructure = $(this).prop("checked")
		})

		$content.find(".fromPath").on("change", function() {
			var thisVal = $(this).val();
			if (Boolean(thisVal) == false) return;
			var $toPath = $(this).closest(".ui-dialog-content").find(".toPath");
			$toPath.attr("nwsaveas", nwPath.basename(thisVal)+".xp3");
		})
		console.log("rendering ", $popup);
		dvField.renderSelectPath($content.find("[type=dvSelectPath]"));

		$popup.empty();
		$popup.append($content);
	}
	$popup.dialog({
		title: t("重新打包到xp3中"),
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

				
					$this.dialog( "close" );
					ui.showBusyOverlay();
					await repackToXP3(from, to);
					ui.hideBusyOverlay();
				}
			}

		]
	});	
	$popup.dialog("open");
}
this.utils.repackToXP3Dialog = repackToXP3Dialog;


function init() {
	// tool menu
	ui.mainMenu.addChild("tools", {
		id: "kag",
		label: "KAG"
	});

	var $newTransMenu = ui.mainMenu.addChild("kag", {
		label: "将文件夹重新打包到xp3"
	});

	$newTransMenu.on("select", function() {
		repackToXP3Dialog();
	})

	


	console.log("%cINITIALIZING KAG Parser", "background:yellow; font-weight:bold;");
	var $slide = $(`
		<h1><i class="icon-plus-circled"></i>Kirikiri冒险游戏</h1>
		<div class="blockBox infoBlock withIcon">
			<h2>KAG Parser Ver.`+thisAddon.package.version+`</h2>
			<p>创建新项目之前，请确保：
				<ol>
					<li>所有xp3文件都已解压缩</li>
					<li>全部的.ks & .tjs文件为纯文本（未编译、未解读和未加密）</li>
					<li>KAG游戏应该是可玩的，即使没有重新打包。所以你应该检查你的游戏在被解压后是否可以玩。</li>
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
		
		
		
	var $button = $('<button class="btnSelectExe selectRPGExe"><i class="icon-doc-inv"></i>从游戏中选择可执行文件</button>')
	$button.on('click', function() {

		
		ui.openFileDialog({
			accept:".exe",
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
					return createProject(selectedDir, {
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
		icon : "addons/kagParser/icon.png",
		descriptionBar : `<h2>Kirikiri冒险游戏</h2>
						<p>从KAG游戏开始翻译</p>`,
		actionBar: "",
		goToSlide: 60,
		at:3,
		slides : {
			60: $slide
		}
	})

	// register handler
	if (typeof window.engines.kag == 'undefined') engines.add('kag');
	engines.kag.addProperty('exportHandler', function(targetPath, options) {
		if (options.mode !== "dir" && options.mode !== "zip") return false;
		
		ui.showLoading();
		ui.loadingProgress("处理", "解析KAG游戏"+targetPath, {consoleOnly:false, mode:'consoleOutput'});
		try {
			var pathStat = fs.lstatSync(targetPath)
			
			if (pathStat.isDirectory()) {
				
				exportToFolder(path.join(trans.project.cache.cachePath, "game"), targetPath, trans.getSaveData(), options)
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
		
		exportToFolder(trans.project.cache.cachePath, tmpPath, trans.getSaveData(), options)
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
	
	engines.kag.addProperty('injectHandler', function(targetDir, sourceMaterial, options) {
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

	engines.kag.addProperty('onOpenInjectDialog', function($dialogInject, options) {
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

	engines.addHandler(["kag"], "onLoadTrans", 
	() => {
		ui.ribbonMenu.add("KAG", {
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
						icon : "icon-box",
						title : t("将文件夹打包到xp3中"),
						onClick : async () => {
							repackToXP3Dialog();
						}
					},
					
				}
			}
		})		
	})	


	engines.addHandler(["kag"], 'onLoadSnippet', async function(selectedCell) {
		console.log("KAG onLoadSnippet handler");
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