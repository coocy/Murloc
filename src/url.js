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
		
		/* 去掉字符串前面的"?"，并把&amp;转换为& */
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
