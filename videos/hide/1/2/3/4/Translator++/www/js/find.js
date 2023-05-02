const Search = function() {
	try {
		this.config = JSON.parse(localStorage.getItem('search.config'));
	} catch (e) {
		
	}
	this.config = this.config || {};
	if (typeof this.config.alwaysOnTop == 'undefined') this.config.alwaysOnTop = true;
	this.config.blurOpacity = this.config.blurOpacity || 0.7
};
var search = new Search();

search.setConfig = function(key, value) {
	this.config[key] = value;
	this.saveConfig();
}

search.getConfig = function(key) {
	return this.config[key];
}

search.saveConfig = function() {
	localStorage.setItem('search.config', JSON.stringify(this.config));
}
search.blurOpacity = search.getConfig('blurOpacity');

var win = nw.Window.get();
win.restore(); // restore if minimized
win.show(); // show if hidden
win.setResizable(true);
win.height = 340;
win.width = 640;

if (win.y < 0) win.y = 0;
if (win.x < 0) win.x = 0;
//win.setResizable(false);
console.log("current Y", win.y, win.y < 0);
setTimeout(()=>{
	if (win.y < 0) win.y = 0;
	win.setMinimumSize(640, 340)
	console.log("current Y", win.y);
}, 200)

win.setAlwaysOnTop(search.getConfig('alwaysOnTop'));
win.setShowInTaskbar(false);
win.setMinimumSize(530, 260);

var trans = window.opener.trans;
var ui = window.opener.ui;



search.initFileSelectorDragSelect = function() {
	var DragSelect = DragSelect||require("dragselect");
	window.ds = new DragSelect({
	  selectables: document.querySelectorAll('.selectable'),
	  autoScrollSpeed: 15,
	  area : document.getElementsByClassName("fileSelector")[0],
	  callback : function(elm) {
			//console.log($(elm));
			//console.log(this);
			var $elm = $(elm);
			// ignore selection if selecting less than 2 row
			var orig = this._initialCursorPos.x+","+this._initialCursorPos.y;
			var after = this._newCursorPos.x+","+this._newCursorPos.y;
			if (orig == after) return false;
			if ($elm.length <= 1) return false; 
			$elm.each(function() {
				var $input = $(this).find("input");
				if ($input.prop("disabled")) return;

				if (search.shiftPressed) {
					$input.prop("checked", false);
				} else {
					$input.prop("checked", true);
				}			
				$input.trigger("change");
				ds.clearSelection();
			})
	  }
	});	

	if (search.fileSelectorIsInitialized) return;
	// tracking shift key
	window.onkeyup = function(e) {
		if (e.keyCode == 16) search.shiftPressed = false;
		//console.log("canceled");
	}
	window.onkeydown = function(e) {
		if (e.shiftKey) search.shiftPressed = true;
		//console.log("do");		
	}
	search.fileSelectorIsInitialized = true;
}

search.getKeyboardStatus = function(keyboard) {
	if (keyboard == "shift") return search.shiftPressed;
}

search.checkGroup = function($selectFld, action) {
	var $allCheckbox = $selectFld.closest('.resultContext').find("ul .findItemSelector");
	var thisStatus = $selectFld.prop("checked");
	$allCheckbox.each(function() {
		$(this).prop("checked", thisStatus)
	})
}
search.checkAll = function($selectFld, action) {
	console.log($selectFld);
	var $allHeaderCheckbox = $selectFld.closest('.actionResult').find(".headerGroupCheckbox");
	var thisStatus = $selectFld.prop("checked");
	$allHeaderCheckbox.each(function() {
		$(this).prop("checked", thisStatus);
		$(this).trigger("input");
	})
}

search.getTags = function(file, row) {
	// results : array of tags;
	var result = [];
	try {
		result = trans.project.files[file].tags[row];
	} catch (err) {
		
	}
	
	return result;
}

search.drawTags = function($resultLine, file, row, options) {
	options = options||{};
	options.force = options.force||false;

	try {
		var tags = search.getTags(file, row);
		if (options.force == false) {
			if (Array.isArray(tags) == false) return $resultLine;
			if (tags.length == 0) return $resultLine;
		}
		var $resultInfo = $resultLine.find(".resultInfo");
		$resultInfo.find(".tags").remove();
		var $tagContainer = $("<span class='tags'></span>");
		$resultInfo.append($tagContainer);

		if (Array.isArray(tags) == false) return $resultLine;

		for (var i=0; i<tags.length; i++) {
			$thisIcon = $("<i class='tagIcon icon-circle "+tags[i]+"' title='"+tags[i]+"'></i>");
			$thisIcon.css("color", consts.tagColor[tags[i]]);
			$tagContainer.append($thisIcon);
		}
	} catch (err) {
		console.log("Error drawing tags", err);
	}
	return $resultLine;
}



search.appendTags = function(file, row, tags, $actionResult) {
	try {
		if (Array.isArray(tags) == false) tags = [tags];
		
		trans.appendTags(file, parseInt(row), tags);		
		$actionResult = $actionResult||$(".ui-tabs-panel[aria-hidden=false] .actionResult");
		console.log("actionResult", $actionResult);
		var $lines  = $actionResult.find('[data-id="'+file+'"] [data-row="'+row+'"]');
		console.log("line found : ", $lines);
		$lines.each(function() {
			search.drawTags($(this), file, row)
		});
		
	} catch (err) {
		console.warning("无法处理附加标签", err);
	}	
}

search.appendTagsOnSelected = function(tags, $actionResult) {
	$actionResult = $actionResult||$(".ui-tabs-panel[aria-hidden=false] .actionResult");
	
	$lines = $actionResult.find(".findItemSelector:checked");
	$lines.each(function() {
		$resultItem = $(this).closest(".resultItem");
		$resultContext = $(this).closest(".resultContext");
		console.log("file", $resultContext.attr("data-id"));
		console.log("row", $resultItem.attr("data-row"));
		search.appendTags($resultContext.attr("data-id"), $resultItem.attr("data-row"), tags);
	})
	trans.grid.render();
}



search.setTags = function(file, row, tags, $actionResult) {
	try {
		if (Array.isArray(tags) == false) tags = [tags];
		
		trans.setTags(file, parseInt(row), tags);		
		$actionResult = $actionResult||$(".ui-tabs-panel[aria-hidden=false] .actionResult");
		console.log("actionResult", $actionResult);
		var $lines  = $actionResult.find('[data-id="'+file+'"] [data-row="'+row+'"]');
		console.log("line found : ", $lines);
		$lines.each(function() {
			search.drawTags($(this), file, row)
		});
		
	} catch (err) {
		console.warning("无法处理附加标签", err);
	}	
}

search.setTagsOnSelected = function(tags, $actionResult) {
	$actionResult = $actionResult||$(".ui-tabs-panel[aria-hidden=false] .actionResult");
	
	$lines = $actionResult.find(".findItemSelector:checked");
	$lines.each(function() {
		$resultItem = $(this).closest(".resultItem");
		$resultContext = $(this).closest(".resultContext");
		console.log("file", $resultContext.attr("data-id"));
		console.log("row", $resultItem.attr("data-row"));
		search.setTags($resultContext.attr("data-id"), $resultItem.attr("data-row"), tags);
	})
	trans.grid.render();
}


search.removeTags = function(file, row, tags, $actionResult) {
	try {
		if (Array.isArray(tags) == false) tags = [tags];
		
		trans.removeTags(file, parseInt(row), tags);		
		$actionResult = $actionResult||$(".ui-tabs-panel[aria-hidden=false] .actionResult");
		console.log("actionResult", $actionResult);
		var $lines  = $actionResult.find('[data-id="'+file+'"] [data-row="'+row+'"]');
		console.log("line found : ", $lines);
		$lines.each(function() {
			search.drawTags($(this), file, row)
		});
		
	} catch (err) {
		console.warning("无法处理附加标签", err);
	}	
}

search.removeTagsOnSelected = function(tags, $actionResult) {
	$actionResult = $actionResult||$(".ui-tabs-panel[aria-hidden=false] .actionResult");
	
	$lines = $actionResult.find(".findItemSelector:checked");
	$lines.each(function() {
		$resultItem = $(this).closest(".resultItem");
		$resultContext = $(this).closest(".resultContext");
		console.log("file", $resultContext.attr("data-id"));
		console.log("row", $resultItem.attr("data-row"));
		search.removeTags($resultContext.attr("data-id"), $resultItem.attr("data-row"), tags);
	})
	trans.grid.render();
}

search.clearTags = function(file, row, $actionResult) {
	try {
		
		trans.clearTags(file, parseInt(row));
		console.log("result of trans.clearTags", trans.clearTags(file, [{start:row, end:row}]));
		$actionResult = $actionResult||$(".ui-tabs-panel[aria-hidden=false] .actionResult");
		console.log("actionResult", $actionResult);
		var $lines  = $actionResult.find('[data-id="'+file+'"] [data-row="'+row+'"]');
		console.log("line found : ", $lines);
		$lines.each(function() {
			search.drawTags($(this), file, row, {force :true})
		});
		
	} catch (err) {
		console.warning("无法处理清除标记", err);
	}	
}

search.clearTagsOnSelected = function($actionResult) {
	$actionResult = $actionResult||$(".ui-tabs-panel[aria-hidden=false] .actionResult");
	
	$lines = $actionResult.find(".findItemSelector:checked");
	$lines.each(function() {
		$resultItem = $(this).closest(".resultItem");
		$resultContext = $(this).closest(".resultContext");
		console.log("file", $resultContext.attr("data-id"));
		console.log("row", $resultItem.attr("data-row"));
		search.clearTags($resultContext.attr("data-id"), $resultItem.attr("data-row"));
	})
	
}






search.openTagMenu = function() {
	var $popup = $("#find_tagMenu");
	if ($popup.length == 0) {
		$popup = $("<div id='find_tagMenu'></div>");
		$("#template").append($popup);
		var tags = new UiTags({
			options : $(`
			<h2 data-tran="">${t('动作')}</h2>
			<div class="actionSet">
				<label class="flex"><input type="radio" name="tagAction" class="appendTags" value="appendTags" /> <span data-tran="">${t('附加标签')}</span></label>
				<label class="flex"><input type="radio" name="tagAction" class="removeTags" value="removeTags" /> <span data-tran="">${t('移除标签')}</span></label>
				<label class="flex"><input type="radio" name="tagAction" class="setTags" value="setTags" /> <span data-tran="">${t('设置标签')}</span></label>
				<label class="flex"><input type="radio" name="tagAction" class="actionNone" value="" /> <span data-tran="">${t('什么也不做')}</span></label>
			</div>		
			`)
		});
		this._uiTags = tags;
		$popup.empty();
		$popup.append(tags.element);
	}
	$popup.dialog({
		title: t("设置标签"),
		autoOpen: false,
		modal:true,
		width:480,
		height:220,
		minWidth:480,
		minHeight:220,
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
					var tags = search._uiTags.getValue();
					console.log(tags);
					if (tags === false) return false;
					

					$this.dialog( "close" );

					if (tags.filterTagMode == "appendTags") {
						search.appendTagsOnSelected(tags.filterTag);
					} else if (tags.filterTagMode == "removeTags") {
						search.removeTagsOnSelected(tags.filterTag);
					} else {
						search.setTagsOnSelected(tags.filterTag);
					}
				}
			}

		]
	});	
	$popup.dialog("open");	
}

search.sendCommand = function(keyword) {
	keyword = keyword||$("#fieldFind").val();
	if (keyword.length < 1) return alert(t("关键字太短了！"));
	
	var caseSensitiveMode =  $("#caseSensitive").prop("checked");
	var $notFoundMsg = $("<div class='blockBox infoBlock withIcon'>"+t("什么也没找到<br />不要忘记设置目标搜索字段。")+"</div>")
	
	var selectedFiles = "*";
	if ($("#selectAllFile").prop("checked") == false) {
		selectedFiles = [];
		$("#find .fileSelector .filename:checked").each(function() {
			selectedFiles.push($(this).attr("value"));
		});
	}
	console.log("Selected file is :");
	console.log(selectedFiles);
	
	// array of value
	var searchLocations = $(".searchMode").val();
	
	var result = trans.search(keyword, {
		caseSensitive 		: caseSensitiveMode,
		files				: selectedFiles,
		searchLocations	 	: searchLocations,
		isRegexp			: $("#findIsRegexp").prop("checked")
	});
	
	search.toggleFileList(false);
	$("#find .searchResult").empty();
	

	var $template = $("<div class='searchResultHeader column2'>\
						<div class='searchresultAction'>\
							<input type='checkbox' value='' class='headerCheckbox' /> \
							<span>全选</span>\
						</div>\
						<div class='right searchResultData'>\
							<i class='icon-docs'></i> "+result.count+"\
							<i class='icon-hourglass-3'></i> "+result.executionTime+" ms\
						</div>\
					</div>");
	$template.find(".headerCheckbox").on("input", function(e) {
		search.checkAll.call(search, $(this));
	});
	

	$("#find .searchResult").append($template);
	if (typeof result.files == "undefined" || result.count == 0) $("#find .searchResult").append($notFoundMsg);
					
					
	for (var file in result.files) {
		var $lineFile = $("<div class='resultContext' data-id="+file+"><h2><input type='checkbox' value='1' class='headerGroupCheckbox' /> <i class='icon-doc'></i>"+file+" <span class='contextCount'>"+result.files[file].length+"</span></h2><ul></ul></div>");
		$lineFile.find(".headerGroupCheckbox").on("input", function(e) {
			search.checkGroup.call(search, $(this));
		});
		for(var i in result.files[file]) {
			var currentLine = result.files[file][i];
			var refference  = "";
			var foundStr    = common.htmlEntities(currentLine.fullString);

			if (result.isRegexp) {
				var regExpKeyword = common.evalRegExpStr(keyword);
				if (regExpKeyword !== false) {
					foundStr = foundStr.replace(regExpKeyword,   
						function(){
							return '<span class="highlight">'+arguments[0]+'</span>';
						});
				}
			} else {
				foundStr = foundStr.replaces(keyword, "<span class='highlight'>"+common.htmlEntities(keyword)+"</span>", !caseSensitiveMode);
			}
			//console.log(currentLine);
			try {
				var thisFileRef = trans.project.files[file].data[currentLine.row];
				if (currentLine.col == 0) {
					// this is key row, search translation for refference
					for (var n=thisFileRef.length; n>0; n--) {
						if (Boolean(thisFileRef[n])) {
							refference = thisFileRef[n];
							break;
						}
					}
				} else {
					// this not a key row, search keyrow for refference
					refference = thisFileRef[0];
				}
			}
			catch (err) {
			}

			refference =  common.htmlEntities(refference);
			
			var lineTemplate = $("<li class='resultItem' title='点击开始' data-row='"+currentLine.row+"' data-col='"+currentLine.col+"'>"+
						"<div class='texts'>"+
						"<h1>"+foundStr+"</h1>"+
						"<h1 class='refference' title='参考文献'>"+refference+"</h1>"+
						"</div>"+							
						"<div class='resultInfo'><span class='findItemSelectorWrapper'><input type='checkbox' class='findItemSelector' value='' /></span><span class='rowLabel' title='行'>"+currentLine.row+"</span><span class='colLabel' title='列'>"+currentLine.col+"</span></div></li>");
			lineTemplate.data("row", currentLine.row);
			lineTemplate.data("col", currentLine.col);
			lineTemplate.data("context", file);
			lineTemplate.on("click", function(e) {
				if ($(e.target).is("input[type=checkbox]")) {
					return;
				}				
				trans.goTo($(this).data("row"), $(this).data("col"), $(this).data("context"));
				$(this).closest("ul").find(".selected").removeClass("selected");
				$(this).addClass("selected");
			});
			
			lineTemplate.find(".findItemSelector").on("change", function() {
				search.find = search.find || {};
				if ($(this).prop("checked") == true) {
					search.find.$lastCheckedFile = $(this);
				} else {
					search.find.$lastCheckedFile = undefined;
				}				
			});
			lineTemplate.find(".findItemSelector").on("mousedown", function(e) {
				search.find = search.find || {};
				
				if (!Boolean(search.find.$lastCheckedFile)) return false;
				if (e.shiftKey) {
					console.log("The SHIFT key was pressed!");
					var $checkBoxes = $(this).closest(".actionResult").find(".findItemSelector");
					var lastIndex = $checkBoxes.index(search.find.$lastCheckedFile);
					var thisIndex = $checkBoxes.index(this);
					
					if (lastIndex < thisIndex) {
						var chckFrom = lastIndex;
						var chckTo = thisIndex;
					} else {
						var chckFrom = thisIndex;
						var chckTo = lastIndex;
					}
					console.log("check from index "+chckFrom+" to "+chckTo);
					for (var i=chckFrom; i<chckTo; i++) {
						$checkBoxes.eq(i).prop("checked", true).trigger("change");
					}					
				}
			});		
			
			search.drawTags(lineTemplate, file, currentLine.row);
			$lineFile.find("ul").append(lineTemplate);
		}
		$("#find .searchResult").append($lineFile);
	}
	
	console.log(result);
}


search.sendCommandReplace = function() {
	var keyword = $("#fieldReplaceFind").val();
	var replacer = $("#fieldReplaceReplace").val();
	if (keyword.length < 1) return alert("关键字太短了！");
	var $notFoundMsg = $("<div class='blockBox infoBlock withIcon'>"+t("找不到可以替代的东西<br />替换函数不会替换键列上的任何内容。")+"</div>")
	
	var conf = confirm(t("把 '")+keyword+t("' 替换为 '")+replacer+t("'？\r\n我们还没有为这个东西创建撤销功能！\n你确定要继续吗？"));
	if (!conf) return false;
	
	
	var caseSensitiveMode =  $("#caseSensitiveReplace").prop("checked");
	
	var selectedFiles = "*";
	if ($("#selectAllFileReplace").prop("checked") == false) {
		selectedFiles = [];
		$("#replace .fileSelector .filename:checked").each(function() {
			selectedFiles.push($(this).attr("value"));
		});
	}
	console.log("Selected file is :");
	console.log(selectedFiles);
	
	
	var result = trans.replace(keyword, replacer, {
		caseSensitive 	: caseSensitiveMode,
		'files' 		: selectedFiles,
		isRegexp		: $("#replaceIsRegexp").prop("checked")
	});
	
	search.toggleFileList(false);
	$(".replaceResult").empty();
	
	if (typeof result.files == "undefined") $(".replaceResult").html($notFoundMsg);
	if (result.count == 0)  $(".replaceResult").html($notFoundMsg);

	var $template = $("<div class='searchResultHeader column2'>\
						<div class='searchresultAction'>\
							<input type='checkbox' value='' class='headerCheckbox' /> \
							<span>全选</span>\
						</div>\
						<div class='right searchResultData'>\
							<i class='icon-docs'></i> "+result.count+"\
							<i class='icon-hourglass-3'></i> "+result.executionTime+" ms\
						</div>\
					</div>");
	$template.find(".headerCheckbox").on("input", function(e) {
		search.checkAll.call(search, $(this));
	});
					
	$(".replaceResult").prepend($template);

	for (var file in result.files) {
		var $lineFile = $("<div class='resultContext' data-id="+file+"><h2><input type='checkbox' value='1' class='headerGroupCheckbox' /><i class='icon-doc'></i>"+file+" <span class='contextCount'>"+result.files[file].length+"</span></h2><ul></ul></div>");
		$lineFile.find(".headerGroupCheckbox").on("input", function(e) {
			search.checkGroup.call(search, $(this));
		});

		for(var i in result.files[file]) {
			var currentLine = result.files[file][i];
			
			
			var foundStr = common.htmlEntities(currentLine.originalString);
			
			if (result.isRegexp) {
				var regExpKeyword = common.evalRegExpStr(keyword);
				if (regExpKeyword !== false) {
					foundStr = foundStr.replace(regExpKeyword,   
						function(){
							return '<span class="highlight2">'+arguments[0]+'</span>';
						});
				}
			} else {
				foundStr = foundStr.replaces(keyword, "<span class='highlight2'>"+keyword+"</span>", !caseSensitiveMode);
			}
			
			var replacedString = common.htmlEntities(currentLine.fullString).replaces(replacer, "<span class='highlight'>"+replacer+"</span>");
			
			//var foundStr = currentLine.fullString.replaces(keyword, "<span class='highlight'>"+keyword+"</span>", !caseSensitiveMode);
			
			var lineTemplate = $("<li class='resultItem' title='"+t("点击开始")+"' data-row='"+currentLine.row+"' data-col='"+currentLine.col+"'>"+
			"<div class='texts'>"+
				"<h1 class='refference' title='参考文献'>"+foundStr+"</h1>"+
				"<span><i class='icon-right-big'> </i></span>"+
				"<h1>"+replacedString+"</h1>"+
			"</div>"+
			"<div class='resultInfo'><span class='findItemSelectorWrapper'><input type='checkbox' class='findItemSelector' value='' /></span><span class='rowLabel' title='行'>"+currentLine.row+"</span><span class='colLabel' title='列'>"+currentLine.col+"</span></div></li>");
			lineTemplate.data("row", currentLine.row);
			lineTemplate.data("col", currentLine.col);
			lineTemplate.data("context", file);
			lineTemplate.on("click", function(e) {
				if ($(e.target).is("input[type=checkbox]")) {
					return;
				}
				trans.goTo($(this).data("row"), $(this).data("col"), $(this).data("context"));
			});
			
			lineTemplate.find(".findItemSelector").on("change", function() {
				search.repl = search.repl || {};
				if ($(this).prop("checked") == true) {
					search.repl.$lastCheckedFile = $(this);
				} else {
					search.repl.$lastCheckedFile = undefined;
				}				
			});
			lineTemplate.find(".findItemSelector").on("mousedown", function(e) {
				search.repl = search.repl || {};
				
				if (!Boolean(search.repl.$lastCheckedFile)) return false;
				if (e.shiftKey) {
					console.log("The SHIFT key was pressed!");
					var $checkBoxes = $(this).closest(".actionResult").find(".findItemSelector");
					var lastIndex = $checkBoxes.index(search.repl.$lastCheckedFile);
					var thisIndex = $checkBoxes.index(this);
					
					if (lastIndex < thisIndex) {
						var chckFrom = lastIndex;
						var chckTo = thisIndex;
					} else {
						var chckFrom = thisIndex;
						var chckTo = lastIndex;
					}
					console.log("check from index "+chckFrom+" to "+chckTo);
					for (var i=chckFrom; i<chckTo; i++) {
						$checkBoxes.eq(i).prop("checked", true).trigger("change");
					}					
				}
			});		

			search.drawTags(lineTemplate, file, currentLine.row);
			$lineFile.find("ul").append(lineTemplate);
		}
		$(".replaceResult").append($lineFile);
	}
	
	console.log(result);
}

search.sendCommandPut = function() {
	var conf = confirm(t("这将替换在目标列中找到的任何翻译，\n您确定吗？"));
	if (!conf) return false;
	var keyword = $("#findPut .fldFind").val();
	if (keyword.length < 1) return alert(t("关键字太短了！"));
	
	var put = $("#findPut .fldPut").val();
	var caseSensitiveMode =  $("#findPut .caseSensitive").prop("checked");
	var targetCol = parseInt($("#findPut .targetSelector select").val());
	targetCol = parseInt(targetCol);
	
	var selectedFiles = "*";
	if ($("#findPut .selectAllFile").prop("checked") == false) {
		selectedFiles = [];
		$("#findPut .fileSelector .filename:checked").each(function() {
			selectedFiles.push($(this).attr("value"));
		});
	}
	console.log("Selected file is :");
	console.log(selectedFiles);	
	
	var result = trans.findPut(keyword, put, targetCol, {
		caseSensitive 	: caseSensitiveMode,
		'files' 		: selectedFiles,
		'lineMatch' 	: true
	});	
	
	search.toggleFileList(false);
	$("#findPut .searchResult").empty();
	
	if (typeof result.files == "undefined") $("#findPut .searchResult").html(t("没找到！"));
	if (result.count == 0)  $("#findPut .searchResult").html(t("没找到！"));

	/*
	$("#findPut .searchResult").append("<div class='searchNote'>"+t("Searching done!")+"</div>");
	$("#findPut .searchResult").append("<div class='searchNote'>"+t("Found ")+result.count+t(" occurance!")+"</div>");
	$("#findPut .searchResult").append("<div class='searchNote'>"+t("Search took ")+result.executionTime+" ms.</div>");
	*/
	var $template = $("<div class='searchResultHeader column2'>\
						<div class='searchresultAction'>\
							<input type='checkbox' value='' class='headerCheckbox' /> \
							<span>全选</span>\
						</div>\
						<div class='right searchResultData'>\
							<i class='icon-docs'></i> "+result.count+"\
							<i class='icon-hourglass-3'></i> "+result.executionTime+" ms\
						</div>\
					</div>");
	$template.find(".headerCheckbox").on("input", function(e) {
		search.checkAll.call(search, $(this));
	});
	
	$("#findPut .searchResult").prepend($template);
	
	
	for (var file in result.files) {
		var $lineFile = $("<div class='resultContext' data-id="+file+"><h2><i class='icon-doc'></i>"+file+" <span class='contextCount'>"+result.files[file].length+"</span></h2><ul></ul></div>");
		for(var i in result.files[file]) {
			var currentLine = result.files[file][i];
			var foundStr = currentLine.fullString.replaces(keyword, "<span class='highlight'>"+keyword+"</span>", !caseSensitiveMode);
			var refference = "";
			
			//console.log(currentLine);
			try {
				var thisFileRef = trans.project.files[file].data[currentLine.row];
				refference = thisFileRef[targetCol];
			}
			catch (err) {
			}
			
			var lineTemplate = $("<li class='resultItem' title='点击开始' data-row='"+currentLine.row+"' data-col='"+currentLine.col+"'>"+
						"<div class='texts'>"+
						"<h1>"+foundStr+"</h1>"+
						"<h1 class='refference' title='参考文献'>"+refference+"</h1>"+
						"</div>"+							
						"<div class='resultInfo'><span class='findItemSelectorWrapper'><input type='checkbox' class='findItemSelector' value='' /></span><span class='rowLabel' title='行'>"+currentLine.row+"</span><span class='colLabel' title='列'>"+currentLine.col+"</span></div></li>");
			lineTemplate.data("row", currentLine.row);
			lineTemplate.data("col", currentLine.col);
			lineTemplate.data("context", file);
			lineTemplate.on("click", function(e) {
				if ($(e.target).is("input[type=checkbox]")) {
					return;
				}				
				trans.goTo($(this).data("row"), $(this).data("col"), $(this).data("context"));
			});
			
			lineTemplate.find(".findItemSelector").on("change", function() {
				search.find = search.find || {};
				if ($(this).prop("checked") == true) {
					search.find.$lastCheckedFile = $(this);
				} else {
					search.find.$lastCheckedFile = undefined;
				}				
			});
			lineTemplate.find(".findItemSelector").on("mousedown", function(e) {
				search.find = search.find || {};
				
				if (!Boolean(search.find.$lastCheckedFile)) return false;
				if (e.shiftKey) {
					console.log("The SHIFT key was pressed!");
					var $checkBoxes = $(this).closest(".actionResult").find(".findItemSelector");
					var lastIndex = $checkBoxes.index(search.find.$lastCheckedFile);
					var thisIndex = $checkBoxes.index(this);
					
					if (lastIndex < thisIndex) {
						var chckFrom = lastIndex;
						var chckTo = thisIndex;
					} else {
						var chckFrom = thisIndex;
						var chckTo = lastIndex;
					}
					console.log("check from index "+chckFrom+" to "+chckTo);
					for (var i=chckFrom; i<chckTo; i++) {
						$checkBoxes.eq(i).prop("checked", true).trigger("change");
					}					
				}
			});		
			
			search.drawTags(lineTemplate, file, currentLine.row);
			$lineFile.find("ul").append(lineTemplate);
		}
		$("#findPut .searchResult").append($lineFile);
	}	
	
}


search.drawFileSelector = function() {
	if (typeof trans.project == 'undefined') return false;
	var project = trans.project;
	for (var file in project.files) {
		var template = $("<label class='selectable'><input type='checkbox' class='filename' value='"+file+"' /><span>"+file+"</span></label>");
		$(".fileSelector").append(template);

	}
	$(".fileSelector").attr("title", "拖动可选择，按住Shift键并拖动可取消选择");
	search.initFileSelectorDragSelect();	
}

search.toggleFileList = function(stat) {
	if (typeof stat == 'undefined') {
		stat = !$(".toggleFileSelector").hasClass("opened");
	}
	
	if (!stat) {
		$(".fileSelector").addClass("hidden");
		$(".toggleFileSelector").removeClass("opened");
	} else {
		$(".fileSelector").removeClass("hidden");
		$(".toggleFileSelector").addClass("opened");
	}
	return stat;
}


// ======================================================================
// context menu handler
// ======================================================================

search.selectAll = function($actionResult) {
	//select all by given actionResult
	$actionResult = $actionResult||$(".ui-tabs-panel[aria-hidden=false] .actionResult");
	$headerCheckbox = $actionResult.find(".headerCheckbox");
	$headerCheckbox.prop("checked", true);
	$headerCheckbox.trigger("input");
	//search.checkAll($actionResult.find(".headerCheckbox"));
}
search.unSelectAll = function($actionResult) {
	//select all by given actionResult
	$actionResult = $actionResult||$(".ui-tabs-panel[aria-hidden=false] .actionResult");
	$headerCheckbox = $actionResult.find(".headerCheckbox");
	$headerCheckbox.prop("checked", false);
	$headerCheckbox.trigger("input");
	//search.checkAll($actionResult.find(".headerCheckbox"));
}

search.clearTranslationOnSelected = function($actionResult) {
	$actionResult = $actionResult||$(".ui-tabs-panel[aria-hidden=false] .actionResult");
	
	$lines = $actionResult.find(".findItemSelector:checked");
	$lines.each(function() {
		$resultItem 	= $(this).closest(".resultItem");
		$resultContext 	= $(this).closest(".resultContext");
		var fileId 		= $resultContext.attr("data-id");
		var row 		= $resultItem.attr("data-row");
	
		try {
			var thisRow = trans.project.files[fileId].data[row];
			trans.project.files[fileId].data[row] = thisRow.fill("", 1);
		} catch (e) {}
		//search.appendTags($resultContext.attr("data-id"), $resultItem.attr("data-row"), tags);
	})
	trans.grid.render();

}

search.searchResultContextMenu = function() {
	console.log("trans.fileSelectorContextMenuInit");
	if (this.searchResultContextMenuIsInitialized) return false;
	this.menu = new nw.Menu();

	// Add some items with label
	this.menu.append(new nw.MenuItem({
	  label: t('全选'),
	  type: "normal", 
	  click: function(){
		  search.selectAll();
	  }
	}));
	this.menu.append(new nw.MenuItem({
	  label: 'Clear selection',
	  type: "normal", 
	  click: function(){
		search.unSelectAll();
	  }
	}));
	this.menu.append(new nw.MenuItem({ type: 'separator' }));
	
	var tagging = new nw.Menu();
	
	tagging.append(new nw.MenuItem({
	  label: t('贴上红色标签'),
	  type: "normal", 
	  icon: "www/img/red.png",
	  click: function(){
		search.appendTagsOnSelected("red");
	  }
	}));
	tagging.append(new nw.MenuItem({
	  label: t('贴上黄色标签'),
	  type: "normal", 
	  icon: "www/img/yellow.png",
	  click: function(){
		search.appendTagsOnSelected("yellow");
	  }
	}));
	tagging.append(new nw.MenuItem({
	  label: t('贴上绿色标签'),
	  type: "normal", 
	  icon: "www/img/green.png",
	  click: function(){
		search.appendTagsOnSelected("green");
	  }
	}));
	tagging.append(new nw.MenuItem({
	  label: t('贴上蓝色标签'),
	  type: "normal", 
	  icon: "www/img/blue.png",
	  click: function(){
		search.appendTagsOnSelected("blue");
	  }
	}));
	tagging.append(new nw.MenuItem({
	  label: t('贴上金色标签'),
	  type: "normal", 
	  icon: "www/img/gold.png",
	  click: function(){
		search.appendTagsOnSelected("gold");
	  }
	}));
	tagging.append(new nw.MenuItem({
		label: t('更多标签...'),
		type: "normal", 
		click: function(){
		  search.openTagMenu();
		}
	  }));	
	tagging.append(new nw.MenuItem({ type: 'separator' }));
	tagging.append(new nw.MenuItem({
	  label: t('清除标签'),
	  type: "normal", 
	  click: function(){
		search.clearTagsOnSelected();
	  }
	}));
	tagging.append(new nw.MenuItem({ type: 'separator' }));
	tagging.append(new nw.MenuItem({
		label: t('清除翻译'),
		type: "normal", 
		click: function(){
			var conf = confirm(t("是否要清除所选项目的选择？"));
			search.clearTranslationOnSelected();
		}
	  }));	
	/*
	var withSelection = new nw.Menu();	
	withSelection.append(new nw.MenuItem({
	  label: 'Tagging',
	  submenu: tagging
	}))
	*/
	
	this.menu.append(new nw.MenuItem({
	  label: t('有了选择...'),
	  submenu: tagging
	}));	
	
	var that = this;
	
	$(document.body).on("contextmenu", ".actionResult", function(ev) {
	  ev.preventDefault();
	  // Popup the native context menu at place you click
	  //console.log(ev);
	  console.log(ev.originalEvent);
	  that.menu.popup(parseInt(ev.originalEvent.x), parseInt(ev.originalEvent.y));
	  return false;		
	})
	/*
	document.body.addEventListener('contextmenu', function(ev) {
	  // Prevent showing default context menu
	  //console.log(ev);
	  if ($(ev.target).is(".actionResult") == false) return false;
	  ev.preventDefault();
	  // Popup the native context menu at place you click
	  that.menu.popup(ev.x, ev.y);

	  return false;
	}, false);
	*/
	this.searchResultContextMenuIsInitialized = true;
	
}

search.optionsMenu = function(x, y) {
	console.log("search.optionsMenu");

	var uncheckBlurMenu = () => {
		for (var id in this.menuOpacityItem) {
			if (Boolean(this.menuOpacityItem[id]) == false) continue;
			this.menuOpacityItem[id].checked = false;
		}
	}


	this.menuOptions = new nw.Menu();

	// Add some items with label
	this.menuAlwaysOnTop = new nw.MenuItem({
		label: t('总是在上面'),
		type: "checkbox", 
		checked: win.isAlwaysOnTop,
		click: function(){
			var currentState = win.isAlwaysOnTop;
			win.setAlwaysOnTop(!currentState);			
			this.checked = !currentState;
			search.setConfig('alwaysOnTop', !currentState);
		}
	  })

	this.menuOptions.append(this.menuAlwaysOnTop);

	//this.menuOptions.append(new nw.MenuItem({ type: 'separator' }));
	
	var opacity = new nw.Menu();

	this.menuOpacityItem = {};

	for (var i=10; i>0; i--) {
		var percent = i*10;		
		void function() {
			var z = i;
			var percent = z*10;				
			var current = search.blurOpacity*100;
			var isChecked = false;
			if (current == percent) isChecked = true;
			var thisMenu = new nw.MenuItem({
				label: percent+'%',
				type: "checkbox", 
				checked: isChecked,
				click: function(){
					uncheckBlurMenu();
					this.checked = true;				
					search.blurOpacity = z/10;
					search.setConfig('blurOpacity', z/10);
				}
			});
			search.menuOpacityItem[percent] = thisMenu;
			opacity.append(thisMenu);
		}()
	}
	
	opacity.append(new nw.MenuItem({ type: 'separator' }));
	var isChecked = false;
	if (search.blurOpacity == 0.6) isChecked = true;	
	this.menuOpacityItem['default'] = new nw.MenuItem({
		label: t('默认'),
		type: "checkbox", 
		checked: isChecked,
		click: function(){
			console.log(this, arguments)
			uncheckBlurMenu();
			this.checked = true;
			search.blurOpacity = 0.6;
			search.setConfig('blurOpacity', 0.6);
		}
	})
	opacity.append(this.menuOpacityItem['default']);
	
	/*
	var withSelection = new nw.Menu();	
	withSelection.append(new nw.MenuItem({
	  label: 'Tagging',
	  submenu: tagging
	}))
	*/
	
	this.menuOptions.append(new nw.MenuItem({
	  label: t('模糊不透明度'),
	  submenu: opacity
	}));	
	
	var that = this;

	if (this.optionsMenuIsInitialized) return false;
	$(".application-menu-button").on("click", function(ev) {
	  ev.preventDefault();
	  // Popup the native context menu at place you click
	  var thisOffset = $(this).offset();
	  //that.menu.popup(ev.originalEvent.x, ev.originalEvent.y);
	  that.menuOptions.popup(parseInt(thisOffset.left)-80, 32);
	  return false;		
	})

	this.optionsMenuIsInitialized = true;
	
}

search.getBlurOpacity = function() {
	return this.blurOpacity;
}

search.initialize = function() {
	this.appMenu = new nw.Menu();
	this.appMenu.append(new nw.MenuItem({
		label: t('关闭'),
		type: "normal", 
		click: function() {
		  
	  	}
	}));	
	var that = this;
	$(document.body).on("contextmenu", ".findWrapper", function(ev) {
	  ev.preventDefault();
	  // Popup the native context menu at place you click
	  //console.log(ev);
	  that.appMenu.popup(parseInt(ev.originalEvent.x), parseInt(ev.originalEvent.y));
	  return false;		
	})	

	this.optionsMenu();
	
}

// =======================================================
// EVENTS
// =======================================================

$(document).ready(function() {
	search.searchResultContextMenu();
	
	$(document).on('keydown', function(e) {
		var keyCode = e.keyCode || e.which;
		switch (keyCode) {
			case 13 : //Enter
				e.preventDefault();
				console.log("Searching");
				
				if ($("div[aria-hidden=false]").attr("id") == "find") {
					search.sendCommand();
				} else if  ($("div[aria-hidden=false]").attr("id") == "replace"){
					search.sendCommandReplace();
				} else {
					search.sendCommandPut();
				}
				//$(".button-about").trigger("click");
			break;		
		}
	});
  
	
	
	// INITIALIZING TAB
	
	var type = window.location.hash.substr(1);
	var mode = 0;
	if (type == "replace") mode = 1;
	console.log("tab index  : "+mode);
	
	$("#tabs").tabs({
		active: mode,
		activate: function(e, thisUi) {
			console.log(thisUi);
			if (thisUi.newPanel.attr("id") == 'findPut') {
				$("#findPut .targetSelector").empty();
				ui.generateColSelector({
					skipFirstCol:true
				}).appendTo($("#findPut .targetSelector"));
			}
			
		}
	});
	
	if (mode == 0) {
		$("#fieldFind").focus();
	} else {
		$("#fieldReplaceFind").focus();
	}
	
	
	$(".toggleFileSelector").on("click", function(e) {
		var $thisTab = $(this).closest(".ui-tabs-panel");

		$(this).toggleClass("opened");
		if ($(this).hasClass("opened")) {
			$thisTab.find(".fileSelector").removeClass("hidden");
		} else {
			$thisTab.find(".fileSelector").addClass("hidden");
		}		
	});
	
	$(".selectAllFile").on("change", function(e) {
		var $thisTab = $(this).closest(".ui-tabs-panel");
		if ($(this).prop("checked")) {
			$thisTab.find(".fileSelector").addClass("hidden");
			$thisTab.find(".toggleFileSelector").removeClass("opened");
			$thisTab.find(".fileSelector .filename").each(function() {
				//console.log($(this));
				$(this).prop("disabled", true);
			});
		} else {
			$thisTab.find(".fileSelector").removeClass("hidden");
			$thisTab.find(".toggleFileSelector").addClass("opened");
			$thisTab.find(".fileSelector .filename").each(function() {
				$(this).prop("disabled", false);
			});
		}
	});
	
	$(".application-bar .application-close-button").on("click", function(e) {
		win.close();
	})
	
	search.initialize();
	search.drawFileSelector();
	$(".selectAllFile").trigger("change");
	
});  // document ready


win.on('blur', function() {
	$("body").css("opacity", search.getBlurOpacity())
})
win.on('focus', function() {
	$("body").css("opacity", "1")
})

win.on('close', function() {
	// Hide the window to give user the feeling of closing immediately
	this.hide();

	// unregister this window on parent window.
	if (typeof ui.windows.search !== 'undefined') ui.windows.search = undefined;

	// After closing the new window, close the main window.
	this.close(true);

});
