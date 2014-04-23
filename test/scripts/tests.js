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
 * Asserts that a select matches the given IDs
 * @param {String} a - Assertion name
 * @param {String} b - selector
 * @param {String} c - Array of ids to construct what is expected
 * @example t("Check for something", "//[a]", ["foo", "baar"]);
 * @result returns true if "//[a]" return two elements with the IDs 'foo' and 'baar'
 */
function t( a, b, c ) {
	var f = toArray($(b).get()),
		s = "",
		i = 0;

	for ( ; i < f.length; i++ ) {
		s += ( s && "," ) + '"' + f[ i ].id + '"';
	}

	deepEqual(f, q.apply( q, c ), a + " (" + b + ")");
}


/**
 * @requires ../../src/Murloc.js
 * @requires core.js
 * @requires dom.js
 * @requires dom.attributes.js
 * @requires dom.class_name.js
 * @requires dom.nodes.js
 * @requires dom.data.js
 */