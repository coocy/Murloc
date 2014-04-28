
var codeGroups = [];

var test = function(title, fn) {
	var testMatch = location.href.match(/t=([^&]+)/),
		testName;
	if (testMatch) {
		if (title !== decodeURIComponent(testMatch[1])) {
			return;
		}
	}
	codeGroups.push([title, fn]);
};
var add;

window.onload = function() {

	var jsTools = {
		'Murloc': '../../src/Murloc.js',
		'jQuery 1.10.2': 'libs/jquery-1.10.2.js',
		'jQuery 2.0.3': 'libs/jquery-2.0.3.js',
		'Zepto 1.1.3': 'libs/zepto-1.1.3.js'
	};

	var wrapHTML = [
		'<h1 id="qunit-header"><a href="./">' + document.title + '</a> </h1>',

		'<table id="code_table"></table>'
	];
	document.getElementById('speed').innerHTML = wrapHTML.join('');

	var codeTable = document.getElementById('code_table'),
		i = 0,
		l = codeGroups.length,
		jsToolName,
		elTHead,
		elRow,
		elCell,
		elFrame,
		code,
		jsToolsCount = 0;

	add = 	function(fn, title) {
		//Test row
		elRow = document.createElement('tr');
		elRow.isTest = true;
		code = codeGroups[i][1];

		elCell = document.createElement('td');
		elCell.className = 'c1';
		elCell.innerHTML = title || fn;
		elRow.appendChild(elCell);

		for (jsToolName in jsTools) {
			elCell = document.createElement('td');
			elCell.code = fn;
			elCell.jsToolName = jsToolName;

			elRow.appendChild(elCell);
		}

		codeTable.appendChild(elRow);
	};

	//First row
	elRow = document.createElement('tr');
	elCell = document.createElement('th');
	elRow.appendChild(elCell);

	for (jsToolName in jsTools) {
		elCell = document.createElement('th');
		elCell.innerHTML = jsToolName;
		elRow.appendChild(elCell);

		elFrame = document.createElement('iframe');
		elFrame.src = 'test_page.html?js=' + encodeURIComponent(jsTools[jsToolName]);
		elFrame.style.display = 'none';
		elFrame.name = jsToolName;
		document.body.appendChild(elFrame);
		jsToolsCount++;
	}
	elTHead = document.createElement('thead');
	elTHead.appendChild(elRow);
	codeTable.appendChild(elTHead);

	for (; i < l; i++) {

		//Group
		elRow = document.createElement('tr');
		elCell = document.createElement('th');
		elCell.setAttribute('colspan', jsToolsCount + 1);
		elCell.innerHTML = '<a href="?t=' + encodeURIComponent(codeGroups[i][0]) + '">' + codeGroups[i][0] + '</a>';
		elRow.appendChild(elCell);
		codeTable.appendChild(elRow);

		codeGroups[i][1]();
	}

	var testRound = 3000;

	if (window.screen.width < 800) {
		//testRound = 1000;
	}

	var testRows = [];

	var testRowFn = function() {

		var elRow = testRows.shift();

		if (!elRow) return;

		var times = [],
			elCells = elRow.getElementsByTagName('td');

		for (var j  = 0, n = elCells.length; j < n; j++) {
			elCell = elCells[j];
			var _code = elCell.code,
				_jsToolName = elCell.jsToolName;

				if (_code) {

					var testFn  = window.frames[_jsToolName].test;

					var result = testFn(_code, testRound),
						time = result.time,
						text = 'x';

					if (!isNaN(time) && isFinite(time)) {
						times.push(time);
						text = (time + 'ms');
					}

					if (result.result) {
						text += '|' + result.result;
					}
					elCell.innerHTML = text;

					elCell.time = time;

				}
		}

		var min = Math.min.apply(this, times);
		var max = Math.max.apply(this, times);

		for (var j  = 0, n = elCells.length; j < n; j++) {
			elCell = elCells[j];
			if (elCell.code) {
				if (elCell.time == min) {
					elCell.className += ' green';
				} else if (elCell.time == max) {
					elCell.className += ' red';
				} else {
					elCell.className += ' gray';
				}
			}
		}

		setTimeout(testRowFn, 100);
	};

	var elRows = codeTable.getElementsByTagName('tr');


	for (i = 0, l = elRows.length; i < l; i++) {

		elRow = elRows[i];
		if (elRow.isTest) {
			testRows.push(elRow);
		}

	}

	setTimeout(testRowFn, 1000);

}