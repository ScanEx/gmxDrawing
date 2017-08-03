L.GmxDrawing.utils = {
	isOldVersion: L.version.substr(0, 3) === '0.7',
	defaultStyles: {
        mode: '',
        map: true,
        editable: true,
        holeStyle: {
            opacity: 0.5,
            color: '#003311'
        },
        lineStyle: {
            opacity:1,
            weight:2,
            noClip: true,
            clickable: false,
            className: 'leaflet-drawing-lines',
            color: '#0033ff',
            dashArray: null,
            lineCap: null,
            lineJoin: null,
            fill: false,
            fillColor: null,
            fillOpacity: 0.2,
            smoothFactor: 1,
            stroke: true
        },
        pointStyle: {
            className: 'leaflet-drawing-points',
            noClip: true,
            smoothFactor: 0,
            opacity: 1,
            shape: 'circle',
            fill: true,
            fillColor: '#ffffff',
            fillOpacity: 1,
            size: L.Browser.mobile ? 40 : 8,
            weight: 2,
            clickable: true,
            color: '#0033ff',
            dashArray: null,
            lineCap: null,
            lineJoin: null,
            stroke: true
        },
        markerStyle: {
            mode: '',
            editable: false,
            title: 'Text example',
            options: {
                alt: '',
                //title: '',
                clickable: true,
                draggable: false,
                keyboard: true,
                opacity: 1,
                zIndexOffset: 0,
                riseOffset: 250,
                riseOnHover: false,
                icon: {
                    className: '',
                    iconUrl: '',
                    iconAnchor: [12, 41],
                    iconSize: [25, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                }
            }
        }
    },

    getNotDefaults: function(from, def) {
        var res = {};
        for (var key in from) {
            if (key === 'icon' || key === 'map') {
                continue;
            } else if (key === 'iconAnchor' || key === 'iconSize' || key === 'popupAnchor' || key === 'shadowSize') {
                if (!def[key]) { continue; }
                if (def[key][0] !== from[key][0] || def[key][1] !== from[key][1]) { res[key] = from[key]; }
            } else if (key === 'lineStyle' || key === 'pointStyle' || key === 'markerStyle') {
                res[key] = this.getNotDefaults(from[key], def[key]);
            } else if (!def || (def[key] !== from[key] || key === 'fill')) {
                res[key] = from[key];
            }
        }
        return res;
    },

    getShiftLatlng: function (latlng, map, shiftPixel) {
        if (shiftPixel && map) {
            var p = map.latLngToLayerPoint(latlng)._add(shiftPixel);
            latlng = map.layerPointToLatLng(p);
        }
        return latlng;
    },

    getDownType: function(ev, map, feature) {
        var layerPoint = ev.layerPoint,
            ctrlKey = false,
            latlng = ev.latlng;
        if (ev.originalEvent) {
            if (ev.originalEvent.ctrlKey) { ctrlKey = true; }
        }
        if (ev.touches && ev.touches.length === 1) {
            var first = ev.touches[0],
                containerPoint = map.mouseEventToContainerPoint(first);
            layerPoint = map.containerPointToLayerPoint(containerPoint);
            latlng = map.layerPointToLatLng(layerPoint);
        }
        var out = {type: '', latlng: latlng, ctrlKey: ctrlKey},
            ring = this.points ? this : (ev.ring || ev.relatedEvent),
            points = ring.points._originalPoints || ring.points._parts[0] || [],
            len = points.length;

        if (len === 0) { return out; }

        var size = (ring.points.options.size || 10) / 2;
        size += 1 + (ring.points.options.weight || 2);

        var cursorBounds = new L.Bounds(
            L.point(layerPoint.x - size, layerPoint.y - size),
            L.point(layerPoint.x + size, layerPoint.y + size)
            ),
            prev = points[len - 1],
            lastIndex = len - (ring.mode === 'add' ? 2 : 1);

        out = {
            mode: ring.mode,
            layerPoint: ev.layerPoint,
            ctrlKey: ctrlKey,
            latlng: latlng
        };
        for (var i = 0; i < len; i++) {
            var point = points[i];
            if (feature.shiftPixel) { point = points[i].add(feature.shiftPixel); }
            if (cursorBounds.contains(point)) {
                out.type = 'node';
                out.num = i;
                out.end = (i === 0 || i === lastIndex ? true : false);
                break;
            }
            var dist = L.LineUtil.pointToSegmentDistance(layerPoint, prev, point);
            if (dist < size) {
                out.type = 'edge';
                out.num = (i === 0 ? len : i);
            }
            prev = point;
        }
        return out;
    },

    _getLastObject: function (obj) {
        if (obj.getLayers) {
            var layer = obj.getLayers().shift();
            return layer.getLayers ? this._getLastObject(layer) : obj;
        }
        return obj;
    },

    getMarkerByPos: function (pos, features) {
        for (var i = 0, len = features.length; i < len; i++) {
            var feature = features[i],
                fobj = feature._obj ? feature._obj : null,
                mpos = fobj && fobj._icon ? fobj._icon._leaflet_pos : null;
            if (mpos && mpos.x === pos.x && mpos.y === pos.y) {
                return fobj._latlng;
            }
        }
        return null;
    },

    getLocale: function (key) {
		var res = L.gmxLocale ? L.gmxLocale.getText(key) : null;
		return res || key;
    }
};
