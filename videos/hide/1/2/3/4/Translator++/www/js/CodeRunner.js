var die = function(text) {
    throw(`Process halted by user request --2472KAFSDFJ--:${text}`);
}

class BaseIterator {
    constructor(options) {
        this.options    = this.options || {};
        if (window) window.die = die;
    }
}

BaseIterator.prototype.getObj = function() {
    return trans.getObjectById(this.file);
}


class CodeRunner extends require("www/js/BasicEventHandler.js") {
    constructor (options) {
        super();
        this.options    = options || {};
        this.editedCellPool = []
    }
}

CodeRunner.prototype.onExecutionStart = function() {
    this.editedCellPool = [];
    this.hasEditedCell = false;
}

CodeRunner.prototype.onCellEdit = function(file, row, col, value, previousValue) {
    console.log("Automation set a cell at:",file, row, col, value, previousValue);
    this.hasEditedCell = true;
    var data = {
        file:file,
        row:row,
        col:col,
        value:value,
        previousValue:previousValue
    }
    this.trigger("cellEdit", data)
    this.editedCellPool.push(data)
}

CodeRunner.prototype.finalize = async function(origin, options) {
    trans.grid.render();
    this.isBreak = false;
    this.trigger("executionEnd", {
        changedCells: this.editedCellPool,
        handler:origin
    })
    trans.trigger("codeEditorExecutionEnd", {
        changedCells: this.editedCellPool,
        handler:origin
    })
    if (this.hasEditedCell) {
        trans.refreshGrid();
        trans.evalTranslationProgress();
        this.hasEditedCell = false;
    }
    return true;
}

CodeRunner.prototype.executeGlobal = async function(fn, options) {
    this.onExecutionStart();

	fn = fn || async function() {};
	options= options || {};

    await fn.call(this);
    this.finalize("global", options)
	
	return true;
}

CodeRunner.prototype.executeObjectIterator = async function(fn, options) {
    var codeRunner = this;
    this.onExecutionStart();
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
            if (codeRunner.isBreak) return codeRunner.finalize("object", options);
		}
        codeRunner.finalize("object", options)
	}
	
	await iteratorMain.apply(iteratorObj);
	return true;
}

/**
 * Custom script for each rows
 * @param  {} fn
 * @param  {} options
 */
CodeRunner.prototype.executeRowIterator = async function(fn, options) {
    var codeRunner = this;
    this.onExecutionStart();

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
				this._cells 	= trans.project.files[this.file].data[rowId] || [];
                this.keyText 	= this._cells[trans.keyColumn];
                this.cells = new Proxy(this._cells, {
                    get: function(target, name) {
                        return target[name];
                    },
                    set: function(target, name, value) {
                        codeRunner.onCellEdit(fileId, rowId, name, value, target[name])
                        target[name] = value
                    }
                }); 
				this.tags 		= trans.project.files[this.file].tags[rowId];
				this.parameters	= trans.project.files[this.file].parameters[rowId];
				this.context	= trans.project.files[this.file].context[rowId];
				this.comments   = trans.project.files[this.file].comments || undefined;
				
                if (this.index>=this.maxIndex) this.isLast = true;
                await fn.call(this);
                if (codeRunner.isBreak) return codeRunner.finalize("row", options);
			}
		}
        codeRunner.finalize("row", options)
	}
	
	await iteratorMain.apply(iteratorObj);
	return true;
}


CodeRunner.prototype.executeSelectedCells = async function(fn, options) {
    var codeRunner = this;
    this.onExecutionStart();

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
            codeRunner.onCellEdit(this.file, this.rowId, this.colId, text, trans.project.files[this.file].data[this.rowId][this.colId])
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
        var fileId = this.file;

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
				this._cells 	= trans.project.files[this.file].data[rowId] || [];
                this.keyText 	= this._cells[trans.keyColumn];
                this.cells = new Proxy(this._cells, {
                    get: function(target, name) {
                        return target[name];
                    },
                    set: function(target, name, value) {
                        codeRunner.onCellEdit(fileId, rowId, name, value, target[name])
                        target[name] = value
                    }
                });  
				this.tags 		= trans.project.files[this.file].tags[rowId];
				this.parameters	= trans.project.files[this.file].parameters[rowId];
				this.context	= trans.project.files[this.file].context[rowId];
				this.comments   = trans.project.files[this.file].comments || undefined;
 
                this.colId      = colId;
                this.text       = trans.project.files[this.file].data[rowId][colId];
                this.cellCoords = thisCoords[i];

                if (this.index>=this.maxIndex) this.isLast = true;
                await fn.call(this);
                if (codeRunner.isBreak) return codeRunner.finalize("cell", options);
            }
		}
        codeRunner.finalize("cell", options)
	}
	
	await iteratorMain.apply(iteratorObj);
	return true;
}

CodeRunner.prototype.getDialogArguments = function(key) {
    try {
        return window.dialogArguments[key]
    } catch (e) {
        return console.warn("No arguments:", key);
    }
}

CodeRunner.prototype.executeFoundCells = async function(fn, options) {

    var codeRunner  = this;
    this.onExecutionStart();

	fn              = fn || async function() {};
	options         = options || {};

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

    var foundCells = options.foundCells || this.getDialogArguments('foundCells');
    console.log("found cells:", foundCells);
	if (empty(foundCells)) return;

	var iteratorMain = async function() {
        console.log("Found cell:", foundCells);
        this.index      = -1;
        this.maxIndex   = foundCells.length - 1;
        this.isLast     = false;
        if (this.maxIndex < 0) this.maxIndex = 0;
        var processed = {};

		for (var idx in foundCells) {
            this.index++;
            var thisCoords = foundCells[idx];
            var rowId = thisCoords.row;
            var colId = thisCoords.col;
            if (processed[thisCoords.file+","+rowId+","+colId]) continue;
            processed[thisCoords.file+","+rowId+","+colId] = true;

            this.file 		= thisCoords.file;
            this.rowId 		= rowId;
            this._cells 	= trans.project.files[this.file].data[rowId] || [];
            this.keyText 	= this._cells[trans.keyColumn];
            this.cells = new Proxy(this._cells, {
                get: function(target, name) {
                    return target[name];
                },
                set: function(target, name, value) {
                    codeRunner.onCellEdit(thisCoords.file, rowId, name, value, target[name])
                    target[name] = value
                }
            }); 
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
            if (codeRunner.isBreak) return codeRunner.finalize("find", options);
            
        }
        codeRunner.finalize("find", options)
	}
	
	await iteratorMain.apply(iteratorObj);
	return true;
}

CodeRunner.prototype.run = async function(code, workspace, options) {
    workspace = workspace || this.workspace;
    options = options || {};

    try {
        let AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
        var fn = new AsyncFunction(code);
	} catch (e) {
		throw e;
	}

    try {
        window.session = {};
        console.log("workspace is:", workspace);
        console.log("%c↓↓The outputs from your script are below↓↓", "color:blue;font-size:1.5em;");
        console.log("==========================================");
        if (workspace == "gridSelection") {
            await this.executeSelectedCells(fn, options);
        } else if (workspace == "foundCells") {
            await this.executeFoundCells(fn, options);
        } else if (workspace == "objectIterator") {
            await this.executeObjectIterator(fn, options);
        } else if (workspace == "rowIterator") {
            await this.executeRowIterator(fn, options);
        } else if (workspace == "global") {
            await this.executeGlobal(fn, options);
        } else {
            throw "Unknown workspace : "+workspace;
        }
    } catch (e) {
        if (e.toString().includes('--2472KAFSDFJ--') == true) {
            var msg = e.toString().split(":");
            return `Process halted by user request:\n${msg[1]}`;
        } else {
            console.error(e);
            throw e;
        }
    }
}

module.exports = CodeRunner;
module.exports.BaseIterator = BaseIterator;