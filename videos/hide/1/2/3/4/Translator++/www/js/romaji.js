romaji = {
	maxCache: 100,
	cache:[],
	cacheData:{},
	rowMode:"table" // table or cell
};
trans.config = trans.config||{};
trans.config.loadRomaji = trans.config.loadRomaji||true;

romaji.addCache = function(data, result) {
	if (!data) return false;
	if (romaji.cache.includes(data) == false) {
		romaji.cache.unshift(data);
		romaji.cacheData[data] = result;
		
		while (romaji.cache.length > romaji.maxCache) {
			var id = romaji.cache.pop();
			delete romaji.cacheData[id];
		}
	}
	return true;
}

romaji.loadCache = function(data) {
	if (typeof romaji.cacheData[data] !== 'undefined') return romaji.cacheData[data];
	return false;
}

romaji.resolve = function(text, $target) {
	if (!text) {
		$target.text("");
		$target.addClass("plain");
		return false;
	}
	if (common.containJapanese(text) == false) {
		$target.text(text);
		$target.addClass("plain");
		$target.attr("data-lang", "");
		return false;
	}
	
	$target.removeClass("plain");
	$target.attr("data-lang", "ja");
	var loadedCache = romaji.loadCache(text);
	if (loadedCache !== false) {
		$target.empty();
		/*
		for (var i=0; i<loadedCache.length; i++) {
			var template = $("<span><i>"+loadedCache[i]['romaji']+"</i><b>"+loadedCache[i]['original']+"</b></span>");
			$target.append(template);
		}
		*/
		for (var line=0; line<loadedCache.length; line++) {
			if (romaji.rowMode !== "table") {
				var $row=$("<div class='wbw'></div>");
				if (Array.isArray(loadedCache[line]) == false) continue;
				for (var i=0; i<loadedCache[line].length; i++) {
					if (loadedCache[line][i]['romaji'].length < 1) loadedCache[line][i]['romaji'] = " ";
					var template = $("<span><i>"+loadedCache[line][i]['romaji']+"</i><b>"+loadedCache[line][i]['original']+"</b></span>");
					$row.append(template);
				}
				$target.append($row);
			} else {
				var $row=$("<div class='tbl'></div>");
				if (Array.isArray(loadedCache[line]) == false) continue;
				
				var $romaji = $("<span class='romaji'></span>");
				var $kanji 	= $("<span class='kanji'></span>");
				for (var i=0; i<loadedCache[line].length; i++) {
					if (loadedCache[line][i]['romaji'].length < 1) loadedCache[line][i]['romaji'] = " ";
					$romaji.append("<i>"+loadedCache[line][i]['romaji']+"</i>");
					$kanji.append("<b>"+loadedCache[line][i]['original']+"</b>");
				}
				$row.append($romaji);
				$row.append($kanji);
				
				$target.append($row);
		
			}
		}		
		
		return true;
	}
	
	php.spawn("translator\\mecab\\mecab.php", {
			args:{
				'text':text
			},
		onDone:function(result) {
			console.log("Mecab result :", result);
			if (Array.isArray(result)) {
				romaji.addCache(text, result);
				if (typeof $target == 'undefined') return result;
				$target.empty();
				
				if (romaji.rowMode !== "table") {
					for (var line=0; line<result.length; line++) {
						var $row=$("<div class='wbw'></div>");
						if (Array.isArray(result[line]) == false) continue;
						for (var i=0; i<result[line].length; i++) {
							if (result[line][i]['romaji'].length < 1) result[line][i]['romaji'] = " ";
							var template = $("<span><i>"+result[line][i]['romaji']+"</i><b>"+result[line][i]['original']+"</b></span>");
							$row.append(template);
						}
						$target.append($row);
					}
				} else{
					for (var line=0; line<result.length; line++) {
						var $row=$("<div class='tbl'></div>");
						if (Array.isArray(result[line]) == false) continue;
						
						var $romaji = $("<span class='romaji'></span>");
						var $kanji 	= $("<span class='kanji'></span>");
						for (var i=0; i<result[line].length; i++) {
							if (result[line][i]['romaji'].length < 1) result[line][i]['romaji'] = " ";
							$romaji.append("<i>"+result[line][i]['romaji']+"</i>");
							$kanji.append("<b>"+result[line][i]['original']+"</b>");
						}
						$row.append($romaji);
						$row.append($kanji);
						
						$target.append($row);
					}				
				}
			}
		}
	});	
	return true;
}