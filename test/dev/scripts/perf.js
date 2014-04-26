
var jsTools = {
	'Murloc': '../src/Murloc.js',
	'jQuery 1.10.2': 'scripts/lib/jquery-1.10.2.js',
	'jQuery 2.0.3': 'scripts/lib/jquery-2.0.3.js',
	'Zepto 1.1.2': 'scripts/lib/zepto.js'
};

var codeTable = document.getElementById('code_table'),
	i = 0,
	l = codes.length,
	jsToolName,
	elRow,
	elCell,
	elFrame,
	code;

elRow = document.createElement('tr');
elCell = document.createElement('th');
elRow.appendChild(elCell);

for (jsToolName in jsTools) {
		elCell = document.createElement('th');
		elCell.innerText = jsToolName;
		elRow.appendChild(elCell);
		
		elFrame = document.createElement('iframe');
		elFrame.src = 'test/test_page.php?js=' + encodeURIComponent(jsTools[jsToolName]);
		elFrame.style.display = 'none';
		elFrame.name = jsToolName;
		document.body.appendChild(elFrame);
}
codeTable.appendChild(elRow);

for (; i < l; i++) {
	elRow = document.createElement('tr');
	elRow.isTest = true;
	code = codes[i][1] || codes[i][0];
	
	elCell = document.createElement('td');
	elCell.className = 'c1';
	elCell.innerText = codes[i][0];
	elRow.appendChild(elCell);
	
	for (jsToolName in jsTools) {
		elCell = document.createElement('td');
		elCell.code = code;
		elCell.jsToolName = jsToolName;
		
		elRow.appendChild(elCell);
	}
	
	codeTable.appendChild(elRow);
}

var testRound = 3000;

if (window.screen.width < 800) {
	//testRound = 1000;
}

window.onload = function() {
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
						time = result.time || -1;
					
					times.push(time);
					
					var text = time + 'ms';
					if (result.result) {
						text += '|' + result.result;
					}
					elCell.innerText = text;
					
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
	
	testRowFn();

}