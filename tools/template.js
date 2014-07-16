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

var TemplateRegExps = [
	/\{(foreach|if|end):([^\}]*)\}/ig,
	/\{.+?}/ig,
];
var TemplateRegReplaces = [
	function(matched) {
		var tagMatch = matched.match(/\{\s*([^:]+)\s*:(.*)\}/i);

		if (tagMatch) {
			var tagName = tagMatch[1].toLowerCase(),
				paramString = tagMatch[2].trim();

			if (tagName in TagProcessors) {
				return TagProcessors[tagName](paramString);
			}
		}

		return '';
	},

	function(matched) {
		var tagMatch = matched.match(/^\{(.*)\}$/i),
			name = '';

		if (tagMatch) {
			var name = tagMatch[1];
		}
	    	return name;
	}
];



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

			for (var i = 0, l = TemplateRegExps.length; i < l; i++) {
				fileContent = fileContent.replace(TemplateRegExps[i], TemplateRegReplaces[i]);
			}

			console.log(fileContent);
		});
	}

};

module.exports = Template;