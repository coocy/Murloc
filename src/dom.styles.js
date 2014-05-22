
/**
 * 设置DOM对象集合的css或者读取集合中第一个DOM对象的css
 * @param {(string|Object)} key
 * @param {string=} value
 * @return {$}
 */
$.prototype.css =  function(key, value) {

	if (('string' === typeof key) && (arguments.length < 2)) {
		var element = this.context[0];
		key = $.camelCase(key);
		return element && (element.currentStyle || WIN.getComputedStyle(element, ''))[key];
	}

	return this.each(function(index, element) {
		if ('string' === typeof key) {
			var _key = {};
			_key[key] = value;
			key = _key;
		}
		for (var k in key) {
			var _value =  key[k];
			k = $.camelCase(k);
			if (k !== 'opacity' && _value !== '' && !isNaN(_value) && _value != 0) {
				_value += 'px';
			}

			element.style[k] = _value;
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
		if (element == element.window) {
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

