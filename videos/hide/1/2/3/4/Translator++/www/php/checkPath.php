<?php
include("header.php");
/*
Check whether the given $_POST['path'] is accessible by php interpreter

return JSON 
{
	path: the/given/path
	realPath: the/real/path/translation
	accessible: true or false
	writable: is writable
	isDir: is directory
	isFile : is file
}
*/


ob_start();
$RESULT = array();
$RESULT['path'] =  $_POST['path'];
$RESULT['realPath'] =  realpath($_POST['path']);
$RESULT['accessible'] =  isAccessible($_POST['path']);
$RESULT['writable'] =  is_writable($_POST['path']);
$RESULT['isDir'] =  is_dir($_POST['path']);
$RESULT['isFile'] =  is_file($_POST['path']);
$RESULT['shellArg'] =  escape_win32_argv($_POST['path']);
$RESULT['runTimeOutput'] = ob_get_clean();
echo json_encode($RESULT);