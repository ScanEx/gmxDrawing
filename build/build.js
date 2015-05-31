var fs = require('fs'),
    ncp = require('ncp').ncp,
    UglifyJS = require('uglify-js'),
    deps = require('./deps.js'),
    depsJS = deps.depsJS,
    depsCSS = deps.depsCSS;

function combineFiles(files) {
	var content = '';
	for (var i = 0, len = files.length; i < len; i++) {
		content += fs.readFileSync(files[i], 'utf8') + '\n\n';
	}
	return content;
}
function chkDistPath() {
	if (!fs.existsSync('dist')) { 
		fs.mkdirSync('dist');
    }
    
    if (!fs.existsSync('dist/css')) {
		fs.mkdirSync('dist/css');
	}
}

exports.build = function () {

	console.log('Concatenating ' + depsJS.length + ' JS files...');
	chkDistPath();

	var newSrc = combineFiles(depsJS),
	    pathPart = 'dist/gmxDrawing',
	    srcPath = pathPart + '-src.js';

	console.log('\tUncompressed size: ' + newSrc.length + ' bytes');

	fs.writeFileSync(srcPath, newSrc);
	console.log('\tSaved to ' + srcPath);

	console.log('Compressing...');

	var path = pathPart + '-min.js',
		newCompressed = UglifyJS.minify(newSrc, {
			warnings: true,
			fromString: true
		}).code;

	console.log('\tCompressed size: ' + newCompressed.length + ' bytes');
	fs.writeFileSync(path, newCompressed);
	console.log('\tSaved to ' + path);

	console.log('Concatenating ' + depsCSS.length + ' CSS files...');

	ncp('src/css/img', 'dist/css/img');

	var newSrc = combineFiles(depsCSS),
	    pathPart = 'dist/css/gmxDrawing',
	    srcPath = pathPart + '.css';

	console.log('\tCSS size: ' + newSrc.length + ' bytes');

	fs.writeFileSync(srcPath, newSrc);
	console.log('\tSaved to ' + srcPath);
};