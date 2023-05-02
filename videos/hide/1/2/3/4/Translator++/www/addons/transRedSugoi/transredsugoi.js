"use strict";
var RedPlaceholderType;
(function (RedPlaceholderType) {
    RedPlaceholderType["poleposition"] = "poleposition";
    RedPlaceholderType["hexPlaceholder"] = "hexPlaceholder";
    RedPlaceholderType["noEscape"] = "noEscape";
    RedPlaceholderType["ninesOfRandomness"] = "ninesOfRandomness";
    RedPlaceholderType["tagPlaceholder"] = "tagPlaceholder";
    RedPlaceholderType["closedTagPlaceholder"] = "closedTagPlaceholder";
    RedPlaceholderType["fullTagPlaceholder"] = "fullTagPlaceholder";
    RedPlaceholderType["curlie"] = "curlie";
    RedPlaceholderType["doubleCurlie"] = "doubleCurlie";
    RedPlaceholderType["privateUse"] = "privateUse";
    RedPlaceholderType["hashtag"] = "hashtag";
    RedPlaceholderType["hashtagTriple"] = "hashtagTriple";
    RedPlaceholderType["tournament"] = "tournament";
    RedPlaceholderType["mvStyle"] = "mvStyle";
    RedPlaceholderType["wolfStyle"] = "wolfStyle";
    RedPlaceholderType["percentage"] = "percentage";
    RedPlaceholderType["mvStyleLetter"] = "mvStyleLetter";
    RedPlaceholderType["sugoiTranslatorSpecial"] = "sugoiTranslatorSpecial";
    RedPlaceholderType["sugoiTranslatorSpecial2"] = "sugoiTranslatorSpecial2";
})(RedPlaceholderType || (RedPlaceholderType = {}));
// I wonder if we could initiate this through calling the above...
// I'd rather not have to change both
var RedPlaceholderTypeNames;
// I wonder if we could initiate this through calling the above...
// I'd rather not have to change both
(function (RedPlaceholderTypeNames) {
    RedPlaceholderTypeNames["poleposition"] = "Poleposition (e.g. #24)";
    RedPlaceholderTypeNames["hexPlaceholder"] = "Hex Placeholder (e.g. 0xffffff)";
    RedPlaceholderTypeNames["noEscape"] = "No escaping (will translate everything)";
    RedPlaceholderTypeNames["ninesOfRandomness"] = "Closed Nines (e.g. 9123412349)";
    RedPlaceholderTypeNames["tagPlaceholder"] = "Tag Placeholder (e.g. &lt;24&gt;)";
    RedPlaceholderTypeNames["closedTagPlaceholder"] = "Tag Placeholder Closed Tags (e.g. &lt;24/&gt;)";
    RedPlaceholderTypeNames["fullTagPlaceholder"] = "Tag Placeholder Full XML-style Tag (e.g. &lt;24&gt;&lt;/24&gt;)";
    RedPlaceholderTypeNames["curlie"] = "Curlies (e.g. letter enclosed by curly brackets)";
    RedPlaceholderTypeNames["doubleCurlie"] = "Double Curlies (e.g. letter enclosed by two curly brackets on each side)";
    RedPlaceholderTypeNames["privateUse"] = "Supplementary Private Use Area-A (\uD83D\uDC7D)";
    RedPlaceholderTypeNames["hashtag"] = "Hashtag (#A)";
    RedPlaceholderTypeNames["hashtagTriple"] = "Triple Hashtag (#ABC)";
    RedPlaceholderTypeNames["tournament"] = "Tournament (e.g. #1, #2, #3)";
    RedPlaceholderTypeNames["mvStyle"] = "MV Message (e.g. %1, %2, %3)";
    RedPlaceholderTypeNames["mvStyleLetter"] = "MV Message but with Letters (e.g. %A, %B, %C)";
    RedPlaceholderTypeNames["wolfStyle"] = "Wolf Message (e.g. @1, @2, @3)";
    RedPlaceholderTypeNames["percentage"] = "Actual Percentage (e.g. 1%, 2%)";
    RedPlaceholderTypeNames["sugoiTranslatorSpecial"] = "ivdos' Special (e.g. @#1, @#2)";
    RedPlaceholderTypeNames["sugoiTranslatorSpecial2"] = "ivdos' Special with Letters (e.g. @#A, @#B)";
})(RedPlaceholderTypeNames || (RedPlaceholderTypeNames = {}));
let RedPlaceholderTypeArray = [
    RedPlaceholderType.poleposition,
    RedPlaceholderType.hexPlaceholder,
    RedPlaceholderType.noEscape,
    RedPlaceholderType.ninesOfRandomness,
    RedPlaceholderType.tagPlaceholder,
    RedPlaceholderType.closedTagPlaceholder,
    RedPlaceholderType.fullTagPlaceholder,
    RedPlaceholderType.curlie,
    RedPlaceholderType.doubleCurlie,
    RedPlaceholderType.privateUse,
    RedPlaceholderType.hashtag,
    RedPlaceholderType.hashtagTriple,
    RedPlaceholderType.tournament,
    RedPlaceholderType.mvStyle,
    RedPlaceholderType.mvStyleLetter,
    RedPlaceholderType.wolfStyle,
    RedPlaceholderType.percentage,
    RedPlaceholderType.sugoiTranslatorSpecial,
    RedPlaceholderType.sugoiTranslatorSpecial2,
];
const regExpObj = {};
regExpObj[RedPlaceholderType.poleposition] = /((?: *　*#[0-9]+ *　*){2,})/g;
regExpObj[RedPlaceholderType.mvStyle] = /((?: *　*%[0-9]+ *　*){2,})/g;
regExpObj[RedPlaceholderType.percentage] = /((?: *　*[0-9]+% *　*){2,})/g;
regExpObj[RedPlaceholderType.wolfStyle] = /((?: *　*@[0-9]+ *　*){2,})/g;
regExpObj[RedPlaceholderType.tournament] = /((?: *　*#[0-9]+ *　*){2,})/g;
regExpObj[RedPlaceholderType.hexPlaceholder] = /((?: *　*0x[0-9a-fA-F]+ *　*){2,})/gi;
regExpObj[RedPlaceholderType.tagPlaceholder] = /((?: *　*<[0-9]{2,}> *　*){2,})/g;
regExpObj[RedPlaceholderType.closedTagPlaceholder] = /((?: *　*<[0-9]{2,}\/> *　*){2,})/g;
regExpObj[RedPlaceholderType.ninesOfRandomness] = new RegExp("((?: *　*9[0-9]{4,}9 *　*){2,})", "g");
regExpObj[RedPlaceholderType.fullTagPlaceholder] = /((?: *　*<[0-9]{2,}><\/[0-9]{2,}> *　*){2,})/g;
regExpObj[RedPlaceholderType.curlie] = /((?: *　*{[A-Z]+} *　*){2,})/g;
regExpObj[RedPlaceholderType.doubleCurlie] = /((?: *　*{{[A-Z]+} *　*){2,}})/gi;
regExpObj[RedPlaceholderType.privateUse] = /((?: *　*[\uF000-\uFFFF] *　*){2,}})/g;
regExpObj[RedPlaceholderType.hashtag] = /((?: *　*#[A-Z] *　*){2,})/gi;
regExpObj[RedPlaceholderType.hashtagTriple] = /((?: *　*#[A-Z][A-Z][A-Z] *　*){2,})/gi;
regExpObj[RedPlaceholderType.mvStyleLetter] = /((?: *　*%[A-Z] *　*){2,})/gi;
regExpObj[RedPlaceholderType.sugoiTranslatorSpecial] = /((?: *　*@#[0-9]+ *　*){2,})/gi;
regExpObj[RedPlaceholderType.sugoiTranslatorSpecial2] = /((?: *　*@#[A-Z]+ *　*){2,})/gi;
const regExpExists = {};
regExpExists[RedPlaceholderType.poleposition] = /((?:#[0-9]+))/g;
regExpExists[RedPlaceholderType.mvStyle] = /((?:%[0-9]+))/g;
regExpExists[RedPlaceholderType.percentage] = /((?:[0-9]+%))/g;
regExpExists[RedPlaceholderType.wolfStyle] = /((?:@[0-9]+))/g;
regExpExists[RedPlaceholderType.tournament] = /((?:#[0-9]+))/g;
regExpExists[RedPlaceholderType.hexPlaceholder] = /((?:0x[0-9a-fA-F]+))/gi;
regExpExists[RedPlaceholderType.tagPlaceholder] = /((?:<[0-9]>))/g;
regExpExists[RedPlaceholderType.closedTagPlaceholder] = /((?:<[0-9]\/>))/g;
regExpExists[RedPlaceholderType.ninesOfRandomness] = new RegExp("((?:9[0-9]{4,}9))", "g");
regExpExists[RedPlaceholderType.fullTagPlaceholder] = /((?:<[0-9]><\/[0-9]>))/g;
regExpExists[RedPlaceholderType.curlie] = /((?:{[A-Z]+}))/g;
regExpExists[RedPlaceholderType.doubleCurlie] = /((?:{{[A-Z]+})})/gi;
regExpExists[RedPlaceholderType.privateUse] = /((?:[\uF000-\uFFFF])})/g;
regExpExists[RedPlaceholderType.hashtag] = /((?:#[A-Z]))/gi;
regExpExists[RedPlaceholderType.hashtagTriple] = /((?:#[A-Z][A-Z][A-Z]))/gi;
regExpExists[RedPlaceholderType.mvStyleLetter] = /((?:%[A-Z]))/gi;
regExpExists[RedPlaceholderType.sugoiTranslatorSpecial] = /((?:@#[0-9]+))/gi;
regExpExists[RedPlaceholderType.sugoiTranslatorSpecial2] = /((?:@#[A-Z]+))/gi;
let escapingTitleMap = RedPlaceholderTypeNames;
class RedStringEscaper {
    constructor(text, options) {
        this.type = RedPlaceholderType.poleposition;
        this.splitEnds = true;
        this.removeUnks = true;
        this.mergeSymbols = true;
        this.symbolAffix = 1;
        this.currentSymbol = 4;
        this.hexCounter = 983041;
        this.closedNinesLength = 7; // plus two boundaries
        this.storedSymbols = {};
        this.reverseSymbols = {};
        this.broken = false;
        this.curlyCount = 65; //A
        this.privateCounter = 983041; // 👽
        this.preString = "";
        this.postString = "";
        this.hashtagOne = 65; //A
        this.hashtagTwo = 66; //B
        this.hashtagThree = 67; //C
        this.extractedStrings = [];
        this.extractedKeys = [];
        this.wasExtracted = false;
        this.text = text;
        this.currentText = text;
        this.type = options.type || RedPlaceholderType.poleposition;
        this.splitEnds = options.splitEnds == true;
        this.removeUnks = options.noUnks == true;
        this.mergeSymbols = options.mergeSymbols == true;
        this.wasExtracted = options.isExtracted == true;
        if (options.isolateSymbols == true && this.type != RedPlaceholderType.noEscape) {
            options.isExtracted = true;
            let found = true;
            while (found) {
                found = false;
                this.currentText = this.currentText.replaceAll(new RegExp(options.isolateRegExp, "gim"), (match) => {
                    if (match == this.currentText || this.storedSymbols[match] != undefined) {
                        return match;
                    }
                    found = true;
                    let placeholder = this.storeSymbol(match);
                    this.extractedKeys.push(placeholder);
                    this.extractedStrings.push(new RedStringEscaper(match, options));
                    return placeholder;
                });
            }
        }
        this.escape();
    }
    storeSymbol(text) {
        // Originally was using tags, hence the name. Then I tried parenthesis.
        // I think the AI might get used to any tags we use and just start. ... killing them
        // So far this seems to work the best
        if (this.reverseSymbols[text] != undefined) {
            // if we reuse the same symbol it might help the AI understand the sentence
            return this.reverseSymbols[text];
        }
        else {
            let tag = "Invalid Placeholder Style";
            switch (this.type) {
                case RedPlaceholderType.poleposition:
                    tag = this.getPolePosition();
                    break;
                case RedPlaceholderType.hexPlaceholder:
                    tag = this.getHexPlaceholder();
                    break;
                case RedPlaceholderType.noEscape:
                    tag = text;
                    break;
                case RedPlaceholderType.ninesOfRandomness:
                    tag = this.getClosedNines();
                    break;
                case RedPlaceholderType.tagPlaceholder:
                    tag = this.getTag();
                    break;
                case RedPlaceholderType.fullTagPlaceholder:
                    tag = this.getFullTag();
                    break;
                case RedPlaceholderType.closedTagPlaceholder:
                    tag = this.getClosedTag();
                    break;
                case RedPlaceholderType.curlie:
                    tag = this.getCurly();
                    break;
                case RedPlaceholderType.doubleCurlie:
                    tag = this.getDoubleCurly();
                    break;
                case RedPlaceholderType.privateUse:
                    tag = this.getPrivateArea();
                    break;
                case RedPlaceholderType.hashtag:
                    tag = this.getHashtag();
                    break;
                case RedPlaceholderType.hashtagTriple:
                    tag = this.getTripleHashtag();
                    break;
                case RedPlaceholderType.tournament:
                    tag = this.getTournament();
                    break;
                case RedPlaceholderType.mvStyle:
                    tag = this.getMvStyle();
                    break;
                case RedPlaceholderType.mvStyleLetter:
                    tag = this.getMvStyleLetter();
                    break;
                case RedPlaceholderType.wolfStyle:
                    tag = this.getWolfStyle();
                    break;
                case RedPlaceholderType.percentage:
                    tag = this.getPercentage();
                    break;
                case RedPlaceholderType.sugoiTranslatorSpecial:
                    tag = this.getSugoiSpecial();
                    break;
                case RedPlaceholderType.sugoiTranslatorSpecial2:
                    tag = this.getSugoiSpecial2();
                    break;
            }
            // In case the symbol was already predefined, we cheat and generate another
            if (this.storedSymbols[tag.trim()] != undefined) {
                return this.storeSymbol(text);
            }
            else {
                this.storedSymbols[tag.trim()] = text;
                this.reverseSymbols[text] = tag.trim();
                return tag;
            }
        }
    }
    isExtracted() {
        return this.wasExtracted;
    }
    getExtractedStrings() {
        return this.extractedStrings;
    }
    break() {
        this.broken = true;
    }
    getTag() {
        return `<${this.symbolAffix++}${this.currentSymbol++}>`;
    }
    getClosedTag() {
        return `<${this.symbolAffix++}${this.currentSymbol++}/>`;
    }
    getFullTag() {
        let contents = `${this.symbolAffix++}${this.currentSymbol++}`;
        return `<${contents}></${contents}>`;
    }
    getPolePosition() {
        return `#${this.symbolAffix++}${this.currentSymbol++}`;
    }
    getMvStyle() {
        return `%${this.symbolAffix++}`;
    }
    getMvStyleLetter() {
        return `%${String.fromCharCode(this.curlyCount++)}`;
    }
    getWolfStyle() {
        return `@${this.symbolAffix++}`;
    }
    getHexPlaceholder() {
        return "0x" + (this.hexCounter++).toString(16);
    }
    getCurly() {
        return "{" + String.fromCharCode(this.curlyCount++) + "}";
    }
    getDoubleCurly() {
        return "{{" + String.fromCharCode(this.curlyCount++) + "}}";
    }
    getClosedNines() {
        return "9" +
            Array.from({ length: this.closedNinesLength }, () => Math.floor(Math.random() * 10).toString()).join("")
            + "9";
    }
    getPrivateArea() {
        return String.fromCodePoint(this.privateCounter++);
    }
    getHashtag() {
        return `#${String.fromCharCode(this.hashtagOne++)}`;
    }
    getTripleHashtag() {
        return `#${String.fromCharCode(this.hashtagOne++)}${String.fromCharCode(this.hashtagTwo++)}${String.fromCharCode(this.hashtagThree++)}`;
    }
    getTournament() {
        return `#${this.symbolAffix++}`;
    }
    getPercentage() {
        return `${this.symbolAffix++}%`;
    }
    getSugoiSpecial() {
        return `@#${this.symbolAffix++}`;
    }
    getSugoiSpecial2() {
        return `@#${String.fromCharCode(this.hashtagOne++)}`;
    }
    getOriginalText() {
        return this.text;
    }
    getReplacedText() {
        if (this.broken) {
            return "";
        }
        return this.currentText;
    }
    setTranslatedText(text) {
        this.currentText = text;
    }
    recoverSymbols() {
        if (this.broken) {
            return "";
        }
        // DEBUG
        //console.log(this.currentText, this.storedSymbols);
        // This needs to be done FIRST!!!!!!!!!!!!!!
        this.currentText = this.preString + this.currentText + this.postString;
        // Attempt to correct breaking of symbols
        switch (this.type) {
            case RedPlaceholderType.poleposition:
                this.currentText = this.currentText.replace(/(?<=#) *(?=[0-9]+)/gi, "");
                break;
            case RedPlaceholderType.tagPlaceholder:
                this.currentText = this.currentText.replace(/(?<=<) *(?=[A-Z0-9]+)/gi, "");
                this.currentText = this.currentText.replace(/(?<=<[A-Z0-9]+) *(?=>)/gi, "");
                break;
            case RedPlaceholderType.fullTagPlaceholder:
                this.currentText = this.currentText.replace(/(?<=<) *(?=[A-Z0-9]+)/gi, "");
                this.currentText = this.currentText.replace(/(?<=<[A-Z0-9]+) *(?=\/?>)/gi, "");
                break;
            case RedPlaceholderType.closedTagPlaceholder:
                this.currentText = this.currentText.replace(/(?<=<) *(?=[A-Z0-9]+)/gi, "");
                this.currentText = this.currentText.replace(/(?<=<[A-Z0-9]+) *(?=\/?>)/gi, "");
                break;
            case RedPlaceholderType.curlie:
                this.currentText = this.currentText.replace(/(?<={) *(?=[0-9A-Z]+)/gi, "");
                this.currentText = this.currentText.replace(/(?<={[0-9A-Z]+) *(?=})/gi, "");
                break;
            case RedPlaceholderType.doubleCurlie:
                this.currentText = this.currentText.replace(/(?<={{) *(?=[0-9A-Z]+)/gi, "");
                this.currentText = this.currentText.replace(/(?<={{[0-9A-Z]+) *(?=}})/gi, "");
                break;
            case RedPlaceholderType.hashtag:
                this.currentText = this.currentText.replace(/(?<=#) *(?=[A-Z]+)/gi, "");
                break;
            case RedPlaceholderType.hashtagTriple:
                this.currentText = this.currentText.replace(/(?<=#) *(?=[A-Z]+)/gi, "");
                break;
            case RedPlaceholderType.tournament:
                this.currentText = this.currentText.replace(/(?<=#) *(?=[0-9]+)/gi, "");
                break;
            case RedPlaceholderType.mvStyle:
                this.currentText = this.currentText.replace(/(?<=%) *(?=[0-9]+)/gi, "");
                break;
            case RedPlaceholderType.mvStyleLetter:
                this.currentText = this.currentText.replace(/(?<=%) *(?=[A-Z]+)/gi, "");
                break;
            case RedPlaceholderType.wolfStyle:
                this.currentText = this.currentText.replace(/(?<=@) *(?=[0-9A-Z]+)/gi, "");
                break;
            case RedPlaceholderType.percentage:
                this.currentText = this.currentText.replace(/(?<=[0-9A-Z]+) *(?=%)/gi, "");
                break;
            case RedPlaceholderType.sugoiTranslatorSpecial:
                this.currentText = this.currentText.replace(/(?<=@) *(?=#)/gi, "");
                this.currentText = this.currentText.replace(/(?<=#) *(?=[0-9A-Z]+)/gi, "");
                break;
            case RedPlaceholderType.sugoiTranslatorSpecial2:
                this.currentText = this.currentText.replace(/(?<=@) *(?=#)/gi, "");
                this.currentText = this.currentText.replace(/(?<=#) *(?=[0-9A-Z]+)/gi, "");
                break;
        }
        for (let i = 0; i < this.extractedStrings.length; i++) {
            this.storedSymbols[this.extractedKeys[i]] = this.extractedStrings[i].recoverSymbols();
        }
        // This is pretty fast to do, so we iterate until we're sure we got everything *just in case*
        // Worst case scenario this will be a single unnecessary run through anyway, and this allows us to possibly end up with nested symbols
        let found = true;
        while (found) {
            //console.warn("Recover loop");
            found = false;
            for (let key in this.storedSymbols) {
                if (this.storedSymbols[key] == key) {
                    // User has escaped the placeholder itself...
                    continue;
                }
                let idx = this.currentText.indexOf(key);
                while (idx != -1) {
                    found = true;
                    this.currentText = this.currentText.substring(0, idx) +
                        this.storedSymbols[key] +
                        this.currentText.substring(idx + key.length);
                    idx = this.currentText.indexOf(key);
                }
            }
        }
        // Sugoi fails and adds <unk> where it doesn't understand something
        // It turns people into pigs! Pigs!
        // let's remove those
        if (this.removeUnks) {
            this.currentText = this.currentText.replaceAll(/<unk>\\?"?/gi, "");
        }
        // DEBUG
        // console.log(finalString, this.storedSymbols);
        return this.currentText;
    }
    /**
     * Ideally we'd make something that works just the same as the hex placeholder, but I'm currently too drunk to analyze it
     * So I'll just make something that's hopefully similar enough to live through updates!
     */
    escape() {
        // Are we escaping?
        if (this.type == RedPlaceholderType.noEscape) {
            this.currentText = this.text;
            return this.text;
        }
        let formulas = RedStringEscaper.getActiveFormulas();
        let text = this.currentText || this.text;
        // If there's already something there we might end up in a loop...
        // Let's escape every existing symbol as is.
        if (regExpExists[this.type] != undefined) {
            text = text.replaceAll(regExpExists[this.type], (match) => {
                this.storedSymbols[match] = match;
                this.reverseSymbols[match] = match;
                return match;
            });
        }
        //console.log("Formulas : ", formulas);
        for (var i = 0; i < formulas.length; i++) {
            if (!Boolean(formulas[i]))
                continue;
            /**
             * Function should return a string or Array of strings
             */
            if (typeof formulas[i] == 'function') {
                //console.log(`formula ${i} is a function`);
                var arrayStrings = formulas[i].call(this, text);
                //console.log(`result`, arrayStrings);
                if (typeof arrayStrings == 'string')
                    arrayStrings = [arrayStrings];
                if (Array.isArray(arrayStrings) == false)
                    continue;
                for (var x in arrayStrings) {
                    text = text.replaceAll(arrayStrings[x], (match) => {
                        // Is this used for anything?
                        //var lastIndex = this.placeHolders.push(match)-1;
                        return this.storeSymbol(match);
                    });
                }
            }
            else {
                //console.log("replacing....");
                text = text.replaceAll(formulas[i], (match) => {
                    return this.storeSymbol(match);
                });
            }
        }
        // Just for fun, if we have symbols at the very start or the very end, don't even send them to the translator!
        // We end up missing some contextual clues that may help 
        //      (e.g. "\c[2] is annoying" would at least give them the context of "[symbol] is annoying", which could improve translations)
        //      without context information it'd probably translate to an end result of "[symbol] It is annoying" since it had no subject.
        // Safety vs Quality?
        // Results are VERY good when the symbols aren't actually part of the sentence, which escaped symbols at start or end most likely are.
        // replaceAll won't give us the exact position of what it's replacing and I don't like guessing, so instead I'll check manually.
        this.currentText = this.currentText.trim();
        let found = true;
        let loops = 0;
        while (found && this.splitEnds) {
            found = false;
            for (let tag in this.storedSymbols) {
                let idx = text.indexOf(tag);
                if (idx == 0) {
                    this.preString += tag; // Instead of doing the work right away, let's leave this because we might have nested symbols.
                    text = text.substring(tag.length); // replace was dangerous, so we do it old school
                    found = true;
                }
                else if (idx != -1 && (idx + tag.length) == text.length) {
                    // Everything we find after the first one will be coming before it, not after
                    this.postString = this.storedSymbols[tag] + this.postString;
                    text = text.substring(0, idx);
                    found = true;
                }
            }
            // Honestly if it happens this much we can be safe in knowing something in the text caused a loop.
            if (loops++ > 30) {
                console.warn("[RedStringEscaper] 陷入了困境。", text, this);
                break;
            }
        }
        // Replace sequential occurrences of Symbols with a single symbol!
        // TESTING THIS IS HELL ON EARTH SOMEONE PLEASE TEST THIS I DON'T HAVE GOOD SENTENCES TO TEST IT
        // Theoretically, this should result in less mangling of symbols as the translator is fed less of them to begin with
        if (this.mergeSymbols) {
            if (regExpObj[this.type] != undefined) {
                text = text.replaceAll(regExpObj[this.type], (match) => {
                    return this.storeSymbol(match);
                });
            }
        }
        this.currentText = text;
        //console.log("%cEscaped text", 'background: #222; color: #bada55');
        //console.log(text);
        return text;
    }
    static getActiveFormulas() {
        sys.config.escaperPatterns = sys.config.escaperPatterns || [];
        // Is our cache valid?
        if (RedStringEscaper.cachedFormulaString == JSON.stringify(sys.config.escaperPatterns)) {
            return RedStringEscaper.cachedFormulas;
        }
        // Update cache
        let formulas = [];
        for (var i in sys.config.escaperPatterns) {
            //console.log(`handling ${i}`, sys.config.escaperPatterns[i]);
            if (typeof sys.config.escaperPatterns[i] !== "object")
                continue;
            if (!sys.config.escaperPatterns[i].value)
                continue;
            try {
                var newReg;
                //console.log(sys.config.escaperPatterns[i].value);
                if (common.isRegExp(sys.config.escaperPatterns[i].value)) {
                    //console.log("is regex");
                    newReg = common.evalRegExpStr(sys.config.escaperPatterns[i].value);
                }
                else if (common.isStringFunction(sys.config.escaperPatterns[i].value)) {
                    //console.log("pattern ", i, "is function");
                    newReg = RedStringEscaper.renderFunction(sys.config.escaperPatterns[i].value);
                }
                else {
                    //console.log("Is string");
                    newReg = JSON.parse(sys.config.escaperPatterns[i].value);
                }
                if (newReg != undefined) {
                    formulas.push(newReg);
                }
            }
            catch (e) {
                console.warn("[RedStringEscaper] 试图呈现转义符模式时出错", sys.config.escaperPatterns[i], e);
            }
        }
        // Since sugoi only translates japanese, might as well remove anything else
        //formulas.push(/(^[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf])/g);
        RedStringEscaper.cachedFormulaString = JSON.stringify(sys.config.escaperPatterns);
        RedStringEscaper.cachedFormulas = formulas;
        return formulas;
    }
    static renderFunction(string) {
        try {
            var func = eval("[" + string + "]");
            return func[0];
        }
        catch (e) {
            console.error("[TAGPLACEHOLDER] 渲染函数时出错", e);
            return false;
        }
    }
}
RedStringEscaper.cachedFormulaString = "";
RedStringEscaper.cachedFormulas = [];
window.RedStringEscaper = RedStringEscaper;
class RedPersistentCacheHandler {
    constructor(id) {
        this.fs = require("fs");
        this.cache = {};
        this.changed = false;
        this.busy = false;
        this.maximumCacheHitsOnLoad = 10;
        this.transId = id;
    }
    addCache(key, translation) {
        this.cache[key] = [translation, 1];
        this.changed = true;
    }
    resetCache() {
        this.cache = {};
        this.changed = true;
    }
    hasCache(key) {
        return typeof this.cache[key] != "undefined";
    }
    getCache(key) {
        this.cache[key][1] += 1;
        return this.cache[key][0];
    }
    getFilename(bak) {
        return `${__dirname}/data/RedCache${this.transId}.json${bak === true ? ".bak" : ""}`;
    }
    loadCache(bak) {
        if (this.fs.existsSync(this.getFilename(bak === true))) {
            try {
                let rawdata = this.fs.readFileSync(this.getFilename(bak === true));
                this.cache = {};
                let arr = JSON.parse(rawdata);
                if (Array.isArray(arr)) {
                    for (let i = 0; i < arr.length; i++) {
                        this.cache[arr[i][0]] = [arr[i][1], arr[i][2] > this.maximumCacheHitsOnLoad ? this.maximumCacheHitsOnLoad : arr[i][2]];
                    }
                }
                else if (typeof arr == "object") {
                    // old version, code adapt
                    for (let key in arr) {
                        this.cache[key] = [arr[key], 1];
                    }
                }
                this.changed = false;
            }
            catch (e) {
                this.cache = {};
                console.error("[RedPersistentCacheHandler] 缓存加载错误" + this.transId + "。重置。", e);
                if (bak !== true) {
                    console.warn("[RedPersistentCacheHandler] 正在尝试加载的备份缓存" + this.transId + "。");
                    this.loadCache(true);
                }
            }
        }
        else {
            console.warn("[RedPersistentCacheHandler] 找不到的缓存" + this.transId + "。");
            if (bak !== true) {
                console.warn("[RedPersistentCacheHandler] 正在尝试加载的备份缓存" + this.transId + "。");
                this.loadCache(true);
            }
        }
    }
    saveCache() {
        if (!this.changed) {
            console.warn("[RedPersistentCacheHandler] 没有保存缓存，因为没有任何更改。");
            return;
        }
        let arr = [];
        let maxSize = trans[this.transId].getOptions().persistentCacheMaxSize * 1024 * 1024;
        let size = 0;
        for (let key in this.cache) {
            arr.push([key, this.cache[key][0], this.cache[key][1]]);
            size += this.getSize(`"${key}":["${this.cache[key][0]}", ${this.cache[key][1]}`);
        }
        arr.sort((a, b) => {
            return b[2] - a[2];
        });
        while (size > maxSize && arr.length > 0) {
            let pop = arr.pop();
            size -= this.getSize(`"${pop[0]}":["${pop[1]}", ${pop[2]}`);
        }
        try {
            let write = () => {
                try {
                    this.fs.renameSync(this.getFilename(), this.getFilename(true));
                }
                catch (e) {
                    console.warn("[RedPersistentCacheHandler] 无法创建备份。文件不在吗？", e);
                }
                this.fs.writeFile(this.getFilename(), JSON.stringify(arr, undefined, 1), (err) => {
                    this.busy = false;
                    if (err) {
                        console.error(err);
                    }
                    else {
                        console.log("[RedPersistentCacheHandler] 已成功保存缓存。");
                    }
                    let next = this.next;
                    if (typeof next == "function") {
                        this.next = undefined;
                        next();
                    }
                    else {
                        this.busy = false;
                    }
                });
            };
            if (this.busy) {
                this.next = write;
            }
            else {
                this.busy = true;
                write();
            }
        }
        catch (e) {
            console.error("[RedPersistentCacheHandler] 无法为保存缓存" + this.transId + "。", e);
        }
    }
    getSize(cache) {
        //return (new TextEncoder().encode(cache)).length;
        return cache.length * 2; // it was too slow, we will assume: HALF IS JAPANESE HALF IS ENGLISH SO 2 BYTES PER CHARACTER, probably still a bit pessimistic, which is good enough of an approximation
    }
}
/// <reference path="RedStringEscaper.ts" />
/// <reference path="RedPersistentCacheHandler.ts" />
const defaultLineStart = `((?:\\r?\\n|^) *　*[◎▲▼▽■□●○★☆♥♡♪＿＊－＝＋＃＄―※〇〔〖〘〚〝｢〈《「『【（［\\[\\({＜<｛｟"'>\\/\\\\]+)`;
const defaultLineEnd = `([\\]\\)}〕〗〙〛〞”｣〉》」』】）］＞>｝｠〟⟩！？。・…‥：；"'.?!;:]+ *　*(?:$|\\r*\\n))`;
const defaultParagraphBreak = `( *　*\\r?\\n(?:\\r?\\n)+ *　*)`;
const openerRegExp = `〔〖〘〚〝｢〈《「『【（［\\[\\({＜<｛｟"'`;
const closerRegExp = `\\]\\)}〕〗〙〛〞”｣〉》」』】）］＞>｝｠〟⟩"'`;
const rmColorRegExp = `\\\\C\\[.+?\\]`;
const mvScript = `\\\\*[V]+`;
// RegExp:  not lookbehind: mvScript
//          lookbehind: opener or rmColor
//          match: anything that's not opener nor closer
//          lookahead: closer or rmColor
// Result: look for anything that's not opener or closer that is inside opener or closer and not inside an MVScript
const defaultIsolateRegexp = `(` +
    `(?<!` +
    `${mvScript}` +
    `)` +
    `[${openerRegExp}]([^${openerRegExp + closerRegExp}])+[${closerRegExp}]` +
    `)|(` +
    `${rmColorRegExp}.+?${rmColorRegExp}` +
    `)`;
/**
 * Ideally this would just be a class extension but I don't want to play with EcmaScript 3
 */
class RedTranslatorEngineWrapper {
    constructor(thisAddon, extraOptions, extraSchema, extraForm) {
        this.urls = [];
        this.urlUsage = [];
        this.urlScore = [];
        this.allowTranslation = true;
        this.paused = false;
        this.waiting = [];
        this.cacheHits = 0;
        this.translatorEngine = new TranslatorEngine({
            author: thisAddon.package.author.name,
            version: thisAddon.package.version,
            ...extraOptions,
            splitEnds: true,
            useCache: true,
            usePersistentCache: true,
            persistentCacheMaxSize: 10,
            detectStrings: true,
            mergeSymbols: true,
            isolateSymbols: true,
            rowStart: defaultLineStart,
            rowEnd: defaultLineEnd,
            isolateRegExp: defaultIsolateRegexp,
            optionsForm: {
                "schema": {
                    "splitEnds": {
                        "type": "boolean",
                        "title": "分叉",
                        "description": "句子角落处的转义符号不会发送给译者。当这些符号没有意义时（例如，转义括号、句子之外的东西），这将大大提高翻译质量。对于大多数消息，建议打开；对于RPG Maker MV vocab，建议关闭。",
                        "default": true
                    },
                    "isolateSymbols": {
                        "type": "boolean",
                        "title": "隔离符号",
                        "description": "转义并隔离括号/引号等中包含的文本。这有助于保持重复术语的一致性。“建议”处于启用状态，但请检查RegExp是否会转义引擎使用的任何变量调用。",
                        "default": true
                    },
                    "useCache": {
                        "type": "boolean",
                        "title": "使用缓存",
                        "description": "将每个翻译器响应缓存到内存中，这样工作就不会重复。这样做没有坏处。“推荐”已打开。",
                        "default": true
                    },
                    "usePersistentCache": {
                        "type": "boolean",
                        "title": "使用持久缓存",
                        "description": "在翻译之间将缓存保存到磁盘。这样做没有坏处。“推荐”已打开。",
                        "default": true
                    },
                    "persistentCacheMaxSize": {
                        "type": "number",
                        "title": "持久缓存最大大小",
                        "description": "内存中和持久缓存的最大大小（以MB为单位）。一场中等长度的比赛大约需要3MB。这可以是你想要的大小——只要记住磁盘/内存的使用。",
                        "default": 10,
                        "required": true
                    },
                    "detectStrings": {
                        "type": "boolean",
                        "title": "文本字符串检测",
                        "description": "尝试检测并更正文字字符串（用引号括起来的文本）。因为大多数引擎都不使用有效的JSON，所以这是非常基本的，只需确保引号仍然在它们应该在的地方，并且任何内部引号都被正确转义。其他的事情都留给上帝去解决。",
                        "default": true
                    },
                    "mergeSymbols": {
                        "type": "boolean",
                        "title": "合并转义符号",
                        "description": "如果有两个连续的转义符号，它们将转义为一个符号。这样做没有坏处。“推荐”已打开。",
                        "default": true
                    },
                    ...extraSchema,
                    "rowStart": {
                        "type": "string",
                        "title": "线路启动检测",
                        "description": "文本处理器使用此正则表达式来检测新行。不建议更改此值。",
                        "default": defaultLineStart,
                        "required": true
                    },
                    "rowEnd": {
                        "type": "string",
                        "title": "线路端点检测",
                        "description": "文本处理器使用此正则表达式来检测行的结束位置。不建议更改此值。",
                        "default": defaultLineEnd,
                        "required": true
                    },
                    "isolateRegExp": {
                        "type": "string",
                        "title": "隔离符号",
                        "description": "该正则表达式用于检测符号并将其分离以进行单独翻译。不建议更改此值。",
                        "default": defaultIsolateRegexp,
                        "required": true
                    },
                },
                "form": [
                    {
                        "key": "escapeAlgorithm",
                        "titleMap": escapingTitleMap,
                        "onChange": (evt) => {
                            var value = $(evt.target).val();
                            this.translatorEngine.update("escapeAlgorithm", value);
                        }
                    },
                    {
                        "key": "splitEnds",
                        "inlinetitle": "走捷径",
                        "onChange": (evt) => {
                            var value = $(evt.target).prop("checked");
                            this.translatorEngine.update("splitEnds", value);
                        }
                    },
                    {
                        "key": "useCache",
                        "inlinetitle": "使用缓存",
                        "onChange": (evt) => {
                            var value = $(evt.target).prop("checked");
                            this.translatorEngine.update("useCache", value);
                        }
                    },
                    {
                        "key": "usePersistentCache",
                        "inlinetitle": "使用持久缓存",
                        "onChange": (evt) => {
                            var value = $(evt.target).prop("checked");
                            this.translatorEngine.update("usePersistentCache", value);
                        }
                    },
                    {
                        "key": "persistentCacheMaxSize",
                        "onChange": (evt) => {
                            var value = $(evt.target).val();
                            this.translatorEngine.update("persistentCacheMaxSize", parseFloat(value));
                        }
                    },
                    {
                        "key": "detectStrings",
                        "inlinetitle": "文本字符串检测",
                        "onChange": (evt) => {
                            var value = $(evt.target).prop("checked");
                            this.translatorEngine.update("detectStrings", value);
                        }
                    },
                    {
                        "key": "mergeSymbols",
                        "inlinetitle": "合并转义符号",
                        "onChange": (evt) => {
                            var value = $(evt.target).prop("checked");
                            this.translatorEngine.update("detectStrings", value);
                        }
                    },
                    {
                        "key": "isolateSymbols",
                        "inlinetitle": "隔离符号",
                        "onChange": (evt) => {
                            var value = $(evt.target).prop("checked");
                            this.translatorEngine.update("isolateSymbols", value);
                        }
                    },
                    ...extraForm,
                    {
                        "key": "rowStart",
                        "onChange": (evt) => {
                            var value = $(evt.target).val();
                            this.translatorEngine.update("rowStart", value);
                        }
                    },
                    {
                        "key": "rowEnd",
                        "onChange": (evt) => {
                            var value = $(evt.target).val();
                            this.translatorEngine.update("rowEnd", value);
                        }
                    },
                    {
                        "key": "isolateRegExp",
                        "onChange": (evt) => {
                            var value = $(evt.target).val();
                            this.translatorEngine.update("isolateRegExp", value);
                        }
                    },
                    {
                        "type": "actions",
                        "title": "重置正则表达式",
                        "fieldHtmlClass": "actionButtonSet",
                        "items": [
                            {
                                "type": "button",
                                "title": "将regexp重置为其默认值",
                                "onClick": (evt) => {
                                    try {
                                        window.clicked = evt;
                                        var optionWindow = $((evt.target).parentNode.parentNode);
                                        let engine = this.getEngine();
                                        optionWindow.find(`[name="rowStart"]`).val(defaultLineStart);
                                        optionWindow.find(`[name="rowEnd"]`).val(defaultLineEnd);
                                        optionWindow.find(`[name="isolateRegExp"]`).val(defaultIsolateRegexp);
                                        engine.update("isolateRegExp", defaultIsolateRegexp);
                                        engine.update("rowStart", defaultLineStart);
                                        engine.update("rowEnd", defaultLineEnd);
                                    }
                                    catch (e) {
                                        alert("失败！" + e.message);
                                    }
                                }
                            },
                            {
                                "type": "button",
                                "title": "空缓存（如果翻译器更新为更好的翻译，请使用）",
                                "onClick": () => {
                                    this.cacheHandler.resetCache();
                                    this.cacheHandler.saveCache();
                                }
                            }
                        ]
                    },
                ]
            }
        });
        this.translatorEngine.translate = (text, options) => {
            this.translate(text, options);
        };
        this.translatorEngine.abort = () => {
            this.abort();
        };
        this.translatorEngine.pause = () => {
            this.pause();
        };
        this.translatorEngine.resume = () => {
            this.resume();
        };
        this.cacheHandler = new RedPersistentCacheHandler(extraOptions.id);
        this.cacheHandler.loadCache();
    }
    getEngine() {
        return this.translatorEngine;
    }
    abort() {
        this.allowTranslation = false;
        this.waiting = [];
        this.paused = false;
    }
    pause() {
        this.paused = true;
    }
    resume(reset) {
        this.paused = false;
        if (reset == true) {
            this.waiting = [];
        }
        else {
            this.waiting.forEach(callback => {
                callback();
            });
            this.waiting = [];
        }
    }
    isCaching() {
        let useCache = this.getEngine().getOptions().useCache;
        return useCache == undefined ? true : useCache == true;
    }
    isKeepingScripts() {
        let detectStrings = this.getEngine().getOptions().detectStrings;
        return detectStrings == undefined ? true : detectStrings == true;
    }
    isMergingSymbols() {
        let mergeSymbols = this.getEngine().getOptions().mergeSymbols;
        return mergeSymbols == undefined ? true : mergeSymbols == true;
    }
    isPersistentCaching() {
        let usePersistentCache = this.getEngine().getOptions().usePersistentCache;
        return usePersistentCache == undefined ? true : usePersistentCache == true;
    }
    hasCache(text) {
        return this.cacheHandler.hasCache(text);
    }
    getCache(text) {
        this.cacheHits++;
        return this.cacheHandler.getCache(text);
    }
    setCache(text, translation) {
        this.cacheHandler.addCache(text, translation);
    }
    getCacheHits() {
        return this.cacheHits;
    }
    resetCacheHits() {
        this.cacheHits = 0;
    }
    getRowStart() {
        let option = this.getEngine().getOptions().rowStart;
        if (typeof option == "undefined") {
            return this.getEngine().rowStart;
        }
        else {
            return option;
        }
    }
    getRowEnd() {
        let option = this.getEngine().getOptions().rowEnd;
        if (typeof option == "undefined") {
            return this.getEngine().rowEnd;
        }
        else {
            return option;
        }
    }
    breakRow(text) {
        // now we need to prepare the stuff we'll send over to Sugoi.
        // Some games might have rolling text which is far too big to translate at once. This kills the sugoi.
        // probably the best way to detect those is through blank lines.
        // Might be a good idea to also split if new lines start with something that we're escaping
        // First Step = "Break if you find one or more empty lines"
        let lines = text.split(new RegExp(defaultParagraphBreak));
        // Second Step = "Break if a line ends with something that finishes a sentence"
        for (let i = lines.length - 1; i >= 0; i--) {
            let line = lines[i];
            //let split = line.split(/([｝）］】」』〟⟩！？。・…‥："'\.\?\!;:]+ *　*\r?\n)/);
            //let split = line.split(/([〕〗〙〛〞”｣〉》」』】）］＞｝｠〟⟩！？。・…‥：；"'\.\?\!;:]+ *　*\r?\n)/); //Fantom#9835's list, ty
            let split = line.split(new RegExp(this.getRowEnd()));
            // We need to give back the end of the sentence so that it translates correctly
            for (let k = 0; k < split.length - 1; k++) {
                split[k] += split[k + 1];
                split.splice(k + 1, 1);
            }
            lines.splice(i, 1, ...split);
        }
        // Third step = "Break if a line starts with something that initiates a sentence"
        for (let i = lines.length - 1; i >= 0; i--) {
            let line = lines[i];
            //let split = line.split(/((?:^|(?:\r?\n))+ *　*[｛（［【「『〝⟨「"'>\\\/]+)/);
            //let split = line.split(/((?:^|(?:\r?\n))+ *　*[◎▲▼▽■□●○★☆♥♡♪＿＊－＝＋＃＄―※〇〔〖〘〚〝｢〈《「『【（［＜｛｟"'>\\\/]+)/); //Fantom#9835's list, ty
            let split = line.split(new RegExp(this.getRowStart()));
            // We need to give back the start of the sentence so that it translates correctly
            for (let k = 1; k < split.length - 1; k++) {
                split[k] += split[k + 1];
                split.splice(k + 1, 1);
            }
            // check for empty lines...
            for (let k = split.length - 1; k >= 0; k--) {
                if (split[k].trim() == "") {
                    split.splice(k, 1);
                }
            }
            lines.splice(i, 1, ...split);
        }
        return lines;
    }
    isScript(brokenRow) {
        let quoteType = "";
        if (this.isKeepingScripts() && brokenRow.length == 1) {
            let trimmed = brokenRow[0].trim();
            if (["'", '"'].indexOf(trimmed.charAt(0)) != -1 &&
                trimmed.charAt(0) == trimmed.charAt(trimmed.length - 1)) {
                quoteType = trimmed.charAt(0);
                trimmed = trimmed.substring(1, trimmed.length - 1);
                let innerString = trimmed; // It's never valid JSON. never.
                return {
                    isScript: true,
                    quoteType: quoteType,
                    newLine: innerString
                };
            }
        }
        return { isScript: false };
    }
    curateRow(row) {
        let escapingType = this.getEngine().getOptions().escapeAlgorithm || RedPlaceholderType.poleposition;
        let splitEnds = this.getEngine().getOptions().splitEnds;
        splitEnds = splitEnds == undefined ? true : splitEnds === true; // set to true if undefined, check against true if not
        let mergeSymbols = this.isMergingSymbols();
        let isolateSymbols = this.getEngine().getOptions().isolateSymbols;
        isolateSymbols = isolateSymbols == undefined ? true : isolateSymbols === true; // set to true if undefined, check against true if not
        let isolateRegExp = this.getEngine().getOptions().isolateRegExp;
        isolateRegExp = isolateRegExp == undefined ? defaultIsolateRegexp : isolateRegExp;
        let lines = this.breakRow(row);
        let scriptCheck = this.isScript(lines);
        if (scriptCheck.isScript) {
            lines = this.breakRow(scriptCheck.newLine);
        }
        let curated = [];
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            let escaped = new RedStringEscaper(line, {
                type: escapingType,
                splitEnds: splitEnds,
                mergeSymbols: mergeSymbols,
                noUnks: true,
                isolateSymbols: isolateSymbols,
                isolateRegExp: isolateRegExp,
            });
            curated.push(escaped);
        }
        return { scriptCheck: scriptCheck,
            lines: curated };
    }
    translate(rows, options) {
        let batchStart = new Date().getTime();
        options = options || {};
        options.onAfterLoading = options.onAfterLoading || function () { };
        options.onError = options.onError || function () { };
        options.always = options.always || function () { };
        options.progress = options.progress || function (perc) { };
        if (document.getElementById("loadingOverlay").classList.contains("hidden")) {
            ui.showBusyOverlay();
        }
        // Unpause if paused
        this.resume(true);
        this.allowTranslation = true;
        // Set up T++ result object
        let result = {
            'sourceText': rows.join(),
            'translationText': "",
            'source': rows,
            'translation': []
        };
        // First step: curate every single line and keep track of it
        let rowHandlers = [];
        let toTranslateOr = [];
        let toTranslate = [];
        let toTranslateIndex = [];
        for (let i = 0; i < rows.length; i++) {
            let handler = new RedStringRowHandler(rows[i], this);
            rowHandlers.push(handler);
            // Second step: separate every line that will need to be translated
            toTranslateOr.push(...handler.getTranslatableLines());
        }
        // Remove all duplicates
        for (let i = 0; i < toTranslateOr.length; i++) {
            let idx = toTranslate.indexOf(toTranslateOr[i]);
            if (idx == -1) {
                toTranslate.push(toTranslateOr[i]);
                toTranslateIndex.push([i]);
            }
            else {
                // We are already translating this line. Add this to the index.
                toTranslateIndex[idx].push(i);
            }
        }
        // Third step: send translatable lines to the translator handler
        let translation = this.doTranslate(toTranslate, options);
        // After receiving...
        translation.then((translationsNoDupes) => {
            // Recreate translations with duplicates so our old indexes work
            let translations = new Array(toTranslateOr.length);
            for (let i = 0; i < translationsNoDupes.length; i++) {
                for (let k = 0; k < toTranslateIndex[i].length; k++) {
                    translations[toTranslateIndex[i][k]] = translationsNoDupes[i];
                }
            }
            if (translationsNoDupes.length != translations.length) {
                this.log(`[RedTranslatorEngine] 避免翻译 ${translations.length - translationsNoDupes.length} 重复字符串。`);
            }
            // Fourth step: return translations to each object
            let curatedIndex = 0;
            let internalIndex = 0;
            let finalTranslations = [];
            let curated = rowHandlers[curatedIndex];
            // Move through translations
            let moveRows = () => {
                while (curated != undefined && curated.isDone(internalIndex)) {
                    curated.applyTranslation();
                    finalTranslations.push(curated.getTranslatedRow());
                    internalIndex = 0;
                    curated = rowHandlers[++curatedIndex];
                }
            };
            // Check for empty rows
            moveRows();
            // Move through translations
            for (let outerIndex = 0; outerIndex < translations.length; outerIndex++) {
                let translation = translations[outerIndex];
                curated = rowHandlers[curatedIndex];
                // Move through lines
                curated.insertTranslation(translation, internalIndex++);
                // Move through rows
                moveRows();
            }
            // Final step: set up result object
            result.translation = finalTranslations;
            result.translationText = finalTranslations.join("\n");
            setTimeout(() => {
                options.onAfterLoading.call(this.translatorEngine, result);
            }, 150);
        }).catch((reason) => {
            console.error("[RedTranslatorEngine] 好狗屎。", reason);
            this.error("[RedTranslatorEngine] 错误：", reason);
        }).finally(() => {
            let batchEnd = new Date().getTime();
            let seconds = Math.round((batchEnd - batchStart) / 100) / 10;
            this.log(`[RedTranslatorEngine] 批处理时间：${seconds} 秒，大约${Math.round(10 * result.sourceText.length / seconds) / 10} 每秒字符数！`);
            this.log(`[RedTranslatorEngine] 翻译 ${rows.length} 行 (${Math.round(10 * rows.length / seconds) / 10} 每秒行数).`);
            let hits = this.getCacheHits();
            this.resetCacheHits();
            if (hits > 0) {
                this.log(`[RedTranslatorEngine] 跳过 ${hits} 通过缓存点击进行翻译！`);
            }
            if (document.getElementById("loadingOverlay").classList.contains("hidden")) {
                ui.hideBusyOverlay();
            }
            if (this.isPersistentCaching()) {
                this.log("[RedTranslatorEngine] 将翻译缓存保存到文件。");
                this.cacheHandler.saveCache();
            }
            options.always();
        });
    }
    log(...texts) {
        let elements = [];
        texts.forEach(text => {
            elements.push(document.createTextNode(text));
        });
        this.print(...elements);
    }
    error(...texts) {
        let elements = [];
        texts.forEach(text => {
            elements.push(document.createTextNode(text));
        });
        this.printError(...elements);
    }
    print(...elements) {
        let consoleWindow = $("#loadingOverlay .console")[0];
        let pre = document.createElement("pre");
        pre.style.whiteSpace = "pre-wrap";
        elements.forEach(element => {
            pre.appendChild(element);
        });
        consoleWindow.appendChild(pre);
    }
    printError(...elements) {
        let consoleWindow = $("#loadingOverlay .console")[0];
        let pre = document.createElement("pre");
        pre.style.color = "red";
        pre.style.fontWeight = "bold";
        pre.style.whiteSpace = "pre-wrap";
        elements.forEach(element => {
            pre.appendChild(element);
        });
        consoleWindow.appendChild(pre);
    }
    isValidHttpUrl(urlString) {
        let url;
        try {
            url = new URL(urlString);
        }
        catch (_) {
            return false;
        }
        return url.protocol === "http:" || url.protocol === "https:";
    }
}
/// <reference path="RedTranslatorEngine.ts" />
/// <reference path="RedStringEscaper.ts" />
class RedSugoiEngine extends RedTranslatorEngineWrapper {
    /**
     * Updates URL array and picks the one with the least connections
     * @returns string
     */
    getUrl() {
        this.updateUrls();
        let idx = this.urlUsage.indexOf(Math.min(...this.urlUsage));
        this.urlUsage[idx]++;
        this.urlScore[idx]++;
        return this.urls[idx];
    }
    reduceScore(url) {
        let idx = this.urls.indexOf(url);
        if (idx != -1) {
            this.urlScore[idx]--; // shame on you little server.
        }
    }
    updateUrls() {
        let thisEngine = this.translatorEngine;
        let urls = thisEngine.targetUrl.replaceAll("\r", "").split("\n");
        if (this.urls.length != urls.length) {
            this.urls = [...urls];
            // Some users might forget the final slash, let's fix that. Might as well make sure it's nice and trimmed while at it.
            for (let i = 0; i < this.urls.length; i++) {
                this.urls[i] = this.urls[i].trim();
                if (this.urls[i].charAt(this.urls[i].length - 1) != "/") {
                    this.urls[i] += "/";
                }
            }
            this.urlUsage = new Array(urls.length).fill(0);
            this.urlScore = new Array(urls.length).fill(0);
        }
    }
    getUrlCount() {
        if (this.urls.length == 0) {
            this.updateUrls();
        }
        return this.urls.length;
    }
    freeUrl(url) {
        this.urlUsage[this.urls.indexOf(url)]--;
    }
    resetScores() {
        this.urlScore = new Array(this.urls.length).fill(0);
    }
    // Goals of refactor:
    // Split rows evenly between servers in single requests that respect maximum simultaneous translations.
    doTranslate(toTranslate, options) {
        this.resetScores();
        console.log("[REDSUGOI] TRANSLATE:\n", toTranslate, options);
        let translating = 0;
        let translations = [];
        // Set up progress
        let consoleWindow = $("#loadingOverlay .console")[0];
        let progressTotal = document.createTextNode("/" + toTranslate.length.toString());
        let pre = document.createElement("pre");
        let progressNode = document.createTextNode("0");
        pre.appendChild(document.createTextNode("[RedSugoi] 翻译当前批次："));
        pre.appendChild(progressNode);
        pre.appendChild(progressTotal);
        let crashDetector = document.createTextNode("");
        let spinny = "/-\\|/-\\|";
        let spinnyi = 0;
        pre.appendChild(crashDetector);
        consoleWindow.appendChild(pre);
        let translatedLines = 0;
        let spinnyInterval = setInterval(() => {
            spinnyi = (spinnyi + 1) % spinny.length;
            crashDetector.nodeValue = " " + spinny.charAt(spinnyi);
        }, 100);
        console.log("[RedSugoi] Translations to send:", toTranslate);
        let updateProgress = () => {
            // A filthy hack for a filthy code
            progressNode.nodeValue = (translatedLines).toString();
            progressTotal.nodeValue = "/" + toTranslate.length.toString();
            options.progress(Math.round(100 * translatedLines / toTranslate.length));
        };
        let maximumPayload = this.getEngine().getOptions().maxParallelJob || 5;
        let threads = this.getEngine().getOptions().threads || 1;
        let completedThreads = 0;
        // I don't know why we didn't do this
        // Maybe I have brain damage
        this.updateUrls();
        let totalThreads = this.getUrlCount() * threads;
        let complete;
        // Third step: perform translations
        let doTranslate = (onSuccess, onError) => {
            if (!this.allowTranslation || this.paused) {
                return this.waiting.push(() => {
                    doTranslate(onSuccess, onError);
                });
            }
            if (translating >= toTranslate.length) {
                console.log("[RedSugoi] Thread has no more work to do.");
                complete(onSuccess, onError);
            }
            else {
                console.log("[RedSugoi] Thread Starting Work.");
                let myLines = [];
                let myStart = translating;
                translating = myStart + maximumPayload;
                for (let i = myStart; i < toTranslate.length; i++) {
                    myLines.push(toTranslate[i]);
                    if (myLines.length >= maximumPayload) {
                        break;
                    }
                }
                let myServer = this.getUrl();
                console.log("[RedSugoi] Fetching from " + myServer + ". Payload:" + myLines.length.toString());
                fetch(myServer, {
                    method: 'post',
                    body: JSON.stringify({ content: myLines, message: "翻译句子" }),
                    headers: { 'Content-Type': 'application/json' },
                })
                    .then(async (response) => {
                    if (response.ok) {
                        let result = await response.json();
                        console.log("[RedSugoi] Fetched from " + myServer + ". Received:" + result.length.toString());
                        if (result.length != myLines.length) {
                            console.error("[REDSUGOI] 响应不匹配：", myLines, result);
                            throw new Error(`收到无效响应-长度不匹配，请检查服务器稳定性。`);
                        }
                        for (let i = 0; i < result.length; i++) {
                            translations[i + myStart] = result[i];
                            if (this.isCaching()) {
                                this.setCache(myLines[i], result[i]);
                            }
                        }
                        translatedLines += myLines.length;
                    }
                    else {
                        throw new Error(`${response.status.toString()} - ${response.statusText}`);
                    }
                })
                    .catch((error) => {
                    console.error("[REDSUGOI] 使用获取时出错" + myServer, "   有效载荷：" + myLines.join("\n"), error);
                    let pre = document.createElement("pre");
                    pre.style.color = "red";
                    pre.style.fontWeight = "bold";
                    pre.appendChild(document.createTextNode(`[RedSugoi] 从中提取时出错 ${myServer} - ${error.name}: ${error.message}\n${' '.repeat(11)}如果此服务器上的所有获取尝试都失败，请检查它是否仍在运行。`));
                    this.reduceScore(myServer);
                    consoleWindow.appendChild(pre);
                })
                    .finally(() => {
                    this.freeUrl(myServer);
                    updateProgress();
                    doTranslate(onSuccess, onError);
                });
            }
        };
        complete = (onSuccess, onError) => {
            if (++completedThreads == totalThreads) {
                crashDetector.nodeValue = "";
                clearInterval(spinnyInterval);
                // return the object
                onSuccess(translations);
                // Update progress
                let pre = document.createElement("pre");
                pre.appendChild(document.createTextNode("[RedSugoi] 批翻译！最好的服务器是："));
                let servers = [...this.urls];
                servers.sort((a, b) => {
                    return this.urlScore[this.urls.indexOf(b)] - this.urlScore[this.urls.indexOf(a)];
                });
                for (let i = 0; i < servers.length; i++) {
                    pre.appendChild(document.createTextNode(`\n[RedSugoi] #${i + 1} - ${servers[i]} (${this.urlScore[this.urls.indexOf(servers[i])]} translations)`));
                }
                consoleWindow.appendChild(pre);
            }
        };
        return new Promise((onSuccess, onError) => {
            for (let i = 0; i < totalThreads; i++) {
                doTranslate(onSuccess, onError);
            }
        });
    }
    constructor(thisAddon) {
        super(thisAddon, {
            id: "redsugoi",
            name: "Red Sugoi翻译",
            targetUrl: "http://localhost:14366/",
            languages: {
                "en": "English",
                "ja": "Japanese"
            },
            description: thisAddon.package.description,
            batchDelay: 1,
            skipReferencePair: true,
            lineDelimiter: "<br>",
            mode: "rowByRow",
            maxRequestLength: 400 * 10,
            maxParallelJob: 20,
            threads: 10,
            escapeAlgorithm: RedPlaceholderType.poleposition,
        }, {
            "targetUrl": {
                "type": "string",
                "title": "目标URL(s)",
                "description": "Sugoi翻译程序目标URL。如果你有多台服务器，你可以在每一行放一台。重要提示：默认的Sugoi Translator插件不会更新此信息！你需要单独设置它！",
                "default": "http://localhost:14366/",
                "required": true
            },
            "maxParallelJob": {
                "type": "number",
                "title": "最大并行作业数",
                "description": "这个数字越高，翻译速度就越快，但需要更多的RAM/VRAM。最好的数字是你可以不出错的最高数字。",
                "default": 20,
                "required": true
            },
            "maxRequestLength": {
                "type": "number",
                "title": "批量大小",
                "description": "批量翻译时每个批次的长度（以字符为单位）。",
                "default": 400 * 10,
                "required": true
            },
            "threads": {
                "type": "number",
                "title": "线程",
                "description": "同时发送到服务器的请求量。增加这个数字可以减少批次之间的空闲时间。这个数字太大似乎没有什么坏处——服务器一次不会处理多个请求，文本的内存消耗也很小。",
                "default": 10,
                "required": true
            },
            "escapeAlgorithm": {
                "type": "string",
                "title": "代码转义算法",
                "description": "用于自定义转义器模式的转义算法。对于Sugoi Translator，建议使用Poleposition占位符，该占位符将符号替换为紧跟短数字的标签。MV风格和Wolf风格似乎也有一定的一致性（MV风格比Wolf风格更一致）。没有什么特别的原因，他们只是似乎打破了最少。",
                "default": RedPlaceholderType.poleposition,
                "required": false,
                // @ts-ignore shhh it's fine don't worry bb
                "enum": RedPlaceholderTypeArray
            },
        }, [
            {
                "key": "targetUrl",
                "type": "textarea",
                "onChange": (evt) => {
                    var value = $(evt.target).val();
                    var urls = value.replaceAll("\r", "").split("\n");
                    var validUrls = [];
                    for (var i in urls) {
                        if (!this.isValidHttpUrl(urls[i]))
                            continue;
                        validUrls.push(urls[i]);
                    }
                    this.translatorEngine.update("targetUrl", validUrls.join("\n"));
                    $(evt.target).val(validUrls.join("\n"));
                }
            },
            {
                "type": "actions",
                "title": "本地服务器管理器",
                "fieldHtmlClass": "actionButtonSet",
                "items": [
                    {
                        "type": "button",
                        "title": "开放式服务器管理器",
                        "onClick": function () {
                            try {
                                trans.sugoitrans.openServerManager();
                            }
                            catch (e) {
                                alert("这需要Dreamsavior提供最新的Sugoi翻译插件，这只是一条捷径。对不起，小家伙。");
                            }
                        }
                    },
                    {
                        "type": "button",
                        "title": "复制Sugoi Trans服务器值",
                        "onClick": (evt) => {
                            try {
                                window.clicked = evt;
                                var optionWindow = $((evt.target).parentNode.parentNode);
                                let engine = this.getEngine();
                                optionWindow.find(`[name="targetUrl"]`).val(trans.sugoitrans.targetUrl);
                                engine.update("targetUrl", trans.sugoitrans.targetUrl);
                            }
                            catch (e) {
                                alert("这需要Dreamsavior提供最新的Sugoi翻译插件，这只是一条捷径。对不起，小家伙。");
                            }
                        }
                    }
                ]
            },
            {
                "key": "maxParallelJob",
                "onChange": (evt) => {
                    var value = $(evt.target).val();
                    this.translatorEngine.update("maxParallelJob", parseInt(value));
                }
            },
            {
                "key": "maxRequestLength",
                "onChange": (evt) => {
                    var value = $(evt.target).val();
                    this.translatorEngine.update("maxRequestLength", parseInt(value));
                }
            },
            {
                "key": "threads",
                "onChange": (evt) => {
                    var value = $(evt.target).val();
                    this.translatorEngine.update("threads", parseInt(value));
                }
            },
        ]);
    }
}
/// <reference path="RedTranslatorEngine.ts" />
class RedGoogleEngine extends RedTranslatorEngineWrapper {
    constructor(thisAddon) {
        super(thisAddon, {
            id: "redgoogles",
            name: "Red Google翻译",
            languages: {
                "af": "Afrikaans", "sq": "Albanian", "am": "Amharic", "ar": "Arabic", "hy": "Armenian", "az": "Azerbaijani", "eu": "Basque", "be": "Belarusian", "bn": "Bengali", "bs": "Bosnian", "bg": "Bulgarian", "ca": "Catalan", "ceb": "Cebuano", "zh-CN": "Chinese (Simplified)", "zh-TW": "Chinese (Traditional)", "co": "Corsican", "hr": "Croatian", "cs": "Czech", "da": "Danish", "nl": "Dutch", "en": "English", "eo": "Esperanto", "et": "Estonian", "fi": "Finnish", "fr": "French", "fy": "Frisian", "gl": "Galician", "ka": "Georgian", "de": "German", "el": "Greek", "gu": "Gujarati", "ht": "Haitian Creole", "ha": "Hausa", "haw": "Hawaiian", "he": "Hebrew", "hi": "Hindi", "hmn": "Hmong", "hu": "Hungarian", "is": "Icelandic", "ig": "Igbo", "id": "Indonesian", "ga": "Irish", "it": "Italian", "ja": "Japanese", "jw": "Javanese", "kn": "Kannada", "kk": "Kazakh", "km": "Khmer", "ko": "Korean", "ku": "Kurdish", "ky": "Kyrgyz", "lo": "Lao", "la": "Latin", "lv": "Latvian", "lt": "Lithuanian", "lb": "Luxembourgish", "mk": "Macedonian", "mg": "Malagasy", "ms": "Malay", "ml": "Malayalam", "mt": "Maltese", "mi": "Maori", "mr": "Marathi", "mn": "Mongolian", "my": "Myanmar (Burmese)", "ne": "Nepali", "no": "Norwegian", "ny": "Nyanja (Chichewa)", "ps": "Pashto", "fa": "Persian", "pl": "Polish", "pt": "Portuguese (Portugal, Brazil)", "pa": "Punjabi", "ro": "Romanian", "ru": "Russian", "sm": "Samoan", "gd": "Scots Gaelic", "sr": "Serbian", "st": "Sesotho", "sn": "Shona", "sd": "Sindhi", "si": "Sinhala (Sinhalese)", "sk": "Slovak", "sl": "Slovenian", "so": "Somali", "es": "Spanish", "su": "Sundanese", "sw": "Swahili", "sv": "Swedish", "tl": "Tagalog (Filipino)", "tg": "Tajik", "ta": "Tamil", "te": "Telugu", "th": "Thai", "tr": "Turkish", "uk": "Ukrainian", "ur": "Urdu", "uz": "Uzbek", "vi": "Vietnamese", "cy": "Welsh", "xh": "Xhosa", "yi": "Yiddish", "yo": "Yoruba", "zu": "Zulu"
            },
            targetUrl: "https://translate.google.com/translate_a/single",
            description: "使用与Red Sugoi Translator相同的文本处理器的Google Translator",
            batchDelay: 1,
            innerDelay: 6000,
            maximumBatchSize: 1800,
            skipReferencePair: true,
            lineDelimiter: "<br>",
            mode: "rowByRow",
            escapeAlgorithm: RedPlaceholderType.privateUse,
        }, {
            "escapeAlgorithm": {
                "type": "string",
                "title": "代码转义算法",
                "description": "用于自定义转义器模式的转义算法。对于谷歌，建议使用标签占位符，因为谷歌试图不破坏标签。",
                "default": RedPlaceholderType.privateUse,
                "required": false,
                // @ts-ignore shhh it's fine don't worry bb
                "enum": RedPlaceholderTypeArray
            },
        }, []);
        this.lastRequest = 0;
        this.delayed = [];
    }
    doTranslate(toTranslate, options) {
        let sourceLanguage = trans.getSl();
        let destinationLanguage = trans.getTl();
        let translating = 0;
        let translations = new Array(toTranslate.length);
        let maxBatchSize = this.getEngine().maximumBatchSize;
        let delay = this.getEngine().innerDelay;
        //let rowSeparator = "<newrowmarker>";
        let rowSeparator = this.getEngine().lineSubstitute;
        //let rowSeparator = String.fromCodePoint(983040); // Cool in theory, not that cool in practice
        let progressCurrent = document.createTextNode("0");
        let progressTotal = document.createTextNode("/" + toTranslate.length);
        let currentAction = document.createTextNode("启动...");
        this.print(document.createTextNode("[Red Google] 翻译当前批次："), progressCurrent, progressTotal, document.createTextNode(" - "), currentAction);
        let batchStart = 0;
        let translate = (onSuccess, onError) => {
            if (translating >= toTranslate.length) {
                currentAction.nodeValue = "完成！";
                return onSuccess(translations);
            }
            currentAction.nodeValue = "收集线索...";
            let batch = [];
            let batchSize = 0;
            batchStart = translating;
            let calcBatchSize = (addition) => {
                return addition.length + batchSize + (rowSeparator.length * batch.length);
            };
            // If for some reason we get one huge ass translation, we send it alone
            while (translating < toTranslate.length && (batchSize == 0 || maxBatchSize > calcBatchSize(toTranslate[translating]))) {
                batch.push(toTranslate[translating]);
                batchSize += toTranslate[translating++].length;
            }
            let action = () => {
                sendToGoogle(batch, onSuccess, onError);
            };
            currentAction.nodeValue = "等待内部延迟...";
            this.delay(action);
        };
        let sendToGoogle = (batch, onSuccess, onError) => {
            currentAction.nodeValue = "发送到谷歌...";
            console.log("[RedGoogle] Batch: ", batch);
            common.fetch(this.getEngine().targetUrl, {
                method: 'get',
                data: ({
                    client: "gtx",
                    sl: sourceLanguage,
                    tl: destinationLanguage,
                    dt: 't',
                    q: batch.join("\n" + rowSeparator)
                }),
                //headers		: { 'Content-Type': 'application/json' },
            }).then((data) => {
                currentAction.nodeValue = "阅读反应...";
                let googleTranslations = data[0]; // Each line becomes a translation...
                let uglyTranslations = [];
                for (let i = 0; i < googleTranslations.length; i++) {
                    uglyTranslations.push(googleTranslations[i][0]);
                }
                let cleanTranslations = uglyTranslations.join("\n");
                // Google doesn't destroy tags, but it adds spaces... "valid HTML" I guess.
                cleanTranslations = cleanTranslations.replaceAll(/ *< */g, "<");
                cleanTranslations = cleanTranslations.replaceAll(/ *> */g, ">");
                // Fuck empty lines
                cleanTranslations = cleanTranslations.replaceAll(/[\n]{2,}/g, "\n");
                // Fuck spaces at the end of lines
                cleanTranslations = cleanTranslations.replaceAll(/ *\n/g, "\n");
                // Case consistency
                cleanTranslations = cleanTranslations.replaceAll(new RegExp(rowSeparator, "gi"), rowSeparator);
                // we want to ignore line breaks on the sides of the row separator
                cleanTranslations = cleanTranslations.replaceAll("\n" + rowSeparator, rowSeparator);
                cleanTranslations = cleanTranslations.replaceAll(rowSeparator + "\n", rowSeparator);
                // Japanese loves repeating sentence enders !!!
                // Google does not
                cleanTranslations = cleanTranslations.replaceAll(/\n!/g, "!");
                cleanTranslations = cleanTranslations.replaceAll(/\n\?/g, "?");
                cleanTranslations = cleanTranslations.replaceAll(/\n\./g, "。");
                cleanTranslations = cleanTranslations.replaceAll(/\n;/g, ";");
                let pristineTranslations = cleanTranslations.split(rowSeparator);
                if (pristineTranslations.length != batch.length) {
                    this.error(`[RedGoogle] 一批因不匹配而中断。我们发了 ${batch.length} 句，得到了 ${pristineTranslations.length} 句。跳过它们。您可以在开发控制台（F12）中找到更多详细信息。`);
                    console.error("[RedGoogle] 好的，那么我们发送了这批货！");
                    console.warn(batch);
                    console.error("[RedGoogle] 但他们完全不冷静，把这封信寄了回去：");
                    console.warn(pristineTranslations);
                    console.error("[RedGoogle] 所以我们什么都没翻译，因为我们都忘了！");
                    console.error("[RedGoogle] 我们的 " + rowSeparator + " 应该在那里的某个地方，以某种方式改变。也许我们需要一个不同的？");
                }
                else {
                    for (let i = 0; i < pristineTranslations.length; i++) {
                        translations[batchStart + i] = pristineTranslations[i].trim(); // Google loves spaces...
                        if (this.isCaching()) {
                            this.setCache(toTranslate[batchStart + i], pristineTranslations[i]);
                        }
                    }
                    progressCurrent.nodeValue = (parseInt(progressCurrent.nodeValue) + pristineTranslations.length).toString();
                }
            }).catch(e => {
                currentAction.nodeValue = "啊！";
                this.error("[Red Google] 获取时出错：" + e.message + ". 跳过批处理。");
            }).finally(() => {
                translate(onSuccess, onError);
            });
        };
        return new Promise((onSuccess, onError) => {
            translate(onSuccess, onError);
        });
    }
    delay(callback) {
        let now = (new Date()).getTime();
        let engineDelay = this.getEngine().innerDelay;
        let timeDelta = now - this.lastRequest;
        if (timeDelta >= engineDelay) {
            this.lastRequest = now;
            callback();
        }
        else {
            this.delayed.push(callback);
            setTimeout(() => {
                let cb = this.delayed.shift();
                if (cb != undefined) {
                    this.lastRequest = (new Date()).getTime();
                    cb();
                }
            }, engineDelay - timeDelta);
        }
    }
    abort() {
        this.allowTranslation = false;
        this.waiting = [];
        this.paused = false;
        this.delayed = [];
    }
}
/// <reference path="RedTranslatorEngine.ts" />
function getCarryTitleMap(array) {
    if (array) {
        return [...trans.translator];
    }
    let titleMap = {};
    for (let i = 0; i < trans.translator.length; i++) {
        let id = trans.translator[i];
        try {
            if (trans[id] != undefined) {
                titleMap[trans[id].id] = trans[id].name;
            }
        }
        catch (e) { }
    }
    return titleMap;
}
class RedPiggybackEngine extends RedTranslatorEngineWrapper {
    constructor(thisAddon) {
        super(thisAddon, {
            id: "redpiggyback",
            name: "Red Piggyback翻译",
            description: "在其中一个默认转换器上使用红色文本处理器。为什么要写很多代码，而很少有代码能起作用？",
            batchDelay: 1,
            skipReferencePair: true,
            maxRequestLength: Number.MAX_VALUE,
            lineDelimiter: "<br>",
            mode: "rowByRow",
            carryId: 'transredsugoi',
        }, {
            "carryId": {
                "type": "string",
                "title": "要使用的翻译程序",
                "description": "设置Piggyback将使用的转换器。",
                "default": "redsugoi",
                "required": false,
                "enum": getCarryTitleMap(true)
            },
            "escapeAlgorithm": {
                "type": "string",
                "title": "代码转义算法",
                "description": "用于自定义转义器模式的转义算法。最好的翻译取决于所使用的翻译。",
                "default": RedPlaceholderType.tagPlaceholder,
                "required": false,
                // @ts-ignore shhh it's fine don't worry bb
                "enum": RedPlaceholderTypeArray
            },
        }, [
            {
                "key": "carryId",
                "titleMap": getCarryTitleMap(false),
                "onChange": (evt) => {
                    var value = $(evt.target).val();
                    this.translatorEngine.update("carryId", value);
                }
            },
        ]);
        this.lastRequest = 0;
        this.delayed = [];
    }
    delay(callback, engineDelay) {
        let now = (new Date()).getTime();
        let timeDelta = now - this.lastRequest;
        if (timeDelta >= engineDelay) {
            this.lastRequest = now;
            callback();
        }
        else {
            this.delayed.push(callback);
            setTimeout(() => {
                let cb = this.delayed.shift();
                if (cb != undefined) {
                    this.lastRequest = (new Date()).getTime();
                    cb();
                }
            }, engineDelay - timeDelta);
        }
    }
    abort() {
        this.allowTranslation = false;
        this.waiting = [];
        this.paused = false;
        this.delayed = [];
    }
    doTranslate(toTranslate, options) {
        let batchAction = document.createTextNode("启动");
        let progressCurrent = document.createTextNode("0");
        let progressTotal = document.createTextNode("/" + toTranslate.length.toString());
        this.print(document.createTextNode("[RedPiggyBackEngine] 当前批次："), progressCurrent, progressTotal, document.createTextNode(" - 当前行动："), batchAction);
        return new Promise((resolve, reject) => {
            let targetTrans = trans[this.getEngine().carryId];
            if (targetTrans == undefined) {
                batchAction.nodeValue = "结束-没有有效的翻译程序";
                this.error("选定的翻译者(" + this.getEngine().carryId + ")无效或不可用。");
                reject("所选翻译引擎不存在或不可用。");
            }
            else {
                let newOptions = { ...options };
                newOptions.onAfterLoading = (result) => {
                    batchAction.nodeValue = "接受翻译...";
                    if (result.translation.length != toSend.length) {
                        batchAction.nodeValue = "结束-转换器返回无效响应";
                        this.error("[RedPiggybackEngine] 收到无效响应。发送了" + toTranslate.length.toString() + "个句子，得到了" + result.translation.length + "。跳过。");
                        reject("不匹配的翻译。");
                    }
                    else {
                        for (let i = 0; i < result.translation; i++) {
                            let idx = i + translating++;
                            translations[idx] = result.translation[i];
                            if (this.isCaching()) {
                                this.setCache(toTranslate[idx], translations[idx]);
                            }
                        }
                        progressCurrent.nodeValue = translating.toString();
                        if (translating >= toTranslate.length) {
                            batchAction.nodeValue = "结束-批量完成";
                            resolve(translations);
                        }
                        else {
                            batchAction.nodeValue = "等待内部延迟...";
                            this.delay(doAction, targetTrans.batchDelay);
                        }
                    }
                };
                newOptions.onError = (reason) => {
                    this.error("[RedPiggybackEngine] " + reason);
                    reject(reason);
                };
                let sending = 0;
                let translating = 0;
                let translations = new Array(toTranslate.length);
                let toSend = [];
                let maxLength = targetTrans.maxRequestLength;
                let doAction = () => {
                    let sentLength = 0;
                    toSend = [];
                    while (sending < toTranslate.length &&
                        (sentLength + toTranslate[sending].length < maxLength || sentLength == 0)) {
                        sentLength += toTranslate[sending].length;
                        toSend.push(toTranslate[sending++]);
                    }
                    if (toSend.length > 0) {
                        targetTrans.translate(toSend, newOptions);
                    }
                    else {
                        resolve(translations);
                    }
                };
                this.delay(doAction, targetTrans.batchDelay);
            }
        });
    }
    resetForm() {
        this.getEngine().optionsForm.schema.carryId.enum = getCarryTitleMap(true);
        this.getEngine().optionsForm.sechema.carryId.enum = getCarryTitleMap(true);
        this.getEngine().optionsForm.form.carryId.enum = getCarryTitleMap(false);
    }
}
/// <reference path="classes/RedSugoiEngine.ts" />
/// <reference path="classes/RedGoogleEngine.ts" />
/// <reference path="classes/RedPiggybackEngine.ts" />
var thisAddon = this;
let wrappers = [
    new RedSugoiEngine(thisAddon),
    new RedGoogleEngine(thisAddon),
];
let piggy = new RedPiggybackEngine(thisAddon);
wrappers.forEach(wrapper => {
    trans[wrapper.getEngine().id] = wrapper.getEngine();
});
//trans[piggy.getEngine().id] = piggy.getEngine();
$(document).ready(() => {
    wrappers.forEach(wrapper => {
        wrapper.getEngine().init();
    });
    /* piggy.getEngine().init();

    setTimeout(() => {
        piggy.resetForm();
    }, 500); */
});
class RedBatchTranslatorButton {
    constructor(parent) {
        this.panel = document.getElementsByClassName("toolbar-content toolbar3")[0];
        this.parent = parent;
        // <button class="menu-button batch-translate" data-tranattr="title" title="Batch translation">
        //  <img src="img/translate_all.png" alt="translate">
        // </button>
        this.button = document.createElement("button");
        this.button.classList.add("menu-button", "batch-translate");
        this.button.title = "Red Batch 翻译";
        this.button.style.filter = "hue-rotate(260deg)"; // Green to red
        this.button.title = "Red Batch 翻译";
        let img = document.createElement("img");
        img.src = "img/translate_all.png";
        img.alt = "red batch translation";
        this.button.appendChild(img);
        this.panel.appendChild(this.button);
        this.button.addEventListener("click", () => {
            this.parent.open();
        });
    }
}
class RedBatchTranslatorWindow {
    constructor(parent) {
        this.container = document.createElement("div");
        this.parent = parent;
        this.container.classList.add("ui-widget-overlay", "ui-front");
        this.container.style.opacity = "1";
        this.container.style.backgroundColor = "rgba(170, 170, 170, .3)";
        this.container.style.display = "flex";
        this.container.style.justifyContent = "center";
        this.container.style.alignItems = "center";
        document.addEventListener("keydown", (ev) => {
            if (this.container.parentNode == document.body && ev.key == "Escape") {
                this.parent.close();
            }
        });
        let innerWindow = document.createElement("div");
        innerWindow.style.backgroundColor = "white";
        innerWindow.style.width = "600px";
        innerWindow.style.height = "500px";
        innerWindow.style.fontSize = "1.2ex";
        this.container.appendChild(innerWindow);
        let header = document.createElement("div");
        header.style.backgroundColor = "black";
        header.style.color = "white";
        header.style.lineHeight = "30px";
        header.style.paddingLeft = "10px";
        header.innerHTML = "<h1 style='margin:0px'>Red Batch 翻译</h1>";
        innerWindow.appendChild(header);
        let contents = document.createElement("div");
        contents.style.padding = "10px";
        innerWindow.appendChild(contents);
        contents.appendChild($("<h2 style='margin: 0px;'>选择翻译器</h2>")[0]);
        contents.appendChild($("<hr></hr>")[0]);
        contents.appendChild($(`<select><option value="redsugoi">Red Sugoi 翻译</option><option value="redgoogles">Red Google 翻译</option></select>`)[0]);
    }
    open() {
        document.body.appendChild(this.container);
    }
    close() {
        document.body.removeChild(this.container);
    }
}
/* <div id="dialogTranslateAll" data-tranatrr="title" class="dialog dialogTranslateAll ui-dialog-content ui-widget-content initialized" style="width: auto; min-height: 0px; max-height: none; height: 285px;">
    <h2 data-tran="">Select Translator</h2>
    <div class="translatorSelection"><select class="translatorSelector"><option value="deepl">DeepL</option><option value="sugoitrans">Sugoi Translator</option><option value="papago">Papago</option><option value="redsugoi">Red Sugoi Translator</option><option value="redgoogles">Red Google Translator</option><option value="atlas">Atlas</option><option value="babylon">Babylon</option><option value="baidu">Baidu</option><option value="bing">Bing</option><option value="excite">Excite</option><option value="google">Google</option><option value="googleCloud">Google Cloud</option><option value="kakao">Kakao</option><option value="pragma6">Pragma6</option><option value="redGoogle">Red Google</option><option value="yandexpro">yandex Pro</option></select></div>
    <div class="flex col-2">
        <div class="fieldmember sourceCol">
            <h2 data-tran="">Source column</h2>
            <label class="columnSelector"><select><option value="0">Original Text</option><option value="1">Initial</option><option value="2">Machine translation</option><option value="3">Better translation</option><option value="4">Best translation</option></select></label>
            <div class="smallInfo" data-tran="">Which column is the source text to translate for?<br>(default is key column / leftmost column).</div>
        </div>
        <div class="fieldmember">
            <h2 data-tran="">Target column</h2>
            <label class="targetCol"><select><option value="1">Initial</option><option value="2">Machine translation</option><option value="3">Better translation</option><option value="4">Best translation</option></select></label>
            <div class="smallInfo" data-tran="">Which column is the translated text put into.<br>(Can not same with source column)</div>
        </div>

    </div>

    <div class="options fieldgroup">
        <h2 data-tran="">Options</h2>
        <div class="fieldmember">
            <label><input type="checkbox" name="translateOther" class="checkbox translateOther" value="1"><span data-tran="">Also try to translate other object</span></label>
            <div class="smallInfo" data-tran="">If this option is checked then Translator++ will also try to translate other objects that you did not select that doesn't require machine translation. This is the default behavior in Translator++ version 2.3.23 or lower.</div>
        </div>
        <div class="fieldmember">
            <label><input type="checkbox" name="untranslatedOnly" class="checkbox untranslatedOnly" value="1" checked="checked"><span data-tran="">Ignore if already translated</span></label>
            <div class="smallInfo" data-tran="">If this option is checked then Translator++ will ignore any row that already has translations on its column</div>
        </div>
        <div class="fieldmember">
            <label><input type="checkbox" name="overwrite" class="checkbox overwrite" value="1" checked="checked"><span data-tran="">Overwrite cells</span></label>
            <div class="smallInfo" data-tran="">Overwrite target cells. If not checked, the cells will not be touched when not empty.</div>
        </div>
        <div class="fieldmember">
            <label><input type="checkbox" name="saveOnEachBatch" class="checkbox saveOnEachBatch" value="1"><span data-tran="">Save project on each batch.</span></label>
            <div class="smallInfo" data-tran="">Save your project on each batch completion.<br>This option is to avoid data loss when the application crashes due to running heavy tasks from the local translator application. You probably don't need this if you're running cloud based translator.</div>
        </div>
        <div class="fieldmember">
            <label><input type="checkbox" name="playSoundOnComplete" class="checkbox playSoundOnComplete" value="1" checked="checked"><span data-tran="">Play sound when completed.</span></label>
        </div>
    </div>

    <div class="options fieldgroup">
        <div class="fieldmember">
            <h2 data-tran="">Tags</h2>
            <div class="colorTagSelector"><div class="uiTags uiTagsWrapper rendered" data-mark="unknown"><input type="checkbox" value="red" class="colorTagSelector tagSelector red" title="red" name="tagSelector" style="background-color: rgb(255, 0, 0);"><input type="checkbox" value="yellow" class="colorTagSelector tagSelector yellow" title="yellow" name="tagSelector" style="background-color: rgb(255, 255, 0);"><input type="checkbox" value="green" class="colorTagSelector tagSelector green" title="green" name="tagSelector" style="background-color: rgb(0, 128, 0);"><input type="checkbox" value="blue" class="colorTagSelector tagSelector blue" title="blue" name="tagSelector" style="background-color: rgb(0, 0, 255);"><input type="checkbox" value="gold" class="colorTagSelector tagSelector gold" title="gold" name="tagSelector" style="background-color: rgb(212, 175, 55);"><input type="checkbox" value="purple" class="colorTagSelector tagSelector purple" title="purple" name="tagSelector" style="background-color: rgb(128, 0, 128);"><input type="checkbox" value="black" class="colorTagSelector tagSelector black" title="black" name="tagSelector" style="background-color: rgb(0, 0, 0);"><input type="checkbox" value="gray" class="colorTagSelector tagSelector gray" title="gray" name="tagSelector" style="background-color: rgb(128, 128, 128);"><input type="checkbox" value="white" class="colorTagSelector tagSelector white" title="white" name="tagSelector" style="background-color: rgb(255, 255, 255);"><input type="checkbox" value="silver" class="colorTagSelector tagSelector silver" title="silver" name="tagSelector" style="background-color: rgb(192, 192, 192);"><input type="checkbox" value="pink" class="colorTagSelector tagSelector pink" title="pink" name="tagSelector" style="background-color: rgb(255, 192, 203);"><input type="checkbox" value="indigo" class="colorTagSelector tagSelector indigo" title="indigo" name="tagSelector" style="background-color: rgb(75, 0, 130);"><input type="checkbox" value="aqua" class="colorTagSelector tagSelector aqua" title="aqua" name="tagSelector" style="background-color: rgb(0, 255, 255);"><input type="checkbox" value="tan" class="colorTagSelector tagSelector tan" title="tan" name="tagSelector" style="background-color: rgb(210, 180, 140);"><input type="checkbox" value="darkred" class="colorTagSelector tagSelector darkred" title="darkred" name="tagSelector" style="background-color: rgb(139, 0, 0);"><div class="actionSet">
                <label class="flex"><input type="radio" name="exportTagAction" data-mark="cross" class="actionBlacklist" value="blacklist"> <span>Do not process row with selected tag (blacklist)</span></label>
                <label class="flex"><input type="radio" name="exportTagAction" data-mark="check" class="actionWhitelist" value="whitelist"> <span>Only process row with selected tag (whitelist)</span></label>
                <label class="flex"><input type="radio" name="exportTagAction" data-mark="unknown" class="actionNone" value=""> <span>Ignore tag</span></label>
            </div><div class="fieldgroup">
        <button class="loadLastSelection">Load last selection</button>
        <button class="resetField">Reset</button>
    </div></div></div>
        </div>
    </div>
</div> */ 
class RedBatchTranslatorRow {
    constructor(file, index) {
        this.location = [file, index];
    }
    getValue() {
        return trans.project.files[this.location[0]].data[this.location[1]][0];
    }
    isTranslated() {
        let cells = trans.project.files[this.location[0]].data[this.location[1]];
        let dataLength = cells.length;
        for (let i = 1; i < dataLength; i++) {
            if (cells[i] != null && cells[i] != undefined && cells[i].trim() != "") {
                return true;
            }
        }
        return false;
    }
    setValue(text, destination) {
        trans.project.files[this.location[0]].data[this.location[1]][destination] = text;
    }
    getTags() {
        // trans.project.files["data/Armors.json"].tags[i]
        let tags = trans.project.files[this.location[0]].tags[this.location[1]];
        if (tags == undefined) {
            return [];
        }
        return tags;
    }
}
/// <reference path="RedBatchTranslator/RedBatchTranslatorButton.ts" />
/// <reference path="RedBatchTranslator/RedBatchTranslatorWindow.ts" />
/// <reference path="RedBatchTranslator/RedBatchTranslatorRow.ts" />
class RedBatchTranslator {
    constructor() {
        this.button = new RedBatchTranslatorButton(this);
        this.window = new RedBatchTranslatorWindow(this);
    }
    open() {
        // TODO: Make options window when I feel like it
        //this.window.open();
        let files = trans.getCheckedFiles();
        if (files.length == 0) {
            files = trans.getAllFiles();
        }
        let options = {
            translator: "redsugoi",
            destination: 1,
            blacklist: ["red"],
            ignoreTranslated: true,
            whitelist: [],
            strict: false,
            saveOnEachBatch: true,
            files: files
        };
        this.translateProject(options);
    }
    close() {
        this.window.close();
    }
    translateProject(options) {
        ui.showLoading();
        ui.loadingProgress(0, "启动...");
        ui.log(`[RedBatchTranslator] 开始翻译 ${new Date()}`);
        let consoleWindow = $("#loadingOverlay .console")[0];
        let pre = document.createElement("pre");
        pre.style.whiteSpace = "pre-wrap";
        pre.appendChild(document.createTextNode(JSON.stringify({
            ...options,
            files: options.files.join("; ")
        }, undefined, 4)));
        consoleWindow.appendChild(pre);
        let translatorEngine = trans[options.translator];
        let rows = [];
        ui.loadingProgress(0, "查找可翻译行");
        // Iterate through rows and add them up
        for (let i = 0; i < options.files.length; i++) {
            console.log(`[RedBatchTranslator] 致力于 ${options.files[i]}...`);
            let file = options.files[i];
            let data = trans.project.files[file].data;
            for (let k = 0; k < data.length; k++) {
                let row = new RedBatchTranslatorRow(file, k);
                // Repeating work?
                if (options.ignoreTranslated && row.isTranslated()) {
                    continue;
                }
                // Empty row?
                if (row.getValue() == undefined || row.getValue() == null || row.getValue().trim() == "") {
                    continue;
                }
                if (options.blacklist.length == 0 && options.whitelist.length == 0) {
                    // Everyone is allowed
                    rows.push(row);
                }
                else if (options.whitelist.length > 0) {
                    // Only if your name is on the list
                    let tags = row.getTags();
                    if (tags.length == 0) {
                        if (!options.strict) {
                            // No tags, no strict, means we allow it through
                            rows.push(row);
                        }
                    }
                    else {
                        for (let t = 0; t < tags.length; t++) {
                            if (options.whitelist.indexOf(tags[t]) != -1) {
                                rows.push(row);
                                break;
                            }
                        }
                    }
                }
                else {
                    // DISCRIMINATION ON
                    let tags = row.getTags();
                    let clear = true;
                    for (let t = 0; t < tags.length; t++) {
                        if (options.blacklist.indexOf(tags[t]) != -1) {
                            clear = false;
                            break;
                        }
                    }
                    if (clear) {
                        rows.push(row);
                    }
                }
            }
        }
        // rows = Array of rows that need translating
        let batches = [];
        let batchesRows = [];
        let maxLength = translatorEngine.maxRequestLength;
        let currentBatch = [];
        let currentBatchRows = [];
        let currentSize = 0;
        let addToBatches = () => {
            batches.push(currentBatch);
            batchesRows.push(currentBatchRows);
            currentBatchRows = [];
            currentBatch = [];
            currentSize = 0;
        };
        for (let i = 0; i < rows.length; i++) {
            let text = rows[i].getValue();
            if (currentSize > 0 && (currentSize + text.length) > maxLength) {
                addToBatches();
            }
            currentBatch.push(text);
            currentBatchRows.push(rows[i]);
            currentSize += text.length;
        }
        if (currentSize > 0) {
            addToBatches();
        }
        let batchIndex = 0;
        let batchStart = Date.now();
        let translate = () => {
            ui.loadingProgress(0, `翻译批 ${batchIndex + 1} 的 ${batches.length}`);
            let myBatch = batchIndex++;
            let always = () => {
                let proceed = () => {
                    if (batchIndex >= batches.length) {
                        let batchEnd = Date.now();
                        ui.log(`[RedBatchTranslator] 在完成翻译 ${new Date()}`);
                        ui.log(`[RedBatchTranslator] 采取 ${Math.round(10 * (batchEnd - batchStart) / 1000) / 10} 秒。`);
                        ui.loadingProgress(100, "完成了！");
                        ui.showCloseButton();
                        setTimeout(() => {
                            trans.refreshGrid();
                            trans.evalTranslationProgress();
                        }, 500);
                    }
                    else {
                        let batchDelay = translatorEngine.batchDelay;
                        if (batchDelay == undefined || batchDelay <= 1) {
                            translate();
                        }
                        else {
                            ui.log(`[RedBatchTranslator] 等待 ${batchDelay}ms.`);
                            setTimeout(translate, batchDelay);
                        }
                    }
                };
                if (options.saveOnEachBatch) {
                    ui.log(`[RedBatchTranslator] 保存项目...`);
                    trans.save().finally(proceed);
                }
                else {
                    proceed();
                }
            };
            if (batches[myBatch] == undefined) {
                always();
            }
            else {
                translatorEngine.translate(batches[myBatch], {
                    onError: () => {
                        ui.error("[RedBatchTranslator] 翻译批处理失败！");
                    },
                    onAfterLoading: (result) => {
                        ui.log(`[RedBatchTranslator] 插入表格...`);
                        for (let i = 0; i < result.translation.length; i++) {
                            batchesRows[myBatch][i].setValue(result.translation[i], options.destination);
                        }
                    },
                    always: always,
                    progress: (perc) => {
                        ui.loadingProgress(perc);
                    }
                });
            }
        };
        translate();
    }
}
trans.RedBatchTranslatorInstance = new RedBatchTranslator();
class RedStringRowHandler {
    constructor(row, wrapper) {
        this.curatedLines = [];
        this.extractedLines = [];
        this.translatableLines = [];
        this.translatableLinesIndex = [];
        this.translatedLines = [];
        this.isScript = false;
        this.quoteType = "'";
        this.originalRow = row;
        let processed = wrapper.curateRow(row);
        if (processed.scriptCheck.isScript) {
            this.setScript(processed.scriptCheck.quoteType);
        }
        this.curatedLines = processed.lines;
        for (let i = 0; i < this.curatedLines.length; i++) {
            let curated = this.curatedLines[i];
            this.curatedLines.push(...curated.getExtractedStrings());
            let line = curated.getReplacedText();
            if (line.trim() != "") {
                if (wrapper.hasCache(line)) {
                    curated.setTranslatedText(wrapper.getCache(line));
                }
                else {
                    this.translatableLines.push(line);
                    this.translatableLinesIndex.push(i);
                }
            }
        }
        this.translatedLines = new Array(this.translatableLines.length);
    }
    getOriginalRow() {
        return this.originalRow;
    }
    getTranslatedRow() {
        let lines = [];
        let lastline = "";
        for (let i = 0; i < this.curatedLines.length; i++) {
            let curated = this.curatedLines[i];
            if (curated.isExtracted()) {
                continue; // we don't touch these
            }
            let line = curated.recoverSymbols();
            line = line.trim();
            // Keep empty lines so long as:
            // It's not the first line
            // The previous line wasn't also blank
            if (line != "" || (i > 0 && lastline != "")) {
                lines.push(line);
            }
            lastline = line;
        }
        let result = lines.join("\n");
        if (this.isScript) {
            result = result.replaceAll(this.quoteType, `\\${this.quoteType}`);
            result = this.quoteType + result + this.quoteType;
            // Parsing it always ruins it
        }
        return result;
    }
    setScript(quoteType) {
        this.isScript = true;
        this.quoteType = quoteType;
    }
    getTranslatableLines() {
        return [...this.translatableLines];
    }
    insertTranslation(text, index) {
        this.translatedLines[index] = text;
    }
    applyTranslation() {
        for (let i = 0; i < this.translatedLines.length; i++) {
            // Some of them might be undefined
            // Ideally we'd check outside, but we need to keep moving forward while translating.
            let translation = this.translatedLines[i];
            if (translation != undefined) {
                this.curatedLines[this.translatableLinesIndex[i]].setTranslatedText(translation);
            }
            else {
                this.curatedLines[this.translatableLinesIndex[i]].break();
            }
        }
    }
    isDone(index) {
        return index >= this.translatableLines.length;
    }
}
