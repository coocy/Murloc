
/**
 * @requires ../../../src/Murloc.js
 */

/*

$('button').on('click', function() {
	console.log(this.className);
});

$('button').slice(0, 1);
*/

//console.log(_toString.call(window));

var obj = {};
var _fn = function() {var a = (2)};
var fn = new _fn;

var dom = document.createElement("div");

$.extend(obj, {'abc': new Date});
//console.log(obj);

var a = $.copy(obj);
//console.log(obj);


console.log($.isObject(null));

//_hasOwnProperty

