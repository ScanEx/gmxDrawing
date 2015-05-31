/*
GeoMixer Drawing building scripts.
*/

var build = require('./build/build.js');

function hint(msg, args) {
    return function () {
        console.log(msg);
        jake.exec('node node_modules/eslint/bin/eslint.js ' + args,
                {printStdout: true}, function () {
            console.log('\tCheck passed.\n');
            complete();
        });
    };
}

desc('Check Leaflet source for errors with ESLint');
task('lint', {async: true}, hint('Checking for JS errors...', 'src --config build/eslintrc.json'));

desc('Combine and compress gmxDrawing source files');
task('build', build.build);

task('default', ['build']);
