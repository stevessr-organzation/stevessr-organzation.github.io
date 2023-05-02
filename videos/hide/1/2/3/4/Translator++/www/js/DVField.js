/**
 * Render file selector fields
 * @param  {} rootElement
 */// custom field renderer
DVField = function(rootElement, options) {
	this.html = rootElement||$("body");
	this.options = options || {};
	this.options.disableAutoRender = this.options.disableAutoRender || false;
}

DVField.prototype.fileSelector = function(options) {
	options = options||{};
	options.onSelect = options.onSelect || function(path) { console.log(path)};
	options.accept = options.accept || "";
	options.multiple = options.multiple || false;
	options.dir = options.dir || false;
	options.save = options.save || undefined;
	options.default = options.default  || "";
	console.log("File selector", arguments);
	
	$(".__pseudoFileDlg1").remove();
	$elm = $("<input type='file' style='display:none' class='hidden __pseudoFileDlg1' />");
	$elm.on("input", function() {
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

DVField.prototype.renderDvFile = function($elm) {
	$elm.each(function() {
		var $this = $that = $(this);
		if ($this.hasClass('.rendered')) return $this;		
		var $psField = $("<input type='file' />");
		$.each(this.attributes, function() {
			if(this.specified) {
				$psField.attr(this.name, this.value);
			}
		});
		$psField.attr("type", "file");
		$psField.addClass("hidden");
		$(this).parent().append($psField);
		$(this).on("click.dvField", function(e) {
			$psField.trigger("click");
		});
		$psField.on("input.dvField", function(e) {
			$that.val($(this).val());
			var target = $(this).data("target")
			if (Boolean(target)) {
				$(target).val($(this).val())
			}					
			$that.trigger("input");
		})
		$psField.on("change.dvField", function(e) {
			$that.val($(this).val());
			var target = $(this).data("target")
			if (Boolean(target)) {
				$(target).val($(this).val())
			}					
			
			$that.trigger("change");
		})
		$(this).addClass("rendered");
	})
	return $elm;	
}

DVField.prototype.renderSelectPath = function($elm) {
	var thisDVField = this;	
	$elm.each(function() {
		var $this = $(this);	
		if ($this.hasClass('.rendered')) return $this;
	
		var $container = $("<span class='dvField dvFieldWrapper dvSelectPath dvSelectPath_wrapper'></span>");
		$this.attr("type", "text");
		$this.addClass("dvField_isRendered");
		
		$this.parent().append($container);
		$container.append($this);
		
		var $fldButton = $("<input type='button' class='dvFieldButton' value='...' />")
		$fldButton.on("click", function() {
			var $this = $(this).prev();
			window.globObj = $this;
			//console.log("nwdirectory", $this.attr());
			thisDVField.fileSelector({
				onSelect : function(path) {
					$this.val(path);
					$this.trigger("change");
				},
				accept 		: $this.attr("accept"),
				multiple 	: $this.is("[multiple]"),
				dir 		: $this.is("[nwdirectory]"),
				save 		: $this.attr("nwsaveas"),
				default		: $this.val()				
			})
		})
		
		$container.append($fldButton);
		$this.addClass("rendered");	
	})
}
/**
 * Render parameters that not directly applied to the form tags
 * This function will detect data-renderdvfield and render that field
 * data-targetfield is css selector string
 * @param  {} $elm
 */
DVField.prototype.renderSelectPathDelegate = function($elm) {
	var thisDVField = this;	
	$elm.each(function() {
		var $this = $(this);
		if ($this.hasClass("rendered")) return $this;
		if ($this.is("[data-renderdvfield]") == false) return $this;

		try {
			var $targetField = $($this.attr("data-renderdvfield"));
			if ($targetField.length == 0) return $this;
			$targetField.attr('accept', $this.attr('accept'));
			if ($this.is("[multiple]")) $targetField.attr("multiple", "multiple");
			if ($this.is("[nwdirectory]")) $targetField.attr("nwdirectory", "nwdirectory");
			if ($this.is("[nwsaveas]")) $targetField.attr("nwsaveas", "nwsaveas");

			thisDVField.renderSelectPath($targetField);			
		} catch (e) {
			console.warn("Error when rendering DVField");
		}


		$this.addClass("rendered");
	})
}


DVField.prototype.init = function() {
	// type="dvfile"
	// change default display of file field
	var thisDVField = this;
	$(document).ready(()=> {
		if (!this.options.disableAutoRender) {
			thisDVField.renderDvFile(this.html.find('[type=dvfile]').not(".rendered"));
			thisDVField.renderSelectPath(this.html.find('[type=dvSelectPath]').not(".rendered"));
			thisDVField.renderSelectPathDelegate(this.html.find('[data-renderdvfield]').not(".rendered"));
		}
	})
	
}