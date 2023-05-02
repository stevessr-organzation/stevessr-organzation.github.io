var thisAddon = this;

//await this.until("TMInitialized");


class TMUI extends require("www/js/BasicEventHandler.js") {
    constructor(options) {
        var $tab = $(`<span class="tabButton" data-tran="" data-tranattr="title" title="View translation memory" data-fortab="viewTM">Memory</span>`)
        super($tab);
        this.$tab = $tab;
    }
}

TMUI.prototype.infoPaneShowMemory = async function() {
    if (!this.isActive) return;
    var keyText = trans.getSelectedKeyText();

    this.$tabBody.empty();
    var result = await thisAddon.handler.remindMe([keyText]);
    if (!result) return;
    if (!result[0]) return;
    var $template =  $(`<div class="snippetWrapper">
        <div class="snippetInfo flex"><span class="snippetPath">Translation memory</span><span class="lineNumber">Exact match</span></div>
        <div class="memoryResult"></div>
    </div>`)
    $template.find(".memoryResult").text(result[0]);


    if (keyText != trans.getSelectedKeyText()) return; // selection has changed
    this.lastMemory = result[0]
    this.$tabBody.empty();
    this.$tabBody.append($template);
}

TMUI.prototype.translateCurrent = async function() {
    console.log("setting last memory", this.lastMemory);
    if (!trans.lastSelectedCell) return;
    if (!this.lastMemory) return;
    ui.setCurrentCellText(this.lastMemory, true);
}


TMUI.prototype.initGridMenu = function() {
    console.log("Injecting menu");
    const insertAfter = "sepn"
    result = {}
    for (var i in trans.gridContextMenu) {
        result[i] = trans.gridContextMenu[i];
        if (i == insertAfter) {
            result["tMemory"] = {
                name: `Translation Memory`,
                submenu: {
                    items: [
                        {
                            key:"tMemory:tm-remind",
                            name: "<span>Remind <kbd>ctrl+r</kbd></span>",
                            callback: function() {
                                thisAddon.handler.remindIntoSelectedCells();
                            },
                        },
                        {
                            key:"tMemory:tm-memorize",
                            name: "<span>Memorize <kbd>ctrl+m</kbd></span>",
                            callback: function() {
                                thisAddon.handler.memorizeSelectedCells();

                            },
                        },
                        {
                            key:"tMemory:tm-rememorize",
                            name: "<span>Re-memorize <kbd>ctrl+shift+m</kbd></span>",
                            callback: function() {
                                thisAddon.handler.memorizeSelectedCells(true);
                            },
                        },
                        {
                            key: "tMemory:tm-forget",
                            name: "<span>Forget</span>",
                            callback: function() {
                                var conf = confirm(t(`Do you want Translator++ to forget the selected cell(s)?`))
                                if (!conf) return;
                                thisAddon.handler.forgetFromSelectedCells()
                            },
                        },
                    ]
                },
                hidden: function() {
                    if (trans.grid.isRowHeaderSelected()) return true;
                    return false;
                }
            }
            result["sepTM"] = {
                name: '---------',
                hidden: function() {
                    if (trans.grid.isRowHeaderSelected()) return true;
                    return false;
                }
            }

        }
    }

    trans.gridContextMenu = result;
    //console.log("Updating context menu", JSON.stringify(trans.gridContextMenu, undefined, 2));
    trans.grid.updateSettings({
        contextMenu:{
            items: trans.gridContextMenu
        }
    })
}

TMUI.prototype.initShortcuts = function() {
    $(document).on('keydown', function(e) {
		var keyCode = e.keyCode || e.which;
		switch (keyCode) {

		}

		// EDITING COMMAND
		if (e.ctrlKey && e.shiftKey ) {
			switch(keyCode) {
				case 77 : //CTRL+SHIFT+m
					e.preventDefault();
					console.log("Pressing CTRL+shift+m");
					thisAddon.handler.memorizeSelectedCells(true);
				break;
			}
		} else if (e.ctrlKey) {
			switch(keyCode) {
				case 77 : //m
					e.preventDefault();
					console.log("Pressing CTRL+m");
					thisAddon.handler.memorizeSelectedCells();
				break;
                case 82 : //r
                    e.preventDefault();
                    console.log("Pressing CTRL+t");
                    thisAddon.handler.remindIntoSelectedCells();
                break;
            }
		}
	});		
}

TMUI.prototype.init = async function() {
    var that = this;
    // building elements
    this.$tabBody = $(`<div class="cellInfoContent viewTM hidden" id="viewTM"  data-tabname="viewTM"></div>`)
    this.$tabMenu = $(`<div class="cellInfoCtrl hidden" data-tabname="viewTM">
        <button class="setFromMemory" data-tranattr="title" title="Use memorized translation to current cell! (ctrl+r)"><i class="icon-right-bold"></i></button>
    </div>`);
    $(".cellInfoPartsA .cellInfoTabHeader .tabButtons").append(this.$tab);
    $(".cellInfoPartsA .cellInfoTabContent .cellInfoBody").append(this.$tabBody);
    $(".cellInfoPartsA .cellInfoTabContent .cellInfoMenu").append(this.$tabMenu);
    ui.cellInfoTab.init();

    $("head").append(`<style id="tmStyle">
    .snippetWrapper .memoryResult {
        box-sizing: border-box;
        padding: 8px;
        color: #dcdcdc;
    }
    .cellInfoContent.viewTM {
        background-color: rgb(42, 47, 58);
    }
    </style>`);

    var $menuButton = $(`<button class="menu-button tmMenu buttonExpand" data-tranattr="title" title="Translation memory"><img src="addons/tm/magnet-mind2.png" alt=""></button>`)
    $(".mainToolbar .toolbar3").append($menuButton);
    
    this.menu = new nw.Menu();

	// Add some items with label
	this.menu.append(new nw.MenuItem({
        label: t('Auto remind'),
        type: "checkbox", 
        checked: Boolean(thisAddon.getConfig("autoRemindOnBatchTranslate")),
        click: function(){
            if (updater.getUser().level < 100) {
                alert("Sorry, this addon is only available for active patrons only.\nYou can unlock this feature by becoming a $1 patron.")
                this.checked = false;
                thisAddon.setConfig("autoRemindOnBatchTranslate", false)	
                return;
            }
            this.checked = !thisAddon.getConfig("autoRemindOnBatchTranslate");
            thisAddon.setConfig("autoRemindOnBatchTranslate", this.checked)				
        }
	}));
    this.menu.append(new nw.MenuItem({ type: 'separator' }));
	this.menu.append(new nw.MenuItem({
        label: t('Auto memorize organic translation'),
        type: "checkbox", 
        checked: Boolean(thisAddon.getConfig("autoMemorizeOrganic")),
        click: function(){
            if (updater.getUser().level < 100) {
                alert("Sorry, this addon is only available for active patrons only.\nYou can unlock this feature by becoming a $1 patron.")
                this.checked = false;
                thisAddon.setConfig("autoMemorizeOrganic", false)	
                return;
            }
            this.checked = !thisAddon.getConfig("autoMemorizeOrganic");
            thisAddon.setConfig("autoMemorizeOrganic", this.checked)				
  
        }
    }));
    this.menu.append(new nw.MenuItem({
        label: t('Auto memorize automation'),
        type: "checkbox", 
        checked: Boolean(thisAddon.getConfig("autoMemorizeAutomation")),
        click: function(){
            if (updater.getUser().level < 100) {
                alert("Sorry, this addon is only available for active patrons only.\nYou can unlock this feature by becoming a $1 patron.")
                this.checked = false;
                thisAddon.setConfig("autoMemorizeAutomation", false)	
                return;
            }
            this.checked = !thisAddon.getConfig("autoMemorizeAutomation");
            thisAddon.setConfig("autoMemorizeAutomation", this.checked)				

        }
    }));
    /*
    this.menu.append(new nw.MenuItem({
        label: t('Auto memorize machine translation'),
        type: "checkbox", 
        checked: Boolean(thisAddon.getConfig("autoRemindOnBatchTranslate")),
        click: function(){

        }
    }));
    */
  
	$menuButton.on("click", function(ev) {
		ev.preventDefault();
		// Popup the native context menu at place you click
		console.log(ev.originalEvent);
		var $wrapper = $(this);
		var left = parseInt($wrapper.offset().left);
		var top = parseInt($wrapper.offset().top + $wrapper.outerHeight());
		console.log(left, top)
		//ui.menus.saveAs.popup(parseInt(ev.originalEvent.x), parseInt(ev.originalEvent.y));
		that.menu.popup(left, top);
		return false;	
    })

    // Initialize grid menu
    this.initGridMenu();
    this.initShortcuts();

    // EVENTS
    // apply event to control pane
    this.$tabMenu.find(".setFromMemory").on("click", () => {
        this.translateCurrent();
    });
    
    $(document).on("cellInfoTabChange.tm", async(e, tab)=> {
        if (tab !== "viewTM") return;
        this.isActive = true;
        this.infoPaneShowMemory();
    })

    $(document).on("onAfterSelectCell.tm", (e, options)=>{
        this.infoPaneShowMemory();
    });

    console.log("TMUI initialized");
    
}

var initialize = async function() {
    console.log("Initializing TMUI");
    var tmUi = new TMUI();
    thisAddon.tmUi = tmUi;
    await tmUi.init();
}


$(document).ready(function() {
    ui.onReady(()=> {
        initialize();
    })

})