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
 * @param {Array.<Element>} parent
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

		//如果element.context是由querySelectorAll得到的DOM集合，
		//在改变集合中子对象在DOM树中的位置后，集合的中的对象顺序会马上发生改变（querySelectorAll得到的是动态集合，包含的子对象顺序始终维持子对象在DOM结构中的顺序），
		//所以这里需要转换成普通的数组
		var elements = $.toArray(element.context);

		for (var i = 0, l = element.length; i < l; i++) {
			resultElements = resultElements.concat($._insertNodeIntoParents(method, parent, elements[i], target));
		}

	//数组
	} else if (('string' !== typeof element) && !isNaN(element.length)) {

		//这里需要转换成普通的数组（原因同上）
		element = $.toArray(element);

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
 * @param {Array.<Element>} parents
 * @param {Element} element
 * @param {Element} target
 * @return {Array.<Element>}
 * @private
 */
$._insertNodeIntoParents = function(method,  parents, element, target) {

	//TODO: 在完成所有DOM方法后检查这里是否调用
	if (parents.nodeType) {
		parents[method](element, target);
		return [element];
	} else {
		var elem,
			i = 0,
			l = parents.length,
			elements = [];

		for (; i < l; i++) {
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
 * @param {boolean=} cloneDataAndEvents 是否复制data和事件
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



