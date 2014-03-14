<?php

function get_static_content($file_path, $get_origin_file = false) {

	if (/*$_GET['t'] && */file_exists(ROOT_PATH.'debug') || (true === $get_origin_file)) {
		$file_contents = compile_comments($file_path);
		$static_contents .= "\r\n".trim($file_contents);

	} else {
	
		$file = rtrim(OUTPUT_DIR, '\/\\').$file_path;
		if (file_exists($file)) {
			$static_contents = file_get_contents($file);
		} else {
			return('未找到文件: '.$file);
		}
	}
	
	return $static_contents;
}

function get_file_dir($file_path) {
	$slash_pos = strrpos($file_path, '/');
	if (false !== $slash_pos) {
		$file_dir = substr($file_path, 0, $slash_pos);
	} else {
		$file_dir = $file_path;
	}
	$file_dir = rtrim($file_dir, '\/\\').'/'; 
	return $file_dir;
}

function compile_comments($file_path) {

	$file_path = '/'.ltrim($file_path, '\/\\');

	$file_full_path = rtrim(ROOT_PATH, '\/\\').$file_path;
	if (file_exists($file_full_path)) {
		$file_contents = file_get_contents($file_full_path);
		
		$file_contents = preg_replace('/(\\/\*.+?\*\\/)/ise', 'compile_requires(\'\\1\', \''.$file_path.'\')', $file_contents);
		return $file_contents;
	}

	return '';
}

function compile_requires($file_contents, $file_path) {

	$file_dir = get_file_dir($file_path);
	$temp_array = array();
	$result = '';
	if (preg_match_all('/@requires\s+([^\s]+)/is', $file_contents, $temp_array)) {
		$required_files = $temp_array[1];
		foreach ($required_files as $required_file) {
			$content = compile_comments($file_dir.$required_file);
			$result .= "\r\n".trim($content);
		}
		return $result;
	} else {
		return $file_contents;
	}
}

function compress_js($file_path, $return_content = false, $formatting = false) {

	$file_path = '/'.ltrim($file_path, '\/\\');
	$static_contents = get_static_content($file_path, true);
	
	if ($return_content === true) {
	
		$_file_path = '/'.ltrim($file_path, '\/\\');
		$_file_full_path = rtrim(ROOT_PATH, '\/\\').$_file_path;
	
		$output_file = $_file_full_path.'___';
	} else {
		$output_file = OUTPUT_DIR.ltrim($file_path, '\/\\');
	}
	
	$file_full_path = rtrim(ROOT_PATH, '\/\\').$file_path;
	
	$temp_file = $file_full_path.'____';
	write_file($temp_file, $static_contents);
	$static_contents = null;
	
	$level = 1;
	$compilation_level = $level == 1 ? 'ADVANCED_OPTIMIZATIONS' : 'SIMPLE_OPTIMIZATIONS' ;

	$parms = array(
		'--compilation_level ' . $compilation_level,
		'--define ENABLE_IE_SUPPORT=false',
		'--define ENABLE_DEBUG=false',
		'--use_types_for_optimization',
		'--output_wrapper "(function(){%output%})()"',
		// '--js_output_file ' . $output_file,
		'--js ' . $temp_file
	);

	if ($formatting === true) {
		$parms[] = '--formatting=pretty_print';
	}
	
	foreach($parms as $v) {
		$parm_array[] = $v;
	}
	
	$compiler_command = 'java -jar '.INCLUDE_PATH.'cmd/compiler.jar '.join(' ', $parm_array);

	$tunnels=array(
		0 => array('pipe','r'), // Process std input
		1 => array('pipe','w'), // Process std output
		2 => array('pipe','w') // Process std error
	);

	$io = array(); 
	$resource = proc_open($compiler_command, $tunnels, $io);

	if (!is_resource($resource)) {
		$output = 'Something is wrong...';
	}

	$output = stream_get_contents($io[1]);
	// We are not interested in process standard output.. close it
	fclose($io[1]);               

	// Get process std error
	$errors = stream_get_contents($io[2]);
	fclose($io[2]);

	// Close process reousrce
	$result = proc_close($resource);

	//echo $compiler_command;
	
	unlink($temp_file);
	
	return array(
		'errors' => $errors,
		'output' => $output
	);
}

function compress_css($file_path) {

	$file_path = '/'.ltrim($file_path, '\/\\');
	$static_contents = get_static_content($file_path, true);
	$output_file = OUTPUT_DIR.ltrim($file_path, '\/\\');
	
	$file_full_path = rtrim(ROOT_PATH, '\/\\').$file_path;
	
	$temp_file = $file_full_path.'____';
	write_file($temp_file, $static_contents);
	$static_contents = null;
	
	$compiler_command = 'java -jar '.INCLUDE_PATH.'cmd/yuicompressor-2.4.6.jar '.$temp_file.' -v --type css -o '.$output_file;
	
	exec($compiler_command, $return, $code);
	unlink($temp_file);
	
	if (1 == $code) {
		return false;
	}
	return true;
}

function compress_png($file_path) {

	$file_path = '/'.ltrim($file_path, '\/\\');
	$output_file = OUTPUT_DIR.ltrim($file_path, '\/\\');
	
	$file_full_path = rtrim(ROOT_PATH, '\/\\').$file_path;
	
	$compiler_command = INCLUDE_PATH.'cmd/pngcrush_1_7_42_w32.exe "'.$file_full_path.'" "'.$output_file.'"';
	
	exec($compiler_command, $return, $code);
	
	if (1 == $code) {
		return false;
	}
	return true;

}

function compress_template($file_path) {
	$temp = new mb_template($file_path, array(
		'temp_dir' => ROOT_PATH,
		'compile_dir' => ROOT_PATH.'_cache',
		'force_compression' => true,
		'compressHTML' => true,
		'output_template' => true
	), null);
	
	$output = $temp -> output_string();
	
	$file_dir = get_dir_of_path($file_path);
	make_dir($file_dir, ROOT_PATH);
	
	write_file(rtrim(OUTPUT_DIR, '\/\\').$file_path, $output);
	$output = null;

}


