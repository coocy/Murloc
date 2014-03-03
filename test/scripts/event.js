/**
 * @requires ../../src/Murloc.js
 */

$('table td').on('click', function(e) {
	console.log('TD: ' + $(this).html());
	$(this).addClass('clicked');
	e.preventDefault();

});

$('table td.b').on('click', function(e) {
	$('table td.a').trigger('click');
});


$('table').on('click', function(e) {
	console.log('Table is clicked');
});

$('.link').on('click', function(e) {
	e.preventDefault();
	$(this).html('Clicked!');
});

$('textarea').on('focus', function() {
	this.value = 'on focus';
}).on('blur', function() {
	this.value = 'on blur';
});

$('form').on('submit', function(e) {
	e.preventDefault();
	//return false;
});

/*
DOC.addEventListener('focus', function(e) {
	console.log('focus');
	console.log(e);
}, true);*/
