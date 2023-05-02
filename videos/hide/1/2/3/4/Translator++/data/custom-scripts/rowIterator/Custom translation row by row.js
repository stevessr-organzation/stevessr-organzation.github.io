if(!this.cells[0]) return;

// target cell
const targetCell = 1;
// select the translator
const translator = trans["sugoitrans"];

if (!common.containJapanese(this.keyText)) return;

//if (!empty(this.cells[targetCell])) return;

if (this.cells[targetCell] !== "\\N[2]") return;

console.log("translating ", this.keyText);
//var textToTranslate = keyTextLines.join("\n");
var result = await translator.translate(this.keyText);


this.cells[targetCell] = result.translation.join("\n");
console.log("result:\n", this.cells[targetCell]);

