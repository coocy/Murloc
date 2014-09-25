/**
 * JS和css压缩
 */

var fs = require('fs'),
	path = require('path'),
	child = require('child_process'),
	fileName = GLOBAL.process.mainModule.filename,
	currentFileDir = path.dirname(fileName),
	closureCompilerPath = path.resolve(currentFileDir, 'bin/closure-compiler/compiler.jar'),
	yuiCompilerPath = path.resolve(currentFileDir, 'bin/yuicompressor/yuicompressor-2.4.6.jar'),
	tempDir = currentFileDir;

/**
 * 简单判断一个对象是否是Object结构
 * @param {*} obj
 * @return {boolean}
 */
var isObject = function(obj) {
	return ('[object Object]' === {}.toString.call(obj)) && !!obj;
};

/**
 * 判断一个对象是否是一个方法
 * @param {*} obj
 * @return {boolean}
 */
var isFunction = function(obj) {
	return ({}.toString).call(obj) === '[object Function]';
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
		dest[property] = isObject(item) ? extend( (isObject(dest[property]) ? dest[property] : {} ), item) : copy(item);
	}
	return dest;
};

/**
 * 格式化文件大小数字
 * @param {Number} size
 * @return {string}
 */
var formatSize = function(size) {
	var sizeText;
	if (size >= Math.pow(1024, 2)) {
		//M或以上的单位
		sizeText = Math.round(size / 1024 / 1024 * 10) / 10 + 'M';
	} else {
		//M以下的单位
		sizeText = Math.round(size / 1024 * 100) / 100 + 'k';
	}
	return sizeText;
};

var getRandomName = function(length) {
	var string = 'abcdefghijklmnopqrstuvwxyz123456789-_ABCDEFGHIJKLMNOPQRSTUVWXYZ',
		stringLength = string.length,
		result = [],
		i = 0,
		pos;

	for (;i < length; i++) {
		pos = Math.floor(Math.random() * stringLength);
		result.push(string.slice(pos, pos + 1));
	}
	return result.join('');
};

var Compressor = function() {
	return this;
};

Compressor.prototype = {

	/**
	 * 包含文件的起始目录，默认为当前脚本的目录
	 * @type {string}
	 */
	baseDir: currentFileDir,

	setBaseDir: function(baseDir) {
		this.baseDir = baseDir;
		return this;
	},

	/**
	 * 压缩文件
	 * @param {string} filePath 文件路径
	 * @param {string=} outputPath 压缩输出的文件路径
	 */
	compress: function(filePath, outputPath, options) {

		options = options || {};

		if (isObject(outputPath)) {
			options = outputPath;
			outputPath = null;
		} else if (outputPath) {
			options['js_output_file'] = outputPath;
		}

		this.options = options;

		var fileExt = this._getFileExt(filePath);
		if ('js' === fileExt) {
			this.compressJS(filePath, outputPath);
		}else if ('css' === fileExt) {
			this.compressCSS(filePath, outputPath);
		}
	},

	/**
	 * 压缩一段js代码
	 * @param {string} content js代码
	 * @param {Function} callback 回调函数，接收压缩结果
	 */
	compressJSContent: function(content, callback) {

		var useBaseDir = false;
		if (this._filePathStack.length < 1) {
			this._filePathStack.push(this.baseDir);
			useBaseDir = true;
		}
		content = this._compileJSComments(content);
		useBaseDir && this._filePathStack.pop();

		//生成随机文件名作为压缩工具的输入文件
		var tmpFilePath;
		do {
			tmpFilePath = tempDir + '/' + getRandomName(5) + '.tmp.js';
		} while (fs.existsSync(tmpFilePath));

			//默认压缩参数
		var compressParams = {
				'compilation_level': 'SIMPLE_OPTIMIZATIONS', //[WHITESPACE_ONLY | SIMPLE_OPTIMIZATIONS | ADVANCED_OPTIMIZATIONS]
				'use_types_for_optimization': '',
				'tracer_mode': 'ALL',
				'js': tmpFilePath
			},
			compressParamsArray = [],
			paramName,
			paramValue,
			i = this._compressParams.length;

		//合并从源码中解析得到的压缩参数，合并顺序为按包含的层级从内向外合并（即外层的参数会覆盖内层的参数）
		while (i--) {
			var param = this._compressParams[i];
			compressParams = extend(compressParams, param);
		}

		//高级压缩下默认加上output_wrapper
		if ('ADVANCED_OPTIMIZATIONS' === compressParams['compilation_level'] && !compressParams['output_wrapper']) {
			compressParams['output_wrapper'] = '"(function(){%output%})()"';
		}

		if ('' === compressParams['js_output_file']) {
			delete compressParams['js_output_file'];
		}

		//合并调用方法时候传入的压缩参数
		compressParams = extend(compressParams, this.options);

		this._compressParams = [];

		//用合并后的压缩参数集合生成最终的参数字符串
		for (paramName in compressParams) {
			paramValue = compressParams[paramName];
			if (isObject(paramValue)) {
				for (var _key in paramValue) {
					compressParamsArray.push('--' + paramName + ' ' + _key + '=' + paramValue[_key]);
				}
			} else {
				compressParamsArray.push('--' + paramName + ' ' + paramValue);
			}
		}

		//写入临时文件，用于压缩
		fs.writeFile(tmpFilePath, content, function(err) {
			if (err) {
				if (callback) {
					callback(err, null, null);
				} else {
					console.log(err);
				}
		    } else {

				var fsStats = fs.statSync(tmpFilePath),
					originalSize = fsStats.size;

		    		//调用压缩工具
				compressCommand = 'java -jar ' + closureCompilerPath + ' ' + compressParamsArray.join(' ');
				child.exec(compressCommand, function (error, stdout, stderr) {
					fs.unlink(tmpFilePath);
					if (callback) {
						callback(error, stdout, stderr);
					} else {
						if (error !== null) {
							console.log(error);
						} else {
							stdout = (stdout + '').trim();
							if ('' != stdout) {
								console.log(stdout + '\r\n');
							}

							//文件大小压缩统计
							if (stderr) {
								var sizeMatch = stderr.match(/Estimated Size.+?([0-9]+)/i),
									gzSizeMatch = stderr.match(/Estimated GzSize.+?([0-9]+)/i);

								if (sizeMatch) {

									var compiledSize = parseFloat(sizeMatch[1]),
										gzSize = parseFloat(gzSizeMatch[1]),
										reduction = originalSize  - compiledSize,
										sizeResult = [
											'// == Compilation Result ==',
											'// Original Size: ' + formatSize(originalSize),
											'// Compiled Size: ' + formatSize(compiledSize) + ' (Saved ' + Math.round(reduction / originalSize * 10000) / 100 + '% off)',
											'// GZipped Size: ' + formatSize(gzSize)
										].join("\r\n");

									console.log(sizeResult);
								}
							}
						}
					}
				});

		    }
		});
	},

	/**
	 * 合并js文件（把js文件中的@requires替换为文件内容）
	 * @param {string} filePath 文件路径
	 * @param {string=} outputPath 压缩文件保存路径
	 */
	combineJS: function(filePath, outputPath, callback) {
		filePath = path.resolve(filePath);

		if (isFunction(outputPath)) {
			callback = outputPath;
			outputPath = null;
		}

		var self = this;

		fs.exists(filePath, function(exists) {
			if (exists) {
				fs.readFile(filePath, function(err, data) {
					if (err) throw err;

					var fileContents  = data.toString();

					self._filePathStack.push(filePath);
					fileContents = self._compileJSComments(fileContents);
					self._filePathStack.pop();

					if (outputPath) {
						fs.writeFile(outputPath, fileContents);
					} else {
						if (callback) {
							callback(fileContents);
						} else {
							console.log(fileContents);
						}
					}

				});
			}
		});
	},

	/**
	 * 压缩一个js文件
	 * @param {string} filePath 文件路径
	 * @param {string=} outputPath 压缩文件保存路径
	 */
	compressJS: function(filePath, outputPath) {
		filePath = path.resolve(filePath);

		var self = this;

		fs.exists(filePath, function(exists) {
			if (exists) {
				fs.readFile(filePath, function(err, data) {
					if (err) throw err;

					if (outputPath) {
						self._compressParams.push({
							'js_output_file': path.resolve(path.dirname(filePath), outputPath)
						});
					}

					var fileContents  = data.toString();

					self._filePathStack.push(filePath);
					fileContents = self._compileJSComments(fileContents);
					self._filePathStack.pop();

					self.compressJSContent(fileContents);

				});
			}
		});
	},

	/**
	 * 压缩一段css代码
	 * @param {string} content css代码
	 * @param {Function} callback 回调函数，接收压缩结果
	 */
	compressCSSContent: function(content, callback) {

		var useBaseDir = false;
		if (this._filePathStack.length < 1) {
			this._filePathStack.push(this.baseDir);
			useBaseDir = true;
		}
		content = this._compileCSSComments(content);
		useBaseDir && this._filePathStack.pop();

		//生成随机文件名作为压缩工具的输入文件
		var tmpFilePath;
		do {
			tmpFilePath = tempDir + '/' + getRandomName(5) + '.tmp.css';
		} while (fs.existsSync(tmpFilePath));

			//默认压缩参数
		var compressParams = {
			},
			compressParamsArray = [],
			paramName,
			paramValue,
			i = this._compressParams.length;

		//合并从源码中解析得到的压缩参数，合并顺序为按包含的层级从内向外合并（即外层的参数会覆盖内层的参数）
		while (i--) {
			var param = this._compressParams[i];
			compressParams = extend(compressParams, param);
		}

		this._compressParams = [];

		//用合并后的压缩参数集合生成最终的参数字符串
		for (paramName in compressParams) {
			paramValue = compressParams[paramName];
			compressParamsArray.push('-' + paramName + ' ' + paramValue);
		}

		compressParamsArray.push(tmpFilePath);

		//写入临时文件，用于压缩
		fs.writeFile(tmpFilePath, content, function(err) {
			if (err) {
				if (callback) {
					callback(err, null, null);
				} else {
					console.log(err);
				}
		    } else {

				var fsStats = fs.statSync(tmpFilePath),
					originalSize = fsStats.size;

		    		//调用压缩工具
				compressCommand = 'java -jar ' + yuiCompilerPath + ' ' + compressParamsArray.join(' ');
				child.exec(compressCommand, function (error, stdout, stderr) {
					fs.unlink(tmpFilePath);
					if (callback) {
						callback(error, stdout, stderr);
					} else {
						if (error !== null) {
							console.log(error);
						} else {
							stdout = (stdout + '').trim();
							if ('' != stdout) {
								console.log(stdout + '\r\n');
							}

							if (compressParams['o']) {
								var fsStats = fs.statSync(compressParams['o']),
									compiledSize = fsStats.size;
							}

							//文件大小压缩统计
							var compiledSize = compiledSize || stdout.length,
								reduction = originalSize  - compiledSize,
								sizeResult = [
									'// == Compilation Result ==',
									'// Original Size: ' + formatSize(originalSize),
									'// Compiled Size: ' + formatSize(compiledSize) + ' (Saved ' + Math.round(reduction / originalSize * 10000) / 100 + '% off)'
								].join("\r\n");

							console.log(sizeResult);
						}
					}
				});

		    }
		});
	},

	/**
	 * 压缩一个css文件
	 * @param {string} filePath 文件路径
	 * @param {string=} outputPath 压缩文件保存路径
	 */
	compressCSS: function(filePath, outputPath) {
		filePath = path.resolve(filePath);

		var self = this;

		fs.exists(filePath, function(exists) {
			if (exists) {
				fs.readFile(filePath, function(err, data) {
					if (err) throw err;

					if (outputPath) {
						self._compressParams.push({
							'o': path.resolve(path.dirname(filePath), outputPath)
						});
					}

					var fileContents  = data.toString();

					self._filePathStack.push(filePath);
					fileContents = self._compileCSSComments(fileContents);
					self._filePathStack.pop();

					self.compressCSSContent(fileContents);

				});
			}
		});
	},


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
	 * 解析js源码的注释
	 * @param {string} fileContents 文件文本内容
	 * @return {string} 解析后的文本内容
	 * @private
	 */
	_compileJSComments: function(fileContents) {

		var currentFilePath = this._filePathStack[this._filePathStack.length - 1],
			self  = this;

		fileContents = fileContents.replace(/\/\*[\s\S]+?\*\//ig, function(comment) {

			//处理压缩指令
			var commentArray = comment.split(/[\r\n]+/),
				result = [],
				compressParams = {},
				paramsLength = 0,
				blankLineCount = 0;

			//逐行处理注释，得到压缩指令
			for (var j = 0, n = commentArray.length; j < n; j++) {
				var commentLine = commentArray[j],
					commentContent = commentLine.replace(/(\/\*+|^\s*\*+\s*|^\s*\/{2,}\s*|\*+\/$)/gm, '').trim(), //当前行
					paramMatch,
					paramName,
					paramvalue;

				//多个重复的空行只保留一个空行
				if (commentLine.match(/^\s*\**\s*$/)) {
					blankLineCount++;
				}
				if (blankLineCount > 1) {
					blankLineCount = 0;
					continue;
				}

				if (commentContent.match(/ClosureCompiler/i)) {
					continue;
				}

				if (paramMatch = commentContent.match(/@([^\s]+)\s*([^@\s]*)/)) {
					paramName = paramMatch[1].trim().toLowerCase();
					paramvalue = paramMatch[2].trim();

					if (self._compressParamsKeys.indexOf(paramName) > -1) {
						if ('define' == paramName) {
							if (paramvalue.indexOf('=') < 0) {
								result.push(commentLine);
								continue;
							}
							var _paramvalue = compressParams[paramName] || {},
								eqPos = paramvalue.indexOf('='),
								_key = paramvalue.slice(0, eqPos).trim(),
								_value = paramvalue.slice(eqPos + 1).trim();

							_paramvalue[_key] = _value;
							paramvalue = _paramvalue;
						}
						compressParams[paramName] = paramvalue;
						paramsLength++;
					} else {
						result.push(commentLine);
					}
				} else {
					result.push(commentLine);
				}
			}

			if (!compressParams['js_output_file']) {
				compressParams['js_output_file'] = '';
			}

			if (paramsLength > 0) {
				self._compressParams.push(compressParams);
			}

			comment = result.join('\r\n');

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
					requiredFileContent = self._compileJSComments(requiredFileContent.toString());

					self._filePathStack.pop();

					return 'File: ' + requiredFile + '\r\n */\r\n\r\n' + requiredFileContent + '\r\n/**';
				}
				return '';
			});

			return comment;
		});

		return fileContents;
	},


	/**
	 * 解析css源码的注释
	 * @param {string} fileContents 文件文本内容
	 * @return {string} 解析后的文本内容
	 * @private
	 */
	_compileCSSComments: function(fileContents) {

		var currentFilePath = this._filePathStack[this._filePathStack.length - 1],
			self  = this;


		//处理文件包含，得到合并后的文件内容
		fileContents = fileContents.replace(/@import\s+([^\s]+)/ig, function(input, requiredFile) {

			requiredFile = requiredFile.replace(/^url\(|\)$/ig, '').replace(/^["']|["']$/g, '');
			var requiredFilePath = path.resolve(path.dirname(currentFilePath), requiredFile);

			if (
				(self._filePathStack.indexOf(requiredFilePath) > -1) || //对包含文件使用一个路径栈来避免递归包含
				('css' !==  self._getFileExt(requiredFilePath)) //只能包含css文件
			) {
				return '';
			}

			if (fs.existsSync(requiredFilePath)) {

				self._filePathStack.push(requiredFilePath);

				var requiredFileContent = fs.readFileSync(requiredFilePath);
				requiredFileContent = self._compileCSSComments(requiredFileContent.toString());

				self._filePathStack.pop();

				return '/* File: ' + requiredFile + '\r\n */\r\n' + requiredFileContent + '\r\n';
			}
			return '';
		});

		return fileContents;
	}

};

module.exports = Compressor;

if (process.argv.length > 2) {
	var fileNames = process.argv.slice(2);
	for (var i = 0, j = fileNames.length; i < j; i++) {
		var filePath = fileNames[i].trim();
		(new Compressor).compress(filePath);
	}
}