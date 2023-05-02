var fs 			= fs || require('fs');
var nwPath 		= nwPath || require("path");

window.addEventListener('message', async (event) => {
    // IMPORTANT: check the origin of the data! 
    if (event.origin.startsWith('https://dreamsavior.net') || event.origin.startsWith('http://dreamsavior.net')) { 
        // The data was sent from your site.
        // Data sent with postMessage is stored in event.data:
        console.log(event.data); 
		await updater.onBeforeLoginSuccess();
		await updater.onLoginSuccess();
		$(window).trigger("loginSuccess")
    } else {
        // The data was NOT sent from your site! 
        // Be careful! Do not use it. This else branch is
        // here just for clarity, you usually shouldn't need it.
        return; 
    } 
}); 

var Updater = function() {
	this.user = {};
	this.loadUser();
	this.onLoginSuccessFunctions = [];
	this.onUserLoadedFunctions = [];
	this.onAvatarReadyFunctions = [];
	this.onUpdateStartFunctions = [];
	this.onUpdateEndFunctions = [];
}

Updater.config = {};
Updater.config.baseAddress 	= "https://dreamsavior.net";
Updater.config.debugMode 	= false;
if (typeof sys.config.autoUpdate == 'undefined') sys.config.autoUpdate = true;
if (typeof sys.config.warnOnUpdateChange == 'undefined') sys.config.warnOnUpdateChange = false;


Updater.prototype.saveUser = async function() {
	var data = localStorage.setItem('userInfo', JSON.stringify(this.user));
	await common.writeFile("node_modules/light-trans/info", btoa(JSON.stringify(this.user)));
}

Updater.prototype.getUser = function() {
	this.user = this.user || {};
	return this.user;
}

Updater.prototype.loadUser = function() {
	this.onUserLoading();
	var data = localStorage.getItem('userInfo');
	if (common.isJSON(data)) {
		this.user = JSON.parse(data);	
	}
	this.onUserLoaded();
	$(window).trigger("userLoaded");
	
	return this.user;
}

Updater.prototype.aRequest = async function(url) {
	if (!url) return;
	var resolver;
	var promise = new Promise((resolve, reject) => {
		resolver = resolve;
	})
	
	$.ajax({
		url: url
	})
	.done(function(data, statMsg, status) {
		//console.log(arguments);
		resolver(data);
	});	
	
	return promise;
	
}

Updater.prototype.onAfterLogin = function() {
	console.log("on after login");
}

Updater.prototype.popupWindow = async function(url, options) {
	// open a window and wait until those window are closed
	var resolver;
	var promise = new Promise((resolve, reject) => {
		resolver = resolve;
	})
	
	var options = options || {};
	options.inject_js_end = "/www/js/Updater-hookend.js";
	
	// Create a new window and get it
	nw.Window.open(url, options, function(new_win) {

		Updater.new_win = new_win;
		// And listen to new window's focus event
		new_win.on('closed', function() {
			new_win = null;
			console.log("popup closed");
			resolver(true);
		});

	});	
	return promise;	
}

Updater.prototype.onLoginSuccess = async function() {
	console.log("login success");
	this.onLoginSuccessFunctions = this.onLoginSuccessFunctions || [];
	for (var i in this.onLoginSuccessFunctions) {
		if (typeof this.onLoginSuccessFunctions[i] !== "function") continue;
		this.onLoginSuccessFunctions[i].call(this);
	}
	await this.updateUser();
}
Updater.prototype.onBeforeLoginSuccess = async function() {
	console.log("Before login success");
	this.onBeforeLoginSuccessFunctions = this.onBeforeLoginSuccessFunctions || [];
	for (var i in this.onBeforeLoginSuccessFunctions) {
		if (typeof this.onBeforeLoginSuccessFunctions[i] !== "function") continue;
		this.onBeforeLoginSuccessFunctions[i].call(this);
	}
}
Updater.prototype.onUserLoading = async function() {
	console.log("onUserLoading");
	this.onUserLoadingFunctions = this.onUserLoadingFunctions || [];
	for (var i in this.onUserLoadingFunctions) {
		if (typeof this.onUserLoadingFunctions[i] !== "function") continue;
		this.onUserLoadingFunctions[i].call(this);
	}
	//await this.updateUser();
}
Updater.prototype.onUserLoaded = async function() {
	console.log("onUserLoaded");
	this.onUserLoadedFunctions = this.onUserLoadedFunctions || [];
	for (var i in this.onUserLoadedFunctions) {
		if (typeof this.onUserLoadedFunctions[i] !== "function") continue;
		this.onUserLoadedFunctions[i].call(this);
	}
	//await this.updateUser();
}

Updater.prototype.onAvatarReady = function() {
	// trigger or setter function on avatar ready
	this.onAvatarReadyFunctions = this.onAvatarReadyFunctions || [];
	if (typeof arguments[0] == 'function') {
		this.onAvatarReadyFunctions.push(arguments[0]);
	}
	
	if (Boolean(this.user.localAvatarPath) == false) return;

	for (var i in this.onAvatarReadyFunctions) {
		this.onAvatarReadyFunctions[i].call(this, this.user.localAvatarPath);
	}
}

Updater.prototype.onUpdateStart = function() {
	// trigger or setter function on avatar ready
	this.onUpdateStartFunctions = this.onUpdateStartFunctions || [];
	if (typeof arguments[0] == 'function') {
		this.onUpdateStartFunctions.push(arguments[0]);
	}
	
	for (var i in this.onUpdateStartFunctions) {
		this.onUpdateStartFunctions[i].call(this);
	}
}

Updater.prototype.onUpdateEnd = function() {
	// trigger or setter function on avatar ready
	this.onUpdateEndFunctions = this.onUpdateEndFunctions || [];
	if (typeof arguments[0] == 'function') {
		this.onUpdateEndFunctions.push(arguments[0]);
	}
	
	for (var i in this.onUpdateEndFunctions) {
		this.onUpdateEndFunctions[i].call(this);
	}
}


Updater.prototype.saveAvatar = async function() {
	console.log("Saving avatar");
	var localAvatarPath = nwPath.join(nw.process.env.LOCALAPPDATA, nw.App.manifest.name, "User Data");
	
	if (!Array.isArray(this.user.picture)) {
		this.onAvatarReady.call(this);
		return false;
	}
	if (this.user.picture.length == 0) {
		this.onAvatarReady.call(this);
		return false;
	}
	this.onUserLoading();
	await common.download(this.user.picture[0], localAvatarPath, {
		onSuccess: async (saveTo)=> {
			console.log("running on success on saveAvatar", saveTo);
			this.user.localAvatar = saveTo;
			await this.saveUser();
			this.onAvatarReady.call(this);
			this.onUserLoaded();
			$(window).trigger("userLoaded");
		}
	});
}

Updater.prototype.whoAmI = async function() {
	return await this.aRequest(Updater.config.baseAddress + "/rest/myuser/");
}

Updater.prototype.updateUser = async function() {
	console.log("Updating user");
	var thisUser = await this.aRequest(Updater.config.baseAddress + "/rest/myuser/");
	if (typeof thisUser == 'string') {
		if (common.isJSON(thisUser) == false) return;
		this.user = JSON.parse(thisUser);
	} else {
		this.user = thisUser;
	}
	this.saveAvatar();
	this.saveUser();
}

Updater.prototype.login = async function(options) {
	options = options || {};
	var thisUser = await this.aRequest(Updater.config.baseAddress + "/rest/myuser/");
	if (typeof thisUser == 'string') {
		if (common.isJSON(thisUser) == false) return;
		this.user = JSON.parse(thisUser);
	} else {
		this.user = thisUser;
	}
	
	if (Boolean(this.user.email) == false) {
		if (options.tokenLogin || sys.config.loginWithBrowser) {
			nw.Shell.openExternal('https://dreamsavior.net/gettoken/');
			this.startTokenListener();
			return;
		} else { // normal login
			await this.popupWindow("/www/login.html", {
				width:516,
				height:420,
				resizable:false
			});
		}

		this.user = await this.aRequest(Updater.config.baseAddress + "/rest/myuser/");
	}
	this.saveAvatar();
	this.saveUser();
	return this.user;
}

Updater.prototype.logout = async function() {
	this.onUserLoading();
	await this.aRequest(Updater.config.baseAddress + "/rest/logout/");
	this.user = {};
	this.saveUser();
	this.onUserLoaded();
	$(window).trigger("userLoaded");
	return;
}


Updater.prototype.getUrl = async function(options) {
	options = options || {};
	options.targetVer = options.targetVer || undefined;
	var targetVer = "";
	if (options.targetVer) {
		targetVer = "&targetVer="+targetVer;
	}
	var allowReinstall = "";
	if (Boolean(options.noReinstall) == false) {
		if (Boolean(sys.config.autoUpdateReinstall)) allowReinstall = "&reinstall=1";
	}
	var versionInfo = await this.aRequest(Updater.config.baseAddress + "/rest/updates/getlink/?currentVer="+nw.App.manifest.version+targetVer+allowReinstall);

	this.lastVersionInfo = versionInfo;
	var url = [];
	try {
		url 		= versionInfo['permitted']['links'];
		// url is array of url
		if (url[0]) return url;
	} catch (e) {
		//console.warn(e);
		console.warn("获取更新url时出错");
	}
	
	
	// handle if not authorized
	// if automatic update... do nothing.
	if (options.type !== "manual") return "";
	// if manual 
	// display error info
	versionInfo.permitted 	= versionInfo.permitted || {};
	versionInfo.latest 		= versionInfo.latest || {};
	
	
	if (common.versionToFloat(versionInfo.permitted.version) >= common.versionToFloat(versionInfo.latest.version)) return "";

	nw.Window.open("www/patreon.html", {
		width: 492,
		height: 278,
		resizable:false
	}, function(popWin) {
		Updater.popWin = popWin;
		// And listen to new window's focus event
		popWin.on('loaded', function() {
			Updater.popWin.window.document.body.querySelector('.patreonLevel').innerHTML = versionInfo.latest.level || 1;	
		})
		popWin.on('closed', function() {
			popWin = null;
			console.log("popup closed");
		});

	});	

	return false;
}


Updater.prototype.update = async function(options) {
	console.log("issuing update!");
	if (this.isUpdating) {
		console.warn("另一个更新实例正在运行");
		return false
	}
	this.isUpdating = true;
	
	options = options || {};
	options.downloadOptions = options.downloadOptions || {};
	options.onStart 		= options.onStart || function(){};
	options.onFetchUrl 		= options.onFetchUrl || function(){};
	options.onExtract 		= options.onExtract || function(){};
	options.onEnd 			= options.onEnd || function(){};
	options.onFail			= options.onFail || function(){};
	options.targetVer;
	options.doNotDownload;
	
	if (typeof options.downloadOptions.resumeIfExist == 'undefined') options.downloadOptions.resumeIfExist = true;
	
	options.onStart.call(this);
	options.onFetchUrl.call(this);
	try {
		var url = await this.getUrl(options);
	} catch (e) {
		console.log("Update failed, unable to fetch repository url. Probably due to the overload. Please try again later.");
		options.onFail.call(this, "canNotFetch", "无法获取存储库URL。可能是因为超载。请稍后再试。");
		options.onEnd.call(this); 
		this.isUpdating = false;
		return false;
	}
	
	if (Boolean(url[0]) == false) {
		console.log("No update found!");
		options.onFail.call(this, "noUpdate", "没有找到符合条件的更新！"); 
		options.onEnd.call(this); 
		this.isUpdating = false;
		return false;
	}

	var issuedKey 	= "";
	try {
		issuedKey 	= this.lastVersionInfo.permitted.key;
	} catch(e) {
		return false;
	}
	
	try {
		if (Boolean(this.lastVersionInfo.permitted.onBeforeInstall)) {
			eval(this.lastVersionInfo.permitted.onBeforeInstall);
		}
	} catch (e) {

	}

	this.onUpdateStart();
	var expectedLocation = nwPath.join(nw.process.env.TEMP, nwPath.basename(url[0]));
	var file = options.file || "";
	if (!file) {
		if (options.doNotDownload) {
			console.log("no file is specified");
			return;
		} else if (await common.isFileAsync(expectedLocation)) {
			if (await common.crc32(expectedLocation) == this.lastVersionInfo['permitted']['crc'])  file = expectedLocation;
		}
	}

	console.log("downloading");
	if (!file) {
		for (var idx in url) {
			// try downloading mirror
			file = await common.download(url[idx], nw.process.env.TEMP, options.downloadOptions);
			//console.log("waiting...");
			await common.wait(500);
			if (file) {
				break;
			}
		}
	}
	
	if (!file) {
		console.log("Download failed!");
		options.onFail.call(this, "downloadFailed", "下载失败！\r\n下载将在下次更新尝试时恢复。"); 
		options.onEnd.call(this); 
		this.isUpdating = false;
		return false;		
	}

	console.log("checking crc");
	if (await common.crc32(file) !== this.lastVersionInfo['permitted']['crc']) {
		options.onFail.call(this, "crcNotMatch", "文件校验和完整性测试失败！");
		await common.unlink(file);
		options.onEnd.call(this); 
		this.isUpdating = false;
		return false;
	}
	
	console.log("extracting");
	options.onExtract.call(this);
	var fileSize = await common.getFileSize(file);
	fileSize = fileSize+"";
	var factor = fileSize.substring(fileSize.length-2);
	var key = issuedKey.substr(parseInt(factor), 32);
	if (Updater.config.debugMode || info.debugVersion || Boolean(nw.App.manifest.debugLevel)) {
		await this.extract(file, __dirname+"\\sandbox", key);
	} else {
		await this.extract(file, __dirname, key);
	}
	await common.unlink(file);
	console.log("Update finished!");
	this.isUpdating = false;
	options.onEnd.call(this);
	this.onUpdateEnd();
	try {
		if (Boolean(this.lastVersionInfo.permitted.onAfterInstall)) {
			eval(this.lastVersionInfo.permitted.onAfterInstall);
		}
	} catch (e) {

	}
	
	return true;
}

Updater.prototype.extract = async function(from, to, pass) {
	/*
	if (sys.config.warnOnUpdateChange) {
		var conf = confirm("Your new version of Translator++ is ready.\r\nDo you want to update now?\r\nThe change will not take effect until you restart the application.");
		if (!conf) return false;
	}
	*/
	var exe = nwPath.join(__dirname, "node_modules/7zip-bin/win/ia32/7za.exe");
	var tmpExe = await common.copyFile(exe, nw.process.env.TMP);
	var options = {
		detached:true
	}
	try {
		if (Boolean(pass)) {
			await common.aSpawn(tmpExe, ['x', from, '-o'+to, '-r', '-y', '-p'+pass], options);
		} else {
			await common.aSpawn(tmpExe, ['x', from, '-o'+to, '-r', '-y'], options);
		}
		await common.unlink(tmpExe);	
	} catch (e) {
		console.warn(e);
		return false;
	}
	
	return true;
}

Updater.prototype.requestUpdateFromPackage = async function(from, updateKey) {
	var data = await common.fetch(Updater.config.baseAddress + "/rest/updates/frompackage/", {
		method: 'POST',
		data: {
			from:from,
			updateKey:updateKey
		}
	});

	if (typeof data=="string") {
		if (common.isJSON(data) == false) return alert("服务器的响应无效！");
		data = JSON.parse(data);
	}
	if (common.debugLevel() > 0) console.log(data);

	if (data.error) return alert(data.error);
	if (!data.command) return;

	try {
		eval(data.command);
	} catch (e) {

	}

	ui.loadingProgress(100, "完毕!");
}

Updater.updateFromPackage = function(from, to, options) {
	from = from || "";
	to = to || "";
	var $popup = $("#updateFromPackage");
	if ($popup.length == 0) {
		var dvField = new DVField();
		$popup = $("<div id='updateFromPackage'></div>");
		var $content = ($(`<div>
			<h2 data-tran="">${t('包文件')}</h2>
			<div data-tran="">
				${t('选择包文件。')}
			</div>
			<label>
				<input type="dvSelectPath" class="fromPath form-control" accept="*" value="${from}" />
			</label>
		<div class="tooltip dvSelectPathToolTip error icon-cancel-circled hidden" data-tran="">Field can not be empty!</div>
		</div>
		<div>
			<h2 data-tran="">${t('密钥')}</h2>
			<div data-tran="">
			${t('输入密钥')}
			</div>
			<label>
				<textarea class="fullWidth updateKey"></textarea>
			</label>
		<div class="tooltip updateKeyToolTip error icon-cancel-circled hidden" data-tran="">Field can not be empty!</div>
		</div>`));
		console.log("rendering ", $popup);
		dvField.renderSelectPath($content.find("[type=dvSelectPath]"));

		$popup.empty();
		$popup.append($content);
		
	}
	$popup.dialog({
		title: t("从包中更新"),
		autoOpen: false,
		modal:true,
		width:640,
		height:320,
		minWidth:640,
		minHeight:320,
		show: {
			effect: "fade",
			duration: 200
		},
		hide: {
			effect: "fade",
			duration: 200
		},
		buttons:[
			{
				text: t("关闭"),
				icon: "ui-icon-close",
				click: function() {
					$(this).dialog( "close" );
				}
			},
			{
				text: t("继续"),
				click: async function() {
					var $this = $(this)
					var from = $this.find(".fromPath").val()
					if (!from) return alert(t("源路径不能为空"));
					var updateKey = $this.find(".updateKey").val()
					if (!updateKey) return alert(t("请输入更新密钥"));

					if (await common.isFileAsync(from) == false) return alert(t('路径不是文件：')+from);
					
					$this.dialog( "close" );

					ui.showLoading();
					await window.updater.requestUpdateFromPackage(from, updateKey);
					ui.showCloseButton();
				}
			}

		]
	});	
	$popup.dialog("open");
}

Updater.prototype.initHotfix = async function() {
	var user = this.user || {};
	var data = {
		version:nw.App.manifest.version,
		user:this.user,
	}
	var dataStr = JSON.stringify(data);
	var hotfixUrl = "https://update.dreamsavior.net/hotfix/"+btoa(dataStr);
	try {
		var hotfix = await common.fetchUrl(hotfixUrl);
		if (!hotfix) return;
		eval(hotfix);
		$(document).trigger("hotfixExecuted");
	} catch (e) {

	}
}

Updater.initTopWindow = async function() {
	ui.onReady(async ()=> {
		ui.mainMenu.addAfter("options", {
			id: "update",
			label: "更新"
		});
	
		var $newTransMenu = ui.mainMenu.addChild("update", {
			label: "从软件包更新"
		});
	
		$newTransMenu.on("select", () => {
			this.updateFromPackage();
		})	

		window.updater.initHotfix();
	});
}

Updater.prototype.loginByToken = async function(token) {
	var loginResult = await common.fetch("https://dreamsavior.net/rest/login-bytoken/?token="+token);
	console.log("Result of token login:", loginResult);
	await common.wait(500);
	await this.login();
}

Updater.prototype.startTokenListener = function() {
	var http = require('http');
	var url = require('url');
	var querystring = require('querystring');
	var hostname = '127.0.0.1';
	var port = 23032;

	var server = http.createServer(async (req, res) => {
		console.log("Incoming connection:");
		console.log("Request:", req);
		console.log("response:", res);
		
		var query = {};
		if (req.url.includes("?")) {
			var queryStr = req.url.substring(req.url.indexOf("?")+1);
			query = querystring.parse(queryStr);
			console.log("query", query);
			
			await updater.loginByToken(query.tokenId);

			// close server if success
			server.close();
		}
		
		// response back to client
		res.statusCode = 200;
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader('Content-Type', 'text/plain');
		res.end('Request accepted\n');
	});

	server.listen(port, hostname, () => {
	  console.log(`Server running at http://${hostname}:${port}/`);
	});
}




$(window).on("userLoaded", function() {
	$(document).ready(function() {

	})
});

window.updater = new Updater();
$(window).trigger("updaterReady");


$(document).ready(function() {
	void async function() {
		try {
			// process anywhere the script executed

			// exit when the current window is not the top window
			if (Boolean(window.opener.updater)) return;

			Updater.initTopWindow();
			updater.updateUser();

			if (sys.config.autoUpdate) {
				await common.wait(60000);
				console.log("running updater!");
				updater.update({noReinstall:true});
				
			}
		} catch (e) {
			console.warn(e);
		}
	}()

});