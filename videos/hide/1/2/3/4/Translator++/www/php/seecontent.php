<?php
include("header.php");
include("function/template.simple.php");
include("function/rmmv.php");
$_PARAM['EDITOR_MODE'] = 'javascript';
if (is_RMMV_projectpath($_PARAM['PATH_TO_PROJECT']) == false) {
	include("requiredconfig.php");
	die();
}
if (!empty($_POST)) {
	// saving content
	if (is_file($_POST['path'])) {
		$script = json_decode($_POST['data'], true);
		if (is_null($script)) {
			die("Unable to save, script error!");
		} else {
			//print_r($script);
			echo "Saved successfully!";
			rename($_POST['path'], $_POST['path'].".bak");
			file_put_contents($_POST['path'], json_encode($script));
		}
	} else {
		die("path not found!");
	}


	die();
} elseif (!empty($_GET['file'])) {
	
	if (is_file($_PARAM['PATH_TO_PROJECT']."data/".$_GET['file'])) {
		if (!empty($_GET['inspect_event']) && substr($_GET['file'], 0, 3) == "Map") {
			echo "<pre>";
			
			$data = file_get_contents($_PARAM['PATH_TO_PROJECT']."data/".$_GET['file']);
			$contentVar = json_decode($data, true);
			if (!empty($contentVar['events'])) {
				foreach ($contentVar['events'] as $key=>$val) {
					echo "<h3>".$val['name']."</h3>";
					echo json_encode($val['pages'][0]['list'], JSON_PRETTY_PRINT);
				}
			}
			die();
		}		
		
		$_PARAM['FILE_PATH'] = $_PARAM['PATH_TO_PROJECT']."data/".$_GET['file'];
		if ($_GET['style'] == 'json') {
			$_PARAM['SCRIPT'] = json_encode(json_decode(file_get_contents($_PARAM['FILE_PATH']), true), JSON_PRETTY_PRINT);
			echo dotemplate(file_get_contents(_TEMPLATE_PATH."editor.html"), $_PARAM);

		} else {
			//$_PARAM['EDITOR_MODE'] = 'application/x-httpd-php';
			echo "<pre>";
			
			print_r(json_decode(file_get_contents($_PARAM['PATH_TO_PROJECT']."data/".$_GET['file']), true));
			/*
			ob_start();
				var_export(json_decode(file_get_contents($_PARAM['PATH_TO_PROJECT']."data/".$_GET['file']), true));
			$_PARAM['SCRIPT'] = "<"."?php\r\n$data=".ob_get_clean();
			echo dotemplate(file_get_contents(_TEMPLATE_PATH."editor.html"), $_PARAM);
			*/
		}
		
		die();
	} 


	echo "</pre>";
} else {
	$FILES = glob($_PARAM['PATH_TO_PROJECT']."data/*.json");
	foreach ($FILES as $key=>$files) {
		$finfo = pathinfo($files);
		$_PARAM['FILE_LIST'] .= "<li><span class='filename'>$finfo[basename]</span></li>";
	}
	
	echo dotemplate(file_get_contents(_TEMPLATE_PATH."pretify.html"), $_PARAM);
	
}
//print_r(json_decode($data, 1));