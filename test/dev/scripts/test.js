
/**
 * @requires ../../../src/Murloc.js
 * @rrequires ../../speed/libs/jquery-1.10.2.js
 */

//$('#log').html($.is(document.body, 'body'));

/*
$("p").click(function(e) {
	//$("textarea").focus();
});*/


$('div').addClass('abc');
$('.abc').toggleClass('abc');


console.log($(DOC).width(), $(DOC).height());

var s = $('.box_1').width();
console.log(s);

var s = $('.box_2').width();
console.log(s);


//$.is($('<div foo="bar">').get(0), '[foo]');
//$.is(document.getElementById('nothiddendiv'), '#body #nothiddendiv');

//console.log($("<div foo='bar'></div>").closest("[foo]").length);

//$("body").closest("div");

