

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


