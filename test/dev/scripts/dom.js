/**
 * @requires ../../src/Murloc.js
 */

$('table td.b').html('HMTL By JS');


$('table td').attr('foo', 'bar');

var val = $('table td').attr('foo');
$('.result').html(val);

$('table td.b').removeAttr('foo');

/*
$('textarea').on('focus', function() {
	$(this).val('on fucus');
}).on('blur', function() {
	$(this).val('on blur');
});*/

//console.log($.parseJSON('{"a":"b"}'));