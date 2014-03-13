
test("$(selector, context)", function() {
	add('$("#qunit-fixture")', "ID selector");
	add('$("p")', "tag selector");
	add('$(".blog")', "class selector");
	add('$("#ap a")', "Basic selector");
	add('$("div p", "#qunit-fixture")', "Basic selector with string as context");
	add('$("div p", q("qunit-fixture")[0])', "Basic selector with element as context");
	add('$("div p", $("#qunit-fixture"))', "Basic selector with $ object as context");
});

test("Util", function() {
	add('$.isPlainObject({})');
	add('$.extend({}, {"a": "-", "b": [1,2,3], "c": null})', '$.extend(dest, source)');
});

test(".data()", function() {
	add('$().data("test")', '$().data(key)');
	add('$().data("test", "success")', '$().data(key, value)');
	add('$(".foo").data("test")', '$(selector).data(key)');
	add('$(".foo").data("test", "success")', "$(selector).data(key, value)");
	add('$(".foo").data("test", "success").removeData("test")', "$(selector).data(key, value).removeData(key)");
});


test("DOM", function() {
	add('$("p").eq(-1)', '$(selector).eq(-1)');
	add('$("p").first()', '$(selector).first()');
	add('$("p").last()', '$(selector).last()');
	add('$("p").slice(0,3)', '$(selector).slice()');
	add('$("p").filter("#ap, #sndp")', '$(selector).filter()');

	add('$("p").closest()', '$(selector).closest()');
	add('$("p").closest("div")', '$(selector).closest(selector)');

	add('$("#foo").children()', '$(selector).children()');
	add('$("#foo").children("#en, #sap")', '$(selector).children(selector)');

	add('$("#groups").parent("#en, #sap")', '$(selector).parent()');
	add('$("#groups").parent("div")', '$(selector).parent(selector)');

	add('$("#groups").parents("#en, #sap")', '$(selector).parents()');
	add('$("#groups").parents("div")', '$(selector).parents(selector)');

});


