<!DOCTYPE html>
<html>
<head>
	<title>Test Page</title>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0" />
	<meta content="" name="description" />
	<script type="text/javascript">
		var start = new Date;
		function log(msg) {
			document.getElementById('log').innerHTML += '<p>' + msg + '</p>';
		};

		document.addEventListener('DOMContentLoaded',  function() {
			log(new Date - start);
		});

	</script>
	<style type="text/css">
		body{
			padding:1em;
			font-family: arial;
		}
		#log{
			padding:1em;
			background: #eee;
			border: 1px solid #ddd;
		}
		p{
			padding: 0;
			margin: 0;
		}
	</style>
</head>
<body>

	<section>
		
		<div id="log"></div>
		<div class="box_4">
			<div class="box_3">
				<div class="box_2">
					<div class="box_1"></div>
				</div>
			</div>
		</div>


		<?php  for ($i = 0; $i < 20000; $i++) { ?>
			<div onclick="log('2')"></div>
		<?php }  ?>



	</section>

</body>
</html>