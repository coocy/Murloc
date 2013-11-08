# Murloc (两栖怪)

## Murloc是一个轻量化的Javascript框架，以性能最大化为目标，基于以下原则进行开发

1. 代码编写为[Google Closure Compiler高级压缩](https://developers.google.com/closure/compiler/docs/api-tutorial3)优化
2. 使用jQuery接口，但不是百分百兼容
3. 轻量，尽量简化的代码设计和编写
4. 高效，减少不必要的代码执行，可以使Closure Compiler高级压缩去掉不需要执行的代码
5. 同时兼容web端和移动端
6. 适用于在网页中异步加载Javascript文件的开发方式


##  压缩
Murloc不使用其它类库中的手动或者自动的模块按需加载方式，而是把全部库代码和业务代码合并在一个文件中，并使用[Google Closure Compiler高级压缩](https://developers.google.com/closure/compiler/docs/api-tutorial3)输出最终文件，压缩器会自动去掉库文件中没有被业务代码调用的部分，实现最大压缩比。
此种压缩方式下，页面最终引入的只有一个主业务JS文件。

## web端和移动端兼容
1. 动画，在web端使用传统帧动画，在移动端使用CSS3动画
2. 点击，在web端使用click事件，在移动端使用touch事件模拟click事件，以去掉click事件在移动浏览器中的延迟，并实现被点击对象的按压效果

## 异步加载
推荐使用JS文件的异步加载方式，减少对页面加载和渲染的阻塞

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
