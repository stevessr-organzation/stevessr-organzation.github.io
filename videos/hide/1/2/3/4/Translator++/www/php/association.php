<?php
include("header.php");
include("function/rmmv.php");

if ($_GET['method'] == 'init') {
	if (empty($_POST['ext'])) {
		$_POST['ext'] = array("JSON", "DTRN");
	}
	$RESULT = array();
	foreach ($_POST['ext'] as $ext) {
		$regValue =  getRegValue('HKEY_CLASSES_ROOT\\'.strtolower($ext).'File');
		if (!empty($regValue)) {
			$RESULT[$ext] = true;
		}
	}
	echo json_encode($RESULT);
	die();
}



$_PARAM['TOYBOX_APP_PATH'] = realpath($_SERVER['SERVER_ROOT']."\\..\\Toybox.exe");
$EXT = strtolower($_POST['ext']);

print_r($_SERVER);
print_r($_PARAM);

if ($_POST['state'] == 'true' && !empty($EXT)) {
$REG = '
REG ADD HKEY_CLASSES_ROOT\Applications\Toybox.exe\shell\open\command /t REG_SZ /d "\"'.$_PARAM['TOYBOX_APP_PATH'].'\" --cgi-environment=\"TARGET=%%1\"" /f
REG ADD HKEY_CURRENT_USER\Software\Classes\Applications\Toybox.exe\shell\open\command /t REG_SZ /d "\"'.$_PARAM['TOYBOX_APP_PATH'].'\" --cgi-environment=\"TARGET=%%1\"" /f
REG ADD HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.'.$EXT.' /v "Application" /t REG_SZ /d "Toybox.exe" /f
REG ADD HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.'.$EXT.'\OpenWithList /v "a" /t REG_SZ /d "Toybox.exe" /f
REG ADD HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.'.$EXT.'\OpenWithList /v "MRUList" /t REG_SZ /d "a" /f
REG ADD HKEY_CLASSES_ROOT\.'.$EXT.' /t REG_SZ /d "'.$EXT.'File" /f
REG ADD HKEY_CLASSES_ROOT\\'.$EXT.'File\DefaultIcon /t REG_EXPAND_SZ /d "'.$_PARAM['TOYBOX_APP_PATH'].',0" /f
REG ADD HKEY_CLASSES_ROOT\\'.$EXT.'File\shell\open\command /t REG_SZ /d "\"'.$_PARAM['TOYBOX_APP_PATH'].'\" --cgi-environment=\"TARGET=%%1\"" /f
REG ADD HKEY_CURRENT_USER\Software\Classes\.'.$EXT.' /t REG_SZ /d "'.$EXT.'File" /f
REG ADD HKEY_CURRENT_USER\Software\Classes\\'.$EXT.'File\DefaultIcon /t REG_EXPAND_SZ /d "'.$_PARAM['TOYBOX_APP_PATH'].',0" /f
REG ADD HKEY_CURRENT_USER\Software\Classes\\'.$EXT.'File\shell\open\command /t REG_SZ /d "\"'.$_PARAM['TOYBOX_APP_PATH'].'\" --cgi-environment=\"TARGET=%%1\"" /f
ie4uinit.exe -ClearIconCache
ie4uinit.exe -show
exit
';

chdir("./bin");
file_put_contents($_SERVER['TMP']."\\assoc.bat", $REG);
//echo $REG;


passthru("START /B ".$_SERVER['TMP']."\\assoc.bat");
//$WshShell = new COM("WScript.Shell");
//$oExec = $WshShell->Run("START ".$_SERVER['TMP']."\\"."assoc.bat > F:\\output.txt", 0, false);

} else if ($_POST['state'] == 'false') {
$REG = '
REG DELETE HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.'.$EXT.' /f
REG DELETE HKEY_CLASSES_ROOT\.'.$EXT.' /f
REG DELETE HKEY_CLASSES_ROOT\\'.$EXT.'File /f
REG DELETE HKEY_CURRENT_USER\Software\Classes\.'.$EXT.' /f
REG DELETE HKEY_CURRENT_USER\Software\Classes\\'.$EXT.'File /f
ie4uinit.exe -ClearIconCache
ie4uinit.exe -show
exit
';
chdir("./bin");
file_put_contents($_SERVER['TMP']."\\disassoc.bat", $REG);
passthru("START /B ".$_SERVER['TMP']."\\disassoc.bat");	
}