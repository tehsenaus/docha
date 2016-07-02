
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
		options.escape.forEach(function (substring, index, array) {
			description = description.replace(new RegExp('('+substring+')', 'g'), '\\'+substring);
		});

		block = makeBlock(description, block);
		block.parent.children.push(block);
		fn();
		block = block.parent;
	}
	global.it = function (behaviour, fn) {
		options.escape.forEach(function (substring, index, array) {
			behaviour = behaviour.replace(new RegExp('('+substring+')', 'g'), '\\'+substring);
		});

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
	global.before = function() {}
	global.after = function() {}
	global.beforeEach = function() {}
	global.afterEach = function() {}
	global.it.skip= function(){}
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
Object.defineProperty(module.exports, 'exclude', { get: function (){
	var nop = function () {};
	return {
		describe: global.docha ? nop : global.describe,
		it: global.docha ? nop : global.it
	}
}});


function writeOutput(options, block, callback) {
	var output = path.join(process.cwd(), options.output || "README.md");

	fs.writeFile(
		output,
		block.children.map(function(block){
			return buildLegend(options, block, 1);
		}).join('\n'),
		'utf8',
		(err) => {
			if (err) throw err;
			fs.appendFile(
				output,
				block.children.map(function (block) {
					return toMarkdown(options, block, 1);
				}).join('\n\n'),
				'utf8',
				callback
			);
		});
}
function toMarkdown(options, block, depth) {
	if ( block.behaviour ) {
		var text = ' ' + block.behaviour + '\n';
		if (options.code)
			text += "\n```\n" + block.code + "\n```\n";
		return text;
	} else if (block.block) {
		return "#####".slice(0, depth) + ' ' + block.block + '\n' +
			block.children.map(function (child) {
				return toMarkdown(options, child, depth + 1);
			}).join('\n\n');
	} else {
		return block;
	}
}

function buildLegend(options, block, depth){
	var package = require(process.cwd()+ '/package');
	// only for bitbucket
	var prefix = package.repository.url.indexOf('bitbucket') > -1 ? package.repository.url + '/overview#markdown-header-' : '';
	if (block.block){
		var url = prefix + block.block.toLowerCase().split(' ').join('-');

		return Array(depth).join('    ') + '* [' + block.block + '](' +  url + ')\n' + 
		block.children.map(function(child){
			return buildLegend(options, child, depth + 1);
		}).join('');
	}else{
		return '';
	}
}

function makeBlock (name, parent) {
	return {
		block: name,
		children: [],
		parent: parent
	}
}
