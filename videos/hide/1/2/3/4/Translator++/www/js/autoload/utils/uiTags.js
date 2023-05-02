// Tagging related UI

var UiTags = function(options) {
	this.options = options || {};
	this.options.options = this.options.options || $(`
			<div class="actionSet">
				<label class="flex"><input type="radio" name="exportTagAction" data-mark="cross" class="actionBlacklist" value="blacklist" /> <span>不处理带有所选标记的行（黑名单）</span></label>
				<label class="flex"><input type="radio" name="exportTagAction" data-mark="check" class="actionWhitelist" value="whitelist" /> <span>仅处理带有选定标记的行（白名单）</span></label>
				<label class="flex"><input type="radio" name="exportTagAction" data-mark="unknown" class="actionNone" value="" /> <span>忽略标签</span></label>
			</div>`);
	this.element = $();
	this.init.apply(this, arguments);
	this.reset();
	this.element.options = this.options;
}

UiTags.prototype.init = function() {
	this.element = $("<div class='uiTags uiTagsWrapper'></div>");
	//if (this.element.hasClass("rendered")) return this.element;
	
	for (var colorName in consts.tagColor) {
		var $temp = $('<input type="checkbox" value="'+colorName+'" />');
		$temp.addClass("colorTagSelector tagSelector");
		$temp.addClass(colorName);
		$temp.css("background-color", consts.tagColor[colorName]);
		$temp.attr("title", colorName)
		$temp.attr("name", "tagSelector");
		this.element.append($temp);
	}
	this.element.addClass("rendered")
	this.element.append(this.options.options);

	var that = this;
	this.element.attr("data-mark", "unknown");
	this.element.find("input").on("change", function() {
		var $this = $(this);
		that.element.attr("data-mark", $this.attr("data-mark"));	
	});
	
	var $loadSaved = $(`<div class="fieldgroup">
		<button class="loadLastSelection">${t('加载最后选择')}</button>
		<button class="resetField">${t('重置')}</button>
	</div>`);
	$loadSaved.find(".loadLastSelection").on("click", ()=> {
		console.log("clicked");
		this.fillField()
	});
	$loadSaved.find(".resetField").on("click", ()=> {
		console.log("clicked");
		this.resetField()
	});
	
	this.element.append($loadSaved);
	
	return this.element;
}

UiTags.prototype.reset = function() {
	this.element.find(".colorTagSelector").prop("checked", false);
	this.element.find(".actionNone").prop("checked", true);
	return this.element;
}

UiTags.prototype.$ = function() {
	return this.element;
}

UiTags.prototype.getValue = function(options) {
	options 			= options || {}
	// prompt for error?
	options.noPrompt 	= options.noPrompt || false;
	var tags = [];
	$.each(this.element.find(".tagSelector:checked"), function(){            
		tags.push($(this).val());
	});
	
	var filterTagMode = this.element.find("input[type='radio']:checked").val();
	if (!options.noPrompt) {
		if (tags.length > 0 && filterTagMode=="") {
			var conf = confirm("您选择了一个或多个标记，但操作为“无”。\n你选择的标签不会影响任何东西。\n\n要继续吗？");
			if (conf == false) return false;
		}
	}
	var result = {
		filterTag : tags,
		filterTagMode : filterTagMode
	}
	this.saveValue(result);
	return result;
}

UiTags.prototype.saveValue = function(result) {
	console.log("Saving value", result)
	if (!result) return;
	var val = JSON.stringify(result)
	localStorage.setItem('uiTags', val)
	return val;
}

UiTags.prototype.loadValue = function() {
	try {
		var data = localStorage.getItem('uiTags');
		return JSON.parse(data);
	} catch (e) {
		console.warn(e);
	}
	
	return {filterTag:[]}
}

UiTags.prototype.resetField = function() {
	this.$().find(".colorTagSelector").prop("checked", false);
	this.$().find("input[type='radio'].actionNone").prop("checked", true);
	this.$().find("input[type='radio']:checked").prop("checked", false);
}

UiTags.prototype.fillField = function(val) {
	val = val || this.loadValue();
	val = val || {};
	val.filterTag = val.filterTag || [];
	console.log("filling field with value : ", val);
	
	this.resetField();
	
	
	for (i in val.filterTag) {
		if (!val.filterTag[i]) continue;
		this.$().find(".colorTagSelector."+val.filterTag[i]).prop("checked", true);
	}
	
	if (Boolean(val.filterTagMode)) {
		console.log("filling filterTagMode", val.filterTagMode);
		this.$().find("input[value="+val.filterTagMode+"]").prop("checked", true)
	}
	
}