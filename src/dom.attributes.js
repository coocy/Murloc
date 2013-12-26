
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

	if ('string' === (typeof key).toLowerCase() && 'undefined' === typeof value) {
		var element = this.context[0];
    	return element && (element.currentStyle? element.currentStyle : window.getComputedStyle(element, null))[key];
    }

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
