<?php
header("Content-Type: text/json");
echo file_get_contents($_GET['f']);