/**
 * Ajax类
 * @author qianghu
 *
 * 使用样例:
 * <code lang="javascript">
 * $().post(url, {
 * 	data: {
		"user_name": "Alex",
		"email": "alex@abc.com"
 	},
 	done: function(data, statusCode, ajaxObj) {

 	},
 	fail: function(ajaxObj, statusText) {

 	},
 	always: function(ajaxObj, statusText) {

 	},
 * 	...
 * }); //写入数据并发送POST请求，如果是GET请求则使用$().get(getUrl)方法
 * </code>
 */

var blankFn = function() {};
var IsSupportFormData = ('undefined' !== typeof FormData);

$._ajaxPrefilters = null;

/**
 * Ajax object
 * @constructor
 */
var ajaxObj = function(url, options) {
	return this.ajax(url, options);
};

ajaxObj.prototype = {

	isLoading: false,

	ajax: function(url, settings) {
		var  options = {};

		if ('string' == typeof url) {
			options.url = url;
		} else if ('object' == typeof url) {
			settings = url;
			options.url = settings.url;
		} else {
			url = '';
		}
		settings = settings || {};

		//Callbacks
		options.beforeSend = settings.beforeSend || blankFn;
		options.dataFilter = settings.dataFilter || blankFn;
		options.done = settings.done || settings.success || blankFn;
		options.fail = settings.fail || settings.error || blankFn;
		options.always = settings.always || settings.complete || blankFn;
		options.uploadProgress = settings.uploadProgress || null;

		//Settings
		options.cache = !!settings.cache;
		options.dataType = (settings.dataType || 'json').toLowerCase(); // 'json' | 'html' | 'script' | 'jsonp'
		options.data = settings.data || {}; //可以为queryString形式的字符串，或者键值对的object对象
		options.timeout = settings.timeout || 0;
		options.type = (settings.type || 'GET').toUpperCase();

		this.options = options;
		return this;
	},

	get: function(url) {
		this.options.type = 'GET';
		if (url) {
			this.options.url = url;
		}
		return this.send();
	},

	post: function(url) {
		this.options.type = 'POST';
		if (url) {
			this.options.url = url;
		}
		return this.send();
	},

	abort: function() {
		if (this.isLoading) {
			this.xmlhttp && this.xmlhttp.abort();
			this.isLoading = false;
		}
		return this;
	},

	/**
	 * 发送一个请求
	 * @type {Fucntion}
	 */
	send: function() {
		var xmlhttp = this.xmlhttp || (WIN['XMLHttpRequest'] ? new XMLHttpRequest() : false);
		if (xmlhttp) {

			this.abort();

			this.xmlhttp = xmlhttp;
			this.isLoaded = false;
			var self = this,
				options = this.options,
				onload = function() {
					if (!self || true === self.isLoaded || true == self.timoutFired) {
						return;
					}
					var responseText = xmlhttp.responseText;
					self.responseText = responseText;
					xmlhttp.onreadystatechange = blankFn;
					self.isLoading = false;
					if (responseText) {
						/* 默认请求的都是json数据，在这里验证返回的内容的有效性 */
						if ('json' == options.dataType) {
							if (responseText && (responseData = self._getJSON(responseText))) {
								self.responseData = responseData;
								self._onLoad(responseData, xmlhttp.status);
							} else {
								self._onFail('parsererror');
							}
						} else {
							self._onLoad(responseText, xmlhttp.status);
						}
					} else {
						self._onFail('parsererror');
					}
					self.isLoaded = true;
					self = null;
				};

			/* 没有网络连接 */
			xmlhttp.onerror = function() {
				self.isLoading = false;
				self._onFail('offline');
			}

			xmlhttp.onload = onload;

			xmlhttp.onreadystatechange = function() {
				/* 每次网络状态变化的时候重置超时计时 */
				self._resetTimeout();
				if (4 === this.readyState && 0 !== this.status) {
					onload();
				}
			};

		} else {
			this._onFail('error');
			return this;
		}

		if ($._ajaxPrefilters) {
			var originalOptions = $.copy(options);
			for (var i = 0, l = $._ajaxPrefilters.length; i < l; i++) {
				$._ajaxPrefilters[i](options, originalOptions, this);
			}
		}

		if (false !== options.beforeSend(this, options)) {

			var data = options.data,
				queryString = ('string' == typeof data) ? data : $.param(data),
				url = options.url,
				useFormData = false;

			if (IsSupportFormData && (true === data instanceof(FormData))) {
				queryString = data;
				useFormData = true;
			} else {
				queryString = ('string' == typeof data) ? data : $.param(data);
			}

			if ('GET' == options.type && !useFormData) {

				/* 如果原url后包含queryString的话则将新数据使用&附加到末尾 */
				var c = '';
				if (queryString.length > 0) {
					c = (-1 < url.indexOf('?')) ? '&' : '?';
				}
				xmlhttp.open('get', url + c + queryString, true);
			} else {
				xmlhttp.open('post', url, true);
				if (useFormData) {
					if ('upload' in xmlhttp) {
						xmlhttp['upload']['onprogress'] = options.uploadProgress;
					}
				} else {
					xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				}
			}

			/* ZTE中兴手机自带浏览器发送的Accept头导致某些服务端解析出错，强制覆盖一下 */
			xmlhttp.setRequestHeader('Accept', '*/*');

			var headers = options.headers;
			if (headers) {
				for (var key in headers) {
					xmlhttp.setRequestHeader(key, headers[key]);
				}
			}

			this.timoutFired = false;
			xmlhttp.send(queryString);
			this.isLoading =  true;
		}

		return this;
	},

	/**
	 * 把服务端返回的数据解析为JSON对象
	 * @private
	 */
	_getJSON: function(responseText) {
		if (responseText !== '') {
			try {
				/* 原生的JSON.parse更高效(但是有可能一些非标准的格式会造成JSON无法解析) */
				return JSON.parse(responseText);
			} catch(e) {
				if (ENABLE_DEBUG) {
					console.log('JSON.parse failed!');
				}
				try {
					return eval('(' + responseText + ')');
				} catch(e) {
					console.log('JSON.parse(eval) failed!');
				}
			};
		}
		return null;
	},

	/**
	 * 重置超时计时
	 * @private
	 */
	_resetTimeout: function() {
		var options = this.options;
		if (!options.timeout) return;
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}

		var self = this;
		this.timer = setTimeout(function() {
			if (true === self.timoutFired || true === self.isLoaded) {
				return;
			}
			self.abort();
			self.timoutFired = true;
			self._onFail('timeout');
		}.bind({timer: this.timer}), options.timeout * 1000);

	},

	_onLoad: function(data, statusCode) {
		this.options.done.apply(this, [data, statusCode, this]);
		this.options.always.apply(this, [this, 'success']);
	},

	_onFail: function(statusText) {
		this.options.fail.apply(this, [this, statusText]);
		this.options.always.apply(this, [this, statusText]);
	}
};

/**
 * @return {ajaxObj}
 */
$.ajax = function(url, settings) {
	return new ajaxObj(url, settings).send();
};

/**
 * @return {ajaxObj}
 */
$.get = function(url, data, callback, type) {
	if ($.isFunction(data)) {
		type = type || callback;
		callback = data;
		data = undefined;
	}

	return new ajaxObj(url, {
		dataType: type,
		data: data,
		success: callback
	}).get();
};

/**
 * @return {ajaxObj}
 */
$.post = function(url, data, callback, type) {
	if ($.isFunction(data)) {
		type = type || callback;
		callback = data;
		data = undefined;
	}

	return new ajaxObj(url, {
		dataType: type,
		data: data,
		success: callback
	}).post();
};

/**
 * Ajax的全局预处理方法
 * @param {function(Object=, Object=, ajaxObj=)} fn
 * @return {$}
 */
$.ajaxPrefilter = function(fn) {
	if (!$._ajaxPrefilters) {
		$._ajaxPrefilters = [];
	}
	$._ajaxPrefilters.push(fn);
};
