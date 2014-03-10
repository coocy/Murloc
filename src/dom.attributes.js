
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

$.prototype.val =  function() {
	var val = arguments[0];
		
	if (undefined !== val) {
		return this.each(function(index, element) {
			element.value = val;
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

$.prototype.removeAttr =  function(name) {
	return this.each(function(index, element) {
		element.removeAttribute && element.removeAttribute(name);
	});
};

$.prototype.css =  function(key, value) {

	if (('string' === typeof key) && (undefined === value)) {
		var element = this.context[0];
		return element && (element.currentStyle || window.getComputedStyle(element, null))[key];
	}

	return this.each(function(index, element) {
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
