var thisAddon = this;

// Register custom modules directory
moduleAlias.addPath(thisAddon.getLocation()+'/node_modules')
// Import settings from a specific package.json
moduleAlias(thisAddon.getLocation()+'/package.json')
window.mysql = require('mysql2/promise');

thisAddon.config ||= {};
thisAddon.config.dbHost ||= 'localhost';
thisAddon.config.dbPort ||= '3306';
thisAddon.config.dbUser ||= 'root';
thisAddon.config.dbName ||= 'tm';
thisAddon.config.dbPassword ||= '';
if (typeof thisAddon.config.autoMemorizeOrganic == "undefined") thisAddon.config.autoMemorizeOrganic = true;
if (typeof thisAddon.config.autoMemorizeAutomation == "undefined") thisAddon.config.autoMemorizeAutomation = true;
if (typeof thisAddon.config.autoMemorizeOnTranslateCells == "undefined") thisAddon.config.autoMemorizeOnTranslateCells = false;
if (typeof thisAddon.config.autoRemindOnTranslateCells == "undefined") thisAddon.config.autoRemindOnTranslateCells = true;
if (typeof thisAddon.config.autoRemindOnBatchTranslate == "undefined") thisAddon.config.autoRemindOnBatchTranslate = true;

this.optionsForm = (options)=> {
  return {
	  "schema": {
      "autoMemorizeOrganic": {
        "type": "boolean",
        "title": "Automatic organic translation memorization",
        "description": "If checked, all organic translation (manually inputted translation) will be memorized automatically.",
        "default": thisAddon.getConfig("autoMemorizeOrganic")
      },
      "autoMemorizeAutomation": {
        "type": "boolean",
        "title": "Memorize translation by automation script",
        "description": "If checked, Translator++ will remember the translation created from automation scripts. \nAll changes via 'this.cells' will be memorized. But it is possible for us to modify the contents of the grid directly using the trans API, such changes will not trigger the automatic memorization.",
        "default": thisAddon.getConfig("autoMemorizeAutomation")
      },
      "autoRemindOnTranslateCells": {
        "type": "boolean",
        "title": "Remind translation on cell translate",
        "description": "If checked, Translator++ will load translation from translation memory first before performing automatic translation on selected cell.",
        "default": thisAddon.getConfig("autoRemindOnTranslateCells")
      },
      "mysqlServer": {
          "type": "string",
          "title": "MySQL host",
          "description": "The host name or IP address of your MySQL server",
          "default": thisAddon.getConfig("dbHost")
      },
      "mysqlPort": {
          "type": "integer",
          "title": "MySQL port",
          "description": "MySQL Port. Default is 3306.",
          "default":thisAddon.config.dbPort,
          "min": 1,
      },
      "mysqlUser": {
        "type": "string",
        "title": t("MySQL user name"),
        "description": t("Username to access the DB."),
        "default": thisAddon.config.dbUser,
        "required":true
      },
      "mysqlPassword": {
          "type": "string",
          "title":  t("MySQL password"),
          "description": t("Password to access the DB."),
          "default":thisAddon.config.dbPassword,
          "required":true
      },
      "mysqlDBName": {
          "type": "string",
          "title": t("Database Name"),
          "description": t("Database name. Translator++ will try to create database if not exist. But the success is depend on the privilege of the given credential."),
          "default":thisAddon.config.dbName,
          "required":true
      },
      /*
      "dbType": {
        "type": "string",
        "title": "Database Type",
        "description": "Database Type",
        "default":"",
        "required":false,
        "enum": [
          "MySQL",
          "indexed DB"
        ]
      }
      */
	  },
	  "form": [
      {
        "key": "autoMemorizeOrganic",
        "inlinetitle": "Automatically memorize manually inputted translations?",
        "onChange": function (evt) {
          if (updater.getUser().level < 100) {
            ui.alert("Sorry, this addon is only available for active patrons only.\nYou can unlock this feature by becoming a $1 patron.", "options")
            $(evt.target).prop("checked", false);
            thisAddon.setConfig("autoMemorizeOrganic",false);
            return;
          }
          thisAddon.setConfig("autoMemorizeOrganic", $(evt.target).prop("checked"))
        }
      },
      {
        "key": "autoMemorizeAutomation",
        "inlinetitle": "Automatically memorize translation made by automation scripts?",
        "onChange": function (evt) {
          if (updater.getUser().level < 100) {
            ui.alert("Sorry, this addon is only available for active patrons only.\nYou can unlock this feature by becoming a $1 patron.", "options")
            $(evt.target).prop("checked", false);
            thisAddon.setConfig("autoMemorizeAutomation",false);
            return;
          }
          thisAddon.setConfig("autoMemorizeAutomation", $(evt.target).prop("checked"))
        }
      },
      {
        "key": "autoRemindOnTranslateCells",
        "inlinetitle": "Remind translations when performing translate selection?",
        "onChange": function (evt) {
          if (updater.getUser().level < 100) {
            ui.alert("Sorry, this addon is only available for active patrons only.\nYou can unlock this feature by becoming a $1 patron.", "options")
            $(evt.target).prop("checked", false);
            thisAddon.setConfig("autoRemindOnTranslateCells",false);
            return;
          }
          thisAddon.setConfig("autoRemindOnTranslateCells", $(evt.target).prop("checked"))
        }
      },
      {
          "type": "fieldset",
          "title": "MySQL Server Configuration",
          "description": "Configuration of MYSql Service",
          "items": [
              {
                "key": "mysqlServer",
                "onChange": function (evt) {
                    var value = $(evt.target).val();
                    thisAddon.setConfig("dbHost", value);
                    options.requestRestart();
                }
              },
              {
                "key": "mysqlPort",
                "onChange": function (evt) {
                    var value = $(evt.target).val();
                    thisAddon.setConfig("dbPort", parseInt(value));
                    options.requestRestart();
                }
              },
              {
                "key": "mysqlUser",
                "onChange": function (evt) {
                    var value = $(evt.target).val();
                    thisAddon.setConfig("dbUser", value);
                    options.requestRestart();
                }
              },
              {
                "key": "mysqlPassword",
                "onChange": function (evt) {
                    var value = $(evt.target).val();
                    thisAddon.setConfig("dbPassword", value);
                    options.requestRestart();
                }
              },
              {
                "key": "mysqlDBName",
                "onChange": function (evt) {
                    var value = $(evt.target).val();
                    thisAddon.setConfig("dbName", value);
                    thisAddon.handler.db.setDB(value)
                    options.requestRestart();
                }
              },
              {
                "type": "actions",
                "title" : "Generate",
                "description": "Escaping algorithm for inline code inside dialogues",
                "fieldHtmlClass": "actionButtonSet",
                "items": [
                  {
                    "type": "button",
                    "title": "Test connection",
                    "onClick" : async function() {
                      var result = await thisAddon.DB.testConnection({
                        host: thisAddon.getConfig("dbHost"),
                        port: thisAddon.getConfig("dbPort"),
                        user: thisAddon.getConfig("dbUser"),
                        database: thisAddon.getConfig("dbName"),
                        password: thisAddon.getConfig("dbPassword")
                      })
                      if (result.result) {
                        ui.alert("Connection success!", "options")
                      } else {
                        ui.alert("Connection failed!\nError:"+result.error, "options")
                      }
                    }
                  },
                  {
                    "type": "button",
                    "title": "Install MySQL Server",
                    "onClick" : function() {
                      nw.Shell.openExternal(`https://www.apachefriends.org/download.html`);
                    }
                  },
                  {
                    "type": "button",
                    "title": "How to setup MySQL Server",
                    "onClick" : function() {
                        nw.Shell.openExternal(`https://dreamsavior.net/docs/translator/translation-memory/mysql-database/`);
                    }
                  },
                ]
              },
          ]
      },
      /*
      {
        "key": "escapeAlgorithm",
        "titleMap": {
          "": "Default",
          "hexPlaceholder": "Hex Placeholder (recommended)",
          "agressiveSplitting": "Aggressive Splitting (Japanese only)",
          "none": "None (no escaping)"
        },
        "onChange": function (evt) {
        var value = $(evt.target).val();
        trans.bing.update("escapeAlgorithm", value);
        
        }
      }
      */
	  ]
	}}

var DB = require(nwPath.join(thisAddon.getPathRelativeToRoot(), "DB.mysql.js"))
window.DB = DB
this.DB = DB;

class TM extends require("www/js/BasicEventHandler.js") {
	constructor(options) {
		super()
    this.options = options || {}
    this.db = new DB({
      host: thisAddon.getConfig("dbHost") || 'localhost',
      port: thisAddon.getConfig("dbPort") || '3306',
      user: thisAddon.getConfig("dbUser") || 'root',
      database: thisAddon.getConfig("dbName") || "tm",
      password: thisAddon.getConfig("dbPassword") || '',
    })
    this.init();
  }
}

TM.prototype.init = async function() {
  await this.db.init();
  this.resolveState("ready")
}

TM.prototype.recordObj = async function(id) {
  id = id || trans.getSelectedId()
  var translationData = trans.getTranslationData(undefined, {files:[id]});

  var execute = async (arrayOfValue) => {
    if (arrayOfValue.length < 1) return;
    var sql = `INSERT IGNORE INTO tm(source,translated)\nVALUES ${arrayOfValue.join(",")}`
    console.log(sql);
    await this.db.connection.execute(sql);
  }

  for (var fileId in translationData.translationData) {
    console.log("working on ", fileId)
    if (empty(translationData.translationData[fileId])) continue;
    var currentObj = translationData.translationData[fileId].translationPair;
    if (empty(currentObj)) continue;
    var buff = [];
    for (var key in currentObj) {
      buff.push(`(${mysql.escape(key)}, ${mysql.escape(currentObj[key])})`);
      if (buff.length >= 10) {
        await execute(buff)
        buff = []
      }
    }
    await execute(buff)
  }
}

TM.prototype.remindMe = async function(text, sl, tl) {
  sl ||= trans.getSl();
  tl ||= trans.getTl();
  var table = `${sl}_${tl}`;
  if (!await this.db.isTableExist(table)) {
    var blanks = []
    blanks.length = text.length;
    return blanks.fill("")
  }
  return this.db.fetchTranslation(text, table);
}

TM.prototype.remindIntoSelectedCells = async function() {
  trans.translateSelection(undefined, {translatorEngine:thisAddon.translatorEngine});
}

TM.prototype.memorizeTranslationPair = async function(translationPair={}, origin="") {
  var register = [];
	for (var i in translationPair) {
    try {
      register.push({
        original:i,
        searchable:DB.prepareSearchable(i),
        translation:translationPair[i],
        origin:origin,
      })
    } catch (e) { }
	} 
  await this.db.insert(register)
}

TM.prototype.memorizeSelectedCells = async function(replaceMode) {
  var selectedCells = common.gridSelectedCells();
  if (!selectedCells.length) return;
  var data = trans.getData();
  var translationPair = {}
  var rows = {};
  var isMultipleColumn = false;
  var thisFile = trans.getSelectedId()
  for (var i in selectedCells) {
    if (!data[selectedCells[i].row][selectedCells[i].col]) continue;
    var thisKey = data[selectedCells[i].row][trans.keyColumn]
    if (!thisKey) continue;

    translationPair[thisKey] = {
      original    :thisKey,
      searchable  :DB.prepareSearchable(thisKey),
      translation :data[selectedCells[i].row][selectedCells[i].col],
      origin      :trans.cellInfo.get("t", thisFile, selectedCells[i].row, selectedCells[i].col),
    }

    if (rows[selectedCells[i].row]) isMultipleColumn = true;
    rows[selectedCells[i].row] = true;
  }

  if (Object.keys(translationPair).length == 0) return;

  if (isMultipleColumn) {
    var conf = confirm(t("Multiple translations for one key sentence is detected.\nOnly the last found translation will be memorized by the Translation Memory.\nDo you want to continue?"))
    if (!conf) return;
  }
	
  var register = [];  
  for (var i in translationPair) {
    try {
      register.push(translationPair[i])
    } catch (e) { }
	}

  console.log("Memorizing data");
  if (replaceMode) return await this.db.insert(register, this.db.getActiveTable(), true)
  
  await this.db.insert(register)
}

TM.prototype.forgetFromSelectedCells = async function() {
  var selectedRows = common.gridSelectedRows();
  if (!selectedRows.length) return;
  var data      = trans.getData();
  var origTexts = [];
  console.log("selected rows:", selectedRows);
  for (var i in selectedRows) {
    if (!data[selectedRows[i]]) continue;
    if (!data[selectedRows[i]][trans.keyColumn]) continue;
    origTexts.push(data[selectedRows[i]][trans.keyColumn])
  }

  console.log("forgeting", origTexts);
  await this.db.delete(origTexts)
}

TM.prototype.handleCellChange = async function(changes, source) {
  if (!thisAddon.getConfig("autoMemorizeOrganic")) return;
}

TM.prototype.handleAutomationEnd = async function(changedRows) {
  if (!thisAddon.getConfig("autoMemorizeAutomation")) return;
}

TM.prototype.handleBatchTranslationResult = async function(translationData) {
  if (!thisAddon.getConfig("autoMemorizeOnTranslateCells")) return;
}


TM.initialize = async function() {
  thisAddon.resolveState("TMBeforeInitializing");

  thisAddon.handler = new TM();
  await thisAddon.handler.until("ready");

  trans.on('onLoadTrans', function(e) {
    thisAddon.handler.db.setActiveTable(`${trans.getSl()}_${trans.getTl()}`)
  });
  trans.on("languageChange", function(e, sl, tl) {
    // language change, initialize table
    thisAddon.handler.db.setActiveTable(`${trans.getSl()}_${trans.getTl()}`)
  })

  trans.on("afterCellChange", (e, changes, source)=> {
    thisAddon.handler.handleCellChange(changes, source);
  })

  trans.on("codeEditorExecutionEnd", (e, changedRows) => {
    thisAddon.handler.handleAutomationEnd(changedRows)
  })

  trans.defineProcess("translationTableFilter", async function(translationTable, translator) {
    console.warn(">> translationTableFilter arguments", arguments);
    if (!thisAddon.getConfig("autoRemindOnTranslateCells")) return translationTable;

    var texts = Object.keys(translationTable.include);
    if (texts.length == 0) return translationTable;
    var translation = await thisAddon.handler.remindMe(texts);
    console.log("From cache", translation);

    if (translation.length < 1) return translationTable
    var newTable = {
      include:{},
      exclude:translationTable.exclude||{}
    }
    for (var i=0; i<texts.length; i++) {
      var currentKey = texts[i]
      if (translation[i]) {
        newTable.exclude[currentKey] = translation[i];
        continue;
      }
      newTable.include[currentKey] = "";
    }
    return newTable;
  });

  trans.on("batchTranslationResult", (e, translationData)=> {
    thisAddon.handler.handleBatchTranslationResult(translationData)
  })


  if (updater.getUser().level < 100) {
    thisAddon.setConfig("autoMemorizeOrganic", false);
    thisAddon.setConfig("autoMemorizeAutomation", false);
    thisAddon.setConfig("autoRemindOnTranslateCells", false);
  }
  thisAddon.resolveState("TMInitialized");
  
}

this.TM = TM;
window.TM = TM;



$(document).ready(function() {
  TM.initialize();
});
