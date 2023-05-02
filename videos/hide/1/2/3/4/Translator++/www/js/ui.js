/**
 * Triggered when dialog Row Properties Opened
 * @event Ui#dialogRowPropertiesOpened
 */

var win = nw.Window.get();
//win.restore(); // restore if minimized
win.show(); // show if hidden
//win.setResizable(true);
//win.setMinimumSize(900, 600); //defined on main.js

// prevent windows goes beyond screen
setTimeout(()=>{
	if (win.y < 0) win.y = 0;
	console.log("current Y", win.y);
}, 200)


$.fn.insertAt = function(index, $parent) {
    return this.each(function() {
        if (index === 0) {
            $parent.prepend(this);
        } else {
            $parent.children().eq(index - 1).after(this);
        }
    });
}

var ui = {
	isLoaded: false,
	autoComplateData:[],
	selectedCell:null,
	dialogs:[],
	windows:{},
	timers:{}
}
ui.onReady = function (onReadyEvent) {
	if (typeof onReadyEvent !== 'function') return console.log("parameter must be a function");
	this.__onReadyPool = this.__onReadyPool||[];
	
	if (Boolean(this.isInitialized) == false) {
		this.__onReadyPool.push(onReadyEvent)
	} else {
		for (var i=0; i<this.__onReadyPool.length; i++) {
			this.__onReadyPool[i].apply(this, arguments);
		}
		this.__onReadyPool = [];
		
		onReadyEvent.apply(this, arguments);
	}
}

ui.onDOMReady = function(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

ui.centerWindow = function() {
	console.log("centering window");
	var leftMargin = (screen.width - window.outerWidth)/2;
	var topMargin = (screen.height - window.outerHeight)/2;
	win.y = parseInt(topMargin);
	win.x = parseInt(leftMargin);
	console.log(win.y, win.x);
	return [win.x, win.y]
}


ui.isInViewport = function($obj) {
	var elementTop = $obj.offset().top;
	var elementBottom = elementTop +$obj.outerHeight();
	var viewportTop = $(window).scrollTop();
	var viewportBottom = viewportTop + $(window).height();
	return elementBottom > viewportTop && elementTop < viewportBottom;
};

ui.scrollToView = function(row, col, onAfterScroll){
	//console.log("scrolling to : "+row+","+col);
	
	// for performance check only last visible row, since the only possible way is goes to next row;
	var lastVisibleRow = ui.getLastFullyVisibleRow();
	if (row < lastVisibleRow) return false;
	
	
	var center = row-Math.round(trans.grid.countVisibleRows()/2);
	
	// registering event once 
	if (typeof onAfterScroll == 'function') {
		trans.grid.addHookOnce('afterScrollVertically', function() {
			onAfterScroll.call(trans.grid, row, col);	
		});
	}

	
	trans.grid.scrollViewportTo(center, col);
	//trans.grid.selectCell(center, col,center, col);
	return true;
	
	/*
	var firstRendered = trans.grid.rowOffset()+3;
	var renderedCount = trans.grid.countRenderedRows()-3;
	var margin = 4;
	
	
	if (row <= renderedCount-margin) return false;
	
	var center = row-Math.round(renderedCount/2);
	
	if (row >= firstRendered+renderedCount-margin) {
		trans.grid.scrollViewportTo(center, col);
	}
	return true;
	*/
	
}

ui.disableGrid = function(state) {
	if (typeof state == 'undefined') {
		state = !$("#gridDisabler").hasClass("hidden");
	}
	
	
	if (state) {
		$("#gridDisabler").removeClass("hidden");
		var panRight= $(".panel-right");
		var thisHeight 	= panRight.outerHeight();
		var thisWidth 	= panRight.outerWidth();
		var thisTop = panRight.offset().top;
		var thisLeft = panRight.offset().left;
		var disabler = $("#gridDisabler");
		disabler.css("width", thisWidth);
		disabler.css("height", thisHeight);
		disabler.css("top", thisTop);
		disabler.css("left", thisLeft);	
		
		ui.timers.gridDisabler = undefined;
			
		$(window).on("resize.gridDisabler", function() {
			if (ui.timers.gridDisabler) clearTimeout(ui.timers.gridDisabler);
			ui.timers.gridDisabler = setTimeout(function() {
				var panRight= $(".panel-right");
				var thisHeight 	= panRight.outerHeight();
				var thisWidth 	= panRight.outerWidth();
				var thisTop = panRight.offset().top;
				var thisLeft = panRight.offset().left;
				var disabler = $("#gridDisabler");
				disabler.css("width", thisWidth);
				disabler.css("height", thisHeight);
				disabler.css("top", thisTop);
				disabler.css("left", thisLeft);	
				ui.timers.gridDisabler = undefined;
			}, 250);
		});
	} else {
		$("#gridDisabler").addClass("hidden");
		$(window).off("resize.gridDisabler");		
	}
	
}
/**
 * Disable buttons when no project is currently oppened
 */
ui.disableButtons = function() {
	$(".menu-button.button-save").prop("disabled", true)
	$(".menu-button.button-save-as").prop("disabled", true)
	$(".menu-button.button-export").prop("disabled", true)
	$(".menu-button.button-inject").prop("disabled", true)
	$(".menu-button.batch-translate").prop("disabled", true)
	$(".menu-button.contextTool").prop("disabled", true)
	$(".menu-button.button-properties").prop("disabled", true)

	$(".menu-button.addNewKey").prop("disabled", true)
	$(".menu-button.importHere").prop("disabled", true)
	$(".menu-button.filePropertiesMenu").prop("disabled", true)
	$(".menu-button.addNote").prop("disabled", true)
	$(".menu-button.find").prop("disabled", true)
	$(".menu-button.removeTranslation").prop("disabled", true)
	$(".menu-button.removeFile").prop("disabled", true)

	$("#table").addClass("hidden");
}

ui.enableButtons = function() {
	$(".menu-button.button-save").prop("disabled", false)
	$(".menu-button.button-save-as").prop("disabled", false)
	$(".menu-button.button-export").prop("disabled", false)
	$(".menu-button.button-inject").prop("disabled", false)
	$(".menu-button.batch-translate").prop("disabled", false)
	$(".menu-button.contextTool").prop("disabled", false)
	$(".menu-button.button-properties").prop("disabled", false)

	$(".menu-button.addNewKey").prop("disabled", false)
	$(".menu-button.importHere").prop("disabled", false)
	$(".menu-button.filePropertiesMenu").prop("disabled", false)
	$(".menu-button.addNote").prop("disabled", false)
	$(".menu-button.find").prop("disabled", false)
	$(".menu-button.removeTranslation").prop("disabled", false)
	$(".menu-button.removeFile").prop("disabled", false)

	$("#table").removeClass("hidden");

}

ui.showBusyOverlay = function() {
	ui.appIsBusy = true;
	$("#busyOverlay").removeClass("hidden");
}
ui.hideBusyOverlay = function() {
	ui.appIsBusy = false;
	$("#busyOverlay").addClass("hidden");
}


ui.getFirstVisibleRow = function() {
	var $header = $("#table .ht_clone_top_left_corner")
	var visibleTop = $header.offset().top + $header.outerHeight();
	var $rows = $(".ht_master .htCore tbody tr");
	for (var i=0; i<$rows.length; i++) {
		var rowsBottom = $rows.eq(i).offset().top+$rows.eq(i).outerHeight();
		if (rowsBottom >= visibleTop) {
			var coords = trans.grid.getCoords($rows.eq(i).find("td").eq(0)[0]);
			return coords.row;
		}
	}
}

ui.getFirstFullyVisibleRow = function() {
	var $header = $("#table .ht_clone_top_left_corner")
	var visibleTop = $header.offset().top + $header.outerHeight();
	var $rows = $(".ht_master .htCore tbody tr");
	for (var i=0; i<$rows.length; i++) {
		var rowsTop = $rows.eq(i).offset().top;
		if (rowsTop >= visibleTop) {
			var coords = trans.grid.getCoords($rows.eq(i).find("td").eq(0)[0]);
			return coords.row;
		}
	}
}

ui.getLastFullyVisibleRow = function() {
	var $table = $("#table")
	var visibleBottom = $table.offset().top + $table.height();
	var $rows = $(".ht_master .htCore tbody tr");
	for (var i=$rows.length-1; i>=0; i--) {
		var rowsBottom = $rows.eq(i).offset().top+$rows.eq(i).outerHeight();
		if (visibleBottom >= rowsBottom) {
			var coords = trans.grid.getCoords($rows.eq(i).find("td").eq(0)[0]);
			return coords.row;
		}
	}
}

ui.getLastVisibleRow = function() {
	var $table = $("#table")
	var visibleBottom = $table.offset().top + $table.height();
	var $rows = $(".ht_master .htCore tbody tr");
	for (var i=$rows.length-1; i>=0; i--) {
		var rowsBottom = $rows.eq(i).offset().top;
		if (visibleBottom >= rowsBottom) {
			var coords = trans.grid.getCoords($rows.eq(i).find("td").eq(0)[0]);
			return coords.row;
		}
	}
}

ui.isRowVisible = function(row) {
	var first = ui.getFirstVisibleRow();
	var last = ui.getLastVisibleRow();
	
	return (row>=first && row<=last);
	
}

ui.generateColSelector = function(options) {
	options = options||{};
	options.data = options.data||window.trans;
	options.onNoSelection = options.onNoSelection|| function() {};
	options.onHasSelection = options.onHasSelection|| function() {};
	options.skipFirstCol = options.skipFirstCol||false;
	
	if (typeof options.data.colHeaders == 'undefined') return $("<select></select>");
	var thisColHeader = options.data.colHeaders;
	console.log(thisColHeader);
	var $select = $("<select></select>");
	for (var i=0; i<thisColHeader.length; i++) {
		if (i==0 && options.skipFirstCol) continue;
		$select.append("<option value='"+i+"'>"+thisColHeader[i]+"</option>");
	}

	return $select;
}

ui.generateColMultiSelector = function(options) {
	options = options||{};
	options.data = options.data||window.trans;
	options.onNoSelection = options.onNoSelection|| function() {};
	options.onHasSelection = options.onHasSelection|| function() {};
	options.skipFirstCol = options.skipFirstCol||false;
	
	if (typeof options.data.colHeaders == 'undefined') return $("<select></select>");
	var thisColHeader = options.data.colHeaders;
	console.log(thisColHeader);
	var $select = $("<select multiple='multiple' class='multiple'></select>");
	for (var i=0; i<thisColHeader.length; i++) {
		if (i==0 && options.skipFirstCol) continue;
		$select.append("<option value='"+i+"'>"+thisColHeader[i]+"</option>");
	}

	return $select;
}



ui.drawFileSelector = function(data, $target, options) {
	console.log("entering : ui.drawFileSelector");
	data = data || trans.project || {};
	options = options||{};
	options.onNoSelection = options.onNoSelection|| function() {};
	options.onHasSelection = options.onHasSelection|| function() {};
	options.filePath = options.filePath || "";
	options.defaultSelection = options.defaultSelection || [];
	options.defaultSelectionMode = options.defaultSelectionMode||"";
	
	if (Array.isArray(options.defaultSelection) == false) options.defaultSelection = [options.defaultSelection];
	
	var selectorTitle = options.filePath;
	console.log($target);
	if (typeof data.project.files == 'undefined') return false;
	if ($target.length == 0) return false;
	$target.addClass("fileSelector");
	$target.addClass("rendered");
	$target.empty();
	$target.append("<div class='fileSelectorHeader icon-doc-inv'>"+selectorTitle+"</div>\
					<div class='fileSelectorBody'></div>\
					<div class='fileSelectorOptions fileSelectorFooter' ><form>\
						<button class='fileSelectorAction actionSelectAll'>"+t("全选")+"</button>\
						<button class='fileSelectorAction actionSelectNone'>"+t("选择无")+"</button>\
						<button class='fileSelectorAction actionSelectInvert'>"+t("倒转")+"</button>\
						<button class='fileSelectorAction actionSelectMatch'>"+t("匹配目的地选择")+"</button>\
						<span class='info icon-info-circled'>"+t("使用鼠标拖动进行批量选择")+"</span>\
					</form></div>");
	
	//var $selectAll = $target.find(".fileSelectorOptions .selectAll");
	$target.find("form").on("submit", function(e) {
		e.preventDefault();
	})
	$target.find(".actionSelectAll").on("click", function(e) {
		$(this).closest(".fileSelector").find(".fileSelectorBody .filename").prop("checked", true);
	});
	$target.find(".actionSelectNone").on("click", function(e) {
		$(this).closest(".fileSelector").find(".fileSelectorBody .filename").prop("checked", false);
	});
	$target.find(".actionSelectInvert").on("click", function(e) {
		$(this).closest(".fileSelector").find(".fileSelectorBody .filename").each(function() {
			$(this).prop("checked", !$(this).prop("checked"));
		});
	});
	$target.find(".actionSelectMatch").on("click", function(e) {
		$(this).closest(".fileSelector").find(".fileSelectorBody .filename").prop("checked", false);
		var targetSelection = options.defaultSelection || [];

		if (targetSelection.length < 0) {
			targetSelection = trans.getCheckedFiles() || [];
		}
		
		console.log("targetSelection", targetSelection);
		
		var $selectorBody = $(this).closest(".fileSelector").find(".fileSelectorBody");
		for (var i=0; i<targetSelection.length; i++  ) {
			$selectorBody.find("input[type=checkbox][value='"+CSS.escape(targetSelection[i])+"']").prop("checked", true);
		}
	});
	
		
	var content = $target.find(".fileSelectorBody");
	for (var file in data.project.files) {
		var checkbox = $("<input type='checkbox' class='filename' value='"+file+"' />");
		if (options.defaultSelection.includes(file)) checkbox.prop("checked", true);
		checkbox.on("change", function() {
			var selected = $(this).closest(".fileSelectorBody").find(".filename:checked");
			if (selected.length < 1) {
				options.onNoSelection.call($(this));
			} else {
				options.onHasSelection.call($(this));
			}
		});
		var template = $("<label class='fileSelectorLabel' title='"+file+"'><span>"+data.project.files[file].filename+"</span><label>");
		template.prepend(checkbox);
		content.append(template);
	}
	
	if (typeof data.project.references !== 'undefined') {
		for (var file in data.project.references) {
			var checkbox = $("<input type='checkbox' class='filename' value='"+file+"' />");
			if (options.defaultSelection.includes(file)) checkbox.prop("checked", true);
			checkbox.on("change", function() {
				var selected = $(this).closest(".fileSelectorBody").find(".filename:checked");
				if (selected.length < 1) {
					options.onNoSelection.call($(this));
				} else {
					options.onHasSelection.call($(this));
				}
			});
			var template = $("<label class='fileSelectorLabel' title='"+file+"'><span>"+data.project.references[file].filename+"</span><label>");
			template.prepend(checkbox);
			content.append(template);
		}
		
	}
	
	if (options.defaultSelectionMode == 'none') {
		$target.find(".actionSelectNone").trigger("click");
	} else if (options.defaultSelectionMode == 'all'){
		$target.find(".actionSelectAll").trigger("click");
	} else if (options.defaultSelectionMode == 'match'){
		$target.find(".actionSelectMatch").trigger("click");
	}
	//$selectAll.trigger("change");
	
	//console.log("target : ", $target, $target[0]);
	var DragSelect = DragSelect||require("dragselect");
	ui.ds = new DragSelect({
	  selectables: $target.find(".fileSelectorBody")[0].getElementsByClassName('fileSelectorLabel'),
	  autoScrollSpeed: 15,
	  area :$target.find(".fileSelectorBody")[0],
	  callback : function(elm) {
			//console.log("Selected element : ", $(elm));
			var $elm = $(elm);
			// ignore selection if selecting less than 2 row
			if ($elm.length <= 1) return false; 
			$elm.each(function() {
				var $input = $(this).find("input");
				console.log("input : ", $input);
				$(this).removeClass("ds-hover");
				$input.prop("checked", true)
				$input.trigger("change");
				ui.ds.clearSelection();
			})
	  }
	});		
	return $target;
}

ui.openImportTrans = function(filePath, options) {
	/*
	options {
		mode : 0/1 => import translation or object
	}
	example : {mode:1, defaultSelection:["Common Reference"]}
	*/
	options = options || {};
	options.mode = options.mode || 0;
	options.defaultSelectionMode = options.defaultSelectionMode || "";
	options.defaultSelection = options.defaultSelection || [];
	if (options.defaultSelection.length == 0) options.defaultSelection = trans.getCheckedFiles();
	
	console.log("Opening : "+filePath);
	var doOpenImportTrans = function(filePath, data) {
		console.log(filePath);
		if ($("#dialogImportTrans").hasClass("initialized") == false) {
			$("#dialogImportTrans").dialog({
				autoOpen: false,
				modal:true,
				minWidth:480,
				minHeight:320,
				width:Math.round($(window).width()/100*80),
				height:Math.round($(window).height()/100*80),				
				show: {
					effect: "fade",
					duration: 200
				},
				hide: {
					effect: "fade",
					duration: 200
				},
				buttons: [
					{
						text: "取消",
						//icon: "ui-icon-heart",
						click: function() {
							$(this).dialog( "close" );
						}
					},
					{
						text: "导入",
						//icon: "ui-icon-heart",
						click: function() {
							var mode =  $("#dialogImportTrans input[name='importMode']:checked"). val();
							var options = $("#dialogImportTrans").data("options");
							if (mode == 0) {
								var $elm=$(this).find(".selectorBody[data-if='0']");
								// import translation
								var selectedCell = [];
								//if ($("#dialogImportTrans .fileSelectorHeader .selectAll").prop("checked") == false) {
									var checkedElm = $("#dialogImportTrans .fileSelectorBody .filename:checked");
									for (var x=0; x<checkedElm.length; x++) {
										selectedCell.push(checkedElm.eq(x).attr("value"));
									}
								//}
								var targetFiles = options.defaultSelection||[];
								//if ($("#dialogImportTrans .destinationFile .targetAllFiles").prop("checked") == false) {
								if (targetFiles.length == 0) {
									targetFiles = trans.getCheckedFiles();
								}
								
								var fileData = $("#dialogImportTrans").data("data");
								trans.importTranslation(fileData,
								{
									targetColumn	: $elm.find(".selectRow select").val(),
									overwrite		: $elm.find(".overwriteTarget").prop("checked"),
									files 			: selectedCell,
									destination 	: targetFiles,
									compareMode		: $elm.find(".compareMode").val()
								});
							} else if (mode == 1)  {
								// import object
								console.log("generating target pair");
								var targetPair = {};
								var checkedElm = $("#dialogImportTrans .fileSelectorBody .filename:checked");
								for (var x=0; x<checkedElm.length; x++) {
									targetPair[checkedElm.eq(x).attr("value")] = true;
								}
								var filePath = $("#dialogImportTrans").data("filePath");
								console.log("target pair : ", targetPair);
								console.log("file path is : ", filePath);
								
								//return true;
								trans.importFromFile(filePath, {
									targetPair: targetPair,
									mergeData : $("#dialogImportTrans .mergeData").prop("checked")
								});
							} else if (mode == 2) {
								var $elm=$(this).find(".selectorBody[data-if='2']");
								// import translation
								var selectedCell = [];
								var checkedElm = $("#dialogImportTrans .fileSelectorBody .filename:checked");
								for (var x=0; x<checkedElm.length; x++) {
									selectedCell.push(checkedElm.eq(x).attr("value"));
								}

								var targetFiles = options.defaultSelection||[];
								if (targetFiles.length == 0) targetFiles = trans.getCheckedFiles();
								
								var fileData = $("#dialogImportTrans").data("data");
								trans.importTranslation(fileData,
								{
									targetColumn	: $elm.find(".selectRow select").val(),
									overwrite		: $elm.find(".overwriteTarget").prop("checked"),
									files 			: selectedCell,
									destination 	: targetFiles,
									compareMode		: parseInt($elm.find(".compareMode").val())
								});
							}
							
							// clearing data
							$("#dialogImportTrans").data("data", {});
							$(this).dialog( "close" );
							
						}
					}
				]
			});	
			$("#dialogImportTrans").addClass("initialized");
			
			$("#dialogImportTrans .ImportTransImportMode").on("input", function() {
				console.log("change tab", $(this));
				if ($(this).prop("checked") == false) return false;
				var $tabObj = $(this).closest(".tabWrapper")
				var $targetObj = $tabObj.find(".selectorBody[data-if='"+CSS.escape($(this).val())+"']");
				if ($targetObj.length == 0) return false;
				$tabObj.find(".selectorBody").addClass("hidden");
				$targetObj.removeClass("hidden");
			});
		}
		
		
		if (options.defaultSelection.length > 1) {
			$("#dialogImportTrans").find(".destinationList").html(options.defaultSelection.length+"选定的对象。")
		} else {
			$("#dialogImportTrans").find(".destinationList").html(options.defaultSelection)
		}
		
		$("#dialogImportTrans").data("filePath", filePath);
		$("#dialogImportTrans").data("options", options);
		$("#dialogImportTrans").data("data", data);
		$("#dialogImportTrans").dialog("open");
		//$("#dialogImportTrans").find(".selectorBody[value='"+options.mode+"']").prop("checked", true).trigger("input");
		$("#dialogImportTrans").find(".ImportTransImportMode[value='"+CSS.escape(options.mode)+"']").prop("checked", true).trigger("input");
		return $("#dialogImportTrans");	
	}
	
	trans.loadJSON(filePath, {
		onSuccess: function(data) {
			data = trans.validateTransData(data)
			
			console.log("Loaded data : ");
			console.log(data);
			
			ui.drawFileSelector(data, $("#dialogImportTrans .fileSelectorWrapper"), {
				onNoSelection:function() {
					$(".ui-dialog[aria-describedby=dialogImportTrans] .ui-dialog-buttonpane button").eq(1).button("disable");					
				},
				onHasSelection:function() {
					$(".ui-dialog[aria-describedby=dialogImportTrans] .ui-dialog-buttonpane button").eq(1).button("enable");
				},
				filePath:filePath,
				defaultSelection: options.defaultSelection,
				defaultSelectionMode: options.defaultSelectionMode
			});
			$("#dialogImportTrans .selectRow").empty();
			ui.generateColSelector({
				skipFirstCol:true
			}).appendTo($("#dialogImportTrans .selectRow"));
			
			if ($("#dialogImport").hasClass("initialized")) {
				if ($("#dialogImport").dialog( "isOpen" )) {
					$("#dialogImport").off( "dialogclose");
					$("#dialogImport").on( "dialogclose", function( event, ui ) {
						console.log("closing import dialog");
						$("#dialogImport").off( "dialogclose");
						doOpenImportTrans(filePath, data);
					});
					
					$("#dialogImport").dialog( "close" );
				} else {
					doOpenImportTrans(filePath, data);
				}
			} else {
				doOpenImportTrans(filePath, data);
			}
		}
	});
}

ui.openImportDialog = function() {
	ui.importDialogOnClose = function() {};
	if ($("#dialogImport").hasClass("initialized") == false) {
		$("#dialogImport").dialog({
			autoOpen: false,
			modal:true,
			minWidth:480,
			minHeight:320,
			maxWidth:640,
			maxHeight:420,
			show: {
				effect: "fade",
				duration: 200
			},
			hide: {
				effect: "fade",
				duration: 200
			}
		});	
		$("#dialogImport").addClass("initialized");
	}
	
	$("#dialogImport").dialog("open");
	return $("#dialogImport");	
}

ui.openInjectDialog = function(options) {
	options = options || {};
	var $dialogInject = $("#dialogInject");
	// reset
	$dialogInject.find(".sourceDir").removeClass("hidden");
	$dialogInject.find(".targetDir").removeClass("hidden");
	$dialogInject.find(".targetExe").addClass("hidden");
	$dialogInject.find(".copyOptionsBlock").addClass("hidden");
		
	engines.handler('onOpenInjectDialog').call(this, $dialogInject, options);
	$(document).trigger("beforeOpenInjectDialog", options);

	console.log("openInjectDialog, options : ", options);
	
	var tags = new UiTags();
	this._uiTags = tags;
	$dialogInject.find(".colorTagSelector").empty();
	$dialogInject.find(".colorTagSelector").append(tags.element);
	
	
	if ($dialogInject.find(".targetExe").is(":visible")) {
		$dialogInject.find(".targetDir").addClass("hidden");
	
	}


	var getSelectedFiles = function() {
		if (options.files) return options.files;
		return false;
	}

	if ($dialogInject.hasClass("initialized") == false) {
		$dialogInject.dialog({
			autoOpen: false,
			modal:true,
			minWidth:600,
			minHeight:420,
			show: {
				effect: "fade",
				duration: 200
			},
			hide: {
				effect: "fade",
				duration: 200
			},
			buttons: [
					{
						text: t("取消"),
						//icon: "ui-icon-heart",
						click: function() {
							$(this).dialog( "close" );
						}
					},
					{
						text: t("应用翻译"),
						//icon: "ui-icon-heart",
						click: function() {
							// do apply translation
							var targetPath = "";
							var $sourceField = $("#injectSourceMaterial");
							if ($sourceField.is(":visible")) {
								targetPath = $sourceField.val();
								var exist = common.isExist($sourceField.val());
								if (!exist) {
									$(".sourceMaterialTooltip").removeClass("hidden");
									return;
								}
							}

							
							var destinationPath = "";
							if ($dialogInject.find(".targetDir").is(":visible")) {
								var $destField = $("#injectDestFolder");
								destinationPath = $destField.val()
							}
							
							if ($dialogInject.find(".targetExe").is(":visible")) {
								var $destField = $("#injectDestExe");
								destinationPath = $destField.val()
							}

							if (destinationPath == "") {
								$(".injectDestFolderTooltip").removeClass("hidden");
								return;
							}
							
							
							// tagging
							/*
							var thisOptions = 	{
											filterTag:tags,
											filterTagMode:filterTagMode 
										}
							*/
							var thisOptions = ui._uiTags.getValue();
							if (thisOptions === false) return false;
							thisOptions.files = getSelectedFiles();
							thisOptions.copyOptions = $dialogInject.find(".copyOptions").val();
							//return console.log("debug halt");
							trans.applyTranslation.start(destinationPath, targetPath, thisOptions)
							$(this).dialog( "close" );
						}
					}
				]
		});	
		
		$dialogInject.find("#injectSourceMaterial").on("change", function() {
			trans.project.loc = $(this).val()
		})
		$dialogInject.find("#injectDestFolder").on("change", function() {
			trans.project.devPath = $(this).val()
		})
		
		
		$dialogInject.addClass("initialized");
	}
	
	
	$(".sourceMaterialTooltip").addClass("hidden");
	
	$dialogInject.find("form").on("submit", function(e) {
		console.log("prevent submit");
		e.preventDefault()
	})
	
	if ($dialogInject.find("#injectSourceMaterial").data("projectId") != trans.project.projectId) {
		$dialogInject.find("#injectSourceMaterial").data("projectId", trans.project.projectId);
		//if ($dialogInject.find("#injectSourceMaterial").val() == "") $dialogInject.find("#injectSourceMaterial").val(trans.project.loc)
		$dialogInject.find("#injectSourceMaterial").val(trans.project.loc);
	}
	
	$dialogInject.find("#injectDestFolder").val(trans.project.devPath)
	$dialogInject.dialog("open");
	
	if ($dialogInject.find(".targetExe").is(":visible")) {
		try {
			$dialogInject.find("[name=injectDestExe]").val(trans.project.options.executable || "")
		} catch (e) {}	
	}		
	
	return $dialogInject;	
}


ui.openImportSpreadsheetDialog = function() {
	ui.importDialogOnClose = function() {};
	if ($("#dialogImportSpreadsheet").hasClass("initialized") == false) {
		ui.generateColSelector({
			skipFirstCol:true
		}).appendTo($("#dialogImportSpreadsheet .targetCol"));	

		$("#dialogImportSpreadsheet .importSpreadsheetPathType").on("click", function() {
			$(this).closest(".importSpreadsheetPathTypeWrapper").find("label").removeClass("active");
			$(this).closest("label").addClass("active");
			var notActive = $(this).closest(".importSpreadsheetPathTypeWrapper").find("label").not(".active");
			notActive.find(".importSpreadsheet").val("");
			notActive.find(".importSpreadsheet").data("files", []);
			notActive.find(".selectedFileRemark").html("");
			$(this).closest("label").find(".importSpreadsheet").trigger("click");
		});
		
		$("#dialogImportSpreadsheet .importSpreadsheet").on("input", function() {
			var $this = $(this);
			var text = "";
			$this.data("files", $this.val().split(";"))
			if ( $this.data("files").length > 1) {
				$this.closest("label").find(".selectedFileRemark").html($this.data("files").length+"选定的对象。");
			} else {
				$this.closest("label").find(".selectedFileRemark").html($this.val());
			}
			
		});
		
		$("#dialogImportSpreadsheet").dialog({
			autoOpen: false,
			modal:true,
			minWidth:640,
			minHeight:480,
			show: {
				effect: "fade",
				duration: 200
			},
			hide: {
				effect: "fade",
				duration: 200
			},buttons: [
					{
						text: t("取消"),
						//icon: "ui-icon-heart",
						click: function() {
							$(this).dialog( "close" );
						}
					},
					{
						text: t("导入"),
						//icon: "ui-icon-heart",
						click: function() {
							var selectedFiles = $("#dialogImportSpreadsheet .importSpreadsheetPathTypeWrapper label.active .importSpreadsheet").data("files");
							
							if (typeof selectedFiles == 'undefined' || selectedFiles == '' || selectedFiles.length == 0) return alert("请选择一个文件/文件夹");

							
							var columns = $("#dialogImportSpreadsheet .targetCol select").val();
							var targetFiles  = trans.getCheckedFiles();
							if (targetFiles.length == 0) targetFiles = trans.getAllFiles();
							
							var options = {
									overwrite: $("#dialogImportSpreadsheet .overwriteTarget").prop("checked"),
									files:targetFiles
								}
							$(this).dialog( "close" );								
							var delay = setTimeout( function() {
									trans.importSheet(selectedFiles, columns, options);	
								}, 300);
							

						}
					}
				]
			});	
		$("#dialogImportSpreadsheet").addClass("initialized");
	}
	
	$("#dialogImportSpreadsheet").dialog("open");
	return $("#dialogImportSpreadsheet");	
}

ui.openImportRPGMTransDialog = function() {
	ui.importDialogOnClose = function() {};
	if ($("#dialogImportRPGMTrans").hasClass("initialized") == false) {
		ui.generateColSelector({
			skipFirstCol:true
		}).appendTo($("#dialogImportRPGMTrans .targetCol"));	

		$("#dialogImportRPGMTrans .importRPGMTransPathType").on("click", function() {
			$(this).closest(".importRPGMTransPathTypeWrapper").find("label").removeClass("active");
			$(this).closest("label").addClass("active");
			var notActive = $(this).closest(".importRPGMTransPathTypeWrapper").find("label").not(".active");
			notActive.find(".importRPGMTrans").val("");
			notActive.find(".importRPGMTrans").data("files", []);
			notActive.find(".selectedFileRemark").html("");
			$(this).closest("label").find(".importRPGMTrans").trigger("click");
		});
		
		$("#dialogImportRPGMTrans .importRPGMTrans").on("input", function() {
			var $this = $(this);
			var text = "";
			$this.data("files", $this.val().split(";"))
			if ( $this.data("files").length > 1) {
				$this.closest("label").find(".selectedFileRemark").html($this.data("files").length+"选定的对象。");
			} else {
				$this.closest("label").find(".selectedFileRemark").html($this.val());
			}
			
		});
		
		$("#dialogImportRPGMTrans").dialog({
			autoOpen: false,
			modal:true,
			minWidth:640,
			minHeight:480,
			show: {
				effect: "fade",
				duration: 200
			},
			hide: {
				effect: "fade",
				duration: 200
			},buttons: [
					{
						text: t("取消"),
						//icon: "ui-icon-heart",
						click: function() {
							$(this).dialog( "close" );
						}
					},
					{
						text: t("导入"),
						//icon: "ui-icon-heart",
						click: function() {
							var selectedFiles = $("#dialogImportRPGMTrans .importRPGMTransPathTypeWrapper label.active .importRPGMTrans").data("files");
							
							if (typeof selectedFiles == 'undefined' || selectedFiles == '' || selectedFiles.length == 0) return alert("请选择一个文件/文件夹");

							
							var columns = $("#dialogImportRPGMTrans .targetCol select").val();
							var targetFiles  = trans.getCheckedFiles();
							if (targetFiles.length == 0) targetFiles = trans.getAllFiles();
							
							var options = {
									overwrite: $("#dialogImportRPGMTrans .overwriteTarget").prop("checked"),
									files:targetFiles
								}
							$(this).dialog( "close" );								
							var delay = setTimeout( function() {
									trans.importRPGMTrans(selectedFiles, columns, options);	
								}, 300);
							

						}
					}
				]
			});	
		$("#dialogImportRPGMTrans").addClass("initialized");
	}
	
	$("#dialogImportRPGMTrans").dialog("open");
	return $("#dialogImportRPGMTrans");	
}



ui.openExportDialog = function(options) {
	options = options || {};
	if ($("#dialogExport").hasClass("initialized") == false) {
		$("#dialogExport").dialog({
			autoOpen: false,
			modal:true,
			minWidth:480,
			minHeight:320,
			maxWidth:640,
			maxHeight:420,			
			show: {
				effect: "fade",
				duration: 200
			},
			hide: {
				effect: "fade",
				duration: 200
			}
		});	
		$("#dialogExport").addClass("initialized");
	}
	$("#dialogExport").data("options", options);
	$("#dialogExport").dialog("open");
	return $("#dialogExport");
}

ui.closeExportDialog = function() {
	if ($("#dialogExport").hasClass("initialized")) {
		$("#dialogExport").dialog("close");
	}
}

ui.dialogProjectIsExist = function(existedData, options) {
	existedData = existedData||[];
	console.log(arguments);
	options = options||{};

	
	var thisTitle = existedData[0]['title'];
	$("#dialogProjectIsExist").find(".dialogGameTitle").html(thisTitle);
	
	$("#dialogProjectIsExist .existedCache").empty();
	
	for (var i=0; i<existedData.length; i++) {
		var template   = $("<li class='cacheItem'><ul></ul><div class='projectIsExistAction'></div></li>");
		var openButton = $("<button class='openButton'>打开这个</button>").on("click", function(e) {
			var that = $(this);
			$("#dialogProjectIsExist").dialog("close");
			trans.procedureCreateProject(options.gameFolder, {
				force:"",
				projectInfo:that.closest(".cacheItem").data("data")
			});
		});
		var openButton2 = $("<button class='openButton'>"+t("从此缓存重建转换表")+"</button>").on("click", function(e) {
			var that = $(this);
			$("#dialogProjectIsExist").dialog("close");
			trans.procedureCreateProject(options.gameFolder, {
				force:"true",
				projectInfo:that.closest(".cacheItem").data("data")
			});
		});
		template.find(".projectIsExistAction").append(openButton);
		template.find(".projectIsExistAction").append(openButton2);
		template.data("data", existedData[i]);
		
		if ( existedData[i]['title'] ==  existedData[i]['Title']) delete(existedData[i]['Title']);
			
		for (var part in existedData[i]) {
			$locTemplate= $("<li><label title='"+part+"'>"+part+"</label></span>"+existedData[i][part]+"</span></li>");
			template.find("ul").append($locTemplate);
		}
		$("#dialogProjectIsExist .existedCache").append(template);
	}

	
	if ($("#dialogProjectIsExist").hasClass("initialized") == false) {
		$("#dialogProjectIsExist").dialog({
			autoOpen: false,
			modal:true,
			width:Math.round($(window).width()/100*80),
			height:Math.round($(window).height()/100*80),
			minWidth:600,
			minHeight:420,

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
					text: t("创建新项目"),
					icon: "ui-icon-plus",
					click: function() {
						$(this).dialog( "close" );
						console.log("begin creating new project");
						trans.procedureCreateProject(options.gameFolder, {
							force:true
						});
						
					}
				},
				{
					text: t("取消"),
					icon: "ui-icon-close",
					click: function() {
						$(this).dialog( "close" );
					}
				}
			]
		});	
		$("#dialogProjectIsExist").addClass("initialized");
	}
	
	$("#dialogProjectIsExist").dialog("open");
	return ($("#dialogProjectIsExist"));
}



// ==============================================================
// LOADING BAR
// ==============================================================

// Table Corner
ui.tableCornerShowLoading = function() {
	ui._cache = ui._cache || {};
	if (typeof ui._cache.$tppLoader == 'undefined') {
		ui._cache.$tppLoader = $('<img src="img/tpp-loading-inv.svg" class="tableCornerLoading tppLoader" style="height:22px; max-height:22px" alt="">')
	}
	$(".colHeader.cornerHeader").html(ui._cache.$tppLoader);
}
ui.tableCornerHideLoading = function() {
	$(".colHeader.cornerHeader").html(" ");
}

ui.showLoading = function(options) {
	/*
	options.buttons = [{
		text: "text to display",
		onClick : function
	}]
	*/
	options = options||{};
	options.buttons = options.buttons||[];
	
	$("#applicationBar .appActionsLeft").hide();
	
	
	// autofix direct options.buttons object
	if (Array.isArray(options.buttons) == false) {
		if (typeof options.buttons.text !== "undefined") options.buttons = [options.buttons];
	}
	ui.consoleIsShown = true;
	$("#loadingOverlay .console").empty();
	$("#loadingOverlay .loadingBarProgress").empty();
	//$("#loadingOverlay .console").addClass("stickToBottom");
	$("#loadingOverlay .loadingBarProgress").removeClass("stopped");
	$("#loadingOverlay .loadingBarProgress").removeClass("error");
	
	$(".loadingBarButtons").empty();
	for (var i=0; i<options.buttons.length; i++) {
		var thisButton = $("<a href='#'>"+options.buttons[i].text+"</a>");
		if (typeof options.buttons[i].onClick == 'function') {
			thisButton.data("onClick", options.buttons[i].onClick)
			
			thisButton.on("click", function(e) {
				$(this).data("onClick").call(this);
			});
		}
		
		$(".loadingBarButtons").append(thisButton);
	}
	
	
	if ($("#loadingOverlay").hasClass("initialized") == false) {
		$("#loadingOverlay").addClass("initialized");
		ui.loadingInit();
	}
	
	ui.appBarTheme("dark");
	$("#loadingOverlay").removeClass("hidden");
	$(document).trigger("showLoading");

	ui.log("日志开始了！");
	ui._logTimeStart = Date.now();
	if (nw.process.versions["nw-flavor"] == "sdk") ui.log(t("您可以在控制台日志（F12）上查看更详细的信息"));
	

	return $("#loadingOverlay");
}

ui.hideLoading = function(destroy) {
	ui.consoleIsShown = false;
	destroy = destroy||false;
	$("#loadingOverlay .loadingStatus").text("");
	
	if (destroy) {
		$("#loadingOverlay .console").empty();
	}
	$("#loadingOverlay").addClass("hidden");
	ui.appBarTheme("");
	$("#applicationBar .appActionsLeft").show();
	
	$(document).trigger("hideLoading");

	return $("#loadingOverlay");
}
ui.loadingClearButton = function() {
	$(".loadingBarButtons").empty();
}

ui.showCloseButton = function(options) {
	options=options||{};
	
	var $loadingBarBtn = $(".loadingBarButtons");
	if ($loadingBarBtn.find(".closeButton").length > 0) return;

	var thisButton = $("<a class='closeButton icon-cancel-1' href='#'>"+t("关闭")+"</a>");
	thisButton.on("click", function(e) {
		ui.hideLoading.call(this, true);
		ui.loadingClearButton();
	});
	
	$loadingBarBtn.append(thisButton);	
}

ui.showOpenCacheButton = function(target, options) {
	options=options||{};
	if (typeof target == 'undefined') return false;
	$(".loadingBarButtons").find(".openCache").remove();
	var thisButton = $("<a href='#' class='openCache icon-folder-open'>开放缓存</a>");
	thisButton.on("click", function(e) {
		//var thisTmpPath = str_ireplace("\\", "\\\\", target);
		//console.log("running command : \r\n"+'explorer "'+thisTmpPath+'"');
		require('child_process').exec('explorer "'+target+'"' , function (err, stdout, stderr) { console.log("Explorer opened") });
	});
	
	$(".loadingBarButtons").append(thisButton);		
}

ui.LoadingAddButton = function(text, onClick, options) {
	options=options||{};
	options.class=options.class||"";
	
	if (typeof text == 'undefined') return false
	if (typeof onClick !== 'function') onClick = function(){};
	text = text||"";
	options.a = options.a||"#";
	
	
	var thisButton = $("<a class='"+options.class+"' href='"+options.a+"'>"+text+"</a>");
	thisButton.on("click", function(e) {
		onClick.call(this);
	});
	
	$(".loadingBarButtons").append(thisButton);	
	return thisButton;
}


ui.stickToBottom = function($elm) {
	if ($elm.length == 0) return $elm;
	console.log($elm[0].scrollTop+"+"+$elm.height()+" >= "+$elm[0].scrollHeight);
	if (($elm[0].scrollTop+$elm.height() >= $elm[0].scrollHeight)) {
		$elm[0].scrollTop=$elm[0].scrollHeight;
	}
	return $elm;
}

ui.loadingProgress = async function(percent, status, options) {
	/*
	options.mode = consoleOutput -> no pre wrapper
	*/
	var $loading 		= $("#loadingOverlay");
	options 			= options||{};
	options.consoleOnly = options.consoleOnly||false;
	options.mode 		= options.mode||"";
	options.classStr 	= options.classStr||"";
	if (typeof percent == 'string') {
		//$loading.find(".loadingBarProgress").css("width", 100+"%");
		$loading.find(".loadingBarProgress").css("left", "0%");
		$loading.find(".loadingBarOverlay").text(percent);
	} else if (typeof percent !== 'undefined') {
		percent = percent||0;
		percent = Math.round(percent);
		//$loading.find(".loadingBarProgress").css("width", percent+"%");
		$loading.find(".loadingBarProgress").css("left", (-100+percent)+"%");
		$loading.find(".loadingBarOverlay").text(percent+"%");
	} 
	
	var classStr = "";
	if (Boolean(options.classStr)) {
		classStr = ' class="'+options.classStr+'"';
	}
	
	
	if (typeof status !== "undefined") {
		if (options.consoleOnly == false) {
			$loading.find(".loadingStatus").text(status);
		}
		var console = $("#loadingOverlay .console");
		
		if (options.mode == "consoleOutput") {
			console.append("<span"+classStr+">"+status+"</span>");
		} else {
			console.append("<pre"+classStr+">"+status+"</pre>");
		}
		
		/*
		if (console.hasClass("stickToBottom")) {
			console[0].scrollTop=console[0].scrollHeight;
		}	
		*/	
		return status;
	}
}

ui.log = async function(message) {
	const maxWaitTime = 250; // half second for node change is already too slow
	var $console = $("#loadingOverlay .console");
	if (!$console.is(":visible")) return console.log(message);
	var texts = [];
	for (var i=0; i<arguments.length; i++) {
		if (typeof arguments[i] !== "string") {
			texts.push(JSON.stringify(arguments[i], undefined, 2));
		} else {
			texts.push(arguments[i]);
		}
	}
	$console.append("<pre>"+texts.join("\n")+"</pre>");
	console.log.apply(this, arguments);
	var resolver;
	var promise = new Promise((resolve, reject) => {
		resolver = resolve;
		$(document).one("logIsAdded", async ()=>{
			resolve();
		});
	})

	window.setTimeout(()=>{
		resolver();
	}, maxWaitTime)
	return promise;
}

ui.loadingInit = function() {
	if (this.loadingObserverIsInitialized) return;

	// Select the node that will be observed for mutations
	const targetNode = $("#loadingOverlay")[0];

	// Options for the observer (which mutations to observe)
	const config = { attributes: false, childList: true, subtree: true };

	// Callback function to execute when mutations are observed
	const callback = function(mutationsList, observer) {
		$(document).trigger("logIsAdded");
	};

	// Create an observer instance linked to the callback function
	const observer = new MutationObserver(callback);

	// Start observing the target node for configured mutations
	observer.observe(targetNode, config);	
	this.loadingObserverIsInitialized = true;
}


ui.loadingEnd = function(percent, status, options) {
	options = options||{};
	console.log("Loading end", arguments);
	var elapsed = Date.now() -  ui._logTimeStart;
	ui.log("日志结束了！");
	ui.log("运行时间："+elapsed+"ms");
	ui.loadingProgress(percent, status, options);
	var $loading = $("#loadingOverlay");
	options.error = options.error || false;
	
	var thisClass = "stopped";
	if (options.warning) thisClass = "warning";
	if (options.error) thisClass = "error";
	$loading.find(".loadingBarProgress").addClass(thisClass);
	ui.showCloseButton();
}


ui.setWindowTitle=function(title) {
	title = title||trans.currentFile.replace(/^.*[\\\/]/, '');
	nw.appSuffix = nw.appSuffix||"";
	var suffix = "";
	if (nw.appSuffix) {
		suffix = " "+nw.appSuffix;
	}
	var applicationTitle = "Translator++ Ver."+nw.App.manifest.version+suffix;
	
	if (title.length > 0) {
		applicationTitle = title+" - Translator++ Ver."+nw.App.manifest.version+suffix;
		$(".appTitle").text(applicationTitle);
		return $("title").text(applicationTitle);
	}
	$(".appTitle").text(applicationTitle);
	return $("title").text(applicationTitle);
}

ui.setStatusBar = function(index, content) {
	$(".footer .footer-content").eq(index).find("span").html(content);	
}

ui.updateEditorStatus = function() {
	var $editorContent = $(".footer-content.footer2 > span");
	var $editorStatus = $editorContent.find(".editorStatus");
	if ($editorContent.find(".editorStatus").length < 1) {
		$editorStatus = $("<span class='editorStatus'><span class='keyLength'>密钥长度</span><span class='keyLength'>密钥长度</span></span>");
		$editorContent.append($editorStatus);
	}
}


ui.initTextResizer = function() {
	var $elm = $(".resizeFont");
	$elm.each(function() {
		var hookName = $(this).data("for");
		if (Boolean(hookName) == false) return;
		$(hookName).css("font-size", "100%");
	})
}
ui.openTextResizer = function(hookTo, $targetElm, options) {
	console.log("text resizer opened");
	if (typeof hookTo == 'undefined') return false;
	if (hookTo.length == 0) return false;
	options = options||{};
	options.default = options.default||100;
	
	$("#textSlider .textResizer").data("target", $targetElm);
	
	$("#textSlider").removeClass("hidden");
	$("#textSlider .textResizer")[0].focus();
	$("#textSlider").position({
		my: "center top",
		at: "center bottom",
		of: hookTo,
		collision : "fit flip"
		
	});
	$(document).on("mouseup.resizer", function(e) {
		var container = $("#textSlider");
		if (!container.is(e.target) && container.has(e.target).length === 0) {
			container.addClass("hidden");
			$(document).off("mouseup.resizer");
		}
	});		
	
	var thisDefault = $targetElm.data("currentSize") || 100;
	$("#textSlider .textResizeValue").val(thisDefault+"%");
	$("#textSlider .textResizer").val(thisDefault);
	$("body").scrollTop(0)
	if ($("#textSlider").hasClass('rendered') == false) {
		$("#textSlider .textResizer").on("input", function(e) {
			$(this).data("target").css("font-size", $(this).val()+"%");
			$(this).data("target").data("currentSize", $(this).val())
			$("#textSlider .textResizeValue").val($(this).val()+"%");
			
			if ($(this).data("target").is("#currentCellText")) {
				console.log("current text resize");
				ui.generateBackgroundNumber($("#currentCellText"), undefined, true);
				ui.redrawBackgroundHelper();
			}
		});
		$("#textSlider button").eq(0).on("click", function(e) {
			var textResizer =$("#textSlider .textResizer");
			var newValue = parseInt(textResizer.val())-parseInt(textResizer.attr('step'));
			if (newValue < parseInt(textResizer.attr("min"))) newValue = parseInt(textResizer.attr("min"));
			textResizer.val(newValue);
			textResizer.trigger("input");
		});
		$("#textSlider button").eq(1).on("click", function(e) {
			var textResizer =$("#textSlider .textResizer");
			var newValue = parseInt(textResizer.val())+parseInt(textResizer.attr('step'));
			if (newValue > parseInt(textResizer.attr("max"))) newValue = parseInt(textResizer.attr("max"));
			textResizer.val(newValue);
			textResizer.trigger("input");
		});
		
		$("#textSlider .textResizer").on('wheel.resizer', function(event){
		  // deltaY obviously records vertical scroll, deltaX and deltaZ exist too
		  if(event.originalEvent.deltaY < 0){
			//wheeled up
			//console.log("wheel up");
			$("#textSlider button").eq(1).trigger("click");
		  }
		  else {
			//wheeled down
			//console.log("wheel down");
			$("#textSlider button").eq(0).trigger("click");
			
		  }
		});		
		$("#textSlider").addClass('rendered');
	}
	
}


/*
var _consoleLog = console.log;
console.log = function(string) {
	_consoleLog.call(this, string);
	if (ui.consoleIsShown) {
		$("#loadingOverlay .console").append("<pre>"+string+"</pre>");
	}
}
*/

ui.closeAllChildWindow = function(force) {
	for (var thisWin in ui.windows) {
		if (ui.windows[thisWin]) {
			if (ui.windows[thisWin].win) {
				ui.windows[thisWin].win.close(force);
			} else {
				ui.windows[thisWin].close(force);
			}
		}
	}
}

ui.contextToolFetchSelected = function() {
	/* 
		returns array of selected context 
		$("#dialogContextTool .contextSelector");
			or 
		$("#dialogContextTool .contextSelectorText").val();
	*/
	
	var contextSelector = $("#dialogContextTool .contextSelector");
	var context = contextSelector.val();
	context = context||[];
	
	var textContent = $("#dialogContextTool .contextSelectorText").val();
	var textContentA = [];
	
	if (textContent) {
		textContentA = textContent.split("\n").map(function(input) {
			return common.stripCarriageReturn(input);
		});
	}
	
	var resultArray = [];
	for (var i=0; i<context.length; i++) {
		if (Boolean(context[i]) == false) continue;
		resultArray.push(context[i]);
	}
	for (var i=0; i<textContentA.length; i++) {
		if (Boolean(textContentA[i]) == false) continue;
		if (resultArray.indexOf(textContentA[i]) !== -1) continue;
		resultArray.push(textContentA[i]);
	}	
	
	return resultArray;
}


ui.contextToolDialog = function() {
	ui.showBusyOverlay();
	var contextKeywords = trans.collectContextKeyword();
	var contextSelector = $("#dialogContextTool .contextSelector").empty();
		contextSelector.append("<option value=''>"+t("-没有-")+"</option>");
	
	for (var context in contextKeywords) {
		contextSelector.append("<option value='"+context+"'>"+context+" ("+contextKeywords[context]+")项目</option>");
	}
	
	if ($("#dialogContextTool").hasClass("initialized") == false) {
		$("#dialogContextTool").dialog({
			autoOpen: false,
			modal:true,
			//width:Math.round($(window).width()/100*80),
			//height:Math.round($(window).height()/100*80),
			width:640,
			height:480,
			minWidth:480,
			minHeight:420,
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
					text: t("取消"),
					icon: "ui-icon-close",
					click: function() {
						$(this).dialog("close");
					}
				},			
				{
					text: t("确定"),
					icon: "ui-icon-close",
					click: function() {
						var $actionSet = $(".contextAction");

						if ($actionSet.find( "input:checked" ).length == 0) {
							var conf = confirm(t("没有选择任何操作，你确定吗？"));
							if (conf) {
								$(this).dialog("close");
								return false;
							}
						}
						
						var selectedAction = $actionSet.find( "input:checked" ).val();
						console.log("action is", selectedAction);			
						var targetArray = ui.contextToolFetchSelected();
						
						if (targetArray.length < 1) {
							alert(t("没有指定上下文的关键字！"));
							return false;
						}						
						if (selectedAction == "actionRemoveSelected") {
							var conf = confirm(t("删除包含关键字的上下文：\n")+targetArray.join(", ")+t("\n从项目？"));
							if (conf) {
								trans.removeRowByContext(undefined, targetArray, {
									matchAll:$("#dialogContextTool .matchAll").prop("checked")
								});
								$(this).dialog( "close" );
							}
						} else if (selectedAction == "actionRemoveButSelected"){
						var conf = confirm(t("删除除包含关键字的上下文之外的所有行：\n")+targetArray.join(", ")+t("\n从项目？"));
							if (conf) {
								trans.removeRowByContext(undefined, targetArray, {
									matchAll:$("#dialogContextTool .matchAll").prop("checked")
								}, true);
								$(this).dialog( "close" );
							}							
						}
						
						$(this).dialog( "close" );
					}
				}

			]
		});	
		$("#dialogContextTool").addClass("initialized");
	}
	ui.hideBusyOverlay();
	$("#dialogContextTool").dialog("open");
	return ($("#dialogContextTool"));		
}


ui.batchWrapingDialog = function() {
	ui.showBusyOverlay();
	var contextKeywords = trans.collectContextKeyword();
	var contextSelector = $("#batchWraping .contextSelector").empty();
		contextSelector.append("<option value=''>"+t("-没有-")+"</option>");
	
	for (var context in contextKeywords) {
		contextSelector.append("<option value='"+context+"'>"+context+" ("+contextKeywords[context]+") "+t("项目")+"</option>");
	}
	
	$("#batchWraping .sourceCol").empty();
	$("#batchWraping .sourceCol").append(ui.generateColSelector({skipFirstCol:true}));
	
	$("#batchWraping .targetCol").empty();
	$("#batchWraping .targetCol").append(ui.generateColSelector({skipFirstCol:true}));
	
	$("#batchWraping .sourceCol select").off("change");
	$("#batchWraping .targetCol select").off("change");
	
	$("#batchWraping .sourceCol select").on("change", function(e) {
		
		
	});

	
	if ($("#batchWraping").hasClass("initialized") == false) {
		$("#batchWraping").dialog({
			autoOpen: false,
			modal:true,
			//width:Math.round($(window).width()/100*80),
			//height:Math.round($(window).height()/100*80),
			width:640,
			height:480,
			minWidth:480,
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
					text: t("取消"),
					icon: "ui-icon-close",
					click: function() {
						$(this).dialog( "close" );
					}
				},			
				{
					text: t("换行文本"),
					icon: "ui-icon-close",
					click: function() {
						if ($("#batchWraping .sourceCol select").val() == $("#batchWraping .targetCol select").val()) return alert(t("源和目标列不能相同！"));
						
						var selectedFiles = trans.getCheckedFiles();
						if (selectedFiles.length == 0) {
							var conf = confirm(t("在“文件选择器”窗格中未选择任何文件。\nTranslator++将假定所有文件都将被处理\n您确定吗？"));
							if (!conf) return false;
						}
						
						ui.showBusyOverlay();
						setTimeout(function() {
							trans.wordWrapFiles(selectedFiles, $("#batchWraping .sourceCol select").val(), $("#batchWraping .targetCol select").val(), {
								maxLength:$("#batchWraping .maxLength").val(),
								context:trans.evalContextsQuery($("#batchWraping .contextSelector").val(), $("#batchWraping .contextSelectorText").val())
							});
							trans.refreshGrid();
							ui.hideBusyOverlay();
						}, 250);
						
						$(this).dialog("close");
						
					
					}
				}

			]
		});	
		$("#batchWraping").addClass("initialized");
	}
	ui.hideBusyOverlay();
	$("#batchWraping").dialog("open");
	return ($("#batchWraping"));		
}



ui.translateAllDialog = function() {
	var $dialogTranslateAll = $("#dialogTranslateAll");	
	if ($dialogTranslateAll.hasClass("initialized") == false) {

		$dialogTranslateAll.find(".translatorSelector").empty();
		for (var i=0; i<trans.translator.length; i++) {
			console.log("creating option : "+trans.translator[i]);
			$dialogTranslateAll.find(".translatorSelector").append("<option value='"+trans.translator[i]+"'>"+trans[trans.translator[i]].name+"</option>");
		}
		$dialogTranslateAll.find(".translatorSelector").val(trans.getActiveTranslator());
		$dialogTranslateAll.find(".targetCol").empty();
		$dialogTranslateAll.find(".targetCol").append(ui.generateColSelector({skipFirstCol:true}));
	
		
		var tags = new UiTags();
		this._uiTagsTrans = tags;
		$dialogTranslateAll.find(".colorTagSelector").empty();
		$dialogTranslateAll.find(".colorTagSelector").append(tags.element);

		
		$dialogTranslateAll.dialog({
			autoOpen: false,
			modal:true,
			//width:Math.round($(window).width()/100*80),
			//height:Math.round($(window).height()/100*80),
			width:640,
			height:400,
			minWidth:480,
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
					text: t("取消"),
					icon: "ui-icon-close",
					click: function() {
						$(this).dialog( "close" );
					}
				},			
				{
					text: t("现在翻译"),
					icon: "ui-icon-plus",
					click: function() {
						
						var thisTrans = $("#dialogTranslateAll .translatorSelector").val()
						if (!thisTrans) {
							alert(t("请选择翻译引擎"));
							return false;
						}						
						trans[thisTrans].columnIndex = $("#dialogTranslateAll .targetCol select").val();
						
						//trans.translateAll(thisTrans, {});
						var options = ui._uiTagsTrans.getValue();
						if (Boolean(options)==false) return; // tag selected but no action
						$(this).dialog( "close" );

						options = options || {};
						options.translateOther	= $("#dialogTranslateAll .translateOther").prop("checked"),
						options.ignoreTranslated = $("#dialogTranslateAll .untranslatedOnly").prop("checked")
						console.log(options);
						trans.translateAll(thisTrans, options);
					}
				}

			]
		});	
		$dialogTranslateAll.addClass("initialized");
	}
	
	$dialogTranslateAll.dialog("open");
	return ($dialogTranslateAll);		
}


ui.exportPreparationDialog = function(path, options) {
	options = options||{};
	options.onDone = options.onDone||function(){}
	var $dialogExport = $("#dialogExportPreparation")
	this.lastTags = new UiTags();
	$dialogExport.find(".colorTagSelector").empty();
	$dialogExport.find(".colorTagSelector").append(this.lastTags.element);
	
	$dialogExport.data("onDone", options.onDone);
	if ($dialogExport.hasClass("initialized") == false) {
		
		$dialogExport.dialog({
			autoOpen: false,
			modal:true,
			//width:Math.round($(window).width()/100*80),
			//height:Math.round($(window).height()/100*80),
			width:640,
			height:480,
			minWidth:640,
			minHeight:480,
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
					text: t("取消"),
					icon: "ui-icon-close",
					click: function() {
						$(this).dialog( "close" );
					}
				},			
				{
					text: t("现在导出"),
					icon: "ui-icon-plus",
					click: function() {
						/*
						var thisOptions = 	{
										filterTag:tags,
										filterTagMode:filterTagMode 
									}
						*/
						var thisOptions = ui.lastTags.getValue();
						if (thisOptions === false) return false;
						
						var thisOnDone = $(this).data("onDone");
						if (typeof thisOnDone !== 'function') return console.log("thisOnDone is not a function");
						console.log("Tags : ", thisOptions);
						
						thisOnDone.call(this, thisOptions);
						$(this).dialog( "close" );
					}
				}

			]
		});	
		$("#dialogExportPreparation").addClass("initialized");
	}
	
	$("#dialogExportPreparation").dialog("open");
	return $("#dialogExportPreparation");		
}


ui.taggingDialog = function(cellSelection, options) {
	console.log("taggingDialog", arguments);
	options = options||{};
	options.onDone = options.onDone||function(){}

	var $dialogContent = $("#dialogSetTags");
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
	$dialogContent.find(".colorTagSelector").html(tags.element);


	if ($dialogContent.hasClass("initialized") == false) {
		console.log("initializing dialogSetTags");
	
		$dialogContent.dialog({
			autoOpen: true,
			modal:true,
			//width:Math.round($(window).width()/100*80),
			//height:Math.round($(window).height()/100*80),
			width:480,
			height:320,
			minWidth:480,
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
					text: t("取消"),
					icon: "ui-icon-close",
					click: function() {
						$(this).dialog("close");
					}
				},			
				{
					text: t("确定"),
					icon: "ui-icon-plus",
					click: function() {
						//alert("export action placeholder");
						/*
						var tags = [];
						$.each($(this).find(".tagSelector:checked"), function(){            
							tags.push($(this).val());
						});
						
						var action = $(this).find("input[type='radio']:checked").val();
						if (tags.length > 0 && action=="") {
							var conf = confirm("You selected one or more tags, but the action is 'Do nothing'.\nYour selected tags will not affect anything.\n\nDo you wish to continue?");
							
							if (conf == false) return false;
						}
						*/
						var tagsData = tags.getValue();
						var tagList = tagsData.filterTag;
						var action = tagsData.filterTagMode;
						if (tagsData === false) return false;
						
						$(this).dialog( "close" );
						
						if (action == "appendTags") {
							trans.setTagForSelectedRow(tagList, cellSelection, undefined, {append:true});
						} else if (action == "setTags") {
							trans.setTagForSelectedRow(tagList, cellSelection, undefined, {append:false});
						} else if (action == "removeTags") {
							trans.removeTagsForSelectedRow(undefined, cellSelection,  tagList)
						}							

					}
				}

			]
		});
	
	}
	
	$dialogContent.dialog("open");	
	return $dialogContent;	
}

// ==================================================================
// 						INTRO WINDOW SECTION
// ==================================================================

ui.introWindowShow = function(options) {
	ui.blurAll();
	ui.showRandomTip();
	$("#introWindow").fadeIn(200);
	//$("#introWindow").removeClass("hidden");		
	ui.appBarTheme("dark");
	this.ribbonMenu.select("开始", false)
	
}

ui.introWindowClose = function(options) {
	ui.unBlurAll();
	trans.grid.render();
	//$("#introWindow").addClass("hidden");
	$("#introWindow").fadeOut(200);
	ui.appBarTheme("");
	ui.backgroundHelperInitialize();
	this.ribbonMenu.select("首页", false)
}

ui.showRecentFile = function(num, $target) {
	if (Boolean(sys) == false) return;
	if (Boolean(sys.config) == false) return;
	if (Boolean(sys.config.historyOpenedFiles) == false) return;
	$target = $target||$("#introWindow .recentProject");

	num = num||1;
	$target.empty();
	for (var i=0; i<num; i++) {
		if (Boolean(sys.config.historyOpenedFiles[i]) == false) continue;
		sys.config.historyOpenedFiles[i] = sys.config.historyOpenedFiles[i] || {};
		if (JSON.stringify(sys.config.historyOpenedFiles[i]) == "{}") continue;

		var thisGameTitle 	= sys.config.historyOpenedFiles[i].gameTitle||t("-未知的标题-");
		var thisEngine		= "";
		thisPath 	= sys.config.historyOpenedFiles[i].path  || "";
		
		try {
			console.log("Path is : ", sys.config.historyOpenedFiles[i].path);
			thisEngine 	= sys.config.historyOpenedProject[sys.config.historyOpenedFiles[i].projectId].gameEngine;
		} catch (e) {
			//console.warn(e);
		}
		var $template = $(`<li><i class='icon icon-angle-right'></i><span class='title'></span><span class='date icon-calendar'></span>
		<span class="filePath icon-tpp">
			<div class="flex"><span class="folderPath">${nwPath.dirname(thisPath)}</span><span class="fileName">\\${nwPath.basename(thisPath)}</span>
			</div>
		</span></li>`);
		$template.find(".title").html(thisGameTitle);
		$template.find(".date").html(new Date().toLocaleString());
		$template.data("gameData", sys.config.historyOpenedFiles[i]);
		if (thisEngine) $template.append("<span class='engine'>"+thisEngine+"</span>");
		$template.data("historyIndex", i);
		$template.data("engineName", thisEngine);
		$target.append($template);
		
		$template.on("click", function() {
			sys.loadFileHistory($(this).data("historyIndex"));
			ui.introWindowClose();
		})
	}

	if ($target.find("li").length == 0) {
		var $template = $(`<li title='`+t('转到在线文档。')+`'>
		<i class='icon icon-angle-right mainIconRight'></i>
			<span class='title'><i class="icon-info-circled-1"></i>`+t('还没有项目')+`</span>
			<span>`+t(`你对Translator++是新手吗？<br />
			请阅读我们的在线文档<b>dreamsavior.net</b>。<br />按<b>F1</b>以打开联机帮助<br />如果有问题和错误报告，请通过<b>patreon.com/dreamsavior</b>联系我。
			`)+
			`</span>
		</li>`);
		$template.on("click", function() {
			nw.Shell.openExternal('http://dreamsavior.net/docs/');
		})		
		$target.append($template);		
	}
	
	return $target;
}

ui.showRandomTip = function($container) {
	$tipPlaceHolder = $(".tipsPlaceHolder > div");
	var $item = $tipPlaceHolder[Math.floor(Math.random()*$tipPlaceHolder.length)];
	$item = $($item).clone(true, true);
	$container = $container || $(".tipsContent");
	$container.html(ui.render($item));
	return $item;
}



ui.warning = function(msg, title, options) {
	options = options||{};
	options.onDone = options.onDone||function(){}
	title = title||"警告";
	$("#warningDialog").data("onClose", options.onDone);
	if ($("#warningDialog").length == 0) {
		$("#template").append("<div id='warningDialog' class='warningDialog' title='警告'><h1 class='icon-attention warningTitle'>"+t("警告")+"</h1><p class='warningContent'></p></div>");
		$("#warningDialog .warningContent").html(msg);
		$("#warningDialog .warningTitle").html(title);
		$("#warningDialog").dialog({
			autoOpen: false,
			modal:true,
			//width:Math.round($(window).width()/100*80),
			//height:Math.round($(window).height()/100*80),
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
				}

			]
		});	
		
		$("[aria-describedby='warningDialog']").find(".ui-dialog-title").prepend("<span class='icon-attention'></span>");
	} else {
		$("#warningDialog .warningContent").html(msg);
		$("#warningDialog .warningTitle").html(title);
		
	}
	
	$("#warningDialog .warningContent a").on("click", function(e) {
		e.preventDefault();
		nw.Shell.openExternal($(this).attr("href"));
	});
	
	$("#warningDialog").dialog("open");
	return $("#warningDialog");		
}

// ==============================================================
// TRANSLATOR PANE
// ==============================================================

ui.openTranslatorPane = function(param, options) {
	param = param||"";
	options = options||{};

	var targetWidth = $(".fileListWrapperOuter").outerWidth();
	var targetHeight = $(".fileListWrapperOuter").outerHeight()-48;
	var posTop = $(".fileListWrapperOuter").offset().top + window.screenY+48;
	var posLeft = $(".fileListWrapperOuter").offset().left + window.screenX;
	ui.windows['translator'] = window.open("translator.html#"+param, "translator", "width="+targetWidth+",height="+targetHeight+",left="+posLeft+",top="+posTop+",fullscreen=no");
	//$(".menu-button.addNote").addClass("checked");	
	
}

ui.undockTranslatorPane = function() {
	if ($("#translationPane").attr("src") == "") return false;
	if (ui.windows['translator']) return "翻译窗口已经打开！";
	
	var translationWindow = $("#translationPane")[0].contentWindow;
	
	var lastText = "";
	try {
		lastText = translationWindow.translator.last.text;
	} catch(err) {
		lastText = "";
	}

	$(".menu-button.undockPane").addClass("checked");
	$(".menu-button.translationPane").prop("disabled", true);
	$(".panel-left .fileListButton").trigger("click");
	$("#translationPane").attr("src", "");
	ui.openTranslatorPane(lastText);
	
}

ui.dockTranslatorPane = function(lastText, dontClose) {
	console.log("running : ui.dockTranslatorPane");
	if (ui.windows['translator']) {
		var lastText = "";
		try {
			lastText = ui.windows['translator'].translator.last.text;
		} catch(err) {
			lastText = "";
		}
		
		if (!dontClose) {
			ui.windows['translator'].close();
		}
	}
	$("#translationPane").attr("src", "translator.html#"+lastText);	
	$(".menu-button.undockPane").removeClass("checked");
	$(".menu-button.translationPane").prop("disabled", false);
}

ui.toggleDockTranslatorPane = function() {
	if (ui.windows['translator']) { //undocked
		ui.dockTranslatorPane();
	} else {
		ui.undockTranslatorPane();
	}
}

ui.resize = {};
ui.resize.leftPane = function(size) {
	size = size||200;
	
	sys.config = sys.config || {}
	sys.config.paneSizes = sys.config.paneSizes||{};
	sys.config.paneSizes.leftPane = size;
	
	if (typeof size == 'number') size = size+"px"
	$(".panel-right").css("overflow", "auto");
	$(".panel-left").css("width", size);
	$(".panel-right").css("overflow", "hidden");
	trans.refreshGrid();	
}
ui.resize.editorWidth = function(size) {
	size = size || "30%";
	sys.config = sys.config || {}
	sys.config.paneSizes = sys.config.paneSizes||{};
	sys.config.paneSizes.editorWidth = size;
	
	if (typeof size == 'number') size = size+"px"
	$(".cellInfoPartsA").width(size);
}
ui.resize.editorHeight = function(size) {
	size = size || "calc(100vh - 180px)";
	sys.config = sys.config || {}
	sys.config.paneSizes = sys.config.paneSizes||{};
	sys.config.paneSizes.editorHeight = size;
	
	if (typeof size == 'number') size = size+"px"
	$(".panel-wrapper").css("height", size);
	trans.refreshGrid();	
	ui.fixCellInfoSize();			
}
ui.resize.reset = function() {
	ui.resize.leftPane();
	ui.resize.editorWidth();
	ui.resize.editorHeight();	
	trans.grid.render();
}

ui.resize.collapse = function(target) {
	$(".panel-left").addClass("hidden");
	$(".panelLeftTabHandler > i").removeClass("flip");
	trans.grid.render();
}
ui.resize.unCollapse = function(target) {
	$(".panel-left").removeClass("hidden");
	$(".panelLeftTabHandler > i").addClass("flip");
	trans.grid.render();
}
ui.resize.toggleCollapse = function(target) {
	if ($(".panel-left").hasClass('hidden')) {
		ui.resize.unCollapse()
	} else {
		ui.resize.collapse()
	}
}
ui.resize.init = function() {
	//var $currentRomaji = $("#currentRomaji");
	var $cellInfoContent = $(".cellInfoTabContent");
	$(".panel-wrapper").resizable({
		handles:'s',
		start:function(e, thisUi) {
			$(document).trigger("onCellInfoResizeStart");

			var maxHeight = $(window).height()-120;
			$(".panel-wrapper").resizable( "option", "maxHeight", maxHeight );
		},
		resize:function(e, thisUi) {
			var negativeHeight = thisUi.element.height() + 100;
			$cellInfoContent.css("height", "calc(100vh - "+negativeHeight+"px)");
		},
		stop:function(e, thisUi) {
			$(document).trigger("onCellInfoResizeStop");
			sys.config = sys.config || {}
			sys.config.paneSizes = sys.config.paneSizes||{};
			sys.config.paneSizes.editorHeight = $(this).css("height");
			
			trans.refreshGrid();
			//trans.grid.refreshDimensions();	
			ui.fixCellInfoSize();		
			
		}
	})

	$(".cellInfoPartsA").resizable({
		handles:'e',
		start:function(e, thisUi) {
			//$(".cellInfoPartsB").css("width", "unset");
			$(document).trigger("onCellInfoResizeStart");
			var maxWidth = Math.round($(window).width()/100*80);
			$(".cellInfoPartsA").resizable( "option", "maxWidth", maxWidth );
		},
		stop:function(e, thisUi) {
			$(document).trigger("onCellInfoResizeStop");
			sys.config = sys.config || {}
			sys.config.paneSizes = sys.config.paneSizes||{};
			sys.config.paneSizes.editorWidth = $(this).css("width");;
		}
	});
	
	
	$(".panel-left").resizable({
		handles:'e',
		start:function(e, thisUi) {
			$(".panel-right").css("overflow", "auto");
			trans.ignoreResize = true;
		},
		resize:function() {
			//console.log("resize");
			//$(".panel-left").attr("style", "width:calc(100vw - "+$(".panel-right").outerHeight()+"px)");
		},
		stop:function(e, thisUi) {
			$(".panel-right").css("overflow", "hidden");
			
			trans.ignoreResize = false;
			//trans.grid.render();
			sys.config = sys.config || {}
			sys.config.paneSizes = sys.config.paneSizes||{};
			sys.config.paneSizes.leftPane = $(this).width();
			trans.grid.render();
		}
	});	

	sys.onReady(function() {
		sys.config = sys.config || {}
		sys.config.paneSizes = sys.config.paneSizes||{};
		ui.resize.leftPane(sys.config.paneSizes.leftPane);
		ui.resize.editorWidth(sys.config.paneSizes.editorWidth);
		ui.resize.editorHeight(sys.config.paneSizes.editorHeight);
		console.log("rerendering grids");
		trans.ignoreResize = false;
		trans.refreshGrid();

	})	
}

// active cell info
ui.toggleActiveCellInfo = function(isOn) {
	var $elm = $('#cellSelectionInfo')
	var $btn = $('.toggle-activeCellInfo')
	
	if (typeof isOn == 'undefined') {
		if ($elm.is(':visible')) {
			$btn.removeClass('checked');
			isOn = false;
		} else {
			$btn.addClass('checked');
			isOn = true;
		}
	}	

	if (isOn) {
		$('.panel-wrapper').css("max-height", "");
		$elm.show();
	} else {
		$('.panel-wrapper').css("max-height", "100%");
		$elm.hide();
	}
	trans.grid.render();
}

ui.clearActiveCellInfo = function() {
	$("#currentCoordinate").val('');
	$("#currentRomaji").html("");
	$("#currentCellText").val('')
}

ui.clearPathInfo = function() {
	$('.pathinfoWrapper .fileId').val('')
}


// ==============================================================
// APP BAR
// ==============================================================
ui.appBarTheme = function(theme) {
	$(".applicationBar").attr("data-theme", theme);
}

// ==============================================================
// NOTE
// ==============================================================
ui.applyCurrentNote = function() {
	// store current note
	if (ui.windows['note']) {
		var thisID = ui.windows['note'].note.saveData();
	}
	ui.evalFileNoteIcon();
}

ui.openFileNote = function(param, options) {
	param = param||trans.getSelectedId()||"";
	options = options||{};
	//options.thisNote = options.thisNote||trans.getSelectedObject().note || "";
	ui.applyCurrentNote();
	ui.windows['note'] = window.open("note.html#"+param, "note", "width=640,height=320,left=100,top=100,fullscreen=no");
	$(".menu-button.addNote").addClass("checked");
	/*
	if (ui.noteIsOpened) {
		ui.windows['note'].document.getElementById('note').value= options.thisNote;
	} else {	
		ui.windows['note'].onload = function() {
			ui.windows['note'].document.getElementById('note').value= options.thisNote;
		}
	}
	*/
}

ui.closeFileNote = function() {
	$(".menu-button.addNote").removeClass("checked");
	
	if (ui.windows['note']) ui.windows['note'].close();
}

ui.evalFileNoteIcon = function() {
	if (Boolean(trans.getSelectedObject().note) == false) {
		$(".menu-button.addNote img").attr("src", "img/spechbubble_sq_icon.png");
	} else {
		$(".menu-button.addNote img").attr("src", "img/spechbubble_sq_icon_line.png");
	}
}


ui.switchLeftPane = function(target) {
	if (target == 'transPaneWrapper' ) {
		var $transFrame = $("#translationPane");
		if ($transFrame.attr("src") == "") {
			$transFrame.attr("src", "translator.html")
		}
	}
	
	$(".panel-left .switchablePane").addClass("hidden");
	$(".panel-left .switchablePane").removeClass("activePane");
	$(".panel-left .switchablePane."+target).removeClass("hidden");
	$(".panel-left .switchablePane."+target).addClass("activePane");

	$(".panel-left .panel-switcher").removeClass("checked");
	$(".panel-left .panel-switcher[data-for="+target+"]").addClass("checked");
}


// ==============================================================
// SEARCH
// ==============================================================

ui.openSearchWindow = function(param) {
	param = param||"";
	console.log("selected text is: "+common.getSelectionText());
	var searchIsLoaded = false;
	if (typeof ui.windows['search'] !== 'undefined') {
		searchIsLoaded = true;
	}
	
	if (ui.windows['search']) {
		ui.windows['search'].win.restore();
		ui.windows['search'].win.requestAttention(2);
	}
	
	var posTop = $(".fileListWrapperOuter").offset().top + window.screenY+100;
	var posLeft = $(".fileListWrapperOuter").offset().left + window.screenX+240;	
	console.log("window possition : "+posTop+", "+posLeft);
	//ui.windows['search'] = window.open("find.html#"+param, "Search", "width=640,height=320,resizable=no,left="+posLeft+",top="+posTop+",fullscreen=no,dialog=1");
	
	nw.Window.open('www/find.html#'+param, 
	{
		// id will makes the search window will be spawned one
		'id': "search"+window.windowIndex, 
		'frame':false, 
		'transparent':true
	}, 
	function(thisWin) {
		ui.windows['search'] = thisWin.window;
		ui.windows['search'].onload = function() {
			var thisSelectedText = common.getSelectionText();
			if (Boolean(thisSelectedText.trim()) == false) thisSelectedText="";
			ui.windows['search'].document.getElementById('fieldFind').value= thisSelectedText;
			ui.windows['search'].document.getElementById('fieldReplaceFind').value= thisSelectedText;
			ui.windows['search'].document.getElementById('fieldPutFind').value= thisSelectedText;
			
			if (param !== "replace") {
				var selectedText = thisSelectedText||"";
				if (selectedText.trim().length > 0 && selectedText !== " ") ui.windows['search'].search.sendCommand();
				
				//if (common.getSelectionText()) ui.windows['search'].search.sendCommand();
			}
			
		}
	});
	
//resultWindow.window
	
	if (searchIsLoaded) {
		var thisSelectedText = common.getSelectionText();
		if (Boolean(thisSelectedText.trim()) == false) thisSelectedText="";
		ui.windows['search'].document.getElementById('fieldFind').value= thisSelectedText;
		ui.windows['search'].document.getElementById('fieldReplaceFind').value= thisSelectedText;
		ui.windows['search'].document.getElementById('fieldPutFind').value= thisSelectedText;
		if (param !== "replace") {
			var selectedText = thisSelectedText||"";
			if (selectedText.trim().length > 0 && selectedText !== " ") ui.windows['search'].search.sendCommand();
			// switch tab manually
			ui.windows['search'].document.querySelectorAll(".findAnchor")[0].click();
		} else {
			ui.windows['search'].document.querySelectorAll(".replaceAnchor")[0].click();
		}		
	} 
	
	/*
	nw.Window.open("find.html", {}, function(win) {
		// Release the 'win' object here after the new window is closed.
		win.on('closed', function() {
			//ui.windows['search']
			win = null;
		});
		
		// Listen to main window's close event
		nw.Window.get().on('close', function() {
			// Hide the window to give user the feeling of closing immediately
			this.hide();

			// If the new window is still open then close it.
			if (win != null)
			win.close(true);

			// After closing the new window, close the main window.
			this.close(true);
		});
	});
	*/
}


// ==============================================================
// 			PANE EXPANDER
// ==============================================================
ui.fixKeyCellOverflow = function() {
	console.log("fix overflow. Col width :", trans.grid.getColWidth(0), "range left :", window.innerWidth - $("#menuPanel")[0].getBoundingClientRect().width + 40);
	console.log("manual calculation width :", $("#table .ht_clone_top_left_corner .wtSpreader thead th:eq(1)")[0].getBoundingClientRect().width);
	if (trans.grid.getColWidth(0) <= (window.innerWidth - $("#menuPanel")[0].getBoundingClientRect().width + 40)) return ;
	console.log("fixing overflow");
	trans.grid.setColWidth(0, 150)
}

ui.fixCellInfoSize = function() {
	return ;
	var mainPanelHeight = $(".panel-wrapper").eq(0).outerHeight();
	var subs = mainPanelHeight +82;
	$("#cellSelectionInfo").css("height", "calc(100vh - "+subs+"px)");
}


// ==============================================================
// ROW PROPERTIES WINDOW
// ==============================================================

ui.openRowProperties = function(range, options) {
	options = options||{};
	//ui.windows['rowProperties'] = window.open("rowProperties.html", "rowProperties", "");
	//$(".menu-button.addNote").addClass("checked");	
	
	range = range||trans.grid.getSelectedRange();
	if (typeof range == 'undefined') return false;
	
	var highlightedRow = range[0].highlight.row;
	var keyText = trans.grid.getData()[highlightedRow][0];
	var contextList = [];
	if (trans.project !== 'undefined') {
		try {
			var contextList = trans.project.files[trans.getSelectedId()].context[highlightedRow];
		} catch (error) {
			console.log(error);
		}
	}
	
	var contextTemplate = "";
	contextList = contextList||[];
	for (var i=0; i<contextList.length; i++) {
		contextTemplate+= "<li>"+contextList[i]+"</li>";
	}
	
	var $container = $("#rowProperties");
	$container.find(".rowProp_fileName").html(trans.getSelectedId());
	$container.find(".rowProp_location").html(highlightedRow);
	$container.find(".rowProp_keyText").html(keyText);
	$container.find(".rowProp_contextList").html(contextTemplate);
	$container.find(".rowProp_bestTranslatiion").html(trans.getTranslationFromRow(trans.grid.getData()[highlightedRow]));

	
	if ($("#rowProperties").hasClass("initialized") == false) {
		$("#rowProperties").dialog({
			autoOpen: false,
			title: t("行属性"),
			modal:true,
			width:Math.round($(window).width()/100*50),
			height:Math.round($(window).height()/100*50),
			minWidth:600,
			minHeight:460,
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
					text: "关闭",
					icon: "ui-icon-close",
					click: function() {
						$(this).dialog( "close" );
					}
				}
			]
		});	
		$("#rowProperties").addClass("initialized");
	}
	
	$("#rowProperties").dialog("open");

	$(document).trigger("dialogRowPropertiesOpened", $container);
	return ($("#rowProperties"));
	
}
// ==============================================================
// PROJECT PROPERTIES WINDOW
// ==============================================================

ui.drawTranslatorOptions = function($parent) {
	for (var i=0; i<trans.translator.length; i++) {
		$parent.append("<option value='"+trans.translator[i]+"'>"+trans[trans.translator[i]].name+"</option>");
	}
	return $parent;
}

ui.drawLanguageOptions = function($parent) {
	for (var code in consts.languages) {
		$parent.append("<option value='"+code+"'>"+consts.languages[code]+"</option>");
	}
	return $parent;
}


ui.openProjectProperties = async function(options) {
	options = options||{};
	

	trans.evalTranslationProgress();

	var $container = $("#projectProperties");
	$container.find(".fileProp_id").html();

	//$container.find(".fileProp_translatedLength").html(currentFile.progress.translated);

	$container.find(".translatedPercent").html("%");
	//$container.find(".translatedPercent").css("background", 'linear-gradient(to right, rgb(49, 89, 249) 0%, rgb(49, 89, 249) '+currentFile.progress.percent+'%, rgb(255, 0, 4) '+currentFile.progress.percent+'%, rgb(255, 0, 4) 100%');

	trans.project.options = trans.project.options||{};
	trans.project.cache = trans.project.cache||{};
	if ($container.hasClass("initialized") == false) {
		// initializing translator field
		var $translator = $container.find(".projProp_translator");
		ui.drawTranslatorOptions($("#translatorEngines"));
		$translator.off("change");
		$translator.on("change", function(e) {
			trans.project.options.translator = $(this).val();
		});
		
		var $sl = $container.find(".projProp_langFrom");
		var $tl = $container.find(".projProp_langTo");
		ui.drawLanguageOptions($("#languages"));
		$sl.off("change");
		$sl.on("change", function(e) {
			trans.project.options.sl = $(this).val();
		});		
		$tl.off("change");
		$tl.on("change", function(e) {
			trans.project.options.tl = $(this).val();
		});
		
		$container.find(".projProp_title").on("blur paste", function() {
			trans.project.gameTitle = $(this).val();
			$(".footer-content.footer2 > span").html(trans.project.gameTitle);
		})
		
		$container.find(".editableHtmlFld").on("blur paste", function() {
			$html = $(this);
			$(this).find("style, script, iframe, webview").remove();
			$(this).find("a").addClass("external")
			$(this).find("a").attr("external", "")
			trans.project.options.info = $(this).html()
		})
		
		$container.find(".displayInfo").on("input", function() {
			trans.project.options.displayInfo = $(this).prop("checked")
		})
		
		$container.dialog({
			autoOpen: false,
			title: t("项目属性"),
			modal:true,
			width:Math.round($(window).width()/100*50),
			height:Math.round($(window).height()/100*50),
			minWidth:600,
			minHeight:460,
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
				}
			]
		});	
		
		$container.find("#projPropWrapper").tabs();
		$container.addClass("initialized");
	}

	$container.find(".projProp_fileLoc").html(trans.currentFile);
	ui.clearFieldInfo($container.find(".projProp_fileLoc"));
	if (trans.currentFile) {
		if (common.isExist(trans.currentFile) == false) {
			ui.setFieldInfo($container.find(".projProp_fileLoc"), "找不到路径！影响：导出和注入过程将失败。", "warning");
		}
	}
	
	
	$container.find(".projProp_id").html(trans.project.projectId);
	$container.find(".projProp_date").html(trans.project.buildOn);
	$container.find(".projProp_engine").html(trans.project.gameEngine);
	
	// writable
	$container.find(".projProp_title").val(trans.project.gameTitle);
	$container.find(".projProp_loc").val(trans.project.loc);
	$container.find(".projProp_translator").val(trans.project.options.translator);
	$container.find(".projProp_stagingPath").val(trans.project.cache.cachePath);
	ui.clearFieldInfo($container.find(".projProp_stagingPath"));
	if (trans.project.cache.cachePath) {
		if (common.isDir(trans.project.cache.cachePath) == false) {
			ui.setFieldInfo($container.find(".projProp_stagingPath"), `找不到路径！影响：导出和注入过程将失败。 
			<a href="https://dreamsavior.net/?p=1062" class="icon-help-circled externalLink" external>帮助</a>`, "warning");
		}
	}
	
	$container.find(".editableHtmlFld").html(trans.project.options.info);
	$container.find(".displayInfo").prop("checked", trans.project.options.displayInfo || false)

	$container.dialog( "instance" ).uiDialog.find(".ui-dialog-title").html("<i class='icon-cog'></i>"+t("项目属性：")+trans.project.gameTitle );
	console.warn("外部路径：", $container.find("a.externalLink, a[external]"))
	$container.find("a.externalLink, a[external]").on("click", function(e) {
		console.warn("点击")
		e.preventDefault();
		nw.Shell.openExternal($(this).attr("href"));
	})
	

	var $loc = $container.find(".projProp_loc");
	var evalProjectLoc = async ()=>{
		if (await common.isDirectory(trans.project.loc) == false) {
			$loc = $container.find(".projProp_loc");
			$loc.addClass("error");
			$container.find(".projProp_loc_info").removeClass("hidden");
		} else {
			$loc.removeClass("error");
			$container.find(".projProp_loc_info").addClass("hidden");			
		}
	}
	evalProjectLoc();
	$loc.on("change", function() {
		trans.project.loc = $(this).val();
		evalProjectLoc();
	})

	$container.dialog("open");
	return $container;
	
}

ui.setFieldInfo = function($elm, msg, type) {
	var $template = $elm.parent().find(".fieldInfo");
	if ($template.length == 0) {
		$template = $("<div class='fieldInfo'></div>");
		$elm.parent().append($template)		
	}
	if (type == "warning") {
		$template.addClass("icon-attention");
	} else if (type == "error")	{
		$template.addClass("icon-minus-circled");
	} else {
		$template.addClass("icon-info-circled");
	}
	
	$template.html(msg);

}

ui.clearFieldInfo = function($elm) {
	$elm.parent().find(".fieldInfo").remove();
}

// ==============================================================
// FILE PROPERTIES WINDOW
// ==============================================================

ui.openFileProperties = function(contextMenuId, options) {
	options = options||{};
	
	if (Boolean(contextMenuId) == false) {
		//$container.find(".rowProp_fileName").html(trans.getSelectedId());
		var $selected = $(".fileList .data-selector.context-menu-active");
		if ($selected.length < 1) return console.warn("找不到所选文档");
		if ($selected.length > 1) return console.warn("不能处理多个选定的文档");
		
		contextMenuId = $selected.attr("data-id");
	
	}
	var currentFile = trans.project.files[contextMenuId]||{};
	trans.evalTranslationProgress([contextMenuId]);

	var $container = $("#fileProperties");
	$container.find(".fileProp_id").html(contextMenuId);
	$container.find(".fileProp_path").html(currentFile.path);
	$container.find(".fileProp_originalFormat").html(currentFile.originalFormat);
	$container.find(".fileProp_dataLength").html(currentFile.data.length);
	$container.find(".fileProp_translatedLength").html(currentFile.progress.translated);

	$container.find(".translatedPercent").html(Math.round(currentFile.progress.percent)+"%");
	$container.find(".translatedPercent").css("background", 'linear-gradient(to right, rgb(49, 89, 249) 0%, rgb(49, 89, 249) '+currentFile.progress.percent+'%, rgb(255, 0, 4) '+currentFile.progress.percent+'%, rgb(255, 0, 4) 100%');

	
	if ($container.hasClass("initialized") == false) {
		$container.dialog({
			autoOpen: false,
			title: t("文件属性"),
			modal:true,
			width:Math.round($(window).width()/100*50),
			height:Math.round($(window).height()/100*50),
			minWidth:600,
			minHeight:460,
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
				}
			]
		});	
		$container.addClass("initialized");
	}

	$container.dialog( "instance" ).uiDialog.find(".ui-dialog-title").html("<i class='icon-cog'></i>"+t("文件属性：")+contextMenuId );

	$container.dialog("open");
	return $container;
	
}


// ==============================================================
// OPTIONS WINDOW
// ==============================================================

ui.openOptionsWindow = function(options) {
	options = options||{};
	ui.windows['options'] = window.open("options.html", "options", "");
	//$(".menu-button.addNote").addClass("checked");
	/*	
	nw.Window.open('www/options.html',
	{
		// id will makes the search window will be spawned one
		'id': "options"
	}, 
	function(thisWin) {
		ui.windows['options'] = thisWin.window;
	});
	*/
	
}

// ==============================================================
// TRIM DIALOG WINDOW
// ==============================================================

ui.openTrimWindow = function(options) {
	options = options||{};
	if ($("#trimDialogWindow").length == 0) {
		// initializing
		$("#template").append('<div id="trimDialogWindow">\
			<div class="dialogGuide"><img src="img/guide-trim.png"></div>\
			<div class="dialogContent">\
			<h2>'+t("目标列")+'</h2>\
			<div class="columnSelector"></div>\
			</div>\
		</div>');
		
		var $container = $("#trimDialogWindow");
		
		
		$container.dialog({
			autoOpen: false,
			title: t("修剪空白"),
			modal:true,
			width:Math.round($(window).width()/100*50),
			height:Math.round($(window).height()/100*50),
			minWidth:600,
			minHeight:460,
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
					text: t("取消"),
					icon: "ui-icon-close",
					click: function() {
						$(this).dialog( "close" );
					}
				},
				{
					text: t("确定"),
					icon: "ui-icon-close",
					click: function() {
						var selectedValue = $("#trimDialogWindow select").val();
						if (Array.isArray(selectedValue) == false) return alert(t("请选择一列"));
						
						var confirmation = confirm(t("确实要修剪选定列上的空白吗？\n此操作无法撤消！"));
						if (confirmation) {
							ui.showBusyOverlay();
							var selectedFile = trans.getCheckedFiles();
							if (selectedFile.length == 0) selectedFile = trans.getAllFiles();
							
							trans.trimTranslation(selectedFile, selectedValue);
							$(this).dialog("close");
							ui.hideBusyOverlay();
						}
					}
				}
			]
		});	
	}
	
	var $container = $("#trimDialogWindow");
	$container.find(".columnSelector").html(ui.generateColMultiSelector({skipFirstCol:true}));
	$container.dialog("open");
	return $container;
	
}


ui.openPaddingWindow = function(options) {
	options = options||{};
	if ($("#paddingDialogWindow").length == 0) {
		// initializing
		$("#template").append('<div id="paddingDialogWindow">\
			<div class="dialogGuide"><img src="img/guide-padding.png"></div>\
			<div class="dialogContent">\
			<h2>'+t("目标列")+'</h2>\
			<div class="columnSelector"></div>\
			</div>\
		</div>');
		
		var $container = $("#paddingDialogWindow");
		
		
		$container.dialog({
			autoOpen: false,
			title: "自动填充",
			modal:true,
			width:Math.round($(window).width()/100*50),
			height:Math.round($(window).height()/100*50),
			minWidth:600,
			minHeight:460,
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
					text: t("取消"),
					icon: "ui-icon-close",
					click: function() {
						$(this).dialog( "close" );
					}
				},
				{
					text: t("确定"),
					icon: "ui-icon-close",
					click: function() {
						var selectedValue = $("#paddingDialogWindow select").val();
						if (Array.isArray(selectedValue) == false) return alert(t("请选择一列"));
						
						var confirmation = confirm(t("是否确实要在选定列上添加？\n此操作无法撤消！"));
						if (confirmation) {
							ui.showBusyOverlay();
							var selectedFile = trans.getCheckedFiles();
							if (selectedFile.length == 0) selectedFile = trans.getAllFiles();
							
							trans.paddingTranslation(selectedFile, selectedValue);
							$(this).dialog("close");
							ui.hideBusyOverlay();
						}
					}
				}
			]
		});	
	}
	
	var $container = $("#paddingDialogWindow");
	$container.find(".columnSelector").html(ui.generateColMultiSelector({skipFirstCol:true}));
	$container.dialog("open");
	return $container;
	
}


// ========================================================
// CURRENT CELL'S TEXT EDITOR
// Background Layer
// ========================================================
ui.currentCellTextOptionsOpen = function(options) {
	console.log("Opening ui.currentCellTextOptionsOpen");
	options = options||{};
	
	sys.config.backgroundHelper = sys.config.backgroundHelper||[];
	var applyChange = function($element) {
		$element = $element || $("#currentCellTextOptions");
		$ctMarkers = $element.find("#currentCellTextOptions_marker .ctMarkers");
		
		var ctOptions = [];
		for (var index=0; index<$ctMarkers.length; index++) {
			var $thisElm = $ctMarkers.eq(index);

			ctOptions.push({
				at: $thisElm.find(".ctMarkers_number").val(),
				color: $thisElm.find(".ctMarkers_color").val(),
				unit: $thisElm.find(".ctMarkers_unit").val()
			})
		}
		
		console.log(ctOptions);
		ui.createBackgroundHelper($("#currentCellText"), ctOptions);
		sys.config = sys.config||{};
		sys.config.backgroundHelper = sys.config.backgroundHelper || [];
		sys.config.backgroundHelper = ctOptions;
		return ctOptions;
	}
	
	if ($("#currentCellTextOptions").length == 0) {
		// initializing
		var $container = $(`<div id='currentCellTextOptions'>
		<div id='currentCellTextOptionsTabs'>
			<ul>
				<li><a href='#currentCellTextOptions_marker'>`+t("标记")+`</a></li>
				<li><a href='#currentCellTextOptions_options'>`+t("选项")+`</a></li>
			</ul>
			<div id='currentCellTextOptions_marker'><div class='ct_marker_container'></div>
				<div class='ct_marker_tools'>
					<button class='ct_marker_tools_add  icon-plus-circled'>添加</button>
					<button class='ct_marker_tools_clear icon-cancel-circled'>全部清除</button>
				</div>
			</div>
			<div id='currentCellTextOptions_options'>
				<div class="dialogSectionBlock">
					<label><input type="checkbox" class="enableAutoComplete" /> <span>启用建议</span></label>
				</div>
			</div>
		</div>
		</div>`);
		
		
		$container.find('.enableAutoComplete').on("input", function() {
			ui.autoCompleteSet($(this).prop('checked'));
			if (ui.autoCompleteIsEnabled() == false) ui.autoCompleteClear();
		})
		
		$("#template").append($container);
		$container.find("#currentCellTextOptionsTabs").tabs();
		
		// drawing tabs content
		var $markerTemplate = $("<div class='ctMarkers'>\
			<label><span class='markerLabel'>"+t("标记")+"</span><span><input type='number' data-type='at' min='0' value='0' class='ctInput ctMarkers_number' /></span></label>\
			<label><span class='markerLabel'>"+t("单位")+"</span><span><select data-type='unit' class='ctInput ctMarkers_unit' ><option value='0'>"+t("半宽度字符 (ie. Alphabet, etc)")+"</option><option value='1'>"+t("全宽字符 (ie. Hiragana, Kanji, 漢字, etc)")+"</option></select></span></label>\
			<label><span class='markerLabel'>"+t("颜色")+"</span><span><input type='color' data-type='color' class='ctInput ctMarkers_color' value='#FF0000' /></span></label>\
			<label class='ctToolbar'><button class='removeMarker icon-cancel-circled'>"+t("去除")+"</button></label>\
		</div>");
		

		
		// events
		$markerTemplate.find(".removeMarker").on("click", function() {
			$(this).closest(".ctMarkers").remove();
			applyChange();
			
		});
		

		$markerTemplate.find(".ctInput").on("input", function() {
			applyChange();
			//console.log("changed");
		});
		
		$container.find(".ct_marker_tools_add").on("click", function(e) {
			var thisTemplate = $markerTemplate.clone(true, true);
			console.log(thisTemplate);
			console.log("marker container", $container.find(".ct_marker_container"));
			$container.find(".ct_marker_container").append(thisTemplate);
		})
		
		$container.find(".ct_marker_tools_clear").on("click", function(e) {
			$container.find(".ct_marker_container").empty();
			applyChange();
		})


		// initializing saved data
		console.log("Initializing saved data", sys.config.backgroundHelper)
		for (var i=0; i<sys.config.backgroundHelper.length; i++) {
			var $thisTemplate = $markerTemplate.clone(true, true);
			$container.find(".ct_marker_container").append($thisTemplate);
			
			$thisTemplate.find(".ctMarkers_number").val(sys.config.backgroundHelper[i].at);
			$thisTemplate.find(".ctMarkers_color").val(sys.config.backgroundHelper[i].color);
			
			console.log("Setting unit : ", sys.config.backgroundHelper[i].unit)
			$thisTemplate.find(".ctMarkers_unit").val(sys.config.backgroundHelper[i].unit);
		}		
		
		// registering popup
		
		$container.dialog({
			autoOpen: false,
			title: t("当前单元格的编辑器选项"),
			modal:false,
			closeOnEscape:true,
			classes: {
				"ui-dialog": "highlight",
				"ui-dialog-titlebar": "hidden"
			},			
			width:$(".cellInfoPartsB").outerWidth(),
			height:Math.round($(window).height()/100*50),
			minWidth:320,
			minHeight:320,
			position: {
				my: "right bottom",
				at: "right top",
				of: ".cellInfoPartsB"
			},
			show: {
				effect: "slide",
				direction: "down",
				duration: 200
			},
			hide: {
				effect: "slide",
				direction: "down",
				duration: 200
			},
			close: function( event, ui ) {
				//console.log("closed");
				sys.saveConfig();
			},
			buttons:[
				{
					text: t("确定"),
					icon: "ui-icon-close",
					click: function() {
						$(this).dialog( "close" );
					}
				}
			]
		});	
		$container.addClass("initialized");
		
	}
	
	var $container = $("#currentCellTextOptions");
	trans.project.options = trans.project.options || {}
	$container.find('.enableAutoComplete').prop('checked', ui.autoCompleteGet())
	//$container.closest(".ui-dialog").addClass("hidden");
	$container.dialog( "option", "position", { my: "right bottom", at: "right top", of: ".cellInfoPartsB" } );
	$container.dialog( "option", "width", $(".cellInfoPartsB").outerWidth() );
	$container.dialog("open");

	return $container;
	
	
}


ui.calculateFontWidth = function($elm, unitType) {
	$elm = $elm || $("#currentCellText");
	//console.log("calculateFontWidth", arguments);
	unitType = parseInt(unitType) || 0;
	var font = "E";
	if (Boolean(unitType)) font = "字";
	//console.log(font);
	if ($("#fontSampler__").length == 0) {
		var $dummyElm = $("<div id='fontSampler__' style='position:absolute; top:-1000; left: -1000;'>"+font+"</div>");
	} else {
		var $dummyElm = $("#fontSampler__");
	}
	
	$dummyElm.css("font-family", $elm.css("font-family"))
			.css("font-size", $elm.css("font-size"))
			.css("font-weight", $elm.css("font-weight"))
			.css("padding", "0px")
			.css("top", "-999px")
			.css("left", "-999px")
			.css("position", "absolute")
				
	//var calculatedWidth = $dummyElm.appendTo("body").width()/1;
	var calculatedWidth = $dummyElm.appendTo($elm.parent()).width()/1;
	//console.log("dummy elm total width : ", $dummyElm.width());
	$dummyElm.remove();
	//console.log("font size : ", $elm.css("font-size"));
	//console.log("font weight : ", $elm.css("font-weight"));
	//console.log(calculatedWidth);	
	return calculatedWidth;
}

ui.calculateFontHeight = function($elm) {
	$elm = $elm || $("#currentCellText");
	if ($("#fontSampler__").length == 0) {
		var $dummyElm = $("<div id='fontSampler__' style='position:absolute; top:-1000; left: -1000;'>ABC<br />ABC<br />ABC<br />ABC<br />ABC<br />ABC<br />ABC<br />ABC<br />ABC<br />ABC</div>");
	} else {
		var $dummyElm = $("#fontSampler__");
	}
	
	$dummyElm.css("font-family", $elm.css("font-family"))
			.css("font-size", $elm.css("font-size"))
			.css("font-weight", $elm.css("font-weight"))
			.css("line-height", $elm.css("line-height"))
			.css("padding", "0px")
			.css("top", "-999px")
			.css("left", "-999px")
			.css("position", "absolute")
				
	//var calculatedHeight = $dummyElm.appendTo("body").innerHeight()/10;
	var calculatedHeight = $dummyElm.appendTo($elm.parent()).innerHeight()/10;
	$dummyElm.remove();
	
	return calculatedHeight;
}

ui.clearBackgroundNumber = function($target) {
	$target = $target||$("#currentCellText");
	$target.css("background-image", "none");
	$target.css("background-repeat", "no-repeat");
	$target.css("background-attachment", "local");
	$target.css("padding-left", "4px");	
}

ui.generateBackgroundNumber = function($target, maxLine, force) {
	if ($("button.wordWrap").hasClass("checked") == false) {
		ui.clearBackgroundNumber();
		return;
	}
	
	$target = $target||$("#currentCellText");
	force = force || false;
	this._cache = this._cache || {};
	this._cache.bgNumbersSVG = this._cache.bgNumbersSVG || {};
	
	//var padding = 2;
	maxLine = maxLine || $target.val().split("\n").length || 100;
	let fontFamily =$target.css("font-family");
	let lineHeight =$target.css("line-height");
	let fontSize =$target.css("font-size");
	let paddingTop =$target.css("padding-top");
	let fontWeight =$target.css("font-weight");
	let intPaddingTop = parseInt($target.css("padding-top"));
	var marginLeft = "8";
	

	
	var aspect = $target.css("font-size");
	if (Boolean(this._cache.bgNumbersSVG[maxLine+"-"+aspect]) == false || force == true) {

		var calculatedHeight = ui.calculateFontHeight($target);
		var adjustment = -((calculatedHeight/2)-6);
		var textContent = "";
		for (var i=0; i<maxLine; i++) {
			var drawedLine = i+1;
			var thisCoord = ((calculatedHeight*i)+calculatedHeight+intPaddingTop)+adjustment;
			//console.log("drawing: "+' <text x="'+marginLeft+'" y="'+thisCoord+'px"> '+drawedLine+'</text>\n');
			textContent += ' <text fill="#888888" x="'+marginLeft+'" y="'+thisCoord+'px"> '+drawedLine+'</text>\n';
		}
		var height = thisCoord+1000;
		
		var svg = '<svg xmlns="http://www.w3.org/2000/svg" height="'+height+'" width="45px">\
		<style>\
			/* <![CDATA[ */\
			text {\
				fill:"red";\
				font-size: 11pt;\
				font-family: "Courier New";\
				background-color: "#ff0000";\
			}\
			/* ]]> */\
		</style>\
			<rect width="40px" height="'+height+'" style="fill:rgba(255,255,255,.1)" />\
			'+textContent+'\
		  	<line x1="40px" y1="0" x2="40px" y2="'+height+'" style="stroke:rgba(128,128,128,1);stroke-width:1" />\
		</svg>';
		var svgEncoded = btoa(svg);
		this._cache.bgNumbersSVG[maxLine+"-"+aspect] = svgEncoded;
	} else {
		var svgEncoded = this._cache.bgNumbersSVG[maxLine+"-"+aspect];
	}

	var svgBody = "url('data:image/svg+xml;base64,"+svgEncoded+"')";
	
	ui.appendBackground($target, {
		"background-image" : svgBody,
		"background-repeat" : "no-repeat", 
		"background-attachment" : "local"
	}, 0);
	
	$target.css("padding-left", "48px");

}

ui.createBackgroundNumberDelayed = function(delay, force) {
	var $that = $("#currentCellText");

	delay = delay || 200;
	ui._cache = ui._cache || {};
	ui._cache.lastCellLineNumber = ui._cache.lastCellLineNumber || 0;
	if (ui._cache.bgNumberProcessing) {
		clearTimeout(ui._cache.bgNumberProcessing);
		ui._cache.bgNumberProcessing = setTimeout(function() {
			
			var currentLineNumber = $that.val().split("\n").length;
			if (ui._cache.lastCellLineNumber !== currentLineNumber) {
				ui._cache.lastCellLineNumber = currentLineNumber;
				ui.generateBackgroundNumber($that, currentLineNumber);
			}
			
			//console.log("input delayer triggered");
			ui._cache.bgNumberProcessing = undefined;
		}, delay);		

		return;
	}
	
	ui._cache.bgNumberProcessing = setTimeout(function() {
		
		var currentLineNumber = $that.val().split("\n").length;
		if (ui._cache.lastCellLineNumber !== currentLineNumber) {
			ui._cache.lastCellLineNumber = currentLineNumber;
			ui.generateBackgroundNumber($that, currentLineNumber);
			
		}
		
		//console.log("input delayer triggered");
		ui._cache.bgNumberProcessing = undefined;
	}, delay);
	

}

ui.clearBackgroundHelper = function($target) {
	$target = $target || $("#currentCellText");
	ui.appendBackground($("#currentCellText"), {
		"background-image" : "none",
		"background-repeat" : "repeat-y", 
		"background-attachment" : "local",
		"background-position": "0px 0px"
	}, 1);	

}

ui.createBackgroundHelper = function($target, atText) {
	$target = $target || $("#currentCellText");
	//atText = atText||1;
	if (typeof atText == 'number') {
		atText = [{
			at:atText,
			color:"rgba(255,0,0,0.5)",
			unit:0
		}];
	}
	
	if (atText.length < 1) {
		ui.clearBackgroundHelper();
		return;
	}
	
	var initialPadding = parseInt($("#currentCellText").css("padding-left"))||48;
	if ($(".currentCellTextCtrl .wordWrap").hasClass("checked")) {
		initialPadding = 48;
	}
	var fontWidth = [];

	var maxWidth = 200;
	var svgLine = "";
	for (var i=0; i<atText.length; i++) {
		var thisUnit = atText[i].unit || 0;
		fontWidth[thisUnit] = fontWidth[thisUnit] || ui.calculateFontWidth($target, thisUnit);
		var rangeLeft = (fontWidth[thisUnit]*atText[i].at)-1;
		if (maxWidth < rangeLeft+200 ) maxWidth = rangeLeft+200;
		
		console.log("rangeLeft", "("+fontWidth[thisUnit]+"*"+atText[i].at+")");
		atText[i].color = atText[i].color||"rgba(255,0,0,0.5)";
		svgLine += '<line x1="'+rangeLeft+'" y1="0" x2="'+rangeLeft+'" y2="200" style="stroke:'+atText[i].color+';stroke-width:1" stroke-dasharray="4 1" />\n';
	}
	
	var svg = '<svg  xmlns="http://www.w3.org/2000/svg" height="200" width="'+maxWidth+'">\n\
	<line x1="0" y1="0" x2="0" y2="200" style="stroke:rgba(128,128,128,1);stroke-width:1" stroke-dasharray="4 1" />\n\
	'+svgLine+'\n\
	</svg>'
//	console.log(svg);
	var svgEncoded = btoa(svg);	
	var svgBody = "url('data:image/svg+xml;base64,"+svgEncoded+"')";
	
	
	ui.appendBackground($target, {
		"background-image" : svgBody,
		"background-repeat" : "repeat-y", 
		"background-attachment" : "local",
		"background-position": initialPadding+"px 0px"
	}, 1);	
}

ui.backgroundHelperInitialize = function(conf) {
	// load config to background helper
	if (this.backgroundHelperIsInitialized) return;
	sys.config = sys.config || {};
	sys.config.backgroundHelper = sys.config.backgroundHelper || {};
	conf = conf || sys.config.backgroundHelper ||[];
	
	if (Array.isArray(conf) == false) return;
	ui.createBackgroundNumberDelayed();

	ui.createBackgroundHelper( $("#currentCellText"), conf);
	this.backgroundHelperIsInitialized = true;
	
}

ui.redrawBackgroundHelper = function() {
	sys.config = sys.config || {};
	sys.config.backgroundHelper = sys.config.backgroundHelper || {};
	var conf = conf || sys.config.backgroundHelper ||[];	
	if (Array.isArray(conf) == false) return;
	ui.createBackgroundNumberDelayed();

	ui.createBackgroundHelper( $("#currentCellText"), conf);	
}

ui.appendBackground = function($target, bgOptions, layer) {
	if ($target.length <  1) return $target;
	bgOptions = bgOptions||{};
	layer = layer||0;
	if (Boolean(bgOptions['background-image']) == false) return $target;
	
	var pseudoName = "bgPseudo_"+$target.attr("id");
	var $pseudoElm = $("#"+pseudoName);
	if ($pseudoElm.length == 0) {
		$pseudoElm = $("<style id='"+pseudoName+"'></style>");
		$("body").append($pseudoElm);
	}
	
	
	//console.log("pass here");
	var cssBG = $target.data("cssBG") || {};
	for (bgObject in bgOptions) {
		cssBG[bgObject] = cssBG[bgObject]||[];
		cssBG[bgObject][layer] = bgOptions[bgObject];
	}
	
	// determine the length of cssBG
	var maxLength = cssBG['background-image'].length;
	//console.log("maxLength", maxLength);
	// fill the gap
	for (var index =0; index<maxLength; index++) {
		//console.log('background-image', index, cssBG['background-image'][index]);
		if (Boolean(cssBG['background-image'][index])) continue;
		cssBG['background-image'][index] = "none";
	}
	if (cssBG['background-position']) {
		for (var index =0; index<maxLength; index++) {
			if (Boolean(cssBG['background-position'][index])) continue;
			cssBG['background-position'][index] = "0px 0px";
		}	
	}	
	if (cssBG['background-repeat']) {
		for (var index =0; index<maxLength; index++) {
			if (Boolean(cssBG['background-repeat'][index])) continue;
			cssBG['background-repeat'][index] = "no-repeat";
		}	
	}

	// others
	for (bgObject in cssBG) {
		if (Array.isArray(cssBG[bgObject]) == false ) continue;
		if (bgObject == 'background-image' || bgObject == 'background-position' || bgObject == 'background-repeat') continue;
		for (var index =0; index<maxLength; index++) {
			if (Boolean(cssBG[bgObject][index])) continue;
			cssBG[bgObject][index] = "unset";
		}
	}	
	
	$target.data("cssBG", cssBG);
	
	
	//console.log("cssBG : ", cssBG);
	var cssText = "";
	for (bgObject in cssBG) {
		if (Array.isArray(cssBG[bgObject]) == false ) continue;
		//console.log("Setting : ", bgObject, "value : ", cssBG[bgObject].join(","));
		$target.css(bgObject, cssBG[bgObject].join(","));
		//cssText += bgObject+":"+cssBG[bgObject].join(",")+";"
	}
	//console.log("#"+pseudoName+"{"+cssText+"}");
	//$pseudoElm.html("#"+$target.attr("id")+"{"+cssText+"}");
	
}

// ==============================================================
// Term of use WINDOW
// ==============================================================
ui.openToU = function(options) {
	options = options||{};
	if ($("#ToU").length == 0) {
		// initializing
		$("#template").append('<div id="ToU">\
			<div class="dialogGuide"><img src="img/guide-padding.png"></div>\
			<div class="dialogContent">\
			<h2>目标列</h2>\
			<div class="columnSelector"></div>\
			</div>\
		</div>');
		
		var $container = $("#ToU");
		
		
		$container.dialog({
			autoOpen: false,
			title: t("自动填充"),
			modal:true,
			width:Math.round($(window).width()-80),
			height:Math.round($(window).height()-80),
			minWidth:600,
			minHeight:460,
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
					text: t("取消"),
					icon: "ui-icon-close",
					click: function() {
						$(this).dialog( "close" );
					}
				},
				{
					text: t("确定"),
					icon: "ui-icon-close",
					click: function() {
						var selectedValue = $("#ToU select").val();
						if (Array.isArray(selectedValue) == false) return alert(t("请选择一列"));
						
						var confirmation = confirm(t("是否确实要在选定列上添加？\n此操作无法撤消！"));
						if (confirmation) {
							ui.showBusyOverlay();
							var selectedFile = trans.getCheckedFiles();
							if (selectedFile.length == 0) selectedFile = trans.getAllFiles();
							
							trans.paddingTranslation(selectedFile, selectedValue);
							$(this).dialog("close");
							ui.hideBusyOverlay();
						}
					}
				}
			]
		});	
	}
	
	var $container = $("#ToU");
	$container.find(".columnSelector").html(ui.generateColMultiSelector({skipFirstCol:true}));
	$container.dialog("open");
	return $container;
	
}

// ==============================================================
//
// 			F R E E  E D I T I N G   C O M P O N E N T
//
// ==============================================================

ui.generateDirSelector = function() {
	$container = $("#directoryList");
	if (!trans.project) return;
	if (!trans.project.files) return;
	var reg = {};
	for (var filename in trans.project.files) {
		if (!trans.project.files[filename].dirname) continue;
		if (reg[trans.project.files[filename].dirname]) continue;
		reg[trans.project.files[filename].dirname] = true;
		$template = $('<option value="'+common.htmlEntities(trans.project.files[filename].dirname)+'">')
		$container.append($template);
	}
	return $container;
}

ui.addNewObjectDialog = function(defaultDir, options) {
	options = options || {};
	$dialog = $("#dialogAddObject");
	defaultDir = defaultDir || ""
	$("#addObjDirName").val(defaultDir);
	ui.generateDirSelector();
	if ($dialog.hasClass("initialized") == false) {
		$dialog.dialog({
			autoOpen: false,
			modal:true,
			//width:Math.round($(window).width()/100*80),
			//height:Math.round($(window).height()/100*80),
			width:800,
			height:460,
			minWidth:600,
			minHeight:460,
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
					text: t("取消"),
					icon: "ui-icon-close",
					click: function() {
						$(this).dialog( "close" );
					}
				},			
				{
					text: t("创建"),
					icon: "ui-icon-plus",
					click: function() {
						var filename = $('#addObjName').val()
						var dirname = $('#addObjDirName').val()
						var options = {}
						
						var result = trans.createFile(filename, dirname, options);
						if (result.error) return alert(result.msg);
						$(this).dialog( "close" );
						
					}
				}

			]
		});	
		$dialog.addClass("initialized");
	}
	
	$dialog.dialog("open");
	return $dialog;		
	
}

// ==============================================================
//
// 						M A I N   M E N U
//
// ==============================================================
ui.MainMenu = function() {

}

ui.MainMenu.prototype.drawRecentFiles = function() {
	if (typeof sys.config == 'undefined') return false;
	if (typeof sys.config.historyOpenedFiles == 'undefined') return false;
	
	var childTemplate = $("#mainMenu .recentFiles ul li").eq(0).clone(true, true);
	childTemplate.removeClass("ui-state-disabled");
	$("#mainMenu .recentFiles ul").empty();

	for (var id=0; id<sys.config.historyOpenedFiles.length; id++) {
		var thisTemplate = childTemplate.clone(true, true);
		//console.log(sys.config.historyOpenedFiles[id].path);
		thisTemplate.removeAttr("id");
		var num = id+1;
		thisTemplate.find("div").text(num+": "+common.cropLongText(sys.config.historyOpenedFiles[id].path, 70));
		thisTemplate.attr("title", sys.config.historyOpenedFiles[id].path);
		thisTemplate.data("id", id);
		$("#mainMenu .recentFiles ul").append(thisTemplate);
	}
}


ui.MainMenu.prototype.open = function() {
	if ($("#mainMenu").hasClass("rendered") == false) {
		this.init();
	} else {
		this.drawRecentFiles();
		$("#mainMenu").menu( "refresh" );
	}
	
	
	$("#mainMenu").removeClass("hidden");
	$("#mainMenu").show({
		effect:"fade",
		duration:100
	});
	
	$("#button-translatorplus").addClass("active");
	
	$(document).on("mouseup.mainmenu", function(e) {
		var container = $("#mainMenu");
		if (!container.is(e.target) && container.has(e.target).length === 0) {
			//container.addClass("hidden");
			//ui.closeMainMenu();
			ui.mainMenu.close();
			$(document).off("mouseup.mainmenu");
		}
	});		
}

ui.MainMenu.prototype.close = function() {
	$("#button-translatorplus").removeClass("active");

	$("#mainMenu").menu("collapseAll");
	$("#mainMenu").hide({
		effect:"fade",
		duration:100
	});
}

/**
 * @param  {} key
 * @param  {} object
 * {
 * 	id
 *  label
 * }
 */
ui.MainMenu.prototype.addChild = function(parentKey, object) {
	var $rootObj = $("#mainMenu");
	var $thisMenu = $rootObj.find("[data-menuid="+parentKey+"]");
	var $ul = $thisMenu.find(">ul")
	if ($ul.length == 0) {
		$ul = $("<ul></ul>");
		$thisMenu.append($ul);
	}

	var $newMenu = $(`<li><div>${object.label}</div></li>`);
	if (object.id) $newMenu.attr("data-menuid", object.id);
	$ul.append($newMenu);

	return $newMenu;
}

ui.MainMenu.prototype.addBefore = function(siblingKey, object) {
	var $rootObj = $("#mainMenu");
	var $thisMenu = $rootObj.find("[data-menuid="+siblingKey+"]");

	var $newMenu = $(`<li><div>${object.label}</div></li>`);
	if (object.id) $newMenu.attr("data-menuid", object.id);
	$thisMenu.before($newMenu);

	return $newMenu;
}

ui.MainMenu.prototype.addAfter = function(siblingKey, object) {
	var $rootObj = $("#mainMenu");
	var $thisMenu = $rootObj.find("[data-menuid="+siblingKey+"]");

	var $newMenu = $(`<li><div>${object.label}</div></li>`);
	if (object.id) $newMenu.attr("data-menuid", object.id);
	$thisMenu.after($newMenu);

	return $newMenu;
}

ui.MainMenu.prototype.unInit = function() {
	if ($("#mainMenu").hasClass("rendered") == false) return;
	$mainMenu = $("#mainMenu");
	$mainMenu.menu("destroy");
	$mainMenu.removeClass("rendered");
}


ui.MainMenu.prototype.init = function() {
	if ($("#mainMenu").hasClass("rendered") == true) return false;
	this.drawRecentFiles();
	$("#mainMenu").removeClass("hidden");
	$("#mainMenu").menu({
		position: { 
			my: "right top", 
			at: "left+5 top"
		},
		select: function(e, thisUi) {
			console.log("menu selected");
			console.log(arguments);
			if (thisUi.item.hasClass('ui-state-disabled')) return false;
			if (thisUi.item.find(".ui-menu").length == 0) ui.mainMenu.close();
			
			if (thisUi.item.attr("data-delegate")) {
				$(thisUi.item.attr("data-delegate")).trigger("click");
				return true;
			}
			
			var initiate = thisUi.item.attr("data-initiate");
			switch(initiate) {
				case "openHistory" :
					if (typeof thisUi.item.data('id') == 'undefined') return alert(t("无法打开该文件！"));
					if (typeof sys.config.historyOpenedFiles[thisUi.item.data('id')] == 'undefined') return alert(t("无法打开该文件！"));
					var thisInfo = sys.config.historyOpenedFiles[thisUi.item.data('id')];
					var conf = confirm("打开"+thisInfo.path+"？\n标题："+thisInfo.gameTitle);
					if (conf) {
						sys.loadFileHistory(thisUi.item.data('id'));
					}
				break;
				case "wordwrap" :
					ui.batchWrapingDialog();
				break;
				case "trim" :
					ui.openTrimWindow();
				break;
				case "padding" :
					ui.openPaddingWindow();
				break;
				case "importSpreadsheet":
					ui.openImportSpreadsheetDialog();
				break;
				case "importRPGMTrans":
					ui.openImportRPGMTransDialog();
				break;
				case "closeProject":
					var conf = confirm(t("你确定要关闭该项目吗？\n您将丢失所有未保存的更改！"));
					if (!conf) return;
					trans.closeProject();
				break;
				case "exit" :
					var conf = confirm(t("是否确实要退出Translator++？\n您将丢失所有未保存的更改！"));
					if (!conf) return;
					window.close();
				break;
				
			}

			$(thisUi.item).trigger("select", thisUi);
			
		}
	});	
	$("#mainMenu").hide();
	$("#mainMenu").addClass("rendered");	
}
ui.mainMenu = new ui.MainMenu();


/*
ui.drawMainMenuRecent = function() {
	if (typeof sys.config == 'undefined') return false;
	if (typeof sys.config.historyOpenedFiles == 'undefined') return false;
	
	var childTemplate = $("#mainMenu .recentFiles ul li").eq(0).clone(true, true);
	childTemplate.removeClass("ui-state-disabled");
	$("#mainMenu .recentFiles ul").empty();

	for (var id=0; id<sys.config.historyOpenedFiles.length; id++) {
		var thisTemplate = childTemplate.clone(true, true);
		//console.log(sys.config.historyOpenedFiles[id].path);
		thisTemplate.removeAttr("id");
		var num = id+1;
		thisTemplate.find("div").text(num+": "+common.cropLongText(sys.config.historyOpenedFiles[id].path, 70));
		thisTemplate.attr("title", sys.config.historyOpenedFiles[id].path);
		thisTemplate.data("id", id);
		$("#mainMenu .recentFiles ul").append(thisTemplate);
	}
}

ui.mainMenuAdd = function() {

}

ui.uninitMainMenu = function() {
	if ($("#mainMenu").hasClass("rendered") == false) return;
	$mainMenu = $("#mainMenu");
	$mainMenu.menu("destroy");
	$mainMenu.removeClass("rendered");
}

ui.initMainMenu = function() {
	if ($("#mainMenu").hasClass("rendered") == true) return false;
	ui.drawMainMenuRecent();
	$("#mainMenu").removeClass("hidden");
	$("#mainMenu").menu({
		position: { 
			my: "right top", 
			at: "left+5 top"
		},
		select: function(e, thisUi) {
			console.log("menu selected");
			console.log(arguments);
			if (thisUi.item.hasClass('ui-state-disabled')) return false;
			if (thisUi.item.find(".ui-menu").length == 0) ui.closeMainMenu();
			
			if (thisUi.item.attr("data-delegate")) {
				$(thisUi.item.attr("data-delegate")).trigger("click");
				return true;
			}
			
			var initiate = thisUi.item.attr("data-initiate");
			switch(initiate) {
				case "openHistory" :
					if (typeof thisUi.item.data('id') == 'undefined') return alert(t("Unable to open that file!"));
					if (typeof sys.config.historyOpenedFiles[thisUi.item.data('id')] == 'undefined') return alert(t("Unable to open that file!"));
					var thisInfo = sys.config.historyOpenedFiles[thisUi.item.data('id')];
					var conf = confirm("Open "+thisInfo.path+"?\nTitle: "+thisInfo.gameTitle);
					if (conf) {
						sys.loadFileHistory(thisUi.item.data('id'));
					}
				break;
				case "wordwrap" :
					ui.batchWrapingDialog();
				break;
				case "trim" :
					ui.openTrimWindow();
				break;
				case "padding" :
					ui.openPaddingWindow();
				break;
				case "importSpreadsheet":
					ui.openImportSpreadsheetDialog();
				break;
				case "importRPGMTrans":
					ui.openImportRPGMTransDialog();
				break;
				case "exit" :
					window.close();
				break;
				
			}

			$(thisUi.item).trigger("select", thisUi);
			
		}
	});	
	$("#mainMenu").hide();
	$("#mainMenu").addClass("rendered");
}

ui.openMainMenu = function() {
	if ($("#mainMenu").hasClass("rendered") == false) {
		ui.initMainMenu();
	} else {
		ui.drawMainMenuRecent();
		$("#mainMenu").menu( "refresh" );
	}
	
	
	$("#mainMenu").removeClass("hidden");
	$("#mainMenu").show({
		effect:"fade",
		duration:100
	});
	
	
	$(document).on("mouseup.mainmenu", function(e) {
		var container = $("#mainMenu");
		if (!container.is(e.target) && container.has(e.target).length === 0) {
			//container.addClass("hidden");
			ui.closeMainMenu();
			$(document).off("mouseup.mainmenu");
		}
	});		
}

ui.closeMainMenu = function() {
	$("#mainMenu").menu("collapseAll");
	$("#mainMenu").hide({
		effect:"fade",
		duration:100
	});
}
*/

ui.getCurrentEditedCellElm = function() {
	if (typeof trans.lastSelectedCell == 'undefined') return false;
	if (ui.isRowVisible(trans.lastSelectedCell[0]) == false) return false;
	
	var rowOffset = trans.lastSelectedCell[0]-trans.grid.rowOffset();
	var colOffset = trans.lastSelectedCell[1]-trans.grid.colOffset();
	ui.selectedCell = $(".ht_master .htCore tbody tr").eq(rowOffset).find("td").eq(colOffset);
	return ui.selectedCell;
	
}


ui.togglePreWhitespaces = function(toggle) {
	if ($("#css_togglePreWhitespaces").length == 0) {
		$("head").append($('<style id="css_togglePreWhitespaces"></style>'))
	}
	var cssElm = $("#css_togglePreWhitespaces");
	sys.config.wordWrapTable = sys.config.wordWrapTable||false;

	
	if (typeof toggle == 'undefined') {
		if (cssElm.hasClass("active")) {
			toggle = false;
		} else {
			toggle = true;
		}		
	}
	
	if (Boolean(toggle) == false) {
		cssElm.text("#table tbody td {  }");
		cssElm.removeClass("active");
		trans.grid.render()
		$(".menu-button.wordWrapTable").removeClass("checked");
		sys.config.wordWrapTable = false;
		return false;
	} else {
		cssElm.text("#table tbody td { white-space: pre; }");
		cssElm.addClass("active");
		trans.grid.render()
		$(".menu-button.wordWrapTable").addClass("checked");
		
		sys.config.wordWrapTable = true;

		return true;
	}
}

ui.toggleMonoSpace = function(toggle) {
	if ($("#css_toggleMonoSpace").length == 0) {
		$("head").append($('<style id="css_toggleMonoSpace"></style>'))
	}
	var cssElm = $("#css_toggleMonoSpace");
	sys.config.monoSpaceTable = sys.config.monoSpaceTable||false;

	
	if (typeof toggle == 'undefined') {
		if (cssElm.hasClass("active")) {
			toggle = false;
		} else {
			toggle = true;
		}		
	}
	
	if (Boolean(toggle) == false) {
		cssElm.text("#table tbody td {  }");
		cssElm.removeClass("active");
		trans.grid.render();

		sys.config.monoSpaceTable = false;
		$(".menu-button.monospace").removeClass("checked");		
		return false;
	} else {
		//cssElm.text("#table tbody td { font-family: monospace; }");
		cssElm.text("#table tbody td { font-family: mPlusRegular; }");
		cssElm.addClass("active");
		$("body").one("mouseover", function() {
			trans.grid.render();
		})		
		trans.grid.render();
		sys.config.monoSpaceTable = true;
		$(".menu-button.monospace").addClass("checked");
		return true;
	}
	
}



ui.renderColorTagSelector = function($selector) {
	$selector = $selector||$(".colorTagSelector");
	if ($selector.hasClass("rendered")) return $selector;
	
	for (var colorName in consts.tagColor) {
		var $temp = $('<input type="checkbox" value="'+colorName+'" />');
		$temp.addClass("colorTagSelector tagSelector");
		$temp.addClass(colorName);
		$temp.css("background-color", consts.tagColor[colorName]);
		$temp.attr("title", colorName)
		$temp.attr("name", "tagSelector");
		$selector.append($temp);
	}
	$selector.addClass("rendered")
	return $selector;
}


ui.blurAll = function() {
	$(".toolbar, .panel-wrapper, #cellSelectionInfo, .footer").addClass("blur");
}

ui.unBlurAll = function() {
	$(".toolbar, .panel-wrapper, #cellSelectionInfo, .footer").removeClass("blur");
	
}


ui.pathNotAccessibleDialog = function() {
	if ($("#pathNotAccessible").hasClass("initialized") == false) {
		$("#pathNotAccessible").dialog({
			autoOpen: false,
			modal:true,
			minWidth:480,
			minHeight:320,
			maxWidth:640,
			maxHeight:420,			
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
				}

			]			
		});	
		$("#pathNotAccessible").addClass("initialized");
	}
	
	$("#pathNotAccessible").dialog("open");
	return $("#pathNotAccessible");
}


// ===========================================================
// New project class
// ===========================================================

ui.showPopup = async function(name, content, options) {
	this.popups 		= this.popups||{};
	this.popups[name] 	= this.popups[name] 
	options 			= options||{};
	options.onDone 		= options.onDone||function(){}
	options.title 		= options.title||"信息";
	options.allExternal	= options.allExternal || false; // makes all a elm to open in external browser
	options.HTMLcleanup = options.HTMLcleanup || false; // cleanup HTML data from unsave tags
	options.rebuild		= options.rebuild || false;
	options.onClose		= options.onClose || function(){}
	options.isUnpreventable = options.isUnpreventable || false;
	
	options.buttons 		= options.buttons || [
				{
					text: "关闭",
					icon: "ui-icon-close",
					click: function() {
						$(this).dialog( "close" );
					}
				}
			]
	
	sys.config.popupData = sys.config.popupData||{};
	sys.config.popupData[name] = sys.config.popupData[name]||{};
	
	
	var thisID = "popup_"+name;
	
	if ($("#"+thisID).length == 0 || options.rebuild == true) {
		if ($("#"+thisID).length > 0) $("#"+thisID).remove();

		$("#template").append("<div id='"+thisID+"' data-popupid='"+thisID+"' class='"+thisID+" autoPopupGenerator'>\
				<div class='popupContent'></div>\
				</div>");
		$("#"+thisID).data("name", name);
		$("#"+thisID).dialog({
			autoOpen: false,
			modal:true,
			title:options.title||"信息",
			width:options.width||Math.round($(window).width()/100*50),
			height:options.height||Math.round($(window).height()/100*60),
			minWidth:options.minWidth||640,
			minHeight:options.minHeight||320,
			classes:options.classes,
			show: {
				effect: "fade",
				duration: 200
			},
			hide: {
				effect: "fade",
				duration: 200
			},
			close: function( event, ui ) {
				// window closed
				var $thisPopup = $(this);
				var thisName = $(this).data('name');
				if (typeof options.onClose == "function") options.onClose.call(this);
				if ($thisPopup.closest('.ui-dialog').find(".doNotShowAgain").prop("checked")) {
					console.log("do not show again is checked");
					console.log(thisName);
					sys.config.popupData[thisName] = sys.config.popupData[thisName] || {};
					sys.config.popupData[thisName].isDeny = true;
					sys.saveConfig();
				}
			},
			buttons:options.buttons
		});	
		
		var $toolBar = $("<div class='popupToolbar'><label><input type='checkbox' class='doNotShowAgain' /> "+t("不要再显示此消息！")+"</label></div>");
		var $thisDialog = $("[aria-describedby='"+CSS.escape(thisID)+"']");
		$thisDialog.find(".ui-dialog-title").prepend("<span class='icon-info-circled-1'></span>");
		$thisDialog.addClass("popup generatedPopup");
		$thisDialog.find(".ui-dialog-buttonpane").prepend($toolBar);
		
		if (Boolean(sys.config.popupData[name].isDeny) == true) $toolBar.find(".doNotShowAgain").prop("checked", true)
		$toolBar.find(".doNotShowAgain").off("change")	
		$toolBar.find(".doNotShowAgain").on("change", function() {
			//var name = $(this).closest(".autoPopupGenerator").data("name");
			sys.config.popupData[name].isDeny = $(this).prop("checked")
			sys.saveConfig();
		})
		
		if (options.isUnpreventable) $toolBar.addClass("hidden");
		

	} 
	
	$("#"+thisID).data("onClose", options.onDone);
	if (options.HTMLcleanup) {
		var $content = $(content);
		$content.find("style, script, iframe, webview").remove();
		$("#"+thisID).find(".popupContent").html($content);
	} else {
		$("#"+thisID).find(".popupContent").html(content);
	}
	
	if (options.allExternal) {
		$("#"+thisID).find(".popupContent a").off("click")
		$("#"+thisID).find(".popupContent a").on("click", function(e) {
			var href = $(this).attr("href");
			if (href[0] == "#") return;
			e.preventDefault();
			nw.Shell.openExternal($(this).attr("href"));
		})
	} else {
		$("#"+thisID).find("a.externalLink, a[external]").on("click", function(e) {
			e.preventDefault();
			nw.Shell.openExternal($(this).attr("href"));
		})
	}
	/*
	$("#"+thisID).find("a.externalLink, a[external]").on("click", function(e) {
		e.preventDefault();
		nw.Shell.openExternal($(this).attr("href"));
	})
	*/
	if (Boolean(sys.config.popupData[name].isDeny)==true && Boolean(options.force) == false) {
		console.log("Popup '"+name+"' is denied by user!");
		return $("#"+thisID)
	}
	
	
	return new Promise((resolve, reject) => {
		$("#"+thisID).dialog("open");
		$("#"+thisID).one( "dialogclose", function( event, ui ) {
			resolve($("#"+thisID));
		});
	}) 

}


ui.openFileDialog = function(options) {
	options = options||{};
	options.onSelect = options.onSelect || function(path) { console.log(path)};
	options.accept = options.accept || "";
	options.multiple = options.multiple || false;
	options.dir = options.dir || false;
	options.save = options.save || undefined;
	options.default = options.default  || "";
	
	//$(".__pseudoFileDlg1").remove();
	//var $elm = this.
	var $elm = $("<input type='file' style='display:none' class='hidden __pseudoFileDlg1' />");
	$elm.on("input", function() {
		console.log("some input file");
		var thisVal = $(this).val();
		$(this).remove();
		options.onSelect.call(this, thisVal);
	});
	
	if (options.accept.length > 0) $elm.attr("accept", options.accept)
	if (options.default.length > 0) $elm.attr("nwworkingdir", options.default)
	if (options.dir) $elm.attr("nwdirectory", "nwdirectory")
	if (options.multiple) $elm.attr("multiple", "multiple")
	if (typeof options.save !== 'undefined') $elm.attr("nwsaveas", options.save)
	
	//$("body").append($elm);
	$elm.trigger("click")
}


ui.initFileSelectorDragSelect = function() {
	var DragSelect = DragSelect||require("dragselect");
	window.ds = new DragSelect({
	  selectables: document.getElementsByClassName('data-selector'),
	  autoScrollSpeed: 15,
	  area : document.getElementById("fileList"),
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
				$(this).removeClass("ds-hover");
				$input.prop("checked", true)
				$input.trigger("change");
				ds.clearSelection();
			})
	  }
	});	
}

// ===========================================================
// Toolbar group class
// ===========================================================

ui.Toolbar = function(id, options) {
	if (typeof id == 'object') {
		options = id;
		id = options.id || common.generateId();
	}
	this.options = options || {};
	this.isVisible = this.options.isVisible || false;
	this.buttons = {};
	this.groups = {};
	this.id = id||common.generateId();
	this.defaultGroup = "group0";
	this.init();
}

ui.Toolbar.prototype.onReady = function(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

ui.Toolbar.prototype.init = function(){
	this.onReady(()=> {
		this.container = $(".toolbarGroup")
		
		if (this.container.find(".toolbar[data-id='"+this.id+"']").length > 0) {
			this.elm = this.container.find(".toolbar[data-id='"+this.id+"']");
		} else {
			this.elm = $('<div class="toolbar" data-id="'+this.id+'">')
			if (this.isVisible == false) this.elm.addClass("hidden");
			this.container.append(this.elm);	
		}
		
		if (this.elm.find(".toolbar-content").length == 0) {
			this.addButtonGroup(this.defaultGroup);
		}
		
		this.options.buttons = this.options.buttons || {};
		for (var i in this.options.buttons) {
			//console.log("adding buttons", this.options.buttons[i]);
			this.addButton(this.options.buttons[i]);
		}
	})
}

ui.Toolbar.prototype.addButtonGroup = function(id) {
	this.groups[id] = {
		elm : $('<div class="toolbar-content" data-id="'+id+'"></div>')
	}
	this.elm.append(this.groups[id].elm);
	return this.groups[id];
}

ui.Toolbar.prototype.addButton = function(buttonObj) {
	buttonObj = buttonObj || {};
	buttonObj.id 	= buttonObj.id || common.generateId();
	buttonObj.group = buttonObj.group || this.defaultGroup;
	buttonObj.title = buttonObj.title || "";
	buttonObj.checked = buttonObj.checked || false;
	buttonObj.img 	= buttonObj.img || "";
	buttonObj.icon 	= buttonObj.icon || "";
	buttonObj.elm	= buttonObj.elm || '<button class="menu-button" data-tranattr="title" title="'+buttonObj.title+'"></button>'
	buttonObj.elm 	= $(buttonObj.elm);
	buttonObj.checked = buttonObj.checked || false;
	buttonObj.onClick = buttonObj.onClick || function(){};
	
	if (buttonObj.img !== '') {
		buttonObj.elm.html('<img src="'+buttonObj.img+'" alt="" />')
	} else if (buttonObj.icon !=='') {
		buttonObj.elm.html('<i class="'+buttonObj.icon+'"></i>')
	} else {
		buttonObj.elm.html('<img src="img/transparent.png" alt="" />')
	}
	
	if (buttonObj.checked) buttonObj.elm.addClass('checked');
	
	buttonObj.elm.on("click", function() {
		buttonObj.onClick.apply(this, arguments);
	})
	if (this.buttons[buttonObj.id]) buttonObj.elm.remove();
	
	this.buttons[buttonObj.id] = buttonObj;
	if (!this.groups[buttonObj.group]) return console.warn("无法确定组：", buttonObj.group);
	this.groups[buttonObj.group].elm.append(buttonObj.elm)
	//this.elm.append(buttonObj.elm);	

}

ui.Toolbar.prototype.remove = function() {
	this.elm.remove();
}

ui.Toolbar.prototype.show = function(){
	ui.onDOMReady(()=> {
		this.container.find(".toolbar").addClass("hidden")
		this.elm.removeClass("hidden")
	})
}


// ===========================================================
// Ribbon menu class
// ===========================================================
ui.RibbonMenu = function() {
	var that = this;
	this.container;
	this.ribbons = {};
	this.defaultClickEvt = function() {
		var thisId = $(this).data("id");
		//console.log("clicking, this id : ", thisId);
		that.ribbons[thisId].onClick = that.ribbons[thisId].onClick || function(){}
		ui.ribbonMenu.select($(this), that.ribbons[thisId].onClick);
	}
	this.lastSelected = "";
	this.init();
}

ui.RibbonMenu.prototype.init = function(){
	this.onReady(()=> {
		this.container 	= $("#applicationBar .appActionsLeft");
		
		this.add("start", {
			title : "开始",
			locked : true,
			onClick : function() {
				if ($("#introWindow").not(":visible")) ui.introWindowShow();
			}
		})
		this.add("home", {
			title : "主页",
			locked : true,
			onClick : function() {
				if ($("#introWindow").is(":visible")) ui.introWindowClose();
			},
			toolbar : new ui.Toolbar("home")
		})
		
		
		this.clear();
		
		var $ribbons = $("#applicationBar .ribbonMenu");
		var that = this;
		$ribbons.off("click.ribbonAct");
		$ribbons.on("click.ribbonAct", this.defaultClickEvt);
	})
}

ui.RibbonMenu.prototype.select = function($ribbon, trigger) {
	if (typeof trigger == 'undefined') trigger = true;
	if (typeof $ribbon == 'string') {
		$ribbon = $("#applicationBar .ribbonMenu[data-id='"+$ribbon+"']");
	}
	var thisId = $ribbon.data("id");
	var $ribbons = $("#applicationBar .ribbonMenu");
	$ribbons.removeClass("active");
	$ribbon.addClass("active");
	
	this.lastSelected = thisId;
	
	$(document).trigger("onRibbonSelect", thisId);
	if (trigger == false) return;

	if (this.ribbons[thisId].toolbar) this.ribbons[thisId].toolbar.show();
	if (typeof this.ribbons[thisId].onClick !== 'function') return;
	
	this.ribbons[thisId].onClick.call(this)
}

ui.RibbonMenu.prototype.onReady = function(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

ui.RibbonMenu.prototype.isExist = function(id) {
	if (this.container.find(".ribbonMenu[data-id='"+id+"']").length > 0) return true;
	return false;
}

ui.RibbonMenu.prototype.add = function(id, options) {
	if (typeof id !== "string") return;
	if (id == "") return;
	options 			= options || {};
	options.onClick 	= options.onClick || function(){};
	options.title 		= options.title || options.id;
	if (typeof options.toolbar == 'object' && !(options.toolbar instanceof ui.Toolbar)) {
		options.toolbar = new ui.Toolbar(options.toolbar)
	}
	this.ribbons[id] = options;
	
	this.onReady(()=>{
		var $template = this.container.find(".ribbonMenu[data-id='"+id+"']")
		if ($template.length == 0) {
			$template = $('<div class="ribbonMenu"></div>');
			$template.attr("data-id", id);
			$template.html(options.title);
			this.container.append($template);		
		}
		$template.off("click");
		$template.on("click", this.defaultClickEvt)
		this.ribbons[id].elm = $template;
		
		// select if last selection is this ribbon
		if (this.lastSelected == id) {
			this.select(id);
		}
	})
	
	return this.ribbons[id]
}

ui.RibbonMenu.prototype.remove = function(id) {
	if (!this.ribbons[id]) return;
	if (this.ribbons[id].locked) return;
	
	if (this.ribbons[id].toolbar) {
		this.ribbons[id].toolbar.remove();
	}
	
	delete this.ribbons[id]
	this.container.find(".ribbonMenu[data-id='"+id+"']").remove();
}

ui.RibbonMenu.prototype.clear = function() {
	// remove all
	for (var key in this.ribbons) {
		if (this.ribbons[key].locked) continue;
		this.remove(key);
	}
}

ui.ribbonMenu = new ui.RibbonMenu();

// ===========================================================
// MENU BUTTONS
// ===========================================================

ui.addIconOverlay = function($elm, icon) {
	// add icon overlay into a button
	$elm.addClass('icon-'+icon);
	$elm.addClass('iOverlay');
}

ui.clearIconOverlay = function($elm) {
	$elm.removeClass (function (index, className) {
		return (className.match (/(^|\s)icon-\S+/g) || []).join(' ');
	});
	$elm.removeClass('iOverlay');
}


// ===========================================================
// New project class
// ===========================================================
NewProjectDialog = function($elm) {
	this.onInits = this.onInits||[];
	this.$elm = $elm ;
	this.isInitialized = false;
	this._onInitCreateMenu = [];
	this.slides = {};
}

NewProjectDialog.prototype.init =function() {
	var that = this;
	this.$elm = this.$elm || $("#dialogNewProject");
	if (this.$elm.hasClass("initialized")) {
		this.$elm.dialog( "destroy" );
		this.$elm.removeClass("initialized");
	}
	this.$elm.dialog({
		autoOpen: false,
		modal:true,
		minWidth:480,
		minHeight:320,
		width:Math.round($(window).width()/100*80),
		height:Math.round($(window).height()/100*80),				
		show: {
			effect: "fade",
			duration: 200
		},
		hide: {
			effect: "fade",
			duration: 200
		},
		buttons: [
			{
				text: "取消",
				//icon: "ui-icon-heart",
				click: function() {
					$(this).dialog( "close" );
				}
			}
		]
	});	
	this.reset();
	this.$elm.find("[data-gotoSlide]").each(function() {
		$(this).on("click.slideJumper", function() {
			var targetSlide = $(this).attr("data-gotoSlide");
			console.log("jump to slide", targetSlide);
			if (!Boolean(targetSlide)) return;
			that.gotoSlide(targetSlide, $(this).closest("[data-slideid]").attr("data-slideid"));
		});
	})
	this.$elm.find("form").each(function() {
		$(this).on("submit", function(e) {
			e.preventDefault();
		});
	})
	
	this.$elm.addClass("initialized");
	// execute onInits
	for (var i=0; i<this.onInits.length; i++) {
		if (typeof this.onInits[i] !== 'function') continue;
		try {
			this.onInits[i].apply(this, arguments);
		} catch (e) {
			console.warn(e);
		}
	}	
	this.onInits = [];
	this.isInitialized = true;
	
	if (this._onInitCreateMenu.length > 0) {
		for (var i=0; i<this._onInitCreateMenu.length; i++) {
			this.addMenu(this._onInitCreateMenu[i]);
		}
	}
	
	this.evalEvents();
}

NewProjectDialog.prototype.addMenu = function(options) {
	if (this.isInitialized == false) {
		console.log("this object", this);
		this._onInitCreateMenu.push(options);
		
		return;
	}
	var $mainSlide = this.$elm.find("[data-slideId=1]");
	
	var that = this;
	options = options||{};
	options.icon 			= options.icon || "";
	options.descriptionBar 	= options.descriptionBar || "";
	options.actionBar 		= options.actionBar || [];
	options.goToSlide		= options.goToSlide || 0;
	// slides can be html element, jquery, or object {html: 'html element'}
	options.slides 			= options.slides||{}
	options.at				= options.at||undefined;
	
	options.at = Math.min(options.at, $mainSlide.children().length);
	
	var $slide1 = $('<a href="#" class="dialogSelection" data-gotoSlide="'+options.goToSlide+'">\
	<div class="iconBar"><img src="'+options.icon+'" alt="" /></div>\
	<div class="descriptionBar"></div>\
	<div class="actionBar"></div>\
	</a>');
	$slide1.find(".descriptionBar").append(options.descriptionBar);
	$slide1.find(".actionBar").append(options.actionBar);
	$slide1.on("click.slideJumper", function() {
		var targetSlide = $(this).attr("data-gotoSlide");
		console.log("jump to slide", targetSlide);
		if (!Boolean(targetSlide)) return;
		that.gotoSlide(targetSlide, $(this).closest("[data-slideid]").attr("data-slideid"));
	});	
	
	if (typeof options.at == 'undefined') {
		$mainSlide.append($slide1);
	} else {
		$slide1.insertAt(options.at,$mainSlide)
	}
	
	for (var slideId in options.slides) {
		if (options.slides[slideId] instanceof jQuery) {
			var $content = options.slides[slideId]
			this.newSlide(slideId, $content);
		} else if (options.slides[slideId] instanceof HTMLElement) {
			var $content = $(options.slides[slideId])
			this.newSlide(slideId, $content);
		} else if (typeof options.slides[slideId] == 'object' && Boolean(options.slides[slideId]) == true) {
			this.newSlide(slideId, $(options.slides[slideId].html), options.slides[slideId]);
		}
		/*
		var $currentSlide = this.$elm.find("[data-slideId="+slideId+"]");
		if ($currentSlide.length == 0 ){
			$currentSlide = $('<div class="dialogSection" data-slideid="'+slideId+'">');
			this.$elm.append($currentSlide);
		}
		
		$currentSlide.html(thisSlide);
		*/
		
	}
}

NewProjectDialog.prototype.evalEvents = function() {
	var that 	= this;
	var $thisElm = this.$elm;
	if (this.isInitialized == false) {
		$thisElm = $("#dialogNewProject");
	}	
	$thisElm.find('[data-slideId]').not('.eventRendered').each(function() {
		var $this 	= $(this);
		var thisId 	= $this.attr('data-slideId');
		if (Boolean(that.slides[thisId])==false) return;
		if (Boolean(that.slides[thisId].options)==false) return;
		
		if (typeof that.slides[thisId].options.onActive == 'function') {
			$this.on("active", that.slides[thisId].options.onActive)
		}
		if (typeof that.slides[thisId].options.onBeforeActive == 'function') {
			$this.on("beforeActive", that.slides[thisId].options.onActive)
		}
		if (typeof that.slides[thisId].options.onInactive == 'function') {
			$this.on("inactive", that.slides[thisId].options.onActive)
		}
		$this.addClass("eventRendered");
	});
}

NewProjectDialog.prototype.newSlide = function(slideId, $content, options) {
	if (!Boolean(slideId)) return console.warn("id不能为空");
	options = options || $content.data("options") || {};
		
	var $thisElm = this.$elm;
	if (this.isInitialized == false) {
		$thisElm = $("#dialogNewProject");
	}
	
	var makeSlide = (slideId, $content, options)=> {
		var $currentSlide = $thisElm.find("[data-slideId="+slideId+"]");
		if ($currentSlide.length == 0 ){
			$currentSlide = $('<div class="dialogSection" data-slideid="'+slideId+'">');
			$thisElm.append($currentSlide);
		}
		$currentSlide.empty();
		ui.render($content);
		$currentSlide.append($content);
		this.slides[slideId] = {
			options : options || {},
			html : $currentSlide
		};
		
	}
	makeSlide(slideId, $content, options);
	this.evalEvents();
	
}

NewProjectDialog.prototype.resetNav = function() {
	this.$elm.dialog( "option", "buttons", [{
				text: t("取消"),
				click: function() {
					$(this).dialog( "close" );
				}
			}]);
}

NewProjectDialog.prototype.gotoSlide = function(targetSlide, sourceSlide) {
	if (!Boolean(targetSlide)) return;
	var $previousSlide = this.$elm.find("[data-slideid].active");
	this.$elm.find("[data-slideid].active").trigger("inactive", this);
	var $thisSlide = this.$elm.find("[data-slideid="+targetSlide+"]")
	
	$thisSlide.trigger("beforeActive", this);
	$(document).trigger("newProjectSlideChange", {id:targetSlide, elm:$thisSlide, prev:$previousSlide.attr("[data-slideid]")});
	
	console.log("changing slide : ", targetSlide);
	this.$elm.find("[data-slideid]").addClass("hidden");
	this.$elm.find("[data-slideid]").removeClass("active");
	$thisSlide.removeClass("hidden");
	$thisSlide.addClass("active");
	// cache the path
	if (sourceSlide) {
		$thisSlide.data("previous", sourceSlide)
	}
	
	// running onActive
	console.log("triggering event : 'active' on elm ", $thisSlide);
	$thisSlide.trigger("active", this);
	
	sourceSlide = sourceSlide || $thisSlide.data("previous");
	
	// rendering navigation buttons
	var that = this;
	if (targetSlide == "1") {
		this.resetNav();
		return;
	}
	
	var buttons = []
	if (Boolean(sourceSlide)) {
		buttons.push({
				text: t("返回"),
				click: function() {
					that.gotoSlide(sourceSlide);
				}
			})
	}
	
	buttons.push({
				text: t("取消"),
				click: function() {
					$(this).dialog( "close" );
				}
			});

	if (this.slides[targetSlide]) {
		this.slides[targetSlide].options = this.slides[targetSlide].options ||{}
		if (Array.isArray(this.slides[targetSlide].options.buttons)) {
			buttons = buttons.concat(this.slides[targetSlide].options.buttons)
		}
	}
	
	this.$elm.dialog( "option", "buttons", buttons);	
}	


NewProjectDialog.prototype.reset = function() {
	this.$elm.find("[data-slideid]").addClass("hidden");
	this.$elm.find("[data-slideid]").removeClass("active");
	this.$elm.find("[data-slideid=1]").removeClass("hidden");
	this.$elm.find("[data-slideid=1]").addClass("active");
	this.$elm.dialog( "option", "width", Math.round($(window).width()/100*80));
	this.$elm.dialog( "option", "height", Math.round($(window).height()/100*80));
	this.$elm.dialog( "option", "buttons", 
		[
			{
				text: t("取消"),
				//icon: "ui-icon-heart",
				click: function() {
					$(this).dialog("close");
				}
			}
		]
	);

	this.$elm.find("form").each(function() {
		$(this)[0].reset();
	})
}

NewProjectDialog.prototype.open = function() {
	ui.introWindowClose();
	if (!this.isInitialized) {
		this.init();
	}
	
	this.reset();
	this.$elm.dialog("open");	
}

NewProjectDialog.prototype.close = async function() {
	return new Promise((resolve, reject) => {
		this.$elm.one("dialogclose", function(e, ui) {
			resolve();
		})
		if (this.isInitialized) {
			this.$elm.dialog("close");
		} else {
			resolve();
		}
	})

}

ui.newProjectDialog = new NewProjectDialog();

ui.newProjectDialog.onInits.push(function() {
	
	console.log("start initializing newProjectDialog window");
	// handling file selector
	var $theFld = this.$elm.find(".newSpreadsheetFiles");
	console.log($theFld);
	$theFld.on("change", function() {
		console.log("value changed!");
		console.log($(this).val());
		var thisPaths = $(this).val(); // if more than one file is selected than each file are separated by ";"
		var paths = $(this).val().split(";");
		// get game folder from the folder of the first file.
		console.log(thisPaths, paths);
		var gameFolder = paths[0].match(/(.*)[\/\\]/)[1]||''; 
		trans.procedureCreateProject(gameFolder, {
			selectedFile:thisPaths,
			options: {
				fetchType: $("#dialogNewProject input[name='spreadSheetFetchType']:checked").val(),
				calcValue: $("#dialogNewProject input[name='spreadSheetCalculateValue']").prop("checked"),
				calcFormat: $("#dialogNewProject input[name='spreadSheetCalculateFormatting']").prop("checked")
			}
		});	
		
	});
	// handling folder selector
	var $theFld = this.$elm.find(".newSpreadsheetDir");
	console.log($theFld);
	$theFld.on("change", function() {
		console.log("value changed!");
		console.log($(this).val());
		var thisPaths = $(this).val(); // if more than one file is selected than each file are separated by ";"
		var gameFolder = thisPaths;
		console.log(gameFolder);
		
		trans.procedureCreateProject(gameFolder, {
			selectedFile:thisPaths,
			options: {
				fetchType: $("#dialogNewProject input[name='spreadSheetFetchType']:checked").val(),
				calcValue: $("#dialogNewProject input[name='spreadSheetCalculateValue']").prop("checked"),
				calcFormat: $("#dialogNewProject input[name='spreadSheetCalculateFormatting']").prop("checked")
			}
		});	
		
		
	});	
});


ui.textAreaTabSupport = function(fld) {
	fld = $(fld);
	if (fld.length < 0) return;
	if (fld[0].nodeName !== 'TEXTAREA') return;
	console.log("initializing tab support");
	var enabled = true;
	fld.keydown(function(e) {

		// Escape key toggles tab on/off
		if (e.keyCode==27)
		{
			enabled = !enabled;
			return false;
		}
		//console.log("tab key is pressed");
		if ($(".textcomplete-dropdown").is(":visible")) {
			return false;
		}
				
		// Enter Key?
		if (e.keyCode === 13 && enabled)
		{
			// selection?
			if (this.selectionStart == this.selectionEnd)
			{
				// find start of the current line
				var sel = this.selectionStart;
				var text = $(this).val();
				while (sel > 0 && text[sel-1] != '\n')
				sel--;

				var lineStart = sel;
				while (text[sel] == ' ' || text[sel]=='\t')
				sel++;

				if (sel > lineStart)
				{
					// Insert carriage return and indented text
					document.execCommand('insertText', false, "\n" + text.substr(lineStart, sel-lineStart));

					// Scroll caret visible
					this.blur();
					this.focus();
					return false;
				}
			}
		}

		// Tab key?
		if(e.keyCode === 9 && enabled) 
		{
			// selection?
			if (this.selectionStart == this.selectionEnd)
			{
				// These single character operations are undoable
				if (!e.shiftKey)
				{
					document.execCommand('insertText', false, "\t");
				}
				else
				{
					var text = this.value;
					if (this.selectionStart > 0 && text[this.selectionStart-1]=='\t')
					{
						document.execCommand('delete');
					}
				}
			}
			else
			{
				// Block indent/unindent trashes undo stack.
				// Select whole lines
				var selStart = this.selectionStart;
				var selEnd = this.selectionEnd;
				var text = $(this).val();
				while (selStart > 0 && text[selStart-1] != '\n')
					selStart--;
				while (selEnd > 0 && text[selEnd-1]!='\n' && selEnd < text.length)
					selEnd++;

				// Get selected text
				var lines = text.substr(selStart, selEnd - selStart).split('\n');

				// Insert tabs
				for (var i=0; i<lines.length; i++)
				{
					// Don't indent last line if cursor at start of line
					if (i==lines.length-1 && lines[i].length==0)
						continue;

					// Tab or Shift+Tab?
					if (e.shiftKey)
					{
						if (lines[i].startsWith('\t'))
							lines[i] = lines[i].substr(1);
						else if (lines[i].startsWith("    "))
							lines[i] = lines[i].substr(4);
					}
					else
						lines[i] = "\t" + lines[i];
				}
				lines = lines.join('\n');

				// Update the text area
				this.value = text.substr(0, selStart) + lines + text.substr(selEnd);
				this.selectionStart = selStart;
				this.selectionEnd = selStart + lines.length; 
			}

			return false;
		}

		enabled = true;
		return true;
	});	
	
}

ui.render = function($html) {
	// render portion of html
	var dvField = new DVField($html);
	dvField.init();
	
	$html.find("a.externalLink, a[external]").on("click", function(e) {
		e.preventDefault();
		nw.Shell.openExternal($(this).attr("href"));
	})
	return $html;
}

ui.startProject = async function(file) {
	console.log("ui.startProject", arguments);
	file = file || "";
	if (!Boolean(file)) return false;
	
	var gameFolder = file.match(/(.*)[\/\\]/)[1]||'';;
	
	var checkPath = php.checkPathSync(gameFolder);
	if (checkPath.accessible == false) {
		return ui.pathNotAccessibleDialog();
	}

	ui.showBusyOverlay();
	php.spawn("checkProjectExist.php", {
	args:{
		'gameFolder':gameFolder
	},
		onDone : async function(data) {
			console.log(data);
			
			ui.hideBusyOverlay();

			var selType = $("#dialogNewProject [data-slideid='rpgmaker'] .detectedType").val();
			var devType = $("#dialogNewProject [data-slideid='rpgmaker'] .devLocationType").val();
			var detType = devType || selType; // determined type
			if (Boolean(detType)) {
				console.log("detType is:", detType);
				if (typeof engines[detType].onCheckProjectExist == 'function') {
					console.log("handler exist");
					var halt = await engines[detType].onCheckProjectExist.apply(this, [file, detType, data]);
					console.log("Is process halt?", halt);
					if (common.isHalt(halt)) return;
				}
			}


			// end of handle rmmv

			if (Array.isArray(data) == false) return trans.procedureCreateProject(gameFolder, {selectedFile:file});
			if (data.length <= 0) return trans.procedureCreateProject(gameFolder, {selectedFile:file});
			
			ui.dialogProjectIsExist(data, {
				'gameFolder': gameFolder
			});
		
		}
	})		
	
}

ui.alert = function(msg, targetWindow) {
	if (!ui.windows[targetWindow]) return;
	ui.windows[targetWindow].alert(msg);
}

/**
 * Class for handling Cell Info Tab
 * (Bottom left window section)
 * @class
 */
ui.CellInfoTab = function(root, options) {
	this.options 			= options || {}
	this.root 				= root || $(".cellInfoPartsA");
	this.options.eventName 	= this.options.eventName || "cellInfoTabChange";
	this.init();
}

ui.CellInfoTab.prototype.getActiveTab = function() {
	return this.activeTab ;
}

ui.CellInfoTab.prototype.select = function(tabName) {
	console.log("selecting tab", tabName);
	this.buttons.removeClass("active");
	this.root.find(`[data-fortab="${tabName}"]`).addClass("active");
	this.contents.addClass("hidden");
	console.log("removing hidden for", tabName);
	this.root.find(`[data-tabname="${tabName}"]`).removeClass("hidden");
	this.activeTab = tabName;
	$(document).trigger(this.options.eventName, tabName);
	trans.grid.selectCell(trans.lastSelectedCell[0], trans.lastSelectedCell[1]);
}

ui.CellInfoTab.prototype.init = function() {
	this.buttons 	= this.root.find('[data-fortab]');
	this.contents 	= this.root.find('[data-tabname]');

	var cellInfoTab = this;
	this.buttons.on("click", function() {
		console.log("Tab clicked");
		var tabName = $(this).attr("data-fortab");
		cellInfoTab.select(tabName);
	})
}



// =======================================================
// AUTOCOMPLETE
// =======================================================
ui.autoCompleteSet = function(state) {
	trans.project.options = trans.project.options || {};
	trans.project.options.autoComplete = Boolean(state)
}
ui.autoCompleteGet = function() {
	if (!trans.project.options) return false;
	if (typeof trans.project.options.autoComplete == 'undefined') return true;
	return Boolean(trans.project.options.autoComplete)
}
ui.autoCompleteIsEnabled = function() {
	if (!trans.project.options) return false;
	if (typeof trans.project.options.autoComplete == 'undefined') return true;
	return Boolean(trans.project.options.autoComplete)
}
ui.autoCompleteClear = function() {
	window.words = [];
}

ui.onReady(function() {
	ui.dvField = new DVField();
	ui.dvField.init();
})


ui.init = function() {
	ui.togglePreWhitespaces(sys.config.wordWrapTable)
	ui.toggleMonoSpace(sys.config.monoSpaceTable)
	//ui.textAreaTabSupport($("#currentCellText"));

	var RawViewer = require("www/js/RawViewer.js").RawViewer;
	ui.rawViewer = new RawViewer();
	
	/*
	now loaded at trans.drawFileSelector
	var TranslationByContext = require("www/js/TranslationByContext.js");
	ui.translationByContext = new TranslationByContext();
	*/

	var negativeHeight = $(".panel-wrapper").height() + 100;
	$(".cellInfoTabContent").css("height", "calc(100vh - "+negativeHeight+"px)");	
	
}


ui.highlightLastSelected = function() {
	console.log("highlight selected");
	$("#table .current").removeClass("current");
	var scrolled = ui.scrollToView(trans.lastSelectedCell[0], trans.lastSelectedCell[1], function(newRow, newCol) {
		$("#table .current").removeClass("current");

		var targetRow = newRow-this.rowOffset();
		var targetCol = newCol-this.colOffset();
		console.log("target", targetRow, targetCol);
		ui.selectedCell = $(".ht_master .htCore tbody tr").eq(targetRow).find("td").eq(targetCol);
		ui.selectedCell.addClass("current highlight");			
	});
	
	console.log("Scrolled?", scrolled);
	//if (!scrolled) {
		var rowOffset = trans.lastSelectedCell[0]-trans.grid.rowOffset();
		var colOffset = trans.lastSelectedCell[1]-trans.grid.colOffset();
		console.log("Offset", rowOffset, colOffset);
		ui.selectedCell = $(".ht_master .htCore tbody tr").eq(rowOffset).find("td").eq(colOffset);
		ui.selectedCell.addClass("current highlight");
		
		var overlay;
		overlay = $(".ht_clone_left .htCore tbody tr").eq(rowOffset).find("td").eq(colOffset);
		overlay.addClass("current highlight");
	//}	
}

ui.selectNextRow = function(natural) {
	if (natural) {
		var selected = trans.grid.getSelected() || [[]]
		var row = selected[0][0] || 0
		var col = selected[0][1] || 0
		console.log("Select next:", row, col);
		if (row < trans.grid.getData().length) {
			trans.grid.selection.setRangeStart({col:col, row:row+1})
			return true;
		}
	} else {
		trans.doAfterSelection(trans.lastSelectedCell[0]+1,trans.lastSelectedCell[1]);
		ui.highlightLastSelected();
	}
}

ui.currentCellTextFocus = async function() {
	$("#currentCellText").val(trans.data[trans.lastSelectedCell[0]][trans.lastSelectedCell[1]]);
	if (ui.autoCompleteIsEnabled()) {
		if (typeof trans[trans.gameEngine] !=='undefined') trans[trans.gameEngine].setAutocompleteData();
	}
	$("#currentCellText").focus();	
}





$(document).ready(function() {
	if ($('body').is('[data-window="trans"]') == false) return;
	



// ==============================================================
//
// 							E V E N T S
//
// ==============================================================
// Listen to main window's close event
nw.Window.get().on('close', function() {
	// Hide the window to give user the feeling of closing immediately
	this.hide();
	try {
		sys.saveConfig();
	} catch (e) {
		
	}

	$(document).trigger("close");
	// If the new window is still open then close it.
	// close all popup
	for (var id in ui.windows) {
		if (ui.windows[id] != null || ui.windows[id] != undefined || typeof ui.windows[id] != 'undefined') ui.windows[id].close(true);
	}

	// After closing the all popups window, close the main window.
	this.close(true);
});



	ui.disableButtons();

	$(document).on("optionsWindowClosed", function() {
		console.log("optionsWindowClosed triggered");
		sys.saveConfig();
	});

	ui.setWindowTitle();
	ui.ribbonMenu.init();
	// ==============================================================
	// B U T T O N S
	// ==============================================================

	$("#button-translatorplus").on("click", function() {
		ui.mainMenu.open();		
	});
	// ==================================================
	// MAIN MENU
	// ==================================================
	
	$(".button-save").on("click", function(e) {
		trans.save();
	});
	$(".button-save-as").on("click", function(e) {
		$("#saveAs").trigger("click");
	});
	$(".button-open").on("click", function(e) {
		$("#openFile").trigger("click");
	});
	$(".button-new").on("click", function(e) {
		//var accept = confirm("Creating new project will close current project.\nAll unsaved data will be lost\n\nAre you sure?");
		//if (accept) {
			//$("#startProject").trigger("click");
		//}
		ui.newProjectDialog.open()
	});
	
	
	// RPG Maker's new project's slide
	$("#dialogNewProject [data-slideid=rpgmaker]").on("active", async function(e) {
		console.log("initializing slide");
		var $this = $(this);
		$this.find(".rpgMakerLocation").val("");
		$this.find(".devLocation").val("");
		$this.find(".devLocationWrapper").addClass("hidden");
		$this.find(".detectedTypeWrapper").addClass("hidden");
		$this.find(".devLocationTypeWrapper").addClass("hidden");
		$this.find(".devLocationExeWrapper").addClass("hidden");
		// initializing create a copy
		$this.find(".createCopyWrapper").addClass("hidden");
		$this.find(".createCopy").prop("checked", false);
		$this.find(".createCopy").prop("disabled", false);
		$this.find(".copyIsRequired").addClass("hidden");
		
		$this.find(".detectedType").val("");
		$this.find(".devLocationType").val("");
		$this.find(".devLocationExe").val("");
		$this.find(".devLocationWrapper").removeClass("mandatory");
		$this.find(".createProjectFromRPGM").prop("disabled", true);
	});
	
	$("#dialogNewProject .rpgMakerLocation").on("change", async function(e) {
		var loc = $(this).val();
		var $slide = $("#dialogNewProject [data-slideid=rpgmaker]");
		console.log("analyzing path : ", loc);
		var projectType = await Engines.detect(loc);

		$slide.find(".detectedTypeWrapper").removeClass("hidden");
		
		// create a copy
		$slide.find(".createCopyWrapper").removeClass("hidden");
		$slide.find(".detectedType").val(projectType);
		$slide.find(".devLocation").val("");
		
		if (!Boolean(projectType)) return alert(t("错误！\r\n Translator++无法检测")+loc);
		
		if (projectType == "enigma") {
			console.log("Is Enigma");
			// create a copy is mandatory
			$slide.find(".createCopy").prop("checked", true);
			$slide.find(".createCopy").prop("disabled", true);
			$slide.find(".copyIsRequired").removeClass("hidden");

			$slide.find(".devLocationWrapper").addClass("mandatory");
			
			$slide.find(".createCopy").trigger("change");
			
			return;
		} else if (["rmvxace", "rmvx", "rmxp"].includes(projectType)) {
			if (thirdParty.isInstalled("rpgmakertrans") == false) {
				var conf = confirm(t(`未安装解析${projectType}所需的应用程序。 \n请通过第三方应用程序安装程序安装它。
				\n是否要打开第三方应用程序安装程序窗口?`));
				if (conf) {
					thirdParty.check({
						popup:true,
						force:true
					});					
				}
				return;
			}

			console.log("RPG Maker - RSS Variant");
			ui._thisGame = new RMRGSS(loc);
			if (await ui._thisGame.isPacked()) {
				// create a copy is mandatory
				$slide.find(".createCopy").prop("checked", true);
				$slide.find(".createCopy").prop("disabled", true);
				$slide.find(".copyIsRequired").removeClass("hidden");

				$slide.find(".devLocationWrapper").addClass("mandatory");
				
				$slide.find(".createCopy").trigger("change");
				return;
			}
		}
		
		// not enigma
		$slide.find(".createProjectFromRPGM").prop("disabled", false);
	});
	
	$("#dialogNewProject .createCopy").on("change", async function(e) {
		var $slide = $("#dialogNewProject [data-slideid=rpgmaker]");
		
		if ($(this).prop("checked")) {
			$slide.find(".devLocationWrapper").removeClass("hidden");
		} else {
			$slide.find(".devLocationWrapper").addClass("hidden");
		}
		
	})
	
	
	$("#dialogNewProject .devLocation").on("change", async function(e) {
		var to = $(this).val();
		var from = $("#dialogNewProject .rpgMakerLocation").val();
		var $slide = $("#dialogNewProject [data-slideid=rpgmaker]");
		var detectedType = $slide.find(".detectedType").val().toLowerCase()

		if (detectedType == "enigma") {
			var conf = confirm(t("这个游戏充满了谜团。\r\n是否要提取包？\r\n这将需要几分钟，具体取决于游戏的大小。"))
			if (!conf) {
				$(this).val("");
				return 
			}
			
			ui.showBusyOverlay();
			await php.extractEnigma(from, to);
			var thisEngine = await Engines.detect(to);
			if (thisEngine == "rmmz") {
				var executable = await RMMZ.getExe(nwPath.join(to));
			} else { // rmmv
				var executable = await RMMV.getExe(nwPath.join(to));
			}
			$slide.find(".devLocationTypeWrapper").removeClass("hidden");
			$slide.find(".devLocationType").val(thisEngine);
			$slide.find(".devLocationExeWrapper").removeClass("hidden");
			$slide.find(".devLocationExe").val(nwPath.join(to, executable));
			
			ui.hideBusyOverlay();
		} else if (["rmvxace", "rmvx", "rmxp"].includes(detectedType)) {
			if (thirdParty.isInstalled("rpgmakertrans") == false) {
				var conf = confirm(t(`未安装解析${projectType}所需的应用程序。 \n请通过第三方应用程序安装程序安装它。
				\n是否要打开第三方应用程序安装程序窗口?`));
				if (conf) {
					thirdParty.check({
						popup:true,
						force:true
					});					
				}
				return;
			}

			var conf = confirm(t("将数据复制并提取到")+to+"中?")
			if (!conf) {
				$(this).val("");
				return 
			}
			ui.showBusyOverlay();
			
			ui._thisGame = ui._thisGame || new RMRGSS(from);
			var thisEngine = $slide.find(".detectedType").val();
			var devExecutable = nwPath.join(to, nwPath.basename(from));
			
			await ui._thisGame.extractTo(to);
			
			$slide.find(".devLocationTypeWrapper").removeClass("hidden");
			$slide.find(".devLocationType").val(thisEngine);
			$slide.find(".devLocationExeWrapper").removeClass("hidden");
			$slide.find(".devLocationExe").val(devExecutable);
			ui.hideBusyOverlay();
			
		}
		
		$slide.find(".createProjectFromRPGM").prop("disabled", false)
		
	});
	
	$("#dialogNewProject .createProjectFromRPGM").on("click", async function(e) {
		if ($(this).prop("disabled")) return;
		var master 	= $("#dialogNewProject .rpgMakerLocation").val();
		var devExe 	= $("#dialogNewProject .devLocationExe").val();
		
		var loc = devExe || master;
		console.log("processing location : ", loc);
		await ui.startProject(loc);
		
	});
	
	$(".selectRPGExe").on("click", function(e) {

		//var accept = confirm("Creating new project will close current project.\nAll unsaved data will be lost\n\nAre you sure?");
		//if (accept) {
			$("#startProject").trigger("click");
		//}
		//ui.newProjectDialog.open()
	});



	$(".openFile").on("change", function(e) {
		trans.currentFile = $(this).val();
		trans.open();
		console.log($(this).val());
	});
	$(".saveAs").on("change", function(e) {
		trans.currentFile = $(this).val();
		trans.save();
		console.log($(this).val());
	});
	
	$("#startProject").on("click", function() {
		$(this).val("");
	});	
	
	$("#startProject").on("change", async function() {
		if ($(this).val() == "") return false;
		if (typeof $(this).val() == "undefined") return false;
		await ui.startProject($(this).val());
	});

	
	$("#export").on("click", function(e) {
		$(this).val("");
	})
	$("#exportDir").on("click", function(e) {
		$(this).val("");
	})
	$("#exportTpp").on("click", function(e) {
		$(this).val("");
	})
	$("#exportTrans").on("click", function(e) {
		$(this).val("");
	})
	$("#exportCSV").on("click", function(e) {
		$(this).val("");
	})
	$("#exportXLS").on("click", function(e) {
		$(this).val("");
	})
	$("#exportXLSX").on("click", function(e) {
		$(this).val("");
	})
	$("#exportHTML").on("click", function(e) {
		$(this).val("");
	})
	$("#exportODS").on("click", function(e) {
		$(this).val("");
	})
	$("#export").on("change", function(e) {
		if ($(this).val() == "") return false;
		
		var currentValue = $(this).val();
		ui.exportPreparationDialog(currentValue, {
			onDone:function(options) {
				// ver 3 change 
				options = options || {};
				var optionData = $("#dialogExport").data("options");
				if (typeof optionData == "object") options.files = options.files || optionData.files;
				// end of ver 3 change
				trans.export(currentValue, {
						mode:"zip",
						onDone: function() {
							ui.closeExportDialog();
						},
						'options':options
					});	
			}
		})
			
	});
	$("#exportDir").on("change", function(e) {
		if ($(this).val() == "") return false;

		var currentValue = $(this).val();
		ui.exportPreparationDialog(currentValue, {
			onDone:function(options) {
				// ver 3 change 
				options = options || {};
				var optionData = $("#dialogExport").data("options");
				if (typeof optionData == "object") options.files = options.files || optionData.files;
				// end of ver 3 change				
				trans.export(currentValue, {
						mode:"dir",
						onDone: function() {
							ui.closeExportDialog();
						},
						'options':options
					});	
			}})
			
	});
	
	$("#exportTpp").on("change", function(e) {
		if ($(this).val() == "") return false;
		trans.exportTPP($(this).val(), {
				onDone: function() {
					ui.closeExportDialog();
				}
			});
	});
	
	$("#exportTrans").on("change", function(e) {
		if ($(this).val() == "") return false;
		
		var currentValue = $(this).val();
		ui.exportPreparationDialog(currentValue, {onDone:function(options) {
			// ver 3 change 
			options = options || {};
			var optionData = $("#dialogExport").data("options");
			if (typeof optionData == "object") options.files = options.files || optionData.files;
			// end of ver 3 change			
			trans.export(currentValue, {
					mode:"RPGMakerTrans",
					onDone: function() {
						ui.closeExportDialog();
					},
					'options':options
				});	
		}})
		
	})
	$("#exportCSV").on("change", function(e) {
		if ($(this).val() == "") return false;
		
		var currentValue = $(this).val();		
		ui.exportPreparationDialog(currentValue, {onDone:function(options) {		
			// ver 3 change 
			options = options || {};
			var optionData = $("#dialogExport").data("options");
			if (typeof optionData == "object") options.files = options.files || optionData.files;
			// end of ver 3 change		
			trans.export(currentValue, {
					mode:"csv",
					onDone: function() {
						ui.closeExportDialog();
					},
					options:options
				});	
		}})
	})
	$("#exportXLSX").on("change", function(e) {
		if ($(this).val() == "") return false;
		
		var currentValue = $(this).val();		
		ui.exportPreparationDialog(currentValue, {onDone:function(options) {		
			// ver 3 change 
			options = options || {};
			var optionData = $("#dialogExport").data("options");
			if (typeof optionData == "object") options.files = options.files || optionData.files;
			// end of ver 3 change		
			trans.export(currentValue, {
					mode:"xlsx",
					onDone: function() {
						ui.closeExportDialog();
					},
					options:options
				});	
		}})
	})
	$("#exportXLS").on("change", function(e) {
		if ($(this).val() == "") return false;
		
		var currentValue = $(this).val();		
		ui.exportPreparationDialog(currentValue, {onDone:function(options) {		
			// ver 3 change 
			options = options || {};
			var optionData = $("#dialogExport").data("options");
			if (typeof optionData == "object") options.files = options.files || optionData.files;
			// end of ver 3 change		
			trans.export(currentValue, {
					mode:"xls",
					onDone: function() {
						ui.closeExportDialog();
					},
					options:options
				});	
		}})	
	})
	$("#exportHTML").on("change", function(e) {
		if ($(this).val() == "") return false;
		
		var currentValue = $(this).val();		
		ui.exportPreparationDialog(currentValue, {onDone:function(options) {		
			// ver 3 change 
			options = options || {};
			var optionData = $("#dialogExport").data("options");
			if (typeof optionData == "object") options.files = options.files || optionData.files;
			// end of ver 3 change		
			trans.export(currentValue, {
					mode:"html",
					onDone: function() {
						ui.closeExportDialog();
					},
					options:options
				});	
		}})
	})
	$("#exportODS").on("change", function(e) {
		if ($(this).val() == "") return false;
		
		var currentValue = $(this).val();		
		ui.exportPreparationDialog(currentValue, {onDone:function(options) {		
			// ver 3 change 
			options = options || {};
			var optionData = $("#dialogExport").data("options");
			if (typeof optionData == "object") options.files = options.files || optionData.files;
			// end of ver 3 change		
			trans.export(currentValue, {
					mode:"ods",
					onDone: function() {
						ui.closeExportDialog();
					},
					options:options
				});	
		}})
	})
	
	$(".button-export").on("click", function() {
		ui.openExportDialog({files:[]});
	})
	$(".button-import").on("click", function() {
		ui.openImportDialog();
	})
	$(".button-inject").on("click", function() {
		ui.openInjectDialog({
			files:[] // all file
		});
	})
	
	$("#importTpp").on("click", function() {
		$(this).val("");
	})
	$("#importTpp").on("input", function() {
		console.log("importing TPP file : "+$(this).val());
		trans.importTpp($(this).val());
	})

	
	$("#importTrans").on("click", function() {
		$(this).val("");
	})
	$("#importTrans").on("input", function() {
		//var conf = confirm("Do you want to import : \n"+$(this).val());
		ui.openImportTrans($(this).val());
	})
	
	
	$(".menu-button.batch-translate").on("click", function() {
		ui.translateAllDialog();
	});
	
	$(".menu-button.contextTool").on("click", function() {
		ui.showBusyOverlay();
		setTimeout(function() {
			ui.contextToolDialog();
		}, 250);
		
	});
	$(".menu-button.toggle-activeCellInfo").on("click", function() {
		ui.toggleActiveCellInfo()

	});	
	
	
	$(".button-clipboard").on("click", function() {
		$(this).toggleClass("checked");
		sys.toggleAutoClipboard($(this).hasClass("checked"));
	});
	
	$(".button-options").on("click", function() {
		//$(this).toggleClass("checked");
		ui.openOptionsWindow();
	});
	$(".button-properties").on("click", function() {
		ui.openProjectProperties();
		
	});
	$(".button-help").on("click", function() {
		nw.Shell.openExternal('http://dreamsavior.net/docs/translator/');
	});


	$("#dialogImport .importSpreadsheet").on("click", function() {
		ui.openImportSpreadsheetDialog();
	});
	$("#dialogImport .importRPGMTrans").on("click", function() {
		ui.openImportRPGMTransDialog();
	});
	
	
	// File selection panel bottom bar
	$(".bottomToolbar .controlCheck").on("click", function() {
		console.log("clicking 3 state checkbox");
		var state = $(this).data("state")||0;

		
		if (Boolean(state) == false) { //default
			ui.fileSelectorState = [];
			var $fileSelector = $(".fileList .data-selector .fileCheckbox:checked");
			for (var i=0; i<$fileSelector.length; i++) {
				ui.fileSelectorState.push($fileSelector.eq(i).attr("value"));
			}			
		}
		
		state++;
		if (state > 2) state=0;
		$(this).data("state", state);
		console.log(state);
		var stateClass = ["ovDefault", "ovCheck", "ovNoCheck"];
		$(this).find(".ovLine").removeClass("ovNoCheck");
		$(this).find(".ovLine").removeClass("ovCheck");
		$(this).find(".ovLine").removeClass("ovDefault");
		console.log(stateClass[state]);
		$(this).find(".ovLine").addClass(stateClass[state]);


		$(this).find(".ovLine").removeClass("icon-check-empty");
		$(this).find(".ovLine").removeClass("icon-check");
		$(this).find(".ovLine").removeClass("icon-minus-squared-alt");
		
		if (stateClass[state] == "ovCheck") {
			$(this).find(".ovLine").addClass("icon-check");
		} else if (stateClass[state] == "ovNoCheck") {
			$(this).find(".ovLine").addClass("icon-check-empty");
		} else {
			$(this).find(".ovLine").addClass("icon-minus-squared-alt");
		}

		
		if (stateClass[state] == 'ovCheck') {
			var $fileSelector = $(".fileList .data-selector .fileCheckbox");
			$fileSelector.prop("checked", true);
		} else if (stateClass[state] == 'ovNoCheck') {
			var $fileSelector = $(".fileList .data-selector .fileCheckbox");
			$fileSelector.prop("checked", false);
		} else if (stateClass[state] == 'ovDefault') {
			var $fileSelector = $(".fileList .data-selector .fileCheckbox");
			$fileSelector.prop("checked", false);
			for (var i=0; i<$fileSelector.length; i++) {
				if (ui.fileSelectorState.includes($fileSelector.eq(i).attr("value"))) {
					$fileSelector.eq(i).prop("checked", true);
				}
			}
		}
		$(".data-selector input[type=checkbox]").trigger("change");
		
	});
	
	$(".bottomToolbar .invertSelection").on("click", function() {
		trans.invertSelection();
	});
	
	$(".bottomToolbar .removeSelected").on("click", function() {
		if (trans.getCheckedFiles().length < 1) return;
		var conf = confirm(t("删除选定对象？"));
		if (!conf) return;
		trans.deleteFile(trans.getCheckedFiles());
	});
	
	$(".bottomToolbar .addObject").on("click", function() {
		ui.addNewObjectDialog();
	});
	
	$(".resizeFont").on("click", function(e) {
		ui.openTextResizer($(this), $($(this).attr("data-for")));
	});
	

	$(".gotoCurrentCell").on("click", function(e) {
		if (empty(trans.lastSelectedCell)) return;
		trans.grid.scrollViewportTo(trans.lastSelectedCell[0],trans.lastSelectedCell[1]);
	})
	
	$(".menu-button.addNewKey").on("click", function(e) {
		trans.goToNewKey();
	});
	$(".menu-button.filePropertiesMenu").on("click", function(e) {
		ui.openFileProperties(trans.getSelectedId());
	});
	$(".menu-button.importHere").on("click", function(e) {
		if (Boolean(trans.getSelectedId()) == false) return;
		
		ui.openFileDialog({
			accept:".trans",
			onSelect : function(path) {
				ui.openImportTrans(path, {
					mode:1, 
					defaultSelection:[trans.getSelectedId()]
				})		
			}
		})

	});
	
	
	$(".menu-button.addNote").on("click", function(e) {
		if ($(this).hasClass("checked")) {
			ui.closeFileNote();
		} else {
			ui.openFileNote();
		}
	});
	
	$(".menu-button.find").on("click", function(e){
		ui.openSearchWindow();
	});
	
	$(".menu-button.wordWrapTable").on("click", function(e){
		ui.togglePreWhitespaces();
	});
	$(".menu-button.monospace").on("click", function(e){
		ui.toggleMonoSpace();
	});
	
	
	
	$(".menu-button.removeTranslation").on("click", function(e) {
		var conf= confirm(t("你确定要删除当前页面上的所有翻译吗？\n警告：这是不可逆转的行动！"));
		if (conf) {
			trans.removeAllTranslation(trans.getSelectedId(), {refreshGrid:true});
		}
	});
	$(".menu-button.removeFile").on("click", function(e) {
		var conf= confirm(t("你确定要删除当前文件吗？\n警告：这是不可逆转的行动！"));
		if (conf) {
			trans.deleteFile(trans.getSelectedId());
		}
	});
	
	$(".panelLeftTabHandler").on("click", function() {
		ui.resize.toggleCollapse();
	});
	
	/* LEFT PANE */
	$("#currentCoordinate").on("change", function() {
		console.log("selecting cell : ", $(this).val());

		var $this = $(this);
		var value = $this.val();
		var coord = value.split(",");
		var row = parseInt(coord[0]-1);
		var col = parseInt(coord[1]-1);
		if (trans.selectCell(row, col) == false) {
			
		}
	});
	
	$(".panel-left .panel-switcher").on("click", function(e) {
		ui.switchLeftPane($(this).attr("data-for"));
		
	});
	
	$(".menu-button.undockPane").on("click", function(e) {
		ui.toggleDockTranslatorPane();
	});
	
	$(".menu-button.connectTranslator").on("click", function(e) {
		if ($(this).hasClass("checked")) {
			$(this).removeClass("checked");
			trans.config.autoTranslate = false;
			$(this).find("img").attr("src", "img/connect_icon.png");
			$(this).find("span").text("连接");
			
		} else {
			$(this).addClass("checked");
			trans.config.autoTranslate = true;
			$(this).find("img").attr("src", "img/connected_icon.png");
			$(this).find("span").text("已连接");
			
		}
	});
	
	
	$(".currentCellTextCtrl .wordWrap").on("click", function() {
		$(this).toggleClass("checked");
		var target = $($(this).attr("data-for"));
		if ($(this).hasClass("checked")) {
			target.addClass("pre");
		} else {
			target.removeClass("pre");
			
		}
		ui.generateBackgroundNumber();
	});
	
	$(".cellInfoCtrl .wordWrap").on("click", function() {
		if ($(this).hasClass("checked")) {
			$("#currentRomaji").css("white-space", "normal")
			$(this).removeClass("checked")
		} else {
			$("#currentRomaji").css("white-space", "pre")
			$(this).addClass("checked")
		}
	})
	
	$(".ceOptions").on("click", function() {
		ui.currentCellTextOptionsOpen();
	})
	$(".speakOriginalText").on("click", function() {
		synth.speakOriginal();
	})
	$(".copyOriginal").on("click", function() {
		var thisRow = trans.lastSelectedCell[0];
		if (trans.data[thisRow][0]) document.querySelector("#currentCellText").insertAtCaret(trans.data[thisRow][0]);
		$("#currentCellText").trigger("change")
	})
	$(".speakTranslatedText").on("click", function() {
		synth.speakTranslated();
	})
	$(".speakCurrent").on("click", function() {
		synth.speakCurrent();
	})
	$(".contextTranslateHelp").on("click", function() {
		nw.Shell.openExternal('https://dreamsavior.net/docs/translator/getting-started/translation-by-context/');
	})


	$("#introWindow .closeIntroWindow").on("click", function() {
		ui.introWindowClose();
	})
	$("#introWindow .newProject").on("click", function() {
		//$("#startProject").trigger("click");
		//ui.introWindowClose();
		ui.newProjectDialog.open();
	});
	$("#introWindow .openProject").on("click", function() {
		$("#openFile").trigger("click");
		ui.introWindowClose();
	});
	$("#introWindow .nextTips").on("click", function() {
		ui.showRandomTip();

	});
	
	$(".pathinfoWrapper > i").on("click", function() {
		$(".data-selector.selected")[0].scrollIntoView({
			behavior: "smooth",
			block:"center"
		})
	})


	$(".actionCreateNewTrans").on("click", function() {
		var gameEngine = $("input.gameEngines").val();
		var gameTitle = $("input.gameTitle").val();
		if (gameTitle == "") return alert(t("请输入标题"));
		var transData = {
			project : {
				gameEngine : gameEngine,
				gameTitle : gameTitle
			}
		}
		
		trans.openFromTransObj(transData, {
			isNew:true,
			onSuccess : () => {
				ui.newProjectDialog.close();
			}
		});
		
	})
	
	$("#mainMenu .checkThirdParty").on("click", function() {
		thirdParty.check({
			popup:true,
			force:true
		})
	})


	// ==============================================================
	// TABLE
	// ==============================================================
	
	$("#currentCellText").on("change", function(e){
		console.log("data changed");
		if ($(this).data("column") == 0) {
			if (trans.isLastRow($(this).data("row")) == false) return false;
		}
		if (typeof $(this).data("row") == 'undefined') return false;
		trans.grid.setDataAtCell($(this).data("row"),$(this).data("column"),$(this).val());
	})
	
	$("#currentCellText").on("focus", function(e) {
		if (typeof trans.lastSelectedCell == 'undefined') return false;
		// starting from 3.7.14
		//$("#table .currentCell").removeClass("currentCell");
		//$("#table .current.highlight").addClass("currentCell");

		/*
		$("#table .currentCell").removeClass("currentCell");
		var scrolled = ui.scrollToView(trans.lastSelectedCell[0], trans.lastSelectedCell[1], function(newRow, newCol) {
			var targetRow = newRow-this.rowOffset();
			var targetCol = newCol-this.colOffset();
			console.log("target", targetRow, targetCol);
			ui.selectedCell = $(".ht_master .htCore tbody tr").eq(targetRow).find("td").eq(targetCol);
			ui.selectedCell.addClass("currentCell");			
		});
		
		if (!scrolled) {
			var rowOffset = trans.lastSelectedCell[0]-trans.grid.rowOffset();
			var colOffset = trans.lastSelectedCell[1]-trans.grid.colOffset();
			console.log("Offset", rowOffset, colOffset);
			ui.selectedCell = $(".ht_master .htCore tbody tr").eq(rowOffset).find("td").eq(colOffset);
			ui.selectedCell.addClass("currentCell");
			
			var overlay;
			overlay = $(".ht_clone_left .htCore tbody tr").eq(rowOffset).find("td").eq(colOffset);
			overlay.addClass("currentCell");
			
		}
		*/

		
		// adding common autocomplete by same cols
		if (ui.autoCompleteIsEnabled()) {
			if (typeof trans[trans.gameEngine] !=='undefined') trans[trans.gameEngine].setAutocompleteData();
			
			for (var i=0; i< trans.data[trans.lastSelectedCell[0]].length; i++) {
				var thisCell = trans.data[trans.lastSelectedCell[0]][i]||"";
				thisCell = thisCell.replace(/[\.\,]/g, "");
				var newAutoCorrect = thisCell.split(" ");
				for (var x=0; x<newAutoCorrect.length; x++) {
					if (newAutoCorrect[x].length < 3) continue;
					if (window.words.includes(newAutoCorrect[x])) continue;
					window.words.push(newAutoCorrect[x]);
				}
			}
		}
		

		
	});
	

	$("#currentCellText").on("blur", function(e) {
		console.log("currentCellTextBlur");
		//$(".ht_master .htCore tbody tr .currentCell").removeClass("currentCell");
		$("#table tbody tr .current").removeClass("current highlight");
		//trans.grid.selectCell(trans.lastSelectedCell[0], trans.lastSelectedCell[1])
	});
	// ==============================================================
	// HANDLING DROP EVENTS
	// ==============================================================
	// prevent default behavior from changing page on dropped file
	window.ondragover = function(e) { e.preventDefault(); return false };
	// NOTE: ondrop events WILL NOT WORK if you do not "preventDefault" in the ondragover event!!
	window.ondrop = function(e) { e.preventDefault(); return false };

	const holder = $("body")[0];
	holder.ondragover = function () { this.className = 'hover'; return false; };
	holder.ondragleave = function () { this.className = ''; return false; };
	holder.ondrop = function (e) {
		e.preventDefault();
		for (let i = 0; i < e.dataTransfer.files.length; ++i) {
			console.log(e.dataTransfer.files[i].path);
			if (trans.isFileSupported(e.dataTransfer.files[i].path)) {
				console.log("file is supported !");
				trans.openFile(e.dataTransfer.files[i].path);
			} else {
				console.log("file is not supported !");
			}
		}
		return false;
	};	
	// ==============================================================
	// HANDLING KEYBOARD SHORTCUTS
	// ==============================================================
	// Disable midle click from opening new application window
	document.addEventListener("auxclick", function(e){
		if (e.button === 1) {
			// Check if it is a link (a) element; if so, prevent the execution.
			if (e.target.tagName.toLowerCase() === "a") {
				console.log("middle click on A element");
				e.preventDefault();
			}
		}		
	});	

	
	$(document).on('keydown', function(e) {
		var keyCode = e.keyCode || e.which;

		switch (keyCode) {

			case 112 : //F1, about
				e.preventDefault();
				console.log("opening help command");
				nw.Shell.openExternal('http://dreamsavior.net/docs/translator/');
			break;		
			case 27 : //esc, close active windows
				e.preventDefault();
				ui.introWindowClose();
			break;		
			case 122 : //F11, Full screen
				var win = win || nw.Window.get();
				win.maximize();
			break;		
		}

		// EDITING COMMAND
		if (e.ctrlKey) {
			switch(keyCode) {
				case 79 : //o
					e.preventDefault();
					console.log("Pressing CTRL+o");
					trans.open();
				break;
				case 83 : //s
					e.preventDefault();
					console.log("Pressing CTRL+s");
					trans.save();
					//saveData();
				break;
				case 70 : //f
					e.preventDefault();
					(async () => {
						await common.wait(200);
						console.log("Pressing CTRL+f");
						ui.openSearchWindow();
					})();

				break;
				case 71 : //g
					e.preventDefault();
					console.log("Pressing CTRL+g");
					trans.translateSelection();
					//trans.translateSelectionByLine();
				break;
				case 72 : //h
					e.preventDefault();
					console.log("Pressing CTRL+h");
					ui.openSearchWindow("replace");
				break;
				case 68 : //d
					e.preventDefault();
					console.log("Pressing CTRL+d");
					trans.appendTextToReference(common.getSelectionText());
				break;

			}
		} else if (e.altKey) {
			switch(keyCode) {
				case 46 : //alt delete (remove context translation)
					e.preventDefault();
					$(document).trigger("clearContextTranslationByRow", {file:trans.getSelectedId(), row:trans.grid.getSelectedRange(), type:"range"});
				break;
			}			
		} else if (e.shiftKey) {
			switch(keyCode) {
				case 46 : //shift delete (remove selected row)
					e.preventDefault();
					var conf = confirm(t("是否要删除当前选定的行？"));
					if (!conf) return;
					trans.removeRow(trans.getSelectedId(), common.gridRangeToArray());
					trans.grid.render();
					trans.grid.deselectCell();

				break;
			}
			
		}
	});		
	
	// ==================================================
	// numpad enter everywhere on screen
    window.onkeydown=function(ev) {
		var e= ev || window.event,
		key = e.keyCode
		if ((key===13) && (e.location===3)) {
			e.preventDefault();
			// go to next row
			
			if (typeof trans.lastSelectedCell == 'undefined') return false;
			var editorHasFocus = false;
			if ($("#currentCellText").is(":focus")) {
				$("#currentCellText").trigger("blur");
				editorHasFocus = true;
				trans.grid.addHookOnce('afterSelectionEnd', function() {
					ui.currentCellTextFocus()				
				})				
			}
			//trans.doAfterSelection(trans.lastSelectedCell[0]+1,trans.lastSelectedCell[1]);
			ui.selectNextRow(true);
			// if clipboard is monitored
			if (sys.isClipboardMonitored) {
				sys.afterSelectionAction(trans.lastSelectedCell[0],0);
			}
			//trans.grid.selectCell(trans.lastSelectedCell[0]+1,trans.lastSelectedCell[1]);
			if (editorHasFocus) {

				//console.log("last value : ");
				//console.log(trans.grid.getCellMeta(trans.lastSelectedCell[0]+1,trans.lastSelectedCell[1]).instance.getValue());
				//$("#currentCellText").val(trans.grid.getCellMeta(trans.lastSelectedCell[0]+1,trans.lastSelectedCell[1]).instance.getValue());
				ui.currentCellTextFocus()
				
				//$("#currentCellText").trigger("focus");
				//$("#currentCellText")[0].select();				
			}
		} else if (key == 27) {
			trans.grid.deselectCell()
		}
	}
	

	$("#currentCellText").on('input', function(e) {
		var $that = $(this);
		ui._cache = ui._cache || {};
		ui._cache.lastCellLineNumber = ui._cache.lastCellLineNumber || 0;
		if (ui._cache.bgNumberProcessing) {
			clearTimeout(ui._cache.bgNumberProcessing);
			ui._cache.bgNumberProcessing = setTimeout(function() {
				
				var currentLineNumber = $that.val().split("\n").length;
				if (ui._cache.lastCellLineNumber !== currentLineNumber) {
					ui._cache.lastCellLineNumber = currentLineNumber;
					ui.generateBackgroundNumber($that, currentLineNumber);
				}
				
				//console.log("input delayer triggered");
				ui._cache.bgNumberProcessing = undefined;
			}, 200);		

			return;
		}
		
		ui._cache.bgNumberProcessing = setTimeout(function() {
			
			var currentLineNumber = $that.val().split("\n").length;
			if (ui._cache.lastCellLineNumber !== currentLineNumber) {
				ui._cache.lastCellLineNumber = currentLineNumber;
				ui.generateBackgroundNumber($that, currentLineNumber);
				
			}
			
			//console.log("input delayer triggered");
			ui._cache.bgNumberProcessing = undefined;
		}, 200);
		
		
	
	});


	
	$("#currentCellText").on('keydown', function(e) {
		var keyCode = e.keyCode || e.which;

		
		switch (keyCode) {
			
			/*
			case 13 : //enter key
				console.log("enter key pressed!");
				ui.createBackgroundNumberDelayed();
			break;		
			case 46 : //del key
				ui.createBackgroundNumberDelayed();
			break;		
			case 8 : //backspace key
				ui.createBackgroundNumberDelayed();
			break;	
			*/			
		}

		// EDITING COMMAND
		if (e.ctrlKey) {
			switch(keyCode) {
				case 48 : //0
					e.preventDefault();
					console.log("Pressing CTRL+0");
					//var thisRow = $("#currentCellText").data("row");
					var thisRow = trans.lastSelectedCell[0];
					if (trans.data[thisRow][0]) document.activeElement.insertAtCaret(trans.data[thisRow][0]);
					$("#currentCellText").trigger("change")
				break;
				case 49 : //1
					e.preventDefault();
					console.log("Pressing CTRL+1");
					var thisRow = trans.lastSelectedCell[0];
					if (trans.data[thisRow][1]) document.activeElement.insertAtCaret(trans.data[thisRow][1]);
					$("#currentCellText").trigger("change")
				break;
				case 50 : //2
					e.preventDefault();
					console.log("Pressing CTRL+2");
					var thisRow = trans.lastSelectedCell[0];
					if (trans.data[thisRow][2]) document.activeElement.insertAtCaret(trans.data[thisRow][2]);
					$("#currentCellText").trigger("change")
				break;
				case 51 : //3
					e.preventDefault();
					console.log("Pressing CTRL+3");
					var thisRow = trans.lastSelectedCell[0];
					if (trans.data[thisRow][3]) document.activeElement.insertAtCaret(trans.data[thisRow][3]);
					$("#currentCellText").trigger("change")
				break;
				case 52 : //4
					e.preventDefault();
					console.log("Pressing CTRL+4");
					var thisRow = trans.lastSelectedCell[0];
					if (trans.data[thisRow][4]) document.activeElement.insertAtCaret(trans.data[thisRow][4]);
					$("#currentCellText").trigger("change")
				break;
				case 53 : //5
					e.preventDefault();
					console.log("Pressing CTRL+5");
					var thisRow = trans.lastSelectedCell[0];
					if (trans.data[thisRow][5]) document.activeElement.insertAtCaret(trans.data[thisRow][5]);
					$("#currentCellText").trigger("change")
				break;
				case 54 : //6
					e.preventDefault();
					console.log("Pressing CTRL+6");
					var thisRow = trans.lastSelectedCell[0];
					if (trans.data[thisRow][6]) document.activeElement.insertAtCaret(trans.data[thisRow][6]);
					$("#currentCellText").trigger("change")
				break;
				case 55 : //7
					e.preventDefault();
					console.log("Pressing CTRL+7");
					var thisRow = trans.lastSelectedCell[0];
					if (trans.data[thisRow][7]) document.activeElement.insertAtCaret(trans.data[thisRow][7]);
					$("#currentCellText").trigger("change")
				break;
				case 56 : //8
					e.preventDefault();
					console.log("Pressing CTRL+8");
					var thisRow = trans.lastSelectedCell[0];
					if (trans.data[thisRow][8]) document.activeElement.insertAtCaret(trans.data[thisRow][8]);
					$("#currentCellText").trigger("change")
				break;
				case 57 : //9
					e.preventDefault();
					console.log("Pressing CTRL+9");
					var thisRow = trans.lastSelectedCell[0];
					if (trans.data[thisRow][9]) document.activeElement.insertAtCaret(trans.data[thisRow][9]);
					$("#currentCellText").trigger("change")
				break;

			}
		}
		
		if (e.altKey) {
			switch(keyCode) {
				case 48 : //0
					e.preventDefault();
					console.log("Pressing ALT+0");
					document.activeElement.insertAtCaret(trans.getTranslationByIndex(0));
					$(document.activeElement).trigger('change');
				break;
				case 49 : //1
					e.preventDefault();
					console.log("Pressing ALT+1");
					document.activeElement.insertAtCaret(trans.getTranslationByIndex(1));
					$(document.activeElement).trigger('change');
				break;
				case 50 : //2
					e.preventDefault();
					console.log("Pressing ALT+2");
					document.activeElement.insertAtCaret(trans.getTranslationByIndex(2));
					$(document.activeElement).trigger('change');
				break;
				case 51 : //3
					e.preventDefault();
					console.log("Pressing ALT+3");
					document.activeElement.insertAtCaret(trans.getTranslationByIndex(3));
					$(document.activeElement).trigger('change');
				break;
				case 52 : //4
					e.preventDefault();
					console.log("Pressing ALT+4");
					document.activeElement.insertAtCaret(trans.getTranslationByIndex(4));
					$(document.activeElement).trigger('change');
				break;
				case 53 : //5
					e.preventDefault();
					console.log("Pressing ALT+5");
					document.activeElement.insertAtCaret(trans.getTranslationByIndex(5));
					$(document.activeElement).trigger('change');
				break;
				case 54 : //6
					e.preventDefault();
					console.log("Pressing ALT+6");
					document.activeElement.insertAtCaret(trans.getTranslationByIndex(6));
					$(document.activeElement).trigger('change');
				break;
				case 55 : //7
					e.preventDefault();
					console.log("Pressing ALT+7");
					document.activeElement.insertAtCaret(trans.getTranslationByIndex(7));
					$(document.activeElement).trigger('change');
				break;
				case 56 : //8
					e.preventDefault();
					console.log("Pressing ALT+8");
					document.activeElement.insertAtCaret(trans.getTranslationByIndex(8));
					$(document.activeElement).trigger('change');
				break;
				case 57 : //9
					e.preventDefault();
					console.log("Pressing ALT+9");
					document.activeElement.insertAtCaret(trans.getTranslationByIndex(9));
					$(document.activeElement).trigger('change');
				break;

			}
		}		
	});
	
	// Open .externalLink anchor to native browser
	$("a.externalLink, a[external]").on("click", function(e) {
		e.preventDefault();
		nw.Shell.openExternal($(this).attr("href"));
	})

	
	// =============================================================
	// HANDLING TEXTAREA SUGGESTION
	// =============================================================
	
	/*
	window.elements = ['span', 'div', 'h1', 'h2', 'h3'];
	$('#currentCellText').textcomplete([
		{ // html
			match: /<(\w*)$/,
			search: function (term, callback) {
				callback($.map(elements, function (element) {
					return element.indexOf(term) === 0 ? element : null;
				}));
			},
			index: 1,
			replace: function (element) {
				return ['<' + element + '>', '</' + element + '>'];
			}
		}
	]);	
	*/
	
	window.elements = ['span', 'div', 'h1', 'h2', 'h3'];	
	window.words = [];
	$('#currentCellText').textcomplete([
	{	
		match: /(^|\b)(\w{1,})$/,
		//match: /(^|\b)(.*?)$/,
		search: function (term, callback) {
			
			callback($.map(words, function (word) {
				return word.indexOf(term) === 0 ? word : null;
			}));
		},
		replace: function (word) {
			return word + ' ';
		}
	},
	{ // html
        match: /<(\w*)$/,
        search: function (term, callback) {
            callback($.map(elements, function (element) {
                return element.indexOf(term) === 0 ? element : null;
            }));
        },
        index: 1,
        replace: function (element) {
            return ['<' + element + '>', '</' + element + '>'];
        }
    },
	{ // html
        //mentions: ['yuku_t'],
        match: /\B\\(\w*)$/,
        search: function (term, callback) {
            //callback($.map(this.mentions, function (mention) {
            callback($.map(ui.autoComplateData, function (mention) {
                return mention.indexOf(term) === 0 ? mention : null;
            }));
        },
        index: 1,
        replace: function (mention) {
            return mention + '';
        }
    }	
	
	]);	
	
	// =============================================================
	// FILTERABLE 
	// =============================================================
	window.commandOption = {
	  valueNames: [
		'filterable',
		{ data: ['id'] }
	  ]
	};	
	ui.fileList = new List('menuPanel', commandOption);		

	ui.isLoaded = true;
	
	
	ui.cellInfoTab = new ui.CellInfoTab($(".cellInfoPartsA"));
	ui.cellTranslationTab = new ui.CellInfoTab($(".cellInfoPartsB"), {eventName:"translationOnTabChange"});
	
	// initialization 
	ui.resize.init();
	
	$("#busyOverlay").removeClass("pitchBlack");
	$("#busyOverlay").addClass("hidden");
	ui.fixCellInfoSize();
	// close all child window in initialization
	//ui.closeAllChildWindow(true);
	
	sys.onReady(function() {
		ui.init();
	})
	ui.initTextResizer();
	ui.isInitialized = true;
	ui.introWindowShow();
	ui.onReady(function() {});
	
});

