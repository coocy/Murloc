
var manipulationBareObj = function( value ) {
	return value;
};

test( "$.clone()", function() {

	var div, clone, form, body;

	equal( $("#en").text(), "This is a normal link: Yahoo", "Assert text for #en" );
	equal( $("#first").append( $("#yahoo").clone() ).text(), "Try them out:Yahoo", "Check for clone" );
	equal( $("#en").text(), "This is a normal link: Yahoo", "Reassert text for #en" );

	$.each( "div button ul ol li select option textarea iframe".split(" "), function( i, nodeName ) {
		equal( $( "<" + nodeName + "/>" ).clone().get(0).nodeName.toLowerCase(), nodeName, "Clone a " + nodeName );
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

