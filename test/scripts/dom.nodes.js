
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
	//equal( $("#nonnodes").contents().clone().length, 3, "Check node,textnode,comment clone works (some browsers delete comments on clone)" );

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
