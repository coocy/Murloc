
/**
 * 如果浏览器不支持String原生trim的方法，模拟一个
 */
if (!String.prototype.hasOwnProperty('trim')) {
	String.prototype.trim = function() {
		return this.replace(/^(\s|\r|\n|\r\n)*|(\s|\r|\n|\r\n)*$/g, '');
	}
}

var DOC = document,
	WIN = window;
	
var RR = {

	/**
	 * 返回RR对象($对象)
	 * @function
	 * @param {String} selector CSS选择符
	 * @param {DOM} context (可选)  (默认document)
	 * @return {DOMCollection} 指定选择符的DOM集合
	 */
	init: function(selector, context) {
		return new RR.fn(selector, context);
	},

	/**
	 * 返回指定选择符的DOM集合
	 * @function
	 * @param {String} selector CSS选择符
	 * @param {DOM} context (可选)  (默认document)
	 * @return {DOMCollection} 指定选择符的DOM集合
	 */
	selectorAll: function(selector, context) {
		context = context || DOC;
		return context.querySelectorAll(selector);
	},

	fn: function(selector, context) {
		if (!selector) {
			return this;
		}
		
		//单个DOM对象
		if (selector.nodeType) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;
		}
		
		//字符串选择符
		if ('string' === typeof selector) {
			this.context = RR.selectorAll(selector, context);
			this.length = this.context.length;
			return this;
		}
		
		//初始化过的对象直接返回，例如$($('div'))
		if (selector instanceof RR.fn) {
			return selector;
		}
	}

};

RR.fn.prototype = {

	width: function() {
		return this;
	},
	
	height:  function() {
		return this;
	}
	
};

//$对象
var $ = RR.init;
