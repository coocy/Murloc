
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

RR.fn.prototype.prepend =  function(childElement) {
	return this.each(function(element) {
		var firstChild = element['firstElementChild'];
		//原生DOM对象直接添加
		if (childElement.nodeType) {
			element.insertBefore(childElement, firstChild);

		} else if (childElement instanceof RR.fn) {
			for (var i = 0, l = childElement.length; i < l; i++) {
				element.insertBefore(childElement.context[i], firstChild);
			}

		} else if ('string' === typeof childElement) {
			//处理添加HTML片段，不使用+=innerHTML是因为这样会消除给容器内的对象绑定的事件
			var containter = DOC.createElement('div');
			containter.innerHTML = childElement;
			for (var i = 0, l = containter.childNodes.length; i < l; i++) {
				element.insertBefore(containter.childNodes[0], firstChild);
			}
		}
	});
};

RR.fn.prototype.append =  function(childElement) {
	return this.each(function(element) {

		//原生DOM对象直接添加
		if (childElement.nodeType) {
			element.appendChild(childElement);

		} else if (childElement instanceof RR.fn) {
			for (var i = 0, l = childElement.length; i < l; i++) {
				element.appendChild(childElement.context[i]);
			}

		} else if ('string' === typeof childElement) {
			//处理添加HTML片段，不使用+=innerHTML是因为这样会消除给容器内的对象绑定的事件
			var containter = DOC.createElement('div');
			containter.innerHTML = childElement;
			for (var i = 0, l = containter.childNodes.length; i < l; i++) {
				element.appendChild(containter.childNodes[0]);
			}
		}
	});
};

RR.fn.prototype.width =  function() {
	var element = this.context[0];
	return element && element.offsetWidth;
};

RR.fn.prototype.height =  function() {
	var element = this.context[0];
	return element && element.offsetHeight;
};

RR.fn.prototype.first =  function() {
	return this.eq(0);
};

RR.fn.prototype.last =  function() {
	return this.eq(-1);
};

RR.fn.prototype.eq =  function(index) {
	var length = this.length,
		idx = index + (index < 0 ? length : 0);

	this.context = (idx >= 0 && idx < length) ? [this.context[idx]] : [];
	this.length = this.context.length;
	return this;
};

RR.fn.prototype.get =  function(index) {
	var length = this.length,
		idx = index + (index < 0 ? length : 0);

	return (idx > length - 1) ? null : this.context[idx];
};

RR.fn.prototype.parent =  function() {
	var result = new RR.fn(),
		elements = [];
	this.each(function(element) {
		elements.push(element.parentNode);
	});
	result.context = elements;
	result.length = elements.length;
	return result;
};

RR.fn.prototype.clone =  function(cloneChildren) {
	var result = new RR.fn(),
		elements = [];
	this.each(function(element) {
		elements.push(element.cloneNode(!!cloneChildren));
	});
	result.context = elements;
	result.length = elements.length;
	return result;
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
		if ('loading' !== DOC.readyState) {
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
