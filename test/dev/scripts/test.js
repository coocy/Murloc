
/**
 * @requires ../../../src/Murloc.js
 */

//$('#log').html($.is(document.body, 'body'));



$("p").slice(0,3);


//$.is($('<div foo="bar">').get(0), '[foo]');
//$.is(document.getElementById('nothiddendiv'), '#body #nothiddendiv');

//console.log($("<div foo='bar'></div>").closest("[foo]").length);

//$("body").closest("div");

var e = $("#log");
e.addClass("testA testB");
e.toggleClass( "testB testC");

console.log(e.get(0).className);