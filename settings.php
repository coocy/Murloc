<?php

ini_set('default_charset', 'utf-8');
error_reporting(E_ALL & ~E_NOTICE);
define('ROOT_PATH', dirname(__FILE__).'/');

date_default_timezone_set('Asia/Shanghai');

define('INCLUDE_PATH', ROOT_PATH.'_include/'); 

include_once(INCLUDE_PATH.'functions.php');
include_once(INCLUDE_PATH.'json.class.php');
include_once(INCLUDE_PATH.'template.class.php');
include_once(INCLUDE_PATH.'compress.php');

define('PAGE_DIR', ROOT_PATH.'test/');
define('DATA_DIR', ROOT_PATH.'_data/');
define('OUTPUT_DIR', ROOT_PATH.'_output/');
define('WEB_PATH', '/murloc/');

$template_exts = array('html', 'htm', 'jsp');
$ignore_files = array();