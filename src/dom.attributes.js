
RR.fn.prototype.html =  function() {
	var html = arguments[0];
		
	if ('string' === typeof html) {
		return this.each(function(element) {
			element.innerHTML = html;
		});
	} else {
		var element = this.context[0];
		return element && element.innerHTML;
	}
};

RR.fn.prototype.attr =  function(name, value) {
	if ('undefined' !== typeof value) {
		return this.each(function(element) {
			element.setAttribute(name, value);
		});
	} else {
		var element = this.context[0];
		return element && element.getAttribute && element.getAttribute(name);
	}
};

RR.fn.prototype.removeAttr =  function(name) {
	return this.each(function(element) {
		element.removeAttribute && element.removeAttribute(name);
	});
};

RR.fn.prototype.css =  function(key, value) {
	return this.each(function(element) {
		element.style[key] = value;
	});
};
