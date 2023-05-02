const { threadId } = require('worker_threads');
var win = nw.Window.get();
window.fs 		= require('graceful-fs');
window.afs 		= require('await-fs');
window.nwPath 	= require('path');
window.spawn 	= require('child_process').spawn;
window.fsp 		= require("graceful-fs").promises;

if (window.opener) {
    var trans   = window.opener.trans;
    var ui      = window.opener.ui;
    var sys      = window.opener.sys;
}

/*
const die = function(text) {
    throw(`Process halted by user request --2472KAFSDFJ--:${text}`);
}


class BaseIterator {
    constructor(options) {
        this.options    = this.options || {};
    }
}
BaseIterator.prototype.getObj = function() {
    return trans.getObjectById(this.file);
}
*/


class CodeEditor extends require("www/js/CodeRunner.js") {
	constructor(filePath, options) {
		super(options)
        this.filePath   = filePath || "";
        this.options    = options || {};
        this.isChanged  = false;
	}
}


CodeEditor.prototype.getCurrentHelpTopic = async function() {
    return [
        {value: 'die', score: 1, type:'function()', meta: 'Immediately terminate execution'},
        {value: 'session', score: 1, type:'Object', meta: 'Placeholder that resets every execution. This object will be available across iteration'},
        {value: 'this', score: 1, type:"Object", meta: 'Current iteration object'},
        {value: 'this.file', score: 1, type:"String, readonly", meta: 'Current file ID'},
        {value: 'this.index', score: 1, type:"Number, readonly", meta: 'Current index of iteration'},
        {value: 'this.maxIndex', score: 1, type:"Number, readonly", meta: 'Maximum index of the current session'},
        {value: 'this.isLast', score: 1, type:"Boolean, readonly", meta: 'Current iteration is the last'},
        {value: 'this.rowId', score: 1, type:"Number, readonly", meta: 'Current id of the row'},
        {value: 'this.keyText', score: 1, type:"String, readonly", meta: 'The key text of the current row. Alias of this.cells[trans.keyColumn]'},
        {value: 'this.tags', score: 1, type:"Array, mutable", meta: 'Tags of current row.'},
        {value: 'this.cells', score: 1, type:"Array, mutable", meta: 'List of the cells of the current row.'},
        {value: 'this.parameters', score: 1, type:"Array, mutable", meta: 'List of the parameters of the current row.'},
        {value: 'this.context', score: 1, type:"Array, mutable", meta: 'List of the contexts of the current row.'},
        {value: 'this.comments', score: 1, type:"Array, mutable", meta: 'List of the comments of the current row. Index of the comments represents its cell id.'},
        {value: 'this.text', score: 1, type:"String, readonly", meta: 'Text of the currently visited cell.'},
        {value: 'this.colId', score: 1, type:"Number, readonly", meta: 'Column Id of currently visited cell.'},
        {value: 'this.cellCoords', score: 1, type:"Object, readonly", meta: 'Coordinate information of the currently visited cell.'},
        {value: 'this.setText', score: 1, type:"function(string)", meta: 'Set text of the currently visited cell.'},
    ]
}

CodeEditor.prototype.getAutocompleteTopics = async function() {
    if (this._autoComplete) return this._autoComplete;
    const topics = await this.getCurrentHelpTopic();
    var result = [];
    for (var i=0; i<topics.length; i++) {
        result.push({
            value:topics[i].value,
            score:topics[i].score,
            meta:topics[i].type+". "+topics[i].meta
        })
    }
    var external = await common.fileGetContents("data/helpContext.json");
    if (external) {
        console.log("External is:", JSON.parse(external));
        result = result.concat(JSON.parse(external));
        console.log("The result:", result);
    }
    this._autoComplete = result;
    return result;
}

CodeEditor.prototype.break = function() {
    console.warn("Issuing break on the next iteration");
    this.isBreak = true;
}

CodeEditor.prototype.setTitle = function(str) {
    $("title").text(str);
}

CodeEditor.prototype.setFooter = function(col, text) {
    var $footer = $("#footer");
    if (typeof col == "number") {
        $footer.find(".footer-content").eq(col).find("span").html(text);
    } else {
        $footer.find(col).html(text);
    }
}

CodeEditor.prototype.openFileList = async function() {
    var that = this;
    var $dialog         = $("<div id='fileListDialog'></div>");
    var drawFileList = async () => {
        var $menu       = $(`<ul class="LiveFileSelector"></ul>`)
        var fileList = await fsp.readdir(this.workspaceFolder);
        for (var i in fileList) {
            var $temp = $(`<li><div>${fileList[i]}</div></li>`);
            $temp.data("path", nwPath.join(this.workspaceFolder, fileList[i]));
            $temp.on("click", function() {
                that.openFile($(this).data("path"));
                $dialog.dialog("close");
            });
            $temp.appendTo($menu);
        }
        $dialog.append($menu);
    }

    $dialog.dialog({
        autoOpen: false,
        title: "",
        modal:false,
        closeOnEscape:true,
        classes: {
            "ui-dialog": "highlight",
            "ui-dialog-titlebar": "hidden"
        },			
        width:$(".cellInfoPartsB").outerWidth(),
        height:Math.round($(window).height()/100*50),
        minWidth:320,
        minHeight:160,
        rezisable:false,
        modal:true,
        position: {
            my: "left top",
            at: "left bottom",
            of: ".pathinfoWrapper"
        },
        show: {
            effect: "slide",
            direction: "up",
            duration: 100
        },
        hide: {
            effect: "slide",
            direction: "up",
            duration: 100
        },
        close: function( event, ui ) {

        },
        open: function(ev, ui) {
            console.log("dialog opened");
            $(".ui-widget-overlay.ui-front").one("click", ()=>{
                $dialog.dialog("close");
            });
            drawFileList();
        },
        buttons:[
            {
                text: "OK",
                icon: "ui-icon-close",
                click: function() {
                    $(this).dialog( "close" );
                }
            }
        ]
    });	
    $(window).one("resize", ()=> {
        $dialog.dialog("close");
    });
    $dialog.dialog("option", "width", $(".pathinfoWrapper").width() );
    $dialog.dialog("option", "height", 160 );
    $dialog.dialog("open");
}


CodeEditor.prototype.openThisHelpContext = async function() {
    const that    = this;
    const $dialog = $("<div id='thisHelpContext'></div>");

    const generateHelpTopics = async ()=> {
        if ($dialog.is(".initialized")) return;
        const topic = await this.getCurrentHelpTopic();
        for (var i in topic) {
            if (topic[i].value.includes("this.") == false) continue;
            var $elm = $(`
                <div class="helperChoice" data-value="${topic[i].value}" data-workspace="" title="click to add into the current pointer">
                    <h3>${topic[i].value}</h3>
                    <div class="types">
                        <span class="type">${topic[i].type}</span>
                    </div>
                    <p class="description">${topic[i].meta}</p>
                </div>`);
            $elm.on("click", function() {
                that.addTextToCursor($(this).attr('data-value'));
                $dialog.dialog("close");
            });
            $dialog.append($elm);
        }
        $dialog.addClass("initialized");
    }

    $dialog.dialog({
        autoOpen: false,
        title: "",
        modal:false,
        closeOnEscape:true,
        classes: {
            "ui-dialog": "highlight",
            "ui-dialog-titlebar": "hidden"
        },			
        height:Math.round($(window).height()/100*50),
        minWidth:320,
        minHeight:160,
        rezisable:false,
        modal:true,
        position: {
            my: "left bottom",
            at: "left top",
            of: ".thisHelpContext"
        },

        close: function( event, ui ) {

        },
        open: function(ev, ui) {
            console.log("dialog opened");
            $(".ui-widget-overlay.ui-front").one("click", ()=>{
                $dialog.dialog("close");
            });
            generateHelpTopics();
        },
        buttons:[
            {
                text: "OK",
                icon: "ui-icon-close",
                click: function() {
                    $(this).dialog( "close" );
                }
            }
        ]
    });	
    $(window).one("resize", ()=> {
        $dialog.dialog("close");
    });
    $dialog.dialog("option", "width", $("body").width() - 80);
    $dialog.dialog("option", "height", 160 );
    $dialog.dialog("open");
}



CodeEditor.prototype.addTextToCursor = function(text) {
    if (!this.editor) return;
    this.editor.session.insert(this.editor.getCursorPosition(), text)
}

CodeEditor.prototype.initialize = async function() {
    window.dialogArguments = window.dialogArguments || {};
    var waitTimeout = 0;
    while (!dialogArguments.workspace) {
        await common.wait(100);
        waitTimeout+=100;
        if (waitTimeout >  2000) break;
    }
    this.workspace = dialogArguments.workspace;

    if (this.workspace == "gridSelection") {
        this.setTitle("Custom script-Grid selection")
    } else if (this.workspace == "foundCells") {
        this.setTitle("Custom script-Found cells")
    } else if (this.workspace == "objectIterator") {
        this.setTitle("Custom script-Object iterator")
    } else if (this.workspace == "rowIterator") {
        this.setTitle("Custom script-Rows iterator")
    } else if (this.workspace == "global") {
        this.setTitle("Custom Script - GLobal")
    } else {
        console.error("Unknown workspace", window.dialogArguments);
        alert("Unknown workspace");
    }
    this.workspaceFolder = nwPath.join(__dirname, "data/custom-scripts/", this.workspace);
    this.defaultSavePath = nwPath.join(this.workspaceFolder, "NewCustomScript.js");
    this.setFooter(0, this.workspace);
    await common.mkDir(nwPath.dirname(this.workspaceFolder));

    // initializing editor
	this.editor = ace.edit(document.querySelector("#aceEditor"));
    this.editor.setTheme("ace/theme/monokai");
    this.editor.session.on('changeMode', function(e, session){
        if ("ace/mode/javascript" === session.getMode().$id) {
            console.log("mode changed");
            if (!!session.$worker) {
                console.log("sending to worker?");
                session.$worker.send("setOptions", [{
                    "esversion": 9,
                    "esnext": false,
                    "browser": true,
                    "jquery":true,
                }]);
            }
        }
    });
    this.editor.session.setMode("ace/mode/javascript");
    this.editor.setShowPrintMargin(false);
    this.editor.on("change", ()=>{
        this.isChanged = true;
    })
    this.editor.setOptions({
        fontSize: "12pt",
		enableBasicAutocompletion: true,
        // to make popup appear automatically, without explicit _ctrl+space_
        enableSnippets: true,
        enableLiveAutocompletion: true,
    });

    let langTools = ace.require('ace/ext/language_tools');
    var customCompleter = {
        getCompletions: async (editor, session, pos, prefix, callback) => {
            callback(null, await this.getAutocompleteTopics());
        }
       }
      langTools.addCompleter(customCompleter);


    this.isInitialized = true;
    this.trigger("initialized");

    $("#currentFile").on("click", async ()=> {
        await this.openFileList();
    })
    $(".openFileList").on("click", async ()=> {
        await this.openFileList();
    })


    $(".publish").on("click", function() {

    });

    this.openLastFile();
}

CodeEditor.prototype.setConfig = function(key, value) {
    this.config = this.config || {};
    this.config[key] = value;
    localStorage.setItem("codeEditor/"+this.workspace, JSON.stringify(this.config))
    return true
}

CodeEditor.prototype.getConfig = function(key) {
    if (!this.config) this.config = JSON.parse(localStorage.getItem("codeEditor/"+this.workspace)) || {};
    return this.config[key];
}


CodeEditor.prototype.isQuickLaunch = function(filePath) {
    if (!filePath) return false;
    filePath = filePath || this.filePath
    var sysConfig = sys.getConfig("codeEditor/"+this.workspace);
    if (!sysConfig) {
        sys.setConfig("codeEditor/"+this.workspace, {});
        sysConfig = sys.getConfig("codeEditor/"+this.workspace);
    }
    sysConfig["quickLaunch"] = sysConfig["quickLaunch"] || [];
    if (sysConfig["quickLaunch"].includes(filePath)) return true;
    return false;
}

CodeEditor.prototype.setQuickLaunch = function(filePath) {
    if (!filePath) return console.error("You must specify filepath");
    filePath = filePath || this.filePath
    if (this.isQuickLaunch(filePath)) return true;

    var sysConfig = sys.getConfig("codeEditor/"+this.workspace);
    sysConfig["quickLaunch"] = sysConfig["quickLaunch"] || [];
    sysConfig["quickLaunch"].push(filePath);
    sys.setConfig("codeEditor/"+this.workspace, sysConfig);
    sys.saveConfig();
    return true;
}


CodeEditor.prototype.unsetQuickLaunch = function(filePath) {
    if (!filePath) return console.error("You must specify filepath");
    filePath = filePath || this.filePath
    if (!this.isQuickLaunch(filePath)) return true;

    var sysConfig = sys.getConfig("codeEditor/"+this.workspace);
    sysConfig["quickLaunch"] = sysConfig["quickLaunch"] || [];

    const index = sysConfig["quickLaunch"].indexOf(filePath);
    if (index > -1) {
        sysConfig["quickLaunch"].splice(index, 1); // 2nd parameter means remove one item only
    }

    sys.setConfig("codeEditor/"+this.workspace, sysConfig);
    sys.saveConfig();
    return true;
}

CodeEditor.prototype.toggleQuickLaunch = function() {
    if (!this.filePath) return alert(t("You should save the current project first before creating shortcut to Translator++"))
    var $quickLaunchBtn = $(".button-publish");
    if ($quickLaunchBtn.hasClass("checked") == false) {
        $quickLaunchBtn.addClass("checked");
        this.setQuickLaunch(this.filePath);
    } else {
        $quickLaunchBtn.removeClass("checked");
        this.unsetQuickLaunch(this.filePath);
    }
}

CodeEditor.prototype.evalQuickLaunch = function(filePath) {
    filePath = filePath || this.filePath
    $(".button-publish").removeClass("checked")
    if (this.isQuickLaunch(filePath)) $(".button-publish").addClass("checked")
}

CodeEditor.prototype.setFilePath = function(newPath) {
    if (this.filePath == newPath) return false;
    this.filePath = newPath;
    // changing the display
    if (!newPath) {
        $("#currentFile").val("")
    } else {
        $("#currentFile").val(nwPath.basename(this.filePath));
    }
    this.setConfig("lastOpenedFile", this.filePath);
    this.evalQuickLaunch(this.filePath)
    this.trigger("filePathChanged")
    return true;
}

CodeEditor.prototype.setPathUI = async function(defaultPath, onInput) {
    var defaultFilename = nwPath.basename(defaultPath || this.defaultSavePath);
    var defaultFolder   = nwPath.dirname(defaultPath || this.defaultSavePath);
    
    await common.mkDir(defaultFolder);

    if (this.filePath) {
        defaultFilename = nwPath.basename(this.filePath);
        defaultFolder   = nwPath.dirname(this.filePath);
    }

    onInput = onInput || function(){};

    var that = this;
    return new Promise((resolve, reject) => {
        var hasInput = false;
        var $elm = $("<input type='file' style='display:none' class='hidden __pseudoFileDlg1' />");
        $elm.attr("nwsaveas", defaultFilename);
        $elm.attr("nwworkingdir", defaultFolder);
        $elm.attr("accept", ".js,text/javascript");
        $elm.on("click", function() {
            $(this).val("");
        });
        $elm.on("input", async function() {
            hasInput = true;
            console.log("some input file");
            var thisVal = $(this).val();
            if (thisVal) {
                console.log("received some change");
                that.setFilePath(thisVal);
                await onInput.call(this, thisVal);
                resolve(thisVal);
            } else {
                console.log("Input canceled");
                resolve("");
            }
            $(this).remove();
        });
        // when canceled
        $(window).one("focus.fileSelector", function() {
            setTimeout(()=> {
                if (hasInput) return;
                resolve("");
                $(this).remove();
            }, 500);
        })
        $elm.trigger("click");
    })

}



CodeEditor.prototype.openFileDialog = async function(defaultPath, onInput) {
    var defaultFilename = nwPath.basename(defaultPath || this.defaultSavePath);
    var defaultFolder   = nwPath.dirname(defaultPath || this.defaultSavePath);
    
    await common.mkDir(defaultFolder);

    if (this.filePath) {
        defaultFilename = nwPath.basename(this.filePath);
        defaultFolder   = nwPath.dirname(this.filePath);
    }

    onInput = onInput || function(){};

    return new Promise((resolve, reject) => {
        var hasInput = false;
        var $elm = $("<input type='file' style='display:none' class='hidden __pseudoFileDlg1' />");
        $elm.attr("nwworkingdir", defaultFolder);
        $elm.attr("accept", ".js,text/javascript");
        $elm.on("click", function() {
            $(this).val("");
        });
        $elm.on("input", async function() {
            hasInput = true;
            console.log("some input file");
            var thisVal = $(this).val();
            if (thisVal) {
                console.log("received some change");
                await onInput.call(this, thisVal);
                resolve(thisVal);
            } else {
                console.log("Input canceled");
                resolve("");
            }
            $(this).remove();
        });
        $elm.on("blur", async function() {
            console.log("blurred");
        });

        // when canceled
        $elm.on("click", ()=> {
            $(window).one("blur.fileSelector", ()=>{
                $(window).one("focus.fileSelector", () =>{
                    setTimeout(()=> {
                        if (hasInput) return;
                        resolve("");
                        $(this).remove();
                    }, 500);
                });
            });
        })
        
        $elm.trigger("click");
    })

}

CodeEditor.prototype.close = function(force) {
    if (!force) {
        if (this.isChanged) {
            var conf = confirm("Do you wish to close the current script? Any unsaved data will be discarded.");
            if (!conf) return;
        }
    }

    this.setFilePath("");
    this.isChanged = false;
    this.editor.setValue("");
    this.trigger("onClose");
}

CodeEditor.prototype.new = function(force) {
    if (!force) {
        if (this.isChanged) {
            var conf = confirm("Do you wish to clear the current code and start a new one?");
            if (!conf) return;
        }
    }

    this.close(true);
    this.trigger("onNew");
}

CodeEditor.prototype.openFile = async function(file, force) {
    if (!file) return this.open(force);
    if (!await common.isFileAsync(file)) return;
    if (!force) {
        if (this.isChanged) {
            var conf = confirm("Do you wish to open another file?\nThe current code will be discarded, and any unsaved works may be lost.");
            if (!conf) return;
        }
    }

    loadingScreen.show();
    this.close(true);
    this.editor.setValue(await common.fileGetContents(file));
    loadingScreen.hide();
    this.setFilePath(file);
}

CodeEditor.prototype.open = async function(force) {
    if (!force) {
        if (this.isChanged) {
            var conf = confirm("Do you wish to open another file?\nThe current code will be discarded, and any unsaved works may be lost.");
            if (!conf) return;
        }
    }

    var newFile = await this.openFileDialog();
    console.log("Trying to open:", newFile);
    if (!newFile) return;

    this.close(true);
    this.editor.setValue(await common.fileGetContents(newFile));
    this.setFilePath(newFile);
}

CodeEditor.prototype.save = async function() {
    if (!this.filePath) return this.saveAs();
    $(".button-save img").addClass("rotating");
    await common.filePutContents(this.filePath, this.editor.getValue(), "utf8", false);
    setTimeout(()=> {
        $(".button-save img").removeClass("rotating");
    }, 800);
    this.isChanged = false;
    this.trigger("onSave");
    console.log("save completed");
    return this.filePath;
}

CodeEditor.prototype.saveAs = async function() {
    var filePath = await this.setPathUI();
    if (!filePath) return console.log("empty path", filePath);
    console.log("Saving to : ", filePath);
    $(".button-save img").addClass("rotating");
    await common.filePutContents(filePath, this.editor.getValue());
    setTimeout(()=> {
        $(".button-save img").removeClass("rotating");
    }, 800);
    this.setFilePath(filePath);
    this.isChanged = false;
    this.trigger("onSave");
    return filePath;
}

CodeEditor.prototype.help = function() {
    nw.Shell.openExternal("https://dreamsavior.net/docs/translator/execute-script/custom-script/");
}



// ==================================================================
// CUSTOM USER CODE
// ==================================================================
/*
CodeEditor.prototype.finalize = async function(origin, options) {
    trans.grid.render();
    this.isBreak = false;

    return true;
}

CodeEditor.prototype.executeGlobal = async function(fn, options) {
	fn = fn || async function() {};
	options= options || {};

    await fn.call(this);
    codeEditor.finalize("global", options)
	
	return true;
}

CodeEditor.prototype.executeObjectIterator = async function(fn, options) {
	fn = fn || async function() {};
	options= options || {};

	var iteratorObj = new BaseIterator();

	var selectedFiles = trans.getCheckedFiles();
	if (selectedFiles.length < 1) selectedFiles = trans.getAllFiles();

	var iteratorMain = async function() {
        this.index      = -1;
        this.maxIndex   = selectedFiles.length - 1;
        this.isLast     = false;
        if (this.maxIndex < 0) this.maxIndex = 0;

		for (var fileId in selectedFiles) {
            this.index++;
			this.file = selectedFiles[fileId];
			if (!trans.project.files[this.file]) continue;
			if (empty(trans.project.files[this.file].data)) continue;

            if (this.index>=this.maxIndex) this.isLast = true;

            await fn.call(this);
            if (codeEditor.isBreak) return codeEditor.finalize("object", options);
		}
        codeEditor.finalize("object", options)
	}
	
	await iteratorMain.apply(iteratorObj);
	return true;
}


CodeEditor.prototype.executeRowIterator = async function(fn, options) {
	fn = fn || async function() {};
	options= options || {};

    class IteratorRow extends BaseIterator {
        constructor( options) {
            super(options)
        }
    }
	var iteratorObj = new IteratorRow();

	var selectedFiles = trans.getCheckedFiles();
	if (selectedFiles.length < 1) selectedFiles = trans.getAllFiles();



	var iteratorMain = async function() {
        // count the rows
        this.index      = -1;
        this.maxIndex   = 0;
        this.isLast     = false;
        for (var fileId in selectedFiles) {
            //console.log("length of", fileId, trans.getData(selectedFiles[fileId]).length);
            this.maxIndex += trans.getData(selectedFiles[fileId]).length;
        }
        if (this.maxIndex > 0) this.maxIndex = this.maxIndex-1; // because we start from 0;

		for (var fileId in selectedFiles) {
			this.file = selectedFiles[fileId];
			if (!trans.project.files[this.file]) continue;
			if (empty(trans.project.files[this.file].data)) continue;
			
			for (var rowId=0; rowId<trans.project.files[this.file].data.length; rowId++) {
                this.index++;
                //if (!trans.project.files[this.file].data[rowId][trans.keyColumn]) continue;
				this.rowId 		= rowId;
				this.keyText 	= trans.project.files[this.file].data[rowId][trans.keyColumn];
				this.cells 		= trans.project.files[this.file].data[rowId];
				this.tags 		= trans.project.files[this.file].tags[rowId];
				this.parameters	= trans.project.files[this.file].parameters[rowId];
				this.context	= trans.project.files[this.file].context[rowId];
				this.comments   = trans.project.files[this.file].comments || undefined;
				
                if (this.index>=this.maxIndex) this.isLast = true;
                await fn.call(this);
                if (codeEditor.isBreak) return codeEditor.finalize("row", options);
			}
		}
        codeEditor.finalize("row", options)
	}
	
	await iteratorMain.apply(iteratorObj);
	return true;
}


CodeEditor.prototype.executeSelectedCells = async function(fn, options) {
	fn = fn || async function() {};
	options= options || {};

    class IteratorSelectedCells extends BaseIterator {
        constructor(options) {
            super(options)
        }
    }
    IteratorSelectedCells.prototype.setText = function(text) {
        if (this.colId == 0) return;
        try {
            trans.project.files[this.file].data[this.rowId][this.colId] = text;
        } catch (e) {
            console.warn(`Error when trying to set the text on cell: ${this.file} ${this.rowId},${this.colId}\n`, e);
        }
    }

	var iteratorObj = new IteratorSelectedCells();

	var cellRanges = trans.grid.getSelectedRange();
	if (empty(cellRanges)) return;

	var iteratorMain = async function() {
        this.index      = -1;
        this.maxIndex   = 0;
        this.isLast     = false;
        for (var rangeId in cellRanges) {
            this.maxIndex += cellRanges[rangeId].getAll().length;
        }
        if (this.maxIndex > 0) this.maxIndex = this.maxIndex-1; // because we start from 0;

        this.file       = trans.getSelectedId();
        if (!trans.project.files[this.file]) return;
        if (empty(trans.project.files[this.file].data)) return;

        var processed = {};

		for (var rangeId in cellRanges) {
            var thisCoords = cellRanges[rangeId].getAll();
            for (var i=0; i<thisCoords.length; i++) {
                this.index++;
                var rowId = thisCoords[i].row;
                var colId = thisCoords[i].col;
                if (processed[rowId+","+colId]) continue; // already processed
                processed[rowId+","+colId] = true;

                this.rowId 		= rowId;
				this.keyText 	= trans.project.files[this.file].data[rowId][trans.keyColumn];
				this.cells 		= trans.project.files[this.file].data[rowId];
				this.tags 		= trans.project.files[this.file].tags[rowId];
				this.parameters	= trans.project.files[this.file].parameters[rowId];
				this.context	= trans.project.files[this.file].context[rowId];
				this.comments   = trans.project.files[this.file].comments || undefined;
                
                this.colId      = colId;
                this.text       = trans.project.files[this.file].data[rowId][colId];
                this.cellCoords = thisCoords[i];

                if (this.index>=this.maxIndex) this.isLast = true;
                await fn.call(this);
                if (codeEditor.isBreak) return codeEditor.finalize("cell", options);
            }
		}
        codeEditor.finalize("cell", options)
	}
	
	await iteratorMain.apply(iteratorObj);
	return true;
}

CodeEditor.prototype.executeFoundCells = async function(fn, options) {
	fn = fn || async function() {};
	options= options || {};

    class IteratorFoundCells extends BaseIterator {
        constructor( options) {
            super(options)
        }
    }
    IteratorFoundCells.prototype.setText = function(text) {
        if (this.colId == 0) return;
        try {
            trans.project.files[this.file].data[this.rowId][this.colId] = text;
        } catch (e) {
            console.warn(`Error when trying to set the text on cell: ${this.file} ${this.rowId},${this.colId}\n`, e);
        }
    }

	var iteratorObj = new IteratorFoundCells();

	if (empty(window.dialogArguments.foundCells)) return;

	var iteratorMain = async function() {
        console.log("Found cell:", window.dialogArguments.foundCells);
        this.index      = -1;
        this.maxIndex   = window.dialogArguments.foundCells.length - 1;
        this.isLast     = false;
        if (this.maxIndex < 0) this.maxIndex = 0;
        var processed = {};

		for (var idx in window.dialogArguments.foundCells) {
            this.index++;
            var thisCoords = window.dialogArguments.foundCells[idx];
            var rowId = thisCoords.row;
            var colId = thisCoords.col;
            if (processed[rowId+","+colId]) continue;
            processed[rowId+","+colId] = true;

            this.file 		= thisCoords.file;
            this.rowId 		= rowId;
            this.keyText 	= trans.project.files[this.file].data[rowId][trans.keyColumn];
            this.cells 		= trans.project.files[this.file].data[rowId];
            this.tags 		= trans.project.files[this.file].tags[rowId];
            this.parameters	= trans.project.files[this.file].parameters[rowId];
            this.context	= trans.project.files[this.file].context[rowId];
            this.comments   = trans.project.files[this.file].comments || undefined;
            
            this.colId      = colId;
            this.text       = trans.project.files[this.file].data[rowId][colId];
            this.cellCoords = {
                row:rowId,
                col:colId
            };

            if (this.index>=this.maxIndex) this.isLast = true;
            
            await fn.call(this);
            if (codeEditor.isBreak) return codeEditor.finalize("find", options);
            
        }
        codeEditor.finalize("find", options)
	}
	
	await iteratorMain.apply(iteratorObj);
	return true;
}
*/


CodeEditor.prototype.execute = async function() {
	try {
        let AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
        var fn = new AsyncFunction(this.editor.getValue());
		//var fn = new Function(this.editor.getValue());
	} catch (e) {
		return alert("Unable to process your script because there is error on the code.");
	}
	
	loadingScreen.show();
    loadingScreen.addButton({
        label:"Stop Process",
        onClick: ($btn) => {
            if ($btn.prop("disabled")) return;
            $btn.prop("disabled", true);
            $btn.text("Stopping process");
            this.break();
        }
    });
	await common.wait(20);

	var conf = confirm("Do you want to save your project before execute the script?");
	if (conf) {
		await trans.save();
	}

    try {
        window.session = {};
        console.log("workspace is:", this.workspace);
        console.log("%c↓↓The outputs from your script are below↓↓", "color:blue;font-size:1.5em;");
        console.log("==========================================");
        if (this.workspace == "gridSelection") {
            await this.executeSelectedCells(fn);
        } else if (this.workspace == "foundCells") {
            await this.executeFoundCells(fn);
        } else if (this.workspace == "objectIterator") {
            await this.executeObjectIterator(fn);
        } else if (this.workspace == "rowIterator") {
            await this.executeRowIterator(fn);
        } else if (this.workspace == "global") {
            await this.executeGlobal(fn);
        } else {
            alert("Unknown workspace");
        }
    } catch (e) {
        if (e.toString().includes('--2472KAFSDFJ--') == true) {
            var msg = e.toString().split(":");
            alert(`Process halted by user request:\n${msg[1]}`);
        } else {
            console.error(e);
            alert("Error occured, please view console log for more information (F12)");
        }
        loadingScreen.hide();
        return;
    }
    console.log("%cExecution completed", "color:blue;font-size:1.5em;");
	alert("Execution completed!");
	loadingScreen.hide();
}

CodeEditor.prototype.openLastFile = async function() {
    var lastFile = this.getConfig("lastOpenedFile");
    console.log("openLastFile", lastFile);

    if (!lastFile) return;

    return this.openFile(lastFile, true);
}

$(document).ready(function() {
    window.loadingScreen    = new LoadingScreen();
    window.codeEditor       = new CodeEditor();
	codeEditor.initialize();

	$(".button-execute").on("click", function() {
		codeEditor.execute();
	});

    $(".button-debugger").on("click", function() {
        win.showDevTools();
    });

	$(".button-help").on("click", function() {
        codeEditor.help();
	});

    $(".button-new").on("click", function() {
        codeEditor.new();
	});

    $(".button-open").on("click", function() {
        codeEditor.open();
	});

    $(".button-save").on("click", function() {
        codeEditor.save();
	});

    $(".button-save-as").on("click", function() {
        codeEditor.saveAs();
	});

    $(".thisHelpContext").on("click", function() {
        codeEditor.openThisHelpContext();
    })

    $(".button-publish").on("click", function() {
        codeEditor.toggleQuickLaunch();
    })

    if (nw.process.versions["nw-flavor"] == "sdk") {
        $(".button-debugger").removeClass("hidden");
    }


    $(document).on('keydown', function(e) {
		var keyCode = e.keyCode || e.which;

		switch (keyCode) {

			case 112 : //F1, about
				e.preventDefault();
				codeEditor.help();
			break;		
			case 27 : //esc, close active windows
				//e.preventDefault();
				//ui.introWindowClose();
			break;
            case 121 : //F10
                codeEditor.execute();
            break;
			case 122 : //F11, Full screen
				var win = win || nw.Window.get();
				win.maximize();
			break;		
		}

		// EDITING COMMAND
		if (e.ctrlKey) {
			switch(keyCode) {
				case 78 : //n
					e.preventDefault();
					console.log("Pressing CTRL+n");
					codeEditor.new();
				break;
				case 79 : //o
					e.preventDefault();
					console.log("Pressing CTRL+o");
					codeEditor.open();
				break;
				case 83 : //s
					e.preventDefault();
                    if (e.shiftKey) {
                        codeEditor.saveAs();
                    } else {
                        console.log("Pressing CTRL+s");
                        codeEditor.save();
                    }
				break;
				case 70 : //f
					e.preventDefault();
					(async () => {
						await common.wait(200);
						console.log("Pressing CTRL+f");
					})();

				break;
				case 72 : //h
					e.preventDefault();
					console.log("Pressing CTRL+h");
				break;

			}
		} else if (e.altKey) {
			switch(keyCode) {
				case 46 : //alt delete (remove context translation)
					//e.preventDefault();
					//$(document).trigger("clearContextTranslationByRow", {file:trans.getSelectedId(), row:trans.grid.getSelectedRange(), type:"range"});
				break;
			}			
		} else if (e.shiftKey) {
			switch(keyCode) {
				case 46 : //shift delete (remove selected row)
				break;
			}
			
		}
	});	


    win.on('close', async function() {
        this.hide();
        if (nw.process.versions["nw-flavor"] == "sdk") {
            win.closeDevTools();
            await common.wait(200);
        }
        this.close(true);
    })

});