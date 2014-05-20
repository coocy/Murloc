
/**
 * @requires ../../../src/Murloc.js
 * @rrequires ../../speed/libs/jquery-1.10.2.js
 */

//$('#log').html($.is(document.body, 'body'));

/*
$("p").click(function(e) {
	//$("textarea").focus();
});*/


$("textarea").val('').attr('placeholder', 'Text').focus(function(e) {
	console.log('focus');
}).blur(function(e) {
	console.log('blur');
});

$('span').click(function(e) {
	console.log(this.__ruid);
});

//console.log($("button").click(function() {console.log(this);}).prependTo($('div')));


console.log($("button").insertBefore($('form').after('123'), $('div').get(0)));



//$.is($('<div foo="bar">').get(0), '[foo]');
//$.is(document.getElementById('nothiddendiv'), '#body #nothiddendiv');

//console.log($("<div foo='bar'></div>").closest("[foo]").length);

//$("body").closest("div");

