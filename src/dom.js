/**
 * 迭代一个{$}对象，对其中的每个子元素执行一个方法
 * @function
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

$.prototype.remove = function() {
	var i = this.length;
	while (i--) {
		var element = this.context[i];
		element.parentNode.removeChild(element)
	}
	this.length = 0;
	return this;
};

$._insertNodeBefore = function(element, parent, target) {
	//原生DOM对象直接添加
	var method = target ? 'insertBefore' : 'appendChild';
	if (element.nodeType) {
		parent[method](element, target);

	} else if (element instanceof $) {
		for (var i = 0, l = element.length; i < l; i++) {
			parent[method](element.context[i], target);
		}

	} else if ('string' === typeof element) {
		//处理添加HTML片段，不使用+=innerHTML是因为这样会消除给容器内的对象绑定的事件
		var containter = DOC.createElement('div');
		containter.innerHTML = element;
		for (var i = 0, l = containter.childNodes.length; i < l; i++) {
			parent[method](containter.childNodes[0], target);
		}
	}
};

$.prototype.before = function(preElement) {
	return this.each(function(index, element) {
		$._insertNodeBefore(preElement, element.parentNode, element);
	});
};

$.prototype.after = function(nextElement) {
	return this.each(function(index, element) {
		$._insertNodeBefore(nextElement, element.parentNode, element.nextSibling);
	});
};

$.prototype.prepend = function(childElement) {
	return this.each(function(index, element) {
		$._insertNodeBefore(childElement, element, element.firstChild);
	});
};

$.prototype.append = function(childElement) {
	return this.each(function(index, element) {
		$._insertNodeBefore(childElement, element);
	});
};

$.prototype.insertBefore = function(targetElement) {
	$(targetElement).before(this);
	return this;
};

$.prototype.insertAfter = function(targetElement) {
	$(targetElement).after(this);
	return this;
};

$.prototype.prependTo = function(targetElement) {
	$(targetElement).prepend(this);
	return this;
};

$.prototype.appendTo = function(targetElement) {
	$(targetElement).append(this);
	return this;
};

/**
 * 使用指定的开始和结束位置创建一个新的DOM集合
 * @function
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
 * @function
 * @return {$}
 */
$.prototype.first = function() {
	return this.eq(0);
};

/**
 * 返回DOM集合中的最后一个对象
 * @function
 * @return {$}
 */
$.prototype.last = function() {
	return this.eq(-1);
};

$.prototype.eq = function(index) {
	return $(this.get(index));
};

$.prototype.index = function(){
    return this.parent().children().context.indexOf(this.get(0));
};

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
			if (RR.matches(element, selector)) {
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
		if (!selector || (selector && RR.matches(element, selector))) {
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
			if (!selector || (selector && RR.matches(element, selector))) {
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

$.prototype.clone = function(cloneChildren) {
	var result = new $(),
		elements = [];
	this.each(function(index, element) {
		elements.push(element.cloneNode(!!cloneChildren));
	});
	result.context = elements;
	result.length = elements.length;
	return result;
};

$.guid = function(element) {
	return element['__ruid'] || (element['__ruid'] = $.uid++);
};

/*
DOC.addEventListener('DOMSubtreeModified', function(e) {
	console.log(e);
});*/