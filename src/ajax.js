

var blankFn = function() {};

var ajaxObj = function(url, options) {
	return this.ajax(url, options);
};

ajaxObj.prototype = {
	ajax: function(url, settings) {
		var  options = {};

		if ('string' == typeof url) {
			options.url = url;
		} else if ('object' == typeof url) {
			settings = url;
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

		//Settings
		options.cache = !!settings.cache;
		options.dataType = (settings.dataType || 'json').toLowerCase(); // 'json' | 'html' | 'script' | 'jsonp'
		options.data = settings.data || {};
		options.timeout = settings.timeout || 0;
		options.type = (settings.type || 'GET').toUpperCase();

		this.options = options;
	},

	get: function() {
		this.options.type = 'GET';
		this.send();
	},

	post: function() {
		this.options.type = 'POST';
		this.send();
	},

	send: function() {
		xmlhttp = this.xmlhttp || (window.XMLHttpRequest ? new XMLHttpRequest() : false);
		if (xmlhttp) {

			this.xmlhttp = xmlhttp;
			var self = this,
				options = this.options;

			/* 没有网络连接 */
			xmlhttp.onerror = function() {
				self._onFail('offline');
			}

			xmlhttp.onreadystatechange = function() {
				/* 每次网络状态变化的时候重置超时计时 */
				self._resetTimeout();
				if (4 === this.readyState && 0 !== this.status) {
					//if(!self.timer) return;
					var responseText = this.responseText;
					self.responseText = responseText;
					xmlhttp.onreadystatechange = blankFn;
					xmlhttp = null;
					if (responseText) {
						/* 默认请求的都是json数据，在这里验证返回的内容的有效性 */
						if ('json' == options.dataType) {
							if (responseText && (responseData = self._getJSON(responseText))) {
								self.responseData = responseData;
								self._onLoad(responseData, this.status);
							} else {
								self._onFail('parsererror');
							}
						} else {
							self._onLoad(responseText, this.status);
						}
					} else {
						self._onFail('parsererror');
					}
					self = null;
				}
			};

		} else {
			this._onFail('error');
			return this;
		}

		if (false !== options.beforeSend(this, options)) {

			var queryString = URL.objToQueryString(options.data),
				url = options.url;

			if ('GET' == options.type) {
				/* 如果原url后包含queryString的话则将新数据使用&附加到末尾 */

				var c = '';
				if (queryString.length > 0) {
					(-1 !== url.indexOf('?')) ? '&' : '?';
				}
				xmlhttp.open('get', url + c + queryString, true);
			} else {
				xmlhttp.open('post', url, true);
				xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			}
			
			xmlhttp.send(queryString);
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
				return JSON.parse(this.response);
			} catch(e) {
				if (ENABLE_DEBUG) {
					console.log('JSON.parse failed!');
				}
				try {
					return eval('(' + responseText + ')');
				} catch(e) {}
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
		}
		var self = this;
		this.timer = setTimeout(function() {
			options.fail(this, 'timeout');
		}, options.timeout * 1000); 
	},

	_onLoad: function(data, statusCode) {
		this.options.done(data, statusCode, this);
		this.options.always(this, 'success');
	},

	_onFail: function(statusText) {
		this.options.fail(this, statusText);
		this.options.always(this, statusText);
	}
};

RR.fn.prototype.ajax = function(url, settings) {
	return new ajaxObj(url, settings).send();
};

RR.fn.prototype.get = function(url, settings) {
	return new ajaxObj(url, settings).get();
};

RR.fn.prototype.post = function(url, settings) {
	return new ajaxObj(url, settings).post();
};


