
$.prototype.hasClass =  function(value) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;
	for (var i = 0, j, l = this.length; i < l; i++) {
		for  (j = 0; j < len; j++) {
			if ((' ' + this.context[i].className.replace(/\s+/g, ' ') + ' ').indexOf(' ' + classes[j] + ' ') > -1) {
				return true;
			}
		}
	};
	return false;
};

$.prototype.addClass =  function(value) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;
	return this.each(function(index, element) {
		var className = ' ' + (element.className || '') + ' ',
			curClass,
			i;
		for  (i = 0; i < len; i++) {
			curClass = classes[i];
			if (className.indexOf(' ' + curClass + ' ') < 0) {
				className += curClass + ' ';
			}
		}
		element.className = className.trim();
	});
};

/**
 * 移除对象的className
 * @param {string=} value 要移除的className，如果value为空，移除对象的全部className
 * @return {$}
 */
$.prototype.removeClass =  function(value) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length,
		removeAllClasses = arguments.length < 1;

	//由elem.querySelector()得到的DOM集合为动态集合，在这里需要转化为常规数组，
	//防止$('.abc').removeClass('abc')这种形式的调用得到不正确的结果
	this.context = $.toArray(this.context);

	return this.each(function(index, element) {
		//如果value为空，移除对象的全部className
		if (removeAllClasses) {
			element.className = '';
			return;
		}
		var className = ' ' + element.className.replace(/\s+/g, ' ') + ' ',
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

$.prototype.toggleClass =  function(value, condition) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;

	//由elem.querySelector()得到的DOM集合为动态集合，在这里需要转化为常规数组，
	//防止$('.abc').toggleClass('abc')这种形式的调用得到不正确的结果
	this.context = $.toArray(this.context);

	return this.each(function(index, element) {
		var className = ' ' + element.className.replace(/\s+/g, ' ') + ' ',
			curClass,
			needAdd,
			forceAdd,
			i;
		for  (i = 0; i < len; i++) {
			curClass = classes[i];

			needAdd = className.indexOf(' ' + curClass + ' ') < 0;
			forceAdd = (undefined === condition) ? needAdd : condition;

			if (forceAdd) {
				if (needAdd) {
					className += curClass + ' ';
				}
			} else {
				className = className.replace(' ' + curClass + ' ', ' ');
			}
		}
		element.className = className.trim();
	});
};
