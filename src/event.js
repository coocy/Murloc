/**
 * Event
 */

RR.eventCache = {};
/* 
RR.eventCache = {
	'event_1': {
		'uid_1': {
			fn1: 1,
			fn2: 1,
			...
		},
		'uid_2': {
			fn1: 1,
			fn2: 1,
			...
		},
		
	},
	'event_2': {
		'uid_1': {
			fn1: 1,
			fn2: 1,
			...
		},
		...
	},
	...
};
*/

RR.fn.prototype.on = function(type, fn) {
	return this;
};

