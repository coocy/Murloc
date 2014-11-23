
(function(){
	var noEarlyExecution,
		order = [],
		args = {};

	// Create an event handler.
	function makeHandler( testId ) {
		// When returned function is executed, push testId onto `order` array
		// to ensure execution order. Also, store event handler arg to ensure
		// the correct arg is being passed into the event handler.
		return function( arg ) {
			order.push(testId);
			args[testId] = arg;
		};
	}

	// Bind to the ready event in every possible way.
	$.ready(makeHandler("a"));
	$(document).ready(makeHandler("b"));

	// Do it twice, just to be sure.
	$.ready(makeHandler("c"));
	$(document).ready(makeHandler("d"));

	noEarlyExecution = order.length === 0;

	// This assumes that QUnit tests are run on DOM ready!
	test("$.ready()", function() {

		ok(noEarlyExecution, "Handlers bound to DOM ready should not execute before DOM ready");

		// Ensure execution order.
		deepEqual(order, ["a", "b", "c", "d"], "Bound DOM ready handlers should execute in on-order, but those bound with $(document).on( 'ready', fn ) will always execute last");

		order = [];

		$.ready(makeHandler("e"));
		equal(order.pop(), "e", "Event handler should execute immediately");

		$(document).ready(makeHandler("f"));
		equal(order.pop(), "f", "Event handler should execute immediately");

		$(makeHandler("g"));
		equal(order.pop(), "g", "Event handler should execute immediately");

	});

})();
