const { toHankakuSpace } = require("encoding-japanese");
var CustomParser = require('www/addons/customParser/CustomParser.js');
var trans = window.opener.trans;

var win = nw.Window.get();
win.restore(); // restore if minimized
win.show(); // show if hidden
win.setResizable(true);

if (win.y < 0) win.y = 0;
if (win.x < 0) win.x = 0;
//win.setResizable(false);
setTimeout(()=>{
	if (win.y < 0) win.y = 0;
	win.setMinimumSize(800, 600)
}, 200);

/**
 * @param  {Object} rootElm - JQuery instance of node as the root element or wrapper of the tabs
 * @param  {Object} options - Object of options
 * @class
 */

var SubTab = function(rootElm, options) {
    this.$elm               = rootElm;
    options                 = options || {};
    this.initialSelection   = options.initialSelection || 0;
    this.init();
}
SubTab.prototype.on = function(evt, fn) {
    this.$elm.on(evt, fn)
}
SubTab.prototype.off = function(evt, fn) {
    this.$elm.off(evt, fn)
}
SubTab.prototype.one = function(evt, fn) {
    this.$elm.one(evt, fn)
}
SubTab.prototype.trigger = function(evt, param) {
    this.$elm.trigger(evt, param)
}

SubTab.prototype.getActiveSubTab = function($rootElm) {
    $rootElm = $rootElm || this.$elm;
    return $rootElm.find(".active[data-tabid]").attr('data-tabid');
}

SubTab.prototype.select = function($tab, trigger) {
    var $rootElm = this.$elm;
    if (typeof $tab == "number") {
        $tab = $rootElm.find("[data-targettab]").eq($tab);
    } else if (typeof $tab == "string") {
        $tab = $rootElm.find(`[data-targettab="${CSS.escape($tab)}"]`);
    }
    var targetId = $tab.attr('data-targettab');
    if (trigger) {
        this.trigger("beforeSubTabChange", {
            targetId    : targetId,
            targetElm   : $rootElm.find(`[data-tabid="${targetId}"]`)
        });
    }
    
    $rootElm.find("[data-targettab]").removeClass("active");
    $rootElm.find("[data-tabid]").removeClass("active");
    $rootElm.find("[data-tabid]").addClass("hidden");
    $rootElm.find(`[data-tabid="${targetId}"]`).addClass("active");
    $rootElm.find(`[data-tabid="${targetId}"]`).removeClass("hidden");
    $tab.addClass("active");
    if (trigger) {
        this.trigger("afterSubTabChange", {
            targetId    : targetId,
            targetElm   : $rootElm.find(`[data-tabid="${targetId}"]`)
        });
    }
}

SubTab.prototype.init = function($rootElm) {
    var that = this;
    $rootElm = $rootElm || this.$elm;
    $rootElm.find("[data-targettab]").each(function() {
        var $this = $(this);
        if ($this.hasClass("tabInitialized")) return;
        $this.addClass("tabInitialized");
        $this.on("click", function() {
            var $tab = $(this);
            that.select($tab, true);
        });
    });
    this.select(this.initialSelection, false);
    $rootElm.addClass("subTabInitialized");
}


var ModelEditor = function(file, options) {
    this.file   = file;
    this.hasChange = false;
    this.option = options || {};
    this.$elm   = $("body");
    this.debugLevel = nw.App.manifest.debugLevel;
}

ModelEditor.prototype.on = function(evt, fn) {
    this.$elm.on(evt, fn)
}
ModelEditor.prototype.off = function(evt, fn) {
    this.$elm.off(evt, fn)
}
ModelEditor.prototype.one = function(evt, fn) {
    this.$elm.one(evt, fn)
}
ModelEditor.prototype.trigger = function(evt, param) {
    this.$elm.trigger(evt, param)
}
/*
ModelEditor.prototype.getActiveSubTab = function($rootElm) {
    $rootElm = $rootElm || this.$elm;
    return $rootElm.find(".active[data-tabid]").attr('data-tabid');
}

ModelEditor.prototype.initSubTab = function($rootElm) {
    var that = this;
    $rootElm = $rootElm || this.$elm;
    $rootElm.find("[data-targettab]").each(function() {
        var $this = $(this);
        if ($this.hasClass("tabInitialized")) return;
        $this.addClass("tabInitialized");
        $this.on("click", function() {
            var $this = $(this);
            var targetId = $this.attr('data-targettab');
            that.trigger("beforeSubTabChange", {
                targetId    : targetId,
                targetElm   : $rootElm.find(`[data-tabid="${targetId}"]`)
            });
            $rootElm.find("[data-targettab]").removeClass("active");
            $rootElm.find("[data-tabid]").removeClass("active");
            $rootElm.find("[data-tabid]").addClass("hidden");
            $rootElm.find(`[data-tabid="${targetId}"]`).addClass("active");
            $rootElm.find(`[data-tabid="${targetId}"]`).removeClass("hidden");
            $(this).addClass("active");
            that.trigger("afterSubTabChange", {
                targetId    : targetId,
                targetElm   : $rootElm.find(`[data-tabid="${targetId}"]`)
            });
        });
    })
}
*/

ModelEditor.prototype.delete = function($li) {
    if ($li.is(this.$selected)) {
        var $rightPane = $("#rightPane")
        $rightPane.empty();
    }
    $li.remove();
    this.redrawRuleId();
    this.hasChange = true;

    if ($("#leftPane .selectable").length == 0) this.addRule();
}

ModelEditor.prototype.addRule = function($li, defaultValue) {
    if (this.debugLevel) console.log("addingRule", arguments);
    var $rule = this.$ruleTemplate.clone(true, true);
    if (!$li) {
        $("#leftPane .sortable").append($rule);
    } else {
        $li.after($rule);
    }
    
    if (defaultValue) {
        $rule.data("rule", defaultValue);
    }

    this.redrawRuleId();
    this.hasChange = true;
    return $rule;
}

ModelEditor.prototype.clearRules = function() {
    var $rightPane = $("#rightPane")
    $rightPane.empty();
    $("#leftPane .sortable").empty();
}

ModelEditor.prototype.resetRules = function() {
    if (this.debugLevel) console.log("reset rule");
    this.clearRules();
    this.addRule();
    this.selectRule(0);
}

ModelEditor.prototype.redrawRuleId = function() {
    var $pattern = $(".pattern");
    $pattern.each(function(index) {
        $(this).find(".patternId").text(index);
    })
}

ModelEditor.prototype.getSelectedRule = function() {
    if (empty(this.$selected.data("rule"))) this.$selected.data("rule", {})
    return this.$selected.data("rule");
}

ModelEditor.prototype.setRuleValue = function(key, value, rule) {
    rule = rule || this.$selected.data("rule") || {};
    rule[key] = value;
    this.hasChange = true;
    //this.$selected.data("rule", this.selectedRule)
}


ModelEditor.prototype.loadRules = function(value) {
    console.log("loading rules :", value);
    if (empty(value)) return this.resetRules();

    this.clearRules();
    for (var i in value) {
        this.addRule(undefined, value[i]);
    }
}

ModelEditor.prototype.applyChange = function() {
    if (!this.$activeFileGroup) return;
    if (this.$activeFileGroup.length == 0) return;
    console.log("applying rules to FileGroup at ", this.$activeFileGroup);
    this.$activeFileGroup.data("fileData", this.dumpPatterns());
    this.hasChange = true;
}

ModelEditor.prototype.drawSelected = function() {
    var rule    = this.getSelectedRule();

    var drawBreadCrumb = ($elm, path) => {
        var activeRule  = rule;
        var thisPath    = [];
        for (var i=0; i<path.length; i++) {
            thisPath.push(path[i]);
            if (i == 0) {
                var $template = $(`<span class="breadCrumbNavigator"><i class="separator icon-home"></i>Root Rule</span>`)
            } else {
                activeRule = activeRule[path[i]];
                $elm.append(`<i class="separator icon-angle-double-right"></i>`);
                var $template = $(`<span class="breadCrumbNavigator">${path[i]}</span>`)
            }

            if (i == path.length-1) {
                $template.addClass("active");
            } else {
                (()=>{
                    var currentActiveRule = activeRule;
                    var pathCopy = common.clone(thisPath);
                    $template.on("click", ()=>{
                        console.log("thisPath:", pathCopy);
                        console.log("currentActiveRole", currentActiveRule);
                        drawForm(currentActiveRule, pathCopy);
                    })
                })()
            }
            $elm.append($template);
        }
    }



    var drawForm = (selectedRule, path = []) => {
        var $rightPane = $("#rightPane")
        $rightPane.empty();
    
        var $template   = $("#template .editorRegexWrapper").clone(true, true);       
        var that        = this;
        var switchType  = (theType) => {
            $template.find(`[data-field="type"]`).val(theType);
            $template.find(`[data-fieldGroup]`).addClass("hidden");
            $template.find(`[data-fieldGroup="${theType}"]`).removeClass("hidden");
            $template.find(`[data-fieldGroup="${theType}"]`).addClass("active");
            $template.find(".typeSelection").addClass("hidden");

            if (theType == "function") {
                // activate ACE for JS Function field
                var editor = ace.edit($template.find(".functionEditor")[0]);
                editor.setTheme("ace/theme/monokai");
                editor.session.setMode("ace/mode/javascript");
                editor.setShowPrintMargin(false);
                editor.setOptions({
                    fontSize: "12pt"
                  });
                editor.on("blur", ()=> {
                    that.setRuleValue("function", editor.getValue(), selectedRule);
                });
                editor.setValue(selectedRule.function || "");
            } else {
                var editor = ace.edit($template.find(`[data-field="pattern"]`)[0]);
                editor.setTheme("ace/theme/monokai");
                editor.session.setMode("ace/mode/javascript");
                editor.setShowPrintMargin(false);
                editor.renderer.setShowGutter(false);
                editor.setOptions({
                    fontSize: "12pt"
                });
                editor.on("change", ()=> {
                    that.setRuleValue("pattern", editor.getValue(), selectedRule);
                });
                editor.setValue(selectedRule.pattern || "");
            }

        }

        drawBreadCrumb($template.find(".breadCrumb .path"), path);

        if (selectedRule.type) {
            switchType(selectedRule.type);
        }

        $template.find("a.externalLink, a[external]").on("click", function(e) {
            e.preventDefault();
            nw.Shell.openExternal($(this).attr("href"));
        });

        $template.find('.typeSelectorFld').on("click", function() {
            var thisValue =  $(this).attr("value")
            that.setRuleValue("type", thisValue, selectedRule);
            switchType(thisValue);
        });

        $template.find('[data-field="pattern"]').on("input", function() {
            that.setRuleValue("pattern", $(this).val(), selectedRule);
        });
        $template.find('[data-field="captureGroups"]').on("input", function() {
            that.setRuleValue("captureGroups", $(this).val(), selectedRule);
        });
        $template.find('[data-field="action"]').on("input", function() {
            var $this = $(this);
            $this.closest(".form-group").find(".innerRuleWrapper").addClass("hidden")
    
            that.setRuleValue("action", $this.val(), selectedRule);
            if ($this.val() == "innerRule") {
                $this.closest(".form-group").find(".innerRuleWrapper").removeClass("hidden");
            }
        });

        $template.find('[data-field="function"]').on("input", function() {
            that.setRuleValue("function", $(this).val(), selectedRule);
        });
    
        $template.find('.innerRule').on("click", () => {
            selectedRule.innerRule = selectedRule.innerRule || {};
            drawForm(selectedRule.innerRule, path.concat(["innerRule"]));
        })

        console.log("selected rule:", selectedRule);
        for (var i in selectedRule) {
            if (!i) continue;
            if (!selectedRule[i]) continue;
            $template.find(`[data-field="${i}"]`).val(selectedRule[i]);
        }
        if (selectedRule.action == "innerRule") {
            $template.find(".innerRuleWrapper").removeClass("hidden");
        }
    
        $rightPane.append($template);
    }
    drawForm(rule, ["rule"]);
}

ModelEditor.prototype.selectRule = function($li) {
    if (typeof $li == "number") $li = $("#leftPane .selectable").eq($li);
    this.applyChange();
    console.log("selecting", $li);
    $(".pattern").removeClass("selected");
    $li.addClass("selected");
    this.$selected = $li;
    this.drawSelected();
}

/**
 * Dump currenctly active patterns
 */
ModelEditor.prototype.dumpPatterns = function() {
    var $patterns = $("#leftPane [data-role='pattern']");
    var result = []
    for (var i=0; i<$patterns.length; i++) {
        var data = $patterns.eq(i).data('rule');
        if (empty(data)) continue;
        result.push(data);
    }
    return result;
}

ModelEditor.prototype.runSample = async function(text, model) {
    this.sampleIsRunning = true;
    text    = text || "";
    model   = model || {rules:this.loadFileGroupData()}
    console.log("current model:", model);
    var options = {
        model:model
    }
    var customParser = new CustomParser(text, options);
    await customParser.parse();
    console.log("Custom parser:", customParser);
    this.gridPreviewData = customParser.transData.data;
    this.gridPreview.loadData(this.gridPreviewData);
    await this.gridPreview.render();
    this.sampleIsRunning = false;
}

ModelEditor.prototype.getSampleTranslationPair = function() {
    var result = {};
    var data = modelEditor.gridPreview.getData();
    for (var r=0; r<data.length; r++) {
        var row = data[r];
        if (!Boolean(row[0])) continue;
        if (!Boolean(row[1])) continue;
        result[row[0]] = row[1];
    }
    return result;
}

ModelEditor.prototype.runSampleTranslationResult = async function(text, model) {
    text = text || this.sampleEditor.getValue();
    if (!text) return;
    this.sampleIsRunning = true;
    model   = model || {rules:this.loadFileGroupData()}
    console.log("current model:", model);
    var options = {
        model:model
    }
    var customParser = new CustomParser(text, options);
    customParser.writeMode          = true;
    customParser.translationPair    = this.getSampleTranslationPair();
    await customParser.parse();
    console.log("Custom parser:", customParser);
    this.translationPreview.setValue(customParser.toString());
    this.sampleIsRunning = false;
}


ModelEditor.prototype.initSampleEditor = function() {
    var editor = ace.edit(this.$patterns.find(".sampleEditor")[0]);
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/text");
    editor.setShowPrintMargin(false);
    editor.setOptions({
        fontSize: "12pt"
      });
    editor.lastSampleRender = 0;
    editor.on("change", async ()=> {
        if (this.sampleIsRunning) return;
        if (Date.now() < editor.lastSampleRender+1000) return;
        if (this.sampleSubtab.getActiveSubTab() == "gridPreview") {
            await this.runSample(editor.getValue());
        } else {
            await this.runSampleTranslationResult(editor.getValue());
        }
        editor.lastSampleRender = Date.now();
    });
    editor.on("blur", async ()=> {
        localStorage.setItem("modelEditor.sampleEditor", editor.getValue());
    });
    editor.setValue(localStorage.getItem("modelEditor.sampleEditor") || "");
    this.sampleEditor = editor;
}


ModelEditor.prototype.initGridPreview = function($elm) {
    var translateSelection = () => {
        if (empty(this.gridPreviewData)) return;
        var rows = common.gridRangeToArray(this.gridPreview.getSelectedRange());
        for (var i=0; i<rows.length; i++) {
            var rowData = this.gridPreviewData[i];
            if (!rowData[0]) continue;
            var reversed = rowData[0].split("").reverse().join("")
            rowData[1] = "Translated: "+reversed;
        }
        this.gridPreview.loadData(this.gridPreviewData);
        this.gridPreview.render();
    }
    var clearTranslation = () => {
        if (empty(this.gridPreviewData)) return;
        for (var i=0; i<this.gridPreviewData.length; i++) {
            this.gridPreviewData[i][1] = null;
        }
        this.gridPreview.render();
    }


    this.gridPreviewData    = [[]];
    this.gridPreview        = new Handsontable($elm[0], {
        data                : this.gridPreviewData,
        height              : '100%',
        width               : '100%',
        manualColumnResize  : true,
        rowHeaders          : true,
        colWidths           : [176, 176],
        colHeaders          : ["Original text", "Translation"],
        columns: [
            {
                readOnly:true
            },
            {
                readOnly:false
            }
        ],
        contextMenu: {
			items: {
				'generateTranslation': {
					name: "<i class='icon-language'></i>"+t("Translate here using ")+"dummy translator",
					callback: () => {
						translateSelection();
					}
					
				},
                'clearTranslation' : {
                    name: "<i class='icon-trash-empty'></i>Clear translation",
                    callback: ()=>{
                        clearTranslation();
                    }
                }
            }
        }
    });
}

ModelEditor.prototype.initTransltionPreview = function() {
    //this.initSubTab();
    var editor = ace.edit(this.$patterns.find(".translationPreview")[0]);
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/text");
    editor.setShowPrintMargin(false);
    editor.setReadOnly(true);
    editor.setOptions({
        fontSize: "12pt"
      });
    this.translationPreview = editor;

    this.sampleSubtab.off("beforeSubTabChange.transPreview");
    this.sampleSubtab.on("beforeSubTabChange.transPreview", (e, info) => {
        console.log(info);
        if (info.targetId == "translationPreview") {
            this.runSampleTranslationResult();
        }
    });
}

ModelEditor.prototype.initHooks = function($rootElm) {
    $rootElm = $rootElm || this.$elm;
    if ($rootElm.hasClass("subTabInitialized")) return;
    // init navigator
    this.hooksTab = new SubTab($rootElm);

    // init field
    $rootElm.find(".editor").each(function() {
        var editor = ace.edit($(this)[0]);
        editor.setTheme("ace/theme/monokai");
        editor.session.setMode("ace/mode/javascript");
        editor.setShowPrintMargin(false);
        editor.setOptions({
            fontSize: "12pt"
          });
        editor.on("blur", ()=> {
            //that.setRuleValue("function", editor.getValue(), selectedRule);
        });
        //editor.setValue(selectedRule.function || "");
    });
}

ModelEditor.prototype.newPatternsPane = function(defaultValue) {
    this.clearPatternsPane();
    this.$patterns = this.$patternsTemplate.clone(true, true);
    this.$rulesRootElm.append(this.$patterns);
    this.$rulesRootElm.find(".patternEditor").tabs({
		active: 0,
		activate: function(e, thisUi) {
            
		}
	});
    this.$rulesRootElm.find(".patternEditor").on("tabsactivate", (e, ui)=> {
        console.log(ui);
        if (ui.newPanel.attr("id") == "hooks") {
            console.log("hooks activated");
            this.initHooks(ui.newPanel);
        }
    });

    this.$rulesRootElm.find(".sortable").sortable(); 
    this.loadRules(defaultValue);
    this.selectRule(0);

    // initializing testing tab
    this.sampleSubtab = new SubTab(this.$elm.find(".translationPreviewer"));
    this.initSampleEditor();
    this.initGridPreview(this.$patterns.find(".gridPreview"));
    this.initTransltionPreview();
   
}

ModelEditor.prototype.clearPatternsPane = function() {
    this.$rulesRootElm.empty();
}

ModelEditor.prototype.clearFileGroup = function() {
    this.$fileGroups.empty();
}

ModelEditor.prototype.drawNoFileGroupWarning = function() {
    this.$rulesRootElm.append($("#template .noFileGroup").clone(true, true));
}

ModelEditor.prototype.getActiveFileGroup = function() {
    return this.$fileGroups.find(":selected");
}

ModelEditor.prototype.loadFileGroupData = function($elm) {
    $elm = $elm || this.getActiveFileGroup();
    this.applyChange();
    if (empty($elm.data("fileData"))) $elm.data("fileData", {});
    return $elm.data("fileData");
}

ModelEditor.prototype.selectFileGroup = function($elm) {
    loadingScreen.show();
    $(".patternEditor").addClass("hidden");
    if (typeof $elm == "number") $elm = $("#fileNavSelector option").eq($elm);
    this.applyChange();
    console.log("fileGroup selected", $elm);
    // dump previous active pane
    var defaultValue = this.loadFileGroupData($elm);
    this.newPatternsPane(defaultValue);
    $elm.prop("selected", true);
    this.$activeFileGroup = $elm;
    loadingScreen.hide();
}

ModelEditor.prototype.newFileGroup = function(group, defaultData) {
    var $template = $(`<option></option>`);
    $template.attr("value", group);
    $template.text(group);
    if (defaultData) {
        $template.data("fileData", defaultData);
    }
    this.$fileGroups.append($template);
    this.enableSave();
    this.hasChange = true;
    return $template;
}

ModelEditor.prototype.editFileGroup = function(group, $elm) {
    $elm = $elm || this.getActiveFileGroup();
    $elm.attr("value", group);
    $elm.text(group);
    this.hasChange = true;
    return $elm;
}

ModelEditor.prototype.removeFileGroup = function($elm) {
    $elm = $elm || this.getActiveFileGroup();
    console.log("removing FileGroup", $elm);
    console.log("removing group with active data:", $elm.data("fileData"));
    console.log($elm.is(":selected"));
    if ($elm.is(":selected")) this.clearPatternsPane();
    if ($("#fileNavSelector option").length > 1) {
        var $prev = $elm.prev();
        $elm.remove();
        if ($prev.length == 0) this.selectFileGroup(0);
        this.selectFileGroup($prev);
        this.hasChange = true;
    } else {
        this.initialize();
    }
}

ModelEditor.prototype.dump = function() {
    this.applyChange();
    var fileGroups = $("#fileNavSelector option");
    var parserModel = {
        files:[]
    }
    for (var i=0; i<fileGroups.length; i++ ) {
        var thisData = {
            pattern : fileGroups.eq(i).attr("value"),
            rules   : this.loadFileGroupData(fileGroups.eq(i))
        }
        parserModel.files.push(thisData)
    }
    return parserModel;
}

ModelEditor.prototype.disableSave = function() {
    this.isSaveEnable = false;
    $(".menu-button.button-save").prop("disabled", true);
    $(".menu-button.button-save-as").prop("disabled", true);
}

ModelEditor.prototype.enableSave = function() {
    this.isSaveEnable = true;
    $(".menu-button.button-save").prop("disabled", false);
    $(".menu-button.button-save-as").prop("disabled", false);
}

ModelEditor.prototype.saveAs = async function() {
    if (!this.isSaveEnable) return;
    var $elm = $(`<input type="file" class="saveAs hidden" nwsaveas="new parser model.tpm" accept=".tpm,application/tpm" autocomplete="off"  />`);
    return new Promise(async (resolve, reject)=>{
        $elm.one("input", async ()=> {
            var file = $elm.val();
            if (!$elm.val()) resolve;
            try {
                $(".button-save img").addClass("rotating");
                await common.filePutContents(file, JSON.stringify(this.dump()));
                this.hasChange = false;
            } catch (e) {
                $(".button-save img").removeClass("rotating");
                console.warn(e);
                alert("Error when trying to save file to:"+file+"\n"+e.toString());
                resolve();
            }
            $(".button-save img").removeClass("rotating");
            resolve(file);
        });
        $elm.trigger("click");

    })

}

ModelEditor.prototype.saveTo = async function(file) {
    if (!this.isSaveEnable) return;
    file = file || this.file
    if (!this.file) {
        return this.saveAs();
    }
    try {
        $(".button-save img").addClass("rotating");
        await common.filePutContents(file, JSON.stringify(this.dump()));
        this.hasChange = false;

    } catch (e) {
        $(".button-save img").removeClass("rotating");
        alert("Error when trying to save file to:"+file+"\n"+e.toString());
        return false;
    }
    $(".button-save img").removeClass("rotating");
    return file;
}

ModelEditor.prototype.loadFromJson = async function(json) {
    this.initialize();
    if (!common.isJSON(json)) return alert("Invalid JSON");
    var data = JSON.parse(json);
    data.files = data.files || [];
    for (var i=0; i<data.files.length; i++) {
        this.newFileGroup(data.files[i].pattern, data.files[i].rules);
    }
    this.selectFileGroup(0);
    this.trigger("jsonLoaded");
}

ModelEditor.prototype.loadFromFile = async function(file) {
    var openFileDialog = async () => {
        return new Promise(async (resolve, reject) => {
            var $elm = $(`<input type="file" class="openFile hidden" accept=".tpm,application/tpm" autocomplete="off" />`);
            $elm.one("input", async ()=> {
                resolve($elm.val());
            })
            $elm.trigger("click");
        })
    }

    if (typeof file == "undefined") {
        file = await openFileDialog();
    }

    if (!file) return;
    
    try {
        var fileContent = await common.fileGetContents(file);
        await this.loadFromJson(fileContent);
        this.trigger("fileLoaded")
    } catch (e) {
        console.error(e);
        alert("Error when trying to open file :"+file+"\n"+e.toString());
        return false;
    }
}

ModelEditor.prototype.initialize = function() {
    var $template   = $("#template");
    var that        = this;
    this.hasChange  = false;
    // fileGroup
    this.$fileGroups    = $("#fileNavSelector");
    this.$fileGroups.off("change");
    this.$fileGroups.on("change", function() {
        that.selectFileGroup($(this).find(":selected"));
    });
    this.clearFileGroup();
    this.$activeFileGroup   = undefined;

    // rules
    if (!ModelEditor.$patternEditor) {
        ModelEditor.$patternEditor = $template.find(".patternEditor").clone(true, true);
        // remove the original to avoid confusion of the query
        $template.find(".patternEditor").remove();
    }
    this.$rulesRootElm      = $("#patternEditorWrapper");
    this.$patternsTemplate  = ModelEditor.$patternEditor.clone(true, true);
    this.$ruleTemplate      = ModelEditor.$patternEditor.find(".pattern").clone(true, true);



    this.$ruleTemplate.on("mouseup", function() {
        that.selectRule($(this));
    })

    this.$ruleTemplate.find(".buttons .add").on("click", function() {
        that.addRule($(this).closest(".selectable"));
    })

    this.$ruleTemplate.find(".buttons .delete").on("click", function() {
        that.delete($(this).closest(".selectable"));
    })

    this.clearPatternsPane();
    this.drawNoFileGroupWarning();

    this.disableSave();
}



$(document).ready(function() {
    window.loadingScreen    = new LoadingScreen();
    window.modelEditor      = new ModelEditor()

    // MENU
    $(".addFileGroup").on("click", function() {
        var fileGroup = prompt(t("Please specify what kind of file you want to parse.\nYou can use semicolon separated glob pattens. For example: *.txt;*.js;*.json"));
        if (!fileGroup) return;
        var newOpt = modelEditor.newFileGroup(fileGroup);
        if (!newOpt) alert("Failed to create new file group. Please check your pattern!");
        modelEditor.selectFileGroup(newOpt);
    })

    $(".editFileGroup").on("click", function() {
        var currentFileGroup = modelEditor.getActiveFileGroup();
        if (currentFileGroup.length < 1) return;
        var defaultFileGroup = currentFileGroup.attr("value");
        var fileGroup = prompt(t("Please specify what kind of file you want to parse.\nYou can use semicolon separated glob pattens. For example: *.txt;*.js;*.json"), defaultFileGroup);
        if (!fileGroup) return;
        var newOpt = modelEditor.editFileGroup(fileGroup);
        if (!newOpt) alert("Failed to create new file group. Please check your pattern!");
    });

    $(".removeFileGroup").on("click", function() {
        var conf = confirm(t("Do you wish to remove current file group?\nYou can not undo this action!"));
        if (!conf) return;
        modelEditor.removeFileGroup();
    });

    $(".menu-button.button-new").on("click", function() {
        if (modelEditor.hasChange) {
            var conf = confirm(t("Do you want to discard your changes and create a new blank model?"));
            if (!conf) return;
        }
        modelEditor.initialize();
    })
    $(".menu-button.button-open").on("click", function() {
        if (modelEditor.hasChange) {
            var conf = confirm(t("Do you want to discard your changes and open a file?"));
            if (!conf) return;
        }
        modelEditor.loadFromFile();
    })
    $(".menu-button.button-save").on("click", function() {
        modelEditor.saveTo();
    })
    $(".menu-button.button-save-as").on("click", function() {
        modelEditor.saveAs();
    })
    $(".menu-button.button-help").on("click", function() {
        nw.Shell.openExternal("https://dreamsavior.net/docs/translator/parser-model-creator/");
    })

    $(document).on('keydown', function(e) {
		var keyCode = e.keyCode || e.which;

		switch (keyCode) {

			case 112 : //F1, about
				e.preventDefault();
                nw.Shell.openExternal("https://dreamsavior.net/docs/translator/parser-model-creator/");
                break;		
			case 122 : //F11, Full screen
				var win = win || nw.Window.get();
				win.maximize();
			break;		
		}

		// EDITING COMMAND
		if (e.ctrlKey) {
			switch(keyCode) {
				case 79 : //o
                    if (modelEditor.hasChange) {
                        var conf = confirm(t("Do you want to discard your changes and open a file?"));
                        if (!conf) return;
                    }
                    modelEditor.loadFromFile();
				break;
				case 83 : //s
					e.preventDefault();
					console.log("Pressing CTRL+s");
					modelEditor.saveTo();;
					//saveData();
				break;
			}
		} else if (e.altKey) {
			switch(keyCode) {
			}			
		} else if (e.shiftKey) {
			switch(keyCode) {
			}
		}
	});	

    // create tempalte
    modelEditor.initialize();
})