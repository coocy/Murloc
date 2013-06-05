/**
 * 对本地存贮对象的操作封装
 * @static
 * @class Storage
 */

var Storage = function(key, value) {
	var storage = Storage.getStorage();
	if (storage) {
		if ('undefined' === typeof value) {
			value = storage.getItem(key);
			return value && JSON.parse(value);
		} else {
			storage.setItem(key, JSON.stringify(value));
		}
	}
};

Storage.getStorage = function() {
	var _localStorage;
	try{
		/* 在Android 4.0下，如果webview没有打开localStorage支持，在读取localStorage对象的时候会导致js运行出错，所以要放在try{}catch{}中 */
		_localStorage = WIN['localStorage'];
	} catch(e){
		if (ENABLE_DEBUG) {
			alert('localStorage is not supported');
		}
	}
	Storage.getStorage = function() {
		return WIN['localStorage'];
	}
	return _localStorage;	
};
	
/**
 * 清除本地存贮数据
 * @param {String} prefix 可选，如果包含此参数，则只删除包含此前缀的项，否则清除全部缓存
 */
Storage.clear = function(prefix) {
	var storage = Storage.getStorage();
	if (storage) {
		if (prefix) {
			for (var key in storage) {
				if (0 === key.indexOf(prefix)) {
					storage.removeItem(key);
				}
			}
		} else {
			storage.clear();
		}
	}
};

