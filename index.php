<?php

include_once('settings.php');

ob_end_flush();

$uri = $_SERVER["REQUEST_URI"];

$uri = preg_replace('/^\\'.WEB_PATH.'i', '', $uri);

$uri = trim($uri, '/ ');

if ($uri === '') {
	$template_file = 'index.html';
} else {

	$file_path = $uri;

	$pos = strrpos($uri, '.');
	if ($pos !== false) {
		$ext = strtolower(substr($uri, $pos + 1));
		if (in_array($ext, $template_exts)) {
			$file_path = substr($file_path, 0, $pos);
		}
	}

	$template_file = null;

	foreach ($template_exts as $v) {
		$_file_path = PAGE_DIR.$file_path.'.'.$v;
		if (file_exists($_file_path)) {
			$template_file = $file_path.'.'.$v;
			break;
		}
	}
	if (!$template_file) {
		$template_file = '404.html';
	}

}

if ($template_file) {

	if (file_exists(ROOT_PATH.'debug')) {
		$temp_dir = PAGE_DIR;
		$compressHTML = true;
	} else {
		$temp_dir = OUTPUT_DIR.'views/';
		$compressHTML = false;
	}

	$temp = new mb_template($template_file, array(
		'temp_dir' => $temp_dir,
		'compile_dir' => ROOT_PATH.'_cache',
		'force_compression' => true,
		'compressHTML' => true,
	), null);
	
	$json = new Services_JSON();
	$global_data = array();
	$data = array();
	
	$data_file = DATA_DIR.'global.json';
	if (file_exists($data_file)) {
		$data_content = file_get_contents($data_file);
		$global_data = $json -> decode($data_content);
	}
	$data_file = DATA_DIR.wipe_ext($template_file).'.json';
	if (file_exists($data_file)) {
		$data_content = file_get_contents($data_file);
		$data = $json -> decode($data_content);
		if ($data) {
			$data = array_merge($global_data, $data);
		}
	}
	
	$data['path'] = $_SERVER['REQUEST_URI'];
	$data['web_host'] = 'http://'.$_SERVER['HTTP_HOST'];
	$data['www_root'] = $data['web_host'].WEB_PATH;
	$data['time'] = time();


	$data['page_list'] = array();

	if ($fp = @opendir(PAGE_DIR)) {
		while (false !== ($file = readdir($fp))) {
			$file_path = PAGE_DIR.$file;
			if (!is_dir($file_path) && preg_match('/\.html$/i', $file) && $file !== '404.html' && $file !== 'index.html') {
				$data['page_list'][] = $file;
			}
		}
	}
	
	$temp -> tmp_var = $data;

	$output = $temp -> output_string();
	
	//$output  = htmlspecialchars($output );
	die($output);
}



