/**
 * 移除DOM对象
 * @return {$}
 */
$.prototype.remove = function() {
	var i = this.length;
	while (i--) {
		var element = this.context[i],
			elParent = element.parentNode;
		elParent && elParent.removeChild(element);
	}
	this.length = 0;
	return this;
};

/**
 * 在指定的父对象中插入一个DOM对象
 * @param {(Element|$|String|Number|Array.<(Element|$)>)} element 单个DOM对象或者包含DOM集合的数组
 * @param {Element} parent
 * @param {Element} target
 * @private
 */
$._insertNodeBefore = function(element, parent, target) {
	//原生DOM对象直接添加
	var method = target ? 'insertBefore' : 'appendChild';
	if (element.nodeType) {
		parent[method](element, target);

	//$
	} else if (element instanceof $) {
		for (var i = 0, l = element.length; i < l; i++) {
			parent[method](element.context[i], target);
		}

	//数组
	} else if (('string' !== typeof element) && !isNaN(element.length)) {
		for (var i = 0, l = element.length; i < l; i++) {
			$._insertNodeBefore(element[i], parent, target);
		}

	} else {
		//处理添加HTML片段，不使用+=innerHTML是因为这样会消除给容器内的对象绑定的事件
		var containter = DOC.createElement('div');
		containter.innerHTML = element + '';
		for (var i = 0, l = containter.childNodes.length; i < l; i++) {
			parent[method](containter.childNodes[0], target);
		}
	}
};

$.prototype.before = function() {
	var elements = arguments;
	return this.each(function(index, element) {
		$._insertNodeBefore(elements, element.parentNode, element);
	});
};

$.prototype.after = function() {
	var elements = arguments;
	return this.each(function(index, element) {
		$._insertNodeBefore(elements, element.parentNode, element.nextSibling);
	});
};

/**
 * 在指定的父对象中前置插入一个DOM对象
 * @param {...(Element|$|String|Number|Array.<(Element|$)>)} element 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.prepend = function(childElement) {
	var elements = arguments;
	return this.each(function(index, element) {
		$._insertNodeBefore(elements, element, element.firstChild);
	});
};

/**
 * 在指定的父对象中插入一个DOM对象
 * @param {...(Element|$|String|Number|Array.<(Element|$)>)} element 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.append = function() {
	var elements = arguments;
	return this.each(function(index, element) {
		$._insertNodeBefore(elements, element);
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

$.prototype.wrap = function() {
	return this;
};

/**
 * 复制一个DOM集合，返回复制后的新集合
 * @param {boolean=} cloneDataAndEvents 是否复制data和事件
 * @return {$}
 */
$.prototype.clone = function(cloneDataAndEvents) {
	var result = new $(),
		newElement,
		elements = [],
		uid,
		data;

	this.each(function(index, element) {
		newElement = element.cloneNode(true);
		if (cloneDataAndEvents) {
			uid = element['__ruid'] || '0';
			data = $._dataCache[uid];
			if (data) {
				uid = $.guid(newElement),
				$._dataCache[uid] = $.copy(data);
			}
		}
		elements.push(newElement);
	});
	result.context = elements;
	result.length = elements.length;
	return result;
};
