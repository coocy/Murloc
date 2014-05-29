
test("Basic requirements", function() {
	ok( Array.prototype.push, "Array.push()" );
	ok( Array.prototype.concat, "Array.concat()" );
	ok( Array.prototype.slice, "Array.slice()" );
	ok( Array.prototype.indexOf, "Array.indexOf()" );
	ok( String.prototype.trim, "String.trim()" );
	ok( String.prototype.indexOf, "String.indexOf()" );
	ok( Function.prototype.bind, "Function.bind()" );
	ok( Function.prototype.apply, "Function.apply()" );
	ok( document.getElementById, "getElementById" );
	ok( document.getElementsByTagName, "getElementsByTagName" );
	ok( $, "$" );
});

test("String.trim()", function() {

	var nbsp = String.fromCharCode(160);

	equal( "hello  \
	     ".trim(), "hello", "trailing return space" );
	equal( "hello  ".trim(), "hello", "trailing space" );
	equal( "  hello".trim(), "hello", "leading space" );
	equal( "  hello   ".trim(), "hello", "space on both sides" );
	equal( ("  " + nbsp + "hello  " + nbsp + " ").trim(), "hello", "&nbsp;" );
	equal( " ".trim(), "", "space should be trimmed" );
	equal( "ipad\xA0".trim(), "ipad", "nbsp should be trimmed" );
	//equal( "\uFEFF".trim(), "", "zwsp should be trimmed" );
	//equal( "\uFEFF \xA0! | \uFEFF".trim(), "! |", "leading/trailing should be trimmed" );
});

test("$(selector, context)", function() {
	deepEqual( toArray($("#qunit-fixture").get()), q("qunit-fixture"), "ID selector" );
	deepEqual( toArray($(".blog").get()), q("mark", "simon"), "class selector" );
	deepEqual( toArray($("div p", "#qunit-fixture").get()), q("sndp", "en", "sap"), "Basic selector with string as context" );
	deepEqual( toArray($("div p", q("qunit-fixture")[0]).get()), q("sndp", "en", "sap"), "Basic selector with element as context" );
	deepEqual( toArray($("div p", $("#qunit-fixture")).get()), q("sndp", "en", "sap"), "Basic selector with RR.dom object as context" );
	deepEqual( toArray($("div p", $("#element-not-exists")).get()), q(), "Basic selector with blank RR.dom object object as context" );
	deepEqual( toArray($(".blog", $("p")).get()), q("mark", "simon"), "Finding elements with a context." );
});

asyncTest("$.isPlainObject()", function() {
	var pass, iframe, doc,
		fn = function() {};

	// The use case that we want to match
	ok( $.isPlainObject({}), "{}" );


	// Not objects shouldn't be matched
	ok( !$.isPlainObject(""), "string" );
	ok( !$.isPlainObject(0) && !$.isPlainObject(1), "number" );
	ok( !$.isPlainObject(true) && !$.isPlainObject(false), "boolean" );
	ok( !$.isPlainObject(null), "null" );
	ok( !$.isPlainObject(undefined), "undefined" );

	// Arrays shouldn't be matched
	ok( !$.isPlainObject([]), "array" );

	// Instantiated objects shouldn't be matched
	ok( !$.isPlainObject(new Date()), "new Date" );

	// Functions shouldn't be matched
	ok( !$.isPlainObject(fn), "fn" );

	// Again, instantiated objects shouldn't be matched
	ok( !$.isPlainObject(new fn()), "new fn (no methods)" );

	// Makes the function a little more realistic
	// (and harder to detect, incidentally)
	fn.prototype["someMethod"] = function(){};

	var _fn = new fn();

	// Again, instantiated objects shouldn't be matched
	ok( !$.isPlainObject(new fn()), "new fn" );

	// DOM Element
	//console.log('DOM ', $.isPlainObject( document.createElement("div") ));
	ok( !$.isPlainObject( document.createElement("div") ), "DOM Element" );

	// Window
	ok( !$.isPlainObject( window ), "window" );

	pass = false;
	try {
		$.isPlainObject( window.location );
		pass = true;
	} catch ( e ) {}
	ok( pass, "Does not throw exceptions on host objects" );

	// Objects from other windows should be matched
	window.iframeDone = function( otherObject, detail ) {
		window.iframeDone = undefined;
		iframe && iframe.parentNode.removeChild( iframe );



		ok( $.isPlainObject(new otherObject()), "new otherObject" + ( detail ? " - " + detail : "" ) );
		start();
	};

	try {
		iframe = $("#qunit-fixture").get(0).appendChild( document.createElement("iframe") );

		doc = iframe.contentDocument || iframe.contentWindow.document;
		doc.open();
		doc.write("<body onload='window.parent.iframeDone(Object);'>");
		doc.close();
	} catch(e) {
		window.iframeDone( Object, "iframes not supported" );
	}
});


/*
test("$('html')", function() {

	var s, div, j;

	window["foo"] = false;
	s = $("<script>window.foo='test';</script>").get(0);
	ok( s, "Creating a script" );
	ok( !window["foo"], "Make sure the script wasn't executed prematurely" );
	$("body").append("<script>window.foo='test';</script>");
	ok( window["foo"], "Executing a scripts contents in the right context" );

	// Test multi-line HTML
	div = $("<div>\r\nsome text\n<p>some p</p>\nmore text\r\n</div>").get(0);
	equal( div.nodeName.toUpperCase(), "DIV", "Make sure we're getting a div." );
	equal( div.firstChild.nodeType, 3, "Text node." );
	equal( div.lastChild.nodeType, 3, "Text node." );
	equal( div.childNodes[1].nodeType, 1, "Paragraph." );
	equal( div.childNodes[1].firstChild.nodeType, 3, "Paragraph text." );

	ok( $("<link rel='stylesheet'/>").get(0), "Creating a link" );

	ok( !$("<script/>").get(0).parentNode, "Create a script" );

	ok( $("<input/>").attr("type", "hidden"), "Create an input and set the type." );

	j = $("<span>hi</span> there <!-- mon ami -->");
	ok( j.length >= 2, "Check node,textnode,comment creation (some browsers delete comments)" );

	ok( !$("<option>test</option>").get(0).selected, "Make sure that options are auto-selected #2050" );

	ok( $("<div></div>").get(0), "Create a div with closing tag." );
	ok( $("<table></table>").get(0), "Create a table with closing tag." );

	equal( $( "\\<div\\>" ).length, 0, "Ignore escaped html characters" );
});
*/
test("$('massive html')", function() {

	var i,
		li = "<li>very very very very large html string</li>",
		html = ["<ul>"];

	for ( i = 0; i < 30000; i += 1 ) {
		html[html.length] = li;
	}
	html[html.length] = "</ul>";
	html = $(html.join("")).get(0);
	equal( html.nodeName.toLowerCase(), "ul");
	equal( html.firstChild.nodeName.toLowerCase(), "li");
	equal( html.childNodes.length, 30000 );
});

test("$(selector).length", function() {
	equal( $("#qunit-fixture p").length, 6, "Get Number of Elements Found" );
});

test("$(selector).each(Function)", function() {
	var div, pass, i;

	div = $("div");
	div.each(function(){this.foo = "zoo";});
	pass = true;
	for ( i = 0; i < div.length; i++ ) {
		if ( div.get(i).foo !== "zoo" ) {
			pass = false;
		}
	}
	ok( pass, "Execute a function, Relative" );
});

