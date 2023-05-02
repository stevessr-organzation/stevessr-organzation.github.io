/*
	Translate things inside bracket
*/

// Target column index
const targetCell = 1;

// The translator
const translator = trans.getActiveTranslatorEngine();

if (!this.keyText) return;
if (!this.cells[targetCell]) return;

const pattern = /(?<=\\[a-zA-Z]+\[)([^\]]*)(?=\])/g
var thisText = this.cells[targetCell]

session.wordCache = session.wordCache || {};

if (!pattern.test(thisText)) return;


var replaceAsync = async function(str, re, callback) {
    // http://es5.github.io/#x15.5.4.11
    str = String(str);
    var parts = [],
        i = 0;
    if (Object.prototype.toString.call(re) == "[object RegExp]") {
        if (re.global)
            re.lastIndex = i;
        var m;
        while (m = re.exec(str)) {
            var args = m.concat([m.index, m.input]);
            parts.push(str.slice(i, m.index), callback.apply(null, args));
            i = re.lastIndex;
            if (!re.global)
                break; // for non-global regexes only take the first match
            if (m[0].length == 0)
                re.lastIndex++;
        }
    } else {
        re = String(re);
        i = str.indexOf(re);
        parts.push(str.slice(0, i), callback.apply(null, [re, i, str]));
        i += re.length;
    }
    parts.push(str.slice(i));
    return Promise.all(parts).then(function(strings) {
        return strings.join("");
    });
}

var newText = await replaceAsync(thisText, pattern, async (matchAll, matchGroup)=>{
    if (session.wordCache[matchGroup]) return session.wordCache[matchGroup];
    
    console.log("Translating:", matchGroup);
    var translation = await translator.translate(matchGroup);
    console.log("Translation result:", translation);
    session.wordCache[matchGroup] = translation.translation[0];
    
    return session.wordCache[matchGroup];
})

this.cells[targetCell] = newText