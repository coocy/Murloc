
RR.fn.prototype.hasClass =  function(value) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;
	for (var i = 0, j, l = this.length; i < l; i++) {
		for  (j = 0; j < len; j++) {
			if ((' ' + this.context[i].className + ' ').indexOf(' ' + classes[j] + ' ') > -1) {
				return true;
			}
		}
	};
	return false;
};

RR.fn.prototype.addClass =  function(value) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;
	return this.each(function(element) {
		var className = ' ' + (element.className || '') + ' ',
			curClass,
			i;
		for  (i = 0; i < len; i++) {
			curClass = classes[i];
			if (className.indexOf(' ' + curClass + ' ') < 0) {
				className += curClass;
			}
		}
		element.className = className.trim();
	});
};

RR.fn.prototype.removeClass =  function(value) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;
	return this.each(function(element) {
		var className = ' ' + element.className + ' ',
			oClassName = className,
			curClass,
			i;
		for  (i = 0; i < len; i++) {
			curClass = classes[i];
			if (className.indexOf(curClass) > -1) {
				className = className.replace(' ' + curClass + ' ', ' ');
			}
		}
		//在className的值发生变化的情况下才改变DOM的className属性
		if (oClassName != className) {
			element.className = className.trim();
		}
	});
};

RR.fn.prototype.toggleClass =  function(value, condition) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;
	return this.each(function(element) {
		var className = ' ' + element.className + ' ',
			curClass,
			isAdd,
			i;
		for  (i = 0; i < len; i++) {
			curClass = classes[i];

			var isAdd = className.indexOf(' ' + curClass + ' ') < 0;

			if ('undefined' === typeof condition) {
				condition = isAdd;
			}

			if (condition) {
				if (isAdd) {
					className += curClass;
				}
			} else {
				className = className.replace(' ' + curClass + ' ', ' ');
			}
		}
		element.className = className.trim();
	});
};
