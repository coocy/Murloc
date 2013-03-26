

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

$('div').html('HTML By JS').on('click', function() {$(this).html('Yap!')});
$('.link').on('click', function(e) {
	e.preventDefault();
	$(this).html('Clicked!');
});

/*
DOC.addEventListener('focus', function(e) {
	console.log('focus');
	console.log(e);
}, true);*/
