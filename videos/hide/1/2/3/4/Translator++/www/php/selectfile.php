<?php
header('Content-Type: text/html; charset=shift-jis');
?>
<html><head><meta charset="UTF-8"></head><body>
<pre>
<?php
set_time_limit(0);
//print_r($_SERVER);
$WshShell = new COM("WScript.Shell");
$oExec = $WshShell->Run(getcwd().'\\bin\\setontop-proj.bat', 0, false);

if (empty($_GET['default'])) {
	$result = shell_exec(getcwd().'\\bin\\selectfile.exe');
} else {
	$DEFAULTPATH = str_replace("/", "\\", $_GET['default'] );
	if (!empty($DEFAULTPATH)) {
		if (substr($DEFAULTPATH, -1) == "\\") {
			// add one slashes in the end to prevent error
			$DEFAULTPATH = $DEFAULTPATH."\\";
		}
	}	
	//echo getcwd().'\\bin\\selectfile.exe "'.$DEFAULTPATH.'"';
	$result = shell_exec(getcwd().'\\bin\\selectfile.exe "'.$DEFAULTPATH.'"');
}


$result = trim($result);
if (!empty($result)) {
	$result = str_replace("\\", "/", $result);
	$PATHINFO = pathinfo($result);
	
	$_SETTING['PATH_TO_PROJECT'] = $PATHINFO['dirname']."/";
	if (!is_file($_SETTING['PATH_TO_PROJECT']."js/rpg_core.js")) {
		die("<script>alert('".$_SETTING['PATH_TO_PROJECT']." is invalid RMMV project directory');</script>");
	}
	
	file_put_contents("rmmv.json", json_encode($_SETTING));
	
	$reload = "true";
	if (!empty($_GET['reload'])) {
		$reload = $_GET['reload'];
	}	
	
echo "
<script language='javascript'>
window.parent.document.getElementById(\"$_GET[id]\").value = \"".addslashes($PATHINFO['dirname'])."/\";
$_GET[callback]
if ($reload) {
	window.parent.location.reload(false);
}
</script>";
}

die();
