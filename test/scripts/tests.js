q = function() {
	var r = [],
		i = 0;

	for (; i < arguments.length; i++ ) {
		r.push(document.getElementById(arguments[i]));
	}
	return r;
};
toArray = function(elements) {
	var result, 
		element,
		i = 0;

	try {
		result = [].slice.call(elements);
	} catch (e) {
		result = [];
		while (element = elements[i++]) {
			result.push(element);
		}
	}
	return result;
};

/**
 * @requires ../../src/Murloc.js
 * @requires core.js
 * @requires dom.js
 * @rrequires dom.nodes.js
 * @requires dom.data.js
 */