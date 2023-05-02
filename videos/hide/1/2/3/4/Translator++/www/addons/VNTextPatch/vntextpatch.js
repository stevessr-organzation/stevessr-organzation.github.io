var thisAddon 	= this;
var appName 	= this.package.name;
var spawn 		= spawn || require('child_process').spawn;
var bCopy 		= require('better-copy');
var fse 		= fse || require('fs-extra');
const thisPath  = thisAddon.getPathRelativeToRoot();
thisAddon.vnTextPatchBin    = nwPath.join(thisPath, "bin/VNTextPatch.exe");
thisAddon.debugLevel        = 0;
thisAddon.engineName        = "VNTrans";


class SheetData extends require("www/js/ParserBase.js").ParserBase {
	constructor(obj, options, callback) {
		super(obj, options, callback)
		this.debugLevel         = thisAddon.debugLevel;
		this.currentEntryPoint  = {};
		this.transData = {
			data:[],
			context:[],
			tags:[],
			parameters:[],
			indexIds:{}
		};
	}
}

SheetData.prototype.toTrans = async function($data, baseContext = [], basePath) {
    $data = $data || this.obj;
    if (Array.isArray(baseContext) == false) baseContext = [baseContext];
    basePath = basePath || "";

    console.log("converting sheet data:", $data);
    if (empty($data)) return;
    var $files = {};

    var createContext = function(context) {
        var thisContext = baseContext.concat(context);
        return thisContext.join("/");
    }

    var getPath = function(path) {
        var path = nwPath.join(basePath, path);
        path = path.replaceAll("\\", "/");
        if (path[0] == "/") path = path.substr(1);
        return path;
    }

    for (var $sheetName in $data) {
        var $sheetContent = $data[$sheetName];
        var $fileData = {};
        $fileData["data"]         = [];
        $fileData["context"]      = [];
        $fileData["parameters"]   = [];
        $fileData["comments"]     = [];
        
        var $wordCache = {};
        for(var $rowId=0; $rowId<$sheetContent.length; $rowId++) {
            var $row = $sheetContent[$rowId];
            if ($rowId == 0) continue; // skip row header
            if (empty($row)) continue;
            if (empty($row[1])) continue;
            if (typeof $wordCache[$row[1]] !== "undefined") {
                // add to context
                var $id = $wordCache[$row[1]];
                if (empty($fileData["context"][$id])) $fileData["context"][$id] = [];
                $thisContext = [$sheetName, $rowId, 1, "text"];
                if (!empty($row[0])) {
                    // if has character name
                    $thisContext.push(`actorName[${$row[0]}]`);
                } else {
                    $thisContext.push("actorName[]");
                }
    
                $fileData["context"][$id].push(createContext($thisContext));
                $contextId =  $fileData["context"][$id].length -1;
                continue;
            }

            var $thisRow = [];
            // original text
            $thisRow[0] = $row[1];

            // initial text
            if (!empty($row[3])) $thisRow[1] = $row[3];
            if (!empty($row[4])) $thisRow[1] = $row[4];
            if (!empty($row[5])) $thisRow[1] = $row[5];

            // add the data
            $fileData["data"].push($thisRow);
            var $id = $fileData["data"].length -1;

            // context for data
            if (empty($fileData["context"][$id])) $fileData["context"][$id] = [];
            $thisContext = [$sheetName, $rowId, 1, "text"];
            if (!empty($row[0])) {
                // if has character name
                $thisContext.push(`actorName[${$row[0]}]`);
            } else {
                $thisContext.push("actorName[]");
            }

            $fileData["context"][$id].push(createContext($thisContext));
            $contextId =  $fileData["context"][$id].length -1;

            // parameters
            if (!empty($row[0])) {
                // only if has character name
                $fileData["parameters"][$id] = $fileData["parameters"][$id] || [];
                $fileData["parameters"][$id][$contextId] = [];
                $fileData["parameters"][$id][$contextId]["actorName"] = $row[0];
            }
            

            // note
            if (!empty($row[6])) {
                if (empty($fileData["comments"][$id])) $fileData["comments"][$id] = [];
                $fileData["comments"][$id][0] = $row[6];

            }
            // add to cache
            $wordCache[$thisRow[0]] = $id; 


            // ===========================
            // character name (at index 0)
            // ===========================
            if (empty($row[0])) continue;
            if (typeof $wordCache[$row[0]] !== "undefined") {
                // add to context
                $id = $wordCache[$row[0]];
                if (empty($fileData["context"][$id])) $fileData["context"][$id] = [];
                $fileData["context"][$id].push(createContext([$sheetName, $rowId, 0, "name"]));
    
                continue;
            }

            $thisRow = [];
            // original text
            $thisRow[0] = $row[0];
            $fileData["data"].push($thisRow);
            $id = $fileData["data"].length -1;

            // context
            if (empty($fileData["context"][$id])) $fileData["context"][$id] = [];
            $fileData["context"][$id].push(createContext([$sheetName, $rowId, 0, "name"]));
            
            // add to cache
            $wordCache[$thisRow[0]] = $id; 

        }
        $fileData["indexIds"]   = $wordCache;
        $fileData["lineBreak"]  = "\n";
        $fileData["originalFormat"] = "SPREADSHEET";
        $fileData["extension"]  = "";
        $fileData["basename"]   = $sheetName;
        $fileData["filename"]   = $sheetName;
        $fileData["relPath"]    = getPath($sheetName);
        $fileData["path"]       = getPath($sheetName);
        $fileData["dirname"]    = basePath;
        $files[$fileData["relPath"]] = $fileData;
    }
    return $files;
}

SheetData.prototype.selectTranslationData = function(translationData, currentPath) {
    try {
        var transPair = translationData.translationData[currentPath].translationPair;
        this.translationPair = transPair || {};
    } catch (e) {
        this.translationPair = {};
    }
    return this.translationPair;
}

SheetData.prototype.toTable = function(transData, translationData) {
    transData = transData || trans.getSaveData();
    translationData = translationData || trans.getTranslationData();
    if (!transData) return;
    if (!translationData) return;

    var result = {};
    for (var fileId in transData.project.files) {
        var thisFileObj = transData.project.files[fileId];
        if (empty(thisFileObj.data)) continue;
        if (empty(thisFileObj.context)) continue;

        this.selectTranslationData(translationData, fileId);

        result[thisFileObj.dirname] = result[thisFileObj.dirname] || {};
        result[thisFileObj.dirname][thisFileObj.basename] = [];
        for (var rowId=0; rowId<thisFileObj.context.length; rowId++) {
            var origText    = thisFileObj.data[rowId][0];
            if (!origText) continue;

            for (var contextId=0; contextId<thisFileObj.context[rowId].length; contextId++) {
                var thisContext = thisFileObj.context[rowId][contextId];
                var translation = this.translate(origText, [thisContext]);
                if (translation == origText) continue;

                // extract row components
                var contextComp = thisContext.split("/");
                var targetCol   = 3;
                if (contextComp[3] == 0) {
                    // character name
                    targetCol   = 2;
                }

                result[thisFileObj.dirname][thisFileObj.basename].push({
                    row         : contextComp[2],
                    col         : targetCol,
                    translation : translation
                });
            }

        }
    }
    return result;
}

thisAddon.SheetData = SheetData;


var VNTextPatch = function(entryPoint, options) {
    this.entryPoint = entryPoint;
    this.options    = options;
    this.init();
}

VNTextPatch.prototype.init = function() {
    if (common.isDir(this.entryPoint)) {
        this.dir = this.entryPoint;
    } else {
        this.dri = nwPath.dirname(this.entryPoint);
    }
}

VNTextPatch.dirToXls = async function(dir, destinationFile) {
    await common.aSpawn(thisAddon.vnTextPatchBin, ["extractlocal", dir, destinationFile], {
        onData:function(data) {
            ui.log(data.toString());
        }
    });
}

VNTextPatch.xlsToDir = async function(destinationDir, sourceDir, xlsFile) {
    await common.mkDir(destinationDir);
    await common.aSpawn(thisAddon.vnTextPatchBin, ["insertlocal", sourceDir, xlsFile, destinationDir], {
        onData:function(data) {
            ui.log(data.toString());
        }
    });
}

VNTextPatch.xlsToTrans = async function(xlsFile) {
    var fileData = await php.spawn("xls2trans.php", {
        args: {
            file:xlsFile
        },
        scriptPath: thisAddon.getLocation()
    });
    var baseName = nwPath.basename(xlsFile);

    var sheetData = new SheetData(fileData);
    var transObj = {
        project: {
            files: await sheetData.toTrans(fileData, [baseName], baseName)
        }
    }
    return transObj;
}

VNTextPatch.patchXls = async function(xlsFile, patch, newXlsPath) {
    if (!newXlsPath) newXlsPath = nwPath.join(nw.process.env.TEMP, common.makeid(12)+".xlsx");
    var fileData = await php.spawn("trans2xls.php", {
        args: {
            file    :nwPath.resolve(xlsFile),
            patch   :nwPath.resolve(patch),
            newFile :nwPath.resolve(newXlsPath)
        },
        onData: function(data){
            ui.log(data.toString());
        },
        scriptPath: thisAddon.getLocation()
    });

    return newXlsPath;
}


VNTextPatch.createStaging = async function(id) {
	await ui.log("Generating staging directory");

	id = id || common.makeid(10);

	var cacheInfo = {
		cacheID     : id,
		cachePath   : nwPath.join(common.getStagePath(), id)
	}

	var cacheFolderData = nwPath.join(cacheInfo.cachePath, "data");
	await common.mkDir(cacheFolderData);
	await ui.log(`New staging directory with id ${id} has been created!`);
	
	return cacheInfo;
}

VNTextPatch.determineType = async function(directory) {

}

VNTextPatch.createProject = async function(sourceDir, options) {
    options = options || {};
    if (await common.isDir(sourceDir) == false) {
        await ui.log("Invalid target directory ", sourceDir);
        return;
    }
    var xlsName     = nwPath.basename(sourceDir);
    var stagingInfo = await this.createStaging();
    var xlsPath     = nwPath.join(stagingInfo.cachePath, "data/sheet", xlsName+".xlsx");
    await common.mkDir(nwPath.dirname(xlsPath));
    if (await common.isFileAsync(xlsPath)) await fse.promises.unlink(xlsPath);

    var gameData    = nwPath.join(stagingInfo.cachePath, "data/gameData");
    
    await ui.log(`Copying data from ${sourceDir} to ${gameData}`);
    await bCopy(sourceDir, gameData);

    await ui.log(`Converting xlsx ${sourceDir} to ${nwPath.resolve(xlsPath)}`);
    await this.dirToXls(sourceDir, nwPath.resolve(xlsPath));

    if (await common.isFileAsync(xlsPath) == false) return console.error("Failed to process into spreadsheet");
    await ui.log("Creating trans object");
    var transObj    = await this.xlsToTrans(nwPath.resolve(xlsPath));
    await ui.log("Building project");
    transObj.project.cache          = stagingInfo;
    transObj.project.gameEngine     = thisAddon.engineName;
    transObj.project.loc		    = sourceDir;
    transObj.project.parserVersion	= thisAddon.package.version;
    transObj.project.parser         = thisAddon.package.name;
    transObj.project.projectId      = stagingInfo.cacheID;

    trans.openFromTransObj(transObj, {isNew:true});
    await ui.log("Done");
}

VNTextPatch.exportToFolder = async function(targetFolder, options) {
	console.log("export to folder with options:", options);
	options 						= options || this.options || {};
	options.transData				= options.transData || trans.getSaveData();

    // direct instance of trans.getTranslationData
    options.translationData = options.translationData || trans.getTranslationData(options.transData, {filterTag:options.filterTag, filterTagMode:options.filterTagMode, files:options.files});

    await common.mkDir(targetFolder);

    ui.log("Creating translation table");
    var sheetData = new SheetData();
    var transTable = sheetData.toTable(options.transData, options.translationData);

    for (var xlsBasename in transTable) {
        // source xlsx file
        var xlsxPath    = nwPath.join(options.transData.project.cache.cachePath, "data/sheet", xlsBasename);
        var sourceDir   = nwPath.join(options.transData.project.cache.cachePath, "data/gameData");

        ui.log(`Generating patch`);

        var patchFile = nwPath.join(nw.process.env.TEMP, "cellData.json");
        await common.filePutContents(patchFile, JSON.stringify(transTable[xlsBasename]), "utf-8", false);


        ui.log("Patching xlsx file");
        var newXls = await this.patchXls(xlsxPath, patchFile);
        ui.log(`Patched xlsx file: ${newXls}`);

        if (await common.isFileAsync(newXls) == false) {
            ui.log("Error: expected xlsx file not found at: ", newXls);
            ui.log("Probably the previous action was not completed successfully.");
            return;
        }

        ui.log(`Generating patch at: ${targetFolder}`);
        await this.xlsToDir(targetFolder, sourceDir, newXls);
        ui.log("Done");
    }

}

VNTextPatch.exportAsZip = async function(targetPath, options) {
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

    await this.exportToFolder(tmpDir, options);
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

VNTextPatch.drawNewProject = async function() {
    var $slide = $(`
		<h1><i class="icon-plus-circled"></i>VN Translation Tool</h1>
		<div class="blockBox infoBlock withIcon">
            <h2>VNTranslationTools Ver.`+thisAddon.package.version+`</h2>

            <div><strong>Supported format:</strong></div>
			<ul>
                <li>AdvHD (.ws2)</li>
                <li>ArcGameEngine (.bin)</li>
                <li>Artemis (.txt)</li>
                <li>Buriko General Interpreter/Ethornell (no file extension; tool expects .bgi)</li>
                <li>CatSystem2 (.cst)</li>
                <li>Cyberworks C,system (no file extension; tool expects .csa)</li>
                <li>KaGuYa (message.dat)</li>
                <li>Kirikiri (.ks/.ks.scn)</li>
                <li>Majiro (.mjo)</li>
                <li>Musica (.sc)</li>
                <li>Mware (.nut)</li>
                <li>Propeller/Stuff Script Engine (.msc)</li>
                <li>RealLive (.rl)</li>
                <li>Ren'Py (.rpy)</li>
                <li>ShSystem (.hst)</li>
                <li>Silky's/AI6WIN (.mes/.map)</li>
                <li>Qlie (.s)</li>
                <li>Softpal (script.src - make sure text.dat is available in the same folder)</li>
                <li>SystemNNN (.nnn, .spt)</li>
                <li>WillPlus AdvHD (.ws2)</li>
                <li>Whale</li>
                <li>YU-RIS (.ybn)</li>
            </ul>
            <h2>Before you started</h2>
            <p>Please make sure you have a folder with unencrypted and extracted game data.<br />
            You can use various tool such as <a href='https://github.com/morkt/GARbro/releases/' class="external" external>GARBro</a> to extract your game data.</p>
            <p>After that, click the <b>"I have extracted the game data"</b> button on this dialog window.</p>
		</div>`);
		

	
	ui.newProjectDialog.addMenu({
		icon : thisAddon.getWebLocation()+"/icon.png",
		descriptionBar : `<h2>VN Translation Tools</h2>
						<p>Translate visual novels with VNTranslationTools.<br /> 
                            Supports 
                            AdvHD (.bin), 
                            ArcGameEngine (.bin), 
                            Artemis,
                            Buriko General Interpreter/Ethornell, 
                            CatSystem2 (.cst),
                            Cyberworks C,system,
                            KaGuYa (message.dat),
                            Majiro (.mjo),
                            Musica (.sc),
                            Mware (.nut),
                            Kirikiri (.ks/.ks.scn), 
                            Propeller (.msc),
                            RealLive (.rl),
                            Ren'Py (.rpy),
                            ShSystem (.hst),
                            Silky's/AI6WIN (.mes/.map),
                            Qlie (.s),
                            SystemNNN (.nnn, .spt),
                            WillPlus AdvHD (.ws2),
                            Whale
                            YU-RIS (.ybn),
                        </p>`,
		actionBar: "",
		goToSlide: 'VNTransTool',
		at:3,
		slides : {
			'VNTransTool': ui.newProjectDialog.newSlide("VNTransTool", $slide, {
                buttons: [
                            {
                                text: t("I have extracted the game data"),
                                click: async function() {
                                    ui.newProjectDialog.gotoSlide("VNTransTool2", "VNTransTool");
                                }
                            }
                        ]
            })
		}
	});

    var $slide2 = $(`<div class="dialogSectionBlock">
        <h2 data-tran="">${t("Load game's data folder")}</h2>
        <div class="info" data-tran="">${t("Select the game's data folder")}</div>
        <div class="openDir"></div>
        <div class="dialogInfo alert alert-warning hidden" data-tran=""><i class="icon-attention red"></i> ${('Invalid path.')}<br>${('Some features will be disabled until this is fixed.')}</div>
    </div>`);
    var $button = $('<input type="dvSelectPath" nwdirectory class="form-control selectDataFolder" name="selectDataFolder" value="" />')
	$button.on('change', async function() {

	});
	$slide2.find(".openDir").append($button);

    ui.newProjectDialog.newSlide("VNTransTool2", $slide2, {
		onActive : function(e, newProjectDialog) {
			
		},
		buttons: [
					{
						text: t("Create a new project"),
						click: async function() {
                            var sourceDir = $button.val();
                            if (await common.isDir(sourceDir) == false) return alert(t(`Invalid destination directory:\n${sourceDir}`));
                            ui.showLoading();
                            await ui.newProjectDialog.close();
                            await common.wait(300);

                            ui.loadingProgress("Processing", "Creating a new project via VNTranslationTools : "+sourceDir, {consoleOnly:false, mode:'consoleOutput'});

                            await VNTextPatch.createProject(sourceDir);
                            ui.loadingProgress("Finished", "All process finished!", {consoleOnly:false, mode:'consoleOutput'});
                            ui.loadingEnd();
						}
					}
				]
	});
}

thisAddon.VNTextPatch = VNTextPatch;

var init = async function() {
    VNTextPatch.drawNewProject();

    engines.addHandler(thisAddon.engineName, 'exportHandler', async function(targetPath, options) {
		if (options.mode !== "dir" && options.mode !== "zip") return false;
		console.log("Export handler", arguments);

		ui.showLoading();
		ui.loadingProgress("Processing", "Export into : "+targetPath, {consoleOnly:false, mode:'consoleOutput'});
		await ui.log("Target directory:", targetPath);
		await ui.log("Options : ", options);
		await ui.log("Origin path is cache path");
	
		if (options.mode == "dir") {
			await VNTextPatch.exportToFolder(targetPath, options);
		} else if (options.mode == "zip") {
			await VNTextPatch.exportAsZip(targetPath, options);
		}
        ui.loadingEnd();
        return common.halt();
	});
}

$(document).ready(function() {
	ui.onReady(function() {
		init();
	});
});