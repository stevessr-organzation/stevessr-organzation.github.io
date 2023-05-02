/**
 * @file trans.js The core class of Translator++
 * @author Dreamsavior 
 * File version: 2021-07-22 22:58:02.404
 */

/**
 * Executed each time trans file is loaded or initialized
 * @event Trans#transLoaded
 */

window.fs 		= require('graceful-fs');
window.afs 		= require('await-fs');
window.nwPath 	= require('path');
window.spawn 	= require('child_process').spawn;


//================================================================
//
// COMMON FUNCTION
//
//================================================================
window.insertArrayAt = function(array, index, arrayToInsert) {
    Array.prototype.splice.apply(array, [index, 0].concat(arrayToInsert));
    return array;
}

window.arrayExchange = function(arr, fromIndex, toIndex) {
	// exchange an array value by index (single)
	var element = arr[fromIndex];
	arr.splice(fromIndex, 1);
	arr.splice(toIndex, 0, element);
}

window.arrayExchangeBatch = function(input, fromIndex, toIndex) {
	// exchange an array value by indexes(array)
	if (Array.isArray(fromIndex) == false) {
		arrayExchange(input, fromIndex, toIndex);
	}
	for (var i=fromIndex.length-1; i>=0; i--) {
		arrayExchange(input, fromIndex[i], toIndex);
	}
	return input;
}


window.arrayMove = function(array, fromIndex, to) {
	// move an array index to new index
	if(Array.isArray(array) == false) return array;
	if( to === fromIndex ) return array;

	var target = array[fromIndex];                         
	var increment = to < fromIndex ? -1 : 1;

	for(var k = fromIndex; k != to; k += increment){
	array[k] = array[k + increment];
	}
	array[to] = target;
	return array;	
}

window.arrayMoveBatch = function(array, fromIndex, to) {
	if (Array.isArray(fromIndex) == false) {
		return arrayMove(array, fromIndex, to);
	}
	
	var n=0;
	for (var i=fromIndex.length-1; i>=0; i--) {
		array = arrayMove(array, fromIndex[i]+n, to);
		n++;
	}
	return array;
}


window.escapeSelector = function(string) {
	string = string||"";
	if (typeof string !== 'string') return false;
    //return string.replace( /(:|\.|\[|\]|,|=|@)/g, "\\$1" );
    //return string.replace( /(:|\.|\[|\]|,|=|@|\s|\(|\))/g, "\\$1" );
	//return '"'+string+'"';
	return ('"'+CSS.escape(string)+'"')
}

window.arrayInsert =function(thisArray, index, item ) {
    thisArray.splice( index, 0, item );
	return thisArray;
};

window.batchArrayInsert = function(thisArray, index, item ) {
	for (var i=0; i<thisArray.length; i++) {
		arrayInsert(thisArray[i], index, item);
	}
	return thisArray;
};

var FileLoader = function() {
	this.handler = {};
}

FileLoader.prototype.add = function(extension, handler) {
	// handler is function with arguments : filepath
	this.handler[extension] = handler;
}
FileLoader.prototype.open = function(extension, handler) {
	// handler is function with arguments : filepath
	//this.handler['extension'] = handler;
}

window.FileLoader = FileLoader;


//================================================================
//
// 					T R A N S   C L A S S
//
//================================================================

/**
 * The core class of Translator++
 * Handle basic logic
 * @class
 * 
 */
var Trans = function() {
	this.init();
}

/**
 * @function
 */
Trans.prototype.init = function() {
	this.config ={
		loadRomaji:true,
		maxRequestLength:3000,
		autoSaveEvery:600,
		batchDelay:5000,
		rpgTransFormat:true,
		autoTranslate:false
	},
	this.keyColumn 			= 0;
	this.isFreeEditing		= false;
	this.gameTitle			=""
	this.gameEngine			=""
	this.projectId			=""
	this.indexIds			={}
	this.fileListLoaded		=false
	this.isLoadingFileList	=false
	this.unsavedChange		=false
	//files:{},
	this.gameFolder			=''
	this.currentFile		= '' //current .trans file
	this.skipElement		=['note', 'Comment', 'Script']
	this.project			=undefined
	this.timers				={}
	this.data 				=[];
	this.colHeaders			=[t('原文'), t('最初的'), t('机器翻译'), t('更好翻译'), t('最佳翻译')];
	
	
	this.onFileNavLoaded	= function() {}
	this.onFileNavUnloaded	= function() {}
	
	this.validateKey = function(value, callback) {
		console.log("key validator", value);
		if (value=='' || value==null) {
			callback(false);
		} else {
			callback(true);
		}
	}
	
	this.columns = [
			{
			  readOnly: false,
			  validator: this.validateKey,
			  width:150,
			  //trimWhitespace: false
			},
			{
			  readOnly: false,
			  //trimWhitespace: false
			},
			{
			  readOnly: false,
			  //trimWhitespace: false
			},
			{
			  readOnly: false,
			  //trimWhitespace: false
			},
			{
			  readOnly: false,
			  //trimWhitespace: false
			}
		];	
	
	this.default = {};
	this.default.columns = [
			{
			  readOnly: false,
			  validator: this.validateKey,
			  //trimWhitespace: false
			},
			{
			  readOnly: false,
			  //trimWhitespace: false
			},
			{
			  readOnly: false,
			  //trimWhitespace: false
			},
			{
			  readOnly: false,
			  //trimWhitespace: false
			},
			{
			  readOnly: false,
			  //trimWhitespace: false
			}
	
	]
	this.default.colHeaders	=[t('原文'), t('最初的'), t('机器翻译'), t('更好翻译'), t('最佳翻译')];
	
}

/**
 * @function
 */
Trans.prototype.getTemplatePath = function() {
	var templatePath = sys.config.templatePath||nw.App.manifest.localConfig.defaultTemplate
	
	fs = fs||require('fs')	
	try {
	  if (fs.existsSync(templatePath)) {
		return templatePath;
	  }
	} catch(err) {
	  return __dirname+"\\"+templatePath;
	}	
	
}

/**
 * merge reference into files object in transObj.project
 * @function
 * @param  {object} transObj instance of trans object
 * @returns {object} instance of trans object
 */
Trans.prototype.mergeReference = function(transObj) {
	console.log("Merging reference");
	transObj = transObj||{};
	transObj.project = transObj.project||{};
	transObj.project.references = transObj.project.references||{};
	transObj.project.files = transObj.project.files||{};
	for (ref in transObj.project.references) {
		console.log("assigning : ", ref);
		transObj.project.files[ref] = this.project.references[ref];
	}
	
	return transObj;
	
}
/**
 * determine wether the pathname is supported file formats
 * @function
 * @param  {string} pathName
 * @returns {boolean} True if file is supported, otherwise false.
 */
Trans.prototype.isFileSupported = function(pathName) {
	if (typeof pathName !== 'string') return false;
	var ext = getFileExtension(pathName);
	if (sys.supportedExtension.includes(ext)) return true;
	return false;
}

/**
 * do some action depending on the file type
 * @function
 * @param  {string} file path to the file
 */
Trans.prototype.openFile = function(file) {
	if(this.isFileSupported(file) == false) return false;
	var ext = getFileExtension(file);
	if (typeof (this.fileLoader.handler[ext]) !== 'function') return false;
	if (this.fileListLoaded == false) {
		// load in this window
		ui.introWindowClose();
		this.fileLoader.handler[ext].apply(this, [file]);
	} else {
		// load on new window
		//var spawn = spawn || require('child_process').spawn;
		var thisSpawn = spawn(nw.process.execPath, [file], {
							detached :true
						});
	}
}

/**
 * Initialize the project
 * @function
 * @todo Implement this function
 */
Trans.prototype.initProject = function() {
	if (typeof this.project !== 'undefined') {
		console.log("project is already been initialized! skipping!");
		return false
	}	
	// this function is not done yet
}

/**
 * Close the current project
 * @function
 * 
 */
Trans.prototype.closeProject = function() {
	if (typeof this.project == 'undefined') {
		return false
	}
	if (typeof this.grid.destroy() == 'function') this.grid.destroy();
	this.unInitFileNav();
	this.project = {};
	this.init();
	ui.closeAllChildWindow();
	ui.ribbonMenu.clear();
	ui.clearActiveCellInfo();
	ui.clearPathInfo();
	ui.setWindowTitle("");
	trans.clearFooter();
	this.initTable();

}

/**
 * Generates new dictionary table
 * @function
 * @returns {object} references object (trans.project.references)
 */
Trans.prototype.generateNewDictionaryTable = function() {
	var thisID = "Common Reference";
	if (typeof this.project.files[thisID] !== 'undefined') return this.project.files[thisID];
	
	
	if (typeof this.project.references == 'object') {
		console.log("trans.project.reference is an object");
		for (var fileId in this.project.references) {
			this.project.files[fileId] = this.project.references[fileId];
		}
	} else {
		console.log("trans.project.reference is not an object");

		var templatePath 	= this.getTemplatePath()
		var templateObj 	= this.loadJSONSync(templatePath);
		console.log("template obj : ", templateObj);
		if (Boolean(templateObj) !== false) {
			this.project.references = templateObj.project.references;
			console.log("assigning reference : ", this.project.references);
			
		}

		this.mergeReference(trans);
		
		
	}
	return this.project.references;
	
}

/**
 * Initialize a new project
 * @function
 * @param  {object} options 
 * force
 * selectedFile {array}
 */
Trans.prototype.createProject = function(options) {
	console.log("running trans.createProject");
	if (this.isLoadingFileList) return false;
	if (this.gameFolder == "") return false;
	
	var trans 				= this;
	options 				= options||{};
	options.force 			= options.force||"";
	options.selectedFile 	= options.selectedFile||"";
	options.onAfterLoading 	= options.onAfterLoading||function(responseData, event) {};
	options.options 		= options.options||{};
	this.isLoadingFileList 	= true;
	
	ui.showLoading();
	
	var thisArgs = {
			gameFolder		:this.gameFolder,
			selectedFile	:options.selectedFile,
			gameEngine		:this.gameEngine,
			gameTitle		:this.gameTitle,
			projectId		:this.projectId,
			skipElement		:this.skipElement,
			indexOriginal	:0,
			indexTranslation:1,
			force			:options.force,
			rpgTransFormat	:trans.config.rpgTransFormat,
			options			:options.options
		}
	console.log("Sending this args to loadGameInfo.php : ", thisArgs);
	php.spawn("loadGameInfo.php", {
		args:thisArgs,
		onData: function(buffer) {
			ui.loadingProgress(t("加载中"), buffer, {consoleOnly:true, mode:'consoleOutput'});
		},
		onError:function(buffer) {
			ui.loadingProgress(t("加载中"), buffer, {consoleOnly:true, mode:'consoleOutput', classStr:'stderr'});
		},
		
		onDone : function(data) {
			console.log("onDone event defined from trans.js");
			if (common.isJSON(data)) { 
				trans.project = data;
				trans.currentFile = "";
				
				trans.gameTitle = data.gameTitle;
				trans.gameFolder = data.loc;
				trans.projectId = data.projectId;
				trans.gameEngine = data.gameEngine;
				trans.generateHeader();
				trans.sanitize();
				
				//trans.removeAllDuplicates();
				trans.dataPadding();
				sys.updateLastOpenedProject();
				trans.autoSave();
				//JSON.parse(data);
				console.log(data);
				ui.setStatusBar(1, trans.gameTitle);
				$(document).trigger("projectCreated", trans, data);
				if (typeof options.onAfterLoading == 'function') {
					options.onAfterLoading.call(trans, data, this);
				}
				trans.fileListLoaded = true;	
				trans.isLoadingFileList = false;
				ui.showCloseButton();
			} else {
				// try to find link from console response
				var loadedData = $("<div>"+data+"</div>");
				var initPath = loadedData.find("#initialDataPath").attr("data-path");
				console.log("found initPath : "+initPath);
				//var initData = loadedData.find("#initialData").text();
				//console.log(JSON.parse(initData));
				if (Boolean(initPath) == false) {
					ui.loadingProgress("错误！", "无法成功解析你的游戏！请阅读此处的文档：https://dreamsavior.net/?p=1311", 
					{consoleOnly:true, mode:'consoleOutput'});
					ui.showCloseButton();
					trans.fileListLoaded = false;	
					trans.isLoadingFileList = false;
					return;					
				}

				try {
					fs.readFile(initPath, function (err, rawData) {
						if (err) {
							console.log("error opening file : "+initPath);
							ui.loadingProgress("错误！", "打开文件时出错："+initPath, 
								{consoleOnly:true, mode:'consoleOutput'});
							ui.showCloseButton();
							trans.fileListLoaded = false;	
							trans.isLoadingFileList = false;							
							throw err;
						} else {
							var strData = rawData.toString();
							var data = {};
							try {
								data = JSON.parse(strData);
							} catch (err) {
								ui.loadingProgress(t("错误！"), t("处理初始化文件时出错：")+initPath+"\n"+err, 
									{consoleOnly:true, mode:'consoleOutput'});
								ui.showCloseButton();
								trans.isLoadingFileList = false;
								return false;	
							}
							
							if (Boolean(data['files']) == false) {
								ui.loadingProgress(t("错误！"), t("错误在以下位置的初始化文件中找不到文件列表：")+initPath, 
									{consoleOnly:true, mode:'consoleOutput'});
								ui.loadingProgress(t("错误！"), t("这意味着你的游戏没有被成功解析。请访问https://dreamsavior.net/?p=1311 寻找这个问题的可能解决方案。"), 
									{consoleOnly:true, mode:'consoleOutput'});
								ui.showCloseButton();
								trans.isLoadingFileList = false;
								return false;	
							}
							
							trans.project = data;
							trans.currentFile = "";
							
							trans.gameTitle = data.gameTitle;
							trans.gameFolder = data.loc;
							trans.projectId = data.projectId;
							trans.gameEngine = data.gameEngine;
							trans.generateHeader();
							trans.sanitize();
							
							//trans.removeAllDuplicates();
							
							trans.dataPadding();
							sys.updateLastOpenedProject();
							trans.autoSave();
							//JSON.parse(data);
							console.log(data);
							ui.setStatusBar(1, trans.gameTitle);
							
							ui.loadingProgress(t("结束"), t("全部完成！"), {consoleOnly:false, mode:'consoleOutput'});
							

							$(document).trigger("projectCreated", trans, data);
							if (typeof options.onAfterLoading == 'function') {
								options.onAfterLoading.call(trans, data, this);
							}
							trans.fileListLoaded = true;	
							trans.isLoadingFileList = false;
							ui.showCloseButton();

						}
					});		
				} catch (error)	{
					console.log("error opening file : "+initPath);
					ui.loadingProgress(t("错误！"), t("打开文件时出错：")+initPath, {consoleOnly:false, mode:'consoleOutput'});
					ui.loadingProgress(t("错误！"), error, {consoleOnly:true, mode:'consoleOutput'});
					ui.showCloseButton();
					trans.fileListLoaded = false;	
					trans.isLoadingFileList = false;
					
				}

				var $tmpPath = loadedData.find("#tmpPath");
				if ($tmpPath.length > 0) {
	
					ui.showOpenCacheButton($tmpPath.text());
					
					/*
					var confPath = confirm(t("Resource is extracted on :\r\n")+$tmpPath.text()+
						t("\r\nOpen temporary folder in explorer?"));
						
					if (confPath) {
						//var thisTmpPath = str_ireplace("\\", "\\\\", $tmpPath.text());
						//console.log("running command : \r\n"+'explorer "'+thisTmpPath+'"');
						require('child_process').exec('explorer "'+$tmpPath.text()+'"' , function (err, stdout, stderr) { console.log("Explorer opened") });
					}
					*/
				}
				
				
			}
			
		}
	});
}

Trans.prototype.procedureCreateProject =function(gamePath, options) {
	console.log("running trans.procedureCreateProject");
	console.log(arguments);
	if (typeof gamePath == 'undefined') return false;
	options 				= options||{};
	options.selectedFile 	= options.selectedFile||"";
	options.force 			= options.force||"";
	options.projectInfo 	= options.projectInfo||{
								id		:"",
								title	:""
							}
	options.options 		= options.options||{};
	options.gameEngine 		= options.gameEngine||"";
	
	//console.log(options);
	this.closeProject();
	
	this.projectId 	= options.projectInfo.id;
	this.gameTitle 	= options.projectInfo.title;
	this.gameFolder = gamePath;
	this.gameEngine = options.gameEngine;
	
	//console.log("=======================");
	//console.log("Running trans.initFileNav() with current trans : ");
	//console.log(trans);
	
	// close newProject dialog box if any
	ui.newProjectDialog.close();
	this.createProject({
		selectedFile:options.selectedFile,
		force:options.force,
		onAfterLoading:async function(rawData) {
			this.drawFileSelector();
			if (engines.hasHandler('onAfterCreateProject')) {
				await common.wait(100);
				await engines.handler('onAfterCreateProject').call(this, gamePath, options);
			}			
		},
		options:options.options
	});	
	
	
}

Trans.prototype.getRow = function(fileData, keyword) {
	// locate a row number of a key
	// returns row number
	if (typeof keyword !== 'string') return undefined;
	console.log("Get row", arguments);
	if (fileData.indexIsBuilt == false) {
		console.log("building index for the first time");
		this.buildIndexFromData(fileData);
	}
	fileData.indexIds = fileData.indexIds || {};
	
	console.log("getRow result is : ", fileData.indexIds[keyword]);
	return fileData.indexIds[keyword];
}

Trans.prototype.updateProject = function(jsonData, options) {
	/* update current trans with new jsonData
		jsonData must contains :
		jsonData.project.files
	*/
	if (typeof jsonData == 'string') jsonData = JSON.parse(jsonData);
 	options = options||{};
	options.onAfterLoading 	= options.onAfterLoading||function(type, responseData, event) {};
	options.onSuccess 		= options.onSuccess||function(responseData, event) {};
	options.onFailed 		= options.onFailed||function(responseData, event) {};
	options.filePath 		= options.filePath||"";	
	
	
	jsonData.project = jsonData.project || {};
	jsonData.project.files = jsonData.project.files || {};
	
	var projectCopy = this.getSaveData();
	var oldFiles 	= common.clone(projectCopy.project.files||{});
	console.log("Preserved current files", oldFiles);
	projectCopy.project.files = jsonData.project.files;
	
	
	
	for (file in jsonData.project.files) {
		var thisFile = projectCopy.project.files[file];
		if (!oldFiles[file]) continue;
		if (!oldFiles[file].data) continue;
		if (oldFiles[file].data.length < 1) continue;
		console.log("processing file", file);
		
		for (var rowId=0; rowId < thisFile.data.length; rowId++ ) {
			var key = thisFile.data[rowId][0];
			console.log("key is", key)
			var oldFileRow = this.getRow(oldFiles[file], key);
			if (typeof oldFileRow == 'undefined') continue;
			for (var x=1; x<oldFiles[file].data[oldFileRow].length; x++) {
				console.log("Assigning ", oldFiles[file].data[oldFileRow][x], "to col", x);
				thisFile.data[rowId][x] = oldFiles[file].data[oldFileRow][x];
			}				
		}
	}
	
	console.log("updatedProject", projectCopy);
	return projectCopy;
}

Trans.prototype.openFromTransObj = function(jsonData, options) {
	// open trans object from parsed jsonData or string
	if (typeof jsonData == 'string') jsonData = JSON.parse(jsonData);
	
 	options = options||{};
	options.onAfterLoading 	= options.onAfterLoading||function(type, responseData, event) {};
	options.onSuccess 		= options.onSuccess||function(responseData, event) {};
	options.onFailed 		= options.onFailed||function(responseData, event) {};
	options.filePath 		= options.filePath||"";
	options.isNew 			= options.isNew || false;
	
	if (options.isNew) {
		jsonData = this.initTransData(jsonData);
		console.log(jsonData);
	}
	
	this.currentFile = options.filePath;
	this.applySaveData(jsonData);
	this.sanitize();
	this.grid.render();
	sys.insertOpenedFileHistory();
	// apply config to $DV.config;
	try {
		$DV.config.sl = this.project.options.sl||"ja";
		$DV.config.tl = this.project.options.tl||"zh-CN";
	} catch (e) {
		$DV.config.sl = "ja";
		$DV.config.tl = "zh-CN";
	}			
	if (typeof options.onSuccess == 'function') options.onSuccess.call(this, jsonData);
	if (typeof options.onAfterLoading == 'function') options.onAfterLoading.call(this, "成功", jsonData);
	this.isOpeningFile = false;
	ui.hideBusyOverlay();
	if (jsonData.project.selectedId) {
		this.selectFile(jsonData.project.selectedId);
	} else {
		this.selectFile($(".fileList .data-selector").eq(0));
	}

}
/*
Trans.prototype.getSl = function() {
	if (!this.project) return;
	if (!this.project.options) return sys.config.default.sl;
	if (!this.project.options.sl) return sys.config.default.sl;
	return this.project.options.sl;
}

Trans.prototype.getTl = function() {
	if (!this.project) return;
	if (!this.project.options) return sys.config.default.tl;
	if (!this.project.options.tl) return sys.config.default.tl;
	return this.project.options.tl;	
}
*/

Trans.prototype.open = function(filePath, options) {
	var filePath = filePath||this.currentFile;
	if (filePath == "" || filePath == null || typeof filePath == 'undefined') return false;
	console.log("opening project : ", filePath);
	
	var trans 				= this;
	options 				= options||{};
	options.onAfterLoading 	= options.onAfterLoading||function(type, responseData, event) {};
	options.onSuccess 		= options.onSuccess||function(responseData, event) {};
	options.onFailed 		= options.onFailed||function(responseData, event) {};
	
	trans.isOpeningFile = true;
	
	ui.showBusyOverlay();
	fs.readFile(filePath, function (err, data) {
		if (err) {
			//throw err;
			console.log(err);
			alert(t("打开文件时出错（打开）：")+filePath+"\r\n"+err);
			if (typeof data != 'undefined') {
				data = data.toString();
				if (typeof options.onFailed =='function') options.onFailed.call(trans, data);
				if (typeof options.onAfterLoading =='function') options.onAfterLoading.call(trans, "错误", data);
			}
			ui.hideBusyOverlay();
		} else {
			data 				= data.toString();
			var jsonData 		= {};
			try {
				jsonData 		= JSON.parse(data);
			} catch (e) {
				console.warn("无法分析JSON数据");
				alert("无法分析JSON数据。\n.trans文件已损坏。");
				if (typeof options.onAfterLoading == 'function') options.onAfterLoading.call(trans, "失败", jsonData);
				trans.isOpeningFile = false;
				ui.hideBusyOverlay();	
				return;			
			}
			
			console.log(jsonData);
			trans.currentFile 	= filePath;
			trans.applySaveData(jsonData);
			trans.sanitize();
			trans.grid.render();
			sys.insertOpenedFileHistory();
			// apply config to $DV.config;
			try {
				$DV.config.sl = trans.project.options.sl||"ja";
				$DV.config.tl = trans.project.options.tl||"zh-CN";
			} catch (e) {
				$DV.config.sl = "ja";
				$DV.config.tl = "zh-CN";
			}			
			if (typeof options.onSuccess == 'function') options.onSuccess.call(trans, jsonData);
			if (typeof options.onAfterLoading == 'function') options.onAfterLoading.call(trans, "success", jsonData);
			trans.isOpeningFile = false;
			ui.hideBusyOverlay();
			if (jsonData.project.selectedId) {
				trans.selectFile(jsonData.project.selectedId);
			} else {
				trans.selectFile($(".fileList .data-selector").eq(0));
			}

			// open infobox
			trans.project.options = trans.project.options || {}
			console.log("displaying info ")
			if (Boolean(trans.project.options.info) && trans.project.options.displayInfo) {
				ui.showPopup("infobox_"+trans.project.projectId, trans.project.options.info, {
					title		: "Project's Info",
					allExternal	: true,
					HTMLcleanup	: true
					});
			}
			
			// eval whether has error on paths
			if (trans.isCacheError()) {
				ui.addIconOverlay($(".button-properties"), "attention")
				$(".button-properties").attr("title", "项目属性-暂存路径错误！")
			} else {
				ui.clearIconOverlay($(".button-properties"))
				$(".button-properties").attr("title", "项目属性");
			}
		}
	});
}

Trans.prototype.isCacheError = function() {
	trans.project.cache = trans.project.cache || {}
	if (trans.project.cache.cachePath) {
		if (common.isDir(trans.project.cache.cachePath) == false) {
			return true;
		}
	}
	
	return false;
}

Trans.prototype.getSl = function() {
	// get source language
	this.project.options 	= this.project.options || {}
	sys.config.default 		= sys.config.default || {};
	var sl 					= this.project.options.sl || sys.config.default.sl || $DV.config.sl;
	return sl;
}
Trans.prototype.getTl = function() {
	// get target language
	this.project.options 	= this.project.options || {}
	sys.config.default 		= sys.config.default || {};
	var tl 					= this.project.options.tl || sys.config.default.tl || $DV.config.tl;
	return tl;
}



//================================================================
//
// HANDLING SAVE & LOAD DATA
//
//================================================================
Trans.prototype.applyNewData = function(newData) {
	newData = newData||[[]];
	
	for (var row=0; row<newData.length; row++) {
		this.data[row] = newData[row];
	}
}

Trans.prototype.applyNewHeader = function(newHeader) {
	newHeader = newHeader||[];
	
	for (var header=0; header<newHeader.length; header++) {
		this.colHeaders[header] = newHeader[header];
	}
}

Trans.prototype.generateId = function() {
	return common.makeid(10);
}

Trans.prototype.initTransData = function(transData) {
	// initialize new trans data created by other application
	transData 		= transData||{};
	var template 	= JSON.parse(fs.readFileSync("data/template.trans"));
	var result 		= common.mergeDeep(template, transData);
	
	result.project 				= result.project || {}
	result.project.projectId 	= result.project.projectId || this.generateId(10);
	result.project.buildOn 		= result.project.buildOn || common.formatDate();
	result.project.editorVersion = nw.App.manifest.version;
	result.project.editorName 	= "Translator++";
	
	return result;
}

Trans.prototype.createFileData = function(fullPath, defaultData) {
	defaultData = defaultData || {}
	fullPath = fullPath.replace(/\\/g, "/");
	
	defaultData.basename 		= defaultData.basename||nwPath.basename(fullPath),
	defaultData.filename 		= defaultData.filename||nwPath.basename(fullPath),
	defaultData.path 			= defaultData.path||fullPath,
	defaultData.relPath 		= defaultData.relPath||fullPath,
	defaultData.data			= defaultData.data||[[null]],
	defaultData.originalFormat 	= defaultData.originalFormat||"Autogenerated TRANS obj",
	defaultData.type			= defaultData.type||""
	defaultData.context			= defaultData.context||[]
	defaultData.tags			= defaultData.tags||[]
	
	if (typeof defaultData.extension == 'undefined') defaultData.extension = nwPath.extname(fullPath);
	if (typeof defaultData.dirname == 'undefined') 	defaultData.dirname = nwPath.dirname(fullPath);
	
	return defaultData;
}

Trans.prototype.validateTransData = function(transData) {
	// standarized transData
	
	/*
		adapt from two dimensional array
	*/
	var result = {};
	if (Array.isArray(transData)) {
		console.log("Case 1 - transData is array");
		var templateObj 	= this.loadJSONSync(this.getTemplatePath());
		var objName 		= "/main";
		templateObj.project.files[objName] = this.createFileData(objName, {data:transData});
		result = templateObj;
		return result;
	}

	/*
		object is in file structure
	*/	
	if (Boolean(transData.project)==false && Boolean(transData.files)==false && Array.isArray(transData.data)) {
		console.log("Case 1 - transData is file structured");
		var templateObj 	= this.loadJSONSync(this.getTemplatePath());
		var objName 		= transData.path||"/main";
		templateObj.project.files[objName] = this.createFileData(objName, {data:transData.data});
		result = templateObj;
		return result;
	}

	if ( Boolean(transData.project)==false && Boolean(transData.files)==true) {
		result.project = transData;
	} else {
		result = transData;
	}

	result.project.gameTitle 		= result.project.gameTitle||t("无标题项目");
	result.project.gameEngine 		= result.project.gameEngine||"";
	result.project.projectId 		= result.project.projectId||"";
	result.project.buildOn			= result.project.buildOn || common.formatDate();
	result.project.files			= result.project.files || {};
	
	for (var id in result.project.files) {
		result.project.files[id] = this.createFileData(id, result.project.files[id])
	}
		
	return result;
}

/**
 * Normalize loaded column header
 * Apply default value & unchangeable value into trans.columns
 * Should be called each time trans files are loaded
 */
Trans.prototype.normalizeHeader = function() {
	for (var i=0; i<this.columns.length; i++) {
		if (i == this.keyColumn) {
			this.columns[i].validator 		= this.validateKey;
		}

		//this.columns[i].trimWhitespace 		= false;	
		this.columns[i].wordWrap			= true;	
	}
}

Trans.prototype.applySaveData = function(saveData) {
	console.log("entering trans.applySaveData");
	console.log(saveData);
	saveData 			= saveData||{};
	saveData 			= this.validateTransData(saveData);
	this.data 			= saveData.data||[[null]];
	//trans.data 		= [[]];
	this.columns 		= saveData.columns||this.default.columns||[];
	this.normalizeHeader();
	this.colHeaders 	= saveData.colHeaders||this.default.colHeaders||[];
	this.project 		= saveData.project||{};
	//this.indexIds 		= saveData.indexIds||{};
	
	// FILLING ROOT VARIABLE based on game project
	this.gameTitle 		= saveData.project.gameTitle||"";
	this.gameEngine 	= saveData.project.gameEngine||"";
	this.projectId 		= saveData.project.projectId||"";
	this.gameFolder 	= saveData.project.loc||[];

	// detecting fileList
	if (saveData.fileListLoaded == false) {
		try {
			if (typeof saveData.project.files !== "undefined") saveData.fileListLoaded = true;
		}
		catch(err) {
			saveData.fileListLoaded = false;
		}
	}	
	this.resetIndex();
	this.fileListLoaded = saveData.fileListLoaded||false;	

	this.initFileNav();
	this.refreshGrid();
	ui.setWindowTitle();
	ui.setStatusBar(1, this.gameTitle);	
	//engines.handler('onLoadTrans').apply(this, arguments);
	return this;
}

Trans.prototype.getSaveData = function(options) {
	options = options||{};
	options.filter = options.filter || [];
	
	var projectClone = JSON.parse(JSON.stringify(this.project))||{};
	
	if (options.filter.length > 0) {
		console.log("filtering saved object", options);
		if (typeof this.project !== 'undefined') {
			if (typeof this.project.files !== 'undefined') {
				projectClone.files = {};
				for (var i=0; i<options.filter.length; i++) {
					var thisId = options.filter[i];
					console.log("testing "+thisId, this.project.files[thisId], this.project.files);
					if (typeof this.project.files[thisId] == 'undefined') continue;
					console.log("exist, assigning "+thisId);
					projectClone.files[thisId] = JSON.parse(JSON.stringify(this.project.files[thisId]));
				}
			}
		}
	}
	
	var saveData = {};
	//saveData.data 		= this.data||[];
	saveData.data 			= [[null]];
	saveData.columns 		= this.columns||[];
	saveData.colHeaders 	= this.colHeaders||[];
	saveData.project 		= projectClone;
	//saveData.indexIds 		= this.indexIds;
	saveData.fileListLoaded = this.fileListLoaded;
	
	
	// get column width
	for (var i=0; i<this.grid.getColHeader().length; i++) {
		if (!saveData.columns[i]) continue;
		saveData.columns[i].width = this.grid.getColWidth(i);
	}	
	
	// strip out reference data
	for (var fileId in saveData.project.files) {
		if (saveData.project.files[fileId].type == 'reference') {
			saveData.project.references 		= saveData.project.references||{};
			saveData.project.references[fileId] = JSON.parse(JSON.stringify(saveData.project.files[fileId]));
			delete saveData.project.files[fileId];
		}
	}
	
	return saveData;
}

Trans.prototype.save = async function(targetFile, options) {
	var targetFile = targetFile||this.currentFile;
	if (targetFile == "" || targetFile == null || typeof targetFile == 'undefined') {
		$("#saveAs").trigger("click");
		return false;
	}
	
	var trans 				= this;
	options 				= options||{};
	options.initiator 		= options.initiator||"user";
	options.filter 			= options.filter || [];
	options.onAfterLoading 	= options.onAfterLoading||function(responseData, event) {};
	options.onSuccess 		= options.onSuccess||function(responseData, event) {};
	options.onFailed 		= options.onFailed||function(responseData, event) {};
	
	
	// data to save
	console.log("Saving data to : "+targetFile);
	var saveData = trans.getSaveData(options);
	console.log(saveData);
	//console.log(JSON.stringify(saveData));
	
	trans.isSavingFile = true;
	$(".button-save img").addClass("rotating");

	return new Promise((resolve, reject)=> {
		fs.writeFile(targetFile, JSON.stringify(saveData), function (err) {
			if (err) {
				if (typeof options.onFailed =='function') options.onFailed.call(trans, saveData, targetFile);
				$(".button-save img").removeClass("rotating"); 
				console.warn("未能保存到：", targetFile, err );
			} else {
				console.log(targetFile+' successfully saved!');
				sys.insertOpenedFileHistory(targetFile,saveData.project.projectId,saveData.project.gameTitle, options.initiator);
				if (typeof options.onSuccess == 'function') options.onSuccess.call(trans, saveData, targetFile);
				resolve(targetFile);
			}
			ui.setWindowTitle();
			options.onAfterLoading.call(trans, saveData, targetFile);
			
			setTimeout(function(){ 
				$(".button-save img").removeClass("rotating"); 
			}, 1000);
			
			trans.isSavingFile = false;
		});	
	})
	
	
}	

Trans.prototype.generateCachePath = function() {
	this.project.cache = this.project.cache || {}
	this.project.cache.cacheID 		= this.project.cache.cacheID||this.project.projectId;
	if (!this.project.cache.cacheID) this.project.cache.cacheID = this.project.projectId = common.makeid(10)
		console.log("Joining", sys.config.stagingPath, this.project.cache.cacheID);
	this.project.cache.cachePath 	= this.project.cache.cachePath || nwPath.join(sys.config.stagingPath, this.project.cache.cacheID);
	
	try {
		fs.mkdirSync(this.project.cache.cachePath, {recursive:true})
	} catch (e) {
		console.warn(e);
	}

}

Trans.prototype.autoSave = async function(options) {
	options = options||{};
	
	if (typeof this.project == 'undefined') {
		options.onSuccess = options.onSuccess || function(){};
		options.onSuccess.call(this);
		return false;
	}
	try {
		if (!this.project.cache.cachePath) {
			this.generateCachePath();
		} else {
			if (!common.isDir(this.project.cache.cachePath)) this.generateCachePath();
		}
	} catch (e) {
		console.warn(e)
	}

	
	options.initiator = "auto";
	await this.save(this.project.cache.cachePath+"\\autosave.json", options);	
	return true;
}

Trans.prototype.buildIndexFromData = function(fileData, force) {
	// fileData is file object :
	// ex. trans.project.files['main']
	// return processed fileData on success
	// transmutable function
	var key = 0;
	if (typeof fileData !== 'object') return console.warn("fileData不是一个对象");
	if (Array.isArray(fileData.data) == false) return console.warn("fileData.data 不是有效的数组");
	if (fileData.indexIsBuilt && !force) return fileData;
	fileData.data = fileData.data || [];
	
	fileData.indexIds = fileData.indexIds || {}
	for (var row = 0; row<fileData.data.length; i++) {
		var thisRow = fileData.data[row];
		if (!Boolean(thisRow[key])) continue;
		fileData[thisRow[key]] = key;
	}
	fileData.indexIsBuilt= true
	return fileData;
	
}

Trans.prototype.mergeTrans = function(externalTrans, targetTrans, options) {
	// merge externalTrans into targetTrans
	// bydefault targetTrans = current project;
	var key = 0;
	
	targetTrans = targetTrans || this;
	targetTrans.project = targetTrans.project || {};
	targetTrans.project.files = targetTrans.project.files || {};
	
	externalTrans = externalTrans || {};
	externalTrans.project = externalTrans.project || {}
	externalTrans.project.files = externalTrans.project.files || {};
	
	options = options || {};
	options.overwrite 	= options.overwrite || false;
	options.targetPair 	= options.targetPair||{};
	options.files 		= options.files || [];
	options.all 		= options.all || false; // fetch all?
	
	if (options.all) options.targetPair =  externalTrans.project.files; // if all, doesn't use targetPair
	targetTrans = this.sanitize(targetTrans);
	
	var targetIsSelf = false;
	if (targetTrans instanceof Trans) targetIsSelf = true;
	
	
	console.log("running mergeTrans with args : ", arguments);
	//return;
	for (var id in options.targetPair) {
		var sourceFile = externalTrans.project.files[id];
		var targetFile = targetTrans.project.files[id];
		if (!targetFile) {
			// copy entire sourcefile into targetFile
			targetTrans.project.files[id] = common.clone(sourceFile);
			if (targetIsSelf) this.addFileItem(id, targetTrans.project.files[id]);
			continue;
		}
		console.log("merging data", id);
		// the real deal, merge the data
		if (Array.isArray(sourceFile.data)==false) continue;
		if (sourceFile.data.length == 0) continue;
		this.buildIndexFromData(targetFile);

		targetFile.context = targetFile.context||[];
		sourceFile.context = sourceFile.context||[];
		
		for (var row=0; row<sourceFile.data.length; row++) {
			var thisSourceRow = sourceFile.data[row];
			if (Boolean(thisSourceRow[key])==false) continue;
			
			var index = targetFile.indexIds[thisSourceRow[key]];
			if (typeof index == 'undefined') {
				index = targetFile.data.length;
			}
			targetFile.data[index] 		= common.clone(thisSourceRow);
			targetFile.context[index] 	= common.clone(sourceFile.context[row]);
			
		}
	}
	
	if (targetIsSelf)  {
		this.generateHeader(targetTrans);
		this.evalTranslationProgress();
		ui.fileList.reIndex();
		ui.initFileSelectorDragSelect();
	}
	
	this.refreshGrid();
	
	return targetTrans;
}



Trans.prototype.loadJSONSync = function(filePath, options) {
	if (filePath == "" || filePath == null || typeof filePath == 'undefined') return false;
	
	options = options||{};
	options.onAfterLoading = options.onAfterLoading||function(responseData, event) {};
	options.onSuccess = options.onSuccess||function(responseData, event) {};
	options.onFailed = options.onFailed||function(responseData, event) {};
	
	var fs = require('fs');
    var content = fs.readFileSync(filePath);	
	var resultStr = content.toString();
	var result = false;
	try {
		result = JSON.parse(resultStr);
		return result;
	} catch(e) {
		return result;
	}
	return result;
}

Trans.prototype.loadJSON = function(filePath, options) {
	// open JSON & Parse it
	// for general purposes
	var trans = this;
	var filePath = filePath;
	if (filePath == "" || filePath == null || typeof filePath == 'undefined') return false;
	
	options = options||{};
	options.onAfterLoading = options.onAfterLoading||function(responseData, event) {};
	options.onSuccess = options.onSuccess||function(responseData, event) {};
	options.onFailed = options.onFailed||function(responseData, event) {};
	
	this.isOpeningFile = true;
	
	ui.showBusyOverlay();
	fs.readFile(filePath, function (err, data) {
		if (err) {
			console.log("error opening file (loadJSON): "+filePath);
			data = data.toString();
			if (typeof options.onFailed =='function') options.onFailed.call(trans, data);
			ui.hideBusyOverlay();

			throw err;

		} else {
			data = data.toString();
			var jsonData = JSON.parse(data);
			console.log(jsonData);
			
			if (typeof options.onSuccess == 'function') options.onSuccess.call(trans, jsonData);
			trans.isOpeningFile = false;
			ui.hideBusyOverlay();
			
		}
	});
}


Trans.prototype.importFromFile = function(file, options) {
	// import from file and replace or create object
	// options.targetPair = {
	//		sourceKey : targetKey
	// }
	// or 
	// options.targetPair = {
	//		sourceKey : true  // same with sourceKey
	// }
	// 
	// if targetKey is not exist, then create one.

	options 			= options||{};
	options.overwrite 	= options.overwrite || false;
	options.targetPair 	= options.targetPair||{};
	options.files 		= options.files || [];
	options.mergeData	= options.mergeData || false;
	//if (Array.isArray(file) == false) file = [file];
	var trans = this;
	
	trans.loadJSON(file, {
		onSuccess : function(data) {
			data = trans.validateTransData(data)
			
			if (options.mergeData) {
				trans.mergeTrans(data, trans, options);
				return;
			}
			
			
			for (sourceKey in options.targetPair) {
				if (typeof options.targetPair[sourceKey] !== 'string') {
					options.targetPair[sourceKey] = sourceKey;
				}
				
				try {
					//if (typeof trans.project.files[options.targetPair[sourceKey]] == 'undefined') continue;
					if (data.project.references[sourceKey] !== 'undefined') {
						trans.project.files[options.targetPair[sourceKey]] = data.project.references[sourceKey];
					}
					
					if (typeof data.project.files[sourceKey] == 'undefined') continue;
					trans.project.files[options.targetPair[sourceKey]] = data.project.files[sourceKey];
				
					console.log(t("创建文件列表"), options.targetPair[sourceKey], trans.project.files[options.targetPair[sourceKey]]);
					trans.addFileItem(options.targetPair[sourceKey], trans.project.files[options.targetPair[sourceKey]]);
					
				} catch (e) {
					console.log(e);
					continue;
				}
				
			}
			ui.initFileSelectorDragSelect();
			trans.evalTranslationProgress();
			ui.fileList.reIndex();
			trans.refreshGrid();
			
		}
	});
}


Trans.prototype.selectCell = function(row, column) {
	return this.grid.selectCell(row, column);
}


//================================================================
// 						NEW TRANS INSTANCE
//================================================================
var trans = new Trans()

// backup current settings for close / new project actions
//var transTemplate = JSON.parse(JSON.stringify(trans));

trans.fileLoader = new FileLoader();
trans.fileLoader.add("json", function(path) {
	trans.open(path);
})
trans.fileLoader.add("trans", function(path) {
	trans.open(path);
})
trans.fileLoader.add("tpp", function(path) {
	trans.importTpp(openedFile);
})




















trans.exportTPP = function(file, options) {
	// export translation to TPP
	if (typeof file=="undefined") return false;
	
	options = options||{};
	options.onDone = options.onDone||function() {};
	
	var autofillFiles = [];
	var checkbox = $(".fileList .data-selector .fileCheckbox:checked");
	for (var i=0; i<checkbox.length; i++) {
		autofillFiles.push(checkbox.eq(i).attr("value"));
	}
	options.files = options.files||autofillFiles||[];

	trans.autoSave({
		onSuccess:function() {
			ui.showLoading();
			php.spawn("saveTpp.php", {
				args:{
					path:file,
					password:options.password,
					gameFolder:trans.gameFolder,
					gameTitle:trans.gameTitle,
					projectId:trans.projectId,
					gameEngine:trans.gameEngine,
					files:options.files,
					exportMode:options.mode,
					rpgTransFormat:trans.config.rpgTransFormat
				},
				onData:function(buffer) {
					ui.loadingProgress(t("加载中"), buffer, {consoleOnly:true, mode:'consoleOutput'});
					
				},
				onError:function(buffer) {
					ui.loadingProgress(t("加载中"), buffer, {consoleOnly:true, mode:'consoleOutput', classStr:'stderr'});
					
				},
				onDone: function(data) {
					//console.log(data); 
					console.log("done")
					//ui.hideLoading(true);
					ui.loadingProgress(t("完成了"), t("所有过程都完成了！"), {consoleOnly:false, mode:'consoleOutput'});
					
					ui.showCloseButton();
					ui.LoadingAddButton(t("开放资源管理器"), function() {
						common.openExplorer(file);
					});
					options.onDone.call(trans, data);
				}
			})
			
		}
	});
	
}

trans.importTpp = function(file, options) {
	if (typeof file=="undefined") return false;
	
	options = options||{};
	options.onDone = options.onDone||function() {};
	
	var doLoadTppToStage = function() {
		ui.showLoading();
		php.spawn("loadTpp.php", {
			args:{
				path:file,
				password:options.password
			},
			onData:function(buffer) {
				ui.loadingProgress(t("加载中"), buffer, {consoleOnly:true, mode:'consoleOutput'});
				
			},
			onError:function(buffer) {
				ui.loadingProgress(t("加载中"), buffer, {consoleOnly:true, mode:'consoleOutput', classStr:'stderr'});
				
			},
			onDone: function(data) {
				//console.log(data); 
				console.log("done")
				//ui.hideLoading(true);
				var saveFile = $(".console").find("output.cachepath").text();
				saveFile = nwPath.join(saveFile,"autosave.json");
				console.log("new cache path : ", saveFile);
				ui.loadingProgress(t("加载中"), t("打开文件！"), {consoleOnly:false, mode:'consoleOutput'});
				
				trans.open(saveFile, {
					onSuccess: function() {
						// writing new cache path
						trans.project.cache = trans.project.cache || {}
						trans.project.cache.cachePath = nwPath.dirname(saveFile);
						
						ui.loadingProgress(t("加载中"), t("分配新的暂存路径："+trans.project.cache.cachePath), {consoleOnly:false, mode:'consoleOutput'});
						
						ui.loadingProgress(t("加载中"), t("成功！"), {consoleOnly:false, mode:'consoleOutput'});
						ui.loadingProgress(t("完成了"), t("所有过程都完成了！"), {consoleOnly:false, mode:'consoleOutput'});
						ui.showCloseButton();
						options.onDone.call(trans, data);
						
					
					},
					onFailed: function() {
						ui.loadingProgress(t("加载中"), t("失败！"), {consoleOnly:false, mode:'consoleOutput'});
						ui.loadingProgress(t("完成了"), t("所有过程都完成了！"), {consoleOnly:false, mode:'consoleOutput'});
						ui.showCloseButton();
						options.onDone.call(trans, data);					
					}
				});
				

			}
		});		
	}
	trans.closeProject();
	trans.autoSave({
		onSuccess:function() {
			doLoadTppToStage();	
		}
	});		
}

trans.export = async function(file, options) {
	// export translation
	if (typeof file=="undefined") return false;
	
	options = options||{};
	options.options = options.options||{};
	
	/*
	Export mode : dir, zip, RPGMakerTrans, csv
	options.options blackList : { // avoid processing this tag
		tags: ["red", "yello"]
	}
	*/


	// DEBUG
	/*
	options.options = {
		filterTag:["red"],
		filterTagMode: "blacklist"
	}
	*/
	//return console.log("Exporting project", arguments);
	options.mode = options.mode||"dir";
	options.onDone = options.onDone||function() {};
	options.dataPath = options.dataPath || ""; // location of data path (data folder). Default is using cache
	options.transPath = options.transPath || ""; // location of .trans path to process. Default is using autosave on cache folder
	options.options.filterTag = options.options.filterTag|| options.filterTag ||[];
	options.options.filterTagMode = options.options.filterTagMode||options.filterTagMode||""; // whitelist or blacklist
	
	console.log("exporting project", arguments);
	
	var autofillFiles = [];
	var checkbox = $(".fileList .data-selector .fileCheckbox:checked");
	for (var i=0; i<checkbox.length; i++) {
		autofillFiles.push(checkbox.eq(i).attr("value"));
	}
	options.files = options.files||autofillFiles||[];

	// custom export handler
	if (typeof engines[trans.project.gameEngine] !== 'undefined') {
		var thisEngine = trans.project.gameEngine;
		if (typeof engines[trans.project.gameEngine].exportHandler == 'function') {
			var halt = await engines[trans.project.gameEngine].exportHandler.apply(this, arguments);
			console.log("Is process halt?", halt);
			if (halt) return;
		}	
	}

	trans.autoSave({
		onSuccess:function() {
			ui.showLoading();
			php.spawn("export.php", {
				args:{
					path:file,
					gameFolder:trans.gameFolder,
					gameTitle:trans.gameTitle,
					projectId:trans.projectId,
					gameEngine:trans.gameEngine,
					files:options.files,
					exportMode:options.mode,
					options:options.options,
					rpgTransFormat:trans.config.rpgTransFormat,
					dataPath:options.dataPath,
					transPath:options.transPath
				},
				onData:function(buffer) {
					ui.loadingProgress(t("加载中"), buffer, {consoleOnly:true, mode:'consoleOutput'});
					
				},
				onError:function(buffer) {
					ui.loadingProgress(t("加载中"), buffer, {consoleOnly:true, mode:'consoleOutput', classStr:'stderr'});
					
				},
				onDone: function(data) {
					//console.log(data); 
					console.log("done")
					//ui.hideLoading(true);
					ui.loadingProgress(t("完成了"), t("所有过程都完成了！"), {consoleOnly:false, mode:'consoleOutput'});
					
					ui.showCloseButton();
					options.onDone.call(trans, data);
				}
			})
			
		}
	});
	
}

trans.importSheet = function(paths, columns, options) {
	// import sheets from a folder or file
	columns = columns||1; // target Column
	options = options||{};
	options.sourceColumn = options.sourceColumn||"auto";
	options.overwrite = options.overwrite||false;
	options.files = options.files||trans.getCheckedFiles()||[];
	options.sourceKeyColumn = options.sourceKeyColumn||0;
	options.keyColumn = options.keyColumn||0;
	options.newLine = options.newLine||undefined;
	options.stripCarriageReturn = options.stripCarriageReturn||false;
	options.ignoreNewLine = true; // let's set to true;	
	console.log("trans.importSheet");
	console.log(arguments);
	//return console.log("halted");
	
	if (Array.isArray(paths) == false) paths=[paths];
	
	ui.showLoading();

	ui.loadingProgress(0, t("收集路径"), {consoleOnly:true, mode:'consoleOutput'});

	
	var allPaths = [];
	
	for (var i=0; i<paths.length; i++) {
		var path = paths[i];
		if (common.isExist(path) == false) {
			ui.loadingProgress(0, t("路径：")+path+t("'根本不存在"), {consoleOnly:true, mode:'consoleOutput'});
			console.log("Error, path not exist"); 
			continue;
		}
		
		if (common.isDir(path)) {
			var dirTree = common.dirContentSync(path);
			allPaths = allPaths.concat(dirTree);
		} else {
			allPaths.push(path);
		}
	}
	ui.loadingProgress(0, allPaths.length+t("已收集文件！"), {consoleOnly:true, mode:'consoleOutput'});


	ui.loadingProgress(0, t("开始导入数据！"), {consoleOnly:true, mode:'consoleOutput'});
	
	var processFile = function(filePath) {
		filePath = filePath||path;
		php.spawnSync("import.php", {
			args:{
				//'path':'F:\\test\\export',
				'path':filePath,
				output:null,
				mergeSheet:true,
				prettyPrint:true
			},
			onDone : function(data) {
				console.log("output data :");
				console.log(data);
				trans.translateFromArray(data, columns, options);				
			}
		});		
		
	}
	
	for (var i=0; i<allPaths.length; i++) {
		var thisFile = allPaths[i];
		ui.loadingProgress(Math.round(i/allPaths.length*100), t("导入：")+thisFile, {consoleOnly:true, mode:'consoleOutput'});
		processFile(thisFile);
		ui.loadingProgress(Math.round((i+1)/allPaths.length*100), t("结束"), {consoleOnly:true, mode:'consoleOutput'});		
	}
	
	ui.loadingProgress(t("结束"), t("全部完成！"), {consoleOnly:true, mode:'consoleOutput'});
	ui.showCloseButton();
	trans.refreshGrid();
	trans.evalTranslationProgress();
	
}


trans.importRPGMTrans = function(paths, columns, options) {
	// Import translation from RPGMTransPatch
	columns = columns||1; // target Column
	options = options||{};
	options.sourceColumn = options.sourceColumn||"auto";
	options.overwrite = options.overwrite||false;
	options.files = options.files||trans.getCheckedFiles()||[];
	options.sourceKeyColumn = options.sourceKeyColumn||0;
	options.keyColumn = options.keyColumn||0;
	options.newLine = options.newLine||undefined;
	options.stripCarriageReturn = options.stripCarriageReturn||false;
	options.ignoreNewLine = true; // let's set to true;	
	console.log("trans.importRPGMTrans");
	console.log(arguments);
	//return console.log("halted");
	
	if (Array.isArray(paths) == false) paths=[paths];
	
	ui.showLoading();

	ui.loadingProgress(0, t("收集路径"), {consoleOnly:true, mode:'consoleOutput'});

	
	var allPaths = [];
	for (var i=0; i<paths.length; i++) {
		var path = paths[i];
		if (common.isExist(path) == false) {
			ui.loadingProgress(0, t("路径：'")+path+t("'根本不存在"), {consoleOnly:true, mode:'consoleOutput'});
			console.log("Error, path not exist"); 
			continue;
		}
		
		if (common.isDir(path)) {
			var dirTree = common.dirContentSync(path);
			allPaths = allPaths.concat(dirTree);
		} else {
			allPaths.push(path);
		}
	}
	ui.loadingProgress(0, allPaths.length+t("已收集文件！"), {consoleOnly:true, mode:'consoleOutput'});


	ui.loadingProgress(0, t("开始导入数据！"), {consoleOnly:true, mode:'consoleOutput'});

	
	var processFile = function(filePath) {
		filePath = filePath||path;
		php.spawnSync("parseTrans.php", {
			args:{
				'path':filePath,
				prettyPrint:true
			},
			onDone : function(data) {
				console.log("output data :");
				console.log(data);
				if (Array.isArray(data.data)) {
					trans.translateFromArray(data.data, columns, options);			
				}				
			}
		});		
		
	}
	
	for (var i=0; i<allPaths.length; i++) {
		var thisFile = allPaths[i];
		ui.loadingProgress(Math.round(i/allPaths.length*100), t("导入：")+thisFile, {consoleOnly:true, mode:'consoleOutput'});
		processFile(thisFile);
		ui.loadingProgress(Math.round((i+1)/allPaths.length*100), t("结束"), {consoleOnly:true, mode:'consoleOutput'});		
	}
	
	ui.loadingProgress(t("结束"), t("全部完成！"), {consoleOnly:true, mode:'consoleOutput'});
	ui.showCloseButton();
	trans.refreshGrid();
	trans.evalTranslationProgress();	
}

// ===============================================================
// STATUS BAR
//================================================================

trans.clearFooter = function() {
	$(".footer .footer1 span").html("")
	$(".footer .footer2 span").html("")
	$(".footer .footer3 span").html("")
	$(".footer .footer4 span").html("")
	$(".footer .footer5 span").html("")
}

trans.setStatusBarContext = function(row) {
	if (typeof row== 'undefined') {
		if (Array.isArray(trans.grid.getSelected())) row = trans.grid.getSelected()[0][0];
	}
	
	//if (typeof row == 'undefined') return false;
	//if (typeof trans.project == 'undefined') return false;
	//console.log(trans.project.files[trans.getSelectedId()].context[row]);

	var currentId = trans.getSelectedId();
	try {
		if (trans.project.files[currentId].originalFormat == '> ANTI TES PATCH FILE VERSION 0.2' && this.project.parser !== "rmrgss") {
			//$(".footer .footer1>span").html(currentId+"/"+trans.buildContextFromParameter(trans.project.files[currentId].parameters[row]));
			$(".footer .footer1>span").html(trans.buildContextFromParameter(trans.project.files[currentId].parameters[row]));
		} else {
			//$(".footer .footer1>span").html(currentId+"/"+trans.project.files[currentId].context[row]);
			$(".footer .footer1>span").html(trans.project.files[currentId].context[row].join("; "));
		}
		
		$(".footer .footer1>span").addClass("icon-th-2")
	}
	catch(err) {
		$(".footer .footer1>span").html("");
		$(".footer .footer1>span").removeClass("icon-th-2")
		
	}
}

trans.setStatusBarNumData = function() {
	if (typeof trans.project == 'undefined') return false;
	try {
		$(".footer .footer3 span").html("行："+trans.project.files[trans.getSelectedId()].data.length);
	}
	catch(err) {
		$(".footer .footer3 span").html("");
	}
}

trans.setStatusBarEngine= function() {
	if (typeof trans.project == 'undefined') return false;
	try {
		$(".footer .footer4 span").html(trans.project.gameEngine);
	}
	catch(err) {
		$(".footer .footer4 span").html("");
	}
}

trans.setTrayIcon = function(type) {
	// type : notice, warning, notice, translatorPlusPlus
	type = type || "translatorPlusPlus";
		var $icon = $('<i class="icon trayIcon"></i>');
		$icon.addClass(type);
		$(".footer .footer5 span").html($icon);
}


//================================================================
//
// EDITOR SECTION PART
//
//================================================================
trans.goToNewKey = function() {
	if (Array.isArray(this.data) == false) return false;
	this.grid.selectCell(this.data.length-1,0);

	//if ($(document.activeElement).is("#currentCellText"));
	
}

trans.clearEditor = function() {
	$cellText = $("#currentCellText");
	$cellText.val("");
	$cellText.prop("readonly", true);
	$cellText.data("column", null);
	$cellText.data("row", null);
	return true;
}

trans.clearCellInfo = function() {
	$cellInfo = $("#currentCoordinate");
	$cellInfo.val("");
	return true;
}

trans.setCellInfo = function(row, column) {
	$cellInfo = $("#currentCoordinate");
	drawedRow = row+1;
	drawedCol = column+1;
	$cellInfo.val(drawedRow+","+drawedCol);
	trans.lastSelectedCell = [row, column];
}

trans.connectData = function() {
	// connect this.data to trans.project.files[trans.getSelectedId()].data
	if (!this.getSelectedId()) return console.warn("无法用所选id连接数据");
	if (!this.project.files[this.getSelectedId()].data) return console.warn("无法用所选id连接数据");
	this.project.files[this.getSelectedId()].data = trans.data;
}

trans.isLastRow = function(row) {
	//trans.data = trans.data || [];
	
	if (Boolean(trans.data) == false) {
		trans.data = [];
		trans.connectData();
	}
	
	row = row || 0;
	if (row == trans.data.length-1) return true;
	return false;
}

trans.doAfterSelection = function(row, column, row2, column2) {
	$editor = $("#currentCellText");
	
	//$editor.val(this.getValue());
	//$editor.val(trans.grid.getCellMeta(row,column).instance.getValue());
	$editor.val(trans.data[row][column]);
	$editor.prop("readonly", false);
	
	var isLastRow = trans.isLastRow(row)
	if (column == 0) {
		if ( isLastRow == false) {
			$editor.prop("readonly", true);
		}
	}
	$editor.data("column", column);
	$editor.data("row", row);
	trans.setCellInfo(row, column);
	trans.setStatusBarContext(row);
	
	trans.translateSelectedRow(row);
	ui.generateBackgroundNumber($editor);
	if (typeof romaji !== 'undefined') {
		if (trans.config.loadRomaji == false ) return true;
		romaji.resolve(trans.data[row][0], $("#currentRomaji"));
	}

	/**
	 * Trigger event right after a cell(s) is selected
	 * @event Document#onAfterSelectCell
	 * @param  {} row
	 * @param  {} column
	 * @param  {} row2
	 * @param  {} column2
	 * @param  {} isLastRow
	 */
	$(document).trigger("onAfterSelectCell", 
		{
			fromRow:row, fromCol:column, toRow:row2, toCol:column2, isLastRow:isLastRow
		}
	);
}


//================================================================
//
// HANDLING FILE NAVIGATION
//
//================================================================
trans.resetCurentCellEditor = function() {
	var $currentCellText = $("#currentCellText");
	$currentCellText.val("");
	$currentCellText.data("row", 0)
	$currentCellText.data("column", 0)
	trans.setCellInfo(0, 0);
	trans.setStatusBarContext(0);	
	$("#currentRomaji").text("");	
}

trans.createFile = function(filename, dirname, options) {
	// Create a new file
	// register it into the left panel
	options = options || {};
	options.originalFormat 	= options.originalFormat || ""
	options.type 			= options.type || null
	window.isValid = window.isValid||require('is-valid-path');	
	dirname = dirname || "/"
	if (!isValid(filename)) {
		return {
			error:true,
			msg : filename+ t("不是有效的对象名称")
		}
	}
	
	if (!isValid(dirname)) {
		return {
			error:true,
			msg : dirname+ t("不是有效的目录名")
		}
	}
	
	var fullPath = nwPath.join("/", dirname, filename);
	fullPath = fullPath.replace(/\\/g, "/");
	
	var fileObj = this.createFileData(fullPath, {
		originalFormat 	: options.originalFormat,
		type			: options.type
		});

	trans.project.files[fullPath] = fileObj;
	
	trans.addFileItem(fullPath, fileObj);
	this.evalTranslationProgress();
	ui.fileList.reIndex();
	ui.initFileSelectorDragSelect();	
	return {}
}

trans.selectFile = function($element, options) {
	options = options||{};
	options.onDone = options.onDone||undefined;
	
	this.grid.deselectCell()
	if (typeof $element == "string") $element = $(".fileList [data-id="+escapeSelector($element)+"]");
	
	//console.log("switching to other file");
	$element.closest(".tree").find("li").removeClass("selected");
	$element.closest("li").addClass("selected");
	var thisID = $element.closest("li").data("id");

	trans.project.selectedId 	= thisID;
	console.log("selected id : ", thisID);
	console.log("selected data : ", trans.project.files[thisID]);
	trans.data 					= trans.project.files[thisID].data;
	//trans.indexIds			= trans.project.files[thisID].indexIds;
	trans.selectedData 			= trans.project.files[thisID];
	// force reindexig each build
	trans.buildIndex();
	trans.refreshGrid({onDone:options.onDone});
	trans.loadComments();
	trans.clearCellInfo();
	trans.clearEditor();
	trans.setStatusBarNumData();
	trans.resetCurentCellEditor();

	if ($(".menu-button.addNote").hasClass("checked")) {
		ui.openFileNote();
	} 
	$(".fileId").val(thisID);;
	ui.disableGrid(false);
	ui.evalFileNoteIcon();
	$(document).trigger("objectSelected", thisID);
	trans.grid.render();
	return $element;
	
}

trans.addFileGroup = function(dirname, fileObj) {
	var $group = $("#fileList [data-group='"+CSS.escape(dirname)+"']");
	//console.log("Group : ", dirname , $group.length);
	if ($group.length < 1) {
		//console.log("creating new header");
		var hTemplate = $("<li class='group-header'  data-group='"+dirname+"'>"+dirname+"</li>");
		
		if ($("#fileList .fileListUl .group-header[data-group='*']").length > 0) {
			$("#fileList .fileListUl .group-header[data-group='*']").before(hTemplate);
		} else {
			$("#fileList .fileListUl").append(hTemplate);
		}
		return true;
	}
	return false;
}

trans.fileItemExist = function(file, fileObj) {
	if ($("#fileList [data-group='"+CSS.escape(fileObj.dirname)+"'][data-id='"+CSS.escape(file)+"']").length>0) {
		return true;
	}
	return false;
}

trans.addFileItem = function(file, fileObj) {
		// skip if exist
		if (this.fileItemExist(file, fileObj)) return false;
		// draw header if exist
		this.addFileGroup(fileObj.dirname);

		
		var template = $("<li title='"+file+"' data-group='"+fileObj.dirname+"'><input type='checkbox' class='fileCheckbox' value='"+file+"' title='按住shift键进行批量选择' />"+
			"<a href='#' class='filterable'><span class='filename'>"+fileObj.filename+"</span>"+
			"<span class='percent' title='进程'></span>"+
			"<div class='progress' title='进程'></div>"+
			"</a></li>");
		template.addClass("data-selector");
		template.data("id", file);
		template.attr("data-id", file);
		//template.data("data", fileObj);
		template.find("a").on("mousedown", function(e) {
			//console.log("middle click clicked");
			//console.log(e);
			if( e.which == 2 ) {
				e.preventDefault();
				trans.clearSelection();
				return false;
				
			}			
		});
		template.find("a").on("dblclick", function(e) {
			// select that item
			var $thisCheckbox = $(this).closest("li").find(".fileCheckbox");
			$thisCheckbox.prop("checked", !$thisCheckbox.prop("checked")).trigger("change")
			
		});
		template.find("a").on("click", function(e) {
			//console.log("clicked");
			e.preventDefault();
			trans.selectFile($(this).closest("li"));
		});
		template.find(".fileCheckbox").on("change", function() {
			if ($(this).prop("checked") == true) {
				trans.$lastCheckedFile = $(this);
				$(this).closest(".data-selector").addClass("hasCheck");
			} else {
				trans.$lastCheckedFile = undefined;
				$(this).closest(".data-selector").removeClass("hasCheck");
			}
		});
		template.find(".fileCheckbox").on("mousedown", function(e) {
			if (!Boolean(trans.$lastCheckedFile)) return false;
			if (e.shiftKey) {
				console.log("The SHIFT key was pressed!");
				var $checkBoxes = $(".fileList .fileCheckbox");
				var lastIndex = $checkBoxes.index(trans.$lastCheckedFile);
				var thisIndex = $checkBoxes.index(this);
				
				if (lastIndex < thisIndex) {
					var chckFrom = lastIndex;
					var chckTo = thisIndex;
				} else {
					var chckFrom = thisIndex;
					var chckTo = lastIndex;
				}
				console.log("check from index "+chckFrom+" to "+chckTo);
				for (var i=chckFrom; i<chckTo; i++) {
					$checkBoxes.eq(i).prop("checked", true).trigger("change");
				}
				
			} 		
		});
		
		//$("#fileList .fileListUl").append(template);
		$("#fileList [data-group='"+CSS.escape(fileObj.dirname)+"']").last().after(template);
		//lastDirName = fileObj.dirname;	
}

trans.drawFileSelector = function() {
	if (typeof this.project.files == 'undefined') return false;
	$("#fileList .fileListUl").empty();	
	this.generateNewDictionaryTable();
	
	var lastDirName = "";
	for (var file in this.project.files) {
		this.addFileItem(file, this.project.files[file]);
	}	
	this.setStatusBarEngine();
	this.evalTranslationProgress();
	ui.fileList.reIndex();
	ui.initFileSelectorDragSelect();
	ui.enableButtons();
	var TranslationByContext = require("www/js/TranslationByContext.js");
	ui.translationByContext = new TranslationByContext();
	engines.handler('onLoadTrans').apply(this, arguments);
	$(document).trigger('onLoadTrans');

}

trans.selectAll = function(filter, append) {
	// select all with matching filter
	// if append is true then adding into previously selection
	// if filter is empty, then select all
	filter = filter||[];
	append = append||false;
	if (typeof filter == 'string') filter = [filter];
	
	var $checkBoxes = $("#fileList .fileCheckbox");
	
	if (filter.length == 0) {
		$checkBoxes.each(function() {
			$(this).prop("checked", true).trigger("change");
		});
	} else {
		if (!append) $checkBoxes.prop("checked", false).trigger("change");
		$checkBoxes.each(function() {
			var $this = $(this);
			if (filter.includes($this.closest("li").data("id"))) $this.prop("checked", true).trigger("change");
		});
	}
}

trans.invertSelection = function() {
	var $checkBoxes = $("#fileList .fileCheckbox");
	$checkBoxes.each(function() {
		$(this).prop("checked", !$(this).prop("checked")).trigger("change");
	});
}

trans.clearSelection = function() {
	var $checkBoxes = $("#fileList .fileCheckbox");
	$checkBoxes.each(function() {
		$(this).prop("checked", false).trigger("change");
	});
}

trans.initFileNav = function() {	
	//console.log(trans.fileListLoaded);
	//this function will be executed whenever initializing a new trans file
	//this function is suitable to hook all initialization event of trans
	console.log("running trans.initFileNav");
	//console.log("current trans : ", trans);
	
	// reevaluating trans.fileListLoaded based on existance of trans.project.files
	try {
		if (typeof trans.project.files !=='undefined') {
			trans.fileListLoaded = true;
		} else {
			trans.fileListLoaded = false;
		}
	} catch (e) {
		trans.fileListLoaded = false;
	}
	
	if (trans.fileListLoaded == false) {
		trans.createProject({
			onAfterLoading:function() {
				trans.drawFileSelector();
			}
		});

		return false;
	} else {
		this.unInitFileNav();
		trans.drawFileSelector();
		this.onFileNavLoaded.call(this);
		//engines.handler('onLoadTrans').apply(this, arguments);
		$(document).trigger("transLoaded", this);
	}
}

trans.unInitFileNav = function() {
	$("#fileList .fileListUl").empty();
	ui.fileList.reIndex();
	this.onFileNavUnloaded.call(this);
	engines.handler('onUnloadTrans').apply(this, arguments);
	ui.ribbonMenu.clear();
	ui.disableButtons();
	
}


trans.evalTranslationProgress = function(file, data) {
	//data = data||{};
	file = file||[];
	var dataResult = data||trans.countTranslated(file)||{};
	
	//if (typeof data[file] == 'undefined') dataResult = trans.countTranslated(file);
	
	for (var id in dataResult) {
		var fileSelector = $(".fileList [data-id="+escapeSelector(id)+"]");
		fileSelector.find(".percent").text(Math.round(dataResult[id].percent));
		fileSelector.find(".progress").css("background", "linear-gradient(to right, #3159f9 0%,#3159f9 "+dataResult[id].percent+"%,#ff0004 "+dataResult[id].percent+"%,#ff0004 100%)");
	}
}

trans.loadComments = function() {
	trans.grid.comment = trans.grid.comment||trans.grid.getPlugin('comments');
	var selectedObj = trans.getSelectedObject();
	if (!selectedObj) return false;
	if (typeof selectedObj.comments == 'undefined') return false;
	
	for (var row in selectedObj.comments) {
		for (var col in selectedObj.comments[row]) {
			trans.grid.comment.setCommentAtCell(row, col, selectedObj.comments[row][col]);
		}
	}
	
	
}

// ===============================================================
// CONTEXT MENU
// ===============================================================

trans.fileSelectorContextMenuInit = function() {
	console.log("trans.fileSelectorContextMenuInit");
	if (trans.fileSelectorContextMenuIsInitialized) return false;
	$.contextMenu({
		selector: '.fileList .data-selector', 
		events: {
			preShow : function($target, e) {
				//$(".context-menu-root").trigger("contextmenu:hide")
				/*
				console.log(arguments);
				var $cTarget = $target;
				$cTarget.closest("ul").find(".contextMenuOpened").removeClass("contextMenuOpened");
				$cTarget.addClass("contextMenuOpened");
				*/
				//console.log(arguments);
				
			},
			hide : function($target, e){
				//$(".fileList .data-selector.contextMenuOpened").removeClass("contextMenuOpened");

			}
		},			
		build: function($triggerElement, e) {
			var thisCallback = function(key, options) {
				switch (key) {
					case "selectAll" :
						trans.selectAll();
						break;
					case "clearSelection" :
						trans.clearSelection();
						break;
					case "invertSelection" :
						trans.invertSelection();
						break;
					case "selectCompleted" :
						trans.selectAll(trans.getAllCompletedFiles())
						break;
					case "selectIncompleted" :
						trans.selectAll(trans.getAllIncompletedFiles())
						break;
					case "batchTranslation" :
						ui.translateAllDialog();
						break;
					case "clearTranslationSel" :
						var confirmation = confirm(t("你想清除翻译吗？"));
						var selection = trans.getCheckedFiles();
						if (confirmation) trans.removeAllTranslation(trans.getCheckedFiles(), {refreshGrid:true});
						trans.evalTranslationProgress(selection);
						break;
					case "clearTranslationAll" :
						var confirmation = confirm(t("你想清除翻译吗？"));
						var selection = trans.getAllFiles();
						if (confirmation) trans.removeAllTranslation(trans.getAllFiles(), {refreshGrid:true});
						trans.evalTranslationProgress(selection);
						break;
					case "wrapText" :
						ui.batchWrapingDialog();
						break;
					case "trim" :
						ui.openTrimWindow();
						break;
					case "padding" :
						ui.openPaddingWindow();
						break;
					case "properties" :
						ui.openFileProperties();
						break;
					// imports
					case "importFromSheet":
						ui.openImportSpreadsheetDialog();
						break;
					case "importFromTrans":
						$("#importTrans").trigger("click");
						break;
					case "importFromRPGMTransPatch":
						ui.openImportRPGMTransDialog();
						break;
						
					// exports
					case "exportToGamePatch":
						$("#dialogExport").data("options", {files:trans.getCheckedFiles()});
						$("#exportDir").trigger("click");
						break;
					case "exportToGamePatchZip":
						$("#dialogExport").data("options", {files:trans.getCheckedFiles()});
						$("#export").trigger("click");
						break;
					case "exportToCsv":
						$("#exportCSV").trigger("click");
						break;
					case "exportToXlsx":
						$("#dialogExport").data("options", {files:trans.getCheckedFiles()});
						$("#exportXLSX").trigger("click");
						break;
					case "exportToXls":
						$("#dialogExport").data("options", {files:trans.getCheckedFiles()});
						$("#exportXLS").trigger("click");
						break;
					case "exportToOds":
						$("#dialogExport").data("options", {files:trans.getCheckedFiles()});
						$("#exportODS").trigger("click");
						break;
					case "exportToHtml":
						$("#dialogExport").data("options", {files:trans.getCheckedFiles()});
						$("#exportHTML").trigger("click");
						break;
					case "exportToTransPatch":
						$("#dialogExport").data("options", {files:trans.getCheckedFiles()});
						$("#exportTrans").trigger("click");
						break;
					case "inject":
						ui.openInjectDialog();
						break;
					default :
					
					
				}
			}
			
			var checkedLength = $(".fileCheckbox:checked").length;
			var menuObj = {
						"selectAll" : {"name" : t("全选")},
						"clearSelection" : {"name" : t("清除选择")},
						"selectCompleted" : {"name" : t("选择100%")},
						"selectIncompleted" : {"name" : t("选择<100%")},
						"invertSelection" : {"name" : t("反转选择")},
						"sep0": "---------",
							
						"withSelected": {
							name: t("选 ") + checkedLength + t(" 择"),
							icon: function() {
								return 'context-menu-icon icon-check';
							},
							items: {
								"batchTranslation": {
									"name" : t("批量翻译"),
									icon: function(){
										return 'context-menu-icon icon-language';
										}
									},
								"sep0-1":"---------",
								"wrapText": {"name" : t("包装文本")},
								"trim": {"name" : t("修剪")},
								"padding": {"name" : t("自动填充")},
								"clearTranslationSel": {"name" : t("清除翻译")},
								"sep0-0":"---------",
								"import": {
									name:"导入自...",
									items: {
										"importFromTrans" : {"name": t("传输文件"),icon:() => 'context-menu-icon icon-tpp'},
										"importFromSheet" : {"name": t("电子表格"),icon:() => 'context-menu-icon icon-file-excel'},
										"importFromRPGMTransPatch" : {"name": t("RPGMTransPatch文件"),icon:() => 'context-menu-icon icon-doc-text'}
									}
								},
								"export": {
									name:"输出到...",
									items: {
										"exportToGamePatch" : {"name": t("一个文件夹"),icon:() => 'context-menu-icon icon-folder-add'},
										"exportToGamePatchZip" : {"name": t("压缩游戏补丁"),icon:() => 'context-menu-icon icon-file-archive'},
										"exportToCsv" : {"name": t("逗号分隔值（csv）"),icon:() => 'context-menu-icon icon-file-excel'},
										"exportToXlsx" : {"name": t("Excel 2007电子表格（xlsx）"),icon:() => 'context-menu-icon icon-file-excel'},
										"exportToXls" : {"name": t("Excel电子表格（xls）"),icon:() => 'context-menu-icon icon-file-excel'},
										"exportToOds" : {"name": t("ODS电子表格"),icon:() => 'context-menu-icon icon-file-excel'},
										"exportToHtml" : {"name": t("Html电子表格"),icon:() => 'context-menu-icon icon-file-code'},
										"exportToTransPatch" : {"name": t("RMTrans补丁"),icon:() => 'context-menu-icon icon-doc-text'}
									}
								},
								"inject" : {
									name: "注入翻译"
								}
							}
						},
						"sep1": "---------",
						"properties": {
							name: "属性", 
							icon: function(){
								return 'context-menu-icon icon-cog';
							}	
						}
					}
			
			console.log("Menu obj : ", menuObj);
			
			if (checkedLength == 0) {
				menuObj.withSelected.name = t("所有的");
				menuObj.withSelected.icon = () => 'context-menu-icon icon-docs-1';
			}
			
			return {
				zIndex:1000,
				callback: thisCallback,
				items: menuObj
			}			
		}
	});	
	
	trans.fileSelectorContextMenuIsInitialized = true;
	
}

trans.gridBodyContextMenu = function() {
	$.contextMenu({
		selector: '.ht_master .htCore tbody, .ht_clone_left .htCore tbody', 
		events: {
			preShow : function($target, e) {
				//$(".context-menu-root").trigger("contextmenu:hide")
				var cTarget = $(e.target);
				console.log(cTarget);
				if (cTarget.hasClass("highlight")) {
					console.log("previously hightlighted");
				}
				console.log(arguments);
				
			},
			show : function($target, e){
				console.log("selection on show : ");
				trans.grid.lastContextMenuCellRange = trans.grid.getSelectedRange();
			},
			hide : function($target, e){
				console.log("reload selection : ");
				if (typeof trans.grid.lastContextMenuCellRange == undefined) return false;
				trans.grid.selectCells(trans.grid.lastContextMenuCellRange);
				
				console.log(trans.grid.getSelectedRange());
			}
		},
		build: function($triggerElement, e) {
			var thisCallback = function(key, options) {
				switch (key) {
					case "addComment" :
						var thisCoord= undefined;
						try  {
							thisCoord = trans.grid.lastContextMenuCellRange[0]['highlight']
						} catch (error) {}
						trans.editNoteAtCell(thisCoord);
						break;
					case "removeComment" :
					
						trans.removeNoteAtSelected(trans.grid.lastContextMenuCellRange);
						break;
					default :
					
					
				}
			}
			return {
				zIndex:1000,
				callback: thisCallback,
				items: {
					"addComment": {name: "添加评论", icon: function(){
						return 'context-menu-icon icon-commenting-o';
					}},					
					"removeComment": {name: "删除评论", icon: function(){
						return 'context-menu-icon icon-comment-empty';
					}},					
					"selectAll" : {"name" : t("全选")},
					"invertSelection" : {"name" : t("反转选择")},
					"sep0": "---------",

					"withSelected": {
						name: "所有的",
						items: {
							"batchTranslation": {"name" : t("批量翻译")},
							"wordWrap": {"name" : t("包装文本")}
						}
					}

				}
			}			
			
		}
	});	
	
}


//================================================================
//
// CONTEXT RELATED
//
//================================================================
trans.evalContextsQuery = function() {
	if (arguments.length == 0) return false;
	
	var result = [];
	for (var i=0; i<arguments.length; i++) {
		if (typeof arguments[i] == "string") {
			if (arguments[i].length == 0) continue;
			var thisA = arguments[i].split("\n").map(function(input) {
				return common.stripCarriageReturn(input);
			});
			result = result.concat(thisA);
		} else if (Array.isArray(arguments[i])) {
			if (arguments[i].length == 0) continue;
			result = result.concat(arguments[i]);
		}
	}
	
	return result;
}

trans.isInContext = function(file, row, context) {
	var context = context||[];
	if (context.length == 0) return true;
	
	if (typeof context == 'string') context = [context];
	
	if (typeof trans.project.files[file] == 'undefined') return false;
	if (typeof trans.project.files[file].context[row] == 'undefined') return false;
	
	var thisContextS = trans.project.files[file].context[row];
	if (Array.isArray(thisContextS) == false) thisContextS = [thisContextS];

	if (thisContextS.length < 1) {
		// try to findout on parameters
		if (typeof trans.project.files[file].parameters[row] != 'undefined')  {
			thisContextS = [trans.buildContextFromParameter(trans.project.files[file].parameters[rowId])];
		}
		//continue;
	}	
	
	var contextStr = thisContextS.join("\n");

	for (var i=0; i<context.length; i++) {
		contextStr = contextStr.toLowerCase();
		if (contextStr.indexOf(context[i].toLowerCase()) != -1) return true;
	}

	return false;
}
/*
trans.removeRowByContext = function(files, contexts, options) {
	var collection = trans.travelContext(files, contexts, {
		onMatch:function(file, row) {
			//trans.removeRow(file, row);
			//console.log("removing "+files+" row "+row);
		}
	});
	
	for (var file in collection) {
		for (var row=collection[file].length-1; row>=0; row--) {
			if (collection[file][row] == true) {
				console.log("removing "+file+" row "+row);
				trans.removeRow(file, row);
				//trans.project.files[file].data.splice(row, 1);
			}
		}
	}
	
	
	trans.refreshGrid();
}
*/
trans.removeRowByContext = function(files, contexts, options, whitelist) {
	/*
		improved by. Vellithe
	*/
	options=options||{};
	options.matchAll = options.matchAll||false;
	
	var collection = trans.travelContext(files, contexts, {
		onMatch:function(file, row) {
			//trans.removeRow(file, row);
			//console.log("removing "+files+" row "+row);
		},
		matchAll:options.matchAll
	});
	
	for (var file in collection) {
		for (var row=collection[file].length-1; row>=0; row--) {
			if ((collection[file][row] == true && whitelist !== true) || (collection[file][row] != true && whitelist === true)) {
				console.log("removing "+file+" row "+row + (whitelist === true ? " (Not on whitelist)" : ""));
				trans.removeRow(file, row);
				//trans.project.files[file].data.splice(row, 1);
			}
		}
	}
	
	
	trans.refreshGrid();
}

trans.collectContextKeyword = function(obj, files, options) {
	files = files||[];
	obj = obj||trans.project;
	
	if (typeof obj == 'undefined') return false;
	
	if (typeof files == "string") files = [files];
	if (files.length < 1) { // select all
		for (var file in trans.project.files) {
			files.push(file);
		}
	}		
	
	//console.log(files);
	
	var collection = {};
	for (var i=0; i<files.length; i++) {
		var file = files[i];
		var thisData = obj.files[file].context;
		for (var contextId=0; contextId<thisData.length; contextId++) {
			if (Array.isArray(thisData[contextId]) == false) continue;
			for (var y=0; y<thisData[contextId].length; y++) {
				var contextString = thisData[contextId][y]||"";
				var contextPart = contextString.split("/");
				for (var x=0; x<contextPart.length; x++) {
					if (isNaN(contextPart[x])) {
						collection[contextPart[x]] = collection[contextPart[x]]||0;
						collection[contextPart[x]] += 1;
					}
				}
			}
		}
	}
	return collection;
}

trans.travelContext = function(files, contexts, options) {
	//remove related context
	files = files||[];
	contexts = contexts||[]; // keywords
	options = options||{};
	options.onMatch = options.onMatch||function(){};
	options.onNotMatch = options.onNotMatch||function(){};
	options.matchAll = options.matchAll||false;
	
	
	if (typeof files == "string") files = [files];
	if (Array.isArray(contexts) == false) contexts = [contexts];
	

	if (files.length < 1) { // select all
		for (var file in trans.project.files) {
			files.push(file);
		}
	}
	//console.log(files);
	var collection = {};
	for (var i=0; i<files.length; i++) {
		var file = files[i];
		collection[file] = [];
		
		for (var rowId=0; rowId<trans.project.files[file].context.length; rowId++) {
			var thisContextS = trans.project.files[file].context[rowId];
			if (Array.isArray(thisContextS) == false) thisContextS = [thisContextS];
			collection[file][rowId] = false;
			if (thisContextS.length < 1) {
				// try to findout on parameters
				if (!trans.project.files[file].parameters[rowId]) continue;
				thisContextS = [trans.buildContextFromParameter(trans.project.files[file].parameters[rowId])];
				//continue;
			}
			

			for (var y=0; y<thisContextS.length; y++) {
				var thisContext = thisContextS[y];
				//console.log(thisContext);
				for (var x=0; x<contexts.length; x++) {
					//try {
					if (options.matchAll) {
						if (common.matchAllWords(thisContext, contexts[x])) {
							collection[file][rowId] = true;
						}
					} else {
						//console.log("comparing "+thisContext+" with "+contexts[x]);
						if (thisContext.toLowerCase().indexOf(contexts[x].toLowerCase()) >= 0) {
							//console.log("match");
							//matchFound = true;
							
							//if (options.onMatch.call(trans.project.files[file], file, rowId) === false) return false;
							collection[file][rowId] = true;
							//break;
						} else {
							//if (options.onNotMatch.call(trans.project.files[file], file, rowId) === false) return false;
						}
					}
					//} catch(err) {
						
					//}
				}
			}
		}
		
		for (var rowId=0; rowId<collection[file].length; rowId++) {
			if (collection[file][rowId] == true) {
				options.onMatch.call(trans.project.files[file], file, rowId);
			} else {
				options.onNotMatch.call(trans.project.files[file], file, rowId);
			}
		}
	}
	
	return collection;
}


//================================================================
//
// UTILITY
//
//================================================================

trans.getActiveTranslator = function() {
	trans.project.options = trans.project.options || {};
	return trans.project.options.translator || sys.config.translator;
}

trans.appendTextToReference = function(text) {
	if (typeof text !== 'string') return false;
	if (Boolean(text)==false) return false;
	
	if (trans.isKeyExistOn(text, "共同参考")) return trans.alert("无法添加<b>"+text+"</b>。该值已存在于通用参考中！");
	
	
	var ref= trans.project.files["Common Reference"];
	var lastKey = ref.data.length-1;
	if (Boolean(ref.data[lastKey][0]) == false) {
		console.log("inserting to ref.data[lastKey][0]");
		ref.data[lastKey][0] = text;
		ref.indexIds[text] = lastKey;
	} else {
		console.log("append new data");
		var newData = new Array(trans.colHeaders.length);
		newData = newData.fill(null);
		newData[0] = text;
		ref.data.push(newData);
		ref.indexIds[text] = ref.data.length-1;
	}
	
	trans.alert("<b>"+text+"</b> "+t("添加到参考表中！"));	
}

trans.wordWrapFiles = function(files, col, targetCol, options) {

	files = files||[];
	if (typeof files == 'string') files = [files];
	
	if (files.length == 0 ) files = trans.getAllFiles();
	//console.log(arguments);
	//return true;
	
	col = col||1;
	targetCol = targetCol||col+1;
	if (targetCol == 0) return trans.alert(t("无法修改列0"));
	
	options = options||{};
	options.maxLength = options.maxLength||41; // default with picture, without picture is 50
	options.onDone = options.onDone||function() {};
	options.context = options.context||[] // context filter
	
	for (var id=0; id<files.length; id++) {
		var file = files[id];
		console.log("Wordwrapping file : "+file);
		if (typeof trans.project.files[file] == 'undefined') continue;
		options.lineBreak = options.lineBreak||trans.project.files[file].lineBreak||"\n";
		
		var thisData = trans.project.files[file].data;
		//console.log(thisData);
		for (var row=0; row<thisData.length; row++) {
			if (!trans.isInContext(file, row, options.context)) continue;
			if (typeof thisData[row][col] !== 'string') {
				thisData[row][targetCol] = thisData[row][col];
			}
			
			thisData[row][targetCol] = wordwrap(thisData[row][col], options.maxLength,options.lineBreak);
		}
	}
	
	options.onDone.call(trans);
	
}

trans.fillEmptyLine = function(files, rows, targetCol, sourceCol, options) {
	/*
	Integer targetCol
	Integer sourceCol
	*/
	// if targetCol is undefined, than the right most row with existed translation will be picked
	files = files||[];
	if (typeof files == 'string') files = [files];
	options = options||{};
	options.project 	= options.project||trans.project;
	options.keyColumn 	= options.keyColumn||0;
	options.lineFilter 	= options.lineFilter|| function() {return true};
	options.fromKeyOnly	= options.fromKeyOnly || false; // fill from key column only
	options.filterTag 	= options.filterTag || [];
	
	if (options.fromKeyOnly) {
		console.warn("仅从密钥收集数据");
		options.sourceCol  = options.keyColumn;
	}
	
	rows = rows||[];
	if (typeof rows == 'integer') rows = [rows];
	
	if (files.length == 0) files = trans.getAllFiles();
	console.log(files);
	
	for (var index=0; index<files.length; index++) {
		file = files[index];
		//console.log(file);
		var thisLineBreak = options.project.files[file].thisLineBreak||"\n";
		if (rows.length > 0) {
			
		} else { // all row
			var thisData = options.project.files[file].data;
			for (var row=0; row<thisData.length; row++) {
				
				if (options.filterTagMode == "blacklist") {
					if (this.hasTags(options.filterTag, row, file)) continue;
				} else if (options.filterTagMode == "whitelist") {
					if (!this.hasTags(options.filterTag, row, file)) continue;
				}
				
				if (typeof targetCol == 'undefined') {
					targetCol = trans.getTranslationColFromRow(thisData[row]);
					if (targetCol == null) continue; // no translation exist
				}
				
				/*
				if (typeof sourceCol == 'undefined') {
					sourceCol = trans.getTranslationColFromRow(thisData[row], targetCol); // get translation except targetCol
					if (sourceCol == null) continue; // no source found
				}
				*/
				options.project.files[file].data[row][targetCol] = trans.getTranslationByLine(thisData[row], options.keyColumn, {
					includeIndex	:true,
					priorityCol		:targetCol,
					onBeforeLineAdd	:options.lineFilter,
					sourceCol		:options.sourceCol//column to check, undefined means all
				});
				/*
				var sourceArray = thisData[row][sourceCol].split("\n").map(function(input){
										return common.stripCarriageReturn(input);
									});
				var targetArray = thisData[row][targetCol].split("\n").map(function(input){
										return common.stripCarriageReturn(input);
									});
									
				if (targetArray.indexOf("") == -1) continue;
				
				for (var x=0; x<sourceArray.length; x++) {
					if (Boolean(sourceArray[x]) == false) continue;
					targetArray[x] = sourceArray[x];
				}
				
				options.project.files[file].data[row][targetCol] = targetArray.join(thisLineBreak);
				*/
			}			
		}
	}
	
}

trans.trimTranslation = function(files, columns, options) {
	// remove whitespace from translation
	if (typeof trans.project == false) return false;
	files = files||trans.getSelectedId();
	options = options||{};
	options.refreshGrid = options.refreshGrid||false;
	
	if (Array.isArray(files) == false) files = [files];
	if (Array.isArray(columns) == false) columns = [columns];
	
	
	for (var i=0; i<files.length; i++) {
		var file = files[i];
		//console.log("handling "+file);
		var thisData = trans.project.files[file].data;
		//var thisLineBreak = trans.project.files[file].lineBreak||"\n";
		var originalLineBreak = trans.project.files[file].lineBreak||"\n";
		var thisLineBreak = "\n";
		for (var row=0; row<thisData.length; row++) {
			//console.log("handling row "+row);
			for (var colID in columns) {
				var col = columns[colID];
				//console.log("handling col "+col);
				//console.log(trans.project.files[file].data[row][col]);
				if (col < 1) continue;
				if (typeof trans.project.files[file].data[row][col] !== 'string') continue;
				var lines = trans.project.files[file].data[row][col].split(thisLineBreak);
				var newLines = lines.map(function(thisVal) {
					//console.log(thisVal.trim());
					return thisVal.trim();
				});
				trans.project.files[file].data[row][col] = newLines.join(originalLineBreak);
			}
		}
	}
	
	//if (options.refreshGrid) {
		trans.refreshGrid();
	//}	
}

trans.paddingTranslation = function(files, columns, options) {
	// Copy left padding from keys to translations
	if (typeof trans.project == false) return false;
	files = files||trans.getSelectedId();
	options = options||{};
	options.keyId = options.keyId||0;
	options.includeInitialWhitespace = options.includeInitialWhitespace||false;
	options.refreshGrid = options.refreshGrid||false;
	
	if (Array.isArray(files) == false) files = [files];
	if (Array.isArray(columns) == false) columns = [columns];
	
	var whiteSpaces = /^[ \\s\u00A0\f\n\r\t\v\u00A0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u2028\u2029\u202f\u205f\u3000]+/g
	
	for (var i=0; i<files.length; i++) {
		var file = files[i];
		var thisData = trans.project.files[file].data;
		var thisLineBreak = trans.project.files[file].lineBreak||"\n";
		for (var row=0; row<thisData.length; row++) {
			if (typeof trans.project.files[file].data[row][options.keyId] !== 'string') continue;
			var keys = trans.project.files[file].data[row][options.keyId].split(thisLineBreak);
			var leftWhiteSpaces = [];
			for (var keysID=0; keysID<keys.length; keysID++) {
				var thisLeftWS = keys[keysID].match(whiteSpaces);
				if (Boolean(thisLeftWS) == false) thisLeftWS = "";
				leftWhiteSpaces.push(thisLeftWS);
			}
			
			for (var colID in columns) {
				var col = columns[colID];
				if (col < 1) continue;
				if (typeof trans.project.files[file].data[row][col] !== 'string') continue;
				
				var lines = trans.project.files[file].data[row][col].split(thisLineBreak);
				var newLines = [];
				
				for (var linePartId=0; linePartId<lines.length; linePartId++) {
					var thisWhitespace = leftWhiteSpaces[linePartId]||"";
					if (options.includeInitialWhitespace) {
						newLines.push(thisWhitespace+lines[linePartId]);
					} else {
						newLines.push(thisWhitespace+lines[linePartId].trim());
					}
				}
				
				trans.project.files[file].data[row][col] = newLines.join(thisLineBreak);
			}
		}
	}
	
	//if (options.refreshGrid) {
		trans.refreshGrid();
	//}	
}


trans.removeAllTranslation = function(files, options) {
	if (typeof trans.project == false) return false;
	files = files||trans.getSelectedId();
	options = options||{};
	options.refreshGrid = options.refreshGrid||false;
	
	if (Array.isArray(files) == false) files = [files];
	
	for (var i=0; i<files.length; i++) {
		var file = files[i];
		var thisData = trans.project.files[file].data;
		for (var row=0; row<thisData.length; row++) {
			for (var col=1; col<thisData[row].length; col++) {
				trans.project.files[file].data[row][col] = null;
			}
		}
	}
	
	$(document).trigger("removeAllTranslation", {files:files, options:options});
	if (options.refreshGrid) {
		trans.refreshGrid();
	}
}

trans.deleteFile = function(files, options) {
	if (typeof trans.project == false) return false;
	files = files||trans.getSelectedId();
	options = options||{};
	
	if (Array.isArray(files) == false) files = [files];
	
	if (files.length < 1) return true;
	
	for (var i=0; i<files.length; i++) {
		// unselect if selected
		var file = files[i];
		
		if (trans.project.files[file].type == 'reference') {
			alert(t("无法删除表：")+file);
			continue;
		}
		
		
		if (file == trans.getSelectedId()) {
			ui.disableGrid(true);
		}
		
		
		var bak = JSON.parse(JSON.stringify(trans.project.files[file]));
		trans.project.trash = trans.project.trash||{};
		trans.project.trash[file] = bak;
		
		$(".panel-left .fileList [data-id="+escapeSelector(file)+"]").remove();
		delete trans.project.files[file];
	}
	ui.fileList.reIndex();

}



trans.removeRow = function(file, rows, options) {
	console.log("removing row : ", arguments);
	if (typeof file == 'undefined') return false;
	if (typeof rows == 'undefined') return false;
	if (rows === 0) rows = [0];
	rows = rows||[];
	options = options||{};
	if (Array.isArray(rows) == false) rows = [rows];
	options.permanent = options.permanent||false;
	options.refreshGrid = options.refreshGrid||false;
	
	// sort array descending! this is important!
	rows.sort(function(a, b) {
		return b - a;
	});
	console.log("Removing rows > should be ordered descendingly:", rows);
	
	for (var i=0; i<rows.length; i++) {
		var thisRow = rows[i];
		if (typeof trans.project.files[file].data[thisRow] == 'undefined') continue;
		trans.project.files[file].data.splice(thisRow, 1);
		if (trans.project.files[file].parameters) trans.project.files[file].parameters.splice(thisRow, 1);
		if (trans.project.files[file].context) trans.project.files[file].context.splice(thisRow, 1);
		if (trans.project.files[file].tags) trans.project.files[file].tags.splice(thisRow, 1);
	
		// adjust comment
		var comments = this.getObjectById(file).comments;
		if (empty(comments)) continue;
		if (Array.isArray(comments)) {
			comments.splice(thisRow, 1);
		} else {
			delete comments[thisRow];
		}
	}
	
	if (rows.length > 0) trans.project.files[file].indexIsBuilt = false;
	
	$(document).trigger("afterRemoveRow", {file:file, rows:rows, options:options});

	if (options.refreshGrid) {
		trans.refreshGrid();
	}
	
}

trans.removeColumn = function(column, options) {
	if (column === 0) return trans.alert(t("无法删除键列！"));
	options = options||{};
	options.permanent = options.permanent||false;
	options.refreshGrid = options.refreshGrid||false;
	if(typeof trans.project == "undefined") return trans.alert(t("请先打开或创建一个项目"));
	
	for (var file in trans.project.files) {
		if(Array.isArray(trans.project.files[file].data) == false) continue;
		if(trans.project.files[file].data.length == 0) continue;
		for (var row=0; row< trans.project.files[file].data.length; row++) {
			trans.project.files[file].data[row].splice(column, 1);
		}
	}
	
	trans.colHeaders.splice(column, 1);
	trans.columns.splice(column, 1);
	
	if (options.refreshGrid) {
		trans.refreshGrid();
	}
}

trans.renameColumn = function(column, newName, options) {
	if (column === 0) return trans.alert(t("不能将列名设置为空！"));
	options = options||{};
	options.permanent = options.permanent||false;
	options.refreshGrid = options.refreshGrid||false;
	
	if (typeof trans.colHeaders[column] == 'undefined') return false; 
	trans.colHeaders[column] = newName;
	
	if (options.refreshGrid) {
		trans.refreshGrid();
	}
	
}

trans.isTranslatedRow = function(row, data) {
	data = data||trans.data;
	for (var col=1; col < data[row].length; col++) {
		var thisCell = data[row][col]||"";
		if (thisCell.length > 0) return true;
	}
	return false;
}

trans.countFilledCol = function(row, data) {
	// exclude col index 0
	data = data||trans.data;
	var result = 0;
	for (var col=1; col < data[row].length; col++) {
		var thisCell = data[row][col]||"";
		if (thisCell.length > 0) result++;
	}
	return result;
}

trans.getTranslationFromRow = function(row, indexRow) {
	// retrieve best translation in an array
	if (Array.isArray(row) == false) return false;
	indexRow = indexRow||0;
	if (indexRow == 0) {
		var result = null;
		for (var n=row.length; n>0; n--) {
			if (Boolean(row[n])) {
				refference = row[n];
				return refference;
			}
		}
	} else {
		var result = null;
		for (var n=row.length; n>=0; n--) {
			if (n == indexRow) continue;
			if (Boolean(row[n])) {
				refference = row[n];
				return refference;
			}
		}
	}
	return null;
}


trans.getTranslationColFromRow = function(row, indexRow) {
	if (Array.isArray(row) == false) return false;
	indexRow = indexRow||0;
	if (indexRow == 0) {
		var result = null;
		for (var n=row.length; n>0; n--) {
			if (Boolean(row[n])) {
				return n;
			}
		}
	} else {
		var result = null;
		for (var n=row.length; n>=0; n--) {
			if (n == indexRow) continue;
			if (Boolean(row[n])) {
				return n;
			}
		}
	}
	return null;
}

trans.getTranslationByLine = function(row, indexRow, options) {
	// get line by line best translation
	if (Array.isArray(row) == false) return false;
	//console.log(arguments);
	indexRow 				= 0;
	options 				= options||{};
	options.includeIndex 	= options.includeIndex||false;
	options.lineBreak 		= options.lineBreak||"\n";
	options.onBeforeLineAdd = options.onBeforeLineAdd||function() {return true};
	//options.priorityCol 	= options.priorityCol||undefined;
	//options.sourceCol 	= options.sourceCol||undefined;
		
	var resultArray = [];
	
	if (typeof options.sourceCol != 'undefined') {
		var thisCell = row[options.sourceCol]||"";
		
		var thisCellPart = thisCell.split("\n").map(function(input){
								return common.stripCarriageReturn(input);
							});
		for (var part=0; part<thisCellPart.length; part++) {
			if (Boolean(thisCellPart[part]) == false) continue;
			if (!options.onBeforeLineAdd(thisCellPart[part])) continue;
			resultArray[part] = thisCellPart[part];
		}			
	} else {
		for (var col=0; col<row.length; col++) {
			if (col == indexRow) continue;
			
			if (typeof options.priorityCol !=='undefined') {
				if (col == options.priorityCol) continue;
			}
			
			var thisCell = row[col]||"";
			var thisCellPart = thisCell.split("\n").map(function(input){
									return common.stripCarriageReturn(input);
								});
			for (var part=0; part<thisCellPart.length; part++) {
				if (Boolean(thisCellPart[part]) == false) continue;
				if (!options.onBeforeLineAdd(thisCellPart[part])) continue;
				
				resultArray[part] = thisCellPart[part];
			}
		}
	}
	
	if (options.includeIndex) {
		var thisCell = row[indexRow]||"";
		
		var thisCellPart = thisCell.split("\n").map(function(input){
								return common.stripCarriageReturn(input);
							});
		for (var part=0; part<thisCellPart.length; part++) {
			if (Boolean(thisCellPart[part]) == false) continue;
			if (!options.onBeforeLineAdd(thisCellPart[part])) continue;
			
			resultArray[part] = thisCellPart[part];
		}		
		
	}
	
	if (typeof options.priorityCol !== 'undefined') {
		var thisCell = row[options.priorityCol]||"";
		
		var thisCellPart = thisCell.split("\n").map(function(input){
								return common.stripCarriageReturn(input);
							});
		for (var part=0; part<thisCellPart.length; part++) {
			if (Boolean(thisCellPart[part]) == false) continue;
			//if (!options.onBeforeLineAdd(thisCellPart[part])) continue;
			
			resultArray[part] = thisCellPart[part];
		}			
	}	
	
	return resultArray.join(options.lineBreak);
	
	
}

trans.generateTranslationPair = function(data, translationCol) {
	translationCol = translationCol || 0;
	if (Array.isArray(data) == false) return {};
	var result = {};
	for (var rowId=0; rowId<data.length; rowId++) {
		if (Boolean(data[rowId][0]) == false) continue;
		var translation = trans.getTranslationFromRow(data[rowId], translationCol);
		if (translation == null) continue;
		result[data[rowId][0]] = translation;
	}
	return result;
	
}


trans.countTranslated = function(file) {
	file = file||[];
	if (typeof file == 'string') {
		file=[file];
	}
	
	if (file.length == 0){
		for (var i in trans.project.files) {
			file.push(i);
		}
	}
	
	var result = {};
	for (var i=0; i<file.length; i++) {
		var thisData = trans.project.files[file[i]].data;
		result[file[i]] = {
			translated:0,
			length:0,
			percent:100
		};
		
		for (var row=0; row<thisData.length; row++) {
			if (Boolean(thisData[row][0]) == false) continue;
			thisData[row][0] = thisData[row][0]||"";
			// stringify 
			thisData[row][0] = thisData[row][0]+""
			try {
				var thisKeyCount = thisData[row][0].split("\n").length;
			} catch (e) {
				console.error("尝试拆分密钥字符串时出错", thisData[row][0]);
				throw(e)
			}

			for (var col=1; col<thisData[row].length; col++) {
				if (Boolean(thisData[row][col]) == false) continue;
				// converts non string cell into string
				if (typeof(thisData[row][col]) !== 'string') thisData[row][col] = thisData[row][col]+'';
				thisData[row][col] = thisData[row][col]||"";
				var thisColCount = thisData[row][col].split("\n").length;
				
				if (thisColCount>=thisKeyCount) {
					result[file[i]].translated ++;
					break;
				}
			}
			result[file[i]].length++;

		}
		if (result[file[i]].length > 0) result[file[i]].percent = result[file[i]].translated/result[file[i]].length*100;
		if (result[file[i]].percent > 100) result[file[i]].percent = 100;
		trans.project.files[file[i]].progress = result[file[i]];
	}
	
	return result;
}

trans.resetIndex = function(hardReset) {
	hardReset = hardReset || false;
	for (var id in this.project.files) {
		this.project.files[id].indexIsBuilt = false;
	}
}

trans.buildIndex = function(currentID, rebuild) {
	// building indexes for fast search KEY by ID
	// 
	//console.log("running trans.buildIndex");
	//console.log("Building index for "+currentID);
	currentID = currentID||trans.getSelectedId();
	
	
	if (currentID) {
		var currentObject = trans.project.files[currentID];
		if (currentObject.indexIsBuilt && rebuild !== true) return currentObject.indexIds;
		
		var result = {};
		for (var i=0; i<currentObject.data.length; i++) {
			//console.log("registering : "+currentObject.data[i][0]);
			if (typeof currentObject.data[i] == 'undefined') continue;
			if (currentObject.data[i][0] == null || currentObject.data[i][0] == '' || typeof currentObject.data[i][0] == 'undefined') continue;
			result[currentObject.data[i][0]] = i;
		}
		currentObject.indexIds = result;
		currentObject.indexIsBuilt = true;
		
		if (currentID == trans.getSelectedId()) {
			trans.indexIds = currentObject.indexIds;
			trans.indexIsBuilt = currentObject.indexIsBuilt;
		}
		return result;
	} else {
		if (trans.indexIsBuilt && rebuild !== true) return trans.indexIds;
	
		for (var i=0; i<trans.data.length; i++) {
			if (typeof trans.data[i] == 'undefined') continue;
			if (trans.data[i][0] == null || trans.data[i][0] == '' || typeof trans.data[i][0] == 'undefined') continue;
			trans.indexIds[trans.data[i][0]] = i;
		}
		trans.indexIsBuilt = true;
		return trans.indexIds;
	}
}

trans.findIdByIndex = function(index, currentID) {
	if (trans.data == null || trans.data == '' || typeof trans.data == 'undefined') return false;

	
	if (typeof currentID == 'undefined') {
		if (typeof trans.indexIds == 'undefined') trans.buildIndex(); 
		if (typeof trans.indexIds[index] == undefined) return false;
		return trans.indexIds[index];
	} else {
		if (trans.project.files[currentID].indexIsBuilt == false) trans.buildIndex(currentID); 
		if (typeof trans.project.files[currentID].indexIds == 'undefined') trans.buildIndex(currentID); 
		//console.log(trans.project.files[currentID].indexIds);
		if (typeof trans.project.files[currentID].indexIds[index] == 'undefined') return false;
		return trans.project.files[currentID].indexIds[index];
	}
}

/*
trans.generateTranslationTable = function(obj, options) {
	// return translation table object
	// var{key : "translation"}
	
	if (typeof obj == 'undefined') return false;
	if (typeof obj.files !== 'undefined') obj = obj.files;
	console.log("obj files inside trans.generateTranslationTable :");
	console.log(obj);
	var result = {};
	options = options||{};
	options.files = options.files||[];
	options.caseSensitive = options.caseSensitive||false; // aware of extension
	
	if (Array.isArray(options.files) == false) options.files = [options.files];
	if (options.files.length == 0) {
		for (var file in obj) {
			options.files.push(file);
		}
	}
	
	console.log("Worked option files : ");
	console.log(options.files);
	
	for (var i=0; i<options.files.length; i++) {
		var file = options.files[i];
		for (var row=0; row<obj[file].data.length; row++) {
			if (Boolean(obj[file].data[row][0]) == false) continue;
			var thisTranslation = trans.getTranslationFromRow(obj[file].data[row]);
			if (Boolean(thisTranslation) == false) continue;
			result[obj[file].data[row][0]] = thisTranslation;
		}
	}
	console.log("result is : ");
	console.log(result);
	return result;
	
}
*/

trans.generateContextTranslationPair = function(obj, options) {
	// return translation table object
	// Normal mode :
	// {key: "translation strings"}

	// 
	// only on lineByLine mode : 
	// options.fetch
	// translated, untranslated, both
	// default: translated
	console.log("Entering trans.generateTranslationTable");
	if (typeof obj == 'undefined') return false;
	if (typeof obj.files !== 'undefined') obj = obj.files;
	console.log("obj files inside trans.generateTranslationTable :");
	console.log(obj);
	var result = {};
	options = options||{};
	options.files 			= options.files||[];
	options.mode 			= options.mode||""; 
	options.fetch 			= options.fetch||"";
	options.filterTag 		= options.filterTag || [];
	options.filterTagMode 	= options.filterTagMode || "";

	if (Array.isArray(options.files) == false) options.files = [options.files];
	if (options.files.length == 0) {
		for (var file in obj) {
			options.files.push(file);
		}
	}
	
	console.log("Worked option files : ");
	console.log(options.files);	

	for (var i=0; i<options.files.length; i++) {
		var file = options.files[i];
		if (Boolean(obj[file]) == false) continue;
		for (var row=0; row<obj[file].context.length; row++) {
			if (Boolean(obj[file].context[row]) == false) continue;
			if (Boolean(obj[file].data[row]) == false) continue;
			var thisTranslation = trans.getTranslationFromRow(obj[file].data[row]);
			if (Boolean(thisTranslation) == false) thisTranslation = obj[file].data[row][trans.keyColumn];
			if (Boolean(thisTranslation) == false) continue;

			for (var contextId=0; contextId<obj[file].context[row].length; contextId++) {
				var thisContextKey = obj[file].context[row][contextId];
				result[thisContextKey] = thisTranslation;
			}
		}
	}
	console.log("translation table collection is : ");
	console.log(result);
	return result;	
}

trans.generateTranslationTable = function(obj, options) {
	// return translation table object
	// Normal mode :
	// {key: "translation strings"}
	// Line by Line mode :
	// {keyLine1: "translation line1"}
	// options.mode = default||lineByLine
	// 
	// only on lineByLine mode : 
	// options.fetch
	// translated, untranslated, both
	// default: translated
	console.log("Entering trans.generateTranslationTable");
	if (typeof obj == 'undefined') return false;
	if (typeof obj.files !== 'undefined') obj = obj.files;
	console.log("obj files inside trans.generateTranslationTable :");
	console.log(obj);
	var result = {};
	options = options||{};
	options.files = options.files||[];
	options.caseSensitive = options.caseSensitive||false; // aware of extension
	options.mode = options.mode||""; 
	options.fetch = options.fetch||"";
	options.filterTag = options.filterTag || [];
	options.filterTagMode = options.filterTagMode || "";

	if (Array.isArray(options.files) == false) options.files = [options.files];
	if (options.files.length == 0) {
		for (var file in obj) {
			options.files.push(file);
		}
	}
	
	console.log("Worked option files : ");
	console.log(options.files);
	
	// LINE BY LINE MODE
	if (options.mode.toLowerCase() == "linebyline") {
		for (var i=0; i<options.files.length; i++) {
			var file = options.files[i];
			console.log(file);
			for (var row=0; row<obj[file].data.length; row++) {
				if (Boolean(obj[file].data[row][0]) == false) continue;

				if (options.filterTagMode == "blacklist") {
					if (this.hasTags(options.filterTag, row, file)) continue;
				} else if (options.filterTagMode == "whitelist") {
					if (!this.hasTags(options.filterTag, row, file)) continue;
				}

				var thisTranslation = trans.getTranslationFromRow(obj[file].data[row]);
				if (options.fetch == "untranslated") {
					if (Boolean(thisTranslation) == true) continue;
				} else if (options.fetch == "both") {
					// do nothing
				} else {
					if (Boolean(thisTranslation) == false) continue;
				}
				
				/*
				var splitedIndex = obj[file].data[row][0].split("\n").
						map(function(input) {
							input = input||"";
							return input.replace(/\r/g, "")
						});;
				*/
				// I thin'k no need to strip \r from key element
				var splitedIndex = obj[file].data[row][0].split("\n");
				
				thisTranslation = thisTranslation||"";
				var splitedResult = thisTranslation.split("\n").
						map(function(input) {
							input = input||"";
							return input.replace(/\r/g, "")
						});						
						
				for (var x=0; x<splitedIndex.length; x++) {
					if (options.fetch == "untranslated") {
						if (Boolean(splitedResult[x]) == true) continue;
					} else if (options.fetch == "both") {
						// do nothing
					} else {
						if (Boolean(splitedResult[x]) == false) continue;
					}
					result[splitedIndex[x]] = splitedResult[x]||"";
				}

			}
		}	
		
		console.log("translation table collection is : ");
		console.log(result);
		return result;
	}
	
	
	// DEFAULT MODE!
	for (var i=0; i<options.files.length; i++) {
		var file = options.files[i];
		//console.log("Handling obj file : ", file, obj[file]);
		if (Boolean(obj[file]) == false) continue;
		for (var row=0; row<obj[file].data.length; row++) {
			if (Boolean(obj[file].data[row][0]) == false) continue;
			var thisTranslation = trans.getTranslationFromRow(obj[file].data[row]);
			if (Boolean(thisTranslation) == false) continue;
			result[obj[file].data[row][0]] = thisTranslation;
		}
	}
	console.log("translation table collection is : ");
	console.log(result);
	return result;
	
}

trans.generateTranslationTableLine = function(obj, options) {
	// return translation table object
	// Normal mode :
	// {key: "translation strings"}
	// Line by Line mode :
	// {keyLine1: "translation line1"}
	// options.mode = default||lineByLine
	// 
	// only on lineByLine mode : 
	// options.fetch
	// translated, untranslated, both
	// default: translated
	console.log("Entering trans.generateTranslationTableLine");
	if (typeof obj == 'undefined') return false;
	if (typeof obj.files !== 'undefined') obj = obj.files;
	console.log("obj files inside trans.generateTranslationTable :");
	console.log(obj);
	var result = {};
	options = options||{};
	options.files = options.files||[];
	options.caseSensitive = options.caseSensitive||false; // aware of extension
	options.mode = options.mode||""; 
	options.fetch = options.fetch||"";
	options.keyColumn = options.keyColumn||0;
	options.filterTag = options.filterTag || [];
	options.filterTagMode = options.filterTagMode || "";
	try {
		options.filterLanguage = options.filterLanguage||this.getSl()||"ja"; // japanese
	} catch(e) {
		options.filterLanguage = "ja"; // japanese
	}
	options.ignoreLangCheck = options.ignoreLangCheck||false;
	
	console.log("ignore language check?");
	console.log(options.ignoreLangCheck);
	
	if (Array.isArray(options.files) == false) options.files = [options.files];
	if (options.files.length == 0) {
		for (var file in obj) {
			options.files.push(file);
		}
	}
	
	console.log("Worked option files : ");
	console.log(options.files);
	
	for (var i=0; i<options.files.length; i++) {
		var file = options.files[i];
		console.log("fetching translatable data from:", file);
		for (var row=0; row<obj[file].data.length; row++) {
			if (Boolean(obj[file].data[row][options.keyColumn]) == false) continue;
			
			if (options.filterTagMode == "blacklist") {
				if (this.hasTags(options.filterTag, row, file)) continue;
			} else if (options.filterTagMode == "whitelist") {
				if (!this.hasTags(options.filterTag, row, file)) continue;
			}

			var thisTranslation = trans.getTranslationFromRow(obj[file].data[row], options.keyColumn);
			/*
			if (options.fetch == "untranslated") {
				if (Boolean(thisTranslation) == true) continue;
			} else if (options.fetch == "both") {
				// do nothing
			} else {
				if (Boolean(thisTranslation) == false) continue;
			}
			*/

			// I think no need to strip \r from key element
			var splitedIndex = obj[file].data[row][options.keyColumn].split("\n");
			
			thisTranslation = thisTranslation||"";
			var splitedResult = thisTranslation.split("\n").
					map(function(input) {
						input = input||"";
						return input.replace(/\r/g, "")
					});						
					
			for (var x=0; x<splitedIndex.length; x++) {
				if (options.fetch == "untranslated") {
					if (Boolean(splitedResult[x]) == true) continue;
				} else if (options.fetch == "both") {
					// do nothing
				} else {
					if (Boolean(splitedResult[x]) == false) continue;
				}
				
				if (options.ignoreLangCheck == false) {
					// skip collecting data if language doesn't match options.filterLanguage
					if (common.isInLanguage(splitedIndex[x], options.filterLanguage) == false) continue; 
				}
				
				result[splitedIndex[x]] = splitedResult[x]||"";
			}

		}
	}	
	
	console.log("result is : ");
	console.log(result);
	return result;
	
}

trans.generateTranslationTableFromString = function(input, options) {
	/*
	input can be string or array of string
	generate translation pair from string
	return : include{'source text':'translation'},
			 exclude{'filtered text':''}
	*/
	options = options||{};
	try {
		options.filterLanguage = options.filterLanguage||this.getSl()||"ja"; // japanese
	} catch(e) {
		options.filterLanguage = "ja"; // japanese
	}
	options.ignoreLangCheck = options.ignoreLangCheck||false;
	
	if (typeof input == 'string') input = [input];
	
	var result = {
		include:{},
		exclude:{}
	};
	for (var i=0; i<input.length; i++) {
		if (typeof input[i] != 'string') continue;
		if (input[i].length < 1) continue;
		var splitedIndex = input[i].replace(/(\r\n)/gm, "\n").split("\n");
		
		for (var x=0; x<splitedIndex.length; x++) {
			if (options.ignoreLangCheck == false) {
				// skip collecting data if language doesn't match options.filterLanguage
				if (common.isInLanguage(splitedIndex[x], options.filterLanguage) == false) {
					result.exclude[splitedIndex[x]] = splitedIndex[x];
					continue; 
				}
			}
			result.include[splitedIndex[x]] = "";
		}
		
	}
	
	return result;
}

trans.generateTranslationTableFromResult = function(keywordPool, translationPool, defaultTrans) {
	/*
		generate translation table from translation result
		
		keywordPool = ["keyword1", "keyword2", ... ]
		translationPool = ["translationOfKeyword1", "translationOfKeyword2", ...]
		
		result :
		translationTable
		
		{"keyword1":"translationOfKeyword1", "keyword2":"translationOfKeyword2", ...};
	*/
	
	var result = defaultTrans || {};
	for (var i=0; i<keywordPool.length; i++) {
		if (typeof translationPool[i] == 'undefined') continue;
		result[keywordPool[i]] = translationPool[i];
	}
	
	return result;
}
/**
 * Generate Translation Pair Advanced
 * @param  {} transData
 * @param  {} options
 * 
 */
trans.getTranslationData = function(transData, options) {
	/*
		Generate Translation Pair Advanced
		
		Generate translation pair from project file
		It will use relPath for group key
		result :
		{
			info : {
				groupLevel : 0 // integer
			},
			translationData: {
				[groupName] : {
					info: {
						
					},
					translationPair : {
						"key" : "translation"
						"group[separator]key" : "translation"
						
					}
				}
			}
			
		}		
		
	*/
	options = options || {}
	options.keyCol 		= options.keyCol|| 0;
	options.groupIndex 	= options.groupIndex||undefined; // index added for the translation pair prefixes
	options.groupBy 	= options.groupBy || "path";
	transData 			= transData||trans.getSaveData()	
	transData 			= JSON.parse(JSON.stringify(transData));
	transData.project 	= transData.project||{}
	transData.project.files = transData.project.files||{};
	// fix for filtertag mode inside options.options
	// this happens in export mode
	options.options 	= options.options || {};
	options.filterTag 	= options.filterTag||options.options.filterTag||[];
	options.filterTagMode = options.filterTagMode||options.options.filterTagMode||""; // whitelist or blacklist
	
	var autofillFiles = [];
	var checkbox = $(".fileList .data-selector .fileCheckbox:checked");
	for (var i=0; i<checkbox.length; i++) {
		autofillFiles.push(checkbox.eq(i).attr("value"));
	}
	options.files = options.files||autofillFiles||[];


	
	//var contextSeparator = "\n";
	var groupFactor = 3;
	/*
	var generateContextTranslation = function(row, fileId, originalWord) {
		var result = {
			length:0,
			translation:{}
		}		
		var parameters = trans.getParamatersByRow(row, fileId);
		if (!parameters) return result;
		if (!Array.isArray(parameters)) return result;
		if (parameters.length < 1) return result;

		for (var contextId=0; contextId<parameters.length; contextId++) {
			if (Boolean(parameters[contextId].translation) == false) continue;
			if (Boolean(parameters[contextId].contextStr) == false) continue;
			var contextKey = parameters[contextId].contextStr+contextSeparator+originalWord
			result.translation[contextKey] = parameters[contextId].translation;
			result.length++;
		}	
		return result;	
	}
	*/
	var transGroup = {};
	var info = {
		filterTag  : options.filterTag,
		filterTagMode : options.filterTagMode
	};

	for (var fileId in transData.project.files) {
		var thisFiles = transData.project.files[fileId];
		thisFiles.data = thisFiles.data||[[]];
		thisFiles.tags = thisFiles.tags||[];
		if (options.files.length > 0) {
			if (options.files.includes(fileId) == false) continue;
		}
		
		var thisData = {
			info:{
				groupLevel : thisFiles['groupLevel']
			},
			translationPair : {}
		}
		transGroup[thisFiles[options.groupBy]] = transGroup[thisFiles[options.groupBy]] || thisData;
		for (var row=0; row<thisFiles.data.length; row++) {
			if (Boolean(thisFiles.data[row]) == false) continue;
			if (Boolean(thisFiles.data[row][options.keyCol]) == false) continue;
			var thisTag = thisFiles.tags[row] || [];
			if (options.filterTagMode !== "") {
				var intersect = options.filterTag.filter(value => thisTag.includes(value));
				if (options.filterTagMode == "whitelist") {
					if (intersect.length == 0) continue;
				} else { // other than whitelist always asume blacklist
					if (intersect.length > 0) continue;
				}
			} 
			
			try {
				var originalWord 	= thisFiles.data[row][options.keyCol] = thisFiles.data[row][options.keyCol] || "";
				var thisTranslation = trans.getTranslationFromRow(thisFiles.data[row], options.keyCol);
				var transByContext 	= ui.translationByContext.generateContextTranslation(row, fileId, originalWord);

				if ((Boolean(thisTranslation) == false) && transByContext.length == 0) continue
				//console.log("translation found : ", thisTranslation);
				var thisKey = Boolean(thisFiles[options.groupIndex]) ? thisFiles[options.groupIndex]+contextSeparator+originalWord : originalWord
				//console.log("thisKey = ", thisKey);
				
				if (transByContext.length > 0) transGroup[thisFiles[options.groupBy]].translationPair 			= Object.assign(transGroup[thisFiles[options.groupBy]].translationPair, transByContext.translation)
				if ((Boolean(thisTranslation) !== false)) transGroup[thisFiles[options.groupBy]].translationPair[thisKey] = thisTranslation;

				// also generate translation from context translation table
				/*
				var parameters = trans.getParamatersByRow(row, fileId);
				if (!parameters) continue;
				if (!Array.isArray(parameters)) continue;
				if (parameters.length < 1) continue;
				for (var contextId=0; contextId<parameters.length; contextId++) {
					if (Boolean(parameters[contextId].translation) == false) continue;
					if (Boolean(parameters[contextId].contextStr) == false) continue;
					var contextKey = parameters[contextId].contextStr+contextSeparator+originalWord
					transGroup[thisFiles[options.groupBy]].translationPair[contextKey] = thisTranslation;
				}
				*/
			} catch (e) {
				console.log("Error when processing", fileId, "row", row, thisFiles.data[row][options.keyCol]);
				throw(e);
			}
			//console.log("at the end : ", transGroup[thisFiles[options.groupBy]]);
		}
	

	}
	
	return  {
		info:info,
		translationData:transGroup
	}
}



trans.buildContextFromParameter = function(parameter) {
	//console.log("trans.buildContextFromParameter");
	//console.log(parameter);
	return parameter['VALUE ID']+"/"+consts.eventCode[trans.gameEngine][parameter['EVENT CODE']];
}

// =====================================================================
// DATA VALIDATION & MANIPUlATION & PROJECT CREATION DATA INITIALIZATION
// =====================================================================

trans.insertCell = function(index, value) {
	value = value||null;
	batchArrayInsert(trans.data, index, value);
	if(typeof trans.project == "undefined") return trans.alert(t("请先打开或创建一个新项目!"));

	for (var file in trans.project.files) {
		if (file == trans.getSelectedId()) continue;
		batchArrayInsert(trans.project.files[file].data, index, value);
	}
}

trans.copyCol = function(from, to, project, options) {
	console.log("Copying column");
	console.log(arguments);
	options = options || {};
	project = project || trans.project;
	
	if (typeof project == 'undefined') return console.log("project is undefined");
	if (typeof project.files == 'undefined') return console.log("project.files are undefined");
	
	for (var file in project.files) {
		if (Array.isArray(project.files[file].data) == false) {
			console.log("no data for files "+file);
			continue;
		}
		for (var row in project.files[file].data) {
			project.files[file].data[row][to] = project.files[file].data[row][from];
		}
	}
	
}

trans.gridIsModified =function(flag) {
	trans.unsavedChange = flag;
	
	if (!trans.project) return false;
	var thisId = trans.getSelectedId();
	if (Boolean(trans.project.files) == false) return false;
	if (!trans.project.files[thisId]) return false;
	trans.project.files[thisId]["cacheResetOnChange"] = {};		
}
trans.walkToAllFile = function() {
	//iteratively select all files and return to the last selection
	console.log($(".fileList .selected"));
	var current = $(".fileList li").index($(".fileList .selected"));
	for (var i=0; i<$(".fileList li").length; i++) {
		$(".fileList li").eq(i).trigger("click");
	}
	$(".fileList li").eq(current).trigger("click");
	
}


trans.moveColumn = function(fromIndex, toIndex) {
	console.log("trans.moveColumn");
	console.log(arguments);
	if (typeof trans.project == 'undefined') return false;
	if (toIndex > Math.min.apply(null, fromIndex)) {
		console.log("move to rigth");
		toIndex = toIndex-1;
	}
	if (fromIndex[0] == toIndex) return false;
	if (toIndex < Math.max.apply(null, fromIndex)) {
		console.log("move to left");
	}
	ui.showBusyOverlay();
	for (var file in trans.project.files) {
		//if (file == trans.getSelectedId()) continue;
		for (var row=0; row<trans.project.files[file].data.length; row++) {
			trans.project.files[file].data[row] = arrayMoveBatch(trans.project.files[file].data[row], fromIndex, toIndex);
		}
	}
	//sorting colHeaders
	trans.colHeaders = arrayMoveBatch(trans.colHeaders, fromIndex, toIndex);
	//sorting column
	trans.column = arrayMoveBatch(trans.column, fromIndex, toIndex);
	
	
	setTimeout(function() {
		trans.grid.destroy();
		trans.initTable();
		ui.hideBusyOverlay();
	}, 250);
	trans.gridIsModified(true);
	return trans;
}

/*
trans.moveColumn = function(fromIndex, toIndex, all) {
	// from index = array(from, to)
	// toIndex = integer index destination
	console.log("fromIndexes");
	console.log(fromIndex);
	console.log("toIndex:");
	console.log(toIndex);
	all = all||false;

	if (typeof trans.project == 'undefined') return false
	currentID = trans.getSelectedId();
	//if(currentID == false) return false; 
	for (var file in trans.project.files) {
		// skipping current working data,
		// because current working data is already handled by handsontable
		if (file == currentID) continue; 
		if (file !== "Armors.json") continue;
		for (var row in trans.project.files[file].data) {
			// get moved data
			if (Array.isArray(trans.project.files[file].data[row]) == false) continue;
			console.log("===========================");
			console.log(trans.project.files[file].data[row]);
			console.log("fromIndex[0] : "+fromIndex[0]);
			console.log("fromIndex.length : "+fromIndex.length);
			
			var movedData = trans.project.files[file].data[row].slice(fromIndex[0], fromIndex[0]+fromIndex.length);
			console.log(movedData);
			console.log(trans.project.files[file].data[row]);
			//var removedData = trans.project.files[file].data[row].splice();
			
			trans.project.files[file].data[row] = insertArrayAt(trans.project.files[file].data[row], toIndex, movedData);
			console.log(trans.project.files[file].data[row]);
			
			if (toIndex <= fromIndex[0]) {
				trans.project.files[file].data[row].splice(fromIndex[0]+fromIndex.length, fromIndex.length);
			} else {
				trans.project.files[file].data[row].splice(fromIndex[0], fromIndex.length);
			}
			console.log(trans.project.files[file].data[row]);

		}
		trans.bakData = JSON.parse(JSON.stringify(trans.project.files[file]));
		trans.project.files[file] = trans.bakData;
	}
	trans.refreshGrid();
	return trans;
}
*/

trans.dataPadding = function() {
	// padding data by the length of header column
	if (typeof trans.data == 'undefined') return false;
	console.log("Trans data : ", trans.data);
	for (var i in trans.data) {
		if (Array.isArray(trans.data[i]) == false) trans.data[i] = [];
		if (trans.data[i].length >= trans.colHeaders.length) continue;
		var dif = trans.colHeaders.length - trans.data[i].length;
		if (dif < 0) continue;
		console.log("trans.data[i] : ", trans.data[i]);
		console.log("trans.data : ", trans.data[i].length);
		console.log("dif length : ", dif);
		var padding = Array(dif).fill(null);
		trans.data[i] = trans.data[i].concat(padding);
	}	
	
	if (typeof trans.project == 'undefined') return false;
	
	for (var file in trans.project.files) {
		for (var i in trans.project.files[file].data) {
			if (trans.project.files[file].data[i].length >= trans.colHeaders.length) continue;
			
			var dif = trans.colHeaders.length - trans.project.files[file].data[i].length;
			var padding = Array(dif).fill(null);
			trans.project.files[file].data[i] = trans.project.files[file].data[i].concat(padding);
		}
	}
	trans.refreshGrid();
	return trans;
}

/*
trans.sanitize = function() {
	//Sanitize data
	for (var file in trans.project.files) {
		var currentData = trans.project.files[file].data;
		var currentContext = trans.project.files[file].context||[];
		var newData = [];
		var newContext = [];
		currentData = currentData||[];
		for (var i=0; i<currentData.length; i++) {
			//remove non string value in key row
			if (typeof currentData[i][0] !== 'string') continue;
			newData.push(currentData[i]);
			newContext.push(currentContext[i]);
			
		}
		trans.project.files[file].data = newData;
		trans.project.files[file].context = newContext;		
	}
}
*/
trans.generateHeader = function(trans, prefix) {
	// generating header based on the maximum length of the data
	trans = trans || this;
	prefix = prefix || "";
	var maxLength = 0;
	for (var file in trans.project.files) {
		var currentData = trans.project.files[file].data;
		currentData = currentData||[];
		for (var i=0; i<currentData.length; i++) {
			if (Array.isArray(currentData[i]) == false) continue;
			if (currentData[i].length > maxLength) maxLength = currentData[i].length;
		}
	}
	

	for (var i=trans.colHeaders.length-1; i<maxLength; i++) {
		trans.colHeaders.push(prefix+String.fromCharCode(65+i))
		trans.columns.push({});
	}
	
	return trans.colHeaders;
}

trans.sanitize = function(trans) {
	trans = trans || this;
	console.log("running trans.sanitize");
	if (typeof trans.project == 'undefined') return false;
	if (typeof trans.project.files == 'undefined') return false;
	
	//var rowPad = JSON.parse(JSON.stringify(this.colHeaders))
	//rowPad.fill(null)
	//console.log("data of rowPad : ", rowPad);
	for (var file in trans.project.files) {
		var currentData 	= trans.project.files[file].data;
		var currentContext 	= trans.project.files[file].context||[];
		var currentTags 	= trans.project.files[file].tags||[];
		var currentParameters = trans.project.files[file].parameters||[];
		var inCache 		= {};
		var newData 		= [];
		var newContext 		= [];
		var newTags 		= [];
		var newParameters	= [];
		
		this.colHeaders = this.colHeaders||[];
		if (Array.isArray(currentData) == false) {
			// if not an array, overwrite with blank array.
			trans.project.files[file].data = [JSON.parse(JSON.stringify(this.colHeaders)).fill(null)];
			continue;
		} else if (currentData.length == 0) {
			trans.project.files[file].data = [JSON.parse(JSON.stringify(this.colHeaders)).fill(null)]; 
			continue;
		}
		
		currentData = currentData||[];
		
		for (var i=0; i<currentData.length; i++) {
			if (typeof currentData[i][0] !== 'string') continue;
			if (currentData[i][0].length < 1) continue;
			
			if (typeof inCache[currentData[i][0]] == 'undefined') {
				newData.push(currentData[i]);
				var row = newData.length - 1;
				if (currentContext[i]) 	newContext[row] = currentContext[i];
				if (currentTags[i]) 	newTags[row] 	= currentTags[i];
				if (currentParameters[i]) 	newParameters[row] 	= currentParameters[i];
				
				inCache[currentData[i][0]] = true;
			}
		}
		trans.project.files[file].data 			= newData;
		trans.project.files[file].context 		= newContext;
		trans.project.files[file].tags 			= newTags;
		trans.project.files[file].parameters 	= newParameters;
	}
	trans.project.isDuplicatesRemoved = true;
	return trans;
}

trans.removeDuplicates = function() {
	// remove duplicate entries from current trans.data
	// should be run once on initialization
	console.log("running trans.removeDuplicates");
	var inCache = {};
	var newData = [];
	for (var i=0; i<trans.data.length; i++) {
		if (typeof inCache[trans.data[i][0]] == 'undefined') {
			newData.push(trans.data[i]);
			inCache[trans.data[i]] = true;
		}
	}
	trans.data = newData;
	return trans.data;
}

trans.isKeyExistOn = function(key, fileId) {
	if (typeof fileId == 'undefined') fileId = trans.getSelectedId();
	if (typeof trans.findIdByIndex(key, fileId) == 'number') {
		return true;
	} else {
		return false;
	}
}

trans.isKeyExist = function(key) {
	//if (typeof trans.indexIds[key] == 'undefined') {
	if (typeof trans.findIdByIndex(key) == 'number') {
		return true;
	} else {
		return false;
	}
	/*
	if (typeof trans.findIdByIndex(key) == 'undefined') {
		return false;
	} else {
		return true;
	}
	*/	
}




// ============================================================
// 							TAGGING
// ============================================================


trans.setTags = function(file, row,  tags, options) {
	/* options : {
			append : boolean
		}
	*/
	options = options||{};
	if (Array.isArray(tags) == false) tags = [tags];
	if (typeof this.project == 'undefined') return false;
	if (typeof this.project.files[file] == 'undefined') return false;
	if (typeof row != 'number') return false;
	if (typeof this.project.files[file].tags == 'undefined') this.project.files[file].tags = []; 
	if (Boolean(options.append) == true) {
		this.project.files[file].tags[row] = this.project.files[file].tags[row]||[];
	
		this.project.files[file].tags[row].push.apply(this.project.files[file].tags[row], tags);
		this.project.files[file].tags[row] = this.project.files[file].tags[row].filter((v, i, a) => a.indexOf(v) === i); 
	} else {
		this.project.files[file].tags[row] = tags;
	}
	//this.grid.render();
	return this.project.files[file].tags[row];
	
}

trans.removeTags = function(file, row,  tags, options) {
	options = options||{};
	file = file||this.getSelectedId();
	
	if (Array.isArray(tags) == false) tags = [tags];
	if (typeof this.project == 'undefined') return false;
	if (typeof this.project.files[file] == 'undefined') return false;
	if (typeof row != 'number') return false;
	if (typeof this.project.files[file].tags == 'undefined') this.project.files[file].tags = []; 
	
	let arr = this.project.files[file].tags[row];
	arr = arr.filter(item => !tags.includes(item))
	
	this.project.files[file].tags[row] = arr;

	return this.project.files[file].tags[row];	
}

trans.clearTags = function(file, cellRange, options) {
	options = options||{};
	file = file||this.getSelectedId();
	if (typeof this.project == 'undefined') return false;
	if (typeof this.project.files[file] == 'undefined') return false;
	if (typeof cellRange == 'number') {
		// generate cell range
		//return this.project.files[file].tags[cellRange] = [];
		cellRange = [{
			start:{row:cellRange, col:0},
			end:{row:cellRange, col:0}
		}];
	}
	console.log("Clear tag : ", arguments);
	for (i=0; i<cellRange.length; i++) {
		var cellStart = cellRange[i].start || cellRange[i].from;
		var cellEnd = cellRange[i].end || cellRange[i].to;
		
		if (typeof cellStart.row == 'undefined') continue
		if (typeof cellEnd.row == 'undefined') continue
		
		this.project.files[file].tags = this.project.files[file].tags||[];
		for (var row=cellStart.row; row <= cellEnd.row; row++) {
			this.project.files[file].tags[row] = [];
		}
	}

	this.grid.render();
	return this.project.files[file].tags[row];	
}
trans.resetTags = function(file, options) {
	options = options||{};
	file = file||this.getSelectedId();
	if (typeof this.project == 'undefined') return false;
	if (typeof this.project.files[file] == 'undefined') return false;
	return this.project.files[file].tags = [];

	this.grid.render();
	return this.project.files[file].tags[row];	
}

trans.appendTags = function(file, row,  tags, options) {
	return this.setTags(file, row,  tags, {append:true, noRefresh:true})
}

trans.setTagForSelectedRow = function(tagName, cellRange, file, options) {
	/*	from cellRange object or from simple coords
		cellRange :[{"start":{"row":4,"col":2},"end":{"row":4,"col":2}}]
		
		or 
		
		result from trans.grid.getSelectedRange()
	*/
	options = options||{};

	if (typeof options.append == 'undefined' ) options.append = true;
	file = file||this.getSelectedId();
	if (Boolean(cellRange) == false) return false;
	if (Array.isArray(cellRange) == false) return false;
	
	for (i=0; i<cellRange.length; i++) {
		var cellStart = cellRange[i].start || cellRange[i].from;
		var cellEnd = cellRange[i].end || cellRange[i].to;
		
		if (typeof cellStart.row == 'undefined') continue
		if (typeof cellEnd.row == 'undefined') continue
		
		for (var row=cellStart.row; row <= cellEnd.row; row++) {
			this.setTags(file, row,  tagName, options);
		}
	}
	this.grid.render();
	
}

trans.removeTagForSelectedRow = function(tagName, cellRange, file, options) {
	/*	from cellRange object or from simple coords
		cellRange :[{"start":{"row":4,"col":2},"end":{"row":4,"col":2}}]
		
		or 
		
		result from trans.grid.getSelectedRange()
	*/
	options = options||{};
	options.append = options.append||true;
	file = file||this.getSelectedId();
	if (Boolean(cellRange) == false) return false;
	if (Array.isArray(cellRange) == false) return false;
	
	for (i=0; i<cellRange.length; i++) {
		var cellStart = cellRange[i].start || cellRange[i].from;
		var cellEnd = cellRange[i].end || cellRange[i].to;
		
		if (typeof cellStart.row == 'undefined') continue
		if (typeof cellEnd.row == 'undefined') continue
		
		for (var row=cellStart.row; row <= cellEnd.row; row++) {
			this.removeTags(file, row,  tagName, options);
		}
	}		
	this.grid.render();
	
}

trans.hasTags = function(tags, row, file) {
	if (!tags) return false;
	if (typeof row == 'undefined') return false;
	file = file || this.getSelectedId();
	var fileObj = this.getObjectById(file);	
	if (!fileObj) return false;
	if (!fileObj.tags) return false;
	if (!Array.isArray(fileObj.tags[row])) return false;
	if (!Array.isArray(tags)) tags = [tags]
	try {
		for (var i in tags) {
			if (fileObj.tags[row].includes(tags[i])) return true;
		}
		return false;
	} catch (e) {
		return false;
	}
}


trans.alert = function(text, timeout) {
	timeout = timeout||3000;
	$("#appInfo").attr("title", text);
	$("#appInfo").tooltip({
		content:function() {
			return text;
		},
		show: { 
			effect: "slideDown", 
			duration: 200 
		},
		hide: {
			effect: "fade",
			delay: 250
		},
		position: {
			my: "left top",
			at: "left bottom",
			of: "#table"
		},
		open: function( event, ui ) {
			setTimeout(function(){
				$("#appInfo").tooltip("close");
				$("#appInfo").attr("title", "");
			}, timeout);
		}
	});
	
	$("#appInfo").tooltip("open");
}
		
trans.refreshGrid = function(options) {
	options = options||{};
	options.rebuild = options.rebuild||false;
	
	if(trans.getSelectedId() !== false) {
		trans.data = trans.project.files[trans.getSelectedId()].data;
	}
	if (trans.data.length == 1) {
		if (Array.isArray(trans.data[0]) == false) trans.data = [[null]]
		if (Boolean(trans.data[0][0]) == false) trans.data = [[null]]
	}
	if (trans.data.length == 0) trans.data = [[null]]
	
	if(trans.getSelectedId() !== false) {
		// re assign data in to trans.project.files[trans.getSelectedId()].data
		// in case data is detached;
		trans.project.files[trans.getSelectedId()].data = trans.data;
	}	
	
	if (typeof options.onDone == 'function') {
		trans.grid.addHookOnce('afterRender', function() {
			options.onDone.call(trans.grid);	
		});	
	}
	if (options.rebuild) {
		trans.grid.destroy();
		trans.initTable();
		return true;
	}	
	trans.grid.updateSettings({
		data:trans.data,
		colHeaders: trans.colHeaders,
		columns: trans.columns		
	});	

	// TODO: for performance, should cache this:
	// https://handsontable.com/docs/comments/#basic-example
	trans.loadComments();
}
		
trans.editNoteAtCell = function(cell) {
	/*
		cel : {row : 0, col: 0}
	*/
	if (typeof cell == 'undefined') {
		try{
			cell = trans.grid.getSelectedRange()[0]['highlight'];
		} catch (error) {
			console.log(error);
			return false;
		}
	}
	var hotComment = trans.grid.getPlugin('comments');	
	hotComment.showAtCell(cell.row, cell.col);
	$(".htCommentTextArea").trigger("click");
	$(".htCommentTextArea").focus();
}	

trans.removeNoteAtSelected = function(selection) {
	console.log("trans.removeNoteAtSelected");
	if (typeof selection == 'undefined') {
		selection = trans.grid.getSelectedRange()
	};
	
	if (Boolean(selection) == false) {
		console.log("no selection were made");
		return false;
	}
	
	console.log(selection);
	var minRow = Math.min(selection[0]['from']['row'], selection[0]['to']['row']);
	var maxRow = Math.max(selection[0]['from']['row'], selection[0]['to']['row']);
	var minCol = Math.min(selection[0]['from']['col'], selection[0]['to']['col']);
	var maxCol = Math.max(selection[0]['from']['col'], selection[0]['to']['col']);
	var hotComment = trans.grid.getPlugin('comments');	
	
	for (var y=minRow; y<=maxRow; y++) {
		for (var x=minCol; x<=maxCol; x++) {
			hotComment.removeCommentAtCell(y, x);
		}
	}
	
}
		
	
		
trans.initTable = function(options) {
	options = options||{};
	
	//trans.removeDuplicates();
	var container = document.getElementById('table');
	if (Boolean(container) == false) return false;
	
	Handsontable.dom.addEvent(container, 'blur', function(event) {
		console.log("event", event);
	});	
	
	trans.grid = new Handsontable(container, {
		licenseKey	: 'non-commercial-and-evaluation',
		data		: trans.data,
		comments	: true,
		rowHeaders	: true,
		colHeaders	: trans.colHeaders,
		columns		: trans.columns,
		formulas	: false,
		search		: true,
		outsideClickDeselects:false,
		//trimWhitespace : false,
		beforeChange: function (changes, source) {
			console.log('beforeChange', arguments);
			console.log(changes);
			console.log(source);
			// changes: [0] = row; [1]=col; [2]=initial value; [3]=changed value
			if (typeof trans.selectedData == 'undefined') return console.warn("未知选定数据");
			
			for (var i=0; i<changes.length; i++) {
				if (changes[i][1] != 0) continue; // skip if not first index
				
				// reject if same key is found
				if (Boolean(changes[i][3]) == false) return false;

				if (trans.isKeyExistOn(changes[i][3])) {
					trans.alert(t("非法值")+" <b>'"+changes[i][3]+"'</b> "+t("这个值已经存在了!"));
					return false;
				}
				
				//if (typeof trans.findIdByIndex(changes[i][2]) != 'undefined') delete trans.indexIds[changes[i][2]];
				if (typeof trans.findIdByIndex(changes[i][2]) == 'number') delete trans.indexIds[changes[i][2]];
				//trans.indexIds[changes[i][3]] = changes[i][0];
				trans.selectedData.indexIds[changes[i][3]] = changes[i][0];
			}
			
		},
		afterChange: function (changes, source) {
			//console.log('afterChange');
			//console.log(changes);
			//console.log(source);
			// incoming changes is array;
			// changes[index][0] = row; changes[index][1]=col; 
			// changes[index][2]=previous value; changes[index][3] = new value;
			//console.log("afterChange");
			//console.log(arguments);
			trans.gridIsModified(true);
			if (changes == null) return true;
			if (!trans.getSelectedId()) return true;
			var isChanged = false;
			var progress = trans.project.files[trans.getSelectedId()].progress;
			for (var cell in changes) {
				if (Array.isArray(changes[cell]) == false) continue;
				if (!trans.data[changes[cell][0]][0]) continue; // do not process if first row is blank or null
				changes[cell][2]=changes[cell][2]||"";
				changes[cell][3]=changes[cell][3]||"";
				if (changes[cell][2].length>0 && changes[cell][3].length==0) {
					// removing
					if (trans.isTranslatedRow(changes[cell][0]) == false) {
						// substracting progress
						progress.translated --;
						if (progress.length > 0) {
							progress.percent = progress.translated/progress.length*100;
						} else {
							progress.percent = 0;
						}
						isChanged = true;
					}
				} else if (changes[cell][2].length==0 && changes[cell][3].length>0) {
					// adding
					if (trans.countFilledCol(changes[cell][0]) == 1) {
						// if after adding a value, translation count in this row is exactly 1, than this is new translation for this row
						// adding progress
						progress.translated ++;
						if (progress.length > 0) {
							progress.percent = progress.translated/progress.length*100;
						} else {
							progress.percent = 0;
						}
						isChanged = true;					
					}
				}
			}
			if (isChanged) {
				var result ={};
				result[trans.getSelectedId()] = progress;
				trans.evalTranslationProgress(trans.getSelectedId(), result);
			}
			
		},
		fixedColumnsLeft: 1,
		minSpareRows: 1,
		filters: false,
		dropdownMenu: false,
		autoWrapRow: true,
		manualColumnMove: true,
		//width: 806,
		//height: 487,	
		manualColumnResize: true,
		copyPaste: true,
		//contextMenu: true,
		// old context menu
		contextMenu: {
			items: {
				'commentsAddEdit': {
					hidden: function() {
						if (trans.grid.isColumnHeaderSelected()) return true;
						if (trans.grid.isRowHeaderSelected()) return true;
						return false;
					}
				},
				'commentsRemove':{
					hidden: function() {
						if (trans.grid.isColumnHeaderSelected()) return true;
						if (trans.grid.isRowHeaderSelected()) return true;
						return false;
					}
					
				},
				'translateThisCell':{
					name: function() {
						var def = "<span class='HOTMenuTranslateHere'>"+t("在这里翻译")+" <kbd>ctrl+g</kbd></span>";
						if (typeof trans.project == 'undefined') return def;
						trans.project.options = trans.project.options||{};
						var thisTrans = trans.project.options.translator||sys.config.translator||undefined;
						//if (typeof trans.project.options == 'undefined') return def;

						console.log("thisTrans", thisTrans);
						if (typeof thisTrans == 'undefined') return def;
						var from 	= trans.getSl()||"??";
						var to 		= trans.getTl()||"??";
						var thisTranslatorName = trans[thisTrans].name;
						return t("翻译在这里使用")+thisTranslatorName+" ("+from+"<i class='icon-right-bold'></i>"+to+") <kbd>ctrl+g</kbd>"
					},
					callback: function() {
						trans.translateSelection();
					},
					hidden: function() {
						if (trans.grid.isColumnHeaderSelected()) return true;
						if (trans.grid.isRowHeaderSelected()) return true;
						return false;
					}
					
				},
				'---------':{
					
				},
				'columnWidth': {
					name: t("列宽"),
					callback: function(origin, selection, e) {
						console.log("column width : ", arguments);
						var cols = common.gridSelectedCols();
						var width = prompt("Enter new width", this.getColWidth(cols[0]));
						width = parseInt(width);
						
						if (width < 1) return alert(t("宽度必须大于0"))
						
						for (var i=0; i<cols.length; i++) {
							this.setColWidth(cols[i], width)	
						}						
					},
					hidden: function() {
						if (this.isColumnHeaderSelected()) return false;
						if (this.isRowHeaderSelected()) return true;
						return true;
					}

				},				
				'sepn' :{
					name: '---------',
					hidden: function() {
						if (this.isColumnHeaderSelected()) return false;
						if (this.isRowHeaderSelected()) return true;
						return true;
					}					
				},

				'col-right': {
					name: t("向右插入列"),
					callback: function() {
						trans.grid.insertColumnRight();
					},
					hidden: function() {
						if (trans.grid.isColumnHeaderSelected()) return false;
						if (trans.grid.isRowHeaderSelected()) return true;
						return true;
					}

					//disabled: false
				},
				'duplicateCol': {
					name: t("重复列"),
					callback: function() {
						var getCol = trans.grid.getSelected()[0][1];
						var getColSet = trans.columns.length;
						var colHeaderName = trans.colHeaders[getCol]||"New Col";
						var currentData = trans.grid.getData();
						trans.columns.push({});
						arrayExchange(trans.columns, getColSet, getCol + 1);
						arrayInsert(trans.colHeaders, getCol+1, colHeaderName);
						//batchArrayInsert(trans.data, getCol+1, null);
						console.log(trans.columns);
						trans.insertCell(getCol+1, null);
						trans.copyCol(getCol, getCol+1);

						trans.grid.updateSettings({
							colHeaders:trans.colHeaders
						})

						//trans.grid.render()
					},
					hidden: function() {
						if (trans.grid.isColumnHeaderSelected())  {
							if (trans.grid.getSelected()[0][1] != trans.grid.getSelected()[0][3] || 
							trans.grid.getSelected().length > 1 ) return true;
							return false;
						}
						
						return true;
					}

					//disabled: false
				},
				'removeColumn': {
					name: t("删除此列"),
					callback: function(origin, selection, e) {
						console.log(arguments);
						var conf = confirm(t("是否删除所选列？\n这是无法挽回的！"));
						if (conf) {
							trans.removeColumn(selection[0].start.col, {refreshGrid:true});						
						}
					},
					hidden: function() {
						if (trans.grid.isColumnHeaderSelected()) return false;
						if (trans.grid.isRowHeaderSelected()) return true;
						return true;
					}

				},
				'renameColumn': {
					name: t("重命名此列"),
					callback: function(origin, selection, e) {
						console.log(arguments);
						var thisCol = selection[0].start.col;
						var colName = trans.colHeaders[thisCol];
						var conf = prompt(t("请输入新名称"), colName);
						if (conf) {
							trans.renameColumn(thisCol, conf, {refreshGrid:true});						
						}
					},
					hidden: function() {
						if (trans.grid.isColumnHeaderSelected()) return false;
						if (trans.grid.isRowHeaderSelected()) return true;
						return true;
					}
				},
				"sep0": '---------',
				'tags': {
					name:"标签",
					submenu: {
						items: [
							{
								key: 'tags:red',
								name: '<i class="tag red icon-circle"></i> '+t('红'),
								callback: function(key, selection, clickEvent) {
									trans.setTagForSelectedRow("red", selection);
								}
							},
							{
								key: 'tags:yellow',
								name: '<i class="tag yellow icon-circle"></i> '+t('黄'),
								callback: function(key, selection, clickEvent) {
									trans.setTagForSelectedRow("yellow", selection);
								}
							},
							{
								key: 'tags:green',
								name: '<i class="tag green icon-circle"></i> '+t('绿'),
								callback: function(key, selection, clickEvent) {
									trans.setTagForSelectedRow("green", selection);
								}
							},
							{
								key: 'tags:blue',
								name: '<i class="tag blue icon-circle"></i> '+t('蓝'),
								callback: function(key, selection, clickEvent) {
									trans.setTagForSelectedRow("blue", selection);
								}
							},
							{
								key: 'tags:gold',
								name: '<i class="tag gold icon-circle"></i> '+t('金'),
								callback: function(key, selection, clickEvent) {
									trans.setTagForSelectedRow("gold", selection);
								}
							},
							{
								key: 'tags:more',
								name: '<i class="tag icon-tags"></i> '+t('更多标签...'),
								callback: function(key, selection, clickEvent) {
									//setTimeout(function() {
										ui.taggingDialog(selection);
									//}, 0);									
									
								}
							},
							{
								key: 'tags:clear',
								name: '<i class="tag icon-blank"></i> '+t('清除标签'),
								callback: function(key, selection, clickEvent) {
									trans.clearTags(undefined, selection);
								}
							}
							
						]
					}
					
				},
				"sep1": '---------',
				'deleteRow': {
					name: function() {
						return t("删除行")+" <kbd>shift+del</kbd>"
					},
					callback: function(origin, selection, e) {
						var conf = confirm(t("是否要删除当前选定的行？"));
						if (!conf) return;
						trans.removeRow(trans.getSelectedId(), common.gridRangeToArray());
						trans.refreshGrid();
						trans.grid.deselectCell();
					},
					hidden: function() {
						if (trans.grid.isColumnHeaderSelected()) return true;
						if (trans.grid.isRowHeaderSelected()) return false;
						return false;
					}
				},
				'clearContextTranslation': {
					name: t("清除上下文翻译")+" <kbd>alt+del</kbd>",
					callback: function(origin, selection, e) {
						$(document).trigger("clearContextTranslationByRow", {file:trans.getSelectedId(), row:trans.grid.getSelectedRange(), type:"range"});
					},
					hidden: function() {
						if (trans.grid.isColumnHeaderSelected()) return true;
						if (trans.grid.isRowHeaderSelected()) return false;
						return false;
					}
				},				
				"sep2": '---------',
				'properties': {
					name: t("行属性"),
					callback: function(origin, selection, e) {
						console.log(arguments);
						ui.openRowProperties();
					},
					hidden: function() {
						if (trans.grid.isColumnHeaderSelected()) return true;
						if (trans.grid.isRowHeaderSelected()) return false;
						return false;
					}
				}	
				/*
				,
				"colors": { // Own custom option
					name: 'Colors...',
					submenu: {
					  // Custom option with submenu of items
					  items: [
						{
						  // Key must be in the form "parent_key:child_key"
						  key: 'colors:red',
						  name: 'Red',
						  callback: function(key, selection, clickEvent) {
							setTimeout(function() {
							  alert('You clicked red!');
							}, 0);
						  }
						},
						{ key: 'colors:green', name: 'Green' },
						{ key: 'colors:blue', name: 'Blue' }
					  ]
					}
				},
				"credits": { // Own custom property
					// Custom rendered element in the context menu
					renderer: function(hot, wrapper, row, col, prop, itemValue) {
						console.log("rendering credits");
						console.log(arguments);
						var elem = document.createElement('marquee');
						elem.style.cssText = 'background: lightgray;';
						elem.textContent = 'Brought to you by...';
						return elem;
					},
					disableSelection: true, // Prevent mouseoever from highlighting the item for selection
					isCommand: false // Prevent clicks from executing command and closing the menu
				},
				"about": { // Own custom option
					name: function () { // `name` can be a string or a function
					  return '<b>Custom option</b>'; // Name can contain HTML
					},
					hidden: function () { // `hidden` can be a boolean or a function
					  // Hide the option when the first column was clicked

					  console.log(trans.grid.isColumnHeaderSelected());
					  if (trans.grid.isColumnHeaderSelected()) return false;
					  
					  //return this.getSelectedLast()[1] == 0; // `this` === hot3
					  return true;
					},
					callback: function(key, selection, clickEvent) { // Callback for specific option
					  setTimeout(function() {
						alert('Hello world!'); // Fire alert after menu close (with timeout)
					  }, 0);
					}
				}
				*/
			}
			
		},
		
		cells: function (row, col, prop) {
			var cellProperties = {};
			if (col==0) {
				if (typeof trans.data[row] == 'undefined') return cellProperties;
				if (trans.data[row][col] !== null && trans.data[row][col]!=="") {
					cellProperties.readOnly = true;
				}
			}
		
			return cellProperties;
		},
		afterSelection: function(row, column, row2, column2, preventScrolling, selectionLayerLevel) {
			//console.log(row+","+column);
			//console.log(this.getValue());
			$(document).trigger("beforeProcessSelection", arguments);
			trans.doAfterSelection(row, column, row2, column2);

		},
		beforeInit: function() {
			console.log("running before init");
		},
		afterInit: function() {
			trans.buildIndex();
		},
		beforeColumnMove: function(columns, target) {
			console.log("beforeColumnMove");
			
			if (target == 0) return false;
			if (columns.includes(0) == true) return false;
			/*
			console.log(columns);
			console.log(target);
			trans.moveColumn(columns, target);
			*/
			trans.moveColumn(columns, target);
			return true;
		},
		afterColumnMove: function(columns, target) {
			console.log("afterColumnMove");
			
			if (target == 0) return false;
			if (columns.includes(0) == true) return false;
			
			//console.log(columns);
			//console.log(target);
			
			//trans.walkToAllFile();
			return true;
		},
		afterSetCellMeta:  function(row, col, source, val){
			console.log(arguments);

			
			if(source == 'comment'){
				var thisData = trans.getSelectedObject();
				if (!thisData) return true;
				
				if (val == undefined) {
					console.log("deleting comment");
					try {
						delete thisData.comments[row][col];
					}
					catch(err) {
						console.log("unable to delete comment.\nData row:"+row+", col:"+col+" is not exist on trans.project.files[trans.getCurrentID].comments!");
					}					
					return true;
				} else {
					console.log("editing comment");
					thisData.comments = thisData.comments||[];
					thisData.comments[row] = thisData.comments[row]||[];
					thisData.comments[row][col] = val.value;
					return true;
				}
				
			}
			
		},
		afterRender:function(isForced) {
			if (isForced == true) return true; // natural render

			if ($("#currentCellText").is(":focus")) {
				//console.log("eval focus");
				var visibleCell = ui.getCurrentEditedCellElm();
				if (visibleCell !== false) {
					$("#table .currentCell").removeClass("currentCell");
					visibleCell.addClass("currentCell"); 
				}
			}			
		},
		
		afterRenderer:function(TD, row, column, prop, val, cellProperties) {
			// fired after each cell rendered
			// for performance do not put too much thing here
			
			if (typeof trans.selectedData == 'undefined') return;
			if (Array.isArray(trans.selectedData.tags) == false) return;
			if (Array.isArray(trans.selectedData.tags[row]) == false) return;
			if (column > 0) return; // only render tag for the first column ... the rest is same
			var $thisTR = $(TD).closest("tr");
			if ($thisTR.hasClass("tagRendered") == true) return;
			
			var $thisTH = $thisTR.find("th");
			let shadowPart = [];
			let borderOffset = 0;
			for (var i=0; i<trans.selectedData.tags[row].length; i++) {
				//console.log($thisTR.find("th"));
				var segmTag = trans.selectedData.tags[row][i];
				if (typeof consts.tagColor[segmTag] !== 'undefined') {
					borderOffset+=consts.tagStripThickness;
					shadowPart.push('inset '+borderOffset+'px 0px 0px 0px '+consts.tagColor[segmTag]);
				}
				$thisTH.addClass("tag-"+trans.selectedData.tags[row][i]);
			}
			if (shadowPart.length != 0) {
				$thisTH.css("box-shadow", shadowPart.join(","));
			}
			$thisTR.addClass("hasTag");
			$thisTR.addClass("tagRendered");
			//console.log($thisTR);
		},
		afterCreateRow:function(index, amount, source) {
			var thisFile = trans.getSelectedId();
			if (Boolean(thisFile) == false) return false;
			trans.evalTranslationProgress([thisFile]);
		},
		beforePaste:function(data, coords) {
			//console.log("beforePaste triggered");
			//console.log(coords);
			//console.log(arguments);
		},
		afterScrollVertically() {
			// some part of the bottom most part are sometimes clipped, and no further scrolling is possible
			// while some data are hidden beyound scrollable area
			// this is the hackish solution for that.
			if (this._scrollTimer) clearTimeout(this._scrollTimer) 
			this._scrollTimer = setTimeout(()=> {
				if ($("#table .wtHolder>*:eq(0)").height() - $("#table .wtHolder").scrollTop() - $("#table .wtHolder").height() <= 0) {
					//console.log("reached bottom");
					this.render();
				}
			}, 500)
		}
		
	});
	
	
	Handsontable.dom.addEvent($("#quickFind")[0], 'input', function (event) {
	  var search = trans.grid.getPlugin('search');
	  var queryResult = search.query(this.value);

	  console.log(queryResult);
	  trans.grid.render();
	});	
	
	trans.grid.isColumnHeaderSelected = function() {
		/*
		var dataLengh = trans.grid.getData().length;
		var selection = trans.grid.getSelected();
		if (typeof selection == 'undefined') return false;
		selection = selection[0];
		var selRange = (selection[2]-selection[0])+1;	
		if (selRange >= dataLengh) return true;
		return false;
		*/
		return Boolean($(".htCore thead th.ht__active_highlight").length);
	}	
	trans.grid.isRowHeaderSelected = function() {
		return Boolean($(".htCore tr th.ht__active_highlight").length);
	}	
	
	trans.grid.insertColumnRight = function(colName, pos) {
		colName = colName||"New Col";
		var getCol = pos||trans.grid.getSelected()[0][1];
		var getColSet = trans.columns.length;
		trans.columns.push({});
		arrayExchange(trans.columns, getColSet, getCol + 1);
		arrayInsert(trans.colHeaders, getCol+1, colName);
		//batchArrayInsert(trans.data, getCol+1, null);
		console.log(trans.columns);
		trans.insertCell(getCol+1, null);

		trans.grid.updateSettings({
			colHeaders:trans.colHeaders
		})
	}
	
	trans.grid.setColWidth = function(colIndex, newWidth) {
		/*
		console.log(this);
		var settings = [];
		for (var i=0; i<this.getColHeader().length; i++) {
			if (i == colIndex) {
				settings[i] = newWidth;
				continue;
			}
			settings[i] = this.getColWidth(i);
		}
		console.log("settings", settings);
		this.updateSettings({
			colWidths: settings
		})
		*/
		if (!trans.columns[colIndex]) return;
		trans.columns[colIndex].width = newWidth;
		trans.refreshGrid();
	}

}

/*
hot2.updateSettings({
  cells: function (row, col) {
    var cellProperties = {};

    if (hot2.getData()[row][col] === 'Nissan') {
      cellProperties.readOnly = true;
    }

    return cellProperties;
  }
});
*/

trans.findAndInsert = function(find, values, columns, options) {
	// find key "find", put "values" to coloumn with index "columns" 
	// to all files inside trans.project.files	
	//console.log("entering trans.findAndInsert");
	columns = columns||1;
	options = options||{};
	options.overwrite = options.overwrite||false;
	options.files = options.files||[];
	options.ignoreNewLine = options.ignoreNewLine||false;
	
	//console.log("incoming parameters : ");
	//console.log(arguments);
	
	if (options.files.length == 0) { // that means ALL!
		for (var file in trans.project.files) {
			if (options.ignoreNewLine) {
				if (Boolean(trans.project.files[file].lineBreak) !== false) {
					find = common.replaceNewLine(find, trans.project.files[file].lineBreak);
				}
			}
			
			var row = trans.findIdByIndex(find, file);
			
			if (row !== false) {
				if (options.filterTagMode == "blacklist") {
					if (this.hasTags(options.filterTag, row, file)) continue;
				} else if (options.filterTagMode == "whitelist") {
					if (!this.hasTags(options.filterTag, row, file)) continue;
				}
				
				if (options.overwrite == false) {
					if (Boolean(trans.project.files[file].data[row][columns]) == true) continue;
				}
				trans.project.files[file].data[row][columns] = values;
			}
		}
	} else {
		for (var i=0; i<options.files.length; i++) {
			file = options.files[i];
			//console.log('looking up : '+files);
			if (options.ignoreNewLine) {
				if (Boolean(trans.project.files[file].lineBreak) !== false) {
					find = common.replaceNewLine(find, trans.project.files[file].lineBreak);
				}
			}			
			var row = trans.findIdByIndex(find, file);
			if (row !== false) {
				if (options.filterTagMode == "blacklist") {
					if (this.hasTags(options.filterTag, row, file)) continue;
				} else if (options.filterTagMode == "whitelist") {
					if (!this.hasTags(options.filterTag, row, file)) continue;
				}

				if (options.overwrite == false) {
					if (Boolean(trans.project.files[file].data[row][columns]) == true) continue;
				}
				trans.project.files[file].data[row][columns] = values;
			}
		}
	}
}

trans.findAndInsertLine = function(find, values, columns, options) {
	// find key "find", put "values" to coloumn with index "columns" 
	// to all files inside trans.project.files	
	columns 			= columns||1;
	options 			= options||{};
	options.overwrite 	= options.overwrite||false;
	options.files 		= options.files||[];
	options.keyColumn 	= options.keyColumn||0;
	options.newLine 	= options.newLine||undefined;
	options.stripCarriageReturn = options.stripCarriageReturn||false;
	
	if (options.stripCarriageReturn) {
		find = common.stripCarriageReturn(find);
	}
	
	if (options.files.length == 0) { // that means ALL!
		if (typeof trans.allFiles != 'undefined') {
			options.files = trans.allFiles;
		} else {
			for (var file in trans.project.files) {
				options.files.push(file);
			}
			trans.allFiles = options.files;
		}
	}
	for (var i=0; i<options.files.length; i++) {
		file = options.files[i];
		var thisData = trans.project.files[file].data;
		var thisNewLine = options.newLine||trans.project.files[file].lineBreak;
		for (var row=0; row<thisData.length; row++) {
			if (!thisData[row][options.keyColumn]) continue;
			
			if (options.filterTagMode == "blacklist") {
				if (this.hasTags(options.filterTag, row, file)) continue;
			} else if (options.filterTagMode == "whitelist") {
				if (!this.hasTags(options.filterTag, row, file)) continue;
			}

			thisData[row][options.keyColumn] = thisData[row][options.keyColumn]||"";
			if (options.stripCarriageReturn) {
				var keySegment = thisData[row][options.keyColumn].split("\n").map(function(input) {
										return common.stripCarriageReturn(input);
									});
			} else {	
				var keySegment = thisData[row][options.keyColumn].split("\n");
			}
			var keyPos = keySegment.indexOf(find);
			if (keyPos == -1) continue;					
			thisData[row][columns] = thisData[row][columns]||"";
			var targetSegment =	thisData[row][columns].split("\n").map(function(input) {
									return common.stripCarriageReturn(input);
								});
			
			targetSegment = common.searchReplaceArray(keySegment, targetSegment, find, values, {overwrite:options.overwrite});
			thisData[row][columns] = targetSegment.join(thisNewLine);
		}

	}
}

/**
 * find key "find", put "values" to coloumn with index "columns" 
 * to all files inside trans.project.files	
 * @param  {} find
 * @param  {} values
 * @param  {} columns
 * @param  {} options
 */
trans.findAndInsertByContext = function(find, values, columns, options) {
	//console.log("trans.findAndInsertByContext:", arguments);
	columns 			= columns||1;
	options 			= options||{};
	options.overwrite 	= options.overwrite||false;
	options.files 		= options.files||[];
	options.ignoreNewLine = options.ignoreNewLine||false;
	
	if (options.files.length == 0) { // that means ALL!
		options.files = this.getAllFiles();
	}

	for (var i=0; i<options.files.length; i++) {
		file = options.files[i];
		var thisObj = this.getObjectById(file);
		if (Boolean(thisObj) == false) continue;
		if (Boolean(thisObj.context) == false) continue;

		for (var row=0; row<thisObj.context.length; row++) {
			var contextByRow = thisObj.context[row];
			if (Array.isArray(contextByRow) == false) continue;
			if (contextByRow.length < 1) continue;
			if (Array.isArray(thisObj.data[row]) == false) continue;
			for (var contextId=0; contextId<contextByRow.length; contextId++) {
				if (find !== contextByRow[contextId]) continue;
				// match found! assign value
				if (options.overwrite == false) {
					if (Boolean(thisObj.data[row][columns]) == true) continue;
				}				
				thisObj.data[row][columns] = values;
			}
		}
	}
}


trans.translateTextByLine = function(text, translationPair, options) {
	/*
		translating text line by line by translationPair
		text : multilined text
		translationPair: object : {"key":"translation"}
		
		output: translated text
		
		todo : make line break type match original text
	*/
	//console.log("trans.translateTextByLine", arguments);
	if (typeof text !== 'string') return text;
	if (text.length < 1) return text;
	
	// Up to ver 3.8.21 blank text will returns original text
	//var translated = text;
	var translated = "";
	var translatedLine = [];
	var lines = text.replace(/(\r\n)/gm, "\n").split("\n");
	for (var i=0; i<lines.length; i++) {
		var line = lines[i];
		if (Boolean(translationPair[line])) {
			translatedLine.push(translationPair[line]);
			continue;
		}

		// Up to ver 3.8.21 blank text will returns original text
		//translatedLine.push(line);
		translatedLine.push("");
	}
	//console.log("translatedLine:", translatedLine);
	translated = translatedLine.join("\n");
	
	//console.log("Result of trans.translateTextByLine", translated);
	return translated;
	
}

trans.translateFromArray = function(obj, columns, options) {
	// translate from array obj
	//console.log("insert trans.translateFromArray");
	//console.log("options : ");
	//console.log(options);
	columns = columns||1;
	options = options||{};
	options.sourceColumn = options.sourceColumn||"auto";
	options.overwrite = options.overwrite||false;
	options.files = options.files||[];
	options.sourceKeyColumn = options.sourceKeyColumn||0;
	options.keyColumn = options.keyColumn||0;
	options.newLine = options.newLine||undefined;
	options.stripCarriageReturn = options.stripCarriageReturn||false;
	options.ignoreNewLine = true; // let's set to true;
	//options.translationMethod = options.translationMethod||false;
	
	obj = obj||[];
	console.log("translating from this array :");
	console.log(obj);
	if (obj.length == 0) return false;
	
	for (var rowId=0; rowId<obj.length; rowId++) {
		var row = obj[rowId];
		if (Boolean(row[options.sourceKeyColumn]) == false) continue;
		
		var keyString = row[options.sourceKeyColumn];
		if (options.sourceColumn == 'auto') {
			var translation = trans.getTranslationFromRow(row, options.sourceKeyColumn);
		} else {
			var translation = row[options.sourceColumn];
		}
		//trans.findAndInsert = function(find, values, columns, options)
		trans.findAndInsert(keyString, translation, columns, options);
	}
}


trans.abortTranslation = function() {
	trans.translator = trans.translator||[];
	for (var i=0; i<trans.translator.length; i++) {
		if (typeof trans.translationTimer !== 'undefined') {
			clearTimeout(trans.translationTimer);
		}		
		translator = trans.translator[i];
		trans[translator].job = trans[translator].job||{};
		trans[translator].job.wordcache = {};
		trans[translator].job.batch = [];
	}
	ui.hideLoading();
	trans.refreshGrid();
	trans.evalTranslationProgress();
	
}

trans.translateStringByPair = function(str, translationPair, caseInSensitive) {
	caseInSensitive = caseInSensitive||false;
	if (typeof str !== 'string') return str;
	if (typeof translationPair !== 'object') return str;
	for (var key in translationPair) {
		str = str.replaces(key, translationPair[key], caseInSensitive);
	}	
	return str;
}

trans.translateByReference = function(input, caseInSensitive) {
	caseInSensitive = caseInSensitive||false;
	//data = JSON.parse(JSON.stringify(input));
	
	trans.project.files["Common Reference"]["cacheResetOnChange"] = trans.project.files["Common Reference"]["cacheResetOnChange"]||{};
	if (Boolean(trans.project.files["Common Reference"]["cacheResetOnChange"]["transPair"])!== false) {
		console.log("load translation pair from cache");
		var transPair = trans.project.files["Common Reference"]["cacheResetOnChange"]["transPair"];
	} else {
		var transPair = trans.generateTranslationPair(trans.project.files["Common Reference"].data);
		trans.project.files["Common Reference"]["cacheResetOnChange"]["transPair"] = transPair;
	}
	console.log("Translate by reference pair :", transPair);
	
	if (typeof input == 'string') {
		var output = trans.translateStringByPair(input, transPair, caseInSensitive);
		return output;
	} else if (Array.isArray(input)){
		var output = [];
		for (var i=0; i<input.length; i++) {
			output[i] = trans.translateStringByPair(input[i], transPair, caseInSensitive);
		}
		return output;
		
	}
	return input;
}

trans.translateAll = function(translator, options) {
	// Todo :
	// determine translation by options
	trans.translateAllByLines(translator, options);
}

trans.translateAllByRows = async function(translator, options) {
	// TRANSLATE ALL
	console.log("Running trans.translateAll");
	ui.loadingProgress(0, "Running trans.translateAll");
	var thisTranslator = this.getTranslatorEngine(translator);
	if (typeof trans.project == 'undefined') return trans.alert(t("无法处理，项目未找到"));
	if (typeof trans.project.files == 'undefined') return trans.alert(t("无法处理，没有找到数据"));
 	if (typeof thisTranslator == 'undefined')  return trans.alert(t("翻译引擎未找到"));
 	if (thisTranslator.isDisabled)  return trans.alert(t("翻译引擎")+translator+t("已禁用！"));
	
	if (!trans.getSelectedId()) {
		trans.selectFile($(".fileList .data-selector").eq(0));
	}
	
	
	options = options||{};
	options.onFinished = options.onFinished||function() {};
	
	
	// COLLECTING DATA
	thisTranslator.job = thisTranslator.job||{};
	thisTranslator.job.wordcache = {};
	thisTranslator.job.batch = [];
	thisTranslator.batchDelay = thisTranslator.batchDelay||trans.config.batchDelay;
	
	// CALCULATING max request length
	var currentMaxLength = trans.config.maxRequestLength;
	if (thisTranslator.maxRequestLength < currentMaxLength) currentMaxLength = thisTranslator.maxRequestLength;
	
	// SHOW loading bar
	ui.showLoading({
		buttons:[{
			text:"Abort",
			onClick: function(e) {
				var sure = confirm(t("您确定要中止此过程吗？"));
				if (sure) trans.abortTranslation();
			}
		},
		{
			text:"Pause",
			onClick: function(e) {
				alert(t("进程暂停！\n按确认继续！"));

			}
		}
		]
	});
	
	console.log("Current maximum request length : "+currentMaxLength);
	console.log("Start collecting data!");
	ui.loadingProgress(0, "开始收集数据！");	
	
	var currentBatchID = 0;
	var currentRequestLength = 0;
	
	// collecting selected row
	var selectedFiles = trans.getCheckedFiles();
	ui.loadingProgress(undefined, t("所选文件：")+selectedFiles.join(", "));	
	
	//for (var file in trans.project.files) {
	for (var thisIndex in selectedFiles) {
		var file = selectedFiles[thisIndex];
		ui.loadingProgress(undefined, t("从以下方面收集数据：")+file);	
		
		var currentData = trans.project.files[file].data;
		
		if (typeof thisTranslator.job.batch[currentBatchID] == 'undefined') thisTranslator.job.batch[currentBatchID] = [];
		
		for (var i=0; i< currentData.length; i++) {
			var currentSentence = currentData[i][0];
			var escapedSentence = str_ireplace($DV.config.lineSeparator, thisTranslator.lineSubstitute, thisTranslator.escapeCharacter(currentSentence));
			if (Boolean(currentSentence)) {
			console.log("Current sentence length : "+currentSentence.length);
			console.log("Escaped sentence length : "+escapedSentence.length);
			}
			// skiping when empty
			if (currentSentence == null) continue;
			if (currentSentence == "") continue;
			
			// make each line unique
			if (typeof thisTranslator.job.wordcache[currentSentence] !== 'undefined') {
				continue;
			} else {
				thisTranslator.job.wordcache[currentSentence] = true;
			}
			
			// skip line that already translated
			if (thisTranslator.skipTranslatedOnBatch == true) {
				var skip = false;
				for (var col=1; col<currentData[i].length; col++) {
					if (currentData[i][col] !== null && currentData[i][col] !== "" && typeof currentData[i][col] !== "undefined") {
						skip = true;
						break;
					}
				}
				if (skip == true) continue;
			}
			
			if (currentSentence.trim().length == 0) continue;
			//if (currentSentence.length > currentMaxLength) {
			if (escapedSentence.length > currentMaxLength) {
				console.log('current sentence is bigger than maxRequestLength!');
				currentBatchID++;
				thisTranslator.job.batch[currentBatchID] = thisTranslator.job.batch[currentBatchID]||[];
				thisTranslator.job.batch[currentBatchID].push(currentSentence);
				currentBatchID++;
				currentRequestLength = 0;
				continue;
			}
			//if (currentSentence.length+currentRequestLength > currentMaxLength) {
			if (escapedSentence.length+currentRequestLength > currentMaxLength) {
				currentBatchID++;
				thisTranslator.job.batch[currentBatchID] = thisTranslator.job.batch[currentBatchID]||[];
				thisTranslator.job.batch[currentBatchID].push(currentSentence);
				currentRequestLength = 0;
				continue;
		
			}
			
			thisTranslator.job.batch[currentBatchID] = thisTranslator.job.batch[currentBatchID]||[];
			thisTranslator.job.batch[currentBatchID].push(currentSentence);
			//currentRequestLength += currentSentence.length;
			currentRequestLength += escapedSentence.length;
		}
	}
	
	thisTranslator.job.batchLength = thisTranslator.job.batch.length;
	ui.loadingProgress(0, "收集数据完成！");	
	
	console.log("Collecting data done!");
	console.log("We have "+thisTranslator.job.batch.length+" batch totals!");
	console.log("==========================================");
	console.log("Begin translating using "+translator+"!");
	
	
	var processPart = async function() {
		if (typeof thisTranslator.job.batch == 'undefined') return "批量作业未定义，退出！";
		if (thisTranslator.job.batch.length < 1) {
			console.log("Batch job is finished");
			trans.refreshGrid();
			trans.evalTranslationProgress();
			if (typeof options.onFinished == 'function') {
				options.onFinished.call(this);
			}
			ui.loadingProgress(100, t("翻译完毕"));
			//ui.hideLoading();
			ui.loadingClearButton();
			ui.showCloseButton();
			trans.translationTimer = undefined;
			return "批处理工作完成了！";
		}
		console.log("running processPart");
		
		var currentData = thisTranslator.job.batch.pop();
		
		console.log("current data : ");
		console.log(currentData);
		//thisTranslator.test(currentData, {
		var preTransData = trans.translateByReference(currentData);
			
		thisTranslator.translate(preTransData, {
			mode: "rowByRow",
			onAfterLoading:function(result) {
				console.log(result);
				if (typeof result.translation !== 'undefined') {
					console.log("applying translation to table !");
					console.log("calculating progress");
					var percent = thisTranslator.job.batch.length/thisTranslator.job.batchLength*100;
					percent = 100-percent;
					ui.loadingProgress(percent, t("将翻译应用于表格！"));	
					
					for (var index in result.translation) {
						//trans.findAndInsert(result.source[index], result.translation[index], thisTranslator.columnIndex);
						trans.findAndInsert(currentData[index], 
							result.translation[index], 
							thisTranslator.columnIndex, 
							{
								filterTag : options.filterTag || [],
								filterTagMode: options.filterTagMode
							});
						//trans.data[rowPool[x]][trans[currentPlugin].columnIndex] = result.translation[x];
					}
					
					ui.loadingProgress(undefined, (thisTranslator.job.batchLength-thisTranslator.job.batch.length)+"/"+thisTranslator.job.batchLength+"批处理完毕，等待"+thisTranslator.batchDelay+" ms...");	
					trans.translationTimer = setTimeout(function(){ processPart(); }, thisTranslator.batchDelay);
					
				}
				//trans.refreshGrid();
				//trans.grid.render();
			},
			onError:function(evt, type, errorType) {
					console.log("ERROR on transling data");
					var percent = thisTranslator.job.batch.length/thisTranslator.job.batchLength*100;
					percent = 100-percent;
					ui.loadingProgress(percent, 
						t("翻译数据时出错！")+"\r\n"+
						t("\tHTTP状态：")+evt.status+"\r\n"+
						t("\t错误类型：")+errorType+"\r\n"+
						t("你可能会被你的翻译服务暂时禁止！\r\n请适度使用在线翻译服务\r\n这通常会在一两天内自行解决。\r\n"));	
					ui.loadingProgress(undefined, (thisTranslator.job.batchLength-thisTranslator.job.batch.length)+"/"+thisTranslator.job.batchLength+t("批量完成，")+t("等待")+thisTranslator.batchDelay+t(" ms..."));	
					trans.translationTimer = setTimeout(function(){ processPart(); }, thisTranslator.batchDelay);
				
			}
		});
	}
	processPart();
	
}


trans.translateAllByLines = async function(translator, options) {
	// TRANSLATE ALL
	console.log("Running trans.translateAll", arguments);
	ui.loadingProgress(0, t("运行 trans.translateAll"));	
	var thisTranslator = this.getTranslatorEngine(translator);	
	if (typeof trans.project == 'undefined') return trans.alert(t("无法处理，找不到项目"));
	if (typeof trans.project.files == 'undefined') return trans.alert(t("无法处理，找不到数据"));
 	if (typeof thisTranslator == 'undefined')  return trans.alert(t("找不到翻译引擎"));
 	if (thisTranslator.isDisabled)  return trans.alert(t("翻译引擎")+translator+t("已禁用！"));
	
	if (!trans.getSelectedId()) {
		trans.selectFile($(".fileList .data-selector").eq(0));
	}
	
	
	options 				= options||{};
	options.onFinished 		= options.onFinished||function() {};
	options.keyColumn 		= options.keyColumn||0;
	options.translateOther 	= options.translateOther|| false;
	options.ignoreTranslated= options.ignoreTranslated || false;
	
	var fetchMode = "untranslated"
	if (options.ignoreTranslated) {
		fetchMode = "both"
	}
	
	// COLLECTING DATA
	thisTranslator.job = thisTranslator.job||{};
	thisTranslator.job.wordcache = {};
	thisTranslator.job.batch = [];
	thisTranslator.batchDelay = thisTranslator.batchDelay||trans.config.batchDelay;
	
	// CALCULATING max request length
	var currentMaxLength = trans.config.maxRequestLength;
	if (thisTranslator.maxRequestLength < currentMaxLength) currentMaxLength = thisTranslator.maxRequestLength;
	
	// SHOW loading bar
	ui.showLoading({
		buttons:[{
			text:"Abort",
			onClick: function(e) {
				var sure = confirm(t("您确定要中止此过程吗？"));
				if (sure) trans.abortTranslation();
			}
		},
		{
			text:"Pause",
			onClick: function(e) {
				alert(t("进程暂停！\n按确定继续！"));

			}
		}
		]
	});
	
	console.log("Current maximum request length : "+currentMaxLength);
	console.log("Start collecting data!");
	ui.loadingProgress(0, t("开始收集数据！"));	
	
	var currentBatchID = 0;
	var currentRequestLength = 0;
	
	// collecting selected row
	var selectedFiles = trans.getCheckedFiles();
	ui.loadingProgress(undefined, t("所选文件：")+selectedFiles.join(", "));		
	
	var transTable = trans.generateTranslationTableLine(trans.project, {
			files	:selectedFiles, 
			mode	:"lineByLine", 
			fetch	:fetchMode,
			keyColumn:options.keyColumn,
			filterLanguage:this.getSl(),
			filterTag : options.filterTag || [],
			filterTagMode: options.filterTagMode
		});
	console.log("Fetch mode : ", fetchMode);
	console.log("Translatable : ", transTable);


	var currentBatchID = 0;
	var currentRequestLength = 0;
	
	for (var translateKey in transTable) {
		thisTranslator.job.batch[currentBatchID] = thisTranslator.job.batch[currentBatchID]||[];
		
		
		var currentSentence = translateKey;
		var escapedSentence = str_ireplace($DV.config.lineSeparator, thisTranslator.lineSubstitute, thisTranslator.escapeCharacter(currentSentence));
		/*
		if (Boolean(currentSentence)) {
			console.log("Current sentence length : "+currentSentence.length);
			console.log("Escaped sentence length : "+escapedSentence.length);
		}
		*/
		// skiping when empty
		if (Boolean(currentSentence) == false) continue;
		if (typeof currentSentence !== 'string') continue;
		if (currentSentence.trim().length == 0) continue;

		if (escapedSentence.length > currentMaxLength) {
			console.log('current sentence is bigger than maxRequestLength!');
			currentBatchID++;
			thisTranslator.job.batch[currentBatchID] = thisTranslator.job.batch[currentBatchID]||[];
			thisTranslator.job.batch[currentBatchID].push(currentSentence);
			currentBatchID++;
			currentRequestLength = 0;
			continue;
		}

		if (escapedSentence.length+currentRequestLength > currentMaxLength) {
			currentBatchID++;
			thisTranslator.job.batch[currentBatchID] = thisTranslator.job.batch[currentBatchID]||[];
			thisTranslator.job.batch[currentBatchID].push(currentSentence);
			currentRequestLength = 0;
			continue;
	
		}
		
		thisTranslator.job.batch[currentBatchID] = thisTranslator.job.batch[currentBatchID]||[];
		thisTranslator.job.batch[currentBatchID].push(currentSentence);
		//currentRequestLength += currentSentence.length;
		currentRequestLength += escapedSentence.length;
	}
	
	// cleaning up transTable for RAM friendly
	transTable = undefined;


	thisTranslator.job.batchLength = thisTranslator.job.batch.length;
	ui.loadingProgress(0, t("收集数据完成！"));	
	
	console.log("Collecting data done!");
	console.log("We have "+thisTranslator.job.batch.length+" batch totals!");
	console.log("==========================================");
	console.log("Begin translating using "+translator+"!");
	
	
	
	var processPart = async function() {
		if (typeof thisTranslator.job.batch == 'undefined') return "批量作业未定义，退出！";
		if (thisTranslator.job.batch.length < 1) {
			console.log("Batch job is finished");
			// filling skipped translation

			var selectedObj = [];
			if (options.translateOther == false) selectedObj = trans.getCheckedFiles();
			trans.fillEmptyLine(selectedObj, [], thisTranslator.columnIndex, options.keyColumn, {
				lineFilter : function(str) {
					return !common.isInLanguage(str, trans.getSl());
				},
				fromKeyOnly: options.ignoreTranslated,
				filterTag : options.filterTag || [],
				filterTagMode: options.filterTagMode
			});
			
			
			trans.refreshGrid();
			trans.evalTranslationProgress();
			if (typeof options.onFinished == 'function') {
				options.onFinished.call(this);
			}
			ui.loadingProgress(100, t("翻译完毕"));
			//ui.hideLoading();
			ui.loadingClearButton();
			ui.showCloseButton();
			trans.translationTimer = undefined;
			return "批处理工作完成了！";
		}
		
		var translatePart = async function() {
			console.log("running processPart");
			var selectedObj = [];
			if (options.translateOther == false) selectedObj = trans.getCheckedFiles();
			trans.fillEmptyLine(selectedObj, [], thisTranslator.columnIndex, options.keyColumn, {
				lineFilter : function(str) {
					return !common.isInLanguage(str, trans.getSl());
				},
				fromKeyOnly: options.ignoreTranslated,
				filterTag : options.filterTag || [],
				filterTagMode: options.filterTagMode
			});
	
			var currentData = thisTranslator.job.batch.pop();
			console.log("current data : ");
			console.log(currentData);
			//thisTranslator.test(currentData, {
			
			//console.log("Table situation before trans.translateByReference", JSON.stringify(trans.project.files["data/Armors.json"].data, undefined, 2));
			var preTransData = trans.translateByReference(currentData);
			//console.log("Table situation after trans.translateByReference", JSON.stringify(trans.project.files["data/Armors.json"].data, undefined, 2));
			
			thisTranslator.translate(preTransData, {
				onAfterLoading:function(result) {
					console.log(result);
					if (typeof result.translation !== 'undefined') {
						console.log("applying translation to table !");
						console.log("calculating progress");
						var percent = thisTranslator.job.batch.length/thisTranslator.job.batchLength*100;
						percent = 100-percent;
						ui.loadingProgress(percent, t("将翻译应用于表格！"));	
						
						for (var index in result.translation) {
							//console.log("Running trans.findAndInsertLine");
							//console.log(currentData[index]);
							//console.log(result.translation[index]);
							//console.log(thisTranslator.columnIndex);
							
							//console.log("Table situation before findAndInsertLine", JSON.stringify(trans.project.files["data/Armors.json"].data, undefined, 2));
							trans.findAndInsertLine(currentData[index], result.translation[index], thisTranslator.columnIndex, {
								files:selectedObj,
								keyColumn:options.keyColumn,
								stripCarriageReturn:true,
								filterTag : options.filterTag || [],
								filterTagMode: options.filterTagMode
							});
						}
						
						//ui.loadingProgress(undefined, (thisTranslator.job.batchLength-thisTranslator.job.batch.length)+"/"+thisTranslator.job.batchLength+" batch done, waiting "+thisTranslator.batchDelay+" ms...");	
						ui.loadingProgress(undefined, (thisTranslator.job.batchLength-thisTranslator.job.batch.length)+"/"+thisTranslator.job.batchLength+"完成了！");	
						processPart();
						
					}
				},
				onError:function(evt, type, errorType) {
						console.log("ERROR on transling data");
						var percent = thisTranslator.job.batch.length/thisTranslator.job.batchLength*100;
						percent = 100-percent;
						ui.loadingProgress(percent, 
							t("翻译数据时出错！")+"\r\n"+
							t("\tHTTP状态：")+evt.status+"\r\n"+
							t("\t错误类型：")+errorType+"\r\n"+
							t("你可能会被你的翻译服务暂时禁止！\r\n请适度使用在线翻译服务\r\n这通常会在一两天内自行解决。\r\n"));	
						ui.loadingProgress(undefined, (thisTranslator.job.batchLength-thisTranslator.job.batch.length)+"/"+thisTranslator.job.batchLength+"完成了！");	
						processPart();
					
				}
			});
		}
		
		if (thisTranslator.job.batchLength == thisTranslator.job.batch.length) {
			translatePart();
		} else {
			ui.loadingProgress(undefined, "等待"+thisTranslator.batchDelay+" ms...");	
			trans.translationTimer = setTimeout(function(){ translatePart(); }, thisTranslator.batchDelay);
		}
		
	} 
	processPart();

}

trans.getTranslatorEngine = function(id) {
	if (this[id] instanceof TranslatorEngine) return this[id];
	console.warn(id+" is not a translator engine");
}

/**
 * Get currently active Translator Engine
 */
trans.getActiveTranslatorEngine = function() {
	var doInitLang = function() {
		var conf = confirm(t("尚未为此项目定义源语言和目标语言以及默认翻译引擎。\r\n请在选项菜单中进行设置！\r\n要立即设置此选项吗？"));
		if (conf) ui.openOptionsWindow();
	}

	this.project.options 	= this.project.options || {};
	var currentPlugin 		= this.project.options.translator||sys.config.translator;
	if (typeof currentPlugin == 'undefined') return doInitLang();	
	return trans[currentPlugin];
}

/**
 * Determines translate selection by row or by line
 * @param  {} currentSelection
 */
trans.translateSelection = async function(currentSelection) {
	await this.translateSelectionByLine(currentSelection);
}

trans.translateSelectionByRow = async function(currentSelection) {
	console.log("translating selection");
	currentSelection = currentSelection||trans.grid.getSelected()||[[]];
	if (typeof currentSelection == 'undefined') {
		alert(t("未选择任何内容"));
		return false;
	}
	if (typeof trans.translator == "undefined" || trans.translator.length < 1) {
		alert(t("没有加载翻译程序"));
		return false;
	}
	var currentEngine = this.getActiveTranslatorEngine();

	var textPool = [];
	var thisData = trans.grid.getData();
	var rowPool = [];

	for (var index=0; index<currentSelection.length; index++) {
		for (var row=currentSelection[index][0]; row<=currentSelection[index][2]; row++) {
			var col = currentSelection[index][1];
			if (col == this.keyColumn) continue;
			rowPool.push({
				"row":row,
				"col":col
			});
			textPool.push(thisData[row][0]);
		}
	}
	//var dataString = textPool.join($DV.config.lineSeparator);
	var dataString = textPool;

	console.log(dataString);
	console.log(rowPool);
	if (rowPool.length < 1) {
		ui.tableCornerHideLoading();
		return;
	}
	//for (var i=0; i<trans.translator.length; i++ ) {
		//console.log(i);
		//var currentPlugin = sys.config.translator||trans.project.options.translator;
		if (currentEngine.isDisabled == true) return alert(currentEngine.id+t("被禁用了！"));
		
		var preTransData = trans.translateByReference(dataString);
		//trans[currentPlugin].translate(dataString, {
		currentEngine.translate(preTransData, {
			mode: "rowByRow",
			onAfterLoading:function(result) {
				console.log(result);
				console.log(rowPool);
				if (typeof result.translation !== 'undefined') {
					for (var x in result.translation) {
						//trans.data[rowPool[x]][trans[currentPlugin].columnIndex] = result.translation[x];
						trans.data[rowPool[x].row][rowPool[x].col] = result.translation[x];
					}
				}
				
				//trans.refreshGrid();
				trans.grid.render();
				trans.evalTranslationProgress();
				
			}
		});
	//}
	
}

trans.translateSelectionByLine = async function(currentSelection) {
	console.log("translating selection by line");
	currentSelection = currentSelection||trans.grid.getSelected()||[[]];
	if (typeof currentSelection == 'undefined') {
		alert(t("未选择任何内容"));
		return false;
	}
	if (typeof trans.translator == "undefined" || trans.translator.length < 1) {
		alert(t("没有加载翻译程序"));
		return false;
	}
	
	var currentEngine = this.getActiveTranslatorEngine();
	
	ui.tableCornerShowLoading();
	
	var textPool = [];
	var thisData = trans.grid.getData();
	var rowPool = [];
	var tempTextPool = [];

	for (var index=0; index<currentSelection.length; index++) {
		for (var row=currentSelection[index][0]; row<=currentSelection[index][2]; row++) {
			var col = currentSelection[index][1];
			if (col == this.keyColumn) continue;
			
			rowPool.push({
				"row":row,
				"col":col
			});
			tempTextPool.push(thisData[row][0]);
		}
	}

	var translationTable = trans.generateTranslationTableFromString(tempTextPool);
	for (var phrase in translationTable.include) {
		textPool.push(phrase);
	}
	
	console.log(textPool);
	console.log(rowPool);
	if (rowPool.length < 1) {
		ui.tableCornerHideLoading();
		return;
	}
	//for (var i=0; i<trans.translator.length; i++ ) {
		//console.log(i);
		if (currentEngine.isDisabled == true) return alert(currentEngine.id+"被禁用了！");
		
		var preTransData = trans.translateByReference(textPool);
		console.log("Translate using : ",currentEngine.id);
		//trans[currentPlugin].translate(dataString, {
		currentEngine.translate(preTransData, {
			onAfterLoading:function(result) {
				console.log("Translation result:");
				console.log(result);
				console.log("text pool :");
				console.log(textPool);
				console.log("rowpool:");
				console.log(rowPool);
				console.log("translation result : ");
				
				var transTable = trans.generateTranslationTableFromResult(textPool, result.translation, translationTable.exclude);
				console.log("translation table : ");
				console.log(transTable);
				
				trans.applyTransTableToSelectedCell(transTable, currentSelection);
				
				//var currentText = trans.translateTextByLine();
				/*
				if (typeof result.translation !== 'undefined') {
					for (var x in result.translation) {
						//trans.data[rowPool[x]][trans[currentPlugin].columnIndex] = result.translation[x];
						trans.data[rowPool[x].row][rowPool[x].col] = result.translation[x];
					}
				}
				*/
				//trans.refreshGrid();
				ui.tableCornerHideLoading();
				trans.grid.render();
				trans.evalTranslationProgress();
				
			}
		});
	//}
	
}


trans.translateSelectionIntoDef =function(currentSelection) {
	/*
		this function will translate using all available translator into their correspinding
		default column.
	*/
	console.log("translating selection into default coloumn");
	currentSelection = currentSelection||trans.grid.getSelected()||[[]];
	if (typeof currentSelection == 'undefined') {
		alert(t("未选择任何内容"));
		return false;
	}
	if (typeof trans.translator == "undefined" || trans.translator.length < 1) {
		alert(t("没有加载翻译程序"));
		return false;
	}
	
	
	var textPool = [];
	var thisData = trans.grid.getData();
	
	var rowPool = [];
	for (var index=0; index<currentSelection.length; index++) {
		for (var row=currentSelection[index][0]; row<=currentSelection[index][2]; row++) {
			rowPool.push(row);
			textPool.push(thisData[row][0]);
		}
	}
	//var dataString = textPool.join($DV.config.lineSeparator);
	var dataString = textPool;

	console.log(dataString);
	console.log(rowPool);

	for (var i=0; i<trans.translator.length; i++ ) {
		console.log(i);
		var currentPlugin = trans.translator[i];
		if (trans[currentPlugin].isDisabled == true) continue;
		
		var preTransData = trans.translateByReference(dataString);
		//trans[currentPlugin].translate(dataString, {
		trans[currentPlugin].translate(preTransData, {
			onAfterLoading:function(result) {
				console.log(result);
				console.log(rowPool);
				console.log(currentPlugin);
				if (typeof result.translation !== 'undefined') {

					for (var x in result.translation) {
						trans.data[rowPool[x]][trans[currentPlugin].columnIndex] = result.translation[x];
					}
				}
				
				//trans.refreshGrid();
				trans.grid.render();
				trans.evalTranslationProgress();
				
			}
		});
	}
	
}
trans.applyTransTableToSelectedCell = function(transTable, currentSelection, transData, options) {
	/*
		transTable = translation table format;
		selectedCell = array of cell selection
		transData = either trans.data / trans.project.files['file'].data
	*/
	console.log("trans.applyTransTableToSelectedCell");
	transData = transData||trans.data; // current selected file
	currentSelection = currentSelection||trans.grid.getSelected()||[[]];
	options = options||{};
	options.indexKey = options.indexKey||0;
	if (typeof currentSelection == 'undefined') {
		alert(t("未选择任何内容"));
		return false;
	}
	var rowPool = [];
	for (var index=0; index<currentSelection.length; index++) {
		for (var row=currentSelection[index][0]; row<=currentSelection[index][2]; row++) {
			var col = currentSelection[index][1];
			rowPool.push({
				"row":row,
				"col":col
			});
			
			if (Array.isArray(transData[row]) == false) continue;
			transData[row][col] = trans.translateTextByLine(transData[row][options.indexKey], transTable);
			//console.log("result of : "+row+","+col);
			//console.log(transData[row][col]);
		}
	}	
	
	
}

trans.translateSelectedRow = function(row, col) {
	if (typeof row == 'undefined') return false;
	if (trans.config.autoTranslate == false) return false;
	//if ($("#translationPane").attr("src") == "") return false;
	col = col||0;
	
	var currentText = trans.data[row][col];
	if (!currentText) return false;
	
	var translatorWindow = $("#translationPane")[0].contentWindow;
	if (ui.windows['translator']) {
		translatorWindow = ui.windows['translator'];
	}
	if (!translatorWindow.translator) return t("无法加载转换器窗口");
	
	translatorWindow.translator.translateAll(currentText);
	return true;
}

trans.getTranslationByIndex = function(index) {
	if (typeof index == 'undefined') return false;
	//if ($("#translationPane").attr("src") == "") return false;
	
	var translatorWindow = $("#translationPane")[0].contentWindow;
	if (ui.windows['translator']) {
		translatorWindow = ui.windows['translator'];
	}
	return translatorWindow.$(".mainPane .portlet").eq(index).find(".portlet-content").text();
}




trans.importTranslation = async function(refPath, options) {
	console.log("importTranslation", arguments);
// refPath = path to the Trans File or an object content of transFile
// inport translation from other .trans file
	if (typeof refPath == 'undefined') return trans.alert(t("引用路径不能为空！"));
	options = options || {};
	options.targetColumn = options.targetColumn||1;
	options.overwrite = options.overwrite||false;
	options.files = options.files||[]; // imported selected file list
	options.destination= options.destination||[]; // destination file list
	options.compareMode= options.compareMode||0; // context to context
	options.ignoreLangCheck = true; // always ignore language check!
	
	console.log("refPath & options : ");
	console.log(arguments);
	//return true;
	// selecting file is required
	if (!trans.getSelectedId()) {
		trans.selectFile($(".panel-left .fileList .data-selector").eq(0));
	}
	
	var applyImportedTranslation = async function(loadedData) {
		console.log("Applying translation");

		ui.loadingProgress(30, t("收集翻译参考文献"));
		await ui.log("收集翻译参考文献");
		
		if (options.compareMode == 'lineByLine') {
			var refTranslation = trans.generateTranslationTableLine(loadedData.project.files, options);
		} else if (options.compareMode == 'rowByRow') {
			var refTranslation = trans.generateTranslationTable(loadedData.project.files, options);
		} else if (options.compareMode == 'contextTrans') {
			var refTranslation = trans.generateContextTranslationPair(loadedData.project.files, options);
		}

		console.log("reference translation is : ");
		console.log(refTranslation);
		loadedData = trans.mergeReference(loadedData);
		
		var numData = Object.keys(refTranslation).length
		ui.loadingProgress(undefined, numData+t("翻译找到了！"));
		ui.loadingProgress(50, t("申请翻译！"));
		var count = 0;
		if (options.compareMode == 'lineByLine') { // line by line
			for (var key in refTranslation) {
				trans.findAndInsertLine(key, refTranslation[key], options.targetColumn, {
					overwrite:options.overwrite,
					files:options.destination
				});
				ui.loadingProgress(50+(count/numData*50));
				count++;
			}			
		} else if (options.compareMode == 'rowByRow') { // row by row
			console.log("Row by Row translation");
			for (var key in refTranslation) {
				trans.findAndInsert(key, refTranslation[key], options.targetColumn, {
					overwrite:options.overwrite,
					files:options.destination
				});
				ui.loadingProgress(50+(count/numData*50));
				count++;
			}
		} else if (options.compareMode == 'contextTrans') {
			console.log("Translation by context");
			for (var key in refTranslation) {
				trans.findAndInsertByContext(key, refTranslation[key], options.targetColumn, {
					overwrite:options.overwrite,
					files:options.destination
				});

				ui.loadingProgress(50+(count/numData*50));
				count++;
			}
		}

		$(document).trigger("onAfterImportTranslations", {
			options:options, 
			loadedData:loadedData,
			refTranslation:refTranslation
		});

		await common.wait(20);
		ui.loadingProgress(100, "完毕!");
		trans.evalTranslationProgress();
		await common.wait(300);
		ui.hideLoading();
		trans.refreshGrid();
		
	}
	
	ui.showLoading();
	ui.loadingProgress(0, t("导入翻译"));
	await common.wait(200);

	
	if (typeof refPath == 'object' && typeof refPath.project !== 'undefined') {
		// refference path already loaded
		console.log("refPath is an object : ");
		await applyImportedTranslation(refPath);
		
		return true;
		
	}
	console.log("Opening "+refPath);
	
	
	fs.readFile(refPath, async function (err, data) {
		if (err) {
			console.log("error opening file : "+filePath);
			data = data.toString();
			if (typeof options.onFailed =='function') options.onFailed.call(trans, data);

			throw err;
		} else {
			ui.loadingProgress(20, t("解析数据"));
			await ui.log("解析数据");
			await common.wait(200);

			data = data.toString();
			//console.log(data);
			var jsonData = JSON.parse(data);
			console.log("Result data : ");
			console.log(jsonData);
			applyImportedTranslation(jsonData);
			console.log("Done!");
			if (typeof options.onSuccess == 'function') options.onSuccess.call(trans, jsonData);
			trans.isOpeningFile = false;
		}
	});	
}


// ==================================================================
// PUT DOM RELATED CODE HERE
// ==================================================================
trans.getSelectedId = function() {
	// returning false when error
	// returns related key ID from trans.project.files
	if ($(".fileList .selected").length == 0 ) return false;
	return $(".fileList .selected").data("id");
}

trans.getSelectedContext = function(rowNumber) {
	rowNumber = rowNumber || trans.lastSelectedCell[0]
	var context = trans.getSelectedObject().context;
	try {
		return context[rowNumber]
	} catch (e) {
		context[rowNumber] = [];
		return context[rowNumber];
	}
}

trans.getSelectedParameters = function() {
	if (!trans.lastSelectedCell) return;
	var rowNumber = trans.lastSelectedCell[0]

	var obj =trans.getSelectedObject()
	obj.parameters = obj.parameters || [];
	obj.parameters[rowNumber] = obj.parameters[rowNumber] || []
	return obj.parameters[rowNumber]
}

trans.getParamatersByRow = function(row, file) {
	file = file || this.getSelectedId();
	if (typeof row !== "number") return false;

	var thisObj = trans.getObjectById(file);
	if (!thisObj.parameters) return false;
	return thisObj.parameters[row];
}

trans.getSelectedKeyText = function(rowNumber) {
	rowNumber = rowNumber || trans.lastSelectedCell[0]
	try {
		var data = trans.getSelectedObject().data;
		return data[rowNumber][trans.keyColumn]
	} catch (e) {

	}
}

trans.getSelectedObject = function() {
	// returning false when error
	// returns related object from trans.project.files[currently selected]
	if ($(".fileList .selected").length == 0 ) return false;
	var currentID = trans.getSelectedId();
	return trans.project.files[currentID];
}

trans.getObjectById = function(id) {
	if (!id) return;
	try {
		return trans.project.files[id]
	} catch (e){
		console.warn(e);
		return;
	}
}

trans.getCheckedFiles = function() {
	var result = [];
	var checkbox = $(".fileList .data-selector .fileCheckbox:checked");
	for (var i=0; i<checkbox.length; i++) {
		result.push(checkbox.eq(i).attr("value"));
	}
	return result;
	
}

trans.getAllFiles = function(obj) {
	var result = [];
	obj = obj||trans.project.files;
	if (typeof obj == 'undefined') return result;
	for (var file in obj ) {
		result.push(file);
	}
	return result;
}

trans.getAllCompletedFiles = function(obj) {
	var result = [];
	obj = obj||this.project.files;
	if (typeof obj == 'undefined') return result;
	for (var file in obj ) {
		//console.log(file, obj[file]);
		if (typeof obj[file] !== "object") continue;
		if (typeof obj[file].progress !== "object") continue;
		if (obj[file].progress.percent == 100) {
			result.push(file);
		}
		
	}
	return result;
}
trans.getAllIncompletedFiles = function(obj) {
	var result = [];
	obj = obj||this.project.files;
	if (typeof obj == 'undefined') return result;
	for (var file in obj ) {
		//console.log(file, obj[file]);
		if (typeof obj[file] !== "object") continue;
		if (typeof obj[file].progress !== "object") continue;
		if (obj[file].progress.percent < 100) {
			result.push(file);
		}
		
	}
	return result;
}



// ==============================================================
// SEARCH
// ==============================================================
trans.goTo = function(row, col, context) {
	console.log(arguments);
	/*
	trans.selectFile(context, {
		onDone:function() {
			trans.grid.selectCell(row,col,row,col);
		}
	});
	*/
	// commit any change on current cell
	this.grid.deselectCell();
	
	var $selected = this.selectFile(context);
	//$($selected)[0].scrollIntoView({behavior: "smooth"});
	$($selected)[0].scrollIntoView({block:"center"});
	this.grid.selectCell(row,col,row,col);
	this.grid.scrollViewportTo(row,col);
	//setTimeout (function() {trans.grid.selectCell(row,col,row,col)}, 1000);
	
}

trans.search = function(keyword, options) {
	var globToRegExp = require('glob-to-regexp');
	console.log("entering trans.search", arguments);

	if (typeof keyword == "undefined") return null;
	if (typeof keyword.length <=1) return "关键字太短了！";
	if (typeof trans.project == "undefined") return null;
	if (typeof trans.project.files == "undefined") return null;
	
	
	options = options|| {};
	options.caseSensitive = options.caseSensitive||false;
	options.lineMatch = options.lineMatch||false;
	options.isRegexp = options.isRegexp||false;

	options.searchLocations = options.searchLocations || [];
	if (options.searchLocations.length == 0) options.searchLocations = ['grid'];
	
	if (options.lineMatch) options.searchInContext = false;
	
	if (Array.isArray(options.files) == false) {
		options.files = [];
		for (var file in trans.project.files) {
			options.files.push(file);
		}
	}
	
	
	if (options.caseSensitive == false && options.isRegexp == false) {
		keyword = keyword.toLowerCase();
	}
	
	var start = new Date().getTime();
	var result = {
		'keyword':keyword,
		count:0,
		isRegexp:options.isRegexp,
		executionTime:0,
		files:{}
	};
	
	// check if regexp is valid
	if (options.isRegexp) {
		var keywordExp = common.evalRegExpStr(keyword);
		if (keywordExp == false) {
			alert(keyword+t(" 不是有效的javascript的regexp！\r\n在上查找有关Javascipt正则表达式的更多信息:\r\nhttps://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions"));
			return result;
		}
	} else if (keyword.includes("*")) {
		// glob style keyword
		try {
			var fixedKeywordExp = globToRegExp(keyword).toString().replace(/\/\^(.*?)\$\//, '$1');
			var keywordExp = new RegExp(fixedKeywordExp, 'i'); // insensitive
			console.log("Glob style keyword detected", keywordExp);
		} catch (e) {
			console.warn('Error when converting glob pattern to RegExp');
		}

	}
	
	//line match algorithm
	if (options.lineMatch) {
		for (var cont in options.files) {
			var file = options.files[cont];
			if (Array.isArray(trans.project.files[file].data) == false) continue;
			var currentFile = trans.project.files[file].data;
			for (var row=0; row<currentFile.length; row++) {
				if (currentFile[row].length == 0) continue;
				for (var col=0; col<currentFile[row].length; col++) {
					if (typeof currentFile[row][col] !== "string") continue;
					
					
					if (keywordExp) {
						// regular expression search
						if (keywordExp.test(currentFile[row][col])) {
							// match found
							var lineIndex = common.lineIndexRegExp(currentFile[row][col], keywordExp);
							result.files[file] = result.files[file]||[];
							result.files[file].push({
								'fullString':currentFile[row][col],
								'row':row,
								'col':col,
								'type':'cell',
								'lineIndex':lineIndex
							});
							result.count++;	
							
							break;							
						}
						
					} else {
						// normal search
						if (options.caseSensitive) {
							if (currentFile[row][col].indexOf(keyword) == -1) continue;
						} else {
							if (currentFile[row][col].toLowerCase().indexOf(keyword) == -1) continue;
						}
						
						var lineIndex = common.lineIndex(currentFile[row][col], keyword, options.caseSensitive);
						if (lineIndex != -1) {
							// match found
							result.files[file] = result.files[file]||[];
							result.files[file].push({
								'fullString':currentFile[row][col],
								'row':row,
								'col':col,
								'type':'cell',
								'lineIndex':lineIndex
							});
							result.count++;	
							
							break;
						}						
					}

				}
			}
		}	
		
		var end = new Date().getTime();
		result.executionTime = end - start;
		return result;		
	}
	
	console.log("Search location:", options.searchLocations);
	// common algorithm
	if (options.searchLocations.includes("grid")) {
		//for (var file in trans.project.files) {
		for (var cont in options.files) {
			var file = options.files[cont];
			if (Array.isArray(trans.project.files[file].data) == false) continue;
			var currentFile = trans.project.files[file].data;
			for (var row=0; row<currentFile.length; row++) {
				if (currentFile[row].length == 0) continue;
				for (var col=0; col<currentFile[row].length; col++) {
					if (typeof currentFile[row][col] !== "string") continue;
					
					
					if (keywordExp) {
						//console.log("regexp search:", keywordExp, currentFile[row][col], keywordExp.test(currentFile[row][col]));
						//console.log(typeof keywordExp);
						// regular expression search
						if (keywordExp.test(currentFile[row][col])) {
							// match found
							result.files[file] = result.files[file]||[];
							result.files[file].push({
								'fullString':currentFile[row][col],
								'row':row,
								'col':col,
								'type':'cell'
							});
							result.count++;	
							
							break;							
						}
						
					} else {			
						
						if (options.caseSensitive) {
							if (currentFile[row][col].indexOf(keyword) == -1) continue;
						} else {
							if (currentFile[row][col].toLowerCase().indexOf(keyword) == -1) continue;
						}
						
						result.files[file] = result.files[file]||[];
						result.files[file].push({
							'fullString':currentFile[row][col],
							'row':row,
							'col':col,
							'type':'cell'
						});
						result.count++;
					}
				}
			}
		}
	}
	
	if (options.searchLocations.includes("context")) {
		for (var idx in options.files) {
			var file = options.files[idx];
			if (Array.isArray(trans.project.files[file].context) == false) continue;
			var currentFile = trans.project.files[file].context;
			for (var row=0; row<currentFile.length; row++) {
				if (Array.isArray(currentFile[row]) == false) continue;
				if (currentFile[row].length == 0) continue;
				for (var cont=0; cont<currentFile[row].length; cont++) {
					if (typeof currentFile[row][cont] !== "string") continue;
					
					if (keywordExp) {
						if (keywordExp.test(currentFile[row][cont]) == false) continue;
					} else if (options.caseSensitive) {
						if (currentFile[row][cont].indexOf(keyword) == -1) continue;
					} else {
						if (currentFile[row][cont].toLowerCase().indexOf(keyword) == -1) continue;
					}
					
					result.files[file] = result.files[file]||[];
					result.files[file].push({
						'fullString':currentFile[row][cont],
						'row':row,
						'col':0,
						'type':'context'
					});
					result.count++;
				}
			}
		}
	}

	if (options.searchLocations.includes("tag")) {
		for (var cont in options.files) {
			var file = options.files[cont];
			var tags = keyword.split(" ");
			var currentFile = trans.project.files[file].data;
			for (var row=0; row<currentFile.length; row++) {
				if (trans.hasTags(tags, row, file) == false) continue;
				result.files[file] = result.files[file]||[];
				result.files[file].push({
					'fullString':currentFile[row][this.keyColumn],
					'row':row,
					'col':0,
					'type':'cell'
				});
				result.count++;
			}
		}
	}

	if (options.searchLocations.includes("comment")) {
		console.log("searching comment");
		for (var idx in options.files) {
			var file = options.files[idx];
			if (Boolean(trans.project.files[file].comments) == false) continue;
			var currentFile = trans.project.files[file].comments;
			console.log("processing", file);
			for (var row in currentFile) {
				if (Boolean(currentFile[row]) == false) continue;
				for (var col in currentFile[row]) {
					if (typeof currentFile[row][col] !== "string") continue;
					
					if (keywordExp) {
						if (keywordExp.test(currentFile[row][col]) == false) continue;
					} else if (options.caseSensitive) {
						if (currentFile[row][col].indexOf(keyword) == -1) continue;
					} else {
						if (currentFile[row][col].toLowerCase().indexOf(keyword) == -1) continue;
					}
					
					result.files[file] = result.files[file]||[];
					result.files[file].push({
						'fullString':currentFile[row][col],
						'row':row,
						'col':col,
						'type':'comment'
					});
					result.count++;
				}
			}
		}
	}

	var end = new Date().getTime();
	result.executionTime = end - start;
	return result;
}


trans.replace = function(keyword, replacer, options) {
	console.log("entering trans.search");

	if (typeof keyword == "undefined") return null;
	if (typeof keyword.length <=1) return t("关键字太短了！");
	if (typeof trans.project == "undefined") return null;
	if (typeof trans.project.files == "undefined") return null;
	
	replacer = replacer||"";
	options = options|| {};
	options.caseSensitive = options.caseSensitive||false;
	options.isRegexp = options.isRegexp||false;
	
	if (Array.isArray(options.files) == false) {
		options.files = [];
		for (var file in trans.project.files) {
			options.files.push(file);
		}
	}
	
	
	
	if (options.caseSensitive == false && options.isRegexp == false) {
		keyword = keyword.toLowerCase();
	}
	
	var start = new Date().getTime();
	var result = {
		'keyword':keyword,
		count:0,
		isRegexp:options.isRegexp,		
		executionTime:0,
		files:{}
	};
	
	// check if regexp is valid
	if (options.isRegexp) {
		var keywordExp = common.evalRegExpStr(keyword);
		if (keywordExp == false) {
			alert(keyword+t("不是有效的javascript的regexp！\r\n在上查找有关Javascipt正则表达式的更多信息:\r\nhttps://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions"));
			return result;
		}
	}
	
	//for (var file in trans.project.files) {
	for (var cont in options.files) {
		var file = options.files[cont];
		if (Array.isArray(trans.project.files[file].data) == false) continue;
		var currentFile = trans.project.files[file].data;
		//console.log("handling file : ", file, currentFile);
		for (var row=0; row<currentFile.length; row++) {
			if (currentFile[row].length == 0) continue;
			for (var col=1; col<currentFile[row].length; col++) { // skip first row
				if (typeof currentFile[row][col] !== "string") continue;
				
				if (options.isRegexp) {
					// regular expression search
					if (keywordExp.test(currentFile[row][col])) {
						// match found
						var original = trans.project.files[file].data[row][col];
						trans.project.files[file].data[row][col] = currentFile[row][col].replace(keywordExp, replacer);
						result.files[file] = result.files[file]||[];
						result.files[file].push({
							'fullString':trans.project.files[file].data[row][col],
							'row':row,
							'col':col,
							'originalString' : original
							
						});
						result.count++;	
						
						break;							
					}
					continue;
				} 
				
				// normal search
				if (options.caseSensitive) {
					if (currentFile[row][col].indexOf(keyword) == -1) continue;
				} else {
					if (currentFile[row][col].toLowerCase().indexOf(keyword) == -1) continue;
				}
				
				var original = trans.project.files[file].data[row][col];
				trans.project.files[file].data[row][col] = currentFile[row][col].replaces(keyword, replacer, !options.caseSensitive);
				
				result.files[file] = result.files[file]||[];
				result.files[file].push({
					'fullString':trans.project.files[file].data[row][col],
					'row':row,
					'col':col,
					'originalString' : original
				});
				result.count++;
			}
		}
		
	}
	var end = new Date().getTime();
	result.executionTime = end - start;
	trans.refreshGrid();
	//trans.selectFile($(".fileList .selected"));
	
	return result;
	
}

trans.findPut = function(keyword, put, targetCol, options) {
	console.log("entering trans.search");

	if (typeof keyword == "undefined") return null;
	if (typeof keyword.length <=1) return t("关键字太短了！");
	if (typeof trans.project == "undefined") return null;
	if (typeof trans.project.files == "undefined") return null;
	if (targetCol < 1) return false;

	
	options = options|| {};
	options.caseSensitive = options.caseSensitive||false;
	options.lineMatch = options.lineMatch||false;
	
	
	if (Array.isArray(options.files) == false) {
		options.files = [];
		for (var file in trans.project.files) {
			options.files.push(file);
		}
	}
	
	if (options.caseSensitive == false) {
		keyword = keyword.toLowerCase();
	}
	
	var start = new Date().getTime();
	var result = {
		'keyword':keyword,
		count:0,
		executionTime:0,
		files:{}
	};
	
	//line match algorithm
	for (var cont in options.files) {
		var file = options.files[cont];
		if (Array.isArray(trans.project.files[file].data) == false) continue;
		var currentFile = trans.project.files[file].data;
		for (var row=0; row<currentFile.length; row++) {
			if (currentFile[row].length == 0) continue;
			for (var col=0; col<currentFile[row].length; col++) {
				if (typeof currentFile[row][col] !== "string") continue;
				
				if (options.caseSensitive) {
					if (currentFile[row][col].indexOf(keyword) == -1) continue;
				} else {
					if (currentFile[row][col].toLowerCase().indexOf(keyword) == -1) continue;
				}
				
				var lineIndex = common.lineIndex(currentFile[row][col], keyword, options.caseSensitive);
				if (lineIndex != -1) {
					// match found
					var newTxt = common.insertLineAt(currentFile[row][targetCol], put, lineIndex, {
							lineBreak:trans.project.files[file].lineBreak
						});
					currentFile[row][targetCol] = newTxt;
					
					result.files[file] = result.files[file]||[];
					result.files[file].push({
						'fullString':currentFile[row][col],
						'row':row,
						'col':col,
						'type':'cell',
						'lineIndex':lineIndex
					});
					result.count++;	
					
					break;
				}
			}
		}
	}	

	
	var end = new Date().getTime();
	result.executionTime = end - start;
	trans.refreshGrid();
	
	return result;
}

window.trans = trans;


/**
 * Attachment object.
 * Located at trans.project.attachments
 * @class
 * @param  {Object} obj
 */
window.Attachment = function(obj) {
	obj = obj || {};
	Object.assign(this, obj);
}


// ==============================================================
//
// 							E V E N T S
//
// ==============================================================


$(document).ready(function() {
	if ($('body').is('[data-window="trans"]') == false) return;

	trans.fileSelectorContextMenuInit();
	//trans.gridBodyContextMenu();
	
	$(window).resize(function() {
		if (typeof trans.timers.resizeWindow != 'undefined') return false;
		if (trans.ignoreResize) return false;
		trans.timers.resizeWindow = setTimeout(function(e) {
			trans.grid.render();
			ui.fixCellInfoSize();
			trans.timers.resizeWindow = undefined;
		}, 250);

	});
	
	/*
	$(window).resize(function() {
		console.log("resized");
		if(this.resizeTO) clearTimeout(this.resizeTO);
		this.resizeTO = setTimeout(function() {
			$(this).trigger('resizeEnd');
		}, 250);
	});
	$(window).bind('resizeEnd', function() {
		console.log("resize end");
		trans.grid.render();
	});
	*/
	trans.initTable();
	trans.isLoaded = true;
});