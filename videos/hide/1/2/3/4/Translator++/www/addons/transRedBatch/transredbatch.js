"use strict";
class RedBatchTranslatorButton {
}
class RedBatchTranslatorWindow {
    constructor(parent) {
        this.$monster = $(`
    <div class='ui-widget-overlay ui-front' style='opacity: 1; background-color: rgba(170, 170, 170, 0.3); display: flex; justify-content: center; align-items: center;'><div style='background-color: white; width: 600px; font-size: 1.2ex; position: relative;'><div style='background-color: black; color: white; line-height: 30px; padding-left: 10px;'><h1 style='margin:0px'>Red Batch Translation</h1></div><div style='padding: 10px;'><h2 style='margin: 0px;'>选择转换器<select id='redBatchTranslatorSelect' style='margin-left: 2ex'></select></h2><hr><div class='flex col-2'><div class='fieldmember sourceCol'><h2 style='margin:0px'>源列</h2><label class='columnSelector'><select id='redBatchTranslatorSourceSelect'></select></label><div class='smallInfo'>要翻译的源文本是哪一列？<br>（默认值为键列/最左边的列）。</div></div><div class='fieldmember'><h2 style='margin:0px'>目标列</h2><label class='targetCol'><select id='redBatchTranslatorDestinationSelect'></select></label><div class='smallInfo'>翻译后的文本放在哪一列。<br>（不能与源列相同）</div></div></div><hr><h2 style='margin: 0px; margin-bottom: 1ex;'>选项</h2><label class='flex fullWidth bottomSpace'><div class='flexMain'><h3 class='label' style='margin: 0px;'>保存每个批次</h3><div class='info'>如果选中，则在每次批转换后保存项目。</div></div><div><input checked='true' class='flipSwitch translateOther' id='redBatchTranslatorSave' type='checkbox' value='1'></div></label><label class='flex fullWidth bottomSpace'><div class='flexMain'><h3 class='label' style='margin: 0px;'>忽略已翻译</h3><div class='info'>如果选中此选项，将不会翻译具有翻译的行。</div></div><div><input checked='true' class='flipSwitch translateOther' id='redBatchTranslatorIgnore' type='checkbox' value='1'></div></label><label class='flex fullWidth bottomSpace'><div class='flexMain'><h3 class='label' style='margin: 0px;'>严格的白名单</h3><div class='info'>如果选中，则没有标记的行可能会使白名单失败。</div></div><div><input class='flipSwitch translateOther' id='redBatchTranslatorStrict' type='checkbox' value='1'></div></label><hr><div class='options fieldgroup' id='redBatchTranslatorBlacklist'><div class='fieldmember'><h2 style='margin: 0px;'>黑名单</h2><div class='info'>将不会转换具有任何选定标记的行</div><div class='colorTagSelector'><div class='uiTags uiTagsWrapper rendered' data-mark='unknown'><input checked='true' class='colorTagSelector tagSelector red' name='tagSelector' style='background-color: rgb(255, 0, 0);' title='red' type='checkbox' value='red'><input class='colorTagSelector tagSelector yellow' name='tagSelector' style='background-color: rgb(255, 255, 0);' title='yellow' type='checkbox' value='yellow'><input class='colorTagSelector tagSelector green' name='tagSelector' style='background-color: rgb(0, 128, 0);' title='green' type='checkbox' value='green'><input class='colorTagSelector tagSelector blue' name='tagSelector' style='background-color: rgb(0, 0, 255);' title='blue' type='checkbox' value='blue'><input class='colorTagSelector tagSelector gold' name='tagSelector' style='background-color: rgb(212, 175, 55);' title='gold' type='checkbox' value='gold'><input class='colorTagSelector tagSelector purple' name='tagSelector' style='background-color: rgb(128, 0, 128);' title='purple' type='checkbox' value='purple'><input class='colorTagSelector tagSelector black' name='tagSelector' style='background-color: rgb(0, 0, 0);' title='black' type='checkbox' value='black'><input class='colorTagSelector tagSelector gray' name='tagSelector' style='background-color: rgb(128, 128, 128);' title='gray' type='checkbox' value='gray'><input class='colorTagSelector tagSelector white' name='tagSelector' style='background-color: rgb(255, 255, 255);' title='white' type='checkbox' value='white'><input class='colorTagSelector tagSelector silver' name='tagSelector' style='background-color: rgb(192, 192, 192);' title='silver' type='checkbox' value='silver'><input class='colorTagSelector tagSelector pink' name='tagSelector' style='background-color: rgb(255, 192, 203);' title='pink' type='checkbox' value='pink'><input class='colorTagSelector tagSelector indigo' name='tagSelector' style='background-color: rgb(75, 0, 130);' title='indigo' type='checkbox' value='indigo'><input class='colorTagSelector tagSelector aqua' name='tagSelector' style='background-color: rgb(0, 255, 255);' title='aqua' type='checkbox' value='aqua'><input class='colorTagSelector tagSelector tan' name='tagSelector' style='background-color: rgb(210, 180, 140);' title='tan' type='checkbox' value='tan'><input class='colorTagSelector tagSelector darkred' name='tagSelector' style='background-color: rgb(139, 0, 0);' title='darkred' type='checkbox' value='darkred'></div></div></div></div><hr><div class='options fieldgroup' id='redBatchTranslatorWhitelist'><div class='fieldmember'><h2 style='margin: 0px;'>白名单</h2><div class='info'>如果选择了以下任何颜色，则仅转换具有该颜色的行。这将覆盖黑名单。</div><div class='colorTagSelector'><div class='uiTags uiTagsWrapper rendered' data-mark='unknown'><input class='colorTagSelector tagSelector red' name='tagSelector' style='background-color: rgb(255, 0, 0);' title='red' type='checkbox' value='red'><input class='colorTagSelector tagSelector yellow' name='tagSelector' style='background-color: rgb(255, 255, 0);' title='yellow' type='checkbox' value='yellow'><input class='colorTagSelector tagSelector green' name='tagSelector' style='background-color: rgb(0, 128, 0);' title='green' type='checkbox' value='green'><input class='colorTagSelector tagSelector blue' name='tagSelector' style='background-color: rgb(0, 0, 255);' title='blue' type='checkbox' value='blue'><input class='colorTagSelector tagSelector gold' name='tagSelector' style='background-color: rgb(212, 175, 55);' title='gold' type='checkbox' value='gold'><input class='colorTagSelector tagSelector purple' name='tagSelector' style='background-color: rgb(128, 0, 128);' title='purple' type='checkbox' value='purple'><input class='colorTagSelector tagSelector black' name='tagSelector' style='background-color: rgb(0, 0, 0);' title='black' type='checkbox' value='black'><input class='colorTagSelector tagSelector gray' name='tagSelector' style='background-color: rgb(128, 128, 128);' title='gray' type='checkbox' value='gray'><input class='colorTagSelector tagSelector white' name='tagSelector' style='background-color: rgb(255, 255, 255);' title='white' type='checkbox' value='white'><input class='colorTagSelector tagSelector silver' name='tagSelector' style='background-color: rgb(192, 192, 192);' title='silver' type='checkbox' value='silver'><input class='colorTagSelector tagSelector pink' name='tagSelector' style='background-color: rgb(255, 192, 203);' title='pink' type='checkbox' value='pink'><input class='colorTagSelector tagSelector indigo' name='tagSelector' style='background-color: rgb(75, 0, 130);' title='indigo' type='checkbox' value='indigo'><input class='colorTagSelector tagSelector aqua' name='tagSelector' style='background-color: rgb(0, 255, 255);' title='aqua' type='checkbox' value='aqua'><input class='colorTagSelector tagSelector tan' name='tagSelector' style='background-color: rgb(210, 180, 140);' title='tan' type='checkbox' value='tan'><input class='colorTagSelector tagSelector darkred' name='tagSelector' style='background-color: rgb(139, 0, 0);' title='darkred' type='checkbox' value='darkred'></div></div></div></div></div><div class='ui-dialog-buttonset' style='text-align: right; position: absolute; bottom: 4px; right: 4px;'><button class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' icon='ui-icon-close' id='redBatchTranslatorClose' role='button' type='button'><span class='ui-button-text'>取消</span></button><button class='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only' icon='ui-icon-plus' id='redBatchTranslatorTranslate' role='button' type='button'><span class='ui-button-text'>立即翻译</span></button></div></div></div>
    `);
        this.parent = parent;
        this.monster = this.$monster[0];
        // Search the monster for our elements
        this.selectTrans = this.$monster.find("#redBatchTranslatorSelect")[0];
        this.selectSource = this.$monster.find("#redBatchTranslatorSourceSelect")[0];
        this.selectDestination = this.$monster.find("#redBatchTranslatorDestinationSelect")[0];
        this.checkSave = this.$monster.find("#redBatchTranslatorSave")[0];
        this.checkIgnore = this.$monster.find("#redBatchTranslatorIgnore")[0];
        this.checkStrict = this.$monster.find("#redBatchTranslatorStrict")[0];
        this.blacklistContainer = this.$monster.find("#redBatchTranslatorBlacklist")[0];
        this.whitelistContainer = this.$monster.find("#redBatchTranslatorWhitelist")[0];
        // Buttons
        this.$monster.find("#redBatchTranslatorClose")[0].addEventListener("click", () => {
            this.close();
        });
        this.$monster.find("#redBatchTranslatorTranslate")[0].addEventListener("click", () => {
            this.close();
            this.translate();
        });
    }
    open() {
        this.updateColumns();
        this.updateTranslatorsSelect();
        // Show
        document.body.appendChild(this.monster);
    }
    translate() {
        // Do we have some files or not?
        let files = trans.getCheckedFiles();
        if (files.length == 0) {
            files = trans.getAllFiles();
        }
        let options = {
            translator: this.selectTrans.value,
            source: parseInt(this.selectSource.value),
            destination: parseInt(this.selectDestination.value),
            ignoreTranslated: this.checkIgnore.checked,
            strict: this.checkStrict.checked,
            saveOnEachBatch: this.checkSave.checked,
            blacklist: this.getTags(this.blacklistContainer),
            whitelist: this.getTags(this.whitelistContainer),
            files: files
        };
        this.parent.translateProject(options);
    }
    getTags(container) {
        let tags = [];
        let elements = container.getElementsByClassName("tagSelector");
        for (let i = 0; i < elements.length; i++) {
            let element = elements[i];
            if (element.checked) {
                tags.push(element.title);
            }
        }
        return tags;
    }
    close() {
        document.body.removeChild(this.monster);
    }
    updateColumns() {
        let oldSource = this.selectSource.value != "" ? this.selectSource.value : "0";
        let oldDestination = this.selectDestination.value != "" ? this.selectDestination.value : "1";
        // Remove old
        while (this.selectSource.firstChild) {
            this.selectSource.removeChild(this.selectSource.firstChild);
        }
        while (this.selectDestination.firstChild) {
            this.selectDestination.removeChild(this.selectDestination.firstChild);
        }
        // Array of names = trans.colHeaders
        for (let i = 0; i < trans.colHeaders.length; i++) {
            this.selectSource.appendChild($(`<option value="${i}">${trans.colHeaders[i]}</option>`)[0]);
            if (i > 0) {
                this.selectDestination.appendChild($(`<option value="${i}">${trans.colHeaders[i]}</option>`)[0]);
            }
        }
        this.selectSource.value = oldSource;
        this.selectDestination.value = oldDestination;
        document.addEventListener("keydown", (ev) => {
            if (this.monster.parentNode == document.body && ev.key == "Escape") {
                ev.preventDefault();
                this.parent.close();
            }
        });
    }
    updateTranslatorsSelect() {
        let oldTrans = this.selectTrans.value == "" ? trans.project.options.translator : this.selectTrans.value;
        // Remove old
        while (this.selectTrans.firstChild) {
            this.selectTrans.removeChild(this.selectTrans.firstChild);
        }
        let transOptions = [];
        for (let i = 0; i < trans.translator.length; i++) {
            let id = trans.translator[i];
            let name = trans[id].name;
            let option = document.createElement("option");
            option.value = id;
            option.appendChild(document.createTextNode(name));
            transOptions.push(option);
        }
        transOptions.sort((a, b) => {
            let na = a.innerText.toUpperCase();
            let nb = b.innerText.toUpperCase();
            if (na > nb)
                return 1;
            else if (na < nb)
                return -1;
            return 0;
        });
        transOptions.forEach((option) => {
            this.selectTrans.appendChild(option);
        });
        this.selectTrans.value = oldTrans;
    }
}
class RedBatchTranslatorRow {
    constructor(file, index) {
        this.location = [file, index];
    }
    getValue(source) {
        return trans.project.files[this.location[0]].data[this.location[1]][source];
    }
    isEmpty(source) {
        let value = this.getValue(source);
        return value == undefined || value == null || value == "";
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
        this.saving = false;
        this.saveAgain = false;
        this.window = new RedBatchTranslatorWindow(this);
    }
    open() {
        this.window.open();
    }
    close() {
        this.window.close();
    }
    refresh() {
        trans.refreshGrid();
        trans.evalTranslationProgress();
    }
    translateProject(options) {
        let aborted = false;
        ui.showLoading({ buttons: [
                {
                    text: "Abort",
                    onClick: () => {
                        if (confirm(t("是否确实要中止？"))) {
                            aborted = true; // :/
                            trans.abortTranslation();
                            this.refresh();
                        }
                    }
                },
                { text: "Pause",
                    onClick: () => {
                        alert(t("进程已暂停！\n按“确定”继续！"));
                    }
                },
            ] });
        ui.loadingProgress(0, "启动...");
        ui.log(`[RedBatchTranslator] 开始翻译时间 ${new Date()}`);
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
            console.log(`[RedBatchTranslator] 正在处理 ${options.files[i]}...`);
            let file = options.files[i];
            let data = trans.project.files[file].data;
            for (let k = 0; k < data.length; k++) {
                let row = new RedBatchTranslatorRow(file, k);
                // Repeating work?
                if (options.ignoreTranslated && row.isTranslated()) {
                    continue;
                }
                // Empty row?
                if (row.isEmpty(options.source)) {
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
            let text = rows[i].getValue(options.source);
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
            ui.loadingProgress(0, `正在转换批处理 ${batchIndex + 1} 中的 ${batches.length}`);
            let myBatch = batchIndex++;
            let alwaysSafeguard = undefined; // Stupid nodejs Timeout type
            let safeguardAlways = () => {
                if (alwaysSafeguard == undefined) {
                    alwaysSafeguard = setTimeout(always, 100);
                }
            };
            let always = () => {
                if (alwaysSafeguard != undefined) {
                    clearTimeout(alwaysSafeguard);
                    alwaysSafeguard = undefined;
                }
                let proceed = () => {
                    if (batchIndex >= batches.length) {
                        let batchEnd = Date.now();
                        ui.log(`[RedBatchTranslator] 已在完成翻译 ${new Date()}`);
                        ui.log(`[RedBatchTranslator] 花费 ${Math.round(10 * (batchEnd - batchStart) / 1000) / 10} 秒钟。`);
                        ui.loadingProgress(100, "完成了！");
                        ui.showCloseButton();
                        this.refresh();
                    }
                    else {
                        let batchDelay = translatorEngine.batchDelay;
                        if (batchDelay == undefined || batchDelay <= 1) {
                            translate();
                        }
                        else {
                            ui.log(`[RedBatchTranslator] 正在等待 ${batchDelay}ms.`);
                            setTimeout(translate, batchDelay);
                        }
                    }
                };
                if (aborted) {
                    ui.log(`[RedBatchTranslator] 翻译已中止。`);
                    ui.showCloseButton();
                    this.refresh();
                }
                else {
                    if (options.saveOnEachBatch) {
                        ui.log(`[RedBatchTranslator] 正在保存项目...`);
                        this.saveProject();
                        proceed();
                    }
                    else {
                        proceed();
                    }
                }
            };
            if (batches[myBatch] == undefined) {
                always();
            }
            else {
                translatorEngine.translate(batches[myBatch], {
                    onError: () => {
                        ui.error("[RedBatchTranslator] 翻译批次失败！");
                        safeguardAlways();
                    },
                    onAfterLoading: (result) => {
                        this.insertIntoTables(result, batchesRows, myBatch, options.destination);
                        ui.loadingProgress(100 * (batchIndex + 1) / batches.length);
                        safeguardAlways();
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
    async insertIntoTables(result, batchesRows, myBatch, destination) {
        let text = document.createTextNode(`[RedBatchTranslator] 插入到表中...`);
        this.print(text);
        for (let i = 0; i < result.translation.length; i++) {
            batchesRows[myBatch][i].setValue(result.translation[i], destination);
        }
    }
    saveProject() {
        if (this.saving) {
            this.saveAgain = true;
        }
        else {
            this.saving = true;
            trans.save().finally(() => {
                this.saving = false;
                if (this.saveAgain) {
                    this.saveAgain = false;
                    this.saveProject();
                }
            });
        }
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
}
class RedButtonManagerButton {
    constructor(name, icon, title, action) {
        this.name = name;
        this.icon = icon;
        this.title = title;
        this.action = action;
    }
    setIcon(icon) {
        this.icon = icon;
        if (this.element != undefined) {
            this.element.children[0].className = icon;
        }
    }
    getButton() {
        if (this.element != undefined) {
            return this.element;
        }
        else {
            let button = document.createElement("button");
            button.classList.add("menu-button");
            button.dataset.tranattr = "title";
            button.title = t(this.title);
            let icon = document.createElement("i");
            icon.classList.add(this.icon);
            button.appendChild(icon);
            icon.style.color = "#E00";
            button.addEventListener("click", this.action);
            this.element = button;
            return button;
        }
    }
}
/// <reference path="RedBatchTranslator.ts" />
/// <reference path="RedButtonManager.ts" />
const wordWrapNoPicture = "60";
const wordWrapPicture = "50";
var thisAddon = this;
$(document).ready(() => {
    trans.RedBatchTranslatorInstance = new RedBatchTranslator();
    let buttonContainer = document.body.getElementsByClassName("toolbar-content toolbar10 redToolbar")[0];
    if (buttonContainer == undefined) {
        let toolbarContainer = document.body.getElementsByClassName("toolbar mainToolbar")[0];
        buttonContainer = document.createElement("div");
        buttonContainer.className = "toolbar-content toolbar10 redToolbar";
        toolbarContainer.appendChild(buttonContainer);
    }
    let prepareButton = new RedButtonManagerButton("prepareProject", "icon-tasks", "为批量翻译准备项目", () => {
        trans.batchCheckSheet.checkProject();
    });
    let translateButton = new RedButtonManagerButton("batchTranslate", "icon-language-1", "批量翻译", () => {
        trans.RedBatchTranslatorInstance.open();
    });
    let wrapButton = new RedButtonManagerButton("wrapProject", "icon-commenting", "包装项目", () => {
        // Word Wrap common messages
        trans.wordWrapFiles(trans.getAllFiles(), // Files
        1, // Source
        2, // Destination
        {
            maxLength: wordWrapNoPicture,
            context: [
                "dialogue", "message1", "message2", "message3",
                "description", "message", "noPicture", "scrollingMessage"
            ]
        });
        // Word Wrap picture
        trans.wordWrapFiles(trans.getAllFiles(), // Files
        1, // Source
        2, // Destination
        {
            maxLength: wordWrapPicture,
            context: [
                "hasPicture", "Dialogue",
            ]
        });
        trans.refreshGrid();
    });
    let $buttonContainer = $(buttonContainer);
    $buttonContainer.prepend(wrapButton.getButton());
    $buttonContainer.prepend(translateButton.getButton());
    $buttonContainer.prepend(prepareButton.getButton());
});
const removableContexts = [
    "animations",
    "events name",
    "commonevents name",
    "tilesets name",
    "state name",
    "states name"
];
const translatableNoteRegExp = /(<SG)|(<SAC.+?:)/gim;
const translatablePluginRegExp = /^(?:DW_(?!SET))|(?:D_TEXT )|(?:addLog )|(?:DW_)|(?:ShowInfo )/gim;
const translatablePluginJSRegExp = /[^\x21-\x7E\* ]+/g;
const translatableControlVariable = /.*/g;
const translatableVxAceScript = ["Vocab", "装備拡張", "Custom Menu Base"];
class RedBatchCheatSheet {
    checkProject() {
        // Remove untranslatable rows
        trans.removeRowByContext(undefined, removableContexts, {
            matchAll: true
        });
        // Check Control Variables
        this.checkCollection(trans.travelContext(trans.getAllFiles(), "Control Variables"), translatableControlVariable);
        // Check notes
        this.checkCollection(trans.travelContext(trans.getAllFiles(), "note"), translatableNoteRegExp);
        // Check plugin command
        this.checkCollection(trans.travelContext(trans.getAllFiles(), "plugin"), translatablePluginRegExp);
        // Check plugins.js file
        this.checkFile("js/plugins.js", translatablePluginJSRegExp);
        // VX Ace inline scripts
        this.checkCollection(trans.travelContext(trans.getAllFiles(), "script/"), translatablePluginJSRegExp);
        this.checkCollection(trans.travelContext(trans.getAllFiles(), "inlinescript"), translatablePluginJSRegExp);
        // Red all js/plugins/
        for (let file in trans.project.files) {
            // VX Ace scripts (except vocab!)
            if (file.indexOf("js/plugins/") != -1 || // MV/MZ plugins
                (file.indexOf("Scripts/") != -1 && file.indexOf("Vocab") == -1) || // VX Ace scripts, except Vocab
                file.indexOf("Game.ini") != -1 // VX Ace .ini... dangerous!
            ) {
                let fileData = trans.project.files[file];
                for (let index = 0; index < fileData.data.length; index++) {
                    trans.project.files[file].tags[index] = ["red"];
                }
            }
        }
        // "Scripts.txt"
        let fileData = trans.project.files["Scripts.txt"];
        if (fileData != undefined) {
            for (let index = 0; index < fileData.data.length; index++) {
                let text = fileData.data[index][0];
                let contexts = fileData.context[index];
                let yellow = false;
                for (let c = 0; c < contexts.length; c++) {
                    let context = contexts[c];
                    for (let t = 0; t < translatableVxAceScript.length; t++) {
                        let translatableContext = translatableVxAceScript[t];
                        if (context.indexOf("Scripts/" + translatableContext) != -1) {
                            fileData.tags[index] = ["yellow"];
                            yellow = true;
                            break; // on to the next row
                        }
                    }
                    if (!yellow) {
                        fileData.tags[index] = ["red"];
                    }
                }
            }
        }
        // Update view
        trans.refreshGrid();
        trans.evalTranslationProgress();
    }
    checkCollection(collection, regExp) {
        for (let file in collection) {
            let rows = collection[file];
            for (let index = 0; index < rows.length; index++) {
                if (rows[index] === true) {
                    this.checkRow(file, index, regExp);
                }
            }
        }
    }
    checkFile(file, regExp) {
        let fileData = trans.project.files[file];
        if (fileData != undefined) {
            for (let index = 0; index < fileData.data.length; index++) {
                this.checkRow(file, index, regExp);
            }
        }
    }
    checkRow(file, index, regExp) {
        let text = trans.project.files[file].data[index][0];
        if (text != null && text != undefined) {
            let search = text.search(regExp);
            if (search != -1) {
                trans.project.files[file].tags[index] = ["yellow"];
            }
            else {
                trans.project.files[file].tags[index] = ["red"];
            }
        }
    }
}
trans.batchCheckSheet = new RedBatchCheatSheet();
class RedPerformance {
    constructor() {
        this.perfStart = Date.now();
        this.perfEnd = 0;
    }
    end() {
        this.perfEnd = Date.now();
    }
    getSeconds() {
        let timeTaken = this.perfEnd - this.perfStart;
        return (Math.round(timeTaken / 100) / 10);
    }
}
