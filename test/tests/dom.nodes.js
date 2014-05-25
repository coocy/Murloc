
var manipulationBareObj = function( value ) {
	return value;
};

test( "$(selector).remove()", function() {

	var first = $("#ap").children().first();

	first.data("foo", "bar");

	$("#ap").children().remove();
	ok( $("#ap").text().length > 10, "Check text is not removed" );
	equal( $("#ap").children().length, 0, "Check remove" );

	equal( first.data("foo"), null, "first data" );

	var count, first, cleanUp;

	count = 0;
	first = $("#ap").children().first();
	cleanUp = first.on( "click", function() {
		count++;
	}).remove().appendTo("#qunit-fixture").trigger("click");

	strictEqual( 0, count, "Event handler has been removed" );

	// Clean up detached data
	cleanUp.remove();

	var fragment = document.createDocumentFragment(),
		div = fragment.appendChild( document.createElement("div") );

	$( div ).remove();

	equal( fragment.childNodes.length, 0, "div element was removed from documentFragment" );
});


test("empty()", function() {

	equal( $("#ap").children().empty().text().length, 0, "Check text is removed" );
	equal( $("#ap").children().length, 4, "Check elements are not removed" );

	// using contents will get comments regular, text, and comment nodes
	var j = $("#nonnodes").contents();
	j.empty();
	equal( j.html(), "", "Check node,textnode,comment empty works" );
});


test( "$(selector).clone()", function() {

	var div, clone, form, body;

	equal( $("#en").text(), "This is a normal link: Yahoo", "Assert text for #en" );
	equal( $("#first").append( $("#yahoo").clone() ).text(), "Try them out:Yahoo", "Check for clone" );
	equal( $("#en").text(), "This is a normal link: Yahoo", "Reassert text for #en" );

	$.each( "div button ul ol li select option textarea iframe".split(" "), function( i, nodeName ) {
		var node = $( "<" + nodeName + "/>" ).clone().get(0) || {};
		equal( (node.nodeName + '').toLowerCase(), nodeName, "Clone a " + nodeName );
	});
	equal( $("<input type='checkbox' />").clone().get(0).nodeName.toLowerCase(), "input", "Clone a <input type='checkbox' />" );

	// Check cloning non-elements
	equal( $("#nonnodes").contents().clone().length, 3, "Check node,textnode,comment clone works (some browsers delete comments on clone)" );

	// Verify that clones of clones can keep event listeners
	div = $("<div><ul><li>test</li></ul></div>").on( "click", function() {
		ok( true, "Bound event still exists." );
	});
	clone = div.clone( true ); div.remove();
	div = clone.clone( true ); clone.remove();

	equal( div.length, 1, "One element cloned" );
	equal( div.get(0).nodeName.toUpperCase(), "DIV", "DIV element cloned" );
	div.trigger("click");

	// Manually clean up detached elements
	div.remove();

	// Verify that cloned children can keep event listeners
	div = $("<div/>").append([ document.createElement("table"), document.createElement("table") ]);
	div.find("table").on( "click", function() {
		ok( true, "Bound event still exists." );
	});

	clone = div.clone( true );
	equal( clone.length, 1, "One element cloned" );
	equal( clone.get(0).nodeName.toUpperCase(), "DIV", "DIV element cloned" );
	clone.find("table").trigger("click");

	// Manually clean up detached elements
	div.remove();
	clone.remove();

	// Make sure that doing .clone() doesn't clone event listeners
	div = $("<div><ul><li>test</li></ul></div>").on( "click", function() {
		ok( false, "Bound event still exists after .clone()." );
	});
	clone = div.clone();

	clone.trigger("click");

	// Manually clean up detached elements
	clone.remove();
	div.remove();

	// Test both html() and clone() for <embed> and <object> types
	div = $("<div/>").html("<embed height='355' width='425' src='http://www.youtube.com/v/3KANI2dpXLw&amp;hl=en'></embed>");

	clone = div.clone( true );
	equal( clone.length, 1, "One element cloned" );
	equal( clone.html(), div.html(), "Element contents cloned" );
	equal( clone.get(0).nodeName.toUpperCase(), "DIV", "DIV element cloned" );

	// this is technically an invalid object, but because of the special
	// classid instantiation it is the only kind that IE has trouble with,
	// so let's test with it too.
	div = $("<div/>").html("<object height='355' width='425' classid='clsid:D27CDB6E-AE6D-11cf-96B8-444553540000'>  <param name='movie' value='http://www.youtube.com/v/3KANI2dpXLw&amp;hl=en'>  <param name='wmode' value='transparent'> </object>");

	clone = div.clone( true );
	equal( clone.length, 1, "One element cloned" );
	equal( clone.get(0).nodeName.toUpperCase(), "DIV", "DIV element cloned" );
	div = div.find("object");
	clone = clone.find("object");
	// oldIE adds extra attributes and <param> elements, so just test for existence of the defined set
	$.each( [ "height", "width", "classid" ], function( i, attr ) {
		equal( clone.attr( attr ), div.attr( attr ), "<object> attribute cloned: " + attr );
	} );
	(function() {
		var params = {};

		clone.find("param").each(function( index, param ) {
			params[ param.attributes.name.nodeValue.toLowerCase() ] =
				param.attributes.value.nodeValue.toLowerCase();
		});

		div.find("param").each(function( index, param ) {
			var key = param.attributes.name.nodeValue.toLowerCase();
			equal( params[ key ], param.attributes.value.nodeValue.toLowerCase(), "<param> cloned: " + key );
		});
	})();

	// and here's a valid one.
	div = $("<div/>").html("<object height='355' width='425' type='application/x-shockwave-flash' data='http://www.youtube.com/v/3KANI2dpXLw&amp;hl=en'>  <param name='movie' value='http://www.youtube.com/v/3KANI2dpXLw&amp;hl=en'>  <param name='wmode' value='transparent'> </object>");

	clone = div.clone(true);
	equal( clone.length, 1, "One element cloned" );
	equal( clone.html(), div.html(), "Element contents cloned" );
	equal( clone.get(0).nodeName.toUpperCase(), "DIV", "DIV element cloned" );

	div = $("<div/>").data({ "a": true });
	clone = div.clone( true );
	equal( clone.data("a"), true, "Data cloned." );
	clone.data( "a", false );
	equal( clone.data("a"), false, "Ensure cloned element data object was correctly modified" );
	equal( div.data("a"), true, "Ensure cloned element data object is copied, not referenced" );

	// manually clean up detached elements
	div.remove();
	clone.remove();

	form = document.createElement("form");
	form.action = "/test/";

	div = document.createElement("div");
	div.appendChild( document.createTextNode("test") );
	form.appendChild( div );

	equal( $(form).clone().children().length, 1, "Make sure we just get the form back." );

	body = $("body").clone();
	equal( body.children().get(0).id, "qunit", "Make sure cloning body works" );
	body.remove();
});

var testAppendForObject = function( valueObj, isFragment ) {
	var $base,
		type = isFragment ? " (DocumentFragment)" : " (Element)",
		text = "This link has class=\"blog\": Simon Willison's Weblog",
		el = document.getElementById("sap").cloneNode( true ),
		first = document.getElementById("first"),
		yahoo = document.getElementById("yahoo");

	if ( isFragment ) {
		$base = document.createDocumentFragment();
		$( el ).contents().each(function() {
			$base.appendChild( this );
		});
		$base = $( $base );
	} else {
		$base = $( el );
	}

	equal( $base.clone().append( valueObj(first.cloneNode(true)) ).text(),
		text + "Try them out:",
		"Check for appending of element" + type
	);

	equal( $base.clone().append( valueObj([ first.cloneNode(true), yahoo.cloneNode(true) ]) ).text(),
		text + "Try them out:Yahoo",
		"Check for appending of array of elements" + type
	);

	equal( $base.clone().append( valueObj($("#yahoo, #first").clone()) ).text(),
		text + "YahooTry them out:",
		"Check for appending of $ object" + type
	);

	equal( $base.clone().append( valueObj( 5 ) ).text(),
		text + "5",
		"Check for appending a number" + type
	);

	equal( $base.clone().append( valueObj([ $("#first").clone(), $("#yahoo, #google").clone() ]) ).text(),
		text + "Try them out:GoogleYahoo",
		"Check for appending of array of $ objects"
	);


	equal( $base.clone().append( valueObj(" text with spaces ") ).text(),
		text + " text with spaces ",
		"Check for appending text with spaces" + type
	);

	equal( $base.clone().append( valueObj([]) ).text(),
		text,
		"Check for appending an empty array" + type
	);

	equal( $base.clone().append( valueObj("") ).text(),
		text,
		"Check for appending an empty string" + type
	);

	equal( $base.clone().append( valueObj(document.getElementsByTagName("foo")) ).text(),
		text,
		"Check for appending an empty nodelist" + type
	);

	equal( $base.clone().append( "<span></span>", "<span></span>", "<span></span>" ).children().length,
		$base.children().length + 3,
		"Make sure that multiple arguments works." + type
	);

	equal( $base.clone().append( valueObj(document.getElementById("form").cloneNode(true)) ).children("form").length,
		1,
		"Check for appending a form" + type
	);
};

var testAppend = function( valueObj ) {


	testAppendForObject( valueObj, false );
	testAppendForObject( valueObj, true );

	var defaultText, result, message, iframe, iframeDoc, j, d,
		$input, $radioChecked, $radioUnchecked, $radioParent, $map, $table;

	defaultText = "Try them out:";
	result = $("#first").append( valueObj("<b>buga</b>") );

	equal( result.text(), defaultText + "buga", "Check if text appending works" );
	equal( $("#select3").append( valueObj("<option value='appendTest'>Append Test</option>") ).children().last().attr("value"), "appendTest", "Appending html options to select element" );

	$("form").append( valueObj("<input name='radiotest' type='radio' checked='checked' />") );
	$("form input[name=radiotest]").each(function() {
		ok( $(this).is(":checked"), "Append checked radio" );
	}).remove();

	$("form").append( valueObj("<input name='radiotest2' type='radio' checked    =   'checked' />") );
	$("form input[name=radiotest2]").each(function() {
		ok( $(this).is(":checked"), "Append alternately formated checked radio" );
	}).remove();

	$("form").append( valueObj("<input name='radiotest3' type='radio' checked />") );
	$("form input[name=radiotest3]").each(function() {
		ok( $(this).is(":checked"), "Append HTML5-formated checked radio" );
	}).remove();

	$("form").append( valueObj("<input type='radio' checked='checked' name='radiotest4' />") );
	$("form input[name=radiotest4]").each(function() {
		ok( $(this).is(":checked"), "Append with name attribute after checked attribute" );
	}).remove();

	message = "Test for appending a DOM node to the contents of an iframe";
	iframe = $("#iframe").get(0);
	iframeDoc = iframe.contentDocument || iframe.contentWindow && iframe.contentWindow.document;

	try {
		if ( iframeDoc && iframeDoc.body ) {
			equal( $(iframeDoc.body).append( valueObj("<div id='success'>test</div>") ).get(0).lastChild.id, "success", message );
		} else {
			ok( true, message + " - can't test" );
		}
	} catch( e ) {
		strictEqual( e.message || e, undefined, message );
	}

	$("<fieldset/>").appendTo("#form").append( valueObj("<legend id='legend'>test</legend>") );
	t( "Append legend", "#legend", [ "legend" ] );

	$map = $("<map/>").append( valueObj("<area id='map01' shape='rect' coords='50,50,150,150' href='http://www.$.com/' alt='$'>") );

	equal( $map.get(0).childNodes.length, 1, "The area was inserted." );
	equal( $map.get(0).firstChild.nodeName.toLowerCase(), "area", "The area was inserted." );

	$("#select1").append( valueObj("<OPTION>Test</OPTION>") );
	equal( $("#select1 option:last-child").text(), "Test", "Appending OPTION (all caps)" );

	$("#select1").append( valueObj("<optgroup label='optgroup'><option>optgroup</option></optgroup>") );
	equal( $("#select1 optgroup").attr("label"), "optgroup", "Label attribute in newly inserted optgroup is correct" );
	equal( $("#select1 option:last-child").text(), "optgroup", "Appending optgroup" );

	$table = $("#table");

	/*$.each( "thead tbody tfoot colgroup caption tr th td".split(" "), function( i, name ) {
		$table.append( valueObj( "<" + name + "/>" ) );
		equal( $table.find( name ).length, 1, "Append " + name );
		ok( $( "<" + name + "/>" ).length, name + " wrapped correctly" );
	});*/

	/*$("#table colgroup").append( valueObj("<col/>") );
	equal( $("#table colgroup col").length, 1, "Append col" );*/

	$("#form")
		.append( valueObj("<select id='appendSelect1'></select>") )
		.append( valueObj("<select id='appendSelect2'><option>Test</option></select>") );
	t( "Append Select", "#appendSelect1, #appendSelect2", [ "appendSelect1", "appendSelect2" ] );

	equal( "Two nodes", $("<div />").append( "Two", " nodes" ).text(), "Appending two text nodes" );
	equal( $("<div />").append( "1", "", 3 ).text(), "13", "If median is false-like value, subsequent arguments should not be ignored" );

	// using contents will get comments regular, text, and comment nodes
	j = $("#nonnodes").contents();
	d = $("<div/>").appendTo("#nonnodes").append( j );

	equal( $("#nonnodes").length, 1, "Check node,textnode,comment append moved leaving just the div" );
	equal( d.contents().length, 3, "Check node,textnode,comment append works" );
	d.contents().appendTo("#nonnodes");
	d.remove();
	equal( $("#nonnodes").contents().length, 3, "Check node,textnode,comment append cleanup worked" );

	$input = $("<input type='checkbox'/>").prop( "checked", true ).appendTo("#testForm");
	equal( $input.get(0).checked, true, "A checked checkbox that is appended stays checked" );

	$radioChecked = $("input[name='R1']").eq( 1 );
	$radioParent = $radioChecked.parent();
	$radioUnchecked = $("<input type='radio' name='R1' checked='checked'/>").appendTo( $radioParent );
	$radioChecked.trigger("click");
	$radioUnchecked.get(0).checked = false;
	$radioParent.wrap("<div></div>");
	equal( $radioChecked.get(0).checked, true, "Reappending radios uphold which radio is checked" );
	equal( $radioUnchecked.get(0).checked, false, "Reappending radios uphold not being checked" );

	equal( $("<div/>").append( valueObj("option<area/>") ).get(0).childNodes.length, 2, "HTML-string with leading text should be processed correctly" );
};

test( "$(selector).append(String|Element|Array.<(Element|$)>|$)", function() {
	testAppend( manipulationBareObj );
});

test( "$(selector).append(param) to object", function() {
	var object = $( document.createElement("object") ).appendTo( document.body );

	equal( object.children().length, 0, "object does not start with children" );

	object.append( $("<param type='wmode' name='foo'>") );
	equal( object.children().length, 1, "appended param" );
	equal( object.children().eq(0).attr("name"), "foo", "param has name=foo" );

	object = $("<object><param type='baz' name='bar'></object>");
	equal( object.children().length, 1, "object created with child param" );
	equal( object.children().eq(0).attr("name"), "bar", "param has name=bar" );
});

test( "append HTML5 sectioning elements", function() {
	var article, aside;

	$("#qunit-fixture").append("<article style='font-size:10px'><section><aside>HTML5 elements</aside></section></article>");

	article = $("article"),
	aside = $("aside");

	equal( article.get( 0 ).style.fontSize, "10px", "HTML5 elements are styleable" );
	equal( aside.length, 1, "HTML5 elements do not collapse their children" );
});

test( "$(selector).appendTo(selector)", function() {

	var l, defaultText;

	defaultText = "Try them out:";
	$("<b>buga</b>").appendTo("#first");
	equal( $("#first").text(), defaultText + "buga", "Check if text appending works" );
	equal( $("<option value='appendTest'>Append Test</option>")
		.appendTo("#select3").parent().find("option").last()
		.attr("value"), "appendTest", "Appending html options to select element" );

	l = $("#first").children().length + 2;

	$($("<strong>test</strong>").get(0)).appendTo("#first");
	$($("<strong>test</strong>").get(0)).appendTo("#first");

	equal( $("#first").children().length, l, "Make sure the elements were inserted." );
	equal( $("#first").children().last().get(0).nodeName.toLowerCase(), "strong", "Verify the last element." );

});

test( "appendTo(Element|Array<Element>)", function() {

	var expected = "This link has class=\"blog\": Simon Willison's WeblogTry them out:";
	$( document.getElementById("first") ).appendTo(document.getElementById("sap"));
	equal( $("#sap").text(), expected, "Check for appending of element" );

	expected = "This link has class=\"blog\": Simon Willison's WeblogTry them out:Yahoo";
	$(document.getElementById("first")).appendTo("#sap");
	$(document.getElementById("yahoo")).appendTo("#sap");
	equal( $("#sap").text(), expected, "Check for appending of array of elements" );

});

test( "$(selector).appendTo($)", function() {

  var expected, num, div;
	ok( $(document.createElement("script")).appendTo("body").length, "Make sure a disconnected script can be appended." );

	expected = "This link has class=\"blog\": Simon Willison's WeblogYahooTry them out:";
	$("#yahoo, #first").appendTo("#sap");
	equal( $("#sap").text(), expected, "Check for appending of $ object" );

	$("#select1").appendTo($("#foo"));
	t( "Append select", "#foo select", [ "select1" ] );

	div = $("<div/>").on( "click", function() {
		ok( true, "Running a cloned click." );
	});
	div.appendTo("#qunit-fixture, #moretests");

	$("#qunit-fixture div").last().trigger("click");
	$("#moretests div").last().trigger("click");

	div = $("<div/>").appendTo("#qunit-fixture, #moretests");

	equal( div.length, 2, "appendTo returns the inserted elements" );

	div.addClass("test");

	ok( $("#qunit-fixture div").last().hasClass("test"), "appendTo element was modified after the insertion" );
	ok( $("#moretests div").last().hasClass("test"), "appendTo element was modified after the insertion" );

	div = $("<div/>");
	$("<span>a</span><span>b</span><b>b</b>").filter("span").appendTo( div );

	equal( div.children().length, 2, "Make sure the right number of children were inserted." );

	div = $("#moretests div");

	num = $("#qunit-fixture div").length;
	div.remove().appendTo("#qunit-fixture");

	equal( $("#qunit-fixture div").length, num, "Make sure all the removed divs were inserted." );
});

test( "append to multiple elements", function() {

	var selects = $("<select class='test8070'></select><select class='test8070'></select>").appendTo("#qunit-fixture");
	selects.append("<OPTION>1</OPTION><OPTION>2</OPTION>");

	equal( selects.get(0).childNodes.length, 2, "First select got two nodes" );
	equal( selects.get(1).childNodes.length, 2, "Second select got two nodes" );
});

test( "prepend(String)", function() {

	var result, expected;
	expected = "Try them out:";
	result = $("#first").prepend( "<b>buga</b>" );
	equal( result.text(), "buga" + expected, "Check if text prepending works" );
	equal( $("#select3").prepend( "<option value='prependTest'>Prepend Test</option>"  ).find("option").eq(0).attr("value"), "prependTest", "Prepending html options to select element" );
});

test( "prepend(Element)", function() {

	var expected;
	expected = "Try them out:This link has class=\"blog\": Simon Willison's Weblog";
	$("#sap").prepend( document.getElementById("first") );
	equal( $("#sap").text(), expected, "Check for prepending of element" );
});

test( "prepend(Array<Element>)", function() {

	var expected;
	expected = "Try them out:YahooThis link has class=\"blog\": Simon Willison's Weblog";
	$("#sap").prepend( [ document.getElementById("first"), document.getElementById("yahoo") ] );
	equal( $("#sap").text(), expected, "Check for prepending of array of elements" );
});

test( "prepend($)", function() {

	var expected;
	expected = "YahooTry them out:This link has class=\"blog\": Simon Willison's Weblog";
	$("#sap").prepend( $("#yahoo, #first") );
	equal( $("#sap").text(), expected, "Check for prepending of $ object" );
});

test( "prepend(Array<$>)", function() {

	var expected;
	expected = "Try them out:GoogleYahooThis link has class=\"blog\": Simon Willison's Weblog";
	$("#sap").prepend( [ $("#first"), $("#yahoo, #google") ] );
	equal( $("#sap").text(), expected, "Check for prepending of array of $ objects" );
});

test( "prependTo(String)", function() {

	var defaultText;

	defaultText = "Try them out:";
	$("<b>buga</b>").prependTo("#first");
	equal( $("#first").text(), "buga" + defaultText, "Check if text prepending works" );
	equal( $("<option value='prependTest'>Prepend Test</option>").prependTo("#select3").parent().find("option").eq(0).attr("value"), "prependTest", "Prepending html options to select element" );

});

test( "prependTo(Element)", function() {

	var expected;

	expected = "Try them out:This link has class=\"blog\": Simon Willison's Weblog";
	$( document.getElementById("first") ).prependTo("#sap");
	equal( $("#sap").text(), expected, "Check for prepending of element" );
});

test( "prependTo(Array<Element>)", function() {

	var expected;

	expected = "Try them out:YahooThis link has class=\"blog\": Simon Willison's Weblog";
	$( [ document.getElementById("first"), document.getElementById("yahoo") ] ).prependTo("#sap");
	equal( $("#sap").text(), expected, "Check for prepending of array of elements" );
});

test( "prependTo($)", function() {

	var expected;

	expected = "YahooTry them out:This link has class=\"blog\": Simon Willison's Weblog";
	$("#yahoo, #first").prependTo("#sap");
	equal( $("#sap").text(), expected, "Check for prepending of $ object" );
});

test( "prependTo(Array<$>)", function() {

	$("<select id='prependSelect1'></select>").prependTo("#form");
	$("<select id='prependSelect2'><option>Test</option></select>").prependTo("#form");

	t( "Prepend Select", "#prependSelect2, #prependSelect1", [ "prependSelect2", "prependSelect1" ] );
});

test( "before(String)", function() {

	var expected;

	expected = "This is a normal link: bugaYahoo";
	$("#yahoo").before( manipulationBareObj("<b>buga</b>") );
	equal( $("#en").text(), expected, "Insert String before" );
});

test( "before(Element)", function() {

	var expected;

	expected = "This is a normal link: Try them out:Yahoo";
	$("#yahoo").before( manipulationBareObj(document.getElementById("first")) );
	equal( $("#en").text(), expected, "Insert element before" );
});

test( "before(Array<Element>)", function() {

	var expected;
	expected = "This is a normal link: Try them out:diveintomarkYahoo";
	$("#yahoo").before( manipulationBareObj([ document.getElementById("first"), document.getElementById("mark") ]) );
	equal( $("#en").text(), expected, "Insert array of elements before" );
});

test( "before($)", function() {

	var expected;
	expected = "This is a normal link: diveintomarkTry them out:Yahoo";
	$("#yahoo").before( manipulationBareObj($("#mark, #first")) );
	equal( $("#en").text(), expected, "Insert $ before" );
});

test( "before(Array<$>)", function() {

	var expected;
	expected = "This is a normal link: Try them out:GooglediveintomarkYahoo";
	$("#yahoo").before( manipulationBareObj([ $("#first"), $("#mark, #google") ]) );
	equal( $("#en").text(), expected, "Insert array of $ objects before" );
});

test( "before(no-op)", function() {

	var set;
	set = $("<div/>").before("<span>test</span>");
	equal( set.get(0).nodeName.toLowerCase(), "div", "Insert before a disconnected node should be a no-op" );
	equal( set.length, 1, "Insert the element before the disconnected node. should be a no-op" );
});



test( "before and after w/ empty object", function() {

	var res;
	res = $( "#notInTheDocument" ).before( "(" ).after( ")" );
	equal( res.length, 0, "didn't choke on empty object" );
});


test( ".before() and .after() disconnected node", function() {

  equal( $("<input type='checkbox'/>").before("<div/>").length, 1, "before() on disconnected node is no-op" );
	equal( $("<input type='checkbox'/>").after("<div/>").length, 1, "after() on disconnected node is no-op" );
});


test( "insert with .before() on disconnected node last", function() {

  var expectedBefore = "This is a normal link: bugaYahoo";

  $("#yahoo").add("<span/>").before("<b>buga</b>");
	equal( $("#en").text(), expectedBefore, "Insert String before with disconnected node last" );
});

test( "insert with .before() on disconnected node first", function() {

  var expectedBefore = "This is a normal link: bugaYahoo";

	$("<span/>").add("#yahoo").before("<b>buga</b>");
	equal( $("#en").text(), expectedBefore, "Insert String before with disconnected node first" );
});

test( "insert with .before() on disconnected node last", function() {

  var expectedAfter = "This is a normal link: Yahoobuga";

	$("#yahoo").add("<span/>").after("<b>buga</b>");
	equal( $("#en").text(), expectedAfter, "Insert String after with disconnected node last" );
});

test( "insert with .before() on disconnected node last", function() {

  var expectedAfter = "This is a normal link: Yahoobuga";

	$("<span/>").add("#yahoo").after("<b>buga</b>");
	equal( $("#en").text(), expectedAfter, "Insert String after with disconnected node first" );
});

test( "insertBefore(String)", function() {

	var expected = "This is a normal link: bugaYahoo";
	$("<b>buga</b>").insertBefore("#yahoo");
	equal( $("#en").text(), expected, "Insert String before" );
});

test( "insertBefore(Element)", function() {

  var expected = "This is a normal link: Try them out:Yahoo";
	$( document.getElementById("first") ).insertBefore("#yahoo");
	equal( $("#en").text(), expected, "Insert element before" );
});

test( "insertBefore($)", function() {

  var expected = "This is a normal link: diveintomarkTry them out:Yahoo";
	$("#mark, #first").insertBefore("#yahoo");
	equal( $("#en").text(), expected, "Insert $ before" );
});

test( ".after(String)", function() {

  var expected = "This is a normal link: Yahoobuga";
	$("#yahoo").after( "<b>buga</b>" );
	equal( $("#en").text(), expected, "Insert String after" );
});

test( ".after(Element)", function() {

  var expected = "This is a normal link: YahooTry them out:";
	$("#yahoo").after( document.getElementById("first") );
	equal( $("#en").text(), expected, "Insert element after" );
});

test( ".after(Array<Element>)", function() {

  var expected = "This is a normal link: YahooTry them out:diveintomark";
	$("#yahoo").after( [ document.getElementById("first"), document.getElementById("mark") ] );
	equal( $("#en").text(), expected, "Insert array of elements after" );
});

test( ".after($)", function() {

  var expected = "This is a normal link: YahooTry them out:Googlediveintomark";
	$("#yahoo").after( [ $("#first"), $("#mark, #google") ] );
	equal( $("#en").text(), expected, "Insert array of $ objects after" );
});


test( ".after(disconnected node)", function() {

  var set = $("<div/>").before("<span>test</span>");
	equal( set.get(0).nodeName.toLowerCase(), "div", "Insert after a disconnected node should be a no-op" );
	equal( set.length, 1, "Insert the element after the disconnected node should be a no-op" );
});

test( "insertAfter(String)", function() {

	var expected = "This is a normal link: Yahoobuga";
	$("<b>buga</b>").insertAfter("#yahoo");
	equal( $("#en").text(), expected, "Insert String after" );
});

test( "insertAfter(Element)", function() {

  var expected = "This is a normal link: YahooTry them out:";
	$( document.getElementById("first") ).insertAfter("#yahoo");
	equal( $("#en").text(), expected, "Insert element after" );
});

test( "insertAfter($)", function() {

  var expected = "This is a normal link: YahoodiveintomarkTry them out:";
	$("#mark, #first").insertAfter("#yahoo");
	equal( $("#en").text(), expected, "Insert $ after" );
});

