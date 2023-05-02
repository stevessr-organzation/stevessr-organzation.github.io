var options = {};
var win = nw.Window.get();
win.restore(); // restore if minimized
win.show(); // show if hidden

win.setResizable(true);

var $DV 	= window.opener.$DV;
var trans 	= window.opener.trans;
var sys 	= window.opener.sys;
var addonLoader = window.opener.addonLoader;
var AddonInstaller = window.opener.AddonInstaller;
var fs 		= require('fs');
var lt 		= lt || window.opener.lt;
var info 	= window.opener.info;
var updater	= window.opener.updater;
var Updater	= window.opener.Updater;

window.opener.$(window.opener.document).trigger("optionsWindowOpened");


trans.project = trans.project||{};
trans.project.options = trans.project.options||{};

options.__onBeforeClose = [];
options.onBeforeCloseRunOnce = function(fn) {
	if (typeof fn !== 'function') return console.info("参数不是函数", fn)
	options.__onBeforeClose.push(fn);
}

options.needRestart = false;
options.requestRestart = function() {
	this.needRestart = true;	
}

options.isNeedRestart = function() {
	if (options.needRestart) {
		alert(t("某些配置需要重新启动应用程序才能生效。\n请保存您的工作，然后重新启动Translator++。"));
	}
}

options.drawTranslatorSelector = function($obj, defaultVal) {
	defaultVal = defaultVal || "google";
	$obj.data("previousValue", defaultVal);

	for (var i=0; i<trans.translator.length; i++) {
		$obj.append("<option value='"+trans.translator[i]+"'>"+trans[trans.translator[i]].name+"</option>");
	}
	$obj.val(defaultVal);
	
	if ($obj.hasClass("eventApplied") == false) {
		$obj.on("change.updater", function(e) {
			trans.project.options = trans.project.options||{};
			trans.project.options.translator = $(this).val();
			//options.drawLanguageSelector($("#sl"),'sl', trans.project.options.sl);
			//options.drawLanguageSelector($("#tl"),'tl', trans.project.options.tl);
			options.drawLanguageSelector($("#sl"),'sl', sys.config.default.sl);
			options.drawLanguageSelector($("#tl"),'tl', sys.config.default.tl);
			
			// registering into sys
			try {
				
				sys.config.translator = $(this).val();
				sys.saveConfig();
			} catch (e) {
				console.info("写入 sys.config 时出错", e);
			}
		})
		$obj.addClass("eventApplied")
	}
	
	// initializing;
	$obj.trigger("change");

	$obj.on("change", function() {
		var $this = $(this);
		// store old value
		var oldValue = $(this).data("previousValue");
		// set old value to new value;
		$(this).data("previousValue", $this.val());

		// trigger event
		window.opener.$(window.opener.document).trigger("translatorIsChanged", [$this.val(), oldValue]);
	})

	return $obj;
}

options.drawLanguageSelector = function($obj, id, defaultVal, options) {
	try {
		var thisTranslator = sys.config.translator||trans.project.options.translator;
		var languages = trans[thisTranslator].languages||consts.defaultLanguages||{};
	} catch (e) {
		var languages = consts.defaultLanguages||{};
	}
	
	$obj.empty();
	options = options||{};
	options.disableChoice = options.disableChoice||[];
	if (typeof(defaultVal) == 'undefined') {
		defaultVal = 'en';
		if (id == 'sl') defaultVal = 'ja'; 
	}
	
	for (var langCode in languages) {
		var $opt = $("<option value='"+langCode+"'>"+languages[langCode]+"</option>");
		if (options.disableChoice.includes(langCode)) $opt.prop("disabled", true);
		
		$obj.append($opt);
	}
	$obj.val(defaultVal);

	if ($obj.hasClass("eventApplied") == false) {
		$obj.on("change.updater", function(e) {
			/*
			trans.project.options = trans.project.options||{};
			trans.project.options[id] = $(this).val();
			$DV.config[id] = $(this).val();
			*/
			sys.config.default[id] = $(this).val();
			$DV.config[id] = $(this).val();			
		})
		$obj.addClass("eventApplied")
	}

	
	return $obj;
}

options.applyAll =function($obj) {
	$obj = $obj||$("body");
	
	$obj.find("input").trigger("change");
	$obj.find("select").trigger("change");
	$obj.find("textarea").trigger("change");
}




// ===================================================
// Handling tab
// ===================================================
options.tab = {};
options.tab.select = function($obj) {
	$obj.closest(".tabMenu").find("li.selectable").removeClass("selected");
	$obj.addClass("selected");
	let $panelContents = $(".panel-right .panelContent");
	$panelContents.removeClass("activeTab");
	$panelContents.addClass("hidden");
	
	let thisRef = $obj.data("for");
	let $targetObj = $("#"+thisRef);
	if ($targetObj.length > 0) {
		$targetObj.removeClass("hidden");
		$targetObj.addClass("activeTab");
	}
	if (typeof $obj.data("onOptionSelected") == "function") {
		$obj.data("onOptionSelected")($targetObj, $obj);
	}
}

options.tab.insertBefore = function(id, title, $insertBefore, options) {
	options = options||{};
	options.icon = options.icon||"circle";
	options.tabClass = options.tabClass||"";
	var $tab = $('<li data-for="'+id+'" class="selectable '+options.tabClass+'"><a><i class="icon-'+options.icon+'"></i><span>'+title+'</span></a></li>');
	$tab.insertBefore($insertBefore);
	if (typeof options.onSelect == "function") $tab.data("onOptionSelected", options.onSelect);
	
	var $tabContent = $('<div class="panelContent '+id+'" id="'+id+'"></div>');
	$(".panel-right").append($tabContent);
	
	return {tab:$tab, content:$tabContent};
}

options.tab.insertAfter = function(id, title, $insertAfter, options) {
	options = options||{};
	options.icon = options.icon||"circle";
	options.tabClass = options.tabClass||"";
	options.tabContent = options.tabContent||"";

	var $tab = $('<li data-for="'+id+'" class="selectable '+options.tabClass+'"><a><i class="icon-'+options.icon+'"></i><span>'+title+'</span></a></li>');
	$tab.insertAfter($insertAfter);
	if (typeof options.onSelect == "function") $tab.data("onOptionSelected", options.onSelect);

	var $tabContent = $('<div class="panelContent '+id+'" id="'+id+'"></div>');
	$tabContent.append(options.tabContent);
	$(".panel-right").append($tabContent);
	return {tab:$tab, content:$tabContent};
}

options.tab.init = function() {
	var $selectableMenu = $(".tabMenu li.selectable");
	$selectableMenu.each(function() {
		var $thisLi = $(this);
		$thisLi.off("click.selectTab");
		$thisLi.on("click.selectTab", function(e){
			options.tab.select($(this));
		})
	});
}

// ===================================================
// Handling translator options
// ===================================================
options.translatorMenu = {};

options.translatorMenu.assignDefault = function(thisTranslator) {
	if (typeof thisTranslator.optionsForm == 'undefined') return thisTranslator;
	if (typeof thisTranslator.optionsForm.schema == 'undefined') return thisTranslator;
	
	for (var key in thisTranslator.optionsForm.schema) {
		if (typeof thisTranslator[key] == 'undefined') continue;
		thisTranslator.optionsForm.schema[key]['default'] = thisTranslator[key];
	}
	console.log("after assigning default :");
	console.log(thisTranslator);
	return thisTranslator;
	
}
	
options.translatorMenu.linkify = function(text) {
    var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, function(url) {
        return '<a href="' + url + '", target="_system">' + url + '</a>';
    });
}
	
options.translatorMenu.init = function() {
	if (Array.isArray(trans.translator) == false) return false;
	console.log("Initializing translators");
	
	for (var i=0; i<trans.translator.length; i++) {
		var thisTranslator = trans[trans.translator[i]];
		thisTranslator.description = thisTranslator.description||"";
		thisTranslator.author = thisTranslator.author||"Anonymous";
		thisTranslator.version = thisTranslator.version||"1.0";
		var thisOption = {
			icon:'cog-alt',
			tabClass:'submenu translatorSetting hidden',
			tabContent:$("<h1 class='pluginTitle'>"+thisTranslator.name+"</h1>\
						<div class='authorBlock'>"+t("Version.")+" <span class='author'>"+thisTranslator.version+"</span></div>\
						<div class='versionBlock'>"+t("By.")+" <span class='engineVersion'>"+thisTranslator.author+"</span></div>\
						<p class='description'>"+thisTranslator.description+"</p>\
						<div class='pluginOptions'></div>")
		}
		if (typeof thisTranslator.onOptionSelected == "function") thisOption.onSelect = thisTranslator.onOptionSelected
		options.tab.insertAfter(thisTranslator.id, thisTranslator.name, $(".langSetting"), thisOption);

		if (typeof thisTranslator.optionsForm == 'undefined') {
			$("#"+CSS.escape(thisTranslator.id)+" .pluginOptions").html(t("此引擎没有选项"));
			continue;
		}
		
		console.log($("#"+thisTranslator.id+" .pluginOptions"));
		if ($("#"+CSS.escape(thisTranslator.id)+" .pluginOptions").length > 0) {
			console.log("option form : ");
			console.log(thisTranslator.optionsForm);
			options.translatorMenu.assignDefault(thisTranslator);
			var jsonForm = $("#"+thisTranslator.id+" .pluginOptions").jsonForm(thisTranslator.optionsForm);
		
			var $thisOptionSet = $("#"+thisTranslator.id+" .pluginOptions");
			
			$thisOptionSet.find(".help-block").each(function() {
				$(this).html(options.translatorMenu.linkify($(this).html()));
				$(this).find("a[target=_system]").on("click", function(e) {
					e.preventDefault();
					nw.Shell.openExternal($(this).attr("href"));
				})
			});
		}
		console.log("JSON form:");
		console.log(jsonForm);
		
	}
}


// ===================================================
// Handling addons options
// ===================================================
var AddonsOption = function(addons) {
	this.addons = addons || addonLoader.addons;
}
// Draw the list of addons

AddonsOption.prototype.drawList = function() {
	var $container = $("#addons .installedAddons .addonListWrapper");
	var that = this;
	for (var id in this.addons) {
		var thisAddon = this.addons[id];
		var label = thisAddon.package.title || thisAddon.package.name;
		var $template = $(`<div class="addonsOption addonList listMember">
			<div class="addonsIconBlock"></div>
			<div class="addonsInfoBlock">
				<div class='titleBlock'><span class="name">`+label+`</span><span class="ver">`+thisAddon.package.version+`</span></div>
				<div class='descBlock'>`+thisAddon.package.description+`</div>
			</div>
			<div class="addonsAction"></div>
		</div>`)	
		$template.data('id', id)
		if (thisAddon.package.icon) {
			$template.find(".addonsIconBlock").append('<img class="addonsIcon" src="'+thisAddon.getWebLocation()+'/'+thisAddon.package.icon+'" alt="icon" />');
		} else {
			$template.find(".addonsIconBlock").append('<img class="addonsIcon" src="img/icon.png" alt="icon" />');
		}

		if (thisAddon.config.isMandatory) {
			var $lock = $("<i class='icon-lock' title='"+t("无法禁用此加载项")+"'></i>")
			$template.find(".addonsAction").append($lock);
		} else {
		
			var $flipSwitch = $("<i class='iconToggle icon-toggle-on'></i>")
			if (thisAddon.config.isDisabled) {
				$flipSwitch.removeClass('icon-toggle-on');
				$flipSwitch.addClass('icon-toggle-off');
			}
			
			$template.find(".addonsAction").append($flipSwitch);
			
			$flipSwitch.on("click", function(e) {
				var addonId = $(this).closest(".addonList").data("id");
				if ($(this).hasClass('icon-toggle-on')) {
					$(this).removeClass('icon-toggle-on');
					$(this).addClass('icon-toggle-off');
					that.addons[addonId].setConfig("isDisabled", true)
				} else {
					$(this).removeClass('icon-toggle-off');
					$(this).addClass('icon-toggle-on');
					that.addons[addonId].setConfig("isDisabled", false)
					
				}
				options.needRestart = true;
			})
		}
		
		$container.append($template);
	}
	
	
}


AddonsOption.prototype.drawOnlineList = async function(onlineList) {
	var $container = $("#addons [data-id=online] .addonListWrapper");
	$container.empty();
	options.busy();
	var fetchError = false;
	try{
		onlineList = onlineList || this.onlineList || await common.fetch('http://dreamsavior.net/rest/addons/list/');
	} catch (e) {
		alert("无法获取联机列表");
		onlineList = onlineList || {};
		fetchError = true;
	}
	if (!fetchError) this.onlineList = onlineList;
	console.log("online list is :", onlineList);
	var that = this;
	onlineList.list = onlineList.list || [];
	for (var id in onlineList.list) {
		var thisAddon = onlineList.list[id];
		var cost = thisAddon.patron_level || 0;
		if (thisAddon.purchase_type == "points") {
			cost = thisAddon.patron_points;
		}
		var iconPath = "<img src='/www/img/icon.png' class='addonsIcon' alt='' />";

		if (thisAddon.icon) {
			iconPath = "<img src='"+thisAddon.icon+"' class='addonsIcon' alt='' />";
		}
		
		var $template = $(`<div class="addonsOption addonList listMember">
			<div class="addonsIconBlock">${iconPath}</div>
			<div class="addonsInfoBlock">
				<div class='titleBlock'>
					<span class="name">${thisAddon.title}</span>
					<span class="ver">${thisAddon.version}</span>
				</div>
				<div class='descBlock'>${thisAddon.description}</div>
				<div class="addonReq"><span>`+t('要求')+`: <span>  <span class="reqCost">`+cost+`</span> <span class="reqType" data-reqtype="${thisAddon.purchase_type}">${thisAddon.purchase_type}</span></div>					

			</div>
			<div class="addonsAction">
				<div class="addonsActionBtn"></div>
			</div>
		</div>`);
		
		var isUnsupported = false;
		if (thisAddon.min_ver) {
			var $minver = $(`<div class="minVer">最低版本：<span class="version">${thisAddon.min_ver}</span></div>`)
			$template.find(".addonReq").append($minver);

			if (common.versionToFloat(nw.App.manifest.version) < common.versionToFloat(thisAddon.min_ver)) isUnsupported = true;
		}
		
		$template.attr('data-id', thisAddon.id)
		$template.data('id', thisAddon.id)
		$template.attr('data-name', thisAddon.name)
		$template.data('name', thisAddon.name)
		var $installButton;
		
		//if (Boolean(addonLoader.getByName(thisAddon.name))) {
		if (AddonInstaller.isInstalled(thisAddon.id)) {
			$installButton = [$("<button class='addon-uninstall'><i class='icon-cancel-circled'></i>卸载</button>")]
		
			$installButton[0].on("click", async function() {
				var thisName = $(this).closest('.addonsOption').data("name");
				var conf = confirm(t("卸载")+` ${thisName}?`);
				if (!conf) return;
				
				options.busy();
				var thisId = $(this).closest('.addonsOption').data("id");
				//await addonLoader.uninstall(AddonInstaller.getRootAddonDir(thisId));
				await addonLoader.uninstall(addonLoader.getByName(thisName));
				AddonInstaller.configUninstall(thisId);
				await that.drawOnlineList();
			});


			try {
				var installedVersion = addonLoader.getByName(thisAddon.name).package.version;
				if (common.versionToFloat(thisAddon.version) > common.versionToFloat(installedVersion)) {
					$installButton.push($("<button class='addon-update'><i class='icon-arrows-cw'></i>g更新</button>"))
		
					$installButton[1].on("click", async function() {
						var thisName = $(this).closest('.addonsOption').data("name");
						var conf = confirm(t("更新")+` ${thisName}?`);
						if (!conf) return;
						
						options.busy();
						// uninstall
						var thisId = $(this).closest('.addonsOption').data("id");
						//await addonLoader.uninstall(AddonInstaller.getRootAddonDir(thisId));
						await addonLoader.uninstall(addonLoader.getByName(thisName));
						AddonInstaller.configUninstall(thisId);

						// install
						var thisId = $(this).closest('.addonsOption').data("id");
						var addonInstaller = new AddonInstaller(parseInt(thisId));
						var installOption = {
							onError: async function(message, result) {
								window.opener.ui.alert(message, "options");
							},
							onSuccess: function() {
								window.opener.ui.alert(t("加载项已成功安装。\r\n Translator++可能需要重新启动才能使某些加载项生效。"), "options");
								console.log("reloading addon");
								addonLoader.loadAll();
							}
						}
						await addonInstaller.install(undefined, installOption);
						await that.drawOnlineList();
					});					
				}
			} catch(e) {
				console.warn("无法获取的软件包版本"+thisAddon.name, e)
			}
		} else if (isUnsupported) {
			$installButton = $("<button class='addon-unsupported' disabled><i class='icon-cancel-circled'></i>不支持</button>")
		} else {
			$installButton = $("<button class='addon-install'><i class='icon-download-cloud-1'></i>安装</button>")
		
			console.log("drawing install button", thisAddon);
			if (thisAddon.purchase_type == "points") {
				updater.user.points = updater.user.points || 0;
				thisAddon.patron_points = thisAddon.patron_points || 0;
				console.log(`User points: ${updater.user.points} addonPoints = ${thisAddon.patron_points}`);
				if (updater.user.points < thisAddon.patron_points) {
					console.log("User points less then required");
					$installButton.prop("disabled", true);
				}
			}

			$installButton.on("click", async function() {
				options.busy();
				var thisId = $(this).closest('.addonsOption').data("id");
				var addonInstaller = new AddonInstaller(parseInt(thisId));
				var installOption = {
					onError: async function(message, result) {
						window.opener.ui.alert(message, "options");
					},
					onSuccess: function() {
						window.opener.ui.alert(t("加载项已成功安装。\r\n Translator++可能需要重新启动才能使某些加载项生效。"), "options");
						console.log("reloading addon");
						addonLoader.loadAll();
					}
				}
				await addonInstaller.install(undefined, installOption);
				await that.drawOnlineList();
			});
		}
		
		$template.find(".addonsActionBtn").append($installButton);	


		$container.append($template);
		
	}
	options.busyNot();
}

// Drawing the form
AddonsOption.prototype.findForm = function(optionsForm, key) {
	optionsForm.form = optionsForm.form || [];
	for (var i=0; i<optionsForm.form.length; i++) {
		optionsForm.form[i].key = optionsForm.form[i].key|| ""
		if (optionsForm.form[i].key == key) return i;
	}
}
AddonsOption.prototype.camelCaseToWords = function(text) {
	var result = text.replace( /([A-Z])/g, " $1" );
	var finalResult = result.charAt(0).toUpperCase() + result.slice(1);
	return 	finalResult;
}

AddonsOption.prototype.generateFromMini = function(optionsForm) {
	// generates minified json form to full json form
	console.info("从mini生成", optionsForm);
	if (typeof optionsForm.schema !== 'undefined') return optionsForm
	console.log("pass here");
	var form = [];
	for (var key in optionsForm) {
		var thisData = {};
		thisData.key = key;
		
		// enum
		if (Array.isArray(optionsForm[key].enum)) {
			thisData.titleMap = {};
			for (var i=0; i<optionsForm[key].enum.length; i++) {
				thisData.titleMap[optionsForm[key].enum[i]] = this.camelCaseToWords(optionsForm[key].enum[i])
			}
		}
		// array
		if (optionsForm[key].type == "array") {
			thisData.type = "checkboxes";
			if (optionsForm[key].enum && Boolean(optionsForm[key].items)==false) {
				optionsForm[key].items = {
					enum : optionsForm[key].enum
				};
				
			}
		}
		// radio
		if (optionsForm[key].type == "radio" || optionsForm[key].type == "radios") {
			optionsForm[key].type = "string"
			thisData.type = "radios";
		}
		
		// checkbox
		if (optionsForm[key].inlinetitle) thisData.inlinetitle = optionsForm[key].inlinetitle
		
		form.push(thisData);
	}	
	var result = {
		schema:optionsForm,
		form:form
	}
	
	console.info("结果：", result);
	return result;
}

AddonsOption.prototype.assignDefault = function(optionsForm, thisAddon) {
	if (typeof optionsForm == 'undefined') return optionsForm;
	if (typeof optionsForm.schema == 'undefined') return optionsForm;
	console.log("before assigning default :", optionsForm);
	for (var key in optionsForm.schema) {
		var formKey = this.findForm(optionsForm, key);
		var thisForm = optionsForm.form[formKey]
		var onChangeAdd = [];
		var onClickAdd = [];
		
		if (typeof optionsForm.schema[key] == 'undefined') continue;
		//addon.optionsForm.schema[key]['default'] = addon[key];
		
		if (typeof optionsForm.schema[key]['default'] == "function") {
			optionsForm.schema[key]['default'] = optionsForm.schema[key]['default'].call(thisAddon);
		}


		if (typeof thisForm.onInput == 'function') {
			onChangeAdd.push('thisForm.onInput.call(thisAddon, $(evt.target))')	
		}
		
		
		if (typeof optionsForm.schema[key]['onChange'] == "function") {
			console.warn("基于变化的渲染");
			onChangeAdd.push("("+optionsForm.schema[key]['onChange'].toString()+").apply($(evt.target), arguments)");
		}
		
		if (typeof optionsForm.schema[key]['HOOK'] == "undefined") {
			optionsForm.schema[key]['HOOK'] = "thisAddon.config['"+key+"']";
		}

		if (typeof optionsForm.schema[key]['HOOK'] == "function") {
			optionsForm.schema[key]['default'] = optionsForm.schema[key]['HOOK'].call(thisAddon);
		} else if (typeof optionsForm.schema[key]['HOOK'] == "string") {
			optionsForm.schema[key]['default'] = eval(optionsForm.schema[key]['HOOK']);
			
			console.log("assigning hook for", key);
			if (optionsForm.schema[key].type == 'boolean') {
				onChangeAdd.push('console.log("onChange boolean type")');
				
				onChangeAdd.push('var value = $(evt.target).prop("checked");')	
				onChangeAdd.push(optionsForm.schema[key]['HOOK']+` = value;`)	

			} else if (thisForm.type == 'radios') {
				onChangeAdd.push('console.log("onChange radios type")');
				onChangeAdd.push('var value = $(evt.target).closest(".controls").find("input[type=radio]:checked").val();')	
				onChangeAdd.push(optionsForm.schema[key]['HOOK']+` = value;`)	
				
			} else if (optionsForm.schema[key].type == 'array') {
				onChangeAdd.push('console.log("onChange array type")');
				onChangeAdd.push('var value = $(evt.target).val();')	
				onChangeAdd.push(optionsForm.schema[key]['HOOK']+` = value;`)	
				
			} else {
				onChangeAdd.push('console.log("onChange string type")');
				
				onChangeAdd.push(optionsForm.schema[key]['HOOK']+` = $(evt.target).val();`)	
			}
		} 
	
	
		if (onChangeAdd.length > 0) {
			thisForm.onChange = eval (` (evt) => {
				var field = $(evt.target);
				`+onChangeAdd.join("\n")+`}`);	
			//console.log("generated onChange :", key, thisForm.onChange);
		}
		if (onClickAdd.length > 0) {
			thisForm.onChange = eval (` (evt) => {
				var field = $(evt.target);
				`+onClickAdd.join("\n")+`}`);	
			//console.log("generated onChange :", key, thisForm.onChange);
		}
		
	}
	console.info("指定默认值后：", optionsForm);
	return optionsForm;
	
}
	
AddonsOption.prototype.linkify = function(text) {
    var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, function(url) {
        return '<a href="' + url + '", target="_system">' + url + '</a>';
    });
}
	
AddonsOption.prototype.init = function() {
	if (Array.isArray(trans.translator) == false) return false;
	
	addonLoader = addonLoader || {};
	addonLoader.addons = addonLoader.addons || {};
	var that = this;
	for (var addonId in addonLoader.addons) {
		var addon = addonLoader.addons[addonId];
		addon.package 			= addon.package || {};
		addon.package.name 		= addon.package.name||"";
		addon.package.title 	= addon.package.title||addon.package.name||"";
		addon.package.description = addon.package.description||"";
		addon.package.author 	= addon.package.author||{name:"Anonymous", email:""}
		addon.package.version 	= addon.package.version||"1.0";
		addon.optionsForm = addon.optionsForm||{}
		addon.config = addon.config || {}
		
		if (addon.config.isDisabled) continue;

		console.log("drawing option menu : ", addon);
		options.tab.insertAfter(addonId, addon.package.title, $(".addonSetting"), {
			icon:'box',
			tabClass:'submenu addonOptionMember hidden',
			tabContent:$("<h1 class='pluginTitle'>"+addon.package.title+"</h1>\
						<div class='authorBlock'>"+t("Version.")+" <span class='engineVersion'>"+addon.package.version+"</span></div>\
						<div class='versionBlock'>"+t("By.")+" <span class='author'>"+addon.package.author.name+"</span></div>\
						<p class='description'>"+addon.package.description+"</p>\
						<div class='pluginOptions'></div>")
		});
		
		$pluginOptions = $("#"+CSS.escape(addonId)+" .pluginOptions");
		
		console.log("addon", addonId, addon.optionsForm, !Object.keys(addon.optionsForm).length);
		if (!Object.keys(addon.optionsForm).length == false) {
			console.log($pluginOptions);
			if ($pluginOptions.length > 0) {
				addon.optionsForm = this.generateFromMini(addon.optionsForm);
				this.assignDefault(addon.optionsForm, addon);
				console.info(addon.optionsForm);
				var jsonForm = $pluginOptions.jsonForm(addon.optionsForm);
				
				// open url to external browser
				$pluginOptions.find(".help-block").each(function() {
					$(this).html(that.linkify($(this).html()));
					$(this).find("a[target=_system]").on("click", function(e) {
						e.preventDefault();
						nw.Shell.openExternal($(this).attr("href"));
					})
				});

				$pluginOptions.find("input[type=range]").each(function() {
					var $this 		= $(this);
					var $thisParent = $this.parent();
					var $wrapper 	= $(`<div class='fullWidth flex rangeWrapper'><output></output></div>`);
					$wrapper.find("output").text($this.val());
					$wrapper.prepend($this);
					$thisParent.prepend($wrapper);
					$this.on("input", function() {
						console.log("on input listener");
						$(this).next().html($(this).val());
					})
				});
			}

		}
		
		if (Boolean(addon.optionsFormHtml)) {
			$pluginOptions.append(addon.optionsFormHtml);
		}

		if ($pluginOptions.children().length == 0) $pluginOptions.html(t("此附加组件没有选项"));
	
		
	}
	
	this.drawList();
}


options.addonsOption = new AddonsOption();







// ===================================================
// Handling ABOUT
// ===================================================
options.about = {};
options.about.init = function() {
	let config = sys.app||nw.App.manifest
	version = config.version	
	$("#about .version").text(version);
	
	$("#about .viewChangelog").on("click", async ()=> {
		let changelog = fs.readFileSync('changelog.txt', 'utf8');
		$("#about .changelog").text(changelog);
	});
	
	$("#about .nwVersion").text(process.versions.nw);
	$("#about .nodeVersion").text(process.versions.node);
	$("#about .phpVersion").text(sys.phpVersion);
	$("#about .archVersion").text(process.arch);
	
	var rbVersion = "";
	if (typeof window.spawn  == "undefined") {
		window.spawn = require('child_process').spawn;
	}
	
	var child = spawn(nw.App.manifest.localConfig.ruby, ['www\\rb\\getVersion.rb']);
	//var child = spawn("ruby\\bin\\ruby.exe", ['www\\rb\\getVersion.rb']);
	var outputBuffer = "";
	child.stdout.on('data', function (data) {
		console.log("data : ", data);
		outputBuffer += data;
	});	
	child.on('close', function (code) {
		console.log("closed");
		$("#about .rubyVersion").text(outputBuffer);
	});		
	
	$(".licenseLink").attr("href", "file://"+__dirname+"/LICENSE.txt")
	
}


var Association = require("associate-ext");
var thisOptions = {
	iconIndex: nw.App.manifest.localConfig.iconIndex
	,defaultIconIndex : nw.App.manifest.localConfig.defaultIconIndex
}
console.log("thisOptions", thisOptions);
options.association = new Association(nw.App.manifest.localConfig.extensions,thisOptions);
options.association.init = function() {
	var thisAssoc = options.association.getAssociation();
	$(".associateBtn.submit").off("click");
	$(".associateBtn.setAll").off("click");
	$(".associateBtn.unsetAll").off("click");
	$table = $(".extensionTable");
	$table.empty();
	$table.append("<tr><th>扩展</th><th>联系</th></tr>");
	for (var ext in thisAssoc) {
		var $thisRow = $('<tr><th>'+ext+'</th><td class="formFld"></td></tr>');
		var $checkBox = $('<input type="checkbox" data-ext="'+ext+'" value="'+ext+'" class="flipSwitch associate ext_'+ext+'" name="associate['+ext+']" />');

		$checkBox.prop("checked", thisAssoc[ext]);

		$thisRow.find(".formFld").append($checkBox);
		$table.append($thisRow);
	}

	$(".associateBtn.unsetAll").on("click", function() {
		$(".extensionTable input.associate").prop("checked", false);
	});
	$(".associateBtn.setAll").on("click", function() {
		$(".extensionTable input.associate").prop("checked", true)
	});
	
	$(".associateBtn.submit").on("click", function() {
		var $checkBox = $(".extensionTable input.associate");
		var ext = [];
		for (var i=0; i<$checkBox.length; i++) {
			if ($checkBox.eq(i).prop("checked")) {
				ext.push($checkBox.eq(i).data("ext"));
			}
		}
		
		var conf = confirm(t("Translator++将写入窗口的注册表。\r\n你确定吗？"));
		if (conf) options.association.setExtension(ext);
	});

	return $table;
}


options.initUiLanguageSelector = function() {
	var docLocation = "www/lang/options.json";
	var $wrapper = $("#uiLanguage");
	$wrapper.off("input");
	var langData = {};
	fs.readFile(docLocation, (err, data)=> {
		if (err) return console.info('unable to read ', docLocation);
		
		try {
			langData = JSON.parse(data);
		} catch (e) {
			console.info("无法分析lang选项");
		}
		
		for (var code in langData) {
			$option = $("<option value='"+code+"'>"+langData[code].name+"</option>")
			$wrapper.append($option);
		}
		
		$wrapper.val(lt.getConfig("lang"))
	
	});	
	$wrapper.on("input", function() {
		var lang = $(this).val();
		console.log("language selected", lang);
		console.log("translation data : ", langData);
		lt.save("lang", lang);
		lt.from(langData[lang].location);
		options.requestRestart();
	})

}


var EscaperPattern = function() {
	sys.config.escaperPatterns = sys.config.escaperPatterns || [];
	this.init();
}

EscaperPattern.prototype.setValue = function(val) {
	sys.config.escaperString = val;
	var result = [];
	try {
		var rendered = window.opener.HexPlaceholder.parseStringTemplate(val);
		console.log("rendered", rendered);
		var pattern = window.opener.HexPlaceholder.renderedFormulaToStrings(rendered);
		console.log("rendered to string", pattern);
		for (var i in pattern) {
			result.push({
				value:pattern[i]
			})
		}
		sys.config.escaperPatterns = result;
	
		window.opener.HexPlaceholder.renderedFormulas = []
		MiniEditor.patterns = window.opener.HexPlaceholder.getActiveFormulas() || [];
		this.miniEditor.trigger();
	} catch (e) {
		console.warn(e);
		alert("分析模式时出错：", e.toString());
	}
	return result;
}

EscaperPattern.prototype.toText = function() {
	if (sys.config.escaperString) return sys.config.escaperString;

	// initialize from sys.config.escaperPatterns
	sys.config.escaperPatterns = sys.config.escaperPatterns || [];
	var texts = [];
	for (var i in sys.config.escaperPatterns) {
		if (!sys.config.escaperPatterns[i].value) continue;
		texts.push(sys.config.escaperPatterns[i].value);
	}
	console.log("pattern : ", texts);
	return texts.join(",\n");
}

EscaperPattern.prototype.init = function() {
	this.miniEditor = new MiniEditor($('.dvEditor'));
	MiniEditor.patterns = window.opener.HexPlaceholder.getActiveFormulas()
	var that = this;
	$fld = $(".customEscaperFld");
	$fld.val(this.toText());
	$fld.on("change", function() {
		that.setValue($(this).val());
	})
}

// ===================================================
// CLASS Autoset
// ===================================================

var Autoset = function() {
	
}
Autoset.prototype.init = function() {
	$(document).ready(function() {	
		$("[data-autoset]").each(function() {
			var $this = $(this);
			//if ($this[0].tagName == "select")
			try {
				if ($this.attr("type") == "checkbox") {
					$this.prop("checked", Boolean(common.varAsStringGet($this.attr('data-autoset'))));
				} else {
					//$this.val(common.varAsStringGet($this.attr('data-autoset')));
				}
			} catch (e) {};
		});
		
		$("[data-autoset]").on("change.autoset", function(e) {
			console.log("Autoset triggered!");
			var $this = $(this);
			if ($this.data("autoset") == "") return;
			
			var autosetPath = $this.data('autoset').split(".")
			if (autosetPath.length < 1) return;
			
			console.log("autoset path : ", autosetPath);
			var thisObj = window;
			for (var i=0; i<autosetPath.length-1; i++) {
				thisObj = thisObj[autosetPath[i]];
				console.log("accessing "+autosetPath[i], thisObj);
				
			}
			console.log("setting up : "+autosetPath[autosetPath.length-1], $this.val());
			
			if ($this.attr("type") == "checkbox") {
				thisObj[autosetPath[autosetPath.length-1]] = $this.prop("checked");
			} else {
				thisObj[autosetPath[autosetPath.length-1]] = $this.val();
			}

		})
	});
}

options.autoset = new Autoset();
options.autoset.init();


options.busy = function() {
	options.isBusy = true;
	return new Promise((resolve, reject) => {
		$("#busyOverlay").fadeIn( 200, ()=>{
			resolve();
		})
	});
	
}
options.busyNot = function() {
	options.isBusy = false;
	return new Promise((resolve, reject) => {
		$("#busyOverlay").fadeOut( 200, ()=>{
			resolve();
		})
	});
}


options.UpdateUI = function() {
	this.$baseElm = $();
}
options.UpdateUI.prototype.evalUpdateButton = function() {
	this.$baseElm.find(".updateStatus > div").addClass("hidden");
	if (sys.config.autoUpdateReinstall) {
		this.$baseElm.find(".updateStatus .pendingUpdate").removeClass("hidden");
	} else {
		if (info.isUpToDate()) {
			this.$baseElm.find(".updateStatus .upToDate").removeClass("hidden");
		} else {
			this.$baseElm.find(".updateStatus .pendingUpdate").removeClass("hidden");
		}
	}
}

options.UpdateUI.prototype.evalLastChecked = function() {
	this.$baseElm.find(".updateLastChecked").html(common.formatDate(new Date(info.getLastCheckedUpdate())));
}

options.UpdateUI.prototype.onUpdateStart = function() {
	this.$baseElm.find(".updateNow").prop("disabled", true);
	
	this.$baseElm.find(".updateNow > i").addClass("rotating-slow");
	this.$baseElm.find(".updateNow > span").html("更新");
	this.$baseElm.find(".updateProcess").removeClass("hidden");
	this.$baseElm.find(".updateProcess").html("更新...");
	
}

options.UpdateUI.prototype.onUpdateEnd = function() {
	this.$baseElm.find(".updateNow").prop("disabled", false);
	
	this.$baseElm.find(".updateProcess").html("");
	this.$baseElm.find(".updateNow > span").html("立即更新");
	this.$baseElm.find(".updateNow > i").removeClass("rotating-slow");
	this.$baseElm.find(".updateProcess").addClass("hidden");
	this.evalUpdateButton();	
}

options.UpdateUI.prototype.setUserAvatar = function() {
	console.warn("用户加载");
	$("#userinfo .username").html(updater.getUser().display_name || "点击登录");
	$("#userinfo .userLevel").html(updater.getUser().level || "0");
	$("#userinfo .userPoints").html(updater.getUser().points || "0");
	
	var imgPath = updater.getUser().localAvatar || "/www/img/transparent.png" ;
	console.warn("设置化身：", imgPath);
	$("#userinfo .userPicture").attr("src", imgPath);		
}
options.UpdateUI.prototype.setUserName = function() {
	if (!updater.user) return;
	console.log("Set username", updater.getUser().display_name);
	$("#userinfo .username").html(updater.getUser().display_name || "登录");	
}

options.UpdateUI.prototype.init = function() {
	this.$baseElm = $("#updaterBlock");
	$("#userinfo .username").html(updater.getUser().display_name || "登录");
	$("#userinfo .loadingSymbol").addClass("hidden");
	/*
	updater.onAvatarReady((imgPath)=> {
		imgPath = imgPath || "www/img/blank.png" ;
		$("#userinfo .userPicture").attr("src", imgPath);
	});
	*/
	this.setUserName();
	this.setUserAvatar();
	
	updater.onBeforeLoginSuccessFunctions = updater.onBeforeLoginSuccessFunctions || [];
	updater.onBeforeLoginSuccessFunctions[0] = () => {
		console.log("Trigger on before login");
		$("#userinfo .loadingSymbol").removeClass("hidden");
	}

	updater.onLoginSuccessFunctions = updater.onLoginSuccessFunctions || [];
	updater.onLoginSuccessFunctions[0] = () => {
		this.setUserAvatar();
		this.setUserName();
	}

	
	updater.onUserLoadedFunctions = updater.onUserLoadedFunctions || [];
	updater.onUserLoadedFunctions[0] = () => {
		this.setUserAvatar();
		this.setUserName();
		$("#userinfo .loadingSymbol").addClass("hidden");
	}
	updater.onUserLoadingFunctions = updater.onUserLoadingFunctions || [];
	updater.onUserLoadingFunctions[0] = () => {
		$("#userinfo .loadingSymbol").removeClass("hidden");
	}
	
	if (updater.isUpdating) {
		this.onUpdateStart();
	}
	
	updater.onUpdateStart(()=> {
		this.onUpdateStart();
	})
	updater.onUpdateEnd(()=> {
		this.onUpdateEnd();
	})
	
	this.$baseElm.find(".updateCheckNow").on("click", async () => {
		$this = this.$baseElm.find(".updateCheckNow");
		$this.addClass("rotating-slow");
		await window.top.info.updateNotification({force:true});
		this.evalLastChecked();
		this.evalUpdateButton();
		$this.removeClass("rotating-slow");
	});
	
	this.$baseElm.find(".updateNow").on("click", async () => {
		if (this.$baseElm.find(".updateNow").prop("disabled")) return;
		if (info.isUpToDate()) {
			var conf = confirm(t("您当前使用的是最新版本。\n你还想更新吗？"));
			if (!conf) return;
		}
		var updateIsSuccess = await updater.update({
			type:"manual",
			onStart : ()=> {
				this.onUpdateStart();
			},
			onFetchUrl : ()=> {
				this.$baseElm.find(".updateProcess").html("获取信息...");
			},			
			downloadOptions: {
				onProgress : (status) => {
					this.$baseElm.find(".updateProcess").html("下载补丁"+status.percent+"%");
				},
				onEnd : ()=> {
					this.$baseElm.find(".updateProcess").html("下载完成");
				}
			},
			onExtract : ()=> {
				this.$baseElm.find(".updateProcess").html("修补");
			},
			onEnd : ()=> {
				this.onUpdateEnd();
			},
			onFail : (errorId, message)=> {
				alert(`更新失败！\n原因：${message} \n有关详细信息，请参阅控制台日志（F12）。`);
			}
			
		});
		if (updateIsSuccess) alert("Translator++已成功更新，请重新启动Translator++。");
	});
	//this.$baseElm.find(".updateLastChecked").html(common.formatDate(new Date(info.getLastCheckedUpdate())));
	this.evalLastChecked();
	if (Updater.config.debugMode == false && Boolean(info.debugVersion)==false) this.evalUpdateButton();
}
options.updateUI = new options.UpdateUI();


var ExpanderButton = function(elements) {
	this.elements = elements || $(".panel-left .expanderButton");
	this.init();
}

ExpanderButton.prototype.toggle = function($button, expand) {
	if (typeof expand == 'undefined') {
		// auto toggle
		expand = !$button.hasClass('isExpanded');
	}

	try {
		var $targets = $($button.attr('data-expand'));
	} catch (e) {
		var $targets = $();
	}

	if (expand) {
		console.log("expanding child", $button.attr('data-expand'), $targets.length);
		// expand child
		$button.removeClass('icon-right-dir')
		$button.addClass('icon-down-dir')
		$button.addClass('isExpanded');
		$targets.removeClass("hidden");
	} else {
		// collapse child
		console.log("collapsing child", $button.attr('data-expand'),$targets.length);

		$button.removeClass('icon-down-dir')
		$button.addClass('icon-right-dir')
		$button.removeClass('isExpanded');
		$targets.addClass("hidden");
	}
}

ExpanderButton.prototype.init = function() {
	var thisExpanderButton = this;
	this.elements.each(function() {
		$this = $(this);
		$this.addClass("expanderTogler");
		$this.attr("title", "单击展开/折叠");
		if ($this.is(".rendered")) return;
		
		$this.on("click", function() {
			console.log("expander button clicked");
			thisExpanderButton.toggle($(this));
		});
		
		$this.closest(".selectable").on("dblclick", function() {
			console.log("expander button clicked");
			thisExpanderButton.toggle($(this).find(".expanderTogler"));			
		})

		$this.addClass("rendered");
	})
}



$(document).ready(function() {

	options.dvField = new DVField();
	options.dvField.init();
	options.initUiLanguageSelector()	
	options.expanderButton = new ExpanderButton();	
	options.escaperPatterns = new EscaperPattern()

	var thisTranslator = sys.config.translator||trans.project.options.translator;
	if (Boolean(thisTranslator) == false) alert(t("没有选择默认转换器。\n将默认翻译程序更改为Google！"));
	
	$("#commonReferenceFile").val(trans.getTemplatePath());
	$("#stagingPath").val(sys.config.stagingPath);
	$("#stagingPath").on("change", function() {
		var conf = confirm(t("改变阶段性路径为:")+$(this).val());
		if (!conf) {
			$(this).val(sys.config.stagingPath);
			return;
		}
		var oldStaggingPath = sys.config.stagingPath;
		sys.config.stagingPath = $(this).val();
		sys.saveConfig();

		var conf = confirm(t("将当前分段路径的内容移到新路径中？"));
		if (!conf) return;
		// moving the data
		options.busy()
		.then(()=>{
			return common.copy(oldStaggingPath, sys.config.stagingPath, 
			function(result){
				console.log(result)
				options.busyNot()
			})	
		});	
		//sys.config.stagingPath = $(this).val();
	})
	
	// render horizontal tabs
	$(".horizTabMenu").each(function(e) {
		var $tabMenu = $(this);
		var $targetTabWrapper = $("[data-id='"+$tabMenu.data("for")+"']");
		$tabMenu.children().each(function(e) {
			var $tabButton = $(this);
			
			$tabButton.on('click', function() {
				$tabMenu.trigger("tabChange");
				$(this).trigger("tabSelected");
				var $targetTabContent = $targetTabWrapper.find("[data-id='"+$(this).data("for")+"']");
				$tabMenu.children().removeClass("selected");
				$(this).addClass("selected");
				$targetTabWrapper.children().addClass("hidden");
				$targetTabContent.removeClass("hidden");
			})
		});
		
		$tabMenu.children().eq(0).trigger("click")
	})
	
	$(".installAddonFrom").on("change", function() {
		var files = $(this).val().split(";")
		addonLoader.install(files)
		.then(() => {
			options.requestRestart();
			alert(t("已安装插件。\nTranslator++需要重新启动才能生效。"));
		});
	})
	
	$("#userinfo").on("click", function() {
		if (updater.getUser().id) {
			var conf = confirm("注销当前用户？");
			if (!conf) return;
			updater.logout();
			return;
		}
		
		var conf = confirm("你想登录吗？");
		if (!conf) return;
		updater.login();
	});
	
	$(".horizTabMenu [data-for=online]").on("tabSelected", async function() {
		console.log("online tab selected");
		await options.addonsOption.drawOnlineList();
	})

	
	/*
	$(window).on("loginSuccess", function() {
		console.log("running on loginSuccess");
		if (!updater.user) return;
		$("#userinfo .username").html(updater.getUser().display_name);
	});
	*/
	

	
	options.drawTranslatorSelector($("#defaultTransEngine"),thisTranslator);
	options.translatorMenu.init();
	options.addonsOption.init();
	options.tab.init();
	options.tab.select($(".tabMenu li.selectable").eq(0));
	options.about.init();
	options.association.init();
	options.updateUI.init();
	options.busyNot();	

	console.log("initializing open external");

	setTimeout(function() {
		$("a.externalLink, a[external]").on("click", function(e) {
			console.warn("点击")
			e.preventDefault();
			nw.Shell.openExternal($(this).attr("href"));
		})
	}, 50)


});


win.on('close', async function() {
	for (var i=0; i<options.__onBeforeClose.length; i++){
		var funct = options.__onBeforeClose.shift();
		funct.call(options);
	}
	options.isNeedRestart();


	// Hide the window to give user the feeling of closing immediately
	this.hide();

	//await sys.saveConfig();
	//await common.wait(200);
	// unregister this window on parent window.
	// sending event to main window
	window.opener.$(window.opener.document).trigger("optionsWindowClosed");
	if (typeof window.opener.ui.windows.options !== 'undefined') window.opener.ui.windows.options = undefined;

	this.close(true);

});