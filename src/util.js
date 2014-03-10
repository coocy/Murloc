/**
 * 工具类
 * author binnng
 */

$.getScript = function(url, callback, opts) {
	var elHead = DOC.getElementsByTagName('head')[0] || DOC.body,
		elScript = DOC.createElement('script'),
		done = false;

	elScript.src = url;

	elScript.onload = elScript.onreadystatechange = function() {
		if (!done && (!this.readyState || this.readyState !== 'loading')) {
			done = true;
			if(callback) callback.apply(null, opts || []);
			elScript.onload = elScript.onreadystatechange = null;
			elHead.removeChild(elScript);
		}
	};
	elHead.appendChild(elScript);
};

$.getCSS = function(url) {
	var elHead = DOC.getElementsByTagName('head')[0] || DOC.body,
		elLink = DOC.createElement('link');

		elLink.href = url;
		elLink.rel = "stylesheet";
		elLink.type = "text/css";

	elHead.appendChild(elLink);
};
