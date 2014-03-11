/**
 * 迭代一个{$}对象，对其中的每个子元素执行一个方法
 * @param {function(number=, Element=)} fn
 */
$.prototype.each = function(fn) {
	for (var i = 0, l = this.length, element; i < l; i++) {
		element = this.context[i];
		var result = fn.call(element, i, element);
		if (false === result) {
			break;
		}
	}
	return this;
};

/**
 * 使用指定的开始和结束位置创建一个新的DOM集合
 * @param {number} start 指定开始的位置，如果为负值，则从尾部开始计算偏移
 * @param {number=} end 指定开始的位置，如果为负值，则从尾部开始计算偏移，如果不指定，则默认到末尾的位置
 * @return {$}
 */
$.prototype.slice = function(start, end) {

	var length = this.length,
		start = start + (start < 0 ? length : 0),
		end = undefined == end ? length : end,
		end = end + (end < 0 ? length : 0),
		result = new $();

	result.context = [].slice.call(this.context, start, end);
	result.length = result.context.length;

	return result;
};

/**
 * 返回DOM集合中的第一个对象
 * @return {$}
 */
$.prototype.first = function() {
	return this.eq(0);
};

/**
 * 返回DOM集合中的最后一个对象
 * @return {$}
 */
$.prototype.last = function() {
	return this.eq(-1);
};

/**
 * 返回DOM集合中的最后一个对象
 * @param {number} index 从0开始的索引数字
 * @return {$}
 */
$.prototype.eq = function(index) {
	return $(this.get(index));
};

$.prototype.index = function(){
    return this.parent().children().context.indexOf(this.get(0));
};

/**
 * 返回一个或者多个$对象中的原生DOM对象
 * @param {number=} index 从0开始的索引数字
 * @return {(Element|Array|{length: number})}
 */
$.prototype.get = function(index) {
	if (undefined === index) {
		return this.context;
	}
	var index = parseInt(index, 10),
		length = this.length,
		idx = index + (index < 0 ? length : 0);

	return idx < 0 ? undefined : this.context[idx];
};

$.is = function(element, selector) {
	if (!selector) return false;
	var matchesSelector = element.webkitMatchesSelector || 
		element.mozMatchesSelector || 
		element.oMatchesSelector || 
		element.matchesSelector;

	if (matchesSelector) {
		return  matchesSelector.call(element, selector);
	}
};

$.prototype.filter = function(selector) {
	var result = new $(),
		elements = [];

	if (selector) {
		this.each(function(index, element) {
			if ($.is(element, selector)) {
				elements.push(element);
			}
		});
	}

	result.context = elements;
	result.length = elements.length;
	return result;
}

$.prototype.parent = function(selector) {
	var result = new $(),
		elements = [];
	this.each(function(index, element) {
		if (!selector || (selector && $.is(element, selector))) {
			elements.push(element.parentNode);
		}
	});
	result.context = elements;
	result.length = elements.length;
	return result;
};

$.prototype.parents = function(selector) {
	var result = new $(),
		elements = [];
	this.each(function(index, element) {
		while((element = element.parentNode) && element !== DOC &&  elements.indexOf(element) < 0) {
			if (!selector || (selector && $.is(element, selector))) {
				elements.push(element);
			}
		}
	});
	result.context = elements;
	result.length = elements.length;
	return result;
};

$.prototype.children = function() {
	var result = new $(),
		elements = [];
	this.each(function(index, element) {
		for (var i = 0, l = element.childNodes.length; i < l; i++) {
			var child = element.childNodes[i];
			(1 == child.nodeType) && elements.push(child);
		}
	});
	result.context = elements;
	result.length = elements.length;
	return result;
};

$.prototype.contents = function() {
	var result = new $(),
		elements = [];
	this.each(function(index, element) {
		for (var i = 0, l = element.childNodes.length; i < l; i++) {
			var child = element.childNodes[i];
			(1 == child.nodeType) && elements.push(child);
		}
	});
	result.context = elements;
	result.length = elements.length;
	return result;
};

$.prototype.data = function() {
	return this;
};


$.prototype.find = function(selector) {
	var result = new $(),
		elements = [];
	this.each(function(index, element) {
		if (selector && $.is(element, selector)) {
			elements.push(element);
		}
	});
	result.context = elements;
	result.length = elements.length;
	return result;
};

$.guid = function(element) {
	return element['__ruid'] || (element['__ruid'] = $.uid++);
};
