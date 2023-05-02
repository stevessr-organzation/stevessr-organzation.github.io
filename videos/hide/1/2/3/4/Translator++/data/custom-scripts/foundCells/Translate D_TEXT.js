// Cell by cell translation
// Translate the nth arguments of call command
const translatorId = "trans-deepl-pro";
const targetCell = 2;
const translator = trans.getTranslatorEngine(translatorId);
const argumentToCapture = 1; // starts from 0
const expectCommand = "D_TEXT";
const overwrite = true;

if (!this.cells[0]) return;
if (!overwrite) {
    if (!this.cells[targetCell]) return;
}
var text = this.cells[targetCell];
var args = this.keyText.split(" ");
if (args[0]!==expectCommand) return;


var translated = "";
var result = await trans.sugoitrans.translate(args[argumentToCapture]);
translated = result.translation.join("\n"); 
console.log("Result translation:", translated);
translated = translated.replaceAll(" ", "　");// replace space with full width space

args[argumentToCapture] = translated;
console.log(args.join(" "));
this.cells[targetCell] = args.join(" ");