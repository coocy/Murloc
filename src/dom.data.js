
/**
 * $._dataCache = {
 *	'uid_1': {...},
 * 	'uid_2': {...},
 * 	...
 * };
 * @private
 */
$._dataCache = {};

/**
 * 给DOM对象添加数据
 * @param {(string|Object)=} key
 * @param {*=} value
 */
$.prototype.data = function(key, value) {

	// $(selector).data(string) || $(selector).data() || $(selector).data(undefined) || $().data()
	if (arguments.length < 2) {
		if (('string' === typeof key) || (undefined === key)) {
			var element = this.context[0] || {},
				uid = element['__ruid'] || '0',
				data = $._dataCache[uid];

			return key ? (data && data[key]) : data;
		}
	}

	// $(selector).data(obj[, undefined])
	if ('string' === typeof key) {
		var _key = {};
		if (undefined !== value) {
			_key[key + ''] = value;
		}
		key = _key;
	}

	return this.each(function(index, element) {
		var uid = $.guid(element),
			elementData = $._dataCache[uid] || ($._dataCache[uid] = {});

		for (var _key in key) {
			elementData[_key] = key[_key];
		}
	});
};

/**
 * 移除DOM对象上的数据
 * @param {?string=} key
 */
$.prototype.removeData = function(key) {
	return this.each(function(index, element) {
		var uid = element['__ruid'] || '0';

		if (uid in $._dataCache) {
			var data = $._dataCache[uid];
			if (undefined !== key) {
				delete data[key];
			} else {
				delete data;
			}
		}
	});
};
