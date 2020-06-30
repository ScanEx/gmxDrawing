import './drawing.css';
import '../index.js';
import 'leaflet-geomixer-rollup';

window.addEventListener('load', () => {
    let osm = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
    });
    let map = new L.Map('map', {layers: [osm], center: new L.LatLng(50, 20), zoom: 3});
    map.gmxDrawing
        .on('drawstart', function () {})
        .on('drawstop', function () {})
        .on('add', function () {
            console.log('gmxDrawing add', arguments);
        })
        .on('edit', function () {})
        .on('remove', function () {
            console.log('gmxDrawing remove', arguments);
        })
        .on('dragstart', function () {})
        .on('drag', function () {})
        .on('dragend', function () {});

    // map.gmxDrawing.add(L.polygon([
    //     [[50.0, 20.0], [61.0, 20.0], [61.0, 33.0], [30.0, 33.0], [50.0, 20.0]]
    // ]));

    // map.gmxDrawing.add(L.polyline([
    //     [50.0, 30.0], [64.0, 35.0], [71.5, 53.0], [44.0, 43.0]
    // ]), {pointStyle:{shape: 'circle'}, lineStyle:{color: '#ff0000'}} );

    // // create rectangle
    // map.gmxDrawing.add(L.rectangle([
    //     [20.0, 40.0], [54.0, 65.0]
    // ]), {pointStyle:{shape: 'circle', size: 12}, lineStyle:{color: '#00ff00'}} );

    // const latlng = new L.LatLng(65.0, 40.0);
    // const marker = L.marker(latlng, {draggable: true, title: 'Text example'});
    // map.gmxDrawing.add(marker, {});

    // map.addControl(new L.Control.gmxDrawing({
    //     id: 'drawing',
    //     stateChange: function (control, key, flag) {
    //         //console.log('Control.gmxDrawing', control.options.activeKey, key, flag);
    //     }
    // }));
    
    let myObject = null;
    function addObject(type) {
        if (myObject) {
            map.gmxDrawing.remove(myObject);
        }        
        switch(type) {
            case 'multiPolygon':
                myObject = map.gmxDrawing.add(L.multiPolygon([
                    [[[45.0, 30.0], [56.0, 30.0], [56.0, 43.0], [25.0, 43.0], [45.0, 30.0]]],
                    [[[63.0, 28.0], [75.0, 28.0], [75.0, 40.0], [52.0, 40.0], [63.0, 28.0]]]
                ], { color: '#ff0000' }));
                break;
            case 'multiPolyline':
                myObject = map.gmxDrawing.add(L.multiPolyline([
                    [[75.0, 0.0], [56.0, 5.0], [56.0, 3.0]],
                    [[63.0, 8.0], [75.0, 9.0], [75.0, 10.0], [52.0, 11.0]]
                ]));
                break;
            case 'polygon':
                myObject = map.gmxDrawing.add(L.polygon([
                    [[50.0, 20.0], [61.0, 20.0], [61.0, 33.0], [30.0, 33.0], [50.0, 20.0]]
                ]),{ rotate: true });
                break;
            case 'polyline':
                myObject = map.gmxDrawing.add(L.polyline([
                    [50.0, 30.0], [64.0, 35.0], [71.5, 53.0], [44.0, 43.0]
                ]), {pointStyle:{shape: 'circle'}, lineStyle:{color: '#ff0000'}} );
                break;
            case 'rectangle':
                myObject = map.gmxDrawing.add(L.rectangle([
                    [20.0, 40.0], [54.0, 65.0]
                ]), {pointStyle:{shape: 'circle', size: 12}, lineStyle:{fill: true, color: '#00ff00'}} );
                break;
            case 'marker':
                myObject = map.gmxDrawing.add(L.marker(new L.LatLng(65.0, 40.0), {draggable: true, title: 'Text example'}), {});
                break;
        }
    }
    let infoPanel = document.getElementById('info');
    let buttons = infoPanel.querySelectorAll('button');
    for(let i = 0; i < buttons.length; ++i) {
        buttons[i].addEventListener('click', addObject.bind(null, buttons[i].innerText));
    }    
});