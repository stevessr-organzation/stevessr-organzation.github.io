<?php
include("header.php");
header("Content-type: text/javascript");

echo 'var $PHP = '. json_encode($_PARAM, JSON_PRETTY_PRINT);