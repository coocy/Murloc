
RR.fn.prototype.ready = function(fn) {
	RR.loader.callbacks.push(fn);
	RR.loader.init();
	return this;
};

RR.fn.prototype.remove =  function(fn) {
	this.each(function(index, element) {
		element.parentNode.removeChild(element);
	});
	return this;
};

RR.loader = {

	callbacks: [],

    /**
     * {Boolean}  是否已经初始化
     */
	inited: false,
	
	/**
	 * 初始化函数
	 * 因为页面中引用的Javascript文件是异步加载的，因此加载完Javascript文件后需要判断HTML页面是否加载完全:
	 * 1. 如果document.readyState的值不为"loading", 则马上执行初始化函数
	 * 2. 如果document.readyState的值为"loading", 则把初始化函数放入DOMContentLoaded中执行
	 */
	init: function() {
		/* 在第一次调用$.ready()的时候才进行初始化 */
		if (false === RR.loader.inited) {
			RR.loader.inited = true;
			if ('loading' == DOC.readyState) {
				DOC.addEventListener('DOMContentLoaded', RR.loader.fire, false);
			} else {
				RR.loader.fire();
			}
		}
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
		RR.loader.callbacks = null;
	}
	
};
