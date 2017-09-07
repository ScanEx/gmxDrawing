L.GmxDrawing.Ring = L.LayerGroup.extend({
    options: {
        className: 'leaflet-drawing-ring',
        //noClip: true,
        //smoothFactor: 0,
        opacity: 1,
        shape: 'circle',
        fill: true,
        fillColor: '#ffffff',
        fillOpacity: 1,
        size: L.Browser.mobile ? 40 : 8,
        weight: 2
    },
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,

    initialize: function (parent, coords, options) {
        options = options || {};

        this.contextmenu = new L.GmxDrawingContextMenu();
        options.mode = '';
        this._activeZIndex = options.activeZIndex || 7;
        this._notActiveZIndex = options.notActiveZIndex || 6;
        this.options = L.extend({}, parent.getStyle(), options);

        this._layers = {};
        this._coords = coords;
        this._legLength = [];
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

        this.fill = new L.Polyline(latlngs, {
            className: 'leaflet-drawing-lines-fill',
            opacity: 0,
            fill: false,
            size: 10,
            weight: 10
        });
        this.addLayer(this.fill);

        this.lines = new L.Polyline(latlngs, lineStyle);
        this.addLayer(this.lines);

        if (!this.lineType && mode === 'edit') {
			var latlng = L.GmxDrawing.utils.isOldVersion ? latlngs[0] : latlngs[0][0];
            this.lines.addLatLng(latlng);
            this.fill.addLatLng(latlng);
        }
        this.mode = mode;

        this.points = new L.GmxDrawing.PointMarkers(latlngs, pointStyle);
        this.points._parent = this;

        this.addLayer(this.points);
        this.points
            .on('mouseover mousemove', function (ev) {
                ev.ring = _this;
                if ('_showTooltip' in this) {
                    this._showTooltip(_this.lineType ? 'Length' : 'Area', ev);
                }
                if (ev.type === 'mouseover') {
                    _this._recheckContextItems('points', _this._map);
                }
            }, parent)
            .on('mouseout', function () {
                if ('hideTooltip' in this) { this.hideTooltip(); }
            }, parent);
        this.fill
            .on('mouseover mousemove', function (ev) {
                ev.ring = _this;
                if ('_showTooltip' in this) {
                    this._showTooltip('Length', ev);
                }
            }, parent)
            .on('mouseout', function () {
                if ('hideTooltip' in this) { this.hideTooltip(); }
            }, parent);

		if (this.points.bindContextMenu) {
			this.points.bindContextMenu({
				contextmenu: false,
				contextmenuInheritItems: false,
				contextmenuItems: []
			});
		}
    },

    _recheckContextItems: function (type, map) {
        var _this = this;
		this[type].options.contextmenuItems = map.gmxDrawing.contextmenu.getItems()[type]
			.concat(this._parent.contextmenu.getItems()[type])
			.concat(this.contextmenu.getItems()[type])
			.map(function(obj) {
				return {
					id: obj.text,
					text: L.GmxDrawing.utils.getLocale(obj.text),
					callback: obj.callback || function (ev) { _this._eventsCmd(obj, ev); }
				};
			});
    },

    _eventsCmd: function (obj, ev) {
		var ring = ev.relatedTarget._parent;
		var downAttr = L.GmxDrawing.utils.getDownType.call(ring, ev, ring._map, ring._parent);
		if (downAttr) {
			var type = obj.text;
			if (obj.callback) {
				obj.callback(downAttr);
			} else if (type === 'Remove point') {
				ring._removePoint(downAttr.num);
			} else if (type === 'Delete feature') {
                ring._parent.remove(ring);
			}
        }
    },

    getFeature: function () {
		return this._parent;
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

    getLength: function (downAttr) {
        var length = 0,
            latlngs = this._getLatLngsArr(),
            len = latlngs.length;

        if (len) {
            var beg = 1,
                prev = latlngs[0];
            if (downAttr) {
                if (downAttr.type === 'node') {
                    len = downAttr.num + 1;
                } else {
                    beg = downAttr.num;
                    if (beg === len) {
                        prev = latlngs[beg - 1];
                        beg = 0;
                    } else {
                        prev = latlngs[beg - 1];
                    }
                    len = beg + 1;
                }
            }
            for (var i = beg; i < len; i++) {
                var leg = this._legLength[i] || null;
                if (leg === null) {
                    leg = L.gmxUtil.distVincenty(prev.lng, prev.lat, latlngs[i].lng, latlngs[i].lat);
                    this._legLength[i] = leg;
                }
                prev = latlngs[i];
                length += leg;
            }
        }
        return length;
    },

    _setPoint: function (latlng, nm, type) {
        if (!this.points) { return; }
        var latlngs = this._getLatLngsArr();
        if (this.options.type === 'Rectangle') {
			if (latlngs.length < 4) { latlngs[3] = latlng; }
			if (type === 'edge') {
                nm--;
                if (nm === 0) { latlngs[0].lng = latlngs[1].lng = latlng.lng; }
                else if (nm === 1) { latlngs[1].lat = latlngs[2].lat = latlng.lat; }
                else if (nm === 2) { latlngs[2].lng = latlngs[3].lng = latlng.lng; }
                else if (nm === 3) { latlngs[0].lat = latlngs[3].lat = latlng.lat; }
            } else {
                latlngs[nm] = latlng;
                if (nm === 0) { latlngs[3].lat = latlng.lat; latlngs[1].lng = latlng.lng; }
                else if (nm === 1) { latlngs[2].lat = latlng.lat; latlngs[0].lng = latlng.lng; }
                else if (nm === 2) { latlngs[1].lat = latlng.lat; latlngs[3].lng = latlng.lng; }
                else if (nm === 3) { latlngs[0].lat = latlng.lat; latlngs[2].lng = latlng.lng; }
            }
            this._legLength = [];
        } else {
            latlngs[nm] = latlng;
            this._legLength[nm] = null;
            this._legLength[nm + 1] = null;
        }
        this.setLatLngs(latlngs);
    },

    addLatLng: function (point, delta) {
        this._legLength = [];
        if (this.points) {
            var points = this._getLatLngsArr(),
                len = points.length,
                lastPoint = points[len - 2];
            if (!lastPoint || !lastPoint.equals(point)) {
                if (delta) { len -= delta; }    // reset existing point
                this._setPoint(point, len, 'node');
            }
        } else if ('addLatLng' in this._obj) {
            this._obj.addLatLng(point);
        }
    },

    setPositionOffset: function (p) {
        L.DomUtil.setPosition(this.points._container, p);
        L.DomUtil.setPosition(this.fill._container, p);
        L.DomUtil.setPosition(this.lines._container, p);
    },

    setLatLngs: function (latlngs) {
        if (this.points) {
            var points = this.points;
            this.fill.setLatLngs(latlngs);
            this.lines.setLatLngs(latlngs);
            if (!this.lineType && this.mode === 'edit' && latlngs.length > 2) {
                this.lines.addLatLng(latlngs[0]);
                this.fill.addLatLng(latlngs[0]);
            }
            points.setLatLngs(latlngs);
        } else if ('setLatLngs' in this._obj) {
            this._obj.setLatLngs(latlngs);
        }
        this._fireEvent('edit');
    },

    _getLatLngsArr: function () {
		return L.GmxDrawing.utils.isOldVersion ? this.points._latlngs : this.points._latlngs[0];
    },

    // edit mode
    _pointDown: function (ev) {
        if (!this._map) {
            return;
        }
        if (L.Browser.ie || (L.gmxUtil && L.gmxUtil.gtIE11)) {
            this._map.dragging._draggable._onUp(); // error in IE
        }
        if (ev.originalEvent) {
            var originalEvent = ev.originalEvent;
            if (originalEvent.ctrlKey) {
                this._onDragStart(ev);
                return;
            } else if (originalEvent.which !== 1 && originalEvent.button !== 1) {
                return;
            }
        }
        var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev, this._map, this._parent),
            type = downAttr.type,
            opt = this.options;

        this._lastDownTime = Date.now() + 100;
        this.down = downAttr;
        if (type === 'edge' && opt.type !== 'Rectangle') {
            if (opt.disableAddPoints) { return; }
            this._legLength = [];
            var num = downAttr.num,
                points = this._getLatLngsArr();
            points.splice(num, 0, points[num]);
            this._setPoint(ev.latlng, num, type);
        }
        this.downObject = true;
        this._parent._disableDrag();
        this._map
            .on('mousemove', this._pointMove, this)
            .on('mouseup', this._mouseupPoint, this);
    },

    _mouseupPoint: function (ev) {
		this._fireEvent('editstop');
		this._pointUp(ev);
    },

    _pointMove: function (ev) {
        if (this.down && this._lastDownTime < Date.now()) {
            if (!this.lineType) {
                this._parent.showFill();
            }
            this._clearLineAddPoint();
            this._moved = true;
            this._setPoint(ev.latlng, this.down.num, this.down.type);
            if ('_showTooltip' in this._parent) {
                this._parent._showTooltip(this.lineType ? 'Length' : 'Area', ev);
            }
        }
    },

    _pointUp: function (ev) {
        this.downObject = false;
        this._parent._enableDrag();
        if (!this.points) { return; }
        if (this._map) {
            this._map
                .off('mousemove', this._pointMove, this)
                .off('mouseup', this._mouseupPoint, this);

            var target = ev && ev.originalEvent ? ev.originalEvent.target : null;
            if (target && target._leaflet_pos && /leaflet-marker-icon/.test(target.className)) {
                var latlng = L.GmxDrawing.utils.getMarkerByPos(target._leaflet_pos, this._map.gmxDrawing.getFeatures());
                this._setPoint(latlng, this.down.num, this.down.type);
            }
            this._map._skipClick = true;    // for EventsManager
        }
        if (this._drawstop) {
            this._fireEvent('drawstop');
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
        var points = this._getLatLngsArr();
        if (points.length > num) {
            this._legLength = [];
            points.splice(num, 1);
            if (this.options.type === 'Rectangle'
                || points.length < 2
                || (points.length < 3 && !this.lineType)
                ) {
                this._parent.remove(this);
            } else {
                this._setPoint(points[0], 0);
            }
        }
    },

    _clearLineAddPoint: function () {
        if (this._lineAddPointID) { clearTimeout(this._lineAddPointID); }
        this._lineAddPointID = null;
    },

    _pointDblClick: function (ev) {
        this._clearLineAddPoint();
        if (!this.options.disableAddPoints && (!this._lastAddTime || Date.now() > this._lastAddTime)) {
            var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev, this._map, this._parent);
            this._removePoint(downAttr.num);
        }
    },

    _pointClick: function (ev) {
        if (ev.originalEvent && ev.originalEvent.ctrlKey) { return; }
        var clickTime = Date.now(),
            prevClickTime = this._lastPointClickTime;

        this._lastPointClickTime = clickTime + 300;
        if (this._moved || clickTime < prevClickTime) { this._moved = false; return; }

        var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev, this._map, this._parent),
            mode = this.mode;
        if (downAttr.type === 'node') {
            var num = downAttr.num;
            if (downAttr.end) {  // this is click on first or last Point
                if (mode === 'add') {
                    this._pointUp();
                    this.setEditMode();
                    if (this.lineType && num === 0) {
                        this._parent.options.type = this.options.type = 'Polygon';
                        this.lineType = false;
                        this._removePoint(this._getLatLngsArr().length - 1);
                    }
                    this._fireEvent('drawstop');
                    this._removePoint(num);
                } else if (this.lineType) {
                    var _this = this,
                        setLineAddPoint = function () {
                            _this._clearLineAddPoint();
                            if (num === 0) { _this._getLatLngsArr().reverse(); }
                            _this.points.addLatLng(downAttr.latlng);
                            _this.setAddMode();
                            _this._fireEvent('drawstop');
                        };
                    this._lineAddPointID = setTimeout(setLineAddPoint, 250);
                }
            } else if (mode === 'add') { // this is add pont
                this.addLatLng(ev.latlng);
            }
        }
    },

    _onDragEnd: function () {
        this._map
            .off('mouseup', this._onDragEnd, this)
            .off('mousemove', this._onDrag, this);

		this._parent._enableDrag();
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
            points = this._getLatLngsArr();

        points.forEach(function (item) {
            item.lat -= lat;
            item.lng -= lng;
        });
        this._dragstartPoint = ev.latlng;

        this._legLength = [];
        this.setLatLngs(points);
        this._fireEvent('drag');
    },

    _fireEvent: function (name) {
        this._parent._fireEvent(name);
    },

    _startTouchMove: function (ev, drawstop) {
        var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev, this._map, this._parent);
        if (downAttr.type === 'node') {
            this._parent._disableDrag();
            this.down = downAttr;
            //var num = downAttr.num;
            var my = this;
            var _touchmove = function (ev) {
                downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map, this._parent);
                    if (ev.touches.length === 1) { // Only deal with one finger
                        my._pointMove(downAttr);
                  }
            };
            var _touchend = function () {
                L.DomEvent
                    .off(my._map._container, 'touchmove', _touchmove, my)
                    .off(my._map._container, 'touchend', _touchend, my);
                my._parent._enableDrag();
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
        //if (!this.points) { return; }
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
                .on('dblclick', this._pointDblClick, this)
                .on('click', this._pointClick, this);
            if (L.Browser.mobile) {
                if (this._EditOpacity) {
                    this._parent._setPointsStyle({fillOpacity: this._EditOpacity});
                }
                var my = this;
                this.touchstart = function (ev) {
                    my._startTouchMove(ev);
                };
                L.DomEvent.on(this.points._container, 'touchstart', this.touchstart, this);
                this.touchstartFill = function (ev) {
                    var downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map, this._parent);
                    if (downAttr.type === 'edge' && my.options.type !== 'Rectangle') {
                        var points = my.points._latlngs;
                        points.splice(downAttr.num, 0, points[downAttr.num]);
                        my._legLength = [];
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
                .off('dblclick', this._pointDblClick, this)
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
        if (!this.points || !this._map) { return; }
        var stop = L.DomEvent.stopPropagation;
        if (flag) {
			if (this._map.contextmenu) {
				this._map.contextmenu.disable();
			}

            this._parent._enableDrag();
            this._map
                .on('dblclick', stop)
                .on('mousedown', this._mouseDown, this)
                .on('mouseup', this._mouseUp, this)
                .on('mousemove', this._moseMove, this);
            this.points
                .on('click', this._pointClick, this);
            this._fireEvent('addmode');
            if (!this.lineType) { this.lines.setStyle({fill: true}); }
        } else {
            if (this._map) {
                this._map
                    .off('dblclick', stop)
                    .off('mouseup', this._mouseUp, this)
                    .off('mousemove', this._moseMove, this);
                this.points
                    .off('click', this._pointClick, this);
            }
            var lineStyle = this.options.lineStyle || {};
            if (!this.lineType && !lineStyle.fill) {
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
            var points = this._getLatLngsArr();
            if (points.length === 1) { this._setPoint(ev.latlng, 1); }

            this._setPoint(ev.latlng, points.length - 1);
        }
    },

    _mouseDown: function () {
        this._lastMouseDownTime = Date.now() + 200;
    },

    _mouseUp: function (ev) {
        var timeStamp = Date.now();
        if (ev.delta || timeStamp < this._lastMouseDownTime) {
            this._lastAddTime = timeStamp + 1000;

			var _latlngs = this._getLatLngsArr();
			if (ev.originalEvent && ev.originalEvent.which === 3
				&& this.points && _latlngs && _latlngs.length) {	// for click right button

				this.setEditMode();
				this._removePoint(_latlngs.length - 1);
				this._pointUp();
				this._fireEvent('drawstop');
				if (this._map && this._map.contextmenu) {
					setTimeout(this._map.contextmenu.enable.bind(this._map.contextmenu), 250);
				}
			} else {
				var latlng = ev._latlng || ev.latlng;
				if (ev.delta) { this.addLatLng(latlng, ev.delta); }    // for click on marker
				this.addLatLng(latlng);
			}
			this._parent._parent._clearCreate();
        }
    }
});
