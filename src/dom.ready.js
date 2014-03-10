
$.ready = function(fn) {

	//如果页面已经加载完成，直接执行方法
	if (true === $.loader.isLoaded) {
		fn();
	} else {	
		$.loader.callbacks.push(fn);
		$.loader.init();
	}
	return this;
};
$.prototype.ready = $.ready;

$.loader = {

	callbacks: [],

    /**
     * @type {boolean}  是否已经初始化
     */
	isInited: false,

    /**
     * @type {boolean}  是否已经加载完成
     */
	isLoaded: false,

	timer: null,

	ieTimer: function() {
		if (IsIE && 'interactive' == DOC.readyState) {
			if ($.loader.timer) {
				clearTimeout($.loader.timer);
			}
			$.loader.timer = setTimeout($.loader.ieTimer, 10);
		} else {
			$.loader.init();
			$.loader.isInited = true;
		}
	},
	
	/**
	 * 初始化函数
	 * 因为页面中引用的Javascript文件是异步加载的，因此加载完Javascript文件后需要判断HTML页面是否加载完全:
	 * 1. 如果document.readyState的值不为"loading", 则马上执行初始化函数
	 * 2. 如果document.readyState的值为"loading", 则把初始化函数放入DOMContentLoaded中执行
	 */
	init: function() {

		if (false === $.loader.isInited) {

			var readyState = DOC.readyState;

			//页面载入完成后的对$().ready()的调用直接执行
			if ('loading|uninitialized'.indexOf(readyState) < 0) {

				/* 在JS异步模式下，
				 * IE浏览器在document.readyState等于interactive的时候文档尚未解析完成（其它浏览器没有问题），
				 * 加个定时器检查document.readyState
				 */
				if (IsIE && ('interactive' == readyState)) {
					$.loader.ieTimer();
					return;
				} else { 
					$.loader.loaded();
				}
			} else {
				/* 在第一次调用$.ready()的时候才进行初始化 */
				$.loader.isInited = true;
				if (DOC.addEventListener) {
					DOC.addEventListener('DOMContentLoaded', $.loader.loaded);
				} else {
					//IE
					var id = '_ir_';
					var script = DOC.getElementById(id);
					if (!script) {
						DOC.write('<script id="' + id + '" defer="true" src="://"></script>');
						script = DOC.getElementById(id);
					}
					script.onreadystatechange = script.onload = function() {
						if (this.readyState == 'complete') {
							$.loader.loaded();
						}
					};
				}
			}
		}
	},

	loaded: function() {
		if (false === $.loader.isLoaded) {
			$.loader.isLoaded = true;
			$.loader.fire();
		}
	},

	/**
	 * 触发初始化函数
	 */
	fire: function() {

		/* 遍历执行初始化函数数组 */
		for (var callbacks = $.loader.callbacks, i = 0, l = callbacks.length; i < l; i++) {
			if (ENABLE_DEBUG) {
				callbacks[i]();
			} else {
				try {
					callbacks[i]();
				} catch(e) {}
			}
		}
		$.loader.callbacks = [];
	}
	
};