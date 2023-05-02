const { resolve } = require('path');


/**
 * @class
 */
class Thread {
    constructor(options) {
        this.options            = options || {};
        this.id                 = this.options.id || common.generateId();
        Thread.list[this.id]    = this;
        this.status             = "closed"
        this.lastActivity       = Date.now();
        this.debugLevel         = 0;
        this.$elm = $("<s></s>");
    }
}
Thread.list = [];
Thread.sessions = {};
Thread.saveSession = async function(sessionName, content) {
    await common.mkDir(nwPath.join(__dirname, "data/session"));
    await common.filePutContents(nwPath.join(__dirname, "data/session", sessionName+".ses"), JSON.stringify(content), "utf8");
}

Thread.loadSession = async function(sessionName, force) {
    if (!force) {
        if (Thread.sessions[sessionName]) return Thread.sessions[sessionName];
    }
    try {
        Thread.sessions[sessionName] = JSON.parse(await common.fileGetContents(nwPath.join(__dirname, "data/session", sessionName+".ses"), "utf8"));
        return Thread.sessions[sessionName];
    } catch (e) {
        return "";
    }
}

Thread.removeSession = async function(sessionName) {
    delete Thread.sessions[sessionName];
    await common.unlink(nwPath.join(__dirname, "data/session", sessionName+".ses"));
}

Thread.prototype.bump = function() {
    this.lastActivity       = Date.now();
    return this.lastActivity;
}

Thread.prototype.close = async function(noConfirm) {
    try {
        if (!noConfirm) await threadServer.send(this.ws, "close");
    } catch (e) {
        
    }
    delete Thread.list[this.id];
}

Thread.prototype.on = function(evt, fn) {
    this.$elm.on(evt, fn)
}

Thread.prototype.off = function(evt, fn) {
    this.$elm.off(evt, fn)
}

Thread.prototype.one = function(evt, fn) {
    this.$elm.one(evt, fn)
}

Thread.prototype.trigger = function(evt, param) {
    this.$elm.trigger(evt, param)
}
/**
 * Execute immidiately or wait until the thread is ready
 * todo : should wait until all libraries are loaded
 * @param  {} fn
 */
Thread.prototype.onReady = async function(fn) {
    fn = fn || async function(){};
    if (this.isReady()) {
        return await fn()
    } else {
        return new Promise(async (resolve, reject) => {
            this.one("ready", async function(e, param) {
                resolve(await fn());
            });        
        });
    }
}

Thread.prototype.openThreadWindow = async function() {
    if (this.isWindowOpened) return console.warn("Window with ID:"+this.id+" is already opened!");
    this.on("statusChange", (e, status) => {
        console.log("Status of the client is:", status);
    });
    this.on("close", (e) => {
        console.log("Client closed");
        this.close(true);
    });
    this.on("activity", (e) => {
        this.bump();
    });
    this.on("log", (e, data) => {
        data.msg[0] = `<span class='threadId'>${this.id} &gt;</span> `+data.msg[0]
        ui.log.apply(this, data.msg)
    });

    return new Promise((resolve, reject) => {
        //var showWindow = false;
        //if (this.debugLevel) showWindow = true;
        var options = {
            new_instance    : true, 
            show            : false,
            show_in_taskbar : false
        }
        if (this.debugLevel) {
            options.show = true;
            options.show_in_taskbar = true;
        }
        nw.Window.open(`www/thread.html?id=${this.id}&port=${threadServer.port}`, options, (win) => {
            console.log("Thread window is opened!");
            this.isWindowOpened = true;
        }); 

        this.one("ready", function(e, param) {
            console.log("client is connected:", param);
            resolve();
        });        
    });
}

Thread.prototype.isReady = function() {
    if (this.status == "ready") return true;
    return false;
}

Thread.prototype.setStatus = function(status) {
    this.status = status;
    return status;
}

Thread.prototype.sendWhenReady = async function(command, msg, options) {
    return new Promise(async (resolve, reject) => {
        var processResult = async (resultBody) => {
            console.log("Processed result:", resultBody);
            var result = resultBody.msg;
            if (resultBody.type == "object") {
                if (common.isJSON(result)) result = JSON.parse(result);
            }
            resolve(result);
        }

        if (this.isReady()) {
            await threadServer.send(this.ws, command, msg, options);
            this.one("result", async (e, resultBody) => {
                await processResult(resultBody);
            })            
        } else {
            this.one("ready", async (e) => {
                await threadServer.send(this.ws, command, msg, options);
                this.one("result", async (e, resultBody) => {
                    await processResult(resultBody);
                })
            });
        }
    })
}







/**
 * Handle socket as a server
 * @class
 */
var ThreadServer = function() {
    this.threadList = Thread.list;
    this.$elm = $("<s></s>");
    this.queue = [];
}
ThreadServer.getNumberOfCPU = function() {
    var os = require('os');
    return os.cpus().length;
}
ThreadServer.getRecomendedMaxThread = function() {
    var os = require('os');
    return os.cpus().length - 1;
}

ThreadServer.prototype.on = function(evt, fn) {
    this.$elm.on(evt, fn)
}

ThreadServer.prototype.off = function(evt, fn) {
    this.$elm.off(evt, fn)
}

ThreadServer.prototype.one = function(evt, fn) {
    this.$elm.one(evt, fn)
}

ThreadServer.prototype.trigger = function(evt, param) {
    this.$elm.trigger(evt, param)
}

ThreadServer.prototype.distributeTask = async function(tasks=[]) {
    if (Array.isArray(tasks) == false) tasks = [tasks]
}

ThreadServer.shuffle = function(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

/**
 * Get random iddle task
 */
ThreadServer.prototype.getIddleThread = function() {
    var keys = Object.keys(this.threadList);
    ThreadServer.shuffle(keys);
    for (var i in keys) {
        if (this.threadList[keys[i]].isReady()) return this.threadList[keys[i]];
    }
}

ThreadServer.prototype.waitForIddleThread = async function() {
    var iddleThread = this.getIddleThread();
    if (iddleThread) return iddleThread;
    return new Promise((resolve, reject)=> {
        this.one("threadReady", (evt, thread) => {
            if (thread.isReady()) {
                resolve(thread);
            } else {
                resolve(this.waitForIddleThread());
            }
        })
    })
}

ThreadServer.prototype.appendQueue = async function(queue) {
    if (!Array.isArray(queue)) queue = [queue];
    this.queue = this.queue.concat(queue);
}

ThreadServer.prototype.processQueue = async function(queue) {
    queue = queue || this.queue
    if (!Array.isArray(queue)) queue = [queue];
    var results     = [];
    var promises    = [];

    while (queue.length > 0) {
        var thread = await this.waitForIddleThread();

        var thisProcess = queue.shift();
        promises.push(
            new Promise((resolve, reject) => {
                thread.sendWhenReady("run", thisProcess).then((result)=>{
                    resolve(result);
                    results.push(result)
                })
            })
        )
    }
    
    return new Promise((resolve, reject) => {
        Promise.all(promises).then(()=> {
            resolve(results);
        })
    })
}

/**
 * Add task to the iddle process.
 * If none is iddle, will wait until there is iddle process
 */
ThreadServer.prototype.addTask = async function() {
    
}
ThreadServer.prototype.getThreadById = function(id) {
    if (!this.threadList[id]) console.warn("No thread with id", id);
    return this.threadList[id];
}

ThreadServer.actions = {
    echo: async function(data, ws, req) {
        console.log("response back:", data.msg);
        ws.send(data.msg);
    },
    close: async function(data, ws, req) {
        this.threadList[ws.id].status = "closing";
        await this.threadList[ws.id].close();
    },
    setStatus: function(data, ws, req) {
        this.threadList[ws.id].status = data.msg;
        this.threadList[ws.id].trigger("statusChange", data.msg);
        if (data.msg == "ready") {
            this.threadList[ws.id].trigger("ready", data.msg);
            this.trigger("threadReady", this.threadList[ws.id]);
        } else if (data.msg == "close") {
            this.threadList[ws.id].trigger("close", data.msg);
            this.trigger("threadClose", this.threadList[ws.id]);
        }
    },
    result: function(data, ws, req) {
        this.threadList[ws.id].trigger("result", data);
    },
    log: function(data, ws, req) {
        this.threadList[ws.id].trigger("log", data);
    }
}

ThreadServer.prototype.action = async function(action, data, ws, req) {
    if (!ThreadServer.actions[action]) return;
    return await ThreadServer.actions[action].call(this, data, ws, req)
}

ThreadServer.prototype.send = async function(ws, command, msg, options) {
    var thread = this.getThreadById(ws.id);
    thread.setStatus("processing");
    options         = options || {};
    options.command = command || options.command;
    options.msg     = msg || options.msg || "";
    options.type    = typeof options.msg;
    options.time    = options.time || Date.now();
    if (options.type == "function") {
        options.msg =  options.msg.toString();
    }
    return new Promise((resolve, reject) => {
        ws.send(JSON.stringify(options), ()=> {
            resolve();
        });
    })
}

ThreadServer.prototype.closeThreads = async function() {
    ui.log("Closing threads");
    for (var i in this.threadList) {
        await this.threadList[i].close();
    }
}

ThreadServer.prototype.close = async function() {
    await this.closeThreads();
    return new Promise((resolve, reject) => {
        this.wss.close(()=> {
            resolve();
        })
    })
}

/**
 * Open n number of thread
 * If some thread are already opened, will make sure that the opened thread not less then the number 
 * @param  {} num=1
 * @param  {} force=false
 */
ThreadServer.prototype.startThread = async function(num=1, force=false) {
    ui.log(`Starting ${num} thread(s)`);
    if (!num) return;
    var num = num || 1;
    var promises = [];
    if (!force) num = num - this.threadList.length;
    for (var i=0; i<num; i++) {
        var thisThread = new Thread();
        promises.push(thisThread.openThreadWindow());
    }

    return Promise.all(promises);
}

ThreadServer.prototype.processMessage = async function(message, ws, req) {
    try {
        if (!this.threadList[ws.id]) return;
        var str = message.toString();
        console.log(`received from ${ws.id}: `, str);
    
        if (common.isJSON(str)) {
            var data = JSON.parse(str);
            data = data || {};
            if (data.command) await this.action(data.command, data, ws, req);
        }
    } catch (e) {
        console.warn("Error processing message ", e);
        console.log("ProcessMessage", message.toString());
    }
}

ThreadServer.prototype.onServerStart = function() {
    console.log("Thread server started on port "+this.port);

    $(document).off("close.ts");
    $(document).on("close.ts", ()=>{
        this.close();
    });
    this.isReady = true;
}

/**
 * Return true if the server is ready
 */
ThreadServer.prototype.getReadyState = async function() {
    if (this.isReady) return "ready";
}

ThreadServer.prototype.start = function() {
    var { WebSocketServer } = require('ws');
    this.port = common.rand(40000, 45000);
    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on('error', (err) => {
        console.warn("Error occured", err);
    })

    this.wss.on('listening', async () => {
        this.onServerStart();
    });

    this.wss.on('connection',  (ws, req) => {
        var thisId = nwPath.basename(req.url);
        this.threadList[thisId]     = this.threadList[thisId] || {};
        this.threadList[thisId].ws  = ws;
        this.threadList[thisId].req = req;
        ws.id = thisId;
        console.log(thisId+" is connected:", ws, req);

        ws.on('message', async (message, arg) => {
            // message is buffer
            //console.log("Message received from ", thisId, message, arg);
            if (!this.threadList[thisId]) return console.warn("No thread with id ", thisId, "when trying to process message :", message);
            this.threadList[thisId].trigger("activity");
            await this.processMessage(message, ws, req);
        });
        ws.on('ping', async (message) => {
            //console.log("ping from "+thisId, message);
            this.threadList[thisId].trigger("activity");
            ws.pong();
        });
        ws.on('pong', async (message) => {
            //console.log("pong from "+thisId, message);
            this.threadList[thisId].trigger("activity");
        });

        ws.send('Welcome to the Translator++ server');
    });
}






class ThreadHost {
    constructor(options) {
        this.init()
        this.$elm = $("<s></s>");
    }
}

ThreadHost.prototype.on = function(evt, fn) {
    this.$elm.on(evt, fn)
}

ThreadHost.prototype.off = function(evt, fn) {
    this.$elm.off(evt, fn)
}

ThreadHost.prototype.one = function(evt, fn) {
    this.$elm.one(evt, fn)
}

ThreadHost.prototype.trigger = function(evt, param) {
    this.$elm.trigger(evt, param)
}
ThreadHost.prototype.setStatus = async function(status) {
    this.status = status;
    await this.send("setStatus", status);
    return this.status;
}
ThreadHost.prototype.getStatus = async function() {
    return this.status;
}

ThreadHost.actions = {
    echo: async function(data) {
        console.log("response back:", data.msg);
        this.ws.send(data.msg);
    },
    close: async function(data) {
        await this.setStatus("closed");
        await this.close();
    },
    run: async function(data) {
        this.displayStatus("busy");
        await this.setStatus("busy");
        try {
            //if (data.type == "function") data.msg = `return (${data.msg})()`
            data.msg = `return (${data.msg})()`
            let AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            var thisVal = new AsyncFunction(data.msg);
            var result = await thisVal() || ""
            await this.send("result", result);
        } catch (e) {
            console.warn(e);
            await this.send("result", "Error executing "+data.msg+"\n"+e.toString(), {error:true});
            console.error(`Error executing\n`+ `return (${data.msg})()\n`+e.toString());
        }
        this.displayStatus("ready");
        await this.setStatus("ready");
    }
}

ThreadHost.prototype.action = async function(action, data) {
    if (!ThreadHost.actions[action]) return;
    return await ThreadHost.actions[action].call(this, data)
}

ThreadHost.prototype.send = async function(command, msg, options) {
    options         = options || {};
    options.command = command || options.command;
    options.msg     = msg || options.msg;
    options.type    = typeof options.msg;
    options.time    = options.time || Date.now();
    if (options.type == "function") {
        options.msg =  options.msg.toString();
    }
    return new Promise((resolve, reject) => {
        this.ws.send(JSON.stringify(options), ()=> {
            console.log("resolve")
            resolve();
        });
    })
}

ThreadHost.prototype.processMessage = async function(message) {
    var str = message.toString();
    console.log('received: ', str);

    if (common.isJSON(str)) {
        var data = JSON.parse(str);
        data = data || {};
        if (data.command) await this.action(data.command, data);
    }
}

ThreadHost.prototype.ping = async function(timeout) {
    timeout = timeout || 30000;
    return new Promise((resolve, reject) => {
        var tout = setTimeout(()=>{
            reject(`Timeout after no reply for ${timeout} ms`);
        }, timeout);
        this.one("pong", ()=>{
            console.log("Server is active");
            clearTimeout(tout);
            resolve();
        })
        this.ws.ping();
    })
}

ThreadHost.prototype.pingWithInterval = function() {
    var timeOutLooper = () => {
        var pingInterval = setTimeout(async ()=>{
            try {
                await this.ping();
                timeOutLooper();
            } catch (e) {
                clearTimeout(pingInterval);
                this.close();
            }
        }, 15000)
    }

    timeOutLooper();
}

ThreadHost.prototype.connect = async function(port) {
    return new Promise((resolve, reject) => {
        var WS = require("ws");
        var socket = new WS(`ws://127.0.0.1:${port}/thread/`+this.id);
        //var socket = new WebSocket(`ws://127.0.0.1:${port}/thread/`+this.id);
        this.ws = socket;

        // Listen for messages
        socket.addEventListener('message', async (event) => {
            await this.processMessage(event.data);
        });

        // error
        socket.addEventListener('error', (event) => {
            console.log("error", event);
        });

        // close
        socket.addEventListener('close', (event) => {
            this.displayStatus("Disconnected!");
        });

        socket.addEventListener('ping', (event) => {
            //console.log("received ping", event);
            socket.pong();
        });

        socket.on('pong', (msg) => {
            this.trigger("pong");
            //console.log("received pong", msg);
        });

        // Connection opened
        socket.addEventListener('open', (event) => {
            this.displayStatus(`Thread ID ${this.id} is Connected to server!`);
            this.setStatus('ready');
            this.pingWithInterval();
            resolve();
        });
    })
}

ThreadHost.prototype.init = async function() {
    this.query = window.location.search.substr(1)
    var searchparam = new URLSearchParams(this.query);
    this.id = searchparam.get("id");


    // wait until loadMonitor is loaded;
    await LoadMonitor.waitUntilLoaded();
    await this.connect(searchparam.get("port"));

    // replace the original behavior of ui.log
    ui.log = function() {
        threadHost.send("log", Array.from(arguments))
    }
}

ThreadHost.prototype.close = async function() {
    try {
        await this.send("close");
    } catch (e) {

    }
    this.ws.terminate();
    win.close(true);
}

ThreadHost.prototype.displayStatus = function(str) {
    $('[data-window="thread"] .status').html(str);
    console.log(str);
}


$(document).ready(function() {
	if ($('body').is('[data-window="thread"]'))  {
        window.threadHost = new ThreadHost();
        var win = nw.Window.get();
        win.on('close', function () {
            window.threadHost.close();
            this.hide(); // Pretend to be closed already
            console.log("We're closing...");
            this.close(true); // then close it forcefully
        });
    } else if ($('body').is('[data-window="trans"]')) {
        window.threadServer = new ThreadServer();
        threadServer.start();
    }

})