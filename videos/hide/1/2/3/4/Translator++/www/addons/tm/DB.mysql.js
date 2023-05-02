
class DB extends require("www/js/BasicEventHandler.js") {
	constructor(options) {
		super()
    this.options = options || {}
    this.host= this.options.host || 'localhost';
    this.port= this.options.port || '3306';
    this.user= this.options.user || 'root';
    this.database= this.options.database|| "tm";
    this.password= this.options.password|| '';

    this.options.maxInsertPerBatch ||= 10;
    this.options.maxSelectPerBatch ||= 10;

    this.isAvailable = false;
  }
}

DB.prepareSearchable = function(text="") {
  text ??= "";
  text = text.replace("\r", "");
  return text.toLowerCase();
}

DB.prototype.getDBPID = async function() {
  return new Promise((resolve, reject) => {
    const { exec } = require("child_process");

    exec(`netstat -ano -p tcp |find \"${this.port}\"`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return resolve(false);
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return resolve(false);
        }
        console.log(`stdout: ${stdout}`);
        var output = stdout;
        if (output.includes("LISTENING") == false) return resolve(false);
        var outputs = output.trim().split(" ");
        console.log();
        resolve(outputs[outputs.length -1]);
    });
  })

  //var task = await common.aSpawn("netstat", ["-ano", "-p", "tcp", "|find", "3306"])
}

/*
DB.prototype.setDB = async function(dbName = "tpp") {
  try {
    await this.connection.changeUser({database : dbName});
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
*/

DB.prototype.setActiveTable = async function(table) {
  if (!this.isAvailable) return;
  this.activeTable = table
  await this.initTable(table);
  this.columnList = await this.getColumnList(table);
}

DB.prototype.getActiveTable = function() {
  return this.activeTable;
}

DB.prototype.isTableExist = async function(tableName) {
  if (!this.isAvailable) return;

  tableName ||= this.getActiveTable()
  var result = await this.execute(`SHOW TABLES LIKE '${tableName}';`)
  if (!result) return false;
  if (!result[0]) return false;
  if (result[0].length > 0) return true;
  return false
}

DB.prototype.execute = async function(query) {
  if (!this.isAvailable) return [[],[]];
  
  try {
    return await this.connection.execute(query);
  } catch (e) {
    console.warn("Error when trying to execute:", query);
    if (this.retryToConnect) return [[],[]];
    if (e.toString() == "Can't add new command when connection is in closed state") {
      await common.wait(1000);
      this.retryToConnect = true;
      await this.init();
      var result = this.execute(query);
      this.retryToConnect = false;
      return result;
    }
  }
}

DB.prototype.getColumnList = async function(table) {
  if (!this.isAvailable) return [[],[]];
 
  try {
    table ||=  this.getActiveTable();
    var result = await this.execute(`SHOW COLUMNS FROM ${table};`);
    this.columns = []
    for (var i=0; i<result[0].length; i++) {
      this.columns.push(this.columns)
    }
    console.log(result)
  } catch (e) {
    console.warn("Error when trying to retrieve column list", e);
    console.log("Disabling DB")
    this.isAvailable = false;
    return [[],[]];
  }
}

DB.prototype.initTable = async function(tableName) {
  if (!this.isAvailable) return  
  if (!tableName) return console.warn("No table specified")
  if (await this.isTableExist(tableName)) return;
  console.log("initializing table", tableName)
  await this.execute(`CREATE TABLE if not exists ${tableName} (
    original text NOT NULL,
    searchable text NOT NULL,
    translation text NOT NULL,
    origin varchar(16) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

  await this.execute(`ALTER TABLE ${tableName} ADD PRIMARY KEY (original(64)) USING HASH;`)
  await this.execute(`ALTER TABLE ${tableName} ADD FULLTEXT KEY searchable (searchable);`)
}

DB.prototype.isDBExist = async function(database) {
  if (!this.isAvailable) return    
  database ||= this.database;
  var result = await this.connection.execute(`SELECT SCHEMA_NAME
  FROM INFORMATION_SCHEMA.SCHEMATA
  WHERE SCHEMA_NAME = '${database}'`)
  if (!result[0]) return false;
  if (result[0].length > 0) return true;
  return false
}

DB.prototype.insert = async function(values=[], table="", replaceMode=false) {
  if (!this.isAvailable) return    

  table ||= await this.getActiveTable();
  
  if (!Array.isArray(values)) values = [values]
  
  var execute = async (columns, arrayOfValue) => {
    if (arrayOfValue.length < 1) return;
    if (replaceMode) {
      var sql = `REPLACE INTO ${table}(${columns.join(",")})\nVALUES ${arrayOfValue.join(",")}`
      console.log(sql)
    } else {
      var sql = `INSERT IGNORE INTO ${table}(${columns.join(",")})\nVALUES ${arrayOfValue.join(",")}`
    }
    if (common.debugLevel()) console.log("Query is", sql);
    await this.execute(sql);
  }

  var sortObject = (obj)=> {
    return Object.keys(obj).sort().reduce(function (result, key) {
        result[key] = obj[key];
        return result;
    }, {});
  }

  var columns = []
  var buff = [];
  for (var i=0; i<values.length; i++) {
    var currentObj = sortObject(values[i])
    if (i==0) columns = Object.keys(currentObj);

    var line = []
    for (var key in currentObj) {
      currentObj[key] ??= "";
      line.push(mysql.escape(currentObj[key]))
    }
    buff.push(`(${line.join(",")})`);
    if (buff.length >= this.options.maxInsertPerBatch) {
      await execute(columns, buff)
      buff = []
    }
  }
  await execute(columns, buff)
}

DB.prototype.delete = async function(keys=[], tableName) {
  if (!this.isAvailable) return    
  tableName ||= this.getActiveTable()

  if (!Array.isArray(keys)) keys=[keys];
  var textQuery = []
  for (var i in keys) {
    textQuery.push(mysql.escape(keys[i]))
  }
  var query = `DELETE FROM ${tableName} WHERE original IN (${textQuery.join(",")})`
  console.log(query);
  await this.execute(query);
}

DB.prototype.fetchTranslation = async function(texts=[], tableName) {
  if (!this.isAvailable) return []
  tableName ||= this.getActiveTable()

  var handleBatch = async (texts)=> {
    if (!Array.isArray(texts)) texts=[texts];
    var textQuery = []
    for (var i in texts) {
      textQuery.push(mysql.escape(DB.prepareSearchable(texts[i])))
    }
    //var query = `SELECT * FROM ${tableName} WHERE LOWER(original) IN (${textQuery.join(",")})`
    var query = `SELECT * FROM ${tableName} WHERE searchable IN (${textQuery.join(",")})`
    var result = await this.execute(query);
    console.log("Query", query);
    console.log("DB result", result);
    try {
      if (!result) return texts.fill("")
      if (!result[0]) return texts.fill("")
      if (result[0].length == 0) return texts.fill("")

      var translated = [];
      var index = {}
      for (var i=0; i<result[0].length; i++) {
        index[DB.prepareSearchable(result[0][i].original)] = result[0][i].translation;
      }

      for (var i=0; i<texts.length; i++) {
        translated.push(index[DB.prepareSearchable(texts[i])] ?? "")
      }

      return translated;
    } catch (e) {
      return texts.fill("")
    }
  }

  console.log("chunking", texts, this.options.maxSelectPerBatch);
  var result = []
  var chunk = common.arrayChunk(texts, this.options.maxSelectPerBatch);
  console.log("chunks", chunk);
  for (var i=0; i<chunk.length; i++) {
    result.push(await handleBatch(chunk[i]));
  }

  return result.flat();
  
}

DB.testConnection = async function(connectionInfo) {
    return new Promise(async (resolve) => {
        try {
            var connection = await mysql.createConnection(connectionInfo)
            connection.end();
            resolve({
                result:true
            });
        } catch (e) {
            console.warn("Can not connect to MYSQL DB with information:", connectionInfo, e);
            resolve({
                result:false,
                error:e.toString()
            });
        }
    })

}

DB.prototype.setDB = async function(dbName) {
  // don't use this.execute in this method
    if (!dbName) return;
    this.database = dbName;
    var success = true;
    if (!await this.isDBExist(this.database)) {
        await this.connection.execute(`CREATE DATABASE IF NOT EXISTS `+this.database).catch((e)=> {
            console.warn("Failed to create database", e)
            this.isAvailable = false;
            success = false
        });
    }

    await this.connection.changeUser({database : dbName}).catch((err) => {
        console.log("Failed to change DB ", this.database);
        this.isAvailable = false;
        success = false;
    });
    return success;
}

DB.prototype.init = async function() {
    console.log("initializing DB");
    try {
        var setting = {
            host: this.host,
            port: this.port,
            user: this.user,
            /*database: this.database,*/
            password: this.password,
            supportBigNumbers:true
        };
        this.connection = await mysql.createConnection(setting)
    } catch (e) {
        console.log("Can not connect to MYSQL DB with setting:", setting, e);
        this.isAvailable = false;
        return
    }
    
    if (!await this.setDB(this.database)) {
        this.isAvailable = false;
        return;
    }



    this.isAvailable = true;  

}

module.exports = DB;