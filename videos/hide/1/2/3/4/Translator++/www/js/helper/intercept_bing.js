(()=>{
	console.log("Ajax interceptor is loaded");
	console.log("This script will run window.onAfterIntercept() when loading https://www.bing.com/ttranslatev3");
	var originalXMLHttpRequest_send = XMLHttpRequest.prototype.send;
	XMLHttpRequest.prototype.send = function(sentData) {
		var parseQuery = function(queryString) {
			if (!queryString) return;
			var query = {};
			var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
			for (var i = 0; i < pairs.length; i++) {
				var pair = pairs[i].split('=');
				query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
			}
			return query;
		}	

		var base = 'https://www.bing.com/ttranslatev3';
		var self = this;
		var parsedData;
		if (typeof sentData == 'string') {
			parsedData = parseQuery(sentData);
		}
		

		
		var onReadyStateChange = () => {
			var result = {};
			if (this.responseURL.includes(base) == false) return;
			if (this.readyState !== 4 ) return result;
			
			console.log("Ajax intercepted");
			console.log("response url:", this.responseURL);	
			console.log("This:", JSON.stringify(this, undefined, 2));	
			console.log("parsedData", parsedData);
			console.log(this, arguments);
			
			result = {
				response:this.response,
				url:this.responseURL,
				data:parsedData
			}
			
			if (typeof window.onAfterIntercept == 'function') {
				window.onAfterIntercept.call(this, result)
			}
		}
		
		originalXMLHttpRequest_send.apply(this, arguments);

		if (parsedData) {
			// only intercept when has post data
			this.addEventListener("readystatechange", onReadyStateChange, false);
		}
	}
	
	
	window.setInterval(function() {
		var parent = window.opener;
		console.log("pinging parent");
		if (Boolean(parent) == false) {
			console.log("parent doesn't exist");
			return window.close();
		}
	}, 5000);
})();
