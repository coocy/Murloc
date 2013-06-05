/**
 * 获取DOM对象的绝对偏移
 * @return {Object} 包含left和top值
 */

RR.fn.prototype.offset =  function() {
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