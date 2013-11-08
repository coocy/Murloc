/**
 * 工具类
 * author binnng
 */

var getScript = function(url, callback, opts) {
	var head = DOC.getElementsByTagName('head')[0] || DOC.body,
		script = DOC.createElement('script'),
		done = false;

	script.src = url;

	script.onload = script.onreadystatechange = function() {
		if (!done && (!this.readyState || this.readyState !== 'loading')) {
			done = true;
			if(callback) callback.apply(null, opts || []);
			script.onload = script.onreadystatechange = null;
			head.removeChild(script);
		}
	};
	head.appendChild(script);
};

var getCSS = function(url) {
	var head = DOC.getElementsByTagName('head')[0] || DOC.body,
		el = DOC.createElement("link");

		el.href = url;
		el.rel = "stylesheet";
		el.type = "text/css";

	head.appendChild(el);
};

RR.fn.prototype.getScript = getScript;
RR.fn.prototype.getCSS = getCSS;