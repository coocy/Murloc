q = function() {
	var r = [],
		i = 0;

	for (; i < arguments.length; i++ ) {
		r.push(document.getElementById(arguments[i]));
	}
	return r;
};
toArray = function(obj) {
	return [].slice.call(obj);
};

/**
 * @requires ../../src/Murloc.js
 * @requires core.js
 * @requires dom.js
 * @rrequires dom.nodes.js
 * @requires dom.data.js
 */