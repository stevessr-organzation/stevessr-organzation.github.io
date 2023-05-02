<?php
include("header.php");
ob_end_clean();
set_time_limit(0);
header("Content-type:text/json");

function isJson($string) {
 json_decode($string);
 return (json_last_error() == JSON_ERROR_NONE);
}

if (empty($_GET['folder'])) {
	die();
}

if (!is_dir($_GET['folder'])) {
	die();
}

$_PARAM['skipElement'] = array();
if (!empty($_POST['skipElement'])) {
	$_PARAM['skipElement'] = $_POST['skipElement'];
	if (!is_array($_PARAM['skipElement'])) $_PARAM['skipElement'] = array();
}

$FILELIST = get_folder_content($_GET['folder']);

$CACHELIST = array();
if (is_dir(_CACHE_PATH.$_POST['gameTitle'])) {
	$CACHELIST = get_folder_content(_CACHE_PATH.$_POST['gameTitle']);
}

$_PARAM['ACCEPTED_EXTENSION'] = array("json", "txt", "csv");

if (is_file("./plugins/".$_POST['gameEngine']."/loader.php")) {
	include("./plugins/".$_POST['gameEngine']."/loader.php");
}

//print_r($FILELIST);

$RESULT = array();
$RESULT['loc'] = $_GET['folder'];

foreach ($FILELIST['files'] as $key=>$path) {
	$current= pathinfo($path);
	$current['path'] = $current['dirname']."\\".$current['basename'];
	
	if (!in_array(strtolower($current['extension']), $_PARAM['ACCEPTED_EXTENSION'])) continue;
	$text = file_get_contents($current['path']);
	
	$loadedData = loader($text);
	//$current['content'] = $loadedData['content'];
	$current['data'] = $loadedData['data'];
	$current['type'] = $loadedData['type'];
	$current['relPath'] = substr($current['path'], strlen($RESULT['loc']));
	/*
	if (!is_file(_CACHE_PATH.$_POST['gameTitle']."//".$current['basename']."json")) {
		// load from original dump file
		file_put_contents(_CACHE_PATH.$_POST['gameTitle']."//".$current['basename']."json", json_encode()
		$current['freshBuild'] = true;
	} else {
		//load from trans data cache
		$current['freshBuild'] = false;
		
	}
	*/
	
	$RESULT['files'][$current['relPath']] = $current;
}

//print_r($RESULT);
echo json_encode($RESULT);