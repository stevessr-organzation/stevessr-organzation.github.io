<?php
header('Content-Type: text/html; charset=shift-jis');
?>
<html><head><meta charset="UTF-8"></head><body>
<pre>
<?php
set_time_limit(0);
print_r($_GET);
//print_r($_SERVER);
// on top setter
//$WshShell = new COM("WScript.Shell");
//$oExec = $WshShell->Run(getcwd().'\\bin\\setontop.bat', 0, false);

	
	$DEFAULTPATH = str_replace("/", "\\", $_GET['default'] );
	if (!empty($DEFAULTPATH)) {
		if (substr($DEFAULTPATH, -1) == "\\") {
			// add one slashes in the end to prevent error
			$DEFAULTPATH = $DEFAULTPATH."\\";
		}
	}
	if (empty($_GET['filter'])) {
		$_GET['filter'] = "All Files|*.*";
	}
	
	if (empty($_GET['title'])) {
		$_GET['title'] = "Please select file!";
	}
	
	$cmd = escapeshellarg(getcwd().'\\bin\\selectfile-free.exe').' '.escapeshellarg($DEFAULTPATH).' '.escapeshellarg($_GET['title']).' '.escapeshellarg($_GET['filter']);
	echo $cmd;
	$result = shell_exec($cmd);



$result = trim($result);
if (!empty($result)) {
	$reload = "false";
	$result = str_replace("\\", "/", $result);
	

echo "
<script language='javascript'>";
if (!empty($_GET['id'])) {
echo "window.parent.document.getElementById(\"$_GET[id]\").value = \"".addslashes($result)."\";
	";
} 
if (!empty($_GET['targetClass'])) {
echo "window.parent.document.getElementsByClassName(\"$_GET[targetClass]\")[0].value = \"".addslashes($result)."\";
	";
echo "window.parent.document.getElementsByClassName(\"$_GET[targetClass]\")[0].setAttribute(\"data-value\", \"".addslashes($result)."\");
	";
}


if (!empty($_GET['run'])) {
echo "window.parent.".$_GET['run']."('$result');
	";
	
}

if (!empty($_GET['callback'])) {
	echo base64_decode($_GET['callback']);
}

echo "
if ($reload) {
	window.parent.location.reload(false);
}
</script>";
}

die();
