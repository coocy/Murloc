<style type="text/css">
	body{
		font-family:verdana;
		font-size:.75em;
		line-height:1.5;
	}
	h2{
		margin:.5em 0;
	}
</style>
<body>
<?php

ini_set('max_execution_time', 3600);

include_once('settings.php');

$file_list = directory_map(ROOT_PATH);

//print_r($file_list);

remove_dir(OUTPUT_DIR);
mkdir(OUTPUT_DIR);

$total_reduce_size = 0;

$type_array = array('css', 'js', 'png');

$get_type_array = array_keys($_GET);

$get_type = $get_type_array[0];

if ($get_type && in_array($get_type, $type_array))
{
	$type = $get_type;
}
else
{
	$type = 'all';
}

output_file($file_list, '', $type);

function output_file($file_item, $current_path, $type) {
	global $ignore_files, $template_exts, $total_reduce_size;
	if ($current_path !== '') {
		foreach ((array)$file_item['file'] as $file_name => $file_info) {
			if ((false === strpos($current_path, 'views') && $file_name{0} === '_') || $file_name{0} == '.') continue;
			if (in_array($file_name, $ignore_files))  continue;
			$file_path = $current_path.'/'.$file_name;
			
			
			$result = true;
			$file_skiped = false;
			
			$ext = get_ext($file_name);

			if('all' != $type && $ext != $type) continue;

			if ($ext == 'css') {
				if (strpos($file_name, 'min.') === 0) {
					$result = compress_css($file_path);
				} else {
					$file_skiped = true;
				}

			} elseif ($ext == 'js') {
				if (strpos($file_name, 'min.') === 0) {
					$result = compress_js($file_path);
				} else {
					$file_skiped = true;
				}
			} elseif ($ext == 'png') {
				compress_png($file_path);
				
			} elseif (in_array($ext, $template_exts)) {
				compress_template($file_path);
				
			} else {
				copy(ROOT_PATH.$file_path, OUTPUT_DIR.$file_path);
			}
			
			$file_size = 0;
			if ($file_skiped === false) {
				if (file_exists(OUTPUT_DIR.$file_path)) {
					$file_size = filesize(OUTPUT_DIR.$file_path);
					$total_reduce_size += ($file_info['infor']['file_size'] - $file_size);
					if ($file_size <= 0) {
						$file_size = 'b style="color:#ff0000">'.$file_size.'</b>';
					} else {
						$file_size = human_file_size($file_size);
					}
				} else {
					$result = false;
				}
			}
 			
			if (false === $result) {
				echo '<p style="color:#ff0000;font-weight:bold">'.$file_path.' Error</p>';
			} else {
				if ($file_skiped === false) {
					echo $file_path.' <b style="color:#1EBC16">OK</b> <span style="color:#888">('.human_file_size($file_info['infor']['file_size']).' → '.($file_size).')</span><br />';
				} else {
					echo '<span style="color:#aaa">'.$file_path.' <b>Skiped</b></span><br />';
				}
			}

		}
	}
	foreach ((array)$file_item['dir'] as $dir_name => $dir) {
		if ($dir_name{0} === '_' || $dir_name{0} == '.') continue;
		if (in_array($dir_name, $ignore_files))  continue;
		$dir_path = $current_path.'/'.$dir_name;
		echo '<h2>'.$dir_path.'</h2>';
		make_dir($dir_path, OUTPUT_DIR);
		output_file($dir, $dir_path, $type);
	}
}

echo '<h2>Resuce size: <span style="color:1EBC16">'.human_file_size($total_reduce_size).'</span></h2>';

?>
</body>
