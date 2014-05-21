
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
	$(document).on("ready", makeHandler("c"));

	// Do it twice, just to be sure.
	$.ready(makeHandler("d"));
	$(document).ready(makeHandler("e"));
	$(document).on("ready", makeHandler("f"));

	noEarlyExecution = order.length === 0;

	// This assumes that QUnit tests are run on DOM ready!
	test("$.ready()", function() {

		ok(noEarlyExecution, "Handlers bound to DOM ready should not execute before DOM ready");

		// Ensure execution order.
		deepEqual(order, ["a", "b", "c", "d", "e", "f"], "Bound DOM ready handlers should execute in on-order, but those bound with $(document).on( 'ready', fn ) will always execute last");

		order = [];

		$.ready(makeHandler("g"));
		equal(order.pop(), "g", "Event handler should execute immediately");

		$(document).ready(makeHandler("h"));
		equal(order.pop(), "h", "Event handler should execute immediately");

	});

})();
