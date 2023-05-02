<?php
header('Content-Type: text/html; charset=shift-jis');
?>
<html><head><meta charset="UTF-8"></head><body>
<pre>
<?php
set_time_limit(0);
//print_r($_SERVER);

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

echo $result;
echo "
<script language='javascript'>
window.parent.document.getElementById(\"$_GET[id]\").value = \"".addslashes($result)."/\";
</script>";
}

die();
