var fs 		= fs || require('fs');
var _7z 	= _7z||require('7zip-min');
var nwPath 	= nwPath||require('path');

var ThirdParty = function(config) {
	this.config 			= config;
	this.defaultConfigPath 	= '3rdParty\\config.json'
	this.configPaths 		= [this.defaultConfigPath]
	this.configUrl 			= "http://dreamsavior.net/mirror/config/config.json"
	this.acceptedArchive	= ["7z", "7zip", "zip", "lzma", "cab", "gzip"]
	this.config				= {};
	this.isInitialized		= false;
	this.init.apply(this, arguments);
}
/**
 * Add config file to be loaded at initialization
 * @param  {String} configPath
 */
ThirdParty.prototype.addConfigFile = async function(configPath) {
	if (!await common.isFileAsync(configPath)) return console.warn("无效的配置文件：", configPath);
	this.configPaths.push(configPath);
}

/**
 * Add configuration from object
 * @param  {Object} config
 */
ThirdParty.prototype.addConfig = function(config) {
	this.config = {...this.config, ...config.products };
	console.log(this.config);
}

/**
 * Append configuration from file
 * @param  {String} configFile
 */
ThirdParty.prototype.loadConfigFile = async function(configFile) {
	try {
		var content = await common.fileGetContents(configFile);		
		var contentVar = JSON.parse(content);
		this.addConfig(contentVar);
	} catch (e) {
		console.warn("尝试将文件添加到配置时出错：", configFile);
	}
	console.log(this.config);
}

ThirdParty.prototype.initConfig = async function(configPaths) {
	console.log("Third party load config");
	configPaths = configPaths || this.configPaths;
	if (Array.isArray(configPaths) == false) configPaths = [configPaths]
	try{
		// handling main config
		// main config is configPaths[0]
		var content = await common.fileGetContents(configPaths[0]);
		var contentVar = JSON.parse(content);
		this.addConfig(contentVar);
		this.configDate = contentVar.info.date;

		// load additional config
		for (var i=1; i<configPaths.length; i++) {
			this.loadConfigFile(configPaths[i]);
		}
	} catch (e) {
		console.warn("加载第三方配置时出错：", e)
	}
}



ThirdParty.prototype.init = function(config) {
	if (!this.isInitialized) {
		this.initConfig();
		this.isInitialized = true;
	}
}

ThirdParty.prototype.update = function(url, options) {
	url = url||this.configUrl;
	options = options||{};
	options.onDone = options.onDone || function() {};
	var request = require('request');
	var progress = require('request-progress');
	request(url, function (error, response, body) {
		options.onDone.call(this, body);
	})
	.pipe(fs.createWriteStream(this.defaultConfigPath))
	
}



ThirdParty.prototype.checkWorkingLinks = function(urls, callback, options) {
	urls = urls||[];
	urls = JSON.parse(JSON.stringify(urls))
	callback = callback||function(){};
	options = options||{};
	console.log("URLS are : ", urls);
	var urlStack = urls;
	var that = this;
	var request = request||require('request');
	this.__urlTestCache = this.__urlTestCache||{};
	
	var urlCheckRecursive = function(url) {
		if (typeof that.__urlTestCache[url] !== 'undefined') {
			if (that.__urlTestCache[url]) {
				callback.call(that, url); 
				
			} else {
				var newUrl = urlStack.pop();
				urlCheckRecursive(newUrl);				
				
			}
			return;
		}
		
		request.get(url, function(err, httpResponse, body) {
			console.log(arguments);
		}).on('data', function(data) {
			this.abort();
			console.log("Status Code : ", this.response.statusCode);
			
			if (this.response.statusCode == 200) {
				that.__urlTestCache[url] = true;
				callback.call(that, url, this.response);

			} else {
				that.__urlTestCache[url] = false;
				var newUrl = urlStack.pop();
				urlCheckRecursive(newUrl);				
			}
			//console.log("received data length", data.length);
		});		
	}
	
	var newUrl = urlStack.pop();
	urlCheckRecursive(newUrl);
}

ThirdParty.prototype.evalProblem = function() {

	if (this.popup.find(".segments").length > 0) {
		this.popup.find(".isProblem").removeClass("hidden");
		this.popup.find(".noProblem").addClass("hidden");
	} else {
		this.popup.find(".isProblem").addClass("hidden");
		this.popup.find(".noProblem").removeClass("hidden");
	}
}

ThirdParty.prototype.showPopup = function($content, options) {
	var options = options||{}
	var that = this;
	options.title = options.title||"第三方应用程序安装程序"
	options.width = options.width||Math.round($(window).width()/100*80)
	options.height = options.height||Math.round($(window).height()/100*80)
	options.classes =   {
		"ui-dialog": "topMost"
	  }
	/*
	var $popupContents = $("<h1>One or more required application(s) are not found</h1>\
	<p>But don't worry, Translator++ will guide you trhoughout the installation process.</p>\
	<div class='wrapper'></div>\
	");
	$popupContents.append($content);
	*/
	
	var $popupContents = [$("\
	<div class='thirdPartyUpdater'><span class='configDateWrapper'>此列表由以下日期的配置生成：<span class='configDate'></span></span><span class='menuBar'><a href='#' class='updateConfig icon-download-cloud'>更新配置文件</a></span></div>\
	<div class='headerBox'>\
		<div class='blockBox attentionBlock withIcon hidden isProblem'><h1>您可能需要安装以下应用程序！</h1>\
		<p>即使没有这些应用程序，Translator++也可以正常使用。但是，Translator++可以通过安装这些应用程序来帮助您避免大量手动工作。</p>\
		<p>这些应用程序由第三方开发，Translator++与之无关。所有许可证均由各自的所有者所有。</p>\
		</div>\
		<div class='blockBox infoBlock withIcon hidden noProblem'><h1>你可以离开了!</h1>\
		<p>您已经安装了Translator++可以使用的所有第三方应用程序。</p>\
		</div>\
	</div>\
	<div class='wrapper'></div>\
	"),
	$("<div class='wrapper'></div>").append($content)];
	var nDate = new Date(this.configDate);
	$popupContents[0].find(".configDate").html(nDate.toGMTString());
	$popupContents[0].find(".updateConfig").on("click", function() {
		var $that = $(this);
		$(this).removeClass("icon-download-cloud");
		$(this).addClass("icon-spin6");
		$(this).addClass("spin-icon");
		that.update(undefined, {
			onDone : function() {
				$that.addClass("icon-download-cloud");
				$that.removeClass("icon-spin6");
				$that.removeClass("spin-icon");
				var conf = confirm("配置已更新。\n重新启动应用程序？");
				if (conf) chrome.runtime.reload()
			}
		});
	})
	
	
	ui.showPopup("thirdParty", $popupContents, options);
	this.popup = $("[data-popupid=thirdParty]");
	this.popup.closest(".ui-dialog").css("z-index", "2000");
	this.evalProblem();
	
}

ThirdParty.prototype.getConfig = function() {
	return this.config;
}

ThirdParty.prototype.getLocation = function(conf) {
	if (Boolean(this.config[conf]) == false) return false;
	var thisConfig = this.config[conf]
	return nwPath.join(__dirname, thisConfig['location']||"");
		
}
ThirdParty.prototype.getBasePath = function() {
	return nwPath.join(__dirname, "3rdParty");
		
}
ThirdParty.prototype.isInstalled = function(conf) {
	// check if the module is ready and already installed
	if (Boolean(this.config[conf]) == false) return false;
	
	var thisConfig = this.config[conf]
	console.log("thisConfig : ", thisConfig);
	if (typeof thisConfig.expectedFiles == "string") thisConfig.expectedFiles = [thisConfig.expectedFiles]
	
	for (var i=0; i<thisConfig.expectedFiles.length; i++) {
		var path = __dirname+"/"+thisConfig['location']+"/"+thisConfig.expectedFiles[i];
		var expLocation = __dirname+"/"+thisConfig['location'];
		expLocation = expLocation.split("/").join("\\");
		try {
			console.log("checking : + ", path);
			if (fs.existsSync(path)) {
				//console.log('file exists');
			} else {
				return false;
			}
		} catch (e) {
			return false;
		}
		
	};
	return true;
	
}

ThirdParty.prototype.check = function(options) {
	// check if the requirement files and modules are presents
	options 		= options||{};
	options.options = options.force||false; // force popup
	options.popup 	= options.popup||false; // force popup
	options.filter 	= options.filter || undefined;
	if (Boolean(options.filter) == true) {
		if (Array.isArray(options.filter) == false) options.filter = [options.filter]
	}	
	console.log("running thirdParty.check");
	console.log("Current config:", this.config);
	var $content = $("<div class='initReqs_contents'></div>");
	var that = this;
	
	for (var conf in this.config) {
		if (Boolean(options.filter) == true) {
			if (options.filter.includes(conf) == false) continue;
		}
		var thisConfig = this.config[conf]
		console.log("thisConfig : ", thisConfig);
		if (typeof thisConfig.expectedFiles == "string") thisConfig.expectedFiles = [thisConfig.expectedFiles]
		
		for (var i=0; i<thisConfig.expectedFiles.length; i++) {
			
			var path = __dirname+"/"+thisConfig['location']+"/"+thisConfig.expectedFiles[i];
			var expLocation = __dirname+"/"+thisConfig['location'];
			expLocation = expLocation.split("/").join("\\");
			try {
				console.log("checking : + ", path);
				if (fs.existsSync(path)) {
					console.log('file exists');
				} else {
					console.log("file not found : ", path)
					var $segments = $("<div class='segments' data-confid='"+conf+"'>\
						<div class='initReqs_title'><span>"+thisConfig['name']+"</span></div>\
						<div class='initReqs_description'><span>"+thisConfig['description']+"</span></div>\
						<div class='initReqs_url'>\
							<span><a href='"+thisConfig['url']+"' class='icon-home' external>"+thisConfig['url']+"</a></span>\
							<span class='initReqs_sourceCode icon-file-code hidden'><a href='"+thisConfig['sourceCode']+"' external>获取源代码</a></span>\
						</div>\
						<div class='initReqs_info'><span>"+thisConfig['info']+"</span></div>\
						<div class='initReqs_expectedPath gridView'><span class='label'>期望位置</span><a href='#' class='icon-folder-1 browseFolder' title='浏览文件夹'>"+expLocation+"</a></div>\
						<div class='initReqs_fileSize gridView'><span class='label'>文件大小</span><a href='#' class='icon-box browseFolder' title='浏览文件夹'>"+thisConfig['fileSize']+"</a></div>\
						<div class='initReqs_action'>\
							<button class='downloadFile icon-cloud'>下载文件</button>\
							<button class='installFromFile icon-folder-open'>从我的电脑安装</button>\
							<button class='automaticInstall icon-download-cloud highlight'>自动下载并安装</button>\
						</div>\
						<div class='statusInfo hidden'>\
							<span class='progressBar'><span class='progressValue'></span></span>\
							<span class='info'></span>\
						</div>\
					</div>");
					$segments.data("id", conf);
					
					$content.append($segments);	
					if (thisConfig['sourceCode']) {
						$segments.find(".initReqs_sourceCode").removeClass("hidden")
					}
					$segments.find(".browseFolder").off("click")
					$segments.find(".browseFolder").on("click", function() {
						console.log("Opening : ", $(this).text());
						common.openExplorer($(this).text(), $(this).text());
					})
					$segments.find("a.externalLink, a[external]").off("click")
					$segments.find("a.externalLink, a[external]").on("click", function(e) {
						e.preventDefault();
						console.log("opening", $(this).attr("href"));
						nw.Shell.openExternal($(this).attr("href"));
					})
					$segments.find(".installFromFile").off("click")
					$segments.find(".installFromFile").on("click", function(e) {
						var $segments = $(this).closest(".segments");
						
						ui.openFileDialog({
							accept:".7z,.7zip,.zip,.exe",
							onSelect:function(path) {
								var fileExt = getFileExtension(path)
								var filename = getFileName(path);
								
								console.log("Install manualy from : ", path);
								if (that.acceptedArchive.includes(fileExt)) {
									console.log("selected ",path);
									// unpack
									_7z.unpack(path, __dirname+"\\3rdParty", err => {
										console.log("done unpacking to", path);
										// done
										$segments.remove();
										that.evalProblem();
										
									});	
								} else {
									fs.copyFile(path, __dirname+"\\3rdParty\\"+filename, (err) => {
									  if (err) throw err;
										console.log("copying file")
										$segments.remove();
										that.evalProblem();
									});

								}									
									
							}
						});
					});
					$segments.find(".downloadFile").on("click", function(e) {
						e.preventDefault();
						var thisId = $(this).closest(".segments").data("id");
						var thisConfig = thirdParty.getConfig()[thisId];
						var $segments = $(this).closest(".segments");
						var conf = confirm("Translator++可以打开浏览器并下载文件吗？");
						if (conf) {
							$segments.find(".statusInfo").removeClass("hidden");
							$segments.find(".statusInfo .progressBar").addClass("hidden");
							$segments.find(".statusInfo .info").text("检查可用镜像");
							
							that.checkWorkingLinks(thisConfig.repo, function(workingUrl) {
								$segments.find(".statusInfo").addClass("hidden");
								$segments.find(".statusInfo .progressBar").removeClass("hidden");
								$segments.find(".statusInfo .info").text("");
								
								nw.Shell.openExternal(workingUrl);
							})
							
						}
					});
					$segments.find(".automaticInstall").on("click", function(e) {
						
						var $this = $(this);
						var $segments = $this.closest(".segments");
						var thisId = $segments.data("id");
						var thisConfig = thirdParty.getConfig()[thisId];

						var conf = confirm("您即将下载并安装"+thisConfig.name+"！\n你是自愿做这件事的。\n你想继续吗？");
						if (!conf) return;
						
						var $statusInfo = $segments.find(".statusInfo");
						var $info = $statusInfo.find(".info");
						var $progress = $statusInfo.find(".progressValue");
						var request = require('request');
						var progress = require('request-progress');

						$segments.find(".statusInfo").removeClass("hidden");
						$segments.find(".statusInfo .info").text("检查可用镜像");

						that.checkWorkingLinks(thisConfig.repo, function(url) {
							$segments.find(".statusInfo .info").text("工作镜像："+url);
							
							url = url||thisConfig.repo[0];
							var filename = url.substring(url.lastIndexOf('/')+1);
							var tmp = nw.process.env.TMP+"\\"+filename;

							
							$statusInfo.removeClass("hidden");
							console.log("downloading ", url);
							progress(request(url, async function(error, response, body) {
								console.log("Request done", tmp);
								await common.wait(1000);
								
								var ext 		= getFileExtension(tmp)
								var targetDir 	= nwPath.join(__dirname, "3rdParty", thisConfig["extractDir"]||"");
								if (that.acceptedArchive.includes(ext)) {
									// unpack
									$info.html("拆包")
									
									await common.extract(tmp, targetDir);
									console.log("unpacking from", tmp);
									console.log("to", targetDir);
									$info.html("完毕!");
									$statusInfo.addClass("hidden");
									
									if (typeof thisConfig.licenseFile !== 'undefined') {
										var conf = confirm("安装完成！\n你想读许可证吗？");
										if (conf) nw.Shell.openItem(__dirname+"/"+thisConfig['location']+"/"+thisConfig.licenseFile);
										
									}
									$segments.remove();
									that.evalProblem();									

								} else {
									// destination.txt will be created or overwritten by default.
									$info.html("正在复制文件。")
									
									fs.copyFile(tmp, __dirname+"\\3rdParty\\"+filename, (err) => {
									  if (err) throw err;
										$info.html("完毕!");
										$statusInfo.addClass("hidden");
										$segments.remove();
										that.evalProblem();
									});
								}								
							}), {
								throttle:200
							})
							.on('progress', function (state) {
								//console.log(state);

								
								var percent = Math.round(state.percent*100);
								var speed = Intl.NumberFormat().format(Math.round(state.speed/1024));
								var total = Intl.NumberFormat().format(Math.round(state.size.total/1024));
								var transfered = Intl.NumberFormat().format(Math.round(state.size.transferred/1024));
								var timeRemaining = Math.round(state.time.remaining);
								$progress.css("width", percent+"%")
								$progress.html(percent+"%")
								
								$info.html("<span class='progress'>"+transfered+"kb/"+total+"kb</span> <span class='speed'>("+speed+" kb/s)</span> <span class='time'>"+timeRemaining+"秒剩余</span>")
								//$statusInfo.html(JSON.stringify(state))
							})
							.on('end', function () {
								// Do something after request finishes
								$progress.css("width", "100%")

								$progress.html("100%")
								$info.html("下载完成！")
							})
							.pipe(fs.createWriteStream(tmp))
						}) // checkWorkingLinks
					});
					
					break;					
				}
			} catch(err) {
				console.warn(err)
			}
		}
	}
	
	//console.log($content.find(".segments"));
	if (options.popup) {
		if (options.force) {
			this.showPopup($content,options);
		} else {
			if ($content.find(".segments").length > 0) this.showPopup($content,options);
		}
	}
	return $content;
	//this.showPopup($content);	

}



var thirdParty = new ThirdParty();

$(document).ready(function() {
	sys.onReady(function() {
		ui.onReady(function() {
			thirdParty.check({popup:true});
		})
	})
})