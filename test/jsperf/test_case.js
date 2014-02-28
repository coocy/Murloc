/* 测试代码配置文件 */

{
	/* 测试页面条目 */
	'queryselector': {
		/* 导航标题 */
		'title': 'querySelector',
		'list': [
			/* 测试代码列表 换行用\r\n写入 */
			'document.querySelectorAll(".wrap");',
			'document.getElementsByClassName("wrap");',
			'$(".wrap");',
			'document.querySelectorAll("#id");',
			'document.getElementById("id");',
			'$("#id");'
		]
	},
	
	'for': {
		'title': 'FOR',
		'list': [
			'var list = new Array(5000);\r\nfor (var i = 0; i < list.length; i++) {}',
			'var list = new Array(5000);\r\nvar l = list.length;\r\nfor (var i = 0; i < l; i++) { }'
		]
	},

	'varie_cache': {
		'round': '1',
		'title': '缓存变量',
		'list': [
			'for (var i = 0; i < 50000; i++) {\r\n\t[1,2,3,4,5,6,7,8,9,0].indexOf(1);\r\n}',
			'var array = [1,2,3,4,5,6,7,8,9,0];\r\nfor (var i = 0; i < 50000; i++) {\r\n\tarray.indexOf(1);\r\n}'
		]
	}

}