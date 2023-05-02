<?php
include("header.php");
include("function/template.simple.php");

echo dotemplate(file_get_contents(_TEMPLATE_PATH."trans.html"), $_PARAM);