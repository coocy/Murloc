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
