
test("css(String|Hash)", function() {

	equal( $("#qunit-fixture").css("display"), "block", "Check for css property \"display\"" );

	var $child, div, div2, width, height, child, prctval, checkval, old;

	$child = $("#nothiddendivchild").css({ "width": "20%", "height": "20%" });
	notEqual( $child.css("width"), "20px", "Retrieving a width percentage on the child of a hidden div returns percentage" );
	notEqual( $child.css("height"), "20px", "Retrieving a height percentage on the child of a hidden div returns percentage" );

	div = $( "<div/>" );

	div.css({ "width": 4, "height": 4 });

	equal( div.css("width"), "4px", "Width on disconnected node." );
	equal( div.css("height"), "4px", "Height on disconnected node." );

	div2 = $( "<div style='display:none;'><input type='text' style='height:20px;'/><textarea style='height:20px;'/><div style='height:20px;'></div></div>").appendTo("body");

	equal( div2.find("input").css("height"), "20px", "Height on hidden input." );
	equal( div2.find("textarea").css("height"), "20px", "Height on hidden textarea." );
	equal( div2.find("div").css("height"), "20px", "Height on hidden textarea." );

	div2.remove();

	equal( $("<div style='display: none;'/>").css("display"), "none", "Styles on disconnected nodes");

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

	equal( $("#empty").css("opacity"), "0", "Assert opacity is accessible via filter property set in stylesheet in IE" );
	$("#empty").css({ "opacity": "1" });
	equal( $("#empty").css("opacity"), "1", "Assert opacity is taken from style attribute when set vs stylesheet in IE with filters" );

	div = $("#nothiddendiv");
	child = $("#nothiddendivchild");

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
	prctval = parseInt(child.css("fontSize"), 10);
	checkval = 0;
	if ( prctval === 16 || prctval === 24 ) {
		checkval = prctval;
	}

	equal( prctval, checkval, "Verify fontSize % set." );

	equal( typeof child.css("width"), "string", "Make sure that a string width is returned from css('width')." );

	old = child.get(0).style.height;

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

	strictEqual( child.css( "x-fake" ), undefined, "Make sure undefined is returned from css(nonexistent)." );

	div = $( "<div/>" ).css({ position: "absolute", "z-index": 1000 }).appendTo( "#qunit-fixture" );
	strictEqual( div.css( "z-index" ), "1000",
		"Make sure that a string z-index is returned from css('z-index') (#14432)." );
});


test("width()", function() {

	var $div, blah;

	$div = $("#nothiddendiv");
	$div.css('width', 30);
	equal($div.width(), 30, "Test width");

	blah = $("blah");
	equal( blah.width(), null, "Make sure 'null' is returned on an empty set");

	equal( $(window).width(), document.documentElement.clientWidth, "Window width is equal to width reported by window/document." );

});

test("height()", function() {

	var $div, blah;

	$div = $("#nothiddendiv");
	$div.css('height', 30);
	equal($div.height(), 30, "Test height");

	blah = $("blah");
	equal( blah.height(), null, "Make sure 'null' is returned on an empty set");

	equal( $(window).height(), document.documentElement.clientHeight, "Window width is equal to width reported by window/document." );

});


