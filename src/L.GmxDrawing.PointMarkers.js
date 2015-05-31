L.GmxDrawing.PointMarkers = L.Polygon.extend({
    options: {
        className: 'leaflet-drawing-points',
        noClip: true,
		smoothFactor: 0,
        opacity: 1,
        shape: 'circle',
        fill: true,
        fillColor: '#ffffff',
        fillOpacity: 1,
        size: L.Browser.mobile ? 40 : 8,
        weight: 2
    },

    _getPathPartStr: function (points) {
        var round = L.Path.VML,
            size = this.options.size / 2,
            skipLastPoint = this._parent.mode === 'add' && !L.Browser.mobile ? 1 : 0,
            radius = (this.options.shape === 'circle' ? true : false);

        for (var j = 0, len2 = points.length - skipLastPoint, str = '', p; j < len2; j++) {
            p = points[j];
            if (round) { p._round(); }
            if (radius) {
                str += 'M' + p.x + ',' + (p.y - size) +
                       ' A' + size + ',' + size + ',0,1,1,' +
                       (p.x - 0.1) + ',' + (p.y - size) + ' ';
            } else {
                var px = p.x, px1 = px - size, px2 = px + size,
                    py = p.y, py1 = py - size, py2 = py + size;
                str += 'M' + px1 + ' ' + py1 + 'L' + px2 + ' ' + py1 + 'L' + px2 + ' ' + py2 + 'L' + px1 + ' ' + py2 + 'L' + px1 + ' ' + py1;
            }
        }
        return str;
    },

    _onMouseClick: function (e) {
        //if (this._map.dragging && this._map.dragging.moved()) { return; }

        this._fireMouseEvent(e);
    },

    _updatePath: function () {
        if (!this._map) { return; }
        this._path.setAttribute('fill-rule', 'inherit');

        this._clipPoints();

        L.Path.prototype._updatePath.call(this);
    }
});
