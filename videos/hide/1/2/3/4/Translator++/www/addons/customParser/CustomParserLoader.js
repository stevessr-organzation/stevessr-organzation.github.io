const { ENOTEMPTY } = require('constants');
const { emptyDir } = require('fs-extra');

var thisAddon 	= this;
var appName 	= this.package.name;
var spawn 		= spawn || require('child_process').spawn;
var globToRegExp = require('glob-to-regexp');
var bCopy 		= require('better-copy');
var fse 		= fse || require('fs-extra');

const { shim } = require('regexp-match-indices');
var CustomParser = require('www/addons/customParser/CustomParser.js');
thisAddon.CustomParser = CustomParser;

// testing
var testCustomParse = async function() {
    var parserModel = {
        name: "",
        files: [
            {
                type:"Srt file",
                pattern:"*.srt",
                rules : [
                    {
                        type : "regex",
                        captureGroups : [1],
                        pattern :/\d+[\r\n]+\d+:\d+:\d+,\d+ --> \d+:\d+:\d+,\d+[\r\n]+((.+\r?\n)+(?=(\r?\n)?))/g,
                        action : "capture",
                        innerRule : null
                    }
                ]
            }
        ]
    
    }
    var file = await common.fileGetContents("F:\\test\\srt\\simple.srt");
    file = file.replaceAll("\r", "");
    var options = {
        model:parserModel.files[0],
        debugLevel: common.debugLevel()
    }
    var customParser = new CustomParser(file, options);
    customParser.parse();

    console.log(customParser);
}
//testCustomParse();


const CustomParserLoader = function(rootDir, modelStr, options) {
	if (common.isDir(rootDir)) {
		this.dirname = rootDir;
	} else {
		this.dirname = nwPath.dirname(rootDir);
	}
    this.modelStr   = modelStr;
    this.model      = {};
	this.options 	= options || {};
	this.writeMode 	= true;
	this.targetDir  = undefined;
    this.parsed     = {};
    this.loadModel(this.modelStr);
}

CustomParserLoader.prototype.loadModel = function(json) {
    try {
        if (typeof json == "string") json = JSON.parse(json);
    } catch {
        return;
    }
    this.model = json;
}

CustomParserLoader.prototype.getFilesByFilter = async function(filter) {
    if (!this.dirContent) this.dirContent = await common.readDir(this.dirname);
    
    filter = filter.replaceAll(" ", filter);
    var filters = filter.split(";");
    var matchFilter = (path)=> {
        for (var i in filters) {
            var re = globToRegExp(filters[i]);
            if (re.test(path)) return true;
        }
    }

    var result = [];
    for (var i in this.dirContent) {
        if (!matchFilter(this.dirContent[i])) continue;
        result.push(this.dirContent[i]);
    }

    return result;
}

CustomParserLoader.prototype.getFileGroupOptions = function(filegroupObj = {}, key) {
    if (!filegroupObj) return;
    filegroupObj.options ||= {};
    if (!key) return filegroupObj.options;

    try {
        var x = eval("filegroupObj.options."+key);
        return x;
    } catch (e) {
        console.log("can not find option key:", key);
        return;
    }
}

CustomParserLoader.prototype.parse = async function() {
    if (!CustomParser.isValidModel(this.model)) return console.warn("Invalid model");
    
    var handleFiles = async (files, currentModel)=> {
        for (var i in files) {
            var file = files[i];
            var charEncoding        = this.getFileGroupOptions(currentModel, "readEncoding");
            var customParser        = new CustomParser(await common.fileGetContents(file, charEncoding), this.options);
            var relativePath        = common.getRelativePath(file, this.dirname);
            customParser.charEncoding   = common.getOpenedFileEncoding(file);
            customParser.bom            = common.getOpenedFileBom(file);

            if (!customParser.processThispath(relativePath)) continue;
            await ui.log("Parsing file : "+files[i]);

            customParser.generateFileInfo(relativePath);
            customParser.fileInfo.dataType = currentModel.type || currentModel.pattern;
            customParser.assignTranslationPair(relativePath);
            customParser.setModel(currentModel);
            await customParser.parse();
            this.parsed[file] = customParser;
        }
    }
    
    for (var i=0; i < this.model.files.length; i++) {
        var thisFileModel   = this.model.files[i];
        await ui.log("Applying file pattern : "+thisFileModel.pattern);

        var thisFiles       = await this.getFilesByFilter(thisFileModel.pattern);
        await ui.log(`${thisFiles.length} file(s) found!`);

        if (thisFiles.length < 1) continue;
        console.log("handling files:", thisFiles);
        await handleFiles(thisFiles, thisFileModel);
    }

    this.isParsed = true;
}

CustomParserLoader.prototype.createCacheFolder = async function(id) {
	await ui.log("Generating staging directory");

	id = id || common.makeid(10);

	var cacheInfo = {
		cacheID: id,
		cachePath: nwPath.join(common.getStagePath(), id)
	}

	var cacheFolderData = nwPath.join(cacheInfo.cachePath, "data");
	await common.mkDir(cacheFolderData);
	await ui.log(`New staging directory with id ${id} has been created!`);
	
	return cacheInfo;
}

CustomParserLoader.prototype.generateTrans = async function() {
    if (!this.isParsed) {
        this.writeMode = false;
        await this.parse();
    }
    var cacheInfo 			= await this.createCacheFolder();
	this.options 			= this.options || {};
	var stagingDir       	= nwPath.join(cacheInfo.cachePath, "data/");

    this.trans = {
		projectId		: cacheInfo.cacheID,
		cache			: cacheInfo,
		gameEngine		: "custom",
		gameTitle		: this.gameTitle || "untitled project",
		loc				: this.dirname,
		parser			: 'customParser',
		parserVersion	: thisAddon.package.version,
		files			: {},
        options         : {
            parserModel: this.modelStr
        }
	}

    // copy master file to stagingDir
    for (var file in this.parsed) {
        var thisParsedFile          = this.parsed[file];
        var relativePath            = thisParsedFile.fileInfo.relPath;
        var stagingFile             = nwPath.join(stagingDir, relativePath);
        this.trans.files[relativePath]    = Object.assign(thisParsedFile.transData, thisParsedFile.fileInfo);
        await common.mkDir(nwPath.dirname(stagingFile))
        await ui.log(`Copying ${file} to ${stagingFile}`);
        await common.copyFile(file, stagingFile);
    }

    return this.trans;
}

CustomParserLoader.prototype.writeToDir = async function(targetDir) {
    if (!this.isParsed) {
        this.writeMode = true;
        await this.parse();
    }

    // copy master file to stagingDir
    for (var file in this.parsed) {
        var thisParsedFile          = this.parsed[file];
        var relativePath            = thisParsedFile.fileInfo.relPath;
        var targetFile              = nwPath.join(targetDir, relativePath);
        await common.mkDir(nwPath.dirname(targetFile))
        await ui.log(`Writing ${targetFile} with char encoding ${thisParsedFile.charEncoding}`);
        await common.filePutContents(targetFile, thisParsedFile.toString(), thisParsedFile.charEncoding, thisParsedFile.bom);
    }
}

thisAddon.CustomParserLoader = CustomParserLoader;


thisAddon.createProject = async function(targetDir, tpmFile) {
    ui.showLoading();
    ui.loadingProgress("Processing", "Creating project", {consoleOnly:false, mode:'consoleOutput'});
    ui.log("Target directory : "+targetDir);
    ui.log("TPM file  : "+tpmFile);
    
    var customParserLoader = new thisAddon.CustomParserLoader(targetDir, await common.fileGetContents(tpmFile));
    var transFile = await customParserLoader.generateTrans();
    trans.openFromTransObj({project:transFile}, {isNew:true});
    console.log(customParserLoader);
    ui.loadingEnd();
}

thisAddon.exportToFolder = async function(destinationDir, transData, options) {
	transData 			= transData || trans.getSaveData();
	options 			= options || {};
	options.translationDatas = options.translationDatas || trans.getTranslationData();
    try {
        var model       = transData.project.options.parserModel;
    } catch (e) {
        ui.log("Error exporting to a folder. Parser Model is not defined.", e.toString());
        return;
    }
    var stageDir            = nwPath.join(trans.project.cache.cachePath, "data");
    var customParserLoader  = new thisAddon.CustomParserLoader(stageDir, model, options);
    
    await customParserLoader.writeToDir(destinationDir);
}

thisAddon.exportAsZip = async function(targetPath, transData, options) {
	transData 			= transData || trans.getSaveData();
	options 			= options || {};
	options.engineType	= options.engineType || transData.project.gameEngine || trans.project.gameEngine;
	options.translationDatas = options.translationDatas || trans.getTranslationData();

	// todo
	var tmpDir = nwPath.join(nw.process.env.TEMP, "tpp_"+common.generateId());
    try {
		await fse.remove(tmpDir); 
		await common.mkDir(tmpDir, {recursive:true});
	} catch(e) {
		console.warn("Unable to create directory ", tmpDir);
		console.error(e);
		return;
	}
    ui.log("Export to :", tmpDir);
	await this.exportToFolder(tmpDir, transData, options);
	await ui.log("Zipping temporary data");
	var _7z = require('7zip-min');

	return new Promise((resolve, reject) => {
		_7z.cmd(['a', '-tzip', targetPath, tmpDir+"\\*"], err => {
			// done
			console.log("process done");
			resolve(targetPath);
		});	
	})
}

thisAddon.injectTranslation = async function(targetDir, sourceMaterial, options) {

    var sourceDir = sourceMaterial;
	if (await common.isFileAsync(sourceMaterial)) {
		sourceDir = path.dirname(sourceMaterial);
	}

	if (["copyNothing"].includes(options.copyOptions) == false) {
		await ui.log(`Copy ${sourceDir} to ${targetDir}`);
		var overWrite = true;
		if (options.copyOptions == "copyIfNotExist") overWrite = false;
		await ui.log("Overwrite option: "+overWrite.toString());
		await bCopy(sourceDir, targetDir, {
			onBeforeCopy: async (from, to) => {
				await ui.log(`Start copying ${from}`);
			},
			onAfterCopy: async (from, to) => {
				await ui.log(`Successfully copied into ${to}`);
			},
			overwrite: overWrite
		});
	}

    return await thisAddon.exportToFolder(targetDir, undefined, options);
}

thisAddon.openModelEditor = function() {
    var options = {
        id : "pmc",
        width: 800,
        height: 600,
        title: "Parser Model Creator - Translator++"

    }
    nw.Window.open("www/addons/customParser/modelEditor/modelEditor.html", options);
}



var drawProjectCreator = function() {
	var $slide = $(`<h1><i class="icon-plus-circled"></i><span data-tran="">Custom Parser Ver. ${thisAddon.package.version}</span></h1>
	<div class="fieldgroup">
        <h1>Use existing Parser Model</h1>	
        <div class="dialogSectionBlock fieldgroup">
			<h2 data-tran="">Load Translator++ Parser Model file</h2>
			<div class="info" data-tran="">Translator++ Parser Model (tpm) file is a file that contains set of rule to grab texts from files.</div>
			<label><input type="dvSelectPath" class="tpmLocation" accept=".tpm" /></label>
		</div>

        <h1>Or create a new Parser Model</h1>	
        <div class="dialogSectionBlock fieldgroup">
            <h2 data-tran="">Create a new Translator++ Parser Model</h2>
            <div class="info" data-tran="">Create your own parser model with RegExp or Javascript function. We have a tool to help you on that.</div>
            <label><button class="newTPM">Create a new model</button></label>
        </div>

		<div class="actionButtons">
			<button class="createCustomProject"><i class="icon-doc-inv"></i>Select Folder!</button>
		</div>
	</div>`);

    $slide.find(".newTPM").on("click", ()=> {
        thisAddon.openModelEditor();
    });

    $slide.find(".tpmLocation").on("change", function() {
        if (!$(this).val()) return;
        $slide.find(".createCustomProject").prop("disabled", false);
    });
	
    var selectDir = async function() {
        return new Promise((resolve, reject) => {
            var $elm = $(`<input type="file" nwdirectory />`);
            $elm.one("input", function() {
                resolve($(this).val());
            })
            $elm.trigger("click");
        })
    }

    $slide.find(".createCustomProject").on("click", async function() {
        if ($(this).prop("disabled")) return;
        var tpmFile = $slide.find(".tpmLocation").val();
        var targetDir = await selectDir();
        await ui.newProjectDialog.close();
        thisAddon.createProject(targetDir, tpmFile);
    })

	ui.newProjectDialog.addMenu({
		icon 			: thisAddon.getWebLocation()+"/icon.png",
		descriptionBar 	: `<h2>Parse any script with custom parser</h2>
						   <p>Start custom translation project with your own RegExp or Javascript function.</p>`,
		actionBar		: "",
		goToSlide		: "customParser",
		at				: 9,
		slides 			: {"customParser": $slide}
	})


    var initializeSlide = ($slide)=> {
		var resetSlide = ()=> {
            $slide.find(".createCustomProject").prop("disabled", true);
        }

        resetSlide();
    }
	$(document).on("newProjectSlideChange", async (e, slideInfo) => {
		if (slideInfo.id !== "customParser") return;
		initializeSlide(slideInfo.elm);
	});

}

function init() {
    drawProjectCreator();

    var $newMenu = ui.mainMenu.addChild("tools", {
        label:"Create Custom Parser Model"
    });

    $newMenu.on("select", function() {
        thisAddon.openModelEditor();
    })


	var supportedEngines = ["custom"];
	engines.addHandler(supportedEngines, "onLoadTrans", 
	() => {
        // do something for custom translator
	});

	engines.addHandler(supportedEngines, 'exportHandler', async function(targetPath, options) {
		if (options.mode !== "dir" && options.mode !== "zip") return false;
		console.log("Export handler", arguments);
		
		ui.showLoading();
		ui.loadingProgress("Processing", "Export into : "+targetPath, {consoleOnly:false, mode:'consoleOutput'});
		await ui.log("Target directory:", targetPath);
		await ui.log("Options : ", options);
		await ui.log("Origin path is cache path");
		var originPath = nwPath.join(trans.project.cache.cachePath, "data");

		if (await await common.isDirectory(targetPath)) {
			await thisAddon.exportToFolder(targetPath, undefined, options);
		} else {
			await thisAddon.exportAsZip(targetPath, undefined, options);
		}
		ui.loadingProgress("Finished", "Done!", {consoleOnly:false, mode:'consoleOutput'});
		ui.loadingEnd();
		return common.halt();
	});

    engines.addHandler(supportedEngines, 'onOpenInjectDialog', async function(ui, $dialog, options) {
		var $copyOption = $(".copyOptionsBlock");
		$copyOption.removeClass("hidden");
	});

	engines.addHandler(supportedEngines, 'injectHandler', async function(targetDir, sourceMaterial, options) {
		ui.showLoading();
		ui.loadingProgress("Processing", "Injecting translation", {consoleOnly:false, mode:'consoleOutput'});

		await thisAddon.injectTranslation(targetDir, sourceMaterial, options);

		ui.loadingProgress("Finished", "Finished!", {consoleOnly:false, mode:'consoleOutput'});
		ui.loadingEnd();
		ui.showCloseButton();

		return common.halt();
	});

    engines.addHandler(supportedEngines, 'onLoadSnippet', async function(selectedCell) {

		var obj = trans.getSelectedObject();
		this.commonHandleFile(selectedCell, "plain");

	});	
}


$(document).ready(function() {
	ui.onReady(function() {
		init();
	});
});