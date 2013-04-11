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
	
	$compressed_contents = trim(compress_js($file_path, true));

	
	$origin_size = strlen($static_contents);
	$compressed_size = strlen($compressed_contents);
	
	$origin_size_label = human_file_size($origin_size);
	$compressed_size_label = human_file_size($compressed_size);
	
	$compress_saving = 100 - ((int)($compressed_size / $origin_size * 10000) / 100);
	
}

?><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title><?php echo $file_path ?></title>
<style type="text/css">
	body,td,th{
		font-family:verdana;
		font-size:.75em;
		line-height:1.5;
	}
	td,th{
		padding:0 .5em;
		vertical-align:top;
	}
	th{
		text-align:right;
	}
	.code_wrap{
		border:1px solid #aaa;
		padding:1em;
		margin:.5em 0 0;
		font-family: 'Lucida Sans Typewriter','Courier New',Courier,Fixed,monospace;
	}
</style>
</head>
<body>

	<table>
		<tr>
			<th>Original Size:</th>
			<td><?php echo   $origin_size_label ?></td>
		</tr>
		<tr>
			<th>Compiled Size:</th>
			<td><?php echo   $compressed_size_label ?><br />
			Saved <?php echo   $compress_saving ?>% off the original size</td>
		</tr>
	</table>

	<div class="code_wrap"><?php echo htmlspecialchars($compressed_contents) ?></div>
</body>
</html>