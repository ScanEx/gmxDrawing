var depsJS = [
    "src/L.GmxDrawing.js",
    "src/L.GmxDrawing.Feature.js",
    "src/L.GmxDrawing.Ring.js",
    "src/L.GmxDrawing.PointMarkers.js",
    "src/L.GmxDrawing.ContextMenu.js",
    "src/L.GmxDrawing.utils.js"

];
var depsCSS = [
    "css/L.gmxDrawing.css"
];

if (typeof exports !== 'undefined') {
	exports.depsJS = depsJS;
	exports.depsCSS = depsCSS;
}

if (typeof gmxDrawingDevOnLoad === 'function') {
	gmxDrawingDevOnLoad(depsJS, depsCSS);
}