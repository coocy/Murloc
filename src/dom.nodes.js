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
 * 把传入的$对象或者数组递归合并成1个数组
 * @param {(Element|$|String|Number|Array.<(Element|$)>)} elements 单个DOM对象或者包含DOM集合的数组
 * @return {Array.<Element>}
 * @private
 */
$._getPlainArray = function(elements) {

	//原生DOM对象
	if (elements.nodeType) {
		return [elements];

	} else {

		var result = [];

		//$
		if (elements instanceof $) {
			result = _concat.apply(result, elements.context);

		//数组
		} else if (('string' !== typeof elements) && !isNaN(elements.length)) {

			for (var i = 0, l = elements.length; i < l; i++) {
				result = _concat.apply(result, $._getPlainArray(elements[i]));
			}

		} else {

			//按字符串处理，创建HTML片段
			var containter = DOC.createElement('div');
			containter.innerHTML = elements + '';
			result = _concat.apply(result, containter.childNodes);
		}

		return result;
	}
};

/**
 * 在父对象集合中插入DOM对象集合
 * @param {(Element|$|String|Number|Array.<(Element|$)>)} elements 单个DOM对象或者包含DOM集合的数组
 * @param {Array.<Element>} parents DOM集合
 * @param {String} targetPropName
 * @param {Number=} siblingType
 * @return {Array.<Element>}
 * @private
 */
$._insertNodeBefore = function(elements, parents, targetPropName, siblingType) {
	//原生DOM对象直接添加
	var method = targetPropName ? 'insertBefore' : 'appendChild',
		resultElements = [];

	var elements = $._getPlainArray(elements),
		parent,
		l = parents.length,
		i = 0,
		j, k,
		element;

	for (; i < l; i++) {
		parent = parents[i];

		if (undefined !== siblingType) {
			target = (0 === siblingType) ? parent : parent.nextSibling;
			parent = parent.parentNode;
			if (!parent) {
				continue;
			}
		} else {
			target = targetPropName ? parent[targetPropName] : undefined;
		}

		for (j = 0, k = elements.length; j < k; j++) {
			element = elements[j];

			element = (i < l - 1) ? $.clone(element, true) : element;

			parent[method](element, target);
			resultElements.push(element);
		}
	}

	return resultElements;
};

/**
 * 在指定的父对象中前置插入DOM对象
 * @param {...(Element|$|String|Number|Array.<(Element|$)>)} childElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.prepend = function(childElement) {
	$._insertNodeBefore(arguments, this.context, 'firstChild');
	return this;
};

/**
 * 把DOM对象前置插入到指定的父对象中
 * @param {(Element|$|String)} targetElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.prependTo = function(targetElement) {
	this.context = $._insertNodeBefore(this.context, $(targetElement).context, 'firstChild');
	this.length = this.context.length;
	return this;
};

/**
 * 在指定的父对象中插入一个DOM对象
 * @param {...(Element|$|String|Number|Array.<(Element|$)>)} childElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.append = function(childElement) {
	$._insertNodeBefore(arguments, this.context);
	return this;
};

/**
 * 把DOM对象插入到指定的父对象中
 * @param {(Element|$|String)} targetElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.appendTo = function(targetElement) {
	this.context = $._insertNodeBefore(this.context, $(targetElement).context);
	this.length = this.context.length;
	return this;
};

/**
 * 在指定的对象前插入DOM对象
 * @param {...(Element|$|String|Number|Array.<(Element|$)>)} targetElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.before = function(targetElement) {
	$._insertNodeBefore(arguments, this.context, 1, 0);
	return this;
};

/**
 * 把DOM对象插入到指定的对象前面
 * @param {(Element|$|String)} targetElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.insertBefore = function(targetElement) {
	this.context = $._insertNodeBefore(this.context, $(targetElement).context, 1, 0);
	this.length = this.context.length;
	return this;
};

/**
 * 在指定的对象后面插入DOM对象
 * @param {...(Element|$|String|Number|Array.<(Element|$)>)} targetElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.after = function(targetElement) {
	$._insertNodeBefore(arguments, this.context, 1, 1);
	return this;
};

/**
 * 把DOM对象插入到指定的对象后面
 * @param {(Element|$|String)} targetElement 单个DOM对象或者包含DOM集合的数组
 * @return {$}
 */
$.prototype.insertAfter = function(targetElement) {
	this.context = $._insertNodeBefore(this.context, $(targetElement).context, 1, 1);
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
			eventData = $._eventCache[uid],
			eventName,
			elemData,
			newUid;

		if (eventData || data) {
			newUid = $.guid(newElement); //newUid需要读写DOM，所以在需要复制事件和data的时候才生成newUid

			//复制事件
			if (eventData) {
				$._eventCache[newUid] = $.copy(eventData);
			}

			//复制data
			if (data) {
				$._dataCache[newUid] = $.copy(data);
			}
		}
	}

	return newElement;
};

/**
 * 复制一个DOM集合，返回复制后的新集合
 * @param {boolean=} cloneDataAndEvents 是否复制data和事件。出于性能和使用的可能性考虑，此方法不复制子对象的data和事件（如果需要用到的话可以自行实现）
 * @return {$}
 */
$.prototype.clone = function(cloneDataAndEvents) {
	var result = new $(),
		elements = [];

	this.each(function(index, element) {
		elements.push($.clone(element, cloneDataAndEvents));
	});

	result.context = elements;
	result.length = elements.length;
	return result;
};



