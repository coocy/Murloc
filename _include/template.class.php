<?php

/**
 * File: template.class.php
 * @author Alex Hu <comicsand@gmail.com>
*/

class mb_template {
	var $temp_file;
	var $temp_dir;
	var $compile_dir;
	var $force_compression = false;
	var $compressHTML = true;
	var $caller = null;
	
	function mb_template($temp_file = null, $options = null, $caller = null) {

		if ($options !== null) {
			foreach ($options as $k => $v) {
				if ($v !== null) {
					$this -> $k = $v;
				}				
			}
		}
		$this -> caller = $caller ? $caller : $this;
		
		if ($temp_file != null) {
			$this -> temp_file = $temp_file; 
		}

		if (substr($this -> temp_dir , -1, 1) != '/' && substr($this -> temp_dir , -1, 1) != '\\') {
			$this -> temp_dir .= '/';
		}
		if (substr($this -> compile_dir , -1, 1) != '/' && substr($this -> compile_dir , -1, 1) != '\\') {
			$this -> compile_dir .= '/';
		}
		
		$pos = strrpos($temp_file, "/");
		
		if (false !== $pos) {
			$dir_part =  substr($temp_file, 0, $pos + 1);
			$this -> temp_dir .= $dir_part;
			$this -> compile_dir .= $dir_part;
			$this -> temp_file = substr($temp_file, $pos + 1, strlen($temp_file));
		}
			
		if (!file_exists($this -> temp_dir.$this -> temp_file)) {
			$this -> _raise_error('Template File "'.$this -> temp_dir.$this -> temp_file.'" doesn\'t exists.');
		}
		
		if (!make_dir($this -> compile_dir)) {
			$this -> _raise_error('Cont\'t create template compile dir "'.$this -> compile_dir.'".');
		}
	}
	
	function set_var($array_vars) {
		$array_vars = (array)$array_vars;
		foreach ($array_vars as $k => $v) {
			$this -> tmp_var -> $k = $v;
		}
		return true;
	}
	
	function output_string() {
		$this -> contents = '';
		ob_start();
		$this -> compile();
		$this -> contents .= ob_get_contents();
		ob_end_clean();
		return $this -> contents;
	}
	
	function compile() {
		$out  = $this -> _compile($this -> temp_file);
		return include_once($this -> compile_dir.$this -> temp_file.'.php');
	}
	
	function _compile($temp_file) {
		$out = '';
		if (!file_exists($this -> temp_dir.$temp_file)) {
			$this -> _raise_error('Include file "'.$temp_file.'" dosen\'t exists.');
		}
		$content = @file_get_contents($this -> temp_dir.$temp_file);
		
		//$this -> _compile_include_file($content);
	
		preg_match_all("|{include\s+[^}]*?file=[\"\']?([\/\\\\\w\.\?\*#&-]+)[\"\']?[^}]*?}|i", $content, $include_files);

		foreach($include_files[1] as $include_file) {
			if ($include_file != '' && $include_file != '.' && $include_file != '..') {
				$include_content = $this -> _compile($include_file);
			}
		}
		preg_match_all("|<%@\s*include\s+[^}]*?file=[\"\']?([\/\\\\\w\.\?\*#&-]+)[\"\']?[^}]*?%>|i", $content, $include_files);
		foreach($include_files[1] as $include_file) {
			if ($include_file != '' && $include_file != '.' && $include_file != '..') {
				$include_content = $this -> _compile($include_file);
			}
		}
		
		$serial_file = $this -> compile_dir.$temp_file.'.serial';
		 if ($script_serial = @file_get_contents($serial_file)) {
			$mtime = unserialize($script_serial);
		} else {
			$mtime = null;
		}
		
		$preg_var_name = "[\t ]*([^\s=,:]+)[\t ]*"; /* 变量名 */
		$preg_value = '[\t ]*((?:\'[^\']*\')|(?:\"[^\"]*\")|(?:[^\s=,:\|\&\<\>\!\{\}]+))[\t ]*';
		$this -> preg_value = $preg_value;
		
		if (!file_exists($this -> compile_dir.$temp_file.'.php') || filemtime($this -> temp_dir.$temp_file) != $mtime || $this -> force_compression) {

			$preg = array(
				"/\t*{include((\s+[^\s={}]+\s*=\s*((?:#[^#]*#)|([^\s{}]+)))+)\s*}/ie",
			);

			$replace = array(
				"\$this -> parse_include_tag('\\1')",
			);

			if ($this -> output_template !== true) {
				$preg = array_merge($preg, array(
					"/\t*<%@\s*include((\s+[^\s={}]+\s*=\s*((?:#[^#]*#)|([^\s{}]+)))+)\s*%>/ie",
					"/<%@?\s*.+?%>/is",
					"/\t*<\/c:(when|otherwise)>/i",
					"/\t*<c:choose>/i",
					"/\t*<\/c:choose>/i",

					'/\t*<c:set\s*var\s*='.$preg_value.'\s+value\s*='.$preg_value.'\s*\/?>/ie',
					
					
					'/\t*<c:forEach\s+items\s*=\s*\"\${'.$preg_value.'}\"\s+var\s*=\s*\"'.$preg_value.'\"\s*>/ise',
					'/\t*<c:(if|when)\s+test\s*=\s*\"\s*\${('.$preg_value.'(\s*(\s+eq\s+|\s+ne\s+|==|===|\!=|\!==|<|<=|>|>=|&&|\|\|)'.$preg_value.')*)\s*}\s*\"\s*>/ise',
					'/\t*<c:(if|when)\s+test\s*=\s*\"\${\s*(!?(?:empty)?)\s*'.$preg_var_name.'\s*}\s*\"\s*>/ie',
					
					'/\${'.$preg_value.'(?:\:\s*(h|u|s|d|t|upper|lower|nohtml|content|number))?}/ie',

					"|\t*<c:otherwise>|i",
					'/\t*<\/c:(if|forEach)>/i',
					"|\\\\{([^{}]+)\\\\}|i",
				));
				$replace = array_merge($replace, array(
					"\$this -> parse_include_tag('\\1')",
					"",
					"",
					"<?php { ?>",
					"<?php } ?>",

					"\$this -> set_vars('\\1', '\\2')",
					
					"\$this -> parse_foreach('\\1','\\2','\\3')",
					"\$this -> parse_if_con('\\2', '\\1')",
					"\$this -> parse_if('\\2','\\3', '\\1')",

					"\$this -> parse_vars_filter('\\1','\\2')",

					'<?php } else { ?>',
					'<?php } ?>',
					'{$1}',
				));
			  
			}
			$content = preg_replace($preg, $replace, $content);
			
			if ($this -> compressHTML) {
				//$content = preg_replace('/<\!\-\-.*?\-\->/s', '', $content);
				$content = str_replace(array("\r\n", "\r", "\n", "\t"), '', $content);
			}
			$out .= $content;
			$this -> _save_template($temp_file, $out);
		}
		return $out;
	}
	
	function parse_vars_string($value_string) {
		$value_string = stripslashes($value_string);
		$output = '';
		
		if (false !== strpos('|true|false|null|undefined|', '|'.strtolower($value_string).'|')) {
			return $value_string;
		}
		
		$start_chr = $value_string{0};
		$end_chr = substr($value_string, -1, 1);
		
		if ($start_chr == '\'' || $start_chr == '"' || $start_chr == '#') {
			if ($start_chr === $end_chr) {
				$output = '"'.str_replace('"', '\"', substr($value_string, 1, (strlen($value_string) - 2))).'"';
			}
		} else {
			if ($start_chr == '!') {
				$value_string = substr($value_string, 1);
				$output = $start_chr;
			}
			//if (preg_match('/^([^\[\]]+)((?:\[[^\[\]]+\])*)$/i', $value_string, $array)) {
			
				$value = $array[1];
				//$sub_value_string = $array[2];
				
				/* 数字 */
				if (preg_match('/^[0-9\.]+$/', $value_string)) {
					$output .= $value_string;
				} else {
					$sub_values = explode('.', $value_string);				
					$output .= '$this -> tmp_var';
					foreach ($sub_values as $v) {
						$output .= '["'.preg_replace('/\[[^\]]*\]/', '', $v).'"]';
						if (preg_match_all('/\[(0-9)+\]/i', $v, $array)) {
							$sub_values = (array)$array[1];
							foreach ($sub_values as $v) {
								$output .= '['.trim($v, '\'"').']';
							}
						}
					}
				
				
				}
			//}
		}
		
		return  $output;
	}
	
	function parse_foreach($vars1, $vars2, $vars3) {

		$vars1 = $this -> parse_vars_string($vars1);
		$vars2 = $this -> parse_vars_string($vars2);
		
		if ($vars3) {
			$vars3 = $this -> parse_vars_string($vars3);
			$output = '<?php foreach ((array) '.$vars1.' as '.$vars2.' => '.$vars3.') {  ?>';
		}  else {
			$output = '<?php foreach ((array) '.$vars1.' as '.$vars2.') {  ?>';
		}
		return $output;
	}

	function set_vars($vars1, $vars2) {
		$vars1 = $this -> parse_vars_string($vars1);
		$vars2 = $this -> parse_vars_string($vars2);

		if (preg_match('/^\".+\"$/', $vars1)) {
			$vars1 = '$this->tmp_var["'.trim($vars1, '"').'"]';
		}

		$output = '<?php '.$vars1.'='.$vars2.';  ?>';
		return $output;
	}
	
	function parse_vars_filter($var_name, $type) {
		$_var_name = $this -> parse_vars_string($var_name);

		if ($type == 'd') {
			$output = '<?php echo "<div style=\"padding:1em;\"><b>'.$var_name.'</b><br /><textarea style=\"width:100%;height:250px;\">"; print_r('.$_var_name.'); echo "</textarea></div>"; ?>';
		} else {
		
			if (!$type) {
				$fn_name = '';
			} else {
				$fn_array = array(
					'h' => 'htmlspecialchars',
					'u' => 'urlencode',
					's' => 'addslashes',
					't' => 'format_time',
					'upper' => 'strtoupper',
					'lower' => 'strtolower',
					'nohtml' => 'strip_html',
					'content' => '$this -> caller -> emotions',
					'number' => 'filter_num',
				);
				
				$fn_name = $fn_array[$type];
			}
			
			$output = '<?php echo '.$fn_name.'('.$_var_name.');?>';
		}
		
		return $output;
	}
	
	function parse_if($vars1, $vars2, $type = 'if') {

		$vars2 = $this -> parse_vars_string($vars2);
		if ($vars1 == 'empty' || $vars1 == '!empty') {
			$output = '<?php '.($type == 'when' ? '}': '').'if ('.$vars1.'('.$vars2.')) {  ?>';
		} else {
			$output = '<?php '.($type == 'when' ? '}': '').'if ('.$vars1.$vars2.') {  ?>';
		}
			
		return $output;
	}
	
	function parse_if_con($con_string, $type = 'if') {
	
		$con_string = preg_replace('/\s*eq\s*/i', "==", $con_string);
		$con_string = preg_replace('/\s*ne\s*/i', "!=", $con_string);
		$con_string = preg_replace('/'.$this -> preg_value.'/ie', "\$this -> parse_vars_string('\\1')", $con_string);

		$output = '<?php '.($type == 'when' ? '}': '').'if ('.$con_string.') { ?>';
		return $output;
	}
	
	function parse_include_tag($attribute_string) {
		$attribute_string = stripslashes($attribute_string);
		$output = '<?php ';
		
		/* 属性数组 */
		$array = array();
		if (preg_match_all('/\s+([^\s=]+)\s*=\s*((?:#[^#]*#)|(?:[^\s]+))/i', $attribute_string, $array)) {
			
			$include_file = '';
			
			if (count($array) > 0) {
				foreach ($array[1] as $i => $key) {
					$value = trim($array[2][$i]);
					
					if ($key == 'file') {
						$include_file = trim($value, '\'"#');
						continue;
					}
					
					$value = $this -> parse_vars_string($value);
					$output .= '$this -> tmp_var -> '.$key.' = '.$value.';';
				}
			}
			
			if ($include_file) {
				$output .= '$this -> _get_include_file("'.$include_file.'");';
			}
			
			$output .= ' ?>';
			$attribute_string = $output;

		} else {
			 $attribute_string = '';
		}
		return $attribute_string;
	}
	
	function _compile_include_file($content) {
		preg_match_all("|{include\s+file=[\"\']?([\w\.\?\*#&-]+)[\"\']?\s*}|i", $content, $include_files);
		foreach($include_files[1] as $include_file) {
			$this -> _compile($include_file);
		}
	}
	
	function _get_include_file($file) {
		if (file_exists($this -> compile_dir.$file.'.php')) {
			include($this -> compile_dir.$file.'.php');
		} else {
			$this -> _raise_error('Include file "'.$file.'" dosen\'t exists.');
		}
	}
	
	function _save_template($temp_file, $content) {
		$compile_file = $temp_file.'.php';
		if (!($fd = fopen($this -> compile_dir.$compile_file, 'w'))) {
			$this -> _raise_error("problem writing temporary file '$compile_file'");
			return false;
		}
		fwrite($fd, $content);
		fclose($fd);
		
		$mtime = filemtime($this -> temp_dir.$temp_file);

		$serial_file = $this -> compile_dir.$temp_file.'.serial';
		$s = @fopen($serial_file, 'w');
		if ($s) {
			$m_date_serialize = serialize($mtime);
			@fwrite($s, $m_date_serialize);
		}
			
		return true;
	}

	function _raise_error($error) {
		die($error);
	}
}
