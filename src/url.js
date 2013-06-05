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
			_URLParms = {};
		
		while (i--) {
			item = querys[i].split('=');
			if (item[0]) {
				_URLParms[item[0]] =  item[1] || '';
			}
		}
		return _URLParms;
	},

	/**
	 * 获取当前页面或者指定DOM对象的URL中的指定的GET参数的值
	 * @param {String} key 要获取的GET参数的键
	 * @param {DOM} el 如此传递此参数，则获取这个DOM对象的url，如果不传则获取当前页面的url
	 * @return {String}
	 */
	getQueryString: function(key, el) {
		var parms,
			queryString = el ? URL.getElSearchString(el) : WIN.location.search.substring(1);

		parms = URL.getQueryData(queryString);
		return parms[key] || '';
	},

	/**
	 * 获取指定DOM对象的链接地址的queryString
	 * @param {DOM} el 要获取参数的DOM对象
	 * @return {String}
	 */
	getElSearchString: function(el) {
		/* 在某些Android下获取不到el.search的值，要使用自定义方法从url中截取 */
		var searchString = el.search || '';
		if (!searchString) {
			var hrefString = ('FORM' == el.nodeName ? el.getAttribute('action') : el.getAttribute('href')),
				pos = hrefString.indexOf('?');	
			if (-1 !== pos) {
				searchString = hrefString.slice(pos);
			}
		}
		return searchString;
	}
};
