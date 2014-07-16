/**
 * 模板解析模块
 */

var fs = require('fs');

//注释标签处理方法集合
var TagProcessors = {

	'foreach': function(paramString) {
		var result = 'for (var ' + paramString+ ') {';
		return result;
	},

	'if': function(paramString) {
		var result = 'if (' + paramString+ ') {';
		return result;
	},

	'end': function() {
		return '}';
	}

};

/**
  把模板内容解析成语法树
  tree = [
	{
		type:'foreach',
		param:'a,b',
		block: [
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
  */
var parseContentToTree = function(content) {
	var blocks = [];
	var currentIndex = 0;
	var currentBlock = blocks;
	var blockStack = [];

	content.replace(/\{(foreach|if|end):([^\}]*)\}/ig, function() {

		var string = arguments[0],
			tagName = arguments[1],
			paramString = arguments[2],
			index = arguments[3],
			input = arguments[4],
			preTextContent,
			tagBlock;

		if (index > currentIndex) {
			preTextContent = content.slice(currentIndex, index);
			currentBlock.push({
				type:'text',
				value:preTextContent
			});
		}

		currentIndex = index + string.length;

		if ('foreach|if'.indexOf(tagName) > -1) {
			type = 'start';

			tagBlock = {
				type:tagName,
				params:paramString,
				block: []
			};

			currentBlock.push(tagBlock);
			blockStack.push(currentBlock);
			currentBlock = tagBlock.block;

		} else if ('end' === tagName) {
			currentBlock = blockStack.pop();
		}


	});

	return blocks;
};

/**
 * 替换变量
 */
var parseVariable = function(content, data) {
	var _data = data || {};
	return content.replace(/\{(.+?)}/ig, function(string, variableName) {
		return (variableName in _data) ?  _data[variableName] : '';
	});
};

/**
 * 把数据传入语法树中得到输出的片段
 */
var parseTree = function(contentTree, data) {
	var result = [];

	for (var i = 0, l = contentTree.length; i < l; i++) {
		var item = contentTree[i];
		if ('text' === item.type) {
			result.push(parseVariable(item.value, data));

		} else if ('foreach' === item.type) {

			for (var j = 0; j < 3; j++) {
				result.push(parseTree(item.block, {
					index: j
				}));
			}

		} else if ('if' === item.type) {
			result.push(parseTree(item.block, data));
		}
	}

	return result.join('');
};

/**
 * 解析模板
 */
var parseContent = function(content, data) {
	var contentTree = parseContentToTree(content);
	var result = parseTree(contentTree, data);

	console.log(result);
	return result;
};


var Template = function(options) {

};

Template.prototype = {

	parse: function(templatePath, data) {

		fs.readFile(templatePath, function(err, data) {
			if (err) {
				console.log(err);
				return;
			}

			var fileContent = data.toString();

			parseContent(fileContent);

			/*for (var i = 0, l = TemplateRegExps.length; i < l; i++) {
				fileContent = fileContent.replace(TemplateRegExps[i], TemplateRegReplaces[i]);
			}*/

			//console.log(fileContent);
		});
	}

};

module.exports = Template;