# Murloc (两栖怪)

（目前Murloc的web端兼容还在不断开发完善中，在移动端已经可以稳定使用）

## Murloc是一个轻量化的Javascript框架，以性能最大化为目标，基于以下原则进行开发

1. 代码编写为[Google Closure Compiler高级压缩](https://developers.google.com/closure/compiler/docs/api-tutorial3)优化
2. 使用jQuery接口，但不是百分百兼容
3. 轻量，尽量简化的代码设计和编写
4. 高效，减少不必要的代码执行，可以使Closure Compiler高级压缩去掉不需要执行的代码
5. 同时兼容web端（包括IE）和移动端，在保证兼容性的前提下性能优于其它js框架

## 特性

### 兼容jQuery，并做了适当简化
对常用的jQuery接口进行兼容，但是从性能和方法实现复杂度的角度考虑，对很多接口的接受的参数格式和类型做了简化，比如
jQuery的$().html()方法支持传入String和Function类型的参数，但是Murloc的$().html()方法只支持传入String类型参数。

### 性能
Murloc在编写过程中对代码性能做了很多测试和优化，性能大大超过jQuery和Zepto，非常适合于硬件相对较差的移动设备。

###  压缩
Murloc不使用其它类库中的手动或者自动的模块按需加载方式，而是把全部库代码和业务代码合并在一个文件中，并使用[Google Closure Compiler高级压缩](https://developers.google.com/closure/compiler/docs/api-tutorial3)输出最终文件，压缩器会自动去掉库文件中没有被业务代码调用的部分，实现最大压缩比（此种压缩方式下，页面最终引入的只有一个主业务JS文件）。
开发者不需要关心类库中哪些模块是无用的代码，一切交给压缩器去处理。
当然Murloc也可以使用常规压缩或者不压缩的方式来引用。

### 浏览器兼容
默认兼容webkit浏览器，并设置了IE浏览器兼容的开关变量，可以在压缩输出的时候把兼容开关变量传给压缩器。
如果关闭IE兼容，则在压缩的时候会去掉对IE的兼容代码，以此输出更少的代码，
后续打算实现可以用配置文件针对web端和移动端浏览器输出不同的js文件来实现各平台的最大优化。

### 移动端优化
在web端使用click事件，在移动端使用touch事件模拟click事件，以去掉click事件在移动浏览器中的延迟，并实现被点击对象的按压效果。

### js文件异步加载
推荐使用js文件的异步加载方式，减少对页面加载和渲染的阻塞

```html
<html>
<head>
  <title>Title</title>
	<sctipt type="text/javascript">
		var s = document.createElement('script');
		s.src = '{js_src}';
		document.getElementsByTagName('head')[0].appendChild(s);
	</script>
	<link rel="stylesheet" type="text/css" href="{css_src}" />
</head>
<body>
	...
</body>
</html>
```

## 使用Murloc的项目
* 搜狐视频移动版 http://m.tv.sohu.com
* 金山影视移动版 http://v.m.liebao.cn
* 金山毒霸网址大全移动版 http://m.duba.com
* 手机搜狐新闻页面视频播放器
