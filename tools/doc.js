/**
 * 从js源文件输出HTML文档
 */

var fs = require('fs'),
	path = require('path'),
	template = require('./template.js'),
	fileName = GLOBAL.process.mainModule.filename,
	currentFileDir = path.dirname(fileName),
	sourceFileDir = path.resolve(currentFileDir, '../src/'),
	outputDir = path.resolve(currentFileDir, '../doc/');

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

var getDocFromFile = function(fileName, callback) {
	fs.readFile(sourceFileDir + '/' + fileName, function(err, data) {
		if (err) throw err;
		var contents = data.toString(),
			docMap = {};

		if (matches = contents.match(/(([^\s]+)\s*[=:][^=;]+?function\s*\([^\)]*\)\s*\{)|(?:\$\.[^\s]+\s*=[^;]+)/ig)) {

			//console.log(matches);

			//functions
			for (var i = 0, l = matches.length; i < l; i++) {

				var currentString = matches[i],
					index = contents.indexOf(currentString), //function代码在当前文件中的位置
					preString = contents.slice(0, index).trim(), //从当前文件开头到function代码之前的代码
					commentMatches, //匹配function对应的注释块
					methodNameMatch, //匹配function名称
					methodName = '', //function名称
					className = '';


				var classMatches = preString.match(/@class\s+([^\s]+)/g);
				if (classMatches) {
					classMatches = classMatches.pop().match(/@class\s+([^\s]+)/);
					className = classMatches[1];
				}


				//获取function名称
				methodNameMatch = currentString.match(/^[^\s:]+/);
				if (methodNameMatch) {
					methodName = methodNameMatch[0];
				}

				if (className !== '' && methodName.indexOf(className + '.') < 0 && methodName.indexOf('$.') < 0) {
					methodName = className + '.' + methodName;
				}

				methodName = methodName.replace(/\$\.prototype\b/i, '');

				//寻找function对应的注释块
				if (commentMatches = preString.match(/\/\*([^\/]|\\\/)+\s*\*\/\s*$/ig)) {
					var comment = commentMatches[0].replace(/(\/\*+|^\s*\*+\s*|\**\/$)/gm, '').trim();

					var commentArray = comment.split(/[\r\n]+/),
						commentResult = {},
						currentTag = 'description', //当前处理的标签名称
						lastTag = currentTag;

					//逐行处理注释，把注释按类型归成数组放到commentResult中
					for (var j = 0, n = commentArray.length; j < n; j++) {
						var commentLine = commentArray[j].trim(), //当前行
							tagMatch, //匹配标签名称
							commentText = null,
							commentLineResult; //当前行处理结果

						if (tagMatch = commentLine.match(/^\s*@([^\s]+)/)) {
							currentTag = tagMatch[1].toLowerCase();
							if (currentTag in tagProcessors) {
								commentLineResult = tagProcessors[currentTag](commentLine);
								if (null === commentLineResult) {
									continue;
								}
							}
						} else {
							commentText = commentLine;
						}

						if ('description' === currentTag) {
							commentLineResult  = commentLine;
						}

						var data = commentResult[currentTag] || (commentResult[currentTag] = []);
						data = data || [];
						var dataLength = data.length;
						if (null !== commentText) {
							if (dataLength > 0) {
								var lastDataItem = data[data.length - 1];
								if ('comment' in lastDataItem) {
									lastDataItem['comment'] += '\r\n' + commentText;
								}
						}
						} else {
							data.push && data.push(commentLineResult);
						}
					}

					//二次处理
					commentResult['description'] = (commentResult['description'] || []).join('\n');

					//参数字符串
					commentResult['params'] = '';
					var prams = [],
						pramItem,
						pramName,
						pramType;
					if (commentResult['param']) {
						for (var _i = 0, _l = commentResult['param'].length; _i < _l; _i++) {
							pramItem = commentResult['param'][_i];
							pramName = pramItem['name'];
							pramType = pramItem['type'];
							if (pramType.match(/=$/)) {
								pramName = '[' + pramName + ']';
							}
							prams.push(pramName);
						}
						commentResult['params'] = prams.join(', ');
					}

					commentResult['type'] = 'function';

					if (!commentResult['private']) {
						docMap[methodName] = commentResult;
					}
				}

			};
			//console.log(JSON.stringify(docMap));
		}

		callback(fileName, docMap);

	});
};

fs.readFile(sourceFileDir + '/Murloc.js', function(err, data) {
	if (err) throw err;

	var contents = data.toString(),
		docData = {},
		fileCount = 0,
		readFileCount = 0;

	contents.replace(/@requires\s+([^\s]+)/ig, function(input, fileName) {
		if ('sizzle.js' === fileName) {
			return;
		}

		var groupName = fileName
			.replace(/\.js$/i, '')
			.replace(/(^|\.|\_)([a-z])/g, function(useless, prefix, character) {
				return (prefix == '.' ? ' ' : '') + character.toUpperCase();
			})
			.replace(/json|url/i, function(input) {
			    	return input.toUpperCase();
			});

		docData[fileName] = {
			name: groupName,
			docMap: null
		};

		fileCount++;

		getDocFromFile(fileName, function(fileName, docMap) {
			readFileCount++;

			docData[fileName].docMap = docMap;

			if (fileCount === readFileCount) {
				var templateObj = new template({
					compressHTML: true
				});

				templateObj.parse('doc/doc.html', {
					'docData': docData
				},
				function(result) {
					//console.log(result);
				    	fs.writeFile(outputDir + '/index.html', result);
				});
			}
		});


	});
});

