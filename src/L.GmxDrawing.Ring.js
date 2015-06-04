L.GmxDrawing.Ring = L.LayerGroup.extend({
    options: {
        className: 'leaflet-drawing-ring',
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
    includes: L.Mixin.Events,
    initialize: function (parent, coords, options) {
        options = options || {};
        options.mode = '';
        this.options = L.extend({}, parent.options, options);

        this._layers = {};
        this._coords = coords;
        this._parent = parent;

        this._initialize(parent, coords);
    },
    _initialize: function (parent, coords) {
        this.clearLayers();
        delete this.lines;
        delete this.fill;
        delete this.points;

        this.downObject = false;
        this.mode = '';
        this.lineType = this.options.type.indexOf('Polyline') !== -1;

        var pointStyle = this.options.pointStyle;
        var lineStyle = {opacity:1, weight:2, noClip: true, clickable: false, className: 'leaflet-drawing-lines'};
        if (!this.lineType) {
            lineStyle.fill = 'fill' in this.options ? this.options.fill : true;
        }
        if (this.options.lineStyle) {
            for (var key in this.options.lineStyle) {
                if (key !== 'fill' || !this.lineType) {
                    lineStyle[key] = this.options.lineStyle[key];
                }
            }
        }
        if (this.options.hole) {
            lineStyle = L.extend({}, lineStyle, L.GmxDrawing.utils.defaultStyles.holeStyle);
            pointStyle = L.extend({}, pointStyle, L.GmxDrawing.utils.defaultStyles.holeStyle);
        }

        var latlngs = coords,
            _this = this,
            mode = this.options.mode || (latlngs.length ? 'edit' : 'add');

        this.lines = new L.Polyline(latlngs, lineStyle);
        this.addLayer(this.lines);
        this.fill = new L.GmxDrawing._Fill(latlngs);
        this.addLayer(this.fill);
        if (!this.lineType && mode === 'edit') {
            this.lines.addLatLng(latlngs[0]);
            this.fill.addLatLng(latlngs[0]);
        }
        this.mode = mode;

        this.points = new L.GmxDrawing.PointMarkers(latlngs, pointStyle);
        this.points._parent = this;
        this.addLayer(this.points);
        this.points
            .on('mouseover mousemove', function (ev) {
                ev.ring = _this;
                parent._showTooltip(_this.lineType ? 'Length' : 'Area', ev);
            }, parent)
            .on('mouseout', function () {
                parent.hideTooltip();
            }, parent);
        this.fill
            .on('mouseover mousemove', function (ev) {
                ev.ring = _this;
                parent._showTooltip('Length', ev);
            }, parent)
            .on('mouseout', function () {
                parent.hideTooltip();
            }, parent);
    },

    onAdd: function (map) {
        L.LayerGroup.prototype.onAdd.call(this, map);
        this.setEditMode();
    },

    onRemove: function (map) {
        if (this.points) {
            this._pointUp();
            this.removeAddMode();
            this.removeEditMode();

            if ('hideTooltip' in this._parent) { this._parent.hideTooltip(); }
        }
        L.LayerGroup.prototype.onRemove.call(this, map);
        if (this.options.type === 'Point') {
            map.removeLayer(this._obj);
        }
        this._fireEvent('removefrommap');
    },

    _setPoint: function (latlng, nm, type) {
        if (!this.points) { return; }
        var points = this.points._latlngs;
        if (this.options.type === 'Rectangle') {
            if (type === 'edge') {
                nm--;
                if (nm === 0) { points[0].lng = points[1].lng = latlng.lng; }
                else if (nm === 1) { points[1].lat = points[2].lat = latlng.lat; }
                else if (nm === 2) { points[2].lng = points[3].lng = latlng.lng; }
                else if (nm === 3) { points[0].lat = points[3].lat = latlng.lat; }
            } else {
                points[nm] = latlng;
                if (nm === 0) { points[3].lat = latlng.lat; points[1].lng = latlng.lng; }
                else if (nm === 1) { points[2].lat = latlng.lat; points[0].lng = latlng.lng; }
                else if (nm === 2) { points[1].lat = latlng.lat; points[3].lng = latlng.lng; }
                else if (nm === 3) { points[0].lat = latlng.lat; points[2].lng = latlng.lng; }
            }
        } else {
            points[nm] = latlng;
        }
        this.setLatLngs(points);
    },

    addLatLng: function (point) {
        if (this.points) {
            this._setPoint(point, this.points._latlngs.length, 'node');
        } else if ('addLatLng' in this._obj) {
            this._obj.addLatLng(point);
        }
    },

    setLatLngs: function (points) {
        //console.log('setLatLngs', points);
        if (this.points) {
            this.fill.setLatLngs(points);
            this.lines.setLatLngs(points);
            if (!this.lineType && this.mode === 'edit' && points.length > 2) {
                this.lines.addLatLng(points[0]);
                this.fill.addLatLng(points[0]);
            }
            this.points.setLatLngs(points);
        } else if ('setLatLngs' in this._obj) {
            this._obj.setLatLngs(points);
        }
        this._fireEvent('edit');
    },
    // edit mode
    _pointDown: function (ev) {
        if (ev.originalEvent && ev.originalEvent.ctrlKey) {
            this._onDragStart(ev);
            return;
        }
        this.invoke('bringToFront');

        //ev.ring = this;
        var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev, this._map),
            num = downAttr.num,
            type = downAttr.type,
            points = this.points._latlngs,
            opt = this.options,
            latlng = ev.latlng;

        this.down = downAttr;
        if (type === 'edge' && opt.type !== 'Rectangle') {
            if (opt.disableAddPoints) { return; }
            points.splice(num, 0, points[num]);
            this._setPoint(latlng, num, type);
        }
        this.downObject = true;
        this._map
            .on('mousemove', this._pointMove, this)
            .on('mouseup', this._pointUp, this);

        this._parent._enableDrag();
    },

    _pointMove: function (ev) {
        if (this.down) {
            if (!this.lineType) {
                this._parent.showFill();
            }
            
            this._setPoint(ev.latlng, this.down.num, this.down.type);
            this.skipClick = true;
            if ('_showTooltip' in this) {
                this._showTooltip(this.lineType ? 'Length' : 'Area', ev);
            }
        }
    },

    _pointUp: function () {
        this.downObject = false;
        if (!this.points) { return; }
        if (this._map) {
            this._map
                .off('mousemove', this._pointMove, this)
                .off('mouseup', this._pointUp, this);
        }
//console.log('_pointUp', this.mode, this._drawstop);
        if (this._drawstop) {
            this._fireEvent('drawstop');
            this.skipClick = false;
        }
        this._drawstop = false;
        this.down = null;
        var lineStyle = this.options.lineStyle || {};
        if (!lineStyle.fill && !this.lineType) {
            this._parent.hideFill();
        }
    },
    _lastPointClickTime: 0,  // Hack for emulate dblclick on Point

    _removePoint: function (num) {
        var points = this.points._latlngs;
        if (points.length > num) {
            points.splice(num, 1);
            if (this.options.type === 'Rectangle'
                || points.length < 2
                || (points.length < 3 && !this.lineType)
                //|| (points.length < 3 && this.options.type === 'Polygon')
                ) {
                this._parent.remove(this);
                //this.remove();
            } else {
                this._setPoint(points[0], 0);
            }
        }
    },

    _pointClick: function (ev) {
        if (ev.originalEvent && ev.originalEvent.ctrlKey) { return; }
        var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev, this._map);
        var clickTime = new Date().getTime(),
            prevClickTime = this._lastPointClickTime;
        this._lastPointClickTime = clickTime + 300;
        if (downAttr.type === 'node' && !this.skipClick) {
            var num = downAttr.num;
            if (clickTime < prevClickTime) {  // this is dblclick on Point
                if (this.addLinePointTimer) {
                    clearTimeout(this.addLinePointTimer);
                    this.addLinePointTimer = null;
                }
                this._removePoint(num);
                this.setEditMode();
            } else if (this.lineType && downAttr.end) {
                if (!this.addLinePointTimer) {
                    var my = this,
                        latlng = downAttr.latlng;
                    this.addLinePointTimer = setTimeout(function () {
                        clearTimeout(my.addLinePointTimer);
                        my.addLinePointTimer = null;
                        my._pointUp();
                        if (num === 0) { my.points._latlngs.reverse(); }
                        if (!L.Browser.mobile) { my.points.addLatLng(latlng); }
                        my.setAddMode();
                        my._fireEvent('drawstop');
                    }, 300);
                }
            }
        }
        this.skipClick = false;
    },

    _onDragEnd: function () {
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

        this.setLatLngs(points);
        this._fireEvent('drag');
    },

    _fireEvent: function (name) {
        this._parent._fireEvent(name);
    },

    _startTouchMove: function (ev, drawstop) {
        var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev, this._map);
        if (downAttr.type === 'node') {
            this._parent._disableDrag();
            this.down = downAttr;
            //var num = downAttr.num;
            var my = this;
            var _touchmove = function (ev) {
                downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map);
                    if (ev.touches.length === 1) { // Only deal with one finger
                        my._pointMove(downAttr);
                  }
            };
            var _touchend = function () {
                L.DomEvent
                    .off(my._map._container, 'touchmove', _touchmove, my)
                    .off(my._map._container, 'touchend', _touchend, my);
                my._parent._enableDrag();
                my.skipClick = false;
                if (drawstop) {
                    my._parent.fire('drawstop', {mode: my.options.type, object: my});
                }
            };
            L.DomEvent
                .on(my._map._container, 'touchmove', _touchmove, my)
                .on(my._map._container, 'touchend', _touchend, my);
        }
    },

    _editHandlers: function (flag) {
        if (!this.points) { return; }
        var stop = L.DomEvent.stopPropagation;
        //var prevent = L.DomEvent.preventDefault;
        if (this.touchstart) {
            L.DomEvent.off(this.points._container, 'touchstart', this.touchstart, this);
        }
        if (this.touchstartFill) {
            L.DomEvent.off(this.fill._container, 'touchstart', this.touchstartFill, this);
        }
        this.touchstart = null;
        this.touchstartFill = null;
        if (flag) {
            this.points
                .on('dblclick click', stop, this)
                .on('click', this._pointClick, this);
            if (L.Browser.mobile) {
                if (this._EditOpacity) {
                    this._setPointsStyle({fillOpacity: this._EditOpacity});
                }
                var my = this;
                this.touchstart = function (ev) {
                    my._startTouchMove(ev);
                };
                L.DomEvent.on(this.points._container, 'touchstart', this.touchstart, this);
                this.touchstartFill = function (ev) {
                    var downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map);
                    if (downAttr.type === 'edge' && my.options.type !== 'Rectangle') {
                        var points = my.points._latlngs;
                        points.splice(downAttr.num, 0, points[downAttr.num]);
                        my._setPoint(downAttr.latlng, downAttr.num, downAttr.type);
                    }
                };
                L.DomEvent.on(this.fill._container, 'touchstart', this.touchstartFill, this);
            } else {
                this.points
                    .on('mousemove', stop)
                    .on('mousedown', this._pointDown, this);
                this.fill
                    .on('dblclick click', stop, this)
                    .on('mousedown', this._pointDown, this);
                this._fireEvent('editmode');
            }
        } else {
            this._pointUp();
            this.points
                .off('dblclick click', stop, this)
                .off('click', this._pointClick, this);
            if (!L.Browser.mobile) {
                this.points
                    .off('mousemove', stop)
                    .off('mousedown', this._pointDown, this);
                this.fill
                    .off('dblclick click', stop, this)
                    .off('mousedown', this._pointDown, this);
            }
        }
    },

    _createHandlers: function (flag) {
        if (!this.points) { return; }
        var stop = L.DomEvent.stopPropagation,
            lineStyle = this.options.lineStyle || {};
        if (flag) {
            this._parent._enableDrag();
            if (L.Browser.mobile) {
                this._EditOpacity = this.points.options.fillOpacity;
                this._setPointsStyle({fillOpacity: 0.5});
                this.points.redraw();
                this._map
                    .on('dblclick', stop)
                    .on('click', this._mouseClick, this)
                    .on('mousemove', this._moseMove, this);
                this.points
                    .on('dblclick click', stop, this)
                    //.on('mouseup', this._mouseup, this)
                    .on('click', this._mouseClick, this);
            } else {
                this._map
                    .on('dblclick', stop)
                    .on('mousedown', this._mousedown, this)
                    .on('mouseup', this._mouseup, this)
                    .on('mousemove', this._moseMove, this);
                this.points
                    .on('mouseup', this._mouseup, this);
            }
            this._fireEvent('addmode');
            if (!this.lineType) { this.lines.setStyle({fill: true}); }
        } else {
            if (L.Browser.mobile) {
                if (this._map) {
                    this._map
                        .off('dblclick', stop)
                        .off('click', this._mouseClick, this)
                        .off('mousemove', this._moseMove, this);
                    this.points
                        .off('dblclick click', stop, this)
                        .off('click', this._mouseClick, this);
                }
            } else if (this._map) {
                this._map
                    .off('dblclick', stop)
                    .off('mousedown', this._mousedown, this)
                    .off('mouseup', this._mouseup, this)
                    .off('mousemove', this._moseMove, this);
            }
            if (!lineStyle.fill && !this.lineType) {
                this.lines.setStyle({fill: false});
            }
        }
    },

    setEditMode: function () {
        if (this.options.editable) {
            this._editHandlers(false);
            this._createHandlers(false);
            this._editHandlers(true);
            this.mode = 'edit';
        }
        return this;
    },

    setAddMode: function () {
        if (this.options.editable) {
            this._editHandlers(false);
            this._createHandlers(false);
            this._createHandlers(true);
            this.mode = 'add';
        }
        return this;
    },

    removeAddMode: function () {
        this._createHandlers(false);
        this.mode = '';
    },

    removeEditMode: function () {
        this._editHandlers(false);
        this.mode = '';
    },

    // add mode
    _moseMove: function (ev) {
        if (this.points) {
            var points = this.points._latlngs;
            if (points.length === 1) { this._setPoint(ev.latlng, 1); }

            this._setPoint(ev.latlng, points.length - 1);
        }
    },

    _mousedown: function () {
//console.log('_mousedown', this.mode, this._lastTime);
        this._lastTime = new Date().getTime() + 300;  // Hack for determinating map dragging
    },

    _mouseClick: function (ev) {
        var down = L.GmxDrawing.utils.getDownType.call(this, ev, this._map),
            points = this.points._latlngs;

        if (down.type === 'node' && down.end) {
            if (down.num === 0 || ((down.prev || L.Browser.mobile) && down.num === points.length - 1)) {
                this.setEditMode();
                if (!L.Browser.mobile) { points.pop(); }
                var len = points.length,
                    opt = this.options;
                if (len > 2 || (len > 1 && this.lineType)) {
                    if (!L.Browser.webkit) { this.skipClick = true; }

                    if (down.num === 0 && this.lineType && this.options.type !== 'MultiPolyline') {
                        opt.type = 'Polygon';
                        this.lineType = false;
                    }
                    this._setPoint(points[0], 0);
                } else {
                    this.remove();
                }
                this._fireEvent('drawstop');
                return;
            }
        }

        this.addLatLng(ev.latlng);
        this._parent._parent._clearCreate();
    },

    _mouseup: function (ev) {
        if (new Date().getTime() < this._lastTime && this.mode === 'add') {
            this._mouseClick(ev);
        }
    }
});
