var getConfiguration = function() {
	var fs = fs || require('fs');
	var path = path || require('path')
	var configFile = nw.App.manifest.localConfig.configFile;
	var defaultConf = {
			configPath				:nw.App.manifest.localConfig.configFile,
			lastOpenedProject		:{},
			historyOpenedProject 	:{},
			historyOpenedFiles 		:[],
			translator				:"google"		
		}
	var config = {}
	
	fs.existsSync(configFile);
	if (!fs.existsSync(configFile)) {
		fs.mkdirSync(path.dirname(configFile), {recursive:true})
		fs.writeFileSync(configFile, JSON.stringify(defaultConf))
	} else {
		try {
			config = JSON.parse(fs.readFileSync(configFile))
		} catch (e) {
			console.warn("Unable to parse config file at ", configFile);
		}
	}
	config = Object.assign(defaultConf, config);
	return config;
}

if (window.require) window.transConfig = getConfiguration()