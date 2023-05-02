const threshold = 2;
const maxLength = 10;
var exitCode = ()=> {
    if (!this.isLast) return;
    console.log("Final data:", window.commonStringData);
    for (var i in window.commonStringData) {
        if (window.commonStringData[i] < threshold) continue;
        if (i.length > maxLength) continue;
        trans.addRow("Common Reference", i)
    }
}

//console.log(this.index, this.maxIndex);
if(!this.keyText) return exitCode();

var originalTextLines = this.cells[0].replaceAll("\r", "").split("\n");
if (originalTextLines.length < 2) return exitCode();

if (this.context.join("/").includes("/message/") == false) return;


console.log("Handling", this.index);
window.commonStringData = window.commonStringData || {};


window.commonStringData[originalTextLines[1]] = window.commonStringData[originalTextLines[1]] || 0;
window.commonStringData[originalTextLines[1]]++;


if (this.isLast == false) return exitCode();

// finally exit
return exitCode();

