
var bareObj = function( value ) {
	return value;
};

var testAddClass = function( valueObj ) {

	var div = $("#qunit-fixture div");
	div.addClass( valueObj("test") );
	var pass = true;
	for ( var i = 0, l = div.length; i < l; i++ ) {
		if ( !~div.get( i ).className.indexOf("test") ) {
			pass = false;
		}
	}
	ok( pass, "Add Class" );

	var j = $("#nonnodes").children();
	j.addClass( valueObj("asdf") );
	ok( j.hasClass("asdf"), "Check node,textnode,comment for addClass" );

	div = $("<div/>");

	div.addClass( valueObj("test") );
	equal( div.attr("class"), "test", "Make sure there's no extra whitespace." );

	div.attr( "class", " foo" );
	div.addClass( valueObj("test") );
	equal( div.attr("class"), "foo test", "Make sure there's no extra whitespace." );

	div.attr( "class", "foo" );
	div.addClass( valueObj("bar baz") );
	equal( div.attr("class"), "foo bar baz", "Make sure there isn't too much trimming." );

	div.removeClass();
	div.addClass( valueObj("foo") ).addClass( valueObj("foo") );
	equal( div.attr("class"), "foo", "Do not add the same class twice in separate calls." );

	div.addClass( valueObj("fo") );
	equal( div.attr("class"), "foo fo", "Adding a similar class does not get interrupted." );
	div.removeClass().addClass("wrap2");
	ok( div.addClass("wrap").hasClass("wrap"), "Can add similarly named classes");

	div.removeClass();
	div.addClass( valueObj("bar bar") );
	equal( div.attr("class"), "bar", "Do not add the same class twice in the same call." );
};

test( "$(selector).addClass(String)", function() {
	testAddClass( bareObj );
});

var testRemoveClass = function(valueObj) {

	var $set = $("#qunit-fixture div"),
		div = document.createElement("div");

	$set.addClass("test").removeClass( valueObj("test") );

	ok( !$set.is(".test"), "Remove Class" );

	$set.addClass("test").addClass("foo").addClass("bar");
	$set.removeClass( valueObj("test") ).removeClass( valueObj("bar") ).removeClass( valueObj("foo") );

	ok( !$set.is(".test,.bar,.foo"), "Remove multiple classes" );

	// Make sure that a null value doesn't cause problems
	$set.eq( 0 ).addClass("expected").removeClass( valueObj( null ) );
	ok( $set.eq( 0 ).is(".expected"), "Null value passed to removeClass" );

	$set.eq( 0 ).addClass("expected").removeClass( valueObj("") );
	ok( $set.eq( 0 ).is(".expected"), "Empty string passed to removeClass" );

	$set = $("#nonnodes").children();
	$set.removeClass( valueObj("asdf") );
	ok( !$set.hasClass("asdf"), "Check node,textnode,comment for removeClass" );


	$( div ).removeClass( valueObj("foo") );
	strictEqual( $( div ).attr("class"), undefined, "removeClass doesn't create a class attribute" );

	div.className = " test foo ";

	$( div ).removeClass( valueObj("foo") );
	equal( div.className, "test", "Make sure remaining className is trimmed." );

	div.className = " test ";

	$( div ).removeClass( valueObj("test") );
	equal( div.className, "", "Make sure there is nothing left after everything is removed." );
};

test( "$(selector).removeClass(String)", function() {
	testRemoveClass( bareObj );

	var $div = $("<div class='base second'></div>");
	$div.removeClass( undefined );

	ok( $div.hasClass("base") && $div.hasClass("second"), "Element still has classes after removeClass(undefined)" );
});

var testToggleClass = function(valueObj) {

	var e = $("#firstp");
	ok( !e.is(".test"), "Assert class not present" );
	e.toggleClass( valueObj("test") );
	ok( e.is(".test"), "Assert class present" );
	e.toggleClass( valueObj("test") );
	ok( !e.is(".test"), "Assert class not present" );

	// class name with a boolean
	e.toggleClass( valueObj("test"), false );
	ok( !e.is(".test"), "Assert class not present" );
	e.toggleClass( valueObj("test"), true );
	ok( e.is(".test"), "Assert class present" );
	e.toggleClass( valueObj("test"), false );
	ok( !e.is(".test"), "Assert class not present" );

	// multiple class names
	e.addClass("testA testB");
	ok( e.is(".testA.testB"), "Assert 2 different classes present" );
	e.toggleClass( valueObj("testB testC") );
	ok( (e.is(".testA.testC") && !e.is(".testB")), "Assert 1 class added, 1 class removed, and 1 class kept" );
	e.toggleClass( valueObj("testA testC") );
	ok( (!e.is(".testA") && !e.is(".testB") && !e.is(".testC")), "Assert no class present" );

};

test( "toggleClass(String|boolean|undefined[, boolean])", function() {
	testToggleClass( bareObj );
});

test( "addClass, removeClass, hasClass", function() {

	var $el = $("<p>Hi</p>"), x = $el.get(0);

	$el.addClass("hi");
	equal( x.className, "hi", "Check single added class" );

	$el.addClass("foo bar");
	equal( x.className, "hi foo bar", "Check more added classes" );

	$el.removeClass();
	equal( x.className, "", "Remove all classes" );

	$el.addClass("hi foo bar");
	$el.removeClass("foo");
	equal( x.className, "hi bar", "Check removal of one class" );

	ok( $el.hasClass("hi"), "Check has1" );
	ok( $el.hasClass("bar"), "Check has2" );

	$el = $("<p class='class1\nclass2\tcla.ss3\n\rclass4'></p>");

	ok( $el.hasClass("class1"), "Check hasClass with line feed" );
	ok( $el.is(".class1"), "Check is with line feed" );
	ok( $el.hasClass("class2"), "Check hasClass with tab" );
	ok( $el.is(".class2"), "Check is with tab" );
	ok( $el.hasClass("cla.ss3"), "Check hasClass with dot" );
	ok( $el.hasClass("class4"), "Check hasClass with carriage return" );
	ok( $el.is(".class4"), "Check is with carriage return" );

	$el.removeClass("class2");
	ok( $el.hasClass("class2") === false, "Check the class has been properly removed" );
	$el.removeClass("cla");
	ok( $el.hasClass("cla.ss3"), "Check the dotted class has not been removed" );
	$el.removeClass("cla.ss3");
	ok( $el.hasClass("cla.ss3") === false, "Check the dotted class has been removed" );
	$el.removeClass("class4");
	ok( $el.hasClass("class4") === false, "Check the class has been properly removed" );
});



