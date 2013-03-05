

$('table td').on('click', function(e) {
	console.log('TD: ' + $(this).html());
	//e.stopPropagation();
	e.preventDefault();
});

$('table').on('click', function(e) {
	console.log('Table: ' + $(this).html());
});

$('div').html('HTML By JS').on('click', function() {$(this).html('Yap!')});
$('a').on('click', function(e) {
	e.preventDefault();
	$(this).html('Clicked!');
});
/*
DOC.addEventListener('focus', function(e) {
	console.log('focus');
	console.log(e);
}, true);*/

