/* ==UserScript==
@name          My Script
@namespace     http://www.example.com/gmscripts
@description   Scripting is fun
@include       http://www.example.com/*
@include       http://www.example.org/*
@exclude       http://www.example.org/foo
@require       foo.js
@resource      resourceName1 resource1.png
@resource      resourceName2 http://www.example.com/resource2.png
@version       1.0
@icon          http://www.example.net/icon.png
==/UserScript== */

console.log("environment  : ", this);
var xx = 20;
console.log(xx);

console.log("this identity", this.identity);

function helloWorld() {
	var xx = 100;
	console.log(xx);
	console.log("from hello world", this);
	console.log("this identity", this.identity);
	
}
helloWorld();

void function() {
	var helloWorld = "yoooo";
	console.log(helloWorld);
	console.log("loaded", this);
}();