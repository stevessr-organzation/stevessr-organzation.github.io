"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedGoogleEngine = void 0;
const TranslationEngineOption_1 = require("./TranslationEngineOption");
const TranslationEngineWrapper_1 = require("./TranslationEngineWrapper");
class RedGoogleEngine extends TranslationEngineWrapper_1.TranslationEngineWrapper {
    constructor(processor, thisAddon) {
        super(processor, thisAddon, {
            id: 'redgoogles',
            name: 'Red Google Translator',
            languages: {
                af: 'Afrikaans',
                sq: 'Albanian',
                am: 'Amharic',
                ar: 'Arabic',
                hy: 'Armenian',
                az: 'Azerbaijani',
                eu: 'Basque',
                be: 'Belarusian',
                bn: 'Bengali',
                bs: 'Bosnian',
                bg: 'Bulgarian',
                ca: 'Catalan',
                ceb: 'Cebuano',
                'zh-CN': 'Chinese (Simplified)',
                'zh-TW': 'Chinese (Traditional)',
                co: 'Corsican',
                hr: 'Croatian',
                cs: 'Czech',
                da: 'Danish',
                nl: 'Dutch',
                en: 'English',
                eo: 'Esperanto',
                et: 'Estonian',
                fi: 'Finnish',
                fr: 'French',
                fy: 'Frisian',
                gl: 'Galician',
                ka: 'Georgian',
                de: 'German',
                el: 'Greek',
                gu: 'Gujarati',
                ht: 'Haitian Creole',
                ha: 'Hausa',
                haw: 'Hawaiian',
                he: 'Hebrew',
                hi: 'Hindi',
                hmn: 'Hmong',
                hu: 'Hungarian',
                is: 'Icelandic',
                ig: 'Igbo',
                id: 'Indonesian',
                ga: 'Irish',
                it: 'Italian',
                ja: 'Japanese',
                jw: 'Javanese',
                kn: 'Kannada',
                kk: 'Kazakh',
                km: 'Khmer',
                ko: 'Korean',
                ku: 'Kurdish',
                ky: 'Kyrgyz',
                lo: 'Lao',
                la: 'Latin',
                lv: 'Latvian',
                lt: 'Lithuanian',
                lb: 'Luxembourgish',
                mk: 'Macedonian',
                mg: 'Malagasy',
                ms: 'Malay',
                ml: 'Malayalam',
                mt: 'Maltese',
                mi: 'Maori',
                mr: 'Marathi',
                mn: 'Mongolian',
                my: 'Myanmar (Burmese)',
                ne: 'Nepali',
                no: 'Norwegian',
                ny: 'Nyanja (Chichewa)',
                ps: 'Pashto',
                fa: 'Persian',
                pl: 'Polish',
                pt: 'Portuguese (Portugal, Brazil)',
                pa: 'Punjabi',
                ro: 'Romanian',
                ru: 'Russian',
                sm: 'Samoan',
                gd: 'Scots Gaelic',
                sr: 'Serbian',
                st: 'Sesotho',
                sn: 'Shona',
                sd: 'Sindhi',
                si: 'Sinhala (Sinhalese)',
                sk: 'Slovak',
                sl: 'Slovenian',
                so: 'Somali',
                es: 'Spanish',
                su: 'Sundanese',
                sw: 'Swahili',
                sv: 'Swedish',
                tl: 'Tagalog (Filipino)',
                tg: 'Tajik',
                ta: 'Tamil',
                te: 'Telugu',
                th: 'Thai',
                tr: 'Turkish',
                uk: 'Ukrainian',
                ur: 'Urdu',
                uz: 'Uzbek',
                vi: 'Vietnamese',
                cy: 'Welsh',
                xh: 'Xhosa',
                yi: 'Yiddish',
                yo: 'Yoruba',
                zu: 'Zulu'
            },
            batchDelay: 1,
            description: '谷歌翻译使用与Red Sugoi相同的文本处理器。 \n请注意，设置是分开的，因此可以在它们之间有不同的模式。',
            mode: 'rowByRow'
        });
        this.aborted = false;
        this.paused = false;
        this.pauseQueue = [];
        this.lastRequest = 0;
        this.optionUrl = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'urls',
            default: 'https://translate.google.com/translate_a/single',
            description: "谷歌翻译服务器的URL。希望永远不会改变。",
            name: '目标 URL',
            category: TranslationEngineWrapper_1.TranslationEngineOptionCategories.LIMITS,
            priority: -10
        });
        /**
         * Limits
         */
        this.optionMaxLength = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'maxTranslationLength',
            default: 800,
            description: [
                '每个服务器请求将发送的最大字符数。',
                '如果你发送的邮件太多，谷歌只会拒绝你的请求。',
                "注意：如果一个原子字符串（不能拆分）大于此数量，它仍将被完整发送，但将单独发送。"
            ].join('\n'),
            name: '请求字符限制',
            category: TranslationEngineWrapper_1.TranslationEngineOptionCategories.LIMITS,
            priority: -9
        });
        this.optionInnerDelay = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'innerDelay',
            default: 6000,
            description: '请求之间等待的时间量（毫秒）。时间越长，你被谷歌拦截的可能性就越小。低于6秒的数字往往在翻译几次后就会被禁止。',
            name: '内部延迟',
            category: TranslationEngineWrapper_1.TranslationEngineOptionCategories.LIMITS,
            priority: -8
        });
        this.optionLineDelimiter = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'googleLineDelimiter',
            default: '<tr>',
            description: "谷歌只接受单一输入，但我们正在翻译许多文本。因此，我们必须标记一个文本何时结束，另一个文本何时开始。这个值是多少并不重要，只要它是谷歌不会触摸或移动的东西。谷歌喜欢HTML标签。",
            name: '行分隔符',
            category: TranslationEngineWrapper_1.TranslationEngineOptionCategories.OPTIONS,
            priority: -10
        });
    }
    doTranslate(toTranslate, options) {
        this.resetStatus();
        let returnTranslations;
        let returnError;
        let translations = new Array(toTranslate.length);
        let translatingIndex = 0;
        let completeThreads = 0;
        let maximumBatchSize = this.optionMaxLength.getValue();
        let complete = () => {
            returnTranslations(translations);
        };
        let translationProgress = document.createTextNode('0');
        let translatedCount = 0;
        let errorProgress = document.createTextNode('');
        let errorCount = 0;
        let statusProgress = document.createTextNode('启动！');
        this.print(document.createTextNode('[RedGoogle] 翻译文本: '), translationProgress, document.createTextNode('/' + toTranslate.length), errorProgress, document.createTextNode(' - 当前状态: '), statusProgress);
        const updateTranslatedCount = (count) => {
            translatedCount += count;
            translationProgress.nodeValue = translatedCount.toString();
            options.progress(Math.round((100 * translatedCount) / toTranslate.length));
        };
        const updateErrorCount = (count) => {
            errorCount += count;
            errorProgress.nodeValue = ' (' + errorCount.toString() + ' 翻译失败)';
        };
        let startThread = () => {
            if (this.aborted) {
                returnError('已中止。');
                startThread = () => { };
                return;
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
                let sendToGoogle = () => {
                    statusProgress.nodeValue = '发送到谷歌！';
                    let rowSeparator = this.optionLineDelimiter.getValue();
                    common.fetch(this.optionUrl.getValue(), {
                        method: 'get',
                        data: {
                            client: 'gtx',
                            sl: options.sl,
                            tl: options.tl,
                            dt: 't',
                            q: batch.join('\n' + rowSeparator)
                        }
                        //headers		: { 'Content-Type': 'application/json' },
                    })
                        .then((data) => {
                        statusProgress.nodeValue = '阅读响应...';
                        let googleTranslations = data[0]; // Each line becomes a translation...
                        let uglyTranslations = [];
                        for (let i = 0; i < googleTranslations.length; i++) {
                            uglyTranslations.push(googleTranslations[i][0]);
                        }
                        let cleanTranslations = uglyTranslations.join('\n');
                        // Google doesn't destroy tags, but it adds spaces... "valid HTML" I guess.
                        cleanTranslations = cleanTranslations.replaceAll(/ *< */g, '<');
                        cleanTranslations = cleanTranslations.replaceAll(/ *> */g, '>');
                        // Fuck empty lines
                        cleanTranslations = cleanTranslations.replaceAll(/[\n]{2,}/g, '\n');
                        // Fuck spaces at the end of lines
                        cleanTranslations = cleanTranslations.replaceAll(/ *\n/g, '\n');
                        // Case consistency
                        cleanTranslations = cleanTranslations.replaceAll(new RegExp(rowSeparator, 'gi'), rowSeparator);
                        // we want to ignore line breaks on the sides of the row separator
                        cleanTranslations = cleanTranslations.replaceAll('\n' + rowSeparator, rowSeparator);
                        cleanTranslations = cleanTranslations.replaceAll(rowSeparator + '\n', rowSeparator);
                        // Japanese loves repeating sentence enders !!!
                        // Google does not
                        cleanTranslations = cleanTranslations.replaceAll(/\n!/g, '!');
                        cleanTranslations = cleanTranslations.replaceAll(/\n\?/g, '?');
                        cleanTranslations = cleanTranslations.replaceAll(/\n\./g, '.');
                        cleanTranslations = cleanTranslations.replaceAll(/\n;/g, ';');
                        let pristineTranslations = cleanTranslations.split(rowSeparator);
                        if (pristineTranslations.length != batch.length) {
                            updateErrorCount(batch.length);
                            this.error(`[RedGoogle] 批次因不匹配而中断。我们发送了 ${batch.length} 个句子，得到了 ${pristineTranslations.length} 。跳过它们。您可以在开发控制台（F12）中找到更多详细信息。`);
                            console.warn('[RedGoogle]', {
                                batch: batch,
                                received: data[0],
                                pristine: pristineTranslations
                            });
                            console.error('[RedGoogle] 我们的 ' +
                                rowSeparator +
                                ' 应该在那里的某个地方，以某种方式改变。也许我们需要一个不同的？');
                        }
                        else {
                            for (let i = 0; i < pristineTranslations.length; i++) {
                                translations[batchIndexes[i]] = pristineTranslations[i].trim(); // Google loves spaces...
                            }
                            updateTranslatedCount(batch.length);
                        }
                    })
                        .catch((e) => {
                        statusProgress.nodeValue = 'DOH!';
                        this.error('[Red Google] 提取时出错: ' + e.message + '。跳过批处理。');
                    })
                        .finally(() => {
                        this.lastRequest = Date.now();
                        startThread();
                    });
                };
                let now = Date.now();
                if (now - this.lastRequest > this.optionInnerDelay.getValue()) {
                    this.lastRequest = now;
                    sendToGoogle();
                }
                else {
                    statusProgress.nodeValue = '等待内部延迟...';
                    setTimeout(sendToGoogle, this.optionInnerDelay.getValue() - (now - this.lastRequest));
                }
            }
        };
        return new Promise((resolve, reject) => {
            returnTranslations = resolve;
            returnError = reject;
            startThread();
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
exports.RedGoogleEngine = RedGoogleEngine;
