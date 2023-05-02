<?php
include("header.php");
set_time_limit(0);


// ==================================================
// DETECTING GAME ENGINE
// ==================================================
if (empty($_POST['gameEngine'])) {
	$_POST['gameEngine'] = detectGameEngine($_GET['gameFolder']);
}

$RPG_MAKER_TRANS=array("rmxp", "rmvx", "rmvxace");

if (!empty($_POST['rpgTransFormat']) && in_array($_POST['gameEngine'], $RPG_MAKER_TRANS)) {
	include("./plugins/rpgmakertrans/loader.php");
} else if (is_file("./plugins/".$_POST['gameEngine']."/loader.php")) {
	include("./plugins/".$_POST['gameEngine']."/loader.php");
}

echo "Received parameters on export.php : \r\n";
print_r($_POST);


if ($_POST['exportMode'] == 'RPGMakerTrans') {
	echo "Exporting to RPGMakerTrans data\r\n";
	$projectCachePath = getProjectCahePath();
	echo "current cache path : $projectCachePath \r\n";
	exportToRMTrans($projectCachePath."\\autosave.json", $_POST['path'], $_POST['files']);
	echo "Done!\r\n";
/*	
} elseif ($_POST['exportMode'] == 'csv') {
	echo "Exporting to CSV\r\n";
	$projectCachePath = getProjectCahePath();
	echo "current cache path : $projectCachePath \r\n";
	exportToCSV($projectCachePath."\\autosave.json", $_POST['path'], $_POST['files']);
	echo "Done!\r\n";
*/
} elseif ($_POST['exportMode'] == 'csv') {
	require 'vendor/autoload.php';
	echo "Exporting to CSV\r\n";
	$projectCachePath = getProjectCahePath();
	echo "current cache path : $projectCachePath \r\n";
	exportToCSV2($projectCachePath."\\autosave.json", $_POST['path'], $_POST['files']);
	echo "Done!\r\n";
} elseif ($_POST['exportMode'] == 'xls') {
	require 'vendor/autoload.php';
	echo "Exporting to XLS\r\n";
	$projectCachePath = getProjectCahePath();
	echo "current cache path : $projectCachePath \r\n";
	exportToXls($projectCachePath."\\autosave.json", $_POST['path'], $_POST['files']);
	echo "Done!\r\n";	
} elseif ($_POST['exportMode'] == 'xlsx') {
	require 'vendor/autoload.php';
	echo "Exporting to XLSX\r\n";
	$projectCachePath = getProjectCahePath();
	echo "current cache path : $projectCachePath \r\n";
	exportToXlsx($projectCachePath."\\autosave.json", $_POST['path'], $_POST['files']);
	echo "Done!\r\n";	
} elseif ($_POST['exportMode'] == 'html') {
	require 'vendor/autoload.php';
	echo "Exporting to HTML\r\n";
	$projectCachePath = getProjectCahePath();
	echo "current cache path : $projectCachePath \r\n";
	exportToHtml($projectCachePath."\\autosave.json", $_POST['path'], $_POST['files']);
	echo "Done!\r\n";	
} elseif ($_POST['exportMode'] == 'ods') {
	require 'vendor/autoload.php';
	echo "Exporting to ODS\r\n";
	$projectCachePath = getProjectCahePath();
	echo "current cache path : $projectCachePath \r\n";
	exportToOds($projectCachePath."\\autosave.json", $_POST['path'], $_POST['files']);
	echo "Done!\r\n";	
} else {
	// export to dir / zip handler
	exportProject($_POST['gameFolder'], $_GET['path'], $_POST['files']);
}