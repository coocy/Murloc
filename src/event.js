/**
 * Event
 */

 /*
$._eventCache = {
	'uid_1': {
		'event_1': [
			fn1: 1,
			fn2: 1,
			...
		],
		'event_2': [
			fn1: 1,
			fn2: 1,
			...
		],
		...
	},
	'uid_2': {
		'event_1': [
			fn1: 1,
			fn2: 1,
			...
		],
		'event_2': [
			fn1: 1,
			fn2: 1,
			...
		],
		...
	},
	...,
	'tA': {
		'event_1': [
			fn1: 1,
			fn2: 1,
			...
		],
		'event_2': [
			fn1: 1,
			fn2: 1,
			...
		],
		...
	},
	...
};
*/

/* 标记是否使用Touch事件模拟点击 */
var UseTouchClick = IsTouch;

if (UseTouchClick &&!IsAndroid /* Android下使用模拟点击会导致不稳定（比如跨页面点击、视频退出全屏后跨页面后退） */ &&
	UA.indexOf('PlayStation') < 0 /* PlayStation手持设备使用模拟点击会造成在滑动页面的时候触发点击 */
) {
	UseTouchClick = true;
}

/**
 * @constructor
 * @param {(Event|$.event)} e
 * @return {$.event}
 */
$.event = function(e) {
	if (e instanceof $.event) {
		return e;
	}

	var changedTouches = e.changedTouches,
		ee = (changedTouches && changedTouches.length > 0) ? changedTouches[0] : e;

	this.event = e;
	this.originalEvent = ee;

	this.target = e.target || e.srcElement;
	this.type = e.type;
	return this;
};

$.event.prototype = {

	/*
	 * @type {?Event}
	 */
	event: null,

	/*
	 * @type {?Event}
	 */
	originalEvent: null,

	/*
	 * @type {?Element}
	 */
	target: null,

	/*
	 * @type {?string}
	 */
	type: null,

	/*
	 * @type {boolean}
	 */
	isPropagationStopped: false,

	/*
	 * @type {boolean}
	 */
	isDefaultPrevented: false,

	/*
	 * @type {?Element}
	 */
	currentTarget: null,

	/*
	 * @type {function}
	 */
	preventDefault: function() {
		var e = this.event;

		this.isDefaultPrevented = true;

		if (e.preventDefault) {
			e.preventDefault();
		} else {
			/* IE下阻止默认事件 */
			e.returnValue = false;
		}
	},

	/*
	 * @type {function}
	 */
	stopPropagation: function() {
		var e = this.event;

		this.isPropagationStopped = true;

		if (e.stopPropagation) {
			e.stopPropagation();
		}
	}
};

/**
 * @private
 */
$._eventCache = {};

/**
 * @private
 */
$._eventType = {

	/**
	 * @const
	 * @type {string}
	 */
	delegated: '|click|mouseover|mouseout|mousemove|focus|blur|focusin|focusout|touchstart|touchmove|touchend|touchcancel' + (('onsubmit' in DOC) ? '|submit' : ''),

	/**
	 * IE使用focusin/focusout替换focus/blur来实现focus和blur的冒泡
	  * @type {Object=}
	 */
	bubblesFix: null,

	/**
	  * @type {Object}
	 */
	bubblesFixTemplate: {
		'focus': 'focusin',
		'blur': 'focusout'
	},

	/**
	 * @const
	 * @type {string}
	 */
	captured: '|focus|blur|'
};

/**
 * 给DOM对象绑定事件
 * @param {string} type
 * @param {Element} element
 * @param {function(Event=)} fn
 * @param {boolean} capture
 */
$.addEvent = DOC.addEventListener ? function(type, element, fn, capture) {
	element.addEventListener(type, fn, capture);
} : function(type, element, fn, capture) {
	element.attachEvent('on' + type, function() {
		fn.apply(element, arguments);
	});
};

/**
 * 生成特定DOM对象的eventCache
 * @param {string} type
 * @param {Number} uid
 * @param {Element} element
 * @param {function($.event=)} fn
 */
$._addEventData = function(type, uid, element, fn) {
	var elemData = $._eventCache[uid] || ($._eventCache[uid] = {}),
		shouldAddEvent = false;

	if (ENABLE_IE_SUPPORT) {
		//IE使用focusin/focusout替换focus/blur来实现focus和blur的冒泡
		if (null === $._eventType.bubblesFix) {
			if ('onfocusin' in DOC) {
				$._eventType.bubblesFix = $._eventType.bubblesFixTemplate;
			} else {
				$._eventType.bubblesFix = {};
			}
		}
		type = $._eventType.bubblesFix[type] || type;
	}

	/*
	 * 在第一次给某个DOM对象添加事件的时候绑定$.dispatchEvent()方法，
	 * 后续添加的方法推入elemData数组在$.dispatchEvent()中调用
	 */
	if (!(type in elemData)) {

		shouldAddEvent = true;

		/* 把需要委托的事件绑定在document上面 */
		if ((-1 < $._eventType.delegated.indexOf(type)) && (element != DOC) && !$.isWindow(element)) {
			element = DOC;
			uid = $.guid(element);
			var docData = $._eventCache[uid] || ($._eventCache[uid] = {});

			if (type in docData) {
				shouldAddEvent = false;
			} else {
				docData[type] = [];
			}
		} 
	}

	if (shouldAddEvent) {
		var capture =  (-1 < $._eventType.captured.indexOf(type));
		$.addEvent(type, element, $.dispatchEvent, capture);
	}

	var elemEventData = elemData[type] || (elemData[type] = []);
	elemEventData.push(fn);
};

$.addTagEvent = function(type, tagName, fn) {
	var uid = 't' + tagName.toUpperCase();
	$._addEventData(type, uid, DOC, fn);
};

/**
 * @param {Event} evt
 * @this {Element}
 */
$.dispatchEvent = function(evt) {
	var element = this,

		/** @type {$.event} */
		e = new $.event(evt),
		type = e.type,
		elCur = $.isWindow(element) ? element : e.target;

	/*
	 * 在触屏浏览器中，只执行在touchend中合成的click事件
	 * 在触屏浏览（合成的时候给event对象添加了自定义的isSimulated属性）
	 */
	if ('click' === type && UseTouchClick && !e.originalEvent.isSimulated) {
		e.preventDefault();
		return;
	}

	while(elCur) {
		var uid = elCur['__ruid'] || '0',
			elemData = $._eventCache[uid] || {},
			elemEventData = elemData[type] || [],
			result = true,
			tagData= $._eventCache['t' + elCur.nodeName] || {},
			tagEventData = tagData[type];

		if (tagEventData) {
			elemEventData = elemEventData.concat(tagEventData);
		}

		for (var i = 0, l = elemEventData.length; i < l; i++) {

			/* 把冒泡过程中当前的DOM对象保存在Event的currentTarget属性中 */
			e.currentTarget = elCur;

			/*
			 * 执行事件方法
			 * 在方法中的this指针默认指向冒泡过程中当前的DOM对象（和currentTarget属性一样）
			 * 可以使用Function的bind方法改变this指针指向的对象
			 */
			var re = elemEventData[i].apply(elCur, [e]);

			/* 有任一方法返回false的话标记result为false */
			if (false === re) {
				result = re;
			}
		}

		/* 如果任一绑定给对象的方法返回false，停止默认事件并终止冒泡 */
		if (false === result) {
			e.preventDefault();
			e.stopPropagation();
		}
		if (true === e.isPropagationStopped) {
			break;
		}
		elCur = elCur.parentNode;
	}
};

/**
 * 给DOM集合绑定事件
 * @function
 * @param {string} type 事件类型
 * @param {function($.event=)} fn 绑定的事件
 * @return {$}
 */
$.prototype.on = function(type, fn) {
	if ('object' === typeof type) {
		for (var key in type) {
			this.on(key, type[key]);
		}
		return this;
	}

	return this.each(function(index, element) {
		var uid = $.guid(element);
		$._addEventData(type, uid, element, fn);
	});
};

/**
 * 触发DOM集合的制定事件
 * @function
 * @param {String} type 事件类型
 * @param {*=} data 传给Event对象的自定义数据，可以在事件传播过程中传递
 * @return {$}
 */
$.prototype.trigger = DOC.createEventObject && ENABLE_IE_SUPPORT ? 
	function(type, data) {
		/*var theEvent = DOC.createEventObject();
		theEvent.data = data;
		theEvent.isSimulated = true;*/

		return this.each(function(index, element) {
			if (type in element) {
				element[type]();
			} else {
				//自定义方法
				//...
			}
		});
	} : 

	function(type, data) {

		var theEvent = DOC.createEvent('MouseEvents');
		theEvent.initEvent(type, true, true);
		theEvent.data = data;
		theEvent.isSimulated = true;

		return this.each(function(index, element) {
			if (type in element) {
				element[type]();
			} else {
				element.dispatchEvent && element.dispatchEvent(theEvent);
			}
		});
	};

/**
 * 实现触屏的点击事件委托
 * 它做的事情：
 * 1. 去掉click事件在移动浏览器中的延迟
 * 2. 实现被点击对象的按压效果
 */
$.touchEvent = {

	/**
	 * @const
	 * @type {string}
	 */
	activeCls: 'active',

	/**
	 * @type {boolean}
	 */
	hasTouchStart: false,

	/**
	 * 在触屏设备上取消DOM的高亮状态之前保留一个延时，使用户可以觉察到状态的改变，
	 * 在桌面浏览器中端不需要这个延时
	 */
	clearHighlightTimeout: IsTouch ? 200 : 0,

	/**
	 * @const
	 * @type {string}
	 */
	initedId: '__RR_EVENT_INITED__',

	init: function() {
		if (!WIN[$.touchEvent.initedId]) {
			var events = {
				onTouchStart: START_EVENT,
				onTouchMove: MOVE_EVENT,
				onTouchEnd: END_EVENT
			},
			type;

			for (type in events) {
				$.addEvent(events[type], DOC, $.touchEvent[type], false);
			}
			$.addEvent('touchcancel', DOC, $.touchEvent.onTouchCancel, false);

			if (UseTouchClick) {
				$.addEvent('click', DOC, $.dispatchEvent, false);
			}
			WIN[$.touchEvent.initedId] = true;
		}
	},

	onTouchStart: function(e) {
		var e = new $.event(e),
			event = e.originalEvent,
			elCur = e.target;

		$.touchEvent.clearHighlight();

		$.touchEvent.hasTouchStart = true;

		/* 保留一个target引用，在touchend中分配点击事件给这个target */
		$.touchEvent.elTarget = elCur;

		/* 事件触发点相对于窗口的坐标 */
		$.touchEvent.startPoint = [event.screenX * ScreenSizeCorrect, event.screenY * ScreenSizeCorrect];

		$.touchEvent.targets = [];
		while(elCur) {
			var uid = $.guid(elCur),
				elemData = $._eventCache[uid] || {},
				elemEventData = elemData['click'];

			/* 为绑定了事件或者特定DOM对象添加高亮样式 */
			if (elemEventData || ['A', 'INPUT', 'BUTTON'].indexOf(elCur.nodeName) > -1) {
				$.touchEvent.targets.push($(elCur).addClass($.touchEvent.activeCls));
			}
			elCur = elCur.parentNode;
		}
	},

	onTouchMove: function(e) {
		var touch = $.touchEvent;

		if (touch.hasTouchStart) {
			var e = new $.event(e),
				event = e.originalEvent,
				movedDistance = Math.pow(Math.pow(event.screenX * ScreenSizeCorrect - touch.startPoint[0], 2)
				                         + Math.pow(event.screenY * ScreenSizeCorrect - touch.startPoint[1], 2), .5);

			if (movedDistance > MAX_TOUCHMOVE_DISTANCE_FOR_CLICK) {
				touch.onTouchCancel();
			}
		}
	},

	onTouchEnd: function() {
		if ($.touchEvent.hasTouchStart) {
			/* 先做清除工作，再触发合成事件 */
			$.touchEvent.onTouchCancel();

			if (UseTouchClick) {
				var theEvent = DOC.createEvent('MouseEvents'),
					target = $.touchEvent.elTarget;

				/* 初始化冒泡的事件 */
				theEvent.initEvent('click', true, true);

				/* 标记事件为合成的模拟事件，在$.dispatchEvent()方法中会检测这个属性来判断是否需要触发click事件 */
				theEvent.isSimulated = true;

				/* 给目标DOM对象触发合成事件
				 * （目标DOM对象是touchstart事件的target对象，touchstart和touchend的target可能不一样，所以在touchstart里面保留了一个引用）
				 */
				target.dispatchEvent(theEvent);
			}
		}
	},

	onTouchCancel: function() {
		$.touchEvent.hasTouchStart = false;
		$.touchEvent.elTarget = null;

		/* 取消DOM的高亮状态之前保留一个延时，使用户可以觉察到状态的改变 */
		setTimeout($.touchEvent.clearHighlight, $.touchEvent.clearHighlightTimeout);
	},

	clearHighlight: function() {
		var targets = $.touchEvent.targets,
			activeCls = $.touchEvent.activeCls;
		if (targets) {
			/* 移除高亮样式 */
			for (var i = 0, l = targets.length; i < l; i++) {
				targets[i].removeClass(activeCls);
			}
			$.touchEvent.targets = null;
		}
	}
}

$.touchEvent.init();

/**
 * 给DOM集合绑定点击事件或者触发点击事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.click = function(fn) {
	return arguments.length > 0 ? this.on('click', fn) : this.trigger('click');
};

/**
 * 给DOM集合绑定mousedown事件或者触发mousedown事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.mousedown = function(fn) {
	return arguments.length > 0 ? this.on('mousedown', fn) : this.trigger('mousedown');
};

/**
 * 给DOM集合绑定mouseup事件或者触发mouseup事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.mouseup = function(fn) {
	return arguments.length > 0 ? this.on('mouseup', fn) : this.trigger('mouseup');
};

/**
 * 给DOM集合绑定mousemove事件或者触发mousemove事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.mousemove = function(fn) {
	return arguments.length > 0 ? this.on('mousemove', fn) : this.trigger('mousemove');
};

/**
 * 给DOM集合绑定mouseover事件或者触发mouseover事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.mouseover = function(fn) {
	return arguments.length > 0 ? this.on('mouseover', fn) : this.trigger('mouseover');
};

/**
 * 给DOM集合绑定mouseout事件或者触发mouseout事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.mouseout = function(fn) {
	return arguments.length > 0 ? this.on('mouseout', fn) : this.trigger('mouseout');
};

/**
 * 给DOM集合绑定失焦事件或者触发失焦事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.blur = function(fn) {
	return arguments.length > 0 ? this.on('blur', fn) : this.trigger('blur');
};

/**
 * 给DOM集合绑定聚焦事件或者触发聚焦事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.focus = function(fn) {
	return arguments.length > 0 ? this.on('focus', fn) : this.trigger('focus');
};

/**
 * 给DOM集合绑定unload事件或者触发unload事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.unload = function(fn) {
	return arguments.length > 0 ? this.on('unload', fn) : this.trigger('unload');
};

/**
 * 给DOM集合绑定change事件或者触发change事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.change = function(fn) {
	return arguments.length > 0 ? this.on('change', fn) : this.trigger('change');
};

/**
 * 给DOM集合绑定select事件或者触发select事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.select = function(fn) {
	var name = 'select';
	return arguments.length > 0 ? this.on(name, fn) : this.trigger(name);
};

/**
 * 给DOM集合绑定submit事件或者触发submit事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.submit = function(fn) {
	return arguments.length > 0 ? this.on('submit', fn) : this.trigger('submit');
};

/**
 * 给DOM集合绑定keydown事件或者触发keydown事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.keydown = function(fn) {
	return arguments.length > 0 ? this.on('keydown', fn) : this.trigger('keydown');
};

/**
 * 给DOM集合绑定keypress事件或者触发keypress事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.keypress = function(fn) {
	return arguments.length > 0 ? this.on('keypress', fn) : this.trigger('keypress');
};

/**
 * 给DOM集合绑定keyup事件或者触发keyup事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.keyup = function(fn) {
	return arguments.length > 0 ? this.on('keyup', fn) : this.trigger('keyup');
};

/**
 * 给DOM集合绑定error事件或者触发error事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.error = function(fn) {
	return arguments.length > 0 ? this.on('error', fn) : this.trigger('error');
};

/**
 * 给DOM集合绑定contextmenu事件或者触发keyup事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.contextmenu = function(fn) {
	return arguments.length > 0 ? this.on('contextmenu', fn) : this.trigger('contextmenu');
};

/**
 * 给DOM集合绑定scroll事件
 * @function
 * @param {Function} fn 绑定的事件
 * @return {$}
 */
$.prototype.scroll = function(fn) {
	return this.on('scroll', fn);
};


