/**
 * 加载js
 * @param {String} url js文件路径
 * @param {Function} callback 加载完成后的回调
 * @param {Array} opts 传给回调的参数
 */

$.getScript = function(url, callback, opts) {
	var elHead = DOC.getElementsByTagName('head')[0] || DOC.body,
		elScript = DOC.createElement('script'),
		done = false;

	elScript.src = url;

	/**
	 * @this {Element}
	 */
	var fnOnload = function() {
		if (!done && (!this.readyState || this.readyState !== 'loading')) {
			done = true;
			if(callback) callback.apply(null, opts || []);
			elScript.onload = elScript.onreadystatechange = null;
			elHead.removeChild(elScript);
		}
	};

	elScript.onload = fnOnload;
	elScript.onreadystatechange = fnOnload;
	elHead.appendChild(elScript);
};

/**
 * 加载css
 * @param {String} url css文件路径
 */
$.getCSS = function(url) {
	var elHead = DOC.getElementsByTagName('head')[0] || DOC.body,
		elLink = DOC.createElement('link');

		elLink.href = url;
		elLink.rel = "stylesheet";
		elLink.type = "text/css";

	elHead.appendChild(elLink);
};
