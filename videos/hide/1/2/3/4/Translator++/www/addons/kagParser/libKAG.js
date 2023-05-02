module.exports = function(thisAddon) {
var defaultLiteralTags = ["ruby", "l", "r"];

var encoding 	= require('encoding-japanese');
var iconv 		= require('iconv-lite');
var path 		= require('path');
var fs 			= require('graceful-fs');
var bCopy 		= require('better-copy');
var fse 		= require('fs-extra')

var kstg 		= require("kstg");
var {TyranoParser} = require("www/addons/kagParser/TyranoParser.js")


// =================================================================
//  					kag main file parser
// =================================================================
class KAGFile extends require("www/js/ParserBase.js").ParserFile {
    constructor(file, options, callback) {
        super(file, options, callback)
    }
}

KAGFile.prototype.filterText = function(text) {
    // filter text for trans
    text = text.replace(/^[\t]+(?=.*\n?)/gm, ''); // remove tab
    text = text.replace(/[\n\r]+/g,'') // remove new line
    
    text = text.replace(/(\[r\])/g, "\n");
    return text;
}

KAGFile.prototype.unfilterText = function(text) {
    // generate text from trans to raw ks
    text = text.replace(/([\r]+)/g, '');
    //text = text.replace(/([\n]+)/g, "[r]\n"); <-- remove multiple with single?
    text = text.replace(/([\n])/g, "[r]\n");
    //text = "\n"+text+"\n";
    
    return text;
}



// =================================================================
//  					.tjs file parser
// =================================================================
class TjsFile extends KAGFile {
    constructor(file, options, callback) {
        super(file, options, callback);
        this.options = this.options || {};
        this.type = "tjs";
        
        this.filterText = function(text) {
            return text;
        }

        this.unfilterText = function(text) {
            return text;
        }
        
    }
}

TjsFile.fetch = function(theString, parentObject) {
    var that = parentObject||this;
    var chunkOffset = [0];
    var commentsOffset = [];
    var lastLine = 0;

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

    var isComment = function(string, offset) {
        var startingLine = getStartingLine(string, offset);
        if (string.substring(startingLine, offset).includes('//')) return true
        return false;
    }
        

    theString.replace(/\/\*(.+?)\*\//gs, function() {
        //console.log("Comments : ", arguments);
        commentsOffset.push({
            start:arguments[2],
            end:arguments[2]+arguments[0].length,
        });
        return arguments[0]
    })

    // this version doesn't capture non uniode
    //theString.replace(/(?<=(["']\b))(?:(?=(\\?))\2.)*?(?=\1)/gms, function() {
    theString.replace(/(?<=((?<=[\s,.:;"']|^)["']))(?:(?=(\\?))\2.)*?(?=\1)/gmu, function() {
        //console.log(arguments);
        var offset = arguments[3];
        var text = arguments[4];
        var endOffset = offset+arguments[0].length;
        var lineStartAt = getStartingLine(arguments[4], arguments[3]);
        /*
        console.log("this line started at ", lineStartAt, arguments[4][lineStartAt]);
        console.log("offset end : ", arguments[3]+arguments[0].length);
        */
        
        var lastOffset = chunkOffset[chunkOffset.length-1]||0;

        
        // calculating line count
        //var lineCount = lastLine+text.substring(lastOffset, offset).split("\n").length;
        
        var lines = text.substring(0, offset).split("\n");
        var lineCount = lines.length;
        var cols = lines[lines.length-1].length;
        //console.log("Translatable text at line :", lineCount);

        that.register(text.substring(lastOffset, offset));
        if (!isInsideCommand(offset) && !isComment(text, offset)) {
            var previoustext = text.substring(lineStartAt, offset);
            var context = ["line", lineCount, "col", cols];
            //console.log("previous text", previoustext);
            if (/System\.title\s*=\s*/.test(previoustext)) context.push("title")
            that.registerString(text.substring(offset, endOffset), context);
        }

        lastLine = lineCount;
        chunkOffset.push(endOffset);
        // registering string
            for (var cOffset in commentsOffset) {
                //if (commentOffset[cOffset])
            }
        // end of registering string
        return arguments[0];
    })	


    var lastOffset = chunkOffset[chunkOffset.length-1]||0;
    // register the final part of the data
    that.register(theString.substring(lastOffset));
    
}

TjsFile.fetch = async function(theString, parentObject) {
    var esScript = new ESScript(theString, this.options);
    await esScript.parse();
    this.writableData = esScript.writableData;
    this.translatableTexts  = esScript.translatableTexts;
    this.esScript = esScript;
}

/*
TjsFile.prototype.readFile = async function(filePath) {
    filePath = filePath || this.file;
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) return reject();
            
            resolve(data);
        })			
    })

}
*/

TjsFile.prototype.parse = async function() {
    this.contextEnter(path.basename(this.file));
    this.promise = new Promise(async (resolve, reject) => {
        /*
        var data = await this.readFile(this.file);
        this.buffer = data;
        this.encoding = encoding.detect(data);
        this.string = iconv.decode(this.buffer, this.encoding);
        */
        this.string 	= await this.readFile();
        TjsFile.fetch.call(this, this.string)
        
        this.contextEnd();
        resolve(this.string);
    })
    return this.promise;	
}

/*
var tjsFile = new TjsFile('F:/test/KAG3/test.tjs');
console.log("test parsing js");
tjsFile.parse()
.then(() => {
    console.warn("TJS File", tjsFile);
});
*/


// =================================================================
//  					.ks file parser
// =================================================================

class KsFile extends KAGFile {
    constructor(file, options, callback) {
        super(file, options, callback);
        this.options = this.options || {};
        this.options.literalTags = this.options.literalTags || ["ruby", "l", "r"]
        if (!this.options.literalTags.includes("r")) this.options.literalTags.push("r");
        
        this.type = "ks";

    }
}

KsFile.tagFlags = {
    'macro' : {
        closureType:'start'
    }
    ,'endmacro' : {
        closureType:'end'
    }
    
}

KsFile.parser = function(data) {
    
}


KsFile.prototype.storeScript = function(data) {
    // store script so that they will never changed
    this.__scriptStorage = this.__scriptStorage || [];
    this.__scriptStorage.push(data);
    return this.__scriptStorage.length - 1;
}

KsFile.prototype.getScript = function(id) {
    // get text from <isscript> tag
    this.__scriptStorage = this.__scriptStorage || [];
    
    return this.__scriptStorage[id];
}


KsFile.prototype.htmlIfy = function(string) {
    string = string || this.string;
    if (string.trim().length < 1) return $(document.createTextNode(''));
    
    var that = this;
    var ignored = {};
    var iscript = {};
    // substitute escape character [[
    var escaper = "-------"+Date.now()+":"+Math.random()+"-------"
    string = string.replace(/\[\[/g, escaper)
    
    //string = string.replace(/\[ignore[^]]*\](.+?)\[endignore\]/g, '')
    
    // replace @ command with proper [] command
    // string = string.replace(/^([\t]*)[\@](.*(?=\n?))/gm, '[$2]');
    
    
    
    // remove anything between [ignore] [endignore]
    //string = string.replace(/\[ignore\](.+?)\[endignore\]/gs, '')
    string = string.replace(/\[ignore\](.+?)\[endignore\]/gs, function() {
        //var escaper = "-------ignored"+ignored.length+Date.now()+":"+Math.random()+"-------"
        //ignored[escaper] = arguments[0] // including the outer tag
        return "<ignore>"+that.storeScript(arguments[1])+"</ignore>";
    })
    // @ command ignore
    string = string.replace(/^[\t]*\@ignore\s*?(.*?)^[\t]*\@endignore\n?/gsm, function() {
        //var escaper = "-------ignored"+ignored.length+Date.now()+":"+Math.random()+"-------"
        //ignored[escaper] = arguments[0] // including the outer tag
        return "<ignore>"+that.storeScript(arguments[1])+"</ignore>";
    })
    
    
    // remove anything between [iscript] [endscript]
    // script is being handled with different method
    string = string.replace(/\[iscript\](.+?)\[endscript\]/gs, function() {
        //var escaper = "-------iscript"+iscript.length+Date.now()+":"+Math.random()+"-------"
        //iscript[escaper] = arguments[1] // excluding the outer tag
        return "<iscript>"+that.storeScript(arguments[1])+"</iscript>";
    })
    // @ command iscript
    string = string.replace(/^[\t]*\@iscript\s*?(.*?)^[\t]*\@endscript\n?/gsm, function() {
        //var escaper = "-------iscript"+iscript.length+Date.now()+":"+Math.random()+"-------"
        //iscript[escaper] = arguments[0] // including the outer tag
        return "<at-iscript>"+that.storeScript(arguments[1])+"</at-iscript>";
    })

    
    // parsing macro
    //string = string.replace(/\[macro\s(.+?)\](.+?)\[endmacro\]/gs, '<macro $1>$2</macro>');
    
    // remove any line starting with ; * @
    // string = string.replace(/^[\;\*\@].*\n?/gm, function() {
    // match tab only with positive look ahead ^[\t]*(?=[\;\*\@].*\n?)
    
    
    //string = string.replace(/^([\t]*)[\;\*\@].*\n?/gm, function() {
    string = string.replace(/^([\t]*)[\;\*].*\n?/gm, function() {
        return "<skip>"+arguments[0]+"</skip>"
    });
    //string = string.replace(/\[/g, "<tag command=");
    //string = string.replace(/\]/g, " />");
    
    // ========================================================
    // parsing tags
    // ========================================================
    var attributes = {};
    // replace attributes inside tags to escape nested []
    string = string.replace(/(\S+)\s*=\s*([']|[\"])([\W\w]*?)\2/g, function() {
        //console.log(arguments);
        var escaper = "---attr"+arguments[4]+":"+Date.now()+":"+Math.random()+"---"
        attributes[escaper] = arguments[0];
        return escaper;
    })


    //string = string.replace(/\[(.+?)\]/g, '<tag $1 />')
    string = string.replace(/\[(.+?)\]/g, function() {
        var command = arguments[1].split(" ")[0];
        if (that.options.literalTags.includes(command)) return arguments[0];
        return '<tag command="'+command+'" '+arguments[1]+'>'+arguments[0]+'</tag>'
    })
    
    // restore attributes inside tags
    for (var attr in attributes) {
        string = string.split(attr).join(attributes[attr])
    }	
    

    
    // parsing @ command
    string = string.replace(/^([\t]*)[\@](.*(?=\n?))/gm, function() {
        var command = arguments[2].split(" ")[0];
        //console.log(arguments);
        return '<tag command="'+command+'" '+arguments[2]+'>'+arguments[0]+'</tag>'
    });
    
    // bring back escape character [[
    string = string.split(escaper).join("[[")
    /*
    for (var boundary in ignored) {
        string = string.split(boundary).join(ignored[boundary])
    }
    
    for (var boundary in iscript) {
        string = string.split(boundary).join(iscript[boundary])
    }
    */
    
    //console.log(string);
    //return string;
    fs.writeFileSync(this.file+".html", string)
    return $.parseHTML(string);
}

KsFile.prototype.unHtmlIfy = function(htmlElement) {
    var htmlString = htmlElement.outerHTML;
    return htmlString;
}


KsFile.prototype.parse = async function() {
    this.options.onParseStart.call(this, this.file)
    this.contextEnter(path.basename(this.file));

    
    this.promise = new Promise((resolve, reject) => {
        fs.readFile(this.file, (err, data) => {
            if (err) return reject();
            this.buffer = data;
        
            this.encoding = encoding.detect(data);
            // if encoding is not detected, read with default writeEncoding
            if (!this.encoding) this.encoding = this.writeEncoding;
            
            try {
                this.string = iconv.decode(this.buffer, this.encoding);
            } catch (e) {
                console.warn("无法解码字符串请尝试“Shift_JIS”", e);
                this.string = iconv.decode(this.buffer, 'Shift_JIS');
            }
    
            var htmlElm = this.htmlIfy();
            //console.log("HTML structure of : ", this.file);
            //console.log(htmlElm);
            
            for (var i=0; i<htmlElm.length; i++) {
                var thisElm = htmlElm[i];
                if (thisElm.nodeName !== "#text") {
                    // handle non text node
                    try {
                        var commandName = thisElm.getAttribute("command");
                    } catch (e) {
                        var commandName = "";
                        console.warn(e)
                    }
                    
                    if (thisElm.nodeName == 'SKIP') {
                        this.register(thisElm.innerText);
                        continue;
                    } else if (thisElm.nodeName == 'ISCRIPT') {
                        //this.register('[iscript]'+thisElm.innerText+'[endscript]');
                        this.register('[iscript]'+this.getScript(thisElm.innerText)+'[endscript]');
                        continue;
                    } else if (thisElm.nodeName == 'IGNORE') {
                        //this.register('[iscript]'+thisElm.innerText+'[endscript]');
                        this.register('[ignore]'+this.getScript(thisElm.innerText)+'[endignore]');
                        continue;
                    } else if (thisElm.nodeName == 'AT-IGNORE') {
                        //this.register('[iscript]'+thisElm.innerText+'[endscript]');
                        this.register('@ignore'+this.getScript(thisElm.innerText)+'@endignore');
                        continue;
                    } else if (thisElm.nodeName == 'AT-ISCRIPT') {
                        //this.register('[iscript]'+thisElm.innerText+'[endscript]');
                        this.register('@iscript'+this.getScript(thisElm.innerText)+'@endscript');
                        continue;
                    }
    
                    
                    if (KsFile.tagFlags[commandName]) {
                        if (KsFile.tagFlags[commandName].closureType == 'start') this.contextEnter(commandName)
                        if (KsFile.tagFlags[commandName].closureType == 'end') this.contextEnd(commandName)
                        
                    }
    
                    this.register(thisElm.innerText);
                    continue;
                };
                
                // handle text node
                this.registerString(thisElm.textContent, ["text", i]);
            }
            
            this.contextEnd();
            this.options.onParseEnd.call(this, this.file)			
            resolve(this);
        })
        
    })
    
    return this.promise;
    
}


/*
KsFile.prototype.readFile = async function() {
    return new Promise((resolve, reject) => {
        fs.readFile(this.file, (err, data) => {
            if (err) return reject();
            
            resolve(data);
        })
    })
            
}
*/

/**
 * Create grouped translatable Text and raw data from structure
 * @param  {} structure
 */
KsFile.prototype.groupStructure = function(structure) {

    structure.contents = structure.contents || [];
    var previousState = null;
    var lastPointer = 0; // begining of file
    var lastLine = {};

    var result = []
    var groupId = 0;
    var lastGroupId = 0;

    var scriptTagLevel = 0;
    var ignoreTagLevel = 0;
    var specialHandler = false;
    
    for (var i=0; i<structure.contents.length; i++) {
        var thisLine = structure.contents[i];
        var lastLine = structure.contents[i-1] || {};
        var nextLine = structure.contents[i+1] || {};
        thisLine.name = thisLine.name || {};
        nextLine.name = nextLine.name || {};
        thisLine.loc = thisLine.loc || {};

        var createNewGroup = false;

        //if (lastGroupId !== groupId) console.log("Group ID : "+groupId);
        result[groupId] = result[groupId] || {
            list : [],
            start : thisLine.start,
            end : thisLine.end,
            loc : {
                start : thisLine.loc.start,
                end : thisLine.loc.end
            }
        }

        result[groupId].end = thisLine.end;
        result[groupId].loc.end = thisLine.loc.end;
        result[groupId].list.push(thisLine);

        //console.log("|-: ", i, thisLine.name.name || "", thisLine);
        //console.log("|-- isScript level ", scriptTagLevel);
        if (scriptTagLevel > 0) {
            result[groupId].type = "script";

            //console.log("|-- next line", nextLine);
            if (nextLine.name.name == "endscript") {
                //console.log("|---- next is endscript");
                //console.log("|======================================");
                lastGroupId = groupId;

                result[groupId].raw = this.string.substring(result[groupId].start, result[groupId].end);
                groupId++;
                scriptTagLevel--;
                specialHandler = false;
            }
            lastGroupId = groupId;
            continue;
        }
        //console.log("|-- ignore level ", ignoreTagLevel);
        if (ignoreTagLevel > 0) {
            result[groupId].type = "ignorable";

            //console.log("|--endignore", i, thisLine);
            //console.log("|--Next line", nextLine);
            if (nextLine.name.name == "endignore") {
                //console.log("|---- next is endignore");
                //console.log("|======================================");
                lastGroupId = groupId;

                result[groupId].raw = this.string.substring(result[groupId].start, result[groupId].end);
                groupId++;
                ignoreTagLevel--;
                specialHandler = false;
            }
            lastGroupId = groupId;
            continue;
        }


        if (specialHandler == false) {
            //console.log("|--SPECIAL HANDLER == false");
            if (thisLine.name.name == "iscript" && nextLine.name.name !== "endscript") {
                //console.log("|--marking as isScript");
                scriptTagLevel++;
                specialHandler = true;
            } else if (thisLine.name.name == "ignore" && nextLine.name.name !== "endignore") {
                //console.log("|--marking as ignore");
                ignoreTagLevel++;
                specialHandler = true;
            }
        }

        if (thisLine.type == "Text" || this.options.literalTags.includes(thisLine.name.name)) {
            result[groupId].type = "translatable";
            //console.log("|--is Text", thisLine);
            //console.log("|--Next", nextLine);
            if (nextLine.type !== "Text" && this.options.literalTags.includes(nextLine.name.name)==false) {
                //console.log("|---- next is non text...");
                //console.log("|---- Checking whether next is literal tags", this.options.literalTags, nextLine.name.name, this.options.literalTags.includes(nextLine.name.name));
                createNewGroup = true;
            }
        } else {
            // non text
            result[groupId].type = "command";

            //console.log("|--Non Text", thisLine);
            //console.log("|--Next line", nextLine);
            if (nextLine.type == "Text" || this.options.literalTags.includes(nextLine.name.name)) {
                //console.log("|---- next is text...");
                //console.log("|======================================");

                createNewGroup = true;
                
            }
    
        }

        result[groupId].raw = this.string.substring(result[groupId].start, result[groupId].end);
        lastGroupId = groupId;
        if (createNewGroup) groupId++;
    }
    return result
}


/**
 * Alternative parser using KSTG library
 * but current KSTG library is hang up on certain file
 */
KsFile.prototype.parse2 = async function() {
    this.options.onParseStart.call(this, this.file)
    this.contextEnter(path.basename(this.file));
    
    /*
    var data = await this.readFile();

    this.buffer = data;
        
    this.encoding = encoding.detect(data);
    // if encoding is not detected, read with default writeEncoding
    if (!this.encoding) this.encoding = this.writeEncoding;
    
    try {
        this.string = iconv.decode(this.buffer, this.encoding);
    } catch (e) {
        console.warn("Unable to decode string try 'Shift_JIS'", e);
        this.string = iconv.decode(this.buffer, 'Shift_JIS');
    }
    */
    this.string 	= await this.readFile();
    var structure 	= kstg.parse(this.string);
    //console.log(structure);

    var structureGroup = this.groupStructure(structure);
    //console.log(structureGroup);
    
    for (var i=0; i<structureGroup.length; i++) {
        if (structureGroup[i].type !== "translatable") {
            this.register(structureGroup[i].raw);
        } else if (structureGroup[i].type == "translatable") {
            this.registerString(structureGroup[i].raw, ["text", i]);
        }
    }


    this.contextEnd();
    this.options.onParseEnd.call(this, this.file)
    
    
    return new Promise((resolve, reject) => {
        resolve(this)
    });
    
}



/**
 * Parser with TyranoParser.js
 */
    KsFile.prototype.parse3 = async function() {
    this.options.onParseStart.call(this, this.file)
    this.contextEnter(path.basename(this.file));
    
    /*
    var data = await this.readFile();

    this.buffer = data;
        
    this.encoding = encoding.detect(data);
    // if encoding is not detected, read with default writeEncoding
    if (!this.encoding) this.encoding = this.writeEncoding;
    
    try {
        this.string = iconv.decode(this.buffer, this.encoding);
    } catch (e) {
        console.warn("Unable to decode string try 'Shift_JIS'", e);
        this.string = iconv.decode(this.buffer, 'Shift_JIS');
    }
    */
    this.string 	= await this.readFile();

    var structure = TyranoParser.parseScenario(this.string)
    //console.log(structure);

    var structureGroup = TyranoParser.getWritable(structure, this.options.literalTags);
    //console.log(structureGroup);
    
    for (var i=0; i<structureGroup.length; i++) {
        if (structureGroup[i].group == "translatable") {
            this.registerString(structureGroup[i].raw, ["text", i], {
                start:structureGroup[i].start,
                end:structureGroup[i].end
            });
        } else if (structureGroup[i].group == "script") {
            console.log("Parsing embeded script");
            // should parse with ES parser here
            var esScript = new ESScript(structureGroup[i].raw, this.options);
            await esScript.parse();
            esScript.writableData = esScript.writableData ||[];
            esScript.translatableTexts = esScript.translatableTexts ||[]
            this.writableData = this.writableData.concat(esScript.writableData);
            for (var j=0; j<esScript.translatableTexts.length; j++) {
                var newTranslatable = esScript.translatableTexts[j]
                newTranslatable.parameters = newTranslatable.parameters || {}
                // add offset
                newTranslatable.parameters.start += structureGroup[i].start; 
                newTranslatable.parameters.end += structureGroup[i].start; 
                newTranslatable.parameters.type = "script"; 
                this.translatableTexts.push(newTranslatable);
            }

        } else {
            this.register(structureGroup[i].raw);			
        }
    }


    this.contextEnd();
    this.options.onParseEnd.call(this, this.file)
    
    
    return new Promise((resolve, reject) => {
        resolve(this)
    });
    
}



// =================================================================
//  							KAGJs
// =================================================================

var KAGJs = function(dir, options, callback) {
    this.dir 				= path.normalize(dir);
    this.options 			= options || {};
    this.translationData 	= this.options.translationData||{};

    this.contextSeparator 	= this.options.contextSeparator || "/"
    this.showBlank 			= this.options.showBlank || false;
    this.callback 			= callback || function() {}
    this.promise;
    this.isInitialized 		= false;
    this.translatable 		= {};
    this.options.filterOptions = this.options.filterOptions || {};
    this.options.filterOptions.files = this.options.filterOptions.files || [];	
}

KAGJs.prototype.getRelativePath = function(stringPath) {
    stringPath = path.normalize(stringPath);
    
    return stringPath.substring(this.dir.length, stringPath.length);
}

KAGJs.prototype.readDir = async function(dir) {
    return new Promise((resolve, reject) => {
    fs.readdir(dir, (error, files) => {
        if (error) {
        return reject(error);
        }
        Promise.all(files.map((file) => {
        return new Promise((resolve, reject) => {
            const filepath = path.join(dir, file);
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


KAGJs.prototype.writeToFolder = function(targetFolder) {
    //if (this.writeMode == false) return console.warn("Unable to write. Reason : not in write mode!");
    
    var promises = [];
    
    return new Promise((resolve, reject) => {
        for (var relPath in this.translatable) {
            var thisFile = this.translatable[relPath]
            
            /*
            if (thisFile.isParseSuccess == false) {
                console.warn("skip processing ", relPath, "reason : Previously the file was not successfully parsed!");
                continue;
            }
            */
            
            var targetPath = path.join(targetFolder, relPath);
            //console.log("creating directory : ", path.dirname(targetPath));
            try {
                fs.mkdirSync(path.dirname(targetPath), {recursive:true});
            } catch(e) {
                console.warn("无法创建目录", path.dirname(targetPath));
                throw(e);
                return;
            }
            
            var encoding = thisAddon.config.importEncoding || thisAddon.config.writeEncoding || thisFile.encoding || 'utf16le';
                        //  setting from inject dialog     ||  setting from options          || file's original encoding || 'utf16le';
            if (encoding == "ascii") encoding = "utf8";
            promises.push(thisFile.write(targetPath, encoding))
        }
        
        Promise.all(promises)
        .then(() => {
            resolve();
        })
    })
    
}


KAGJs.prototype.generateData = function(fileObject) {
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

        //result.indexIds[thisObj.text] = result.indexIds[thisObj.text] || result.data.length;
        if (typeof result.indexIds[thisObj.text] == "undefined") result.indexIds[thisObj.text] = result.data.length;
        //result.indexIds[thisObj.text] = result.indexIds[thisObj.text] || result.data.length;
        
        var row = result.indexIds[thisObj.text];
        result.data[row] 	= result.data[row] || [thisObj.text, ""];
        result.context[row] = result.context[row]||[];
        result.context[row].push(thisObj.context.join(this.contextSeparator))
        result.parameters[row] = result.parameters[row]||[];
        result.parameters[row].push(thisObj.parameters)

        if (!thisObj.parameters.leftHand) continue;
        if (thisObj.parameters.leftHand.type == "assignment") {
            //console.warn("Title found, assigning game title", thisObj);
            if (thisObj.parameters.leftHand.context.join(".") == "System.title") this.gameTitle = thisObj.text;
        }
        
        //if (thisObj.context.includes('title')) result.title = thisObj.text;
    }
    
    return result;
    
}

KAGJs.prototype.toTrans = function() {
    if (this.isInitialized == false) return console.error('未初始化，请先运行init()！');
    var transData = {
        project:{
            gameEngine: this.options.engineName || "kag",
            files:{}
        }
    }
    
    for (var relpath in this.translatable) {
        // change \ to /
        
        var thisTranslatable = this.translatable[relpath]
        
        relpath = relpath.replace(/\\/g, "/")
        
        if (thisTranslatable.type == 'ks') {
            var thisData = {};
            
            
            var thisGenData = this.generateData(thisTranslatable);
            if (!this.showBlank) if (thisGenData.data.length < 1) continue;
            thisData = {};
            thisData.data 		= thisGenData.data
            thisData.context 	= thisGenData.context
            thisData.tags 		= thisGenData.tags
            thisData.parameters = thisGenData.parameters
            thisData.encoding	= thisTranslatable.encoding;
            thisData.detectedEncoding = thisTranslatable.detectedEncoding;
            thisData.filename 	= path.basename(relpath);
            thisData.basename 	= path.basename(relpath);
            thisData.indexIds 	= thisGenData.indexIds
            //thisData.groupLevel 	= thisGenData.groupLevel;	
            thisData.extension 	= path.extname(relpath);
            thisData.lineBreak 	= "\n";
            thisData.path 		= relpath // path is relative path from cache dir
            thisData.relPath 		= relpath // relpath is real filename address on context	
            thisData.type 		= null; // no special type
            thisData.originalFormat = "KAG's .ks File";			
            thisData.dirname 		= path.dirname(relpath);	
            
            transData.project.files[relpath] = thisData;
        } else if (thisTranslatable.type == 'tjs') {
            var thisData = {};
            
            
            var thisGenData = this.generateData(thisTranslatable);
            if (!this.showBlank) if (thisGenData.data.length < 1) continue;
            thisData = {};
            thisData.data 		= thisGenData.data
            thisData.context 	= thisGenData.context
            thisData.tags 		= thisGenData.tags
            thisData.parameters	= thisGenData.parameters
            thisData.encoding	= thisTranslatable.encoding;
            thisData.detectedEncoding = thisTranslatable.detectedEncoding;
            thisData.filename 	= path.basename(relpath);
            thisData.basename 	= path.basename(relpath);
            thisData.indexIds 	= thisGenData.indexIds
            //thisData.groupLevel 	= thisGenData.groupLevel;	
            thisData.extension 	= path.extname(relpath);
            thisData.lineBreak 	= "\n";
            thisData.path 		= relpath // path is relative path from cache dir
            thisData.relPath 	= relpath // relpath is real filename address on context	
            thisData.type 		= null; // no special type
            thisData.originalFormat = "KAG's .tjs File";			
            thisData.dirname 		= path.dirname(relpath);	
            
            transData.project.files[relpath] = thisData;
            
            //if (thisGenData.title) transData.project.gameTitle = thisGenData.title;
            
        }
        
    }

    transData.project.gameTitle         = this.gameTitle;
    transData.project.parser            = thisAddon.package.name;
    transData.project.parserVersion     = thisAddon.package.version;

    return transData;
}

KAGJs.prototype.isMatchFilter = function(filePath) {
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

KAGJs.prototype.init = async function() {
    var promises = [];
    
    return new Promise(async(resolve, reject) =>{
        var files = await this.readDir(this.dir)
            //console.log(files);
        for (var i=0; i<files.length; i++) {
            var thisFile = files[i];
            
            var relativePath = this.getRelativePath(thisFile);
            var relativePathInv = relativePath.replace(/\\/g, "/");

            if (!this.isMatchFilter(relativePathInv)) continue;

            var translationPair = this.translationData[relativePathInv] || {};
            var thisOptions = Object.assign({}, this.options, translationPair)
            
            if (path.extname(thisFile).toLowerCase() == ".ks") {
                await ui.log("正在分析ks文件："+thisFile);
                var thisKS = new KsFile(thisFile, thisOptions);
                this.translatable[relativePath] = thisKS;
                if (thisAddon.config.useLegacyParser) {
                    //promises.push(thisKS.parse())
                    await thisKS.parse();
                } else {
                    //promises.push(thisKS.parse2())
                    await thisKS.parse3();
                }
            } else if (path.extname(thisFile).toLowerCase() == ".tjs") {
                await ui.log("正在分析ks文件："+thisFile);
                var thisTJS = new TjsFile(thisFile, thisOptions);
                this.translatable[relativePath] = thisTJS;
                //promises.push(thisTJS.parse())
                await thisTJS.parse();
            }
        }
        
        this.isInitialized = true;
        resolve();
        return;

    })

}





//console.log(ksFile);
utils = {};

var renamePath = async function(oldpath, newpath) {
    return new Promise((resolve, reject)=>{
        fs.rename(oldpath, newpath, ()=>{
            resolve(newpath);
        });
    })
}
utils.renamePath = renamePath;

var normalizeStructure = async function(sourceDir) {
    //copy ./KrkrExtract_Output/data to ./data
    var KrkrExtract = path.join(sourceDir, "KrkrExtract_Output")

    
    if (common.isDir(KrkrExtract) == false && common.isDir(path.join(sourceDir, "data"))) {
        return Promise.resolve();
    }
    if (common.isDir(KrkrExtract) == false && common.isDir(path.join(sourceDir, "data")) == false) {
        var msg = "无法在此版本处理未跟踪的KAG。在使用Translator++之前，请先提取所有xp3档案。";
        alert(msg);
        return Promise.reject(msg);
    }
    
    var stats = fs.statSync(KrkrExtract);
    var filesToMove = [];
    return new Promise(async (resolve, reject) => {
        if (stats.isDirectory() == false) return resolve()
            
        filesToMove = fs.readdirSync(KrkrExtract);		
        
        
        var promises = [];
        for (var i=0; i<filesToMove.length; i++) {
            var newPath = path.join(sourceDir, filesToMove[i])
            console.log("Moving", path.join(KrkrExtract, filesToMove[i]), newPath);
            promises.push(fse.move(path.join(KrkrExtract, filesToMove[i]), newPath, {overwrite:true}))
        }

        Promise.all(promises)
        .then(() => {
            fs.rmdir(KrkrExtract, {recursive : true}, () => {
                resolve();
            });
        })
        /*
        .then(async () => {
            console.log("filesToMove", filesToMove);
            for (var i in filesToMove) {
                if (common.isFile(path.join(sourceDir, filesToMove[i]+".xp3")) == false) continue;
                await renamePath(path.join(sourceDir, filesToMove[i]+".xp3"), path.join(sourceDir, filesToMove[i]+".xp3.bak"));
            }

        })
        */
        
    })
}
utils.normalizeStructure = normalizeStructure;


function createProject(sourceDir, options) {
    options = options || {}
    options.engineName = options.engineName || "kag"
    var projectId 		= common.makeid(10);
    //var targetDir 	= path.join(nw.process.env.TMP, projectId);
    var stagePath 		= path.join(common.getStagePath(),projectId);
    var ksFiles 		= [];	
    var kagjs;
    
    return normalizeStructure(sourceDir)
    .then(() => {
        kagjs = new KAGJs(sourceDir, {
            engineName: options.engineName,
            'onParseStart' : function(currentFile) {
                ui.loadingProgress("处理", "处理"+currentFile, {consoleOnly:true, mode:'consoleOutput'});
            },
            'literalTags' : options.literalTags || defaultLiteralTags
        });			
        return kagjs;
    })
    .then(() => {
        fs.mkdirSync(path.join(stagePath, "game"), {recursive:true});
        
        return bCopy(sourceDir, path.join(stagePath, "game"), {
            filter: function(src, dest) {
                if (path.extname(dest).toLowerCase() == '.ks' || path.extname(dest).toLowerCase() == '.tjs') {
                    console.log("复制 ",src, dest);
                    ui.loadingProgress("准备", "复制："+src, {consoleOnly:true, mode:'consoleOutput'});
                    ksFiles.push(dest)
                    return true;
                }
                return false;
            },
            overwrite:true
        })		
    })
    .then(()=>{
        ui.loadingProgress("处理", "转换数据", {consoleOnly:true, mode:'consoleOutput'});
        return kagjs.init();
    })
    .then(()=>{
        
        var transData = kagjs.toTrans();
        transData.project.projectId = projectId;
        transData.project.cache 	= transData.project.cache||{};
        transData.project.cache.cachePath = stagePath;
        transData.project.loc 		= sourceDir;
        transData.project.options 	= transData.project.options || {}
        transData.project.options.literalTags 	= options.literalTags || []
        
        var gameInfo = {
            title : transData.project.gameTitle
        }
        
        fs.writeFileSync(path.join(stagePath, "gameInfo.json"), JSON.stringify(gameInfo, undefined, 2))


        
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
    })
    .catch((message) => {
        if (message) ui.loadingProgress("处理", message, {consoleOnly:true, mode:'consoleOutput'});
        ui.loadingProgress("完成", "全部完成", {consoleOnly:true, mode:'consoleOutput'});
        ui.loadingEnd("完成", "完成");
        ui.showCloseButton();
    })
}
utils.createProject = createProject;


var exportToFolder = async function(sourceDir, targetDir, transData, options) {
    console.log("Exporting to folder", sourceDir, targetDir);
    options = options||{};

    trans.project.options 	= trans.project.options || {};
    options.literalTags 	= options.literalTags || trans.project.options.literalTags || defaultLiteralTags;
    options.writeEncoding 	= thisAddon.config.writeEncoding || options.writeEncoding || trans.project.writeEncoding;
    transData = transData || trans.getSaveData();
    
    //options.groupIndex = options.groupIndex||"relPath";
    
    return new Promise((resolve, reject) => {
        var translationData = trans.getTranslationData(transData, options);
        console.log("translation Data : ", translationData);
        console.log(JSON.stringify(options, undefined, 2));
        var kagjs = new KAGJs(sourceDir, {
            'writeMode' : true,
            'translationData': translationData.translationData,
            'writeEncoding' : thisAddon.config.writeEncoding||options.writeEncoding,
            'literalTags' : options.literalTags,
            'onParseStart' : function(currentFile) {
                ui.loadingProgress("处理", "处理"+currentFile, {consoleOnly:true, mode:'consoleOutput'});
            },
            filterOptions : options.options
        });	
        window.kagjs = kagjs;
        
        kagjs.init()
        .then(()=> {
            console.log("%c kagjs Obj >", 'background: #F00; color: #f1f1f1', kagjs);
            return kagjs.writeToFolder(targetDir)
        })
        .then(()=> {
            resolve();
        })
    })
    
}
//thisAddon.exportToFolder = exportToFolder;
utils.exportToFolder = exportToFolder;

var determineGameFile = function(exePaths) {
    console.log("determine game exe from ", exePaths);
    if (typeof exePaths == 'string') exePaths = [exePaths];
    exePaths = exePaths || [];
    
    var unknown = [];
    
    for (var i=0; i<exePaths.length; i++) {
        if (path.basename(exePaths[i]).toLowerCase() == "game.exe") return exePaths[i];
        if (path.basename(exePaths[i]).toLowerCase() == "config.exe") continue;
        if (path.basename(exePaths[i]).toLowerCase() == "krkrextract.exe") continue;
        if (path.basename(exePaths[i]).toLowerCase().substring(0,6) == "editor") continue;
        unknown.push(exePaths[i]);
    }
    
    if (unknown.length == 1) return unknown[0];
}
utils.determineGameFile = determineGameFile;

var applyTranslation = function(sourceDir, targetDir, transData, options) {
    options 		= options||{};
    transData 		= transData || trans.getSaveData();
    var exeFiles 	= [];
    

    console.log("copy from", sourceDir, "to:", targetDir);
    // copy the material to targetDir
    
    new Promise((resolve, reject) => {
        if (options.copyOptions=="copyNothing") {
            resolve();
            return;
        }

        return bCopy(sourceDir, targetDir, {
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
        }).then(()=>{
            resolve();
        })		
    })
    .then(() => {
        return determineGameFile(exeFiles)
    })
    .then(async (exeFile) => {
        console.log("exe file is :", exeFile);
        ui.loadingProgress("加载", "复制完毕", {consoleOnly:true, mode:'consoleOutput'});

        console.log("patching the file");
        ui.loadingProgress("加载", "修补数据。这可能需要一段时间…", {consoleOnly:true, mode:'consoleOutput'});
        
        await exportToFolder(targetDir, targetDir, transData, options);
        ui.loadingProgress("加载", "完成了！", {consoleOnly:true, mode:'consoleOutput'});
        
        ui.loadingEnd("完成", "所有过程都完成了！", {consoleOnly:false, mode:'consoleOutput', error:false});
        //engines.kag.onApplySuccess ? engines.kag.onApplySuccess(targetDir);

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
utils.applyTranslation = applyTranslation;

var myVar = "insideLib";

var test = function() {
    console.log("Myvar is :", thisAddon);
}




// exporting module
var results = {}
results.KAGFile = KAGFile;
results.TjsFile = TjsFile;
results.KsFile = KsFile;
results.KAGJs = KAGJs;
results.utils = utils;
results.test = test;

return results
}

