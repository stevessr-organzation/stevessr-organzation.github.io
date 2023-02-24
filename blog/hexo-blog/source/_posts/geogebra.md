---
title: geogebra
date: 2023-02-23 21:31:46
tags:
  - {"ggb"}
  - [ggb]
---
<meta name=viewport content="width=device-width,initial-scale=1">  
<meta charset="utf-8"/>
<script src="https://www.geogebra.org/apps/deployggb.js"></script>
<div id="ggb-element"></div> 
<script>  
    var params = {"appName": "graphing", "width": 800, "height": 600, "showToolBar": true, "showAlgebraInput": true, "showMenuBar": true };
    var applet = new GGBApplet(params, true);
    window.addEventListener("load", function() { 
        applet.inject('ggb-element');
    });
</script>