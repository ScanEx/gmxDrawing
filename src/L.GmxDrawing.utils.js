L.GmxDrawing.utils = {
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
            options: {
                alt: '',
                title: '',
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
            } else if (key === 'lineStyle' || key === 'pointStyle') {
                res[key] = this.getNotDefaults(from[key], def[key]);
            } else if (!def || (def[key] !== from[key] || key === 'fill')) {
                res[key] = from[key];
            }
        }
        return res;
    },

    getEquidistancePolygon: function(points, d) {   // get EquidistancePolygon from line
        var out = [];
        if (points.length) {
            var p = points[0];
            for (var i = 1, len = points.length; i < len; i++) {
                var p1 = points[i],
                    dx = p1.x - p.x,
                    dy = p1.y - p.y,
                    d2 = dx * dx + dy * dy;
                if (d2 > 0) {
                    var dp = d / Math.sqrt(d2),
                        x0 = p1.x + dp * dx,        y0 = p1.y + dp * dy,
                        x3 = p1.x - dx - dp * dx,   y3 = p1.y - dy - dp * dy,
                        y01 = y0 - p1.y,    x01 = p1.x - x0,
                        y30 = y3 - p.y,     x30 = p.x - x3;
                    out.push([
                        [x0 + y01, y0 + x01],
                        [x0 - y01, y0 - x01],
                        [x3 + y30, y3 + x30],
                        [x3 - y30, y3 - x30]
                    ]);
                }
                p = p1;
            }
        }
        return out;
    },

    getDownType: function(ev, map) {
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
            ring = this.points ? this : ev.ring,
            points = ring.points._parts[0] || [],
            len = points.length;

        if (len === 0) { return out; }

        var size = (ring.points.options.size || 10) / 2;
        size += 1 + (ring.points.options.weight || 2);

        var cursorBounds = new L.Bounds(
            L.point(layerPoint.x - size, layerPoint.y - size),
            L.point(layerPoint.x + size, layerPoint.y + size)
            ),
            prev = points[len - 1];
        out = {
            type: 'node',
            latlng: latlng, ctrlKey: ctrlKey,
            num: 0,
            end: true
        };
        if (cursorBounds.contains(points[0])) {
			return out;
		}
        out.num = len - 1;
        out.prev = (len > 1 ? cursorBounds.contains(points[len - 2]) : false);
        if (cursorBounds.contains(prev)) {
			return out;
		}

        out = {latlng: latlng};
        for (var i = 0; i < len; i++) {
            var point = points[i];
            if (cursorBounds.contains(point)) {
                return {
                    type: 'node', num: i, end: (i === 0 ? true : false), ctrlKey: ctrlKey, latlng: latlng
                };
            }
            var dist = L.LineUtil.pointToSegmentDistance(layerPoint, prev, point);
            if (dist < size) { out = {type: 'edge', num: (i === 0 ? len : i), ctrlKey: ctrlKey, latlng: latlng}; }
            prev = point;
        }
        return out;
    }
};
