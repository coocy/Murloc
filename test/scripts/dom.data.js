// attempting to access the data of an undefined $ element should be undefined
test("$().data() === undefined", 2, function() {
	strictEqual($().data(), undefined);
	strictEqual($().data("key"), undefined);
});

test("$(selector).data()", function() {

	var div, dataObj, nodiv, obj;

	div = $("#foo");
	strictEqual( div.data("foo"), undefined, "Make sure that missing result is undefined" );
	div.data("test", "success");

	dataObj = div.data();

	deepEqual( dataObj, {test: "success"}, "data() returns entire data object with expected properties" );
	strictEqual( div.data("foo"), undefined, "Make sure that missing result is still undefined" );

	nodiv = $("#unfound");
	equal( nodiv.data(), null, "data() on empty set returns null" );

});

function testDataTypes( $obj ) {
	$.each({
		"null": null,
		"true": true,
		"false": false,
		"zero": 0,
		"one": 1,
		"empty string": "",
		"empty array": [],
		"array": [1],
		"empty object": {},
		"object": { foo: "bar" },
		"date": new Date(),
		"regex": /test/,
		"function": function() {}
	}, function( type, value ) {
		strictEqual( $obj.data( "test", value ).data("test"), value, "Data set to " + type );
	});
}

test("$(Element).data(String, Object).data(String)", function() {
	var parent = $("<div><div></div></div>"),
		div = parent.children();

	strictEqual( div.data("test"), undefined, "No data exists initially" );
	strictEqual( div.data("test", "success").data("test"), "success", "Data added" );
	strictEqual( div.data("test", "overwritten").data("test"), "overwritten", "Data overwritten" );
	strictEqual( div.data("test", undefined).data("test"), "overwritten", ".data(key,undefined) does nothing but is chainable");
	strictEqual( div.data("notexist"), undefined, "No data exists for unset key" );
	testDataTypes( div );

	parent.remove();
});

test(".data(object) does not retain references.", function() {

	var $divs = $("<div></div><div></div>");

	$divs.data({ "type": "foo" });
	$divs.eq( 0 ).data( "type", "bar" );

	equal( $divs.eq( 0 ).data("type"), "bar", "Correct updated value" );
	equal( $divs.eq( 1 ).data("type"), "foo", "Original value retained" );
	return;
});

test(".data(Object)", function() {

	var obj, jqobj,
		div = $("<div/>");

	div.data({ "test": "in", "test2": "in2" });
	equal( div.data("test"), "in", "Verify setting an object in data" );
	equal( div.data("test2"), "in2", "Verify setting an object in data" );

	div.remove();
});


test(".removeData()", function() {

	var div = $("#foo");
	div.data("test", "testing");
	div.removeData("test");
	equal( div.data("test"), undefined, "Check removal of data" );

	div.data("test", "testing");
	div.data("test.foo", "testing2");
	div.removeData("test.bar");
	equal( div.data("test.foo"), "testing2", "Make sure data is intact" );
	equal( div.data("test"), "testing", "Make sure data is intact" );

	div.removeData("test");
	equal( div.data("test.foo"), "testing2", "Make sure data is intact" );
	equal( div.data("test"), undefined, "Make sure data is intact" );

	div.removeData("test.foo");
	equal( div.data("test.foo"), undefined, "Make sure data is intact" );
});

test(".data supports interoperable removal of properties SET TWICE ", function() {
	var div = $("<div>").appendTo("#qunit-fixture"),
		datas = {
			"non-empty": "a string",
			"empty-string": "",
			"one-value": 1,
			"zero-value": 0,
			"an-array": [],
			"an-object": {},
			"bool-true": true,
			"bool-false": false,
			// JSHint enforces double quotes,
			// but JSON strings need double quotes to parse
			// so we need escaped double quotes here
			"some-json": "{ \"foo\": \"bar\" }"
		};

	$.each( datas, function( key, val ) {
		div.data( key, val );
		div.data( key, val );

		div.removeData( key );

		equal( div.data( key ), undefined, "removal: " + key );
	});
});

