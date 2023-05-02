"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationEngineWrapper = exports.PatternExplanation = exports.TranslationEngineOptionCategories = void 0;
const mtl_text_processor_1 = require("@redsugoi/mtl-text-processor");
const _Constants_1 = require("./_Constants");
const TranslationEngineOption_1 = require("./TranslationEngineOption");
const CacheHandler_1 = require("./CacheHandler");
const RedPerformance_1 = require("./RedPerformance");
var TranslationEngineOptionCategories;
(function (TranslationEngineOptionCategories) {
    TranslationEngineOptionCategories["PATTERNS"] = "Patterns";
    TranslationEngineOptionCategories["LIMITS"] = "Limits";
    TranslationEngineOptionCategories["OPTIONS"] = "Options";
})(TranslationEngineOptionCategories = exports.TranslationEngineOptionCategories || (exports.TranslationEngineOptionCategories = {}));
const TranslationEngineOptionCategoriesPriority = {
    Options: 0,
    Limits: 1,
    Patterns: 999
};
exports.PatternExplanation = `可以有多个图案，用逗号分隔。模式可以是全局正则表达式，也可以是返回全局正则表达式/无的函数（整体字符串：string, passCount : number）。`;
class TranslationEngineWrapper {
    constructor(processorClass, thisAddon, extraOptions) {
        this.cache = new CacheHandler_1.CacheHandler(this);
        this.storedOptions = [];
        this.storedOptionsHash = {};
        /**
         *
         *
         * OPTIONS
         *
         *
         */
        this.optionPlaceholderType = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'placeholderType',
            default: mtl_text_processor_1.PlaceholderType.mvStyleLetter,
            category: TranslationEngineOptionCategories.OPTIONS,
            priority: -2,
            name: '占位符类型',
            description: [
                '转换前，受保护的图案将被此列表中的符号替换。',
                '理想的类型取决于所使用的转换器。Sugoi Translator与MV Letter Style/%A配合得很好。Google对HTML标记和 '
            ].join('\n'),
            formType: 'select',
            schemaOptions: {
                enum: Object.values(mtl_text_processor_1.PlaceholderType)
            },
            formOptions: {
                titleMap: { ..._Constants_1.PlaceholderTypeNames }
            }
        });
        this.optionPlaceholderRecoveryType = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'placeholderRecoveryType',
            default: mtl_text_processor_1.PlaceholderRecoveryType.GUESS,
            category: TranslationEngineOptionCategories.OPTIONS,
            priority: -1.5,
            name: '占位符恢复类型',
            description: [
                "定义在找不到占位符进行恢复时如何继续。",
                "\"猜测\" 表示将其放置在最靠近原始字符串位置的空间，这是建议的设置。使用除“丢弃”之外的任何选项，占位符在翻译过程中都不会丢失。优点是不会丢失文本，缺点是丢失占位符的句子会以某种方式损坏，但这并不是真正的缺点，因为如果没有占位符恢复过程，它会更加损坏。"
            ].join('\n'),
            formType: 'select',
            schemaOptions: {
                enum: [
                    mtl_text_processor_1.PlaceholderRecoveryType.ADD_AT_END,
                    mtl_text_processor_1.PlaceholderRecoveryType.ADD_AT_START,
                    mtl_text_processor_1.PlaceholderRecoveryType.GUESS,
                    mtl_text_processor_1.PlaceholderRecoveryType.PERFECT_ONLY
                ]
            },
            formOptions: {
                titleMap: {
                    [mtl_text_processor_1.PlaceholderRecoveryType.ADD_AT_END]: '在末尾插入不可恢复的占位符',
                    [mtl_text_processor_1.PlaceholderRecoveryType.ADD_AT_START]: '在开始处插入不可恢复的占位符',
                    [mtl_text_processor_1.PlaceholderRecoveryType.PERFECT_ONLY]: '丢弃不可恢复的占位符',
                    [mtl_text_processor_1.PlaceholderRecoveryType.GUESS]: '猜测'
                }
            }
        });
        this.optionProcessingOrder = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'processingOrder',
            default: 'BREAK,ISOLATE,CUT,SPLIT,ESCAPE',
            description: [
                '文本处理器处理句子的顺序。同一过程可以多次执行，功能模式只能在某个过程中激活自己。',
                '默认顺序以及名称为: BREAK,ISOLATE,CUT,SPLIT,ESCAPE',
                '断句是把句子从行中分离出来的过程。孤立是在句子中发现内部序列并将其分别翻译的过程。剪切是从每个可翻译序列的角上删除符号的过程。拆分是将句子进一步划分为更小的可翻译部分的过程。Escape是用占位符替换受保护模式的过程。',
                "并非所有流程都是强制性的。事实上，你可以一个也没有。但到那时，你还没有充分利用文本处理器。无效输入将被忽略-在这些情况下，将向开发人员控制台（F12）打印错误。"
            ].join('\n'),
            name: '处理订单',
            category: TranslationEngineOptionCategories.OPTIONS,
            priority: -1
        });
        /* public optionUseProtectedPatterns = new TranslationEngineOption<boolean>({
            wrapper: this,
            id: 'useProtectedPatterns',
            default: true,
            description:    'Protects patterns by replacing them with placeholders.\n' +
                            'It\'s important to select a Placeholder Type that works well with your translator. Sugoi works pretty well with MV-Style (%A). Google and DeepL have some innate support for both HTML Tags and Curly Brackets.\n' +
                            'The main idea of the placeholder is to protect something that you don\'t want the translator to touch while still giving the translator the contextual cue of a symbol.',
            name: 'Protect Patterns',
            category: TranslationEngineOptionCategories.OPTIONS
        });
    
        public optionUseSplittingTranslatable = new TranslationEngineOption<boolean>({
            wrapper: this,
            id: 'useSplittingTranslatable',
            default: false,
            name : 'Translate Splits',
            description:    'Normally, splits are not sent to the translator, but they split the sentence in two.\nThis changes the behavior so that splits are also translated.',
            category: TranslationEngineOptionCategories.OPTIONS,
            priority : 11
        });
    
        public optionUseSplittingNext = new TranslationEngineOption<boolean>({
            wrapper: this,
            id: 'useSplittingNext',
            default: false,
            name:    'Start Sentence with Split',
            description: 'Split Patterns are added to the next sentence rather than the previous one.\nOnly in effect if "Splits are Translatable" is checked.',
            category: TranslationEngineOptionCategories.OPTIONS,
            priority : 12
        }); */
        /* public optionUseProtectedCorners = new TranslationEngineOption<boolean>({
            wrapper: this,
            id: 'useProtectedCorners',
            default: true,
            description:
                'Removes patterns from the corners of sentences, not sending those to the translator.',
            name: 'Split Ends',
            category: TranslationEngineOptionCategories.OPTIONS
        }); */
        this.optionPadPlaceholder = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'padPlaceholder',
            default: false,
            description: '在占位符周围添加空白。\n如果从与占位符共享字符的语言进行翻译，这将非常有用。例如，它将向翻译人员发送文本%A，而不是文本%A，这样更清晰。\n在某种程度上，这的缺点是最终的结果可能会比它应该拥有的空间更多，因此这是一个非常小的缺点，但仍然是一个缺点。',
            name: '填充占位符',
            category: TranslationEngineOptionCategories.OPTIONS,
            priority: 0
        });
        this.optionUseCache = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'useCache',
            default: true,
            description: '将翻译存储在内存中以避免重复工作。\n这只匹配精确的句子，所以这没有坏处——没有损失，只有速度提高。',
            name: '隐藏物',
            category: TranslationEngineOptionCategories.OPTIONS,
            priority: 499
        });
        this.optionCachePersistent = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'useCachePersistent',
            default: true,
            description: '将缓存保存到文件，以便可以在多个会话中使用。\n穿上这件衣服没有坏处。',
            name: '持久缓存',
            category: TranslationEngineOptionCategories.OPTIONS,
            priority: 500
        });
        this.optionCachePersistentSize = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'cachePersistentSize',
            default: 10,
            description: "缓存可以达到的最大大小（MB）。\n该值用作近似值。建议使用不会导致内存或磁盘速度问题的值。\n供参考：一个小游戏通常会填满500KB左右的缓存，一个中型游戏会填满1MB左右的缓存，而一个大型游戏可能会填满2MB的缓存。所以10MB的默认值是大约5个大型游戏的缓存。",
            name: '持久缓存大小',
            category: TranslationEngineOptionCategories.OPTIONS,
            priority: 501
        });
        /**
         * Limits
         */
        this.optionMaxRequestLength = new TranslationEngineOption_1.TranslationEngineOption({
            category: TranslationEngineOptionCategories.LIMITS,
            id: 'maxRequestLength',
            name: '最大批量大小',
            description: '批翻译下每个批将包含的字符数。数字越大，速度越快，但数字越小，就越安全，尤其是在每个批之间保存项目时。建议值是您应在10-30秒内转换的值，以便在出现错误/故障时将工作损失降至最低。',
            default: 5000,
            priority: 1,
            wrapper: this
        });
        /**
         *
         *
         * PATTERNS
         *
         *
         */
        this.optionProtectedPatterns = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'protectedPatterns',
            default: [
                '// For reference, we are trying to remove most things through isolation + cutting corners, so the patterns are mostly for what gets through',
                '// Value reference',
                /[\\]*[_\-a-z]+\[[^\[\]]+?\]/gi.toString() + ',',
                '// RPG Maker conditional choice',
                /(\s*((if)|(en))\(.+?\)\s*)/gi.toString() + ','
            ].join('\n'),
            description: '受保护的模式将用占位符替换每个匹配项。转换后，占位符将替换为原始值。\n' +
                exports.PatternExplanation +
                '\n要禁用，可以注释掉每个模式或将其保留为空。',
            name: '受保护的图案',
            formType: 'ace',
            category: TranslationEngineOptionCategories.PATTERNS,
            formOptions: {
                aceMode: 'javascript',
                aceTheme: 'twilight',
                height: '150px'
            }
        });
        this.optionSplittingPatterns = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'splittingPatterns',
            default: [].join('\n'),
            description: '根据句型拆分句子。' +
                "\n拆分与受保护的模式非常相似-它们匹配一个模式并保护它。除了在某些项目中使用外，通常没有任何好处。当你看到它时，你就会知道它。" +
                '\n有两个区别：第一个区别是，拆分不会带来任何偶然性——匹配模式的原始位置、内容、所有内容都将被拆分，甚至根本不会发送给翻译人员。' +
                "\n第二个区别是，每次出现一个模式时，句子都会被拆分（顾名思义）。因此，虽然这保证了模式将得到绝对保护，但译者可能会错过上下文线索。这最好用于无法翻译的文本（脚本调用等）或无论如何都必须在翻译过程中幸存下来的内容。" +
                '\n分割出与句子无关的不可翻译符号，可以提高翻译质量和速度，而且不会有任何负面影响。' +
                exports.PatternExplanation,
            name: '积极的分裂',
            category: TranslationEngineOptionCategories.PATTERNS,
            priority: 1,
            formType: 'ace',
            formOptions: {
                aceMode: 'javascript',
                aceTheme: 'twilight',
                height: '75px'
            }
        });
        this.optionBreakPatterns = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'linebreakPatterns',
            default: [
                '// Blank lines',
                /\s*\r?\n\s*\r?\n/g.toString() + ',',
                '// Current sentence ended with punctuation',
                /(?<=[─ー～~ｰ\-\\<>\|\/！？。・…‥：；.?!;:\]\)}〕〗〙〛〞”｣〉》」』】）］＞>｝｠〟⟩"'`´◆◎★■☆〇□△●♂♀⚤⚢⚨⚣⚩⚧⸸✞☦✝✟♱☥♁✙⚰️⛧♡♥❤♦♣♠•◘○◙♂♀♪♫►◄▲▼↑←↑→↓↓→←↔※＊〽〓♪♫♬♩〇〒〶〠〄ⓍⓁⓎ<>\-\+=])(\s*\r?\n)/g.toString() +
                    ',',
                '// Next sentence starts with a symbol/opener/punctuaction for some reason',
                /(\r?\n\s*)(?=[─ー～~ｰ\-\\<>\|\/！？。・…‥：；.?!;:〔〖〘〚〝｢〈《「『【（［\[\({＜<｛｟"'´`◆◎★■☆〇□△●♂♀⚤⚢⚨⚣⚩⚧⸸✞☦✝✟♱☥♁✙⚰️⛧♡♥❤♦♣♠•◘○◙♂♀♪♫►◄▲▼↑←↑→↓↓→←↔※＊〽〓♪♫♬♩〇〒〶〠〄ⓍⓁⓎ<>\-\+=])/g.toString() +
                    ','
            ].join('\n'),
            description: '红色文本处理器的核心。根据前一句的结束时间来分隔句子，并将其分别发送给译者。\n' +
                '\n默认规则非常可靠，但可以随意更改。这些模式的行为是，任何与它们匹配的模式都将被删除并替换为简单的换行符。' +
                exports.PatternExplanation,
            name: '换行符模式',
            category: TranslationEngineOptionCategories.PATTERNS,
            priority: 2,
            formType: 'ace',
            formOptions: {
                aceMode: 'javascript',
                aceTheme: 'twilight',
                height: '100px'
            }
        });
        this.optionIsolatePatterns = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'isolatePatterns',
            default: [
                '// Names',
                /\\nw?[<\[].+?[\]>]/gi.toString() + ',',
                '// Isolate SG Quest Scripts',
                /<SG.+?>/gi.toString() + ',',
                '// Isolate colored text',
                /\\C\[.+?\].+?\\C\[.+?\]/gi.toString() + ',',
                '// Isolate SG Quest Scripts',
                /<SG.+?>/gi.toString() + ',',
                '// Carefully isolate quotes, except the ones that look like script',
                /((?<![A-Z])((\[[^\[]+\])|(\([^\(]+\))))/gi.toString() + ',',
                '// Isolates matching quoted text',
                ..._Constants_1.isolationGroupsRegExp
            ].join('\n'),
            description: '这将在括号内找到文本并将其单独翻译。\n' +
                "整个比赛将被隔离。这是最好的搭配捷径模式，也可以删除边界符号-翻译人员看不到引号或括号。" +
                exports.PatternExplanation,
            name: '隔离模式',
            category: TranslationEngineOptionCategories.PATTERNS,
            priority: 4,
            formType: 'ace',
            formOptions: {
                aceMode: 'javascript',
                aceTheme: 'twilight',
                height: '100px'
            }
        });
        this.optionSplitEndsPatterns = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'splitEndsPatterns',
            default: [
                "// Pure english, uncomment for sources that don't use english characters",
                '//' + /^[\x21-\x7E\* ]+$/g.toString() + ',',
                '// Comment?',
                /\/\/.+?$/g.toString() + ',',
                '// Untranslatable SG Quests',
                /^<SG((手動)|(カテゴリ)|(ピクチャ))[\s\S]*?>/gi.toString() + ',',
                /^<Category:.+?>/gi.toString() + ',',
                '// Translatable SG Quest',
                /^<SG.+?:/gi.toString() + ',',
                '// Names',
                /^\\n</g.toString() + ',',
                /\\nw\[/gi.toString() + ',',
                '// Colors at corners',
                /(^\\C\[.+?\])|\\C\[.+?\]$/gi.toString() + ',',
                '// Common script calls',
                /(^D_TEXT )|(^DW_[A-Z]+ )|(^addLog )|(^ShowInfo )|(^text_indicator :)|(^.+?subject=)/g.toString() +
                    ',',
                '// First we grab the arguments portion of a info: call, then we grab the info itself, leaving only the text',
                /^info:.+?\K(,\d+)+$/gi.toString() + ',',
                /^info:/gi.toString() + ',',
                '// Game Specific',
                /\s*\\\^\s*$/g.toString() + ',',
                /^\\>\s*(\s*\\C\[\d+?\]\s*)*/gi.toString() + ',',
                '// Conditional choice RPG Maker at the end',
                /\s*((if)|(en))\(.+?\)\s*$/gi.toString() + ',',
                '// Conditional choice RPG Maker at the start',
                /^\s*((if)|(en))\(.+?\)\s*/gi.toString() + ',',
                '// Brackets at start',
                /^\s*[〔〖〘〚〝｢〈《「『【（［\[\({＜<｛｟"'´`]+/g.toString() + ',',
                '// Brackets at end',
                /[\]\)}〕〗〙〛〞”｣〉》」』】）］＞>｝｠〟⟩"'`´]+\s*$/g.toString() + ',',
                '// Symbols at start',
                /(^\s*[ー～~─ｰ\-\\<>\/\|\\◆◎★■☆〇□△●♂♀⚤⚢⚨⚣⚩⚧⸸✞☦✝✟♱☥♁✙⚰️⛧♡♥❤♦♣♠•◘○◙♂♀♪♫►◄▲▼↑←↑→↓↓→←↔※＊〽〓♪♫♬♩〇〒〶〠〄ⓍⓁⓎ<>\-\+=]+)/g.toString() +
                    ',',
                '// Symbols at end',
                /([ー～~─ｰ\-\\<>\/\|\\◆◎★■☆〇□△●♂♀⚤⚢⚨⚣⚩⚧⸸✞☦✝✟♱☥♁✙⚰️⛧♡♥❤♦♣♠•◘○◙♂♀♪♫►◄▲▼↑←↑→↓↓→←↔※＊〽〓♪♫♬♩〇〒〶〠〄ⓍⓁⓎ<>\-\+=]+\s*$)/g.toString() +
                    ','
            ].join('\n'),
            description: '这些词用于在句子的开头或结尾与文本进行匹配。它的工作原理有点像拆分-匹配的符号将在翻译之前从句子中删除，然后再添加回来。\n' +
                '这最好用于删除对翻译过程没有好处的符号（如括号或引号），或保护脚本调用。' +
                exports.PatternExplanation,
            name: '捷径模式',
            category: TranslationEngineOptionCategories.PATTERNS,
            priority: 5,
            formType: 'ace',
            formOptions: {
                aceMode: 'javascript',
                aceTheme: 'twilight',
                height: '150px'
            }
        });
        this.processor = new processorClass();
        this.translatorEngine = new TranslatorEngine({
            author: thisAddon.package.author.name,
            version: thisAddon.package.version,
            ...extraOptions,
            optionsForm: {
                schema: {},
                form: []
            }
        });
        this.translatorEngine.optionsForm;
        this.translatorEngine.translate = (text, options) => {
            this.translate(text, options);
        };
        this.translatorEngine.abortTranslation = () => {
            this.abort();
        };
        this.translatorEngine.abort = this.translatorEngine.abortTranslation;
        this.translatorEngine.pause = () => {
            this.pause();
        };
        this.translatorEngine.resume = () => {
            this.resume();
        };
        // Listen for changes
        /* this.translatorEngine.on('update', (evt: Event, obj: { key: string; value: any }) => {
            let option = this.storedOptionsHash[obj.key];
            if (typeof option != 'undefined') {
                option.setValue(obj.value);
            }
            this.translatorEngine[obj.key] = obj.value;
        }); */
    }
    translate(rows, translationOptions) {
        if (document.getElementById('loadingOverlay').classList.contains('hidden')) {
            ui.showBusyOverlay();
        }
        let batchPerformance = new RedPerformance_1.RedPerformance();
        let savedSL, savedTL;
        try {
            savedSL = trans.getSl();
            savedTL = trans.getTl();
        }
        catch (e) {
            savedSL = 'ja';
            savedTL = 'en';
        }
        let options = Object.assign({
            onAfterLoading: () => { },
            onError: () => { },
            always: () => { },
            progress: () => { },
            sl: savedSL,
            tl: savedTL
        }, translationOptions);
        const getCacheKey = (text) => {
            return options.sl + options.tl + text;
        };
        this.processorInit();
        let process = this.processor.process(...rows);
        let toTranslate = process.getTranslatableLines();
        let translations = new Array(toTranslate.length);
        if (this.optionUseCache.getValue()) {
            this.cache.loadCache();
            // Remove cached lines
            for (let i = toTranslate.length - 1; i >= 0; i--) {
                let cacheKey = getCacheKey(toTranslate[i]);
                if (this.cache.hasCache(cacheKey)) {
                    translations[i] = this.cache.getCache(cacheKey);
                    toTranslate.splice(i, 1);
                }
            }
            if (toTranslate.length !== translations.length) {
                this.log(`[RedTranslator] 由于缓存命中，跳过了 ${translations.length - toTranslate.length} 句。`);
            }
        }
        /**
         * Rules for the main wrapper class:
         * "I don't care how the translation is done"
         * "I don't care how many lines it can translate at once"
         * "I just throw stuff around"
         * If there is a need for delay, doTranslate should handle it.
         * If there is a max length, doTranslate should handle it.
         * Any calls for external servers, etc, doTranslate handles it.
         */
        let result = {
            sourceText: rows.join(),
            translationText: '',
            source: rows,
            translation: []
        };
        this.log(`[RedTranslator] 正在将 ${toTranslate.length} 行（从 ${rows.length} 行处理）发送到 ${this.getEngine().name}。`);
        let translatorPerformance = new RedPerformance_1.RedPerformance();
        this.doTranslate(toTranslate, options)
            .then((translatedLines) => {
            // toTranslate matches translatedLines
            // translations matches initial translatableLines
            let outerIndex = 0;
            let innerIndex = 0;
            while (outerIndex < translatedLines.length) {
                while (translations[innerIndex] != undefined) {
                    innerIndex++;
                }
                if (this.optionUseCache.getValue()) {
                    if (translatedLines[outerIndex] !== undefined) {
                        let cacheKey = getCacheKey(toTranslate[outerIndex]);
                        this.cache.addCache(cacheKey, translatedLines[outerIndex]);
                    }
                }
                translations[innerIndex++] = translatedLines[outerIndex++];
            }
            process.setTranslatedLines(...translations);
            let translatedRows = process.getTranslatedLines();
            process.getWarnings().forEach((warning) => {
                const startMessage = '[RedTranslator] 处理器警告: ';
                let pad = ' '.repeat(startMessage.length);
                this.error([
                    `${startMessage}${warning.message}`,
                    `${pad}Original: ${warning.originalSentence}`,
                    `${pad}Current: ${warning.currentSentence}`,
                    `${pad}Placeholders: ${warning.placeholders}`
                ].join('\n'));
            });
            result.translationText = translatedRows.join();
            result.translation = translatedRows;
            options.onAfterLoading(result);
        })
            .catch((reason) => {
            options.onError(reason);
        })
            .finally(() => {
            ui.hideBusyOverlay();
            let start = '[RedTranslator] ';
            let pad = ' '.repeat(start.length);
            this.log(`${start}批处理耗时: ${batchPerformance.end().getSeconds()} 秒。`);
            this.log(`${pad}Performance: ${Math.round((10 * result.sourceText.length) / translatorPerformance.end().getSeconds()) / 10} 每秒字符数。 ${Math.round((10 * rows.length) / batchPerformance.getSeconds()) / 10} 每秒行数。`);
            if (this.optionCachePersistent.getValue()) {
                this.log('[RedTranslatorEngine] 正在将翻译缓存保存到文件。');
                this.cache.saveCache();
            }
            options.always();
        });
    }
    getEngine() {
        return this.translatorEngine;
    }
    getId() {
        return this.translatorEngine.id;
    }
    init() {
        let options = {
            form: [],
            schema: {}
        };
        this.storedOptions.sort((a, b) => {
            let ca = TranslationEngineOptionCategoriesPriority[a.getCategory()];
            let cb = TranslationEngineOptionCategoriesPriority[b.getCategory()];
            if (ca !== cb) {
                return ca - cb;
            }
            else {
                let pa = a.getPriority();
                let pb = b.getPriority();
                if (pa !== pb) {
                    return pa - pb;
                }
                else {
                    let na = a.getName().toLowerCase();
                    let nb = b.getName().toLowerCase();
                    return na < nb ? 1 : na > nb ? -1 : 0;
                }
            }
        });
        this.storedOptions.forEach((option) => {
            options.form.push({
                key: option.getId(),
                type: option.getFormType(),
                onChange: (evt) => {
                    if (option.getType() == 'boolean') {
                        let value = $(evt.target).prop('checked');
                        option.setValue(value);
                        this.translatorEngine.update(option.getId(), value);
                    }
                    else {
                        let value = $(evt.target).val();
                        option.setValue(value);
                        this.translatorEngine.update(option.getId(), option.getValue());
                    }
                },
                ...option.getFormOptions()
            });
            options.schema[option.getId()] = {
                type: option.getType(),
                title: option.getName(),
                description: option.getDescription(),
                default: option.getDefault(),
                ...option.getSchemaOptions()
            };
            this.translatorEngine[option.getId()] = option.getValue();
            if (option.getChildForm().length > 0) {
                option.getChildForm().forEach((childForm) => {
                    options.form.push(childForm);
                });
            }
        });
        options.form.push({
            type: 'actions',
            title: '重置 RegExps',
            fieldHtmlClass: 'actionButtonSet',
            items: [
                {
                    type: 'button',
                    title: '将设置重置为默认值（单击然后关闭要应用的选项）',
                    onClick: (evt) => {
                        this.storedOptions.forEach((option) => {
                            try {
                                // These don't work unfortunately. We'd need to reach the Ace Editor variable somehow. icba.
                                //(<any> window).clicked = evt;
                                //var $optionWindow = $((evt.target).parentNode.parentNode);
                                //$optionWindow.find(`[name="${option.getId()}"]`).val(option.getDefault());
                                option.setValue(option.getDefault());
                            }
                            catch (e) { }
                        });
                    }
                },
                {
                    type: 'button',
                    title: '空缓存（使用更好的翻译更新转换器时使用）',
                    onClick: () => {
                        this.cache.resetCache();
                        this.cache.saveCache();
                    }
                }
            ]
        });
        this.translatorEngine.optionsForm = options;
        this.translatorEngine.init();
    }
    addOption(option) {
        this.storedOptions.push(option);
        this.storedOptionsHash[option.getId()] = option;
    }
    getPatterns(str) {
        try {
            let arr = eval('[\n' + str + '\n]');
            return arr;
        }
        catch (e) {
            console.error('无法分析模式:', str, e);
            return [];
        }
    }
    getProcessingOrder() {
        // 'BREAK,ISOLATE,CUT,SPLIT,ESCAPE'
        const namesToType = {
            break: mtl_text_processor_1.TextProcessorOrderType.BREAK_LINES,
            isolate: mtl_text_processor_1.TextProcessorOrderType.ISOLATE_SENTENCES,
            escape: mtl_text_processor_1.TextProcessorOrderType.ESCAPE_SYMBOLS,
            cut: mtl_text_processor_1.TextProcessorOrderType.CUT_CORNERS,
            split: mtl_text_processor_1.TextProcessorOrderType.AGGRESSIVE_SPLITTING
        };
        let orderStringArray = this.optionProcessingOrder
            .getValue()
            .toLowerCase()
            .replaceAll(/[\.,;\/\|\\]/g, ',')
            .split(',');
        let order = [];
        orderStringArray.forEach((orderString) => {
            let type = namesToType[orderString];
            if (type !== undefined) {
                order.push(type);
            }
            else {
                console.error("找不到进程类型: " + orderString);
            }
        });
        return order;
    }
    processorInit() {
        this.processor.setOptions({
            placeholderRecoveryType: this.optionPlaceholderRecoveryType.getValue(),
            protectedPatternsPad: this.optionPadPlaceholder.getValue(),
            aggressiveSplittingPatterns: this.getPatterns(this.optionSplittingPatterns.getValue()),
            aggressiveSplittingTranslatable: false,
            agressiveSplittingNext: false,
            placeholderType: this.optionPlaceholderType.getValue(),
            noRepeat: true,
            mergeSequentialPlaceholders: true,
            maintainScripts: true,
            recoverPadding: true,
            trim: true,
            trimLines: true,
            protectedPatterns: this.getPatterns(this.optionProtectedPatterns.getValue()),
            processingOrder: this.getProcessingOrder(),
            isolateSymbolsPatterns: this.getPatterns(this.optionIsolatePatterns.getValue()),
            lineBreakPatterns: this.getPatterns(this.optionBreakPatterns.getValue()),
            lineBreakReplacement: '\n',
            protectCornersPatterns: this.getPatterns(this.optionSplitEndsPatterns.getValue())
        });
    }
    log(...texts) {
        let elements = [];
        texts.forEach((text) => {
            elements.push(document.createTextNode(text));
        });
        this.print(...elements);
    }
    error(...texts) {
        let elements = [];
        texts.forEach((text) => {
            elements.push(document.createTextNode(text));
        });
        this.printError(...elements);
    }
    print(...elements) {
        let consoleWindow = $('#loadingOverlay .console')[0];
        let pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        elements.forEach((element) => {
            pre.appendChild(element);
        });
        consoleWindow.appendChild(pre);
    }
    printError(...elements) {
        let consoleWindow = $('#loadingOverlay .console')[0];
        let pre = document.createElement('pre');
        pre.style.color = '#ff7b7b';
        pre.style.fontWeight = 'bold';
        pre.style.whiteSpace = 'pre-wrap';
        elements.forEach((element) => {
            pre.appendChild(element);
        });
        consoleWindow.appendChild(pre);
    }
}
exports.TranslationEngineWrapper = TranslationEngineWrapper;
