/*
Parse all renpy script and convert them to .trans
Currently support renpy version 6
The latest version of Renpy might not supported due to unrpyc tool unable to decompile the script properly
*/
var thisAddon = this;

// skip decompiling rpyc when the rpy file with the same name exist
//thisAddon.config.skipExistingRpy = true;


this.optionsForm = {
		"writeEncoding": {
		  "type": "string",
		  "title": "写编码",
		  "description": "将在编写脚本时强制将文本编码转换为选定的编码。（blank=auto）<br />最好将此字段留空，改用后处理器转换器。",
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
		"convertEncodingTo": {
		  "type": "string",
		  "title": "将编码转换为",
		  "description": "后处理转换器。在脚本成功导出后转换编码<br />大多数KAG游戏使用<b>Shift_JIS</b>或<b>UTF-16</b>",
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
		}
		
}

thisAddon.config = thisAddon.config || {};
thisAddon.config.binPath = thisAddon.config.binPath || nwPath.join(thisAddon.getLocation(), "bin");
thisAddon.config.readEncoding = "UTF-8";


//var encoding 	= require('encoding-japanese');
//var iconv 		= require('iconv-lite');
var fs 			= fs || require('graceful-fs');
//var fse 		= require('fs-extra')
var bCopy 		= require('better-copy');
//var buffTool 	= require('buffer-tools');
var spawn 		= spawn||require('child_process').spawn;


// =====================================================================
// 							RpyFile Object
// =====================================================================

class RpyFile extends require("www/js/ParserBase.js").ParserFile {
	constructor(file, options, callback) {
		super(file, options, callback)
	}
}

RpyFile.prototype.unIndent = function(text, indentLevel) {
	var tmpText = text.split("\n");
	for (var i=1; i<tmpText.length; i++) {
		if (tmpText[i].substring(0, indentLevel).trim() !== "") continue;
		tmpText[i] = tmpText[i].substring(indentLevel);
	}
	return tmpText.join("\n");
}

RpyFile.prototype.reIndent = function(text, indentLevel) {
	var tmpText = text.split("\n");
	var paddingLeft = " ".repeat(indentLevel);
	for (var i=1; i<tmpText.length; i++) {
		tmpText[i] = paddingLeft+tmpText[i];
	}
	return tmpText.join("\n");	
}

RpyFile.prototype.filterText = function(text, context, parameters) {
	// filter text for trans

	//text = text.replace(/\\n/g, "\n"); // \\n with n
	console.log("filteringText:", text, arguments);
	try {
		if (["'''", '"""'].includes(parameters.enclosure)) {
			// heredoc
			text = text.replaceAll("`", "\\`")
			text = eval("`"+text+"`");
			text = this.unIndent(text, parameters.lineIndent);
		} else {
			text = eval(parameters.enclosure+text+parameters.enclosure);	
		}
	} catch (e) {
		console.warn("筛选文本时出错：", text, e);
		return text;
	}
	return text;
}

RpyFile.prototype.unfilterText = function(text, context, parameters) {
	// generate text from trans to raw ks

	//text = text.replace(/([\r]+)/g, '');
	//text = text.replace(/([\n]+)/g, "\\n"); // replace with actual "\n" 
	try {
		if (["'''", '"""'].includes(parameters.enclosure)) {
			text = this.reIndent(text, parameters.lineIndent);
			text = text.replaceAll('"', '\\"');
			text = text.replaceAll("'", "\\'");
		} else {
			text = JSON.stringify(text);
			text = text.substring(1, text.length-1)
			// json stringify already escapes double quote, now handle single quote
			text = text.replaceAll("'", "\\'");
		}
	} catch (e) {
		console.warn("尝试翻译时出错：", arguments);
		throw(e);
	}

	return text;
}


RpyFile.prototype.registerConfig = function(config, configValue) {
	if (!config) return;
	this.configValue = this.configValue || {};
	this.configValue[config] = configValue;
}

RpyFile.fetch = function(theString, parentObject) {
	var that = parentObject||this;
	var chunkOffset = [0];
	var commentsOffset = [];
	var lastLine = 0;
	var shadowString; // string with all found string replaced by "="

	var getValueFromString = function(val) {
		// stripout "" or '' from a string
		var result = val
		try {
			result = JSON.parse(val)
		} catch(e) {
			
		}

		// todo : stripOut function tag _("");

		return result;
	}

	var getStartingLine = function(string, offset) {
		for (var i=offset; i>=0; i--) {
			if (string[i] == "\n") return i+1;	
		}
		return i;
	}
	var getEndLine = function(string, offset) {
		for (var i=offset; i<string.length; i++) {
			if (string[i] == "\n") return i;	
		}
		return i;
	}

	var getWholeLine = function(string, offsetStart, offsetEnd) {
		return string.substring(getStartingLine(string, offsetStart), getEndLine(string, offsetEnd));
	}

	var isInsideCommand = function(offset) {
		for (var i=0; i<commentsOffset.length; i++) {
			var thisCommentOffset = commentsOffset[i]
			if (thisCommentOffset.start<offset && thisCommentOffset.end>offset) return true
		}
		return false;
	}
	
	/**
	 * 
	 * @param  {} string
	 * @param  {} offset
	 * Using shadowstring instead of actual string
	 */
	var isComment = function(string, offset) {
		var startingLine = getStartingLine(shadowString, offset);
		var leftString = shadowString.substring(startingLine, offset);
		leftString = leftString.replaceAll(/("""|''')[\s\S]+?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2|(?:^#?(?:(?:[0-9a-fA-F]{2}){3}|(?:[0-9a-fA-F]){3})$)/gm, "");
		if (leftString.includes('#')) return true
		return false;
	}
		
	// RENPY : CAPTURE CONFIGURATION value like title, version, etc
	theString.replace(/define\s+config\.(\w*)\s*\=\s*(.*)/g, function() {
		that.registerConfig(arguments[1], getValueFromString(arguments[2]));
		return arguments[0]
	})

	theString.replace(/\/\*(.+?)\*\//gs, function() {
		//console.log("Comments : ", arguments);
		commentsOffset.push({
			start:arguments[2],
			end:arguments[2]+arguments[0].length,
		});
		return arguments[0]
	})


	//theString.replace(/(["'])((?:(?!\1)[^\\]|(?:\\\\)*\\[^\\])*)\1/g, function() {
		// arguments[0] : text with quote
		// arguments[1] : quote type (' / ")
		// arguments[2] : text without quote
		// arguments[3] : offset
		// arguments[4] : full text
		// has problem with double backslash
	


	/*
	theString.replace(/(['"])((\\\1|.)*?)\1/gm, function() {
		// Slower, but as far as I know, ... is flawless
		// arguments[0] : text with quote
		// arguments[1] : quote type (' / ")
		// arguments[2] : text without quote minus last character
		// arguments[3] : last character
		// arguments[4] : offset
		// arguments[5] : full text
		var offset 		= arguments[4] + 1; // plus opening quote
		var text 		= arguments[5];
		var endOffset 	= offset+arguments[0].length - 2; // minus start and end quote 
		var lineStartAt = getStartingLine(arguments[5], arguments[4]);
		var lastOffset 	= chunkOffset[chunkOffset.length-1]||0;
		var lines 		= text.substring(0, offset).split("\n");
		var lineCount 	= lines.length;

		var leftSideOfTheText = lines[lines.length-1]; // text of the current line up to the offset
		var cols 		= leftSideOfTheText.length;
		var firstWord	= "";
		try {
			firstWord	= leftSideOfTheText.trim().split(" ")[0]
		} catch {

		}

		// register everyting from previously found text up to the beginning of this text
		that.register(text.substring(lastOffset, offset));
		
		// register the current text as translatable text
		if (!isInsideCommand(offset) && !isComment(text, offset)) {
			var context = ["line", lineCount, "col", cols, "cmd", firstWord];
			that.registerString(text.substring(offset, endOffset), context, {
				start:offset,
				end:endOffset,
				enclosure:arguments[1]
			});
		}

		lastLine = lineCount;
		chunkOffset.push(endOffset);
		// registering string
			//for (var cOffset in commentsOffset) {
				//if (commentOffset[cOffset])
			//}
		// end of registering string
		return arguments[0];

	})
	*/
	shadowString = theString.replace(/("""|''')[\s\S]+?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2|(?:^#?(?:(?:[0-9a-fA-F]{2}){3}|(?:[0-9a-fA-F]){3})$)/gm, function() {
		return "=".repeat(arguments[0].length);
	})
	
	theString.replace(/("""|''')[\s\S]+?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2|(?:^#?(?:(?:[0-9a-fA-F]{2}){3}|(?:[0-9a-fA-F]){3})$)/gm, function() {
		// can capture heredoc
		// arguments[0] : text with quote
		// arguments[1] : heredoc type (""",''') undefined when not heredoc
		// arguments[2] : quote type (',") undefined when heredoc
		// arguments[3] : offset (starting from before quote - see arguments[0])
		// arguments[4] : whole text

		var quote = arguments[1] || arguments[2]

		var offset 		= arguments[3] + quote.length; // plus opening quote
		var text 		= arguments[4];
		var endOffset 	= offset+arguments[0].length - (quote.length*2); // minus start and end quote 
		//var lineStartAt = getStartingLine(arguments[5], arguments[4]);
		var lastOffset 	= chunkOffset[chunkOffset.length-1]||0;
		var lines 		= text.substring(0, offset).split("\n");
		var lineCount 	= lines.length;

		var leftSideOfTheText = lines[lines.length-1]; // text of the current line up to the offset
		var marginLeft = leftSideOfTheText.length - leftSideOfTheText.trimStart().length;
		//var indentString = leftSideOfTheText.substring(0, marginLeft);
		var cols 		= leftSideOfTheText.length;
		var firstWord	= "";
		try {
			firstWord	= leftSideOfTheText.trim().split(" ")[0]
		} catch {

		}

		// register everyting from previously found text up to the beginning of this text
		that.register(text.substring(lastOffset, offset));
		
		// register the current text as translatable text
		if (!isInsideCommand(offset) && !isComment(text, offset)) {
			var context = ["line", lineCount, "col", cols, "cmd", firstWord];
			that.registerString(text.substring(offset, endOffset), context, {
				start:offset,
				end:endOffset,
				enclosure:quote,
				lineIndent:marginLeft
			});
		} else {
			// register text inside comment
			that.register(text.substring(offset, endOffset));
		}

		lastLine = lineCount;
		chunkOffset.push(endOffset);
		// registering string
			//for (var cOffset in commentsOffset) {
				//if (commentOffset[cOffset])
			//}
		// end of registering string
		return arguments[0];

	})

	var lastOffset = chunkOffset[chunkOffset.length-1]||0;
	//register the final part of the data
	that.register(theString.substring(lastOffset));


}

RpyFile.prototype.parse = async function() {
	this.contextEnter(nwPath.basename(this.file));
	await ui.log("解析："+this.file);
	this.promise = new Promise(async (resolve, reject) => {
		this.string = await this.readFile(this.file);

		RpyFile.fetch.call(this, this.string)
		
		this.contextEnd();
		resolve();
	})
	return this.promise;
}

window.RpyFile = RpyFile;



// =====================================================================
// 							Renpy Utility Object
// =====================================================================
var RenUtils = function() {
	
}

RenUtils.prototype.extractRPA = async function(gameFolder, options) {
	// extract renpy's RPA archive 
	options = options || {}
	options.onExtract = options.onExtract || function(filePath){};
	options.preserve = options.preserve || false; // preserve original .rpa file
	var rpatool = nwPath.join(thisAddon.config.binPath, "rpatool.exe");
	var spawns = [];

	var rpaFiles = [];
	
	return new Promise(async (resolve, reject) => {
		await ui.log(`正在从以下位置收集rpa文件：${gameFolder}`);

		await bCopy.walk(gameFolder, {
			onFile: (filePath, stats) => {
				//console.log("处理", filePath);
				if (nwPath.extname(filePath).toLowerCase() !== ".rpa") return;
				console.log("is RPA file : ", filePath);
				rpaFiles.push(filePath);
				
			}
		})
		await ui.log(`${rpaFiles.length}建立！`);

		for (var i=0; i<rpaFiles.length; i++) {
			var filePath = rpaFiles[i];
			await ui.log(`提取${i+1}/${rpaFiles.length}: ${filePath}`);
			await common.aSpawn(rpatool, ['-x', filePath], {cwd:nwPath.dirname(filePath)});
			console.log("extract finished : ", filePath);
			options.onExtract.call(this, filePath)
			if (options.preserve == false) {
				fs.unlinkSync(filePath);
			}
			await ui.log(`完成！`);
		}
		await ui.log(`rpa提取完毕！`);
		resolve();
	})
}


function chunk (arr, len) {
  var chunks = [],
      i = 0,
      n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, i += len));
  }

  return chunks;
}

RenUtils.prototype.unRpyc = async function(gameFolder, options) {
	// Decompile all .rpyc files from gameFolder and its subfolder
	options = options || {}
	options.onExtract = options.onExtract || function(filePath){};
	options.preserve = options.preserve || false; // preserve original .rpa file
	var rpyctool = nwPath.join(thisAddon.config.binPath, "unrpyc.exe");
	
	var rpycfiles = [];
	var spawns = [];
	
	return new Promise(async (resolve, reject) => {
		var renpyPath 	= nwPath.join(gameFolder, 'renpy')
		var libPath 	= nwPath.join(gameFolder, 'lib')
		await bCopy.walk(gameFolder, {
			onFile: (filePath, stats) => {
				//console.log("处理", filePath);
				if (nwPath.extname(filePath).toLowerCase() !== ".rpyc") return;
				if (filePath.includes(renpyPath)) return;
				if (filePath.includes(libPath)) return;
				
				if (thisAddon.config.skipExistingRpy) {
					var filename = nwPath.parse(filePath).name;
					if (common.isFile(nwPath.join(nwPath.dirname(filePath), filename+".rpy"))) return
				}
				rpycfiles.push(filePath);
			}
		})

		console.log("rpyc files :", rpycfiles);
		var chunks = chunk(rpycfiles, 20);
		console.log(chunks);
		
		await ui.log(`反编译 ${rpycfiles.length} 文件夹`);
		for (var i=0; i<chunks.length; i++) {
			var thisArg = chunks[i];
			await ui.log(`反编译批处理 ${i+1} of ${chunks.length}:\n${thisArg.join("\n")}\n`);

			thisArg.unshift("-c");
			
			await common.aSpawn(rpyctool, thisArg, {cwd:gameFolder})
			thisArg.shift();
			await ui.log(`完成！`);
			await ui.log(`删除反编译的rpyc文件`);
			if (options.preserve == false) {
				for (var f=0; f<thisArg.length; f++) {
					//console.log("delete", thisArg[f]);
					try {
						fs.unlinkSync(thisArg[f]);
					} catch (e) {
						console.warn(e);
					}
				}
			}
			await ui.log(`完成！`);

		}
		resolve();
		return;
	})
}

RenUtils.prototype.makeEditable = async function(gameFolder) {
	// make the renpy game editable by running extractRPA & unrpyc sequentially
	return new Promise(async (resolve, reject) => {
		await this.extractRPA(gameFolder);
		if (thisAddon.config.decompileRpyc) {
			ui.loadingProgress("准备", "反编译rpyc文件", {consoleOnly:true, mode:'consoleOutput'});
			await this.unRpyc(gameFolder);
		} else {
			await ui.log("跳过rpyc文件的反编译");
		}
		resolve();
	})
}

RenUtils.prototype.isRenpyExe = async function(file, callback) {
	// detect wether the given file is Renpy's executable file
	console.log('checking', file);
	
	if (!common.isFile(file)) return Promise.resolve(false);
	callback = callback || function(){};
	return new Promise((resolve, reject)=>{
		var result = false;
		var stats = fs.statSync(file)
		var readStream = fs.createReadStream(file, { 
					start: 1024, end: 1029 
					});
			readStream.on("data", (data)=>{
				//console.log("data");
				result = data.includes(Buffer.from([243,195,141,180,38,0]))
			})
			readStream.on("end", ()=>{
				//console.log("end");
				//console.log(arguments);
				callback.call(this, result);
				resolve(result)
			})
			readStream.on("error", (error)=>{
				//console.log("error");
			})	
	})
}


RenUtils.prototype.getLowestPaths = function(paths) {
// get the most lowest path from collection of path
	if (!Array.isArray(paths)) return paths;
	paths = paths || [];
	var collections = {};
	var list = [];
	for (var i in paths) {
		var thisPath = nwPath.normalize(paths[i]);
		var num = thisPath.split("\\").length - 1;
		collections[num] = collections[num]||[];
		collections[num].push(thisPath);
		list.push(num)
	}
	
	var min = Math.min(...list);
	return collections[min]
		
}

RenUtils.prototype.determineGameFile = function(exePaths) {
	var renUtils = this;
	console.log("determine game exe from ", exePaths);
	if (typeof exePaths == 'string') exePaths = [exePaths];
	exePaths = exePaths || [];
	
	if (exePaths.length == 1) return Promise.resolve(exePaths[0]);

	exePaths = this.getLowestPaths(exePaths);

	var result = false;
	
	var promises = [];
	for (let i=0; i<exePaths.length; i++) {
		void function() {
			var thisPath = exePaths[i];
			promises.push(
				renUtils.isRenpyExe(thisPath, (isYes)=>{
					console.log("result of", thisPath, isYes);
					if (isYes) result = thisPath;
				})
			)
		}()
	}
	
	return new Promise((resolve, reject)=>{
		Promise.all(promises)
		.then(()=>{
			resolve(result)
		})
	})
	
}

window.renUtils = new RenUtils();

// =====================================================================
// 							RenParser Object
// =====================================================================
var RenParser = function(dir, options, callback) {
	this.dir 				= nwPath.normalize(dir);
	this.options 			= options || {};
	this.translationData 	= this.options.translationData||{};
	this.contextSeparator 	= this.options.contextSeparator || "/"
	this.showBlank 			= this.options.showBlank || false;
	this.engineName			= 'renpy'
	this.callback 			= callback || function() {}
	this.promise;
	this.isInitialized 		= false;
	this.translatable 		= {};
	this.options.filterOptions = this.options.filterOptions || {};
	this.options.filterOptions.files = this.options.filterOptions.files || [];
}
RenParser.prototype.getRelativePath = function(stringPath) {
	stringPath = nwPath.normalize(stringPath);
	
	return stringPath.substring(this.dir.length, stringPath.length);
}


RenParser.prototype.readDir = async function(dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (error, files) => {
      if (error) {
        return reject(error);
      }
      Promise.all(files.map((file) => {
        return new Promise((resolve, reject) => {
          const filepath = nwPath.join(dir, file);
          fs.stat(filepath, (error, stats) => {
            if (error) {
              return reject(error);
            }
            if (stats.isDirectory()) {
              this.readDir(filepath).then(resolve);
            } else if (stats.isFile()) {
              resolve(filepath);
            }
          });
        });
      }))
      .then((foldersContents) => {
        resolve(foldersContents.reduce((all, folderContents) => all.concat(folderContents), []));
      });
    });
  });
	
}


RenParser.prototype.writeToFolder = async function(targetFolder) {
	for (var relPath in this.translatable) {
		var thisFile = this.translatable[relPath]
		
		var targetPath = nwPath.join(targetFolder, relPath);
		console.log("Writing file : ", targetPath);
		await ui.log("正在写入文件："+ targetPath);
		try {
			fs.mkdirSync(nwPath.dirname(targetPath), {recursive:true});
		} catch(e) {
			console.warn("无法创建目录", nwPath.dirname(targetPath));
			throw(e);
			return;
		}
		
		var encoding = thisAddon.config.importEncoding || thisAddon.config.writeEncoding || thisFile.encoding || 'utf16le';
					//  setting from inject dialog     ||  setting from options          || file's original encoding || 'utf16le';
		
		// force UTF-8 if read encoding is ascii
		if (encoding == "ascii") encoding = "utf8";
		await thisFile.write(targetPath, encoding);
	}
	
}



RenParser.prototype.generateData = function(fileObject) {
	var result = {
		data:[],
		context:[],
		tags:[],
		parameters:[],
		indexIds:{}
	}
	if (!fileObject.translatableTexts) return result;
	for (var i=0; i<fileObject.translatableTexts.length; i++) {
		var thisObj = fileObject.translatableTexts[i];
		if (typeof result.indexIds[thisObj.text] == "undefined") result.indexIds[thisObj.text] = result.data.length;
		//result.indexIds[thisObj.text] = result.indexIds[thisObj.text] || result.data.length;
		
		var row = result.indexIds[thisObj.text];
		result.data[row] 		= result.data[row] || [thisObj.text, ""];

		result.context[row] 	= result.context[row]||[];
		result.context[row].push(thisObj.context.join(this.contextSeparator))

		result.parameters[row] 	= result.parameters[row] || [];
		result.parameters[row].push(thisObj.parameters);
	}
	
	return result;
	
}

RenParser.prototype.toTrans = function() {
	if (this.isInitialized == false) return console.error('未初始化，请先运行init()！');
	var transData = {
		project:{
			gameEngine: this.engineName,
			files:{}
		}
	}
	
	for (var relpath in this.translatable) {
		// change \ to /
		
		var thisTranslatable = this.translatable[relpath]
		
		relpath = relpath.replace(/\\/g, "/")
		
		var thisData = {};
		
		
		var thisGenData = this.generateData(thisTranslatable);
		if (!this.showBlank) if (thisGenData.data.length < 1) continue;
		thisData = {};
		thisData.data 		= thisGenData.data
		thisData.context 	= thisGenData.context
		thisData.tags 		= thisGenData.tags
		thisData.parameters = thisGenData.parameters
		thisData.filename 	= nwPath.basename(relpath);
		thisData.basename 	= nwPath.basename(relpath);
		thisData.indexIds 	= thisGenData.indexIds
		//thisData.groupLevel 	= thisGenData.groupLevel;	
		thisData.extension 	= nwPath.extname(relpath);
		thisData.lineBreak 	= "\n";
		thisData.nwPath 	= relpath // path is relative path from cache dir
		thisData.relPath 	= relpath // relpath is real filename address on context	
		thisData.type 		= null; // no special type
		thisData.originalFormat = "Renpy's .rpy File";			
		thisData.dirname 		= nwPath.dirname(relpath);	
		
		transData.project.files[relpath] = thisData;
		
		//if (thisGenData.title) transData.project.gameTitle = thisGenData.title;
		if (typeof thisTranslatable.configValue == 'object') {
			if (thisTranslatable.configValue.name) transData.project.gameTitle = thisTranslatable.configValue.name
			if (thisTranslatable.configValue.version) transData.project.version = thisTranslatable.configValue.version
		}
	
	}
	return transData;
	
}

RenParser.prototype.isMatchFilter = function(filePath) {
	// accept all for blank array
	if (this.options.filterOptions.files.length == 0) return true;
	if (typeof this.options.filterOptions.files == 'string') {
		if (this.options.filterOptions.files == filePath) return true;
	}
	if (this.options.filterOptions.files.includes(filePath)) {
		console.log("Match filter : ", filePath);
		return true;
	}

	return false;
}

RenParser.prototype.init = async function() {
	//var promises = [];
	
	return new Promise(async (resolve, reject) =>{
		var files = await this.readDir(this.dir)
		for (var i=0; i<files.length; i++) {
			var thisFile = files[i];
			
			var relativePath = this.getRelativePath(thisFile);
			var relativePathInv = relativePath.replace(/\\/g, "/");

			if (!this.isMatchFilter(relativePathInv)) continue;

			var translationPair = this.translationData[relativePathInv] || {};
			var thisOptions = Object.assign({}, this.options, translationPair)

			
			if (nwPath.extname(thisFile).toLowerCase() == ".rpy") {
				var thisRpy = new RpyFile(thisFile, thisOptions);
				console.log("Renpy object:", thisRpy);
				this.translatable[relativePath] = thisRpy;
				await thisRpy.parse();
				//promises.push(thisRpy.parse())
			}
		}
		
		this.isInitialized = true;
		resolve();

	})

}
window.RenParser = RenParser





// =====================================================================
// 							COMMON
// =====================================================================

var createProject = async function(sourceDir, options) {
	options = options || {}
	var projectId 		= common.makeid(10);
	var stagePath 		= nwPath.join(common.getStagePath(),projectId);
	var rpyFiles 		= [];	
	var renParser;
	

	await renUtils.makeEditable(sourceDir)

	console.log("复制 file to stage. From",sourceDir, " TO", nwPath.join(stagePath, "game"));
	fs.mkdirSync(nwPath.join(stagePath, "game"), {recursive:true});
	
	await ui.log(`复制自${sourceDir} to ${nwPath.join(stagePath, "game")}`);
	await bCopy(sourceDir, nwPath.join(stagePath, "game"), {
		filter: function(src, dest) {
			if (nwPath.extname(dest).toLowerCase() == '.rpy') {
				console.log("复制 ",src, dest);
				ui.loadingProgress("准备", "复制："+src, {consoleOnly:true, mode:'consoleOutput'});
				rpyFiles.push(dest)
				return true;
			}
			return false;
		},
		overwrite:true
	})

	console.log('Running renParser')
	ui.loadingProgress("处理", "解析文件", {consoleOnly:true, mode:'consoleOutput'});
	renParser = new RenParser(sourceDir, {
		'onParseStart' : function(currentFile) {
			ui.loadingProgress("处理", "处理 "+currentFile, {consoleOnly:true, mode:'consoleOutput'});
		}
	});				

	await renParser.init()
	try {
		var transData = renParser.toTrans();
		transData.project.projectId = projectId;
		transData.project.cache 	= transData.project.cache||{};
		transData.project.cache.cachePath = stagePath;
		transData.project.loc 		= sourceDir;
		transData.project.options 	= transData.project.options || {}
		transData.project.options.literalTags 	= options.literalTags || []
		
		var gameInfo = {
			title : transData.project.gameTitle
		}
		
		fs.writeFileSync(nwPath.join(stagePath, "gameInfo.json"), JSON.stringify(gameInfo, undefined, 2))


		
		ui.loadingProgress("处理", "解析完毕！", {consoleOnly:true, mode:'consoleOutput'});
		ui.loadingProgress("处理", "创建新项目。", {consoleOnly:true, mode:'consoleOutput'});
		console.warn("trans数据：", transData);
		
		trans.openFromTransObj(transData, {isNew:true});
		ui.loadingProgress("完成", "全部完成", {consoleOnly:true, mode:'consoleOutput'});
		ui.loadingEnd("完成", "完成");
		trans.autoSave();
		ui.showCloseButton();
		//trans.refreshGrid();
		//trans.evalTranslationProgress();		
	} catch(message)  {
		console.log("terminated prematurely");
		console.warn(message)
		if (message) ui.loadingProgress("处理", message, {consoleOnly:true, mode:'consoleOutput'});
		ui.loadingProgress("完成", "全部完成", {consoleOnly:true, mode:'consoleOutput'});
		ui.loadingEnd("完成", "完成");
		ui.showCloseButton();
	}
}



var exportToFolder = async function(sourceDir, targetDir, transData, options) {
	console.log("Running exportToFolder", arguments);
	
	options = options||{};
	trans.project.options 	= trans.project.options || {};
	options.literalTags 	= options.literalTags || trans.project.options.literalTags || [];
	options.writeEncoding 	= thisAddon.config.writeEncoding || options.writeEncoding || trans.project.writeEncoding;
	transData 				= transData || trans.getSaveData();
	
	//options.groupIndex = options.groupIndex||"relPath";
	
	return new Promise((resolve, reject) => {
		transData = JSON.parse(JSON.stringify(transData))
		var translationData = trans.getTranslationData(transData, options);
		console.warn("====================================")
		console.log("captured options", options);
		console.log(JSON.stringify(options, undefined, 2));
		
		console.log("translation Data : ", translationData);
		var renParser = new RenParser(sourceDir, {
			'writeMode' : true,
			'translationData': translationData.translationData,
			'writeEncoding' : thisAddon.config.writeEncoding||options.writeEncoding,
			'literalTags' : options.literalTags,
			'onParseStart' : function(currentFile) {
				ui.loadingProgress("处理", "处理 "+currentFile, {consoleOnly:true, mode:'consoleOutput'});
			},
			filterOptions : options.options
		});	
		//window.renParser = renParser;
		
		renParser.init()
		.then(async ()=> {
			await renParser.writeToFolder(targetDir);
			//console.log("%c renParser Obj >", 'background: #F00; color: #f1f1f1', renParser);
			resolve();
		})
	})
	
}


var applyTranslation = function(sourceDir, targetDir, transData, options) {
	options 		= options||{};
	transData 		= transData || trans.getSaveData();
	var exeFiles 	= [];
	

	console.log("copy from", sourceDir, "to:", targetDir);
	// copy the material to targetDir
	bCopy(sourceDir, targetDir, {
		filter: function(src, dest) {
			console.log("复制 ",src, dest);
			ui.loadingProgress(undefined, "复印："+src, {consoleOnly:true, mode:'consoleOutput'});
			if (nwPath.extname(dest).toLowerCase() == '.exe') exeFiles.push(dest);
			if (nwPath.extname(dest).toLowerCase() == '.bak') {
				console.log("Ignoring ", dest);
				return false;
			}
			
			return true;
		},
		overwrite:true
	})
	.then(() => {
		console.log("Copy files done!")
		return renUtils.determineGameFile(exeFiles)
	})
	.then(async (exeFile) => {
		console.log("exe file is :", exeFile);
		ui.loadingProgress("加载", "复制完毕", {consoleOnly:true, mode:'consoleOutput'});

		console.log("patching the file");
		ui.loadingProgress("加载", "修补数据。这可能需要一段时间...", {consoleOnly:true, mode:'consoleOutput'});
		
		await exportToFolder(targetDir, targetDir, transData, options);
		
		ui.loadingProgress("加载", "完成！", {consoleOnly:true, mode:'consoleOutput'});
		
		ui.loadingEnd("完成了", "所有过程都完成了！", {consoleOnly:false, mode:'consoleOutput', error:false});


		ui.LoadingAddButton("打开文件夹", function() {
			nw.Shell.showItemInFolder(exeFile);
		},{
			class: "icon-folder-open"
		});
		ui.LoadingAddButton("游玩！", function() {
			console.log("Opening game");
			nw.Shell.openItem(exeFile);
		},{
			class: "icon-play"
		});
		ui.showCloseButton();


	})
	
}



function init() {
	// handling 3rdParty :
	//thirdParty.loadConfig("www\\addons\\unityTrans\\3rdParty.json");
	
	var $slide = $(`
		<h1><i class="icon-plus-circled"></i>Renpy游戏</h1>
		<div class="blockBox infoBlock withIcon">
			<h2>renParser Ver.`+thisAddon.package.version+`</h2>
			<p>该解析器仍在积极开发中。</p>
		</div>
		<div class="blockBox warningBlock withIcon">
			<h1>请备份你的项目！</h1>
			<p>
				此操作将把游戏转换为可编辑的项目。<br />
				将修改选定的Renpy游戏。<br />
				如果这个过程失败了，你的游戏很可能会被破坏，无法进行。
			</p>
		</div>

		<div class="dialogSectionBlock">
			<label class="flex fullWidth">
				<div class="flexMain">
					<div class="label">${t("反编译所有rpyc文件")}</div>
					<div class="info" data-tran="">${t("尝试将所有rpyc 文件反编译为。rpy<br />Translator++ 有自己的反编译器。但据报道，有时它无法对使用Renpy 7创建的一些游戏进行反编译。在开始一个项目之前，你可以不选中这个字段，自己用自己的工具反编译游戏。")}</div>
				</div>
				<div>
					<input type="checkbox" class="flipSwitch decompileRpyc" data-fld="decompileRpyc" value="1" /> 
				</div>
			</label>
		</div>		

		<div class="dialogSectionBlock">
			<label class="flex fullWidth">
				<div class="flexMain">
					<div class="label">${t("如果存在同名的rpy文件，则跳过反编译rpyc")}</div>
					<div class="info" data-tran="">${t("您可以使用此选项仅反编译少数选定项目<br />如果<b>反编译所有rpyc 文件</b>设置为false，则此选项将失去意义。")}</div>
				</div>
				<div>
					<input type="checkbox" class="flipSwitch skipExistingRpy" data-fld="skipExistingRpy" value="1" /> 
				</div>
			</label>
		</div>		


		<div class="fieldgroup">
			<div class="actionButtons">
			</div>
		</div>`);
		
	$slide.find(".decompileRpyc").prop("checked", thisAddon.config.decompileRpyc);
	$slide.find(".decompileRpyc").on("change", function() {
		thisAddon.config.decompileRpyc = $(this).prop("checked");
	})

	$slide.find(".skipExistingRpy").prop("checked", thisAddon.config.skipExistingRpy);
	$slide.find(".skipExistingRpy").on("change", function() {
		thisAddon.config.skipExistingRpy = $(this).prop("checked");
	})

	

	var $button = $('<button class="btnSelectExe selectRPGExe"><i class="icon-doc-inv"></i>从游戏中选择可执行文件</button>')
	$button.on('click', function() {
		if (!thisAddon.config.decompileRpyc) {
			var conf = confirm(t("你确定要在不反编译rpyc文件的情况下启动项目吗？"))		
			if (!conf) return;
		}

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
					ui.loadingProgress("处理", "解析。rpy文件...", {consoleOnly:true, mode:'consoleOutput'});
				})
			}
		})		
	})
	$slide.find(".actionButtons").append($button);
	
	ui.newProjectDialog.addMenu({
		icon : "addons/renParser/icon.png",
		descriptionBar : `<h2>Ren'Py游戏</h2>
						<p>从Renpy Games开始翻译</p>`,
		actionBar: "",
		goToSlide: 'renpy',
		at:3,
		slides : {
			'renpy': $slide
		}
	})

	// register handler
	if (typeof window.engines.renpy == 'undefined') engines.add('renpy');
	engines.renpy.addProperty('exportHandler', function(targetPath, options) {
		if (options.mode !== "dir" && options.mode !== "zip") return false;
		
		ui.showLoading();
		ui.loadingProgress("处理", "解析来自"+targetPath, {consoleOnly:false, mode:'consoleOutput'});
		try {
			var pathStat = fs.lstatSync(targetPath)
			
			if (pathStat.isDirectory()) {
				console.log("Executing directory mode");
				exportToFolder(nwPath.join(trans.project.cache.cachePath, "game"), targetPath, trans.getSaveData(), options)
				.then(() => {
					ui.loadingProgress("完成", "所有过程都完成了！", {consoleOnly:false, mode:'consoleOutput'});
					ui.showCloseButton();
				})

				return true;
			}
		} catch (e) {
			
		}
		
		
		// is file
		var tmpPath = nwPath.join(nw.process.env.TMP, trans.project.projectId);
		fs.removeSync(tmpPath); 
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
	
	engines.renpy.addProperty('injectHandler', function(targetDir, sourceMaterial, options) {
		console.log("路径是：", targetDir);
		console.log("选项包括：", options);
		console.log(arguments);

		ui.showLoading();
		// convert sourceMaterial to folder if path is file
		var sourceStat = fs.lstatSync(sourceMaterial)
		if (sourceStat.isFile()) sourceMaterial = nwPath.dirname(sourceMaterial);
		
		ui.loadingProgress("处理", "解析数据。窗户有时会挂起来。这很正常！", {consoleOnly:false, mode:'consoleOutput'});
		applyTranslation(sourceMaterial, targetDir, trans.getSaveData(), options);
		
		return true;
	});

	var allowedExtension = [".rpy"];
	engines.addHandler(["renpy"], 'onLoadSnippet', async function(selectedCell) {
		console.log("Renpy onLoadSnippet handler");
		console.log("selected cell:", selectedCell);
		var obj = trans.getSelectedObject();

		if (allowedExtension.includes(obj.extension) == false) return;

		this.commonHandleFile(selectedCell, "renpy");

	});	
	
}

$(document).ready(function() {
	ui.onReady(function() {
		init();
	});
});