/**
 * JSON对象
 * 如果浏览器支持原生的JSON对象，会直接使用原生对象的方法，否则使用自定义实现的方法。
 * @class JSON
 * @static
 */

var JSON = WIN.JSON || {

	_specialChars: {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\'},

	_replaceChars: function(chr){
		return JSON._specialChars[chr] || '\\u00' + Math.floor(chr.charCodeAt() / 16).toString(16) + (chr.charCodeAt() % 16).toString(16);
	},

	/**
	 * 把一个标准JSON对象序列化成一个字符串，如果浏览器支持原生的JSON对象，会直接使用原生对象的方法，否则使用自定义实现的方法。
	 * @static
	 * @param {JSONType} obj JSON对象
	 * @return {string} 序列化成后的字符串
	 */
	stringify: function(obj) {
		if (obj instanceof Array) {
			type = 'array';
		} else {
			type = typeof obj;
		}
		switch (type){
			case 'string':
				return '"' + obj.replace(/[\x00-\x1f\\"]/g, JSON._replaceChars) + '"';
			case 'array':
				var string = [];
				for (var i = 0, l = obj.length; i < l; i++) {
					string.push(JSON.stringify(obj[i]));
				}
				return '[' + string.join(',') + ']';
			case 'object': case 'hash':
				var string = [], key, value;
				for (key in obj) {
					value = obj[key];
					var json = JSON.stringify(value);
					if (json) string.push(JSON.stringify(key) + ':' + json);
				};
				return '{' + string.join(',') + '}';
			case 'number': case 'boolean': return String(obj);
			case false: return 'null';
		}
		return null;
	},

	/**
	 * 把一个JSON字符串转换为标准JSON对象，如果浏览器支持原生的JSON对象，会直接使用原生对象的方法，否则使用自定义实现的方法。
	 * @static
	 * @param {string} string JSON字符串
	 * @return {JSONType} 标准JSON对象
	 */
	parse: function(string){
		return eval('(' + string + ')');
	}
};

/**
 * JSON.parse()的别名
 * @static
 * @param {string} string JSON字符串
 * @return {JSONType} 标准JSON对象
 */
$.parseJSON = JSON.parse;
