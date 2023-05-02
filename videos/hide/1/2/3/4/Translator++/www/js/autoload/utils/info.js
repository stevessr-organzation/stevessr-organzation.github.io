var fs = fs||require('fs');
var Info = function() {
	this.lastHistory = [];
	this.previewVersion = false;
	
	this.init();
}

Info.prototype.init = function() {
	nw.appSuffix = "";
	var suffixes = [];
	this.debugVersion = false;
	new Promise((resolve, reject) => {
		fs.stat(__dirname+"/nwjc.exe", (err, stats) => {
			if (err) return;
			suffixes.push("DEV");
			resolve();
		});
	}).then(() => {
		fs.stat(__dirname+"/README.md", (err, stats) => {
			if (err) return;
			suffixes.push("preview");
			nw.appSuffix = suffixes.join("-");
			ui.setWindowTitle();
			//console.log(stats, stats.isFile());
			$(window).trigger("previewVersion");
			this.debugVersion = true;
		})	
	});
}

Info.prototype.isUpToDate = function() {
	//if (this.nextVersions.length < 1) return true;
	sys.config.info = sys.config.info||{};
	if (typeof sys.config.info.numberOfNewVer == 'undefined') return false;
	if (sys.config.info.numberOfNewVer === 0) return true;
	return false;
}

Info.prototype.getLastCheckedUpdate = function() {
	var time = localStorage.getItem('updateLastCheck');
	return parseInt(time);
}

Info.prototype.getNextVersions = function(mode, upToDateMsg) {
	mode = mode||"";
	upToDateMsg = upToDateMsg||"";
	this.nextVersions = [];
	
	// first compare whether the current version is actually greater than public version
	console.log("compare version : ", thisVerFloat, common.versionToFloat(this.lastHistory[0].version));
	var thisVerFloat = common.versionToFloat(nw.App.manifest.version);
	if (thisVerFloat > common.versionToFloat(this.lastHistory[0].version)) {
		this.previewVersion = true;
	} else {
		for (var i=0; i<this.lastHistory.length; i++) {
			if (thisVerFloat >= common.versionToFloat(this.lastHistory[i].version)) break;
			this.nextVersions.push(this.lastHistory[i]);
		}
	}
	
	if (mode!=='html') return this.nextVersions;
	
	// HTML mode
	if (this.nextVersions.length < 1) return upToDateMsg;
	
	var $obj = $("<div><h2 class='missedHeader'><i class='icon-attention red'></i>你有"+this.nextVersions.length+"错过更新！</h2>\
			<div class='blockBox infoBlock withIcon' >\
				如果启用自动更新，Translator++将自动更新<br />您可以在以下网址下载Translator++的最新核心版本：<a href='http://dreamsavior.net/' external>dreamsavior.net</a>.\
			</div>\
			<ul class='nextVersions'></ul>\
			</div>");
			
	for (var i=0; i<this.nextVersions.length; i++) {
		var $line = "<li class='releases'>";
		$line+="<h2 class='releaseHeader flex'><div class='releaseVer'>Ver. "+this.nextVersions[i].version+"</div><div class='releaseCategory'></div></h2>";
		$line+="<div class='versionInfo'></div>";
		$line+="<ul class='changelog'>";
		if (Array.isArray(this.nextVersions[i].changeLog)) {
			for (var x=0; x<this.nextVersions[i].changeLog.length; x++) {
				var thisUpdate = this.nextVersions[i].changeLog[x];
				var updatePart = this.nextVersions[i].changeLog[x].split(":");
				var updateMsg = thisUpdate;
				var updateType = "info";
				if (updatePart.length > 1)  {
					updateType = updatePart.shift().toLowerCase();
					updateMsg = updatePart.join(":");
				}
				$line+="<li><span class='updateType updateType-"+updateType+"'>"+updateType+"</span><span class='updateTypeBody'>"+updateMsg+"</span></li>";
			}
		}
		$line+="</ul>";
		$line+="</li>";
		$line = $($line);
		$line.find('.releaseCategory').html(this.nextVersions[i].category);
		$line.find('.releaseCategory').addClass("releasesCategory-"+this.nextVersions[i].category);
		if (parseInt(this.nextVersions[i].level) == 1) {
			$line.find('.versionInfo').html("此更新适用于所有用户。");
		} else if (parseInt(this.nextVersions[i].level) > 1) {
			$line.find('.versionInfo').html("此更新适用于 $"+this.nextVersions[i].level+"级或更高级别的用户。");
		}
		$line.addClass("releases-"+this.nextVersions[i].category);
		$obj.find(".nextVersions").append($line);
	}
	return $obj;
}


Info.prototype.updateNotification = async function(options) {
	options = options || {};
	options.force = options.force || false;
	console.log("updateNotification handler");
	if (nw.App.manifest.localConfig.checkVersion !== "always") {
		if (options.force == false) {
			// skip check in interval 1 day
			if (this.getLastCheckedUpdate()+86400 > Date.now()) return;
		}
	}
	
	console.log("process updateNotification");
	var that = this;
	fs = fs||require('fs');
	sys.config.info = sys.config.info||{};
	sys.config.info.numberOfNewVer = sys.config.info.numberOfNewVer||0;
	
	return new Promise((resolve, reject) => {
		var jqxhr = $.ajax({
			method: "POST",
			url: nw.App.manifest.localConfig.versionHistory,
			data: {}
		})
		.done(function(data) {
			console.log("version history data : ", data);
			that.lastHistory = data;
			fs.writeFile("./data/verHistory.json", JSON.stringify(data, undefined, 2), function(err) {
				if(err) {
					return console.warn(err);
				}
				console.log("The file was saved!");
			});
			
			var $nextVersion = that.getNextVersions("html");
			if ($nextVersion) {
				var optionForce = false;
				if (that.nextVersions.length > sys.config.info.numberOfNewVer) optionForce = true
				var options = {
					force : optionForce,
					title : "更新信息",
					buttons : 	[
									{
										text: "立刻更新",
										click: function() {
											console.log("updating");
											updater.update({
												onFail:function(code, reason) {
													alert(t("无法更新，原因：\n")+reason+"\n"+t("您可能需要重新连接Translator++和您的Patreon帐户（注销并再次登录）。"));
												}
											});
											alert(t("更新过程现在正在后台运行。"));
											$(this).dialog( "close" );
										}
									},
									{
										text: "关闭",
										icon: "ui-icon-close",
										click: function() {
											$(this).dialog( "close" );
										}
									}
								]
				}
				ui.showPopup("updateInfo", $nextVersion, options);
			}
			localStorage.setItem('updateLastCheck', Date.now());
			sys.config.info.numberOfNewVer = that.nextVersions.length;
			sys.saveConfig();
			
		})
		.fail(function(data) {

		})
		.always(function(data) {
			resolve();
		});
	});
	
}


var info = new Info();

$(document).ready(function() {
	sys.onReady(function() {
		if (typeof ui == 'undefined') return;
		ui.onReady(function() {
			info.updateNotification();
		});
	});
});