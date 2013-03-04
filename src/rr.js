/** 
 * 标记是否是开发模式的常量；
 * 在使用Closure Compiler压缩JS的时候，传递--define='ENABLE_DEBUG=false'给压缩器，可以自动把此常量值改为false;
 * 在开发过程中可以使用这个变量放调试代码，压缩器会在压缩的时候把if (ENABLE_DEBUG) {...} 中的代码全部过滤掉
 * @define {boolean}
 */

var ENABLE_DEBUG = true;

/**
 * 如果浏览器不支持String原生trim的方法，模拟一个
 */
if (!String.prototype.hasOwnProperty('trim')) {
	/**
	 * @return {string}
	 */
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
	 * @param {*} selector
	 * @param {Object=} context (可选)
	 * @return {RR.fn} RR.fn对象
	 */
	$: function(selector, context) {
		return new RR.fn(selector, context);
	},

	/**
	 * 返回指定选择符的DOM集合
	 * @function
	 * @param {string} selector CSS选择符
	 * @param {Object=} context (可选)
	 * @return {{length: number}} 类似Array的DOM集合(只有length属性)
	 */
	selectorAll: DOC.querySelectorAll ? function(selector, context) {
		context = context || DOC;
		return context.querySelectorAll(selector);
	} : function(selector, context) {
		return [];
	},
	
	/**
	 * @constructor
	 * @param {*} selector
	 * @param {Object=} context (可选)
	 * @return {RR.fn} RR.fn对象
	*/
	fn: function(selector, context) {
		if (!selector) {
			this.length = 0;
		} else 
		
		//单个DOM对象
		if (selector.nodeType) {
			this.context = this[0] = selector;
			this.length = 1;
		} else 
		
		//字符串选择符
		if ('string' === typeof selector) {
			this.context = RR.selectorAll(selector, context);
			this.length = this.context.length;
		} else 

		//初始化过的对象直接返回，例如$($('div'))
		if (selector instanceof RR.fn) {
			return selector;
		}

		return this;
	}

};

RR.fn.prototype = {

	each: function(fn) {
		for (var i = 0, l = this.length, element; i < l; i++) {
			element = this.context[i];
			fn.call(this, element, i);
		}
		return this;
	}
	
};

//$对象
var $ = RR.$;
