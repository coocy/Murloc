
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

var el = $('select').append($('<option>4</option>'));


$('#link').on('click', function() {
	console.log('click: ' + this.nodeName);
	return false;
}).trigger('click');

var a = $('textarea').on('focus', function() {
	//console.log('focus: ' + this.nodeName);
}).trigger('focus');

var a = $('form').on('submit', function(e) {
	//console.log('submit: ' + this.nodeName);
	e.preventDefault();
	return false;
})/*.trigger('submit')*/;

tmp = " &lt;div&gt;hello1&lt;/div&gt; ";

var div = document.createElement('div');
div.innerHTML = tmp;

//console.log(_rHTML.test(tmp));

//var div = $('div').html( tmp );


actual = []; expected = []; tmp = {};
$("#nonnodes").contents().html( "<b>bold</b>").each(function() {
		var html = $( this ).html();
		tmp[ this.nodeType ] = true;
		expected.push( this.nodeType === 1 ? "<b>bold</b>" : undefined );
		actual.push( html ? html.toLowerCase() : html );
	});