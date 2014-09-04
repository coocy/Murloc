/**
 * 模板解析模块
 */

var fs = require('fs'),
	path = require('path');

/**
 * 简单判断一个对象是否是Object结构
 * @param {*} obj
 * @return {boolean}
 */
var isObject = function(obj) {
	return ('[object Object]' === {}.toString.call(obj)) && !!obj;
};

/**
 * 深复制一个数组或者对象
 * @param {(Array|Object)} dest
 * @return {(Array|Object)}
 */
var copy = function(dest) {
	if (dest instanceof Array) {
		var result = [];
		for (var i = 0, l = dest.length; i < l; i++) {
			result[i] = copy(dest[i]);
		}
		return result;
	} else if (isObject(dest)) {
		return extend({}, dest);
	}
	return dest;
};

/**
 * 扩展一个Object对象，也可以用来复制一个对象
 * @param {Object} dest
 * @param {Object} source
 * @return {Object}
 */
var extend = function(dest, source) {
	var property, item;
	for (var property in source) {
		item = source[property];
		dest[property] = isObject(item) ? extend({}, item) : copy(item);
	}
	return dest;
};

/**
 * 变量过滤器方法 {variable|string}
 */
var StringModifiors = {

	'lower': function(string) {
		return string.toLowerCase();
	},

	'upper': function(string) {
		return string.toUpperCase();
	},

	'url': function(string) {
		return encodeURIComponent(string);
	},

	'urldecode': function(string) {
		return decodeURIComponent(string);
	},

	'string': function(string) {
		if (isObject(string) || (string instanceof Array)) {
			string = JSON.stringify(string);
		}
		return string;
	},

	'html': function(string) {
		return string.replace('<', '&lt;').replace('>', '&gt;');
	},

	'join': function(array, string) {
		if ((array instanceof Array)) {
			array = array.join(string || ',');
		}
		return array;
	}

};

/**
 * 使用keyPath获取一个Object对象的值
 * @param {Object} obj
 * @param {String} keyPath
 * @return {*}
 */
var getObjValueForKeyPath = function(obj, keyPath) {
	var obj = obj || {},
		_obj = obj,
		pathMatch = keyPath.match(/(^\w+|\[[^\]]*\]|\.[^\.\[]+)/g),
		key;

	for (var i = 0, l = pathMatch.length; i < l; i++) {

		if (!isObject(obj)) {
			return undefined;
		}

		key = pathMatch[i].trim().replace(/^[\.\[][\'\"]?|[\'\"]?\]$/g, '').trim();

		if (key in obj) {
			obj = obj[key];
		} else {
			return undefined;
		}

	}

	return obj;
};


var Template = function(options) {
	this.options = extend({
		compressHTML: false
	}, options);

	return this;
};

Template.prototype = {

	/**
	 * @param {string} templatePath 模板路径
	 * @param {Object=} templateData 需要加入到模板的数据 (可选)
	 * @param {Function=} callback 解析后的回调函数，接收content参数
	 */
	parse: function(templatePath, templateData, callback) {

		this._templatesPathStack.push(path.resolve(templatePath));

		var self = this;

		fs.readFile(templatePath, function(err, fileData) {
			if (err) {
				console.log(err);
				return;
			}
			var result = self._parseContent(fileData.toString(), templateData);
			callback && callback(result);
		});
	},

	/**
	 *包含文件使用这个路径栈来避免递归包含
	 * @type {Array}
	 * @private
	 */
	_templatesPathStack: [],

	/**
	 * 语法标签处理方法集合
	 * @type {Object}
	 * @private
	 */
	_tagProcessors: {

		// 解析foreach标签 {foreach: obj, key, value}...{end:}
		'foreach': function(paramString) {
			var result = {},
				params = paramString.split(','),
				objName = params[0].trim(),
				objKey = (params[1] || '').trim() || '_key',
				objValue = (params[2] || '').trim() ||'_value' ;

			if (params.length < 3) {
				objValue = objKey;
				objKey = '_key';
			}

			return {
				name: objName,
				key: objKey,
				value: objValue
			};
		},

		// 解析if标签 {if: varA==varB}...{end:}
		'if': function(paramString) {
			var conditionString = paramString.replace(/(\W|^)(\.?\w+[^\s\(]*)/g, function(input, useless, variableName) {
				if (
					variableName.match(/^(Function|Number|Array|String|Boolean|Math|window)(\.[^\s]+)?/) ||
					variableName.match(/new|Date|RegExp|undefined|null|Infinity|NaN|true|false|(\.[0-9]+)?[0-9]+/)
				) {
					return variableName;
				}
				return 'getObjValueForKeyPath(data, "' + variableName+ '")';
			});

			var conditionFn = new Function('data', 'getObjValueForKeyPath','return (' + conditionString + ')');

			return {
				conditionFn: conditionFn
			};
		},

		// 解析包含文件标签 {include: file="_footer.html" title="a \'bc" docMapA=docMap}
		'include': function(paramString) {

			var paramsMatch = paramString.match(/\w+\s*=\s*(([\"\'])(([^\'\"]|\\'|\\")*)\2|([^\s]+))/g),
				params = {},
				paramName,
				paramValue,
				block = [];

			if (paramsMatch) {

				for (var i = 0, l = paramsMatch.length; i < l; i++) {
					var item = paramsMatch[i],
						itemMatch = item.match(/(\w+)\s*=\s*(([\"\'])(([^\'\"]|\\'|\\")*)\3|([^\s]+))/),
						key,
						value;

						if (itemMatch) {
							key = itemMatch[1];
							value = itemMatch[4]; // String value
							if (undefined === value) {
								value = (function(variableName) {
									return function(data) {
									    return getObjValueForKeyPath(data, variableName);
									};
								})(itemMatch[6]); // Variable value
							} else {
								value = value.replace(/\\([\'\"])/, '$1');
							}

							params[key] = value;
						}

				}
			}

			if ('file' in params) {

				var currentTemplatesPath = this._templatesPathStack[this._templatesPathStack.length - 1],
					file = path.resolve(path.dirname(currentTemplatesPath), params['file']),
					fileContent = '';

				// 对包含文件使用一个路径栈来避免递归包含
				if (this._templatesPathStack.indexOf(file) > -1) {
					return '';
				}

				delete params.file;

				if (fs.existsSync(file)) {

					this._templatesPathStack.push(file);

					fileContent = fs.readFileSync(file);
					block = this._parseContentToTree(fileContent.toString());

					this._templatesPathStack.pop();

					return {
						data: params,
						block: block
					};
				}
			}

			return null;
		}

	},

	/**
	 * 解析模板
	 * @param {string} content 模板内容
	 * @param {Object=} data 需要加入到模板的数据 (可选)
	 * @return {string} 解析结果
	 * @private
	 */
	_parseContent:  function(content, data) {
		var contentTree = this._parseContentToTree(content),
			result = this._parseTree(contentTree, data);

		//压缩html
		if (true === this.options.compressHTML) {
			// result = result.replace(/<!\-\-\s*[^\[].*?\-\->/ig, '')
			// 	.replace(/[\r\n\t]/g, '');
		}
		return result;
	},

	/**
	  把模板解析成语法树：
	  tree = [
		{
			type:'foreach',
			operation: {
				name: "name",
				key: "key",
				value: "value"
			}
			block: [
				{
					type:'variable',
					name:'key',
					value:'123'
				},
				...
			]
			elseBlock: []
		},
		{
			type:'if',
			conditionFn: function() {
				...
			},
			block: [
				{
					type:'variable',
					name:'key',
					value:'123'
				},
				...
			],
			elseBlock: [
				{
					type:'variable',
					name:'key',
					value:'123'
				},
				...
			]
		},
		{
			type:'variable',
			name:'key',
			value:'123'
		},
		...

	  ]

	  * @param {string} content 模板内容
	  * @return {Array} 解析后的语法树
	  * @private
	  */
	_parseContentToTree: function(content) {
		var blocks = [],
			currentIndex = 0,
			currentBlock = blocks,
			blockStack = [],
			tagBlock,
			self = this;

		content.replace(/\s*\{(foreach|if|include|else|end):?([^\}]*)\}/ig, function() {

			var string = arguments[0],
				tagName = arguments[1],
				paramString = arguments[2],
				index = arguments[3],
				preTextContent;

			if (index > currentIndex) {
				preTextContent = content.slice(currentIndex, index);
				currentBlock.push({
					type:'text',
					value:preTextContent
				});
			}

			currentIndex = index + string.length;

			if ('foreach|if'.indexOf(tagName) > -1) {
				tagBlock = {
					type:tagName,
					operate:  self._tagProcessors[tagName].call(self, paramString),
					block: [],
					elseBlock: []
				};

				currentBlock.push(tagBlock);
				blockStack.push(currentBlock);
				currentBlock = tagBlock.block; // 进入深一层block

			} else if ('include' === tagName) {
				var includeData = self._tagProcessors[tagName].call(self, paramString);
				if (includeData) {

					var includeBlock = {
						type:tagName,
						data:  includeData.data,
						block: includeData.block
					};

					currentBlock.push(includeBlock);
				}

			} else if ('else' === tagName) {
				blockStack.pop();
				currentBlock = tagBlock.elseBlock;
				blockStack.push(currentBlock);

			} else if ('end' === tagName) {
				currentBlock = blockStack.pop(); // 返回上一层block
			}

		});

		if (currentIndex < content.length) {
			currentBlock.push({
				type:'text',
				value:content.slice(currentIndex)
			});
		}

		return blocks;
	},

	/**
	 * 把数据传入语法树中得到输出的片段
	 * @param {Array} contentTree 语法树
	 * @param {Object=} data 需要加入到模板的数据 (可选)
	 * @private
	 */
	_parseTree: function(contentTree, data) {

		var result = [];
		data = data || {};

		for (var i = 0, l = contentTree.length; i < l; i++) {
			var item = contentTree[i];
			if ('text' === item.type) {
				result.push(this._parseVariable(item.value, data));

			} else if ('foreach' === item.type) {

				var objName = item.operate.name,
					objKey = item.operate.key,
					objValue = item.operate.value,

					obj = getObjValueForKeyPath(data, objName),
					key;

				if ('string' === typeof obj) {
					for (var m = 0, n = obj.length; m < n; m++) {
						data[objKey] = m;
						data[objValue] = obj.charAt(m);
						result.push(this._parseTree(item.block, data));
					}
				} else if (obj instanceof Array) {
					for (var m = 0, n = obj.length; m < n; m++) {
						data[objKey] = m;
						data[objValue] = obj[m];
						result.push(this._parseTree(item.block, data));
					}
				} else if (isObject(obj)) {
					for (key in obj) {
						data[objKey] = key;
						data[objValue] = obj[key];
						result.push(this._parseTree(item.block, data));
					}
				}

			} else if ('if' === item.type) {

				var conditionResult = item.operate.conditionFn(data, getObjValueForKeyPath);
				result.push(this._parseTree(conditionResult ? item.block : item.elseBlock, data));

			} else if ('include' === item.type) {
				var itemData = {};
				for (var key in item.data) {
					var itemValue = item.data[key];
					if ('function' === typeof itemValue) {
						itemData[key] = itemValue(data);
					} else {
						itemData[key] = itemValue;
					}
				}

				result.push(this._parseTree(item.block, extend(data, itemData)));
			}
		}

		return result.join('');
	},

	/**
	 * 替换变量，把模板中的变量名替换成data对象中对应keyPath的值
	 * @private
	 */
	_parseVariable: function(content, data) {
		var _data = data || {};
		return content.replace(/\{([^:]+?)(\|(.+))?}/ig, function(string, variableName, useless, modifiers) {
			var result = getObjValueForKeyPath(_data, variableName);

			if (modifiers) {
				var args = modifiers.split('|');
				modifiers = args.shift();
				if (modifiers in StringModifiors) {
					args.unshift(result);
					result = StringModifiors[modifiers].apply(result, args);
				}
			}

			if (undefined === result || null === result) {
				result = '';
			}

			return result;
		});
	}

};

module.exports = Template;
