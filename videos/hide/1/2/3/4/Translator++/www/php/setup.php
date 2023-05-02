<?php
include("header.php");
include("function/template.simple.php");
include("function/rmmv.php");

function setup_environment() {
	
	$pathFile = $_SERVER['APPDATA']."\\ToyBox\\path.txt";
	if (!is_file($pathFile)) {
		if (!is_dir($_SERVER['APPDATA']."\\ToyBox\\")) {
			mkdir($_SERVER['APPDATA']."\\ToyBox\\", 0777, true);
		}
		
		$pathContent = realpath($_SERVER['SERVER_ROOT']."\\..\\Toybox.exe");
		
		file_put_contents($pathFile, $pathContent);
	}	
}
function setup_RMMV($INSTALL_FOLDER="") {
	setup_environment();

	//  begin installation
	if (empty($INSTALL_FOLDER)) {
		$INSTALL_FOLDER = get_rmmv_tool_path();
	}
	/*
	if (empty($INSTALL_FOLDER)) {
		$INSTALL_FOLDER = $_SERVER['ProgramFiles(x86)']."\\KADOKAWA\\";
	}
	
	if (! is_dir($INSTALL_FOLDER)) {
		$INSTALL_FOLDER = $_SERVER['ProgramFiles(x86)']."\\Steam\\steamapps\\common\\RPG Maker MV\\tool\\";
	}
	if (! is_dir($INSTALL_FOLDER)) {
		die("RPG Maker MV installation folder not found");
	}	
	*/
	
	chdir($_SERVER['SERVER_ROOT']."\\setup");
	$thisPath = getcwd();
	$thisPath = str_replace("/", "\\", $thisPath)."\\";
	$INSTALL_FOLDER = str_replace("/", "\\", $INSTALL_FOLDER);
	//echo "elevate ROBOCOPY \"".$thisPath."ToyBox\" \"$INSTALL_FOLDER\\ToyBox\" /s";
$SCRIPT = '
ECHO OFF
cls
ROBOCOPY "'.$thisPath.'ToyBox" "'.$INSTALL_FOLDER."\\".'ToyBox" /s
echo.
echo.
ECHO Installation procedure is done!
pause
';	
	file_put_contents("setup.bat", $SCRIPT);
	//passthru("elevate ROBOCOPY \"".$thisPath."ToyBox\" \"$INSTALL_FOLDER\\ToyBox\" /s");
	passthru("elevate setup.bat");
	
}

if (!empty($_POST)) {
	/*
	if (!is_dir($_POST['rmmv_path'])) {
		die("path ".$_POST['rmmv_path']. "is not found!");
		
	}
	*/
	//setup_RMMV($_POST['rmmv_path']);
	
	// new version, directly write to registry. Launcher is not needed anymore.
	if ($_GET['method']=='setup') {
		add_toybox_as_tool();
	} elseif ($_GET['method'] == 'unsetup') {
		remove_toybox_from_tool();
	}
	die();
}

$INSTALL_FOLDER = get_rmmv_tool_path();
/*
$INSTALL_FOLDER = $_SERVER['ProgramFiles(x86)']."\\KADOKAWA\\";
if (! is_dir($INSTALL_FOLDER)) {
	$INSTALL_FOLDER = $_SERVER['ProgramFiles(x86)']."\\Steam\\steamapps\\common\\RPG Maker MV\\tool\\";
}

if (! is_dir($INSTALL_FOLDER)) {
	die("RPG Maker MV installation folder not found");
}
*/
$_PARAM['INSTALL_FOLDER'] = $INSTALL_FOLDER;

if (is_rmmv_tool_registry_exist()) {
	$_PARAM['DEPLOYED'] = "true";
} else {
	$_PARAM['DEPLOYED'] = "false";
}

$_PARAM['RMMV_APP_PATH'] = get_rmmv_application_path();

// SETTING default asssoc file


echo dotemplate(file_get_contents(_TEMPLATE_PATH."setup.html"), $_PARAM);