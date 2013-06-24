/**
 * 通知对象，实现通知的注册和根据通知触发对应的函数，一个通知可以注册多个函数，在通知被触发的时候，所有被注册给这个通知的函数会被执行
 * 如果触发一个没有注册函数的通知名，则什么都不会执行
 * 注意：如果一个函数在注册给通知后发生了改变，那么在触发通知的时候执行的函数还是没有改变前的函数
 * 用例：
 * <code lang="javascript">
 * var funA = function(a, b) {...};
 * var funB = function(a, b) {...};
 * 
 * //可以在不同的地方给一个通知名分别注册多个函数
 * Notification.reg('a notice name', funA);
 * Notification.reg('a notice name', funB);
 * 
 * //在适当的时候触发这个通知，会依次执行funA和funB
 * Notification.fire('a notice name', ['value of a', 'value of b'], thisArg);
 * </code>
 * @class Notification
 */
var Notification = {
	
	/**
	 * 把一个函数注册给一个通知名，在使用Notification.fire()触发此通知的时候该函数会被执行
	 * @param {String} notificationName 通知名
	 * @param {Function} fn 注册给通知名的函数
	 */
	reg: function(notificationName, fn) {
		if (Notification._notificationData.hasOwnProperty(notificationName)) {
			Notification._notificationData[notificationName].push(fn);
		} else {
			Notification._notificationData[notificationName] = [fn];
		}
	},
	
	/**
	 * 触发一个通知，这个函数会遍历执行注册给这个通知名的函数
	 * @param {String} notificationName 通知名
	 * @param {Array | Obj} argArray 可选，要传递给函数的参数列表
	 * @param {Obj} thisArg 可选，函数的this指针，默认为window对象
	 */
	fire: function(notificationName, argArray, thisArg) {
		thisArg = thisArg || WIN;
		
		/* 传入的argArray可以为单个对象，这个时候把单个对象包裹在数组中 */
		if (argArray && !(argArray instanceof Array)) {
			argArray = [argArray];
		}
		var fnList = Notification._notificationData[notificationName] || [],
			i, l = fnList.length;
			
		/* 遍历执行注册给这个通知名的函数 */
		for (i = 0; i < l; i++) {
			fnList[i].apply(thisArg, argArray);
		}
	},
	
	/**
	 * 使用{通知名: [函数列表,...]}方式保存的通知名和函数的对应关系
	 * @private
	 */
	_notificationData: {}

};
