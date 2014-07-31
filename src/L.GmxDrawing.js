!function () {

var _gtxt = function (key) {
    var res = L.gmxLocale ? L.gmxLocale.getText(key) : null;
    return res || key;
};
var downObject = null;
var rectDelta = 0.0000001;

L.GmxDrawing = L.Class.extend({
    options: {
        type: ''
    },
    includes: L.Mixin.Events,

    initialize: function (map) {
        this._map = map;
        this.items = [];
        this.current = null;

        if (L.LineUtil.prettifyDistance) {
            var tooltip = document.createElementNS(L.Path.SVG_NS, 'g');
            L.DomUtil.addClass(tooltip, 'gmxTooltip');
            var bg = document.createElementNS(L.Path.SVG_NS, 'rect');
            bg.setAttributeNS(null, "rx", 4);
            bg.setAttributeNS(null, "ry", 4);
            bg.setAttributeNS(null, "height", 16);
            L.DomUtil.addClass(bg, 'gmxTooltipBG');

            var text = document.createElementNS(L.Path.SVG_NS, 'text');
            var userSelectProperty = L.DomUtil.testProp(
                ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);
            text.style[userSelectProperty] = 'none';
            tooltip.appendChild(bg);
            tooltip.appendChild(text);

            this.hideTooltip = function() {
                tooltip.setAttributeNS(null, "visibility", "hidden");
            };
            this.showTooltip = function(point, mouseovertext) {
                var x = point.x + 11,
                    y = point.y - 14;
                text.setAttributeNS(null, "x", x);
                text.setAttributeNS(null, "y" , y);
                text.textContent = mouseovertext;
                if (tooltip.getAttributeNS(null, "visibility") !== 'visible') {
                    this._map._pathRoot.appendChild(tooltip);
                    tooltip.setAttributeNS(null, "visibility", "visible");
                }
                var length = text.getComputedTextLength();
                bg.setAttributeNS(null, "width", length + 8);        
                bg.setAttributeNS(null, "x", x - 4);
                bg.setAttributeNS(null, "y" , y - 12);
            };
        }
    },

    add: function (obj, options) {
        var item = null;
        if (obj instanceof L.GmxDrawing.Feature) {
            item = obj;
        } else {
            if (!options) options = {};
            if (obj instanceof L.Rectangle)     options.type = 'Rectangle';
            else if (obj instanceof L.Polygon)  options.type = 'Polygon';
            else if (obj instanceof L.Polyline) options.type = 'Polyline';

            if (obj instanceof L.Marker) {
                item = obj;
                this._setMarker(obj);
                this.items.push(obj);
                this.fire('drawstop', {mode: 'Point', object: obj});
            } else {
                item = new L.GmxDrawing.Feature(this, obj, options);
            }
        }
        if (!item._map) this._map.addLayer(item);
        if (item.points) item.points._path.setAttribute('fill-rule', 'inherit');
        if ('setEditMode' in item) item.setEditMode();
        return item;
    },

    _setMarker: function (marker) {
        var my = this;
        marker
            .bindPopup(null, {maxWidth: 1000})
            .on('dblclick', function(ev) {
                this._map.removeLayer(this);
                my.remove(this);
            })
            .on('popupopen', function(ev) {
                var popup = ev.popup;
                if (!popup._input) {
                    popup._input = L.DomUtil.create('textarea', 'leaflet-gmx-popup-textarea', popup._contentNode);
                    popup._input.placeholder = this.options.title || "Input text";
                    popup._contentNode.style.width = 'auto';
                }
                L.DomEvent.on(popup._input, 'keyup', function(ev) {
                    var rows = this.value.split("\n"),
                        cols = this.cols || 0;
                     
                    rows.forEach(function(str) {
                        if (str.length > cols) cols = str.length;
                    });
                    //if (rows > 2) 
                    this.rows = rows.length;
                    if (cols) this.cols = cols;
                    popup.update();
                }, popup._input);
                popup.update();
            });
    },

    _disableDrag: function (ev) {
        this._map.dragging.disable();
        L.DomUtil.disableTextSelection();
        L.DomUtil.disableImageDrag();
		this._map.doubleClickZoom.removeHooks();
    },

    _enableDrag: function (ev) {
        this._map.dragging.enable();
        L.DomUtil.enableTextSelection();
        L.DomUtil.enableImageDrag();
		this._map.doubleClickZoom.addHooks();
    },

    _clearCreate: function () {
        if (this._createKey) {
            if (this._createKey.type === 'Rectangle' && L.Browser.mobile) {
                L.DomEvent.off(this._map._container, 'touchstart', this._createKey.fn, this);
            } else {
                this._map.off(this._createKey.eventName, this._createKey.fn, this);
            }
            this._enableDrag();
        }
        this._createKey = null;
    },

    create: function (type, drawOptions) {
        this._clearCreate(null);
        if (type) {
            if (type === 'Rectangle') {
                this._map._initPathRoot();
                this._map.dragging.disable();
            }
            if (!drawOptions) drawOptions = {};
            var my = this;
            this._createKey = {
                type: type,
                drawOptions: drawOptions,
                eventName: type === 'Rectangle' ? (L.Browser.mobile ? 'touchstart' : 'mousedown') : 'click',
                fn: function (ev) {
                    var obj = null,
                        latlng = ev.latlng;
                    if (type === 'Point') {
                        obj = my.add(L.marker(latlng, {draggable: true}) );
                    } else if (type === 'Rectangle') {
                        //console.log('Rectangle ', ev, latlng);
                        if (L.Browser.mobile) {
                            var downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map);
                            latlng = downAttr.latlng;
                        }
                        obj = my.add(
                            L.rectangle(L.latLngBounds(L.latLng(latlng.lat + rectDelta, latlng.lng - rectDelta), latlng))
                        , {mode: 'edit', drawOptions: drawOptions} );
                        if (L.Browser.mobile) obj._startTouchMove(ev, true);
                        else obj._pointDown(ev);

                        obj._drawstop = true;
                    } else if (type === 'Polygon') {
                        obj = my.add(L.polygon([latlng]), {mode: 'add', drawOptions: drawOptions}).setAddMode();
                    } else if (type === 'Polyline') {
                        obj = my.add(L.polyline([latlng]), {mode: 'add', drawOptions: drawOptions}).setAddMode();
                    }
                    my._clearCreate();
                }
            }
            if (type === 'Rectangle' && L.Browser.mobile) {
                L.DomEvent.on(my._map._container, 'touchstart', this._createKey.fn, this);
            } else {
                this._map.on(this._createKey.eventName, this._createKey.fn, this);
            }
            this.fire('drawstart', {mode: type});
        }
        this.options.type = type;
    },

    getFeatures: function () {
        return this.items;
    },

    _addItem: function (item) {
        this.items.push(item);
        this.fire('add', {mode: item.mode, object: item});
    },

    _removeItem: function (obj, remove) {
        for (var i = 0, len = this.items.length; i < len; i++) {
            var item = this.items[i];
            if (item === obj) {
                if (remove) {
                    this.items.splice(i, 1);
                    var ev = {type: item.options.type, object: item};
                    this.fire('remove', ev);
                    item.fire('remove', ev);
                }
                return item;
            }
        }
        return null;
    },

    remove: function (obj) {
        var item = this._removeItem(obj, true);
        if (item && '_remove' in item) {
            item._remove();
        }
        return item;
    } 
});

L.Map.addInitHook(function () {
    this.gmxDrawing = new L.GmxDrawing(this);
});

L.GmxDrawing.Feature = L.LayerGroup.extend({
    options: {
        mode: '' // add, edit
    },
    includes: L.Mixin.Events,

    onAdd: function (map) {
        L.LayerGroup.prototype.onAdd.call(this, map);
        this._parent._addItem(this);
    },

    onRemove: function (map) {
        L.LayerGroup.prototype.onRemove.call(this, map);
        this.remove();
        this._pointUp();
        this.removeEditMode();
        if ('hideTooltip' in this) this.hideTooltip();
    },

    remove: function () {
        this._parent.remove(this);
    },

    _remove: function () {
        if (this._map) this._map.removeLayer(this);
    },

    setLinesStyle: function (options) {
        this.lines.setStyle(options);
        this.lines.redraw();
    },

    setPointsStyle: function (options) {
        this.points.setStyle(options);
        this.points.redraw();
    },

    toGeoJSON: function () {
        var type = this.options.type === 'Rectangle' ? 'Polygon' : this.options.type,
            coords = L.GeoJSON.latLngsToCoords(this.points._latlngs);

        return L.GeoJSON.getFeature(this, {
            type: type,
            coordinates: type === 'Polygon' ? [coords] : coords
        });
    },

    getType: function () {
        return this.options.type;
    },

    getLatLngs: function () {
        return this.points._latlngs;
    },

    setLatLngs: function (points) {
        //console.log('setLatLngs', points);
        this.fill.setLatLngs(points);
        this.lines.setLatLngs(points);
        if (this.options.type !== 'Polyline' && this.mode === 'edit' && points.length > 2) {
            this.lines.addLatLng(points[0]);
            this.fill.addLatLng(points[0]);
        }
        this.points.setLatLngs(points);
        this._fireEvent('edit');
        //this._showTooltip(this.options.type === 'Polyline' ? 'lengthPoint': 'area');
    },

    addLatLng: function (point) {
        this._setPoint(point, this.points._latlngs.length, 'node');
    },
    
    getBounds: function() {
        return this.lines.getBounds();
    },

    initialize: function (parent, obj, options) {
        if (!options) options = {};
        L.setOptions(this, options);

		this._layers = {};
        this._parent = parent;

        var latlngs = obj._latlngs,
            holes = obj._holes || null,
            mode = options.mode || (latlngs.length ? 'edit' : 'add'),
            linesStyle = {opacity:1, weight:2, noClip: true};
        if (this.options.type === 'Polygon' || this.options.type === 'Rectangle') {
            linesStyle.fill = true;
        }
        for (var key in options.lineStyle) linesStyle[key] = options.lineStyle[key];
        this.lines = new L.Polyline(latlngs, linesStyle);
        this.addLayer(this.lines);
        this.fill = new L.GmxDrawing._Fill(latlngs);
        this.addLayer(this.fill);
        if (this.options.type !== 'Polyline' && mode === 'edit') {
            this.lines.addLatLng(latlngs[0]);
            this.fill.addLatLng(latlngs[0]);
        }

        this.points = new L.GmxDrawing.PointMarkers(latlngs, options.pointStyle || {});
        this.points._parent = this;
        this.addLayer(this.points);

        if (L.LineUtil.prettifyDistance) {
            var my = this,
                geoType = my.options.type;
            this._showTooltip = function (type, ev) {
                if (!downObject || downObject === this) {
                    var _latlngs = my.points._latlngs;
                    if (type === 'area') {
                        if (!L.PolyUtil.getArea) return;
                        var area = L.PolyUtil.getArea(_latlngs),
                            str = _gtxt('Area') + ': ' + L.PolyUtil.prettifyArea(area);
                        my._parent.showTooltip(ev.layerPoint, str);
                    } else if (type === 'length' || type === 'lengthPoint') {
                        var downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map),
                            arr = [];
                        if (downAttr.type === 'node') {
                            arr = _latlngs.slice(0, downAttr.num + 1);
                        } else {
                            arr = _latlngs.slice(downAttr.num - 1, downAttr.num + 1);
                            if (arr.length === 1) arr.push(_latlngs[0]);
                        }
                        var length = L.LineUtil.getLength(arr),
                            str = _gtxt('Length') + ': ' + L.LineUtil.prettifyDistance(length);
                        my._parent.showTooltip(ev.layerPoint, str);
                    }
                    my._fireEvent('onMouseOver');
                }
            };
            this.hideTooltip = function() {
                if (!downObject || downObject === this) {
                    this._parent.hideTooltip();
                    this._fireEvent('onMouseOut');
                }
            };

            this.points
                .on('mouseover mousemove', function (ev) {
                    this._showTooltip(this.options.type === 'Polyline' ? 'lengthPoint': 'area', ev);
                }, this)
                .on('mouseout', this.hideTooltip, this);
            this.fill
                .on('mouseover mousemove', function (ev) {
                    this._showTooltip('length', ev);
                }, this)
                .on('mouseout', this.hideTooltip, this);
        }
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
        this.setLatLngs(points);
    },

    // edit mode
    _pointDown: function (ev) {
        if (ev.originalEvent && ev.originalEvent.ctrlKey) {
            this._onDragStart(ev);
            return;
        }

        var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev, this._map),
            num = downAttr.num,
            type = downAttr.type,
            points = this.points._latlngs,
            latlng = ev.latlng;

        if (type === 'edge' && this.options.type !== 'Rectangle') {
            points.splice(num, 0, points[num]);
            this._setPoint(latlng, num, type);
        }
        this.down = downAttr;
        downObject = this;
        this._map
            .on('mousemove', this._pointMove, this)
            .on('mouseup', this._pointUp, this);

        this._parent._enableDrag();
        if (!this.options.lineStyle && this.options.type !== 'Polyline') this.lines.setStyle({fill: true});
    },

    _pointMove: function (ev) {
        if (this.down) {
            this._setPoint(ev.latlng, this.down.num, this.down.type);
            this.skipClick = true;
            if ('_showTooltip' in this) this._showTooltip(this.options.type === 'Polyline' ? 'lengthPoint': 'area', ev);
        }
    },

    _pointUp: function (ev) {
        downObject = null;
        if (this._map) this._map
            .off('mousemove', this._pointMove, this)
            .off('mouseup', this._pointUp, this);
        if (this._drawstop) {
            this._fireEvent('drawstop');
            this.skipClick = false;
        }
        this._drawstop = false;
        this.down = null;
        if (!this.options.lineStyle) this.lines.setStyle({fill: false});
    },
    _lastPointClickTime: 0,  // Hack for emulate dblclick on Point

    _removePoint: function (num) {
        var points = this.points._latlngs;
        if (points.length > num) {
            points.splice(num, 1);
            if (points.length < 2 || this.options.type === 'Rectangle') {
                this.onRemove(this._map);
            } else {
                this._setPoint(points[0], 0);
            }
        }
    },

    _pointClick: function (ev) {
        if (ev.originalEvent && ev.originalEvent.ctrlKey) return;
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
            } else if (this.options.type === 'Polyline' && downAttr.end) {
                if (!this.addLinePointTimer) {
                    var my = this,
                        latlng = downAttr.latlng;
                    this.addLinePointTimer = setTimeout(function () {
                        clearTimeout(my.addLinePointTimer);
                        my.addLinePointTimer = null;
                        my._pointUp();
                        if (num === 0) my.points._latlngs.reverse();
                        if (!L.Browser.mobile) my.points.addLatLng(latlng);
                        my.setAddMode();
                        my._fireEvent('drawstop');
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
        
        this.setLatLngs(points);
        this._fireEvent('drag');
    },

    _fireEvent: function (name) {
        var event = {mode: this.mode, object: this};
        this.fire(name, event);
        this._parent.fire(name, event);
    },

    _startTouchMove: function (ev, drawstop) {
        var downAttr = L.GmxDrawing.utils.getDownType.call(this, ev, this._map);
        if (downAttr.type === 'node') {
            this._parent._disableDrag();
            this.down = downAttr;
            var num = downAttr.num;
            var my = this;
            var _touchmove = function (ev) {
                downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map);
                    if(ev.touches.length == 1){ // Only deal with one finger
                        my._pointMove(downAttr);
                  }
            };
            var _touchend = function (ev) {
                L.DomEvent
                    .off(my._map._container, 'touchmove', _touchmove, my)
                    .off(my._map._container, 'touchend', _touchend, my);
                my._parent._enableDrag();
                my.skipClick = false;
				if (drawstop) my._parent.fire('drawstop', {mode: my.options.type, object: my});
            }
            L.DomEvent
                .on(my._map._container, 'touchmove', _touchmove, my)
                .on(my._map._container, 'touchend', _touchend, my);
        }
    },

    _editHandlers: function (flag) {
        var stop = L.DomEvent.stopPropagation;
        var prevent = L.DomEvent.preventDefault;
		if (this.touchstart) L.DomEvent.off(this.points._container, 'touchstart', this.touchstart, this);
		if (this.touchstartFill) L.DomEvent.off(this.fill._container, 'touchstart', this.touchstartFill, this);
		this.touchstart = null;
		this.touchstartFill = null;
        if (flag) {
			this.points
				.on('dblclick click', stop, this)
                .on('click', this._pointClick, this);
			if (L.Browser.mobile) {
				if (this._EditOpacity) {
					this.setPointsStyle({fillOpacity: this._EditOpacity});
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
			if (L.Browser.mobile) {
			} else {
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
        var stop = L.DomEvent.stopPropagation;
        if (flag) {
            this._parent._enableDrag();
			if (L.Browser.mobile) {
				this._EditOpacity = this.points.options.fillOpacity;
				this.setPointsStyle({fillOpacity: 0.5});
				this.points.redraw();
				this._map
					.on('dblclick', stop)
					.on('click', this._mouseClick, this)
					.on('mousemove', this._moseMove, this);
				this.points
					.on('dblclick click', stop, this)
					.on('click', this._mouseClick, this);
			} else {
				this._map
					.on('dblclick', stop)
					.on('mousedown', this._mousedown, this)
					.on('mouseup', this._mouseup, this)
					.on('mousemove', this._moseMove, this);
            }
			this._fireEvent('addmode');
        } else {
			if (L.Browser.mobile) {
				if (this._map) this._map
					.off('dblclick', stop)
					.off('click', this._mouseClick, this)
					.off('mousemove', this._moseMove, this);
				this.points
					.off('dblclick click', stop, this)
					.off('click', this._mouseClick, this);
			} else {
                if (this._map) this._map
					.off('dblclick', stop)
					.off('mousedown', this._mousedown, this)
					.off('mouseup', this._mouseup, this)
					.off('mousemove', this._moseMove, this);
			}
        }
    },

    setEditMode: function () {
        this._editHandlers(false);
        this._createHandlers(false);
        this._editHandlers(true);
        this.mode = 'edit';
		return this;
    },

    setAddMode: function () {
        this._editHandlers(false);
        this._createHandlers(false);
        this._createHandlers(true);
        this.mode = 'add';
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
        var points = this.points._latlngs;
        if (points.length === 1) this._setPoint(ev.latlng, 1);

        this._setPoint(ev.latlng, points.length - 1);
    },

    _mousedown: function (ev) {
        this._lastTime = new Date().getTime() + 300;  // Hack for determinating map dragging
    },

    _mouseClick: function (ev) {
		var down = L.GmxDrawing.utils.getDownType.call(this, ev, this._map),
			points = this.points._latlngs;

		if (down.type === 'node' && down.end) {
			if (down.num === 0 || ((down.prev || L.Browser.mobile) && down.num === points.length - 1)) {
				this.setEditMode();
				if (!L.Browser.mobile) points.pop();
				if (points.length > 1) {
					this.skipClick = true;
					
					if (down.num === 0 && this.options.type === 'Polyline') {
						this.options.type = 'Polygon';
					}
					this._setPoint(points[0], 0);
				} else {
					this._remove();
				}
				this._fireEvent('drawstop');
				return;
			}
		}

		this.addLatLng(ev.latlng);
		this._parent._clearCreate();
    },

    _mouseup: function (ev) {
        if (new Date().getTime() < this._lastTime && this.mode === 'add') {
			this._mouseClick(ev);
        }
    }
});

L.GmxDrawing._Fill = L.Polyline.extend({
    options: {
        opacity: 0,
        fill: true,
        fillOpacity: 0,
        size: 10,
        weight: 1
    },

    _getPathPartStr: function (points) {
        var options = this.options,
            size = this.options.size/2;

        var arr = L.GmxDrawing.utils.getEquidistancePolygon(points, 1.5 * size);
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

/*L.GmxDrawing.Point = L.Marker.extend({
    getLatLngs: function () {
        return [this._latlng];
    },

    getType: function () {
        return 'Point';
    },
    
    toGeoJSON: function () {
        return L.GeoJSON.getFeature(this, {
            type: 'Point',
            coordinates: L.GeoJSON.latLngsToCoords([this._latlng])
        });
    }
});*/

L.GmxDrawing.PointMarkers = L.Polygon.extend({
    options: {
        noClip: true,
		smoothFactor: 0,
        opacity: 1,
        fill: true,
        fillColor: '#ffffff',
        fillOpacity: 1,
        size: L.Browser.mobile ? 40 : 10,
        weight: 2
    },

    _getPathPartStr: function (points) {
        var round = L.Path.VML,
            size = this.options.size/2,
            weight = this.options.weight,
            skipLastPoint = this._parent.mode === 'add' && !L.Browser.mobile ? 1 : 0,
            radius = (this.options.shape === 'circle' ? true : false);

        for (var j = 0, len2 = points.length - skipLastPoint, str = '', p; j < len2; j++) {
            p = points[j];
            if (round) p._round();
            if(radius) {
                str += "M" + p.x + "," + (p.y - size) +
                       " A" + size + "," + size + ",0,1,1," +
                       (p.x - 0.1) + "," + (p.y - size) + " ";
            } else {
                var px = p.x, px1 = px - size, px2 = px + size,
                    py = p.y + weight, py1 = py - size, py2 = py + size;
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

    getDownType: function(ev, map) {
        var layerPoint = ev.layerPoint,
            ctrlKey = false,
            latlng = ev.latlng;
        if (ev.originalEvent) {
            if (ev.originalEvent.ctrlKey) ctrlKey = true;
        }
        if (ev.touches && ev.touches.length === 1) {
            var first = ev.touches[0],
                containerPoint = map.mouseEventToContainerPoint(first);
            layerPoint = map.containerPointToLayerPoint(containerPoint);
            latlng = map.layerPointToLatLng(layerPoint);
        }
        var out = {type: '', latlng: latlng, ctrlKey: ctrlKey},
            points = this.points ? this.points._parts[0] : [],
            len = points.length;
        if (len === 0) return out;

        var size = (this.points.options.size || 10) / 2;
        size += 1 + (this.points.options.weight || 2);

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
            if (dist < size) out = {type: 'edge', num: (i === 0 ? len : i), ctrlKey: ctrlKey, latlng: latlng};
            prev = point;
        }
        return out;
    }
};
}();