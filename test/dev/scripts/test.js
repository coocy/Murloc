
/**
 * @requires ../../../src/Murloc.js
 */

/*

$('button').on('click', function() {
	console.log(this.className);
});

$('button').slice(0, 1);
*/

$('button').data('abc', function() {});

console.log($('button').data('abcd'));
console.log($('button').data());

$('button').removeData('abc');

console.log($('button').data());

