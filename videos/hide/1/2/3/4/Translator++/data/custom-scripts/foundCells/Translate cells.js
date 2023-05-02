// Cell by cell translation
// It will ignore the first or the last line if that line is a code
// Because some developer put a code for displaying character name on the first line of the message
const translatorId = "trans-deepl-pro";


const targetCell = 2;
const translator = trans.getTranslatorEngine(translatorId);
if (!this.cells[0]) return;
if (!this.cells[targetCell]) return;
var text = this.cells[targetCell];
var sourceLine = this.keyText.replaceAll("\r", "").split("\n");


// filter, only translate message with "「"
//if (text.includes("「") == false) return;

var translated = "";
if (sourceLine.length > 1) {
    var sourceFirstLine = sourceLine[0];
    var sourceLastLine  = sourceLine[sourceLine.length - 1];
    
    if (/[\\A-Za-z0-9\[\]<>]+/g.test(sourceFirstLine)) {
        // skip first line
        console.log("skip first line");
        var result = await trans.sugoitrans.translate(sourceLine.slice(1).join("\n"));
        translated = sourceFirstLine+"\n"+result.translation;
        
    } else if (/[\\A-Za-z0-9\[\]<>]+/g.test(sourceLastLine)) {
        // skip last line
        console.log("skip last line");
        var result = await trans.sugoitrans.translate(sourceLine.slice(0,sourceLine.length - 1).join("\n"));
        translated = result.translation+"\n"+sourceLastLine;
    } else {
        console.log("all lines");
        var result = await trans.sugoitrans.translate(sourceLine.join("\n"));
        translated = result.translation;        
    }
} else {
    console.log("one lines");
    var result = await trans.sugoitrans.translate(sourceLine.join("\n"));
    translated = result.translation;  
}

console.log(translated);
this.cells[targetCell] = translated;