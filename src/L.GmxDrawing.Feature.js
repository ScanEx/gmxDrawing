L.GmxDrawing.Feature = L.LayerGroup.extend({
    options: {
        mode: '' // add, edit
    },
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,

    simplify: function () {
        var i, j, len, len1, hole;
        for (i = 0, len = this.rings.length; i < len; i++) {
            var it = this.rings[i],
                ring = it.ring;
            ring.setLatLngs(ring.points.getPathLatLngs());
            for (j = 0, len1 = it.holes.length; j < len1; j++) {
                hole = it.holes[j];
                hole.setLatLngs(hole.points.getPathLatLngs());
            }
        }
        return this;
    },

    bringToFront: function () {
        return this.invoke('bringToFront');
    },

    bringToBack: function () {
        return this.invoke('bringToBack');
    },

    onAdd: function (map) {
        L.LayerGroup.prototype.onAdd.call(this, map);
        this._parent._addItem(this);
        if (this.options.type === 'Point') {
            map.addLayer(this._obj);
            var _this = this;
            setTimeout(function () {
                _this._fireEvent('drawstop', _this._obj.options);
            }, 0);
        }
        this._fireEvent('addtomap');
		if (map._pathRoot && map._pathRoot.getAttribute('pointer-events') !== 'visible') {
			map._pathRoot.setAttribute('pointer-events', 'visible');
		}
    },

    onRemove: function (map) {
        if ('hideTooltip' in this) { this.hideTooltip(); }
        L.LayerGroup.prototype.onRemove.call(this, map);

        if (this.options.type === 'Point') {
            map.removeLayer(this._obj);
        }
        this._fireEvent('removefrommap');
    },

    remove: function (ring) {
        if (ring) {
            var i, j, len, len1, hole;
            for (i = 0, len = this.rings.length; i < len; i++) {
                if (ring.options.hole) {
                    for (j = 0, len1 = this.rings[i].holes.length; j < len1; j++) {
                        hole = this.rings[i].holes[j];
                        if (ring === hole) {
                            this.rings[i].holes.splice(j, 1);
                            if (hole._map) {
                                hole._map.removeLayer(hole);
                            }
                            break;
                        }
                    }
                    if (!ring._map) {
                        break;
                    }
                } else if (ring === this.rings[i].ring) {
                    for (j = 0, len1 = this.rings[i].holes.length; j < len1; j++) {
                        hole = this.rings[i].holes[j];
                        if (hole._map) {
                            hole._map.removeLayer(hole);
                        }
                    }
                    this.rings.splice(i, 1);
                    if (ring._map) {
                        ring._map.removeLayer(ring);
                    }
                    break;
                }
            }
        } else {
            this.rings = [];
        }
        if (this.rings.length < 1) {
            if (this._originalStyle) {
                this._obj.setStyle(this._originalStyle);
            }
            this._parent.remove(this);
        }
        return this;
    },

    _fireEvent: function (name) {
        //console.log('_fireEvent', name);
        if (name === 'removefrommap' && this.rings.length > 1) {
            return;
        }
        var event = {mode: this.mode || '', object: this};
        this.fire(name, event);
        this._parent.fire(name, event);
        if (name === 'drawstop' && this._map) {
            L.DomUtil.removeClass(this._map._mapPane, 'leaflet-clickable');
        }
    },

    getStyle: function () {
        var resultStyles = L.extend({}, this._drawOptions);
        delete resultStyles.holeStyle;
        if (resultStyles.type === 'Point') {
            L.extend(resultStyles, resultStyles.markerStyle.iconStyle);
            delete resultStyles.markerStyle;
        }
        return resultStyles;
    },

    setOptions: function (options) {
        if (options.lineStyle) {
            this._setStyleOptions(options.lineStyle, 'lines');
        }
        if (options.pointStyle) {
            this._setStyleOptions(options.pointStyle, 'points');
        }
        if ('editable' in options) {
            if (options.editable) { this.enableEdit(); }
            else { this.disableEdit(); }
        }
        L.setOptions(this, options);

        this._fireEvent('optionschange');
        return this;
    },

    _setStyleOptions: function (options, type) {
        for (var i = 0, len = this.rings.length; i < len; i++) {
            var it = this.rings[i].ring[type];
            it.setStyle(options);
            it.redraw();
            for (var j = 0, len1 = this.rings[i].holes.length; j < len1; j++) {
                it = this.rings[i].holes[j][type];
                it.setStyle(options);
                it.redraw();
            }
        }
        this._fireEvent('stylechange');
    },

    _setLinesStyle: function (options) {
        this._setStyleOptions(options, 'lines');
    },

    _setPointsStyle: function (options) {
        this._setStyleOptions(options, 'points');
    },

    getOptions: function () {
        var options = this.options,
            data = L.extend({}, options);

        data.lineStyle = options.lineStyle;
        data.pointStyle = options.pointStyle;

        var res = L.GmxDrawing.utils.getNotDefaults(data, L.GmxDrawing.utils.defaultStyles);
        if (!Object.keys(res.lineStyle).length) { delete res.lineStyle; }
        if (!Object.keys(res.pointStyle).length) { delete res.pointStyle; }
        if (!this._map) { res.map = false; }

        if (options.type === 'Point') {
            var opt = L.GmxDrawing.utils.getNotDefaults(this._obj.options, L.GmxDrawing.utils.defaultStyles.markerStyle.options);
            if (Object.keys(opt).length) { res.options = opt; }
            opt = L.GmxDrawing.utils.getNotDefaults(this._obj.options.icon.options, L.GmxDrawing.utils.defaultStyles.markerStyle.options.icon);
            if (Object.keys(opt).length) {
                res.options.icon = opt;
            }
        }

        return res;
    },

    _latLngsToCoords: function (latlngs, closed) {
        var coords = L.GeoJSON.latLngsToCoords(L.GmxDrawing.utils.isOldVersion ? latlngs : latlngs[0]);
        if (closed) {
            var lastCoord = coords[coords.length - 1];
            if (lastCoord[0] !== coords[0][0] || lastCoord[1] !== coords[0][1]) {
                coords.push(coords[0]);
            }
        }
        return coords;
    },

    _latlngsAddShift: function (latlngs, shiftPixel) {
        var arr = [];
        for (var i = 0, len = latlngs.length; i < len; i++) {
            arr.push(L.GmxDrawing.utils.getShiftLatlng(latlngs[i], this._map, shiftPixel));
        }
        return arr;
    },

    getPixelOffset: function () {
        var p = this.shiftPixel;
        if (!p && this._map) {
            var mInPixel = 256 / L.gmxUtil.tileSizes[this._map._zoom];
            p = this.shiftPixel = new L.Point(Math.floor(mInPixel * this._dx), -Math.floor(mInPixel * this._dy));
        }
        return p || new L.Point(0, 0);
    },

    setOffsetToGeometry: function (dx, dy) {
        var i, len, j, len1, ring, latlngs,
            mInPixel = 256 / L.gmxUtil.tileSizes[this._map._zoom],
            shiftPixel = new L.Point(mInPixel * (this._dx || dx || 0), -mInPixel * (this._dy || dy || 0));

        for (i = 0, len = this.rings.length; i < len; i++) {
            var it = this.rings[i];
            ring = it.ring;
            latlngs = ring.points.getLatLngs();
            ring.setLatLngs(this._latlngsAddShift(latlngs, shiftPixel));

            if (it.holes && it.holes.length) {
                for (j = 0, len1 = it.holes.length; j < len1; j++) {
                    ring = it.holes[j].ring;
                    latlngs = ring.points.getLatLngs();
                    ring.setLatLngs(this._latlngsAddShift(latlngs, shiftPixel));
                }
            }
        }
        this.setPositionOffset();
        return this;
    },

    setPositionOffset: function (mercX, mercY) {
        this._dx = mercX || 0;
        this._dy = mercY || 0;
        if (this._map) {
            this.shiftPixel = null;
            var p = this.getPixelOffset();
            for (var i = 0, len = this.rings.length; i < len; i++) {
                this.rings[i].ring.setPositionOffset(p);
                for (var j = 0, len1 = this.rings[i].holes.length; j < len1; j++) {
                    this.rings[i].holes[j].setPositionOffset(p);
                }
            }
        }
    },

    _getCoords: function (withoutShift) {
        var type = this.options.type,
            closed = (type === 'Polygon' || type === 'Rectangle' || type === 'MultiPolygon'),
            shiftPixel = withoutShift ? null : this.shiftPixel,
            coords = [];
        for (var i = 0, len = this.rings.length; i < len; i++) {
            var it = this.rings[i],
                arr = this._latLngsToCoords(it.ring.points.getLatLngs(), closed, shiftPixel);

            if (closed) { arr = [arr]; }
            if (it.holes && it.holes.length) {
                for (var j = 0, len1 = it.holes.length; j < len1; j++) {
                    arr.push(this._latLngsToCoords(it.holes[j].points.getLatLngs(), closed, shiftPixel));
                }
            }
            coords.push(arr);
        }
        if (type === 'Polyline' || (closed && type !== 'MultiPolygon')) { coords = coords[0]; }
        return coords;
    },

    toGeoJSON: function () {
        return this._toGeoJSON(true);
    },

    _toGeoJSON: function (withoutShift) {
        var type = this.options.type,
            properties = this.getOptions(),
            coords;

        delete properties.mode;

        if (!this.options.editable || type === 'Point') {
            var obj = this._obj;
            if (obj instanceof L.GeoJSON) {
                obj = L.GmxDrawing.utils._getLastObject(obj).getLayers()[0];
            }
            var geojson = obj.toGeoJSON();
            geojson.properties = properties;
            return geojson;
        } else if (this.rings) {
            coords = this._getCoords(withoutShift);
            if (type === 'Rectangle') { type = 'Polygon'; }
            else if (type === 'Polyline') { type = 'LineString'; }
            else if (type === 'MultiPolyline') { type = 'MultiLineString'; }
        }

        return L.GeoJSON.getFeature({
            feature: {
                type: 'Feature',
                properties: properties
            }
        }, {
            type: type,
            coordinates: coords
        });
    },

    getType: function () {
        return this.options.type;
    },

    hideFill: function () {
        if (this._fill._map) {
             this._map.removeLayer(this._fill);
        }
    },

    showFill: function () {
        var geoJSON = this.toGeoJSON(),
            obj = L.GeoJSON.geometryToLayer(geoJSON, null, null, {weight: 0});

        this._fill.clearLayers();
        if (obj instanceof L.LayerGroup) {
            obj.eachLayer(function (layer) {
                this._fill.addLayer(layer);
            }, this);
        } else {
            obj.setStyle({weight: 0, fill: true, fillColor: '#0033ff'});
            this._fill.addLayer(obj);
        }
        if (!this._fill._map) {
            this._map.addLayer(this._fill);
            this._fill.bringToBack();
        }
        return this;
    },

    getBounds: function() {
        var bounds = new L.LatLngBounds();
        if (this.options.type === 'Point') {
            var latLng = this._obj.getLatLng();
            bounds.extend(latLng);
        } else {
            bounds = this._getBounds();
        }
        return bounds;
    },

    _getBounds: function(item) {
        var layer = item || this,
            bounds = new L.LatLngBounds(),
            latLng;
        if (layer instanceof L.LayerGroup) {
            layer.eachLayer(function (it) {
                latLng = this._getBounds(it);
                bounds.extend(latLng);
            }, this);
            return bounds;
        } else if (layer instanceof L.Marker) {
            latLng = layer.getLatLng();
        } else {
            latLng = layer.getBounds();
        }
        bounds.extend(latLng);
        return bounds;
    },

    initialize: function (parent, obj, options) {
        options = options || {};

        this.contextmenu = new L.GmxDrawingContextMenu();
        options.mode = '';
        this._drawOptions = L.extend({}, options);
        var type = options.type;
        if (type === 'Point') {
            delete options.pointStyle;
            delete options.lineStyle;
        } else {
            delete options.iconUrl;
            delete options.iconAnchor;
            delete options.iconSize;
            delete options.popupAnchor;
            delete options.shadowSize;
            delete options.markerStyle;
        }
        delete options.holeStyle;

        L.setOptions(this, options);

        this._layers = {};
        this._obj = obj;
        this._parent = parent;
        this._dx = 0;
        this._dy = 0;

        this._initialize(parent, obj);
    },

    enableEdit: function() {
        this.options.mode = 'edit';
        var type = this.options.type;
        if (type !== 'Point') {
            for (var i = 0, len = this.rings.length; i < len; i++) {
                var it = this.rings[i];
                it.ring.options.editable = this.options.editable;
                it.ring.setEditMode();
                for (var j = 0, len1 = it.holes.length; j < len1; j++) {
                    var hole = it.holes[j];
                    hole.options.editable = this.options.editable;
                    hole.setEditMode();
                }
            }
            var geojson = L.geoJson(this.toGeoJSON());
            this.options.editable = true;
            this._initialize(this._parent, geojson);
        }
        return this;
    },

    disableEdit: function() {
        var type = this.options.type;
        if (type !== 'Point') {
			this._originalStyle = this.options.lineStyle;
            var geojson = L.geoJson(this.toGeoJSON().geometry, this._originalStyle).getLayers()[0];
            for (var i = 0, len = this.rings.length; i < len; i++) {
                var it = this.rings[i];
                it.ring.removeEditMode();
                it.ring.options.editable = false;
                for (var j = 0, len1 = it.holes.length; j < len1; j++) {
                    var hole = it.holes[j];
                    hole.removeEditMode();
                    hole.options.editable = false;
                }
            }
            this._obj = geojson;
            this.options.editable = false;
            this._initialize(this._parent, this._obj);
        }
        return this;
    },

    getArea: function () {
        var out = 0;
        if (L.gmxUtil.geoJSONGetArea) {
            out = L.gmxUtil.geoJSONGetArea(this.toGeoJSON());
        }
        return out;
    },

    getLength: function () {
        var out = 0;
        if (L.gmxUtil.geoJSONGetLength) {
            out = L.gmxUtil.geoJSONGetLength(this.toGeoJSON());
        }
        return out;
    },

    getSummary: function () {
        var str = '',
            mapOpt = this._map ? this._map.options : {},
            type = this.options.type;

        if (type === 'Polyline' || type === 'MultiPolyline') {
            str = L.gmxUtil.prettifyDistance(this.getLength(), mapOpt.distanceUnit);
        } else if (type === 'Polygon' || type === 'MultiPolygon' || type === 'Rectangle') {
            str = L.gmxUtil.prettifyArea(this.getArea(), mapOpt.squareUnit);
        } else if (type === 'Point') {
            var latLng = this._obj.getLatLng();
            str = L.gmxUtil.formatCoordinates(latLng);
        }
        return str;
    },

    _initialize: function (parent, obj) {
        this.clearLayers();
        this.rings = [];
        this.mode = '';
        this._fill = L.featureGroup();

        if (this.options.editable) {
            var arr = obj.getLayers ? L.GmxDrawing.utils._getLastObject(obj).getLayers() : [obj];
            for (var i = 0, len = arr.length; i < len; i++) {
                var it = arr[i],
                    holes = [],
                    ring = new L.GmxDrawing.Ring(this, it._latlngs, {ring: true, editable: this.options.editable});

                this.addLayer(ring);
                if (it._holes) {
                    for (var j = 0, len1 = it._holes.length; j < len1; j++) {
                        var hole = new L.GmxDrawing.Ring(this, it._holes[j], {hole: true, editable: this.options.editable});
                        this.addLayer(hole);
                        holes.push(hole);
                    }
                }
                this.rings.push({ring: ring, holes: holes});
            }

            if (L.gmxUtil && L.gmxUtil.prettifyDistance && !this._showTooltip) {
                var _gtxt = L.GmxDrawing.utils.getLocale;
                var my = this;
                this._showTooltip = function (type, ev) {
                    var ring = ev.ring,
                        originalEvent = ev.originalEvent,
                        down = originalEvent.buttons || originalEvent.button;

                    if (ring && (ring.downObject || !down)) {
                        var mapOpt = my._map ? my._map.options : {},
                            distanceUnit = mapOpt.distanceUnit,
                            squareUnit = mapOpt.squareUnit,
                            str = '';

                        if (type === 'Area') {
                            if (!L.gmxUtil.getArea) { return; }
                            if (ev.originalEvent.ctrlKey) {
                                str = _gtxt('Perimeter') + ': ' + L.gmxUtil.prettifyDistance(my.getLength(), distanceUnit);
                            } else {
                                str = _gtxt(type) + ': ' + L.gmxUtil.prettifyArea(my.getArea(), squareUnit);
                            }
                            my._parent.showTooltip(ev.layerPoint, str);
                        } else if (type === 'Length') {
                            var downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map, my),
                                length = ring.getLength(downAttr),
                                titleName = (downAttr.mode === 'edit' || downAttr.num > 1 ? downAttr.type : '') + type,
                                title = _gtxt(titleName);
                            str = (title === titleName ? _gtxt(type) : title) + ': ' + L.gmxUtil.prettifyDistance(length, distanceUnit);
                            my._parent.showTooltip(ev.layerPoint, str);
                        }
                        my._fireEvent('onMouseOver');
                    }
                };
                this.hideTooltip = function() {
                    this._parent.hideTooltip();
                    this._fireEvent('onMouseOut');
                };
                this.getTitle = _gtxt;
            }
        } else if (this.options.type === 'Point') {
            this._setMarker(obj);
        } else {
            this.addLayer(obj);
        }
    },

    _enableDrag: function () {
        this._parent._enableDrag();
    },

    _disableDrag: function () {
        this._parent._disableDrag();
    },

    _setMarker: function (marker) {
        var _this = this,
            _parent = this._parent,
			_map = _parent._map,
			mapOpt = _map ? _map.options : {};

        marker
            .bindPopup(null, {maxWidth: 1000, closeOnClick: mapOpt.maxPopupCount > 1 ? false : true})
            .on('dblclick', function() {
                if (_map) { _map.removeLayer(this); }
                _this.remove();
                //_parent.remove(this);
            })
            .on('dragstart', function() {
                _this._fireEvent('dragstart');
            })
            .on('drag', function() {
                _this._fireEvent('drag');
                _this._fireEvent('edit');
            })
            .on('dragend', function() {
                _this._fireEvent('dragend');
            })
            .on('popupopen', function(ev) {
                var popup = ev.popup;
                if (!popup._input) {
                    popup._input = L.DomUtil.create('textarea', 'leaflet-gmx-popup-textarea', popup._contentNode);
                    // popup._input.placeholder = _this.options.title || marker.options.title || '';
                    popup._input.value = _this.options.title || marker.options.title || '';
                    popup._contentNode.style.width = 'auto';
                }
                L.DomEvent.on(popup._input, 'keyup', function() {
                    var rows = this.value.split('\n'),
                        cols = this.cols || 0;

                    rows.forEach(function(str) {
                        if (str.length > cols) { cols = str.length; }
                    });
                    this.rows = rows.length;
                    if (cols) { this.cols = cols; }
                    popup.update();
                    _this.options.title = marker.options.title = this.value;
                    this.focus();
                }, popup._input);
                popup.update();
            });
        _map.addLayer(marker);

        _this.openPopup = marker.openPopup = function () {
            if (marker._popup && marker._map && !marker._map.hasLayer(marker._popup)) {
                marker._popup.setLatLng(marker._latlng);
                var gmxDrawing = marker._map.gmxDrawing;
                if (gmxDrawing._drawMode) {
                    marker._map.fire(gmxDrawing._createType ? 'click' : 'mouseup', {latlng: marker._latlng, delta: 1});
                } else {
                    marker._popup.addTo(marker._map);
                    marker._popup._isOpen = true;
                }
            }
            return marker;
        };
    },

    setAddMode: function () {
        if (this.rings.length) {
            this.rings[0].ring.setAddMode();
        }
		return this;
    },

    _pointDown: function (ev) {
        if (this.rings.length) {
            this.rings[0].ring._pointDown(ev);
        }
    },

    getPopup: function() {
        if (this.options.type === 'Point') {
            return this._obj.getPopup();
        }
    }
});
