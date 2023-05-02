<?php
if (!empty($_SERVER['argv'][1])) {
	if ($_SERVER['argv'][2] == "url") {
		$_SERVER['GET'] = $_SERVER['POST'] = $_GET = $_POST = json_decode( rawurldecode(base64_decode($_SERVER['argv'][1])),1);
		
	} else {
		$_SERVER['GET'] = $_SERVER['POST'] = $_GET = $_POST = json_decode( base64_decode($_SERVER['argv'][1]),1);
		
	}
	
}
$_SERVER['APPLICATION_ROOT'] = $_SERVER['SERVER_ROOT'] = realpath("./");
$_SERVER['DOCUMENT_ROOT'] = $_SERVER['SERVER_ROOT'] = realpath("./");
