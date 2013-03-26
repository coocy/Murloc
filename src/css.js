
RR.fn.prototype.addClass =  function(value) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;
	this.each(function(element) {
		var className = element.className || '';
		for  (var i = 0; i < len; i++) {
			var curClass = classes[i];
			if (className.indexOf(' '  + curClass + ' ') < 0) {
				className += ' ' + curClass;
			}
		}
		element.className = className.trim();
	});
	return this;
};

RR.fn.prototype.removeClass =  function(value) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;
	this.each(function(element) {
		var className = ' ' + element.className + ' ',
			oClassName = className;
		for  (var i = 0; i < len; i++) {
			var curClass = classes[i];
			if (className.indexOf(curClass) > -1) {
				className = className.replace(' ' + curClass + ' ', ' ');
			}

			//在className的值发生变化的情况下才改变DOM的className属性
			if (oClassName != className) {
				element.className = className.trim();
			}
		}
	});
};

