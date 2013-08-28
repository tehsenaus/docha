
var path = require("path"),
	glob = require("glob"),
	fs = require("fs"),
	S = require("string");

module.exports = function (options, callback) {
	var testPath = options.testPath || "test/**/*.js";
	testPath = path.join(process.cwd(), testPath);

	// Some context
	var root = makeBlock("root"),
		block = root;

	// Set some globals, emulate mocha
	global.describe = function (description, fn) {
		block = makeBlock(description, block);
		block.parent.children.push(block);
		fn();
		block = block.parent;
	}
	global.it = function (behaviour, fn) {
		var code = fn.toString();
		code = code.slice(code.indexOf('{')+1);
		code = code.slice(0, code.lastIndexOf('}')-1);

		var lines = S(code).trim().lines();
		var indent = Math.min.apply(Math, lines.slice(1).map(function (line) {
			return line.match(/^(\s*)/)[1].length;
		}));

		code = [lines[0]].concat(lines.slice(1).map(function (line) {
			return line.slice(indent == Infinity ? 0 : indent);
		})).join('\n');

		block.children.push({
			behaviour: block.block + ' ' + behaviour,
			code: code
		});
	}
	global.docha = {
		doc: function (text) {
			block.children.push(text)
		}
	}


	glob(testPath, function (err, files) {
		if (err) return callback(err);

		files.forEach(function (file) {
			require(file);
		});

		writeOutput(options, root, callback);
	})
}

module.exports.doc = function (text) {
	if ( global.docha ) global.docha.doc(text);
}

function writeOutput(options, block, callback) {
	var output = path.join(process.cwd(), options.output || "README.md");

	fs.writeFile(
		output,
		block.children.map(function (block) {
			return toMarkdown(block, 1);
		}).join('\n\n'),
		'utf8',
		callback
	);
}
function toMarkdown(block, depth) {
	if ( block.behaviour ) {
		return ' ' + block.behaviour + "\n\n```\n" + block.code + "\n```\n";
	} else if (block.block) {
		return "#####".slice(0, depth) + ' ' + block.block + '\n' +
			block.children.map(function (child) {
				return toMarkdown(child, depth + 1);
			}).join('\n\n');
	} else {
		return block;
	}
}

function makeBlock (name, parent) {
	return {
		block: name,
		children: [],
		parent: parent
	}
}
