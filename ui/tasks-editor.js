const Configstore = require('configstore');

const chalk = require('chalk');

const datastore = new Configstore('tasks');
const screen = require('../utils/screen');

module.exports = (index, context) => {
	index -= 1; // Becuse user would start from 1 but we count from 0 :D
	const tasks = datastore.get('tasks');
	const task = tasks[index];

	/*
        First array to containn keys of task object and
        the second one to contain values
    */
	const _task = [[], []];
	if (!task) {
		console.log(chalk.grey('\n\t:( no task with that index exists.\n'));
		process.exit();
	}

	screen.clear();

	/*
        Outer array for y index and the inner for
        starting and ending x index
     */
	const maxXValues = [null, null];
	screen.cursorTo(0, 2);
	const maxKeyLen = Math.max.apply(null, Object.keys(task).map(key => key.length));
	const minXValue = maxKeyLen + 4;
	Object.entries(task).forEach(([key, value]) => {
		if (key !== 'done' && key !== 'index') {
			maxXValues.push(minXValue + value.length);
			_task[0].push(key);
			_task[1].push(value);
			key += ':';
			while (key.length <= maxKeyLen) {
				key += ' ';
			}

			screen.write(`  ${chalk.cyan(`${key}`)} ${value}\n`);
		}
	});
	const positionCursor = (x, y) => {
		y = y || screen.y;
		y = y < 2 ? 2 : y > 3 ? 3 : y;
		x = x || screen.x; // If not passed
		// prettier-ignore
		x = x ? // If screen.x gives 0
			x > maxXValues[y] ? // And if is greater than max allowed value at that line
				maxXValues[y] : // Then set it as max allowed value
				x < minXValue ? // And if is less than min x value
					minXValue : // Then set it as min x value
					x : // Otherwise let it be x
			minXValue; // If not passed then make it min x value
		screen.cursorTo(x, y);
	};

	positionCursor();
	const saveTasks = () => {
		let canBeSaved = true;
		_task[0].forEach((key, i) => {
			if (_task[1][i].toString().trim()) {
				task[key] = _task[1][i];
			} else {
				canBeSaved = false;
			}
		});
		if (canBeSaved) {
			tasks[index] = task;
			datastore.set('tasks', tasks);
		}
	};

	const keypressHandler = (chunk, key) => {
		const _x = screen.x;
		const _y = screen.y;
		const i = _y - 2;
		if (key && key.name === 'up') {
			positionCursor(undefined, _y - 1);
		} else if (key && key.name === 'down') {
			positionCursor(undefined, _y + 1);
		} else if (key && key.name === 'left') {
			positionCursor(_x - 1);
		} else if (key && key.name === 'right') {
			positionCursor(_x + 1);
		} else if (key && key.name === 'backspace') {
			maxXValues[_y]--;
			_task[1][i] = _task[1][i].substring(0, _x - minXValue - 1) + _task[1][i].substring(_x - minXValue);
			positionCursor(minXValue);
			screen.write(_task[1][i] + ' ');
			positionCursor(_x - 1);
		} else if (key && key.name === 'delete') {
			maxXValues[_y]--;
			_task[1][i] = _task[1][i].substring(0, _x - minXValue) + _task[1][i].substring(_x - minXValue + 1);
			positionCursor(minXValue);
			screen.write(_task[1][i] + ' ');
			positionCursor(_x - 1);
		} else if (key && key.name === 'escape' && context === 'list') {
			screen.removeListener('keypress', keypressHandler);
		} else if (chunk && chunk.length === 1 && !key.ctrl) {
			maxXValues[_y]++;
			_task[1][i] = _task[1][i].substring(0, _x - minXValue) + chunk + _task[1][i].substring(_x - minXValue);
			positionCursor(minXValue);
			screen.write(_task[1][i]);
			positionCursor(_x + 1);
			saveTasks();
		}
	};

	screen.addListener('keypress', keypressHandler);
};
