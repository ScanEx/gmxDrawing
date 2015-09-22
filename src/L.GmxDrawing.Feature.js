L.GmxDrawing.Feature = L.LayerGroup.extend({
    options: {
        mode: '' // add, edit
    },
    includes: L.Mixin.Events,

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
        //this.setEditMode();
    },

    onRemove: function (map) {
        if (this.points) {
            this._pointUp();
            this.removeAddMode();
            this.removeEditMode();

            if ('hideTooltip' in this) { this.hideTooltip(); }
        }
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
            this._parent.remove(this);
        }
        return this;
    },

    _fireEvent: function (name) {
// console.log('_fireEvent', name);
        if (name === 'removefrommap' && this.rings.length > 1) {
            return;
        }
        var event = {mode: this.mode || '', object: this};
        this.fire(name, event);
        this._parent.fire(name, event);
        if (name === 'drawstop') {
            L.DomUtil.removeClass(this._map._mapPane, 'leaflet-clickable');
        }
    },

    setOptions: function (options) {
        L.setOptions(this, options);
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

        this._fireEvent('optionschange');
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
        var coords = L.GeoJSON.latLngsToCoords(latlngs);
        if (closed) {
            var lastCoord = coords[coords.length - 1];
            if (lastCoord[0] !== coords[0][0] || lastCoord[1] !== coords[0][1]) {
                coords.push(coords[0]);
            }
        }
        return coords;
    },

    toGeoJSON: function () {
        var type = this.options.type,
            closed = (type === 'Polygon' || type === 'Rectangle' || type === 'MultiPolygon'),
            coords;
        if (this.rings && type !== 'Point') {
            coords = [];
            for (var i = 0, len = this.rings.length; i < len; i++) {
                var it = this.rings[i],
                    arr = [this._latLngsToCoords(it.ring.points.getLatLngs(), closed)];

                if (it.holes && it.holes.length) {
                    for (var j = 0, len1 = it.holes.length; j < len1; j++) {
                        arr.push(this._latLngsToCoords(it.holes[j].points.getLatLngs(), closed));
                    }
                }
                coords.push(arr);
            }
            if (type === 'Polygon' || type === 'Rectangle') { coords = coords[0]; }
            if (type === 'Polyline') { coords = coords[0][0]; }
        } else {
            var geojson = this._obj.toGeoJSON();
            coords = geojson.geometry.coordinates;
        }

        if (type === 'Rectangle') { type = 'Polygon'; }
        else if (type === 'Polyline') { type = 'LineString'; }
        else if (type === 'MultiPolyline') { type = 'MultiLineString'; }

        var properties = this.getOptions();
        delete properties.mode;

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
        } else {
            latLng = layer.getBounds();
        }
        bounds.extend(latLng);
        return bounds;
    },

    initialize: function (parent, obj, options) {
        options = options || {};
        options.mode = '';
        L.setOptions(this, options);

        this._layers = {};
        this._obj = obj;
        this._parent = parent;

        this._initialize(parent, obj);
    },

    enableEdit: function() {
        this.options.mode = 'edit';
        var type = this.options.type;
        if (type !== 'Point' && type.indexOf('Multi') === -1) {
            this.options.editable = true;
            this._initialize(this._parent, this._obj);
        }
        this.setEditMode();
        return this;
    },

    disableEdit: function() {
        var type = this.options.type;
        if (type !== 'Point' && type.indexOf('Multi') === -1) {
            this.removeEditMode();
            this.options.editable = false;
            this._obj.setLatLngs(this.getLatLngs());
            this._initialize(this._parent, this._obj);
        }
        return this;
    },

    getArea: function () {
        var out = 0;
        if (L.gmxUtil.getArea) {
            for (var i = 0, len = this.rings.length; i < len; i++) {
                var it = this.rings[i];
                out += L.gmxUtil.getArea(it.ring.points._latlngs);
                for (var j = 0, len1 = it.holes.length; j < len1; j++) {
                    out -= L.gmxUtil.getArea(it.holes[j].points._latlngs);
                }
            }
        }
        return out;
    },

    getLength: function () {
        var out = 0;
        for (var i = 0, len = this.rings.length; i < len; i++) {
            var it = this.rings[i];
            out += it.ring.getLength();
            for (var j = 0, len1 = it.holes.length; j < len1; j++) {
                out += it.holes[j].getLength();
            }
        }
        return out;
    },

    getSummary: function () {
        var str = '',
            mapOpt = this._map.options || {},
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
            var layers = obj instanceof L.LayerGroup ? obj._layers : [obj];
            for (var key in layers) {
                var it = layers[key],
                    holes = [],
                    ring = new L.GmxDrawing.Ring(this, it._latlngs, {ring: true});

                this.addLayer(ring);
                if (it._holes) {
                    for (var j = 0, len1 = it._holes.length; j < len1; j++) {
                        var hole = new L.GmxDrawing.Ring(this, it._holes[j], {hole: true});
                        this.addLayer(hole);
                        holes.push(hole);
                    }
                }
                this.rings.push({ring: ring, holes: holes});
            }

            if (L.gmxUtil && L.gmxUtil.prettifyDistance) {
                var _gtxt = function (key) {
                    var res = L.gmxLocale ? L.gmxLocale.getText(key) : null;
                    return res || key;
                };
                var my = this;
                this._showTooltip = function (type, ev) {
                    var ring = ev.ring,
                        originalEvent = ev.originalEvent,
                        down = originalEvent.buttons || originalEvent.button;

                    if (ring && (ring.downObject || !down)) {
                        var mapOpt = my._map.options || {},
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
                            var downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map);
                            var length = ring.getLength(downAttr);
                            str = _gtxt(type) + ': ' + L.gmxUtil.prettifyDistance(length, distanceUnit);
                            my._parent.showTooltip(ev.layerPoint, str);
                        }
                        my._fireEvent('onMouseOver');
                    }
                };
                this.hideTooltip = function() {
                    this._parent.hideTooltip();
                    this._fireEvent('onMouseOut');
                };
            }
        } else {
            if (this.options.type === 'Point') {
                this._setMarker(obj);
            } else {
                this.addLayer(obj);
            }
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
            _parent = this._parent;

        marker
            .bindPopup(null, {maxWidth: 1000})
            .on('dblclick', function() {
                this._map.removeLayer(this);
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
        _parent._map.addLayer(marker);
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
