trans = trans||{};
trans.rmvxace = {
	
}

trans.rmvxace.setAutocompleteData = function(text) {
	console.log("running trans.rmvxace.setAutocompleteData");
	if (typeof trans.lastSelectedCell == 'undefined') return false;
	text = text||trans.data[trans.lastSelectedCell[0]][0]||"";
	ui.lastRenderedText = ui.lastRenderedText||"";
	if (text == ui.lastRenderedText) return false;
	//console.log("text : "+text);
	//var newText = text;
	ui.autoComplateData = [];
	
	var collector = function() {
		ui.autoComplateData.push(arguments[0]);
		//console.log(arguments);
		/*
		var input = String(newText);
		var newString= input.replace(arguments[0], ' ');
		console.log(newString);
		return newString;
		*/
		
	}
	
	text = text.replace(/\\\s*(\w+)\s*\[\s*(.*?)\s*\]/g, collector);
	text = text.replace(/\\\s*(\w+)\s*\<\s*(.*?)\s*\>/g, collector);
	text = text.replace(/\\\s*(\w+)/, collector);
	text = text.replace(/\\\s*([\{\}\\\$\.\|\!\>\<\^])/, collector)	

	ui.lastRenderedText = text;
	
}

trans.rmvxace.render = function(filename, content, options) {
	var result = [];
	function getTranslatableText(obj) {
		var thisResult = [];
		for (var i in obj) {
			
		}
		
	}
	result = getTranslatableText();
	
}
