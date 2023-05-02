var thisAddon 	= this;
var appName 	= this.package.name;
var spawn 		= spawn || require('child_process').spawn;
var ws 			= ws || require('windows-shortcuts');
var ini 		= ini || require('ini')
var stripBom	= require('strip-bom');
var bCopy 		= require('better-copy');
var fse 		= require('fs-extra');

var RMMZ = function(file, options) {
	this.file 		= file;
	this.dirname 	= nwPath.dirname(file);
}
// utils
RMMZ.getExe = async function(dir) {
	var list = await common.getAllExt(dir, "exe");
	var blacklist = ["notification_helper"]
	for (var i in list) {
		if (blacklist.includes(list[i])) continue;
		return list[i];
	}
	return false;
}


RMMZ.prototype.init = async function(file, options) {
	
}

RMMZ.prototype.fetch = async function() {
	
}

window.RMMZ = RMMZ;

function init() {

}


$(document).ready(function() {
	ui.onReady(function() {
		init();
	});
});