
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
			if (_value !== '' && !isNaN(_value) && 'opacity|zIndex|lineHeight|zoom|fontWeight'.indexOf(k) < 0) {
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

