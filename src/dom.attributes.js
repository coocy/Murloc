
RR.fn.prototype.html =  function() {
	var html = arguments[0];
		
	if ('undefined' !== typeof html) {
		return this.each(function(element) {
			element.innerHTML = html;
		});
	} else {
		var element = this.context[0];
		return element && element.innerHTML;
	}
};

RR.fn.prototype.val =  function() {
	var val = arguments[0];
		
	if ('undefined' !== typeof val) {
		return this.each(function(element) {
			element.value = val;
		});
	} else {
		var element = this.context[0];
		return element && element.value;
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
		if ('object' !== typeof key) {
			var _key = {};
			_key[key] = value;
			key = _key;
		}
		for (var k in key) {
			var _value =  key[k];
			if (_value !== '' && !isNaN(_value) && _value != 0) {
				_value += 'px';
			}
			element.style[k] = _value;
		}
	});
};
