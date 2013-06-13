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

/* 保存常用DOM的全局变量（变量名可以被压缩） */
var DOC = document,
	WIN = window,

	/* 
	 * 设备是否支持触摸事件
	 * 这里使用WIN.hasOwnProperty('ontouchstart')在Android上会得到错误的结果
	 */
	IsTouch = 'ontouchstart' in WIN,

	UA = WIN.navigator.userAgent,

	IsAndroid = /Android|HTC/i.test(UA), /* HTC Flyer平板的UA字符串中不包含Android关键词 */
	IsIPad = !IsAndroid && /iPad/i.test(UA),
	IsIPhone = !IsAndroid && /iPod|iPhone/i.test(UA),
	IsIOS =  IsIPad || IsIPhone,
	IsIEMobile =  /IEMobile/i.test(UA),
	IsIE = !!DOC.all,

	/* 设备屏幕象素密度 */
	PixelRatio = parseFloat(WIN.devicePixelRatio) || 1,

	/* 如果手指在屏幕上按下后再继续移动的偏移超过这个值，则取消touchend中click事件的触发，Android和iOS下的值不同 */
	MAX_TOUCHMOVE_DISTANCE_FOR_CLICK = IsAndroid ? 10 : 6,

	START_EVENT = IsTouch ? 'touchstart' : 'mousedown',
	MOVE_EVENT = IsTouch ? 'touchmove' : 'mousemove',
	END_EVENT = IsTouch ? 'touchend' : 'mouseup',

	_hasGetElementsByClassName = DOC.getElementsByClassName,

	ScreenSizeCorrect = 1;
;

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
	 */
	uid: 1,

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

		var _s = selector.slice(1), 
			els,
			singleSelector = true,
			_a = ['+', '~', '[', '>', '#', '.', ' '],
			l = _a.length;
		
		/* 判断是否是简单选择符 */
		while (l--) {
			if (_s.indexOf(_a[l]) != -1) {
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
	 * @param {*} selector
	 * @param {Object=} context (可选)
	 * @return {RR.fn} RR.fn对象
	*/
	fn: function(selector, context) {
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
				if (context instanceof RR.fn) {
					context = context.context[0];
				}
				this.context = RR.selectorAll(selector, context);
			}
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
