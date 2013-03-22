
RR.fn.prototype.addClass =  function(value) {
	var classes = (value || '').match(/\S+/g) || [],
		len = classes.length;
	this.each(function(element) {
		var className = element.className;
		for  (var i = 0; i < len; i++) {
			var curClass = classes[i];
			if (className.indexOf(' '  + curClass + ' ') < 0) {
				className += ' ' + curClass;
			}
		}
		element.className = className.trim();
	});
	return this;
};

RR.fn.prototype.removeClass =  function(value) {
	
};

