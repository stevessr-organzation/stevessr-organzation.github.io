/*
Extracts the first line of the messages and put it into common reference
*/
const captureFirstLineOnly = true;
const threshold = 2;
const maxLength = 10;
if (this.index == 0) window.commonStringData = {};

var exitCode = ()=> {
    if (!this.isLast) return;
    console.log("Final data:", window.commonStringData);
    for (var i in window.commonStringData) {
        if (!i) continue;
        if (window.commonStringData[i] < threshold) continue;
        if (i.length > maxLength) continue;
        console.log("Registering", i);
        var newIndex = trans.addRow("Common Reference", i);
        console.log("New index:", newIndex);
    }
}




//console.log(this.index, this.maxIndex);
if(!this.keyText) return exitCode();


//only process if context include /message/
if (this.context.join("\n").includes("/message/") == false) return exitCode();

var originalTextLines = this.cells[0].replaceAll("\r", "").split("\n");
if (originalTextLines.length < 2) return exitCode();

console.log("Handling", this.index);
window.commonStringData = window.commonStringData || {};

if (captureFirstLineOnly) {
    console.log("capturing", originalTextLines[0]);
    window.commonStringData[originalTextLines[0]] = window.commonStringData[originalTextLines[0]] || 0;
    window.commonStringData[originalTextLines[0]]++;   
} else {
    for (var i in originalTextLines) {
        window.commonStringData[originalTextLines[i]] = window.commonStringData[originalTextLines[i]] || 0;
        window.commonStringData[originalTextLines[i]]++;
    }
}



// finally exit
return exitCode();

