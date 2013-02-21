<?php

function page_split($total_page, $current_page, $base = '', $query_str = '') {
	global $lan;
	
	$base = rtrim($base, '/');
	
	$is_moible = is_mobile();
	
	$page_string = '';
	$query_str = preg_replace('/page\=[^&]*(&amp;|&)*/i', '', $query_str);
	if ($query_str != '') $query_str = '&amp;'.$query_str;
	if ( $total_page == 1 ) {
		return '';
	}
	if ($current_page == 2) {
		$page_string = ($is_moible ? '' : '<a href="'.$base.'/"><strong>'.$lan['page_first'].'</strong></a> ').'<a href="'.$base.$page_base.'/page_'.($current_page - 1).'/" class="_p_p"><strong>'.$lan['page_previous'].'</strong></a> ';
	} elseif ($current_page > 2) {
		$page_string = ($is_moible ? '' : '<a href="'.$base.'/"><strong>'.$lan['page_first'].'</strong></a> ').'<a href="'.$base.$page_base.'/page_'.($current_page - 1).'/" class="_p_p"><strong>'.$lan['page_previous'].'</strong></a> ';
	} else {
		$page_string = ($is_moible ? '' : '<del><strong>'.$lan['page_first'].'</strong></del> ').'<del class="_p_p"><strong>'.$lan['page_previous'].'</strong></del> ';
	}
	if ( $current_page > 6 ) {
		$page_string .= '<a href="'.$base.'/">1</a> ';
		$page_string .= '...';
			for ( $i = $current_page - 3 ;$i <= $current_page - 1 ;$i++ ) {
				$page_string .= ' <a href="'.$base.$page_base.'/page_'.$i.'/">'.$i.'</a> ';
			}
			$page_string .= '<b>'.$current_page.'</b> ';
	} else {
		for ( $i = 1 ; $i <= $current_page ; $i ++ ) {
			if ( $i == $current_page ) {
				$page_string .= '<b>'.$current_page.'</b> ';
			} elseif ($i == 1) {
				$page_string .= ' <a href="'.$base.'/">'.$i.'</a> ';
			} else {
				$page_string .= ' <a href="'.$base.$page_base.'/page_'.$i.'/">'.$i.'</a> ';
			}
		}
	}
	if ( $total_page - $current_page > 5 ) {
		for ( $i = $current_page + 1; $i <= $current_page + 3;$i++ ) {
			$page_string .= ' <a href="'.$base.$page_base.'/page_'.$i.'/">'.$i.'</a> ';
		}
		$page_string = $page_string . '...';
		for ( $i = $total_page ; $i <= $total_page ; $i++ ) {
			$page_string .= ' <a href="'.$base.$page_base.'/page_'.$i.'/">'.$i.'</a> ';
		}
	} else {
		for ( $i = $current_page + 1 ; $i <= $total_page ; $i ++ ) {
			$page_string .= ' <a href="'.$base.$page_base.'/page_'.$i.'/">'.$i.'</a> ';
		}
	}
	
	if ($current_page < $total_page) {
		$page_string .= '<a href="'.$base.$page_base.'/page_'.($current_page + 1).'/" class="_p_n"><strong>'.$lan['page_next'].'</strong></a>'.($is_moible ? '' : ' <a href="'.$base.$page_base.'/page_'.$total_page.'/"><strong>'.$lan['page_last'].'</strong></a>');
	} else {
		$page_string .= '<del class="_p_n"><strong>'.$lan['page_next'].'</strong></del>'.($is_moible ? '' : ' <del><strong>'.$lan['page_last'].'</strong></del>');
	}
	
	return $page_string;
	
}

function get_page_table($volume_id) {
	return substr($volume_id, -1, 1); 
}

function strip_br($string) {
	return str_replace(array("\r", "\n", "\t"), '', $string);
}

function page_split_1($total_page, $current_page, $base = '', $query_str = '') {
	$page_string = '';
	$query_str = preg_replace('/page\=[^&]*(&amp;|&)*/i', '', $query_str);
	if ($query_str != '') $query_str = '&amp;'.$query_str;
	if ( $total_page == 1 ) {
		$page_split = '';
		return $page_split;
	}
	$base = rtrim($base, '/?');
	
	if ($current_page > 1) {
		$page_string = '<a href="'.$base.'/?page=1'.$query_str.'">第一页</a> <a href="'.$base.'/?page='.($current_page - 1).$query_str .'">上一页</a>';
	}
	if ( $current_page > 7 ) {
		$page_string = '<a href="'.$base.'/?page=1'.$query_str.'">1</a> ';
		$page_string .= '...';
			for ( $i = $current_page - 4 ;$i <= $current_page - 1 ;$i++ ) {
				$page_string .= ' <a href="'.$base.'/?page='.$i.$query_str.'">'.$i.'</a> ';
			}
			$page_string .= '<strong>'.$current_page.'</strong> ';
	} else {
		for ( $i = 1 ; $i <= $current_page ; $i ++ ) {
			if ( $i == $current_page ) {
				$page_string .= '<strong>'.$current_page.'</strong> ';
			} else {
				$page_string .= ' <a href="'.$base.'/?page='.$i.$query_str.'">'.$i.'</a> ';
			}
		}
	}
	if ( $total_page - $current_page > 6 ) {
		for ( $i = $current_page + 1; $i <= $current_page + 4;$i++ ) {
			$page_string .= ' <a href="'.$base.'/?page='.$i.$query_str.'">'.$i.'</a> ';
		}
		$page_string = $page_string . '...';
		for ( $i = $total_page ; $i <= $total_page ; $i++ ) {
			$page_string .= ' <a href="'.$base.'/?page='.$i.$query_str.'">'.$i.'</a> ';
		}
	} else {
		for ( $i = $current_page + 1 ; $i <= $total_page ; $i ++ ) {
			$page_string .= ' <a href="'.$base.'/?page='.$i.$query_str.'">'.$i.'</a> ';
		}
	}
	if ($current_page < $total_page) {
	$page_string .= '<a href="'.$base.'/?page='.($current_page + 1).$query_str.'">下一页</a> <a href="'.$base.'/?page='.$total_page.$query_str.'">末页</a>';
	}
	
	return $page_string;
	
}

function check_charset($str) {
	$str1 = mb_convert_encoding($str, 'UTF-8', 'GBK');
	$str2 = mb_convert_encoding($str1, 'GBK', 'UTF-8');
	
	
	if ($str2 == $str) {
		return $str1;
	}
	return $str;
}

function ping($url) {
		$url = str_replace(' ', '%20', $url);
		
		$array_uri = parse_url($url);
		$scheme = $array_uri['scheme'];
		$port = array_key_exists('port', $array_uri) ? '?'.$array_uri['port'] : 80;
		$host = $array_uri['host'];
		$path = array_key_exists('path', $array_uri) ? ($array_uri['path'].(array_key_exists('query', $array_uri) ? '?'.$array_uri['query'] : '')) : '/';
		
		$errno = '';
		$errstr = '';
		
		$fp = @fsockopen($host, $port, $errno, $errstr, 5);
		if (!$fp) {
			return false;
		} else {
			$header_in = "GET ".$path." HTTP/1.0\r\n";
			$header_in .= "Accept: image/gif, image/x-xbitmap, image/jpeg, image/pjpeg, */*\r\n";
			$header_in .= "Host: ".$host."\r\n";

			//$header_in .= "Cookie: digpark_user=alexo0; digpark_pass=e10adc3949ba59abbe56e057f20f883e\r\n";
			$header_in .= "Connection: Close\r\n";
			$header_in .= "\r\n";

			socket_set_timeout($fp, 5);
			
		    fwrite($fp, $header_in, strlen($header_in));
			fclose($fp);
		}
		return true;
}

function strip_HTML($str) {
	$search = array ("'<script[^>]*?>.*?</script>'si", // 去掉 javascript
		"'<[\/\!]*?[^<>]*?>'si", // 去掉 HTML 标记
		"'([\r\n])[\s]+'", // 去掉空白字符
		"'&(quot|#34);'i", // 替换 HTML 实体
		"'&(amp|#38);'i",
		"'&(lt|#60);'i",
		"'&(gt|#62);'i",
		"'&(nbsp|#160);'i",
		"'&(iexcl|#161);'i",
		"'&(cent|#162);'i",
		"'&(pound|#163);'i",
		"'&(copy|#169);'i",
		"'&#(\d+);'e"
	);

	$replace = array (
		"",
		"",
		"\\1",
		"\"",
		"&",
		"<",
		">",
		" ",
		chr(161),
		chr(162),
		chr(163),
		//chr(169),
		'',
		"chr(\\1)"
	);
	return preg_replace ($search, $replace, $str);
}

function tran_SBC($str) {
	$str1 = array(
		"０","１","２","３","４","５","６",
		"７","８","９","＋","－","％","．",
		"！","＠","＃","＄","％","＾","＆","＊","（","）",
		"ａ","ｂ","ｃ","ｄ","ｅ","ｆ","ｇ","ｈ","ｉ","ｊ","ｋ","ｌ","ｍ",
		"ｎ","ｏ","ｐ","ｑ","ｒ","ｓ ","ｔ","ｕ","ｖ","ｗ","ｘ","ｙ","ｚ",
		"Ａ","Ｂ","Ｃ","Ｄ","Ｅ","Ｆ","Ｇ","Ｈ","Ｉ","Ｊ","Ｋ","Ｌ","Ｍ",
		"Ｎ","Ｏ","Ｐ","Ｑ","Ｒ","Ｓ","Ｔ","Ｕ","Ｖ","Ｗ","Ｘ","Ｙ","Ｚ"
	);
	$str2 = "0123456789+-%.!@#$%^&*()abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	for($i=0;$i<count($str1);$i++) {
		$str = str_replace($str1[$i], $str2{$i}, $str);
	}	
	return $str;
	
} 

//获取链接的根链接
function get_root_path($url) {
	$array = array();
	preg_match("@(https?:\/\/[^/]*)@i", $url, $array);
	return $array[1];
}

//将链接转化为绝对链接
function format_link($url, $base_url) {
	$root_path = get_root_path($base_url);
	
	if (substr($base_url, -1, 1) !== '/') {
		$base_url = substr($base_url, 0, strrpos($base_url, '/') + 1);
	}
	
	if (preg_match("@(https?:\/\/[^/]*)@i", $url)) {
		$path = $url;
	} elseif ($url{0} == '/') {
		$path = $root_path.$url;
	} elseif (substr($url, 0, 2) == './') {
		$path = $base_url.(strlen($url) > 2 ? substr($url, 2) : '');
	} elseif (substr($url, 0, 3) == '../') {
		while (substr($url, 0, 3) == '../') {
			if (strpos(preg_replace('&^\s*http://([^/]*)/?&i', '', $base_url), '/') === false) {
				$url = preg_replace('/(\.\.\/)+/i', '', $url);
				break;
			}
			$rp = strrpos(rtrim($base_url, '/'), '/');
			if ($rp === false) {
				break;
			}
			$base_url = substr($base_url, 0, $rp + 1);
			$url = substr($url, 3);
		}
		$path = $base_url.$url;
	} else {
		$path = $base_url.$url;
	}
	return str_replace('&amp;', '&', $path);
}

//递归创建目录
function make_dir($path, $start_path = '') {
	$path_array = preg_split('|[\/\\\\]|', $path);
	
	$temp = $start_path ? $start_path : ($path{0} == '/' ? '/' : '');
	
	foreach ($path_array as $v) {
		if ($v === '') continue;
		$temp .= $v.'/';
		
		if (!file_exists($temp)) {
			if (!@mkdir($temp)) {
				return false;
			}
		}
	}
	return true;
}

function remove_dir($dir) {
	if (!file_exists($dir)) {
		return true;
	}

	$h = opendir($dir);
	
	while ($file = readdir($h)) {
		if($file != '.' && $file != '..') {
			$path = $dir.'/'.$file;
			if (!is_dir($path)) {
				@unlink($path);
			} else {
				remove_dir($path);
			}
		}
	}
	closedir($h);

	if(@rmdir($dir)) {
		return true;
	}
	return false;
}

function timer_start() {
	global $timestart;
	$mtime = explode(' ', microtime() );
	$mtime = $mtime[1] + $mtime[0];
	$timestart = $mtime;
	return true;
}

function timer_stop($precision = 5) {
	global $timestart;
	$mtime = microtime();
	$mtime = explode(' ', $mtime);
	$time_end = $mtime[1] + $mtime[0];
	$time_total = $time_end - $timestart;
	$time_total = number_format($time_total, $precision, '.', '').'s';
	return $time_total;
}

//Get IP;
function get_ip() {
	if($_SERVER['HTTP_X_FORWARDED_FOR']) {
		if(preg_match_all("#[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}#s", $_SERVER['HTTP_X_FORWARDED_FOR'], $addresses)) {
			while (list($key, $val) = each($addresses[0])) {
				if (!preg_match("#^(10|172\.16|192\.168)\.#", $val)) {
					$ip = $val;
					break;
				}
			}
		}
	}
	if(!$ip) {
		if($_SERVER['HTTP_CLIENT_IP']) {
			$ip = $_SERVER['HTTP_CLIENT_IP'];
		} else {
			$ip = $_SERVER['REMOTE_ADDR'];
		}
	}
	return $ip;
}

function redirect($url = '') {
	if (!$url) $url = $_SERVER['HTTP_REFERER'];
	header("Location: $url");
	//header("Refresh:0;URL=$url");
	exit;
}

function get_rand($length, $babel = false) {
	$temp = $babel ? 'abcdefghijklmnopqrstuvwxyz123456789-_ABCDEFGHIJKLMNOPQRSTUVWXYZ' : 'abcdefghijklmnopqrstuvwxyz123456789';
	$strlen = strlen($temp);
	$temp_str = '';
	for ($i = 0;$i < $length; $i++) {
		$pos = mt_rand(0, $strlen - 1);
		$temp_str .= $temp{$pos};
	}
	return $temp_str;
}

//output 404 not found page;
function error_404() {
	error_page('Error 404 - Page not found.');
}

function error_page($message) {
	ob_clean();
	ob_end_flush();
	$html = file_get_contents(ROOT_PATH.'include/error.html');
	$error_html = str_replace('{error_message}', $message, $html);
	die($error_html);
}


function get_time($time = false, $time_format = false) {
	if (!defined('TIME_FORMAT')) {
		define('TIME_FORMAT', 'Y-m-d H:i:s');
	}
	if (!defined('TIME_ZONE')) {
		define('TIME_ZONE', 8);
	}
	$format = $time_format ? $time_format : TIME_FORMAT;
	$hm = TIME_ZONE * 60; 
	$ms = $hm * 60;
	$time = $time ? $time : time();
	$gmdate = date($format, $time+($ms)); 
	return $gmdate;
}

function get_datetime($time = null) {
	return date('Y-m-d H:i:s', $time);
}

function filter_num($str, $min = false, $max = false) {
	if (preg_match('/[0-9]+/', $str)) {
		$str = preg_replace('/[^0-9]+/', '', $str);
		$result = $str;
	} else {
		$result = 0;
	}
	if ($min !==  false && $result < $min) $result = $min;
	if ($max !==  false && $result > $max) $result = $max;
	return $result;
}


function encoding($string) {
	return mb_convert_encoding ($string, "HTML-ENTITIES", "utf-8");
}

function auto_url($string) {
	$string = preg_replace("&((http|https|rstp|ftp|mms|ed2k)://([a-z0-9\-\.\%\_\#\`\~\@\^\&\*\(\)\+\/\?\:\=\\\\]+))&i", '<a target="_blank" href="$1"><font color="#0d77d1">$1</font></a>', $string);
	return $string;
}

function filter_email($string, $is_on = true) {
	if ($is_on) {
		$string = preg_replace("&[a-zA-Z]+\w*@([a-zA-Z0-9]+([a-zA-Z0-9]|-)*[.])+([a-zA-z]{2,})&i", "***@***.$3", $string);
	}
	return $string;
}

function return_bytes($val) {
    $val = trim($val);
    $last = strtolower($val{strlen($val)-1});
    switch($last) {
	
        case 'g':
            $val *= 1024;
        case 'm':
            $val *= 1024;
        case 'k':
            $val *= 1024;
    }

    return $val;
}

function get_upload_max_filesize() {
	$size = 0;
	$array = array('post_max_size', 'upload_max_filesize', 'memory_limit');
	foreach ($array as $v) {
		$s = ini_get($v);
		if (!$s) continue;
		$ss = ((string)(int) $s === (string)$s) ? $s : return_bytes($s);
		$ss = (int) $ss;
		
		if ($size === 0) $size = $ss;
		if ($ss < $size) $size = $ss;
	}
	return $size;
}

//格式化文件大小;	
function human_file_size($size) {
	if($size == 0) {
		return "0";
	}
	$filesizename = array("b", "k", " M", " G", " T", " PB", " EB", " ZB", " YB");
	$a = pow(1024, ($i = floor(log($size, 1024))));
	if ($a <= 0) {
		return "0";
	} 
	return round($size/$a, 2) . $filesizename[$i];
}

function wipe_ext($file_name) {
	$temp = $file_name;
	$pt = strrpos($file_name, ".");
	if ($pt) {
		$temp = substr($temp, 0, $pt);
	}
	return $temp;
}

function get_ext($file_name) {
	$temp = $file_name;
	$pt = strrpos($file_name, ".");
	if ($pt) {
		$temp = substr($temp, $pt + 1, strlen($temp));
	}
	return $temp;
}

function get_dir_of_path($path) {
	$temp = $path;
	$pt = strrpos($path, "/");
	if ($pt) {
		$temp = substr($temp, 0, $pt);
	}
	return $temp;
}

function get_filename_of_path($path) {
	$temp = $path;
	$pt = strrpos($path, "/");
	if ($pt) {
		$temp = substr($temp, $pt + 1, strlen($temp));
	}
	return $temp;
}


function wipe_query_string($url) {
	$temp = $url;
	$pt = strrpos($url, "?");
	if ($pt) {
		$temp = substr($temp, 0, $pt);
	}
	return $temp;
}

function write_file($file, $content = '') {
	if ($f = fopen($file, 'w')) {
		fwrite($f, $content);
		fclose($f);
	} else {
		return false;
	}
	return true;
}

function cut_string($string, $length) {
	if (mb_strlen($string, 'utf-8') > $length) {
		$string = mb_substr($string, 0, $length - 3, 'utf-8').'...';
	}
	return $string;
}

function get_lon($lon) {
	return str_replace('.', '', substr($lon, 0, strpos($lon, '.') + 7));
}


function format_time($time) {

	$diff_string = '';
	
	if (preg_match('/^[0-9]+$/', $time)) {
	
		if (strlen($time) > 10) {
			$time = substr($time, 0, 10);
		}
		$diff =  time() - $time;
		
		$time_adjust = 8 * 60 * 60;
		
		if ($diff > (86400 * 30)) {
			$diff_string =  date('Y年n月j日', $time + $time_adjust);
		} elseif ($diff > 86400) {
			$diff_string =  date('n月j日 H:i', $time + $time_adjust);
		} elseif ($diff > 3600) {
			if (date('n-j', $time) == date('n-j', time())) {
				$diff_string =  '今天 '.date('H:i', $time + $time_adjust);
			} else {
				$diff_string =  date('昨天 H:i', $time + $time_adjust);
			}
		} elseif ($diff > 60) {
			$span = intval($diff / 60);
			$diff_string =  $span.'分钟前';
		} else {
			$diff_string = '刚才';
		}
		return $diff_string;
	} else {
		return $time;
	}
}


function directory_map($source_dir, $top_level_only = false) {
	if (!in_array(substr($source_dir, -1, 1), array('/', '\\'))) {
		$source_dir .= '/';
	}

	if ($fp = @opendir($source_dir)) {
		$filedata = array();
		$filedata['infor'] = array(
			'create_time' => filectime($source_dir),
			'modify_time' => filemtime($source_dir)
		);
		while (false !== ($file = readdir($fp))) {
			if ($file != '.' && $file != '..') {
				$file_path = $source_dir.$file;
				if (@is_dir($file_path) &&  $top_level_only === false) {
					$temp_array = array();
					$temp_array = directory_map($file_path."/");
					$filedata['dir'][$file] = $temp_array;
				} else {
					$path_parts = pathinfo($file_path);
					$filedata['file'][$file]['infor'] = array(
						'create_time' => filectime($file_path),
						'modify_time' => filemtime($file_path),
						'extension' => $path_parts["extension"],
						'file_size' => filesize($file_path)
					);
				}
			}
		}
		if (is_array($filedata['file'])) {
			ksort($filedata['file']);
		}
		return $filedata;
	}
	return false;
}


function replace_number($string) {
	if (preg_match_all('/[0-9]+/i', $string, $array)) {
		$array = $array[0];
		if (count($array) == '1') {
			$num= (int) $array[0];
			$string = preg_replace('/[0-9]+/i', $num, $string);
		}
	} 
	return $string;
}

$s_str ='ghijklmnopqrstuvwxyz';

function encode($code, $key) {
	global $s_str;
	$s_str_len = strlen($s_str);
	
	$code = urlencode($code);
	$result = '';
	
	$length = strlen($code);
	$k_length = strlen($key);
	for ($i = 0; $i < $length; $i++) {
		
		$_t_ord = ord($code{$i});
		
		if ($i !== $length - 1) {
			$_temp = $s_str{($_t_ord % $s_str_len)};
		} else {
			$_temp = '';
		}
		
		$result .= dechex($_t_ord ^ ord($key{($i % $k_length)})).$_temp;
	}
	return $result;
}

function decode($code, $key) {
	$k_length = strlen($key);
	$_temp = preg_split('/[g-z]/i', $code);
	$i = 0;
	$result = '';
	
	foreach ($_temp as $v) {
		$_m = hexdec($v);
		$result .= chr($_m ^ ord($key{($i++ % $k_length)}));
	}
	
	return urldecode($result);
}

function language_convert($text, $to = 'zh-tw') {
		require_once('ZhConversion.php');

		$m_tables['zh-cn'] = $zh2CN;
		$m_tables['zh-tw'] = $zh2TW;
		$m_tables['zh-sg'] = array_merge($zh2CN, $zh2SG);
		$m_tables['zh-hk'] = array_merge($zh2TW, $zh2HK);
		
		$ret = strtr($text, $m_tables[$to]);
		return $ret;
}

function get_str_head($str) {
	$array = split(' ', $str);
	return $array[0];
}

function is_robot() {
	$ua = $_SERVER['HTTP_USER_AGENT'];
	$is_robot = false;
	
	if (stristr($ua, 'Baiduspider')) {
		$is_robot = true;
	} elseif (stristr($ua, 'Googlebot')) {
		$is_robot = true;
	}
	
	return $is_robot;
}


//10进制转换为字母
function int2chr($n) {
	$n = strval($n);
	$output = '';
	while($n > 0){
		$output = chr(($n % 26) + 97) . $output;
		$n = intval($n / 26);
	}
	return $output;
}

//字母转换为10进制
function chr2int($str) {
	$output = 0;
	$n = 0;
	$str = strtolower($str);
	for($i = strlen($str); $i--; $i >=0 ) {
		//echo (ord($str{$i}) - 97)."<br />";
		$output += (ord($str{$i}) - 97) * pow(26, $n);
		$n++;
	}
	return $output;
}

//将字母转换为二进制
function chr2bin($chr, $length = 0) {
	$number = decbin(chr2int($chr)); //得到二进制值
	//如果规定了长度则固定一下长度
	if ($length > 0) {
		$compare = ($length - strlen($number));
		if ($compare > 0) {
	
			//如果长度不足地块则用0补足
			$len = strlen($number);
			for ($i = 0; $i < ($length - $len); $i++) {
				$number = '0'.$number;
			}
		} elseif ($compare < 0) {
			$number = substr($number, 0, $length);
		}
	}
	return $number;
}

function get_file_rev($file) {
	$rev = '';
	if (file_exists($file)) {
		if (preg_match('/\$Rev\:\s*([0-9]+)\s*\$/i', file_get_contents($file), $array)) {
			$rev = trim($array[1]);
		}
	}
	return $rev;
}

//判断是否是移动设备
function is_mobile() {
	$ua = $_SERVER['HTTP_USER_AGENT'];
	$is_mobile = false;
	
	if (stristr($ua, 'iPad')/* || stristr($ua, 'iPhone') || stristr($ua, 'iPod')*/) {
		$is_mobile = true;
	}

	return $is_mobile;
}

/* 转义一个字符串以便可以放在html标签的属性值中 */
function html_attribute_string($string) {
	return str_replace(array("\"", "<", ">"), array("\&quot;", "&lt;", "&gt;"), $string);
}
function json_encode_string($string) {
	return str_replace(array("\\", "/", "\"", "\r", "\n", "\t"), array("\\\\","\/", "\\\"", "", "", ""), $string);
}

function out_json($array_data = array()) {
	$array_temp = array();
	foreach ($array_data as $k => $v) {
		$array_temp[] = '"'.json_encode_string($k).'":"'.json_encode_string($v).'"';
	}
	$string_temp = join(",\r\n\t", $array_temp);
	die("{\r\n\t".$string_temp."\r\n}");
}

function set_cookie($key, $value) {
	$expires = time() + 3600 * 24 * 365;
	setcookie($key, $value, $expires, '/', DOMAIN);
}

function clear_cookie() {
	foreach ($_COOKIE as $key => $v) {
		setcookie($key, false, false, '/', DOMAIN);
	}
}


function is_page_id($id) {
	return ((int)$id > 600000000 && (int)$id < 700000000);
}

function get_image_size($url, $width = 400) {
	if ($width === 400) {
		$size_str = 'm2w400h1200q85lt';
	} elseif ($width === 300) {
		$size_str = 'm2w300hq80lt';
	} elseif ($width === 640) {
		$size_str = 'm2w640hq85lt';
	} elseif ($width === 100) {
		$size_str = 'm3w100h100q85lt';
	}
	$url = preg_replace('/(.+)\/([^\/]+)$/', '$1/p/'.$size_str.'_$2', $url);
	return $url;
}

function get_tudou($url) {

	$chid = '1209';
	$random = '458';
	$key = 'tt30!@#$%';
	
	$enc = md5($chid.$random.$key);
	
	$_url = 'http://m.tudou.com/shareview.do?playurl='.urlencode($url).'&chid='.$chid.'&random='.$random.'enc='.urlencode($enc);
	
	return $_url;
}
