
RR.fn.prototype.ready = RR.dom.prototype.ready = function(fn) {

	//如果页面已经加载完成，直接执行方法
	if (true === RR.loader.isLoaded) {
		fn();
	} else {	
		RR.loader.callbacks.push(fn);
		RR.loader.init();
	}
	return this;
};

RR.dom.prototype.remove = function() {
	return this.each(function(element) {
		element.parentNode.removeChild(element);
	});
};

RR.insertNodeBefore = function(element, parent, target) {
	//原生DOM对象直接添加
	var method = target ? 'insertBefore' : 'appendChild';
	if (element.nodeType) {
		parent[method](element, target);

	} else if (element instanceof RR.dom) {
		for (var i = 0, l = element.length; i < l; i++) {
			parent[method](element.context[i], target);
		}

	} else if ('string' === typeof element) {
		//处理添加HTML片段，不使用+=innerHTML是因为这样会消除给容器内的对象绑定的事件
		var containter = DOC.createElement('div');
		containter.innerHTML = element;
		for (var i = 0, l = containter.childNodes.length; i < l; i++) {
			parent[method](containter.childNodes[0], target);
		}
	}
};

RR.dom.prototype.before = function(preElement) {
	return this.each(function(element) {
		RR.insertNodeBefore(preElement, element.parentNode, element);
	});
};

RR.dom.prototype.after = function(nextElement) {
	return this.each(function(element) {
		RR.insertNodeBefore(nextElement, element.parentNode, element.nextSibling);
	});
};

RR.dom.prototype.prepend = function(childElement) {
	return this.each(function(element) {
		RR.insertNodeBefore(childElement, element, element.firstChild);
	});
};

RR.dom.prototype.append = function(childElement) {
	return this.each(function(element) {
		RR.insertNodeBefore(childElement, element);
	});
};

RR.dom.prototype.insertBefore = function(targetElement) {
	$(targetElement).before(this);
	return this;
};

RR.dom.prototype.insertAfter = function(targetElement) {
	$(targetElement).after(this);
	return this;
};

RR.dom.prototype.prependTo = function(targetElement) {
	$(targetElement).prepend(this);
	return this;
};

RR.dom.prototype.appendTo = function(targetElement) {
	$(targetElement).append(this);
	return this;
};

RR.dom.prototype.width = function() {
	var element = this.context[0];
	return element && element.offsetWidth;
};

RR.dom.prototype.height = function() {
	var element = this.context[0];
	return element && element.offsetHeight;
};

RR.dom.prototype.first = function() {
	return this.eq(0);
};

RR.dom.prototype.last = function() {
	return this.eq(-1);
};

RR.dom.prototype.eq = function(index) {
	return $(this.get(index));
};

RR.dom.prototype.indexOf = [].indexOf;

RR.dom.prototype.index = function(){
    return this.parent().children().context.indexOf(this.get(0));
};

RR.dom.prototype.get = function(index) {
	var length = this.length,
		idx = index + (index < 0 ? length : 0);

	return (idx > length - 1) ? null : this.context[idx];
};

RR.dom.prototype.parent = function() {
	var result = new RR.dom(),
		elements = [];
	this.each(function(element) {
		elements.push(element.parentNode);
	});
	result.context = elements;
	result.length = elements.length;
	return result;
};

RR.dom.prototype.children = function() {
	var result = new RR.dom(),
		elements = [];
	this.each(function(element) {
		for (var i = 0, l = element.childNodes.length; i < l; i++) {
			var child = element.childNodes[i];
			(1 == child.nodeType) && elements.push(child);
		}
	});
	result.context = elements;
	result.length = elements.length;
	return result;
};

RR.dom.prototype.clone = function(cloneChildren) {
	var result = new RR.dom(),
		elements = [];
	this.each(function(element) {
		elements.push(element.cloneNode(!!cloneChildren));
	});
	result.context = elements;
	result.length = elements.length;
	return result;
};

RR.dom.uid = function(element) {
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
		if (!IsIE && ('loading' != DOC.readyState)) {
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
