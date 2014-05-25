
/**
 * @requires ../../../src/Murloc.js
 * @equires ../../speed/libs/jquery-1.10.2.js
 */

//$('#log').html($.is(document.body, 'body'));

/*
$("p").click(function(e) {
	//$("textarea").focus();
});*/
if (typeof console === 'undefined') {
	console = {
		log: function(msg) {
			$('#log').html($('#log').html() + '<br>' + msg);
		}
	};
}

$('#link').on('click', function() {
	console.log('click: ' + this.nodeName);
	return false;
}).trigger('click');

var a = $('textarea').on('focus', function() {
	console.log('focus: ' + this.nodeName);
}).trigger('focus');

var a = $('form').on('submit', function(e) {
	console.log('submit: ' + this.nodeName);
	e.preventDefault();
	return false;
})/*.trigger('submit')*/;


