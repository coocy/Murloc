/**
 * 从js源文件输出HTML文档
 */

var fs = require('fs');
var template = require('./template.js');

GLOBAL.document = {};
GLOBAL.window = {
	navigator: {
		userAgent: 'NODE'
	}
};

//默认的注释标签处理方法
var tagProcessor = function(string) {
	var match = string.match(/^@([^\s]+)\s*\{(.+)\}\s*([^\s]+)?(.*)/);
	if (match) {
		return {
			'type': tagProcessors['type'](match[2]),
			'name': match[3],
			'comment': (match[4] || '').trim()
		};
	}
};

//注释标签处理方法集合
var tagProcessors = {

	'this': tagProcessor,
	'param': tagProcessor,
	'suppress': tagProcessor,

	'type': function(string) {
		return string;
	},

	'constructor': function() {
		return true;
	},

	'private': function() {
		return true;
	},

	'return': function(string) {
		var match = tagProcessor(string);
		if (match) {
			return {
				'type': match['type'],
				'comment': match['name']
			};
		}
		return match;
	}

};

fs.readFile('../src/core.js', function(err, data) {
	if (err) throw err;
	var contents = data.toString(),
		docMap = {};

	if (matches = contents.match(/([^\s]+)\s*[=:][^=;]+?function\s*\([^\)]*\)\s*\{/ig)) {

		//functions
		for (var i = 0, l = matches.length; i < l; i++) {

			var currentString = matches[i],
				index = contents.indexOf(currentString), //function代码在当前文件中的位置
				preString = contents.slice(0, index).trim(), //从当前文件开头到function代码之前的代码
				commentMatches, //匹配function对应的注释块
				methodNameMatch, //匹配function名称
				methodName = ''; //function名称

			//获取function名称
			methodNameMatch = currentString.match(/^[^\s]+/);
			if (methodNameMatch) {
				methodName = methodNameMatch[0];
			}

			//寻找function对应的注释块
			if (commentMatches = preString.match(/\/\*([^\/]|\\\/)+\s*\*\/\s*$/ig)) {
				var comment = commentMatches[0].replace(/(\/\*+|^\s*\*+\s*|\**\/$)/gm, '').trim();

				var commentArray = comment.split(/[\r\n]+/),
					commentResult = {},
					currentTag = 'description'; //当前处理的标签名称

				//逐行处理注释，把注释按类型归成数组放到commentResult中
				for (var j = 0, n = commentArray.length; j < n; j++) {
					var commentLine = commentArray[j].trim(), //当前行
						tagMatch, //匹配标签名称
						commentLineResult; //当前行处理结果

					if (tagMatch = commentLine.match(/^\s*@([^\s]+)/)) {
						currentTag = tagMatch[1].toLowerCase();
						if (currentTag in tagProcessors) {
							commentLineResult = tagProcessors[currentTag](commentLine);
							if (null === commentLineResult) {
								continue;
							}
						}
					}

					if ('description' === currentTag) {
						commentLineResult  = commentLine;
					}

					var data = commentResult[currentTag] || (commentResult[currentTag] = []);
					data.push(commentLineResult);
				}

				commentResult['description'] = (commentResult['description'] || []).join('\n');

				docMap[methodName] = commentResult;
			}

		};
		//console.log(JSON.stringify(docMap));

		var templateObj = new template({
			compressHTML: true
		});

		templateObj.parse('templates/doc/list.html', {
				'docMap': docMap
			},
			function(result) {
			    	console.log(result);
			});
	}

});
