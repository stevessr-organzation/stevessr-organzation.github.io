<?php
$RMMV = array();
if (is_file("rmmv.json")) {
	$RMMV = json_decode(file_get_contents("rmmv.json"), 1);
}
if (!empty($_POST)) {
	foreach ($_POST as $key=>$val) {
		$RMMV[$key] = $val;
		
	}
}
$result =json_encode($RMMV);
file_put_contents("rmmv.json", $result);
echo $result;
