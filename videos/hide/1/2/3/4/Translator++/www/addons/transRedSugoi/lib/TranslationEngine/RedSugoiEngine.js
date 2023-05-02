"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedSugoiEngine = void 0;
const TranslationEngineOption_1 = require("./TranslationEngineOption");
const TranslationEngineWrapper_1 = require("./TranslationEngineWrapper");
class RedSugoiEngine extends TranslationEngineWrapper_1.TranslationEngineWrapper {
    constructor(processor, thisAddon) {
        super(processor, thisAddon, {
            id: 'redsugoi',
            name: 'Red Sugoi Translator',
            languages: {
                en: 'English',
                ja: 'Japanese'
            },
            batchDelay: 1,
            description: thisAddon.package.description,
            mode: 'rowByRow'
        });
        this.aborted = false;
        this.paused = false;
        this.pauseQueue = [];
        this.urlUsage = [];
        this.optionUrls = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'urls',
            default: ['http://localhost:14366/'].join('\n'),
            description: "Sugoi翻译服务器的URL。每行放置一个。将尝试平衡服务器之间的负载，以便每个服务器都有相同数量的活动请求打开，因此选择一个好的请求计数数字来匹配您的服务器也很重要（通常服务器数量的两倍就足够了）。\n" +
                "*非常重要:* Red Sugoi仅适用于Sugoi翻译服务器，这些服务器已修补以接受数组（分组文本而非单个文本）。如果您还没有这样做，则有必要使用t++Sugoi服务器管理器来修补您的Sugoi-下面提供了该按钮，但需要使用原始的Sugoi插件。\n" +
                '同样重要的是：始终仔细检查服务器地址是否正确。如果使用Sugoi服务器管理器进行设置，您可以使用他们的按钮在默认的Sugoi插件上设置值，我们在这里还有第二个按钮来复制这些值。',
            name: 'Sugoi Translator URLs',
            category: TranslationEngineWrapper_1.TranslationEngineOptionCategories.LIMITS,
            priority: -10,
            formType: 'textarea',
            formOptions: {
                height: '50px'
            },
            childForm: [
                {
                    type: 'actions',
                    title: '本地服务器管理器',
                    fieldHtmlClass: 'actionButtonSet',
                    items: [
                        {
                            type: 'button',
                            title: '打开Sugoi服务器管理器',
                            onClick: function () {
                                try {
                                    trans.sugoitrans.openServerManager();
                                }
                                catch (e) {
                                    alert("这需要Dreamsavior提供最新的Sugoi翻译插件，这只是一种快捷方式。对不起，小家伙。");
                                }
                            }
                        },
                        {
                            type: 'button',
                            title: '复制Sugoi加载项服务器URLs',
                            onClick: (evt) => {
                                try {
                                    window.clicked = evt;
                                    var optionWindow = $(evt.target.parentNode.parentNode);
                                    let engine = this.getEngine();
                                    optionWindow.find(`[name="urls"]`).val(trans.sugoitrans.targetUrl);
                                    engine.update('urls', trans.sugoitrans.targetUrl);
                                }
                                catch (e) {
                                    alert("这需要Dreamsavior提供最新的Sugoi翻译插件，这只是一种快捷方式。对不起，小家伙。");
                                }
                            }
                        }
                    ]
                }
            ]
        });
        this.optionRemoveBreaks = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'removeBreaks',
            default: false,
            description: [
                'Sugoi翻译不理解换行符。',
                "此选项在平移前用空格替换所有换行符。这一点还没有经过彻底的测试，因此目前还不知道这是否能提高翻译质量，但从理论上讲，它应该会提高翻译质量。"
            ].join('\n'),
            name: '删除换行符',
            category: TranslationEngineWrapper_1.TranslationEngineOptionCategories.OPTIONS
        });
        /**
         * Limits
         */
        this.optionMaxLength = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'maxTranslationLength',
            default: 100,
            description: [
                '每个服务器请求将发送的最大字符数。',
                "如果发送的文本超过RAM/VRAM的处理能力，Sugoi translator可能会崩溃，因此可以在此处设置上限。一般来说，这个数字越高，翻译过程就越快——只要你没有耗尽内存。默认值非常保守，可以随意增加它，直到您的硬件崩溃为止。",
                "注意：如果一个原子字符串（不能拆分）大于此数量，它仍将被完整发送，但将单独发送。"
            ].join('\n'),
            name: '请求字符限制',
            category: TranslationEngineWrapper_1.TranslationEngineOptionCategories.LIMITS,
            priority: -9
        });
        this.optionConcurrency = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'maxTranslationJobs',
            default: 2,
            description: '同时发送到服务器的最大请求量。如果是不会导致服务器停机的最佳数字。',
            name: '最大请求计数',
            category: TranslationEngineWrapper_1.TranslationEngineOptionCategories.LIMITS,
            priority: -8
        });
    }
    getUrl() {
        let urls = this.optionUrls.getValue().split(/\r?\n/g);
        if (this.urlUsage.length != urls.length) {
            this.urlUsage = new Array(urls.length).fill(0);
        }
        let leastUsed = this.urlUsage.indexOf(Math.min(...this.urlUsage));
        this.urlUsage[leastUsed]++;
        return {
            url: urls[leastUsed],
            index: leastUsed
        };
    }
    freeUrl(urlIndex) {
        this.urlUsage[urlIndex]--;
    }
    doTranslate(toTranslate, options) {
        this.resetStatus();
        let returnTranslations;
        let returnError;
        if (options.sl != 'ja') {
            this.error(`[RedSugoi] 该项目将源语言指定为非日语 (${options.sl})。由于Sugoi Translator只支持日语作为源代码，因此我们将使用日语。`);
        }
        if (options.tl != 'en') {
            this.error(`[RedSugoi] 该项目将目标语言指定为非英语 (${options.tl})。由于Sugoi Translator只支持英语作为目的地，因此我们将使用英语。`);
        }
        let translations = new Array(toTranslate.length);
        let translatingIndex = 0;
        let completeThreads = 0;
        let totalThreads = this.optionConcurrency.getValue();
        totalThreads = totalThreads < 1 ? 1 : totalThreads;
        let maximumBatchSize = this.optionMaxLength.getValue();
        let complete = () => {
            if (++completeThreads == totalThreads) {
                returnTranslations(translations);
            }
        };
        let translationProgress = document.createTextNode('0');
        let translatedCount = 0;
        let errorProgress = document.createTextNode('');
        let errorCount = 0;
        this.print(document.createTextNode('[RedSugoi] 翻译文本: '), translationProgress, document.createTextNode('/' + toTranslate.length), errorProgress);
        const updateTranslatedCount = (count) => {
            translatedCount += count;
            translationProgress.nodeValue = translatedCount.toString();
            options.progress(Math.round((100 * translatedCount) / toTranslate.length));
        };
        const updateErrorCount = (count) => {
            errorCount += count;
            errorProgress.nodeValue = ' (' + errorCount.toString() + ' 翻译失败)';
        };
        let serverScores = {};
        let startThread = () => {
            if (this.aborted) {
                returnError('已中止。');
            }
            if (this.paused) {
                this.pauseQueue.push(() => {
                    startThread();
                });
                return;
            }
            let batchLength = 0;
            let batch = [];
            let batchIndexes = [];
            while (translatingIndex < toTranslate.length) {
                let index = translatingIndex;
                if (toTranslate[index] !== undefined &&
                    (batchLength == 0 ||
                        batchLength + toTranslate[index].length <= maximumBatchSize)) {
                    if (this.optionRemoveBreaks.getValue()) {
                        toTranslate[index] = toTranslate[index].replaceAll(/\r?\n/g, ' ');
                    }
                    batch.push(toTranslate[index]);
                    batchIndexes.push(index);
                    batchLength += toTranslate[index].length;
                    translatingIndex++;
                }
                else {
                    break;
                }
            }
            if (batch.length == 0) {
                complete();
            }
            else {
                let myServer = this.getUrl();
                if (serverScores[myServer.url] == undefined) {
                    serverScores[myServer.url] = 0;
                }
                fetch(myServer.url, {
                    method: 'post',
                    body: JSON.stringify({ content: batch, message: '翻译句子' }),
                    headers: { 'Content-Type': 'application/json' }
                })
                    .then(async (response) => {
                    if (response.ok) {
                        serverScores[myServer.url] += batch.length;
                        let result = await response.json();
                        console.log('[RedSugoi] 获取自 ' + myServer.url, result);
                        if (result.length != batch.length) {
                            console.error('[REDSUGOI] 响应不匹配:', batch, result);
                            throw new Error(`收到无效响应-长度不匹配，请检查服务器稳定性。`);
                        }
                        else {
                            for (let i = 0; i < batch.length; i++) {
                                translations[batchIndexes[i]] = result[i];
                            }
                        }
                        updateTranslatedCount(batch.length);
                    }
                    else {
                        throw new Error(`${response.status.toString()} - ${response.statusText}`);
                    }
                })
                    .catch((error) => {
                    updateErrorCount(batch.length);
                    console.error('[REDSUGOI] 使用获取时出错 ' + myServer, '   有效载荷: ' + batch.join('\n'), error);
                    this.error(`[RedSugoi] 从中提取时出错 ${myServer.url} - ${error.name}: ${error.message}\n${' '.repeat(11)}如果此服务器上的所有提取尝试都失败，请检查它是否仍在运行。`);
                })
                    .finally(() => {
                    this.freeUrl(myServer.index);
                    startThread();
                });
            }
        };
        return new Promise((resolve, reject) => {
            returnTranslations = resolve;
            returnError = reject;
            for (let i = 0; i < totalThreads; i++) {
                startThread();
            }
        });
    }
    resetStatus() {
        this.aborted = false;
        this.paused = false;
        this.pauseQueue = [];
    }
    abort() {
        this.aborted = true;
    }
    pause() {
        this.paused = true;
    }
    resume() {
        this.paused = false;
        this.pauseQueue.forEach((action) => {
            action();
        });
        this.pauseQueue = [];
    }
}
exports.RedSugoiEngine = RedSugoiEngine;
