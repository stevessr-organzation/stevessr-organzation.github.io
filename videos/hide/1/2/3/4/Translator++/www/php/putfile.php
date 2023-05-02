<?php
include("header.php");
header("Content-Type: text/json");

if (empty($_POST['f'])) {
	$_POST['f'] = $_GET['f'];
}

$RESULT = array();
$RESULT['status'] = '';
$RESULT['error'] = array();
if (empty($_POST['f'])) {
	$RESULT['status'] = "error";
	$RESULT['error'][] = "empty path (POST['f'])!";
	die(json_encode($RESULT));
}


$currentPath = pathinfo($_POST['f']);
if (is_dir($currentPath['dirname']) == false) {
	mkdir($currentPath['dirname'], 777, true);
}

file_put_contents($_POST['f'], $_POST['data']);

$RESULT['status'] = "ok";
$RESULT['target'] = $_POST['f'];
$RESULT['data'] = $_POST['data'];
echo json_encode($RESULT);