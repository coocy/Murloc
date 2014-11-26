/**
 * @preserve
 * Murloc JavaScript Library v@VERSION
 * https://github.com/coocy/Murloc
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 * Date: @DATE
 *
 */

/**
 * File: core.js
 */

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
	IsAndroid = (/Android|HTC/i.test(UA) || (IsTouch && /Linux/i.test(NA.platform + ''))), /* HTC Flyer平板的UA字符串中不包含Android关键词 */

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
	_rHTML = /<|&#?\w+;/,
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
	 * 去掉字符串头尾的空白字符
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
		var fn = this;
		return function() {
			return fn.apply(context || this, arguments);
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
 * @param {(Element|$|string|Function)=} selector
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

		//HTML片段
		if (_rHTML.test(selector)) {
			this.context = $.parseHTML(selector);

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

	if ($.isFunction(selector)) {
		$.ready(selector);
	} else

	if (selector.length) { //数组或者类数组
		this.context = _concat.apply([], selector);
		this.length = this.context.length;
	} else

	return this;
};

/**
 * 唯一ID，用作缓存对象的Key
 * @type {number}
 * @private
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
 * 判断一个对象是否是数组
 * @param {*} obj
 * @return {boolean}
 */
$.isArray = function(obj) {
	return obj instanceof Array;
};

/**
 * 判断一个对象是否是一个方法
 * @param {*} obj
 * @return {boolean}
 */
$.isFunction = function(obj) {
	return _toString.call(obj) === '[object Function]';
};

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
 * 简单判断一个对象是否是Object结构，比$.isPlainObject()速度快，但是兼容性不如$.isPlainObject()
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
	if ($.isObject(collection)) {
		for (var i in collection) {
			var element = collection[i];
			if (false === fn.call(element, i, element)) {
				break;
			}
		}
	} else {
		for (var i = 0, l = collection.length; i < l; i++) {
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
 * @return {Object} 扩展后的对象
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
 * @return {(Array|Object)} 复制后的数组或者对象
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
 * 去掉字符串头尾的空白字符。这个方法只是为了兼容jQuery，建议使用string的trim方法
 * @param {string} string
 * @return {string}
 */
$.trim = function(string) {
	return (string + '').trim();
};

/**
 * 将连字符字符串转化为驼峰形式
 * @param {string} string
 * @return {string} 驼峰形式的字符串
 */
$.camelCase = function(string){
	return string.replace(/-+(.)?/g, function(match, chr) {
		return chr ? chr.toUpperCase() : '';
	});
};

/**
 * 改变一个函数的this指针。这个方法只是为了兼容jQuery，建议使用function的bind方法
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

/**
 * File: sizzle.js
 */

/*!
 * Sizzle CSS Selector Engine v1.10.19
 * http://sizzlejs.com/
 *
 * Copyright 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 * Date: 2014-04-18
 */
(function( window ) {

if (!ENABLE_IE_SUPPORT) {
	return;
}

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + -(new Date()),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// General-purpose constants
	strundefined = typeof undefined,
	MAX_NEGATIVE = 1 << 31,

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf if we can't use a native one
	indexOf = arr.indexOf || function( elem ) {
		var i = 0,
			len = this.length;
		for ( ; i < len; i++ ) {
			if ( this[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + characterEncoding + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,
	rescape = /'|\\/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	};

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	context = context || document;
	results = results || [];

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	if ( (nodeType = context.nodeType) !== 1 && nodeType !== 9 ) {
		return [];
	}

	if ( documentIsHTML && !seed ) {

		// Shortcuts
		if ( (match = rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document (jQuery #6963)
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context is not a document
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
			} else if ( match[2] ) {
				push.apply( results, context.getElementsByTagName( selector ) );
				return results;

			// Speed-up: Sizzle(".CLASS")
			} else if ( (m = match[3]) && support.getElementsByClassName && context.getElementsByClassName ) {
				push.apply( results, context.getElementsByClassName( m ) );
				return results;
			}
		}

		// QSA path
		if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
			nid = old = expando;
			newContext = context;
			newSelector = nodeType === 9 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
				groups = tokenize( selector );

				if ( (old = context.getAttribute("id")) ) {
					nid = old.replace( rescape, "\\$&" );
				} else {
					context.setAttribute( "id", nid );
				}
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
					groups[i] = nid + toSelector( groups[i] );
				}
				newContext = rsibling.test( selector ) && testContext( context.parentNode ) || context;
				newSelector = groups.join(",");
			}

			if ( newSelector ) {
				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch(qsaError) {
				} finally {
					if ( !old ) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return !!fn( div );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( div.parentNode ) {
			div.parentNode.removeChild( div );
		}
		// release memory in IE
		div = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = attrs.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			( ~b.sourceIndex || MAX_NEGATIVE ) -
			( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== strundefined && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare,
		doc = node ? node.ownerDocument || node : preferredDoc,
		parent = doc.defaultView;

	// If no document and documentElement is available, return
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	document = doc;
	docElem = doc.documentElement;

	// Support tests
	documentIsHTML = !isXML( doc );

	// Support: IE>8
	// If iframe document is assigned to "document" variable and if iframe has been reloaded,
	// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
	// IE6-8 do not support the defaultView property so parent will be undefined
	if ( parent && parent !== parent.top ) {
		// IE11 does not have attachEvent, so all must suffer
		if ( parent.addEventListener ) {
			parent.addEventListener( "unload", function() {
				setDocument();
			}, false );
		} else if ( parent.attachEvent ) {
			parent.attachEvent( "onunload", function() {
				setDocument();
			});
		}
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties (excepting IE8 booleans)
	support.attributes = assert(function( div ) {
		div.className = "i";
		return !div.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( div ) {
		div.appendChild( doc.createComment("") );
		return !div.getElementsByTagName("*").length;
	});

	// Check if getElementsByClassName can be trusted
	support.getElementsByClassName = rnative.test( doc.getElementsByClassName ) && assert(function( div ) {
		div.innerHTML = "<div class='a'></div><div class='a i'></div>";

		// Support: Safari<4
		// Catch class over-caching
		div.firstChild.className = "i";
		// Support: Opera<10
		// Catch gEBCN failure to find non-leading classes
		return div.getElementsByClassName("i").length === 2;
	});

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( div ) {
		docElem.appendChild( div ).id = expando;
		return !doc.getElementsByName || !doc.getElementsByName( expando ).length;
	});

	// ID find and filter
	if ( support.getById ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== strundefined && documentIsHTML ) {
				var m = context.getElementById( id );
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [ m ] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		// Support: IE6/7
		// getElementById is not reliable as a find shortcut
		delete Expr.find["ID"];

		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== strundefined ) {
				return context.getElementsByTagName( tag );
			}
		} :
		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== strundefined && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See http://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( doc.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			div.innerHTML = "<select msallowclip=''><option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// http://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( div.querySelectorAll("[msallowclip^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}
		});

		assert(function( div ) {
			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = doc.createElement("input");
			input.setAttribute( "type", "hidden" );
			div.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( div.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			div.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( div, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully does not implement inclusive descendent
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === doc || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === doc || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === doc ? -1 :
				b === doc ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return doc;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch(e) {}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							cache = outerCache[ type ] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									// Cache the index of each encountered element
									if ( useCache ) {
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf.call( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						if ( (oldCache = outerCache[ dir ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							outerCache[ dir ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf.call( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context !== document && context;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is no seed and only one group
	if ( match.length === 1 ) {

		// Take a shortcut and set the context if the root selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				support.getById && context.nodeType === 9 && documentIsHTML &&
				Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome<14
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( div1 ) {
	// Should return 1, but returns 4 (following)
	return div1.compareDocumentPosition( document.createElement("div") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( div ) {
	div.innerHTML = "<a href='#'></a>";
	return div.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( div ) {
	div.innerHTML = "<input/>";
	div.firstChild.setAttribute( "value", "" );
	return div.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( div ) {
	return div.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

// EXPOSE
if ( typeof define === "function" && define.amd ) {
	define(function() { return Sizzle; });
// Sizzle requires that there be a global window in Common-JS like environments
} else if ( typeof module !== "undefined" && module.exports ) {
	module.exports = Sizzle;
} else {
	window['Sizzle'] = Sizzle;
}
// EXPOSE

})( window );

/**
 * File: json.js
 */

/**
 * JSON对象
 * 如果浏览器支持原生的JSON对象，会直接使用原生对象的方法，否则使用自定义实现的方法。
 * @class JSON
 * @static
 */

var JSON = WIN.JSON || {

	_specialChars: {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\'},

	_replaceChars: function(chr){
		return JSON._specialChars[chr] || '\\u00' + Math.floor(chr.charCodeAt() / 16).toString(16) + (chr.charCodeAt() % 16).toString(16);
	},

	/**
	 * 把一个标准JSON对象序列化成一个字符串，如果浏览器支持原生的JSON对象，会直接使用原生对象的方法，否则使用自定义实现的方法。
	 * @static
	 * @param {JSONType} obj JSON对象
	 * @return {string} 序列化成后的字符串
	 */
	stringify: function(obj) {
		if (obj instanceof Array) {
			type = 'array';
		} else {
			type = typeof obj;
		}
		switch (type){
			case 'string':
				return '"' + obj.replace(/[\x00-\x1f\\"]/g, JSON._replaceChars) + '"';
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
	 * 把一个JSON字符串转换为标准JSON对象，如果浏览器支持原生的JSON对象，会直接使用原生对象的方法，否则使用自定义实现的方法。
	 * @static
	 * @param {string} string JSON字符串
	 * @return {JSONType} 标准JSON对象
	 */
	parse: function(string){
		return eval('(' + string + ')');
	}
};

/**
 * JSON.parse()的别名
 * @static
 * @param {string} string JSON字符串
 * @return {JSONType} 标准JSON对象
 */
$.parseJSON = JSON.parse;

/**
 * File: util.js
 */

/**
 * 加载js
 * @param {String} url js文件路径
 * @param {Function} callback 加载完成后的回调
 * @param {Array} opts 传给回调的参数
 */

$.getScript = function(url, callback, opts) {
	var elHead = DOC.getElementsByTagName('head')[0] || DOC.body,
		elScript = DOC.createElement('script'),
		done = false;

	elScript.src = url;

	/**
	 * @this {Element}
	 */
	var fnOnload = function() {
		if (!done && (!this.readyState || this.readyState !== 'loading')) {
			done = true;
			if(callback) callback.apply(null, opts || []);
			elScript.onload = elScript.onreadystatechange = null;
			elHead.removeChild(elScript);
		}
	};

	elScript.onload = fnOnload;
	elScript.onreadystatechange = fnOnload;
	elHead.appendChild(elScript);
};

/**
 * 加载css
 * @param {String} url css文件路径
 */
$.getCSS = function(url) {
	var elHead = DOC.getElementsByTagName('head')[0] || DOC.body,
		elLink = DOC.createElement('link');

		elLink.href = url;
		elLink.rel = "stylesheet";
		elLink.type = "text/css";

	elHead.appendChild(elLink);
};

/**
 * File: localstorge.js
 */

/**
 * 对本地存贮对象的操作封装
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
 * File: notification.js
 */

/**
 * 通知对象，实现通知的注册和根据通知触发对应的函数，一个通知可以注册多个函数，在通知被触发的时候，所有被注册给这个通知的函数会被执行
 * 如果触发一个没有注册函数的通知名，则什么都不会执行
 * 注意：如果一个函数在注册给通知后发生了改变，那么在触发通知的时候执行的函数还是没有改变前的函数
 * 用例：
 * <code lang="javascript">
 * var funA = function(a, b) {...};
 * var funB = function(a, b) {...};
 * 
 * //可以在不同的地方给一个通知名分别注册多个函数
 * Notification.reg('a notice name', funA);
 * Notification.reg('a notice name', funB);
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
 * File: url.js
 */

/**
 * 包含URL相关的方法
 */

var URL = {

	/**
	 * 获取指定DOM对象的链接地址的queryString
	 * @param {Element} el 要获取参数的DOM对象
	 * @return {string}
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
	 * @param {Element} el 设置这个DOM对象的url
	 * @param {Object} data 要设置的GET参数，以键值对的方式提供
	 */
	setQueryString: function(el, data) {
		var el = $(el),
			elTag = el.get(0),
			elSearch = elTag.search,
			_searchString = elSearch || '',
			_key,
			_value,
			hrefString = '';

		/* 非<A>对象没有search属性 */
		if (!elSearch) {
			/** @type {string} */
			var nodeName = elTag.nodeName;
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

			hrefString += '';

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

		var URLParms = $.paramData(_searchString), /* 获取对象原有的GET参数 */
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
	}
};

/**
 * 把一个Object对象序列化成查询字符串形式
 * @param {Object} obj 需要序列化的Object
 * @return {string} 序列化的查询字符串
 */
$.param = function(obj) {
	var result = [], key, value, i;
	for (key in obj) {
		value = obj[key];
		if (value instanceof Array) {
			for (i = value.length; i--;) {
				result.push(key + '[]=' + encodeURIComponent(value[i]));
			}
		} else {
			result.push(key + '=' + encodeURIComponent(undefined === value ? '' : value));
		}
	}
	return result.join('&');
};

/**
 * 把查询字符串转换为Object对象
 * @param {string} queryString 查询字符串
 * @return {Object} Object对象
 */
$.paramData = function(queryString) {

	//去掉字符串前面的"?"，并把&amp;转换为&
	queryString = queryString.replace(/^\?+/, '').replace(/&amp;/, '&');
	var querys = queryString.split('&'),
		i = querys.length,
		parms = {},
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
			parms[decodeURIComponent(item[0])] =  value;
		}
	}
	return parms;
};

/**
 * 获取或者设置当前页面的查询字符串中指定的key的值
 * @param {string=} key
 * @param {string=} value
 * @return {string=} 指定的key的value；
 * 1. 如果不传入key和value，则返回完整的查询字符串；
 * 2. 如果只传了key，则返回查询字符串中对应的key的值
 * 3. 如果传了key和value，则设置查询字符串中对应的key值为value，无返回值
 */
$.query = function(key, value) {
	var queryString = WIN.location.search.substring(1),
		argLength = arguments.length;
	if (argLength < 1) {
		return queryString;
	} else {
		var paramData = $.paramData(queryString);
		if (argLength < 2) {
			return paramData[key];
		} else {
			paramData[key] = value;
		}
	}
};

$.getUrlParam = function(key, el) {
	return URL.getQueryString(key, el);
}

/**
 * File: cookie.js
 */

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
	 * @param {string} name 要设置的Cookie名称
	 * @param {string} value 要设置的Cookie值
	 * @param {number} expire 过期时间，单位是小时
	 * @param {string} domain 域，默认为本域
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
	 * @param {string} name 要获取的Cookie名称
	 * @return {?string} 对应的Cookie值，如果不存在，返回null
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
	 * @param {string} name 要删除的Cookie名称
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

/**
 * File: dom.js
 */


/**
 * 把DOM集合转换为数组，由elem.querySelector()得到的DOM集合为动态集合，有时候需要转化为常规数组
 * @param {(Array.<(Element)>|{length: number})} elements 数组或者类似数组的DOM集合
 * @return {Array} DOM数组
 */
$.toArray = function(elements) {
	var result;
	try {
		result = _slice.call(elements);
	} catch (e) {
		result = _concat.apply([], elements);
	}
	return result;
};

/**
 * 迭代一个{$}对象，对其中的每个子元素执行一个方法
 * @param {function(number=, Element=)} fn
 * @return {$}
 */
$.prototype.each = function(fn) {
	for (var i = 0, l = this.context.length, element; i < l; i++) {
		element = this.context[i];
		var result = fn.call(element, i, element);
		if (false === result) {
			break;
		}
	}
	return this;
};

/**
 * 在现有的DOM集合中加入新的集合并返回
 * @param {(Element|$|String)} selector
 * @return {$}
 */
$.prototype.add = function(selector) {
	this.context = _concat.apply($.toArray(this.context), $(selector).context);
	this.length = this.context.length;
	return this;
};

/**
 * 使用指定的开始和结束位置创建一个新的DOM集合
 * @param {number} start 指定开始的位置，如果为负值，则从尾部开始计算偏移
 * @param {number=} end 指定开始的位置，如果为负值，则从尾部开始计算偏移，如果不指定，则默认到末尾的位置
 * @return {$}
 */
$.prototype.slice = function(start, end) {

	var length = this.length,
		start = start + (start < 0 ? length : 0),
		end = undefined == end ? length : end,
		end = end + (end < 0 ? length : 0),
		result = new $();

	if (ENABLE_IE_SUPPORT) {
		this.context = $.toArray(this.context);
	}

	result.context = _slice.call(this.context, start, end);
	result.length = result.context.length;
	return result;
};

/**
 * 返回DOM集合中的第一个对象
 * @return {$}
 */
$.prototype.first = function() {
	return this.eq(0);
};

/**
 * 返回DOM集合中的最后一个对象
 * @return {$}
 */
$.prototype.last = function() {
	return this.eq(-1);
};

/**
 * 返回DOM集合中的最后一个对象
 * @param {number} index 从0开始的索引数字
 * @return {$}
 */
$.prototype.eq = function(index) {
	return $(this.get(index));
};
/*
$.prototype.index = function(){
    return this.parent().children().context.indexOf(this.get(0));
};
*/
/**
 * 返回一个或者多个$对象中的原生DOM对象
 * @param {number=} index 从0开始的索引数字
 * @return {(Element|Array.<Element>|{length: number})}
 */
$.prototype.get = function(index) {
	if (undefined === index) {
		return this.context;
	}
	var index = parseInt(index, 10),
		length = this.length,
		idx = index + (index < 0 ? length : 0);

	return idx < 0 ? undefined : this.context[idx];
};

/**
 * @type {Element}
 * @private
 */
var _tempParent;

/**
 * 检查一个DOM节点是否符合指定的选择符
 * @param {Element} element
 * @param {string} selector
 * @return {boolean}
 */
$.is = function(element, selector) {

	if (!selector || !element || (element === DOC)) return false;
	var matchesSelector = element.webkitMatchesSelector ||
		element.mozMatchesSelector ||
		element.oMatchesSelector ||
		element.matchesSelector;

	if (matchesSelector) {
		return matchesSelector.call(element, selector);

	} else if (ENABLE_IE_SUPPORT) {
		var elParent = element.parentNode,
			temp = !elParent || elParent.nodeType > 9,
			matches,
			match,
			el,
			i = 0;

		if (temp) {
			elParent =  _tempParent || (_tempParent = DOC.createElement('div'));
			elParent.appendChild(element);
		}

		matches = $._find(selector, elParent);

		while (el = matches[i++]) {
			if (el === element) {
				return true;
			}
		}

		if (temp) {
			elParent.removeChild(element);
		}

		return false;
	}
};

/**
 * 检查当前集合中的每个DOM节点是否符合指定的选择符，如果至少有一个符合，则返回true
 * @param {string} selector
 * @return {boolean}
 */
$.prototype.is = function(selector) {
	var result = false;
	if ('string' === typeof selector) {
		this.each(function(index, element) {
			if ($.is(element, selector)) {
				result = true;
				return false;
			}
		});
	}
	return result;
}
/**
 * 使用选择符过滤当前DOM集合，并返回一个新的集合
 * @param {string} selector
 * @return {$}
 */
$.prototype.filter = function(selector) {
	var result = new $(),
		elements = [];

	if (selector) {
		this.each(function(index, element) {
			if ($.is(element, selector)) {
				elements.push(element);
			}
		});
	}

	result.context = elements;
	result.length = elements.length;
	return result;
}

/**
 * 对当前DOM集合中的每个DOM对象沿DOM树向上查找，将第一个符合筛选的对象（含当前对象）放入返回的结果集中
 * @param {string=} selector
 * @param {Element=} context  原生DOM对象，如果传了这个参数，返回的结果会在这个对象范围内进行查找
 * @return {$}
 */
$.prototype.closest = function(selector, context) {
	var result = new $(),
		elements = [];

	context = context || DOC;

	this.each(function(index, element) {
		do {
			if (1 === element.nodeType &&
				(!selector || (selector && $.is(element, selector)))
			) {
				elements.push(element);
				break;
			}
		} while (
			(element = element.parentNode) &&
			(element !== context) &&
			(elements.indexOf(element) < 0)
		)
	});

	result.context = elements;
	result.length = elements.length;
	return result;
};

/**
 * 当前DOM集合中的每个DOM对象的直接父节点的集合
 * @param {string=} selector 选择符，如果传了此参数，将对结果集进行筛选
 * @return {$}
 */
$.prototype.parent = function(selector) {
	var result = new $(),
		elements = [];

	this.each(function(index, element) {
		var elParent = element.parentNode;
		if (
			(!selector || (selector && $.is(elParent, selector))) &&
			(elements.indexOf(elParent) < 0)
		) {
			elements.push(elParent);
		}
	});

	result.context = elements;
	result.length = elements.length;
	return result;
};

/**
 * 当前DOM集合中的每个DOM对象的所有父节点的集合
 * @param {string=} selector 选择符，如果传了此参数，将对结果集进行筛选
 * @return {$}
 */
$.prototype.parents = function(selector) {
	var result = new $(),
		elements = [];

	this.each(function(index, element) {
		while (
			(element = element.parentNode) &&
			(element !== DOC) &&
			(elements.indexOf(element) < 0)
		) {
			if (!selector || (selector && $.is(element, selector))) {
				elements.push(element);
			}
		}
	});

	result.context = elements;
	result.length = elements.length;
	return result;
};

/**
 * 当前DOM集合中的每个DOM对象的直接子节点的集合
 * @param {string=} selector 选择符，如果传了此参数，将对结果集进行筛选
 * @return {$}
 */
$.prototype.children = function(selector) {
	var result = new $(),
		elements = [];

	this.each(function(index, element) {

		var chilldren = element.children;

		//没有children属性的时候，用childNodes来筛选结果，（在FF中DocumentFragment没有children属性）
		if (!chilldren) {
			chilldren = [];
			for (var childNode = element.firstChild; childNode; childNode = childNode.nextSibling) {
				if (1 === childNode.nodeType) {
					chilldren.push(childNode);
				}
			}
		}

		elements = _concat.apply(elements, chilldren);
	});

	// 使用选择符筛选结果，
	// 如果在业务代码中调用.children()的时候都不传第二个参数，
	// 这块代码可以被压缩器优化掉
	if (undefined !== selector) {
		var _elements = [],
			element,
			i = 0;
		while (element = elements[i++]) {
			if ($.is(element, selector)) {
				_elements.push(element);
			}
		}
		elements = null;
		elements = _elements;
	}

	result.context = elements;
	result.length = elements.length;
	return result;
};

/**
 * 当前DOM集合中的每个DOM对象的直接子节点的集合，包含文本和注释节点
 * @return {$}
 */
$.prototype.contents = function() {
	var result = new $(),
		elements = [];
	this.each(function(index, element) {
		var contentDocument = element.contentDocument;
		if (contentDocument) {
			elements.push(contentDocument);
		} else {
			elements =  _concat.apply(elements, element.childNodes);
		}
	});

	result.context = elements;
	result.length = elements.length;
	return result;
};

/**
 * 使用选择符对当前DOM结果集进行筛选，返回一个新的DOM集合，如果selector为空的话返回结果为空
 * @param {string} selector 选择符
 * @return {$}
 */
$.prototype.find = function(selector) {
	return $(selector, this);
};

/**
 * @return {number}
 */
$.guid = function(element) {
	return element['__ruid'] || (element['__ruid'] = $.uid++);
};

/**
 * File: dom.nodes.js
 */

/**
 * 移除DOM对象
 * @return {$}
 */
$.prototype.remove = function() {
	var i = this.length;
	while (i--) {
		var element = this.context[i],
			elParent = element.parentNode;

		//移除绑定在该DOM上的data和事件
		var uid = element['__ruid'] || '0';
		if (uid) {
			delete($._dataCache[uid]);
			delete($._eventCache[uid]);
		}
		elParent && elParent.removeChild(element);
	}
	this.length = 0;
	return this;
};

var fragmentWrapMap, 
	fragmentContainter;

/**
 * 使用HTML创建片段并用数组形式返回其中的DOM对象
 * @param {string} html
 * @return {Array.<(Element)>}
 */
$.parseHTML = function(html) {
	var result = [];
	if (!ENABLE_IE_SUPPORT || _rHTML.test(html)) {
		var tempContainter;

		//在第一次调用的时候创建容器对象（按需创建）
		if (!fragmentContainter) {
			fragmentContainter = DOC.createElement('div');

			//在IE下创建特定类型的DOM对象的时候，需要在特定的父对象中创建
			if (ENABLE_IE_SUPPORT) {
				fragmentWrapMap = {
					'option': ['<select multiple>', '', 1],
					'optgroup': ['<select multiple>', '', 1],
					'tr': ['<table>', '</table>', 2],
					'td': ['<table><tr>', '</tr></table>', 3],
					'col': ['<table><colgroup>', '</colgroup></table>', 3],
					'*': ['']
				};

				fragmentWrapMap['tbody'] = fragmentWrapMap['tfoot'] = 
				fragmentWrapMap['colgroup'] = fragmentWrapMap['caption'] = 
				fragmentWrapMap['thead'] = fragmentWrapMap['tr'];

				fragmentWrapMap['th'] = fragmentWrapMap['td'];
				fragmentWrapMap['optgroup'] = fragmentWrapMap['optgroup'];
			}
		}

		html = html.replace(/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
				'<$1></$2>');

		tempContainter = fragmentContainter;

		if (ENABLE_IE_SUPPORT && IsIE) {
			var tagName = (/<([\w:]+)/.exec(html) || ['', ''])[1].toLowerCase(),
				wrap = '',
				deep = 0;

			if (tagName) {
				wrap = fragmentWrapMap[tagName] || fragmentWrapMap['*'];
				html = wrap[0] + html + (wrap[1] || '');
				deep =  wrap[2] || 0;
			}

			tempContainter.innerHTML = html;
			while (deep--) {
				tempContainter = tempContainter.lastChild;
			}

		} else {
			tempContainter.innerHTML = html;
		}

		result = $.toArray(tempContainter.childNodes); //把结果集转为常规数组，不然会有引用传递的问题
		tempContainter = null;

	} else {
		//在IE下，使用innerHTML设置纯文本内容会导致丢失空格，所以文本使用创建文本节点的方式
		result.push(DOC.createTextNode(html));
	}
	return result;
};

/**
 * 把传入的$对象或者数组递归合并成1个数组
 * @param {(Element|$|String|Number|Array.<(Element|$)>)} elements 单个DOM对象或者包含DOM集合的数组
 * @return {Array.<Element>}
 * @private
 */
$._getPlainArray = function(elements) {

	//原生DOM对象
	if (elements.nodeType) {
		return [elements];

	} else {

		var result = [];

		//$
		if (elements instanceof $) {
			result = _concat.apply(result, elements.context);

		//数组
		} else if (('string' !== typeof elements) && !isNaN(elements.length)) {

			for (var i = 0, l = elements.length; i < l; i++) {
				result = _concat.apply(result, $._getPlainArray(elements[i]));
			}

		} else {
			//按字符串处理，创建HTML片段或者纯文本节点
			result = _concat.apply(result, $.parseHTML(elements + ''));
		}

		return result;
	}
};


/**
 * 在父对象集合中插入DOM对象集合
 * @param {(Element|$|String|Number|Array.<(Element|$)>)} elements 单个DOM对象或者包含DOM集合的数组
 * @param {Array.<Element>} parents DOM集合
 * @param {String} targetPropName
 * @param {Number=} siblingType
 * @return {Array.<Element>}
 * @private
 */
$._insertNodeBefore = function(elements, parents, targetPropName, siblingType) {
	//原生DOM对象直接添加
	var method = targetPropName ? 'insertBefore' : 'appendChild',
		resultElements = [];

	var elements = $._getPlainArray(elements),
		parent,
		l = parents.length,
		i = 0,
		j, k,
		element;

	for (; i < l; i++) {
		parent = parents[i];

		if (undefined !== siblingType) {
			target = (0 === siblingType) ? parent : parent.nextSibling;
			parent = parent.parentNode;
			if (!parent) {
				continue;
			}
		} else {
			target = targetPropName ? parent[targetPropName] : undefined;
		}

		for (j = 0, k = elements.length; j < k; j++) {
			element = elements[j];

			element = (i < l - 1) ? $.clone(element, true) : element;

			parent[method](element, target);
			resultElements.push(element);
		}
	}

	return resultElements;
};

/**
 * 在指定的父对象中前置插入DOM对象
 * @param {...(Element|$|String|Number|Array.<(Element|$)>)} childElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.prepend = function(childElement) {
	$._insertNodeBefore(arguments, this.context, 'firstChild');
	return this;
};

/**
 * 把DOM对象前置插入到指定的父对象中
 * @param {(Element|$|String)} targetElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.prependTo = function(targetElement) {
	this.context = $._insertNodeBefore(this.context, $(targetElement).context, 'firstChild');
	this.length = this.context.length;
	return this;
};

/**
 * 在指定的父对象中插入一个DOM对象
 * @param {...(Element|$|String|Number|Array.<(Element|$)>)} childElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.append = function(childElement) {
	$._insertNodeBefore(arguments, this.context);
	return this;
};

/**
 * 把DOM对象插入到指定的父对象中
 * @param {(Element|$|String)} targetElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.appendTo = function(targetElement) {
	this.context = $._insertNodeBefore(this.context, $(targetElement).context);
	this.length = this.context.length;
	return this;
};

/**
 * 在指定的对象前插入DOM对象
 * @param {...(Element|$|String|Number|Array.<(Element|$)>)} targetElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.before = function(targetElement) {
	$._insertNodeBefore(arguments, this.context, 1, 0);
	return this;
};

/**
 * 把DOM对象插入到指定的对象前面
 * @param {(Element|$|String)} targetElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.insertBefore = function(targetElement) {
	this.context = $._insertNodeBefore(this.context, $(targetElement).context, 1, 0);
	this.length = this.context.length;
	return this;
};

/**
 * 在指定的对象后面插入DOM对象
 * @param {...(Element|$|String|Number|Array.<(Element|$)>)} targetElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.after = function(targetElement) {
	$._insertNodeBefore(arguments, this.context, 1, 1);
	return this;
};

/**
 * 把DOM对象插入到指定的对象后面
 * @param {(Element|$|String)} targetElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.insertAfter = function(targetElement) {
	this.context = $._insertNodeBefore(this.context, $(targetElement).context, 1, 1);
	this.length = this.context.length;
	return this;
};

$.prototype.wrap = function() {
	return this;
};

/**
 * 复制一个DOM对象，返回复制后的新集合
 * @param {Element} element 要复制的DOM对象
 * @param {boolean=} cloneDataAndEvents 是否复制data和事件
 * @return {Element} 复制的DOM对象
 */
$.clone = function(element, cloneDataAndEvents) {
	var newElement = element.cloneNode(true);

	if (cloneDataAndEvents) {
		var uid = element['__ruid'] || '0',
			data = $._dataCache[uid],
			eventData = $._eventCache[uid],
			eventName,
			elemData,
			newUid;

		if (eventData || data) {
			newUid = $.guid(newElement); //newUid需要读写DOM，所以在需要复制事件和data的时候才生成newUid

			//复制事件
			if (eventData) {
				$._eventCache[newUid] = $.copy(eventData);
			}

			//复制data
			if (data) {
				$._dataCache[newUid] = $.copy(data);
			}
		}
	}

	return newElement;
};

/**
 * 复制一个DOM集合，返回复制后的新集合
 * @param {boolean=} cloneDataAndEvents 是否复制data和事件。出于性能和使用的可能性考虑，此方法不复制子对象的data和事件（如果需要用到的话可以自行实现）
 * @return {$}
 */
$.prototype.clone = function(cloneDataAndEvents) {
	var result = new $(),
		elements = [];

	this.each(function(index, element) {
		elements.push($.clone(element, cloneDataAndEvents));
	});

	result.context = elements;
	result.length = elements.length;
	return result;
};




/**
 * File: dom.data.js
 */


/**
 * $._dataCache = {
 *	'uid_1': {...},
 * 	'uid_2': {...},
 * 	...
 * };
 * @private
 */
$._dataCache = {};

/**
 * 给DOM对象添加数据
 * @param {(string|Object)=} key
 * @param {*=} value
 * @return {*}
 */
$.prototype.data = function(key, value) {

	// $(selector).data(string) || $(selector).data() || $(selector).data(undefined) || $().data()
	if (arguments.length < 2) {
		if (('string' === typeof key) || (undefined === key)) {
			var element = this.context[0] || {},
				uid = element['__ruid'] || '0',
				data = $._dataCache[uid];

			return key ? (data && data[key]) : data;
		}
	}

	// $(selector).data(obj[, undefined])
	if ('string' === typeof key) {
		var _key = {};
		        _key[key + ''] = value;

		key = _key;
	}

	return this.each(function(index, element) {
		var uid = $.guid(element),
			elementData = $._dataCache[uid] || ($._dataCache[uid] = {});

		for (var _key in key) {
			elementData[_key] = key[_key];
		}
	});
};

/**
 * 移除DOM对象上的数据
 * @param {?string=} key
 * @return {$}
 */
$.prototype.removeData = function(key) {
	return this.each(function(index, element) {
		var uid = element['__ruid'] || '0';

		if (uid in $._dataCache) {
			var data = $._dataCache[uid];
			if (undefined !== key) {
				delete data[key];
			} else {
				delete data;
			}
		}
	});
};

/**
 * File: dom.ready.js
 */


/**
 * @param {Function} fn
 * @return {$}
 */
$.ready = function(fn) {

	//如果页面已经加载完成，直接执行方法
	if (true === $.loader.isLoaded) {
		fn();
	} else {
		$.loader.callbacks.push(fn);
		$.loader.init();
	}

	return this;
};

/**
 * @param {Function} fn
 * @return {$}
 */
$.prototype.ready = $.ready;

$.loader = {

	callbacks: [],

	/**
	 * @type {boolean}  是否已经初始化
	 */
	isInited: false,

	/**
	 * @type {boolean}  是否已经加载完成
	 */
	isLoaded: false,

	timer: null,

	ieTimer: function() {
		if (IsIE && 'interactive' == DOC.readyState) {
			if ($.loader.timer) {
				clearTimeout($.loader.timer);
			}
			$.loader.timer = setTimeout($.loader.ieTimer, 10);
		} else {
			$.loader.init();
			$.loader.isInited = true;
		}
	},

	/**
	 * 初始化函数
	 * 因为页面中引用的Javascript文件是异步加载的，因此加载完Javascript文件后需要判断HTML页面是否加载完全:
	 * 1. 如果document.readyState的值不为"loading", 则马上执行初始化函数
	 * 2. 如果document.readyState的值为"loading", 则把初始化函数放入DOMContentLoaded中执行
	 * @private
	 */
	init: function() {

		if (false === $.loader.isInited) {

			var readyState = DOC.readyState;

			//页面载入完成后的对$().ready()的调用直接执行
			if ('loading|uninitialized'.indexOf(readyState) < 0) {

				/* 在JS异步模式下，
				 * IE浏览器在document.readyState等于interactive的时候文档尚未解析完成（其它浏览器没有问题），
				 * 加个定时器检查document.readyState
				 */
				if (IsIE && ('interactive' == readyState)) {
					$.loader.ieTimer();
					return;
				} else {
					$.loader.loaded();
				}
			} else {
				/* 在第一次调用$.ready()的时候才进行初始化 */
				$.loader.isInited = true;
				if (DOC.addEventListener) {
					DOC.addEventListener('DOMContentLoaded', $.loader.loaded);
				} else {
					//IE
					var id = '_ir_';

					/** @type {Element} */
					var script = DOC.getElementById(id);
					if (!script) {
						DOC.write('<script id="' + id + '" defer="true" src="://"></script>');
						script = DOC.getElementById(id);
					}

					/**
					 * @this {Element}
					 */
					var fnOnload = function() {
						if (this.readyState == 'complete') {
							$.loader.loaded();
						}
					};
					script.onreadystatechange = script.onload = fnOnload;
				}
			}
		}
	},

	/**
	 * 加载完成
	 * @private
	 */
	loaded: function() {
		if (false === $.loader.isLoaded) {
			$.loader.isLoaded = true;
			$.loader.fire();
		}
	},

	/**
	 * 触发初始化函数
	 * @private
	 */
	fire: function() {

		/* 遍历执行初始化函数数组 */
		for (var callbacks = $.loader.callbacks, i = 0, l = callbacks.length; i < l; i++) {
			if (ENABLE_DEBUG) {
				callbacks[i]();
			} else {
				try {
					callbacks[i]();
				} catch(e) {}
			}
		}
		$.loader.callbacks = [];
	}

};
/**
 * File: dom.styles.js
 */


var cssCorrection = {
	'float': null
};

var correctCssKey = function(key, element) {
	var _key = key;
	if (_key in cssCorrection) {
		_key = cssCorrection[_key];
		if (null === _key) {
			if ('float' === key) {
				_key = ('cssFloat' in element.style) ? 'cssFloat' : 'styleFloat'
			}
			cssCorrection[key] = _key;
		}
	}
	return _key;
};

/**
 * 设置DOM对象集合的css或者读取集合中第一个DOM对象的css
 * @param {(string|Object)} key
 * @param {string=} value
 * @return {$}
 */
$.prototype.css =  function(key, value) {

	//读取css
	if (('string' === typeof key) && (arguments.length < 2)) {
		var element = this.context[0],
			key = $.camelCase(key),
			result;

		if (element) {

			key = correctCssKey(key, element);

			result = (element.currentStyle || WIN.getComputedStyle(element, ''))[key];
			if ('' === result) {
				result = element.style[key];
			}

			if (undefined !== result) {
				result += '';
			}

			//IE浏览器下如果css中的font-size单位不是象素的话，需要转换一下
			if (/^-?(\d*\.)?\d+[^\d\.]+/.test(result) && !/px$/i.test(result)) {
				var left = element.style.left;
				element.style.left = ('fontSize' === key)  ? '1em' : (result || 0);
				result = element.style.pixelLeft + 'px';
				element.style.left = left;
			}
		}

		return result;
	}

	//设置css
	return this.each(function(index, element) {
		if ('string' === typeof key) {
			var _key = {};
			_key[key] = value;
			key = _key;
		}
		for (var k in key) {
			var _value =  key[k];
			k = $.camelCase(k);
			k = correctCssKey(k, element);
			if (_value !== '' && !isNaN(_value) && 'opacity|zIndex|lineHeight|zoom|fontWeight'.indexOf(k) < 0 && k.indexOf('Duration') < 0) {
				_value += 'px';
			}

			//IE下，设置不支持的css属性会出错
			try {
				element.style[k] = _value;
			} catch (e) {}
		}
	});
};

/**
 * 返回DOM对象相对于文档左上角的偏移
 * @return {{left:number, top:number}}
 */
$.prototype.offset =  function() {
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

$.prototype.hide = function() {
	return this.css('display', 'none');
};
$.prototype.show = function() {
	return this.css('display', '');
};

$._bound = function(element) {
	if (element && element.getBoundingClientRect) {
		return element.getBoundingClientRect();
	}
	return {};
};

$._size = function(element, name, type) {
	var result = null,
		documentElement;

	if (element) {
		if ($.isWindow(element)) {
			return DOC.documentElement['client' + name];
		} else {
			element = element.documentElement || element;
			return element['offset' + name];
		}
	}

	return result;
};

$.prototype.width = function(type) {
	return $._size(this.context[0], 'Width', 'width');
};

$.prototype.height = function(type) {
	return $._size(this.context[0], 'Height', 'height');
};


/**
 * File: dom.attributes.js
 */

/**
 * 获取DOM对象集合中第一个对象的innerHTML或者设置DOM对象集合的innerHTML
 * @param {(string|number)=} html
 * @return {($|string)=}
 */
$.prototype.html =  function(html) {

	if (arguments.length > 0) {
		if (undefined === html) {
			return this;
		}

		/* 把html转换为字符串 */
		html += '';

		if (ENABLE_IE_SUPPORT && IsIE) {

			//IE下使用创建HTML片段的方式设置html（为了修正<option>和表格子对象的问题）
			var children = $.parseHTML(html),
				childrenLength = children.length,
				child,
				elemLength = this.context.length;
			
			return this.each(function(index, element) {
				if (element && (1 === element.nodeType)) {
					element.innerHTML = '';
					for (var i = 0; i < childrenLength; i++) {
						child = children[i];
						child = (index < elemLength - 1) ? child.cloneNode(true) : child;
						element.appendChild(child);
					}
				}
			});
		} else {

			return this.each(function(index, element) {
				if (element && (1 === element.nodeType)) {
					element.innerHTML = html;
				}
			});
		}

	} else {
		var element = this.context[0];
		return element && element.innerHTML;
	}
};

/**
 * 移除DOM对象集合中对象的子对象
 * @return {$}
 */
$.prototype.empty =  function() {
	return this.html('');
};

/**  @type {string} */
var _kTextContentProp;

$.prototype.text = function(text) {
	if (!_kTextContentProp) { //只在第一次调用的时候检查浏览器支持的innerText属性
		_kTextContentProp = 'textContent' in DOC ? 'textContent' : 'innerText';
	}
	if (arguments.length > 0) {
		if (undefined === text) {
			return this;
		}
		return this.each(function(index, element) {
			try {
				element[_kTextContentProp] = text;
			} catch(e) {}
		});
	} else {
		var element = this.context[0];
		if (ENABLE_IE_SUPPORT) {
			if ('innerText' == _kTextContentProp) {
				return element && Sizzle.getText(element);
			}
		} 
		return element && element[_kTextContentProp];
	}
};

/**
 * 设置DOM对象集合的value或者读取集合中第一个DOM对象的value
 * @param {(string|number)=} value
 * @return {($|string)=}
 */
$.prototype.val =  function(value) {
	if (arguments.length > 0) {
		if (!value && 0 !== value) {
			value = '';
		}
		return this.each(function(index, element) {
			element.value = value;
		});
	} else {
		var element = this.context[0];
		return element && element.value;
	}
};

$.prototype.prop =  function(name, value) {
	if (arguments.length > 1) {
		return this.each(function(index, element) {
			element[name] = value;
		});
	} else {
		var element = this.context[0];
		return element && element[name];
	}
};

/**
 * @param {(string|Object)} name
 * @param {(string|number)=} value
 * @return {($|string)=}
 */
$.prototype.attr =  function(name, value) {
	if (arguments.length > 1) {
		return this.each(function(index, element) {
			element.setAttribute(name, value);
		});
	} else {
		if ('object' === typeof name) {
			for (var key in name) {
				this.attr(key, name[key]);
			}
			return this;
		}
		var element = this.context[0],
			attrNode = element && element.getAttributeNode(name),
			result = attrNode && attrNode.nodeValue;

		/*if (ENABLE_IE_SUPPORT) {
			if (null === result) {
				var nameFix = {
					'for': 'htmlFor',
					'class': 'className'
				};
				//name = nameFix[name] || name;
				result = element.getAttributeNode && element.getAttributeNode(name).nodeValue;
				//result = element && element.getAttribute && element.getAttribute(name);
			}
		}*/

		return (null === result) ? undefined : result;
	}
};

/**
 * @param {string} name
 * @return {$}
 */
$.prototype.removeAttr =  function(name) {
	return this.each(function(index, element) {
		element.removeAttribute && element.removeAttribute(name);
	});
};

/**
 * File: dom.class_name.js
 */


/**
 * 判断对象是否拥有指定的className
 * @param {string} value
 * @return {boolean}
 */
$.prototype.hasClass =  function(value) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;
	for (var i = 0, j, l = this.length; i < l; i++) {
		for  (j = 0; j < len; j++) {
			if ((' ' + this.context[i].className.replace(/\s+/g, ' ') + ' ').indexOf(' ' + classes[j] + ' ') > -1) {
				return true;
			}
		}
	};
	return false;
};

/**
 * 给对象添加一个className
 * @param {string} value 要添加的className
 * @return {$}
 */
$.prototype.addClass =  function(value) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;
	return this.each(function(index, element) {
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

/**
 * 移除对象的className
 * @param {string=} value 要移除的className，如果value为空，移除对象的全部className
 * @return {$}
 */
$.prototype.removeClass =  function(value) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length,
		removeAllClasses = arguments.length < 1;

	//由elem.querySelector()得到的DOM集合为动态集合，在这里需要转化为常规数组，
	//防止$('.abc').removeClass('abc')这种形式的调用得到不正确的结果
	this.context = $.toArray(this.context);

	return this.each(function(index, element) {
		//如果value为空，移除对象的全部className
		if (removeAllClasses) {
			element.className = '';
			return;
		}
		var className = ' ' + element.className.replace(/\s+/g, ' ') + ' ',
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

/**
 * 移除对象的className
 * @param {string=} value 要移除的className，如果value为空，移除对象的全部className
 * @param {boolean=} 如果为TRUE，则执行addClass操作，如果为FALSE，执行removeClass
 * @return {$}
 */
$.prototype.toggleClass =  function(value, condition) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;

	//由elem.querySelector()得到的DOM集合为动态集合，在这里需要转化为常规数组，
	//防止$('.abc').toggleClass('abc')这种形式的调用得到不正确的结果
	this.context = $.toArray(this.context);

	return this.each(function(index, element) {
		var className = ' ' + element.className.replace(/\s+/g, ' ') + ' ',
			curClass,
			needAdd,
			forceAdd,
			i;
		for  (i = 0; i < len; i++) {
			curClass = classes[i];

			needAdd = className.indexOf(' ' + curClass + ' ') < 0;
			forceAdd = (undefined === condition) ? needAdd : condition;

			if (forceAdd) {
				if (needAdd) {
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
 * File: dom.form.js
 */


/**
 * 序列化一个表单对象
 * @param {boolean} returnObject 是否返回object对象，如果不传，返回一个queryString形式的字符串
 * @return {(string|Object)} 返回一个queryString形式的字符串或者object对象
 */
$.prototype.serialize = function(returnObject) {

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

	this.each(function(index, element) {
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
 * eg. <input type="text" name="username" required="请填写此项" length="5,20" />
 *      <input type="password" name="password" format="password" required length="5,20" />
 * @return {boolean} 表单是否通过验证，如果有多个表单，只要有一个表单验证失败即返回false
 */
$.prototype.check = function() {
	var result = true;

	this.each(function(index, element) {

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
$.prototype.showFormTip = function(message, className) {
	return this.each(function(index, element) {
		var msgEl = $('.form_tip', element);
		if (msgEl.length < 1) {
			msgEl = $('<div class="form_tip"></p>').prependTo(element);
		}
		msgEl.attr('class', 'form_tip ' + className).html(message);
	});
}

/**
 * File: event.js
 */

/**
 * Event
 */

 /*
$._eventCache = {
	'uid_1': {
		'event_1': [
			fn1: 1,
			fn2: 1,
			...
		],
		'event_2': [
			fn1: 1,
			fn2: 1,
			...
		],
		...
	},
	'uid_2': {
		'event_1': [
			fn1: 1,
			fn2: 1,
			...
		],
		'event_2': [
			fn1: 1,
			fn2: 1,
			...
		],
		...
	},
	...,
	'tA': {
		'event_1': [
			fn1: 1,
			fn2: 1,
			...
		],
		'event_2': [
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
var UseTouchClick = IsTouch;

if (UseTouchClick &&!IsAndroid /* Android下使用模拟点击会导致不稳定（比如跨页面点击、视频退出全屏后跨页面后退） */ &&
	UA.indexOf('PlayStation') < 0 /* PlayStation手持设备使用模拟点击会造成在滑动页面的时候触发点击 */
) {
	UseTouchClick = true;
}

/**
 * @constructor
 * @param {(Event|$.event)} e
 * @return {$.event}
 */
$.event = function(e) {
	if (e instanceof $.event) {
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

$.event.prototype = {

	/*
	 * @type {?Event}
	 */
	event: null,

	/*
	 * @type {?Event}
	 */
	originalEvent: null,

	/*
	 * @type {?Element}
	 */
	target: null,

	/*
	 * @type {?string}
	 */
	type: null,

	/*
	 * @type {boolean}
	 */
	isPropagationStopped: false,

	/*
	 * @type {boolean}
	 */
	isDefaultPrevented: false,

	/*
	 * @type {?Element}
	 */
	currentTarget: null,

	/*
	 * @type {function}
	 */
	preventDefault: function() {
		var e = this.event;

		this.isDefaultPrevented = true;

		if (e.preventDefault) {
			e.preventDefault();
		} else {
			/* IE下阻止默认事件 */
			e.returnValue = false;
		}
	},

	/*
	 * @type {function}
	 */
	stopPropagation: function() {
		var e = this.event;

		this.isPropagationStopped = true;

		if (e.stopPropagation) {
			e.stopPropagation();
		}
	}
};

/**
 * @private
 */
$._eventCache = {};

/**
 * @private
 */
$._eventType = {

	/**
	 * @const
	 * @type {string}
	 */
	delegated: '|click|mouseover|mouseout|mousemove|' +
			'focus|blur|focusin|focusout|' +
			'touchstart|touchmove|touchend|touchcancel|' +
			'webkitanimationstart|webkittransitionstart|' +
			'webkitanimationend|webkittransitionend' +
	 		(('onsubmit' in DOC) ? '|submit' : ''),


	/**
	 * IE使用focusin/focusout替换focus/blur来实现focus和blur的冒泡
	  * @type {Object=}
	 */
	bubblesFix: null,

	/**
	  * @type {Object}
	 */
	bubblesFixTemplate: {
		'focus': 'focusin',
		'blur': 'focusout'
	},

	/**
	 * @const
	 * @type {string}
	 */
	captured: '|focus|blur|'
};

/**
 * 给DOM对象绑定事件
 * @param {string} type
 * @param {Element} element
 * @param {function(Event=)} fn
 * @param {boolean} capture
 */
$.addEvent = DOC.addEventListener ? function(type, element, fn, capture) {
	element.addEventListener(type, fn, capture);
} : function(type, element, fn, capture) {
	element.attachEvent('on' + type, function() {
		fn.apply(element, arguments);
	});
};

/**
 * 生成特定DOM对象的eventCache
 * @param {string} type
 * @param {Number} uid
 * @param {Element} element
 * @param {function($.event=)} fn
 */
$._addEventData = function(type, uid, element, fn) {
	var elemData = $._eventCache[uid] || ($._eventCache[uid] = {}),
		shouldAddEvent = false;

	if (ENABLE_IE_SUPPORT) {
		//IE使用focusin/focusout替换focus/blur来实现focus和blur的冒泡
		if (null === $._eventType.bubblesFix) {
			if ('onfocusin' in DOC) {
				$._eventType.bubblesFix = $._eventType.bubblesFixTemplate;
			} else {
				$._eventType.bubblesFix = {};
			}
		}
		type = $._eventType.bubblesFix[type] || type;
	}

	/*
	 * 在第一次给某个DOM对象添加事件的时候绑定$.dispatchEvent()方法，
	 * 后续添加的方法推入elemData数组在$.dispatchEvent()中调用
	 */
	if (!(type in elemData)) {

		shouldAddEvent = true;

		/* 把需要委托的事件绑定在document上面 */
		if ((-1 < $._eventType.delegated.indexOf(type.toLowerCase())) && (element != DOC) && !$.isWindow(element)) {
			element = DOC;
			uid = $.guid(element);
			var docData = $._eventCache[uid] || ($._eventCache[uid] = {});

			if (type in docData) {
				shouldAddEvent = false;
			} else {
				docData[type] = [];
			}
		}
	}

	if (shouldAddEvent) {
		var capture =  (-1 < $._eventType.captured.indexOf(type));
		$.addEvent(type, element, $.dispatchEvent, capture);
	}

	var elemEventData = elemData[type] || (elemData[type] = []);
	elemEventData.push(fn);
};

$.addTagEvent = function(type, tagName, fn) {
	var uid = 't' + tagName.toUpperCase();
	$._addEventData(type, uid, DOC, fn);
};

/**
 * @param {Event} evt
 * @this {Element}
 */
$.dispatchEvent = function(evt) {
	var element = this,

		/** @type {$.event} */
		e = new $.event(evt),
		type = e.type,
		elCur = $.isWindow(element) ? element : e.target;

	/*
	 * 在触屏浏览器中，只执行在touchend中合成的click事件
	 * 在触屏浏览（合成的时候给event对象添加了自定义的isSimulated属性）
	 */
	if ('click' === type && UseTouchClick && !e.originalEvent.isSimulated &&
			!('INPUT' == elCur.nodeName && 'file' == elCur.type) &&
			'external' != elCur.getAttribute('rel')
		) {
		e.preventDefault();
		return;
	}

	while(elCur) {
		var uid = elCur['__ruid'] || '0',
			elemData = $._eventCache[uid] || {},
			elemEventData = elemData[type] || [],
			result = true,
			tagData= $._eventCache['t' + elCur.nodeName] || {},
			tagEventData = tagData[type];

		if (tagEventData) {
			elemEventData = elemEventData.concat(tagEventData);
		}

		for (var i = 0, l = elemEventData.length; i < l; i++) {

			/* 把冒泡过程中当前的DOM对象保存在Event的currentTarget属性中 */
			e.currentTarget = elCur;

			/*
			 * 执行事件方法
			 * 在方法中的this指针默认指向冒泡过程中当前的DOM对象（和currentTarget属性一样）
			 * 可以使用Function的bind方法改变this指针指向的对象
			 */
			var re = elemEventData[i].apply(elCur, [e]);

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

/**
 * 给DOM集合绑定事件
 * @function
 * @param {string} type 事件类型
 * @param {function($.event=)} fn 绑定的事件
 * @return {$}
 */
$.prototype.on = function(type, fn) {
	if ('object' === typeof type) {
		for (var key in type) {
			this.on(key, type[key]);
		}
		return this;
	}

	return this.each(function(index, element) {
		var uid = $.guid(element);
		$._addEventData(type, uid, element, fn);
	});
};

/**
 * 触发DOM集合的制定事件
 * @function
 * @param {String} type 事件类型
 * @param {*=} data 传给Event对象的自定义数据，可以在事件传播过程中传递
 * @return {$}
 */
$.prototype.trigger = DOC.createEventObject && ENABLE_IE_SUPPORT ?
	function(type, data) {
		/*var theEvent = DOC.createEventObject();
		theEvent.data = data;
		theEvent.isSimulated = true;*/

		return this.each(function(index, element) {
			if (type in element) {
				element[type]();
			} else {
				//自定义方法
				//...
			}
		});
	} :

	function(type, data) {

		/** @type {Event} */
		var theEvent = DOC.createEvent('MouseEvents');
		theEvent.initEvent(type, true, true);
		//theEvent.data = data;
		theEvent.isSimulated = true;

		return this.each(function(index, element) {
			if (type in element) {
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
$.touchEvent = {

	/**
	 * @const
	 * @type {string}
	 */
	activeCls: 'active',

	/**
	 * @type {boolean}
	 */
	hasTouchStart: false,

	/**
	 * 在触屏设备上取消DOM的高亮状态之前保留一个延时，使用户可以觉察到状态的改变，
	 * 在桌面浏览器中端不需要这个延时
	 */
	clearHighlightTimeout: IsTouch ? 200 : 0,

	/**
	 * @const
	 * @type {string}
	 */
	initedId: '__RR_EVENT_INITED__',

	init: function() {
		if (!WIN[$.touchEvent.initedId]) {
			var events = {
				onTouchStart: START_EVENT,
				onTouchMove: MOVE_EVENT,
				onTouchEnd: END_EVENT
			},
			type;

			for (type in events) {
				$.addEvent(events[type], DOC, $.touchEvent[type], false);
			}
			$.addEvent('touchcancel', DOC, $.touchEvent.onTouchCancel, false);

			if (UseTouchClick) {
				$.addEvent('click', DOC, $.dispatchEvent, false);
			}
			WIN[$.touchEvent.initedId] = true;
		}
	},

	onTouchStart: function(e) {
		var e = new $.event(e),
			event = e.originalEvent,
			elCur = e.target;

		$.touchEvent.clearHighlight();

		$.touchEvent.hasTouchStart = true;

		/* 保留一个target引用，在touchend中分配点击事件给这个target */
		$.touchEvent.elTarget = elCur;

		/* 事件触发点相对于窗口的坐标 */
		$.touchEvent.startPoint = [event.screenX * ScreenSizeCorrect, event.screenY * ScreenSizeCorrect];

		$.touchEvent.targets = [];
		while(elCur) {
			var uid = $.guid(elCur),
				elemData = $._eventCache[uid] || {},
				elemEventData = elemData['click'];

			/* 为绑定了事件或者特定DOM对象添加高亮样式 */
			if (elemEventData || ['A', 'INPUT', 'BUTTON'].indexOf(elCur.nodeName) > -1) {
				$.touchEvent.targets.push($(elCur).addClass($.touchEvent.activeCls));
			}
			elCur = elCur.parentNode;
		}
	},

	onTouchMove: function(e) {
		var touch = $.touchEvent;

		if (touch.hasTouchStart) {
			var e = new $.event(e),
				event = e.originalEvent,
				movedDistance = Math.pow(Math.pow(event.screenX * ScreenSizeCorrect - touch.startPoint[0], 2)
				                         + Math.pow(event.screenY * ScreenSizeCorrect - touch.startPoint[1], 2), .5);

			if (movedDistance > MAX_TOUCHMOVE_DISTANCE_FOR_CLICK) {
				touch.onTouchCancel();
			}
		}
	},

	onTouchEnd: function() {
		if ($.touchEvent.hasTouchStart) {

			var target = $.touchEvent.elTarget;

			/* 先做清除工作，再触发合成事件 */
			$.touchEvent.onTouchCancel();

			if (UseTouchClick) {

				if ('external' == target.getAttribute('rel') || ('INPUT' == target.nodeName && 'file' == target.type)) {
					return;
				}

				var theEvent = DOC.createEvent('MouseEvents');

				/* 初始化冒泡的事件 */
				theEvent.initEvent('click', true, true);

				/* 标记事件为合成的模拟事件，在$.dispatchEvent()方法中会检测这个属性来判断是否需要触发click事件 */
				theEvent.isSimulated = true;

				/* 给目标DOM对象触发合成事件
				 * （目标DOM对象是touchstart事件的target对象，touchstart和touchend的target可能不一样，所以在touchstart里面保留了一个引用）
				 */
				target.dispatchEvent(theEvent);
			}
		}
	},

	onTouchCancel: function() {
		$.touchEvent.hasTouchStart = false;
		$.touchEvent.elTarget = null;

		/* 取消DOM的高亮状态之前保留一个延时，使用户可以觉察到状态的改变 */
		setTimeout($.touchEvent.clearHighlight, $.touchEvent.clearHighlightTimeout);
	},

	clearHighlight: function() {
		var targets = $.touchEvent.targets,
			activeCls = $.touchEvent.activeCls;
		if (targets) {
			/* 移除高亮样式 */
			for (var i = 0, l = targets.length; i < l; i++) {
				targets[i].removeClass(activeCls);
			}
			$.touchEvent.targets = null;
		}
	}
}

$.touchEvent.init();

/**
 * 给DOM集合绑定点击事件或者触发点击事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.click = function(fn) {
	return arguments.length > 0 ? this.on('click', fn) : this.trigger('click');
};

/**
 * 给DOM集合绑定mousedown事件或者触发mousedown事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.mousedown = function(fn) {
	return arguments.length > 0 ? this.on('mousedown', fn) : this.trigger('mousedown');
};

/**
 * 给DOM集合绑定mouseup事件或者触发mouseup事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.mouseup = function(fn) {
	return arguments.length > 0 ? this.on('mouseup', fn) : this.trigger('mouseup');
};

/**
 * 给DOM集合绑定mousemove事件或者触发mousemove事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.mousemove = function(fn) {
	return arguments.length > 0 ? this.on('mousemove', fn) : this.trigger('mousemove');
};

/**
 * 给DOM集合绑定mouseover事件或者触发mouseover事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.mouseover = function(fn) {
	return arguments.length > 0 ? this.on('mouseover', fn) : this.trigger('mouseover');
};

/**
 * 给DOM集合绑定mouseout事件或者触发mouseout事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.mouseout = function(fn) {
	return arguments.length > 0 ? this.on('mouseout', fn) : this.trigger('mouseout');
};

/**
 * 给DOM集合绑定失焦事件或者触发失焦事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.blur = function(fn) {
	return arguments.length > 0 ? this.on('blur', fn) : this.trigger('blur');
};

/**
 * 给DOM集合绑定聚焦事件或者触发聚焦事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.focus = function(fn) {
	return arguments.length > 0 ? this.on('focus', fn) : this.trigger('focus');
};

/**
 * 给DOM集合绑定unload事件或者触发unload事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.unload = function(fn) {
	return arguments.length > 0 ? this.on('unload', fn) : this.trigger('unload');
};

/**
 * 给DOM集合绑定change事件或者触发change事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.change = function(fn) {
	return arguments.length > 0 ? this.on('change', fn) : this.trigger('change');
};

/**
 * 给DOM集合绑定select事件或者触发select事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.select = function(fn) {
	var name = 'select';
	return arguments.length > 0 ? this.on(name, fn) : this.trigger(name);
};

/**
 * 给DOM集合绑定submit事件或者触发submit事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.submit = function(fn) {
	return arguments.length > 0 ? this.on('submit', fn) : this.trigger('submit');
};

/**
 * 给DOM集合绑定keydown事件或者触发keydown事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.keydown = function(fn) {
	return arguments.length > 0 ? this.on('keydown', fn) : this.trigger('keydown');
};

/**
 * 给DOM集合绑定keypress事件或者触发keypress事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.keypress = function(fn) {
	return arguments.length > 0 ? this.on('keypress', fn) : this.trigger('keypress');
};

/**
 * 给DOM集合绑定keyup事件或者触发keyup事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.keyup = function(fn) {
	return arguments.length > 0 ? this.on('keyup', fn) : this.trigger('keyup');
};

/**
 * 给DOM集合绑定error事件或者触发error事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.error = function(fn) {
	return arguments.length > 0 ? this.on('error', fn) : this.trigger('error');
};

/**
 * 给DOM集合绑定contextmenu事件或者触发keyup事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.contextmenu = function(fn) {
	return arguments.length > 0 ? this.on('contextmenu', fn) : this.trigger('contextmenu');
};

/**
 * 给DOM集合绑定scroll事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.scroll = function(fn) {
	return this.on('scroll', fn);
};



/**
 * File: ajax.js
 */

/**
 * Ajax类
 * @author qianghu
 *
 * 使用样例:
 * <code lang="javascript">
 * $().post(url, {
 * 	data: {
		"user_name": "Alex",
		"email": "alex@abc.com"
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

/**
 * Ajax object
 * @constructor
 */
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
			options.url = settings.url;
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

	/**
	 * 发送一个请求
	 * @type {Fucntion}
	 */
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
				queryString = ('string' == typeof data) ? data : $.param(data),
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

/**
 * @return {ajaxObj}
 */
$.ajax = function(url, settings) {
	return new ajaxObj(url, settings).send();
};

/**
 * @return {ajaxObj}
 */
$.get = function(url, data, callback, type) {
	if ($.isFunction(data)) {
		type = type || callback;
		callback = data;
		data = undefined;
	}

	return new ajaxObj(url, {
		dataType: type,
		data: data,
		success: callback
	}).get();
};

/**
 * @return {ajaxObj}
 */
$.post = function(url, data, callback, type) {
	if ($.isFunction(data)) {
		type = type || callback;
		callback = data;
		data = undefined;
	}

	return new ajaxObj(url, {
		dataType: type,
		data: data,
		success: callback
	}).post();
};

/**
 */