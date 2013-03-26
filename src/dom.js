
RR.fn.prototype.html =  function() {
	var html = arguments[0];
		
	if ('string' === typeof html) {
		return this.each(function(element) {
			element.innerHTML = html;
		});
	} else {
		var element = this.context[0];
		return element && element.innerHTML;
	}
};

RR.fn.prototype.ready = function(fn) {

	//如果页面已经加载完成，直接执行方法
	if (true === RR.loader.isLoaded) {
		fn();
	} else {	
		RR.loader.callbacks.push(fn);
		RR.loader.init();
	}
	return this;
};

RR.fn.prototype.remove =  function() {
	return this.each(function(element) {
		element.parentNode.removeChild(element);
	});
};

RR.fn.uid = function(element) {
	return element['__ruid'] || (element['__ruid'] = RR.uid++);
};

RR.loader = {

	callbacks: [],

    /**
     * {Boolean}  是否已经初始化
     */
	isInited: false,

    /**
     * {Boolean}  是否已经加载完成
     */
	isLoaded: false,
	
	/**
	 * 初始化函数
	 * 因为页面中引用的Javascript文件是异步加载的，因此加载完Javascript文件后需要判断HTML页面是否加载完全:
	 * 1. 如果document.readyState的值不为"loading", 则马上执行初始化函数
	 * 2. 如果document.readyState的值为"loading", 则把初始化函数放入DOMContentLoaded中执行
	 */
	init: function() {

		//页面载入完成后的对$().ready()的调用直接执行
		if (/loaded|complete/i.test(DOC.readyState)) {
			RR.loader.loaded();

		} else {

			/* 在第一次调用$.ready()的时候才进行初始化 */
			if (false === RR.loader.isInited) {
				RR.loader.isInited = true;
				if (DOC.addEventListener) {
					DOC.addEventListener('DOMContentLoaded', RR.loader.loaded);
				} else {
					//IE
					var getElementById = DOC.getElementById, 
						id = '_ir_';
					var script = getElementById(id);
					if (!script) {
						DOC.write('<script id="' + id + '" defer="true" src="://"></script>');
					}
					script = getElementById(id);
					script.onreadystatechange = function() {
						if (this.readyState == 'complete') {
							RR.loader.loaded();
						}
					};
				}
			}
		}
	},

	loaded: function() {
		RR.loader.isLoaded = true;
		RR.loader.fire();
	},

	/**
	 * 触发初始化函数
	 */
	fire: function() {

		/* 遍历执行初始化函数数组 */
		for (var callbacks = RR.loader.callbacks, i = 0, l = callbacks.length; i < l; i++) {
			if (ENABLE_DEBUG) {
				callbacks[i]();
			} else {
				try {
					callbacks[i]();
				} catch(e) {}
			}
		}
		RR.loader.callbacks = [];
	}
	
};
