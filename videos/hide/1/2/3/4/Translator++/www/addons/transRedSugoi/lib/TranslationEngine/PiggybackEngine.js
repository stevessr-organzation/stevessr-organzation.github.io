"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PiggybackEngine = void 0;
const TranslationEngineOption_1 = require("./TranslationEngineOption");
const TranslationEngineWrapper_1 = require("./TranslationEngineWrapper");
class PiggybackEngine extends TranslationEngineWrapper_1.TranslationEngineWrapper {
    constructor(processor, thisAddon) {
        super(processor, thisAddon, {
            id: 'redpiggy',
            name: 'Red Piggyback Translator',
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
            description: '尝试将文本处理器应用于您可能拥有的任何翻译器。',
            mode: 'rowByRow'
        });
        this.aborted = false;
        this.paused = false;
        this.pauseQueue = [];
        this.lastRequest = 0;
        this.optionTranslator = new TranslationEngineOption_1.TranslationEngineOption({
            wrapper: this,
            id: 'chosenTranslator',
            default: 'deepl',
            description: '使用哪个转换器',
            name: '目标翻译器',
            category: TranslationEngineWrapper_1.TranslationEngineOptionCategories.OPTIONS,
            priority: -1000,
            formType: 'select',
            schemaOptions: {
                enum: Object.values(trans.translator)
                    .filter((a) => {
                    return a.indexOf('red') != 0;
                })
                    .sort()
            },
            formOptions: {
                titleMap: {
                    ...(() => {
                        let names = {};
                        let ids = Object.values(trans.translator)
                            .filter((a) => {
                            return a.indexOf('red') != 0;
                        })
                            .sort();
                        ids.forEach((id) => {
                            names[id] = trans[id].name;
                        });
                        return names;
                    })()
                }
            }
        });
    }
    doTranslate(toTranslate, options) {
        this.resetStatus();
        let returnTranslations;
        let returnError;
        let translations = new Array(toTranslate.length);
        let translatingIndex = 0;
        let completeThreads = 0;
        let engine = trans[this.optionTranslator.getValue()];
        let maximumBatchSize = engine.maxRequestLength === undefined ? 500 : engine.maxRequestLength;
        let innerDelay = engine.batchDelay;
        let complete = () => {
            returnTranslations(translations);
        };
        let translationProgress = document.createTextNode('0');
        let translatedCount = 0;
        let errorProgress = document.createTextNode('');
        let errorCount = 0;
        let statusProgress = document.createTextNode('启动！');
        this.print(document.createTextNode('[RedPiggy] 翻译文本 (' + engine.name + '): '), translationProgress, document.createTextNode('/' + toTranslate.length), errorProgress, document.createTextNode(' - 当前状态: '), statusProgress);
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
                let sendToTranslator = () => {
                    statusProgress.nodeValue = '发送给翻译！';
                    let always = () => {
                        always = () => { };
                        this.lastRequest = Date.now();
                        startThread();
                    };
                    engine.translate(batch, {
                        sl: options.sl,
                        tl: options.tl,
                        onAfterLoading: (result) => {
                            if (result.translation.length != batch.length) {
                                updateErrorCount(batch.length);
                                this.error(`[RedPiggy] 批次因不匹配而中断。我们发送了 ${batch.length} 个句子，得到了 ${result.translation.length} 。跳过它们。您可以在开发控制台（F12）中找到更多详细信息。`);
                                console.warn('[RedPiggy]', {
                                    batch: batch,
                                    received: result.translations
                                });
                            }
                            else {
                                for (let i = 0; i < result.translation.length; i++) {
                                    translations[batchIndexes[i]] = result.translation[i];
                                }
                                updateTranslatedCount(batch.length);
                            }
                            always();
                        },
                        onError: (reason) => {
                            statusProgress.nodeValue = 'DOH!';
                            this.error('[Red Piggy] 提取时出错: ' + reason + '。跳过批处理。');
                        },
                        always: always
                    });
                };
                let now = Date.now();
                if (now - this.lastRequest > innerDelay) {
                    this.lastRequest = now;
                    sendToTranslator();
                }
                else {
                    statusProgress.nodeValue = '等待内部延迟...';
                    setTimeout(sendToTranslator, innerDelay - (now - this.lastRequest));
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
exports.PiggybackEngine = PiggybackEngine;
