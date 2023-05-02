<?php
include_once("init.php");
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
    <title>Error</title>
    <meta name="viewport" content="width=device-width, initial-scale = 1.0, maximum-scale=1.0, user-scalable=no"/>
<style>
@font-face {
    font-family: league_gothic;
    src: url(/ballot/template/font/league_gothic.woff);
}

@font-face {
    font-family: helvetica_neue_bold;
    src: url(/ballot/template/font/HelveticaNeue-Bold.woff);
}

h1 {
font-family: league_gothic,Arial,sans-serif;
    font-size: 4em;
    text-transform: uppercase;
    color: #373737;
	margin:0.2em;
	text-shadow: 1px 1px 0px rgba(255, 255, 255, .6);
	letter-spacing:4px;
}

h2 {
		margin:0.2em;
    font-size: 2em;		
		font-family: league_gothic,Arial,sans-serif;		
}

.user_point {
    color: #FFB042;
	font-weight:bold;
}

.user_star {
	width:20px;
	height:20px;
}

.point_cl {
    color: #FFB042;
	font-size: 4em;
    font-family: league_gothic,Arial,sans-serif;
	text-shadow: 1px 1px 0px rgba(255, 255, 255, .6);			
}

.star_cl {
	width	:80px;
	height	:80px;
}

.item_name {
    color: #2E85FF;
	font-size: 4em;
    font-family: league_gothic,Arial,sans-serif;
	text-shadow: 1px 1px 0px rgba(255, 255, 255, .6);			
}

.yes_cancel {
	margin-top:0.3em;
}

.dv_button {
    font-family: league_gothic,Arial,sans-serif;
    font-size: 3em;
    line-height: 1;
    display: inline-block;
    min-width: 165px;
    padding: 13px 26px;
    text-align: center;
    text-decoration: none;
    text-transform: uppercase;
    color: #fff;
    border-radius: 6px;
	margin: 16px 16px 0px 16px;
}

.yes {
    background-color: #00afec;
	transition: all .3s ease-in-out;
}

.yes:hover {
    background-color: #0AC0FF;
	transition: all .3s ease-in-out;	
}

.yes:selected {
    background-color: #0AC0FF;
	transition: all .3s ease-in-out;	
}

.no {
    background-color: #ff6000;
	transition: all .3s ease-in-out;
}
.no:hover {
    background-color: #FF7826;
	transition: all .3s ease-in-out;
}

.no:selected {
    background-color: #FF7826;
	transition: all .3s ease-in-out;
}

.claim-msg {
    font-family: helvetica_neue_bold,Verdana,sans-serif;
	font-size:1.3em;
	margin:32px;
}

body{
font-family:Helvetica,Arial,sans-serif;
color:#555;
background-color:#f7f7f7;
-webkit-font-smoothing:antialiased
letter-spacing: 1px;
}

.container {
	max-width: 680px;
margin:auto;	
}

.container .data {
	list-style-type :none;
	margin-top: 28px;
	margin-left: 28px
	padding:0px;
}
.container .data li{
	margin-bottom:24px;

}
.container .data .label {
	color:#d27a00;
	font-size: 11pt;
	font-family: helvetica_neue_bold;
	letter-spacing: 3px;
	margin-bottom: 8px;	
}
.container .data .info {
	color:#555;
	font-size: 14pt;
	margin-left:20px
}
.container .data .serial-number {
	font-family: "Courier New", Monaco, monospace;
	font-size:10pt;

}

.container .data .fullwidth-info {
	font-size: 10pt;
	margin-left:0px;
	font-style:italic;
	
}

.container .data .fullwidth-info .footer-highlight {
	font-weight:bold;
	color:#d27a00;
}

.pinfo-otherlang, .subtitle {
	margin-top: -24px;
	font-family: helvetica_neue_bold;
	letter-spacing: 3px;
	color:#d27a00;
	font-size: 11pt;
	text-align:left;
	padding-left: 64px;
	font-weight:bold;
}

.history-row {
	font-size:10pt;
	letter-spacing:2px;
	padding-bottom:3px;
}

.hidden {
	display:none;
}
</style>
  
</head>

<body>
<div class="container">
<h1>RMMV Project not found!</h1>
<h2 class="subtitle">Please Set-up required configuration.</h2>
<p>If problem persist after setting-up project path, please check configuration in <u>init.php</u>!</p>
<input type="hidden" value="<?php echo $_PARAM['PATH_TO_PROJECT']; ?>" id="pathToProject" />
<div class="big-button"><button class="selectProjectPath" onclick="document.getElementById('subframe').src='selectfile.php?id=pathToProject&default=<?php echo $_PARAM['PATH_TO_PROJECT']; ?>'">Select project path</button></div>
<iframe id="subframe" src="selectfile.php?id=pathToProject&default=<?php echo $_PARAM['PATH_TO_PROJECT']; ?>" class="hidden"></iframe>

</div>
</body>
</html>