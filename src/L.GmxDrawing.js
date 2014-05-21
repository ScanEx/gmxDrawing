L.GmxDrawing = L.Class.extend({
    options: {
        createKey: '',
        items: []
    },
    includes: L.Mixin.Events,

    initialize: function (map) {
        this._map = map;
    },
    add: function (obj, options) {
        if (!options) options = {};

        var opt = this.options,
            item = null;
        if (obj instanceof L.Rectangle)     options.type = 'Rectangle';
        else if (obj instanceof L.Polygon)  options.type = 'Polygon';
        else if (obj instanceof L.Polyline) options.type = 'Polyline';

        item = new L.GmxDrawing.Feature(this, obj, options);
        if (item) opt.items.push(item);

        return item;
    },

    _clearCreate: function (object) {
        if (this._createKey) {
            this._map.off(this._createKey.eventName, this._createKey.fn, this);
            this.fire('createend', {mode: this._createKey.mode, object: object});
        }
        this._createKey = null;
    },

    create: function (mode, drawOptions) {
        this._clearCreate(null);

        if (mode) {
            if (mode === 'Rectangle') this._map.dragging.disable();
            this._createKey = {
                mode: mode,
                drawOptions: drawOptions,
                eventName: mode === 'Rectangle' ? 'mousedown' : 'click',
                fn: function (ev) {
                    var object = null,
                        my = this;
                    if (mode === 'Point') {
                        object = L.marker(ev.latlng, {draggable: true})
                            .addTo(this._map)
                            .on('click', L.DomEvent.stopPropagation)
                            .on('dblclick', function() {
                                this._map.removeLayer(this);
                                this.options.type = mode;
                                my._removeItem(this, true);
                            });
                        this.options.items.push(object);
                    } else if (mode === 'Rectangle') {
                        object = this.add(
                            L.rectangle(L.latLngBounds(L.latLng(ev.latlng.lat + 0.01, ev.latlng.lng - 0.01), ev.latlng))
                        , {state: 'edit', drawOptions: drawOptions} );
                        object._pointDown(ev);
                    } else if (mode === 'Polygon') {
                        object = this.add(L.polygon([ev.latlng]), {state: 'add', drawOptions: drawOptions}).setAddState();
                    } else if (mode === 'Polyline') {
                        object = this.add(L.polyline([ev.latlng]), {state: 'add', drawOptions: drawOptions}).setAddState();
                    }
                    this._clearCreate(object);
                    if (object) this.fire('add', {mode: mode, object: object});
                }
            }
            this._map.on(this._createKey.eventName, this._createKey.fn, this);
            this.fire('createstart', {mode: mode});
        }
        this.options.createKey = mode;
    },

    getItems: function () {
        return this.options.items;
    },

    _removeItem: function (obj, remove) {
        for (var i = 0, len = this.options.items.length; i < len; i++) {
            var item = this.options.items[i];
            if (item === obj) {
                if (remove) {
                    this.options.items.splice(i, 1);
                    this.fire('removed', {mode: item.options.type, object: item});
                }
                return item;
            }
        }
        return null;
    },

    remove: function (obj) {
        var item = this._removeItem(obj);
        if (item) {
            item.remove(obj);
        }
        return item;
    } 
});

L.Map.addInitHook(function () {
    this.gmxDrawing = new L.GmxDrawing(this);
});

L.GmxDrawing.Feature = L.Handler.extend({
    options: {
        state: '' // add, edit
    },
    includes: L.Mixin.Events,

    initialize: function (parent, obj, options) {
        if (!options) options = {};
        L.setOptions(this, options);

        this._parent = parent;
        this._map = parent._map;

        var latlngs = obj._latlngs,
            state = options.state || (latlngs.length ? 'edit' : 'add'),
            linesStyle = {opacity:1, weight:2};
        if (this.options.type === 'Polygon' || this.options.type === 'Rectangle') {
            //linesStyle.clickable = false;
            linesStyle.fill = true, linesStyle.fillColor;
        }
        for (var key in options.lines) linesStyle[key] = options.lines[key];
        this._group = new L.LayerGroup();
        this.lines = new L.Polyline(latlngs, linesStyle);
        this._group.addLayer(this.lines);
        this.fill = new L.GmxDrawing._Fill(latlngs);
        this._group.addLayer(this.fill);
        if (this.options.type !== 'Polyline' && state === 'edit') {
            this.lines.addLatLng(latlngs[0]);
            this.fill.addLatLng(latlngs[0]);
        }
        
        this.points = new L.GmxDrawing.PointMarkers(latlngs, options.points || {});
        this.points._parent = this;
        this._group.addLayer(this.points);

        this._map.addLayer(this._group);
        if (state === 'edit') this.setEditState();
    },

    remove: function () {
        this._pointUp();
        this.removeEditState();
        this._map.removeLayer(this._group);
        this._parent._removeItem(this, true);
    },

    _setPoint: function (latlng, nm, type) {
        var points = this.points._latlngs;
        if (this.options.type === 'Rectangle') {
            if (type === 'edge') {
                nm--;
                if (nm === 0) points[0].lng = points[1].lng = latlng.lng;
                else if (nm === 1) points[1].lat = points[2].lat = latlng.lat;
                else if (nm === 2) points[2].lng = points[3].lng = latlng.lng;
                else if (nm === 3) points[0].lat = points[3].lat = latlng.lat;
            } else {
                points[nm] = latlng;
                if (nm === 0) points[3].lat = latlng.lat, points[1].lng = latlng.lng;
                else if (nm === 1) points[2].lat = latlng.lat, points[0].lng = latlng.lng;
                else if (nm === 2) points[1].lat = latlng.lat, points[3].lng = latlng.lng;
                else if (nm === 3) points[0].lat = latlng.lat, points[2].lng = latlng.lng;
            }
        } else {
            points[nm] = latlng;
        }
        this.fill.setLatLngs(points);
        this.lines.setLatLngs(points);
        if (this.options.type !== 'Polyline' && this.state === 'edit' && points.length > 2) {
            this.lines.addLatLng(points[0]);
            this.fill.addLatLng(points[0]);
        }
        this.points.setLatLngs(points);
        this._fireEvent('edit');
    },

    addLatLng: function (point) {
        this._setPoint(point, this.points._latlngs.length, 'node');
    },

    // edit state
    _pointDown: function (ev) {
        if (ev.originalEvent.ctrlKey) {
            this._onDragStart(ev);
            return;
        }

        var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev),
            num = downAttr.num,
            type = downAttr.type,
            points = this.points._latlngs,
            latlng = ev.latlng;

        if (type === 'edge' && this.options.type !== 'Rectangle') {
            points.splice(num, 0, points[num]);
            this._setPoint(latlng, num, type);
        }
        this.down = downAttr;
        this._map
            .on('mousemove', this._pointMove, this)
            .on('mouseup', this._pointUp, this);
        this._fireEvent('editstart');
        this._enableDrag();
    },

    _pointUp: function (ev) {
        this._map
            .off('mousemove', this._pointMove, this)
            .off('mouseup', this._pointUp, this);
        this.down = null;
        this._fireEvent('editend');
    },
    _lastPointClickTime: 0,  // Hack for emulate dblclick on Point

    _removePoint: function (num) {
        var points = this.points._latlngs;
        if (points.length > num) {
            points.splice(num, 1);
            if (points.length < 2 || this.options.type === 'Rectangle') {
                this.remove();
            } else {
                this._setPoint(points[0], 0);
            }
        }
    },

    _pointMove: function (ev) {
        if (this.down) {
            this._setPoint(ev.latlng, this.down.num, this.down.type);
            this.skipClick = true;
        }
    },

    _pointClick: function (ev) {
        var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev);
//console.log('_pointClick', this.state, this.skipClick, downAttr);
        if (downAttr.type === 'node'
                && !this.skipClick
            ) {
            var num = downAttr.num,
                clickTime = new Date().getTime(),
                prevClickTime = this._lastPointClickTime;
            this._lastPointClickTime = clickTime + 300;
            if (clickTime < prevClickTime) {  // this is dblclick on Point
                if (this.addLinePointTimer) {
                    clearTimeout(this.addLinePointTimer);
                    this.addLinePointTimer = null;
                }
                this._removePoint(num);
                this.setEditState();
            } else if (this.options.type === 'Polyline' && downAttr.end) {
                //this.points._latlngs.splice(downAttr.nm, 1);
                if (!this.addLinePointTimer) {
                    var my = this,
                        latlng = ev.latlng;
                    this.addLinePointTimer = setTimeout(function () {
                        clearTimeout(my.addLinePointTimer);
                        my.addLinePointTimer = null;
                        my._pointUp();
                        if (num === 0) my.points._latlngs.reverse();
                        my.points.addLatLng(latlng);
                        my.setAddState();
                        my._fireEvent('add');
                    }, 300);
                }
            }
        }
        this.skipClick = false;
    },

    _onDragEnd: function (ev) {
        this._map
            .off('mouseup', this._onDragEnd, this)
            .off('mousemove', this._onDrag, this);
        this._fireEvent('dragend');
    },

    _onDragStart: function (ev) {
        this._dragstartPoint = ev.latlng;
        this._map
            .on('mouseup', this._onDragEnd, this)
            .on('mousemove', this._onDrag, this);
        this._fireEvent('dragstart');
    },

    _onDrag: function (ev) {
        var lat = this._dragstartPoint.lat - ev.latlng.lat,
            lng = this._dragstartPoint.lng - ev.latlng.lng,
            points = this.points._latlngs;
            
        points.forEach(function (item) {
            item.lat -= lat;
            item.lng -= lng;
        });
        this._dragstartPoint = ev.latlng;
        
        this.fill.setLatLngs(points);
        this.lines.setLatLngs(points);
        if (this.options.type !== 'Polyline' && this.state === 'edit' && points.length > 2) {
            this.lines.addLatLng(points[0]);
            this.fill.addLatLng(points[0]);
        }
        this.points.setLatLngs(points);
        this._fireEvent('drag');
    },

    _fireEvent: function (name) {
        var event = {mode: this.options.type, object: this};
        this.fire(name, event);
        this._parent.fire(name, event);
    },

    _disableDrag: function (ev) {
        this._map.dragging.disable();
    },

    _enableDrag: function (ev) {
        this._map.dragging.enable();
    },

    _editHandlers: function (flag) {
        var stop = L.DomEvent.stopPropagation;
        var prevent = L.DomEvent.preventDefault;
        if (flag) {
            this._map
                .on('dblclick click', stop);
            this.points
                .on('dblclick click', stop, this)
                .on('dblclick click', prevent, this)
                .on('mousemove', stop)
                .on('click', this._pointClick, this)
                .on('mousedown', this._pointDown, this);
            this.fill
                .on('dblclick click', stop, this)
                .on('dblclick click', prevent, this)
                .on('mousedown', this._pointDown, this);
        } else {
            this._pointUp();
            this._map
                .off('dblclick click', stop);
            this.points
                .off('dblclick click', stop, this)
                .off('dblclick click', prevent, this)
                .off('mousemove', stop)
                .off('click', this._pointClick, this)
                .off('mousedown', this._pointDown, this);
            this.fill
                .off('dblclick click', stop, this)
                .off('dblclick click', prevent, this)
                .off('mousedown', this._pointDown, this);
        }
    },

    _createHandlers: function (flag) {
        var stop = L.DomEvent.stopPropagation;
        var prevent = L.DomEvent.preventDefault;
        if (flag) {
            this._map
                .on('dblclick', stop)
                .on('dblclick', prevent)
                .on('mousedown', this._mousedown, this)
                .on('mouseup', this._mouseup, this)
                .on('mousemove', this._moseMove, this);
        } else {
            this._map
                .off('dblclick', stop)
                .off('dblclick', prevent)
                .off('mousedown', this._mousedown, this)
                .off('mouseup', this._mouseup, this)
                .off('mousemove', this._moseMove, this);
        }
    },

    setEditState: function () {
        this._editHandlers(false);
        this._createHandlers(false);
        this._editHandlers(true);
        this.state = 'edit';
    },

    setAddState: function () {
        this._editHandlers(false);
        this._createHandlers(false);
        this._createHandlers(true);
        this.state = 'add';
    },

    removeAddState: function () {
        this._createHandlers(false);
        this.state = '';
    },

    removeEditState: function () {
        this._editHandlers(false);
        this.state = '';
    },

    // add state
    _moseMove: function (ev) {
        var points = this.points._latlngs;
        if (points.length === 1) this._setPoint(ev.latlng, 1);

        this._setPoint(ev.latlng, points.length - 1);
    },

    _mousedown: function (ev) {
        this._lastTime = new Date().getTime() + 300;  // Hack for determinating map dragging
    },

    _mouseup: function (ev) {
        if (new Date().getTime() < this._lastTime && this.state === 'add') {
            var down = L.GmxDrawing.utils.getDownType.call(this, ev),
                points = this.points._latlngs;
            if (down.type === 'node' && down.end) {
                if (down.num === 0 || (down.prev && down.num === points.length - 1)) {
                    this.setEditState();
                    points.pop();
                    if (points.length > 1) {
                        this.skipClick = true;
                        
                        if (down.num === 0 && this.options.type === 'Polyline') {
                            this.options.type = 'Polygon';
                        }
                        this._setPoint(points[0], 0);
                    } else {
                        this.remove();
                    }
                    this._fireEvent('created');
                    return;
                }
            }
            this.addLatLng(ev.latlng);
            this._parent._clearCreate();
        }
    }
});

L.GmxDrawing._Fill = L.Polyline.extend({
    options: {
        opacity: 0,
        fill: true,
        fillOpacity: 0,
        pointSize: 5,
        weight: 1
    },

    _getPathPartStr: function (points) {
        var options = this.options,
            pointSize = this.options.pointSize;

        var arr = L.GmxDrawing.utils.getEquidistancePolygon(points, 1.5*pointSize);
        for (var i = 0, len = arr.length, str = '', p; i < len; i++) {
            p = arr[i];
            str += 'M' + p[0][0] + ' ' + p[0][1] +
                'L' + p[1][0] + ' ' + p[1][1] +
                'L' + p[2][0] + ' ' + p[2][1] +
                'L' + p[3][0] + ' ' + p[3][1] +
                'L' + p[0][0] + ' ' + p[0][1];
        }
        return str;
    }
    ,
    _updatePath: function () {
        if (!this._map) { return; }

        this._clipPoints();

        L.Path.prototype._updatePath.call(this);
    }
});

L.GmxDrawing.PointMarkers = L.Polygon.extend({
    options: {
        noClip: true,
        opacity: 1,
        fill: true,
        fillColor: '#ffffff',
        fillOpacity: 1,
        pointSize: 5,
        weight: 2
    },

    _getPathPartStr: function (points) {
        var round = L.Path.VML,
            pointSize = this.options.pointSize,
            weight = this.options.weight,
            //skipLastPoint = 0,
            skipLastPoint = this._parent.state === 'add' ? 1 : 0,
            radius = ('circle' in this.options ? this.options.circle : 0);

        for (var j = 0, len2 = points.length - skipLastPoint, str = '', p; j < len2; j++) {
            p = points[j];
            if (round) p._round();
            if(radius) {
                str += "M" + p.x + "," + (p.y - radius) +
                       " A" + radius + "," + radius + ",0,1,1," +
                       (p.x - 0.1) + "," + (p.y - radius) + " ";
            } else {
                var px = p.x, px1 = px - pointSize, px2 = px + pointSize,
                    py = p.y + weight, py1 = py - pointSize, py2 = py + pointSize;
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

        this._clipPoints();

        L.Path.prototype._updatePath.call(this);
    }
});

L.GmxDrawing.utils = {
    getEquidistancePolygon: function(points, d) {   // get EquidistancePolygon from line
        var out = [];
        if(points.length) {
            var p = points[0];
            for (var i = 1, len = points.length; i < len; i++) {
                var p1 = points[i],
                    dx = p1.x - p.x,
                    dy = p1.y - p.y,
                    d2 = dx*dx + dy*dy;
                if(d2 > 0) {
                    var dp = d / Math.sqrt(d2),
                        x0 = p1.x + dp * dx,        y0 = p1.y + dp * dy,
                        x3 = p1.x - dx - dp * dx,   y3 = p1.y - dy - dp * dy,
                        y01 = y0 - p1.y,    x01 = p1.x - x0,
                        y30 = y3 - p.y,     x30 = p.x - x3;
                    out.push([
                        [x0 + y01, y0 + x01]
                        ,[x0 - y01, y0 - x01]
                        ,[x3 + y30, y3 + x30]
                        ,[x3 - y30, y3 - x30]
                    ]);
                }
                p = p1;
            }
        }
        return out;
    },

    getDownType: function(ev) {
        //console.log('getDownType', this, arguments);
        var out = {type: ''},
            points = this.points._parts[0],
            len = points.length;
        if (len === 0) return out;

        var layerPoint = ev.layerPoint,
            size = this.options.pointSize || 5;

        size += this.options.weight || 2;
        var cursorBounds = new L.Bounds(
            L.point(layerPoint.x - size, layerPoint.y - size),
            L.point(layerPoint.x + size, layerPoint.y + size)
            ),
            prev = points[len - 1];
        out = {
            type: 'node',
            num: 0,
            end: true
        };
        if (cursorBounds.contains(points[0])) return out;
        out.num = len - 1;
        out.prev = (len > 1 ? cursorBounds.contains(points[len - 2]) : false);
        if (cursorBounds.contains(prev)) return out;

        delete out.prev;
        for (var i = 0; i < len; i++) {
            var point = points[i];
            if (cursorBounds.contains(point)) return { type: 'node', num: i, end: (i === 0 ? true : false) };
            var dist = L.LineUtil.pointToSegmentDistance(layerPoint, prev, point);
            if (dist < size) out = {type: 'edge', num: (i === 0 ? len : i)};
            prev = point;
        }
        return out;
    }
};
