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
