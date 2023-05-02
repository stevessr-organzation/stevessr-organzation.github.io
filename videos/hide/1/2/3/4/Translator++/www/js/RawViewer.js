var encoding 	= require('encoding-japanese');
var iconv 		= require('iconv-lite');

const RawViewer = function(options) {
    this.options = options || {};
    this.container = this.options.container || $("#previewRawData");
    this.feather = 2;
    this.init();
}

RawViewer.prototype.loadPrism = function() {
    if (this.prismIsLoaded) return;
    $("head").append(`<link href="modules/prismjs/prism.css" rel="stylesheet" />`);  
    $("head").append(`<script src="modules/prismjs/prism.js"></script>`);  
  
    this.prismIsLoaded = true;
}

RawViewer.prototype.setListener = function() {
    var that = this;
    $(document).on("objectSelected", () => {
        this.clear();
    });
    $(document).on('cellInfoTabChange.RawViewer', function(e, target) {
        console.log("tabChange", arguments);
        if (target !== "previewRawData") that.clear();
    })

    $(document).off("onAfterSelectCell.RawViewer");
    $(document).on("onAfterSelectCell.RawViewer", function(e, selectionInfo) {
        if (ui.cellInfoTab.getActiveTab() !== "previewRawData") return;
        console.log("onAfterSelectedCell", arguments);
        that.selectionInfo = selectionInfo;
        engines.handler('onLoadSnippet').call(that, selectionInfo);
    }) 
}

RawViewer.prototype.addTextPreview = async function(textObj, options) {
    if (typeof textObj == "string") {
        // text object that marked with boundary
        textObj = {
            textMarked:textObj,
            boundary:""
        }
    }

    console.log("generating preview with textObj:", textObj);

    options             = options || {};
    options.lineStart   = options.lineStart || 1;
    options.language    = options.language || "html";
    var $template = $(`<pre class="snippetData line-numbers language-${options.language}" data-start="${options.lineStart}"><code class="language-${options.language}"></code></pre>`);
    var keyString = this.getKeyString();
    $template.find("code").text(textObj.textMarked);
    this.container.append($template);
    console.log("keyString", keyString);

    var highlighted = $template.find("code").html();
    if (textObj.boundary) {
        console.log("replacing boundary", textObj);
        highlighted = highlighted.replace(textObj.boundary, '<span class="highlight">');
        highlighted = highlighted.replace(textObj.boundary, '</span>');
    }
    
    $template.find("code").html(highlighted);
    await Prism.highlightAllUnder($template[0]);

    if (options.data) {
        for (var i in options.data)
        $template.data(i, options.data[i]);
    }
    return $template
}

RawViewer.prototype.getStartingLineFromOffset = function(text, offsetStart) {
    var before = text.substring(0, offsetStart).split('\n');
    var margin = this.feather+1
    if (before.length > margin) return before.length-margin;
    return 1;
}

RawViewer.prototype.getSnippetFromOffset = function(text, offsetStart, offsetEnd) {
    offsetEnd = offsetEnd || offsetStart;
    var result = [];
    var resultMarked = [];
    var boundary= `----boundary:${(Math.random()+"").substring(2,10)}-----`;
    var before = text.substring(0, offsetStart).split('\n');
    var lineNum = before.length;
    var current = text.substring(offsetStart, offsetEnd);
    var after = text.substring(offsetEnd).split("\n");
    var leftSide = before.pop()
    var rightSide = after.shift()
    var columnStart =  leftSide.length;
    var currentLine = leftSide+current+rightSide;
    var currentLineMarked = leftSide+boundary+current+boundary+rightSide;

    var starting = before.length-(1+this.feather);
    if (starting < 0) starting = 0;
    for (var i=starting; i<before.length; i++) {
        if (i<0) break;
        result.push(before[i]);
        resultMarked.push(before[i]);
    }
    result.push(currentLine);
    //resultMarked.push(boundary+currentLine+boundary);
    resultMarked.push(currentLineMarked);
    for (var i=0; i<this.feather; i++) {
        if (i>after.length) break;
        result.push(after[i]);
        resultMarked.push(after[i]);
    }

    return {
        text:result.join("\n"),
        textMarked:resultMarked.join("\n"),
        col:columnStart,
        boundary:boundary,
        line:lineNum
    };

}

RawViewer.prototype.isClear = function() {
    if (this.container.find("*").length > 0) return false;
    return true;
}

RawViewer.prototype.clear = function() {
    this.container.empty();
}

RawViewer.prototype.getKeyString = function() {
    try {
       return trans.getSelectedObject().data[this.selectionInfo.fromRow][trans.keyColumn]
    } catch (e) {

    }
}

RawViewer.prototype.append = function(html) {
    this.container.append($(html));
    return this.container;
}

RawViewer.prototype.openFile = async function(path) {
	return new Promise((resolve, reject) => {
		fs.readFile(path, (err, data) => {
			if (err) return reject();
		
			var thisEncoding = encoding.detect(data);
			// if encoding is not detected, read with default writeEncoding
			if (!thisEncoding) {
                console.log("Unable to detect encoding via encoding.detect()");
                thisEncoding = this.fileEncoding || "utf8";
            }
			console.log("detected encoding", thisEncoding);
			try {
				var string = iconv.decode(data, thisEncoding);
			} catch (e) {
				console.warn("无法解码字符串请尝试'Shift_JIS'", e);
				var string = iconv.decode(data, 'Shift_JIS');
			}

            resolve(string);
        })
    }) 
 
}

RawViewer.prototype.addTextPreviewFromFileOffset = async function(file, offsetStart, offsetEnd, options) {
    options = options || {};
    if (this.cachedFileContentName !== file) {
        //var fileContent = await common.fileGetContents(file);
        var fileContent = await this.openFile(file);
        this.cachedFileContent = fileContent;
        this.cachedFileContentName = file;        
    } else {
        var fileContent = this.cachedFileContent;
    }

    var snippetData = this.getSnippetFromOffset(fileContent, offsetStart, offsetEnd);
    if (!options.language) {
        var ext = nwPath.extname(file);
        options.language = ext.substring(1);
    }
    options.lineStart = this.getStartingLineFromOffset(fileContent, offsetStart);

    options.data = {
        path:file,
    };
    var snippet = await this.addTextPreview(snippetData, options);

    var wrapper = $(`<div class="snippetWrapper"><div class="snippetInfo flex"><span class="snippetPath">${file}</span><span class="lineNumber">行：${snippetData.line}</span></div></div>`)
    wrapper.append(snippet);
    this.container.append(wrapper);
    return wrapper;

}
/**
 * @param  {Object} selectedCell - Selected cell object passed from event onLoadSnippet
 * @param  {String} language - language of the snippet, determines syntax highlight
 * @param  {Object[]} offsetList - Array of object (because one row can have more than one occurance of string)
 * @param  {integer} offsetList[].start - Offset start of the string
 * @param  {integer} offsetList[].end - Offset end of the string
 */
RawViewer.prototype.commonHandleFile = async function(selectedCell, language, offsetList) {
    console.log("commonHandleFile");
    console.log("selected cell:", selectedCell);
    var obj = trans.getSelectedObject();

    if (!Array.isArray(obj.context[selectedCell.fromRow])) return;
    if (obj.context[selectedCell.fromRow].length == 0) return;

    console.log("determining active path");
    var activePath = nwPath.join(trans.project.loc, obj.path);
    if (await common.isFileAsync(activePath) == false)  activePath = nwPath.join(trans.project.cache.cachePath, "data", obj.path);

    if (await common.isFileAsync(activePath) == false) {
        this.clear();
        console.log("no active path");

        $warningMsg = $(`<div class="blockBox warningBlock withIcon">${t(`找不到与数据相关的文件`)}<br />
        ${t(`为了修正这个问题，<b>源资源位置</b>字段在<a href="#" class="openProjectProperties">项目属性</a>`)}</div>`)
        $warningMsg.find(".openProjectProperties").on("click", function() {
            ui.openProjectProperties();
        });
        this.append($warningMsg)
        return;
    }
    console.log("active path is:", activePath);

    this.clear();

    offsetList = offsetList || obj.parameters[selectedCell.fromRow]
    for (var i in offsetList) {
        var thisParam = offsetList[i]
        if (!thisParam.start) continue;
        var previewOptions = {
            language:language
        }
        var elm = await this.addTextPreviewFromFileOffset(activePath, thisParam.start, thisParam.end, previewOptions);
        this.addContextMenu(elm);
        elm.data("path", activePath)
    }
}

RawViewer.prototype.addContextMenu = function(elm) {
	var that = this;
    elm = elm  || this.elm
    
    var menu;
	menu = new nw.Menu();
	// Add some items with label
	menu.append(new nw.MenuItem({
		label: t('将路径复制到剪贴板'),
		type: "normal", 
		click: function(){
			var filePath = elm.data("path");
			if (!filePath) return;
			var clipboard = nw.Clipboard.get();
            clipboard.set(filePath);
            alert(t("路径已复制到剪贴板。"));
		}
	}));
	menu.append(new nw.MenuItem({
		label: t('打开文件夹'),
		type: "normal", 
		click: function(){
			var filePath = elm.data("path");
			if (!filePath) return;
			nw.Shell.showItemInFolder(filePath);
		}
	}));
	menu.append(new nw.MenuItem({
		label: t('用外部应用程序打开'),
		type: "normal", 
		click: function(){
			var filePath = elm.data("path");
			if (!filePath) return;
			nw.Shell.openItem(filePath);			  
		}
	}));

	elm.on("contextmenu", function(ev) {
		ev.preventDefault();
		menu.popup(parseInt(ev.originalEvent.x), parseInt(ev.originalEvent.y));
		return false;		
	})
}


RawViewer.prototype.init = function() {
    $("head").append(`
    <style>
        #previewRawData .blockBox  {
            background-color: #fff;
            margin: 12px;
        }
    </style>
    `)
    this.setListener();
    this.loadPrism();
}


exports.RawViewer = RawViewer;