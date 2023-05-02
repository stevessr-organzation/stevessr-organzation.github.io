var thisAddon 	= this;
var appName 	= this.package.name;
var spawn 		= spawn || require('child_process').spawn;
var bCopy 		= require('better-copy');
var fse 		= fse || require('fs-extra');
const csv       = require('jquery-csv');


/**
 * Parse a sheet into an array
 * @param  {} xlsFile - Path to the file
 * @returns Array of the sheet, or undefined
 */
common.parseSheet = async function(xlsFile) {
    if (!await common.isFileAsync(xlsFile)) return;

    if (nwPath.extname(xlsFile).toLowerCase() == ".csv") {
        return {
            Worksheet: csv.toArrays(await common.fileGetContents(xlsFile))
        }
    }

    return await php.spawn("sheetToArray.php", {
        args: {
            file    : nwPath.resolve(xlsFile)
        },
        scriptPath: thisAddon.getLocation()
    });
}

/**
 * Patch Sheet
 * @param  {String} xlsFile - Path to the spreadsheet file
 * @param  {Object} patch - Object representation of the patch
 * Patch format should be:
 * {
 *     Sheet1: [
 *         {
 *             row: 0,
 *             col: 0,
 *             translation: "Translation"
 *         }
 *     ]
 * }
 */
thisAddon.patchSheet = async function(xlsFile, patch) {
    if (!await common.isFileAsync(xlsFile)) return;

    if (nwPath.extname(xlsFile).toLowerCase() == ".csv") {
        // patch via javascript
    }

    const patchFile = `xlsFile.patch~`;
    ui.log(`Dumping patch ${patchFile}`);
    await common.filePutContents(patchFile, JSON.stringify(patch), 'utf8', false);

    // patch via PHP
    await php.spawn("patchSheet.php", {
        args: {
            file    : nwPath.resolve(xlsFile),
            patch   : nwPath.resolve(patchFile)
        },
        onData: (output) => {
            ui.log(output.toString());
        },
        scriptPath: thisAddon.getLocation()
    });
    ui.log(`Removing patch file.`);
    await common.unlink(patchFile);
}


class SheetFile extends require("www/js/ParserBase.js").ParserBase {
	constructor(sheetData, options, callback) {
		super(sheetData, options, callback)
		this.transData = {
			data:[],
			context:[],
			tags:[],
			parameters:[],
			indexIds:{}
		};
	}
}

thisAddon.SheetFile = SheetFile;


thisAddon.test = async function() {
    var pathToFile = 'D:/test/sheets/test.xlsx'
    var data = await common.parseSheet(pathToFile);
    var sheetFile = new SheetFile(data);

    console.log(sheetFile);
}