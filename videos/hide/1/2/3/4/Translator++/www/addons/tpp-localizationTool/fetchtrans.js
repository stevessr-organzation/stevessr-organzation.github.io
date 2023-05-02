var thisAddon = this;

var FetchTransJS = function(file) {
    this.file = file;
    this.data = [];
    this.context = [];
    this.index = {};
    this.translatorFunction = "t";
    this.filterState = {
        matchName : false,
        startCapture : false,
        bracketLevel : 0
    };
}

FetchTransJS.prototype.filterText = function(text) {
	// filter text for trans
	var result = text;
	try {
		result = eval(text);
	} catch (e) {
		console.warn("尝试从字符串求值时出错：", text);
	}
	return result;
}

FetchTransJS.prototype.registerString = function(str, context) {
    str = this.filterText(str);
    if (typeof this.index[str] !== 'undefined') {
        this.context[this.index[str]] = this.context[this.index[str]] || [];
        this.context[this.index[str]].push(context.join("/"));        
        return;
    }
    this.data.push([str]);

    var thisIndex = this.data.length - 1
    this.index[str] = thisIndex;
    this.context[thisIndex] = this.context[thisIndex] || [];
    this.context[thisIndex].push(context.join("/"));
}

FetchTransJS.prototype.isFiltered = function(token, index) {
    //console.log("current token is", token);
    //console.log("start capture state : ", this.filterState.startCapture);
    if (token.type == "WhiteSpace" || token.type == "SingleLineComment" || token.type == "MultiLineComment") return;
    if (token.type == "IdentifierName" && token.value == this.translatorFunction) {
        this.filterState.matchName = true;
        return;
    }
    if (this.filterState.matchName && token.type == "Punctuator" && token.value == "(") {
        // start of function
        this.filterState.matchName = false;
        this.filterState.startCapture = true;
        return;
    }
    if (this.filterState.matchName && token.type == "Punctuator" && token.value !== "(") {
        // cancel state matchName
        this.filterState.matchName = false;
        this.filterState.startCapture = false;
        return;
    }   
    // inside translator function
    if (this.filterState.startCapture && token.type == "Punctuator" && token.value == "(") {
        this.filterState.bracketLevel++;
        return;
    }
    if (this.filterState.startCapture && token.type == "Punctuator" && token.value == ")") {
        this.filterState.bracketLevel--;
        if (this.filterState.bracketLevel <= 0) this.filterState.startCapture = false;
        return;
    }

    if (this.filterState.startCapture) return true;
}

FetchTransJS.prototype.parse = async function() {
    /*
    var that = this;
    this.content = this.content || await common.fileGetContents(this.file);
    this.content.replace(/t\s*\(\s*['"`](.*)['"`]\s*\)/g, function() {
        that.registerString(arguments[1]);
    });
    */
    this.script = this.script || await common.fileGetContents(this.file);   
    thisAddon.jsToken = thisAddon.jsToken||require("js-tokens");
	this.tokens = Array.from(thisAddon.jsToken(this.script), (token) => token);
	var start = 0;
    var literalTypes = ["StringLiteral", "TemplateHead", "TemplateMiddle", "TemplateTail", "NoSubstitutionTemplate"]   
	for (var i=0; i < this.tokens.length; i++) {
		var end = start+this.tokens[i].value.length
		this.tokens[i].start 	= start;
		this.tokens[i].end 		= end;

        if (this.isFiltered(this.tokens[i], i) && literalTypes.includes(this.tokens[i].type)) {
			this.registerString(this.tokens[i].value, ["tid", i,"type", this.tokens[i].type]);
		} else {
			//this.register(this.tokens[i].value);
		}

		start = end;
	}
	return this;  
}



var FetchTransHTML = function(file) {
    this.file = file;
    this.data = [];
    this.context = [];
    this.index = {};
    this.translatorFunction = "t";
    this.filterState = {
        matchName : false,
        startCapture : false,
        bracketLevel : 0
    };
}

FetchTransHTML.prototype.filterText = function(text) {
	// filter text for trans
	return text;
}

FetchTransHTML.prototype.registerString = function(str, context) {
    str = this.filterText(str);
    if (typeof this.index[str] !== 'undefined') {
        this.context[this.index[str]] = this.context[this.index[str]] || [];
        this.context[this.index[str]].push(context.join("/"));        
        return;
    }
    this.data.push([str]);

    var thisIndex = this.data.length - 1
    this.index[str] = thisIndex;
    this.context[thisIndex] = this.context[thisIndex] || [];
    this.context[thisIndex].push(context.join("/"));
}


FetchTransHTML.prototype.parse = async function() {
    var that = this;
    this.script = this.script || await common.fileGetContents(this.file);   

    this.$elms = $(this.script);
    this.$elms.find("[data-tran]").each(function(index) {
        that.registerString($(this).html(), ["idx", index, "innerText"]);
    });

    this.$elms.find("[data-tranattr]").each(function(index) {
        var attrs = $(this).attr("data-tranattr").split(" ");
        for (var i=0; i<attrs.length; i++) {
            if (Boolean(attrs[i]) == false) continue;
            that.registerString( $(this).attr(attrs[i]), ["idx", index, "attr", attrs[i]]);
        }
    });
	return this;  
}



var FetchTrans = function(dir) {
    this.dir = dir || nwPath.join(__dirname, "www");
    this.files = [];
}

FetchTrans.excludePath = [
    "\\www\\php\\",
    "\\www\\modules\\",
    "\\node_modules\\"
]

FetchTrans.isBlaclisted = function(path) {
    for (var i in this.excludePath) {
        if (path.includes(this.excludePath[i])) return true;
    }
    return false
}

FetchTrans.prototype.getRelativePath = function(stringPath) {
	stringPath = nwPath.normalize(stringPath);
	
	stringPath = stringPath.substring(this.dir.length, stringPath.length);

    return stringPath.replace(/\\/g, "/");
}

FetchTrans.prototype.download = async function() {
    if (typeof this.transData == 'undefined') await this.toTrans();

    var data = JSON.stringify(this.transData);
    var type = "text/json";
    var filename = "uiTranslatable.trans";

    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

FetchTrans.prototype.toTrans = async function() {
    if (!this.isParsed) await this.parse();

    this.transData = {
        project:{
            indexOriginal: 0,
            gameEngine: "APPUI",
            files: {}
        }
    }
    for (var i in this.files) {
        var thisFile = this.files[i];
        var thisRelPath = this.getRelativePath(thisFile.file);
        this.transData.project.files[thisRelPath] = {
            data        :thisFile.data,
            context     :thisFile.context,
            basename    :nwPath.basename(thisRelPath),
            dirname     :nwPath.dirname(thisRelPath),
            extension   :nwPath.extname(thisRelPath),
            filename    :nwPath.basename(thisRelPath),
            path        :thisRelPath,
            indexIsBuilt:false,
            indexIds    :thisFile.index,
            tags        :[]
        };
    }
}

FetchTrans.prototype.parse = async function() {
    console.log("fetching directory content");
    var dirContent = await common.readDir(this.dir);
    console.log("parsing data");
    for (var i in dirContent) {
        var thisPath = dirContent[i];
        if (FetchTrans.isBlaclisted(thisPath)) continue;
        if (nwPath.extname(thisPath).toLowerCase() == ".js") {
            var thisFile = new FetchTransJS(thisPath);
            await thisFile.parse();
            if (thisFile.data.length == 0) continue;
            this.files.push(thisFile);
        } else if (nwPath.extname(thisPath).toLowerCase() == ".html") {
            var thisFile = new FetchTransHTML(thisPath);
            await thisFile.parse();
            if (thisFile.data.length == 0) continue;
            this.files.push(thisFile);
        }
    }
    this.isParsed = true;
    return this;
}


window.FetchTransJS = FetchTransJS;
window.FetchTransHTML = FetchTransHTML;
window.FetchTrans = FetchTrans;

$(document).ready(function() {
	ui.onReady(function() {
        ui.mainMenu.addChild("tools", {
            id: "localizationtool",
            label: "本地化工具"
        });

		var $generateTransMenu = ui.mainMenu.addChild("localizationtool", {
            label:"Generate UI Translation Template"
        });

        $generateTransMenu.on("select", function() {
            alert(t("生成过程发生在后台。所有处理完成后，将出现一个弹出窗口。"));
            var fetchTrans = new window.FetchTrans();
            fetchTrans.download();
        })
	});
});