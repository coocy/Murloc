<?php

/* 输出合并后的js和css文件 */

require('../settings.php');

$uri = $_SERVER["REQUEST_URI"];

$uri = preg_replace('/^\\'.WEB_PATH.'i', '', $uri);

$pos = strpos($uri, '?');
if ($pos !== FALSE) {
	$uri = substr($uri, 0, $pos);
}

$temp_array = array();

if (preg_match('/^.+\.(js|css)/i', $uri, $temp_array)) {

	$static_type = $temp_array[1]; /* scripts || styles */
	
	$file_path = $temp_array[0];
	
	$static_contents = get_static_content($file_path);

	if ('js' == $static_type) {
		@header( 'Content-Type: application/x-javascript');
	} else {
		@header( 'Content-Type: text/css');
	}
	echo $static_contents;
	
}
