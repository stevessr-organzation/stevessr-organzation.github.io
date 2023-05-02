/*
	Collect the first line of the texts into common reference.
	This script is designed work with "Check First Line in Common Reference" option on Sugoi Translator engine
*/

// Number of minimal occurance to be added into Common Reference
const threshold = 2;

// The process will skip if the first line is longer or equal with this setting
const maxLength = 30;


var exitCode = ()=> {
    if (!this.isLast) return;
    console.log("Final data:", session.commonStringData);
    for (var i in session.commonStringData) {
        if (session.commonStringData[i] < threshold) continue;
        if (i.length > maxLength) continue;
        trans.addRow("Common Reference", i)
    }
}

//console.log(this.index, this.maxIndex);
if(!this.keyText) return exitCode();

var originalTextLines = this.cells[0].replaceAll("\r", "").split("\n");
if (originalTextLines.length < 2) return exitCode();

console.log("first text is:", originalTextLines[0]);
if (/[\:\：]/g.test(originalTextLines[0]) == false) return exitCode();

console.log("Handling", this.index);
session.commonStringData = session.commonStringData || {};

console.log("registering", originalTextLines[0]);
session.commonStringData[originalTextLines[0]] = session.commonStringData[originalTextLines[0]] || 0;
session.commonStringData[originalTextLines[0]]++;


if (this.isLast == false) return exitCode();

// finally exit
return exitCode();

