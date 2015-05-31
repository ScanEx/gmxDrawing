(function() {
    var depsFilename = 'deps.js';

	function getScriptPath() {
		var scripts = document.getElementsByTagName('script');
		for (var i = 0; i < scripts.length; i++) {
			var src = scripts[i].src;
			if (src) {
				var res = src.match(/^(.*)gmxDrawing-dev\.js/);
				if (res) {
					return res[1];
				}
			}
		}
	}

	var basePath = getScriptPath();
    
    window.gmxDrawingDevOnLoad = function(depsJS, depsCSS) {
        var srcPath = basePath + '../';
        for (var i = 0; i < depsCSS.length; i++) {
            document.writeln('<link rel="stylesheet" href=' + srcPath + depsCSS[i] + ' />');
        }
        for (var i = 0; i < depsJS.length; i++) {
            document.writeln("<script src='" + srcPath + depsJS[i] + "'></script>");
        }
    }
    
    document.writeln("<script src='" + basePath + depsFilename + "'></script>");
})();