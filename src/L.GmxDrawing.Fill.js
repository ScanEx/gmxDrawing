L.GmxDrawing._Fill = L.Polyline.extend({
    options: {
        className: 'leaflet-drawing-lines-fill',
        opacity: 0,
        noClip: true,
        fill: true,
        fillOpacity: 0,
        size: 10,
        weight: 1
    },

    _getPathPartStr: function (points) {
        var size = this.options.size / 2,
            arr = L.GmxDrawing.utils.getEquidistancePolygon(points, 1.5 * size);

        for (var i = 0, len = arr.length, str = '', p; i < len; i++) {
            p = arr[i];
            str += 'M' + p[0][0] + ' ' + p[0][1] +
                'L' + p[1][0] + ' ' + p[1][1] +
                'L' + p[2][0] + ' ' + p[2][1] +
                'L' + p[3][0] + ' ' + p[3][1] +
                'L' + p[0][0] + ' ' + p[0][1];
        }
        return str;
    },
    _updatePath: function () {
        if (!this._map) { return; }

        this._clipPoints();

        L.Path.prototype._updatePath.call(this);
    }
});
