var php = {
	binPath: nw.App.manifest.localConfig.php||"php\\php.exe",
	documentRoot : "www\\php\\"	
}

php.run = function(script, args) {
	var escapeShell = function(cmd) {
	  return '"'+cmd.replace(/(["\s'$`\\])/g,'\\$1')+'"';
	};
	
	if (typeof window.exec  == "undefined") {
		window.exec = require('child_process').exec;
	}
	script = script||"default.php";
	
	script = '"'+nw.process.cwd()+"\\"+php.documentRoot+script+'"';
	args = args||{};
	argsStr = btoa(JSON.stringify(args));
	
	
	console.log(args);
	
	
	exec('"'+nw.process.cwd()+"\\"+php.binPath+'" '+script+' '+argsStr , function callback(error, stdout, stderr){
		console.log(this);
		console.log(error);
		console.log(stdout);
	});
	
	
	
	
	/*
	exec('"F:\\GDrive\\Other\\New Engine\\php\\php.exe" "F:\\GDrive\\Other\\New Engine\\www\\php\\default.php"', args, function callback(error, stdout, stderr){
	   console.log(error);
	   console.log(stdout);
	});
	*/
}	

php.evalResult = function(stdout) {
	var json;
	try
	{
	   json = JSON.parse(stdout);
	}
	catch(e)
	{
	   json = stdout;
	}	
	return json;
	
}

php.call = function(script, options) {
	options = options||{};
	options.args = options.args||{};
	options.onDone = options.onDone||function(result, e) {};
	options.onError = options.onError||function(result, e) {};
	
	
	if (typeof window.exec  == "undefined") {
		window.exec = require('child_process').exec;
	}
	script = script||"default.php";
	
	script = '"'+nw.process.cwd()+"\\"+php.documentRoot+script+'"';
	argsStr = btoa(JSON.stringify(options.args));
	
	console.log(options.args);
	
	exec('"'+nw.process.cwd()+"\\"+php.binPath+'" '+script+' '+argsStr, {maxBuffer: 1024 * 50000}, function callback(error, stdout, stderr){
		console.log(this);
		console.log(stdout);
		if (error) {
			//console.log(error);
			options.onError.call(this, stdout, stderr, error);
		}
		options.onDone.call(this, stdout, stderr, error);
		
	});
	
}	


//=====================================================
var childProcess = require("child_process");
if (nw.App.manifest.debugLevel > 3) {
	var oldSpawn = childProcess.spawn;
	function mySpawn() {
		console.log('spawn called');
		console.log(arguments);
		var result = oldSpawn.apply(this, arguments);
		return result;
	}
	childProcess.spawn = mySpawn;
}
// ====================================================
php.spawn = async function(script, options) {
	options = options||{};
	options.args 	= options.args||{};
	options.onData 	= options.onData||function(result, e) {};
	options.onDone 	= options.onDone||function(result, e) {};
	options.onError = options.onError||function(result, e) {};
	options.scriptPath = options.scriptPath || nwPath.join(nw.process.cwd(), php.documentRoot)
	//options.onReceive = options.onReceive||function(result, e) {};
	var resolver;
	var rejecter;
	var thisPromise = new Promise((resolve, reject)=>{
		resolver = resolve;
		rejecter = reject;
	});	
	
	
	if (typeof window.exec  == "undefined") {
		window.exec = require('child_process').exec;
	}
	//script = script||"default.php";
	
	script = nwPath.join(options.scriptPath, script);
	argsStr = btoa(encodeURIComponent(JSON.stringify(options.args)));
	
	console.log(options.args);
	var outputBuffer = "";
	//const { spawn } = require('child_process');
	if (typeof window.spawn  == "undefined") {
		window.spawn = require('child_process').spawn;
	}
	

	//var child = spawn('"'+nw.process.cwd()+"\\"+php.binPath+'"', [script, argsStr]);
	console.log("Spawning : ", script);
	var child = spawn(nw.process.cwd()+"\\"+php.binPath, [script, argsStr, 'url']);

	
	child.stdout.on('data', function (data) {
		//console.log('stdout: ' + data);
		outputBuffer += data;
		//console.log("Received buffer : "+data);
		options.onData.call(this, data);
		//options.onReceive.call(this, data);
	});

	child.stderr.on('data', function (data) {
		console.log('stderr: ' + data);
		options.onError.call(this, data);
		
	});

	child.on('close', function (code) {
		console.log('child process exited with code ' + code);
		//console.log("data is : "+outputBuffer);
		var result = php.evalResult(outputBuffer)
		options.onDone.call(this, result);
		resolver(result);
	});	
	
	return thisPromise;
}


php.spawnSync = function(script, options) {
	options = options||{};
	options.args = options.args||{};
	options.onData = options.onData||function(result, e) {};
	options.onDone = options.onDone||function(result, e) {};
	options.onError = options.onError||function(result, e) {};
	//options.onReceive = options.onReceive||function(result, e) {};
	
	
	if (typeof window.exec  == "undefined") {
		window.exec = require('child_process').exec;
	}
	script = script||"default.php";
	
	script = nw.process.cwd()+"\\"+php.documentRoot+script;
	argsStr = btoa(encodeURIComponent(JSON.stringify(options.args)));
	
	console.log(options.args);
	var outputBuffer = "";
	
	if (typeof window.spawnSync  == "undefined") {
		window.spawnSync = require('child_process').spawnSync;
	}
	

	//var child = spawn('"'+nw.process.cwd()+"\\"+php.binPath+'"', [script, argsStr]);
	console.log("Spawning : ", script);
	var child = spawnSync(nw.process.cwd()+"\\"+php.binPath, [script, argsStr, 'url']);
	
	var output = child.stdout.toString();
	
	options.onData.call(this, output);
	options.onError.call(this, child.stderr);
	child.result = php.evalResult(output);
	options.onDone.call(this, child.result);
	
	/*
	child.stdout.on('data', function (data) {
		//console.log('stdout: ' + data);
		outputBuffer += data;
		//console.log("Received buffer : "+data);
		options.onData.call(this, data);
		//options.onReceive.call(this, data);
	});

	child.stderr.on('data', function (data) {
		console.log('stderr: ' + data);
		options.onError.call(this, data);
		
	});

	child.on('close', function (code) {
		console.log('child process exited with code ' + code);
		//console.log("data is : "+outputBuffer);
		options.onDone.call(this, php.evalResult(outputBuffer));
	
	});	
	*/
	
	return child;
	
}	

php.test = function($script) {
	// directly call script and get the output
	php.spawn($script, {
		onDone:function(result) {console.log(result)},
		onError:function(result) {console.warn(result)}
	})

}

php.checkPathSync = function($path) {
	// check given path from PHP interpreter
	// utilize checkPath.php
	var result = this.spawnSync("checkPath.php", {
		args:{"path":$path}
	})
	return result.result;
}

php.copyTreeSync = function(from, to) {
	var result = this.spawnSync("copytree.php", {
		args:{
			"from":from,
			"to":to
			}
	})
	return result.result;	
}

php.copyTree = function(from, to, options) {
	options = options||{};
	options.onData = options.onData||function() {};
	options.onDone = options.onDone||function() {};
	var that = this;
	
	setTimeout(function(){
		that.spawn("copytree.php", {
			args:{
				"from":from,
				"to":to
				},
			onData:options.onData,
			onDone:options.onDone
		})	
	}, 10);

}


php.isEnigma = async function(path) {
	var resolver;
	var thisPromise = new Promise((resolve, reject)=>{
		resolver = resolve;
	});
	this.spawn("isEnigma.php", {
		args:{
			"path":path
			},
		onData:(data)=> {
			//console.log(data)
		},
		onDone:(data) => {
			console.log("done");
			resolver(data);
		}
	})
	return thisPromise;
}

php.extractEnigma = async function(from, to, options) {
	// will extract enigma from game.exe path to target
	// will copy directly if the target path is not enigma
	console.log("extracting enigma data if exist");
	var resolver;
	var thisPromise = new Promise((resolve, reject)=>{
		resolver = resolve;
	});

	
	options = options||{};
	options.onData = options.onData||function() {};
	options.onDone = options.onDone||function() {};
	var that = this;
	setTimeout(function(){
		that.spawn("extractEnigma.php", {
			args:{
				"from":from,
				"to":to
				},
			onData:options.onData,
			onDone:()=> {
				options.onDone.call(this);
				resolver(to);
			}
		})	
	}, 10);	
	return thisPromise;
	
}

