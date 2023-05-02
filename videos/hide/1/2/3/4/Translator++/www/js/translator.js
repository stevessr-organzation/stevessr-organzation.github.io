window.gui = require('nw.gui');
var win = nw.Window.get();
var translator = {
	isAlwaysOnTop: false,
	cache:{
		index:[],
		data:{}
	},
	last:{
		text:"",
		translation:{}
	},
	clipboard :gui.Clipboard.get(),
	timer:{}
	
};

translator.setConfig = function(key, value) {
    this.config = this.config || {};
    this.config[key] = value;
    localStorage.setItem("transAggregatorConf", JSON.stringify(this.config))
    return true
}

translator.getConfig = function(key) {
    if (!this.config) this.config = JSON.parse(localStorage.getItem("transAggregatorConf")) || {};
    return this.config[key];
}


translator.getActiveTranslators = function() {
	return this.getConfig("activeTranslators") || [];
}

translator.isTranslatorActive = function(translatorId) {
	if (this.getActiveTranslators().includes(translatorId)) return true;
	return false;
}

translator.toggleTranslator = function(translatorId, status) {
	if (typeof status == "undefined") {
		// auto toggle
		var lastState = this.isTranslatorActive(translatorId);
		status = !lastState;
	}

	var activeTranslators = this.getActiveTranslators();
	if (status) {
		// on
		if (!this.isTranslatorActive()) activeTranslators.push(translatorId);
	} else {
		// off
		activeTranslators = activeTranslators.filter(item => ![translatorId].includes(item))
	}
	this.setConfig("activeTranslators", activeTranslators);
	
}


translator.isInFrame = function() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }	
}


if (!translator.isInFrame()) {
	win.restore(); // restore if minimized
	win.show(); // show if hidden

	win.setResizable(true);
	//win.height = 320;
	//win.width = 640;
	window.trans = window.opener.trans;
	window.consts = window.opener.consts;
	window.romaji = window.opener.romaji;	
	window.php = window.opener.php;	
	window.autoload = window.opener.autoload;	
	
} else {
	window.trans = window.top.trans;
	window.consts = window.top.consts;
	window.romaji = window.top.romaji;
	window.php = window.top.php;
	window.autoload = window.top.autoload;
	

}

translator.column = function(num) {
	num = num||1;
	if (num < 1) num = 1;
	if (num > 4) num = 4;
	
	$(".mainPane .column").removeClass("col2 col3 col4").addClass("col"+num);
	
}


translator.getParameters = function() {
	return decodeURIComponent(window.location.hash.substr(1));
}

translator.alwaysOnTop = function(stat) {
	if (typeof stat == 'undefined') {
		if (translator.isAlwaysOnTop) {
			win.setAlwaysOnTop(false);
			translator.isAlwaysOnTop = false;
			$(".always-on-top").removeClass("checked");
		} else {
			win.setAlwaysOnTop(true);
			translator.isAlwaysOnTop = true;
			$(".always-on-top").addClass("checked");
			
		}
	} else {
		if (Boolean(stat) == false) {
			win.setAlwaysOnTop(false);
			translator.isAlwaysOnTop = false;
			$(".always-on-top").removeClass("checked");
		} else {
			win.setAlwaysOnTop(true);
			translator.isAlwaysOnTop = true;
			$(".always-on-top").addClass("checked");
		}
	
	}
}

translator.portletSwitchStatus = function(portlet, mode) {
	// portlet is portlet ID or object of portlet
	if (typeof "portlet" == 'string') portlet = $(".mainPane [data-id='"+portlet+"']");
	if (mode == "status" ) {
		portlet.find(".portlet-content").addClass("hidden");
		portlet.find(".portlet-status").removeClass("hidden");
	} else {
		portlet.find(".portlet-content").removeClass("hidden");
		portlet.find(".portlet-status").addClass("hidden");
	}
	return portlet;
}

translator.portletSetStatus = function(portlet, html) {
	if (typeof "portlet" == 'string') portlet = $(".mainPane [data-id='"+portlet+"']");
	return portlet.find(".portlet-status").html(html);
}

translator.translateAll = function(text) {
	if (!text) return false;

	translator.last.text = text;
	translator.last.translation = {};
	
	
	$(".mainPane [data-id='original'] .portlet-content").text(text);
	translator.portletSwitchStatus('original', "result");
	
	for (var i=0; i<trans.translator.length; i++) {
		var transEngine = trans.translator[i];
		//if (trans[transEngine].isDisabled == true) continue;
		if (!this.isTranslatorActive(transEngine)) continue;
		if (typeof trans[transEngine].translate !== 'function') continue;
		
		translator.portletSwitchStatus(transEngine, "status");
		translator.portletSetStatus(transEngine,"<div class='loadingTranslation animate-spin'></div>");
		trans[transEngine].translate(text, {
			onAfterLoading:function(data) {
				var result = data.translation.join($DV.config.lineSeparator);
				console.log(result);
				translator.last.translation[this.id] = result;
				console.log('$(".mainPane [data-id=\'"+'+this.id+'+"\'] .portlet-content")');
				$(".mainPane [data-id='"+this.id+"'] .portlet-content").text(result);
				translator.portletSwitchStatus(this.id, "result");
			}
		});
	}
}

translator.toggleAutoClipboard = function(state) {
	if (typeof state == 'undefined') {
		state = false;
		if (Boolean(translator.timer.autoClipboard) == false) state = true;
	}
	
	if (state) {
		console.log("switch on autoClipboard");
		translator.timer.autoClipboard =  setInterval(function() {
			var thisText = translator.clipboard.get();
			if (!thisText) return false;
			if (translator.lastClipboard == thisText) return false;
			if (common.containJapanese(thisText) == false) return false;
			
			console.log("translating : "+thisText);
			translator.lastClipboard = thisText;
			translator.translateAll(thisText);
			//translator.translateAll(text);
			
		}, 500);
		$(".menu-button.clipboard_copy").addClass("checked");
	} else {
		console.log("switch off autoClipboard");
		if (typeof translator.timer.autoClipboard !== 'undefined') {
			clearInterval(translator.timer.autoClipboard);
			translator.timer.autoClipboard = undefined;
		}
		$(".menu-button.clipboard_copy").removeClass("checked");
		
	}
}

translator.doRepositioning = function() {
	var portlets = $(".mainPane .column .portlet");
	for (var i=0; i<portlets.length; i++) {
		if (i<10) {
			portlets.eq(i).find(".portlet-header .portlet-shortcut").text("alt+"+i);
			portlets.eq(i).find(".portlet-header .portlet-shortcut").removeClass("hidden");
			
		} else {
			portlets.eq(i).find(".portlet-header .portlet-shortcut").addClass("hidden");
		}
	}
}

translator.drawCards = function() {
	$(".mainPane .column").empty();
	var template = $("#template .column .portlet").clone(true, true);
	template.find(".portlet-header .portlet-title").text("Original text");
	template.addClass("original");
	template.attr("data-id", "original");
	template.data("id", "original");
	$(".mainPane .column").append(template);
	
	for (var i=0; i<trans.translator.length; i++) {
		var translatorId = trans.translator[i];
		var template = $("#template .column .portlet").clone(true, true);
		console.log("creating translator :"+trans[translatorId].name);
		
		template.find(".portlet-header .portlet-title").text(trans[translatorId].name);
		template.attr("data-id", translatorId);
		template.data("id", translatorId);
		template.addClass(translatorId);
		if (!this.isTranslatorActive(translatorId)) template.addClass("disabled");

		$(".mainPane .column").append(template);
	}

	translator.doRepositioning();
	
    $(".column").sortable({
		connectWith: ".column",
		handle: ".portlet-header",
		cancel: ".portlet-toggle",
		placeholder: "portlet-placeholder ui-corner-all",
		start: function(e, ui) {
			console.log(arguments);
			ui.placeholder.css("width", ui.item.outerWidth());
			ui.placeholder.css("height", ui.item.outerHeight());
		},
		stop: function(e, ui) {
			translator.doRepositioning();
		}
    });
 
    $( ".portlet" )
		.addClass( "ui-widget ui-widget-content ui-helper-clearfix ui-corner-all" )
		.find( ".portlet-header" )
		.addClass( "ui-widget-header ui-corner-all" )
		.prepend( "<span class='ui-icon ui-icon-minusthick portlet-toggle'></span>");
 
    $( ".portlet-toggle" ).on( "click", function() {
		var icon = $( this );
		icon.toggleClass( "ui-icon-minusthick ui-icon-plusthick" );
		var portlet = icon.closest(".portlet");
		portlet.toggleClass("disabled");
		if (portlet.hasClass("disabled")) {
			//trans[portlet.data("id")].isDisabled = true;
			translator.toggleTranslator(portlet.data("id"), false);
		} else {
			//trans[portlet.data("id")].isDisabled = false;
			translator.toggleTranslator(portlet.data("id"), true);
		}
    });		
}

/*
translator.dockProcedure = function() {
	window.parent;
}
*/

translator.checkEngineUpdate=function() {
	translator.timer = {};
	translator.timer.updater = setInterval(function() {
		if (!autoload) return false;
		if (!autoload.isComplete) return false;
		
		translator.drawCards();
		translator.translateAll(translator.getParameters());
		clearInterval(translator.timer.updater);
		translator.timer.updater = undefined;
	}, 200);
	
}

translator.initIndependent = function() {
	var loadScript = [
		"js/consts.js"
		,"js/jQuery-contextMenu/jquery.contextMenu.min.js"
		,"modules/handsontable/handsontable.js"
		,"js/sys.js"
		,"js/trans.js"
		,"js/romaji.js"
		,"js/php.js"
		,"js/TranslatorEngine.js"
		,"js/autoload.js"
	];

	var doLoadScript = function() {
		if (Array.isArray(loadScript) == false) return false;
		if (loadScript.length < 1) {
			translator.drawCards();
			return false;
		}
		
		var thisScript = loadScript.shift();
		var script = document.createElement('script');
		console.log("loading : ", thisScript);
		script.setAttribute("type", "text/javascript");
		script.onload = function(e) {
			console.log("script loaded", thisScript);
			doLoadScript();
		}
		script.setAttribute("src", thisScript);

		var head = document.querySelector("head"); 
		head.appendChild(script);
		

	}
	doLoadScript();
	
}

$(document).ready(function() {
	$(".toolbar-content.toolbar1 .menu-button").on("click", function(e) {
		$(".toolbar-content.toolbar1 .menu-button").removeClass("checked");
		$(this).addClass("checked");
		translator.column($(this).attr("data-for"));
	});
	
	$(".always-on-top").on("click", function(e) {
		translator.alwaysOnTop();
	});
	$(".menu-button.clipboard_copy").on("click", function(e) {
		translator.toggleAutoClipboard();
	})
	
	$(".menu-button.dock").on("click", function(e) {
		window.close();
	})
	
	//translator.translateAll(translator.getParameters());
	//translator.drawCards();
	translator.checkEngineUpdate();
});

$(window).on('hashchange', function(e) {
	console.log(translator.getParameters());
	translator.translateAll(translator.getParameters());
});	

win.on('close', function() {
	// if inside frame, do nothing
	if (translator.isInFrame) this.close(true);
	
	// Hide the window to give user the feeling of closing immediately
	this.hide();
	window.opener.ui.dockTranslatorPane(translator.last.text,true);
	// unregister this window on parent window.
	window.opener.ui.windows.translator = undefined;

	// After closing the new window, close the main window.
	this.close(true);

});
