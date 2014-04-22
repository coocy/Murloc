
test("length", function() {
	equal( $("#qunit-fixture p").length, 6, "Get Number of Elements Found" );
});

test("$(selector).get()", function() {
	deepEqual( toArray($("#qunit-fixture p").get()), q("firstp","ap","sndp","en","sap","first"), "Get All Elements" );

	equal( $("#qunit-fixture p").get(0), document.getElementById("firstp"), "Get A Single Element" );
	strictEqual( $("#firstp").get(1), undefined, "Try get with index larger elements count" );

	equal( $("p").get(-1), document.getElementById("first"), "Get a single element with negative index" );
	strictEqual( $("#firstp").get(-2), undefined, "Try get with index negative index larger then elements count" );
});

test("eq()", function() {

	var $divs = $( "div" );

	equal( $divs.eq( -1 ).length, 1, "The number -1 returns a selection that has length 1" );
	equal( $divs.eq( "-1" ).length, 1, "The string '-1' returns a selection that has length 1" );
	deepEqual( $divs.eq( "-1" ), $divs.eq( -1 ), "String and number -1 match" );
});

test("$(selector).first()/last()", function() {
	var $links = $("#ap a"), $none = $("asdf");

	deepEqual( $links.first().get(), q("google"), "first()" );
	deepEqual( $links.last().get(), q("mark"), "last()" );

	deepEqual( $none.first().get(), [], "first() none" );
	deepEqual( $none.last().get(), [], "last() none" );
});

test( "$(selector).attr(String)", function() {
	var extras, body, $body,
		select, optgroup, option, $img, styleElem,
		$button, $form, $a;


		(Sizzle.attr( document.getElementById('form'), 'action' ));

	equal( $("#text1").attr("type"), "text", "Check for type attribute" );
	equal( $("#radio1").attr("type"), "radio", "Check for type attribute" );
	equal( $("#check1").attr("type"), "checkbox", "Check for type attribute" );
	equal( $("#simon1").attr("rel"), "bookmark", "Check for rel attribute" );
	equal( $("#google").attr("title"), "Google!", "Check for title attribute" );
	equal( $("#mark").attr("hreflang"), "en", "Check for hreflang attribute" );
	equal( $("#en").attr("lang"), "en", "Check for lang attribute" );
	equal( $("#simon").attr("class"), "blog link", "Check for class attribute" );
	equal( $("#name").attr("name"), "name", "Check for name attribute" );
	equal( $("#text1").attr("name"), "action", "Check for name attribute" );

	ok( $("#form").attr("action").indexOf("formaction") >= 0, "Check for action attribute" );
	equal( $("#text1").attr("value", "t").attr("value"), "t", "Check setting the value attribute" );
	equal( $("#text1").attr("value", "").attr("value"), "", "Check setting the value attribute to empty string" );
	equal( $("<div value='t'></div>").attr("value"), "t", "Check setting custom attr named 'value' on a div" );
	equal( $("#form").attr("blah", "blah").attr("blah"), "blah", "Set non-existent attribute on a form" );
	equal( $("#foo").attr("height"), undefined, "Non existent height attribute should return undefined" );

	// [7472] & [3113] (form contains an input with name="action" or name="id")
	extras = $("<input id='id' name='id' /><input id='name' name='name' /><input id='target' name='target' />").appendTo("#testForm");
	equal( $("#form").attr("action","newformaction").attr("action"), "newformaction", "Check that action attribute was changed" );
	equal( $("#testForm").attr("target"), undefined, "Retrieving target does not equal the input with name=target" );
	equal( $("#testForm").attr("target", "newTarget").attr("target"), "newTarget", "Set target successfully on a form" );
	//return;
	equal( $("#testForm").removeAttr("id").attr("id"), undefined, "Retrieving id does not equal the input with name=id after id is removed [#7472]" );
	// Bug #3685 (form contains input with name="name")
	equal( $("#testForm").attr("name"), undefined, "Retrieving name does not retrieve input with name=name" );
	extras.remove();


	equal( $("#text1").attr("maxlength"), "30", "Check for maxlength attribute" );
	equal( $("#text1").attr("maxLength"), "30", "Check for maxLength attribute" );
	equal( $("#area1").attr("maxLength"), "30", "Check for maxLength attribute" );

	// using innerHTML in IE causes href attribute to be serialized to the full path
	$("<a/>").attr({
		"id": "tAnchor5",
		"href": "#5"
	}).appendTo("#qunit-fixture");
	equal( $("#tAnchor5").attr("href"), "#5", "Check for non-absolute href (an anchor)" );
	$("<a id='tAnchor6' href='#5' />").appendTo("#qunit-fixture");
	equal( $("#tAnchor5").prop("href"), $("#tAnchor6").prop("href"), "Check for absolute href prop on an anchor" );

	$("<script type='$/test' src='#5' id='scriptSrc'></script>").appendTo("#qunit-fixture");
	equal( $("#tAnchor5").prop("href"), $("#scriptSrc").prop("src"), "Check for absolute src prop on a script" );

	// list attribute is readonly by default in browsers that support it
	$("#list-test").attr( "list", "datalist" );
	equal( $("#list-test").attr("list"), "datalist", "Check setting list attribute" );

	// Related to [5574] and [5683]
	body = document.body;
	$body = $( body );

	strictEqual( $body.attr("foo"), undefined, "Make sure that a non existent attribute returns undefined" );

	body.setAttribute( "foo", "baz" );
	equal( $body.attr("foo"), "baz", "Make sure the dom attribute is retrieved when no expando is found" );

	$body.attr( "foo","cool" );
	equal( $body.attr("foo"), "cool", "Make sure that setting works well when both expando and dom attribute are available" );

	body.removeAttribute("foo"); // Cleanup

	select = document.createElement("select");
	optgroup = document.createElement("optgroup");
	option = document.createElement("option");

	optgroup.appendChild( option );
	select.appendChild( optgroup );

	equal( $( option ).prop("selected"), true, "Make sure that a single option is selected, even when in an optgroup." );

	$img = $("<img style='display:none' width='215' height='53' src='data/1x1.jpg'/>").appendTo("body");
	equal( $img.attr("width"), "215", "Retrieve width attribute an an element with display:none." );
	equal( $img.attr("height"), "53", "Retrieve height attribute an an element with display:none." );

	// Check for style support
	styleElem = $("<div/>").appendTo("#qunit-fixture").css({
		background: "url(UPPERlower.gif)"
	});
	ok( !!~styleElem.attr("style").indexOf("UPPERlower.gif"), "Check style attribute getter" );
	ok( !!~styleElem.attr("style", "position:absolute;").attr("style").indexOf("absolute"), "Check style setter" );

	// Check value on button element (#1954)
	$button = $("<button>text</button>").insertAfter("#button");
	strictEqual( $button.attr("value"), undefined, "Absence of value attribute on a button" );
	equal( $button.attr( "value", "foobar" ).attr("value"), "foobar", "Value attribute on a button does not return innerHTML" );
	equal( $button.attr("value", "baz").html(), "text", "Setting the value attribute does not change innerHTML" );

	// Attributes with a colon on a table element (#1591)
	equal( $("#table").attr("test:attrib"), undefined, "Retrieving a non-existent attribute on a table with a colon does not throw an error." );
	equal( $("#table").attr( "test:attrib", "foobar" ).attr("test:attrib"), "foobar", "Setting an attribute on a table with a colon does not throw an error." );

	$form = $("<form class='something'></form>").appendTo("#qunit-fixture");
	equal( $form.attr("class"), "something", "Retrieve the class attribute on a form." );

	$a = $("<a href='#' onclick='something()'>Click</a>").appendTo("#qunit-fixture");
	equal( $a.attr("onclick"), "something()", "Retrieve ^on attribute without anonymous function wrapper." );

	ok( $("<div/>").attr("doesntexist") === undefined, "Make sure undefined is returned when no attribute is found." );
	ok( $("<div/>").attr("title") === undefined, "Make sure undefined is returned when no attribute is found." );
	equal( $("<div/>").attr( "title", "something" ).attr("title"), "something", "Set the title attribute." );
	//ok( $().attr("doesntexist") === undefined, "Make sure undefined is returned when no element is there." );
	equal( $("<div/>").attr("value"), undefined, "An unset value on a div returns undefined." );
	strictEqual( $("<select><option value='property'></option></select>").attr("value"), undefined, "An unset value on a select returns undefined." );

	$form = $("#form").attr( "enctype", "multipart/form-data" );
	equal( $form.prop("enctype"), "multipart/form-data", "Set the enctype of a form (encoding in IE6/7 #6743)" );

});

test("$(selector).slice()", function() {

	var $links = $("#ap a");

	deepEqual( toArray($links.slice(1,2).get()), q("groups"), "slice(1,2)" );
	deepEqual( toArray($links.slice(1).get()), q("groups", "anchor1", "mark"), "slice(1)" );
	deepEqual( toArray($links.slice(0,3).get()), q("google", "groups", "anchor1"), "slice(0,3)" );
	deepEqual( toArray($links.slice(-1).get()), q("mark"), "slice(-1)" );

	deepEqual( toArray($links.eq(1).get()), q("groups"), "eq(1)" );
	deepEqual( toArray($links.eq("2").get()), q("anchor1"), "eq('2')" );
	deepEqual( toArray($links.eq(-1).get()), q("mark"), "eq(-1)" );
});

test("$(selector).filter(Selector|undefined)", function() {
	deepEqual( $("#form input").filter(":checked").get(), q("radio2", "check1"), "filter(String)" );
	deepEqual( $("p").filter("#ap, #sndp").get(), q("ap", "sndp"), "filter('String, String')" );
	deepEqual( $("p").filter("#ap,#sndp").get(), q("ap", "sndp"), "filter('String,String')" );

	deepEqual( $("p").filter(null).get(),      [], "filter(null) should return an empty $ object");
	deepEqual( $("p").filter(undefined).get(), [], "filter(undefined) should return an empty $ object");
	deepEqual( $("p").filter(0).get(),         [], "filter(0) should return an empty $ object");
	deepEqual( $("p").filter("").get(),        [], "filter('') should return an empty $ object");

});

test("$(selector).closest()", function() {

	var el;

	deepEqual( $("body").closest("body").get(), q("body"), "closest(body)" );
	deepEqual( $("body").closest("html").get(), q("html"), "closest(html)" );

	deepEqual( $("body").closest("div").get(), [], "closest(div)" );
	deepEqual( $("#qunit-fixture").closest("span,#html").get(), q("html"), "closest(span,#html)" );

	// Test .closest() limited by the context
	el = $("#nothiddendivchild");
	deepEqual( el.closest("html", document.body).get(), [], "Context limited." );
	deepEqual( el.closest("body", document.body).get(), [], "Context limited." );
	deepEqual( el.closest("#nothiddendiv", document.body).get(), q("nothiddendiv"), "Context not reached." );

	//Test that .closest() returns unique'd set
	equal( $("#qunit-fixture p").closest("#qunit-fixture").length, 1, "Closest should return a unique set" );

	// Test on disconnected node
	equal( $("<div><p></p></div>").find("p").closest("table").length, 0, "Make sure disconnected closest work." );

	equal( $("<div foo='bar'></div>").closest("[foo]").length, 1, "Disconnected nodes with attribute selector" );
	equal( $("<div>text</div>").closest("[lang]").length, 0, "Disconnected nodes with text and non-existent attribute selector" );

	ok( !$(document).closest("#foo").length, "Calling closest on a document fails silently" );

	//el = $("<div>text</div>");
	//deepEqual( el.contents().closest("*").get(), el.get(), "Text node input (#13332)" );
});

test("$(selector).children()", function() {
	deepEqual( $("#foo").children().get(), q("sndp", "en", "sap"), "Check for children" );
	deepEqual( $("#foo").children("#en, #sap").get(), q("en", "sap"), "Check for multiple filters" );
});

test("$(selector).parent()", function() {

	var $el;

	equal( $("#groups").parent().get(0).id, "ap", "Simple parent check" );
	equal( $("#groups").parent("p").get(0).id, "ap", "Filtered parent check" );
	equal( $("#groups").parent("div").length, 0, "Filtered parent check, no match" );
	equal( $("#groups").parent("div, p").get(0).id, "ap", "Check for multiple filters" );
	deepEqual( $("#en, #sndp").parent().get(), q("foo"), "Check for unique results from parent" );

	//$el = $("<div>text</div>");
	//deepEqual( $el.contents().parent().get(), $el.get(), "Check for parent of text node" );
});

test("$(selector).parents()", function() {
	equal( $("#groups").parents().get(0).id, "ap", "Simple parents check" );
	//deepEqual( $("#nonnodes").contents().eq(1).parents().eq(0).get(), q("nonnodes"), "Text node parents check" );
	equal( $("#groups").parents("p").get(0).id, "ap", "Filtered parents check" );
	equal( $("#groups").parents("div").get(0).id, "qunit-fixture", "Filtered parents check2" );
	deepEqual( $("#groups").parents("p, div").get(), q("ap", "qunit-fixture"), "Check for multiple filters" );
	deepEqual( $("#en, #sndp").parents().get(), q("foo", "qunit-fixture", "dl", "body", "html"), "Check for unique results from parents" );
});

test("is(String|undefined)", function() {
	ok( $("#form").is("form"), "Check for element: A form must be a form" );
	ok( !$("#form").is("div"), "Check for element: A form is not a div" );
	ok( $("#mark").is(".blog"), "Check for class: Expected class 'blog'" );
	ok( !$("#mark").is(".link"), "Check for class: Did not expect class 'link'" );
	ok( $("#simon").is(".blog.link"), "Check for multiple classes: Expected classes 'blog' and 'link'" );
	ok( !$("#simon").is(".blogTest"), "Check for multiple classes: Expected classes 'blog' and 'link', but not 'blogTest'" );
	ok( $("#en").is("[lang=\"en\"]"), "Check for attribute: Expected attribute lang to be 'en'" );
	ok( !$("#en").is("[lang=\"de\"]"), "Check for attribute: Expected attribute lang to be 'en', not 'de'" );
	ok( $("#text1").is("[type=\"text\"]"), "Check for attribute: Expected attribute type to be 'text'" );
	ok( !$("#text1").is("[type=\"radio\"]"), "Check for attribute: Expected attribute type to be 'text', not 'radio'" );
	ok( $("#text2").is(":disabled"), "Check for pseudoclass: Expected to be disabled" );
	ok( !$("#text1").is(":disabled"), "Check for pseudoclass: Expected not disabled" );
	ok( $("#radio2").is(":checked"), "Check for pseudoclass: Expected to be checked" );
	ok( !$("#radio1").is(":checked"), "Check for pseudoclass: Expected not checked" );

	ok( !$("#foo").is(0), "Expected false for an invalid expression - 0" );
	ok( !$("#foo").is(null), "Expected false for an invalid expression - null" );
	ok( !$("#foo").is(""), "Expected false for an invalid expression - \"\"" );
	ok( !$("#foo").is(undefined), "Expected false for an invalid expression - undefined" );
	ok( !$("#foo").is({ plain: "object" }), "Check passing invalid object" );

	// test is() with comma-separated expressions
	ok( $("#en").is("[lang=\"en\"],[lang=\"de\"]"), "Comma-separated; Check for lang attribute: Expect en or de" );
	ok( $("#en").is("[lang=\"de\"],[lang=\"en\"]"), "Comma-separated; Check for lang attribute: Expect en or de" );
	ok( $("#en").is("[lang=\"en\"] , [lang=\"de\"]"), "Comma-separated; Check for lang attribute: Expect en or de" );
	ok( $("#en").is("[lang=\"de\"] , [lang=\"en\"]"), "Comma-separated; Check for lang attribute: Expect en or de" );
});

test( "find(selector)", function() {
	equal( "Yahoo", $("#foo").find(".blogTest").text(), "Check for find" );

	deepEqual( $("#qunit-fixture").find("> div").get(), q( "foo", "nothiddendiv", "moretests", "tabindex-tests", "liveHandlerOrder", "siblingTest", "fx-test-group" ), "find child elements" );
	deepEqual( $("#qunit-fixture").find("> #foo, > #moretests").get(), q( "foo", "moretests" ), "find child elements" );
	deepEqual( $("#qunit-fixture").find("> #foo > p").get(), q( "sndp", "en", "sap" ), "find child elements" );

});

