/**
 * JS压缩
 */

var fs = require('fs'),
	path = require('path'),
	child = require('child_process'),
	fileName = GLOBAL.process.mainModule.filename,
	closureCompilerPath = path.resolve(path.dirname(fileName), 'bin/closure-compiler/compiler.jar');

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

var Compressor = function() {
	return this;
};

Compressor.prototype = {

	/**
	 * 获取文件扩展名
	 * @param {string} fileName 文件名
	 * @return {string} 文件扩展名
	 * @private
	 */
	_getFileExt: function(fileName) {
		return fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase();
	},

	/**
	 * 压缩文件
	 * @param {string} filePath 文件路径
	 */
	compress: function(filePath) {
		var fileExt = this._getFileExt(filePath);
		if ('js' === fileExt) {
			this.compressJS(filePath);
		}
	},

	/**
	 * 压缩js文件
	 * @param {string} filePath 文件路径
	 */
	compressJS: function(filePath) {
		filePath = path.resolve(filePath);

		var self = this;

		fs.exists(filePath, function(exists) {
			if (exists) {
				fs.readFile(filePath, function(err, data) {
					if (err) throw err;

					var fileContents  = data.toString();

					self._filePathStack.push(filePath);

					fileContents = self._compileComments(fileContents);

					var tmpFile = filePath + '.tmp',
						compressParams = {
							'compilation_level': 'SIMPLE_OPTIMIZATIONS',
							'use_types_for_optimization': '',
							'output_wrapper': '"(function(){%output%})()"',
							'js': tmpFile
						},
					compressParamsArray = [],
					paramName,
					paramValue;

					//处理压缩参数
					for (var j = self._compressParams.length; j; j--) {
						compressParams = extend(compressParams, self._compressParams[j - 1]);
					}

					for (paramName in compressParams) {
						paramValue = compressParams[paramName];
						if (paramValue instanceof Array) {
							for (var i = 0, j = paramValue.length; i < j; i++) {
								compressParamsArray.push('--' + paramName + ' ' + paramValue[i]);
							}
						} else {
							compressParamsArray.push('--' + paramName + ' ' + paramValue);
						}
					}

					//写入临时文件，用于压缩
					fs.writeFile(tmpFile, fileContents, function(err) {
					    if (err) {
					        console.log(err);
					    } else {

					    		//调用压缩工具
							compressCommand = 'java -jar ' + closureCompilerPath + ' ' + compressParamsArray.join(' ');
							child.exec(compressCommand, function (error, stdout, stderr) {
								fs.unlink(tmpFile);
								if (error !== null) {
									console.log(error);
								} else {
									console.log('Compress success!');
									console.log(stdout);
								}
							});

					    }
					});

				});
			}
		});
	},

	/**
	 *包含文件使用这个路径栈来避免递归包含
	 * @type {Array}
	 * @private
	 */
	_filePathStack: [],

	/**
	 * 从文件注释中解析的压缩参数
	 * @type {Array}
	 * @private
	 */
	_compressParams: [],

	/**
	 * 需要从源码中解析的传给压缩器的参数字典
	 * @type {Array}
	 * @private
	 */
	_compressParamsKeys: [
		'compilation_level', //[WHITESPACE_ONLY | SIMPLE_OPTIMIZATIONS | ADVANCED_OPTIMIZATIONS]
		'js_output_file',
		'charset',
		'define',
		'externs',
		'extra_annotation_name',
		'formatting', //[pretty_print | print_input_delimiter | single_quotes]
		'use_types_for_optimization',
		'output_wrapper'
	],

	/**
	 * 解析源码的注释
	 * @param {string} fileContents 文件文本内容
	 * @private
	 */
	_compileComments: function(fileContents) {

		var currentFilePath = this._filePathStack[this._filePathStack.length - 1],
			self  = this;

		fileContents = fileContents.replace(/\/\*[\s\S]+?\*\//ig, function(comment) {

			//处理压缩指令
			var commentArray = comment.split(/[\r\n]+/),
				compressParams = {},
				paramsLength = 0;

			//逐行处理注释，得到压缩指令
			for (var j = 0, n = commentArray.length; j < n; j++) {
				var commentLine = commentArray[j].replace(/(\/\*+|^\s*\*+\s*|^\s*\/{2,}\s*|\**\/$)/gm, '').trim(), //当前行
					paramMatch,
					paramName,
					paramvalue;

				if (paramMatch = commentLine.match(/@([^\s]+)\s*([^@\s]*)/)) {
					paramName = paramMatch[1].trim().toLowerCase();
					paramvalue = paramMatch[2].trim();

					if (self._compressParamsKeys.indexOf(paramName) > -1) {
						if ('define' == paramName) {
							if (paramvalue.indexOf('=') < 0) {
								continue;
							}
							var _paramvalue = compressParams[paramName] || [];
							_paramvalue.push(paramvalue);
							paramvalue = _paramvalue;
						}
						compressParams[paramName] = paramvalue;
						paramsLength++;
					}
				}
			}

			if (paramsLength > 0) {
				self._compressParams.push(compressParams);
			}

			//处理文件包含，得到合并后的文件内容
			comment = comment.replace(/@requires\s+([^\s]+)/ig, function(input, requiredFile) {

				var requiredFilePath = path.resolve(path.dirname(currentFilePath), requiredFile);

				if (
					(self._filePathStack.indexOf(requiredFilePath) > -1) || //对包含文件使用一个路径栈来避免递归包含
					('js' !==  self._getFileExt(requiredFilePath)) //只能包含js文件
				) {
					return '';
				}

				if (fs.existsSync(requiredFilePath)) {

					self._filePathStack.push(requiredFilePath);

					var requiredFileContent = fs.readFileSync(requiredFilePath);
					requiredFileContent = self._compileComments(requiredFileContent.toString());

					self._filePathStack.pop();

					return 'File: ' + requiredFile + '\r\n */\r\n' + requiredFileContent + '\r\n/**';
				}
				return '';
			});

			return comment;
		});

		return fileContents;
	}

};

if (process.argv.length > 2) {
	var fileNames = process.argv.slice(2);
	for (var i = 0, j = fileNames.length; i < j; i++) {
		var filePath = fileNames[i].trim();
		(new Compressor).compress(filePath);
	}
}