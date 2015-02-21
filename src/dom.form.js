
/**
 * 序列化一个表单对象
 * @param {boolean} returnObject 是否返回object对象，如果不传，返回一个queryString形式的字符串
 * @return {(string|Object)} 返回一个queryString形式的字符串或者object对象
 */
$.prototype.serialize = function(returnObject) {

	var result = {},
		addValue = function(key, value) {
			var item = result[key];

			if ('undefined' == typeof item) {
				result[key] = value;
			} else {
				if (item instanceof Array) {
					item.push(value);
				} else {
					result[key] = [item, value];
				}
			}
		};

	this.each(function(index, element) {
		var elementNodeName = element.nodeName;
		if ('FORM' == elementNodeName) {
			$().extend(result, $(element.elements).serialize(true));
		} else {
			var elementName = element.name,
				elementType,
				elementValue;

			if (elementName && /INPUT|SELECT|BUTTON|TEXTAREA/i.test(elementNodeName)) {
				elementType = (element.type + '').toUpperCase();
				elementName = elementName.replace(/\[\]$/, '');
				elementValue = element.value;

				if ('SELECT' === elementNodeName) {
					var opt, index = element.selectedIndex;
					if (index >= 0) {
						opt = element.options[index];
						addValue(elementName, opt.value);
					}
				} else if ('RADIO' === elementType || 'CHECKBOX' === elementType) {
					if (element['checked']) {
						addValue(elementName, elementValue);
					}
				} else {
					addValue(elementName, elementValue);
				}
			}
		}
	});

	return returnObject ? result : $.param(result);
};

/**
 * 验证一个表单
 * eg. <input type="text" name="username" required="请填写此项" length="5,20" />
 *      <input type="password" name="password" format="password" required length="5,20" />
 * @return {boolean} 表单是否通过验证，如果有多个表单，只要有一个表单验证失败即返回false
 */
$.prototype.check = function() {
	var result = true;

	this.each(function(index, element) {

		if ('FORM' == element.nodeName) {
			var elements = element.elements,
				i = 0,
				l = elements.length,
				errorMsg;

			for (;i < l; i++) {
				var inputElement = elements[i],
					required = inputElement.getAttribute('required'),
					inputValue = inputElement.value.trim(),
					inputLabel = inputElement.getAttribute('label') || inputElement.getAttribute('placeholder') || inputElement.name;

				if ('' === inputValue) { //如果值为空则检查是否必填
					if (null !== required) {
						errorMsg = required || '请填写' + inputLabel;
						if (!IsAndroid) { /* 在Android手机中不自动聚焦文本框（三星手机文本框多次聚焦后不显示光标）*/
							inputElement.focus();
						}
						break;
					}
				} else { //值不为空则检查格式
					var lengthAttr = inputElement.getAttribute('length'); //检查长度
					if (lengthAttr) {
						var valueLength = inputValue.length,
							lengthRange = lengthAttr.split(','),
							minLength = parseInt(lengthRange[0] || 0, 10),
							maxLegnth = parseInt(lengthRange[1] || 0, 10);

						if (valueLength < minLength) {
							errorMsg = inputLabel + '的长度至少' + minLength + '个字符';
						} else if (maxLegnth && valueLength > maxLegnth) {
						    	errorMsg = inputLabel + '的长度不能超过' + maxLegnth + '个字符';
						};
					}
				}
			}

			if (errorMsg) {
				$(element).showFormTip(errorMsg, 'error');
				result = false;
			}
		}
	});

	return result;
};

/**
 * 在表单中显示一条提示
 */
$.prototype.showFormTip = function(message, className) {
	return this.each(function(index, element) {
		var msgEl = $('.form_tip', element);
		if (msgEl.length < 1) {
			msgEl = $('<div class="form_tip"></p>').prependTo(element);
		}
		msgEl.attr('class', 'form_tip ' + className).html(message);
	});
}
