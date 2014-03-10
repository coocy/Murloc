<?php

require_once('json.class.php');

$config_file = 'test_case.js';
$config_content = file_get_contents($config_file);

$json = new Services_JSON();
$test_list = $json -> decode($config_content);

$current_test_name = trim($_GET['t']);

$keys = array_keys($test_list);
$key = $keys[0];


$current_test = $test_list[$key];

if ($test_list[$current_test_name]) {
	$current_test = $test_list[$current_test_name];
} else {
	$current_test_name = $key;
}

$test_item = $current_test['list'];

$round = $current_test['round'];

if (!$round) {
	$round = 5000;
}

$r = 3 - count($test_item);
if ($r > 0) {
	$test_item = array_merge($test_item, array_fill(2, $r, ''));
}

?>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<title>Javascript性能测试</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0" />
	<script type="text/javascript" src="../../src/Murloc.js"></script>
	<script type="text/javascript">
			var runLoop,
				maxTime;
			var GO = function() {
				var elTextareas = $('textarea');
				var scriptText, 
					elTextarea,
					label,
					functuions = {},
					titles = {};
					
				maxTime = 0;
					
				runLoop = parseInt($('#runloop').val().trim(), 10);
				for (var i = 0, l = elTextareas.length; i < l; i++) {
					elTextarea = elTextareas.eq(i);
					scriptText = elTextarea.val().trim();
					
					var elTitle = $('h1', elTextarea.parent()).get(0);
					elTitle.count = '';
					
					if ('' !== scriptText) {
						fn = new Function('', 'try{' + scriptText + '} catch(e){}');
						functuions[i] = [fn, elTitle];
					}
				}

				
				if (runLoop <= 0) {
					runLoop = 1000;
					$('#runloop').val(runLoop);
				}
				
				var fn, _fn, timeStart, timetotal, results = {}, l, html = [];
				for (label in functuions) {
					l = runLoop;
					fnItem = functuions[label];
					
					_fn = new Function('', 'var item=this;return function(){return run.call(null, item)}');
					setTimeout(_fn.call(fnItem), 0);
				}

				setTimeout(updateChart, 0);
			};
			
			var run = function(fnItem) {
				var fn = fnItem[0],
					l = runLoop,
					timeStart = new Date;
					
				for (var i = 0; i < runLoop; i++) {
					fn();
				}
				timeTotal = new Date - timeStart;
				if (timeTotal > maxTime) {
					maxTime = timeTotal;
				}
				
				fnItem[1].innerHTML = '<b>' + timeTotal +  'ms</b><span></span>';
				fnItem[1].count = timeTotal;
			};
			
			var updateChart = function() {
				var elTitles = $('h1'),
					elTitle,
					l = elTitles.length;
					
				while(l--) {
					elTitle = elTitles.context[l];
					if (elTitle.count) {
						$('span', elTitle).css('width', Math.ceil(elTitle.count / maxTime * 100) + '%');
					} else {
						$('b', elTitle).html('');
						$('span', elTitle).css('width', '');
					}
				}
			};
			
			var AddRow = function() {
				var elWrap = document.getElementsByClassName('wrap')[0],
					elCell = document.createElement('DIV');
					elCell.className = 'cell';
					elCell.innerHTML = '<h1><b></b><span></span></h1><textarea></textarea>';
					elWrap.appendChild(elCell);
			};
			
			var RemoveRow = function() {
				var elWrap = document.getElementsByClassName('wrap')[0],
					elClildren = elWrap.children,
					l = elClildren.length;
					if (l > 1) {
						elWrap.removeChild(elClildren[l - 1]);
					}
			};

	</script>
	<style type="text/css">
		body,td,input,textarea,option,select,button{
			font-family:arial,Helvetica,sans-serif;
			font-size:1em;
			-webkit-text-size-adjust: none;
			-webkit-user-select: text;
			-webkit-tap-highlight-color:rgba(0,0,0,0);
		}
	
		h1{
			padding:0;
			margin:0;
			font-size:1em;
		}
		h1 b{
			height:1em;
			display:block;
			color:#BE0002;
		}
		h1 span{
			display:block;
			width:0;
			margin:3px 0 0;
			height:4px;
			background:#BE0002;
		}
		.wrap{
			oveflow:hidden;
		}
		textarea,
		input.text{
			border:1px solid #ccc;
			padding:10px;
			outline:none;
			font-size:.8em;
			margin:0;
			-webkit-border-radius:3px;
			-webkit-box-shadow: inset #eee 0 1px 3px, #fff 1px 1px 0;
		}
		input.text{
			width:70px;
		}
		textarea{
			width:100%;
			height:7em;
			line-height: 1.5;
			-webkit-border-radius: 0 0 3px 3px;
		}
		textarea:focus,
		input:focus
		{
			border-color:#0069C1;
		}
		.cell{
			margin-top:10px;
		}

		table{
			border-collapse:collapse;
			border:1px solid #83ACC6;
		}
		td,th{
			border:1px solid #CEE1EE;
			padding:.3em 1em;
		}
		th{
			background:#F0F5F8;
		}
		tbody{
			background:#fff;
		}
		.row_wrap{
			clear:both;
			padding:10px 0 0;
		}
		button{
			cursor:pointer;
			margin-left:5px;
			float:right;
			-webkit-user-select: none;
			background: -webkit-gradient(
				linear,
				0 0,
				0 100%,
				from(#67A54B),
				to(#67A54B)
			);
			padding:8px 2em;
			color:#fff;
			border: 1px solid #3B6E22;
			font-weight:bold;
			-webkit-box-align: center;
			-webkit-box-pack: center;
			-webkit-appearance: none;
			-webkit-border-radius: 5px;
			-webkit-box-shadow:inset rgba(255, 255, 255, .3) 0 1px 0, rgba(0, 0, 0, .2) 0 1px 0;
		}
		button.active{
			-webkit-box-shadow:inset rgba(0, 0, 0, .3) 0 1px 3px, rgba(0, 0, 0, .2) 0 1px 0;
		}
		.add_row,
		.remove_row{
			margin-left:5px;
			cursor:pointer;
			float:right;
			font-weight:bold;
			border:1px solid #ccc;
			padding:8px 15px;
			-webkit-border-radius:3px;
			-webkit-box-shadow: inset #eee 0 1px 3px, #fff 1px 1px 0;
			background: -webkit-gradient(
				linear,
				0 0,
				0 100%,
				from(#FAFAFA),
				to(#eee)
			);
			-webkit-user-select: none;
		}
		.add_row.active,
		.remove_row.active
		{
			border:1px solid #bbb;
			-webkit-box-shadow:inset rgba(0, 0, 0, .2) 0 1px 3px;
		}
		ul{
			float:left;
			margin:1.6em 10px 0 0;
			padding:0;
			
		}
		ul a{
			font-size:.75em;
			background:#EFEFEF;
			display:block;
			padding:.5em 1em;
			text-decoration:none;
			color:#666;
			margin-bottom:1px;
		}
		ul a.active,
		ul a:hover
		{
			background:#f3f3f3;
		}
		ul a.c{
			background:#BE0002;
			color:#fff;
		}
		.content{
			overflow:hidden;
		}
		@media only screen and (max-width:320px){
			ul{
				float:none;
				margin:0;
			}
		}
		@media only screen and (min-width:768px){
			body,input{
				font-size:1.5em;
			}
		}
	</style>
</head>
<body>
	<div id="list_content" type="card"><section class="on"></section><section class="off"></section></div>
	<ul>
		<?php
			foreach ($test_list as $k => $v) {
		?>
		<li><a href="./?t=<?php echo ($k); ?>"
			<?php 
				if ($k == $current_test_name) {
					echo ' class="c"';
				} ?>
		><?php echo ($v['title']); ?></a></li>
		<?php
			}
		?>
	</ul>
	
	<div class="content">
		<div class="wrap">
			<?php
				foreach ($test_item as $k => $v) {
			?>
			<div class="cell">
				<h1><b></b><span></span></h1>
				<textarea><?php echo ($v) ?></textarea>
			</div>
			<?php
				}
			?>
		</div>
		<div class="row_wrap">
			<button type="submit">运行</button>
			<span class="remove_row">-</span>
			<span class="add_row">+</span>
			<input type="text" id="runloop" class="text" value="<?php echo ($round) ?>" />
		</div>
	</div>


<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>

	<script type="text/javascript">
		GO();
		$('.row_wrap button').on('click', GO);
		$('.row_wrap .add_row').on('click', AddRow);
		$('.row_wrap .remove_row').on('click', RemoveRow);
	</script>





</body>
</html>