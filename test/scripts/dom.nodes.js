/**
 * @requires ../../src/Murloc.js
 */

$('.item_1 li').before('<li class="n">new Node1</li>');
$('.item_1 li').before('<li class="n1">new Node 2</li><li class="n1">new Node 3</li>');

$('.item_2 li').after('<li class="n">new Node1</li>');
$('.item_2 li').after('<li class="n1">new Node 2</li><li class="n1">new Node 3</li>');

$('.item_3 ul').prepend('<li class="n">new Node1</li>');
$('.item_3 ul').prepend('<li class="n1">new Node 2</li><li class="n1">new Node 3</li>');

$('.item_4 ul').append('<li class="n">new Node1</li>');
$('.item_4 ul').append('<li class="n1">new Node 2</li><li class="n1">new Node 3</li>');

$('<li class="n">new Node1</li>').insertBefore('.item_1_1 li');
$('<li class="n">new Node1</li>').insertAfter('.item_2_1 li');
$('<li class="n">new Node1</li>').prependTo('.item_3_1 ul');
$('<li class="n">new Node1</li>').appendTo('.item_4_1 ul');


$('.item_5 ul').children().append('<b> New</b>');
