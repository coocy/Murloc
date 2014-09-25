/**
 * 生成murloc.js
 */

var Compressor = require('./compress.js');

//生成未压缩文件
(new Compressor).combineJS('../src/Murloc.js', '../dist/murloc.js');

//生成压缩文件
(new Compressor).compress('../src/Murloc.js', '../dist/murloc.min.js', {
	'compilation_level': 'SIMPLE_OPTIMIZATIONS'
});
