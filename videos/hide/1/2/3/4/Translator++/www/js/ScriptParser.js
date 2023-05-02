class ScriptParser extends require("www/js/ParserBase.js").ParserBase {
	constructor(script, options, callback) {
		super(script, options, callback);
        options = options || {};
		this.debugLevel         = options.debugLevel;
		this.currentEntryPoint  = {};
        this.language           = options.language;
        this.currentOffset      = 0;
        this.hook               = {};
		this.transData = {
			data:[],
			context:[],
			tags:[],
			parameters:[],
			indexIds:{}
		};
	}
}

ScriptParser.stringEnclosure = {
    ruby:[
        {
            start:'"',
            end:'"'
        },
        {
            start:"'",
            end:"'"
        },
        {
            start:"%/",
            end:"/"
        }
    ]
}

ScriptParser.prototype.on = function(label, fn) {
    if (typeof fn !== "function") return this;
    this.hook[label] = fn;
    return this;
}

ScriptParser.prototype.off = function(label) {
    if (!label) return;
    this.hook[label] = fn;
    return this;
}

ScriptParser.prototype.trigger = function(label) {
    if (typeof this.hook[label] !== "function") return this;
    var args = [];
    for (var i=1; i<arguments.length; i++) {
        args.push(arguments[i]);
    }
    
    return this.hook[label].apply(this, args);
}

ScriptParser.prototype.getCurrentOffset = function() {
	return this.writableData.join("").length;
}

ScriptParser.prototype.parseToken = function(token, parentType = "", options = {}) {
    if (typeof token == "string") {
        if (parentType == "string") {
            var result = this.trigger("beforeRegisterString", arguments);
            if (common.isHalt(result)) return this;
            if (!common.isThru(result)) this.registerString(token, [this.currentOffset], {start:this.currentOffset, end:this.currentOffset+token.length});
            result = this.trigger("afterRegisterString", arguments);
            if (!common.isThru(result)) this.currentOffset += token.length;
        } else {
            this.register(token);
            this.currentOffset += token.length;
        }
        return this;
    }

    if (Array.isArray(token.content)) {
        for (var i=0; i < token.content.length; i++) {
            this.parseToken(token.content[i], token.type, {
                index:i,
                siblingNumber:token.content.length,
                members:token.content,
                parent:token
            });
        }
    } else {
        this.parseToken(token.content, token.type, {siblingNumber:0, parent:token, members:[]});
    }
    return this;
}

ScriptParser.prototype.parse = function(data, language) {
    data        = data || this.script;
    language    = language || this.language;
    this.currentOffset = 0;

    if (Boolean(Prism.languages[language]) == false) return console.warn("Unknown language:", language);
    this.tokens = Prism.tokenize(data, Prism.languages[language])

    for (var i=0; i<this.tokens.length; i++) {
        this.parseToken(this.tokens[i]);
    }
    return this;
}

module.exports = ScriptParser;