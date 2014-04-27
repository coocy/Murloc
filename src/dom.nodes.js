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
 * @return {Array.<Element>}
 * @private
 */
$._insertNodeBefore = function(element, parent, target) {
	//原生DOM对象直接添加
	var method = target ? 'insertBefore' : 'appendChild',
		resultElements = [];

	if (element.nodeType) {
		resultElements = $._insertNodeIntoParents(method, parent, element, target);

	//$
	} else if (element instanceof $) {
		for (var i = 0, l = element.length; i < l; i++) {
			resultElements = resultElements.concat($._insertNodeIntoParents(method, parent, element.context[i], target));
		}

	//数组
	} else if (('string' !== typeof element) && !isNaN(element.length)) {
		for (var i = 0, l = element.length; i < l; i++) {
			resultElements = resultElements.concat($._insertNodeBefore(element[i], parent, target));
		}

	} else {
		//处理添加HTML片段，不使用+=innerHTML是因为这样会消除给容器内的对象绑定的事件
		var containter = DOC.createElement('div');
		containter.innerHTML = element + '';
		for (var i = 0, l = containter.childNodes.length; i < l; i++) {
			resultElements = resultElements.concat($._insertNodeIntoParents(method, parent, containter.childNodes[0], target));
		}
	}

	return resultElements;
};

/**
 * 在一个或者多个父对象中插入一个DOM对象；如果是一个父对象，直接插入DOM对象；如果是多个父对象，则在每个父对象中插入复制的DOM对象
 * @param {string} method
 * @param {(Element|Array.<Element>)} parents
 * @param {Element} element
 * @param {Element} target
 * @return {Array.<Element>}
 * @private
 */
$._insertNodeIntoParents = function(method,  parents, element, target) {
	if (parents.nodeType) {
		parents[method](element, target);
		return [element];
	} else {
		var elem,
			elements = [];
		for (var i = 0, l = parents.length; i < l; i++) {
			elem = (i < l - 1) ? $.clone(element, true) : element;
			parents[i][method](elem, target);
			elements.push(elem);
		}
		return elements;
	}
};

$.prototype.before = function() {
	var elements = arguments;
	if (elements.length < 2) {
		elements = elements[0];
	}
	return this.each(function(index, element) {
		$._insertNodeBefore(elements, element.parentNode, element);
	});
};

$.prototype.after = function() {
	var elements = arguments;
	if (elements.length < 2) {
		elements = elements[0];
	}
	return this.each(function(index, element) {
		$._insertNodeBefore(elements, element.parentNode, element.nextSibling);
	});
};

/**
 * 在指定的父对象中前置插入一个DOM对象
 * @param {...(Element|$|String|Number|Array.<(Element|$)>)} childElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.prepend = function(childElement) {
	var elements = arguments;
	if (elements.length < 2) {
		elements = elements[0];
	}
	return this.each(function(index, element) {
		$._insertNodeBefore(elements, element, element.firstChild);
	});
};

/**
 * 在指定的父对象中插入一个DOM对象
 * @param {...(Element|$|String|Number|Array.<(Element|$)>)} childElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.append = function(childElement) {
	var elements = arguments;
	if (elements.length < 2) {
		elements = elements[0];
	}

	$._insertNodeBefore(elements, this.context);

	return this;
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
	var elements = this.context;
	if (elements.length < 2) {
		elements = elements[0];
	}
	this.context = $._insertNodeBefore(elements, $(targetElement).context);
	this.length = this.context.length;
	return this;
};

$.prototype.wrap = function() {
	return this;
};

/**
 * 复制一个DOM对象，返回复制后的新集合
 * @param {Element} element 要复制的DOM对象
 * @param {boolean=} cloneDataAndEvents 是否复制data和事件
 * @return {Element} 复制的DOM对象
 */
$.clone = function(element, cloneDataAndEvents) {
	var newElement = element.cloneNode(true);

	if (cloneDataAndEvents) {
		var uid = element['__ruid'] || '0',
			data = $._dataCache[uid],
			eventName,
			eventData,
			elemData,
			newUid = $.guid(newElement);

		//复制data
		if (data) {
			$._dataCache[newUid] = $.copy(data);
		}

		//复制事件
		for (eventName in $._eventCache) {
			eventData = $._eventCache[eventName];
			elemData = eventData[uid];
			if (elemData) {
				eventData[newUid] = $.copy(elemData);
			}
		}
	}
	return newElement;
};

/**
 * 复制一个DOM集合，返回复制后的新集合
 * @param {boolean=} cloneDataAndEvents 是否复制data和事件
 * @return {$}
 */
$.prototype.clone = function(cloneDataAndEvents) {
	var result = new $(),
		newElement,
		elements = [];

	this.each(function(index, element) {
		newElement = $.clone(element, cloneDataAndEvents);
		elements.push(newElement);
	});
	result.context = elements;
	result.length = elements.length;
	return result;
};
