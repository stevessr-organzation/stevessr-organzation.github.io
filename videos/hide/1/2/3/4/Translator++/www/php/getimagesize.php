<?php
$IMAGESIZE = array();
if (is_file($_GET['f'])) {
	$IMAGESIZE = getimagesize($_GET['f']);
}
$IMAGESIZE['width'] = $IMAGESIZE[0];
$IMAGESIZE['height'] = $IMAGESIZE[1];
header("Content-type: text/json");
echo json_encode($IMAGESIZE);