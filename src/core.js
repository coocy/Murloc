/**
 * 标记是否是开发模式的常量；
 * 在使用Closure Compiler压缩JS的时候，传递--define='ENABLE_DEBUG=false'给压缩器，可以自动把此常量值改为false;
 * 在开发过程中可以使用这个变量放调试代码，压缩器会在压缩的时候把if (ENABLE_DEBUG) {...} 中的代码全部过滤掉
 * @define {boolean}
 */
var ENABLE_DEBUG = true;

/**
 * 标记是否需要支持IE的常量；
 * 在使用Closure Compiler压缩JS的时候，传递--define='ENABLE_IE_SUPPORT=false'给压缩器，可以自动把此常量值改为false;
 * 库中会有一些针对IE的代码，在不需要兼容IE的项目中，设置ENABLE_IE_SUPPORT=false可以减少压缩后的代码
 * @define {boolean}
 */
var ENABLE_IE_SUPPORT = true;

/* 保存常用DOM的全局变量（变量名可以被压缩） */
var
	/**  @type {Document} */
	DOC = document,

	/**  @type {Window} */
	WIN = window,

	/**
	 * 设备是否支持触摸事件
	 * 这里使用WIN.hasOwnProperty('ontouchend')在Android上会得到错误的结果
	 * @type {boolean}
	 */
	IsTouch = 'ontouchend' in WIN,

	/** @type {string} */
	NA = WIN.navigator,

	/** @type {string} */
	UA = NA.userAgent,

	/** @type {boolean} */
	IsAndroid = (/Android|HTC/i.test(UA) || /Linux/i.test(NA.platform + '')), /* HTC Flyer平板的UA字符串中不包含Android关键词 */

	/** @type {boolean} */
	IsIPad = !IsAndroid && /iPad/i.test(UA),

	/** @type {boolean} */
	IsIPhone = !IsAndroid && /iPod|iPhone/i.test(UA),

	/** @type {boolean} */
	IsIOS =  IsIPad || IsIPhone,

	/** @type {boolean} */
	IsWindowsPhone =  /Windows Phone/i.test(UA),

	/** @type {boolean} */
	IsBlackBerry =  /BB10|BlackBerry/i.test(UA),

	/** @type {boolean} */
	IsIEMobile =  /IEMobile/i.test(UA),

	/** @type {boolean} */
	IsIE = !!DOC.all,

	/** @type {boolean} */
	IsWeixin = /MicroMessenger/i.test(UA),

	/**
	 * 设备屏幕象素密度
	 * @type {number}
	 */
	PixelRatio = parseFloat(WIN.devicePixelRatio) || 1,

	/* 如果手指在屏幕上按下后再继续移动的偏移超过这个值，则取消touchend中click事件的触发，Android和iOS下的值不同 */
	MAX_TOUCHMOVE_DISTANCE_FOR_CLICK = IsAndroid ? 10 : 6,

	/**  @type {string} */
	START_EVENT = IsTouch ? 'touchstart' : 'mousedown',

	/**  @type {string} */
	MOVE_EVENT = IsTouch ? 'touchmove' : 'mousemove',

	/**  @type {string} */
	END_EVENT = IsTouch ? 'touchend' : 'mouseup',

	/**  @type {number} */
	ScreenSizeCorrect = 1,

	_hasGetElementsByClassName = DOC.getElementsByClassName,
	_kSelectorTest = [',', '+', '~', '[', '>', '#', '.', ' '],
	_kSelectorTestLength = _kSelectorTest.length,
	_array = [],
	_concat = _array.concat,
	_slice = _array.slice,
	_obj = {},
	_toString = _obj.toString,
	_hasOwnProperty = _obj.hasOwnProperty;

try {
	_concat.apply([], DOC.getElementsByTagName('a'));
} catch(e) {
	_concat = {
		apply: function(array1, array2) {
			var element,
				i = 0;

			while (element = array2[i++]) {
				array1.push(element);
			}

			return array1;
		}
	};
}

/**
 * 如果浏览器不支持String原生trim的方法，模拟一个
 */
if (!String.prototype.hasOwnProperty('trim')) {
	/**
	 * @this {String|string}
	 * @return {string}
	 * @suppress {duplicate}
	 */
	String.prototype.trim = function() {
		return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
	}
}

/**
 * 如果浏览器不支持Array原生indexOf的方法，模拟一个
 */
if (!Array.prototype.hasOwnProperty('indexOf')) {
	/**
	 * @this {Array}
	 * @param {*} element
	 * @return {number}
	 * @suppress {duplicate}
	 */
	Array.prototype.indexOf = function(element) {
		var i = 0, l = this.length;

		for (; i < l; i++) {
			if (this[i] === element) {
				return i;
			}
		}
		return -1;
	}
}

/**
 * 如果浏览器不支持Function原生bind的方法，模拟一个
 */
if (!Function.prototype.hasOwnProperty('bind')) {
	/**
	 * @param {Object} context
	 * @return {!Function}
	 * @suppress {duplicate}
	 */
	Function.prototype.bind = function(context) {
		var fn = this,
			args = arguments.length > 1 ? _slice.call(arguments, 1) : [];
		return function() {
			return fn.apply(context || this, args);
		};
	}
}

if (ENABLE_IE_SUPPORT && IsIE) {
	/* 防止IE6下对象的背景图在hover的时候闪动 */
	try {
		DOC.execCommand('BackgroundImageCache', false, true);
	} catch(e) {}
}

/* Android下window.screen的尺寸可能是物理尺寸，和窗口尺寸不同，用ScreenSizeCorrect转化一下 */
if (IsAndroid) {
	if ((WIN['screen']['width'] / WIN['innerWidth']).toFixed(2) == PixelRatio.toFixed(2)) {
		ScreenSizeCorrect = 1 / PixelRatio;
	}
}

/**
 * @constructor
 * @param {(Element|$|string)=} selector
 * @param {(Element|$|string)=} context (可选)
 * @return {$}
*/
var $ = function(selector, context) {
	if (!(this instanceof $)) {
		return new $(selector, context);
	}

	this.context = [];
	if (!selector) {
		this.length = 0;
	} else

	//单个DOM对象
	if (selector.nodeType || selector === WIN) {
		this.context = [selector];
		this.length = 1;
	} else

	//字符串选择符
	if ('string' === typeof selector) {
		var selectorLength = selector.length;

		//HTML片段
		if ('<' === selector.charAt(0) && selectorLength > 2 && '>' === selector.charAt(selectorLength - 1)) {
			selector = selector.replace(/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
				'<$1></$2>');
			var containter = DOC.createElement('div');
			containter.innerHTML = selector;
			for (var i = 0, l = containter.childNodes.length; i < l; i++) {
				this.context.push(containter.removeChild(containter.childNodes[0]));
			}
			containter = null;
		} else {
			//CSS选择符
			if ('string' === typeof context) {
				selector = context + ' ' + selector;
				context = null;

			} else if (context instanceof $) {
				context = context.context;

			} else {
				context = context ? [context] : null;
			}

			var result = [];

			if (context) {
				var length = context.length,
					i = 0;

				for (; i < length; i++) {
					result = _concat.apply(result, $.selectorAll(selector, context[i]));
				}
			} else {
				result = $.selectorAll(selector);
			}

			this.context = result;
		}
		this.length = this.context.length;
	} else

	//初始化过的对象直接返回，例如$($('div'))
	if (selector instanceof $) {
		return selector;
	} else

	if (selector.length) { //数组或者类数组
		this.context = _concat.apply([], selector);
		this.length = this.context.length;
	}

	return this;
};

/**
 * 唯一ID，用作缓存对象的Key
 * @type {number}
 */
$.uid = 1;

/**
 * 返回指定选择符的DOM集合
 * @param {string} selector CSS选择符
 * @param {Element=} context (可选)
 * @return {{length: number}} 类似Array的DOM集合(只有length属性)
 */
$.selectorAll = function(selector, context) {
	context = context || DOC;

	var _s = selector.slice(1),
		els,
		singleSelector = true,
		l = _kSelectorTestLength;

	/* 判断是否是简单选择符 */
	while (l--) {
		if (_s.indexOf(_kSelectorTest[l]) != -1) {
			singleSelector = false;
			break;
		}
	}

	/*	如果是简单选择符则使用更高效的DOM方法返回对象 */
	if (singleSelector) {
		if ('#' == selector.charAt(0)) {
			if (els = DOC.getElementById(_s)) {
				return [els];
			}
			return [];
		} else if ('.' == selector.charAt(0)) {
			if (_hasGetElementsByClassName) {
				return context.getElementsByClassName(_s);
			}
		} else {
			return context.getElementsByTagName(selector);
		}
	}

	return $.find(selector, context);
};

/**
 * 选择符的唯一ID
 * @type {number}
 * @private
 */
$._contextId = 1;

var _useQSA = (DOC.querySelectorAll && !IsIE) || !ENABLE_IE_SUPPORT;

$._find = _useQSA ?

	function(selector, context) {
		return context.querySelectorAll(selector);
	} :

	function(selector, context) {
		return Sizzle(selector, context);
	};

/**
 * 使用CSS3选择符查找对应的DOM集合，在旧浏览器下使用Sizzle引擎
 * @param {string} selector CSS选择符
 * @param {Element=} context (可选)
 * @return {{length: number}} 返回一个类数组的DOM集合，包含length属性
 * @private
 */

$.find = _useQSA ?

	function(selector, context) {
		if (DOC !== context) {
			// context.querySelectorAll(selector)在用选择符查找对象的时候范围不是context，而是整个document，所以给context加个唯一的id来限定范围
			var id = context.id || (context.id = '__rid' + $._contextId++),
				selectors = selector.split(','),
				i = selectors.length;

			while (i--) {
				selectors[i] = '#' + id + ' ' + selectors[i];
			}
			selector = selectors.join(',');
		}

		return $._find(selector, DOC);
	} :

	$._find;

/**
 * 判断一个对象是否是Object结构
 * @param {*} obj
 * @return {boolean}
 */
$.isPlainObject = function(obj) {
	var result =
		('[object Object]' === _toString.call(obj)) &&
		obj && // exclude undefined && null (IE < 9)
		(obj.constructor ? _hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf') : false) &&

		// IE 8
		!obj.nodeType &&
		!obj.window;

	return result;
};

/**
 * 简单判断一个对象是否是Object结构
 * @param {*} obj
 * @return {boolean}
 */
$.isObject = function(obj) {
	return ('[object Object]' === _toString.call(obj)) && !!obj; // exclude undefined && null (IE < 9)
};

/**
 * 判断一个对象是否是window对象
 * @param {*} element
 * @return {boolean}
 */
$.isWindow = function(element) {
	return element == element['window'];
};

/**
 * 迭代一个数组或者Object对象，对其中的每个子元素执行一个方法
 * @param {(Array|Object)} collection
 * @param {function(number=, Element=)} fn
 */
$.each = function(collection, fn) {
	if (collection instanceof Array) {
		for (var i = 0, l = collection.length; i < l; i++) {
			var element = collection[i];
			if (false === fn.call(element, i, element)) {
				break;
			}
		}
	} else {
		for (var i in collection) {
			var element = collection[i];
			if (false === fn.call(element, i, element)) {
				break;
			}
		}
	}
};

/**
 * 扩展一个Object对象，也可以用来复制一个对象
 * @param {Object} dest
 * @param {Object} source
 * @return {Object}
 */
$.extend = function(dest, source) {
	var property, item;
	for (var property in source) {
		item = source[property];
		dest[property] = $.isObject(item) ? $.extend({}, item) : $.copy(item);
	}
	return dest;
};
$.prototype.extend = $.extend;

/**
 * 深复制一个数组或者对象
 * @param {(Array|Object)} dest
 * @return {(Array|Object)}
 */
$.copy = function(dest) {
	if (dest instanceof Array) {
		var result = [];
		for (var i = 0, l = dest.length; i < l; i++) {
			result[i] = $.copy(dest[i]);
		}
		return result;
	} else if ($.isObject(dest)) {
		return $.extend({}, dest);
	}
	return dest;
};
$.prototype.copy = $.copy;

/**
 * 将连字符字符串转化为驼峰形式
 * @param {string} string
 * @return {string}
 */
$.camelCase = function(string){
	return string.replace(/-+(.)?/g, function(match, chr){
		return chr ? chr.toUpperCase() : '';
	});
};

/**
 * 改变一个函数的this指针。这个方法只是为了兼容jQuery，请尽量使用function的bind方法
 * @param {Function} fn
 * @param {Object} context
 * @return {!Function}
 */
$.proxy = function(fn, context){
	return fn.bind(context);
};

/**
 * @param {Array} elements
 * @param {Function} fn
 * @param {*} args
 * @return {Array}
 */
$.map = function(elements, fn, args) {
	var value,
		i = 0,
		j = elements.length,
		result = [];

	if (('string' !== typeof elements) && !isNaN(elements.length)) {
		for (; i < j; i++) {
			value = fn(elements[i], i, args);

			if (value != null) {
				result.push(value);
			}
		}

	} else {
		for (i in elements) {
			value = fn(elements[i], i, args);

			if (value != null) {
				result.push(value);
			}
		}
	}

	return result;
};

