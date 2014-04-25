
/**
 * @requires ../../../src/Murloc.js
 */

//$('#log').html($.is(document.body, 'body'));



$("p").slice(0,3);

$("p").on('click', function() {alert(1)});
$("p").click(function() {alert(2)});
$("p").click(function() {alert(3)});
$("p").click(function() {alert(4)});


//$.is($('<div foo="bar">').get(0), '[foo]');
//$.is(document.getElementById('nothiddendiv'), '#body #nothiddendiv');

//console.log($("<div foo='bar'></div>").closest("[foo]").length);

//$("body").closest("div");

