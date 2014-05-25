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
