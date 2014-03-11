/**
 * 返回DOM对象相对于文档左上角的偏移
 * @return {{left:number, top:number}}
 */
$.prototype.offset =  function() {
	var element = this.context[0],
		offset = {
			left:0,
			top:0
		};

	if (element) {
		do {
			offset.left += element.offsetLeft || 0;
			offset.top += element.offsetTop  || 0;
			element = element.offsetParent;
		} while (element);
	}
	return offset;
};

$.prototype.width = function() {
	var element = this.context[0];
	return element && element.offsetWidth;
};

$.prototype.height = function() {
	var element = this.context[0];
	return element && element.offsetHeight;
};
