(function () {

var rectDelta = 0.0000001;
var stateVersion = '1.0.0';

L.GmxDrawing = L.Class.extend({
    options: {
        type: ''
    },
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,

    initialize: function (map) {
        this._map = map;
        this.items = [];
        this.current = null;
        this.contextmenu = new L.GmxDrawingContextMenu({
			points: [], // [{text: 'Remove point'}, {text: 'Delete feature'}],
			lines: []
		});

        if (L.gmxUtil && L.gmxUtil.prettifyDistance) {
			var svgNS = 'http://www.w3.org/2000/svg';
			var tooltip = document.createElementNS(svgNS, 'g');
            L.DomUtil.addClass(tooltip, 'gmxTooltip');
            var bg = document.createElementNS(svgNS, 'rect');
            bg.setAttributeNS(null, 'rx', 4);
            bg.setAttributeNS(null, 'ry', 4);
            bg.setAttributeNS(null, 'height', 16);
            L.DomUtil.addClass(bg, 'gmxTooltipBG');

            var text = document.createElementNS(svgNS, 'text');
            var userSelectProperty = L.DomUtil.testProp(
                ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);
            text.style[userSelectProperty] = 'none';
            tooltip.appendChild(bg);
            tooltip.appendChild(text);

            this.hideTooltip = function() {
                tooltip.setAttributeNS(null, 'visibility', 'hidden');
            };
            this.showTooltip = function(point, mouseovertext) {
                var x = point.x + 11,
                    y = point.y - 14;
                text.setAttributeNS(null, 'x', x);
                text.setAttributeNS(null, 'y', y);
                text.textContent = mouseovertext;
                if (tooltip.getAttributeNS(null, 'visibility') !== 'visible') {
                    if (this._map._pathRoot) { this._map._pathRoot.appendChild(tooltip); }
                    tooltip.setAttributeNS(null, 'visibility', 'visible');
                }
                var length = text.getComputedTextLength();
                bg.setAttributeNS(null, 'width', length + 8);
                bg.setAttributeNS(null, 'x', x - 4);
                bg.setAttributeNS(null, 'y', y - 12);
            };
        }
        var refreshMode = function (ev) {
            this._drawMode = ev.mode;
        };
        this.on('drawstop drawstart', refreshMode);
    },

    bringToFront: function () {
        for (var i = 0, len = this.items.length; i < len; i++) {
            var item = this.items[i];
            if (item._map && 'bringToFront' in item) { item.bringToFront(); }
        }
    },

    addGeoJSON: function (obj, options) {
        var arr = [],
            isLGeoJSON = obj instanceof L.GeoJSON;
        if (!isLGeoJSON) {
            obj = L.geoJson(obj, options);
        }
        if (obj instanceof L.GeoJSON) {
            var layers = obj.getLayers();
            if (layers) {
                var parseLayer = function (it) {
                    var _originalStyle = null;
                    if (it.setStyle && options && options.lineStyle) {
                        _originalStyle = {};
                        for (var key in options.lineStyle) {
                            _originalStyle[key] = options.lineStyle[key];
                        }
                        it.setStyle(options.lineStyle);
                    }
                    var f = this.add(it, options);
                    f._originalStyle = _originalStyle;
                    arr.push(f);
                };
                for (var i = 0, len = layers.length; i < len; i++) {
                    var layer = layers[i];

                    if (layer.feature.geometry.type !== 'GeometryCollection') {
                        layer = L.layerGroup([layer]);
                    }
                    layer.eachLayer(parseLayer, this);
                }
            }
        }
        return arr;
    },

    add: function (obj, options) {
        var item = null;
        if (obj) {
            if (obj instanceof L.GmxDrawing.Feature) {
                item = obj;
            } else {
                var calcOptions = {};
                if (!L.MultiPolygon) { L.MultiPolygon = L.Polygon; }
                if (!L.MultiPolyline) { L.MultiPolyline = L.Polyline; }
                if (!options || !('editable' in options)) { calcOptions.editable = true; }
                if (obj.geometry)     { calcOptions.type = obj.geometry.type; }
                else if (obj instanceof L.Rectangle)     { calcOptions.type = 'Rectangle'; }
                else if (obj instanceof L.Polygon)  { calcOptions.type = 'Polygon'; }
                else if (obj instanceof L.MultiPolygon)  { calcOptions.type = 'MultiPolygon'; }
                else if (obj instanceof L.Polyline) { calcOptions.type = 'Polyline'; }
                else if (obj instanceof L.MultiPolyline) { calcOptions.type = 'MultiPolyline'; }
                else if (obj instanceof L.Marker) {
                    calcOptions.type = 'Point'; calcOptions.editable = false;
                    obj.options.draggable = true;
                }
                options = this._chkDrawOptions(calcOptions.type, options);
                L.extend(options, calcOptions);
                if (obj.geometry) {
                    var iconStyle = options.markerStyle && options.markerStyle.iconStyle;
                    if (options.type === 'Point' &&
                        !options.pointToLayer &&
                        iconStyle
                    ) {
                        options.icon = L.icon(iconStyle);
                        options.pointToLayer = function (geojson, latlng) {
                             return new L.Marker(latlng, options);
                        };
                    }
                    return this.addGeoJSON(obj, options);
                }
                item = new L.GmxDrawing.Feature(this, obj, options);
            }
            if (!('map' in options)) { options.map = true; }
            if (options.map && !item._map && this._map) { this._map.addLayer(item); }
            else { this._addItem(item); }
            //if (!item._map) this._map.addLayer(item);
            //if (item.points) item.points._path.setAttribute('fill-rule', 'inherit');
            if ('setEditMode' in item) { item.setEditMode(); }
        }
        return item;
    },

    _disableDrag: function () {
		if (this._map) {
			this._map.dragging.disable();
			L.DomUtil.disableTextSelection();
			L.DomUtil.disableImageDrag();
			this._map.doubleClickZoom.removeHooks();
		}
    },

    _enableDrag: function () {
		if (this._map) {
			this._map.dragging.enable();
			L.DomUtil.enableTextSelection();
			L.DomUtil.enableImageDrag();
			this._map.doubleClickZoom.addHooks();
		}
    },

    _clearCreate: function () {
        if (this._createKey && this._map) {
            if (this._createKey.type === 'Rectangle' && L.Browser.mobile) {
                L.DomEvent.off(this._map._container, 'touchstart', this._createKey.fn, this);
            } else {
                this._map.off(this._createKey.eventName, this._createKey.fn, this);
            }
            this._enableDrag();
        }
        this._createKey = null;
    },

    _chkDrawOptions: function (type, drawOptions) {
        var defaultStyles = L.GmxDrawing.utils.defaultStyles,
            resultStyles = {};
        if (!drawOptions) {
            drawOptions = L.extend({}, defaultStyles);
        }
        if (type === 'Point') {
            L.extend(resultStyles, defaultStyles.markerStyle.options.icon, drawOptions);
        } else {
            L.extend(resultStyles, drawOptions);
            resultStyles.lineStyle = L.extend({}, defaultStyles.lineStyle, drawOptions.lineStyle);
            resultStyles.pointStyle = L.extend({}, defaultStyles.pointStyle, drawOptions.pointStyle);
            resultStyles.holeStyle = L.extend({}, defaultStyles.holeStyle, drawOptions.holeStyle);
        }

        if (resultStyles.iconUrl) {
            var iconStyle = {
                iconUrl: resultStyles.iconUrl
            };
            delete resultStyles.iconUrl;
            if (resultStyles.iconAnchor) {
                iconStyle.iconAnchor = resultStyles.iconAnchor;
                delete resultStyles.iconAnchor;
            }
            if (resultStyles.iconSize) {
                iconStyle.iconSize = resultStyles.iconSize;
                delete resultStyles.iconSize;
            }
            if (resultStyles.popupAnchor) {
                iconStyle.popupAnchor = resultStyles.popupAnchor;
                delete resultStyles.popupAnchor;
            }
            if (resultStyles.shadowSize) {
                iconStyle.shadowSize = resultStyles.shadowSize;
                delete resultStyles.shadowSize;
            }
            resultStyles.markerStyle = {
                iconStyle: iconStyle
            };
        }
        return resultStyles;
    },

    create: function (type, options) {
        this._clearCreate(null);
        if (type && this._map) {
            var map = this._map,
                drawOptions = this._chkDrawOptions(type, options),
                my = this;

            if (type === 'Rectangle') {
                //map._initPathRoot();
                map.dragging.disable();
            }

            this._createKey = {
                type: type,
                eventName: type === 'Rectangle' ? (L.Browser.mobile ? 'touchstart' : 'mousedown') : 'click',
                fn: function (ev) {
                    my._createType = '';
                    var obj, key,
                        opt = {},
                        latlng = ev.latlng;

                    for (key in drawOptions) {
                        if (!(key in L.GmxDrawing.utils.defaultStyles)) {
                            opt[key] = drawOptions[key];
                        }
                    }
                    if (type === 'Point') {
                        var markerStyle = drawOptions.markerStyle || {},
                            markerOpt = {
                                draggable: true
                            };
                        if (ev && ev.originalEvent) {
                            markerOpt.ctrlKey = ev.originalEvent.ctrlKey;
                            markerOpt.shiftKey = ev.originalEvent.shiftKey;
                            markerOpt.altKey = ev.originalEvent.altKey;
                        }
                        if (markerStyle.iconStyle) {
                            markerOpt.icon = L.icon(markerStyle.iconStyle);
                        }
                        obj = my.add(L.marker(latlng, markerOpt), opt);
                    } else {
                        if (drawOptions.pointStyle) { opt.pointStyle = drawOptions.pointStyle; }
                        if (drawOptions.lineStyle) { opt.lineStyle = drawOptions.lineStyle; }
                        if (type === 'Rectangle') {
                            // if (L.Browser.mobile) {
                                // var downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map);
                                // latlng = downAttr.latlng;
                            // }
                            opt.mode = 'edit';
                            obj = my.add(
                                L.rectangle(L.latLngBounds(L.latLng(latlng.lat + rectDelta, latlng.lng - rectDelta), latlng))
                            , opt);
                            if (L.Browser.mobile) { obj._startTouchMove(ev, true); }
                            else { obj._pointDown(ev); }

                            obj.rings[0].ring._drawstop = true;
                        } else if (type === 'Polygon') {
                            opt.mode = 'add';
                            obj = my.add(L.polygon([latlng]), opt);
                            obj.setAddMode();
                        } else if (type === 'Polyline') {
                            opt.mode = 'add';
                            obj = my.add(L.polyline([latlng]), opt).setAddMode();
                        }
                    }
                    my._clearCreate();
                }
            };
            if (type === 'Rectangle' && L.Browser.mobile) {
                L.DomEvent.on(map._container, 'touchstart', this._createKey.fn, this);
            } else {
                map.on(this._createKey.eventName, this._createKey.fn, this);
            }
            this._createType = type;
            L.DomUtil.addClass(map._mapPane, 'leaflet-clickable');
            this.fire('drawstart', {mode: type});
        }
        this.options.type = type;
    },

    extendDefaultStyles: function (drawOptions) {
        var defaultStyles = L.GmxDrawing.utils.defaultStyles;
        drawOptions = drawOptions || {};
        if (drawOptions.iconUrl) {
            var iconStyle = defaultStyles.markerStyle.options.icon;
            iconStyle.iconUrl = drawOptions.iconUrl;
            delete drawOptions.iconUrl;
            if (drawOptions.iconAnchor) {
                iconStyle.iconAnchor = drawOptions.iconAnchor;
                delete drawOptions.iconAnchor;
            }
            if (drawOptions.iconSize) {
                iconStyle.iconSize = drawOptions.iconSize;
                delete drawOptions.iconSize;
            }
            if (drawOptions.popupAnchor) {
                iconStyle.popupAnchor = drawOptions.popupAnchor;
                delete drawOptions.popupAnchor;
            }
            if (drawOptions.shadowSize) {
                iconStyle.shadowSize = drawOptions.shadowSize;
                delete drawOptions.shadowSize;
            }
        }
        if (drawOptions.lineStyle) {
            L.extend(defaultStyles.lineStyle, drawOptions.lineStyle);
            delete drawOptions.lineStyle;
        }
        if (drawOptions.pointStyle) {
            L.extend(defaultStyles.pointStyle, drawOptions.pointStyle);
            delete drawOptions.pointStyle;
        }
        if (drawOptions.holeStyle) {
            L.extend(defaultStyles.holeStyle, drawOptions.holeStyle);
            delete drawOptions.holeStyle;
        }
        L.extend(defaultStyles, drawOptions);
        return this;
    },

    getFeatures: function () {
        var out = [];
        for (var i = 0, len = this.items.length; i < len; i++) {
            out.push(this.items[i]);
        }
        return out;
    },

    loadState: function (data) {
        //if (data.version !== stateVersion) return;

        var _this = this,
            featureCollection = data.featureCollection;
        L.geoJson(featureCollection, {
            onEachFeature: function (feature, layer) {
                var options = feature.properties,
                    popupOpened = options.popupOpened;
                if (options.type === 'Rectangle') {
                    layer = L.rectangle(layer.getBounds());
                } else if (options.type === 'Point') {
                    options = options.options;
                    var icon = options.icon;
                    if (icon) {
                        delete options.icon;
                        if (icon.iconUrl) { options.icon = L.icon(icon); }
                    }
                    layer = L.marker(layer.getLatLng(), options);
                }
                if (layer.setStyle && options && options.lineStyle) {
                    layer.setStyle(options.lineStyle);
                }
                _this.add(layer, options);
                if (popupOpened) {
                    layer.openPopup();
                }
            }
        });
    },

    saveState: function () {
        var featureGroup = L.featureGroup();
        var points = [];
        for (var i = 0, len = this.items.length; i < len; i++) {
            var it = this.items[i];
            if (it.options.type === 'Point') {
                var geojson = it.toGeoJSON();
                geojson.properties = L.GmxDrawing.utils.getNotDefaults(it.options, L.GmxDrawing.utils.defaultStyles.markerStyle);
                if (!it._map) { geojson.properties.map = false; }
                else if (it._map.hasLayer(it.getPopup())) {
                    geojson.properties.popupOpened = true;
                }
                var res = L.GmxDrawing.utils.getNotDefaults(it._obj.options, L.GmxDrawing.utils.defaultStyles.markerStyle.options);
                if (Object.keys(res).length) { geojson.properties.options = res; }
                res = L.GmxDrawing.utils.getNotDefaults(it._obj.options.icon.options, L.GmxDrawing.utils.defaultStyles.markerStyle.options.icon);
                if (Object.keys(res).length) {
                    if (!geojson.properties.options) { geojson.properties.options = {}; }
                    geojson.properties.options.icon = res;
                }
                points.push(geojson);
            } else {
                featureGroup.addLayer(it);
            }
        }
        var featureCollection = featureGroup.toGeoJSON();
        featureCollection.features = featureCollection.features.concat(points);
        return {
            version: stateVersion,
            featureCollection: featureCollection
        };
    },

    _addItem: function (item) {
        var addFlag = true;
        for (var i = 0, len = this.items.length; i < len; i++) {
            var it = this.items[i];
            if (it === item) {
                addFlag = false;
                break;
            }
        }
        if (addFlag) { this.items.push(item); }
        this.fire('add', {mode: item.mode, object: item});
    },

    _removeItem: function (obj, remove) {
        for (var i = 0, len = this.items.length; i < len; i++) {
            var item = this.items[i];
            if (item === obj) {
                if (remove) {
                    this.items.splice(i, 1);
                    var ev = {type: item.options.type, mode: item.mode, object: item};
                    this.fire('remove', ev);
                    item.fire('remove', ev);
                }
                return item;
            }
        }
        return null;
    },

    clear: function () {
        for (var i = 0, len = this.items.length; i < len; i++) {
            var item = this.items[i];
            if (item && item._map) {
                item._map.removeLayer(item);
            }
            var ev = {type: item.options.type, mode: item.mode, object: item};
            this.fire('remove', ev);
            item.fire('remove', ev);
        }
        this.items = [];
        return this;
    },

    remove: function (obj) {
        var item = this._removeItem(obj, true);
        if (item && item._map) {
            item._map.removeLayer(item);
        }
        return item;
    }
});

L.Map.addInitHook(function () {
    this.gmxDrawing = new L.GmxDrawing(this);
});
})();


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
        this.lines
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


L.GmxDrawing.PointMarkers = L.Polygon.extend({
    options: {
        className: 'leaflet-drawing-points',
        //noClip: true,
        smoothFactor: 0,
        opacity: 1,
        shape: 'circle',
        fill: true,
        fillColor: '#ffffff',
        fillOpacity: 1,
        size: L.Browser.mobile ? 40 : 8,
        weight: 2
    },

    getRing: function () {
		return this._parent;
    },

    getFeature: function () {
		return this.getRing()._parent;
    },

    getPathLatLngs: function () {
        var out = [],
            size = this.options.size,
            points = this._parts[0],
            prev;

        for (var i = 0, len = points.length, p; i < len; i++) {
            p = points[i];
            if (i === 0 || Math.abs(prev.x - p.x) > size || Math.abs(prev.y - p.y) > size) {
                out.push(this._latlngs[i]);
                prev = p;
            }
        }
        return out;
    },

    _getPathPartStr: function (points) {
        var round = L.Path.VML,
            size = this.options.size / 2,
            skipLastPoint = this._parent.mode === 'add' && !L.Browser.mobile ? 1 : 0,
            radius = (this.options.shape === 'circle' ? true : false),
            prev;

        for (var j = 0, len2 = points.length - skipLastPoint, str = '', p; j < len2; j++) {
            p = points[j];
            if (round) { p._round(); }
            if (j === 0 || Math.abs(prev.x - p.x) > this.options.size || Math.abs(prev.y - p.y) > this.options.size) {
                if (radius) {
                    str += 'M' + p.x + ',' + (p.y - size) +
                           ' A' + size + ',' + size + ',0,1,1,' +
                           (p.x - 0.1) + ',' + (p.y - size) + ' ';
                } else {
                    var px = p.x, px1 = px - size, px2 = px + size,
                        py = p.y, py1 = py - size, py2 = py + size;
                    str += 'M' + px1 + ' ' + py1 + 'L' + px2 + ' ' + py1 + 'L' + px2 + ' ' + py2 + 'L' + px1 + ' ' + py2 + 'L' + px1 + ' ' + py1;
                }
                prev = p;
            }
        }
        return str;
    },

    _onMouseClick: function (e) {
        //if (this._map.dragging && this._map.dragging.moved()) { return; }
        this._fireMouseEvent(e);
    },

	_updatePath: function () {
		if (L.GmxDrawing.utils.isOldVersion) {
			if (!this._map) { return; }
			this._clipPoints();
			this.projectLatlngs();
			var pathStr = this.getPathString();

			if (pathStr !== this._pathStr) {
				this._pathStr = pathStr;
				if (this._path.getAttribute('fill-rule') !== 'inherit') {
					this._path.setAttribute('fill-rule', 'inherit');
				}
				this._path.setAttribute('d', this._pathStr || 'M0 0');
			}
		} else {
			this._renderer._setPath(this, this._parts.length ? this._getPathPartStr(this._parts[0]) : '');
		}
	}
});


(function () {
	function GmxDrawingContextMenu(options) {
		this.options = options || {points: [], lines: []};
	}

	GmxDrawingContextMenu.prototype = {
		insertItem: function (obj, index, type) {
			var optKey = type || 'points';
			if (index === undefined) { index = this.options[optKey].length; }
			this.options[optKey].splice(index, 0, obj);
			return this;
		},

		removeItem: function (obj, type) {
			var optKey = type || 'points';
			for (var i = 0, len = this.options[optKey].length; i < len; i++) {
				if (this.options[optKey][i].callback === obj.callback) {
					this.options[optKey].splice(i, 1);
					break;
				}
			}
			return this;
		},

		removeAllItems: function (type) {
			if (!type) {
				this.options = {points: [], lines: []};
			} else if (type === 'lines') {
				this.options.lines = [];
			} else {
				this.options.points = [];
			}
			return this;
		},

		getItems: function () {
			return this.options;
		}
	};
	L.GmxDrawingContextMenu = GmxDrawingContextMenu;
})();


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


