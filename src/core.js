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

/**
 * 如果浏览器不支持Function原生bind的方法，模拟一个
 */
if (!Function.prototype.hasOwnProperty('bind')) {
	/**
	 * @return {function}
	 */
	Function.prototype.bind = function(context) {
		var fn = this,
			args = arguments.length > 1 ? Array.slice(arguments, 1) : null;
		return function() {
			return fn.apply(context || this, args);
		};
	}
}

/* 保存常用DOM的全局变量（变量名可以被压缩） */
var 
	 /**  @type {Document} */ 
	DOC = document,

	/**  @type {Window} */
	WIN = window,

	/* 
	 * 设备是否支持触摸事件
	 * 这里使用WIN.hasOwnProperty('ontouchstart')在Android上会得到错误的结果
	 * @type {boolean}
	 */
	IsTouch = 'ontouchstart' in WIN,

	/**  @type {string} */
	UA = WIN.navigator.userAgent,

	IsAndroid = (/Android|HTC/i.test(UA) || !!(WIN.navigator['platform'] + '').match(/Linux/i)), /* HTC Flyer平板的UA字符串中不包含Android关键词 */
	IsIPad = !IsAndroid && /iPad/i.test(UA),
	IsIPhone = !IsAndroid && /iPod|iPhone/i.test(UA),
	IsIOS =  IsIPad || IsIPhone,
	IsWindowsPhone =  /Windows Phone/i.test(UA),
	IsBlackBerry =  /BB10|BlackBerry/i.test(UA),
	IsIEMobile =  /IEMobile/i.test(UA),
	IsIE = !!DOC.all,
	IsWeixin = /MicroMessenger/i.test(UA),

	/*
	 * 设备屏幕象素密度
	 * @type {number}
	 */
	PixelRatio = parseFloat(WIN.devicePixelRatio) || 1,

	/* 如果手指在屏幕上按下后再继续移动的偏移超过这个值，则取消touchend中click事件的触发，Android和iOS下的值不同 */
	MAX_TOUCHMOVE_DISTANCE_FOR_CLICK = IsAndroid ? 10 : 6,

	START_EVENT = IsTouch ? 'touchstart' : 'mousedown',
	MOVE_EVENT = IsTouch ? 'touchmove' : 'mousemove',
	END_EVENT = IsTouch ? 'touchend' : 'mouseup',

	ScreenSizeCorrect = 1,
	
	_hasGetElementsByClassName = DOC.getElementsByClassName,
	_fnConcat = [].concat,
	_kSelectorTest = [',', '+', '~', '[', '>', '#', '.', ' '],
	_kSelectorTestLength = _kSelectorTest.length;

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
	
var RR = {

	/* 
	 * 唯一ID，用作缓存对象的Key
	 * @type {number}
	 */
	uid: 1,

	/**
	 * 返回RR对象($对象)
	 * @function
	 * @param {(Element|RR.dom|string)=} selector
	 * @param {(Element|RR.dom)=} context (可选)
	 * @return {(RR.dom|RR.fn)} RR.fn对象或者RR.dom对象，RR.fn对象使用$.method()调用，RR.dom对象使用$(selector).method()调用
	 */
	$: function(selector, context) {
		if (arguments.length < 1) {
			return RR._fnCache || new RR.fn();
		}
		return new RR.dom(selector, context);
	},

	/**
	 * @constructor
	 * @return {RR.fn}
	*/
	fn: function() {
		RR._fnCache = this;
		return this;
	},

	/**
	 * (new RR.fn())的缓存
	 * @type {?RR.fn}
	 * @private
	 */
	_fnCache: null,

	/**
	 * 返回指定选择符的DOM集合
	 * @function
	 * @param {string} selector CSS选择符
	 * @param {Element=} context (可选)
	 * @return {{length: number}} 类似Array的DOM集合(只有length属性)
	 */
	selectorAll: DOC.querySelectorAll ? function(selector, context) {
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
			} else if (_hasGetElementsByClassName && '.' == selector.charAt(0)) {
				return context.getElementsByClassName(_s);	
			} else {
				return context.getElementsByTagName(selector);
			}
		}

		return context.querySelectorAll(selector);

	} : function(selector, context) {
		/* TODO */
		return [];
	},
	
	/**
	 * @constructor
	 * @param {(Element|RR.dom|string)=} selector
	 * @param {(Element|RR.dom)=} context (可选)
	 * @return {RR.dom}
	*/
	dom: function(selector, context) {
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
					this.context.push(containter.childNodes[i]);
				}
			} else {
				//CSS选择符
				if (context instanceof RR.dom) {
					context = context.context[0];
					if (!context) {
						this.context = [];
						this.length = 0;
						return this;
					}
				}
				this.context = RR.selectorAll(selector, context);
			}
			this.length = this.context.length;
		} else 

		//初始化过的对象直接返回，例如$($('div'))
		if (selector instanceof RR.dom) {
			return selector;
		} else

		if (selector.length) { //数组或者类数组
			this.context = _fnConcat.apply([], selector);
			/*this.context = function(selector) {
				for (var elements = [], i = 0, l = selector.length; i < l; i++) {
					elements.push(selector[i]);
				}
				return elements;
			}(selector);*/
			this.length = this.context.length;
		}

		return this;
	}
};

RR.dom.prototype = {

	/**
	 * @function
	 * @param {function(Element=, number=)} fn
	 */
	each: function(fn) {
		for (var i = 0, l = this.length, element; i < l; i++) {
			element = this.context[i];
			fn.call(this, element, i);
		}
		return this;
	}
};

RR.fn.prototype = {

	/**
	 * 扩展一个Object对象，也可以用来复制一个对象
	 * @function
	 * @param {Object} dest
	 * @param {Object} source
	 */
	extend: function(dest, source) {
		var property, item;
		for (var property in source) {
			item = source[property];
			if (item !== null) {
				dest[property] = (typeof(item) == 'object' && !(item.nodeType) && !(item instanceof Array)) ? RR.fn.prototype.extend({}, item) : item;
			}
		}
		return dest;
	},


	/**
	 * 深复制一个数组或者对象
	 * @function
	 * @param {(Array|Object)} dest
	 */
	copy: function(dest) {
		if (dest instanceof Array) {
			var result = [];
			for (var i = 0, l = dest.length; i < l; i++) {
				result[i] = RR.fn.prototype.copy(dest[i]);
			}
			return result;
		} else if (typeof(dest) == 'object') {
			return RR.fn.prototype.extend({}, dest);
		}
		return dest;
	}
};

//$对象
var $ = RR.$;
