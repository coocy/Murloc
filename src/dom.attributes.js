
$.prototype.html =  function() {
	var html = arguments[0];

	if (undefined !== html) {

		/* 把html转换为字符串 */
		html += '';
		/* 简单检测是否是纯文本的内容 */
		var isText = true;
		if (html.indexOf('<') > -1 && html.indexOf('>') > -1) {
			isText = false;
		}
		return this.each(function(index, element) {
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

$.prototype.text = function(text) {
	if (arguments.length > 0) {
		if (undefined === text) {
			return this;
		}
		return this.each(function(index, element) {
			if (element && ('innerText' in element)) {
				element.innerText = text;
			}
		});
	} else {
		var element = this.context[0];
		return element && (element.innerText || element.textContent);
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
	if (undefined !== value) {
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

	if (undefined !== value) {
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
