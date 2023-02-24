---
title: ggb
date: 2023-02-23 21:34:25
tags:{"ggb"}
---
<meta name=viewport content="width=device-width,initial-scale=1">  
<meta charset="utf-8"/>
<script src="deployggb.js"></script>
<!---
<script src="webSimple.nocache.js"></script>
<article class="geogebrawebs"
         data-param-width="650"
         data-param-height="460"
         data-param-useBrowserForJS="false"
         data-param-enableShiftDragZoom="false"
         data-param-ggbbase64="UEs......==">
</article>
<script src="webSimple.nocache.js"></script>
<article class="geogebraweb"
         data-param-width="780" data-param-height="460"
         data-param-enableRightClick="false"
         data-param-ggbbase64="UEsDBBQ...AAAAA=">
</article>
--->
<div id="ggb-element"></div> 
<script>  
    var params = {"appName": "graphing", "width": 800, "height": 600, "showToolBar": true, "showAlgebraInput": true, "showMenuBar": true };
    var applet = new GGBApplet(params, true);
    window.addEventListener("load", function() { 
        applet.inject('ggb-element');
    });
</script>

<div></div>