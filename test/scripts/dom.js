test("$(selector).get()", function() {
	deepEqual( toArray($("#qunit-fixture p").get()), q("firstp","ap","sndp","en","sap","first"), "Get All Elements" );

	equal( $("#qunit-fixture p").get(0), document.getElementById("firstp"), "Get A Single Element" );
	strictEqual( $("#firstp").get(1), undefined, "Try get with index larger elements count" );

	equal( $("p").get(-1), document.getElementById("first"), "Get a single element with negative index" );
	strictEqual( $("#firstp").get(-2), undefined, "Try get with index negative index larger then elements count" );
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
