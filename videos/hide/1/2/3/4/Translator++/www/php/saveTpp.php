<?php
include("header.php");
function fetchProjectId($projectId="") {
	global $_PARAM;

	if (!empty($projectId)) {
		$id = $projectId;
	} elseif (!empty($_SERVER['POST']['projectId'])) {
		$id = $_SERVER['POST']['projectId'];
	} elseif (!empty($_POST['projectId'])) {
		$id = $_POST['projectId'];
	} elseif (!empty($_PARAM['projectId'])) {
		$id = $_PARAM['projectId'];
	} else {
		$id = md5(time());
	}
	$_PARAM['projectId'] = $id;
	$_SERVER['POST']['projectId'] = $id;
	$_SERVER['GET']['projectId'] = $id;
	$_POST['projectId'] = $id;
	$_GET['projectId'] = $id;
	return $id;
}


class FlxZipArchive extends ZipArchive 
{
 public function addDir($location, $name) 
 {
       $this->addEmptyDir($name);
       $this->addDirDo($location, $name);
 } 
 private function addDirDo($location, $name) 
 {
    $name .= '/';
    $location .= '/';
    $dir = opendir ($location);
    while ($file = readdir($dir))
    {
        if ($file == '.' || $file == '..') continue;
        $do = (filetype( $location . $file) == 'dir') ? 'addDir' : 'addFile';
        $this->$do($location . $file, $name . $file);
    }
 } 
}

function createTpp($projectId, $zip_file_name="") {
	if (empty($projectId)) {
		echo "Project Id not found\n";
		return false;
	}
	$currentScript = pathinfo(__FILE__);
	//$cache = $currentScript['dirname']."\\cache\\".$projectId;
	$cache = $_SERVER['STAGING_PATH']."\\".$projectId;

	if (!is_dir($cache)) {
		echo "$cache not found \n";
		return false;
	}
	
	
	if (empty($zip_file_name)) {
		echo "Destination filename not found!";
		return false;
	}
	
	if (is_file($zip_file_name)) {
		unlink($zip_file_name);
	}
	
	/*
	$projectId = fetchProjectId();
	if (empty($projectId)) {
		$cchInfo = pathinfo($cache);
		$nBase = pathinfo($cchInfo['dirname']);
		$projectId = $nBase['basename'];
	}
	*/
	
	// generating Identity / file header information
	$fileHeaderObj = [];
	$fileHeaderObj['id'] = $projectId;
	$fileHeader = json_encode($fileHeaderObj, JSON_PRETTY_PRINT);
	
	$za = new FlxZipArchive;
	$res = $za->open($zip_file_name, ZipArchive::CREATE);
	if($res === TRUE) 
	{
		//$za->addDir($the_folder, basename($the_folder));
		$za->addFromString('identity.txt', $fileHeader);
		$za->setArchiveComment($fileHeader);
		/*
		if (is_file($pluginPath."\\distrib.txt")) {
			$noteContent = file_get_contents($pluginPath."\\distrib.txt");
			$za->setArchiveComment($noteContent);		
		}
		*/
		/*
		$za->addDir($cache."\\data", "data");
		$za->addDir($cache."\\dump", "dump");
		$za->addFile($cache."\\initial.json", "initial.json");
		$za->addFile($cache."\\gameInfo.json", "gameInfo.json");
		*/
		// adding all files in the cache folder
		$content = glob($cache."\\*");
		foreach ($content as $thisPath) {
			$thisPathInf = pathinfo($thisPath);
			if (is_dir($thisPath)) {
				$za->addDir($thisPath, $thisPathInf['basename']);
			} else {
				$za->addFile($thisPath, $thisPathInf['basename']);
			}
		}
		
		$za->close();
	}
	else{
		echo 'Could not create a zip archive on :'.$zip_file_name."\r\n";
	}	
	
	echo "File saved to : ".$zip_file_name."\r\n";
}


createTpp($_POST['projectId'], $_POST["path"]);
//createTpp("fb70777868d0357e07285565a4549ebb", 'F:\test\test.zip');
