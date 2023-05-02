<?php
set_time_limit(10);
include("function/db.sqlite3.php");
$_PARAM['tags'] = array();


echo "Executing storygen";

$VERSION = "1";
$DBPATH = $_SERVER['DOCUMENT_ROOT']."\\www\\php\\"."storygen.db";
$_DB = new SQLite3($DBPATH);

$sql = 'SELECT name FROM sqlite_master WHERE type = "table"';
$tableList =execute_sql($sql, true, $_DB);


function isTagExist($str) {
	
}

function getBetween($content, $start, $end) {
	$n = explode($start, $content);
	$result = Array();
	foreach ($n as $val) {
		$pos = strpos($val, $end);
		if ($pos !== false) {
			$result[] = substr($val, 0, $pos);
		}
	}
	return $result;
}

function fetchStringByType($type, $exclussion = array()) {
	global $_PARAM;
	
	$exclude = "";
	if (!empty($exclussion)) {
		$exclussion = array_map('addSlashes', $exclussion);
		$exclude = "AND text<>'".implode("' AND text<>'", $exclussion)."'";
	}
	
	$data = execute_sql("SELECT * FROM storyparts WHERE type='$type' $exclude ORDER BY RANDOM() LIMIT 1");
	if (empty($data)) {
		return "unknown";
	} else {
		$_PARAM['tags'] = array_merge($_PARAM[], json_decode($data['tags'], true));
		return $data['text'];
	}
}

function selectFromList($string, $variable=Array()) {
/*
	example:
	$string = "dony/andre/marco/default";
	$variable = Array("andre"=>"Andre");
	result "Andre";

	example2:
	$string = "dony/andre/marco/default";
	$variable = Array("xxx"=>"Andre");
	result "default";
	
	pattern separated with single slash "/"
	
*/	
	global $_PARAM;
	
	if (strpos($string, "/") === false) {
		return $string;
	}

	$escapedFlag = '<escaped_'.microtime()."_".rand(0,999999).'>';
	$string = str_replace("\\/", $escapedFlag, $string);
	
	$list = explode("/", $string);
	
	foreach ($list as $key => $val) {
		$val = trim($val);
		if (!empty($variable[$val])) {
			return 	str_replace($escapedFlag, "\\/", $variable[$val]);
		}
	}
	
	return 	str_replace($escapedFlag, "\\/", $val);
}

function compileString($str) {
	static $SETTING = array();
	
	$SETTING[$str]['cache'] = array();
	$types = getBetween($str, "{{", "}}");
	
	$OUTPUT = $str;
	
	if (!empty($types)) {
		$src = Array();
		$rep = Array();
		foreach ($types as $type) {
			$type = trim($type);
			$thisRep = fetchStringByType($type, array_values ($SETTING[$str]['cache']));
			$SETTING[$str]['cache'][$type] = $thisRep;
			
			$src[] = "{{".$type."}}";
			$rep[] = $thisRep;
			
			// setting string variable
		}
		
		$newStr = str_replace($src, $rep, $str);
		$OUTPUT = compileString($newStr);
	} 
	
	return $OUTPUT;
}

if (empty($tableList)) {
	// initializing database
	/*
	$sql = '
		CREATE TABLE IF NOT EXISTS  info(
		key VARCHAR(32) NOT NULL,
		val VARCHAR(255) NOT NULL);';
	$_DB->query($sql);
	
	$sql = "INSERT INTO info (key, val) VALUES ('title', '$GAME_TITLE')";
	$_DB->query($sql);
	$sql = "INSERT INTO info (key, val) VALUES ('version', '$VERSION')";
	$_DB->query($sql);
	$sql = "INSERT INTO info (key, val) VALUES ('lang', 'en')";
	$_DB->query($sql);
	*/
	$sql = '
		CREATE TABLE IF NOT EXISTS storyparts (
		id			INTEGER				PRIMARY KEY AUTOINCREMENT,
		tags		TEXT				NOT NULL DEFAULT \'{}\',
		type		VARCHAR(64)			NOT NULL,
		text		TEXT 				NOT NULL DEFAULT \'\',
		rate		INTEGER				NOT NULL DEFAULT 1,
		isactive	BOOLEAN				NOT NULL DEFAULT 1
		);';
	$STORYGEN->query($sql);
}

// random select:
// SELECT * FROM table ORDER BY RANDOM() LIMIT 1;
$sql = "SELECT * FROM storyparts";
print_r(execute_sql($sql, true));
print_r(getBetween("The quick brown {{fox}} jumps over the lazy {{dog}}", "{{", "}}"));
echo compileString("
{<charname>} was {{relation}} of {{proffesion}},
She lived in a small city {{direction}} of {{kingdoms}}\r\n

");

echo selectFromList("dony/lucu/sekali", Array("lucu"=>"replacer"));


print_r($_PARAM);
/*


function test() {
	static $x = Array();
	static $n = 0;
	$x[] = $n;
	print_r($x);
	$n++;
}

test();
test();
test();
test();

*/