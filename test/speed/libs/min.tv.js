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
	 * @return {Function}
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
var DOC = document,
	WIN = window,

	/* 
	 * 设备是否支持触摸事件
	 * 这里使用WIN.hasOwnProperty('ontouchstart')在Android上会得到错误的结果
	 */
	IsTouch = 'ontouchstart' in WIN,

	UA = WIN.navigator.userAgent,

	IsAndroid = (/Android|HTC/i.test(UA) || !!(WIN.navigator['platform'] + '').match(/Linux/i)), /* HTC Flyer平板的UA字符串中不包含Android关键词 */
	IsIPad = !IsAndroid && /iPad/i.test(UA),
	IsIPhone = !IsAndroid && /iPod|iPhone/i.test(UA),
	IsIOS =  IsIPad || IsIPhone,
	IsWindowsPhone =  /Windows Phone/i.test(UA),
	IsBlackBerry =  /BB10|BlackBerry/i.test(UA),
	IsIEMobile =  /IEMobile/i.test(UA),
	IsIE = !!DOC.all,
	IsWeixin = !!(WIN['WeixinJSBridge'] || /MicroMessenger/i.test(UA)),

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
	 * @return {(RR.fn|RR.dom)} RR.fn对象或者RR.dom对象，RR.fn对象使用$.method()调用，RR.dom对象使用$(selector).method()调用
	 */
	$: function(selector, context) {
		if (arguments.length < 1) {
			return RR.fnCache || new RR.fn();
		}
		return new RR.dom(selector, context);
	},

	fn: function() {
		RR.fnCache = this;
		return this;
	},

	fnCache: null,

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
	 * @return {RR.dom} RR.dom对象
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
			//this.context = [].concat.apply([], selector);
			this.context = function(selector) {
				for (var elements = [], i = 0, l = selector.length; i < l; i++) {
					elements.push(selector[i]);
				}
				return elements;
			}(selector);
			this.length = this.context.length;
		}

		return this;
	}
};

RR.dom.prototype = {
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
/**
 * JSON对象
 * 如果浏览器支持原生的JSON对象，会直接使用原生对象的方法，否则使用自定义实现的方法。
 * @class JSON
 * @static
 */

var JSON = WIN.JSON || {
	
	$specialChars: {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\'},
	
	$replaceChars: function(chr){
		return JSON.$specialChars[chr] || '\\u00' + Math.floor(chr.charCodeAt() / 16).toString(16) + (chr.charCodeAt() % 16).toString(16);
	},
	
	/**
	 * 把一个标准JSON对象序列化成一个字符串
	 * @static
	 * @param {Object} obj JSON对象
	 * @return {String} 序列化成后的字符串
	 */
	stringify: function(obj) {
		if (obj instanceof Array) {
			type = 'array';
		} else {
			type = typeof obj;
		}
		switch (type){
			case 'string':
				return '"' + obj.replace(/[\x00-\x1f\\"]/g, JSON.$replaceChars) + '"';
			case 'array':
				var string = [];
				for (var i = 0, l = obj.length; i < l; i++) {
					string.push(JSON.stringify(obj[i]));
				}
				return '[' + string.join(',') + ']';
			case 'object': case 'hash':
				var string = [], key, value;
				for (key in obj) {
					value = obj[key];
					var json = JSON.stringify(value);
					if (json) string.push(JSON.stringify(key) + ':' + json);
				};
				return '{' + string.join(',') + '}';
			case 'number': case 'boolean': return String(obj);
			case false: return 'null';
		}
		return null;
	},
	
	/**
	 * 把一个JSON字符串转换为标准JSON对象
	 * @static
	 * @param {String} string JSON字符串
	 * @return {String} 标准JSON对象
	 */
	parse: function(string){
		return eval('(' + string + ')');
	}
};
/**
 * 对本地存贮对象的操作封装
 * @static
 * @class Storage
 */

var Storage = function(key, value) {
	var storage = Storage.getStorage();
	if (storage) {
		if ('undefined' === typeof value) {
			value = storage.getItem(key);
			return value && JSON.parse(value);
		} else {
			storage.setItem(key, JSON.stringify(value));
		}
	}
};

Storage.getStorage = function() {
	var _localStorage;
	try{
		/* 在Android 4.0下，如果webview没有打开localStorage支持，在读取localStorage对象的时候会导致js运行出错，所以要放在try{}catch{}中 */
		_localStorage = WIN['localStorage'];
	} catch(e){
		if (ENABLE_DEBUG) {
			alert('localStorage is not supported');
		}
	}
	Storage.getStorage = function() {
		return WIN['localStorage'];
	}
	return _localStorage;	
};
	
/**
 * 清除本地存贮数据
 * @param {String} prefix 可选，如果包含此参数，则只删除包含此前缀的项，否则清除全部缓存
 */
Storage.clear = function(prefix) {
	var storage = Storage.getStorage();
	if (storage) {
		if (prefix) {
			for (var key in storage) {
				if (0 === key.indexOf(prefix)) {
					storage.removeItem(key);
				}
			}
		} else {
			storage.clear();
		}
	}
};
/**
 * 通知对象，实现通知的注册和根据通知触发对应的函数，一个通知可以注册多个函数，在通知被触发的时候，所有被注册给这个通知的函数会被执行
 * 如果触发一个没有注册函数的通知名，则什么都不会执行
 * 注意：如果一个函数在注册给通知后发生了改变，那么在触发通知的时候执行的函数还是没有改变前的函数
 * 用例：
 * <code lang=\"javascript\">
 * var funA = function(a, b) {...};
 * var funB = function(a, b) {...};
 * 
 * //可以在不同的地方给一个通知名分别注册多个函数
 * Notification.reg('a notice name', funA);
 * Notification.reg('a notice name', funB);
 * 
 * //在适当的时候触发这个通知，会依次执行funA和funB
 * Notification.fire('a notice name', ['value of a', 'value of b'], thisArg);
 * </code>
 * @class Notification
 */
var Notification = {
	
	/**
	 * 把一个函数注册给一个通知名，在使用Notification.fire()触发此通知的时候该函数会被执行
	 * @param {String} notificationName 通知名
	 * @param {Function} fn 注册给通知名的函数
	 */
	reg: function(notificationName, fn) {
		if (Notification._notificationData.hasOwnProperty(notificationName)) {
			Notification._notificationData[notificationName].push(fn);
		} else {
			Notification._notificationData[notificationName] = [fn];
		}
	},
	
	/**
	 * 触发一个通知，这个函数会遍历执行注册给这个通知名的函数
	 * @param {String} notificationName 通知名
	 * @param {Array | Obj} argArray 可选，要传递给函数的参数列表
	 * @param {Obj} thisArg 可选，函数的this指针，默认为window对象
	 */
	fire: function(notificationName, argArray, thisArg) {
		thisArg = thisArg || WIN;
		
		/* 传入的argArray可以为单个对象，这个时候把单个对象包裹在数组中 */
		if (argArray && !(argArray instanceof Array)) {
			argArray = [argArray];
		}
		var fnList = Notification._notificationData[notificationName] || [],
			i, l = fnList.length;
			
		/* 遍历执行注册给这个通知名的函数 */
		for (i = 0; i < l; i++) {
			fnList[i].apply(thisArg, argArray);
		}
	},
	
	/**
	 * 使用{通知名: [函数列表,...]}方式保存的通知名和函数的对应关系
	 * @private
	 */
	_notificationData: {}

};
/**
 * 包含URL相关的方法
 * @class URL
 */

var URL = {

	/**
	 * 根据传入的query字符串返回键值对形式的对象
	 * @param {String} queryString query字符串
	 * @return {KeyValueObject}
	 */
	getQueryData: function(queryString) {
		
		/* 去掉字符串前面的\"?\"，并把&amp;转换为& */
		queryString = queryString.replace(/^\?+/, '').replace(/&amp;/, '&');
		var querys = queryString.split('&'),
			i = querys.length,
			_URLParms = {},
			item;
		
		while (i--) {
			item = querys[i].split('=');
			if (item[0]) {
				var value = item[1] || '';
				try {
					value = decodeURIComponent(value);
				} catch(e) {
					value = unescape(value);
				}
				_URLParms[decodeURIComponent(item[0])] =  value;
			}
		}
		return _URLParms;
	},

	/**
	 * 获取当前页面或者指定DOM对象的URL中的指定的GET参数的值
	 * @param {String} key 要获取的GET参数的键
	 * @param {DOM} el 如此传递此参数，则获取这个DOM对象的url，如果不传则获取当前页面的url
	 * @return {String|null}
	 */
	getQueryString: function(key, el) {
		var parms,
			queryString = el ? URL.getElSearchString(el) : WIN.location.search.substring(1);

		parms = URL.getQueryData(queryString);
		return (key in parms) ? parms[key] : null;
	},

	/**
	 * 获取指定DOM对象的链接地址的queryString
	 * @param {DOM} el 要获取参数的DOM对象
	 * @return {String}
	 */
	getElSearchString: function(el) {
		/* 在某些Android下获取不到el.search的值，要使用自定义方法从url中截取 */
		var el = $(el).get(0),
			searchString = el.search || '';
		if (!searchString) {
			var hrefString = ('FORM' == el.nodeName ? el.getAttribute('action') : el.getAttribute('href')),
				pos = hrefString.indexOf('?');	
			if (-1 !== pos) {
				searchString = hrefString.slice(pos);
			}
		}
		return searchString;
	},

	/**
	 * 设置指定DOM对象或者页面的URL中的指定的GET参数的值
	 * @param {DOM} el 设置这个DOM对象的url
	 * @param {Object} data 要设置的GET参数，以键值对的方式提供
	 */
	setQueryString: function(el, data) {
		var el = $(el),
			elTag = el.get(0),
			elSearch = elTag.search,
			_searchString = elSearch || '',
			_key,
			_value;
		/* 非<A>对象没有search属性 */
		if (!elSearch) {
			var hrefString,
				nodeName = elTag.nodeName;
			if ('FORM' == nodeName) {
				if ('post' == elTag['method'].toLowerCase()) {
					hrefString = el.attr('action') || (location + ''); /* 如果action为空则取当前页面的url */
				} else {
					/* 如果使用GET方式提交的表单，要把GET参数以HIDDEN表单字段的方式附加到表单中去 */
					for (_key in data) {
						_value = data[_key];
						var inputEl = $('input[name="' + _key + '"]', el);
						if  (inputEl) {
							inputEl.val(_value);
						} else {
							el.append($('<input type="hidden" name="' +  _key + '" value="' +  _value + '" />'));
						}
					}
					return;
				}
			} else {
				hrefString = el.attr('href') || (location + ''); /* 如果href为空则取当前页面的url */
			}
			var startPos = hrefString.indexOf('?'),
			endPos = hrefString.indexOf('#');
			if (-1 == endPos) endPos = hrefString.length;
			if (startPos < 0 || startPos > endPos) {
				_searchString = '';
				startPos = endPos; /* 用于下面设置searchString */
			} else {
				_searchString = hrefString.slice(startPos + 1, endPos);
			}
		}
		
		var URLParms = URL.getQueryData(_searchString), /* 获取对象原有的GET参数 */
			_result = [];

		/* 把新参数和对象原有的GET参数合并 */
		for (_key in data) {
			URLParms[_key] = data[_key];
		}
		
		for (_key in URLParms) {
			_value = URLParms[_key];
			_result.push(_key + (_value ? ('=' + encodeURIComponent(_value)) : ''));
		}
		if (_result.length < 1) return;
		
		var newSearchString = '?' + _result.join('&');
	
		if (elSearch) {
			elTag.search = newSearchString;
		} else {
			var attri = ('FORM' == nodeName) ? 'action' : 'href';
			el.attr(attri, hrefString.slice(0, startPos) + newSearchString + hrefString.slice(endPos));
		}
	},

	/**
	 * 参数对象转为查询字符串片段
	 */
	objToQueryString: function(obj) {
		var result = [], key, value, i;
		for (key in obj) {
			value = obj[key];
			if (value instanceof Array) {
				for (i = value.length; i--;) {
					result.push(key + '[]=' + encodeURIComponent(value[i]));
				}
			} else {
				result.push(key + '=' + encodeURIComponent('undefined' === typeof value ? '' : value));
			}
		}
		return result.join('&');
	}
};

RR.fn.prototype.param = function(obj) {
	return URL.objToQueryString(obj);
}

RR.fn.prototype.getUrlParam = function(key, el) {
	return URL.getQueryString(key, el);
}
/**
 * Cookie操作，可以检测浏览器是否支持cookie；设置、获取、删除cookie
 * @class Cookie
 * @static
 * @author qianghu
 */

var Cookie = {

	/**
	 * 是否支持Cookie
	 */
	isEnabled: false,
	
	/**
	 * 设置Cookie
	 * @static
	 * @param {String} name 要设置的Cookie名称
	 * @param {String} value 要设置的Cookie值
	 * @param {Int} expire 过期时间，单位是小时
	 * @param {String} domain 域，默认为本域
	 */
	set: function(name, value, expire, domain) {
		var expires = '';
		if (0 !== expire) {
			var t = new Date();
			t.setTime(t.getTime() + (expire || 24) * 3600000);
			expires = ';expires=' + t.toGMTString();
		}
		var s = escape(name) + '=' + escape(value) + expires + ';path=/' + (domain ? (';domain=' + domain) : '');
		DOC.cookie = s;
	},
	
	/**
	 * 读取指定的Cookie
	 * @static
	 * @param {String} name 要获取的Cookie名称
	 * @return {String} 对应的Cookie值，如果不存在，返回{null}
	 */
	get: function(name) {
		var arrCookie = DOC.cookie.split(';'), arrS;
		for (var i = 0; i < arrCookie.length; i++) {
			arrS = arrCookie[i].split('=');
			if (arrS[0].trim() == name) {
				return unescape(arrS[1]);
			}
		}
		return null;
	},
	
	/**
	 * 删除指定的Cookie
	 * @static
	 * @param {String} name 要删除的Cookie名称
	 */
	remove: function(name) {
		Cookie.set(name, '', -1000);
	},
	
	/**
	 * 测试浏览器是否支持Cookie，
	 * 如果浏览器支持Cookie，Cookie.isEnabled的值为TRUE，不支持Cookie.isEnabled的值为FALSE
	 * @static
	 * @private
	 */
	test: function() {
		var testKey = '_c_t_';
		Cookie.set(testKey, '1');
		Cookie.isEnabled = ('1' === Cookie.get(testKey));
		Cookie.remove(testKey);
	}
};
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

RR.dom.prototype.offset = function() {
	var element = this.context[0];
	if (element) {
		var fn = element['getBoundingClientRect'],
			offset = fn && fn(),
			Body = DOC.body;
		if (offset) {
			return {
				left: offset['left'] + (WIN.pageXOffset || Body.scrollTop || 0),
				top: offset['top'] + (WIN.pageYOffset  || Body.scrollLeft || 0)
			}
		}
	}
	return {
		left: 0,
		top: 0
	};
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

	timer: null,

	ieTimer: function() {
		if (IsIE && 'interactive' == DOC.readyState) {
			if (RR.loader.timer) {
				clearTimeout(RR.loader.timer);
			}
			RR.loader.timer = setTimeout(RR.loader.ieTimer, 10);
		} else {
			RR.loader.init();
			RR.loader.isInited = true;
		}
	},
	
	/**
	 * 初始化函数
	 * 因为页面中引用的Javascript文件是异步加载的，因此加载完Javascript文件后需要判断HTML页面是否加载完全:
	 * 1. 如果document.readyState的值不为\"loading\", 则马上执行初始化函数
	 * 2. 如果document.readyState的值为\"loading\", 则把初始化函数放入DOMContentLoaded中执行
	 */
	init: function() {

		if (false === RR.loader.isInited) {

			var readyState = DOC.readyState;

			//页面载入完成后的对$().ready()的调用直接执行
			if ('loading|uninitialized'.indexOf(readyState) < 0) {

				/* 在JS异步模式下，
				 * IE浏览器在document.readyState等于interactive的时候文档尚未解析完成（其它浏览器没有问题），
				 * 加个定时器检查document.readyState
				 */
				if (IsIE && ('interactive' == readyState)) {
					RR.loader.ieTimer();
					return;
				} else { 
					RR.loader.loaded();
				}
			} else {
				/* 在第一次调用$.ready()的时候才进行初始化 */
				RR.loader.isInited = true;
				if (DOC.addEventListener) {
					DOC.addEventListener('DOMContentLoaded', RR.loader.loaded);
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
							RR.loader.loaded();
						}
					};
				}
			}
		}
	},

	loaded: function() {
		if (false === RR.loader.isLoaded) {
			RR.loader.isLoaded = true;
			RR.loader.fire();
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
		RR.loader.callbacks = [];
	}
	
};
/**
 * 获取DOM对象的绝对偏移
 * @return {Object} 包含left和top值
 */

RR.dom.prototype.offset =  function() {
	var element = this.context[0],
		offset = {
			left:0,
			top:0
		};

	if (element) {
		do {
			offset.left += element.offsetLeft || 0;
			offset.top += element.offsetTop  || 0;
			element = element.offsetParent;
		} while (element);
	}
	return offset;
};
RR.dom.prototype.html =  function() {
	var html = arguments[0];
		
	if ('undefined' !== typeof html) {
		
		/* 把html转换为字符串 */
		html += '';
		/* 简单检测是否是纯文本的内容 */
		var isText = true;
		if (html.indexOf('<') > -1 && html.indexOf('>') > -1) {
			isText = false;
		}
		return this.each(function(element) {
			if (element && ('innerHTML' in element)) {
				element.innerHTML = html;
				if (!isText) {
					Notification.fire('DOM.html', element);
				}
			}
		});
	} else {
		var element = this.context[0];
		return element && element.innerHTML;
	}
};

RR.dom.prototype.val =  function() {
	var val = arguments[0];
		
	if ('undefined' !== typeof val) {
		return this.each(function(element) {
			element.value = val;
		});
	} else {
		var element = this.context[0];
		return element && element.value;
	}
};

RR.dom.prototype.attr =  function(name, value) {
	if ('undefined' !== typeof value) {
		return this.each(function(element) {
			element.setAttribute(name, value);
		});
	} else {
		var element = this.context[0];
		return element && element.getAttribute && element.getAttribute(name);
	}
};

RR.dom.prototype.removeAttr =  function(name) {
	return this.each(function(element) {
		element.removeAttribute && element.removeAttribute(name);
	});
};

RR.dom.prototype.css =  function(key, value) {
	return this.each(function(element) {
		if ('object' !== typeof key) {
			var _key = {};
			_key[key] = value;
			key = _key;
		}
		for (var k in key) {
			var _value =  key[k];
			if (k !== 'opacity' && _value !== '' && !isNaN(_value) && _value != 0) {
				_value += 'px';
			}

			element.style[k] = _value;
		}
	});
};
RR.dom.prototype.hasClass =  function(value) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;
	for (var i = 0, j, l = this.length; i < l; i++) {
		for  (j = 0; j < len; j++) {
			if ((' ' + this.context[i].className + ' ').indexOf(' ' + classes[j] + ' ') > -1) {
				return true;
			}
		}
	};
	return false;
};

RR.dom.prototype.addClass =  function(value) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;
	return this.each(function(element) {
		var className = ' ' + (element.className || '') + ' ',
			curClass,
			i;
		for  (i = 0; i < len; i++) {
			curClass = classes[i];
			if (className.indexOf(' ' + curClass + ' ') < 0) {
				className += curClass + ' ';
			}
		}
		element.className = className.trim();
	});
};

RR.dom.prototype.removeClass =  function(value) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;
	return this.each(function(element) {
		var className = ' ' + element.className + ' ',
			oClassName = className,
			curClass,
			i;
		for  (i = 0; i < len; i++) {
			curClass = classes[i];
			if (className.indexOf(curClass) > -1) {
				className = className.replace(' ' + curClass + ' ', ' ');
			}
		}
		//在className的值发生变化的情况下才改变DOM的className属性
		if (oClassName != className) {
			element.className = className.trim();
		}
	});
};

RR.dom.prototype.toggleClass =  function(value, condition) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;
	return this.each(function(element) {
		var className = ' ' + element.className + ' ',
			curClass,
			isAdd,
			i;
		for  (i = 0; i < len; i++) {
			curClass = classes[i];

			var isAdd = className.indexOf(' ' + curClass + ' ') < 0;

			if ('undefined' === typeof condition) {
				condition = isAdd;
			}

			if (condition) {
				if (isAdd) {
					className += curClass + ' ';
				}
			} else {
				className = className.replace(' ' + curClass + ' ', ' ');
			}
		}
		element.className = className.trim();
	});
};
/**
 * 序列化一个表单对象
 * @param {boolean} returnObject 是否返回object对象，如果不传，返回一个queryString形式的字符串
 * @return {(string|object)} 返回一个queryString形式的字符串或者object对象
 */
RR.dom.prototype.serialize = function(returnObject) {

	var result = {},
		addValue = function(key, value) {
			var item = result[key];

			if ('undefined' == typeof item) {
				result[key] = value;
			} else {
				if (item instanceof Array) {
					item.push(value);
				} else {
					result[key] = [item, value];
				}
			}
		};

	this.each(function(element) {
		var elementNodeName = element.nodeName;
		if ('FORM' == elementNodeName) {
			$().extend(result, $(element.elements).serialize(true));
		} else {
			var elementName = element.name, 
				elementType,
				elementValue;

			if (elementName && /INPUT|SELECT|BUTTON|TEXTAREA/i.test(elementNodeName)) {
				elementType = (element.type + '').toUpperCase();
				elementName = elementName.replace(/\[\]$/, '');
				elementValue = element.value;

				if ('SELECT' === elementNodeName) {
					var opt, index = element.selectedIndex;
					if (index >= 0) {
						opt = element.options[index];
						addValue(elementName, opt.value);
					}
				} else if ('RADIO' === elementType || 'CHECKBOX' === elementType) {
					if (element['checked']) {
						addValue(elementName, elementValue);
					}
				} else {
					addValue(elementName, elementValue);
				}
			}		
		}
	});

	return returnObject ? result : $().param(result);
};

/**
 * 验证一个表单
 * eg. <input type=\"text\" name=\"username\" required=\"请填写此项\" length=\"5,20\" />
 *      <input type=\"password\" name=\"password\" format=\"password\" required length=\"5,20\" />
 * @return {boolean} 表单是否通过验证，如果有多个表单，只要有一个表单验证失败即返回false
 */
RR.dom.prototype.check = function() {
	var result = true;

	this.each(function(element) {

		if ('FORM' == element.nodeName) {
			var elements = element.elements,
				i = 0,
				l = elements.length,
				errorMsg;

			for (;i < l; i++) {
				var inputElement = elements[i],
					required = inputElement.getAttribute('required'),
					inputValue = inputElement.value.trim(),
					inputLabel = inputElement.getAttribute('label') || inputElement.getAttribute('placeholder') || inputElement.name;

				if ('' === inputValue) { //如果值为空则检查是否必填
					if (null !== required) {
						errorMsg = required || '请填写' + inputLabel;
						if (!IsAndroid) { /* 在Android手机中不自动聚焦文本框（三星手机文本框多次聚焦后不显示光标）*/
							inputElement.focus();
						}
						break;
					}
				} else { //值不为空则检查格式
					var lengthAttr = inputElement.getAttribute('length'); //检查长度
					if (lengthAttr) {
						var valueLength = inputValue.length,
							lengthRange = lengthAttr.split(','),
							minLength = parseInt(lengthRange[0] || 0, 10),
							maxLegnth = parseInt(lengthRange[1] || 0, 10);

						if (valueLength < minLength) {
							errorMsg = inputLabel + '的长度至少' + minLength + '个字符';
						} else if (maxLegnth && valueLength > maxLegnth) {
						    	errorMsg = inputLabel + '的长度不能超过' + maxLegnth + '个字符';
						};
					}
				}
			}

			if (errorMsg) {
				$(element).showFormTip(errorMsg, 'error');
				result = false;
			}
		}
	});

	return result;
};

/**
 * 在表单中显示一条提示
 */
RR.dom.prototype.showFormTip = function(message, className) {
	return this.each(function(element) {
		var msgEl = $('.form_tip', element);
		if (msgEl.length < 1) {
			msgEl = $('<div class="form_tip"></p>').prependTo(element);
		}
		msgEl.attr('class', 'form_tip ' + className).html(message);
	});
}
/**
 * Event
 */

 /* 
RR.eventCache = {
	'event_1': {
		'uid_1': [
			fn1: 1,
			fn2: 1,
			...
		],
		'uid_2': [
			fn1: 1,
			fn2: 1,
			...
		],

		'tA': [
			fn1: 1,
			fn2: 1,
			...
		]
		
	},
	'event_2': {
		'uid_1':[
			fn1: 1,
			fn2: 1,
			...
		],
		...
	},
	...
};
*/

/* 标记是否使用Touch事件模拟点击 */
var UseTouchClick = false;


if (!IsAndroid /* Android下使用模拟点击会导致不稳定（比如跨页面点击、视频退出全屏后跨页面后退） */ && 
	UA.indexOf('PlayStation') < 0 /* PlayStation手持设备使用模拟点击会造成在滑动页面的时候触发点击 */
) {
	UseTouchClick = true;
}

RR.event = function(e) {
	if (e instanceof RR.event) {
		return e;
	}

	var changedTouches = e.changedTouches, 
		ee = (changedTouches && changedTouches.length > 0) ? changedTouches[0] : e;

	this.event = e;
	this.originalEvent = ee;

	this.target = e.target || e.srcElement;
	this.type = e.type;
	return this;
};

RR.event.prototype = {

	isPropagationStopped: false,
	
	preventDefault: function() {
		var e = this.event;

		if (e.preventDefault) {
			e.preventDefault();
		} else {
			/* IE下阻止默认事件 */
			e.returnValue = false;
		}
	},
	
	stopPropagation: function() {
		var e = this.event;

		this.isPropagationStopped = true;

		if (e.stopPropagation) {
			e.stopPropagation();
		}
	}
};

RR.eventCache = {};

RR.eventType = {
	delegated: '|click|mouseover|mouseout|mousemove|focus|blur|touchstart|touchmove|touchend|touchcancel',
	captured: '|focus|blur|'
};

RR.addEvent = DOC.addEventListener ? function(type, element, fn, capture) {
	element.addEventListener(type, fn, capture);
} : function(type, element, fn, capture) {
	element.attachEvent('on' + type, fn);
};

RR._addEventData = function(type, uid, element, fn) {
	var eventData = RR.eventCache[type] || (RR.eventCache[type] = {}),
		elemData = eventData[uid] || (eventData[uid] = []),
		capture = (-1 !== RR.eventType.captured.indexOf(type));
			
	/* 
	 * 在第一次给某个DOM对象添加事件的时候绑定RR.dispatchEvent()方法，
	 * 后续添加的方法推入elemData数组在RR.dispatchEvent()中调用 
	 */
	if (elemData.length < 1) {

		/* 把需要委托的事件绑定在document上面 */
		if (-1 !== RR.eventType.delegated.indexOf(type)) {
			element = DOC;
		}
		RR.addEvent(type, element, RR.dispatchEvent, capture);
	}
	elemData.push(fn);
};

RR.addTagEvent = function(type, tagName, fn) {
	var uid = 't' + tagName.toUpperCase();
	RR._addEventData(type, uid, DOC, fn);
};

RR.dispatchEvent = function(e) {
	var element = this,
		e = new RR.event(e),
		type = e.type,
		elCur = e.target,
		eventData = RR.eventCache[type] || {};

	/* 
	 * 在触屏浏览器中，只执行在touchend中合成的click事件
	 * 在触屏浏览（合成的时候给event对象添加了自定义的isSimulated属性） 
	 */

	if ('click' === type && UseTouchClick && !e.originalEvent.isSimulated) {
		e.preventDefault();
		return;
	}

	while(elCur) {
		var uid = RR.dom.uid(elCur),
		elemData = eventData[uid] || [],
		result = true,
		tagEvents = eventData['t' + elCur.nodeName];

		if (tagEvents) {
			elemData = elemData.concat(tagEvents);
		}

		for (var i = 0, l = elemData.length; i < l; i++) {

			/* 把冒泡过程中当前的DOM对象保存在Event的currentTarget属性中 */
			e.currentTarget = elCur;

			/* 
			 * 执行事件方法
			 * 在方法中的this指针默认指向冒泡过程中当前的DOM对象（和currentTarget属性一样）
			 * 可以使用Function的bind方法改变this指针指向的对象
			 */
			var re = elemData[i].apply(elCur, [e]);
			
			/* 有任一方法返回false的话标记result为false */
			if (false === re) {
				result = re;
			}
		}
		
		/* 如果任一绑定给对象的方法返回false，停止默认事件并终止冒泡 */
		if (false === result) {
			e.preventDefault();
			e.stopPropagation();
		}
		if (true === e.isPropagationStopped) {
			break;
		}
		elCur = elCur.parentNode;
	}
};

RR.dom.prototype.on = function(type, fn) {
	if ('object' === typeof type) {
		for (var key in type) {
			this.on(key, type[key]);
		}
		return this;
	}
	return this.each(function(element) {
		var uid = RR.dom.uid(element);
		RR._addEventData(type, uid, element, fn);
	});
};

RR.dom.prototype.trigger = function(type, data) {
	var theEvent = DOC.createEvent('MouseEvents');
	theEvent.initEvent(type, true, true);
	theEvent.data = data;
	theEvent.isSimulated = true;

	return this.each(function(element) {
		if ('function' === typeof element[type]) {
			element[type]();
		} else {
			element.dispatchEvent && element.dispatchEvent(theEvent);
		}
	});
};

/**
 * 实现触屏的点击事件委托
 * 它做的事情：
 * 1. 去掉click事件在移动浏览器中的延迟
 * 2. 实现被点击对象的按压效果
 */
RR.touchEvent = {
	activeCls: 'active',
	hasTouchStart: false,
	initedId: '__RR_EVENT_INITED__',

	init: function() {
		if (!WIN[RR.touchEvent.initedId]) {
			var events = {
				onTouchStart: START_EVENT,
				onTouchMove: MOVE_EVENT,
				onTouchEnd: END_EVENT
			},
			type;
			
			for (type in events) {
				RR.addEvent(events[type], DOC, RR.touchEvent[type], false);
			}
			RR.addEvent('touchcancel', DOC, RR.touchEvent.onTouchCancel, false);

			if (UseTouchClick) {
				RR.addEvent('click', DOC, RR.dispatchEvent, false);
			}
			WIN[RR.touchEvent.initedId] = true;
		}
	},

	onTouchStart: function(e) {
		var e = new RR.event(e),
			event = e.originalEvent,
			elCur = e.target,
			eventData = RR.eventCache['click'] || {};

		RR.touchEvent.clearHighlight();

		RR.touchEvent.hasTouchStart = true;

		/* 保留一个target引用，在touchend中分配点击事件给这个target */
		RR.touchEvent.elTarget = elCur;

		/* 事件触发点相对于窗口的坐标 */
		RR.touchEvent.startPoint = [event.screenX * ScreenSizeCorrect, event.screenY * ScreenSizeCorrect];


		RR.touchEvent.targets = [];
		while(elCur) {
			var uid = RR.dom.uid(elCur),
				elemData = eventData[uid];

			/* 为绑定了事件或者特定DOM对象添加高亮样式 */
			if (elemData || ['A', 'INPUT', 'BUTTON'].indexOf(elCur.nodeName) > -1) {
				RR.touchEvent.targets.push(RR.$(elCur).addClass(RR.touchEvent.activeCls));
			}
			elCur = elCur.parentNode;
		}
	},

	onTouchMove: function(e) {
		var touch = RR.touchEvent;

		if (touch.hasTouchStart) {
			var e = new RR.event(e),
				event = e.originalEvent,
				movedDistance = Math.pow(Math.pow(event.screenX * ScreenSizeCorrect - touch.startPoint[0], 2) 
				                         + Math.pow(event.screenY * ScreenSizeCorrect - touch.startPoint[1], 2), .5);


			if (movedDistance > MAX_TOUCHMOVE_DISTANCE_FOR_CLICK) {
				touch.onTouchCancel();
			}
		}
	},

	onTouchEnd: function() {
		if (RR.touchEvent.hasTouchStart) {
			var theEvent = DOC.createEvent('MouseEvents'),
				target = RR.touchEvent.elTarget;

			/* 先做清除工作，再触发合成事件 */
			RR.touchEvent.onTouchCancel();

			if (UseTouchClick) {
				/* 初始化冒泡的事件 */
				theEvent.initEvent('click', true, true);

				/* 标记事件为合成的模拟事件，在RR.dispatchEvent()方法中会检测这个属性来判断是否需要触发click事件 */
				theEvent.isSimulated = true;

				/* 给目标DOM对象触发合成事件
				 * （目标DOM对象是touchstart事件的target对象，touchstart和touchend的target可能不一样，所以在touchstart里面保留了一个引用） 
				 */
				target.dispatchEvent(theEvent);
			}
		}
	},

	onTouchCancel: function() {
		RR.touchEvent.hasTouchStart = false;
		RR.touchEvent.elTarget = null;

		/* 取消DOM的高亮状态之前保留一个延时，使用户可以觉察到状态的改变 */
		setTimeout(RR.touchEvent.clearHighlight, 200);
	},

	clearHighlight: function() {
		var targets = RR.touchEvent.targets,
			activeCls = RR.touchEvent.activeCls;
		if (targets) {
			/* 移除高亮样式 */
			for (var i = 0, l = targets.length; i < l; i++) {
				targets[i].removeClass(activeCls);
			}
			RR.touchEvent.targets = null;
		}
	}
}

RR.touchEvent.init();
/**
 * Ajax类
 * @author qianghu
 *
 * 使用样例:
 * <code lang=\"javascript\">
 * $().post(url, {
 * 	data: {
		\"user_name\": \"Alex\",
		\"email\": \"alex@abc.com\"
 	},
 	done: function(data, statusCode, ajaxObj) {

 	},
 	fail: function(ajaxObj, statusText) {

 	},
 	always: function(ajaxObj, statusText) {
	
 	},
 * 	...
 * }); //写入数据并发送POST请求，如果是GET请求则使用$().get(getUrl)方法
 * </code>
 */


var blankFn = function() {};

var ajaxObj = function(url, options) {
	return this.ajax(url, options);
};

ajaxObj.prototype = {

	isLoading: false,

	ajax: function(url, settings) {
		var  options = {};

		if ('string' == typeof url) {
			options.url = url;
		} else if ('object' == typeof url) {
			settings = url;
		} else {
			url = '';
		}
		settings = settings || {};

		//Callbacks
		options.beforeSend = settings.beforeSend || blankFn;
		options.dataFilter = settings.dataFilter || blankFn;
		options.done = settings.done || settings.success || blankFn;
		options.fail = settings.fail || settings.error || blankFn;
		options.always = settings.always || settings.complete || blankFn;

		//Settings
		options.cache = !!settings.cache;
		options.dataType = (settings.dataType || 'json').toLowerCase(); // 'json' | 'html' | 'script' | 'jsonp'
		options.data = settings.data || {}; //可以为queryString形式的字符串，或者键值对的object对象
		options.timeout = settings.timeout || 0;
		options.type = (settings.type || 'GET').toUpperCase();

		this.options = options;
		return this;
	},

	get: function(url) {
		this.options.type = 'GET';
		if (url) {
			this.options.url = url;
		}
		return this.send();
	},

	post: function(url) {
		this.options.type = 'POST';
		if (url) {
			this.options.url = url;
		}
		return this.send();
	},

	abort: function() {
		if (this.isLoading) {
			this.xmlhttp && this.xmlhttp.abort();
			this.isLoading = false;
		}
		return this;
	},

	send: function() {
		var xmlhttp = this.xmlhttp || (WIN['XMLHttpRequest'] ? new XMLHttpRequest() : false);
		if (xmlhttp) {

			this.abort();

			this.xmlhttp = xmlhttp;
			this.isLoaded = false;
			var self = this,
				options = this.options,
				onload = function() {
					if (!self || true === self.isLoaded || true == self.timoutFired) {
						return;
					}
					var responseText = xmlhttp.responseText;
					self.responseText = responseText;
					xmlhttp.onreadystatechange = blankFn;
					self.isLoading = false;
					if (responseText) {
						/* 默认请求的都是json数据，在这里验证返回的内容的有效性 */
						if ('json' == options.dataType) {
							if (responseText && (responseData = self._getJSON(responseText))) {
								self.responseData = responseData;
								self._onLoad(responseData, xmlhttp.status);
							} else {
								self._onFail('parsererror');
							}
						} else {
							self._onLoad(responseText, xmlhttp.status);
						}
					} else {
						self._onFail('parsererror');
					}
					self.isLoaded = true;
					self = null;
				};

			/* 没有网络连接 */
			xmlhttp.onerror = function() {
				self.isLoading = false;
				self._onFail('offline');
			}

			xmlhttp.onload = onload;

			xmlhttp.onreadystatechange = function() {
				/* 每次网络状态变化的时候重置超时计时 */
				self._resetTimeout();
				if (4 === this.readyState && 0 !== this.status) {
					onload();
				}
			};

		} else {
			this._onFail('error');
			return this;
		}

		if (false !== options.beforeSend(this, options)) {

			var data = options.data,
				queryString = ('string' == typeof data) ? data : $().param(data),
				url = options.url;

			if ('GET' == options.type) {

				/* 如果原url后包含queryString的话则将新数据使用&附加到末尾 */
				var c = '';
				if (queryString.length > 0) {
					c = (-1 < url.indexOf('?')) ? '&' : '?';
				}
				xmlhttp.open('get', url + c + queryString, true);
			} else {
				xmlhttp.open('post', url, true);
				xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			}

			/* ZTE中兴手机自带浏览器发送的Accept头导致某些服务端解析出错，强制覆盖一下 */
			xmlhttp.setRequestHeader('Accept', '*/*');
			
			this.timoutFired = false;
			xmlhttp.send(queryString);
			this.isLoading =  true;
		}

		return this;
	},

	/**
	 * 把服务端返回的数据解析为JSON对象
	 * @private
	 */
	_getJSON: function(responseText) {
		if (responseText !== '') {
			try {
				/* 原生的JSON.parse更高效(但是有可能一些非标准的格式会造成JSON无法解析) */
				return JSON.parse(responseText);
			} catch(e) {
				if (ENABLE_DEBUG) {
					console.log('JSON.parse failed!');
				}
				try {
					return eval('(' + responseText + ')');
				} catch(e) {
					console.log('JSON.parse(eval) failed!');
				}
			};
		}
		return null;
	},

	/**
	 * 重置超时计时
	 * @private
	 */
	_resetTimeout: function() {
		var options = this.options;
		if (!options.timeout) return;
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}

		var self = this;
		this.timer = setTimeout(function() {
			if (true === self.timoutFired || true === self.isLoaded) {
				return;
			}
			self.abort();
			self.timoutFired = true;
			self._onFail('timeout');
		}.bind({timer: this.timer}), options.timeout * 1000); 

	},

	_onLoad: function(data, statusCode) {
		this.options.done.apply(this, [data, statusCode, this]);
		this.options.always.apply(this, [this, 'success']);
	},

	_onFail: function(statusText) {
		this.options.fail.apply(this, [this, statusText]);
		this.options.always.apply(this, [this, statusText]);
	}
};

RR.fn.prototype.ajax = function(url, settings) {
	return new ajaxObj(url, settings).send();
};

RR.fn.prototype.get = function(url, settings) {
	return new ajaxObj(url, settings).get();
};

RR.fn.prototype.post = function(url, settings) {
	return new ajaxObj(url, settings).post();
};
var Console = {

	inited: false,

	init: function() {
		Console.inited = true;
		Console.el = $('<div style="-webkit-overflow-scrolling:touch;pointer-events:none;overflow:auto;line-height:1.5;z-index:5000;position:fixed;left:0;top:0;max-width:50%;max-width:100%;font-size:11px;background:rgba(0,0,0,.8);color:#fff;"></div>')
			.appendTo(DOC.body);
	},

	log: function() {
		if (false === Console.inited) {
			Console.init();
		}
		var args = [], item;
		for (var i = 0, l = arguments.length; i < l; i++) {
			item = arguments[i];
			if ('function' == typeof item) {
				item = item.toString();
			} else {
				item = JSON.stringify(arguments[i]);
			}
			args.push(item);
		}
		Console.el.prepend('<p style="margin-top:-1px;padding:.5em;border-top:1px solid rgba(255,255,255,.3)">' + args.join(' ') + '</p>');
	}
};
/**
 * 公用全局变量
 * @autohr qianghu
 */

var API_KEY = '695fe827ffeb7d74260a813025970bd5';
var API_URL = '/api/';
var API_PARAMS = {
	'api_key': API_KEY,
	'plat': '17',
	'sver': '1.0',
	'partner': '1'
};

/* 客户端版本提醒配置 */
var APP_VER = {
	'android': {
		'version':'3.5',
		'tip': '手势操作，更佳观影体验'
	},
	'ios': {
		'version':'3.5',
		'tip': '手势操作，更佳观影体验'
	}
}

/* 用于站外内嵌播放器 */
var IS_EXTERNAL_PLAYER = false;
if (location.href.match(/player=1/i)) {
	IS_EXTERNAL_PLAYER = true;
}

/* 判断UC浏览器 */
var IsUC = false;
if (UA.match(/ UC(Browser)?/i) || UA.match(/compatible;Android/i)) {
	if (!UA.match(/ LT15i /i)) {
		IsUC = true;		
	}
}

/* 判断QQ浏览器 */
var IsQQBrowser = UA.match(/MQQBrowser/i);

/* 渠道码标示 */
var h5Src;
if (h5Src = URL.getQueryString('src')) {
	Cookie.set('MTV_SRC', h5Src, 86400 /* 十年 */, '.m.tv.sohu.com');
}

var WebRoot = '';
/* h5页面的域名，这个变量的存在是因为体育频道是独立域名m.s.sohu.com，在体育频道点击视频推荐需要返回到m.tv.sohu.com */
if ('m.s.sohu.com' == location.host) {
	WebRoot = 'http://m.tv.sohu.com';
}

/* 相关剧集列表的缓存版本号，如果版本过期则从服务端加载新版本，
 * 数据在set_list.js中定义，如果修改了set_list.js，同时要修改一下这里的版本号，用当天日期
 */
var SetListVersion = '20131229';
var Util = {

	/**
	 * 发送统计数据
	 */
	pingback: function(url) {
		var pingbackURLs = url.split('|'),
			i = 0,
			l = pingbackURLs.length;

		for (; i < l; i++) {
			(new Image()).src = pingbackURLs[i];
			if (ENABLE_DEBUG) {
				//console.log('pingback: ', pingbackURLs[i]);
			}
		}
	},

	/**
	 * 获取系统版本号
	 * @return {number}
	 */
	getOSVersion: function() {
		var osVersion = 0;
		if (IsIOS) {
			var match = UA.match(/os ([0-9_]+)/i);
			if (match && match[1]) {
				osVersion = Util.getVersionNumber(match[1]);
			}
		}
		return osVersion;
	},

	/**
	 * 解析字符串版本号，返回一个数字版本号
	 * @return {float}
	 */
	getVersionNumber: function(versionStr) {
		var versionNum = versionStr.replace(/_/g, '.').replace(/^([0-9]+\.[0-9]+)[0-9\.]*/, '$1');
		return parseFloat(versionNum || 0);
	},

	/**
	 * 加载评论列表后的回调
	 * @param {int} time 时间戳（毫秒）
	 * @return {string} 1分钟前-59分钟前-1小时前-23小时前-1天前-29天前-1个月前-11个月前-1年前—2年前
	 */
	timeFromNow: function(time) {

		var sec = 60,
			hour = sec * 60,
			day = hour * 24,
			month = day * 30,
			year = month * 12;

		time = (+new Date() - parseInt(time)) / 1000;

		if (time >= year) {
			return Math.floor(time/year) + '年前';
		} else if (time >= month) {
			return Math.floor(time/month) + '个月前';
		} else if (time >= day) {
			return Math.floor(time/day) + '天前';
		} else if (time >= hour) {
			return Math.floor(time/hour) + '小时前';
		} else if (time >= sec) {
			return Math.floor(time/sec) + '分钟前';
		}

		return '刚刚';
	},

	/**
	 * 获取总月数，用来计算两个时间戳直接相差的月数
	 * @param {int} time 时间戳（毫秒）
	 * @return {int} 总月数
	 */
	getTotalMonth: function(time) {
		var date = new Date(time);
		return date.getFullYear() * 12 + date.getMonth();
	},

	/**
	 * 将秒数转换为hh:mm:ss格式
	 * @function
	 * @param {int|string} seconds 秒数
	 * @return {string} hh:mm:ss格式的字符串
	 */
	secondsToTime: function(seconds) {
		var totalSeconds = parseInt(seconds);
		if (isNaN(totalSeconds)){
			totalSeconds = 0;
		}
		var minutes = Math.floor(totalSeconds/60),
			seconds = totalSeconds % 60;
		
		if (seconds < 10 ) {
			seconds = '0' + seconds;
		}
		
		if (minutes < 60) {
			if (minutes < 10) {
				minutes = '0' + minutes;
			}
			return minutes + ':' + seconds;
		} else {
			var hours = Math.floor(minutes/60);
			minutes = minutes % 60;
			if (minutes < 10) {
				minutes = '0' + minutes;
			}
			if (hours < 10) {
				hours = '0' + hours;
			}
			return hours + ':' + minutes + ':' + seconds;
		}
	},

	/**
	 * 将秒数转换为文本格式的时间，eg. 65 -> \"1分5秒\"\"
	 * @function
	 * @param {int|string} seconds 秒数
	 * @return {string} 文本格式的时间
	 */
	secondsToTimeText: function(seconds) {
		var totalSeconds = parseInt(seconds);
		if (isNaN(totalSeconds)){
			totalSeconds = 0;
		}
		var minutes = Math.floor(totalSeconds/60),
			seconds = totalSeconds % 60 + '秒';

		if (minutes < 60) {
			return (minutes > 0 ? minutes + '分' : '') + seconds;
		} else {
			var hours = Math.floor(minutes/60);
			minutes = minutes % 60;
			return (hours > 0 ? hours + '小时' : '') + minutes + '分' + seconds;
		}
	},

	/**
	 * 将数字数量缩短为带单位的字符串，如10,000转化为'1万'
	 * @function
	 * @param {string} count 数量
	 * @return {string} 带单位的字符串
	 */
	shortCount: function(count) {
		count = parseInt(count);
		if (count > 100000000) {
			count = Math.floor(count / 100000000)  + '亿'
		} else if (count > 10000) {
			count = Math.floor(count / 10000)  + '万'
		}
		return count;
	},

	/**
	 * 截取日期字符串 2013-12-18 07:07:46:57.000 转换为2013-12-18
	 * @function
	 * @param {string} time 
	 * @return {string} 日期字符串
	 */
	dateString: function(timeString) {
		var match;
		if (match = timeString.match(/([0-9]{4}\-[0-9]+\-[0-9]+)/)) {
			timeString = match[1];
		}
		return timeString;
	},

	setLoad: function(el) {
		var el = $(el);
		if (!el.hasClass('_load_inited')) {
			el.addClass('_load_inited').append($('<i class="ui_loading"><u></u><u></u><u></u></i>'));
		}
		return el;
	},

	loadScript: function(url, callback, opts) {
		var head = DOC.getElementsByTagName('head')[0] || DOC.body,
			script = DOC.createElement('script'),
			done = false;

		script.src = url;

		script.onload = script.onreadystatechange = function() {
			if (!done && (!this.readyState || this.readyState !== 'loading')) {
				done = true;
				if(callback) callback.apply(null, opts || []);
				script.onload = script.onreadystatechange = null;
				head.removeChild(script);
			}
		};
		head.appendChild(script);
	},

	/**
	 * 把web地址转为移动端地址
	 */
	formatURL: function (url){
		return (url + '').replace(/^https?:\/\/(my\.|v\.)?tv\./i,'http://m.tv.')
			.replace('http://s.','http://m.s.')
			.replace('http://m.s.','http://m.tv.')
			.replace(/^http:\/\/(video\.)?2012/i,'http://m.s');
	},

	/**
	 * 取得页面的垂直滚动距离
	 * @return {Number} 页面垂直滚动距离的象素值
	 */
	getPageOffset: function() {
		return WIN.pageYOffset || (DOC.body && DOC.body.scrollTop) || 0;
	},

	/**
	 * 获取下载搜狐视频客户端的链接
	 * 增加了传apk链接的参数 20130906 by binnng
	 * @return {string} 下载链接
	 */
	getDownloadAppLink: function(apk) {
		var downloadLink = 'http://m.tv.sohu.com/app',
			videoData;

		if (IsIPhone) {
			if (1 == URL.getQueryString('isappinstalled')) /* 微信中判断已经安装了应用直接打开 */  {
				downloadLink = 'sohuvideo://';
				if (videoData = WIN['VideoData']) {
					downloadLink += ('action.cmd?action=1.1&vid=' + videoData['vid'] + 
						'&cid=' + videoData['cid'] + 
						'&sid=' + videoData['sid'] + 
						'&cateCode=' + videoData['cateCode']);
				}
			} else {
				downloadLink = 'https://itunes.apple.com/cn/app/sou-hu-shi-pin-gao-qing/id458587755?mt=8';
			}
		} else if (IsIPad) {
			downloadLink = 'https://itunes.apple.com/cn/app/sou-hu-shi-pin-hd/id414430589?mt=8';
		} else if (IsAndroid) {
			downloadLink = apk || 'http://upgrade.m.tv.sohu.com/channels/hdv/680/3.5/SohuTV_3.5_680_201311261820.apk';
			//手搜播放器渠道包
			if (IS_EXTERNAL_PLAYER && DOC.referrer.match(/m\.sohu\.com/i)) {
				downloadLink = 'http://mfiles.sohu.com/mfiles/SohuTV_3.5_862_201312171236.apk';
			}
		} else if (IsWindowsPhone) {
			downloadLink = 'http://www.windowsphone.com/zh-CN/apps/403faf93-d22c-4331-ac32-9560ee9fac94';
		}

		return downloadLink;
	},

	/**
	 * 下载客户端
	 */
	appLink: function(e) {
		var $this = $(this);
		ClickTrace.pingback($this);
		setTimeout(function() {
			//location.href = Util.getDownloadAppLink();
			//优先获取href属性值，这个值已经根据平台判断填写。 20130906 by binnng
			location.href = $this.attr('href') || Util.getDownloadAppLink();
		}, 50);
		return false;
	},

	/* Android获取网络连接类型，如果取不到返回空字符串，
	 * 取到的话返回值为 2g|3g|wifi
	 */
	getConnectionType: function() {
		var _connection = navigator['connection'],
			_connectionType,
			connectionType = '';
		if (_connection) {
			_connectionType = _connection['type'];
			if (_connectionType == _connection['CELL_2G']) {
				connectionType = '2g';
			} else if (_connectionType == _connection['CELL_3G']) {
				connectionType = '3g';
			} else if (_connectionType == _connection['WIFI']) {
				connectionType = 'wifi';
			}
		}
		return connectionType;
	},

	/* 
	 * 判断是否是魅族手机，魅族手机自带浏览器的UA是iPhone的UA，所以只能通过屏幕尺寸来判断了
	 */
	_isMeizu: false,

	isMeizu: function() {
		var isMeizu = false;

		if (IsAndroid) {
			if (!IsUC &&  !IsQQBrowser && UA.match(/(M9|M032) Build/i)) {
				isMeizu = true;
			} else if (UA.match(/Mac OS X/i) && !IsUC) {
				/* 魅族手机自带浏览器的UA是iPhone的UA，所以只能通过屏幕尺寸来判断了 */
				var screenWidth = WIN['screen']['width'],
					screenHeight = WIN['screen']['height'];
				if ((640 == screenWidth || 960 == screenWidth) /* 魅族M1 */
					|| (320 == screenWidth && 410 == screenHeight) /* 魅族M9 */
					|| (410 == screenWidth && 320 == screenHeight)
					) {
					isMeizu = true;
				} 
			}
		}

		Util._isMeizu = isMeizu;

		/* 只判断一次就行了，后续调用直接返回结果 */
		Util.isMeizu = function() {
			return Util._isMeizu;
		};
		return isMeizu;
	},

	/* 
	 * 解决Android下UC和QQ浏览器的视频框覆盖问题
	 */
	fixVideoMask: function() {
		if (IsAndroid && (IsUC || IsQQBrowser)) {
			SohuMobilePlayer['pause']();//暂停视频
			WIN['scrollTo'](0, Util.getPageOffset() + 1); //“抖动”一下页面
		}
	},

	getDownloadURL: function(downloadUrl) {
		/*
		downloadUrl = downloadUrl || '';
		var pos = downloadUrl.indexOf('.mp4');
		if (pos > -1) {
			downloadUrl = downloadUrl.slice(0, pos + 4);
		}*/
		return downloadUrl;
	}         

};
/* 处理需要URL传递的全局参数 */
URL.updateGlobalParms = function(wrap, data) {
	var elLinks = $('a[href],form', wrap), 
		i = elLinks.length,
		elLink,
		link,
		data = data || URL.URLGlobalParms;

	while (i--) {
		elLink = elLinks.get(i);
		link = elLink.href;
		if (link && link.match(/^(sms|tel|mail)/i)) {
			/* 短信和电话链接, 什么都不做 */
		} else {
			URL.setQueryString(elLink, data);
		}
	}
};

URL.init = function() {

	var URLGlobalParmsKeys = ['clientType', 'clientVer', 'actionVer', 'plat', 'startClient', 'useVideoLink', 'r', 'player', 'f'],
		key,
		value,
		URLParms = URL.getQueryData(location.search.substring(1)),
		URLGlobalParms = {},
		n = 0; /* 保存需要全站传递的参数 {key: value, ...} */

	/* 用于站外内嵌播放器的时候，渠道值保持页面间传递 */
	if (IS_EXTERNAL_PLAYER) {
		URLGlobalParmsKeys.push('channeled');
	}

	var l = URLGlobalParmsKeys.length;
	while (l--) {
		key = URLGlobalParmsKeys[l];
		if (URLParms.hasOwnProperty(key)) {
			URLGlobalParms[key] = URLParms[key];
			n++;
		}
	}
	
	URL.URLGlobalParms = URLGlobalParms;
	if (n > 0) {
		URL.updateGlobalParms(DOC, URLGlobalParms);
		Notification.reg('DOM.html', URL.updateGlobalParms);
	}
};

$().ready(URL.init);
/**
 * 从Cookie中获取用户Passport相关参数，Cookie中的参数是编码过的，所以此文件主要是做解码操作
 */

var EncodeUtil = {

	utf8to16: function (e) {
		var t, n, r, i, s, o, u, a, f;
		t = [], i = e.length, n = r = 0;
		while (n < i) {
			s = e.charCodeAt(n++);
			switch (s >> 4) {
				case 0:
				case 1:
				case 2:
				case 3:
				case 4:
				case 5:
				case 6:
				case 7:
					t[r++] = e.charAt(n - 1);
					break;
				case 12:
				case 13:
					o = e.charCodeAt(n++), t[r++] = String.fromCharCode((s & 31) << 6 | o & 63);
					break;
				case 14:
					o = e.charCodeAt(n++), u = e.charCodeAt(n++), t[r++] = String.fromCharCode((s & 15) << 12 | (o & 63) << 6 | u & 63);
					break;
				case 15:
					switch (s & 15) {
						case 0:
						case 1:
						case 2:
						case 3:
						case 4:
						case 5:
						case 6:
						case 7:
							o = e.charCodeAt(n++), u = e.charCodeAt(n++), a = e.charCodeAt(n++), f = (s & 7) << 18 | (o & 63) << 12 | (u & 63) << 6 | (a & 63) - 65536, 0 <= f && f <= 1048575 ? t[r] = String.fromCharCode(f >>> 10 & 1023 | 55296, f & 1023 | 56320) : t[r] = "?";
							break;
						case 8:
						case 9:
						case 10:
						case 11:
							n += 4, t[r] = "?";
							break;
						case 12:
						case 13:
							n += 5, t[r] = "?"
					}
			}
			r++;
		}
		return t.join('');
	},

	b64_decodex: function (str) {
		var result = [],
			i, l,
			temp = '';

		for (i = 0, l = str.length; i < l; i += 4) {
			temp += EncodeUtil.b64_423(str.substr(i, 4));
		}
		for (i = 0, l = temp.length; i < l; i += 8) {
			result += EncodeUtil.b2i(temp.substr(i, 8));
		}
		return result;
	},

	b64_423: function (str) {
		var t = new Array("A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "_"),
			i = 0,
			l = str.length,
			result = '';

		for (; i < l; i++) {
			for (var j = 0; j < 64; j++) {
				if (str.charAt(i) == t[j]) {
					var s = j.toString(2);
					result += ("000000" + s).substr(s.length);
					break;
				}
			}
			if (j == 64) {
				return i == 2 ? result.substr(0, 8) : result.substr(0, 16);
			}
		}
		return result;
 	},

	b2i: function (str) {
		var t = 0,
			n = 128,
			r = 0;
		for (; r < 8; r++, n /= 2) {
			if (str.charAt(r) == '1') {
				t += n;
			}
		}
		return String.fromCharCode(t)
	}
};

var Passport = function () {

	var cookieData = {}, 
		lastPassportCookie, 

		getPassportCookie = function () {
			var cookies = ['ppinf', 'ppinfo', 'passport'],
				i, 
				l, 
				passportCookie;

			for (i = 0, l = cookies.length; i < l; i++) {
				passportCookie = (new RegExp("\\b" + cookies[i] + "\\b=(.*?)(?:$|;)")).exec(DOC.cookie);
				if (passportCookie && passportCookie.length) {
					passportCookie = passportCookie[1];
					break;
				}
			}
			return passportCookie;
		},

		decodeData = function (str) {
			var result = '';
			try {
				str = unescape(str).split('|');
				if (str[0] == '1' || str[0] == '2') {
					result = EncodeUtil.utf8to16(EncodeUtil.b64_decodex(str[3]));
				}
			} catch (e) {}

			return result;
		}, 

		getKeyValueData = function (str) {
			var result = {}, 
				i, 
				l, 
				item;

			str = (str || '').split('|');
			for (i = 0, l = str.length; i < l; i++) {
				item = str[i].split(':');
				if (item.length > 1) {
					result[item[0]] = item[2];
				}
			}
			return result;
		}, 

		getData = function () {
			var passportCookie = getPassportCookie(),
				data = cookieData;

			if (lastPassportCookie != passportCookie) {
				lastPassportCookie = passportCookie;
				data = getKeyValueData(decodeData(passportCookie));
				cookieData = data;
			}
			return data;
		};

	return {
		getPassport: function () {
			return getData()['userid'] || '';
		},
		getUid: function () {
			return getData()['uid'] || '';
		},
		getUUID: function () {
			return getData()['uuid'] || '';
		},
		getQname: function () {
			return getData()['uniqname'] || '';
		}
	}
}();
/**
 * 一些统计参数的公用方法
 */

var Trace = function() {

	var screen = WIN['screen'],
		screenSize = Math.floor(screen['width'] * ScreenSizeCorrect) + 'x' + Math.floor(screen['height'] * ScreenSizeCorrect),
		passport = Passport.getPassport(),
		platform = '',
		os = '';

	if (IsIOS) {
		os = 'ios';
		if (IsIPad) {
			platform = 'ipad';
		} else if (IsIPhone) {
			platform = 'iphone';
		}
	} else if (IsAndroid) {
		platform = os = 'android';
	} else if (IsWindowsPhone) {
		platform = os = 'windowsphone';
	}

	return {
	
		getUid: function() {
			return Cookie.get('SUV') || '';
		},
	
		getScreenSize: function() {
			return screenSize;
		},

		getPassport: function() {
			return passport;
		},

		getOS: function() {
			return os;
		},

		getPlatform: function() {
			return platform;
		},

		getVideoData: function(key) {
			var videoData = WIN['VideoData'] || {};
			return videoData[key] || '';
		},

		/* Android获取网络连接类型，如果取不到返回空字符串，
		 * 取到的话返回值为 2g|3g|wifi
		 */
		getConnectionType: function() {
			return Util.getConnectionType();
		}
	}

}();
/*
 行为统计方法调用说明：

 针对链接点击的统计：
 DOM: <a class=\"link\" href=\"..\" position=\"app_download\">Link</a>
 Javascript:
 $('.link').on('click', function() {
 	var el = $(this);
	ClickTrace.pingback(el);
	setTimeout(function() {
		location.href = el.attr('href');
	}, 50);
	return false; //为了在点击链接跳转的时候可以让统计数据发送出去，使用setTimeout做链接跳转
 });

 针对非链接点击的自定义统计:
 ClickTrace.pingback(null, \"app_download\", JSON.stringify({\"vid\": 123}));
*/

var ClickTrace = {

	/**
	 * 返回指定选择符的DOM集合
	 * @function
	 * @param {RR.dom} el RR.dom对象
	 * @param {String} position (可选)统计字段名，如果为空会尝试从el的position属性获取
	 * @param {String} details (可选)统计的附加数据，JSON.stringify()后的JSON字符串，如果为空会尝试从el的details属性获取
	 */
	pingback: function(el, position, details) {
		var position = position || el.attr('position') || '',
			details = details || (el && el.attr('details')) || '';

		var params = {
				't': +new Date, 
				'uid': Trace.getUid(), 
				'position': position, 
				'op': 'click', 
				'details': details, 
				'nid': Trace.getVideoData('nid'), 
				'url': location.href,  
				'refer': DOC.referrer,  
				'screen': Trace.getScreenSize(),
				'os': Trace.getOS(),
				'platform': Trace.getPlatform(),
				'passport': Trace.getPassport()
			};

		Util.pingback('http://z.m.tv.sohu.com/h5_cc.gif?' + $().param(params));
	}

};
/**
 * 频道列表
 * @static
 * @autohr qianghu
 */

var IsHistorySupport = ('pushState' in history);

var Channel = {

	/* 标记是刷新列表还是载入更多 */
	isResfresh: false,

	/* 是否是体育频道 */
	isSportsChannel: false,

	ajaxObj: null,

	pageSize: 15,
	currentPage: 1,

	//筛选分类的中文名称数组
	searchAlias:[],

	//筛选分类的键值数据对象
	searchKeys: {},

	/* 视频列表外容器 */
	elChannelListWrap: null,

	/* 视频列表内容器 */
	elItemListWrap: null,

	/* 查看更多按钮 */
	elLoadMore: null,

	/* 视频列表 */
	elItemList: null,

	/* 触发加载列表的DOM对象 */
	elLoading: null,

	currentURL:null,

	channelAPI: API_URL + 'search2/album.json',

	/* 体育频道使用单独的域名m.s.sohu.com，其它频道使用m.tv.sohu.com */
	channelDomain: '',

	channeledMap: {
		'101': '1002',
		'106': '1003',
		'100': '1004',
		'115': '1005',
		'122': '1006',
		'112': '1007',
		'9004':  '1008',
		'107': '1009',
		'121': '1010',
		'165': '1014',
		'166': '1014',
		'167': '1014',
		'168': '1014'
	},

	init: function() {
		Channel.elChannelListWrap = $('.channel_page .channel_list_wrap');
		Channel.elItemListWrap = $('.item_list_wrap');
		Channel.elItemList = $('.item_list', Channel.elItemListWrap);
		
		var elFilterHandle = $('.filter_handle').on('click', Channel.onFilterHandleClick);
		if (elFilterHandle.length > 0) {
			Channel.getSearchKeys();

			/* 更新筛选条件的标题 */
			var title = Channel.searchAlias.join(' ');
			$('.filter_handle b').html(title || '筛选');

			/* 提交检索的确定按钮 */
			Channel.elCategoryListWrap = $('.category_list_wrap');
			Channel.elFilterButton = $('.button', Channel.elCategoryListWrap).on('click', Channel.onFilterButtonClick);

			$('a[search_key]').each(function(element) {
				element.setAttribute('href', '#' + element.getAttribute('href'));
			}).on('click', Channel.onSearchItemClick);
		}

		if (Channel.elChannelListWrap.length > 0) {
			Channel.elLoadMore = $('.more', Channel.elChannelListWrap).on('click', Channel.loadMore);

			if (IsHistorySupport) {
				RR.addEvent('popstate', WIN, Channel.updatePage);
			}

			/* 体育频道使用单独接口 */
			if ($(DOC.body).hasClass('sports_page')) {
				Channel.channelAPI = '/h5/sportscat';
				Channel.channelDomain = 'http://m.s.sohu.com';
				Channel.isSportsChannel = true;
			}
		}
	},

	/* 使用History的URL更新列表 */
	updatePage: function() {

		if (Channel.elChannelListWrap.length < 1) {
			return;
		}

		//刷新页面
		if (null === Channel.currentURL) {
			Channel.currentURL = location.href;
			return;
		}
		var parmString = location.pathname.match(/\/[^\/]+\/(.+)/),
			//searchString = (parmString && parmString[1]) || '',
			//searchKeys = {},
			//tempArray,
			//tempItem,
			//pos,
			searchKeys = URL.getQueryData(location.search);

		//体育频道没有“全部”分类，所以筛选菜单默认选中第一个子分类
		if (Channel.isSportsChannel && !searchKeys['cat']) {
			var elSearchKey = $('.row[search_name=cat] a').eq(0);
			if (elSearchKey.length > 0) {
				var cateIds = elSearchKey.attr('search_key').split('/');
				if (cateIds.length > 0) {
					searchKeys['cat'] = cateIds[1];
				}
			}
		}

		/*tempArray = searchString.split('/');
		for (var i = 0, l = tempArray.length; i < l; i++) {
			tempItem = tempArray[i];
			pos = tempItem.indexOf('_');
			searchKeys[tempItem.slice(0, pos)] = tempItem.slice(pos + 1);
		}*/
		Channel.elLoading = null;
		Channel.currentPage = 1;
		Channel.searchKeys = $().extend({}, searchKeys);
		Channel.updateFilterItemsBySearchKey();
		Channel.updateChannelList(true);
	},

	/* 更新列表后更新URL */
	updateURL: function(el) {
		if (IsHistorySupport) {
			var key, 
				value,
				params = [],
				baseURLs = location.pathname.match(/\/[^\/\?]+/),
				baseURL = baseURLs[0],
				url;
			for (key in Channel.searchKeys) {
				value = Channel.searchKeys[key];
				if ('' !== value) {
					params.push(key + '=' + Channel.searchKeys[key]);
				}
			}
			url = (location['origin'] || '') + baseURL + '?' + params.join('&');
			if (url !== location.href) {
				history.pushState(null, DOC['title'], url);
				Channel.currentURL = url;
			}
		}
	},

	/* 点击频道页的内容筛选菜单 */
	onFilterHandleClick: function() {
		var elFilterWrap = $('.filter_wrap'),
			elCategoryListWrap = Channel.elCategoryListWrap;

		if (elFilterWrap.hasClass('filter_open')) {
			if (!IsAndroid) {
				elCategoryListWrap.css({
					'webkitTransform': ''
				});
			}
			elFilterWrap.removeClass('filter_open');
			Channel.elFilterButton.addClass('white_button');

			//如果直接关闭筛选面板而不是点确定按钮，则恢复点确定前的筛选选项
			Channel.updateFilterItemsBySearchKey();
		} else {
			elFilterWrap.addClass('filter_open');
			var wrapHeight = elCategoryListWrap.height() + 150;
			if (!IsAndroid) {
				elCategoryListWrap.css({
					'top': -wrapHeight, 
					'webkitTransform': 'translate3d(0,' + wrapHeight + 'px,0)'
				});
			}
		}
	},

	/* 使用Channel.searchKeys的值去更新筛选面板的选项高亮状态 */
	updateFilterItemsBySearchKey: function() {
		var elFilterWrap = $('.filter_wrap');
		$('a',  elFilterWrap).removeClass('c');
		var searchKeys = $().extend({
			'o': '-1'
		}, Channel.searchKeys);
		var elRows = $('div[search_name]', elFilterWrap).each(function(element) {
			var el = $(element),
				searchKey = el.attr('search_name'),
				keyValue;

			keyValue = searchKey + '/' + (searchKeys[searchKey] || '');
			$('a[search_key="' + keyValue + '"]').addClass('c');
		});
	},

	/* 获取键值对的类目检索对象 */
	getSearchKeys: function() {
		var searchKeys = {},
			searchAlias = [];

		$('.c[search_key]').each(function(element) {
			var el = $(element),
				searchKey = el.attr('search_key'),
				_array = searchKey.split('/');
			searchKeys[_array[0]] = _array[1];
			if ('' !== _array[1] && 'o' !== _array[0]) {
				searchAlias.push(el.html().replace(/<.*>/, ''));
			}
		});

		Channel.searchAlias = searchAlias; //复制一个
		Channel.searchKeys = $().extend({}, searchKeys);
		return searchKeys;
	},

	setLoadingEl: function(el) {
		Channel.elLoading && Channel.elLoading.removeClass('loading');
		Channel.elLoading = el;
	},

	/* 点击频道页的内容筛选项 */
	onSearchItemClick: function() {
		var el = $(this),
			isSort = el.hasClass('o');
		if (!el.hasClass('c')) {
			$('.c',  el.parent()).removeClass('c');
			el.addClass('c');
			if (!isSort) {
				Channel.elFilterButton.removeClass('white_button');
			}
		}
		if (WIN['innerWidth'] >= 768 || isSort) {
			Channel.setLoadingEl(el);
			Channel.currentPage = 1;
			Channel.updateChannelList();
		}
		return false;
	},

	/* 提交检索的确定按钮 */
	onFilterButtonClick: function() {
		var el = $(this);
		if (!el.hasClass('white_button')) {

			Channel.setLoadingEl($('.filter_handle em'));

			//关闭筛选面板
			Channel.currentPage = 1;
			Channel.updateChannelList();
			Channel.onFilterHandleClick();
		}
		return false;
	},

	/* 查看更多 */
	loadMore: function() {
		Channel.setLoadingEl(Channel.elLoadMore);
		Channel.currentPage++;
		Channel.updateChannelList();
		return false;
	},

	/* 调用API接口数据，显示频道列表 */
	updateChannelList: function(notUpdateURL) {
		var searchKeys = Channel.getSearchKeys();

		var data = {
					'cateCode': $(DOC.body).attr('cate_code') || '',
					'pageSize': Channel.pageSize,
					'page': Channel.currentPage,
					'o': '-1'
				};

		if (Channel.isSportsChannel) {
			var cateId = searchKeys['cat'] || '',
				cateIds = [];
			if (cateId) {
				cateIds = cateId.split('_');
				if (cateIds.length > 0) {
					cateId = cateIds[0];
				}
				if (cateId.length > 3) {
					cateId = cateId.slice(0, 3);
				}
			}
			data['c'] = cateId;
			data['cateCode'] = cateId;
		} else {
			data['c'] = 2;
		}

		searchKeys = $().extend(
				$().extend(data, API_PARAMS), 
			searchKeys);

		var url = Channel.channelAPI + '?' + $().param(searchKeys);
		$().get(url, {
			beforeSend: function() {
				Channel.elLoading && Util.setLoad(Channel.elLoading.addClass('loading'));
			},
			always: function() {
				Channel.elLoading && Channel.elLoading.removeClass('loading');
			},
			done: Channel.updateChannelListLoaded
		});

		//使用History的URL更新列表后不重复更新URL
		if (!notUpdateURL) {
			Channel.updateURL();
		}
	},

	updateChannelListLoaded: function(data) {
		var data = data['data'] || data,
			videos = data && data['videos'],

			l = (videos && videos.length) || 0,
			html = [],
			title = Channel.searchAlias.join(' ');

		var cateCode = $(DOC.body).attr('cate_code');
		if (cateCode) {
			var channelId = Channel.channeledMap[cateCode];
			if (channelId) {
				var channeled = '12' + channelId + (Channel.currentPage > 1 ? '0200' : '0100');
			}
		}


		$('.filter_handle b').html(title || '筛选');
		DOC['title'] = ($('.channel_nav .c').html() || '') + (title ? ': ' + title : '')  + ' - 搜狐视频';
		if (l > 0) {
			var i = 0,
				url,
				video;

			for (; i < l; i++) {
				video = videos[i];
				url = Channel.channelDomain + '/v' + video['vid'] + '.shtml';

				if (channeled) {
					url += '?channeled=' + channeled;
				}

				html.push(
					'<dd>',
						'<a href="' + url + '" class="cover">',
							'<b style="background-image:url(' + ((7 != video['cid'] && video['ver_big_pic']) || video['video_big_pic'] || '') + ')"></b>',
						'</a>',
						'<p>',
						'<a href="' + url +'">' + video['tv_name'] + '</a>',
							'<span>' + video['tip'] + '</span>',
						'</p>',
					'</dd>'
				);
			}

			Channel.elChannelListWrap
				//空白提示
				.removeClass('blank_list')
				//是否显示查看更多按钮
				.toggleClass('has_more', (data['count'] > Channel.currentPage * Channel.pageSize));
		} else {
			Channel.elChannelListWrap
				.addClass('blank_list')
				.removeClass('has_more');
		}
		html = '<dl class="' + Channel.elItemList.attr('class') + '">' + html.join('') + '</dl>';
		if (1 == Channel.currentPage) {
			Channel.elItemListWrap.html(html);
		} else {
			Channel.elItemListWrap.append('<h1 class="cate_title">第' + Channel.currentPage + '页</h1>' + html);
		}

	}
};

$().ready(Channel.init);
/**
 * 搜索
 * @static
 * @autohr qianghu
 */


var keepSearchInputOpen = false;

var Search = {

	pageSize: 15,
	currentPage: 1,

	/* 视频搜索结果数 */
	searchCount: 0,

	hintApi: 'search/hint.json', /* 搜索即时提示*/

	init: function() {
		var Body = $(DOC.body);
		var elSearchInput = $('#top_search').on({
			/*'focus': function(e) {
				Body.addClass('search_actived');
				e.stopPropagation();
			},*/
			'blur': function() {
				setTimeout(function() {
					if (false === keepSearchInputOpen) {
						Body.removeClass('search_actived');
					}
					keepSearchInputOpen = false;
				}, 200);
			}
		});
		if (!elSearchInput.val()) {
			elSearchInput.val($('.search_word').html());
		}
		var elSearchForm = $('.search').on({
			'submit': function(e) {
				var val = encodeURIComponent(elSearchInput.val());
				//var val = elSearchInput.val();

				keepSearchInputOpen = true;
				//e.stopPropagation();
				if ('' !== val.trim()) {
					ClickTrace.pingback(null, 'search_submit');
					setTimeout(function() {
						location.href = WebRoot + '/so?wd=' + val;
					}, 50);
				} else {
					elSearchInput.trigger('focus').trigger('click');
					return false;
				}
			},
			'click': function() {
				if ((IsIPhone || IsBlackBerry) && !Body.hasClass('search_page')) {
					location.href = WebRoot + '/so';
					return false;
				}
				if (!Body.hasClass('search_actived search_page')) {
					Body.addClass('search_actived').removeClass('history_open');
					elSearchInput.trigger('focus').trigger('click');
				}
				//return false;
			}
		});

		$('.white_button', elSearchForm).on('click', function() {
			Body.removeClass('search_actived');
			return false;
		});

		//全网搜索结果的视频来源Tab切换
		var elTabItems = $('.video_src span').on('click', function() {
			var el =  $(this);
			if (el.hasClass('c')) {
				return;
			}
			var elItem = el.parent().parent();
			$('.s_l', elItem).removeClass('c');

			var listWrap = $('.s_l_' + el.attr('src_id'), elItem).addClass('c'),
				elLink = $('a', listWrap),
				url = elLink.attr('href'),
				target = elLink.attr('target') || '_self';

			//把封面和标题链接更新为当前来源专辑列表的第一个视频的链接
			$('.cover,p a', elItem).attr('href', url).attr('target', target);

			elTabItems.removeClass('c');
			el.addClass('c');

		});

		Search.elLoadMore = $('.search_page .more').on('click', Search.loadMore.bind(WIN));

		Search.searchCount = parseInt($('.search_count').html() || 0, 10);

		if (Search.elLoadMore.length > 0) {
			//搜索页面行为统计
			Search.bindTraceCallback($('.body_wrap'));
		} else {

			$('<div class="mask search_mask"></div>').appendTo(Body).on('click', function() {
				Body.removeClass('history_open search_actived');
			});
		}

		if (elSearchForm.length > 0) {

			/* 有搜索结果的搜索页不显示热词 */
			if (Body.hasClass('search_page') && $('.search_album_list,.grid_list').length > 0) {
			} else {
				//获取搜索热词
				Search.getHotSearch();
			}
		}

	},

	getHotSearch: function() {

		var hotList = Storage('hot');
		//先从本地存储中检查缓存，无缓存或者缓存过期后从服务端获取数据
		if (hotList && (+new Date - hotList['time']) < 3600 * 1000 * 3 /* 3小时 */) {
			Search.getHotSearchLoaded(hotList);
		} else {
			var params = 	$().extend(API_PARAMS, {
					'n': 10,
					'plat': 3
				});

			var url = API_URL + 'searcher/hot.json?' + $().param(params);
			$().get(url, {
				done: Search.getHotSearchLoaded
			});
		}
	},

	/* 展示搜索 热词 */
	getHotSearchLoaded: function(data) {
		var hotData = data && data['data'],
			hostList =  hotData && hotData['hotList'] || [],
			l = hostList.length,
			html = ['<div class="hot_wrap">'],
			hotWord,
			Body = $(DOC.body);

		if (l > 0) {
			var channeled = '1211040200';
			if (Body.hasClass('search_page')) {
				channeled = '1211040100';
			}
			for (var i = 0; i < l; i++) {
				hotWord = hostList[i]['tv_name'];
				html.push('<a href="/so?wd=' + encodeURIComponent(hotWord) + '&channeled=' + channeled + '">' + hotWord + '</a>');
			}

			data['time'] = +new Date;

			Storage('hot', data);

			html.push('</div>');

			var elNav = $('nav');
			if (elNav.length > 0) {
				elNav.after(html.join(''));
			} else {
				$('.body_wrap').prepend(html.join(''));
			}
			Body.addClass('show_hot');
		}
	},

	/* 搜索结果点击统计 */
	bindTraceCallback: function(elWrap) {
		$('a', elWrap).on('click', function(e) {
			var elTarget = $(this);
			if (!elTarget.hasClass('more') && !elTarget.hasClass('item')) {
				ClickTrace.pingback(null, 'search_click');
				if ('_blank' !== elTarget.attr('target')) {
					setTimeout(function() {
						location.href = elTarget.attr('href');
					}, 50);
					return false;
				}
			}
		});
	},

	/* 查看更多 */
	loadMore: function(e) {
		if (!Search.elLoadMore.hasClass('loading')) {
			Search.currentPage++;
			Search.updateResultList();
		}
		return false;
	},

	updateResultList: function() {
		var params = 	$().extend({
				'key': $().getUrlParam('wd') || '',
				'pageSize': Search.pageSize,
				'page': Search.currentPage,
				'o': '0'
			}, API_PARAMS);

		var url = API_URL + 'search2/keyword/video.json?' + $().param(params);
		$().get(url, {
			beforeSend: function() {
				Util.setLoad(Search.elLoadMore.addClass('loading'));
			},
			always: function() {
				Search.elLoadMore.removeClass('loading');
			},
			done: Search.listLoaded
		});

	},

	listLoaded: function(data) {
		var videos = data && data['data'] && data['data']['videos'],
			l = (videos && videos.length) || 0,
			html = [],
			elListWrap = $('.search_page .channel_list_wrap'),
			elItemListWrap = $('.search_page .item_list_wrap');

		if (l > 0) {
			var i = 0,
				url,
				video;

			for (; i < l; i++) {
				video = videos[i];
				url = '/v' + video['vid'] + '.shtml';

				html.push(
					'<dd>',
						'<a href="' + url + '" class="cover">',
							'<b style="background-image:url(' + (video['hor_big_pic'] || video['video_big_pic'] || '') + ')"></b>',
						'</a>',
						'<p>',
						'<a href="' + url +'">' + video['tv_name'] + '</a>',
							'<span>' + video['tip'] + '</span>',
						'</p>',
					'</dd>'
				);
			}

		}
		elListWrap.toggleClass('has_more', (Search.searchCount > Search.currentPage * Search.pageSize));
		html = '<dl class="item_list">' + html.join('') + '</dl>';
		if (1 == Search.currentPage) {
			elItemListWrap.html(html);
		} else {
			elItemListWrap.append('<h1 class="cate_title">第' + Search.currentPage + '页</h1>');
			var elItemList = $(html).appendTo(elItemListWrap);
			Search.bindTraceCallback(elItemList);
		}

	}
};

$().ready(Search.init);
/**
 * 播放记录
 * @static
 * @autohr qianghu
 */

 if (URL.getQueryString('ht')) {
	//Storage('history', JSON.parse('[["5465522",[["1243130",{"sid":"5465522","vid":"1243130","cid":"2","videoCount":"35","time":430.3862762451172,"title":"今夜天使降临第1集","cover":"http://photocdn.sohu.com/20130717/vrsb906047.jpg","url":"http://m.tv.sohu.com/20130801/n383076031.shtml"}]],1386064843595],["5030825",[["817439",{"sid":"5030825","vid":"817439","cid":"2","videoCount":"29","time":963.6472778320312,"title":"大男当婚第1集","cover":"http://photocdn.sohu.com/20120926/vrsb630955.jpg","url":"http://m.tv.sohu.com/20121007/n354388645.shtml"}]],1386064607570],["5081714",[["1438009",{"sid":"5081714","cid":"2","vid":"1438009","time":2413.10205078125,"title":"咱们结婚吧第36集","videoCount":"10","cover":"http://photocdn.sohu.com/20131201/vrsb1049351.jpg","url":"http://m.tv.sohu.com/20131201/n391083868.shtml"}]],1385982589501],["6151310",[["1427457",{"sid":"6151310","vid":"1427457","cid":"13","videoCount":"22","time":55.63010025024414,"title":"曝王力宏结婚 与父母同天纪念日","cover":"http://photocdn.sohu.com/20131128/0a766127-04ea-4c69-8c50-b3104c8a1f64_1427457_S_b.jpg","url":"http://m.tv.sohu.com/20131128/n390971323.shtml","latest_video_count":30}]],1385731539716],["3077",[["1418207",{"sid":"3077","vid":"1418207","cid":"7","videoCount":"191","time":1867.375,"title":"《天天向上》20131122 孔卡携爱子同场对决 本杰明卖萌逗乐老爸","cover":"http://photocdn.sohu.com/20131122/vrsb1037496.jpg","url":"http://m.tv.sohu.com/20131122/n390643184.shtml","latest_video_count":30,"date": 1386172800000}]],1385731471230]]'));
}

var Body;

var PlayHistory = {

	/* 播放记录列表是否打开 */
	isPanelOpen: false,

	/* 播放记录数据
	[
		[{sid1}, [
				[{vid1}, {VideoData}, (+new Date)],
				[{vid12}, {VideoData}, (+new Date)],
				...
			]
		],
		...
	]
	 */

	historyData: Storage('history') || [],
	watchLaterData: Storage('watch_later') || [],

	/* 上次更新播放记录的时间，用来控制更新间隔，不低于5秒 */
	lastUpdate: 0,

	/* 上次更新时视频的播放时间，用来控制更新间隔，不低于3秒 */
	lastCurrentTime: 0,

	currentVideoTime: 0,

	/* 专辑列表的更新数据，从服务端获取数据后填充这个数组 */
	updatedSids: [],

	init: function() {
		Body = $(DOC.body);

		//播放视频后插入播放记录
		Notification.reg('playerOnStart', PlayHistory.insertHistoryData);
		Notification.reg('playerOnUnLoad', PlayHistory.insertHistoryData);
		Notification.reg('playerOnTimeupate', PlayHistory.insertHistoryData);

		//创建播放记录的容器对象
		var elHistory = $('<div class="history_wacth_later_wrap">').insertBefore($('.body_wrap')).html([
				'<div class="watch_later_wrap">',
					'<div class="title">',
						'<span class="button white_button edit">管理</span>',
						'<span class="button white_button clear">清空</span>',
						'<span>稍后观看</span>',
						'<div class="clear_menu">',
							'<span class="button">清空</span>',
						'</div>',
					'</div>',
					'<div class="blank_tip">没有稍后观看</div>',
					'<div class="watch_later_content"></div>',
				'</div>',
				'<div class="history_wrap">',
					'<div class="title">',
						'<span class="button white_button edit">管理</span>',
						'<span class="button white_button clear">清空</span>',
						'<span>播放记录</span>',
						'<div class="clear_menu">',
							'<span class="button">清空</span>',
						'</div>',
					'</div>',
					'<div class="blank_tip">没有播放记录</div>',
					'<div class="history_content"></div>',
				'</div>'
			].join(''));

		/* 清空按钮 */
		$('.clear', elHistory).on('click', PlayHistory.showClearMenu);
		$('.clear_menu .button', elHistory).on('click', PlayHistory.clearMenuClick);
		$('.clear_menu .button', elHistory).on('click', PlayHistory.clearMenuClick);

		$(DOC).on('click', PlayHistory.closeClearMenu).on('click', PlayHistory.closeWatchLaterMenu);

		/* 管理按钮 */
		$('.watch_later_wrap .edit', elHistory).on('click', function() {
			PlayHistory.toggleEditingState('.watch_later_wrap');
		});
		$('.history_wrap .edit', elHistory).on('click', function() {
			PlayHistory.toggleEditingState('.history_wrap');
		});

		var elHistoryIcon = $('.icon_history').on('click', function() {
			Body.toggleClass('history_open');
			PlayHistory.isPanelOpen = Body.hasClass('history_open');
			if (PlayHistory.isPanelOpen) {
				Body.removeClass('search_actived'); //关闭搜索下拉面板
				PlayHistory.showHistoryList('watch_later'); //显示稍后观看列表
				PlayHistory.showHistoryList('history'); //显示播放记录列表

				//行为统计
				ClickTrace.pingback(null, 'link_toptip');
			}
		});

		if (elHistoryIcon.length > 0) {
			$('<div class="mask history_mask"></div>').appendTo(Body).on('click', function() {
				Body.removeClass('history_open search_actived');
				PlayHistory.isPanelOpen = false;
			});

			if ($('.num', elHistoryIcon).length < 1) {
				$('span', elHistoryIcon).append('<b class="num"></b>');
			}

			PlayHistory.checkAlbumUpdate();
		}

		var videoData = WIN['VideoData'];

		/* 播放页稍后观看按钮 */
		if (videoData) {
			$('<div class="watch_later_icon">稍后观看' + 
				'<div class="watch_later_notice_menu"><span class="tip_1">您已经记录超过10个视频了，请先观看吧</span>' + 
					'<span class="tip_2">您已经添加过此视频了</span></div>' + 
				'</div>')
				.prependTo($('.appbar')).on('click', PlayHistory.addToWatchLater);
		}

	},

	/* 检查一个视频是否已经添加到了稍后观看列表 */
	checkIsVideoAddedToWatchLater: function(videoData) {
		var isAdded = false;
		var watchLaterDataLength = PlayHistory.watchLaterData.length;
		for (var i = 0; i < watchLaterDataLength; i++) {
			var itemData = PlayHistory.watchLaterData[i];
			if (itemData[0] == videoData['sid']) {

				/* 检查当前视频的vid是否已经存在于缓存中 */
				for (var j = 0, len = itemData[1].length; j < len; j++) {
					if (itemData[1][j][0] == videoData['vid']) {
						isAdded = true;
						break;
					}
				}
				break;
			}
		}
		return isAdded;
	},

	/* 添加当前视频到最近观看列表 */
	addToWatchLater: function() {
		var videoData = WIN['VideoData'];
		if (videoData) {
			var sid = videoData['sid'],
				vid = videoData['vid'],
				tempData = [],
				tempVideoData = [],
				_videoData = {
					'date': (+new Date),
					'sid' : sid || '',
					'vid' : vid,
					'videoCount' : (videoData['videoCount'] || 0),
					'time' : PlayHistory.lastCurrentTime || SohuMobilePlayer['currentTime']() || 0,
					'title' : videoData['tv_name'] || '',
					'cover': videoData['video_cover'] || 'about:blank',
					'url': '/v' + vid + '.shtml'
				},
				elButton = $(this),
				watchLaterDataLength = PlayHistory.watchLaterData.length;

			if (elButton.hasClass('watch_later_menu_open')) {
				elButton.removeClass('watch_later_menu_open');
				return;
			}

			if (watchLaterDataLength > 9 || elButton.hasClass('watch_later_icon_done')) {
				elButton.addClass('watch_later_menu_open');
				return;
			}

			elButton.addClass('watch_later_icon_done');

			/* 检查当前视频的sid是否已经存在于缓存中 */
			for (var i = 0; i < watchLaterDataLength; i++) {
				var itemData = PlayHistory.watchLaterData[i];
				if (itemData[0] == sid) {
					tempData = PlayHistory.watchLaterData.splice(i, 1);

					/* 检查当前视频的vid是否已经存在于缓存中 */
					for (var j = 0, len = itemData[1].length; j < len; j++) {
						if (itemData[1][j][0] == vid) {
							itemData[1].splice(j, 1);
							break;
						}
					}
					tempVideoData = itemData[1];
					break;
				}
			}
			//把当前视频的数据插入到专辑数据的头部
			tempData = [[vid, _videoData]].concat(tempVideoData).slice(0,10) /* 只记录最近10条视频 */;

			//把当前专辑的数据插入到缓存数据的头部
			PlayHistory.watchLaterData = [[sid, tempData, (+new Date)]].concat(PlayHistory.watchLaterData).slice(0,20) /* 只记录最近50条专辑 */;

			//保存到本地存储
			Storage('watch_later', PlayHistory.watchLaterData);

			//行为统计
			ClickTrace.pingback(null, 'link_mark');

			var backgroundImage = $('meta[property="og:image"]').attr('content'),
				elWatchLater = $('.watch_later_flier');

			if (elWatchLater.length < 1) {
				elWatchLater = $('<div class="watch_later_flier" style="background-image:url(' + backgroundImage +')"></div>')
					.appendTo(DOC.body);
			}

			/* 点击“稍后观看”按钮的动画 */

			var buttonOffsetTop = elButton.offset().top,
				buttonOffsetLeft = elButton.offset().left,
				watchLaterIconOffset = $('.icon_history').offset().left;

			elWatchLater.css({
				'left':buttonOffsetLeft + 'px',
				'top':buttonOffsetTop + 'px',
				'opacity':1,
				'-webkit-transform':'translate3d(' + (watchLaterIconOffset - buttonOffsetLeft - 25) + 'px,' + 
					(Util.getPageOffset() - buttonOffsetTop - 15) + 'px,0) scale(0.5)'
			});

			setTimeout(function() {
				elWatchLater.css('opacity',0);
			}, 400);

			setTimeout(function() {
				elWatchLater.css({
					'-webkit-transform': 'translate3d(0,0,0)',
					'left': '-1000', 
					'top': '-1000'
				});

				PlayHistory.updateNotificationNumber();
			}, 500);

		}
	},

	/*
	 *  更新右上角历史记录按钮的数字
	 */
	updateNotificationNumber: function() {
		$('.icon_history .num').html((PlayHistory.watchLaterData.length + PlayHistory.updatedSids.length) || '');
	},

	/*
	 *  获取历史记录和稍后观看的sid列表
	 */
	getAlbumIdList: function() {
		var historyData = PlayHistory.historyData,
			sid,
			sids = [],
			i = 0,
			l = historyData.length;

		for (; i < l; i++) {
			var dataItem = historyData[i],
				albumId = dataItem[0],
				videos = dataItem[1],
				video = videos[0][1];

			if (
				('|2|7|16|'.indexOf(video['cid']) > -1) /* 电视剧、综艺、动漫频道内容 */ && 
				(video['time'] > 300) /* 播放时间大于5分钟 */
			) {
				sid = dataItem[0];
				sids.push(sid);
			}
		}

		return sids;

	},

	/* 检查稍后观看和播放记录中的专辑是否有更新 */
	checkAlbumUpdate: function(sids) {
		var sids = PlayHistory.getAlbumIdList();
		if (sids.length > 0) {

			var albumUpdateList = Storage('album_update');

			//先从本地存储中检查缓存，无缓存或者缓存过期后从服务端获取数据
			if (albumUpdateList && (+new Date - albumUpdateList['time']) < 3600 * 1000 * 1 /* 3小时 */) {
				PlayHistory.checkAlbumUpdateCallback(albumUpdateList);
			} else {

				$().post('/api/v4/album/batch/latest.json', {
					data: {
						'aids': sids.join(','),
						'api_key': API_KEY
					},
					success: PlayHistory.checkAlbumUpdateCallback
				});
			}
		} else {
			PlayHistory.updateNotificationNumber();
		}
	},

	/* 检查稍后观看和播放记录中的专辑是否有更新，回调 */
	checkAlbumUpdateCallback: function(data) {
		var data = data || {},
			items = data['data'] || [],
			item,
			i = 0,
			length = items.length,
			sid,
			updatedSids = [],
			albumIdIndexes = [], //保存id的索引数组，用来去重o(╯□╰)o,
			aId,
			historyData = $().copy(PlayHistory.historyData),
			historyDataLength = historyData.length,
			j;

		/* 把服务端返回的专辑更新数组转化为以专辑id为key的键值对，方便查询 */
		for (;i < length; i++) {
			item = items[i];

			aId = item['aid'] + '';
			if (albumIdIndexes.indexOf(aId) < 0) {

				for (j = 0; j < historyDataLength; j++) {
					var dataItem = historyData[j],
						albumId = dataItem[0],
						videos = dataItem[1];

					for (var n = 0, m = videos.length; n < m; n++) {
						videos[n][1]['latest_video_count'] = item['latest_video_count'];
					}

					if (aId == albumId) {
						/* 综艺使用period判断过期时间 */
						var period = item['show_date'];
						if (period) {
							period = period.replace('-', '');
							var itemDate = videos[0][1]['date'] || 0;
							if (itemDate) {
								var dateObj = new Date(itemDate),
									year = dateObj.getFullYear(),
									month = dateObj.getMonth(),
									date = dateObj.getDate();

								if (month < 10 ) {
									month = '0' + month;
								}
								if (date < 10 ) {
									date = '0' + date;
								}

								var itemUpdateDate = parseInt(year + '' + '' + month + '' + date, 10);

								if (itemUpdateDate < parseInt(period, 10)) {
									dataItem[3] = 1; //更新标记
									updatedSids.push(dataItem);
								}
							}
						} else {
							if (item['latest_video_count'] > parseInt(videos[0][1]['videoCount'], 10)) {
								dataItem[3] = 1; //更新标记
								updatedSids.push(dataItem);
							}
						}
					}

				}

				albumIdIndexes.push(aId);
			}

		}

		data['time'] = +new Date;
		Storage('album_update', data);

		PlayHistory.historyData = historyData;

		/* 放到全局变量中，在显示稍后观看和播放记录的时候对比 */
		PlayHistory.updatedSids = updatedSids;

		PlayHistory.updateNotificationNumber();
	},

	/**
	 * 插入一条播放记录，在视频播放过程中每五秒执行一次
	 */
	insertHistoryData: function(_videoData, currentTime) {

		/* 更新间隔，不低于5秒 */
		var time = +new Date;
		if (time - PlayHistory.lastUpdate < 5000 && Math.abs(currentTime - PlayHistory.lastCurrentTime) < 5) {
			return;
		}

		PlayHistory.lastUpdate = time;
		PlayHistory.lastCurrentTime = currentTime;
		if ('undefined' !== typeof currentTime && currentTime == 0) {
			return;
		}
		if (_videoData) {
			var sid = _videoData['sid'],
				vid = _videoData['vid'],
				tempData = [],
				tempVideoData = [],
				videoData = {
					'date': (+new Date),
					'sid' : sid || '',
					'vid' : vid,
					'cid' : _videoData['cid'],
					'videoCount' : (_videoData['videoCount'] || 0),
					'time' : (currentTime || 0),
					'title' : _videoData['tv_name'] || '',
					'cover': _videoData['video_cover'] || 'about:blank',
					'url': '/v' + vid + '.shtml'
				};

			/* 检查当前视频的sid是否已经存在于缓存中 */
			for (var i = 0, l = PlayHistory.historyData.length; i < l; i++) {
				var itemData = PlayHistory.historyData[i];
				if (itemData[0] == sid) {
					tempData = PlayHistory.historyData.splice(i, 1);

					/* 检查当前视频的vid是否已经存在于缓存中 */
					for (var j = 0, len = itemData[1].length; j < len; j++) {
						if (itemData[1][j][0] == vid) {
							itemData[1].splice(j, 1);
							break;
						}
					}
					tempVideoData = itemData[1];
					break;
				}
			}
			//把当前视频的数据插入到专辑数据的头部
			tempData = [[vid, videoData]].concat(tempVideoData).slice(0,40) /* 只记录最近10条视频 */;

			//把当前专辑的数据插入到缓存数据的头部
			PlayHistory.historyData = [[sid, tempData, (+new Date)]].concat(PlayHistory.historyData).slice(0,50) /* 只记录最近50条专辑 */;

			Storage('history', PlayHistory.historyData);


			/* 更新稍后观看列表中当前视频的观看时间 */
			var watchLaterDataLength = PlayHistory.watchLaterData.length;

			for (var i = 0; i < watchLaterDataLength; i++) {
				var itemData = PlayHistory.watchLaterData[i];
				if (itemData[0] == sid) {

					/* 检查当前视频的vid是否已经存在于缓存中 */
					for (var j = 0, len = itemData[1].length; j < len; j++) {
						if (itemData[1][j][0] == vid) {
							itemData[1][j][1]['time'] = currentTime;
							break;
						}
					}
					break;
				}
			}

			//保存到本地存储
			Storage('watch_later', PlayHistory.watchLaterData);

		}
	},

	/* 
	 * 显示稍后观看或者播放记录列表
	 * 稍后观看: PlayHistory.showHistoryList('watch_later');
	 * 播放记录: PlayHistory.showHistoryList('history');
	 */
	showHistoryList: function(type) {
		if (!type) {
			type = 'history';
		}

		var historyData = Storage(type) ||[];

		if ('watch_later' === type) {
			historyData = historyData.concat(PlayHistory.updatedSids);
		}

		var html = [],
			i = 0,
			l = historyData.length,
			url,
			albumId,
			album,
			video,
			date,
			lastDate = null,
			currentDate,
			currentMonth,
			currentYear,
			now = new Date,
			nowYearMonth = now.getFullYear() + '-' + now.getMonth(),
			playedTime,
			vid;

		for (; i < l; i++) {
			albumId = historyData[i][0];
			album = historyData[i][1];
			date = new Date(historyData[i][2]);
			currentDate = date.getDate();
			currentMonth = date.getMonth();
			currentYear = date.getFullYear();

			//列表按日期显示标签
			if ((currentDate == now.getDate()) && (nowYearMonth == currentYear + '-' + currentMonth)) {
				currentDate = '今天';
			} else {
				currentDate = currentMonth + '-' + currentDate;
				if (currentYear !== now.getFullYear()) {
					currentDate = currentYear + '-' + currentDate;
				}
			}
			if ((type === 'history') && lastDate !== currentDate) {
				html.push('<time>' +currentDate  + '</time>');
			}

			//视频列表
			html.push('<dl class="item_list'+ (1 === historyData[i][3] ? ' updated' : '') +'">');

			var channeled = '';
			if ('watch_later' === type) {
				if (1 === historyData[i][3]) {
					channeled = '1211050002'; //更新提醒
				} else {
					channeled = '1211050001'; //稍后观看
				}
			} else {
				channeled = '1211050003'; //播放历史
			}

			for (var j = 0, len = album.length; j < len; j++) {
				video = album[j][1];
				playedTime = video['time'] || 0;
				vid = video['vid'];
				
				if (playedTime > 60) {
					playedTime = '已播放: ' + Util.secondsToTimeText(playedTime);
				} else {
					playedTime = '播放不到1分钟';
				}

				url = '/v' + vid + '.shtml?channeled=' + channeled;

				html.push(
					'<dd>',
						'<a sid="' + albumId + '" vid="' + vid + '" channeled="' + channeled + '" href="' + url + '" class="cover">',
							'<b style="background-image:url(' + (video['cover'] || 'about:blank') + ')"></b>',
						'</a>',
						'<p>',
							'<a sid="' + albumId + '" vid="' + vid + '" channeled="' + channeled + '" href="' + url +'">' + video['title'] + '</a>',
							'<span>' + playedTime + '</span>',
						'</p>',
						'<span class="remove"><b></b></span>',
					'</dd> '
				);
				break;
			}
			html.push('</dl>');
			lastDate = currentDate;
		}

		var elHistory = $('.' + type + '_content').html(html.join(''));

		$('a', elHistory).on('click', function(e) {
			var elTarget = $(e.currentTarget),
				sid = elTarget.attr('sid');

			PlayHistory.removeViewLaterItem(sid);
			PlayHistory.removeUpdateNotificationItem(sid);
		});

		$('.remove', elHistory).on('click', PlayHistory.deleteItem);

		//没有最近播放的时候显示空白提示
		$('.' + type + '_wrap').toggleClass('blank_list', (i < 1));

	},

	/* 移除一条稍后观看记录 */
	removeViewLaterItem: function(sid) {
		var data = PlayHistory.watchLaterData,
			result = [],
			videoData = WIN['VideoData'] || {};

		/* 检查当前视频的sid是否已经存在于缓存中 */
		for (var i = 0, l = data.length; i < l; i++) {
			var itemData = data[i];
			if (itemData[0] != sid) {
				result.push(itemData);
			}
		}

		if (videoData['sid'] == sid) {
			$('.watch_later_icon_done').removeClass('watch_later_icon_done');
		}

		PlayHistory.watchLaterData = result;
		Storage('watch_later', result);

		PlayHistory.updateNotificationNumber();

	},

	/* 移除一条更新提醒 */
	removeUpdateNotificationItem: function(sid) {

		/* 移除更新提醒，把播放记录中的集数更新为最新 */
		var historyData = $().copy(PlayHistory.historyData),
			sid,
			i = 0,
			historyDataLength = historyData.length;

		for (; i < historyDataLength; i++) {
			var dataItem = historyData[i],
				albumId = dataItem[0],
				videos = dataItem[1];

			if (albumId == sid) {
				/* 把播放记录中的对应的播放列表中的全部视频剧集数改为最新的剧集数，这样可以消除更新提醒 */
				for (var n = 0, m = videos.length; n < m; n++) {
					var lastVideoCount = videos[n][1]['latest_video_count'];
					if (lastVideoCount) {
						videos[n][1]['videoCount'] = lastVideoCount;
					}
				}
			}

		}

		/* 从更新id缓存中减去移除的更新提醒数据 */
		var updatedSids = PlayHistory.updatedSids,
			l = updatedSids.length;
		for (i = 0; i < l; i++) {
			var dataItem = updatedSids[i],
				albumId = dataItem[0];
			if (albumId == sid) {
				updatedSids.splice(i, 1);
				break;
			}
		}

		PlayHistory.historyData = historyData;
		Storage('history', PlayHistory.historyData);
	},

	/* 在编辑列表的时候删除一条稍后观看或者播放记录条目 */
	deleteItem: function() {
		var elDelete = $(this), //删除按钮
			elItem = elDelete.parent().parent(),
			elItemWrap = elItem.parent(),
			sid = $('a', elItem).attr('sid');
		
		/* 删除动画 */
		$('dd', elItem).css({
			'-webkit-transform': 'translate3d(-' + (elItem.width() + 98) + 'px,0,0)',
			'-webkit-transition': '-webkit-transform 200ms linear 0'
		}).on('webkitTransitionEnd', function() {
			elItem.remove();

			//删除历史记录
			if (elItemWrap.hasClass('history_content')) {

				for (var i = 0, l = PlayHistory.historyData.length; i < l; i++) {
					if (PlayHistory.historyData[i][0] == sid) {
						PlayHistory.historyData.splice(i, 1);
						break;
					}
				}

				//保存到本地存储
				Storage('history', PlayHistory.historyData);
				if (PlayHistory.historyData.length < 1) {
					elItemWrap.parent().addClass('blank_list');
					PlayHistory.toggleEditingState('.history_wrap');
				}

			} else {
				if (elItem.hasClass('updated')) { //删除更新提醒
					PlayHistory.removeUpdateNotificationItem(sid);
				} else { //删除稍后观看
					PlayHistory.removeViewLaterItem(sid);
				}

				if ($('dl', elItemWrap).length < 1) {
					PlayHistory.toggleEditingState('.watch_later_wrap');
					elItemWrap.parent().addClass('blank_list');
				}

				PlayHistory.updateNotificationNumber();

			}

		});

	},

	toggleEditingState: function(wrapSelector, cancelEditingState) {
		var elWrap = $(wrapSelector),
			elButton = $('.edit', elWrap);
			
		if (elWrap.hasClass('editing') || cancelEditingState) {
			elWrap.removeClass('editing');
			elButton.html('管理').addClass('white_button');
		} else {
			elButton.html('完成').removeClass('white_button');
			elWrap.addClass('editing').removeClass('clear_menu_open');
		}
	},

	showClearMenu: function() {
		var elButton = $(this),
			elItemWrap = elButton.parent().parent();

		var isMenuOpen = elItemWrap.hasClass('clear_menu_open');
		$('.watch_later_wrap').removeClass('clear_menu_open');
		$('.history_wrap').removeClass('clear_menu_open');

		elItemWrap.toggleClass('clear_menu_open', !isMenuOpen);

		PlayHistory.toggleEditingState('.watch_later_wrap', true);
		PlayHistory.toggleEditingState('.history_wrap', true);
	},

	clearMenuClick: function() {
		var elMenu = $(this),
			elItemWrap = elMenu.parent().parent().parent();


		/* 关闭清空菜单并清空对应的列表 */
		elItemWrap.addClass('blank_list').removeClass('clear_menu_open');
		if (elItemWrap.hasClass('watch_later_wrap')) {
			Storage.clear('watch_later');
			PlayHistory.watchLaterData = [];

			$('.watch_later_icon_done').removeClass('watch_later_icon_done');

			/* 从更新id缓存中减去移除的更新提醒数据 */
			var updatedSids = $().copy(PlayHistory.updatedSids),
				l = updatedSids.length;
			for (i = 0; i < l; i++) {
				var dataItem = updatedSids[i],
					albumId = dataItem[0];
				PlayHistory.removeUpdateNotificationItem(albumId);
			}

			PlayHistory.updateNotificationNumber();

		} else if (elItemWrap.hasClass('history_wrap')) {
			Storage.clear('history');
			PlayHistory.historyData = [];
		}

	},

	/* 
	 * 点击页面的时候关闭清空确认菜单
	 */
	closeClearMenu: function(e, forceClose) {
		var el = e && e.target;
		while (!forceClose && DOC !== el && DOC.body !== el) {
			if ($(el).hasClass('clear_menu clear edit')) {
				return;
			}
			el = el.parentNode;
		}
		$('.watch_later_wrap').removeClass('clear_menu_open');
		$('.history_wrap').removeClass('clear_menu_open');
	},

	/* 
	 * 点击页面的时候关闭稍后观看已满的提示菜单
	 */
	closeWatchLaterMenu: function(e, forceClose) {
		var el = e && e.target;
		while (!forceClose && DOC !== el && DOC.body !== el) {
			if ($(el).hasClass('watch_later_icon')) {
				return;
			}
			el = el.parentNode;
		}
		$('.watch_later_icon').removeClass('watch_later_menu_open');
	}


};

$().ready(PlayHistory.init);
/**
 * PV统计
 */

var IS_EXTERNAL_PLAYER;

/*  统计用的用户唯一ID */
var cookieSUV = Cookie.get('SUV'),
	cookieIPLOC = Cookie.get('IPLOC');
if (!cookieSUV || !cookieIPLOC) {
	var _suv = (+new Date)*1000+Math.round(Math.random()*1000);
	if (!cookieSUV) {
		Cookie.set('SUV', _suv, 50000, '.sohu.com');
	}
	if (!cookieIPLOC) {
		Util.loadScript('//pv.sohu.com/suv/' + _suv);
	}
}


var HDPV = {

	getLandrefer: function () {

		var landingRefer = Cookie.get('landingrefer') || '',
			refer = DOC.referrer || '';

		if (!landingRefer) {
			refer = refer.split("?")[0];
			refer = refer.split("#")[0];

			if (refer && refer.indexOf("tv.sohu.com") < 0) {
				landingRefer = refer;
				Cookie.set('landingrefer', landingRefer, 0, '.tv.sohu.com');
			}
		}

		return landingRefer;
	}, 

	sendData: function (n, i, u) {

		var isTopFrame = (top.location == self.location) ? 't' : 'f',
			topFrameLocation = '',
			suv = Cookie.get('SUV') || Cookie.get('fuid') || '';

			//框架域和顶层域不一样的时候，Chrome浏览器会报跨域错误
			try{
				topFrameLocation = (isTopFrame == 'f') ? encodeURIComponent(top.location.href) : '';
			} catch(e) {}

			var videoData = WIN['VideoData'] || {},

			pingbackURL = [
				'?url=', encodeURIComponent(location.href), 
				'&refer=', encodeURIComponent(DOC.referrer), 
				'&fuid=', suv, 
				'&yyid=', Cookie.get('YYID') || '', 
				'&showqd=', Cookie.get('showqd') || '',
				'&vid=', videoData['vid'] || '', 
				'&nid=', 
				'&trans=', $('input.trans').val() || '', 
				'&pid=', videoData['plid'] || '', 
				'&suv=', suv, 
				'&istoploc=', isTopFrame, 
				'&topurl=', topFrameLocation, 
				'&lb=0', 
				'&lf=', encodeURIComponent(HDPV.getLandrefer()), 
				'&passport=', Passport.getPassport(), 
				'&_=', (+new Date), 
				'&islogin=', DOC.cookie.indexOf('ppinf=') < 0 && DOC.cookie.indexOf('ppinfo=') < 0 && DOC.cookie.indexOf('passport=') < 0 ? 'f' : 't', 
				'&catename=',
				'&cateid=', videoData['cid'] || '', 
				'&playlistid=', videoData['plid'] || ''
			].join("");

          Util.pingback('http://z.m.tv.sohu.com/pvpb.gif' + pingbackURL);
          Util.pingback('http://pv.hd.sohu.com/pvpb.gif' + pingbackURL);
          Util.pingback([
			'http://zz.m.sohu.com/video_pv.gif?v=3&ref=', escape(DOC.referrer || '-'), 
			'&ct=', (+new Date), 
			'&_smuid=', (Cookie.get('_smuid') || '-')
          ].join(''));
	}
}

$().ready(HDPV.sendData);
$().ready(function() {
	var params = {};
	try {
		params = {
			'url': location.href,  
			'refer': DOC.referrer,  
			'uid': Trace.getUid(), 
			'webtype': '', //Trace.getConnectionType(), 
			'screen': Trace.getScreenSize(),
			'catecode': Trace.getVideoData('cateCode'), 
			'pid': Trace.getVideoData('plid'), 
			'vid': Trace.getVideoData('vid'), 
			'os': Trace.getOS(),
			'platform': Trace.getPlatform(),
			'passport': Trace.getPassport(),
			't': +new Date,
			'channeled': URL.getQueryString('channeled') || ''
		};
	} catch(e) {}

	Util.pingback('http://z.m.tv.sohu.com/pv.gif?' + $().param(params));
});


if (!IS_EXTERNAL_PLAYER) {

	WIN['_iwt_UA'] = 'UA-sohu-123456';
	Util.loadScript('http://tv.sohu.com/upload/Trace/iwt-min.js');

	Util.loadScript('http://js.mail.sohu.com/pv/pv_tv.1107251650.js');

	Util.loadScript((DOC.location.protocol == 'https:' ? 'https://sb' : 'http://b') + '.scorecardresearch.com/beacon.js', function() {
		if ('undefined' !== typeof WIN['COMSCORE']) {
			WIN['COMSCORE']['beacon']({
				'c1': '2', 
				'c2': '7395122', 
				'c3': '', 
				'c4': '', 
				'c5': '', 
				'c6': '', 
				'c15': ''
			}); 
		}
	});

	//体育频道单独统计代码
	if ('m.s.sohu.com' === location.host) {
		$().ready(function() {
			Util.loadScript('http://js.sohu.com/wrating20120726.js', function() {
				var  _wratingId;
				try{
					_wratingId = WIN['_getAcc']();
				} catch(e) {}

				if (_wratingId) {
					Util.loadScript('http://sohu.wrating.com/a1.js', function() {
						WIN['vjAcc'] = _wratingId;
						WIN['wrUrl'] = 'http://sohu.wrating.com/';
						try{
							if (true === WIN['vjValidateTrack']()) {
								var imageUrl = WIN['wrUrl'] + 'a.gif' + WIN['vjGetTrackImgUrl']();
								$(DOC.body).append('<div style="display:none"><img src="' + imageUrl + '" id="wrTagImage" /></div>');
								WIN['vjSurveyCheck']();
							}
						} catch(e) {}
					});
				}
			});
		});
	} else {
		Util.loadScript('http://tv.sohu.com/upload/Trace/wrating.js');
	}
}
/**
 * 视频播放统计
 */

var VideoTrace = {

	t: (+new Date),

	playId: (+new Date), //播放开始时候发playcount时的时间戳

	inited: false,

	init: function() {

		//pt=4： html5-ipad播放
		//pt=41：html5-iphone播放
		//pt=42：html5-android播放
		//pt=43：html5-windows播放
		//pt=44：html5-其它平台播放

		var platType = 44,
			videoData = WIN['VideoData'],
			qcPlat = '';
			
		if (IsIPad) {
			platType = 4;
			qcPlat = '1h5';
		} else if (IsIPhone) {
			platType = 41;
			qcPlat = '3h5';
		} else if (IsAndroid) {
			platType = 42;
			qcPlat = '6h5';
		} else if (IsWindowsPhone) {
			platType = 43;
			qcPlat = '11h5';
		} else if (IsIEMobile) {
			platType = 43;
		}

		VideoTrace.qcPlat = qcPlat;
		VideoTrace.platType = platType;
		VideoTrace.qfDomain = ((Math.random() > .5) ? 'qf1' : 'qf2') + '.hd.sohu.com.cn';

		VideoTrace.qcURL = (null !== URL.getQueryString('r') && videoData) ? 
			'http://sptjs1.hd.sohu.com.cn/h5/tttst.html' : 
			'http://qc.hd.sohu.com.cn/caton/video/';

		VideoTrace.inited = true;
	},

	qcPingback: function(paramaString) {
		if (false === VideoTrace.inited) {
			VideoTrace.init();
		}

		if ('1h5' == VideoTrace.qcPlat) {
			return;
		}

		var qcOS = '',
			model = '',
			videoData = WIN['VideoData'],
			videoSrc = WIN['VideoData']['video_src'] || '';

		if (IsIOS) {
			qcOS = 1;
		} else if (IsAndroid) {
			qcOS = 2;
		} else if (IsWindowsPhone) {
			qcOS = 3;
		}

		if (IsIPad) {
			model = 'ipad';
		} else if (/iPod/i.test(UA)) {
			model = 'ipod';
		} else if (IsIPhone) {
			model = 'iphone';
		} else if (IsWindowsPhone) {
			model = 'windowsphone';
		}

		var videoType = '';
		if (videoSrc.match(/\.m3u8/i)) {
			videoType = 'm3u8';
		}else if (videoSrc.match(/\.mp4/i)) {
			videoType = 'mp4';
		}

		paramaString += [
			'&uid=', Cookie.get('SUV') || '', 
			'&poid=',
			'&plat=', VideoTrace.qcPlat, // iPad: 1h5 Androd: 6h5
			'&sver=', 
			'&os=', qcOS,
			'&sysver=', Util.getOSVersion(),
			'&net=', Trace.getConnectionType(), 
			'&playmode=',
			'&vid=', videoData['vid'] || '', 
			'&sid=', videoData['sid'] || '', 
			'&vtype=', videoType, 
			'&pn=', model,  
			'&duFile=', encodeURIComponent(videoSrc), 
			'&version=', WIN['VideoData']['videoVersion'] || 0,  
			'&isp2p=0', 
			'&ltype=0', 
			'&time=', (+new Date)
		].join('');

		Util.pingback(VideoTrace.qcURL + '?' + paramaString);
	},

	qfPingback: function(paramaString) {
		if (false === VideoTrace.inited) {
			VideoTrace.init();
		}

		var videoData = WIN['VideoData'];

		paramaString += [
			'&seekto=0',
			'&pt=', VideoTrace.platType, 
			'&sid=', Cookie.get('SUV') || '', 
			'&vid=', videoData['vid'] || '', 
			'&nid=',
			'&ref=', encodeURIComponent(location.href), 
			'&dom=',
			'&t=', VideoTrace.t++
		].join('');

		Util.pingback('http://' + VideoTrace.qfDomain + '/dov.do?method=stat' + paramaString);
	},

	DMPingback: function(paramaString) {

		var sid = Cookie.get('SUV') || '',
			videoData = WIN['VideoData'];
			
		paramaString += [
			'&sid=', sid, 
			'&uid=', sid,
			'&ua=h5',
			'&vid=', videoData['vid'] || '', 
			'&nid=',
			'&pid=', videoData['plid'] || '',
			'&catcode=', videoData['cateCode'] || '',
			'&url=', encodeURIComponent(location.href),
			'&refer=', encodeURIComponent(DOC.referrer),
			'&isHD=0',
			'&isp2p=0',
			'&type=vrs',
			'&systype=0',
			'&cateid=', videoData['cid'],
			'&apikey=', API_KEY,
			'&trans=', $('input.trans').val() || '', 
			'&_smuid=', (Cookie.get('_smuid') || '-'), //手搜uid
			'&userid=&t=', VideoTrace.t++
		].join('');

		Util.pingback('http://z.m.tv.sohu.com/' + paramaString + '&channeled=' +(URL.getQueryString('channeled') || ''));

		paramaString += '&pvid=', URL.getQueryString('pvid') || '';
		Util.pingback('http://pb.hd.sohu.com.cn/' + paramaString);

	},

	DMPingbackNew: function(params, url) {

		params = $().extend({
			'url': location.href,  
			'refer': DOC.referrer,  
			'uid': Trace.getUid(), 
			'webtype': Trace.getConnectionType(), 
			'screen': Trace.getScreenSize(),
			'catecode': Trace.getVideoData('cateCode'), 
			'pid': Trace.getVideoData('plid'), 
			'vid': Trace.getVideoData('vid'), 
			'cateid': Trace.getVideoData('cid'), 
			'ltype': Trace.getVideoData('ltype'), 
			'company': Trace.getVideoData('company'), 
			'version': '0', 
			'type': ('9001' == Trace.getVideoData('cid') ? 'my' : 'vrs'), 
			'td': Trace.getVideoData('duration'), 
			'apikey': API_KEY,
			't': +new Date,  
			'os': Trace.getOS(),
			'platform': Trace.getPlatform(),
			'passport': Trace.getPassport(),
			'channeled': URL.getQueryString('channeled') || '',
			'playid': VideoTrace.playId
		}, params);

		Util.pingback((url || 'http://z.m.tv.sohu.com/vv.gif') + '?' + $().param(params));
	},

	vv: function() {

		var videoData = WIN['VideoData'];

		//qf
		VideoTrace.qfPingback('&error=0&code=2&allno=0&vvmark=1&totTime=' + videoData['duration']);

		//Comscore vv pingback
		Util.pingback('http://b.scorecardresearch.com/b?c1=1&c2=7395122&c3=&c4=&c5=&c6=&c11=' + (Cookie.get('SUV') || ''));

		//DM*
		VideoTrace.DMPingback(['hdpb.gif?',
				'msg=playCount',
				'&cts=isow',
				'&time=0',
				'&ltype=',videoData['ltype'] || 0,
				'&company=', videoData['company'] || '',
				'&td=', videoData['duration']
			].join(''));

		VideoTrace.playId = +new Date;

		VideoTrace.DMPingbackNew({
			'msg': 'playCount',
			'time': '0'
		});

		VideoTrace.qcPingback('code=10&duation=0');
	},

	realVV: function(startPlayTime) {
		var duation = startPlayTime ? (((+new Date) - startPlayTime) / 1000) : 0,
			videoData = WIN['VideoData'];

		VideoTrace.DMPingback(['hdpb.gif?',
				'msg=videoStart',
				'&cts=isow',
				'&time=0',
				'&ltype=',videoData['ltype'] || 0,
				'&company=', videoData['company'],
				'&td=', videoData['duration']
			].join(''));

		VideoTrace.DMPingbackNew({
			'msg': 'videoStart',
			'time': ((+ new Date) - VideoTrace.playId) / 1000
		});

		VideoTrace.qcPingback('code=5&duation=' + duation);
	},

	/* 视频第一次开始播放的事件，同一视频观看完毕后再次播放会再次触发这个事件 */
	start: function() {
		var videoData = WIN['VideoData'];
		ClickTrace.pingback(null, 'video_play_start', JSON.stringify({
			'vid': videoData['vid']
		}));
		VideoTrace.qcPingback('code=15');
	},

	/* 视频播放心跳（2分钟一次） */
	heart: function(time) {
		VideoTrace.DMPingback('stats.gif?tc=' + time);

		VideoTrace.DMPingbackNew({
			'tc' : time
		}, 'http://z.m.tv.sohu.com/playtime.gif');
	},

	/* 视频播放完毕 */
	ended: function(time, bufferCount) {
		VideoTrace.DMPingback('hdpb.gif?msg=videoEnds&tc=' + time);

		VideoTrace.DMPingbackNew({
			'msg': 'videoEnds',
			'time': time
		});

		VideoTrace.qcPingback('code=7&duration=' + time + '&ct=' + bufferCount);
	},

	/* 视频中断 */
	abort: function() {
		//VideoTrace.qfPingback('&code=4&error=800&allno=1&drag=-1');
	},

	/* 播放错误 */
	error: function(startPlayTime) {
		VideoTrace.qfPingback('&error=500&code=2&allno=1&vvmark=0');
		VideoTrace.qcPingback('code=8&duation=' + 
			(((+new Date) - startPlayTime) / 1000) + 
			'&error=' + (!WIN['VideoData']['video_src'] ? '401' : '1000'));
	},

	/* 缓冲 */
	buffer: function(bufferCount, startPlayTime) {
		var duation = ((+new Date) - startPlayTime) / 1000;
		if (1 == bufferCount || 4 == bufferCount) {
			VideoTrace.qfPingback('&code=5&bufno=1&allbufno=' + bufferCount);
		}

		VideoTrace.qcPingback('code=' + ((bufferCount == 1) ? 6 : 4) + 
				'&ct=' + bufferCount + 
				'&duation=' + duation);

		/* 首次卡顿触发自动测试 */
		if ((null !== URL.getQueryString('r')) && (1 == bufferCount)) {
			if ('undefined' !== typeof RateTest) {
				RateTest.startTest('auto');
			}
		}
	}

};
/**
 * 视频前贴片广告
 * @autohr qianghu
 */
 

var AdData;

var PlayerAd = {

	init: function() {

			var videoData = WIN['VideoData'] || {},
				AdAPI = ENABLE_DEBUG ? 
				//'/test/ad.json?'
				'http://60.28.168.195/h?'
				 : 'http://m.aty.sohu.com/h?';

			/*
			  plat: {iPad:h1|iPhone: h3}
			  pn: {ipad|iphone}
			 */
			AdURL = AdAPI + [
					'plat=h1&sysver=', Util.getOSVersion(),
					'&pn=ipad',
					'&pt=oad',
					'&cat=', videoData['cmsId'] || '1',
					'&al=', videoData['plid'] || '',
					'&vid=',videoData['vid'] || '', 
					'&tvid=',videoData['tvid'] || '', 
					'&c=', videoData['channelId'] || '',
					'&du=', videoData['duration'] || 0,
					'&ar=', videoData['areaId'] || '', 
					'&vc=', videoData['cateCode'] || '', 
					'&json=std&tuv=', Cookie.get('TUV') || '', 
					'&callback=PlayerAdLoaded&pageUrl=', escape(location.href), 
					'&_t=', (+new Date)
				].join('');

		Util.loadScript(AdURL);

		WIN['PlayerAdLoaded'] = PlayerAd.AdLoaded;
	},

	/**
	 * 广告数据加载完成后的回调
	 * @function
	 */
	AdLoaded: function(data) {
		var oadData = data && data['data'] && data['data']['oad'] && data['data']['oad'][0];

		if (oadData) {
			if (oadData[3]) {
				Util.pingback(oadData[3]);
			}
			if (oadData[0]) {
				AdData = {
					'src': oadData[0],
					'time': oadData[1],
					'url': oadData[2],
					'load': oadData[3],
					'end': oadData[5],
					'click': oadData[6]
				};

				/* 触发广告数据加载完成的通知 */
				Notification.fire('playerAdLoaded', AdData);
			}
		}
	}
};

if (IsIPad) {
	PlayerAd.init();
}
/**
 * 视频播放器
 * @autohr qianghu
 */

/*
 * MyTV
 * http://my.tv.sohu.com/videinfo.jhtml?m=viewnew&vid={vid}
 * m3u8
 * http://my.tv.sohu.com/ipad/{vid}.m3u8;
 * 
 * TV
 * http://hot.vrs.sohu.com/vrs_flash.action?var=hotParam&gbk=true&vid={vid}&pid={pid}
 * m3u8
 * http://hot.vrs.sohu.com/ipad{vid}.m3u8;
 * 
 * open api mp4
 * http://api.tv.sohu.com/video/playinfo/{vid}.json?api_key=f351515304020cad28c92f70f002261c&from=mweb
 * 
 * 低码流整段mp4目标设备是 低于4.2的iOS，所有的Android和Windows Phone，以及其他
 * 
 * 前贴片广告
 * 
 */

var MainPlayer;

var Player = function(selector) {

	/* 
	 * ====================
	 * DOM对象定义
	 * ====================
	 */

	var elPlayer = $(selector),
		useClientPlay = false,  //是否调用客户端播放
		useCoverMaskPlay = false, //小米1代，使用<video>标签触发的播放行为
		useFlash = !IsAndroid && !IsIOS && !IsWindowsPhone && !IsIEMobile && !IsBlackBerry/* 黑莓不使用flash */,/* 使用Flash播放器 */
		useVideoLink = false,
		isSupportPlayVideoInline = IsIPad || !IsIPhone, /* 视频是否支持在页面中内嵌播放, 默认iPad支持，iPhone不支持 */
		disableFullscreen = false, /* 是否禁用全屏，对于全屏兼容不好的浏览器，这个值设为true */

		videoData,

		/* 显示下载App的提示 */
		showDownloadClientTip = function() {
			//在客户端内部不显示提示
			if (URL.getQueryString('clientType')) {
				return;
			}
			var elMessage = $('.player_message');
			if (elMessage.length < 1) {
				/* 显示下载客户端提示，点击下载链接的时候发送统计数据 */
				$('<a class="player_message" position="appdownload_inplayer"><span class="button">下载</span>如果视频无法正常播放，<br />请点击下载搜狐视频客户端</a>')
				.on('click', Util.appLink)
				.insertAfter(elPlayer);
			}
		};

	//低端浏览器，使用视频源链接播放（比如QQ浏览器）
	var browserVersion;
	if (browserVersion = UA.match(/MQQBrowser(?:\/([0-9\._]+))?/i)) {
		/* 处理版本号，只保留第一个小数点 2.5.1 -> 2.5*/
		browserVersion = Util.getVersionNumber(browserVersion[1]);
		if (browserVersion < 4.3) {
			useVideoLink = true;
		}
	}

	if (IsAndroid) {
		/* UC的版本号在UA中没有，在appVersion中有 */
		var appVersion = navigator['appVersion'] || '';
		if ((appVersion).match(/UC\/8\.7/i)) {
			useVideoLink = true;
		}

		/* 索尼 LT26w，Android 4.1.2,QQ 4.4浏览器的video标签在iframe中时会浮动在父页面上面 */
		if (UA.match(/LT26w.+ MQQBrowser/i)) {
			useVideoLink = true;
		}
	}

	if (elPlayer.length < 1) return;

	var playUseFlash = function() {
		var flashObj,
			flashVersion;

		if (IsIE) {
			flashObj = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
			if (flashObj) {
				flashVersion = parseInt(flashObj['GetVariable']('$version').split(' ')[1].split(',')[0], 10);
			}
		} else {
			var plugins = WIN['navigator']['plugins'];
			if (plugins && plugins.length > 0) {
				flashObj = plugins['Shockwave Flash'];
				if (flashObj) {
					var descs = flashObj['description'].split(' ');
					for (var i = 0, l = descs.length; i < l; i++) {
						var _version = parseInt(descs[i], 10);
						if (!isNaN(_version)) {
							flashVersion = _version;
						}
					}
				}
			}
		}

		if (flashVersion) {

			Util.loadScript('http://js.tv.itc.cn/base/plugin/swfobject13072501.js', function() {

				if ('9001' == videoData['cid']) {
					var flashPlayer = new SWFObject('http://share.vrs.sohu.com/my/v.swf&showRecommend=0&autoplay=true&sogouBtn=0&shareBtn=0&topBarFull=0&topBar=0&topBarNor=0&skinNum=8&topBarFull=0&id=' + 
							videoData['vid'] + 
							'&api_key=' + API_KEY,
							'sohuplayer', '100%', '100%', '9,0,115', '#000000');
				} else {

					var vrsPlayer = 'http://tv.sohu.com/upload/swf/20131104/Main.swf',
						flashPlayer = new SWFObject(vrsPlayer, "sohuplayer", "100%", "100%", "9,0,115", "#000000");

					flashPlayer['addVariable']("skinNum", "1");
					flashPlayer['addVariable']("pageurl", location.href);
					flashPlayer['addVariable']("vid", videoData['vid']);
					flashPlayer['addVariable']("pid", videoData['pid']); 
					flashPlayer['addVariable']("nid", ''); 
					flashPlayer['addVariable']("seekTo", "0"); 
					flashPlayer['addVariable']("jump", "0"); 
					flashPlayer['addVariable']("autoplay", "true");
					flashPlayer['addVariable']("showRecommend", "0");
					flashPlayer['addVariable']("sid", Cookie.get('SUV') || '');
					flashPlayer['addVariable']('api_key', API_KEY);
				}
				flashPlayer['addParam']("allowscriptaccess", "always");
				flashPlayer['addParam']("allowfullscreen", "true");
				flashPlayer['flashVars'] = '';

				var html = flashPlayer['getFlashHtml']();

				elPlayer.addClass('flash_player');
				$('.video', elPlayer).html(html);
				
			});
			return true;
		}
		return false;
	};

	var URLParms = URL.getQueryData(location.search.substring(1));
	if (1 == URLParms['startClient']) {
		/* 使用URL强制使用客户端播放 */
		useClientPlay = IsAndroid;
	} else if (1 == URLParms['useVideoLink']) {
		/* 使用URL强制使用视频链接 */
		useVideoLink = true;
	}

	var videoAttr = ' poster ',
		playerClasses = [],
		/* 是否是魅族手机 */
		isMeizu = false;

	//HTC的这个手机播放某些mp4视频只能播放3分钟，强制使用客户端播放
	if (UA.match(/ HTC Desire S /i)) {
		useClientPlay = true;
	} else if (Util.isMeizu()) {
		/* 魅族M9和M1的video的play方法无效，只显示video标签 */
		useVideoLink = true;
	}
	if (UA.match(/MI\-ONE/i)) {
		isSupportPlayVideoInline = false;
		playerClasses.push('hide_fullscreen');
	}

	if (UA.match(/MI\-ONE|GT\-I9100/i) && !UA.match(/MI\-ONE Plus/i)) {
		playerClasses.push('hide_init_video');
 	}

	/* 海信手机的video播放框高度会依照视频比例自动变动尺寸，所以父对象高度需要用video的高度撑起来 */
	if (IsUC && UA.match(/HS\-U950/i)) {
		playerClasses.push('auto_height');
	}

	/* Android中外嵌浏览器的全屏按钮只有第一次点击起作用，所以还是隐藏了吧  */
	if (IS_EXTERNAL_PLAYER || UA.match(/HTC S720/i)) {
		playerClasses.push('hide_fullscreen');
	}

	if (IsUC) {
		videoAttr += ' controls ';
	}

	//QQ浏览器HD版，UA是Mac桌面系统UA，但是无法正常播放视频，显示下载客户端提示
	if (IsAndroid && UA.match(/Mac OS X/i) && !UA.match(/ UC(Browser)?/i)) {
		/* 魅族手机自带浏览器的UA是iPhone的UA，所以只能通过屏幕尺寸来判断了 */
		if (Util.isMeizu()) {
			useVideoLink = true;
		} else {
			showDownloadClientTip();
			disableFullscreen = true;
			playerClasses.push('show_slider_bar');
		}
	}

	if (playerClasses.length > 0) {
		elPlayer.addClass(playerClasses.join(' '));
	}

	if (UA.match(/MI\-ONE Plus/i)) {
		if (Util.getOSVersion() >= 4) {
			useCoverMaskPlay = true;
		} else {
			/* Android 2.x上小米自带浏览器不自动播放 */
			isAutoPlay = false;
		}
	}

	if (useCoverMaskPlay) {
		$(DOC.body).addClass('cover_mask_play');
	}

	var elVideoWrap = $('.video', elPlayer).append('<video' + videoAttr + '></video>'), 
		elVideo = $('video', elVideoWrap),
		videoTag = elVideo.get(0), /* 视频<video>标签 */

		elPoster = $('.poster', elPlayer), /* 视频占位图 */
		elDuration = $('.duration', elPlayer), /* 视频总时长 */
		elCurrent = $('.current_time', elPlayer), /* 视频播放时间 */
		elTrackbar = $('.trackbar', elPlayer), /* 视频播放进度条容器 */
		elPlayed = $('.played', elPlayer), /* 视频播放进度条 */
		elBuffered = $('.buffered', elPlayer), /* 视频载入进度条 */
		elButtonPlay = $('.button_play', elPlayer), /* 播放/暂停按钮 */
		elPlayerControls = $('.player_controls', elPlayer), /* 播放按钮容器 */
		elFullscreen = $('.fullscreen', elPlayer), /* 全屏按钮 */
		elVideoQuality = $('.video_quality', elPlayer),  /* 切换播放质量按钮 */

		useMp4 = false, /* 是否使用mp4播放 */

		videoURLs = [], /* 实际播放的视频源地址，同一格式的不同质量版本 */

		/* 
		 * 视频格式是否支持
		 */
		isVideoFormatSupported = true,

		AdData, /* 广告数据 */
		isPlayingAd = false, /* 是否正在播放广告数据 */
		isAdPlayed = false,
		elAdTimer = $('<div class="ad_timer"></div>').appendTo(elPlayer),

		getPlayURL = function() {

			if (true === isPlayingAd) {
				return AdData['src'];
			}

			var videoURL,
				_videoURLs,
				videoVersion = 0, //视频版本 0：普清 1：高清 21：超清；31：原画
				videoURLData = videoData['urls']; /* 包含m3u8和mp4地址的数据 */
				

			videoURLs = [];

			if (useMp4) { //播放Mp4

				videoURL = Util.getDownloadURL(videoURLData['downloadUrl']) || videoURLData['mp4'];

				/* 从mp4数组中取到第一个不为空的播放地址 */
				if (videoURL instanceof Array) {
					for (var i = 0, l = videoURL.length; i < l; i++) {
						if (videoURL[i]) {
							videoURL = videoURL[i];
							break;
						}
					}
				}

				//如果没有整段mp4地址，使用分段mp4播放
				if (videoURL) {
					videoURL = (videoURL + '').split(',')[0];
				}

				videoURLs.push(videoURL);

			} else { //播放m3u8

				_videoURLs = videoURLData['m3u8'];
				for (var i = 0, l = _videoURLs.length; i < l; i++) {
					if (_videoURLs[i]) {
						videoURLs.push(_videoURLs[i]);
						break;
					} 
				}

				/* iPad和大屏幕设备播放更清晰的视频 */
				if (videoURLs.length > 2 && (IsIPad || WIN['screen']['width'] > 768)) {
					videoURLs.shift();
				}

				if (videoURLs.length >= 2) {
					/* 从本地存贮中获取播放质量设置 */
					var quality = Storage('quality');
					if ('hq' === quality) {
						elVideoQuality.removeClass('video_quality_fast').addClass('video_quality_hq');
						videoURL = videoURLs[1];
						videoVersion = 21;
					} else {
						elVideoQuality.addClass('video_quality_fast').removeClass('video_quality_hq');
						videoURL = videoURLs[0];
						videoVersion = 1;
					}

				} else {
					videoURL = videoURLs[0];
				}
			}

			elVideoQuality.css('display', (videoURLs.length >= 2) ? 'block' : 'none');
			WIN['VideoData']['video_src'] = videoURL;
			WIN['VideoData']['videoVersion'] = videoVersion;
			return  videoURL;
		},

		/*
		 * 无法播放视频的时候，显示一个视频源的链接
		 */
		playUseVideoLink = function() {
			isVideoFormatSupported = false;
			//$('.message p', elPlayerControls).html('<a href="' + WIN['VideoData']['video_src'] + '">请点击播放视频</a>');
			//elPlayerControls.attr('class', 'player_controls disabled show_message');
		};

	if (IsIOS) { /* iOS 4.2以下播放mp4 */
		if (Util.getOSVersion() >= 4.2) {
			useMp4 = false;
		}
	}

	if (IsAndroid || IsWindowsPhone || UA.match(/BB10|BlackBerry/i)) {
		useMp4 = true;
	}

	if (useClientPlay) {
		useMp4 = false;
	}

	/* 测试代码，可以在URL中使用f=m3u8参数强制打开m3u8格式 */
	var format = URL.getQueryString('f');
	if (format) {
		useMp4 = !('m3u8' === format);
	}

	/* 
	 * ====================
	 * 广告
	 * ====================
	 */

	Notification.reg('playerAdLoaded', function(adData) {
		if (isPlayed) {
			return;
		}
		AdData = adData;

		isPlayingAd = true;

		videoTag.src = getPlayURL();
		videoTag.play();
	});

	/* 
	 * ====================
	 * 播放器状态变量
	 * ====================
	 */
	var 

		/* 
		 * 视频meta data是否已经加载完成
		 */
		isMetadataLoaded = false,


		isSwitchingSrc = false,
		timeToSwitch = 0,

		/*
		 * 缓冲次数
		 */
		bufferCount = 0,

		/*
		 * 播放错误时的重试次数
		 */
		onErrorRetryTime = 0,

		/* 
		 * 视频是否在缓冲
		 */
		isWaiting = false,

		/* 
		 * 标记是否是开始播放视频时候的缓冲，在play事件中置为True, 
		 * 在waiting中置为False，此变量用来判断视频播放中的网络原因造成的卡顿
		 */
		isFirstWaitingAfterPlaying = false,

		/* 
		 * 标记是否是开始播放视频后的第一次时间更新 
		 * Android下使用
		 */
		isFirstTimeUpdateAfterPlaying = false,

		/* 
		 * 是否处于重定位时间
		 */
		isSeeking = false,

		/* 
		 * 视频是否已经播放，在第一次开始播放的时候把此值设为TRUE
		 */
		isPlayed = false,

		/* 
		 * 视频是否在播放状态（这个值用来标记用户的操作，由于网络延迟使视频停止的时候不改变这个值）
		 */
		isPlaying = false,

		/* 
		 * 影片长度值（用作缓存）
		 */
		lastDuration = 0,

		/* 
		 * 影片当前播放进度（用作Anddroid下判断影片是否播放完毕）
		 */
		lastCurrentTime = 0,

		/* 
		 * 上次卡顿的时间（用作判断一秒内的卡顿不重复计算）
		 */
		lastWaitingTime = 0,

		/* 
		 * 自动隐藏播放控制按钮的定时器
		 */
		idleTimer,

		/* 
		 * 在onplaying事件中触发onwaiting事件的的定时器
		 */
		waitingTimer,

		/* 
		 * 在ontimeupdate事件中检查视频是否正在播放的定时器(仅Android)
		 */
		checkPlayingStateTimer,

		/* 
		 * 发送心跳统计的定时器
		 */
		heartTimer,

		/* 
		 * 开始播放视频的时间
		 */
		startPlayTime = 0,

		/* 
		 * 是否自动播放
		 */
		isAutoPlay = true,

	/* 
	 * ====================
	 * 播放器方法
	 * ====================
	 */

		/*
		 * 按比例调整播放器大小
		 * 播放器宽度小于等于320时比例为4:3，播放器宽度大于320播放器比例为16:9
		 */
		resize = function() {
			var playerWidth = elPlayer.width();
			elPlayer.css('height', playerWidth / 16 * (playerWidth <= 480 ? 10 : 9) + 'px');
		},

		/*
		 * 调用Sohu视频客户端播放视频
		 */
		playInClient = function() {

			var stateTimer = setTimeout(function() {
				VideoTrace.realVV(+new Date);
			}, 250);

			//Android客户端
			var url = 'sohuvideo://vid=' + videoData['vid'] + '&sid=' + videoData['plid'] + 
				'&m3u8=' + encodeURIComponent(getPlayURL()) +
				'&title=' + encodeURIComponent($('.video_detail h3').html());

			//在客户端内部，使用location跳转触发Action，不然在某些机型上无法调起
			if (URLParms['clientType'] || (1 == URLParms['startClient'])) {
				location.href = url;
				return;
			}

			/* 如果手机上没有安装搜狐视频客户端，使用location.href跳转会显示404页面，为了不跳转页面，创建一个iframe来接收action协议url */
			if ($('#play_in_app').length < 1) {
				$('<iframe id="play_in_app" frameborder="0" name="play_in_app" width="0" height="0"></iframe>')
					.on('load', showDownloadClientTip)
					.appendTo(DOC.body);
			}

			/* 创建一个表单，把action协议url提交到iframe中，如果安装了客户端，提交这个表单会调起客户端 */
			$('<form action="' + url +'" target="play_in_app"></form>').appendTo(DOC.body).trigger('submit');
		},

		play = function(e) {

			if (useClientPlay) {
				return playInClient();
			}

			if (IS_EXTERNAL_PLAYER) {
				videoTag['volume'] = .08;
			}

			if (IsAndroid) {
				/* 这个手机要全屏播放，不然会一直加载状态 */

				if (UA.match(/HS\-U950|HUAWEI_C8812|vivo/i) && !IsUC && !IsQQBrowser) {
					videoTag['play']();
					try {
						videoTag['webkitEnterFullscreen'] && videoTag['webkitEnterFullscreen']();
						videoTag['mozRequestFullScreen'] && videoTag['mozRequestFullScreen']();
					} catch(e) {}
				}
			}

			videoTag['play']();
			
			e && e.stopPropagation();
		},

		pause = function() {
			videoTag['pause']();
		},

		playOrPause = function(e) {
			if (elPlayerControls.hasClass('hidden') || false === isVideoFormatSupported) {
				return;
			}

			if ((true === videoTag['paused'] && !isWaiting) || !isSupportPlayVideoInline) {
				play(e);
			} else {
				if (isPlayingAd) return;
				videoTag['pause']();
			}

			e.stopPropagation();
		},

		/**
		 * 点击全屏按钮，进入全屏播放
		 * @function
		 */
		enterFullscreen = function(e) {
			/* 不支持全屏的视频 */
			if (!elPlayer.hasClass('inline_player')) {
				return;
			}

			/* 开始播放后才可以全屏 */
			videoTag['play']();


			videoTag['webkitEnterFullscreen'] && videoTag['webkitEnterFullscreen']();
			videoTag['mozRequestFullScreen'] && videoTag['mozRequestFullScreen']();

			setTimeout(function() {
				videoTag['play']();
			}, 0);

			e.stopPropagation();
		},

		/**
		 * 切换播放质量
		 * @function
		 */
		changeQuality = function(e) {

			if (videoURLs.length < 2) return;

			timeToSwitch = videoTag['currentTime'];

			/* 切换播放质量的时候时间倒退3秒重新开始播放 */
			if (timeToSwitch > 3) {
				timeToSwitch -=3;
			}
			isSwitchingSrc = true;
			lastCurrentTime = -1;

			if (elVideoQuality.hasClass('video_quality_fast')) {
				elVideoQuality.removeClass('video_quality_fast').addClass('video_quality_hq');
				videoTag.src = videoURLs[1];

				/* 把播放质量设置保存到本地存贮 */
				Storage('quality', 'hq');
			} else {
				elVideoQuality.addClass('video_quality_fast').removeClass('video_quality_hq');
				videoTag.src = videoURLs[0];

				/* 把播放质量设置保存到本地存贮 */
				Storage('quality', 'fast');
			}

			/* 显示加载动画，此动画会在切换后的playing事件中清除 */
			onWaiting();

			e.stopPropagation();
		},

		clearPlayingStateTimer = function() {
			if (checkPlayingStateTimer) {
				clearTimeout(checkPlayingStateTimer);
				checkPlayingStateTimer = null;
			}
		},

		/**
		 * 当播放界面被点击时
		 * 1. 如果视频未开始播放则开始播放视频，并在3秒后隐藏播放按钮
		 * 2. 如果视频已经开始播放则即时切换播放控制按钮的显示和隐藏
		 * @function
		 */
		onControlsClick = function(e) {
			if (useClientPlay) {
				return playInClient();
			}


			if (false === isVideoFormatSupported) {
				VideoTrace.realVV(+new Date);
				setTimeout(function() {
					window.top.location.href = WIN['VideoData']['video_src'];
				}, 50);
				return false;
			}

			if (isPlayingAd) {
				if (isPlaying) {
					Util.pingback(AdData['click']);
					videoTag['pause']();
					WIN.open(AdData['url']);
				} else {
					play(e);
				}
				return;
			}

			if (isSupportPlayVideoInline) {

				if (elPlayerControls.hasClass('hidden')) {

					//显示控制按钮，并定时4秒后自动隐藏
					elPlayerControls.removeClass('hidden');
				} else {
					//隐藏控制按钮
					if (true === isPlaying) {
						elPlayerControls.addClass('hidden');
					}
				}

				clearTimeout(idleTimer);
				idleTimer = setTimeout(function() {
					if (true === isPlaying) {
						elPlayerControls.addClass('hidden');
					}
				}, 3500);

				if (false === isPlaying) {
					play(e);
				}

			} else {
				play(e);
			}
		},

		/**
		 * 事件，当视频的播放状态改变时触发
		 * @function
		 */
		onPlayOrPause = function() {

			clearTimeout(idleTimer);
		
			//开始播放
			if (false === videoTag['paused']) {

				if (elPlayer.hasClass('player_init')) {
					elPlayer.removeClass('player_init');

					/* 用于站外内嵌播放器的时候，用户点击的时候才算vv */
					if (IS_EXTERNAL_PLAYER) {
						VideoTrace.vv();
					}
					VideoTrace.start();
					Notification.fire('playerOnStart', videoData);
				}

				Notification.fire('playerOnPlay', videoData);

				//elButtonPlay.addClass('button_pause');

				if (!IsAndroid || isSupportPlayVideoInline) {
					elPlayerControls.addClass('loading');
				}

				if (isSupportPlayVideoInline) {
					elPoster.addClass('hidden');
				}

				if (isPlayingAd) {
					elPlayer.addClass('player_ad');
				}

				isPlaying = true;
				isPlayed = true;
				isWaiting = true;
				isFirstWaitingAfterPlaying = true;

				startPlayTime = +new Date;

			} else {
				onPause();
			}
		},

		onPause = function() {
			//停止播放
			isPlaying = isWaiting = false;

			//elPlayerControls.removeClass((!isSupportPlayVideoInline ? 'hidden ' : 'hidden ') + 'loading');
			elPlayerControls.removeClass('hidden loading');
			if (!isSupportPlayVideoInline) {
				elPoster.removeClass('hidden');
			}
			elButtonPlay.removeClass('button_pause');
			elPlayer.addClass('player_pause');

			if (waitingTimer) {
				clearTimeout(waitingTimer);
				waitingTimer = null;
			}

			Notification.fire('playerOnPause', videoData);
		},

		/**
		 * 事件，当视频播放结束时触发
		 * @function
		 * @param {Boolean} isVideoUnload 可选，如果为true，是在连播的时候视频非自然结束，不发送视频结束的统计
		 */
		onEnd = function(e, isVideoUnload) {
			/* 恢复视频播放器的原始状态 */

			/* 某些Android不触发onparse事件，直接onend了 */
			if (true == isPlaying) {
				onPause();
			}

			elPlayed.css('width', 0);
			isPlayed = false;
			isMetadataLoaded = false;
			isFirstWaitingAfterPlaying = false;
			onErrorRetryTime = 0;
			elCurrent.html(Util.secondsToTime(0));

			/* 播放完广告播放正片 */
			if (isPlayingAd) {
				isPlayingAd = false;

				Util.pingback(AdData['end']);

				elPlayer.removeClass('player_ad');
				videoTag.src = getPlayURL();
				setTimeout(function() {
					videoTag['play']();
					updateBufferedRange();
				}, 0);
				return;
			}

			/* 如果停止播放的时候距离结束小于15秒，视为已经播放完毕 */
			if (/*0 === lastCurrentTime || */
				(
					lastCurrentTime > 0 /* 某些Android播放完毕后lastCurrentTime会置为0 */ 
					&& (lastCurrentTime >= videoTag['duration'] - 15)
				)
			) {
				if (!isVideoUnload) {
					VideoTrace.ended(videoTag['currentTime'], bufferCount);
					Notification.fire('playerOnEnd', videoData);
				}
			}

			lastCurrentTime = 0;
			bufferCount = 0;

			/* 播放结束后时间归零 */
			setTimeout(function() {
				elPlayer.addClass('player_init');
				elPoster.removeClass('hidden');
				elPlayerControls.removeClass('hidden');
				try{
					videoTag['currentTime'] = 0;
				} catch(e) {}
			}, 10);

			if (heartTimer) {
				clearInterval(heartTimer);
				heartTimer = null;
			}

		},

		/**
		 * 事件，当视频的持续时间以及其他数据已加载时
		 * @function
		 */
		onLoadedMetadata = function() {

			isMetadataLoaded = true;

			/* 更新视频的总时长 */
			//updateDuration();

			/* 检查视频是否支持全屏 */
			if (false === disableFullscreen) {
				isSupportPlayVideoInline = IsIPad || (!IsIPhone && (videoTag['webkitSupportsFullscreen'] || videoTag['mozRequestFullScreen'] || videoTag['requestFullScreen']));
				elPlayer.toggleClass('inline_player', isSupportPlayVideoInline);
			}

			if (IS_EXTERNAL_PLAYER) {
				if (IsAndroid && !(IsUC || IsQQBrowser)) {
					if (isSupportPlayVideoInline && isAutoPlay) {
						ClickTrace.pingback(null, 'video_play_autostart_external');
						play();
					}
				}
			}

		},

		/**
		 * 事件，当视频改变其播放位置时
		 * @function
		 */
		onTimeupdate = function() {
			var currentTime = videoTag['currentTime'],
				duration = videoTag['duration'];

			/* 如果两次timeupdate之间的时间间隔大于2秒，认为用户拖动了视频，
				用来在iPhone全屏播放的时候判断用户是否拖动视频进度 */
			if (currentTime > 0 && Math.abs(currentTime - lastCurrentTime) > 2) {
				startPlayTime = +new Date;
			}

			if ((lastCurrentTime >= 0) && (lastCurrentTime !== currentTime)) {
				if (waitingTimer) {
					clearTimeout(waitingTimer);
					waitingTimer = null;
				}
				if (true === isWaiting) {
					onRealPlaying();
				}
			} 

			if (isPlayingAd) {
				var adTimeLeft = Math.floor(duration - currentTime);
				if (adTimeLeft < 0) {
					adTimeLeft = 0;
				}
				elAdTimer.html(duration > 0 ? '广告剩余 <b>' + adTimeLeft + '</b> 秒' : '');
			}

			//在iPhone上，暂停播放后时间会归零（正确的应该是暂停时的时间），如果是这种情况就不更新显示的时间
			if (IsIOS && (0 == currentTime) && isPlaying) {
				return;
			}

			if (!isWaiting /* 缓冲的时候不更新 */ && 
			    !isDragging /* 拖拽进度条的时候不更新 */ && 
			    duration > 0) {

				/* 更新视频的总时长 */
				updateDuration();

				/* 更新播放进度 */
				elCurrent.html(Util.secondsToTime(currentTime));
				elPlayed.css('width', (currentTime / duration * 100) + '%');
				elDuration.html(Util.secondsToTime(duration));

				Notification.fire('playerOnTimeupate', [videoData, currentTime]);

				//lastCurrentTime在onend事件中归零
				if (currentTime > 0) {
					lastCurrentTime = currentTime;
				}
			}

			/* 更新缓冲进度条 */
			updateBufferedRange();

			/* 某些Android在退出全屏播放后视频停止播放，但是不会触发onparse事件，
			 * 所以这里加个定时器来检查视频是否还在播放 
			 */
			clearPlayingStateTimer();
			if (IsAndroid && !UA.match(/( UC(Browser)?|QQBrowser)/i) && !isFirstTimeUpdateAfterPlaying) {
				checkPlayingStateTimer = setTimeout(function() {
					if (isPlaying) {
						if (isSupportPlayVideoInline) {
							onWaiting();
						} else {
							pause();
						}
					}
				} , 1200);
			}
			isFirstTimeUpdateAfterPlaying = false;
		},

		/**
		 * 事件，网络延迟造成的停顿时
		 * @function
		 */
		onWaiting = function() {

			clearPlayingStateTimer();

			//显示载入动画
			if (IsIPhone || isSupportPlayVideoInline) {
				elPlayerControls.addClass('loading');
			}
			isWaiting = true;
			
			if (isPlayingAd) return;

			clearTimeout(idleTimer);

			var dateNow = (+new Date);

			//非用户切换视频质量后的缓冲，非拖动时间滑块后的缓冲 =  自然卡顿
			if (!isSwitchingSrc && !isSeeking && !isFirstWaitingAfterPlaying /* 开始播放时的第一次缓冲不算 */
				&& (dateNow - lastWaitingTime) > 1000 /* 一秒内的卡顿不重复计算 */
				) {
				var duation = (dateNow - startPlayTime) / 1000;
				if (duation > 3) {
					VideoTrace.buffer(++bufferCount, startPlayTime);
				}
			}

			lastWaitingTime = dateNow;

			isFirstWaitingAfterPlaying = false;
		},

		/**
		 * 事件，网络延迟造成停顿后重新开始播放
		 * @function
		 */
		onPlaying = function() {
			/* 某些Android上在缓冲的时候不会触发onwaiting事件，用定时器检视一下视频是否正常播放 */
			if (!waitingTimer) {
				waitingTimer = setTimeout(onWaiting, 1000);
			}
			elPlayerControls.removeClass('loading');
			isFirstTimeUpdateAfterPlaying = true;

			/* 索爱LT15i上的UC 8.5不会触发onLoadedMetadata事件，在这里手动触发一下 */
			if (false === isMetadataLoaded) {
				onLoadedMetadata();
			}

			/* 拖动播放进度后重置卡顿计时 */
			if (true === isSeeking) {
				startPlayTime = +new Date;
			}		
		},

		onRealPlaying = function() {

			if (isSupportPlayVideoInline) {
				elPlayerControls.removeClass('loading');
				elButtonPlay.addClass('button_pause');
				elPlayer.removeClass('player_pause');
				elPoster.addClass('hidden');
			}

			isWaiting = false;

			if (isPlayingAd) {
				if (!isAdPlayed) {
					isAdPlayed = true;
					//Util.pingback(AdData['load']);
				}
				return;
			}

			if (isSupportPlayVideoInline) {
				idleTimer = setTimeout(function() {
					if (true === isPlaying) {
						elPlayerControls.addClass('hidden');
					}
				}, 3000);
			}

			isSwitchingSrc = false;
			isSeeking = false;

			Notification.fire('playerOnPlaying', videoData);

			if (!heartTimer) {
				/* 两分钟发送一次心跳统计 */
				heartTimer = setInterval(function() {
					VideoTrace.heart(videoTag['currentTime'])
				}, 1000 * 60 * 2);

				/* real VV */
				VideoTrace.realVV(startPlayTime);
				startPlayTime = +new Date;
			}
		},

		/**
		 * 切换视频质量后重新开始播放视频
		 * @function
		 */
		onStalled = function() {
			if (true === isSwitchingSrc) {
				videoTag['play']();

				/* 在iPad上，播放进度小于36秒的时候设置currentTime会导致timeupdate事件无法触发，奇怪的问题 */
				if (timeToSwitch >= 36 || !IsIPad) {
					try{
						videoTag['currentTime'] = timeToSwitch;
					} catch(e) {}
				}
			}
		},

		/**
		 * 事件，视频中断
		 * @function
		 */
		onVideoAbort = function() {
			if (!isPlayingAd && false === isSwitchingSrc) {
				VideoTrace.abort();
			}
		},

		/**
		 * 事件，错误处理
		 * @function
		 */
		onVideoError = function(e) {

			/* 播放广告出错直接播正片 */
			if (isPlayingAd) {
				onEnd();
				return;
			}

			var error = this['error'];

			/*
			 * MediaError
			 * MEDIA_ERR_ABORTED: 1
			 * MEDIA_ERR_DECODE: 3
			 * MEDIA_ERR_ENCRYPTED: 5
			 * MEDIA_ERR_NETWORK: 2
			 * MEDIA_ERR_SRC_NOT_SUPPORTED: 4
			*/
			if (error) {
				if (4 == error['code']) {

					elPlayer.addClass('player_init');
					elPoster.removeClass('hidden');
					elPlayerControls.removeClass('loading');

					//如果m3u8不支持，切换到mp4格式重试
					if (!useMp4) {
						useMp4 = true;
						videoTag.src = getPlayURL();
						if (isPlaying) {
							videoTag['play']();
						}
						return;
					}

					//Android Nexus在退出全屏播放的时候可能会触发error事件，所以先重试重播一次
					if (onErrorRetryTime === 0) {
						onErrorRetryTime++;
						videoTag.src = getPlayURL();
						videoTag['play']();
						try {
							videoTag['currentTime'] = lastCurrentTime;
						} catch(e) {}
						return;
					}

					//浏览器不支持视频格式
					playUseVideoLink();
					//VideoTrace.error(startPlayTime);
				}
			}
		},

		/**
		 * 更新视频的总时长
		 * @function
		 */
		updateDuration = function() {
			var duration = videoTag['duration'];
			if (lastDuration !== duration) {
				elDuration.html(Util.secondsToTime(duration));
				lastDuration = duration;
			}
		},

		/**
		 * 更新缓冲进度条
		 * @function
		 */
		updateBufferedRange = function() {
			var duration = videoTag['duration'],
				buffered = videoTag['buffered'],
				start = 0,
				end = 0;

			try{
				start = buffered['start'](0);
				end = buffered['end'](0);
			} catch(e) {}

			if (duration > 0) {
				elBuffered.css({
					'left': (start / duration * 100) + '%',
					'width': ((end - start)  / duration * 100) + '%'
				});
			}
		};

	/* 绑定播放事件 */
	elVideo.on({
			'play': onPlayOrPause,
			'pause': onPlayOrPause,
			'ended': onEnd,
			'timeupdate': onTimeupdate,
			'progress': updateBufferedRange, //问题：连播视频后此事件不触发 TODO: 使用setTimeout 
			'loadedmetadata': onLoadedMetadata,
			'error': onVideoError,
			'abort': onVideoAbort,
			'stalled': onStalled,
			'waiting': onWaiting,
			'seeking': function() {isFirstTimeUpdateAfterPlaying = true},
			'playing': onPlaying
		});

	/* 测试播放事件 */
	if (ENABLE_DEBUG) {
		var _events = [
			'loadstart' //客户端开始请求数据
			//,'progress' //客户端正在请求数据
			,'suspend' //延迟下载
			,'abort' //客户端主动终止下载（不是因为错误引起），
			,'error' //请求数据时遇到错误
			,'stalled' //网速失速
			,'play' //play()和autoplay开始播放时触发
			,'pause' //pause()触发
			,'loadedmetadata' //成功获取资源长度
			,'loadeddata' //
			,'waiting' //等待数据，并非错误
			,'playing' //开始回放
			,'canplay' //可以播放，但中途可能因为加载而暂停
			,'canplaythrough' //可以播放，歌曲全部加载完毕
			,'seeking' //寻找中
			,'seeked' //寻找完毕
			//,'timeupdate' //播放时间改变
			,'ended' //播放结束
			,'ratechange' //播放速率改变
			,'durationchange' //资源长度改变
			,'volumechange' //音量改变
		];

		for (var i = 0, l = _events.length; i < l; i++) {
			elVideo.on(_events[i], function(e) {
				//console.log('Video Event: ', e.type, e);
				//if (URL.getQueryString('y')) {
					//Console.log('Video Event: ', e.type);
				//}
			});
		}
	}

	elPlayerControls.on({
		'click': onControlsClick
	});

	/* 播放按钮 */
	elButtonPlay.on('click', playOrPause);

	/* 切换播放质量按钮 */
	elVideoQuality.on('click', changeQuality);

	/* 全屏播放按钮 */
	elFullscreen.on('click', enterFullscreen);


	/* 窗口大小改变时调整播放器高度 */
	//$(WIN).on('resize', resize);
	//resize();

	/*
	 * ====================
	 * 进度条拖拽
	 * ====================
	 */
	var 

		/* 
		 * 拖拽进度时的时间提示框 
		 */
		elSeekTimer = $('.drag_timer', elPlayer),

		/**
		 * 是否开始拖动进度条
		 * @boolean
		 */
		isDragInited = false,

		/**
		 * 是否正在拖动进度条
		 * @boolean
		 */
		isDragging = false,

		/**
		 * 进度条总宽度，用来计算拖拽后的播放位置
		 */
		trackbarWidth,
		/**
		 * 拖拽后的位置对应的播放时间(单位是秒)
		 */
		draggedDuration = 0,

		/**
		 * 手指开始移动时在屏幕上的位置
		 */
		startPoint = [0, 0],

		startX = 0,

		/**
		 * 开始拖动进度条
		 * @function
		 */
		onSeekStart = function(e) {
			if (!isSupportPlayVideoInline /* 不支持网页内嵌播放的不实现进度拖动 */
				|| !isPlayed /* 视频没有播放的时候不能拖动 */
				|| isPlayingAd /* 播放前贴片广告的时候不能拖动 */
			) return;

			clearPlayingStateTimer();

			isDragging = true;
			var event = e.originalEvent;
			startPoint = [event.clientX, event.clientY];

			isDragInited = true;
			e.stopPropagation();

			startX = elPlayed.width();
			trackbarWidth = elTrackbar.width();

			elSeekTimer.html(Util.secondsToTime(draggedDuration));
			elPlayerControls.addClass('dragging');

		},

		/**
		 * 拖动进度条
		 * @function
		 */
		onSeekMove = function(e) {
			if (false === isDragInited) {
				return;
			}

			var event = e.originalEvent,
			/* 手指移动过程中滑动对象当前的相对位置（相对于原始位置） */
			deltaX = event.clientX - startPoint[0],
			deltaY = event.clientY - startPoint[1];

			if (!isDragging) {
				if (Math.abs(deltaY) > Math.abs(deltaX)) {
					isDragInited = false;
					return;
				}
			}

			e.preventDefault();
			isDragging = true;

			/* 拖拽后的进度条宽度 */
			var width = (startX + deltaX);

			/* 限定拖拽后进度条的宽度：不小于0，不大于拖拽条总宽度 */
			if (width < 0) width = 0;
			if (width > trackbarWidth) width = trackbarWidth;

			var percent = (width / trackbarWidth) /* 当前拖拽位置占总量的比例 */;

			draggedDuration = lastDuration * percent;

			/* 更新时间提示框内的时间 */
			elSeekTimer.html(Util.secondsToTime(draggedDuration));

			/* 更新进度条 */
			elPlayed.css('width', width + 'px');
		},

		/**
		 * 结束拖动进度条
		 * @function
		 */
		onSeekEnd = function(e) {
			if (false === isDragging) {
				return;
			}

			isSeeking = true;

			/* 更新视频播放进度 */
			try{
				videoTag['currentTime'] = draggedDuration;
			} catch(e) {}
			onTouchCancel();
		},

		/**
		 * 清理
		 * @function
		 */
		onTouchCancel = function(e) {
			isDragInited = false;
			isDragging = false;
			elPlayerControls.removeClass('dragging');
		}
		;

	$('.dragbar', elPlayer).on(START_EVENT, onSeekStart);
	$(DOC)
		.on(MOVE_EVENT, onSeekMove)
		.on(END_EVENT, onSeekEnd)
		.on('touchcancel', onTouchCancel);

	//离开播放页
	var onVideoUnload = function() {
		onEnd(null, true);
		Notification.fire('playerOnUnLoad', [videoData, videoTag['currentTime']]);
	};
	RR.addEvent('unload', WIN, onVideoUnload);

	/* 小米手机和魅族M9自动播放的时候会一直在加载状态，无法正常播放，所以禁用
	 * SUMSUNG-GT-S7568
	 * GT-S7562
	 * GT-I9100 Safari/534.30
	 */
	if ((UA.match(/(HS\-U950|GT\-S756|GT\-I9100|Lenovo K860|SHV-E160L|OPPOX907|MI-ONE Plus|HTC S720|ZTE U970|HUAWEI_C8812|vivo)/i) && !IsUC) || useVideoLink) {
		isAutoPlay = false;
	}

	/* 用于站外内嵌播放器的时候，只有wifi环境下才自动播放视频 */
	if (IS_EXTERNAL_PLAYER) {
	
		var connectionType = Util.getConnectionType();

		if ('wifi' !== connectionType) {
			isAutoPlay = false;
		} else {
			var playerIndex = parseInt(URL.getQueryString('player_index') || 0);
			if (playerIndex) {
				isAutoPlay = false;
			}
		}

		if (IsQQBrowser) {
			isAutoPlay = false;
		}
	}

	/*
	 * ====================
	 * 播放器接口
	 * ====================
	 */
	this.play = function() {
		play();
	};

	this.pause = function() {
		pause();
	};

	this.duration = function() {
		return lastDuration;
	};

	this.currentTime = function(currentTime) {
		if (isNaN(currentTime)) {
			return lastCurrentTime;
		} else {
			isSeeking = true;
			try{
				videoTag['currentTime'] = currentTime;
			} catch(e) {}
		}
	};

	this.loadVideoByData = function(_videoData, startTime) {

		/* 同一个视频不做任何操作 */
		if (videoData && (videoData['vid'] == _videoData['vid'])) {
			return;
		}

		onErrorRetryTime = 0;

		if (videoData) {
			onVideoUnload();
		}

		videoData = _videoData;

		/* 使用flash播放 */
		if (useFlash) {
			if (true === playUseFlash()) {
				return;
			}
		}

		var _videoURL = getPlayURL();

		if (!useClientPlay) {
			if (videoTag && !useVideoLink) {
				videoTag.src = _videoURL;
				if ('undefined' !== typeof startTime) {
					setTimeout(function() {
						try{
							videoTag['currentTime'] = startTime;
						} catch(e) {}
					}, 0);
				}
			} else {
				playUseVideoLink();
			}
		}

		if (IS_EXTERNAL_PLAYER) {
			videoTag['load']();
			if (true === isAutoPlay && IsAndroid && (IsUC || IsQQBrowser)) {
				var sysVersion;
				if (sysVersion = UA.match(/Android(?:[\/\s*]([0-9\._]+))?/i)) {
					sysVersion = Util.getVersionNumber(sysVersion[1]);
					if (sysVersion > 2) {
						ClickTrace.pingback(null, 'video_play_autostart_external');
						setTimeout(play, 1000);
					}
				}
			}
		} else {
			VideoTrace.vv();
			if (isAutoPlay) {
				setTimeout(play, 10);
			}
		}



		Notification.fire('playerOnLoad', videoData);
	};

	return this;
};



/* 视频播放器对外接口对象 */
var SohuMobilePlayer = {

	_eventMap: {
		'ready': 'playerOnLoad',
		'play': 'playerOnPlay',
		'pause': 'playerOnPause',
		'playing': 'playerOnPlaying',
		'end': 'playerOnEnd'
	},
	
	'play': function() {
		if (MainPlayer) {
			MainPlayer.play();
		}
	},

	'pause': function() {
		if (MainPlayer) {
			MainPlayer.pause();
		}
	},

	'duration': function() {
		if (MainPlayer) {
			return MainPlayer.duration();
		}
	},

	'currentTime': function(currentTime) {
		if (MainPlayer) {
			return MainPlayer.currentTime(currentTime);
		}
	},

	'on': function(event, callback) {
		var notificationName = SohuMobilePlayer._eventMap[event];
		if (notificationName) {
			Notification.reg(notificationName, callback);
		}
	}
};

WIN['SohuMobilePlayer'] = SohuMobilePlayer;
/**
 * 站外内嵌播放器
 * @autohr qianghu
 */

if (IS_EXTERNAL_PLAYER) {
	$().ready(function() {
		var elPlayer = $('#main_player');
		if (elPlayer.length > 0) {
			var downloadLink = Util.getDownloadAppLink();
			if ('0' !== URL.getQueryString('toolbar')) {
				if (($('.news_toolbar').length < 1)) {
					var html = [
						'<div class="share_tools news_toolbar">',
							'<a class="app_download_link" position="appdownload_external"><b></b>下载</a>',
							'<a class="news_more"><b></b>更多</a>',
						'</div>'
					].join('');
					elPlayer.after(html);
				}
			} else {
				elPlayer.addClass('no_toolbar');
			}

			$('.news_toolbar .app_download_link').attr('href', downloadLink).on('click', function() {
				ClickTrace.pingback($(this));
				setTimeout(function() {
					top.location.href = Util.getDownloadAppLink();
				}, 50);
				return false;
			});

			var elPlayerColumn = $('.player_column');

			$('.news_more').on('click', function() {
				if (elPlayerColumn.toggleClass('player_recommand').hasClass('player_recommand')) {
					/* 显示推荐的时候暂停播放视频 */
					$('video').trigger('pause');
				}
				return false;
			});

			$('<a href="#nogo">更多</a>').appendTo($('.recommand_list .cate_title')).on('click', function() {
				WIN.open('http://m.tv.sohu.com/');
				return false;
			});

		}
	});

}
/**
* 播放页的剧集列表
* @autohr qianghu
*/

var TvSetList = {

	currentPage: -1,

	currentElPage: null,

	nextVideo: null,

	videos: [],

	videoData: {},

	init: function() {

		//播放完毕后自动跳转到剧集列表的下一剧集的链接
		Notification.reg('playerOnEnd', function() {
			//这个手机全屏的时候自动跳转会造成手机卡死，所以不自动跳转
			if (UA.match(/HS\-U950|HUAWEI_C8812/i) && !IsUC && !UA.match(/MQQBrowser/i)) {
				return;
			}

			var url,
				vid,
				params,
				channeled = '1211010100';

			/* 从接口获取的下集的链接 */
			if (TvSetList.nextVideo) {
				vid = TvSetList.nextVideo['vid'];
				url = '/v' + vid + '.shtml';
				params = URL.objToQueryString(URL.URLGlobalParms);

				if (params) {
					url = url + (url.indexOf('?') < 0 ? '?' : '&') + params;
				}

			} else {
				/* 从页面剧集列表获取的下一集的链接 */
				var elCurrentVolItem = $('.vol_list .c');
				if (elCurrentVolItem.length > 0) {
					var elNextItem = elCurrentVolItem.get(0)['nextElementSibling'];
					if (elNextItem) {
						url = $('a', elNextItem).attr('href');
						vid = $('a', elNextItem).attr('vid')
					}
				}
				/* 没有剧集取相关推荐列表的第一个视频 */
				
				if (!url) {
					url = $('.recommand_list dd a').attr('href');
					vid = $('.recommand_list dd a').attr('vid');
					channeled = '1211010300';
				}

			}

			if (url) {
				/* 行为统计点 */
				if (vid) {
					ClickTrace.pingback(null, 'video_play_next' + (IS_EXTERNAL_PLAYER ? '_external' : ''));
					setTimeout(function() {
						PlayerPage.loadVideo(vid, channeled);
					}, 50);
				}
			}
		});
	},

	/* 加载剧集和相关剧集列表，
	 * 此方法在player_page.js中的updatePlayerPageByVideoData方法中调用 
	 */
	loadByVideoData: function(_videoData) {

		//外链播放器且不显示播放条的时候不加载剧集列表
		if (IS_EXTERNAL_PLAYER && '0' === URL.getQueryString('toolbar')) {
			return;
		}

		if (_videoData) {

			var videoData = TvSetList.videoData,
				isPlaylistChanged = true; //专辑是否发生改变

			if (_videoData['plid'] == videoData['plid']) {
				//如果两个视频是同一个剧集列表中的，则不用重新加载剧集，只更新视频所在剧集的页码即可
				TvSetList.videoData = videoData = _videoData;

				var currentPage = TvSetList.getCurrentVideoPage();
				TvSetList.showPage(null, currentPage);
				isPlaylistChanged = false;
			} else {

				TvSetList.videoData = videoData = _videoData;

				TvSetList.currentPage = -1;

				/* 当前专辑的视频数量大于0的时候请求专辑列表数据 */
				var videoCount = parseInt(videoData['videoCount'] || 0);

				if (videoCount > 0) {
					/* 综艺 */
					if (ENABLE_DEBUG && videoData['cid'] == -7) {
						var videoListURL = 'http://api.tv.sohu.com/set/info2/' + 
							videoData['plid'] + 
							'.json?api_key=' + API_KEY + '&plat=3&sver=3.0&partner=1&callback=zongyiPageListCallback';
					} else {

						$().get('/videolist', {
							data: {
								'playlistid': videoData['plid'] 
							},
							always: TvSetList.videoListCallback
						});

						/*var videoListURL = 'http://api.tv.sohu.com/set/list/' + 
							videoData['plid'] + 
							'.json?api_key=' + API_KEY + '&page=1&pageSize=10000&' + 
							'plat=3&sver=3.0&partner=1&callback=videoListCallback';*/

					}
				} else {
					$('.vol_wrap').css('display', 'none');
					$('.vol_wrap .cate_title').removeAttr('float_menu');
					FloatTitleBar.updateMenuItem();
				}


				//更新播放页主容器的样式来控制不同频道的文案和剧集列表显示(在player_page.css中控制)
				$('.page_wrap_player').attr('class', 'page_wrap_player video_channel_' + videoData['cid'] || '');

			}

			//相关季剧集
			if (videoData && !IS_EXTERNAL_PLAYER && (true === isPlaylistChanged /* 专辑发生改变的时候才更新季列表 */)) {
				//先从本地存储中获取剧集列表并对比缓存版本，如果版本过期则从服务端加载新版本
				var storeData = Storage('set_list');
				if (storeData && (SetListVersion === storeData['version'])) {
					TvSetList.seasonListCallback(storeData['data']);
				} else {
					if (ENABLE_DEBUG) {
						Util.loadScript('/static/scripts/tv/min.set_lists.js');
					} else {
						Util.loadScript('http://tv.sohu.com/upload/touch/static/scripts/tv/min.set_lists.js');
					}
				} 
			}

			//相关推荐
			var searchKeys  = $().extend({
					'cid':  videoData['cid'],
					'vid':  videoData['vid'],
					'pageSize': (IS_EXTERNAL_PLAYER ? 3 : 10),
					'pageNum': 1
				}, API_PARAMS),
				recommandURL = API_URL + 'search2/recommend.json?' + $().param(searchKeys);

			$().get(recommandURL, {
				beforeSend: function() {
					$('.recommand_list').addClass('blank_list loading');
				},
				always: TvSetList.recommandListCallback
			});

		}

	},

	/* 获取当前视频在专辑列表中所处的页码 */
	getCurrentVideoPage: function() {
		var videoData = TvSetList.videoData,
			isTVShow = TvSetList.getIsTVShow(),
			i = 0,
			pageSize = isTVShow ? 20 : 6,
			videos = TvSetList.videos,
			videoCount = videos.length,
			currentPage = 0;

		TvSetList.nextVideo = null;

		for (; i < videoCount; i++) {
			if (videos[i]['vid'] == videoData['vid']) {
				if (i + 1 < videoCount) {
					TvSetList.nextVideo = videos[i + 1];
				}
				currentPage = Math.floor(i / pageSize);
				break;
			}
		}

		return currentPage;
	},

	/* 判断是否竖向显示专辑列表 */
	getIsTVShow: function() {
		var videoData = TvSetList.videoData,
			isTVShow = videoData && !!('|1000|2|16|'.indexOf('|' + videoData['cid'] + '|') > -1);
		return isTVShow;
	},

	addVolWrapHTML: function() {

		if ($('.vol_wrap').length < 1) {

			var wrapHTML = [
				'<div class="vol_wrap">',
					'<div class="cate_title_wrap"><h2 class="cate_title" float_menu="vol_list" float_menu_label="&lt;span class=&quot;vol_label_tv&quot;&gt;剧集&lt;/span&gt;&lt;span class=&quot;vol_label_album&quot;&gt;专辑&lt;/span&gt;"><b class="k_vol_list" key="vol_list"><span class="vol_label_tv">剧集</span><span class="vol_label_album">专辑</span></b></h2></div>',
					'<div class="vol_list_nav scroll_wrap" style="display:none">',
						'<div class="vol_list_wrap scroller"></div>',
					'</div>',
					'<div class="scroll_wrap">',
						'<dl class="item_list vol_list_result scroller'  + 
						'"></dl>',
					'</div>',
				'</div>'
			];
			$('.appbar').after(wrapHTML.join(''));
			Swipe.initScroller($('.vol_wrap').css('display', 'block'));
		}
	},

	videoListCallback: function(ajaxObj, text) {
		var data = ajaxObj.responseData,
			videos = data && data['videos'],
			videoData = TvSetList.videoData,
			cid = videoData['cid'],
			isTVShow = TvSetList.getIsTVShow(),
			pageSize = isTVShow ? 20 : 6;

		if (videos) {
			TvSetList.videos = videos;

			var videoCount = parseInt(data['updateSet'], 10),
				pageCount = Math.ceil(videoCount / pageSize),
				i,
				html = [],
				endNum,
				currentPage = TvSetList.getCurrentVideoPage();

			/* 如果电影类的专辑视频只有一个，就不显示专辑列表 */
			var elVolWrap = $('.vol_wrap'),
				elCateTitle = $('.cate_title', elVolWrap);

			if (('1000' == cid || '1' == cid) && videoCount < 2) {
				elVolWrap.css('display', 'none');
				elCateTitle.removeAttr('float_menu');
				FloatTitleBar.updateMenuItem();
				return;
			} else {
				elVolWrap.css('display', 'block');
				elCateTitle.attr('float_menu', 'vol_list');
			}

			TvSetList.addVolWrapHTML();

			/* 切换剧集翻页导航的显示 */
			$('.vol_list_nav', elVolWrap).css('display', (pageCount > 1) ? 'block' : 'none');

			if (pageCount > 1) {
				for (i = 0; i < pageCount; i++) {
					endNum = ((i + 1) * pageSize);
					if (endNum > videoCount) {
						endNum = videoCount;
					}
					html.push('<span index="' + i + '">' + (i * pageSize + 1)  + '-' + endNum + '</span>');
				}
			} 

			var elListWrap = $('.vol_list_wrap').html(html.join('')),
				elTabItems = $('span', elListWrap).on('click', TvSetList.showPage);

			TvSetList.showPage(null, currentPage, true);

			FloatTitleBar.updateMenuItem();
		}
	},

	zongyiPageListCallback: function(data) {
		var setListData = data && data['data'] && data['data']['yms'];
		if (setListData) {
			var html = [],
				n,
				item;

			TvSetList.addVolWrapHTML();

			for (var i = setListData.length - 1; i >= 0; i--) {
				n = 0;
				item = setListData[i];
				for (var j = item['ms'].length - 1; j >= 0; j--) {
					html.push('<span index="' + i + '" search="year=' + + item['tv_year'] + '&month=' + ((item['ms'][j] + '').length < 2 ? '0' : '') + item['ms'][j] + '">' + 
					          (0 === n ? item['tv_year']  + '年' : '') + item['ms'][j] + '月</span>');
					n++;
				}
			}

			var elListWrap = $('.vol_list_wrap').html(html.join('')),
				elTabItems = $('span', elListWrap).on('click', TvSetList.showZongyiPage);

			TvSetList.showZongyiPage(null, 0);

		}
	},

	showZongyiPage: function(e, pageIndex) {
		var el, 
			index,
			videoData = TvSetList.videoData;
		if ('undefined' !== typeof pageIndex) {
			index = pageIndex;
			el = $('.vol_list_wrap span').eq(index);

		} else {
			el = $(this),
			index = parseInt(el.attr('index'), 10);
		}

		if (TvSetList.currentPage !== index) {
			var videoListURL = 'http://api.tv.sohu.com/search2/zongyi.json?sid=' + 
					videoData['plid'] + 
					'&order=0&pageSize=50&api_key=' + API_KEY + '&' + el.attr('search') + '&plat=3&sver=3.0&partner=1&callback=zongyiVideoListCallback';

			Util.loadScript(videoListURL);
		}
	},

	zongyiVideoListCallback: function(data) {

		var index = 0,
			html = [],
			i = 0,
			videoData = TvSetList.videoData,
			isTVShow = TvSetList.getIsTVShow(),
			pageSize = isTVShow ? 20 : 6,
			len = pageSize,
			videos = data['data']['videos'],
			videoCount = videos.length,
			cid = videoData['cid'],
			title,
			url,
			video;

		while (i < videoCount) {
			video = videos[i]['map'];

			if (2 == cid || 16 == cid) {
				title = (i + 1);
			} else {
				title = video['tv_name']
					.replace(/^《.+?》\s*/, '')
					.replace(/^[0-9]{8}\s*/, '') /* 移除开头的日期串 */
					.trim();
			}

			var className = '';

			if (video['vid'] == videoData['vid']) {
				className = ' class="c"';
			}


			//if (ENABLE_DEBUG) {
				url = '/v' + video['vid'] + '.shtml';
			//} else {
				//url = Util.formatURL(video['pageUrl'])
			//}

			if (IS_EXTERNAL_PLAYER) {
				coverPic = 'about:blank';
			} else {
				coverPic = video['video_big_pic'];
			}

			html.push(
					'<dd' + className + '>',
						'<a href="' + url + '" class="cover">',
							'<b style="background-image:url(' + coverPic + ')"></b>',
						'</a>',
						'<p><a href="' + url + '"><b>第</b>' + title + '<b>集</b></a></p>',
					'</dd>'
				);
			
			i++;
		}

		$('.vol_list_result').html(html.join(''));
	},

	showPage: function(e, pageIndex, init) {
		var el, index;
		if ('undefined' !== typeof pageIndex) {
			index = pageIndex;
			el = $('.vol_list_wrap span').eq(index);

		} else {
			el = $(this),
			index = parseInt(el.attr('index'), 10);
		}

		if (TvSetList.currentPage !== index) {
			TvSetList.currentElPage && TvSetList.currentElPage.removeClass('c');
			TvSetList.currentPage = index;
			TvSetList.currentElPage = el.addClass('c');

			if (init) {
				/* 滚动列表位置到当前页 */
				Swipe.scrollToElement(el, null, true);
			}

			var html = [],
				videoData = TvSetList.videoData,
				isTVShow = TvSetList.getIsTVShow(),
				pageSize = isTVShow ? 20 : 6,
				i = index * pageSize,
				len = pageSize,
				videos = TvSetList.videos,
				videoCount = videos.length,
				n = 0,
				cid = videoData['cid'],
				title,
				url,
				video,
				_vid;


			while (n < len && i < videoCount) {
				video = videos[i];
				_vid = video['vid'];

				if (2 == cid || 16 == cid) {
					title = (i + 1);
				} else {
					title = video['name']
						.replace(/^《.+?》\s*/, '')
						.replace(/^[0-9]{8}\s*/, '') /* 移除开头的日期串 */
						.trim();
				}

				var className = '';

				if (_vid == videoData['vid']) {
					className = ' class="c"';
				}

				url = '/v' + video['vid'] + '.shtml?channeled=1211010100';

				if (IS_EXTERNAL_PLAYER) {
					coverPic = 'about:blank';
				} else {
					coverPic = video['largePicUrl'];
				}

				html.push(
						'<dd' + className + ' data-key="vid" data-type="highlight" data-value="' + _vid + '">',
							'<a href="' + url + '" class="cover" vid="' + _vid + '" channeled="1211010100">',
								'<b style="background-image:url(' + coverPic + ')"></b>',
							'</a>',
							'<p><a href="' + url + '" vid="' + _vid + '" channeled="1211010100"><b>第</b>' + title + '<b>集</b></a></p>',
						'</dd>'
					);
				
				n++;
				i++;
			}

			var elVolList = $('.vol_list_result').html(html.join(''));

			/*  三星note1自带浏览器，异步加载的剧集列表偶尔不显示，先隐藏再显示，这样就正常了 >.< */
			if (IsAndroid) {
				elVolList.css({'display': 'none'}).css({'display': 'block'});
			}

			/* 滚动视频列表到可见 */
			Swipe.scrollToElement($('.c', elVolList));
		}
	},

	seasonListCallback: function(data) {
		if (data) {
			var i = 0,
				l = data.length,	
				seasonData,
				j,
				n,
				item,
				videoData = TvSetList.videoData,
				hasSeason = false;

			for (; i < l; i++) {
				seasonData = data[i];
				n = seasonData.length;
				for (j = 0; j < n; j++) {
					item = seasonData[j];
					if (item['sid'] == videoData['plid']) {
						TvSetList.showSeasonList(seasonData);
						hasSeason = true;
						break;
					}
				}
			}

			/* 没有相关季的时候隐藏季列表 */
			if (false === hasSeason) {
				$('.season_list').html('');
			}

			var storeData = {
				//SetListVersion在vars.js中定义
				version: SetListVersion,
				data: data
			};
			Storage('set_list', storeData);
		}
	},

	seasonName: '',

	/**
	 * 绘制相关剧集导航
	 */
	showSeasonList: function(seasonData) {
		var html = [],
			i = 0,
			l = seasonData.length,
			sid,
			videoData = TvSetList.videoData,
			seasonName = seasonData[0]['season_name'] || seasonData[0]['name'].replace(/第.+?[季部]$/, ''),
			n = 0;

		TvSetList.seasonName = seasonName;

		for (; i < l; i++) {
			sid = seasonData[i]['sid'];
			if (sid != videoData['plid']) {
				var sName = seasonData[i]['name'];
				if (sName.match(/第.+?[季部]$/)) {
					sName = sName.replace(seasonName, '');
				}
				html.push('<span sid="' + sid + '" index="' + i + '"' + (n == 0 ? 'class="c"' : '') +'>' + sName + '</span>');
				n++;
			}
		}

		if (html.length < 1) return;

		var elSeasonList = $('.season_list').html([
			'<div>',
				'<div class="cate_title_wrap"><h2 class="cate_title" float_menu="season_list" float_menu_label="系列"><b class="k_season_list" key="season_list">' + seasonName + '系列</b></h2></div>',
				'<div class="vol_list_nav scroll_wrap">',
					'<div class="season_list_nav scroller"></div>',
				'</div>',
				'<div class="scroll_wrap blank_list loading">',
					'<dl class="item_list season_list_vol_wrap scroller"></dl>',
					'<div class="loading_tip">载入中...</div>',
				'</div>',
			'</div>'
		].join(''));

		Swipe.initScroller(elSeasonList);

		var elListWrap = $('.season_list_nav', elSeasonList).html(html.join('')),
			elTabItems = $('span', elListWrap).on('click', TvSetList.showSeasonVolsList);

			TvSetList.showSeasonVolsList(null, 0, true);

		FloatTitleBar.updateMenuItem();

	},

	/**
	 * 点击相关剧集导航
	 */
	showSeasonVolsList: function(e, pageIndex, init) {
		var el, index;
		if ('undefined' !== typeof pageIndex) {
			index = pageIndex;
			el = $('.season_list_nav span').eq(index);

		} else {
			el = $(this),
			index = parseInt(el.attr('index'), 10);
			if (el.hasClass('c')) {
				return;
			} else {
				$('.season_list_nav .c').removeClass('c');
				el.addClass('c');
			}
		}
		Swipe.scrollToElement(el, true);

		var videoListURL = 'http://m.tv.sohu.com/videolist?playlistid=' + 
					el.attr('sid') + '&callback=seasonVolsListCallback';

		Util.loadScript(videoListURL);
	},

	/**
	 * 剧集的视频列表加载成功，绘制视频列表
	 */
	seasonVolsListCallback: function(data) {
		var videos = data && data['videos'];
		if (videos) {
			var html = [],
				i = 0,
				l = videos.length,
				video,
				title,
				url,
				_vid;

			for (;i < l; i++) {
				video = videos[i];
				_vid = video['vid'];

				title = (video['subName'] || video['name'] || '')
					.replace(/^[0-9]{8}\s*/, '') /* 移除开头的日期串 */
					.replace(data['albumName'], '') /* 移除专辑名 */
					.replace(/第.+?[季部]/, '') /* 移除季名 */
					.replace(TvSetList.seasonName, ''); /* 移除季名 */

				//if (ENABLE_DEBUG) {
					url = '/v' + _vid+ '.shtml?channeled=1211010200';
				//} else {
					//url = Util.formatURL(video['pageUrl']);
				//}
				html.push(
					'<dd>',
						'<a href="' + url + '" class="cover" vid="' + _vid + '" channeled="1211010200"><b style="background-image:url(' + 
							video['largePicUrl'] + ')"></b></a>',
						'<p><a href="' + url + '" vid="' + _vid + '" channeled="1211010200">' + title + '</a></p>',
					'</dd>'
				);
			}

			if (html.length > 0) {
				$('.season_list_vol_wrap').html(html.join('')).attr('startX', 0).css({
					'webkitTransform': 'translate3d(0,0,0)',
					'webkitTransitionDuration': '200ms'
				});
				$('.season_list .scroll_wrap').removeClass('blank_list loading');
			}

		}
	},

	/**
	 * 加载相关推荐成功的回调
	 */
	recommandListCallback: function(ajaxObj) {
		var data = ajaxObj.responseData,
			videos = data && data['data'] && data['data']['videos'],
			removedClass = 'loading';


		var elRecommandList = $('.recommand_list');
		if (videos) {

			var i = 0,
				l = videos.length,
				html = [],
				video,
				url,
				coverPic,
				playCount,
				_vid;

			for (;i < l; i++) {
				video = videos[i];
				_vid = video['vid'] || video['id'];

				//if (ENABLE_DEBUG) {
					url = WebRoot + '/v' + _vid + '.shtml?channeled=1211010300';
				//} else {
					//url = Util.formatURL(video['videoUrl']) + '?pvid=5067101d25313095';
				//}

				coverPic = (IsIPad && PixelRatio > 1) ? video['ver_high_pic'] : (video['ver_big_pic'] || video['video_big_pic']);

				playCount = video['tv_play_count'];
				html.push(
					'<dd>',
						'<a href="' + url + '" class="cover" vid="' + _vid + '" channeled="1211010300"><b style="background-image:url(' + 
							coverPic + ')"></b></a>',
						'<p><a href="' + url + '" vid="' + _vid + '" channeled="1211010300">' + video['tv_name'] + 
							'</a>' + 
							(playCount > 0 ? ('<span>播放: ' + Util.shortCount(playCount) + '</span>') : '') +
							'</p>',
					'</dd>'
				);
			}

			if (html.length > 0) {
				removedClass += ' blank_list';
				var elItemList = $('.item_list', elRecommandList).html(html.join(''));

				if (IS_EXTERNAL_PLAYER) {
					$('a', elItemList).on('click', function() {
						WIN.open($(this).attr('href').replace('player=1', ''));
						return false;
					});
				}
			}

		}
		elRecommandList.removeClass(removedClass);
	}
};

WIN['seasonListCallback'] = TvSetList.seasonListCallback;
WIN['seasonVolsListCallback'] = TvSetList.seasonVolsListCallback;

if (ENABLE_DEBUG) {
	WIN['zongyiPageListCallback'] = TvSetList.zongyiPageListCallback;
	WIN['zongyiVideoListCallback'] = TvSetList.zongyiVideoListCallback;
}

TvSetList.init();
/**
 * 播放页的评论列表
 * @static
 * @autohr qianghu
 */

var videoData,
	FormForceOpen = false;

var Comment = {

	/* 
	 *  文本框输入的字数是否超过限制
	 */
	contentLengthOverflow: false,

	/* 
	 * 当前页码
	 */
	currentPage: 1,

	/* 
	 * 当前在页面展示的评论数量
	 */
	commentCount: 0,

	editTimer: null,

	/* 
	 * 页大小
	 */
	pageSize: 5,

	/* 
	 * 标记是否初始化
	 */
	inited: false,

	init: function() {

		if (true === Comment.inited) {
			return true;
		}

		var elCommentsList = $('#comments_list');
		if (elCommentsList.length < 1) {
			return false;
		}

		Comment.inited = true;

		Comment.elCommentsList = elCommentsList;
		Comment.elCommentsWrap = $('#comments_wrap').addClass('blank_list');
		Comment.elLoadMore = $('.more', Comment.elCommentsWrap);

		$('.more', Comment.elCommentsWrap).on('click', Comment.loadMore);

		Comment.elForm = $('#post_comment_form').on('submit', Comment.postComment);
		Comment.elSubmit = $('button', Comment.elForm);
		Comment.elTextLength = $('.input_count', Comment.elForm);
		Comment.elContent = $('textarea', Comment.elForm).on({
			'focus': function() {
				FormForceOpen = false;
				Comment.elForm.removeClass('closed');
				Comment.editTimer = setInterval(Comment.checkInputLength , 200);
			},
			'blur': function() {
				setTimeout(Comment.onInputBlur, 0);
			}
		});

		if ('undefined' === typeof PassportSC) {
			Util.loadScript('http://tv.sohu.com/upload/jq_plugin/passport.js', Comment.onPassportLoaded);
		}

		return true;
	},

	loadComment: function(_videoData) {
		if (true === Comment.init()) {

			videoData = _videoData;

			Comment.refresh();
		}
		
	},

	onInputBlur: function() {

		if (true === FormForceOpen) return;

		if (Comment.editTimer) {
			clearInterval(Comment.editTimer);
			Comment.editTimer = null;
		}

		if (IsTouch && !IsAndroid) {
			/* 失焦后关闭表单，使用setTimeout是为了防止失焦事件造成表单无法提交的问题 */
			setTimeout(function() {
				Comment.elForm.addClass('closed');
			}, 0);
		}
	},

	checkInputLength: function() {
		var maxLength = Comment.elContent.attr('max_length'),
			len = Comment.elContent.val().length;
		Comment.elTextLength.html(len + '/' + maxLength);

		if (len > maxLength) {
			if (false === Comment.contentLengthOverflow) {
				Comment.elTextLength.addClass('overflow');
				Comment.contentLengthOverflow = true;
			}
		} else {
			if (true === Comment.contentLengthOverflow) {
				Comment.elTextLength.removeClass('overflow');
				Comment.contentLengthOverflow = false;
			}
		}
	},

	onPassportLoaded: function() {
		var userId = PassportSC['cookieHandle']();
		if (userId) {
			if ('0' == PassportSC['cookie']['trust']) {
				$('.text_wrap .login_tip', Comment.elForm).html('您的账号未激活 <a href="http://my.tv.sohu.com/user/" target="_blank">激活账号</a>');
			} else {
				Comment.elForm.removeClass('not_login');
			}
		}
	},

	/**
	 * 发表评论
	 * 调用场所： 提交评论表单
	 */
	postComment: function(e) {

		if (Comment.elTextLength.hasClass('overflow')) {
			Comment.elContent.trigger('focus').addClass('error');
			FormForceOpen = true;
		} else {
			Comment.elContent.removeClass('error');
			if (
			    !Comment.elSubmit.hasClass('loading') && 
			    !Comment.elForm.hasClass('post_success') && 
				/* 登录情况下 */
			    !Comment.elForm.hasClass('not_login')) {

				if (Comment.elContent.val().trim() === '') {
					Comment.elContent.trigger('focus');
					FormForceOpen = true;
				} else {
					var elFrame = $('#comment_target'),
						targetName = 'comment_target';
					if (elFrame.length < 1) {
						elFrame = $('<iframe name="' + targetName + '" id="' + targetName + '" frameborder="0"></iframe>');
						$(DOC.body).append(elFrame);
						Comment.elForm.attr('target', targetName);
						Comment.elForm.attr('action', 'http://my.tv.sohu.com/reply/save.do?redirect=blank');
					}

					Comment.elForm.trigger('submit');

					Util.setLoad(Comment.elSubmit.addClass('loading'));

					setTimeout(Comment.postCommentLoaded, 500);
				}

			}
		}

		e.preventDefault();
		return false;
	},

	/**
	 * 发表评论成功的回调
	 */
	postCommentLoaded: function() {
		Comment.elSubmit.removeClass('loading');
		Comment.elForm.addClass('post_success');
		//Comment.refresh();

		var commentItem = $(Comment.getCommentItemHTML({
			'authorimg': 'http://tv.sohu.com/upload/space/skin/imgs/avatar_s.jpg',
			'reply_from_user': 'http://my.tv.sohu.com/user/',
			'author': decodeURIComponent(PassportSC['cookie']['uniqname'] || '搜狐网友'),
			'content': Comment.elContent.val().trim(),
			'time': (+new Date)
		}));

		Comment.elCommentsList.prepend(commentItem);
		Comment.elContent.val('');

		setTimeout(function() {
			Comment.elForm.removeClass('post_success');
		}, 3000);
	},


	/**
	 * 刷新评论列表
	 * 调用场所： 播放页面加载完成后
	 */
	refresh: function() {
		Comment.isResfresh = true;
		Comment.load(1);
	},

	/**
	 * 载入较旧的评论
	 * 调用场所： 在评论列表中点“查看更多”
	 */
	loadMore: function() {
		Comment.isResfresh = false;
		Comment.load(Comment.currentPage + 1);
	},

	/**
	 * 请求评论列表数据，此方法为被refresh()和loadMore()调用的公共方法
	 * 调用场所： 在评论列表中点“查看更多”
	 */
	load: function(page) {
		//如果正在加载数据，什么也不做
		if (Comment.elLoadMore.hasClass('loading')) {
			return;
		}

		Comment.elCommentsWrap.addClass('loading');
		Comment.elLoadMore.addClass('loading');

		var commentUrl = Comment.getCommentUrl(page);

		commentUrl && Util.loadScript(commentUrl, Comment.onCommentsLoaded);
	},

	/**
	 * 加载评论列表后的回调
	 */
	onCommentsLoaded: function() {
		var commentData = WIN['returnComments'],
			commentList = commentData['commentList'] || [],
			len = commentList.length || 0;

		Comment.elCommentsWrap.removeClass('loading');
		Comment.elLoadMore.removeClass('loading');

		/* 如果有评论数据 */
		if (len) {

			if (false === Comment.isResfresh) { //查看更多
				Comment.currentPage++;
			} else { //刷新
				Comment.currentPage = 1;
				Comment.commentCount = 0;
				Comment.elCommentsList.html('');
			}

			var html = [];
			for (var i = 0; i < len; i++) {
				html.push(Comment.getCommentItemHTML(commentList[i]));
			}

			var commentListWrap = DOC.createElement('div');
				commentListWrap.style.display = 'none';
				commentListWrap.innerHTML = html.join('');

			var item,
				id,
				len = commentListWrap.children.length;

			/* 回复去重 */
			for (i = len; i--;) {
				item = commentListWrap.children[i];
				id = item.id;

				/* 新加载的内容和之前加载的条目有重复的 */
				if (id && $('#' + id, Comment.elCommentsList).length > 0) {
					len--;
					commentListWrap.removeChild(item);
				} else if ('DD' == item.nodeName) {
					Comment.commentCount++;
				}
			}

			if (len > 0) {
				commentListWrap.style.display = 'block';
				Comment.elCommentsList.append(commentListWrap);
			}

			/* 回复数量 */
			var elCommentCount = $('.comment_count', Comment.elCommentsWrap),
				totalCount = commentData['allCount'];

			$('b', elCommentCount).html(totalCount);
			elCommentCount.attr('class', 'comment_count comment_count_' + totalCount);

			/* “查看更多”按钮和空白提示 */
			Comment.elCommentsWrap.toggleClass('has_more', (totalCount > Comment.currentPage * Comment.pageSize));
			Comment.elCommentsWrap.toggleClass('blank_list', Comment.commentCount < 1);

		}
	},

	/**
	 * 拼装回复列表的数据URL
	 */
	getCommentUrl: function(page) {

		/*
		 * /reply/list/$cid_$plid_$vid_$start_$size_$pagetype.js
		 * http://access.tv.sohu.com/reply/list/9001_19987272_10674588_15_15.js
		 */
		var cid = videoData['cid'],
			vid = videoData['vid'] || 0,
			plid = videoData['plid'] || videoData['sid'];

		/* 没有cid的或者ugc视频不加载回复列表 */
		if (!cid || 9001 == cid || 0 == cid) {
			return '';
		}

		var url = 'http://access.tv.sohu.com/reply/list/'
				+ cid + '_' 
				+ plid + '_' 
				+ vid + '_'
				+ ((page - 1) * Comment.pageSize) + '_'
				+ Comment.pageSize + '.js?' + (+new Date)
				;

		return url;
	},

	/**
	 * 返回单条回复html
	 */
	getCommentItemHTML: function(data) {
		var showFrom = (data['reply_from_name'] && data['reply_from_url'].indexOf('my.tv.sohu.com/user') < 0),
			html = [
			'<dd id="comment-' + data['id'] + '">',
				'<em style="background-image:url(' + (data['user_small_photo'] || data['authorimg'] || 'http://tv.sohu.com/upload/space/skin/imgs/avatar_s.jpg') + ')"></em>',
				'<div>',
					'<a class="u" ' + 
						(showFrom ? 'style="background-image:url(' + data['reply_from_icon'] + ')"' : 'about:blank') +
					'>' + unescape(data['author']) + '</a>',
					'<div class="content">' + unescape(data['content']) + '</div>',
					'<p class="f">',
						'<time>' + Util.timeFromNow(data['time']) + '</time>',
						(showFrom ? 
						 	(' 来自: <a href="' + data['reply_from_url'] + '" target="_blank">' + unescape(data['reply_from_name']) + '</a>')
						  : ''),

					'</p>',
				'</div>',
			'</dd>'
		];

		return html.join('');
	}

};
var Swipe = {

	/**
	 * 手指开始移动前滑动对象的相对位置（相对于原始位置） 
	 */
	startX: 0,

	/**
	 * 手指开始移动时在屏幕上的位置
	 */
	startPoint: [0, 0],
	
	/**
	 * 手指移动过程中滑动对象当前的相对位置（相对于原始位置）
	 */
	lastX: 0,

	/**
	 * 滑动的页码标记
	 */	
	page: 1,
	
	/**
	 * 滑动容器的总页数
	 */	
	pageCount: 1,


	/**
	 * 滑动容器的宽度
	 */	
	scrollerWidth: 0,

	/**
	 * 窗口的innerWidth，用来缓存
	 */	
	windowWidth:0,

	initiated: false,

	events: {
		onTouchStart: START_EVENT,
		onTouchMove: MOVE_EVENT,
		onTouchEnd: END_EVENT
	},

	init: function() {

		Swipe.initScroller();

		$(DOC)
			.on(Swipe.events.onTouchEnd, Swipe.onTouchEnd)
			.on(Swipe.events.onTouchMove, Swipe.onTouchMove)
			.on('touchcancel', Swipe.onTouchCancel)
			.on('click', Swipe.onTouchCancel);
	},

	initScroller: function(elWrap) {
		elWrap = elWrap || DOC;
		$('.scroll_wrap', elWrap).css({
				'webkitBackfaceVisibility': 'hidden',
				'overflowX': 'hidden',
				'webkitTransform': 'translate3d(0,0,0)'
			});

		$('.scroller', elWrap).css({
				'webkitBackfaceVisibility': 'hidden',
				'webkitTransform': 'translate3d(0,0,0)',
				'webkitTransition': '-webkit-transform 0'
			}).on(Swipe.events.onTouchStart, Swipe.onTouchStart);
	},

	/**
	 * 滚动使传入的el在窗口中可见
	 */	
	scrollToElement: function(el, animation, force) {
		var elScroller = el.parent();

		if (elScroller.length == 0) {
			return;
		}
		var elScrollerTag = elScroller.get(0);
			paddingLeft = elScrollerTag.offsetLeft, 
			paddingRight = elScrollerTag.offsetLeft, /* TODO: */
			toX = -(el.offset().left - paddingLeft),
			lastCell = elScrollerTag['lastElementChild'],
			scrollerWidth = lastCell.offsetLeft + lastCell.offsetWidth + paddingLeft + paddingRight,
			windowWidth = elScroller.parent().width(),
			maxX = scrollerWidth - windowWidth;

		var startX = parseInt(elScroller.attr('startX') || 0);

		/* 如果滚动区域的子条目已经完全显示在屏幕上则不需要滚动 */
		if (-toX < windowWidth && (-toX + el.width()) <  windowWidth && !force) {
			return;
		}

		if (toX < -maxX) {
			toX = -maxX;
		}

		if (toX > 0) {
			toX = 0;
		}
		
		elScroller.attr('startX', toX)
			.css({
				'webkitTransform': 'translate3d(' + toX + 'px,0,0)',
				'webkitTransitionDuration': (animation ? '200ms' : 0)
			});
	},

	onTouchStart: function(e) {
		
		var elTag = this,
			el = $(this),
			cellCount = elTag['childElementCount'];

		if (cellCount > 0) {

			/* 计算滚动容器的宽度 */
			Swipe.scrollerWidth = 0;
			Swipe.leftPadding = elTag.offsetLeft;
			Swipe.rightPadding = elTag.offsetLeft; /* TODO: */
			var lastCell = elTag['lastElementChild'];
			if (lastCell) {
				Swipe.scrollerWidth = lastCell.offsetLeft + lastCell.offsetWidth + Swipe.leftPadding+ Swipe.rightPadding;
			}
			/* 如果内容区域小于滚动区域尺寸，则不滚动 */
			if (Swipe.scrollerWidth <= elTag.parentNode.offsetWidth) {
				return;
			}

			Swipe.touchElement = el;
			Swipe.initiated = true;
			
			el.css('webkitTransitionDuration', '0');
			
			/* 手指开始移动前滑动对象的相对位置（相对于原始位置） */ 
			Swipe.startX = parseInt(el.attr('startX') || 0, 10);
			/* 分页滚动的边界对象 */
			Swipe.paginationElLeft = null;
			Swipe.paginationElRight = null;

			Swipe.windowWidth = el.parent().width();
			
			/* 找出第一个没有完全显示在屏幕上的对象，作为分页滚动的边界对象 */
			var elCell = elTag['firstElementChild'];
			do {
				var offsetLeft = $(elCell).get(0).offsetLeft;
				if (!Swipe.paginationElLeft && (offsetLeft + Swipe.startX >= 0)) {
					Swipe.paginationElLeft = elCell;
				}
				if (offsetLeft + elCell.offsetWidth + Swipe.startX > Swipe.windowWidth) {
					Swipe.paginationElRight = elCell;
					break;
				}
			} while (elCell = elCell.nextElementSibling);

			/* 滚动区域没有超出边界的滑动距离  */
			Swipe.deltaXInsetBound = 0;

			var event = e.originalEvent;
			Swipe.startPoint = [event.clientX, event.clientY];
		}
	},

	onTouchMove: function(e) {
		if (false === Swipe.initiated) return;
		
		var event = e.originalEvent,
			/* 手指移动过程中滑动对象当前的相对位置（相对于原始位置） */
			deltaX = event.clientX - Swipe.startPoint[0],
			deltaY = event.clientY - Swipe.startPoint[1];

		/* 当滑动到左右边界的时候做滑动距离的衰减 */

		if (deltaX > 0 && Swipe.startX >= 0 ) {
			/* 向右滑动 */
			Swipe.lastX = Swipe.startX + deltaX / 2;
		} else if (deltaX < 0 && (-Swipe.startX - deltaX >= Swipe.scrollerWidth - Swipe.windowWidth)) {
			/* 向左滑动越过右边界 */
			Swipe.lastX = -(Swipe.scrollerWidth - Swipe.windowWidth) + (deltaX - Swipe.deltaXInsetBound) / 2;
		} else {
			/* 在滑动中间部分，距离无衰减 */
			Swipe.lastX = Swipe.startX + deltaX;
			Swipe.deltaXInsetBound = deltaX;
		}
	
		if (!Swipe.isSwiping) {
			if (Math.abs(deltaY) > Math.abs(deltaX)) {
				Swipe.initiated = false;
				return;
			}
		}

		e.preventDefault();
		Swipe.isSwiping = true;
		Swipe.setPos(Swipe.lastX);
	},
	
	onTouchEnd: function(e) {
		if (Swipe.isSwiping) {

			var  toX = 0,
				page = Swipe.touchElement.attr('page') || 1;
				
			if (Swipe.lastX < Swipe.startX) {
				/* 向左滑动*/
				if (Swipe.paginationElRight) {
					toX = Swipe.paginationElRight.offsetLeft * -1;
					page++;
				} else {
					toX = Swipe.paginationElLeft.offsetLeft * -1;
				}

				var maxX = Swipe.scrollerWidth - Swipe.windowWidth;
				if (toX < -maxX) {
					toX = -maxX;
				}

			} else if (Swipe.lastX > Swipe.startX) {
				/* 向右滑动*/
				if (Swipe.paginationElLeft) {
					var elCell = Swipe.paginationElLeft,
						maxOffsetX = Swipe.windowWidth - elCell.offsetWidth - elCell.offsetLeft;
					
					/* 计算滑动距离，使滑动后的位置，让左边的分页边界对象位于右边的不超过窗口的区域 */
					do {
						toX = elCell.offsetLeft * -1;
						if ( toX > maxOffsetX) {
							page--;
							break;
						}
					} while (elCell = elCell.previousElementSibling)
				}
			}

			Swipe.touchElement.attr('page', page);
			
			if (toX > 0) {
				toX = 0;
			}
			
			Swipe.touchElement.attr('startX', toX);
			Swipe.touchElement.css('webkitTransitionDuration', '200ms');
			Swipe.setPos(toX);

			e.preventDefault();

			/* 清除工作 */
			Swipe.onTouchCancel();
		}
	},

	onTouchCancel: function() {
		Swipe.isSwiping = false;
		Swipe.initiated = false;
		Swipe.touchElement = null;
	},
	
	/*
	 * 设置滑动位置
	 */
	setPos: function(x) {
		Swipe.touchElement.css('webkitTransform', 'translate3d(' + x + 'px,0,0)');
	}

};

$().ready(function() {
	Swipe.init();

	$('.scroller').on('webkitTransitionEnd', function() {
		var page = $(this).attr('page') || 1,
			elPages = $('.scroller_page b', this.parentNode);
		elPages.removeClass('c');
		elPages.eq(page - 1).addClass('c');
	});

	$(WIN).on('resize', function() {
		$('.scroller').each(function(element) {
			var page = element.getAttribute('page') || 1;

			Swipe.scrollToElement($(element).children().eq(page - 1));
		});
	});
});

/* 在web浏览器中拖动链接或图片的时候不会中断 */
if (!IsTouch) {
	RR.addEvent('mousedown', DOC, function(e) {
		var e = new RR.event(e),
			elCur = e.target;

		while(elCur) {
			nodeName = elCur.nodeName;
			if ('A' == nodeName || 'IMG' == nodeName) {
				e.preventDefault();
				break;
			}
			elCur = elCur.parentNode;
		}
		
	}, false);
}
/**
 * 播放页的视频分享功能
 * @static
 * @autohr qianghu
 */

var Share = {

	init: function() {
		var shareButtons = $('.share_buttons a').each(Share.shareLink).on('click', function() {
			Share.closeShareMenu(null, true);
		});

		/* 分享菜单 */
		if (shareButtons.length > 0) {
			$('.share_handle').on('click', Share.toggleShareMenu);
			$(DOC).on('click', Share.closeShareMenu);
		}
	},

	/* 
	 * 打开关闭分享菜单
	 */
	toggleShareMenu: function() {
		$(DOC.body).toggleClass('share_open');
	},

	/* 
	 * 点击页面的时候关闭分享菜单
	 */
	closeShareMenu: function(e, forceClose) {
		var el = e && e.target;
		while (!forceClose && DOC !== el && DOC.body !== el) {
			if ($(el).hasClass('share_buttons share_handle')) {
				return;
			}
			el = el.parentNode;
		}
		$(DOC.body).removeClass('share_open');
	},

	/* 
	 * 生成SNS分享链接
	 */
	shareLink: function(elLink) {
		var elButton = $('em', elLink),
			type = elButton.attr('class'),
			shareLink,
			url = encodeURIComponent(location.href),
			title = encodeURIComponent(DOC['title']),
			videoData = WIN['VideoData'],
			elCover = $('link[rel="apple-touch-icon-precomposed"]').get(0),
			coverPic = (videoData && videoData['video_share_cover']) || (elCover && elCover.href) || '',
			description = encodeURIComponent($('meta[name="description"]').attr('content') || '');

		if ('weibo' == type) {
			shareLink = 'http://service.weibo.com/share/share.php?url=' + url + 
				'&appkey=1753462873&title=' + title + 
				'&pic=' + coverPic + 
				'&ralateUid=2230913455&searchPic=false';
		} else if ('renren' == type) {
			shareLink = 'http://widget.renren.com/dialog/share?resourceUrl=' + url + 
				'&srcUrl=' + url + 
				'&pic=' + coverPic + 
				'&description=' + description + 
				'&title=' + title;
		} else if ('qzone' == type) {
			shareLink = 'http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=' + url + 
				'&site=搜狐视频' + 
				'&pics=' + coverPic + 
				'&summary=' + description + 
				'&title=' + title
		}

		elLink.href = shareLink;
		elLink.target = '_blank';
	}
}

$().ready(Share.init);
var isMarathonOnline = true;

var SohuGlobal = {

	/* 页面向上滚动后给导航条加阴影 */
	lastPageOffset: 0,

	toggleNavShadow: function() {
		var pageOffset = Util.getPageOffset();
		if (SohuGlobal.lastPageOffset !== pageOffset) {
			$(DOC.body).toggleClass('nav_shadow', pageOffset > 0);
			SohuGlobal.lastPageOffset = pageOffset;
		} 
	}
};

$().ready(function() {
	var platform = 'ipad';
	if (IsAndroid || IsBlackBerry) {
		platform = 'android';
	} else if (IsIPhone) {
		platform = 'iphone';
	} else if (IsWindowsPhone) {
		platform = 'windows_phone';
	}

	var sysVersion;
	if ((sysVersion = UA.match(/Android[\s\/]([0-9\._]+)/i)) && !IsQQBrowser) {
		sysVersion = Util.getVersionNumber(sysVersion[1]);

		/* Android 2.4以下系统，在页面向上滚动后，悬浮导航中的链接不可点击，所以2.4以下禁用悬浮 */
		if (sysVersion < 2.4) {
			platform += ' fixed_nav';
		}
	}

	//PlayStation手持设备
	if (UA.indexOf('PlayStation') > -1) {
		platform += ' fixed_nav';
	}

	if (URL.getQueryString('ua')) {
		Console.log(UA);
	}

	var browserVersion;
	if (browserVersion = UA.match(/MQQBrowser(?:\/([0-9\._]+))?/i)) {
		platform += ' qq_browser';
		// 处理版本号，只保留第一个小数点 2.5.1 -> 2.5
		/*browserVersion = Util.getVersionNumber(browserVersion[1]);
		if (browserVersion < 4.3) {
			platform += ' browser_low_version';
		}*/
	} else if (IsUC) {
		platform += ' uc_browser';
	} else if (UA.match(/ MI 2 /i)) {
		/* 小米2 */
		platform += ' mi_2';
	} else if (UA.match(/ (HTC|Desire) /i)) {
		platform += ' htc';
	}

	if (IS_EXTERNAL_PLAYER) {
		platform += ' all_player';
	}

	var Body = $(DOC.body).addClass(platform);

	if (IS_EXTERNAL_PLAYER) {
		return;
	}

	/* Android下面，不用setTimeout的话可能会取到前一个页面的pageOffset */
	setTimeout(SohuGlobal.toggleNavShadow, 0);
+	RR.addEvent('scroll', WIN, SohuGlobal.toggleNavShadow);

	if (!URL.getQueryString('clientType') /* 客户端 */) {

		var downloadLabel = (1 == URL.getQueryString('isappinstalled')) /* 微信 */ ? '打开应用' : (IsAndroid ? '' : '立即下载');

		/* App下载Banner */
		var downloadBannerSettings = Storage('app_banner'),
			timeDiff = (+new Date) - parseInt(downloadBannerSettings, 10);

		if (timeDiff > 1000 * 60 * 60* 24 * 3 /* 3 Days*/) {
			downloadBannerSettings = null;
		}

		var downloadLink = Util.getDownloadAppLink();

		if ((isMarathonOnline && $('.home').length > 0) || !downloadBannerSettings) {
			var elBodyWrap = $('.body_wrap');
			if (elBodyWrap.length > 0) {

				var random = Math.random(),
					i = 0;
				if (random <= .5) {
					i = 1;
				}

				if (isMarathonOnline && $('.home').length > 0) {
					i = 0;
				} else {
					i = 1;
				}

				var bannerHTMLs = [
					'<a class="app_download app_download_marathon" position="appdownload_banner_marathon" href="http://m.tv.sohu.com/mb/avt/"><span></span></a>',
					'<a class="app_download app_download_2" position="appdownload_banner_2" href="' + downloadLink + '"><b>'  + 
						downloadLabel + '</b><span></span><em></em></a>'
				],
				bannerHTML = bannerHTMLs[i];

				var elBanner = $(bannerHTML).on('click', Util.appLink),
					elPlayerWrap = $('.player_column', elBodyWrap);
				if (elPlayerWrap.length > 0) {
					elBodyWrap = elPlayerWrap;
				}
				var elNav = $('nav');
				if (elNav.length > 0 && $('.player_column').length < 1 /* 播放页 */) {
					elNav.after(elBanner);			
				} else {
					elBodyWrap.prepend(elBanner);	
				}
				elClose = $('em', elBanner).on('click', function() {
					elBanner.remove();
					Storage('app_banner', (+new Date));
					return false;
				});
			}
		}

		var videoData = WIN['VideoData'];

		//播放页下载按钮
		if (videoData) {

			var elVoicePinner;

			$('.channel_link').on('click', function() {
				var $this = $(this);
				ClickTrace.pingback(null, 'link_channel');
				setTimeout(function() {
					location.href = $this.attr('href');
				}, 50);
				return false;
			});

			/* 播放器下面的下载观看按钮 */
			$('<span class="app_download_link" position="appdownload_belowplayer"><b></b>下载</span>').prependTo($('.appbar'))
				.on('click', Util.appLink);

			/* 我已观看行 */
			var appVersion = Storage('app_ver'),
				currentApp = APP_VER[(IsIOS ? 'ios' : 'android')],
				currentAppVersion = currentApp['version'];

			if (appVersion !== currentAppVersion) {
				var elAppNotice = $([
					'<div class="app_notice_bar">',
						'<span class="close">我已安装</span>',
						'<span class="app_download_link" position="appdownload_hd_video">安装客户端，体验高清视频</span>',
					'</div>'
				].join('')).insertBefore($('.season_list'));

				$('.app_download_link', elAppNotice).on('click', Util.appLink);
				$('.close', elAppNotice).on('click', function() {
					Storage('app_ver', currentAppVersion);
					elAppNotice.remove();
					if (elVoicePinner) {
						elVoicePinner.removeClass('show');
					}
					ClickTrace.pingback(null, 'tip_installed');
				});
			}


			/* App下载弹框 */
			var downloadBannerSettings = Storage('app_pinner'),
				timeDiff = (+new Date) - parseInt(downloadBannerSettings, 10);

			if ('0' === downloadBannerSettings) {
				downloadBannerSettings = true;
			} else if (timeDiff > 1000 * 60 * 60* 24 /* 1 Days*/) {
				downloadBannerSettings = null;
			}

			if ((appVersion !== currentAppVersion) && !downloadBannerSettings) {

				var html = '<div class="voice_pinner"' + 
					(IsAndroid ? ' href="http://upgrade.m.tv.sohu.com/channels/hdv/824/1.0/WebVideo_v1.0_824_201311271605.apk?t=1"' : '') + 
					' position="appdownload_floatdiv"><b>搜狐视频V' + currentAppVersion + '版本上线</b>' + currentApp['tip'] + '<em></em></div>';

				if (isMarathonOnline) {
					html = '<div class="voice_pinner" href="http://m.tv.sohu.com/mb/avt/" position="marathon_floatdiv" style="line-height:1.6">与搜狐视频一起看大片<br />赢5S大奖!<em></em></div>';
				}

				elVoicePinner = $(html)
					.appendTo(DOC.body)
					.on('click', function() {

						if (!isMarathonOnline) {
							Storage('app_ver', currentAppVersion);
						}

						Util.appLink.apply(this);

						elVoicePinner.removeClass('show');
					});
				$('em', elVoicePinner).on('click', function() {
					elVoicePinner.removeClass('show');
					/* 下载框1天后出现 */
					if (!isMarathonOnline) {
						Storage('app_pinner', (+new Date));
					}
					return false;
				});

				WIN.onload = function() {
					/* 不显示uc书签的时候显示客户端提示 */
					if (!Body.hasClass('bookmark_show_tip bookmark_show_handle uc_bookmark_show bookmark')) {
						elVoicePinner.addClass('show');
						ClickTrace.pingback(null, 'tip_appupdate');
					}
				};
			}

		}

	}

	setTimeout(function() {
		if (Util.getPageOffset() < 1) {
			WIN.scrollTo(0, 0);
		}
	}, 0);

	/* 滚动主导航使高亮的导航项显示在屏幕上 */
	var navItem = $('.channel_nav .c');
	if (navItem.length > 0) {
		Swipe.scrollToElement(navItem);
		setTimeout(function() {
			Swipe.scrollToElement(navItem);
		}, 100);
		setTimeout(function() {
			Swipe.scrollToElement(navItem);
		}, 500);
	}

	/* 主导航行为统计 */
	$('.channel_nav a').on('click', function() {
		var $this = $(this),
			position = 'index_nav_' + $this.attr('position');
		ClickTrace.pingback(null, position);
		setTimeout(function() {
			location.href = $this.attr('href');
		}, 10);
		return false;
	});

});
var VideoData = WIN['VideoData'],
	Body;

var Bookmark = {

	init: function() {

		if (IS_EXTERNAL_PLAYER) {
			return;
		}

		Body = $(DOC.body);

		//Android UC浏览器直接调用浏览器接口
		if (IsUC && IsAndroid) {
			Bookmark.uc();
		}/* else if (VideoData) {
			Bookmark.showBottomBookmarkTip();
		}*/
	},

	/* 书签提醒的状态 0: 显示大按钮 1: 显示小按钮 2: 不显示 */
	getBookmarkState: function() {
		var bookmarkTipTime = Storage('bookmark_tip'),
			timeDiff = (+new Date) - parseInt(bookmarkTipTime, 10);

		if (!bookmarkTipTime) {
			return 0;
		}

		if (timeDiff > 1000 * 60 * 60* 24 * 15 /* 15 Days*/) {
			return 2;
		}
		return 1;
	},

	showBottomBookmarkTip: function() {

		var bookmarkState = Bookmark.getBookmarkState(),
			bookmarkClass = 'bookmark_show_handle';

		if (1 === bookmarkState) {
			bookmarkClass += ' bookmark_show_icon';
		} else if (2 == bookmarkState) {
			return;
		} else {
			/* 书签在用户未点击状态下展示的次数（大按钮的展示次数） */
			ClickTrace.pingback(null, 'tip_bookmark_show');
		}

		var texts = {
				'iphone': ['书签图标', '添加到主屏幕', ''],
				'default': ['菜单', '添加书签', ''],
				'360': ['菜单', '加入收藏', ''],
				'baidu': ['书签图标', '添加书签', 'left_top'],
				'oupeng': ['书签图标', '收藏到首页', 'left_top oupeng'],
				'mi': ['书签图标', '发送桌面', 'left_top'],
				'sogou': ['菜单', '添加收藏', 'right_bottom']
			},
			text = texts['default'];

		if (UA.match(/baidubrowser/i)) {
			text = texts['baidu'];
		} else if (UA.match(/360browser/i)) {
			text = texts['360'];
		} else if (UA.match(/SogouMSE/i)) {
			text = texts['sogou'];
		} else if (UA.match(/Oupeng/i)) {
			text = texts['oupeng'];
		} else if (UA.match(/MiuiBrowser/i)) {
			text = texts['mi'];
		} else if (IsIPhone) {
			text = texts['iphone'];
		}

		var html = [
			'<div class="bookmark_frame ' + text[2] + '">',
				'<span class="bookmark_handle button">收藏搜狐视频</span>',
				'<div class="bookmark_tip">',
					'<p class="text">点击浏览器' + text[0] + '，选择“' + text[1] + '”</p>',
					'<a class="button button_close">知道了</a>',
				'</div>',
			'</div>'
		];

		var elBookmark = $(html.join(''))
			.on('click', Bookmark.showBookmarkIntro)
			.appendTo(Body);

		setTimeout(function() {
			Body.addClass(bookmarkClass);
		}, 0);
	},

	//显示添加书签说明的弹层
	showBookmarkIntro: function(e) {
		if (Body.hasClass('bookmark_show_tip')) {
			var el = $(e.target);
			if (el.hasClass('button_close')) {
				Body.removeClass('bookmark_show_tip').addClass('bookmark_show_handle bookmark_show_icon');

				//记录用户关闭书签提醒的时间
				var bookmarkState = Bookmark.getBookmarkState();
				if (1 !== bookmarkState) {
					Storage('bookmark_tip', (+new Date));

					/* 书签提醒的点击次数，只记录第一次从大按钮变成小按钮的点击次数 */
					ClickTrace.pingback(null, 'tip_bookmark_click');
				}
			}
		} else {
			//显示书签说明
			Body.removeClass('bookmark_show_icon').addClass('bookmark_show_tip');
		}

	},

	//UC书签
	uc: function() {
		if (Body.hasClass('home') || //首页
			VideoData //播放页
		) {
			var ucVersion = 0;
			if ((ucVersion = UA.match(/UCBrowser[\s\/]([0-9\._]+)/i))) {
				ucVersion = Util.getVersionNumber(ucVersion[1]);
			}

			if (ucVersion >= 9) {
				var UCMarkTime = Storage('ucmark') || 0,
					timeDiff = (+new Date) - parseInt(UCMarkTime, 10);

				if (timeDiff > 1000 * 60 * 60* 24 * 30 /* 30 Days*/) {

					var elUCBookmark,
						src = 'http://app.uc.cn/appstore/AppCenter/frame?uc_param_str=nieidnutssvebipfcp&api_ver=2.0&id=513',
						elFrame = $('<div class="uc_bookmark_frame" ><iframe frameborder="0" src="' + src + '"></iframe></div>').appendTo(DOC.body),
						showUCMark = function() {

							Body.addClass('bookmark');

							if (elUCBookmark) {
								Body.addClass('uc_bookmark_show');
							} else {
								elUCBookmark = $('<div class="uc_bookmark_handle"><em class="close"></em><span class="button">添加</span>添加<b>搜狐视频</b>到你的浏览器首页，访问更方便</div>')
									.on('click', function() {
										Body.addClass('uc_bookmark_show');
									})
									.appendTo(DOC.body);

								$('.close', elUCBookmark).on('click', function() {
									elUCBookmark.remove();
									Storage('ucmark', (+new Date));
									return false;
								});
							}
						};

					RR.addEvent('message', WIN, function(e) {
					 	var data = e['data'];
					 	if (data) {
					 		var message = data['message'],
					 			type = data['type'];

					 		if ('not exist' == message || '' == message) {
					 			if ($('.voice_pinner').hasClass('show')) {
					 				return;
					 			}

					 			showUCMark();
					 			ClickTrace.pingback(null, 'tip_uc_nav_show');

					 		} else if (('close' == message) || ('cancle' == message) || ('success' == message)) {
					 			Body.removeClass('bookmark_show uc_bookmark_show');
					 			/* 添加成功 */
					 			if ('1' == type) {
					 				elUCBookmark.remove();
					 				Storage('ucmark', '0');
					 				ClickTrace.pingback(null, 'tip_uc_nav_add');
					 			}
					 		}
					 	}
					});	
				}	
			}
		}

	}

};

$().ready(Bookmark.init);
/**
 * 浮动标题栏
 * @static
 * @autohr qianghu
 */

var FloatTitleBar = {

	menuWrapCache: {},
	menuItemCache: {},
	menuItems: [],

	floatTitleBar: null,
	floatTitleHeight: 0,

	topPadding: 0,

	currentHighlightMenuKey: '',

	init: function() {

		if ($(DOC.body).hasClass('fixed_nav')) {
			return;
		}

		/* 魅族手机自带浏览器的UA是iPhone的UA，所以只能通过屏幕尺寸来判断了 */
		if (Util.isMeizu()) {
			return;
		}
		
		if ($('*[float_menu]').length > 0) {
			FloatTitleBar.topPadding = 48;
			FloatTitleBar.updateMenuItem();

			RR.addEvent('load', WIN, FloatTitleBar.updateMenuItem);

			RR.addEvent('resize', WIN, FloatTitleBar.updatePosition);
			RR.addEvent('scroll', WIN, FloatTitleBar.updatePosition);
			$(DOC).on('touchmove', FloatTitleBar.updatePosition);
		}

	},

	updateMenuItem: function() {

		if ($(DOC.body).hasClass('fixed_nav')) {
			return;
		}

		FloatTitleBar.currentHighlightMenuKey = '';

		if (FloatTitleBar.floatTitleBar) {
			FloatTitleBar.floatTitleBar.removeClass('fixed_title');
		}

		FloatTitleBar.topPadding = $('nav').height() + 2;

		FloatTitleBar.elTitleBars = $('*[float_menu]');
		FloatTitleBar.floatTitleBar = FloatTitleBar.elTitleBars.eq(0);

		var n = 0;

		FloatTitleBar.elTitleBars.each(function(element) {
			var key = element.getAttribute('float_menu'),
				label = element.getAttribute('float_menu_label'),
				el = $(element);

			var menuItem = $('.k_' + key, FloatTitleBar.floatTitleBar);
			if (menuItem.length < 1) {
				menuItem = $('<b class="k_' + key + '" key="' + key + '">' + label + '</b>').appendTo(FloatTitleBar.floatTitleBar);
			}
			menuItem.insertAfter($('b[key]', FloatTitleBar.floatTitleBar).eq(n));/* 按照标题顺序调整导航菜单位置 */
			FloatTitleBar.menuItemCache[key] = menuItem.on('click', FloatTitleBar.scrollTo);

			FloatTitleBar.menuWrapCache[key] = el.parent().parent();

			if (n > 0) {
				var _menuItems = $('b[key]', el),
					_menuItem,
					l = _menuItems.length;
				while (l--) {
					_menuItem = _menuItems.eq(l);
					if (l > 0) {
						_menuItem.remove();
					} else {
						_menuItem.removeClass('c');
					}
				};
			}

			n++;
		});

		FloatTitleBar.floatTitleHeight = FloatTitleBar.floatTitleBar.height();
		FloatTitleBar.topPadding += FloatTitleBar.floatTitleHeight;

		/* Android下面，不用setTimeout的话可能会取到前一个页面的pageOffset */
		setTimeout(FloatTitleBar.updatePosition, 0);
	},

	updatePosition: function() {

		/* 滚动页面的时候更新浮动导航条位置 */
		var elItem = FloatTitleBar.floatTitleBar,
			offsetTop = elItem.parent().offset()['top'],
			pageOffset = Util.getPageOffset(),
			itemClientTop = offsetTop - pageOffset,
			highlightMenuKey;

		if (itemClientTop < FloatTitleBar.topPadding - FloatTitleBar.floatTitleHeight) {
			elItem.addClass('fixed_title');
		} else {
			elItem.removeClass('fixed_title');
		}

		/* 根据页面位置更新浮动导航条中的高亮选项 */
		for (var i = 0, l = FloatTitleBar.elTitleBars.length; i < l; i++) {
			var elTitleItem = FloatTitleBar.elTitleBars.eq(i),
				key = elTitleItem.attr('float_menu'),
				elWrapItem = FloatTitleBar.menuWrapCache[key],
				offsetTop = elWrapItem.offset()['top'],
				elMenuItem = FloatTitleBar.menuItemCache[key],
				topPadding = FloatTitleBar.topPadding,
				windowHeight = WIN['innerHeight'],
				
				itemClientTop = offsetTop - pageOffset,
				itemClientBottom = offsetTop - pageOffset + elWrapItem.height();

			if (
				(0 === i && itemClientTop >= topPadding) || /* 第一个区块标题 */
				(itemClientTop > topPadding && itemClientTop < windowHeight / 3) || /* 区块顶部位于顶部导航和窗口高度三分之一处 */
				(itemClientTop <= topPadding && itemClientBottom >= windowHeight / 3) || /* 区块顶部超出窗口切区块底部处于窗口高度三分之一的下方 */
				((i === l - 1) && itemClientBottom <= windowHeight) /* 最后一个区块的底部显示在窗口中时（在最后一个区块高度达不到窗口高度三分之二的时候会到达此情况） */
			) {
				highlightMenuKey = key;
				if (0 === i) {
					break;
				}
			}
		};

		FloatTitleBar.highlightMenuItem(highlightMenuKey);
	},

	/* 根据页面位置更新浮动导航条中的高亮选项 */
	highlightMenuItem: function(highlightMenuKey) {
		/* 根据页面位置更新浮动导航条中的高亮选项 */
		if (highlightMenuKey !== FloatTitleBar.currentHighlightMenuKey) {
			var key, elMenuItem;
			for (key in FloatTitleBar.menuItemCache) {
				elMenuItem = FloatTitleBar.menuItemCache[key];
				if (key === highlightMenuKey) {
					elMenuItem.addClass('c');
				} else {
					elMenuItem.removeClass('c');
				}
			}
			FloatTitleBar.currentHighlightMenuKey = highlightMenuKey;
		}
	},

	scrollTo: function(e, key) {
		var key = $(this).attr('key'),
			elWrapItem = FloatTitleBar.menuWrapCache[key];

		if (elWrapItem) {


			DOC.body.scrollTop = elWrapItem.offset()['top'] - FloatTitleBar.topPadding + FloatTitleBar.floatTitleHeight + 2;

			/* 因为根据页面滚动位置计算出来的需要高亮的导航菜单可能跟用户点击的菜单不同，所以在页面滚动后强制高亮用户点击的菜单项 */
			setTimeout(function() {
				FloatTitleBar.highlightMenuItem(key);
			}, 0);

			return;

			//页面滚动动画
			/*
			var currentScrollTop = DOC.body.scrollTop,
				scrollTo = elWrapItem.offset()['top'] - FloatTitleBar.topPadding + FloatTitleBar.floatTitleHeight + 2,
				duration = 300,
				timerStep = 40,
				currentTimer = 0;

			var scrollFn = function() {
				var _scrollTo  = currentScrollTop + (scrollTo - currentScrollTop) * (currentTimer / duration);
				DOC.body.scrollTop = _scrollTo;

				if (currentTimer >= duration) {
					return;
				}

				currentTimer += timerStep;
				setTimeout(scrollFn, timerStep);
			};

			scrollFn();*/
		}
	}
};

$().ready(FloatTitleBar.init);
//RR.addEvent('load', WIN, FloatTitleBar.init);
/**
 * 视频播放页逻辑
 * @autohr qianghu
 */

var MainPlayer;

var videoData = WIN['VideoData'];

var PlayerPage = {

	/* nid转换为vid的映射对象 */
	nidMap: {},

	channelMap: {
		'1': ['电影', 'movie'],
		'1000': ['电影', 'movie'],
		'2': ['电视剧', 'drama'],
		'7': ['综艺', 'show'],
		'8': ['纪录片', 'documentary'],
		'13': ['娱乐', 'yule'],
		'16': ['动漫', 'comic'],
		'25': ['新闻', 'news'],
		'24': ['音乐', 'music']
	},

	ajaxObj: null,

	player: null,

	currentURL:  null,

	currentVid: null,

	/* 请求api的重试次数计数，
	 * 异步请求视频接口的时候，第一次请求点播视频接口，如果取不到，按ugc视频再取一次接口
	 * 为了防止取不到视频的时候陷入死循环，使用这个计数，超过2次不再继续获取
	 */
	retryCount:0, 

	init: function() {

		$(WIN).on('resize', PlayerPage.updateDetailHeight);

		RR.addTagEvent('click', 'a', function(e) {
			var el = $(this),
				vid = el.attr('vid'),
				channeled = el.attr('channeled');
			if (vid) {
				WIN['scrollTo'](0, 0); //页面滚动到最顶端
				Body.removeClass('search_actived history_open'); //关闭搜索热词提示和历史记录面板
				PlayerPage.loadVideo(vid, channeled);
				return false;
			}
		});

		//IsHistorySupport在channel.js中定义
		if (IsHistorySupport) {
			RR.addEvent('popstate', WIN, PlayerPage.updatePage);
		}

		if (videoData) {
			/* 统计代码中的hdpv.js，需要使用全局vid和pid变量发送统计数据 */
			WIN['vid'] = videoData['vid'];
			WIN['pid'] = videoData['plid'];

			//视频封面
			videoData['video_cover'] = $('meta[property="og:image"]').attr('content');
			videoData['tv_name'] = $('.player_info h3').html();

			/* 保存nid到vid的映射，用在给history做检索用 */
			var match;
			if (match = location.pathname.match(/(\/[0-9]+\/n[0-9]+|\/us\/[0-9]+\/[0-9]+)\.shtml/i)) {
				PlayerPage.nidMap[match[1]] = videoData['vid'];
			}
		
			//初始化播放页
			$().ready(function() {
				var elDesc = $('.video_detail .desc').on('click', function() {
					elDesc.toggleClass('expand');
				});
				PlayerPage.updatePlayerPageByVideoData(videoData);
			});
		}
	},

	//由onpopstate事件触发，在更新页面url的时候更新播放页
	updatePage: function() {

		//刷新页面
		if (null === PlayerPage.currentURL) {
			PlayerPage.currentURL = location.href;
			return;
		}

		var Body = $(DOC.body).removeClass('page_home page_channel page_player');

		var match,
			pathName = location.pathname;

		/* 视频页 */
		if (match = pathName.match(/\/v([0-9]+)\.shtml/i)) {
			PlayerPage.loadVideo(match[1], $().getUrlParam('channeled'));
			Body.addClass('page_player');

		} else if (match = pathName.match(/(\/[0-9]+\/n[0-9]+|\/us\/[0-9]+\/[0-9]+)\.shtml/i)) {
			var vid = PlayerPage.nidMap[match[1]];
			if (vid) {
				PlayerPage.loadVideo(vid, $().getUrlParam('channeled'));
				Body.addClass('page_player');
			} else {
				location.href = location.pathname;
			}

		/* 首页 */
		} else if (pathName.match(/\/(\?.*)?$/)) {
			Body.addClass('page_home');

		/* 频道页 */
		} else {
			Body.addClass('page_channel');
		}
	},

	/* 这个方法目前没有用到，应用场景是从非播放页跳转到播放页的时候，在非播放页插入播放页的html代码 */
	showPageGrid: function() {
		if ($('.page_wrap_player').length < 1) {
			var html = [
				'<div class="page_wrap_player video_channel_0">',
					'<div class="player_column item_ver_wrap">',

						'<div class="player player_init" id="#main_player">',
							'<div class="video"></div>',
							'<div class="poster">',
								'<div class="cover" data-key="video_cover" data-type="image" style="background-image:url(about:blank)"></div>',
								'<div class="player_info">',
									'<h3 data-key="tv_name"></h3>',
									'<div data-key="tv_summary"></div>',
								'</div>',
								'<div class="time"><em></em><span data-key="totalDuration" data-type="time"></span></div>',
							'</div>',

							'<div class="player_controls">',
								'<div class="button_play"><span><b></b></span></div>',
								'<div class="message"><p></p></div>',
								'<div class="slider_bar">',
									'<div class="trackbar">',
										'<b class="buffered"></b>',
										'<b class="played"><em class="handle"></em><em class="dragbar"><em class="drag_timer"></em></em></b>',
									'</div>',
									'<div class="time">',
										'<em></em><b class="current_time">00:00</b> / <span class="duration" data-key="totalDuration" data-type="time"></span>',
									'</div>',

									'<div class="controllers">',
										'<div class="fullscreen disabled"><span><b></b></span></div>',
									'</div>',
								'</div>',
							'</div>',

						'</div>',

					'</div>',
				'</div>'

			].join('');

			$('.body_wrap').append(html);
		}
		$(DOC.body).removeClass('page_channel home').addClass('page_player');
		SohuGlobal.toggleNavShadow();
	},

	/* 使用vid在页面中异步加载并播放一个视频 */
	loadVideo: function(vid, channeled) {

		if (vid == videoData['vid']) {
			return;
		}

		var params = $().extend({}, URL.URLGlobalParms);

		if (channeled) {
			params['channeled'] = channeled;
		}
		
		var paramsString = URL.objToQueryString(params);
		var url = location['origin'] + '/v' + vid + '.shtml' + (paramsString ? '?' + paramsString : '');

		/* 暂时只在iOS上打开异步加载 */
		if (!IsIOS || !IsHistorySupport) {
			location.href = url;
			return;
		}

		//PlayerPage.showPageGrid();

		PlayerPage.currentVid = vid;

		var params = $().extend({
			'playurls': '1'
		}, API_PARAMS);

		/* 重置请求计数 */
		PlayerPage.retryCount = 0;

		var videoListURL = '/api/video/info/' + vid + '.json?' + $().param(params);

		if (!PlayerPage.ajaxObj) {
			PlayerPage.ajaxObj = new ajaxObj('', {
				beforeSend: PlayerPage.beforeLoadVideo,
				always: PlayerPage.loadVideoCallback
			});
		}

		PlayerPage.ajaxObj.get(videoListURL);

		if (url !== location.href) {

			/* 如果nid格式的地址和vid可以对应，则不更新url */
			var match,
				_vid;
			if (match = location.pathname.match(/(\/[0-9]+\/n[0-9]+|\/us\/[0-9]+\/[0-9]+)\.shtml/i)) {
				_vid = PlayerPage.nidMap[match[1]];
				if (_vid == vid) {
					return;
				}
			}
			history.pushState(null, null, url);
		}
	},

	/* 开始加载视频api之前 */
	beforeLoadVideo: function() {
		$(DOC.body).addClass('page_player_loading');
		MainPlayer.pause();
	},

	/* 从api获取视频数据后的回调，更新播放页内容信息 */
	loadVideoCallback: function(ajaxObj) {

		var responseData = ajaxObj.responseData,
			data = responseData && responseData['data'];

		//先用video/info取视频数据，如果没有vid，则从ugc接口再取一次
		if (!data || !data['tv_name']) {
			if (PlayerPage.retryCount > 1) {
				$(DOC.body).removeClass('page_player_loading');
				
				//从api加载失败并重试一次，还失败的话直接跳转页面
				location.href = 'v' + PlayerPage.currentVid + '.shtml';
				return;
			}
			var params = $().extend({
				'c': '9001'
			}, API_PARAMS),
			videoListURL = '/api/video/playinfo/' + PlayerPage.currentVid + '.json?' + $().param(params);
			PlayerPage.ajaxObj.get(videoListURL);

			PlayerPage.retryCount ++;
			return;
		}


		$(DOC.body).removeClass('page_player_loading');

		var cid = '|' + data['cid'] + '|';

		data['tv_desc'] = data['tv_desc'] || data['tv_name'];

		data['tv_detail'] = PlayerPage.getVideoDetail(data);
		data['tv_summary'] = PlayerPage.getVideoSummary(data);
		data['video_cover'] = data['ver_high_pic'] || data[('|2|8|16|'.indexOf(cid) > -1 ? 'ver_big_pic' : 'video_big_pic')];

		var title = data['tv_name'];
		title = title + (title ? ' - ' : '') + '搜狐视频手机版';
		DOC['title'] = title;

		/* 当前视频的高亮对象 */
		$('*[data-type="highlight"]').removeClass('c');

		/* 更新页面展示的信息 */
		$('*[data-key]').each(function(element) {
			var el = $(element),
				dataKey = el.attr('data-key'),
				dataType = el.attr('data-type'),
				dataItem = data[dataKey] || '';

			if ('image' == dataType) {
				el.css('backgroundImage', 'url(' + (dataItem || 'about:blank') + ')');
			} else if ('highlight' == dataType) {
				if (el.attr('data-value') == dataItem) {
					el.addClass('c');
				}
			} else if ('attr' == dataType) {
				el.attr(el.attr('data-value'), dataItem);
			} else {
				if ('time' == dataType) {
					dataItem = Util.secondsToTime(dataItem);
				}
				el.html(dataItem);
			}
		
		});

		/* 拼装播放视频需要的数据 */
		videoData = WIN['VideoData'] = {
			'vid': data['vid'] || PlayerPage.currentVid,
			'cid': data['cid'] || '9001',
			'sid': data['sid'] || data['vid'],
			'plid': data['play_list_id'] || data['vid'],
			'video_cover': data['video_cover'],
			'video_share_cover': data['video_big_pic'],
			'videoCount': data['vcount'],
			'tv_name': data['tv_name'],
			'ipLimit': data['ipLimit'] || '0',
			'urls' : {
				'm3u8': [
					data['url_nor'] || '',
					data['url_high'] || '',
					data['url_super'] || ''
				],
				'mp4': [
					data['url_nor_mp4'] || '', 
					data['url_high_mp4'] || ''
				],
				'downloadUrl': Util.getDownloadURL(data['downloadurl']) || ''
			},
			'duration': data['totalDuration'],
			'apiData': data
		};

		PlayerPage.updatePlayerPageByVideoData(videoData);

	},

	/* 在视频播放器中显示没有版权的提示 */
	showTips: function() {
		var elPlayer = $('#main_player').addClass('forbidden'),
			elMessage = $('.player_message');

		if (elMessage.length < 1) {
			$('<span class="player_message">您所在的国家或地区, 不在所播放的节目版权范围</span>')
			.insertAfter(elPlayer);
		}
	},

	/* ip接口验证回调  */
	ipCallback: function(ajaxObj) {
		var data = ajaxObj.responseData || {};

		if (data['data'] && ('1' == data['data']['iplimit'])) {
			PlayerPage.showTips();
		} else {
			$('#main_player').removeClass('forbidden');
			PlayerPage.updatePlayerPageByVideoData(videoData, true);
		}
	},


	/* 更新播放页信息的操作放在这个方法里面，两个执行时机：
	 * 1. 播放页第一次加载
	 * 2. 异步加载播放页
	 */
	updatePlayerPageByVideoData: function(videoData, checked) {

		var showPlayer = true;

		if (!checked) {

			if ('1' == videoData['h5Limit']) {
				PlayerPage.showTips();
				showPlayer = false;

			/* 需要判断地区的视频，请求一次ip接口  */
			} else if ('1' == videoData['ipLimit']) {
				/* 调用服务端接口获取ip限制数据 */
				var params = $().extend({
					'from': 'h5',
					'poid': '1',
					'sysver': Util.getOSVersion() || '0'
				}, API_PARAMS);

				$().get('/api/mobile_user/device/clientconf.json?' + $().param(params), {
					always: PlayerPage.ipCallback,
					timeout: 5
				});

				return;
			}
		}

		//创建视频播放器
		if (!MainPlayer) {
			MainPlayer = new Player('#main_player');
		}
		//加载当前视频的播放器
		if (true === showPlayer) {		
			MainPlayer.currentTime(0);
			MainPlayer.loadVideoByData(videoData, 0);
		}

		var cid = videoData['cid'] + '';
		if (!IS_EXTERNAL_PLAYER) {

			/* 处理评分 */
			var elScore = $('.score');

			if (elScore.length > 0 && videoData) {
				if (cid.match(/^(2|1000|16|7|8)$/)) {
					var num = (elScore.attr('num') + '').replace(/^([0-9]+)\.([0-9]).*/, '<b>$1</b>.$2分');
					elScore.html(num).css('display', 'block');
				} else {
					elScore.css('display', 'none');
				}
			}

			/* 评论 */
			Comment.loadComment(videoData);

			/* 更新视频详情描述高度 */
			PlayerPage.updateDetailHeight();

			/* 更新分享链接 */
			$('.share_buttons a').each(Share.shareLink);

			/* 更新频道链接 */
			var channelData = PlayerPage.channelMap[cid];
			if (channelData) {
				$('.channel_link').attr('href', location['origin'] + '/' + channelData[1]).attr('class', 'channel_link channel_link_' + cid).html(channelData[0] + '频道');
			} else {
				$('.channel_link').attr('href', location['origin']).attr('class', 'channel_link').html('更多精彩视频');
			}

			/* 检查当前视频是否存在稍后观看列表里面 */
			var isAdded = PlayHistory.checkIsVideoAddedToWatchLater(videoData);
			$('.watch_later_icon').toggleClass('watch_later_icon_done', isAdded);
		}

		/* 剧集和相关剧集列表 */
		setTimeout(function() {
			TvSetList.loadByVideoData(videoData);
		}, 50);

	},

	/* 更新视频详情描述高度 */
	updateDetailHeight: function() {
		var elDesc = $('.video_detail .desc');
		elDesc.toggleClass('has_more', $('span', elDesc).height() > 110);
	},

	/* 根据api数据拼装剧集简介（在视频封面上的内容） */
	getVideoSummary: function(data) {
		var html = [],
			tempValue,
			cid = '|' + data['cid'] + '|',
			vcount = data['vcount'],
			totalSet = data['totalSet']
			;

		if ('|2|16|'.indexOf(cid) > -1) { //电视剧、动漫
			html.push('<p>更新至' + vcount + '集</p>');
		}

		if ('|8|'.indexOf(cid) > -1) { //纪录片
			html.push('<p>更新至' + vcount + '期</p>');
		}

		if ('|7|'.indexOf(cid) > -1) { //综艺
			tempValue = data['tvGuest'];
			if (tempValue) {
				html.push('<p>嘉宾: ' + tempValue.replace(/;/g, ' ') + '</p>');
			}
			tempValue = data['tvPresenter'];
			if (tempValue) {
				html.push('<p>主持人: ' + tempValue.replace(/;/g, ' ') + '</p>');
			}
		}

		if ('|1|'.indexOf(cid) > -1) { //电影
			tempValue = data['director'];
			if (tempValue) {
				html.push('<p>导演: ' + tempValue.replace(/;/g, ' ') + '</p>');
			}
		}

		if ('||0|13|24|'.indexOf(cid) > -1) { //音乐、娱乐
			tempValue = data['update_time'];
			if (tempValue) {
				html.push('<p>' + Util.dateString(tempValue) + '</p>');
			}
		}

		if ('|1|2|'.indexOf(cid) > -1) { //电影、电视剧
			tempValue = data['main_actor'];
			if (tempValue) {
				html.push('<p>主演: ' + tempValue.replace(/;/g, ' ') + '</p>');
			}
		}

		if ('|16|'.indexOf(cid) > -1) { //动漫
			tempValue = data['tv_year'];
			if (tempValue) {
				html.push('<p>年份: ' + tempValue + '</p>');
			}
		}
		
		if ('|7|'.indexOf(cid) > -1) { //综艺
			tempValue = data['area'];
			if (tempValue) {
				html.push('<p>地区: ' + tempValue.replace(/;/g, ' ') + '</p>');
			}
		}

		if ('|8|'.indexOf(cid) > -1) { //纪录片
			tempValue = data['tv_cont_cats'];
			if (tempValue) {
				html.push('<p>类型: ' + tempValue.replace(/;/g, ' ') + '</p>');
			}
		}

		return html.join('');
	},

	/* 根据api数据拼装剧集详情 */
	getVideoDetail: function(data) {
		var html = [],
			tempValue,
			cid = '|' + data['cid'] + '|',
			vcount = data['vcount'],
			totalSet = data['totalSet']
			;

		//集数
		if ('|2|16|7|8|'.indexOf(cid) > -1) {
			html.push('<label>' + ('|7|' == cid ? '期' : '集') + '数:</label>');
			html.push('<p>');

			if ('|7|' == cid) { //综艺
				html.push('更新至' + vcount + '期');
			} else { 
				var setLabel = ('|8|' == cid /* 纪录片 */ ) ? '期' : '集';
	
				if (vcount != totalSet) {
					html.push('第' + vcount + setLabel + '<span> · 共' + totalSet + setLabel + '</span>');
				} else {
					html.push('共' + totalSet + setLabel);
				}
			}

			html.push('</p>');
		}

		//年份 电影、电视剧、动漫、音乐、纪录片、星尚
		if ('|1|2|8|16|24|33|'.indexOf(cid) > -1) {
			tempValue = data['tv_year'];
			if (tempValue) {
				html.push('<label>年份:</label>');
				html.push('<p>' + tempValue + '</p>');
			}
		}

		//时间 新闻、娱乐
		if ('||0|13|25|'.indexOf(cid) > -1) {
			tempValue = data['update_time'];
			if (tempValue) {
				html.push('<label>时间:</label>');
				html.push('<p>' + Util.dateString(tempValue) + '</p>');
			}
		}

		tempValue = data['tv_cont_cats'];
		if (tempValue) {
			html.push('<label>类型:</label>');
			html.push('<p>' + tempValue.replace(/;/g, ' ') + '</p>');
		}

		//地区 纪录片、综艺
		if ('|7|8|'.indexOf(cid) > -1) {
			tempValue = data['area'];
			if (tempValue) {
				html.push('<label>地区:</label>');
				html.push('<p>' + tempValue.replace(/;/g, ' ') + '</p>');
			}
		}

		tempValue = data['director'];
		if (tempValue) {
			html.push('<label>导演:</label>');
			html.push('<p>' + tempValue.replace(/;/g, ' ') + '</p>');
		}
		tempValue = data['main_actor'];
		if (tempValue) {
			html.push('<label>主演:</label>');
			html.push('<p>' + tempValue.replace(/;/g, ' ') + '</p>');
		}

		return html.join('');
	}


};

PlayerPage.init();
/**
 * 视频速度测试脚本
 * @static
 * @autohr qianghu
 */

var videoData = WIN['VideoData'];
var RateTest = {

	/* 测试触发方式 用户触发: man 自动触发: auto */
	mode: 'man',

	apiURL: '',
	hotURL: '',

	/* m3u8文件中的调度文件加载队列，一个个加载 */
	disURLQueue:[],

	/* ts文件片段的总数 */
	videoTsCount: 0,

	/* 判断超时的Timer */
	urlTimeoutTimers:{},

	/* 已经超时的URL放在这里面 */
	urlTimeoutURLs:{},

	/* 测速的URL唯一标识 */
	id: 0,



	init: function() {
		if (null !== URL.getQueryString('r') && videoData) {
			$('.body_wrap').prepend('<div class="rate_test"><span class="button">速度测试</span><span class="tip">UID: ' +(Cookie.get('SUV') || '-') +'</span><div></div></div>');
			$('.rate_test .button').on('click', 
				function() {
					var el = $(this),
						cls = 'disabled';
					if (el.hasClass(cls)) {
						return;
					}
					el.addClass(cls);
					RateTest.startTest('man');
				});
		}
	},

	startTest: function(mode) {
		RateTest.mode = mode;
		$('.rate_test div').html('');

		//OpenAPI
		RateTest.addTitle('OpenAPI');
		RateTest.apiURL = 'http://api.tv.sohu.com/video/playinfo/' + videoData['vid'] + '.json?api_key=9854b2afa779e1a6bff1962447a09dbd&plat=6&sver=2.8&partner=999&c=1&sid=0';
		RateTest.addURLItem(RateTest.apiURL);

		//Hot VRS
		var id = RateTest.id++,
			hotURLs = videoData['urls']['m3u8'],
			hotURL,
			startTime = new Date,
			i = 0,
			l = hotURLs.length;

		for (; i < l; i++) {
			if (hotURLs[i]) {
				hotURL = hotURLs[i];
				break;
			} 
		}

		if (!hotURL) {
			return;
		}
		RateTest.hotURL = hotURL;

		RateTest.addTitle('Hot VRS');

		$('.rate_test div').append(RateTest.getItemHTML(id, hotURL));

		if (hotURL.match(/\.m3u8/i)) {
			hotURL = hotURL.replace(/http:\/\/[^\/]+/i, '/hot_vrs');
		}

		$().ajax(hotURL, {
			dataType: 'html',
			always: function(ajaxObj) {

				var contents = ajaxObj.responseText;
				if (contents) {
					var urls = contents.match(/(http:\/\/[^\s]+)/ig) || [];

					var i = 0,
						l = urls.length,
						url,
						callbackName;

					RateTest.videoTsCount = l;

					if (l > 0) {
						RateTest.URLLoaded(id, startTime, RateTest.hotURL);

						RateTest.addTitle('m3u8 (' + l +')', 'rate_test_video');

						for (var i = 0, l = urls.length; i < l; i++) {
							callbackName = 'm3u8callback_' + i;

							url = urls[i].replace(/http:\/\/[^\/]+/i, 'http://61.135.183.62') + '&prot=2&callback=' + callbackName + '&id=' + (RateTest.id++);

							//调度URL加载完成后的回调
							WIN[callbackName] = function(data) {
								var videoUrl = data['url'],
									url = this['url'],
									itemId = (url.match(/&id=([0-9]+)/i) || [])[1];

								if (videoUrl) {
									/* 
									 * 3. 一个调度URL加载完成后，获取返回的ts文件URL，
									 * 在ts文件加载完成的回调中获请求下一个调度URL（从RateTest.disURLQueue中获取下一个调度URL）
									 */
									var videoStartTime = new Date,
										id = RateTest.addURLItem(videoUrl, itemId, RateTest.requestNextDisURL);

									/* 记录一个超时指针 */
									RateTest.urlTimeoutTimers[videoUrl] = setTimeout(function() {
										RateTest.URLLoaded(id, videoStartTime, videoUrl, itemId, null, true);
										RateTest.requestNextDisURL();
									}, 30000);
								}
							}.bind({'url':url});

							/* 1. 把调度URL放入队列数组 */
							RateTest.disURLQueue.push(url);
						}

						/* 2. 开始请求第一个调度URL */
						RateTest.addURLItem(RateTest.disURLQueue.shift());
					} else {
						var elItem = $('.rate_test .item_' + id).addClass('error');
						$('time', elItem).html('!');
					}

				}
			}
		});
	},

	requestNextDisURL: function() {
		var nextDisURL = RateTest.disURLQueue.shift(),
			titleId = '#rate_test_video',
			laodedCount = $('.rate_test .item .loaded').length;
		if (nextDisURL) {
			RateTest.addURLItem(nextDisURL, null, null, titleId);
		}
		$(titleId).html('m3u8 (' + laodedCount + '/' + RateTest.videoTsCount +')');
		if (laodedCount == RateTest.videoTsCount) {
			$('.rate_test .button').removeClass('disabled');
		}
	},

	/* 添加测试URL行 */
	addURLItem: function(url, parentId, callbackFn, afterTitleId) {
		var id = (url.match(/&id=([0-9]+)/i) || [])[1];
		if (!id) {
			id = RateTest.id++;
		}
		if (parentId) {
			$('.rate_test .item_' + parentId).append(RateTest.getItemHTML(id, url, parentId));
		} else {
			if (afterTitleId) {
				$(afterTitleId).after(RateTest.getItemHTML(id, url));
			} else {
				$('.rate_test div').append(RateTest.getItemHTML(id, url));
			}
		}

		Util.loadScript(url, RateTest.URLLoaded, [id, (new Date), url, parentId, callbackFn]);
		return id;
	},

	/* 获取URL行的HTML */
	getItemHTML: function(id, url) {
		return '<p class="item item_' + id + '"><time>...</time><span>' + url + '</span></p>';
	},

	/* 
	 * 某个URL加载完成后，更新显示这个URL加载所耗时间
	 * 此方法在RateTest.addURLItem()内部调用
	 */
	URLLoaded: function(id, startTime, url, parentId, callbackFn, isTimeout) {

		var timer = RateTest.urlTimeoutTimers[url];
		if (timer) {
			clearTimeout(timer);
			delete RateTest.urlTimeoutTimers[url];
		}

		/* 已经定为超时的URL，不再发送成功的统计 */
		if (url in RateTest.urlTimeoutURLs) {
			return;
		}

		/* 已经定为超时的URL */
		if (isTimeout) {
			RateTest.urlTimeoutURLs[url] = 1;
		}

		var elItem = $('.rate_test .item_' + id).addClass(isTimeout ? 'error' : 'loaded'),
			hotVRS = '',
			clientIP = '',
			CDNIP = '',
			time = (((new Date) - startTime) / 1000).toFixed(2);

		$('time', elItem).eq(0).html(isTimeout ? '!' : time + ' s');

		if (parentId) {
			hotVRS = $('.rate_test .item_' + parentId + ' span').html().replace(/&amp;/g, '&');
		}
		if (clientIP = url.match(/cip=([0-9\.]+)/i)) {
			clientIP = clientIP[1];
			CDNIP = url.match(/http:\/\/([^\/]+)/i)[1];
		}

		var url = ['http://sptjs1.hd.sohu.com.cn/h5/tttst.html',
			'?mode=', RateTest.mode,
			'&uid=', Cookie.get('SUV') || '',
			'&api=', encodeURIComponent(RateTest.apiURL), 
			'&hotvrs=', encodeURIComponent(RateTest.hotURL),
			'&disp=', encodeURIComponent(hotVRS), 
			'&url=', encodeURIComponent(url),
			'&clientip=', clientIP, 
			'&cdnip=', CDNIP, 
			'&speed=', time,
			(isTimeout ? '&timeout' : '')].join('');

			Util.pingback(url);

		/* 执行回调 */
		callbackFn && callbackFn();
	},

	/* 添加测试标题行 */
	addTitle: function(title, id) {
		$('.rate_test div').append('<p class="title" id="' + id +'">' + title + '</p>');
	}
}

$().ready(RateTest.init);