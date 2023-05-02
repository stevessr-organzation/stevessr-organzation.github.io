<?php
header('Content-Type: text/html; charset=shift-jis');
?>
<html><head><meta charset="UTF-8"></head><body>
<pre>
<?php
set_time_limit(0);
//print_r($_SERVER);

$WshShell = new COM("WScript.Shell");
$oExec = $WshShell->Run(getcwd().'\\bin\\setontop-fold.bat', 0, false);


$DEFAULTPATH = str_replace("/", "\\", $_GET['default'] );
//echo getcwd().'\\bin\\selectfile.exe "'.$DEFAULTPATH.'"';
if (!empty($DEFAULTPATH)) {
	if (substr($DEFAULTPATH, -1) == "\\") {
		// add one slashes in the end to prevent error
		$DEFAULTPATH = $DEFAULTPATH."\\";
	}
}
echo 'selectfolder.exe "'.$DEFAULTPATH.'" "'.$_GET['description'].'"'."\r\n";
$result = shell_exec(getcwd().'\\bin\\selectfolder.exe "'.$DEFAULTPATH.'" "'.$_GET['description'].'"');



$result = trim($result);
if (!empty($result)) {
	$result = str_replace("\\", "/", $result);

		
	$optionfile = getcwd()."\\files\\options.scrub.json";

	if (is_file($optionfile)) {
		$OPTIONS = json_decode(file_get_contents($optionfile), true);
	}
	print_r($OPTIONS);
	$OPTIONS['PRODUCTION_PATH'] = $result."/";
	file_put_contents($optionfile, json_encode($OPTIONS));
	
	$reload = "true";
	if (!empty($_GET['reload'])) {
		$reload = $_GET['reload'];
	}
	
echo "
<script language='javascript'>
window.parent.document.getElementById(\"$_GET[id]\").value = \"".addslashes($result)."/\";
$_GET[callback]
if ($reload) {
	window.parent.location.reload(false);
}
</script>";
}

die();
