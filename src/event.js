/**
 * Event
 */

 /* 
RR.eventCache = {
	'event_1': {
		'uid_1': [
			fn1: 1,
			fn2: 1,
			...
		[,
		'uid_2': [
			fn1: 1,
			fn2: 1,
			...
		[,
		
	},
	'event_2': {
		'uid_1':[
			fn1: 1,
			fn2: 1,
			...
		[,
		...
	},
	...
};
*/

RR.event = function(e) {
	/*if (e instanceof RR.event) {
		return e;
	}*/
	this.originalEvent = e;
	this.target = e.target || e.srcElement;
	this.type = e.type;
	return this;
};

RR.event.prototype = {

	isDefaultPrevented: false,
	isPropagationStopped: false,
	
	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = true;

		if (e.preventDefault) {
			e.preventDefault();
		} else {
			//IE下阻止默认事件
			e.returnValue = false;
		}
	},
	
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = true;

		if (e.stopPropagation) {
			e.stopPropagation();
		}
	}
};

RR.eventCache = {};

RR.eventType = {
	delegated: '|click|mouseover|mouseout|mousemove|focus|blur|touchstart|touchmove|touchend|',
	captured: '|focus|blur|'
};

RR.addEvent = DOC.addEventListener ? function(type, element, fn, capture) {
	element.addEventListener(type, fn, capture);
} : function(type, element, fn, capture) {
	element.attachEvent('on' + type, fn);
};

RR.dispatchEvent = function(e) {
	var element = this,
		e = new RR.event(e),
		type = e.type,
		elCur = e.target;
		
		while(elCur) {
			var uid = RR.fn.uid(elCur),
			eventData = RR.eventCache[type],
			elemData = eventData && eventData[uid],
			result = true;

			if (elemData) {
				for (var i = 0, l = elemData.length; i < l; i++) {
					result = elemData[i].apply(elCur, [e]);
				}
			}
			
			//如果绑定给对象的方法返回false，停止默认事件并终止冒泡
			if (false === result) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
			if (true === e.isPropagationStopped) {
				break;
			}
			elCur = elCur.parentNode;
		}
		
};

RR.fn.prototype.on = function(type, fn) {
	this.each(function(element) {
		var uid = RR.fn.uid(element);
		
		var eventData = RR.eventCache[type] || (RR.eventCache[type] = {}),
			elemData = eventData[uid] || (eventData[uid] = []),
			capture = (-1 !== RR.eventType.captured.indexOf(type));
			
		//在第一次给某个DOM对象添加事件的时候绑定RR._dispatchEvent事件，
		//后续添加的事件推入elemData数组在RR._dispatchEvent中调用
		if (elemData.length < 1) {
			//把需要委托的事件绑定在document上面
			if (-1 !== RR.eventType.delegated.indexOf(type)) {
				element = DOC;
			}
			RR.addEvent(type, element, RR.dispatchEvent, capture);
		}
		elemData.push(fn);
	});
	return this;
};

RR.fn.prototype.trigger = function(type, data) {
	
};
