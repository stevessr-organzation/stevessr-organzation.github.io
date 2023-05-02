class TranslationByContext {
    constructor(options) {
        this.options = options || {};
        this.container = this.options.container || $("#contextTranslation");
        this.grid = {}
        this.isInitialized = false;
        this.dataLocation = this.options.dataLocation || "parameters";
        this.data = [{"contextStr":"initialization","translation":""}]
        this.transRow; // active trans.grid's row
        this.init();
    }   
}

TranslationByContext.prototype.getSelectedTranslationByContext = function() {
	if (!trans.lastSelectedCell) return;
	var rowNumber = trans.lastSelectedCell[0]

	var obj =trans.getSelectedObject()
	obj[this.dataLocation] = obj[this.dataLocation] || [];
	obj[this.dataLocation][rowNumber] = obj[this.dataLocation][rowNumber] || []
	return obj[this.dataLocation][rowNumber]    
}

TranslationByContext.prototype.getContextTranslationByRow = function(row, file) {
	file = file || trans.getSelectedId();
	if (typeof row !== "number") return false;

	var thisObj = trans.getObjectById(file);
	if (!thisObj[this.dataLocation]) return false;
	return thisObj[this.dataLocation][row];
}


TranslationByContext.prototype.getData = function() {
    var param                   = this.getSelectedTranslationByContext();
    if (!param) return []
    var contexts                = trans.getSelectedContext();

    console.log("context is:", contexts);
    // test if param is initialized
    if (Array.isArray(contexts) == false) return;
    param = param || [];
    for (var i=0; i<contexts.length; i++) {
        param[i] = param[i] || {}
        param[i].contextStr = contexts[i];
        param[i].translation = param[i].translation || "";
    }

    this.data = param;
    console.log("context translator:", this.data);
    return this.data;
}


TranslationByContext.prototype.getContextDataByLine = function(row, transFileData) {
    var result = [];

    if (!transFileData[this.dataLocation]) return result;
    var paramData = transFileData[this.dataLocation][row];
    if (Array.isArray(paramData) == false) return result;
    for (var contextIdx=0; contextIdx<paramData.length; contextIdx++){
        var thisParam = paramData[contextIdx];
        if (typeof thisParam.translation == 'undefined') continue;
        result.push({
            contextStr  : thisParam.contextStr,
            translation :thisParam.translation
        });
    }
    //console.log("Param data:", result);

    return result;

}

TranslationByContext.prototype.clear = function(fileId, row) {
    var transContext = this.getContextTranslationByRow(row, fileId);
    for (var i in transContext) {
        transContext[i].translation = "";
    }
}

TranslationByContext.prototype.clearFromObjects = function(files, options) {
    console.log("clearFromObjects", arguments);
    if (typeof trans.project == false) return false;
	files = files||trans.getSelectedId();
	options = options||{};
	options.refreshGrid = options.refreshGrid||false;
	
	if (Array.isArray(files) == false) files = [files];
	
	for (var i=0; i<files.length; i++) {
		var file = files[i];
		var thisData = trans.project.files[file].data;
		for (var row=0; row<thisData.length; row++) {
            this.clear(file, row);
		}
	}
    this.grid.render();
}

TranslationByContext.prototype.clearBySelected = function(fileId, row, mode) {
    if (Array.isArray(row)) row = [row];

    if (mode == "range") {
        // should be CellRange object
        var rowIndex = {};
        for (var i in row) {
            if (row[i].constructor.name !== "CellRange") continue;
            row[i].forAll((row, col)=>{
                rowIndex[row] = true;
            })
        }
        for (var thisRow in rowIndex) {
            this.clear(fileId, thisRow);
        }
    } else {
        for (var i in row) {
            if (typeof row[i] !== "number") continue;
            this.clear(row[i], row);
        }
    }

    this.grid.render();
}

/**
 * Import context translation.
 * Imported context translation must has a same key string, file & context address
 * @param  {} transData
 * @param  {} options
 */
TranslationByContext.prototype.importContextTranslation = function(transData, options) {
    try {
        var obj = transData.project.files
    } catch (e) {
        console.warn("无法从加载的trans数据中提取文件数据", transData);
        return {};
    }

    var index = {};
    var keyColumn = transData.keyColumn || 0;
    var transKeyColumn = trans.keyColumn || 0;
    console.log("Generating index from TransData", transData);
    for (var i=0; i<options.files.length; i++) {
		var file = options.files[i];
        console.log(">>Handling file:", file);
        index[file] = index[file] || {};
		if (Boolean(obj[file]) == false) continue;

        var transFile = trans.getObjectById(file);
		if (Boolean(transFile) == false) continue;

		for (var row=0; row<obj[file].data.length; row++) {
            var keyString = obj[file].data[row][keyColumn];
			if (Boolean(keyString) == false) continue;
            var paramData = this.getContextDataByLine(row, obj[file]);
            if (empty(paramData)) continue;
            for (var contextId=0; contextId<paramData.length; contextId++) {
                if (!paramData[contextId]) continue;
                if (!paramData[contextId].contextStr) continue;
                var thisContextAddress = paramData[contextId].contextStr;
                index[file][keyString] = index[file][keyString] || {};
                index[file][keyString][thisContextAddress] = {
                    row:row,
                    paramData : paramData[contextId]
                }
            }

		}

        console.log("Analyzing current trans file", transFile);
        //console.log("Current index:", JSON.stringify(index, undefined, 2));
        transFile.parameters = transFile.parameters || [];
		for (var row=0; row<transFile.data.length; row++) {
            if (empty(transFile.data[row])) continue;
            var keyString = transFile.data[row][transKeyColumn];
			if (Boolean(keyString) == false) continue;
            //console.log("Keystring:", keyString);

            if (Array.isArray(transFile.context) == false) continue;
            var thisContext = transFile.context[row];
            if (empty(thisContext)) continue;
            //console.log("Found matches at source row:", row);
            //console.log("Text:", keyString);

            // checking index
            if (!index[file]) continue;
            if (!index[file][keyString]) continue;
            for (var contextId=0; contextId<thisContext.length; contextId++) {
                var thisContextAddress = thisContext[contextId];
                if(!index[file][keyString][thisContextAddress]) continue;
                //console.log("----match:", index[file][keyString][thisContextAddress]);
                //console.log("Applying translation");
                transFile.parameters[row] = transFile.parameters[row] || [];
                transFile.parameters[row][contextId] = transFile.parameters[row][contextId] || {}
                transFile.parameters[row][contextId].contextStr = index[file][keyString][thisContextAddress].paramData.contextStr;
                transFile.parameters[row][contextId].translation = index[file][keyString][thisContextAddress].paramData.translation;
            }
		}        
        // searching matching pair in current trans
	}
    //console.log("Index:", index);
}


/**
 * Generate a key value object
 * Key is searchable things, value of a key phrases or a context string
 */
TranslationByContext.prototype.importGenerateSearchablePairs = function(transData, options) {
    try {
        var obj = transData.project.files
    } catch (e) {
        console.warn("无法从加载的trans数据中提取文件数据", transData);
        return {};
    }
    var result = {};

    for (var i=0; i<options.files.length; i++) {
		var file = options.files[i];
		//console.log("Handling obj file : ", file, obj[file]);
		if (Boolean(obj[file]) == false) continue;
		for (var row=0; row<obj[file].data.length; row++) {
			if (Boolean(obj[file].data[row][0]) == false) continue;
			//var thisTranslation = trans.getTranslationFromRow(obj[file].data[row]);
			var thisTranslation = this.getContextTranslationByRow(row, file);
			if (Boolean(thisTranslation) == false) continue;
			result[obj[file].data[row][0]] = thisTranslation;
		}
	}

    console.log("importGenerateSearchablePairs:", result);
    return result;
}

TranslationByContext.prototype.reload = function() {
    console.log("refreshing transGrid");
    this.getData();
    this.grid.updateSettings({
		data:this.data
    });
    this.grid.render();
}


TranslationByContext.prototype.refresh = function() {
    this.grid.updateSettings({
        height      : '100%',
        width       : '100%'		
	});	
    this.grid.render();
}

/**
 * Called by trans.getTranslationData()
 * @param  {} row
 * @param  {} fileId
 * @param  {} originalWord
 */
TranslationByContext.prototype.generateContextTranslation = function(row, fileId, originalWord) {
    var contextSeparator = "\n";
    var result = {
        length:0,
        translation:{}
    }		
    var parameters = this.getContextTranslationByRow(row, fileId);
    if (!parameters) return result;
    if (!Array.isArray(parameters)) return result;
    if (parameters.length < 1) return result;

    for (var contextId=0; contextId<parameters.length; contextId++) {
        if (Boolean(parameters[contextId]) == false) continue;
        if (Boolean(parameters[contextId].translation) == false) continue;
        if (Boolean(parameters[contextId].contextStr) == false) continue;
        var contextKey = parameters[contextId].contextStr+contextSeparator+originalWord
        result.translation[contextKey] = parameters[contextId].translation;
        result.length++;
    }	
    return result;	
}

TranslationByContext.prototype.init = async function() {
    if (this.isInitialized) return false;
    console.log("Initializing context grid");
    this.container.empty();
    this.gridContainer = $("<div class='hotContainer'></div>");
    this.container.append(this.gridContainer);

    this.grid = new Handsontable(this.gridContainer[0], {
        data        : this.data,
        colHeaders  : ["Context path", "Translation"],
        columns     : [
            {
                readOnly:true,
                data:"contextStr"
            },
            {
                readOnly:false,
                data:"translation"
            }
        ],
        height      : '100%',
        width       : '100%',
        colWidths   : 200,
        allowInsertColumn: false,
        allowInsertRow: false,
        allowRemoveColumn: false,
        allowRemoveRow: false,
        stretchH: 'last',
        manualColumnResize: true,
        //outsideClickDeselects:false,
        placeholder : t("~use default translation~"),
        minSpareRows: 0
    })

    $(document).off("beforeProcessSelection.tbc");
    $(document).on("beforeProcessSelection.tbc", (e, selectionOpt)=>{
        //row, column, row2, column2, preventScrolling, selectionLayerLevel
        //this.reload();
        console.log("deselect cell");
        this.grid.deselectCell();
    })

    $(document).off("onAfterSelectCell.tbc");
    $(document).on("onAfterSelectCell.tbc", (e, options)=>{
        console.log("reload context list with options:", options);
        options = options || {};
        this.transRow = options.fromRow;
        this.reload();
    })

    $(document).off("onCellInfoResizeStart");
    $(document).on("onCellInfoResizeStart", ()=> {
        this.grid.updateSettings({
            height      : '80',
            width       : '80'		
        });	        
        this.gridContainer.addClass("hidden");
    })

    var resetTablePossition = ()=> {
        this.gridContainer.removeClass("hidden");
        this.grid.updateSettings({
            height      : $("#contextTranslation").innerHeight()-4,
            width       : $("#contextTranslation").innerWidth()	-4	
        });	       
        this.refresh();       
    }

    $(document).off("onCellInfoResizeStop");
    $(document).on("onCellInfoResizeStop", ()=> {
        resetTablePossition();
    });

    $(document).off("translationOnTabChange.tbc");
    $(document).on("translationOnTabChange.tbc", (e, tabName)=> {
        console.log("changed to ", tabName);
        if (tabName == "contextTranslation") resetTablePossition();
    });

    $(document).off("onAfterImportTranslations.tbc");
    $(document).on("onAfterImportTranslations.tbc", (e, obj)=> {
        /*
        obj: {
			options:options, 
			loadedData:loadedData,
			refTranslation:refTranslation
        }
        */
        console.log("onAfterImportTranslations ", obj);
        //this.importGenerateSearchablePairs(obj.loadedData, obj.options);
        this.importContextTranslation(obj.loadedData, obj.options);
    });

    $(document).off("removeAllTranslation.tbc");
    $(document).on("removeAllTranslation.tbc", (e, param) => {
        this.clearFromObjects(param.files, param.options)
    });

    $(document).off("clearContextTranslationByRow.tbc");
    $(document).on("clearContextTranslationByRow.tbc", (e, param) => {
        var conf = confirm(t("是否要删除当前选定行上的所有上下文转换？"));  
        if (!conf) return;
      
        this.clearFromObjects(param.files, param.options)
    });

    $('[data-tabname="contextTranslation"] .clearContextTranslation').off('click');
    $('[data-tabname="contextTranslation"] .clearContextTranslation').on('click', ()=> {
        var conf = confirm(t("是否要删除当前活动行上的所有翻译？"));  
        if (!conf) return;
        console.log(`Clearing ${trans.getSelectedId()} row ${this.transRow}`);
        this.clear(trans.getSelectedId(), this.transRow);
        this.grid.render();
    })

    $(document).off("afterRemoveRow.tbc");
    $(document).on("afterRemoveRow.tbc", (e, param) => {
        if (this.dataLocation == "parameters") return;
        var file = param.file;
        var rows = param.rows;
        var options = param.options;

        for (var i=0; i<rows.length; i++) {
            var thisRow = rows[i];
            if (typeof trans.getObjectById(file).data[thisRow] == 'undefined') continue;
            if (empty(trans.getObjectById(file)[this.dataLocation])) continue;
            if (trans.getObjectById(file)[this.dataLocation]) trans.project.files[file][this.dataLocation].splice(thisRow, 1);
        }        
    });

    this.isInitialized =true;
}

module.exports = TranslationByContext;