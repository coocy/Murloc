
var manipulationBareObj = function( value ) {
	return value;
};


test( "$(selector).text()", function() {

	var expected, frag, $newLineTest;

	expected = "This link has class=\"blog\": Simon Willison's Weblog";
	equal( $("#sap").text(), expected, "Check for merged text of more then one element." );

	// Check serialization of text values
	equal( $(document.createTextNode("foo")).text(), "foo", "Text node was retreived from .text()." );
	notEqual( $(document).text(), "", "Retrieving text for the document retrieves all text." );

	// Retrieve from document fragments
	frag = document.createDocumentFragment();
	frag.appendChild( document.createTextNode("foo") );

	equal( $(frag).text(), "foo", "Document Fragment Text node was retreived from .text()." );

	//$newLineTest = $("<div>test<br/>testy</div>").appendTo("#moretests");
	//$newLineTest.find("br").replaceWith("\n");
	//equal( $newLineTest.text(), "test\ntesty", "text() does not remove new lines" );

	//$newLineTest.remove();
});

var testText = function( valueObj ) {

	var val, j;

	val = valueObj("<div><b>Hello</b> cruel world!</div>");
	equal( $("#foo").text(val).get(0).innerHTML.replace(/>/g, "&gt;"), "&lt;div&gt;&lt;b&gt;Hello&lt;/b&gt; cruel world!&lt;/div&gt;", "Check escaped text" );

	j = $("#nonnodes").children();
	j.text( valueObj("hi!") );
	equal( $( j.get(0)).text(), "hi!", "Check node,textnode,comment with text()" );

};

test( "$(selector).text(String)", function() {
	testText( manipulationBareObj );
});

test( "$(selector).text(undefined)", function() {
	equal( $("#foo").text("<div").text(undefined).get(0).innerHTML, "&lt;div", ".text(undefined) is chainable" );
});

var testVal = function( valueObj ) {

	QUnit.reset();
	$("#text1").val( valueObj("test") );
	equal( document.getElementById("text1").value, "test", "Check for modified (via val(String)) value of input element" );

	$("#text1").val( valueObj( undefined ) );
	equal( document.getElementById("text1").value, "", "Check for modified (via val(undefined)) value of input element" );

	$("#text1").val( valueObj( 67 ) );
	equal( document.getElementById("text1").value, "67", "Check for modified (via val(Number)) value of input element" );

	$("#text1").val( valueObj( null ) );
	equal( document.getElementById("text1").value, "", "Check for modified (via val(null)) value of input element" );

	var $select1 = $("#select1");
	$select1.val( valueObj("3") );
	equal( $select1.val(), "3", "Check for modified (via val(String)) value of select element" );

	$select1.val( valueObj( 2 ) );
	equal( $select1.val(), "2", "Check for modified (via val(Number)) value of select element" );

	$select1.append("<option value='4'>four</option>");
	$select1.val( valueObj( 4 ) );
	equal( $select1.val(), "4", "Should be possible to set the val() to a newly created option" );

	var j = $("#nonnodes").children();
	j.val( valueObj( "asdf" ) );
	equal( j.val(), "asdf", "Check node,textnode,comment with val()" );
	j.removeAttr("value");
};

test( "$(selector).val(String/Number)", function() {
	testVal( bareObj );
});


/*test("css(String|Hash)", function() {


	equal( $("#qunit-fixture").css("display"), "block", "Check for css property \"display\"" );

	var $child = $("#nothiddendivchild").css({ "width": "20%", "height": "20%" });
	notEqual( $child.css("width"), "20px", "Retrieving a width percentage on the child of a hidden div returns percentage" );
	notEqual( $child.css("height"), "20px", "Retrieving a height percentage on the child of a hidden div returns percentage" );

	var div = $( "<div>" );

	// These should be "auto" (or some better value)
	// temporarily provide "0px" for backwards compat
	equal( div.css("width"), "0px", "Width on disconnected node." );
	equal( div.css("height"), "0px", "Height on disconnected node." );

	div.css({ "width": 4, "height": 4 });

	equal( div.css("width"), "4px", "Width on disconnected node." );
	equal( div.css("height"), "4px", "Height on disconnected node." );

	var div2 = $( "<div style='display:none;'><input type='text' style='height:20px;'/><textarea style='height:20px;'/><div style='height:20px;'></div></div>").appendTo("body");

	equal( div2.find("input").css("height"), "20px", "Height on hidden input." );
	equal( div2.find("textarea").css("height"), "20px", "Height on hidden textarea." );
	equal( div2.find("div").css("height"), "20px", "Height on hidden textarea." );

	div2.remove();

	$("#nothiddendiv").css( {"width": 1, "height": 1} );

	var width = parseFloat($("#nothiddendiv").css("width")), height = parseFloat($("#nothiddendiv").css("height"));
	$("#nothiddendiv").css({ "overflow":"hidden", "width": -1, "height": -1 });
	equal( parseFloat($("#nothiddendiv").css("width")), 0, "Test negative width set to 0");
	equal( parseFloat($("#nothiddendiv").css("height")), 0, "Test negative height set to 0");

	equal( $("<div style='display: none;'>").css("display"), "none", "Styles on disconnected nodes");

	$("#floatTest").css({"float": "right"});
	equal( $("#floatTest").css("float"), "right", "Modified CSS float using \"float\": Assert float is right");
	$("#floatTest").css({"font-size": "30px"});
	equal( $("#floatTest").css("font-size"), "30px", "Modified CSS font-size: Assert font-size is 30px");
	$.each("0,0.25,0.5,0.75,1".split(","), function(i, n) {
		$("#foo").css({"opacity": n});

		equal( $("#foo").css("opacity"), parseFloat(n), "Assert opacity is " + parseFloat(n) + " as a String" );
		$("#foo").css({"opacity": parseFloat(n)});
		equal( $("#foo").css("opacity"), parseFloat(n), "Assert opacity is " + parseFloat(n) + " as a Number" );
	});
	$("#foo").css({"opacity": ""});
	equal( $("#foo").css("opacity"), "1", "Assert opacity is 1 when set to an empty String" );

	equal( $("#empty").css("opacity") , "0", "Assert opacity is accessible via filter property set in stylesheet in IE" );
	$("#empty").css({ "opacity": "1" });
	equal( $("#empty").css("opacity"), "1", "Assert opacity is taken from style attribute when set vs stylesheet in IE with filters" );

	div = $("#nothiddendiv");
	var child = $("#nothiddendivchild");

	equal( parseInt(div.css("fontSize"), 10), 16, "Verify fontSize px set." );
	equal( parseInt(div.css("font-size"), 10), 16, "Verify fontSize px set." );
	equal( parseInt(child.css("fontSize"), 10), 16, "Verify fontSize px set." );
	equal( parseInt(child.css("font-size"), 10), 16, "Verify fontSize px set." );

	child.css("height", "100%");
	equal( child.get(0).style.height, "100%", "Make sure the height is being set correctly." );

	child.attr("class", "em");
	equal( parseInt(child.css("fontSize"), 10), 32, "Verify fontSize em set." );

	// Have to verify this as the result depends upon the browser's CSS
	// support for font-size percentages
	child.attr("class", "prct");
	var prctval = parseInt(child.css("fontSize"), 10), checkval = 0;
	if ( prctval === 16 || prctval === 24 ) {
		checkval = prctval;
	}

	equal( prctval, checkval, "Verify fontSize % set." );

	equal( typeof child.css("width"), "string", "Make sure that a string width is returned from css('width')." );

	var old = child.get(0).style.height;

	// Test NaN
	child.css("height", parseFloat("zoo"));
	equal( child.get(0).style.height, old, "Make sure height isn't changed on NaN." );

	// Test null
	child.css("height", null);
	equal( child.get(0).style.height, old, "Make sure height isn't changed on null." );

	old = child.get(0).style.fontSize;

	// Test NaN
	child.css("font-size", parseFloat("zoo"));
	equal( child.get(0).style.fontSize, old, "Make sure font-size isn't changed on NaN." );

	// Test null
	child.css("font-size", null);
	equal( child.get(0).style.fontSize, old, "Make sure font-size isn't changed on null." );
});*/